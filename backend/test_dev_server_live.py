"""Live dev server HTTP integration test.
Tests active Uvicorn (http://localhost:8000) and Next.js (http://localhost:3000) dev servers.
"""

import sys
import json
import urllib.request
import urllib.error

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:3000"

def request_json(url, method="GET", data=None, headers=None):
    hdrs = {"Content-Type": "application/json"}
    if headers:
        hdrs.update(headers)
    encoded = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=encoded, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"detail": body}

def main():
    print("==================================================")
    print("🚀 TESTING LIVE DEV SERVERS (PORT 8000 & 3000)")
    print("==================================================")

    # 1. Health check
    status, body = request_json(f"{BACKEND_URL}/health")
    print(f"[1] Backend Health Check: status={status}, body={body}")
    assert status == 200, f"Backend health failed: {body}"

    # 2. Start Intake Session
    status, session_data = request_json(
        f"{BACKEND_URL}/api/intake/session",
        method="POST",
        data={"category": "respiratory", "language": "en"},
        headers={"Authorization": "Bearer dev_test_token_medikiosk"},
    )
    print(f"[2] Start Session: status={status}, session_id={session_data.get('session_id')}")
    assert status == 200, f"Session create failed: {session_data}"
    session_id = session_data["session_id"]

    # 3. Send patient message
    status, msg_res = request_json(
        f"{BACKEND_URL}/api/intake/message",
        method="POST",
        data={
            "session_id": session_id,
            "message": "I have severe throat pain and fever of 102F for 2 days. Cannot swallow.",
            "input_mode": "text",
        },
        headers={"Authorization": "Bearer dev_test_token_medikiosk"},
    )
    print(f"[3] Patient Message: status={status}")
    print(f"    AI Response: {msg_res.get('ai_message')}")
    assert status == 200, f"Message failed: {msg_res}"

    # 4. Complete Intake Session (Auto-triggers AI Pre-Triage)
    status, comp_res = request_json(
        f"{BACKEND_URL}/api/intake/session/{session_id}/complete",
        method="POST",
        headers={"Authorization": "Bearer dev_test_token_medikiosk"},
    )
    print(f"[4] Complete Session: status={status}, body={comp_res}")
    assert status == 200

    # 5. Super Admin Pending Triage Gate
    status, pending = request_json(
        f"{BACKEND_URL}/api/triage/pending",
        headers={"Authorization": "Bearer dev_test_token_medikiosk"},
    )
    print(f"[5] Admin Pending Triage: status={status}, count={len(pending)}")
    assert status == 200 and len(pending) > 0, "Expected at least 1 pending triage item"
    
    target_item = next((item for item in pending if item.get("session_id") == session_id), pending[0])
    assessment_id = target_item["assessment"]["assessment_id"]
    priority = target_item["assessment"]["priority"]
    print(f"    Target Assessment ID: {assessment_id}, Acuity Band: {priority}")

    # 6. Admin Approves Patient into Doctor Queue
    status, review_res = request_json(
        f"{BACKEND_URL}/api/triage/{assessment_id}/review",
        method="POST",
        data={"action": "approve", "priority": priority},
        headers={"Authorization": "Bearer dev_test_token_medikiosk"},
    )
    print(f"[6] Admin Triage Approval: status={status}, Token #{review_res.get('token_number')}")
    assert status == 200 and review_res.get("status") == "queued"
    token_number = review_res.get("token_number")

    # 7. Doctor Queue Fetch
    status, queue = request_json(
        f"{BACKEND_URL}/api/doctor/queue",
        headers={"Authorization": "Bearer dev_test_token_medikiosk"},
    )
    print(f"[7] Doctor Priority Queue: status={status}, active_patients={len(queue)}")
    assert status == 200 and any(q.get("session_id") == session_id for q in queue)

    # 8. Doctor Calls Patient & Records Consultation
    status, call_res = request_json(
        f"{BACKEND_URL}/api/doctor/turn/{session_id}/call",
        method="POST",
        headers={"Authorization": "Bearer dev_test_token_medikiosk"},
    )
    print(f"[8a] Doctor Calls Patient: status={status}, result={call_res}")
    assert status == 200

    status, consult_res = request_json(
        f"{BACKEND_URL}/api/doctor/turn/{session_id}/consult",
        method="POST",
        data={
            "session_id": session_id,
            "diagnosis": "Acute Severe Tonsillitis",
            "clinical_notes": "Bilateral tonsillar exudate. Vitals stable. Rapid strep positive.",
            "prescriptions": [
                {
                    "medication_name": "Amoxicillin-Clavulanate",
                    "dosage": "625mg",
                    "frequency": "1-0-1 (After Food)",
                    "duration": "5 days",
                    "instructions": "Complete full course",
                },
                {
                    "medication_name": "Paracetamol",
                    "dosage": "650mg",
                    "frequency": "SOS",
                    "duration": "3 days",
                    "instructions": "For fever/pain",
                }
            ],
            "follow_up_days": 5,
            "general_advice": "Warm salt water gargles. Adequate hydration.",
        },
        headers={"Authorization": "Bearer dev_test_token_medikiosk"},
    )
    print(f"[8b] Doctor Consultation Completed: status={status}")
    assert status == 200

    # 9. Patient Status Check (Verifying Digital Rx Release)
    status, patient_status = request_json(
        f"{BACKEND_URL}/api/patient/queue-status",
        headers={"Authorization": "Bearer dev_test_token_medikiosk"},
    )
    print(f"[9] Patient Live Status: status={status}, stage={patient_status.get('status')}")
    assert status == 200 and patient_status.get("status") == "consultation_completed"
    assert patient_status["consultation"]["diagnosis"] == "Acute Severe Tonsillitis"
    print(f"    Prescriptions in Digital Rx: {len(patient_status['consultation']['prescriptions'])} items")

    # 10. Frontend Dev Server Page Check (HTTP 200 on Next.js routes)
    req = urllib.request.Request(f"{FRONTEND_URL}/dashboard")
    with urllib.request.urlopen(req, timeout=5) as resp:
        print(f"[10a] Next.js /dashboard HTTP Status: {resp.status}")
        assert resp.status == 200

    req = urllib.request.Request(f"{FRONTEND_URL}/admin")
    with urllib.request.urlopen(req, timeout=5) as resp:
        print(f"[10b] Next.js /admin HTTP Status: {resp.status}")
        assert resp.status == 200

    req = urllib.request.Request(f"{FRONTEND_URL}/doctor")
    with urllib.request.urlopen(req, timeout=5) as resp:
        print(f"[10c] Next.js /doctor HTTP Status: {resp.status}")
        assert resp.status == 200

    print("==================================================")
    print("🎉 ALL LIVE DEV SERVER TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    main()
