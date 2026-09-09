# System State Machines

This document provides formal state transition models for all core domain entities in MediKiosk.

---

## 1. Patient Intake Session Lifecycle (`patient_sessions`)

```mermaid
stateDiagram-v2
    [*] --> active: POST /api/intake/session

    state active {
        [*] --> greeting: Initial turn
        greeting --> collecting_complaint: Patient responds with chief complaint
        collecting_complaint --> exploring_category: Category identified
        exploring_category --> clarifying_symptoms: Question bank traversal
        clarifying_symptoms --> history_and_meds: Associated symptoms & duration captured
    }

    active --> completed: survey_complete == true OR POST /complete
    active --> p0_escalated: Emergency red flag matched (Pre/Post Safety Check)
    active --> cancelled: User exits or session expires

    completed --> [*]
    p0_escalated --> [*]: Auto-dispatches emergency protocol
    cancelled --> [*]
```

---

## 2. Pre-Triage Assessment Lifecycle (`triage_assessments`)

```mermaid
stateDiagram-v2
    [*] --> awaiting_review: AI pre-triage completes (P1, P2, P3)
    [*] --> p0_escalated: Acute red flag detected (P0)
    [*] --> assessment_failed: AI inference error (Unassigned acuity)

    awaiting_review --> approved: Admin clicks "Approve" (Preserves AI priority)
    awaiting_review --> overridden: Admin clicks "Override" (With mandatory clinical reason)
    awaiting_review --> rejected: Admin clicks "Reject" (Duplicate / invalid intake)

    assessment_failed --> overridden: Admin reviews raw dossier & manually assigns priority

    approved --> queued: Unique token allocated & pushed to Doctor Queue
    overridden --> queued: Unique token allocated & pushed to Doctor Queue

    p0_escalated --> [*]: Dispatched directly to ER
    rejected --> [*]
    queued --> [*]
```

---

## 3. P0 Emergency Timeline Lifecycle (`emergency_events`)

```mermaid
stateDiagram-v2
    [*] --> detected: Pre/post-inference safety engine flags emergency
    detected --> dispatched: Emergency Resuscitation Team auto-alerted
    dispatched --> acknowledged: Doctor / Admin acknowledges handover
    acknowledged --> handover: Clinical handover in Resuscitation Bay
    handover --> resolved: Patient stabilized / admitted to ICU

    resolved --> [*]
```

---

## 4. Doctor Turn Queue Item Lifecycle (`doctor_queue_items`)

*Invariant: P0 cases are strictly forbidden from entering this state machine.*

```mermaid
stateDiagram-v2
    [*] --> queued: Added to _QUEUE_STORE via Admin Approval / Override

    queued --> called: Doctor triggers POST /doctor/turn/{id}/call
    called --> in_consultation: Doctor triggers POST /doctor/turn/{id}/in-consultation
    in_consultation --> completed: Doctor submits POST /doctor/turn/{id}/consult (Diagnosis & Digital Rx)
    called --> skipped: Patient absent when called

    skipped --> queued: Turn re-queued by attending doctor
    completed --> [*]: ConsultationRecord issued & Digital Rx published to patient
```

---

## 5. Voice Interaction State Machine (Frontend `VoiceState`)

```mermaid
stateDiagram-v2
    [*] --> IDLE: Component mounted

    IDLE --> LISTENING: User taps microphone button (MediaRecorder starts)
    IDLE --> PERMISSION_DENIED: Browser mic permission rejected
    LISTENING --> TRANSCRIBING: Silence detected / User taps stop
    TRANSCRIBING --> CONFIRM: Sarvam STT returns valid text
    TRANSCRIBING --> NO_SPEECH: Empty speech detected (HTTP 422)
    TRANSCRIBING --> NETWORK_ERROR: STT timeout / connection error
    CONFIRM --> SPEAKING: Backend returns Sarvam TTS audio WAV
    CONFIRM --> IDLE: Text response only
    SPEAKING --> IDLE: Audio playback finishes
    NO_SPEECH --> IDLE: User retries or types text
    NETWORK_ERROR --> IDLE: User retries
```

---

## 6. Patient Portal Live State Progression (`GET /api/patient/queue-status`)

```mermaid
stateDiagram-v2
    [*] --> NoActiveSession: No unconsulted intake session

    NoActiveSession --> IntakeActive: User begins self-service intake
    IntakeActive --> P0EmergencyActive: Acute emergency red-flag triggered
    IntakeActive --> AwaitingTriage: Survey complete; waiting for Admin review
    AwaitingTriage --> Queued: Super Admin approves intake into Doctor Queue
    Queued --> Called: Doctor calls turn number (Pulsing room alert)
    Called --> InConsultation: Doctor starts consultation
    InConsultation --> ConsultationCompleted: Doctor signs Digital Rx
    
    P0EmergencyActive --> [*]: Emergency room directions displayed
    ConsultationCompleted --> NoActiveSession: Patient prints/saves Digital Rx
```
