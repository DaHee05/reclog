import uuid
from datetime import datetime
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
