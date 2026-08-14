"""Resolve the configured AIProvider implementation."""

from __future__ import annotations

from app.core.ai_settings import AISettings, get_ai_settings
from app.core.exceptions import AIConfigurationError
from app.services.ai.base import AIProvider
from app.services.ai.http_chat_provider import HttpChatProvider

_GROQ_BASE_URL = "https://api.groq.com/openai/v1"
_OPENAI_BASE_URL = "https://api.openai.com/v1"


def get_ai_provider(settings: AISettings | None = None) -> AIProvider:
    cfg = settings or get_ai_settings()
    provider = (cfg.ai_provider or "groq").strip().lower()

    common = dict(
        model=cfg.ai_model,
        timeout_seconds=cfg.ai_request_timeout_seconds,
        max_retries=cfg.ai_max_retries,
        temperature=cfg.ai_temperature,
        max_tokens=cfg.ai_max_tokens,
    )

    if provider == "groq":
        return HttpChatProvider(
            api_key=cfg.groq_api_key,
            base_url=_GROQ_BASE_URL,
            provider_label="Groq",
            **common,
        )

    if provider in {"openai", "open_ai"}:
        return HttpChatProvider(
            api_key=cfg.openai_api_key,
            base_url=_OPENAI_BASE_URL,
            provider_label="OpenAI",
            **common,
        )

    raise AIConfigurationError(
        f"Unsupported AI provider '{cfg.ai_provider}'. Use 'groq' or 'openai'."
    )