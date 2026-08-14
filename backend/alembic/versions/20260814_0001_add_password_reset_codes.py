"""Add password_reset_codes table for email OTP password reset.

Revision ID: 20260814_0001
Revises: 20260811_0001
Create Date: 2026-08-14
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260814_0001"
down_revision: Union[str, None] = "20260811_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "password_reset_codes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("code", sa.String(6), nullable=False),
        sa.Column(
            "is_used",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_password_reset_codes_user_id",
        "password_reset_codes",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_password_reset_codes_user_id", table_name="password_reset_codes")
    op.drop_table("password_reset_codes")
