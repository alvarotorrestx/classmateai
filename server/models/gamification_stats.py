import uuid
from datetime import date

from sqlalchemy import UUID, Date, ForeignKey, Integer, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base, TimestampMixin


class GamificationStats(TimestampMixin, Base):
    __tablename__ = "gamification_stats"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )

    total_flashcards_reviewed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_quiz_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_quizzes_completed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    current_streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    longest_streak_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    user = relationship("User", backref="gamification_stats", uselist=False)

