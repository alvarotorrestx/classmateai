import uuid
from typing import Optional
from sqlalchemy import UUID, ForeignKey, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import Base, TimestampMixin


class StudySet(TimestampMixin, Base):
    __tablename__ = "study_sets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    note_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("notes.id", ondelete="SET NULL"), nullable=True
    )
    label: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    user = relationship("User", back_populates="study_sets")
    note = relationship("Note", back_populates="study_sets")
    flashcards = relationship("Flashcard", back_populates="study_set", cascade="all, delete-orphan")
    quiz_questions = relationship("QuizQuestion", back_populates="study_set", cascade="all, delete-orphan")
    summary = relationship("Summary", back_populates="study_set", cascade="all, delete-orphan", uselist=False)
    study_guide = relationship("StudyGuide", back_populates="study_set", cascade="all, delete-orphan", uselist=False)
