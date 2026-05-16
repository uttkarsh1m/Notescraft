/**
 * Global error handler — catches anything passed to next(err)
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    return res.status(409).json({ message: "A record with that value already exists" });
  }

  // Prisma record not found
  if (err.code === "P2025") {
    return res.status(404).json({ message: "Record not found" });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({ message });
};

module.exports = { errorHandler };
