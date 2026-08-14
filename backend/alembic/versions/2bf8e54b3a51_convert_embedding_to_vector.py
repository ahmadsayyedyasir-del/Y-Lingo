"""convert_embedding_to_vector

Revision ID: 2bf8e54b3a51
Revises: eefff5db66da
Create Date: 2026-08-12 17:26:23.206974

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2bf8e54b3a51'
down_revision: Union[str, None] = 'eefff5db66da'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass