# Team Ownership And Integration Workflow

## Ownership baseline

| Area | Owner | Integration responsibility |
| --- | --- | --- |
| AI Engine | Harry | Migrate the old engine to the versioned pre-triage contract; expose uncertainty, evidence, safety flags, and model metadata. |
| Frontend/backend integration | Full Stack + Integration Lead | Own the PWA/API boundary, role flows, queue integration, persistence wiring, and cross-team contract review. |
| Queue operations | Backend plus Super Admin/operations reviewer | Implement approval-gated state transitions and document ordering/override policy. |
| Clinical policy | Clinical/operations owner `TBD` | Approve P0-P3 semantics, emergency handling, and SLAs. |
| Security/privacy | Owner `TBD` | Approve health-data, retention, provider, and deployment policies. |

## Integration sequence

1. Agree on the logical contract in `08-integration-contracts.md`.
2. Harry updates the AI Engine against `04-ai-pre-triage.md` and `13-old-to-new-for-harry.md`.
3. Backend adds validation, persistence, correlation, safety gating, and review state.
4. Frontend integrates only through backend capabilities and renders all state branches.
5. Queue behavior is tested with approved, overridden, low-confidence, failed, and P0 cases.
6. Update docs and open decisions when an implementation decision becomes final.

## Pull-request expectations

- Keep AI, backend, and frontend changes contract-compatible or version the contract.
- Include sample payloads or focused tests for changed fields.
- Do not include real patient data in fixtures, screenshots, logs, or PR descriptions.
- Call out any changed authority boundary explicitly.
- Link changes to the relevant documentation file.
- Review security/privacy impact for new data fields or provider calls.

Branch names, CI checks, deployment environments, and release approval are `TBD` because no repository workflow was present in the supplied workspace.
