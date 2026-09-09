"use client";
import { useState } from "react";
import {
  OpsShell, PriorityBadge, StatusChip, AITriageContext, EvidenceDrawer,
  CaseTimeline, EmptyState, ConfirmDialog, ReasonInput,
  pushToast,
} from "@/components/shared";
import { CASES, ALL_CASES } from "@/lib/fixtures";
import type { CaseFixture } from "@/lib/fixtures";

type DocView = "queue" | "detail" | "consult" | "complete" | "p0-alert";

const NAV = [
  { id: "queue",      label: "My Queue",      icon: "☰" },
  { id: "p0-alert",   label: "P0 Emergency",  icon: "🚨", badge: 1, danger: true },
  { id: "consultations", label: "Consultations", icon: "📋" },
  { id: "templates",  label: "Templates",     icon: "📄" },
  { id: "reports",    label: "Reports",        icon: "📊" },
  { id: "profile",    label: "Profile",        icon: "👤" },
];

/* ── P0 Emergency alert panel ────────────────────────────── */
function P0Alert() {
  const c = CASES.P0;
  return (
    <div>
      <div className="mk-p0-banner" style={{ marginBottom: 20, fontSize: 15 }}>
        🚨 EMERGENCY — This is not a queue item — Emergency protocol already active
      </div>
      <h2 className="mk-page-title" style={{ color: "var(--mk-danger)", marginBottom: 16 }}>P0 Emergency Handover</h2>
      <div className="mk-p0-alert" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <div className="mk-card-title">Patient: {c.patientName} · {c.caseId}</div>
            <div className="mk-meta">Location: Kiosk 3, Ground Floor</div>
          </div>
          <div>
            <div className="mk-meta">Emergency team: Dispatched</div>
            <div className="mk-meta">You may be required for clinical handover</div>
          </div>
        </div>
        <div className="mk-sec-title" style={{ marginBottom: 8 }}>Critical indicators</div>
        <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
          {c.ai.safety_flags.map((f: string) => <li key={f} className="mk-body" style={{ color: "var(--mk-danger)" }}>{f}</li>)}
          {c.symptoms.map(s => <li key={s} className="mk-body">{s}</li>)}
        </ul>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="mk-btn mk-btn-danger" onClick={() => pushToast("Emergency handover acknowledged", "success")}>Acknowledge Handover</button>
          <button className="mk-btn mk-btn-secondary">📋 View Full Case</button>
        </div>
      </div>
      <div className="mk-card mk-card-padded">
        <div className="mk-sec-title" style={{ marginBottom: 12 }}>Emergency Timeline</div>
        <CaseTimeline events={c.timeline} />
      </div>
      <div className="mk-meta" style={{ marginTop: 16, color: "var(--mk-danger)" }}>
        P0 does not appear in your routine queue. This handover panel is only shown when your participation is required.
      </div>
    </div>
  );
}

/* ── Queue view ─────────────────────────────────────────── */
function QueueView({ onSelect }: { onSelect: (id: string) => void }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "P1", "P2", "P3", "Follow-ups"];
  const rows = ALL_CASES.filter(c => c.priority !== "P0"); // P0 never in routine queue

  const filtered = filter === "All" ? rows : rows.filter(r => r.priority === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 className="mk-page-title">Today&apos;s Queue</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ALL_CASES.filter(c => c.priority !== "P0").map(c => (
            <span key={c.priority} className={`mk-badge mk-badge-${c.priority.toLowerCase()}`}>{c.priority}</span>
          ))}
        </div>
      </div>
      <div className="mk-tabs" style={{ marginBottom: 20 }}>
        {filters.map(f => (
          <span key={f} className={`mk-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</span>
        ))}
      </div>
      <div className="mk-card">
        <div className="mk-table-wrap">
          <table className="mk-table-el">
            <thead>
              <tr>
                <th>Time</th><th>Case ID</th><th>Patient</th><th>AI Intake Summary</th>
                <th>Priority</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7}><EmptyState icon="✅" title="Queue is clear" /></td></tr>
              )}
              {filtered.map(row => (
                <tr key={row.caseId}>
                  <td className="mk-meta">{new Date(row.intakeSubmittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td><span style={{ fontWeight: 600, color: "var(--mk-primary)" }}>{row.caseId}</span></td>
                  <td>{row.patientName}, {row.patientAge}{row.patientGender}</td>
                  <td className="mk-meta" style={{ maxWidth: 200 }}>{row.chiefComplaint}</td>
                  <td><PriorityBadge priority={row.priority} full /></td>
                  <td><StatusChip status={row.status} /></td>
                  <td>
                    <button className="mk-btn mk-btn-primary" style={{ fontSize: 12, minHeight: 32, padding: "0 12px" }} onClick={() => onSelect(row.caseId)}>
                      {row.priority === "P1" ? "Consult" : "View"}
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

/* ── Case detail ─────────────────────────────────────────── */
function CaseDetail({
  c, onConsult, onBack,
}: { c: CaseFixture; onConsult: () => void; onBack: () => void }) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [retriageOpen, setRetriageOpen] = useState(false);
  const [p0ConfirmOpen, setP0ConfirmOpen] = useState(false);
  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [retriageReason, setRetriageReason] = useState("");

  function submitRetriage() {
    if (!retriageReason.trim()) return;
    pushToast(`Re-triage to P1 submitted — ${c.caseId} · Reason logged · Patient and Admin notified`, "success");
    setRetriageOpen(false);
  }
  function submitP0() {
    pushToast(`P0 escalation for ${c.caseId} — Emergency protocol activated automatically`, "danger");
    setP0ConfirmOpen(false);
  }
  function submitClarify() {
    pushToast(`Clarification request sent — ${c.caseId}`, "info");
    setClarifyOpen(false);
  }

  return (
    <div>
      <EvidenceDrawer open={evidenceOpen} onClose={() => setEvidenceOpen(false)} caseId={c.caseId} />

      {/* Re-triage dialog */}
      <ConfirmDialog open={retriageOpen} title="Re-triage to P1 — Urgent Handoff"
        confirmLabel="Confirm Re-triage" onConfirm={submitRetriage} onCancel={() => setRetriageOpen(false)}
        danger>
        <ReasonInput value={retriageReason} onChange={setRetriageReason} placeholder="Clinical reason for urgent re-triage…" label="Reason (required)" />
        <p className="mk-meta" style={{ marginTop: 8 }}>This will: update case priority, notify patient and Admin, recompute queue/allocation, and create an audit event.</p>
      </ConfirmDialog>

      {/* P0 escalation dialog */}
      <ConfirmDialog open={p0ConfirmOpen} title="Escalate to P0 — Emergency Protocol"
        message="This immediately activates the emergency protocol. Automatic alerts will fire. The patient must not be left unattended."
        confirmLabel="Escalate P0" danger onConfirm={submitP0} onCancel={() => setP0ConfirmOpen(false)} />

      {/* Clarification dialog */}
      <ConfirmDialog open={clarifyOpen} title="Request Clarification"
        confirmLabel="Send Request" onConfirm={submitClarify} onCancel={() => setClarifyOpen(false)}>
        <label className="mk-label">Clarification needed</label>
        <textarea className="mk-input" style={{ height: 80, padding: "10px 12px", resize: "none" }} placeholder="Describe what additional information is needed…" />
      </ConfirmDialog>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button className="mk-btn mk-btn-ghost" onClick={onBack}>←</button>
        <h1 className="mk-page-title">Patient Intake Summary</h1>
        <PriorityBadge priority={c.priority} full />
        <StatusChip status={c.status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="mk-card mk-card-padded">
            <div className="mk-sec-title" style={{ marginBottom: 12 }}>Patient Information</div>
            {[
              { l: "Name", v: `${c.patientName}, ${c.patientAge}${c.patientGender}` },
              { l: "Mobile", v: c.phone },
              { l: "ABHA", v: c.abha },
              { l: "Chief complaint", v: c.chiefComplaint },
              { l: "Duration", v: c.duration },
            ].map(({ l, v }) => (
              <div key={l} style={{ padding: "6px 0", borderBottom: "1px solid var(--mk-border)" }}>
                <span className="mk-meta" style={{ fontWeight: 600 }}>{l}: </span>
                <span className="mk-body">{v}</span>
              </div>
            ))}
          </div>

          <div className="mk-card mk-card-padded">
            <div className="mk-sec-title" style={{ marginBottom: 12 }}>Intake Summary</div>
            {c.symptoms.map(s => (
              <div key={s} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--mk-primary)", flexShrink: 0 }} />
                <span className="mk-body">{s}</span>
              </div>
            ))}
            {c.ai.safety_flags.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="mk-meta" style={{ fontWeight: 600, color: "var(--mk-danger)", marginBottom: 6 }}>Risk flags</div>
                {c.ai.safety_flags.map((f: string) => (
                  <div key={f} className="mk-badge mk-badge-p0" style={{ marginBottom: 4 }}>⚠ {f}</div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button className="mk-btn mk-btn-secondary" onClick={() => setEvidenceOpen(true)}>📎 Evidence</button>
            <button className="mk-btn mk-btn-secondary" onClick={() => setClarifyOpen(true)}>❓ Clarify</button>
            <button className="mk-btn mk-btn-secondary" onClick={() => setRetriageOpen(true)}>⬆ Re-triage P1</button>
            <button className="mk-btn mk-btn-danger" onClick={() => setP0ConfirmOpen(true)}>🚨 Escalate P0</button>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AITriageContext priority={c.priority} confidence={Math.round((c.ai.confidence_score ?? 0.82) * 100)}
            indicators={c.symptoms} history={c.history} riskFlags={c.ai.safety_flags.length ? c.ai.safety_flags : ["None identified"]} />

          <div className="mk-card mk-card-padded">
            <div className="mk-sec-title" style={{ marginBottom: 12 }}>Event Timeline</div>
            <CaseTimeline events={c.timeline} />
          </div>

          <button className="mk-btn mk-btn-primary mk-btn-kiosk" style={{ width: "100%" }} onClick={onConsult}>
            Start Consultation →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Clinical consultation (tabbed) ─────────────────────── */
type ConsultTab = "notes" | "vitals" | "exam" | "diagnosis" | "prescription" | "followup";

function Consultation({
  c, onComplete, onBack,
}: { c: CaseFixture; onComplete: () => void; onBack: () => void }) {
  const [tab, setTab] = useState<ConsultTab>("notes");
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);
  const [unableOpen, setUnableOpen] = useState(false);
  const [interruptOpen, setInterruptOpen] = useState(false);

  const tabs: Array<{ id: ConsultTab; label: string }> = [
    { id: "notes", label: "Clinical Notes" },
    { id: "vitals", label: "Vitals" },
    { id: "exam", label: "Examination" },
    { id: "diagnosis", label: "Diagnosis" },
    { id: "prescription", label: "Prescription" },
    { id: "followup", label: "Follow-up" },
  ];

  return (
    <div>
      <EvidenceDrawer open={evidenceOpen} onClose={() => setEvidenceOpen(false)} caseId={c.caseId} />

      {/* Exception dialogs */}
      <ConfirmDialog open={noShowOpen} title="Patient No-Show"
        message="Mark this patient as no-show? The queue will be updated and the patient notified."
        confirmLabel="Mark No-Show" danger onConfirm={() => { pushToast(`${c.caseId} marked as no-show — queue updated, patient notified`, "warning"); setNoShowOpen(false); onBack(); }}
        onCancel={() => setNoShowOpen(false)} />

      <ConfirmDialog open={unableOpen} title="Unable to Consult"
        message="Mark this consultation as unable to proceed? A reason and audit event will be recorded."
        confirmLabel="Confirm" danger onConfirm={() => { pushToast("Unable-to-consult recorded — Admin notified", "warning"); setUnableOpen(false); onBack(); }}
        onCancel={() => setUnableOpen(false)}>
        <label className="mk-label">Reason</label>
        <select className="mk-input" style={{ height: 40 }}>
          <option>Doctor unavailable</option>
          <option>Patient uncooperative</option>
          <option>Equipment failure</option>
          <option>Other</option>
        </select>
      </ConfirmDialog>

      <ConfirmDialog open={interruptOpen} title="Interrupted Consultation"
        message="Save draft and pause this consultation? You can resume from the draft state."
        confirmLabel="Save Draft & Exit" onConfirm={() => { pushToast("Draft saved — resume from queue", "info"); setInterruptOpen(false); onBack(); }}
        onCancel={() => setInterruptOpen(false)} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button className="mk-btn mk-btn-ghost" onClick={onBack}>←</button>
        <h1 className="mk-page-title">Consultation — {c.caseId}</h1>
        <PriorityBadge priority={c.priority} full />
        <span className="mk-badge mk-badge-ok">In Progress</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 32 }} onClick={() => setEvidenceOpen(true)}>📎 Evidence</button>
          <button className="mk-btn mk-btn-ghost" style={{ fontSize: 12, minHeight: 32 }} onClick={() => setInterruptOpen(true)}>⏸ Pause</button>
          <button className="mk-btn mk-btn-ghost" style={{ fontSize: 12, minHeight: 32 }} onClick={() => setNoShowOpen(true)}>👤 No-show</button>
          <button className="mk-btn mk-btn-ghost" style={{ fontSize: 12, minHeight: 32 }} onClick={() => setUnableOpen(true)}>⛔ Unable</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 16 }}>
        {/* Main workspace */}
        <div>
          <div className="mk-tabs" style={{ marginBottom: 20, overflowX: "auto" }}>
            {tabs.map(t => (
              <span key={t.id} className={`mk-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)} style={{ whiteSpace: "nowrap" }}>{t.label}</span>
            ))}
          </div>

          {tab === "notes" && (
            <div>
              <label className="mk-label">Clinical Notes</label>
              <textarea className="mk-input" style={{ height: 180, padding: "10px 12px", resize: "vertical" }}
                placeholder="Patient reports cough for 2 days, mild fever and body ache…"
                value={notes} onChange={e => setNotes(e.target.value)} />
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {["Use AI Summary", "Insert Vitals", "Insert Symptoms"].map(a => (
                  <button key={a} className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 32 }} onClick={() => pushToast(`${a} inserted`, "info")}>{a}</button>
                ))}
              </div>
              <button className="mk-btn mk-btn-ghost" style={{ marginTop: 12, fontSize: 12 }} onClick={() => pushToast("Draft saved", "success")}>+ Save Draft</button>
            </div>
          )}

          {tab === "vitals" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Temp (°F)", val: "99.1" }, { label: "HR (bpm)", val: "84" },
                { label: "SpO₂ (%)", val: "98" }, { label: "BP (mmHg)", val: "123/78" },
                { label: "RR (/min)", val: "16" }, { label: "Weight (kg)", val: "72" },
                { label: "Height (cm)", val: "170" }, { label: "BMI", val: "24.9" },
              ].map(({ label, val }) => (
                <div key={label} className="mk-card" style={{ padding: 12 }}>
                  <div className="mk-meta" style={{ marginBottom: 4 }}>{label}</div>
                  <input className="mk-input" defaultValue={val} style={{ fontWeight: 700, fontSize: 18, height: 36, textAlign: "center" }} />
                </div>
              ))}
            </div>
          )}

          {tab === "exam" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["General","Alert, oriented"],["Respiratory","Clear"],["Cardiovascular","Normal"],["Abdomen","Soft, non-tender"],["CNS","Normal"]].map(([sys, val]) => (
                <div key={sys} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span className="mk-meta" style={{ fontWeight: 600, minWidth: 140 }}>{sys}</span>
                  <input className="mk-input" defaultValue={val} style={{ flex: 1 }} />
                </div>
              ))}
            </div>
          )}

          {tab === "diagnosis" && (
            <div>
              <AITriageContext priority={c.priority} confidence={Math.round((c.ai.confidence_score ?? 0.82) * 100)}
                indicators={c.symptoms} history={c.history}
                riskFlags={c.ai.safety_flags.length ? c.ai.safety_flags : ["None identified"]} />
              <div className="mk-divider" style={{ margin: "16px 0" }} />
              <div className="mk-sec-title" style={{ marginBottom: 12 }}>Final Clinical Assessment (Doctor)</div>
              <div style={{ marginBottom: 12 }}>
                <label className="mk-label">Primary Diagnosis</label>
                <input className="mk-input" placeholder="Search or type diagnosis…" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="mk-label">Secondary Diagnosis (optional)</label>
                <input className="mk-input" placeholder="Select diagnosis…" />
              </div>
              <div>
                <label className="mk-label">Clinical Notes</label>
                <textarea className="mk-input" style={{ height: 80, padding: "10px 12px", resize: "none" }} placeholder="Add assessment notes…" />
              </div>
            </div>
          )}

          {tab === "prescription" && (
            <div>
              <div className="mk-sec-title" style={{ marginBottom: 12 }}>Prescriptions</div>
              {[
                { name: "Paracetamol 500mg", dose: "1 × 3/day", dur: "3 days" },
                { name: "Cetirizine 10mg", dose: "1 × night", dur: "5 days" },
                { name: "Dextromethorphan syrup", dose: "10ml × 3/day", dur: "3 days" },
              ].map(rx => (
                <div key={rx.name} className="mk-card" style={{ padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div className="mk-card-title">{rx.name}</div>
                    <div className="mk-meta">{rx.dose} · {rx.dur}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="mk-btn mk-btn-ghost" style={{ fontSize: 12, minHeight: 28 }}>Edit</button>
                    <button className="mk-btn mk-btn-ghost" style={{ fontSize: 12, minHeight: 28, color: "var(--mk-danger)" }}>Remove</button>
                  </div>
                </div>
              ))}
              <button className="mk-btn mk-btn-secondary" style={{ marginTop: 8 }}>+ Add Medication</button>
              <div style={{ marginTop: 12 }}>
                <label className="mk-label">Additional Orders</label>
                {["CBC","CRP","Chest X-Ray"].map(o => (
                  <label key={o} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, cursor: "pointer" }}>
                    <input type="checkbox" style={{ accentColor: "var(--mk-primary)" }} defaultChecked={o === "CBC"} />
                    <span className="mk-body">{o}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab === "followup" && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <label className="mk-label">Follow-up date</label>
                <input className="mk-input" type="date" defaultValue="2024-10-21" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="mk-label">Patient instructions</label>
                <textarea className="mk-input" style={{ height: 80, padding: "10px 12px", resize: "none" }}
                  defaultValue="Take medicines as prescribed. Stay hydrated. Return if fever persists beyond 3 days or breathlessness develops." />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
            <button className="mk-btn mk-btn-secondary" onClick={onBack}>← Back</button>
            {tab !== "followup" ? (
              <button className="mk-btn mk-btn-primary" style={{ flex: 1 }}
                onClick={() => { const i = tabs.findIndex(t => t.id === tab); if (i < tabs.length - 1) setTab(tabs[i + 1].id); }}>
                Next →
              </button>
            ) : (
              <button className="mk-btn mk-btn-primary" style={{ flex: 1 }} onClick={onComplete}>
                Review &amp; Complete →
              </button>
            )}
          </div>
        </div>

        {/* Side summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="mk-card mk-card-padded">
            <div className="mk-meta" style={{ fontWeight: 600 }}>{c.caseId}</div>
            <div className="mk-card-title">{c.patientName}, {c.patientAge}{c.patientGender}</div>
            <div className="mk-meta">{c.department}</div>
            <div style={{ marginTop: 8 }}>
              <PriorityBadge priority={c.priority} />
              <span className="mk-badge mk-badge-ok" style={{ marginLeft: 6 }}>In Consultation</span>
            </div>
          </div>
          <div className="mk-card mk-card-padded" style={{ fontSize: 12 }}>
            <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 8 }}>Quick navigation</div>
            {tabs.map(t => (
              <button key={t.id} className={`mk-nav-item ${tab === t.id ? "active" : ""}`} style={{ width: "100%", fontSize: 12, minHeight: 32 }} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Consultation complete ───────────────────────────────── */
function ConsultComplete({ c, onBack }: { c: CaseFixture; onBack: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <h2 className="mk-page-title" style={{ marginBottom: 8 }}>Consultation Completed</h2>
      <p className="mk-body" style={{ color: "var(--mk-text-muted)", marginBottom: 24 }}>
        Patient record has been signed and published. Patient has been notified.
      </p>
      <div className="mk-card mk-card-padded" style={{ maxWidth: 440, margin: "0 auto 24px", textAlign: "left" }}>
        <div className="mk-sec-title" style={{ marginBottom: 12 }}>Summary</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { l: "Patient", v: `${c.patientName} · ${c.caseId}` },
            { l: "Diagnosis", v: "Acute viral upper respiratory infection (J06.9)" },
            { l: "Medications", v: "3 prescriptions" },
            { l: "Follow-up", v: "21 Oct 2024 · if not better" },
            { l: "Record published", v: "14 Oct 2024, 11:42 AM · Patient notified" },
          ].map(({ l, v }) => (
            <div key={l}>
              <span className="mk-meta" style={{ fontWeight: 600 }}>{l}: </span>
              <span className="mk-body">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="mk-btn mk-btn-secondary" onClick={() => pushToast("Printing…", "info")}>🖨 Print Prescription</button>
        <button className="mk-btn mk-btn-secondary" onClick={() => pushToast("Sent to patient (SMS)", "success")}>💬 Send to Patient</button>
        <button className="mk-btn mk-btn-secondary" onClick={() => pushToast("Saved to record", "success")}>💾 Save to Record</button>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
        <button className="mk-btn mk-btn-ghost" onClick={onBack}>← Back to Queue</button>
        <button className="mk-btn mk-btn-primary" onClick={onBack}>Next Patient →</button>
      </div>
    </div>
  );
}

/* ── Doctor page ─────────────────────────────────────────── */
export default function DoctorPage() {
  const [view, setView] = useState<DocView>("queue");
  const [navActive, setNavActive] = useState("queue");
  const [selectedId, setSelectedId] = useState("MK-2048");

  const selectedCase = ALL_CASES.find(c => c.caseId === selectedId) ?? CASES.P2;

  function handleNav(id: string) {
    setNavActive(id);
    if (id === "queue" || id === "p0-alert") setView(id as DocView);
  }

  const topbarExtra = (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span className="mk-meta">Good morning, Dr. Vance</span>
      <span className="mk-badge mk-badge-ok">● Online — General Medicine</span>
    </div>
  );

  return (
    <OpsShell nav={NAV} active={navActive} onNav={handleNav} subtitle="Clinical Suite" topbarExtra={topbarExtra}>
      {view === "queue"     && <QueueView onSelect={id => { setSelectedId(id); setView("detail"); }} />}
      {view === "p0-alert"  && <P0Alert />}
      {view === "detail"    && <CaseDetail c={selectedCase} onConsult={() => setView("consult")} onBack={() => setView("queue")} />}
      {view === "consult"   && <Consultation c={selectedCase} onComplete={() => setView("complete")} onBack={() => setView("detail")} />}
      {view === "complete"  && <ConsultComplete c={selectedCase} onBack={() => setView("queue")} />}
      {!["queue","p0-alert","detail","consult","complete"].includes(view) && (
        <EmptyState icon="🚧" title="Coming soon" desc={`The ${navActive} section is in development.`} />
      )}
    </OpsShell>
  );
}
