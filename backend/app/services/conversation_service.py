# app/services/conversation_service.py
"""Conversation service with AI integration and coaching reports."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import (
    AIConfigurationError,
    AIProviderError,
    ConversationSessionNotFoundError,
    InvalidMessageContentError,
)
from app.models.conversation_message import ConversationMessage
from app.models.conversation_session import ConversationSession
from app.services.ai_provider import get_ai_provider
from app.services.conversation_manager import ConversationManager
from app.services.coaching_report_service import CoachingReportService


class ConversationService:
    """Service for AI-powered conversation sessions."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def start_session(
        self,
        user_id: UUID,
        *,
        language: str,
        native_language: str,
        level: str = "beginner",
        topic: str | None = None,
    ) -> ConversationSession:
        """Start a new AI conversation session."""
        title = f"{language} Practice - {topic or 'General'}"
        session = ConversationSession(
            id=uuid4(),
            user_id=user_id,
            title=title,
            target_language=language,
            native_language=native_language,
            status="active",
        )
        self.db.add(session)
        self.db.flush()
        self.db.refresh(session)
        return session

    def send_message(
        self,
        session_id: UUID,
        user_message: str,
        *,
        language: str,
        level: str = "beginner",
        native_language: str = "Urdu",
        scenario: str = "casual",
    ) -> dict[str, Any]:
        """
        Process user message and get AI response with coaching.

        Returns:
            dict with:
            - response: AI text
            - grammar_corrections: list
            - vocabulary_suggestions: list
        """
        # Get session
        session = self.db.get(ConversationSession, session_id)
        if not session or session.status != "active":
            raise ConversationSessionNotFoundError()

        if not user_message or not user_message.strip():
            raise InvalidMessageContentError("Message cannot be empty.")

        # Store user message
        sequence = self.db.query(ConversationMessage).filter(
            ConversationMessage.session_id == session_id
        ).count() + 1

        user_msg = ConversationMessage(
            id=uuid4(),
            session_id=session_id,
            role="user",
            content=user_message,
            sequence=sequence,
        )
        self.db.add(user_msg)
        self.db.flush()
        self.db.refresh(user_msg)

        # Get conversation history
        messages = self.db.query(ConversationMessage).filter(
            ConversationMessage.session_id == session_id
        ).order_by(ConversationMessage.sequence.desc()).limit(10).all()
        messages.reverse()

        # Use ConversationManager for prompt building
        conversation_manager = ConversationManager(
            session=session,
            level=level,
            scenario=scenario,
            native_language=native_language,
        )
        prompt_messages = conversation_manager.build_conversation_prompt(
            history=messages,
            user_message=user_message,
        )

        # Get AI response
        try:
            provider = get_ai_provider()
            ai_response = provider.generate_response(prompt_messages)
            print(f"📤 AI Response: {ai_response[:100]}...")
        except (AIConfigurationError, AIProviderError) as e:
            print(f"❌ AI Error: {str(e)}")
            ai_response = "I'm having trouble responding right now. Please try again."

        # Store AI response
        ai_sequence = sequence + 1
        assistant_msg = ConversationMessage(
            id=uuid4(),
            session_id=session_id,
            role="assistant",
            content=ai_response,
            sequence=ai_sequence,
        )
        self.db.add(assistant_msg)
        self.db.flush()
        self.db.refresh(assistant_msg)

        # Simple grammar/vocabulary analysis
        grammar_corrections = self._extract_grammar_feedback(user_message, ai_response)
        vocabulary_suggestions = self._extract_vocabulary_suggestions(user_message, ai_response)

        return {
            "response": ai_response,
            "grammar_corrections": grammar_corrections,
            "vocabulary_suggestions": vocabulary_suggestions,
        }

    def end_session(self, session_id: UUID) -> dict[str, Any]:
        """
        End a conversation session and generate coaching report.

        Returns:
            dict with coaching report data
        """
        session = self.db.get(ConversationSession, session_id)
        if not session:
            raise ConversationSessionNotFoundError()

        session.status = "ended"
        session.ended_at = datetime.now(timezone.utc)
        self.db.flush()
        self.db.refresh(session)

        # Get all messages for report
        messages = self.db.query(ConversationMessage).filter(
            ConversationMessage.session_id == session_id
        ).order_by(ConversationMessage.sequence.asc()).all()

        # Generate detailed coaching report
        report_service = CoachingReportService(session, messages)
        report = report_service.generate_report()

        # Persist report to session_coaching_reports table.
        # Use upsert pattern: only insert if no report exists yet for this session
        # (session_id has a unique constraint — calling end_session twice is safe).
        self._persist_coaching_report(session_id, report)

        return report

    def _persist_coaching_report(self, session_id: UUID, report: dict) -> None:
        """Write coaching report to DB. Silently skips if one already exists."""
        from app.models.session_coaching_report import SessionCoachingReport

        existing = self.db.query(SessionCoachingReport).filter(
            SessionCoachingReport.session_id == session_id
        ).first()

        if existing is not None:
            return

        db_report = SessionCoachingReport(
            id=uuid4(),
            session_id=session_id,
            fluency_score=report.get("fluency_score", 0),
            grammar_score=report.get("grammar_score", 0),
            vocabulary_score=report.get("vocabulary_score", 0),
            pronunciation_readiness_score=report.get("pronunciation_readiness_score", 0),
            strengths=report.get("strengths", []),
            weaknesses=report.get("weaknesses", []),
            improvement_tips=report.get("improvement_tips", []),
            recommended_practice=report.get("recommended_practice"),
            summary=report.get("summary"),
        )
        self.db.add(db_report)
        self.db.flush()

    def get_session_messages(self, session_id: UUID) -> list[ConversationMessage]:
        """Get all messages for a session."""
        session = self.db.get(ConversationSession, session_id)
        if not session:
            raise ConversationSessionNotFoundError()

        messages = self.db.query(ConversationMessage).filter(
            ConversationMessage.session_id == session_id
        ).order_by(ConversationMessage.sequence.asc()).all()
        return messages

    def get_user_sessions(self, user_id: UUID) -> list[ConversationSession]:
        """Get all sessions for a user."""
        sessions = self.db.query(ConversationSession).filter(
            ConversationSession.user_id == user_id
        ).order_by(ConversationSession.created_at.desc()).all()
        return sessions

    # ------------------------------------------------------------------
    # Private Methods
    # ------------------------------------------------------------------

    def _extract_grammar_feedback(self, user_message: str, ai_response: str) -> list[dict]:
        """Extract grammar corrections from the conversation."""
        corrections = []
        import re

        patterns = [
            (r"have went", "have gone", "Use 'have gone' for present perfect"),
            (r"has went", "has gone", "Use 'has gone' for present perfect"),
            (r"was went", "went", "Use simple past 'went'"),
            (r"is go", "goes", "Subject-verb agreement"),
            (r"are go", "go", "Subject-verb agreement"),
        ]

        for pattern, correction, explanation in patterns:
            if re.search(pattern, user_message.lower()):
                corrections.append({
                    "original": pattern,
                    "correction": correction,
                    "explanation": explanation,
                })

        return corrections

    def _extract_vocabulary_suggestions(self, user_message: str, ai_response: str) -> list[dict]:
        """Extract vocabulary suggestions from the conversation."""
        suggestions = []

        common_words = {
            "good": ["great", "excellent", "wonderful"],
            "bad": ["terrible", "awful", "horrible"],
            "big": ["large", "huge", "massive"],
            "small": ["tiny", "little", "miniature"],
            "happy": ["joyful", "delighted", "pleased"],
            "sad": ["upset", "gloomy", "depressed"],
            "nice": ["pleasant", "kind", "lovely"],
        }

        user_lower = user_message.lower()
        for word, synonyms in common_words.items():
            if word in user_lower and synonyms:
                suggestions.append({
                    "word": word,
                    "suggestion": synonyms[0],
                    "alternatives": synonyms,
                    "context": "Use more expressive vocabulary",
                })

        return suggestions