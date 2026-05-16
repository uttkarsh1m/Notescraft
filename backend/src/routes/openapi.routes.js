const { Router } = require("express");

const router = Router();

router.get("/", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const spec = {
    openapi: "3.0.3",
    info: {
      title: "Notes App API",
      version: "1.0.0",
      description: "A multi-user notes service with sharing, tagging, and search.",
    },
    servers: [{ url: baseUrl }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Note: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            content: { type: "string" },
            isPinned: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            tags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                },
              },
            },
          },
        },
        Error: {
          type: "object",
          properties: { message: { type: "string" } },
        },
      },
    },
    paths: {
      "/register": {
        post: {
          summary: "Register a new user",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "User registered successfully" },
            400: { description: "Validation error" },
            409: { description: "Email already registered" },
          },
        },
      },
      "/login": {
        post: {
          summary: "Login and receive a JWT",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "JWT access token",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { access_token: { type: "string" } },
                  },
                },
              },
            },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/notes": {
        get: {
          summary: "Get all notes for the authenticated user",
          tags: ["Notes"],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "tag", in: "query", schema: { type: "string" } },
            { name: "pinned", in: "query", schema: { type: "boolean" } },
          ],
          responses: {
            200: { description: "List of notes with pagination" },
            401: { description: "Unauthorized" },
          },
        },
        post: {
          summary: "Create a new note",
          tags: ["Notes"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "content"],
                  properties: {
                    title: { type: "string" },
                    content: { type: "string" },
                    tags: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Note created" },
            400: { description: "Validation error" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/notes/{id}": {
        get: {
          summary: "Get a specific note by ID",
          tags: ["Notes"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: { description: "Note data" },
            404: { description: "Note not found" },
          },
        },
        put: {
          summary: "Update a note",
          tags: ["Notes"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    content: { type: "string" },
                    isPinned: { type: "boolean" },
                    tags: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Updated note" },
            404: { description: "Note not found" },
          },
        },
        delete: {
          summary: "Delete a note (soft delete)",
          tags: ["Notes"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            204: { description: "Note deleted" },
            404: { description: "Note not found" },
          },
        },
      },
      "/notes/{id}/share": {
        post: {
          summary: "Share a note with another user",
          tags: ["Notes"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["share_with_email"],
                  properties: { share_with_email: { type: "string", format: "email" } },
                },
              },
            },
          },
          responses: {
            200: { description: "Note shared successfully" },
            404: { description: "Note or user not found" },
          },
        },
      },
      "/notes/{id}/restore": {
        post: {
          summary: "Restore a soft-deleted note",
          tags: ["Notes"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: { description: "Note restored" },
            404: { description: "Deleted note not found" },
          },
        },
      },
      "/notes/{id}/trash": {
        delete: {
          summary: "Permanently delete a trashed note (cannot be undone)",
          tags: ["Notes"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            204: { description: "Note permanently deleted" },
            404: { description: "Trashed note not found" },
          },
        },
      },
      "/notes/trash": {
        get: {
          summary: "Get all soft-deleted notes (with days remaining before permanent deletion)",
          tags: ["Notes"],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "List of trashed notes. Each note includes deletedAt, expiresAt, and daysRemaining. Notes are permanently deleted after 30 days.",
            },
          },
        },
      },
      "/search": {
        get: {
          summary: "Full-text search across notes",
          tags: ["Search"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }],
          responses: {
            200: { description: "Search results" },
            400: { description: "Missing query" },
          },
        },
      },
      "/about": {
        get: {
          summary: "About the author and features",
          tags: ["Meta"],
          responses: {
            200: { description: "Author info and feature list" },
          },
        },
      },
      "/openapi.json": {
        get: {
          summary: "OpenAPI specification",
          tags: ["Meta"],
          responses: {
            200: { description: "This document" },
          },
        },
      },
    },
  };

  return res.status(200).json(spec);
});

module.exports = router;
