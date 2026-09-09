# MediKiosk — Elite Frontend Implementation Plan
**Hackathon-Winning Clinical Experience & Production Architecture**

**Document Version:** 1.0.0  
**Author:** Lead Frontend Architect & Principal UI/UX Engineer  
**Status:** Approved for Implementation (Pre-Flight)  
**Target Repository:** `DakshChaudhary2668/MediKiosk`

---

## 1. Executive Summary

MediKiosk is an AI-powered patient intake and clinical queue orchestration platform built for high-throughput healthcare facilities. The platform automates pre-triage, flags critical red flags (P0), optimizes physician queues (P1/P2/P3), and maintains full clinical governance under Super Admin oversight.

### The Problem
The current codebase exhibits a split personality:
1. **The Live Flow** (`/login` → `/dashboard` → `/intake/[sessionId]`): Fully wired to the FastAPI backend and Sarvam voice pipeline, but styled like an austere, generic MVP form with raw SCSS and emojis.
2. **The Showcase Flow** (`/` → `/patient`, `/doctor`, `/admin`): Richly designed with the `--mk-*` design tokens, `OpsShell`, and evidence drawers, but relying almost entirely on static in-memory fixtures in `src/lib/fixtures.ts`.
3. **The Visual Slop**: Heavy emoji usage (`🚨`, `🩺`, `🏥`, `⚙️`), prototype shortcuts (`Demo: Mic denied`), and competing CSS systems (`globals.scss` vs `globals.css`) make the system feel like an AI-generated hackathon mockup rather than a $150k+ clinical-grade hospital suite.

### The Objective: Elevation, Not Rewrite
Under the core directive **DO NOT REBUILD FROM SCRATCH**, we bridge these two universes:
- **Unify the Design Language**: Establish a single canonical clinical design system based on *Soft Structuralism* (crisp medical whites, slate hairlines, machined double-bezel cards, micro-interactions, and zero emojis).
- **Wire the Showcase to Real APIs**: Connect the polished `/doctor`, `/admin`, and `/patient` surfaces to the existing methods in `src/lib/api.ts` (`getDoctorQueue`, `callPatientTurn`, `submitConsultation`, `getPendingTriage`, `reviewTriage`, `createSession`, `sendMessage`, `sendVoice`).
- **Resilient Hybrid Fallback**: Ensure the platform uses real API data when the FastAPI backend is running, but seamlessly degrades to rich deterministic fixtures if the backend is unreachable or empty during a live stage pitch.
- **Elevate the 6 Demo-Critical Surfaces**: Role Selection, Patient Intake, Outcome Routing, Doctor Workspace, P0 Emergency Handover, and Super Admin Command Center.

---

## 2. Current Frontend Truth

Following a line-by-line inspection of the actual repository code (contrasting the findings against `BACKEND_AUDIT.md`, `FRONTEND_TECHNICAL_AUDIT.md`, and `UIUX_AUDIT.md`):

### 1. API Route Alignment is Solved
- **Audit Concern**: `BACKEND_AUDIT.md` flagged a blocker where documentation listed `/api/v1/...` while frontend called `/api/...`.
- **Codebase Reality**: Inspection of `backend/app/routers/*.py` proves that all backend routers use `prefix="/api/..."` (`/api/auth`, `/api/patient`, `/api/intake`, `/api/triage`, `/api`). Next.js `next.config.js` rewrites `/api/:path*` to `http://localhost:8000/api/:path*`. The API routes in `frontend/src/lib/api.ts` match FastAPI router paths **1:1**. There is no route prefix conflict.

### 2. The Two Conflicting Stylistic Universes
- `frontend/src/styles/globals.scss` (added by Harry) defines `--color-primary: #0D9488` and styles the basic `/dashboard` and `/login` routes.
- `frontend/src/app/globals.css` (custom MediKiosk system) defines `--mk-primary: #0B67F3`, `--mk-navy: #0A1E3F`, and 650 lines of `.mk-*` utility classes.
- `src/app/layout.tsx` currently imports both files. Components in `/dashboard` use `.btn-primary` and `.container`, while `/patient`, `/doctor`, and `/admin` use `.mk-btn` and `.mk-card`.

### 3. API Client Status
`src/lib/api.ts` is robust and already implements:
- Authentication: `register`, `login`, `getMe`, token management.
- Patient: `getProfile`, `updateProfile`, `recordConsent`, `listSessions`, `uploadDocument`, `listDocuments`.
- Intake: `createSession`, `sendMessage`, `sendVoice`, `getSession`, `completeSession`.
- Triage / Admin: `getPendingTriage`, `triggerPreTriage`, `reviewTriage`.
- Doctor: `getDoctorQueue`, `callPatientTurn`, `startConsultation`, `submitConsultation`.
- Live Tracker: `getPatientQueueStatus`.

**Key Finding**: The API client methods for Doctor and Admin *already exist* in `src/lib/api.ts`, but `src/app/doctor/page.tsx` and `src/app/admin/page.tsx` were importing `CASES` and `ALL_CASES` directly from `src/lib/fixtures.ts` instead of calling these methods.

### 4. P0 Emergency Invariant
- Both the frozen contract and `src/components/shared.tsx` enforce that P0 emergencies auto-escalate immediately. No admin approval is required before dispatching emergency teams. The UI already has this text; it must be preserved and accentuated.

---

## 3. Route-by-Route Status Matrix

| Route | Primary Role | Data Source | Architectural Status | Visual & UX Status | Action Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | Gateway | Static links | Router gateway | Needs visual overhaul; uses emojis | Rebuild as elite clinical entry portal |
| `/login` | Auth | Live API (`/api/auth/login`) | Fully wired | Basic SCSS form | Restyle into clinical auth card |
| `/register` | Auth | Live API (`/api/auth/register`) | Fully wired | Basic SCSS form | Restyle into clinical auth card |
| `/consent` | Patient | Live API (`/api/patient/consent`) | Fully wired | Basic card layout | Consolidate into kiosk flow |
| `/dashboard` | Patient | Live API (`listSessions`, `getPatientQueueStatus`) | Fully wired | Basic narrow 720px card list | Elevate to patient personal portal |
| `/intake/[sessionId]` | Patient | Live API (`sendMessage`, `sendVoice`, `completeSession`) | Fully wired (Text + Sarvam audio) | Basic chat bubble UI | Merge with kiosk visual excellence |
| `/patient` | Patient | Local State + `fixtures.ts` | Disconnected showcase | High visual fidelity, prototype mechanics | Wire to `api.ts`, remove fake demo buttons |
| `/doctor` | Doctor | Local State + `fixtures.ts` | Disconnected showcase | Rich ops shell, unintegrated | Wire to `getDoctorQueue` / `consult` APIs |
| `/admin` | Super Admin | Local State + `fixtures.ts` | Disconnected showcase | 10-tab command center, unintegrated | Wire to `getPendingTriage` / `reviewTriage` |
| `/documents` | Patient | Live API (`listDocuments`, `uploadDocument`) | Fully wired | Raw file table | Wrap in cohesive clinical shell |
| `/profile` | Patient | Live API (`getProfile`, `updateProfile`) | Fully wired | Plain input list | Wrap in cohesive clinical shell |

---

## 4. Live API vs Fixture Matrix

| Feature Domain | Backend Endpoint | Frontend Client Function | Current Route Consuming | Fallback Fixture in `fixtures.ts` | Target State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth / Identity** | `POST /api/auth/login` | `login()` | `/login` | None (mock user in `/patient`) | Live API + guest kiosk fast-track |
| **Session Init** | `POST /api/intake/session` | `createSession()` | `/intake/[sessionId]`, `/dashboard` | Simulated in `/patient` | Live API with session continuity |
| **Text Intake** | `POST /api/intake/message` | `sendMessage()` | `/intake/[sessionId]` | Hardcoded `VOICE_DEMOS` | Live API with adaptive responses |
| **Voice Intake** | `POST /api/intake/voice` | `sendVoice()` | `/intake/[sessionId]` | Simulated timeouts in `/patient` | Live audio blob upload + Web Speech |
| **Intake Complete**| `POST /api/intake/session/{id}/complete` | `completeSession()` | `/intake/[sessionId]` | Simulated `onDone` in `/patient` | Live API → triggers pre-triage |
| **Pre-Triage Review** | `GET /api/triage/pending` | `getPendingTriage()` | Unused | `ALL_CASES` in `/admin` | Live API query with `ALL_CASES` fallback |
| **Triage Decision**| `POST /api/triage/{id}/review`| `reviewTriage()` | Unused | `pushToast` in `/admin` | Live API post + audit log update |
| **Doctor Queue** | `GET /api/doctor/queue` | `getDoctorQueue()` | Unused | `ALL_CASES` in `/doctor` | Live API query with priority ordering |
| **Turn Call** | `POST /api/doctor/turn/{id}/call`| `callPatientTurn()` | Unused | Local state in `/doctor` | Live API post + patient tracker sync |
| **Consultation** | `POST /api/doctor/turn/{id}/consult`| `submitConsultation()`| Unused | Local state in `/doctor` | Live API post + record generation |
| **Patient Queue**| `GET /api/patient/queue-status` | `getPatientQueueStatus()`| `/dashboard` | Static cases in `/patient` | Live polling with animated ticket |

---

## 5. Existing Architecture Worth Preserving

1. **`src/lib/api.ts`**: The typed REST client. It correctly parses JWT tokens, handles `FormData` for audio uploads, formats query parameters, and surfaces API errors. It is completely preserved and extended with stricter domain types.
2. **The `--mk-*` CSS Architecture**: The token structure in `globals.css` (primary `#0B67F3`, navy `#0A1E3F`, dark canvas `#050B14`, surface elevations, priority badges `.mk-badge-p0` through `.mk-badge-p3`, responsive media queries) is architecturally superior to the legacy SCSS. It becomes the single canonical stylesheet.
3. **`src/components/shared.tsx`**:
   - `OpsShell`: Complete sidebar navigation, topbar branding, role switcher, emergency badge.
   - `PriorityBadge` & `StatusChip`: Exact color-coded clinical indicators.
   - `AITriageContext`: Legally safe, non-diagnostic AI summary (risk flags, confidence band, uncertainty, history).
   - `WhyAllocation`: Transparent, explainable allocation rationale based on department capacity and clinical urgency.
   - `EvidenceDrawer`: Side drawer detailing symptom duration, speech snippets, risk flags, and verification status.
   - `CaseTimeline`: Clean chronological audit trail.
   - `ConfirmDialog` & `ReasonInput`: Mandatory clinical justification modal for overrides.
4. **The P0 Emergency Flow Logic**: The code already isolates P0 cases from routine queues, initiates a response timer, prevents token generation, and triggers staff notifications. This is clinically correct and must not be altered.
5. **FastAPI Rewrites in `next.config.js`**: Seamless local proxying without CORS friction.

---

## 6. Architecture & Integration Problems to Eliminate

1. **Dual Patient Surfaces**: `/dashboard` and `/patient` exist independently. Users entering via `/` go to `/patient` (unwired mockup), while users logging in go to `/dashboard` (ugly form).  
   *Solution*: Consolidate into a unified patient portal where `/patient` is the kiosk mode and `/dashboard` is the authenticated patient record portal, both sharing the same UI engine.
2. **Missing Wire in Doctor & Admin**: `src/app/doctor/page.tsx` and `src/app/admin/page.tsx` never call `api.ts`.  
   *Solution*: Introduce standard `useEffect` hooks in both pages calling `getDoctorQueue()` and `getPendingTriage()`, falling back to `ALL_CASES` only if the backend returns an empty array or network error.
3. **Simulated OTP and Intake**: `/patient` simulates OTP verification with hardcoded timeouts and fills input with fake strings.  
   *Solution*: Replace simulated voice with real browser audio recording or Web Speech recognition that feeds the backend `/api/intake/voice` or `/api/intake/message`.
4. **Hardcoded Emojis in DOM**: Icons are rendered as raw Unicode emojis (`🚨`, `🩺`, `🏥`, `⚙️`, `📋`, `⏳`, `👩‍⚕️`). Emojis render inconsistently across macOS, Windows, iOS, and Android, and ruin the professional feel.  
   *Solution*: Replace with an inline, lightweight SVG icon system (Feather/Lucide style, 0 dependencies).

---

## 7. Design-System Problems & Consolidation

### Problems
- Two competing stylesheets: `src/styles/globals.scss` (legacy teal `--color-*`) vs `src/app/globals.css` (modern `--mk-*`).
- Inconsistent card borders: some cards have `border: 1px solid #E2E8F0`, others have `var(--mk-border)`, others have no border.
- Inconsistent fonts: `globals.scss` imports Inter (banned under elite design rules), while `globals.css` defines system sans-serif.
- Invisible text risks on badges: Some badge styles lack sufficient contrast between foreground and background.

### Canonical Token Consolidation (`--mk-*`)
We standardize 100% on the `--mk-*` token architecture, enhanced with *Soft Structuralism* tokens:

```css
:root {
  /* Brand Core — Precision Healthcare */
  --mk-primary: #0284C7;          /* Clinical Sky / Precision Blue */
  --mk-primary-hover: #0369A1;
  --mk-primary-soft: #F0F9FF;
  --mk-primary-border: #BAE6FD;
  
  --mk-navy: #0F172A;             /* Slate 900 — Deep Clinical Navy */
  --mk-canvas: #F8FAFC;           /* Clean Clinical Background */
  --mk-surface: #FFFFFF;          /* Pure White Card Base */
  --mk-surface-subtle: #F1F5F9;   /* Off-white secondary */
  
  /* Priority Bands (Strict Contrast) */
  --mk-p0: #DC2626;               /* Critical Red */
  --mk-p0-soft: #FEF2F2;
  --mk-p0-border: #FECACA;
  
  --mk-p1: #EA580C;               /* Urgent Amber/Orange */
  --mk-p1-soft: #FFF7ED;
  --mk-p1-border: #FED7AA;
  
  --mk-p2: #0284C7;               /* Standard Blue */
  --mk-p2-soft: #F0F9FF;
  --mk-p2-border: #BAE6FD;
  
  --mk-p3: #16A34A;               /* Routine Green */
  --mk-p3-soft: #F0FDF4;
  --mk-p3-border: #BBF7D0;
  
  /* System State Tokens */
  --mk-success: #16A34A;
  --mk-warning: #D97706;
  --mk-danger: #DC2626;
  --mk-info: #0284C7;
  
  /* Machined Double-Bezel Radii & Shadows */
  --mk-radius-sm: 6px;
  --mk-radius-md: 10px;
  --mk-radius-lg: 16px;
  --mk-radius-xl: 24px;
  --mk-radius-full: 9999px;
  
  --mk-shadow-ambient: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02);
  --mk-shadow-elevated: 0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
  --mk-shadow-overlay: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.08);
  
  /* Precision Cubic-Bezier Physics */
  --mk-ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --mk-ease-out: cubic-bezier(0.32, 0.72, 0, 1);
}
```

---

## 8. UX Problems & Resolutions

| # | Existing UX Flaw | Clinical Risk | Elite Resolution |
| :--- | :--- | :--- | :--- |
| 1 | Diagnostic wording in AI outputs ("Possible STEMI", "Rule out meningitis") | Legal/regulatory violation; AI impersonating clinician | Replace with strictly non-diagnostic signals: *"Critical cardiac indicators detected"*, *"Neurological risk flags require immediate assessment"*. |
| 2 | Emojis in production UI (`🚨`, `🩺`, `🏥`) | Looks amateurish and trivializes emergency medicine | Replace with bespoke monochrome/duotone SVG icons with 1.5px stroke width. |
| 3 | Prototype controls in production DOM (`Demo: Mic denied`, `Demo: Outcome P0`) | Breaks immersion and signals unfinished software to judges | Move all deterministic demo drivers to a subtle, hidden key-combo or collapsed dev drawer (`Alt+Shift+D`). |
| 4 | P1 "Waiting for Admin Approval" banner | Patients feel blocked by bureaucracy during urgent illness | Frame as *"Clinical team assigned & coordinating urgent handoff"*. |
| 5 | Role Selector feels like a raw debug menu | Weak first impression for hackathon judges | Transform into a modern hospital ingress portal with micro-interactions, trust badges, and role clarity. |
| 6 | Doctor queue lacks scannable priority weighting | Doctor cannot triage at a glance under cognitive load | Implement high-contrast priority edge strips, sticky P0 alert bar, and SLA countdowns. |

---

## 9. Six Demo-Critical Surface Analysis

### Surface 1: Role Selection Gateway (`/`)
- **First Impression Value**: 10/10. This is what judges see first.
- **Current State**: Plain centered box with 3 basic text cards and emojis.
- **Target Experience**: An awe-inspiring clinical workstation entry portal.
  - Asymmetric, spacious header with trust accreditation tags ("ISO 27799 Clinical Safety Compliant", "HIPAA Ready Architecture").
  - Three distinct, machined double-bezel cards (Patient Kiosk, Doctor Clinical Suite, Hospital Ops Command).
  - Ambient glassmorphism, subtle micro-motion on hover (magnetic lift with trailing circular arrow action).
  - Quick-start demo indicator allowing instant role switching.

### Surface 2: Patient Intake Kiosk (`/patient` & `/intake/[sessionId]`)
- **First Impression Value**: 10/10. The core patient AI interaction.
- **Current State**: Split between a functional but plain chat bubble page and a rich but unwired kiosk stepper.
- **Target Experience**:
  - Unified kiosk container with large arm's-length touch targets (min 56px height).
  - Clear 6-step progress indicator with concentric squircle status dots.
  - Text-first primary intake: Clean clinical prompt with multi-line smart input and category chips.
  - Voice integration: Elegant waveform/pulsing ring audio visualizer with live transcript preview and explicit confirmation step before AI submission.
  - Real-time conversational updates showing AI understanding without chat-slop styling.

### Surface 3: P1 / P2 Outcome Presentations
- **First Impression Value**: 9/10. Proves intelligent routing.
- **Current State**: P1 looks like a bureaucratic hold up; P2 is a plain queue ticket.
- **Target Experience**:
  - **P1 (Urgent Handoff)**: High-urgency amber banner; displays assigned clinical unit, immediate reception reporting instructions, and a live "Clinician Notified" active pulse.
  - **P2 (Standard Queue)**: High-trust digital token display with large typography, estimated wait time, live queue position, and educational prep steps ("What to prepare for your doctor").

### Surface 4: Doctor Queue & Case Detail (`/doctor`)
- **First Impression Value**: 10/10. Proves clinical operational value.
- **Current State**: 7-column table driven by fixtures; good layout but static.
- **Target Experience**:
  - High-density, professional queue with live badge counts and priority filtering tabs.
  - Double-click or single-click drawer transition into Case Detail.
  - **AITriageContext Card**: Suggested priority, confidence score gauge, risk flags (highlighted in red pill containers), symptom timeline.
  - **Evidence Drawer**: Instant slide-out showing exact patient words, audio playback capability, duration, and safety checks.
  - **Tabbed Consultation Suite**: Fast entry for clinical notes, objective vitals, ICD-10/differential diagnosis, e-Prescription item table, and digital sign-off.

### Surface 5: P0 Emergency Handover (`/doctor` & `/admin` & `/patient`)
- **First Impression Value**: 10/10. The highest-stakes demo moment.
- **Current State**: Red box with text, but needs visual drama and clear protocol flow.
- **Target Experience**:
  - **Patient View**: Screen immediately transitions into calm, authoritative emergency protocol. Audio prompt: *"Please remain where you are. Hospital personnel have been dispatched."* Persistent flashing emergency banner, response timer, zero queue token.
  - **Admin & Doctor Views**: Flashing emergency strip pinned to top of OpsShell. Immediate sound/pulse notification. Shows patient location ("Kiosk 03, Ground Floor"), chief complaints, safety red flags. One-click "Acknowledge Handover" logs timestamp and notifies staff.

### Surface 6: Super Admin Command Center (`/admin`)
- **First Impression Value**: 9/10. Demonstrates enterprise hospital governance.
- **Current State**: Rich 10-tab structure, but purely static mock data.
- **Target Experience**:
  - Top KPI grid with live counts: Active P0, Pending Reviews, Average Triage Latency, Departmental Doctor Utilization.
  - Review Queue with side-by-side Case Review.
  - "Why this allocation?" transparent AI reasoning card detailing why the case was assigned to General Medicine vs Urgent Care.
  - Override Modal with mandatory clinical justification input and immediate audit event generation.
  - Live AI Monitoring tab with token usage, confidence distribution chart, and safety flag breakdown.

---

## 10. Elite Design Direction (Soft Structuralism)

Following `/high-end-visual-design`, `/design-taste-frontend`, and `/gpt-taste`:

### 1. Aesthetic Archetype: Soft Structuralism
- Medical interfaces require utmost cleanliness, high contrast, and absolute visual calm. We reject dark futuristic hacker themes for patient and doctor surfaces, adopting a **Soft Structuralism** aesthetic:
  - Backgrounds: Pristine hospital canvas (`#F8FAFC` and `#FFFFFF`).
  - Architecture: Machined **Double-Bezel** (Doppelrand) containers. Outer container has subtle border ring (`#E2E8F0`), 16px padding, and 24px radius; inner container holds content with pure white background, subtle inner highlight, and 16px radius.
  - Typography: Strict hierarchy using system geometric sans (falling back to `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`). Zero font-download delays.
  - Spacing: Macro-whitespace (`py-12`, `px-8`). Density where clinicians need it, breathing room where patients need it.

### 2. Motion Choreography
- Zero instant state pops. All transitions use custom cubic-beziers (`cubic-bezier(0.16, 1, 0.3, 1)`).
- Modals scale from `0.97` to `1.0` with 200ms spring physics.
- Evidence drawer slides in from the right over 280ms with subtle backdrop blur.
- P0 emergency pulse: Soft red glow ring animating between `box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4)` and `0 0 0 12px rgba(220, 38, 38, 0)`.

### 3. Iconography
- Strict ban on emojis.
- Introduce `src/components/icons.tsx` providing clean, lightweight SVG icons:
  - `IconHospital`, `IconStethoscope`, `IconShieldAlert`, `IconSettings`, `IconUser`, `IconClock`, `IconActivity`, `IconFileText`, `IconCheckCircle`, `IconAlertTriangle`, `IconArrowRight`, `IconMic`, `IconSend`.

---

## 11. Component Strategy

Refactor monolithic 900-line page files into modular, reusable components under `src/components/`:

```text
frontend/src/
├── components/
│   ├── icons.tsx              # Clean SVG icons (zero dependencies)
│   ├── shared.tsx             # Canonical UI primitives (PriorityBadge, StatusChip, OpsShell, etc.)
│   ├── kiosk/
│   │   ├── KioskShell.tsx     # Kiosk container, stepper header, footer disclaimer
│   │   ├── WelcomeStep.tsx    # Language & welcome
│   │   ├── ConsentStep.tsx    # Digital consent with clear terms
│   │   ├── IdentityStep.tsx   # Phone/ABHA input & verification
│   │   ├── IntakeStep.tsx     # Conversational text + voice input
│   │   ├── ProcessingStep.tsx # Animated clinical assessment state
│   │   └── OutcomeViews.tsx   # P0, P1, P2, P3 distinct outcome layouts
│   ├── doctor/
│   │   ├── DoctorQueueTable.tsx # High-density sortable queue
│   │   ├── CaseDetailView.tsx # Patient info + AI triage context
│   │   ├── ConsultationSuite.tsx # Notes, vitals, prescriptions, completion
│   │   └── P0HandoverPanel.tsx# Emergency acknowledgement banner & modal
│   └── admin/
│       ├── AdminKpiGrid.tsx   # Top-level operational metrics
│       ├── ReviewQueueTable.tsx# Pending triage list
│       ├── TriageReviewModal.tsx# Approve, override, or clarify with reason
│       └── AIMonitorPanel.tsx # Confidence & safety monitoring
```

---

## 12. API Integration Strategy (Hybrid-Resilient)

To guarantee 100% demo uptime while delivering real backend integration, we implement the **Hybrid-Resilient Data Layer**:

```text
                     ┌───────────────────────────┐
                     │   Component / Hook Call   │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │   Try Live API via api.ts │
                     └─────────────┬─────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
          HTTP 200 OK (Data present)    Network Error / 5xx / Empty
                    │                             │
                    ▼                             ▼
       ┌───────────────────────────┐ ┌───────────────────────────┐
       │ Render Live Backend State │ │ Fallback to Rich Fixtures │
       │ (FastAPI + Supabase data) │ │ (fixtures.ts deterministic│
       └───────────────────────────┘ └───────────────────────────┘
```

### Exact Implementation Pattern in Doctor Page
```typescript
const [queue, setQueue] = useState<QueueItem[]>([]);
const [loading, setLoading] = useState(true);
const [isLiveApi, setIsLiveApi] = useState(false);

useEffect(() => {
  async function fetchQueue() {
    try {
      const data = await getDoctorQueue();
      if (data && data.length > 0) {
        setQueue(data);
        setIsLiveApi(true);
      } else {
        // Fallback to rich demo fixtures if database is unseeded
        setQueue(mapFixturesToQueue(ALL_CASES));
      }
    } catch (err) {
      console.warn("API offline, utilizing resilient clinical fixtures", err);
      setQueue(mapFixturesToQueue(ALL_CASES));
    } finally {
      setLoading(false);
    }
  }
  fetchQueue();
}, []);
```

This ensures:
- If Harry's FastAPI backend is running: judges see real HTTP traffic and live state updates.
- If the backend is stopped or network drops: the UI gracefully continues to operate without breaking or throwing runtime errors.

---

## 13. State, Loading & Error Strategy

Every asynchronous surface must implement 5 explicit states:
1. **Initial Loading**: Machined double-bezel skeleton card (`SkeletonCard` in `shared.tsx`), never a blank screen or raw spinner.
2. **Empty State**: Cohesive clinical illustration with actionable trigger (`EmptyState` in `shared.tsx`).
3. **Error State**: Non-blocking alert banner with explicit "Retry Operation" button.
4. **Offline Mode**: Amber indicator pill in top bar ("Working Offline — Local State Synchronized").
5. **Session Expiry**: Clean inline re-authentication modal that preserves current form state without hard-redirecting and losing user inputs.

---

## 14. Responsive Strategy

1. **Patient Kiosk Layout** (`/patient`):
   - Optimized for large touchscreens (1080p kiosk screens) down to mobile phones (375px).
   - Container fixed at `max-width: 680px`, centered with `min-height: 100dvh`.
   - Minimum tap target size: 48px × 48px; primary actions 56px height.
2. **Doctor & Admin Workspaces** (`/doctor`, `/admin`):
   - Desktop/Laptop: 240px fixed sidebar, 100% fluid main area with 2-column or 3-column asymmetric layout.
   - Tablet (768px – 1024px): Collapsible sidebar with icon-only drawer; tables enable horizontal scroll with sticky headers.
   - Mobile (< 768px): Topbar mobile menu hamburger with full-screen slideout; tables hide non-essential columns (showing Case ID, Patient, Priority, and Action).

---

## 15. Accessibility Strategy (WCAG 2.1 AA)

- **Color Contrast**: All text and badge elements verified for ≥ 4.5:1 contrast against their backgrounds. Priority badges use dark text on pastel backgrounds or white text on deep saturated backgrounds (e.g., `#DC2626` with `#FFFFFF` text = 4.6:1 contrast).
- **Keyboard Navigation**: Full `tabIndex` focus ring discipline (`focus-visible: ring-2 ring-primary ring-offset-2`).
- **Screen Reader Tags**: All SVGs marked with `aria-hidden="true"` or descriptive `<title>`. Live regions (`aria-live="polite"`) on the intake transcript and response timer.
- **Reduced Motion**: Respect `prefers-reduced-motion: reduce` by setting animation durations to 0.01ms (already present in `globals.css`).

---

## 16. Implementation Roadmap (P0 / P1 / P2)

### P0 — Must Complete for Hackathon Demo (Critical Path)
- [ ] **P0.1: Clean SVG Icon System**: Create `src/components/icons.tsx` and replace all raw Unicode emojis across the application.
- [ ] **P0.2: Role Selection Overhaul**: Rebuild `src/app/page.tsx` as a world-class clinical portal with Soft Structuralism aesthetics.
- [ ] **P0.3: Wire Doctor Workspace to Real API**: Connect `src/app/doctor/page.tsx` to `getDoctorQueue()`, `callPatientTurn()`, and `submitConsultation()`, with fallback to `ALL_CASES`.
- [ ] **P0.4: Wire Admin Console to Real API**: Connect `src/app/admin/page.tsx` to `getPendingTriage()` and `reviewTriage()`, with fallback to `ALL_CASES`.
- [ ] **P0.5: Polish Patient Kiosk Intake**: Connect `/patient` to real `createSession` and `sendMessage` while preserving arm's-length kiosk UI.
- [ ] **P0.6: P0 Emergency Presentation**: Ensure the P0 emergency state is visually dramatic, distinct, non-diagnostic, and automatically triggered.
- [ ] **P0.7: Eliminate Demo Artifacts**: Hide or relocate all `Demo:` links and outcome buttons into a developer-only shortcut (`Alt+Shift+D`).

### P1 — Strongly Recommended
- [ ] **P1.1: Single Stylesheet Unification**: Deprecate `styles/globals.scss` and migrate all legacy routes (`/login`, `/dashboard`) to `--mk-*` classes.
- [ ] **P1.2: PWA Assets**: Generate and place `public/favicon.ico`, `public/icon-192.png`, and `public/icon-512.png`.
- [ ] **P1.3: Real Audio Visualizer**: Add a lightweight CSS/Canvas audio frequency pulse for active voice recording.
- [ ] **P1.4: Realtime Queue Polling**: Add a 5-second interval poll for the doctor queue and patient queue status.

### P2 — Nice to Have
- [ ] **P2.1: GSAP Micro-Interactions**: Add subtle spring entrance transitions for cards and tab switches.
- [ ] **P2.2: Export to PDF**: Add a "Print Clinical Summary" button on the completed consultation screen.

---

## 17. File-by-File Change Plan

| File Path | Nature of Change | Preservation Scope | Refactoring / Additions Scope |
| :--- | :--- | :--- | :--- |
| `src/components/icons.tsx` | **[NEW]** | None | Implement clean SVG icons (`IconHospital`, `IconStethoscope`, `IconShieldAlert`, etc.) |
| `src/app/page.tsx` | **[MODIFY]** | Keep role links (`/patient`, `/doctor`, `/admin`) | Rebuild with Soft Structuralism, double-bezel cards, zero emojis, trust badges |
| `src/components/shared.tsx` | **[MODIFY]** | Keep `OpsShell`, `PriorityBadge`, `EvidenceDrawer`, `WhyAllocation` | Replace emoji icons with `icons.tsx`; refine card shadows and borders |
| `src/app/doctor/page.tsx` | **[MODIFY]** | Keep consultation tabs, evidence drawer, case detail | Wire `getDoctorQueue`, `callPatientTurn`, `submitConsultation`; replace emojis |
| `src/app/admin/page.tsx` | **[MODIFY]** | Keep 10-tab structure, P0 strip, allocation modal | Wire `getPendingTriage`, `reviewTriage`; replace emojis; remove demo tags |
| `src/app/patient/page.tsx` | **[MODIFY]** | Keep kiosk stepper, consent, outcomes, timelines | Wire to `createSession`, `sendMessage`; remove visible `Demo:` switcher buttons |
| `src/lib/api.ts` | **[MODIFY]** | Keep all existing functions and endpoints | Enhance TypeScript types, add normalized error helper |
| `src/app/globals.css` | **[MODIFY]** | Keep all `.mk-*` classes and media queries | Add Soft Structuralism variables, double-bezel utilities, button-in-button classes |
| `src/styles/globals.scss` | **[MODIFY]** | Keep fallback rules for legacy routes | Map legacy variables to canonical `--mk-*` tokens to avoid style drift |
| `public/favicon.ico` | **[NEW]** | None | Add official MediKiosk favicon |
| `public/icon-192.png` | **[NEW]** | None | Add official MediKiosk PWA icon |

---

## 18. Dependencies on Harry's Backend Work

The frontend implementation is designed to **proceed completely unblocked**, regardless of backend state:
1. **API Endpoints Already Exist in Backend**: Harry's commit `2586550` already implemented all routers in `backend/app/routers/`. The endpoints exist and are active.
2. **Graceful Fallback**: If Harry is modifying backend schemas, our hybrid layer catches errors and displays `fixtures.ts` data seamlessly.
3. **Seed Data Synchronization**: For a live demo, running `python backend/seed_demo_assessments.py` populates the live PostgreSQL/Supabase database so that `/api/triage/pending` and `/api/doctor/queue` return live items immediately.

---

## 19. Parallelizable Work & Critical Path

```text
[Phase 1: Foundations] ──────────────┐
  ├── Create src/components/icons.tsx │
  └── Refine src/app/globals.css      │
                                       ▼
[Phase 2: Surface Elevation] ────────► [Phase 3: Integration Wiring]
  ├── Role Selection (page.tsx)        ├── Doctor Page (getDoctorQueue)
  ├── Patient Kiosk (patient/page.tsx) ├── Admin Page (getPendingTriage)
  └── OpsShell Refinement              └── Patient Kiosk (createSession)
                                       │
                                       ▼
                               [Phase 4: Quality & Verification]
                                 ├── TypeScript & ESLint Sweep
                                 ├── Production Build Verification
                                 └── Live Browser Verification
```

---

## 20. Definition of Done

The frontend elevation is complete when:
1. All 6 demo-critical surfaces have been visually elevated to Soft Structuralism standards.
2. No emojis exist in production UI (replaced with clean SVG icons).
3. No visible `Demo:` buttons or prototype artifacts appear in the default user flows.
4. Doctor workspace displays live queue data when backend is available, with graceful fixture fallback.
5. Admin console approves and overrides triage cases via real API calls.
6. P0 emergency flow triggers immediately, non-diagnostically, without admin approval prerequisite.
7. AI triage context remains strictly non-diagnostic and emphasizes clinician decision-making.
8. `npx tsc --noEmit` passes with 0 errors.
9. `npm run lint` passes with 0 warnings/errors.
10. `npm run build` generates all routes cleanly.

---

## 21. Final Hackathon Demo Checklist

- [ ] **Pitch Opening**: Load `http://localhost:3000/`. Show the elevated Role Selection portal. Highlight clinical safety and governance tags.
- [ ] **Flow 1 (Patient Intake & AI Pre-Triage)**: Click "Patient Kiosk". Select Language → Review Consent → Enter Identity → Enter symptoms ("Chest discomfort, pressure radiating to left arm"). Submit.
- [ ] **Flow 2 (P0 Emergency Escalation)**: Show immediate P0 emergency screen on patient kiosk. Response timer ticking. Emphasize: *No queue token generated, no admin approval needed, immediate hospital dispatch.*
- [ ] **Flow 3 (Super Admin Operations)**: Switch to "Super Admin". Show persistent P0 red alert bar. Acknowledge P0. Switch to Review Queue. Inspect P1 case. Show "Why this allocation?" transparent AI reasoning. Execute an Override with mandatory reason.
- [ ] **Flow 4 (Doctor Consultation Suite)**: Switch to "Doctor Workspace". View prioritized queue. Select P1 patient. Open Evidence Drawer showing exact patient transcript. Start consultation → enter clinical notes & vitals → sign e-prescription → complete. Show record published.

---

## 22. DO NOT BREAK (Core Invariants)

The following behaviors and files must be strictly preserved during all implementation steps:
1. **DO NOT BREAK P0 AUTO-ESCALATION**: P0 cases must NEVER require Super Admin approval before dispatching alerts. Emergency protocol must activate automatically.
2. **DO NOT BREAK API PROXIES**: Keep the `rewrites` in `next.config.js` proxying `/api/*` to FastAPI.
3. **DO NOT BREAK DOCTOR CONSULTATION FLOW**: The doctor must always be able to enter notes, diagnose, write prescriptions, and complete the visit.
4. **DO NOT INTRODUCE DIAGNOSTIC AI CLAIMS**: AI must never state "Diagnosed: STEMI". Always format as "Critical cardiac indicators detected; urgent clinician evaluation required."
5. **DO NOT BREAK DEMO RELIABILITY**: Never allow an API network failure to render a white screen or throw an unhandled exception; always fallback gracefully to deterministic fixtures.
6. **DO NOT INTRODUCE BULKY RUNTIME LIBRARIES**: Do not install heavy icon libraries or UI kits that destabilize `package.json` or increase bundle size. Use native CSS and inline SVG icons.
