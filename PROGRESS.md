# ClassmateAI — Project Progress

## Overview

ClassmateAI is a full-stack study tool that takes a user's notes and uses AI to
generate flashcards, multiple-choice quizzes, summaries, and study guides from them.
Users can then study the generated content and track their progress over time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TailwindCSS v4 |
| Backend | FastAPI + SQLAlchemy 2.0 |
| Database | PostgreSQL 17 (local Docker / Supabase in prod) |
| Migrations | Alembic |
| Auth | bcrypt (password hashing) + python-jose (JWT) |
| AI | Claude API (Anthropic) — not yet integrated |
| HTTP client (FE) | Axios |
| Routing (FE) | React Router v7 |

---

## Repository Structure (current state)

```
classmateai/
├── client/                        # React frontend (Vite scaffold only)
│   ├── src/
│   │   ├── components/            # empty
│   │   ├── hooks/                 # empty
│   │   ├── pages/                 # empty
│   │   ├── services/              # empty
│   │   ├── utils/                 # empty
│   │   ├── App.jsx                # default Vite placeholder
│   │   └── main.jsx
│   └── package.json
│
├── server/                        # FastAPI backend
│   ├── alembic/
│   │   ├── env.py                 # wired to load .env + Base.metadata
│   │   └── versions/
│   │       └── 1613ca85eff1_initial_schema.py   # applied ✓
│   ├── app/
│   │   └── main.py                # FastAPI app + router registration
│   ├── db/
│   │   └── __init__.py            # engine, SessionLocal, get_db()
│   ├── models/
│   │   ├── base.py                # Base (DeclarativeBase) + TimestampMixin
│   │   ├── user.py
│   │   ├── note.py
│   │   ├── study_set.py
│   │   ├── flashcard.py
│   │   ├── quiz_question.py
│   │   ├── summary.py
│   │   ├── study_guide.py
│   │   ├── quiz_attempt.py
│   │   └── flashcard_review.py
│   ├── routes/
│   │   └── auth.py                # POST /auth/register, POST /auth/login
│   ├── schemas/
│   │   └── auth.py                # Pydantic request/response models
│   ├── utils/
│   │   ├── auth.py                # bcrypt + JWT helpers
│   │   └── deps.py                # get_current_user FastAPI dependency
│   ├── .env                       # gitignored — DATABASE_URL, SECRET_KEY
│   ├── .env.example               # template
│   ├── alembic.ini
│   └── requirements.txt
│
└── docker/
    └── compose.yml                # PostgreSQL 17 + pgAdmin 4
```

---

## Phase 1 — Database Layer ✅ COMPLETE

### What was built

A complete SQLAlchemy 2.0 model layer and Alembic migration pipeline.

### Database schema (9 tables)

| Table | Purpose | Key design notes |
|---|---|---|
| `users` | Accounts | `email` unique, `is_active` bool |
| `notes` | User-uploaded notes | FK → users CASCADE |
| `study_sets` | Groups one generation run | FK → notes CASCADE, optional `label` |
| `flashcards` | Front/back card pairs | FK → study_sets CASCADE, `display_order` INT |
| `quiz_questions` | MCQ questions | FK → study_sets CASCADE, `options` JSONB, `correct_index` SMALLINT |
| `summaries` | AI summary text | FK → study_sets CASCADE, UNIQUE on `study_set_id` |
| `study_guides` | AI study guide text | FK → study_sets CASCADE, UNIQUE on `study_set_id` |
| `quiz_attempts` | Per-answer attempt records | FK → users + quiz_questions, immutable (no `updated_at`) |
| `flashcard_reviews` | Spaced-rep review records | FK → users + flashcards, `confidence` SMALLINT 1–4, immutable |

All tables use:

- UUID primary keys with `gen_random_uuid()` as the server-side default
- `TIMESTAMPTZ` timestamps via `TimestampMixin` (`created_at`, `updated_at`)
- Exception: `quiz_attempts` and `flashcard_reviews` are immutable append-only tables so they only have a single `_at` timestamp column

### Key design decisions

- **`study_sets` as the grouping unit** — every generation run creates one `StudySet`
  that owns all output (flashcards, quiz questions, summary, study guide). This makes
  batch display, delete, and regenerate trivial.
- **`options` as JSONB** — allows variable MCQ option counts without schema changes.
- **confidence 1–4** — matches SM-2 spaced-repetition convention (Again / Hard / Good / Easy),
  ready for a scheduling algorithm later.
- **UNIQUE on `summaries.study_set_id` and `study_guides.study_set_id`** — enforces one
  summary and one study guide per study set at the database level.

### Files created

```
server/models/base.py
server/models/user.py
server/models/note.py
server/models/study_set.py
server/models/flashcard.py
server/models/quiz_question.py
server/models/summary.py
server/models/study_guide.py
server/models/quiz_attempt.py
server/models/flashcard_review.py
server/models/__init__.py
server/alembic/env.py            (replaced generated version)
server/alembic/versions/1613ca85eff1_initial_schema.py
server/alembic.ini
```

### Files modified

```
server/requirements.txt          added: alembic, bcrypt, python-jose, email-validator
server/db/__init__.py            removed declarative_base(), imports Base from models.base
server/app/main.py               added: import models
server/.env                      created from .env.example
server/.env.example              added SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES
```

### Gotchas encountered and resolved

1. **`MappedColumn` vs `Mapped[T]`** — SQLAlchemy 2.0's annotated declarative form requires
   `Mapped[datetime]` type annotations on mixin columns, not bare `MappedColumn`. Fixed by
   updating `TimestampMixin` and all model files to use `Mapped[T]`.

2. **`server_default="gen_random_uuid()"` quoted as a string literal** — passing a plain
   string to `server_default` causes SQLAlchemy to emit `DEFAULT 'gen_random_uuid()'`
   (with quotes), which PostgreSQL rejects. Fixed by using `server_default=text("gen_random_uuid()")`.

3. **Supabase unreachable on Full Sail network** — the school network blocks
   `db.xxxx.supabase.co:5432`. Use a mobile hotspot or home network to run
   `py -m alembic upgrade head` against Supabase.

### How to run migrations

```bash
# Apply to local Docker DB
cd server && py -m alembic upgrade head

# Roll back one step
py -m alembic downgrade -1

# Check DB is in sync with models
py -m alembic check

# Generate a new migration after changing models
py -m alembic revision --autogenerate -m "description"
```

---

## Phase 2 — Auth Layer ✅ COMPLETE

### What was built

JWT-based authentication with register and login endpoints, password hashing, and a
reusable `get_current_user` FastAPI dependency for protecting routes.

### Endpoints

| Method | Path | Auth required | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Create account, returns JWT |
| `POST` | `/auth/login` | No | Verify credentials, returns JWT |

Both endpoints return the same `AuthResponse` shape:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Full Name",
    "is_active": true,
    "created_at": "2026-03-03T17:01:25Z"
  },
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

Error responses:

- `409 Conflict` — email already registered (register)
- `401 Unauthorized` — wrong email or password (login)
- `400 Bad Request` — account is inactive (login)

### How JWT auth works

1. On login/register the server signs a JWT containing `{"sub": "<user_uuid>", "exp": <timestamp>}`.
2. The frontend stores this token and sends it on every protected request as:
   `Authorization: Bearer <token>`
3. Any route that adds `current_user: User = Depends(get_current_user)` automatically
   validates the token, looks up the user, and injects the `User` ORM object.

### Files created

```
server/routes/auth.py
server/schemas/auth.py
server/utils/auth.py
server/utils/deps.py
```

### Key design decisions

- **`bcrypt` directly instead of `passlib`** — `passlib 1.7.4` (last release 2020, unmaintained)
  is incompatible with `bcrypt >= 5.0.0` due to a breaking change in bcrypt's internals.
  Using `bcrypt` directly is simpler and future-proof. Pinned to `>=4.0.0,<5.0.0` to stay
  on a stable version.
- **JSON body for login** — both endpoints accept JSON rather than OAuth2 form data.
  This is cleaner for a React frontend. The `OAuth2PasswordBearer` dependency is still
  used purely for extracting the `Bearer` token from the `Authorization` header.
- **Token expiry** — configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` in `.env`, defaults to 30.

### How to protect a route

```python
from utils.deps import get_current_user
from models.user import User

@router.get("/some-protected-route")
def my_route(current_user: User = Depends(get_current_user)):
    # current_user is the authenticated User ORM object
    ...
```

---

## Phase 3 — Notes API ✅ COMPLETE

### What needs to be built

Full CRUD for notes. A note is the raw input that the user provides before AI generation.

### Planned endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/notes` | List all notes for the current user |
| `POST` | `/notes` | Create a new note |
| `GET` | `/notes/{note_id}` | Get a single note |
| `PATCH` | `/notes/{note_id}` | Update title or content |
| `DELETE` | `/notes/{note_id}` | Delete note (cascades to study sets and all generated content) |

All endpoints require authentication (`Depends(get_current_user)`).
Users can only access their own notes — every query filters by `user_id = current_user.id`.

### Planned files

```
server/schemas/note.py           NoteCreate, NoteUpdate, NoteResponse
server/routes/notes.py           the 5 endpoints above
```

And `app/main.py` gets: `app.include_router(notes_router)`.

### Implementation approach

Straightforward SQLAlchemy CRUD. The only non-obvious piece is ownership enforcement —
every `GET`/`PATCH`/`DELETE` by ID will do:

```python
note = db.get(Note, note_id)
if not note or note.user_id != current_user.id:
    raise HTTPException(404)   # 404 not 403 — don't leak existence
```

Returning 404 instead of 403 for unauthorized access is a security best practice (prevents
an attacker from enumerating which IDs exist).

---

## Phase 4 — AI Generation ✅ COMPLETE

### What needs to be built

The core feature. A single endpoint that takes a `note_id`, sends the note content to
Claude, and writes back a complete `StudySet` with all its children in one database
transaction.

### Planned endpoint

| Method | Path | Description |
|---|---|---|
| `POST` | `/notes/{note_id}/generate` | Generate a full study set from a note |

Response: the created `StudySet` with nested flashcards, quiz questions, summary, and
study guide.

### How it will work

1. Look up the note (verify ownership).
2. Build a prompt that instructs Claude to return structured JSON containing:
   - An array of flashcard objects `{front, back}`
   - An array of quiz question objects `{question, options: [...], correct_index, explanation}`
   - A summary string
   - A study guide string
3. Call the Claude API using structured output / tool use so the response is guaranteed
   to be valid JSON matching our expected shape.
4. Write everything to the database inside a single transaction:
   - Insert one `StudySet` row
   - Bulk-insert `Flashcard` rows with `display_order` = index
   - Bulk-insert `QuizQuestion` rows with `display_order` = index
   - Insert one `Summary` row
   - Insert one `StudyGuide` row
5. Return the assembled study set.

### Planned files

```
server/services/ai.py            Claude API call + prompt construction + response parsing
server/schemas/study_set.py      StudySetResponse (nested flashcards, questions, etc.)
server/routes/generate.py        POST /notes/{note_id}/generate
```

### Dependencies to add

```
anthropic>=0.25.0                official Anthropic Python SDK
```

And `ANTHROPIC_API_KEY` added to `.env` / `.env.example`.

### Key decisions to make at implementation time

- **How many flashcards / questions to generate** — likely configurable per request with a
  sensible default (e.g. 10 flashcards, 5 MCQ questions).
- **Error handling for malformed AI output** — the generation endpoint should return a
  clear error if Claude returns something unexpected, rather than a 500.
- **Regeneration** — calling `POST /notes/{note_id}/generate` a second time will create a
  second `StudySet` for the same note (the schema supports multiple study sets per note).
  The frontend can decide which one to display.

---

## Phase 5 — Study Content Routes ✅ COMPLETE

### What needs to be built

Read routes to fetch generated content, plus write routes for recording progress.

### Planned endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/notes/{note_id}/study-sets` | List all study sets for a note |
| `GET` | `/study-sets/{study_set_id}` | Get a full study set (all content) |
| `GET` | `/study-sets/{study_set_id}/flashcards` | Get flashcards only |
| `GET` | `/study-sets/{study_set_id}/quiz` | Get quiz questions (without revealing correct answers in response) |
| `GET` | `/study-sets/{study_set_id}/summary` | Get summary |
| `GET` | `/study-sets/{study_set_id}/study-guide` | Get study guide |
| `POST` | `/quiz/{quiz_question_id}/attempt` | Submit an answer, record `QuizAttempt` |
| `POST` | `/flashcards/{flashcard_id}/review` | Record a `FlashcardReview` (confidence 1–4) |

### Notable design notes

- **Quiz responses omit `correct_index`** — the GET quiz endpoint returns questions and
  options but does not include the correct answer. The correct answer is only revealed in
  the response to `POST /quiz/{id}/attempt`, preventing cheating by reading the API.
- **`FlashcardReview` confidence values**: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy.
  These map directly to SM-2 spaced-repetition grades and leave the door open for
  scheduling logic in a future phase.

---

## Phase 6 — Frontend 🔲 NEXT

### What needs to be built

A React SPA consuming all the backend APIs. The current `client/` directory is a default
Vite scaffold with empty placeholder directories and no application code.

### Planned pages

| Route | Page | Description |
|---|---|---|
| `/login` | LoginPage | Email + password form, stores JWT in localStorage |
| `/register` | RegisterPage | Name + email + password form |
| `/` | DashboardPage | Lists all the user's notes |
| `/notes/new` | NewNotePage | Title + content textarea, submit creates a note |
| `/notes/:id` | NotePage | Shows note, "Generate" button, lists study sets |
| `/study-sets/:id` | StudySetPage | Tabbed view: Flashcards / Quiz / Summary / Study Guide |

### Planned component structure

```
client/src/
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   ├── NotePage.jsx
│   └── StudySetPage.jsx
├── components/
│   ├── Flashcard.jsx             flip-card animation
│   ├── QuizQuestion.jsx          MCQ with answer reveal
│   ├── NoteCard.jsx              note preview on dashboard
│   └── ProtectedRoute.jsx        redirects to /login if no token
├── services/
│   └── api.js                    Axios instance + all API call functions
├── hooks/
│   ├── useAuth.js                login/register/logout + token state
│   └── useNotes.js               fetch + create + delete notes
└── utils/
    └── auth.js                   localStorage token helpers
```

---

### Frontend Additions - 3/4/26

# 1. Global Styling and Design System

- A Mint color scale (`--mint-50` → `--mint-950`) used for branding and UI accents
- Neutral colors (`--black`, `--white`)
- Supporting status colors:
  - Success
  - Warning
  - Error
  - Info
- UI variables for consistent styling:
  - `--bg`
  - `--surface`
  - `--border`
  - `--brand`
  - `--btn-brand`
  - `--btn-brand-hover`
  - `--text`
  - `--text-emphasis`

Typography was also defined globally:

| Element | Font | Size | Weight |
|------|------|------|------|
| H1 | Poppins | 48px | 700 |
| H2 | Poppins | 36px | 700 |
| H3 | Poppins | 28px | 600 |
| Body | Inter | 16px | normal |
| Caption | Inter | 12px | normal |

# 2. Asset Organization (Icons)

An assets directory was created to organize static resources such as icons.

### Structure

```
src/
  assets/
    icons/
      core/
      navigation/
      status_and_feedback/
      study_tools/
```

Icons are currently imported directly as SVG files.

### Example

```import flashcard from "/assets/icons/core/flashcard.svg"```

# 3. Reusable UI Components

Three reusable UI components were created for consistency and ease of development.

### Location

```
src/
  components/
            ui/
```

### Components

- Button.jsx
- Badge.jsx
- Icon.jsx

## Icon Component

A simple wrapper around an image element used to render SVG icons consistently.

### Example

```
import Icon from "/components/ui/Icon"
import flashcard from "/assets/icons/core/flashcard.svg"

<Icon src={flashcard} size={24} />
```

This keeps icon usage consistent across the application.

---

## Button Component

Buttons are implemented using variant-based styling.

Available variants:

- primary
- secondary
- ghost

Available sizes:

- sm
- lg

### Example usage

```
import Button from "@/components/ui/Button"

<Button>
Generate Flashcards
</Button>

<Button variant="secondary">
Upload Notes
</Button>

<Button size="lg">
Start Quiz
</Button>
```

## Badge Component

Badges provide visual status indicators.

Variants:

- correct
- review
- progress

### Example usage

```
import Badge from "/components/ui/Badge"

<Badge>
Correct
</Badge>

<Badge variant="review">
Needs Review
</Badge>

<Badge variant="progress">
In Progress
</Badge>
```

Badges use the .badge base class and variant classes defined in the CSS layer.

# Next Steps

With the design system and reusable components in place, the next step is to:

1. Implement the application layout
2. Configure React Router
3. Add navigation with NavLink
4. Begin building the first application screens

This foundation allows new features to be developed quickly while keeping the UI consistent across the application.

---

### Implementation approach

1. **`services/api.js` first** — create an Axios instance with `baseURL` pointing to the
   FastAPI server. Add a request interceptor that automatically injects the
   `Authorization: Bearer <token>` header from localStorage on every call.

2. **Auth flow** — `LoginPage` and `RegisterPage` call the API, store the token, then
   redirect to `/`. `ProtectedRoute` wraps all private routes and redirects to `/login`
   if no token is present.

3. **`DashboardPage`** — fetch and display notes; link to individual note pages.

4. **`NotePage`** — show note content + a "Generate Study Set" button that calls
   `POST /notes/:id/generate`. Show a loading spinner during generation (it may take a
   few seconds). Once complete, list existing study sets below.

5. **`StudySetPage`** — tabbed interface:
   - **Flashcards tab**: show cards one at a time, click to flip, previous/next nav.
     On each card reveal, show 4 confidence buttons (Again / Hard / Good / Easy) that
     call `POST /flashcards/:id/review`.
   - **Quiz tab**: show one question at a time, 4 MCQ options. On answer selection,
     call `POST /quiz/:id/attempt` and reveal whether the answer was correct and the
     explanation.
   - **Summary tab**: render the summary text.
   - **Study Guide tab**: render the study guide text.

---

## Running the Project Locally

### Prerequisites

- Docker Desktop running
- Python 3.13 (`py` command)
- Node.js 18+

### Backend

```bash
# 1. Start Postgres + pgAdmin
docker compose -f docker/compose.yml up -d

# 2. Install Python dependencies
cd server && py -m pip install -r requirements.txt

# 3. Apply migrations
py -m alembic upgrade head

# 4. Start the API server
py -m uvicorn app.main:app --reload

# API available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### Frontend

```bash
cd client && npm install && npm run dev
# Available at http://localhost:5173
```

### pgAdmin (visual DB browser)

- URL: `http://localhost:5050`
- Login: `admin@classmateai.com` / `admin123`
- Add server: host = `classmateai_postgres`, port = `5432`, user = `postgres`, password = `postgres`

### Environment variables (`server/.env`)

```
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/classmateai
SECRET_KEY=<32-byte hex string>
ACCESS_TOKEN_EXPIRE_MINUTES=30
# ANTHROPIC_API_KEY=<your key>   # needed for Phase 4
```

---

## Build Order Summary

| Phase | Status | What |
|---|---|---|
| 1 — Database layer | ✅ Done | 9 SQLAlchemy models, Alembic migrations, DB wiring |
| 2 — Auth layer | ✅ Done | Register, login, JWT, `get_current_user` dependency |
| 3 — Notes API | ✅ Done | CRUD endpoints for notes |
| 4 — AI generation | ✅ Done | Claude API integration, study set generation |
| 5 — Study content routes | ✅ Done | Fetch content, record quiz attempts and flashcard reviews |
| 6 — Frontend | 🔲 Next | React SPA — auth, dashboard, note, study set views |
