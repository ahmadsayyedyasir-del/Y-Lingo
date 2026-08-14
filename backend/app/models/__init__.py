"""ORM models — import all models so Alembic and metadata see them."""

from app.models.profile import Profile
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.models.user_settings import UserSettings
from app.models.message_feedback import MessageFeedback
from app.models.session_coaching_report import SessionCoachingReport
from app.models.session_vocabulary_learned import SessionVocabularyLearned
from app.models.session_grammar_mistake import SessionGrammarMistake
from app.models.message_audio import MessageAudio
from app.models.gamification_profile import GamificationProfile
from app.models.user_achievement import UserAchievement

# Phase 10 — Curriculum / Lessons
from app.models.curriculum import Curriculum
from app.models.unit import Unit
from app.models.lesson import Lesson
from app.models.exercise import Exercise
from app.models.user_lesson_progress import UserLessonProgress
from app.models.user_exercise_attempt import UserExerciseAttempt

# Phase 14 — IELTS
from app.models.ielts_attempt import IELTSAttempt

__all__ = [
    "User",
    "Profile",
    "UserSettings",
    "RefreshToken",
    "MessageFeedback",
    "SessionCoachingReport",
    "SessionVocabularyLearned",
    "SessionGrammarMistake",
    "MessageAudio",
    "GamificationProfile",
    "UserAchievement",
    "Curriculum",
    "Unit",
    "Lesson",
    "Exercise",
    "UserLessonProgress",
    "UserExerciseAttempt",
]