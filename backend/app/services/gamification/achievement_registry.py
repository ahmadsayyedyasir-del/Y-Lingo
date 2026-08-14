"""Static achievement catalog for gamification (Phase 9 + Phase 10).

Achievement *definitions* live here in code, not in the database — adding a
new achievement is a one-line change here, no migration needed. Only which
achievements a user has *unlocked* is persisted (UserAchievement).
"""

from __future__ import annotations

from dataclasses import dataclass

ACHIEVEMENT_CATEGORY_STREAK = "streak"
ACHIEVEMENT_CATEGORY_MILESTONE = "milestone"
ACHIEVEMENT_CATEGORY_SCORE = "score"
ACHIEVEMENT_CATEGORY_LEVEL = "level"


@dataclass(frozen=True)
class AchievementDefinition:
    code: str
    name: str
    description: str
    category: str


ACHIEVEMENTS: tuple[AchievementDefinition, ...] = (
    AchievementDefinition(
        code="FIRST_SESSION",
        name="First Steps",
        description="Complete your first conversation session.",
        category=ACHIEVEMENT_CATEGORY_MILESTONE,
    ),
    AchievementDefinition(
        code="STREAK_3",
        name="Getting Warmed Up",
        description="Practice 3 days in a row.",
        category=ACHIEVEMENT_CATEGORY_STREAK,
    ),
    AchievementDefinition(
        code="STREAK_7",
        name="One Week Strong",
        description="Practice 7 days in a row.",
        category=ACHIEVEMENT_CATEGORY_STREAK,
    ),
    AchievementDefinition(
        code="STREAK_30",
        name="Unstoppable",
        description="Practice 30 days in a row.",
        category=ACHIEVEMENT_CATEGORY_STREAK,
    ),
    AchievementDefinition(
        code="MESSAGES_50",
        name="Chatterbox",
        description="Send 50 messages in conversations.",
        category=ACHIEVEMENT_CATEGORY_MILESTONE,
    ),
    AchievementDefinition(
        code="MESSAGES_100",
        name="Conversationalist",
        description="Send 100 messages in conversations.",
        category=ACHIEVEMENT_CATEGORY_MILESTONE,
    ),
    AchievementDefinition(
        code="FLUENCY_80",
        name="Fluent Speaker",
        description="Score 80 or higher on fluency in a coaching report.",
        category=ACHIEVEMENT_CATEGORY_SCORE,
    ),
    AchievementDefinition(
        code="LEVEL_5",
        name="Rising Star",
        description="Reach level 5.",
        category=ACHIEVEMENT_CATEGORY_LEVEL,
    ),
    AchievementDefinition(
        code="LEVEL_10",
        name="Language Master",
        description="Reach level 10.",
        category=ACHIEVEMENT_CATEGORY_LEVEL,
    ),
    AchievementDefinition(
        code="LESSON_FIRST",
        name="Lesson One",
        description="Complete your first lesson.",
        category=ACHIEVEMENT_CATEGORY_MILESTONE,
    ),
    AchievementDefinition(
        code="LESSONS_10",
        name="Diligent Student",
        description="Complete 10 lessons.",
        category=ACHIEVEMENT_CATEGORY_MILESTONE,
    ),
    AchievementDefinition(
        code="LESSONS_50",
        name="Curriculum Devotee",
        description="Complete 50 lessons.",
        category=ACHIEVEMENT_CATEGORY_MILESTONE,
    ),
)

ACHIEVEMENTS_BY_CODE: dict[str, AchievementDefinition] = {a.code: a for a in ACHIEVEMENTS}