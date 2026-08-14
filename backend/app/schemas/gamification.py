
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class UnlockedAchievementItem(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    code: str
    name: str


class GamificationEventResponse(BaseModel):
    """Best-effort XP/level/streak/achievement summary attached to a message-send response."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    xp_earned: int
    total_xp: int
    level: int
    leveled_up: bool
    current_streak_days: int
    newly_unlocked_achievements: list[UnlockedAchievementItem] = []


class AchievementResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    code: str
    name: str
    description: str
    category: str
    unlocked: bool
    unlocked_at: datetime | None = None


class AchievementCatalogResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    items: list[AchievementResponse]


class GamificationProfileResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    total_xp: int
    level: int
    total_messages_sent: int
    total_sessions_completed: int
    current_streak_days: int
    longest_streak_days: int
    last_activity_date: date | None = None
    achievements_unlocked_count: int
    achievements_total_count: int