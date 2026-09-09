/**
 * MediKiosk MVP — Frozen TypeScript Contracts & Types (Phase 0).
 *
 * Source of truth:
 * - docs/01-mvp-workflow.md
 * - docs/04-ai-pre-triage.md
 * - docs/05-queue-and-approval.md
 * - docs/08-integration-contracts.md
 * - docs/09-data-model.md
 * - docs/13-old-to-new-for-harry.md
 *
 * Mirrors backend/app/models/schemas.py exactly.
 */

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export type PriorityBand = "P0" | "P1" | "P2" | "P3";

export type ConfidenceBand = "low" | "medium" | "high";

export type IntakeStatus =
  | "intake_submitted"
  | "assessment_pending"
  | "assessment_ready"
  | "awaiting_review"
  | "p0_escalated"
  | "needs_clarification"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled"
  | "assessment_failed";

export type QueueStatus =
  | "queued"
  | "called"
  | "in_consultation"
  | "completed"
  | "skipped";

export type ReviewDecisionType =
  | "APPROVE"
  | "OVERRIDE"
  | "REQUEST_CLARIFICATION"
  | "REJECT";

// =============================================================================
// AI ENGINE CONTRACTS (pretriage.v1)
// =============================================================================

export interface EvidenceItem {
  source: string;
  field: string;
  summary: string;
}

export interface ModelMetadata {
  name: string;
  version: string;
  prompt_version: string;
}

export interface UncertaintyDetails {
  needs_human_review: boolean;
  reasons: string[];
  missing_information: string[];
  contradictions: string[];
}

export interface AIPretriageRequest {
  contract_version: "pretriage.v1";
  request_id: string;
  intake_id: string;
  patient_reference: string;
  locale?: string | null;
  current_intake: {
    structured_answers: Record<string, unknown>;
    transcript?: string | null;
  };
  allowed_context: Array<Record<string, unknown>>;
}

export interface AIPretriageResponse {
  assessment_id: string;
  intake_id: string;
  priority: PriorityBand | null;
  confidence_band: ConfidenceBand;
  confidence_score?: number | null;
  uncertainty: UncertaintyDetails;
  safety_flags: string[];
  evidence: EvidenceItem[];
  recommended_next_action: string;
  model: ModelMetadata;
  generated_at: string;
}

// =============================================================================
// PATIENT INTAKE CONTRACTS
// =============================================================================

export interface IntakeCreateRequest {
  patient_ref: string;
  locale?: string | null;
}

export interface IntakeCreateResponse {
  intake_id: string;
  status: IntakeStatus;
  created_at: string;
}

export interface IntakeSubmitRequest {
  intake_id: string;
  survey_answers: Record<string, unknown>;
  transcript?: string | null;
}

export interface IntakeSubmitResponse {
  intake_id: string;
  status: IntakeStatus;
  submitted_at: string;
}

// =============================================================================
// SUPER ADMIN REVIEW CONTRACTS
// =============================================================================

export interface ReviewPendingItem {
  intake_id: string;
  patient_ref: string;
  submitted_at: string;
  ai_priority: PriorityBand | null;
  confidence_band: ConfidenceBand | null;
  needs_human_review: boolean;
  safety_flags: string[];
  status: IntakeStatus;
}

export interface ReviewDetailResponse {
  intake_id: string;
  patient_ref: string;
  survey_answers: Record<string, unknown>;
  transcript?: string | null;
  submitted_at: string;
  ai_assessment: AIPretriageResponse | null;
  prior_decisions: Array<Record<string, unknown>>;
}

export interface ReviewDecisionRequest {
  decision: ReviewDecisionType;
  final_priority: PriorityBand;
  reviewer_id: string;
  reason: string;
}

export interface ReviewDecisionResponse {
  decision_id: string;
  intake_id: string;
  status: IntakeStatus;
  assigned_priority: PriorityBand;
  queue_id?: string | null;
  decided_at: string;
}

// =============================================================================
// DOCTOR DASHBOARD & CONSULTATION CONTRACTS
// =============================================================================

export interface QueueEntryResponse {
  queue_id: string;
  intake_id: string;
  patient_ref: string;
  priority_band: "P1" | "P2" | "P3";
  queue_status: QueueStatus;
  turn_number: number;
  ordering_timestamp: string;
  ai_disclaimer: string;
  safety_flags: string[];
  evidence_summary: EvidenceItem[];
}

export interface TurnAdvanceRequest {
  doctor_id: string;
  action: "call" | "start_consultation" | "skip";
}

export interface ConsultationCompleteRequest {
  doctor_id: string;
  clinical_notes: string;
  diagnosis_summary?: string | null;
  treatment_plan?: string | null;
  document_ids: string[];
}

export interface ConsultationResponse {
  consultation_id: string;
  intake_id: string;
  status: QueueStatus;
  completed_at: string;
}

// =============================================================================
// PATIENT-VISIBLE PROJECTIONS
// =============================================================================

export interface PatientStatusResponse {
  intake_id: string;
  status: IntakeStatus;
  turn_position?: number | null;
  status_label: string;
  submitted_at: string;
  disclaimer: string;
}

export interface PatientHistoryItem {
  consultation_id: string;
  completed_at: string;
  diagnosis_summary?: string | null;
  treatment_plan?: string | null;
}
