"""Add Phase 10 curriculum/lesson/exercise/progress tables.

Revision ID: 20260810_0001
Revises: 20260809_0001
Create Date: 2026-08-10
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260810_0001"
down_revision: Union[str, None] = "20260809_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "curriculums",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("target_language", sa.String(length=50), nullable=False),
        sa.Column("native_language", sa.String(length=50), nullable=True),
        sa.Column("difficulty_level", sa.String(length=20), nullable=False),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "difficulty_level IN ('beginner', 'intermediate', 'advanced')",
            name="ck_curriculums_difficulty_level",
        ),
    )
    op.create_index("ix_curriculums_target_language", "curriculums", ["target_language"])
    op.create_index("ix_curriculums_target_language_is_published", "curriculums", ["target_language", "is_published"])

    op.create_table(
        "units",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("curriculum_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["curriculum_id"], ["curriculums.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("curriculum_id", "order_index", name="uq_units_curriculum_order"),
    )
    op.create_index("ix_units_curriculum_id", "units", ["curriculum_id"])

    op.create_table(
        "lessons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("unit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("target_language", sa.String(length=50), nullable=False),
        sa.Column("native_language", sa.String(length=50), nullable=True),
        sa.Column("difficulty_level", sa.String(length=20), nullable=False),
        sa.Column("estimated_duration_minutes", sa.Integer(), nullable=False, server_default="10"),
        sa.Column(
            "learning_objectives",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("unit_id", "order_index", name="uq_lessons_unit_order"),
        sa.CheckConstraint(
            "difficulty_level IN ('beginner', 'intermediate', 'advanced')",
            name="ck_lessons_difficulty_level",
        ),
    )
    op.create_index("ix_lessons_unit_id", "lessons", ["unit_id"])

    op.create_table(
        "exercises",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("exercise_type", sa.String(length=30), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column(
            "content",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("points", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("lesson_id", "order_index", name="uq_exercises_lesson_order"),
        sa.CheckConstraint(
            "exercise_type IN ('multiple_choice', 'translation', 'fill_in_blank', "
            "'sentence_correction', 'vocabulary', 'listening')",
            name="ck_exercises_exercise_type",
        ),
    )
    op.create_index("ix_exercises_lesson_id", "exercises", ["lesson_id"])

    op.create_table(
        "user_lesson_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lesson_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="not_started"),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("completion_percentage", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_accessed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson_progress_user_lesson"),
        sa.CheckConstraint(
            "status IN ('not_started', 'in_progress', 'completed')",
            name="ck_user_lesson_progress_status",
        ),
    )
    op.create_index("ix_user_lesson_progress_user_id", "user_lesson_progress", ["user_id"])
    op.create_index("ix_user_lesson_progress_lesson_id", "user_lesson_progress", ["lesson_id"])

    op.create_table(
        "user_exercise_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("exercise_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lesson_progress_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("submitted_answer", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("score_awarded", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("attempt_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["lesson_progress_id"], ["user_lesson_progress.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_user_exercise_attempts_user_exercise",
        "user_exercise_attempts",
        ["user_id", "exercise_id"],
    )
    op.create_index(
        "ix_user_exercise_attempts_lesson_progress_id",
        "user_exercise_attempts",
        ["lesson_progress_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_user_exercise_attempts_lesson_progress_id", table_name="user_exercise_attempts")
    op.drop_index("ix_user_exercise_attempts_user_exercise", table_name="user_exercise_attempts")
    op.drop_table("user_exercise_attempts")

    op.drop_index("ix_user_lesson_progress_lesson_id", table_name="user_lesson_progress")
    op.drop_index("ix_user_lesson_progress_user_id", table_name="user_lesson_progress")
    op.drop_table("user_lesson_progress")

    op.drop_index("ix_exercises_lesson_id", table_name="exercises")
    op.drop_table("exercises")

    op.drop_index("ix_lessons_unit_id", table_name="lessons")
    op.drop_table("lessons")

    op.drop_index("ix_units_curriculum_id", table_name="units")
    op.drop_table("units")

    op.drop_index("ix_curriculums_target_language_is_published", table_name="curriculums")
    op.drop_index("ix_curriculums_target_language", table_name="curriculums")
    op.drop_table("curriculums")