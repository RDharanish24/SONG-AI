from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header, Query
from app.core.database import SessionLocal
from sqlalchemy.orm import Session
from typing import List, Optional, Any
import logging
import httpx
from fastapi.responses import FileResponse
from app.core.database import get_db
from app.models.db_models import Song, Lyrics, User, SongView, Favorite
from app.models.schemas import SongCreate, SongResponse, SongDetailsResponse
from app.services.lyrics_service import generate_lyrics_and_title
from app.services.image_service import generate_cover_art_url
from app.services.music_service import initiate_song_generation, check_generation_status
from app.services.video_service import download_audio_locally

logger = logging.getLogger(__name__)


def _build_structured_lyrics(raw_text: str) -> List[dict]:
    lines = [
        line.strip()
        for line in raw_text.split("\n")
        if line.strip() and not (line.strip().startswith("[") and line.strip().endswith("]"))
    ]
    structured_lyrics = []
    current_time = 2.0
    time_increment = 4.0
    for line in lines:
        structured_lyrics.append({"time": round(current_time, 2), "text": line})
        current_time += time_increment
    return structured_lyrics


def _update_song_from_sonauto(song: Song, res: dict, db: Session) -> bool:
    status = res.get("status")
    if status == "completed" and res.get("audio_url"):
        song.audio_url = res["audio_url"]
        song.status = "completed"
        if res.get("lyrics"):
            structured = _build_structured_lyrics(res["lyrics"])
            if song.lyrics:
                song.lyrics.raw_text = res["lyrics"]
                song.lyrics.structured_lyrics = structured
            else:
                db.add(Lyrics(song_id=song.id, raw_text=res["lyrics"], structured_lyrics=structured))
        # Keep video_url if provided by Sonauto, otherwise leave unset (audio-only)
        song.video_url = res.get("video_url")
        db.commit()
        db.refresh(song)
        return True

    if status == "failed":
        song.status = "failed"
        db.commit()
        db.refresh(song)
        return True

    if status == "generating" and song.status != "generating":
        song.status = "generating"
        db.commit()
        db.refresh(song)
        return False

    return False


router = APIRouter(prefix="/songs", tags=["songs"])

@router.post("/generate", response_model=SongResponse)
async def generate_song(
    payload: SongCreate,
    background_tasks: BackgroundTasks,
    user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Submits a song generation request.
    Generates lyrics and cover art immediately, triggers Sonauto API,
    and returns a song record with a pending status.
    """
    # Auto-create guest user if they don't exist
    if user_id:
        existing_user = db.query(User).filter(User.id == user_id).first()
        if not existing_user:
            guest_user = User(
                id=user_id,
                email=f"{user_id}@heartbeat.local",
                full_name="Guest User"
            )
            db.add(guest_user)
            db.commit()
    
    lyrics_data = await generate_lyrics_and_title(
        sender_name=payload.sender_name,
        receiver_name=payload.receiver_name,
        relationship=payload.relationship,
        mood=payload.mood,
        language=payload.language,
        singer_vibe=payload.singer_vibe,
        occasion=payload.occasion,
        memories=payload.memories or ""
    )

    cover_url = generate_cover_art_url(
        receiver_name=payload.receiver_name,
        relationship=payload.relationship,
        mood=payload.mood,
        theme=payload.theme or "romantic"
    )

    prompt = (
        f"Generate a cinematic {payload.language} {payload.mood} song. "
        f"Dedicated to {payload.receiver_name}. Relationship: {payload.relationship}. "
        f"Singer vibe: {payload.singer_vibe}. Occasion: {payload.occasion}. "
        f"Lyrics: {lyrics_data['raw_text']}"
    )

    task_id = await initiate_song_generation(prompt)
    if not task_id:
        raise HTTPException(status_code=500, detail="Failed to initiate AI music generation")

    db_song = Song(
        user_id=user_id,
        sender_name=payload.sender_name,
        receiver_name=payload.receiver_name,
        relationship_type=payload.relationship,
        mood=payload.mood,
        language=payload.language,
        singer_vibe=payload.singer_vibe,
        occasion=payload.occasion,
        memories=payload.memories,
        title=lyrics_data["title"],
        cover_url=cover_url,
        duration=payload.duration or 30,
        theme=payload.theme or "romantic",
        voice_gender=payload.voice_gender or "female",
        status="generating",
        task_id=task_id,
        is_public=True
    )
    db.add(db_song)
    db.commit()
    db.refresh(db_song)

    db_lyrics = Lyrics(
        song_id=db_song.id,
        raw_text=lyrics_data["raw_text"],
        structured_lyrics=lyrics_data["structured_lyrics"]
    )
    db.add(db_lyrics)
    db.commit()

    background_tasks.add_task(poll_generation_status, db_song.id)
    return db_song


async def _refresh_song_status(song: Song, db: Session) -> None:
    if not song.task_id or song.status not in {"pending", "generating"}:
        return

    res = await check_generation_status(song.task_id, song.mood)
    _update_song_from_sonauto(song, res, db)


@router.get("/status/{song_id}", response_model=SongResponse)
async def get_song_generation_status(song_id: str, db: Session = Depends(get_db)):
    """Always refreshes Sonauto status before returning the latest song state."""
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    await _refresh_song_status(song, db)
    db.refresh(song)
    return song

@router.get("/details/{song_id}", response_model=SongDetailsResponse)
def get_song_details(
    song_id: str,
    viewer_ip: Optional[str] = Query(None),
    user_agent: Optional[str] = Query(None),
    user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Retrieves full song metadata, lyrics details, view counts, and favorites status."""
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    # Increment view count
    view = SongView(song_id=song.id, viewer_ip=viewer_ip, user_agent=user_agent)
    db.add(view)
    
    # Get view count
    views_count = db.query(SongView).filter(SongView.song_id == song.id).count()

    # Check favorite status
    is_favorite = False
    if user_id:
        fav = db.query(Favorite).filter(Favorite.user_id == user_id, Favorite.song_id == song.id).first()
        is_favorite = fav is not None

    db.commit()

    return {
        "song": song,
        "lyrics": song.lyrics,
        "views_count": views_count,
        "is_favorite": is_favorite
    }

@router.get("/user/list", response_model=List[SongResponse])
def list_user_songs(user_id: str, db: Session = Depends(get_db)):
    """Retrieves all songs generated by a specific user."""
    return db.query(Song).filter(Song.user_id == user_id).order_by(Song.created_at.desc()).all()


@router.get("/download/{song_id}")
async def download_song_video(song_id: str, db: Session = Depends(get_db)):
    """
    Serves the song's video file for download.
    Downloads remote video to temporary storage, then serves via FileResponse.
    """
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    if not song.video_url:
        raise HTTPException(status_code=404, detail="No video available for this song")

    logger.info(f"📥 Download request for song {song_id}")

    # Video downloads are no longer supported; use the audio download endpoint instead.
    raise HTTPException(status_code=410, detail="Video download removed; use /download/audio/{song_id}")

@router.get("/download/audio/{song_id}")
async def download_song_audio(song_id: str, db: Session = Depends(get_db)):
    """Serves the generated MP3 audio for a song.

    Downloads remote audio to temporary storage using `download_audio_locally`, then streams via `FileResponse`.
    """
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    if not song.audio_url:
        raise HTTPException(status_code=404, detail="No audio available for this song yet")

    try:
        logger.info(f"📥 Audio download request for song {song_id}")
        # Create a safe filename
        safe_title = (song.title or f"song_{song_id}").replace(" ", "_")[:100]
        filename = f"{safe_title}_{song_id}.mp3"

        local_audio_path = await download_audio_locally(song.audio_url, filename)

        return FileResponse(
            local_audio_path,
            media_type="audio/mpeg",
            filename=filename,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Download audio error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail="Audio download failed")


# Background task to poll Sonauto status with optimized intervals
async def poll_generation_status(song_id: str, db_factory=SessionLocal):
    import asyncio
    from app.services.music_service import check_generation_status

    max_retries = 180  # Extended to 15 minutes total (at adaptive intervals)
    
    for attempt in range(max_retries):
        db = db_factory()
        song = db.query(Song).filter(Song.id == song_id).first()
        if not song:
            db.close()
            return
        if song.status != "generating" or not song.task_id:
            db.close()
            return

        # Adaptive polling intervals: fast at first, then slower
        # 0-10: 2s, 10-30: 3s, 30-60: 5s, 60+: 10s
        if attempt < 10:
            interval = 2
        elif attempt < 30:
            interval = 3
        elif attempt < 60:
            interval = 5
        else:
            interval = 10

        logger.info(f"Poll attempt {attempt + 1}/{max_retries} for song {song_id} (interval={interval}s)")
        res = await check_generation_status(song.task_id, song.mood)
        if _update_song_from_sonauto(song, res, db):
            db.close()
            return

        db.close()
        await asyncio.sleep(interval)

    # Timeout handling
    db = db_factory()
    song = db.query(Song).filter(Song.id == song_id).first()
    if song and song.status == "generating":
        logger.warning(f"Song {song_id} polling timeout after {max_retries} retries")
        song.status = "failed"
        db.commit()
    db.close()

@router.delete("/{song_id}")
def delete_song(song_id: str, db: Session = Depends(get_db)):
    """Deletes a song from the library."""
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    db.delete(song)
    db.commit()
    return {"message": "Song deleted successfully"}

@router.post("/{song_id}/favorite")
def toggle_favorite(song_id: str, user_id: str, db: Session = Depends(get_db)):
    """Toggles favorite status for a song."""
    fav = db.query(Favorite).filter(Favorite.user_id == user_id, Favorite.song_id == song_id).first()
    if fav:
        db.delete(fav)
        db.commit()
        return {"is_favorite": False}
    else:
        new_fav = Favorite(user_id=user_id, song_id=song_id)
        db.add(new_fav)
        db.commit()
        return {"is_favorite": True}
