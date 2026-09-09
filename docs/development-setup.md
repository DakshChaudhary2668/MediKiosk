# Local Development Setup Guide

Follow this step-by-step guide to configure, run, test, and seed MediKiosk on your local development machine.

---

## 💻 1. Prerequisites

- **Python:** 3.10 or higher
- **Node.js:** 18.x or 20.x LTS
- **Package Managers:** `pip` and `npm`
- **Operating System:** Windows, macOS, or Linux
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
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🐍 3. Backend Setup & Startup

1. **Navigate to the backend directory:**
   ```powershell
   cd backend
   ```
2. **Create and activate a virtual environment:**
   ```powershell
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # macOS / Linux:
   source venv/bin/activate
   ```
3. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```
4. **Start the FastAPI backend server:**
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```
5. **Verify health endpoint:**
   Open `http://localhost:8000/health` in your browser. Expected response:
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
   Open `http://localhost:3000` in your web browser.

---

## 🌱 5. Seeding Demo Data for Clinical Testing

To populate the Super Admin Triage Gate with 10 diverse, realistic patient intakes across P0, P1, P2, and P3 acuity levels:

### Option A: From Web Interface
1. Navigate to `http://localhost:3000/admin`.
2. Click the **`⚡ Seed Test Intakes`** button in the top navigation bar.

### Option B: Via Terminal Script
```powershell
cd backend
.\venv\Scripts\python.exe seed_demo_assessments.py
```

---

## 🧪 6. Running Automated Tests

Run the complete test verification suite:
```powershell
cd backend

# Run Voice, Anti-Hallucination, and Safety Tests:
.\venv\Scripts\python.exe test_voice_and_safety.py

# Run Pre-Triage, Admin Gate, Doctor Queue, and Digital Rx Tests:
.\venv\Scripts\python.exe test_triage_and_queue.py
```
