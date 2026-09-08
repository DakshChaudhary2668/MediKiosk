# MediKiosk UI/UX Final Flow Audit

## Freeze Decision

**Do not hard-freeze the end-to-end flows yet.** The visual system, role separation, and most primary screens are strong enough to freeze as the design direction. The interaction and state model needs one final correction pass first.

The blockers are not cosmetic:

1. The Patient storyboard has no correctly labelled, dedicated **P1** outcome. It shows two cards labelled **P2**; one is internally labelled `Urgent (P1)`.
2. The P1, P2, and P3 operational contracts are not consistent between the workflow artifacts and the screens.
3. The Doctor storyboard presents an **AI Differential** with diagnoses and probabilities, which conflicts with the source statement that MediKiosk is **not a diagnosis tool** and that AI suggests priority, not diagnosis.
4. The newer and richer storyboard revisions do not agree on whether evidence/source records and AI allocation reasoning are present. Those must not become optional in the final UI.
5. P0 needs a non-blocking emergency protocol: visibility to an admin is useful, but an approval or manual action must never delay the emergency workflow.

After the blockers and the checklist below are closed, the UI can be frozen as **MVP UI/UX v1.0**.

## Evidence Basis

This audit uses only the supplied storyboard/workflow images. It does not assume a clinical policy that is not in those sources.

| Tag | Source artifact | What it establishes |
| --- | --- | --- |
| **S1** | `MVP Workflow (End-to-End Flow)` | Role sequence; P0/P1/P2/P3 labels; AI Queue Engine factors; Super Admin approval; Doctor consultation; final record; Patient Dashboard and follow-up. |
| **S2** | `MediKiosk - Final Workflow (v2.0)` | AI is for priority, not diagnosis; P0 critical token and instant notifications; doctor makes the final clinical decision; system-wide handoffs. |
| **S3** | Patient `Complete UI/UX Storyboard` / updated Patient flow | New and returning-patient intake, P0 emergency experience, post-consultation records, prescription and follow-up. |
| **S4** | Doctor `Complete UI/UX` / revised Doctor flow | Queue, intake summary, evidence view in the richer revision, consultation, diagnosis, prescription, follow-up and records. |
| **S5** | Super Admin `Complete UI/UX` / revised Super Admin flow | Queue review, case review, P0 management, allocation, staff, system health, analytics, configuration and audit. |

**Source-supported** means visible in S1-S5. **[Inference]** means a necessary UX control or state implied by a supplied flow, security constraint, or cross-role handoff; it is not a new product feature disguised as a requirement.

## Canonical Terms To Lock

Use one glossary everywhere: patient, doctor, admin, queue, notification, reports, and documentation.

| Priority | Canonical source meaning | Required product behavior |
| --- | --- | --- |
| **P0 - Critical / Immediate Escalation** | Potential life-threatening indicators; critical case/token; instant alert to Super Admin/Emergency Team; no normal queue. | Auto-trigger emergency protocol and case timeline. P0 is never waiting for queue approval. |
| **P1 - High Priority** | Urgent specialist connection. | Expedited clinical handoff/doctor acceptance with an urgent wait state, not an ordinary token queue. |
| **P2 - Moderate Priority** | Standard queue / scheduled doctor appointment. | Present appointment/slot or queue-confirmation state, then doctor acceptance/assignment. |
| **P3 - Routine / Low-Complexity** | Fast-track/routine in S1/S2. | Fast-track path with clear next step and clinician oversight if this remains the selected MVP policy. |

### Source conflict that needs a product decision

S1/S2 show **P3 - Routing / Low-Complexity (Fast Track)** and the Doctor queue contains P3 patients. The supplied architecture description also describes **P3 = self-care advice + monitoring**. These are different products. Choose one before freeze:

- **Recommended for the shown MVP:** P3 fast-track to a doctor, with optional self-care guidance while waiting. This matches the existing Patient and Doctor screens and the statement that AI does not treat.
- **Alternative:** P3 self-care/monitoring with a clear clinician-review trigger. This needs a distinct patient outcome, safety-net instructions, monitoring/reminder state, and a doctor exception queue.

Do not call either outcome just “routine” without showing what happens next.

## Cross-Role Findings

| Area | What is aligned | Gap / contradiction | Freeze action |
| --- | --- | --- | --- |
| AI role | S2 and Patient/Doctor screens say AI suggests priority; the doctor makes the final decision. | Doctor `AI Differential (Advisory)` lists diagnostic labels and percentages. | Remove it from MVP or relabel/rebuild as **AI Intake Summary, Risk Flags & Triage Context**. No diagnosis probabilities. |
| P0 | Patient has a dedicated alert, preparation, location, handover, and admin/doctor alert panels. Admin has P0 management. | Some Admin screens expose `Take Action`/approval-like handling; P0 must not wait for it. | Make automatic alert, emergency-team dispatch, timer, and escalation the first state. Admin action is coordination/override only. |
| P1/P2/P3 | All three role dashboards display priority chips/filters. | Patient has P0 + two P2 cards, no valid P1 card; P2 card says `Urgent (P1)`; no explicit P2 appointment choice. | Correct the state machine and regenerate the outcome panels. |
| Allocation | Admin rich case view shows `Why this allocation?`; S1 names priority, availability, department, hospital load, location and special cases. | The simplified Admin revision omits the explanation; override reasoning is absent. | Keep the rich reasoning panel and require a reason for reassign/override. |
| Evidence | Doctor rich revision includes transcript, extracted information, past records, uploaded files and AI reasoning. | Revised Doctor board omits the evidence screen; Admin case reasoning has no drill-down evidence. | Freeze a shared **Evidence & Source Records** drawer for Doctor and Admin. |
| Continuity | Patient post-consultation dashboard, visit summary, prescription, reports, follow-up and past records are now present. | It is not explicitly connected to the doctor's completion/sign-off and notification-delivery state. | Add completion-to-patient handoff, record-published status, and reminder delivery state. |
| Role approval | S1 includes Super Admin approval and Staff & Roles is represented. | Doctor credential submission, pending, approved, rejected, and re-submission states are not storyboarded. | Add the clinician/admin onboarding status flow before MVP freeze. |
| Safety and privacy | Consent, OTP, role dashboards, activity logs and access indicators are represented. | Screens reveal ABHA ID, phone, transcript and records but do not show permission/redaction/access reason; AI data handling is not visible. | Add minimum-necessary data, consent scope, source access log, and privacy-safe AI disclosure states. |

## Patient Flow Audit

### What is already aligned

The Patient direction is good: language selection, consent, identity/OTP, voice-first adaptive intake, history/medications, review/processing, returning-patient records, P0 alert, and post-consultation continuity all map to S1/S2.

The screen family is especially strong in two places:

- The voice-first intake is clearly not a generic long form.
- The post-consultation surfaces now expose visit summary, prescription, lab reports, follow-up, past records, profile/privacy, and a new visit.

### Screen-by-screen audit

| Screen/group | Status | Required final behavior |
| --- | --- | --- |
| Welcome and language | Aligned | Persist language through intake, messages, notifications and records. [Inference] |
| Consent and information | Partial | Separate consent for care/intake, record access, optional location during emergency, and contact/notification preference. The existing single acknowledgement is not enough to make those choices visible. |
| Identification and OTP | Partial | Show invalid, expired, resend-limited, already-registered, and assisted-kiosk recovery states. [Inference] |
| Returning patient | Partial | `Verify & Fetch Records -> Existing Patient Dashboard -> Start New Visit` is correct; define whether this happens before new-patient demographics and how a record-match conflict is resolved. [Inference] |
| Voice survey / listening / follow-up | Partial | Freeze component states: idle, permission denied, listening, transcribing, confirmation/edit, AI processing, reply, no-speech/unclear speech, network error, and manual text fallback. |
| History, medications, review, processing | Partial | Include uploaded medical-document entry and removal/error state; source records are a stated input in S1/S2. |
| AI pre-triage result | Partial | State confidence/uncertainty, the inputs considered, and a safe `needs clarification` branch. Do not imply diagnosis. |
| P0 | Mostly aligned | Keep the alert/assistance/what-to-do/handover sequence; add emergency contact/approved location state where policy requires it, a clear re-alert path, and no normal queue token. |
| P1 | **Missing/mislabeled** | Add a dedicated **P1 - High Priority** screen: urgent clinical handoff, assigned/connecting clinician or specialty, short status updates, and escalation if connection fails. |
| P2 | **Incomplete** | A P2 outcome needs standard-queue/appointment selection, confirmed time/doctor or queue position, and cancel/reschedule/wait-change states. |
| P3 | Partial | If fast-track is selected, show fast-track arrival/wait instructions and safety-net guidance. If self-care is selected, replace the doctor token with monitoring, red flags and clinician review trigger. |
| Post-consultation | Mostly aligned | Show `record published`, prescription/lab availability, follow-up due, notification delivery/failure, and a way to report worsening symptoms. [Inference] |

### Patient defects to correct

- **F-01, blocker:** In the Patient priority panel, the amber card is titled **P2 - Moderate Priority (Standard Queue)** while its content says `Queue Type: Urgent (P1)`. Treat it as the missing P1 card and rename it to **P1 - High Priority**; change the action from ordinary queued waiting to urgent handoff.
- **F-02, blocker:** The green card is titled **P2 - Routine / Low Complexity (Fast Track)**. Rename it **P3 - Routine / Low-Complexity (Fast Track)**.
- **F-03, blocker:** There is no separate P1 destination or explicit P2 appointment/scheduling flow. The shown hierarchy becomes P0/P2/P2 rather than P0/P1/P2/P3.
- **F-04, major:** The Patient flow says P0 is visible to Doctor and Super Admin. Ensure this is a separate emergency alert/handoff panel, not a doctor queue row or normal Admin approval item.
- **F-05, major:** Two patient revisions differ in intake steps and screen coverage. Freeze one canonical storyboard; do not allow implementation to choose between variants.

## Doctor Flow Audit

### What is aligned

The structural order is strong: queue -> patient intake -> clinical consultation -> vitals/examination -> diagnosis -> prescription/orders -> follow-up -> completion -> updated queue -> records/profile. The richer version also has an excellent evidence screen concept.

### Screen-by-screen audit

| Screen/group | Status | Required final behavior |
| --- | --- | --- |
| Doctor login and queue | Aligned | Include online/away/on-leave availability and priority-specific queue rules. |
| Intake summary | Partial | Preserve patient-entered facts separately from AI summary; show source timestamp, clinician-visible uncertainty, and original intake. |
| Evidence & Source Records | Present only in richer revision | Make it canonical: transcript, extracted facts, past record, uploaded file, and source-specific uncertainty/provenance. |
| P1/P2/P3 work queue | Partial | P1 gets urgent accept/decline/escalate workflow; P2 gets scheduled/queued appointment context; P3 follows the selected fast-track/self-care policy. Current filters alone do not define the behavior. |
| Consultation and vitals | Aligned | Include patient identity confirmation, consultation mode and interrupted/late/no-show state. [Inference] |
| Diagnosis & AI assistance | **Contradiction** | The doctor owns diagnosis. Remove AI diagnosis probabilities from the MVP; retain AI intake/risk context and allow the doctor to document their own final diagnosis. |
| Prescription and orders | Mostly aligned | Add medication/allergy/interactions and order result status only if included in product scope. [Inference] |
| Follow-up/discharge | Aligned | On completion, show patient delivery status and publish the signed record atomically. |
| Re-triage | Missing | `Mark as P1` needs confirmation, reason, patient/admin notification, queue recomputation, and audit entry. |
| P0 doctor handling | Missing as explicit exception state | P0 should not appear in the routine doctor queue. If a doctor participates, show an emergency alert/acknowledge/handover panel, separate from consultation scheduling. |

### Doctor defects to correct

- **F-06, blocker:** `AI Differential (Advisory)` with likely diagnoses and percentages conflicts with the repeated source statement **Not a Diagnosis Tool** and **AI suggests priority, not a diagnosis**. This is more than wording; it changes the clinical claim of the product.
- **F-07, major:** `Evidence & Source Records (New)` exists in one board and disappears in the revised board. It is required to support the AI summary safely and should be an in-context drawer from intake and consultation, not a disposable screen.
- **F-08, major:** `Mark as P1` has no visible re-triage life cycle. Add reason -> confirm -> notify -> allocation update -> audit.
- **F-09, major:** The source material is internally inconsistent on consultation mode: it says both **Not a Telehealth Platform** / **In-Person** and elsewhere refers to virtual or tele-assisted consultation. Choose one MVP mode. If tele-assisted/virtual is in scope, add modality selection, waiting room, connection failure, consent, and end-call states. If not, remove virtual/teleconsult references from the workflow.

## Super Admin Flow Audit

### What is already aligned

The richer Admin board covers the expected operational surface: overview, review queue, case review, P0 escalation management, doctor queue/allocation, staff/roles, hospital load and analytics, configuration, activity/audit, real-time status, and reports/export. It is the right base for the final Admin UI.

### Screen-by-screen audit

| Screen/group | Status | Required final behavior |
| --- | --- | --- |
| Login and overview | Aligned | Role/session timeout and failed-login support are implementation states. [Inference] |
| Review Queue | Partial | Define which cases need Admin review, which are auto-assigned, and which may be overridden. Never include P0 in a normal approval queue. |
| Case Review & AI Reasoning | Strong in rich revision | Keep `Why this allocation?` plus evidence drill-down, confidence/uncertainty, recommended action, and override reason. |
| P0 Escalation Management | Partial | Show automatic trigger time, acknowledgement owner/time, emergency-team status, response SLA, non-response escalation, handover and resolution. `Take Action` must not be the trigger. |
| Doctor Queue & Allocation | Partial | Surface capacity/availability inputs, assignment acceptance/decline, wait change and a documented override. |
| Staff & Roles | Partial | Add credential review: submitted, pending verification, approved, rejected, re-submission. Add permission matrix or at least role detail. |
| Hospital load & analytics | Aligned | Show data freshness and no-data/error states. [Inference] |
| AI confidence/error monitoring | Missing | A system-health badge is not enough. Add confidence distribution, low-confidence/contradictory-input cases, human overrides, allocation outcome/error review, and model/rule version. |
| Configuration | Partial | Version and audit changes to triage/allocation policies; do not make live clinical-routing changes look like ordinary preferences. [Inference] |
| Activity log & reports | Partial | Record actor, time, case ID, before/after priority/allocation, reason, evidence reference and outcome. |

### Admin defects to correct

- **F-10, blocker:** The Admin revisions are not equivalent. The richer one includes allocation rationale; the simplified one does not. The final spec must keep the richer `Why this allocation?` panel.
- **F-11, blocker:** P0 cannot be held at `Unassigned`, `Needs review`, or `Take Action` without an automatic emergency action already completed. Make manual action coordination only.
- **F-12, major:** S1/S2 require AI confidence/error tracking, but the UI shows per-case confidence and generic system health, not the required monitoring workflow.
- **F-13, major:** Super Admin approval is shown, but the approval gate for ordinary P1/P2/P3 allocation versus automatic allocation is not defined. Freeze the rules and the status labels.

## Evidence, AI Reasoning, and Data Traceability

The storyboard already has the raw ingredients. The final design should connect them into one traceable case record.

### Required case-level traceability

Every triage/allocation decision should expose:

1. **Case ID** shared by Patient, Doctor, Admin, notification and emergency timeline.
2. **Source facts**: intake response/transcript, selected symptom, record/document, timestamp, and extraction status.
3. **AI output**: suggested priority, confidence/uncertainty, risk flags, model/rule version, and the non-diagnostic disclaimer.
4. **Allocation output**: department/doctor/hospital, relevant availability/load/location inputs, estimated wait, and special-case rule.
5. **Human decision**: approver/doctor, override/re-triage reason, time, before/after values and downstream notifications.
6. **Outcome**: consultation started/completed, handover completed, record published, follow-up due.

### Privacy controls to design visibly

S1/S2 state that PII is protected and raw PII is not sent to AI. The UI therefore needs:

- Granular consent and a plain-language AI data-use notice.
- Minimum-necessary identity display; mask phone/ABHA until a role has a need to view it. [Inference]
- `View original intake` / records access logged with actor and timestamp.
- Download/share confirmation, recipient/method, delivery status and revocation/expiry policy where applicable. [Inference]
- A patient-visible way to update consent, communication preference and emergency contact. [Inference]

## Final Recommended Flow Order

### Patient

1. Welcome -> language -> accessibility/assisted intake choice.
2. Consent scope -> identity -> OTP -> returning-patient match or new-patient profile.
3. Dashboard for returning patient -> `Start New Visit`; new patient proceeds directly to intake.
4. Voice/text intake -> transcription confirmation/edit -> adaptive questions -> history, medications and records.
5. Review -> submit -> AI pre-triage result with confidence/needs-clarification branch.
6. One mutually exclusive outcome:
   - **P0:** automatic emergency alert -> assistance preparation -> location/what to do -> handover -> emergency status.
   - **P1:** urgent specialty/doctor handoff -> connection/arrival status -> escalation on delay.
   - **P2:** appointment/queue selection -> confirmation -> wait/arrival updates -> doctor handoff.
   - **P3:** fast-track confirmation and safety-net guidance, or self-care/monitoring if that policy is selected.
7. Consultation completed -> signed visit summary/record published -> prescription/orders/reports -> follow-up/reminders -> past records/new visit.

### Doctor

1. Login -> availability status -> priority-aware queue.
2. Select/accept case -> verify patient and consultation mode.
3. Intake summary -> evidence/source records -> acknowledge uncertainty/red flags.
4. Consultation -> clinical notes -> vitals/examination.
5. Doctor diagnosis and plan (AI may expose triage context only).
6. Prescription/orders -> patient instructions -> follow-up/discharge.
7. Review/sign -> publish record and notify patient -> completion confirmation -> updated queue.
8. Exception paths: re-triage/escalation, P0 handover alert, unable-to-consult/no-show, and interrupted consultation.

### Super Admin

1. Secure login -> operational overview and active P0 alert strip.
2. **P0 exception lane:** automatic alert already fired -> acknowledge/coordinate -> emergency-team status -> SLA/escalation -> handover/resolution -> audit.
3. Review P1/P2/P3 queue -> case detail -> evidence and AI allocation reasoning.
4. Approve/reassign/override -> mandatory reason -> notification and audit.
5. Doctor/hospital capacity management -> allocation exceptions -> availability/load updates.
6. Credential/role approval -> active/suspended status and permissions.
7. AI confidence/error monitoring -> analytics/reports -> versioned configuration -> activity/audit/export.

## UI/UX Freeze Checklist

### Must close before flow freeze

- [ ] Publish the canonical P0/P1/P2/P3 glossary and colors; correct Patient P2/P2 labels to P1/P2/P3.
- [ ] Define one distinct success, wait, exception and escalation state for each priority.
- [ ] Confirm whether P3 is fast-track-to-doctor or self-care/monitoring; redesign the non-selected route out of the flows.
- [ ] Make P0 auto-dispatch/notify and no-normal-queue. Add acknowledgement timer, owner, escalation and handover state.
- [ ] Remove diagnostic AI differentials/probabilities from Doctor MVP; retain non-diagnostic triage context only.
- [ ] Lock whether consultation is in-person only or tele-assisted/virtual, then include only matching screens and wording.
- [ ] Make Doctor Evidence & Source Records and Admin `Why this allocation?` mandatory, connected components.
- [ ] Add reasoned admin override/reassign and doctor re-triage flows with notification and audit results.
- [ ] Freeze the Admin approval policy: what is auto-assigned, reviewed, approved, overridden, and bypassed for P0.
- [ ] Add doctor/admin credential submission, pending verification, approve/reject and resubmission states.
- [ ] Add AI confidence/error monitoring, not just a system-health badge.
- [ ] Canonicalize the latest Patient, Doctor and Admin boards; remove or mark superseded revisions.

### Must close before implementation acceptance

- [ ] Implement loading, empty, offline, retry, permission-denied and error states for voice, OTP, records, allocation, notifications and video/tele-assist if selected.
- [ ] Define text fallback and transcription confirmation for every voice step.
- [ ] Add patient document upload/view/remove/failure flows and source timestamps.
- [ ] Add record-published, prescription/report-ready, reminder scheduled/delivered/failed and symptom-worsened paths.
- [ ] Define appointment reschedule/cancel, doctor availability change, no-show, late arrival and assignment-decline paths.
- [ ] Use one shared case/test fixture across Patient, Doctor and Admin prototypes to validate IDs, priority, status and timestamps through the whole journey.
- [ ] Add privacy/consent visibility, PII masking rules, original-intake access logging and download/share confirmation.
- [ ] Validate keyboard, kiosk touch, mobile, Hindi/regional language expansion, contrast and error recovery. [Inference]

## Final Verdict

**Freeze now:** visual language, navigation families, dashboard layouts, core information architecture, voice-first patient intake direction, patient continuity dashboard, doctor workflow skeleton, and Admin operational surface.

**Hold for one final flow correction pass:** priority taxonomy and destination states, P0 non-blocking escalation, non-diagnostic AI boundary, evidence/allocation traceability, consultation-mode decision, approval policy, and revision consolidation.

Once the 12 flow-freeze items are complete, this is a coherent MVP UI/UX rather than a good-looking storyboard with unresolved clinical-routing behavior.
