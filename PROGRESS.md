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
| AI | Google Gemini API (`google-genai` SDK) |
| HTTP client (FE) | Axios |
| Routing (FE) | React Router v7 |

---

## Repository Structure (current state)

```
classmateai/
├── client/
│   └── src/
│       ├── assets/icons/          # SVG icons organized by category
│       │   ├── core/
│       │   ├── navigation/
│       │   ├── status_and_feedback/
│       │   └── study_tools/
│       ├── components/
│       │   ├── auth/
│       │   │   ├── RequireAuth.jsx
│       │   │   └── RedirectIfAuth.jsx
│       │   ├── layout/
│       │   │   ├── DefaultPageLayout.jsx
│       │   │   ├── InnerAppPageLayout.jsx
│       │   │   └── MainAppPageLayout.jsx
│       │   └── ui/
│       │       ├── Badge.jsx
│       │       ├── Button.jsx
│       │       └── Icon.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── hooks/
│       │   ├── useAuth.js
│       │   └── useQuizHistory.js  # localStorage quiz history (max 20)
│       ├── pages/
│       │   ├── NotFound.jsx
│       │   ├── app/
│       │   │   ├── AllCourses.jsx
│       │   │   ├── AllFlashcards.jsx
│       │   │   ├── AllQuizzes.jsx
│       │   │   ├── Analytics.jsx
│       │   │   ├── Courses.jsx
│       │   │   ├── Dashboard.jsx
│       │   │   ├── Flashcards.jsx
│       │   │   ├── NewCourse.jsx
│       │   │   ├── Processing.jsx
│       │   │   ├── Quizzes.jsx
│       │   │   ├── QuizSession.jsx
│       │   │   ├── StudyMaterialsReady.jsx
│       │   │   └── UploadNotes.jsx
│       │   ├── auth/
│       │   │   ├── Login.jsx
│       │   │   └── Register.jsx
│       │   └── public/
│       │       └── Landing.jsx
│       ├── services/
│       │   ├── api.js             # Axios instance + auth interceptor
│       │   ├── authService.js
│       │   └── noteService.js
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │       ├── 1613ca85eff1_initial_schema.py
│   │       └── a2f3e8b1c9d4_study_sets_user_id_note_nullable.py
│   ├── app/
│   │   └── main.py                # FastAPI app + router registration
│   ├── db/
│   │   └── __init__.py
│   ├── models/
│   │   ├── base.py
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
│   │   ├── auth.py
│   │   ├── generate.py
│   │   ├── notes.py
│   │   ├── progress.py
│   │   └── study_sets.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── note.py
│   │   ├── study_content.py
│   │   └── study_set.py
│   ├── services/
│   │   └── ai.py                  # Gemini API + prompt construction
│   ├── utils/
│   │   ├── auth.py
│   │   └── deps.py
│   ├── .env                       # gitignored
│   ├── .env.example
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
Google Gemini, and writes back a complete `StudySet` with all its children in one database
transaction.

### Endpoint

| Method | Path | Description |
|---|---|---|
| `POST` | `/notes/{note_id}/generate` | Generate a full study set from a note |

Response: the created `StudySet` with nested flashcards, quiz questions, summary, and
study guide.

### How it works

1. Look up the note (verify ownership).
2. Build a prompt that instructs Gemini to return structured JSON containing:
   - An array of flashcard objects `{front, back}`
   - An array of quiz question objects `{question, options: [...], correct_index, explanation}`
   - A summary string
   - A study guide string
3. Call the Gemini API (`gemini-2.5-flash`) and parse the JSON response.
4. Write everything to the database inside a single transaction:
   - Insert one `StudySet` row
   - Bulk-insert `Flashcard` rows with `display_order` = index
   - Bulk-insert `QuizQuestion` rows with `display_order` = index
   - Insert one `Summary` row
   - Insert one `StudyGuide` row
5. Return the assembled study set.

### Files

```
server/services/ai.py            Gemini API call + prompt construction + response parsing
server/schemas/study_set.py      StudySetResponse (nested flashcards, questions, etc.)
server/routes/generate.py        POST /notes/{note_id}/generate
```

### Dependencies

```
google-genai                     official Google Gemini Python SDK
```

`GEMINI_API_KEY` in `.env` / `.env.example`.

### Key design decisions

- **Model**: `gemini-2.5-flash` — free tier as of March 2026 (2.0 models retired March 3, 2026).
- **Regeneration** — calling `POST /notes/{note_id}/generate` a second time creates a new
  `StudySet` for the same note. The schema supports multiple study sets per note.

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

- **Quiz responses include `correct_index`** — the GET quiz endpoint returns questions,
  options, and the correct answer index. This enables the frontend to score answers and
  display the full results review without a separate API call.
- **`FlashcardReview` confidence values**: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy.
  These map directly to SM-2 spaced-repetition grades and leave the door open for
  scheduling logic in a future phase.

---

## Phase 6 — Frontend ✅ COMPLETE

The full React SPA was built consuming all backend APIs.

### Pages built

| Route | Component | Description |
|---|---|---|
| `/` | Landing | Public landing page |
| `/login` | Login | Email + password form, stores JWT |
| `/register` | Register | Name + email + password form |
| `/dashboard` | Dashboard | Recent courses (last 3), stat cards, greeting |
| `/courses` | AllCourses | All courses sorted by newest |
| `/courses/new` | NewCourse | Create a course |
| `/courses/:courseId` | Courses | Course detail — study sets, upload, delete |
| `/courses/:courseId/upload` | UploadNotes | Paste notes and trigger AI generation |
| `/courses/:courseId/processing` | Processing | Generation loading state |
| `/courses/:courseId/ready` | StudyMaterialsReady | Post-generation success screen |
| `/flashcards` | AllFlashcards | All flashcard decks |
| `/flashcards/:deckId` | Flashcards | Flip-card study mode |
| `/quizzes` | AllQuizzes | All quizzes + recent quiz history |
| `/quizzes/:courseId` | Quizzes | Quizzes for a specific course |
| `/quizzes/:courseId/session/:quizId` | QuizSession | Quiz taking + results screen |
| `/analytics` | Analytics | Weekly bar chart + topics mastery |
| `*` | NotFound | 404 page |

### Key frontend additions - 3/4/26

#### Global Styling and Design System

- Mint color scale (`--mint-50` → `--mint-950`) for branding and accents
- Supporting status colors: success, warning, error, info
- UI variables: `--bg`, `--surface`, `--border`, `--brand`, `--text`, `--text-emphasis`

Typography:

| Element | Font | Size | Weight |
|---|---|---|---|
| H1 | Poppins | 48px | 700 |
| H2 | Poppins | 36px | 700 |
| H3 | Poppins | 28px | 600 |
| Body | Inter | 16px | normal |
| Caption | Inter | 12px | normal |

#### Reusable UI Components

- `Button.jsx` — variants: primary, secondary, ghost; sizes: sm, lg
- `Badge.jsx` — variants: correct, review, progress
- `Icon.jsx` — SVG wrapper for consistent icon rendering

#### Layout System

- `DefaultPageLayout` — public/auth pages (centered, no sidebar)
- `MainAppPageLayout` — sidebar nav + header (Dashboard, Courses, Analytics, etc.)
- `InnerAppPageLayout` — inner pages with back navigation

#### Auth

- JWT stored in localStorage + React context (`AuthContext` + `useAuth`)
- `RequireAuth` — redirects unauthenticated users to `/login`
- `RedirectIfAuth` — redirects authenticated users away from `/login` and `/register`

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

### Frontend Additions - 3/5/26

## Authentication and Core Layout Implementation

## Login and Register Pages

The **Login** and **Register** pages were designed using the `DefaultPageLayout` component to maintain a consistent structure and
styling.

Key features implemented:

- Form inputs styled using the shared design tokens and Tailwind
    utility classes
- Reusable `Button` component used for all form actions
- Client-side loading state for form submissions
- Error handling with feedback messages returned from the API
- Disabled form fields and buttons while authentication requests are
    processing

The authentication forms were connected to the backend API using
**Axios** through the `authService` layer. Successful authentication
responses return a **JWT access token** and user information, which are
stored in the application's authentication context and persisted to
**localStorage**.

Once authenticated, users are automatically redirected to the dashboard.

------------------------------------------------------------------------

## Authentication Guards

Two route guards were implemented to manage access to protected routes.

### RequireAuth

Ensures that only authenticated users can access protected application
pages such as the dashboard.

### RedirectIfAuth

Prevents authenticated users from accessing login or register pages and
redirects them back to the dashboard.

------------------------------------------------------------------------

## Application Layout System

To support different page types across the application, three layout
components were created.

### DefaultPageLayout

Used for public authentication pages such as **Login** and **Register**.

Features: - Centered page layout - Application header - Consistent form
container styling

### InnerAppPageLayout

Used for internal pages that provide a quick return link to the
dashboard.

Features: - Header with **Back to Dashboard** navigation - Consistent
content spacing - Flexible content rendering

### MainAppPageLayout

Serves as the **primary layout for the application**.

Features: - Top application header - Sidebar navigation - Active route
highlighting using `NavLink` - Main content area for application screens

This layout will be reused across most authenticated application pages.

------------------------------------------------------------------------

## Dashboard Layout (First Draft)

The initial dashboard structure was implemented using the
`MainAppPageLayout`.

While the inner dashboard components are still under development, the
foundational layout includes:

- Top header with a dynamic greeting and user initials
- Sidebar navigation for major application sections
- Title and subtitle area for contextual page information
- Flexible content region for dashboard widgets and cards

The greeting dynamically adjusts based on the user's **local time** and
extracts the user's **first name** from the authentication context to
personalize the interface.

Example greeting behavior:

Good morning, Alvaro!\
Good afternoon, Alvaro!\
Good evening, Alvaro!

This establishes the primary structure for the rest of the application
and allows future features such as:

- Course cards
- Flashcards
- Quiz systems
- Study analytics

to be built within a consistent layout framework.

------------------------------------------------------------------------

## How to Use the Layouts

### DefaultPageLayout

Used for authentication pages like **Login** and **Register**.

Example:

    <DefaultPageLayout
      pageTitle="Sign In"
      title="Sign Into your account"
      subtitle="Sign in with your email and password below."
    >
      {/* page content */}
    </DefaultPageLayout>

------------------------------------------------------------------------

### InnerAppPageLayout

Used for internal pages that should include a **Back to Dashboard**
option.

Example:

    <InnerAppPageLayout
      title="Flashcards"
      subtitle="Review your generated flashcards"
    >
      {/* page content */}
    </InnerAppPageLayout>

------------------------------------------------------------------------

### MainAppPageLayout

Used for the main authenticated pages of the application, such as the
**Dashboard**.

It includes:

- Top header
- User profile indicator
- Sidebar navigation
- Main content area

Example:

    <MainAppPageLayout
      headerTitle="Welcome back!"
      title="Good afternoon, Joe!"
      subtitle="You've studied for 2 hours today."
    >
      {/* dashboard content */}
    </MainAppPageLayout>

------------------------------------------------------------------------

## Current Progress Summary - 3/5/26

Completed so far:

- Login page UI and backend authentication integration
- Register page UI and backend authentication integration
- Axios service layer for API communication
- Authentication context and localStorage persistence
- Route protection with RequireAuth and RedirectIfAuth
- Three reusable layout systems
- Dashboard shell layout with navigation sidebar
- Dynamic greeting and profile initials rendering

This foundation now allows the rest of the application screens to be
implemented quickly while maintaining a consistent UI and scalable
architecture.

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
| 4 — AI generation | ✅ Done | Google Gemini API integration, study set generation |
| 5 — Study content routes | ✅ Done | Fetch content, record quiz attempts and flashcard reviews |
| 6 — Frontend | ✅ Done | Full React SPA — all pages, layouts, auth, study flows |
| 7 — Polish & enhancements | ✅ Done | Quiz results review, history, analytics, nav fixes, courses page |

---

## Phase 7 — Polish & Enhancements ✅ COMPLETE (3/10/26)

### Navigation fixes

- Fixed Courses nav link pointing to `/dashboard` instead of `/courses` (both mobile sidebar and desktop sidebar)
- Added `/courses` route (`AllCourses` page) — was missing entirely, causing 404

### Courses split

- **Dashboard** now shows the 3 most recent courses with a "View All →" link
- **`/courses`** (new `AllCourses.jsx`) shows all courses sorted by newest first, with `+ New Course` button

### Quiz results screen

- Replaced the basic "X of Y answered" summary with a full results screen:
  - Score percentage (large display)
  - Correct / Incorrect count cards (green / red)
  - Full per-question review for **every** question — correct ones show a green border + "Your answer", incorrect ones show the wrong answer in red and the correct answer in green below
  - Explanation shown for any question that has one
- Fixed backend bug: `GET /study-sets/{id}/quiz` was returning `correct_index=-1` for all questions, making scoring impossible. Now returns the real `correct_index` and `explanation`.

### Quiz history

- New `useQuizHistory.js` hook — `saveQuizResult` / `getQuizHistory` backed by localStorage, capped at 20 entries
- `QuizSession` saves a result entry on finish (course title, quiz label, correct count, total, score %, timestamp)
- `AllQuizzes` displays a "Recent Results" section below available quizzes, with score color-coded by performance and a "Retake →" link

### Analytics

- **Weekly Quiz Performance** chart now reads real data from quiz history:
  - Last 7 days, bars scaled to 100% (not relative to max)
  - Color-coded: green ≥80%, mint ≥60%, red <60%
  - Hover tooltip shows exact average % and quiz count for that day
  - Days with no quizzes show a faint stub to keep day labels aligned
- **Topics Mastery** section now populated from quiz history:
  - Shows any course where the user has achieved 100% on at least one quiz
  - Empty state updated to explain the 100% requirement

---

## Phase 8 — Study UX + Analytics Enhancements ✅ COMPLETE (3/11/26)

### Flashcards: completion state + next actions

- Added an explicit **end-of-deck completion screen** in `Flashcards.jsx` so users know when they’ve finished a flashcard set.
- Completion screen includes:
  - **Take Quiz** button (correctly linked to the associated course + study set: `/quizzes/:courseId/session/:studySetId`)
  - **Go to Dashboard** button
  - Session summary (cards reviewed + estimated time)

### Flashcards: progress tracking (per-user DB)

- Implemented client-side calls to the existing backend endpoint:
  - `POST /flashcards/{flashcard_id}/review`
- Flashcards now record a review event **when a card is revealed** (first flip), persisted to the user’s DB (`flashcard_reviews`).
- Added `client/src/services/progressService.js` to centralize progress API calls.

### Dashboard + Courses: mastery percent integration

- **Mastery %** is now computed from quiz history (best quiz score per course) and shown on:
  - `Dashboard.jsx` course cards
  - `AllCourses.jsx` course cards (matched Dashboard behavior)
- Mastery progress bars now visually reflect the % instead of the placeholder `—% / 0%`.

### Analytics: deeper mastery + chart readability

- **Topics Mastery** upgraded in `Analytics.jsx`:
  - Shows **all courses with quiz history**, not only 100% courses
  - Sorted with **Mastered (100%) first**, then by best score descending
  - Includes quick links: **Open course** and **Retake quiz**
- **Weekly Quiz Performance** chart improvements:
  - Added **Y-axis % scale** (0/25/50/75/100)
  - Added **% labels above bars** while keeping the hover tooltip for exact values

### Universal delete UX (cards)

- Extracted the existing delete modal into a reusable component:
  - `client/src/components/modals/DeleteCourseModal.jsx`
- Added hover trash actions (using the same modal + options: delete course / flashcards / quizzes) to:
  - `/courses` (`AllCourses.jsx`)
  - `/flashcards` (`AllFlashcards.jsx`)
  - `/quizzes` (`AllQuizzes.jsx`)
- Removed the original trash icon from the course detail header (`Courses.jsx`) since deletion is now available from cards.
- Adjusted `/courses` card header UX so the **Active badge slides left on hover** and the trash icon appears cleanly (no overlap).

### Tested / verification

- Manually tested core flows to ensure original capabilities still work:
  - Course creation and navigation
  - Flashcard studying + completion flow
  - Quiz sessions + results + quiz history
  - Analytics pages (weekly chart + mastery)
  - Course/material deletion via the new card-based trash controls
