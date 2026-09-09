# MediKiosk Frontend Audit

**Audit date:** 2026-09-09\
**Scope:** Supplied `frontend.zip`, supplied Frontend Handoff ZIP,
supplied backend/API documentation, and supplied UI/UX freeze audit.

------------------------------------------------------------------------

## 1. Executive Verdict

The frontend is **not one coherent integrated application yet**. It is
currently a combination of:

1.  a genuinely API-connected patient/auth/intake shell,
2.  a large fixture-driven Patient experience,
3.  fixture-driven Doctor and Super Admin operational consoles,
4.  a second live API-driven intake route,
5.  an older/simple visual system still present alongside the newer
    `mk-*` design system.

This explains exactly why it can feel "functional" while still feeling
like an AI-generated slog rather than an elite hackathon product.

### The biggest issue is not only visual

There are **two competing frontend architectures**:

``` text
LIVE PATH
/login → /consent → /dashboard → /intake/[sessionId]
                         ↓
                    real /api calls

SHOWCASE PATH
/ → role selector
    ├── /patient  → fixture/local state
    ├── /doctor   → fixture/local state
    └── /admin    → fixture/local state
```

The showcase path looks richer, but it is not connected to the real
backend. The live path is connected, but visually and functionally much
simpler.

**This must be fixed before the final UI polish.**

------------------------------------------------------------------------

## 2. Repository Snapshot

### Routes found

``` text
/
 /login
 /register
 /consent
 /dashboard
 /documents
 /profile
 /intake/[sessionId]

/patient
/doctor
/admin
```

### Main frontend files

``` text
src/app/
  admin/page.tsx          ~925 lines
  patient/page.tsx        ~925 lines
  doctor/page.tsx         ~536 lines
  dashboard/page.tsx      ~394 lines
  intake/[sessionId]/page.tsx ~406 lines
  profile/page.tsx
  documents/page.tsx
  consent/page.tsx
  login/page.tsx
  register/page.tsx

src/lib/
  api.ts
  fixtures.ts
  supabase.ts

src/components/
  shared.tsx

src/types/
  index.ts

src/styles/
  globals.scss
src/app/
  globals.css
```

------------------------------------------------------------------------

## 3. Integration Status --- Exact Picture

  ----------------------------------------------------------------------------------
  Surface                       Real API usage  Fixture/local state Status
  ----------------------- -------------------- -------------------- ----------------
  Login                                    Yes                   No Integrated shell

  Register                                 Yes                   No Integrated shell

  Consent                                  Yes                   No Integrated

  Profile                                  Yes                   No Integrated

  Documents                                Yes                   No Integrated

  Patient Dashboard                        Yes                   No **Live API,
                                                                    basic UI**

  Conversational Intake                    Yes                   No **Real API +
  `/intake/[sessionId]`                                             real voice
                                                                    path**

  Patient `/patient`                        No                  Yes **Fixture/demo
  showcase                                                          only**

  Doctor `/doctor`                          No                  Yes **Fixture/demo
                                                                    only**

  Super Admin `/admin`                      No                  Yes **Fixture/demo
                                                                    only**
  ----------------------------------------------------------------------------------

### Evidence

-   `src/lib/api.ts` contains the actual typed API client.
-   `dashboard/page.tsx` calls `listSessions`, `createSession`, and
    `getPatientQueueStatus`.
-   `intake/[sessionId]/page.tsx` calls `sendMessage`, `sendVoice`,
    `getSession`, and `completeSession`.
-   `patient/page.tsx` imports `CASES` from `@/lib/fixtures`.
-   `doctor/page.tsx` imports `CASES` and `ALL_CASES`.
-   `admin/page.tsx` imports `CASES` and `ALL_CASES`.

Therefore:

> Doctor and Admin are currently presentation-grade prototypes, not
> backend-integrated operational consoles.

------------------------------------------------------------------------

## 4. The Two Patient Experiences

This is the most important frontend architectural problem.

### Live patient experience

`/dashboard` + `/intake/[sessionId]`

Strengths:

-   real auth token handling
-   real session creation
-   real text messages
-   real voice upload
-   real Sarvam-backed voice contract through the backend
-   real session retrieval
-   real completion endpoint
-   real queue-status polling

Weaknesses:

-   visually basic
-   narrow 720px dashboard
-   plain forms/cards
-   weak state hierarchy
-   not the polished kiosk experience defined by the handoff
-   does not visually implement the complete P0/P1/P2/P3 experience

### Showcase patient experience

`/patient`

Strengths:

-   much richer visual storytelling
-   welcome/language/consent/identity/OTP
-   voice interaction states
-   P0/P1/P2/P3 outcome screens
-   post-consultation dashboard
-   records/follow-up/profile surfaces

Weaknesses:

-   entirely local state/fixtures
-   OTP is simulated
-   voice interaction is simulated
-   demo shortcuts are visible
-   outcomes are manually switched
-   it does not consume the real session/case/triage APIs

### Correct final architecture

Do NOT keep both as independent products.

Convert:

``` text
/patient
```

into the polished UI shell, but connect it to:

``` text
/api/auth/*
/api/patient/*
/api/intake/*
/api/triage/*
/api/doctor/*
```

using the typed client.

------------------------------------------------------------------------

## 5. Doctor Console Audit

### Current status

`src/app/doctor/page.tsx` is fixture-only.

It imports:

``` text
CASES
ALL_CASES
CaseFixture
```

It does not call:

``` text
getDoctorQueue()
callPatientTurn()
startConsultation()
submitConsultation()
```

even though those functions already exist in `src/lib/api.ts`.

This is a major missed integration opportunity.

### What already exists in the API client

The frontend has typed methods for:

-   doctor queue
-   call turn
-   start consultation
-   submit consultation
-   patient queue status

So the integration spine is partly prepared.

### Required final Doctor flow

``` text
GET /api/doctor/queue
       ↓
Queue
       ↓
Case detail
       ↓
Evidence & Source Records
       ↓
Start consultation
       ↓
Clinical notes / vitals / examination
       ↓
Doctor diagnosis + treatment plan
       ↓
Prescription
       ↓
Complete/sign
       ↓
Patient record published
```

### Visual correction

The supplied UI/UX freeze explicitly prohibits an AI
diagnosis/differential presentation.

Do NOT retain:

``` text
AI Differential
Diagnosis probability %
AI final diagnosis
```

Use:

``` text
AI Triage Context
- Suggested priority
- Confidence band
- Risk/safety flags
- Patient-confirmed evidence
- Uncertainty
- Model/version
- Non-diagnostic disclaimer
```

------------------------------------------------------------------------

## 6. Super Admin Console Audit

### Current status

`src/app/admin/page.tsx` is fixture-driven.

The page is rich enough to be the basis for the final console:

-   overview
-   P0 management
-   review queue
-   case review
-   staff/roles
-   analytics
-   AI monitor
-   audit log
-   configuration
-   system status

But the data is hard-coded/local.

### Important existing strength

The current Admin UI already includes the correct conceptual P0 wording:

> P0 is automatic --- does not require admin approval before dispatch.

That matches the newer frozen contract.

### Critical missing integration

These actions need real backend calls:

-   approve
-   override
-   request clarification
-   reject
-   P0 acknowledgement/coordination
-   queue assignment
-   staff changes
-   audit retrieval
-   system status

The API client currently only exposes the triage review operation;
Admin's richer surfaces therefore need additional backend endpoints or
must be deliberately scoped down for MVP.

------------------------------------------------------------------------

## 7. Patient UI Audit

### What is good

The fixture-driven patient experience has the strongest product
storytelling in the repository:

-   clear kiosk framing
-   progressive steps
-   voice states
-   P0 emergency branch
-   separate priority outcomes
-   post-consultation continuity
-   privacy/profile surfaces

This is the right design direction.

### What must change

The `/patient` experience currently has explicit demo mechanics:

-   `Demo: Mic denied`
-   `Demo: No speech`
-   `Demo: Network error`
-   demo outcome switcher
-   `Demo: Post-consultation dashboard`
-   simulated OTP behavior
-   simulated voice transcript filling

Those controls are useful during prototyping but **must not ship in the
final presentation flow**.

Replace them with:

-   real API state
-   hidden developer fixture mode if needed
-   controlled seed-data environment
-   query-param/internal dev switch only if absolutely necessary

------------------------------------------------------------------------

## 8. API Client Audit

`src/lib/api.ts` is one of the most valuable existing pieces.

It already centralizes:

### Auth

``` text
register
login
getMe
setToken
clearToken
```

### Patient

``` text
getProfile
updateProfile
recordConsent
listSessions
uploadDocument
listDocuments
```

### Intake

``` text
createSession
sendMessage
sendVoice
getSession
completeSession
```

### Triage

``` text
getPendingTriage
triggerPreTriage
reviewTriage
```

### Doctor

``` text
getDoctorQueue
callPatientTurn
startConsultation
submitConsultation
```

### Patient live tracker

``` text
getPatientQueueStatus
```

This means the project does **not** need another ad-hoc fetch layer.

### Required improvement

Replace generic types such as:

``` text
Record<string, unknown>
Record<string, any>
```

with shared domain types wherever practical.

Also normalize API errors into a structured error type so UI can
distinguish:

``` text
401 session expired
403 permission denied
409 invalid state transition
422 validation
429 rate limit
5xx backend failure
network/offline
```

------------------------------------------------------------------------

## 9. Authentication Audit

### Current behavior

`src/lib/api.ts` stores:

``` text
medikiosk_token
```

in `localStorage`.

The documented technical debt already identifies this as an XSS risk.

### More important demo problem

The root page `/` lets the user select:

``` text
Patient
Doctor
Super Admin
```

and directly navigate to:

``` text
/patient
/doctor
/admin
```

There is no visible authentication gate on those showcase routes.

For a hackathon demo this is convenient, but it makes the application
look like three disconnected mockups.

### Final behavior

Use:

``` text
/login
   ↓
authenticated role
   ↓
role-specific shell
```

and enforce the role on the backend.

Frontend protection is UX; backend RBAC is security.

------------------------------------------------------------------------

## 10. UI System Audit

There are two visual token systems:

### New system

`globals.css` contains:

``` text
--mk-*
```

tokens and the richer clinical-suite styling.

### Older system

`styles/globals.scss` contains:

``` text
--color-*
```

tokens.

This creates visual drift.

### Required cleanup

Choose one design system.

Recommended:

``` text
--mk-* = canonical
```

Then migrate/remove the old `--color-*` system.

This will make the final redesign much easier and prevent components
from looking like they came from different generators.

------------------------------------------------------------------------

## 11. Missing / Broken PWA Assets

`manifest.json` references:

``` text
/icon-192.png
/icon-512.png
```

but the supplied `public/` directory contains only:

``` text
manifest.json
```

Also `layout.tsx` references:

``` text
/favicon.ico
```

but `public/favicon.ico` is absent in the supplied tree.

### Impact

The intended PWA/install experience is incomplete and the browser tab
favicon will not work from the supplied repository snapshot.

### Fix

Add:

``` text
public/favicon.ico
public/icon-192.png
public/icon-512.png
```

using the final MediKiosk logo.

------------------------------------------------------------------------

## 12. Build / Static Verification

### TypeScript

`npx tsc --noEmit` passed on the supplied frontend.

### ESLint

`npm run lint` passed with no warnings/errors.

### Production build

`npm run build` could not complete because the environment attempted to
download the Next.js SWC binary from npm and DNS/network access failed:

``` text
getaddrinfo EAI_AGAIN registry.npmjs.org
```

Therefore:

-   TypeScript: **PASS**
-   ESLint: **PASS**
-   Production build: **NOT VERIFIED**, blocked by environment/network
    dependency

Do not call this a code failure; it is an environment verification
failure.

------------------------------------------------------------------------

## 13. Frontend Contract Mismatches

The frontend currently calls `/api/...`, while the frozen Phase-0
contract document describes `/api/v1/...`.

Examples:

``` text
frontend/src/lib/api.ts
/api/auth/login
/api/intake/session
/api/intake/message
/api/intake/voice
/api/triage/pending
/api/doctor/queue
```

versus:

``` text
docs/08-integration-contracts.md
/api/v1/intake/submit
/api/v1/review/{intake_id}/decide
/api/v1/doctor/queue
/api/v1/consultation/{consultation_id}/complete
```

This must be resolved jointly with Harry before the final integration
pass.

------------------------------------------------------------------------

## 14. Priority / State UX Audit

The newer frontend handoff says:

``` text
P0 Critical / Immediate Escalation
P1 High Priority / Urgent Handoff
P2 Moderate / Standard Queue
P3 Routine / Fast Track
```

The current shared component map agrees:

``` text
P0 Critical
P1 High Priority
P2 Moderate
P3 Routine / Fast Track
```

The fixture data also has four separate cases.

That part is much better than the older storyboard.

### Required behavior

The UI must not only change badge color. Each priority must produce a
different state:

``` text
P0 → Emergency escalation
P1 → Urgent clinical handoff
P2 → Standard queue/appointment
P3 → Fast-track
```

The current live dashboard does not yet implement these complete
outcome-specific states.

------------------------------------------------------------------------

## 15. Elite UI Rebuild Plan

Do not spend time polishing the current simple `/dashboard` first.

### Step 1 --- Design system

Create:

-   typography scale
-   spacing scale
-   card primitives
-   buttons
-   badges
-   status chips
-   skeletons
-   alert banners
-   modal/drawer
-   tabs
-   data table
-   timeline
-   evidence drawer
-   priority components

### Step 2 --- Shared case model

Every role must consume the same:

``` text
caseId
patientRef
priority
status
submittedAt
triage
evidence
allocation
timeline
```

### Step 3 --- Patient

Build the polished kiosk as the main patient experience.

Required:

-   welcome
-   language
-   consent
-   identity/OTP
-   intake
-   voice/text fallback
-   transcript confirmation
-   review
-   processing
-   P0
-   P1
-   P2
-   P3
-   queue tracker
-   consultation status
-   post-consultation record
-   prescription
-   reports
-   follow-up

### Step 4 --- Doctor

Build:

1.  Login
2.  Queue
3.  Case detail
4.  Evidence drawer
5.  Active consultation
6.  Diagnosis/treatment
7.  Prescription
8.  Complete/sign
9.  Published record
10. exception states

### Step 5 --- Admin

Build:

1.  Overview
2.  P0 emergency lane
3.  Review queue
4.  Case review
5.  `Why this allocation?`
6.  Override/reassignment
7.  Doctor/capacity
8.  Staff/roles
9.  AI monitoring
10. Audit
11. Configuration
12. System status

------------------------------------------------------------------------

## 16. UI States That Must Be First-Class

Do not implement only the happy path.

### Global

-   loading
-   skeleton
-   empty
-   offline
-   retry
-   permission denied
-   session expired
-   server error
-   success
-   confirmation
-   restricted/PII masked

### Voice

``` text
idle
permission denied
listening
transcribing
confirm/edit transcript
processing
speaking
no speech
unclear speech
network error
text fallback
```

### Review

``` text
awaiting review
needs clarification
approved
overridden
rejected
P0 escalated
```

### Queue

``` text
queued
called
in consultation
completed
no-show/skipped
```

------------------------------------------------------------------------

## 17. Frontend P0/P1/P2/P3 Remediation Plan

### P0 --- Architecture blockers

-   [ ] Make one canonical patient flow.
-   [ ] Integrate `/patient` showcase with the real API.
-   [ ] Integrate Doctor page with existing API client.
-   [ ] Integrate Admin review actions with backend.
-   [ ] Reconcile `/api` vs `/api/v1`.
-   [ ] Reconcile P0 state transition with backend.
-   [ ] Remove diagnostic AI UI.
-   [ ] Make shared case identity consistent across roles.

### P1 --- Product-quality integration

-   [ ] Replace fixture data with API data on production routes.
-   [ ] Build shared typed domain models.
-   [ ] Add API error/state handling.
-   [ ] Add loading/empty/offline states.
-   [ ] Remove visible demo controls.
-   [ ] Add evidence drawer backed by real case data.
-   [ ] Add audit/override reason flow.
-   [ ] Add real patient post-consultation publication state.
-   [ ] Add P0 emergency timeline.

### P2 --- Elite visual pass

-   [ ] Consolidate design tokens.
-   [ ] Refactor large 900-line role pages into feature components.
-   [ ] Improve responsive/kiosk layouts.
-   [ ] Add micro-interactions only where useful.
-   [ ] Add polished skeleton/loading transitions.
-   [ ] Add keyboard/touch accessibility.
-   [ ] Add PWA icons/favicon.
-   [ ] Verify production build in a network-enabled CI environment.

------------------------------------------------------------------------

# Dedicated Prompt for Harry --- Frontend Integration + Elite UI Pass

> **Copy-paste this prompt directly into the frontend coding agent.**

``` text
You are the frontend owner for MediKiosk. Perform a TWO-PHASE frontend correction:
PHASE A = integration correctness
PHASE B = elite UI/UX rebuild.

DO NOT start by blindly styling the current pages.
First reconcile the application architecture.

CURRENT FACTS:
- src/lib/api.ts already contains the main typed API client.
- /dashboard and /intake/[sessionId] use real API calls.
- /patient, /doctor and /admin currently rely heavily on fixtures/local state.
- src/lib/fixtures.ts contains the showcase data.
- The supplied UI/UX handoff is the design direction.
- The current frontend consumes /api/... routes.
- Backend docs contain conflicting /api/v1 contracts. Inspect the actual backend/API contract before changing route paths.
- P0 must be automatic emergency escalation, not Admin approval.
- AI must never be presented as a diagnosis engine.

PHASE A — INTEGRATION AUDIT
1. Inspect:
   src/lib/api.ts
   src/types/index.ts
   src/lib/fixtures.ts
   src/app/*
   backend API documentation / actual backend route definitions if available.
2. Create a screen → API → state transition matrix.
3. Identify all fixture-only screens.
4. Identify all API functions that already exist but are unused.
5. Reconcile route/version mismatches with the actual backend.
6. Do not duplicate API clients.

PHASE A — CANONICAL PATIENT FLOW
Make ONE patient experience canonical.
Use the polished /patient information architecture as the visual/product base, but wire it to real APIs.
Do not maintain two independent patient products.

The final flow:
Welcome
→ Language
→ Consent
→ Identity/OTP
→ Existing dashboard if returning
→ New visit
→ Intake
→ voice/text
→ transcript confirmation
→ adaptive questions
→ review
→ submit
→ processing
→ P0/P1/P2/P3 outcome
→ queue/consultation status
→ post-consultation record.

If the backend does not support a screen yet, implement a clean typed loading/empty/not-available state rather than silently inventing data.

PHASE A — DOCTOR
Replace fixture reads in /doctor with:
getDoctorQueue()
callPatientTurn()
startConsultation()
submitConsultation()

Implement the real state transitions.
Use the same case ID throughout.
Keep Evidence & Source Records as a shared component.

IMPORTANT:
Remove any AI Differential / diagnosis probability UI.
Use:
AI Triage Context
- suggested priority
- confidence band
- risk flags
- evidence
- uncertainty
- model/version
- disclaimer: AI is advisory; doctor makes final clinical decisions.

PHASE A — ADMIN
Replace fixture-only review actions with real backend operations where endpoints exist.
At minimum:
- pending review
- case detail
- approve
- override with mandatory reason
- clarification
- reject
- P0 coordination state
- audit result

P0 must visually show that the emergency escalation already fired.
Admin coordinates; Admin approval must never be the trigger.

PHASE B — DESIGN SYSTEM
Create one canonical design system using the existing --mk-* token family.
Do not continue the old --color-* and --mk-* systems in parallel.
Extract reusable primitives:
- Button
- Card
- Badge
- StatusChip
- PriorityBadge
- Timeline
- EvidenceDrawer
- DataTable
- EmptyState
- ErrorState
- Skeleton
- ConfirmationModal
- Toast
- PageShell / OpsShell / KioskShell

PHASE B — PATIENT VISUAL TARGET
The patient experience must feel like a calm, premium hospital kiosk:
- large touch targets
- clear one-primary-action layout
- generous spacing
- readable at arm's length
- no unnecessary dashboard density
- voice-first but never voice-only
- clear transcript confirmation
- discreet privacy-safe status language
- beautiful P0/P1/P2/P3 outcome transitions

P0:
deliberate, high-attention, not theatrical.
No normal token.
Show immediate assistance/emergency status.

P1:
urgent clinical handoff.
Do not make it look like ordinary queue waiting.

P2:
standard queue/appointment state.

P3:
fast-track state.

PHASE B — DOCTOR VISUAL TARGET
Premium clinical SaaS:
- dense but readable queue
- priority-aware hierarchy
- evidence drawer
- patient summary
- clinical notes
- vitals
- diagnosis/treatment
- prescription
- completion
- audit-friendly timeline

PHASE B — ADMIN VISUAL TARGET
Premium hospital operations console:
- active P0 strip
- queue review
- allocation rationale
- evidence
- override confirmation
- staff/capacity
- AI monitoring
- audit
- system status

PHASE B — STATES
Every important component must have:
loading
empty
offline
error
permission denied
session expired
success
disabled
confirmation

Voice:
idle
permission denied
listening
transcribing
confirm/edit
processing
speaking
no speech
unclear
network error
text fallback

PHASE B — REMOVE DEMO ARTIFACTS
Do not expose:
- Demo: Mic denied
- Demo: No speech
- Demo: Network error
- Demo outcome switcher
- Demo post-consultation shortcut
- simulated OTP instructions
- simulated voice filling

If deterministic demo fixtures are needed, put them behind an explicit dev-only mechanism that is not visible in the normal demo UI.

PHASE B — PWA
Add missing:
public/favicon.ico
public/icon-192.png
public/icon-512.png
using the final MediKiosk logo.

PHASE B — QUALITY
Run:
npx tsc --noEmit
npm run lint
npm run build

If build cannot run because the environment cannot download dependencies, report that as an environment blocker instead of hiding it.

FINAL ACCEPTANCE CRITERIA:
1. There is one canonical patient flow.
2. Doctor/Admin no longer depend on fixture data for the normal demo path.
3. Existing API client is reused.
4. All roles share one case identity and state model.
5. P0 is automatic and never a normal queue item.
6. P1/P2/P3 have distinct operational outcomes.
7. No AI diagnosis/differential/probability UI exists.
8. Evidence and allocation reasoning are available where required.
9. Overrides require a reason and show confirmation/audit result.
10. No visible demo-only controls remain.
11. The UI feels like a coherent clinical product, not a collection of AI-generated screens.
12. TypeScript/lint pass; production build is verified where the environment permits.
```

------------------------------------------------------------------------

## 18. Frontend Definition of Done

The frontend rebuild is complete only when:

-   one canonical patient flow exists;
-   the polished flow is API-backed;
-   Doctor consumes the real queue/consultation APIs;
-   Admin consumes real triage/review data;
-   fixture data is isolated to explicit dev/demo mode;
-   all roles share the same case IDs and state semantics;
-   P0/P1/P2/P3 behaviors are distinct;
-   AI is visibly advisory, never diagnostic;
-   evidence/traceability is available;
-   demo controls are removed from the normal UX;
-   one design-token system remains;
-   PWA/favicon assets exist;
-   TypeScript and lint pass;
-   production build is verified in a network-enabled environment.

**Bottom line:** the current frontend is a useful prototype base, not a
finished integrated product. The good news is that the API client and
richer showcase UI already provide most of the raw material needed for a
strong final build. The right move is to merge those two worlds---not
throw everything away and start from zero.
