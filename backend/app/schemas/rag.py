# app/schemas/rag.py
"""Pydantic schemas for RAG (Retrieval-Augmented Generation) endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


# ---------------------------------------------------------------------------
# Document Upload
# ---------------------------------------------------------------------------

class DocumentUploadResponse(BaseModel):
    """Response after uploading a document."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    success: bool
    document_id: UUID
    filename: str
    chunk_count: int
    status: str
    message: str


class DocumentResponse(BaseModel):
    """Document metadata response."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: UUID
    filename: str
    title: str
    description: str | None = None
    category: str
    file_type: str
    file_size: int
    chunk_count: int
    status: str
    created_at: datetime


# ---------------------------------------------------------------------------
# RAG Search
# ---------------------------------------------------------------------------

class RAGSearchRequest(BaseModel):
    """Request for searching documents."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    query: str = Field(..., min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)
    category: str | None = None


class RAGSearchResult(BaseModel):
    """Single search result."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    chunk_id: UUID
    document_id: UUID
    content: str
    similarity_score: float
    document: dict[str, Any]  # Contains title, filename, etc.


class RAGSearchResponse(BaseModel):
    """Response for search."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    query: str
    results: list[RAGSearchResult]
    total: int