import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from db import get_db
from models.flashcard import Flashcard
from models.note import Note
from models.quiz_question import QuizQuestion
from models.study_guide import StudyGuide
from models.study_set import StudySet
from models.summary import Summary
from models.user import User
from schemas.study_set import StudySetResponse
from models.course_study_guide import CourseStudyGuide
from services.ai import generate_study_materials, generate_flashcards, generate_quiz
from utils.deps import get_current_user

router = APIRouter(tags=["generate"])


@router.post("/notes/{note_id}/generate", response_model=StudySetResponse, status_code=status.HTTP_201_CREATED)
def generate(note_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.get(Note, note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    # Idempotency: return existing study set if already generated for this note
    existing = db.query(StudySet).filter(StudySet.note_id == note.id).first()
    if existing:
        return existing

    try:
        data = generate_study_materials(note.content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI returned an unexpected response: {e}",
        )

    study_set = StudySet(note_id=note.id, user_id=current_user.id)
    db.add(study_set)
    db.flush()  # get study_set.id before inserting children

    for i, fc in enumerate(data["flashcards"]):
        db.add(Flashcard(study_set_id=study_set.id, front=fc["front"], back=fc["back"], display_order=i))

    for i, qq in enumerate(data["quiz_questions"]):
        db.add(QuizQuestion(
            study_set_id=study_set.id,
            question=qq["question"],
            options=qq["options"],
            correct_index=qq["correct_index"],
            explanation=qq.get("explanation"),
            display_order=i,
        ))

    db.add(Summary(study_set_id=study_set.id, content=data["summary"]))
    db.add(StudyGuide(study_set_id=study_set.id, content=data["study_guide"]))

    # Create course-level study guide from the initial generation
    if not db.query(CourseStudyGuide).filter(CourseStudyGuide.note_id == note.id).first():
        db.add(CourseStudyGuide(note_id=note.id, content=data["study_guide"]))

    db.commit()
    db.refresh(study_set)
    return study_set


@router.post("/notes/{note_id}/generate/flashcards", response_model=StudySetResponse)
def generate_new_flashcards(
    note_id: uuid.UUID,
    study_set_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.get(Note, note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    try:
        data = generate_flashcards(note.content)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI returned an unexpected response: {e}")

    if study_set_id:
        study_set = db.get(StudySet, study_set_id)
        if not study_set or study_set.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study set not found")
    else:
        study_set = StudySet(note_id=note.id, user_id=current_user.id)
        db.add(study_set)
        db.flush()

    offset = db.query(func.count(Flashcard.id)).filter(Flashcard.study_set_id == study_set.id).scalar()
    for i, fc in enumerate(data["flashcards"]):
        db.add(Flashcard(study_set_id=study_set.id, front=fc["front"], back=fc["back"], display_order=offset + i))

    db.commit()
    db.refresh(study_set)
    return study_set


@router.post("/notes/{note_id}/generate/quiz", response_model=StudySetResponse)
def generate_new_quiz(
    note_id: uuid.UUID,
    study_set_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.get(Note, note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    try:
        data = generate_quiz(note.content)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI returned an unexpected response: {e}")

    if study_set_id:
        study_set = db.get(StudySet, study_set_id)
        if not study_set or study_set.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study set not found")
    else:
        study_set = StudySet(note_id=note.id, user_id=current_user.id)
        db.add(study_set)
        db.flush()

    offset = db.query(func.count(QuizQuestion.id)).filter(QuizQuestion.study_set_id == study_set.id).scalar()
    for i, qq in enumerate(data["quiz_questions"]):
        db.add(QuizQuestion(
            study_set_id=study_set.id,
            question=qq["question"],
            options=qq["options"],
            correct_index=qq["correct_index"],
            explanation=qq.get("explanation"),
            display_order=offset + i,
        ))

    db.commit()
    db.refresh(study_set)
    return study_set
