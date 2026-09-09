# MediKiosk — Integration Handoff Document

> **Executive Architecture & Engineering Handoff Document**  
> **Target Audience:** Incoming Senior Software Engineers, AI Coding Agents, Clinical Reviewers, Hackathon Evaluators

---

## 🎯 1. System Mission & Scope Summary

MediKiosk is an AI-powered patient intake, clinical pre-triage, and hospital queue-optimization MVP. It automates patient registration, conversational symptom gathering (in English, Hindi, and regional languages via voice or text), AI pre-triage acuity calculation (`P0`, `P1`, `P2`, `P3`), Super Admin review gates, doctor turn queues, and digital prescription issuance.

### Absolute System Invariants:
- **AI Clinical Boundary:** AI supports intake structuring, risk identification, priority suggestion, and queue allocation. **AI NEVER issues diagnoses, differential diagnoses, disease probabilities, or prescriptions.**
- **Doctor Clinical Ownership:** Attending doctors exclusively own clinical examination, formal diagnoses, prescriptions, lab orders, and follow-up care.
- **P0 Auto-Escalation:** P0 detection triggers automatic emergency dispatch, notification, and timeline generation **WITHOUT** Admin approval. P0 cases never enter the normal review queue or approval-gated doctor queue. Admin actions are coordination/override only.
- **Super Admin Review Gate for P1–P3:** Routine and urgent pre-triage assessments (P1, P2, P3) require human admin approval before queue admission. Overriding priority strictly requires a mandatory `override_reason`.
- **Zero Invented Facts:** Unknown responses ("I don't know") are preserved as unknown, never fabricated into negative assertions (e.g. unknown allergies $\neq$ "No allergies").

---

## 🏗️ 2. Repository & Tech Stack Quick Reference

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, CSS custom properties (`src/app/globals.css`), running on `http://localhost:3000` (development fallback supports port `3001`).
- **Backend:** FastAPI, Python 3.10–3.12, Uvicorn, Pydantic Settings, running on `http://127.0.0.1:8000`.
- **Security & RBAC:** Centralized access control (`backend/app/auth_rbac.py`) with role guards (`admin`, `doctor`, `patient`), safe walk-up kiosk token handling (`kiosk-*`), and cross-patient session isolation.
- **AI Inference:** Groq Cloud API (`llama-3.3-70b-versatile` / `openai/gpt-oss-20b`) with JSON-mode structured completions.
- **Voice Stack:** Sarvam AI Saaras v3 (STT) and Bulbul v3 (TTS) with Opus/WebM browser audio capture.
- **Persistence Layer:** Hybrid persistence (`backend/app/persistence.py`) with thread-safe in-memory stores and resilient write-through to Supabase PostgreSQL (10 tables with Row Level Security).
- **API Spec Parity:** All endpoints exposed under both `/api/*` and canonical mirror `/api/v1/*`.

---

## 🗺️ 3. Master Documentation Directory

All detailed technical documentation is maintained in [`/docs/`](file:///docs/):

| Document | File Path | Focus |
| :--- | :--- | :--- |
| **README** | [`docs/README.md`](file:///docs/README.md) | Master Documentation Index, Core Product Flow & System Invariants |
| **Architecture** | [`docs/architecture.md`](file:///docs/architecture.md) | Multi-tier Architecture, Presentation, Application, AI & Data Layers |
| **Repository Map** | [`docs/repository-map.md`](file:///docs/repository-map.md) | Complete Repository Map, Directory Layout & File Manifest |
| **Frontend** | [`docs/frontend.md`](file:///docs/frontend.md) | Next.js App Router Catalog (`/`, `/patient`, `/doctor`, `/admin`), Components |
| **Backend** | [`docs/backend.md`](file:///docs/backend.md) | FastAPI Layer, Router Architecture, RBAC & Resiliency Patterns |
| **API Reference** | [`docs/api.md`](file:///docs/api.md) | Complete OpenAPI / REST API Reference with Request/Response Schemas |
| **Database** | [`docs/database.md`](file:///docs/database.md) | 10 PostgreSQL Tables, ERD, RLS Security Policies & Indexes |
| **AI Pipeline** | [`docs/ai-pipeline.md`](file:///docs/ai-pipeline.md) | Groq LLaMA Prompt Engineering, Question Bank Traversal & Guardrails |
| **Voice Pipeline** | [`docs/voice-pipeline.md`](file:///docs/voice-pipeline.md) | Sarvam Saaras STT & Bulbul TTS Audio Flow & Frontend State Machine |
| **Queue Engine** | [`docs/queue-engine.md`](file:///docs/queue-engine.md) | P0 Auto-Escalation, P1–P3 Priority Bands, Admin Gate & Doctor Queue |
| **Business Rules** | [`docs/business-rules.md`](file:///docs/business-rules.md) | Clinical Invariants, Emergency Red-Flag Catalog & Role Authority Matrix |
| **Security & Auth** | [`docs/authentication-security.md`](file:///docs/authentication-security.md) | Auth Architecture, JWT Tokens, Kiosk Auth & Security Audit |
| **Testing Guide** | [`docs/testing.md`](file:///docs/testing.md) | Test Suites, Anti-Hallucination, Regression & Contract Verification |
| **Development Setup** | [`docs/development-setup.md`](file:///docs/development-setup.md) | Step-by-Step Local Developer Setup Guide |
| **Deployment** | [`docs/deployment.md`](file:///docs/deployment.md) | Production Hosting Topology, Reverse Proxy & Environment Variables |
| **Data Flows** | [`docs/data-flows.md`](file:///docs/data-flows.md) | 5 Detailed End-to-End Sequence Diagrams |
| **State Machines** | [`docs/state-machines.md`](file:///docs/state-machines.md) | Lifecycle State Transition Diagrams (Session, Triage, Turn, Emergency) |
| **Technical Debt** | [`docs/technical-debt.md`](file:///docs/technical-debt.md) | Technical Debt Matrix & Prioritized Engineering Roadmap |

---

## ⚡ 4. Fast-Start Local Runbook

### Terminal 1: Backend Dev Server
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Health Check: `http://127.0.0.1:8000/health` (`status: ok`)
- Swagger Docs: `http://127.0.0.1:8000/docs`

### Terminal 2: Frontend Dev Server
```powershell
cd frontend
npm install
npm run dev
```
- Available at `http://localhost:3000` (or `http://localhost:3001`)

### Terminal 3: Run Automated Verification Tests
```powershell
cd backend

# 1. Run RBAC, Contracts & P0 Safety Invariants (11 tests)
.\.venv\Scripts\pytest.exe -v test_rbac_and_contracts.py

# 2. Run Voice, Anti-Hallucination & Emergency Red-Flag Suite (7 tests)
.\.venv\Scripts\python.exe test_voice_and_safety.py

# 3. Run End-to-End Clinical Triage & Doctor Queue Suite
.\.venv\Scripts\python.exe test_triage_and_queue.py

# 4. Run Core Backend Unit & Question Bank Tests (4 tests)
.\.venv\Scripts\python.exe test_backend.py
```

### Terminal 4: Seed Deterministic Clinical Cohort
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/triage/seed-demo" -Method POST
```
Seeds 5 deterministic clinical test cases:
- **P0** (`Rajesh Sharma`): STEMI / Chest Pressure $\rightarrow$ auto-dispatched to Emergency Resuscitation Room.
- **P0** (`Suresh Verma`): Stridor / Acute Anaphylaxis $\rightarrow$ auto-dispatched to Resuscitation Bay.
- **P1** (`Priya Sharma`): High fever with petechial rash $\rightarrow$ queued to Dr. S. Kulkarni (Internal Medicine).
- **P2** (`Anita Patel`): Productive cough $\rightarrow$ queued to Dr. Vance (General Medicine).
- **P3** (`Vikram Singh`): Mild sprain / routine checkup $\rightarrow$ queued to Dr. K. Iyer (Orthopedics).

---

## 🔑 5. Critical Ports & User Portals

- **Role Gateway:** `http://localhost:3000` -> Central entrance portal for all hospital roles.
- **Patient Kiosk:** `http://localhost:3000/patient` -> Multilingual Welcome (`en`, `hi`, `mr`, `ta`, `bn`), Consent, Identity/OTP, Voice/Text Intake, Red-Flag Alerts, Live Queue Status, and Printable Digital Rx.
- **Doctor Workstation:** `http://localhost:3000/doctor` -> Priority OPD Queue ($P1 > P2 > P3$ FIFO), P0 Emergency Handover Alert, Patient Case Dossier, Examination Vitals, Official Diagnosis, and Multi-Medication Digital Rx Builder.
- **Super Admin Dashboard:** `http://localhost:3000/admin` -> Operations KPIs, Persistent P0 Emergency Lane, Review Queue for pending intakes, Priority Override Modal (with mandatory clinical rationale), Staff Doctor Availability, Hospital Load Analytics, and Immutable Audit Log.
- **Backend API Docs:** `http://127.0.0.1:8000/docs` -> Interactive Swagger UI.

---

## 📌 6. Immediate Next Engineering Priorities

1. **PostgreSQL Token Sequences:** Bind token generation directly to a database sequence (`CREATE SEQUENCE opd_token_seq START 100;`) to guarantee atomic serialization across multi-worker deployments.
2. **Real-Time Event Streaming:** Upgrade client polling intervals (5–8s) to Supabase Realtime Channels or FastAPI WebSockets / Server-Sent Events (SSE) for instant turn calling.
3. **Cookie-Based Auth:** Transition JWT token storage from browser `localStorage` to `HttpOnly`, `SameSite=Strict` secure session cookies in production.
4. **Medical Audio Archiving:** Add an optional cloud storage upload hook to archive raw patient voice recordings in Supabase Storage (`medical-documents/audio/`) for clinical audio quality telemetry.
