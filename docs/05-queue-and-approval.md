# Queue Allocation And Super Admin Approval

## Queue principle

The queue is a backend-owned operational state machine. AI proposes a priority; only a human-approved decision can create an active doctor queue entry.

## Proposed lifecycle

`intake_submitted -> assessment_pending -> assessment_ready -> awaiting_review -> approved -> queued -> called -> in_consultation -> completed`

Possible exception states are `needs_clarification`, `rejected`, `cancelled`, `no_show`, and `review_failed`. The final enum names are `TBD`.

## Approval gate

The Super Admin review surface should show:

- Patient/intake reference and the information the patient submitted.
- AI priority band and confidence/uncertainty.
- Safety flags, missing information, contradictions, and supporting evidence.
- Model and prompt versions where available.
- Any prior reviewer decision on the same intake.

The reviewer can approve the recommendation, override the priority, return it for clarification, or reject it. Every decision must record actor, timestamp, previous value, new value, and reason. The original AI assessment remains unchanged.

## Allocation logic

The working MVP ordering rule is:

1. Handle P0 through the approved emergency/manual path, not ordinary queue ordering, unless the clinical policy explicitly says otherwise.
2. Order approved P1, P2, and P3 entries by priority band.
3. Preserve arrival or approval order within a band using one server-owned timestamp.
4. Do not let a client-provided timestamp or priority change queue order.

This is a proposed default to make integration concrete. Fairness rules, tie breaking, reassessment, maximum wait handling, doctor assignment, and whether approval time or arrival time is primary are `TBD`.

## Turn-wise doctor behavior

The doctor dashboard should expose a stable current turn and the next eligible approved turns. A turn is an operational queue position, not a clinical verdict or a guaranteed appointment time.

The backend should own transitions such as call, start consultation, complete, skip/no-show, and return to queue. Concurrency behavior when two staff members act on the same turn is `TBD`; it should be resolved before production.

## Safety and audit requirements

- An unapproved assessment cannot appear in the active doctor queue.
- A reviewer override cannot erase the original AI result.
- Queue actions are attributable to an authenticated actor.
- P0 handling is visible and cannot be hidden by an ordinary queue filter.
- Any manual reordering or reassignment requires an auditable reason.

## What the frontend may assume

The frontend may render queue data returned by the backend and request allowed actions. It must not calculate authoritative priority, allocate a turn locally, or infer that a patient is safe because the queue endpoint returned a result.
