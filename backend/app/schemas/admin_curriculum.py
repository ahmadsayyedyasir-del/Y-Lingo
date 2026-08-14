"""Pydantic schemas for admin curriculum authoring APIs (Phase 11).

Unlike app/schemas/curriculum.py (learner-facing, published-only, answers
stripped), these schemas expose full content — including correct answers —
and every publish/timestamp field, since admins are the ones authoring and
managing that content.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


# ---------------------------------------------------------------------------
# Curriculum
# ---------------------------------------------------------------------------


class AdminCurriculumCreateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    target_language: str = Field(..., min_length=1, max_length=50)
    native_language: str | None = None
    difficulty_level: str
    is_published: bool = False


class AdminCurriculumUpdateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    target_language: str | None = Field(default=None, min_length=1, max_length=50)
    native_language: str | None = None
    difficulty_level: str | None = None


class AdminCurriculumResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    title: str
    description: str | None = None
    target_language: str
    native_language: str | None = None
    difficulty_level: str
    is_published: bool
    created_at: datetime
    updated_at: datetime


class AdminCurriculumListResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    items: list[AdminCurriculumResponse]


# ---------------------------------------------------------------------------
# Unit
# ---------------------------------------------------------------------------


class AdminUnitCreateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    order_index: int | None = Field(default=None, ge=1)
    is_published: bool = False


class AdminUnitUpdateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    order_index: int | None = Field(default=None, ge=1)


class AdminUnitResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    curriculum_id: UUID
    title: str
    description: str | None = None
    order_index: int
    is_published: bool
    created_at: datetime
    updated_at: datetime


class AdminUnitListResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    items: list[AdminUnitResponse]


# ---------------------------------------------------------------------------
# Lesson
# ---------------------------------------------------------------------------


class AdminLessonCreateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    target_language: str = Field(..., min_length=1, max_length=50)
    native_language: str | None = None
    difficulty_level: str
    estimated_duration_minutes: int = Field(default=10, ge=1)
    learning_objectives: list[str] = []
    order_index: int | None = Field(default=None, ge=1)
    is_published: bool = False


class AdminLessonUpdateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    target_language: str | None = Field(default=None, min_length=1, max_length=50)
    native_language: str | None = None
    difficulty_level: str | None = None
    estimated_duration_minutes: int | None = Field(default=None, ge=1)
    learning_objectives: list[str] | None = None
    order_index: int | None = Field(default=None, ge=1)


class AdminLessonResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    unit_id: UUID
    title: str
    description: str | None = None
    target_language: str
    native_language: str | None = None
    difficulty_level: str
    estimated_duration_minutes: int
    learning_objectives: list[str]
    order_index: int
    is_published: bool
    created_at: datetime
    updated_at: datetime


class AdminLessonListResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    items: list[AdminLessonResponse]


# ---------------------------------------------------------------------------
# Exercise
# ---------------------------------------------------------------------------


class AdminExerciseCreateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    exercise_type: str
    prompt: str = Field(..., min_length=1)
    content: dict
    points: int = Field(default=10, ge=1)
    order_index: int | None = Field(default=None, ge=1)


class AdminExerciseUpdateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    prompt: str | None = Field(default=None, min_length=1)
    content: dict | None = None
    points: int | None = Field(default=None, ge=1)
    order_index: int | None = Field(default=None, ge=1)


class AdminExerciseResponse(BaseModel):
    """Full content, including correct answers — admin-only."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    lesson_id: UUID
    exercise_type: str
    prompt: str
    content: dict
    points: int
    order_index: int
    created_at: datetime
    updated_at: datetime


class AdminExerciseListResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    items: list[AdminExerciseResponse]