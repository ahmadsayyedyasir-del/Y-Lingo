"""AI Provider abstraction for language coaching using Groq API."""

from __future__ import annotations

import logging
from typing import Any

from groq import Groq
from app.core.config import settings
from app.core.exceptions import AIConfigurationError, AIProviderError

logger = logging.getLogger(__name__)


class AIProvider:
    """Base interface for AI providers."""

    def generate_response(self, messages: list[dict[str, str]]) -> str:
        raise NotImplementedError


class GroqProvider(AIProvider):
    """Groq API implementation for language coaching."""

    def __init__(self) -> None:
        if not settings.groq_api_key:
            raise AIConfigurationError("GROQ_API_KEY is not configured.")
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = "llama-3.3-70b-versatile"
        self.temperature = 0.7
        self.max_tokens = 500

    def generate_response(self, messages: list[dict[str, str]]) -> str:
        """
        Generate AI response for language coaching conversation.

        Args:
            messages: List of message dicts with 'role' and 'content'

        Returns:
            AI response text

        Raises:
            AIProviderError: If API call fails
        """
        try:
            formatted_messages = [
                {"role": msg["role"], "content": str(msg["content"])}
                for msg in messages
                if isinstance(msg, dict) and "role" in msg and "content" in msg
            ]

            logger.debug("Sending %d messages to Groq", len(formatted_messages))

            response = self.client.chat.completions.create(
                model=self.model,
                messages=formatted_messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
            )

            return response.choices[0].message.content

        except Exception as exc:
            logger.error("Groq API error: %s", exc)
            raise AIProviderError(f"Groq API error: {str(exc)}") from exc


def get_ai_provider() -> AIProvider:
    """Factory function to get the configured AI provider."""
    return GroqProvider()