# ClassmateAI

**ClassmateAI** is an AI-powered study companion that transforms your lecture notes into interactive learning materials — automatically.

Upload your notes as a PDF, PowerPoint, Word document, or text file, and ClassmateAI uses Google Gemini to generate flashcards, multiple-choice quizzes, and a study guide. Study the generated content, track your performance, earn badges, and share your study packs with classmates.

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
- **Email + password registration** — accounts require email verification before first login (link sent via Brevo)
- **Secure cookie-based auth** — access and refresh tokens stored in HttpOnly cookies; no tokens exposed to JavaScript
- **Automatic token refresh** — expired access tokens are silently refreshed in the background; failed refresh triggers logout
- **Session persistence** — browser refresh restores your session via `/auth/session` with no login flash
- **iOS / Safari compatible** — cookie SameSite and Secure flags are environment-driven to support cross-origin deployments on mobile browsers
- **Profile settings** — update your display name and upload a profile avatar (resized client-side to 150×150 JPEG before upload)

### Courses & Notes
- **Course creation** — create named courses
- **Multi-format upload** — upload lecture notes as PDF, PowerPoint (PPTX), Word (DOCX), plain text, or Markdown (up to 4 MB); legacy `.doc` files show a clear unsupported message
- **Add more content** — upload additional notes to an existing course at any time to generate fresh study materials
- **Course study guide** — an AI-generated, accumulated study guide that rebuilds from the full course content each time new notes are added
- **Dashboard** — shows recent courses and gamification stats at a glance
- **All Courses page** — full list with sort, select, and bulk delete

### AI Generation (Google Gemini 2.5 Flash)
- **Flashcards** — front/back cards generated from your notes
- **Multiple-choice quizzes** — 4-option questions with correct answer index and explanation
- **Study guides** — detailed, structured guides extracted from your notes
- **Regenerate on demand** — generate additional flashcard or quiz decks for any existing course at any time; choose to create a new deck or add to an existing one

### Study Modes
- **Flashcard study mode** — flip-card interface with Previous / Skip / Next navigation
- **Quiz session mode** — answer one question at a time with back/forward navigation; "Finish Quiz" only appears on the final question to prevent accidental submission
- **Submit confirmation modal** — a confirmation dialog before grading prevents accidentally ending a quiz mid-session
- **Quiz results screen** — score percentage, correct/incorrect/skipped counts, and a per-question review showing your answer vs. the correct answer with explanation for every question
- **Retake any quiz** — re-take any quiz from the results screen

### Export & Share
- **Individual exports** — download notes, study guide, flashcards, or quiz questions as Markdown files
- **Export everything** — download all content for a course as a ZIP archive
- **Share study packs** — generate a public share link for any course; recipients can preview the content and import it into their own account

### Progress & Gamification
- **Points** — earn points by studying: +10 per flashcard reviewed, +15 per quiz question answered, +25 for finishing a full quiz
- **Study streak** — consecutive days with study activity, displayed on the Rewards page with your all-time best
- **Badges** — unlock achievement badges based on study milestones; locked badges show progress bars toward the next unlock
- **Rewards page** — view all earned and locked badges, filter by status, and see how points are earned
- **Gamification tooltips** — each stat card shows a `?` tooltip explaining exactly how the number is calculated
- **Analytics** — study metrics dashboard tracking activity across courses

### UX & Polish
- **Landing page** — public marketing page at `/` with feature overview and CTAs before authentication
- **Persistent sidebar** — full navigation sidebar visible on all app pages on desktop; collapsible drawer on mobile
- **Onboarding tutorial** — 7-step guided tour shown automatically on first visit; re-accessible at any time via "How it works" in the account menu, available on every page of the app
- **Study recommendation nudge** — a floating ✨ button surfaces contextual study suggestions: on the Dashboard it cycles through all three recommendations (‹ 1 of 3 ›); on the Courses, Flashcards, and Quizzes pages it shows the single highest-priority action for that content type
- **Dark mode** — full dark/light theme toggle, respects system preference on first visit, persisted across sessions
- **Toast notifications** — slide-in feedback for all key actions (login, logout, course created, materials generated, items deleted, errors)
- **Skeleton loading** — shape-matched skeleton screens on every data-loading page to minimize layout shift
- **Delete controls** — hover trash icon on every card with inline confirm; bulk select + delete on the Courses page
- **Rate limiting** — API endpoints protected with per-user rate limits via slowapi

---

## Technologies

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 7 | Build tool and dev server |
| React Router | v7 | Client-side routing |
| TailwindCSS | v4 | Utility-first styling |
| Axios | — | HTTP client with automatic token-refresh interceptor |
| Lucide React | — | Icon library |
| fflate | — | Client-side ZIP creation for "Export Everything" |

### Backend

| Technology | Purpose |
|---|---|
| Python 3.13 | Runtime |
| FastAPI | REST API framework |
| SQLAlchemy 2.0 | ORM |
| Alembic | Database migrations |
| psycopg3 (`psycopg[binary]`) | PostgreSQL driver |
| bcrypt + python-jose | Password hashing and JWT signing |
| google-genai SDK | Official Python client for the Gemini API |
| pypdf | PDF text extraction |
| python-pptx | PowerPoint text extraction |
| python-docx | Word document text extraction |
| slowapi | Per-user API rate limiting |
| httpx | HTTP client used for Brevo email API calls |

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
- [Python 3.11+](https://www.python.org/downloads/) (`py` command on Windows)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- A [Google AI Studio](https://aistudio.google.com/) account for a Gemini API key
- A [Brevo](https://www.brevo.com/) account for a transactional email API key

---

### 1. Clone the repository

```bash
git clone https://github.com/alvarotorrestx/classmateai.git
cd classmateai
```

---

### 2. Start the local database

```bash
docker compose -f docker/compose.yml up -d
```

Starts PostgreSQL 17 on port `5432` and pgAdmin on port `5050`.

---

### 3. Backend setup

```bash
cd server
cp .env.example .env
```

Open `server/.env` and fill in all values:

```env
# Database
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/classmateai

# JWT — generate with: py -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=10080

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key-here

# Brevo (email verification)
BREVO_API_KEY=your-brevo-api-key-here
EMAIL_FROM=classmateai@example.com
FRONTEND_URL=http://localhost:5173
EMAIL_VERIFY_EXPIRE_MINUTES=60

# Auth cookies (defaults work for local dev — do not change unless deploying)
# COOKIE_SECURE=false
# COOKIE_SAMESITE=lax
```

Install dependencies and apply migrations:

```bash
py -m pip install -r requirements.txt
py -m alembic upgrade head
```

Start the server:

```bash
py -m uvicorn app.main:app
```

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

> **Windows note:** Use `py` instead of `python`. Do not use `&&` in PowerShell — run each command separately. Do not use `--reload`; it suppresses uvicorn request logs on Windows.

---

### 4. Frontend setup

Create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Install and run:

```bash
cd client
npm install
npm run dev
```

App: `http://localhost:5173`

---

### 5. pgAdmin (optional)

- URL: `http://localhost:5050`
- Login: `admin@classmateai.com` / `admin123`
- Add server: host = `classmateai_postgres`, port = `5432`, user = `postgres`, password = `postgres`

> Use the container name `classmateai_postgres` — not `localhost` — as the host when registering in pgAdmin.

---

### Network note (Full Sail campus)

The school network blocks outbound connections to Supabase (`db.xxxx.supabase.co:5432`). Use the local Docker setup above, or connect via a mobile hotspot when working against Supabase directly.

---

## Project Structure

```
classmateai/
├── client/                              # React 19 frontend (Vite 7)
│   └── src/
│       ├── assets/icons/                # SVG icons by category
│       ├── components/
│       │   ├── auth/                    # RequireAuth, RedirectIfAuth, AuthLoading
│       │   ├── gamification/            # BadgeCard, BadgeGrid, GamificationStats, PointsLegend
│       │   ├── layout/                  # MainAppPageLayout, InnerAppPageLayout
│       │   ├── loading/                 # SkeletonBlock, PageSkeletons
│       │   ├── modals/                  # DeleteCourseModal, SubmitQuizConfirmModal
│       │   ├── study/                   # ExportShareMenu, ShareStudyPackModal, RecommendationNudge
│       │   └── ui/                      # Badge, Button, Icon, ThemeToggle, Toast, Tooltip, TutorialModal
│       ├── context/                     # AuthContext, ToastContext
│       ├── hooks/                       # useAuth, useQuizHistory, useStudyMetrics, useTutorial
│       ├── pages/
│       │   ├── app/                     # Dashboard, AllCourses, Courses, NewCourse,
│       │   │                            #   UploadNotes, Processing, StudyMaterialsReady,
│       │   │                            #   AllFlashcards, Flashcards, AllQuizzes,
│       │   │                            #   Quizzes, QuizSession, Analytics,
│       │   │                            #   Rewards, AccountSettings
│       │   ├── auth/                    # Login, Register, VerifyEmail, VerifyEmailChange
│       │   └── public/                  # Landing, SharedContent, NotFound
│       ├── services/                    # api.js, accountService, gamificationService,
│       │                                #   noteService, shareService
│       └── utils/                       # apiBaseUrl, exportStudyContent, requestCache,
│                                        #   studyRecommendations, uploadLimits
│
├── server/                              # FastAPI backend
│   ├── app/
│   │   └── main.py                      # App entry point, router registration, CORS
│   ├── db/
│   │   └── __init__.py                  # SQLAlchemy engine (NullPool), session factory
│   ├── models/                          # SQLAlchemy ORM models (user, note, study_set,
│   │                                    #   flashcard, quiz_question, quiz_attempt,
│   │                                    #   study_guide, course_study_guide, badge,
│   │                                    #   gamification_stats, share_link, share_import)
│   ├── routes/
│   │   ├── auth.py                      # /auth/* — register, login, logout, refresh, session, verify-email
│   │   ├── notes.py                     # /notes/* — CRUD, add-content, course study guide
│   │   ├── study_sets.py                # /study-sets/* — read, delete
│   │   ├── generate.py                  # /notes/{id}/generate/* — full set, flashcards, quiz
│   │   ├── progress.py                  # Quiz attempts, flashcard reviews
│   │   ├── upload.py                    # /extract-text — multipart file parsing
│   │   ├── users.py                     # /users/me — profile read + update
│   │   ├── badges.py                    # /badges — badge definitions + earned status
│   │   ├── quiz_sessions.py             # Quiz session completion (gamification triggers)
│   │   └── shares.py                    # /shares — create link, preview, import
│   ├── schemas/                         # Pydantic request/response models
│   ├── services/
│   │   ├── ai.py                        # Gemini API calls with retry logic
│   │   └── file_parser.py               # Text extraction from PDF, PPTX, DOCX, TXT, MD
│   ├── utils/
│   │   ├── auth.py                      # JWT helpers (access, refresh, email-verification tokens)
│   │   ├── deps.py                      # get_current_user dependency
│   │   ├── email.py                     # Brevo email sender
│   │   ├── rate_limit.py                # slowapi limiter config
│   │   └── redirects.py                 # Safe internal redirect validation
│   └── alembic/                         # Migration history
│
└── docker/
    └── compose.yml                      # PostgreSQL 17 + pgAdmin 4
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
| GET | `/auth/session` | Cookie | Return current user (session hydration on page load) |
| POST | `/auth/verify-email` | No | Verify email with token from link |
| POST | `/auth/resend-verification` | No | Resend verification email |

### Users (`/users`)

| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me/profile` | Update display name and/or avatar URL |

### Notes / Courses (`/notes`)

| Method | Path | Description |
|---|---|---|
| GET | `/notes` | List all courses |
| POST | `/notes` | Create course |
| GET | `/notes/{id}` | Get single course |
| PATCH | `/notes/{id}` | Update title or content |
| DELETE | `/notes/{id}` | Delete course (optional cascade for flashcards/quizzes) |
| POST | `/notes/{id}/add-content` | Append content + generate new study set |
| GET | `/notes/{id}/study-sets` | Get study sets for a course |
| GET | `/notes/{id}/study-guide` | Get accumulated course study guide |

### Study Sets (`/study-sets`)

| Method | Path | Description |
|---|---|---|
| GET | `/study-sets` | All study sets for current user |
| GET | `/study-sets/{id}` | Single study set with flashcards and quiz questions |
| DELETE | `/study-sets/{id}` | Delete entire study set |
| GET | `/study-sets/{id}/flashcards` | Get flashcards |
| DELETE | `/study-sets/{id}/flashcards` | Delete flashcards only |
| GET | `/study-sets/{id}/quiz` | Get quiz questions |
| DELETE | `/study-sets/{id}/quiz` | Delete quiz questions only |

### Generation

| Method | Path | Description |
|---|---|---|
| POST | `/notes/{id}/generate` | Generate full study set (flashcards + quiz + guide) |
| POST | `/notes/{id}/generate/flashcards` | Generate additional flashcards (optionally into an existing set) |
| POST | `/notes/{id}/generate/quiz` | Generate additional quiz questions (optionally into an existing set) |

### Progress & Gamification

| Method | Path | Description |
|---|---|---|
| POST | `/quiz/{id}/attempt` | Record a quiz question answer |
| POST | `/quiz-sessions/{id}/complete` | Mark a quiz session complete (awards points + streak) |
| GET | `/badges` | List all badge definitions with earned status and progress |

### File Upload

| Method | Path | Description |
|---|---|---|
| POST | `/extract-text` | Parse PDF, PPTX, DOCX, TXT, or MD file; return extracted text (4 MB limit) |

### Shares

| Method | Path | Description |
|---|---|---|
| POST | `/shares` | Create a share link for a course |
| GET | `/shares/{token}` | Preview shared content (public) |
| POST | `/shares/{token}/import` | Import shared content into your account |

---

## Deployment

The app is deployed as two separate Vercel projects:

| Project | URL |
|---|---|
| Frontend | `https://classmateai-five.vercel.app` |
| Backend API | `https://classmateai-api.vercel.app` |

`client/vercel.json` rewrites `/api/:path*` to the backend, so the frontend never makes cross-origin requests in production — all API calls go through the same domain.

**Frontend environment variable (set in Vercel dashboard):**
```
VITE_API_BASE_URL=   (leave empty — the /api rewrite handles routing)
```

**Backend environment variables (set in Vercel dashboard):**
```
DATABASE_URL          (Supabase connection string)
SECRET_KEY
GEMINI_API_KEY
BREVO_API_KEY
EMAIL_FROM
FRONTEND_URL          (https://classmateai-five.vercel.app)
COOKIE_SECURE=true
COOKIE_SAMESITE=none
CORS_ORIGINS          (any additional preview deployment URLs)
```

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

The full application is functional end-to-end across all features.

**What works:**
- Email-verified account registration and secure cookie-based authentication (iOS/Safari compatible)
- Profile settings with avatar upload
- Course creation with PDF, PPTX, DOCX, TXT, and Markdown upload (up to 4 MB)
- AI generation (flashcards, quizzes, study guides) via Gemini 2.5 Flash
- Regenerate additional flashcard or quiz decks for any existing course
- Accumulated course study guide that rebuilds as content is added
- Flashcard study mode
- Quiz sessions with navigation, submit confirmation, and full per-question results review
- Export notes, study guide, flashcards, and quizzes as Markdown; export everything as ZIP
- Share study packs via link; recipients can preview and import into their account
- Points, daily study streaks, and achievement badges
- Gamification stats with tooltip explanations on the Rewards page
- Analytics page with study metrics
- Persistent sidebar navigation on all app pages (hamburger drawer on mobile)
- Onboarding tutorial accessible from every page via the account menu
- Study recommendation nudge on Dashboard (cycles all 3), Courses, Flashcards, and Quizzes pages
- Dark mode with system-preference detection and persistence