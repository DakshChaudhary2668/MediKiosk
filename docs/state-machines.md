# System State Machines

This document provides formal state transition models for all core domain entities in MediKiosk.

---

## 1. Patient Intake Session Lifecycle (`patient_sessions`)

```mermaid
stateDiagram-v2
    [*] --> active: POST /api/intake/session

    state active {
        [*] --> greeting: Initial turn
        greeting --> collecting_complaint: Patient responds
        collecting_complaint --> exploring_category: Category identified
        exploring_category --> clarifying_symptoms: Follow-up question bank
        clarifying_symptoms --> history_and_meds: Associated symptoms captured
    }

    active --> completed: survey_complete == true OR POST /complete
    active --> red_flagged: Emergency keyword matched (Pre/Post Safety)
    active --> cancelled: User exits or session expires

    completed --> [*]
    red_flagged --> [*]
    cancelled --> [*]
```

---

## 2. Pre-Triage Assessment Lifecycle (`PreTriageAssessment`)

```mermaid
stateDiagram-v2
    [*] --> awaiting_review: run_ai_pre_triage() completes

    awaiting_review --> approved: Admin clicks "Approve" (Preserves AI priority)
    awaiting_review --> overridden: Admin clicks "Override" (Priority modified with rationale)
    awaiting_review --> escalated: Admin clicks "Escalate to ER" (Immediate P0)
    awaiting_review --> rejected: Admin clicks "Reject" (Invalid / duplicate intake)

    approved --> queued_in_doctor_turn: Token generated & pushed to doctor queue
    overridden --> queued_in_doctor_turn: Token generated & pushed to doctor queue

    queued_in_doctor_turn --> [*]
    escalated --> [*]
    rejected --> [*]
```

---

## 3. Doctor Turn Queue Item Lifecycle (`QueueItem`)

```mermaid
stateDiagram-v2
    [*] --> queued: Added to _DOCTOR_QUEUE via Admin Approval

    queued --> called: Doctor triggers POST /doctor/turn/{id}/call
    called --> in_consultation: Doctor triggers POST /doctor/turn/{id}/start
    in_consultation --> completed: Doctor submits POST /doctor/turn/{id}/consult

    completed --> [*]: ConsultationRecord issued & Digital Rx published
```

---

## 4. Voice Interaction State Machine (Frontend `VoiceState`)

```mermaid
stateDiagram-v2
    [*] --> IDLE: Component mounted

    IDLE --> LISTENING: User presses microphone button (MediaRecorder starts)
    LISTENING --> PROCESSING: User finishes speaking (Audio blob sent to /api/intake/voice)
    PROCESSING --> SPEAKING: Backend returns TTS audio (Audio element plays WAV)
    PROCESSING --> IDLE: Backend returns text response only
    PROCESSING --> ERROR: STT fails, empty audio, or network failure
    SPEAKING --> IDLE: Audio playback finishes
    ERROR --> IDLE: User dismisses alert or types text
```

---

## 5. Patient Dashboard Live State Progression

```mermaid
stateDiagram-v2
    [*] --> NoActiveSession: No unconsulted session

    NoActiveSession --> IntakeActive: User clicks "Begin New Intake"
    IntakeActive --> AwaitingTriage: Survey complete; AI pre-triage generated
    AwaitingTriage --> Queued: Super Admin approves intake into doctor queue
    Queued --> Called: Doctor calls turn number (Pulse alert)
    Called --> InConsultation: Doctor starts medical consultation
    InConsultation --> ConsultationCompleted: Doctor signs Rx (Digital Rx Box rendered)
    ConsultationCompleted --> NoActiveSession: Patient reviews prescription
```
