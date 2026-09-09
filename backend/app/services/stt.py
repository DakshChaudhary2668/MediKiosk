"""Sarvam Saaras STT integration."""

from __future__ import annotations

import logging
import httpx

from app.config import settings
from app.models import STTResponse

logger = logging.getLogger("medikiosk.stt")

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"

_LANG_MAP = {
    "en": "en-IN",
    "hi": "hi-IN",
    "hinglish": "unknown",
    "bn": "bn-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "mr": "mr-IN",
    "od": "od-IN",
    "pa": "pa-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "gu": "gu-IN",
}


async def transcribe(
    audio_bytes: bytes,
    mime_type: str = "audio/webm",
    language_code: str | None = None,
) -> STTResponse:
    """Send real microphone audio to Sarvam Saaras STT and return actual transcript."""
    if not audio_bytes or len(audio_bytes) == 0:
        raise ValueError("Cannot transcribe empty audio (0 bytes)")

    ext_map = {
        "audio/webm": "audio.webm",
        "audio/wav": "audio.wav",
        "audio/mp4": "audio.mp4",
        "audio/mpeg": "audio.mp3",
        "audio/ogg": "audio.ogg",
        "audio/m4a": "audio.m4a",
    }
    filename = ext_map.get(mime_type, "audio.webm")
    target_lang = _LANG_MAP.get(language_code or "", language_code or "unknown")

    data_payload: dict[str, str] = {
        "model": settings.sarvam_stt_model,
        "with_timestamps": "false",
    }
    if target_lang and target_lang != "unknown":
        data_payload["language_code"] = target_lang

    logger.info(
        f"VOICE_DEBUG: stt_request_started | bytes={len(audio_bytes)} | mime={mime_type} | lang={target_lang}"
    )

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            SARVAM_STT_URL,
            headers={"api-subscription-key": settings.sarvam_api_key},
            files={"file": (filename, audio_bytes, mime_type)},
            data=data_payload,
        )
        resp.raise_for_status()
        data = resp.json()

    transcript = data.get("transcript", "").strip()
    detected_lang = data.get("language_code", "unknown")
    confidence = data.get("confidence") or data.get("language_probability")

    logger.info(
        f"VOICE_DEBUG: stt_response_received | transcript_length={len(transcript)} | detected_lang={detected_lang}"
    )
    logger.info(f"VOICE_DEBUG: transcript_received | transcript={transcript}")

    return STTResponse(
        transcript=transcript,
        language=detected_lang,
        confidence=confidence,
    )
