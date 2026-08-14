"""Groq Whisper speech-to-text provider (OpenAI-compatible /audio/transcriptions)."""

from __future__ import annotations

import logging
import time

import httpx

from app.core.exceptions import AIConfigurationError, AIProviderError
from app.services.voice.base import SpeechToTextProvider, TranscriptionResult

logger = logging.getLogger(__name__)

_GROQ_BASE_URL = "https://api.groq.com/openai/v1"


class GroqWhisperProvider(SpeechToTextProvider):
    """Calls Groq's OpenAI-compatible /audio/transcriptions endpoint."""

    def __init__(
        self,
        *,
        api_key: str | None,
        model: str,
        timeout_seconds: float,
        max_retries: int,
    ) -> None:
        self._api_key = (api_key or "").strip()
        self._model = model
        self._timeout = timeout_seconds
        self._max_retries = max_retries

    def transcribe(self, *, audio_bytes: bytes, filename: str, content_type: str) -> TranscriptionResult:
        if not self._api_key:
            raise AIConfigurationError("Groq API key is missing. Set it in the environment.")

        headers = {"Authorization": f"Bearer {self._api_key}"}
        url = f"{_GROQ_BASE_URL}/audio/transcriptions"

        last_error: Exception | None = None
        attempts = self._max_retries + 1

        for attempt in range(attempts):
            files = {"file": (filename, audio_bytes, content_type or "application/octet-stream")}
            data = {"model": self._model, "response_format": "json"}

            try:
                with httpx.Client(timeout=self._timeout) as client:
                    response = client.post(url, headers=headers, files=files, data=data)

                if response.status_code in {429, 500, 502, 503, 504}:
                    last_error = AIProviderError(
                        f"Groq transcription temporarily unavailable ({response.status_code})."
                    )
                    logger.warning(
                        "STT provider retryable error status=%s attempt=%s",
                        response.status_code,
                        attempt + 1,
                    )
                    if attempt < attempts - 1:
                        time.sleep(0.5 * (2**attempt))
                        continue
                    raise last_error

                if response.status_code == 401:
                    raise AIConfigurationError("Groq rejected the API key.")

                if response.status_code >= 400:
                    logger.error(
                        "STT provider error status=%s body=%s",
                        response.status_code,
                        response.text[:500],
                    )
                    raise AIProviderError(
                        "The AI coach could not transcribe the audio. Please try again."
                    )

                payload = response.json()
                text = (payload.get("text") or "").strip()
                if not text:
                    raise AIProviderError("Transcription returned empty text.")

                return TranscriptionResult(text=text, language=payload.get("language"))

            except AIConfigurationError:
                raise
            except AIProviderError as exc:
                last_error = exc
                if attempt >= attempts - 1:
                    raise
                time.sleep(0.5 * (2**attempt))
            except httpx.TimeoutException as exc:
                last_error = exc
                logger.warning("STT provider timeout attempt=%s", attempt + 1)
                if attempt >= attempts - 1:
                    raise AIProviderError("Transcription request timed out.") from exc
                time.sleep(0.5 * (2**attempt))
            except httpx.HTTPError as exc:
                logger.exception("STT HTTP error")
                raise AIProviderError() from exc

        raise AIProviderError() from last_error