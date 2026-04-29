import logging
import time
import uuid
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.category import Category
from app.models.user import User

logger = logging.getLogger(__name__)
settings = get_settings()
security = HTTPBearer()

# Supabase JWKS 캐시 (24시간 TTL)
_jwks_cache: dict | None = None
_jwks_cache_time: float = 0
_JWKS_TTL = 24 * 60 * 60  # 24시간


async def _get_jwks() -> dict:
    """Supabase JWKS 공개키를 가져와 캐시 (24시간 TTL)"""
    global _jwks_cache, _jwks_cache_time
    if _jwks_cache is None or (time.time() - _jwks_cache_time) > _JWKS_TTL:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json",
                headers={"apikey": settings.SUPABASE_ANON_KEY},
            )
            r.raise_for_status()
            _jwks_cache = r.json()
            _jwks_cache_time = time.time()
    return _jwks_cache


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        logger.debug("AUTH: fetching JWKS")
        jwks = await _get_jwks()
        key = jwks["keys"][0]
        logger.debug(f"AUTH: JWKS key alg={key.get('alg')}, kty={key.get('kty')}")
        payload = jwt.decode(
            token, key, algorithms=["ES256"], options={"verify_aud": False}
        )
        user_id_str: Optional[str] = payload.get("sub")
        logger.debug(f"AUTH: decoded sub={user_id_str}, email={payload.get('email')}")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )
        user_id = uuid.UUID(user_id_str)
        email: Optional[str] = payload.get("email")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"=== AUTH FAIL: {type(e).__name__}: {e} ===")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}"
        )

    # 1) ID로 조회
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user:
        logger.debug(f"AUTH: existing user found id={user.id}")
        return user

    logger.debug(f"AUTH: user not found by id, checking email={email}")

    # 2) 같은 이메일의 기존 유저가 있으면 데이터를 새 UUID로 이전
    if email:
        result = await db.execute(select(User).where(User.email == email))
        old_user = result.scalars().first()
        if old_user:
            old_id = old_user.id
            logger.debug(f"AUTH: migrating old user {old_id} -> {user_id}")
            # 새 유저를 먼저 만들고 → FK 이전 → 옛 유저 삭제
            nickname = old_user.nickname or email.split("@")[0]
            new_user = User(id=user_id, email=email, nickname=nickname)
            db.add(new_user)
            await db.flush()  # DB에 새 유저 INSERT (FK 참조 가능해짐)

            await db.execute(
                text("UPDATE records SET user_id = :new_id WHERE user_id = :old_id"),
                {"new_id": user_id, "old_id": old_id},
            )
            await db.execute(
                text("UPDATE categories SET user_id = :new_id WHERE user_id = :old_id"),
                {"new_id": user_id, "old_id": old_id},
            )
            await db.execute(
                text("UPDATE photobook_orders SET user_id = :new_id WHERE user_id = :old_id"),
                {"new_id": user_id, "old_id": old_id},
            )
            await db.delete(old_user)
            await db.commit()
            await db.refresh(new_user)
            logger.debug("AUTH: migration done")
            return new_user

    # 3) 완전히 새 유저 생성
    nickname = email.split("@")[0] if email else "user"
    user = User(id=user_id, email=email or "", nickname=nickname)
    db.add(user)
    db.add(Category(user_id=user_id, name="일상", emoji="", is_default=True))
    await db.commit()
    await db.refresh(user)

    return user
