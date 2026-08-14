"""Lesson persistence operations (Phase 10 read + Phase 11 admin write)."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.lesson import Lesson
from app.models.unit import Unit


class LessonRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Phase 10 — public, published-only reads (unchanged)
    # ------------------------------------------------------------------

    def list_published_for_unit(self, unit_id: UUID) -> list[Lesson]:
        stmt = (
            select(Lesson)
            .where(Lesson.unit_id == unit_id, Lesson.is_published.is_(True))
            .order_by(Lesson.order_index.asc())
        )
        return list(self.db.scalars(stmt).all())

    def get_published_by_id(self, lesson_id: UUID) -> Lesson | None:
        stmt = select(Lesson).where(Lesson.id == lesson_id, Lesson.is_published.is_(True))
        return self.db.scalar(stmt)

    # ------------------------------------------------------------------
    # Phase 11 — admin reads (any publish state) + writes
    # ------------------------------------------------------------------

    def get_by_id_any_status(self, lesson_id: UUID) -> Lesson | None:
        return self.db.get(Lesson, lesson_id)

    def list_all_for_unit(self, unit_id: UUID) -> list[Lesson]:
        stmt = select(Lesson).where(Lesson.unit_id == unit_id).order_by(Lesson.order_index.asc())
        return list(self.db.scalars(stmt).all())

    def get_max_order_index(self, unit_id: UUID) -> int:
        stmt = (
            select(Lesson.order_index)
            .where(Lesson.unit_id == unit_id)
            .order_by(Lesson.order_index.desc())
        )
        result = self.db.scalars(stmt).first()
        return result or 0

    def get_by_unit_and_order(self, unit_id: UUID, order_index: int) -> Lesson | None:
        stmt = select(Lesson).where(Lesson.unit_id == unit_id, Lesson.order_index == order_index)
        return self.db.scalar(stmt)

    def create(
        self,
        *,
        unit_id: UUID,
        title: str,
        description: str | None,
        target_language: str,
        native_language: str | None,
        difficulty_level: str,
        estimated_duration_minutes: int,
        learning_objectives: list[str],
        order_index: int,
        is_published: bool = False,
    ) -> Lesson:
        lesson = Lesson(
            unit_id=unit_id,
            title=title,
            description=description,
            target_language=target_language,
            native_language=native_language,
            difficulty_level=difficulty_level,
            estimated_duration_minutes=estimated_duration_minutes,
            learning_objectives=learning_objectives,
            order_index=order_index,
            is_published=is_published,
        )
        self.db.add(lesson)
        self.db.flush()
        self.db.refresh(lesson)
        return lesson

    def update(self, lesson: Lesson, data: dict) -> Lesson:
        for field, value in data.items():
            setattr(lesson, field, value)
        self.db.flush()
        self.db.refresh(lesson)
        return lesson

    def delete(self, lesson: Lesson) -> None:
        self.db.delete(lesson)
        self.db.flush()

    def set_published(self, lesson: Lesson, is_published: bool) -> Lesson:
        lesson.is_published = is_published
        self.db.flush()
        self.db.refresh(lesson)
        return lesson

    def list_ids_for_unit(self, unit_id: UUID) -> list[UUID]:
        stmt = select(Lesson.id).where(Lesson.unit_id == unit_id)
        return list(self.db.scalars(stmt).all())

    def list_ids_for_curriculum(self, curriculum_id: UUID) -> list[UUID]:
        stmt = (
            select(Lesson.id)
            .join(Unit, Unit.id == Lesson.unit_id)
            .where(Unit.curriculum_id == curriculum_id)
        )
        return list(self.db.scalars(stmt).all())