import uuid
import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


# --- Image ---
class RecordImageCreate(BaseModel):
    image_url: str = Field(..., max_length=500)
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
    title: Optional[str] = Field(None, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)
    location: Optional[str] = Field(None, max_length=200)
    category: Optional[str] = Field(None, max_length=50)
    date: Optional[datetime.date] = None
    tags: List[str] = Field(default=[], max_length=10)
    images: List[RecordImageCreate] = Field(default=[], max_length=4)


class RecordUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    location: Optional[str] = Field(None, max_length=200)
    category: Optional[str] = Field(None, max_length=50)
    date: Optional[datetime.date] = None
    tags: Optional[List[str]] = Field(None, max_length=10)
    images: Optional[List[RecordImageCreate]] = Field(None, max_length=4)


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
