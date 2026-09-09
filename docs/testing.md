# Testing Documentation & Verification Guide

MediKiosk maintains automated test suites covering unit-level logic, anti-hallucination guardrails, conversational state transitions, Super Admin triage review gates, and live HTTP end-to-end clinical workflows.

---

## 🧪 Test Suites Overview

| Test File | Scope | Execution Command | Description |
| :--- | :--- | :--- | :--- |
| `backend/test_voice_and_safety.py` | **Anti-Hallucination & Safety** | `python test_voice_and_safety.py` | Validates that symptoms are captured accurately without hallucinating unstated durations, preserves "I don't know" as unknown, rejects empty audio, and triggers deterministic red flags. |
| `backend/test_triage_and_queue.py` | **End-to-End Clinical Flow** | `python test_triage_and_queue.py` | Tests full clinical workflow: AI Pre-Triage calculation -> Super Admin review approval -> Token generation -> Doctor priority queue -> Turn call -> Consultation & Digital Rx release. |
| `backend/test_backend.py` | **Unit & Router Tests** | `pytest test_backend.py` | Tests auth endpoints, profile update validation, fallback questionnaire progression, and error response shapes. |
| `backend/test_dev_server_live.py` | **Live Integration** | `python test_dev_server_live.py` | Executes real HTTP calls against a live running FastAPI server on port 8000. |

---

## 🔍 Detailed Test Cases in `test_voice_and_safety.py`

1. **TEST 1: Symptom Capture without Fabrication**
   - *Input:* `"Mujhe do din se bukhar hai."` (Hindi)
   - *Verification:* Verifies fever symptom and 2-day duration are extracted without inventing unmentioned complaints.
2. **TEST 2: Duration Non-Fabrication**
   - *Input:* `"Mujhe khansi hai."` (No duration stated)
   - *Verification:* Asserts duration is **not** fabricated or hallucinated.
3. **TEST 3: "I don't know" $\neq$ "No"**
   - *Input:* Patient responds `"I don't know."` to allergy question.
   - *Verification:* Asserts extracted allergies status remains `unknown` / `uncertain` and is **never** converted to "No known allergies".
4. **TEST 4: Unspecified Medication Reporting**
   - *Input:* `"I take some medicine but I don't remember the name."`
   - *Verification:* Asserts medication presence is recorded as `unspecified` / `unknown` rather than denied.
5. **TEST 5: Empty Audio Rejection (0 bytes)**
   - *Input:* Zero-byte audio stream sent to `transcribe()`.
   - *Verification:* Asserts immediate `ValueError` rejection without calling speech APIs or LLM.
6. **TEST 6: Deterministic Emergency Red Flag**
   - *Input:* `"I have severe crushing chest pain and breathlessness"`
   - *Verification:* Asserts regex pattern `possible_acute_chest_emergency` fires immediately, setting `red_flag = True`.
7. **TEST 7: Cross-Session Isolation**
   - *Input:* Two distinct patient sessions (`sess_a` and `sess_b`).
   - *Verification:* Asserts conversational state and extracted facts remain completely isolated.

---

## 🚀 How to Execute Tests Locally

### 1. Run Clinical Safety & Anti-Hallucination Suite
```powershell
cd backend
.\venv\Scripts\python.exe test_voice_and_safety.py
```
*Expected Output:*
```
=======================================================
RUNNING VOICE, ANTI-HALLUCINATION & SAFETY TEST SUITE
=======================================================
TEST 1: [PASSED]
TEST 2: [PASSED]
TEST 3: [PASSED]
TEST 4: [PASSED]
TEST 5: [PASSED]
TEST 6: [PASSED]
TEST 7: [PASSED]
=======================================================
ALL 7 CRITICAL VOICE & CLINICAL SAFETY TESTS PASSED!
=======================================================
```

### 2. Run End-to-End Triage & Doctor Queue Suite
```powershell
cd backend
.\venv\Scripts\python.exe test_triage_and_queue.py
```
*Expected Output:*
```
=== 1. TESTING AI PRE-TRIAGE ENGINE ===
✅ Pre-Triage Generated: Priority=P0 (Confidence: high)
=== 2. TESTING SUPER ADMIN TRIAGE REVIEW GATE ===
✅ Admin Approved: Token #101
=== 3. TESTING DOCTOR TURN QUEUE ===
✅ Doctor Calling: called
=== 4. TESTING DOCTOR CONSULTATION & DIGITAL RX ===
✅ Consultation Completed: ID=consult_...
🎉 ALL END-TO-END CLINICAL WORKFLOW TESTS PASSED!
```

---

## 📊 Test Coverage & Untested Areas

- **Covered:**
  - AI pre-triage acuity calculation.
  - Deterministic red-flag emergency regexes.
  - Conversational fact extraction and question bank fallbacks.
  - Super Admin approval/override state transitions.
  - Doctor turn call lifecycle and prescription record creation.
  - Audio byte length validation.
- **Areas for Expanded Testing (Technical Roadmap):**
  - E2E browser automation using Playwright/Cypress for physical audio recording simulation.
  - Load testing on concurrent Groq API turns (simulating 50+ simultaneous kiosk booths).
  - PostgreSQL transaction concurrency testing for token counter assignment.
