"""IELTS API endpoints — writing evaluation, speaking evaluation, score saving, dashboard."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.services.ielts_service import IELTSService
from app.services.voice.factory import get_speech_to_text_provider

router = APIRouter(prefix="/ielts", tags=["IELTS"])


def get_ielts_service(db: Session = Depends(get_db)) -> IELTSService:
    return IELTSService(db)


# ---------------------------------------------------------------------------
# Writing
# ---------------------------------------------------------------------------

@router.post("/writing/evaluate")
def evaluate_writing(
    task_type: str = Form(..., description="task1 or task2"),
    task_prompt: str = Form(...),
    essay_text: str = Form(...),
    current_user: User = Depends(get_current_active_user),
    service: IELTSService = Depends(get_ielts_service),
) -> dict[str, Any]:
    """Evaluate IELTS writing with Groq LLaMA. Returns band score + detailed feedback."""
    return service.evaluate_writing(
        user_id=current_user.id,
        task_type=task_type,
        task_prompt=task_prompt,
        essay_text=essay_text,
    )


# ---------------------------------------------------------------------------
# Speaking
# ---------------------------------------------------------------------------

@router.post("/speaking/evaluate")
async def evaluate_speaking_audio(
    part: int = Form(..., description="1, 2, or 3"),
    question: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    service: IELTSService = Depends(get_ielts_service),
) -> dict[str, Any]:
    """
    Transcribe audio via Groq Whisper then evaluate with AI.
    Returns band score + feedback.
    """
    from app.core.exceptions import AIConfigurationError, AIProviderError
    from fastapi import HTTPException

    audio_bytes = await file.read()
    if len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Audio file is too small.")

    # STT
    try:
        stt = get_speech_to_text_provider()
        result = stt.transcribe(
            audio_bytes=audio_bytes,
            filename=file.filename or "audio",
            content_type=file.content_type or "application/octet-stream",
        )
        transcribed = result.text
    except (AIConfigurationError, AIProviderError) as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    # AI evaluation
    return service.evaluate_speaking(
        user_id=current_user.id,
        part=part,
        question=question,
        transcribed_text=transcribed,
    )


@router.post("/speaking/evaluate-text")
def evaluate_speaking_text(
    part: int = Form(...),
    question: str = Form(...),
    response_text: str = Form(...),
    current_user: User = Depends(get_current_active_user),
    service: IELTSService = Depends(get_ielts_service),
) -> dict[str, Any]:
    """Evaluate typed/transcribed speaking response — useful when audio not available."""
    return service.evaluate_speaking(
        user_id=current_user.id,
        part=part,
        question=question,
        transcribed_text=response_text,
    )


# ---------------------------------------------------------------------------
# Reading / Listening / Mock — save objective scores
# ---------------------------------------------------------------------------

@router.post("/score")
def save_score(
    skill: str = Form(..., description="reading | listening | mock"),
    raw_score: int = Form(...),
    max_score: int = Form(...),
    current_user: User = Depends(get_current_active_user),
    service: IELTSService = Depends(get_ielts_service),
) -> dict[str, Any]:
    """Persist an objective test score (reading, listening, mock)."""
    return service.save_test_score(
        user_id=current_user.id,
        skill=skill,
        raw_score=raw_score,
        max_score=max_score,
    )


# ---------------------------------------------------------------------------
# Dashboard / History
# ---------------------------------------------------------------------------

@router.get("/history")
def get_history(
    current_user: User = Depends(get_current_active_user),
    service: IELTSService = Depends(get_ielts_service),
) -> dict[str, Any]:
    """Return all IELTS attempts grouped by skill with band estimates."""
    return service.get_user_history(user_id=current_user.id)
