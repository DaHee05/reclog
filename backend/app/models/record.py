from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Record(Base):
    __tablename__ = "records"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[Optional[str]] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    location: Mapped[Optional[str]] = mapped_column(String(200))
    category: Mapped[Optional[str]] = mapped_column(String(50), index=True)
    date: Mapped[Optional[date]] = mapped_column(Date, index=True)
    share_code: Mapped[Optional[str]] = mapped_column(String(10), unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped["User"] = relationship(back_populates="records")
    images: Mapped[List["RecordImage"]] = relationship(
        back_populates="record", cascade="all, delete-orphan", order_by="RecordImage.order"
    )
    tags: Mapped[List["RecordTag"]] = relationship(
        back_populates="record", cascade="all, delete-orphan"
    )


class RecordImage(Base):
    __tablename__ = "record_images"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    record_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("records.id", ondelete="CASCADE"), index=True
    )
    image_url: Mapped[str] = mapped_column(String(500))
    is_primary: Mapped[bool] = mapped_column(default=False)
    order: Mapped[int] = mapped_column(default=0)

    record: Mapped["Record"] = relationship(back_populates="images")


class RecordTag(Base):
    __tablename__ = "record_tags"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    record_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("records.id", ondelete="CASCADE"), index=True
    )
    tag_name: Mapped[str] = mapped_column(String(50), index=True)

    record: Mapped["Record"] = relationship(back_populates="tags")
