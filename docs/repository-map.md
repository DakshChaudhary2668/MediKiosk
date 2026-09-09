# Codebase & Repository Map

This document details the complete file system structure of the MediKiosk repository, describing the purpose of each directory and file, its runtime category, and inter-file dependencies.

---

## 📁 Root Directory Layout

```
AI_medikiosk/
├── backend/                  # FastAPI backend service, AI orchestration & test suites
├── docs/                     # Technical architecture, workflows, schemas, and API documentation
├── frontend/                 # Next.js 14 PWA client application
├── supabase/                 # Database migrations, RLS policies, and schema definitions
└── .gitignore                # Git ignore patterns for venv, node_modules, and environment files
```

---

## 🐍 Backend (`backend/`)

| File / Folder | Category | Purpose & Description | Depends On / Depended By |
| :--- | :--- | :--- | :--- |
| `app/main.py` | **Production Logic** | FastAPI application entry point, CORS middleware setup, router aggregation (`auth`, `patient`, `intake`, `triage`, `queue`), and `/health` endpoint. | Imports all routers in `app/routers/`. |
| `app/config.py` | **Configuration** | Pydantic Settings reading environment variables (`SUPABASE_URL`, `GROQ_API_KEY`, `SARVAM_API_KEY`, model names). | Depended on by `app/db.py` and services. |
| `app/db.py` | **Infrastructure** | Initializes the Supabase client using `settings.supabase_url` and `settings.supabase_secret_key`. | Depended on by all router modules. |
| `app/models.py` | **Production Models** | Unified Pydantic models for Auth, Patient, Intake, Pre-Triage, Queue, Prescriptions, and Consultations. | Depended on by all backend modules. |
| `app/routers/auth.py` | **Production Logic** | User registration, password login, current user endpoint (`/me`), and `get_user_id()` helper with dev token fallback. | `app/models.py`, `app/db.py`. |
| `app/routers/patient.py` | **Production Logic** | Patient profile management (`GET`/`POST /api/patient/profile`), consent recording, medical document upload to Supabase Storage, and session listing. | `app/db.py`, `app/models.py`. |
| `app/routers/intake.py` | **Production Logic** | Core conversational intake router (`/api/intake/session`, `/api/intake/message`, `/api/intake/voice`, `/api/intake/session/{id}/complete`). Triggers pre-triage upon completion. | `app/services/ai_engine.py`, `safety.py`, `stt.py`, `tts.py`. |
| `app/routers/triage.py` | **Production Logic** | Super Admin Triage Gate (`/api/triage/pending`, `/api/triage/{id}/review`, `/api/triage/seed-demo`, `/api/triage/assess`). Manages `_TRIAGE_ASSESSMENTS` and admits patients to `_DOCTOR_QUEUE`. | `app/services/pre_triage.py`, `app/models.py`. |
| `app/routers/queue.py` | **Production Logic** | Doctor Turn Queue & Consultation router (`/api/doctor/queue`, `/api/doctor/turn/{id}/call`, `/api/doctor/turn/{id}/start`, `/api/doctor/turn/{id}/consult`, `/api/patient/queue-status`). | `app/routers/triage.py`, `app/models.py`. |
| `app/services/ai_engine.py` | **Production Logic** | Groq LLaMA conversational processor with anti-hallucination guardrails and question bank traversal. | `docs/ai-intake/QUESTION_BANK.json`, Groq SDK. |
| `app/services/pre_triage.py` | **Production Logic** | AI acuity engine analyzing `PatientCase` to produce `PreTriageAssessment` (P0–P3, confidence, uncertainty, evidence). | `app/models.py`, Groq SDK. |
| `app/services/safety.py` | **Production Logic** | Deterministic regex-based red-flag filter detecting 7 acute medical emergency categories. | Depended on by `intake.py`, `ai_engine.py`, `voice_pipeline.py`. |
| `app/services/stt.py` | **Production Logic** | Sarvam Saaras v3 Speech-to-Text integration supporting Indian languages (`hi-IN`, `en-IN`, etc.). | `httpx`, `app/config.py`. |
| `app/services/tts.py` | **Production Logic** | Sarvam Bulbul v3 Text-to-Speech integration returning base64 audio bytes. | `httpx`, `app/config.py`. |
| `app/services/voice_pipeline.py`| **Production Logic** | Unified wrapper class coordinating STT -> Safety -> Groq -> TTS turns. | `stt.py`, `tts.py`, `ai_engine.py`, `safety.py`. |
| `seed_demo_assessments.py` | **Seed / Demo Script** | CLI script generating 4 distinct clinical test cases (P0–P3) and seeding the Admin Gate. | `app/services/pre_triage.py`. |
| `test_backend.py` | **Test Suite** | Unit tests for auth, patient profile, session lifecycle, and fallback responses. | `pytest` / `unittest`. |
| `test_triage_and_queue.py` | **Test Suite** | End-to-end integration test for AI pre-triage, Admin approval gate, Doctor turn calls, and Digital Rx issuance. | `asyncio`. |
| `test_voice_and_safety.py` | **Test Suite** | 7 clinical safety & anti-hallucination tests (symptom extraction, duration non-fabrication, unknown handling, empty audio rejection, red flag triggers). | `asyncio`. |
| `test_dev_server_live.py` | **Test Suite** | Live HTTP client integration test querying running FastAPI server on port 8000. | `httpx`. |
| `requirements.txt` | **Build / Dependencies** | Python package manifest (`fastapi`, `uvicorn`, `supabase`, `groq`, `httpx`, etc.). | Used by `pip install -r requirements.txt`. |
| `.env.example` | **Configuration Template**| Template for required backend API keys and Supabase credentials. | Read by `app/config.py`. |

---

## 🌐 Frontend (`frontend/`)

| File / Folder | Category | Purpose & Description | Depends On / Depended By |
| :--- | :--- | :--- | :--- |
| `src/app/layout.tsx` | **UI Layout** | Root HTML/body wrapper applying global CSS variables, typography, and viewport meta tags. | `src/styles/globals.scss`. |
| `src/app/page.tsx` | **UI Screen** | Landing page with language selector (English, Hindi, Hinglish) and entry redirect. | `next/navigation`. |
| `src/app/login/page.tsx` | **UI Screen** | Patient login screen with email/password form and token storage. | `src/lib/api.ts`. |
| `src/app/register/page.tsx` | **UI Screen** | Account creation screen with auto-login redirect to consent flow. | `src/lib/api.ts`. |
| `src/app/consent/page.tsx` | **UI Screen** | Mandatory medical AI consent declaration screen. | `src/lib/api.ts`. |
| `src/app/profile/page.tsx` | **UI Screen** | Patient demographic profile form (Name, Age, Gender, Blood Group, Phone, Emergency Contact). | `src/lib/api.ts`. |
| `src/app/documents/page.tsx` | **UI Screen** | Medical records upload screen (PDF/images) with file size validation. | `src/lib/api.ts`. |
| `src/app/dashboard/page.tsx` | **UI Screen** | Patient live OPD token tracker, progress stepper, past sessions list, and digital prescription viewer. | `src/lib/api.ts`. |
| `src/app/intake/[sessionId]/page.tsx` | **UI Screen** | Voice and text conversational intake interface with microphone recorder, audio stream slicing, and TTS auto-play. | `src/lib/api.ts`, `intake.module.scss`. |
| `src/app/admin/page.tsx` | **UI Screen** | Super Admin Triage Gate dashboard with pending intakes, AI confidence/evidence inspection, priority override modal, and demo seed trigger. | `src/lib/api.ts`. |
| `src/app/doctor/page.tsx` | **UI Screen** | Doctor OPD workstation with live priority queue (`P1 -> P2 -> P3`), turn call controls, patient intake dossier, and multi-medication digital prescription builder. | `src/lib/api.ts`. |
| `src/lib/api.ts` | **API Client** | Typed REST client with bearer token management, error unwrap, and fetch calls to `/api/*`. | Used by all Next.js pages. |
| `src/styles/globals.scss` | **Styling System** | Global CSS custom properties (color palettes, shadows, spacing, buttons, badges, typography). | Imported by `layout.tsx`. |
| `public/manifest.json` | **PWA Configuration** | Web app manifest for Progressive Web App installation on kiosk tablets and mobile devices. | Next.js build. |
| `next.config.js` | **Configuration** | Next.js configuration with security headers and API reverse proxy rewrite to `http://localhost:8000`. | Next.js server runtime. |
| `package.json` | **Dependencies** | Node.js manifest with dependencies (`next`, `react`, `react-dom`, `sass`, `typescript`). | `npm install`. |

---

## 🗄️ Database (`supabase/`)

| File | Category | Purpose & Description |
| :--- | :--- | :--- |
| `supabase/migration.sql` | **Database Schema** | SQL migration script creating tables (`patients`, `patient_sessions`, `conversation_messages`, `patient_cases`, `medical_documents`, `audit_logs`), Row-Level Security policies, and performance indexes. |

---

## 📚 Documentation Package (`docs/`)

- `docs/ai-intake/QUESTION_BANK.json`: Structured clinical questionnaire covering 9 intake categories and global intake stages.
- `docs/ai-intake/AI_SURVEY_FLOW.md`: Canonical conversational state transitions and turn limits.
- `docs/ai-intake/PATIENT_INTAKE_SCHEMA.json`: Formal JSON Schema for the structured patient case dossier.
- `docs/architecture/medi-kiosk-erd.mmd`: Mermaid ER diagram source file.
- `docs/architecture/medi-kiosk-mvp.mmd`: High-level MVP flow diagram.
- `docs/01-mvp-workflow.md` through `docs/13-old-to-new-for-harry.md`: Foundational product specifications and architectural decisions.
