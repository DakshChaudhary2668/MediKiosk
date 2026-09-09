"""Deterministic red-flag safety layer.

Runs BEFORE the LLM on every patient message (keyword scan)
and AFTER the LLM on extracted facts. Rule-based, not model-based.
"""

from __future__ import annotations

import re

from app.models import RedFlagResult

# --- Medically-reviewed keyword patterns ---
# Each tuple: (signal_id, compiled regex pattern)
# These match the safety_signal_topics in QUESTION_BANK.json

_RED_FLAG_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    (
        "possible_severe_breathing_problem",
        re.compile(
            r"\b(can'?t\s+breathe|cannot\s+breathe|unable\s+to\s+breathe|"
            r"saans\s+nahi|breathing\s+(very\s+)?difficult|"
            r"severe\s+breathing|suffocat\w*|choking|gasping)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "possible_acute_chest_emergency",
        re.compile(
            r"\b(chest\s+pain|seene\s+mein\s+dard|chest\s+pressure|"
            r"chest\s+tight\w*|heart\s+attack|crushing\s+chest|"
            r"heavy\s+chest|dil\s+ka\s+daura)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "possible_acute_neurological_event",
        re.compile(
            r"\b(sudden\s+weakness|sudden\s+numbness|can'?t\s+speak|"
            r"cannot\s+speak|slurr\w*|face\s+droop\w*|stroke|"
            r"paralysis|one\s+side\s+(of\s+)?(body|face)\s+(weak|numb)|"
            r"sudden\s+vision\s+loss|aankh\s+se\s+dikhai\s+nahi)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "possible_severe_acute_condition",
        re.compile(
            r"\b(faint\w*|unconscious|behosh|passed?\s+out|seizure|"
            r"fitting|collapse|unresponsive|"
            r"severe\s+bleed\w*|blood\s+(won'?t|does\s*n'?t|not|\w+)?\s*stop|"
            r"suicid\w*|self.?harm|kill\s+my\s*self|marna\s+chahta)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "possible_severe_allergic_reaction",
        re.compile(
            r"\b(throat\s+swell\w*|tongue\s+swell\w*|face\s+swell\w*|"
            r"anaphyla\w*|can'?t\s+swallow|lips?\s+swell\w*|hives\s+everywhere)\b",
            re.IGNORECASE,
        ),
    ),
]

_EMERGENCY_MESSAGE = (
    "⚠️ Based on what you've described, this may require immediate medical attention. "
    "Please seek emergency care right away — visit your nearest emergency room or call emergency services. "
    "This system cannot replace emergency medical care."
)

_EMERGENCY_MESSAGE_HI = (
    "⚠️ आपने जो बताया है उसके आधार पर, आपको तुरंत चिकित्सा सहायता की आवश्यकता हो सकती है। "
    "कृपया तुरंत नजदीकी अस्पताल के आपातकालीन विभाग में जाएं या एम्बुलेंस बुलाएं।"
)


def check_red_flags(text: str, language: str = "en") -> RedFlagResult:
    """Scan patient text for emergency/red-flag patterns.

    Returns immediately on first match — no need to collect all signals
    since any single red flag triggers the same escalation path.
    """
    if not text or not text.strip():
        return RedFlagResult()

    matched_ids: list[str] = []
    for signal_id, pattern in _RED_FLAG_PATTERNS:
        if pattern.search(text):
            matched_ids.append(signal_id)

    if not matched_ids:
        return RedFlagResult()

    msg = _EMERGENCY_MESSAGE_HI if language in ("hi", "hinglish") else _EMERGENCY_MESSAGE
    return RedFlagResult(red_flag=True, signal_ids=matched_ids, message=msg)


def check_extracted_facts(facts: dict, language: str = "en") -> RedFlagResult:
    """Check structured facts extracted by LLM for red-flag signals."""
    # Flatten all string values from facts dict and scan them
    text_parts: list[str] = []
    for v in facts.values():
        if isinstance(v, str):
            text_parts.append(v)
        elif isinstance(v, list):
            text_parts.extend(str(item) for item in v)
    combined = " ".join(text_parts)
    return check_red_flags(combined, language)
