from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.badge import Badge


@dataclass(frozen=True)
class BadgeSeed:
    slug: str
    name: str
    description: str
    icon: str
    requirement_type: str
    requirement_value: int
    points_reward: int | None = None


DEFAULT_BADGES: list[BadgeSeed] = [
    BadgeSeed(
        slug="first-flashcard",
        name="First Steps",
        description="Review your first flashcard",
        icon="sparkles",
        requirement_type="flashcards_reviewed",
        requirement_value=1,
    ),
    BadgeSeed(
        slug="first-quiz-attempt",
        name="Quiz Starter",
        description="Complete your first quiz attempt",
        icon="trophy",
        requirement_type="quiz_attempts",
        requirement_value=1,
    ),
    BadgeSeed(
        slug="flashcard-master",
        name="Flashcard Master",
        description="Review 100 flashcards",
        icon="sparkles",
        requirement_type="flashcards_reviewed",
        requirement_value=100,
    ),
    BadgeSeed(
        slug="quiz-master",
        name="Quiz Master",
        description="Complete 50 quiz attempts",
        icon="trophy",
        requirement_type="quiz_attempts",
        requirement_value=50,
    ),
    BadgeSeed(
        slug="streak-7",
        name="7 Day Streak",
        description="Study 7 days in a row",
        icon="flame",
        requirement_type="streak_days",
        requirement_value=7,
    ),
    BadgeSeed(
        slug="points-500",
        name="On a Roll",
        description="Earn 500 total points",
        icon="trophy",
        requirement_type="total_points",
        requirement_value=500,
    ),
]


def seed_default_badges(db: Session) -> int:
    existing = set(db.execute(select(Badge.slug)).scalars().all())
    created = 0
    for b in DEFAULT_BADGES:
        if b.slug in existing:
            continue
        db.add(
            Badge(
                slug=b.slug,
                name=b.name,
                description=b.description,
                icon=b.icon,
                requirement_type=b.requirement_type,
                requirement_value=b.requirement_value,
                points_reward=b.points_reward,
            )
        )
        created += 1
    return created

