from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from db import get_db, engine
from sqlalchemy import text

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to ClassmateAI API"}

@app.get("/db-test")
def test_database(db: Session = Depends(get_db)):
    """Test database connection"""
    try:
        # Test the connection by running a simple query
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