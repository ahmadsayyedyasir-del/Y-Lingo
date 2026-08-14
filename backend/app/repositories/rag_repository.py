# app/repositories/rag_repository.py
"""RAG Repository with pgvector support."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models.rag_document import RAGDocument, RAGDocumentChunk

SYSTEM_USER_ID = UUID("00000000-0000-0000-0000-000000000000")


class RAGRepository:
    """Repository for RAG operations with pgvector support."""

    def __init__(self, db: Session):
        self.db = db

    def create_document(
        self,
        user_id: UUID,
        filename: str,
        title: str,
        description: str | None,
        category: str,
        file_type: str,
        file_size: int,
    ) -> RAGDocument:
        document = RAGDocument(
            user_id=user_id,
            filename=filename,
            title=title,
            description=description,
            category=category,
            file_type=file_type,
            file_size=file_size,
            status="processing",
            chunk_count=0,
        )
        self.db.add(document)
        self.db.flush()
        self.db.refresh(document)
        return document

    def update_document_status(self, document_id: UUID, status: str) -> None:
        document = self.db.get(RAGDocument, document_id)
        if document:
            document.status = status
            if status == "processed":
                stmt = select(RAGDocumentChunk).where(RAGDocumentChunk.document_id == document_id)
                document.chunk_count = len(self.db.scalars(stmt).all())
            self.db.flush()

    def create_chunk(
        self,
        document_id: UUID,
        content: str,
        chunk_index: int,
        embedding: list[float],
    ) -> RAGDocumentChunk:
        chunk = RAGDocumentChunk(
            document_id=document_id,
            content=content,
            chunk_index=chunk_index,
            embedding=embedding,
        )
        self.db.add(chunk)
        self.db.flush()
        self.db.refresh(chunk)
        return chunk

    def search_chunks(
        self,
        user_id: UUID,
        query_embedding: list[float],
        top_k: int = 5,
        category: str | None = None,
        include_system: bool = True,
    ) -> list[dict]:
        """Search chunks using vector similarity with pgvector."""
        # Build query
        stmt = """
            SELECT 
                c.id as chunk_id,
                c.document_id,
                c.content,
                c.embedding,
                d.title,
                d.filename,
                d.category,
                1 - (c.embedding <-> :query_embedding) as similarity_score
            FROM rag_document_chunks c
            JOIN rag_documents d ON d.id = c.document_id
            WHERE d.status = 'processed'
                AND (d.user_id = :user_id
        """

        if include_system:
            stmt += f" OR d.user_id = '{SYSTEM_USER_ID}'"
        stmt += ")"
        if category:
            stmt += " AND d.category = :category"
        stmt += " ORDER BY c.embedding <-> :query_embedding LIMIT :top_k"

        params = {
            "query_embedding": query_embedding,
            "user_id": str(user_id),
            "top_k": top_k,
        }
        if category:
            params["category"] = category

        try:
            result = self.db.execute(text(stmt), params)
            rows = result.fetchall()

            return [
                {
                    "chunk_id": row[0],
                    "document_id": row[1],
                    "content": row[2],
                    "similarity_score": float(row[7]) if row[7] is not None else 0.0,
                    "document": {
                        "title": row[4] or "Unknown",
                        "filename": row[5] or "Unknown",
                        "category": row[6] or "general",
                    }
                }
                for row in rows
            ]

        except Exception as e:
            print(f"⚠️ pgvector query failed: {str(e)}")
            return []

    def get_user_documents(self, user_id: UUID) -> list[RAGDocument]:
        stmt = select(RAGDocument).where(
            (RAGDocument.user_id == user_id) |
            (RAGDocument.user_id == SYSTEM_USER_ID)
        ).order_by(RAGDocument.created_at.desc())
        return list(self.db.scalars(stmt).all())

    def delete_document(self, user_id: UUID, document_id: UUID) -> bool:
        document = self.db.get(RAGDocument, document_id)
        if not document or (document.user_id != user_id and document.user_id != SYSTEM_USER_ID):
            return False

        stmt = select(RAGDocumentChunk).where(RAGDocumentChunk.document_id == document_id)
        chunks = self.db.scalars(stmt).all()
        for chunk in chunks:
            self.db.delete(chunk)

        self.db.delete(document)
        self.db.flush()
        return True