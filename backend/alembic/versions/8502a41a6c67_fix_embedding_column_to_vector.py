"""fix_embedding_column_to_vector

Revision ID: 8502a41a6c67
Revises: 2bf8e54b3a51
Create Date: 2026-08-12 17:42:20.616766

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8502a41a6c67'
down_revision: Union[str, None] = '2bf8e54b3a51'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass