# Deep Code Review: ovid/miscellaneous-nits

**Date:** 2026-03-13 07:29:36
**Branch:** ovid/miscellaneous-nits -> main
**Commit:** 9c6ffe856862be2d32570de132f97324ab780904
**Files changed:** 28 | **Lines changed:** +2148 / -39
**Diff size category:** Large

## Executive Summary

The branch implements 4 independent gameplay features: orbit-only visit tracking, Cole early repayment fee, Tanaka quest in mission slots, and a star finder dropdown. Code is well-structured and follows TDD with clean commits. One important bug was found unanimously by all 6 specialist reviewers: `recalculatePricesForKnownSystems` silently overwrites orbit-only `priceKnowledge` entries with real prices on the next day tick, undermining the core orbit-only tracking feature. Three additional important issues were identified. Overall confidence in findings is high.

## Critical Issues

None found.

## Important Issues

### [I1] `recalculatePricesForKnownSystems` overwrites orbit-only entries with real prices
- **File:** `src/game/state/managers/trading.js:340-362`
- **Bug:** `recalculatePricesForKnownSystems()` iterates all entries in `priceKnowledge` and unconditionally sets `prices = newPrices` (line 360). Orbit-only entries created with `prices: null, source: 'orbit'` get real prices injected on the next day advance, even though the player never docked. The `source: 'orbit'` field is preserved but `prices` contradicts it.
- **Impact:** After one in-game day tick, orbit-only entries silently gain full price data. `getKnownSystemsSortedByStaleness` (which filters on `prices !== null`) starts including them in the market data display. Players get free price intelligence for any system they fly through, defeating the information broker's economic role. The "Visited but never docked" label appears alongside actual prices — contradictory UX.
- **Suggested fix:** Guard the loop to skip orbit-only entries:
  ```javascript
  if (system && ownState.priceKnowledge[systemId].prices !== null) {
  ```
- **Confidence:** High
- **Found by:** Logic, Error Handling, Contract, Concurrency, Security, Plan Alignment (all 6 specialists)

### [I2] Hardcoded magic numbers `3`, `5` in `getTanakaMissionDisplay` and `isTanakaQuestActive`
- **File:** `src/game/state/game-coordinator.js:1009,1011` and `src/game/state/managers/quest-manager.js:295`
- **Bug:** Progress strings use `/3 jumps` and `/5 samples` instead of `ENDGAME_CONFIG.STAGE_1_JUMPS` and `ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED`. `isTanakaQuestActive` uses `>= 5` instead of deriving from quest definition or `ENDGAME_CONFIG.VICTORY_STAGE - 1`.
- **Impact:** If quest objectives change in constants, the HUD display and active-check silently fall out of sync with the quest definition. Violates CLAUDE.md rule: "ALL magic numbers must go in `src/game/constants.js`."
- **Suggested fix:**
  ```javascript
  progress = `${questState.data.jumpsCompleted || 0}/${ENDGAME_CONFIG.STAGE_1_JUMPS} jumps`;
  progress = `${questState.data.exoticMaterials || 0}/${ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED} samples`;
  ```
  For `isTanakaQuestActive`, use `ENDGAME_CONFIG.VICTORY_STAGE - 1` or derive from quest definition.
- **Confidence:** High
- **Found by:** Logic, Error Handling

### [I3] CameraControls calls `game.getState()` directly — Bridge Pattern violation
- **File:** `src/features/navigation/CameraControls.jsx:31-32`
- **Bug:** `const gameState = game.getState()` reads `visitedSystems` directly from raw game state. CLAUDE.md states: "Components must NEVER call `GameCoordinator.getState()` directly." This is new code introduced in this branch.
- **Impact:** Architectural violation. The visited-systems data is read outside the Bridge Pattern. Currently works because `useGameEvent(EVENT_NAMES.LOCATION_CHANGED)` on line 22 triggers re-renders, but if that subscription is removed (it captures no return value, so looks unused), the visited checkmarks go stale.
- **Suggested fix:** Use `game.getVisitedSystems()` (already exposed on coordinator) or derive from the LOCATION_CHANGED event return value.
- **Confidence:** High
- **Found by:** Logic, Error Handling, Contract

### [I4] `cleanupOldIntelligence` deletes orbit-only entries after MAX_AGE days
- **File:** `src/game/game-information-broker.js:135-148` and `src/game/state/managers/trading.js:300-313`
- **Bug:** `incrementPriceKnowledgeStaleness` ages orbit-only entries normally (design doc confirms this is intentional). But `cleanupOldIntelligence` deletes any entry where `lastVisit > MAX_AGE` without exempting orbit-only entries. After ~100 game days, the orbit-only record is permanently deleted, losing the "visited but never docked" information.
- **Impact:** After enough time passes, the Info Broker reverts to showing "Never visited" for systems the player orbited. Combined with I1 (prices get injected first), orbit entries have a compound lifecycle problem: they gain prices they shouldn't have, then get deleted entirely.
- **Suggested fix:** Skip orbit-only entries in cleanup:
  ```javascript
  if (knowledge.lastVisit > INTELLIGENCE_CONFIG.MAX_AGE && knowledge.source !== 'orbit') {
  ```
- **Confidence:** Medium
- **Found by:** Logic, Contract

## Suggestions

- **[S1]** `FinancePanel.jsx:58` — `payAll` sends `Math.min(credits, debt)` without accounting for early repayment fee. Backend auto-corrects, so behavior is correct, but the onClick and button label diverge in their calculation approach. Consider aligning the payAll function with the fee-aware calculation shown in the button label. *(Found by: Logic, Error Handling, Contract, Concurrency, Security)*

- **[S2]** `state-validators.js:350` — Price validation `typeof knowledge.prices !== 'object'` passes null prices only because `typeof null === 'object'` in JavaScript. If anyone tightens this to `!knowledge.prices || ...`, orbit-only entries would fail validation. Make null explicitly accepted: `knowledge.prices !== null && typeof knowledge.prices !== 'object'`. *(Found by: Contract)*

- **[S3]** `FinancePanel.jsx:26-29` — `debtInfo` useMemo dependency array `[debt, finance, credits, getDebtInfo]` omits `currentDay`. If time advances while docked (emergency repair), `earlyRepaymentFeeRate` could be stale. Narrow edge case. Add `currentDay` to deps. *(Found by: Concurrency)*

- **[S4]** `MissionBoardPanel.jsx` — Calls `game.getEffectiveMissionCount()` but doesn't subscribe to `QUEST_CHANGED`. If Tanaka quest activates while panel is open, slot count won't update until panel re-renders for another reason. Effectively zero practical impact (quest activates via dialogue, not while mission board is open). *(Found by: Concurrency)*

- **[S5]** `FinancePanel.jsx:144` — Pay All button `disabled` condition doesn't account for fee. With very low credits (e.g., 1) and active fee, `payAllAmount` computes to 0 but button remains enabled. Player sees "Pay All (0)" and clicking produces an error. *(Found by: Error Handling)*

- **[S6]** `getTanakaMissionDisplay` does not show destination for stage 4, which the design doc specified as "Destination shown, no counter." Minor plan deviation. *(Found by: Plan Alignment)*

## Plan Alignment

- **Implemented:** All 4 planned features (orbit-only tracking, Cole early repayment fee, Tanaka quest in missions, star finder dropdown) across all 11 implementation plan tasks.
- **Not yet implemented:** None — all tasks completed.
- **Deviations:**
  - Stage 4 destination not shown in HUD (design doc specified it) — minor gap
  - Star finder uses checkmark-only visited indicator (no color coding) — known browser limitation, explicitly acknowledged in implementation plan
  - Stage 4 displays "Personal Request" (from quest definition) instead of "Deliver Message" (design doc paraphrase) — acceptable, code uses canonical data source

## Review Metadata

- **Agents dispatched:** Logic & Correctness, Error Handling & Edge Cases, Contract & Integration, Concurrency & State, Security, Plan Alignment (6 specialists + 1 verifier)
- **Scope:** 17 source files changed + callers/callees one level deep, 10 test files
- **Raw findings:** 11 (before verification)
- **Verified findings:** 10 (after verification)
- **Filtered out:** 1 (NaN guard — theoretically correct but practically unreachable)
- **Steering files consulted:** CLAUDE.md
- **Plan/design docs consulted:** docs/plans/2026-03-12-miscellaneous-nits-design.md, docs/plans/2026-03-12-miscellaneous-nits-implementation.md
