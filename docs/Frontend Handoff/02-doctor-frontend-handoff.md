# MediKiosk - Doctor Frontend & UI/UX Handoff

**Role:** Doctor  
**Goal:** Prioritized caseload, traceable intake review, doctor-led consultation and final clinical record.

Read [the shared handoff contract](00-mediKiosk-frontend-handoff.md) before implementation.

## Non-Negotiable Clinical Boundary

MediKiosk AI is not a diagnosis tool. The Doctor UI must not show AI differential diagnoses, disease likelihoods, diagnosis percentages, or a pre-filled AI final diagnosis.

Replace old `AI Differential (Advisory)` UI with the following canonical component:

```text
AI Triage Context

Suggested priority: P2
Confidence: 82%

Reported indicators
- Cough, 2 days
- Mild fever
- Body ache
- No reported breathlessness

Relevant history
- No chronic condition reported

Risk flags
- None identified

This is triage support, not a diagnosis.
Please use clinical judgment.
```

The Doctor independently completes **Final Clinical Assessment**, diagnosis, prescription, tests and follow-up.

## Navigation Structure

```text
Login
 -> availability
 -> priority-aware queue
 -> case detail
 -> Evidence & Source Records
 -> AI Triage Context
 -> consultation
 -> vitals / examination
 -> doctor assessment / diagnosis
 -> prescription and orders
 -> follow-up
 -> review / sign / complete
 -> record published / patient notified
 -> updated queue
```

## Screens and Requirements

### 1. Login, profile and availability

- Login uses staff identity.
- Dashboard reflects current availability: online, away, on leave, or unavailable.
- Profile/preferences may contain language, default consultation length, notification settings and schedule/availability.
- Changes in availability must be reflected in allocation UI after a refresh/update state.

### 2. Today's queue

**Filters:** All, P1 urgent, P2, P3, follow-ups. P0 is not part of the routine doctor queue.

**Queue row fields**

```text
time / caseId / patient display name or initial
AI intake summary
priority badge
status
primary action: Consult / View
```

**Priority behavior**

- P1: accept/consult promptly, or decline/escalate with a reason.
- P2: normal confirmed queue/appointment context.
- P3: fast-track consultation path.
- P0: if relevant to the clinician, appears as a separate emergency alert/handover panel, never a normal queue row.

### 3. Case detail and patient intake summary

Show Patient Information, Intake Summary, History, Attachments, and AI Triage Context in a stable layout.

**Required actions**

- View original intake
- Open Evidence & Source Records
- Request clarification
- Start consultation
- Re-triage to P1 or escalate to P0

Do not merge a patient-stated fact with an AI inference without labeling the source.

### 4. Evidence & Source Records (canonical drawer)

This component is mandatory even if the final layout makes it a side drawer rather than a separate page.

```text
Evidence & Source Records

Patient Intake
 - voice transcript / text response
 - extracted symptom facts
 - patient-confirmed answers

Past Records
 - prior visit summary
 - relevant history

Uploaded Files
 - prescription
 - lab report
 - medical document

AI Triage Context
 - priority suggestion
 - confidence and uncertainty
 - risk flags
 - source references
```

Each visible source needs enough provenance to answer: what was the source, when was it created/received, and was it confirmed/extracted.

### 5. Clinical consultation

**Current MVP default:** in-person / kiosk-assisted. Do not create a video calling flow until consultation mode is formally changed.

Include:

- identity/case confirmation
- clinical notes
- quick insert actions for confirmed intake, vitals and symptoms
- draft save and recovery state
- patient status: waiting, in consultation, completed, unable to consult, no-show

### 6. Vitals and examination

- Capture/edit current vitals.
- Record physical examination independently from AI triage facts.
- Show validation for invalid or missing values.
- Make transitions back to consultation and forward to clinical assessment explicit.

### 7. Doctor assessment, diagnosis, prescription and orders

**Doctor Assessment / Diagnosis**

- Doctor selects or enters final diagnosis and notes.
- The diagnosis form is doctor-owned; AI does not pre-populate diagnostic probability choices.

**Prescription / orders**

- Medication, dose, duration and patient instructions.
- Test/order selection and additional instructions as scoped in the storyboard.
- Show clear edit/remove states before completion.

### 8. Follow-up, review and completion

```text
Follow-up plan
 -> patient education/instructions
 -> review
 -> sign and complete
 -> record published
 -> patient notified
 -> updated doctor queue
```

The `Consultation Completed` screen must make the publish/handoff state visible. Patient-facing records cannot be represented as final before this event.

## Doctor Exception Flows

### Re-triage to P1

```text
Mark as P1
 -> select/enter reason
 -> confirm
 -> patient + Admin notification
 -> queue/allocation recomputed
 -> audited event
```

### Escalate to P0

```text
Escalate P0
 -> confirmation and emergency instruction
 -> automatic emergency protocol/status
 -> Doctor emergency handover panel
 -> audit
```

P0 escalation must not wait for normal queue approval.

### Other required exceptions

- request clarification
- patient late/no-show
- unable to consult
- interrupted consultation / reconnect to draft
- assignment declined or doctor unavailable

## Doctor Acceptance Checklist

- [ ] Queue filters and row priorities use P1/P2/P3 correctly; P0 stays outside the standard queue.
- [ ] AI Triage Context replaces every AI differential/diagnostic-probability UI.
- [ ] Evidence drawer is reachable from case detail and consultation.
- [ ] Each source is distinguishable from AI summary and doctor-authored notes.
- [ ] Re-triage and P0 escalation include reason, confirmation, notification, updated state and audit.
- [ ] Doctor signs before the Patient can view the final record.
- [ ] All key screens support loading, empty, error, permission and draft-recovery states.

