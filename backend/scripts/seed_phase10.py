"""One-off Phase 10 seed — inserts test curriculum data. Idempotent."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import text

from app.db.session import SessionLocal

CURRICULUM_ID = UUID("11111111-1111-1111-1111-111111111111")
UNIT_ID = UUID("22222222-2222-2222-2222-222222222222")
LESSON_ID = UUID("33333333-3333-3333-3333-333333333333")
MC_ID = UUID("44444444-4444-4444-4444-444444444444")
TR_ID = UUID("55555555-5555-5555-5555-555555555555")


def main() -> None:
    db = SessionLocal()
    try:
        exists = db.execute(
            text("SELECT 1 FROM curriculums WHERE id = :id"),
            {"id": str(CURRICULUM_ID)},
        ).scalar()

        if exists:
            print("SEED_SKIP: curriculum already exists")
            return

        db.execute(
            text(
                """
                INSERT INTO curriculums
                    (id, title, description, target_language, native_language,
                     difficulty_level, is_published)
                VALUES
                    (:id, :title, :description, :target_language, :native_language,
                     :difficulty_level, true)
                """
            ),
            {
                "id": str(CURRICULUM_ID),
                "title": "Spanish Basics",
                "description": "Starter curriculum for testing Phase 10",
                "target_language": "Spanish",
                "native_language": "English",
                "difficulty_level": "beginner",
            },
        )

        db.execute(
            text(
                """
                INSERT INTO units
                    (id, curriculum_id, title, description, order_index, is_published)
                VALUES
                    (:id, :curriculum_id, :title, :description, 1, true)
                """
            ),
            {
                "id": str(UNIT_ID),
                "curriculum_id": str(CURRICULUM_ID),
                "title": "Greetings",
                "description": "Basic greetings unit",
            },
        )

        db.execute(
            text(
                """
                INSERT INTO lessons
                    (id, unit_id, title, description, target_language, native_language,
                     difficulty_level, estimated_duration_minutes, learning_objectives,
                     order_index, is_published)
                VALUES
                    (:id, :unit_id, :title, :description, :target_language,
                     :native_language, :difficulty_level, 10,
                     CAST(:objectives AS jsonb), 1, true)
                """
            ),
            {
                "id": str(LESSON_ID),
                "unit_id": str(UNIT_ID),
                "title": "Saying Hello",
                "description": "Learn how to say hello",
                "target_language": "Spanish",
                "native_language": "English",
                "difficulty_level": "beginner",
                "objectives": '["Greet someone in Spanish"]',
            },
        )

        db.execute(
            text(
                """
                INSERT INTO exercises
                    (id, lesson_id, exercise_type, prompt, content, points, order_index)
                VALUES
                    (:id, :lesson_id, :exercise_type, :prompt,
                     CAST(:content AS jsonb), 10, 1)
                """
            ),
            {
                "id": str(MC_ID),
                "lesson_id": str(LESSON_ID),
                "exercise_type": "multiple_choice",
                "prompt": 'How do you say "hello" in Spanish?',
                "content": (
                    '{"choices":[{"id":"a","text":"Hola"},'
                    '{"id":"b","text":"Adios"}],"correctOptionId":"a"}'
                ),
            },
        )

        db.execute(
            text(
                """
                INSERT INTO exercises
                    (id, lesson_id, exercise_type, prompt, content, points, order_index)
                VALUES
                    (:id, :lesson_id, :exercise_type, :prompt,
                     CAST(:content AS jsonb), 10, 2)
                """
            ),
            {
                "id": str(TR_ID),
                "lesson_id": str(LESSON_ID),
                "exercise_type": "translation",
                "prompt": 'Translate: "Good morning"',
                "content": (
                    '{"acceptedAnswers":["Buenos dias","Buenos días","buenos dias"]}'
                ),
            },
        )

        db.commit()
        print("SEED_OK: curriculum/unit/lesson/exercises inserted")
    except Exception as e:
        db.rollback()
        print("SEED_FAIL:", type(e).__name__, str(e))
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()