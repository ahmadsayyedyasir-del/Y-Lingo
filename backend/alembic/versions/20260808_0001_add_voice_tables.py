"""Add Phase 8 voice table: message_audio.

Revision ID: 20260808_0001
Revises: 20260807_0001
Create Date: 2026-08-08
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260808_0001"
down_revision: Union[str, None] = "20260807_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "message_audio",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("message_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source", sa.String(length=20), nullable=False),
        sa.Column("audio_url", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=50), nullable=False),
        sa.Column("duration_seconds", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["message_id"], ["conversation_messages.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["session_id"], ["conversation_sessions.id"], ondelete="CASCADE"
        ),
        sa.UniqueConstraint("message_id", name="uq_message_audio_message_id"),
        sa.CheckConstraint(
            "source IN ('input', 'generated')",
            name="ck_message_audio_source",
        ),
    )
    op.create_index("ix_message_audio_message_id", "message_audio", ["message_id"])
    op.create_index("ix_message_audio_session_id", "message_audio", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_message_audio_session_id", table_name="message_audio")
    op.drop_index("ix_message_audio_message_id", table_name="message_audio")
    op.drop_table("message_audio")