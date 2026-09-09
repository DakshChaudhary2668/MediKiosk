"""Comprehensive test suite for MediKiosk Pre-Triage, Admin Gate, Doctor Queue, and Digital Rx."""

import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.models import (
    PatientCase,
    TriageApprovalRequest,
    ConsultationRequest,
    PrescriptionItem,
)
from app.services.pre_triage import run_ai_pre_triage
from app.routers.triage import _TRIAGE_ASSESSMENTS, _DOCTOR_QUEUE, review_assessment, list_pending_triage
from app.routers.queue import (
    get_doctor_priority_queue,
    call_patient_turn,
    record_doctor_consultation,
    get_patient_queue_status,
)


async def main():
    print("=== 1. TESTING AI PRE-TRIAGE ENGINE ===")
    case = PatientCase(
        session_id="test-session-101",
        patient_id="patient-101",
        chief_complaint="Severe central chest pain radiating to left jaw with cold sweats for 45 minutes",
        category="cardiovascular",
        duration="45 minutes",
        severity=9,
        symptoms=["chest tightness", "radiating jaw pain", "diaphoresis", "shortness of breath"],
        relevant_history=["Hypertension", "Type 2 Diabetes"],
        current_medications=["Metformin 500mg"],
        red_flag_detected=True,
        red_flag_details={"signals": ["chest_pain_radiating", "diaphoresis"]},
    )

    assessment = await run_ai_pre_triage(
        intake_id="test-session-101",
        patient_id="patient-101",
        case=case,
    )

    print(f"✅ Pre-Triage Generated: Priority={assessment.priority} (Confidence: {assessment.confidence_band})")
    print(f"   Confidence Score: {assessment.confidence_score}")
    print(f"   Uncertainty Gaps: {assessment.uncertainty.missing_information}")
    print(f"   Evidence Claims: {len(assessment.evidence)} quotes extracted")
    assert assessment.priority == "P0", f"Expected P0 for acute chest pain red flag, got {assessment.priority}"
    assert assessment.status == "p0_escalated", f"Expected p0_escalated status, got {assessment.status}"
    assert len(assessment.evidence) > 0, "Expected evidence quotes"

    # Store in triage registry as P0
    _TRIAGE_ASSESSMENTS[assessment.assessment_id] = {
        "assessment": assessment.model_dump(),
        "case": case.model_dump(),
        "patient_id": "patient-101",
        "session_id": "test-session-101",
        "submitted_at": "2026-09-09T10:00:00",
        "status": "p0_escalated",
    }

    # Verify P0 CANNOT be admitted to normal queue without override
    from fastapi import HTTPException
    p0_blocked = False
    try:
        await review_assessment(
            assessment_id=assessment.assessment_id,
            body=TriageApprovalRequest(action="approve"),
            authorization="Bearer mock-admin-token",
        )
    except HTTPException as e:
        if e.status_code == 400:
            p0_blocked = True
            print("✅ Safety Invariant Verified: Normal queue admission blocked for P0 emergency")
    assert p0_blocked, "P0 should not be allowed into normal doctor queue without clinical override!"

    # Now test standard P1 clinical pathway
    p1_case = PatientCase(
        session_id="test-session-p1",
        patient_id="patient-p1",
        chief_complaint="High fever 103F with severe shivering and body aches for 3 days",
        category="general",
        duration="3 days",
        severity=7,
        symptoms=["fever", "chills", "myalgia"],
        relevant_history=[],
        current_medications=[],
        red_flag_detected=False,
    )
    p1_assessment = await run_ai_pre_triage(
        intake_id="test-session-p1",
        patient_id="patient-p1",
        case=p1_case,
    )
    # Ensure P1 for queue test
    p1_assessment.priority = "P1"
    p1_assessment.status = "awaiting_review"
    _TRIAGE_ASSESSMENTS[p1_assessment.assessment_id] = {
        "assessment": p1_assessment.model_dump(),
        "case": p1_case.model_dump(),
        "patient_id": "patient-p1",
        "session_id": "test-session-p1",
        "submitted_at": "2026-09-09T10:05:00",
        "status": "awaiting_review",
    }

    print("\n=== 2. TESTING SUPER ADMIN TRIAGE REVIEW GATE ===")
    pending = await list_pending_triage(authorization="Bearer mock-admin-token")
    assert len(pending) >= 1, "Expected pending items in list"
    print(f"✅ Found {len(pending)} pending triage item(s)")

    # Approve P1 into Doctor Queue
    review_req = TriageApprovalRequest(action="approve")
    review_res = await review_assessment(
        assessment_id=p1_assessment.assessment_id,
        body=review_req,
        authorization="Bearer mock-admin-token",
    )
    print(f"✅ Admin Approved P1: {review_res['message']} | Token: #{review_res['token_number']}")
    assert review_res["status"] == "queued"

    print("\n=== 3. TESTING DOCTOR TURN QUEUE ===")
    doctor_queue = await get_doctor_priority_queue(authorization="Bearer mock-doctor-token")
    assert len(doctor_queue) >= 1, "Doctor queue must contain approved patient"
    top_patient = doctor_queue[0]
    print(f"✅ Doctor Queue Top Patient: Token #{top_patient['token_number']} ({top_patient['patient_name']}) - Priority {top_patient['priority']}")

    # Call patient turn
    call_res = await call_patient_turn(session_id="test-session-p1", authorization="Bearer mock-doctor-token")
    print(f"✅ Doctor Calling: {call_res['status']}")

    # Check Patient Status from Patient perspective
    patient_status = await get_patient_queue_status(authorization="Bearer patient-p1")
    print(f"✅ Patient Status View: status='{patient_status['status']}', token={patient_status.get('token_number')}")
    assert patient_status["status"] == "called"

    print("\n=== 4. TESTING DOCTOR CONSULTATION & DIGITAL RX ===")
    consult_req = ConsultationRequest(
        session_id="test-session-p1",
        diagnosis="Acute Febrile Illness / Suspected Dengue",
        clinical_notes="Complete blood count ordered. Platelets 180k. Vitals stable. Advised rest and fluids.",
        prescriptions=[
            PrescriptionItem(medication_name="Paracetamol", dosage="650mg", frequency="TDS", duration="3 days", instructions="After meals"),
            PrescriptionItem(medication_name="Oral Rehydration Salts", dosage="1 sachet in 1L", frequency="OD", duration="3 days", instructions="Sip throughout day"),
        ],
        follow_up_days=3,
        general_advice="Return immediately if severe abdominal pain or bleeding gums occur.",
    )

    consult_record = await record_doctor_consultation(
        session_id="test-session-p1",
        body=consult_req,
        authorization="Bearer mock-doctor-token",
    )
    print(f"✅ Consultation Completed: ID={consult_record['consultation']['consultation_id']}")
    print(f"   Diagnosis: {consult_record['consultation']['diagnosis']}")
    print(f"   Prescriptions Issued: {len(consult_record['consultation']['prescriptions'])} medicines")

    # Verify Patient Status now reflects completed Rx
    final_patient_status = await get_patient_queue_status(authorization="Bearer patient-p1")
    print(f"✅ Final Patient Status View: status='{final_patient_status['status']}'")
    assert final_patient_status["status"] in ("completed", "consultation_completed")
    assert final_patient_status["consultation"]["diagnosis"] == "Acute Febrile Illness / Suspected Dengue"
    assert len(final_patient_status["consultation"]["prescriptions"]) == 2

    print("\n==========================================")
    print("🎉 ALL END-TO-END CLINICAL WORKFLOW TESTS PASSED!")
    print("==========================================")


if __name__ == "__main__":
    asyncio.run(main())
