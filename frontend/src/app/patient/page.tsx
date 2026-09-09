"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MKLogo, PriorityBadge, CaseTimeline, ToastContainer, pushToast } from "@/components/shared";
import { CASES } from "@/lib/fixtures";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
type Step =
  | "welcome" | "consent" | "identity" | "otp"
  | "intake" | "processing" | "clarification"
  | "outcome-p0" | "outcome-p1" | "outcome-p2" | "outcome-p3"
  | "dashboard";

type VoiceState = "idle" | "permission-denied" | "listening" | "transcribing" | "confirm" | "no-speech" | "unclear" | "network-error";

const STEP_LABELS = ["Welcome", "Consent", "Identity", "Verify", "Intake", "Review"];
const STEP_INDICES: Record<string, number> = { welcome:0, consent:1, identity:2, otp:3, intake:4, processing:5 };

/* ══════════════════════════════════════════════════════════
   STEPPER
══════════════════════════════════════════════════════════ */
function Stepper({ current }: { current: number }) {
  return (
    <div className="mk-stepper">
      {STEP_LABELS.map((label, i) => (
        <div className="mk-step" key={label}>
          <div className={`mk-step-dot ${i < current ? "done" : i === current ? "active" : ""}`} title={label}>
            {i < current ? "✓" : i + 1}
          </div>
          {i < STEP_LABELS.length - 1 && <div className={`mk-step-line ${i < current ? "done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   WELCOME + LANGUAGE
══════════════════════════════════════════════════════════ */
function Welcome({ onNext }: { onNext: () => void }) {
  const [lang, setLang] = useState("English");
  const LANGS = ["English", "हिंदी", "मराठी", "தமிழ்", "বাংলা"];
  return (
    <div style={{ textAlign: "center" }}>
      <MKLogo subtitle="Self Service Intake" />
      <h1 className="mk-display" style={{ marginTop: 28, marginBottom: 8 }}>Welcome to MediKiosk</h1>
      <p className="mk-body" style={{ color: "var(--mk-text-muted)", marginBottom: 28 }}>
        A smarter, faster way to begin your care.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
        {LANGS.map(l => (
          <button key={l}
            className={`mk-btn ${lang === l ? "mk-btn-primary" : "mk-btn-secondary"}`}
            style={{ justifyContent: "flex-start", paddingLeft: 16 }}
            onClick={() => setLang(l)}
          >{l}</button>
        ))}
      </div>
      <button className="mk-btn mk-btn-primary mk-btn-kiosk" style={{ width: "100%" }} onClick={onNext}>Get Started →</button>
      <p className="mk-meta" style={{ marginTop: 16 }}>Need help? Ask a staff member for assisted intake.</p>
      <p className="mk-meta" style={{ marginTop: 8, fontStyle: "italic" }}>Not an emergency service — for life-threatening emergencies, alert staff immediately.</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONSENT
══════════════════════════════════════════════════════════ */
function Consent({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [agreed, setAgreed] = useState(false);
  return (
    <div>
      <h2 className="mk-page-title" style={{ marginBottom: 8 }}>Consent &amp; Information</h2>
      <p className="mk-body" style={{ color: "var(--mk-text-muted)", marginBottom: 24 }}>
        Your information is used for clinical intake and queue allocation only.
      </p>
      <div className="mk-card mk-card-padded" style={{ background: "var(--mk-primary-soft)", marginBottom: 20 }}>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Your responses support clinical intake — not diagnosis.",
            "A doctor makes all final clinical decisions.",
            "Voice input is shown to you for confirmation before submission.",
            "Your identity is not sent to the AI engine.",
            "You can request staff assistance at any point.",
          ].map(item => <li key={item} className="mk-body">{item}</li>)}
        </ul>
      </div>
      <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", marginBottom: 24 }}>
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
          style={{ marginTop: 3, accentColor: "var(--mk-primary)", width: 18, height: 18, flexShrink: 0 }} />
        <span className="mk-body">I understand and agree to proceed with my clinical intake.</span>
      </label>
      {!agreed && (
        <div className="mk-card" style={{ padding: 12, background: "var(--mk-danger-soft)", border: "1px solid var(--mk-danger)", marginBottom: 16 }}>
          <p className="mk-meta" style={{ color: "var(--mk-danger)" }}>
            You must agree to continue. If you decline, please ask a staff member for alternative assistance.
          </p>
        </div>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <button className="mk-btn mk-btn-secondary" onClick={onBack}>← Back</button>
        <button className="mk-btn mk-btn-primary mk-btn-kiosk" style={{ flex: 1 }} disabled={!agreed} onClick={onNext}>Continue →</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   IDENTITY
══════════════════════════════════════════════════════════ */
function Identity({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [isNew, setIsNew] = useState<boolean | null>(null);
  const [phone, setPhone] = useState("");
  const [abha, setAbha] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!/^\+?[0-9]{10,13}$/.test(phone.replace(/\s/g, ""))) {
      setError("Please enter a valid mobile number.");
      return;
    }
    setError("");
    onNext();
  }

  return (
    <div>
      <h2 className="mk-page-title" style={{ marginBottom: 20 }}>Let&apos;s identify you</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[{ label: "New Patient", v: true }, { label: "Existing Patient", v: false }].map(({ label, v }) => (
          <button key={label} className={`mk-btn ${isNew === v ? "mk-btn-primary" : "mk-btn-secondary"}`}
            style={{ minHeight: 52 }} onClick={() => setIsNew(v)}>{label}</button>
        ))}
      </div>
      <div style={{ marginBottom: 16 }}>
        <label className="mk-label">Mobile Number</label>
        <input className={`mk-input ${error ? "mk-input-error" : ""}`} placeholder="+91 98765 43210"
          value={phone} onChange={e => { setPhone(e.target.value); setError(""); }}
          type="tel" autoComplete="tel" />
        {error && <p style={{ color: "var(--mk-danger)", fontSize: 12, marginTop: 4 }}>{error}</p>}
      </div>
      {isNew === false && (
        <div style={{ marginBottom: 16 }}>
          <label className="mk-label">ABHA ID (optional)</label>
          <input className="mk-input" placeholder="ABHA-XXXX-9213" value={abha} onChange={e => setAbha(e.target.value)} />
        </div>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <button className="mk-btn mk-btn-secondary" onClick={onBack}>← Back</button>
        <button className="mk-btn mk-btn-primary mk-btn-kiosk" style={{ flex: 1 }} onClick={submit}>Send OTP →</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   OTP VERIFY — with all error states
══════════════════════════════════════════════════════════ */
type OTPError = "" | "invalid-format" | "incorrect" | "expired" | "rate-limited" | "loading" | "error";

function OTPVerify({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [otp, setOtp] = useState("");
  const [state, setState] = useState<OTPError>("");
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const ERROR_MSG: Record<OTPError, string> = {
    "": "", loading: "", "invalid-format": "Enter the 6-digit code.",
    incorrect: "Incorrect OTP. Please try again.", expired: "This OTP has expired. Please request a new one.",
    "rate-limited": "Too many attempts. Please wait before requesting a new OTP.",
    error: "Verification failed. Please try again.",
  };

  function verify() {
    if (otp.length !== 6) { setState("invalid-format"); return; }
    setLoading(true);
    // ponytail: simulated verify — wire to POST /api/auth/verify-otp
    setTimeout(() => {
      setLoading(false);
      if (otp === "000000") { setState("expired"); return; }
      if (otp !== "123456") { setState("incorrect"); return; }
      onNext();
    }, 1000);
  }

  function resend() {
    if (countdown > 0) return;
    setCountdown(30);
    setState("");
    setOtp("");
    pushToast("OTP resent to +91 98765 43210", "success");
  }

  return (
    <div>
      <h2 className="mk-page-title" style={{ marginBottom: 8 }}>Enter the 6-digit code</h2>
      <p className="mk-body" style={{ color: "var(--mk-text-muted)", marginBottom: 24 }}>Sent to +91 98765 43210. Valid for 5 minutes.</p>
      <div style={{ marginBottom: 16 }}>
        <input className={`mk-input ${state && state !== "loading" ? "mk-input-error" : ""}`}
          placeholder="• • • • • •" maxLength={6} value={otp}
          onChange={e => { setOtp(e.target.value.replace(/\D/g, "")); setState(""); }}
          style={{ fontSize: 24, textAlign: "center", letterSpacing: 12 }}
          inputMode="numeric" autoComplete="one-time-code" disabled={loading} />
        {state && state !== "loading" && <p style={{ color: "var(--mk-danger)", fontSize: 12, marginTop: 4 }}>{ERROR_MSG[state]}</p>}
      </div>
      <div style={{ marginBottom: 20, display: "flex", gap: 8, alignItems: "center" }}>
        {countdown > 0
          ? <span className="mk-meta">Resend in {countdown}s</span>
          : <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 32 }} onClick={resend}>Resend OTP</button>
        }
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button className="mk-btn mk-btn-secondary" onClick={onBack} disabled={loading}>← Back</button>
        <button className="mk-btn mk-btn-primary mk-btn-kiosk" style={{ flex: 1 }} onClick={verify} disabled={loading}>
          {loading ? "Verifying…" : "Verify →"}
        </button>
      </div>
      <p className="mk-meta" style={{ marginTop: 12, textAlign: "center" }}>Demo: <strong>123456</strong> = success · <strong>000000</strong> = expired · any other = incorrect</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   VOICE INTAKE
══════════════════════════════════════════════════════════ */
const QUESTIONS = [
  "What brings you here today? Please describe your main symptoms.",
  "How long have you had these symptoms?",
  "On a scale of 1–10, how severe is your discomfort right now?",
  "Do you have any existing medical conditions or known allergies?",
  "Are you currently taking any medications?",
];

function VoiceIntake({ onSubmit, onBack }: { onSubmit: () => void; onBack: () => void }) {
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(QUESTIONS.length).fill(""));
  const [draft, setDraft] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

  const VOICE_DEMOS: string[] = [
    "Cough for 2 days, mild fever and body ache.",
    "About 2 days.", "Around 5 out of 10.", "No conditions, no allergies.", "None.",
  ];

  function startListening() {
    // ponytail: wire to Web Speech API (SpeechRecognition) in production
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      // Simulate for demo
      setVoiceState("listening");
      setTimeout(() => { setVoiceState("transcribing"); }, 1500);
      setTimeout(() => { setDraft(VOICE_DEMOS[qIdx] ?? ""); setVoiceState("confirm"); }, 2500);
      return;
    }
    setVoiceState("listening");
  }

  function stopListening() { setVoiceState("idle"); }

  function confirmAnswer() {
    const ans = draft || answers[qIdx];
    if (!ans.trim()) return;
    const next = [...answers];
    next[qIdx] = ans;
    setAnswers(next);
    setDraft("");
    setVoiceState("idle");
    if (qIdx < QUESTIONS.length - 1) setQIdx(q => q + 1);
  }

  const allAnswered = answers.every(a => a.length > 0);
  const VOICE_LABELS: Record<VoiceState, string> = {
    idle: "Tap to speak", "permission-denied": "Microphone access denied",
    listening: "Listening… tap to stop", transcribing: "Transcribing…",
    confirm: "Review your answer below", "no-speech": "No speech detected — please try again",
    unclear: "Speech unclear — please type or try again", "network-error": "Network error — please type your answer",
  };

  return (
    <div>
      {/* Progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span className="mk-meta">Question {qIdx + 1} of {QUESTIONS.length}</span>
          <span className="mk-meta">{Math.round((qIdx / QUESTIONS.length) * 100)}% complete</span>
        </div>
        <div style={{ height: 4, background: "var(--mk-border)", borderRadius: 2 }}>
          <div style={{ height: "100%", background: "var(--mk-primary)", borderRadius: 2, width: `${(qIdx / QUESTIONS.length) * 100}%`, transition: "width 400ms var(--mk-ease)" }} />
        </div>
      </div>

      {/* Question */}
      <div className="mk-card mk-card-padded" style={{ background: "var(--mk-primary-soft)", marginBottom: 20 }}>
        <p className="mk-card-title">{QUESTIONS[qIdx]}</p>
      </div>

      {/* Voice UI */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 20 }}>
        {voiceState === "permission-denied" ? (
          <div className="mk-card" style={{ padding: 16, background: "var(--mk-danger-soft)", border: "1px solid var(--mk-danger)", width: "100%", textAlign: "center" }}>
            <p className="mk-body" style={{ color: "var(--mk-danger)" }}>Microphone permission denied. Please use the text field below or ask a staff member.</p>
            <button className="mk-btn mk-btn-secondary" style={{ marginTop: 10 }} onClick={() => setVoiceState("idle")}>Use Text Input</button>
          </div>
        ) : voiceState === "network-error" ? (
          <div className="mk-card" style={{ padding: 16, background: "var(--mk-warning-soft)", border: "1px solid var(--mk-warning)", width: "100%", textAlign: "center" }}>
            <p className="mk-body">Network error — voice input unavailable. Please type your answer below.</p>
            <button className="mk-btn mk-btn-secondary" style={{ marginTop: 10 }} onClick={() => setVoiceState("idle")}>Use Text Input</button>
          </div>
        ) : (
          <>
            <button
              className={`mk-mic-btn ${voiceState === "listening" ? "listening" : ""}`}
              onClick={voiceState === "listening" ? stopListening : startListening}
              aria-label={voiceState === "listening" ? "Stop listening" : "Tap to speak"}
              disabled={voiceState === "transcribing"}
            >
              {voiceState === "transcribing" ? "⏳" : "🎤"}
            </button>
            <div style={{ textAlign: "center" }}>
              <span className="mk-meta">{VOICE_LABELS[voiceState]}</span>
              {voiceState === "listening" && (
                <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 8 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ width: 3, height: 8 + i * 4, background: "var(--mk-primary)", borderRadius: 2, animation: `mk-pulse ${0.3 + i * 0.1}s infinite alternate` }} />
                  ))}
                </div>
              )}
            </div>
            {/* Simulate error states for demo */}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="mk-btn mk-btn-ghost" style={{ fontSize: 10, minHeight: 24, padding: "0 8px" }} onClick={() => setVoiceState("permission-denied")}>Demo: Mic denied</button>
              <button className="mk-btn mk-btn-ghost" style={{ fontSize: 10, minHeight: 24, padding: "0 8px" }} onClick={() => setVoiceState("no-speech")}>Demo: No speech</button>
              <button className="mk-btn mk-btn-ghost" style={{ fontSize: 10, minHeight: 24, padding: "0 8px" }} onClick={() => setVoiceState("network-error")}>Demo: Network error</button>
            </div>
          </>
        )}
      </div>

      {/* Text input / transcript confirmation */}
      <div style={{ marginBottom: 16 }}>
        <label className="mk-label">Your response (confirm or edit)</label>
        <textarea
          className="mk-input" style={{ height: 80, padding: "10px 12px", resize: "none" }}
          placeholder="Type here or use the microphone above…"
          value={draft || answers[qIdx]}
          onChange={e => setDraft(e.target.value)}
        />
        {voiceState === "confirm" && (
          <p className="mk-meta" style={{ marginTop: 4, color: "var(--mk-success)" }}>
            ✓ Voice transcribed — review and confirm or edit above before continuing.
          </p>
        )}
        <p className="mk-meta" style={{ marginTop: 4 }}>Voice answers are shown here for your review before submission.</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button className="mk-btn mk-btn-secondary" onClick={() => (qIdx > 0 ? setQIdx(q => q - 1) : onBack())}>
          ← Back
        </button>
        <button className="mk-btn mk-btn-primary" style={{ flex: 1 }} onClick={confirmAnswer}
          disabled={!draft && !answers[qIdx]}>
          {qIdx < QUESTIONS.length - 1 ? "Confirm & Next →" : "Review Answers →"}
        </button>
      </div>

      {/* Answer review */}
      {answers.some(a => a) && (
        <div>
          <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 8 }}>Your answers so far</div>
          {answers.slice(0, qIdx + 1).map((a, i) => a && (
            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--mk-border)" }}>
              <div className="mk-meta" style={{ fontWeight: 600 }}>{QUESTIONS[i]}</div>
              <div className="mk-body">{a}</div>
            </div>
          ))}
        </div>
      )}

      {allAnswered && (
        <div style={{ marginTop: 20 }}>
          <div className="mk-divider" />
          <button className="mk-btn mk-btn-primary mk-btn-kiosk" style={{ width: "100%" }} onClick={onSubmit}>
            Submit Intake →
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PROCESSING
══════════════════════════════════════════════════════════ */
function Processing({ onDone }: { onDone: (s: Step) => void }) {
  const [phase, setPhase] = useState(0);
  const phases = ["Reviewing your responses…", "Analysing indicators…", "Determining priority…", "Almost done…"];

  useEffect(() => {
    const timers = phases.map((_, i) => setTimeout(() => setPhase(i), i * 900));
    const done = setTimeout(() => onDone("outcome-p2"), phases.length * 900 + 400);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <div className="mk-skeleton" style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 24px" }} />
      <h2 className="mk-page-title" style={{ marginBottom: 8 }}>Processing your information</h2>
      <p className="mk-body" style={{ color: "var(--mk-text-muted)", marginBottom: 24 }}>{phases[phase]}</p>
      <div style={{ height: 4, background: "var(--mk-border)", borderRadius: 2, maxWidth: 240, margin: "0 auto" }}>
        <div style={{ height: "100%", background: "var(--mk-primary)", borderRadius: 2, width: `${((phase + 1) / phases.length) * 100}%`, transition: "width 700ms var(--mk-ease)" }} />
      </div>
      <p className="mk-meta" style={{ marginTop: 20 }}>We are analysing your information. This is not a diagnosis.</p>
      {/* Demo outcome switcher */}
      <div style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        {(["outcome-p0","outcome-p1","outcome-p2","outcome-p3"] as Step[]).map(s => (
          <button key={s} className="mk-btn mk-btn-ghost" style={{ fontSize: 11, height: 28, padding: "0 8px", border: "1px solid var(--mk-border)" }} onClick={() => onDone(s)}>
            Demo: {s.replace("outcome-","").toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CLARIFICATION
══════════════════════════════════════════════════════════ */
function ClarificationNeeded({ onSubmit }: { onSubmit: () => void }) {
  const [answer, setAnswer] = useState("");
  return (
    <div>
      <div className="mk-badge mk-badge-warn" style={{ marginBottom: 16, display: "inline-flex" }}>Clarification Needed</div>
      <h2 className="mk-page-title" style={{ marginBottom: 8 }}>A little more information</h2>
      <p className="mk-body" style={{ color: "var(--mk-text-muted)", marginBottom: 24 }}>
        We need one more piece of information to complete your intake. Please answer the question below.
      </p>
      <div className="mk-card mk-card-padded" style={{ background: "var(--mk-warning-soft)", marginBottom: 20 }}>
        <p className="mk-card-title">Have you experienced any difficulty breathing or chest pain in the last hour?</p>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["Yes", "No"].map(opt => (
          <button key={opt} className={`mk-btn ${answer === opt ? "mk-btn-primary" : "mk-btn-secondary"}`} style={{ flex: 1, minHeight: 52 }} onClick={() => setAnswer(opt)}>{opt}</button>
        ))}
      </div>
      {answer && (
        <button className="mk-btn mk-btn-primary mk-btn-kiosk" style={{ width: "100%" }} onClick={onSubmit}>
          Submit Answer →
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   OUTCOME SCREENS — P0 / P1 / P2 / P3
══════════════════════════════════════════════════════════ */
function P0Outcome() {
  const c = CASES.P0;
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const t = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(t); }, []);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  return (
    <div>
      <div className="mk-p0-banner" style={{ marginBottom: 20, fontSize: 15, justifyContent: "space-between" }}>
        <span>⚠ URGENT ATTENTION REQUIRED</span>
        <span>Response timer: {fmt(elapsed)}</span>
      </div>
      <h2 className="mk-display" style={{ color: "var(--mk-danger)", marginBottom: 12 }}>Immediate escalation triggered</h2>
      <p className="mk-body" style={{ marginBottom: 24 }}>
        Based on your responses, our system has indicated you may need immediate medical attention. Hospital staff have been alerted. <strong>This is not a diagnosis.</strong>
      </p>
      <div className="mk-p0-alert" style={{ marginBottom: 24 }}>
        <div className="mk-sec-title" style={{ marginBottom: 12 }}>What to do now</div>
        <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          <li className="mk-body"><strong>Remain at this kiosk / your current location.</strong></li>
          <li className="mk-body">A staff member is on their way to assist you.</li>
          <li className="mk-body">Do not leave the area — you will be seen shortly.</li>
          <li className="mk-body">If your condition worsens rapidly, call out for help or press the emergency button nearby.</li>
        </ul>
      </div>
      <CaseTimeline events={c.timeline} />
      <div className="mk-meta" style={{ marginTop: 24, textAlign: "center", color: "var(--mk-danger)" }}>
        Case ID: {c.caseId} · No queue token · No admin approval required · Automatic emergency protocol active
      </div>
    </div>
  );
}

function P1Outcome() {
  const c = CASES.P1;
  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <PriorityBadge priority="P1" full />
        <h2 className="mk-page-title">Urgent Handoff</h2>
      </div>
      <div className="mk-card mk-card-padded" style={{ borderColor: "var(--mk-warning)", background: "var(--mk-warning-soft)", marginBottom: 20 }}>
        <p className="mk-card-title" style={{ color: "var(--mk-warning)", marginBottom: 8 }}>Urgent clinical assessment required</p>
        <p className="mk-body">A clinician has been assigned and is being connected for your case. Please follow the instructions below immediately.</p>
      </div>
      {[
        { label: "Department", value: c.department },
        { label: "Status", value: "Clinician connecting — urgent handoff in progress" },
        { label: "Next instruction", value: "Proceed to Reception Desk B and wait for your name to be called" },
        { label: "ETA", value: c.estimatedWait ?? "~30 minutes" },
      ].map(({ label, value }) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--mk-border)", padding: "10px 0" }}>
          <span className="mk-meta" style={{ fontWeight: 600 }}>{label}</span>
          <span className="mk-body" style={{ textAlign: "right", maxWidth: "60%" }}>{value}</span>
        </div>
      ))}
      <div style={{ marginTop: 20 }}>
        <CaseTimeline events={c.timeline} />
      </div>
      <div className="mk-meta" style={{ marginTop: 20, textAlign: "center" }}>Case: {c.caseId} · P1 urgent handoff — not a routine queue</div>
    </div>
  );
}

function P2Outcome() {
  const c = CASES.P2;
  const [updates, setUpdates] = useState(3);
  useEffect(() => {
    const t = setInterval(() => setUpdates(u => Math.max(0, u - 1)), 8000);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <PriorityBadge priority="P2" full />
        <h2 className="mk-page-title">Standard Queue</h2>
      </div>
      <div className="mk-card mk-card-padded" style={{ background: "var(--mk-primary-soft)", marginBottom: 20, textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: "var(--mk-navy)" }}>{c.token}</div>
        <div className="mk-meta">Your queue token — keep this handy</div>
        <div className="mk-badge mk-badge-ok" style={{ marginTop: 8 }}>● Token confirmed</div>
      </div>
      {[
        { label: "Department", value: c.department },
        { label: "Assigned clinician", value: c.doctor },
        { label: "Queue type", value: "Standard Queue (P2)" },
        { label: "Patients ahead", value: String(updates) },
        { label: "Estimated wait", value: c.estimatedWait ?? "~30 min" },
        { label: "Appointment confirmed", value: "14 Oct 2024, 10:00 AM" },
      ].map(({ label, value }) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--mk-border)", padding: "10px 0" }}>
          <span className="mk-meta" style={{ fontWeight: 600 }}>{label}</span>
          <span className="mk-body">{value}</span>
        </div>
      ))}
      <div className="mk-card mk-card-padded" style={{ marginTop: 20 }}>
        <div className="mk-sec-title" style={{ marginBottom: 8 }}>What to do next</div>
        <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li className="mk-body">Take a seat in the General Medicine waiting area.</li>
          <li className="mk-body">Keep token <strong>{c.token}</strong> handy — you&apos;ll be notified when it&apos;s your turn.</li>
          <li className="mk-body">If symptoms worsen, return to this kiosk or inform staff immediately.</li>
        </ol>
      </div>
    </div>
  );
}

function P3Outcome() {
  const c = CASES.P3;
  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <PriorityBadge priority="P3" full />
        <h2 className="mk-page-title">Fast Track</h2>
      </div>
      <div className="mk-card mk-card-padded" style={{ borderColor: "var(--mk-success)", background: "var(--mk-success-soft)", marginBottom: 20, textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: "var(--mk-success)" }}>{c.token}</div>
        <div className="mk-meta">Fast Track token</div>
        <div className="mk-badge mk-badge-p3" style={{ marginTop: 8 }}>Fast Track (P3)</div>
      </div>
      {[
        { label: "Location", value: "Fast Track — Level 1, Counter 3" },
        { label: "Department", value: c.department },
        { label: "Patients ahead", value: String(c.patientsAhead) },
        { label: "Estimated wait", value: c.estimatedWait ?? "~10 min" },
      ].map(({ label, value }) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--mk-border)", padding: "10px 0" }}>
          <span className="mk-meta" style={{ fontWeight: 600 }}>{label}</span>
          <span className="mk-body">{value}</span>
        </div>
      ))}
      <div className="mk-card mk-card-padded" style={{ marginTop: 20, background: "var(--mk-warning-soft)", borderColor: "var(--mk-warning)" }}>
        <div className="mk-sec-title" style={{ marginBottom: 8 }}>⚠ Safety guidance</div>
        <p className="mk-body">If symptoms worsen — fever above 103°F, difficulty breathing, or chest pain — return to the main desk immediately. Do not remain in the fast-track queue if your condition changes.</p>
      </div>
      <div className="mk-meta" style={{ marginTop: 16, textAlign: "center" }}>A helper will guide you to the Fast Track area · {c.caseId}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   POST-CONSULTATION DASHBOARD
══════════════════════════════════════════════════════════ */
type DashTab = "summary" | "prescription" | "reports" | "followup" | "records" | "profile";

function PostConsultDashboard() {
  const [tab, setTab] = useState<DashTab>("summary");
  const tabs: Array<{ id: DashTab; label: string; icon: string }> = [
    { id: "summary", label: "Visit Summary", icon: "📋" },
    { id: "prescription", label: "Prescription", icon: "💊" },
    { id: "reports", label: "Lab Reports", icon: "🧪" },
    { id: "followup", label: "Follow-up", icon: "📅" },
    { id: "records", label: "Past Records", icon: "📁" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  return (
    <div>
      {/* Patient header */}
      <div className="mk-card mk-card-padded" style={{ marginBottom: 20, display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--mk-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>RM</div>
        <div style={{ flex: 1 }}>
          <div className="mk-card-title">Rohan Mehta</div>
          <div className="mk-meta">ABHA-2048-XXXX · {CASES.P2.caseId}</div>
        </div>
        <div>
          <div className="mk-meta">Latest visit</div>
          <div className="mk-body">14 Oct 2024, 11:00 AM</div>
        </div>
        <Link href="/patient/new-visit">
          <button className="mk-btn mk-btn-primary">+ New Visit</button>
        </Link>
      </div>

      {/* Quick stats */}
      <div className="mk-kpi-grid" style={{ marginBottom: 20 }}>
        {[
          { label: "Prescriptions", value: "3", icon: "💊" },
          { label: "Lab Reports", value: "2", icon: "🧪" },
          { label: "Follow-up", value: "21 Oct", icon: "📅" },
          { label: "Past Records", value: "4", icon: "📁" },
        ].map(({ label, value, icon }) => (
          <div className="mk-kpi" key={label} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span className="mk-meta" style={{ fontWeight: 600 }}>{label}</span>
              <span>{icon}</span>
            </div>
            <div className="mk-kpi-value" style={{ fontSize: 22 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Bottom tabs */}
      <div className="mk-tabs" style={{ marginBottom: 20, overflowX: "auto" }}>
        {tabs.map(t => (
          <span key={t.id} className={`mk-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}
            style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            {t.icon} {t.label}
          </span>
        ))}
      </div>

      {tab === "summary"      && <VisitSummary />}
      {tab === "prescription" && <PrescriptionView />}
      {tab === "reports"      && <LabReports />}
      {tab === "followup"     && <FollowUp />}
      {tab === "records"      && <PastRecords />}
      {tab === "profile"      && <ProfileSettings />}
    </div>
  );
}

function VisitSummary() {
  return (
    <div className="mk-card mk-card-padded">
      <div className="mk-sec-title" style={{ marginBottom: 16 }}>Visit Summary</div>
      {[
        { label: "Doctor", value: "Dr. R. Vance" },
        { label: "Department", value: "General Medicine" },
        { label: "Date & Time", value: "14 Oct 2024, 11:00 AM" },
        { label: "Case ID", value: CASES.P2.caseId },
      ].map(({ label, value }) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--mk-border)" }}>
          <span className="mk-meta" style={{ fontWeight: 600 }}>{label}</span>
          <span className="mk-body">{value}</span>
        </div>
      ))}
      <div style={{ marginTop: 16 }}>
        <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 6 }}>Clinical Summary</div>
        <p className="mk-body">Acute viral upper respiratory infection (J06.9). Mild fever and cough, 2 days. On examination chest clear, vitals stable. Likely viral URTI.</p>
        <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 6, marginTop: 12 }}>Next Steps</div>
        <p className="mk-body">Take medications as prescribed. Stay hydrated. Return if fever persists beyond 3 days or breathlessness develops.</p>
      </div>
      <p className="mk-meta" style={{ marginTop: 16, fontStyle: "italic" }}>Record published after doctor sign-off on 14 Oct 2024 at 11:42 AM.</p>
    </div>
  );
}

function PrescriptionView() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const rxItems = [
    { name: "Paracetamol 500mg", dose: "1 tablet × 3 times/day", duration: "3 days", instructions: "Take after meals" },
    { name: "Cetirizine 10mg", dose: "1 tablet × at night", duration: "5 days", instructions: "May cause drowsiness" },
    { name: "Dextromethorphan syrup", dose: "10 ml × 3 times/day", duration: "3 days", instructions: "Shake well before use" },
  ];

  function download(name: string) {
    setDownloading(name);
    setTimeout(() => { setDownloading(null); pushToast(`${name} prescription downloaded`, "success"); }, 1500);
  }

  return (
    <div>
      <div className="mk-card mk-card-padded" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="mk-sec-title">Prescription</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 32 }}>🖨 Print</button>
            <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 32 }} onClick={() => pushToast("Confirmation sent to +91 98765 43210", "success")}>📤 Share (SMS)</button>
          </div>
        </div>
        {rxItems.map(rx => (
          <div key={rx.name} style={{ padding: "12px 0", borderBottom: "1px solid var(--mk-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="mk-card-title">{rx.name}</div>
                <div className="mk-meta">{rx.dose} · {rx.duration}</div>
                <div className="mk-meta" style={{ color: "var(--mk-text-muted)" }}>{rx.instructions}</div>
              </div>
              <button className="mk-btn mk-btn-ghost" style={{ fontSize: 12, minHeight: 32 }} onClick={() => download(rx.name)}>
                {downloading === rx.name ? "⏳" : "⬇"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mk-meta" style={{ textAlign: "center" }}>
        Prescription published 14 Oct 2024 after doctor sign-off. Download requires your confirmation.
      </div>
    </div>
  );
}

function LabReports() {
  return (
    <div>
      <div className="mk-card mk-card-padded" style={{ marginBottom: 16 }}>
        <div className="mk-sec-title" style={{ marginBottom: 16 }}>Lab Reports</div>
        {[
          { name: "CBC — Blood Count", date: "14 Oct 2024", status: "available", result: "Normal" },
          { name: "Chest X-Ray", date: "14 Oct 2024", status: "available", result: "View" },
        ].map(r => (
          <div key={r.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--mk-border)" }}>
            <div>
              <div className="mk-card-title">{r.name}</div>
              <div className="mk-meta">{r.date}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className={`mk-badge ${r.result === "Normal" ? "mk-badge-ok" : "mk-badge-info"}`}>{r.result}</span>
              <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 32 }} onClick={() => pushToast(`Opening ${r.name}`, "info")}>View</button>
              <button className="mk-btn mk-btn-ghost" style={{ fontSize: 12, minHeight: 32 }}>⬇</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mk-card mk-card-padded" style={{ background: "var(--mk-warning-soft)", borderColor: "var(--mk-warning)" }}>
        <div className="mk-meta" style={{ fontWeight: 600 }}>Pending reports</div>
        <p className="mk-body">Some reports may not be immediately available. You will be notified when they are ready.</p>
      </div>
    </div>
  );
}

function FollowUp() {
  return (
    <div>
      <div className="mk-card mk-card-padded" style={{ marginBottom: 16 }}>
        <div className="mk-sec-title" style={{ marginBottom: 16 }}>Follow-up &amp; Reminders</div>
        <div style={{ padding: "12px 0", borderBottom: "1px solid var(--mk-border)" }}>
          <div className="mk-card-title">Next Visit</div>
          <div className="mk-body">21 Oct 2024, 10:30 AM · Dr. R. Vance · General Medicine</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="mk-btn mk-btn-primary" style={{ fontSize: 12, minHeight: 32 }} onClick={() => pushToast("Added to calendar", "success")}>+ Add to Calendar</button>
            <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 32 }}>Get Reminder (SMS/WhatsApp)</button>
          </div>
        </div>
        <div style={{ padding: "12px 0" }}>
          <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 6 }}>Reminders</div>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li className="mk-body">Take medicines as prescribed.</li>
            <li className="mk-body">Monitor temperature daily.</li>
            <li className="mk-body">Return earlier if symptoms worsen.</li>
          </ul>
        </div>
      </div>
      <div className="mk-card mk-card-padded" style={{ background: "var(--mk-warning-soft)", borderColor: "var(--mk-warning)" }}>
        <div className="mk-sec-title" style={{ marginBottom: 8 }}>⚠ When to seek immediate help</div>
        <p className="mk-body">Return to the hospital immediately if you develop breathlessness, chest pain, confusion, or fever above 103°F.</p>
        <button className="mk-btn mk-btn-danger" style={{ marginTop: 12 }} onClick={() => pushToast("Routing you to intake for a new assessment", "info")}>
          Start New Intake →
        </button>
      </div>
    </div>
  );
}

function PastRecords() {
  const records = [
    { date: "14 Oct 2024", diagnosis: "Acute viral URTI (J06.9)", doctor: "Dr. R. Vance" },
    { date: "12 Aug 2024", diagnosis: "Seasonal allergic rhinitis", doctor: "Dr. K. Iyer" },
    { date: "21 Jan 2024", diagnosis: "Viral fever", doctor: "Dr. R. Vance" },
    { date: "03 Sep 2023", diagnosis: "Annual general checkup", doctor: "Dr. M. Sharma" },
  ];
  return (
    <div className="mk-card">
      <div style={{ padding: "16px 16px 12px" }}>
        <div className="mk-sec-title">Past Records</div>
      </div>
      {records.map(r => (
        <div key={r.date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--mk-border)" }}>
          <div>
            <div className="mk-body" style={{ fontWeight: 600 }}>{r.diagnosis}</div>
            <div className="mk-meta">{r.date} · {r.doctor}</div>
          </div>
          <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 32 }}>View</button>
        </div>
      ))}
    </div>
  );
}

function ProfileSettings() {
  const [notifPref, setNotifPref] = useState("SMS");
  const [saved, setSaved] = useState(false);
  function save() { setSaved(true); pushToast("Profile updated", "success"); setTimeout(() => setSaved(false), 2000); }
  return (
    <div className="mk-card mk-card-padded">
      <div className="mk-sec-title" style={{ marginBottom: 20 }}>Profile &amp; Settings</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="mk-label">Language</label>
          <select className="mk-input" style={{ height: 40 }}>
            {["English", "हिंदी", "मराठी", "தமிழ்", "বাংলা"].map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="mk-label">Notification Preference</label>
          <div style={{ display: "flex", gap: 10 }}>
            {["SMS", "WhatsApp", "None"].map(opt => (
              <button key={opt} className={`mk-btn ${notifPref === opt ? "mk-btn-primary" : "mk-btn-secondary"}`} style={{ flex: 1 }} onClick={() => setNotifPref(opt)}>{opt}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="mk-label">Mobile</label>
          <input className="mk-input" defaultValue="+91 98765 43210" />
        </div>
        <div>
          <label className="mk-label">ABHA ID</label>
          <input className="mk-input" defaultValue="ABHA-2048-XXXX" />
        </div>
        <div className="mk-divider" />
        <div>
          <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 8 }}>Privacy &amp; Data</div>
          <p className="mk-body" style={{ color: "var(--mk-text-muted)" }}>Your data is used only for clinical intake. AI receives anonymised intake data only. You may request data deletion by contacting your hospital.</p>
        </div>
        <button className="mk-btn mk-btn-primary" onClick={save}>{saved ? "✓ Saved" : "Save Changes"}</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PATIENT PAGE
══════════════════════════════════════════════════════════ */
export default function PatientPage() {
  const [step, setStep] = useState<Step>("welcome");
  const isOutcome = step.startsWith("outcome-");
  const isDashboard = step === "dashboard";
  const stepIndex = STEP_INDICES[step] ?? 5;

  return (
    <div className="mk-kiosk" style={{ padding: "24px 16px" }}>
      <div className="mk-kiosk-panel" style={isDashboard ? { maxWidth: 760 } : {}}>
        {!isOutcome && !isDashboard && step !== "processing" && <Stepper current={stepIndex} />}

        {step === "welcome"       && <Welcome onNext={() => setStep("consent")} />}
        {step === "consent"       && <Consent onNext={() => setStep("identity")} onBack={() => setStep("welcome")} />}
        {step === "identity"      && <Identity onNext={() => setStep("otp")} onBack={() => setStep("consent")} />}
        {step === "otp"           && <OTPVerify onNext={() => setStep("intake")} onBack={() => setStep("identity")} />}
        {step === "intake"        && <VoiceIntake onSubmit={() => setStep("processing")} onBack={() => setStep("otp")} />}
        {step === "processing"    && <Processing onDone={s => setStep(s)} />}
        {step === "clarification" && <ClarificationNeeded onSubmit={() => setStep("processing")} />}
        {step === "outcome-p0"    && <P0Outcome />}
        {step === "outcome-p1"    && <P1Outcome />}
        {step === "outcome-p2"    && <P2Outcome />}
        {step === "outcome-p3"    && <P3Outcome />}
        {step === "dashboard"     && <PostConsultDashboard />}

        {/* Footer actions */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--mk-border)", display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(isOutcome || isDashboard) && (
            <button className="mk-btn mk-btn-ghost" style={{ fontSize: 12 }} onClick={() => setStep("welcome")}>← Start New Visit</button>
          )}
          {isOutcome && step !== "outcome-p0" && (
            <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12 }} onClick={() => setStep("dashboard")}>View Dashboard →</button>
          )}
          {/* Demo shortcuts */}
          {!isDashboard && (
            <button className="mk-btn mk-btn-ghost" style={{ fontSize: 11, marginLeft: "auto", color: "var(--mk-text-muted)" }} onClick={() => setStep("dashboard")}>Demo: Post-consultation dashboard</button>
          )}
        </div>
      </div>

      <p className="mk-meta" style={{ textAlign: "center", marginTop: 16 }}>
        MediKiosk · Not a diagnosis tool · Doctor makes all final clinical decisions
      </p>
      <ToastContainer />
    </div>
  );
}
