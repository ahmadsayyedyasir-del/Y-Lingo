"""Vocabulary analysis service for language coaching."""

from __future__ import annotations

import re
from typing import Any

from app.core.exceptions import InvalidMessageContentError


class VocabularyAnalyzer:
    """Extract and analyze vocabulary from conversations."""

    # Common words to ignore (stopwords)
    STOPWORDS = {
        "english": {
            "i", "you", "he", "she", "it", "we", "they",
            "me", "him", "her", "us", "them",
            "my", "your", "his", "her", "our", "their",
            "the", "a", "an", "this", "that", "these", "those",
            "and", "or", "but", "so", "for", "nor", "yet",
            "is", "am", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "do", "does", "did",
            "will", "would", "shall", "should", "may", "might", "must",
            "can", "could", "to", "from", "of", "for", "with", "without",
            "in", "on", "at", "by", "under", "over", "through",
            "yes", "no", "not", "very", "really", "quite", "too",
            "so", "such", "some", "any", "more", "most",
        },
        "urdu": set(),
        "arabic": set(),
    }

    # Synonyms for common words
    SYNONYMS = {
        "good": ["great", "excellent", "wonderful", "fantastic", "amazing"],
        "bad": ["terrible", "awful", "horrible", "poor", "unfortunate"],
        "big": ["large", "huge", "enormous", "massive", "giant"],
        "small": ["tiny", "little", "miniature", "compact", "petite"],
        "happy": ["joyful", "delighted", "pleased", "cheerful", "content"],
        "sad": ["upset", "gloomy", "depressed", "melancholy", "sorrowful"],
        "nice": ["pleasant", "kind", "lovely", "delightful", "charming"],
        "great": ["excellent", "outstanding", "remarkable", "exceptional"],
        "think": ["believe", "consider", "suppose", "imagine", "assume"],
        "know": ["understand", "comprehend", "realize", "recognize"],
        "want": ["desire", "wish", "long for", "crave", "aspire"],
        "like": ["enjoy", "appreciate", "admire", "favor", "prefer"],
        "very": ["extremely", "exceptionally", "remarkably", "incredibly"],
        "really": ["truly", "genuinely", "actually", "absolutely"],
        "make": ["create", "produce", "construct", "build", "form"],
        "get": ["obtain", "acquire", "receive", "gain", "secure"],
    }

    def __init__(self, language: str = "english"):
        self.language = language.lower()
        self.stopwords = self.STOPWORDS.get(self.language, set())

    def extract_vocabulary(self, text: str, min_length: int = 3) -> list[dict[str, Any]]:
        """
        Extract vocabulary from text.

        Returns:
            List of words with metadata
        """
        if not text or not text.strip():
            return []

        # Clean text and split into words
        cleaned = re.sub(r"[^\w\s]", "", text)
        words = cleaned.lower().split()

        vocabulary = []
        seen = set()

        for word in words:
            # Skip short words and stopwords
            if len(word) < min_length:
                continue
            if word in self.stopwords:
                continue
            if word in seen:
                continue

            seen.add(word)
            vocabulary.append({
                "word": word,
                "original": word,
                "length": len(word),
                "suggestions": self.get_synonyms(word),
            })

        return vocabulary

    def get_synonyms(self, word: str, limit: int = 3) -> list[str]:
        """Get synonyms for a word."""
        word_lower = word.lower()
        synonyms = self.SYNONYMS.get(word_lower, [])

        # Also check if word is a synonym of something
        for key, values in self.SYNONYMS.items():
            if word_lower in values:
                synonyms.extend([v for v in values if v != word_lower])

        # Remove duplicates and limit
        unique = list(dict.fromkeys(synonyms))
        return unique[:limit]

    def generate_vocabulary_list(
        self,
        conversation_messages: list[dict[str, str]],
    ) -> list[dict[str, Any]]:
        """
        Generate a vocabulary list from conversation messages.

        Args:
            conversation_messages: List of {"role": "user/assistant", "content": "..."}

        Returns:
            List of vocabulary items with metadata
        """
        all_text = " ".join([m["content"] for m in conversation_messages if m["role"] == "user"])
        return self.extract_vocabulary(all_text)

    def track_vocabulary_progress(
        self,
        user_id: str,
        vocabulary_items: list[dict[str, Any]],
    ) -> None:
        """Track vocabulary progress for a user."""
        # Placeholder - will be enhanced with DB integration
        pass

    def get_known_vocabulary(self, user_id: str) -> set[str]:
        """Get known vocabulary for a user."""
        # Placeholder - will be enhanced with DB integration
        return set()

    def suggest_new_vocabulary(
        self,
        user_id: str,
        topic: str | None = None,
        count: int = 5,
    ) -> list[dict[str, Any]]:
        """Suggest new vocabulary for a user based on level and topic."""
        # Placeholder - will be enhanced with DB integration
        return []


# Singleton instance
_default_analyzer: VocabularyAnalyzer | None = None


def get_vocabulary_analyzer(language: str = "english") -> VocabularyAnalyzer:
    """Get or create a vocabulary analyzer instance."""
    global _default_analyzer
    if _default_analyzer is None:
        _default_analyzer = VocabularyAnalyzer(language)
    return _default_analyzer