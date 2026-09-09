"""Super Admin Triage Review & Approval Gate Router.

Human-in-the-loop safety gate:
- Lists incoming intakes with AI pre-triage recommendations.
- Allows Super Admin to approve, override priority, or escalate emergencies.
- Only approved assessments enter the active Doctor Queue.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, Header, HTTPException

from app.db import supabase
from app.models import (
    PatientCase,
    PreTriageAssessment,
    QueueItem,
    TriageApprovalRequest,
)
from app.routers.auth import get_user_id
from app.services.pre_triage import run_ai_pre_triage

log = logging.getLogger("medikiosk.triage")

router = APIRouter(prefix="/api/triage", tags=["triage"])

# In-memory storage for triage reviews & active queue
_TRIAGE_ASSESSMENTS: dict[str, dict] = {}
_DOCTOR_QUEUE: list[dict] = []
_TOKEN_COUNTER: int = 100


def get_all_assessments():
    return _TRIAGE_ASSESSMENTS


def get_doctor_queue():
    return _DOCTOR_QUEUE


@router.post("/seed-demo")
async def seed_demo_triage():
    """Seed 10 realistic clinical test cases across P0, P1, P2, and P3 triage bands for live demo."""
    cases = [
        {
            "session_id": "demo-sess-001",
            "patient_id": "patient-rajesh",
            "patient_name": "Rajesh Kumar (Age 56, M)",
            "case": PatientCase(
                session_id="demo-sess-001",
                patient_id="patient-rajesh",
                chief_complaint="Crushing substernal chest pain radiating to left jaw and left arm with profuse sweating.",
                category="cardiovascular",
                duration="45 minutes",
                severity=9,
                symptoms=["central chest tightness", "radiating jaw pain", "diaphoresis", "shortness of breath", "nausea"],
                negative_symptoms=["no trauma", "no fever"],
                relevant_history=["Hypertension 8 yrs", "Type 2 Diabetes mellitus", "Heavy smoker (20 pack-years)"],
                current_medications=["Telmisartan 40mg", "Metformin 500mg BD"],
                allergies=["NKDA"],
                patient_concerns="Severe tightness in chest, difficulty breathing.",
                red_flag_detected=True,
                red_flag_details={"signals": ["chest_pain_radiating", "diaphoresis"]},
            ),
        },
        {
            "session_id": "demo-sess-002",
            "patient_id": "patient-suresh",
            "patient_name": "Suresh Verma (Age 68, M)",
            "case": PatientCase(
                session_id="demo-sess-002",
                patient_id="patient-suresh",
                chief_complaint="Sudden onset right-sided facial droop, right arm weakness, and slurred speech for 40 minutes.",
                category="neurological",
                duration="40 minutes",
                severity=10,
                symptoms=["right hemiparesis", "facial asymmetry", "dysarthria", "confusion"],
                negative_symptoms=["no head trauma", "no seizure"],
                relevant_history=["Atrial Fibrillation", "Ischemic Heart Disease"],
                current_medications=["Aspirin 75mg", "Atorvastatin 20mg"],
                allergies=["NKDA"],
                patient_concerns="Family reports sudden inability to speak or lift right hand.",
                red_flag_detected=True,
                red_flag_details={"signals": ["focal_neurological_deficit", "slurred_speech"]},
            ),
        },
        {
            "session_id": "demo-sess-003",
            "patient_id": "patient-ananya",
            "patient_name": "Ananya Sharma (Age 24, F)",
            "case": PatientCase(
                session_id="demo-sess-003",
                patient_id="patient-ananya",
                chief_complaint="Acute severe right lower quadrant abdominal pain with fever 101.5F and repeated vomiting.",
                category="gastroenterology",
                duration="12 hours",
                severity=8,
                symptoms=["RLQ abdominal pain", "anorexia", "nausea", "vomiting", "fever 101.5F"],
                negative_symptoms=["no diarrhea", "no dysuria"],
                relevant_history=["No previous surgeries"],
                current_medications=["None"],
                allergies=["Penicillin (hives)"],
                patient_concerns="Sharp stabbing abdominal pain preventing walking.",
                red_flag_detected=False,
            ),
        },
        {
            "session_id": "demo-sess-004",
            "patient_id": "patient-priya",
            "patient_name": "Priya Nair (Age 29, F)",
            "case": PatientCase(
                session_id="demo-sess-004",
                patient_id="patient-priya",
                chief_complaint="Acute severe asthma exacerbation with audible expiratory wheezing, breathlessness, and inability to speak full sentences.",
                category="respiratory",
                duration="3 hours",
                severity=8,
                symptoms=["severe dyspnea", "audible wheeze", "chest tightness", "tachypnea"],
                negative_symptoms=["no fever", "no ankle swelling"],
                relevant_history=["Bronchial Asthma since childhood", "Pollen allergy"],
                current_medications=["Salbutamol inhaler (already took 4 puffs without relief)"],
                allergies=["Aspirin/NSAIDs"],
                patient_concerns="Inhaler not working, feeling suffocated.",
                red_flag_detected=False,
            ),
        },
        {
            "session_id": "demo-sess-005",
            "patient_id": "patient-aarav",
            "patient_name": "Aarav Gupta (Age 7, M)",
            "case": PatientCase(
                session_id="demo-sess-005",
                patient_id="patient-aarav",
                chief_complaint="High grade fever 103.6F with barking cough, stridor during inspiration, and suprasternal retractions.",
                category="pediatric",
                duration="1 day (worse at night)",
                severity=8,
                symptoms=["barking seal-like cough", "inspiratory stridor", "fever 103.6F", "hoarse voice", "restlessness"],
                negative_symptoms=["no foreign body ingestion", "no cyanosis"],
                relevant_history=["Full vaccination history up to date"],
                current_medications=["Paracetamol syrup 250mg"],
                allergies=["NKDA"],
                patient_concerns="Parent notes harsh whistling noise when child inhales.",
                red_flag_detected=False,
            ),
        },
        {
            "session_id": "demo-sess-006",
            "patient_id": "patient-vikram",
            "patient_name": "Vikram Patel (Age 38, M)",
            "case": PatientCase(
                session_id="demo-sess-006",
                patient_id="patient-vikram",
                chief_complaint="High fever 102F with chills, productive cough with yellow-green sputum for 3 days.",
                category="respiratory",
                duration="3 days",
                severity=6,
                symptoms=["productive cough", "fever 102F", "chills", "fatigue", "sore throat"],
                negative_symptoms=["no hemoptysis", "no resting dyspnea"],
                relevant_history=["Seasonal allergies"],
                current_medications=["Paracetamol 650mg SOS"],
                allergies=["NKDA"],
                patient_concerns="Persistent nighttime coughing.",
                red_flag_detected=False,
            ),
        },
        {
            "session_id": "demo-sess-007",
            "patient_id": "patient-sunita",
            "patient_name": "Sunita Devi (Age 45, F)",
            "case": PatientCase(
                session_id="demo-sess-007",
                patient_id="patient-sunita",
                chief_complaint="Intense burning sensation during urination, increased urinary frequency, and lower abdominal discomfort.",
                category="general",
                duration="2 days",
                severity=6,
                symptoms=["dysuria", "urinary urgency", "suprapubic tenderness", "cloudy urine"],
                negative_symptoms=["no flank pain", "no high fever with rigors", "no vaginal discharge"],
                relevant_history=["Recurrent UTI 2 yrs ago"],
                current_medications=["None"],
                allergies=["NKDA"],
                patient_concerns="Severe discomfort each time passing urine.",
                red_flag_detected=False,
            ),
        },
        {
            "session_id": "demo-sess-008",
            "patient_id": "patient-rohan",
            "patient_name": "Rohan Mehta (Age 19, M)",
            "case": PatientCase(
                session_id="demo-sess-008",
                patient_id="patient-rohan",
                chief_complaint="Right ankle inversion injury during football match 2 hours ago. Marked lateral swelling and inability to bear weight.",
                category="orthopedic",
                duration="2 hours",
                severity=6,
                symptoms=["lateral malleolar pain", "marked edema", "ecchymosis", "inability to walk"],
                negative_symptoms=["no open wound", "distal pulses intact", "no deformity"],
                relevant_history=["Previous left ankle sprain 1 year ago"],
                current_medications=["None"],
                allergies=["NKDA"],
                patient_concerns="Need X-ray to check for fracture and pain relief.",
                red_flag_detected=False,
            ),
        },
        {
            "session_id": "demo-sess-009",
            "patient_id": "patient-kavita",
            "patient_name": "Kavita Rao (Age 34, F)",
            "case": PatientCase(
                session_id="demo-sess-009",
                patient_id="patient-kavita",
                chief_complaint="Itchy, red erythematous rash on both forearms and neck after applying a new scented sunscreen lotion.",
                category="dermatology",
                duration="1 day",
                severity=3,
                symptoms=["pruritus", "erythematous papules", "local burning sensation"],
                negative_symptoms=["no facial swelling", "no lip/tongue edema", "no breathing difficulty"],
                relevant_history=["Sensitive skin history"],
                current_medications=["Cetirizine 10mg taken once"],
                allergies=["Fragrance compounds"],
                patient_concerns="Severe itching and red skin patches.",
                red_flag_detected=False,
            ),
        },
        {
            "session_id": "demo-sess-010",
            "patient_id": "patient-meera",
            "patient_name": "Meera Joshi (Age 62, F)",
            "case": PatientCase(
                session_id="demo-sess-010",
                patient_id="patient-meera",
                chief_complaint="Routine follow-up consultation for blood pressure check and 30-day medication refill. Mild bilateral knee stiffness.",
                category="general",
                duration="Chronic (3 months)",
                severity=2,
                symptoms=["mild morning knee stiffness", "blood pressure check"],
                negative_symptoms=["no chest pain", "no breathlessness", "no headache"],
                relevant_history=["Essential Hypertension (15 yrs)", "Osteoarthritis"],
                current_medications=["Amlodipine 5mg OD", "Calcium + Vitamin D3"],
                allergies=["Sulfa drugs"],
                patient_concerns="Need 30-day prescription refill.",
                red_flag_detected=False,
            ),
        },
    ]

    _TRIAGE_ASSESSMENTS.clear()
    seeded_count = 0
    for item in cases:
        assessment = await run_ai_pre_triage(
            intake_id=item["session_id"],
            patient_id=item["patient_id"],
            case=item["case"],
        )
        case_dict = item["case"].model_dump()
        case_dict["patient_name"] = item["patient_name"]
        _TRIAGE_ASSESSMENTS[assessment.assessment_id] = {
            "assessment": assessment.model_dump(),
            "case": case_dict,
            "patient_id": item["patient_id"],
            "session_id": item["session_id"],
            "submitted_at": datetime.now().isoformat(),
            "status": "awaiting_review",
        }
        seeded_count += 1

    return {"status": "seeded", "count": seeded_count, "total_pending": len(_TRIAGE_ASSESSMENTS)}


@router.post("/assess")
async def trigger_pre_triage(
    session_id: str,
    authorization: str = Header(...),
):
    """Generate and store an AI pre-triage assessment for a completed intake session."""
    uid = get_user_id(authorization)

    # 1. Fetch case details
    case_data = None
    try:
        res = supabase.table("patient_cases").select("*").eq("session_id", session_id).single().execute()
        if res.data:
            case_data = res.data
    except Exception:
        pass

    if not case_data:
        # Fallback to in-memory cases from intake router
        from app.routers.intake import _MEM_CASES
        case_data = _MEM_CASES.get(session_id, {
            "session_id": session_id,
            "patient_id": uid,
            "chief_complaint": "Acute health symptoms",
            "category": "respiratory",
            "duration": "recent",
            "severity": 5,
        })

    patient_case = PatientCase(**{k: v for k, v in case_data.items() if k in PatientCase.model_fields})

    # 2. Run AI Pre-Triage
    assessment = await run_ai_pre_triage(
        intake_id=session_id,
        patient_id=uid,
        case=patient_case,
    )

    # 3. Store assessment
    _TRIAGE_ASSESSMENTS[assessment.assessment_id] = {
        "assessment": assessment.model_dump(),
        "case": case_data,
        "patient_id": uid,
        "session_id": session_id,
        "submitted_at": datetime.now().isoformat(),
        "status": "awaiting_review",
    }

    return assessment


@router.get("/pending")
async def list_pending_triage(authorization: str = Header(...)):
    """Fetch all patient intakes awaiting Super Admin review."""
    # List all awaiting review
    pending = [
        item for item in _TRIAGE_ASSESSMENTS.values()
        if item["status"] == "awaiting_review"
    ]
    # Sort with P0/P1 on top
    priority_weight = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
    pending.sort(key=lambda x: priority_weight.get(x["assessment"]["priority"], 2))
    return pending


@router.post("/{assessment_id}/review")
async def review_assessment(
    assessment_id: str,
    body: TriageApprovalRequest,
    authorization: str = Header(...),
):
    """Super Admin review gate: Approve, Override, Escalate, or Reject."""
    admin_id = get_user_id(authorization)
    global _TOKEN_COUNTER

    if assessment_id not in _TRIAGE_ASSESSMENTS:
        raise HTTPException(404, "Triage assessment not found")

    item = _TRIAGE_ASSESSMENTS[assessment_id]
    original_priority = item["assessment"]["priority"]
    final_priority = body.priority if body.action == "override" else original_priority

    item["status"] = "approved" if body.action in ("approve", "override") else body.action
    item["reviewed_by"] = admin_id
    item["reviewed_at"] = datetime.now().isoformat()
    item["final_priority"] = final_priority
    item["override_reason"] = body.override_reason if body.action == "override" else None
    item["review_notes"] = body.notes

    # If approved / overridden -> Admit into Doctor Queue
    if body.action in ("approve", "override"):
        _TOKEN_COUNTER += 1
        token = _TOKEN_COUNTER
        queue_entry = {
            "token_number": token,
            "session_id": item["session_id"],
            "patient_id": item["patient_id"],
            "patient_name": item["case"].get("patient_name") or "Patient " + str(token),
            "age": item["case"].get("age"),
            "gender": item["case"].get("gender"),
            "priority": final_priority,
            "status": "queued",
            "chief_complaint": item["case"].get("chief_complaint"),
            "category": item["case"].get("category"),
            "arrival_time": item["submitted_at"],
            "approved_at": item["reviewed_at"],
            "case": item["case"],
            "assessment": item["assessment"],
        }
        _DOCTOR_QUEUE.append(queue_entry)

        # Audit log in Supabase
        try:
            supabase.table("audit_logs").insert({
                "actor_id": admin_id,
                "action": "triage_approved",
                "entity_type": "patient_session",
                "entity_id": item["session_id"],
                "details": {
                    "original_priority": original_priority,
                    "final_priority": final_priority,
                    "override_reason": body.override_reason,
                    "token": token,
                },
            }).execute()
        except Exception:
            pass

        return {
            "message": "Patient approved and placed in doctor queue",
            "token_number": token,
            "priority": final_priority,
            "status": "queued",
        }

    elif body.action == "escalate":
        # Emergency ER path
        return {
            "message": "Emergency protocol activated: Patient escalated directly to ER Resuscitation.",
            "priority": "P0",
            "status": "escalated_er",
        }

    return {"message": f"Assessment {body.action}ed successfully"}
