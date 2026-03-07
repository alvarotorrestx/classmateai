import uuid
from datetime import datetime
from sqlalchemy import UUID, Boolean, DateTime, ForeignKey, SmallInteger, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import Base


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    quiz_question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False
    )
    selected_index: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    attempted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user = relationship("User", back_populates="quiz_attempts")
    quiz_question = relationship("QuizQuestion", back_populates="attempts")
