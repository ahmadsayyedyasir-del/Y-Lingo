"""Add Phase 7 AI Conversation Coach tables: message_feedback, session_coaching_reports,
session_vocabulary_learned, session_grammar_mistakes.

Revision ID: 20260807_0001
Revises: 20260806_0001
Create Date: 2026-08-07
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260807_0001"
down_revision: Union[str, None] = "20260806_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -- message_feedback -----------------------------------------------
    op.create_table(
        "message_feedback",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("message_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("has_mistake", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("corrected_text", sa.Text(), nullable=True),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("natural_alternative", sa.Text(), nullable=True),
        sa.Column("vocabulary_suggestion", sa.Text(), nullable=True),
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
        sa.UniqueConstraint("message_id", name="uq_message_feedback_message_id"),
    )
    op.create_index("ix_message_feedback_message_id", "message_feedback", ["message_id"])
    op.create_index("ix_message_feedback_session_id", "message_feedback", ["session_id"])

    # -- session_coaching_reports -----------------------------------------
    op.create_table(
        "session_coaching_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("fluency_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("grammar_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("vocabulary_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("pronunciation_readiness_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "strengths",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "weaknesses",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "improvement_tips",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("recommended_practice", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column(
            "generated_at",
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
        sa.ForeignKeyConstraint(
            ["session_id"], ["conversation_sessions.id"], ondelete="CASCADE"
        ),
        sa.UniqueConstraint("session_id", name="uq_session_coaching_reports_session_id"),
        sa.CheckConstraint(
            "fluency_score BETWEEN 0 AND 100",
            name="ck_session_coaching_reports_fluency_score",
        ),
        sa.CheckConstraint(
            "grammar_score BETWEEN 0 AND 100",
            name="ck_session_coaching_reports_grammar_score",
        ),
        sa.CheckConstraint(
            "vocabulary_score BETWEEN 0 AND 100",
            name="ck_session_coaching_reports_vocabulary_score",
        ),
        sa.CheckConstraint(
            "pronunciation_readiness_score BETWEEN 0 AND 100",
            name="ck_session_coaching_reports_pronunciation_score",
        ),
    )
    op.create_index(
        "ix_session_coaching_reports_session_id",
        "session_coaching_reports",
        ["session_id"],
    )

    # -- session_vocabulary_learned -----------------------------------------
    op.create_table(
        "session_vocabulary_learned",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("word_or_phrase", sa.String(length=255), nullable=False),
        sa.Column("meaning", sa.Text(), nullable=True),
        sa.Column("example_sentence", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["session_id"], ["conversation_sessions.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        "ix_session_vocabulary_learned_session_id",
        "session_vocabulary_learned",
        ["session_id"],
    )

    # -- session_grammar_mistakes -----------------------------------------
    op.create_table(
        "session_grammar_mistakes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mistake_text", sa.Text(), nullable=False),
        sa.Column("correction", sa.Text(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(
            ["session_id"], ["conversation_sessions.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        "ix_session_grammar_mistakes_session_id",
        "session_grammar_mistakes",
        ["session_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_session_grammar_mistakes_session_id", table_name="session_grammar_mistakes")
    op.drop_table("session_grammar_mistakes")

    op.drop_index("ix_session_vocabulary_learned_session_id", table_name="session_vocabulary_learned")
    op.drop_table("session_vocabulary_learned")

    op.drop_index("ix_session_coaching_reports_session_id", table_name="session_coaching_reports")
    op.drop_table("session_coaching_reports")

    op.drop_index("ix_message_feedback_session_id", table_name="message_feedback")
    op.drop_index("ix_message_feedback_message_id", table_name="message_feedback")
    op.drop_table("message_feedback")