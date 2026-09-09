"""All Pydantic models in one file. No model-per-file sprawl."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# --- Auth ---

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str | None = None


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
    priority: str = "P2"  # P0 | P1 | P2 | P3
    confidence_band: str = "medium"  # high | medium | low
    confidence_score: float = 0.8
    uncertainty: UncertaintyInfo = Field(default_factory=UncertaintyInfo)
    safety_flags: list[str] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    recommended_next_action: str = "human_review"
    generated_at: str = ""
    status: str = "awaiting_review"  # awaiting_review | approved | overridden | escalated | rejected


class TriageApprovalRequest(BaseModel):
    action: str = "approve"  # approve | override | escalate | reject
    priority: str = "P2"     # final approved band
    override_reason: str | None = None
    notes: str | None = None


# --- Doctor Queue & Consultation ---

class QueueItem(BaseModel):
    token_number: int
    session_id: str
    patient_id: str
    patient_name: str
    age: int | None = None
    gender: str | None = None
    priority: str = "P2"
    status: str = "queued"  # queued | called | in_consultation | completed
    chief_complaint: str | None = None
    category: str | None = None
    arrival_time: str = ""
    approved_at: str = ""


class PrescriptionItem(BaseModel):
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: str | None = None


class ConsultationRequest(BaseModel):
    session_id: str
    diagnosis: str
    clinical_notes: str
    prescriptions: list[PrescriptionItem] = Field(default_factory=list)
    follow_up_days: int | None = None
    general_advice: str | None = None


class ConsultationRecord(BaseModel):
    consultation_id: str
    session_id: str
    patient_id: str
    doctor_id: str
    doctor_name: str = "Dr. On Duty"
    diagnosis: str
    clinical_notes: str
    prescriptions: list[PrescriptionItem] = Field(default_factory=list)
    follow_up_days: int | None = None
    general_advice: str | None = None
    created_at: str = ""
