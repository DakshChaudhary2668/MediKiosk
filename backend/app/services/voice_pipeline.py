"""Real-time voice pipeline module.

Provides a unified voice processing pipeline connecting audio stream / chunked audio
to Sarvam STT -> Deterministic Safety Layer -> Groq AI Engine -> Sarvam TTS.
Supports both synchronous chunk processing and WebSocket streaming sessions.
"""

from __future__ import annotations

import base64
import logging
from typing import AsyncGenerator

from app.models import ConversationState, IntakeResponse
from app.services.ai_engine import process_message
from app.services.safety import check_red_flags, check_extracted_facts
from app.services.stt import transcribe
from app.services.tts import synthesize

logger = logging.getLogger("medikiosk.voice_pipeline")


class VoicePipelineSession:
    """Manages an active real-time voice intake session."""

    def __init__(self, session_id: str, language: str = "en"):
        self.session_id = session_id
        self.language = language

    async def process_audio_turn(
        self,
        audio_bytes: bytes,
        state: ConversationState,
        history: list[dict[str, str]] | None = None,
        mime_type: str = "audio/webm",
    ) -> tuple[str, IntakeResponse, bytes | None]:
        """Runs a complete end-to-end voice turn:

        1. Transcribes audio via Sarvam Saaras STT
        2. Checks safety / red flags
        3. Generates conversational AI response via Groq
        4. Synthesizes AI response to audio via Sarvam Bulbul TTS

        Returns:
            (transcript, intake_response, tts_audio_bytes)
        """
        # Step 1: STT
        stt_res = await transcribe(audio_bytes, mime_type=mime_type, language_code=self.language)
        transcript = stt_res.transcript.strip()
        if not transcript:
            raise ValueError("No speech detected in audio")

        # Step 2: Safety Pre-check
        pre_safety = check_red_flags(transcript, self.language)
        if pre_safety.red_flag:
            safety_response = IntakeResponse(
                ai_message=pre_safety.message,
                category=state.category or "emergency",
                red_flag=True,
                survey_complete=True,
            )
            # Synthesize safety emergency message to audio
            tts_audio = await synthesize(pre_safety.message, language=self.language)
            return transcript, safety_response, tts_audio

        # Step 3: AI Engine processing
        intake_response = await process_message(state, history or [], transcript)

        # Step 4: Safety Post-check on extracted facts
        if intake_response.extracted_facts:
            post_safety = check_extracted_facts(intake_response.extracted_facts, self.language)
            if post_safety.red_flag:
                intake_response.red_flag = True
                intake_response.ai_message = post_safety.message
                intake_response.survey_complete = True

        # Step 5: TTS Synthesis
        tts_audio = None
        try:
            tts_audio = await synthesize(intake_response.ai_message, language=self.language)
        except Exception as e:
            logger.warning(f"TTS synthesis failed (falling back to text only): {e}")

        return transcript, intake_response, tts_audio
