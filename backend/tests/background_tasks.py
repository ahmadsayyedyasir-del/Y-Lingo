"""Background tasks for async processing."""

from __future__ import annotations

import asyncio
import threading
from datetime import datetime, timezone
from typing import Any, Callable
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.conversation_message import ConversationMessage
from app.models.conversation_session import ConversationSession
from app.models.session_coaching_report import SessionCoachingReport
from app.services.coaching_report_service import generate_coaching_report


class BackgroundTaskManager:
    """Manage background tasks with a simple in-memory queue."""

    _tasks: dict[str, dict[str, Any]] = {}
    _lock = threading.Lock()

    @classmethod
    def submit(cls, task_id: str, func: Callable, *args, **kwargs) -> str:
        """Submit a background task."""
        with cls._lock:
            cls._tasks[task_id] = {
                "status": "pending",
                "started_at": datetime.now(timezone.utc),
                "function": func,
                "args": args,
                "kwargs": kwargs,
                "result": None,
                "error": None,
            }

        # Run in background
        thread = threading.Thread(target=cls._run_task, args=(task_id,))
        thread.daemon = True
        thread.start()

        return task_id

    @classmethod
    def _run_task(cls, task_id: str) -> None:
        """Run a background task."""
        with cls._lock:
            task = cls._tasks.get(task_id)
            if not task:
                return

            task["status"] = "running"

        try:
            result = task["function"](*task["args"], **task["kwargs"])

            with cls._lock:
                task["status"] = "completed"
                task["result"] = result
                task["completed_at"] = datetime.now(timezone.utc)

        except Exception as e:
            with cls._lock:
                task["status"] = "failed"
                task["error"] = str(e)
                task["completed_at"] = datetime.now(timezone.utc)

    @classmethod
    def get_status(cls, task_id: str) -> dict[str, Any]:
        """Get task status."""
        with cls._lock:
            task = cls._tasks.get(task_id)
            if not task:
                return {"status": "not_found"}

            return {
                "status": task["status"],
                "started_at": task.get("started_at"),
                "completed_at": task.get("completed_at"),
                "result": task.get("result"),
                "error": task.get("error"),
            }


# ---------------------------------------------------------------------------
# Specific Background Tasks
# ---------------------------------------------------------------------------

def generate_coaching_report_background(
    session_id: UUID,
    user_id: UUID,
) -> None:
    """
    Generate coaching report for a session in the background.
    """
    db = SessionLocal()
    try:
        # Get session and messages
        session = db.get(ConversationSession, session_id)
        if not session or session.user_id != user_id:
            return

        messages = db.query(ConversationMessage).filter(
            ConversationMessage.session_id == session_id
        ).order_by(ConversationMessage.sequence.asc()).all()

        if not messages:
            return

        # Generate report
        report_data = generate_coaching_report(session, messages)

        # Store report
        report = SessionCoachingReport(
            session_id=session_id,
            fluency_score=report_data["fluency_score"],
            grammar_score=report_data["grammar_score"],
            vocabulary_score=report_data["vocabulary_score"],
            pronunciation_readiness_score=report_data["pronunciation_readiness_score"],
            strengths=report_data["strengths"],
            weaknesses=report_data["weaknesses"],
            improvement_tips=report_data["improvement_tips"],
            recommended_practice=report_data["recommended_practice"],
            summary=report_data["summary"],
            generated_at=report_data["generated_at"],
        )
        db.add(report)
        db.commit()

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def process_pdf_background(
    document_id: UUID,
    file_content: bytes,
    filename: str,
    user_id: UUID,
) -> None:
    """
    Process a PDF document in the background.
    """
    # This will be implemented when the RAG service is fully ready
    # For now, use a placeholder
    from app.services.rag_service import RAGService

    db = SessionLocal()
    try:
        service = RAGService(db)
        service.process_pdf(
            user_id=user_id,
            file_content=file_content,
            filename=filename,
            title=filename,
            category="general",
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def async_generate_report(session_id: UUID, user_id: UUID) -> str:
    """Submit report generation as a background task."""
    task_id = f"report_{session_id}"
    BackgroundTaskManager.submit(
        task_id,
        generate_coaching_report_background,
        session_id,
        user_id,
    )
    return task_id


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def get_task_status(task_id: str) -> dict[str, Any]:
    """Get the status of a background task."""
    return BackgroundTaskManager.get_status(task_id)


# Scheduler for periodic tasks (placeholder)
class TaskScheduler:
    """Simple task scheduler for periodic jobs."""

    _running = False
    _tasks: list[dict[str, Any]] = []

    @classmethod
    def add_periodic_task(
        cls,
        interval_seconds: int,
        func: Callable,
        *args,
        **kwargs,
    ) -> None:
        """Add a periodic task."""
        cls._tasks.append({
            "interval": interval_seconds,
            "function": func,
            "args": args,
            "kwargs": kwargs,
            "last_run": None,
        })

    @classmethod
    def start(cls) -> None:
        """Start the scheduler."""
        if cls._running:
            return

        cls._running = True

        def _run():
            while cls._running:
                for task in cls._tasks:
                    try:
                        if task["last_run"] is None or (
                            datetime.now(timezone.utc) - task["last_run"]
                        ).seconds >= task["interval"]:
                            task["function"](*task["args"], **task["kwargs"])
                            task["last_run"] = datetime.now(timezone.utc)
                    except Exception:
                        pass
                asyncio.sleep(1)

        thread = threading.Thread(target=_run)
        thread.daemon = True
        thread.start()

    @classmethod
    def stop(cls) -> None:
        """Stop the scheduler."""
        cls._running = False