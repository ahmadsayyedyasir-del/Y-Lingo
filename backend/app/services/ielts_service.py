"""IELTS service — AI-powered evaluation for all IELTS skills."""

from __future__ import annotations

import json
import logging
import re
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models.ielts_attempt import IELTSAttempt

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# AI Prompts
# ---------------------------------------------------------------------------

_WRITING_EVAL_PROMPT = """You are an expert IELTS examiner with 10+ years of experience. Evaluate the following IELTS writing submission and provide a detailed band score assessment.

Task Type: {task_type}
Task Prompt: {task_prompt}
Student's Response:
{essay_text}

Evaluate based on official IELTS criteria:
- Task Achievement/Response (Task 1: describes key features; Task 2: addresses all parts)
- Coherence and Cohesion (logical organisation, paragraphing, linking)
- Lexical Resource (vocabulary range, accuracy, appropriateness)
- Grammatical Range and Accuracy (sentence structures, error frequency)

Respond with ONLY a valid JSON object:
{{
  "overall_band": <float 1.0-9.0, increments of 0.5>,
  "task_achievement": <float 1.0-9.0>,
  "coherence_cohesion": <float 1.0-9.0>,
  "lexical_resource": <float 1.0-9.0>,
  "grammatical_range": <float 1.0-9.0>,
  "word_count": <integer>,
  "feedback": "<3-4 sentences of specific, constructive feedback>",
  "strengths": [<up to 3 specific strengths>],
  "improvements": [<up to 3 specific improvements needed>],
  "grammar_examples": [
    {{"error": "<wrong>", "correction": "<correct>", "explanation": "<why>"}}
  ],
  "vocabulary_feedback": "<sentence about vocabulary use>",
  "band_justification": "<1-2 sentences explaining the overall band score>"
}}"""

_SPEAKING_EVAL_PROMPT = """You are an expert IELTS speaking examiner. Evaluate the following spoken response (transcribed from speech) for IELTS Part {part}.

Question/Topic: {question}
Transcribed Response: {response_text}

Evaluate based on IELTS speaking criteria:
- Fluency and Coherence
- Lexical Resource  
- Grammatical Range and Accuracy
- Pronunciation (estimated from text quality and complexity)

Respond with ONLY a valid JSON object:
{{
  "overall_band": <float 1.0-9.0>,
  "fluency_coherence": <float 1.0-9.0>,
  "lexical_resource": <float 1.0-9.0>,
  "grammatical_range": <float 1.0-9.0>,
  "pronunciation_estimate": <float 1.0-9.0>,
  "feedback": "<2-3 sentences of specific feedback>",
  "strengths": [<up to 2 strengths>],
  "improvements": [<up to 2 improvements>],
  "model_answer_hint": "<one sentence suggesting how to improve the answer>"
}}"""


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class IELTSService:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Writing Evaluation
    # ------------------------------------------------------------------

    def evaluate_writing(
        self,
        user_id: UUID,
        task_type: str,
        task_prompt: str,
        essay_text: str,
    ) -> dict[str, Any]:
        """Evaluate IELTS writing with Groq LLaMA and persist the attempt."""
        from app.services.ai_provider import get_ai_provider

        word_count = len(essay_text.split())
        min_words = 150 if task_type == "task1" else 250

        # AI evaluation
        ai_result: dict[str, Any] = {}
        try:
            prompt = _WRITING_EVAL_PROMPT.format(
                task_type=task_type.upper(),
                task_prompt=task_prompt,
                essay_text=essay_text,
            )
            provider = get_ai_provider()
            raw = provider.generate_response([
                {"role": "system", "content": "You are an expert IELTS examiner. Respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ])
            ai_result = json.loads(self._extract_json(raw))
        except Exception as exc:
            logger.warning("IELTS writing AI evaluation failed: %s", exc)
            # Fallback: estimate band from word count only
            band = 5.0 if word_count >= min_words else 4.0
            ai_result = {
                "overall_band": band,
                "task_achievement": band,
                "coherence_cohesion": band,
                "lexical_resource": band,
                "grammatical_range": band,
                "word_count": word_count,
                "feedback": "AI evaluation temporarily unavailable. Please try again.",
                "strengths": [],
                "improvements": ["Try again for detailed AI feedback"],
                "grammar_examples": [],
                "vocabulary_feedback": "",
                "band_justification": f"Estimated based on {word_count} words submitted.",
            }

        band = float(ai_result.get("overall_band", 5.0))
        band_str = f"{band:.1f}"

        # Persist
        attempt = IELTSAttempt(
            id=uuid4(),
            user_id=user_id,
            skill="writing",
            raw_score=word_count,
            max_score=min_words,
            band_estimate=band_str,
            task_type=task_type,
            ai_feedback=ai_result.get("feedback", ""),
            ai_details=ai_result,
            submitted_content={"task_prompt": task_prompt, "essay": essay_text[:2000]},
        )
        self.db.add(attempt)
        self.db.flush()

        return {
            "attempt_id": attempt.id,
            "skill": "writing",
            "task_type": task_type,
            "word_count": word_count,
            "band_estimate": band_str,
            "overall_band": band,
            "task_achievement": float(ai_result.get("task_achievement", band)),
            "coherence_cohesion": float(ai_result.get("coherence_cohesion", band)),
            "lexical_resource": float(ai_result.get("lexical_resource", band)),
            "grammatical_range": float(ai_result.get("grammatical_range", band)),
            "feedback": ai_result.get("feedback", ""),
            "strengths": ai_result.get("strengths", []),
            "improvements": ai_result.get("improvements", []),
            "grammar_examples": ai_result.get("grammar_examples", []),
            "vocabulary_feedback": ai_result.get("vocabulary_feedback", ""),
            "band_justification": ai_result.get("band_justification", ""),
            "meets_word_requirement": word_count >= min_words,
            "min_words_required": min_words,
        }

    # ------------------------------------------------------------------
    # Speaking Evaluation
    # ------------------------------------------------------------------

    def evaluate_speaking(
        self,
        user_id: UUID,
        part: int,
        question: str,
        transcribed_text: str,
    ) -> dict[str, Any]:
        """Evaluate IELTS speaking response with AI."""
        from app.services.ai_provider import get_ai_provider

        ai_result: dict[str, Any] = {}
        try:
            prompt = _SPEAKING_EVAL_PROMPT.format(
                part=part,
                question=question,
                response_text=transcribed_text,
            )
            provider = get_ai_provider()
            raw = provider.generate_response([
                {"role": "system", "content": "You are an IELTS speaking examiner. Respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ])
            ai_result = json.loads(self._extract_json(raw))
        except Exception as exc:
            logger.warning("IELTS speaking AI evaluation failed: %s", exc)
            ai_result = {
                "overall_band": 5.0,
                "fluency_coherence": 5.0,
                "lexical_resource": 5.0,
                "grammatical_range": 5.0,
                "pronunciation_estimate": 5.0,
                "feedback": "AI evaluation temporarily unavailable.",
                "strengths": [],
                "improvements": [],
                "model_answer_hint": "",
            }

        band = float(ai_result.get("overall_band", 5.0))
        attempt = IELTSAttempt(
            id=uuid4(),
            user_id=user_id,
            skill="speaking",
            band_estimate=f"{band:.1f}",
            task_type=f"part{part}",
            ai_feedback=ai_result.get("feedback", ""),
            ai_details=ai_result,
            submitted_content={"part": part, "question": question, "response": transcribed_text},
        )
        self.db.add(attempt)
        self.db.flush()

        return {
            "attempt_id": attempt.id,
            "skill": "speaking",
            "part": part,
            "band_estimate": f"{band:.1f}",
            "overall_band": band,
            "fluency_coherence": float(ai_result.get("fluency_coherence", band)),
            "lexical_resource": float(ai_result.get("lexical_resource", band)),
            "grammatical_range": float(ai_result.get("grammatical_range", band)),
            "pronunciation_estimate": float(ai_result.get("pronunciation_estimate", band)),
            "feedback": ai_result.get("feedback", ""),
            "strengths": ai_result.get("strengths", []),
            "improvements": ai_result.get("improvements", []),
            "model_answer_hint": ai_result.get("model_answer_hint", ""),
            "transcribed_text": transcribed_text,
        }

    # ------------------------------------------------------------------
    # Save objective test scores (reading / listening / mock)
    # ------------------------------------------------------------------

    def save_test_score(
        self,
        user_id: UUID,
        skill: str,
        raw_score: int,
        max_score: int,
        submitted_content: dict | None = None,
    ) -> dict[str, Any]:
        """Persist score for reading, listening, or mock test."""
        band = self._estimate_band_from_score(raw_score, max_score)

        attempt = IELTSAttempt(
            id=uuid4(),
            user_id=user_id,
            skill=skill,
            raw_score=raw_score,
            max_score=max_score,
            band_estimate=f"{band:.1f}",
            submitted_content=submitted_content,
        )
        self.db.add(attempt)
        self.db.flush()

        return {
            "attempt_id": attempt.id,
            "skill": skill,
            "raw_score": raw_score,
            "max_score": max_score,
            "percentage": round((raw_score / max(max_score, 1)) * 100),
            "band_estimate": f"{band:.1f}",
        }

    # ------------------------------------------------------------------
    # Dashboard — user's IELTS history
    # ------------------------------------------------------------------

    def get_user_history(self, user_id: UUID) -> dict[str, Any]:
        """Return all IELTS attempts grouped by skill."""
        attempts = (
            self.db.query(IELTSAttempt)
            .filter(IELTSAttempt.user_id == user_id)
            .order_by(IELTSAttempt.created_at.desc())
            .limit(50)
            .all()
        )

        grouped: dict[str, list] = {
            "writing": [], "reading": [], "listening": [], "speaking": [], "mock": [],
        }
        for a in attempts:
            skill = a.skill if a.skill in grouped else "mock"
            grouped[skill].append({
                "attempt_id": a.id,
                "skill": a.skill,
                "raw_score": a.raw_score,
                "max_score": a.max_score,
                "band_estimate": a.band_estimate,
                "task_type": a.task_type,
                "feedback": a.ai_feedback,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            })

        # Latest band per skill
        latest_bands: dict[str, str | None] = {}
        for skill, items in grouped.items():
            latest_bands[skill] = items[0]["band_estimate"] if items else None

        # Overall estimated band (average of latest per skill)
        valid_bands = [float(b) for b in latest_bands.values() if b is not None]
        overall = round(sum(valid_bands) / len(valid_bands) * 2) / 2 if valid_bands else None

        return {
            "attempts": grouped,
            "latest_bands": latest_bands,
            "overall_estimate": f"{overall:.1f}" if overall else None,
            "total_attempts": len(attempts),
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _estimate_band_from_score(raw: int, max_score: int) -> float:
        """Rough IELTS band estimate from a percentage correct score."""
        if max_score == 0:
            return 5.0
        pct = raw / max_score
        if pct >= 0.90:
            return 8.5
        if pct >= 0.80:
            return 7.5
        if pct >= 0.70:
            return 6.5
        if pct >= 0.60:
            return 5.5
        if pct >= 0.50:
            return 5.0
        if pct >= 0.40:
            return 4.5
        return 4.0

    @staticmethod
    def _extract_json(text: str) -> str:
        fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if fence:
            return fence.group(1)
        obj = re.search(r"\{.*\}", text, re.DOTALL)
        if obj:
            return obj.group(0)
        raise ValueError("No JSON found in LLM response")
