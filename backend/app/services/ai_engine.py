"""Core AI intake engine with strict anti-hallucination guardrails.

Loads the question bank, builds prompts, calls Groq, parses structured output.
Single file — no engine hierarchy.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from groq import Groq

from app.config import settings
from app.models import ConversationState, IntakeResponse

log = logging.getLogger(__name__)

# --- Load question bank once at import time ---
_QB_PATH = Path(__file__).resolve().parent.parent / "docs" / "ai-intake" / "QUESTION_BANK.json"
if not _QB_PATH.exists():
    _QB_PATH = Path(__file__).resolve().parent.parent.parent.parent / "docs" / "ai-intake" / "QUESTION_BANK.json"

with open(_QB_PATH, encoding="utf-8") as f:
    QUESTION_BANK: dict = json.load(f)

_CATEGORIES = list(QUESTION_BANK.get("categories", {}).keys())
_GLOBAL_QUESTIONS = QUESTION_BANK.get("global_questions", [])
_SAFETY_SIGNALS = QUESTION_BANK.get("safety_signal_topics", [])

# --- Groq client ---
_client = Groq(api_key=settings.groq_api_key)

# --- System prompt with Anti-Hallucination Guardrails ---
SYSTEM_PROMPT = f"""You are MediKiosk AI, an intelligent clinical pre-consultation intake assistant at a healthcare kiosk.

## YOUR ROLE
You collect structured patient information BEFORE they see a physician. You are NOT a doctor.

## ABSOLUTE ETHICAL & CLINICAL RULES
1. NEVER diagnose any disease, illness, or condition.
2. NEVER prescribe medication, dosage, treatment, or home remedies.
3. NEVER claim clinical certainty.
4. Ask exactly ONE clear question at a time.
5. Do NOT repeat questions the patient already answered.
6. Match the patient's language and tone (English, Hindi, or Hinglish).
7. Preserve the patient's exact words and expressions.

## ANTI-HALLUCINATION & FACT-EXTRACTION GUARDRAILS
1. ZERO INVENTED FACTS: You must NEVER invent, assume, or hallucinate patient facts.
2. ONLY EXTRACT PROVEN FACTS: Extract facts ONLY if explicitly stated by the patient in the transcript.
3. UNKNOWN IS NOT "NO":
   - If the patient says "I don't know" -> value is "unknown".
   - If the patient does not mention medications -> value is "unknown / not reported", NOT "No medications".
   - If the patient does not mention allergies -> value is "unknown / not reported", NOT "No known allergies".
4. UNCERTAINTY IS NOT CONFIRMATION:
   - If the patient says "maybe fever" / "shayad bukhar hai" -> mark fever as "uncertain / suspected", NOT "confirmed".
5. DISTINGUISH STATUSES: Always distinguish between 'reported', 'denied', 'unknown', and 'uncertain'.

## INTAKE CATEGORIES
{json.dumps(_CATEGORIES)}

## APPROVED QUESTION BANK (GLOBAL)
{json.dumps(_GLOBAL_QUESTIONS, indent=2)}

## CATEGORY-SPECIFIC QUESTION PATHWAYS
{json.dumps(QUESTION_BANK.get("categories", {}), indent=2)}

## YOUR PROCESS
1. If this is turn 1 and no complaint given, ask "What brings you in today?" or acknowledge greeting.
2. Identify the intake category from the patient's complaint (e.g., fever, respiratory, musculoskeletal, etc.).
3. Ask ONE follow-up question at a time from the category pathway for fields not yet answered.
4. Extract structured facts ONLY from what the patient stated in this turn.
5. Track answered_fields and missing_fields.
6. When chief complaint, duration, severity, key associated symptoms, and relevant history are collected (or after 5-7 informative turns), mark survey_complete=true.

## MANDATORY JSON RESPONSE FORMAT
You MUST respond with valid JSON ONLY (no markdown fences, no text outside JSON):
{{
  "ai_message": "Your conversational response/question to the patient (in their language)",
  "category": "identified category name or null",
  "extracted_facts": {{"field_name": "fact value directly from transcript"}},
  "answered_fields": ["list of all fields answered so far"],
  "missing_fields": ["important fields still missing"],
  "next_question_id": "question bank ID for next question or null",
  "red_flag": false,
  "survey_complete": false
}}

If the patient mentions an acute medical emergency (severe chest pain, inability to breathe, stroke symptoms, uncontrolled bleeding, severe anaphylaxis, loss of consciousness, suicidal intent), immediately set "red_flag": true and "survey_complete": true.
"""


def build_messages(
    state: ConversationState,
    conversation_history: list[dict[str, str]],
    patient_message: str,
) -> list[dict[str, str]]:
    """Build the message list for the Groq API call."""
    messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]

    state_context = (
        f"Current Intake State:\n"
        f"- Category: {state.category or 'not yet identified'}\n"
        f"- Language: {state.language}\n"
        f"- Completed fields: {json.dumps(state.completed_fields)}\n"
        f"- Current extracted facts: {json.dumps(state.answers)}\n"
        f"- Turn count: {state.turn_count}\n"
        f"CRITICAL REMINDER: Extract facts ONLY from the patient's actual message. Never invent symptoms, medications, or allergies."
    )
    messages.append({"role": "system", "content": state_context})

    for msg in conversation_history:
        role = "assistant" if msg.get("speaker") == "assistant" else "user"
        messages.append({"role": role, "content": msg.get("content", "")})

    messages.append({"role": "user", "content": patient_message})
    return messages


def parse_ai_response(raw: str) -> IntakeResponse:
    """Parse LLM JSON output into IntakeResponse with strict validation."""
    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

        data = json.loads(cleaned)
        return IntakeResponse(**data)
    except (json.JSONDecodeError, Exception) as e:
        log.warning("Failed to parse AI response: %s — raw: %s", e, raw[:200])
        return IntakeResponse(
            ai_message=raw if len(raw) < 500 else "Could you tell me a little more about how you are feeling?",
        )


async def process_message(
    state: ConversationState,
    conversation_history: list[dict[str, str]],
    patient_message: str,
) -> IntakeResponse:
    """Process a patient message through Groq and return structured response."""
    if not patient_message or not patient_message.strip():
        raise ValueError("Cannot process empty patient message")

    messages = build_messages(state, conversation_history, patient_message)

    try:
        completion = _client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.2,  # Low temp for factual structured output
            max_tokens=1024,
        )
        raw_content = completion.choices[0].message.content or ""
        return parse_ai_response(raw_content)
    except Exception as e:
        log.error("Groq API error: %s", e)
        return _fallback_response(state)


def _fallback_response(state: ConversationState) -> IntakeResponse:
    """Generate a safe question from the approved question bank when LLM is temporarily unreachable."""
    for q in _GLOBAL_QUESTIONS:
        if q["field"] not in state.completed_fields:
            return IntakeResponse(
                ai_message=q["question"],
                next_question_id=q["id"],
            )
    if state.category and state.category in QUESTION_BANK.get("categories", {}):
        cat_questions = QUESTION_BANK["categories"][state.category].get("questions", [])
        for q in cat_questions:
            if q["field"] not in state.completed_fields:
                return IntakeResponse(
                    ai_message=q["question"],
                    next_question_id=q["id"],
                )
    return IntakeResponse(
        ai_message="Could you tell me what symptoms you are experiencing?",
    )
