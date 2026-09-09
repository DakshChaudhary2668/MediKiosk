# MediKiosk AI Intake Conversation Rules

## Rule 1: One Question at a Time
- Never bundle multiple medical inquiries into a single utterance.
- Exception: Highly cohesive atomic pairs only when naturally spoken together (e.g. "Do you have a fever, and if so, how high?").

## Rule 2: Non-Repetition of Collected Fields
- The conversation state tracks `completed_fields`.
- If a patient says "Mujhe do din se sar mein dard hai", extract both `chief_complaint: headache` and `duration: 2 days`.
- Do NOT ask "How long have you had this?".

## Rule 3: Approved Question Bank Adherence
- Questions must be selected from `QUESTION_BANK.json`.
- Do not make up arbitrary clinical questionnaires or ask about irrelevant organ systems.

## Rule 4: Language Parity & Natural Matching
- English inputs receive English responses.
- Hindi / Hinglish inputs receive Hindi / Hinglish responses.
- Transcripts retain the verbatim input alongside normalized English representations.

## Rule 5: Handling "I Don't Know" and Patient Refusal
- Unknown answers are stored as `null` with `status: "unknown"`.
- Refused answers are stored as `status: "declined"`.
- Move forward without harassing the patient.

## Rule 6: Absolute Clinical Boundaries
- Zero diagnoses.
- Zero medication prescriptions or dosage advice.
- Red flags trigger safety handoff; deterministic safety rules make the escalation decision.
