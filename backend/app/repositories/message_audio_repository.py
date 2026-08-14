
from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.message_audio import MessageAudio


class MessageAudioRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add(
        self,
        *,
        message_id: UUID,
        session_id: UUID,
        source: str,
        audio_url: str,
        mime_type: str,
        duration_seconds: float | None = None,
    ) -> MessageAudio:
        audio = MessageAudio(
            message_id=message_id,
            session_id=session_id,
            source=source,
            audio_url=audio_url,
            mime_type=mime_type,
            duration_seconds=duration_seconds,
        )
        self.db.add(audio)
        self.db.flush()
        self.db.refresh(audio)
        return audio

    def get_by_message_id(self, message_id: UUID) -> MessageAudio | None:
        stmt = select(MessageAudio).where(MessageAudio.message_id == message_id)
        return self.db.scalar(stmt)