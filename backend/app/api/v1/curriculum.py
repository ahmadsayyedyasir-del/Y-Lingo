"""Curriculum browsing API routes — read-only, published content only (Phase 10)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.repositories.curriculum_repository import CurriculumRepository
from app.repositories.exercise_repository import ExerciseRepository
from app.repositories.lesson_repository import LessonRepository
from app.repositories.unit_repository import UnitRepository
from app.schemas.curriculum import (
    CurriculumDetailResponse,
    CurriculumListResponse,
    CurriculumSummaryResponse,
    ExercisePublicResponse,
    LessonDetailResponse,
    LessonListResponse,
    LessonSummaryResponse,
    UnitListResponse,
    UnitSummaryResponse,
)
from app.services.curriculum_service import CurriculumService
from app.services.exercise_grading import sanitize_exercise_content

router = APIRouter(tags=["Curriculum"])


def get_curriculum_service(db: Session = Depends(get_db)) -> CurriculumService:
    return CurriculumService(
        curriculum_repository=CurriculumRepository(db),
        unit_repository=UnitRepository(db),
        lesson_repository=LessonRepository(db),
        exercise_repository=ExerciseRepository(db),
    )


@router.get("/curricula", response_model=CurriculumListResponse)
def list_curricula(
    target_language: str | None = Query(default=None),
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
) -> CurriculumListResponse:
    curricula = service.list_curricula(target_language)
    return CurriculumListResponse(
        items=[CurriculumSummaryResponse.model_validate(c) for c in curricula]
    )


@router.get("/curricula/{curriculum_id}", response_model=CurriculumDetailResponse)
def get_curriculum(
    curriculum_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
) -> CurriculumDetailResponse:
    curriculum = service.get_curriculum(curriculum_id)
    units = service.list_units(curriculum_id)
    return CurriculumDetailResponse(
        id=curriculum.id,
        title=curriculum.title,
        description=curriculum.description,
        target_language=curriculum.target_language,
        native_language=curriculum.native_language,
        difficulty_level=curriculum.difficulty_level,
        units=[UnitSummaryResponse.model_validate(u) for u in units],
    )


@router.get("/curricula/{curriculum_id}/units", response_model=UnitListResponse)
def list_units(
    curriculum_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
) -> UnitListResponse:
    units = service.list_units(curriculum_id)
    return UnitListResponse(items=[UnitSummaryResponse.model_validate(u) for u in units])


@router.get("/units/{unit_id}/lessons", response_model=LessonListResponse)
def list_lessons(
    unit_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
) -> LessonListResponse:
    lessons = service.list_lessons(unit_id)
    return LessonListResponse(
        items=[LessonSummaryResponse.model_validate(lesson) for lesson in lessons]
    )


@router.get("/lessons/{lesson_id}", response_model=LessonDetailResponse)
def get_lesson(
    lesson_id: UUID,
    current_user: User = Depends(get_current_active_user),
    service: CurriculumService = Depends(get_curriculum_service),
) -> LessonDetailResponse:
    lesson, exercises = service.get_lesson_with_exercises(lesson_id)
    return LessonDetailResponse(
        id=lesson.id,
        title=lesson.title,
        description=lesson.description,
        target_language=lesson.target_language,
        native_language=lesson.native_language,
        difficulty_level=lesson.difficulty_level,
        estimated_duration_minutes=lesson.estimated_duration_minutes,
        learning_objectives=lesson.learning_objectives or [],
        exercises=[
            ExercisePublicResponse(
                id=e.id,
                exercise_type=e.exercise_type,
                prompt=e.prompt,
                content=sanitize_exercise_content(e.exercise_type, e.content or {}),
                points=e.points,
                order_index=e.order_index,
            )
            for e in exercises
        ],
    )