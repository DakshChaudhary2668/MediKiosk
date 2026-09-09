# End-to-End Clinical Data Flows

This document details the step-by-step data flows across all major user journeys in MediKiosk.

---

## 🌊 Flow 1: New Patient Intake & Demographic Onboarding

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant UI as Next.js PWA
    participant Auth as FastAPI Auth Router
    participant SupaAuth as Supabase GoTrue
    participant PatRouter as FastAPI Patient Router
    participant DB as PostgreSQL Database

    Patient->>UI: Selects Language ('hi') & Clicks Continue
    UI->>UI: Store language in localStorage
    Patient->>UI: Enters Registration Details (Name, Email, Password)
    UI->>Auth: POST /api/auth/register
    Auth->>SupaAuth: sign_up()
    SupaAuth-->>Auth: User Created (user.id)
    Auth->>DB: INSERT INTO patients (id, full_name)
    Auth-->>UI: Registration Successful
    UI->>Auth: POST /api/auth/login
    Auth->>SupaAuth: sign_in_with_password()
    SupaAuth-->>Auth: JWT access_token
    Auth-->>UI: access_token stored in localStorage
    UI->>Patient: Renders Mandatory Consent Screen (/consent)
    Patient->>UI: Clicks "I Agree"
    UI->>PatRouter: POST /api/patient/consent { consent_given: true }
    PatRouter->>DB: UPDATE patients SET consent_given = true
    PatRouter->>DB: INSERT INTO audit_logs (action: 'consent_given')
    UI->>Patient: Navigates to Demographics Profile (/profile)
    Patient->>UI: Submits Age, Gender, Blood Group, Emergency Contact
    UI->>PatRouter: POST /api/patient/profile
    PatRouter->>DB: UPDATE patients SET age, gender, blood_group...
    UI->>Patient: Navigates to Dashboard (/dashboard)
```

---

## 🎙️ Flow 2: Voice-Driven AI Health Assessment

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant UI as Intake Screen (/intake/[id])
    participant IntakeAPI as FastAPI Intake Router
    participant STT as Sarvam Saaras STT
    participant Safety as Safety Regex Engine
    participant Groq as Groq LLaMA Engine
    participant TTS as Sarvam Bulbul TTS
    participant DB as PostgreSQL Database

    Patient->>UI: Clicks "Begin New Intake"
    UI->>IntakeAPI: POST /api/intake/session { category: 'respiratory', language: 'hi' }
    IntakeAPI->>DB: INSERT INTO patient_sessions (status: 'active')
    IntakeAPI-->>UI: Returns session_id & localized AI greeting
    UI->>Patient: Renders AI Greeting in chat

    Patient->>UI: Holds microphone button and speaks
    UI->>UI: MediaRecorder captures Opus/WebM stream
    Patient->>UI: Releases button
    UI->>IntakeAPI: POST /api/intake/voice (FormData: session_id + audio blob)
    IntakeAPI->>STT: POST https://api.sarvam.ai/speech-to-text
    STT-->>IntakeAPI: Returns transcript ("Mujhe do din se bukhar hai")
    IntakeAPI->>Safety: check_red_flags("Mujhe do din se bukhar hai", "hi")
    Safety-->>IntakeAPI: Clean (No red flags)
    IntakeAPI->>Groq: chat.completions.create(messages: system + history + transcript)
    Groq-->>IntakeAPI: Returns JSON (ai_message, extracted_facts, survey_complete)
    IntakeAPI->>TTS: POST https://api.sarvam.ai/text-to-speech (ai_message)
    TTS-->>IntakeAPI: Returns base64 WAV audio bytes
    IntakeAPI->>DB: UPDATE patient_sessions (conversation_state), INSERT conversation_messages
    IntakeAPI-->>UI: Returns { ai_message, transcript, tts_audio, ... }
    UI->>Patient: Displays transcript, adds AI bubble, auto-plays audio response
```

---

## 🛡️ Flow 3: AI Pre-Triage & Super Admin Approval Gate

```mermaid
sequenceDiagram
    autonumber
    participant IntakeAPI as FastAPI Intake Router
    participant PreTriage as AI Pre-Triage Service
    participant Groq as Groq Acuity Engine
    actor Admin as Super Admin / Triage Nurse
    participant AdminUI as Admin Station (/admin)
    participant TriageAPI as FastAPI Triage Router
    participant QueueStore as Doctor Queue Registry
    participant DB as PostgreSQL Audit Logs

    IntakeAPI->>PreTriage: run_ai_pre_triage(session_id, patient_id, PatientCase)
    PreTriage->>Groq: Evaluate case summary against P0-P3 criteria
    Groq-->>PreTriage: Returns { priority: 'P1', confidence: 0.88, uncertainty, evidence }
    PreTriage-->>IntakeAPI: Returns PreTriageAssessment
    IntakeAPI->>TriageAPI: Register in _TRIAGE_ASSESSMENTS (status: 'awaiting_review')

    Admin->>AdminUI: Opens /admin portal
    AdminUI->>TriageAPI: GET /api/triage/pending
    TriageAPI-->>AdminUI: Returns list of pending patient intakes
    Admin->>AdminUI: Inspects patient dossier & AI evidence quotes
    Admin->>AdminUI: Clicks "✓ Approve P1"
    AdminUI->>TriageAPI: POST /api/triage/{assessment_id}/review { action: 'approve' }
    TriageAPI->>TriageAPI: Increment _TOKEN_COUNTER (e.g. Token #101)
    TriageAPI->>QueueStore: Push QueueItem (Token #101, Priority P1)
    TriageAPI->>DB: INSERT INTO audit_logs (action: 'triage_approved', token: 101)
    TriageAPI-->>AdminUI: Returns { status: 'queued', token_number: 101 }
    AdminUI->>Admin: Displays admission confirmation
```

---

## 🩺 Flow 4: Doctor Consultation & Digital Prescription Release

```mermaid
sequenceDiagram
    autonumber
    actor Doctor
    participant DocUI as Doctor Station (/doctor)
    participant QueueAPI as FastAPI Queue Router
    actor Patient
    participant PatUI as Patient Dashboard (/dashboard)

    Doctor->>DocUI: Opens /doctor queue
    DocUI->>QueueAPI: GET /api/doctor/queue
    QueueAPI-->>DocUI: Returns priority-ordered list (P1 -> P2 -> P3)
    Doctor->>DocUI: Clicks "📢 Call In" on Token #101
    DocUI->>QueueAPI: POST /api/doctor/turn/{session_id}/call
    QueueAPI-->>DocUI: Status updated to 'called'

    PatUI->>QueueAPI: GET /api/patient/queue-status (Auto-polling)
    QueueAPI-->>PatUI: { status: 'called', token_number: 101 }
    PatUI->>Patient: Displays pulsing alert: "Doctor is calling Token #101!"

    Doctor->>DocUI: Clicks "▶ Begin Consultation"
    DocUI->>QueueAPI: POST /api/doctor/turn/{session_id}/start
    Doctor->>Doctor: Conducts clinical examination
    Doctor->>DocUI: Fills Diagnosis, Rx Medications Table, Advice
    Doctor->>DocUI: Clicks "✓ Complete Consultation & Issue Digital Rx"
    DocUI->>QueueAPI: POST /api/doctor/turn/{session_id}/consult (ConsultationRequest)
    QueueAPI->>QueueAPI: Store ConsultationRecord, mark turn 'completed'
    QueueAPI-->>DocUI: Confirmation & Consultation Saved

    PatUI->>QueueAPI: GET /api/patient/queue-status (Auto-polling)
    QueueAPI-->>PatUI: { status: 'consultation_completed', consultation: { diagnosis, prescriptions, ... } }
    PatUI->>Patient: Renders Official Digital Prescription (Rx) with Print button
```

---

## 🚨 Flow 5: Deterministic Emergency Red-Flag Escalation (P0)

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    participant UI as Intake Screen
    participant IntakeAPI as FastAPI Intake Router
    participant Safety as Deterministic Safety Filter
    participant TriageAPI as FastAPI Triage Router

    Patient->>UI: Enters "Crushing chest pain radiating to left jaw"
    UI->>IntakeAPI: POST /api/intake/message
    IntakeAPI->>Safety: check_red_flags(text)
    Safety-->>IntakeAPI: Matched 'possible_acute_chest_emergency'
    IntakeAPI->>IntakeAPI: Immediately set state.conversation_status = 'red_flagged'
    IntakeAPI->>TriageAPI: Trigger immediate P0 Pre-Triage Assessment
    IntakeAPI-->>UI: Returns { red_flag: true, ai_message: "⚠️ Immediate emergency medical care required..." }
    UI->>Patient: Displays prominent Emergency Alert Banner with 108/911 directives
```
