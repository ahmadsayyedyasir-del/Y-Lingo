# Y-Lingo API

Production backend for the Y-Lingo AI language-learning SaaS platform.

## Stack

- Python 3.12+
- FastAPI
- Pydantic v2
- SQLAlchemy 2.x (wired in later phases)
- Alembic (migrations in later phases)
- PostgreSQL

## Phase status

| Phase | Scope | Status |
|-------|--------|--------|
| 1 | Foundation (config, logging, health, structure) | Current |
| 2 | Database models + Alembic | Planned |
| 3 | JWT auth (signup / login) | Planned |
| 4 | Profile / Settings APIs | Planned |
| 5 | AI conversation modules | Planned |

## Quick start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000