import uuid
from sqlalchemy import UUID, ForeignKey, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import Base, TimestampMixin


class Note(TimestampMixin, Base):
    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    user = relationship("User", back_populates="notes")
    # passive_deletes=True lets the DB handle SET NULL on study_sets.note_id
    # so study sets survive when their course is deleted
    study_sets = relationship("StudySet", back_populates="note", cascade="save-update, merge", passive_deletes=True)
    course_study_guide = relationship("CourseStudyGuide", back_populates="note", cascade="all, delete-orphan", uselist=False)
