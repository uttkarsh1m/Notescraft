const { Router } = require("express");
const { body } = require("express-validator");
const { register, login } = require("../controllers/auth.controller");
const { validate } = require("../middleware/validate.middleware");
const { authLimiter } = require("../middleware/rateLimit.middleware");

const router = Router();

const emailPasswordRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

router.post("/register", authLimiter, emailPasswordRules, validate, register);
router.post("/login", authLimiter, emailPasswordRules, validate, login);

module.exports = router;
