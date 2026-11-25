# Agentic Code Review: ovid/jump-warning-proceed

* **Date:** 2026-11-25 09:07:08
* **Model:** claude-opus-5-5
* **PAAD version:** 2.1.0
* **Branch:** ovid/jump-warning-proceed -> main
* **Commit:** 510ac4c4430c6df751940f6a8272e3e77f5df1c7
* **Files changed:** 8 | **Lines changed:** +250 / -190 (mostly reindentation; ~70 semantic lines)
* **Diff size category:** Medium

## Executive Summary

The branch fixes issue #49. It does this twice over: a `[aria-modal="true"]` mousedown guard in `useClickOutside`, and a non-dismissing `.modal-overlay` backdrop around the Jump Warning and the Narrative Event panel. Both fixes are correct, and the four touched test files pass. Verification found no Critical or Important bugs. Two Suggestions are about stale text and dead CSS that the second commit left behind. One pre-existing keyboard focus gap went to the backlog.

## Critical Issues

None found.

## Important Issues

None found.

## Suggestions

- **[S1] Stale guard rationale** (`src/hooks/useClickOutside.js:26-28`): the comment says the jump warning is "overlay-less". Since f6ecc05 it is wrapped in `.modal-overlay`, so line 25 already catches its mousedown. The new guard is still needed for aria-modal dialogs that have neither an overlay nor a `[data-panel]` ancestor: the encounter panels while CameraControls or MobileCameraToolbar is active, and DevPanelPreview while DevAdminPanel is open. Reword the comment to name those dialogs, so nobody deletes the guard thinking it is redundant. Relabel the #49 regression test at `tests/unit/panel-click-outside.test.jsx:219-235` the same way. It mounts a bare, overlay-less dialog, which is no longer how the jump warning renders. — Spec Compliance + Contract & Integration (`claude-opus-5-5`), High
- **[S2] Dead mobile z-index overrides** (`css/panel/danger-warning.css:365-368`; the `#narrative-event-panel` entry in `css/variables.css:259-283`): both dialogs now sit inside `.modal-overlay`, a stacking context at z 1100. Their mobile z-index values (21 and 20) no longer place them relative to the mobile HUD (30/40), and the dimmed overlay now covers the HUD strip. That fits the commit's "block the world" intent, so this is not a functional bug. The CSS just contradicts the DOM. Delete the override in danger-warning.css. The variables.css rule is shared with other panels, so leave it, or add a comment. — Contract & Integration (`claude-opus-5-5`), Medium

## Out of Scope

> **Handoff instructions for any agent processing this report:** The findings below are
> pre-existing bugs that this branch did not cause or worsen. Do **not** assume they
> should be fixed on this branch, and do **not** assume they should be skipped.
> Instead, present them to the user **batched by tier**: one ask for all out-of-scope
> Critical findings, one ask for all Important, one for Suggestions. For each tier, the
> user decides which (if any) to address. When you fix an out-of-scope finding, remove
> its entry from the backlog that holds it by ID. Per `paad/config/paad.md`, that
> backlog is `docs/backlog.md`.

### Out-of-Scope Critical
None found.

### Out-of-Scope Important
None found.

### Out-of-Scope Suggestions
- **[OOSS1] Narrative and jump-warning dialogs have no focus trap** — backlog id: `60c8c6b6`. Neither dialog moves focus into itself or traps Tab, and the background is not `inert`. A keyboard user can still Tab to StationMenu's undock button or the HUD behind the backdrop (`src/features/narrative/NarrativeEventPanel.jsx:73-77`, `src/features/danger/DangerWarningDialog.jsx:68-71`). This predates the branch, and the branch does not make it worse: it closes only the pointer path. The new comment at `NarrativeEventPanel.jsx:73-74` ("must choose before undocking or jumping") does overclaim, because that holds only for pointer input. Fix: reuse Modal.jsx's focus trap, or set `inert` on the app root. — Error Handling & Edge Cases (`claude-opus-5-5`), Medium. Backlog status: new.

## Review Metadata

- **Agents dispatched:** Logic & Correctness — findings (1); Error Handling & Edge Cases — findings (1); Contract & Integration — findings (3); Concurrency & State — findings (0); Security — bailed: no-boundary; Spec Compliance — findings (1)
- **Scope:** Changed: the 8 diff files. Adjacent, traced via callers/consumers of `useClickOutside`, `DangerWarningDialog`, `NarrativeEventPanel`, `.modal-overlay` and `aria-modal`: `src/features/station/StationMenu.jsx`, `src/features/dev-admin/DevAdminPanel.jsx`, `src/features/navigation/CameraControls.jsx`, `src/features/navigation/MobileCameraToolbar.jsx`, `src/features/navigation/SystemPanel.jsx`, `src/App.jsx`, `src/features/dev-admin/DevPanelPreview.jsx`, `src/components/Modal.jsx`, `src/features/station/PanelContainer.jsx`, `css/modals.css`, `css/panel/*.css`, `src/features/upgrades/UpgradesPanel.jsx`, `src/features/danger/*Panel.jsx`, `src/features/title-screen/ShipNamingDialog.jsx`
- **Raw findings:** 6 (before verification)
- **Verified findings:** 3 (after verification)
- **Filtered out:** 3. Two were merged as duplicates (the stale-comment finding was reported twice, and so was the DevPanelPreview finding). One was rejected: DevPanelPreview's backdrop click already failed to close the preview before this branch, and what is left is cosmetic in a dev-only tool.
- **Out-of-scope findings:** 1 (Critical: 0, Important: 0, Suggestion: 1)
- **Out-of-scope additions:** 0
- **Backlog:** 1 new entry added, 0 re-confirmed (see `docs/backlog.md`, per `paad/config/paad.md`)
- **Steering files consulted:** CLAUDE.md, paad/config/paad.md
- **Intent sources consulted:** recent commit messages, GitHub issue #49
- **Verifier warnings:** none
