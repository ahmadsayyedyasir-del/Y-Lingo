"""Business logic for gamification (Phase 9 + Phase 10): XP, levels, streaks,
achievements.

Profile.level (existing field, Phase 4) stays the single source of truth for
level — this service computes level from total XP and writes it back via the
existing ProfileRepository. ConversationService, CoachingService, and the
Phase 10 curriculum/lesson services are never touched or called from here;
this service is invoked by their routers/services alongside them.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from app.models.gamification_profile import GamificationProfile
from app.models.session_coaching_report import SessionCoachingReport
from app.models.user import User
from app.repositories.gamification_profile_repository import GamificationProfileRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_achievement_repository import UserAchievementRepository
from app.services.gamification.achievement_registry import ACHIEVEMENTS_BY_CODE, AchievementDefinition

logger = logging.getLogger(__name__)

_XP_PER_LEVEL = 100
_XP_PER_MESSAGE = 5
_XP_PER_SESSION_END = 20
_XP_PER_REPORT_BASE = 30
_XP_REPORT_BONUS_MAX = 20
_XP_PER_LESSON_COMPLETION = 25


@dataclass(frozen=True)
class GamificationEventResult:
    xp_earned: int
    total_xp: int
    level: int
    leveled_up: bool
    current_streak_days: int
    longest_streak_days: int
    newly_unlocked_achievements: list[AchievementDefinition] = field(default_factory=list)


class GamificationService:
    def __init__(
        self,
        gamification_profile_repository: GamificationProfileRepository,
        user_achievement_repository: UserAchievementRepository,
        profile_repository: ProfileRepository,
    ) -> None:
        self.gamification_profile_repository = gamification_profile_repository
        self.user_achievement_repository = user_achievement_repository
        self.profile_repository = profile_repository

    # ------------------------------------------------------------------
    # Public XP-awarding triggers — all best-effort, never raise. A
    # gamification hiccup must never break message sending, session
    # ending, coaching report generation, or lesson completion.
    # ------------------------------------------------------------------

    def award_message_xp(self, user: User) -> GamificationEventResult | None:
        return self._safe_award(user, xp=_XP_PER_MESSAGE, bump_messages=True)

    def award_session_end_xp(self, user: User) -> GamificationEventResult | None:
        return self._safe_award(user, xp=_XP_PER_SESSION_END, bump_sessions=True)

    def award_report_xp(
        self,
        user: User,
        report: SessionCoachingReport,
    ) -> GamificationEventResult | None:
        avg_score = (
            report.fluency_score
            + report.grammar_score
            + report.vocabulary_score
            + report.pronunciation_readiness_score
        ) / 4
        bonus = round((avg_score / 100) * _XP_REPORT_BONUS_MAX)
        xp = _XP_PER_REPORT_BASE + bonus
        return self._safe_award(user, xp=xp, fluency_score=report.fluency_score)

    def award_lesson_completion_xp(
        self,
        user: User,
        *,
        total_lessons_completed: int,
    ) -> GamificationEventResult | None:
        return self._safe_award(
            user,
            xp=_XP_PER_LESSON_COMPLETION,
            total_lessons_completed=total_lessons_completed,
        )

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get_or_create_summary(self, user: User) -> tuple[GamificationProfile, list[str]]:
        profile = self.gamification_profile_repository.get_or_create(user.id)
        unlocked_codes = sorted(self.user_achievement_repository.get_unlocked_codes(user.id))
        return profile, unlocked_codes

    def get_unlocked_achievements_map(self, user: User) -> dict[str, datetime]:
        rows = self.user_achievement_repository.list_for_user(user.id)
        return {row.achievement_code: row.unlocked_at for row in rows}

    @staticmethod
    def compute_level(total_xp: int) -> int:
        return (total_xp // _XP_PER_LEVEL) + 1

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _safe_award(
        self,
        user: User,
        *,
        xp: int,
        bump_messages: bool = False,
        bump_sessions: bool = False,
        fluency_score: int | None = None,
        total_lessons_completed: int | None = None,
    ) -> GamificationEventResult | None:
        try:
            return self._award(
                user,
                xp=xp,
                bump_messages=bump_messages,
                bump_sessions=bump_sessions,
                fluency_score=fluency_score,
                total_lessons_completed=total_lessons_completed,
            )
        except Exception as exc:  # noqa: BLE001 - gamification must never break the core flow
            logger.warning(
                "Gamification award failed user_id=%s xp=%s error=%s",
                user.id,
                xp,
                exc,
            )
            return None

    def _award(
        self,
        user: User,
        *,
        xp: int,
        bump_messages: bool,
        bump_sessions: bool,
        fluency_score: int | None,
        total_lessons_completed: int | None = None,
    ) -> GamificationEventResult:
        gp = self.gamification_profile_repository.get_or_create(user.id)
        today = datetime.now(timezone.utc).date()

        streak_days, longest_streak = self._compute_streak(gp, today)
        previous_level = self.compute_level(gp.total_xp)

        xp_awarded = max(xp, 0)
        new_total_xp = gp.total_xp + xp_awarded
        new_messages = gp.total_messages_sent + (1 if bump_messages else 0)
        new_sessions = gp.total_sessions_completed + (1 if bump_sessions else 0)
        new_level = self.compute_level(new_total_xp)

        updated_gp = self.gamification_profile_repository.update(
            gp,
            {
                "total_xp": new_total_xp,
                "total_messages_sent": new_messages,
                "total_sessions_completed": new_sessions,
                "current_streak_days": streak_days,
                "longest_streak_days": longest_streak,
                "last_activity_date": today,
            },
        )

        self._sync_profile_level(user, new_level)

        newly_unlocked = self._check_and_unlock_achievements(
            user.id,
            updated_gp,
            level=new_level,
            fluency_score=fluency_score,
            total_lessons_completed=total_lessons_completed,
        )

        return GamificationEventResult(
            xp_earned=xp_awarded,
            total_xp=updated_gp.total_xp,
            level=new_level,
            leveled_up=new_level > previous_level,
            current_streak_days=updated_gp.current_streak_days,
            longest_streak_days=updated_gp.longest_streak_days,
            newly_unlocked_achievements=newly_unlocked,
        )

    def _sync_profile_level(self, user: User, new_level: int) -> None:
        """Keep the existing Profile.level field in sync with the computed XP-based level."""
        profile = self.profile_repository.get_by_user_id(user.id)
        if profile is None:
            return
        if profile.level != new_level:
            self.profile_repository.update(profile, {"level": new_level})

    def _check_and_unlock_achievements(
        self,
        user_id: UUID,
        gp: GamificationProfile,
        *,
        level: int,
        fluency_score: int | None,
        total_lessons_completed: int | None = None,
    ) -> list[AchievementDefinition]:
        already_unlocked = self.user_achievement_repository.get_unlocked_codes(user_id)
        candidates: list[str] = []

        if gp.total_sessions_completed >= 1:
            candidates.append("FIRST_SESSION")
        if gp.current_streak_days >= 3:
            candidates.append("STREAK_3")
        if gp.current_streak_days >= 7:
            candidates.append("STREAK_7")
        if gp.current_streak_days >= 30:
            candidates.append("STREAK_30")
        if gp.total_messages_sent >= 50:
            candidates.append("MESSAGES_50")
        if gp.total_messages_sent >= 100:
            candidates.append("MESSAGES_100")
        if fluency_score is not None and fluency_score >= 80:
            candidates.append("FLUENCY_80")
        if level >= 5:
            candidates.append("LEVEL_5")
        if level >= 10:
            candidates.append("LEVEL_10")
        if total_lessons_completed is not None:
            if total_lessons_completed >= 1:
                candidates.append("LESSON_FIRST")
            if total_lessons_completed >= 10:
                candidates.append("LESSONS_10")
            if total_lessons_completed >= 50:
                candidates.append("LESSONS_50")

        newly_unlocked: list[AchievementDefinition] = []
        for code in candidates:
            if code in already_unlocked:
                continue
            definition = ACHIEVEMENTS_BY_CODE.get(code)
            if definition is None:
                continue
            self.user_achievement_repository.unlock(user_id, code)
            newly_unlocked.append(definition)

        return newly_unlocked

    @staticmethod
    def _compute_streak(gp: GamificationProfile, today: date) -> tuple[int, int]:
        if gp.last_activity_date is None:
            new_streak = 1
        elif gp.last_activity_date == today:
            new_streak = max(gp.current_streak_days, 1)
        elif gp.last_activity_date == today - timedelta(days=1):
            new_streak = gp.current_streak_days + 1
        else:
            new_streak = 1
        longest = max(gp.longest_streak_days, new_streak)
        return new_streak, longest