# Phase 5: Remove GameStateManager — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Delete the `GameStateManager` wrapper class and update all references to use `GameCoordinator` directly.

**Architecture:** `GameStateManager` is a thin wrapper that delegates everything to `GameCoordinator`. Production code (`main.jsx`) already instantiates `GameCoordinator` directly. The wrapper only exists for test compatibility. This phase removes the wrapper, updates ~154 test files, and cleans up backward-compat props.

**Tech Stack:** Vitest, React 18, ES Modules

**Note on BaseManager:** The design doc planned BaseManager removal in Phase 3 Batch 5, but it wasn't done. BaseManager (62 lines) now cleanly provides capability storage and logging for all 23 managers. Removing it would require modifying every manager file and their tests — high risk, low value. BaseManager stays. If removal is desired later, it should be its own focused task.

---

### Task 1: Update test-utils.js to use GameCoordinator

**Files:**
- Modify: `tests/test-utils.js`

**Step 1: Update import and function**

Change the import from `GameStateManager` to `GameCoordinator`, and rename the factory function. Keep a deprecated alias for the transition.

```js
// tests/test-utils.js — changes:
// Line 3: Change import
// OLD: import { GameStateManager } from '@game/state/game-state-manager.js';
// NEW: import { GameCoordinator } from '@game/state/game-coordinator.js';

// Lines 23-27: Rename function, keep alias
// OLD: export function createTestGameStateManager() {
//   const manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
// NEW: export function createTestGame() {
//   const manager = new GameCoordinator(TEST_STAR_DATA, TEST_WORMHOLE_DATA);

// Add deprecated alias at bottom:
// export const createTestGameStateManager = createTestGame;
```

**Step 2: Run tests to verify nothing breaks**

Run: `npm test`
Expected: All tests pass (the alias preserves backward compat)

**Step 3: Commit**

```
git add tests/test-utils.js
git commit -m "Phase 5: update test-utils to use GameCoordinator internally"
```

---

### Task 2: Update react-test-utils.jsx

**Files:**
- Modify: `tests/react-test-utils.jsx`

**Step 1: Update the wrapper to use `game` prop**

```jsx
// tests/react-test-utils.jsx — changes:
// Update JSDoc: replace GameStateManager references with GameCoordinator
// Line 28: Rename parameter from gameStateManager to game
// Line 31: Use game={game} instead of gameStateManager={gameStateManager}

// Result:
export function createWrapper(game) {
  return function Wrapper({ children }) {
    return (
      <GameProvider game={game}>
        {children}
      </GameProvider>
    );
  };
}
```

**Step 2: Run tests**

Run: `npm test`
Expected: All tests pass (GameProvider accepts both props, so this is safe)

**Step 3: Commit**

```
git add tests/react-test-utils.jsx
git commit -m "Phase 5: update react-test-utils to use game prop"
```

---

### Task 3: Update GameContext.jsx — remove backward compat

**Files:**
- Modify: `src/context/GameContext.jsx`

**Step 1: Remove gameStateManager prop and useGameState alias**

```jsx
// Remove gameStateManager from props destructuring (line 21)
// Remove the `|| gameStateManager` fallback (line 22)
// Remove the deprecated useGameState export (lines 53-56)
// Fix error message at line 47: "useGameState" → "useGame"

// Result:
export function GameProvider({ game, children }) {
  if (!game) {
    return (
      <div className="game-loading">
        <p>Loading game...</p>
      </div>
    );
  }

  return (
    <GameContext.Provider value={game}>{children}</GameContext.Provider>
  );
}

// Remove: export const useGameState = useGame;
```

**Step 2: Check for useGameState imports in source code**

Any source file importing `useGameState` must be updated to import `useGame` instead. Based on exploration, these exist in some test files.

**Step 3: Run tests**

Run: `npm test`
Expected: May fail if test files still pass `gameStateManager` prop. That's OK — Task 4 fixes those.

**Step 4: Commit (even if tests fail — this is part of a coordinated change)**

```
git add src/context/GameContext.jsx
git commit -m "Phase 5: remove backward-compat gameStateManager prop from GameProvider"
```

---

### Task 4: Mass-update test files — replace GameStateManager with GameCoordinator

This is the largest task. There are two categories of test files to update:

**Category A:** ~90 files that import `GameStateManager` directly from `game-state-manager.js` and use `new GameStateManager(...)`.

**Category B:** ~65 files that use `createTestGameStateManager()` from test-utils.js (these already work via the alias from Task 1, but should be renamed).

**Files:**
- Modify: ~154 test files across `tests/unit/`, `tests/property/`, `tests/integration/`

**Step 1: Script-replace direct GameStateManager imports and usages**

For all test files in Category A, apply these replacements:
1. `import { GameStateManager } from '../../src/game/state/game-state-manager.js'` → `import { GameCoordinator } from '../../src/game/state/game-coordinator.js'`
2. `import { GameStateManager } from '../../src/game/state/game-state-manager'` → `import { GameCoordinator } from '../../src/game/state/game-coordinator.js'`
3. `import { GameStateManager } from '@game/state/game-state-manager.js'` → `import { GameCoordinator } from '@game/state/game-coordinator.js'`
4. `new GameStateManager(` → `new GameCoordinator(`
5. Variable names: `gameStateManager` → `game` (only where used as local variable holding the instance — use judgment, some tests pass it to `createWrapper`)

For the `createWrapper` calls, since Task 2 renamed the parameter, callers just pass the same object. No change needed for those call sites.

**Step 2: Rename createTestGameStateManager to createTestGame**

For all test files in Category B:
1. `import { createTestGameStateManager }` → `import { createTestGame }`
2. `createTestGameStateManager()` → `createTestGame()`

**Step 3: Update any useGameState imports in test files**

Replace `import { useGameState }` with `import { useGame }` and update call sites.

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```
git add tests/
git commit -m "Phase 5: replace all GameStateManager references with GameCoordinator in tests"
```

---

### Task 5: Delete game-state-manager.js and remove deprecated alias

**Files:**
- Delete: `src/game/state/game-state-manager.js`
- Modify: `tests/test-utils.js` (remove the deprecated alias)

**Step 1: Delete the wrapper file**

Remove `src/game/state/game-state-manager.js` entirely.

**Step 2: Remove deprecated alias from test-utils.js**

Remove the line: `export const createTestGameStateManager = createTestGame;`

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass (no file imports game-state-manager.js anymore)

**Step 4: Commit**

```
git add -u
git commit -m "Phase 5: delete GameStateManager wrapper class"
```

---

### Task 6: Update JSDoc comments and documentation

**Files to update** (comment-only changes — replace "GameStateManager" with "GameCoordinator" in JSDoc/comments):
- `src/hooks/useGameEvent.js` (lines 6, 19)
- `src/hooks/useGameAction.js` (line 5)
- `src/App.jsx` (line 62)
- `src/features/navigation/StarMapCanvas.jsx`
- `src/features/hud/ResourceBar.jsx`
- `src/features/dialogue/DialoguePanel.jsx`
- `src/features/station/StationMenu.jsx`
- `src/features/hud/ShipStatus.jsx`
- `src/game/game-dialogue.js`
- `src/game/game-navigation.js`
- `src/game/game-npcs.js`
- `src/features/refuel/refuelUtils.js`
- `src/features/danger/applyEncounterOutcome.js`
- `src/features/ship-status/ShipStatusPanel.jsx`
- `src/features/hud/LocationDisplay.jsx`
- `src/features/hud/DateDisplay.jsx`
- `src/features/hud/QuickAccessButtons.jsx`
- `src/features/trade/TradePanel.jsx`
- `src/game/state/managers/save-load.js`
- `src/game/state/managers/event-system.js`
- `src/game/state/game-coordinator.js` (line 53)

Also update:
- `developer_docs/bridge-pattern.md` — update references
- `.github/copilot-instructions.md` — update references
- `DEVELOPMENT.md` — update references

**Step 1: Apply comment/JSDoc replacements**

In each file, replace references to `GameStateManager` with `GameCoordinator` in comments and JSDoc only (not code, which should already be updated).

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 3: Commit**

```
git add -u
git commit -m "Phase 5: update JSDoc and docs to reference GameCoordinator"
```

---

### Task 7: Update design doc and final verification

**Files:**
- Modify: `docs/plans/2026-03-08-gsm-refactor-design.md`

**Step 1: Mark Phase 5 complete in design doc**

Update the phase table to show Phase 5 as Complete with the plan file name.

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 3: Run build**

Run: `npm run build`
Expected: Clean build with no errors

**Step 4: Run lint and format**

Run: `npm run clean`
Expected: No issues (or fix any formatting issues)

**Step 5: Commit**

```
git add -u
git commit -m "Phase 5: mark complete in design doc"
```

---

## Execution Notes

**Parallelization:** Tasks 1-2 are independent and can run in parallel. Task 3 depends on Tasks 1-2 being committed. Task 4 is the bulk work and must follow Task 3. Tasks 5-6 are independent of each other but must follow Task 4. Task 7 is final.

**Risk:** The mass replacement in Task 4 is the highest-risk step. If tests fail after the replacement, investigate individual files — some may have unusual patterns (e.g., testing the wrapper itself in `game-coordinator.test.js`).

**BaseManager decision:** Intentionally NOT deleting BaseManager. It provides value (capability validation, logging) and all 23 managers extend it. Removal would be a separate, high-effort task with minimal benefit.
