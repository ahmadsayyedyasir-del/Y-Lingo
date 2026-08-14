"""drop_recreate_embedding_as_vector

Revision ID: 86a0e7b50640
Revises: 3e0d8aa3187c
Create Date: 2026-08-12 23:37:00.429549

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '86a0e7b50640'
down_revision: Union[str, None] = '3e0d8aa3187c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass