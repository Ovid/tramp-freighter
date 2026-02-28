# restoreState() API Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `restoreState(rawState)` method on GameStateManager that is the single canonical path for restoring saved game state, replacing all direct `.state =` assignments from outside GSM.

**Architecture:** Extract the validate→migrate→defaults→assign→register→emit pipeline from SaveLoadManager into GameStateManager as `restoreState()`. SaveLoadManager becomes pure localStorage I/O that delegates to `restoreState()`. Shared helpers `_registerEventEngine()` and `_emitAllStateEvents()` eliminate duplication between `initNewGame()` and the restore path.

**Tech Stack:** Vitest, ES Modules, GameStateManager delegation pattern

---

### Task 1: Test restoreState() with valid current-version state

**Files:**
- Create: `tests/unit/restore-state.test.js`

**Step 1: Write the failing test**

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { GAME_VERSION } from '../../src/game/constants.js';

describe('GameStateManager.restoreState', () => {
  let manager;

  beforeEach(() => {
    localStorage.clear();
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('restores valid current-version state and returns success', () => {
    // Create a valid state by initializing a new game and capturing it
    manager.initNewGame();
    const validState = structuredClone(manager.state);

    // Reset manager state to simulate fresh start
    manager.state = null;

    const result = manager.restoreState(validState);

    expect(result.success).toBe(true);
    expect(result.state).toBeDefined();
    expect(manager.state).not.toBeNull();
    expect(manager.state.player.credits).toBe(validState.player.credits);
    expect(manager.state.meta.version).toBe(GAME_VERSION);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/restore-state.test.js`
Expected: FAIL with "manager.restoreState is not a function"

---

### Task 2: Implement restoreState() — minimal version for first test

**Files:**
- Modify: `src/game/state/game-state-manager.js`

**Step 1: Add imports for validation/migration functions**

At the top of `game-state-manager.js`, add after the existing imports:

```js
import {
  isVersionCompatible,
  validateStateStructure,
  migrateFromV1ToV2,
  migrateFromV2ToV2_1,
  migrateFromV2_1ToV4,
  migrateFromV4ToV4_1,
  migrateFromV4_1ToV5,
  addStateDefaults,
} from './state-validators.js';
```

**Step 2: Add restoreState() method**

Add after `initNewGame()` (around line 197):

```js
  /**
   * Restore game state from raw save data
   *
   * Single canonical path for state restoration. Validates, migrates,
   * adds defaults, assigns state, registers event engine, and emits
   * UI events.
   *
   * @param {Object} rawState - Raw state data (e.g., from localStorage parse)
   * @returns {{ success: boolean, state?: Object, reason?: string }}
   */
  restoreState(rawState) {
    if (!rawState) {
      return { success: false, reason: 'No state data provided' };
    }

    // Version compatibility check
    if (!isVersionCompatible(rawState.meta?.version)) {
      return {
        success: false,
        reason: `Incompatible save version: ${rawState.meta?.version}`,
      };
    }

    // Apply migration chain
    let migratedState = rawState;
    migratedState = this._applyMigrations(migratedState);

    // Validate structure
    if (!validateStateStructure(migratedState)) {
      return { success: false, reason: 'Save data failed structure validation' };
    }

    // Add defaults for missing fields
    migratedState = addStateDefaults(migratedState, this.starData);

    // Assign state
    this.state = migratedState;

    // Register event engine
    this._registerEventEngine();

    // Emit all state events for UI synchronization
    this._emitAllStateEvents(migratedState);

    devLog('State restored successfully');

    return { success: true, state: migratedState };
  }
```

**Step 3: Add _applyMigrations() private method**

```js
  /**
   * Apply version migration chain to raw state
   * @param {Object} state - State to migrate
   * @returns {Object} Migrated state
   * @private
   */
  _applyMigrations(state) {
    let migrated = state;

    if (migrated.meta.version === '1.0.0') {
      migrated = migrateFromV1ToV2(migrated, this.starData);
    }
    if (migrated.meta.version === '2.0.0') {
      migrated = migrateFromV2ToV2_1(migrated);
    }
    if (migrated.meta.version === '2.1.0') {
      migrated = migrateFromV2_1ToV4(migrated);
    }
    if (migrated.meta.version === '4.0.0') {
      migrated = migrateFromV4ToV4_1(migrated);
    }
    if (migrated.meta.version === '4.1.0') {
      migrated = migrateFromV4_1ToV5(migrated);
    }

    return migrated;
  }
```

**Step 4: Add _registerEventEngine() private method**

```js
  /**
   * Register narrative events, danger events, and quests with the event engine.
   * Shared by initNewGame() and restoreState().
   * @private
   */
  _registerEventEngine() {
    this.eventEngineManager.clearEvents();
    this.eventEngineManager.registerEvents(NARRATIVE_EVENTS);
    this.eventEngineManager.registerEvents(DANGER_EVENTS);
    ALL_QUESTS.forEach((quest) => this.questManager.registerQuest(quest));
  }
```

**Step 5: Add _emitAllStateEvents() private method**

This is the superset of both `emitInitialEvents` and `emitLoadedStateEvents`:

```js
  /**
   * Emit all state events for UI synchronization.
   * Shared by initNewGame() and restoreState().
   * @param {Object} state - Complete game state
   * @private
   */
  _emitAllStateEvents(state) {
    const { player, ship, world } = state;

    this.emit(EVENT_NAMES.CREDITS_CHANGED, player.credits);
    this.emit(EVENT_NAMES.DEBT_CHANGED, player.debt);
    this.emit(EVENT_NAMES.FUEL_CHANGED, ship.fuel);
    this.emit(EVENT_NAMES.CARGO_CHANGED, ship.cargo);
    this.emit(EVENT_NAMES.HIDDEN_CARGO_CHANGED, ship.hiddenCargo);
    this.emit(EVENT_NAMES.LOCATION_CHANGED, player.currentSystem);
    this.emit(EVENT_NAMES.TIME_CHANGED, player.daysElapsed);
    this.emit(EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED, world.priceKnowledge);
    this.emit(EVENT_NAMES.ACTIVE_EVENTS_CHANGED, world.activeEvents);
    this.emit(EVENT_NAMES.SHIP_CONDITION_CHANGED, {
      hull: ship.hull,
      engine: ship.engine,
      lifeSupport: ship.lifeSupport,
    });
    this.emit(EVENT_NAMES.UPGRADES_CHANGED, ship.upgrades);
    this.emit(EVENT_NAMES.CARGO_CAPACITY_CHANGED, ship.cargoCapacity);
    this.emit(EVENT_NAMES.QUIRKS_CHANGED, ship.quirks);
    this.emit(EVENT_NAMES.KARMA_CHANGED, player.karma || 0);
    this.emit(EVENT_NAMES.FACTION_REP_CHANGED, player.factions || {});
    if (player.finance) {
      this.emit(EVENT_NAMES.FINANCE_CHANGED, player.finance);
    }
    if (state.missions) {
      this.emit(EVENT_NAMES.MISSIONS_CHANGED, state.missions);
    }
    if (state.quests) {
      this.emit(EVENT_NAMES.QUEST_CHANGED, { ...state.quests });
    }
  }
```

**Step 6: Run test to verify it passes**

Run: `npm test -- tests/unit/restore-state.test.js`
Expected: PASS

**Step 7: Commit**

```bash
git add tests/unit/restore-state.test.js src/game/state/game-state-manager.js
git commit -m "feat: add restoreState() method to GameStateManager"
```

---

### Task 3: Test restoreState() failure cases

**Files:**
- Modify: `tests/unit/restore-state.test.js`

**Step 1: Write failing tests for rejection cases**

Add to the existing describe block:

```js
  it('rejects null input', () => {
    const result = manager.restoreState(null);
    expect(result.success).toBe(false);
    expect(result.reason).toContain('No state data');
  });

  it('rejects incompatible version', () => {
    const result = manager.restoreState({
      meta: { version: '99.0.0', timestamp: Date.now() },
    });
    expect(result.success).toBe(false);
    expect(result.reason).toContain('Incompatible save version');
  });

  it('rejects state that fails structure validation', () => {
    const result = manager.restoreState({
      meta: { version: GAME_VERSION, timestamp: Date.now() },
      player: { credits: 'not-a-number' },
    });
    expect(result.success).toBe(false);
    expect(result.reason).toContain('structure validation');
  });
```

**Step 2: Run tests to verify they pass (implementation already handles these)**

Run: `npm test -- tests/unit/restore-state.test.js`
Expected: PASS (all 4 tests)

**Step 3: Commit**

```bash
git add tests/unit/restore-state.test.js
git commit -m "test: add restoreState() failure case tests"
```

---

### Task 4: Test restoreState() migrates old versions

**Files:**
- Modify: `tests/unit/restore-state.test.js`

**Step 1: Write test for v1.0.0 migration**

```js
  it('migrates v1.0.0 state to current version', () => {
    const v1State = {
      player: { credits: 500, debt: 5000, currentSystem: 0, daysElapsed: 5 },
      ship: {
        name: 'Old Ship',
        fuel: 80,
        cargoCapacity: 50,
        cargo: [{ good: 'grain', qty: 10, purchasePrice: 15 }],
      },
      world: { visitedSystems: [0] },
      meta: { version: '1.0.0', timestamp: Date.now() },
    };

    const result = manager.restoreState(v1State);

    expect(result.success).toBe(true);
    expect(result.state.meta.version).toBe(GAME_VERSION);
    // v1 migration adds ship condition
    expect(result.state.ship.hull).toBeDefined();
    expect(result.state.ship.engine).toBeDefined();
    // v1 migration normalizes cargo field names
    expect(result.state.ship.cargo[0].buyPrice).toBe(15);
  });
```

**Step 2: Run test to verify it passes**

Run: `npm test -- tests/unit/restore-state.test.js`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/unit/restore-state.test.js
git commit -m "test: add restoreState() migration test for v1.0.0"
```

---

### Task 5: Test restoreState() emits UI events

**Files:**
- Modify: `tests/unit/restore-state.test.js`

**Step 1: Write test that verifies events are emitted**

```js
  it('emits UI state events after restore', () => {
    manager.initNewGame();
    const validState = structuredClone(manager.state);
    manager.state = null;

    const emittedEvents = [];
    const originalEmit = manager.emit.bind(manager);
    manager.emit = (eventType, data) => {
      emittedEvents.push(eventType);
      originalEmit(eventType, data);
    };

    manager.restoreState(validState);

    expect(emittedEvents).toContain('creditsChanged');
    expect(emittedEvents).toContain('fuelChanged');
    expect(emittedEvents).toContain('cargoChanged');
    expect(emittedEvents).toContain('locationChanged');
    expect(emittedEvents).toContain('shipConditionChanged');
  });
```

**Step 2: Run test to verify it passes**

Run: `npm test -- tests/unit/restore-state.test.js`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/unit/restore-state.test.js
git commit -m "test: verify restoreState() emits UI events"
```

---

### Task 6: Refactor initNewGame() to use shared helpers

**Files:**
- Modify: `src/game/state/game-state-manager.js`

**Step 1: Update initNewGame() to use _registerEventEngine() and _emitAllStateEvents()**

Replace `initNewGame()` body with:

```js
  initNewGame() {
    const completeState = this.initializationManager.createInitialState();

    this.state = completeState;

    this._registerEventEngine();

    devLog('New game initialized:', completeState);

    this._emitAllStateEvents(completeState);

    return completeState;
  }
```

**Step 2: Run full test suite to verify no regressions**

Run: `npm test`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/game/state/game-state-manager.js
git commit -m "refactor: initNewGame() uses shared _registerEventEngine and _emitAllStateEvents"
```

---

### Task 7: Refactor loadGame() on GSM to use restoreState()

**Files:**
- Modify: `src/game/state/game-state-manager.js`

**Step 1: Update loadGame() delegation**

Replace the current `loadGame()` method on GSM:

```js
  loadGame() {
    return this.saveLoadManager.loadGame();
  }
```

The event engine registration previously done here now lives inside `restoreState()`, which `SaveLoadManager.loadGame()` will call (next task).

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests PASS (SaveLoadManager.loadGame still does event registration internally for now)

**Step 3: Commit**

```bash
git add src/game/state/game-state-manager.js
git commit -m "refactor: simplify GSM loadGame() delegation"
```

---

### Task 8: Refactor SaveLoadManager.loadGame() to use restoreState()

**Files:**
- Modify: `src/game/state/managers/save-load.js`

**Step 1: Simplify loadGame()**

Replace the `loadGame()` method with:

```js
  loadGame() {
    try {
      const loadedState = loadGameFromStorage();

      if (!loadedState) {
        return null;
      }

      const result = this.gameStateManager.restoreState(loadedState);

      if (result.success) {
        return result.state;
      }

      this.log(result.reason);
      return null;
    } catch (error) {
      return this.handleLoadError(error);
    }
  }
```

**Step 2: Delete applyMigrations() method**

Remove the entire `applyMigrations()` method (lines ~191-219) — this logic is now in `GameStateManager._applyMigrations()`.

**Step 3: Delete emitLoadedStateEvents() method**

Remove the entire `emitLoadedStateEvents()` method (lines ~228-269) — this logic is now in `GameStateManager._emitAllStateEvents()`.

**Step 4: Update handleLoadError and attemptNPCRecovery to use restoreState()**

Replace `attemptNPCRecovery()`:

```js
  attemptNPCRecovery() {
    try {
      let recoveredState = loadGameFromStorage();
      if (recoveredState) {
        recoveredState.npcs = {};
        if (recoveredState.dialogue) {
          recoveredState.dialogue = {
            currentNpcId: null,
            currentNodeId: null,
            isActive: false,
            display: null,
          };
        }

        const result = this.gameStateManager.restoreState(recoveredState);
        if (result.success) {
          return result.state;
        }
      }
    } catch {
      this.log('Recovery failed, starting new game');
    }

    return null;
  }
```

**Step 5: Remove unused imports from save-load.js**

Remove from the import block:
- `GAME_VERSION` (no longer needed)
- `isVersionCompatible`
- `validateStateStructure`
- `migrateFromV1ToV2`
- `migrateFromV2ToV2_1`
- `migrateFromV2_1ToV4`
- `migrateFromV4ToV4_1`
- `migrateFromV4_1ToV5`
- `addStateDefaults`

Keep: `EVENT_NAMES` (if still used), `UI_CONFIG`, `SAVE_KEY`

The imports from `state-validators.js` are no longer needed since SaveLoadManager no longer does validation/migration directly.

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 7: Commit**

```bash
git add src/game/state/managers/save-load.js
git commit -m "refactor: SaveLoadManager delegates to restoreState() for validation and migration"
```

---

### Task 9: Simplify main.jsx

**Files:**
- Modify: `src/main.jsx`

**Step 1: Update initializeGameStateManager()**

Replace the function with:

```js
function initializeGameStateManager() {
  const navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);

  const gameStateManager = new GameStateManager(
    STAR_DATA,
    WORMHOLE_DATA,
    navigationSystem
  );

  // Try to load saved game through the manager's canonical restore path
  const loaded = gameStateManager.loadGame();

  if (loaded) {
    devLog('Game loaded from save');
  } else {
    gameStateManager.initNewGame();
    devLog('New game initialized');
  }

  return gameStateManager;
}
```

**Step 2: Remove the standalone loadGame import**

Remove this line from the imports:
```js
import { loadGame } from './game/state/save-load';
```

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/main.jsx
git commit -m "refactor: main.jsx uses manager.loadGame() instead of direct state assignment"
```

---

### Task 10: Clean up InitializationManager.emitInitialEvents()

**Files:**
- Modify: `src/game/state/managers/initialization.js`

Since `initNewGame()` now calls `_emitAllStateEvents()` on GSM directly, `emitInitialEvents()` on InitializationManager is no longer called. Verify and remove it.

**Step 1: Search for any remaining callers of emitInitialEvents**

Run: `grep -r "emitInitialEvents" src/`
Expected: No results (initNewGame no longer calls it)

**Step 2: Delete emitInitialEvents() method from InitializationManager**

Remove the entire `emitInitialEvents()` method and its imports of `EVENT_NAMES`.

**Step 3: Remove EVENT_NAMES import from initialization.js if no longer used**

Check if `EVENT_NAMES` is used anywhere else in the file. If not, remove it from the import.

**Step 4: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/initialization.js
git commit -m "refactor: remove unused emitInitialEvents from InitializationManager"
```

---

### Task 11: Run full test suite and verify

**Files:** None (verification only)

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests PASS

**Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 3: Verify no remaining direct .state = assignments from outside GSM**

Run: `grep -rn "gameStateManager\.state\s*=" src/`
Expected: No results (only `this.state =` inside GSM itself should remain)

Run: `grep -rn "this\.gameStateManager\.state\s*=" src/`
Expected: No results

**Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup for restoreState() refactor"
```
