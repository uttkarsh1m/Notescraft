#  NotesCraft — Full Stack Notes App

A production-ready full-stack notes application with multi-user collaboration, role-based access control, and advanced features like tagging, search, and automatic data lifecycle management.

---

##  Live Demo

- **Backend API:** https://notescraft-2n7v.onrender.com
- **Frontend:** [notescraft-jet.vercel.app](https://notescraft-jet.vercel.app/login)

---

##  Key Features

- JWT-based Authentication
- Multi-user Notes with Sharing
- Role-based Access Control (Owner vs Shared User)
- Pin Important Notes
- Tag-based Filtering
- Full-text Search
- Intelligent Trash with 30-day Auto Cleanup
- Pagination for Scalable APIs
- Dockerized Full Stack

---

##  Architecture

```
Frontend (Vercel)
       ↓
Backend (Render)
       ↓
PostgreSQL (Render DB)
```

---

##  Design Decisions

- Only owners can edit/delete notes to prevent accidental data loss
- Shared users have read-only access to maintain data integrity
- Soft delete with 30-day retention improves user safety
- Prisma ORM ensures type-safe and scalable database operations
- Pagination and rate limiting improve performance and reliability

---

##  Project Structure

```
notes-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # DB models: User, Note, Tag, NoteShare
│   │   └── migrations/          # Auto-generated SQL migrations
│   ├── src/
│   │   ├── server.js            # Entry point + cleanup job startup
│   │   ├── app.js               # Express setup, middleware, routes
│   │   ├── lib/
│   │   │   ├── prisma.js        # Singleton Prisma client
│   │   │   ├── jwt.js           # sign / verify helpers
│   │   │   └── cleanup.js       # 30-day trash auto-purge job
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js       # JWT Bearer validation
│   │   │   ├── validate.middleware.js   # express-validator error handler
│   │   │   ├── rateLimit.middleware.js  # Auth + API rate limiters
│   │   │   ├── error.middleware.js      # Global error handler
│   │   │   └── notFound.middleware.js   # 404 fallback
│   │   ├── controllers/
│   │   │   ├── auth.controller.js       # register, login
│   │   │   ├── notes.controller.js      # CRUD, share, pin, trash, restore, permanent delete
│   │   │   ├── search.controller.js     # Full-text search
│   │   │   └── about.controller.js      # Author info
│   │   └── routes/
│   │       ├── auth.routes.js
│   │       ├── notes.routes.js
│   │       ├── search.routes.js
│   │       ├── about.routes.js
│   │       └── openapi.routes.js
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── lib/api.js           # Axios instance with JWT interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── NotesPage.jsx    # Notes grid with search + pagination
│   │   │   └── TrashPage.jsx    # Trash with days-remaining countdown
│   │   └── components/
│   │       ├── Layout.jsx
│   │       ├── NoteCard.jsx
│   │       ├── NoteModal.jsx    # Create / edit with tag support
│   │       └── ShareModal.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

---

## Local Development(macOS)

### PostgreSQL Setup

```bash
brew install postgresql@16
brew services start postgresql@16
psql postgres -c "CREATE USER notesuser WITH PASSWORD 'notespassword';"
psql postgres -c "CREATE DATABASE notesdb OWNER notesuser;"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE notesdb TO notesuser;"
psql postgres -c "ALTER USER notesuser CREATEDB;"
```

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run dev
```

`.env` values:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://notesuser:notespassword@localhost:5432/notesdb` | Postgres connection string |
| `JWT_SECRET` | *(strong random string)* | Signs JWT tokens |
| `JWT_EXPIRES_IN` | `24h` | Token lifetime |
| `PORT` | `3000` | Server port |
| `AUTHOR_NAME` | `Your Name` | Returned by `GET /about` |
| `AUTHOR_EMAIL` | `your@email.com` | Returned by `GET /about` |

API is now live at **http://localhost:3000**

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend is now live at **http://localhost:5173**

> To point the frontend at a different API URL, create `frontend/.env.local` with:
> `VITE_API_URL=http://localhost:3000`

---

##  Quick Start with Docker

Runs the full stack — PostgreSQL + backend + frontend — with one command:

```bash
cp backend/.env.example backend/.env
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| PostgreSQL | localhost:5432 |

---

##  Intelligent Trash & Auto-Purge

| Action | Result |
|---|---|
| `DELETE /notes/:id` | Note moves to trash (`isDeleted: true`, `deletedAt` set) |
| `GET /notes/trash` | Lists trashed notes with `daysRemaining` countdown |
| `POST /notes/:id/restore` | Note restored, removed from trash |
| `DELETE /notes/:id/trash` | Note permanently deleted immediately |
| Auto-purge (every 24h) | Any note with `deletedAt` older than **30 days** is permanently deleted |

The cleanup job runs once on server startup and then every 24 hours. A log message is printed whenever notes are purged.

---

## 🚀 Extended Capabilities

| Capability | Details |
|---|---|
| **Note Tags** | Attach multiple labels; filter via `GET /notes?tag=name` |
| **Note Pinning** | Pinned notes sort to the top; toggle via `PUT /notes/:id` with `isPinned: true` |
| **Intelligent Trash** | 30-day retention with countdown; manual permanent delete; auto-purge every 24h |
| **Pagination** | `?page=1&limit=20` on `GET /notes` with full pagination metadata |
| **Full-text Search** | `GET /search?q=keyword` across owned and shared notes |
| **Rate Limiting** | Auth: 20 req / 15 min. API: 100 req / min |
| **Dockerized** | Full stack via `docker-compose up --build` |

---

## API Endpoints — Quick Reference

All protected routes require: `Authorization: Bearer <access_token>`

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/register` | — | Register a new user |
| POST | `/login` | — | Login, returns JWT |
| GET | `/notes` | ✓ | List all notes (paginated, filterable) |
| POST | `/notes` | ✓ | Create a note |
| GET | `/notes/trash` | ✓ | List trashed notes with days remaining |
| GET | `/notes/:id` | ✓ | Get a specific note |
| PUT | `/notes/:id` | ✓ | Update a note |
| DELETE | `/notes/:id` | ✓ | Soft-delete (moves to trash) |
| POST | `/notes/:id/share` | ✓ | Share note with another user |
| POST | `/notes/:id/restore` | ✓ | Restore from trash |
| DELETE | `/notes/:id/trash` | ✓ | Permanently delete a trashed note |
| GET | `/search?q=` | ✓ | Full-text search across notes |
| GET | `/about` | — | Author info and feature list |
| GET | `/openapi.json` | — | OpenAPI 3.0.3 specification |

---

##  API Reference

### Auth

#### `POST /register`

```json
// Request
{ "email": "user@example.com", "password": "secret123" }

// 201 Created
{ "message": "User registered successfully" }

// 409 Conflict — email already taken
{ "message": "Email already registered" }

// 400 Bad Request — validation failure
{ "message": "Validation failed", "errors": [...] }
```

#### `POST /login`

```json
// Request
{ "email": "user@example.com", "password": "secret123" }

// 200 OK
{ "access_token": "<jwt>" }

// 401 Unauthorized
{ "message": "Invalid email or password" }
```

---

### Notes

#### `GET /notes` — list all notes (paginated)

Includes notes you own **and** notes shared with you. Pinned notes always appear first.

Query params:

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number |
| `limit` | integer | `20` | Results per page (max 100) |
| `tag` | string | — | Filter by tag name |
| `pinned` | boolean | — | `true` to show only pinned notes |

```json
// 200 OK
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "isPinned": false,
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "owner": { "id": "uuid", "email": "string" },
      "tags": [{ "id": "uuid", "name": "string" }]
    }
  ],
  "pagination": { "total": 5, "page": 1, "limit": 20, "totalPages": 1 }
}
```

#### `POST /notes` — create a note

```json
// Request
{ "title": "string", "content": "string", "tags": ["work", "ideas"] }

// 201 Created — returns the full note object (same shape as above)
```

#### `GET /notes/trash` — list trashed notes

Notes are **permanently deleted after 30 days** by an automatic background job that runs every 24 hours on server startup. Each note includes a countdown.

```json
// 200 OK
[
  {
    "id": "uuid",
    "title": "string",
    "content": "string",
    "deletedAt": "2026-04-16T10:00:00.000Z",
    "expiresAt": "2026-05-16T10:00:00.000Z",
    "daysRemaining": 23
  }
]
```

`daysRemaining` reaches `0` on the expiry day — the next cleanup run will permanently erase it.

#### `GET /notes/:id` — get a specific note

Returns the note if you own it or it has been shared with you. Returns `404` otherwise.

#### `PUT /notes/:id` — update a note (owner only)

All fields are optional — only send what you want to change.

```json
// Request
{ "title": "string", "content": "string", "isPinned": true, "tags": ["updated"] }

// 200 OK — returns the updated note
```

> Providing `tags` **replaces** the existing tag list entirely.

#### `DELETE /notes/:id` — soft-delete a note (owner only)

Moves the note to trash. Can be restored within 30 days.

```
204 No Content
```

#### `POST /notes/:id/share` — share with another user

Only the owner can share. The recipient can then read the note via `GET /notes/:id`.

```json
// Request
{ "share_with_email": "friend@example.com" }

// 200 OK
{ "message": "Note shared successfully" }

// 400 Bad Request — sharing with yourself
{ "message": "You cannot share a note with yourself" }

// 404 Not Found — recipient email not registered
{ "message": "User not found" }
```

#### `POST /notes/:id/restore` — restore from trash (owner only)

```
200 OK — returns the restored note object
```

#### `DELETE /notes/:id/trash` — permanently delete a trashed note (owner only)

Immediately and **irreversibly** removes the note from the database. Cannot be undone.

```
204 No Content
```

---

### Search

#### `GET /search?q=keyword`

Case-insensitive search across title and content of all notes you own or have access to.

```json
// 200 OK
{
  "query": "keyword",
  "total": 2,
  "data": [ /* array of note objects */ ]
}

// 400 Bad Request — missing q param
{ "message": "Query parameter 'q' is required" }
```

---

### Meta

#### `GET /about`

```json
{
  "name": "Your Name",
  "email": "your@email.com",
  "my features": {
    "Note Tags": "Users can attach multiple tags to notes and filter notes by tag. Chosen to improve note organization.",
    "Note Pinning": "Users can pin important notes so they always appear at the top. Mirrors real apps like Google Keep.",
    "Soft Delete & Trash": "Deleted notes go to a trash bin and can be restored within 30 days. Prevents accidental data loss.",
    "Pagination": "GET /notes supports page and limit query params. Keeps the API performant as note count grows.",
    "Full-text Search": "GET /search?q=keyword searches across note titles and content."
  }
}
```

#### `GET /openapi.json`

Returns the full OpenAPI 3.0.3 specification for all endpoints.

---

##  Deploy to Render

1. Create a **PostgreSQL** database on Render — copy the external connection string
2. Create a **Web Service** pointing to the `backend/` folder
3. Set environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | *(from Render PostgreSQL dashboard)* |
| `JWT_SECRET` | *(long random string — keep secret)* |
| `JWT_EXPIRES_IN` | `24h` |
| `AUTHOR_NAME` | Your name |
| `AUTHOR_EMAIL` | Your email |

4. **Build command:**
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy
   ```
5. **Start command:**
   ```bash
   node src/server.js
   ```


---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Auth | JWT (`jsonwebtoken` + `bcryptjs`) |
| Validation | `express-validator` |
| Security | `helmet`, `cors`, `express-rate-limit` |
| Frontend | React 18 + Vite 5 + TailwindCSS 3 |
| Containerisation | Docker + docker-compose |
