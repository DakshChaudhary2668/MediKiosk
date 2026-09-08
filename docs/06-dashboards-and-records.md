# Dashboards And Records

## Doctor dashboard

The doctor view is a work surface for the approved queue. It should support:

- Current turn and next eligible turns.
- Priority band and review status, clearly separated from diagnosis.
- Patient-provided intake summary and relevant historical context.
- Safety flags and uncertainty that affect how the doctor interprets the intake.
- Consultation state and the actions the doctor's role is allowed to take.
- A way to open the underlying evidence rather than showing an unexplained AI label.

The dashboard must not present an AI recommendation as a confirmed diagnosis. It should show source and freshness when displaying historical records.

## Patient dashboard

The patient view should make the operational state understandable without exposing internal notes or other patients' data. The MVP expectation is:

- Intake submission acknowledgement.
- Review/queue state that the patient is allowed to see.
- Current turn or a human-readable position/status if the backend supports it.
- Permitted completed consultation records and prior history.
- Clarification or follow-up requests when the workflow requires more information.

Exact patient-facing wording, position visibility, notifications, and cancellation behavior are `TBD`.

## Records as evidence and context

Patient records are context for human decisions. They can include prior intake, transcripts or summaries, consultation notes, attachments, and reviewer decisions depending on the final data policy. A record should carry its source, author/actor, timestamp, and status where applicable.

Historical information must not be silently treated as current truth. The UI should make stale, patient-reported, AI-generated, and clinician-authored content distinguishable.

## Access boundary

- Patients see only their own permitted records.
- Doctors see only patients and records authorized by the backend for their current role/assignment.
- Super Admin access is broader for operations but should still be auditable.
- AI services receive only the context explicitly included in the backend request.

The final clinic/doctor assignment model and record retention policy are `TBD`.
