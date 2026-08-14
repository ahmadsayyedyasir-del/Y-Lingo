# app/api/v1/conversations.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.core.exceptions import ConversationSessionNotFoundError
from app.models.conversation_session import ConversationSession
from app.models.user import User
from app.repositories.gamification_profile_repository import GamificationProfileRepository
from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_achievement_repository import UserAchievementRepository
from app.schemas.ai_conversation import (
    AIResponse,
    CoachingReportResponse,
    ConversationHistoryResponse,
    MessageResponse,
    MessageSendRequest,
    SessionResponse,
    StartSessionRequest,
)
from app.services.conversation_service import ConversationService
from app.services.gamification_service import GamificationService

router = APIRouter(prefix="/conversations", tags=["AI Conversations"])

def _make_limiter() -> Limiter:
    import os
    if os.environ.get("TESTING", "").lower() in ("1", "true", "yes"):
        return Limiter(key_func=get_remote_address, enabled=False, default_limits=["100000/minute"])
    return Limiter(key_func=get_remote_address)

limiter = _make_limiter()


def get_gamification_service(db: Session = Depends(get_db)) -> GamificationService:
    return GamificationService(
        gamification_profile_repository=GamificationProfileRepository(db),
        user_achievement_repository=UserAchievementRepository(db),
        profile_repository=ProfileRepository(db),
    )


@router.post("/start", response_model=SessionResponse, status_code=201)
def start_conversation(
    payload: StartSessionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> SessionResponse:
    service = ConversationService(db)
    session = service.start_session(
        user_id=current_user.id,
        language=payload.language,
        native_language=payload.native_language,
        level=payload.level,
        topic=payload.topic,
    )
    return SessionResponse.model_validate(session)


@router.post("/{session_id}/messages", response_model=AIResponse)
@limiter.limit("30/minute")
def send_message(
    request: Request,
    session_id: UUID,
    payload: MessageSendRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    gamification: GamificationService = Depends(get_gamification_service),
) -> dict[str, Any]:
    service = ConversationService(db)
    session = db.get(ConversationSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = service.send_message(
        session_id=session_id,
        user_message=payload.message,
        language=payload.language,
        level=payload.level,
        native_language=current_user.profile.native_language if current_user.profile else "Urdu",
        scenario=payload.scenario if hasattr(payload, 'scenario') else "casual",
    )

    # Award XP for sending a message — best-effort, never raises
    gam_result = gamification.award_message_xp(current_user)

    # Attach gamification event to response so frontend can show XP toast
    if gam_result is not None:
        result["xp_earned"] = gam_result.xp_earned
        result["total_xp"] = gam_result.total_xp
        result["level"] = gam_result.level
        result["leveled_up"] = gam_result.leveled_up
        result["newly_unlocked_achievements"] = [
            {"code": a.code, "name": a.name, "description": a.description}
            for a in gam_result.newly_unlocked_achievements
        ]

    return result


@router.get("/{session_id}/messages", response_model=list[MessageResponse])
def get_messages(
    session_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> list[MessageResponse]:
    session = db.get(ConversationSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    service = ConversationService(db)
    messages = service.get_session_messages(session_id)
    return [MessageResponse.model_validate(m) for m in messages]


@router.post("/{session_id}/end", response_model=CoachingReportResponse)
def end_conversation(
    session_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    gamification: GamificationService = Depends(get_gamification_service),
) -> dict[str, Any]:
    session = db.get(ConversationSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    service = ConversationService(db)
    report = service.end_session(session_id)

    # Award XP for completing a session — best-effort, never raises
    gamification.award_session_end_xp(current_user)

    return report


@router.get("/history", response_model=ConversationHistoryResponse)
def get_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    limit: int = Query(default=20, ge=1, le=100),
) -> ConversationHistoryResponse:
    """Get user's conversation history with scores."""
    service = ConversationService(db)
    sessions = service.get_user_sessions(current_user.id)
    sessions = sessions[:limit]

    # Get scores for each session (if ended and report exists)
    result_sessions = []
    for session in sessions:
        session_dict = {
            "id": session.id,
            "title": session.title,
            "target_language": session.target_language,
            "native_language": session.native_language,
            "status": session.status,
            "created_at": session.created_at,
            "ended_at": session.ended_at,
        }
        
        # Check if session is ended and has a coaching report
        if session.status == "ended":
            messages = service.get_session_messages(session.id)
            if messages:
                # We could get scores from coaching report table if available
                # For now, we compute basic scores
                user_messages = [m for m in messages if m.role == "user"]
                fluency_score = min(85 + len(user_messages) // 5, 100)
                grammar_score = min(75 + len(user_messages) // 5, 100)
                vocabulary_score = min(70 + len(user_messages) // 5, 100)
                session_dict["fluency_score"] = fluency_score
                session_dict["grammar_score"] = grammar_score
                session_dict["vocabulary_score"] = vocabulary_score
                session_dict["message_count"] = len(messages)
        
        result_sessions.append(session_dict)

    return ConversationHistoryResponse(
        sessions=result_sessions,
        total=len(result_sessions),
    )


@router.get("/{session_id}/report", response_model=CoachingReportResponse)
def get_coaching_report(
    session_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    session = db.get(ConversationSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if session.status != "ended":
        raise HTTPException(status_code=400, detail="Session is not ended yet")

    service = ConversationService(db)
    report = service.end_session(session_id)
    return report