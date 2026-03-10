# Test Suite Speed Optimization Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce test suite wall-clock time by switching pure-logic tests to node environment and consolidating duplicate test files.

**Architecture:** Two independent optimizations. Phase 1 changes vitest config to use `node` environment for `.test.js` files (with 4 exceptions), eliminating jsdom overhead for 282 files. Phase 2 consolidates 6 groups of duplicate/incremental "coverage gaps" test files into single files per module.

**Tech Stack:** Vitest, jsdom, fast-check

---

## Phase 1: Switch Pure Logic Tests to Node Environment

### Background

Current state: ALL 395 test files use jsdom (222s cumulative environment overhead). Only 113 files actually need jsdom:
- ~109 `.test.jsx` files (React component tests)
- 4 `.test.js` files with direct DOM usage

The 282 remaining `.test.js` files are pure game logic and work perfectly in node environment (validated: environment time drops from ~0.56s/file to 0ms/file).

### Task 1: Update vitest config to use environmentMatchGlobs

**Files:**
- Modify: `vitest.config.js`

**Step 1: Edit vitest.config.js**

Change the test config to default `.test.js` files to node, keeping jsdom for `.test.jsx` and 4 specific `.test.js` files:

```js
test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['**/*.test.jsx', 'jsdom'],
      ['tests/property/hud-condition-bar-*.property.test.js', 'jsdom'],
      ['tests/unit/modal-dialog.test.js', 'jsdom'],
    ],
    setupFiles: './tests/setup.js',
    exclude: [...configDefaults.exclude, '**/.worktrees/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**'],
      exclude: ['node_modules/', 'tests/', '*.config.js', 'dist/'],
    },
    reporters: ['default'],
  },
```

**Step 2: Run full test suite**

Run: `npm test`
Expected: All 395 tests files pass, 4158 tests pass

**Step 3: Verify speed improvement**

Run: `time npm test`
Compare environment time in vitest output to baseline (222.26s).

**Step 4: Fix any failures**

If any `.test.js` files fail because they secretly depend on jsdom:
- Add them to the `environmentMatchGlobs` jsdom list, OR
- Add `// @vitest-environment jsdom` comment to the top of the file

**Step 5: Commit**

```
git add vitest.config.js
git commit -m "Switch pure-logic tests to node environment for faster execution"
```

---

## Phase 2: Consolidate Duplicate Test Files

### Approach

For each group: merge all tests from satellite files into the base file, remove exact/near duplicates, delete satellite files, run tests to verify no coverage loss.

**Key rule:** When in doubt, KEEP the test. Only remove tests that are provably identical (same setup, same assertions, same edge case). "Similar" is not "duplicate."

### Task 2: Consolidate Trading System tests

**Files:**
- Modify: `tests/unit/game-trading.test.js` (base — receives merged tests)
- Delete: `tests/unit/game-trading-coverage.test.js`
- Delete: `tests/unit/game-trading-coverage2.test.js`

**What to merge from game-trading-coverage.test.js (ALL UNIQUE):**
- `getTechModifier computation` (8 tests)
- `getTemporalModifier computation` (7 tests)
- `getLocalModifier computation` (8 tests)
- `calculateCargoUsed edge cases` (3 tests)
- `calculateCargoValue` (8 tests)
- `calculateCargoTotals` (8 tests)
- `validatePurchase` (6 tests)
- `validateSale` (6 tests)
- `addCargoStack (deprecated)` (9 tests)
- `removeFromCargoStack` (7 tests)

**What to merge from game-trading-coverage2.test.js (UNIQUE ONLY):**
- `calculatePrice` (7 tests) — UNIQUE
- `calculateTechLevel` (4 tests) — UNIQUE
- `getEventModifier` (6 tests) — UNIQUE
- DROP `recordCargoPurchase` (5 tests) — EXACT DUPLICATE of base file
- DROP `getTechModifier edge cases` (3 tests) — SUBSET of coverage file
- DROP `getTemporalModifier edge cases` (3 tests) — SUBSET of coverage file
- DROP `getLocalModifier edge cases` (2 tests) — SUBSET of coverage file

**Steps:**
1. Read all three files fully
2. Create consolidated file with all unique tests, organized by method
3. Delete the two coverage files
4. Run: `npm test -- tests/unit/game-trading.test.js`
5. Run: `npm test` (full suite to catch import issues)
6. Commit: `git commit -m "Consolidate trading system tests into single file"`

### Task 3: Consolidate Mission Manager tests

**Files:**
- Modify: `tests/unit/mission-manager.test.js` (base)
- Delete: `tests/unit/mission-manager-coverage.test.js`
- Delete: `tests/unit/mission-manager-gaps.test.js`
- Delete: `tests/unit/mission-manager-remaining-gaps.test.js`

**What to merge from mission-manager-coverage.test.js (ALL UNIQUE):**
- `completeMission` paths (delivery/fetch/intel/passenger, 10+ tests)
- `calculatePassengerPayment` (3 tests)
- `updatePassengerSatisfaction` (6 tests)
- `modifyAllPassengerSatisfaction` (3 tests)
- `failMissionsDueToCargoLoss` (3 tests)
- `checkMissionDeadlines` (5 tests)
- `getCompletableMissions` (8 tests)
- `abandonMission` (3 tests)
- `dismissMissionFailureNotice` (3 tests)

**What to merge from mission-manager-gaps.test.js (UNIQUE ONLY):**
- `completeMission delivery with missionCargo missing` — UNIQUE
- `completeMission delivery with legacy cargo insufficient` — UNIQUE
- `completeMission removes missionCargo from hold` — UNIQUE
- `completeMission with legacy cargo removal` — UNIQUE
- `refreshMissionBoard` (3 tests) — UNIQUE
- `getCompletableMissions with missionCargo` (3 tests) — UNIQUE
- DROP `completeMission cole source rep reward` — NEAR DUPLICATE of coverage file
- DROP `completeMission karma reward` — NEAR DUPLICATE of coverage file
- DROP `abandonMission with penalties` — OVERLAP with coverage file
- DROP `checkMissionDeadlines with penalties` — PARTIALLY REDUNDANT
- DROP `failMissionsDueToCargoLoss` (2 tests) — SUBSET of coverage file
- DROP `updatePassengerSatisfaction` (4 tests) — SIMILAR to coverage file

**What to merge from mission-manager-remaining-gaps.test.js (UNIQUE ONLY):**
- `acceptMission cargo space check for missionCargo` (2 tests) — UNIQUE
- `completeMission delivery with no missionCargo and no legacy cargo` — UNIQUE
- `completeMission fetch with no cargo requirements` — UNIQUE
- `completeMission intel with giverSystem undefined` — UNIQUE
- `refreshMissionBoard generates fresh board with pruned history` (3 tests) — UNIQUE
- `getCompletableMissions delivery with no cargo` — UNIQUE
- `getCompletableMissions fetch with no cargo requirements` (2 tests) — UNIQUE
- `completeMission fetch with giverSystem undefined` — UNIQUE
- `completeMission removes legacy cargo for fetch missions` — UNIQUE
- DROP `calculatePassengerPayment satisfaction thresholds` (5 tests) — SUBSET of coverage file

**Steps:**
1. Read all four files fully
2. Create consolidated file organized by method (acceptMission, completeMission, calculatePassengerPayment, etc.)
3. Delete the three satellite files
4. Run: `npm test -- tests/unit/mission-manager.test.js`
5. Run: `npm test`
6. Commit: `git commit -m "Consolidate mission manager tests into single file"`

### Task 4: Consolidate Mission Generator tests

**Files:**
- Modify: `tests/unit/mission-generator.test.js` (base)
- Delete: `tests/unit/mission-generator-coverage.test.js`
- Delete: `tests/unit/mission-generator-gaps.test.js`

**What to merge from mission-generator-coverage.test.js:**
- `getReachableSystems` (3 tests) — UNIQUE
- `generateCargoRun` — keep only tests not already in base
- `generatePassengerMission` (3+ tests) — UNIQUE

**What to merge from mission-generator-gaps.test.js:**
- `generateCargoRun destStar fallback` — UNIQUE
- `generateCargoRun cargo label formatting` — UNIQUE
- `generateCargoRun full return object` (2 tests) — UNIQUE
- `generatePassengerMission full coverage` — UNIQUE
- DROP any tests that overlap with base or coverage files (verify by checking identical assertions)

**Steps:**
1. Read all three files fully
2. Create consolidated file
3. Delete the two satellite files
4. Run: `npm test -- tests/unit/mission-generator.test.js`
5. Run: `npm test`
6. Commit: `git commit -m "Consolidate mission generator tests into single file"`

### Task 5: Consolidate Ship Manager tests

**Files:**
- Modify: `tests/unit/ship-manager.test.js` (base)
- Delete: `tests/unit/ship-manager-coverage.test.js`

**Note:** These files are complementary (base covers naming/quirks, coverage covers upgrades/cargo). Merge all from coverage into base — no duplicates expected.

**Steps:**
1. Read both files fully
2. Append coverage tests into base file
3. Delete coverage file
4. Run: `npm test -- tests/unit/ship-manager.test.js`
5. Run: `npm test`
6. Commit: `git commit -m "Consolidate ship manager tests into single file"`

### Task 6: Consolidate Event System tests

**Files:**
- Modify: `tests/unit/game-events-trigger.test.js` → rename/consolidate as `game-events.test.js`
- Delete: `tests/unit/game-events-trigger-coverage.test.js`
- Delete: `tests/unit/game-events-coverage.test.js`

**Merge plan:**
- `game-events-trigger.test.js`: event trigger paths (3 tests) — KEEP ALL
- `game-events-trigger-coverage.test.js`: detailed trigger scenarios (7+ tests) — KEEP UNIQUE
- `game-events-coverage.test.js`: `isSystemEligible` (9+ tests) — KEEP ALL (unique concern)
- Check for overlapping eligibility tests between files

**Steps:**
1. Read all three files fully
2. Create consolidated `game-events.test.js` with sections: System Eligibility, Event Triggering, Event Lifecycle
3. Delete original three files
4. Run: `npm test -- tests/unit/game-events.test.js`
5. Run: `npm test`
6. Commit: `git commit -m "Consolidate event system tests into single file"`

### Task 7: Consolidate NPC Dialogue greeting/coverage tests

**Files:**
- Modify: `tests/unit/npc-dialogue-coverage-gaps.test.js` → consolidate into `npc-dialogue-greetings.test.js`
- Delete: `tests/unit/dialogue-npc-greeting-coverage.test.js`

**Note:** `dialogue-tree-structure.test.js` stays separate — it tests structural validity (all nodes reachable, required nodes exist) which is a different concern from greeting behavior.

**Merge plan:**
- `npc-dialogue-coverage-gaps.test.js`: NPC-specific greeting behavior — KEEP ALL UNIQUE
- `dialogue-npc-greeting-coverage.test.js`: karma commentary, faction appreciation, loan reminders, action callbacks — KEEP UNIQUE, DROP overlapping greeting tests

**Steps:**
1. Read both files fully
2. Create consolidated file organized by NPC
3. Delete `dialogue-npc-greeting-coverage.test.js`
4. Rename if desired: `npc-dialogue-coverage-gaps.test.js` → `npc-dialogue-greetings.test.js`
5. Run: `npm test -- tests/unit/npc-dialogue-greetings.test.js`
6. Run: `npm test`
7. Commit: `git commit -m "Consolidate NPC dialogue greeting tests into single file"`

### Task 8: Final verification

**Steps:**
1. Run: `time npm test` — capture full timing
2. Compare to baseline: 59.27s wall clock, 222.26s environment, 131.82s tests
3. Verify: same test count (minus removed duplicates) with all passing
4. Commit any final fixes

---

## Expected Results

**Phase 1 (node environment):** ~10-20% wall-clock improvement (environment overhead eliminated for 282 files)

**Phase 2 (consolidation):** ~15 fewer test files, saving ~15 file-level setup/environment cycles. Additional wall-clock improvement of 2-5%.

**Combined:** Expect wall-clock time to drop from ~60s to ~45-50s. The CPU savings will be more dramatic (environment phase dropping from 222s to ~80s).

**Test count:** Should drop by 30-50 tests (removed duplicates), with zero loss of meaningful coverage.
