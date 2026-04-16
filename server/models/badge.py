import uuid

from sqlalchemy import UUID, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )

    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str] = mapped_column(String(100), nullable=False)

    requirement_type: Mapped[str] = mapped_column(String(50), nullable=False)
    requirement_value: Mapped[int] = mapped_column(Integer, nullable=False)

    points_reward: Mapped[int | None] = mapped_column(Integer, nullable=True)

    user_badges = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")

