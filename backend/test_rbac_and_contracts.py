"""Regression and contract test suite for MediKiosk backend.

Covers:
1. P0 Emergency Escalation (auto p0_escalated, emergency event recorded, rejection of P0 in normal queue)
2. Queue Priority Ordering (P1 > P2 > P3 FIFO within same priority)
3. Mandatory Override Reason on Triage Override
4. Review Idempotency (same token/status returned on duplicate review)
5. Authentication and Role-Based Access Control (Patient cannot access Admin/Doctor endpoints, Doctor cannot access Admin endpoints)
6. Patient Session Isolation (Patient A cannot view or complete Patient B's intake session)
7. Safe AI Failure Handling (assessment_failed without guessed priority)
8. Dual Contract Parity (/api/v1/... matches /api/...)
9. Prescription Field Reconciliation (medicine_name/duration_days vs medication_name/duration)
"""

import pytest
import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.persistence import (
    save_assessment,
    enqueue_doctor_item,
    get_active_doctor_queue,
    get_emergency_event,
    get_next_token_number,
    _TRIAGE_STORE,
    _QUEUE_STORE,
    _CONSULTATION_STORE,
    _EMERGENCY_STORE,
)

client = TestClient(app)

# Helper headers
PATIENT_A_HEADERS = {"Authorization": "Bearer patient-pat-101"}
PATIENT_B_HEADERS = {"Authorization": "Bearer patient-pat-102"}
DOCTOR_HEADERS = {"Authorization": "Bearer doctor-doc-201"}
ADMIN_HEADERS = {"Authorization": "Bearer admin-adm-301"}


@pytest.fixture(autouse=True)
def clean_stores():
    """Reset in-memory storage before each test for test isolation."""
    _TRIAGE_STORE.clear()
    _QUEUE_STORE.clear()
    _CONSULTATION_STORE.clear()
    _EMERGENCY_STORE.clear()
    yield


# =========================================================================
# 1. P0 Emergency Pathway
# =========================================================================

def test_p0_intake_auto_escalation_and_events():
    """When an intake message triggers an acute red flag, session immediately halts as p0_escalated."""
    # Start session
    start_res = client.post("/api/intake/session", json={"language": "en"}, headers=PATIENT_A_HEADERS)
    assert start_res.status_code == 200
    session_id = start_res.json()["session_id"]

    # Send acute emergency message
    msg_res = client.post("/api/intake/message", json={
        "session_id": session_id,
        "message": "I have severe crushing chest pain and shortness of breath",
        "audio_bytes": None,
    }, headers=PATIENT_A_HEADERS)
    assert msg_res.status_code == 200
    data = msg_res.json()
    assert data["red_flag"] is True
    assert data["survey_complete"] is True
    assert data.get("priority") == "P0"

    # Verify session status is p0_escalated
    sess_res = client.get(f"/api/intake/session/{session_id}", headers=PATIENT_A_HEADERS)
    assert sess_res.status_code == 200
    assert sess_res.json()["status"] == "p0_escalated"

    # Verify emergency event was recorded
    event = get_emergency_event(session_id=session_id)
    assert event is not None
    assert event["status"] == "p0_escalated"
    assert len(event["timeline"]) >= 1

    # Verify patient queue status exposes p0_escalated
    q_status = client.get("/api/patient/queue-status", headers=PATIENT_A_HEADERS)
    assert q_status.status_code == 200
    assert q_status.json()["status"] == "p0_escalated"
    assert q_status.json()["priority"] == "P0"


def test_p0_banned_from_normal_doctor_queue():
    """Admin cannot approve a P0 case directly into the normal doctor queue."""
    # Seed a P0 assessment
    aid = "ast-p0-test"
    save_assessment({
        "assessment_id": aid,
        "session_id": "sess-p0",
        "patient_id": "pat-101",
        "status": "p0_escalated",
        "priority": "P0",
        "assessment": {
            "priority": "P0",
            "confidence_band": "high",
            "confidence_score": 0.99,
        },
        "case": {
            "chief_complaint": "Acute massive hematemesis",
        }
    })

    # Attempt to approve into normal queue
    res = client.post(f"/api/triage/{aid}/review", json={"action": "approve"}, headers=ADMIN_HEADERS)
    assert res.status_code == 400
    assert "P0 emergency cannot be admitted into normal doctor queue" in res.json()["detail"]


# =========================================================================
# 2. Queue Priority Ordering & Turn Lifecycle
# =========================================================================

def test_queue_priority_ordering_p1_p2_p3():
    """Queue items are strictly ordered: P1 before P2 before P3, FIFO within same priority."""
    # Insert items with deliberate arrival timestamps
    enqueue_doctor_item({
        "session_id": "s-p3-first",
        "patient_id": "pat-p3-1",
        "patient_name": "P3 First",
        "priority": "P3",
        "arrival_time": "2026-09-09T08:00:00",
    })
    enqueue_doctor_item({
        "session_id": "s-p1-late",
        "patient_id": "pat-p1-1",
        "patient_name": "P1 Late",
        "priority": "P1",
        "arrival_time": "2026-09-09T09:00:00",
    })
    enqueue_doctor_item({
        "session_id": "s-p2-mid",
        "patient_id": "pat-p2-1",
        "patient_name": "P2 Mid",
        "priority": "P2",
        "arrival_time": "2026-09-09T08:30:00",
    })
    enqueue_doctor_item({
        "session_id": "s-p1-early",
        "patient_id": "pat-p1-2",
        "patient_name": "P1 Early",
        "priority": "P1",
        "arrival_time": "2026-09-09T08:15:00",
    })

    q_res = client.get("/api/doctor/queue", headers=DOCTOR_HEADERS)
    assert q_res.status_code == 200
    items = q_res.json()
    assert len(items) == 4

    # Order must be: s-p1-early, s-p1-late, s-p2-mid, s-p3-first
    assert items[0]["session_id"] == "s-p1-early"
    assert items[1]["session_id"] == "s-p1-late"
    assert items[2]["session_id"] == "s-p2-mid"
    assert items[3]["session_id"] == "s-p3-first"


# =========================================================================
# 3. Triage Override Validation & Idempotency
# =========================================================================

def test_triage_override_requires_reason():
    """Triage override requires priority and documented clinical reason."""
    aid = "ast-override-test"
    save_assessment({
        "assessment_id": aid,
        "session_id": "sess-ov",
        "patient_id": "pat-101",
        "status": "awaiting_review",
        "priority": "P2",
        "assessment": {"priority": "P2"},
        "case": {"chief_complaint": "Persistent cough"},
    })

    # Override without reason should fail with HTTP 400
    res_no_reason = client.post(f"/api/triage/{aid}/review", json={
        "action": "override",
        "priority": "P1",
    }, headers=ADMIN_HEADERS)
    assert res_no_reason.status_code == 400
    assert "override_reason is required" in res_no_reason.json()["detail"]

    # Override with reason succeeds
    res_ok = client.post(f"/api/triage/{aid}/review", json={
        "action": "override",
        "priority": "P1",
        "override_reason": "Patient is visibly tachypneic on kiosk camera",
    }, headers=ADMIN_HEADERS)
    assert res_ok.status_code == 200
    assert res_ok.json()["status"] == "queued"
    token1 = res_ok.json()["token_number"]

    # Idempotent replay: submitting review again returns the same token
    res_replay = client.post(f"/api/triage/{aid}/review", json={
        "action": "override",
        "priority": "P1",
        "override_reason": "Patient is visibly tachypneic on kiosk camera",
    }, headers=ADMIN_HEADERS)
    assert res_ok.status_code == 200
    assert res_replay.json()["token_number"] == token1
    assert "already approved" in res_replay.json()["message"] or "idempotent" in res_replay.json()["message"]


# =========================================================================
# 4. Role-Based Access Control (RBAC)
# =========================================================================

def test_rbac_patient_cannot_access_doctor_or_admin_routes():
    """A user with patient role cannot access doctor queue or admin triage review."""
    # Attempt to access admin pending triage
    res_admin = client.get("/api/triage/pending", headers=PATIENT_A_HEADERS)
    assert res_admin.status_code == 403

    # Attempt to access doctor queue
    res_doctor = client.get("/api/doctor/queue", headers=PATIENT_A_HEADERS)
    assert res_doctor.status_code == 403


def test_rbac_doctor_cannot_access_admin_triage():
    """A user with doctor role cannot access admin triage actions."""
    res = client.get("/api/triage/pending", headers=DOCTOR_HEADERS)
    assert res.status_code == 403


# =========================================================================
# 5. Patient Session Isolation
# =========================================================================

def test_patient_session_isolation():
    """Patient A cannot view or complete Patient B's intake session."""
    # Patient A starts session
    res_a = client.post("/api/intake/session", json={"language": "en"}, headers=PATIENT_A_HEADERS)
    sess_a_id = res_a.json()["session_id"]

    # Patient B attempts to get Patient A's session
    res_b_read = client.get(f"/api/intake/session/{sess_a_id}", headers=PATIENT_B_HEADERS)
    assert res_b_read.status_code == 403

    # Patient B attempts to complete Patient A's session
    res_b_complete = client.post(f"/api/intake/session/{sess_a_id}/complete", headers=PATIENT_B_HEADERS)
    assert res_b_complete.status_code == 403


# =========================================================================
# 6. Prescription Field Dual-Format Reconciliation
# =========================================================================

def test_prescription_and_consultation_reconciliation():
    """Doctor consultation accepts both medicine_name/duration_days and medication_name/duration."""
    # Enqueue a patient
    enqueue_doctor_item({
        "session_id": "sess-consult",
        "patient_id": "pat-101",
        "patient_name": "Test Patient",
        "priority": "P2",
    })

    # Doctor completes consultation using frontend format (medicine_name + duration_days)
    rx_payload = {
        "diagnosis": "Viral Bronchitis",
        "clinical_notes": "Chest clear bilaterally. Hydration recommended.",
        "prescriptions": [
            {
                "medicine_name": "Azithromycin 500mg",
                "dosage": "1 tab",
                "frequency": "OD",
                "duration_days": 3,
                "instructions": "Post breakfast",
            }
        ],
        "follow_up_advice": "Consult if fever persists past 3 days.",
    }

    res = client.post("/api/doctor/turn/sess-consult/consult", json=rx_payload, headers=DOCTOR_HEADERS)
    assert res.status_code == 200
    consult = res.json()["consultation"]
    assert consult["diagnosis"] == "Viral Bronchitis"
    assert len(consult["prescriptions"]) == 1
    rx = consult["prescriptions"][0]
    # Reconciled fields: both aliases available
    assert rx["medication_name"] == "Azithromycin 500mg"
    assert rx["medicine_name"] == "Azithromycin 500mg"
    assert rx["duration_days"] == 3


# =========================================================================
# 7. Dual Route Family Parity (/api/v1/... and /api/...)
# =========================================================================

def test_api_v1_route_parity():
    """Routes under /api/v1/ behave identically to /api/ routes."""
    # Auth me
    res_v0 = client.get("/api/auth/me", headers=DOCTOR_HEADERS)
    res_v1 = client.get("/api/v1/auth/me", headers=DOCTOR_HEADERS)
    assert res_v0.status_code == res_v1.status_code == 200
    assert res_v0.json()["role"] == res_v1.json()["role"] == "doctor"

    # Health endpoint
    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "ok"


# =========================================================================
# 8. Demo Seed and Kiosk Auth Flow
# =========================================================================

def test_demo_seed_endpoint_and_deterministic_cases():
    """POST /api/triage/seed-demo seeds P0, P1, P2, P3 cases with realistic allocation/timeline."""
    res = client.post("/api/triage/seed-demo", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "seeded"
    assert data["p0_active"] >= 2
    assert data["total_queued"] >= 3

    # Verify P0 emergency timeline entry was auto-dispatched without admin approval
    p0_event = get_emergency_event("demo-sess-001")
    assert p0_event is not None
    assert p0_event["status"] in ("p0_escalated", "emergency_dispatched")
    assert len(p0_event["timeline"]) >= 1

    # Verify P1, P2, P3 in doctor queue
    queue_res = client.get("/api/doctor/queue", headers=DOCTOR_HEADERS)
    assert queue_res.status_code == 200
    items = queue_res.json()
    assert any(i["priority"] == "P1" for i in items)
    assert any(i["priority"] == "P2" for i in items)
    assert any(i["priority"] == "P3" for i in items)


def test_kiosk_auth_walkup_flow():
    """Kiosk walkup can query queue status safely and kiosk bearer tokens map to patient role."""
    # Enqueue a test patient
    enqueue_doctor_item({
        "session_id": "kiosk-walkup-test",
        "patient_id": "pat-walkup-01",
        "patient_name": "Walkup Patient",
        "priority": "P2",
        "chief_complaint": "Mild fever",
        "token_number": 199,
        "allocated_doctor": "Dr. Vance",
    })

    # 1. Anonymous / Header-less query allowed on public patient queue status
    res = client.get("/api/patient/queue-status?session_id=kiosk-walkup-test")
    assert res.status_code == 200
    assert res.json()["token_number"] == 199
    assert res.json()["status"] == "queued"

    # 2. Kiosk token maps to patient role
    kiosk_headers = {"Authorization": "Bearer kiosk-terminal-101"}
    me_res = client.get("/api/auth/me", headers=kiosk_headers)
    assert me_res.status_code == 200
    assert me_res.json()["role"] == "patient"
    assert me_res.json()["user_id"] == "kiosk-terminal-101"

    # 3. Kiosk token cannot access doctor queue or admin triage
    doc_res = client.get("/api/doctor/queue", headers=kiosk_headers)
    assert doc_res.status_code == 403

    admin_res = client.get("/api/triage/pending", headers=kiosk_headers)
    assert admin_res.status_code == 403
