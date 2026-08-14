"""convert embedding column from jsonb to vector

Revision ID: 20260813_0002
Revises: 20260813_0001
Create Date: 2026-08-13
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "20260813_0002"
down_revision: Union[str, None] = "20260813_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure vector extension is enabled
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    
    # Add a temporary vector column
    op.add_column('rag_document_chunks', sa.Column('embedding_vector', sa.Text(), nullable=True))
    
    # Convert existing JSONB embeddings to vector format
    # Since we use fallback embeddings (384 dimensions), we cast to vector
    op.execute("""
        UPDATE rag_document_chunks 
        SET embedding_vector = embedding::text 
        WHERE embedding IS NOT NULL;
    """)
    
    # Drop the old JSONB column
    op.drop_column('rag_document_chunks', 'embedding')
    
    # Rename the new column to embedding with vector type
    op.execute("""
        ALTER TABLE rag_document_chunks 
        RENAME COLUMN embedding_vector TO embedding;
    """)
    
    # Change column type to vector
    op.execute("""
        ALTER TABLE rag_document_chunks 
        ALTER COLUMN embedding TYPE vector(384) USING embedding::vector;
    """)
    
    # Create an index for faster search (cosine similarity)
    op.execute("""
        CREATE INDEX ix_rag_document_chunks_embedding_vector 
        ON rag_document_chunks USING ivfflat (embedding vector_cosine_ops);
    """)


def downgrade() -> None:
    # Drop the vector index
    op.execute("DROP INDEX IF EXISTS ix_rag_document_chunks_embedding_vector;")
    
    # Convert vector back to JSONB
    op.add_column('rag_document_chunks', sa.Column('embedding_json', JSONB, nullable=True))
    op.execute("""
        UPDATE rag_document_chunks 
        SET embedding_json = embedding::jsonb 
        WHERE embedding IS NOT NULL;
    """)
    
    op.drop_column('rag_document_chunks', 'embedding')
    op.alter_column('rag_document_chunks', 'embedding_json', new_column_name='embedding')