"use client";
import { useState } from "react";
import {
  OpsShell, PriorityBadge, StatusChip, AITriageContext, EvidenceDrawer,
  WhyAllocation, CaseTimeline, AuditRow, ConfirmDialog, ReasonInput,
  EmptyState, pushToast,
} from "@/components/shared";
import type { AuditEvent } from "@/components/shared";
import { CASES, ALL_CASES } from "@/lib/fixtures";

type AdminNav =
  | "dashboard" | "p0" | "review" | "case"
  | "staff" | "analytics" | "ai-monitor"
  | "audit" | "config" | "system-status";

const NAV = [
  { id: "dashboard",     label: "Overview",        icon: "◎" },
  { id: "p0",            label: "P0 Emergency",    icon: "🚨", badge: 1, danger: true },
  { id: "review",        label: "Review Queue",    icon: "☰" },
  { id: "staff",         label: "Staff & Roles",   icon: "👥" },
  { id: "analytics",     label: "Analytics",       icon: "📊" },
  { id: "ai-monitor",    label: "AI Monitoring",   icon: "🤖" },
  { id: "audit",         label: "Audit Log",       icon: "📋" },
  { id: "config",        label: "Configuration",   icon: "⚙️" },
  { id: "system-status", label: "System Status",   icon: "🟢" },
];

/* ══════════════════════════════════════════════════════════
   DASHBOARD / OVERVIEW
══════════════════════════════════════════════════════════ */
function Dashboard({ onNav }: { onNav: (v: AdminNav) => void }) {
  const kpis = [
    { label: "Active P0",           value: "1",      color: "var(--mk-danger)",      icon: "🚨" },
    { label: "Review Queue",        value: "14",     color: "var(--mk-warning)",     icon: "⏳" },
    { label: "P1 Urgent",           value: "2",      color: "var(--mk-p1)",          icon: "⬆" },
    { label: "Doctor Availability", value: "7 / 12", color: "var(--mk-success)",     icon: "👩‍⚕️" },
    { label: "Clarification Pending","value": "3",   color: "var(--mk-info)",        icon: "❓" },
    { label: "Avg Wait (min)",       value: "28",    color: "var(--mk-text-muted)",  icon: "⏱" },
  ];

  return (
    <div>
      <h1 className="mk-page-title" style={{ marginBottom: 20 }}>Operations Overview</h1>

      {/* P0 persistent lane */}
      <div className="mk-p0-alert" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="mk-p0-banner" style={{ display: "inline-flex", marginBottom: 8 }}>⚠ P0 Emergency Active</div>
            <div className="mk-card-title">MK-0092 · {CASES.P0.patientName} · {CASES.P0.chiefComplaint}</div>
            <div className="mk-meta">Detected 00:04:12 ago · Emergency team dispatched · Acknowledgement pending</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="mk-btn mk-btn-secondary" onClick={() => onNav("p0")}>Manage →</button>
            <button className="mk-btn mk-btn-danger" onClick={() => pushToast("P0 acknowledged", "success")}>Acknowledge</button>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="mk-kpi-grid" style={{ marginBottom: 24 }}>
        {kpis.map(({ label, value, color, icon }) => (
          <div className="mk-kpi" key={label} onClick={() => onNav(label.includes("P0") ? "p0" : "review")} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="mk-meta" style={{ fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 18 }}>{icon}</span>
            </div>
            <div className="mk-kpi-value" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Recent queue preview */}
      <div className="mk-card">
        <div style={{ padding: "16px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="mk-sec-title">Recent Review Queue</div>
          <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 32 }} onClick={() => onNav("review")}>View All →</button>
        </div>
        <div className="mk-table-wrap">
          <table className="mk-table-el">
            <thead><tr><th>Case ID</th><th>Patient</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {ALL_CASES.filter(c => c.priority !== "P0").slice(0,4).map(row => (
                <tr key={row.caseId}>
                  <td><span style={{ fontWeight: 600, color: "var(--mk-primary)" }}>{row.caseId}</span></td>
                  <td>{row.patientName}</td>
                  <td><PriorityBadge priority={row.priority} full /></td>
                  <td><StatusChip status={row.status} /></td>
                  <td><button className="mk-btn mk-btn-primary" style={{ fontSize: 12, minHeight: 32, padding: "0 12px" }} onClick={() => onNav("review")}>Review</button></td>
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
   P0 EMERGENCY MANAGEMENT
══════════════════════════════════════════════════════════ */
function P0Management() {
  const c = CASES.P0;
  const [elapsed] = useState(252); // 4:12 in seconds
  const [acknowledged, setAcknowledged] = useState(false);
  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 className="mk-page-title" style={{ color: "var(--mk-danger)" }}>P0 Emergency Management</h1>
        <span className="mk-badge mk-badge-p0">1 Active</span>
      </div>

      <div className="mk-p0-alert" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
          <div>
            <div className="mk-p0-banner" style={{ marginBottom: 8 }}>⚠ {c.caseId} — Emergency Active</div>
            <div className="mk-card-title">{c.patientName} · {c.chiefComplaint}</div>
            <div className="mk-meta">Location: Kiosk 3, Ground Floor · {acknowledged ? "Acknowledged" : "Acknowledgement pending"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "var(--mk-danger)" }}>{fmt(elapsed)}</div>
            <div className="mk-meta">Response timer</div>
            <div className="mk-meta" style={{ color: elapsed < 300 ? "var(--mk-success)" : "var(--mk-danger)" }}>
              SLA: 5 min {elapsed < 300 ? "✓" : "⚠ Overrun"}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Emergency team",      value: "Dispatched — en route" },
            { label: "Clinical staff",      value: "Dr. Vance, Dr. Kapoor notified" },
            { label: "Patient instruction", value: "Remain at kiosk location" },
            { label: "SLA target",          value: "Response within 5 minutes" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="mk-meta" style={{ fontWeight: 600 }}>{label}</div>
              <div className="mk-body">{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="mk-btn mk-btn-danger" onClick={() => { setAcknowledged(true); pushToast("P0 acknowledged — audit event recorded", "success"); }}>
            {acknowledged ? "✓ Acknowledged" : "Acknowledge"}
          </button>
          <button className="mk-btn mk-btn-secondary" onClick={() => pushToast("Team coordination sent", "info")}>Coordinate Team</button>
          <button className="mk-btn mk-btn-secondary" onClick={() => pushToast("Delayed response escalation raised", "warning")}>Escalate Delay</button>
          <button className="mk-btn mk-btn-secondary" onClick={() => pushToast("Handover documented", "success")}>Document Handover</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="mk-card mk-card-padded">
          <div className="mk-sec-title" style={{ marginBottom: 12 }}>Team Assignment</div>
          {[
            { role: "Emergency Lead", name: "Dr. Kapoor", status: "En route" },
            { role: "Nursing",        name: "Sr. Nurse Mehra", status: "En route" },
            { role: "Admin Contact",  name: "Mr. Singh",   status: "Available" },
          ].map(({ role, name, status }) => (
            <div key={role} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--mk-border)" }}>
              <div><div className="mk-meta" style={{ fontWeight: 600 }}>{role}</div><div className="mk-body">{name}</div></div>
              <span className={`mk-badge ${status === "En route" ? "mk-badge-warn" : "mk-badge-ok"}`}>{status}</span>
            </div>
          ))}
          <button className="mk-btn mk-btn-secondary" style={{ marginTop: 12, width: "100%" }}>+ Assign Additional Staff</button>
        </div>

        <div className="mk-card mk-card-padded">
          <div className="mk-sec-title" style={{ marginBottom: 12 }}>P0 Event Timeline</div>
          <CaseTimeline events={c.timeline} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <p className="mk-meta" style={{ color: "var(--mk-danger)" }}>
          ⚠ P0 is automatic — does not require admin approval before dispatch. Admin role: coordination, acknowledgement, and resolution tracking.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REVIEW QUEUE (P1 / P2 / P3)
══════════════════════════════════════════════════════════ */
function ReviewQueue({ onSelect }: { onSelect: (id: string) => void }) {
  const [filter, setFilter] = useState("All");
  const rows = ALL_CASES.filter(c => c.priority !== "P0");
  const filtered = filter === "All" ? rows : rows.filter(r => r.priority === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 className="mk-page-title">Review Queue (P1 / P2 / P3)</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {["P1","P2","P3"].map(p => (
            <span key={p} className={`mk-badge mk-badge-${p.toLowerCase()}`}>{rows.filter(r=>r.priority===p).length} {p}</span>
          ))}
        </div>
      </div>

      <div className="mk-tabs" style={{ marginBottom: 20 }}>
        {["All","P1","P2","P3"].map(f => (
          <span key={f} className={`mk-tab ${filter===f?"active":""}`} onClick={()=>setFilter(f)}>{f}</span>
        ))}
      </div>

      <div className="mk-card">
        <div className="mk-table-wrap">
          <table className="mk-table-el">
            <thead>
              <tr><th>Case ID</th><th>Patient</th><th>Chief Complaint</th><th>Priority</th><th>Confidence</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.caseId}>
                  <td><span style={{ fontWeight: 600, color: "var(--mk-primary)" }}>{row.caseId}</span></td>
                  <td>{row.patientName}, {row.patientAge}{row.patientGender}</td>
                  <td className="mk-meta" style={{ maxWidth: 200 }}>{row.chiefComplaint}</td>
                  <td><PriorityBadge priority={row.priority} full /></td>
                  <td><span className={`mk-badge ${row.ai.confidence_band==="high"?"mk-badge-ok":"mk-badge-warn"}`}>{row.ai.confidence_band}</span></td>
                  <td><StatusChip status={row.status} /></td>
                  <td><button className="mk-btn mk-btn-primary" style={{ fontSize:12, minHeight:32, padding:"0 12px" }} onClick={()=>onSelect(row.caseId)}>Review</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7}><EmptyState icon="✅" title="Queue is clear" /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CASE REVIEW + ALLOCATION
══════════════════════════════════════════════════════════ */
function CaseReview({ caseId, onBack }: { caseId: string; onBack: () => void }) {
  const c = ALL_CASES.find(x => x.caseId === caseId) ?? CASES.P2;
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overridePriority, setOverridePriority] = useState(c.priority);
  const [accepted, setAccepted] = useState(false);

  function acceptAllocation() {
    setAccepted(true);
    pushToast(`${caseId} allocation accepted — Patient and Doctor notified`, "success");
  }

  function submitOverride() {
    if (!overrideReason.trim()) return;
    pushToast(`Override applied: ${c.priority} → ${overridePriority} · Reason logged · Audit event created · Patient and Doctor notified`, "success");
    setOverrideOpen(false);
  }

  return (
    <div>
      <EvidenceDrawer open={evidenceOpen} onClose={() => setEvidenceOpen(false)} caseId={caseId} />

      {/* Override dialog */}
      <ConfirmDialog open={overrideOpen} title="Modify Allocation / Priority Override"
        confirmLabel="Confirm Override" danger
        onConfirm={submitOverride} onCancel={() => setOverrideOpen(false)}>
        <div style={{ marginBottom: 12 }}>
          <label className="mk-label">New Priority</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["P1","P2","P3"] as const).map(p => (
              <button key={p} className={`mk-btn ${overridePriority===p?"mk-btn-primary":"mk-btn-secondary"}`}
                style={{ flex:1 }} onClick={() => setOverridePriority(p)}>{p}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="mk-label">Reassign to Doctor (optional)</label>
          <select className="mk-input" style={{ height: 40 }}>
            <option>Dr. R. Vance (current)</option><option>Dr. K. Iyer</option><option>Dr. M. Sharma</option>
          </select>
        </div>
        <ReasonInput value={overrideReason} onChange={setOverrideReason} label="Override reason (required)" placeholder="State clinical or operational reason…" />
        <p className="mk-meta" style={{ marginTop: 8 }}>
          This creates a before/after audit event, notifies patient and doctor, and updates queue state immediately.
        </p>
      </ConfirmDialog>

      {/* Clarify dialog */}
      <ConfirmDialog open={clarifyOpen} title="Request Clarification"
        confirmLabel="Send Request" onConfirm={() => { pushToast(`Clarification request sent for ${caseId}`, "info"); setClarifyOpen(false); }}
        onCancel={() => setClarifyOpen(false)}>
        <label className="mk-label">Clarification question</label>
        <textarea className="mk-input" style={{ height: 80, padding: "10px 12px", resize: "none" }}
          placeholder="What additional information is needed?" />
      </ConfirmDialog>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button className="mk-btn mk-btn-ghost" onClick={onBack}>←</button>
        <h1 className="mk-page-title">Case Review — {caseId}</h1>
        <PriorityBadge priority={c.priority} full />
        <StatusChip status={c.status} />
        {accepted && <span className="mk-badge mk-badge-ok">✓ Allocation Accepted</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {/* Column 1: patient + AI */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="mk-card mk-card-padded">
            <div className="mk-sec-title" style={{ marginBottom: 12 }}>Patient Details</div>
            {[
              { l: "Name", v: `${c.patientName}, ${c.patientAge}${c.patientGender}` },
              { l: "Phone", v: c.phone },
              { l: "ABHA", v: c.abha },
              { l: "Case ID", v: c.caseId },
              { l: "Chief complaint", v: c.chiefComplaint },
              { l: "Submitted", v: new Date(c.intakeSubmittedAt).toLocaleString("en-IN") },
            ].map(({ l, v }) => (
              <div key={l} style={{ padding: "6px 0", borderBottom: "1px solid var(--mk-border)" }}>
                <span className="mk-meta" style={{ fontWeight: 600 }}>{l}: </span><span className="mk-body">{v}</span>
              </div>
            ))}
          </div>
          <AITriageContext priority={c.priority} confidence={Math.round((c.ai.confidence_score??0.82)*100)}
            indicators={c.symptoms} history={c.history}
            riskFlags={c.ai.safety_flags.length?c.ai.safety_flags:["None identified"]} />
          <button className="mk-btn mk-btn-secondary" onClick={() => setEvidenceOpen(true)}>📎 Evidence &amp; Source Records</button>
        </div>

        {/* Column 2: allocation */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <WhyAllocation priority={c.priority} department={c.department} doctor={`${c.doctor} — available`}
            queueLoad={`${c.patientsAhead ?? 0} patients ahead`} estimatedWait={c.estimatedWait ?? "~30 min"} />
          <div className="mk-card mk-card-padded">
            <div className="mk-sec-title" style={{ marginBottom: 12 }}>Allocation Recommendation</div>
            {[
              { l: "Doctor", v: c.doctor },
              { l: "Department", v: c.department },
              { l: "Token", v: c.token ?? "—" },
              { l: "ETA", v: c.estimatedWait ?? "—" },
            ].map(({ l, v }) => (
              <div key={l} style={{ padding: "6px 0", borderBottom: "1px solid var(--mk-border)" }}>
                <span className="mk-meta" style={{ fontWeight: 600 }}>{l}: </span><span className="mk-body">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: actions + timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="mk-card mk-card-padded">
            <div className="mk-sec-title" style={{ marginBottom: 12 }}>Admin Actions</div>
            <button className="mk-btn mk-btn-primary" style={{ width: "100%", marginBottom: 10 }} onClick={acceptAllocation}
              disabled={accepted}>
              {accepted ? "✓ Allocation Accepted" : "✅ Accept Allocation"}
            </button>
            <button className="mk-btn mk-btn-secondary" style={{ width: "100%", marginBottom: 10 }} onClick={() => setOverrideOpen(true)}>
              ✏ Modify / Override
            </button>
            <button className="mk-btn mk-btn-secondary" style={{ width: "100%", marginBottom: 10 }} onClick={() => setClarifyOpen(true)}>
              ❓ Request Clarification
            </button>
            <div className="mk-divider" />
            <div className="mk-meta" style={{ marginTop: 12, lineHeight: 1.6 }}>
              Every override requires a reason. This creates a before/after audit event, notifies the patient and doctor, and updates queue state.
            </div>
          </div>

          <div className="mk-card mk-card-padded">
            <div className="mk-sec-title" style={{ marginBottom: 12 }}>Event Timeline</div>
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
type CredStatus = "pending" | "approved" | "rejected" | "suspended";

interface StaffMember {
  id: string; name: string; role: string; department: string;
  status: CredStatus; joined: string; email: string;
}

const STAFF: StaffMember[] = [
  { id:"S001", name:"Dr. R. Vance",    role:"Doctor",       department:"General Medicine", status:"approved",  joined:"2023-03-01", email:"r.vance@hosp.in" },
  { id:"S002", name:"Dr. K. Iyer",     role:"Doctor",       department:"Family Medicine",  status:"approved",  joined:"2022-11-15", email:"k.iyer@hosp.in" },
  { id:"S003", name:"Sr. Nurse Mehra", role:"Nurse",        department:"Emergency",        status:"approved",  joined:"2021-06-20", email:"mehra@hosp.in" },
  { id:"S004", name:"Dr. A. Joshi",    role:"Doctor",       department:"Orthopedics",      status:"pending",   joined:"2024-09-30", email:"a.joshi@hosp.in" },
  { id:"S005", name:"R. Das",          role:"Reception",    department:"OPD",              status:"approved",  joined:"2023-08-01", email:"r.das@hosp.in" },
  { id:"S006", name:"Dr. S. Kumar",    role:"Doctor",       department:"Cardiology",       status:"rejected",  joined:"2024-07-01", email:"s.kumar@hosp.in" },
  { id:"S007", name:"T. Bose",         role:"Nurse",        department:"ICU",              status:"suspended", joined:"2022-01-10", email:"t.bose@hosp.in" },
];

const STATUS_BADGE: Record<CredStatus, string> = {
  pending:"mk-badge-warn", approved:"mk-badge-ok", rejected:"mk-badge-p0", suspended:"mk-badge-p1",
};

function StaffRoles() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState<{ action: CredStatus; member: StaffMember } | null>(null);

  const statuses: CredStatus[] = ["pending", "approved", "rejected", "suspended"];
  const filtered = filter === "All" ? STAFF : STAFF.filter(s => s.status === filter);

  function doAction(member: StaffMember, action: CredStatus) {
    if (!actionReason.trim()) return;
    pushToast(`${member.name}: credential ${action} · Reason logged · Notification sent`, action === "approved" ? "success" : "warning");
    setConfirmOpen(null);
    setActionReason("");
  }

  return (
    <div>
      <ConfirmDialog
        open={!!confirmOpen}
        title={`${confirmOpen?.action.charAt(0).toUpperCase()}${confirmOpen?.action.slice(1)} — ${confirmOpen?.member.name}`}
        confirmLabel="Confirm"
        danger={confirmOpen?.action === "rejected" || confirmOpen?.action === "suspended"}
        onConfirm={() => confirmOpen && doAction(confirmOpen.member, confirmOpen.action)}
        onCancel={() => setConfirmOpen(null)}>
        <ReasonInput value={actionReason} onChange={setActionReason} label="Reason (required)" />
      </ConfirmDialog>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 className="mk-page-title">Staff &amp; Roles</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {statuses.map(s => (
            <span key={s} className={`mk-badge ${STATUS_BADGE[s]}`}>{STAFF.filter(x=>x.status===s).length} {s}</span>
          ))}
          <button className="mk-btn mk-btn-primary" style={{ fontSize:12, minHeight:32 }} onClick={() => pushToast("Invite sent", "success")}>+ Invite Staff</button>
        </div>
      </div>

      <div className="mk-tabs" style={{ marginBottom: 20 }}>
        {["All", ...statuses].map(f => (
          <span key={f} className={`mk-tab ${filter===f?"active":""}`} onClick={() => setFilter(f)} style={{ textTransform: "capitalize" }}>{f}</span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,340px)", gap: 16 }}>
        <div className="mk-card">
          <div className="mk-table-wrap">
            <table className="mk-table-el">
              <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Joined</th><th>Credential</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => setSelected(s)}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td className="mk-meta">{s.role}</td>
                    <td className="mk-meta">{s.department}</td>
                    <td className="mk-meta">{s.joined}</td>
                    <td><span className={`mk-badge ${STATUS_BADGE[s.status]}`} style={{ textTransform: "capitalize" }}>{s.status}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        {s.status === "pending" && <>
                          <button className="mk-btn mk-btn-primary" style={{ fontSize:11, minHeight:28, padding:"0 8px" }} onClick={e => { e.stopPropagation(); setConfirmOpen({ action:"approved", member:s }); }}>Approve</button>
                          <button className="mk-btn mk-btn-danger" style={{ fontSize:11, minHeight:28, padding:"0 8px" }} onClick={e => { e.stopPropagation(); setConfirmOpen({ action:"rejected", member:s }); }}>Reject</button>
                        </>}
                        {s.status === "approved" && (
                          <button className="mk-btn mk-btn-secondary" style={{ fontSize:11, minHeight:28, padding:"0 8px" }} onClick={e => { e.stopPropagation(); setConfirmOpen({ action:"suspended", member:s }); }}>Suspend</button>
                        )}
                        {s.status === "suspended" && (
                          <button className="mk-btn mk-btn-secondary" style={{ fontSize:11, minHeight:28, padding:"0 8px" }} onClick={e => { e.stopPropagation(); setConfirmOpen({ action:"approved", member:s }); }}>Reinstate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected ? (
          <div className="mk-card mk-card-padded">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="mk-sec-title">{selected.name}</div>
              <button className="mk-btn mk-btn-ghost" style={{ height:28, width:28, padding:0 }} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="mk-divider" style={{ margin: "12px 0" }} />
            {[
              { l:"Role", v:selected.role }, { l:"Department", v:selected.department },
              { l:"Email", v:selected.email }, { l:"Joined", v:selected.joined },
            ].map(({ l, v }) => (
              <div key={l} style={{ padding:"6px 0", borderBottom:"1px solid var(--mk-border)" }}>
                <div className="mk-meta" style={{ fontWeight:600 }}>{l}</div>
                <div className="mk-body">{v}</div>
              </div>
            ))}
            <div style={{ marginTop:16 }}>
              <div className="mk-meta" style={{ fontWeight:600, marginBottom:8 }}>Credential status</div>
              <span className={`mk-badge ${STATUS_BADGE[selected.status]}`} style={{ textTransform:"capitalize", fontSize:13 }}>{selected.status}</span>
            </div>
          </div>
        ) : (
          <div className="mk-card"><EmptyState icon="👤" title="Select a staff member" desc="Click a row to view details" /></div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ANALYTICS & HOSPITAL LOAD
══════════════════════════════════════════════════════════ */
function Analytics() {
  const deptLoad = [
    { dept: "General Medicine", load: 78, wait: "28 min", patients: 12 },
    { dept: "Emergency",        load: 95, wait: "5 min",  patients: 4  },
    { dept: "Family Medicine",  load: 42, wait: "10 min", patients: 6  },
    { dept: "Orthopedics",      load: 60, wait: "22 min", patients: 9  },
    { dept: "Cardiology",       load: 88, wait: "35 min", patients: 7  },
  ];

  return (
    <div>
      <h1 className="mk-page-title" style={{ marginBottom: 20 }}>Hospital Load &amp; Analytics</h1>

      {/* Operational KPIs */}
      <div className="mk-kpi-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Patients Today", value: "47",    color: "var(--mk-navy)" },
          { label: "P0 Events Today",      value: "2",     color: "var(--mk-danger)" },
          { label: "P1 Urgent Today",      value: "8",     color: "var(--mk-p1)" },
          { label: "Avg AI Confidence",    value: "84%",   color: "var(--mk-success)" },
          { label: "Avg Wait (min)",        value: "24",    color: "var(--mk-primary)" },
          { label: "Consultations Done",   value: "31",    color: "var(--mk-success)" },
        ].map(({ label, value, color }) => (
          <div className="mk-kpi" key={label}>
            <div className="mk-meta" style={{ fontWeight:600, marginBottom:8 }}>{label}</div>
            <div className="mk-kpi-value" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Department load */}
      <div className="mk-card mk-card-padded" style={{ marginBottom: 24 }}>
        <div className="mk-sec-title" style={{ marginBottom: 16 }}>Department Load</div>
        {deptLoad.map(({ dept, load, wait, patients }) => (
          <div key={dept} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="mk-body" style={{ fontWeight:600 }}>{dept}</span>
              <div style={{ display: "flex", gap: 12 }}>
                <span className="mk-meta">{patients} patients</span>
                <span className="mk-meta">Wait: {wait}</span>
                <span className={`mk-badge ${load > 85 ? "mk-badge-p0" : load > 70 ? "mk-badge-warn" : "mk-badge-ok"}`}>{load}%</span>
              </div>
            </div>
            <div style={{ height: 6, background: "var(--mk-border)", borderRadius: 3 }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: load > 85 ? "var(--mk-danger)" : load > 70 ? "var(--mk-warning)" : "var(--mk-success)",
                width: `${load}%`, transition: "width 600ms var(--mk-ease)",
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Priority distribution */}
      <div className="mk-card mk-card-padded">
        <div className="mk-sec-title" style={{ marginBottom: 16 }}>Priority Distribution Today</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { p: "P0", count: 2, pct: 4, cls: "mk-badge-p0" },
            { p: "P1", count: 8, pct: 17, cls: "mk-badge-p1" },
            { p: "P2", count: 27, pct: 57, cls: "mk-badge-p2" },
            { p: "P3", count: 10, pct: 21, cls: "mk-badge-p3" },
          ].map(({ p, count, pct, cls }) => (
            <div key={p} className="mk-card" style={{ padding: 16, textAlign: "center" }}>
              <span className={`mk-badge ${cls}`} style={{ fontSize: 13 }}>{p}</span>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: "var(--mk-navy)" }}>{count}</div>
              <div className="mk-meta">{pct}% of total</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   AI MONITORING (operational — not diagnosis)
══════════════════════════════════════════════════════════ */
function AIMonitor() {
  const modelStats = [
    { metric: "Assessments today", value: "47" },
    { metric: "Avg confidence",    value: "84%" },
    { metric: "High confidence",   value: "38 (81%)" },
    { metric: "Medium confidence", value: "7 (15%)" },
    { metric: "Low confidence",    value: "2 (4%)" },
    { metric: "Human review flagged", value: "9" },
    { metric: "Safety flags raised", value: "3" },
    { metric: "P0 triggers",       value: "2" },
    { metric: "Assessment failures","value": "0" },
    { metric: "Avg latency",       value: "420 ms" },
    { metric: "Model version",     value: "pretriage-v1 · v1.2.0" },
    { metric: "Last updated",      value: "14 Oct 2024, 09:00 AM" },
  ];

  const recentEvents = [
    { time: "09:10 AM", event: "P0 safety flag triggered", caseId: "MK-0092", band: "high", action: "Automatic emergency protocol activated" },
    { time: "08:55 AM", event: "Low confidence — human review flagged", caseId: "MK-2046", band: "medium", action: "Admin review required" },
    { time: "08:25 AM", event: "P2 assessment completed", caseId: "MK-2048", band: "high", action: "Auto-allocated" },
  ];

  return (
    <div>
      <h1 className="mk-page-title" style={{ marginBottom: 8 }}>AI Monitoring</h1>
      <p className="mk-meta" style={{ marginBottom: 20 }}>
        Operational monitoring of the AI pre-triage engine. This is not a clinical or diagnosis view — all clinical decisions are made by doctors.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="mk-card mk-card-padded">
          <div className="mk-sec-title" style={{ marginBottom: 16 }}>Model Performance — Today</div>
          {modelStats.map(({ metric, value }) => (
            <div key={metric} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid var(--mk-border)" }}>
              <span className="mk-meta" style={{ fontWeight:600 }}>{metric}</span>
              <span className="mk-body">{value}</span>
            </div>
          ))}
        </div>

        <div className="mk-card mk-card-padded">
          <div className="mk-sec-title" style={{ marginBottom: 16 }}>Recent AI Events</div>
          {recentEvents.map(({ time, event, caseId, band, action }) => (
            <div key={caseId} style={{ padding:"10px 0", borderBottom:"1px solid var(--mk-border)" }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                <span className="mk-meta">{time}</span>
                <span className={`mk-badge ${band==="high"?"mk-badge-ok":band==="medium"?"mk-badge-warn":"mk-badge-p1"}`}>{band}</span>
                <span className="mk-badge mk-badge-info">{caseId}</span>
              </div>
              <div className="mk-body" style={{ fontWeight:600 }}>{event}</div>
              <div className="mk-meta">{action}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mk-card mk-card-padded" style={{ background:"var(--mk-primary-soft)" }}>
        <div className="mk-sec-title" style={{ marginBottom:8 }}>Confidence Distribution Today</div>
        {[
          { label:"High (≥80%)", pct:81, cls:"var(--mk-success)" },
          { label:"Medium (50–79%)", pct:15, cls:"var(--mk-warning)" },
          { label:"Low (<50%)", pct:4, cls:"var(--mk-danger)" },
        ].map(({ label, pct, cls }) => (
          <div key={label} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span className="mk-meta">{label}</span>
              <span className="mk-meta" style={{ fontWeight:600 }}>{pct}%</span>
            </div>
            <div style={{ height:6, background:"var(--mk-border)", borderRadius:3 }}>
              <div style={{ height:"100%", borderRadius:3, background:cls, width:`${pct}%` }} />
            </div>
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
  { id:"A001", time:"09:12 AM", actor:"Admin (SA)", action:"P0 Acknowledged", caseId:"MK-0092" },
  { id:"A002", time:"08:40 AM", actor:"Admin (SA)", action:"Priority override P2 → P1", caseId:"MK-2046", before:"P2", after:"P1", reason:"Neck stiffness — urgent re-assessment needed" },
  { id:"A003", time:"08:30 AM", actor:"Dr. Vance",  action:"Re-triage to P1", caseId:"MK-2051", before:"P2", after:"P1", reason:"Meningism signs on examination" },
  { id:"A004", time:"08:25 AM", actor:"System",     action:"Auto-allocated — P2 approved", caseId:"MK-2048" },
  { id:"A005", time:"08:14 AM", actor:"System",     action:"AI triage completed", caseId:"MK-2051", outcome:"P1 · confidence 89%" },
  { id:"A006", time:"08:13 AM", actor:"System",     action:"Patient intake submitted", caseId:"MK-2051" },
];

function AuditLog() {
  const [search, setSearch] = useState("");
  const [actorFilter, setActorFilter] = useState("All");
  const actors = ["All", "Admin (SA)", "System", "Dr. Vance"];

  const filtered = AUDIT_EVENTS.filter(e => {
    const matchSearch = !search || JSON.stringify(e).toLowerCase().includes(search.toLowerCase());
    const matchActor = actorFilter === "All" || e.actor === actorFilter;
    return matchSearch && matchActor;
  });

  return (
    <div>
      <h1 className="mk-page-title" style={{ marginBottom: 20 }}>Audit Log</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input className="mk-input" style={{ flex:1, minWidth:200 }} placeholder="Search events, case IDs, actors…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="mk-input" style={{ width:180, height:40 }} value={actorFilter} onChange={e => setActorFilter(e.target.value)}>
          {actors.map(a => <option key={a}>{a}</option>)}
        </select>
        <button className="mk-btn mk-btn-secondary" onClick={() => pushToast("Exported to CSV", "success")}>⬇ Export CSV</button>
      </div>

      <div className="mk-card mk-card-padded">
        {filtered.length === 0
          ? <EmptyState icon="🔍" title="No matching events" />
          : filtered.map(e => <AuditRow key={e.id} event={e} />)
        }
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SYSTEM CONFIGURATION
══════════════════════════════════════════════════════════ */
function SystemConfig() {
  const [tab, setTab] = useState("hospital");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); pushToast("Configuration saved", "success"); setTimeout(() => setSaved(false), 2000); }, 1000);
  }

  const tabs = ["hospital", "queue", "kiosk", "notifications", "integrations"];

  return (
    <div>
      <h1 className="mk-page-title" style={{ marginBottom: 20 }}>System Configuration</h1>
      <div className="mk-tabs" style={{ marginBottom: 24 }}>
        {tabs.map(t => (
          <span key={t} className={`mk-tab ${tab===t?"active":""}`} onClick={() => setTab(t)} style={{ textTransform:"capitalize" }}>{t}</span>
        ))}
      </div>

      <div className="mk-card mk-card-padded" style={{ maxWidth: 640 }}>
        {tab === "hospital" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div><label className="mk-label">Hospital Name</label><input className="mk-input" defaultValue="City General Hospital" /></div>
            <div><label className="mk-label">Address</label><input className="mk-input" defaultValue="12 Medical Avenue, Mumbai" /></div>
            <div><label className="mk-label">Timezone</label>
              <select className="mk-input" style={{ height:40 }}>
                <option>Asia/Kolkata (IST)</option><option>UTC</option>
              </select>
            </div>
            <div><label className="mk-label">Default Language</label>
              <select className="mk-input" style={{ height:40 }}>
                {["English","हिंदी","मराठी","தமிழ்","বাংলা"].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
        )}

        {tab === "queue" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div><label className="mk-label">P1 SLA — Response time (minutes)</label><input className="mk-input" type="number" defaultValue={30} /></div>
            <div><label className="mk-label">P2 SLA — Response time (minutes)</label><input className="mk-input" type="number" defaultValue={60} /></div>
            <div><label className="mk-label">P3 SLA — Fast track (minutes)</label><input className="mk-input" type="number" defaultValue={15} /></div>
            <label style={{ display:"flex", gap:10, alignItems:"center", cursor:"pointer" }}>
              <input type="checkbox" defaultChecked style={{ accentColor:"var(--mk-primary)", width:18, height:18 }} />
              <span className="mk-body">Auto-allocate P2 and P3 without Admin review</span>
            </label>
            <label style={{ display:"flex", gap:10, alignItems:"center", cursor:"pointer" }}>
              <input type="checkbox" style={{ accentColor:"var(--mk-primary)", width:18, height:18 }} />
              <span className="mk-body">Require Admin review for all P1 cases</span>
            </label>
          </div>
        )}

        {tab === "kiosk" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div><label className="mk-label">Registered Kiosks</label></div>
            {["Kiosk 1 — Reception A","Kiosk 2 — OPD Entry","Kiosk 3 — Ground Floor"].map(k => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid var(--mk-border)" }}>
                <span className="mk-body">{k}</span>
                <div style={{ display:"flex", gap:6 }}>
                  <span className="mk-badge mk-badge-ok">Online</span>
                  <button className="mk-btn mk-btn-ghost" style={{ fontSize:11, minHeight:28 }}>Edit</button>
                </div>
              </div>
            ))}
            <button className="mk-btn mk-btn-secondary">+ Register Kiosk</button>
          </div>
        )}

        {tab === "notifications" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {[
              { label:"Patient SMS notifications", checked:true },
              { label:"WhatsApp notifications", checked:false },
              { label:"Doctor emergency alerts", checked:true },
              { label:"Admin P0 push notifications", checked:true },
              { label:"Follow-up reminders (72h)", checked:true },
            ].map(({ label, checked }) => (
              <label key={label} style={{ display:"flex", gap:10, alignItems:"center", cursor:"pointer" }}>
                <input type="checkbox" defaultChecked={checked} style={{ accentColor:"var(--mk-primary)", width:18, height:18 }} />
                <span className="mk-body">{label}</span>
              </label>
            ))}
          </div>
        )}

        {tab === "integrations" && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { name:"AI Engine (pretriage-v1)", endpoint:"https://ai.internal/pretriage", status:"Connected" },
              { name:"Supabase", endpoint:"https://xxx.supabase.co", status:"Connected" },
              { name:"SMS Gateway (MSG91)", endpoint:"https://api.msg91.com", status:"Connected" },
              { name:"ABDM / ABHA", endpoint:"https://abdm.gov.in/api", status:"Disconnected" },
            ].map(({ name, endpoint, status }) => (
              <div key={name} className="mk-card" style={{ padding:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div className="mk-card-title">{name}</div>
                    <div className="mk-meta">{endpoint}</div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span className={`mk-badge ${status==="Connected"?"mk-badge-ok":"mk-badge-p0"}`}>{status}</span>
                    <button className="mk-btn mk-btn-secondary" style={{ fontSize:11, minHeight:28 }}>Test</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mk-divider" style={{ margin: "20px 0" }} />
        <div style={{ display:"flex", gap:10 }}>
          <button className="mk-btn mk-btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save Configuration"}
          </button>
          <button className="mk-btn mk-btn-secondary">Reset to Defaults</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SYSTEM STATUS
══════════════════════════════════════════════════════════ */
type ServiceStatus = "operational" | "degraded" | "offline";

function SystemStatus() {
  const services: Array<{ name:string; status:ServiceStatus; detail:string; latency?:string }> = [
    { name:"Queue Engine",       status:"operational", detail:"Processing normally",     latency:"12 ms" },
    { name:"AI Triage Engine",   status:"operational", detail:"pretriage-v1 · v1.2.0",  latency:"420 ms" },
    { name:"Database (Supabase)",status:"operational", detail:"All replicas healthy",    latency:"8 ms" },
    { name:"Kiosk 1",            status:"operational", detail:"Reception A",             latency:"—" },
    { name:"Kiosk 2",            status:"operational", detail:"OPD Entry",               latency:"—" },
    { name:"Kiosk 3",            status:"operational", detail:"Ground Floor",            latency:"—" },
    { name:"SMS Gateway",        status:"operational", detail:"MSG91 · 0 failures",      latency:"—" },
    { name:"ABDM Integration",   status:"degraded",    detail:"Partial — ABHA lookup slow", latency:"4200 ms" },
    { name:"WhatsApp Gateway",   status:"offline",     detail:"Connection refused — check config", latency:"—" },
  ];

  const clsMap: Record<ServiceStatus, string> = { operational:"mk-badge-ok", degraded:"mk-badge-warn", offline:"mk-badge-p0" };
  const iconMap: Record<ServiceStatus, string> = { operational:"🟢", degraded:"🟡", offline:"🔴" };

  const overall = services.some(s => s.status === "offline") ? "offline" : services.some(s => s.status === "degraded") ? "degraded" : "operational";

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <h1 className="mk-page-title">System Status</h1>
        <span className={`mk-badge ${clsMap[overall]}`} style={{ fontSize:13 }}>{iconMap[overall]} {overall.charAt(0).toUpperCase()+overall.slice(1)}</span>
      </div>

      <div className="mk-card">
        {services.map(({ name, status, detail, latency }) => (
          <div key={name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:"1px solid var(--mk-border)" }}>
            <div>
              <div className="mk-card-title">{iconMap[status]} {name}</div>
              <div className="mk-meta">{detail}</div>
            </div>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              {latency && latency !== "—" && <span className="mk-meta">{latency}</span>}
              <span className={`mk-badge ${clsMap[status]}`} style={{ textTransform:"capitalize" }}>{status}</span>
              {status !== "operational" && (
                <button className="mk-btn mk-btn-secondary" style={{ fontSize:11, minHeight:28 }} onClick={() => pushToast(`Retrying ${name}…`, "info")}>Retry</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN ADMIN PAGE
══════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const [nav, setNav] = useState<AdminNav>("dashboard");
  const [selectedCase, setSelectedCase] = useState("MK-2051");

  const topbarExtra = (
    <div className="mk-p0-banner" style={{ padding:"6px 12px", fontSize:12, cursor:"pointer" }} onClick={() => setNav("p0")}>
      ⚠ 1 Active P0 Emergency — MK-0092 — Click to manage
    </div>
  );

  return (
    <OpsShell nav={NAV} active={nav} onNav={id => setNav(id as AdminNav)}
      subtitle="Hospital Operations Suite" topbarExtra={topbarExtra}>

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
