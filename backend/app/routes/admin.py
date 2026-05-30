from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
import httpx
from typing import Optional

from app.core.database import get_db
from app.models.db_models import User, Song, Payment, SongView
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/metrics")
async def get_admin_metrics(db: Session = Depends(get_db)):
    """Provides key performance indicators for the application dashboard."""
    total_users = db.query(User).count()
    total_songs = db.query(Song).count()
    premium_users = db.query(User).filter(User.is_premium == True).count()
    total_views = db.query(SongView).count()
    
    # Track Sonauto credits balance if key is present
    sonauto_credits = 0.0
    if settings.SONAUTO_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(
                    "https://api.sonauto.ai/v1/credits/balance",
                    headers={"Authorization": f"Bearer {settings.SONAUTO_API_KEY}"},
                    timeout=5.0
                )
                if res.status_code == 200:
                    sonauto_credits = res.json().get("balance", 0.0)
        except Exception:
            pass
    else:
        # Mock credits balance
        sonauto_credits = 750.0

    return {
        "total_users": total_users,
        "total_songs": total_songs,
        "premium_users": premium_users,
        "total_views": total_views,
        "api_credits": sonauto_credits
    }

@router.get("/generations")
def get_recent_generations(limit: int = 15, db: Session = Depends(get_db)):
    """Lists the latest song generations across the platform."""
    return db.query(Song).order_by(Song.created_at.desc()).limit(limit).all()

@router.post("/moderate/{song_id}")
def moderate_song(song_id: str, is_public: bool, db: Session = Depends(get_db)):
    """Toggles public status for content moderation."""
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    song.is_public = is_public
    db.commit()
    db.refresh(song)
    return {"message": "Content public status updated", "is_public": song.is_public}
