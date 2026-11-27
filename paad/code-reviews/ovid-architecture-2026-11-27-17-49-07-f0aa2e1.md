# Agentic Code Review: ovid/architecture

* **Date:** 2026-11-27 17:49:07
* **Model:** claude-opus-5-5
* **PAAD version:** 2.1.0
* **Branch:** ovid/architecture -> main
* **Commit:** f0aa2e1730d7efa3f2e002a1c81dd7c410628d2f
* **Files changed:** 66 | **Lines changed:** +2054 / -1530
* **Diff size category:** Large

## Executive Summary

The branch applies architecture fixes F-6, F-7, F-8, F-9 and F-11 from the 2026-11-27 architecture report, and reviewers found no Critical or Important bugs in it. The moved repair and debt pricing matches the old behaviour, as do jump execution and the save path. Reviewers checked this by tracing the code and running the affected tests, which all passed. All 10 verified findings are Suggestions. The most player-visible is [S3]: an abandoned encounter leaves its combat state behind for the next pirate encounter. The rest are stale docs and tests, two small error-path changes, and one refuel pricing mismatch that players can't reach today.

## Critical Issues

None found.

## Important Issues

None found.

## Suggestions

- **[S1]** `src/hooks/useEncounterOrchestration.js:77-84`: `abandonEncounter` never calls `setCombatContext(null)`, but the sibling exits do (`handleEncounterClose` :197, `handleOutcomeContinue` :212). If a resolver throws after an escalation or a failed flee, the next pirate encounter starts with Negotiate disabled (App.jsx:518) or shows an old "flee failed" banner (App.jsx:527). Fix: reset it in `abandonEncounter`, and optionally in `handleEncounterTriggered`. Found by Logic & Correctness and Error Handling (`claude-opus-5-5`). Confidence: Medium.
- **[S2]** `src/features/dialogue/DialoguePanel.jsx:61-69`: the new failure branch after `await startDialogue(...)` has no cancellation guard. Under StrictMode (main.jsx:166), a failing start shows two toasts and closes twice. A stale continuation can also close a newer dialogue. Fix: set a `cancelled` flag in the effect cleanup. Found by Concurrency & State (`claude-opus-5-5`). Confidence: Medium.
- **[S3]** `src/game/state/managers/navigation.js:54-93` and `src/App.jsx:243-248`: jumps and ship naming no longer save immediately. They rely on the 500ms `markDirty` debounce plus a `beforeunload` flush, which mobile browsers don't fire reliably. Fix: call `capabilities.saveGame()` after `completeJump`, or add a `pagehide`/`visibilitychange` flush (F-22). Found by Concurrency & State (`claude-opus-5-5`). Confidence: Medium.
- **[S4]** `src/game/state/game-coordinator.js:904-906` and `src/game/state/managers/navigation.js:54-58`: with null state, `executeJump` now throws a TypeError instead of returning `{success:false, error:'No game state'}`. Normal play can't reach this. Fix: restore the guard, or record the change in the F-7 status. Found by Spec Compliance (`claude-opus-5-5`). Confidence: Medium.
- **[S5]** `paad/architecture-reviews/2026-11-27-tramp-freighter-architecture-report.md:235-236`: F-6 is marked "Fixed", but the refuel price is still computed twice. `refuelUtils.js:32-38` uses `ceil(a*p*(1-d))` and `managers/refuel.js:71,127-128` uses `ceil(a*(p*(1-d)))`, which differ under a discount (shows 12, charges 13). No NPC has a refuel discount today. Fix: give RefuelManager a single cost function, or mark F-6 Partially fixed and log it. Found by Spec Compliance (`claude-opus-5-5`). Confidence: Medium.
- **[S6]** `DEVELOPMENT.md:118`: still lists `saveGame` as a `useGameAction` pass-through, which F-11 removed. Fix: drop it. Found by Contract & Integration and Spec Compliance (`claude-opus-5-5`). Confidence: High.
- **[S7]** `src/game/state/capabilities.js:472-497`: the `NavigationCapabilities` typedef is missing the 10 capabilities this branch wired in (game-coordinator.js:206-216): `getShip`, `calculateShipCapabilities`, `applyQuirkModifiers`, `validateJump`, `updateFuel`, `updateTime`, `updateShipCondition`, `beginJump`, `endJump`, `completeJump`. Found by Contract & Integration (`claude-opus-5-5`). Confidence: Medium.
- **[S8]** `tests/unit/passenger-board-display.test.jsx:13-33`: the test still mocks the removed `calculateRouteIndicator`, `navigationSystem` and `useStarData`, and the mocked game has no `getRouteIndicator`. The test passes only because its fixtures never reach the route branch. Fix: drop the dead mocks and add `getRouteIndicator: vi.fn(() => null)`. Found by Contract & Integration (`claude-opus-5-5`). Confidence: Medium.
- **[S9]** `src/features/missions/missionRouteUtils.js:6,26`: two JSDoc comments still name the deleted `calculateRouteIndicator`. Fix: point them at `game.getRouteIndicator`. Found by Spec Compliance (`claude-opus-5-5`). Confidence: High.
- **[S10]** `docs/backlog.md:227-233,265-271` and `tests/unit/npc-extensibility.test.js:292,411,418` describe save behaviour that F-11 removed. The "saveGame docstring" entry is now fixed. The ship-naming entry cites a removed call. The `lastSaveTime` "debounce" comments and assignments no longer do anything. Found by Contract & Integration (`claude-opus-5-5`). Confidence: Medium.

## Review Metadata

- **Agents dispatched:** Logic & Correctness: findings (1); Error Handling & Edge Cases: findings (1); Contract & Integration: findings (4); Concurrency & State: findings (2); Security: bailed: no-boundary; Spec Compliance: findings (4). Large diff, so each lens ran as 2 instances. Partition A covered navigation/jump, encounter, dialogue, save-load, hooks and missions (2993 diff lines). Partition B covered repair, debt/finance, game-coordinator, ship/debt hooks and docs (2063 diff lines). That made 12 dispatches.
- **Scope:** the 66 changed files, plus these adjacent files from caller tracing (Phase 1 step 6): `src/hooks/useDialogue.js` (calls `startDialogue`), `src/features/danger/DangerWarningDialog.jsx` (uses `useEncounterProbabilities`/`useDangerZone`), `src/features/trade/TradePanel.jsx` (uses `useDangerZone`), `src/game/state/capabilities.js` (capability contracts for changed managers), `src/main.jsx` (save flush and navigationSystem wiring)
- **Raw findings:** 12 (before verification)
- **Verified findings:** 10 (after verification)
- **Filtered out:** 2. Both are duplicates merged into another finding: the DEVELOPMENT.md finding (into S6) and the abandonEncounter finding (into S1).
- **Out-of-scope findings:** 0 (Critical: 0, Important: 0, Suggestion: 0)
- **Out-of-scope additions:** 0
- **Backlog:** 0 new entries added, 0 re-confirmed (see `paad/code-reviews/backlog.md`)
- **Steering files consulted:** CLAUDE.md, DEVELOPMENT.md, paad/config/paad.md
- **Intent sources consulted:** paad/architecture-reviews/2026-11-27-tramp-freighter-architecture-report.md (F-5 through F-11 status), recent commit messages, paad/logs/rethink.md, branch name
- **Verifier warnings:** none
