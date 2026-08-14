"""Build provider-ready message lists from stored conversation history."""

from __future__ import annotations

from app.models.conversation_message import (
    MESSAGE_ROLE_ASSISTANT,
    MESSAGE_ROLE_SYSTEM,
    MESSAGE_ROLE_USER,
    ConversationMessage,
)
from app.services.ai.base import AIMessage
from app.services.ai.prompt_builder import PromptBuilder
from app.models.conversation_session import ConversationSession


class ContextBuilder:
    """Formats DB messages + system prompt for the LLM API."""

    def __init__(self, prompt_builder: PromptBuilder | None = None) -> None:
        self.prompt_builder = prompt_builder or PromptBuilder()

    def build(
        self,
        session: ConversationSession,
        history: list[ConversationMessage],
        *,
        max_messages: int,
    ) -> list[AIMessage]:
        system = AIMessage(
            role="system",
            content=self.prompt_builder.build_system_prompt(session),
        )

        # Keep the most recent turns within the window (already ordered by sequence).
        trimmed = history[-max_messages:] if max_messages > 0 else history

        chat: list[AIMessage] = [system]
        for item in trimmed:
            role = self._map_role(item.role)
            if role is None:
                continue
            content = (item.content or "").strip()
            if not content:
                continue
            chat.append(AIMessage(role=role, content=content))

        return chat

    @staticmethod
    def _map_role(role: str) -> str | None:
        if role == MESSAGE_ROLE_USER:
            return "user"
        if role == MESSAGE_ROLE_ASSISTANT:
            return "assistant"
        if role == MESSAGE_ROLE_SYSTEM:
            return "system"
        return None