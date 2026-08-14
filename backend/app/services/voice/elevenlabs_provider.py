"""ElevenLabs text-to-speech provider."""

from __future__ import annotations

import logging
import time

import httpx

from app.core.exceptions import AIConfigurationError, AIProviderError
from app.services.voice.base import TextToSpeechProvider

logger = logging.getLogger(__name__)

_ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"


class ElevenLabsProvider(TextToSpeechProvider):
    """Calls ElevenLabs' /text-to-speech/{voice_id} endpoint."""

    def __init__(
        self,
        *,
        api_key: str | None,
        voice_id: str,
        model: str,
        timeout_seconds: float,
        max_retries: int,
    ) -> None:
        self._api_key = (api_key or "").strip()
        self._voice_id = voice_id
        self._model = model
        self._timeout = timeout_seconds
        self._max_retries = max_retries

    def synthesize(self, text: str) -> bytes:
        if not self._api_key:
            raise AIConfigurationError("ElevenLabs API key is missing. Set it in the environment.")

        cleaned = (text or "").strip()
        if not cleaned:
            raise AIProviderError("Cannot synthesize empty text.")

        url = f"{_ELEVENLABS_BASE_URL}/text-to-speech/{self._voice_id}"
        headers = {
            "xi-api-key": self._api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        payload = {"text": cleaned, "model_id": self._model}

        last_error: Exception | None = None
        attempts = self._max_retries + 1

        for attempt in range(attempts):
            try:
                with httpx.Client(timeout=self._timeout) as client:
                    response = client.post(url, headers=headers, json=payload)

                if response.status_code in {429, 500, 502, 503, 504}:
                    last_error = AIProviderError(
                        f"ElevenLabs temporarily unavailable ({response.status_code})."
                    )
                    logger.warning(
                        "TTS provider retryable error status=%s attempt=%s",
                        response.status_code,
                        attempt + 1,
                    )
                    if attempt < attempts - 1:
                        time.sleep(0.5 * (2**attempt))
                        continue
                    raise last_error

                if response.status_code == 401:
                    raise AIConfigurationError("ElevenLabs rejected the API key.")

                if response.status_code >= 400:
                    logger.error(
                        "TTS provider error status=%s body=%s",
                        response.status_code,
                        response.text[:500],
                    )
                    raise AIProviderError(
                        "The AI coach could not generate speech. Please try again."
                    )

                audio_bytes = response.content
                if not audio_bytes:
                    raise AIProviderError("Speech synthesis returned empty audio.")
                return audio_bytes

            except AIConfigurationError:
                raise
            except AIProviderError as exc:
                last_error = exc
                if attempt >= attempts - 1:
                    raise
                time.sleep(0.5 * (2**attempt))
            except httpx.TimeoutException as exc:
                last_error = exc
                logger.warning("TTS provider timeout attempt=%s", attempt + 1)
                if attempt >= attempts - 1:
                    raise AIProviderError("Speech synthesis request timed out.") from exc
                time.sleep(0.5 * (2**attempt))
            except httpx.HTTPError as exc:
                logger.exception("TTS HTTP error")
                raise AIProviderError() from exc

        raise AIProviderError() from last_error