import uuid
from datetime import date
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, delete, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.record import Record, RecordImage, RecordTag
from app.models.shared_space import SharedSpaceMember
from app.models.user import User
from app.schemas.record import (
    RecordCreate,
    RecordUpdate,
    RecordRead,
    RecordListRead,
)

router = APIRouter(prefix="/api/records", tags=["records"])


def _record_to_read(record: Record, *, preview: bool = False) -> dict:
    """Record ORM -> 응답용 dict 변환 (tags 평탄화)"""
    data = {
        **{c.key: getattr(record, c.key) for c in record.__table__.columns},
        "tags": [t.tag_name for t in record.tags],
        "images": record.images,
    }
    if preview:
        content = record.content or ""
        data["content_preview"] = content[:30] + ("…" if len(content) > 30 else "")
    return data


@router.post("", response_model=RecordRead, status_code=status.HTTP_201_CREATED)
async def create_record(
    body: RecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.content or not body.content.strip():
        raise HTTPException(status_code=422, detail="내용을 입력해주세요.")

    if body.space_id:
        member = (await db.execute(
            select(SharedSpaceMember).where(
                SharedSpaceMember.space_id == body.space_id,
                SharedSpaceMember.user_id == current_user.id,
            )
        )).scalar_one_or_none()
        if not member:
            raise HTTPException(status_code=403, detail="해당 공유 공간의 멤버가 아닙니다")

    record = Record(
        user_id=current_user.id,
        title=body.title,
        content=body.content,
        location=body.location,
        category=body.category,
        date=body.date,
        space_id=body.space_id,
    )

    for img in body.images:
        record.images.append(
            RecordImage(image_url=img.image_url, is_primary=img.is_primary, order=img.order)
        )

    for tag in body.tags:
        record.tags.append(RecordTag(tag_name=tag))

    db.add(record)
    await db.commit()
    await db.refresh(record, attribute_names=["images", "tags"])

    return _record_to_read(record)


@router.get("")
async def list_records(
    category: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(5, ge=1, le=100),
    include_shared: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base = (Record.user_id == current_user.id,) if include_shared else (Record.user_id == current_user.id, Record.space_id.is_(None))
    stmt = (
        select(Record)
        .where(*base)
        .options(selectinload(Record.images), selectinload(Record.tags))
        .order_by(Record.date.desc())
    )

    if category:
        stmt = stmt.where(Record.category == category)
    if year:
        stmt = stmt.where(func.extract("year", Record.date) == year)
    if month:
        stmt = stmt.where(func.extract("month", Record.date) == month)

    # 전체 개수 조회
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    # 페이지네이션 적용
    stmt = stmt.offset((page - 1) * size).limit(size)
    result = await db.execute(stmt)
    records = result.scalars().all()

    return {
        "items": [_record_to_read(r, preview=True) for r in records],
        "total": total,
        "page": page,
        "size": size,
        "total_pages": (total + size - 1) // size,
    }


@router.get("/stats")
async def get_record_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uid = current_user.id
    # 내가 올린 기록 전체 (공유 스페이스 포함)
    base_filter = Record.user_id == uid

    # 총 기록 수 + 고유 장소 수
    total_row = (await db.execute(
        select(
            func.count(Record.id).label("total"),
            func.count(func.distinct(Record.location)).label("unique_locations"),
        ).where(base_filter)
    )).one()

    # 카테고리별 수
    cat_rows = (await db.execute(
        select(Record.category, func.count(Record.id).label("cnt"))
        .where(base_filter)
        .group_by(Record.category)
    )).all()

    # 최근 6개월 월별 수 — DB에서 범위 필터 후 집계
    today = date.today()
    m = today.month - 5
    y = today.year + (m - 1) // 12
    m = ((m - 1) % 12) + 1
    six_months_start = date(y, m, 1)

    monthly_rows = (await db.execute(
        select(
            func.to_char(Record.date, "YYYY-MM").label("month"),
            func.count(Record.id).label("cnt"),
        )
        .where(base_filter, Record.date >= six_months_start)
        .group_by(text("1"))
        .order_by(text("1"))
    )).all()

    # 태그별 수 (상위 5개)
    tag_rows = (await db.execute(
        select(RecordTag.tag_name, func.count(RecordTag.id).label("cnt"))
        .join(Record, Record.id == RecordTag.record_id)
        .where(base_filter)
        .group_by(RecordTag.tag_name)
        .order_by(func.count(RecordTag.id).desc())
        .limit(5)
    )).all()

    return {
        "total_records": total_row.total,
        "unique_locations": total_row.unique_locations,
        "category_counts": [{"category": r.category, "count": r.cnt} for r in cat_rows],
        "monthly_counts": [{"month": r.month, "count": r.cnt} for r in monthly_rows],
        "top_tags": [{"tag": r.tag_name, "count": r.cnt} for r in tag_rows],
    }


@router.get("/{record_id}", response_model=RecordRead)
async def get_record(
    record_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Record)
        .where(Record.id == record_id, Record.user_id == current_user.id)
        .options(selectinload(Record.images), selectinload(Record.tags))
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    return _record_to_read(record)


@router.put("/{record_id}", response_model=RecordRead)
async def update_record(
    record_id: uuid.UUID,
    body: RecordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Record)
        .where(Record.id == record_id, Record.user_id == current_user.id)
        .options(selectinload(Record.images), selectinload(Record.tags))
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    # 일반 필드 업데이트
    for field in ["title", "content", "location", "category", "date"]:
        value = getattr(body, field, None)
        if value is not None:
            setattr(record, field, value)

    # 태그 교체: 기존 행 DELETE 후 새로 INSERT
    if body.tags is not None:
        await db.execute(
            delete(RecordTag).where(RecordTag.record_id == record.id)
        )
        await db.flush()
        record.tags = [RecordTag(tag_name=tag) for tag in body.tags]

    # 이미지 교체: 기존 행 DELETE 후 새로 INSERT
    if body.images is not None:
        await db.execute(
            delete(RecordImage).where(RecordImage.record_id == record.id)
        )
        await db.flush()
        record.images = [
            RecordImage(
                image_url=img.image_url,
                is_primary=img.is_primary,
                order=img.order,
            )
            for img in body.images
        ]

    await db.commit()
    await db.refresh(record, attribute_names=["images", "tags"])

    return _record_to_read(record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(
    record_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Record).where(Record.id == record_id, Record.user_id == current_user.id)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    await db.delete(record)
    await db.commit()
