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
    assert assessment.priority in ("P0", "P1"), f"Expected high acuity P0/P1, got {assessment.priority}"
    assert len(assessment.evidence) > 0, "Expected evidence quotes"

    # Store in triage registry
    _TRIAGE_ASSESSMENTS[assessment.assessment_id] = {
        "assessment": assessment.model_dump(),
        "case": case.model_dump(),
        "patient_id": "patient-101",
        "session_id": "test-session-101",
        "submitted_at": "2026-09-09T10:00:00",
        "status": "awaiting_review",
    }

    print("\n=== 2. TESTING SUPER ADMIN TRIAGE REVIEW GATE ===")
    pending = await list_pending_triage(authorization="Bearer mock-admin-token")
    assert len(pending) >= 1, "Expected pending items in list"
    print(f"✅ Found {len(pending)} pending triage item(s)")

    # Approve into Doctor Queue
    review_req = TriageApprovalRequest(action="approve")
    review_res = await review_assessment(
        assessment_id=assessment.assessment_id,
        body=review_req,
        authorization="Bearer mock-admin-token",
    )
    print(f"✅ Admin Approved: {review_res['message']} | Token: #{review_res['token_number']}")
    assert review_res["status"] == "queued"

    print("\n=== 3. TESTING DOCTOR TURN QUEUE ===")
    doctor_queue = await get_doctor_priority_queue(authorization="Bearer mock-doctor-token")
    assert len(doctor_queue) >= 1, "Doctor queue must contain approved patient"
    top_patient = doctor_queue[0]
    print(f"✅ Doctor Queue Top Patient: Token #{top_patient['token_number']} ({top_patient['patient_name']}) - Priority {top_patient['priority']}")

    # Call patient turn
    call_res = await call_patient_turn(session_id="test-session-101", authorization="Bearer mock-doctor-token")
    print(f"✅ Doctor Calling: {call_res['status']}")

    # Check Patient Status from Patient perspective
    patient_status = await get_patient_queue_status(authorization="Bearer patient-101")
    print(f"✅ Patient Status View: status='{patient_status['status']}', token={patient_status.get('token_number')}")
    assert patient_status["status"] == "called"

    print("\n=== 4. TESTING DOCTOR CONSULTATION & DIGITAL RX ===")
    consult_req = ConsultationRequest(
        session_id="test-session-101",
        diagnosis="Acute Coronary Syndrome / Suspected NSTEMI",
        clinical_notes="Immediate 12-lead ECG completed showing ST elevations in V1-V4. IV access secured. Cardiology on call.",
        prescriptions=[
            PrescriptionItem(medication_name="Aspirin (Dispersible)", dosage="300mg", frequency="Stat", duration="1 day", instructions="Chew immediately"),
            PrescriptionItem(medication_name="Clopidogrel", dosage="300mg", frequency="Stat", duration="1 day", instructions="Oral stat dose"),
            PrescriptionItem(medication_name="Sublingual Nitroglycerin", dosage="0.4mg", frequency="SOS", duration="1 day", instructions="Under tongue"),
        ],
        follow_up_days=5,
        general_advice="Emergency transfer to Cath Lab for coronary angiography.",
    )

    consult_record = await record_doctor_consultation(
        session_id="test-session-101",
        body=consult_req,
        authorization="Bearer mock-doctor-token",
    )
    print(f"✅ Consultation Completed: ID={consult_record['consultation']['consultation_id']}")
    print(f"   Diagnosis: {consult_record['consultation']['diagnosis']}")
    print(f"   Prescriptions Issued: {len(consult_record['consultation']['prescriptions'])} medicines")

    # Verify Patient Status now reflects completed Rx
    final_patient_status = await get_patient_queue_status(authorization="Bearer patient-101")
    print(f"✅ Final Patient Status View: status='{final_patient_status['status']}'")
    assert final_patient_status["status"] == "consultation_completed"
    assert final_patient_status["consultation"]["diagnosis"] == "Acute Coronary Syndrome / Suspected NSTEMI"
    assert len(final_patient_status["consultation"]["prescriptions"]) == 3

    print("\n==========================================")
    print("🎉 ALL END-TO-END CLINICAL WORKFLOW TESTS PASSED!")
    print("==========================================")


if __name__ == "__main__":
    asyncio.run(main())
