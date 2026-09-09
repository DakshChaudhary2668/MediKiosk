"""All Pydantic models in one file. No model-per-file sprawl."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, model_validator


# --- Auth & User Context ---

class AuthUser(BaseModel):
    user_id: str
    email: str | None = None
    role: str = "patient"  # "patient" | "doctor" | "admin"


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str | None = None
    role: str | None = "patient"


class LoginRequest(BaseModel):
    email: str
    password: str


# --- Patient ---

class PatientProfileUpdate(BaseModel):
    full_name: str | None = None
    age: int | None = None
    gender: str | None = None
    blood_group: str | None = None
    phone: str | None = None
    emergency_contact: str | None = None


class ConsentRequest(BaseModel):
    consent_given: bool


# --- Intake conversation ---

class StartSessionRequest(BaseModel):
    category: str | None = None  # optional pre-selected category
    language: str = "en"


class IntakeMessageRequest(BaseModel):
    session_id: str
    message: str
    input_mode: str = "text"  # "text" or "voice"


class IntakeSubmitRequest(BaseModel):
    """Batch intake submission for Phase 0 frozen contract."""
    intake_id: str | None = None
    patient_ref: str | None = None
    survey_answers: dict[str, Any] = Field(default_factory=dict)
    transcript: str | None = None
    category: str | None = None
    language: str = "en"


class IntakeSubmitResponse(BaseModel):
    intake_id: str
    status: str
    submitted_at: str


class IntakeResponse(BaseModel):
    """Structured output from AI engine per turn."""
    ai_message: str
    category: str | None = None
    extracted_facts: dict[str, Any] = Field(default_factory=dict)
    answered_fields: list[str] = Field(default_factory=list)
    missing_fields: list[str] = Field(default_factory=list)
    next_question_id: str | None = None
    red_flag: bool = False
    survey_complete: bool = False


class ConversationState(BaseModel):
    session_id: str
    patient_id: str
    conversation_status: str = "not_started"
    language: str = "en"
    input_mode: str = "text"
    current_stage: str = "greeting"
    category: str | None = None
    completed_fields: list[str] = Field(default_factory=list)
    pending_fields: list[str] = Field(default_factory=list)
    skipped_fields: list[str] = Field(default_factory=list)
    declined_fields: list[str] = Field(default_factory=list)
    answers: dict[str, Any] = Field(default_factory=dict)
    turn_count: int = 0
    red_flag_detected: bool = False
    red_flag_signals: list[str] = Field(default_factory=list)


# --- Patient case (final structured output) ---

class PatientCase(BaseModel):
    session_id: str | None = None
    patient_id: str | None = None
    chief_complaint: str | None = None
    category: str | None = None
    duration: str | None = None
    severity: int | None = None
    symptoms: list[str] = Field(default_factory=list)
    negative_symptoms: list[str] = Field(default_factory=list)
    relevant_history: list[str] = Field(default_factory=list)
    current_medications: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    patient_concerns: str | None = None
    red_flag_detected: bool = False
    red_flag_details: dict[str, Any] | None = None
    completion_status: str = "incomplete"
    # No diagnosis field — by design


# --- Safety ---

class RedFlagResult(BaseModel):
    red_flag: bool = False
    signal_ids: list[str] = Field(default_factory=list)
    message: str = ""


# --- STT/TTS ---

class STTResponse(BaseModel):
    transcript: str
    language: str = "unknown"
    confidence: float | None = None


# --- AI Pre-Triage (P0 - P3 Operational Bands) ---

class EvidenceItem(BaseModel):
    source: str = "patient_intake"
    field: str
    summary: str


class UncertaintyInfo(BaseModel):
    needs_human_review: bool = True
    reasons: list[str] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    contradictions: list[str] = Field(default_factory=list)


class PreTriageAssessment(BaseModel):
    assessment_id: str
    intake_id: str
    patient_id: str
    priority: str | None = "P2"  # P0 | P1 | P2 | P3 | None (if failed)
    confidence_band: str = "medium"  # high | medium | low
    confidence_score: float = 0.8
    uncertainty: UncertaintyInfo = Field(default_factory=UncertaintyInfo)
    safety_flags: list[str] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    recommended_next_action: str = "human_review"
    model: dict[str, Any] | None = None
    generated_at: str = ""
    status: str = "awaiting_review"  # awaiting_review | p0_escalated | approved | overridden | escalated | rejected | assessment_failed


class TriageApprovalRequest(BaseModel):
    action: str = "approve"  # approve | override | escalate | reject | acknowledge | coordinate
    priority: str = "P2"     # final approved band
    override_reason: str | None = None
    notes: str | None = None


class ReviewDecideRequest(BaseModel):
    """Decide request for /api/v1/review/{intake_id}/decide contract."""
    decision: str = "APPROVE"  # APPROVE | OVERRIDE | REQUEST_CLARIFICATION | REJECT | ESCALATE
    final_priority: str = "P2"
    reviewer_id: str | None = None
    reason: str | None = None
    notes: str | None = None


# --- Doctor Queue & Consultation ---

class PrescriptionItem(BaseModel):
    medication_name: str = ""
    medicine_name: str | None = None
    dosage: str = ""
    frequency: str = ""
    duration: str = ""
    duration_days: int | None = None
    instructions: str | None = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            name = data.get("medication_name") or data.get("medicine_name") or ""
            data["medication_name"] = name
            data["medicine_name"] = name

            dur = data.get("duration")
            days = data.get("duration_days")
            if dur and days is None:
                # Try to extract integer days if present
                try:
                    import re
                    m = re.search(r"\d+", str(dur))
                    if m:
                        data["duration_days"] = int(m.group(0))
                except Exception:
                    pass
            elif days is not None and not dur:
                data["duration"] = f"{days} days"
                data["duration_days"] = days
        return data


class QueueItem(BaseModel):
    token_number: int
    turn_number: int | None = None
    session_id: str
    intake_id: str | None = None
    patient_id: str
    patient_ref: str | None = None
    patient_name: str
    age: int | None = None
    gender: str | None = None
    priority: str = "P2"
    priority_band: str | None = None
    status: str = "queued"  # queued | called | in_consultation | completed | skipped
    queue_status: str | None = None
    chief_complaint: str | None = None
    category: str | None = None
    arrival_time: str = ""
    ordering_timestamp: str | None = None
    approved_at: str = ""
    ai_disclaimer: str = "AI Pre-Triage advisory recommendation"
    safety_flags: list[str] = Field(default_factory=list)
    evidence_summary: list[EvidenceItem] = Field(default_factory=list)
    case: dict[str, Any] | None = None
    assessment: dict[str, Any] | None = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_queue_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            token = data.get("token_number") or data.get("turn_number", 0)
            data["token_number"] = token
            data["turn_number"] = token
            sess = data.get("session_id") or data.get("intake_id", "")
            data["session_id"] = sess
            data["intake_id"] = sess
            pid = data.get("patient_id") or data.get("patient_ref", "")
            data["patient_id"] = pid
            data["patient_ref"] = pid
            prio = data.get("priority") or data.get("priority_band", "P2")
            data["priority"] = prio
            data["priority_band"] = prio
            st = data.get("status") or data.get("queue_status", "queued")
            data["status"] = st
            data["queue_status"] = st
            arr = data.get("arrival_time") or data.get("ordering_timestamp", "")
            data["arrival_time"] = arr
            data["ordering_timestamp"] = arr
        return data


class ConsultationRequest(BaseModel):
    session_id: str | None = None
    diagnosis: str
    clinical_notes: str
    prescriptions: list[PrescriptionItem] = Field(default_factory=list)
    follow_up_days: int | None = None
    general_advice: str | None = None
    follow_up_advice: str | None = None
    referral_specialty: str | None = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_advice(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("general_advice") and data.get("follow_up_advice"):
                data["general_advice"] = data["follow_up_advice"]
            elif not data.get("follow_up_advice") and data.get("general_advice"):
                data["follow_up_advice"] = data["general_advice"]
        return data


class ConsultationRecord(BaseModel):
    consultation_id: str
    session_id: str
    patient_id: str
    doctor_id: str
    doctor_name: str = "Dr. On Duty"
    token_number: int | None = None
    diagnosis: str
    clinical_notes: str
    prescriptions: list[PrescriptionItem] = Field(default_factory=list)
    follow_up_days: int | None = None
    general_advice: str | None = None
    follow_up_advice: str | None = None
    referral_specialty: str | None = None
    created_at: str = ""

