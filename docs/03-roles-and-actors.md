# Roles And Actors

## Human roles

| Actor | Needs | Allowed authority in the MVP |
| --- | --- | --- |
| Patient | Submit intake, understand status, provide context, view permitted history | Own intake submissions and patient-visible status; no access to internal review notes or other patients. |
| Doctor | Work the approved queue and make clinical decisions | Read assigned/authorized patient context, update consultation records, and advance the consultation state according to the final workflow. |
| Super Admin | Operate the clinic queue and review AI recommendations | Approve, override, return, or reject a pre-triage recommendation; manage queue admission; audit decisions. Exact admin scope is `TBD`. |
| Clinical/operations reviewer | Validate safety and operational policy | Review P0-P3 semantics, emergency handling, and queue SLAs. This role may be combined with Super Admin or remain separate; `TBD`. |

## System actors

| Actor | Responsibility | Must not do |
| --- | --- | --- |
| Next.js PWA | Render role-specific workflows and submit/read through the backend | Hold authoritative queue state or call the AI Engine directly. |
| FastAPI backend | Authenticate/authorize, validate, persist, orchestrate AI, apply safety gates, and own queue state | Treat model output as a final clinical decision. |
| AI Engine | Produce bounded, versioned pre-triage output from the approved input contract | Create users, mutate the queue, prescribe, or make an unreviewed final decision. |
| Speech/AI service | Transcribe or interpret the content requested by the backend | Receive more personal data than the contract requires. |
| Supabase services | Persist application data and permitted artifacts | Be accessed from an untrusted client with privileged credentials. |

## Ownership baseline

- Harry owns the AI Engine implementation and its migration to the new pre-triage contract.
- The Full Stack + Integration Lead owns the frontend/backend boundary, queue integration, and cross-team contract alignment.
- Clinical/operations ownership for P0-P3 meanings, emergency guidance, and queue SLAs is `TBD`.
- Final production security/privacy approval is `TBD`.
