"""Exercise persistence operations (Phase 10 read + Phase 11 admin write)."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.exercise import Exercise


class ExerciseRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Phase 10 — reads (publish-agnostic; Exercise has no is_published field) (unchanged)
    # ------------------------------------------------------------------

    def list_for_lesson(self, lesson_id: UUID) -> list[Exercise]:
        stmt = select(Exercise).where(Exercise.lesson_id == lesson_id).order_by(Exercise.order_index.asc())
        return list(self.db.scalars(stmt).all())

    def get_by_id(self, exercise_id: UUID) -> Exercise | None:
        return self.db.get(Exercise, exercise_id)

    def count_for_lesson(self, lesson_id: UUID) -> int:
        stmt = select(func.count()).select_from(Exercise).where(Exercise.lesson_id == lesson_id)
        return int(self.db.scalar(stmt) or 0)

    # ------------------------------------------------------------------
    # Phase 11 — admin writes
    # ------------------------------------------------------------------

    def get_max_order_index(self, lesson_id: UUID) -> int:
        stmt = (
            select(Exercise.order_index)
            .where(Exercise.lesson_id == lesson_id)
            .order_by(Exercise.order_index.desc())
        )
        result = self.db.scalars(stmt).first()
        return result or 0

    def get_by_lesson_and_order(self, lesson_id: UUID, order_index: int) -> Exercise | None:
        stmt = select(Exercise).where(Exercise.lesson_id == lesson_id, Exercise.order_index == order_index)
        return self.db.scalar(stmt)

    def create(
        self,
        *,
        lesson_id: UUID,
        exercise_type: str,
        prompt: str,
        content: dict,
        points: int,
        order_index: int,
    ) -> Exercise:
        exercise = Exercise(
            lesson_id=lesson_id,
            exercise_type=exercise_type,
            prompt=prompt,
            content=content,
            points=points,
            order_index=order_index,
        )
        self.db.add(exercise)
        self.db.flush()
        self.db.refresh(exercise)
        return exercise

    def update(self, exercise: Exercise, data: dict) -> Exercise:
        for field, value in data.items():
            setattr(exercise, field, value)
        self.db.flush()
        self.db.refresh(exercise)
        return exercise

    def delete(self, exercise: Exercise) -> None:
        self.db.delete(exercise)
        self.db.flush()