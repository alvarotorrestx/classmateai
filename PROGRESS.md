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
│       │       ├── Icon.jsx
│       │       └── ThemeToggle.jsx   # account-menu light/dark switch
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useQuizHistory.js  # localStorage quiz history (max 20)
│       │   ├── useStudyMetrics.js # localStorage study time + streak (completed sessions)
│       │   └── useTheme.js        # theme init, persist, toggle (.dark on <html>)
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
│       │   │   ├── Register.jsx
│       │   │   └── VerifyEmail.jsx
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
GEMINI_API_KEY=<your key>
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
| 8 — Study UX + analytics | ✅ Done | Flashcard completion, DB reviews, mastery, analytics UX, delete modals |
| 9 — Cookie auth | ✅ Done | HttpOnly access/refresh cookies, `/auth/session`, Axios refresh, logout |
| 10 — Study recommendations | ✅ Done | Client-side ranking, Dashboard “Suggested”, flash/quiz nudges (3/19/26) |
| 11 — Loading skeleton system | ✅ Done | Reusable page-shaped skeletons + UI polish updates (3/26/26) |
| 12 — Email verification (Brevo) | ✅ Done | `is_verified`, verify/resend endpoints, register no auto-login (4/7/26) |
| 13 — Dark mode + theme toggle | ✅ Done | CSS `.dark`, anti-flash script, `useTheme`, UI sweep, pill `ThemeToggle` (4/8/26) |
| 14 — Study time + streak (client) | ✅ Done | `useStudyMetrics` localStorage, Flashcards/QuizSession record, Dashboard + Analytics (4/9/26) |
| 15 — Gamification + badges | ✅ Done | Backend stats/points/streak + badges + Rewards page, idempotent quiz completion, seed + backfill (4/16/26) |

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

### Bug fix — Processing screen progress (3/11/26)

- Fixed the `Processing.jsx` screen where the progress bar stayed at 0% and never completed after a teammate’s update.
- Root cause: an extra `hasFired` guard around the `useEffect` prevented the real interval + API call from running under React 18 StrictMode, so the backend completed but the UI never saw the result.
- Resolution: removed the `hasFired` guard and relied on the existing `cancelled` flag for safe cleanup, restoring the animated 0→100% progress and automatic navigation to the Study Materials Ready screen.

---

## Phase 9 — Cookie-Based Auth + Session Persistence ✅ COMPLETE (3/18/26)

### Goal
Migrate authentication from **localStorage + Authorization Bearer headers** to a more secure and scalable
**cookie-based access/refresh token** model with automatic session restoration and refresh.

---

### Backend — Access + Refresh Tokens (HttpOnly cookies)

#### JWT utilities (`server/utils/auth.py`)
- Added support for **two token types**:
  - `type="access"` (short-lived)
  - `type="refresh"` (long-lived)
- Implemented separate create/decode helpers for each token type.
- Token durations controlled by env vars:
  - `ACCESS_TOKEN_EXPIRE_MINUTES`
  - `REFRESH_TOKEN_EXPIRE_MINUTES`

#### Auth routes (`server/routes/auth.py`)
- Updated `/auth/register` and `/auth/login` to:
  - Generate both access + refresh JWTs
  - Set them as **HttpOnly cookies**:
    - `access_token` cookie scoped to `/`
    - `refresh_token` cookie scoped to `/auth`
  - Return `AuthResponse` with `user` + `message` (tokens no longer sent to frontend JS)
- Added `/auth/refresh`:
  - Rotates both tokens using the `refresh_token` cookie
  - Fix: correctly treats the JWT `sub` claim as a **UUID** (not `int`)
- Added `/auth/logout`:
  - Clears both cookies

#### Auth dependency (`server/utils/deps.py`)
- Updated `get_current_user` to accept auth from:
  - `Authorization: Bearer <token>` (backward compatible)
  - OR `access_token` cookie (new default path)
- Fix: `HTTPBearer(auto_error=False)` so cookie fallback works when no Authorization header is present.

#### Session endpoint (`/auth/session`)
- Added `GET /auth/session` to return the current authenticated user (via cookie/header).
- Used by the frontend to restore session state after a page refresh.

---

### Frontend — Remove localStorage tokens, rely on cookies + session hydration

#### Axios (`client/src/services/api.js`)
- Enabled `withCredentials: true` so cookies are sent automatically.
- Added a global **401 interceptor**:
  - On 401, attempts `POST /auth/refresh` once
  - Retries the original request after refresh
  - If refresh fails, triggers a global logout (clears auth + redirects)
- Added `sessionClient` (no interceptors) for `/auth/session` bootstrap to avoid logged-out users being forced to `/login`.

#### Auth state (`client/src/context/AuthContext.jsx`)
- Removed **localStorage persistence entirely**.
- Added `authLoading` hydration state:
  - Calls `GET /auth/session` on startup via `sessionClient`
  - If successful: sets `auth.user`
  - Always marks hydration complete (`authLoading=false`)
- Registered a global logout handler used by Axios interceptor to:
  - Clear auth
  - Navigate to `/login`

#### Route guards
- Updated `RequireAuth` and `RedirectIfAuth` to use `auth.user` (not access token).
- Added hydration gating to avoid flicker:
  - While `authLoading` is true, guards render a small loading UI instead of redirecting.
- New component: `client/src/components/auth/AuthLoading.jsx` for consistent session-check UX.

#### Login/Register pages
- Updated to store only `{ user }` in `AuthContext`.
- Tokens are no longer read from the response body (cookies handle auth).

#### Logout behavior
- Updated logout handlers in:
  - `client/src/components/layout/MainAppPageLayout.jsx`
  - `client/src/components/layout/InnerAppPageLayout.jsx`
- Logout now:
  - Calls `POST /auth/logout` to clear cookies
  - Clears `auth`
  - Redirects to `/login`

---

### Results / UX Improvements
- **Secure tokens**: No JWTs stored in localStorage or accessible to JS (HttpOnly cookies).
- **Automatic refresh**: Expired access tokens are refreshed transparently when possible.
- **Hard logout**: Deleting cookies or failing refresh causes a true logout (auth cleared + redirect).
- **Session persistence**: Refreshing the browser restores the user session via `/auth/session`.
- **No login flash**: Hydration gating prevents briefly seeing `/login` while already authenticated.
- **Logged-out refresh**: Public routes (like `/`) remain on the same page when logged out; no forced redirect.

---

### Tested / verification
- Confirmed login/register set cookies and authenticated routes work.
- Confirmed protected API calls succeed with cookie auth.
- Confirmed 401 handling triggers refresh and retries requests.
- Confirmed logout clears cookies, clears auth state, and redirects correctly.
- Confirmed browser refresh restores session via `/auth/session` and avoids `/login` flicker.

---

## Phase 10 — Client-Side Study Recommendations ✅ COMPLETE (3/19/26)

### Goal
Surface **personalized study suggestions** using data already on the client: courses + study sets
(from the API) and **local quiz history** (`useQuizHistory` / localStorage). No new backend endpoints.

---

### Core utility — `client/src/utils/studyRecommendations.js`

- **`hasStudyContent(notes, studySets)`** — `true` only when there is at least one course and at least one
  study set with flashcards or quiz questions (used to hide empty recommendation UI).
- **`getStudyRecommendations({ notes, studySets, quizHistory })`** — returns up to **3** ranked items
  (`quiz` or `flashcards`) with `courseTitle`, `reason`, and `href` for dashboard cards.
  - Fills **quiz** recommendations first for courses that need quiz focus, then **flashcards** for
    mastered-quiz reinforcement and flash-only courses.
- **`getTopRecommendationByType(recommendations, type)`** — first item of a given type (used on **All Quizzes**).
- **`getBestFlashcardNudge({ notes, studySets, quizHistory })`** — **dedicated** top pick for **All Flashcards**.
  - Needed because the mixed 3-item list prioritizes quizzes; the flash page was often missing a
    `flashcards` entry. This ranks only courses that have a flash deck (weak quiz scores first,
    then “before first quiz,” then stronger scores / flash-only).

### Quiz ranking tweak
- **Low scores are prioritized over “never taken”** for quiz-focused ordering: courses with a poor best
  score surface before courses where the user hasn’t taken a quiz yet (then never-taken, then higher scores,
  then mastered).

---

### Dashboard — `client/src/pages/app/Dashboard.jsx`

- After stats load, if `hasStudyContent` and there is at least one recommendation, renders **“Suggested for you”**
  as a responsive row of up to **3** link cards (quiz vs flashcards labels, reason text, CTA).

---

### Floating nudge — `client/src/components/study/RecommendationNudge.jsx`

- Used on **All Flashcards** and **All Quizzes** (not on Dashboard).
- **FAB** (sparkle) bottom-right: larger control, white ring, shadow.
- **Panel** opens on **hover** or **click** (click toggles “pinned”; click-outside dismisses when pinned).
- **Glass-style panel**: semi-transparent white + `backdrop-blur`, softer border/shadow; slightly higher opacity
  when pinned vs hover-only so content stays readable without dominating the page.
- **Bounce animation** (`.recommendation-nudge-fab` in `client/src/App.css`) — continuous gentle bounce;
  **pauses on hover** so it doesn’t fight the hover scale/interaction.

---

### Page wiring

| Page | Behavior |
|------|----------|
| `AllFlashcards.jsx` | Loads notes + all study sets; nudge = `getBestFlashcardNudge(...)` when at least one deck exists. |
| `AllQuizzes.jsx` | Nudge = top **quiz** from `getStudyRecommendations` via `getTopRecommendationByType(..., "quiz")` when quizzes exist. |

---

### Repo / file notes

- Added `client/src/components/study/` (contains `RecommendationNudge.jsx`).
- Added `client/src/utils/studyRecommendations.js` (removed placeholder `client/src/utils/.gitkeep`).
- Styling: `client/src/App.css` (nudge keyframes + animation classes).

---

### Tested / verification

- Dashboard shows “Suggested for you” when there is study content and at least one recommendation.
- All Quizzes shows the quiz nudge when applicable; All Flashcards shows the flash nudge when decks exist
  (including courses where recommendations were previously quiz-only).
- Quiz ordering reflects “struggling courses” before “never taken.”
- Nudge: hover and click behavior, glass panel, bounce visible and calmer on hover.

---

## Phase 11 — Universal Loading Skeleton + UI Polish ✅ COMPLETE (3/26/26)

### Goal
Replace repeated page-level loading spinners with reusable, shape-matched skeleton loading states,
while preserving existing empty/error states and transactional button feedback.

---

### Reusable loading system

- Added shared loading components:
  - `client/src/components/loading/SkeletonBlock.jsx`
  - `client/src/components/loading/PageSkeletons.jsx`
- New skeleton variants include:
  - `DashboardSkeleton`
  - `CourseGridSkeleton`
  - `DeckGridSkeleton`
  - `QuizListSkeleton`
  - `FlashcardSessionSkeleton`
  - `QuizSessionSkeleton`
  - `StudyGuideSkeleton`
- Skeletons are designed to match each page’s final layout (card/list/header structure) for lower visual
  layout shift and better perceived performance.

---

### Page integrations

- Replaced loading spinners with skeletons in:
  - `client/src/pages/app/Dashboard.jsx`
  - `client/src/pages/app/AllCourses.jsx`
  - `client/src/pages/app/Courses.jsx`
  - `client/src/pages/app/Flashcards.jsx`
  - `client/src/pages/app/Quizzes.jsx`
  - `client/src/pages/app/AllFlashcards.jsx`
  - `client/src/pages/app/AllQuizzes.jsx`
  - `client/src/pages/app/QuizSession.jsx`
- Replaced section-level `guideLoading` spinner in `client/src/pages/app/Courses.jsx`
  with `StudyGuideSkeleton`.
- Kept inline action spinners for generating/deleting actions (button-level transactional feedback).

---

### Additional UI updates included

- `client/src/pages/app/StudyMaterialsReady.jsx`
  - Replaced empty placeholder squares with actual study-tool icons:
    - `client/src/assets/icons/core/quiz.svg`
    - `client/src/assets/icons/core/flashcard.svg`
- `client/src/pages/app/Dashboard.jsx` and `client/src/pages/app/Flashcards.jsx`
  - Added card hover polish with border/transition animation for clearer interactivity and improved visual feedback.

---

## Phase 12 — Email Verification (Brevo) ✅ COMPLETE (4/7/26)

### Goal
Require **email verification** before a new account can log in, using **Brevo** transactional email, without
rewriting the existing cookie-based JWT auth architecture.

---

### Database

- **`users.is_verified`**
  - Added to [server/models/user.py](server/models/user.py): `Boolean`, default `False`, `nullable=False`
- **Alembic migration**
  - [server/alembic/versions/4e082d4ca43f_add_is_verified_to_users.py](server/alembic/versions/4e082d4ca43f_add_is_verified_to_users.py)
  - Adds column with a temporary server default for existing rows, then drops the server default

---

### Backend — JWT helpers (same module as access/refresh)

- Extended [server/utils/auth.py](server/utils/auth.py):
  - `EMAIL_VERIFY_EXPIRE_MINUTES` from env
  - `create_email_verification_token(data, expires_delta=None)` — payload includes `type: "email_verification"`
  - `decode_email_verification_token(token)` — validates token type

---

### Backend — Brevo email utility

- Added [server/utils/email.py](server/utils/email.py):
  - `send_verification_email(email, full_name, token)`
  - Sends via Brevo `POST https://api.brevo.com/v3/smtp/email`
  - Verification link: `{FRONTEND_URL}/verify-email?token=...`
  - HTML email with button + plain link fallback
- Dependency: `httpx` added to [server/requirements.txt](server/requirements.txt)

---

### Backend — Auth routes and schemas

- Updated [server/schemas/auth.py](server/schemas/auth.py):
  - `UserResponse` includes **`is_verified`**
  - `MessageResponse`, `VerifyEmailRequest`, `ResendVerificationRequest`
- Updated [server/routes/auth.py](server/routes/auth.py):
  - **`POST /auth/register`**
    - Creates user with `is_verified=False`
    - Sends verification email; **does not** set auth cookies
    - Returns **`MessageResponse`** (no authenticated session)
  - **`POST /auth/login`**
    - If credentials valid but `not user.is_verified` → **403** with message to verify email first
    - Otherwise unchanged (access + refresh cookies)
  - **`POST /auth/verify-email`** — body `{ "token": "..." }`; marks user verified; idempotent if already verified
  - **`POST /auth/resend-verification`** — body `{ "email": "..." }`; **always** returns a generic success message
    (anti–account enumeration)

---

### Environment variables

Documented / used (see [server/.env.example](server/.env.example)):

- `BREVO_API_KEY`
- `EMAIL_FROM`
- `FRONTEND_URL`
- `EMAIL_VERIFY_EXPIRE_MINUTES`

---

### Frontend

- New page [client/src/pages/auth/VerifyEmail.jsx](client/src/pages/auth/VerifyEmail.jsx):
  - Reads `?token=`, calls `POST /auth/verify-email`
  - Uses `DefaultPageLayout` + `Button` and existing mint / gray styling
  - On failure, optional resend form calling `POST /auth/resend-verification`
- [client/src/App.jsx](client/src/App.jsx): public route `/verify-email`
- [client/src/pages/auth/Register.jsx](client/src/pages/auth/Register.jsx):
  - No auto-login or redirect to dashboard; shows success message and link to login
- [client/src/pages/auth/Login.jsx](client/src/pages/auth/Login.jsx):
  - Handles **403** (verify required) with copy + resend verification action
- [client/src/services/authService.js](client/src/services/authService.js): `resendVerification(email)`

`RequireAuth`, `RedirectIfAuth`, and cookie session hydration remain the same; users only get a session after
email verification and successful login.

---

## Phase 13 — Dark Mode + Theme Toggle ✅ COMPLETE (4/8/26)

### Goal
Ship a consistent **light/dark** experience across the React app using existing design tokens, persist the
user’s choice, avoid a flash of the wrong theme on load, and expose a polished control in the account menu.

---

### Design tokens (`client/src/App.css`)

- **Light** (`:root`) and **dark** (`.dark` on `document.documentElement`) sets of:
  `--bg`, `--surface`, `--surface-muted`, `--border`, `--text`, `--text-emphasis`, `--text-muted`, brand/button
  colors, and semantic status colors tuned for contrast on dark backgrounds.
- **Utility classes** used across the UI: `bg-app`, `bg-surface`, `bg-surface-muted`, `text-base-theme`,
  `text-muted`, `text-em`, `border-theme`.

---

### Anti-flash + hydration

- **`client/index.html`** — small inline script **before** the Vite bundle runs: reads
  `localStorage` key `classmateai-theme` (`light` / `dark`), else falls back to
  `prefers-color-scheme: dark`, and adds or removes the `dark` class on `<html>` immediately.
- **`client/src/main.jsx`** — imports `initTheme` from `useTheme.js` and runs it before `createRoot` so React
  and the inline script stay aligned.

---

### Theme API — `client/src/hooks/useTheme.js`

- **`THEME_STORAGE_KEY`** — `classmateai-theme`.
- **`initTheme`**, **`getTheme`**, **`setTheme`**, **`toggleTheme`** — sync `.dark` on `<html>` and persist when
  possible.
- **`useTheme()`** — `useSyncExternalStore` + a `classmateai-theme-change` document event so UI (e.g. the
  toggle) updates when theme changes.

---

### Theme toggle UI — `client/src/components/ui/ThemeToggle.jsx`

- Placed in **both** account dropdowns (**above Logout**) in:
  - `client/src/components/layout/MainAppPageLayout.jsx`
  - `client/src/components/layout/InnerAppPageLayout.jsx`
- **Visual design (4/8/26):** iOS-style **pill track** with inset shadow, **sliding thumb** (warm
  orange/yellow gradient + white sun in light mode; cool slate gradient + white moon in dark mode), **outline**
  inactive icon on the opposite side, subtle thumb shadow and smooth `translate` transition. Row layout:
  **“Light mode” / “Dark mode”** label + switch; full-width button with focus ring for accessibility
  (`aria-label`, `aria-pressed`).

---

### Layout + shared UI theming

- Main/inner layouts: account menus and sidebars use `bg-surface`, `border-theme`, `text-muted` / `text-base-theme`
  where appropriate; **logo image chips** stay **`bg-white`** for brand contrast (intentional).
- **`client/src/components/loading/SkeletonBlock.jsx`** / **`PageSkeletons.jsx`** — skeleton fills and card shells
  use surface/border tokens so placeholders work in dark mode.

---

## Phase 14 — Study Time + Study Streak (Client, localStorage) ✅ COMPLETE (4/9/26)

### Goal
Track **study time** and a **study streak** without backend changes first, mirroring the **quiz history**
pattern (`localStorage`), then surface metrics on **Analytics** and **Dashboard**.

### Storage — [`client/src/hooks/useStudyMetrics.js`](client/src/hooks/useStudyMetrics.js)

- **Key:** `classmateai-study-activities`
- **Shape:** `{ v: 1, activities: [...] }` — each activity includes `id`, ISO `at`, `type` (`flashcards` |
  `quiz`), `durationSec`, optional `courseId` / `deckId` / `quizId`
- **Cap:** newest-first list trimmed to **500** entries
- **Exports:**
  - `recordStudyActivity(...)` — append one completed session
  - `getStudyActivities()`, `getTotalStudySeconds()`
  - `getCurrentStudyStreakDays()` — consecutive **local calendar** days with ≥1 activity, streak “alive” only
    if **today or yesterday** has activity; otherwise `0`
  - `formatStudyDuration(seconds)` — display helper (`30s`, `45m`, `2h 15m`)

### What counts as a study day / time

- **Recorded** only when the user **finishes a flashcard deck** or **finishes a quiz** (same moments as
  meaningful completion, not partial sessions).
- **Duration:** elapsed seconds from session start to that completion (flashcards already had session timing;
  quizzes gained a `sessionStartRef` when questions load).

### Instrumentation

- [`client/src/pages/app/Flashcards.jsx`](client/src/pages/app/Flashcards.jsx) — on deck completion, calls
  `recordStudyActivity({ type: "flashcards", durationSec, courseId, deckId })`
- [`client/src/pages/app/QuizSession.jsx`](client/src/pages/app/QuizSession.jsx) — on `handleFinish` when
  `questions.length > 0`, records `type: "quiz"` with duration; **retake** resets the session timer

### UI

- [`client/src/pages/app/Analytics.jsx`](client/src/pages/app/Analytics.jsx) — new **responsive** row **above**
  “Weekly Quiz Performance” and “Topics Mastery”: **Study streak** + **Total study time** (mint-bordered
  `bg-surface` cards, theme-aware copy; notes data is per browser / device)
- [`client/src/pages/app/Dashboard.jsx`](client/src/pages/app/Dashboard.jsx) — **Study Streak** stat card shows
  live streak; subtitle shows formatted **total study time** when `> 0`, else encouragement to finish a deck or quiz

---

## Phase 15 — Gamification + Badges - Updated (4/22/26)

### Goal
Add a backend-driven **gamification layer** that tracks user progression stats, awards badges automatically (no duplicates),
and exposes a dedicated **Rewards** UI showing earned + locked badges with progress

### Database + models

- New tables (Alembic):
  - `gamification_stats` — per-user counters, points, streak, last activity date
  - `badges` — global badge definitions (includes `icon` as an **internal slug**)
  - `user_badges` — earned badges, unique per (`user_id`, `badge_id`)
  - `quiz_session_completions` — **idempotency** for quiz completion (unique per (`user_id`, `study_set_id`))
- Migration: `server/alembic/versions/993ae03c4cd6_add_gamification_tables.py`
- Models:
  - `server/models/gamification_stats.py`
  - `server/models/badge.py`
  - `server/models/user_badge.py`
  - `server/models/quiz_session_completion.py`

### Service layer (centralized logic)

- `server/services/gamification.py`
  - Points defaults:
    - flashcard review = 10
    - quiz attempt = 15
    - quiz completion bonus = 25
  - Streak is backend source-of-truth (UTC calendar days)
  - Badge awarding is duplicate-safe (unique constraint + idempotent checks)
  - Badge progress calculation powers the rewards UI

### Backend APIs + integration points

- New endpoints:
  - `GET /users/me/gamification` — returns `stats` + `earned_badges`
  - `GET /badges` — returns all badge definitions merged with user state (earned/progress) when authenticated
  - `POST /quiz-sessions/complete` — explicit quiz completion, **idempotent** via `quiz_session_completions`
- Integration points (reuse existing activity writes):
  - `server/routes/progress.py`
    - flashcard review submission updates gamification
    - quiz attempt submission updates gamification
- Router wiring: `server/app/main.py` includes new routers (`users`, `badges`, `quiz_sessions`)

### Seeding + one-time backfill

- Default badge seed definitions live in `server/utils/badge_seed.py` and use **icon slugs** (e.g. `trophy`, `flame`, `sparkles`)
- Scripts:
  - `server/scripts/seed_badges.py`
  - `server/scripts/backfill_gamification.py --award-badges`
    - Backfills existing counts for: flashcard reviews + quiz attempts
    - Retro-awards **non-streak** badges derivable from backfilled counts/points (streak badges excluded)

### Frontend UI

- New page: `client/src/pages/app/Rewards.jsx` (route: `/rewards`)
- New components:
  - `client/src/components/gamification/GamificationStats.jsx`
  - `client/src/components/gamification/BadgeGrid.jsx`
  - `client/src/components/gamification/BadgeCard.jsx`
  - `client/src/components/gamification/PointsLegend.jsx` — “How Points Work” points legend (collapsible, default collapsed)
- Icon mapping (no static assets required): `client/src/components/gamification/badgeIcons.js`
  - Uses `lucide-react`
  - Unknown slugs fall back to the **trophy** icon
- New service: `client/src/services/gamificationService.js`
- Navigation: added “Rewards” to the main sidebar nav (`MainAppPageLayout.jsx`)
- Small integrations:
  - `QuizSession.jsx` calls `POST /quiz-sessions/complete` on finish (safe to retry)
  - Dashboard/Analytics display backend streak/points/totals while keeping **study time** client-side for now
  - Rewards: shows a “How Points Work” panel explaining point awards (flashcards +10, quiz attempts +15, quiz completion +25); rendered only after data load