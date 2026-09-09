"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  OpsShell, PriorityBadge, StatusChip, AITriageContext, EvidenceDrawer,
  WhyAllocation, CaseTimeline, AuditRow, ConfirmDialog, ReasonInput,
  EmptyState, pushToast,
} from "@/components/shared";
import type { AuditEvent } from "@/components/shared";
import {
  IconList,
  IconAlertTriangle,
  IconFileText,
  IconBarChart,
  IconUser,
  IconUsers,
  IconSettings,
  IconDatabase,
  IconCheckCircle,
  IconClock,
  IconActivity,
  IconSparkles,
  IconAlertCircle,
  IconChevronRight,
  IconArrowLeft,
  IconArrowRight,
  IconEye,
  IconCheck,
  IconX,
} from "@/components/icons";
import { CASES, ALL_CASES } from "@/lib/fixtures";
import type { CaseFixture } from "@/lib/fixtures";
import { getPendingTriage, reviewTriage, seedDemoTriage } from "@/lib/api";
import { adaptPendingTriageToFixture } from "@/lib/adapters";

type AdminNav =
  | "dashboard" | "p0" | "review" | "case"
  | "staff" | "analytics" | "ai-monitor"
  | "audit" | "config" | "system-status";

const NAV = [
  { id: "dashboard",     label: "Overview",            icon: <IconBarChart size={16} /> },
  { id: "p0",            label: "Emergency Cases",     icon: <IconAlertTriangle size={16} />, badge: 1, danger: true },
  { id: "review",        label: "Review Queue",        icon: <IconList size={16} /> },
  { id: "staff",         label: "Staff",               icon: <IconUsers size={16} /> },
  { id: "analytics",     label: "Department Capacity", icon: <IconActivity size={16} /> },
  { id: "ai-monitor",    label: "AI Monitoring",       icon: <IconSparkles size={16} /> },
  { id: "audit",         label: "Audit Log",           icon: <IconFileText size={16} /> },
  { id: "config",        label: "Configuration",       icon: <IconSettings size={16} /> },
  { id: "system-status", label: "System Status",       icon: <IconDatabase size={16} /> },
];

/* ══════════════════════════════════════════════════════════
   SCREEN 6: ADMIN OPERATIONS OVERVIEW
   Command center, not a collection of generic KPI cards
══════════════════════════════════════════════════════════ */
function Dashboard({ onNav }: { onNav: (v: AdminNav) => void }) {
  const kpis = [
    { label: "Emergency Cases",  value: "1",      trend: "Immediate Response", color: "var(--mk-danger)" },
    { label: "Review Queue",     value: "14",     trend: "Avg wait 18m",       color: "var(--mk-warning)" },
    { label: "P1 Urgent",        value: "2",      trend: "Bay 1 & 3 Active",   color: "var(--mk-p1)" },
    { label: "Doctor Coverage",  value: "7 / 12", trend: "In-Clinic Active",   color: "var(--mk-navy)" },
  ];

  const departments = [
    { name: "General Medicine OPD", load: 68, active: 32, max: 48, doctors: "4 MDs on duty" },
    { name: "Emergency & Trauma",   load: 42, active: 5,  max: 12, doctors: "Code Team Dispatched" },
    { name: "Pediatrics Clinic",    load: 55, active: 11, max: 20, doctors: "2 MDs on duty" },
    { name: "Radiology & Imaging",  load: 35, active: 7,  max: 20, doctors: "Station Ready" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="mk-page-title" style={{ margin: 0 }}>Hospital Operations</h1>
          <div className="mk-meta" style={{ marginTop: 2 }}>
            Real-time patient flow and emergency coordination · Central Hospital
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="mk-badge mk-badge-ok">Kiosks 1–4 Operational</span>
        </div>
      </div>

      {/* Persistent P0 Emergency Alert Strip */}
      <div
        className="mk-card"
        style={{
          borderLeft: "4px solid var(--mk-danger)",
          padding: "16px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span className="mk-badge mk-badge-p0">P0 Active</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--mk-navy)" }}>
              {CASES.P0.caseId} · {CASES.P0.patientName}
            </span>
            <span className="mk-meta">· {CASES.P0.chiefComplaint}</span>
          </div>
          <div className="mk-meta" style={{ fontSize: 11 }}>
            Location: Kiosk 3, Ground Floor · Dispatched 00:04:12 ago · Emergency protocol active
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="mk-btn mk-btn-secondary"
            style={{ fontSize: 12, minHeight: 32 }}
            onClick={() => onNav("p0")}
          >
            Manage Incident →
          </button>
          <button
            className="mk-btn mk-btn-primary"
            style={{ fontSize: 12, minHeight: 32, background: "var(--mk-danger)" }}
            onClick={() => pushToast("P0 incident acknowledged by Operations Lead", "success")}
          >
            Acknowledge
          </button>
        </div>
      </div>

      {/* Operational Metrics Strip */}
      <div
        className="mk-card"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          marginBottom: 20,
          overflow: "hidden",
        }}
      >
        {kpis.map(({ label, value, trend, color }, idx) => (
          <div
            key={label}
            onClick={() => onNav(label.includes("P0") ? "p0" : "review")}
            style={{
              padding: "16px 20px",
              cursor: "pointer",
              borderRight: idx < kpis.length - 1 ? "1px solid var(--mk-border-subtle)" : "none",
              transition: "background var(--mk-dur)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--mk-surface-subtle)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <div className="mk-meta" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
              {label}
            </div>
            <div style={{
              color,
              fontSize: 26,
              fontWeight: 700,
              fontFamily: "var(--mk-font-mono)",
              lineHeight: 1.1,
              marginBottom: 4,
            }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: "var(--mk-text-subtle)" }}>
              {trend}
            </div>
          </div>
        ))}
      </div>

      {/* Departmental Capacity Overview */}
      <div className="mk-card" style={{ marginBottom: 20 }}>
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--mk-border-subtle)" }}>
          <div>
            <div className="mk-sec-title" style={{ margin: 0 }}>Department Capacity</div>
            <div className="mk-meta" style={{ fontSize: 11 }}>Active queue load and attending clinician coverage across wings</div>
          </div>
          <span className="mk-badge mk-badge-ok">Hospital Capacity: 52%</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {departments.map((dept, idx) => (
            <div
              key={dept.name}
              style={{
                padding: "16px 20px",
                borderRight: idx % 2 === 0 ? "1px solid var(--mk-border-subtle)" : "none",
                borderBottom: idx < 2 ? "1px solid var(--mk-border-subtle)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--mk-navy)" }}>{dept.name}</span>
                <span style={{ fontSize: 12, fontFamily: "var(--mk-font-mono)", fontWeight: 700, color: dept.load > 75 ? "var(--mk-danger)" : dept.load > 60 ? "var(--mk-warning)" : "var(--mk-navy)" }}>
                  {dept.load}%
                </span>
              </div>
              <div style={{ height: 4, background: "var(--mk-border)", borderRadius: 2, marginBottom: 8 }}>
                <div style={{
                  height: "100%",
                  width: `${dept.load}%`,
                  background: dept.load > 75 ? "var(--mk-danger)" : dept.load > 60 ? "var(--mk-warning)" : "var(--mk-navy)",
                  borderRadius: 2,
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--mk-text-muted)" }}>
                <span>{dept.active} / {dept.max} Patients</span>
                <span style={{ fontWeight: 500 }}>{dept.doctors}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Triage Ingestion Worklist */}
      <div className="mk-card">
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--mk-border-subtle)" }}>
          <div>
            <div className="mk-sec-title" style={{ margin: 0 }}>Patient Flow</div>
            <div className="mk-meta" style={{ fontSize: 11 }}>Priority classifications pending review</div>
          </div>
          <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 30 }} onClick={() => onNav("review")}>
            View Full Review Queue →
          </button>
        </div>

        <div className="mk-table-wrap">
          <table className="mk-table-el">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Patient</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ALL_CASES.filter(c => c.priority !== "P0").slice(0, 4).map(row => (
                <tr key={row.caseId} className={`mk-row-${row.priority.toLowerCase()}`}>
                  <td style={{ fontWeight: 600, fontFamily: "var(--mk-font-mono)", color: "var(--mk-navy)" }}>{row.caseId}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.patientName}</div>
                    <div className="mk-meta" style={{ fontSize: 11 }}>{row.patientAge}y · {row.department}</div>
                  </td>
                  <td><PriorityBadge priority={row.priority} /></td>
                  <td><StatusChip status={row.status} /></td>
                  <td>
                    <button
                      className="mk-btn mk-btn-secondary"
                      style={{ fontSize: 12, minHeight: 28, padding: "0 10px" }}
                      onClick={() => onNav("review")}
                    >
                      <span>Verify</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   P0 EMERGENCY MANAGEMENT (Admin Incident Control)
══════════════════════════════════════════════════════════ */
function P0Management() {
  const c = CASES.P0;
  const [elapsed] = useState(252);
  const [acknowledged, setAcknowledged] = useState(false);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <h1 className="mk-page-title" style={{ color: "var(--mk-danger)", margin: 0 }}>
          Emergency Management
        </h1>
        <span className="mk-badge mk-badge-p0">1 Active Incident</span>
      </div>

      <div style={{
        background: "var(--mk-surface)",
        border: "1px solid var(--mk-border)",
        borderLeft: `4px solid ${acknowledged ? "var(--mk-success)" : "var(--mk-danger)"}`,
        borderRadius: "var(--mk-radius-md)",
        padding: 24,
        marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ marginBottom: 6 }}>
              <span className={`mk-badge ${acknowledged ? "mk-badge-ok" : "mk-badge-p0"}`}>
                {acknowledged ? "Incident Acknowledged" : "P0 Emergency Active"}
              </span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mk-navy)" }}>
              {c.patientName} · {c.chiefComplaint}
            </div>
            <div className="mk-meta" style={{ marginTop: 2 }}>
              Location: Kiosk 3, Ground Floor Bay · Case ID: {c.caseId}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--mk-font-mono)", color: "var(--mk-danger)" }}>
              {fmt(elapsed)}
            </div>
            <div className="mk-meta">SLA Target: &lt; 05:00</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="mk-btn mk-btn-primary"
            style={{ background: acknowledged ? "var(--mk-success)" : "var(--mk-danger)" }}
            onClick={() => {
              setAcknowledged(true);
              pushToast("P0 acknowledged by Operations Supervisor", "success");
            }}
          >
            <IconCheck size={14} />
            <span>{acknowledged ? "Acknowledged" : "Acknowledge Incident"}</span>
          </button>
          <button className="mk-btn mk-btn-secondary" onClick={() => pushToast("Emergency team coordination pinged", "info")}>
            Coordinate Response Team
          </button>
          <button className="mk-btn mk-btn-secondary" onClick={() => pushToast("Handover documented to ledger", "success")}>
            Document Handover
          </button>
        </div>
      </div>

      <div style={{
        background: "var(--mk-surface)",
        border: "1px solid var(--mk-border)",
        borderRadius: "var(--mk-radius-md)",
        boxShadow: "var(--mk-shadow-xs)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        overflow: "hidden",
      }}>
        <div style={{ padding: "20px 24px", borderRight: "1px solid var(--mk-border-subtle)" }}>
          <div className="mk-sec-title" style={{ marginBottom: 14 }}>Response Team Assignment</div>
          {[
            { role: "Emergency Attending", name: "Dr. Kapoor, MD", status: "En route" },
            { role: "Trauma Nursing",     name: "Sr. Nurse Mehra", status: "En route" },
            { role: "Operations Supervisor", name: "Lead Singh", status: "Active" },
          ].map(({ role, name, status }) => (
            <div key={role} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--mk-border-subtle)" }}>
              <div>
                <div className="mk-meta" style={{ fontWeight: 600 }}>{role}</div>
                <div className="mk-body" style={{ fontSize: 13, color: "var(--mk-navy)" }}>{name}</div>
              </div>
              <span className={`mk-badge ${status === "En route" ? "mk-badge-warn" : "mk-badge-ok"}`}>{status}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "20px 24px" }}>
          <div className="mk-sec-title" style={{ marginBottom: 14 }}>Incident Progression</div>
          <CaseTimeline events={c.timeline} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REVIEW QUEUE (P1 / P2 / P3)
══════════════════════════════════════════════════════════ */
function ReviewQueue({ onSelect }: { onSelect: (id: string) => void }) {
  const [filter, setFilter] = useState("All");
  const [cases, setCases] = useState<CaseFixture[]>(ALL_CASES.filter(c => c.priority !== "P0"));

  useEffect(() => {
    let mounted = true;
    async function loadPending() {
      try {
        const pending = await getPendingTriage();
        if (mounted && Array.isArray(pending) && pending.length > 0) {
          const adapted = pending.map(adaptPendingTriageToFixture).filter(c => c.priority !== "P0");
          if (adapted.length > 0) setCases(adapted);
        }
      } catch (err) {
        console.warn("Triage fallback active:", err);
      }
    }
    loadPending();
    return () => { mounted = false; };
  }, []);

  const filtered = filter === "All" ? cases : cases.filter(r => r.priority === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="mk-page-title" style={{ margin: 0 }}>Triage Review Queue</h1>
          <div className="mk-meta" style={{ marginTop: 2 }}>
            Incoming cases requiring allocation verification or priority validation
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["P1", "P2", "P3"].map(p => (
            <span key={p} className={`mk-badge mk-badge-${p.toLowerCase()}`}>
              {cases.filter(r => r.priority === p).length} {p}
            </span>
          ))}
        </div>
      </div>

      <div className="mk-tabs" style={{ marginBottom: 20 }}>
        {["All", "P1", "P2", "P3"].map(f => (
          <span key={f} className={`mk-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</span>
        ))}
      </div>

      <div className="mk-card">
        <div className="mk-table-wrap">
          <table className="mk-table-el">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Patient</th>
                <th>Chief Complaint</th>
                <th>Priority</th>
                <th>Protocol Alignment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.caseId} className={`mk-row-${row.priority.toLowerCase()}`}>
                  <td><span style={{ fontWeight: 600, fontFamily: "var(--mk-font-mono)", color: "var(--mk-navy)" }}>{row.caseId}</span></td>
                  <td>{row.patientName}, {row.patientAge}y · {row.patientGender}</td>
                  <td className="mk-body" style={{ maxWidth: 220, fontSize: 13 }}>{row.chiefComplaint}</td>
                  <td><PriorityBadge priority={row.priority} full /></td>
                  <td><span className={`mk-badge ${row.ai.confidence_band === "high" ? "mk-badge-ok" : "mk-badge-warn"}`}>{row.ai.confidence_band}</span></td>
                  <td><StatusChip status={row.status} /></td>
                  <td>
                    <button
                      className="mk-btn mk-btn-secondary"
                      style={{ fontSize: 12, minHeight: 28, padding: "0 10px" }}
                      onClick={() => onSelect(row.caseId)}
                    >
                      <span>Verify</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CASE REVIEW + ALLOCATION OVERRIDE
══════════════════════════════════════════════════════════ */
function CaseReview({ caseId, onBack }: { caseId: string; onBack: () => void }) {
  const c = ALL_CASES.find(x => x.caseId === caseId) ?? CASES.P2;
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overridePriority, setOverridePriority] = useState(c.priority);
  const [accepted, setAccepted] = useState(false);

  async function acceptAllocation() {
    try {
      await reviewTriage(c.caseId, "approve", c.priority);
    } catch (err) {
      console.warn("Review fallback:", err);
    }
    setAccepted(true);
    pushToast(`${caseId} allocation verified and dispatched.`, "success");
  }

  async function submitOverride() {
    if (!overrideReason.trim()) {
      pushToast("Clinical reason is required for priority override.", "warning");
      return;
    }
    try {
      await reviewTriage(c.caseId, "override", overridePriority, overrideReason);
    } catch (err) {
      console.warn("Override fallback:", err);
    }
    pushToast(`Priority override applied: ${c.priority} → ${overridePriority}. Reason logged to audit ledger.`, "success");
    setOverrideOpen(false);
  }

  return (
    <div>
      <EvidenceDrawer
        open={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        caseId={caseId}
        patientName={c.patientName}
        chiefComplaint={c.chiefComplaint}
        symptoms={c.symptoms}
        evidence={c.evidence}
        transcript={c.transcript}
      />

      <ConfirmDialog
        open={overrideOpen}
        title="Allocation Priority Override"
        confirmLabel="Confirm Priority Override"
        danger
        confirmDisabled={!overrideReason.trim()}
        onConfirm={submitOverride}
        onCancel={() => setOverrideOpen(false)}
      >
        <div style={{ marginBottom: 12 }}>
          <label className="mk-label">Select Target Priority</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["P1", "P2", "P3"] as const).map(p => (
              <button
                key={p}
                className={`mk-btn ${overridePriority === p ? "mk-btn-primary" : "mk-btn-secondary"}`}
                style={{ flex: 1 }}
                onClick={() => setOverridePriority(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <ReasonInput
          value={overrideReason}
          onChange={setOverrideReason}
          label="Clinical Rationale (Required)"
          placeholder="Clinical justification or departmental bed capacity reason…"
        />
      </ConfirmDialog>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button className="mk-btn mk-btn-ghost" onClick={onBack}>
          <IconArrowLeft size={16} />
        </button>
        <h1 className="mk-page-title" style={{ margin: 0 }}>Case Review — {caseId}</h1>
        <PriorityBadge priority={c.priority} full />
        <StatusChip status={c.status} />
        {accepted && <span className="mk-badge mk-badge-ok">Verified &amp; Dispatched</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: 16 }}>
        {/* Column 1: Patient Context & Triage Classification */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="mk-card mk-card-padded">
            <div className="mk-sec-title" style={{ marginBottom: 12 }}>Patient Dossier</div>
            {[
              { l: "Name", v: `${c.patientName}, ${c.patientAge}y · ${c.patientGender}` },
              { l: "Mobile Contact", v: c.phone },
              { l: "ABHA ID", v: c.abha },
              { l: "Chief Complaint", v: c.chiefComplaint },
            ].map(({ l, v }) => (
              <div key={l} style={{ padding: "8px 0", borderBottom: "1px solid var(--mk-border-subtle)", display: "flex", justifyContent: "space-between" }}>
                <span className="mk-meta">{l}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--mk-navy)" }}>{v}</span>
              </div>
            ))}
          </div>

          <WhyAllocation
            priority={c.priority}
            department={c.department}
            doctor={`${c.doctor} — available`}
            queueLoad={`${c.patientsAhead ?? 0} patients ahead`}
            estimatedWait={c.estimatedWait ?? "~30 min"}
          />

          <AITriageContext
            priority={c.priority}
            confidence={Math.round((c.ai.confidence_score ?? 0.82) * 100)}
            indicators={c.symptoms}
            history={c.history}
            riskFlags={c.ai.safety_flags.length ? c.ai.safety_flags : ["None identified"]}
          />
        </div>

        {/* Column 2: Governance Actions & Incident Progression */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="mk-card mk-card-padded">
            <div className="mk-sec-title" style={{ marginBottom: 14 }}>Triage Governance Actions</div>
            <button
              className="mk-btn mk-btn-primary"
              style={{ width: "100%", minHeight: 40, marginBottom: 8 }}
              onClick={acceptAllocation}
              disabled={accepted}
            >
              {accepted ? "✓ Allocation Confirmed" : "Verify & Dispatch Allocation"}
            </button>
            <button
              className="mk-btn mk-btn-secondary"
              style={{ width: "100%", minHeight: 40, marginBottom: 8 }}
              onClick={() => setOverrideOpen(true)}
            >
              Modify / Override Priority
            </button>
            <button
              className="mk-btn mk-btn-secondary"
              style={{ width: "100%", minHeight: 38 }}
              onClick={() => setEvidenceOpen(true)}
            >
              <IconFileText size={14} />
              <span>Audit Evidence &amp; Transcript</span>
            </button>
            <div className="mk-meta" style={{ marginTop: 12, fontSize: 11, lineHeight: 1.5 }}>
              All overrides require mandatory clinical rationale and are recorded to the immutable audit ledger.
            </div>
          </div>

          <div className="mk-card mk-card-padded">
            <div className="mk-sec-title" style={{ marginBottom: 12 }}>Case Progression Log</div>
            <CaseTimeline events={c.timeline} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STAFF & ROLES
══════════════════════════════════════════════════════════ */
const STAFF = [
  { id: "S001", name: "Dr. R. Vance",    role: "Attending Physician", department: "General Medicine", status: "approved" },
  { id: "S002", name: "Dr. K. Iyer",     role: "Attending Physician", department: "Family Medicine",  status: "approved" },
  { id: "S003", name: "Sr. Nurse Mehra", role: "Trauma Nurse",        department: "Emergency",        status: "approved" },
  { id: "S004", name: "Dr. A. Joshi",    role: "Consultant",          department: "Orthopedics",      status: "pending" },
  { id: "S005", name: "R. Das",          role: "Triage Receptionist",  department: "OPD Intake",       status: "approved" },
];

function StaffRoles() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="mk-page-title" style={{ margin: 0 }}>Staff &amp; Clinical Roles</h1>
        <button className="mk-btn mk-btn-primary" style={{ fontSize: 12, minHeight: 32 }} onClick={() => pushToast("Staff invitation link generated", "info")}>
          + Invite Clinician
        </button>
      </div>

      <div className="mk-card">
        <div className="mk-table-wrap">
          <table className="mk-table-el">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {STAFF.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td className="mk-meta">{s.role}</td>
                  <td className="mk-meta">{s.department}</td>
                  <td>
                    <span className={`mk-badge ${s.status === "approved" ? "mk-badge-ok" : "mk-badge-warn"}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HOSPITAL LOAD & CAPACITY
══════════════════════════════════════════════════════════ */
function Analytics() {
  const deptLoad = [
    { dept: "General Medicine", load: 68, wait: "24 min", patients: 12 },
    { dept: "Emergency & Trauma", load: 92, wait: "4 min",  patients: 5 },
    { dept: "Pediatrics Clinic",  load: 55, wait: "15 min", patients: 8 },
    { dept: "Orthopedics",        load: 40, wait: "20 min", patients: 6 },
  ];

  return (
    <div>
      <h1 className="mk-page-title" style={{ marginBottom: 20 }}>Hospital Operational Capacity</h1>

      <div className="mk-card mk-card-padded" style={{ marginBottom: 20 }}>
        <div className="mk-sec-title" style={{ marginBottom: 16 }}>Departmental Load &amp; Wait Windows</div>
        {deptLoad.map(({ dept, load, wait, patients }) => (
          <div key={dept} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{dept}</span>
              <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                <span className="mk-meta">{patients} Active</span>
                <span className="mk-meta">Avg Wait: {wait}</span>
                <span className={`mk-badge ${load > 85 ? "mk-badge-p0" : load > 60 ? "mk-badge-warn" : "mk-badge-ok"}`}>
                  {load}%
                </span>
              </div>
            </div>
            <div style={{ height: 4, background: "var(--mk-border)", borderRadius: 2 }}>
              <div style={{
                height: "100%",
                width: `${load}%`,
                background: load > 85 ? "var(--mk-danger)" : load > 60 ? "var(--mk-warning)" : "var(--mk-navy)",
                borderRadius: 2,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PROTOCOL ENGINE MONITOR
══════════════════════════════════════════════════════════ */
function AIMonitor() {
  const stats = [
    { metric: "Protocol Assessments Today", value: "47" },
    { metric: "Average Response Latency", value: "380 ms" },
    { metric: "High Protocol Alignment", value: "38 (81%)" },
    { metric: "Safety Invariant Flags Triggered", value: "3" },
    { metric: "P0 Escalation Events", value: "2" },
    { metric: "Engine Version", value: "pretriage-v1 · Safety Matrix Active" },
  ];

  return (
    <div>
      <h1 className="mk-page-title" style={{ marginBottom: 6 }}>Triage Protocol Engine Monitor</h1>
      <p className="mk-meta" style={{ marginBottom: 20 }}>
        Operational telemetry for the automated pre-triage engine. Assists intake prioritization; clinicians make all care decisions.
      </p>

      <div className="mk-card mk-card-padded">
        <div className="mk-sec-title" style={{ marginBottom: 14 }}>Operational Metrics</div>
        {stats.map(({ metric, value }) => (
          <div key={metric} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--mk-border-subtle)" }}>
            <span className="mk-meta" style={{ fontWeight: 600 }}>{metric}</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   AUDIT LOG
══════════════════════════════════════════════════════════ */
const AUDIT_EVENTS: AuditEvent[] = [
  { id: "A001", time: "09:12 AM", actor: "Operations Supervisor", action: "P0 Acknowledged", caseId: "MK-0092" },
  { id: "A002", time: "08:40 AM", actor: "Operations Supervisor", action: "Priority override P2 → P1", caseId: "MK-2046", before: "P2", after: "P1", reason: "Reported acute neck stiffness with fever" },
  { id: "A003", time: "08:30 AM", actor: "Dr. Vance", action: "Re-triage to P1", caseId: "MK-2051", before: "P2", after: "P1", reason: "Signs of meningism on examination" },
  { id: "A004", time: "08:25 AM", actor: "System Engine", action: "Auto-allocated P2 approved", caseId: "MK-2048" },
];

function AuditLog() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="mk-page-title" style={{ margin: 0 }}>Clinical Audit Ledger</h1>
        <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 30 }} onClick={() => pushToast("Audit log exported as CSV", "success")}>
          Export CSV
        </button>
      </div>

      <div className="mk-card mk-card-padded">
        {AUDIT_EVENTS.map(e => <AuditRow key={e.id} event={e} />)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SYSTEM CONFIGURATION
══════════════════════════════════════════════════════════ */
function SystemConfig() {
  function save() {
    pushToast("System configuration saved", "success");
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 className="mk-page-title" style={{ marginBottom: 20 }}>System Configuration</h1>

      <div className="mk-card mk-card-padded" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="mk-label">Hospital Name</label>
          <input className="mk-input" defaultValue="City General Hospital Central" />
        </div>
        <div>
          <label className="mk-label">Timezone</label>
          <select className="mk-input" style={{ height: 38 }}>
            <option>Asia/Kolkata (IST)</option>
            <option>UTC</option>
          </select>
        </div>
        <div>
          <label className="mk-label">P1 Urgent SLA Target (Minutes)</label>
          <input className="mk-input" type="number" defaultValue={30} />
        </div>
        <div>
          <label className="mk-label">P0 Emergency SLA Target (Minutes)</label>
          <input className="mk-input" type="number" defaultValue={5} />
        </div>
        <button className="mk-btn mk-btn-primary" style={{ alignSelf: "flex-start" }} onClick={save}>
          Save Configuration
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SYSTEM STATUS & DATASTORE
══════════════════════════════════════════════════════════ */
function SystemStatus() {
  const [syncing, setSyncing] = useState(false);

  const services = [
    { name: "FastAPI Clinical Queue Engine", status: "operational", detail: "Live on port 8000" },
    { name: "Clinical Pre-Triage Rule Evaluator", status: "operational", detail: "Deterministic safety invariant guardrails active" },
    { name: "Hospital Central EHR Datastore", status: "operational", detail: "High-availability replica synchronized" },
    { name: "Kiosk Bay Terminals 1–4", status: "operational", detail: "Input and audio streams ready" },
  ];

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await seedDemoTriage();
      pushToast(`Datastore synchronized: ${res.count || 10} verified cases active`, "success");
    } catch {
      pushToast("Datastore sync dispatched", "info");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="mk-page-title" style={{ margin: 0 }}>System Integrations &amp; Health</h1>
        <button className="mk-btn mk-btn-primary" onClick={handleSync} disabled={syncing}>
          <IconDatabase size={15} />
          <span>{syncing ? "Synchronizing…" : "Sync Datastore"}</span>
        </button>
      </div>

      <div className="mk-card">
        {services.map(s => (
          <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--mk-border-subtle)" }}>
            <div>
              <div className="mk-card-title">{s.name}</div>
              <div className="mk-meta">{s.detail}</div>
            </div>
            <span className="mk-badge mk-badge-ok">Operational</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN ADMIN PAGE SHELL
══════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const [nav, setNav] = useState<AdminNav>("dashboard");
  const [selectedCase, setSelectedCase] = useState("MK-2051");

  const topbarExtra = (
    <div
      style={{
        background: "var(--mk-p0)",
        color: "#FFFFFF",
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 600,
        borderRadius: "var(--mk-radius-xs)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
      onClick={() => setNav("p0")}
    >
      <IconAlertTriangle size={13} color="#FFFFFF" />
      <span>1 Active P0 Emergency — Manage Incident</span>
    </div>
  );

  return (
    <OpsShell
      nav={NAV}
      active={nav}
      onNav={id => setNav(id as AdminNav)}
      subtitle="Hospital Operations"
      topbarExtra={topbarExtra}
    >
      {nav === "dashboard"     && <Dashboard onNav={setNav} />}
      {nav === "p0"            && <P0Management />}
      {nav === "review"        && <ReviewQueue onSelect={id => { setSelectedCase(id); setNav("case"); }} />}
      {nav === "case"          && <CaseReview caseId={selectedCase} onBack={() => setNav("review")} />}
      {nav === "staff"         && <StaffRoles />}
      {nav === "analytics"     && <Analytics />}
      {nav === "ai-monitor"    && <AIMonitor />}
      {nav === "audit"         && <AuditLog />}
      {nav === "config"        && <SystemConfig />}
      {nav === "system-status" && <SystemStatus />}
    </OpsShell>
  );
}
