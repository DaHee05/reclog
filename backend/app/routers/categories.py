import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.category import Category
from app.models.record import Record
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryRead

router = APIRouter(prefix="/api/categories", tags=["categories"])

DEFAULT_CATEGORIES = [
    {"name": "travel", "emoji": "✈️"},
    {"name": "daily", "emoji": "📖"},
]


async def _ensure_defaults(db: AsyncSession, user_id: uuid.UUID) -> None:
    """기본 카테고리가 없으면 자동 생성"""
    result = await db.execute(
        select(Category).where(
            Category.user_id == user_id, Category.is_default == True  # noqa: E712
        )
    )
    if not result.scalars().first():
        for cat in DEFAULT_CATEGORIES:
            db.add(Category(
                user_id=user_id,
                name=cat["name"],
                emoji=cat["emoji"],
                is_default=True,
            ))
        await db.commit()


@router.get("", response_model=List[CategoryRead])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _ensure_defaults(db, current_user.id)

    # 카테고리 + record_count 조회
    stmt = (
        select(
            Category,
            func.count(Record.id).label("record_count"),
        )
        .outerjoin(Record, Record.category == Category.name)
        .where(Category.user_id == current_user.id)
        .group_by(Category.id)
        .order_by(Category.is_default.desc(), Category.created_at)
    )

    result = await db.execute(stmt)
    rows = result.all()

    return [
        CategoryRead(
            id=cat.id,
            name=cat.name,
            emoji=cat.emoji,
            is_default=cat.is_default,
            record_count=count,
            created_at=cat.created_at,
        )
        for cat, count in rows
    ]


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 중복 체크
    existing = await db.execute(
        select(Category).where(
            Category.user_id == current_user.id, Category.name == body.name
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="이미 같은 이름의 카테고리가 있습니다")

    category = Category(
        user_id=current_user.id,
        name=body.name,
        emoji=body.emoji,
        is_default=False,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)

    return CategoryRead(
        id=category.id,
        name=category.name,
        emoji=category.emoji,
        is_default=category.is_default,
        record_count=0,
        created_at=category.created_at,
    )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Category).where(
            Category.id == category_id, Category.user_id == current_user.id
        )
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if category.is_default:
        raise HTTPException(status_code=400, detail="기본 카테고리는 삭제할 수 없습니다")

    await db.delete(category)
    await db.commit()
