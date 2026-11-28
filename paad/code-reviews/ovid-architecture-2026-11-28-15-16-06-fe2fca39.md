# Agentic Code Review: ovid/architecture

* **Date:** 2026-11-28 15:16:06
* **Model:** claude-opus-5-5
* **PAAD version:** 2.1.0
* **Branch:** ovid/architecture -> main
* **Commit:** fe2fca394077f486d08692eccc8073065ef6fcf4
* **Files changed:** 21 | **Lines changed:** +745 / -344
* **Diff size category:** Large

## Executive Summary

The branch does what it says: every cargo and hidden-cargo write now goes through its owner with a new array, and the dialogue engine gets a bound, named API instead of the coordinator. No critical or important issues survived verification. Twelve specialists checked the risky parts and found them correct: `DIALOGUE_API` matches every engine call one for one, nothing keeps a stale hold reference now that holds are replaced, and the whole suite passes (511 files, 4913 tests). The six remaining in-scope findings are suggestions: docs and claims that run ahead of the code, one dev-tool stacking bug, and one test that doesn't assert its own steps.

## Critical Issues

None found.

## Important Issues

None found.

## Suggestions

- **[S1]** `src/game/state/capabilities.js:385-415` and `:10-13`. The `MissionCapabilities` typedef lacks the new `updateCargo` and `updateHiddenCargo` capabilities (added at `game-coordinator.js:398-400`, used by `mission.js` `acceptMission` and `removeMissionCargo`). The STATE OWNERSHIP MODEL header still says "Managers mutate through these references", which is the pattern this branch bans for cargo. Add both typedef entries and say cargo and hidden cargo are replaced through their owners. Found by Spec Compliance and Contract & Integration (`claude-opus-5-5`). Confidence: Medium.
- **[S2]** `paad/architecture-reviews/2026-11-27-tramp-freighter-architecture-report.md:223`. The F-5 "Still open" text lists two live-root capabilities (outcome, encounter trigger). Two more also return `() => this.state`: InfoBrokerManager `getGameState` (`game-coordinator.js:291`) and EventEngineManager `getGameState` (`:427`). The same paragraph calls InfoBroker's accessor "read-only". List all four and drop "read-only". Found by Spec Compliance (`claude-opus-5-5`). Confidence: Medium.
- **[S3]** `tests/unit/dialogue-api-narrow.test.js:4-5` (and the F-5 status text). The comment says the engine "cannot reach the live state root or write slices it has no business with". But `getPlayer`, `getShip` and `getNPCState` return live records, so a write like `getPlayer().credits = …` would skip `updateCredits`, `markDirty` and the event. Reword it to "no route to the coordinator or the state root", or hand out copies or narrower getters. The NPC-write half is already in `docs/backlog.md` ("The dialogue engine writes NPC state itself"). Found by Logic & Correctness (`claude-opus-5-5`). Confidence: Medium.
- **[S4]** `src/features/dev-admin/DevAdminPanel.jsx:288-294`. The rewritten `addTo` matches stacks by `good` only and spreads the matched stack, so dev-added cargo merges into a mission stack. It inherits the stack's `missionId` (making it unsellable and removed when the mission ends) and its `buyPrice`. `ShipManager.addToCargoArray` matches on good, buyPrice and missionId. The good-only match predates the branch, but the branch rewrote this block. Copy the hold and use `game.addToCargoArray(copy, newCargoItem, qty)`. Found by Logic & Correctness and Contract & Integration (`claude-opus-5-5`). Confidence: Medium.
- **[S5]** `tests/unit/cargo-writes-replace-not-mutate.test.js:37-61`. The test never checks whether its operations succeed. The only things it asserts are `announced.length > 8` and that each announced hold still equals its copy. If `moveToHiddenCargo(freight, 1)` fails, or `freight` is -1, `completeMission` takes only the regular-hold branch, so the new MissionManager → `updateHiddenCargo` path goes untested while the test still passes. Assert `.success` on each call, check `freight >= 0`, and check that `completeMission` announces a hidden hold. Found by Error Handling (`claude-opus-5-5`). Confidence: Medium.
- **[S6]** `src/game/state/game-coordinator.js:251-253`. The `dialogueApi` methods are bound once when the game is built, so a later `vi.spyOn(game, '<name>')` or reassignment of a listed method is invisible to the dialogue path. Before, every call was looked up on the coordinator. No test or src does this today, so it is latent. Use lazy wrappers `(...args) => this[name](...args)` with a `typeof` check at construction, or document the binding. Found by Contract & Integration (`claude-opus-5-5`). Confidence: Medium.

## Out of Scope

> **Handoff instructions for any agent processing this report:** The findings below are
> pre-existing bugs that this branch did not cause or worsen. Do **not** assume they
> should be fixed on this branch, and do **not** assume they should be skipped.
> Instead, present them to the user **batched by tier**: one ask for all out-of-scope
> Critical findings, one ask for all Important, one for Suggestions. For each tier, the
> user decides which (if any) to address. When you fix an out-of-scope finding, remove
> its entry from the backlog that holds it by ID — `paad/code-reviews/backlog.md`, or
> `paad/security/backlog.md` when this is the security report. Per project config
> (`paad/config/paad.md`), each is also recorded in `docs/backlog.md`; remove that entry too.

### Out-of-Scope Critical

None found.

### Out-of-Scope Important

None found.

### Out-of-Scope Suggestions

- **[OOSS1]** backlog id: `d46ce9df`. `src/game/game-trading.js:535-545`. `TradingSystem.removeFromCargoStack` shallow-copies the array but decrements `qty` on the original stack, so it edits any hold it is given in place. Only tests call it. `sellGood` keeps its own copy of the logic. Make it return a new stack and call it from `sellGood`, or delete it and its tests. Found by Contract & Integration and Spec Compliance (`claude-opus-5-5`). Backlog status: new.
- **[OOSS2]** backlog id: `c79b2f70`. `src/features/dev-admin/DevAdminPanel.jsx:75`. The panel reads `game.getHiddenCargo()` during render without subscribing to `HIDDEN_CARGO_CHANGED`, so its hidden-cargo list goes stale after a hidden-cargo write. Use `useGameEvent(EVENT_NAMES.HIDDEN_CARGO_CHANGED) ?? []`. Found by Logic & Correctness (`claude-opus-5-5`). Backlog status: new.

## Review Metadata

- **Agents dispatched:** Logic & Correctness: findings (2: A 2, B 1, merged); Error Handling & Edge Cases: findings (1: A 1, B 0); Contract & Integration: findings (4: A 3, B 1); Concurrency & State: findings (0, both instances); Security: bailed: security no-boundary (both instances); Spec Compliance: findings (6: A 3, B 3). Large diff, so two instances of each lens: partition A (cargo path: DevAdminPanel, game-coordinator, mission, ship, trading, cargo tests, state-readers test), partition B (dialogue path: game-dialogue, dialogue manager, capabilities, game-coordinator, ownership safety-net test, dialogue tests, docs). 12 dispatches.
- **Scope:** 21 changed files, plus these adjacent files traced one level from the diff's callers and callees: `src/game/state/managers/state.js` (updateCargo), `npc.js` (storeCargo/retrieveCargo via addToCargoArray), `outcome.js` (cargo writes, clearHiddenCargo), `inspection.js` (hidden-cargo reads), `quest-manager.js`, `base-manager.js`, `src/game/state/state-validators.js` (hiddenCargo migrations), `src/game/game-trading.js`, `src/features/trade/TradePanel.jsx` and `src/features/danger/InspectionPanel.jsx` (HIDDEN_CARGO_CHANGED subscribers), `src/game/data/dialogue-trees.js` and dialogue data files, `src/hooks/useGameEvent.js`, `tests/test-utils.js` (createTestGame).
- **Raw findings:** 15 (before verification)
- **Verified findings:** 8 (after verification)
- **Filtered out:** 7. Five merged as duplicates (SA-2/SA-3/CA-1, CA-3/LA-1, SA-1/CA-2). Two rejected: SB-2 (DIALOGUE_API matches the engine's calls exactly, so the remaining concern is speculative) and SB-3 (the "around lines 333-339" citation is close enough).
- **Out-of-scope findings:** 2 (Critical: 0, Important: 0, Suggestion: 2)
- **Out-of-scope additions:** 0
- **Backlog:** 2 new entries added, 0 re-confirmed (see `paad/code-reviews/backlog.md`; also recorded in `docs/backlog.md` per `paad/config/paad.md`)
- **Steering files consulted:** CLAUDE.md, DEVELOPMENT.md, paad/config/paad.md
- **Intent sources consulted:** recent commit messages (0edcccb4, 17d54438, df2e09ed), the F-5 section of `paad/architecture-reviews/2026-11-27-tramp-freighter-architecture-report.md`, `docs/backlog.md`, `paad/logs/rethink.md`
- **Verifier warnings:** none
