const prisma = require("../lib/prisma");

/**
 * GET /search?q=keyword
 * Full-text search across notes the user owns or has access to
 */
const searchNotes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const q = (req.query.q || "").trim();

    if (!q) {
      return res.status(400).json({ message: "Query parameter 'q' is required" });
    }

    const notes = await prisma.note.findMany({
      where: {
        isDeleted: false,
        OR: [
          { ownerId: userId },
          { shares: { some: { sharedWith: userId } } },
        ],
        AND: [
          {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { content: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        content: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        tags: { select: { tag: { select: { id: true, name: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return res.status(200).json({
      query: q,
      total: notes.length,
      data: notes.map((n) => ({ ...n, tags: n.tags.map((t) => t.tag) })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { searchNotes };
