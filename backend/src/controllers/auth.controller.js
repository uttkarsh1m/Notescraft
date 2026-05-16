const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { signToken } = require("../lib/jwt");

/**
 * POST /register
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /login
 * Authenticate user and return JWT
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const access_token = signToken(user.id);

    return res.status(200).json({ access_token });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
