"""fix_embedding_column_to_vector

Revision ID: 3e0d8aa3187c
Revises: 8502a41a6c67
Create Date: 2026-08-12 17:46:06.445892

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3e0d8aa3187c'
down_revision: Union[str, None] = '8502a41a6c67'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass