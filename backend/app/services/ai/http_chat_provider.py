"""OpenAI-compatible chat completions HTTP provider with retries."""

from __future__ import annotations

import logging
import time

import httpx

from app.core.exceptions import AIConfigurationError, AIProviderError
from app.services.ai.base import AIMessage, AIProvider

logger = logging.getLogger(__name__)


class HttpChatProvider(AIProvider):
    """
    Calls an OpenAI-compatible /chat/completions endpoint.
    Used for both Groq and OpenAI by swapping base_url and api_key.
    """

    def __init__(
        self,
        *,
        api_key: str | None,
        base_url: str,
        model: str,
        timeout_seconds: float,
        max_retries: int,
        temperature: float,
        max_tokens: int,
        provider_label: str,
    ) -> None:
        self._api_key = (api_key or "").strip()
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout = timeout_seconds
        self._max_retries = max_retries
        self._temperature = temperature
        self._max_tokens = max_tokens
        self._provider_label = provider_label

    def generate(self, messages: list[AIMessage]) -> str:
        if not self._api_key:
            raise AIConfigurationError(
                f"{self._provider_label} API key is missing. Set it in the environment."
            )

        payload = {
            "model": self._model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": self._temperature,
            "max_tokens": self._max_tokens,
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        url = f"{self._base_url}/chat/completions"

        last_error: Exception | None = None
        attempts = self._max_retries + 1

        for attempt in range(attempts):
            try:
                with httpx.Client(timeout=self._timeout) as client:
                    response = client.post(url, headers=headers, json=payload)

                if response.status_code in {429, 500, 502, 503, 504}:
                    last_error = AIProviderError(
                        f"{self._provider_label} temporarily unavailable ({response.status_code})."
                    )
                    logger.warning(
                        "AI provider retryable error provider=%s status=%s attempt=%s",
                        self._provider_label,
                        response.status_code,
                        attempt + 1,
                    )
                    if attempt < attempts - 1:
                        time.sleep(0.5 * (2**attempt))
                        continue
                    raise last_error

                if response.status_code == 401:
                    raise AIConfigurationError(
                        f"{self._provider_label} rejected the API key."
                    )

                if response.status_code >= 400:
                    logger.error(
                        "AI provider error provider=%s status=%s body=%s",
                        self._provider_label,
                        response.status_code,
                        response.text[:500],
                    )
                    raise AIProviderError()

                data = response.json()
                try:
                    content = data["choices"][0]["message"]["content"]
                except (KeyError, IndexError, TypeError) as exc:
                    logger.error("Unexpected AI response shape: %s", data)
                    raise AIProviderError() from exc

                text = (content or "").strip()
                if not text:
                    raise AIProviderError("AI returned an empty reply.")
                return text

            except AIConfigurationError:
                raise
            except AIProviderError as exc:
                last_error = exc
                if attempt >= attempts - 1:
                    raise
                time.sleep(0.5 * (2**attempt))
            except httpx.TimeoutException as exc:
                last_error = exc
                logger.warning(
                    "AI provider timeout provider=%s attempt=%s",
                    self._provider_label,
                    attempt + 1,
                )
                if attempt >= attempts - 1:
                    raise AIProviderError("AI coach request timed out.") from exc
                time.sleep(0.5 * (2**attempt))
            except httpx.HTTPError as exc:
                logger.exception("AI HTTP error provider=%s", self._provider_label)
                raise AIProviderError() from exc

        raise AIProviderError() from last_error