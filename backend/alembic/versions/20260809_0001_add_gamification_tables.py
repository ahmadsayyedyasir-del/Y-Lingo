"""Add Phase 9 gamification tables: gamification_profiles, user_achievements.

Revision ID: 20260809_0001
Revises: 20260808_0001
Create Date: 2026-08-09
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260809_0001"
down_revision: Union[str, None] = "20260808_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "gamification_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("total_xp", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_messages_sent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_sessions_completed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("current_streak_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("longest_streak_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_activity_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", name="uq_gamification_profiles_user_id"),
    )
    op.create_index(
        "ix_gamification_profiles_user_id",
        "gamification_profiles",
        ["user_id"],
    )

    op.create_table(
        "user_achievements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("achievement_code", sa.String(length=50), nullable=False),
        sa.Column(
            "unlocked_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "user_id",
            "achievement_code",
            name="uq_user_achievements_user_achievement",
        ),
    )
    op.create_index("ix_user_achievements_user_id", "user_achievements", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_user_achievements_user_id", table_name="user_achievements")
    op.drop_table("user_achievements")

    op.drop_index("ix_gamification_profiles_user_id", table_name="gamification_profiles")
    op.drop_table("gamification_profiles")