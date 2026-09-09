"use client";
import { useState, useEffect, ReactNode } from "react";
import type { PriorityBand, IntakeStatus, QueueStatus } from "@/types";

/* ═══════════════════════════════════════════════════════════
   BRAND
═══════════════════════════════════════════════════════════ */
export function MKLogo({ subtitle }: { subtitle?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--mk-primary)" />
        <path d="M16 7v18M7 16h18" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--mk-navy)", lineHeight: 1 }}>MediKiosk</div>
        {subtitle && <div style={{ fontSize: 10, color: "var(--mk-text-muted)", marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PRIORITY BADGE
═══════════════════════════════════════════════════════════ */
const PRIORITY_MAP: Record<PriorityBand, { cls: string; label: string; fullLabel: string }> = {
  P0: { cls: "mk-badge mk-badge-p0", label: "P0",     fullLabel: "P0 Critical" },
  P1: { cls: "mk-badge mk-badge-p1", label: "P1",     fullLabel: "P1 High Priority" },
  P2: { cls: "mk-badge mk-badge-p2", label: "P2",     fullLabel: "P2 Moderate" },
  P3: { cls: "mk-badge mk-badge-p3", label: "P3",     fullLabel: "P3 Routine / Fast Track" },
};

export function PriorityBadge({ priority, full }: { priority: PriorityBand; full?: boolean }) {
  const { cls, label, fullLabel } = PRIORITY_MAP[priority];
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
  const pct = score != null ? `${Math.round(score * 100)}%` : band;
  return <span className={cls}>{pct} confidence</span>;
}

/* ═══════════════════════════════════════════════════════════
   CASE TIMELINE
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
            <div className="mk-card-title">{e.label}</div>
            {e.time && <div className="mk-meta">{e.time}</div>}
            {e.detail && <div className="mk-body" style={{ marginTop: 2, color: "var(--mk-text-muted)" }}>{e.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EVIDENCE DRAWER  (tabs: Patient Intake / Past Records / Uploaded Files / AI Triage Context)
═══════════════════════════════════════════════════════════ */
export function EvidenceDrawer({ open, onClose }: { open: boolean; onClose: () => void; caseId?: string }) {
  const [tab, setTab] = useState(0);
  const tabs = ["Patient Intake", "Past Records", "Uploaded Files", "AI Triage Context"];
  if (!open) return null;
  return (
    <>
      <div className="mk-drawer-overlay" onClick={onClose} />
      <aside className="mk-drawer" role="dialog" aria-label="Evidence & Source Records" aria-modal>
        <div className="mk-drawer-head">
          <h2 className="mk-sec-title">Evidence &amp; Source Records</h2>
          <button className="mk-btn mk-btn-ghost" onClick={onClose} aria-label="Close" style={{ height: 32, width: 32, padding: 0 }}>✕</button>
        </div>
        <div className="mk-tabs" style={{ padding: "0 20px", borderBottom: "1px solid var(--mk-border)" }}>
          {tabs.map((t, i) => (
            <span key={t} className={`mk-tab ${tab === i ? "active" : ""}`} onClick={() => setTab(i)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setTab(i)}>{t}</span>
          ))}
        </div>
        <div className="mk-drawer-body">
          {tab === 0 && <EvidenceIntake />}
          {tab === 1 && <EvidencePastRecords />}
          {tab === 2 && <EvidenceFiles />}
          {tab === 3 && <EvidenceAIContext />}
        </div>
      </aside>
    </>
  );
}

function EvidenceIntake() {
  return (
    <div>
      <div className="mk-sec-title" style={{ marginBottom: 12 }}>Voice Transcript</div>
      <div className="mk-card mk-card-padded" style={{ background: "var(--mk-surface-subtle)", marginBottom: 16 }}>
        <p className="mk-body" style={{ fontStyle: "italic", color: "var(--mk-text-muted)" }}>
          &ldquo;Mujhe 2 din se khansi ho rahi hai aur halka bukhar hai. Badan mein dard bhi hai.&rdquo;
        </p>
        <div className="mk-meta" style={{ marginTop: 8 }}>Patient-confirmed · 14 Oct 2024, 08:24 AM</div>
        <button className="mk-btn mk-btn-ghost" style={{ fontSize: 11, minHeight: 28, marginTop: 8 }}>⬇ Download transcript</button>
      </div>
      <div className="mk-sec-title" style={{ marginBottom: 12 }}>Extracted Symptom Facts</div>
      {[
        { fact: "Cough", duration: "2 days", confirmed: true },
        { fact: "Mild fever", duration: "2 days", confirmed: true },
        { fact: "Body ache", duration: "1 day", confirmed: true },
        { fact: "Breathlessness", duration: "—", confirmed: false },
      ].map((f) => (
        <div key={f.fact} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--mk-border)" }}>
          <span className="mk-body">{f.fact} <span className="mk-meta">— {f.duration}</span></span>
          <span className={`mk-badge ${f.confirmed ? "mk-badge-ok" : "mk-badge-warn"}`}>{f.confirmed ? "Confirmed" : "Not reported"}</span>
        </div>
      ))}
      <div className="mk-sec-title" style={{ marginTop: 20, marginBottom: 12 }}>Patient-Confirmed Answers</div>
      {[
        { q: "Severity (1–10)", a: "5" },
        { q: "Existing conditions", a: "None reported" },
        { q: "Current medications", a: "None" },
      ].map(({ q, a }) => (
        <div key={q} style={{ padding: "8px 0", borderBottom: "1px solid var(--mk-border)" }}>
          <div className="mk-meta" style={{ fontWeight: 600 }}>{q}</div>
          <div className="mk-body">{a}</div>
        </div>
      ))}
    </div>
  );
}

function EvidencePastRecords() {
  return (
    <div>
      <div className="mk-sec-title" style={{ marginBottom: 12 }}>Prior Visit Summary</div>
      {[
        { date: "12 Aug 2024", diagnosis: "Seasonal allergic rhinitis", doctor: "Dr. K. Iyer" },
        { date: "21 Jan 2024", diagnosis: "Viral fever", doctor: "Dr. R. Vance" },
      ].map((r) => (
        <div key={r.date} className="mk-card mk-card-padded" style={{ marginBottom: 10 }}>
          <div className="mk-meta">{r.date}</div>
          <div className="mk-card-title">{r.diagnosis}</div>
          <div className="mk-meta">{r.doctor}</div>
        </div>
      ))}
    </div>
  );
}

function EvidenceFiles() {
  const files = [
    { name: "CBC_Blood_Test.pdf", type: "Lab Report", date: "14 Oct 2024" },
    { name: "Chest_XRay.jpg", type: "Imaging", date: "14 Oct 2024" },
  ];
  return (
    <div>
      <div className="mk-sec-title" style={{ marginBottom: 12 }}>Uploaded Files</div>
      {files.map((f) => (
        <div key={f.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--mk-border)" }}>
          <div>
            <div className="mk-card-title">📄 {f.name}</div>
            <div className="mk-meta">{f.type} · {f.date}</div>
          </div>
          <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 32 }}>View</button>
        </div>
      ))}
      {files.length === 0 && <EmptyState icon="📁" title="No files uploaded" />}
    </div>
  );
}

function EvidenceAIContext() {
  return (
    <div>
      <div className="mk-ai-panel">
        <div className="mk-sec-title" style={{ color: "var(--mk-purple)", marginBottom: 12 }}>AI Triage Context</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <span className="mk-badge mk-badge-p2">P2</span>
          <span className="mk-badge mk-badge-ok">82% confidence</span>
        </div>
        <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 6 }}>Priority suggestion source</div>
        <ul style={{ paddingLeft: 16, marginBottom: 12 }}>
          {["Symptom duration (2 days)", "Severity moderate (5/10)", "No red-flag symptoms", "No chronic conditions"].map(s => <li key={s} className="mk-body">{s}</li>)}
        </ul>
        <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 6 }}>Model</div>
        <div className="mk-body">pretriage-v1 · v1.2.0 · prompt p1.3</div>
        <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 6, marginTop: 12 }}>Generated at</div>
        <div className="mk-body">14 Oct 2024, 08:25 AM</div>
        <p className="mk-ai-disclaimer">This is triage support, not a diagnosis.</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AI TRIAGE CONTEXT PANEL
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
        <span className="mk-sec-title" style={{ color: "var(--mk-purple)" }}>AI Triage Context</span>
        <div style={{ display: "flex", gap: 6 }}>
          <PriorityBadge priority={priority} />
          <ConfidenceBadge band="high" score={confidence / 100} />
        </div>
      </div>
      <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 4 }}>Suggested priority: {priority}</div>
      <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 6, marginTop: 12 }}>Reported indicators</div>
      <ul style={{ paddingLeft: 16, marginBottom: 12 }}>{indicators.map(i => <li key={i} className="mk-body">{i}</li>)}</ul>
      <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 6 }}>Relevant history</div>
      <ul style={{ paddingLeft: 16, marginBottom: 12 }}>{history.map(h => <li key={h} className="mk-body">{h}</li>)}</ul>
      <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 6 }}>Risk flags</div>
      <ul style={{ paddingLeft: 16 }}>{riskFlags.map(r => <li key={r} className="mk-body">{r}</li>)}</ul>
      <p className="mk-ai-disclaimer">This is triage support, not a diagnosis. Please use clinical judgment.</p>
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
    { label: "Priority", value: priority },
    { label: "Department / Specialty", value: department },
    { label: "Doctor availability", value: doctor },
    { label: "Queue load", value: queueLoad },
    { label: "Estimated wait", value: estimatedWait },
    { label: "Patient location", value: location },
    ...(special ? [{ label: "Special consideration", value: special }] : []),
  ];
  return (
    <div className="mk-card mk-card-padded">
      <div className="mk-sec-title" style={{ marginBottom: 12 }}>Why this allocation?</div>
      {factors.map(({ label, value }) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--mk-border)" }}>
          <span className="mk-meta" style={{ fontWeight: 600 }}>{label}</span>
          <span className="mk-body" style={{ textAlign: "right", maxWidth: "55%" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CONFIRMATION DIALOG
═══════════════════════════════════════════════════════════ */
export function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm", danger, onConfirm, onCancel, children,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
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

  if (!open) return null;
  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(15,43,88,0.4)", zIndex: 60 }} onClick={onCancel} />
      <div role="dialog" aria-modal aria-labelledby="dlg-title" style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 70, background: "var(--mk-surface)", borderRadius: "var(--mk-radius-md)",
        boxShadow: "var(--mk-shadow-overlay)", padding: 24, width: "min(440px, 90vw)",
        animation: "mk-slide-up 180ms var(--mk-ease)",
      }}>
        <h2 id="dlg-title" className="mk-sec-title" style={{ marginBottom: 8 }}>{title}</h2>
        {message && <p className="mk-body" style={{ color: "var(--mk-text-muted)", marginBottom: 16 }}>{message}</p>}
        {children && <div style={{ marginBottom: 16 }}>{children}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="mk-btn mk-btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`mk-btn ${danger ? "mk-btn-danger" : "mk-btn-primary"}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </>
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
      {toasts.map((t) => (
        <div key={t.id} className={`mk-toast ${variantCls[t.variant]}`}>
          {t.message}
          <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} style={{ marginLeft: 12, background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOADING / EMPTY / ERROR / OFFLINE / PERMISSION-DENIED / SUCCESS STATES
═══════════════════════════════════════════════════════════ */
export function Skeleton({ h = 20, w, radius }: { h?: number; w?: number | string; radius?: number }) {
  return <div className="mk-skeleton" style={{ height: h, width: w ?? "100%", borderRadius: radius ?? 6 }} />;
}

export function SkeletonCard() {
  return (
    <div className="mk-card mk-card-padded" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Skeleton h={16} w="60%" />
      <Skeleton h={12} w="80%" />
      <Skeleton h={12} w="40%" />
    </div>
  );
}

export function EmptyState({ icon = "📋", title, desc, action }: { icon?: string; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div className="mk-card-title" style={{ marginBottom: 6 }}>{title}</div>
      {desc && <div className="mk-meta" style={{ marginBottom: 16 }}>{desc}</div>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <div className="mk-card-title" style={{ marginBottom: 6 }}>Something went wrong</div>
      {message && <div className="mk-meta" style={{ marginBottom: 16, color: "var(--mk-danger)" }}>{message}</div>}
      {onRetry && <button className="mk-btn mk-btn-secondary" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
      <div className="mk-card-title" style={{ marginBottom: 6 }}>No connection</div>
      <div className="mk-meta" style={{ marginBottom: 16 }}>Check your network and try again.</div>
      {onRetry && <button className="mk-btn mk-btn-secondary" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function PermissionDenied({ resource }: { resource?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <div className="mk-card-title" style={{ marginBottom: 6 }}>Access restricted</div>
      <div className="mk-meta">{resource ? `You don't have permission to view ${resource}.` : "You don't have permission to view this."}</div>
    </div>
  );
}

export function SuccessState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
      <div className="mk-card-title" style={{ marginBottom: 6, color: "var(--mk-success)" }}>{title}</div>
      {desc && <div className="mk-meta" style={{ marginBottom: 16 }}>{desc}</div>}
      {action}
    </div>
  );
}

export function SessionExpired() {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⏱</div>
      <div className="mk-card-title" style={{ marginBottom: 6 }}>Session expired</div>
      <div className="mk-meta" style={{ marginBottom: 16 }}>Please refresh to continue.</div>
      <button className="mk-btn mk-btn-primary" onClick={() => window.location.reload()}>Refresh</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RESPONSIVE DATA TABLE (auto-switches to list on mobile)
═══════════════════════════════════════════════════════════ */
export interface TableCol<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  mobileHide?: boolean;
}

export function DataTable<T extends { [k: string]: unknown }>({
  cols, rows, onRowClick, emptyLabel = "No records found",
}: {
  cols: TableCol<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  emptyLabel?: string;
}) {
  if (rows.length === 0) return <EmptyState icon="📋" title={emptyLabel} />;
  return (
    <div className="mk-table-wrap">
      {/* Desktop table */}
      <table className="mk-table-el" style={{ minWidth: 600 }}>
        <thead>
          <tr>{cols.map(c => <th key={c.key}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={onRowClick ? { cursor: "pointer" } : {}} onClick={() => onRowClick?.(row)}>
              {cols.map(c => <td key={c.key}>{c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   OPS APP SHELL (Doctor / Admin)
═══════════════════════════════════════════════════════════ */
interface NavItem { id: string; label: string; icon: string; badge?: string | number; danger?: boolean }

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
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 32 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className="mk-sidebar" style={{ zIndex: 33, transform: sidebarOpen ? "none" : undefined }}>
        <div style={{ padding: "16px 16px 12px" }}>
          <MKLogo subtitle={subtitle} />
        </div>
        <div className="mk-divider" />
        {nav.map(({ id, label, icon, badge, danger }) => (
          <button
            key={id}
            className={`mk-nav-item ${active === id ? "active" : ""}`}
            onClick={() => { onNav(id); setSidebarOpen(false); }}
            style={danger ? { color: "var(--mk-danger)" } : {}}
          >
            <span>{icon}</span>
            <span style={{ flex: 1 }}>{label}</span>
            {badge !== undefined && (
              <span className={`mk-badge ${danger ? "mk-badge-p0" : "mk-badge-info"}`}>{badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Top bar */}
      <div className="mk-topbar">
        <button
          className="mk-btn mk-btn-ghost"
          style={{ display: "none", height: 36, width: 36, padding: 0 }}
          id="mk-sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >☰</button>
        {topbarExtra}
        <div style={{ flex: 1 }} />
        <button className="mk-btn mk-btn-ghost" style={{ height: 36, width: 36, padding: 0 }} aria-label="Notifications">🔔</button>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--mk-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
          {subtitle.includes("Clinical") ? "DV" : "SA"}
        </div>
      </div>

      <main className="mk-main">{children}</main>
      <ToastContainer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REASON INPUT (mandatory for overrides/re-triage)
═══════════════════════════════════════════════════════════ */
export function ReasonInput({ value, onChange, placeholder = "State your reason (required)…", label = "Reason" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; label?: string;
}) {
  return (
    <div>
      <label className="mk-label">{label}</label>
      <textarea
        className={`mk-input ${!value.trim() ? "mk-input-error" : ""}`}
        style={{ height: 80, padding: "10px 12px", resize: "none" }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {!value.trim() && <p style={{ color: "var(--mk-danger)", fontSize: 11, marginTop: 2 }}>Required</p>}
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
    <div style={{ borderBottom: "1px solid var(--mk-border)", padding: "10px 0" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }} onClick={() => setExpanded(v => !v)}>
        <span className="mk-meta" style={{ whiteSpace: "nowrap", minWidth: 110 }}>{event.time}</span>
        <span className="mk-body" style={{ fontWeight: 600, flex: 1 }}>{event.action}</span>
        {event.caseId && <span className="mk-badge mk-badge-info">{event.caseId}</span>}
        <span className="mk-meta">{event.actor}</span>
        <span style={{ color: "var(--mk-text-muted)", fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 10, paddingLeft: 122, display: "flex", flexDirection: "column", gap: 4 }}>
          {event.before && <div className="mk-meta"><strong>Before:</strong> {event.before}</div>}
          {event.after && <div className="mk-meta"><strong>After:</strong> {event.after}</div>}
          {event.reason && <div className="mk-meta"><strong>Reason:</strong> {event.reason}</div>}
          {event.outcome && <div className="mk-meta"><strong>Outcome:</strong> {event.outcome}</div>}
        </div>
      )}
    </div>
  );
}
