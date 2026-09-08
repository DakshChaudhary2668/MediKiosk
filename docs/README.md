# MediKiosk Documentation Context

## Purpose

This folder is the shared context package for the MediKiosk MVP. It is written for the frontend, backend, AI Engine, clinical/operations reviewers, and AI coding agents working in the repository.

## Source and precedence

The package is based on the finalized workflow discussed for the MVP. It records the following established direction:

- The product is a patient intake and clinic queue experience.
- The frontend is a Next.js PWA.
- The backend boundary is FastAPI.
- Supabase is the planned persistence platform.
- AI performs survey/speech processing and pre-triage support.
- A Super Admin reviews the AI recommendation before a patient is admitted to the doctor queue.
- Doctors work from an approved, turn-wise queue and supporting patient records.
- Swytchcode is out of scope for the MVP.

This package explicitly supersedes the older flow. In particular, AI output is not a final clinical decision and does not directly create a doctor queue entry.

## How to read certainty

- **Confirmed context** means it was directly established in the project discussion.
- **MVP contract** means a conservative behavior required to make the confirmed workflow implementable. It should be treated as the working integration contract unless an owner changes it.
- **TBD** means the project discussion did not settle the detail. Implementations should preserve a seam for the decision and must not invent a clinical, privacy, or operational policy.

## Core invariant

The backend is the system of record and safety gate. The AI Engine supplies a versioned, explainable pre-triage recommendation. A Super Admin or designated human reviewer controls queue admission and may override the recommendation with an auditable reason. Doctors make the clinical decision.

## Documentation map

| File | Purpose |
| --- | --- |
| `01-mvp-workflow.md` | End-to-end happy path and exception paths. |
| `02-scope-and-non-goals.md` | MVP boundary and explicit non-goals. |
| `03-roles-and-actors.md` | Human and system actors with authority boundaries. |
| `04-ai-pre-triage.md` | P0-P3 semantics, uncertainty, safety, and AI output expectations. |
| `05-queue-and-approval.md` | Queue allocation, approval gate, states, and ordering assumptions. |
| `06-dashboards-and-records.md` | Doctor dashboard, patient dashboard, and records as evidence/context. |
| `07-system-architecture.md` | Runtime boundaries and data flow. |
| `08-integration-contracts.md` | Logical frontend/backend/AI contracts; exact routes remain TBD. |
| `09-data-model.md` | Logical entities and ERD description; physical names remain TBD. |
| `10-security-privacy.md` | Health-data handling assumptions and security requirements. |
| `11-pwa-and-frontend-conventions.md` | PWA behavior, SCSS structure, and UI state conventions. |
| `12-team-integration-workflow.md` | Ownership, pull-request workflow, and integration checklist. |
| `13-old-to-new-for-harry.md` | Explicit migration note for the AI Engine work. |
| `OPEN-DECISIONS.md` | Single list of unresolved decisions and suggested owners. |

## Update rule

When implementation settles a `TBD`, update the relevant document and `OPEN-DECISIONS.md` in the same pull request. If a decision changes a system boundary, update the Mermaid source as well. Do not leave the old flow in prompts or examples after changing the canonical contract.
