"""AI-enhanced exercise grading for open-ended questions."""

from __future__ import annotations

from typing import Any

from app.core.exceptions import AIConfigurationError, AIProviderError
from app.models.exercise import Exercise
from app.services.ai_provider import get_ai_provider
from app.services.exercise_grading import grade_answer as deterministic_grade


class AIEnhancedGradingService:
    """
    AI-powered grading for open-ended exercises.

    Use deterministic grading for:
    - multiple_choice
    - fill_in_blank (with accepted answers)

    Use AI grading for:
    - translation (when open-ended)
    - sentence_correction (open-ended)
    - vocabulary (open-ended)
    - listening (open-ended)
    - writing tasks
    - essay questions
    """

    def __init__(self):
        self.provider = get_ai_provider()

    def grade_exercise(
        self,
        exercise: Exercise,
        submitted_answer: dict,
    ) -> dict[str, Any]:
        """
        Grade an exercise using the appropriate method.

        Returns:
            {
                "is_correct": bool,
                "score": int,
                "feedback": str,
                "confidence": float,
                "suggestions": list[str],
            }
        """
        exercise_type = exercise.exercise_type

        # Use deterministic grading for closed questions
        if exercise_type in ["multiple_choice"]:
            is_correct = deterministic_grade(exercise, submitted_answer)
            return {
                "is_correct": is_correct,
                "score": exercise.points if is_correct else 0,
                "feedback": "Correct!" if is_correct else "Incorrect. Try again.",
                "confidence": 1.0,
                "suggestions": [],
            }

        # Use deterministic grading if accepted answers exist
        if exercise.content.get("acceptedAnswers"):
            is_correct = deterministic_grade(exercise, submitted_answer)
            if is_correct:
                return {
                    "is_correct": True,
                    "score": exercise.points,
                    "feedback": "Perfect! Your answer is correct.",
                    "confidence": 1.0,
                    "suggestions": [],
                }

        # Use AI grading for open-ended questions
        return self._ai_grade(exercise, submitted_answer)

    def _ai_grade(
        self,
        exercise: Exercise,
        submitted_answer: dict,
    ) -> dict[str, Any]:
        """Grade using AI."""
        prompt = self._build_grading_prompt(exercise, submitted_answer)

        try:
            response = self.provider.generate_response([
                {"role": "system", "content": "You are an expert language teacher and grader."},
                {"role": "user", "content": prompt},
            ])

            return self._parse_ai_response(response, exercise)

        except (AIConfigurationError, AIProviderError):
            # Fallback: partial credit
            return {
                "is_correct": False,
                "score": exercise.points // 2,
                "feedback": "Unable to grade automatically. Please review your answer.",
                "confidence": 0.0,
                "suggestions": ["Check grammar", "Check vocabulary", "Re-read the question"],
            }

    def _build_grading_prompt(self, exercise: Exercise, submitted_answer: dict) -> str:
        """Build grading prompt for AI."""
        exercise_type = exercise.exercise_type
        prompt = exercise.prompt
        answer_text = submitted_answer.get("text", "")

        type_descriptions = {
            "translation": "Translate the given text.",
            "sentence_correction": "Correct the sentence.",
            "vocabulary": "Use the word correctly.",
            "listening": "Answer based on what you heard.",
            "fill_in_blank": "Fill in the blank.",
        }

        type_desc = type_descriptions.get(exercise_type, "Complete the exercise.")

        return f"""Grade this language exercise:

Exercise Type: {exercise_type}
Description: {type_desc}
Question: {prompt}

Student's Answer:
"{answer_text}"

Please provide:
1. Is the answer correct? (true/false)
2. Score out of {exercise.points} points
3. Feedback (2-3 sentences)
4. Suggestions for improvement (list of specific tips)

Format your response as JSON:
{{"is_correct": true/false, "score": 0-{exercise.points}, "feedback": "text", "suggestions": ["tip1", "tip2"]}}"""

    def _parse_ai_response(self, response: str, exercise: Exercise) -> dict[str, Any]:
        """Parse AI response into structured grading output."""
        import json

        try:
            # Try to parse as JSON
            data = json.loads(response)
            return {
                "is_correct": data.get("is_correct", False),
                "score": min(data.get("score", 0), exercise.points),
                "feedback": data.get("feedback", "Thank you for your answer."),
                "confidence": 0.8,
                "suggestions": data.get("suggestions", []),
            }
        except json.JSONDecodeError:
            # Try to extract from text
            return self._extract_from_text(response, exercise)

    def _extract_from_text(self, response: str, exercise: Exercise) -> dict[str, Any]:
        """Extract grading from text response (fallback)."""
        # Simple extraction
        is_correct = "correct" in response.lower() and "incorrect" not in response.lower()
        feedback = response[:200]

        return {
            "is_correct": is_correct,
            "score": exercise.points if is_correct else exercise.points // 2,
            "feedback": feedback,
            "confidence": 0.5,
            "suggestions": ["Review the question", "Practice more"],
        }

    def grade_essay(
        self,
        prompt: str,
        essay: str,
        language: str,
        max_score: int = 100,
    ) -> dict[str, Any]:
        """Grade an essay using AI."""
        grading_prompt = f"""Grade this {language} essay:

Prompt: {prompt}

Essay: {essay}

Provide detailed feedback on:
1. Grammar (score 0-100)
2. Vocabulary (score 0-100)
3. Fluency (score 0-100)
4. Content (score 0-100)
5. Overall score (0-{max_score})
6. Strengths (list)
7. Areas for improvement (list)
8. Suggestions (list)

Format as JSON:
{{"grammar": 0-100, "vocabulary": 0-100, "fluency": 0-100, "content": 0-100, "overall": 0-{max_score}, "strengths": [], "improvements": [], "suggestions": []}}"""

        try:
            response = self.provider.generate_response([
                {"role": "system", "content": "You are an expert language teacher and essay grader."},
                {"role": "user", "content": grading_prompt},
            ])

            import json
            data = json.loads(response)

            return {
                "success": True,
                "scores": {
                    "grammar": data.get("grammar", 0),
                    "vocabulary": data.get("vocabulary", 0),
                    "fluency": data.get("fluency", 0),
                    "content": data.get("content", 0),
                },
                "overall_score": data.get("overall", 0),
                "strengths": data.get("strengths", []),
                "improvements": data.get("improvements", []),
                "suggestions": data.get("suggestions", []),
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "overall_score": max_score // 2,
                "suggestions": ["Try to improve grammar", "Use more vocabulary", "Expand your ideas"],
            }


# Singleton
_default_grader: AIEnhancedGradingService | None = None


def get_ai_grader() -> AIEnhancedGradingService:
    """Get AI grader instance."""
    global _default_grader
    if _default_grader is None:
        _default_grader = AIEnhancedGradingService()
    return _default_grader