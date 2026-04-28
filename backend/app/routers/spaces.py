import random
import string
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.record import Record, RecordImage, RecordTag
from app.models.shared_space import SharedSpace, SharedSpaceMember
from app.models.user import User
from app.schemas.shared_space import SharedSpaceCreate, SharedSpaceRead, JoinSpaceRequest

router = APIRouter(prefix="/api/spaces", tags=["spaces"])

CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


async def _unique_code(db: AsyncSession) -> str:
    for _ in range(20):
        code = "".join(random.choices(CHARS, k=6))
        exists = (await db.execute(
            select(SharedSpace).where(SharedSpace.code == code)
        )).scalar_one_or_none()
        if not exists:
            return code
    raise HTTPException(status_code=500, detail="코드 생성에 실패했습니다")


def _space_to_dict(space: SharedSpace, member_count: int) -> dict:
    return {
        "id": space.id,
        "owner_id": space.owner_id,
        "category_name": space.category_name,
        "category_emoji": space.category_emoji,
        "code": space.code,
        "member_count": member_count,
        "created_at": space.created_at,
    }


@router.post("", response_model=SharedSpaceRead)
async def create_space(
    body: SharedSpaceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    code = await _unique_code(db)
    space = SharedSpace(
        owner_id=current_user.id,
        category_name=body.category_name,
        category_emoji=body.category_emoji,
        code=code,
    )
    db.add(space)
    await db.flush()

    db.add(SharedSpaceMember(space_id=space.id, user_id=current_user.id))
    await db.commit()
    await db.refresh(space)

    return _space_to_dict(space, 1)


@router.post("/join", response_model=SharedSpaceRead)
async def join_space(
    body: JoinSpaceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    space = (await db.execute(
        select(SharedSpace).where(SharedSpace.code == body.code.upper())
    )).scalar_one_or_none()

    if not space:
        raise HTTPException(status_code=404, detail="코드를 찾을 수 없습니다")

    already = (await db.execute(
        select(SharedSpaceMember).where(
            SharedSpaceMember.space_id == space.id,
            SharedSpaceMember.user_id == current_user.id,
        )
    )).scalar_one_or_none()

    if already:
        raise HTTPException(status_code=409, detail="이미 참여한 공유 공간입니다")

    db.add(SharedSpaceMember(space_id=space.id, user_id=current_user.id))
    await db.commit()

    member_count = (await db.execute(
        select(func.count()).select_from(SharedSpaceMember).where(SharedSpaceMember.space_id == space.id)
    )).scalar()

    return _space_to_dict(space, member_count)


@router.get("", response_model=List[SharedSpaceRead])
async def list_my_spaces(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(SharedSpace)
        .join(SharedSpaceMember, SharedSpaceMember.space_id == SharedSpace.id)
        .where(SharedSpaceMember.user_id == current_user.id)
        .order_by(SharedSpace.created_at.desc())
    )
    spaces = (await db.execute(stmt)).scalars().all()

    result = []
    for space in spaces:
        count = (await db.execute(
            select(func.count()).select_from(SharedSpaceMember).where(SharedSpaceMember.space_id == space.id)
        )).scalar()
        result.append(_space_to_dict(space, count))

    return result


@router.get("/{space_id}")
async def get_space(
    space_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = (await db.execute(
        select(SharedSpaceMember).where(
            SharedSpaceMember.space_id == space_id,
            SharedSpaceMember.user_id == current_user.id,
        )
    )).scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    space = (await db.execute(
        select(SharedSpace).where(SharedSpace.id == space_id)
    )).scalar_one_or_none()

    if not space:
        raise HTTPException(status_code=404, detail="공유 공간을 찾을 수 없습니다")

    count = (await db.execute(
        select(func.count()).select_from(SharedSpaceMember).where(SharedSpaceMember.space_id == space_id)
    )).scalar()

    return _space_to_dict(space, count)


@router.get("/{space_id}/records")
async def get_space_records(
    space_id: uuid.UUID,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = (await db.execute(
        select(SharedSpaceMember).where(
            SharedSpaceMember.space_id == space_id,
            SharedSpaceMember.user_id == current_user.id,
        )
    )).scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    base_stmt = (
        select(Record)
        .where(Record.space_id == space_id)
        .options(selectinload(Record.images), selectinload(Record.tags))
        .order_by(Record.date.desc())
    )

    total = (await db.execute(
        select(func.count()).select_from(base_stmt.subquery())
    )).scalar() or 0

    records = (await db.execute(
        base_stmt.offset((page - 1) * size).limit(size)
    )).scalars().all()

    # 포스터 닉네임 일괄 조회
    user_ids = list({r.user_id for r in records})
    users = (await db.execute(
        select(User).where(User.id.in_(user_ids))
    )).scalars().all()
    nickname_map = {u.id: u.nickname for u in users}

    items = []
    for r in records:
        content = r.content or ""
        items.append({
            "id": r.id,
            "user_id": r.user_id,
            "poster_nickname": nickname_map.get(r.user_id, "알 수 없음"),
            "title": r.title,
            "content": r.content,
            "content_preview": content[:30] + ("…" if len(content) > 30 else ""),
            "location": r.location,
            "category": r.category,
            "date": str(r.date) if r.date else None,
            "tags": [t.tag_name for t in r.tags],
            "images": [{"id": str(img.id), "image_url": img.image_url, "is_primary": img.is_primary, "order": img.order} for img in r.images],
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "total_pages": (total + size - 1) // size,
    }
