import uuid
from datetime import datetime

from sqlalchemy import UUID, DateTime, ForeignKey, UniqueConstraint, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class QuizSessionCompletion(Base):
    __tablename__ = "quiz_session_completions"
    __table_args__ = (
        UniqueConstraint("user_id", "study_set_id", name="uq_quiz_session_completions_user_study_set"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    study_set_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("study_sets.id", ondelete="CASCADE"), nullable=False
    )

    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", backref="quiz_session_completions")
    study_set = relationship("StudySet", backref="quiz_session_completions")

