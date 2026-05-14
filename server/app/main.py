import os

import models
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from db import get_db, engine
from sqlalchemy import text
from routes.auth import router as auth_router
from routes.notes import router as notes_router
from routes.generate import router as generate_router
from routes.study_sets import router as study_sets_router
from routes.progress import router as progress_router
from routes.upload import router as upload_router
from routes.users import router as users_router
from routes.badges import router as badges_router
from routes.quiz_sessions import router as quiz_sessions_router
from routes.shares import router as shares_router
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from utils.rate_limit import limiter

_DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://classmateai-five.vercel.app",
    "http://classmateai-five.vercel.app",
]


def _build_cors_origins() -> list[str]:
    """Merge default origins with CORS_ORIGINS (comma-separated). No wildcards."""
    extra = os.getenv("CORS_ORIGINS", "")
    merged: list[str] = list(_DEFAULT_CORS_ORIGINS)
    for raw in extra.split(","):
        o = raw.strip()
        if o and o not in merged:
            merged.append(o)
    return merged


_CORS_METHODS = ("DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT")
# Keep "*" so preflight mirrors Access-Control-Request-Headers (e.g. Sentry, custom clients).
_CORS_HEADERS = ("*",)

app = FastAPI()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_cors_origins(),
    allow_origin_regex=r"https://classmateai-five.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=_CORS_METHODS,
    allow_headers=_CORS_HEADERS,
)


app.include_router(auth_router)
app.include_router(notes_router)
app.include_router(generate_router)
app.include_router(study_sets_router)
app.include_router(progress_router)
app.include_router(upload_router)
app.include_router(users_router)
app.include_router(badges_router)
app.include_router(quiz_sessions_router)
app.include_router(shares_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to ClassmateAI API"}

@app.get("/db-test")
def test_database(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT version()"))
        version = result.fetchone()[0]
        return {
            "status": "success",
            "message": "Database connected successfully!",
            "postgres_version": version
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
