# End-to-End Clinical Data Flows

This document details the step-by-step data flows across all major user journeys in MediKiosk.

---

## 🌊 Flow 1: New Patient Intake & Demographic Onboarding

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient (Kiosk / PWA)
    participant UI as Next.js Patient Kiosk (/patient)
    participant Auth as FastAPI Auth Router
    participant SupaAuth as Supabase GoTrue
    participant PatRouter as FastAPI Patient Router
    participant DB as PostgreSQL Database

    Patient->>UI: Selects Language ('hi') & Clicks Continue
    UI->>UI: Store language in local state
    Patient->>UI: Enters Mobile / ABHA ID
    UI->>UI: OTP Verification
    Patient->>UI: Reads AI Boundary Notice & Clicks "I Agree"
    UI->>PatRouter: POST /api/patient/consent { consent_given: true }
    PatRouter->>DB: UPDATE patients SET consent_given = true
    PatRouter->>DB: INSERT INTO audit_logs (action: 'consent_given')
    UI->>Patient: Advances to Demographic & Symptom Intake
```

---

## 🎙️ Flow 2: Voice-Driven AI Health Assessment

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient
    participant UI as Intake Screen (/patient)
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

    Patient->>UI: Taps microphone and speaks
    UI->>UI: MediaRecorder captures Opus/WebM stream (recorder.start(250))
    Patient->>UI: Taps Stop / Silence detected
    UI->>IntakeAPI: POST /api/intake/voice (FormData: session_id + audio blob)
    IntakeAPI->>STT: POST https://api.sarvam.ai/speech-to-text
    STT-->>IntakeAPI: Returns transcript ("Mujhe do din se bukhar hai")
    IntakeAPI->>Safety: check_red_flags("Mujhe do din se bukhar hai", "hi")
    Safety-->>IntakeAPI: Clean (No red flags)
    IntakeAPI->>Groq: chat.completions.create(messages: system + history + transcript)
    Groq-->>IntakeAPI: Returns JSON (ai_message, extracted_facts, survey_complete)
    IntakeAPI->>TTS: POST https://api.sarvam.ai/text-to-speech (ai_message)
    TTS-->>IntakeAPI: Returns base64 WAV audio bytes
    IntakeAPI->>DB: UPDATE patient_sessions, INSERT conversation_messages
    IntakeAPI-->>UI: Returns { ai_message, transcript, tts_audio, ... }
    UI->>Patient: Displays transcript, adds AI bubble, auto-plays audio response
```

---

## 🚨 Flow 3: P0 Emergency Auto-Escalation (Bypasses Admin Gate)

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Emergency Patient
    participant UI as Kiosk UI (/patient)
    participant IntakeAPI as FastAPI Intake Router
    participant Safety as Deterministic Safety Engine (safety.py)
    participant Persistence as Persistence Layer (persistence.py)
    participant DB as Supabase emergency_events Table
    actor Admin as Super Admin (/admin)
    actor Doctor as Doctor (/doctor)

    Patient->>UI: Speaks/Types: "Severe crushing chest pain radiating to left arm and cold sweats"
    UI->>IntakeAPI: POST /api/intake/message
    IntakeAPI->>Safety: check_red_flags(text, language)
    Safety-->>IntakeAPI: RedFlagResult (red_flag=True, signals=['chest_pain_radiating', 'diaphoresis'])
    
    Note over IntakeAPI,Persistence: Immediate Auto-Escalation (NO Admin Approval Needed)
    IntakeAPI->>Persistence: record_p0_emergency_event(session_id, patient_id, signals)
    Persistence->>DB: INSERT INTO emergency_events (status: 'p0_escalated', timeline: [detected, dispatched])
    IntakeAPI-->>UI: Returns { red_flag: true, priority: 'P0', session_status: 'p0_escalated' }
    
    UI->>Patient: Flashes Red Emergency Alert: "Please proceed immediately to Emergency Room Bay 1"
    Persistence-.->Admin: P0 Emergency Banner displayed on Admin Dashboard for coordination
    Persistence-.->Doctor: P0 Handover Alert displayed on Doctor Station
```

---

## 🛡️ Flow 4: P1–P3 Pre-Triage & Super Admin Approval Gate

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
    participant DB as PostgreSQL Database

    IntakeAPI->>PreTriage: run_ai_pre_triage(session_id, patient_id, PatientCase)
    PreTriage->>Groq: Evaluate case summary against P1-P3 criteria
    Groq-->>PreTriage: Returns { priority: 'P1', confidence: 0.92, uncertainty, evidence }
    PreTriage->>DB: INSERT INTO triage_assessments (status: 'awaiting_review')

    AdminUI->>TriageAPI: GET /api/triage/pending
    TriageAPI-->>AdminUI: Returns list of pending assessments
    Admin->>AdminUI: Clicks patient row -> Inspects case dossier & AI evidence quotes
    
    alt Admin Approves
        Admin->>AdminUI: Clicks "Approve Priority"
        AdminUI->>TriageAPI: POST /api/triage/{id}/review { action: 'approve' }
        TriageAPI->>QueueStore: enqueue_doctor_item()
        TriageAPI->>DB: INSERT INTO doctor_queue_items (token_number: 101, status: 'queued')
        TriageAPI->>DB: INSERT INTO audit_logs (action: 'triage_approved')
        TriageAPI-->>AdminUI: Returns { token_number: 101, status: 'queued' }
    else Admin Overrides Priority
        Admin->>AdminUI: Selects P2, enters mandatory reason: "Patient vitals stable; pain reduced"
        AdminUI->>TriageAPI: POST /api/triage/{id}/review { action: 'override', priority: 'P2', override_reason: '...' }
        TriageAPI->>QueueStore: enqueue_doctor_item(priority='P2')
        TriageAPI-->>AdminUI: Returns { token_number: 101, priority: 'P2', status: 'queued' }
    end
```

---

## 🩺 Flow 5: Doctor Consultation, Digital Rx & Record Release

```mermaid
sequenceDiagram
    autonumber
    actor Doctor as Attending Physician
    participant DocUI as Doctor Station (/doctor)
    participant QueueAPI as FastAPI Queue Router
    participant DB as PostgreSQL Database
    actor Patient as Patient
    participant PatUI as Patient Display (/patient)

    DocUI->>QueueAPI: GET /api/doctor/queue
    QueueAPI-->>DocUI: Returns sorted queue (P1 > P2 > P3 FIFO)
    
    Doctor->>DocUI: Clicks "Call In" (Token #101)
    DocUI->>QueueAPI: POST /api/doctor/turn/{id}/call
    QueueAPI->>DB: UPDATE doctor_queue_items SET status = 'called'
    
    PatUI->>QueueAPI: Polling GET /api/patient/queue-status
    QueueAPI-->>PatUI: { status: 'called', token: 101 }
    PatUI->>Patient: Pulses "Please enter Room 4" alert banner
    
    Doctor->>DocUI: Clicks "Begin Consultation"
    DocUI->>QueueAPI: POST /api/doctor/turn/{id}/in-consultation
    
    Doctor->>DocUI: Examines patient, records vitals, enters official diagnosis & prescriptions
    Doctor->>DocUI: Clicks "Complete Consultation & Release Rx"
    DocUI->>QueueAPI: POST /api/doctor/turn/{id}/consult { diagnosis, clinical_notes, prescriptions, ... }
    QueueAPI->>DB: INSERT INTO consultation_records
    QueueAPI->>DB: UPDATE doctor_queue_items SET status = 'completed'
    QueueAPI->>DB: INSERT INTO audit_logs (action: 'consultation_completed')
    
    PatUI->>QueueAPI: Polling GET /api/patient/queue-status
    QueueAPI-->>PatUI: { status: 'completed', consultation: { diagnosis, prescriptions, ... } }
    PatUI->>Patient: Displays official Digital Prescription with print button
```
