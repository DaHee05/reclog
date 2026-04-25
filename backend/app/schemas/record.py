import uuid
from datetime import date, datetime

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
    title: str | None = None
    content: str
    location: str
    category: str
    date: date
    tags: list[str] = []
    images: list[RecordImageCreate] = []


class RecordUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    location: str | None = None
    category: str | None = None
    date: date | None = None
    tags: list[str] | None = None
    images: list[RecordImageCreate] | None = None


class RecordRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str | None = None
    content: str
    location: str
    category: str
    date: date
    share_code: str | None = None
    tags: list[str] = []
    images: list[RecordImageRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RecordListRead(BaseModel):
    id: uuid.UUID
    title: str | None = None
    location: str
    category: str
    date: date
    tags: list[str] = []
    images: list[RecordImageRead] = []
    created_at: datetime

    model_config = {"from_attributes": True}
