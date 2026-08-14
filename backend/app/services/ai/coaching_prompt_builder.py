
from __future__ import annotations

from app.models.conversation_message import (
    MESSAGE_ROLE_ASSISTANT,
    MESSAGE_ROLE_USER,
    ConversationMessage,
)
from app.models.conversation_session import ConversationSession
from app.services.ai.base import AIMessage

_LIVE_FEEDBACK_SYSTEM_TEMPLATE = (
    "You are the quiet grammar-and-fluency layer behind Y-Lingo AI Coach.\n"
    "You analyze ONE learner message and return feedback as STRICT JSON only — "
    "no markdown, no commentary, no code fences, nothing outside the JSON object.\n"
    "The learner's native language is {native}. They are practicing {target}.\n\n"
    "Return exactly this JSON shape:\n"
    "{{\n"
    '  "has_mistake": boolean,\n'
    '  "corrected_text": string or null,\n'
    '  "explanation": string or null,\n'
    '  "natural_alternative": string or null,\n'
    '  "vocabulary_suggestion": string or null\n'
    "}}\n\n"
    "Rules:\n"
    "- explanation must be one short supportive sentence, max 25 words, or null.\n"
    "- If the message has no meaningful mistake, set has_mistake to false and leave "
    "corrected_text/explanation null — but you may still fill natural_alternative or "
    "vocabulary_suggestion if there's a genuinely more native-sounding phrasing.\n"
    "- Be encouraging and brief. Never scold. Output nothing except the JSON object."
)

_SESSION_REPORT_SYSTEM_TEMPLATE = (
    "You are Y-Lingo AI Coach generating an end-of-session report for a language learner.\n"
    "The learner's native language is {native}. They practiced {target}.\n"
    "You act like a friendly, encouraging language tutor, not an exam grader.\n"
    "Return STRICT JSON only — no markdown, no commentary, no code fences.\n\n"
    "Return exactly this JSON shape:\n"
    "{{\n"
    '  "fluency_score": integer 0-100,\n'
    '  "grammar_score": integer 0-100,\n'
    '  "vocabulary_score": integer 0-100,\n'
    '  "pronunciation_readiness_score": integer 0-100,\n'
    '  "strengths": [string, ...],\n'
    '  "weaknesses": [string, ...],\n'
    '  "improvement_tips": [string, ...],\n'
    '  "recommended_practice": string,\n'
    '  "summary": string,\n'
    '  "vocabulary_learned": [{{"word": string, "meaning": string, "example": string}}, ...],\n'
    '  "grammar_mistakes": [{{"mistake": string, "correction": string, "explanation": string, '
    '"category": string}}, ...]\n'
    "}}\n\n"
    "Notes:\n"
    "- pronunciation_readiness_score is a text-based estimate (no audio available) — infer it from "
    "sentence complexity, word choice, and phrasing patterns typically linked to pronunciation ease.\n"
    "- summary must be 2-4 encouraging sentences.\n"
    "- Base every field only on what the learner (role=user, labelled 'Learner' below) actually wrote. "
    "Keep each list to at most 8 items. Output nothing except the JSON object."
)


class CoachingPromptBuilder:
    """Builds provider-ready prompts for live feedback and end-of-session reports."""

    def build_live_feedback_prompt(
        self,
        session: ConversationSession,
        user_message_content: str,
    ) -> list[AIMessage]:
        system = AIMessage(
            role="system",
            content=_LIVE_FEEDBACK_SYSTEM_TEMPLATE.format(
                native=session.native_language,
                target=session.target_language,
            ),
        )
        user = AIMessage(
            role="user",
            content=f"Learner message to analyze:\n{user_message_content.strip()}",
        )
        return [system, user]

    def build_session_report_prompt(
        self,
        session: ConversationSession,
        messages: list[ConversationMessage],
        *,
        max_messages: int,
    ) -> list[AIMessage]:
        system = AIMessage(
            role="system",
            content=_SESSION_REPORT_SYSTEM_TEMPLATE.format(
                native=session.native_language,
                target=session.target_language,
            ),
        )
        transcript = self._format_transcript(messages, max_messages)
        user = AIMessage(
            role="user",
            content=f"Conversation transcript:\n{transcript}",
        )
        return [system, user]

    @staticmethod
    def _format_transcript(messages: list[ConversationMessage], max_messages: int) -> str:
        trimmed = messages[-max_messages:] if max_messages > 0 else messages
        lines: list[str] = []
        for item in trimmed:
            if item.role == MESSAGE_ROLE_USER:
                speaker = "Learner"
            elif item.role == MESSAGE_ROLE_ASSISTANT:
                speaker = "Coach"
            else:
                continue
            content = (item.content or "").strip()
            if content:
                lines.append(f"{speaker}: {content}")
        return "\n".join(lines) if lines else "(no messages)"