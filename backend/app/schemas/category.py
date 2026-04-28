import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)


class CategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=50)


class CategoryRead(BaseModel):
    id: uuid.UUID
    name: str
    emoji: str
    is_default: bool
    record_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}
