"""Pydantic schemas for the Settings API (Phase 4)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class SettingsResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    theme: str
    grammar_correction: bool
    translation_enabled: bool
    ai_voice: str
    ai_speed: str
    email_notifications: bool
    daily_reminders: bool


class SettingsUpdateRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    theme: str
    grammar_correction: bool
    translation_enabled: bool
    ai_voice: str
    ai_speed: str
    email_notifications: bool
    daily_reminders: bool