# Phase 3 Batch 5: Migrate Infrastructure Managers + Cleanup

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the remaining six old-style managers (EventSystemManager, InitializationManager, NavigationManager, EventEngineManager, StateManager, SaveLoadManager) to capability injection, then remove the legacy code path from BaseManager.

**Architecture:** Each manager stops using `this.gameStateManager` and instead receives a capability object with explicit read queries, write callbacks, and infrastructure. After all managers are migrated, BaseManager's legacy path (`this.gameStateManager`) is removed — only the capability path remains. Managers continue to extend BaseManager for its logging methods (`log`, `warn`, `error`); full BaseManager removal is deferred to Phase 5.

**Tech Stack:** Vitest, ES Modules, JSDoc typedefs (in `src/game/state/capabilities.js`)

**Managers in this batch (ordered by dependency/complexity):**
1. EventSystemManager — pure pub/sub, no BaseManager, no state access at all
2. InitializationManager — no BaseManager, only reads starData + calls assignShipQuirks
3. NavigationManager — extends BaseManager, moderate cross-domain reads/writes
4. EventEngineManager — extends BaseManager, needs full state for condition evaluation
5. StateManager — extends BaseManager, infrastructure mutation primitives
6. SaveLoadManager — extends BaseManager, needs coordinator.restoreState callback

**Design reference:** `docs/plans/2026-03-08-gsm-refactor-design.md` Phase 3 section.
**Migration pattern established in Batch 1:** See `docs/plans/2026-03-08-gsm-phase3-batch1-implementation.md`.
**Capability typedefs:** `src/game/state/capabilities.js` (NavigationCapabilities and EventEngineCapabilities already have stubs at lines 470-499).

---

### Task 1: Migrate EventSystemManager to standalone class

**Files:**
- Modify: `src/game/state/managers/event-system.js`
- Modify: `src/game/state/game-coordinator.js` (line ~85)

**Step 1: Remove unused gameStateManager reference from EventSystemManager**

EventSystemManager stores `this.gameStateManager` in its constructor but never uses it. Simply remove it:

In `src/game/state/managers/event-system.js`, change the constructor from:

```js
constructor(gameStateManager) {
  this.gameStateManager = gameStateManager;
  this.subscribers = {};
  for (const eventName of Object.values(EVENT_NAMES)) {
    this.subscribers[eventName] = [];
  }
}
```

to:

```js
constructor() {
  this.subscribers = {};
  for (const eventName of Object.values(EVENT_NAMES)) {
    this.subscribers[eventName] = [];
  }
}
```

**Step 2: Update coordinator to pass no arguments**

In `src/game/state/game-coordinator.js`, change line 85:

```js
this.eventSystemManager = new EventSystemManager(this);
```

to:

```js
this.eventSystemManager = new EventSystemManager();
```

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass.

**Step 4: Apply formatting and commit**

```
npx prettier --write src/game/state/managers/event-system.js src/game/state/game-coordinator.js
git add src/game/state/managers/event-system.js src/game/state/game-coordinator.js
git commit -m "Remove unused gameStateManager reference from EventSystemManager"
```

---

### Task 2: Migrate InitializationManager to capability injection

**Files:**
- Modify: `src/game/state/managers/initialization.js`
- Modify: `src/game/state/game-coordinator.js` (line ~87)

**Step 1: Update coordinator to pass capability object**

In `src/game/state/game-coordinator.js`, replace line 87:

```js
this.initializationManager = new InitializationManager(this);
```

with:

```js
this.initializationManager = new InitializationManager({
  assignShipQuirks: (rng) => this.shipManager.assignShipQuirks(rng),
  starData: this.starData,
  isTestEnvironment: this.isTestEnvironment,
});
```

**Note on ordering:** InitializationManager is constructed at line 87, before ShipManager (line 118). This works because `assignShipQuirks` is a closure evaluated lazily — `this.shipManager` is resolved when `createInitialState()` is called, not at construction time.

**Step 2: Update InitializationManager to use capabilities**

InitializationManager does NOT extend BaseManager. Replace the constructor and all references:

Change the constructor from:

```js
constructor(gameStateManager) {
  this.gameStateManager = gameStateManager;
  this.starData = gameStateManager.starData;
  this.isTestEnvironment = gameStateManager.isTestEnvironment;
}
```

to:

```js
constructor(capabilities) {
  this.capabilities = capabilities;
  this.starData = capabilities.starData;
  this.isTestEnvironment = capabilities.isTestEnvironment;
}
```

In `initializeShipState()`, change line 117:

```js
const shipQuirks = this.gameStateManager.assignShipQuirks(() => rng.next());
```

to:

```js
const shipQuirks = this.capabilities.assignShipQuirks(() => rng.next());
```

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass.

**Step 4: Apply formatting and commit**

```
npx prettier --write src/game/state/managers/initialization.js src/game/state/game-coordinator.js
git add src/game/state/managers/initialization.js src/game/state/game-coordinator.js
git commit -m "Migrate InitializationManager to capability injection"
```

---

### Task 3: Migrate NavigationManager to capability injection

**Files:**
- Modify: `src/game/state/managers/navigation.js`
- Modify: `src/game/state/game-coordinator.js` (line ~144)

**Step 1: Update coordinator to pass capability object**

In `src/game/state/game-coordinator.js`, replace line 144:

```js
this.navigationManager = new NavigationManager(this, this.starData);
```

with:

```js
this.navigationManager = new NavigationManager({
  getOwnState: () => ({
    currentSystem: this.state.player.currentSystem,
    visitedSystems: this.state.world.visitedSystems,
  }),
  setCurrentSystem: (systemId) => { this.state.player.currentSystem = systemId; },
  setCurrentSystemPrices: (prices) => { this.state.world.currentSystemPrices = prices; },
  getDaysElapsed: () => this.state.player.daysElapsed,
  getActiveEvents: () => this.state.world.activeEvents,
  getMarketConditions: () => this.state.world.marketConditions,
  getStats: () => this.state.stats,
  getDockedSystems: () => this.state.world.narrativeEvents?.dockedSystems,
  updatePriceKnowledge: (systemId, prices, lastVisit, source) =>
    this.tradingManager.updatePriceKnowledge(systemId, prices, lastVisit, source),
  checkAchievements: () => this.achievementsManager.checkAchievements(),
  markDirty: () => this.markDirty(),
  emit: (...args) => this.emit(...args),
  starData: this.starData,
  isTestEnvironment: this.isTestEnvironment,
});
```

**Step 2: Update NavigationManager to use capabilities**

Replace the entire NavigationManager implementation. Key changes by method:

**Constructor:** Change from `constructor(gameStateManager, starData)` with `super(gameStateManager)` to `constructor(capabilities)` with `super(capabilities)`.

**`updateLocation(newSystemId)`:**
- Remove `this.validateState()` and `const state = this.getState()`
- `state.player.currentSystem = newSystemId` → `this.capabilities.setCurrentSystem(newSystemId)`
- `state.world.visitedSystems` → `this.capabilities.getOwnState().visitedSystems`
- `state.world.currentSystemPrices = snapshotPrices` → `this.capabilities.setCurrentSystemPrices(snapshotPrices)`
- `state.player.daysElapsed` → `this.capabilities.getDaysElapsed()`
- `state.world.activeEvents` → `this.capabilities.getActiveEvents()`
- `state.world.marketConditions` → `this.capabilities.getMarketConditions()`
- `state.stats` → `this.capabilities.getStats()`
- `this.starData` → `this.capabilities.starData`
- `this.emit(...)` → `this.capabilities.emit(...)`
- `this.gameStateManager.checkAchievements()` → `this.capabilities.checkAchievements()`
- `this.gameStateManager.markDirty()` → `this.capabilities.markDirty()`

**`dock()`:**
- Remove `this.validateState()` and `const state = this.getState()`
- `state.player.currentSystem` → `this.capabilities.getOwnState().currentSystem`
- `state.player.daysElapsed` → `this.capabilities.getDaysElapsed()`
- `state.world.activeEvents` → `this.capabilities.getActiveEvents()`
- `state.world.marketConditions` → `this.capabilities.getMarketConditions()`
- `this.starData` → `this.capabilities.starData`
- `this.gameStateManager.updatePriceKnowledge(...)` → `this.capabilities.updatePriceKnowledge(...)`
- `this.gameStateManager.markDirty()` → `this.capabilities.markDirty()`
- `this.emit(...)` → `this.capabilities.emit(...)`
- `state.world.narrativeEvents?.dockedSystems` → `this.capabilities.getDockedSystems()`

**`undock()`:**
- Remove `this.validateState()` and `const state = this.getState()`
- `state.player.currentSystem` → `this.capabilities.getOwnState().currentSystem`
- `this.gameStateManager.markDirty()` → `this.capabilities.markDirty()`
- `this.emit(...)` → `this.capabilities.emit(...)`

**`isSystemVisited(systemId)`:**
- Remove `this.validateState()` and `const state = this.getState()`
- `state.world.visitedSystems` → `this.capabilities.getOwnState().visitedSystems`

**`getCurrentSystem()`:**
- Remove `this.validateState()` and `const state = this.getState()`
- `state.player.currentSystem` → `this.capabilities.getOwnState().currentSystem`
- `this.starData` → `this.capabilities.starData`

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass.

**Step 4: Apply formatting and commit**

```
npx prettier --write src/game/state/managers/navigation.js src/game/state/game-coordinator.js
git add src/game/state/managers/navigation.js src/game/state/game-coordinator.js
git commit -m "Migrate NavigationManager to capability injection"
```

---

### Task 4: Migrate EventEngineManager to capability injection

**Files:**
- Modify: `src/game/state/managers/event-engine.js`
- Modify: `src/game/state/game-coordinator.js` (line ~341)

**Important design note:** EventEngineManager passes the full game state to `evaluateCondition()` (from `event-conditions.js`). The `evaluateCondition()` switch statement accesses `gameState.player.*`, `gameState.ship.*`, `gameState.world.*`, `gameState.missions.*`, `gameState.npcs.*`, and `gameState.quests.*` — essentially the entire state. Refactoring `evaluateCondition()` would be significant scope creep.

**Decision:** Provide a `getGameState()` read capability that returns the full `this.state`. This is a documented exception — EventEngineManager is a generic condition engine that needs read access to the full state tree. The key migration win is still achieved: EventEngineManager no longer receives the coordinator reference (no access to mutating methods), only a read callback.

**Step 1: Update coordinator to pass capability object**

In `src/game/state/game-coordinator.js`, replace line 341:

```js
this.eventEngineManager = new EventEngineManager(this);
```

with:

```js
this.eventEngineManager = new EventEngineManager({
  getOwnState: () => this.state.world.narrativeEvents,
  getGameState: () => this.state,
  isTestEnvironment: this.isTestEnvironment,
});
```

**Step 2: Update EventEngineManager to use capabilities**

**Constructor:** Change from `constructor(gameStateManager)` with `super(gameStateManager)` to `constructor(capabilities)` with `super(capabilities)`.

**`checkEvents(eventType, context, rngFn)`:**
- `const state = this.getState()` → `const state = this.capabilities.getGameState()`
- `const { narrativeEvents } = state.world` remains the same (state is the full state)

**`markFired(eventId)`:**
- `this.getState().world.narrativeEvents` → `this.capabilities.getOwnState()`
- Access `ownState.fired` instead of `state.world.narrativeEvents.fired`

**`setCooldown(eventId, cooldownDays)`:**
- `const state = this.getState()` → split into two calls
- `state.world.narrativeEvents.cooldowns[eventId]` → `this.capabilities.getOwnState().cooldowns[eventId]`
- `state.player.daysElapsed` → access via `this.capabilities.getGameState().player.daysElapsed`

**Alternative for setCooldown:** Add a `getDaysElapsed` capability to avoid pulling full state just for daysElapsed. But since `getGameState` already exists, keep it simple and use `this.capabilities.getGameState().player.daysElapsed`.

**`setFlag(flagName)`:**
- `this.getState().world.narrativeEvents.flags[flagName]` → `this.capabilities.getOwnState().flags[flagName]`

**`getFlags()`:**
- `this.getState().world?.narrativeEvents?.flags` → `this.capabilities.getOwnState()?.flags ?? {}`

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass.

**Step 4: Apply formatting and commit**

```
npx prettier --write src/game/state/managers/event-engine.js src/game/state/game-coordinator.js
git add src/game/state/managers/event-engine.js src/game/state/game-coordinator.js
git commit -m "Migrate EventEngineManager to capability injection"
```

---

### Task 5: Migrate StateManager to capability injection

**Files:**
- Modify: `src/game/state/managers/state.js`
- Modify: `src/game/state/game-coordinator.js` (line ~86)

**Design note:** StateManager is infrastructure — it provides the mutation primitives (`updateCredits`, `updateFuel`, `updateCargo`, `updateDebt`) that other managers call via their injected capability callbacks. The coordinator wraps StateManager methods as the callbacks injected into other managers. StateManager stays owned by (and only accessible to) the coordinator.

**Step 1: Update coordinator to pass capability object**

In `src/game/state/game-coordinator.js`, replace line 86:

```js
this.stateManager = new StateManager(this);
```

with:

```js
this.stateManager = new StateManager({
  getPlayerCredits: () => this.state.player.credits,
  setPlayerCredits: (value) => { this.state.player.credits = value; },
  getPlayerDebt: () => this.state.player.debt,
  setPlayerDebt: (value) => { this.state.player.debt = value; },
  getShipFuel: () => this.state.ship.fuel,
  setShipFuel: (value) => { this.state.ship.fuel = value; },
  getShipCargo: () => this.state.ship.cargo,
  setShipCargo: (value) => { this.state.ship.cargo = value; },
  getShipCargoCapacity: () => this.state.ship.cargoCapacity,
  getPlayer: () => this.state.player,
  getShip: () => this.state.ship,
  getActiveMissions: () => this.state.missions?.active,
  getFullState: () => this.state,
  getFuelCapacity: () => this.shipManager.getFuelCapacity(),
  emit: (...args) => this.emit(...args),
  isTestEnvironment: this.isTestEnvironment,
});
```

**Note on ordering:** StateManager is constructed at line 86, before ShipManager (line 118). The `getFuelCapacity` closure references `this.shipManager` which is resolved lazily at call time — `updateFuel()` is never called during construction.

**Note on `getFullState`:** StateManager exposes `getState()` and `getPlayer()`/`getShip()` as public API through the coordinator. Rather than breaking these, the capability provides read access to the full state and player/ship sub-objects. These are infrastructure reads, not domain reads.

**Step 2: Update StateManager to use capabilities**

**Constructor:** Change from `constructor(gameStateManager)` with `super(gameStateManager)` to `constructor(capabilities)` with `super(capabilities)`.

**`getState()`:**
- `this.gameStateManager.state` → `this.capabilities.getFullState()`

**`getPlayer()`:**
- Remove `this.validateState()`
- `this.gameStateManager.state.player` → `this.capabilities.getPlayer()`

**`getShip()`:**
- Remove `this.validateState()`
- `this.gameStateManager.state.ship` → `this.capabilities.getShip()`

**`getCargoUsed()`:**
- Remove `this.validateState()`
- Calls `this.getTradeCargoUsed()` and `this.getPassengerCargoUsed()` — no change needed

**`getTradeCargoUsed()`:**
- Remove `this.validateState()`
- `this.gameStateManager.state.ship.cargo` → `this.capabilities.getShipCargo()`

**`getPassengerCargoUsed()`:**
- Remove `this.validateState()`
- `this.gameStateManager.state.missions` → `{ active: this.capabilities.getActiveMissions() }`
- Access `missions?.active` still works

**`getCargoRemaining()`:**
- Remove `this.validateState()`
- `this.gameStateManager.state.ship.cargoCapacity` → `this.capabilities.getShipCargoCapacity()`

**`updateCredits(newCredits)`:**
- Remove `this.validateState()`
- `this.gameStateManager.state.player.credits = newCredits` → `this.capabilities.setPlayerCredits(newCredits)`
- `this.emit(...)` → `this.capabilities.emit(...)`

**`updateDebt(newDebt)`:**
- Remove `this.validateState()`
- `this.gameStateManager.state.player.debt = newDebt` → `this.capabilities.setPlayerDebt(newDebt)`
- `this.emit(...)` → `this.capabilities.emit(...)`

**`updateFuel(newFuel)`:**
- Remove `this.validateState()`
- `this.gameStateManager.getFuelCapacity()` → `this.capabilities.getFuelCapacity()`
- `this.gameStateManager.state.ship.fuel = newFuel` → `this.capabilities.setShipFuel(newFuel)`
- `this.emit(...)` → `this.capabilities.emit(...)`

**`updateCargo(newCargo)`:**
- Remove `this.validateState()`
- `this.gameStateManager.state.ship.cargo = newCargo` → `this.capabilities.setShipCargo(newCargo)`
- `this.emit(...)` → `this.capabilities.emit(...)`

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass.

**Step 4: Apply formatting and commit**

```
npx prettier --write src/game/state/managers/state.js src/game/state/game-coordinator.js
git add src/game/state/managers/state.js src/game/state/game-coordinator.js
git commit -m "Migrate StateManager to capability injection"
```

---

### Task 6: Migrate SaveLoadManager to capability injection

**Files:**
- Modify: `src/game/state/managers/save-load.js`
- Modify: `src/game/state/game-coordinator.js` (line ~88)

**Step 1: Update coordinator to pass capability object**

In `src/game/state/game-coordinator.js`, replace line 88:

```js
this.saveLoadManager = new SaveLoadManager(this);
```

with:

```js
this.saveLoadManager = new SaveLoadManager({
  getFullState: () => this.state,
  restoreState: (rawState) => this.restoreState(rawState),
  emit: (...args) => this.emit(...args),
  isTestEnvironment: this.isTestEnvironment,
});
```

**Step 2: Update SaveLoadManager to use capabilities**

**Constructor:** Change from `constructor(gameStateManager)` with `super(gameStateManager)` to `constructor(capabilities)` with `super(capabilities)`.

**`_forceSave()`:**
- `this.getState()` (BaseManager method) → `this.capabilities.getFullState()`
- Both occurrences of `this.getState()` change
- `this.emit(...)` → `this.capabilities.emit(...)`

**`saveGame()`:**
- `this.getState()` → `this.capabilities.getFullState()`
- `this.emit(...)` → `this.capabilities.emit(...)`

**`loadGame()`:**
- `this.gameStateManager.restoreState(loadedState)` → `this.capabilities.restoreState(loadedState)`

**`attemptNPCRecovery()`:**
- `this.gameStateManager.restoreState(recoveredState)` → `this.capabilities.restoreState(recoveredState)`

**No changes needed for:** `markDirty()`, `flushSave()`, `hasSavedGame()`, `clearSave()`, `getLastSaveTime()`, `setLastSaveTime()` — these don't access `gameStateManager`.

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass. Tests in `tests/unit/save-failure-notification.test.js` and `tests/unit/save-debounce.test.js` create GameStateManager instances which construct the coordinator — these tests exercise the new capability wiring.

**Step 4: Apply formatting and commit**

```
npx prettier --write src/game/state/managers/save-load.js src/game/state/game-coordinator.js
git add src/game/state/managers/save-load.js src/game/state/game-coordinator.js
git commit -m "Migrate SaveLoadManager to capability injection"
```

---

### Task 7: Remove legacy code path from BaseManager

**Files:**
- Modify: `src/game/state/managers/base-manager.js`

**Step 1: Remove legacy mode support**

Now that ALL managers use capability injection, remove the dual-mode constructor and legacy methods. BaseManager becomes a minimal base class providing only:
- Capability storage (`this.capabilities`, `this.isTestEnvironment`)
- Logging methods (`log`, `warn`, `error`)

Replace the entire `src/game/state/managers/base-manager.js` with:

```js
import { DEV_MODE } from '../../constants.js';

/**
 * Base class for game state managers
 *
 * Provides capability storage and logging utilities.
 * All managers receive a capability object at construction.
 */
export class BaseManager {
  /**
   * Initialize base manager with capability object
   *
   * @param {Object} capabilities - Injected capability object with read queries, write callbacks, and infrastructure
   */
  constructor(capabilities) {
    if (!capabilities) {
      throw new Error('BaseManager requires a capabilities object');
    }

    this.capabilities = capabilities;
    this.isTestEnvironment = capabilities.isTestEnvironment ?? false;
  }

  /**
   * Log debug information (suppressed unless DEV_MODE is active)
   * @param {...*} args - Arguments to log
   */
  log(...args) {
    if (DEV_MODE) {
      console.log(`[${this.constructor.name}]`, ...args);
    }
  }

  /**
   * Log warning information (suppressed unless DEV_MODE is active)
   * @param {...*} args - Arguments to log
   */
  warn(...args) {
    if (DEV_MODE) {
      console.warn(`[${this.constructor.name}]`, ...args);
    }
  }

  /**
   * Log error information (always logged, even in tests)
   * @param {...*} args - Arguments to log
   */
  error(...args) {
    console.error(`[${this.constructor.name}]`, ...args);
  }
}
```

**Step 2: Run all tests**

Run: `npm test`
Expected: All tests pass. No manager should be using `this.gameStateManager`, `this.getState()`, `this.emit()`, `this.getStarData()`, `this.getWormholeData()`, `this.getNavigationSystem()`, or `this.validateState()` from BaseManager anymore.

**Step 3: Verify no remaining legacy references**

Grep for `this.gameStateManager` in all manager files — should be 0 matches:
```
grep -r "this.gameStateManager" src/game/state/managers/
```

Grep for `this.getState()` in all manager files — should be 0 matches:
```
grep -r "this.getState()" src/game/state/managers/
```

Grep for `this.validateState()` in all manager files — should be 0 matches:
```
grep -r "this.validateState()" src/game/state/managers/
```

**Step 4: Apply formatting and commit**

```
npx prettier --write src/game/state/managers/base-manager.js
git add src/game/state/managers/base-manager.js
git commit -m "Remove legacy code path from BaseManager"
```

---

### Task 8: Update capability typedefs

**Files:**
- Modify: `src/game/state/capabilities.js`

**Step 1: Update existing stubs and add new typedefs**

Update the NavigationCapabilities and EventEngineCapabilities stubs (lines 470-499) to match the actual implementation from Tasks 3 and 4. Add new typedefs for StateManagerCapabilities, SaveLoadManagerCapabilities, and InitializationCapabilities.

Add a new section after the BATCH 4 typedefs:

```js
// ========================================================================
// BATCH 5: Infrastructure Managers
// ========================================================================
```

**NavigationCapabilities** (update existing stub at line 470):
- `getOwnState()` → returns `{ currentSystem, visitedSystems }`
- `setCurrentSystem(systemId)` — sets player.currentSystem
- `setCurrentSystemPrices(prices)` — sets world.currentSystemPrices
- `getDaysElapsed()`, `getActiveEvents()`, `getMarketConditions()`, `getStats()`, `getDockedSystems()`
- `updatePriceKnowledge(systemId, prices, lastVisit, source)` — delegates to TradingManager
- `checkAchievements()`, `markDirty()`, `emit()`, `starData`

**EventEngineCapabilities** (update existing stub at line 490):
- `getOwnState()` → returns `state.world.narrativeEvents`
- `getGameState()` → returns full state (for evaluateCondition)

**StateManagerCapabilities** (new):
- `getPlayerCredits()`, `setPlayerCredits(value)`
- `getPlayerDebt()`, `setPlayerDebt(value)`
- `getShipFuel()`, `setShipFuel(value)`
- `getShipCargo()`, `setShipCargo(value)`
- `getShipCargoCapacity()`
- `getPlayer()`, `getShip()`, `getActiveMissions()`
- `getFullState()` — returns full state for coordinator delegation
- `getFuelCapacity()` — delegates to ShipManager
- `emit()`

**SaveLoadManagerCapabilities** (new):
- `getFullState()` — returns full state for serialization
- `restoreState(rawState)` — delegates to coordinator
- `emit()`

**InitializationCapabilities** (new):
- `assignShipQuirks(rng)` — delegates to ShipManager
- `starData`, `isTestEnvironment`

**Step 2: Run capability interface test**

Run: `npm test -- tests/unit/capability-interfaces.test.js`
Expected: All tests pass.

**Step 3: Apply formatting and commit**

```
npx prettier --write src/game/state/capabilities.js
git add src/game/state/capabilities.js
git commit -m "Add Batch 5 capability typedefs for infrastructure managers"
```

---

### Task 9: Final verification and design doc update

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 2: Run linter and formatter**

Run: `npm run clean`
Expected: No errors.

**Step 3: Verify no remaining legacy references in any manager**

Grep for `this.gameStateManager` in all manager files:
```
grep -r "this.gameStateManager" src/game/state/managers/
```
Expected: 0 matches.

Grep for `this.getState()` in all manager files:
```
grep -r "this\.getState()" src/game/state/managers/
```
Expected: 0 matches (note: StateManager has a `getState()` method it defines, not calls from BaseManager).

Grep for `this.validateState()` in all manager files:
```
grep -r "this.validateState()" src/game/state/managers/
```
Expected: 0 matches.

**Step 4: Update design doc**

In `docs/plans/2026-03-08-gsm-refactor-design.md`, update the Phase 3 Batch 5 row from:

```
| Phase 3 Batch 5 | (create when Batch 4 is complete) | — |
```

to:

```
| Phase 3 Batch 5 | `2026-03-08-gsm-phase3-batch5-implementation.md` | Complete |
```

**Step 5: Commit**

```
git add docs/plans/2026-03-08-gsm-refactor-design.md
git commit -m "Mark Phase 3 Batch 5 complete in design doc"
```
