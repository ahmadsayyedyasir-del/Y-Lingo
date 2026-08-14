"""drop and recreate embedding column as vector

Revision ID: 20260813_0004
Revises: 20260813_0003
Create Date: 2026-08-13
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "20260813_0004"
down_revision: Union[str, None] = "20260813_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable vector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    
    # Drop the existing embedding column if it exists
    op.execute("""
        ALTER TABLE rag_document_chunks DROP COLUMN IF EXISTS embedding;
    """)
    
    # Add new column as vector(384)
    op.execute("""
        ALTER TABLE rag_document_chunks ADD COLUMN embedding vector(384);
    """)
    
    # Create index for faster search
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_rag_document_chunks_embedding_vector 
        ON rag_document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    """)


def downgrade() -> None:
    # Drop index
    op.execute("DROP INDEX IF EXISTS ix_rag_document_chunks_embedding_vector;")
    # Drop vector column
    op.execute("ALTER TABLE rag_document_chunks DROP COLUMN IF EXISTS embedding;")
    # Re-add as JSONB
    op.add_column('rag_document_chunks', sa.Column('embedding', JSONB, nullable=True))