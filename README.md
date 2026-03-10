# ClassmateAI

**ClassmateAI** is an AI-powered study companion that transforms your lecture notes into interactive learning materials — automatically.

Upload your notes, and ClassmateAI uses Google Gemini to instantly generate flashcards, multiple-choice quizzes, summaries, and study guides. Study the generated content, take quizzes, review your results, and track your performance over time.

> **Project Status: Alpha** — Core features are functional end-to-end. See [Project Status](#project-status) for details.

---

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [License](#license)
- [Contributors](#contributors)
- [Project Status](#project-status)

---

## Introduction

Students often accumulate large volumes of lecture notes but struggle to convert them into effective study resources. ClassmateAI bridges this gap by:

1. **Accepting raw lecture notes** — paste your notes into the app under any course
2. **Generating study materials automatically** — flashcards, quizzes, summaries, and study guides are created by AI in seconds
3. **Letting you study actively** — flip through flashcards, take quizzes, and review detailed results
4. **Tracking your progress** — analytics show your weekly performance and highlight mastered courses

---

## Features

- **Account system** — register and log in with email and password (JWT-based auth)
- **Course management** — create named courses; dashboard shows the 3 most recent, Courses page shows all
- **AI-generated flashcards** — front/back cards generated from your notes via Google Gemini
- **AI-generated quizzes** — multiple-choice questions with explanations, generated from your notes
- **AI-generated summaries** — concise summaries of uploaded notes
- **AI-generated study guides** — detailed study guides extracted from your notes
- **Flashcard study mode** — flip-card interface with Previous / Skip / Next navigation
- **Quiz session mode** — answer questions one at a time with back/forward navigation; finish to see results
- **Quiz results screen** — score percentage, correct/incorrect counts, and a full per-question review showing your answer and the correct answer (with explanation) for every question
- **Quiz history** — last 20 quiz sessions stored locally; browse past results with scores and a quick Retake link from the Quizzes tab
- **Progress analytics** — weekly bar chart of average quiz scores by day (color-coded by performance); Topics Mastery section showing courses where you've scored 100%
- **404 page** — friendly not-found page for unknown routes
- **Mobile navigation** — collapsible sidebar drawer on small screens

> All study materials are generated entirely by the **Google Gemini 2.5 Flash** model from the user's raw notes.

---

## Technologies

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 6 | Build tool and dev server |
| React Router | v7 | Client-side routing |
| TailwindCSS | v4 | Utility-first styling |
| Axios | — | HTTP client for API calls |

### Backend

| Technology | Purpose |
|---|---|
| Python 3.13 | Runtime |
| FastAPI | REST API framework |
| SQLAlchemy 2.0 | ORM |
| Alembic | Database migrations |
| psycopg3 | PostgreSQL async driver |
| bcrypt + python-jose | Password hashing and JWT authentication |
| google-genai SDK | Official Python client for the Gemini API |

### Database & Infrastructure

| Technology | Purpose |
|---|---|
| PostgreSQL 17 | Primary relational database |
| Supabase | Hosted production database |
| Docker + pgAdmin 4 | Local development database |
| Vercel | Frontend and backend hosting |

---

## Installation

ClassmateAI is a web application — no installation required for end users.

1. Visit the app at: **[https://classmateai-five.vercel.app](https://classmateai-five.vercel.app)**
2. Click **Create Account** and register with your name, email, and password
3. Once logged in, click **+ New Course** and give it a name (e.g. "Biology 101")
4. Open the course, click **Upload Notes**, and paste in your lecture notes
5. Click **Generate** — the AI will create your flashcards, quiz, summary, and study guide
6. Use the **Flashcards** and **Quizzes** tabs in the sidebar to study

---

## Development Setup

Follow these steps to run ClassmateAI locally.

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Python 3.13](https://www.python.org/downloads/) (use `py` on Windows)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local PostgreSQL)
- A [Google AI Studio](https://aistudio.google.com/) account for a free Gemini API key

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

Open `server/.env` and fill in the required values:

```
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/classmateai
SECRET_KEY=<generate a random 32-byte hex string>
ACCESS_TOKEN_EXPIRE_MINUTES=30
GEMINI_API_KEY=<your Google Gemini API key>
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

This starts PostgreSQL 17 on port `5432` and pgAdmin on port `5050`.

Apply database migrations:

```bash
cd server
py -m alembic upgrade head
```

---

### 4. Start the backend server

> **Windows note:** Do NOT use `&&` to chain commands in PowerShell — run each line separately. Do NOT use `--reload` — it hides request logs on Windows.

```bash
cd server
py -m uvicorn app.main:app
```

- API: `http://localhost:8000`
- Interactive docs (Swagger): `http://localhost:8000/docs`

---

### 5. Frontend setup

```bash
cd client
```

Create `client/.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

- App: `http://localhost:5173`

---

### 6. pgAdmin (optional — visual database browser)

- URL: `http://localhost:5050`
- Login: `admin@classmateai.com` / `admin123`
- Add server: host = `classmateai_postgres`, port = `5432`, user = `postgres`, password = `postgres`

> Use `classmateai_postgres` (the Docker container name) — not `localhost` — as the host when registering the server in pgAdmin.

---

### Network note (Full Sail campus)

The school network blocks outbound connections to Supabase (`db.xxxx.supabase.co:5432`). Use the local Docker setup above, or connect via a mobile hotspot.

---

## Project Structure

```
classmateai/
├── client/                        # React 19 frontend (Vite)
│   └── src/
│       ├── assets/icons/          # SVG icons by category
│       │   ├── core/
│       │   ├── navigation/
│       │   ├── status_and_feedback/
│       │   └── study_tools/
│       ├── components/
│       │   ├── auth/              # RequireAuth, RedirectIfAuth
│       │   ├── layout/            # DefaultPageLayout, MainAppPageLayout, InnerAppPageLayout
│       │   └── ui/                # Button, Badge, Icon
│       ├── context/               # AuthContext
│       ├── hooks/                 # useAuth, useQuizHistory
│       ├── pages/
│       │   ├── app/               # Dashboard, AllCourses, Courses, NewCourse,
│       │   │                      #   UploadNotes, Processing, StudyMaterialsReady,
│       │   │                      #   AllFlashcards, Flashcards, AllQuizzes,
│       │   │                      #   Quizzes, QuizSession, Analytics
│       │   ├── auth/              # Login, Register
│       │   └── public/            # Landing, NotFound
│       └── services/              # api.js, authService.js, noteService.js
│
├── server/                        # FastAPI backend
│   ├── app/                       # main.py — FastAPI app + router registration
│   ├── db/                        # SQLAlchemy engine + session setup
│   ├── models/                    # ORM models (User, Note, StudySet, Flashcard,
│   │                              #   QuizQuestion, Summary, StudyGuide, etc.)
│   ├── routes/                    # auth, notes, study_sets, generate, progress
│   ├── schemas/                   # Pydantic request/response models
│   ├── services/                  # ai.py — Gemini API + prompt construction
│   ├── utils/                     # JWT helpers, get_current_user dependency
│   └── alembic/                   # Database migration history
│
└── docker/                        # PostgreSQL 17 + pgAdmin 4 compose config
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

**Current state: Alpha**

The full application loop is functional end-to-end:

- User registration and login
- Course creation, note uploads, and AI generation (flashcards, quizzes, summaries, study guides)
- Flashcard study mode and full quiz session mode with back/forward navigation
- Quiz results screen with per-question review — correct and incorrect answers shown for every question
- Quiz history (last 20 sessions) persisted in localStorage with retake links
- Analytics: weekly bar chart of average quiz scores by day + Topics Mastery for 100% courses
- Dashboard showing 3 most recent courses; dedicated All Courses page
- Mobile-friendly navigation sidebar
- 404 not-found page

**Known limitations:**

- No spaced-repetition scheduling — confidence ratings are recorded in the database but not yet used to schedule flashcard reviews
- No email verification or password reset
- Quiz history is stored in the browser (localStorage) — does not sync across devices or browsers
- No offline support