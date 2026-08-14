# app/api/v1/upload.py
"""RAG upload endpoints with error handling."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.core.exceptions import InvalidFileError, RAGConfigurationError
from app.models.user import User
from app.schemas.rag import (
    DocumentUploadResponse,
    RAGSearchRequest,
    RAGSearchResponse,
)
from app.services.rag_service import RAGService

router = APIRouter(prefix="/upload", tags=["RAG"])


@router.post("/document", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str | None = Form(None),
    description: str | None = Form(None),
    category: str = Form("general"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Upload a PDF document for RAG processing."""
    # Validate file
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    try:
        file_content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read file: {str(e)}"
        )

    if len(file_content) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 20MB limit."
        )

    try:
        service = RAGService(db)
        result = service.process_pdf(
            user_id=current_user.id,
            file_content=file_content,
            filename=file.filename,
            title=title or file.filename,
            description=description,
            category=category,
        )

        return {
            "success": True,
            "document_id": str(result["document_id"]),
            "filename": result["filename"],
            "chunk_count": result["chunk_count"],
            "status": result["status"],
            "message": result["message"],
        }

    except InvalidFileError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RAGConfigurationError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        import traceback
        print(f"❌ Upload error: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}"
        )


@router.get("/documents")
def get_documents(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Get all uploaded documents."""
    service = RAGService(db)
    return service.get_user_documents(current_user.id)


@router.delete("/documents/{document_id}")
def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Delete a document and its chunks."""
    service = RAGService(db)
    success = service.delete_document(current_user.id, document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}


@router.post("/search", response_model=RAGSearchResponse)
def search_documents(
    request: RAGSearchRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Search for relevant content in uploaded documents."""
    try:
        service = RAGService(db)
        results = service.search(
            user_id=current_user.id,
            query=request.query,
            top_k=request.top_k or 5,
            category=request.category,
        )
        return {
            "query": request.query,
            "results": results,
            "total": len(results),
        }
    except Exception as e:
        print(f"❌ Search error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )


@router.post("/context")
def get_context_for_ai(
    request: RAGSearchRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Get formatted context for AI prompt."""
    service = RAGService(db)
    context = service.get_context_for_prompt(
        user_id=current_user.id,
        query=request.query,
        top_k=request.top_k or 3,
    )
    return {"context": context}