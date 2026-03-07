# ClassmateAI

**ClassmateAI** is an AI-powered study companion that transforms your lecture notes into interactive learning materials — automatically.

Upload your notes, and ClassmateAI uses Google Gemini to instantly generate flashcards, multiple-choice quizzes, summaries, and study guides. Study the generated content, track your performance, and identify where you need the most practice.

> **Project Status: Alpha** — Core features are functional. See [Project Status](#project-status) for details.

---

## Table of Contents

- [Introduction](#introduction)
- [Alpha Features](#alpha-features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Development Setup](#development-setup)
- [License](#license)
- [Contributors](#contributors)
- [Project Status](#project-status)

---

## Introduction

Students often accumulate large volumes of lecture notes but struggle to convert them into effective study resources. ClassmateAI bridges this gap by:

1. **Accepting raw lecture notes** — paste or type your notes into the app
2. **Generating study materials automatically** — flashcards, quizzes, summaries, and study guides are created by AI in seconds
3. **Letting you study actively** — flip through flashcards, take quizzes with instant feedback
4. **Tracking your progress** — analytics help identify knowledge gaps over time

---

## Alpha Features

These features will be complete by the end of the month:

- **Account system** — register and log in with email and password (JWT-based auth)
- **Course management** — create named courses and organize notes within them
- **AI-generated flashcards** — front/back cards generated from your notes via Google Gemini
- **AI-generated quizzes** — multiple-choice questions with explanations, generated from your notes
- **AI-generated summaries** — concise summaries of uploaded notes
- **AI-generated study guides** — detailed study guides extracted from your notes
- **Flashcard study mode** — flip-card interface with Previous / Skip / Next navigation
- **Quiz session mode** — answer questions one at a time, track correct/incorrect
- **Progress analytics dashboard** — visualize study activity and performance over time

> The AI component is central to the product: all study materials (flashcards, quizzes, summaries, and study guides) are generated entirely by the **Google Gemini 2.5 Flash** model from the user's raw notes.

---

## Technologies

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| React Router v7 | Client-side routing |
| TailwindCSS v4 | Utility-first styling |
| Axios | HTTP client for API calls |

### Backend
| Technology | Purpose |
|---|---|
| Python 3.13 | Runtime |
| FastAPI | REST API framework |
| SQLAlchemy 2.0 | ORM |
| Alembic | Database migrations |
| psycopg3 | PostgreSQL driver |
| bcrypt + python-jose | Password hashing and JWT authentication |

### Database
| Technology | Purpose |
|---|---|
| PostgreSQL 17 | Primary database |
| Supabase | Hosted production database |
| Docker + pgAdmin | Local development database |

### AI & APIs
| Technology | Purpose |
|---|---|
| Google Gemini 2.5 Flash | Generates flashcards, quizzes, summaries, and study guides from notes |
| `google-genai` SDK | Official Python client for the Gemini API |

### Deployment
| Service | Purpose |
|---|---|
| Vercel | Frontend (React) and backend (FastAPI) hosting |

---

## Installation

ClassmateAI is a web application — no installation is required for end users.

1. Visit the app at: **[https://classmateai-five.vercel.app](https://classmateai-five.vercel.app)**
2. Click **Create Account** and register with your name, email, and password
3. Once logged in, click **+ New Course** and give it a name (e.g. "Biology 101")
4. Open the course, click **Upload Notes**, and paste in your lecture notes
5. Click **Generate** — the AI will create your flashcards, quiz, summary, and study guide
6. Use the **Flashcards** and **Quizzes** tabs in the sidebar to study

---

## Development Setup

Follow these steps to run ClassmateAI locally for development.

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Python 3.13](https://www.python.org/downloads/) (use `py` on Windows)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local PostgreSQL)
- A [Google AI Studio](https://aistudio.google.com/) account to get a free Gemini API key

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
- Interactive API docs (Swagger): `http://localhost:8000/docs`
- DB connection test: `http://localhost:8000/db-test`

---

### 5. Frontend setup

```bash
cd client
```

Create a `.env` file:

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

> Use `classmateai_postgres` (the Docker container name) — not `localhost` — when adding the server in pgAdmin.

---

### Network note (Full Sail campus)

The school network blocks outbound connections to Supabase (`db.xxxx.supabase.co:5432`). Use the local Docker setup above, or connect via a mobile hotspot.

---

### Project structure

```
classmateai/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       └── services/
├── server/          # FastAPI backend
│   ├── app/
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   ├── services/    # AI generation logic
│   └── utils/
└── docker/          # Local PostgreSQL + pgAdmin
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

The core application loop is functional end-to-end:
- User registration and login
- Course creation and note uploads
- AI generation of flashcards, quizzes, summaries, and study guides
- Flashcard study mode and quiz session mode
- Basic analytics dashboard

**Known limitations in Alpha:**
- No spaced-repetition scheduling (confidence ratings are recorded but not yet used for scheduling)
- No mobile-optimized layout
- No email verification or password reset

Active development is ongoing. The project is not yet production-ready for general use.