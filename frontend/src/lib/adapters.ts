import type { CaseFixture } from "@/lib/fixtures";
import type { QueueItem, PendingTriageItem, PreTriageAssessment } from "@/lib/api";
import type { PriorityBand, IntakeStatus, QueueStatus, AIPretriageResponse } from "@/types";

/**
 * Converts a backend PreTriageAssessment into the frontend AIPretriageResponse format.
 */
export function adaptPreTriageToAIResponse(
  assessment?: PreTriageAssessment,
  fallbackPriority: PriorityBand = "P2",
  sessionId: string = "unknown",
): AIPretriageResponse {
  if (!assessment) {
    return {
      assessment_id: `ass_${sessionId}`,
      intake_id: sessionId,
      priority: fallbackPriority,
      confidence_band: "medium",
      confidence_score: 0.85,
      uncertainty: {
        needs_human_review: false,
        reasons: [],
        missing_information: [],
        contradictions: [],
      },
      safety_flags: [],
      evidence: [],
      recommended_next_action: "Standard clinician consultation",
      model: {
        name: "medikiosk-pretriage-v1",
        version: "0.2.0",
        prompt_version: "2026-09",
      },
      generated_at: new Date().toISOString(),
    };
  }

  return {
    assessment_id: assessment.assessment_id,
    intake_id: assessment.intake_id,
    priority: assessment.priority,
    confidence_band: assessment.confidence_band || "medium",
    confidence_score: assessment.confidence_score ?? 0.88,
    uncertainty: {
      needs_human_review: assessment.uncertainty?.needs_human_review ?? false,
      reasons: assessment.uncertainty?.reasons || [],
      missing_information: assessment.uncertainty?.missing_information || [],
      contradictions: assessment.uncertainty?.contradictions || [],
    },
    safety_flags: assessment.safety_flags || [],
    evidence: (assessment.evidence || []).map((e) => ({
      source: e.source || "patient_intake",
      field: e.field || "symptoms",
      summary: e.summary || "",
    })),
    recommended_next_action: assessment.recommended_next_action || "Standard consultation",
    model: {
      name: "medikiosk-pretriage-v1",
      version: "0.2.0",
      prompt_version: "2026-09",
    },
    generated_at: assessment.generated_at || new Date().toISOString(),
  };
}

/**
 * Adapts a live backend QueueItem into a CaseFixture suitable for Doctor Workspace views.
 */
export function adaptQueueItemToFixture(item: QueueItem): CaseFixture {
  const c = item.case || {};
  const priority = item.priority as PriorityBand;
  const status: IntakeStatus = item.status === "completed" ? "completed" : "approved";
  const queueStatus: QueueStatus = item.status as QueueStatus;

  const symptoms: string[] = Array.isArray(c.symptoms)
    ? c.symptoms
    : item.chief_complaint
    ? [item.chief_complaint]
    : ["General clinical symptoms"];

  const history: string[] = Array.isArray(c.relevant_history)
    ? c.relevant_history
    : Array.isArray(c.history)
    ? c.history
    : ["No critical medical history recorded"];

  const medications: string[] = Array.isArray(c.current_medications)
    ? c.current_medications
    : Array.isArray(c.medications)
    ? c.medications
    : ["None reported"];

  return {
    caseId: item.session_id.startsWith("demo-") ? item.session_id : `MK-${item.token_number}`,
    priority,
    status,
    queueStatus,
    patientRef: item.patient_id,
    patientName: item.patient_name || (c.patient_name as string) || "Walk-in Patient",
    patientAge: item.age ?? (typeof c.age === "number" ? c.age : 42),
    patientGender: item.gender === "F" ? "F" : "M",
    phone: (c.phone as string) || "+91 98000 00000",
    abha: (c.abha as string) || `ABHA-${item.session_id.slice(0, 8)}`,
    chiefComplaint: item.chief_complaint || (c.chief_complaint as string) || "Unspecified acute complaint",
    symptoms,
    duration: (c.duration as string) || "1 day",
    history,
    medications,
    intakeSubmittedAt: item.arrival_time || new Date().toISOString(),
    department: item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "General OPD",
    doctor: "Attending Physician",
    token: String(item.token_number),
    estimatedWait: priority === "P1" ? "< 15 min" : priority === "P2" ? "~30 min" : "Fast Track",
    patientsAhead: Math.max(0, item.token_number - 100),
    ai: adaptPreTriageToAIResponse(item.assessment, priority, item.session_id),
    timeline: [
      { label: "Intake Submitted", time: item.arrival_time ? new Date(item.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now", variant: "success" },
      { label: "AI Pre-Triage Completed", detail: `Assessed as ${priority}`, variant: "success" },
      { label: "Queue Allocated", time: item.approved_at ? new Date(item.approved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined, detail: `Token #${item.token_number}`, variant: "success" },
    ],
  };
}

/**
 * Adapts a live backend PendingTriageItem into a CaseFixture for Super Admin reviews.
 */
export function adaptPendingTriageToFixture(item: PendingTriageItem): CaseFixture {
  const c = item.case || {};
  const priority = (item.assessment?.priority || "P2") as PriorityBand;
  const status: IntakeStatus = (item.status as IntakeStatus) || "awaiting_review";

  const symptoms: string[] = Array.isArray(c.symptoms)
    ? c.symptoms
    : c.chief_complaint
    ? [String(c.chief_complaint)]
    : ["Reported symptoms awaiting review"];

  const history: string[] = Array.isArray(c.relevant_history)
    ? c.relevant_history
    : Array.isArray(c.history)
    ? c.history
    : ["No significant prior history"];

  const medications: string[] = Array.isArray(c.current_medications)
    ? c.current_medications
    : Array.isArray(c.medications)
    ? c.medications
    : ["None"];

  return {
    caseId: item.session_id.startsWith("demo-") ? item.session_id : `REV-${item.session_id.slice(0, 6)}`,
    priority,
    status,
    patientRef: item.patient_id,
    patientName: (c.patient_name as string) || "Patient " + item.session_id.slice(0, 4),
    patientAge: typeof c.age === "number" ? c.age : 45,
    patientGender: c.gender === "F" ? "F" : "M",
    phone: (c.phone as string) || "+91 98000 00000",
    abha: (c.abha as string) || `ABHA-${item.session_id.slice(0, 6)}`,
    chiefComplaint: (c.chief_complaint as string) || "Pending clinical review",
    symptoms,
    duration: (c.duration as string) || "Recent onset",
    history,
    medications,
    intakeSubmittedAt: item.submitted_at || new Date().toISOString(),
    department: (c.category as string) ? String(c.category).toUpperCase() : "Triage Gate",
    doctor: "Unassigned — Pending Approval",
    ai: adaptPreTriageToAIResponse(item.assessment, priority, item.session_id),
    timeline: [
      { label: "Intake Submitted", time: item.submitted_at ? new Date(item.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now", variant: "success" },
      { label: "AI Pre-Triage Recommendation", detail: `Recommended ${priority}`, variant: priority === "P0" ? "danger" : "warning" },
      { label: "Awaiting Admin Review", detail: "Approval/override required for queue admission", variant: "warning" },
    ],
  };
}
