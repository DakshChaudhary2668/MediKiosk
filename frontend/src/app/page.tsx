"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MKLogo } from "@/components/shared";
import {
  IconHospital,
  IconStethoscope,
  IconShield,
  IconShieldAlert,
  IconAlertTriangle,
  IconCheckCircle,
  IconClock,
  IconActivity,
  IconFileText,
  IconUser,
  IconUsers,
  IconArrowRight,
  IconMic,
  IconPill,
  IconBarChart,
  IconDatabase,
  IconEye,
  IconChevronRight,
} from "@/components/icons";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"kiosk" | "doctor" | "ops">("kiosk");

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--mk-canvas)",
        color: "var(--color-text)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 1. MINIMAL INSTITUTIONAL NAVIGATION */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255, 255, 255, 0.96)",
          borderBottom: "1px solid var(--color-border)",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "16px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <MKLogo subtitle="Clinical Intake & Orchestration" />
            </Link>

            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-text-muted)",
              }}
              className="mk-landing-nav"
            >
              <a href="#product" style={{ color: "inherit", textDecoration: "none" }}>
                Product
              </a>
              <a href="#workflow" style={{ color: "inherit", textDecoration: "none" }}>
                How It Works
              </a>
              <a href="#personas" style={{ color: "inherit", textDecoration: "none" }}>
                Three Experiences
              </a>
              <a href="#governance" style={{ color: "inherit", textDecoration: "none" }}>
                Clinical Governance
              </a>
            </nav>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* System Status Indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontFamily: "var(--mk-font-mono)",
                color: "var(--color-text-muted)",
                background: "var(--color-canvas-subtle)",
                padding: "4px 10px",
                borderRadius: 4,
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              <span className="mk-status-dot" style={{ color: "var(--color-green)" }} />
              <span>ABDM / HIPAA READY</span>
            </div>

            {/* Direct Gateway Access CTA */}
            <Link href="/gateway" style={{ textDecoration: "none" }}>
              <button
                className="mk-btn mk-btn-primary"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "0 16px",
                  height: 38,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>Enter MediKiosk</span>
                <IconArrowRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. ART-DIRECTED HERO SECTION */}
      <section
        style={{
          padding: "64px 32px 56px",
          borderBottom: "1px solid var(--color-border)",
          background: "linear-gradient(180deg, #ffffff 0%, var(--mk-canvas) 100%)",
        }}
      >
        <div
          className="mk-hero-grid"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
          }}
        >
          {/* Left Column: Editorial Statement */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-brand)",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                padding: "4px 10px",
                borderRadius: 4,
                marginBottom: 16,
              }}
            >
              <span>Clinical Intake · Triage · Operations</span>
            </div>

            <h1
              style={{
                fontSize: "clamp(34px, 4.2vw, 52px)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.12,
                color: "var(--color-text)",
                margin: "0 0 18px",
              }}
            >
              From patient check-in <br />
              to clinical care.
            </h1>

            <p
              style={{
                fontSize: 16,
                lineHeight: 1.6,
                color: "var(--color-text-muted)",
                margin: "0 0 28px",
                maxWidth: 540,
              }}
            >
              MediKiosk connects patient intake, assistive clinical triage, and real-time hospital operations in one clear workflow. Built for busy emergency departments and outpatient centers where clinical clarity saves critical minutes.
            </p>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 32,
              }}
            >
              <Link href="/gateway" style={{ textDecoration: "none" }}>
                <button
                  className="mk-btn mk-btn-primary"
                  style={{
                    height: 44,
                    padding: "0 20px",
                    fontSize: 14,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>Enter MediKiosk</span>
                  <IconArrowRight size={15} />
                </button>
              </Link>

              <a href="#product" style={{ textDecoration: "none" }}>
                <button
                  className="mk-btn mk-btn-secondary"
                  style={{
                    height: 44,
                    padding: "0 18px",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Explore Clinical Flow
                </button>
              </a>
            </div>

            {/* Quick Persona Deep Links */}
            <div
              style={{
                paddingTop: 20,
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 24,
                fontSize: 13,
                color: "var(--color-text-muted)",
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--color-text)" }}>Direct Access:</span>
              <Link
                href="/patient"
                style={{
                  color: "var(--color-text)",
                  textDecoration: "none",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Patient Check-in →
              </Link>
              <Link
                href="/doctor"
                style={{
                  color: "var(--color-text)",
                  textDecoration: "none",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Physician Queue →
              </Link>
              <Link
                href="/admin"
                style={{
                  color: "var(--color-text)",
                  textDecoration: "none",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Operations Command →
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Kiosk Product Video & Poster Fallback */}
          <div>
            <div
              style={{
                position: "relative",
                width: "100%",
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03)",
                overflow: "hidden",
                background: "#090d16",
                aspectRatio: "16 / 9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster="/media/medikiosk-hero-poster.jpg"
                ref={(el) => {
                  if (el) {
                    el.muted = true;
                    el.play().catch(() => {});
                  }
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              >
                <source src="/media/medikiosk-hero.mp4" type="video/mp4" />
              </video>

              {/* Operational Badges */}
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: 14,
                  zIndex: 2,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 4,
                  background: "rgba(15, 23, 42, 0.82)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#f8fafc",
                  fontSize: 11,
                  fontFamily: "var(--mk-font-mono)",
                  pointerEvents: "none",
                }}
              >
                <span className="mk-status-dot" style={{ color: "var(--color-green)" }} />
                <span>STATION 04 · KIOSK DEMO</span>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 14,
                  right: 14,
                  zIndex: 2,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 4,
                  background: "rgba(15, 23, 42, 0.82)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#cbd5e1",
                  fontSize: 11,
                  fontFamily: "var(--mk-font-mono)",
                  pointerEvents: "none",
                }}
              >
                <span>12 LANGUAGES · ZERO DATA AT REST</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. POSITIONING PROCESS STRIP */}
      <section
        style={{
          borderBottom: "1px solid var(--color-border)",
          background: "#ffffff",
          padding: "24px 32px",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-text-subtle)",
              marginBottom: 16,
            }}
          >
            One Connected Workflow Across The Entire Hospital
          </div>

          <div className="mk-workflow-grid">
            {/* Step 1 */}
            <div
              style={{
                borderLeft: "2px solid var(--color-brand)",
                paddingLeft: 12,
              }}
            >
              <div style={{ fontFamily: "var(--mk-font-mono)", fontSize: 11, color: "var(--color-brand)", fontWeight: 600 }}>
                01 CHECK-IN
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginTop: 2 }}>
                Patient Kiosk
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                Voice &amp; touch in 12 languages
              </div>
            </div>

            {/* Step 2 */}
            <div
              style={{
                borderLeft: "2px solid #0284c7",
                paddingLeft: 12,
              }}
            >
              <div style={{ fontFamily: "var(--mk-font-mono)", fontSize: 11, color: "#0284c7", fontWeight: 600 }}>
                02 INTAKE
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginTop: 2 }}>
                Clinical Narrative
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                Structured symptoms &amp; red-flags
              </div>
            </div>

            {/* Step 3 */}
            <div
              style={{
                borderLeft: "2px solid #d97706",
                paddingLeft: 12,
              }}
            >
              <div style={{ fontFamily: "var(--mk-font-mono)", fontSize: 11, color: "#d97706", fontWeight: 600 }}>
                03 ASSISTIVE TRIAGE
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginTop: 2 }}>
                Acuity Sorting
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                P0-P3 urgency categorization
              </div>
            </div>

            {/* Step 4 */}
            <div
              style={{
                borderLeft: "2px solid var(--color-green)",
                paddingLeft: 12,
              }}
            >
              <div style={{ fontFamily: "var(--mk-font-mono)", fontSize: 11, color: "var(--color-green)", fontWeight: 600 }}>
                04 PHYSICIAN
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginTop: 2 }}>
                Consultation &amp; Care
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                100% doctor sign-off &amp; rx
              </div>
            </div>

            {/* Step 5 */}
            <div
              style={{
                borderLeft: "2px solid #475569",
                paddingLeft: 12,
              }}
            >
              <div style={{ fontFamily: "var(--mk-font-mono)", fontSize: 11, color: "#475569", fontWeight: 600 }}>
                05 OPERATIONS
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginTop: 2 }}>
                Resource Dispatch
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                Beds, lab routing &amp; pharmacy
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRODUCT STORY — THREE EXPERIENCES */}
      <section
        id="personas"
        style={{
          padding: "72px 32px",
          maxWidth: 1280,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 640, marginBottom: 52 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-brand)",
              marginBottom: 8,
            }}
          >
            Three Experiences · One Cohesive System
          </div>
          <h2
            style={{
              fontSize: "clamp(26px, 3vw, 36px)",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              color: "var(--color-text)",
              margin: "0 0 12px",
            }}
          >
            Built for everyone inside the hospital.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--color-text-muted)", margin: 0 }}>
            Hospitals succeed when information flows seamlessly between arriving patients, attending clinicians, and departmental administrators.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {/* Persona 1: Patient Experience */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: "36px 32px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 36,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span className="mk-badge mk-badge-ok">PATIENT INTAKE</span>
                <span style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "var(--color-text-subtle)" }}>
                  EXPERIENCE 01 / 03
                </span>
              </div>

              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "var(--color-text)",
                  margin: "0 0 12px",
                }}
              >
                Check in without the paperwork.
              </h3>

              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--color-text-muted)", margin: "0 0 20px" }}>
                Arriving at a hospital in distress shouldn&apos;t require filling out illegible paper forms. Patients interact naturally using voice or touch in their native language, capturing exact symptom details while keeping wait times transparent.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <IconCheckCircle size={16} color="var(--color-green)" />
                  <span>Spoken voice intake in 12 Indian languages with audio waveform feedback</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <IconCheckCircle size={16} color="var(--color-green)" />
                  <span>Instant digital pass with transparent queue position and estimated wait</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <IconCheckCircle size={16} color="var(--color-green)" />
                  <span>Immediate staff buzzer for detected chest pain, stroke, or severe trauma</span>
                </div>
              </div>

              <Link href="/patient" style={{ textDecoration: "none" }}>
                <button
                  className="mk-btn mk-btn-primary"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    height: 40,
                    padding: "0 18px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>Experience Patient Check-In</span>
                  <IconArrowRight size={14} />
                </button>
              </Link>
            </div>

            {/* Patient UI Graphic representation */}
            <div
              style={{
                background: "var(--mk-canvas)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 8,
                padding: "24px",
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 6,
                  border: "1px solid var(--color-border)",
                  padding: "16px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-brand)" }}>
                    Kiosk Intake Bay · Station 04
                  </span>
                  <span style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "var(--color-green)" }}>
                    ● Mic Active
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>
                  Spoken in Hindi:
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--color-text)",
                    background: "#f1f5f9",
                    padding: "10px 14px",
                    borderRadius: 6,
                    lineHeight: 1.5,
                  }}
                >
                  &ldquo;छाती में भारीपन हो रहा है और सांस लेने में दिक्कत आ रही है...&rdquo;
                </div>
                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                  <span style={{ color: "var(--color-text-subtle)" }}>Real-time medical transcription</span>
                  <span style={{ color: "var(--color-brand)", fontWeight: 600 }}>Confidence: 98.4%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Persona 2: Doctor Experience */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: "36px 32px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 36,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span className="mk-badge mk-badge-info">PHYSICIAN WORKSPACE</span>
                <span style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "var(--color-text-subtle)" }}>
                  EXPERIENCE 02 / 03
                </span>
              </div>

              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "var(--color-text)",
                  margin: "0 0 12px",
                }}
              >
                Give clinicians the context they need.
              </h3>

              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--color-text-muted)", margin: "0 0 20px" }}>
                Emergency physicians and OPD specialists review cases prioritized strictly by clinical urgency rather than arrival time. Verbatim patient accounts, vital sign trends, and rule-based triage flags are organized into clear clinical summaries before consultation begins.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <IconCheckCircle size={16} color="var(--color-green)" />
                  <span>Prioritized queue ordered by acuity score (P0 Critical to P3 Routine)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <IconCheckCircle size={16} color="var(--color-green)" />
                  <span>Full verbatim statements alongside structured vitals and clinical history</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <IconCheckCircle size={16} color="var(--color-green)" />
                  <span>100% Attending Physician Authority — zero algorithmic diagnostic substitution</span>
                </div>
              </div>

              <Link href="/doctor" style={{ textDecoration: "none" }}>
                <button
                  className="mk-btn mk-btn-secondary"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    height: 40,
                    padding: "0 18px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>Open Physician Workspace</span>
                  <IconArrowRight size={14} />
                </button>
              </Link>
            </div>

            {/* Doctor Queue Preview */}
            <div
              style={{
                background: "var(--mk-canvas)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 8,
                padding: "24px",
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 6,
                  border: "1px solid var(--color-border)",
                  padding: "16px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>
                    Cardiology Consult Queue
                  </span>
                  <span className="mk-badge mk-badge-crit">3 Urgent Active</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      background: "#fef2f2",
                      borderRadius: 4,
                      border: "1px solid #fee2e2",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#991b1b" }}>
                      #042 · Rajesh Verma (54M)
                    </div>
                    <div style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "#b91c1c" }}>
                      P1 URGENT
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      background: "#fffbeb",
                      borderRadius: 4,
                      border: "1px solid #fef3c7",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e" }}>
                      #043 · Priya Nair (38F)
                    </div>
                    <div style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "#d97706" }}>
                      P2 HIGH
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      background: "#f8fafc",
                      borderRadius: 4,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text)" }}>
                      #044 · Amit Patel (62M)
                    </div>
                    <div style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "var(--color-text-muted)" }}>
                      P3 ROUTINE
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Persona 3: Operations & Administration */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: "36px 32px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 36,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span className="mk-badge mk-badge-warn">HOSPITAL OPERATIONS</span>
                <span style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "var(--color-text-subtle)" }}>
                  EXPERIENCE 03 / 03
                </span>
              </div>

              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: "var(--color-text)",
                  margin: "0 0 12px",
                }}
              >
                Keep the hospital moving.
              </h3>

              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--color-text-muted)", margin: "0 0 20px" }}>
                Supervise department occupancy, track emergency bottlenecks, and verify compliance in real time. MediKiosk gives nursing chiefs and medical superintendents an executive pulse on bed allocation, emergency escalations, and physician worklists.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <IconCheckCircle size={16} color="var(--color-green)" />
                  <span>Real-time department capacity and active patient load monitoring</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <IconCheckCircle size={16} color="var(--color-green)" />
                  <span>Immediate P0 trauma escalation alerts broadcast to resuscitation teams</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <IconCheckCircle size={16} color="var(--color-green)" />
                  <span>Tamper-evident audit ledger logging every triage classification and override</span>
                </div>
              </div>

              <Link href="/admin" style={{ textDecoration: "none" }}>
                <button
                  className="mk-btn mk-btn-secondary"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    height: 40,
                    padding: "0 18px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>View Operations Command</span>
                  <IconArrowRight size={14} />
                </button>
              </Link>
            </div>

            {/* Ops Command Preview */}
            <div
              style={{
                background: "var(--mk-canvas)",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 8,
                padding: "24px",
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 6,
                  border: "1px solid var(--color-border)",
                  padding: "16px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>
                    Live Bed Census &amp; Capacity
                  </span>
                  <span style={{ fontSize: 11, fontFamily: "var(--mk-font-mono)", color: "var(--color-text-muted)" }}>
                    Updated 2m ago
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>Emergency Department</span>
                      <span style={{ fontFamily: "var(--mk-font-mono)", fontWeight: 600 }}>18 / 20 Beds (90%)</span>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "90%", background: "#dc2626" }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>Cardiology Ward</span>
                      <span style={{ fontFamily: "var(--mk-font-mono)", fontWeight: 600 }}>14 / 24 Beds (58%)</span>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "58%", background: "#2563eb" }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>Outpatient Clinics</span>
                      <span style={{ fontFamily: "var(--mk-font-mono)", fontWeight: 600 }}>42 / 80 Active (52%)</span>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: "52%", background: "#10b981" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRODUCT UI SHOWCASE ("INSIDE MEDIKIOSK") */}
      <section
        id="product"
        style={{
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          background: "#ffffff",
          padding: "72px 32px",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 40px" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-brand)",
                marginBottom: 8,
              }}
            >
              Inside MediKiosk
            </div>
            <h2
              style={{
                fontSize: "clamp(26px, 3vw, 36px)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: "var(--color-text)",
                margin: "0 0 12px",
              }}
            >
              An interface designed for clinical clarity.
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--color-text-muted)", margin: 0 }}>
              Inspect the high-fidelity workspaces built specifically for each point of hospital intake, review, and executive command.
            </p>
          </div>

          {/* Interactive Tab Switcher */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginBottom: 32,
            }}
          >
            <button
              onClick={() => setActiveTab("kiosk")}
              style={{
                padding: "8px 18px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid",
                borderColor: activeTab === "kiosk" ? "var(--color-brand)" : "var(--color-border)",
                background: activeTab === "kiosk" ? "#eff6ff" : "#ffffff",
                color: activeTab === "kiosk" ? "var(--color-brand)" : "var(--color-text-muted)",
                transition: "all 0.15s ease",
              }}
            >
              01 Patient Kiosk
            </button>

            <button
              onClick={() => setActiveTab("doctor")}
              style={{
                padding: "8px 18px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid",
                borderColor: activeTab === "doctor" ? "var(--color-brand)" : "var(--color-border)",
                background: activeTab === "doctor" ? "#eff6ff" : "#ffffff",
                color: activeTab === "doctor" ? "var(--color-brand)" : "var(--color-text-muted)",
                transition: "all 0.15s ease",
              }}
            >
              02 Doctor Workspace
            </button>

            <button
              onClick={() => setActiveTab("ops")}
              style={{
                padding: "8px 18px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid",
                borderColor: activeTab === "ops" ? "var(--color-brand)" : "var(--color-border)",
                background: activeTab === "ops" ? "#eff6ff" : "#ffffff",
                color: activeTab === "ops" ? "var(--color-brand)" : "var(--color-text-muted)",
                transition: "all 0.15s ease",
              }}
            >
              03 Operations Command
            </button>
          </div>

          {/* Interactive Screen Display Container */}
          <div
            style={{
              background: "var(--mk-canvas)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              padding: "24px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            }}
          >
            {activeTab === "kiosk" && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  padding: "28px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: "var(--color-brand)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      MK
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>MediKiosk Intake Station #04</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-subtle)" }}>Hospital Emergency Reception</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <span className="mk-badge mk-badge-info">English</span>
                    <span className="mk-badge">हिन्दी</span>
                    <span className="mk-badge">தமிழ்</span>
                    <span className="mk-badge">বাংলা</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "20px",
                    background: "var(--color-canvas-subtle)",
                    borderRadius: 6,
                    border: "1px solid var(--color-border-subtle)",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 6 }}>
                    STEP 02 OF 04 · SHARE YOUR SYMPTOMS
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text)", marginBottom: 12 }}>
                    Speak into the microphone or describe your condition below:
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid var(--color-border)",
                      borderRadius: 6,
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-brand)",
                      }}
                    >
                      <IconMic size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: "var(--color-text)" }}>
                        &ldquo;Severe headache for 2 days with sensitivity to light and mild nausea.&rdquo;
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-green)", marginTop: 4 }}>
                        ● Voice transcription active · Speech detected clearly
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    background: "#f0fdf4",
                    borderRadius: 6,
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#166534" }}>DIGITAL CARE PASS GENERATED</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#14532d", fontFamily: "var(--mk-font-mono)" }}>
                      TOKEN #048 · GENERAL OPD · WAIT ~12 MIN
                    </div>
                  </div>
                  <Link href="/patient" style={{ textDecoration: "none" }}>
                    <button className="mk-btn mk-btn-primary" style={{ fontSize: 12, height: 34 }}>
                      Open Live Kiosk Demo →
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "doctor" && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  padding: "28px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
                      Emergency &amp; Acute Care Queue
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      Attending: Dr. Ananya Rao, MD · 8 Patients Waiting
                    </div>
                  </div>

                  <span className="mk-badge mk-badge-ok">Queue Synchronized</span>
                </div>

                <div
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    overflow: "hidden",
                    marginBottom: 16,
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "var(--color-canvas-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                        <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11, color: "var(--color-text-subtle)" }}>TOKEN</th>
                        <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11, color: "var(--color-text-subtle)" }}>PATIENT</th>
                        <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11, color: "var(--color-text-subtle)" }}>CHIEF COMPLAINT</th>
                        <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11, color: "var(--color-text-subtle)" }}>PRIORITY</th>
                        <th style={{ padding: "10px 14px", fontWeight: 600, fontSize: 11, color: "var(--color-text-subtle)" }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: "1px solid var(--color-border-subtle)", background: "#fff5f5" }}>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--mk-font-mono)", fontWeight: 600 }}>#042</td>
                        <td style={{ padding: "12px 14px", fontWeight: 600 }}>Rajesh Verma (54M)</td>
                        <td style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>Retrosternal chest pressure, diaphoresis</td>
                        <td style={{ padding: "12px 14px" }}><span className="mk-badge mk-badge-crit">P1 · URGENT</span></td>
                        <td style={{ padding: "12px 14px" }}>
                          <button className="mk-btn mk-btn-primary" style={{ fontSize: 11, height: 28, padding: "0 10px" }}>
                            Consult Case
                          </button>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--mk-font-mono)", fontWeight: 600 }}>#043</td>
                        <td style={{ padding: "12px 14px", fontWeight: 600 }}>Priya Nair (38F)</td>
                        <td style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>Severe right lower quadrant abdominal pain</td>
                        <td style={{ padding: "12px 14px" }}><span className="mk-badge mk-badge-warn">P2 · HIGH</span></td>
                        <td style={{ padding: "12px 14px" }}>
                          <button className="mk-btn mk-btn-secondary" style={{ fontSize: 11, height: 28, padding: "0 10px" }}>
                            Review
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    Clinical Safety Invariant: Attending physician maintains 100% diagnostic and prescription authority.
                  </div>
                  <Link href="/doctor" style={{ textDecoration: "none" }}>
                    <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, height: 34 }}>
                      Open Doctor Portal →
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "ops" && (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  padding: "28px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)" }}>
                      Hospital Operations Command
                    </div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      Central Hospital Network · Live Overview
                    </div>
                  </div>

                  <span className="mk-badge mk-badge-info">Station Grid: All Online</span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ padding: "14px", background: "var(--color-canvas-subtle)", borderRadius: 6, border: "1px solid var(--color-border-subtle)" }}>
                    <div style={{ fontSize: 11, color: "var(--color-text-subtle)", textTransform: "uppercase" }}>Total Admissions</div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mk-font-mono)", marginTop: 4 }}>142</div>
                    <div style={{ fontSize: 11, color: "var(--color-green)", marginTop: 2 }}>+14% from yesterday</div>
                  </div>

                  <div style={{ padding: "14px", background: "var(--color-canvas-subtle)", borderRadius: 6, border: "1px solid var(--color-border-subtle)" }}>
                    <div style={{ fontSize: 11, color: "var(--color-text-subtle)", textTransform: "uppercase" }}>P0 / P1 Emergencies</div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mk-font-mono)", color: "var(--color-crimson)", marginTop: 4 }}>4</div>
                    <div style={{ fontSize: 11, color: "var(--color-crimson)", marginTop: 2 }}>Resuscitation active</div>
                  </div>

                  <div style={{ padding: "14px", background: "var(--color-canvas-subtle)", borderRadius: 6, border: "1px solid var(--color-border-subtle)" }}>
                    <div style={{ fontSize: 11, color: "var(--color-text-subtle)", textTransform: "uppercase" }}>Avg Triage Time</div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mk-font-mono)", marginTop: 4 }}>03:18</div>
                    <div style={{ fontSize: 11, color: "var(--color-green)", marginTop: 2 }}>Target &lt; 05:00</div>
                  </div>

                  <div style={{ padding: "14px", background: "var(--color-canvas-subtle)", borderRadius: 6, border: "1px solid var(--color-border-subtle)" }}>
                    <div style={{ fontSize: 11, color: "var(--color-text-subtle)", textTransform: "uppercase" }}>Audit Invariants</div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--mk-font-mono)", color: "var(--color-green)", marginTop: 4 }}>100%</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-subtle)", marginTop: 2 }}>Zero safety violations</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    Cryptographic audit trail active across all departmental stations.
                  </div>
                  <Link href="/admin" style={{ textDecoration: "none" }}>
                    <button className="mk-btn mk-btn-secondary" style={{ fontSize: 12, height: 34 }}>
                      Open Admin Command →
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. HUMAN-FIRST PATIENT JOURNEY */}
      <section
        id="workflow"
        style={{
          padding: "72px 32px",
          maxWidth: 1280,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 640, marginBottom: 48 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-brand)",
              marginBottom: 8,
            }}
          >
            Human-First Patient Journey
          </div>
          <h2
            style={{
              fontSize: "clamp(26px, 3vw, 36px)",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              color: "var(--color-text)",
              margin: "0 0 12px",
            }}
          >
            From anxious arrival to focused care.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--color-text-muted)", margin: 0 }}>
            Every step is engineered to reduce stress for patients and eliminate operational bottlenecks for staff.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          {/* Phase 1 */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: "24px",
            }}
          >
            <div style={{ fontFamily: "var(--mk-font-mono)", fontSize: 12, color: "var(--color-brand)", fontWeight: 600, marginBottom: 8 }}>
              PHASE 01
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "var(--color-text)" }}>
              Arrive &amp; Identify
            </h4>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--color-text-muted)", margin: 0 }}>
              The patient touches the kiosk or speaks to start. Instant identity verification via ABHA ID or phone number without standing in front desk queues.
            </p>
          </div>

          {/* Phase 2 */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: "24px",
            }}
          >
            <div style={{ fontFamily: "var(--mk-font-mono)", fontSize: 12, color: "var(--color-brand)", fontWeight: 600, marginBottom: 8 }}>
              PHASE 02
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "var(--color-text)" }}>
              Share Symptoms
            </h4>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--color-text-muted)", margin: 0 }}>
              Patients describe their condition in everyday words in any of 12 Indian languages. The system extracts timeline, severity, and pain location accurately.
            </p>
          </div>

          {/* Phase 3 */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: "24px",
            }}
          >
            <div style={{ fontFamily: "var(--mk-font-mono)", fontSize: 12, color: "var(--color-brand)", fontWeight: 600, marginBottom: 8 }}>
              PHASE 03
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "var(--color-text)" }}>
              Safety &amp; Acuity Sorting
            </h4>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--color-text-muted)", margin: 0 }}>
              Deterministic safety rules evaluate emergency symptoms. Trauma, chest pain, and stroke indicators immediately notify emergency staff.
            </p>
          </div>

          {/* Phase 4 */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: "24px",
            }}
          >
            <div style={{ fontFamily: "var(--mk-font-mono)", fontSize: 12, color: "var(--color-brand)", fontWeight: 600, marginBottom: 8 }}>
              PHASE 04
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "var(--color-text)" }}>
              Informed Consultation
            </h4>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--color-text-muted)", margin: 0 }}>
              The attending physician receives the synthesized intake, reviews vitals, conducts the clinical exam, and signs the treatment plan.
            </p>
          </div>
        </div>
      </section>

      {/* 7. CLINICAL SAFETY, GOVERNANCE & INSTITUTIONAL TRUST */}
      <section
        id="governance"
        style={{
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-canvas-subtle)",
          padding: "72px 32px",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ maxWidth: 680, marginBottom: 48 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-brand)",
                marginBottom: 8,
              }}
            >
              Safety, Governance &amp; Compliance
            </div>
            <h2
              style={{
                fontSize: "clamp(26px, 3vw, 36px)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: "var(--color-text)",
                margin: "0 0 12px",
              }}
            >
              Engineered for clinical safety and institutional accountability.
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--color-text-muted)", margin: 0 }}>
              We believe assistive healthcare software must be held to the highest standard of clinician oversight, auditability, and sovereign data residency.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
            }}
          >
            {/* Pillar 1 */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "28px",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-brand)",
                  marginBottom: 16,
                }}
              >
                <IconStethoscope size={20} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "var(--color-text)" }}>
                100% Physician Authority
              </h4>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--color-text-muted)", margin: 0 }}>
                MediKiosk strictly provides assistive triage context and acuity sorting. It does not perform autonomous diagnosis or prescribe therapies. Every clinical action requires attending physician validation.
              </p>
            </div>

            {/* Pillar 2 */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "28px",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-crimson)",
                  marginBottom: 16,
                }}
              >
                <IconShieldAlert size={20} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "var(--color-text)" }}>
                Deterministic Safety Invariants
              </h4>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--color-text-muted)", margin: 0 }}>
                High-risk clinical presentations—such as chest pain radiating to the left arm, acute focal neurological deficits, or severe dyspnea—trigger immediate P0/P1 emergency protocols that cannot be downgraded.
              </p>
            </div>

            {/* Pillar 3 */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "28px",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: "#f0fdf4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-green)",
                  marginBottom: 16,
                }}
              >
                <IconDatabase size={20} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "var(--color-text)" }}>
                Tamper-Evident Audit Ledger
              </h4>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--color-text-muted)", margin: 0 }}>
                Every intake event, triage categorization, vital entry, and physician override is recorded in an immutable audit ledger with cryptographic timestamps for clinical risk management and legal compliance.
              </p>
            </div>

            {/* Pillar 4 */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "28px",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#475569",
                  marginBottom: 16,
                }}
              >
                <IconShield size={20} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "var(--color-text)" }}>
                ABDM &amp; Sovereign Data
              </h4>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--color-text-muted)", margin: 0 }}>
                Aligned with Ayushman Bharat Digital Mission (M1/M2/M3) milestones and HIPAA health data privacy standards. Built for on-premise or sovereign private cloud hospital network deployment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINAL MINIMAL CALL TO ACTION */}
      <section
        style={{
          padding: "80px 32px",
          background: "#ffffff",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 3.5vw, 40px)",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              color: "var(--color-text)",
              margin: "0 0 16px",
            }}
          >
            Ready to experience MediKiosk?
          </h2>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--color-text-muted)",
              margin: "0 0 32px",
            }}
          >
            Explore the end-to-end clinical workflow from patient kiosk self-check-in to attending physician review and operations management.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 36,
            }}
          >
            <Link href="/gateway" style={{ textDecoration: "none" }}>
              <button
                className="mk-btn mk-btn-primary"
                style={{
                  height: 44,
                  padding: "0 24px",
                  fontSize: 14,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>Enter MediKiosk</span>
                <IconArrowRight size={15} />
              </button>
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 24,
              fontSize: 13,
              color: "var(--color-text-muted)",
            }}
          >
            <Link href="/patient" style={{ color: "var(--color-brand)", textDecoration: "none", fontWeight: 500 }}>
              Patient Check-In →
            </Link>
            <span style={{ color: "var(--color-border)" }}>·</span>
            <Link href="/doctor" style={{ color: "var(--color-brand)", textDecoration: "none", fontWeight: 500 }}>
              Doctor Portal →
            </Link>
            <span style={{ color: "var(--color-border)" }}>·</span>
            <Link href="/admin" style={{ color: "var(--color-brand)", textDecoration: "none", fontWeight: 500 }}>
              Operations Admin →
            </Link>
          </div>
        </div>
      </section>

      {/* 9. RESTRAINED CLINICAL FOOTER */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border)",
          background: "var(--mk-canvas)",
          padding: "48px 32px 36px",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 36,
            marginBottom: 40,
          }}
        >
          <div>
            <MKLogo subtitle="Clinical Intake & Orchestration" />
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-text-muted)", marginTop: 12 }}>
              Connecting patient arrival, assistive triage, and clinical operations in one continuous hospital workflow.
            </p>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--color-text-subtle)", marginBottom: 12 }}>
              Hospital System
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <Link href="/patient" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
                Patient Intake Kiosk
              </Link>
              <Link href="/doctor" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
                Physician Workspace
              </Link>
              <Link href="/admin" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
                Operations Command
              </Link>
              <Link href="/gateway" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
                Role Gateway
              </Link>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--color-text-subtle)", marginBottom: 12 }}>
              Clinical Standards
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--color-text-muted)" }}>
              <span>ABDM M1 / M2 / M3 Aligned</span>
              <span>HL7 FHIR Record Interchange</span>
              <span>ICD-10 / SNOMED CT Terminology</span>
              <span>ISO 27001 Data Governance</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: "var(--color-text-subtle)", marginBottom: 12 }}>
              Operational Contact
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
              Hospital Technology Unit<br />
              Emergency Response Bay 04<br />
              <span style={{ fontFamily: "var(--mk-font-mono)", fontSize: 12 }}>kiosk-network@medikiosk.internal</span>
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            paddingTop: 24,
            borderTop: "1px solid var(--color-border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 12,
            color: "var(--color-text-subtle)",
          }}
        >
          <div>
            © {new Date().getFullYear()} MediKiosk Systems. Assistive Clinical Triage Only.
          </div>
          <div style={{ maxWidth: 640, textAlign: "right", fontSize: 11, lineHeight: 1.4 }}>
            Notice: MediKiosk provides assistive clinical triage context and priority categorization. It does not provide medical diagnoses or autonomous care plans. All medical care and clinical decisions are rendered by licensed attending physicians.
          </div>
        </div>
      </footer>
    </div>
  );
}
