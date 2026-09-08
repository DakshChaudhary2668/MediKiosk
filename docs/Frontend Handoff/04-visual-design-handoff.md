# MediKiosk - Visual Design Handoff

**Audience:** Frontend/UI implementation agent  
**Purpose:** Recreate the visual language of the supplied Patient, Doctor, and Super Admin boards consistently. The role handoff documents define behavior; this document defines presentation.

## Visual Source of Truth

Use the latest supplied Patient, Doctor, and Super Admin boards as visual reference for branding, layout density, component shape, hierarchy, and colour semantics.

When an older storyboard image conflicts with this handoff or a role-flow handoff, follow the Markdown handoff. In particular:

- render four correctly labelled outcomes: P0, P1, P2, P3;
- render `AI Triage Context`, not diagnostic probabilities;
- retain the Doctor Evidence drawer and Admin `Why this allocation?` panel;
- keep P0 as an automatic emergency lane, not an approval queue.

## Design Character

The product should feel like a modern clinical operations suite:

- clean, bright, calm and information-led;
- blue/navy conveys trust and primary navigation;
- white surfaces and pale blue page backgrounds keep dense information readable;
- priority colours communicate urgency, never decoration;
- Patient is welcoming and guided; Doctor is focused and dense; Super Admin is operational and scan-friendly;
- use restrained shadow, clear borders and compact radii rather than promotional gradients or large decorative panels.

## Brand and Typography

### Brand treatment

- Use the MediKiosk cross/plus mark with `MediKiosk` wordmark in the upper-left app header, as in the supplied boards.
- Retain the role descriptor beneath or beside the wordmark where space permits: `Self Service Intake`, `Clinical Suite`, or `Hospital Operations Suite`.
- Do not redraw the logo manually. Use the approved image/SVG asset when it becomes available. Until then, reserve a stable logo container.

### Type

The screenshots establish a clean geometric sans-serif style but do not identify an exact font. Use the project’s existing font; if none is provided, use:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
```

| Token | Desktop size / line height | Weight | Usage |
| --- | --- | --- | --- |
| `display` | 28px / 34px | 700 | Role/storyboard title only |
| `page-title` | 24px / 30px | 700 | Dashboard greeting, major view title |
| `section-title` | 16px / 22px | 700 | Panel/group heading |
| `card-title` | 14px / 20px | 600-700 | KPI and case-card title |
| `body` | 14px / 20px | 400-500 | Primary UI copy |
| `meta` | 12px / 16px | 400-600 | Timestamps, labels, secondary data |
| `table` | 12-13px / 18px | 400-600 | Dense operational tables |

Do not use negative letter spacing. Keep heading text dark navy and body/meta text legible at normal zoom.

## Colour Tokens

These values are implementation tokens derived to match the supplied visual direction. Replace only if an approved brand token file is provided.

```css
:root {
  --mk-canvas: #F6FAFF;
  --mk-surface: #FFFFFF;
  --mk-surface-subtle: #F1F7FF;
  --mk-border: #D9E7F6;
  --mk-border-strong: #BFD7F0;

  --mk-navy: #0A2D6E;
  --mk-text: #18345F;
  --mk-text-muted: #647A9F;
  --mk-primary: #0B67F3;
  --mk-primary-hover: #0959D6;
  --mk-primary-soft: #EAF2FF;

  --mk-success: #0C9D68;
  --mk-success-soft: #E8F8F1;
  --mk-warning: #EF9B16;
  --mk-warning-soft: #FFF5DE;
  --mk-danger: #E83E54;
  --mk-danger-soft: #FFF0F2;
  --mk-purple: #7654D8;
  --mk-purple-soft: #F1EDFF;
  --mk-info: #2287E8;
  --mk-info-soft: #EAF6FF;
}
```

### Semantic use

| Semantic state | Token family | UI treatment |
| --- | --- | --- |
| Primary actions, active navigation | blue / `--mk-primary` | Solid blue button, pale-blue active background |
| Routine/available/completed | green / `--mk-success` | Green status chip or subtle success panel |
| Attention/P1/P2/pending clarification | amber / `--mk-warning` | Text + badge + pale amber surface; never colour only |
| P0/error/destructive action | red / `--mk-danger` | High-contrast red alert or explicit destructive action |
| AI/system/secondary analysis | purple or blue | Use lightly; AI never competes visually with P0 |
| Neutral metadata | navy/muted text | Avoid low-contrast grey-on-blue combinations |

Priority labels must use these meanings:

```text
P0: red    - Critical / Immediate Escalation
P1: orange - High Priority / Urgent Handoff
P2: amber  - Moderate / Standard Queue
P3: green  - Routine / Low-Complexity / Fast Track
```

## Core Geometry and Elevation

```css
:root {
  --mk-radius-xs: 4px;
  --mk-radius-sm: 6px;
  --mk-radius-md: 8px;
  --mk-space-1: 4px;
  --mk-space-2: 8px;
  --mk-space-3: 12px;
  --mk-space-4: 16px;
  --mk-space-5: 20px;
  --mk-space-6: 24px;
  --mk-shadow-card: 0 2px 10px rgba(25, 72, 133, 0.06);
  --mk-shadow-overlay: 0 14px 32px rgba(15, 43, 88, 0.16);
}
```

- Cards: 8px maximum radius, white surface, 1px pale-blue border, very restrained shadow.
- Inputs/buttons/status chips: 6px radius.
- Tables and app sections are not floating rounded cards inside larger cards.
- Keep 8px spacing rhythm. Use 12px/16px for dense content separation and 20px/24px for larger sections.
- Stable heights: controls, table rows, priority badges, queue cards and dashboard KPIs must not jump as text changes.

## Core Components

### App shell

**Desktop operations shell (Doctor/Admin)**

```text
Top bar: brand | context/status | search/notifications | avatar
Left sidebar: workspace switcher | role navigation | management links | profile
Content: breadcrumb / toolbar -> page heading -> dashboard, table or detail workspace
```

- Sidebar width: 220-248px desktop, collapsible below desktop.
- Top bar: 56-64px, white, bottom border.
- Canvas: pale blue, content gutters 20-32px.
- Active navigation: blue text/icon and pale blue fill; no oversized rounded pill.

**Patient shell**

- Start and sequential intake screens use a focused, uncluttered panel rather than the dense operations shell.
- Keep the primary action anchored consistently near the lower edge of the task panel.
- On desktop kiosk layouts, keep the task content legible at 360-520px width; on mobile, use full-width panels with safe side padding.
- Post-consultation dashboard may use a compact bottom tab bar for Home, Records and Profile, matching the storyboard direction.

### Buttons

| Variant | Visual | Usage |
| --- | --- | --- |
| Primary | solid blue, white text/icon | Continue, Submit, Start Consultation, Complete, Approve |
| Secondary | white, blue border/text | Back, View, Request Clarification |
| Danger | red only when action is emergency/destructive | P0 emergency action, escalation, destructive confirmation |
| Icon | square/compact, familiar icon, tooltip | search, notifications, download, export, close |

- Buttons have 40px minimum height on desktop; Patient kiosk primary actions should be 44-48px.
- Do not use a text-labelled rounded rectangle where a familiar icon button is clearer.
- Disabled controls retain stable dimensions and visibly explain why they are unavailable when needed.

### Inputs, select controls and checkboxes

- White background, 1px pale-blue border, 40px height, 6px radius.
- Active focus: primary-blue ring plus border; never remove keyboard focus.
- Use segmented controls/chips for small categorical filters; use select/menu for larger option sets.
- Use labels above fields in clinical/operations forms; do not depend on placeholder-only labels.

### Status badges and priority chips

- Compact, 24-28px high, 6px radius, icon optional but label required.
- Use soft semantic background and darker readable text.
- Cases need both `P1` and `High Priority` where the space supports it; never communicate solely through colour.

### KPI cards

- White cards with 1px border, 8px radius, 16px internal padding.
- Show label, prominent value, small delta/status, and optional semantic icon.
- Keep values legible and do not make chart decoration more prominent than patient/operational data.

### Data tables

- Header: white/subtle surface, 12px semibold label.
- Rows: 48-56px height, pale divider, row hover for clickable records.
- Keep priority, status and action columns stable.
- On narrow layouts, switch to structured list rows rather than horizontally compressing all clinical fields.

### Drawers and detail panels

- Use a right-side drawer for `Evidence & Source Records`, attachments, and supporting case context.
- Drawer has fixed heading/actions, scrollable body, visible close icon, and 480-560px desktop width.
- The drawer must preserve the underlying case context; do not navigate the user away from an active consultation just to inspect evidence.

### Charts

- Charts are support for operational scanning, not dashboard decoration.
- Include chart title, legend, time range, accessible data summary and no-data/error state.
- Use blue, green, amber, red consistently; never represent P0 purely by a faint chart colour.

## Role-Specific Presentation

### Patient

- Warmest and most guided expression of the system.
- Use more whitespace, a clear progress stepper, large microphone control, friendly illustrations only in empty/end states, and one dominant action per screen.
- Show voice activity with waveform/progress state, but retain readable text transcript and text fallback.
- Emergency P0 uses a clear red alert surface but keeps instructions calm, direct, and non-diagnostic.
- P1/P2/P3 must have distinct information hierarchy, not recoloured copies of one card.
- Post-consultation information should be easy to scan: summary, medication, reports, follow-up, past records.

### Doctor

- Dense clinical workspace; fast scan over decorative emphasis.
- Queue view: table first, explicit priority/status/action columns.
- Case detail: two-column summary layout on wide desktop; patient facts, AI Triage Context and call-to-action visible without scrolling where possible.
- Clinical consultation: notes are the dominant editable surface; vitals/exam use structured compact groups.
- AI Triage Context is visually secondary to the doctor’s clinical assessment. Use a pale purple/blue informational panel, never a diagnosis card.
- Evidence drawer uses tabs for Patient Intake, Past Records, Uploaded Files and AI Triage Context.

### Super Admin

- Highest information density and strongest operational hierarchy.
- Overview prioritizes active P0, queue volume, urgent cases, availability/load, and system state.
- P0 lane is visually separate with red alert treatment and persistent timer/status, not buried in a table filter.
- Review queue and allocation use tables plus a detail pane/drawer.
- `Why this allocation?` uses a compact factor list with icons/labels, evidence drill-down, and clear Accept/Modify actions.
- Audit/log pages are utilitarian, filterable and timestamp-led; do not style them as promotional cards.

## Responsive Rules

| Viewport | Patient | Doctor / Super Admin |
| --- | --- | --- |
| `>= 1280px` | centered task panel or dashboard grid | persistent sidebar; 2-4 column KPI grids; tables/detail panes |
| `768px - 1279px` | full-width intake surface with constrained content | collapsible sidebar; 2-column details; table-to-list conversion where necessary |
| `< 768px` | full-width task sequence; 44px touch targets; sticky primary action | compact navigation, structured list rows, bottom sheet/drawer for secondary detail; no unreadable wide tables |

Do not use viewport-scaled font sizes. Text must wrap rather than overlap or truncate clinical meaning.

## States and Motion

- Use short 150-200ms opacity/transform transitions for route/panel changes; respect reduced-motion preference.
- Processing is a clear status state, not an infinite decorative animation.
- For P0, use an attention signal once on entry; avoid repeated animation that makes emergency content harder to read.
- Skeletons should preserve the final layout dimensions.
- Toasts confirm low-risk actions; major actions such as submit, escalation, re-triage, sign, reassign and override need an explicit confirmation/result state.

## Accessibility and Visual QA

- Meet WCAG AA contrast for text and interactive controls.
- Keyboard focus is always visible, including table actions, tabs, drawers and voice fallback controls.
- Use labels/icons/text together for urgent, waiting, completed and error states.
- Validate Hindi/regional-language string expansion; do not set fixed widths that truncate labels.
- Validate Patient at kiosk/mobile size, Doctor/Admin at desktop plus tablet, and each drawer/table at narrow width.
- Compare the implemented screens to the supplied boards for hierarchy and density, while following the corrected role-flow documents when the board is outdated.

## Visual Implementation Acceptance Checklist

- [ ] Logo/header, navigation, canvas, cards, controls, tables and status chips follow the same visual language across all roles.
- [ ] Priority colours and labels are identical across Patient, Doctor and Admin.
- [ ] Patient feels guided and uncluttered; Doctor/Admin remain dense and operational.
- [ ] No card-inside-card clutter, oversized rounded panels, decorative gradients, or marketing-style hero sections.
- [ ] P0 remains the most visually prominent operational alert without becoming visually chaotic.
- [ ] Evidence drawer and allocation reasoning panel are reusable, responsive components.
- [ ] Desktop, tablet and mobile/kiosk views retain readable text, touch targets and stable layout.
- [ ] Focus, contrast, loading, empty, error and permission states are visually designed before acceptance.

