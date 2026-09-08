# Finalized MVP Workflow

## Flow summary

The MVP flow is:

`Patient intake -> backend persistence -> AI pre-triage -> uncertainty/safety checks -> Super Admin review -> approved queue entry -> doctor turn-wise queue -> consultation record -> patient-visible status/history`

The AI recommendation is a decision-support artifact. It is never the sole authority for admission, priority, diagnosis, or treatment.

## End-to-end stages

| Stage | Primary owner | Result |
| --- | --- | --- |
| 1. Start intake | Patient and PWA | A new intake/visit context is created. |
| 2. Capture information | Patient and PWA | Structured answers and, if enabled, audio/transcript are submitted. |
| 3. Persist intake | FastAPI | The submission is stored and given an intake identifier. |
| 4. Run pre-triage | AI Engine through backend adapter | A versioned P0-P3 recommendation, confidence/uncertainty, evidence, and safety flags are returned. |
| 5. Apply safety gate | FastAPI | Missing data, low confidence, red flags, and AI failures are routed to human review. |
| 6. Review recommendation | Super Admin or designated reviewer | The recommendation is approved, overridden, sent back for clarification, or rejected with an audit record. |
| 7. Allocate queue position | FastAPI queue logic | Only an approved intake becomes an active doctor queue entry. |
| 8. Serve the queue | Doctor dashboard | Doctors see the approved turn-wise queue and relevant patient context. |
| 9. Record consultation | Doctor and backend | Consultation outcome and supporting record are stored according to the final data contract. |
| 10. Show patient status | Patient dashboard | The patient sees their queue/status and permitted history; sensitive internal review data stays restricted. |

## Required safety gates

1. The client cannot call the AI Engine directly.
2. The backend validates and persists the intake before sending the AI request.
3. A failed, timed-out, malformed, or low-confidence AI response cannot silently create an approved queue entry.
4. A Super Admin review is required before queue admission.
5. Any override records who made it, when, what changed, and why.
6. A doctor-facing recommendation must be visibly labeled as AI-generated pre-triage, with its uncertainty and source evidence available where appropriate.

## Exception paths

### AI unavailable

Keep the intake available for manual review. The backend should record the failure and expose a review state rather than fabricating a priority. Retry behavior and timeout values are `TBD`.

### Incomplete or contradictory intake

Ask for clarification when the product can do so. Otherwise route to Super Admin review with the missing/contradictory fields visible. Do not fill clinical facts by inference.

### Red-flag or possible emergency content

Surface the safety flag immediately to the configured human reviewer and show the approved emergency guidance for the deployment. The exact escalation channel, language, and response SLA are `TBD` and require clinical/operations ownership.

### Admin override

The human decision becomes the queue-driving decision, while the original AI result remains immutable historical context. Store both values and the override reason.

## What this flow does not imply

- The AI diagnoses the patient.
- The AI prescribes treatment.
- The AI sends a patient directly to a doctor queue.
- A queue priority is a promise of a clinical response time.
- A patient record is automatically trusted merely because it is old or displayed by the system.
