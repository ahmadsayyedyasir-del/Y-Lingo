"""Unit persistence operations (Phase 10 read + Phase 11 admin write)."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.unit import Unit


class UnitRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Phase 10 — public, published-only reads (unchanged)
    # ------------------------------------------------------------------

    def list_published_for_curriculum(self, curriculum_id: UUID) -> list[Unit]:
        stmt = (
            select(Unit)
            .where(Unit.curriculum_id == curriculum_id, Unit.is_published.is_(True))
            .order_by(Unit.order_index.asc())
        )
        return list(self.db.scalars(stmt).all())

    def get_published_by_id(self, unit_id: UUID) -> Unit | None:
        stmt = select(Unit).where(Unit.id == unit_id, Unit.is_published.is_(True))
        return self.db.scalar(stmt)

    # ------------------------------------------------------------------
    # Phase 11 — admin reads (any publish state) + writes
    # ------------------------------------------------------------------

    def get_by_id_any_status(self, unit_id: UUID) -> Unit | None:
        return self.db.get(Unit, unit_id)

    def list_all_for_curriculum(self, curriculum_id: UUID) -> list[Unit]:
        stmt = select(Unit).where(Unit.curriculum_id == curriculum_id).order_by(Unit.order_index.asc())
        return list(self.db.scalars(stmt).all())

    def get_max_order_index(self, curriculum_id: UUID) -> int:
        stmt = (
            select(Unit.order_index)
            .where(Unit.curriculum_id == curriculum_id)
            .order_by(Unit.order_index.desc())
        )
        result = self.db.scalars(stmt).first()
        return result or 0

    def get_by_curriculum_and_order(self, curriculum_id: UUID, order_index: int) -> Unit | None:
        stmt = select(Unit).where(Unit.curriculum_id == curriculum_id, Unit.order_index == order_index)
        return self.db.scalar(stmt)

    def create(
        self,
        *,
        curriculum_id: UUID,
        title: str,
        description: str | None,
        order_index: int,
        is_published: bool = False,
    ) -> Unit:
        unit = Unit(
            curriculum_id=curriculum_id,
            title=title,
            description=description,
            order_index=order_index,
            is_published=is_published,
        )
        self.db.add(unit)
        self.db.flush()
        self.db.refresh(unit)
        return unit

    def update(self, unit: Unit, data: dict) -> Unit:
        for field, value in data.items():
            setattr(unit, field, value)
        self.db.flush()
        self.db.refresh(unit)
        return unit

    def delete(self, unit: Unit) -> None:
        self.db.delete(unit)
        self.db.flush()

    def set_published(self, unit: Unit, is_published: bool) -> Unit:
        unit.is_published = is_published
        self.db.flush()
        self.db.refresh(unit)
        return unit