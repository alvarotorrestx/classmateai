import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db import get_db
from models.flashcard import Flashcard
from models.flashcard_review import FlashcardReview
from models.note import Note
from models.quiz_attempt import QuizAttempt
from models.quiz_question import QuizQuestion
from models.study_set import StudySet
from models.user import User
from schemas.study_content import (
    FlashcardReviewRequest,
    FlashcardReviewResponse,
    QuizAttemptRequest,
    QuizAttemptResponse,
)
from utils.deps import get_current_user
from services.gamification import record_flashcard_review_progress, record_quiz_attempt_progress

router = APIRouter(tags=["progress"])


@router.post("/quiz/{quiz_question_id}/attempt", response_model=QuizAttemptResponse, status_code=status.HTTP_201_CREATED)
def submit_attempt(
    quiz_question_id: uuid.UUID,
    body: QuizAttemptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = db.get(QuizQuestion, quiz_question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    study_set = db.get(StudySet, question.study_set_id)
    note = db.get(Note, study_set.note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    attempt = QuizAttempt(
        user_id=current_user.id,
        quiz_question_id=question.id,
        selected_index=body.selected_index,
        is_correct=body.selected_index == question.correct_index,
    )
    db.add(attempt)
    db.flush()
    db.refresh(attempt)

    record_quiz_attempt_progress(db, current_user.id, attempt.attempted_at)
    db.commit()

    return QuizAttemptResponse(
        id=attempt.id,
        quiz_question_id=attempt.quiz_question_id,
        selected_index=attempt.selected_index,
        is_correct=attempt.is_correct,
        correct_index=question.correct_index,
        attempted_at=attempt.attempted_at,
    )


@router.post("/flashcards/{flashcard_id}/review", response_model=FlashcardReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(
    flashcard_id: uuid.UUID,
    body: FlashcardReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    flashcard = db.get(Flashcard, flashcard_id)
    if not flashcard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found")

    study_set = db.get(StudySet, flashcard.study_set_id)
    note = db.get(Note, study_set.note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found")

    review = FlashcardReview(
        user_id=current_user.id,
        flashcard_id=flashcard.id,
        confidence=body.confidence,
    )
    db.add(review)
    db.flush()
    db.refresh(review)

    record_flashcard_review_progress(db, current_user.id, review.reviewed_at)
    db.commit()
    return review
