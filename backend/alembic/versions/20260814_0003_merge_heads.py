"""Merge multiple alembic heads into one.

Revision ID: 20260814_0003
Revises: 20260814_0002, 86a0e7b50640
Create Date: 2026-08-14
"""

from __future__ import annotations

from typing import Sequence, Union

revision: str = "20260814_0003"
down_revision: Union[str, tuple, None] = ("20260814_0002", "86a0e7b50640")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
