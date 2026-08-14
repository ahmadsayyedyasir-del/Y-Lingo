"""Resolve the configured SpeechToTextProvider and TextToSpeechProvider implementations."""

from __future__ import annotations

from app.core.ai_settings import get_ai_settings
from app.core.voice_settings import VoiceSettings, get_voice_settings
from app.services.voice.base import SpeechToTextProvider, TextToSpeechProvider
from app.services.voice.elevenlabs_provider import ElevenLabsProvider
from app.services.voice.groq_whisper_provider import GroqWhisperProvider


def get_speech_to_text_provider(settings: VoiceSettings | None = None) -> SpeechToTextProvider:
    voice_cfg = settings or get_voice_settings()
    ai_cfg = get_ai_settings()  # reuse existing GROQ_API_KEY — no duplicated secret

    return GroqWhisperProvider(
        api_key=ai_cfg.groq_api_key,
        model=voice_cfg.stt_model,
        timeout_seconds=voice_cfg.stt_request_timeout_seconds,
        max_retries=voice_cfg.stt_max_retries,
    )


def get_text_to_speech_provider(settings: VoiceSettings | None = None) -> TextToSpeechProvider:
    voice_cfg = settings or get_voice_settings()

    return ElevenLabsProvider(
        api_key=voice_cfg.elevenlabs_api_key,
        voice_id=voice_cfg.tts_voice_id,
        model=voice_cfg.tts_model,
        timeout_seconds=voice_cfg.tts_request_timeout_seconds,
        max_retries=voice_cfg.tts_max_retries,
    )