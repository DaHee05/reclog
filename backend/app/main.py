import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import get_settings
from app.database import async_session, engine, Base
from app.models import User, Record, RecordImage, RecordTag, Category  # noqa: F401
from app.routers import health
from app.routers import records
from app.routers import categories
from app.routers import upload
from app.routers import photobooks

settings = get_settings()

app = FastAPI(
    title="Reclog API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@app.on_event("startup")
async def on_startup():
    # 개발용: 테이블 자동 생성 + 테스트 유저
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        result = await session.execute(select(User).where(User.id == TEST_USER_ID))
        if not result.scalar_one_or_none():
            session.add(User(
                id=TEST_USER_ID,
                email="test@reclog.dev",
                nickname="테스트유저",
            ))
            await session.commit()


app.include_router(health.router)
app.include_router(records.router)
app.include_router(categories.router)
app.include_router(upload.router)
app.include_router(photobooks.router)
