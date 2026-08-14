"""add pgvector for RAG

Revision ID: 20260813_0001
Revises: 20260812_0001
Create Date: 2026-08-13
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260813_0001"
down_revision: Union[str, None] = "20260812_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    
    # Note: The embedding column already exists as JSON.
    # For pgvector, we would need to:
    # 1. Add a new vector column
    # 2. Convert existing JSON embeddings to vector
    # 3. Drop the JSON column
    
    # Since we want minimal migration impact, we'll keep the JSON column
    # and use it for storage. The vector search will be done using pgvector's
    # extension functions on the JSON data (converted on the fly).
    
    # Create a function to get embeddings as vector
    op.execute("""
        CREATE OR REPLACE FUNCTION embedding_to_vector(embedding JSON)
        RETURNS vector AS $$
        BEGIN
            RETURN embedding::text::vector;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Create index for faster search (optional, requires pgvector)
    # This index would need to be created after data is populated
    # Since we have JSON embeddings, we skip the index for now
    # and use the function in the query


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS embedding_to_vector(JSON);")
    # We cannot drop the extension if other tables depend on it
    # op.execute("DROP EXTENSION IF EXISTS vector;")