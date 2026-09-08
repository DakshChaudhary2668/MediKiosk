# Logical Data Model And ERD

This is a logical model for contract alignment. It is not a migration script. Physical table names, UUID strategy, nullable fields, indexes, and Supabase-specific policies are `TBD`.

The editable ERD source is [`architecture/medi-kiosk-erd.mmd`](architecture/medi-kiosk-erd.mmd).

## Core entities

| Entity | Purpose | Key relationships |
| --- | --- | --- |
| User | Authenticated person and role membership | Has one or more roles; may reference patient or staff profile. |
| PatientProfile | Patient-owned identity and stable profile context | Belongs to a User where applicable; has many intakes and records. |
| Intake | One patient submission/workflow instance | Belongs to a patient; has answers/artifacts and one or more assessments. |
| IntakeArtifact | Structured answer, audio, transcript, or attachment metadata | Belongs to an intake; sensitive storage reference is controlled. |
| TriageAssessment | Immutable AI pre-triage result and model metadata | Belongs to an intake; may be reviewed by a human. |
| ReviewDecision | Human approval, override, clarification, or rejection | References an assessment and actor; may produce queue admission. |
| QueueEntry | Approved operational turn | References an intake and final review decision. |
| ConsultationRecord | Doctor-authored or workflow record | References patient/intake and author; may be visible to patient by policy. |
| AuditEvent | Security and workflow accountability | References actor, entity, action, and timestamps. |

## Relationships

- One patient can have many intakes.
- One intake can have many artifacts and assessment attempts, but only one currently effective reviewed decision at a time.
- One assessment can have multiple review events while preserving history.
- A queue entry must reference an approved review decision.
- A consultation record references the patient and the relevant intake/queue context.
- Audit events are append-only from the application perspective.

## State ownership

- Intake state: backend.
- Assessment state: AI adapter plus backend validation, with backend as source of record.
- Review state: Super Admin action through backend.
- Queue state: backend queue engine.
- Consultation record content: authorized doctor through backend.
- Patient-visible projection: backend policy, not a client-side filter.

## Data model guardrails

- Keep original AI output immutable; store corrections as review decisions.
- Store source and author for evidence and records.
- Use server-owned timestamps for ordering and audit.
- Do not use a free-form priority string as the only integrity mechanism; the database/API should validate the allowed band.
- Keep personally identifiable and clinical content separate from operational identifiers where practical.
