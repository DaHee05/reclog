import uuid
from datetime import datetime

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    emoji: str


class CategoryRead(BaseModel):
    id: uuid.UUID
    name: str
    emoji: str
    is_default: bool
    created_at: datetime

    model_config = {"from_attributes": True}
