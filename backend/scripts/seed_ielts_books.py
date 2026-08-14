# backend/scripts/seed_ielts_books.py
"""
Seed script to pre-load IELTS books into the system.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from uuid import UUID
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.services.rag_service import RAGService

SYSTEM_USER_ID = UUID("00000000-0000-0000-0000-000000000000")

# Create database session
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ Correct file names (after removing extra .pdf)
IELTS_BOOKS = [
    {
        "filename": "Cambridge 17_text.pdf",
        "title": "Cambridge IELTS 17",
        "description": "Official Cambridge IELTS practice book with authentic tests",
        "category": "ielts"
    },
    {
        "filename": "ielts-academic-writing-sample.pdf",
        "title": "IELTS Academic Writing",
        "description": "IELTS academic writing task 2 sample essays and tips",
        "category": "ielts"
    },
    {
        "filename": "Magoosh+IELTS+Vocabulary.pdf",
        "title": "Magoosh IELTS Vocabulary",
        "description": "Essential IELTS vocabulary with definitions and examples",
        "category": "ielts"
    },
]

def seed_ielts_books():
    db = SessionLocal()
    service = RAGService(db)
    
    books_uploaded = 0
    books_failed = 0
    
    print("📚 Starting IELTS books seeding...")
    
    base_path = Path("E:/Y-Lingo/backend/data/ielts")
    print(f"📁 Looking in: {base_path}")
    print("-" * 50)
    
    for book in IELTS_BOOKS:
        file_path = base_path / book["filename"]
        
        if not file_path.exists():
            print(f"❌ File not found: {file_path}")
            books_failed += 1
            continue
        
        try:
            print(f"📄 Uploading: {book['title']}...")
            
            with open(file_path, "rb") as f:
                file_content = f.read()
            
            result = service.process_pdf(
                user_id=SYSTEM_USER_ID,
                file_content=file_content,
                filename=book["filename"],
                title=book["title"],
                description=book["description"],
                category=book["category"],
            )
            
            print(f"✅ Uploaded: {book['title']} ({result['chunk_count']} chunks)")
            books_uploaded += 1
            
        except Exception as e:
            print(f"❌ Failed to upload {book['title']}: {str(e)}")
            books_failed += 1
    
    print("-" * 50)
    print(f"📊 Summary: {books_uploaded} uploaded, {books_failed} failed")
    
    db.close()
    return books_uploaded, books_failed

if __name__ == "__main__":
    seed_ielts_books()