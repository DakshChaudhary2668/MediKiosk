"""MediKiosk FastAPI backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, consultation, intake, queue, review

app = FastAPI(title="MediKiosk API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ponytail: tighten to env var for prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(intake.router, prefix="/api/intake", tags=["intake"])
app.include_router(review.router, prefix="/api/review", tags=["review"])
app.include_router(queue.router, prefix="/api/queue", tags=["queue"])
app.include_router(consultation.router, prefix="/api/consultation", tags=["consultation"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
