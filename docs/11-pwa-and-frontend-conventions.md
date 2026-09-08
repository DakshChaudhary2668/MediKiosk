# PWA And Frontend Conventions

## PWA architecture

The frontend is a Next.js PWA with role-aware screens for patient, doctor, and Super Admin workflows.

- The service worker may cache the application shell and non-sensitive static assets.
- Sensitive intake, queue, assessment, and record data must not be cached offline by default.
- Offline mutations are out of scope until conflict resolution, encryption, and replay rules are designed.
- Loading, empty, error, stale, unauthorized, and review-pending states are first-class UI states.
- The PWA must not assume that a successful network request means queue admission; display the backend state returned.
- Installability, supported browsers, push notifications, and background sync are `TBD`.

## Frontend/backend boundary

Keep server data fetching and mutation logic in a small integration layer. Components should render typed data and requested actions rather than duplicating queue or triage rules. Client-side labels should come from shared contract values, not independently invented strings.

## SCSS conventions

SCSS is the intended styling approach; the exact module/global split is `TBD`. The working convention is:

- global tokens for color, typography, spacing, motion, and breakpoints;
- component-local styles for layout and visual states;
- role/workflow page styles only for composition, not business logic;
- status styles that pair color with text/icon so meaning is not color-only;
- stable dimensions for queue rows, turn indicators, buttons, and form controls;
- responsive layouts that remain usable on kiosk-sized and desktop-sized screens;
- accessible focus, keyboard navigation, labels, contrast, and reduced-motion behavior.

Do not hard-code medical meaning into a CSS class name without aligning it to the shared contract. A `P0` visual treatment must remain a presentation of a backend value, not a client-side triage calculation.

## UI state language

Use plain, non-diagnostic language in patient-facing UI. Doctor/Admin views may expose evidence and uncertainty, but should label AI output as a recommendation. Exact copy and localization are `TBD`.
