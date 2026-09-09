"""Doctor Queue & Clinical Consultation Router.

Manages:
- Doctor live priority queue (P1 -> P2 -> P3 ordering, P0 excluded).
- Doctor clinical consultation workflow (diagnosis, prescriptions, notes).
- Patient real-time queue tracker & prescription release.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, Header, HTTPException, Query

from app.auth_rbac import get_current_user, require_doctor
from app.db import supabase
from app.models import (
    ConsultationRecord,
    ConsultationRequest,
    QueueItem,
)
from app.persistence import (
    _CONSULTATION_STORE,
    _QUEUE_STORE,
    _TRIAGE_STORE,
    get_active_doctor_queue,
    get_consultation_by_patient,
    get_consultation_by_session,
    get_emergency_event,
    get_queue_item_by_session,
    list_all_assessments,
    list_emergency_events,
    save_consultation,
    update_queue_item_status,
)

log = logging.getLogger("medikiosk.queue")

router = APIRouter(prefix="/api", tags=["queue"])

# Backward-compatible reference
_CONSULTATION_RECORDS = _CONSULTATION_STORE


@router.get("/doctor/queue")
async def get_doctor_priority_queue(authorization: str = Header(...)):
    """Fetch active clinical queue for doctor workspace.
    Sorted by operational priority (P1 first, then P2, then P3), then arrival order.
    P0 is strictly excluded.
    """
    require_doctor(authorization)
    active_queue = get_active_doctor_queue()

    # Reconcile dual contract fields
    results = []
    for item in active_queue:
        token = item.get("token_number") or item.get("turn_number", 0)
        prio = item.get("priority") or item.get("priority_band", "P2")
        st = item.get("status") or item.get("queue_status", "queued")
        arr = item.get("arrival_time") or item.get("ordering_timestamp", "")

        results.append({
            "token_number": token,
            "turn_number": token,
            "session_id": item["session_id"],
            "intake_id": item["session_id"],
            "patient_id": item["patient_id"],
            "patient_ref": item["patient_id"],
            "patient_name": item["patient_name"],
            "age": item.get("age"),
            "gender": item.get("gender"),
            "priority": prio,
            "priority_band": prio,
            "status": st,
            "queue_status": st,
            "chief_complaint": item.get("chief_complaint"),
            "category": item.get("category"),
            "arrival_time": arr,
            "ordering_timestamp": arr,
            "approved_at": item.get("approved_at", ""),
            "ai_disclaimer": "AI Pre-Triage advisory recommendation",
            "safety_flags": item.get("assessment", {}).get("safety_flags", []),
            "evidence_summary": item.get("assessment", {}).get("evidence", []),
            "case": item.get("case", {}),
            "assessment": item.get("assessment", {}),
        })
    return results


@router.post("/doctor/turn/{session_id}/call")
async def call_patient_turn(session_id: str, authorization: str = Header(...)):
    """Call the patient into the doctor's consultation room."""
    require_doctor(authorization)
    item = update_queue_item_status(session_id, "called", called_at=datetime.now().isoformat())
    if item:
        return {
            "status": "called",
            "token_number": item["token_number"],
            "message": f"Turn #{item['token_number']} called into consultation room",
        }
    raise HTTPException(404, "Patient turn not found in active doctor queue")


@router.post("/doctor/turn/{session_id}/start")
async def start_consultation(session_id: str, authorization: str = Header(...)):
    """Mark consultation as in-progress."""
    require_doctor(authorization)
    item = update_queue_item_status(session_id, "in_consultation", consultation_started_at=datetime.now().isoformat())
    if item:
        return {
            "status": "in_consultation",
            "token_number": item["token_number"],
            "message": f"Consultation started for turn #{item['token_number']}",
        }
    raise HTTPException(404, "Patient turn not found in active doctor queue")


@router.post("/doctor/turn/{session_id}/consult")
async def record_doctor_consultation(
    session_id: str,
    body: ConsultationRequest,
    authorization: str = Header(...),
):
    """Doctor records official diagnosis, clinical notes, and digital prescriptions."""
    doctor_user = require_doctor(authorization)
    doctor_id = doctor_user.user_id

    # 1. Update queue item status to completed
    queue_item = update_queue_item_status(
        session_id,
        "completed",
        consultation_completed_at=datetime.now().isoformat(),
    )

    patient_id = queue_item["patient_id"] if queue_item else "unknown"
    token_num = queue_item["token_number"] if queue_item else None

    # 2. Build ConsultationRecord
    consult_id = f"consult_{uuid.uuid4().hex[:12]}"
    record = ConsultationRecord(
        consultation_id=consult_id,
        session_id=session_id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        doctor_name="Dr. Clinical Consultant",
        token_number=token_num,
        diagnosis=body.diagnosis,
        clinical_notes=body.clinical_notes,
        prescriptions=body.prescriptions,
        follow_up_days=body.follow_up_days,
        general_advice=body.general_advice,
        follow_up_advice=body.follow_up_advice or body.general_advice,
        referral_specialty=body.referral_specialty,
        created_at=datetime.now().isoformat(),
    )

    save_consultation(record.model_dump())

    # 3. Save to Supabase audit log
    try:
        supabase.table("audit_logs").insert({
            "actor_id": doctor_id,
            "action": "consultation_completed",
            "entity_type": "patient_session",
            "entity_id": session_id,
            "details": {
                "diagnosis": body.diagnosis,
                "prescriptions_count": len(body.prescriptions),
            },
        }).execute()
    except Exception:
        pass

    # Satisfy both object and top-level response contracts
    record_dict = record.model_dump()
    return {
        "message": "Consultation record saved and released to patient",
        "consultation": record_dict,
        **record_dict,
    }


@router.get("/patient/queue-status")
async def get_patient_queue_status(
    session_id: str | None = Query(None),
    authorization: str | None = Header(None),
):
    """Fetch live queue status, emergency alerts, or completed consultation for patient."""
    user = get_current_user(authorization)
    uid = user.user_id

    # 1. Check if patient has an active P0 emergency event
    emg_event = None
    if session_id:
        emg_event = get_emergency_event(session_id)
    if not emg_event:
        for emg in list_emergency_events():
            if emg.get("patient_id") == uid:
                emg_event = emg
                break

    if emg_event:
        return {
            "has_active_intake": True,
            "in_queue": False,
            "status": "p0_escalated",
            "priority": "P0",
            "message": "Emergency protocol active. Please report to the Emergency Resuscitation Room immediately.",
            "emergency_timeline": emg_event.get("timeline", []),
            "session_id": emg_event.get("session_id"),
        }

    # 2. Check if patient has a completed consultation
    rec = None
    if session_id:
        rec = get_consultation_by_session(session_id)
    if not rec:
        rec = get_consultation_by_patient(uid)

    if rec:
        return {
            "has_active_intake": False,
            "in_queue": False,
            "status": "completed",
            "queue_status": "completed",
            "consultation_status": "consultation_completed",
            "consultation": rec,
            "session_id": rec.get("session_id"),
        }

    # 3. Check if in active doctor queue
    active_queue = get_active_doctor_queue()
    for idx, item in enumerate(active_queue):
        if item["patient_id"] == uid or (session_id and item["session_id"] == session_id):
            wait_mins = (idx + 1) * 7
            return {
                "has_active_intake": True,
                "in_queue": True,
                "token_number": item["token_number"],
                "turn_number": item["token_number"],
                "queue_position": idx + 1,
                "position": idx + 1,
                "patients_ahead": idx,
                "priority": item["priority"],
                "priority_band": item["priority"],
                "status": item["status"],
                "queue_status": item["status"],
                "estimated_wait_minutes": wait_mins,
                "estimated_wait_mins": wait_mins,
                "session_id": item["session_id"],
            }

    # 4. Check if awaiting triage review
    for item in list_all_assessments():
        if item.get("patient_id") == uid or (session_id and item.get("session_id") == session_id):
            st = item.get("status", "awaiting_review")
            if st in ("awaiting_review", "intake_submitted", "assessment_failed"):
                return {
                    "has_active_intake": True,
                    "in_queue": False,
                    "status": "awaiting_triage",
                    "priority": item.get("assessment", {}).get("priority") or item.get("final_priority"),
                    "message": "Your assessment has been submitted. The triage nurse is reviewing your priority.",
                    "session_id": item.get("session_id"),
                }
            elif st == "p0_escalated":
                return {
                    "has_active_intake": True,
                    "in_queue": False,
                    "status": "p0_escalated",
                    "priority": "P0",
                    "message": "Emergency protocol active. Please report to the Emergency Resuscitation Room immediately.",
                    "session_id": item.get("session_id"),
                }

    return {
        "has_active_intake": False,
        "in_queue": False,
        "status": "no_active_session",
    }

