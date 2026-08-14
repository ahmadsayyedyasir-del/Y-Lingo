# app/api/v1/voice.py
"""Voice API endpoints — STT (Groq Whisper) and TTS (ElevenLabs)."""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.core.exceptions import AIConfigurationError, AIProviderError
from app.models.conversation_session import ConversationSession
from app.models.user import User
from app.schemas.voice import PronunciationFeedbackResponse, TextToSpeechRequest
from app.services.conversation_service import ConversationService
from app.services.voice.factory import get_speech_to_text_provider, get_text_to_speech_provider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice"])


@router.post("/tts", response_class=Response)
async def text_to_speech(
    request: TextToSpeechRequest,
    current_user: User = Depends(get_current_active_user),
) -> Response:
    """Convert text to speech using ElevenLabs. Returns MP3 audio bytes."""
    try:
        tts = get_text_to_speech_provider()
        audio_data = tts.synthesize(request.text)
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"},
        )
    except AIConfigurationError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except AIProviderError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.exception("TTS failed")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form(default="en"),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, str]:
    """Transcribe an uploaded audio file to text using Groq Whisper."""
    try:
        audio_bytes = await file.read()
        if len(audio_bytes) < 100:
            raise HTTPException(status_code=400, detail="Audio file is too small.")

        stt = get_speech_to_text_provider()
        result = stt.transcribe(
            audio_bytes=audio_bytes,
            filename=file.filename or "audio",
            content_type=file.content_type or "application/octet-stream",
        )
        return {"text": result.text, "language": language, "success": "true"}

    except AIConfigurationError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except AIProviderError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Transcription failed")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/pronunciation", response_model=PronunciationFeedbackResponse)
async def analyze_pronunciation(
    file: UploadFile = File(...),
    expected_text: str = Form(...),
    language: str = Form(default="en"),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Analyze pronunciation by transcribing audio and comparing to expected text."""
    try:
        audio_bytes = await file.read()
        if len(audio_bytes) < 100:
            raise HTTPException(status_code=400, detail="Audio file is too small.")

        stt = get_speech_to_text_provider()
        result = stt.transcribe(
            audio_bytes=audio_bytes,
            filename=file.filename or "audio",
            content_type=file.content_type or "application/octet-stream",
        )
        transcribed = result.text

        # Word-level comparison
        transcribed_words = set(transcribed.lower().split())
        expected_words = set(expected_text.lower().split())
        correct = transcribed_words & expected_words
        score = int((len(correct) / max(len(expected_words), 1)) * 100)

        feedback: list[str] = []
        for w in expected_words - transcribed_words:
            feedback.append(f"Missing word: '{w}'")
        for w in transcribed_words - expected_words:
            feedback.append(f"Extra word: '{w}'")
        if not feedback:
            feedback.append("Good pronunciation!")

        return {
            "transcribed": transcribed,
            "expected": expected_text,
            "score": min(100, score),
            "feedback": feedback,
            "is_correct": score >= 70,
        }

    except AIConfigurationError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except AIProviderError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Pronunciation analysis failed")
        raise HTTPException(status_code=500, detail=f"Pronunciation analysis failed: {str(e)}")


@router.post("/conversation/{session_id}/voice-message")
async def send_voice_message(
    session_id: UUID,
    file: UploadFile = File(...),
    language: str = Form(default="en"),
    level: str = Form(default="intermediate"),
    scenario: str = Form(default="casual"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Send a voice message in a conversation session.

    Pipeline: audio upload → Groq Whisper STT → Groq LLaMA reply → return text.
    The caller can optionally call POST /voice/tts with the response text to get audio.
    """
    # Ownership check
    session = db.get(ConversationSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if session.status != "active":
        raise HTTPException(status_code=400, detail="Conversation session is not active")

    try:
        # Step 1: Transcribe audio → text
        audio_bytes = await file.read()
        if len(audio_bytes) < 100:
            raise HTTPException(status_code=400, detail="Audio file is too small.")

        stt = get_speech_to_text_provider()
        stt_result = stt.transcribe(
            audio_bytes=audio_bytes,
            filename=file.filename or "audio",
            content_type=file.content_type or "application/octet-stream",
        )
        user_text = stt_result.text

        # Step 2: Send transcribed text to conversation service → AI reply
        native_language = (
            current_user.profile.native_language
            if current_user.profile
            else "English"
        )
        conv_service = ConversationService(db)
        result = conv_service.send_message(
            session_id=session_id,
            user_message=user_text,
            language=language,
            level=level,
            native_language=native_language,
            scenario=scenario,
        )

        return {
            "transcribed_text": user_text,
            "response": result["response"],
            "grammar_corrections": result.get("grammar_corrections", []),
            "vocabulary_suggestions": result.get("vocabulary_suggestions", []),
        }

    except AIConfigurationError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except AIProviderError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Voice message failed")
        raise HTTPException(status_code=500, detail=f"Voice message failed: {str(e)}")
