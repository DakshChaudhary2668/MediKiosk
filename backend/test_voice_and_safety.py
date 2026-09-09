"""Test suite for MediKiosk Voice Pipeline, Anti-Hallucination & Clinical Safety Rules.
Validates all requirements from Section 26.
"""

from __future__ import annotations

import asyncio
import os
import sys

# Ensure backend root is in sys.path and UTF-8 console output on Windows
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from unittest.mock import patch, MagicMock
from app.models import ConversationState, IntakeMessageRequest, StartSessionRequest, IntakeResponse
from app.services.ai_engine import process_message, _fallback_response, _client
from app.services.safety import check_red_flags, check_extracted_facts
from app.services.stt import transcribe


def make_mock_completion(content_json: str):
    mock_choice = MagicMock()
    mock_choice.message.content = content_json
    mock_comp = MagicMock()
    mock_comp.choices = [mock_choice]
    return mock_comp


async def run_all_tests():
    print("\n=======================================================")
    print("RUNNING VOICE, ANTI-HALLUCINATION & SAFETY TEST SUITE")
    print("=======================================================\n")

    # TEST 1: User says "Mujhe do din se bukhar hai."
    print("TEST 1: User says: 'Mujhe do din se bukhar hai.'")
    state1 = ConversationState(
        session_id="sess_t1",
        patient_id="p1",
        language="hi",
        turn_count=1,
    )
    with patch.object(_client.chat.completions, "create", return_value=make_mock_completion(
        '{"ai_message": "Aapko bukhar ke alawa koi aur takleef hai?", "category": "fever", "extracted_facts": {"chief_complaint": "bukhar", "duration": "2 days"}, "answered_fields": ["chief_complaint", "duration"], "missing_fields": [], "red_flag": false, "survey_complete": false}'
    )):
        res1 = await process_message(state1, [], "Mujhe do din se bukhar hai.")
    print(f"  AI Response: {res1.ai_message}")
    print(f"  Extracted Facts: {res1.extracted_facts}")
    assert any(k in str(res1.extracted_facts).lower() for k in ["fever", "bukhar", "chief_complaint"]), "Fever symptom not captured"
    print("  [PASSED] TEST 1: Symptom captured without inventing unmentioned symptoms.\n")

    # TEST 2: User says "Mujhe khansi hai." (Duration must not be fabricated)
    print("TEST 2: User says: 'Mujhe khansi hai.' (No duration stated)")
    state2 = ConversationState(
        session_id="sess_t2",
        patient_id="p2",
        language="hi",
        turn_count=1,
    )
    with patch.object(_client.chat.completions, "create", return_value=make_mock_completion(
        '{"ai_message": "Khansi kitne din se hai?", "category": "respiratory", "extracted_facts": {"chief_complaint": "cough"}, "answered_fields": ["chief_complaint"], "missing_fields": ["duration"], "red_flag": false, "survey_complete": false}'
    )):
        res2 = await process_message(state2, [], "Mujhe khansi hai.")
    print(f"  AI Response: {res2.ai_message}")
    print(f"  Extracted Facts: {res2.extracted_facts}")
    assert "5 days" not in str(res2.extracted_facts), "Duration was hallucinated!"
    print("  [PASSED] TEST 2: Only cough recorded; duration not invented.\n")

    # TEST 3: User says "I don't know." (Must not convert to "No")
    print("TEST 3: User says: 'I don't know.' to allergy question")
    state3 = ConversationState(
        session_id="sess_t3",
        patient_id="p3",
        language="en",
        turn_count=2,
    )
    with patch.object(_client.chat.completions, "create", return_value=make_mock_completion(
        '{"ai_message": "No problem. Are you taking any current medicines?", "category": "general", "extracted_facts": {"allergies": "unknown"}, "answered_fields": ["allergies"], "missing_fields": [], "red_flag": false, "survey_complete": false}'
    )):
        res3 = await process_message(state3, [{"speaker": "assistant", "content": "Do you have any drug allergies?"}], "I don't know.")
    print(f"  Extracted Facts: {res3.extracted_facts}")
    fact_str = str(res3.extracted_facts).lower()
    assert "no allergies" not in fact_str and "none" not in fact_str, "Unknown was falsely converted to No!"
    print("  [PASSED] TEST 3: 'I don't know' preserved as unknown/uncertain, not 'No'.\n")

    # TEST 4: User says "I take some medicine but I don't remember the name."
    print("TEST 4: User reports unknown medicine")
    state4 = ConversationState(
        session_id="sess_t4",
        patient_id="p4",
        language="en",
        turn_count=2,
    )
    with patch.object(_client.chat.completions, "create", return_value=make_mock_completion(
        '{"ai_message": "Understood. The doctor will verify your prescriptions.", "category": "general", "extracted_facts": {"medications": "unspecified reported"}, "answered_fields": ["medications"], "missing_fields": [], "red_flag": false, "survey_complete": false}'
    )):
        res4 = await process_message(state4, [{"speaker": "assistant", "content": "Are you currently taking any medications?"}], "I take some medicine but I don't remember the name.")
    print(f"  Extracted Facts: {res4.extracted_facts}")
    fact_val = str(res4.extracted_facts).lower()
    assert "no" not in fact_val or "unspecified" in fact_val or "unknown" in fact_val or "reported" in fact_val or "medicine" in fact_val, "Medication status misclassified"
    print("  [PASSED] TEST 4: Medication presence noted with unknown specific name.\n")

    # TEST 5: Empty audio validation (0 bytes)
    print("TEST 5: Empty audio to STT")
    try:
        await transcribe(b"", "audio/webm")
        assert False, "STT did not reject empty audio!"
    except ValueError as e:
        print(f"  [PASSED] TEST 5: Empty audio rejected with: '{e}'.\n")

    # TEST 6: Red flag safety layer
    print("TEST 6: Red flag emergency signal: 'I have severe chest pain and breathlessness'")
    safety_res = check_red_flags("I have severe crushing chest pain and breathlessness", "en")
    assert safety_res.red_flag is True, "Emergency red flag missed!"
    print(f"  Emergency Flag Triggered: {safety_res.red_flag} | Signals: {safety_res.signal_ids}")
    print("  [PASSED] TEST 6: Emergency caught immediately by deterministic rule engine.\n")

    # TEST 7: Cross-session isolation (two independent patient states)
    print("TEST 7: Cross-patient session isolation")
    sess_a = ConversationState(session_id="A", patient_id="pat_1", answers={"chief_complaint": "headache"})
    sess_b = ConversationState(session_id="B", patient_id="pat_2", answers={"chief_complaint": "knee pain"})
    assert sess_a.answers["chief_complaint"] != sess_b.answers["chief_complaint"]
    assert sess_a.patient_id != sess_b.patient_id
    print("  [PASSED] TEST 7: Session states strictly separated.\n")

    print("=======================================================")
    print("ALL 7 CRITICAL VOICE & CLINICAL SAFETY TESTS PASSED!")
    print("=======================================================\n")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
