"""Business logic for admin curriculum authoring (Phase 11): create, update,
delete, publish/unpublish for curricula, units, lessons, and exercises.

Reuses the same exception types Phase 10 already defined for "not found"
(CurriculumNotFoundError, UnitNotFoundError, LessonNotFoundError,
ExerciseNotFoundError) rather than inventing admin-specific duplicates.
"""

from __future__ import annotations

from typing import Callable
from uuid import UUID

from app.core.exceptions import (
    ContentInUseError,
    CurriculumNotFoundError,
    DuplicateOrderIndexError,
    ExerciseNotFoundError,
    LessonNotFoundError,
    UnitNotFoundError,
)
from app.models.curriculum import Curriculum
from app.models.exercise import Exercise
from app.models.lesson import Lesson
from app.models.unit import Unit
from app.repositories.curriculum_repository import CurriculumRepository
from app.repositories.exercise_repository import ExerciseRepository
from app.repositories.lesson_repository import LessonRepository
from app.repositories.unit_repository import UnitRepository
from app.repositories.user_lesson_progress_repository import UserLessonProgressRepository
from app.services.exercise_grading import validate_exercise_content


class AdminCurriculumService:
    def __init__(
        self,
        curriculum_repository: CurriculumRepository,
        unit_repository: UnitRepository,
        lesson_repository: LessonRepository,
        exercise_repository: ExerciseRepository,
        progress_repository: UserLessonProgressRepository,
    ) -> None:
        self.curriculum_repository = curriculum_repository
        self.unit_repository = unit_repository
        self.lesson_repository = lesson_repository
        self.exercise_repository = exercise_repository
        self.progress_repository = progress_repository

    # ------------------------------------------------------------------
    # Curriculum
    # ------------------------------------------------------------------

    def list_curricula(self, target_language: str | None = None) -> list[Curriculum]:
        return self.curriculum_repository.list_all(target_language)

    def get_curriculum(self, curriculum_id: UUID) -> Curriculum:
        curriculum = self.curriculum_repository.get_by_id_any_status(curriculum_id)
        if curriculum is None:
            raise CurriculumNotFoundError()
        return curriculum

    def create_curriculum(
        self,
        *,
        title: str,
        description: str | None,
        target_language: str,
        native_language: str | None,
        difficulty_level: str,
        is_published: bool,
    ) -> Curriculum:
        return self.curriculum_repository.create(
            title=title,
            description=description,
            target_language=target_language,
            native_language=native_language,
            difficulty_level=difficulty_level,
            is_published=is_published,
        )

    def update_curriculum(self, curriculum_id: UUID, data: dict) -> Curriculum:
        curriculum = self.get_curriculum(curriculum_id)
        clean_data = {k: v for k, v in data.items() if v is not None}
        return self.curriculum_repository.update(curriculum, clean_data)

    def delete_curriculum(self, curriculum_id: UUID) -> None:
        curriculum = self.get_curriculum(curriculum_id)
        lesson_ids = self.lesson_repository.list_ids_for_curriculum(curriculum_id)
        if self.progress_repository.count_for_lessons(lesson_ids) > 0:
            raise ContentInUseError()
        self.curriculum_repository.delete(curriculum)

    def set_curriculum_published(self, curriculum_id: UUID, is_published: bool) -> Curriculum:
        curriculum = self.get_curriculum(curriculum_id)
        return self.curriculum_repository.set_published(curriculum, is_published)

    # ------------------------------------------------------------------
    # Unit
    # ------------------------------------------------------------------

    def list_units(self, curriculum_id: UUID) -> list[Unit]:
        self.get_curriculum(curriculum_id)
        return self.unit_repository.list_all_for_curriculum(curriculum_id)

    def get_unit(self, unit_id: UUID) -> Unit:
        unit = self.unit_repository.get_by_id_any_status(unit_id)
        if unit is None:
            raise UnitNotFoundError()
        return unit

    def create_unit(
        self,
        curriculum_id: UUID,
        *,
        title: str,
        description: str | None,
        order_index: int | None,
        is_published: bool,
    ) -> Unit:
        self.get_curriculum(curriculum_id)
        resolved_order = self._resolve_order_index(
            order_index,
            existing_lookup=lambda idx: self.unit_repository.get_by_curriculum_and_order(curriculum_id, idx),
            max_lookup=lambda: self.unit_repository.get_max_order_index(curriculum_id),
        )
        return self.unit_repository.create(
            curriculum_id=curriculum_id,
            title=title,
            description=description,
            order_index=resolved_order,
            is_published=is_published,
        )

    def update_unit(self, unit_id: UUID, data: dict) -> Unit:
        unit = self.get_unit(unit_id)
        clean_data = {k: v for k, v in data.items() if v is not None}
        if "order_index" in clean_data and clean_data["order_index"] != unit.order_index:
            existing = self.unit_repository.get_by_curriculum_and_order(
                unit.curriculum_id, clean_data["order_index"]
            )
            if existing is not None and existing.id != unit.id:
                raise DuplicateOrderIndexError()
        return self.unit_repository.update(unit, clean_data)

    def delete_unit(self, unit_id: UUID) -> None:
        unit = self.get_unit(unit_id)
        lesson_ids = self.lesson_repository.list_ids_for_unit(unit_id)
        if self.progress_repository.count_for_lessons(lesson_ids) > 0:
            raise ContentInUseError()
        self.unit_repository.delete(unit)

    def set_unit_published(self, unit_id: UUID, is_published: bool) -> Unit:
        unit = self.get_unit(unit_id)
        return self.unit_repository.set_published(unit, is_published)

    # ------------------------------------------------------------------
    # Lesson
    # ------------------------------------------------------------------

    def list_lessons(self, unit_id: UUID) -> list[Lesson]:
        self.get_unit(unit_id)
        return self.lesson_repository.list_all_for_unit(unit_id)

    def get_lesson(self, lesson_id: UUID) -> Lesson:
        lesson = self.lesson_repository.get_by_id_any_status(lesson_id)
        if lesson is None:
            raise LessonNotFoundError()
        return lesson

    def create_lesson(
        self,
        unit_id: UUID,
        *,
        title: str,
        description: str | None,
        target_language: str,
        native_language: str | None,
        difficulty_level: str,
        estimated_duration_minutes: int,
        learning_objectives: list[str],
        order_index: int | None,
        is_published: bool,
    ) -> Lesson:
        self.get_unit(unit_id)
        resolved_order = self._resolve_order_index(
            order_index,
            existing_lookup=lambda idx: self.lesson_repository.get_by_unit_and_order(unit_id, idx),
            max_lookup=lambda: self.lesson_repository.get_max_order_index(unit_id),
        )
        return self.lesson_repository.create(
            unit_id=unit_id,
            title=title,
            description=description,
            target_language=target_language,
            native_language=native_language,
            difficulty_level=difficulty_level,
            estimated_duration_minutes=estimated_duration_minutes,
            learning_objectives=learning_objectives,
            order_index=resolved_order,
            is_published=is_published,
        )

    def update_lesson(self, lesson_id: UUID, data: dict) -> Lesson:
        lesson = self.get_lesson(lesson_id)
        clean_data = {k: v for k, v in data.items() if v is not None}
        if "order_index" in clean_data and clean_data["order_index"] != lesson.order_index:
            existing = self.lesson_repository.get_by_unit_and_order(lesson.unit_id, clean_data["order_index"])
            if existing is not None and existing.id != lesson.id:
                raise DuplicateOrderIndexError()
        return self.lesson_repository.update(lesson, clean_data)

    def delete_lesson(self, lesson_id: UUID) -> None:
        lesson = self.get_lesson(lesson_id)
        if self.progress_repository.count_for_lessons([lesson_id]) > 0:
            raise ContentInUseError()
        self.lesson_repository.delete(lesson)

    def set_lesson_published(self, lesson_id: UUID, is_published: bool) -> Lesson:
        lesson = self.get_lesson(lesson_id)
        return self.lesson_repository.set_published(lesson, is_published)

    # ------------------------------------------------------------------
    # Exercise
    # ------------------------------------------------------------------

    def list_exercises(self, lesson_id: UUID) -> list[Exercise]:
        self.get_lesson(lesson_id)
        return self.exercise_repository.list_for_lesson(lesson_id)

    def get_exercise(self, exercise_id: UUID) -> Exercise:
        exercise = self.exercise_repository.get_by_id(exercise_id)
        if exercise is None:
            raise ExerciseNotFoundError()
        return exercise

    def create_exercise(
        self,
        lesson_id: UUID,
        *,
        exercise_type: str,
        prompt: str,
        content: dict,
        points: int,
        order_index: int | None,
    ) -> Exercise:
        self.get_lesson(lesson_id)
        validate_exercise_content(exercise_type, content)
        resolved_order = self._resolve_order_index(
            order_index,
            existing_lookup=lambda idx: self.exercise_repository.get_by_lesson_and_order(lesson_id, idx),
            max_lookup=lambda: self.exercise_repository.get_max_order_index(lesson_id),
        )
        return self.exercise_repository.create(
            lesson_id=lesson_id,
            exercise_type=exercise_type,
            prompt=prompt,
            content=content,
            points=points,
            order_index=resolved_order,
        )

    def update_exercise(self, exercise_id: UUID, data: dict) -> Exercise:
        exercise = self.get_exercise(exercise_id)
        clean_data = {k: v for k, v in data.items() if v is not None}

        if "content" in clean_data:
            validate_exercise_content(exercise.exercise_type, clean_data["content"])

        if "order_index" in clean_data and clean_data["order_index"] != exercise.order_index:
            existing = self.exercise_repository.get_by_lesson_and_order(
                exercise.lesson_id, clean_data["order_index"]
            )
            if existing is not None and existing.id != exercise.id:
                raise DuplicateOrderIndexError()

        return self.exercise_repository.update(exercise, clean_data)

    def delete_exercise(self, exercise_id: UUID) -> None:
        exercise = self.get_exercise(exercise_id)
        self.exercise_repository.delete(exercise)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    @staticmethod
    def _resolve_order_index(
        order_index: int | None,
        *,
        existing_lookup: Callable[[int], object | None],
        max_lookup: Callable[[], int],
    ) -> int:
        if order_index is None:
            return max_lookup() + 1
        if existing_lookup(order_index) is not None:
            raise DuplicateOrderIndexError()
        return order_index