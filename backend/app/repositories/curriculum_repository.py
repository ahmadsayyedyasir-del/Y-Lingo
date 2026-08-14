"""Curriculum persistence operations (Phase 10 read + Phase 11 admin write)."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.curriculum import Curriculum


class CurriculumRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Phase 10 — public, published-only reads (unchanged)
    # ------------------------------------------------------------------

    def list_published(self, target_language: str | None = None) -> list[Curriculum]:
        stmt = select(Curriculum).where(Curriculum.is_published.is_(True))
        if target_language:
            stmt = stmt.where(Curriculum.target_language == target_language)
        stmt = stmt.order_by(Curriculum.title.asc())
        return list(self.db.scalars(stmt).all())

    def get_published_by_id(self, curriculum_id: UUID) -> Curriculum | None:
        stmt = select(Curriculum).where(
            Curriculum.id == curriculum_id,
            Curriculum.is_published.is_(True),
        )
        return self.db.scalar(stmt)

    # ------------------------------------------------------------------
    # Phase 11 — admin reads (any publish state) + writes
    # ------------------------------------------------------------------

    def get_by_id_any_status(self, curriculum_id: UUID) -> Curriculum | None:
        return self.db.get(Curriculum, curriculum_id)

    def list_all(self, target_language: str | None = None) -> list[Curriculum]:
        stmt = select(Curriculum)
        if target_language:
            stmt = stmt.where(Curriculum.target_language == target_language)
        stmt = stmt.order_by(Curriculum.title.asc())
        return list(self.db.scalars(stmt).all())

    def create(
        self,
        *,
        title: str,
        description: str | None,
        target_language: str,
        native_language: str | None,
        difficulty_level: str,
        is_published: bool = False,
    ) -> Curriculum:
        curriculum = Curriculum(
            title=title,
            description=description,
            target_language=target_language,
            native_language=native_language,
            difficulty_level=difficulty_level,
            is_published=is_published,
        )
        self.db.add(curriculum)
        self.db.flush()
        self.db.refresh(curriculum)
        return curriculum

    def update(self, curriculum: Curriculum, data: dict) -> Curriculum:
        for field, value in data.items():
            setattr(curriculum, field, value)
        self.db.flush()
        self.db.refresh(curriculum)
        return curriculum

    def delete(self, curriculum: Curriculum) -> None:
        self.db.delete(curriculum)
        self.db.flush()

    def set_published(self, curriculum: Curriculum, is_published: bool) -> Curriculum:
        curriculum.is_published = is_published
        self.db.flush()
        self.db.refresh(curriculum)
        return curriculum