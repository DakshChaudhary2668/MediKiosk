# MediKiosk Backend Audit

**Audit date:** 2026-09-09\
**Scope:** Supplied Harry/backend documentation + integration
contracts + state machines + API reference + technical-debt/testing
docs, cross-checked against the supplied frontend repository.\
**Important evidence limitation:** The supplied `frontend.zip` contains
the frontend only. No `backend/` source tree was present in the supplied
ZIPs available for this audit. Therefore, backend implementation
findings are split into **document-confirmed**,
**frontend-contract-confirmed**, and **not independently verifiable**.
Do not treat a documentation claim such as "tests pass" as proof that
the current backend commit still passes those tests.

------------------------------------------------------------------------

## 1. Executive Verdict

### Current backend status

The documented backend architecture is **substantially defined**, and
the intended stack is coherent: FastAPI → service layer →
Supabase/in-memory fallback → AI adapters for Groq/Sarvam →
queue/consultation APIs.

However, the backend is **not integration-safe yet** because the
supplied documents contain contract conflicts that the frontend already
reflects in code:

1.  **API version mismatch:** `docs/08-integration-contracts.md` freezes
    `/api/v1/...`, while `docs/api.md` and the actual frontend client
    use `/api/...`.
2.  **P0 state-machine conflict:** the frozen integration contract says
    P0 bypasses Admin approval automatically, while `state-machines.md`
    still models `Admin clicks "Escalate to ER"`.
3.  **Intake contract conflict:** the frozen Phase-0 contract defines
    `POST /api/v1/intake/submit`, while the implemented frontend uses
    conversational `/api/intake/session`, `/api/intake/message`,
    `/api/intake/voice`, and `/api/intake/session/{id}/complete`.
4.  **Consultation contract conflict:** the frozen Phase-0 contract
    defines `/api/v1/consultation/{consultation_id}/complete`, while the
    frontend uses `/api/doctor/turn/{session_id}/consult`.
5.  **Persistence is documented as hybrid, but the technical-debt
    document explicitly says active triage/queue state is still
    in-memory.**
6.  **RBAC is documented as a known weakness:** role enforcement is not
    yet cryptographically hardened.
7.  **The current frontend can only consume the documented `/api/...`
    contracts; changing the backend to `/api/v1` without a compatibility
    layer will break the live patient/auth/intake flows.**

### Backend readiness rating

**Architecture/design:** 8/10\
**Contract consistency:** 4/10\
**Persistence durability:** 5/10\
**RBAC/security hardening:** 5/10\
**AI/safety boundary:** 7/10\
**Integration readiness:** 5/10\
**Hackathon demo readiness:** potentially good after contract/state
fixes, but **not safe to call "fully integrated" until the actual
backend tree is re-audited and the E2E path is proven.**

------------------------------------------------------------------------

## 2. Source-of-Truth Hierarchy

Use this order when resolving backend ambiguity:

1.  `docs/README.md` --- current product boundary and documentation
    precedence.
2.  `docs/01-mvp-workflow.md` --- finalized workflow.
3.  `docs/08-integration-contracts.md` --- intended frozen integration
    contracts.
4.  `docs/05-queue-and-approval.md` --- queue ownership and approval
    behavior.
5.  `docs/business-rules.md`, `docs/04-ai-pre-triage.md`,
    `docs/state-machines.md`.
6.  `docs/api.md` --- current concrete endpoint reference.
7.  Frontend `src/lib/api.ts` --- **actual consumer contract currently
    coded in the supplied frontend**.
8.  Older diagrams/variants are superseded where they conflict.

**Rule for Harry:** do not "pick whichever is easier." Reconcile the
conflicts explicitly and update the canonical docs after the code is
fixed.

------------------------------------------------------------------------

## 3. Backend Architecture Audit

### Documented architecture

The intended runtime is:

``` text
Next.js PWA
   ↓
FastAPI API boundary
   ↓
Routers
   ↓
Business services
   ├── Safety / red-flag filter
   ├── AI intake / pre-triage
   ├── Sarvam STT
   ├── Sarvam TTS
   └── Queue / consultation logic
   ↓
Supabase PostgreSQL + Storage
   ↘
In-memory fallback cache
```

The documented routers are:

-   `auth.py`
-   `patient.py`
-   `intake.py`
-   `triage.py`
-   `queue.py`

The documented services include:

-   `ai_engine.py`
-   `pre_triage.py`
-   `safety.py`
-   `stt.py`
-   `tts.py`

This is a sensible separation for the hackathon MVP.

### Architectural concern

The documentation simultaneously describes a production-like persistence
layer and an in-memory fallback for active clinical state. That is
acceptable as a deliberate demo resilience strategy, but it creates a
dangerous ambiguity:

> A successful API response does not necessarily mean the state is
> durably persisted.

The active triage/queue state must be explicitly classified as **demo
fallback only** versus **authoritative persistence**.

------------------------------------------------------------------------

## 4. P0 Emergency Handling --- P0 BLOCKER

### Canonical intended behavior

`docs/08-integration-contracts.md` explicitly states:

``` text
P0 signal
   ↓
p0_escalated
   ↓
Immediate human intervention
   ↓
NO normal queue
   ↓
NO Super Admin approval prerequisite
```

The frontend fixture also models automatic alerts before Admin
acknowledgement.

### Conflicting backend state machine

`docs/state-machines.md` currently says:

``` text
awaiting_review
   → escalated: Admin clicks "Escalate to ER"
```

That contradicts the frozen contract.

### Required backend behavior

A P0/red-flag result must atomically:

1.  Mark the assessment/session as `p0_escalated`.
2.  Prevent creation of a normal queue entry.
3.  Create an emergency/audit event.
4.  Trigger the configured internal notification path.
5.  Preserve the original AI assessment.
6.  Expose the emergency timeline to authorized Admin/Doctor surfaces.
7.  Allow Admin acknowledgement/coordination **after** the automatic
    escalation, not before it.

The backend must never require:

``` text
Admin opens case → clicks Escalate → emergency begins
```

The correct model is:

``` text
Safety/P0 detected → emergency event fired → Admin coordinates/acknowledges
```

------------------------------------------------------------------------

## 5. Queue and Approval Audit

### Intended rule

For P1/P2/P3:

``` text
AI recommendation
    ↓
Super Admin review
    ↓
approve / override / clarification / reject
    ↓
queue entry
```

The queue itself is backend-owned.

Ordering is documented as:

1.  P1
2.  P2
3.  P3
4.  FIFO within a priority band using a server-owned timestamp.

### Required invariants

Harry should enforce these server-side:

-   Client cannot submit an authoritative priority.
-   Client cannot create a queue token directly.
-   Unapproved P1/P2/P3 cannot appear in doctor queue.
-   P0 never enters the ordinary queue.
-   Queue ordering must not trust a client timestamp.
-   Override must preserve original AI assessment.
-   Override/reassignment requires a reason.
-   Queue mutation must be attributable to an authenticated actor.
-   Concurrent actions must not create duplicate turns/tokens.

### Known documented debt

`docs/technical-debt.md` states that:

-   `_TRIAGE_ASSESSMENTS` is in memory.
-   `_DOCTOR_QUEUE` is in memory.
-   `_TOKEN_COUNTER` is an in-memory integer.

This means restart durability and multi-worker token uniqueness are not
yet production-safe.

------------------------------------------------------------------------

## 6. Persistence Audit

### Current documented state

The docs describe PostgreSQL persistence for patients, sessions,
messages and cases, but explicitly identify active triage and queue data
as in-memory.

### P0/P1 fix

For the hackathon, Harry can keep a fallback cache, but the
authoritative path should be:

``` text
Supabase/Postgres
  ├── triage_assessments
  ├── doctor_queue_items
  ├── consultation_records
  └── audit_logs
```

Use a database sequence or transactional allocation for token numbers.

### Minimum migration requirement

Do not simply dump Python dictionaries into tables. The migration must
preserve:

-   assessment ID
-   intake ID
-   original AI priority
-   confidence band
-   uncertainty
-   safety flags
-   evidence
-   model/version/prompt version
-   final human decision
-   override reason
-   queue status
-   server timestamps
-   audit actor

------------------------------------------------------------------------

## 7. AI Engine Integration Audit

### Correct boundary

The AI engine is advisory only.

It must not:

-   write queue state
-   assign tokens
-   approve cases
-   prescribe
-   issue final diagnosis
-   mutate patient records directly

The backend should own the adapter:

``` text
FastAPI
  → sanitize/pseudonymize intake
  → AI adapter
  → validate schema
  → safety validation
  → persist immutable assessment
  → route by priority/state
```

### Required response validation

The backend must reject or quarantine AI responses that:

-   omit required fields
-   contain invalid priority
-   contain unsupported clinical actions
-   include diagnosis/prescription fields where prohibited
-   contain malformed confidence data
-   contradict the safety layer

A malformed AI response must become `assessment_failed` / manual-review
state, not a guessed priority.

------------------------------------------------------------------------

## 8. Sarvam Voice Pipeline Audit

The documented voice pipeline is one of the stronger parts of the
architecture:

``` text
Browser MediaRecorder
 → FastAPI /api/intake/voice
 → audio validation
 → Sarvam Saaras STT
 → deterministic safety scan
 → Groq AI intake
 → Sarvam Bulbul TTS
 → frontend
```

The documented defensive behavior is good:

-   reject empty/too-short audio
-   reject empty transcript
-   never fabricate a transcript
-   degrade gracefully if TTS fails
-   preserve a text response if audio synthesis fails

### Integration requirement

The backend must make the voice endpoint and conversational text
endpoint produce the **same domain state**. Voice must not be a separate
"demo path."

Both should update the same:

``` text
session
messages
patient-confirmed facts
completion state
red-flag state
case
```

------------------------------------------------------------------------

## 9. Security / RBAC Audit

The docs identify JWT/local-storage and role-enforcement debt.

### Required backend controls

At minimum:

``` text
require_auth()
require_role("patient")
require_role("doctor")
require_role("admin")
```

The following must be server-enforced:

  Operation                 Allowed role
  ------------------------- -------------------------------------
  Own profile/documents     Patient
  Own intake/session        Patient
  Pending triage            Admin
  Approve/override/reject   Admin
  Doctor queue              Doctor
  Start/call consultation   Doctor
  Complete consultation     Doctor
  Patient queue status      Patient
  Audit log                 Admin / explicitly authorized staff

Do not rely on:

-   frontend route visibility
-   hidden buttons
-   URL obscurity
-   localStorage role values

### PII

The AI request must exclude:

-   full name
-   national ID
-   contact information

Use an internal patient reference.

------------------------------------------------------------------------

## 10. Contract Matrix --- MUST RECONCILE

  ---------------------------------------------------------------------------------------------------------------------------------
  Domain            Frozen contract                                     Current concrete frontend                 Verdict
  ----------------- --------------------------------------------------- ----------------------------------------- -----------------
  Intake submit     `/api/v1/intake/submit`                             `/api/intake/session`, `/message`,        **BLOCKER**
                                                                        `/voice`, `/session/{id}/complete`        

  Triage pending    `/api/v1/...` contract family                       `/api/triage/pending`                     **BLOCKER**

  Triage review     `/api/v1/review/{intake_id}/decide`                 `/api/triage/{assessment_id}/review`      **BLOCKER**

  Doctor queue      `/api/v1/doctor/queue`                              `/api/doctor/queue`                       **BLOCKER**

  Consultation      `/api/v1/consultation/{consultation_id}/complete`   `/api/doctor/turn/{session_id}/consult`   **BLOCKER**
  complete                                                                                                        

  Patient queue     implied by workflow                                 `/api/patient/queue-status`               Needs canonical
  status                                                                                                          documentation

  Voice             Phase-0 says raw audio not required                 `/api/intake/voice` is implemented in     **Decision
                                                                        frontend                                  required**
  ---------------------------------------------------------------------------------------------------------------------------------

### Recommendation

For this hackathon, **do not migrate the frontend to `/api/v1` unless
Harry's actual backend is already built that way.**

Instead:

1.  Inspect the actual FastAPI route decorators.
2.  Choose one canonical public route family.
3.  Update `docs/08-integration-contracts.md`, `docs/api.md`, and
    frontend `api.ts` together.
4.  Add compatibility aliases only if needed for demo continuity.

------------------------------------------------------------------------

## 11. Tests --- What They Prove vs What They Don't

The docs list:

-   anti-hallucination/safety tests
-   triage → approval → queue → consultation E2E
-   backend unit/router tests
-   live HTTP integration test

That is good coverage conceptually.

But the supplied evidence is documentation describing expected output,
not the current test execution output from the backend repository.

Therefore:

**Do not mark backend "green" solely from `docs/testing.md`.**

The real verification gate is:

``` text
pytest
+
live FastAPI server
+
real HTTP requests
+
Supabase connected
+
Sarvam/Groq integration (where enabled)
+
P0 / P1 / P2 / P3 fixtures
+
frontend against the same server
```

### Required new regression tests

1.  P0 auto-escalates without Admin action.
2.  P0 cannot create normal queue item.
3.  P1/P2/P3 cannot enter queue before approval.
4.  Override requires reason.
5.  Original AI assessment remains unchanged after override.
6.  Duplicate approval is idempotent.
7.  Concurrent approval cannot create two tokens.
8.  Token numbers remain unique across restarts/workers.
9.  Doctor cannot access Admin endpoints.
10. Patient cannot access another patient's session.
11. AI failure cannot produce a priority.
12. Voice and text produce the same session state semantics.
13. Published consultation becomes visible to the correct patient only
    after doctor completion.

------------------------------------------------------------------------

## 12. Backend P0/P1/P2/P3 Remediation Plan

### P0 --- Before any UI integration claim

-   [ ] Inspect actual backend source and route decorators.
-   [ ] Freeze one API route family (`/api/...` or `/api/v1/...`).
-   [ ] Fix P0 automatic escalation.
-   [ ] Remove Admin approval prerequisite from P0.
-   [ ] Prevent P0 normal queue insertion.
-   [ ] Freeze exact triage/queue state enums.
-   [ ] Make override/review idempotent and audited.
-   [ ] Verify auth/RBAC server-side.
-   [ ] Run real E2E tests against the current backend.

### P1 --- Integration hardening

-   [ ] Persist triage and queue state in Supabase.
-   [ ] Replace in-memory token counter with DB sequence/transaction.
-   [ ] Add consultation contract compatibility with frontend.
-   [ ] Normalize error response shape.
-   [ ] Add structured event/audit records.
-   [ ] Ensure voice/text share the same session/case state.
-   [ ] Add explicit notification status.

### P2 --- Demo/production polish

-   [ ] Realtime queue updates.
-   [ ] Structured logging/tracing.
-   [ ] Better retry/idempotency keys.
-   [ ] Load/concurrency tests.
-   [ ] Retention/deletion policies.
-   [ ] Secure cookie-based session strategy if feasible within the
    hackathon.

------------------------------------------------------------------------

# Dedicated Prompt for Harry --- Backend Correction Pass

> **Copy-paste this prompt directly into Harry's coding agent.**

``` text
You are the backend owner for MediKiosk. Perform a CONTRACT-FIRST BACKEND CORRECTION PASS.

IMPORTANT:
- Do not blindly trust older docs.
- Inspect the actual FastAPI source tree first.
- Preserve working Sarvam STT/TTS and AI-engine integration where it is valid.
- Do not redesign unrelated functionality.
- Do not fabricate missing infrastructure.
- The frontend currently consumes /api/... routes through frontend/src/lib/api.ts.
- The supplied documentation has conflicting /api/v1 vs /api route families. Resolve this against the actual backend code, then update the canonical docs and frontend contract only if required.

PHASE 1 — INVENTORY
1. Inspect:
   backend/app/main.py
   backend/app/routers/*
   backend/app/services/*
   backend/app/models.py
   backend/app/db.py
   backend tests
   seed scripts
   migration.sql
2. Produce a route matrix:
   method | path | auth | role | request | response | state mutation
3. Identify every mismatch against:
   docs/08-integration-contracts.md
   docs/api.md
   docs/state-machines.md
   docs/01-mvp-workflow.md
   frontend/src/lib/api.ts

PHASE 2 — FIX THE CONTRACT
Choose ONE canonical public route family.
For the hackathon, prefer preserving the currently consumed /api/... routes unless the actual backend is already consistently /api/v1.
Then update all documentation and frontend types to match the real route contract.
Do not leave two contradictory “sources of truth”.

PHASE 3 — FIX P0
Implement this invariant:
P0/red-flag detected
→ persist p0_escalated
→ automatic emergency event/notification
→ NO normal queue entry
→ NO Admin approval prerequisite
→ Admin can acknowledge/coordinate AFTER escalation
The state machine must no longer say “Admin clicks Escalate to ER” as the trigger for P0.
Add regression tests proving a P0 cannot become a normal queue item.

PHASE 4 — FIX P1/P2/P3
Enforce:
P1/P2/P3 AI recommendation
→ awaiting_review
→ Admin approve/override/clarification/reject
→ only approved case can become doctor queue item.
Override MUST require a reason.
Original AI assessment MUST remain immutable.
Repeated approval/override requests must be idempotent.

PHASE 5 — PERSISTENCE
If triage/queue are still Python dictionaries, migrate the authoritative state to Supabase/Postgres:
- triage_assessments
- doctor_queue_items
- consultation_records
- audit_logs as needed
Use a DB-backed sequence/transaction for token allocation.
An in-memory fallback may remain only as an explicit degraded/demo fallback.
Document exactly when it is used.

PHASE 6 — RBAC
Enforce roles in FastAPI dependencies, not frontend routes.
Patient: own data only.
Admin: triage/review/audit/operations.
Doctor: queue/consultation.
Reject unauthorized cross-role access with 401/403.

PHASE 7 — AI SAFETY
AI remains advisory.
Reject malformed AI responses.
Never let AI directly mutate queue/assignment/prescription state.
Preserve uncertainty, evidence, safety_flags, model/version/prompt_version.
AI failures become manual-review/assessment_failed states; never guess a priority.
Keep PII out of the AI payload.

PHASE 8 — VOICE/TEXT PARITY
Ensure /api/intake/message and /api/intake/voice update the same session/case semantics.
Voice:
- reject empty audio
- reject empty transcript
- deterministic safety scan before/after AI where documented
- TTS failure may degrade to text
- never fabricate transcript/facts

PHASE 9 — TESTS
Add/execute tests for:
- P0 auto escalation
- P0 no queue
- P1/P2/P3 approval gate
- override reason
- immutable AI assessment
- duplicate review idempotency
- token uniqueness/concurrency
- RBAC
- patient isolation
- AI malformed/failure path
- voice/text parity
- doctor consultation publication

PHASE 10 — HANDOFF
At the end report:
1. exact files changed
2. exact API route matrix
3. exact state machine
4. tests executed + actual output
5. any remaining blockers
6. docs updated to match code

Do NOT claim “fully integrated” unless the real HTTP E2E path has been executed against the current backend and the frontend contract matches it.
```

------------------------------------------------------------------------

## 13. Backend Definition of Done

Backend correction is complete only when:

-   one route contract exists;
-   P0 auto-escalates and never enters normal queue;
-   P1/P2/P3 require human review before queue admission;
-   AI output is immutable advisory evidence;
-   queue/token state is server-owned;
-   review/override is audited;
-   RBAC is server-enforced;
-   patient data is isolated;
-   voice/text share the same domain state;
-   current frontend `api.ts` matches actual backend routes;
-   tests run against the current code, not only documented expected
    output;
-   `docs/08-integration-contracts.md`, `docs/api.md`, and
    `docs/state-machines.md` agree with each other.

**Bottom line:** the backend architecture is good enough to finish the
hackathon, but the contract/state inconsistencies must be removed before
the elite frontend pass is considered integration-safe.
