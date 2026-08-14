"""Add ielts_attempts table for storing IELTS practice scores.

Revision ID: 20260814_0002
Revises: 20260814_0001
Create Date: 2026-08-14
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260814_0002"
down_revision: Union[str, None] = "20260814_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ielts_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("skill", sa.String(20), nullable=False),
        sa.Column("raw_score", sa.Integer(), nullable=True),
        sa.Column("max_score", sa.Integer(), nullable=True),
        sa.Column("band_estimate", sa.String(5), nullable=True),
        sa.Column("task_type", sa.String(20), nullable=True),
        sa.Column("ai_feedback", sa.Text(), nullable=True),
        sa.Column("ai_details", postgresql.JSONB(), nullable=True),
        sa.Column("submitted_content", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_ielts_attempts_user_id", "ielts_attempts", ["user_id"])
    op.create_index("ix_ielts_attempts_skill", "ielts_attempts", ["skill"])
    op.create_index("ix_ielts_attempts_user_skill", "ielts_attempts", ["user_id", "skill"])


def downgrade() -> None:
    op.drop_index("ix_ielts_attempts_user_skill", table_name="ielts_attempts")
    op.drop_index("ix_ielts_attempts_skill", table_name="ielts_attempts")
    op.drop_index("ix_ielts_attempts_user_id", table_name="ielts_attempts")
    op.drop_table("ielts_attempts")
