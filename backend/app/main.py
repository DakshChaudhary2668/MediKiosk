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
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard /api routes (as consumed by frontend and docs/api.md)
app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(intake.router)
app.include_router(triage.router)
app.include_router(queue.router)

# Canonical /api/v1 route aliases (as specified in 08-integration-contracts.md)
for r in (auth.router, patient.router, intake.router, triage.router, queue.router):
    v1_router = FastAPI()
    # Or include router routes with /api/v1 prefix replacing /api
    for route in r.routes:
        # Clone or re-register each route under /api/v1/<suffix>
        sub_path = route.path.replace("/api", "/api/v1", 1)
        app.add_api_route(
            sub_path,
            route.endpoint,
            methods=route.methods,
            response_model=getattr(route, "response_model", None),
            name=f"v1_{route.name}",
            include_in_schema=False,
        )


@app.get("/health")
def health():
    return {"status": "ok", "service": "medikiosk-api"}
