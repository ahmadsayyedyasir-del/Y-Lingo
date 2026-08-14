# app/models/rag_document.py
from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class RAGDocument(TimestampMixin, Base):
    __tablename__ = "rag_documents"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="general", server_default="general")
    file_type: Mapped[str] = mapped_column(String(20), nullable=False, default="pdf", server_default="pdf")
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    chunk_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="processing", server_default="processing")

    user: Mapped["User"] = relationship("User", back_populates="rag_documents")
    chunks: Mapped[list["RAGDocumentChunk"]] = relationship("RAGDocumentChunk", back_populates="document", cascade="all, delete-orphan", passive_deletes=True)

    def __repr__(self) -> str:
        return f"<RAGDocument id={self.id} title={self.title!r}>"


class RAGDocumentChunk(Base):
    __tablename__ = "rag_document_chunks"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    document_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("rag_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    # This column will be vector(384) after migration; we keep as Text for SQLAlchemy
    embedding: Mapped[list[float] | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), server_default="now()")

    document: Mapped["RAGDocument"] = relationship("RAGDocument", back_populates="chunks")

    def __repr__(self) -> str:
        return f"<RAGDocumentChunk id={self.id} document_id={self.document_id} index={self.chunk_index}>"


# Indexes
Index("ix_rag_documents_user_id_category", RAGDocument.user_id, RAGDocument.category)
Index("ix_rag_documents_status", RAGDocument.status)
Index("ix_rag_document_chunks_document_id_index", RAGDocumentChunk.document_id, RAGDocumentChunk.chunk_index)