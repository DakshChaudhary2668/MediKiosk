"""Sarvam Bulbul TTS integration."""

from __future__ import annotations

import base64

import httpx

from app.config import settings

SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

# Map our language codes to Sarvam language codes
_LANG_MAP = {
    "en": "en-IN",
    "hi": "hi-IN",
    "hinglish": "hi-IN",
    "mixed": "hi-IN",
    "unknown": "en-IN",
}


async def synthesize(text: str, language: str = "en") -> bytes:
    """Convert text to speech via Sarvam Bulbul. Returns raw audio bytes (WAV)."""
    target_lang = _LANG_MAP.get(language, "en-IN")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            SARVAM_TTS_URL,
            headers={
                "api-subscription-key": settings.sarvam_api_key,
                "Content-Type": "application/json",
            },
            json={
                "inputs": [text],
                "target_language_code": target_lang,
                "model": settings.sarvam_tts_model,
                "enable_preprocessing": True,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    # Sarvam returns base64-encoded audio in audios array
    audio_b64 = data.get("audios", [""])[0]
    return base64.b64decode(audio_b64) if audio_b64 else b""
