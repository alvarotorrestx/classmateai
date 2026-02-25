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
-   Flask
-   Flask-CORS
-   PyPDF2

### Database

-   PostgreSQL

### AI & APIs

-   Anthropic Claude API (NLP processing)

------------------------------------------------------------------------

## Architecture

-   **Frontend:** React SPA deployed via Vercel
-   **Backend:** Flask API hosted on Heroku
-   **Database:** PostgreSQL
-   **AI Layer:** Pre-trained NLP models for content generation

------------------------------------------------------------------------

## Project Structure (High-Level)

    /client      → React application
    /server      → Flask API
    /db          → PostgreSQL schemas

------------------------------------------------------------------------

## Team

-   **Patrick Caldwell**
-   **Alvaro Torres**
