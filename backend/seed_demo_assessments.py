"""Populate realistic clinical test cases for Admin Triage Gate demo."""

import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.models import PatientCase
from app.services.pre_triage import run_ai_pre_triage
from app.routers.triage import _TRIAGE_ASSESSMENTS

DEMO_CASES = [
    {
        "session_id": "demo-sess-001",
        "patient_id": "patient-rajesh",
        "patient_name": "Rajesh Kumar (Age 56, M)",
        "case": PatientCase(
            session_id="demo-sess-001",
            patient_id="patient-rajesh",
            chief_complaint="Crushing substernal chest pain radiating to left jaw and left arm, accompanied by profuse sweating and nausea.",
            category="cardiovascular",
            duration="45 minutes",
            severity=9,
            symptoms=["central chest tightness", "radiating jaw pain", "diaphoresis", "shortness of breath", "nausea"],
            negative_symptoms=["no trauma", "no fever"],
            relevant_history=["Hypertension 8 yrs", "Type 2 Diabetes mellitus", "Heavy smoker (20 pack-years)"],
            current_medications=["Telmisartan 40mg", "Metformin 500mg BD"],
            allergies=["NKDA"],
            patient_concerns="Feels like an elephant sitting on my chest, very scared.",
            red_flag_detected=True,
            red_flag_details={"signals": ["chest_pain_radiating", "diaphoresis"]},
        ),
    },
    {
        "session_id": "demo-sess-002",
        "patient_id": "patient-ananya",
        "patient_name": "Ananya Sharma (Age 24, F)",
        "case": PatientCase(
            session_id="demo-sess-002",
            patient_id="patient-ananya",
            chief_complaint="Acute severe right lower quadrant abdominal pain with rebound tenderness, low grade fever and repeated vomiting.",
            category="gastroenterology",
            duration="12 hours (progressively worsening)",
            severity=8,
            symptoms=["RLQ abdominal pain", "anorexia", "nausea", "bilious vomiting", "fever 101.4F"],
            negative_symptoms=["no diarrhea", "no urinary burning"],
            relevant_history=["No prior surgeries"],
            current_medications=["None"],
            allergies=["Penicillin (hives)"],
            patient_concerns="Cannot stand upright or walk without sharp pain.",
            red_flag_detected=False,
        ),
    },
    {
        "session_id": "demo-sess-003",
        "patient_id": "patient-vikram",
        "patient_name": "Vikram Patel (Age 38, M)",
        "case": PatientCase(
            session_id="demo-sess-003",
            patient_id="patient-vikram",
            chief_complaint="High fever with chills, productive cough with yellow-green sputum, and mild pleuritic chest discomfort.",
            category="respiratory",
            duration="3 days",
            severity=6,
            symptoms=["productive cough", "fever 102F", "chills", "fatigue", "sore throat"],
            negative_symptoms=["no hemoptysis", "no severe dyspnea at rest"],
            relevant_history=["Mild seasonal allergic rhinitis"],
            current_medications=["Paracetamol 650mg SOS"],
            allergies=["NKDA"],
            patient_concerns="Difficulty sleeping due to incessant night cough.",
            red_flag_detected=False,
        ),
    },
    {
        "session_id": "demo-sess-004",
        "patient_id": "patient-meera",
        "patient_name": "Meera Joshi (Age 62, F)",
        "case": PatientCase(
            session_id="demo-sess-004",
            patient_id="patient-meera",
            chief_complaint="Routine follow-up consultation for medication refills and periodic blood pressure checkup. Mild knee stiffness.",
            category="general",
            duration="Chronic (3 months since last visit)",
            severity=2,
            symptoms=["mild bilateral knee stiffness in morning", "well controlled blood pressure"],
            negative_symptoms=["no chest pain", "no breathlessness", "no dizziness", "no fever"],
            relevant_history=["Essential Hypertension (15 yrs)", "Osteoarthritis knees"],
            current_medications=["Amlodipine 5mg OD", "Calcium + Vitamin D3"],
            allergies=["Sulfa drugs"],
            patient_concerns="Need 30-day prescription refill and routine lab orders.",
            red_flag_detected=False,
        ),
    },
]

async def seed():
    print("🌱 Generating AI Pre-Triage assessments for diverse test patients...")
    for demo in DEMO_CASES:
        session_id = demo["session_id"]
        patient_id = demo["patient_id"]
        case = demo["case"]
        
        assessment = await run_ai_pre_triage(
            intake_id=session_id,
            patient_id=patient_id,
            case=case,
        )
        
        case_dict = case.model_dump()
        case_dict["patient_name"] = demo["patient_name"]

        _TRIAGE_ASSESSMENTS[assessment.assessment_id] = {
            "assessment": assessment.model_dump(),
            "case": case_dict,
            "patient_id": patient_id,
            "session_id": session_id,
            "submitted_at": datetime.now().isoformat(),
            "status": "awaiting_review",
        }
        print(f"✅ Generated [{assessment.priority}]: {demo['patient_name']} — {case.chief_complaint[:50]}...")

    print(f"\n✨ Total pending intakes in Admin Review Gate: {len(_TRIAGE_ASSESSMENTS)}")

if __name__ == "__main__":
    asyncio.run(seed())
