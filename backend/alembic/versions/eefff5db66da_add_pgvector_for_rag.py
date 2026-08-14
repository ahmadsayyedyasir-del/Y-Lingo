"""add_pgvector_for_rag

Revision ID: eefff5db66da
Revises: 20260812_0001
Create Date: 2026-08-12 17:00:16.792649

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eefff5db66da'
down_revision: Union[str, None] = '20260812_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass