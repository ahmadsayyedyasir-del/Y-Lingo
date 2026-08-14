"""Add conversation_sessions and conversation_messages tables.

Revision ID: 20260806_0001
Revises: 20260805_0002
Create Date: 2026-08-06
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260806_0001"
down_revision: Union[str, None] = "20260805_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "conversation_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=True),
        sa.Column("target_language", sa.String(length=50), nullable=False),
        sa.Column("native_language", sa.String(length=50), nullable=False),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="active",
        ),
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
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.CheckConstraint(
            "status IN ('active', 'ended')",
            name="ck_conversation_sessions_status",
        ),
    )
    op.create_index(
        "ix_conversation_sessions_user_id",
        "conversation_sessions",
        ["user_id"],
    )
    op.create_index(
        "ix_conversation_sessions_user_id_created_at",
        "conversation_sessions",
        ["user_id", "created_at"],
    )

    op.create_table(
        "conversation_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["session_id"],
            ["conversation_sessions.id"],
            ondelete="CASCADE",
        ),
        sa.CheckConstraint(
            "role IN ('user', 'assistant', 'system')",
            name="ck_conversation_messages_role",
        ),
        sa.CheckConstraint(
            "length(trim(content)) > 0",
            name="ck_conversation_messages_content_not_blank",
        ),
        sa.UniqueConstraint(
            "session_id",
            "sequence",
            name="uq_conversation_messages_session_sequence",
        ),
    )
    op.create_index(
        "ix_conversation_messages_session_id",
        "conversation_messages",
        ["session_id"],
    )
    op.create_index(
        "ix_conversation_messages_session_id_sequence",
        "conversation_messages",
        ["session_id", "sequence"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_conversation_messages_session_id_sequence",
        table_name="conversation_messages",
    )
    op.drop_index(
        "ix_conversation_messages_session_id",
        table_name="conversation_messages",
    )
    op.drop_table("conversation_messages")

    op.drop_index(
        "ix_conversation_sessions_user_id_created_at",
        table_name="conversation_sessions",
    )
    op.drop_index(
        "ix_conversation_sessions_user_id",
        table_name="conversation_sessions",
    )
    op.drop_table("conversation_sessions")