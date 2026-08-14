"""Advanced grammar analysis service for language coaching."""

from __future__ import annotations

import re
from typing import Any

from app.core.exceptions import InvalidMessageContentError


class GrammarAnalyzer:
    """Analyze grammar mistakes and provide corrections."""

    # Language-specific grammar patterns
    PATTERNS = {
        "english": [
            {
                "pattern": r"\b(have|has|had)\s+went\b",
                "correction": r"\1 gone",
                "explanation": "Use 'gone' after 'have/has/had' (past participle)",
                "category": "verb_form",
            },
            {
                "pattern": r"\b(is|am|are)\s+go\b",
                "correction": r"\1 going",
                "explanation": "Use 'going' for present continuous",
                "category": "verb_form",
            },
            {
                "pattern": r"\bwas\s+go\b",
                "correction": "went",
                "explanation": "Use 'went' for past tense",
                "category": "verb_form",
            },
            {
                "pattern": r"\b(i)\s+has\b",
                "correction": r"\1 have",
                "explanation": "Use 'have' with 'I'",
                "category": "subject_verb_agreement",
            },
            {
                "pattern": r"\b(she|he|it)\s+have\b",
                "correction": r"\1 has",
                "explanation": "Use 'has' with he/she/it",
                "category": "subject_verb_agreement",
            },
            {
                "pattern": r"\b(they|we|you)\s+has\b",
                "correction": r"\1 have",
                "explanation": "Use 'have' with they/we/you",
                "category": "subject_verb_agreement",
            },
            {
                "pattern": r"\b(a)\s+([aeiou])",
                "correction": r"an \2",
                "explanation": "Use 'an' before vowel sounds",
                "category": "article",
            },
            {
                "pattern": r"\b(an)\s+([^aeiou])",
                "correction": r"a \2",
                "explanation": "Use 'a' before consonant sounds",
                "category": "article",
            },
            {
                "pattern": r"\b(more)\s+(better|worse)",
                "correction": r"\2",
                "explanation": "Remove 'more' before comparatives",
                "category": "comparative",
            },
            {
                "pattern": r"\b(very)\s+(perfect|unique|excellent)",
                "correction": r"\2",
                "explanation": "Avoid 'very' with absolute adjectives",
                "category": "adverb",
            },
        ],
        "urdu": [
            # Urdu patterns (simplified for now)
        ],
        "arabic": [
            # Arabic patterns (simplified for now)
        ],
    }

    def __init__(self, language: str = "english"):
        self.language = language.lower()
        self.patterns = self.PATTERNS.get(self.language, [])

    def analyze(self, text: str) -> list[dict[str, Any]]:
        """
        Analyze text for grammar mistakes.

        Returns:
            List of mistakes with corrections and explanations
        """
        if not text or not text.strip():
            return []

        mistakes = []
        text_lower = text.lower()

        for pattern_info in self.patterns:
            pattern = pattern_info["pattern"]
            if re.search(pattern, text_lower, re.IGNORECASE):
                # Find the actual mistake in original text
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    original = match.group(0)
                    correction = self._apply_correction(
                        original,
                        pattern_info["correction"],
                        match,
                    )
                    mistakes.append({
                        "original": original,
                        "correction": correction,
                        "explanation": pattern_info["explanation"],
                        "category": pattern_info.get("category", "general"),
                    })

        return mistakes

    def analyze_sentence(self, text: str) -> dict[str, Any]:
        """
        Full sentence analysis with grammar score.

        Returns:
            dict with mistakes, score, and overall rating
        """
        mistakes = self.analyze(text)
        word_count = len(text.split())

        # Calculate score
        if word_count == 0:
            score = 100
        else:
            mistake_count = len(mistakes)
            # Each mistake reduces score by 5-10 points
            deduction = min(mistake_count * 7, 50)
            score = max(50, 100 - deduction)

        # Determine rating
        if score >= 90:
            rating = "excellent"
        elif score >= 80:
            rating = "good"
        elif score >= 70:
            rating = "fair"
        else:
            rating = "needs_improvement"

        return {
            "text": text,
            "mistakes": mistakes,
            "mistake_count": len(mistakes),
            "score": score,
            "rating": rating,
            "word_count": word_count,
        }

    def _apply_correction(self, original: str, correction_pattern: str, match: re.Match) -> str:
        """Apply correction pattern to original text."""
        try:
            # If correction is a string template with groups
            if "\\" in correction_pattern:
                return re.sub(match.re.pattern, correction_pattern, original, flags=re.IGNORECASE)
            return correction_pattern
        except Exception:
            return original

    def get_common_mistakes(self, user_id: str | None = None) -> list[dict[str, Any]]:
        """
        Get common mistakes for a user (from database).

        This will be implemented with database integration.
        """
        # Placeholder - will be enhanced with DB integration
        return []

    def track_mistake(
        self,
        user_id: str,
        original: str,
        correction: str,
        explanation: str,
        category: str = "general",
    ) -> None:
        """Track a mistake for a user (for personalization)."""
        # Placeholder - will be enhanced with DB integration
        pass


# Singleton instance
_default_analyzer: GrammarAnalyzer | None = None


def get_grammar_analyzer(language: str = "english") -> GrammarAnalyzer:
    """Get or create a grammar analyzer instance."""
    global _default_analyzer
    if _default_analyzer is None:
        _default_analyzer = GrammarAnalyzer(language)
    return _default_analyzer