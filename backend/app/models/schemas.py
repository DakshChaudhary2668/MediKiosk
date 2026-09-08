"""MediKiosk MVP — Frozen Data Contracts & Schemas (Phase 0).

Source of truth:
- docs/01-mvp-workflow.md
- docs/04-ai-pre-triage.md
- docs/05-queue-and-approval.md
- docs/08-integration-contracts.md
- docs/09-data-model.md
- docs/13-old-to-new-for-harry.md

All boundaries strictly maintain:
1. AI Engine is advisory only. Zero queue, database, or prescription mutations.
2. P0 bypasses standard queue for immediate emergency escalation.
3. FastAPI owns authoritative state transitions and audit records.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


# =============================================================================
# ENUMS & CONSTANTS
# =============================================================================


class PriorityBand(str, Enum):
    """Operational priority bands.

    Clinical definitions and SLAs are TBD.
    """

    P0 = "P0"  # Immediate danger / emergency signal. Bypasses standard queue.
    P1 = "P1"  # Very urgent; expedited same-session review.
    P2 = "P2"  # Urgent; standard priority queue.
    P3 = "P3"  # Routine / lower-urgency queue.


class ConfidenceBand(str, Enum):
    """AI confidence in the operational priority band."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class IntakeStatus(str, Enum):
    """Macro lifecycle of a patient visit/intake."""

    INTAKE_SUBMITTED = "intake_submitted"
    ASSESSMENT_PENDING = "assessment_pending"
    ASSESSMENT_READY = "assessment_ready"
    AWAITING_REVIEW = "awaiting_review"
    P0_ESCALATED = "p0_escalated"
    NEEDS_CLARIFICATION = "needs_clarification"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ASSESSMENT_FAILED = "assessment_failed"


class QueueStatus(str, Enum):
    """Operational turn state in the doctor queue."""

    QUEUED = "queued"
    CALLED = "called"
    IN_CONSULTATION = "in_consultation"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class ReviewDecisionType(str, Enum):
    """Super Admin decision action."""

    APPROVE = "APPROVE"
    OVERRIDE = "OVERRIDE"
    REQUEST_CLARIFICATION = "REQUEST_CLARIFICATION"
    REJECT = "REJECT"


# =============================================================================
# AI ENGINE CONTRACTS (pretriage.v1)
# =============================================================================


class EvidenceItem(BaseModel):
    """Specific observation supporting an AI pre-triage recommendation."""

    model_config = ConfigDict(extra="forbid")

    source: str = Field(..., description="Origin of evidence, e.g. 'patient_intake'")
    field: str = Field(..., description="Field identifier, e.g. 'chief_complaint'")
    summary: str = Field(..., description="Short supporting observation")


class ModelMetadata(BaseModel):
    """Metadata regarding the inference model used."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., description="Model identifier")
    version: str = Field(..., description="Model version")
    prompt_version: str = Field(..., description="Prompt template version")


class UncertaintyDetails(BaseModel):
    """Explicit uncertainty signals emitted by the AI Engine."""

    model_config = ConfigDict(extra="forbid")

    needs_human_review: bool = Field(
        ..., description="True if model cannot safely triage"
    )
    reasons: list[str] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    contradictions: list[str] = Field(default_factory=list)


class AIPretriageRequest(BaseModel):
    """FastAPI -> Harry AI Engine request contract (pretriage.v1)."""

    model_config = ConfigDict(extra="forbid")

    contract_version: str = Field(
        default="pretriage.v1", description="Contract version identifier"
    )
    request_id: str = Field(..., description="Backend correlation identifier")
    intake_id: str = Field(..., description="Intake identifier")
    patient_reference: str = Field(
        ..., description="Internal pseudonymized reference"
    )
    locale: Optional[str] = Field(
        default=None, description="TBD: Language/locale code"
    )
    current_intake: dict[str, Any] = Field(
        ..., description="Structured answers and optional transcript"
    )
    allowed_context: list[dict[str, Any]] = Field(
        default_factory=list, description="TBD: Historical records allow-list"
    )


class AIPretriageResponse(BaseModel):
    """Harry AI Engine -> FastAPI response contract (pretriage.v1).

    Advisory only. Zero direct state mutation permissions.
    """

    model_config = ConfigDict(extra="forbid")

    assessment_id: str = Field(..., description="Assessment identifier")
    intake_id: str = Field(..., description="Correlating intake identifier")
    priority: Optional[PriorityBand] = Field(
        default=None,
        description="P0-P3 recommendation, or null if uncertainty prevents assignment",
    )
    confidence_band: ConfidenceBand = Field(
        ..., description="Categorical confidence band"
    )
    confidence_score: Optional[float] = Field(
        default=None,
        description="TBD: Uncalibrated advisory score (0.0 to 1.0)",
    )
    uncertainty: UncertaintyDetails = Field(...)
    safety_flags: list[str] = Field(
        default_factory=list, description="Red flag indicators (e.g. chest_pain)"
    )
    evidence: list[EvidenceItem] = Field(default_factory=list)
    recommended_next_action: str = Field(
        default="human_review", description="Next operational recommendation"
    )
    model: ModelMetadata = Field(...)
    generated_at: datetime = Field(..., description="Inference timestamp")


# =============================================================================
# PATIENT INTAKE CONTRACTS
# =============================================================================


class IntakeCreateRequest(BaseModel):
    """Patient starts intake workflow."""

    patient_ref: str = Field(
        ..., description="Patient internal reference / auth identifier"
    )
    locale: Optional[str] = Field(
        default="en-US", description="Language preference"
    )


class IntakeCreateResponse(BaseModel):
    """Acknowledgement of created intake session."""

    intake_id: str
    status: IntakeStatus = IntakeStatus.INTAKE_SUBMITTED
    created_at: datetime


class IntakeSubmitRequest(BaseModel):
    """Patient submits completed survey answers."""

    intake_id: str
    survey_answers: dict[str, Any] = Field(
        ..., description="Structured questionnaire key-values"
    )
    transcript: Optional[str] = Field(
        default=None, description="TBD: Audio transcript if enabled"
    )


class IntakeSubmitResponse(BaseModel):
    """Acknowledgement of submitted intake."""

    intake_id: str
    status: IntakeStatus
    submitted_at: datetime


# =============================================================================
# SUPER ADMIN REVIEW CONTRACTS
# =============================================================================


class ReviewPendingItem(BaseModel):
    """Intake summary in Super Admin review queue."""

    intake_id: str
    patient_ref: str
    submitted_at: datetime
    ai_priority: Optional[PriorityBand]
    confidence_band: Optional[ConfidenceBand]
    needs_human_review: bool
    safety_flags: list[str]
    status: IntakeStatus


class ReviewDetailResponse(BaseModel):
    """Complete bundle presented to Super Admin reviewer."""

    intake_id: str
    patient_ref: str
    survey_answers: dict[str, Any]
    transcript: Optional[str]
    submitted_at: datetime
    ai_assessment: Optional[AIPretriageResponse]
    prior_decisions: list[dict[str, Any]] = Field(default_factory=list)


class ReviewDecisionRequest(BaseModel):
    """Super Admin review action payload."""

    decision: ReviewDecisionType
    final_priority: PriorityBand = Field(
        ..., description="Required final priority assigned by human"
    )
    reviewer_id: str = Field(..., description="Authenticated reviewer ID")
    reason: str = Field(
        ..., description="Mandatory rationale for review/override"
    )


class ReviewDecisionResponse(BaseModel):
    """Result of Super Admin review."""

    decision_id: str
    intake_id: str
    status: IntakeStatus
    assigned_priority: PriorityBand
    queue_id: Optional[str] = Field(
        default=None, description="Queue entry ID if approved into queue"
    )
    decided_at: datetime


# =============================================================================
# DOCTOR DASHBOARD & CONSULTATION CONTRACTS
# =============================================================================


class QueueEntryResponse(BaseModel):
    """Doctor-facing approved queue turn."""

    queue_id: str
    intake_id: str
    patient_ref: str
    priority_band: PriorityBand  # P1, P2, or P3 only. P0 does not enter routine queue.
    queue_status: QueueStatus
    turn_number: int
    ordering_timestamp: datetime
    ai_disclaimer: str = "AI Pre-Triage advisory recommendation"
    safety_flags: list[str] = Field(default_factory=list)
    evidence_summary: list[EvidenceItem] = Field(default_factory=list)


class TurnAdvanceRequest(BaseModel):
    """Doctor updates turn state."""

    doctor_id: str
    action: str = Field(
        ..., description="'call' | 'start_consultation' | 'skip'"
    )


class ConsultationCompleteRequest(BaseModel):
    """Doctor submits consultation outcome and final notes."""

    doctor_id: str
    clinical_notes: str = Field(..., description="Doctor-authored observations")
    diagnosis_summary: Optional[str] = Field(
        default=None, description="Doctor final diagnosis"
    )
    treatment_plan: Optional[str] = Field(
        default=None, description="Doctor prescribed instructions"
    )
    document_ids: list[str] = Field(
        default_factory=list, description="Prescription / attachment storage IDs"
    )


class ConsultationResponse(BaseModel):
    """Acknowledgement of finalized consultation."""

    consultation_id: str
    intake_id: str
    status: QueueStatus = QueueStatus.COMPLETED
    completed_at: datetime


# =============================================================================
# PATIENT-VISIBLE PROJECTIONS
# =============================================================================


class PatientStatusResponse(BaseModel):
    """Sanitized queue/visit status for patient view.

    Internal AI confidence, model metadata, and admin notes are scrubbed.
    """

    intake_id: str
    status: IntakeStatus
    turn_position: Optional[int] = Field(
        default=None, description="Position in queue if queued"
    )
    status_label: str = Field(
        ...,
        description="Patient-friendly status message (e.g. 'In Review', 'Waiting for Doctor')",
    )
    submitted_at: datetime
    disclaimer: str = (
        "Queue priority is an operational estimate and not a guarantee of clinical timing."
    )


class PatientHistoryItem(BaseModel):
    """Past consultation summary permitted for patient view."""

    consultation_id: str
    completed_at: datetime
    diagnosis_summary: Optional[str]
    treatment_plan: Optional[str]
