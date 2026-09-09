"""Automated verification script for MediKiosk backend.
Tests:
1. Question bank loading
2. Deterministic safety layer (red flag detections)
3. AI engine prompt assembly and fallback responses
4. FastAPI application routing & endpoints
"""

from __future__ import annotations

import sys
from app.main import app
from app.models import (
    ConversationState,
    IntakeResponse,
    PatientCase,
    RedFlagResult,
)
from app.services.ai_engine import (
    QUESTION_BANK,
    _CATEGORIES,
    _GLOBAL_QUESTIONS,
    build_messages,
    _fallback_response,
    parse_ai_response,
)
from app.services.safety import check_red_flags, check_extracted_facts


def test_question_bank():
    print("Testing Question Bank loading...")
    assert "categories" in QUESTION_BANK, "Missing categories in question bank"
    assert "usage_rules" in QUESTION_BANK, "Missing usage_rules"
    assert len(QUESTION_BANK["categories"]) >= 8, f"Expected at least 8 categories, got {len(QUESTION_BANK['categories'])}"
    assert len(_CATEGORIES) >= 8, "Expected categories list"
    assert len(_GLOBAL_QUESTIONS) > 0, "Expected global questions"
    print(f"  [OK] Loaded {len(QUESTION_BANK['categories'])} categories from question bank.")


def test_safety_layer():
    print("Testing Safety / Red Flag Detection...")
    
    # Test positive red flags
    emergency_inputs = [
        ("I have severe crushing chest pain radiating to my left arm", "cardiac"),
        ("Patient is struggling to breathe, gasping for air", "respiratory"),
        ("Sudden face droop and slurred speech since 20 minutes ago", "neurological"),
        ("Severe bleeding that does not stop", "hemorrhage"),
        ("I feel suicidal and want to kill myself", "psychiatric"),
        ("Throat swelling and unable to breathe", "allergic"),
        ("Mujhe seene mein dard ho raha hai bahut tez", "hindi_chest_pain"),
    ]
    
    for text, tag in emergency_inputs:
        lang = "hi" if "seene" in text else "en"
        res = check_red_flags(text, language=lang)
        assert res.red_flag is True, f"Failed to detect red flag for: '{text}'"
        assert len(res.signal_ids) > 0, f"Expected matched signals for: '{text}'"
        assert res.message != "", "Missing emergency message"
    print("  [OK] Correctly flagged all 7 critical emergency test cases (English & Hindi).")

    # Test non-emergency inputs (normal symptoms)
    safe_inputs = [
        "I have a mild runny nose and cough since yesterday",
        "My right knee hurts when I walk for too long",
        "I need a general checkup for my diabetes refill",
    ]
    for text in safe_inputs:
        res = check_red_flags(text, language="en")
        assert res.red_flag is False, f"False positive red flag for safe input: '{text}'"
    print("  [OK] Correctly passed all 3 safe routine symptom inputs without false alarms.")


def test_ai_engine():
    print("Testing AI Engine prompt construction & fallback...")
    state = ConversationState(
        session_id="test-123",
        patient_id="patient-456",
        category="cardiovascular",
        language="en",
        turn_count=2,
        completed_fields=["chief_complaint"],
        pending_fields=["duration", "severity", "radiation"],
        answers={"chief_complaint": "chest tightness"},
    )
    messages = build_messages(state, [{"speaker": "assistant", "content": "Hello"}], "I feel chest pressure")
    assert len(messages) >= 3, "Expected system + history + user messages"
    assert messages[0]["role"] == "system", "First message should be system prompt"
    assert "MediKiosk" in messages[0]["content"], "System prompt missing MediKiosk persona"

    # Test parser
    sample_json = '{"ai_message": "How long have you had this?", "category": "cardiovascular", "answered_fields": ["chief_complaint"], "missing_fields": ["duration"], "red_flag": false, "survey_complete": false}'
    parsed = parse_ai_response(sample_json)
    assert parsed.ai_message == "How long have you had this?"
    assert parsed.category == "cardiovascular"

    # Test fallback
    fb = _fallback_response(state)
    assert fb.ai_message != "", "Fallback should provide a question"
    print("  [OK] AI engine prompt builder, JSON parser, and fallback work perfectly.")


def test_fastapi_routes():
    print("Testing FastAPI Route Registration...")
    routes = list(app.openapi()["paths"].keys())
    expected_routes = [
        "/health",
        "/api/auth/register",
        "/api/auth/login",
        "/api/auth/me",
        "/api/patient/profile",
        "/api/patient/consent",
        "/api/patient/sessions",
        "/api/patient/documents/upload",
        "/api/patient/documents",
        "/api/intake/session",
        "/api/intake/message",
        "/api/intake/voice",
        "/api/intake/session/{session_id}",
        "/api/intake/session/{session_id}/complete",
    ]
    for er in expected_routes:
        assert er in routes, f"Missing route in FastAPI app: {er}"
    print(f"  [OK] Verified all {len(expected_routes)} API routes are mounted.")


if __name__ == "__main__":
    print("=== RUNNING BACKEND INTEGRATION & LOGIC TESTS ===")
    test_question_bank()
    test_safety_layer()
    test_ai_engine()
    test_fastapi_routes()
    print("=== ALL BACKEND TESTS PASSED SUCCESSFULLY! ===")
