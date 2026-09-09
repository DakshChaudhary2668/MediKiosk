# Codebase & Repository Map

This document details the complete file system structure of the MediKiosk repository, describing the purpose of each directory and file, its runtime category, and inter-file dependencies.

---

## 📁 Root Directory Layout

```
medikiosk_ai/
├── backend/                  # FastAPI backend service, AI orchestration & test suites
├── docs/                     # Technical architecture, workflows, schemas, and API documentation
├── frontend/                 # Next.js 14 client application (Patient Kiosk, Doctor Suite, Super Admin)
├── supabase/                 # Database migrations, RLS policies, and schema definitions
└── .gitignore                # Git ignore patterns for venv, node_modules, and environment files
```

---

## 🐍 Backend (`backend/`)

| File / Folder | Category | Purpose & Description | Depends On / Depended By |
| :--- | :--- | :--- | :--- |
| `app/main.py` | **Production Logic** | FastAPI application entry point, CORS middleware setup (ports 3000, 3001), router aggregation (`auth`, `patient`, `intake`, `triage`, `queue`), mirror `/api/v1` routes, and `/health` endpoint. | Imports all routers in `app/routers/`. |
| `app/auth_rbac.py` | **Production Security** | Centralized Role-Based Access Control (`AuthUser`), Bearer token extraction, walk-up kiosk token handling (`kiosk` tokens mapped to patient role), and route guards (`require_admin`, `require_doctor`, `require_patient`, `assert_patient_access`). | Depended on by all routers. |
| `app/persistence.py` | **Production Persistence** | In-memory persistence stores (`_TRIAGE_STORE`, `_QUEUE_STORE`, `_CONSULTATION_STORE`, `_EMERGENCY_STORE`, `_SESSIONS_STORE`) with resilient write-through to Supabase. Contains strict P0 queue invariant check. | Depended on by routers and tests. |
| `app/config.py` | **Configuration** | Pydantic Settings reading environment variables (`SUPABASE_URL`, `GROQ_API_KEY`, `SARVAM_API_KEY`, model names). | Depended on by `app/db.py` and services. |
| `app/db.py` | **Infrastructure** | Initializes the Supabase client using `settings.supabase_url` and `settings.supabase_secret_key`. | Depended on by router modules. |
| `app/models.py` | **Production Models** | Unified Pydantic models with bidirectional field reconcilers for Auth, Patient, Intake, Pre-Triage, Queue, Prescriptions, and Consultations. | Depended on by all backend modules. |
| `app/routers/auth.py` | **Production Logic** | User registration, password login with role resolution (`admin`/`doctor`/`patient`), and `/me` current user endpoint. | `app/models.py`, `app/auth_rbac.py`. |
| `app/routers/patient.py` | **Production Logic** | Patient profile management (`GET`/`POST /api/patient/profile`), consent recording, medical document upload to Supabase Storage, and session listing. | `app/db.py`, `app/models.py`, `app/auth_rbac.py`. |
| `app/routers/intake.py` | **Production Logic** | Core conversational intake router (`/api/intake/session`, `/api/intake/message`, `/api/intake/voice`, `/api/intake/submit`, `/api/intake/session/{id}/complete`). Triggers immediate P0 emergency auto-escalation upon red flags. | `app/services/ai_engine.py`, `safety.py`, `stt.py`, `persistence.py`. |
| `app/routers/triage.py` | **Production Logic** | Super Admin Triage Gate (`/api/triage/pending`, `/api/triage/{id}/review`, `/api/triage/seed-demo`, `/api/triage/assess`). Manages assessments, mandatory override reasons, emergency coordination, and deterministic demo seeding. | `app/services/pre_triage.py`, `app/persistence.py`, `app/auth_rbac.py`. |
| `app/routers/queue.py` | **Production Logic** | Doctor Turn Queue & Consultation router (`/api/doctor/queue`, `/api/doctor/turn/{id}/call`, `/api/doctor/turn/{id}/in-consultation`, `/api/doctor/turn/{id}/consult`, `/api/patient/queue-status`). Supports optional auth for walk-up kiosk polling. | `app/persistence.py`, `app/auth_rbac.py`, `app/models.py`. |
| `app/services/ai_engine.py` | **Production Logic** | Groq LLaMA conversational processor with anti-hallucination guardrails and question bank traversal. | `docs/ai-intake/QUESTION_BANK.json`, Groq SDK. |
| `app/services/pre_triage.py` | **Production Logic** | AI acuity engine analyzing `PatientCase` to produce `PreTriageAssessment` (P0–P3, confidence, uncertainty, evidence). Strictly non-diagnostic. | `app/models.py`, Groq SDK. |
| `app/services/safety.py` | **Production Logic** | Deterministic regex-based red-flag filter detecting 7 acute medical emergency categories in English and Hindi. | Depended on by `intake.py`, `ai_engine.py`, `voice_pipeline.py`. |
| `app/services/stt.py` | **Production Logic** | Sarvam Saaras v3 Speech-to-Text integration supporting Indian languages (`hi-IN`, `en-IN`, etc.). | `httpx`, `app/config.py`. |
| `app/services/tts.py` | **Production Logic** | Sarvam Bulbul v3 Text-to-Speech integration returning base64 audio bytes. | `httpx`, `app/config.py`. |
| `app/services/voice_pipeline.py`| **Production Logic** | Unified wrapper class coordinating STT -> Safety -> Groq -> TTS turns. | `stt.py`, `tts.py`, `ai_engine.py`, `safety.py`. |
| `test_rbac_and_contracts.py` | **Test Suite** | 11 automated pytest tests verifying P0 emergency auto-escalation, priority ordering, mandatory override reasons, RBAC isolation, kiosk auth, dual `/api/v1` parity, and demo seeder. | `pytest`, `fastapi.testclient`. |
| `test_backend.py` | **Test Suite** | Unit tests for question bank loading, red flag filters, fallback LLM construction, and route mounting. | `pytest` / `unittest`. |
| `test_triage_and_queue.py` | **Test Suite** | End-to-end integration test for AI pre-triage, Admin approval gate, Doctor turn calls, and Digital Rx issuance. | `asyncio`. |
| `test_voice_and_safety.py` | **Test Suite** | 7 clinical safety & anti-hallucination tests (symptom extraction, duration non-fabrication, unknown handling, empty audio rejection, red flag triggers). | `asyncio`. |
| `test_dev_server_live.py` | **Test Suite** | Live HTTP client integration test querying running FastAPI server on port 8000. | `httpx`. |
| `seed_demo_assessments.py` | **Seed / Demo Script** | CLI script generating 4 distinct clinical test cases (P0–P3) and seeding the Admin Gate. | `app/services/pre_triage.py`. |
| `requirements.txt` | **Build / Dependencies** | Python package manifest (`fastapi`, `uvicorn`, `supabase`, `groq`, `httpx`, `pydantic`, `pytest`, etc.). | Used by `pip install -r requirements.txt`. |
| `.env.example` | **Configuration Template**| Template for required backend API keys and Supabase credentials. | Read by `app/config.py`. |

---

## 🌐 Frontend (`frontend/`)

| File / Folder | Category | Purpose & Description | Depends On / Depended By |
| :--- | :--- | :--- | :--- |
| `src/app/layout.tsx` | **UI Layout** | Root HTML/body wrapper applying global CSS variables, typography, and viewport meta tags. | `src/app/globals.css`. |
| `src/app/page.tsx` | **UI Screen** | Landing entrance portal with role cards directing users to Patient Kiosk (`/patient`), Doctor Suite (`/doctor`), or Super Admin Dashboard (`/admin`). | `next/link`. |
| `src/app/patient/page.tsx` | **UI Screen** | Comprehensive self-service patient intake kiosk: language selector (`en`, `hi`, `mr`, `ta`, `bn`), consent boundary, identity/OTP verification, voice/text intake with audio recorder, red-flag emergency detection, AI pre-triage outcome screens (P0 emergency alert / P1–P3 token display), and live queue dashboard with printable digital prescription. | `src/components/shared.tsx`, `src/lib/fixtures.ts`. |
| `src/app/doctor/page.tsx` | **UI Screen** | Attending physician clinical suite: prioritized turn queue (P1 > P2 > P3 FIFO), P0 emergency handover alert banner, patient dossier review, examination notes, vitals recording, official diagnosis, digital Rx authoring, and turn calling. | `src/components/shared.tsx`, `src/lib/fixtures.ts`. |
| `src/app/admin/page.tsx` | **UI Screen** | Super Admin Operations & Triage Review Gate: operations overview KPIs, persistent P0 Emergency Lane, review queue for pending intakes, priority override modal with mandatory clinical rationale, department doctor availability, hospital load analytics, and immutable audit log. | `src/components/shared.tsx`, `src/lib/fixtures.ts`. |
| `src/app/intake/[sessionId]/page.tsx` | **UI Screen** | Standalone conversational intake interface with microphone recorder, audio stream slicing, and TTS auto-play. | `src/lib/api.ts`. |
| `src/app/dashboard/page.tsx` | **UI Screen** | Standalone patient live OPD token tracker, progress stepper, past sessions list, and digital prescription viewer. | `src/lib/api.ts`. |
| `src/app/consent/page.tsx` | **UI Screen** | Standalone medical AI consent declaration screen. | `src/lib/api.ts`. |
| `src/app/profile/page.tsx` | **UI Screen** | Standalone patient demographic profile form. | `src/lib/api.ts`. |
| `src/app/documents/page.tsx` | **UI Screen** | Standalone medical records upload screen (PDF/images) with file size validation. | `src/lib/api.ts`. |
| `src/app/login/page.tsx` | **UI Screen** | Standalone patient login screen with email/password form and token storage. | `src/lib/api.ts`. |
| `src/app/register/page.tsx` | **UI Screen** | Standalone account creation screen with auto-login redirect. | `src/lib/api.ts`. |
| `src/components/shared.tsx` | **UI Components** | Shared component library: `MKLogo`, `PriorityBadge`, `StatusChip`, `AITriageContext`, `EvidenceDrawer`, `WhyAllocation`, `CaseTimeline`, `ConfirmDialog`, `ReasonInput`, `ToastContainer`. | Depended on by `/patient`, `/doctor`, `/admin`. |
| `src/lib/fixtures.ts` | **Fixtures / Types** | Deterministic clinical case fixtures (P0, P1, P2, P3) with symptoms, AI assessments, evidence quotes, and emergency timelines. | Depended on by `/patient`, `/doctor`, `/admin`. |
| `src/lib/api.ts` | **API Client** | Typed REST client with bearer token management, error unwrap, and fetch calls to `/api/*`. | Used by Next.js pages. |
| `src/lib/supabase.ts` | **Infrastructure** | Supabase browser client initialized with public URL and anon key. | `src/lib/api.ts`. |
| `src/types/index.ts` | **TypeScript Types** | Shared TypeScript interfaces for Session, Message, PatientCase, PreTriageAssessment, QueueItem, and Consultation. | Frontend types. |
| `src/app/globals.css` | **Styling System** | Global CSS custom properties (color palettes, shadows, spacing, buttons, badges, typography). | Imported by `layout.tsx`. |
| `next.config.js` | **Configuration** | Next.js configuration with security headers and API reverse proxy rewrite to `http://127.0.0.1:8000`. | Next.js runtime. |
| `package.json` | **Dependencies** | Node.js manifest with dependencies (`next`, `react`, `react-dom`, `sass`, `typescript`, `@supabase/supabase-js`). | `npm install`. |
| `.env.local` | **Configuration** | Local environment variables (`NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`). | Next.js runtime. |

---

## 🗄️ Database (`supabase/`)

| File | Category | Purpose & Description |
| :--- | :--- | :--- |
| `supabase/migration.sql` | **Database Schema** | Complete idempotent SQL migration script creating all 10 tables (`patients`, `patient_sessions`, `conversation_messages`, `patient_cases`, `medical_documents`, `audit_logs`, `triage_assessments`, `doctor_queue_items`, `consultation_records`, `emergency_events`), Row-Level Security (RLS) policies, and performance indexes. |

---

## 📚 Documentation Package (`docs/`)

- `docs/README.md`: Master documentation index, core product flow, and absolute system invariants.
- `docs/architecture.md`: High-level system architecture, component boundaries, and runtime layers.
- `docs/repository-map.md`: Complete directory and file manifest.
- `docs/frontend.md`: Next.js App Router, PWA design, component state, audio capture, and screen catalog.
- `docs/backend.md`: FastAPI framework, dependency injection, router design, and resiliency fallbacks.
- `docs/api.md`: Complete OpenAPI/REST API specification across all domains.
- `docs/database.md`: PostgreSQL schema, entity relationships (ERD), RLS security policies, and indexes.
- `docs/ai-pipeline.md`: Groq LLaMA prompt architecture, anti-hallucination guardrails, and question bank traversal.
- `docs/voice-pipeline.md`: Sarvam Saaras STT & Bulbul TTS integration, WebM streaming, and audio validation.
- `docs/queue-engine.md`: P0 auto-escalation, P1/P2/P3 acuity bands, Admin review gate, and Doctor turn queue.
- `docs/business-rules.md`: Strict medical boundaries, non-diagnostic invariants, and code-enforced rules.
- `docs/authentication-security.md`: Supabase Auth, Bearer token handling, kiosk auth, and Row Level Security.
- `docs/testing.md`: Test suites, clinical workflow verification, anti-hallucination test suite, and execution guide.
- `docs/development-setup.md`: Step-by-step local developer setup guide.
- `docs/deployment.md`: Production build configuration, environment variables, and hosting topology.
- `docs/data-flows.md`: 13 end-to-end data flow sequence diagrams across Patient, Admin, AI, and Doctor actors.
- `docs/state-machines.md`: Lifecycle state machine diagrams (Session, Case, Triage Assessment, Queue Turn, Consultation).
- `docs/technical-debt.md`: Architectural debt audit, missing production pieces, and prioritized technical roadmap.
- `docs/ai-intake/QUESTION_BANK.json`: Structured clinical questionnaire covering 9 intake categories.
