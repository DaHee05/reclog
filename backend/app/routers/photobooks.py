from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.photobook import PhotobookOrder, PhotobookStatus
from app.models.user import User
from app.schemas.photobook import PhotobookOrderCreate, PhotobookOrderRead, PhotobookOrderUpdate

router = APIRouter(prefix="/api/photobooks", tags=["photobooks"])


@router.post("", response_model=PhotobookOrderRead)
async def create_photobook_order(
    order_in: PhotobookOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_order = PhotobookOrder(
        user_id=current_user.id,
        title=order_in.title,
        category=order_in.category,
        start_date=order_in.start_date,
        end_date=order_in.end_date,
        status=PhotobookStatus.PENDING,
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    return new_order


@router.get("", response_model=List[PhotobookOrderRead])
async def read_photobook_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(PhotobookOrder).where(PhotobookOrder.user_id == current_user.id).order_by(PhotobookOrder.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{order_id}", response_model=PhotobookOrderRead)
async def read_photobook_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(PhotobookOrder).where(PhotobookOrder.id == order_id, PhotobookOrder.user_id == current_user.id)
    result = await db.execute(stmt)
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/status", response_model=PhotobookOrderRead)
async def update_photobook_order_status(
    order_id: UUID,
    status_update: PhotobookOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(PhotobookOrder).where(PhotobookOrder.id == order_id, PhotobookOrder.user_id == current_user.id)
    result = await db.execute(stmt)
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = status_update.status
    await db.commit()
    await db.refresh(order)
    return order
