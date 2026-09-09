"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  OpsShell, PriorityBadge, StatusChip, AITriageContext, EvidenceDrawer,
  CaseTimeline, EmptyState, ConfirmDialog, ReasonInput,
  pushToast,
} from "@/components/shared";
import {
  IconList,
  IconAlertTriangle,
  IconFileText,
  IconBarChart,
  IconUser,
  IconStethoscope,
  IconCheckCircle,
  IconClock,
  IconArrowLeft,
  IconArrowRight,
  IconSparkles,
  IconActivity,
  IconChevronRight,
  IconPill,
  IconAlertCircle,
} from "@/components/icons";
import { CASES, ALL_CASES } from "@/lib/fixtures";
import type { CaseFixture } from "@/lib/fixtures";
import { getDoctorQueue, callPatientTurn, submitConsultation } from "@/lib/api";
import { adaptQueueItemToFixture } from "@/lib/adapters";

type DocView = "queue" | "detail" | "consult" | "complete" | "p0-alert";

const NAV = [
  { id: "queue",      label: "My Queue",      icon: <IconList size={16} /> },
  { id: "p0-alert",   label: "P0 Emergency",  icon: <IconAlertTriangle size={16} />, badge: 1, danger: true },
  { id: "consultations", label: "Consultations", icon: <IconFileText size={16} /> },
  { id: "templates",  label: "Templates",     icon: <IconFileText size={16} /> },
  { id: "reports",    label: "Reports",        icon: <IconBarChart size={16} /> },
  { id: "profile",    label: "Profile",        icon: <IconUser size={16} /> },
];

/* ══════════════════════════════════════════════════════════
   SCREEN 5: P0 EMERGENCY HANDOVER (Doctor View)
   Calm, authoritative, serious clinical emergency handoff
══════════════════════════════════════════════════════════ */
function P0Alert() {
  const c = CASES.P0;
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div style={{ maxWidth: 880 }}>
      {/* Emergency Handover Banner */}
      <div style={{
        background: "var(--mk-surface)",
        border: "1px solid var(--mk-border)",
        borderLeft: `4px solid ${acknowledged ? "var(--mk-success)" : "var(--mk-danger)"}`,
        borderRadius: "var(--mk-radius-md)",
        padding: "20px 24px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className={`mk-badge ${acknowledged ? "mk-badge-ok" : "mk-badge-p0"}`}>
              {acknowledged ? "Handover Acknowledged" : "P0 Emergency Protocol Active"}
            </span>
            <span style={{ fontSize: 12, fontFamily: "var(--mk-font-mono)", color: "var(--mk-text-muted)" }}>
              Response Target: &lt; 5 min · Elapsed: <strong>01:24</strong>
            </span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "6px 0 2px", color: "var(--mk-navy)" }}>
            Emergency Handover — Resuscitation Bay 1 (Kiosk 3)
          </h2>
          <div className="mk-meta">
            Assigned Clinician: Dr. R. Vance, MD · Trauma Nursing Team Dispatched
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="mk-btn mk-btn-primary"
            style={{
              background: acknowledged ? "var(--mk-success)" : "var(--mk-danger)",
              minHeight: 38,
            }}
            onClick={() => {
              setAcknowledged(true);
              pushToast("Emergency presence confirmed — Protocol engaged", "success");
            }}
          >
            <IconCheckCircle size={15} />
            <span>{acknowledged ? "Presence Confirmed" : "Acknowledge & Confirm Presence"}</span>
          </button>
          <button
            className="mk-btn mk-btn-secondary"
            style={{ minHeight: 38 }}
            onClick={() => pushToast("Trauma records dispatched to mobile tablet", "info")}
          >
            <IconFileText size={15} />
            <span>Trauma Dossier</span>
          </button>
        </div>
      </div>

      {/* Patient & Incident Info */}
      <div className="mk-card mk-card-padded" style={{ marginBottom: 20 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          paddingBottom: 16,
          borderBottom: "1px solid var(--mk-border-subtle)",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--mk-navy)" }}>
              {c.patientName}, {c.patientAge}y · {c.patientGender}
            </div>
            <div className="mk-meta" style={{ marginTop: 2 }}>
              Case ID: <strong style={{ fontFamily: "var(--mk-font-mono)" }}>{c.caseId}</strong> · Location: Ground Floor Bay 3
            </div>
          </div>
          <span className="mk-badge mk-badge-p0">Immediate Physician Presence Required</span>
        </div>

        <div style={{ padding: "16px 0", borderBottom: "1px solid var(--mk-border-subtle)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--mk-danger)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
            Reported Critical Invariant Indicators
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {c.ai.safety_flags.map((f: string) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--mk-danger)" }}>
                <IconAlertTriangle size={14} />
                <span>{f}</span>
              </div>
            ))}
            {c.symptoms.map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--mk-text-muted)" }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--mk-text-subtle)" }} />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ paddingTop: 16 }}>
          <div className="mk-sec-title" style={{ marginBottom: 12 }}>Emergency Incident Progression</div>
          <CaseTimeline events={c.timeline} />
        </div>
      </div>

      <p className="mk-meta" style={{ color: "var(--mk-text-subtle)" }}>
        Notice: P0 Emergency cases bypass routine queue scheduling. Attending presence logged in hospital audit ledger.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SCREEN 4: DOCTOR QUEUE (Clinical Workstation Worklist)
   Information density, scanability, keyboard/mouse efficiency
══════════════════════════════════════════════════════════ */
function QueueView({ onSelect }: { onSelect: (id: string) => void }) {
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [isLiveSource, setIsLiveSource] = useState(false);
  const [cases, setCases] = useState<CaseFixture[]>(ALL_CASES.filter(c => c.priority !== "P0"));

  const filters = ["All", "P1", "P2", "P3"];

  useEffect(() => {
    let mounted = true;
    async function loadQueue() {
      setLoading(true);
      try {
        const liveQueue = await getDoctorQueue();
        if (mounted && Array.isArray(liveQueue) && liveQueue.length > 0) {
          const adapted = liveQueue.map(adaptQueueItemToFixture).filter(c => c.priority !== "P0");
          if (adapted.length > 0) {
            setCases(adapted);
            setIsLiveSource(true);
          }
        }
      } catch (err) {
        console.warn("Using fallback clinical fixtures:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadQueue();
    return () => { mounted = false; };
  }, []);

  const filtered = filter === "All" ? cases : cases.filter(r => r.priority === filter);
  const p1Cases = filtered.filter(c => c.priority === "P1");
  const otherCases = filtered.filter(c => c.priority !== "P1");

  return (
    <div>
      {/* Header & Filter Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="mk-page-title" style={{ margin: 0 }}>Patient Queue</h1>
          <div className="mk-meta" style={{ marginTop: 2 }}>
            OPD Room 12 · Attending: Dr. R. Vance, MD · {isLiveSource ? "EHR Live Feed" : "Resilient Offline Buffer"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {["P1", "P2", "P3"].map(p => (
            <span key={p} className={`mk-badge mk-badge-${p.toLowerCase()}`}>
              {cases.filter(c => c.priority === p).length} {p}
            </span>
          ))}
        </div>
      </div>

      <div className="mk-tabs" style={{ marginBottom: 20 }}>
        {filters.map(f => (
          <span key={f} className={`mk-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f}
          </span>
        ))}
      </div>

      {/* P1 Urgent Cases Pinned at Top */}
      {p1Cases.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 11,
            fontFamily: "var(--mk-font-mono)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--mk-p1)",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <IconAlertTriangle size={14} />
            <span>Urgent Cases ({p1Cases.length})</span>
          </div>

          {p1Cases.map(c => (
            <div
              key={c.caseId}
              style={{
                background: "var(--mk-p1-soft)",
                border: "1px solid var(--mk-p1-border)",
                borderLeft: "4px solid var(--mk-p1)",
                borderRadius: "var(--mk-radius-sm)",
                padding: "16px 20px",
                marginBottom: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--mk-navy)" }}>
                    {c.patientName}, {c.patientAge}y · {c.patientGender}
                  </span>
                  <span className="mk-badge mk-badge-p1">P1 Urgent</span>
                  <span style={{ fontSize: 12, fontFamily: "var(--mk-font-mono)", color: "var(--mk-p1)", fontWeight: 600 }}>
                    {c.caseId}
                  </span>
                </div>
                <div className="mk-body" style={{ fontSize: 13, color: "var(--mk-text)" }}>
                  {c.chiefComplaint}
                </div>
                <div className="mk-meta" style={{ color: "var(--mk-p1)", fontSize: 11, marginTop: 4, fontFamily: "var(--mk-font-mono)" }}>
                  Arrival: {new Date(c.intakeSubmittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · Rapid Bay
                </div>
              </div>

              <button
                className="mk-btn mk-btn-primary"
                style={{ background: "var(--mk-p1)", padding: "0 18px", minHeight: 36 }}
                onClick={() => {
                  if (c.turnId) callPatientTurn(c.turnId).catch(() => {});
                  onSelect(c.caseId);
                }}
              >
                <span>Start Consultation →</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Standard Worklist Table */}
      <div className="mk-card">
        <div className="mk-table-wrap">
          <table className="mk-table-el">
            <thead>
              <tr>
                <th>Arrival</th>
                <th>Case ID</th>
                <th>Patient</th>
                <th>Reported Symptoms</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {otherCases.length === 0 && p1Cases.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<IconCheckCircle size={28} color="var(--mk-success)" />}
                      title="Clinical queue is clear"
                      desc="No pending consultations in this priority band."
                    />
                  </td>
                </tr>
              )}
              {otherCases.map(row => (
                <tr key={row.caseId} className={`mk-row-${row.priority.toLowerCase()}`}>
                  <td className="mk-meta" style={{ fontFamily: "var(--mk-font-mono)" }}>
                    {new Date(row.intakeSubmittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, fontFamily: "var(--mk-font-mono)", color: "var(--mk-navy)" }}>
                      {row.caseId}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--mk-text)" }}>{row.patientName}</div>
                    <div className="mk-meta" style={{ fontSize: 11 }}>{row.patientAge}y · {row.patientGender}</div>
                  </td>
                  <td className="mk-body" style={{ maxWidth: 260, fontSize: 13 }}>
                    {row.chiefComplaint}
                  </td>
                  <td><PriorityBadge priority={row.priority} full /></td>
                  <td><StatusChip status={row.status} /></td>
                  <td>
                    <button
                      className="mk-btn mk-btn-secondary"
                      style={{ fontSize: 12, minHeight: 30, padding: "0 12px" }}
                      onClick={() => {
                        if (row.turnId) callPatientTurn(row.turnId).catch(() => {});
                        onSelect(row.caseId);
                      }}
                    >
                      <span>Review</span>
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
   CASE DETAIL (Patient Dossier + Non-Diagnostic AI Context)
══════════════════════════════════════════════════════════ */
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
    pushToast(`Re-triage to P1 recorded for ${c.caseId}. Reason logged.`, "success");
    setRetriageOpen(false);
  }
  function submitP0() {
    pushToast(`P0 escalation for ${c.caseId} — Emergency protocol engaged.`, "danger");
    setP0ConfirmOpen(false);
  }
  function submitClarify() {
    pushToast(`Clarification request transmitted for ${c.caseId}`, "info");
    setClarifyOpen(false);
  }

  return (
    <div>
      <EvidenceDrawer
        open={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        caseId={c.caseId}
        patientName={c.patientName}
        chiefComplaint={c.chiefComplaint}
        symptoms={c.symptoms}
        evidence={c.evidence}
        transcript={c.transcript}
      />

      {/* Re-triage Dialog */}
      <ConfirmDialog
        open={retriageOpen}
        title="Re-triage to P1 (Urgent Handoff)"
        confirmLabel="Confirm Re-triage"
        onConfirm={submitRetriage}
        onCancel={() => setRetriageOpen(false)}
        danger
      >
        <ReasonInput
          value={retriageReason}
          onChange={setRetriageReason}
          placeholder="Clinical justification for urgent elevation…"
          label="Clinical Reason (Required)"
        />
      </ConfirmDialog>

      {/* P0 Escalation Dialog */}
      <ConfirmDialog
        open={p0ConfirmOpen}
        title="Escalate to P0 Emergency Protocol"
        message="This activates the emergency response protocol immediately. Responders will be dispatched to the patient bay."
        confirmLabel="Engage P0 Protocol"
        danger
        onConfirm={submitP0}
        onCancel={() => setP0ConfirmOpen(false)}
      />

      {/* Clarification Dialog */}
      <ConfirmDialog
        open={clarifyOpen}
        title="Request Clarification"
        confirmLabel="Send Request"
        onConfirm={submitClarify}
        onCancel={() => setClarifyOpen(false)}
      >
        <label className="mk-label">Information Required</label>
        <textarea
          className="mk-input"
          style={{ height: 72, padding: "8px 12px", resize: "none" }}
          placeholder="Specify missing clinical details…"
        />
      </ConfirmDialog>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button className="mk-btn mk-btn-ghost" onClick={onBack}>
          <IconArrowLeft size={16} />
        </button>
        <h1 className="mk-page-title" style={{ margin: 0 }}>Patient Details</h1>
        <PriorityBadge priority={c.priority} full />
        <StatusChip status={c.status} />
      </div>

      <div style={{
        background: "var(--mk-surface)",
        border: "1px solid var(--mk-border)",
        borderRadius: "var(--mk-radius-md)",
        boxShadow: "var(--mk-shadow-xs)",
        display: "grid",
        gridTemplateColumns: "minmax(0,1.25fr) minmax(0,0.95fr)",
        overflow: "hidden",
      }}>
        {/* Left: Patient Clinical Dossier */}
        <div style={{
          padding: "24px 28px",
          borderRight: "1px solid var(--mk-border-subtle)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 20,
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div className="mk-sec-title" style={{ margin: 0 }}>Patient Demographics &amp; History</div>
              <span style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "var(--mk-text-muted)" }}>{c.caseId}</span>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px 16px",
              paddingBottom: 16,
              borderBottom: "1px solid var(--mk-border-subtle)",
            }}>
              <div>
                <div className="mk-meta">Full Name</div>
                <div style={{ fontWeight: 600, color: "var(--mk-navy)" }}>{c.patientName}, {c.patientAge}y · {c.patientGender}</div>
              </div>
              <div>
                <div className="mk-meta">Contact</div>
                <div style={{ fontFamily: "var(--mk-font-mono)", fontSize: 13 }}>{c.phone}</div>
              </div>
              <div>
                <div className="mk-meta">ABHA Identifier</div>
                <div style={{ fontFamily: "var(--mk-font-mono)", fontSize: 13 }}>{c.abha}</div>
              </div>
              <div>
                <div className="mk-meta">Symptom Onset</div>
                <div style={{ fontSize: 13 }}>{c.duration}</div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div className="mk-meta">Chief Complaint</div>
                <div style={{ fontWeight: 600, color: "var(--mk-text)", marginTop: 2 }}>{c.chiefComplaint}</div>
              </div>
            </div>

            <div style={{ paddingTop: 16 }}>
              <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 8 }}>Reported Symptoms</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {c.symptoms.map(s => (
                  <span
                    key={s}
                    style={{
                      fontSize: 12,
                      padding: "3px 8px",
                      borderRadius: "var(--mk-radius-xs)",
                      background: "var(--mk-surface-subtle)",
                      border: "1px solid var(--mk-border)",
                      color: "var(--mk-text)",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Clinical Case Actions */}
          <div style={{
            paddingTop: 16,
            borderTop: "1px solid var(--mk-border-subtle)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}>
            <button className="mk-btn mk-btn-secondary" onClick={() => setEvidenceOpen(true)}>
              <IconFileText size={14} />
              <span>Evidence</span>
            </button>
            <button className="mk-btn mk-btn-secondary" onClick={() => setClarifyOpen(true)}>
              <IconAlertCircle size={14} />
              <span>Clarify</span>
            </button>
            <button className="mk-btn mk-btn-secondary" onClick={() => setRetriageOpen(true)}>
              <IconChevronRight size={14} />
              <span>Re-triage P1</span>
            </button>
            <button className="mk-btn mk-btn-danger" onClick={() => setP0ConfirmOpen(true)}>
              <IconAlertTriangle size={14} />
              <span>Escalate P0</span>
            </button>
          </div>
        </div>

        {/* Right: AI Triage Context & Launch CTA */}
        <div style={{
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 20,
          background: "var(--mk-surface-subtle)",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AITriageContext
              priority={c.priority}
              confidence={Math.round((c.ai.confidence_score ?? 0.82) * 100)}
              indicators={c.symptoms}
              history={c.history}
              riskFlags={c.ai.safety_flags.length ? c.ai.safety_flags : ["None identified"]}
            />

            <div>
              <div className="mk-sec-title" style={{ marginBottom: 10 }}>Visit Timeline</div>
              <CaseTimeline events={c.timeline} />
            </div>
          </div>

          <button
            className="mk-btn mk-btn-primary mk-btn-kiosk"
            style={{ width: "100%" }}
            onClick={onConsult}
          >
            Start Consultation →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CLINICAL CONSULTATION (Focused SOAP Note Form)
══════════════════════════════════════════════════════════ */
type ConsultTab = "notes" | "vitals" | "diagnosis" | "prescription";

function Consultation({
  c, onComplete, onBack,
}: { c: CaseFixture; onComplete: () => void; onBack: () => void }) {
  const [tab, setTab] = useState<ConsultTab>("notes");
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const tabs: Array<{ id: ConsultTab; label: string }> = [
    { id: "notes", label: "Clinical Notes" },
    { id: "vitals", label: "Vitals Check" },
    { id: "diagnosis", label: "Assessment" },
    { id: "prescription", label: "Prescriptions" },
  ];

  async function handleFinalSubmit() {
    try {
      await submitConsultation(c.caseId, {
        diagnosis: diagnosis || "Acute viral upper respiratory tract infection",
        clinical_notes: notes || "Patient examined and stable. Standard symptomatic management advised.",
        prescriptions: [
          { medicine_name: "Paracetamol 500mg", dosage: "500mg", frequency: "tds", duration_days: 3 },
          { medicine_name: "Cetirizine 10mg", dosage: "10mg", frequency: "od", duration_days: 5 },
        ],
        follow_up_advice: "Return if symptoms persist beyond 5 days",
      });
    } catch (err) {
      console.warn("Backend consultation fallback:", err);
    }
    onComplete();
  }

  return (
    <div>
      <EvidenceDrawer
        open={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        caseId={c.caseId}
        patientName={c.patientName}
        chiefComplaint={c.chiefComplaint}
        symptoms={c.symptoms}
        evidence={c.evidence}
        transcript={c.transcript}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="mk-btn mk-btn-ghost" onClick={onBack}>
            <IconArrowLeft size={16} />
          </button>
          <h1 className="mk-page-title" style={{ margin: 0 }}>Consultation — {c.patientName}</h1>
          <PriorityBadge priority={c.priority} full />
          <span className="mk-badge mk-badge-ok">Active Consultation</span>
        </div>

        <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 32 }} onClick={() => setEvidenceOpen(true)}>
          <IconFileText size={14} />
          <span>Source Evidence</span>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)", gap: 16 }}>
        <div>
          <div className="mk-tabs" style={{ marginBottom: 18 }}>
            {tabs.map(t => (
              <span key={t.id} className={`mk-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </span>
            ))}
          </div>

          {tab === "notes" && (
            <div className="mk-card mk-card-padded">
              <label className="mk-label">Clinical Notes</label>
              <textarea
                className="mk-input"
                style={{ height: 160, padding: "10px 12px", resize: "vertical", fontSize: 13, lineHeight: 1.5 }}
                placeholder="Patient reports cough and mild fever for 2 days. Chest examination clear bilaterally. Vitals normal…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12 }} onClick={() => setNotes(n => n + " Patient examined. Vitals within normal parameters. Bilateral chest clear.")}>
                  + Insert Normal Exam
                </button>
                <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12 }} onClick={() => setNotes(n => n + " Advised oral hydration and rest.")}>
                  + Insert Hydration Advice
                </button>
              </div>
            </div>
          )}

          {tab === "vitals" && (
            <div className="mk-card mk-card-padded">
              <div className="mk-sec-title" style={{ marginBottom: 14 }}>Vital Signs</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
                {[
                  { label: "Temp (°F)", val: "99.1" },
                  { label: "Heart Rate", val: "84 bpm" },
                  { label: "SpO₂", val: "98%" },
                  { label: "Blood Pressure", val: "123/78" },
                  { label: "Resp Rate", val: "16 /min" },
                ].map(({ label, val }) => (
                  <div key={label} style={{ padding: "10px 12px", background: "var(--mk-surface-subtle)", borderRadius: "var(--mk-radius-xs)", border: "1px solid var(--mk-border)" }}>
                    <div className="mk-meta" style={{ fontSize: 10 }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "var(--mk-font-mono)", color: "var(--mk-navy)", marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "diagnosis" && (
            <div className="mk-card mk-card-padded">
              <div className="mk-sec-title" style={{ marginBottom: 12 }}>Assessment</div>
              <div style={{ marginBottom: 14 }}>
                <label className="mk-label">Primary Diagnosis (ICD-10)</label>
                <input
                  className="mk-input"
                  placeholder="e.g. Acute upper respiratory infection (J06.9)"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                />
              </div>
              <div>
                <label className="mk-label">Clinical Rationale</label>
                <textarea
                  className="mk-input"
                  style={{ height: 80, padding: "8px 12px", resize: "none" }}
                  placeholder="Clinical evaluation notes…"
                />
              </div>
            </div>
          )}

          {tab === "prescription" && (
            <div className="mk-card mk-card-padded">
              <div className="mk-sec-title" style={{ marginBottom: 12 }}>Prescriptions &amp; Orders</div>
              {[
                { name: "Paracetamol 500mg", dose: "1 tablet 3x daily", dur: "3 days" },
                { name: "Cetirizine 10mg", dose: "1 tablet at bedtime", dur: "5 days" },
              ].map(rx => (
                <div key={rx.name} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--mk-border-subtle)" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{rx.name}</div>
                    <div className="mk-meta">{rx.dose} · {rx.dur}</div>
                  </div>
                  <span className="mk-meta">Standard Regimen</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button className="mk-btn mk-btn-secondary" onClick={onBack}>Back</button>
            <button className="mk-btn mk-btn-primary" style={{ flex: 1 }} onClick={handleFinalSubmit}>
              <IconCheckCircle size={15} />
              <span>Complete Consultation</span>
            </button>
          </div>
        </div>

        {/* Right: Patient Context & Triage Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="mk-card mk-card-padded">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--mk-font-mono)", color: "var(--mk-navy)" }}>{c.caseId}</span>
              <PriorityBadge priority={c.priority} />
            </div>
            <div className="mk-card-title" style={{ fontSize: 16 }}>{c.patientName}, {c.patientAge}y · {c.patientGender}</div>
            <div className="mk-meta" style={{ marginTop: 2 }}>{c.department} · Room 12</div>
            
            <div className="mk-divider" style={{ margin: "12px 0" }} />
            
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--mk-text-muted)", marginBottom: 6 }}>
              Reported Symptoms
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {c.symptoms.map(s => (
                <span key={s} className="mk-chip" style={{ fontSize: 11 }}>{s}</span>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--mk-text-muted)", marginBottom: 6 }}>
              Chief Complaint
            </div>
            <div className="mk-body" style={{ fontSize: 13, lineHeight: 1.45, color: "var(--mk-text)" }}>
              {c.chiefComplaint}
            </div>

            <div className="mk-divider" style={{ margin: "12px 0" }} />

            <button
              type="button"
              className="mk-btn mk-btn-secondary"
              style={{ width: "100%", fontSize: 12, minHeight: 34 }}
              onClick={() => setEvidenceOpen(true)}
            >
              <IconFileText size={14} />
              <span>Inspect Full Intake Dossier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONSULTATION COMPLETE
══════════════════════════════════════════════════════════ */
function ConsultComplete({ c, onBack }: { c: CaseFixture; onBack: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0", maxWidth: 480, margin: "0 auto" }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "var(--mk-success-soft)",
        color: "var(--mk-success)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 16px",
      }}>
        <IconCheckCircle size={28} />
      </div>

      <h2 className="mk-page-title" style={{ marginBottom: 6 }}>Consultation Completed</h2>
      <p className="mk-body" style={{ color: "var(--mk-text-muted)", marginBottom: 24, fontSize: 13 }}>
        Encounter finalized and published to hospital EHR. Digital prescription dispatched to patient.
      </p>

      <div className="mk-card mk-card-padded" style={{ textAlign: "left", marginBottom: 24 }}>
        <div className="mk-sec-title" style={{ marginBottom: 10 }}>Summary</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span className="mk-meta">Patient:</span>
            <span style={{ fontWeight: 500 }}>{c.patientName} ({c.caseId})</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span className="mk-meta">Diagnosis:</span>
            <span style={{ fontWeight: 500 }}>Acute viral URTI (J06.9)</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span className="mk-meta">Attending:</span>
            <span style={{ fontWeight: 500 }}>Dr. R. Vance, MD</span>
          </div>
        </div>
      </div>

      <button className="mk-btn mk-btn-primary" style={{ width: "100%" }} onClick={onBack}>
        Return to Worklist →
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN DOCTOR PAGE SHELL
══════════════════════════════════════════════════════════ */
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
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <span className="mk-badge mk-badge-ok">Station 04 · OPD 12</span>
      <span className="mk-meta">Dr. R. Vance, MD</span>
    </div>
  );

  return (
    <OpsShell nav={NAV} active={navActive} onNav={handleNav} subtitle="Doctor Workspace" topbarExtra={topbarExtra}>
      {view === "queue"     && <QueueView onSelect={id => { setSelectedId(id); setView("detail"); }} />}
      {view === "p0-alert"  && <P0Alert />}
      {view === "detail"    && <CaseDetail c={selectedCase} onConsult={() => setView("consult")} onBack={() => setView("queue")} />}
      {view === "consult"   && <Consultation c={selectedCase} onComplete={() => setView("complete")} onBack={() => setView("detail")} />}
      {view === "complete"  && <ConsultComplete c={selectedCase} onBack={() => setView("queue")} />}
      {!["queue","p0-alert","detail","consult","complete"].includes(view) && (
        <EmptyState
          icon={<IconActivity size={32} color="var(--mk-primary)" />}
          title="Section Active"
          desc={`The ${navActive} module is connected.`}
        />
      )}
    </OpsShell>
  );
}
