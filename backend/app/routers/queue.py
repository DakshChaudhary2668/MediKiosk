"""Doctor Queue & Clinical Consultation Router.

Manages:
- Doctor live priority queue (P1 -> P2 -> P3 ordering).
- Doctor clinical consultation workflow (diagnosis, prescriptions, notes).
- Patient real-time queue tracker & prescription release.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, Header, HTTPException

from app.db import supabase
from app.models import (
    ConsultationRecord,
    ConsultationRequest,
    QueueItem,
)
from app.routers.auth import get_user_id
from app.routers.triage import _DOCTOR_QUEUE, _TRIAGE_ASSESSMENTS

log = logging.getLogger("medikiosk.queue")

router = APIRouter(prefix="/api", tags=["queue"])

# In-memory storage for completed consultations
_CONSULTATION_RECORDS: dict[str, dict] = {}


@router.get("/doctor/queue")
async def get_doctor_priority_queue(authorization: str = Header(...)):
    """Fetch active clinical queue for doctor workspace.
    Sorted by operational priority (P1 first, then P2, then P3), then arrival order.
    """
    priority_order = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}

    # Only show non-completed queue items
    active_queue = [
        item for item in _DOCTOR_QUEUE
        if item["status"] in ("queued", "called", "in_consultation")
    ]
    active_queue.sort(
        key=lambda x: (
            priority_order.get(x["priority"], 2),
            x.get("arrival_time", ""),
        )
    )
    return active_queue


@router.post("/doctor/turn/{session_id}/call")
async def call_patient_turn(session_id: str, authorization: str = Header(...)):
    """Call the patient into the doctor's consultation room."""
    for item in _DOCTOR_QUEUE:
        if item["session_id"] == session_id:
            item["status"] = "called"
            return {"status": "called", "token_number": item["token_number"]}
    raise HTTPException(404, "Patient turn not found in queue")


@router.post("/doctor/turn/{session_id}/start")
async def start_consultation(session_id: str, authorization: str = Header(...)):
    """Mark consultation as in-progress."""
    for item in _DOCTOR_QUEUE:
        if item["session_id"] == session_id:
            item["status"] = "in_consultation"
            return {"status": "in_consultation", "token_number": item["token_number"]}
    raise HTTPException(404, "Patient turn not found in queue")


@router.post("/doctor/turn/{session_id}/consult")
async def record_doctor_consultation(
    session_id: str,
    body: ConsultationRequest,
    authorization: str = Header(...),
):
    """Doctor records official diagnosis, clinical notes, and prescription treatment."""
    doctor_id = get_user_id(authorization)

    # 1. Locate queue item
    queue_item = None
    for item in _DOCTOR_QUEUE:
        if item["session_id"] == session_id:
            queue_item = item
            item["status"] = "completed"
            break

    patient_id = queue_item["patient_id"] if queue_item else "unknown"

    # 2. Build ConsultationRecord
    consult_id = f"consult_{uuid.uuid4().hex[:12]}"
    record = ConsultationRecord(
        consultation_id=consult_id,
        session_id=session_id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        doctor_name="Dr. Clinical Consultant",
        diagnosis=body.diagnosis,
        clinical_notes=body.clinical_notes,
        prescriptions=body.prescriptions,
        follow_up_days=body.follow_up_days,
        general_advice=body.general_advice,
        created_at=datetime.now().isoformat(),
    )

    _CONSULTATION_RECORDS[session_id] = record.model_dump()

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

    return {
        "message": "Consultation record saved and released to patient",
        "consultation": record.model_dump(),
    }


@router.get("/patient/queue-status")
async def get_patient_queue_status(authorization: str = Header(...)):
    """Fetch live queue status and latest consultation for the logged-in patient."""
    uid = get_user_id(authorization)

    # 1. Check if patient has a completed consultation
    for sess_id, rec in _CONSULTATION_RECORDS.items():
        if rec.get("patient_id") == uid:
            return {
                "in_queue": False,
                "status": "consultation_completed",
                "consultation": rec,
            }

    # 2. Check if in active doctor queue
    priority_order = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
    active_queue = [
        item for item in _DOCTOR_QUEUE
        if item["status"] in ("queued", "called", "in_consultation")
    ]
    active_queue.sort(
        key=lambda x: (
            priority_order.get(x["priority"], 2),
            x.get("arrival_time", ""),
        )
    )

    for idx, item in enumerate(active_queue):
        if item["patient_id"] == uid:
            return {
                "in_queue": True,
                "token_number": item["token_number"],
                "position": idx + 1,
                "patients_ahead": idx,
                "priority": item["priority"],
                "status": item["status"],
                "estimated_wait_mins": (idx + 1) * 7,
            }

    # 3. Check if awaiting triage review
    for assess_id, item in _TRIAGE_ASSESSMENTS.items():
        if item["patient_id"] == uid and item["status"] == "awaiting_review":
            return {
                "in_queue": False,
                "status": "awaiting_triage_review",
                "message": "Your assessment has been submitted. The triage nurse is reviewing your priority.",
            }

    return {
        "in_queue": False,
        "status": "no_active_session",
    }
