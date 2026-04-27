import uuid
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.record import Record, RecordImage, RecordTag
from app.schemas.record import (
    RecordCreate,
    RecordUpdate,
    RecordRead,
    RecordListRead,
)

router = APIRouter(prefix="/api/records", tags=["records"])

# 임시 테스트 유저 ID (인증 연동 전까지 사용)
TEST_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


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
async def create_record(body: RecordCreate, db: AsyncSession = Depends(get_db)):
    if not body.content or not body.content.strip():
        raise HTTPException(status_code=422, detail="내용을 입력해주세요.")

    record = Record(
        user_id=TEST_USER_ID,
        title=body.title,
        content=body.content,
        location=body.location,
        category=body.category,
        date=body.date,
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


@router.get("", response_model=List[RecordListRead])
async def list_records(
    category: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Record)
        .where(Record.user_id == TEST_USER_ID)
        .options(selectinload(Record.images), selectinload(Record.tags))
        .order_by(Record.date.desc())
    )

    if category:
        stmt = stmt.where(Record.category == category)
    if year:
        stmt = stmt.where(func.extract("year", Record.date) == year)
    if month:
        stmt = stmt.where(func.extract("month", Record.date) == month)

    result = await db.execute(stmt)
    records = result.scalars().all()

    return [_record_to_read(r, preview=True) for r in records]


@router.get("/{record_id}", response_model=RecordRead)
async def get_record(record_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Record)
        .where(Record.id == record_id, Record.user_id == TEST_USER_ID)
        .options(selectinload(Record.images), selectinload(Record.tags))
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    return _record_to_read(record)


@router.put("/{record_id}", response_model=RecordRead)
async def update_record(
    record_id: uuid.UUID, body: RecordUpdate, db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Record)
        .where(Record.id == record_id, Record.user_id == TEST_USER_ID)
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
async def delete_record(record_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(Record).where(Record.id == record_id, Record.user_id == TEST_USER_ID)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    await db.delete(record)
    await db.commit()
