"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MKLogo, PriorityBadge, CaseTimeline, ToastContainer, pushToast } from "@/components/shared";
import {
  IconMic,
  IconMicOff,
  IconClock,
  IconAlertTriangle,
  IconCheckCircle,
  IconChevronRight,
  IconArrowLeft,
  IconArrowRight,
  IconShield,
  IconActivity,
  IconUser,
  IconFileText,
  IconPill,
  IconSend,
  IconCheck,
  IconDownload,
  IconAlertCircle,
} from "@/components/icons";
import { CASES } from "@/lib/fixtures";

/* ══════════════════════════════════════════════════════════
   TYPES & STEP FLOW
══════════════════════════════════════════════════════════ */
type Step =
  | "welcome" | "consent" | "identity" | "otp"
  | "intake" | "processing" | "clarification"
  | "outcome-p0" | "outcome-p1" | "outcome-p2" | "outcome-p3"
  | "dashboard";

type VoiceState = "idle" | "listening" | "transcribing" | "confirm" | "error";

const STEP_LABELS = ["Language", "Terms", "Identity", "Verification", "Intake"];
const STEP_INDICES: Record<string, number> = { welcome: 0, consent: 1, identity: 2, otp: 3, intake: 4 };

/* ══════════════════════════════════════════════════════════
   STEPPER
   Minimal, quiet hairline progression
══════════════════════════════════════════════════════════ */
function Stepper({ current }: { current: number }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)" }}>
          Step {current + 1} of {STEP_LABELS.length} · {STEP_LABELS[current]}
        </span>
        <span style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "var(--color-brand)", fontWeight: 600 }}>
          {Math.round(((current + 1) / STEP_LABELS.length) * 100)}%
        </span>
      </div>
      <div style={{ height: 2, background: "var(--color-border)", borderRadius: 1 }}>
        <div style={{
          height: "100%",
          background: "var(--color-brand)",
          borderRadius: 1,
          width: `${((current + 1) / STEP_LABELS.length) * 100}%`,
          transition: "width 300ms var(--mk-ease)",
        }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   1. WELCOME + LANGUAGE
══════════════════════════════════════════════════════════ */
function Welcome({ onNext }: { onNext: () => void }) {
  const [lang, setLang] = useState("English");
  const LANGS = ["English", "हिंदी", "मराठी", "தமிழ்", "বাংলা"];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <MKLogo subtitle="Patient Check-in" />
      </div>

      <h1 style={{
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        color: "var(--mk-navy)",
        margin: "0 0 8px",
      }}>
        Welcome to Patient Check-in
      </h1>
      <p className="mk-body" style={{ color: "var(--mk-text-muted)", marginBottom: 24 }}>
        Please take a couple of minutes to share your symptoms so our care team can assign you to the right department.
      </p>

      <div style={{ marginBottom: 24 }}>
        <label className="mk-label">Select Preferred Language</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
          {LANGS.map(l => (
            <button
              key={l}
              className={`mk-btn ${lang === l ? "mk-btn-primary" : "mk-btn-secondary"}`}
              style={{ minHeight: 46, fontSize: 14, fontWeight: 500 }}
              onClick={() => setLang(l)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <button
        className="mk-btn mk-btn-primary mk-btn-kiosk"
        style={{ width: "100%", minHeight: 48, fontSize: 15 }}
        onClick={onNext}
      >
        Start Check-in →
      </button>

      <div style={{
        marginTop: 20,
        paddingTop: 16,
        borderTop: "1px solid var(--mk-border-subtle)",
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
      }}>
        <IconAlertCircle size={15} color="var(--mk-text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p className="mk-meta" style={{ color: "var(--mk-text-muted)", margin: 0, lineHeight: 1.5 }}>
          Staff are nearby if you need help. If you have severe chest pain or trouble breathing, alert staff right away.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   2. CONSENT
══════════════════════════════════════════════════════════ */
function Consent({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [agreed, setAgreed] = useState(false);

  const points = [
    "Your reported symptoms help our clinical team prioritize your visit.",
    "A doctor reviews all your information before deciding on treatment.",
    "You can review and edit your answers before submitting.",
    "Your health details are kept private and secure under hospital standards.",
  ];

  return (
    <div>
      <h2 className="mk-page-title" style={{ marginBottom: 6 }}>Your consent is needed to continue</h2>
      <p className="mk-body" style={{ color: "var(--mk-text-muted)", marginBottom: 20 }}>
        Please review how your check-in information is collected and protected.
      </p>

      <div style={{
        border: "1px solid var(--mk-border)",
        borderRadius: "var(--mk-radius-sm)",
        background: "var(--mk-surface-subtle)",
        marginBottom: 20,
      }}>
        {points.map((p, idx) => (
          <div
            key={idx}
            style={{
              padding: "12px 16px",
              borderBottom: idx < points.length - 1 ? "1px solid var(--mk-border-subtle)" : "none",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <span style={{ color: "var(--mk-text-muted)", flexShrink: 0, marginTop: 2 }}>
              <IconCheck size={14} />
            </span>
            <span style={{ fontSize: 13, color: "var(--mk-text)", lineHeight: 1.5 }}>{p}</span>
          </div>
        ))}
      </div>

      <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", marginBottom: 24 }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          style={{ width: 18, height: 18, accentColor: "var(--mk-navy)", cursor: "pointer" }}
        />
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--mk-text)" }}>
          I understand and agree to proceed with autonomous clinical intake.
        </span>
      </label>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="mk-btn mk-btn-secondary" style={{ minHeight: 50 }} onClick={onBack}>
          ← Back
        </button>
        <button
          className="mk-btn mk-btn-primary mk-btn-kiosk"
          style={{ flex: 1, minHeight: 50, fontSize: 15 }}
          disabled={!agreed}
          onClick={onNext}
        >
          Accept &amp; Continue →
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   3. IDENTITY
══════════════════════════════════════════════════════════ */
function Identity({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [isNew, setIsNew] = useState<boolean>(true);
  const [phone, setPhone] = useState("");
  const [abha, setAbha] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!/^\+?[0-9]{10,13}$/.test(phone.replace(/\s/g, ""))) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    onNext();
  }

  return (
    <div>
      <h2 className="mk-page-title" style={{ marginBottom: 6 }}>Verify Your Details</h2>
      <p className="mk-body" style={{ color: "var(--mk-text-muted)", marginBottom: 20 }}>
        Enter your mobile number to link previous visits or register as a new arrival.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
        <button
          type="button"
          className={`mk-btn ${isNew ? "mk-btn-primary" : "mk-btn-secondary"}`}
          style={{ minHeight: 48, fontSize: 15, fontWeight: 600 }}
          onClick={() => setIsNew(true)}
        >
          New Patient
        </button>
        <button
          type="button"
          className={`mk-btn ${!isNew ? "mk-btn-primary" : "mk-btn-secondary"}`}
          style={{ minHeight: 48, fontSize: 15, fontWeight: 600 }}
          onClick={() => setIsNew(false)}
        >
          Returning Patient
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="mk-label">Mobile Number</label>
        <input
          className={`mk-input ${error ? "mk-input-error" : ""}`}
          placeholder="+91 98765 43210"
          value={phone}
          onChange={e => { setPhone(e.target.value); setError(""); }}
          type="tel"
          autoComplete="tel"
          style={{ height: 48, fontSize: 16 }}
        />
        {error && <p style={{ color: "var(--mk-danger)", fontSize: 12, marginTop: 4 }}>{error}</p>}
      </div>

      {!isNew && (
        <div style={{ marginBottom: 20 }}>
          <label className="mk-label">ABHA ID (Optional)</label>
          <input
            className="mk-input"
            placeholder="ABHA-XXXX-9213"
            value={abha}
            onChange={e => setAbha(e.target.value)}
            style={{ height: 48, fontSize: 16 }}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button className="mk-btn mk-btn-secondary" style={{ minHeight: 50 }} onClick={onBack}>← Back</button>
        <button className="mk-btn mk-btn-primary mk-btn-kiosk" style={{ flex: 1, minHeight: 50, fontSize: 15 }} onClick={submit}>
          Send Verification Code →
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   4. OTP VERIFICATION
══════════════════════════════════════════════════════════ */
function OTPVerify({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function verify() {
    if (otp.length !== 6) {
      setError("Enter the complete 6-digit code.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (otp === "000000") {
        setError("Code expired. Request a new code below.");
        return;
      }
      onNext();
    }, 800);
  }

  function resend() {
    if (countdown > 0) return;
    setCountdown(30);
    setOtp("");
    setError("");
    pushToast("Verification code resent to your mobile.", "info");
  }

  return (
    <div>
      <h2 className="mk-page-title" style={{ marginBottom: 6 }}>Enter Verification Code</h2>
      <p className="mk-body" style={{ color: "var(--mk-text-muted)", marginBottom: 20 }}>
        A 6-digit code has been sent via SMS to your mobile phone.
      </p>

      <div style={{ marginBottom: 16 }}>
        <input
          className={`mk-input ${error ? "mk-input-error" : ""}`}
          placeholder="• • • • • •"
          maxLength={6}
          value={otp}
          onChange={e => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
          style={{ height: 52, fontSize: 24, textAlign: "center", letterSpacing: 10, fontFamily: "var(--mk-font-mono)" }}
          inputMode="numeric"
          autoComplete="one-time-code"
          disabled={loading}
        />
        {error && <p style={{ color: "var(--mk-danger)", fontSize: 12, marginTop: 4 }}>{error}</p>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <span className="mk-meta">
          {countdown > 0 ? `Resend available in ${countdown}s` : "Did not receive code?"}
        </span>
        {countdown <= 0 && (
          <button className="mk-btn mk-btn-ghost" style={{ fontSize: 12 }} onClick={resend}>
            Resend SMS
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="mk-btn mk-btn-secondary" style={{ minHeight: 50 }} onClick={onBack} disabled={loading}>← Back</button>
        <button
          className="mk-btn mk-btn-primary mk-btn-kiosk"
          style={{ flex: 1, minHeight: 50, fontSize: 15 }}
          onClick={verify}
          disabled={loading || otp.length < 6}
        >
          {loading ? "Verifying…" : "Confirm Code →"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   5. VOICE INTAKE
   Calm, functional, high legibility
══════════════════════════════════════════════════════════ */
const QUESTIONS = [
  "What brings you to the clinic today? Please describe your main symptoms.",
  "How long have you had these symptoms?",
  "On a scale of 1 to 10, how severe is your discomfort right now?",
  "Do you have any existing chronic conditions or allergies?",
  "Are you currently taking any medications?",
];

const VOICE_DEMOS: string[] = [
  "Persistent cough for two days, mild fever and body aches.",
  "Approximately 48 hours.",
  "Around 5 out of 10.",
  "No chronic conditions or drug allergies.",
  "None at present.",
];

function VoiceIntake({ onSubmit, onBack }: { onSubmit: () => void; onBack: () => void }) {
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(QUESTIONS.length).fill(""));
  const [draft, setDraft] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");

  function startListening() {
    setVoiceState("listening");
    setTimeout(() => {
      setVoiceState("transcribing");
      setTimeout(() => {
        setDraft(VOICE_DEMOS[qIdx] ?? "Reported symptoms captured.");
        setVoiceState("confirm");
      }, 1000);
    }, 1800);
  }

  function stopListening() {
    if (voiceState === "listening") {
      setVoiceState("transcribing");
      setTimeout(() => {
        setDraft(VOICE_DEMOS[qIdx] ?? "Reported symptoms captured.");
        setVoiceState("confirm");
      }, 800);
    }
  }

  function confirmAnswer() {
    const ans = draft || answers[qIdx];
    if (!ans.trim()) return;
    const next = [...answers];
    next[qIdx] = ans.trim();
    setAnswers(next);
    setDraft("");
    setVoiceState("idle");
    if (qIdx < QUESTIONS.length - 1) {
      setQIdx(q => q + 1);
    }
  }

  const allAnswered = answers.every(a => a.trim().length > 0);

  return (
    <div>
      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="mk-meta">Question {qIdx + 1} of {QUESTIONS.length}</span>
        <span className="mk-meta">{answers.filter(a => a).length} of {QUESTIONS.length} recorded</span>
      </div>

      {/* Current Question */}
      <div style={{
        padding: "20px",
        background: "var(--mk-surface-subtle)",
        border: "1px solid var(--mk-border)",
        borderRadius: "var(--mk-radius-sm)",
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--mk-text-muted)", marginBottom: 6 }}>
          Tell us what you&apos;re experiencing
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: "var(--mk-navy)", lineHeight: 1.4, margin: 0 }}>
          {QUESTIONS[qIdx]}
        </p>
      </div>

      {/* Microphone / Touch Interaction */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 0",
        marginBottom: 16,
      }}>
        <button
          className={`mk-audio-orb ${voiceState === "listening" ? "listening" : ""}`}
          onClick={voiceState === "listening" ? stopListening : startListening}
          aria-label={voiceState === "listening" ? "Stop recording" : "Record voice response"}
        >
          {voiceState === "listening" ? (
            <IconMicOff size={28} color="#FFFFFF" />
          ) : voiceState === "transcribing" ? (
            <IconClock size={28} color="var(--color-brand)" />
          ) : (
            <IconMic size={28} color="var(--color-brand)" />
          )}
        </button>

        <div style={{ marginTop: 14, textAlign: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-muted)" }}>
            {voiceState === "idle" && "Tap microphone to record your response"}
            {voiceState === "listening" && "Listening… tap again when finished"}
            {voiceState === "transcribing" && "Processing clinical audio…"}
            {voiceState === "confirm" && "Review your response below"}
            {voiceState === "error" && "Could not capture audio — please type below"}
          </span>
        </div>
      </div>

      {/* Text Confirm / Edit Box */}
      <div style={{ marginBottom: 16 }}>
        <label className="mk-label">Your Response (Voice Transcript or Typed)</label>
        <textarea
          className="mk-input"
          style={{ height: 80, padding: "10px 12px", resize: "none", fontSize: 13, lineHeight: 1.5 }}
          placeholder="Type your answer here or use the microphone above…"
          value={draft || answers[qIdx]}
          onChange={e => setDraft(e.target.value)}
        />
        <div className="mk-meta" style={{ marginTop: 4 }}>
          You can edit the transcribed text above before confirming.
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          className="mk-btn mk-btn-secondary"
          onClick={() => (qIdx > 0 ? setQIdx(q => q - 1) : onBack())}
        >
          ← Back
        </button>
        <button
          className="mk-btn mk-btn-primary"
          style={{ flex: 1 }}
          onClick={confirmAnswer}
          disabled={!draft && !answers[qIdx]}
        >
          {qIdx < QUESTIONS.length - 1 ? "Confirm & Next →" : "Confirm Response"}
        </button>
      </div>

      {/* Final Submission */}
      {allAnswered && (
        <div style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: "1px solid var(--mk-border-subtle)",
        }}>
          <button
            className="mk-btn mk-btn-primary mk-btn-kiosk"
            style={{ width: "100%" }}
            onClick={onSubmit}
          >
            Submit Check-in →
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PROCESSING
   Calm, transparent status transition
══════════════════════════════════════════════════════════ */
function Processing({ onDone }: { onDone: (s: Step) => void }) {
  const [phase, setPhase] = useState(0);
  const phases = [
    "Reviewing your reported symptoms…",
    "Matching with clinical priority guidelines…",
    "Assigning your care team and room…",
    "Preparing your care pass…",
  ];

  useEffect(() => {
    const timers = phases.map((_, i) => setTimeout(() => setPhase(i), i * 700));
    const done = setTimeout(() => onDone("outcome-p2"), phases.length * 700 + 300);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "36px 0" }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "var(--mk-surface-subtle)",
        border: "1px solid var(--mk-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 20px",
        color: "var(--mk-navy)",
      }}>
        <IconClock size={24} />
      </div>

      <h2 className="mk-page-title" style={{ marginBottom: 6 }}>Reviewing your information</h2>
      <p className="mk-body" style={{ color: "var(--mk-text-muted)", marginBottom: 24, fontSize: 13 }}>
        {phases[phase]}
      </p>

      <div style={{ height: 2, background: "var(--mk-border)", borderRadius: 1, maxWidth: 240, margin: "0 auto" }}>
        <div style={{
          height: "100%",
          background: "var(--mk-navy)",
          borderRadius: 1,
          width: `${((phase + 1) / phases.length) * 100}%`,
          transition: "width 500ms var(--mk-ease)",
        }} />
      </div>

      <p className="mk-meta" style={{ marginTop: 24, color: "var(--mk-text-subtle)" }}>
        Clinical safety verification active · Non-diagnostic intake
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CLARIFICATION NEEDED
══════════════════════════════════════════════════════════ */
function ClarificationNeeded({ onSubmit }: { onSubmit: () => void }) {
  const [answer, setAnswer] = useState("");
  return (
    <div>
      <span className="mk-badge mk-badge-warn" style={{ marginBottom: 12 }}>Clarification Needed</span>
      <h2 className="mk-page-title" style={{ marginBottom: 6 }}>Additional Clinical Detail</h2>
      <p className="mk-body" style={{ color: "var(--mk-text-muted)", marginBottom: 20 }}>
        To ensure accurate allocation, please answer the question below.
      </p>

      <div className="mk-card mk-card-padded" style={{ background: "var(--mk-surface-subtle)", marginBottom: 20 }}>
        <div className="mk-card-title" style={{ fontSize: 14 }}>
          Have you experienced any chest pain, dizziness, or sudden shortness of breath in the last hour?
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {["Yes", "No"].map(opt => (
          <button
            key={opt}
            className={`mk-btn ${answer === opt ? "mk-btn-primary" : "mk-btn-secondary"}`}
            style={{ minHeight: 48, fontSize: 15 }}
            onClick={() => setAnswer(opt)}
          >
            {opt}
          </button>
        ))}
      </div>

      {answer && (
        <button className="mk-btn mk-btn-primary mk-btn-kiosk" style={{ width: "100%" }} onClick={onSubmit}>
          Submit Response →
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   OUTCOME SCREENS (P0 / P1 / P2 / P3)
   Clean answers to:
   1. WHERE AM I?
   2. WHAT HAPPENS NEXT?
   3. WHAT DO I NEED TO DO?
══════════════════════════════════════════════════════════ */

/* P0: Emergency Handover (Calm Clinical Authority) */
function P0Outcome() {
  const c = CASES.P0;
  const [elapsed, setElapsed] = useState(42);
  const [alertBeacon, setAlertBeacon] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  function toggleBeacon() {
    setAlertBeacon(true);
    pushToast("Kiosk Bay 02 emergency beacon active — nursing station notified.", "danger");
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <PriorityBadge priority="P0" full />
        <h2 className="mk-page-title" style={{ margin: 0, color: "var(--color-crimson)" }}>Emergency Response Protocol</h2>
      </div>

      {/* Composed Emergency Operating Pass */}
      <div className="mk-pass-container" style={{
        borderLeft: "4px solid var(--color-crimson)",
        borderColor: "var(--color-crimson-border)",
        marginBottom: 20,
      }}>
        {/* Header Alert Strip */}
        <div style={{
          padding: "20px 24px",
          background: "var(--color-crimson-soft)",
          borderBottom: "1px solid var(--color-crimson-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="mk-badge mk-badge-p0">Code Red Active</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-crimson)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Response Team Dispatched
              </span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-text)" }}>
              Please Remain Seated at Kiosk Bay 02
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: "var(--color-crimson)", letterSpacing: "0.05em" }}>
              Elapsed / Target SLA
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--mk-font-mono)", color: "var(--color-crimson)", lineHeight: 1.1 }}>
              {fmt(elapsed)}
            </div>
            <div style={{ fontSize: 10, fontFamily: "var(--mk-font-mono)", color: "var(--color-text-muted)" }}>
              Target: &lt; 05:00
            </div>
          </div>
        </div>

        {/* Tactical Guidance Details */}
        <div>
          {[
            { label: "Your Location", value: "Kiosk Bay 02 (Ground Floor Main Concourse)" },
            { label: "Responding Team", value: "Emergency Trauma Attending & Clinical Nurse" },
            { label: "Patient Identity", value: `${c.patientName} (${c.patientAge}y · ${c.patientGender})` },
            { label: "Handover Status", value: "Direct Bedside Clinician Approach" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px", borderBottom: "1px solid var(--color-border-subtle)" }}>
              <span className="mk-meta" style={{ fontWeight: 600 }}>{label}</span>
              <span className="mk-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Immediate Instructions */}
        <div style={{ padding: "16px 24px", background: "var(--color-surface-subtle)", borderBottom: "1px solid var(--color-border-subtle)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", marginBottom: 8 }}>
            Immediate Safety Protocol
          </div>
          <ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4, margin: 0 }}>
            <li className="mk-body" style={{ fontSize: 13 }}>
              <strong>Do not leave this chair.</strong> Responders are tracking this terminal station.
            </li>
            <li className="mk-body" style={{ fontSize: 13 }}>
              Clinicians will identify you by name ({c.patientName}) upon arrival.
            </li>
            <li className="mk-body" style={{ fontSize: 13 }}>
              Keep your arms relaxed and take slow, calm breaths.
            </li>
          </ul>
        </div>

        {/* Tactile Emergency Assistance Call Button */}
        <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>Need immediate bedside attention?</div>
            <div className="mk-meta" style={{ fontSize: 11 }}>Tap below to illuminate overhead bay signal beacon.</div>
          </div>
          <button
            type="button"
            className="mk-btn"
            style={{
              background: alertBeacon ? "var(--color-crimson)" : "var(--color-crimson-soft)",
              color: alertBeacon ? "#ffffff" : "var(--color-crimson)",
              border: "1px solid var(--color-crimson-border)",
              minHeight: 38,
              padding: "0 16px",
              fontWeight: 600,
              fontSize: 13,
            }}
            onClick={toggleBeacon}
          >
            {alertBeacon ? "● Bay Beacon Active" : "Illuminate Bay Beacon"}
          </button>
        </div>

        {/* Embedded Timeline */}
        <div style={{ padding: "18px 24px", borderTop: "1px solid var(--color-border-subtle)" }}>
          <div className="mk-sec-title" style={{ marginBottom: 12, fontSize: 12 }}>Incident Progression Log</div>
          <CaseTimeline events={c.timeline} />
        </div>
      </div>
    </div>
  );
}

/* P1: Urgent Clinical Handoff */
function P1Outcome() {
  const c = CASES.P1;
  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <PriorityBadge priority="P1" full />
        <h2 className="mk-page-title" style={{ margin: 0 }}>Urgent Clinical Handoff</h2>
      </div>

      {/* Composed Urgent Care Pass */}
      <div className="mk-pass-container" style={{
        borderLeft: "4px solid var(--color-amber)",
        borderColor: "var(--color-amber-border)",
        marginBottom: 20,
      }}>
        <div style={{
          padding: "20px 24px",
          background: "var(--color-amber-soft)",
          borderBottom: "1px solid var(--color-amber-border)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-amber)" }}>
              Priority Handoff Reserved
            </span>
            <span style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "var(--color-amber)", fontWeight: 600 }}>
              Case #{c.caseId}
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 4 }}>
            Please Proceed to Rapid Assessment Bay — Counter B
          </div>
          <p className="mk-body" style={{ fontSize: 13, margin: 0 }}>
            An attending clinician in {c.department} has been alerted and your priority consultation slot is active.
          </p>
        </div>

        <div>
          {[
            { label: "Designated Location", value: "OPD Rapid Assessment — Room 4" },
            { label: "Assigned Department", value: c.department },
            { label: "Expected Consultation", value: c.estimatedWait ?? "Within 15 minutes" },
            { label: "Priority Level", value: "Immediate Clinician Handoff" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid var(--color-border-subtle)" }}>
              <span className="mk-meta" style={{ fontWeight: 600 }}>{label}</span>
              <span className="mk-body" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 24px", background: "var(--color-surface-subtle)", textAlign: "center" }}>
          <span className="mk-meta">
            A nursing assistant will announce your name directly at Rapid Assessment Bay.
          </span>
        </div>
      </div>
    </div>
  );
}

/* P2: Standard Queue (Digital Care Pass) */
function P2Outcome() {
  const c = CASES.P2;
  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <PriorityBadge priority="P2" full />
        <h2 className="mk-page-title" style={{ margin: 0 }}>Standard Clinical Queue</h2>
      </div>

      {/* Composed Digital Care Pass Object */}
      <div className="mk-pass-container" style={{ marginBottom: 20 }}>
        {/* Token Header Bay */}
        <div style={{
          padding: "32px 24px 20px",
          textAlign: "center",
          background: "#ffffff",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: 6 }}>
            Your Digital Queue Token
          </div>
          <div style={{
            fontSize: 54,
            fontWeight: 700,
            fontFamily: "var(--mk-font-mono)",
            letterSpacing: "-1.5px",
            color: "var(--color-brand)",
            lineHeight: 1,
            margin: "6px 0 12px",
          }}>
            {c.token}
          </div>
          <span className="mk-chip">Token Active · Position #3 in Queue</span>
        </div>

        {/* Perforated dashed notch divider */}
        <div className="mk-pass-notch-divider">
          <div className="mk-pass-dashed-line" />
        </div>

        {/* Ticket Details */}
        <div>
          {[
            { label: "Assigned Area", value: "Waiting Lounge C (Level 1)" },
            { label: "Target Department", value: c.department },
            { label: "Attending Clinician", value: c.doctor },
            { label: "Estimated Wait Window", value: c.estimatedWait ?? "~25 minutes" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "13px 24px", borderBottom: "1px solid var(--color-border-subtle)" }}>
              <span className="mk-meta" style={{ fontWeight: 600 }}>{label}</span>
              <span className="mk-body" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Next Steps Guidance */}
        <div style={{ padding: "18px 24px", background: "var(--color-surface-subtle)" }}>
          <div className="mk-sec-title" style={{ marginBottom: 8, fontSize: 12, color: "var(--color-text)" }}>What happens next</div>
          <ol style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4, margin: 0 }}>
            <li className="mk-meta" style={{ fontSize: 12, color: "var(--color-text-body)" }}>Take a seat in Waiting Lounge C on Level 1.</li>
            <li className="mk-meta" style={{ fontSize: 12, color: "var(--color-text-body)" }}>Display screens will announce token <strong style={{ color: "var(--color-brand)" }}>{c.token}</strong> when ready.</li>
            <li className="mk-meta" style={{ fontSize: 12, color: "var(--color-text-body)" }}>If symptoms suddenly worsen, inform the nearest nurse desk immediately.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

/* P3: Fast Track (Digital Care Pass) */
function P3Outcome() {
  const c = CASES.P3;
  return (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <PriorityBadge priority="P3" full />
        <h2 className="mk-page-title" style={{ margin: 0 }}>Rapid Fast Track</h2>
      </div>

      {/* Composed Digital Fast Track Pass */}
      <div className="mk-pass-container" style={{ marginBottom: 20 }}>
        <div style={{
          padding: "32px 24px 20px",
          textAlign: "center",
          background: "#ffffff",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: 6 }}>
            Fast Track Token
          </div>
          <div style={{
            fontSize: 54,
            fontWeight: 700,
            fontFamily: "var(--mk-font-mono)",
            letterSpacing: "-1.5px",
            color: "var(--color-green)",
            lineHeight: 1,
            margin: "6px 0 12px",
          }}>
            {c.token}
          </div>
          <span className="mk-badge mk-badge-p3">Minor Care Rapid Bay</span>
        </div>

        {/* Perforated dashed notch divider */}
        <div className="mk-pass-notch-divider">
          <div className="mk-pass-dashed-line" />
        </div>

        <div>
          {[
            { label: "Designated Area", value: "Level 1, Fast Track Counter 3" },
            { label: "Department", value: c.department },
            { label: "Patients Ahead", value: String(c.patientsAhead) },
            { label: "Estimated Wait", value: c.estimatedWait ?? "~10 minutes" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "13px 24px", borderBottom: "1px solid var(--color-border-subtle)" }}>
              <span className="mk-meta" style={{ fontWeight: 600 }}>{label}</span>
              <span className="mk-body" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 24px", textAlign: "center", background: "var(--color-surface-subtle)" }}>
          <span className="mk-meta">
            A nursing assistant will call token <strong style={{ color: "var(--color-green)" }}>{c.token}</strong> at Counter 3.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   POST-CONSULTATION DASHBOARD
   Linear/Notion-grade patient records, zero AI slop
══════════════════════════════════════════════════════════ */
type DashTab = "summary" | "prescription" | "reports" | "followup" | "records";

function PostConsultDashboard() {
  const [tab, setTab] = useState<DashTab>("summary");
  const tabs: Array<{ id: DashTab; label: string; icon: React.ReactNode }> = [
    { id: "summary", label: "Visit Summary", icon: <IconFileText size={14} /> },
    { id: "prescription", label: "Prescriptions", icon: <IconPill size={14} /> },
    { id: "reports", label: "Lab Orders", icon: <IconActivity size={14} /> },
    { id: "followup", label: "Follow-Up", icon: <IconClock size={14} /> },
    { id: "records", label: "History", icon: <IconCheckCircle size={14} /> },
  ];

  return (
    <div>
      {/* Patient Card */}
      <div style={{
        background: "var(--mk-surface)",
        border: "1px solid var(--mk-border)",
        borderRadius: "var(--mk-radius-md)",
        padding: "20px 24px",
        marginBottom: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: "var(--mk-radius-xs)",
            background: "var(--mk-surface-subtle)",
            border: "1px solid var(--mk-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14,
            color: "var(--mk-navy)",
          }}>
            RM
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--mk-navy)" }}>Rohan Mehta, 38y</div>
            <div className="mk-meta" style={{ fontSize: 11 }}>ABHA-2048-XXXX · Encounter: 14 Oct 2024</div>
          </div>
        </div>
        <Link href="/patient">
          <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, minHeight: 32 }}>
            + New Intake
          </button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="mk-tabs" style={{ marginBottom: 20 }}>
        {tabs.map(t => (
          <span
            key={t.id}
            className={`mk-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {t.icon}
            <span>{t.label}</span>
          </span>
        ))}
      </div>

      {tab === "summary" && <VisitSummary />}
      {tab === "prescription" && <PrescriptionView />}
      {tab === "reports" && <LabReports />}
      {tab === "followup" && <FollowUp />}
      {tab === "records" && <PastRecords />}
    </div>
  );
}

function VisitSummary() {
  return (
    <div className="mk-card mk-card-padded">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="mk-sec-title" style={{ margin: 0 }}>Consultation Summary</div>
        <span className="mk-badge mk-badge-ok">Physician Signed</span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
        gap: 10,
        padding: "10px 14px",
        background: "var(--mk-surface-subtle)",
        borderRadius: "var(--mk-radius-xs)",
        marginBottom: 16,
      }}>
        {[
          { label: "Temp", val: "99.1°F" },
          { label: "Pulse", val: "84 bpm" },
          { label: "SpO₂", val: "98%" },
          { label: "BP", val: "123/78" },
        ].map(v => (
          <div key={v.label}>
            <div className="mk-meta" style={{ fontSize: 10 }}>{v.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--mk-font-mono)", color: "var(--mk-navy)" }}>{v.val}</div>
          </div>
        ))}
      </div>

      {[
        { label: "Attending Clinician", value: "Dr. R. Vance, MD (General Medicine)" },
        { label: "Encounter Time", value: "14 Oct 2024, 11:00 AM" },
        { label: "Clinical Facility", value: "Hospital Central · OPD Room 12" },
      ].map(({ label, value }) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--mk-border-subtle)" }}>
          <span className="mk-meta" style={{ fontWeight: 600 }}>{label}</span>
          <span className="mk-body" style={{ fontSize: 13 }}>{value}</span>
        </div>
      ))}

      <div style={{ marginTop: 14 }}>
        <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 4 }}>Clinical Impression</div>
        <p className="mk-body" style={{ fontSize: 13, color: "var(--mk-text)", lineHeight: 1.5 }}>
          Acute viral upper respiratory tract infection. Mild fever and non-productive cough for 2 days. Chest clear on bilateral auscultation, vitals within normal parameters.
        </p>
      </div>
    </div>
  );
}

function PrescriptionView() {
  const [taken, setTaken] = useState<Record<string, boolean>>({});
  const rxItems = [
    { id: "pcm", name: "Paracetamol 500mg", dose: "1 tablet 3x daily", duration: "3 days", timing: "After meals" },
    { id: "cet", name: "Cetirizine 10mg", dose: "1 tablet at night", duration: "5 days", timing: "Bedtime" },
    { id: "dxm", name: "Dextromethorphan syrup", dose: "10 ml 3x daily", duration: "3 days", timing: "Every 8 hours" },
  ];

  function toggleTaken(id: string, name: string) {
    setTaken(prev => {
      const next = !prev[id];
      pushToast(`${name} marked as ${next ? "taken" : "pending"}`, "info");
      return { ...prev, [id]: next };
    });
  }

  return (
    <div className="mk-card mk-card-padded">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div className="mk-sec-title" style={{ margin: 0 }}>Prescription &amp; Medication Schedule</div>
        <button
          className="mk-btn mk-btn-secondary"
          style={{ fontSize: 12, minHeight: 30 }}
          onClick={() => pushToast("Prescription PDF dispatched to print queue", "success")}
        >
          Print Prescription
        </button>
      </div>

      {rxItems.map(rx => (
        <div key={rx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--mk-border-subtle)" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--mk-text)" }}>{rx.name}</div>
            <div className="mk-meta">{rx.dose} · {rx.duration} ({rx.timing})</div>
          </div>
          <button
            className={`mk-btn ${taken[rx.id] ? "mk-btn-secondary" : "mk-btn-primary"}`}
            style={{ fontSize: 11, minHeight: 28, padding: "0 10px" }}
            onClick={() => toggleTaken(rx.id, rx.name)}
          >
            {taken[rx.id] ? "✓ Taken" : "Log Dose"}
          </button>
        </div>
      ))}
    </div>
  );
}

function LabReports() {
  return (
    <div className="mk-card mk-card-padded">
      <div className="mk-sec-title" style={{ marginBottom: 14 }}>Diagnostic Orders</div>
      {[
        { name: "CBC — Complete Blood Count", date: "14 Oct 2024", result: "Normal", labId: "LAB-8821" },
        { name: "Chest X-Ray (PA View)", date: "14 Oct 2024", result: "Clear", labId: "RAD-4402" },
      ].map(r => (
        <div key={r.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--mk-border-subtle)" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
            <div className="mk-meta">{r.date} · Order #{r.labId}</div>
          </div>
          <span className="mk-badge mk-badge-ok">{r.result}</span>
        </div>
      ))}
    </div>
  );
}

function FollowUp() {
  return (
    <div className="mk-card mk-card-padded">
      <div className="mk-sec-title" style={{ marginBottom: 10 }}>Scheduled Follow-Up</div>
      <div style={{ padding: "10px 0", borderBottom: "1px solid var(--mk-border-subtle)" }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>General Medicine Follow-Up Consultation</div>
        <div className="mk-meta" style={{ marginTop: 2 }}>21 Oct 2024, 10:30 AM · Dr. R. Vance · OPD Room 12</div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div className="mk-meta" style={{ fontWeight: 600, marginBottom: 4 }}>Warning Signs</div>
        <p className="mk-body" style={{ fontSize: 13, color: "var(--mk-text-muted)" }}>
          Return to emergency care immediately if you develop high fever (&gt;102°F), acute chest pressure, or difficulty breathing.
        </p>
      </div>
    </div>
  );
}

function PastRecords() {
  const records = [
    { date: "14 Oct 2024", diagnosis: "Acute viral URTI (J06.9)", doctor: "Dr. R. Vance" },
    { date: "12 Aug 2024", diagnosis: "Seasonal allergic rhinitis", doctor: "Dr. K. Iyer" },
    { date: "21 Jan 2024", diagnosis: "Viral upper respiratory infection", doctor: "Dr. R. Vance" },
  ];
  return (
    <div className="mk-card mk-card-padded">
      <div className="mk-sec-title" style={{ marginBottom: 12 }}>Past Visits</div>
      {records.map(r => (
        <div key={r.date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--mk-border-subtle)" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{r.diagnosis}</div>
            <div className="mk-meta">{r.date} · {r.doctor}</div>
          </div>
          <span className="mk-meta">Verified</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PATIENT PAGE WRAPPER
══════════════════════════════════════════════════════════ */
export default function PatientPage() {
  const [step, setStep] = useState<Step>("welcome");
  const isOutcome = step.startsWith("outcome-");
  const isDashboard = step === "dashboard";
  const stepIndex = STEP_INDICES[step] ?? 0;

  return (
    <div className="mk-kiosk">
      <div className="mk-kiosk-panel" style={isDashboard ? { maxWidth: 680 } : {}}>
        {!isOutcome && !isDashboard && step !== "processing" && <Stepper current={stepIndex} />}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
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
          </motion.div>
        </AnimatePresence>

        {/* Footer actions */}
        {(isOutcome || isDashboard) && (
          <div style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid var(--mk-border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <button
              className="mk-btn mk-btn-ghost"
              style={{ fontSize: 12 }}
              onClick={() => setStep("welcome")}
            >
              ← Start New Intake
            </button>
            {isOutcome && step !== "outcome-p0" && (
              <button
                className="mk-btn mk-btn-secondary"
                style={{ fontSize: 12 }}
                onClick={() => setStep("dashboard")}
              >
                Patient Dashboard →
              </button>
            )}
          </div>
        )}
      </div>

      <footer style={{ textAlign: "center", marginTop: 12 }}>
        <p className="mk-meta" style={{ color: "var(--mk-text-subtle)" }}>
          MediKiosk Patient Care · Non-diagnostic clinical intake · Attending clinician verified
        </p>
      </footer>
      <ToastContainer />
    </div>
  );
}
