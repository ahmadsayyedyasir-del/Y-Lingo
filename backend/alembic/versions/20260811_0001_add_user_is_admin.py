"""Add is_admin column to users (Phase 11 admin authorization).

Revision ID: 20260811_0001
Revises: 20260810_0001
Create Date: 2026-08-11
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260811_0001"
down_revision: Union[str, None] = "20260810_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("users", "is_admin")