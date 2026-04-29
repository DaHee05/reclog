import uuid
from datetime import datetime
from typing import List

from pydantic import BaseModel


class SharedSpaceCreate(BaseModel):
    category_name: str
    category_emoji: str = "📝"


class SharedSpaceRead(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    category_name: str
    category_emoji: str
    code: str
    member_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SharedSpaceUpdate(BaseModel):
    category_name: str


class JoinSpaceRequest(BaseModel):
    code: str


class SpaceRecordRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    poster_nickname: str
    title: str | None = None
    content: str
    content_preview: str = ""
    location: str | None = None
    category: str | None = None
    date: str | None = None
    tags: List[str] = []
    images: List[dict] = []
    created_at: datetime
    updated_at: datetime
