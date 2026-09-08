# MVP Scope And Non-Goals

## In scope

- Patient intake through the Next.js PWA.
- Structured survey capture.
- Speech-to-text or other audio support if the selected AI service is enabled.
- Backend persistence of intake, AI assessment, review decision, queue state, and permitted records.
- AI pre-triage into operational P0-P3 bands.
- Confidence, uncertainty, missing-information, and safety-flag handling.
- Super Admin review and auditable override.
- Approved doctor queue with turn-wise visibility.
- Doctor access to the context needed for a consultation.
- Patient visibility into permitted queue/status information and prior records.
- Role-aware access control and auditability.
- PWA installability and responsive use on supported devices.

## Explicit non-goals

- Autonomous diagnosis, treatment, prescription, or emergency disposition.
- Direct AI-to-queue admission.
- Replacing a clinician or Super Admin with a model decision.
- Hospital information system, lab, pharmacy, ABDM, notification, or appointment integrations unless separately approved.
- Swytchcode or another agent execution layer as an MVP dependency.
- Offline creation or submission of sensitive intake/queue mutations without an explicit future design.
- Defining clinical thresholds, legal compliance, retention periods, or emergency SLAs in engineering code without an approved policy.
- Building a complete analytics, billing, inventory, or multi-clinic administration suite.

## Boundary rule

When a feature touches clinical authority, queue admission, external health systems, or sensitive-data retention, it needs an explicit decision and owner before implementation. It must not be smuggled into the MVP as a convenience detail.
