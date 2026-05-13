import uuid
from datetime import date, datetime

from pydantic import BaseModel


class GamificationStatsResponse(BaseModel):
    total_flashcards_reviewed: int
    total_quiz_attempts: int
    total_quizzes_completed: int
    total_points: int
    current_streak_days: int
    longest_streak_days: int
    last_activity_date: date | None = None

    model_config = {"from_attributes": True}


class EarnedBadgeResponse(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    description: str
    icon: str
    awarded_at: datetime


class UserGamificationResponse(BaseModel):
    stats: GamificationStatsResponse
    earned_badges: list[EarnedBadgeResponse]


class BadgeWithProgressResponse(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    description: str
    icon: str
    requirement_type: str
    requirement_value: int
    points_reward: int | None = None
    earned: bool
    awarded_at: datetime | None = None
    progress_current: int | None = None
    progress_target: int | None = None
    progress_label: str | None = None


class QuizSessionCompleteRequest(BaseModel):
    study_set_id: uuid.UUID


class QuizSessionCompleteResponse(BaseModel):
    already_completed: bool
    stats: GamificationStatsResponse

