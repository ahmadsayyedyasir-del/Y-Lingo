"""Speech service — thin wrapper around the factory-based STT/TTS providers.

Delegates to:
- STT: GroqWhisperProvider  (via voice/factory.py)
- TTS: ElevenLabsProvider   (via voice/factory.py)

The voice API endpoints (voice.py) call the factory functions directly.
This module exists as a convenience wrapper for any code that needs a
single service object rather than two separate provider instances.
"""

from __future__ import annotations

from typing import Any

from app.core.exceptions import InvalidFileError
from app.services.voice.factory import get_speech_to_text_provider, get_text_to_speech_provider


class SpeechService:
    """Thin wrapper that delegates STT and TTS to the configured providers."""

    def speech_to_text(self, audio_data: bytes, language: str = "en") -> str:
        """Transcribe audio bytes to text using Groq Whisper."""
        if not audio_data or len(audio_data) < 100:
            raise InvalidFileError("Audio data is empty or too small.")

        stt = get_speech_to_text_provider()
        result = stt.transcribe(
            audio_bytes=audio_data,
            filename="audio",
            content_type="application/octet-stream",
        )
        return result.text

    def text_to_speech(self, text: str, voice: str = "default", speed: float = 1.0) -> bytes:
        """Convert text to audio bytes using ElevenLabs."""
        if not text or not text.strip():
            raise InvalidFileError("Text is empty.")

        tts = get_text_to_speech_provider()
        return tts.synthesize(text)

    def analyze_pronunciation(
        self,
        audio_data: bytes,
        expected_text: str,
        language: str = "en",
    ) -> dict[str, Any]:
        """Transcribe audio and compare against expected text."""
        transcribed = self.speech_to_text(audio_data, language)

        transcribed_words = set(transcribed.lower().split())
        expected_words = set(expected_text.lower().split())
        correct = transcribed_words & expected_words
        score = int((len(correct) / max(len(expected_words), 1)) * 100)

        feedback: list[str] = []
        for w in expected_words - transcribed_words:
            feedback.append(f"Missing word: '{w}'")
        for w in transcribed_words - expected_words:
            feedback.append(f"Extra word: '{w}'")
        if not feedback:
            feedback.append("Good pronunciation!")

        return {
            "transcribed": transcribed,
            "expected": expected_text,
            "score": min(100, score),
            "feedback": feedback,
            "is_correct": score >= 70,
        }


_default_speech: SpeechService | None = None


def get_speech_service() -> SpeechService:
    """Return shared SpeechService instance."""
    global _default_speech
    if _default_speech is None:
        _default_speech = SpeechService()
    return _default_speech
