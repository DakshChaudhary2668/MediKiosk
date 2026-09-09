# MediKiosk — Production Technical Documentation

> **AI-Powered Patient Intake, Clinical Pre-Triage, and Hospital Queue Optimization MVP**

MediKiosk is an intelligent healthcare kiosk and clinical workflow platform designed to streamline outpatient department (OPD) intake, capture patient symptoms through multilingual voice/text conversational AI, evaluate operational urgency (P0–P3), enforce a Super Admin human-in-the-loop review gate, and deliver an organized priority turn queue to attending physicians.

---

## 🧭 Master Documentation Index

| Document | Purpose & Scope |
| :--- | :--- |
| [architecture.md](file:///docs/architecture.md) | High-level system architecture, component boundaries, and runtime layers. |
| [repository-map.md](file:///docs/repository-map.md) | Complete directory and file manifest explaining production code vs. scripts vs. config. |
| [frontend.md](file:///docs/frontend.md) | Next.js App Router, PWA design, component state, audio capture, and screen documentation. |
| [backend.md](file:///docs/backend.md) | FastAPI framework, dependency injection, router design, error handling, and resiliency fallbacks. |
| [api.md](file:///docs/api.md) | Complete OpenAPI/REST API specification (Auth, Patient, Intake, Triage Gate, Queue, Consultation). |
| [database.md](file:///docs/database.md) | PostgreSQL / Supabase schema, entity relationships (ERD), RLS security policies, and indexes. |
| [ai-pipeline.md](file:///docs/ai-pipeline.md) | Groq LLaMA prompt architecture, anti-hallucination guardrails, and question bank traversal. |
| [voice-pipeline.md](file:///docs/voice-pipeline.md) | Sarvam Saaras STT & Bulbul TTS integration, WebM streaming, audio validation, and latency handling. |
| [queue-engine.md](file:///docs/queue-engine.md) | P0 auto-escalation, P1/P2/P3 acuity bands, Admin review gate, token allocation, and Doctor turn queue. |
| [business-rules.md](file:///docs/business-rules.md) | Strict medical boundaries, non-diagnostic invariants, deterministic red-flag overrides, and role limits. |
| [authentication-security.md](file:///docs/authentication-security.md) | Supabase Auth, Bearer token handling, kiosk auth, Row Level Security, and HIPAA/data privacy. |
| [testing.md](file:///docs/testing.md) | Test suites, clinical workflow verification, anti-hallucination test suite, and execution guide. |
| [development-setup.md](file:///docs/development-setup.md) | Step-by-step local developer setup guide (Python venv, Node.js, Supabase, Groq, Sarvam). |
| [deployment.md](file:///docs/deployment.md) | Production build configuration, environment variables, hosting topology, and PWA setup. |
| [data-flows.md](file:///docs/data-flows.md) | 13 end-to-end data flow sequence diagrams across Patient, Admin, AI, and Doctor actors. |
| [state-machines.md](file:///docs/state-machines.md) | Lifecycle state machine diagrams (Session, Case, Triage Assessment, Queue Turn, Consultation). |
| [technical-debt.md](file:///docs/technical-debt.md) | Rigorous architectural debt audit, missing production pieces, and prioritized technical roadmap. |

---

## 🏥 Core Product Architecture at a Glance

```mermaid
flowchart TD
    subgraph Patient["Patient Kiosk / PWA (/patient)"]
        A[Language Selection] --> B[Consent & Demographic Identity]
        B --> C[Voice / Text AI Intake]
        C --> D[Structured Case Dossier]
    end

    subgraph AI["AI Acuity & Safety Layer"]
        D --> E{Deterministic Red-Flag Check}
        E -->|Red Flag Detected| F1[P0 Emergency Auto-Escalation]
        E -->|No Red Flag| F2[Groq AI Pre-Triage Engine]
        F2 --> G[P1 / P2 / P3 Acuity Proposal]
    end

    subgraph P0Lane["Emergency Protocol (Bypasses Review)"]
        F1 --> P0Dispatch[Automatic Emergency Team Dispatch]
        P0Dispatch --> P0Alert[Real-time Emergency Timeline & Kiosk Alert]
    end

    subgraph AdminGate["Super Admin Review Gate (/admin)"]
        G --> H{Admin Approval Gate}
        H -->|Approve / Override| I[Token Allocated & Priority Queue Admission]
        H -->|Reject / Clarify| HRej[Awaiting Clarification]
    end

    subgraph Doctor["Doctor Workstation (/doctor)"]
        I --> K[Live Priority Queue: P1 ➔ P2 ➔ P3 FIFO]
        K --> L[Turn Call & Medical Consultation]
        L --> M[Official Diagnosis & Digital Rx]
        P0Alert -.->|Handover Coordination Only| DocHandover[P0 Handover Panel]
    end

    subgraph Output["Patient Records"]
        M --> N[Digital Prescription Released to Patient]
        N --> O[Immutable Supabase Audit Trail]
    end
```

---

## 🔒 Absolute System Invariants

1. **Non-Diagnostic AI Boundary:** The AI Engine (Groq LLaMA) **NEVER** issues medical diagnoses, differential diagnoses, disease probabilities, or clinical prescriptions. It functions strictly as an intake structuring and triage advisory tool.
2. **Clinical Ownership:** Final diagnoses, clinical prescriptions, laboratory orders, and care plans are exclusively authored and signed by registered medical doctors.
3. **P0 Auto-Escalation:** P0 detection triggers automatic emergency dispatch, notification, and timeline generation **WITHOUT** requiring Admin approval. P0 cases never enter the normal review queue or approval-gated doctor queue. Admin actions are coordination/override only.
4. **Super Admin Human-in-the-Loop Gate for P1–P3:** AI pre-triage recommendations for routine and urgent cases (P1, P2, P3) do not automatically admit patients to the Doctor queue. A Super Admin or Triage Nurse reviews evidence, confirms/overrides priority, and admits to the turn queue.
5. **Zero Invented Facts:** Unknown responses ("I don't know") are never defaulted to negative clinical answers ("No allergies"). Facts are extracted only from direct user statements.
