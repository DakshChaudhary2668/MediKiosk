# Technical Assessment & Technical Debt Audit

This document provides a technical debt audit of the MediKiosk codebase, categorizing architectural gaps, operational bottlenecks, security considerations, and prioritized engineering remedies.

---

## 🚦 Technical Debt Severity Matrix

| Issue ID | Severity | Category | Component | Description & Current State | Recommended Remediation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TD-01** | **Medium** | Scalability | `app/persistence.py` | **Database Token Sequences:** Token numbers are incremented via `get_next_token_number()` from store counts or Supabase maximums. In a multi-worker cluster without Redis or database locks, high concurrent arrivals could experience a race condition on token assignment. | Bind token generation directly to a PostgreSQL sequence (`CREATE SEQUENCE opd_token_seq START 100;`). |
| **TD-02** | **Medium** | Performance | `frontend/src/app/*` | **Short-Interval HTTP Polling:** Patient queue tracking and admin intake lists poll the backend every 5–8 seconds via `setInterval()`. | Implement Supabase Realtime WebSocket subscriptions (`supabase.channel('doctor_queue')`) or FastAPI WebSockets for push notifications. |
| **TD-03** | **Medium** | Security | `frontend/src/lib/api.ts` | **JWT in LocalStorage:** Bearer tokens are persisted in browser `localStorage`, standard for MVP PWAs but susceptible to XSS token extraction if client scripts are compromised. | Transition token storage to `HttpOnly`, `SameSite=Strict` secure session cookies in production. |
| **TD-04** | **Low** | Storage / Audit | `app/routers/intake.py` | **Discarded Raw Voice Audio:** Audio bytes processed via `/api/intake/voice` are passed directly to Sarvam STT in memory and discarded without archiving to cloud storage. | Add an optional archival toggle to write voice audio blobs to Supabase Storage (`medical-documents/audio/`) for clinical audio quality auditing. |
| **TD-05** | **Low** | Security | `app/routers/patient.py` | **File Upload Antivirus Scanning:** Uploaded patient documents (PDFs, images) are validated for file size (10MB) and MIME type, but not scanned for malware. | Add an asynchronous antivirus scanning hook (e.g. ClamAV or AWS GuardDuty) on uploaded medical documents. |
| **TD-06** | **Low** | Observability | `backend/app/services/*` | **Structured APM Tracing:** Diagnostic traces use standard Python `logging.getLogger`. | Integrate OpenTelemetry or Sentry APM for distributed transaction tracing across LLM inference, STT latency, and database operations. |

---

## 🛠️ Prioritized Technical Roadmap

### Phase 1: High-Concurrency Token Locking (Production Scale)
- Bind token generation to PostgreSQL sequence (`CREATE SEQUENCE opd_token_seq START 100;`) to guarantee multi-worker serializability under high hospital OPD loads.

### Phase 2: Real-Time Event Push Subscriptions
- Replace client-side interval polling (`GET /api/patient/queue-status` and `GET /api/doctor/queue`) with Supabase Realtime or Server-Sent Events (SSE), delivering instant alerts when doctors call patient tokens.

### Phase 3: Cookie-Based Secure Session Management
- Transition authentication tokens from client-side `localStorage` to `HttpOnly`, `Secure`, `SameSite=Strict` HTTP cookies.

### Phase 4: Audio Quality Archival & Medical Compliance
- Implement optional raw audio archival for telemetry and clinical speech recognition accuracy verification in Indian regional dialects.
