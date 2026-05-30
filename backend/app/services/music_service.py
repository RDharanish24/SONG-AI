import asyncio
import logging
from typing import Any, Dict, List, Optional, Union

import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

# Royalty-free mood-themed audio fallback list to ensure the system is fully functional
FALLBACK_TRACKS = {
    "romantic": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "emotional": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "sad": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    "happy": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    "motivational": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    "nostalgic": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"
}

SONAUTO_API_BASE = "https://api.sonauto.ai/v1"


def _safe_json(response: httpx.Response) -> Union[Dict[str, Any], List[Any], str]:
    try:
        return response.json()
    except ValueError:
        return response.text


def _print_raw_response(label: str, response: httpx.Response) -> Union[Dict[str, Any], List[Any], str]:
    raw = _safe_json(response)
    print(f"SONAUTO RAW RESPONSE [{label}]:", raw)
    logger.debug(f"SONAUTO RAW RESPONSE [{label}]: {raw}")
    return raw


def _normalize_status(status_value: Any) -> str:
    if status_value is None:
        return "generating"
    status_text = str(status_value).strip().lower()
    if status_text in {"success", "completed", "complete", "finished", "succeeded"}:
        return "completed"
    if status_text in {"failure", "failed", "error", "errored", "cancelled", "canceled"}:
        return "failed"
    if status_text in {"queued", "pending", "waiting", "running", "in_progress", "processing", "generating"}:
        return "generating"
    return "generating"


def _extract_task_id(data: Any) -> Optional[str]:
    if not isinstance(data, dict):
        return None

    keys = ["task_id", "taskId", "id", "generation_id", "generationId", "job_id", "jobId"]
    for key in keys:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    nested = data.get("data") if isinstance(data.get("data"), dict) else None
    if nested:
        for key in keys:
            value = nested.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

    return None


def _extract_audio_url(data: Any) -> Optional[str]:
    if not isinstance(data, dict):
        return None

    candidates: List[str] = []
    audio_keys = [
        "audio_url", "audioUrl", "song_url", "songUrl", "song_paths", "audio_paths",
        "audioPath", "audioPath", "result", "output"
    ]
    for key in audio_keys:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            candidates.append(value.strip())
        if isinstance(value, list):
            candidates.extend([item for item in value if isinstance(item, str) and item.strip()])
        if isinstance(value, dict):
            nested_url = value.get("audio_url") or value.get("song_url") or value.get("audioUrl") or value.get("songPath")
            if isinstance(nested_url, str) and nested_url.strip():
                candidates.append(nested_url.strip())

    result = data.get("result") if isinstance(data.get("result"), dict) else None
    if result:
        nested = _extract_audio_url(result)
        if nested:
            candidates.append(nested)

    output = data.get("output") if isinstance(data.get("output"), dict) else None
    if output:
        nested = _extract_audio_url(output)
        if nested:
            candidates.append(nested)

    if candidates:
        return candidates[0]

    return None


def _extract_lyrics(data: Any) -> Optional[str]:
    if not isinstance(data, dict):
        return None

    lyrics_keys = ["lyrics", "song_lyrics", "raw_lyrics", "result", "output"]
    for key in lyrics_keys:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            if key in {"result", "output"}:
                nested = value
            else:
                return value.strip()
        if isinstance(value, dict):
            nested_text = value.get("lyrics") or value.get("song_lyrics") or value.get("raw_lyrics")
            if isinstance(nested_text, str) and nested_text.strip():
                return nested_text.strip()
    return None


def _extract_video_url(data: Any) -> Optional[str]:
    if not isinstance(data, dict):
        return None

    video_keys = ["video_url", "videoUrl", "result", "output"]
    for key in video_keys:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, dict):
            nested_url = value.get("video_url") or value.get("videoUrl")
            if isinstance(nested_url, str) and nested_url.strip():
                return nested_url.strip()
    return None


async def initiate_song_generation(prompt: str) -> str:
    """Initiates song generation on Sonauto. Returns task_id or mock task_id."""
    if not settings.SONAUTO_API_KEY:
        import uuid
        mock_id = f"mock_task_{uuid.uuid4().hex[:12]}"
        logger.info(f"Sonauto API Key not set. Initiated mock generation with ID: {mock_id}")
        return mock_id

    url = f"{SONAUTO_API_BASE}/generations/v3"
    headers = {
        "Authorization": f"Bearer {settings.SONAUTO_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": prompt,
        "enable_streaming": False
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=30.0)
            raw = _print_raw_response("generation", response)

            if response.status_code in {200, 201}:
                task_id = _extract_task_id(raw)
                if task_id:
                    logger.info(f"Sonauto generation initiated successfully with task_id={task_id}")
                    return task_id
                logger.error(f"Sonauto generation response did not contain a task_id: {raw}")
                return ""

            logger.error(f"Sonauto generation failed with status {response.status_code}: {raw}")
            return ""
    except Exception as e:
        logger.error(f"Error calling Sonauto API: {str(e)}", exc_info=True)
        return ""


async def check_generation_status(task_id: str, mood: str = "romantic") -> dict:
    """Checks the status of song generation. Returns normalized status, media URLs, and raw payload."""
    if task_id.startswith("mock_task_"):
        await asyncio.sleep(1.0)
        return {
            "status": "completed",
            "audio_url": FALLBACK_TRACKS.get(mood, FALLBACK_TRACKS["romantic"]),
            "lyrics": None,
            "video_url": None,
            "raw": {"status": "mock_complete"}
        }

    if not settings.SONAUTO_API_KEY:
        logger.error("Sonauto API key is missing. Skipping live task check.")
        return {"status": "failed", "audio_url": None, "lyrics": None, "video_url": None, "raw": {}}

    headers = {"Authorization": f"Bearer {settings.SONAUTO_API_KEY}"}
    polling_urls = [
        f"{SONAUTO_API_BASE}/generations/{task_id}",
        f"{SONAUTO_API_BASE}/generations/status/{task_id}"
    ]

    last_raw: Any = {}
    try:
        async with httpx.AsyncClient() as client:
            for index, status_url in enumerate(polling_urls):
                response = await client.get(status_url, headers=headers, timeout=20.0)
                raw = _print_raw_response(f"polling-{index+1}", response)
                last_raw = raw

                if response.status_code in {200, 201} and isinstance(raw, dict):
                    break
                if index == len(polling_urls) - 1:
                    logger.error(f"Sonauto polling failed for all endpoints. Last status code={response.status_code}")
                    return {
                        "status": "failed",
                        "audio_url": None,
                        "lyrics": None,
                        "video_url": None,
                        "raw": raw
                    }

            if not isinstance(last_raw, dict):
                logger.error(f"Sonauto polling returned non-JSON payload: {last_raw}")
                return {"status": "failed", "audio_url": None, "lyrics": None, "video_url": None, "raw": last_raw}

            status_value = (
                last_raw.get("status")
                or last_raw.get("task_status")
                or last_raw.get("state")
                or last_raw.get("job_status")
                or last_raw.get("phase")
            )
            status = _normalize_status(status_value)
            audio_url = _extract_audio_url(last_raw)
            lyrics = _extract_lyrics(last_raw)
            video_url = _extract_video_url(last_raw)

            if status == "completed":
                print("SONAUTO COMPLETED RESPONSE:", last_raw)
            elif status == "failed":
                print("SONAUTO FAILURE RESPONSE:", last_raw)
            else:
                print("SONAUTO RAW RESPONSE:", last_raw)

            return {
                "status": status,
                "audio_url": audio_url,
                "lyrics": lyrics,
                "video_url": video_url,
                "raw": last_raw
            }
    except Exception as e:
        logger.error(f"Exception during Sonauto status polling: {str(e)}", exc_info=True)
        return {"status": "failed", "audio_url": None, "lyrics": None, "video_url": None, "raw": {"error": str(e)}}
