import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


from pydantic import field_validator
from typing import Optional as Opt

class UserUpdate(BaseModel):
    nickname: Opt[str] = None
    avatar_url: Opt[str] = None
    delete_avatar: bool = False


class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    nickname: str
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
