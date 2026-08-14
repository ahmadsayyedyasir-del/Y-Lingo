"""Pydantic schemas for the Dashboard API (Phase 4 — mixed real/placeholder data)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class AchievementItem(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    title: str
    description: str
    unlocked: bool


class ActivityItem(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    title: str
    category: str
    xp_earned: int
    completed_at: str


class WeeklyProgressPoint(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    day: str
    xp: int


class DashboardResponse(BaseModel):
    """
    full_name (User) and avatar_url/native_language/learning_language/learning_style/
    daily_goal (Profile) are real. current_xp, current_level, current_streak,
    weekly_progress, achievements, and recent_activity are static placeholders —
    no XP/streak/achievement logic exists here.
    """

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    full_name: str
    avatar_url: str | None = None
    native_language: str
    learning_language: str
    learning_style: str
    daily_goal: int

    current_xp: int
    current_level: int
    current_streak: int
    weekly_progress: list[WeeklyProgressPoint]
    achievements: list[AchievementItem]
    recent_activity: list[ActivityItem]