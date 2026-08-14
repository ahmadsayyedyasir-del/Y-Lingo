
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from app.schemas.gamification import GamificationEventResponse

# ---------------------------------------------------------------------------
# Browsing (read-only, published content only)
# ---------------------------------------------------------------------------


class CurriculumSummaryResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    title: str
    description: str | None = None
    target_language: str
    native_language: str | None = None
    difficulty_level: str


class CurriculumListResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    items: list[CurriculumSummaryResponse]


class UnitSummaryResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    title: str
    description: str | None = None
    order_index: int


class UnitListResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    items: list[UnitSummaryResponse]


class CurriculumDetailResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: UUID
    title: str
    description: str | None = None
    target_language: str
    native_language: str | None = None
    difficulty_level: str
    units: list[UnitSummaryResponse]


class LessonSummaryResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    title: str
    description: str | None = None
    difficulty_level: str
    estimated_duration_minutes: int
    order_index: int


class LessonListResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    items: list[LessonSummaryResponse]


class ExercisePublicResponse(BaseModel):
    """Never includes the correct answer — content is pre-sanitized by the service."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: UUID
    exercise_type: str
    prompt: str
    content: dict
    points: int
    order_index: int


class LessonDetailResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: UUID
    title: str
    description: str | None = None
    target_language: str
    native_language: str | None = None
    difficulty_level: str
    estimated_duration_minutes: int
    learning_objectives: list[str]
    exercises: list[ExercisePublicResponse]


# ---------------------------------------------------------------------------
# Progress (user-owned, mutating)
# ---------------------------------------------------------------------------


class LessonProgressResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    lesson_id: UUID
    status: str
    score: int | None = None
    completion_percentage: int
    attempt_count: int
    started_at: datetime | None = None
    completed_at: datetime | None = None
    last_accessed_at: datetime


class LessonProgressListResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    items: list[LessonProgressResponse]


class ExerciseSubmitRequest(BaseModel):
    """`answer` shape depends on exercise_type — see exercise_grading.py docstring
    (e.g. {"selectedOptionId": "a"} or {"text": "..."})."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    answer: dict


class ExerciseSubmitResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    is_correct: bool
    score_awarded: int
    progress: LessonProgressResponse


class LessonCompleteResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    progress: LessonProgressResponse
    gamification: GamificationEventResponse | None = None