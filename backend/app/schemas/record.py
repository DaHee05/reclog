import uuid
import datetime
from typing import Optional, List

from pydantic import BaseModel


# --- Image ---
class RecordImageCreate(BaseModel):
    image_url: str
    is_primary: bool = False
    order: int = 0


class RecordImageRead(BaseModel):
    id: uuid.UUID
    image_url: str
    is_primary: bool
    order: int

    model_config = {"from_attributes": True}


# --- Record ---
class RecordCreate(BaseModel):
    title: Optional[str] = None
    content: str
    location: Optional[str] = None
    category: Optional[str] = None
    date: Optional[datetime.date] = None
    tags: List[str] = []
    images: List[RecordImageCreate] = []


class RecordUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    date: Optional[datetime.date] = None
    tags: Optional[List[str]] = None
    images: Optional[List[RecordImageCreate]] = None


class RecordRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: Optional[str] = None
    content: str
    location: Optional[str] = None
    category: Optional[str] = None
    date: Optional[datetime.date] = None
    share_code: Optional[str] = None
    tags: List[str] = []
    images: List[RecordImageRead] = []
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class RecordListRead(BaseModel):
    id: uuid.UUID
    title: Optional[str] = None
    content_preview: str = ""
    location: Optional[str] = None
    category: Optional[str] = None
    date: Optional[datetime.date] = None
    tags: List[str] = []
    images: List[RecordImageRead] = []
    created_at: datetime.datetime

    model_config = {"from_attributes": True}
