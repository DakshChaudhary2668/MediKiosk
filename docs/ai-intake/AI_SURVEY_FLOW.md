# MediKiosk AI-Guided Survey Flow
## Module 2: AI Intake + Voice/Text

**Version:** MVP v1.0  
**Purpose:** Define the complete patient intake conversation flow for MediKiosk.

---

## 1. Objective

The AI-Guided Survey collects structured patient information before the patient meets a doctor.

The system supports:

- Text-based patient input
- Voice-based patient input
- Hindi
- English
- Hinglish
- Adaptive follow-up questions
- Structured patient information extraction
- Conversation state tracking
- Missing-information detection
- Red-flag signal detection for escalation to the safety layer

### Explicit Scope Boundary

The AI is an **intake and information-gathering assistant**.

It must NOT:

- Diagnose diseases
- Prescribe medication
- Recommend treatment
- Claim that a patient has a disease
- Replace a doctor
- Make final clinical decisions

---

# 2. High-Level Flow

```text
Patient
   |
   +------------------+
   |                  |
   v                  v
 Text Input        Voice Input
   |                  |
   |               Speech-to-Text
   |                  |
   +--------+---------+
            |
            v
    Conversation Manager
            |
            v
      AI Intake Agent
            |
            +------------------+
            |                  |
            v                  v
     Extract Information   Determine Missing
            |              Information
            +-------+----------+
                    |
                    v
             Next Best Question
                    |
                    v
              Patient Answer
                    |
                    +-----> Repeat until
                            intake complete
                    |
                    v
             Structured Case Data
                    |
                    v
                 Database
```

---

# 3. Patient Intake Stages

The survey should generally collect information in the following order.

```text
Stage 1  -> Greeting + Consent
Stage 2  -> Primary Complaint
Stage 3  -> Duration / Onset
Stage 4  -> Symptom Details
Stage 5  -> Severity / Frequency
Stage 6  -> Relevant Associated Symptoms
Stage 7  -> Medical History
Stage 8  -> Current Medications
Stage 9  -> Allergies
Stage 10 -> Previous Relevant Conditions / Consultations
Stage 11 -> Relevant Lifestyle Information
Stage 12 -> Additional Patient Concern
Stage 13 -> Completion Confirmation
```

The order is a default flow, NOT a rigid questionnaire.

The AI can skip irrelevant sections or ask additional questions when required.

---

# 4. Stage 1: Greeting + Consent

### Objective

Introduce the AI and explain its purpose.

Example:

> "Hi, I'm MediKiosk's AI intake assistant. I'll ask you a few questions about your health so the doctor can understand your concern before the consultation."

Then request consent according to the application's consent policy.

### Required State

```json
{
  "consent_status": "pending"
}
```

Possible values:

```text
pending
accepted
declined
```

If consent is declined, stop the AI intake flow and return control to the normal kiosk workflow.

---

# 5. Stage 2: Primary Complaint

Start with an open-ended question.

### Preferred Question

> "What brings you here today?"

Do not immediately force the patient into predefined categories.

Example:

Patient:

> "Mujhe 2 din se khansi ho rahi hai."

Extract:

```json
{
  "chief_complaint": "cough",
  "duration": "2 days"
}
```

If the patient provides multiple symptoms, preserve all relevant symptoms.

Example:

> "Mujhe bukhar hai, khansi hai aur weakness bhi hai."

Extract:

```json
{
  "chief_complaint": "fever",
  "symptoms": [
    "cough",
    "weakness"
  ]
}
```

---

# 6. Stage 3: Duration / Onset

If duration was not already provided, ask:

> "How long have you been experiencing this?"

Possible extracted values:

```text
2 hours
3 days
2 weeks
since yesterday
for several months
unknown
```

The AI should normalize natural language into structured values while preserving the original response.

---

# 7. Stage 4: Symptom Details

The AI should identify the relevant symptom category and select questions from the approved question bank.

Examples:

### Respiratory

Potential topics:

```text
cough
breathing difficulty
chest discomfort
sputum
wheezing
fever
```

### Gastrointestinal

Potential topics:

```text
abdominal pain
vomiting
diarrhea
constipation
nausea
blood in stool
```

### Musculoskeletal

Potential topics:

```text
pain location
swelling
injury
movement limitation
duration
severity
```

The AI should NOT ask every possible question.

It should ask only questions relevant to the patient's complaint and information still missing.

---

# 8. Adaptive Question Selection

The next question must depend on:

```text
Current complaint
+
Previous answers
+
Missing required information
+
Relevant question category
+
Safety signals
```

Example:

```text
Patient:
"I have chest pain."

AI:
"How long have you had the chest pain?"

Patient:
"About two hours."

AI:
"How severe is the pain from 1 to 10?"

Patient:
"8."

AI:
"Are you having difficulty breathing?"
```

The AI should not restart the questionnaire after every answer.

---

# 9. One Question at a Time

The AI should ask one primary question per turn.

Avoid:

> "How long has this been happening, how severe is it, where exactly is the pain, and are you taking medication?"

Preferred:

> "How long has this been happening?"

Then process the answer before asking the next relevant question.

Exception:

If two very closely related pieces of information can naturally be collected together without increasing patient confusion, they may be grouped.

---

# 10. Do Not Repeat Answered Questions

The conversation manager must maintain completed fields.

Example:

```json
{
  "completed_fields": [
    "chief_complaint",
    "duration",
    "severity"
  ]
}
```

If `duration` is already known, the AI must not ask for duration again.

---

# 11. Handle Unknown Information

Patients may say:

```text
"I don't know."
"Not sure."
"I can't remember."
```

Store:

```json
{
  "value": null,
  "status": "unknown"
}
```

Do NOT infer or fabricate an answer.

---

# 12. Handle Patient Refusal

If a patient says:

> "I don't want to answer."

Do not repeatedly pressure them.

Store:

```json
{
  "status": "declined"
}
```

Continue with the next appropriate question if possible.

---

# 13. Language Handling

Supported MVP languages:

```text
English
Hindi
Hinglish
```

The AI should match the patient's language.

Example:

Patient:

> "Mujhe kal se fever hai."

AI may respond in Hindi/Hinglish.

Patient:

> "I have had fever since yesterday."

AI may respond in English.

If the patient switches language, the AI should switch naturally.

---

# 14. Preserve Original Patient Input

Never overwrite the original patient response.

Store both:

```json
{
  "original_text": "Mujhe 2 din se khansi ho rahi hai",
  "normalized_text": "Patient has had a cough for 2 days",
  "language": "hi"
}
```

This is important for auditability and doctor review.

---

# 15. Voice Flow

Voice input follows this pipeline:

```text
Patient speaks
      |
      v
Browser Microphone
      |
      v
Audio Recording
      |
      v
Backend API
      |
      v
Speech-to-Text
      |
      v
Transcript
      |
      v
Conversation Manager
      |
      v
AI Intake Agent
```

The AI intake agent should receive the transcript in the same format as text input.

This means voice and text should share the same conversation logic.

```text
               +--> Text Input ----+
               |                   |
Patient -------+                   +--> Conversation Manager
               |                   |
               +--> Voice -> STT --+
```

Do NOT create a separate AI logic path for voice.

---

# 16. Voice UI States

The frontend must support:

```text
IDLE
RECORDING
PROCESSING_AUDIO
TRANSCRIBING
AI_PROCESSING
RESPONSE_READY
ERROR
```

Example:

```text
IDLE
 ↓
User clicks microphone
 ↓
RECORDING
 ↓
User stops recording
 ↓
PROCESSING_AUDIO
 ↓
TRANSCRIBING
 ↓
AI_PROCESSING
 ↓
RESPONSE_READY
```

---

# 17. Error Handling

### Microphone Permission Denied

Show:

> "Microphone access is unavailable. You can continue using text input."

### No Speech Detected

Show:

> "I couldn't detect speech. Please try again."

### Speech-to-Text Failure

Show:

> "I couldn't process the audio. Please try again or continue with text."

### LLM Failure

Do not lose the patient's previous answers.

Keep the conversation state and allow retry.

### Network Failure

Preserve unsent data locally where appropriate and allow retry.

---

# 18. Completion Criteria

The survey is complete when:

```text
Required intake fields collected
+
No important missing information for the identified complaint
+
No unresolved mandatory question
+
Patient has completed the intake
```

Then generate:

```json
{
  "intake_status": "completed"
}
```

The system should then pass the structured case to the next module:

```text
AI Intake
    |
    v
Structured Patient Case
    |
    v
AI Pre-Triage
```

---

# 19. Safety Signal Handling

The intake agent may identify potential safety signals, but the intake agent should NOT independently make a medical diagnosis.

Example:

```json
{
  "safety_signal_detected": true,
  "signal_type": "potential_emergency",
  "requires_safety_evaluation": true
}
```

The deterministic safety/rules engine should perform the actual escalation decision.

Architecture:

```text
Patient Input
     |
     v
AI Intake
     |
     +----> Information Extraction
     |
     +----> Potential Safety Signal
                       |
                       v
               Safety Rule Engine
                       |
                 Escalation Decision
```

---

# 20. Conversation State

At every turn maintain:

```json
{
  "session_id": "SES-001",
  "patient_id": "PAT-001",
  "language": "hi",
  "input_mode": "voice",
  "current_stage": "symptom_details",
  "current_question_id": "resp_003",
  "completed_fields": [],
  "pending_fields": [],
  "answers": {},
  "conversation_status": "in_progress"
}
```

Possible conversation statuses:

```text
not_started
in_progress
paused
completed
cancelled
error
```

---

# 21. Example Complete Conversation

```text
AI:
What brings you here today?

Patient:
Mujhe 2 din se khansi aur halka bukhar hai.

AI:
Kya aapko saans lene mein koi dikkat ho rahi hai?

Patient:
Nahi.

AI:
Khansi dry hai ya mucus ke saath?

Patient:
Thodi mucus ke saath.

AI:
Bukhar kab se hai?

Patient:
Kal se.

AI:
Kya aapko koi existing medical condition hai?

Patient:
Haan, diabetes hai.

AI:
Kya aap abhi koi regular medicines le rahe hain?

Patient:
Haan.

AI:
Kaunsi medicine le rahe hain?

Patient:
Metformin.

AI:
Thank you. I've recorded the information for your doctor.
```

Expected structured result:

```json
{
  "chief_complaint": "cough",
  "duration": "2 days",
  "associated_symptoms": [
    "fever",
    "mucus"
  ],
  "breathing_difficulty": false,
  "medical_history": [
    "diabetes"
  ],
  "current_medications": [
    "metformin"
  ],
  "intake_status": "completed"
}
```

---

# 22. Core Design Principles

The implementation must follow these principles:

1. **Adaptive, not rigid**
2. **One question at a time**
3. **Never invent patient information**
4. **Preserve original patient responses**
5. **Voice and text use the same conversation engine**
6. **Use structured outputs**
7. **Maintain conversation state**
8. **Do not diagnose**
9. **Do not prescribe**
10. **Potential safety signals go to a dedicated safety/rules layer**
11. **Previous answers must never be unnecessarily repeated**
12. **The doctor remains the final clinical decision-maker**

---

# 23. Module Output

At the end of Module 2, the system must produce a validated structured object containing:

```text
Patient ID
Session ID
Chief Complaint
Duration
Symptoms
Severity
Relevant Associated Symptoms
Medical History
Current Medications
Allergies
Previous Relevant Conditions
Original Transcripts
Normalized Information
Language
Input Mode
Missing Information
Potential Safety Signals
Conversation Status
```

This object becomes the input for:

```text
Module 3:
AI Pre-Triage / Priority Assessment
```

---

## Definition of Done

Module 2 is considered complete when a patient can:

1. Start an intake session.
2. Provide answers through text.
3. Provide answers through voice.
4. Speak Hindi, English, or Hinglish.
5. Receive adaptive follow-up questions.
6. Have answers converted into structured data.
7. Resume an interrupted conversation.
8. Handle unknown/refused answers.
9. Handle microphone/STT/API failures.
10. Complete the survey without losing collected information.
11. Produce a validated structured patient case for the pre-triage module.
