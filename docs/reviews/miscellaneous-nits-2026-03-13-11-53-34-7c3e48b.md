# Deep Code Review: ovid/miscellaneous-nits

**Date:** 2026-03-13 11:53:34
**Branch:** ovid/miscellaneous-nits -> main
**Commit:** 7c3e48bb500b66b2443ee1ad37b51317972d4bb4
**Files changed:** 49 | **Lines changed:** +3264 / -226
**Diff size category:** Large

## Executive Summary

The branch implements 5 features (orbit visit tracking, Cole early repayment fee, Tanaka quest mission slot, star finder dropdown, click-outside panel dismissal) across 49 files. All design items are fully implemented and closely match their design documents. The business logic is sound — fee calculations, state migrations, and event wiring are correct. Three important issues were found: a missing `data-panel` attribute on `PostCreditsStation` that causes incorrect undock behavior, double `game.undock()` invocations when both StationMenu and PanelContainer are rendered, and missing keyboard navigation in the new `CustomSelect` component.

## Critical Issues

None found.

## Important Issues

### [I1] PostCreditsStation missing `data-panel` — clicking it while a panel is open triggers undock

- **File:** `src/features/endgame/PostCreditsStation.jsx:28`
- **Bug:** `PostCreditsStation` renders `<div id="station-interface" className="visible">` without the `data-panel` attribute. The regular `StationMenu` has `data-panel` (line 78). When in post-credits state with a dialogue panel open, clicking anywhere on the PostCreditsStation menu area causes `PanelContainer`'s `useClickOutside` handler to fire `onUndock` — because the click target is not inside any `[data-panel]` element. This incorrectly transitions the player from the permanent post-credits station to orbit.
- **Impact:** Players in the post-credits endgame who click the station menu while a dialogue panel is open are unexpectedly kicked back to orbit.
- **Suggested fix:** Add `data-panel` to the root div: `<div id="station-interface" className="visible" data-panel>`
- **Confidence:** High
- **Found by:** Logic & Correctness (UI)

### [I2] Double `game.undock()` call when both StationMenu and PanelContainer are rendered

- **File:** `src/features/station/PanelContainer.jsx:30` and `src/features/station/StationMenu.jsx:28`
- **Bug:** When a panel is open in STATION mode, both `StationMenu` and `PanelContainer` are rendered simultaneously. Both register `useClickOutside(ref, onUndock)`. When the user clicks the starmap background, both independent document-level `mousedown` handlers fire, calling `handleUndock` twice. This calls `game.undock()` twice, emitting the `UNDOCKED` event twice and triggering `markDirty()` twice.
- **Impact:** Currently idempotent so no data corruption, but double event emission is a latent bug if any future subscriber assumes single invocation (analytics, achievements, counters).
- **Suggested fix:** Have `PanelContainer`'s click-outside call `onClose` (just closing the panel) instead of `onUndock`, letting only `StationMenu`'s handler handle the undock. Alternatively, remove `useClickOutside` from `PanelContainer` entirely since `StationMenu`'s handler already covers the full-undock case.
- **Confidence:** High
- **Found by:** Logic & Correctness (UI), Error Handling & Edge Cases, Concurrency & State (3 agents agreed)

### [I3] CustomSelect lacks keyboard navigation for dropdown options

- **File:** `src/components/CustomSelect.jsx:45-49`
- **Bug:** The `CustomSelect` component only handles `Escape` for keyboard interaction. There is no support for `ArrowDown`/`ArrowUp` to move between options, `Enter`/`Space` to select the focused option, or `Home`/`End` to jump to first/last option. The `<li>` elements with `role="option"` lack `tabIndex` and are not focusable. Keyboard-only users cannot navigate the dropdown after opening it.
- **Impact:** Violates the ARIA listbox pattern. This component replaces native `<select>` elements that had full keyboard support. CLAUDE.md requires "keyboard-navigable interactive controls" for new components.
- **Suggested fix:** Track a `focusedIndex` state, handle `ArrowDown`/`ArrowUp` to move focus, `Enter`/`Space` to select, add `tabIndex` to `<li>` elements, and manage focus via refs.
- **Confidence:** High
- **Found by:** Logic & Correctness (UI)

## Suggestions

- **INTELLIGENCE_CONFIG.SOURCES constants unused in production:** `INTELLIGENCE_CONFIG.SOURCES.ORBIT`, `.VISITED`, `.INTELLIGENCE_BROKER` are defined in `src/game/constants.js:89-93` but never imported by any production code. All 5 production usage sites use raw string literals (`'orbit'`, `'visited'`, `'intelligence_broker'`). Either use the constants everywhere or remove them. *(Found by: Contract & Integration)*

- **useClickOutside listener churn:** `handleUndock` and `handleClosePanel` in `App.jsx` are plain function declarations (not wrapped in `useCallback`), causing `useClickOutside`'s `useEffect` to tear down and re-register `mousedown` listeners on every App re-render. Wrapping callbacks in `useCallback` or storing the callback in a ref inside the hook would eliminate the churn. *(Found by: Concurrency & State)*

## Plan Alignment

**Design docs consulted:**
- `docs/plans/2026-03-12-miscellaneous-nits-design.md`
- `docs/plans/2026-03-13-click-outside-panel-fix-design.md`

**Implemented:** All 8 design items are fully implemented:
1. "Visited but never docked" tracking — complete
2. Cole early repayment fee — complete
3. Tanaka quest in mission system — complete
4. Star finder dropdown — complete
5. useClickOutside hook — complete
6. Flatten view state machine — complete
7. Per-component backdrop removal — complete
8. CSS changes (sticky headers, z-index fixes) — complete

**Not yet implemented:** Nothing remaining.

**Deviations:**
- Star finder uses `CustomSelect` instead of native `<select>` (improvement for cross-platform styling)
- Visited star indicator uses checkmark only, without the supplementary color coding suggested in the design doc (minor gap)
- `StarmapProvider` changed from `useRef` to `useState` to fix a bug where context consumers wouldn't re-render (necessary infrastructure fix not in original design)
- Two orbit-entry edge cases (prices recalculation, cleanup) were identified post-design and fixed (protective additions)

## Review Metadata

- **Agents dispatched:** Logic & Correctness (Game State), Logic & Correctness (UI/Panels), Error Handling & Edge Cases, Contract & Integration, Concurrency & State, Security, Plan Alignment
- **Scope:** 49 changed files + callers/callees one level deep, CSS, tests
- **Raw findings:** 10 (before verification)
- **Verified findings:** 5 (after verification)
- **Filtered out:** 5 (orbit cleanup by design, rounding math sound, missions.active guaranteed, questState.data guaranteed, useMemo removal is documented tradeoff)
- **Steering files consulted:** CLAUDE.md
- **Plan/design docs consulted:** docs/plans/2026-03-12-miscellaneous-nits-design.md, docs/plans/2026-03-13-click-outside-panel-fix-design.md
