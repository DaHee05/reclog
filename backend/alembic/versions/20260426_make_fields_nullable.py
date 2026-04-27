"""make location category date nullable

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-04-26
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("records", "location", existing_type=sa.String(200), nullable=True)
    op.alter_column("records", "category", existing_type=sa.String(50), nullable=True)
    op.alter_column("records", "date", existing_type=sa.Date(), nullable=True)


def downgrade() -> None:
    op.alter_column("records", "location", existing_type=sa.String(200), nullable=False)
    op.alter_column("records", "category", existing_type=sa.String(50), nullable=False)
    op.alter_column("records", "date", existing_type=sa.Date(), nullable=False)
