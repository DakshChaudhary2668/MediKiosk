# Frontend Architecture & Screen Documentation

MediKiosk's frontend is developed as a Progressive Web Application (PWA) using **Next.js 14** (App Router), **React 18**, **TypeScript**, and **Sass/SCSS**. It provides responsive user experiences tailored for tablet kiosks, patient mobile browsers, desktop administrative triage stations, and doctor consultation rooms.

---

## 🖥️ Screen & Route Catalog

### 1. Welcome & Language Selection
- **Route:** `/` (`src/app/page.tsx`)
- **Role:** Patient / Kiosk User
- **Purpose:** Onboards the patient and establishes language preference for voice/text AI interaction.
- **Entry Conditions:** Initial entry point.
- **UI Components:** Logo header, language selector cards (`English`, `हिन्दी`, `Hinglish`), continue CTA button.
- **State & Storage:** Sets `localStorage.getItem('medikiosk_language')`.
- **Navigation:** Routes to `/login`.

### 2. Patient Sign In
- **Route:** `/login` (`src/app/login/page.tsx`)
- **Role:** Patient
- **Purpose:** Authenticates existing patient accounts or initiates dev-mode session.
- **UI Components:** Email input, password input, sign-in button, link to registration (`/register`).
- **API Call:** `POST /api/auth/login`.
- **State & Storage:** Stores `medikiosk_token` and `medikiosk_user_id` in `localStorage`.
- **Navigation:** Routes to `/consent`.

### 3. Patient Registration
- **Route:** `/register` (`src/app/register/page.tsx`)
- **Role:** Patient
- **Purpose:** Creates a new patient account with full name, email, and password.
- **API Calls:** `POST /api/auth/register`, followed by auto-login via `POST /api/auth/login`.
- **Navigation:** Routes to `/consent`.

### 4. Mandatory Clinical & AI Consent
- **Route:** `/consent` (`src/app/consent/page.tsx`)
- **Role:** Patient
- **Purpose:** Discloses AI intake boundaries (non-diagnostic assistant, doctor remains final decision maker, data confidentiality).
- **API Call:** `POST /api/patient/consent` (`{ consent_given: true | false }`).
- **Navigation:** If agreed -> `/profile`; if declined -> `/`.

### 5. Patient Profile & Demographics
- **Route:** `/profile` (`src/app/profile/page.tsx`)
- **Role:** Patient
- **Purpose:** Gathers essential demographics for clinical context.
- **Form Fields:** Full Name, Age (numeric), Gender (`male`/`female`/`other`), Blood Group (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`), Phone number, Emergency Contact.
- **API Calls:** `GET /api/patient/profile`, `POST /api/patient/profile`.
- **Navigation:** Routes to `/documents`.

### 6. Medical Documents Upload (Optional)
- **Route:** `/documents` (`src/app/documents/page.tsx`)
- **Role:** Patient
- **Purpose:** Allows patients to upload previous medical reports, prescriptions, or lab results (PDF or images, max 10MB).
- **API Calls:** `POST /api/patient/documents/upload` (FormData multipart), `GET /api/patient/documents`.
- **Navigation:** Routes to `/dashboard`.

### 7. Patient Dashboard & Live OPD Token Tracker
- **Route:** `/dashboard` (`src/app/dashboard/page.tsx`)
- **Role:** Patient
- **Purpose:** Central hub for patients displaying:
  1. **Start AI Health Assessment CTA:** Initiates a new intake session.
  2. **Live OPD Queue Tracker:** Visible when a session is active:
     - Real-time token badge (e.g. `Token #101`).
     - Progress stepper: `1. AI Intake -> 2. Clinical Triage -> 3. In Queue -> 4. Consultation -> 5. Rx Ready`.
     - Queue position and estimated wait time countdown.
     - Pulsing "Called In" alert directing patient to consultation room.
  3. **Official Digital Prescription (Rx) Box:** Renders doctor diagnosis, clinical notes, medications table with dosage/frequency, and follow-up advice once consultation finishes. Includes print capability.
  4. **Past Intake Sessions:** History list of prior visits.
- **API Calls:** `GET /api/patient/sessions`, `GET /api/patient/queue-status`, `POST /api/intake/session`.
- **Polling:** Auto-polls every 6 seconds for real-time queue position updates.

### 8. Voice & Text AI Intake Conversation
- **Route:** `/intake/[sessionId]` (`src/app/intake/[sessionId]/page.tsx`)
- **Role:** Patient
- **Purpose:** Dynamic conversational AI health assessment.
- **Core Features:**
  - **Audio Recording:** Captures microphone input using browser `MediaRecorder` (`audio/webm;codecs=opus`), slices chunks every 250ms, and posts raw audio bytes to `POST /api/intake/voice`.
  - **Voice State Machine:** Transitions through `IDLE -> LISTENING -> PROCESSING -> SPEAKING -> IDLE`.
  - **Audio Playback:** Automatically plays synthesized Sarvam Bulbul TTS audio (`audio/wav`) when returned from backend.
  - **Text Mode:** Standard text input with keyboard shortcut (`Enter` to submit).
  - **Emergency Banner:** Immediate red alert if deterministic safety filter detects emergency keywords.
  - **Assessment Summary:** Displays extracted facts once complete.
- **API Calls:** `GET /api/intake/session/{id}`, `POST /api/intake/message`, `POST /api/intake/voice`, `POST /api/intake/session/{id}/complete`.

### 9. Super Admin Clinical Triage Gate
- **Route:** `/admin` (`src/app/admin/page.tsx`)
- **Role:** Super Admin / Triage Nurse
- **Purpose:** Human-in-the-loop clinical safety gate ensuring no AI pre-triage recommendation enters the active doctor queue without review.
- **Core Features:**
  - **Incoming Intakes List:** Real-time list of pending patient intakes sorted by urgency (`P0` on top).
  - **Clinical Dossier Inspection:** Inspects chief complaint, duration, severity, reported symptoms, allergies, current medications, and AI confidence rating.
  - **AI Evidence Quotes:** Shows exact patient quotes extracted from conversation as provenance.
  - **Review Actions:**
    - `Approve`: Confirms AI priority and queues patient into doctor queue with assigned token number.
    - `Override Priority`: Opens modal to change acuity band (e.g. `P2 -> P1`) with mandatory clinical justification and internal notes.
    - `Escalate to ER`: Immediate P0 emergency routing.
  - **Demo Data Generator:** `⚡ Seed Test Intakes` button calling `POST /api/triage/seed-demo` to populate 10 realistic test patients.
- **API Calls:** `GET /api/triage/pending`, `POST /api/triage/{id}/review`, `POST /api/triage/seed-demo`.
- **Polling:** Auto-refreshes every 5 seconds.

### 10. Doctor Clinical Workstation & Digital Rx
- **Route:** `/doctor` (`src/app/doctor/page.tsx`)
- **Role:** Medical Doctor / Attending Physician
- **Purpose:** Clinical consultation and prescription workstation.
- **Core Features:**
  - **Priority Queue List:** Displays admitted patients strictly ordered by clinical priority (`P1 Urgent -> P2 Standard -> P3 Routine`) and arrival timestamp.
  - **Turn Calling:** `📢 Call In` changes status to `called` (notifying patient dashboard), `▶ Begin Consultation` marks status `in_consultation`.
  - **Clinical Dossier:** Full view of patient's chief complaint, symptoms, medications, and AI pre-triage summary.
  - **Digital Prescription Builder (Rx):**
    - Confirmed clinical diagnosis (mandatory).
    - Multi-medication dynamic table: Medicine Name, Dosage, Frequency selector (`1-0-1 After Food`, `1-1-1`, `0-0-1 Bedtime`, `SOS`), Duration in days, and Special instructions.
    - Doctor's clinical notes and observations.
    - Referral specialty and follow-up advice.
    - `Complete Consultation & Issue Digital Rx`: Saves consultation and publishes digital prescription to patient dashboard.
- **API Calls:** `GET /api/doctor/queue`, `POST /api/doctor/turn/{id}/call`, `POST /api/doctor/turn/{id}/start`, `POST /api/doctor/turn/{id}/consult`.
- **Polling:** Auto-refreshes every 8 seconds.

---

## 🎨 Design System & Styling Architecture

- **Styling Core:** Modular CSS / SCSS using custom properties defined in `src/styles/globals.scss`.
- **Theme Palette:**
  - Primary Brand (Teal): `#0D9488` (`--color-primary`), `#0F766E` (`--color-primary-dark`)
  - Secondary (Blue): `#2563EB` (`--color-secondary`)
  - Emergency / Danger (Red): `#DC2626` (`--color-danger`), `#FEF2F2` (`--color-danger-bg`)
  - Urgent / Warning (Orange): `#EA580C`, `#FFF7ED`
  - Standard (Blue): `#2563EB`, `#EFF6FF`
  - Routine / Success (Green): `#16A34A`, `#F0FDF4`
  - Background & Surface: `#F8FAFC` (`--color-bg`), `#FFFFFF` (`--color-surface`)
- **PWA Capabilities:** Standalone display mode, touch-friendly touch targets (>44px), offline service worker support configured via `public/manifest.json`.
