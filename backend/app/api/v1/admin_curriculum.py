"""Admin curriculum authoring API routes (Phase 11) — full CRUD + publish/unpublish
for curricula, units, lessons, and exercises. Every route requires admin access."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.admin_deps import require_admin
from app.api.deps import get_db
from app.models.user import User
from app.repositories.curriculum_repository import CurriculumRepository
from app.repositories.exercise_repository import ExerciseRepository
from app.repositories.lesson_repository import LessonRepository
from app.repositories.unit_repository import UnitRepository
from app.repositories.user_lesson_progress_repository import UserLessonProgressRepository
from app.schemas.admin_curriculum import (
    AdminCurriculumCreateRequest,
    AdminCurriculumListResponse,
    AdminCurriculumResponse,
    AdminCurriculumUpdateRequest,
    AdminExerciseCreateRequest,
    AdminExerciseListResponse,
    AdminExerciseResponse,
    AdminExerciseUpdateRequest,
    AdminLessonCreateRequest,
    AdminLessonListResponse,
    AdminLessonResponse,
    AdminLessonUpdateRequest,
    AdminUnitCreateRequest,
    AdminUnitListResponse,
    AdminUnitResponse,
    AdminUnitUpdateRequest,
)
from app.services.admin_curriculum_service import AdminCurriculumService

router = APIRouter(prefix="/admin", tags=["Admin - Curriculum"])


def get_admin_curriculum_service(db: Session = Depends(get_db)) -> AdminCurriculumService:
    return AdminCurriculumService(
        curriculum_repository=CurriculumRepository(db),
        unit_repository=UnitRepository(db),
        lesson_repository=LessonRepository(db),
        exercise_repository=ExerciseRepository(db),
        progress_repository=UserLessonProgressRepository(db),
    )


# ---------------------------------------------------------------------------
# Curriculum
# ---------------------------------------------------------------------------


@router.post("/curricula", response_model=AdminCurriculumResponse, status_code=201)
def create_curriculum(
    payload: AdminCurriculumCreateRequest,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminCurriculumResponse:
    curriculum = service.create_curriculum(
        title=payload.title,
        description=payload.description,
        target_language=payload.target_language,
        native_language=payload.native_language,
        difficulty_level=payload.difficulty_level,
        is_published=payload.is_published,
    )
    return AdminCurriculumResponse.model_validate(curriculum)


@router.get("/curricula", response_model=AdminCurriculumListResponse)
def list_curricula(
    target_language: str | None = Query(default=None),
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminCurriculumListResponse:
    curricula = service.list_curricula(target_language)
    return AdminCurriculumListResponse(items=[AdminCurriculumResponse.model_validate(c) for c in curricula])


@router.get("/curricula/{curriculum_id}", response_model=AdminCurriculumResponse)
def get_curriculum(
    curriculum_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminCurriculumResponse:
    curriculum = service.get_curriculum(curriculum_id)
    return AdminCurriculumResponse.model_validate(curriculum)


@router.put("/curricula/{curriculum_id}", response_model=AdminCurriculumResponse)
def update_curriculum(
    curriculum_id: UUID,
    payload: AdminCurriculumUpdateRequest,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminCurriculumResponse:
    curriculum = service.update_curriculum(curriculum_id, payload.model_dump(exclude_unset=True))
    return AdminCurriculumResponse.model_validate(curriculum)


@router.delete("/curricula/{curriculum_id}", status_code=204)
def delete_curriculum(
    curriculum_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> None:
    service.delete_curriculum(curriculum_id)


@router.post("/curricula/{curriculum_id}/publish", response_model=AdminCurriculumResponse)
def publish_curriculum(
    curriculum_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminCurriculumResponse:
    curriculum = service.set_curriculum_published(curriculum_id, True)
    return AdminCurriculumResponse.model_validate(curriculum)


@router.post("/curricula/{curriculum_id}/unpublish", response_model=AdminCurriculumResponse)
def unpublish_curriculum(
    curriculum_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminCurriculumResponse:
    curriculum = service.set_curriculum_published(curriculum_id, False)
    return AdminCurriculumResponse.model_validate(curriculum)


# ---------------------------------------------------------------------------
# Unit
# ---------------------------------------------------------------------------


@router.post("/curricula/{curriculum_id}/units", response_model=AdminUnitResponse, status_code=201)
def create_unit(
    curriculum_id: UUID,
    payload: AdminUnitCreateRequest,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminUnitResponse:
    unit = service.create_unit(
        curriculum_id,
        title=payload.title,
        description=payload.description,
        order_index=payload.order_index,
        is_published=payload.is_published,
    )
    return AdminUnitResponse.model_validate(unit)


@router.get("/curricula/{curriculum_id}/units", response_model=AdminUnitListResponse)
def list_units(
    curriculum_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminUnitListResponse:
    units = service.list_units(curriculum_id)
    return AdminUnitListResponse(items=[AdminUnitResponse.model_validate(u) for u in units])


@router.put("/units/{unit_id}", response_model=AdminUnitResponse)
def update_unit(
    unit_id: UUID,
    payload: AdminUnitUpdateRequest,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminUnitResponse:
    unit = service.update_unit(unit_id, payload.model_dump(exclude_unset=True))
    return AdminUnitResponse.model_validate(unit)


@router.delete("/units/{unit_id}", status_code=204)
def delete_unit(
    unit_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> None:
    service.delete_unit(unit_id)


@router.post("/units/{unit_id}/publish", response_model=AdminUnitResponse)
def publish_unit(
    unit_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminUnitResponse:
    unit = service.set_unit_published(unit_id, True)
    return AdminUnitResponse.model_validate(unit)


@router.post("/units/{unit_id}/unpublish", response_model=AdminUnitResponse)
def unpublish_unit(
    unit_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminUnitResponse:
    unit = service.set_unit_published(unit_id, False)
    return AdminUnitResponse.model_validate(unit)


# ---------------------------------------------------------------------------
# Lesson
# ---------------------------------------------------------------------------


@router.post("/units/{unit_id}/lessons", response_model=AdminLessonResponse, status_code=201)
def create_lesson(
    unit_id: UUID,
    payload: AdminLessonCreateRequest,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminLessonResponse:
    lesson = service.create_lesson(
        unit_id,
        title=payload.title,
        description=payload.description,
        target_language=payload.target_language,
        native_language=payload.native_language,
        difficulty_level=payload.difficulty_level,
        estimated_duration_minutes=payload.estimated_duration_minutes,
        learning_objectives=payload.learning_objectives,
        order_index=payload.order_index,
        is_published=payload.is_published,
    )
    return AdminLessonResponse.model_validate(lesson)


@router.get("/units/{unit_id}/lessons", response_model=AdminLessonListResponse)
def list_lessons(
    unit_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminLessonListResponse:
    lessons = service.list_lessons(unit_id)
    return AdminLessonListResponse(items=[AdminLessonResponse.model_validate(lesson) for lesson in lessons])


@router.get("/lessons/{lesson_id}", response_model=AdminLessonResponse)
def get_lesson(
    lesson_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminLessonResponse:
    lesson = service.get_lesson(lesson_id)
    return AdminLessonResponse.model_validate(lesson)


@router.put("/lessons/{lesson_id}", response_model=AdminLessonResponse)
def update_lesson(
    lesson_id: UUID,
    payload: AdminLessonUpdateRequest,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminLessonResponse:
    lesson = service.update_lesson(lesson_id, payload.model_dump(exclude_unset=True))
    return AdminLessonResponse.model_validate(lesson)


@router.delete("/lessons/{lesson_id}", status_code=204)
def delete_lesson(
    lesson_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> None:
    service.delete_lesson(lesson_id)


@router.post("/lessons/{lesson_id}/publish", response_model=AdminLessonResponse)
def publish_lesson(
    lesson_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminLessonResponse:
    lesson = service.set_lesson_published(lesson_id, True)
    return AdminLessonResponse.model_validate(lesson)


@router.post("/lessons/{lesson_id}/unpublish", response_model=AdminLessonResponse)
def unpublish_lesson(
    lesson_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminLessonResponse:
    lesson = service.set_lesson_published(lesson_id, False)
    return AdminLessonResponse.model_validate(lesson)


# ---------------------------------------------------------------------------
# Exercise
# ---------------------------------------------------------------------------


@router.post("/lessons/{lesson_id}/exercises", response_model=AdminExerciseResponse, status_code=201)
def create_exercise(
    lesson_id: UUID,
    payload: AdminExerciseCreateRequest,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminExerciseResponse:
    exercise = service.create_exercise(
        lesson_id,
        exercise_type=payload.exercise_type,
        prompt=payload.prompt,
        content=payload.content,
        points=payload.points,
        order_index=payload.order_index,
    )
    return AdminExerciseResponse.model_validate(exercise)


@router.get("/lessons/{lesson_id}/exercises", response_model=AdminExerciseListResponse)
def list_exercises(
    lesson_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminExerciseListResponse:
    exercises = service.list_exercises(lesson_id)
    return AdminExerciseListResponse(items=[AdminExerciseResponse.model_validate(e) for e in exercises])


@router.put("/exercises/{exercise_id}", response_model=AdminExerciseResponse)
def update_exercise(
    exercise_id: UUID,
    payload: AdminExerciseUpdateRequest,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> AdminExerciseResponse:
    exercise = service.update_exercise(exercise_id, payload.model_dump(exclude_unset=True))
    return AdminExerciseResponse.model_validate(exercise)


@router.delete("/exercises/{exercise_id}", status_code=204)
def delete_exercise(
    exercise_id: UUID,
    _admin: User = Depends(require_admin),
    service: AdminCurriculumService = Depends(get_admin_curriculum_service),
) -> None:
    service.delete_exercise(exercise_id)