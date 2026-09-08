# MediKiosk - Patient Frontend & UI/UX Handoff

**Role:** Patient / kiosk user  
**Goal:** Voice-first intake, safe priority outcome, care handoff, and post-consultation continuity.

Read [the shared handoff contract](00-mediKiosk-frontend-handoff.md) before implementation.

## Navigation Structure

```text
Welcome
  -> Language
  -> Consent
  -> New / Existing Patient
  -> Identity + OTP
  -> Existing dashboard (returning patient only)
  -> Start New Visit
  -> Intake
  -> AI Pre-Triage outcome
  -> Care handoff
  -> Post-consultation dashboard
```

## Canonical Screen Flow

### 1. Welcome and language

**Screens:** Welcome, language selector, assisted-intake entry.

**UI requirements**

- Show supported languages consistently throughout the experience.
- Make the primary start action clear and touch-friendly for kiosk use.
- Offer assisted intake without making it look like a clinical emergency path.

### 2. Consent and identity

**Screens:** Consent & information, new/existing patient choice, identity input, OTP verification.

**Required content**

- Explain that information is used for clinical intake and queue allocation.
- Collect/confirm consent before record retrieval or intake submission.
- Support phone and ABHA identity options shown in the storyboard.
- Returning patient: verify identity -> fetch records -> existing dashboard -> `Start New Visit`.

**Required states**

- invalid format
- incorrect OTP
- expired OTP
- resend countdown/rate limit
- existing-record match
- unable to fetch records + retry/manual assistance
- consent declined (cannot continue; show safe exit/help state)

### 3. Voice/text clinical intake

**Screens:** AI-guided survey, listening/voice input, AI response/follow-up, adaptive questions, history, medications/lifestyle, review, processing.

**Canonical sequence**

```text
Prompt
 -> Listen or type
 -> Transcribe
 -> Patient confirms/edits
 -> Adaptive follow-up
 -> History / medications / lifestyle / documents
 -> Review
 -> Submit
 -> Processing
```

**Voice component states**

```text
idle -> microphone permission -> listening -> transcribing
-> confirmation/edit -> AI processing -> next prompt
```

Support `no speech`, `unclear speech`, `network error`, and `continue by text` at any question. Never submit unconfirmed transcribed symptoms as patient-confirmed facts.

**Data visible at review**

- reported symptom(s) and duration
- severity/self-reported answers
- history and medications
- document upload status, if a record is included
- editable answer summary

Do not show a diagnosis or a disease probability.

### 4. AI pre-triage result

Use a neutral processing/result screen before branching. It may show:

- `We have analysed your information`
- suggested priority
- confidence/uncertainty state
- key factors considered: symptoms/duration, age/history, reported severity, relevant conditions, hospital/queue availability where applicable
- `This is not a diagnosis. The doctor will make the final clinical decision.`

If information is incomplete or confidence is low, branch to **needs clarification** and return to the relevant intake question. Do not invent a priority card.

## Priority Outcome Screens

The outcome is mutually exclusive. Never display multiple priority cards as consecutive stages of a single patient case.

### P0 - Critical / Immediate Escalation

**No token. No normal queue. No approval wait.**

```text
AI detects P0
 -> emergency alert fires automatically
 -> patient critical alert
 -> assistance preparation/status
 -> remain-at-location guidance
 -> emergency-team handover
 -> resolution/status
```

**Screens/components**

1. `URGENT ATTENTION REQUIRED` with clear, non-diagnostic language.
2. Alert progress: case flagged, emergency team notified, staff notified, assistance preparing.
3. What to do next: remain at kiosk/location, current location, estimated response if available, safe condition-worsening guidance.
4. Handover/after-handover status.

The Patient must not be asked to approve, select a doctor, join a routine queue, or wait for Admin approval.

### P1 - High Priority / Urgent Handoff

**This is a dedicated new screen; it replaces the wrongly labelled P2/P1 card from older art.**

**Show**

- `HIGH PRIORITY` and urgent clinical-assessment message
- department/specialty
- assigned or connecting clinician
- connection/arrival status and short ETA where available
- next instruction: wait at a specified place, return to desk, or prepare for handoff
- delayed-handoff escalation/status update

Do not present P1 as a normal `patients ahead` token queue.

### P2 - Moderate / Standard Queue

**Show**

- department
- assigned clinician/appointment when available
- token or appointment confirmation
- estimated wait/time and patients ahead
- live queue updates
- what to do next
- cancel/reschedule or wait-change state when the product allows it

### P3 - Routine / Low-Complexity / Fast Track

**MVP policy is Fast Track.**

**Show**

- fast-track label and priority code `P3`
- location/department
- estimated wait / patients ahead, when applicable
- what to do next
- safety-net guidance for worsening symptoms

Do not implement a self-care-only P3 route in this MVP.

## Post-Consultation Experience

The Doctor publishes the completed record before these surfaces become available.

```text
Doctor signs and completes
 -> record published
 -> patient notification
 -> Patient dashboard
 -> visit summary / prescription / reports / follow-up / past records
```

**Screens**

1. Dashboard: latest visit, visit summary, prescriptions, reports, follow-up, past records.
2. Visit summary: doctor, department, time, clinical summary, next steps.
3. Prescription: medication, dosage, duration, instructions, download/share only with confirmation.
4. Lab reports: availability, result status, view/download.
5. Follow-up/reminders: scheduled visit, tests, calendar action, delivery preference/status.
6. Past records: chronological entries with view action.
7. Profile/settings: language, notification preference, privacy/data, linked identity.

**Required exception states**

- signed record pending publication
- prescription/report not yet available
- notification delayed/failed
- follow-up changed/cancelled
- symptoms worsen: route back to a new intake or emergency instruction according to severity

## Patient Data and Privacy UI

- Keep sensitive identity display minimal and role-appropriate.
- Give a clear AI/data-use explanation at consent; do not imply raw identity data is sent to AI.
- Record/document access, downloads and shares need confirmation and status feedback.
- Keep an accessible place to update communication preference and consent-related choices.

## Patient Acceptance Checklist

- [ ] New and returning flows converge cleanly at `Start New Visit`.
- [ ] Every voice answer can be confirmed or edited.
- [ ] P0/P1/P2/P3 are correctly labeled and produce four distinct outcomes.
- [ ] P0 shows no normal token or approval state.
- [ ] P1 is urgent handoff; P2 is standard queue/appointment; P3 is Fast Track.
- [ ] Patient does not see a diagnosis/AI differential.
- [ ] Doctor completion visibly drives record publication and Patient notification.
- [ ] Mobile/kiosk touch, language expansion, empty/loading/error and offline recovery are covered.

