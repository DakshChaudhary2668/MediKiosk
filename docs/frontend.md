# Frontend Architecture & Screen Documentation

MediKiosk's frontend is developed as a high-performance healthcare web application using **Next.js 14** (App Router), **React 18**, **TypeScript**, and **Vanilla CSS custom properties** (`src/app/globals.css`). It delivers three specialized clinical interfaces: the **Patient Self-Service Kiosk**, the **Attending Doctor Clinical Suite**, and the **Super Admin Operations & Triage Review Gate**.

---

## 🖥️ Screen & Route Catalog

### 1. Multi-Role Landing Gateway
- **Route:** `/` (`src/app/page.tsx`)
- **Role:** General / Entry
- **Purpose:** Central hospital access portal allowing users to choose their intended interface.
- **UI Components:** MediKiosk branding header, role selection cards with hover transitions and icons:
  - **Patient Kiosk** (`/patient`): Self-service intake kiosk
  - **Doctor Suite** (`/doctor`): Clinical consultation workstation
  - **Super Admin** (`/admin`): Hospital operations and triage review
- **Navigation:** Direct client-side links (`next/link`).

---

### 2. Patient Self-Service Kiosk
- **Route:** `/patient` (`src/app/patient/page.tsx`)
- **Role:** Patient / Kiosk Walk-Up
- **Purpose:** Complete self-service intake kiosk supporting both voice and text input, demographic verification, triage evaluation, and live queue tracking.
- **Workflow Steps (`Step` State Machine):**
  1. `welcome`: Language selection card grid (`English`, `हिंदी`, `मराठी`, `தமிழ்`, `বাংলা`). Sets language context.
  2. `consent`: Explicit clinical AI disclaimer explaining that AI collects symptoms and suggests priority, while medical doctors provide final diagnosis and prescriptions. Requires user consent acceptance.
  3. `identity`: Patient lookup/registration by mobile number or ABHA ID, identifying new vs. returning patients.
  4. `otp`: 6-digit one-time password verification with resend timer.
  5. `intake`: Interactive symptom collection:
     - Chief complaint input and category selector (General, Respiratory, Cardiology, Orthopedics, Gastrointestinal, etc.).
     - Duration and pain severity slider (1–10).
     - **Voice Intake Bar:** Microphone button with real-time waveform animation and state transitions: `idle -> listening -> transcribing -> confirm -> idle`. Handles permission denial, silence detection, and retry.
     - **Deterministic Red-Flag Alert:** Immediate detection of acute emergency keywords.
  6. `processing`: Pre-triage assessment screen showing dynamic analysis spinner.
  7. `outcome-p0`: **P0 Emergency Escalation Screen:** Flashing emergency alert banner, direct instructions to report to Emergency Resuscitation Room, auto-dispatched emergency timeline, zero queue number (bypasses normal queue).
  8. `outcome-p1` / `outcome-p2` / `outcome-p3`: Token assigned badge (e.g. `Token #101`), priority band indicator, department recommendation, estimated wait time, and queue entrance.
  9. `dashboard`: Live OPD turn monitor showing:
     - Real-time token number, position in queue, and patients ahead.
     - Live turn status (`queued` -> `called` with pulsating banner -> `in_consultation` -> `completed`).
     - **Official Digital Prescription (Rx) Box:** Renders diagnosis, doctor clinical notes, multi-medication dosage table, follow-up advice, and print/save capability.
- **State & Storage:** Local component state, fallback to fixtures (`src/lib/fixtures.ts`), polling via `GET /api/patient/queue-status`.

---

### 3. Attending Doctor Clinical Suite
- **Route:** `/doctor` (`src/app/doctor/page.tsx`)
- **Role:** Medical Doctor / OPD Consultant
- **Purpose:** Priority turn management, clinical case review, examination recording, and official digital prescription authoring.
- **Core Panels & Features:**
  - **My Queue:** Live patient list strictly ordered by priority (`P1 Urgent -> P2 Standard -> P3 Routine` FIFO). Shows token number, patient name, age, gender, arrival time, chief complaint, and urgency badge.
  - **P0 Emergency Handover Banner:** Persistent top alert indicating active P0 emergency cases in the hospital, critical indicator list, and emergency team dispatch timeline. Doctor can acknowledge handover without polluting their routine turn queue.
  - **Patient Case Detail Drawer:** Comprehensive dossier including chief complaint, reported symptoms, duration, severity, vitals, current medications, allergies, and AI Pre-Triage advisory context (confidence score, uncertainty gaps, evidence quotes).
  - **Consultation Authoring & Digital Rx Builder:**
    - Vitals entry: Blood Pressure (mmHg), Pulse (bpm), Temperature (°F), SpO2 (%).
    - Clinical examination notes and observations.
    - **Official Clinical Diagnosis** (mandatory doctor-authored diagnosis).
    - **Multi-Medication Digital Rx Table:** Dynamic row addition with Medicine Name, Dosage (`500mg`, `1 tab`), Frequency selector (`1-0-1 After Food`, `1-1-1`, `0-0-1 Bedtime`, `SOS`), Duration in days, and Special Instructions.
    - Referral specialty and follow-up advice.
  - **Turn Actions:**
    - `📢 Call In`: Transitions turn status to `called` (alerts patient kiosk/screen).
    - `▶ Begin Consultation`: Transitions turn status to `in_consultation`.
    - `✓ Complete Consultation & Issue Rx`: Releases official record to patient, completes turn, and advances queue.
  - **Sidebar Navigation:** Queue, Consultations history, Clinical Templates, Reports, and Doctor Profile.
- **API Calls:** `GET /api/doctor/queue`, `POST /api/doctor/turn/{id}/call`, `POST /api/doctor/turn/{id}/in-consultation`, `POST /api/doctor/turn/{id}/consult`.

---

### 4. Super Admin Operations & Triage Review Gate
- **Route:** `/admin` (`src/app/admin/page.tsx`)
- **Role:** Super Admin / Chief Triage Officer
- **Purpose:** Hospital-wide operational oversight, capacity monitoring, and human-in-the-loop clinical triage review.
- **Core Sections (`AdminNav` State):**
  - **Operations Overview (Dashboard):** Real-time KPI cards: Active P0 Emergencies, Pending Review Queue count, P1 Urgent count, Doctor Availability (e.g. 7/12 active), Clarification Requests pending, and Average OPD Wait Time.
  - **Persistent P0 Emergency Lane:** Dedicated alert view for auto-escalated P0 emergencies, showing detection timestamp, location (e.g. Kiosk 3), dispatched response team, and emergency timeline. Admin actions: `Acknowledge`, `Coordinate Handover`, `Resolve`.
  - **Review Queue:** List of all incoming P1, P2, and P3 assessments awaiting queue admission:
    - Evidence Inspection Drawer: Shows AI proposed priority, confidence level, safety flags, and verbatim patient quotes.
    - `Approve`: Confirms AI priority, generates official token number, and enqueues patient to attending doctor.
    - `Override Priority`: Opens modal to alter acuity band (e.g. P2 -> P1 or P1 -> P2) with **mandatory clinical justification reason** and notes.
    - `Request Clarification`: Marks case for additional triage questioning.
    - `Reject`: Disqualifies non-clinical intake.
  - **Staff & Roles:** On-duty doctor availability, assigned OPD rooms, specialty load, and shift status.
  - **Hospital Load Analytics:** Real-time throughput, hourly arrival spikes, priority band distribution charts, and department bottleneck tracking.
  - **AI Monitoring:** Model latency, confidence score distributions, uncertainty rate, and anti-hallucination guardrail metrics.
  - **Immutable Audit Log:** Chronological table tracking every administrative action, consent submission, AI evaluation, override justification, and consultation event.
  - **System Configuration & Status:** Hospital department parameters, triage rules, API health check status, and external service connectivity (Groq, Sarvam, Supabase).
- **API Calls:** `GET /api/triage/pending`, `POST /api/triage/{id}/review`, `POST /api/triage/seed-demo`, `GET /health`.

---

### 5. Standalone Sub-Routes
In addition to the primary portal suites, the codebase provides dedicated standalone routes:
- `/intake/[sessionId]` (`src/app/intake/[sessionId]/page.tsx`): Dedicated conversational intake session with WebM Opus audio recording.
- `/dashboard` (`src/app/dashboard/page.tsx`): Dedicated patient queue status tracker and prescription viewer.
- `/consent` (`src/app/consent/page.tsx`): Standalone clinical AI consent screen.
- `/documents` (`src/app/documents/page.tsx`): Standalone medical document and PDF report uploader.
- `/profile` (`src/app/profile/page.tsx`): Standalone patient demographic profile form.
- `/login` (`src/app/login/page.tsx`): Standalone authentication screen.
- `/register` (`src/app/register/page.tsx`): Standalone user registration screen.

---

## 🎨 Design System & Shared Components (`src/components/shared.tsx`)

The frontend implements a unified, cohesive design system defined via CSS custom properties in `src/app/globals.css` and reusable components in `src/components/shared.tsx`:

| Component | Purpose & Render Details |
| :--- | :--- |
| `MKLogo` | Brand logo with clinical cross icon and optional subtitle badge. |
| `PriorityBadge` | Acuity indicator color-coded to clinical standard: `P0` (flashing red), `P1` (orange), `P2` (blue), `P3` (green). |
| `StatusChip` | State indicator for queue turns (`queued`, `called`, `in_consultation`, `completed`, `skipped`). |
| `AITriageContext` | Collapsible clinical dossier displaying confidence score, uncertainty gaps, safety flags, and evidence provenance. |
| `EvidenceDrawer` | Detailed modal displaying exact patient quotes from the intake dialogue. |
| `WhyAllocation` | Explanatory card breaking down why a patient was allocated to a specific priority and department. |
| `CaseTimeline` | Vertical milestone stepper tracking intake detection, triage review, queue turn, and consultation completion. |
| `ConfirmDialog` | Reusable modal dialog with confirmation callback for clinical and operational actions. |
| `ReasonInput` | Mandatory input textarea enforcing required clinical justification for priority overrides. |
| `ToastContainer` | Notification dispatch queue rendering non-blocking success, error, and alert toasts. |

### Color Tokens (`src/app/globals.css`)
- `--mk-primary`: `#0D9488` (Teal Brand)
- `--mk-primary-light`: `#14B8A6`
- `--mk-danger`: `#EF4444` (P0 Emergency)
- `--mk-p1`: `#F97316` (P1 Urgent)
- `--mk-warning`: `#F59E0B` (P2 Standard)
- `--mk-success`: `#10B981` (P3 Routine)
- `--mk-purple`: `#8B5CF6` (Super Admin Operations)
- `--mk-bg`: `#0A0F1D` (Dark surface canvas)
- `--mk-card`: `#111827` (Card surface)
- `--mk-border`: `#1F2937` (Divider border)
