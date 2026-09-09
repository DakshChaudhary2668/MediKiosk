"use client";
import Link from "next/link";
import { MKLogo } from "@/components/shared";
import { 
  IconUser, 
  IconStethoscope, 
  IconShield, 
  IconArrowRight,
  IconClock,
  IconCheckCircle,
  IconActivity,
} from "@/components/icons";

export default function Home() {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--mk-canvas)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "28px 36px",
      boxSizing: "border-box",
    }}>
      {/* Editorial Top Navigation */}
      <header style={{
        maxWidth: 1240,
        width: "100%",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 20,
        borderBottom: "1px solid var(--color-border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <MKLogo subtitle="Clinical Hospital Orchestration" />
          <Link 
            href="/" 
            style={{ 
              fontSize: 12, 
              color: "var(--color-text-muted)", 
              textDecoration: "none",
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid var(--color-border)",
              background: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              gap: 4
            }}
          >
            ← Overview
          </Link>
        </div>
        
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 12,
          color: "var(--color-text-muted)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="mk-status-dot" style={{ color: "var(--color-green)" }} />
            <span style={{ fontWeight: 500, color: "var(--color-text)" }}>Station 04</span>
            <span style={{ color: "var(--color-text-subtle)" }}>· Kiosk Bay Active</span>
          </div>
          <span style={{ width: 1, height: 12, background: "var(--color-border)" }} />
          <span style={{ fontFamily: "var(--mk-font-mono)", fontSize: 11 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
      </header>

      {/* Main Architectural Hero Layout */}
      <main style={{
        maxWidth: 1240,
        width: "100%",
        margin: "0 auto",
        padding: "40px 0 52px",
      }}>
        {/* Header Statement */}
        <div style={{ maxWidth: 760, marginBottom: 44 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--color-brand)",
            marginBottom: 12,
          }}>
            <span>Hospital Intake &amp; Triage</span>
            <span style={{ color: "var(--color-text-subtle)" }}>·</span>
            <span>Clinical System</span>
          </div>

          <h1 style={{
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: "var(--color-text)",
            margin: "0 0 10px",
            lineHeight: 1.25,
          }}>
            Choose how you want to continue
          </h1>

          <p style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: "var(--color-text-muted)",
            margin: "0 0 28px",
            maxWidth: 580,
          }}>
            Select your role to check in as a patient, review clinical consultations as a physician, or manage operations across hospital departments.
          </p>

          {/* Hairline Operational Metrics Strip */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 36,
            paddingTop: 20,
            borderTop: "1px solid var(--color-border)",
          }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--mk-font-mono)", color: "var(--color-crimson)", lineHeight: 1 }}>
                &lt; 05:00
              </div>
              <div className="mk-meta" style={{ marginTop: 4 }}>
                P0 Trauma Target
              </div>
            </div>

            <div style={{ width: 1, background: "var(--color-border)" }} />

            <div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--mk-font-mono)", color: "var(--color-text)", lineHeight: 1 }}>
                100%
              </div>
              <div className="mk-meta" style={{ marginTop: 4 }}>
                Physician Sign-Off
              </div>
            </div>

            <div style={{ width: 1, background: "var(--color-border)" }} />

            <div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "var(--mk-font-mono)", color: "var(--color-green)", lineHeight: 1 }}>
                0.0%
              </div>
              <div className="mk-meta" style={{ marginTop: 4 }}>
                Diagnostic Autonomy (Safety Locked)
              </div>
            </div>
          </div>
        </div>

        {/* 3 Clear Role Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20,
          alignItems: "stretch",
        }}>
          {/* ROLE 1: Patient */}
          <div style={{
            background: "#ffffff",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-cards)",
            boxShadow: "var(--mk-shadow-card)",
            padding: "32px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span className="mk-badge mk-badge-ok">Patient Check-in</span>
                <span style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "var(--color-text-subtle)" }}>
                  ROLE 01
                </span>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text)", margin: "0 0 8px" }}>
                Patient
              </h2>

              <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--color-text-muted)", margin: "0 0 24px" }}>
                Check in, share your symptoms, and get the right care. Guided step-by-step with voice or touch.
              </p>

              <div style={{
                padding: "12px 16px",
                background: "var(--color-canvas-subtle)",
                borderRadius: 8,
                marginBottom: 28,
                border: "1px solid var(--color-border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-body)" }}>
                  <span style={{ color: "var(--color-brand)" }}>✓</span>
                  <span>Multilingual touch and voice intake</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-body)" }}>
                  <span style={{ color: "var(--color-brand)" }}>✓</span>
                  <span>Instant digital care pass with token number</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-body)" }}>
                  <span style={{ color: "var(--color-brand)" }}>✓</span>
                  <span>Immediate staff escalation for emergencies</span>
                </div>
              </div>
            </div>

            <Link href="/patient" style={{ display: "block" }}>
              <button
                className="mk-btn mk-btn-primary"
                style={{
                  width: "100%",
                  minHeight: 44,
                  fontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0 18px",
                }}
              >
                <span>Continue as Patient</span>
                <IconArrowRight size={16} />
              </button>
            </Link>
          </div>

          {/* ROLE 2: Doctor */}
          <div style={{
            background: "#ffffff",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-cards)",
            boxShadow: "var(--mk-shadow-card)",
            padding: "32px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span className="mk-badge mk-badge-info">Doctor Workspace</span>
                <span style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "var(--color-text-subtle)" }}>
                  ROLE 02
                </span>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text)", margin: "0 0 8px" }}>
                Doctor
              </h2>

              <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--color-text-muted)", margin: "0 0 24px" }}>
                Review patients, triage information, and manage consultations in your department queue.
              </p>

              <div style={{
                padding: "12px 16px",
                background: "var(--color-canvas-subtle)",
                borderRadius: 8,
                marginBottom: 28,
                border: "1px solid var(--color-border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-body)" }}>
                  <span style={{ color: "var(--color-brand)" }}>✓</span>
                  <span>Prioritized patient worklist with urgent pins</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-body)" }}>
                  <span style={{ color: "var(--color-brand)" }}>✓</span>
                  <span>Patient details &amp; non-diagnostic triage context</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-body)" }}>
                  <span style={{ color: "var(--color-brand)" }}>✓</span>
                  <span>Clinical notes, vitals, and prescription signing</span>
                </div>
              </div>
            </div>

            <Link href="/doctor" style={{ display: "block" }}>
              <button
                className="mk-btn mk-btn-secondary"
                style={{
                  width: "100%",
                  minHeight: 44,
                  fontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0 18px",
                }}
              >
                <span>Continue as Doctor</span>
                <IconArrowRight size={16} />
              </button>
            </Link>
          </div>

          {/* ROLE 3: Admin */}
          <div style={{
            background: "#ffffff",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-cards)",
            boxShadow: "var(--mk-shadow-card)",
            padding: "32px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span className="mk-badge mk-badge-warn">Hospital Operations</span>
                <span style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "var(--color-text-subtle)" }}>
                  ROLE 03
                </span>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--color-text)", margin: "0 0 8px" }}>
                Admin
              </h2>

              <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--color-text-muted)", margin: "0 0 24px" }}>
                Monitor patient flow, emergencies, and hospital operations across clinical departments.
              </p>

              <div style={{
                padding: "12px 16px",
                background: "var(--color-canvas-subtle)",
                borderRadius: 8,
                marginBottom: 28,
                border: "1px solid var(--color-border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-body)" }}>
                  <span style={{ color: "var(--color-brand)" }}>✓</span>
                  <span>Active P0 emergency response oversight</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-body)" }}>
                  <span style={{ color: "var(--color-brand)" }}>✓</span>
                  <span>Departmental load, wait times &amp; doctor coverage</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-body)" }}>
                  <span style={{ color: "var(--color-brand)" }}>✓</span>
                  <span>Triage review queue &amp; immutable audit ledger</span>
                </div>
              </div>
            </div>

            <Link href="/admin" style={{ display: "block" }}>
              <button
                className="mk-btn mk-btn-secondary"
                style={{
                  width: "100%",
                  minHeight: 44,
                  fontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0 18px",
                }}
              >
                <span>Continue as Admin</span>
                <IconArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Clean Hospital Compliance Footer */}
      <footer style={{
        maxWidth: 1240,
        width: "100%",
        margin: "0 auto",
        paddingTop: 24,
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--color-text-muted)" }}>
          <span style={{ fontWeight: 600, color: "var(--color-text)" }}>MediKiosk</span>
          <span>·</span>
          <span>Hospital Check-in &amp; Triage System</span>
          <span>·</span>
          <span>ABDM &amp; HIPAA Compliant</span>
        </div>

        <div className="mk-meta">
          Assistive Triage Only · All Clinical Decisions Made by Licensed Attending Physicians
        </div>
      </footer>
    </div>
  );
}
