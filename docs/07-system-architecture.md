# System Architecture

## Architecture source

The editable architecture diagram is [`architecture/medi-kiosk-mvp.mmd`](architecture/medi-kiosk-mvp.mmd).

## Runtime boundary

| Boundary | Responsibility | Authority |
| --- | --- | --- |
| Next.js PWA | Patient, doctor, and Super Admin workflows; accessible rendering; request initiation | No authoritative clinical, queue, or role decision. |
| FastAPI backend | Authentication/authorization, validation, persistence, orchestration, safety gates, queue state, audit events | System of record and integration boundary. |
| AI adapter | Normalize backend input, call Harry's AI Engine, validate/normalize response, attach correlation metadata | No queue mutation. |
| Harry's AI Engine | Survey/audio interpretation and pre-triage recommendation | Advisory output only. |
| Supabase | Planned database, storage, and possibly auth services | Accessed through controlled server/client patterns; exact configuration `TBD`. |

## Logical data flow

1. A patient submits intake through the PWA.
2. FastAPI validates and persists the intake before AI processing.
3. FastAPI sends a bounded, versioned request to the AI adapter.
4. The adapter calls the AI Engine and validates its response.
5. FastAPI persists the assessment and evaluates uncertainty/safety gates.
6. A Super Admin reviews and decides whether the intake can enter the queue.
7. FastAPI creates or updates the approved queue entry.
8. The doctor dashboard reads the queue and permitted patient context from FastAPI.
9. Doctor actions and consultation records return through FastAPI and are audited.
10. The patient dashboard reads only its authorized status and records.

## Boundary rules

- The browser does not contain privileged Supabase keys or AI provider secrets.
- The browser does not call the AI Engine directly.
- The AI Engine does not call queue or database mutation APIs.
- Queue priority is derived from the approved backend decision, not from client state.
- Sensitive artifacts are not cached for offline use by default.
- Integration names in this package are logical; exact services, deployment topology, and table/route names are `TBD`.

## Failure containment

An AI or storage failure should preserve the intake and surface a reviewable state. A partial result must not look like an approved queue entry. A client refresh or retry must not duplicate an intake or queue entry; idempotency strategy is an open contract decision.
