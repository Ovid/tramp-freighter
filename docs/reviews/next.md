# Next a11y items to fix

Source: `docs/reviews/a11y-2026-03-14-14-02-30.md`

## DONE

### [M1] DangerWarningDialog lacks dialog semantics — FIXED
- Added `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby` to DangerWarningDialog.

### [M13] Font sizes use px units, preventing browser text scaling — FIXED
- Converted all typography variables in `css/variables.css` from px to rem.

### [M4] InfoBrokerPanel tabs lack ARIA tab pattern — FIXED
- Added `role="tablist"`, `role="tab"` with `aria-selected`/`aria-controls`, `role="tabpanel"` with `aria-labelledby`, and arrow key navigation with focus management.

### [M3] No landmark regions or skip navigation — FIXED
- Wrapped HUD in `<nav aria-label="Game HUD">`, primary content in `<main id="main-content">`. Added skip link with CSS.

### [S2] Modal component lacks focus trap, initial focus, and focus restoration — FIXED
- Added focus trap (Tab/Shift-Tab), initial focus on first focusable element, and focus restoration on close.

### [S3] Five dialog overlays bypass Modal component -- no dialog semantics — FIXED
- Added `role="dialog"`/`role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`/`aria-label` to ShipNamingDialog, MissionCompleteNotifier, SystemPanel (critical damage modal), UpgradesPanel (confirmation dialog), NarrativeEventPanel.

### [S4] No focus management on view mode transitions — FIXED
- Added centralized `useEffect` in App.jsx that moves focus on `viewMode` changes. TITLE focuses first menu button, ORBIT focuses `<main>`, STATION focuses station heading, ENCOUNTER focuses first button in the panel, PAVONIS_RUN/EPILOGUE focus their containers. Added `tabIndex={-1}` and ref to `<main>`.

### [M17] Notifications auto-dismiss with no user control — FIXED
- Added pause-on-hover/focus and resume-on-leave/blur to notification timers. Added dismiss button (×). Timer state tracked in ref for accurate remaining-time calculation on resume.

### [S1] Three.js starmap camera controls are mouse-only — FIXED
- Added keyboard handler to starmap container: arrow keys rotate camera (azimuth/polar via spherical coordinates), +/- zoom. Container gets `tabIndex={0}`, `role="application"`, `aria-label`. Added `keyboardRotationStep` constant (5 degrees) to VISUAL_CONFIG. Focus-visible outline on container.

### [F6] Modal close button hidden when title is absent — FIXED
- Moved close button outside the `{title && ...}` block so it renders even without a title.

### [C8] Modal uses static `id="modal-title"` — FIXED
- Replaced hardcoded `id="modal-title"` with React `useId()` for unique IDs per modal instance.

### [E5] CSS pulse animations infinite with no reduced-motion override — FIXED
- Already covered by M16's global `@media (prefers-reduced-motion: reduce)` rule in `base.css`.

### [C7] Dev admin button has no aria-label — FIXED
- Added `aria-label="Developer admin panel"` to the dev-only gear button.

### [C6] TradePanel hidden cargo toggle lacks `aria-expanded` — FIXED
- Added `aria-expanded` and `aria-controls="hidden-cargo-content"` to the toggle button.

### [D8] Focus ring only 1px wide — FIXED
- Widened `button:focus-visible` outline from 1px to 2px in `base.css`.

### [B3] Page title never updates dynamically — FIXED
- Created `getPageTitle(viewMode)` utility. Added `useEffect` in App.jsx to set `document.title` on view mode transitions.

### [B2] HUD heading hierarchy skips — FIXED
- Changed `<h4>` to `<h2>` in ActiveMissions. Updated CSS selector accordingly.

### [D9] Input `:focus` removes outline — FIXED
- Replaced `outline: none` with `outline: 2px solid transparent` on ship-name-input and refuel input focus. Preserves custom focus indicators while supporting Windows High Contrast Mode.

### [C5] AchievementsList progress bars lack ARIA — FIXED
- Added `role="progressbar"`, `aria-label`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` to achievement progress bars.

### [C10] UpgradesPanel warning emoji uses `title` attribute — FIXED
- Replaced `title` with `aria-hidden="true"` on decorative warning emoji. Tradeoff info is already shown in text below.

### [F3] MissionComplete button labels ambiguous — FIXED
- Changed "Dismiss" to "Later" and "Complete" to "Claim Reward" for clarity.

### [E3]+[E4] Three.js JS animations ignore prefers-reduced-motion — FIXED
- Auto-rotation defaults to off when OS prefers reduced motion. Selection ring and current system indicator use static values (no pulsing/rotating) in reduced motion mode.

### [F1] Inconsistent Back/Close button labels — FIXED
- Standardized MissionBoardPanel "Back" to "Back to Station" to match other panels.

### [E8] End credits have skip but no pause — FIXED
- Added Pause/Play button and Space key toggle. Credits scroll can now be paused and resumed.

### [D11] Toggle switch borderline non-text contrast — FIXED
- Lightened knob from `#888888` to `#aaaaaa` (3.3:1 on `#444444` track), meeting WCAG 1.4.11.

## Not real issues (verified)

- **[D4]** Disabled buttons `opacity: 0.5` — All `:disabled` selectors are on elements that have the semantic HTML `disabled` attribute. Screen readers convey disabled state. Not a barrier.
- **[D5]** Color-only status scales — All status scales include text labels (Good/Fair/Poor/Critical, safe/contested/dangerous). Color is supplemental. Not a barrier.
- **[D13]** Mission urgency border color — "Xd remaining" and "EXPIRED" text conveys urgency. Border color is supplemental. Not a barrier.

## Deferred (not quick fixes)

- **[E2]** Jump animation unskippable (3-5s) — Animation system uses 3-phase async with encounter callback timing. Adding skip support would need careful handling to avoid buffered encounters getting stuck. Brief duration (3-5s).
- **[D7]** `body { overflow: hidden }` clips at high zoom — Intentional for fullscreen game. Removing would break layout.
- **[F2]** Help/Instructions nested in settings — Requires significant UI change to relocate.
