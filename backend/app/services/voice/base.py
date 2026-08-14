"""Abstract speech provider contracts (STT + TTS)."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class TranscriptionResult:
    text: str
    language: str | None = None


class SpeechToTextProvider(ABC):
    """Infrastructure port for audio -> text. No business rules, no DB access."""

    @abstractmethod
    def transcribe(self, *, audio_bytes: bytes, filename: str, content_type: str) -> TranscriptionResult:
        """
        Transcribe raw audio bytes to text.

        Raises:
            AIConfigurationError: missing API key / bad config
            AIProviderError: upstream failure after retries
        """
        raise NotImplementedError


class TextToSpeechProvider(ABC):
    """Infrastructure port for text -> audio. No business rules, no DB access."""

    @abstractmethod
    def synthesize(self, text: str) -> bytes:
        """
        Return raw audio bytes for the given text.

        Raises:
            AIConfigurationError: missing API key / bad config
            AIProviderError: upstream failure after retries
        """
        raise NotImplementedError