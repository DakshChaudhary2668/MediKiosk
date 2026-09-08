# MediKiosk - Frontend & UI/UX Handoff

**Version:** MVP UI/UX v1.0 (correction pass)  
**Audience:** Frontend/UI implementation agent  
**Status:** Build against this document. Do not introduce alternate flows or new clinical claims.

## Handoff Pack

- [Patient Frontend Handoff](01-patient-frontend-handoff.md)
- [Doctor Frontend Handoff](02-doctor-frontend-handoff.md)
- [Super Admin Frontend Handoff](03-super-admin-frontend-handoff.md)
- [Audit and source comparison](medikiosk-uiux-freeze-audit.md)

## Product Boundary

MediKiosk is an AI-powered patient intake and queue-optimization product. It is **not a diagnosis tool**.

- AI structures intake, identifies risk signals, suggests a priority, and supports allocation.
- A doctor owns the final clinical assessment, diagnosis, prescription, and care plan.
- A Super Admin monitors, coordinates, approves/overrides ordinary allocations, and audits operations.
- A P0 case is an emergency workflow, not a queue item.

## Canonical Decisions

| Decision | Final implementation rule |
| --- | --- |
| Priority taxonomy | Use exactly `P0 Critical`, `P1 High Priority`, `P2 Moderate`, `P3 Routine / Low-Complexity`. Never show P2 twice. |
| P0 | Auto-trigger emergency notifications and the emergency timeline. No normal token, no normal queue, and no admin approval prerequisite. |
| P1 | Urgent clinical handoff. It must not look or behave like a normal P2 wait queue. |
| P2 | Standard queue / appointment path. Show assignment or queue/appointment confirmation, ETA and wait updates. |
| P3 | **Fast Track** for MVP. Show fast-track status, location/next step, ETA and safety-net guidance. Do not implement a separate self-care-only P3 product. |
| Doctor AI | Show **AI Triage Context** only. Never show AI differential diagnoses, likelihoods, diagnosis percentages, or AI final diagnosis. |
| Evidence | `Evidence & Source Records` is a mandatory reusable drawer/panel in Doctor and Admin case detail. |
| Allocation | `Why this allocation?` is mandatory in Admin case detail. Overrides/reassignments require a reason. |
| Post-consultation | Doctor signing/finalization publishes the record and makes Patient visit summary, prescription, reports and follow-up available. |
| Consultation mode | **Pending owner confirmation.** Current frontend default is in-person/kiosk-assisted because the supplied UI says “Not a Telehealth Platform.” Do not build video/teleconsult screens unless this decision changes. |

## Shared UI Contracts

### Priority colors and labels

| Code | Label | Use |
| --- | --- | --- |
| P0 | Critical / Immediate Escalation | Red; emergency-only lane and alert state |
| P1 | High Priority / Urgent Handoff | Orange/amber; urgent handoff state |
| P2 | Moderate / Standard Queue | Amber/purple as established in final design; standard appointment/queue state |
| P3 | Routine / Low-Complexity / Fast Track | Green; fast-track state |

Do not use color as the only priority signal. Always render the priority code and text label.

### Shared case record

Every cross-role view must use the same `caseId`, `priority`, `status`, and event timestamps. A patient, doctor, and admin prototype should be able to demonstrate one case without changing identity or priority midway.

Required display-level fields:

```text
caseId
patient display identity (role-appropriate / masked where not needed)
priority + status
intake submitted at
AI triage confidence + uncertainty state
risk flags
allocation: department, clinician/hospital, ETA
human override or re-triage reason, if any
event timeline
```

### Required traceability

For every AI-influenced priority or allocation, allow authorized users to see:

1. Patient-confirmed intake facts and source timestamp.
2. Uploaded record/document provenance.
3. AI Triage Context: suggested priority, confidence, risk flags, non-diagnostic note, and rule/model version where available.
4. Allocation factors: specialty, availability, load, location, ETA, and special consideration.
5. Human action: actor, reason, before/after values, time, and notification result.

### Required global states

Build these as reusable components/states, not disconnected one-off screens:

- loading/skeleton
- empty state
- offline/retry
- permission denied
- session expired
- form validation and server error
- success/confirmation
- no data available
- access restricted / PII masked
- notification sent, delayed, and failed

For voice input also support: idle, microphone permission denied, listening, transcribing, confirmation/edit, processing, no speech, unclear speech, network error, and text fallback.

## Role Boundary

| Role | May do | Must not do |
| --- | --- | --- |
| Patient | Submit/confirm intake; view own status, records, prescriptions, reports and follow-up. | See an AI diagnosis, approve an emergency, or receive a normal P0 queue token. |
| Doctor | Review source evidence; consult; set clinical assessment/diagnosis; prescribe; re-triage/escalate; sign record. | Treat AI suggestion as final diagnosis or leave re-triage without a reason/audit. |
| Super Admin | Coordinate P0; review ordinary allocation; reassign/override with reason; manage staff/capacity; audit AI operations. | Become a P0 approval bottleneck or overwrite clinical diagnosis. |

## Implementation Order

1. Establish design tokens, priority badges, status chips, core layout, common case timeline, evidence drawer, and allocation-reasoning panel.
2. Implement the Patient flow through all four triage outcomes and post-consultation publication state.
3. Implement Doctor queue, case detail, evidence, consultation, completion, and exception paths.
4. Implement Admin P0 lane, ordinary review/allocation, staff/roles, AI monitoring, audit, and configuration surfaces.
5. Run one end-to-end fixture through all roles: normal P2, urgent P1, P3 fast-track, P0 emergency, re-triage, override, and record publication.

## Non-Negotiable Acceptance Criteria

- P0 bypasses ordinary queue/admin approval and has an automatic, visible emergency event timeline.
- P1, P2, and P3 have different patient outcomes and different operational behavior.
- No screen contains diagnostic AI probabilities or frames AI as the final clinical decision-maker.
- Evidence and allocation reasons stay available in the final Doctor/Admin designs.
- Every override/re-triage action requires reason, confirmation, downstream status update, and audit entry.
- The Patient sees the signed/published result only after Doctor completion.
- The final implementation uses one canonical storyboard revision; older variants are not mixed in.

