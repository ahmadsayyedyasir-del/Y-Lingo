"""Read-only browsing service for curricula, units, and lessons (Phase 10).
Published content only — no admin bypass in this phase."""

from __future__ import annotations

from uuid import UUID

from app.core.exceptions import CurriculumNotFoundError, LessonNotFoundError, UnitNotFoundError
from app.models.curriculum import Curriculum
from app.models.exercise import Exercise
from app.models.lesson import Lesson
from app.models.unit import Unit
from app.repositories.curriculum_repository import CurriculumRepository
from app.repositories.exercise_repository import ExerciseRepository
from app.repositories.lesson_repository import LessonRepository
from app.repositories.unit_repository import UnitRepository


class CurriculumService:
    def __init__(
        self,
        curriculum_repository: CurriculumRepository,
        unit_repository: UnitRepository,
        lesson_repository: LessonRepository,
        exercise_repository: ExerciseRepository,
    ) -> None:
        self.curriculum_repository = curriculum_repository
        self.unit_repository = unit_repository
        self.lesson_repository = lesson_repository
        self.exercise_repository = exercise_repository

    def list_curricula(self, target_language: str | None = None) -> list[Curriculum]:
        return self.curriculum_repository.list_published(target_language)

    def get_curriculum(self, curriculum_id: UUID) -> Curriculum:
        curriculum = self.curriculum_repository.get_published_by_id(curriculum_id)
        if curriculum is None:
            raise CurriculumNotFoundError()
        return curriculum

    def list_units(self, curriculum_id: UUID) -> list[Unit]:
        self.get_curriculum(curriculum_id)  # ensures the curriculum exists/is published
        return self.unit_repository.list_published_for_curriculum(curriculum_id)

    def list_lessons(self, unit_id: UUID) -> list[Lesson]:
        unit = self.unit_repository.get_published_by_id(unit_id)
        if unit is None:
            raise UnitNotFoundError()
        return self.lesson_repository.list_published_for_unit(unit_id)

    def get_lesson_with_exercises(self, lesson_id: UUID) -> tuple[Lesson, list[Exercise]]:
        lesson = self.lesson_repository.get_published_by_id(lesson_id)
        if lesson is None:
            raise LessonNotFoundError()
        exercises = self.exercise_repository.list_for_lesson(lesson_id)
        return lesson, exercises