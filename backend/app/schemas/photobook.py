from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional
from uuid import UUID

from app.models.photobook import PhotobookStatus


class PhotobookOrderBase(BaseModel):
    title: str
    category: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class PhotobookOrderCreate(PhotobookOrderBase):
    pass


class PhotobookOrderUpdate(BaseModel):
    status: PhotobookStatus


class PhotobookOrderRead(PhotobookOrderBase):
    id: UUID
    user_id: UUID
    status: PhotobookStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
