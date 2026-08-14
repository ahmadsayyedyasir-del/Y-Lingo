"""Business logic for lesson progress: starting lessons, submitting exercise
answers, and completing lessons. Reuses GamificationService for XP — never
duplicates XP/level/streak/achievement logic."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from app.core.exceptions import ExerciseNotFoundError, LessonNotFoundError, LessonNotStartedError
from app.models.exercise import Exercise
from app.models.lesson import Lesson
from app.models.user import User
from app.models.user_lesson_progress import PROGRESS_STATUS_COMPLETED, PROGRESS_STATUS_IN_PROGRESS, UserLessonProgress
from app.repositories.exercise_repository import ExerciseRepository
from app.repositories.lesson_repository import LessonRepository
from app.repositories.user_exercise_attempt_repository import UserExerciseAttemptRepository
from app.repositories.user_lesson_progress_repository import UserLessonProgressRepository
from app.services.exercise_grading import grade_answer
from app.services.gamification_service import GamificationEventResult, GamificationService


class LessonProgressService:
    def __init__(
        self,
        lesson_repository: LessonRepository,
        exercise_repository: ExerciseRepository,
        progress_repository: UserLessonProgressRepository,
        attempt_repository: UserExerciseAttemptRepository,
        gamification_service: GamificationService,
    ) -> None:
        self.lesson_repository = lesson_repository
        self.exercise_repository = exercise_repository
        self.progress_repository = progress_repository
        self.attempt_repository = attempt_repository
        self.gamification_service = gamification_service

    def start_lesson(self, current_user: User, lesson_id: UUID) -> UserLessonProgress:
        lesson = self._get_lesson_or_raise(lesson_id)
        existing = self.progress_repository.get_by_user_and_lesson(current_user.id, lesson.id)
        now = datetime.now(timezone.utc)

        if existing is None:
            return self.progress_repository.create(user_id=current_user.id, lesson_id=lesson.id)

        if existing.status == PROGRESS_STATUS_COMPLETED:
            # Restarting a completed lesson: fresh run — bump attempt_count, reset progress.
            return self.progress_repository.update(
                existing,
                {
                    "status": PROGRESS_STATUS_IN_PROGRESS,
                    "attempt_count": existing.attempt_count + 1,
                    "completion_percentage": 0,
                    "score": None,
                    "started_at": now,
                    "completed_at": None,
                    "last_accessed_at": now,
                },
            )

        # Already in progress — just bump last_accessed_at.
        return self.progress_repository.update(existing, {"last_accessed_at": now})

    def submit_answer(
        self,
        current_user: User,
        lesson_id: UUID,
        exercise_id: UUID,
        submitted_answer: dict,
    ) -> tuple[UserLessonProgress, bool, int]:
        lesson = self._get_lesson_or_raise(lesson_id)
        exercise = self._get_exercise_or_raise(exercise_id, lesson.id)

        progress = self.progress_repository.get_by_user_and_lesson(current_user.id, lesson.id)
        if progress is None:
            raise LessonNotStartedError()

        is_correct = grade_answer(exercise, submitted_answer)
        score_awarded = exercise.points if is_correct else 0
        attempt_number = self.attempt_repository.count_attempts(current_user.id, exercise.id) + 1

        self.attempt_repository.add(
            user_id=current_user.id,
            exercise_id=exercise.id,
            lesson_progress_id=progress.id,
            submitted_answer=submitted_answer,
            is_correct=is_correct,
            score_awarded=score_awarded,
            attempt_number=attempt_number,
        )

        completion_percentage = self._compute_completion_percentage(
            progress.id, lesson.id, since=progress.started_at
        )
        updated_progress = self.progress_repository.update(
            progress,
            {
                "completion_percentage": completion_percentage,
                "last_accessed_at": datetime.now(timezone.utc),
            },
        )

        return updated_progress, is_correct, score_awarded

    def complete_lesson(
        self,
        current_user: User,
        lesson_id: UUID,
    ) -> tuple[UserLessonProgress, GamificationEventResult | None]:
        lesson = self._get_lesson_or_raise(lesson_id)

        progress = self.progress_repository.get_by_user_and_lesson(current_user.id, lesson.id)
        if progress is None:
            raise LessonNotStartedError()

        final_score = self._compute_final_score(progress.id, lesson.id, since=progress.started_at)
        now = datetime.now(timezone.utc)

        updated_progress = self.progress_repository.update(
            progress,
            {
                "status": PROGRESS_STATUS_COMPLETED,
                "score": final_score,
                "completion_percentage": 100,
                "completed_at": now,
                "last_accessed_at": now,
            },
        )

        total_completed = self.progress_repository.count_completed_for_user(current_user.id)
        gamification_result = self.gamification_service.award_lesson_completion_xp(
            current_user,
            total_lessons_completed=total_completed,
        )

        return updated_progress, gamification_result

    def get_progress(self, current_user: User, lesson_id: UUID) -> UserLessonProgress:
        lesson = self._get_lesson_or_raise(lesson_id)
        progress = self.progress_repository.get_by_user_and_lesson(current_user.id, lesson.id)
        if progress is None:
            raise LessonNotStartedError()
        return progress

    def list_progress(self, current_user: User) -> list[UserLessonProgress]:
        return self.progress_repository.list_for_user(current_user.id)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _get_lesson_or_raise(self, lesson_id: UUID) -> Lesson:
        lesson = self.lesson_repository.get_published_by_id(lesson_id)
        if lesson is None:
            raise LessonNotFoundError()
        return lesson

    def _get_exercise_or_raise(self, exercise_id: UUID, lesson_id: UUID) -> Exercise:
        exercise = self.exercise_repository.get_by_id(exercise_id)
        if exercise is None or exercise.lesson_id != lesson_id:
            raise ExerciseNotFoundError()
        return exercise

    def _compute_completion_percentage(
        self,
        lesson_progress_id: UUID,
        lesson_id: UUID,
        *,
        since: datetime | None,
    ) -> int:
        total_exercises = self.exercise_repository.count_for_lesson(lesson_id)
        if total_exercises == 0:
            return 0
        correct_exercise_ids = self.attempt_repository.list_correct_exercise_ids_for_progress(
            lesson_progress_id, since=since
        )
        return round((len(correct_exercise_ids) / total_exercises) * 100)

    def _compute_final_score(
        self,
        lesson_progress_id: UUID,
        lesson_id: UUID,
        *,
        since: datetime | None,
    ) -> int:
        exercises = self.exercise_repository.list_for_lesson(lesson_id)
        total_points = sum(e.points for e in exercises)
        if total_points == 0:
            return 0
        earned_points = self.attempt_repository.sum_best_score_for_progress(lesson_progress_id, since=since)
        return round((min(earned_points, total_points) / total_points) * 100)