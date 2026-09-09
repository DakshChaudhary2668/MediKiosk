"""AI Pre-Triage Acuity Engine.

Evaluates finalized PatientCase data to produce an advisory operational priority band (P0-P3),
confidence rating, uncertainty analysis, safety flags, and traceable evidence.
Advisory only — never mutates clinical queue without Super Admin approval.
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime
from typing import Any

from groq import Groq

from app.config import settings
from app.models import (
    EvidenceItem,
    PatientCase,
    PreTriageAssessment,
    UncertaintyInfo,
)

log = logging.getLogger("medikiosk.pre_triage")

_client = Groq(api_key=settings.groq_api_key)

TRIAGE_PROMPT = """You are MediKiosk AI Clinical Triage Advisory Service.

## YOUR ROLE
Analyze structured patient pre-consultation intake data and assign an operational priority band (P0-P3) to support the Triage Nurse / Super Admin review gate.

## OPERATIONAL PRIORITY BANDS
- P0: Immediate danger or emergency signal (severe chest pain, respiratory distress, stroke signs, severe hemorrhage, anaphylaxis, suicidal crisis).
- P1: Very urgent concern requiring priority same-session handling (severe pain >= 8/10, acute high fever with altered state, severe trauma).
- P2: Standard acute medical complaint (moderate fever, sore throat, cough, acute joint pain, gastroenteritis).
- P3: Routine or low-urgency concern (medication refill, minor rash, chronic follow-up, general wellness checkup).

## STRICT CLINICAL RULES
1. This is OPERATIONAL TRIAGE ADVISORY only, NOT a diagnosis or prescription.
2. If red flags are detected, ALWAYS return P0.
3. Every evidence item must cite specific facts from the patient intake. Do NOT hallucinate unmentioned symptoms.
4. Calculate confidence: "high", "medium", or "low".
5. Note any missing critical information or contradictions in the uncertainty object.

## MANDATORY JSON FORMAT
{
  "priority": "P0 | P1 | P2 | P3",
  "confidence_band": "high | medium | low",
  "confidence_score": 0.85,
  "uncertainty": {
    "needs_human_review": true,
    "reasons": ["Short clinical reason for priority and review need"],
    "missing_information": ["List any key missing vital signs or history"],
    "contradictions": []
  },
  "safety_flags": [],
  "evidence": [
    {
      "source": "patient_intake",
      "field": "field_name",
      "summary": "Specific fact from patient statement"
    }
  ],
  "recommended_next_action": "human_review | immediate_er_escalation"
}
"""


def evaluate_deterministic_triage(case: PatientCase) -> PreTriageAssessment | None:
    """Fast deterministic rule check for obvious P0 emergency signals."""
    if case.red_flag_detected:
        return PreTriageAssessment(
            assessment_id=f"triage_{uuid.uuid4().hex[:12]}",
            intake_id=f"intake_{uuid.uuid4().hex[:8]}",
            patient_id="unknown",
            priority="P0",
            confidence_band="high",
            confidence_score=0.99,
            uncertainty=UncertaintyInfo(
                needs_human_review=True,
                reasons=["Deterministic emergency red-flag triggered in patient intake."],
            ),
            safety_flags=["emergency_red_flag_triggered"],
            evidence=[
                EvidenceItem(
                    source="patient_intake",
                    field="chief_complaint",
                    summary=str(case.chief_complaint or "Emergency symptoms reported"),
                )
            ],
            recommended_next_action="immediate_er_escalation",
            generated_at=datetime.now().isoformat(),
            status="awaiting_review",
        )
    return None


async def run_ai_pre_triage(
    intake_id: str,
    patient_id: str,
    case: PatientCase,
) -> PreTriageAssessment:
    """Run full AI pre-triage assessment on patient case."""
    # 1. Check deterministic P0 first
    deterministic = evaluate_deterministic_triage(case)
    if deterministic:
        deterministic.intake_id = intake_id
        deterministic.patient_id = patient_id
        return deterministic

    # 2. Build payload for LLM assessment
    case_summary = {
        "chief_complaint": case.chief_complaint,
        "category": case.category,
        "duration": case.duration,
        "severity": case.severity,
        "symptoms": case.symptoms,
        "negative_symptoms": case.negative_symptoms,
        "history": case.relevant_history,
        "medications": case.current_medications,
        "allergies": case.allergies,
        "patient_concerns": case.patient_concerns,
    }

    try:
        completion = _client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": TRIAGE_PROMPT},
                {"role": "user", "content": f"Assess this patient intake payload:\n{json.dumps(case_summary, indent=2)}"},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=1024,
        )
        raw = completion.choices[0].message.content or "{}"
        data = json.loads(raw)

        return PreTriageAssessment(
            assessment_id=f"triage_{uuid.uuid4().hex[:12]}",
            intake_id=intake_id,
            patient_id=patient_id,
            priority=data.get("priority", "P2"),
            confidence_band=data.get("confidence_band", "medium"),
            confidence_score=float(data.get("confidence_score", 0.8)),
            uncertainty=UncertaintyInfo(**data.get("uncertainty", {"needs_human_review": True})),
            safety_flags=data.get("safety_flags", []),
            evidence=[EvidenceItem(**e) for e in data.get("evidence", [])],
            recommended_next_action=data.get("recommended_next_action", "human_review"),
            generated_at=datetime.now().isoformat(),
            status="awaiting_review",
        )
    except Exception as e:
        log.error(f"AI Pre-triage LLM call failed (using safe heuristic fallback): {e}")
        # Safe fallback based on severity
        priority = "P1" if (case.severity and case.severity >= 8) else "P2"
        return PreTriageAssessment(
            assessment_id=f"triage_{uuid.uuid4().hex[:12]}",
            intake_id=intake_id,
            patient_id=patient_id,
            priority=priority,
            confidence_band="low",
            confidence_score=0.5,
            uncertainty=UncertaintyInfo(
                needs_human_review=True,
                reasons=["AI model unavailable; heuristic triage assigned. Human review required."],
            ),
            safety_flags=[],
            evidence=[
                EvidenceItem(
                    source="patient_intake",
                    field="chief_complaint",
                    summary=str(case.chief_complaint or "Complaint reported"),
                )
            ],
            recommended_next_action="human_review",
            generated_at=datetime.now().isoformat(),
            status="awaiting_review",
        )
