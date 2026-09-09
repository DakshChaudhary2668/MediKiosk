# ELITE_UIUX_FRONTEND_DESIGN_SPEC.md
### MediKiosk — Forensic UI/UX Audit + Authoritative Design & Implementation Blueprint

---

## ⚠️ Scope Note — Read Before Anything Else

This spec was produced from **two sources only**:

1. **31 UPDATED UI/UX screenshots** (`UIUX_SS_.zip`) covering the Patient, Doctor, and Super Admin surfaces at `localhost:3001`. These were treated as the visual source of truth, per instructions.
2. **The task brief itself** (product contract, priority model, design objectives).

The following were **referenced as required reading but were never provided** and could not be inspected:

- `BACKEND_AUDIT.md`
- `FRONTEND_TECHNICAL_AUDIT.md`
- `UIUX_AUDIT.md`
- `ELITE_FRONTEND_IMPLEMENTATION_PLAN.md`
- `REVIEWED_ELITE_FRONTEND_IMPLEMENTATION_PLAN.md`
- The actual repository/codebase (no repo link, zip, or file tree was attached)

Everything that depends on those five documents or on the codebase — the **route-by-route API-connection matrix**, the **file-by-file implementation plan with real paths**, and precise **backend-dependency calls** — cannot be produced as verified fact from screenshots alone. Doing so would mean inventing file paths and API behavior, which the brief explicitly forbids ("Do not silently invent requirements").

Instead, those sections below are written as **exact templates + a worked example** using the real screens observed, so a senior engineer can fill them in against the real repo in under an hour. Every other section (audit, design system, screen specs, priority model, AI transparency, component architecture) is complete and actionable now.

**To get a fully populated Section 23–25, provide:** the repo (or `git ls-files` output), and the five audit `.md` files. I flagged this as the primary blocker in the Definition of Done (Section 29/30).

Design references applied throughout: anti-generic-AI-UI checklist (no emoji-as-icon, no purple/pink AI gradients, no unearned motion, resilient text/chip wrapping, 4.5:1 contrast, visible focus states, `prefers-reduced-motion` support) and a healthcare-appropriate "soft structuralism" visual language, consistent with the brief's own directive to avoid Tailwind-template/Dribbble-concept aesthetics.

---

## 1. Executive Verdict

The current build is **functionally coherent and further along than a typical hackathon MVP** — the P0 emergency lane, the "Why this allocation?" panel, and the AI Triage Context component already express most of the *intended* product contract in wireframe form. That is the good news, and it means this is a **refinement and hardening job, not a rebuild.**

The bad news: in the process of getting the flows working, the build has **committed exactly the safety violation the product contract exists to prevent** — a diagnostic-looking label ("Possible STEMI") sitting inside the P0 handover screen — plus several data-integrity bugs that will visibly contradict the demo narrative in front of judges, plus a visual language that is currently generic admin-dashboard blue-on-white rather than "clinically credible and elite."

**Verdict in one line:** the interaction architecture is largely right; the content/data layer has a **clinical-safety blocker**, and the surface layer needs a real design system pass.

- **DESIGN READINESS: READY WITH CHANGES**
- **IMPLEMENTATION READINESS: BLOCKED** (on the P0 diagnostic-language blocker + data-integrity bugs — both are same-day fixes, see Section 30)

---

## 2. Current UI/UX Audit (Forensic, Screenshot-Sourced)

Findings are keyed to the screen they were observed on. Severity: **BLOCKER / HIGH / MEDIUM / LOW.**

### 2.1 Product / Clinical Safety Findings

| # | Screen | Current Behavior | Why It's Weak | Impact | Severity | Exact Correction | Frontend-only or Backend? |
|---|---|---|---|---|---|---|---|
| S-01 | Doctor P0 Emergency Handover | "Identified Critical Signals" list includes **"Possible STEMI"** and **"Immediate intervention required"** as bolded red bullets alongside symptom bullets | This is a differential-diagnosis statement ("STEMI" = ST-elevation myocardial infarction). The brief explicitly names this exact phrase as forbidden ("Possible STEMI... Never expose... disease likelihood"). It visually implies the AI diagnosed a heart attack | Clinical liability; directly contradicts the product's own non-diagnostic promise; a judge or clinician reviewer will flag this instantly | **BLOCKER** | Replace with **Risk Flags** using indicator language: e.g. "Cardiac risk pattern — chest pain + radiating arm pain + diaphoresis" styled as a risk flag chip, not a bolded red diagnosis line. Remove "Possible STEMI" text entirely. Keep "Immediate intervention required" only as an **urgency flag**, not adjacent to a named condition | Frontend-only (copy + component change); confirm the same string isn't hardcoded or model-returned on the backend |
| S-02 | Landing / Role Selection | Doctor Suite card subtitle reads "EHR-integrated consultation workspace **with AI diagnostic cues** & evidence audit drawer" | "AI diagnostic cues" contradicts "AI IS NOT A DIAGNOSIS TOOL" from the product contract, on the very first screen a judge sees | Sets the wrong expectation before the user even enters the product | **BLOCKER** | Change to "AI triage context & evidence audit drawer" — remove the word "diagnostic" everywhere in marketing/landing copy | Frontend-only |
| S-03 | Admin → Case Review → Evidence & Source Records → AI Triage Context tab | Tab shows **"P2 Priority Band · 88% Confidence"** while the panel immediately to its left (same case, same moment) shows **"P1 · 89% confidence"** | Same case, two different priority values and two different confidence values on screen at once | Destroys trust in the AI Triage Context component; will look broken live in front of judges | **BLOCKER** (demo-reliability) | Bind both displays to the same single source of truth for `suggested_priority` and `confidence`; add a snapshot/consistency test | Backend required (data contract) + frontend (single shared state/selector, not two components independently formatted) |
| S-04 | Admin → Evidence & Source Records → Patient Intake tab | Patient Voice Transcript reads *"Mujhe 2 din se khansi ho rahi hai aur halka bukhar hai. Badan mein dard bhi hai"* (cough, mild fever, body ache) but the **AI Triage Context panel for the same case** lists "Severe headache, Nausea, Photophobia, Neck stiffness" | The evidence transcript does not support the reported indicators shown elsewhere for the same case (MK-2051 / Priya Sharma) | If a doctor opens the evidence drawer expecting it to substantiate the AI's flags, it visibly doesn't — undermines the entire "AI Transparency" objective | **HIGH** | Fixture data must be case-consistent: one canonical patient dataset per demo case ID, referenced everywhere (queue, dossier, evidence drawer, admin review) | Backend/fixture-data (single mock data source, not several hand-authored screens) |
| S-05 | Patient OTP screen | Visible on-screen copy: *"Demo: 123456 = success · 000000 = expired · any other = incorrect"* | Internal test instructions exposed directly in patient-facing production UI | Reads as unfinished/hackathon-prototype the instant a judge tries the flow; also a real information-disclosure smell if ever shown to an actual patient | **HIGH** (demo-reliability) | Remove from production render. If needed for judge convenience, gate behind a `NODE_ENV !== 'production'` banner styled as a distinct "Demo Mode" ribbon, not inline body copy | Frontend-only |
| S-06 | Doctor Queue ("Active Clinical Queue") | P1, P2, P3 cases render as rows in **one shared table** with only a colored left border and a badge to differentiate them | Brief requires P1 to "must NOT look like an ordinary queue" and each priority tier to have a **distinct visual and interaction pattern**, not shared table styling | Doctors scanning fast could visually treat a P1 the same as a P3; defeats the purpose of tiered urgency | **HIGH** | P1 rows get a distinct raised/bordered treatment (see Section 8) separated above the standard queue table, not merged into it | Frontend-only |
| S-07 | Doctor Queue | Table columns literally labelled "AI Intake Summary" showing free-text like "Severe headache, nausea, photophobia" directly under a "Priority" column showing "P1 High Priority" | Adjacency of AI free-text summary and priority badge, with no confidence/limits shown at the queue-list level, nudges doctors toward pattern-matching the AI's words as fact before opening the case | The brief's "AI supports → human decision" hierarchy should be visible even at a glance, not only inside the dossier | **MEDIUM** | Rename column to "Reported Symptoms (patient-stated)" and keep AI's *suggested priority* separate from raw reported text | Frontend-only |

### 2.2 Data / Fixture Integrity Findings

| # | Screen | Issue | Severity |
|---|---|---|---|
| S-08 | Patient → Lab Reports tab | "Chest X-Ray" row shows **two "View" buttons** (one pale/disabled-looking, one solid blue) side-by-side, doing the same thing — CBC row has only one | **MEDIUM** — component duplication bug, looks unfinished |
| S-09 | Doctor Queue (bottom-right corner) | A small dark rectangular overlay/thumbnail is pinned bottom-right of the queue and P0 timeline screens, resembling a stray dev tool, minimized-preview widget, or leftover debugging overlay | **MEDIUM** — needs confirmation from engineering on origin; must not ship in the demo build regardless of cause |
| S-10 | Follow-up tab | Identical "Follow-up & Reminders" screen appears twice in sequence (22.29.10 and 22.29.31) with no state change between them | **LOW** — likely a duplicate capture, but worth confirming there isn't a duplicated route/component causing a double-render |
| S-11 | Admin → Overview / all Admin screens | The red "1 Active P0 Emergency" banner is present on **every** Admin screen including Staff & Roles, Analytics, AI Monitoring, Audit Log — good for persistent awareness, but there is no way shown to dismiss/collapse it once acknowledged, and it never changes state (still says "Acknowledgement pending" after the case shows "Admin acknowledged" in the timeline underneath it) | **MEDIUM** — banner state must derive from the same event stream as the timeline below it |

### 2.3 Visual / Design-System Findings

| # | Screen | Issue | Severity |
|---|---|---|---|
| S-12 | Patient dashboard (all tabs) | Unicode emoji used as icons: 🩹 (Prescriptions), 📅 (Follow-up), 🗒️ (Past Records) | **HIGH** — brief explicitly bans Unicode/emoji icons in production UI; also breaks visual consistency with the SVG icon set used elsewhere (doctor sidebar uses proper line icons) |
| S-13 | Every screen | Visual language is generic "SaaS admin blue" — indigo/blue primary on white cards, default system sans, uniform 8px-radius cards, no typographic hierarchy beyond bold/size. No distinct "premium clinical" identity yet (no distinctive type pairing, no considered color-per-role system, flat drop shadows) | **HIGH** — brief's explicit objective is "not a generic Tailwind template... not a Dribbble concept." Current state is closer to a default admin template than an elite clinical product |
| S-14 | P0 screens (Doctor + Admin) | Uses the same red (`#dc4c4c`-ish) for the emergency banner, the "Escalate P0" button, AND the "Acknowledge" button — no visual distinction between "danger/alert" red and "primary action within an alert" red | **MEDIUM** — reduces at-a-glance clarity in the highest-stakes screen in the product |
| S-15 | Landing page | Three role cards (Patient Kiosk / Doctor Suite / Super Admin) are visually near-identical in weight — same card style, same icon treatment, same CTA style — despite serving three completely different audiences with completely different density needs described later in the same screen's own copy | **MEDIUM** — an opportunity to signal the differentiated experience (kiosk-calm vs clinical-dense vs ops-dense) is lost at the very first screen |
| S-16 | Priority badges throughout | P0/P1/P2/P3 are color-coded only (red/orange/purple/green chip) with a text label already present — good — but the color palette is not yet colorblind-safe verified (orange/red proximity for P0 vs P1 under protanopia needs a contrast/hue-distance check) | **MEDIUM** — brief requires priority must never rely on color alone; text label already satisfies the letter of that rule, but hue selection still needs verification |

### 2.4 Positive Findings (Preserve These)

To be fair to the existing build — several structures are **already aligned with the target spec** and should be preserved, not rewritten:

- The **P0 Emergency Management** screen (Admin) already correctly shows: response timer, SLA target, team assignment with per-person status, patient instruction, and a timeline — this is close to spec as-is (Section 2.1 S-01's fix is content, not structure).
- **"Why this allocation?"** (Admin Case Review) already has the right three-column composition: facts → AI context → admin actions, with Accept / Modify / Reassign as distinct primary/secondary/tertiary actions. Preserve this layout.
- **AI Triage Context** already carries the required disclaimer ("This is triage support, not a diagnosis. Please use clinical judgment.") in every instance except the P0 screen (S-01) — extend the same discipline there.
- **Evidence & Source Records** as a slide-in drawer with tabs (Patient Intake / Past Records / Uploaded Files / AI Triage Context) is the right pattern and the right name; keep the drawer mechanism, fix the data (S-04).
- The **consent screen** (patient step 2) already plainly states the five safety guarantees in patient-readable language — this is a strong pattern, reuse its tone elsewhere (e.g., waiting-room screens).
- **Audit Log** already models actor + action + case ID + timestamp with an expandable row and CSV export — structurally correct for the "Do-Not-Break Invariant" of auditability.

---

## 3. Current Frontend Reality

**This section cannot be completed from screenshots alone** — it requires the actual route table, component tree, and network calls, none of which were supplied.

What screenshots *can* confirm: the app is a single Next/React-style SPA-per-role served from `localhost:3001` with three entry surfaces — `/patient`, `/doctor`, `/admin` — sharing one visual system and (based on identical data appearing in both the Doctor dossier and the Admin case review for MK-2051) at least some shared data layer or shared mock fixture.

### Route-by-route matrix — **template to fill against the real repo**

| Route | Current UI | Data Source | API Connected? | Fixture? | Reusable Components | Problems | Required Redesign |
|---|---|---|---|---|---|---|---|
| `/` | Role selection | ? | ? | ? | RoleCard | Copy says "AI diagnostic cues" (S-02) | Copy fix + card differentiation (S-15) |
| `/patient` | 6-step intake → dashboard | ? | ? | ? | StepIndicator, VoiceInput, TabbedDashboard | Emoji icons (S-12), duplicate View button (S-08) | Icon system swap, dedupe component |
| `/doctor` | Queue → dossier → P0 handover | ? | ? | ? | QueueTable, AITriageContext, EmergencyBanner | Diagnostic language (S-01), flat P1 styling (S-06) | Content fix (BLOCKER) + P1 visual tier |
| `/admin` | Overview → P0 mgmt → Review Queue → Case Review → Staff → Analytics → AI Monitoring → Audit Log | ? | ? | ? | KPI cards, EvidenceDrawer, WhyAllocation, StaffTable | Data mismatch (S-03), stale banner state (S-11) | Single source of truth for triage data |

**To populate the `?` cells**, run (and paste the output back for a follow-up pass):
```
git ls-files 'src/**/*.tsx' 'src/**/*.ts' 'app/**/*.tsx'
grep -rn "fetch(\|axios\.\|useQuery(\|useSWR(" src/ app/
grep -rln "mock\|fixture\|MOCK_\|sample" src/ app/
```
This distinguishes **live product flow** from **showcase/mock flow** per the brief's requirement, and surfaces duplicated routes/components, hardcoded content, and dead controls — none of which are safely inferable from screenshots.

---

## 4. Product / Architecture Alignment

Cross-checking the screenshots against the Product Contract in the brief:

| Contract Rule | Screenshot Evidence | Aligned? |
|---|---|---|
| AI is not a diagnosis tool | "Possible STEMI" shown as a critical signal (S-01); "AI diagnostic cues" copy (S-02) | ❌ **Violated** — must fix before demo |
| Doctor owns diagnosis/prescription/orders | Prescription screen shows doctor-authored drug list with sign-off timestamp; dossier separates "AI Triage Context" from doctor's own consultation | ✅ Aligned |
| Admin owns coordination, not clinical decisions, and never approves P0 | Admin screens show "P0 is automatic — does not require admin approval before dispatch. Admin role: coordination, acknowledgement, and resolution tracking" printed directly on-screen | ✅ Aligned, and stated in-product — good pattern, keep it |
| P0 = no queue, no token, auto-dispatch | P0 screens show no token, no queue position, an SLA response timer instead | ✅ Aligned |
| P1 must not look like an ordinary queue | Currently P1 is a table row like P2/P3 | ❌ Not yet aligned (S-06) |
| Consultation mode = in-person/kiosk only | No video/telehealth UI present anywhere in the 31 screens | ✅ Aligned |
| AI Transparency: AI supports → human decides | Disclaimer text present in every AI Triage Context instance bar one | ✅ Mostly aligned (fix S-01) |

---

## 5. Patient UX Specification

Patient screens observed: Welcome/Language → Consent → New/Existing → OTP → Text/Voice Intake → Processing → Priority Outcome (P2 shown) → Dashboard (Visit Summary / Prescription / Lab Orders / Follow-up / Past Records / Profile).

**Design intent for this role:** guided, warm, low cognitive load, kiosk-friendly, one decision per screen, large touch targets (kiosk is likely a touchscreen — current button heights ~44–48px are acceptable but should move to 56px minimum on the kiosk breakpoint specifically, see Section 17).

Key corrections carried into the screen specs (Section 21):
- Replace emoji stat-card icons with the SVG icon set (S-12).
- Remove exposed demo/test copy from the OTP screen (S-05).
- Resolve duplicate "View" button on Lab Reports (S-08).
- The waiting-room/queue-position screen (P2 outcome, "MK-3048") is strong — extend its instructional pattern ("Proceed to Waiting Area C... watch monitors... alert nurse if symptoms change") to P1 and P3 outcome screens too, since only P2 was shown.
- P0, P1, and P3 patient-facing outcome screens were **not present in the screenshots** — these must be designed net-new. Full specs given in Section 21.

---

## 6. Doctor UX Specification

Doctor screens observed: Login state (top bar only, no login screen itself was captured) → Active Clinical Queue → Patient Intake Dossier (AI Triage Context + Case Ingestion Timeline) → P0 Emergency Handover + Emergency Incident Timeline.

**Design intent for this role:** dense, clinical, fast-scanning, evidence-oriented, minimal decoration. The dossier screen (22.30.19) is the best-executed screen in the whole set — three-column layout (patient facts / AI context / timeline) reads fast and correctly subordinates AI output beneath a "this is support, not a diagnosis" line.

Corrections:
- Remove "Possible STEMI" (S-01, BLOCKER).
- Differentiate P1 rows visually in the queue (S-06).
- Consultation screen, vitals/examination entry, doctor's own diagnosis/prescription-authoring screen, orders, and sign-off were **not captured** in screenshots (only the *result* — the published Visit Summary/Prescription seen from the patient side — was shown). These are specified fresh in Section 21 based on the data model implied by the patient-side output (drug name, dose, frequency, duration, instructions; ICD-style code shown as "J06.9").

---

## 7. Super Admin UX Specification

Admin screens observed: Overview (Operations Command Center) → P0 Emergency Management → Review Queue Case Review ("Why this allocation?") → Evidence & Source Records drawer (4 tabs) → Staff & Roles → Analytics (Hospital Load) → AI Monitoring → Audit Log.

**Design intent for this role:** operational, high information density, exception-oriented. This is the most complete role in the current build — 8 of ~13 admin screens listed in the brief were captured and are structurally sound.

Corrections:
- Fix the P1/confidence data mismatch (S-03, BLOCKER for demo).
- Persistent P0 banner must reflect live acknowledgement state (S-11).
- "Configuration" and "System Status" nav items exist in the sidebar but their screens were not captured — need full specs (Section 21) or confirmation they're out of scope for the hackathon demo path.

---

## 8. P0 / P1 / P2 / P3 Interaction Model

This is the single most important system in the product and gets a dedicated, opinionated spec.

### P0 — Critical / Immediate Escalation
**Current state:** correctly implemented as an exception system (separate nav item, red banner, no queue, no token, automatic dispatch, response timer, team roster, timeline). **Only fix needed is content** (S-01): swap "Possible STEMI" for a risk-flag phrasing.

**Canonical component: `EmergencyHandoverPanel`**
- Full-bleed red-tinted alert card, not a bordered white card like everything else — it must be unmistakably a different *kind* of surface, not just a colored badge on a normal card.
- Contents, top to bottom: status strip (bold state + response timer, right-aligned) → patient identity + location → **Risk Flags** (renamed from "Identified Critical Signals," indicator-based language only) → primary actions (Acknowledge / Coordinate / Escalate Delay / Document Handover) → team roster with live per-person status chip → event timeline.
- Timer color logic: green while inside SLA, amber at 80% of SLA elapsed, red + pulsing dot past SLA (respect `prefers-reduced-motion`: swap pulse for a static high-contrast outline).

### P1 — High Priority / Urgent Handoff
**Current state:** visually identical to P2/P3 rows in a shared table (S-06) — the single biggest structural gap versus the brief.

**Correction:** P1 cases render in a **separate "Urgent Handoff" strip above the standard queue table**, not as a table row:
- Card-style (not row-style), amber-orange left accent bar at 6px (not the current 3px shared with P2/P3), a persistent "Urgent — assign now" microcopy instead of a queue position, and a visible "time since intake" counter instead of "time ahead in queue."
- Never show "X patients ahead" language for P1 — that is P2/P3 vocabulary and undersells the urgency (brief explicitly calls this out).
- Interaction: clicking anywhere on the card opens the same dossier as P2/P3, but the dossier header for a P1 case gets the amber urgent-strip treatment carried through, so context isn't lost on navigation.

### P2 — Moderate / Standard Queue
**Current state:** correctly implemented (department, doctor, queue band, live position, ETA, waiting-area instructions). No structural changes; carry the emoji-icon fix (S-12) and apply the same instructional-card pattern to P1/P3 outcome screens.

### P3 — Routine / Fast Track
**Current state:** not captured in screenshots on the patient side (queue table shows P3 rows on the doctor/admin side only). Per the brief, "Fast Track is the MVP behavior" and must **not** become a self-care-only screen.

**Spec (net-new):** patient-facing P3 outcome screen mirrors the P2 layout exactly (same component, `QueueOutcomeCard`, parameterized by priority) but with: location for the fast-track lane, a shorter ETA band, a "next action" line (e.g., "A nurse will do a quick check before you're seen"), and the same safety-net line pattern used on the Follow-up screen ("Return earlier if symptoms worsen").

### Cross-cutting rule for all four tiers
Every priority state must expose, at minimum: **status, next action, expected wait/ETA, relevant location, escalation behavior.** Today P0 and P2 satisfy this fully; P1 fails on "next action" (falls back to generic queue copy) and P3 has no patient-facing instance to check at all. Section 21 gives exact copy/layout for both gaps.

---

## 9. AI Triage UX Rules

**Canonical component: `AITriageContext`** (already exists and is well-built — reuse, don't rebuild).

Required fields, in display order:
1. **Suggested priority** (badge, P0–P3 vocabulary only — never a disease name)
2. **Confidence** (percentage badge, single source of truth shared with every other place confidence is shown for that case — fixes S-03)
3. **Reported indicators** (bulleted, patient-stated symptoms, verbatim-adjacent language, e.g. "Severe headache")
4. **Relevant history** (bulleted, e.g. "Migraine history")
5. **Risk flags** (bulleted, **indicator-pattern language only** — "Meningism signs — rule out meningitis" is an acceptable pattern already used correctly on the *non-P0* dossier screen; "Possible STEMI" on the P0 screen is not, because it names a specific disease rather than a sign pattern — the meningitis example correctly says "rule out X" as an instruction to the clinician, not an assertion; standardize every risk flag to this "sign pattern — rule out / consider Y" phrasing, never a bare disease name)
6. **Model/rule provenance** (e.g., "pretriage-v1 · Safety Matrix Guardrail Active") + timestamp — already present in the Evidence drawer's AI Triage Context tab; promote this provenance line into the *primary* AI Triage Context card too, not just the drawer, so it's visible without an extra click.
7. **Disclaimer line**, verbatim or near-verbatim: *"This is triage support, not a diagnosis. Please use clinical judgment."* — present everywhere except the P0 screen; add it there too, styled to fit the red alert surface (white text, still legible at the required contrast ratio).

**Never expose** (already correctly avoided everywhere except S-01): diagnosis probability, differential diagnosis, disease-likelihood phrasing ("Likely X", "Possible Y disease").

**Visual hierarchy rule:** the AI Triage Context card uses a distinct lavender/purple-tinted surface (already true in the current build) to separate it at a glance from clinician-authored content, which stays on plain white cards. Keep this convention — it is doing real work and should be documented as a hard rule, not left as an accident of the current palette.

---

## 10. Evidence & Provenance System

**Canonical component: `EvidenceDrawer`** — already built as a 4-tab slide-in panel (Patient Intake / Past Records / Uploaded Files / AI Triage Context). Structure is correct; reuse identically for Doctor and Admin (brief requires the same conceptual component for both — currently only confirmed present in Admin screenshots; confirm/port to Doctor's "Evidence Audit" button, which was seen but not opened in the captured screens).

Per-tab content rules:
- **Patient Intake tab:** voice transcript (quoted, marked "Patient-confirmed transcript · Source verified") + structured signal list, each signal tagged **Reported** / **Confirmed** (with duration, e.g. "Cough — 2 days") / **Not reported** (amber tag) — this three-state tagging is already well-designed; keep it, but fix the data mismatch (S-04) so the transcript and the signal list describe the same case.
- **Past Records tab:** chronological prior-visit cards (date, diagnosis-as-recorded-by-doctor, doctor name) — correct as built.
- **Uploaded Files tab:** document list with type/date metadata and a View action — correct as built.
- **AI Triage Context tab:** duplicate of the primary card's content for in-drawer reference — must pull from the same state as Section 9's primary card (fixes S-03).

Access/privacy treatment: patient identity is explicitly *not* sent to the AI engine per the consent screen copy — carry a small "De-identified before AI processing" provenance note into the AI Triage Context tab so this promise is visible at the point of use, not only during consent.

---

## 11. Allocation Reasoning UX

**Canonical component: `WhyThisAllocation`** — already built and strong. Three-column layout: Patient Details | Why this allocation? (priority, department, doctor availability, queue load, ETA, location) + Allocation Recommendation | Admin Actions (Accept / Modify / Reassign) + Event Timeline.

Confirm/extend:
- "Modify/Override" and "Reassign" must open a **reason-required modal** before committing (brief: "Any override/reassignment must require: Reason → Confirmation → Notification → Audit Event"). Not captured in screenshots whether this modal exists — flag as a required build item if it doesn't, since the Audit Log screen does show a "Priority override P2 → P1" entry attributed to "Admin (SA)," confirming the *event* is logged even if the *modal UI* wasn't captured.
- "Accept Allocation" should transition the case's Admin-facing status chip from "Pending Review" to "Approved" inline, matching the pattern already used in the Doctor queue table (Rohan Mehta's case shows "Approved" there) — keep this status vocabulary identical across Doctor and Admin views.

---

## 12. Design System

### Design direction
**Soft Structuralism + Clinical Precision**, per the brief. In practice: a cooler, more restrained palette than the current default-indigo; more deliberate whitespace on the Patient side; tighter, denser grids on Doctor/Admin; one consistent 4px-based spacing scale everywhere; borders and hairlines doing more of the separation work than shadows.

**Anti-patterns to avoid (explicitly, from the brief + general anti-slop guidance):** default purple-blue "AI product" gradients, floating card grids with no grid discipline, Unicode emoji as icons, decorative motion, low-contrast gray-on-gray text, generic rounded-everything without a stated radius scale.

### 1. Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `color.brand.primary` | `#2547D0` | Primary actions, links, brand mark (deepened from current `#3B5BDB`-ish blue for better contrast + a less "generic SaaS" hue) |
| `color.brand.primary.hover` | `#1D3AA8` | Hover/active state |
| `color.ink.900` | `#0B1B33` | Headings |
| `color.ink.700` | `#33415C` | Body text |
| `color.ink.500` | `#5B6B85` | Secondary/meta text |
| `color.ink.300` | `#9AA6BB` | Disabled text, placeholders |
| `color.surface.base` | `#F5F7FB` | App background |
| `color.surface.card` | `#FFFFFF` | Card surfaces |
| `color.surface.ai` | `#F1EEFC` | AI Triage Context surface (lavender, preserved from current build) |
| `color.border.subtle` | `#E2E6EF` | Card borders, dividers |
| `color.border.strong` | `#C7CEDD` | Input borders, focus-adjacent |

### 2. Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `color.success` | `#1B8A5A` | Approved, confirmed, normal lab result |
| `color.success.bg` | `#E6F6EE` | Success chip background |
| `color.warning` | `#B5720C` | Pending, medium confidence, SLA-at-risk |
| `color.warning.bg` | `#FCEFD8` | Warning chip background |
| `color.danger` | `#C4293A` | Errors, rejected, P0 alerts |
| `color.danger.bg` | `#FBE7E9` | Danger surface tint |
| `color.info` | `#2563C7` | Neutral informational chips |

### 3. Priority Colors (color + shape + text — never color alone)

| Priority | Hex | Chip shape signal | Icon |
|---|---|---|---|
| P0 Critical | `#C4293A` (solid fill, white text) | Full-bleed alert surface, not a chip at all | Filled triangle-alert |
| P1 Urgent | `#B5560C` (amber-orange, distinct hue from P0's red) | Card with 6px left accent bar | Outline pulse/activity icon |
| P2 Moderate | `#5B3FBF` (purple, distinct from brand blue to avoid confusion with links) | Row with 3px accent bar | Outline clock icon |
| P3 Routine | `#1B8A5A` (green) | Row with 3px accent bar | Outline fast-forward/checkmark icon |

*Colorblind check:* P0 red (`#C4293A`) vs P1 amber (`#B5560C`) are separated by both hue (≈15° apart is too close on pure hue alone) — mitigated by the **shape difference** (P0 = full alert surface, P1 = accent-bar card) so no two priorities rely on hue alone at any zoom/contrast setting.

### 4–8. Typography

- **Family:** A geometric-humanist sans for UI (e.g., **Inter** or **IBM Plex Sans** — both free, both read as "engineered clinical" rather than "generic SaaS" like default system-ui) for all UI text; a slightly warmer sans (e.g., **Source Sans 3**) reserved for Patient-facing conversational copy only, to create the "warm vs. clinical" role distinction the brief asks for without introducing a serif (a serif would skew editorial/luxury, wrong register for healthcare ops).
- **Scale (px / line-height):** `12/16` caption · `14/20` body-sm · `16/24` body · `18/26` body-lg · `22/28` h4 · `28/34` h3 · `36/42` h2 · `48/54` h1.
- **Weights:** 400 body, 500 emphasis/labels, 600 headings/buttons, 700 reserved for critical numerics only (queue token, response timer) — do not use 700 for routine headings, so the critical numerics still stand out.
- **Letter spacing:** `0` body; `+0.02em` on all-caps labels/eyebrows (e.g., "AUTONOMOUS INTAKE" tag on the landing page) to keep tracking legible at small size.

### 9. Spacing Scale
4px base unit: `4, 8, 12, 16, 24, 32, 48, 64`. Card internal padding: `24` desktop / `16` mobile. Section gaps: `32`. Never use arbitrary values outside this scale.

### 10–11. Border Radius & Treatment
`radius.sm = 6px` (chips, inputs) · `radius.md = 10px` (cards) · `radius.lg = 16px` (modals, drawers) · `radius.pill = 999px` (status badges only). Borders: `1px solid color.border.subtle` on all cards **instead of** relying on shadow alone — this is the core move that shifts the look from "floating card SaaS template" toward "structured clinical document," per the brief's stated direction.

### 12. Shadows
Two shadow levels only, both soft: `shadow.sm` (resting cards) `0 1px 2px rgba(15,23,42,0.04), 0 1px 1px rgba(15,23,42,0.03)`; `shadow.md` (drawers/modals/popovers) `0 8px 24px rgba(15,23,42,0.12)`. No shadow on P0 alert surfaces — they use a 2px solid danger border instead, so they read as structurally different, not just "a card with more shadow."

### 13. Surface Hierarchy
Base app background (`surface.base`) → standard card (`surface.card` + subtle border) → AI content (`surface.ai` tint, no border, to feel like an inset panel not a competing card) → alert/P0 (full danger-tinted surface, own tier entirely).

### 14. Iconography
Single SVG icon set throughout (Lucide or Phosphor, outline style, 20px default / 16px compact / 24px nav-rail). Stroke width `1.75px`. Zero emoji in production UI (fixes S-12). Icons are always paired with a text label except in the compact nav rail, where `aria-label` substitutes. Priority icons per Section "Priority Colors" table above. P0 uses a filled (not outline) triangle-alert to read as categorically different at a glance.

### 15. Button System
- **Primary:** solid `color.brand.primary`, white text, `radius.sm`, 44px height desktop / 56px kiosk.
- **Secondary:** white fill, `1.5px` brand-colored border, brand-colored text.
- **Danger (P0 actions only):** solid `color.danger`.
- **Danger-secondary (Escalate/Override):** white fill, danger border, danger text — distinguishes "an action taken inside an alert" from "the alert itself," fixing S-14.
- **Disabled:** `color.ink.300` text/border/fill at 100% opacity (not just faded — faded low-contrast disabled buttons fail accessibility scanning tools even though disabled controls are exempt from contrast requirements; keep them legible anyway).
- All buttons: `cursor: pointer`, visible 2px focus ring in `color.brand.primary` offset 2px, min touch target 44×44px (56×56px on kiosk).

### 16. Form Controls
Inputs: 44px height, `1px solid color.border.strong`, `radius.sm`, focus = 2px brand ring + border color shift to `color.brand.primary`. Error state: danger border + inline message below field (icon + text, never color-only). OTP input: already well-built as a single masked field with digit spacing — keep.

### 17. Status Badges vs. 18. Priority Badges
Status badges (Pending / Approved / Rejected / Suspended etc.): pill shape, tinted background + matching text color from the semantic table, dot indicator to the left. Priority badges: per Section "Priority Colors" — never share visual weight with status badges so the two systems aren't confused (a case has exactly one priority and one status at a time; these must be visually distinguishable at a glance, e.g. priority badge = square-cornered `radius.sm` chip, status badge = pill).

### 19. Alerts
Three tiers: inline field alert (form-level) · banner alert (page-level, e.g. "Pending reports" yellow banner on Lab Reports — already well-built, keep) · full-surface alert (P0 only). Never nest an alert inside another alert.

### 20. Tables
Header row: `12px` uppercase, `color.ink.500`, `+0.02em` tracking, bottom border `1px color.border.subtle`. Row height 56px desktop / auto+16px padding mobile. Zebra striping **not** used (relies on borders/hairlines per the structuralist direction). Row hover: `surface.base` tint. Priority accent bar (left edge, 3–6px depending on tier) is the primary scan aid, not row color.

### 21. Drawers
Right-side slide-in, `480px` desktop width, full-width bottom-sheet on mobile/tablet (see Section 17). Header sticky with title + close (`×`, 44×44 target). Tab bar sticky beneath header. Already well-built as the Evidence drawer — extend this exact pattern to any future drawer (e.g., Staff detail panel, currently an empty-state panel per S-30 screenshot — see Section 21 Empty States).

### 22. Dialogs
Center-modal, `radius.lg`, `shadow.md`, max-width 480px (confirmation) or 640px (forms, e.g. Override reason). Required for: Accept/Modify/Reassign confirmations, Override reason capture, Suspend/Reject staff actions, Start New Visit confirmation if unsaved data exists.

### 23. Timelines
Vertical dot-and-line pattern, already well-built (Case Ingestion Timeline, P0 Event Timeline). Dot states: filled `color.success` (complete), filled `color.warning` (in progress/active), outline `color.ink.300` (pending/future). Keep this exact system, apply consistently to every timeline instance including ones not yet built (patient-facing status tracking, if added later).

### 24. KPI Cards
Label (12px, `ink.500`) → large numeral (28–36px, `ink.900`, weight 700) → optional icon top-right in a tinted 32px square. Already well-built on Admin Overview and Analytics; standardize the icon-square tint to match the metric's semantic color (e.g., "Active PO" numeral uses danger tint square, not the current neutral gray square, so severity is legible even from the icon alone).

### 25. Navigation
Left rail, fixed, 240px expanded / 72px icon-only collapsed (add a collapse toggle — not present in current screenshots, needed for the Doctor/Admin density goal on smaller viewports). Active item: tinted background pill + brand-colored icon+text, not just a bold weight change (current build's active state is legible but low-contrast against inactive items — increase the tint).

### 26. Empty States
Icon (48px, `ink.300`) + heading + one-line supporting text, centered. Already correctly implemented on Staff & Roles' detail panel ("Select a staff member — click a row to view details") — reuse this exact block for any list-detail pattern (Review Queue detail-before-selection, Consultations list, etc.).

### 27. Loading States
Skeleton blocks (not spinners) for card/table content that takes >300ms. Full-page processing (e.g., "Processing Clinical Intake") keeps its current pattern — progress bar + reassurance copy — this is correct and should be the template for any future long-running action (e.g., AI re-triage).

### 28. Error States
Inline for forms (Section 16). Page-level: icon + heading + plain-language explanation + retry action + (for clinical screens) a "Continue without AI assistance" or "Contact staff" fallback so a technical failure never blocks a patient or blocks a doctor from proceeding manually — this is a **Do-Not-Break invariant** (Section 30).

### 29. Offline States
Kiosk and Admin need an offline banner (persistent, top of viewport, `warning` tint): "Connection lost — your progress is saved locally" for Patient kiosk; "Reconnecting — queue data may be stale" for Doctor/Admin, with a manual refresh action once reconnected. Not present in any captured screenshot — net-new requirement, high priority for a live hospital-mesh-dependent product per the "Hospital Mesh Connected" status pill already shown on the landing page (it needs a disconnected counterpart state).

### 30. Focus / Keyboard States
2px solid `color.brand.primary` ring, 2px offset, on every interactive element including table row actions and drawer tabs — none of this is verifiable as present/absent from static screenshots, so treat as a required audit item against the live app, not a confirmed gap.

---

## 13–15. Typography, Color System, Iconography

Fully specified above in Section 12 (Design System), items 1–8 (typography), 1–3 (color), 14 (iconography) — consolidated there rather than repeated, per the brief's own numbered table matching the Design System section's internal numbering.

---

## 16. Components

Component inventory implied by the screenshots (names are proposed canonical names for implementation):

**Foundation:** `Button`, `Input`, `Select`, `Checkbox`, `Badge` (status), `PriorityChip`, `Icon`, `Avatar`, `Divider`.

**Design System / Shared:** `Card`, `KPI Card`, `Drawer`, `Dialog/Modal`, `Timeline`, `TimelineItem`, `Tabs`, `Table`, `EmptyState`, `Skeleton`, `Toast/InlineAlert`, `Banner`, `StepIndicator`.

**Patient Components:** `LanguagePicker`, `ConsentPanel`, `OTPInput`, `VoiceInputRecorder`, `IntakeQuestionCard`, `QueueOutcomeCard` (parameterized by P0–P3, replaces the current one-off P2-only screen), `PatientDashboardTabs`, `VisitSummaryCard`, `PrescriptionList`, `LabReportRow`, `FollowUpCard`, `SafetyNetBanner`.

**Doctor Components:** `ActiveQueueTable`, `UrgentHandoffCard` (new — implements the P1 fix from Section 8), `PatientDossierHeader`, `AITriageContext` (shared logic with Admin, different container styling allowed), `CaseIngestionTimeline`, `EmergencyHandoverPanel` (shared logic with Admin's P0 Management, role-scoped actions).

**Admin Components:** `OperationsOverview`, `P0ManagementPanel`, `WhyThisAllocation`, `EvidenceDrawer` (shared with Doctor), `StaffRoleTable`, `HospitalLoadBar`, `AIMonitoringPanel`, `AuditLogTable`.

**Screen Composition:** each route composes Foundation → Shared → Role-specific components; no screen should hand-roll a card/table/badge outside this hierarchy (this is the fix for S-08's duplicate-button bug — a single `LabReportRow` component used consistently would not have rendered two View buttons on one row and one on another).

### Preserve / Refactor / Create / Delete

| Component | Action | Why |
|---|---|---|
| `AITriageContext` | **Preserve** structure, **refactor** data binding | Content model is right; needs single-source-of-truth binding (fixes S-03) |
| `EvidenceDrawer` | **Preserve** | Well-built, extend to Doctor role |
| `WhyThisAllocation` | **Preserve** | Well-built |
| `EmergencyHandoverPanel` | **Refactor** copy | Structure right, content has the BLOCKER (S-01) |
| Patient stat-card icons | **Refactor** | Swap emoji for SVG icon set (S-12) |
| `LabReportRow` | **Refactor** | Fix duplicate action button (S-08) |
| Doctor queue table (P1 rows) | **Refactor into new `UrgentHandoffCard`** | S-06 |
| Role-selection landing cards | **Refactor** copy + differentiate density | S-02, S-15 |
| Unknown bottom-right overlay widget | **Delete** (pending engineering confirmation of origin) | S-09 |
| Duplicated Follow-up screen capture | **Investigate**, delete if a duplicated route/component | S-10 |

---

## 17. Responsive System

Breakpoints: `kiosk` (1920×1080 and 1080p touch, Patient only) · `desktop` (≥1280px, Doctor/Admin primary) · `tablet` (768–1279px) · `mobile` (≤767px, Patient follow-up/results access only — Doctor/Admin are not designed mobile-first given clinical density needs, but must remain usable in a pinch).

| Behavior | Kiosk | Desktop | Tablet | Mobile |
|---|---|---|---|---|
| Patient flow container | Centered card, max-width 640px, 56px touch targets | N/A (kiosk-only in practice) | Centered card, max-width 480px | Full-width, 16px gutters |
| Doctor/Admin sidebar | N/A | Fixed 240px rail | Collapses to 72px icon rail, labels on hover/tap | Becomes a bottom tab bar (5 items max) or hamburger drawer |
| Tables (Queue, Staff, Audit Log) | N/A | Full table | Full table, horizontal scroll if needed with sticky first column | **Transforms to stacked list-cards** — one card per row, label:value pairs, priority accent bar retained as a left border on the card |
| Drawers (Evidence) | N/A | 480px right slide-in | 480px right slide-in | **Full-screen bottom sheet**, drag handle, tabs become a horizontal scroll |
| KPI card grid | N/A | 6-up row | 3-up grid | 2-up grid |
| Typography scale | Base +2px across the board for arm's-length kiosk viewing | Base scale | Base scale | Base scale, headings step down one tier (h1→h2 visually) to avoid excessive wrapping |
| Sticky actions | Primary CTA always visible, no scroll-to-find | Standard | Standard | Primary CTA sticky to bottom of viewport (e.g., "Confirm & Next," "Accept Allocation") |
| Touch targets | 56×56px minimum | 44×44px minimum | 44×44px minimum | 44×44px minimum |

---

## 18. Accessibility (WCAG 2.1 AA)

- **Contrast:** all body text ≥4.5:1 against its surface; the current light-gray meta text (e.g., "34y · F," timestamps) must be checked against `color.ink.500` (`#5B6B85` on white ≈ 4.6:1 — compliant; do not go lighter).
- **Keyboard navigation:** full tab order through queue tables, drawer tabs, and dialog actions; `Escape` closes drawers/dialogs; focus returns to the triggering element on close.
- **Screen reader semantics:** priority badges get `aria-label="Priority: P1 High Priority"` (not just visual text, since these are often rendered as styled `<span>`s); status changes in P0 timelines get `aria-live="polite"` regions so screen-reader users receive automatic updates without re-navigating.
- **Error associations:** every form error uses `aria-describedby` linking the input to its error message.
- **Touch targets:** 44×44px minimum everywhere, 56×56px on kiosk (Section 17).
- **Reduced motion:** any pulse/blink (P0 timer, live status dots) gets a `prefers-reduced-motion` static fallback (solid state + text label already present, so this is a CSS-only addition, not a redesign).
- **Color-independent priority identification:** already satisfied by text labels on every priority chip observed; formalize as a hard rule (Section 12, Priority Colors) so it survives future redesigns.

---

## 19. Motion

Motion is used only for: state change (queue item moves from Pending → Approved), processing (intake progress bar — already correct), emergency escalation (P0 banner entrance — a single deliberate slide/fade-in, ≤240ms, not a bounce), queue update (new case arrives — subtle highlight-fade on the new row, ≤400ms), confirmation (button success micro-state, ≤150ms), navigation (drawer slide-in/out, 200–240ms ease-out).

**Avoid:** page-transition animations between routes, decorative background motion, any animation on the AI Triage Context card that could read as the AI "doing something" beyond a single content-load fade — the brief specifically warns against "distracting AI animations," and a lavender-tinted panel with a shimmer/pulse would read exactly like the generic-AI-product pattern the brief wants to avoid.

All durations respect `prefers-reduced-motion: reduce` by dropping to instant state changes with no easing curve.

---

## 20. Error / Loading / Offline States

Covered in full in Section 12 items 27–29. Summary table for the states explicitly required by the brief for **voice/text intake**, since that's the one component the brief calls out by name:

| State | Treatment |
|---|---|
| Idle | Mic button at rest, "Tap to speak" label |
| Listening | Mic button pulses (respect reduced-motion → static ring instead), waveform or level indicator |
| Transcribing | Mic button → spinner/skeleton in the text field, "Transcribing..." label |
| Confirm/Edit | Transcript populates the text field, editable, "Voice answers are shown here for your review before submission" helper text (already correctly present) |
| Processing | Reuses the full-page processing pattern (Section 12.27) if submission triggers AI pre-triage |
| No Speech | Inline message under mic button: "We didn't catch that — try again or type your answer" + text field remains available |
| Unclear Speech | Same pattern as No Speech, but pre-fills the text field with a best-effort partial transcript flagged "Low confidence — please review" |
| Permission Denied | Replace mic button with a neutral notice: "Microphone access is off — you can still type your answer" + text field auto-focused |
| Network Error | Banner: "Connection issue — your answer will be saved when reconnected" (or immediate local-only fallback to text entry) |
| Text Fallback | Always available simultaneously, never gated behind a failed voice attempt first — text field is present on-screen at all times already (correct as built) |

---

## 21. Screen-by-Screen Specifications

Full specs for the highest-priority screens — the ones that are demo-critical (Section 27) and/or have BLOCKER/HIGH findings. Remaining screens follow the same template, populated from the patterns established here plus Section 12's design system.

### Screen: P0 Emergency Handover (Doctor)

- **Purpose:** Give the attending physician everything needed to act within seconds on a critical case.
- **Primary User:** Attending Doctor.
- **Entry:** Automatic navigation/notification when a P0 is dispatched to this physician; also reachable via the "P0 Emergency" nav item.
- **Exit:** "Acknowledge Handover" → consultation begins; case later resolves via "Document Handover."
- **Primary Goal:** Acknowledge and begin treatment within the SLA window.
- **Information Hierarchy:** Status/timer → identity/location → risk flags → actions → team/timeline.
- **Layout:** Full-bleed danger-tinted alert panel (not a bordered card) at top; two-column timeline + supporting info below, per current build.
- **Components:** `EmergencyHandoverPanel`, `RiskFlagList` (renamed from Identified Critical Signals), `Timeline`.
- **Primary CTA:** "Acknowledge Handover."
- **Secondary CTA:** "View Full Clinical Dossier."
- **States:** default (pending) / acknowledged / SLA-at-risk (amber timer) / SLA-breached (red timer + escalation note) / resolved (timeline complete, panel demotes to a resolved-summary card).
- **Interaction Details:** Acknowledge is a single click, no confirmation dialog (speed matters for P0); Escalate Delay requires a one-line reason (matches the override pattern in Section 11).
- **Responsive:** Full-width panel at every breakpoint; on mobile, actions stack full-width and stay sticky to the bottom of the viewport.
- **Accessibility:** Panel entrance announced via `aria-live="assertive"` (this is the one place assertive, not polite, is correct — it's genuinely urgent); timer has a text equivalent, not just color.
- **Data Source / API Dependency:** Real-time push (websocket/poll) from emergency-dispatch service; **backend required** for live SLA timer sync.
- **Reusable Components:** shared `EmergencyHandoverPanel` core with Admin's P0 Management screen (role-scoped action set).
- **Visual Treatment:** danger-tinted full surface, 2px solid danger border, no drop shadow (Section 12.12).
- **Animation:** single entrance fade/slide ≤240ms; timer updates without animation (just numeral change) to avoid distraction.
- **Error Handling:** if the dispatch feed disconnects, panel shows a persistent "Reconnecting — last known status as of [time]" notice rather than silently going stale.
- **Acceptance Criteria:** no disease-name text anywhere on this screen; timer and team roster reflect live state; screen is reachable and actionable within 2 clicks of any Doctor route.

### Screen: Admin Case Review — "Why This Allocation?"

- **Purpose:** Let an admin understand and act on an AI-suggested allocation with full context.
- **Primary User:** Super Admin / Ops coordinator.
- **Entry:** From Review Queue or Overview's "Recent Clinical Triage Ingestion" table.
- **Exit:** Accept / Modify / Reassign / Request Clarification → returns to Review Queue with updated status.
- **Primary Goal:** Confident, auditable allocation decision in under a minute.
- **Information Hierarchy:** Patient facts → allocation reasoning → AI context → actions → timeline (already correctly ordered).
- **Layout:** 3-column desktop (as built); collapses to a single stacked column on tablet/mobile with Admin Actions pinned as a sticky footer.
- **Components:** `WhyThisAllocation`, `AITriageContext`, `Timeline`, `ReasonRequiredDialog` (for Modify/Reassign — needs confirmation/build, see Section 11).
- **Primary CTA:** "Accept Allocation."
- **Secondary CTA:** "Modify / Override," "Request Clarification."
- **States:** pending review / accepted / modified (shows before/after) / clarification requested.
- **Interaction Details:** Accept updates status instantly with an inline success state (no full page reload); Modify opens `ReasonRequiredDialog`.
- **Responsive:** 3-col → 1-col stack at tablet; Admin Actions card becomes a sticky bottom bar on mobile.
- **Accessibility:** priority badge has full `aria-label`; every action button has a distinct accessible name (not just icon+color).
- **Data Source / API Dependency:** case data + AI triage output must be a **single fetch/subscription**, not independently fetched by the main panel and the drawer's AI Triage Context tab (fixes S-03 — **backend/data-contract required**).
- **Reusable Components:** `AITriageContext` shared with Doctor dossier.
- **Visual Treatment:** standard card surfaces + AI-tinted panel per Section 12.13.
- **Animation:** status chip transition on Accept (color fade, ≤150ms).
- **Error Handling:** if Accept fails, inline error banner at the top of Admin Actions card, action remains retryable, no silent failure.
- **Acceptance Criteria:** priority/confidence values identical everywhere they appear for this case; every override produces one audit-log entry.

### Screen: Patient Priority Outcome (generalized for P0/P1/P2/P3)

- **Purpose:** Tell the patient, in plain language, what happens next.
- **Primary User:** Patient (kiosk).
- **Entry:** End of intake flow, after AI pre-triage completes.
- **Exit:** "Patient Dashboard" or automatic redirect toward the waiting area.
- **Primary Goal:** Patient knows where to go and what to expect, with zero ambiguity, within one screen.
- **Information Hierarchy:** Priority badge + headline → token/queue or fast-track/emergency status → key facts (department, clinician if known, wait/ETA) → instructions → safety-net line.
- **Layout:** Single centered card, as built for P2; parameterize by priority (Section 8).
- **Components:** `QueueOutcomeCard` (priority-parameterized).
- **Primary CTA:** varies — P2/P3: "Patient Dashboard." P0/P1: no dashboard CTA; instead "Stay here — staff will assist you," since these patients should not be encouraged to navigate away.
- **Secondary CTA:** "Start New Visit" (P2/P3 only; suppressed for P0/P1).
- **States:** default; for P0 specifically, this screen should auto-transition to a distinct "Emergency — staff notified" full-surface state matching the visual severity of the Doctor/Admin P0 surfaces, not the calm blue P2-style card currently used for the one outcome we can see.
- **Interaction Details:** for P0/P1, disable/hide navigation away from this screen where feasible (kiosk context) to keep the patient in place until staff arrive.
- **Responsive:** kiosk-first sizing (Section 17), 56px targets.
- **Accessibility:** ETA and instructions available to screen readers in reading order matching visual order; P0/P1 state uses `aria-live="assertive"` for the "staff notified" transition.
- **Data Source / API Dependency:** live queue position (P2/P3) needs polling/push; P0/P1 needs the same real-time dispatch feed as the Doctor/Admin P0 screens.
- **Reusable Components:** shares layout shell with the existing P2 screen; new priority-specific content blocks.
- **Visual Treatment:** P2/P3 = calm card (existing style); P0/P1 = escalated, danger/urgent-tinted full surface, matching Section 8's tiering.
- **Animation:** none beyond a single entrance fade — this is a high-anxiety moment for the patient; avoid any motion that could read as alarming beyond the P0 case's intentionally serious tone.
- **Error Handling:** if live queue data fails to load, fall back to static "Please wait — staff will call you" rather than showing a broken/zero ETA.
- **Acceptance Criteria:** all four priority variants exist and are visually and tonally distinct; P0/P1 never show queue-position language.

*(Remaining 25+ patient/doctor/admin screens follow this exact template. Given the volume, this document provides the template plus the four most demo-critical, highest-risk instances in full; the remaining screens are lower-risk, closer to spec already, and are covered by the audit table in Section 2 plus the component rules in Sections 12 and 16.)*

---

## 22. Component Architecture

```
FOUNDATION        → Button, Input, Select, Checkbox, Badge, Icon, Avatar, Divider, Typography primitives
      ↓
DESIGN SYSTEM      → Card, KPI Card, Drawer, Dialog, Timeline, Tabs, Table, EmptyState, Skeleton, Banner, StepIndicator
      ↓
SHARED COMPONENTS  → AITriageContext, EvidenceDrawer, PriorityChip/Badge, EmergencyHandoverPanel (core), AuditEntry
      ↓
PATIENT COMPONENTS → LanguagePicker, ConsentPanel, OTPInput, VoiceInputRecorder, IntakeQuestionCard,
                     QueueOutcomeCard, PatientDashboardTabs, VisitSummaryCard, PrescriptionList,
                     LabReportRow, FollowUpCard, SafetyNetBanner
      ↓
DOCTOR COMPONENTS  → ActiveQueueTable, UrgentHandoffCard, PatientDossierHeader, CaseIngestionTimeline,
                     ConsultationForm (net-new), PrescriptionAuthor (net-new)
      ↓
ADMIN COMPONENTS   → OperationsOverview, P0ManagementPanel, WhyThisAllocation, StaffRoleTable,
                     HospitalLoadBar, AIMonitoringPanel, AuditLogTable, ReasonRequiredDialog
      ↓
SCREEN COMPOSITION → Routes assemble the above only; no screen defines its own one-off card/table/badge markup
```

Preserve/Refactor/Create/Delete summary is in Section 16.

---

## 23. Route Architecture

**Template only** — real route definitions require the repository. Based on the three URLs observed (`/patient`, `/doctor`, `/admin`), the likely structure is a nested-route app per role. Recommended target structure (adjust to match whatever router the real repo uses):

```
/                          → Role selection
/patient                   → Patient shell
  /patient/intake           → 6-step intake (language → consent → id → otp → questions → processing)
  /patient/outcome/:priority→ QueueOutcomeCard, parameterized
  /patient/dashboard        → tabs: summary, prescription, labs, follow-up, records, profile
/doctor                    → Doctor shell (sidebar: queue, p0, consultations, templates, reports, profile)
  /doctor/queue
  /doctor/case/:caseId
  /doctor/p0
/admin                     → Admin shell (sidebar: overview, p0, review-queue, staff, analytics, ai-monitoring, audit, configuration, system-status)
  /admin/overview
  /admin/p0
  /admin/review/:caseId
  /admin/staff
  /admin/analytics
  /admin/ai-monitoring
  /admin/audit
  /admin/configuration      (not captured — confirm scope)
  /admin/system-status      (not captured — confirm scope)
```

---

## 24. API / Data Integration Mapping

**Cannot be completed from screenshots** — requires the network trace / API contract docs that weren't provided. What's inferable:

- A shared "case" entity (`MK-XXXX` ID) must back the Doctor dossier, Admin review, and Evidence drawer identically — currently it does not (S-03, S-04), which is strong evidence the frontend is calling **multiple independent endpoints or reading multiple independent fixtures** for what should be one case resource.
- **Recommendation regardless of current backend state:** introduce a single `GET /cases/:id` (or equivalent GraphQL/query-key) that returns the full case shape — patient facts, AI triage output, evidence, timeline — and have every screen/component read from that one cached resource, so a fix to the data source fixes every view simultaneously.
- Real-time requirements (backend-required, not optional): P0 dispatch feed, queue position updates, SLA timer sync, AI Monitoring "Recent AI Events" feed.

---

## 25. File-by-File Frontend Plan

**Template** — exact paths require the repository. Structure to follow once paths are known:

| Path | Action | Purpose | Dependencies | Risk | Acceptance Criteria | Priority |
|---|---|---|---|---|---|---|
| `[dossier/P0 component]` | Edit | Remove "Possible STEMI," rename Identified Critical Signals → Risk Flags | none | Low | No disease-name string remains in source | **P0 (mandatory)** |
| `[landing/RoleCard copy]` | Edit | Remove "AI diagnostic cues" | none | Low | Copy review sign-off | **P0 (mandatory)** |
| `[case data layer]` | Refactor | Single source of truth for priority/confidence per case | backend contract | Medium | S-03 reproduction case now shows identical values everywhere | **P0 (mandatory)** |
| `[OTP screen]` | Edit | Remove exposed demo credential copy | none | Low | String removed from production build | **P1 (important)** |
| `[icon imports, patient dashboard]` | Refactor | Swap emoji for SVG icon set | icon library choice | Low | Zero emoji glyphs in rendered DOM | **P1 (important)** |
| `[doctor queue table]` | Create `UrgentHandoffCard`, refactor queue render | P1 visual tier | design tokens | Medium | P1 cases render outside the shared table | **P1 (important)** |
| `[LabReportRow]` | Fix | Remove duplicate View button | none | Low | One action per row | **P1 (important)** |
| `[unknown overlay widget]` | Investigate → Delete | Remove stray dev overlay from production build | none | Low | Confirmed absent in prod build | **P1 (important)** |
| `[design tokens file]` | Create | Central token file per Section 12 | none | Low | All hardcoded hex values replaced with tokens | **P2 (polish)** |
| `[nav rail]` | Refactor | Add collapse toggle, increase active-state contrast | design tokens | Low | Keyboard + screen-reader accessible toggle | **P2 (polish)** |

---

## 26. Backend Dependencies

**Frontend-only** (no backend change needed): S-01, S-02, S-05, S-06, S-08, S-12, S-14, S-15, all of Section 12's visual design system, all of Section 17's responsive rules.

**Backend required:** S-03/S-04 (single case data contract — this is the one true backend-touching fix among the audit findings), P0 real-time dispatch feed and SLA timer sync (Section 21), queue-position live updates (P2/P3 outcome screens), AI Monitoring event feed, override/reassignment audit-event emission (if not already emitted — Audit Log screenshot suggests it already is, confirm).

**Optional / future:** offline-mode local persistence (Section 12.29), Configuration and System Status screens (scope TBD — not captured in screenshots, confirm whether in-scope for the hackathon demo).

Nothing here asks for backend changes merely for theoretical frontend cleanliness — every "Backend required" item above is a real data-contract or real-time requirement, not a preference.

---

## 27. Demo-Critical Path

Recommended judge-facing walkthrough, using only screens already strong or now fixed:

1. **Role Selection** — corrected copy (S-02 fix), differentiated role cards (S-15).
2. **Patient Intake** (abbreviated: language → consent → one voice-input question) — shows the AI-transparency promise early via the consent screen's plain-language guarantees.
3. **Priority Outcome (P2)** — shows the queue token + waiting instructions pattern.
4. **Doctor Queue** — shows P1 now visually distinct (S-06 fix) above the standard table.
5. **Doctor Case Detail (P1 case)** — shows `AITriageContext` with correct risk-flag phrasing.
6. **P0 Emergency Handover (Doctor)** — the single most impressive screen once S-01 is fixed; shows automatic dispatch, SLA timer, team roster.
7. **Super Admin Overview** — shows the P0 banner correctly reflecting live acknowledged state (S-11 fix).
8. **"Why This Allocation?"** — shows Accept/Modify/Reassign and the Evidence drawer, now data-consistent (S-03/S-04 fix).
9. **Patient Post-Consultation** (Visit Summary + Prescription) — closes the loop, shows doctor-authored, doctor-signed content clearly separated from AI content throughout the whole journey.

**Resilience requirement:** every screen on this path needs a defined loading/error fallback (Section 20) so a backend hiccup during the live demo degrades to a calm "reconnecting" state rather than a blank screen or console error — this is as important to judge perception as the visual polish.

---

## 28. P0/P1/P2/P3 Implementation Priorities

- **P0 (mandatory, ship-blocking):** Section 2.1 S-01, S-02, S-03 fixes. Section 8's P1 visual tier. Icon system swap (S-12). These four items are the difference between "looks like a hackathon prototype with a safety bug" and "looks like a credible clinical product."
- **P1 (important):** S-04 through S-11 fixes. Design token system rollout (Section 12) across existing screens. Responsive table→card transformation (Section 17). Net-new patient P0/P1/P3 outcome screens (Section 21).
- **P2 (polish):** Motion refinement (Section 19), nav-rail collapse, KPI icon-tint standardization, remaining screen specs not detailed in Section 21 (Consultation form, Prescription authoring, Configuration, System Status).

---

## 29. Definition of Done

A screen/feature is done when:
1. No diagnostic/disease-name language appears anywhere in AI-sourced content (grep-able string check as a CI gate: block `"Possible "`, `"Likely "`, `"differential"` etc. adjacent to AI-context components).
2. Priority and confidence values for a given case are byte-identical everywhere that case is shown.
3. Zero emoji glyphs in rendered production DOM.
4. Every priority state (P0–P3) has a patient-facing, doctor-facing, and admin-facing instance, each visually distinct per Section 8.
5. Every interactive element meets the touch-target, contrast, and focus-state rules in Section 18.
6. Every screen has defined loading/error/offline states per Section 20.
7. Design tokens (Section 12) are the only source of color/spacing/radius values — zero hardcoded hex/px outside the token file.
8. The demo path (Section 27) survives a simulated backend delay and a simulated API failure without a blank/broken screen.

---

## 30. Do-Not-Break Invariants

- AI never presents disease names, differential diagnoses, or diagnosis probabilities, anywhere, under any framing.
- P0 never requires admin approval before dispatch, and never enters a normal queue.
- Doctor is always the final clinical decision-maker; no UI ever implies otherwise.
- Every override/reassignment produces exactly one audit-log entry with actor, reason, before/after state.
- Voice input always has a visible, always-available text fallback.
- Priority is never communicated by color alone.
- No screen ever goes fully blank on a data/network failure — a calm fallback state is always shown.

---

## Blockers (Exact List)

1. **[BLOCKER]** "Possible STEMI" diagnostic language on the P0 Emergency Handover screen (S-01) — must be removed before any demo or further sign-off.
2. **[BLOCKER]** "AI diagnostic cues" copy on the landing page (S-02) — must be corrected before any demo.
3. **[BLOCKER]** Priority/confidence data mismatch between the AI Triage Context card and its own Evidence-drawer tab for the same case (S-03) — must be fixed or the "Why This Allocation?" demo moment will visibly contradict itself.
4. **[BLOCKER for full spec completion, not for the design itself]** Source repository and the five referenced audit `.md` files were never provided. Sections 3, 23, 24, and 25 are templates rather than verified fact until those are supplied. Everything else in this document is complete and does not depend on them.

**DESIGN READINESS: READY WITH CHANGES**
**IMPLEMENTATION READINESS: BLOCKED** — pending the three content/data blockers above, all of which are same-day fixes with no architectural risk.
