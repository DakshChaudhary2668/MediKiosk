# Testing Documentation & Verification Guide

MediKiosk maintains automated test suites covering unit-level logic, anti-hallucination guardrails, conversational state transitions, Super Admin triage review gates, RBAC isolation, walk-up kiosk auth, and live HTTP end-to-end clinical workflows.

---

## 🧪 Test Suites Overview

| Test File | Scope | Execution Command | Description |
| :--- | :--- | :--- | :--- |
| `backend/test_rbac_and_contracts.py` | **RBAC, P0 Invariants & Contracts** | `pytest -v test_rbac_and_contracts.py` | 11 automated tests verifying P0 emergency auto-escalation, priority ordering, mandatory override reasons, RBAC isolation, kiosk auth, dual `/api/v1` parity, and demo seeder. |
| `backend/test_voice_and_safety.py` | **Anti-Hallucination & Safety** | `python test_voice_and_safety.py` | 7 clinical safety tests validating that symptoms are captured without hallucinating unstated durations, preserves "I don't know" as unknown, rejects empty audio, and triggers deterministic red flags. |
| `backend/test_triage_and_queue.py` | **End-to-End Clinical Flow** | `python test_triage_and_queue.py` | Tests full clinical workflow: AI Pre-Triage calculation -> Super Admin review approval -> Token generation -> Doctor priority queue -> Turn call -> Consultation & Digital Rx release. |
| `backend/test_backend.py` | **Unit & Router Tests** | `python test_backend.py` | Tests question bank loading, red-flag triggers in English/Hindi, AI engine prompt construction & JSON fallback, and FastAPI route registration. |
| `backend/test_dev_server_live.py` | **Live Integration** | `python test_dev_server_live.py` | Executes real HTTP calls against a live running FastAPI server on port 8000 and Next.js on port 3000. |

---

## 🔍 Detailed Test Cases in `test_rbac_and_contracts.py`

1. **`test_p0_intake_auto_escalation_and_events`:**
   - Verifies that when an intake message triggers an acute emergency red flag, the session immediately transitions to `p0_escalated` and an emergency timeline record is written to `emergency_events` without requiring Admin review.
2. **`test_p0_banned_from_normal_doctor_queue`:**
   - Verifies that approving a P0 case into the normal doctor queue is blocked with HTTP 400, and `enqueue_doctor_item()` strictly raises `ValueError`.
3. **`test_queue_priority_ordering_p1_p2_p3`:**
   - Validates that patients in the active doctor queue are strictly sorted: all P1 before P2, all P2 before P3, and FIFO within the same priority.
4. **`test_triage_override_requires_reason`:**
   - Validates that attempting to override priority without an explicit `override_reason` returns HTTP 400, and providing a valid reason succeeds.
5. **`test_rbac_patient_cannot_access_doctor_or_admin_routes`:**
   - Validates that patient bearer tokens receive HTTP 403 Forbidden when attempting to access `/api/doctor/queue` or `/api/triage/pending`.
6. **`test_rbac_doctor_cannot_access_admin_triage`:**
   - Validates that doctor bearer tokens receive HTTP 403 Forbidden when attempting to access `/api/triage/pending`.
7. **`test_patient_session_isolation`:**
   - Validates that Patient A receives HTTP 403 when attempting to view or complete Patient B's intake session.
8. **`test_prescription_and_consultation_reconciliation`:**
   - Validates that prescriptions accepting either `medicine_name` or `medication_name` reconcile cleanly with duration days.
9. **`test_api_v1_route_parity`:**
   - Validates that routes under `/api/v1/*` behave identically to `/api/*` endpoints.
10. **`test_demo_seed_endpoint_and_deterministic_cases`:**
    - Validates that `POST /api/triage/seed-demo` seeds P0, P1, P2, P3 cases with emergency timeline and doctor assignments.
11. **`test_kiosk_auth_walkup_flow`:**
    - Validates that walk-up kiosks can poll `/api/patient/queue-status` anonymously, and kiosk tokens map to role `patient` while blocked from doctor/admin routes.

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
   - *Verification:* Asserts immediate rejection without calling speech APIs or LLM.
6. **TEST 6: Deterministic Emergency Red Flag**
   - *Input:* `"I have severe chest pain and breathlessness"`
   - *Verification:* Asserts regex pattern `possible_acute_chest_emergency` fires immediately, setting `red_flag = True`.
7. **TEST 7: Cross-Patient Session Isolation**
   - *Input:* Two distinct patient sessions (`sess_a` and `sess_b`).
   - *Verification:* Asserts conversational state and extracted facts remain completely isolated.

---

## 🚀 How to Execute All Backend Tests Locally

```powershell
cd backend

# 1. Run RBAC, Contracts & Invariants Suite (11 tests)
.\.venv\Scripts\pytest.exe -v test_rbac_and_contracts.py

# 2. Run Voice & Anti-Hallucination Suite (7 tests)
.\.venv\Scripts\python.exe test_voice_and_safety.py

# 3. Run End-to-End Triage & Queue Workflow
.\.venv\Scripts\python.exe test_triage_and_queue.py

# 4. Run Core Backend Logic & Question Bank Tests (4 tests)
.\.venv\Scripts\python.exe test_backend.py
```

*Verification Result: All 4 test suites pass with 100% success rate.*
