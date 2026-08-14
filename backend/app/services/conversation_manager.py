# app/services/conversation_manager.py
"""Conversation Manager — Handles natural conversation flow, context, and prompt building."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID

from app.models.conversation_message import ConversationMessage
from app.models.conversation_session import ConversationSession


class ConversationManager:
    """
    Manages conversation context, builds prompts with scenario, level, and memory.

    This is the core of the human-like conversation experience.
    """

    def __init__(
        self,
        session: ConversationSession,
        level: str = "intermediate",
        scenario: str = "casual",
        native_language: str = "Urdu",
    ):
        self.session = session
        self.level = level
        self.scenario = scenario
        self.native_language = native_language
        self.context: List[Dict[str, str]] = []

    def build_system_prompt(self) -> str:
        """Build system prompt with scenario and level instructions."""
        scenario_prompts = {
            "casual": "You are having a casual conversation with a friend. Be friendly, warm, and natural. Ask about their day, interests, and share things about yourself.",
            "interview": "You are a friendly but professional interviewer. Ask common interview questions like 'Tell me about yourself', 'Why do you want this job?', and 'Where do you see yourself in 5 years?'. Keep it conversational.",
            "travel": "You are a fellow traveler. Ask about travel experiences, favorite destinations, and travel plans. Share your own travel stories.",
            "daily": "You are having a conversation about daily life. Ask about routines, hobbies, work, and family. Keep it natural and engaging.",
            "ielts": "You are an IELTS speaking examiner. Ask IELTS-style questions for speaking practice. Be professional but encouraging.",
            "business": "You are a business colleague. Discuss professional topics like projects, meetings, and career goals. Keep it professional but conversational.",
        }

        level_instructions = {
            "beginner": "Use simple vocabulary, short sentences, and speak slowly. Be very encouraging and patient.",
            "intermediate": "Use natural everyday English, moderate vocabulary, and normal speed. Correct mistakes subtly.",
            "advanced": "Use fluent English, idioms, and natural expressions. Challenge the user with complex questions.",
        }

        scenario_text = scenario_prompts.get(self.scenario, scenario_prompts["casual"])
        level_text = level_instructions.get(self.level, level_instructions["intermediate"])

        return f"""You are a friendly English conversation partner.

Scenario: {self.scenario}
User Level: {self.level}
User's Native Language: {self.native_language}

Guidelines:
{scenario_text}
{level_text}

IMPORTANT:
- Keep responses SHORT (1-2 sentences max) — this is a conversation, not a lecture
- Ask natural follow-up questions
- React to what the user says
- Don't correct grammar during conversation
- Don't give long explanations
- Be encouraging and warm
- Sound like a real person
- Use the user's name occasionally
- Avoid repeating the same questions

Remember: You are a conversation partner, not a teacher during the call."""

    def build_conversation_prompt(
        self,
        history: List[ConversationMessage],
        user_message: str,
        rag_context: str | None = None,
    ) -> List[Dict[str, str]]:
        """Build full prompt with system + RAG context + conversation history + user message."""
        system_content = self.build_system_prompt()

        # Inject RAG context into system prompt if available
        if rag_context:
            system_content += (
                "\n\n---\n"
                "DOCUMENT CONTEXT (use this knowledge when relevant to the conversation):\n"
                f"{rag_context}"
                "---\n"
            )

        messages: List[Dict[str, str]] = [
            {"role": "system", "content": system_content}
        ]

        # Add history (last 10 messages)
        for msg in history[-10:]:
            messages.append({"role": msg.role, "content": msg.content})

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        return messages

    def should_end_conversation(self, user_message: str) -> bool:
        """Detect if user wants to end conversation."""
        end_phrases = ["bye", "goodbye", "see you", "that's all", "end call", "good night"]
        lower_msg = user_message.lower()
        return any(phrase in lower_msg for phrase in end_phrases)