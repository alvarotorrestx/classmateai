# ClassmateAI

**ClassmateAI** is an intelligent study companion that transforms lecture notes into personalized learning materials. The application addresses a gap in the student learning experience: the ability to efficiently convert passive note-taking into active study materials. By leveraging pre-trained AI models, ClassmateAI automates the time-consuming process of creating study aids while identifying knowledge gaps through performance tracking.

------------------------------------------------------------------------

## Overview

Students often accumulate large volumes of lecture notes but struggle to
convert them into effective study resources.\
ClassmateAI bridges this gap by automatically generating interactive
learning materials using AI and tracking performance to identify
knowledge gaps.

**Core Idea:**\
Upload lecture notes → Generate study materials → Practice actively →
Improve using analytics.

------------------------------------------------------------------------

## Tech Stack

### Frontend

-   React 18
-   React Router
-   Axios
-   TailwindCSS (UI styling)

### Backend

-   Python 3.11+
-   FastAPI
-   SQLAlchemy
-   psycopg3

### Database

-   PostgreSQL 17 (Supabase — hosted)
-   Docker (local fallback — see Dev Setup)

### AI & APIs

-   Anthropic Claude API (NLP processing)

------------------------------------------------------------------------

## Architecture

-   **Frontend:** React SPA deployed via Vercel
-   **Backend:** FastAPI deployed via Vercel
-   **Database:** PostgreSQL via Supabase
-   **AI Layer:** Anthropic Claude API for content generation

------------------------------------------------------------------------

## Project Structure (High-Level)

    /client      → React application
    /server      → FastAPI application
    /docker      → Local PostgreSQL + pgAdmin (fallback only)

------------------------------------------------------------------------

## Dev Setup

### 1. Backend

```bash
cd server
cp .env.example .env   # fill in your DATABASE_URL (ask a teammate for credentials)
py -m pip install -r requirements.txt
py -m uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`. Test DB connection at `http://localhost:8000/db-test`.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

### 3. Database

**Default — Supabase (works on any network except Full Sail):**
Set `DATABASE_URL` in `server/.env` to the Supabase connection string (ask a teammate for credentials).

**Fallback — Local Docker (Full Sail / restricted networks):**
The school network blocks outbound connections to Supabase. Use Docker locally instead:

```bash
docker compose -f docker/compose.yml up -d
```

Then set `server/.env` to:
```
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/classmateai
```

pgAdmin available at `http://localhost:5050` (admin@classmateai.com / admin123).
Use container name `classmateai_postgres` (not `localhost`) as the host when adding a server in pgAdmin.

------------------------------------------------------------------------

## Team

-   **Patrick Caldwell**
-   **Alvaro Torres**
