# MediKiosk — Integration Handoff Document

> **Executive Architecture & Engineering Handoff Document**
> **Target Audience:** Incoming Senior Software Engineers, AI Coding Agents, Clinical Reviewers, Hackathon Evaluators

---

## 🎯 1. System Mission & Scope Summary

MediKiosk is an AI-powered patient intake, clinical pre-triage, and hospital queue-optimization MVP. It automates patient registration, conversational symptom gathering (in English, Hindi, and Hinglish via voice or text), AI pre-triage acuity calculation (`P0`, `P1`, `P2`, `P3`), Super Admin review gates, doctor turn queues, and digital prescription issuance.

### Absolute System Boundaries:
- **AI Boundary:** AI supports intake structuring, risk identification, priority suggestion, and queue allocation. **AI NEVER issues diagnoses or prescriptions.**
- **Doctor Authority:** Attending doctors exclusively own clinical assessment, formal diagnoses, medications, and follow-up care.
- **Super Admin Gate:** No AI recommendation directly enters the doctor queue without Super Admin approval or override.
- **P0 Emergency Bypass:** True acute emergencies bypass standard OPD queues for direct emergency room escalation.

---

## 🏗️ 2. Repository & Tech Stack Quick Reference

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Sass/SCSS modules (`http://localhost:3000`).
- **Backend:** FastAPI, Python 3.10+, Uvicorn, Pydantic Settings (`http://localhost:8000`).
- **AI Inference:** Groq Cloud API (`llama-3.3-70b-versatile`) with JSON-mode structured completions.
- **Voice Stack:** Sarvam AI Saaras v3 (STT) and Bulbul v3 (TTS) with Opus/WebM browser audio capture.
- **Persistence:** Supabase PostgreSQL with Row Level Security (RLS) + In-Memory Resilient Cache.

---

## 🗺️ 3. Master Documentation Directory

All detailed technical documentation is maintained in `/docs/`:

```
/docs
├── README.md                      # Master Documentation Index & Overview
├── architecture.md                # Multi-tier System Architecture & Failure Modes
├── repository-map.md              # Complete Repository Map & File Manifest
├── frontend.md                    # Next.js Pages, Routing & PWA UI Architecture
├── backend.md                     # FastAPI Layer, Routers & Resiliency Architecture
├── api.md                         # Complete OpenAPI / REST API Reference
├── database.md                    # Supabase PostgreSQL Schema, ERD & RLS Policies
├── ai-pipeline.md                 # Groq LLaMA Prompt Engineering & Guardrails
├── voice-pipeline.md              # Sarvam Saaras STT & Bulbul TTS Audio Flow
├── queue-engine.md                # P0-P3 Acuity Bands, Admin Gate & Doctor Queue
├── business-rules.md              # Clinical Invariants & Emergency Red-Flag Catalog
├── authentication-security.md     # Auth Architecture, JWT Tokens & Security Audit
├── testing.md                     # Test Suites, Anti-Hallucination & Verification
├── development-setup.md           # Step-by-Step Local Developer Setup Guide
├── deployment.md                  # Production Hosting Topology & Environment Variables
├── data-flows.md                  # 13 End-to-End Sequence Diagrams
├── state-machines.md              # Lifecycle State Transition Diagrams
└── technical-debt.md              # Technical Debt Matrix & Prioritized Roadmap
```

---

## ⚡ 4. Fast-Start Local Runbook

### Terminal 1: Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Terminal 2: Frontend
```powershell
cd frontend
npm install
npm run dev
```

### Terminal 3: Run Verification Tests & Seed Data
```powershell
cd backend
# 1. Verify anti-hallucination & safety rules (7/7 tests)
.\venv\Scripts\python.exe test_voice_and_safety.py

# 2. Verify end-to-end clinical workflow
.\venv\Scripts\python.exe test_triage_and_queue.py

# 3. Seed 10 realistic test patient cases across P0-P3
.\venv\Scripts\python.exe seed_demo_assessments.py
```

---

## 🔑 5. Critical Ports & User Portals

- **Patient Portal:** `http://localhost:3000` -> Multilingual Welcome, Consent, AI Intake, Live Queue Tracker, Digital Rx.
- **Admin Triage Gate:** `http://localhost:3000/admin` -> Super Admin review dashboard, AI evidence provenance, priority override modal, demo seed trigger.
- **Doctor Workstation:** `http://localhost:3000/doctor` -> Priority OPD queue (`P1 -> P2 -> P3`), turn caller, clinical dossier, and digital prescription builder.
- **Backend API Docs:** `http://localhost:8000/docs` -> Interactive Swagger UI.

---

## 📌 6. Immediate Next Engineering Priorities

1. **Normalize Queue in PostgreSQL:** Move `_TRIAGE_ASSESSMENTS` and `_DOCTOR_QUEUE` from in-memory dictionaries into dedicated Supabase tables with a PostgreSQL sequence for token allocation.
2. **Real-time Push Notifications:** Replace 5–8 second frontend polling intervals with Supabase Realtime Channels.
3. **Cryptographic RBAC:** Enforce Supabase Custom Claims on JWTs to distinguish `doctor`, `admin`, and `patient` roles at the API gateway layer.
