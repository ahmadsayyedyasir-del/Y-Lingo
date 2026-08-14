# backend/scripts/create_system_user.py
"""
Create system user for default documents.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from uuid import UUID
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.user import User

SYSTEM_USER_ID = UUID("00000000-0000-0000-0000-000000000000")

# Create database session
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_system_user():
    db = SessionLocal()
    
    # Check if system user already exists
    existing = db.get(User, SYSTEM_USER_ID)
    if existing:
        print("✅ System user already exists")
        db.close()
        return
    
    # Create system user
    system_user = User(
        id=SYSTEM_USER_ID,
        full_name="System",
        username="system",
        email="system@ylingo.com",
        hashed_password="",
        is_active=True,
        is_verified=True,
        is_admin=True,
    )
    
    db.add(system_user)
    db.commit()
    db.refresh(system_user)
    
    print("✅ System user created successfully")
    db.close()

if __name__ == "__main__":
    create_system_user()