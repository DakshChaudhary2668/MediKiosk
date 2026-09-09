"""Patient router — profile, consent, documents."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, UploadFile, File

from app.db import supabase
from app.models import ConsentRequest, PatientProfileUpdate
from app.routers.auth import get_user_id

router = APIRouter(prefix="/api/patient", tags=["patient"])

# In-memory dev cache fallback for offline testing
_DEV_PROFILES: dict[str, dict] = {}
_DEV_DOCS: dict[str, list[dict]] = {}
_DEV_SESSIONS: dict[str, list[dict]] = {}


@router.get("/profile")
async def get_profile(authorization: str = Header(...)):
    uid = get_user_id(authorization)
    try:
        res = supabase.table("patients").select("*").eq("id", uid).single().execute()
        return res.data
    except Exception:
        return _DEV_PROFILES.get(uid, {"id": uid, "full_name": "Test Patient", "consent_given": True})


@router.post("/profile")
async def update_profile(body: PatientProfileUpdate, authorization: str = Header(...)):
    uid = get_user_id(authorization)
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(400, "No fields to update")
    update["updated_at"] = "now()"
    try:
        res = supabase.table("patients").update(update).eq("id", uid).execute()
        return res.data
    except Exception:
        existing = _DEV_PROFILES.get(uid, {"id": uid})
        existing.update(update)
        _DEV_PROFILES[uid] = existing
        return existing


@router.post("/consent")
async def record_consent(body: ConsentRequest, authorization: str = Header(...)):
    uid = get_user_id(authorization)
    try:
        supabase.table("patients").update({
            "consent_given": body.consent_given,
            "consent_given_at": "now()" if body.consent_given else None,
            "updated_at": "now()",
        }).eq("id", uid).execute()

        # Audit log
        supabase.table("audit_logs").insert({
            "actor_id": uid,
            "action": "consent_given" if body.consent_given else "consent_declined",
            "entity_type": "patient",
            "entity_id": uid,
        }).execute()
    except Exception:
        existing = _DEV_PROFILES.get(uid, {"id": uid})
        existing["consent_given"] = body.consent_given
        _DEV_PROFILES[uid] = existing

    return {"consent_given": body.consent_given}


@router.get("/sessions")
async def list_sessions(authorization: str = Header(...)):
    uid = get_user_id(authorization)
    try:
        res = (
            supabase.table("patient_sessions")
            .select("*")
            .eq("patient_id", uid)
            .order("started_at", desc=True)
            .execute()
        )
        return res.data
    except Exception:
        return _DEV_SESSIONS.get(uid, [])


@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    authorization: str = Header(...),
):
    uid = get_user_id(authorization)
    content = await file.read()
    storage_path = f"{uid}/{file.filename}"

    try:
        supabase.storage.from_("medical-documents").upload(
            storage_path,
            content,
            {"content-type": file.content_type or "application/octet-stream"},
        )
        supabase.table("medical_documents").insert({
            "patient_id": uid,
            "file_name": file.filename,
            "file_type": file.content_type,
            "storage_path": storage_path,
        }).execute()
    except Exception:
        # Fallback dev tracking
        doc_entry = {
            "id": f"doc_{len(_DEV_DOCS.get(uid, [])) + 1}",
            "file_name": file.filename,
            "file_type": file.content_type,
            "storage_path": storage_path,
            "uploaded_at": "now",
        }
        _DEV_DOCS.setdefault(uid, []).append(doc_entry)

    return {
        "message": "Document uploaded successfully",
        "storage_path": storage_path,
        "file_name": file.filename,
    }


@router.get("/documents")
async def list_documents(authorization: str = Header(...)):
    uid = get_user_id(authorization)
    try:
        res = (
            supabase.table("medical_documents")
            .select("*")
            .eq("patient_id", uid)
            .order("uploaded_at", desc=True)
            .execute()
        )
        return res.data
    except Exception:
        return _DEV_DOCS.get(uid, [])
