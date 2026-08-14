# app/services/rag_service.py
"""RAG Service with real embeddings and pgvector semantic search."""

from __future__ import annotations

import hashlib
import os
import tempfile
import traceback
from typing import Any
from uuid import UUID, uuid4

import PyPDF2
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import InvalidFileError, RAGConfigurationError
from app.models.rag_document import RAGDocument, RAGDocumentChunk

SYSTEM_USER_ID = UUID("00000000-0000-0000-0000-000000000000")

# Load embedding model with fallback
try:
    from sentence_transformers import SentenceTransformer
    _EMBEDDING_MODEL = None
    _MODEL_LOADED = False

    def get_embedding_model():
        global _EMBEDDING_MODEL, _MODEL_LOADED
        if not _MODEL_LOADED:
            try:
                _EMBEDDING_MODEL = SentenceTransformer('all-MiniLM-L6-v2')
                _MODEL_LOADED = True
                print("✅ SentenceTransformer loaded successfully")
            except Exception as e:
                print(f"❌ Failed to load SentenceTransformer: {str(e)}")
                _MODEL_LOADED = False
        return _EMBEDDING_MODEL
except ImportError:
    print("⚠️ SentenceTransformers not installed. Using fallback.")
    _MODEL_LOADED = False
    def get_embedding_model():
        return None


class RAGService:
    """Service for RAG operations with semantic search."""

    def __init__(self, db: Session):
        self.db = db

    def process_pdf(
        self,
        user_id: UUID,
        file_content: bytes,
        filename: str,
        title: str | None = None,
        description: str | None = None,
        category: str = "general",
    ) -> dict[str, Any]:
        """Process PDF with real embeddings."""
        if user_id is None:
            user_id = SYSTEM_USER_ID

        if not filename.lower().endswith('.pdf'):
            raise InvalidFileError("Only PDF files are supported.")

        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(file_content)
            tmp_path = tmp_file.name

        try:
            text_content = self._extract_pdf_text(tmp_path)
            if not text_content or len(text_content.strip()) < 50:
                raise InvalidFileError("PDF contains no readable text.")

            document = RAGDocument(
                id=uuid4(),
                user_id=user_id,
                filename=filename,
                title=title or filename,
                description=description,
                category=category,
                file_type="pdf",
                file_size=len(file_content),
                status="processing",
            )
            self.db.add(document)
            self.db.flush()
            self.db.refresh(document)

            chunks = self._chunk_text(text_content)
            for i, chunk_text in enumerate(chunks):
                try:
                    embedding = self._generate_embedding(chunk_text)
                    embedding_str = str(embedding)
                except Exception as e:
                    print(f"⚠️ Embedding generation failed for chunk {i}: {str(e)}")
                    embedding_str = str([0.0] * 384)

                chunk = RAGDocumentChunk(
                    id=uuid4(),
                    document_id=document.id,
                    content=chunk_text,
                    chunk_index=i,
                    embedding=embedding_str,
                )
                self.db.add(chunk)

            document.status = "processed"
            document.chunk_count = len(chunks)
            self.db.flush()
            self.db.refresh(document)

            return {
                "document_id": document.id,
                "filename": filename,
                "chunk_count": len(chunks),
                "status": "processed",
                "message": f"Successfully processed {len(chunks)} chunks.",
            }

        except Exception as e:
            print(f"❌ RAG processing error: {traceback.format_exc()}")
            if 'document' in locals():
                document.status = "error"
                self.db.flush()
            raise RAGConfigurationError(f"Failed to process PDF: {str(e)}")

        finally:
            os.unlink(tmp_path)

    def _extract_pdf_text(self, pdf_path: str) -> str:
        text_content = ""
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_content += page_text + "\n"
        except Exception as e:
            raise InvalidFileError(f"Failed to read PDF: {str(e)}")
        return text_content

    def _chunk_text(self, text_content: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
        words = text_content.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk_words = words[i:i + chunk_size]
            chunk_text = " ".join(chunk_words)
            if chunk_text.strip():
                chunks.append(chunk_text)
        return chunks

    def _generate_embedding(self, text: str) -> list[float]:
        """Generate embedding using SentenceTransformer or fallback."""
        model = get_embedding_model()
        if model is not None:
            try:
                return model.encode(text).tolist()
            except Exception as e:
                print(f"⚠️ Embedding failed: {str(e)}. Using fallback.")
                return self._fallback_embedding(text)
        return self._fallback_embedding(text)

    def _fallback_embedding(self, text: str) -> list[float]:
        """Fallback embedding using hashing."""
        embedding = []
        words = text.split()[:100]
        for word in words:
            hash_val = hashlib.md5(word.encode()).hexdigest()
            val = int(hash_val[:8], 16) / 0xFFFFFFFF
            embedding.append(val)
        target_size = 384
        if len(embedding) < target_size:
            embedding.extend([0.0] * (target_size - len(embedding)))
        else:
            embedding = embedding[:target_size]
        return embedding

    def search(
        self,
        user_id: UUID,
        query: str,
        top_k: int = 5,
        category: str | None = None,
        include_system: bool = True,
    ) -> list[dict[str, Any]]:
        """Search using semantic (vector) similarity."""
        try:
            query_embedding = self._generate_embedding(query)
            embedding_str = str(query_embedding)

            sql_query = """
                SELECT 
                    c.id as chunk_id,
                    c.document_id,
                    c.content,
                    d.title,
                    d.filename,
                    d.category,
                    1 - (c.embedding <-> %s::vector) as similarity_score
                FROM rag_document_chunks c
                JOIN rag_documents d ON d.id = c.document_id
                WHERE d.status = 'processed'
                    AND (d.user_id = %s
            """
            params = [embedding_str, str(user_id)]

            if include_system:
                sql_query += f" OR d.user_id = '{SYSTEM_USER_ID}'"
            sql_query += ")"
            if category:
                sql_query += " AND d.category = %s"
                params.append(category)
            sql_query += " ORDER BY c.embedding <-> %s::vector LIMIT %s"
            params.append(embedding_str)
            params.append(top_k)

            result = self.db.execute(text(sql_query), params)
            rows = result.fetchall()

            results = []
            for row in rows:
                results.append({
                    "chunk_id": row[0],
                    "document_id": row[1],
                    "content": row[2],
                    "similarity_score": float(row[6]) if row[6] is not None else 0.0,
                    "document": {
                        "title": row[3] or "Unknown",
                        "filename": row[4] or "Unknown",
                        "category": row[5] or "general",
                    }
                })
            return results

        except Exception as e:
            print(f"⚠️ Semantic search failed: {str(e)}. Using text fallback.")
            return self._text_fallback(user_id, query, top_k, category, include_system)

    def _text_fallback(
        self,
        user_id: UUID,
        query: str,
        top_k: int = 5,
        category: str | None = None,
        include_system: bool = True,
    ) -> list[dict[str, Any]]:
        """Fallback: simple text search."""
        stmt = (
            select(RAGDocumentChunk)
            .join(RAGDocument, RAGDocument.id == RAGDocumentChunk.document_id)
            .where(RAGDocument.status == "processed")
        )
        if include_system:
            stmt = stmt.where(
                (RAGDocument.user_id == user_id) |
                (RAGDocument.user_id == SYSTEM_USER_ID)
            )
        else:
            stmt = stmt.where(RAGDocument.user_id == user_id)
        if category:
            stmt = stmt.where(RAGDocument.category == category)

        chunks = self.db.scalars(stmt).all()
        query_words = query.lower().split()
        scored = []
        for chunk in chunks:
            content_lower = chunk.content.lower()
            score = sum(1 for word in query_words if word in content_lower)
            scored.append((chunk, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        top_chunks = scored[:top_k]

        results = []
        for chunk, score in top_chunks:
            results.append({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "content": chunk.content,
                "similarity_score": min(1.0, score / max(1, len(query_words))),
                "document": {
                    "title": chunk.document.title if chunk.document else "Unknown",
                    "filename": chunk.document.filename if chunk.document else "Unknown",
                    "category": chunk.document.category if chunk.document else "general",
                }
            })
        return results

    def get_context_for_prompt(
        self,
        user_id: UUID,
        query: str,
        top_k: int = 3,
    ) -> str:
        results = self.search(user_id, query, top_k, include_system=True)
        if not results:
            return "No relevant documents found."
        context = "Relevant context from your documents:\n\n"
        for i, result in enumerate(results, 1):
            context += f"[{i}] From {result['document']['title']}:\n"
            context += f"{result['content']}\n\n"
        return context

    def get_user_documents(self, user_id: UUID) -> list[dict[str, Any]]:
        stmt = select(RAGDocument).where(
            (RAGDocument.user_id == user_id) |
            (RAGDocument.user_id == SYSTEM_USER_ID)
        ).order_by(RAGDocument.created_at.desc())
        documents = self.db.scalars(stmt).all()
        return [{
            "id": doc.id,
            "filename": doc.filename,
            "title": doc.title,
            "description": doc.description,
            "category": doc.category,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "chunk_count": doc.chunk_count,
            "status": doc.status,
            "created_at": doc.created_at,
        } for doc in documents]

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