# AI Pre-Triage And Safety Layer

## Role of the AI Engine

The AI Engine is an advisory pre-triage service. It converts an approved intake payload into a structured recommendation for a human reviewer. It does not diagnose, prescribe, admit a patient to a queue, or replace a doctor.

The backend must treat every AI response as untrusted input until it passes schema validation, safety checks, and the human review gate.

## P0-P3 operational semantics

These labels are MVP operational priority bands, not diagnoses. The clinical meaning, examples, and response SLAs must be approved by a clinical/operations owner before production use.

| Band | Working meaning | Queue/review behavior |
| --- | --- | --- |
| P0 | Possible immediate danger or emergency signal. | Escalate for immediate human handling; do not place into the ordinary queue by default. Exact emergency path is `TBD`. |
| P1 | Very urgent concern that should receive same-session priority. | Require expedited Super Admin review and priority handling after approval. SLA is `TBD`. |
| P2 | Urgent but not currently identified as immediate danger. | Enter the approved priority queue after review. |
| P3 | Routine or lower-urgency concern based on the available intake. | Enter the standard approved queue after review. |

The model must be allowed to return `needs_human_review` or an equivalent state when it cannot safely assign a band. A P0-looking signal should be represented as a safety flag even if confidence is low.

## Minimum logical output

The following is a logical contract, not a locked serializer or route schema. Field names and types must be finalized jointly by Harry and the backend owner.

```json
{
  "assessment_id": "server-or-engine-generated-id",
  "intake_id": "server-generated-id",
  "priority": "P2",
  "confidence_band": "medium",
  "confidence_score": 0.0,
  "uncertainty": {
    "needs_human_review": false,
    "reasons": [],
    "missing_information": [],
    "contradictions": []
  },
  "safety_flags": [],
  "evidence": [
    {
      "source": "patient_intake",
      "field": "symptom_description",
      "summary": "Short supporting observation"
    }
  ],
  "recommended_next_action": "human_review",
  "model": {
    "name": "TBD",
    "version": "TBD",
    "prompt_version": "TBD"
  },
  "generated_at": "server timestamp"
}
```

The example uses placeholder values to show shape only. The engine must not return fabricated evidence, unsupported certainty, or treatment instructions.

## Uncertainty and confidence rules

- Confidence is about the model's confidence in the operational band, not the patient's health or outcome.
- A numeric score must not be shown as clinically precise until calibration is defined; a confidence band plus reasons is safer for the MVP.
- Low confidence, missing critical answers, conflicting answers, unsupported language, or parser/model failure must force human review.
- Safety flags must survive the review and queue lifecycle, even when a reviewer overrides the priority.
- The backend stores the original AI output and the human decision separately.

## Input boundary

The backend should send only the minimum intake and context needed for the assessment. Patient identity should be represented by a stable internal reference where possible. Exact fields, language support, transcript retention, and whether historical records are sent to the model are `TBD`.

## AI failure behavior

Malformed output, timeout, unavailable provider, or schema mismatch results in a reviewable failure state. The system must never default to P3 merely because the model failed. Retry count, timeout, provider fallback, and redaction behavior are open decisions.

## Acceptance criteria for Harry's migration

- The engine exposes a versioned pre-triage response matching the agreed contract.
- The response includes uncertainty and safety information, not only a priority label.
- The engine has no queue mutation capability.
- The engine can represent uncertainty instead of forcing P0-P3.
- The backend can correlate each request and response to an intake and model version.
