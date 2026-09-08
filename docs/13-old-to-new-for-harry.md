# AI Engine Migration: Old Flow To New Flow

## Why this exists

Harry is already working on the AI Engine and may have implemented the earlier flow. This document is the explicit migration note. Treat the new flow below as authoritative for the MediKiosk MVP.

The old flow is described as a legacy assumption because no source repository was available in the supplied workspace. Before changing code, compare these items with the current implementation and preserve any useful parsing logic that does not violate the new boundaries.

## Change log

| Legacy assumption to replace | New MVP contract |
| --- | --- |
| AI decides the patient's final priority or clinical outcome. | AI produces an advisory pre-triage recommendation only. A human reviews it; the doctor makes the clinical decision. |
| AI output can directly create a queue entry. | AI output is persisted as an assessment. Only a Super Admin-approved decision can create an active queue entry. |
| A priority label is enough. | Response includes priority or uncertainty, confidence context, missing information, contradictions, safety flags, evidence, and model/version metadata. |
| Low confidence can silently fall back to a normal queue priority. | Low confidence, malformed output, missing critical data, or model failure forces human review. No silent P3 default. |
| The model owns workflow state. | FastAPI owns workflow, queue state, authorization, timestamps, and audit events. |
| The AI service can mutate application data. | The AI Engine has no queue/database mutation capability in its contract. |
| Historical records can be treated as current truth. | Records are evidence/context with source, author, timestamp, and freshness considered by humans. |
| Swytchcode may sit in the MVP execution path. | Swytchcode is explicitly out of MVP scope. |

## Migration checklist

- [ ] Identify the old input and output schema.
- [ ] Separate parsing/transcription from pre-triage policy.
- [ ] Add a versioned contract identifier and request correlation ID.
- [ ] Return P0/P1/P2/P3 only as operational recommendations, or return an explicit uncertainty state.
- [ ] Add confidence/uncertainty, missing information, contradiction, safety flag, evidence, and model metadata fields.
- [ ] Remove any code path that calls queue mutation or persists a final queue decision from the AI Engine.
- [ ] Ensure malformed/timeout/provider failures are represented as reviewable failures.
- [ ] Add deterministic fixtures for clear P0/P1/P2/P3 examples only after clinical/operations review approves them.
- [ ] Send the minimum necessary patient context and document transcript/history handling.
- [ ] Align with the backend owner on field names before freezing implementation types.

## Definition of done for the AI side

The AI Engine is ready for integration when the backend can call it as a versioned, bounded, advisory service; validate its response; preserve uncertainty and safety information; correlate the result to an intake; and keep queue admission entirely outside the engine.

## Questions for Harry and the backend owner

- What is the current old-flow schema and where is it implemented?
- Which model/provider and version metadata can be returned reliably?
- How are transcripts and unsupported languages represented?
- What timeout, retry, and idempotency behavior does the engine need?
- Which confidence representation can be defended, and who approves calibration?
- Which clinical examples are approved for P0-P3 fixtures?
