# ClassmateAI

**ClassmateAI** is an AI-powered study companion that transforms your lecture notes into interactive learning materials — automatically.

Upload your notes (paste text or drop a PDF, PowerPoint, or text file), and ClassmateAI uses Google Gemini to generate flashcards, multiple-choice quizzes, summaries, and study guides. Study the generated content, track your performance, and let the app surface what you need to review next.

> **Project Status: Beta** — All core features are functional end-to-end. See [Project Status](#project-status) for details.

---

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [License](#license)
- [Contributors](#contributors)
- [Project Status](#project-status)

---

## Features

### Auth & Accounts
- **Email + password registration** — accounts require email verification before first login (verification link sent via Brevo)
- **Secure cookie-based auth** — access and refresh tokens stored in HttpOnly cookies; no tokens exposed to JavaScript
- **Automatic token refresh** — expired access tokens are silently refreshed in the background; failed refresh triggers logout
- **Session persistence** — browser refresh restores your session via `/auth/session` with no login flash

### Courses & Notes
- **Course creation** — create named courses (name + optional course code)
- **Multi-format upload** — upload lecture notes as PDF, PowerPoint (PPTX), plain text, or Markdown; or paste content directly
- **Add more content** — upload additional notes to an existing course at any time to generate fresh study materials
- **Course study guide** — an AI-generated, accumulated study guide that rebuilds from the full course content each time new notes are added
- **Dashboard** — shows 3 most recent courses with flashcard/quiz counts and mastery progress bars
- **All Courses page** — full list with sort, select, and bulk delete

### AI Generation (Google Gemini 2.5 Flash)
- **Flashcards** — front/back cards generated from your notes
- **Multiple-choice quizzes** — 4-option questions with correct answer index and explanation
- **Summaries** — concise summaries of the uploaded content
- **Study guides** — detailed, structured guides extracted from your notes
- **Regenerate on demand** — generate additional flashcard or quiz decks for any existing course at any time
- **Automatic retry** — transient Gemini API failures are retried up to 2 times before surfacing an error

### Study Modes
- **Flashcard study mode** — flip-card interface with Previous / Skip / Next navigation; confidence rating (Again / Hard / Good / Easy) recorded per card
- **Flashcard completion screen** — end-of-deck summary showing cards reviewed and session time, with a direct link to take the course quiz
- **Quiz session mode** — answer one question at a time with back/forward navigation; submit to see full results
- **Quiz results screen** — score percentage, correct/incorrect counts, and a per-question review showing your answer vs. the correct answer with explanation for every question
- **Retake any quiz** — re-take any quiz from the Quizzes page or results screen

### Progress & Analytics
- **Quiz history** — last 20 sessions stored locally (localStorage); browsable from the Quizzes tab with scores and retake links
- **Study streak** — consecutive days with a completed flashcard deck or quiz session, displayed on Dashboard and Analytics
- **Total study time** — accumulated time from completed flashcard and quiz sessions, tracked locally per device
- **Weekly performance chart** — 7-day bar chart of daily average quiz scores, color-coded (green ≥80%, mint ≥60%, red <60%), with hover tooltips
- **Topics mastery** — best quiz score per course, sorted with 100% mastered courses first; links to open the course or retake the quiz

### Study Recommendations
- **Suggested for you** — Dashboard surfaces up to 3 personalized study recommendations (quiz or flashcards) based on weak quiz scores and study history
- **Recommendation nudge** — floating action button on Flashcards and Quizzes pages with a glass-panel card showing the single best study pick

### UX & Polish
- **Dark mode** — full dark/light theme toggle, respects system preference on first visit, persisted across sessions
- **Toast notifications** — slide-in feedback for all key actions (login, logout, course created, materials generated, items deleted, errors)
- **Skeleton loading** — shape-matched skeleton screens on every data-loading page to minimize layout shift
- **Delete controls** — hover trash icon on every card (courses, flashcard decks, quiz decks) with inline confirm; bulk select + delete on the Courses page
- **Mobile navigation** — collapsible sidebar drawer on small screens

---

## Technologies

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 6 | Build tool and dev server |
| React Router | v7 | Client-side routing |
| TailwindCSS | v4 | Utility-first styling |
| Axios | — | HTTP client with automatic token-refresh interceptor |

### Backend

| Technology | Purpose |
|---|---|
| Python 3.13 | Runtime |
| FastAPI | REST API framework |
| SQLAlchemy 2.0 | ORM with eager-loading (`selectinload`) for performance |
| Alembic | Database migrations |
| psycopg3 | PostgreSQL driver |
| bcrypt + python-jose | Password hashing and JWT signing |
| google-genai SDK | Official Python client for the Gemini API |
| httpx | Async HTTP client used for Brevo email API calls |

### Services & Infrastructure

| Technology | Purpose |
|---|---|
| PostgreSQL 17 | Primary relational database |
| Supabase | Hosted production database |
| Docker + pgAdmin 4 | Local development database |
| Brevo | Transactional email (email verification) |
| Vercel | Frontend and backend hosting |

---

## Development Setup

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Python 3.13](https://www.python.org/downloads/) (`py` command on Windows)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- A [Google AI Studio](https://aistudio.google.com/) account for a Gemini API key
- A [Brevo](https://www.brevo.com/) account for a transactional email API key

---

### 1. Clone the repository

```bash
git clone https://github.com/your-org/classmateai.git
cd classmateai
```

---

### 2. Backend setup

```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill in all values:

```env
# Database
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/classmateai

# JWT
SECRET_KEY=<generate with: py -c "import secrets; print(secrets.token_hex(32))">
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=10080

# Google Gemini
GEMINI_API_KEY=<your key from https://aistudio.google.com/app/apikey>

# Brevo (email verification)
BREVO_API_KEY=<your Brevo API key>
EMAIL_FROM=<your verified sender address>
FRONTEND_URL=http://localhost:5173
EMAIL_VERIFY_EXPIRE_MINUTES=60
```

Install Python dependencies:

```bash
py -m pip install -r requirements.txt
```

---

### 3. Start the local database

```bash
docker compose -f docker/compose.yml up -d
```

Starts PostgreSQL 17 on port `5432` and pgAdmin on port `5050`. Then apply migrations:

```bash
cd server
py -m alembic upgrade head
```

---

### 4. Start the backend server

> **Windows note:** Do not use `&&` to chain commands in PowerShell — run each line separately. Do not use `--reload` — it hides request logs on Windows.

```bash
cd server
py -m uvicorn app.main:app
```

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

---

### 5. Frontend setup

```bash
cd client
```

Create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Install and run:

```bash
npm install
npm run dev
```

- App: `http://localhost:5173`

---

### 6. pgAdmin (optional)

- URL: `http://localhost:5050`
- Login: `admin@classmateai.com` / `admin123`
- Add server: host = `classmateai_postgres`, port = `5432`, user = `postgres`, password = `postgres`

> Use the container name `classmateai_postgres` — not `localhost` — as the host when registering in pgAdmin.

---

### Network note (Full Sail campus)

The school network blocks outbound connections to Supabase (`db.xxxx.supabase.co:5432`). Use the local Docker setup above, or connect via a mobile hotspot when running against Supabase.

---

## Project Structure

```
classmateai/
├── client/                              # React 19 frontend (Vite)
│   └── src/
│       ├── assets/icons/                # SVG icons by category
│       │   ├── core/
│       │   ├── navigation/
│       │   ├── status_and_feedback/
│       │   └── study_tools/
│       ├── components/
│       │   ├── auth/                    # AuthLoading, RequireAuth, RedirectIfAuth
│       │   ├── layout/                  # DefaultPageLayout, MainAppPageLayout, InnerAppPageLayout
│       │   ├── loading/                 # SkeletonBlock, PageSkeletons (per-page variants)
│       │   ├── modals/                  # DeleteCourseModal
│       │   ├── study/                   # RecommendationNudge
│       │   └── ui/                      # Button, Badge, Icon, Toast, ThemeToggle
│       ├── context/                     # AuthContext, ToastContext
│       ├── hooks/                       # useAuth, useQuizHistory, useStudyMetrics, useTheme
│       ├── pages/
│       │   ├── app/                     # Dashboard, AllCourses, Courses, NewCourse,
│       │   │                            #   UploadNotes, Processing, StudyMaterialsReady,
│       │   │                            #   AllFlashcards, Flashcards, AllQuizzes,
│       │   │                            #   Quizzes, QuizSession, Analytics
│       │   ├── auth/                    # Login, Register, VerifyEmail
│       │   └── public/                  # Landing, NotFound
│       ├── services/                    # api.js (Axios + refresh interceptor),
│       │                                #   authService.js, noteService.js, progressService.js
│       └── utils/                       # studyRecommendations.js
│
├── server/                              # FastAPI backend
│   ├── app/
│   │   └── main.py                      # FastAPI app + router registration + CORS
│   ├── db/
│   │   └── __init__.py                  # SQLAlchemy engine (connection pool), session factory
│   ├── models/                          # ORM models
│   │   ├── user.py                      # User (id, email, password_hash, full_name, is_verified)
│   │   ├── note.py                      # Note/Course (id, user_id, title, content)
│   │   ├── study_set.py                 # StudySet (id, user_id, note_id, label)
│   │   ├── flashcard.py                 # Flashcard (id, study_set_id, front, back, display_order)
│   │   ├── flashcard_review.py          # FlashcardReview (confidence 1–5, reviewed_at)
│   │   ├── quiz_question.py             # QuizQuestion (question, options JSONB, correct_index, explanation)
│   │   ├── quiz_attempt.py              # QuizAttempt (selected_index, is_correct, attempted_at)
│   │   ├── summary.py                   # Summary (study_set_id, content)
│   │   ├── study_guide.py               # StudyGuide (study_set_id, content)
│   │   └── course_study_guide.py        # CourseStudyGuide (note_id, accumulated content)
│   ├── routes/                          # API routers
│   │   ├── auth.py                      # /auth/* — register, login, logout, refresh, session, verify-email
│   │   ├── notes.py                     # /notes/* — CRUD + add-content + course study guide
│   │   ├── study_sets.py                # /study-sets/* — read + delete endpoints
│   │   ├── generate.py                  # /notes/{id}/generate/* — full set, flashcards-only, quiz-only
│   │   ├── progress.py                  # /quiz/*/attempt, /flashcards/*/review
│   │   └── upload.py                    # /extract-text — PDF, PPTX, TXT parsing
│   ├── schemas/                         # Pydantic request/response models
│   ├── services/
│   │   ├── ai.py                        # Gemini API calls with retry logic
│   │   └── file_parser.py               # Text extraction from PDF, PPTX, text files
│   ├── utils/
│   │   ├── auth.py                      # JWT helpers (access, refresh, email-verification tokens)
│   │   ├── deps.py                      # get_current_user dependency (cookie or header)
│   │   └── email.py                     # Brevo email sender
│   └── alembic/                         # Migration history
│
└── docker/                              # PostgreSQL 17 + pgAdmin 4 compose config
```

---

## API Reference

### Authentication (`/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create account, send verification email |
| POST | `/auth/login` | No | Login; sets access + refresh cookies |
| POST | `/auth/logout` | No | Clear auth cookies |
| POST | `/auth/refresh` | Cookie | Rotate both tokens |
| GET | `/auth/session` | Cookie | Return current user (used for session hydration) |
| POST | `/auth/verify-email` | No | Verify email with token from link |
| POST | `/auth/resend-verification` | No | Resend verification email |

### Notes / Courses (`/notes`)

| Method | Path | Description |
|---|---|---|
| GET | `/notes` | List all courses (title + metadata, no content) |
| POST | `/notes` | Create course |
| GET | `/notes/{id}` | Get single course (includes content) |
| PATCH | `/notes/{id}` | Update title or content |
| DELETE | `/notes/{id}` | Delete course (with options for flashcards/quizzes) |
| POST | `/notes/{id}/add-content` | Append content + generate new study set |
| GET | `/notes/{id}/study-guide` | Get accumulated course study guide |

### Study Sets (`/study-sets`)

| Method | Path | Description |
|---|---|---|
| GET | `/study-sets` | All study sets for current user (eager-loaded) |
| GET | `/notes/{id}/study-sets` | Study sets for a specific course |
| GET | `/study-sets/{id}` | Single study set |
| DELETE | `/study-sets/{id}` | Delete entire study set |
| GET | `/study-sets/{id}/flashcards` | Get flashcards |
| DELETE | `/study-sets/{id}/flashcards` | Delete flashcards |
| GET | `/study-sets/{id}/quiz` | Get quiz questions |
| DELETE | `/study-sets/{id}/quiz` | Delete quiz questions |
| GET | `/study-sets/{id}/summary` | Get summary |
| GET | `/study-sets/{id}/study-guide` | Get study guide |

### Generation (`/notes/{id}/generate`)

| Method | Path | Description |
|---|---|---|
| POST | `/notes/{id}/generate` | Generate full study set (flashcards + quiz + summary + guide) |
| POST | `/notes/{id}/generate/flashcards` | Generate additional flashcards |
| POST | `/notes/{id}/generate/quiz` | Generate additional quiz questions |

### Progress

| Method | Path | Description |
|---|---|---|
| POST | `/quiz/{id}/attempt` | Record quiz answer (correct/incorrect) |
| POST | `/flashcards/{id}/review` | Record flashcard confidence rating (1–5) |

### File Upload

| Method | Path | Description |
|---|---|---|
| POST | `/extract-text` | Parse PDF, PPTX, or text file; return extracted text (20 MB limit) |

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Patrick Caldwell, Alvaro Torres

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Contributors

| Name | Role |
|---|---|
| **Patrick Caldwell** | Full-Stack Developer |
| **Alvaro Torres** | Full-Stack Developer |

This project is maintained by Patrick Caldwell and Alvaro Torres as part of the Full Sail University Capstone program.

---

## Project Status

**Current state: Beta**

The full application loop is functional end-to-end across all features:

- Email-verified account registration and secure cookie-based authentication
- Course creation with PDF, PPTX, TXT, and Markdown upload support
- AI generation (flashcards, quizzes, summaries, study guides) via Gemini 2.5 Flash with automatic retry
- Regenerate additional flashcard or quiz decks for any existing course
- Accumulated course study guide that rebuilds as content is added
- Flashcard study mode with confidence ratings recorded to the database
- Quiz sessions with per-question back/forward navigation and full results review
- Quiz history (last 20 sessions) with retake links
- Study streak and total study time tracking per device
- Weekly quiz performance chart and topics mastery analytics
- Personalized study recommendations on Dashboard and study pages
- Dark mode with system-preference detection and persistence
- Toast notifications for all key actions
- Skeleton loading on all data-loading pages
- Delete controls on all content cards with bulk delete on Courses page
- Mobile-responsive navigation

**Known limitations:**

- No spaced-repetition scheduling — flashcard confidence ratings are recorded in the database but not yet used to schedule reviews
- No password reset flow
- Quiz history, study streak, and total study time are stored in the browser (localStorage) — they do not sync across devices or browsers
- No offline support
