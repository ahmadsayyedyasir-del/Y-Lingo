"""Lesson progress API routes — user-owned, mutating (Phase 10)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.repositories.exercise_repository import ExerciseRepository
from app.repositories.gamification_profile_repository import GamificationProfileRepository
from app.repositories.lesson_repository import LessonRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_achievement_repository import UserAchievementRepository
from app.repositories.user_exercise_attempt_repository import UserExerciseAttemptRepository
from app.repositories.user_lesson_progress_repository import UserLessonProgressRepository
from app.schemas.curriculum import (
    ExerciseSubmitRequest,
    ExerciseSubmitResponse,
    LessonCompleteResponse,
    LessonProgressListResponse,
    LessonProgressResponse,
)
from app.schemas.gamification import GamificationEventResponse, UnlockedAchievementItem
from app.services.gamification_service import GamificationEventResult, GamificationService
from app.services.lesson_progress_service import LessonProgressService

router = APIRouter(prefix="/lessons", tags=["Lesson Progress"])
progress_router = APIRouter(tags=["Lesson Progress"])


def get_lesson_progress_service(db: Session = Depends(get_db)) -> LessonProgressService:
    return LessonProgressService(
        lesson_repository=LessonRepository(db),
        exercise_repository=ExerciseRepository(db),
        progress_repository=UserLessonProgressRepository(db),
        attempt_repository=UserExerciseAttemptRepository(db),
        gamification_service=GamificationService(
            gamification_profile_repository=GamificationProfileRepository(db),
            user_achievement_repository=UserAchievementRepository(db),
            profile_repository=ProfileRepository(db),
        ),
    )


def _to_gamification_response(
    result: GamificationEventResult | None,
) -> GamificationEventResponse | None:
    if result is None:
        return None
    return GamificationEventResponse(
        xp_earned=result.xp_earned,
        total_xp=result.total_xp,
        level=result.level,
        leveled_up=result.leveled_up,
        current_streak_days=result.current_streak_days,
        newly_unlocked_achievements=[
            UnlockedAchievementItem(code=a.code, name=a.name)
            for a in result.newly_unlocked_achievements
        ],
    )


@router.post("/{lesson_id}/start", response_model=LessonProgressResponse)
def start_lesson(
    lesson_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: LessonProgressService = Depends(get_lesson_progress_service),
) -> LessonProgressResponse:
    progress = service.start_lesson(current_user, lesson_id)
    return LessonProgressResponse.model_validate(progress)


@router.post(
    "/{lesson_id}/exercises/{exercise_id}/submit",
    response_model=ExerciseSubmitResponse,
)
def submit_exercise_answer(
    lesson_id: UUID,
    exercise_id: UUID,
    payload: ExerciseSubmitRequest,
    current_user: User = Depends(get_current_active_user),
    service: LessonProgressService = Depends(get_lesson_progress_service),
) -> ExerciseSubmitResponse:
    progress, is_correct, score_awarded = service.submit_answer(
        current_user, lesson_id, exercise_id, payload.answer
    )
    return ExerciseSubmitResponse(
        is_correct=is_correct,
        score_awarded=score_awarded,
        progress=LessonProgressResponse.model_validate(progress),
    )


@router.post("/{lesson_id}/complete", response_model=LessonCompleteResponse)
def complete_lesson(
    lesson_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: LessonProgressService = Depends(get_lesson_progress_service),
) -> LessonCompleteResponse:
    progress, gamification_result = service.complete_lesson(current_user, lesson_id)
    return LessonCompleteResponse(
        progress=LessonProgressResponse.model_validate(progress),
        gamification=_to_gamification_response(gamification_result),
    )


@router.get("/{lesson_id}/progress", response_model=LessonProgressResponse)
def get_lesson_progress(
    lesson_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: LessonProgressService = Depends(get_lesson_progress_service),
) -> LessonProgressResponse:
    progress = service.get_progress(current_user, lesson_id)
    return LessonProgressResponse.model_validate(progress)


@progress_router.get("/progress", response_model=LessonProgressListResponse)
def list_my_progress(
    current_user: User = Depends(get_current_active_user),
    service: LessonProgressService = Depends(get_lesson_progress_service),
) -> LessonProgressListResponse:
    items = service.list_progress(current_user)
    return LessonProgressListResponse(
        items=[LessonProgressResponse.model_validate(p) for p in items]
    )