# Security And Privacy Assumptions

MediKiosk handles health-related information. These are engineering assumptions and minimum expectations, not a claim of legal or regulatory compliance.

## Minimum controls

- Authenticate every non-public workflow.
- Authorize by role and resource ownership on the backend.
- Enforce least privilege for patient, doctor, Super Admin, service, and database access.
- Keep provider keys, service-role credentials, and secrets server-side.
- Use encrypted transport and the hosting/database encryption defaults appropriate to the deployment.
- Apply row-level/resource-level access rules where Supabase is used.
- Audit intake access, AI assessment creation, review decisions, queue actions, and record changes.
- Avoid logging raw transcripts, audio, or clinical text unless the logging policy explicitly allows it.
- Redact sensitive values from error messages and telemetry.
- Validate uploads, size limits, content types, and storage access if artifacts are enabled.
- Make data deletion, retention, export, and consent behavior explicit before production.

## AI-specific privacy rules

- Send only the minimum necessary content to the AI provider.
- Document whether provider data is retained or used for training; this is a deployment/provider decision.
- Preserve model/version and request correlation for accountability without leaking the full payload into logs.
- Do not let model-generated text become a trusted authorization or queue instruction.

## Open policy decisions

The project still needs owners for jurisdiction/compliance requirements, consent language, retention/deletion periods, transcript/audio retention, patient record export, breach response, hosting region, and emergency disclaimer copy. See [`OPEN-DECISIONS.md`](OPEN-DECISIONS.md).
