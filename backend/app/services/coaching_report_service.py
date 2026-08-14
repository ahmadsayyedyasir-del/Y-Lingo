"""Coaching report generation service for Phase 12."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from app.models.conversation_message import ConversationMessage
from app.models.conversation_session import ConversationSession
from app.services.grammar_analyzer import get_grammar_analyzer
from app.services.vocabulary_analyzer import get_vocabulary_analyzer


class CoachingReportService:
    """Generate comprehensive coaching reports for conversation sessions."""

    def __init__(self, session: ConversationSession, messages: list[ConversationMessage]):
        self.session = session
        self.messages = messages
        self.user_messages = [m for m in messages if m.role == "user"]
        self.assistant_messages = [m for m in messages if m.role == "assistant"]

        self.grammar_analyzer = get_grammar_analyzer(session.target_language)
        self.vocabulary_analyzer = get_vocabulary_analyzer(session.target_language)

    def generate_report(self) -> dict[str, Any]:
        """Generate complete coaching report."""
        # Analyze all user messages
        all_mistakes = []
        all_vocabulary = []

        for msg in self.user_messages:
            # Grammar analysis
            analysis = self.grammar_analyzer.analyze_sentence(msg.content)
            if analysis["mistakes"]:
                all_mistakes.extend(analysis["mistakes"])

            # Vocabulary extraction
            vocab = self.vocabulary_analyzer.extract_vocabulary(msg.content)
            all_vocabulary.extend(vocab)

        # Calculate scores
        scores = self._calculate_scores()
        grammar_mistakes = self._extract_unique_mistakes(all_mistakes)
        vocabulary_items = self._extract_unique_vocabulary(all_vocabulary)
        strengths, weaknesses = self._analyze_strengths_weaknesses(
            scores,
            grammar_mistakes,
            vocabulary_items,
        )

        return {
            "session_id": self.session.id,
            "fluency_score": scores["fluency"],
            "grammar_score": scores["grammar"],
            "vocabulary_score": scores["vocabulary"],
            "pronunciation_readiness_score": scores["pronunciation"],
            "strengths": strengths[:5],
            "weaknesses": weaknesses[:5],
            "improvement_tips": self._generate_tips(weaknesses),
            "new_vocabulary": vocabulary_items[:10],
            "grammar_mistakes": grammar_mistakes[:10],
            "summary": self._generate_summary(scores, len(self.messages)),
            "recommended_practice": self._generate_recommendation(weaknesses),
            "generated_at": datetime.now(timezone.utc),
        }

    def _calculate_scores(self) -> dict[str, int]:
        """Calculate performance scores."""
        total_messages = len(self.user_messages)

        # Base scores
        fluency = 70  # Base fluency score
        grammar = 70  # Base grammar score
        vocabulary = 70  # Base vocabulary score
        pronunciation = 60  # Base pronunciation score

        # Enhance based on message count
        if total_messages >= 10:
            fluency += 10
            grammar += 5
            vocabulary += 5
        elif total_messages >= 5:
            fluency += 5
            grammar += 3
            vocabulary += 3

        # Calculate average message length (vocabulary indicator)
        total_words = sum(len(m.content.split()) for m in self.user_messages)
        if total_messages > 0:
            avg_words = total_words / total_messages
            if avg_words >= 10:
                vocabulary += 10
            elif avg_words >= 5:
                vocabulary += 5

        # Grammar deduction based on mistakes
        all_mistakes = []
        for msg in self.user_messages:
            analysis = self.grammar_analyzer.analyze_sentence(msg.content)
            all_mistakes.extend(analysis["mistakes"])

        mistake_count = len(all_mistakes)
        grammar = max(50, grammar - (mistake_count * 2))

        # Cap scores
        return {
            "fluency": min(100, fluency),
            "grammar": min(100, grammar),
            "vocabulary": min(100, vocabulary),
            "pronunciation": min(100, pronunciation),
        }

    def _extract_unique_mistakes(self, mistakes: list[dict]) -> list[dict]:
        """Extract unique mistakes from list."""
        seen = set()
        unique = []

        for mistake in mistakes:
            key = mistake["original"]
            if key not in seen:
                seen.add(key)
                unique.append(mistake)

        return unique

    def _extract_unique_vocabulary(self, vocabulary: list[dict]) -> list[dict]:
        """Extract unique vocabulary items."""
        seen = set()
        unique = []

        for item in vocabulary:
            word = item.get("word", "").lower()
            if word and word not in seen:
                seen.add(word)
                unique.append(item)

        return unique

    def _analyze_strengths_weaknesses(
        self,
        scores: dict[str, int],
        mistakes: list[dict],
        vocabulary: list[dict],
    ) -> tuple[list[str], list[str]]:
        """Analyze strengths and weaknesses from data."""
        strengths = []
        weaknesses = []

        # Score-based analysis
        if scores["fluency"] >= 80:
            strengths.append("Good conversational flow")
        elif scores["fluency"] < 60:
            weaknesses.append("Fluency needs improvement")

        if scores["grammar"] >= 80:
            strengths.append("Good grammar usage")
        elif scores["grammar"] < 60:
            weaknesses.append("Grammar needs more practice")

        if scores["vocabulary"] >= 80:
            strengths.append("Rich vocabulary")
        elif scores["vocabulary"] < 60:
            weaknesses.append("Vocabulary is limited")

        # Mistake category analysis
        categories = {}
        for mistake in mistakes:
            cat = mistake.get("category", "general")
            categories[cat] = categories.get(cat, 0) + 1

        if categories:
            most_common = max(categories.items(), key=lambda x: x[1])
            if most_common[0] != "general":
                weaknesses.append(f"Focus on {most_common[0]} rules")

        # Vocabulary analysis
        if vocabulary:
            strengths.append(f"Learned {len(vocabulary)} new words")
        else:
            weaknesses.append("Try to use more varied vocabulary")

        # Message count analysis
        message_count = len(self.user_messages)
        if message_count >= 8:
            strengths.append("Good engagement in conversation")
        elif message_count < 3:
            weaknesses.append("Short conversation - try longer practice")

        return strengths, weaknesses

    def _generate_tips(self, weaknesses: list[str]) -> list[str]:
        """Generate improvement tips based on weaknesses."""
        tips = []

        for weakness in weaknesses:
            if "grammar" in weakness.lower():
                tips.append("Practice basic grammar rules daily")
                tips.append("Write sentences using correct grammar")
            elif "vocabulary" in weakness.lower():
                tips.append("Learn 5 new words each day")
                tips.append("Use new words in conversation")
            elif "fluency" in weakness.lower():
                tips.append("Practice speaking without stopping")
                tips.append("Use filler words naturally")
            elif "short" in weakness.lower():
                tips.append("Try to extend your conversations")
                tips.append("Ask follow-up questions")

        # Default tips if none generated
        if not tips:
            tips = [
                "Practice daily for 10-15 minutes",
                "Review new vocabulary regularly",
                "Listen to native speakers",
            ]

        return tips[:5]

    def _generate_summary(self, scores: dict[str, int], message_count: int) -> str:
        """Generate overall summary."""
        avg_score = sum(scores.values()) / 4

        if avg_score >= 85:
            rating = "Excellent"
        elif avg_score >= 70:
            rating = "Good"
        elif avg_score >= 50:
            rating = "Fair"
        else:
            rating = "Needs improvement"

        return (
            f"Session rating: {rating}. "
            f"You had {message_count} messages and showed "
            f"{'strong' if avg_score >= 70 else 'developing'} performance "
            f"in {self.session.target_language}. "
            f"Keep practicing daily to improve!"
        )

    def _generate_recommendation(self, weaknesses: list[str]) -> str:
        """Generate recommended practice based on weaknesses."""
        if any("grammar" in w.lower() for w in weaknesses):
            return "Focus on grammar exercises and writing practice."

        if any("vocabulary" in w.lower() for w in weaknesses):
            return "Learn new vocabulary with flashcards and practice in context."

        if any("fluency" in w.lower() for w in weaknesses):
            return "Practice speaking daily with longer conversations."

        return "Continue daily conversations and review new vocabulary."


def generate_coaching_report(
    session: ConversationSession,
    messages: list[ConversationMessage],
) -> dict[str, Any]:
    """Generate coaching report for a session."""
    service = CoachingReportService(session, messages)
    return service.generate_report()