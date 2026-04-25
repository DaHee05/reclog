import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    nickname: str
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
