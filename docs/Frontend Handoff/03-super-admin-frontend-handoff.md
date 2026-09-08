# MediKiosk - Super Admin Frontend & UI/UX Handoff

**Role:** Super Admin / hospital operations  
**Goal:** Monitor emergency operations, oversee ordinary allocation, manage capacity and staff, and preserve an auditable AI-to-human decision trail.

Read [the shared handoff contract](00-mediKiosk-frontend-handoff.md) before implementation.

## Core Admin Rule

The Admin is a **P0 coordinator**, never the P0 trigger or approval bottleneck.

```text
AI detects P0
 -> emergency alerts fire automatically
 -> Emergency Team + Super Admin + relevant clinical staff notified
 -> patient emergency state
 -> Admin acknowledges, coordinates, tracks and resolves
```

Never render P0 as an ordinary queue item waiting at `Needs review`, `Unassigned`, `Approve`, or `Take Action` before emergency notification/dispatch has already occurred.

## Navigation Structure

```text
Secure login
 -> Overview dashboard
 -> P0 emergency lane (always reachable)
 -> Review queue (P1/P2/P3)
 -> Case detail
 -> Evidence + AI triage context + Why this allocation?
 -> Accept / Reassign / Override
 -> Reason + notification + audit

Operational areas:
Doctor queue & allocation
Staff & roles
Hospital load & analytics
AI confidence/error monitoring
System configuration
Activity/audit
Reports/export
Real-time system status
```

## Screens and Requirements

### 1. Login and Overview Dashboard

The overview should provide immediate scanning of:

- active P0 count/status
- review queue volume
- urgent P1 count
- doctor availability/queue volume
- clarification backlog
- hospital load/wait time
- system health/data freshness

An active P0 strip/lane must be visible without needing a user to hunt through normal queue navigation.

### 2. P0 Escalation Management

**P0 lifecycle**

```text
Detected
 -> automatic alerts/dispatched
 -> acknowledged
 -> emergency team assigned/en route
 -> handover
 -> resolved
```

**Case details required**

- shared `caseId`
- detected time and elapsed-response timer
- patient location / source location when authorized
- critical indicators and source summary
- emergency-team/staff status
- acknowledgement owner/time
- response SLA and no-response escalation
- handover and resolution timestamp
- event timeline/audit

**Admin actions**

- acknowledge
- coordinate team/department
- reassign when needed
- escalate a delayed response
- document handover/resolution

The Admin can act after the automatic protocol; their action must not replace it.

### 3. Review Queue (P1/P2/P3)

Include filters for priority, department, hospital, queue status and confidence/needs-clarification state as supported by the visual design.

**Queue row fields**

```text
caseId
patient role-appropriate display identity
symptom summary
priority
AI confidence / uncertainty state
status
review action
```

Define and render statuses consistently: `auto-assigned`, `pending review`, `needs clarification`, `approved`, `reassigned`, `waiting`, `completed`. P0 uses its own lifecycle states.

### 4. Case Review

The rich version of the Admin case screen is canonical. It must contain:

- Patient / case details
- AI Triage Context: patient-reported indicators, risk flags, suggested priority, confidence and non-diagnostic note
- Evidence & Source Records access
- `Why this allocation?`
- allocation recommendation
- actions: accept, modify/reassign, request clarification

### 5. Why this allocation? (mandatory)

Show the actual factors used for the current recommendation, not generic explanatory copy.

```text
Why this allocation?

Priority: P1/P2/P3
Department / specialty
Doctor availability
Current queue or hospital load
Patient location / source channel, where relevant
Estimated wait or response time
Special consideration
```

The panel must include an evidence drill-down for source facts behind risk flags and the allocation itself.

### 6. Accept, Modify, Reassign and Override

```text
Accept or modify allocation
 -> if modified: mandatory override reason
 -> confirm before/after allocation
 -> update patient/doctor queue state
 -> send applicable notification
 -> write activity/audit event
```

An override record must show actor, timestamp, previous and new assignment/priority, reason and notification outcome.

### 7. Doctor Queue and Allocation

Support capacity-aware assignment using the surfaced factors:

- specialty/department
- clinician availability
- current queue load/wait
- hospital load
- location
- appointment/time constraint
- special-case consideration

Include assignment failure/decline and stale-availability states. Do not silently leave a case assigned to an unavailable doctor.

### 8. Staff & Roles / credential approval

Keep staff list and roles, then add the missing credential lifecycle:

```text
Credential submitted
 -> pending verification
 -> approved or rejected
 -> role activated / re-submission requested
```

Provide role detail/permissions access. Do not let a simple active-status table substitute for credential approval.

### 9. Hospital Load, Analytics and AI Monitoring

Hospital/operational analytics should show load, waits, queue volume, P0 count and data freshness.

Add a dedicated **AI Confidence & Error Monitoring** area, separate from generic green `system healthy` status:

- confidence distribution
- low-confidence and conflicting-input cases
- clarification volume
- human override/re-triage rate
- allocation outcome/error-review queue
- current rule/model version and change date

### 10. System Configuration, Activity Log, Reports and Status

**Configuration**

- organization, timezone, language, notifications, integrations and AI/triage configuration as scoped.
- triage/allocation policy changes require version/effective-state/audit treatment; they are not ordinary visual preferences.

**Activity/Audit**

Include actor, time, action, case ID, before/after value, reason, evidence reference and outcome where relevant.

**System status**

Show freshness and error/degraded states for queue engine, AI service, database, kiosk devices, notifications and integrations.

## Privacy and Access UI

- Mask patient phone/ABHA unless the Admin has a legitimate view need.
- Record access to original intake, documents and exports.
- Exports/downloads require a confirmation state and result/error feedback.
- Do not expose raw identity in allocation/analytics views that do not require it.

## Super Admin Acceptance Checklist

- [ ] P0 is automatic and has a separate lifecycle, SLA and handover timeline.
- [ ] P0 is never blocked by a normal queue review or approval action.
- [ ] P1/P2/P3 case detail exposes AI Triage Context, evidence and allocation reasons.
- [ ] `Why this allocation?` is retained from the rich storyboard revision.
- [ ] Every reassign/override asks for a reason and creates an auditable before/after record.
- [ ] Ordinary approval policy and status labels are explicit.
- [ ] Credential approval states exist alongside Staff & Roles.
- [ ] AI confidence/error monitoring is separate from generic system health.
- [ ] Analytics, exports, configuration and status include loading/error/freshness/access states.

