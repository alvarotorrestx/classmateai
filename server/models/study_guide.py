import uuid
from sqlalchemy import UUID, ForeignKey, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from models.base import Base, TimestampMixin


class StudyGuide(TimestampMixin, Base):
    __tablename__ = "study_guides"
    __table_args__ = (UniqueConstraint("study_set_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    study_set_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("study_sets.id", ondelete="CASCADE"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    study_set = relationship("StudySet", back_populates="study_guide")
