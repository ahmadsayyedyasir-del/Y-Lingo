# backend/app/api/v1/router.py
from fastapi import APIRouter

from app.api.v1 import (
    admin_curriculum,
    auth,
    conversations,
    curriculum,
    dashboard,
    gamification,
    health,
    lesson_progress,
    profile,
    settings,
    upload,  # ✅ Add this import
    voice,   # ✅ Voice endpoints (STT + TTS)
)

api_router = APIRouter()

# Health
api_router.include_router(health.router)

# Authentication
api_router.include_router(auth.router)

# User APIs
api_router.include_router(profile.router)
api_router.include_router(settings.router)
api_router.include_router(dashboard.router)

# Conversations
api_router.include_router(conversations.router)

# Gamification
api_router.include_router(gamification.router)

# Curriculum & Progress
api_router.include_router(curriculum.router)
api_router.include_router(lesson_progress.router)
api_router.include_router(lesson_progress.progress_router)

# Admin
api_router.include_router(admin_curriculum.router)

# ✅ RAG Upload endpoints
api_router.include_router(upload.router)

# ✅ Voice endpoints (STT via Groq Whisper + TTS via ElevenLabs)
api_router.include_router(voice.router)