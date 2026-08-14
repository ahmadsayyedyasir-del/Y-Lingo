"""Abstract AI provider contract."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class AIMessage:
    """One turn in the provider chat format."""

    role: str  # system | user | assistant
    content: str


class AIProvider(ABC):
    """Infrastructure port — no business rules, no database access."""

    @abstractmethod
    def generate(self, messages: list[AIMessage]) -> str:
        """
        Return the assistant text completion for the given chat messages.

        Raises:
            AIConfigurationError: missing API key / bad config
            AIProviderError: upstream failure after retries
        """
        raise NotImplementedError