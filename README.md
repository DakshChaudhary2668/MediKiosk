# MediKiosk

Patient intake and clinic queue management system. AI-assisted pre-triage with human oversight.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js PWA + SCSS |
| Backend | FastAPI (Python) |
| Database | Supabase (Postgres + Storage) |
| AI | Separate AI Engine (pre-triage advisory) |

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:3000
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in values
uvicorn app.main:app --reload   # http://localhost:8000
```

## Documentation

All project context lives in [`docs/`](docs/README.md):

- [MVP Workflow](docs/01-mvp-workflow.md)
- [Integration Contracts](docs/08-integration-contracts.md)
- [Architecture](docs/architecture/README.md)
- [Open Decisions](docs/OPEN-DECISIONS.md)

## Core Invariant

The backend is the system of record. AI produces advisory recommendations only. Super Admin reviews before queue admission. Doctors make clinical decisions.
