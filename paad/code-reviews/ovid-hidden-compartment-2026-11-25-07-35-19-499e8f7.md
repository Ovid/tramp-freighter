# Agentic Code Review: ovid/hidden-compartment

* **Date:** 2026-11-25 07:35:19
* **Model:** claude-opus-5-5
* **PAAD version:** 2.1.0
* **Branch:** ovid/hidden-compartment -> main
* **Commit:** 499e8f7e30c5d2daff864b77923a110cf800efff
* **Files changed:** 72 | **Lines changed:** +5947 / -1680
* **Diff size category:** Large

## Executive Summary

The branch is in good shape. The core NPC cargo storage picker, the engine-owned picker choices (ADR 0001), the hidden-compartment mission-cargo fixes and the save repairs all match the design. Specialists traced them carefully and found no Critical or Important bugs, and the full suite passes (447 files, 4512 tests). All three verified in-scope findings are Suggestions. Two of them come from the late addition that makes Escape close the station panel (commit 499e8f7): it skips `clearDialogue()`, and its capture-phase `stopPropagation` takes Escape away from other overlays. Confidence is medium-high.

## Critical Issues

None found.

## Important Issues

None found.

## Suggestions

- **[S1]** `src/features/station/PanelContainer.jsx:27-39`: Escape closes the dialogue panel through App's `handleClosePanel`, which skips `DialoguePanel.handleClose`, so `clearDialogue()` never runs. `state.dialogue` stays `isActive` with the previous NPC/node/display, can be saved that way, and flashes for about one frame on the next dialogue mount. The stale-choice-click window that some reports claimed is not practically reachable. The same gap already exists via undock, dock, jump and panel switching (`App.jsx:253,272,277,327`). **Fix:** add a `clearDialogue()` unmount cleanup in `DialoguePanel`, which covers every close path at once. (Logic B, Error Handling B, Contract B, Concurrency B, Spec Compliance B; `claude-opus-5-5`; Medium)
- **[S2]** `src/features/station/PanelContainer.jsx:31-34`: the "modal is open" guard matches only `.modal-overlay`. The capture-phase `stopPropagation()` on `document` runs before React 18's root listeners and bubble-phase document listeners. As a result:
  - With the Upgrades purchase confirmation open (`UpgradesPanel.jsx:147`, `aria-modal`), Escape closes the whole Upgrades panel instead of the confirmation.
  - Escape aimed at `CustomSelect` (`CustomSelect.jsx:66`) or at `useClickOutside` users (DevAdminPanel, CameraControls, MobileCameraToolbar) closes the station panel instead.

  **Fix:** also match `[aria-modal="true"]`, and return early when `document.activeElement` is inside another `[data-panel]`. Keep the `stopPropagation`, because it stops StationMenu from undocking. (Logic B, Error Handling B; `claude-opus-5-5`; Medium)
- **[S3]** `src/game/state/managers/trading.js:97-100` + `src/features/trade/TradePanel.jsx:330-332` + `src/game/state/state-validators.js:853-862`: older saves can hold mission-type goods with no `missionId` (stripped by main's `addToCargoArray`). The new non-finite price guard correctly blocks the NaN sale, but these stacks now can't be sold, delivered or jettisoned, and they hold cargo space forever. The only escape is NPC storage. **Fix:** in `addStateDefaults`, drop untagged stacks whose good is in the mission cargo types from `ship.cargo` and `ship.hiddenCargo`, or log the gap in `docs/backlog.md`. This is strictly better than main, but the migration has a gap. (Error Handling A; `claude-opus-5-5`; Medium)

## Out of Scope

> **Handoff instructions for any agent processing this report:** The findings below are
> pre-existing bugs that this branch did not cause or worsen. Do **not** assume they
> should be fixed on this branch, and do **not** assume they should be skipped.
> Instead, present them to the user **batched by tier**: one ask for all out-of-scope
> Critical findings, one ask for all Important, one for Suggestions. For each tier, the
> user decides which (if any) to address. When you fix an out-of-scope finding, remove
> its entry from the backlog that holds it. Per this project's config
> (`paad/config/paad.md`), that backlog is `docs/backlog.md`, and entries are identified
> by their `##` heading.

### Out-of-Scope Critical
None found.

### Out-of-Scope Important
None found.

### Out-of-Scope Suggestions
- **[OOSS1]** `src/game/state/managers/npc.js` `storeCargo`/`retrieveCargo`: these don't emit `NPCS_CHANGED`. Retrieve also lost its incidental emit, because its picker choice no longer has `repGain`. Nothing visible breaks today. Backlog id: "NPC storage changes don't emit `NPCS_CHANGED`" (re-seen). (Concurrency A; `claude-opus-5-5`; Medium)
- **[OOSS2]** `src/game/state/managers/ship.js:650-655` `moveToRegularCargo`: the capacity check ignores passenger space. The only caller (TradePanel) clamps correctly. Backlog id: "Moving cargo out of the hidden compartment ignores passenger space" (re-seen). (Logic A, Spec Compliance A; `claude-opus-5-5`; Medium)
- **[OOSS3]** `src/game/state/managers/ship.js` `moveToHiddenCargo`/`moveToRegularCargo` (~591-612, 646-662): they accept zero, negative or fractional `qty`. The UI clamps. Backlog id: "Hidden cargo moves accept zero, negative or fractional quantities" (re-seen). (Logic A; `claude-opus-5-5`; Medium)

## Out-of-Scope Additions

> **Handoff instructions for any agent processing this report:** The entries below are code this branch added that the spec did not promise. They may be legitimate "while I'm here" fixes for issues exposed by this work, or scope creep that should live in a separate PR. Do **not** assume they should stay on this branch, and do **not** assume they should be reverted. Present them to the user **as a single batched ask**: "These M additions weren't promised by the spec — keep, split into a separate PR, or revert?" The user decides per item.
>
> Out-of-scope additions are flagged for this PR only — they do not persist to either backlog.

### [OOSA1] Escape key closes the open station panel
- **File:** `src/features/station/PanelContainer.jsx:27-40` (commit 499e8f7)
- **Addition:** A capture-phase document keydown listener. On Escape it closes whichever station panel is open, unless a `.modal-overlay` is present. The design only requires that Escape cancels the picker modal without closing the dialogue panel. If you keep this addition, also address S1 and S2.
- **Suggested intent source:** `docs/plans/2026-11-24-npc-cargo-storage-picker-design.md`, `docs/plans/2026-11-24-npc-cargo-storage-picker.md`, commit messages
- **Confidence:** Medium
- **Found by:** Spec Compliance (`claude-opus-5-5`)

## Review Metadata

- **Agents dispatched:** Logic & Correctness: findings (5); Error Handling & Edge Cases: findings (4); Contract & Integration: findings (1); Concurrency & State: findings (2); Security: bailed: security no-boundary (both instances); Spec Compliance: findings (2). Large diff, so every lens ran as 2 instances (12 dispatches). Partition A covered state managers, the engine, validators, the coordinator and their tests. Partition B covered UI, hooks, dialogue data, CSS, docs, config and their tests.
- **Scope:** all 72 changed files, plus adjacent files traced one level deep:
  - `src/features/danger/applyEncounterOutcome.js`: caller of `failMissionsDueToCargoLoss`.
  - `src/game/state/managers/inspection.js`, `src/features/danger/inspectionUtils.js` and `src/features/danger/InspectionPanel.jsx`: these read `hiddenCargo`, which can now hold mission cargo.
  - `src/features/dev-admin/DevAdminPanel.jsx`: subscribes to `NPCS_CHANGED`.
  - `src/App.jsx`: mounts the panels.
  - `src/game/state/managers/save-load.js`: restore path.
  - `src/game/constants.js`.
  - Added by specialists and the verifier: `src/hooks/useClickOutside.js`, `src/components/CustomSelect.jsx`, `src/features/upgrades/UpgradesPanel.jsx` and `src/game/state/managers/state.js`.
- **Raw findings:** 14 (before verification)
- **Verified findings:** 7 (after verification)
- **Filtered out:** 7. Five were merged duplicates: the Escape/`clearDialogue` finding was reported four times, the Escape `stopPropagation` finding twice, and the passenger-space finding twice. Two were rejected:
  - Picker-confirm double-submit: the window is under one frame because `game-dialogue.js` is already loaded.
  - `buyGood` missing a non-finite guard: its only caller passes priced goods, so this is hardening rather than a reachable bug.
- **Out-of-scope findings:** 3 (Critical: 0, Important: 0, Suggestion: 3)
- **Out-of-scope additions:** 1
- **Backlog:** 0 new entries added, 3 re-confirmed (see `docs/backlog.md`; the project config overrides `paad/code-reviews/backlog.md`)
- **Steering files consulted:** CLAUDE.md, DEVELOPMENT.md, paad/config/paad.md
- **Intent sources consulted:** docs/plans/2026-11-24-npc-cargo-storage-picker-design.md, docs/plans/2026-11-24-npc-cargo-storage-picker.md, paad/adrs/0001-dialogue-engine-owns-picker-choices.md, recent commit messages
- **Verifier warnings:** none
