# Open Decisions

These items are intentionally unresolved. They should be assigned and closed before the related behavior is treated as production-ready.

| Topic | Decision needed | Suggested owner |
| --- | --- | --- |
| P0-P3 policy | Clinical definitions, examples, and emergency response wording | Clinical/operations owner `TBD` |
| Emergency handling | Escalation channel, SLA, and ordinary-queue behavior for P0 | Clinical/operations owner `TBD` |
| Queue ordering | Arrival versus approval timestamp, tie-breaking, fairness, reassessment, and reassignment | Backend + operations |
| Status vocabulary | Final intake, review, queue, and consultation states | Backend + frontend |
| Review roles | Whether Super Admin is the only reviewer or a separate clinical reviewer exists | Product/operations |
| Doctor assignment | Clinic, specialty, or doctor scoping rules | Product/operations |
| AI contract | Exact field names, types, error envelope, and versioning scheme | Harry + backend owner |
| AI reliability | Timeouts, retries, provider fallback, idempotency, and calibration | Harry + backend owner |
| AI context | Language support, transcript retention, and historical-record allow-list | Harry + privacy owner |
| Auth | Supabase Auth or another identity provider, role membership, and session model | Backend/security |
| Persistence | Physical tables, storage buckets, RLS policies, indexes, and migrations | Backend |
| Privacy/compliance | Jurisdiction, consent, retention/deletion, export, hosting region, and provider data use | Privacy/security owner `TBD` |
| PWA | Supported browsers, offline limits, push notifications, and background sync | Frontend |
| UI copy | Patient-facing queue, safety, uncertainty, and disclaimer wording | Product/clinical |
| Delivery | Repository branch rules, CI, environments, deployment, and release approval | Team |

Until a decision is closed, implementations should choose the least-privileged, human-reviewable behavior and document the assumption in the relevant pull request.
