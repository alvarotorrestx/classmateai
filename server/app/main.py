import models
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from db import get_db, engine
from sqlalchemy import text
from routes.auth import router as auth_router
from routes.notes import router as notes_router
from routes.generate import router as generate_router
from routes.study_sets import router as study_sets_router
from routes.progress import router as progress_router

app = FastAPI()
app.include_router(auth_router)
app.include_router(notes_router)
app.include_router(generate_router)
app.include_router(study_sets_router)
app.include_router(progress_router)

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