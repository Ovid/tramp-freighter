# Agentic Code Review: ovid/architecture

* **Date:** 2026-11-27 13:37:27
* **Model:** Opus 5.5 (`claude-opus-5-5`)
* **PAAD version:** 2.1.0
* **Branch:** ovid/architecture -> main
* **Commit:** 51bb4c1fb9bad9201c913a4de1d468af231c6146
* **Files changed:** 57 | **Lines changed:** +3366 / -1157
* **Diff size category:** Large

## Executive Summary

The F-1 through F-4 architecture fixes look sound. No Critical or Important bugs were found. Outcome application, combat odds, save-load error tracking and encounter emission all match the old behaviour, except for the changes the architecture report records as deliberate, and the specialists' targeted test runs passed. Eight Suggestions remain. Two are real behaviour changes that are not documented: after a jump, a low-fuel or hull warning is now suppressed more often; and dev teleport no longer rolls encounters. The rest are an incomplete F-3 cleanup in `NegotiationPanel` and stale documentation. Confidence is moderate to high.

## Critical Issues

None found.

## Important Issues

None found.

## Suggestions

- **[S1]** `src/game/state/managers/encounter-trigger.js:61-69` (`completeJump`)
  - Logic: the condition fallback (e.g. `cond_low_fuel`, `cond_hull_damage`) now runs only when *both* the time check and the jump check find nothing.
  - The old hook ran it separately for each trigger, so it was lost only when both fired. Now a pirate, inspection or time narrative on arrival hides the low-fuel warning.
  - This is not in the F-2 status and no test covers it.
  - Fix: run the fallback whenever `!jumpEvent`, dispatching it after `timeEvent`. Or document the change and pin it with a test.
  - Found by: Logic & Correctness, Spec Compliance (`claude-opus-5-5`). Confidence: Medium.
- **[S2]** `src/game/state/game-coordinator.js:1725-1727` (`devTeleport`), called from `src/features/dev-admin/DevAdminPanel.jsx:650-652`
  - Contract: teleport no longer runs jump encounter or narrative checks, because the deleted `LOCATION_CHANGED` subscriber was what gave it that behaviour.
  - It is dev-only and undocumented.
  - Fix: call `this.completeJump(systemId)` after `updateLocation`, or record the change as intended.
  - Found by: Contract & Integration, Spec Compliance (`claude-opus-5-5`). Confidence: Medium.
- **[S3]** `docs/backlog.md:207-216, 218-225, 249-255, 305-320, 334-339`
  - Four entries added on this branch are now fixed by it:
    - Continue after a rejected save (F-1)
    - combat odds mismatch (F-3)
    - salvage stack mutation (F-4)
    - post-credits jump check at Sol (F-2)
  - Two entries cite deleted files:
    - `useEventTriggers.js`: now `EncounterTriggerManager.generateEncounter`
    - `applyEncounterOutcome.js`: the kidnap issue is still real, at `outcome.js:134-143`
  - Fix: remove the four resolved entries and repoint the two paths.
  - Found by: Logic & Correctness, Contract & Integration, Spec Compliance (`claude-opus-5-5`). Confidence: High.
- **[S4]** `src/features/danger/NegotiationPanel.jsx:41-45, 411-462`
  - Spec (F-3): `NegotiationPanel` still runs its own `calculateNegotiationProbabilities` beside `NegotiationManager.getNegotiationOdds` (`negotiation.js:383-398`).
  - The panel uses a hard-coded `?? 0.0005` fallback and adds karma only when it exceeds 0.001.
  - The difference is currently invisible after rounding, but it will drift, and the F-3 status claim "compute every chance once" is not true.
  - Fix: make `getNegotiationOdds` return `{finalChance, modifiers}`, read it in the panel, and delete the local copy. Or narrow the F-3 status reason.
  - Found by: Spec Compliance (`claude-opus-5-5`). Confidence: High.
- **[S5]** `src/game/state/managers/save-load.js:170-176`, rendered at `src/features/title-screen/TitleScreen.jsx:63-68`
  - Error handling: the `catch` branch stores raw `error.message`, so the player can see engine-internal text such as a TypeError, and a message ending in a period produces "..".
  - Fix: store a fixed player-facing string here. `handleLoadError` already logs the error.
  - Found by: Error Handling (`claude-opus-5-5`). Confidence: Medium.
- **[S6]** `src/features/danger/CombatPanel.jsx:38, 48-54` and `src/features/danger/PirateEncounterPanel.jsx:39, 53-63`
  - Contract: the odds `useMemo` depends on `ENGINE_CHANGED`, which nothing in `src/` emits. The new comment promises a refresh "whenever the ship… changes", and that promise is not kept for engine changes.
  - The dead dependency predates the branch, but the branch added the comment.
  - Fix: depend on `SHIP_CONDITION_CHANGED` instead, or have `updateShipCondition` emit the per-component events. `MechanicalFailurePanel.jsx:27` relies on the same dead event.
  - Found by: Contract & Integration (`claude-opus-5-5`). Confidence: Medium.
- **[S7]** `DEVELOPMENT.md:242`
  - Spec/steering: the doc still says other corruption "returns `null`, which the initialization path treats as 'no save'". After F-1, a rejected load records `getLoadError()`, and the title screen hides Continue and shows the reason.
  - Fix: update the save-system section.
  - Found by: Spec Compliance (`claude-opus-5-5`). Confidence: High.
- **[S8]** `src/game/state/capabilities.js` (file scope)
  - Spec/steering: there are no `EncounterTriggerCapabilities` or `OutcomeCapabilities` typedefs, although `DEVELOPMENT.md:24` and `:206` say this file holds every manager's capability interface.
  - Fix: add both typedefs.
  - Found by: Spec Compliance (`claude-opus-5-5`). Confidence: Medium.

## Review Metadata

- **Agents dispatched:** Logic & Correctness: findings (2: A=2, B=0) | Error Handling & Edge Cases: findings (1: A=1, B=0) | Contract & Integration: findings (3: A=2, B=1) | Concurrency & State: findings (0) | Security: findings (0; A clean, B `bailed: security no-boundary`) | Spec Compliance: findings (6: A=5, B=1). Large diff, so each lens ran as 2 instances.
  - Partition A: encounter triggering, jump, save/load and title screen (F-1, F-2).
  - Partition B: combat odds, outcome application and encounter orchestration (F-3, F-4).
  - 12 specialist dispatches and 1 Verifier.
- **Scope:** the 57 changed files, plus adjacent files traced in Phase 1 steps 6-8:
  - Callees and subscribers of `EncounterTriggerManager`:
    - `src/game/state/managers/{event-engine,danger,mechanical-failure,distress,event-system,quest-manager,base-manager}.js`
    - `src/game/data/{narrative-events,danger-events}.js`
  - The `getShipEngine` capability: `src/game/state/capabilities.js`
  - Consumers of the `ENCOUNTER_TRIGGERED` / `NARRATIVE_EVENT_TRIGGERED` events: `src/hooks/useGameEvent.js`, `src/features/dev-admin/DevAdminPanel.jsx`
  - Callers of `executeJump`: `src/features/navigation/SystemPanel.jsx`, `src/hooks/useNavigationActions.js`
  - Callees of `loadGame`: the save-storage utilities
  - Sibling encounter panels in `src/features/danger/`, which feed outcomes into `useEncounterOrchestration`
- **Raw findings:** 12 (before verification)
- **Verified findings:** 8 (after verification)
- **Filtered out:** 4. All 4 were duplicates merged into S1, S2 and S3. NegotiationPanel was downgraded from Important to Suggestion because the drift is not visible after rounding.
- **Out-of-scope findings:** 0 (Critical: 0, Important: 0, Suggestion: 0)
- **Out-of-scope additions:** 0
- **Backlog:** 0 new entries added, 0 re-confirmed (see `paad/code-reviews/backlog.md`)
- **Steering files consulted:** CLAUDE.md, DEVELOPMENT.md, paad/config/paad.md
- **Intent sources consulted:**
  - `paad/architecture-reviews/2026-11-27-tramp-freighter-architecture-report.md` (F-1 to F-4 and their status reasons)
  - recent commit messages (`main..HEAD`)
  - the branch name
  - `paad/config/fix-architecture.md`
  - `paad/logs/rethink.md`
- **Verifier warnings:** none
