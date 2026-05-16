const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

if (!SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

/**
 * Sign a JWT token for a given user id
 * @param {string} userId
 * @returns {string} signed JWT
 */
const signToken = (userId) => {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: EXPIRES_IN });
};

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};

module.exports = { signToken, verifyToken };
