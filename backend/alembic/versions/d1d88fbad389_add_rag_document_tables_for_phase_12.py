"""Add RAG document tables for Phase 12.

Revision ID: 20260812_0001
Revises: 20260811_0001
Create Date: 2026-08-12
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260812_0001"
down_revision: Union[str, None] = "20260811_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # RAG Documents table
    op.create_table(
        "rag_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=False, server_default="general"),
        sa.Column("file_type", sa.String(length=20), nullable=False, server_default="pdf"),
        sa.Column("file_size", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("chunk_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="processing"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.CheckConstraint(
            "status IN ('processing', 'processed', 'error')",
            name="ck_rag_documents_status",
        ),
        sa.CheckConstraint(
            "category IN ('ielts', 'grammar', 'vocabulary', 'conversation', 'general')",
            name="ck_rag_documents_category",
        ),
    )
    op.create_index("ix_rag_documents_user_id", "rag_documents", ["user_id"])
    op.create_index("ix_rag_documents_user_id_category", "rag_documents", ["user_id", "category"])
    op.create_index("ix_rag_documents_status", "rag_documents", ["status"])

    # RAG Document Chunks table (with embedding)
    op.create_table(
        "rag_document_chunks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("embedding", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["document_id"], ["rag_documents.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("document_id", "chunk_index", name="uq_rag_chunks_document_index"),
    )
    op.create_index("ix_rag_document_chunks_document_id", "rag_document_chunks", ["document_id"])
    op.create_index(
        "ix_rag_document_chunks_document_id_index",
        "rag_document_chunks",
        ["document_id", "chunk_index"],
    )


def downgrade() -> None:
    op.drop_index("ix_rag_document_chunks_document_id_index", table_name="rag_document_chunks")
    op.drop_index("ix_rag_document_chunks_document_id", table_name="rag_document_chunks")
    op.drop_table("rag_document_chunks")

    op.drop_index("ix_rag_documents_status", table_name="rag_documents")
    op.drop_index("ix_rag_documents_user_id_category", table_name="rag_documents")
    op.drop_index("ix_rag_documents_user_id", table_name="rag_documents")
    op.drop_table("rag_documents")