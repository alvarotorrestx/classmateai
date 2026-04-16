from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db import get_db
from models.gamification_stats import GamificationStats
from models.user import User
from schemas.gamification import GamificationStatsResponse, QuizSessionCompleteRequest, QuizSessionCompleteResponse
from services.gamification import ensure_user_gamification_stats, record_quiz_completion_progress
from utils.deps import get_current_user


router = APIRouter(prefix="/quiz-sessions", tags=["quiz-sessions"])


@router.post("/complete", response_model=QuizSessionCompleteResponse, status_code=status.HTTP_200_OK)
def complete_quiz_session(
    body: QuizSessionCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = record_quiz_completion_progress(db, current_user.id, body.study_set_id)
        db.commit()
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study set not found")

    stats: GamificationStats = ensure_user_gamification_stats(db, current_user.id)
    return QuizSessionCompleteResponse(
        already_completed=result.already_completed,
        stats=GamificationStatsResponse.model_validate(stats),
    )

