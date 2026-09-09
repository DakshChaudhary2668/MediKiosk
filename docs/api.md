# API Reference & OpenAPI Specification

All endpoints are served by FastAPI and proxied via Next.js rewrites at `/api/*`. All endpoints (except `/health`, `/api/auth/register`, and `/api/auth/login`) require an `Authorization: Bearer <token>` header.

---

## 🔐 1. Authentication Domain

### `POST /api/auth/register`
Creates a new patient user account in Supabase GoTrue and inserts a profile row.
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "email": "patient@example.com",
  "password": "SecurePassword123!",
  "full_name": "Jane Doe"
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
- **Error `400 Bad Request`:** Registration failed / email already in use.

---

### `POST /api/auth/login`
Authenticates patient credentials and issues JWT tokens.
- **Auth:** None (Public)
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
  "email": "patient@example.com"
}
```
- **Error `401 Unauthorized`:** Invalid email or password.

---

### `GET /api/auth/me`
Retrieves identity details for the bearer token.
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
```json
{
  "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "email": "patient@example.com"
}
```

---

## 👤 2. Patient Domain

### `GET /api/patient/profile`
Fetches patient demographic profile.
- **Headers:** `Authorization: Bearer <token>`
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
Updates patient demographic fields.
- **Headers:** `Authorization: Bearer <token>`
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
- **Response `200 OK`:** Updated profile JSON.

---

### `POST /api/patient/consent`
Records patient consent for AI-assisted intake.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "consent_given": true
}
```
- **Response `200 OK`:** `{"consent_given": true}`
- **Side Effects:** Inserts `action: "consent_given"` into `audit_logs`.

---

### `POST /api/patient/documents/upload`
Uploads medical records (PDF, PNG, JPEG) to Supabase Storage.
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Form Data:** `file: <binary>`
- **Response `200 OK`:**
```json
{
  "message": "Document uploaded successfully",
  "storage_path": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/lab_report.pdf",
  "file_name": "lab_report.pdf"
}
```

---

### `GET /api/patient/documents`
Lists uploaded medical records for the authenticated patient.
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
```json
[
  {
    "id": "doc-uuid-1",
    "file_name": "lab_report.pdf",
    "file_type": "application/pdf",
    "storage_path": "uid/lab_report.pdf",
    "uploaded_at": "2026-09-09T09:30:00Z"
  }
]
```

---

## 💬 3. AI Intake Domain

### `POST /api/intake/session`
Initiates a new conversational health intake session.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "category": "respiratory",
  "language": "hi"
}
```
- **Response `200 OK`:**
```json
{
  "session_id": "c56a4180-65aa-42ec-a945-5fd21dec0538",
  "greeting": "नमस्ते! मैं मेडीकियोस्क का AI सहायक हूँ। डॉक्टर से मिलने से पहले मैं आपकी समस्या को समझने के लिए कुछ प्रश्न पूछूँगा। आप आज किस परेशानी के लिए आए हैं?"
}
```

---

### `POST /api/intake/message`
Processes a textual response in the intake dialogue.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "session_id": "c56a4180-65aa-42ec-a945-5fd21dec0538",
  "message": "Mujhe do din se bukhar aur khansi hai.",
  "input_mode": "text"
}
```
- **Response `200 OK`:**
```json
{
  "ai_message": "Aapne temperature maapa hai? Agar haan, to kitna tha?",
  "category": "fever",
  "red_flag": false,
  "survey_complete": false,
  "session_status": "active",
  "answered_fields": ["chief_complaint", "duration"],
  "missing_fields": ["temperature_reading", "associated_chills"]
}
```

---

### `POST /api/intake/voice`
Processes real microphone audio bytes via Sarvam Saaras STT, Groq LLM, and Sarvam Bulbul TTS.
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
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
- **Error `422 Unprocessable Entity`:** Empty audio or no speech detected.

---

### `GET /api/intake/session/{session_id}`
Retrieves session state, message history, and synthesized `PatientCase`.
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
```json
{
  "session": {
    "id": "c56a4180-65aa-42ec-a945-5fd21dec0538",
    "patient_id": "patient-101",
    "status": "completed",
    "category": "respiratory",
    "language": "en"
  },
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
    "red_flag_detected": false,
    "completion_status": "complete"
  }
}
```

---

## 🛡️ 4. Super Admin Clinical Triage Gate Domain

### `POST /api/triage/seed-demo`
Populates 10 comprehensive clinical test cases across P0–P3 acuity bands.
- **Auth:** Public / Admin
- **Response `200 OK`:**
```json
{
  "status": "seeded",
  "count": 10,
  "total_pending": 10
}
```

---

### `GET /api/triage/pending`
Lists all patient cases currently awaiting Super Admin review, sorted with P0/P1 emergencies on top.
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
```json
[
  {
    "assessment": {
      "assessment_id": "triage_4e88a6adb82b",
      "intake_id": "demo-sess-001",
      "patient_id": "patient-rajesh",
      "priority": "P0",
      "confidence_band": "high",
      "confidence_score": 0.99,
      "uncertainty": {
        "needs_human_review": true,
        "reasons": ["Crushing substernal chest pain radiating to jaw with diaphoresis"],
        "missing_information": []
      },
      "safety_flags": ["chest_pain_radiating", "diaphoresis"],
      "evidence": [
        {
          "source": "patient_intake",
          "field": "chief_complaint",
          "summary": "Crushing substernal chest pain radiating to left jaw"
        }
      ],
      "recommended_next_action": "immediate_er_escalation",
      "status": "awaiting_review"
    },
    "case": {
      "patient_name": "Rajesh Kumar (Age 56, M)",
      "chief_complaint": "Crushing substernal chest pain...",
      "category": "cardiovascular",
      "severity": 9
    },
    "patient_id": "patient-rajesh",
    "session_id": "demo-sess-001",
    "submitted_at": "2026-09-09T10:00:00Z",
    "status": "awaiting_review"
  }
]
```

---

### `POST /api/triage/{assessment_id}/review`
Super Admin approves, overrides, escalates, or rejects an assessment.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "action": "override",
  "priority": "P1",
  "override_reason": "Patient displays acute respiratory distress in waiting room.",
  "notes": "Administer oxygen immediately upon turn entry."
}
```
- **Response `200 OK` (On Approval/Override):**
```json
{
  "message": "Patient approved and placed in doctor queue",
  "token_number": 102,
  "priority": "P1",
  "status": "queued"
}
```
- **Response `200 OK` (On Emergency Escalation):**
```json
{
  "message": "Emergency protocol activated: Patient escalated directly to ER Resuscitation.",
  "priority": "P0",
  "status": "escalated_er"
}
```

---

## 🩺 5. Doctor Workstation & Queue Domain

### `GET /api/doctor/queue`
Retrieves the active queue of approved patients, sorted strictly by priority (`P1 -> P2 -> P3`) and arrival time.
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
```json
[
  {
    "token_number": 101,
    "session_id": "demo-sess-003",
    "patient_id": "patient-ananya",
    "patient_name": "Ananya Sharma (Age 24, F)",
    "priority": "P1",
    "status": "queued",
    "chief_complaint": "Acute severe right lower quadrant abdominal pain...",
    "category": "gastroenterology",
    "arrival_time": "2026-09-09T10:05:00Z",
    "approved_at": "2026-09-09T10:06:00Z"
  }
]
```

---

### `POST /api/doctor/turn/{session_id}/call`
Changes turn status to `called`, alerting patient dashboard.
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:** `{"status": "called", "token_number": 101}`

---

### `POST /api/doctor/turn/{session_id}/start`
Changes turn status to `in_consultation`.
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:** `{"status": "in_consultation", "token_number": 101}`

---

### `POST /api/doctor/turn/{session_id}/consult`
Completes clinical consultation, signs digital prescription, and publishes to patient dashboard.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "session_id": "demo-sess-003",
  "diagnosis": "Acute Appendicitis (Early Stage)",
  "clinical_notes": "Tenderness at McBurney's point. Rebound tenderness positive. Admitted for urgent surgical consult.",
  "prescriptions": [
    {
      "medication_name": "IV Cefotaxime",
      "dosage": "1g",
      "frequency": "Stat",
      "duration": "1 day",
      "instructions": "Slow IV injection"
    },
    {
      "medication_name": "IV Tramadol",
      "dosage": "50mg",
      "frequency": "SOS",
      "duration": "1 day",
      "instructions": "For severe pain"
    }
  ],
  "follow_up_days": 1,
  "general_advice": "Strict NPO (nil per os). Immediate surgical evaluation."
}
```
- **Response `200 OK`:**
```json
{
  "message": "Consultation record saved and released to patient",
  "consultation": {
    "consultation_id": "consult_4e88a6adb82b",
    "session_id": "demo-sess-003",
    "patient_id": "patient-ananya",
    "doctor_id": "doctor-uuid-1",
    "doctor_name": "Dr. Clinical Consultant",
    "diagnosis": "Acute Appendicitis (Early Stage)",
    "clinical_notes": "Tenderness at McBurney's point...",
    "prescriptions": [...],
    "follow_up_days": 1,
    "general_advice": "Strict NPO...",
    "created_at": "2026-09-09T10:20:00Z"
  }
}
```

---

### `GET /api/patient/queue-status`
Returns real-time status for the patient's active session.
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK` (When In Queue):**
```json
{
  "in_queue": true,
  "token_number": 101,
  "position": 1,
  "patients_ahead": 0,
  "priority": "P1",
  "status": "called",
  "estimated_wait_mins": 7
}
```
- **Response `200 OK` (When Consultation Completed):**
```json
{
  "in_queue": false,
  "status": "consultation_completed",
  "consultation": {
    "consultation_id": "consult_4e88a6adb82b",
    "diagnosis": "Acute Appendicitis (Early Stage)",
    "prescriptions": [...]
  }
}
```
