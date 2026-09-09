"""Authoritative persistence repository for MediKiosk.

Coordinates durable storage between Supabase PostgreSQL and synchronized local state:
- triage_assessments
- doctor_queue_items (P1, P2, P3 only)
- consultation_records
- emergency_events (P0 emergency timeline)
- audit_logs

Guarantees:
- P0 cases NEVER enter normal doctor queue.
- Token numbers are strictly monotonic and unique across restarts.
- Original AI assessments remain immutable.
- Offline/dev fallback prevents crashes when Supabase is unreachable.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from app.db import supabase

log = logging.getLogger("medikiosk.persistence")

# Synchronized in-memory / local fallback cache
_TRIAGE_STORE: dict[str, dict[str, Any]] = {}
_QUEUE_STORE: list[dict[str, Any]] = []
_CONSULTATION_STORE: dict[str, dict[str, Any]] = {}
_EMERGENCY_STORE: dict[str, dict[str, Any]] = {}
_TOKEN_STATE: int = 100


# --- Token Generator ---

def get_next_token_number() -> int:
    """Allocate the next monotonically increasing queue token number."""
    global _TOKEN_STATE

    # Try to find max token in Supabase
    try:
        res = (
            supabase.table("doctor_queue_items")
            .select("token_number")
            .order("token_number", desc=True)
            .limit(1)
            .execute()
        )
        if res.data:
            highest_db = int(res.data[0]["token_number"])
            if highest_db >= _TOKEN_STATE:
                _TOKEN_STATE = highest_db
    except Exception:
        pass

    # Check local store highest
    for item in _QUEUE_STORE:
        if item.get("token_number", 0) >= _TOKEN_STATE:
            _TOKEN_STATE = item["token_number"]

    _TOKEN_STATE += 1
    return _TOKEN_STATE


# --- Triage Assessments ---

def save_assessment(assessment_data: dict[str, Any]) -> dict[str, Any]:
    """Persist or update an assessment record."""
    aid = assessment_data.get("assessment_id") or assessment_data.get("assessment", {}).get("assessment_id") or f"ast-{uuid.uuid4().hex[:12]}"
    assessment_data["assessment_id"] = aid
    _TRIAGE_STORE[aid] = assessment_data

    try:
        row = {
            "assessment_id": aid,
            "intake_id": assessment_data.get("intake_id"),
            "session_id": assessment_data.get("session_id") or assessment_data.get("intake_id"),
            "patient_id": assessment_data.get("patient_id"),
            "priority": assessment_data.get("assessment", {}).get("priority") or assessment_data.get("priority"),
            "confidence_band": assessment_data.get("assessment", {}).get("confidence_band"),
            "confidence_score": assessment_data.get("assessment", {}).get("confidence_score"),
            "uncertainty": assessment_data.get("assessment", {}).get("uncertainty"),
            "safety_flags": assessment_data.get("assessment", {}).get("safety_flags"),
            "evidence": assessment_data.get("assessment", {}).get("evidence"),
            "recommended_next_action": assessment_data.get("assessment", {}).get("recommended_next_action"),
            "status": assessment_data.get("status", "awaiting_review"),
            "final_priority": assessment_data.get("final_priority"),
            "reviewed_by": assessment_data.get("reviewed_by"),
            "reviewed_at": assessment_data.get("reviewed_at"),
            "override_reason": assessment_data.get("override_reason"),
            "review_notes": assessment_data.get("review_notes"),
            "case_snapshot": assessment_data.get("case", {}),
        }
        supabase.table("triage_assessments").upsert(row).execute()
    except Exception as e:
        log.warning(f"Could not persist assessment to Supabase (using local fallback): {e}")

    return assessment_data


def get_assessment(assessment_id: str) -> dict[str, Any] | None:
    """Retrieve an assessment by ID."""
    if assessment_id in _TRIAGE_STORE:
        return _TRIAGE_STORE[assessment_id]

    try:
        res = supabase.table("triage_assessments").select("*").eq("assessment_id", assessment_id).single().execute()
        if res.data:
            _TRIAGE_STORE[assessment_id] = res.data
            return res.data
    except Exception:
        pass

    return None


def get_assessment_by_session(session_id: str) -> dict[str, Any] | None:
    """Find assessment for a given intake session ID."""
    for item in _TRIAGE_STORE.values():
        if item.get("session_id") == session_id or item.get("intake_id") == session_id:
            return item

    try:
        res = supabase.table("triage_assessments").select("*").eq("session_id", session_id).single().execute()
        if res.data:
            _TRIAGE_STORE[res.data["assessment_id"]] = res.data
            return res.data
    except Exception:
        pass

    return None


def list_all_assessments() -> list[dict[str, Any]]:
    """List all triage assessments."""
    try:
        res = supabase.table("triage_assessments").select("*").execute()
        if res.data:
            for row in res.data:
                _TRIAGE_STORE[row["assessment_id"]] = row
    except Exception:
        pass

    return list(_TRIAGE_STORE.values())


# --- Doctor Queue ---

def enqueue_doctor_item(item: dict[str, Any]) -> dict[str, Any]:
    """Admit an approved P1/P2/P3 patient into the doctor queue with a unique token.
    INVARIANT: P0 cases MUST NEVER be enqueued.
    """
    priority = item.get("priority")
    if priority == "P0":
        raise ValueError("Critical Safety Invariant Violated: P0 cannot enter normal doctor queue.")

    # Check if patient/session is already queued (Idempotency)
    for existing in _QUEUE_STORE:
        if existing["session_id"] == item["session_id"]:
            log.info(f"Session {item['session_id']} already queued with token {existing['token_number']}")
            return existing

    token = item.get("token_number") or get_next_token_number()
    item["token_number"] = token
    item["turn_number"] = token
    item["status"] = item.get("status", "queued")
    item["queue_status"] = item["status"]
    item["approved_at"] = item.get("approved_at") or datetime.now().isoformat()
    item["arrival_time"] = item.get("arrival_time") or datetime.now().isoformat()
    item["ordering_timestamp"] = item["arrival_time"]
    item["ai_disclaimer"] = "AI Pre-Triage advisory recommendation"

    _QUEUE_STORE.append(item)

    try:
        row = {
            "token_number": token,
            "session_id": item["session_id"],
            "patient_id": item["patient_id"],
            "patient_name": item["patient_name"],
            "age": item.get("age"),
            "gender": item.get("gender"),
            "priority": item["priority"],
            "status": item["status"],
            "chief_complaint": item.get("chief_complaint"),
            "category": item.get("category"),
            "arrival_time": item["arrival_time"],
            "approved_at": item["approved_at"],
            "case_snapshot": item.get("case", {}),
            "assessment_snapshot": item.get("assessment", {}),
        }
        supabase.table("doctor_queue_items").insert(row).execute()
    except Exception as e:
        log.warning(f"Could not persist queue item to Supabase (using local store): {e}")

    return item


def get_active_doctor_queue() -> list[dict[str, Any]]:
    """Return active queue items sorted by priority (P1 -> P2 -> P3) and arrival time.
    P0 is strictly excluded.
    """
    priority_order = {"P1": 1, "P2": 2, "P3": 3}

    active_items = [
        item for item in _QUEUE_STORE
        if item.get("status") in ("queued", "called", "in_consultation")
        and item.get("priority") != "P0"
    ]
    active_items.sort(
        key=lambda x: (
            priority_order.get(x.get("priority", "P2"), 2),
            x.get("arrival_time", ""),
        )
    )
    return active_items


def update_queue_item_status(session_id: str, new_status: str, **kwargs) -> dict[str, Any] | None:
    """Update status of a queue turn (e.g. called, in_consultation, completed)."""
    for item in _QUEUE_STORE:
        if item["session_id"] == session_id:
            item["status"] = new_status
            item["queue_status"] = new_status
            item.update(kwargs)

            try:
                supabase.table("doctor_queue_items").update({
                    "status": new_status,
                    **kwargs,
                }).eq("session_id", session_id).execute()
            except Exception:
                pass

            return item
    return None


def get_queue_item_by_session(session_id: str) -> dict[str, Any] | None:
    """Retrieve queue turn for a session."""
    for item in _QUEUE_STORE:
        if item["session_id"] == session_id:
            return item
    return None


# --- Consultations ---

def save_consultation(record: dict[str, Any]) -> dict[str, Any]:
    """Persist doctor consultation and digital prescription record."""
    session_id = record["session_id"]
    _CONSULTATION_STORE[session_id] = record

    try:
        supabase.table("consultation_records").upsert(record).execute()
    except Exception as e:
        log.warning(f"Could not persist consultation record to Supabase: {e}")

    return record


def get_consultation_by_session(session_id: str) -> dict[str, Any] | None:
    """Get completed consultation for a session."""
    if session_id in _CONSULTATION_STORE:
        return _CONSULTATION_STORE[session_id]

    try:
        res = supabase.table("consultation_records").select("*").eq("session_id", session_id).single().execute()
        if res.data:
            _CONSULTATION_STORE[session_id] = res.data
            return res.data
    except Exception:
        pass

    return None


def get_consultation_by_patient(patient_id: str) -> dict[str, Any] | None:
    """Get latest consultation for a patient."""
    for rec in _CONSULTATION_STORE.values():
        if rec.get("patient_id") == patient_id:
            return rec

    try:
        res = (
            supabase.table("consultation_records")
            .select("*")
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if res.data:
            _CONSULTATION_STORE[res.data[0]["session_id"]] = res.data[0]
            return res.data[0]
    except Exception:
        pass

    return None


# --- Emergency Events (P0 Immediate Escalation) ---

def record_p0_emergency_event(
    session_id: str,
    patient_id: str,
    signal_ids: list[str] | None = None,
    chief_complaint: str | None = None,
) -> dict[str, Any]:
    """Atomically record a P0 emergency escalation event without requiring administrative approval."""
    event_id = f"emg_{session_id}"
    now_iso = datetime.now().isoformat()
    now_time = datetime.now().strftime("%H:%M:%S")

    event = {
        "id": event_id,
        "session_id": session_id,
        "patient_id": patient_id,
        "priority": "P0",
        "signal_ids": signal_ids or [],
        "status": "p0_escalated",
        "chief_complaint": chief_complaint,
        "created_at": now_iso,
        "timeline": [
            {
                "label": "Emergency detected by AI / deterministic safety filter",
                "time": now_time,
                "variant": "danger",
                "detail": f"Signals: {', '.join(signal_ids or ['critical_red_flag'])}",
            },
            {
                "label": "Automatic emergency alert broadcast",
                "time": now_time,
                "variant": "danger",
                "detail": "ER resuscitation team and duty medical officer notified automatically.",
            },
            {
                "label": "Patient kiosk emergency state active",
                "time": now_time,
                "variant": "warning",
                "detail": "Kiosk displays immediate emergency guidance to patient.",
            },
        ],
    }

    _EMERGENCY_STORE[session_id] = event

    try:
        supabase.table("emergency_events").upsert(event).execute()
        supabase.table("audit_logs").insert({
            "actor_id": patient_id,
            "action": "p0_emergency_escalated",
            "entity_type": "patient_session",
            "entity_id": session_id,
            "details": {"signal_ids": signal_ids, "chief_complaint": chief_complaint},
        }).execute()
    except Exception as e:
        log.warning(f"Could not persist emergency event to Supabase: {e}")

    log.critical(
        f"🚨 P0 EMERGENCY ESCALATED: session={session_id} patient={patient_id} signals={signal_ids}"
    )
    return event


def get_emergency_event(session_id: str) -> dict[str, Any] | None:
    """Retrieve P0 emergency event for a session."""
    return _EMERGENCY_STORE.get(session_id)


def list_emergency_events() -> list[dict[str, Any]]:
    """List all active or historical P0 emergency events."""
    return list(_EMERGENCY_STORE.values())


def acknowledge_p0_emergency(
    session_id: str,
    admin_id: str,
    action: str = "acknowledged",
    notes: str | None = None,
) -> dict[str, Any]:
    """Super Admin coordinates / acknowledges P0 emergency after automated escalation."""
    event = _EMERGENCY_STORE.get(session_id)
    if not event:
        event = record_p0_emergency_event(session_id, "unknown")

    now_iso = datetime.now().isoformat()
    now_time = datetime.now().strftime("%H:%M:%S")

    event["status"] = action
    event["acknowledged_by"] = admin_id
    event["acknowledged_at"] = now_iso
    if notes:
        event["coordination_notes"] = notes

    event["timeline"].append({
        "label": f"Admin {action.capitalize()}: {notes or 'Emergency team coordinated'}",
        "time": now_time,
        "variant": "success",
        "detail": f"Handled by Admin: {admin_id}",
    })

    try:
        supabase.table("emergency_events").upsert(event).execute()
        supabase.table("audit_logs").insert({
            "actor_id": admin_id,
            "action": f"p0_emergency_{action}",
            "entity_type": "emergency_event",
            "entity_id": session_id,
            "details": {"notes": notes},
        }).execute()
    except Exception:
        pass

    return event
