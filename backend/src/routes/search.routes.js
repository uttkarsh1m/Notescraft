const { Router } = require("express");
const { searchNotes } = require("../controllers/search.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { apiLimiter } = require("../middleware/rateLimit.middleware");

const router = Router();

router.get("/", authenticate, apiLimiter, searchNotes);

module.exports = router;
