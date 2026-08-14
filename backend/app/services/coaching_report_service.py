"""AI-powered coaching report generation service.

Uses Groq LLaMA to evaluate real language quality from the conversation.
Falls back to rule-based scoring if the AI call fails.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any

from app.models.conversation_message import ConversationMessage
from app.models.conversation_session import ConversationSession


# ---------------------------------------------------------------------------
# AI Coaching Prompt
# ---------------------------------------------------------------------------

_COACHING_PROMPT_TEMPLATE = """You are an expert English language coach. Analyze the following conversation messages from a language learner and produce a structured coaching report.

Session language: {language}
User level: {level}
Number of user messages: {msg_count}

USER MESSAGES (in order):
{user_messages}

Evaluate the learner's English based ONLY on their messages. Be honest and specific.

Respond with ONLY a valid JSON object (no markdown, no extra text):

{{
  "fluency_score": <integer 0-100, based on natural flow and coherence>,
  "grammar_score": <integer 0-100, based on correctness>,
  "vocabulary_score": <integer 0-100, based on range and appropriateness>,
  "pronunciation_readiness_score": <integer 0-100, estimated from text clarity>,
  "strengths": [<up to 4 specific strengths as strings>],
  "weaknesses": [<up to 4 specific weaknesses as strings>],
  "improvement_tips": [<up to 4 actionable tips as strings>],
  "grammar_mistakes": [
    {{"original": "<wrong phrase>", "correction": "<correct phrase>", "explanation": "<why>"}}
  ],
  "new_vocabulary": [
    {{"word": "<word used>", "better_word": "<stronger alternative>", "reason": "<why better>"}}
  ],
  "summary": "<2-3 sentence honest summary of overall performance>",
  "recommended_practice": "<one specific practice recommendation>"
}}

Rules:
- Be specific and honest, not generic
- Grammar mistakes: only real errors found in the messages
- Vocabulary: only suggest better words for words actually used
- If messages are very short or few, reflect that in lower scores
- Scores must be realistic integers 0-100
"""


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class CoachingReportService:
    """Generate AI-powered coaching reports for conversation sessions."""

    def __init__(
        self,
        session: ConversationSession,
        messages: list[ConversationMessage],
    ) -> None:
        self.session = session
        self.messages = messages
        self.user_messages = [m for m in messages if m.role == "user"]

    def generate_report(self) -> dict[str, Any]:
        """Generate coaching report — AI first, rule-based fallback."""
        if not self.user_messages:
            return self._empty_report()

        try:
            report = self._generate_ai_report()
            report["session_id"] = self.session.id
            report["generated_at"] = datetime.now(timezone.utc)
            return report
        except Exception as exc:
            # Log but don't crash — fallback to rule-based
            import logging
            logging.getLogger(__name__).warning(
                "AI coaching report failed, using rule-based fallback: %s", exc
            )
            return self._generate_rule_based_report()

    # ------------------------------------------------------------------
    # AI-powered path
    # ------------------------------------------------------------------

    def _generate_ai_report(self) -> dict[str, Any]:
        from app.services.ai_provider import get_ai_provider

        # Build user messages transcript
        user_messages_text = "\n".join(
            f"[{i + 1}] {m.content}"
            for i, m in enumerate(self.user_messages)
        )

        # Detect level from session title or default
        level = "intermediate"
        if self.session.title:
            title_lower = self.session.title.lower()
            if "beginner" in title_lower:
                level = "beginner"
            elif "advanced" in title_lower:
                level = "advanced"

        prompt = _COACHING_PROMPT_TEMPLATE.format(
            language=self.session.target_language or "English",
            level=level,
            msg_count=len(self.user_messages),
            user_messages=user_messages_text,
        )

        provider = get_ai_provider()
        # Use higher token limit for structured report
        raw = provider.generate_response([
            {"role": "system", "content": "You are a professional English language coach. Always respond with valid JSON only."},
            {"role": "user", "content": prompt},
        ])

        # Extract JSON from response (LLM may wrap in markdown code block)
        json_str = self._extract_json(raw)
        data = json.loads(json_str)

        # Validate and normalise
        return {
            "fluency_score": self._clamp(data.get("fluency_score", 70)),
            "grammar_score": self._clamp(data.get("grammar_score", 70)),
            "vocabulary_score": self._clamp(data.get("vocabulary_score", 70)),
            "pronunciation_readiness_score": self._clamp(data.get("pronunciation_readiness_score", 60)),
            "strengths": self._ensure_list(data.get("strengths", [])),
            "weaknesses": self._ensure_list(data.get("weaknesses", [])),
            "improvement_tips": self._ensure_list(data.get("improvement_tips", [])),
            "grammar_mistakes": self._ensure_list(data.get("grammar_mistakes", [])),
            "new_vocabulary": self._ensure_list(data.get("new_vocabulary", [])),
            "summary": str(data.get("summary", "Good session! Keep practicing.")),
            "recommended_practice": str(data.get("recommended_practice", "Continue daily conversations.")),
        }

    def _extract_json(self, text: str) -> str:
        """Extract JSON object from LLM response, stripping markdown fences."""
        # Try to find JSON block inside ```json ... ``` or ``` ... ```
        fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if fence:
            return fence.group(1)
        # Try to find bare JSON object
        obj = re.search(r"\{.*\}", text, re.DOTALL)
        if obj:
            return obj.group(0)
        raise ValueError("No JSON object found in LLM response")

    # ------------------------------------------------------------------
    # Rule-based fallback (kept from original, simplified)
    # ------------------------------------------------------------------

    def _generate_rule_based_report(self) -> dict[str, Any]:
        total = len(self.user_messages)
        total_words = sum(len(m.content.split()) for m in self.user_messages)
        avg_words = total_words / max(total, 1)

        fluency = min(100, 65 + (10 if total >= 10 else 5 if total >= 5 else 0))
        vocabulary = min(100, 65 + (10 if avg_words >= 10 else 5 if avg_words >= 5 else 0))
        grammar = 70
        pronunciation = 60

        return {
            "session_id": self.session.id,
            "fluency_score": fluency,
            "grammar_score": grammar,
            "vocabulary_score": vocabulary,
            "pronunciation_readiness_score": pronunciation,
            "strengths": ["Engaged in conversation", "Completed the session"],
            "weaknesses": ["AI evaluation unavailable — review manually"],
            "improvement_tips": [
                "Practice daily for 10-15 minutes",
                "Review new vocabulary regularly",
                "Listen to native English speakers",
            ],
            "grammar_mistakes": [],
            "new_vocabulary": [],
            "summary": (
                f"You sent {total} messages averaging {avg_words:.0f} words each. "
                "Keep practicing to improve your fluency!"
            ),
            "recommended_practice": "Continue daily conversations.",
            "generated_at": datetime.now(timezone.utc),
        }

    def _empty_report(self) -> dict[str, Any]:
        return {
            "session_id": self.session.id,
            "fluency_score": 0,
            "grammar_score": 0,
            "vocabulary_score": 0,
            "pronunciation_readiness_score": 0,
            "strengths": [],
            "weaknesses": ["No messages were sent in this session."],
            "improvement_tips": ["Try sending at least 5 messages in your next session."],
            "grammar_mistakes": [],
            "new_vocabulary": [],
            "summary": "No messages were recorded in this session.",
            "recommended_practice": "Start a new conversation and practice for at least 5 minutes.",
            "generated_at": datetime.now(timezone.utc),
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _clamp(value: Any, lo: int = 0, hi: int = 100) -> int:
        try:
            return max(lo, min(hi, int(value)))
        except (TypeError, ValueError):
            return 70

    @staticmethod
    def _ensure_list(value: Any) -> list:
        if isinstance(value, list):
            return value
        return []


# ---------------------------------------------------------------------------
# Convenience function (used by conversation_service)
# ---------------------------------------------------------------------------

def generate_coaching_report(
    session: ConversationSession,
    messages: list[ConversationMessage],
) -> dict[str, Any]:
    return CoachingReportService(session, messages).generate_report()
