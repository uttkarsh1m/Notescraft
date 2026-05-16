const prisma = require("../lib/prisma");
const { TRASH_RETENTION_DAYS } = require("../lib/cleanup");

// ─── Helpers ────────────────────────────────────────────────────────────────

const NOTE_SELECT = {
  id: true,
  title: true,
  content: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, email: true } },
  tags: { select: { tag: { select: { id: true, name: true } } } },
};

const formatNote = (note) => ({
  ...note,
  tags: note.tags?.map((t) => t.tag) ?? [],
});

/**
 * Check if the requesting user owns the note OR has it shared with them.
 * Returns the note or null.
 */
const findAccessibleNote = async (noteId, userId) => {
  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      isDeleted: false,
      OR: [
        { ownerId: userId },
        { shares: { some: { sharedWith: userId } } },
      ],
    },
    select: NOTE_SELECT,
  });
  return note;
};

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * GET /notes
 * Get all notes for the authenticated user (owned + shared), with pagination
 */
const getAllNotes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const tag = req.query.tag;
    const pinned = req.query.pinned;

    const where = {
      isDeleted: false,
      OR: [
        { ownerId: userId },
        { shares: { some: { sharedWith: userId } } },
      ],
      ...(tag && { tags: { some: { tag: { name: tag } } } }),
      ...(pinned !== undefined && { isPinned: pinned === "true" }),
    };

    const [total, notes] = await Promise.all([
      prisma.note.count({ where }),
      prisma.note.findMany({
        where,
        select: NOTE_SELECT,
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    return res.status(200).json({
      data: notes.map(formatNote),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /notes/:id
 * Get a specific note by ID (owner or shared user)
 */
const getNoteById = async (req, res, next) => {
  try {
    const note = await findAccessibleNote(req.params.id, req.user.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    return res.status(200).json(formatNote(note));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /notes
 * Create a new note
 */
const createNote = async (req, res, next) => {
  try {
    const { title, content, tags = [] } = req.body;
    const userId = req.user.id;

    const note = await prisma.note.create({
      data: {
        title,
        content,
        ownerId: userId,
        tags: {
          create: await buildTagConnections(tags),
        },
      },
      select: NOTE_SELECT,
    });

    return res.status(201).json(formatNote(note));
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /notes/:id
 * Update a note (owner only)
 */
const updateNote = async (req, res, next) => {
  try {
    const { title, content, isPinned, tags } = req.body;
    const userId = req.user.id;
    const noteId = req.params.id;

    const existing = await prisma.note.findFirst({
      where: { id: noteId, ownerId: userId, isDeleted: false },
    });
    if (!existing) {
      return res.status(404).json({ message: "Note not found" });
    }

    const updateData = {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(isPinned !== undefined && { isPinned }),
    };

    // Replace tags if provided
    if (tags !== undefined) {
      await prisma.noteTag.deleteMany({ where: { noteId } });
      updateData.tags = { create: await buildTagConnections(tags) };
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: updateData,
      select: NOTE_SELECT,
    });

    return res.status(200).json(formatNote(note));
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /notes/:id
 * Soft-delete a note (owner only)
 */
const deleteNote = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const existing = await prisma.note.findFirst({
      where: { id: noteId, ownerId: userId, isDeleted: false },
    });
    if (!existing) {
      return res.status(404).json({ message: "Note not found" });
    }

    await prisma.note.update({
      where: { id: noteId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * POST /notes/:id/share
 * Share a note with another user by email
 */
const shareNote = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;
    const { share_with_email } = req.body;

    // Only the owner can share
    const note = await prisma.note.findFirst({
      where: { id: noteId, ownerId: userId, isDeleted: false },
    });
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Can't share with yourself
    if (share_with_email === req.user.email) {
      return res.status(400).json({ message: "You cannot share a note with yourself" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: share_with_email },
    });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Upsert to avoid duplicate share errors
    await prisma.noteShare.upsert({
      where: { noteId_sharedWith: { noteId, sharedWith: targetUser.id } },
      update: {},
      create: { noteId, sharedWith: targetUser.id },
    });

    return res.status(200).json({ message: "Note shared successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /notes/:id/restore
 * Restore a soft-deleted note (owner only) — bonus feature
 */
const restoreNote = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const existing = await prisma.note.findFirst({
      where: { id: noteId, ownerId: userId, isDeleted: true },
    });
    if (!existing) {
      return res.status(404).json({ message: "Deleted note not found" });
    }

    const note = await prisma.note.update({
      where: { id: noteId },
      data: { isDeleted: false, deletedAt: null },
      select: NOTE_SELECT,
    });

    return res.status(200).json(formatNote(note));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /notes/trash
 * Get all soft-deleted notes for the authenticated user — bonus feature
 */
const getTrashedNotes = async (req, res, next) => {
  try {
    const notes = await prisma.note.findMany({
      where: { ownerId: req.user.id, isDeleted: true },
      select: { ...NOTE_SELECT, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    });

    const now = new Date();

    return res.status(200).json(
      notes.map((note) => {
        const deletedAt = new Date(note.deletedAt);
        const expiresAt = new Date(deletedAt);
        expiresAt.setDate(expiresAt.getDate() + TRASH_RETENTION_DAYS);
        const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));

        return {
          ...formatNote(note),
          deletedAt: note.deletedAt,
          expiresAt,
          daysRemaining,
        };
      })
    );
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /notes/:id/trash
 * Permanently delete a trashed note (owner only) — cannot be undone
 */
const permanentlyDeleteNote = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const noteId = req.params.id;

    const existing = await prisma.note.findFirst({
      where: { id: noteId, ownerId: userId, isDeleted: true },
    });
    if (!existing) {
      return res.status(404).json({ message: "Trashed note not found" });
    }

    await prisma.note.delete({ where: { id: noteId } });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// ─── Tag helper ─────────────────────────────────────────────────────────────

/**
 * Upsert tags and return NoteTag create payload
 */
const buildTagConnections = async (tagNames) => {
  if (!tagNames || tagNames.length === 0) return [];

  const connections = await Promise.all(
    tagNames.map(async (name) => {
      const tag = await prisma.tag.upsert({
        where: { name: name.toLowerCase().trim() },
        update: {},
        create: { name: name.toLowerCase().trim() },
      });
      return { tagId: tag.id };
    })
  );
  return connections;
};

module.exports = {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  shareNote,
  restoreNote,
  getTrashedNotes,
  permanentlyDeleteNote,
};
