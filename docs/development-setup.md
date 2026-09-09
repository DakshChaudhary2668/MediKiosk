# Local Development Setup Guide

Follow this step-by-step guide to configure, run, test, and seed MediKiosk on your local development machine.

---

## 💻 1. Prerequisites

- **Python:** 3.10, 3.11, or 3.12
- **Node.js:** 18.x or 20.x LTS
- **Package Managers:** `pip` and `npm`
- **Operating System:** Windows (PowerShell), macOS, or Linux
- **External Accounts / API Keys:**
  - [Groq Console](https://console.groq.com) API Key (for LLaMA AI Engine).
  - [Sarvam AI](https://www.sarvam.ai) API Subscription Key (for Saaras STT & Bulbul TTS).
  - [Supabase](https://supabase.com) Project URL & Service Role Key (Optional for local testing; built-in fallbacks allow offline dev).

---

## ⚙️ 2. Environment Configuration

### Backend `.env` Setup
Create `backend/.env` based on `backend/.env.example`:
```ini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-role-key
GROQ_API_KEY=gsk_your_groq_api_key_here
SARVAM_API_KEY=your_sarvam_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
SARVAM_STT_MODEL=saaras:v3
SARVAM_TTS_MODEL=bulbul:v3
```

### Frontend `.env.local` Setup
Create `frontend/.env.local` based on `frontend/.env.example`:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## 🐍 3. Backend Setup & Startup

1. **Navigate to the backend directory:**
   ```powershell
   cd backend
   ```
2. **Create and activate a virtual environment:**
   ```powershell
   python -m venv .venv
   # Windows PowerShell:
   .\.venv\Scripts\activate
   # macOS / Linux:
   source .venv/bin/activate
   ```
3. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```
4. **Start the FastAPI backend server:**
   ```powershell
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
5. **Verify health endpoint:**
   Open `http://127.0.0.1:8000/health` in your browser or terminal:
   ```powershell
   Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
   ```
   Expected response:
   ```json
   {"status": "ok", "service": "medikiosk-api"}
   ```

---

## 🌐 4. Frontend Setup & Startup

1. **Open a second terminal and navigate to the frontend directory:**
   ```powershell
   cd frontend
   ```
2. **Install dependencies:**
   ```powershell
   npm install
   ```
3. **Start the Next.js development server:**
   ```powershell
   npm run dev
   ```
4. **Access the application:**
   - **Role Gateway:** [http://localhost:3000](http://localhost:3000)
   - **Patient Kiosk:** [http://localhost:3000/patient](http://localhost:3000/patient)
   - **Doctor Suite:** [http://localhost:3000/doctor](http://localhost:3000/doctor)
   - **Super Admin Dashboard:** [http://localhost:3000/admin](http://localhost:3000/admin)

*(Note: If port 3000 is occupied, Next.js will automatically bind to port 3001, which is explicitly allowed by backend CORS).*

---

## 🌱 5. Seeding Demo Data for Clinical Testing

To populate the system with realistic clinical cases across P0, P1, P2, and P3 acuity levels:

### Option A: Via HTTP Call
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/triage/seed-demo" -Method POST
```
Returns:
```json
{
  "status": "seeded",
  "cases": ["demo-sess-001", "demo-sess-002", "demo-sess-003", "demo-sess-004", "demo-sess-005"],
  "p0_active": 2,
  "total_queued": 3
}
```

### Option B: Via Terminal Script
```powershell
cd backend
.\.venv\Scripts\python.exe seed_demo_assessments.py
```

---

## 🧪 6. Running Automated Tests

```powershell
cd backend

# 1. Run RBAC, Contracts & Safety Invariants (11 tests)
.\.venv\Scripts\pytest.exe -v test_rbac_and_contracts.py

# 2. Run Voice, Anti-Hallucination & Safety Tests (7 tests)
.\.venv\Scripts\python.exe test_voice_and_safety.py

# 3. Run End-to-End Triage, Doctor Queue & Digital Rx Tests
.\.venv\Scripts\python.exe test_triage_and_queue.py

# 4. Run Core Backend Unit Tests (4 tests)
.\.venv\Scripts\python.exe test_backend.py
```
