import os
import logging
import httpx
import tempfile
from pathlib import Path
from app.core.config import settings

logger = logging.getLogger(__name__)

"""
Audio-only helper module: keep a small, reliable MP3 downloader and temp storage.
This file no longer contains video compilation or download logic.
"""

# Create temp media directory
TEMP_VIDEOS_DIR = Path(tempfile.gettempdir()) / "heartbeat_media"
TEMP_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)


async def download_audio_locally(audio_url: str, filename: str) -> str:
    """
    Downloads a remote audio file (MP3) to temporary storage with retry logic and returns path.
    Reuses the same temp directory and similar safeguards as video downloader but optimized for audio.
    """
    import hashlib
    import asyncio
    from fastapi import HTTPException

    if not isinstance(audio_url, str) or not audio_url.strip():
        raise HTTPException(status_code=400, detail="Invalid audio URL provided")

    if not isinstance(filename, str) or not filename.strip():
        raise HTTPException(status_code=400, detail="Invalid filename provided")

    try:
        url_hash = hashlib.md5(audio_url.encode()).hexdigest()[:8]
        # Ensure .mp3 extension
        if not filename.lower().endswith('.mp3'):
            filename = f"{filename}.mp3"
        local_filename = f"{url_hash}_{filename}"
        temp_path = TEMP_VIDEOS_DIR / local_filename

        if temp_path.exists():
            logger.info(f"✓ Using cached audio: {temp_path}")
            return str(temp_path)

        TEMP_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

        headers = {
            "User-Agent": "HeartbeatAI/1.0 (+https://example.com)",
            "Accept": "audio/mpeg, */*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "en-US,en;q=0.9",
        }

        max_retries = 3

        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0, read=60.0)) as client:
            for attempt in range(max_retries):
                try:
                    logger.info(f"⏳ Downloading audio (attempt {attempt + 1}/{max_retries})...")
                    resp = await client.get(audio_url, headers=headers, follow_redirects=True)
                    if resp.status_code == 200 and resp.content:
                        # Write file
                        with open(str(temp_path), "wb") as f:
                            f.write(resp.content)
                        if not temp_path.exists() or temp_path.stat().st_size == 0:
                            raise IOError("Audio file write failed or empty")
                        logger.info(f"✅ Audio downloaded successfully: {temp_path}")
                        return str(temp_path)
                    elif resp.status_code in (403, 404):
                        raise HTTPException(status_code=resp.status_code, detail=f"Remote server returned {resp.status_code}")
                    else:
                        logger.warning(f"Unexpected response {resp.status_code} when downloading audio")
                        if attempt < max_retries - 1:
                            await asyncio.sleep(1 + attempt)
                            continue
                        raise HTTPException(status_code=502, detail="Failed to download audio")

                except HTTPException:
                    raise
                except httpx.RequestError as e:
                    logger.warning(f"Network error downloading audio: {str(e)}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(1 + attempt)
                        continue
                    raise HTTPException(status_code=502, detail="Network error downloading audio")

        raise HTTPException(status_code=503, detail="Audio download failed after retries")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Audio download fatal error: {type(e).__name__}: {str(e)[:120]}")
        raise HTTPException(status_code=500, detail="Audio download failed")
