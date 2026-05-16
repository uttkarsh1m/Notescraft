const { Router } = require("express");
const { body, param } = require("express-validator");
const {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  shareNote,
  restoreNote,
  getTrashedNotes,
  permanentlyDeleteNote,
} = require("../controllers/notes.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { apiLimiter } = require("../middleware/rateLimit.middleware");

const router = Router();

// All notes routes require authentication
router.use(authenticate);
router.use(apiLimiter);

const noteIdParam = param("id").isUUID().withMessage("Invalid note ID");

const noteBodyRules = [
  body("title").notEmpty().trim().withMessage("Title is required"),
  body("content").notEmpty().withMessage("Content is required"),
  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array of strings"),
];

const updateNoteRules = [
  body("title").optional().notEmpty().trim().withMessage("Title cannot be empty"),
  body("content").optional().notEmpty().withMessage("Content cannot be empty"),
  body("isPinned").optional().isBoolean().withMessage("isPinned must be a boolean"),
  body("tags").optional().isArray().withMessage("Tags must be an array of strings"),
];

// Specific routes before parameterized ones
router.get("/trash", getTrashedNotes);

router.get("/", getAllNotes);
router.post("/", noteBodyRules, validate, createNote);

router.get("/:id", [noteIdParam], validate, getNoteById);
router.put("/:id", [noteIdParam, ...updateNoteRules], validate, updateNote);
router.delete("/:id", [noteIdParam], validate, deleteNote);

router.post(
  "/:id/share",
  [
    noteIdParam,
    body("share_with_email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  ],
  validate,
  shareNote
);

router.post("/:id/restore", [noteIdParam], validate, restoreNote);
router.delete("/:id/trash", [noteIdParam], validate, permanentlyDeleteNote);

module.exports = router;
