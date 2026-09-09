/**
 * Canonical fixture data — one case per priority band.
 * Shared across Patient, Doctor, and Admin views.
 */
import type {
  PriorityBand,
  IntakeStatus,
  QueueStatus,
  AIPretriageResponse,
} from "@/types";

export interface CaseFixture {
  caseId: string;
  priority: PriorityBand;
  status: IntakeStatus;
  queueStatus?: QueueStatus;
  patientRef: string;
  patientName: string;
  patientAge: number;
  patientGender: "M" | "F";
  phone: string;
  abha: string;
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  history: string[];
  medications: string[];
  intakeSubmittedAt: string;
  department: string;
  doctor: string;
  token?: string;
  estimatedWait?: string;
  patientsAhead?: number;
  ai: AIPretriageResponse;
  timeline: Array<{ label: string; time?: string; detail?: string; variant?: "success" | "danger" | "warning" | "muted" }>;
  evidence?: Array<{ field?: string; summary?: string; source?: string }>;
  transcript?: string[];
  turnId?: string;
}

export const CASES: Record<PriorityBand, CaseFixture> = {
  P0: {
    caseId: "MK-0092",
    priority: "P0",
    status: "p0_escalated",
    patientRef: "PAT-0092",
    patientName: "Anjali Bose",
    patientAge: 58,
    patientGender: "F",
    phone: "+91 98700 00092",
    abha: "ABHA-0092-XXXX",
    chiefComplaint: "Severe chest pain, difficulty breathing",
    symptoms: ["Severe chest pain", "Difficulty breathing", "Diaphoresis", "Radiating arm pain"],
    duration: "30 minutes",
    history: ["Hypertension — on medication", "Type 2 diabetes"],
    medications: ["Amlodipine 5mg", "Metformin 500mg"],
    intakeSubmittedAt: "2024-10-14T09:10:02+05:30",
    department: "Emergency",
    doctor: "Dr. Emergency Team",
    ai: {
      assessment_id: "ASS-P0-001",
      intake_id: "INT-0092",
      priority: "P0",
      confidence_band: "high",
      confidence_score: 0.97,
      uncertainty: { needs_human_review: false, reasons: [], missing_information: [], contradictions: [] },
      safety_flags: ["Critical cardiac indicators detected", "Immediate intervention required"],
      evidence: [
        { source: "patient_intake", field: "symptoms", summary: "Severe chest pain with radiation, diaphoresis" },
        { source: "patient_intake", field: "history", summary: "Hypertension, diabetes — high cardiac risk" },
      ],
      recommended_next_action: "Immediate emergency intervention",
      model: { name: "pretriage-v1", version: "1.2.0", prompt_version: "p1.3" },
      generated_at: "2024-10-14T09:10:03+05:30",
    },
    transcript: [
      "Mujhe achanak se seene mein bohot tez dard ho raha hai aur saans lene mein takleef ho rahi hai. Dard mere baye haath tak ja raha hai aur pasina aa raha hai.",
      "Chest discomfort started 30 mins ago. Pressure sensation with radiation to left shoulder and arm. Diaphoresis present."
    ],
    timeline: [
      { label: "Emergency detected by AI triage", time: "09:10:02", variant: "danger" },
      { label: "Automatic emergency alerts fired", time: "09:10:02", detail: "Emergency team, Admin, clinical staff notified", variant: "danger" },
      { label: "Patient emergency state active", time: "09:10:03", detail: "Patient kiosk shows emergency instructions" },
      { label: "Emergency team dispatched", time: "09:10:45", detail: "ETA: 2–5 minutes" },
      { label: "Admin acknowledged", time: "09:12:11", variant: "success" },
      { label: "Emergency team handover", variant: "muted" },
      { label: "Resolution", variant: "muted" },
    ],
  },

  P1: {
    caseId: "MK-2051",
    priority: "P1",
    status: "awaiting_review",
    queueStatus: "called",
    patientRef: "PAT-2051",
    patientName: "Priya Sharma",
    patientAge: 34,
    patientGender: "F",
    phone: "+91 98765 12345",
    abha: "ABHA-2051-XXXX",
    chiefComplaint: "Severe headache, nausea, photophobia",
    symptoms: ["Severe headache", "Nausea", "Photophobia", "Neck stiffness"],
    duration: "1 day",
    history: ["No chronic conditions", "Migraine history"],
    medications: [],
    intakeSubmittedAt: "2024-10-14T08:13:00+05:30",
    department: "General Medicine",
    doctor: "Dr. R. Vance",
    estimatedWait: "~30 minutes",
    ai: {
      assessment_id: "ASS-P1-001",
      intake_id: "INT-2051",
      priority: "P1",
      confidence_band: "high",
      confidence_score: 0.89,
      uncertainty: { needs_human_review: true, reasons: ["Neck stiffness warrants urgent evaluation"], missing_information: [], contradictions: [] },
      safety_flags: ["Meningism indicators — urgent clinical assessment required"],
      evidence: [
        { source: "patient_intake", field: "symptoms", summary: "Severe headache with neck stiffness and photophobia" },
      ],
      recommended_next_action: "Urgent clinical assessment",
      model: { name: "pretriage-v1", version: "1.2.0", prompt_version: "p1.3" },
      generated_at: "2024-10-14T08:14:00+05:30",
    },
    transcript: [
      "Mujhe kal se bohot tez sar dard hai, ulti jaisi lag rahi hai aur roshni dekhne par aankhon mein dard ho raha hai. Gardan ghumane mein bhi dard hai.",
      "Severe acute onset headache with neck stiffness and light sensitivity. Nausea present."
    ],
    timeline: [
      { label: "Intake submitted", time: "08:13 AM", variant: "success" },
      { label: "AI triage completed — P1", time: "08:14 AM", detail: "Confidence 89% · Risk flag: meningism signs", variant: "warning" },
      { label: "Admin review pending", time: "08:14 AM" },
      { label: "Clinician notified — Dr. Vance", variant: "muted" },
    ],
  },

  P2: {
    caseId: "MK-2048",
    priority: "P2",
    status: "approved",
    queueStatus: "queued",
    patientRef: "PAT-2048",
    patientName: "Rohan Mehta",
    patientAge: 28,
    patientGender: "M",
    phone: "+91 98765 43210",
    abha: "ABHA-2048-XXXX",
    chiefComplaint: "Cough with mild fever, body ache",
    symptoms: ["Cough, 2 days", "Mild fever", "Body ache", "No breathlessness"],
    duration: "2 days",
    history: ["No chronic conditions"],
    medications: [],
    intakeSubmittedAt: "2024-10-14T08:24:00+05:30",
    department: "General Medicine",
    doctor: "Dr. R. Vance",
    token: "MK-3048",
    estimatedWait: "~30 minutes",
    patientsAhead: 3,
    ai: {
      assessment_id: "ASS-P2-001",
      intake_id: "INT-2048",
      priority: "P2",
      confidence_band: "high",
      confidence_score: 0.82,
      uncertainty: { needs_human_review: false, reasons: [], missing_information: [], contradictions: [] },
      safety_flags: [],
      evidence: [
        { source: "patient_intake", field: "symptoms", summary: "Cough 2 days, mild fever, body ache" },
        { source: "patient_intake", field: "history", summary: "No chronic conditions" },
      ],
      recommended_next_action: "Standard queue allocation",
      model: { name: "pretriage-v1", version: "1.2.0", prompt_version: "p1.3" },
      generated_at: "2024-10-14T08:25:00+05:30",
    },
    transcript: [
      "Mujhe 2 din se khansi ho rahi hai aur halka bukhar hai. Badan mein dard bhi hai, par saans lene mein koi takleef nahi hai.",
      "Cough with mild fever and body ache for 2 days. No shortness of breath or chest pain reported."
    ],
    timeline: [
      { label: "Intake submitted", time: "08:24 AM", variant: "success" },
      { label: "AI triage completed — P2", time: "08:25 AM", detail: "High protocol alignment · No risk flags" },
      { label: "Auto-assigned: Dr. Vance, General Medicine", time: "08:25 AM", variant: "success" },
      { label: "Token issued: MK-3048", time: "08:25 AM", variant: "success" },
    ],
  },

  P3: {
    caseId: "MK-2045",
    priority: "P3",
    status: "approved",
    queueStatus: "queued",
    patientRef: "PAT-2045",
    patientName: "Saran Verma",
    patientAge: 41,
    patientGender: "M",
    phone: "+91 98700 45678",
    abha: "ABHA-2045-XXXX",
    chiefComplaint: "Back pain, limited movement",
    symptoms: ["Lower back pain", "Stiffness", "Limited range of motion"],
    duration: "3 days",
    history: ["No chronic conditions"],
    medications: [],
    intakeSubmittedAt: "2024-10-14T09:10:00+05:30",
    department: "Family Medicine",
    doctor: "Dr. K. Iyer",
    token: "MK-4129",
    estimatedWait: "~10 minutes",
    patientsAhead: 8,
    ai: {
      assessment_id: "ASS-P3-001",
      intake_id: "INT-2045",
      priority: "P3",
      confidence_band: "high",
      confidence_score: 0.91,
      uncertainty: { needs_human_review: false, reasons: [], missing_information: [], contradictions: [] },
      safety_flags: [],
      evidence: [
        { source: "patient_intake", field: "symptoms", summary: "Lower back pain 3 days, no neurological symptoms" },
      ],
      recommended_next_action: "Fast track — routine assessment",
      model: { name: "pretriage-v1", version: "1.2.0", prompt_version: "p1.3" },
      generated_at: "2024-10-14T09:11:00+05:30",
    },
    transcript: [
      "Mujhe pichle 3 din se kamar ke nichle hisse mein dard hai. Jhukne aur chalne mein thoda khichav mehsus hota hai.",
      "Mechanical lower back pain and lumbar stiffness for 3 days following heavy lifting. No radiating numbness."
    ],
    timeline: [
      { label: "Intake submitted", time: "09:10 AM", variant: "success" },
      { label: "AI triage completed — P3 Fast Track", time: "09:11 AM", detail: "Confidence 91%" },
      { label: "Fast Track token issued: MK-4129", time: "09:11 AM", variant: "success" },
    ],
  },
};

// All four cases as array for queue views
export const ALL_CASES = Object.values(CASES);
