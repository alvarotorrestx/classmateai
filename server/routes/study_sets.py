import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from db import get_db
from models.flashcard import Flashcard
from models.note import Note
from models.quiz_question import QuizQuestion
from models.study_set import StudySet
from models.user import User
from schemas.study_set import (
    FlashcardResponse,
    StudyGuideResponse,
    StudySetListResponse,
    StudySetResponse,
    SummaryResponse,
    QuizQuestionResponse,
)
from utils.deps import get_current_user

router = APIRouter(tags=["study-sets"])


def _get_owned_study_set(study_set_id: uuid.UUID, db: Session, current_user: User) -> StudySet:
    # Ownership is now tracked directly via user_id, so this works even when note_id is NULL
    study_set = db.get(StudySet, study_set_id)
    if not study_set or study_set.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study set not found")
    return study_set


def _study_set_load_options():
    """Full load for single-item endpoints (includes summary and study_guide)."""
    return [
        selectinload(StudySet.flashcards),
        selectinload(StudySet.quiz_questions),
        selectinload(StudySet.summary),
        selectinload(StudySet.study_guide),
    ]


def _study_set_list_load_options():
    """Lightweight load for list endpoints — skips summary/study_guide text blobs."""
    return [
        selectinload(StudySet.flashcards),
        selectinload(StudySet.quiz_questions),
    ]


@router.get("/study-sets", response_model=list[StudySetListResponse])
def list_all_study_sets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Query by user_id directly so orphaned study sets (course deleted) are still included
    return (
        db.query(StudySet)
        .filter(StudySet.user_id == current_user.id)
        .options(*_study_set_list_load_options())
        .all()
    )


@router.get("/notes/{note_id}/study-sets", response_model=list[StudySetListResponse])
def list_study_sets(note_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.get(Note, note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return (
        db.query(StudySet)
        .filter(StudySet.note_id == note_id)
        .options(*_study_set_list_load_options())
        .all()
    )


@router.get("/study-sets/{study_set_id}", response_model=StudySetResponse)
def get_study_set(study_set_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _get_owned_study_set(study_set_id, db, current_user)


@router.get("/study-sets/{study_set_id}/flashcards", response_model=list[FlashcardResponse])
def get_flashcards(study_set_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    study_set = _get_owned_study_set(study_set_id, db, current_user)
    return study_set.flashcards


@router.get("/study-sets/{study_set_id}/quiz", response_model=list[QuizQuestionResponse])
def get_quiz(study_set_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    study_set = _get_owned_study_set(study_set_id, db, current_user)
    questions = []
    for q in study_set.quiz_questions:
        questions.append(QuizQuestionResponse(
            id=q.id,
            question=q.question,
            options=q.options,
            correct_index=q.correct_index,
            explanation=q.explanation,
            display_order=q.display_order,
        ))
    return questions


@router.get("/study-sets/{study_set_id}/summary", response_model=SummaryResponse)
def get_summary(study_set_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    study_set = _get_owned_study_set(study_set_id, db, current_user)
    if not study_set.summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No summary found")
    return study_set.summary


@router.get("/study-sets/{study_set_id}/study-guide", response_model=StudyGuideResponse)
def get_study_guide(study_set_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    study_set = _get_owned_study_set(study_set_id, db, current_user)
    if not study_set.study_guide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No study guide found")
    return study_set.study_guide


@router.delete("/study-sets/{study_set_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_set(study_set_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    study_set = _get_owned_study_set(study_set_id, db, current_user)
    db.delete(study_set)
    db.commit()


@router.delete("/study-sets/{study_set_id}/flashcards", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_set_flashcards(study_set_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    study_set = _get_owned_study_set(study_set_id, db, current_user)
    db.query(Flashcard).filter(Flashcard.study_set_id == study_set.id).delete(synchronize_session=False)
    remaining = db.query(func.count(QuizQuestion.id)).filter(QuizQuestion.study_set_id == study_set.id).scalar()
    if remaining == 0:
        db.delete(study_set)
    db.commit()


@router.delete("/study-sets/{study_set_id}/quiz", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_set_quiz(study_set_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    study_set = _get_owned_study_set(study_set_id, db, current_user)
    db.query(QuizQuestion).filter(QuizQuestion.study_set_id == study_set.id).delete(synchronize_session=False)
    remaining = db.query(func.count(Flashcard.id)).filter(Flashcard.study_set_id == study_set.id).scalar()
    if remaining == 0:
        db.delete(study_set)
    db.commit()
