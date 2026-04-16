from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Iterable

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.badge import Badge
from models.flashcard_review import FlashcardReview
from models.gamification_stats import GamificationStats
from models.quiz_attempt import QuizAttempt
from models.quiz_session_completion import QuizSessionCompletion
from models.study_set import StudySet
from models.user_badge import UserBadge


POINTS_FLASHCARD_REVIEW = 10
POINTS_QUIZ_ATTEMPT = 15
POINTS_QUIZ_COMPLETION = 25

# requirement types for badges
REQ_FLASHCARDS_REVIEWED = "flashcards_reviewed"
REQ_QUIZ_ATTEMPTS = "quiz_attempts"
REQ_QUIZZES_COMPLETED = "quizzes_completed"
REQ_STREAK_DAYS = "streak_days"
REQ_TOTAL_POINTS = "total_points"

NON_STREAK_REQUIREMENT_TYPES = {
    REQ_FLASHCARDS_REVIEWED,
    REQ_QUIZ_ATTEMPTS,
    REQ_QUIZZES_COMPLETED,
    REQ_TOTAL_POINTS,
}


def ensure_user_gamification_stats(db: Session, user_id: uuid.UUID) -> GamificationStats:
    stats = db.get(GamificationStats, user_id)
    if stats:
        return stats
    stats = GamificationStats(user_id=user_id)
    db.add(stats)
    db.flush()
    return stats


def _to_local_date_utc(dt: datetime) -> date:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).date()


def sync_streak(db: Session, user_id: uuid.UUID, activity_at: datetime) -> GamificationStats:
    stats = ensure_user_gamification_stats(db, user_id)
    activity_date = _to_local_date_utc(activity_at)

    if stats.last_activity_date is None:
        stats.current_streak_days = 1
        stats.longest_streak_days = max(stats.longest_streak_days, 1)
        stats.last_activity_date = activity_date
        return stats

    last = stats.last_activity_date
    if activity_date == last:
        return stats

    if activity_date == (last + (date.resolution)): # +1 day if the activity date is the same as the last activity date
        stats.current_streak_days += 1
    else:
        stats.current_streak_days = 1

    stats.longest_streak_days = max(stats.longest_streak_days, stats.current_streak_days)
    stats.last_activity_date = activity_date
    return stats


def add_points(db: Session, user_id: uuid.UUID, delta: int) -> GamificationStats:
    stats = ensure_user_gamification_stats(db, user_id)
    stats.total_points = max(0, (stats.total_points or 0) + int(delta))
    return stats


def record_flashcard_review_progress(db: Session, user_id: uuid.UUID, reviewed_at: datetime) -> GamificationStats:
    stats = ensure_user_gamification_stats(db, user_id)
    stats.total_flashcards_reviewed = (stats.total_flashcards_reviewed or 0) + 1
    add_points(db, user_id, POINTS_FLASHCARD_REVIEW)
    sync_streak(db, user_id, reviewed_at)
    check_and_award_badges(db, user_id)
    return stats


def record_quiz_attempt_progress(db: Session, user_id: uuid.UUID, attempted_at: datetime) -> GamificationStats:
    stats = ensure_user_gamification_stats(db, user_id)
    stats.total_quiz_attempts = (stats.total_quiz_attempts or 0) + 1
    add_points(db, user_id, POINTS_QUIZ_ATTEMPT)
    sync_streak(db, user_id, attempted_at)
    check_and_award_badges(db, user_id)
    return stats


@dataclass(frozen=True)
class QuizCompletionResult:
    already_completed: bool


def record_quiz_completion_progress(
    db: Session, user_id: uuid.UUID, study_set_id: uuid.UUID, completed_at: datetime | None = None
) -> QuizCompletionResult:
    ensure_user_gamification_stats(db, user_id)

    
    study_set = db.get(StudySet, study_set_id)
    if not study_set or study_set.user_id != user_id:
        raise ValueError("Study set not found")

    completion = QuizSessionCompletion(user_id=user_id, study_set_id=study_set_id)
    if completed_at is not None:
        completion.completed_at = completed_at

    db.add(completion)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        return QuizCompletionResult(already_completed=True)

    stats = db.get(GamificationStats, user_id)
    stats.total_quizzes_completed = (stats.total_quizzes_completed or 0) + 1
    add_points(db, user_id, POINTS_QUIZ_COMPLETION)
    sync_streak(db, user_id, completion.completed_at)
    check_and_award_badges(db, user_id)
    return QuizCompletionResult(already_completed=False)


def _progress_value(stats: GamificationStats, requirement_type: str) -> int:
    if requirement_type == REQ_FLASHCARDS_REVIEWED:
        return int(stats.total_flashcards_reviewed or 0)
    if requirement_type == REQ_QUIZ_ATTEMPTS:
        return int(stats.total_quiz_attempts or 0)
    if requirement_type == REQ_QUIZZES_COMPLETED:
        return int(stats.total_quizzes_completed or 0)
    if requirement_type == REQ_TOTAL_POINTS:
        return int(stats.total_points or 0)
    if requirement_type == REQ_STREAK_DAYS:
        return int(stats.current_streak_days or 0)
    return 0


def check_and_award_badges(db: Session, user_id: uuid.UUID, *, allowed_requirement_types: set[str] | None = None) -> None:
    stats = ensure_user_gamification_stats(db, user_id)

    q_badges = select(Badge)
    badges: Iterable[Badge] = db.execute(q_badges).scalars().all()
    if not badges:
        return

    earned_badge_ids = set(
        db.execute(select(UserBadge.badge_id).where(UserBadge.user_id == user_id)).scalars().all()
    )

    to_award: list[UserBadge] = []
    for badge in badges:
        if badge.id in earned_badge_ids:
            continue
        if allowed_requirement_types is not None and badge.requirement_type not in allowed_requirement_types:
            continue
        current = _progress_value(stats, badge.requirement_type)
        if current >= badge.requirement_value:
            to_award.append(UserBadge(user_id=user_id, badge_id=badge.id))

    if not to_award:
        return

    for ub in to_award:
        db.add(ub)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()


def get_user_badge_progress(db: Session, user_id: uuid.UUID | None) -> list[dict]:
    stats = ensure_user_gamification_stats(db, user_id) if user_id is not None else None

    earned: dict[uuid.UUID, datetime] = {}
    if user_id is not None:
        earned = {
            row.badge_id: row.awarded_at
            for row in db.execute(select(UserBadge).where(UserBadge.user_id == user_id)).scalars().all()
        }

    badges = db.execute(select(Badge)).scalars().all()
    out: list[dict] = []
    for badge in badges:
        target = int(badge.requirement_value)
        earned_at = earned.get(badge.id)

        current = None
        if stats is not None:
            current = _progress_value(stats, badge.requirement_type)

        out.append(
            {
                "id": badge.id,
                "slug": badge.slug,
                "name": badge.name,
                "description": badge.description,
                "icon": badge.icon,
                "requirement_type": badge.requirement_type,
                "requirement_value": badge.requirement_value,
                "points_reward": badge.points_reward,
                "earned": earned_at is not None,
                "awarded_at": earned_at,
                "progress_current": (min(current, target) if current is not None else None),
                "progress_target": (target if current is not None else None),
            }
        )
    return out


def backfill_counts_for_user(db: Session, user_id: uuid.UUID) -> GamificationStats:
    stats = ensure_user_gamification_stats(db, user_id)

    flash_count = db.execute(
        select(func.count(FlashcardReview.id)).where(FlashcardReview.user_id == user_id)
    ).scalar_one()
    quiz_attempt_count = db.execute(
        select(func.count(QuizAttempt.id)).where(QuizAttempt.user_id == user_id)
    ).scalar_one()

    stats.total_flashcards_reviewed = int(flash_count or 0)
    stats.total_quiz_attempts = int(quiz_attempt_count or 0)

    # Points from counts only (no streak retro-award)
    stats.total_points = (
        stats.total_flashcards_reviewed * POINTS_FLASHCARD_REVIEW
        + stats.total_quiz_attempts * POINTS_QUIZ_ATTEMPT
        + (stats.total_quizzes_completed or 0) * POINTS_QUIZ_COMPLETION
    )

    last_flash = db.execute(
        select(func.max(FlashcardReview.reviewed_at)).where(FlashcardReview.user_id == user_id)
    ).scalar_one()
    last_attempt = db.execute(
        select(func.max(QuizAttempt.attempted_at)).where(QuizAttempt.user_id == user_id)
    ).scalar_one()

    last_dt = None
    if last_flash and last_attempt:
        last_dt = max(last_flash, last_attempt)
    else:
        last_dt = last_flash or last_attempt

    stats.last_activity_date = _to_local_date_utc(last_dt) if last_dt else None
    stats.current_streak_days = 0
    stats.longest_streak_days = 0

    return stats

