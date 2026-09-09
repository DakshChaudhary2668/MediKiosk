"use client";
import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PriorityBand, IntakeStatus, QueueStatus } from "@/types";
import {
  IconHospital,
  IconShield,
  IconShieldAlert,
  IconAlertTriangle,
  IconAlertCircle,
  IconCheckCircle,
  IconClock,
  IconActivity,
  IconFileText,
  IconSparkles,
  IconX,
  IconList,
  IconCheck,
} from "@/components/icons";

/* ═══════════════════════════════════════════════════════════
   BRAND
   Clean, confident editorial mark
═══════════════════════════════════════════════════════════ */
export function MKLogo({ subtitle, dark }: { subtitle?: string; dark?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: "var(--radius-icons, 6px)",
        background: "var(--color-brand, #0f2b48)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M8 3.5v9M3.5 8h9" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <div style={{
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: "-0.03em",
          color: "var(--color-text, #0f172a)",
          lineHeight: 1.1,
        }}>
          MediKiosk
        </div>
        {subtitle && (
          <div style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--color-text-muted, #64748b)",
            letterSpacing: "0.01em",
            marginTop: 2,
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PRIORITY BADGE
   Restrained, semantic, high-contrast
═══════════════════════════════════════════════════════════ */
const PRIORITY_MAP: Record<PriorityBand, { cls: string; label: string; fullLabel: string }> = {
  P0: { cls: "mk-badge mk-badge-p0", label: "P0",     fullLabel: "P0 Critical" },
  P1: { cls: "mk-badge mk-badge-p1", label: "P1",     fullLabel: "P1 Urgent" },
  P2: { cls: "mk-badge mk-badge-p2", label: "P2",     fullLabel: "P2 Standard" },
  P3: { cls: "mk-badge mk-badge-p3", label: "P3",     fullLabel: "P3 Fast Track" },
};

export function PriorityBadge({ priority, full }: { priority: PriorityBand; full?: boolean }) {
  const { cls, label, fullLabel } = PRIORITY_MAP[priority] ?? PRIORITY_MAP.P2;
  return <span className={cls}>{full ? fullLabel : label}</span>;
}

/* ═══════════════════════════════════════════════════════════
   STATUS CHIP
═══════════════════════════════════════════════════════════ */
const STATUS_LABELS: Record<IntakeStatus | QueueStatus, string> = {
  intake_submitted:    "Submitted",
  assessment_pending:  "Assessing",
  assessment_ready:    "Assessed",
  awaiting_review:     "Pending Review",
  p0_escalated:        "P0 Escalated",
  needs_clarification: "Needs Clarification",
  approved:            "Approved",
  rejected:            "Rejected",
  completed:           "Completed",
  cancelled:           "Cancelled",
  assessment_failed:   "Assessment Failed",
  queued:              "Queued",
  called:              "Called",
  in_consultation:     "In Consultation",
  skipped:             "Skipped",
};

const STATUS_COLORS: Partial<Record<IntakeStatus | QueueStatus, string>> = {
  completed:          "var(--mk-success)",
  approved:           "var(--mk-success)",
  p0_escalated:       "var(--mk-danger)",
  rejected:           "var(--mk-danger)",
  cancelled:          "var(--mk-text-muted)",
  in_consultation:    "var(--mk-primary)",
  needs_clarification:"var(--mk-warning)",
  called:             "var(--mk-primary)",
};

export function StatusChip({ status }: { status: IntakeStatus | QueueStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <span className="mk-chip" style={color ? { color } : {}}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   CONFIDENCE BADGE
═══════════════════════════════════════════════════════════ */
export function ConfidenceBadge({ band, score }: { band: string; score?: number | null }) {
  const cls = band === "high" ? "mk-badge mk-badge-ok"
    : band === "medium" ? "mk-badge mk-badge-warn"
    : "mk-badge mk-badge-p1";
  const label = band === "high" ? "High Protocol Alignment" : band === "medium" ? "Moderate Alignment" : "Review Required";
  return (
    <span className={cls}>
      {score != null && (
        <span style={{ fontFamily: "var(--mk-font-mono)", marginRight: 4 }}>
          {Math.round(score * 100)}% ·
        </span>
      )}
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   CASE TIMELINE
   Subtle hairline event ledger
═══════════════════════════════════════════════════════════ */
export interface TimelineEvent {
  label: string;
  time?: string;
  variant?: "success" | "danger" | "warning" | "muted";
  detail?: string;
}

export function CaseTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="mk-timeline">
      {events.map((e, i) => (
        <div className="mk-tl-item" key={i}>
          <div className={`mk-tl-dot ${e.variant ?? ""}`} />
          <div className="mk-tl-body">
            <div className="mk-card-title" style={{ fontSize: 13 }}>{e.label}</div>
            {e.time && <div className="mk-meta" style={{ fontSize: 11, marginTop: 1 }}>{e.time}</div>}
            {e.detail && <div className="mk-body" style={{ marginTop: 2, fontSize: 12, color: "var(--mk-text-muted)" }}>{e.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EVIDENCE DRAWER
   Tabs: Patient Intake / Past Records / Uploaded Files / AI Triage Context
═══════════════════════════════════════════════════════════ */
export function EvidenceDrawer({
  open,
  onClose,
  caseId,
  patientName,
  chiefComplaint,
  symptoms = ["Acute symptoms reported"],
  evidence = [],
  transcript,
}: {
  open: boolean;
  onClose: () => void;
  caseId?: string;
  patientName?: string;
  chiefComplaint?: string;
  symptoms?: string[];
  evidence?: Array<{ field?: string; summary?: string; source?: string }>;
  transcript?: string | string[];
}) {
  const [tab, setTab] = useState(0);
  const tabs = ["Patient Intake", "Past Records", "Uploaded Files", "AI Triage Context"];
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mk-drawer-overlay"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="mk-drawer"
            role="dialog"
            aria-label="Evidence & Source Records"
            aria-modal
          >
            <div className="mk-drawer-head">
              <div>
                <h2 className="mk-sec-title" style={{ fontSize: 15 }}>Evidence &amp; Clinical Source Records</h2>
                {caseId && <div className="mk-meta">{caseId} {patientName ? `· ${patientName}` : ""}</div>}
              </div>
              <button
                className="mk-btn mk-btn-ghost"
                onClick={onClose}
                aria-label="Close"
                style={{ height: 32, width: 32, padding: 0 }}
              >
                <IconX size={16} />
              </button>
            </div>
            <div className="mk-tabs" style={{ padding: "0 20px" }}>
              {tabs.map((t, i) => (
                <span
                  key={t}
                  className={`mk-tab ${tab === i ? "active" : ""}`}
                  onClick={() => setTab(i)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setTab(i)}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mk-drawer-body">
              {tab === 0 && <EvidenceIntake transcript={transcript} symptoms={symptoms} evidence={evidence} chiefComplaint={chiefComplaint} />}
              {tab === 1 && <EvidencePastRecords />}
              {tab === 2 && <EvidenceFiles />}
              {tab === 3 && <EvidenceAIContext symptoms={symptoms} evidence={evidence} />}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function EvidenceIntake({
  transcript,
  symptoms,
  evidence = [],
  chiefComplaint,
}: {
  transcript?: string | string[];
  symptoms?: string[];
  evidence?: Array<{ field?: string; summary?: string; source?: string }>;
  chiefComplaint?: string;
}) {
  const transcriptText = Array.isArray(transcript) ? transcript.join(" · ") : transcript;
  const fallback = chiefComplaint
    ? `Patient reported: "${chiefComplaint}". Symptoms: ${symptoms?.join(", ") || "Acute symptoms reported"}.`
    : symptoms && symptoms.length > 0
    ? `Patient reported: "${symptoms.join(", ")}". Acute onset symptoms.`
    : "Patient clinical report recorded during autonomous intake.";
  return (
    <div>
      <div className="mk-sec-title" style={{ marginBottom: 10 }}>Patient Intake Transcript</div>
      <div className="mk-card mk-card-padded" style={{ background: "var(--mk-surface-subtle)", marginBottom: 18 }}>
        <p className="mk-body" style={{ color: "var(--mk-text)", fontStyle: "italic", fontSize: 13, lineHeight: 1.6 }}>
          &ldquo;{transcriptText || fallback}&rdquo;
        </p>
        <div className="mk-meta" style={{ marginTop: 8, fontSize: 11 }}>Patient-confirmed intake transcript · Verified source</div>
      </div>

      <div className="mk-sec-title" style={{ marginBottom: 10 }}>Reported Clinical Indicators</div>
      {evidence.length > 0 ? (
        evidence.map((ev, idx) => {
          const sourceBadge =
            ev.source === "patient_intake" ? "Patient Reported" :
            ev.source === "prior_record" ? "Prior Record" :
            ev.source === "ai_derived" ? "Protocol Derived" : "Reported";
          return (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--mk-border-subtle)" }}>
              <span className="mk-body" style={{ fontSize: 13 }}>{ev.field}: <span className="mk-meta">{ev.summary}</span></span>
              <span className="mk-badge mk-badge-ok">{sourceBadge}</span>
            </div>
          );
        })
      ) : (
        (symptoms || ["Cough", "Mild fever"]).map((s) => (
          <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--mk-border-subtle)" }}>
            <span className="mk-body" style={{ fontSize: 13 }}>{s}</span>
            <span className="mk-badge mk-badge-ok">Patient Reported</span>
          </div>
        ))
      )}

      <div className="mk-sec-title" style={{ marginTop: 20, marginBottom: 10 }}>Patient Responses</div>
      {[
        { q: "Reported Discomfort (1–10)", a: "5", provenance: "Patient Stated" },
        { q: "Known Allergies / Chronic Conditions", a: "None reported", provenance: "Intake Verified" },
        { q: "Current Medications", a: "None", provenance: "Intake Verified" },
      ].map(({ q, a, provenance }) => (
        <div key={q} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--mk-border-subtle)" }}>
          <div>
            <div className="mk-meta" style={{ fontWeight: 600 }}>{q}</div>
            <div className="mk-body" style={{ fontSize: 13 }}>{a}</div>
          </div>
          <span className="mk-badge" style={{ fontSize: 11 }}>{provenance}</span>
        </div>
      ))}
    </div>
  );
}

function EvidencePastRecords() {
  return (
    <div>
      <div className="mk-sec-title" style={{ marginBottom: 10 }}>Prior Visit Summary</div>
      {[
        { date: "12 Aug 2024", diagnosis: "Seasonal allergic rhinitis", doctor: "Dr. K. Iyer", provenance: "EHR Record" },
        { date: "21 Jan 2024", diagnosis: "Viral upper respiratory infection", doctor: "Dr. R. Vance", provenance: "EHR Record" },
      ].map((r) => (
        <div key={r.date} className="mk-card mk-card-padded" style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span className="mk-meta">{r.date}</span>
            <span className="mk-badge">{r.provenance}</span>
          </div>
          <div className="mk-card-title">{r.diagnosis}</div>
          <div className="mk-meta">{r.doctor}</div>
        </div>
      ))}
    </div>
  );
}

function EvidenceFiles() {
  const files = [
    { name: "CBC_Blood_Test.pdf", type: "Lab Report", date: "14 Oct 2024", provenance: "Uploaded Document" },
    { name: "Chest_XRay.jpg", type: "Imaging", date: "14 Oct 2024", provenance: "Uploaded Document" },
  ];
  return (
    <div>
      <div className="mk-sec-title" style={{ marginBottom: 10 }}>Uploaded Documents</div>
      {files.map((f) => (
        <div key={f.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--mk-border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IconFileText size={16} color="var(--mk-text-muted)" />
            <div>
              <div className="mk-card-title" style={{ fontSize: 13 }}>{f.name}</div>
              <div className="mk-meta">{f.type} · {f.date}</div>
            </div>
          </div>
          <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 30, padding: "0 10px" }}>View</button>
        </div>
      ))}
    </div>
  );
}

function EvidenceAIContext({
  symptoms = [],
}: {
  symptoms?: string[];
  evidence?: Array<{ field?: string; summary?: string; source?: string }>;
}) {
  return (
    <div>
      <div className="mk-ai-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="mk-sec-title" style={{ margin: 0 }}>AI Triage Context</div>
          <span className="mk-badge mk-badge-ok">High Protocol Alignment</span>
        </div>
        <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 6 }}>Clinical Protocol Invariant Signals</div>
        <ul style={{ paddingLeft: 18, marginBottom: 14 }}>
          {(symptoms.length > 0 ? symptoms : ["Symptom duration (2 days)", "Discomfort moderate (5/10)", "No cardiac or respiratory red flags reported", "No documented high-risk comorbidity"]).map(s => (
            <li key={s} className="mk-body" style={{ fontSize: 13, color: "var(--mk-text-muted)", marginBottom: 2 }}>{s}</li>
          ))}
        </ul>
        <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 4 }}>Protocol Engine</div>
        <div className="mk-body" style={{ fontSize: 13 }}>pretriage-v1 · Safety Matrix Active</div>
        <p className="mk-ai-disclaimer">
          Advisory: AI supports intake triage and prioritization only. All clinical diagnoses and decisions are made by licensed attending physicians.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AI TRIAGE CONTEXT PANEL
   Strictly non-diagnostic decision support
═══════════════════════════════════════════════════════════ */
export function AITriageContext({
  priority = "P2",
  confidence = 82,
  indicators = ["Cough, 2 days", "Mild fever", "Body ache", "No reported breathlessness"],
  history = ["No chronic condition reported"],
  riskFlags = ["None identified"],
}: {
  priority?: PriorityBand;
  confidence?: number;
  indicators?: string[];
  history?: string[];
  riskFlags?: string[];
}) {
  return (
    <div className="mk-ai-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <span className="mk-sec-title" style={{ margin: 0 }}>Triage Decision Support</span>
          <div className="mk-meta" style={{ fontSize: 11, color: "var(--mk-text-subtle)" }}>
            Clinical Protocol Alignment
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <PriorityBadge priority={priority} />
          <ConfidenceBadge band="high" score={confidence / 100} />
        </div>
      </div>

      <div style={{ padding: "8px 0", borderBottom: "1px solid var(--mk-border-subtle)", display: "flex", justifyContent: "space-between" }}>
        <span className="mk-meta" style={{ fontWeight: 600 }}>Triage Priority</span>
        <span className="mk-body" style={{ fontWeight: 600 }}>{priority}</span>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 6 }}>Observed Signals</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {indicators.map(i => (
            <span
              key={i}
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: "3px 8px",
                borderRadius: "var(--radius-tags, 4px)",
                background: "var(--color-surface-subtle, #f8fafc)",
                border: "1px solid var(--color-border, #e2e8f0)",
                color: "var(--color-text, #0f172a)",
              }}
            >
              {i}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 4 }}>Relevant Intake History</div>
        <ul style={{ paddingLeft: 18, margin: 0, marginBottom: 10 }}>
          {history.map(h => (
            <li key={h} className="mk-body" style={{ color: "var(--mk-text-muted)", fontSize: 12, marginBottom: 2 }}>{h}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 4 }}>Risk Flags</div>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {riskFlags.map(r => (
            <li
              key={r}
              className="mk-body"
              style={{
                color: r !== "None identified" ? "var(--mk-danger)" : "var(--mk-text-muted)",
                fontSize: 12,
                fontWeight: r !== "None identified" ? 600 : 400,
                marginBottom: 2,
              }}
            >
              {r}
            </li>
          ))}
        </ul>
      </div>

      <p className="mk-ai-disclaimer">
        Non-diagnostic decision support. Clinicians verify all indicators and make final care decisions.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WHY THIS ALLOCATION PANEL
═══════════════════════════════════════════════════════════ */
export function WhyAllocation({
  priority = "P2",
  department = "General Medicine",
  doctor = "Dr. R. Vance — available",
  queueLoad = "3 patients ahead",
  estimatedWait = "~30 minutes",
  location = "Ground Floor, Ward B",
  special,
}: {
  priority?: string;
  department?: string;
  doctor?: string;
  queueLoad?: string;
  estimatedWait?: string;
  location?: string;
  special?: string;
}) {
  const factors = [
    { label: "Priority Band", value: priority },
    { label: "Target Specialty", value: department },
    { label: "Assigned Clinician", value: doctor },
    { label: "Queue Position", value: queueLoad },
    { label: "Estimated Window", value: estimatedWait },
    { label: "Designated Area", value: location },
    ...(special ? [{ label: "Special Handling", value: special }] : []),
  ];
  return (
    <div className="mk-card mk-card-padded">
      <div className="mk-sec-title" style={{ marginBottom: 10 }}>Allocation Rationale</div>
      {factors.map(({ label, value }) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--mk-border-subtle)" }}>
          <span className="mk-meta" style={{ fontWeight: 600 }}>{label}</span>
          <span className="mk-body" style={{ textAlign: "right", maxWidth: "60%", fontSize: 13 }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CONFIRMATION DIALOG
   Minimal, calm, accessible
═══════════════════════════════════════════════════════════ */
export function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm", danger, confirmDisabled, onConfirm, onCancel, children,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 60 }}
            onClick={onCancel}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="dlg-title"
            initial={{ scale: 0.98, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              zIndex: 70, background: "#ffffff", borderRadius: "var(--radius-cards, 12px)",
              border: "1px solid var(--color-border, #e2e8f0)",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
              padding: 24, width: "min(440px, 92vw)",
            }}
          >
            <h2 id="dlg-title" className="mk-sec-title" style={{ fontSize: 16, marginBottom: 8, color: "var(--color-text)" }}>{title}</h2>
            {message && <p className="mk-body" style={{ color: "var(--color-text-muted)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>{message}</p>}
            {children && <div style={{ marginBottom: 16 }}>{children}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="mk-btn mk-btn-secondary" onClick={onCancel}>Cancel</button>
              <button className={`mk-btn ${danger ? "mk-btn-danger" : "mk-btn-primary"}`} onClick={onConfirm} disabled={confirmDisabled}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════
   TOAST / NOTIFICATION SYSTEM
═══════════════════════════════════════════════════════════ */
export type ToastVariant = "info" | "success" | "danger" | "warning";
export interface Toast { id: string; message: string; variant: ToastVariant }

let _setToasts: ((fn: (prev: Toast[]) => Toast[]) => void) | null = null;

export function pushToast(message: string, variant: ToastVariant = "info") {
  if (!_setToasts) return;
  const id = Math.random().toString(36).slice(2);
  _setToasts((prev) => [...prev, { id, message, variant }]);
  setTimeout(() => _setToasts?.((prev) => prev.filter((t) => t.id !== id)), 4000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => { _setToasts = setToasts; }, [setToasts]);
  const variantCls: Record<ToastVariant, string> = {
    info: "", success: "mk-toast-success", danger: "mk-toast-danger", warning: "",
  };
  return (
    <div className="mk-toast-container" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.18 }}
            className={`mk-toast ${variantCls[t.variant]}`}
          >
            <span>{t.message}</span>
            <button
              onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
              style={{ marginLeft: 8, color: "inherit", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
              aria-label="Dismiss notification"
            >
              <IconX size={14} color="currentColor" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOADING / EMPTY / ERROR / PERMISSION STATES
═══════════════════════════════════════════════════════════ */
export function Skeleton({ h = 18, w, radius }: { h?: number; w?: number | string; radius?: number }) {
  return (
    <div
      style={{
        height: h,
        width: w ?? "100%",
        borderRadius: radius ?? 4,
        background: "var(--mk-surface-subtle)",
      }}
    />
  );
}

export function EmptyState({ icon, title, desc, action }: { icon?: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10, color: "var(--mk-text-muted)" }}>
        {icon || <IconFileText size={32} />}
      </div>
      <div className="mk-card-title" style={{ marginBottom: 4, fontSize: 14 }}>{title}</div>
      {desc && <div className="mk-meta" style={{ marginBottom: 14 }}>{desc}</div>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <IconAlertCircle size={32} color="var(--mk-danger)" />
      </div>
      <div className="mk-card-title" style={{ marginBottom: 4 }}>Unable to complete request</div>
      {message && <div className="mk-meta" style={{ marginBottom: 14, color: "var(--mk-danger)" }}>{message}</div>}
      {onRetry && <button className="mk-btn mk-btn-secondary" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function SuccessState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <IconCheckCircle size={32} color="var(--mk-success)" />
      </div>
      <div className="mk-card-title" style={{ marginBottom: 4, color: "var(--mk-success)" }}>{title}</div>
      {desc && <div className="mk-meta" style={{ marginBottom: 14 }}>{desc}</div>}
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   OPS APP SHELL (Clinical Workstation & Operations Center)
   Clean, minimal chrome, high operational efficiency
═══════════════════════════════════════════════════════════ */
export interface NavItem { id: string; label: string; icon: ReactNode; badge?: string | number; danger?: boolean }

export function OpsShell({
  children, nav, active, onNav, subtitle, topbarExtra,
}: {
  children: ReactNode;
  nav: NavItem[];
  active: string;
  onNav: (id: string) => void;
  subtitle: string;
  topbarExtra?: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="mk-shell">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 32 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className="mk-sidebar" style={{ transform: sidebarOpen ? "none" : undefined, justifyContent: "space-between" }}>
        <div>
          <div style={{ padding: "18px 16px 14px" }}>
            <MKLogo subtitle={subtitle} />
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 10,
              fontSize: 11,
              fontWeight: 500,
              color: "var(--color-text-muted, #64748b)",
            }}>
              <span className="mk-status-dot" style={{ color: "var(--color-green, #16a34a)" }} />
              <span>Station 04 · Ready</span>
            </div>
          </div>
          <div style={{ height: 1, background: "var(--color-border)", margin: "0 0 8px" }} />
          <div style={{ padding: "0 8px", display: "flex", flexDirection: "column", gap: 2 }}>
            {nav.map(({ id, label, icon, badge, danger }) => (
              <button
                key={id}
                className={`mk-nav-item ${active === id ? "active" : ""}`}
                onClick={() => { onNav(id); setSidebarOpen(false); }}
                style={danger ? { color: "var(--color-crimson, #dc2626)" } : {}}
              >
                <span style={{ display: "flex", alignItems: "center", opacity: active === id ? 1 : 0.7 }}>{icon}</span>
                <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
                {badge !== undefined && (
                  <span className={`mk-badge ${danger ? "mk-badge-p0" : "mk-badge-info"}`} style={{ height: 18, padding: "0 6px", fontSize: 10 }}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar user footer */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: "var(--radius-icons, 6px)",
            background: "var(--color-brand-soft, #f0f4f8)",
            border: "1px solid var(--color-border, #e2e8f0)",
            color: "var(--color-brand, #0f2b48)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
          }}>
            {subtitle.includes("Clinical") ? "MD" : "OP"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text, #0f172a)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
              {subtitle.includes("Clinical") ? "Dr. R. Vance" : "Operations Lead"}
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-muted, #64748b)" }}>
              {subtitle.includes("Clinical") ? "Attending Physician" : "Supervisor Desk"}
            </div>
          </div>
        </div>
      </nav>

      {/* Top bar */}
      <div className="mk-topbar">
        <button
          className="mk-btn mk-btn-ghost"
          style={{ display: "none", height: 32, width: 32, padding: 0 }}
          id="mk-sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <IconList size={18} />
        </button>
        {topbarExtra}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 12, color: "var(--mk-text-muted)", fontWeight: 500 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </div>
          <span style={{ height: 12, width: 1, background: "var(--mk-border)" }} />
          <div style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "var(--mk-text-muted)" }}>
            Station 04
          </div>
        </div>
      </div>

      <main className="mk-main">{children}</main>
      <ToastContainer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REASON INPUT (Mandatory for clinical overrides)
═══════════════════════════════════════════════════════════ */
export function ReasonInput({ value, onChange, placeholder = "State clinical reason or operational justification…", label = "Clinical Rationale (Required)" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; label?: string;
}) {
  return (
    <div>
      <label className="mk-label">{label}</label>
      <textarea
        className={`mk-input ${!value.trim() ? "mk-input-error" : ""}`}
        style={{ height: 72, padding: "8px 12px", resize: "none", fontSize: 13 }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {!value.trim() && <p style={{ color: "var(--mk-danger)", fontSize: 11, marginTop: 3 }}>Required by clinical governance protocol</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AUDIT EVENT DISPLAY
═══════════════════════════════════════════════════════════ */
export interface AuditEvent {
  id: string;
  time: string;
  actor: string;
  action: string;
  caseId?: string;
  before?: string;
  after?: string;
  reason?: string;
  outcome?: string;
}

export function AuditRow({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--mk-border-subtle)", padding: "9px 0" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }} onClick={() => setExpanded(v => !v)}>
        <span className="mk-meta" style={{ whiteSpace: "nowrap", minWidth: 90, fontFamily: "var(--mk-font-mono)", fontSize: 11 }}>{event.time}</span>
        <span className="mk-body" style={{ fontWeight: 600, flex: 1, fontSize: 13 }}>{event.action}</span>
        {event.caseId && <span className="mk-badge mk-badge-info">{event.caseId}</span>}
        <span className="mk-meta" style={{ fontSize: 12 }}>{event.actor}</span>
        <span style={{ color: "var(--mk-text-muted)", fontSize: 11 }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 8, paddingLeft: 102, display: "flex", flexDirection: "column", gap: 4 }}>
          {event.before && <div className="mk-meta"><strong>Prior State:</strong> {event.before}</div>}
          {event.after && <div className="mk-meta"><strong>Target State:</strong> {event.after}</div>}
          {event.reason && <div className="mk-meta"><strong>Clinical Rationale:</strong> {event.reason}</div>}
          {event.outcome && <div className="mk-meta"><strong>Outcome:</strong> {event.outcome}</div>}
        </div>
      )}
    </div>
  );
}
