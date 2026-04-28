from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, TYPE_CHECKING

from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class SharedSpace(Base):
    __tablename__ = "shared_spaces"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    category_name: Mapped[str] = mapped_column(String(50))
    category_emoji: Mapped[str] = mapped_column(String(10), default="📝")
    code: Mapped[str] = mapped_column(String(6), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    members: Mapped[List["SharedSpaceMember"]] = relationship(
        back_populates="space", cascade="all, delete-orphan"
    )


class SharedSpaceMember(Base):
    __tablename__ = "shared_space_members"
    __table_args__ = (UniqueConstraint("space_id", "user_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    space_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("shared_spaces.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    space: Mapped["SharedSpace"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship()
