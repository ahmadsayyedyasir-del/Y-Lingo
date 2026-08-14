"""initial tables

Revision ID: 20260804_0001
Revises:
Create Date: 2026-08-04
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260804_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("is_verified", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "profiles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("native_language", sa.String(length=50), nullable=False),
        sa.Column("learning_language", sa.String(length=50), nullable=False),
        sa.Column("level", sa.Integer(), server_default="1", nullable=False),
        sa.Column("learning_style", sa.String(length=50), server_default="conversation-first", nullable=False),
        sa.Column("daily_goal", sa.Integer(), server_default="50", nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_profiles_user_id", "profiles", ["user_id"], unique=True)

    op.create_table(
        "user_settings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("ai_speed", sa.String(length=20), server_default="normal", nullable=False),
        sa.Column("ai_voice", sa.String(length=20), server_default="female", nullable=False),
        sa.Column("grammar_correction", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("translation_enabled", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("email_notifications", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("daily_reminders", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("theme", sa.String(length=20), server_default="dark", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_user_settings_user_id", "user_settings", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_table("user_settings")
    op.drop_table("profiles")
    op.drop_table("users")