# Business Rules & Clinical Invariants

This document outlines the clinical invariants, operational boundaries, and business rules enforced across the MediKiosk platform.

---

## ⚖️ Code-Enforced vs. Operational Rules Matrix

| Rule ID | Domain | Rule Description | Enforced In Code | Enforcement Location |
| :--- | :--- | :--- | :--- | :--- |
| **BR-01** | Clinical Boundary | AI must NEVER provide medical diagnoses, differential diagnoses, or disease probabilities. | **Yes** | `app/services/ai_engine.py`, `app/services/pre_triage.py` |
| **BR-02** | Clinical Boundary | AI must NEVER issue prescriptions, drug dosages, or medical orders. | **Yes** | `app/services/ai_engine.py`, `app/models.py` |
| **BR-03** | Clinical Ownership | Official diagnoses and prescriptions can ONLY be created and signed by registered doctors during consultation. | **Yes** | `app/routers/queue.py` (`POST /doctor/turn/{id}/consult`) |
| **BR-04** | Triage Gate | AI pre-triage acuity recommendations (P1, P2, P3) CANNOT directly add patients to the active doctor queue without human admin review. | **Yes** | `app/routers/triage.py` (`_TRIAGE_STORE` review gate) |
| **BR-05** | P0 Auto-Escalation | P0 detection triggers automatic emergency dispatch, notification, and timeline WITHOUT Admin approval. P0 CANNOT enter normal review queue or approval-gated doctor queue. | **Yes** | `app/routers/intake.py`, `app/persistence.py` (`enqueue_doctor_item` raises `ValueError` on P0) |
| **BR-06** | Fact Extraction | Unstated/unknown medical information must NOT be defaulted to negative facts (e.g. unknown allergies $\neq$ "No allergies"). | **Yes** | `app/services/ai_engine.py` (Anti-Hallucination Rule 3) |
| **BR-07** | Voice Discipline | Silent, corrupt, or empty audio input must be rejected (HTTP 422) without calling the LLM or injecting synthetic transcripts. | **Yes** | `app/routers/intake.py` (`POST /voice`), `app/services/stt.py` |
| **BR-08** | Consent Invariant | Patient consent is mandatory before conversational intake begins. | **Yes** | `src/app/patient/page.tsx`, `app/routers/patient.py` |
| **BR-09** | Queue Ordering | Doctor queue must strictly serve patients by priority band (`P1 -> P2 -> P3`), then arrival timestamp (FIFO). | **Yes** | `app/routers/queue.py` (`GET /doctor/queue`) |
| **BR-10** | Audit Logging | Every consent action, case generation, triage approval/override, and consultation completion must be logged immutably. | **Yes** | `audit_logs` table in `supabase/migration.sql` |
| **BR-11** | Mandatory Override Reason | An administrator overriding priority (e.g. P2 -> P1) must provide an explicit, non-empty `override_reason`. | **Yes** | `app/routers/triage.py` (`POST /triage/{id}/review`) |
| **BR-12** | Review Idempotency | Duplicate review submissions for an already-approved assessment safely return the existing token number. | **Yes** | `app/routers/triage.py` |
| **BR-13** | Patient Isolation | Patients are strictly forbidden from viewing, updating, or completing another patient's intake session. | **Yes** | `app/auth_rbac.py` (`assert_patient_access()`) |
| **BR-14** | Contract Reconciliation | Bidirectional field aliases (`medicine_name` $\leftrightarrow$ `medication_name`, `turn_number` $\leftrightarrow$ `token_number`) must be accepted seamlessly. | **Yes** | `app/models.py` (`@model_validator`) |

---

## 🚨 Deterministic Emergency Red Flags (`app/services/safety.py`)

The deterministic safety layer scans for the following clinical trigger topics across English, Hindi, and Hinglish:

1. **Severe Breathing Emergencies:**
   - Keywords: `can't breathe`, `saans nahi`, `severe breathing`, `suffocating`, `choking`, `gasping`.
   - Action: Immediate red alert, terminates survey, sets `P0`, auto-dispatches emergency protocol.
2. **Acute Chest Emergencies / Possible Infarction:**
   - Keywords: `chest pain`, `seene mein dard`, `chest pressure`, `crushing chest`, `heart attack`, `dil ka daura`.
   - Action: Immediate red alert, terminates survey, sets `P0`, auto-dispatches emergency protocol.
3. **Acute Neurological Events / Stroke Signs:**
   - Keywords: `sudden weakness`, `sudden numbness`, `slurred speech`, `face drooping`, `stroke`, `paralysis`, `one side weak`.
   - Action: Immediate red alert, terminates survey, sets `P0`, auto-dispatches emergency protocol.
4. **Altered Consciousness & Critical Conditions:**
   - Keywords: `fainted`, `unconscious`, `behosh`, `passed out`, `seizure`, `severe bleeding`, `blood won't stop`.
   - Action: Immediate red alert, terminates survey, sets `P0`, auto-dispatches emergency protocol.
5. **Self-Harm / Mental Health Crisis:**
   - Keywords: `suicide`, `self harm`, `kill myself`, `marna chahta`.
   - Action: Immediate crisis hotline / emergency intervention alert.
6. **Severe Anaphylaxis / Airway Compromise:**
   - Keywords: `throat swelling`, `tongue swelling`, `anaphylaxis`, `can't swallow`, `lips swelling`.
   - Action: Immediate red alert, terminates survey, sets `P0`, auto-dispatches emergency protocol.

---

## 👥 Role Authority Matrix

```mermaid
graph TD
    subgraph PatientRole["Patient / Kiosk Role"]
        P1[Register & Authenticate / Kiosk Walk-Up]
        P2[Sign AI Medical Consent]
        P3[Complete Voice/Text AI Intake]
        P4[Upload Medical Records]
        P5[View Live Queue Position & Wait Time]
        P6[Receive & Print Official Digital Rx]
    end

    subgraph AdminRole["Super Admin / Triage Nurse Role"]
        A1[Monitor Incoming Intakes]
        A2[Inspect AI Pre-Triage Evidence Quotes]
        A3[Approve P1/P2/P3 & Admit to Queue]
        A4[Override Priority with Mandatory Clinical Reason]
        A5[Coordinate & Acknowledge P0 Emergencies]
        A6[Seed Deterministic Test Cohorts]
    end

    subgraph DoctorRole["Doctor Role"]
        D1[View Priority-Ordered OPD Queue: P1 > P2 > P3]
        D2[Call Patient Turn & Start Consultation]
        D3[Review Patient Dossier & AI Context]
        D4[Record Vitals & Clinical Examination]
        D5[Author Mandatory Official Diagnosis]
        D6[Issue Multi-Item Digital Prescription]
    end
```
