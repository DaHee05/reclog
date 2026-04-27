from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.database import engine, Base
from app.models import User, Record, RecordImage, RecordTag, Category  # noqa: F401
from app.routers import health
from app.routers import records
from app.routers import categories
from app.routers import upload
from app.routers import photobooks
from app.routers import users
from app.routers import generate
from app.routers import places

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Reclog API",
    version="0.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


app.include_router(health.router)
app.include_router(records.router)
app.include_router(categories.router)
app.include_router(upload.router)
app.include_router(photobooks.router)
app.include_router(users.router)
app.include_router(generate.router)
app.include_router(places.router)
