"""MediKiosk API — FastAPI entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, patient, intake, triage, queue

app = FastAPI(
    title="MediKiosk API",
    description="AI-powered patient intake and clinical triage system",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(intake.router)
app.include_router(triage.router)
app.include_router(queue.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "medikiosk-api"}
