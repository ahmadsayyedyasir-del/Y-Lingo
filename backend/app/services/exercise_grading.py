"""Deterministic, rule-based exercise answer checking and content
sanitization/validation (Phase 10 grading/sanitization + Phase 11 admin
write-side validation — no AI involved).

Documented content/answer shape per exercise_type (camelCase, matching the
API's alias convention everywhere else):

  multiple_choice:
    content:          {"choices": [{"id": "a", "text": "..."}, ...], "correctOptionId": "a"}
    submitted_answer: {"selectedOptionId": "a"}

  translation / fill_in_blank / sentence_correction / vocabulary / listening:
    content:          {..., "acceptedAnswers": ["answer one", "answer two"]}
                       (plus type-specific display fields: sourceText, template,
                       word, incorrectSentence, audioUrl — passed through as-is)
    submitted_answer: {"text": "..."}

Grading never raises on malformed content — it marks the answer incorrect so
a bad content row can never break a user's submission flow. Validation (used
only on the admin write path) is the opposite: it raises so bad content can
never be saved in the first place.
"""

from __future__ import annotations

import re

from app.core.exceptions import InvalidExerciseContentError
from app.models.exercise import (
    EXERCISE_TYPE_FILL_IN_BLANK,
    EXERCISE_TYPE_LISTENING,
    EXERCISE_TYPE_MULTIPLE_CHOICE,
    EXERCISE_TYPE_SENTENCE_CORRECTION,
    EXERCISE_TYPE_TRANSLATION,
    EXERCISE_TYPE_VOCABULARY,
    Exercise,
)

_TEXT_ANSWER_TYPES = frozenset(
    {
        EXERCISE_TYPE_TRANSLATION,
        EXERCISE_TYPE_FILL_IN_BLANK,
        EXERCISE_TYPE_SENTENCE_CORRECTION,
        EXERCISE_TYPE_VOCABULARY,
        EXERCISE_TYPE_LISTENING,
    }
)


def grade_answer(exercise: Exercise, submitted_answer: dict) -> bool:
    """Return True if the submitted answer is correct for this exercise."""
    content = exercise.content or {}

    if exercise.exercise_type == EXERCISE_TYPE_MULTIPLE_CHOICE:
        return _grade_multiple_choice(content, submitted_answer)

    if exercise.exercise_type in _TEXT_ANSWER_TYPES:
        return _grade_text_answer(content, submitted_answer)

    return False


def sanitize_exercise_content(exercise_type: str, content: dict) -> dict:
    """Strip correct-answer fields before an exercise is shown to a client."""
    if not isinstance(content, dict):
        return {}

    if exercise_type == EXERCISE_TYPE_MULTIPLE_CHOICE:
        return {"choices": content.get("choices", [])}

    if exercise_type in _TEXT_ANSWER_TYPES:
        return {key: value for key, value in content.items() if key != "acceptedAnswers"}

    return {}


def validate_exercise_content(exercise_type: str, content: dict) -> None:
    """
    Validate admin-submitted exercise content before it is saved.

    Raises InvalidExerciseContentError if the shape is wrong for the given
    exercise_type. Used only on the Phase 11 admin write path — never called
    from the learner-facing grading/sanitization flow above.
    """
    if not isinstance(content, dict):
        raise InvalidExerciseContentError()

    if exercise_type == EXERCISE_TYPE_MULTIPLE_CHOICE:
        _validate_multiple_choice_content(content)
        return

    if exercise_type in _TEXT_ANSWER_TYPES:
        _validate_text_answer_content(content)
        if exercise_type == EXERCISE_TYPE_LISTENING:
            audio_url = content.get("audioUrl")
            if not isinstance(audio_url, str) or not audio_url.strip():
                raise InvalidExerciseContentError(
                    "Listening exercises require a non-empty 'audioUrl' field."
                )
        return

    raise InvalidExerciseContentError(f"Unknown exercise type: {exercise_type!r}")


def _validate_multiple_choice_content(content: dict) -> None:
    choices = content.get("choices")
    if not isinstance(choices, list) or len(choices) < 2:
        raise InvalidExerciseContentError("multiple_choice exercises require at least 2 'choices'.")

    seen_ids: set[str] = set()
    for choice in choices:
        if not isinstance(choice, dict):
            raise InvalidExerciseContentError("Each choice must be an object with 'id' and 'text'.")
        choice_id = choice.get("id")
        choice_text = choice.get("text")
        if not isinstance(choice_id, str) or not choice_id.strip():
            raise InvalidExerciseContentError("Each choice must have a non-empty string 'id'.")
        if not isinstance(choice_text, str) or not choice_text.strip():
            raise InvalidExerciseContentError("Each choice must have a non-empty string 'text'.")
        if choice_id in seen_ids:
            raise InvalidExerciseContentError(f"Duplicate choice id: {choice_id!r}.")
        seen_ids.add(choice_id)

    correct_option_id = content.get("correctOptionId")
    if not isinstance(correct_option_id, str) or correct_option_id not in seen_ids:
        raise InvalidExerciseContentError(
            "'correctOptionId' must match one of the provided choice ids."
        )


def _validate_text_answer_content(content: dict) -> None:
    accepted_answers = content.get("acceptedAnswers")
    if not isinstance(accepted_answers, list) or not accepted_answers:
        raise InvalidExerciseContentError("'acceptedAnswers' must be a non-empty list of strings.")
    for answer in accepted_answers:
        if not isinstance(answer, str) or not answer.strip():
            raise InvalidExerciseContentError("Every accepted answer must be a non-empty string.")


def _grade_multiple_choice(content: dict, submitted_answer: dict) -> bool:
    correct_option_id = content.get("correctOptionId")
    selected_option_id = submitted_answer.get("selectedOptionId")
    if correct_option_id is None or selected_option_id is None:
        return False
    return str(selected_option_id).strip() == str(correct_option_id).strip()


def _grade_text_answer(content: dict, submitted_answer: dict) -> bool:
    accepted_answers = content.get("acceptedAnswers")
    if not isinstance(accepted_answers, list) or not accepted_answers:
        return False

    submitted_text = submitted_answer.get("text")
    if not isinstance(submitted_text, str) or not submitted_text.strip():
        return False

    normalized_submitted = _normalize(submitted_text)
    return any(_normalize(str(answer)) == normalized_submitted for answer in accepted_answers)


def _normalize(text: str) -> str:
    """Lowercase, collapse whitespace, strip surrounding punctuation for lenient matching."""
    cleaned = text.strip().lower()
    cleaned = re.sub(r"\s+", " ", cleaned)
    cleaned = cleaned.strip(".,!?;:'\"")
    return cleaned