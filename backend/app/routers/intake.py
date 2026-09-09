"""Intake router — session management, text/voice conversation, case extraction."""

from __future__ import annotations

import base64
import json
import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, Header, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse

from app.db import supabase
from app.models import (
    ConversationState,
    IntakeMessageRequest,
    PatientCase,
    StartSessionRequest,
)
from app.routers.auth import get_user_id
from app.services import safety, ai_engine
from app.services import stt as stt_service
from app.services import tts as tts_service

log = logging.getLogger("medikiosk.intake")

router = APIRouter(prefix="/api/intake", tags=["intake"])

# In-memory session and message cache fallback for resilient offline execution
_MEM_SESSIONS: dict[str, dict] = {}
_MEM_MESSAGES: dict[str, list[dict]] = {}
_MEM_CASES: dict[str, dict] = {}


def _load_state(session_data: dict) -> ConversationState:
    """Rebuild ConversationState from DB session row."""
    cs = session_data.get("conversation_state", {}) or {}
    return ConversationState(
        session_id=session_data["id"],
        patient_id=session_data["patient_id"],
        conversation_status=session_data.get("status", "active"),
        language=session_data.get("language", "en"),
        input_mode=session_data.get("input_mode", "text"),
        current_stage=cs.get("current_stage", "greeting"),
        category=session_data.get("category"),
        completed_fields=cs.get("completed_fields", []),
        pending_fields=cs.get("pending_fields", []),
        skipped_fields=cs.get("skipped_fields", []),
        declined_fields=cs.get("declined_fields", []),
        answers=cs.get("answers", {}),
        turn_count=cs.get("turn_count", 0),
        red_flag_detected=cs.get("red_flag_detected", False),
        red_flag_signals=cs.get("red_flag_signals", []),
    )


def _save_state(session_id: str, state: ConversationState):
    """Persist conversation state back to DB or local fallback."""
    try:
        supabase.table("patient_sessions").update({
            "category": state.category,
            "language": state.language,
            "input_mode": state.input_mode,
            "status": state.conversation_status,
            "conversation_state": {
                "current_stage": state.current_stage,
                "completed_fields": state.completed_fields,
                "pending_fields": state.pending_fields,
                "skipped_fields": state.skipped_fields,
                "declined_fields": state.declined_fields,
                "answers": state.answers,
                "turn_count": state.turn_count,
                "red_flag_detected": state.red_flag_detected,
                "red_flag_signals": state.red_flag_signals,
            },
        }).eq("id", session_id).execute()
    except Exception:
        if session_id in _MEM_SESSIONS:
            _MEM_SESSIONS[session_id].update({
                "category": state.category,
                "language": state.language,
                "input_mode": state.input_mode,
                "status": state.conversation_status,
                "conversation_state": {
                    "current_stage": state.current_stage,
                    "completed_fields": state.completed_fields,
                    "pending_fields": state.pending_fields,
                    "skipped_fields": state.skipped_fields,
                    "declined_fields": state.declined_fields,
                    "answers": state.answers,
                    "turn_count": state.turn_count,
                    "red_flag_detected": state.red_flag_detected,
                    "red_flag_signals": state.red_flag_signals,
                },
            })


def _get_history(session_id: str) -> list[dict[str, str]]:
    """Fetch conversation messages for LLM context."""
    try:
        res = (
            supabase.table("conversation_messages")
            .select("speaker, content")
            .eq("session_id", session_id)
            .order("created_at")
            .execute()
        )
        if res.data:
            return [{"speaker": m["speaker"], "content": m["content"]} for m in res.data]
    except Exception:
        pass
    
    local_msgs = _MEM_MESSAGES.get(session_id, [])
    return [{"speaker": m["speaker"], "content": m["content"]} for m in local_msgs]


def _save_message(session_id: str, speaker: str, content: str, **kwargs):
    """Save a conversation message."""
    row = {
        "session_id": session_id,
        "speaker": speaker,
        "content": content,
        "created_at": datetime.now().isoformat(),
        **kwargs,
    }
    try:
        supabase.table("conversation_messages").insert(row).execute()
    except Exception:
        pass
    _MEM_MESSAGES.setdefault(session_id, []).append(row)


# --- Endpoints ---

@router.post("/session")
async def create_session(body: StartSessionRequest, authorization: str = Header(...)):
    uid = get_user_id(authorization)
    sess_id = str(uuid.uuid4())
    session_row = {
        "id": sess_id,
        "patient_id": uid,
        "category": body.category,
        "language": body.language,
        "status": "active",
        "conversation_state": {
            "current_stage": "greeting",
            "completed_fields": [],
            "pending_fields": [],
            "skipped_fields": [],
            "declined_fields": [],
            "answers": {},
            "turn_count": 0,
            "red_flag_detected": False,
            "red_flag_signals": [],
        },
        "started_at": datetime.now().isoformat(),
    }

    try:
        res = supabase.table("patient_sessions").insert({
            "patient_id": uid,
            "category": body.category,
            "language": body.language,
            "status": "active",
            "conversation_state": session_row["conversation_state"],
        }).execute()
        if res.data:
            session_row = res.data[0]
            sess_id = session_row["id"]
    except Exception:
        _MEM_SESSIONS[sess_id] = session_row

    # Save initial AI greeting based on selected language
    if body.language in ("hi", "hinglish"):
        greeting = (
            "नमस्ते! मैं मेडीकियोस्क का AI सहायक हूँ। डॉक्टर से मिलने से पहले मैं आपकी समस्या को समझने के लिए कुछ प्रश्न पूछूँगा। "
            "आप आज किस परेशानी के लिए आए हैं?"
        )
    else:
        greeting = (
            "Hi, I'm MediKiosk's AI intake assistant. I'll ask you a few questions "
            "about your health so the doctor can understand your concern before the consultation. "
            "What brings you in today?"
        )
    _save_message(sess_id, "assistant", greeting)

    return {"session_id": sess_id, "greeting": greeting}


@router.post("/message")
async def send_message(body: IntakeMessageRequest, authorization: str = Header(...)):
    uid = get_user_id(authorization)
    patient_text = body.message.strip() if body.message else ""
    if not patient_text:
        raise HTTPException(400, "Message cannot be empty")

    session = None
    try:
        session_res = (
            supabase.table("patient_sessions")
            .select("*")
            .eq("id", body.session_id)
            .eq("patient_id", uid)
            .single()
            .execute()
        )
        session = session_res.data
    except Exception:
        pass

    if not session:
        session = _MEM_SESSIONS.get(body.session_id)

    if not session:
        session = {
            "id": body.session_id,
            "patient_id": uid,
            "status": "active",
            "language": "en",
            "category": None,
            "conversation_state": {},
        }
        _MEM_SESSIONS[body.session_id] = session

    if session.get("status") in ("completed", "red_flagged"):
        raise HTTPException(400, "Session already ended")

    state = _load_state(session)
    state.turn_count += 1
    state.input_mode = body.input_mode

    # 1. Deterministic safety check on raw patient text
    safety_result = safety.check_red_flags(patient_text, state.language)
    if safety_result.red_flag:
        state.red_flag_detected = True
        state.red_flag_signals.extend(safety_result.signal_ids)
        state.conversation_status = "red_flagged"
        _save_message(body.session_id, "patient", patient_text, input_mode=body.input_mode, original_text=patient_text)
        _save_message(body.session_id, "assistant", safety_result.message)
        _save_state(body.session_id, state)

        return {
            "ai_message": safety_result.message,
            "red_flag": True,
            "signal_ids": safety_result.signal_ids,
            "survey_complete": False,
            "session_status": "red_flagged",
        }

    # 2. Get conversation history
    history = _get_history(body.session_id)

    # 3. Process through AI engine
    ai_response = await ai_engine.process_message(state, history, patient_text)

    # 4. Post-LLM safety check on extracted facts
    if ai_response.extracted_facts:
        post_safety = safety.check_extracted_facts(ai_response.extracted_facts, state.language)
        if post_safety.red_flag:
            ai_response.red_flag = True
            state.red_flag_detected = True
            state.red_flag_signals.extend(post_safety.signal_ids)
            ai_response.ai_message = post_safety.message

    # 5. Update state from AI response
    if ai_response.category:
        state.category = ai_response.category
    for field in ai_response.answered_fields:
        if field not in state.completed_fields:
            state.completed_fields.append(field)
    state.pending_fields = ai_response.missing_fields
    state.answers.update(ai_response.extracted_facts)

    if ai_response.survey_complete:
        state.conversation_status = "completed"
        state.current_stage = "completed"
    elif ai_response.red_flag:
        state.conversation_status = "red_flagged"

    # 6. Save messages — exact original patient text
    _save_message(
        body.session_id, "patient", patient_text,
        input_mode=body.input_mode,
        original_text=patient_text,
        language=state.language,
    )
    _save_message(body.session_id, "assistant", ai_response.ai_message)

    # 7. Persist state
    _save_state(body.session_id, state)

    # 8. If survey complete, generate and save patient case
    if ai_response.survey_complete:
        await _generate_case(body.session_id, uid, state)

    return {
        "ai_message": ai_response.ai_message,
        "category": ai_response.category or state.category,
        "red_flag": ai_response.red_flag,
        "survey_complete": ai_response.survey_complete,
        "session_status": state.conversation_status,
        "answered_fields": state.completed_fields,
        "missing_fields": ai_response.missing_fields,
    }


@router.post("/voice")
async def send_voice(
    session_id: str = Form(...),
    audio: UploadFile = File(...),
    authorization: str = Header(...),
):
    """Actual microphone voice endpoint: audio bytes → Sarvam Saaras STT → Groq AI → Sarvam TTS.
    STRICT RULE: Zero dummy data or fake fallbacks. Fails honestly if speech is inaudible or STT fails.
    """
    uid = get_user_id(authorization)

    # 1. Read and validate actual audio bytes
    audio_bytes = await audio.read()
    if not audio_bytes or len(audio_bytes) < 100:
        raise HTTPException(422, "Recorded audio was empty or too short. Please try speaking again.")

    mime_type = audio.content_type or "audio/webm"

    # 2. Get session language
    session = None
    try:
        session_res = (
            supabase.table("patient_sessions")
            .select("*")
            .eq("id", session_id)
            .single()
            .execute()
        )
        session = session_res.data
    except Exception:
        pass
    if not session:
        session = _MEM_SESSIONS.get(session_id, {})
    lang = session.get("language", "en")

    # 3. Transcribe via Sarvam Saaras
    try:
        stt_result = await stt_service.transcribe(audio_bytes, mime_type=mime_type, language_code=lang)
        transcript = stt_result.transcript.strip()
    except Exception as e:
        log.error(f"Sarvam STT failed: {e}")
        raise HTTPException(502, "Speech recognition service could not process the audio. Please try speaking again.")

    # 4. Strict check: reject empty transcript without calling Groq or fabricating facts
    if not transcript:
        raise HTTPException(422, "No speech detected in the audio. Please speak clearly into your microphone.")

    log.info(f"VOICE_DEBUG: real_transcript_processed | transcript='{transcript}'")

    # 5. Process the real transcript through conversation engine
    msg_req = IntakeMessageRequest(
        session_id=session_id,
        message=transcript,
        input_mode="voice",
    )
    result = await send_message(msg_req, authorization)
    result["transcript"] = transcript

    # 6. Synthesize actual AI response to audio via Sarvam Bulbul TTS
    try:
        tts_audio = await tts_service.synthesize(result["ai_message"], language=lang)
        result["tts_audio"] = base64.b64encode(tts_audio).decode("utf-8")
    except Exception as e:
        log.warning(f"TTS synthesis skipped: {e}")

    return result


@router.get("/session/{session_id}")
async def get_session(session_id: str, authorization: str = Header(...)):
    uid = get_user_id(authorization)

    session = None
    try:
        session_res = (
            supabase.table("patient_sessions")
            .select("*")
            .eq("id", session_id)
            .single()
            .execute()
        )
        session = session_res.data
    except Exception:
        pass

    if not session:
        session = _MEM_SESSIONS.get(session_id)

    if not session:
        raise HTTPException(404, "Session not found")

    messages = []
    try:
        msg_res = (
            supabase.table("conversation_messages")
            .select("*")
            .eq("session_id", session_id)
            .order("created_at")
            .execute()
        )
        messages = msg_res.data or []
    except Exception:
        messages = _MEM_MESSAGES.get(session_id, [])

    patient_case = _MEM_CASES.get(session_id)
    try:
        case_res = (
            supabase.table("patient_cases")
            .select("*")
            .eq("session_id", session_id)
            .single()
            .execute()
        )
        if case_res.data:
            patient_case = case_res.data
    except Exception:
        pass

    return {
        "session": session,
        "messages": messages,
        "case": patient_case,
    }


@router.post("/session/{session_id}/complete")
async def complete_session(session_id: str, authorization: str = Header(...)):
    uid = get_user_id(authorization)

    session = None
    try:
        session_res = (
            supabase.table("patient_sessions")
            .select("*")
            .eq("id", session_id)
            .eq("patient_id", uid)
            .single()
            .execute()
        )
        session = session_res.data
    except Exception:
        session = _MEM_SESSIONS.get(session_id)

    if not session:
        raise HTTPException(404, "Session not found")

    state = _load_state(session)
    state.conversation_status = "completed"
    _save_state(session_id, state)

    await _generate_case(session_id, uid, state)

    return {"status": "completed"}


async def _generate_case(session_id: str, patient_id: str, state: ConversationState):
    """Build and persist structured PatientCase from evidence-based conversation state."""
    answers = state.answers

    case_row = {
        "session_id": session_id,
        "patient_id": patient_id,
        "chief_complaint": answers.get("chief_complaint", "Not specified"),
        "category": state.category or answers.get("category"),
        "duration": answers.get("duration"),
        "severity": answers.get("severity") if isinstance(answers.get("severity"), int) else None,
        "symptoms": answers.get("symptoms", []),
        "negative_symptoms": answers.get("negative_symptoms", []),
        "relevant_history": answers.get("history", []),
        "current_medications": answers.get("medications", []),
        "allergies": answers.get("allergies", []),
        "patient_concerns": answers.get("concerns"),
        "red_flag_detected": state.red_flag_detected,
        "red_flag_details": {"signals": state.red_flag_signals} if state.red_flag_detected else None,
        "completion_status": "complete" if state.conversation_status == "completed" else "incomplete",
        "raw_extracted_data": answers,
    }

    _MEM_CASES[session_id] = case_row

    try:
        supabase.table("patient_cases").insert(case_row).execute()
        supabase.table("audit_logs").insert({
            "actor_id": patient_id,
            "action": "case_generated",
            "entity_type": "patient_case",
            "entity_id": session_id,
            "details": {"category": state.category, "red_flag": state.red_flag_detected},
        }).execute()
    except Exception as e:
        log.warning(f"Could not persist case to Supabase: {e}")

    # Auto-trigger AI Pre-Triage Assessment for Admin Review Gate
    try:
        from app.services.pre_triage import run_ai_pre_triage
        from app.routers.triage import _TRIAGE_ASSESSMENTS
        
        patient_case = PatientCase(**{k: v for k, v in case_row.items() if k in PatientCase.model_fields})
        assessment = await run_ai_pre_triage(
            intake_id=session_id,
            patient_id=patient_id,
            case=patient_case,
        )
        _TRIAGE_ASSESSMENTS[assessment.assessment_id] = {
            "assessment": assessment.model_dump(),
            "case": case_row,
            "patient_id": patient_id,
            "session_id": session_id,
            "submitted_at": datetime.now().isoformat(),
            "status": "awaiting_review",
        }
        log.info(f"Pre-triage assessment auto-generated for session {session_id}: priority={assessment.priority}")
    except Exception as e:
        log.error(f"Failed to auto-generate pre-triage assessment: {e}")
