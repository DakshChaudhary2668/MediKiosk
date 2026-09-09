# Technical Assessment & Technical Debt Audit

This document provides a technical debt audit of the MediKiosk codebase, categorizing architectural gaps, operational bottlenecks, security risks, and suggested engineering remedies.

---

## 🚦 Technical Debt Severity Matrix

| Issue ID | Severity | Category | Component | Description & Current State | Recommended Remediation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TD-01** | **High** | Persistence | `app/routers/triage.py`<br/>`app/routers/queue.py` | **In-Memory Triage & Queue State:** While `patients`, `patient_sessions`, `conversation_messages`, and `patient_cases` are stored in PostgreSQL, the active `_TRIAGE_ASSESSMENTS` and `_DOCTOR_QUEUE` are currently held in Python in-memory dictionaries. Server restarts wipe active queues. | Create dedicated `triage_assessments`, `doctor_queue_items`, and `consultation_records` tables in Supabase with database sequences for atomic token generation. |
| **TD-02** | **High** | Concurrency | `app/routers/triage.py` | **Global Token Counter:** `_TOKEN_COUNTER` is an in-memory integer. Multiple Uvicorn workers will produce duplicate token numbers. | Replace `_TOKEN_COUNTER` with a PostgreSQL sequence (`CREATE SEQUENCE opd_token_seq START 100;`). |
| **TD-03** | **Medium** | Security / RBAC | `app/routers/auth.py` | **Implicit Role Verification:** Roles (Admin vs. Doctor vs. Patient) are inferred from token strings or frontend route access rather than cryptographic JWT claims. | Introduce Supabase Custom Claims (`app_metadata.role: 'admin' \| 'doctor' \| 'patient'`) and enforce via FastAPI dependencies (`Depends(require_role('doctor'))`). |
| **TD-04** | **Medium** | Performance | `frontend/src/app/dashboard/page.tsx`<br/>`src/app/admin/page.tsx`<br/>`src/app/doctor/page.tsx` | **Short-Interval HTTP Polling:** Client portals poll the backend every 5–8 seconds via `setInterval()`. | Implement Supabase Realtime WebSocket subscriptions (`supabase.channel('doctor_queue')`) or FastAPI WebSockets for push-based updates. |
| **TD-05** | **Medium** | Security | `frontend/src/lib/api.ts` | **JWT in LocalStorage:** Bearer tokens are persisted in browser `localStorage`, which is vulnerable to Cross-Site Scripting (XSS). | Transition token storage to `HttpOnly`, `SameSite=Strict` secure session cookies. |
| **TD-06** | **Low** | Observability | `backend/app/services/*` | **Console Logging:** Logging uses standard Python `logging.getLogger` and `print()` in test files. | Integrate OpenTelemetry / structured JSON logging (e.g. `structlog`) with Sentry exception tracking for production monitoring. |
| **TD-07** | **Low** | Audio Storage | `app/routers/intake.py` | **Discarded Raw Voice Audio:** Audio bytes processed via `/api/intake/voice` are passed directly to Sarvam STT and discarded without archiving. | Add an optional configuration toggle to archive voice recordings to Supabase Storage (`medical-documents/audio/`) for clinical audio quality auditing. |

---

## 🛠️ Prioritized Technical Roadmap

### Phase 1: Database Normalization (Immediate Priority)
- Execute a Supabase migration to move `_TRIAGE_ASSESSMENTS`, `_DOCTOR_QUEUE`, and `_CONSULTATION_RECORDS` from memory into PostgreSQL tables.
- Add PostgreSQL sequences for token generation to ensure multi-worker scalability.

### Phase 2: Role-Based Access Control (RBAC) Hardening
- Add Supabase user metadata roles during registration.
- Add `@require_role(["doctor", "admin"])` decorators across protected clinical endpoints.

### Phase 3: Real-Time Event Streaming
- Migrate frontend polling loops (`setInterval`) to Supabase Realtime Channels (`postgres_changes` on `doctor_queue_items`), delivering sub-second turn notifications when doctors call tokens.
