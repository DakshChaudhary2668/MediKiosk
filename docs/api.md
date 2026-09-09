# API Reference & OpenAPI Specification

All endpoints are served by FastAPI (`app/main.py`) and proxied via Next.js at `/api/*`. Additionally, all routes are mirrored under `/api/v1/*` for canonical specification parity.

---

## 🔐 1. Authentication & RBAC Domain

### `POST /api/auth/register`
Creates a new patient account in Supabase GoTrue and inserts a profile record.
- **Auth:** None (Public)
- **Role:** Any
- **Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "SecurePassword123!",
  "full_name": "Jane Doe",
  "role": "patient"
}
```
- **Response `200 OK`:**
```json
{
  "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "email": "patient@example.com",
  "message": "Registration successful"
}
```
- **Error `400 Bad Request`:** Registration failed / email already exists.

---

### `POST /api/auth/login`
Authenticates credentials and returns JWT access tokens with user role.
- **Auth:** None (Public)
- **Role:** Any
- **Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "SecurePassword123!"
}
```
- **Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
  "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "email": "patient@example.com",
  "role": "patient"
}
```
- **Error `401 Unauthorized`:** Invalid email or password.

---

### `GET /api/auth/me`
Retrieves identity and role information for the active token.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** Any authenticated user or walk-up kiosk
- **Response `200 OK`:**
```json
{
  "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "email": "patient@example.com",
  "role": "patient"
}
```
- **Error `401 Unauthorized`:** Missing or invalid Bearer token.

---

## 👤 2. Patient Domain

### `GET /api/patient/profile`
Fetches patient demographic profile.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** Patient / Admin
- **Response `200 OK`:**
```json
{
  "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "full_name": "Jane Doe",
  "age": 34,
  "gender": "female",
  "blood_group": "B+",
  "phone": "+91 9876543210",
  "emergency_contact": "John Doe - 9876543211",
  "consent_given": true,
  "consent_given_at": "2026-09-09T10:00:00Z"
}
```

---

### `POST /api/patient/profile`
Updates demographic fields.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** Patient / Admin
- **Request Body:**
```json
{
  "full_name": "Jane Doe",
  "age": 34,
  "gender": "female",
  "blood_group": "B+",
  "phone": "+91 9876543210",
  "emergency_contact": "John Doe - 9876543211"
}
```
- **Response `200 OK`:** Profile updated dictionary.

---

### `POST /api/patient/consent`
Records mandatory medical AI consent declaration.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** Patient
- **Request Body:** `{"consent_given": true}`
- **Response `200 OK`:** `{"consent_given": true, "consent_given_at": "2026-09-09T10:00:00Z"}`

---

### `GET /api/patient/sessions`
Lists all past and active intake sessions for the authenticated patient.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** Patient / Admin
- **Response `200 OK`:** Array of session objects.

---

### `POST /api/patient/documents/upload`
Uploads medical report (PDF or image) to Supabase Storage bucket `medical-documents`.
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Role:** Patient
- **Form Data:** `file`: binary document file.
- **Response `200 OK`:**
```json
{
  "id": "doc_uuid_123",
  "file_name": "blood_report.pdf",
  "file_url": "https://supabase.co/storage/v1/object/public/medical-documents/patient-id/blood_report.pdf",
  "file_size": 1048576,
  "uploaded_at": "2026-09-09T10:00:00Z"
}
```

---

## 💬 3. Conversational Intake & AI Domain

### `POST /api/intake/session`
Initializes a new conversational intake session.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** Patient / Kiosk
- **Request Body:**
```json
{
  "language": "en",
  "category": null
}
```
- **Response `200 OK`:**
```json
{
  "session_id": "c56a4180-65aa-42ec-a945-5fd21dec0538",
  "status": "active",
  "language": "en",
  "initial_message": "Hello! I am your MediKiosk intake assistant. What brings you to the hospital today?"
}
```

---

### `POST /api/intake/message`
Processes patient conversational turn (Text Mode). Runs deterministic red-flag screening before and after LLM inference.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** Patient / Kiosk
- **Request Body:**
```json
{
  "session_id": "c56a4180-65aa-42ec-a945-5fd21dec0538",
  "message": "I have had a severe dry cough for 3 days and fever since yesterday.",
  "input_mode": "text"
}
```
- **Response `200 OK` (Normal Turn):**
```json
{
  "ai_message": "Have you noticed any shortness of breath, wheezing, or chest pain with this cough?",
  "red_flag": false,
  "signal_ids": [],
  "survey_complete": false,
  "session_status": "active"
}
```
- **Response `200 OK` (P0 Emergency Red Flag Detected):**
```json
{
  "ai_message": "EMERGENCY ALERT: Severe acute symptoms detected. Immediate medical intervention required.",
  "red_flag": true,
  "signal_ids": ["acute_chest_pain_diaphoresis"],
  "survey_complete": true,
  "priority": "P0",
  "session_status": "p0_escalated"
}
```

---

### `POST /api/intake/voice`
Processes microphone audio bytes via Sarvam Saaras STT, Groq LLM, and Sarvam Bulbul TTS.
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Role:** Patient / Kiosk
- **Form Data:**
  - `session_id`: `"c56a4180-65aa-42ec-a945-5fd21dec0538"`
  - `audio`: `<audio/webm binary>`
- **Response `200 OK`:**
```json
{
  "ai_message": "Do you have any difficulty breathing or chest tightness?",
  "transcript": "I have had a severe cough for three days.",
  "category": "respiratory",
  "red_flag": false,
  "survey_complete": false,
  "session_status": "active",
  "tts_audio": "UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ..."
}
```
- **Error `422 Unprocessable Entity`:** Audio empty or under 100 bytes.

---

### `POST /api/intake/submit`
Batch intake submission for fast-track or completed survey contracts.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** Patient / Kiosk
- **Request Body:**
```json
{
  "intake_id": "intake-9901",
  "language": "en",
  "category": "respiratory",
  "survey_answers": {
    "chief_complaint": "Severe productive cough",
    "duration": "3 days",
    "severity": 6
  }
}
```
- **Response `200 OK`:**
```json
{
  "intake_id": "intake-9901",
  "status": "intake_submitted",
  "submitted_at": "2026-09-09T10:00:00Z"
}
```

---

### `GET /api/intake/session/{session_id}`
Retrieves session metadata, conversational transcript, and synthesized `PatientCase`.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** Patient / Doctor / Admin (Session isolated: patients can only access own sessions)
- **Response `200 OK`:**
```json
{
  "session_id": "c56a4180-65aa-42ec-a945-5fd21dec0538",
  "status": "completed",
  "session": { "id": "c56a4180...", "patient_id": "pat-101", "status": "completed" },
  "messages": [
    {"speaker": "assistant", "content": "What brings you in today?"},
    {"speaker": "patient", "content": "Severe cough and mild fever."}
  ],
  "case": {
    "chief_complaint": "Severe cough and mild fever",
    "category": "respiratory",
    "duration": "3 days",
    "severity": 6,
    "symptoms": ["cough", "fever"],
    "allergies": ["NKDA"],
    "red_flag_detected": false
  }
}
```

---

## 🛡️ 4. Super Admin Clinical Triage Gate Domain

### `POST /api/triage/seed-demo`
Deterministically seeds clinical test cases covering **P0, P1, P2, and P3**:
- P0 cases auto-escalate directly to the `emergency_events` timeline with zero admin gating.
- P1, P2, and P3 cases enter the doctor queue with unique tokens and assigned physicians.
- **Auth:** Public / Admin
- **Role:** Any (Permits demo initialization)
- **Response `200 OK`:**
```json
{
  "status": "seeded",
  "cases": ["demo-sess-001", "demo-sess-002", "demo-sess-003", "demo-sess-004", "demo-sess-005"],
  "p0_active": 2,
  "total_queued": 3
}
```

---

### `GET /api/triage/pending`
Lists all patient cases awaiting Super Admin review (`awaiting_review`, `p0_escalated`, `assessment_failed`), sorted with P0 on top.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** `admin` (Strictly enforced: returns 403 for patient or doctor)
- **Response `200 OK`:**
```json
[
  {
    "assessment_id": "assess_4e88a6adb82b",
    "intake_id": "demo-sess-003",
    "session_id": "demo-sess-003",
    "patient_id": "patient-priya",
    "status": "awaiting_review",
    "assessment": {
      "priority": "P1",
      "confidence_band": "high",
      "confidence_score": 0.94,
      "uncertainty": { "needs_human_review": true, "reasons": ["High fever with petechiae"], "missing_information": [] },
      "safety_flags": ["petechiae", "high_grade_fever"],
      "evidence": [
        { "source": "patient_intake", "field": "chief_complaint", "summary": "High fever with petechiae on arms" }
      ],
      "recommended_next_action": "human_review"
    },
    "case": {
      "patient_name": "Priya Sharma (Age 28, F)",
      "chief_complaint": "High fever with petechial rash",
      "category": "infectious",
      "severity": 8
    }
  }
]
```

---

### `POST /api/triage/{assessment_id}/review`
Super Admin approves, overrides, escalates, or rejects an assessment.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** `admin` (Strictly enforced: returns 403 for patient or doctor)
- **Request Body (Approval):**
```json
{
  "action": "approve",
  "priority": "P1",
  "notes": "Confirmed clinical urgency."
}
```
- **Request Body (Override — Requires Mandatory `override_reason`):**
```json
{
  "action": "override",
  "priority": "P1",
  "override_reason": "Patient displaying respiratory distress in waiting hall.",
  "notes": "Escalated priority to P1 for rapid assessment."
}
```
- **Response `200 OK` (On Approval/Override into Doctor Queue):**
```json
{
  "message": "Patient approved and placed in doctor queue",
  "token_number": 101,
  "priority": "P1",
  "status": "queued"
}
```
- **Response `200 OK` (On Emergency Coordination):**
```json
{
  "message": "Emergency protocol active: Patient escalated directly to ER Resuscitation.",
  "priority": "P0",
  "status": "escalated_er"
}
```
- **Error `400 Bad Request`:** Missing `override_reason` on override, or attempting to approve a P0 emergency into the routine doctor queue.

---

## 🩺 5. Doctor Workstation & Queue Domain

### `GET /api/doctor/queue`
Retrieves the active OPD queue strictly sorted by priority (`P1 Urgent -> P2 Standard -> P3 Routine` FIFO) and arrival timestamp.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** `doctor` or `admin` (Strictly enforced: returns 403 for patient or kiosk)
- **Response `200 OK`:**
```json
[
  {
    "token_number": 101,
    "turn_number": 101,
    "session_id": "demo-sess-003",
    "patient_id": "patient-priya",
    "patient_name": "Priya Sharma",
    "age": 28,
    "gender": "female",
    "priority": "P1",
    "priority_band": "P1",
    "status": "queued",
    "queue_status": "queued",
    "chief_complaint": "High fever with petechial rash",
    "category": "infectious",
    "arrival_time": "2026-09-09T10:05:00Z",
    "approved_at": "2026-09-09T10:06:00Z"
  }
]
```

---

### `POST /api/doctor/turn/{session_id}/call`
Marks turn status as `called`, alerting patient display.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** `doctor` or `admin`
- **Response `200 OK`:** `{"status": "called", "token_number": 101, "message": "Turn #101 called"}`

---

### `POST /api/doctor/turn/{session_id}/in-consultation`
Marks turn status as `in_consultation`.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** `doctor` or `admin`
- **Response `200 OK`:** `{"status": "in_consultation", "token_number": 101, "message": "Consultation started for turn #101"}`

---

### `POST /api/doctor/turn/{session_id}/consult`
Doctor records official clinical diagnosis, exam notes, and digital prescriptions.
- **Headers:** `Authorization: Bearer <token>`
- **Role:** `doctor` or `admin`
- **Request Body:**
```json
{
  "diagnosis": "Acute Febrile Illness / Suspected Dengue",
  "clinical_notes": "Petechiae on lower extremities. Tourniquet test positive. Platelet count ordered.",
  "prescriptions": [
    {
      "medicine_name": "Paracetamol 650mg",
      "dosage": "1 tab",
      "frequency": "TDS",
      "duration_days": 3,
      "instructions": "Post meals for temperature > 100°F"
    },
    {
      "medicine_name": "Oral Rehydration Salts (ORS)",
      "dosage": "1 sachet",
      "frequency": "Ad libitum",
      "duration_days": 5,
      "instructions": "Dissolve in 1 liter of clean water"
    }
  ],
  "follow_up_days": 2,
  "general_advice": "Hydrate aggressively. Avoid NSAIDs/Aspirin.",
  "referral_specialty": "Internal Medicine"
}
```
- **Response `200 OK`:**
```json
{
  "message": "Consultation record saved and released to patient",
  "consultation": {
    "consultation_id": "consult_4e88a6adb82b",
    "session_id": "demo-sess-003",
    "patient_id": "patient-priya",
    "doctor_id": "doc-201",
    "token_number": 101,
    "diagnosis": "Acute Febrile Illness / Suspected Dengue",
    "clinical_notes": "Petechiae on lower extremities...",
    "prescriptions": [...],
    "follow_up_days": 2,
    "created_at": "2026-09-09T10:20:00Z"
  }
}
```

---

### `GET /api/patient/queue-status`
Returns real-time queue position, emergency status, or completed digital prescription.
- **Parameters (Query):** `session_id` (optional)
- **Headers:** `Authorization: Bearer <token>` (optional — allows kiosk walk-up polling)
- **Role:** Any
- **Response `200 OK` (Active In Queue):**
```json
{
  "has_active_intake": true,
  "in_queue": true,
  "token_number": 101,
  "turn_number": 101,
  "queue_position": 1,
  "position": 1,
  "patients_ahead": 0,
  "priority": "P1",
  "status": "called",
  "queue_status": "called",
  "estimated_wait_minutes": 7,
  "session_id": "demo-sess-003"
}
```
- **Response `200 OK` (P0 Emergency Protocol Active):**
```json
{
  "has_active_intake": true,
  "in_queue": false,
  "status": "p0_escalated",
  "priority": "P0",
  "message": "Emergency protocol active. Please report to the Emergency Resuscitation Room immediately.",
  "emergency_timeline": [
    {"status": "detected", "timestamp": "2026-09-09T10:00:00Z"},
    {"status": "dispatched", "timestamp": "2026-09-09T10:00:01Z"}
  ]
}
```
- **Response `200 OK` (Consultation Completed):**
```json
{
  "has_active_intake": false,
  "in_queue": false,
  "status": "completed",
  "consultation": {
    "consultation_id": "consult_4e88a6adb82b",
    "diagnosis": "Acute Febrile Illness / Suspected Dengue",
    "prescriptions": [...]
  }
}
```

---

## 🏥 6. System & Health Domain

### `GET /health`
System health check endpoint.
- **Auth:** None (Public)
- **Response `200 OK`:**
```json
{
  "status": "ok",
  "service": "medikiosk-api"
}
```
