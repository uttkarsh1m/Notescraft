const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const notesRoutes = require("./routes/notes.routes");
const searchRoutes = require("./routes/search.routes");
const aboutRoutes = require("./routes/about.routes");
const openapiRoutes = require("./routes/openapi.routes");
const { errorHandler } = require("./middleware/error.middleware");
const { notFound } = require("./middleware/notFound.middleware");

const app = express();

// Security & utility middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/", authRoutes);
app.use("/notes", notesRoutes);
app.use("/search", searchRoutes);
app.use("/about", aboutRoutes);
app.use("/openapi.json", openapiRoutes);

// 404 & error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
