# Phase 2: Build the Coordinator — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> **Phased execution:** This is Phase 2 of the GSM Refactor (design:
> `docs/plans/2026-03-08-gsm-refactor-design.md`). After completing this phase,
> mark Phase 2 as done in the design doc. Then immediately use
> `superpowers:writing-plans` to create the Phase 3 implementation plan.

**Goal:** Create a `GameCoordinator` class that holds the full state object,
event bus, persistence, and all managers — then make `GameStateManager` a thin
wrapper that delegates everything to it. Zero behavioral change; all existing
tests pass without modification.

**Architecture:** Extract the core logic from `GameStateManager` into a new
`GameCoordinator` class. GSM becomes a compatibility shell that instantiates
the coordinator and forwards every public method call. The coordinator exposes
the exact same public API as the current GSM. This is a structural change only
— no manager internals change, no React layer changes, no test changes.

**Tech Stack:** JavaScript (ES modules), JSDoc, Vitest

---

## Task 1: Create GameCoordinator with constructor and lifecycle methods

**Files:**
- Create: `src/game/state/game-coordinator.js`

### Step 1: Create game-coordinator.js with imports, constructor, and lifecycle

The coordinator is a near-copy of the current GSM. It holds all the same
properties and managers. The only structural difference: it is instantiated
by GSM rather than by `main.jsx` directly (for now).

```js
// src/game/state/game-coordinator.js
import {
  FACTION_CONFIG,
  EVENT_NAMES,
  DEFAULT_PREFERENCES,
  ENDGAME_CONFIG,
} from '../constants.js';
import { devLog } from '../utils/dev-logger.js';
import { generateEpilogue, generateStats } from '../data/epilogue-data.js';
import { TradingManager } from './managers/trading.js';
import { ShipManager } from './managers/ship.js';
import { NPCManager } from './managers/npc.js';
import { NavigationManager } from './managers/navigation.js';
import { RefuelManager } from './managers/refuel.js';
import { RepairManager } from './managers/repair.js';
import { DialogueManager } from './managers/dialogue.js';
import { EventsManager } from './managers/events.js';
import { InfoBrokerManager } from './managers/info-broker.js';
import { EventSystemManager } from './managers/event-system.js';
import { StateManager } from './managers/state.js';
import { InitializationManager } from './managers/initialization.js';
import { SaveLoadManager } from './managers/save-load.js';
import { DangerManager } from './managers/danger.js';
import { CombatManager } from './managers/combat.js';
import { NegotiationManager } from './managers/negotiation.js';
import { InspectionManager } from './managers/inspection.js';
import { DistressManager } from './managers/distress.js';
import { MechanicalFailureManager } from './managers/mechanical-failure.js';
import { MissionManager } from './managers/mission.js';
import { EventEngineManager } from './managers/event-engine.js';
import { QuestManager } from './managers/quest-manager.js';
import { DebtManager } from './managers/debt.js';
import { AchievementsManager } from './managers/achievements.js';
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
import { NARRATIVE_EVENTS } from '../data/narrative-events.js';
import { DANGER_EVENTS } from '../data/danger-events.js';
import { ALL_QUESTS } from '../data/quest-definitions.js';
```

The constructor and lifecycle methods should be identical to the current GSM
(copy from `game-state-manager.js`), but as a new class name `GameCoordinator`.

Important: managers still receive `this` (the coordinator), since BaseManager
expects a `gameStateManager`-shaped object. The coordinator has the same
shape — it has `.state`, `.starData`, `.wormholeData`, `.navigationSystem`,
`.isTestEnvironment`, `.emit()`, `.markDirty()`, etc.

Include ALL public methods from GSM. The coordinator IS the full
implementation; GSM becomes a thin shell.

### Step 2: Run lint

Run: `npm run lint -- src/game/state/game-coordinator.js`
Expected: PASS

### Step 3: Commit

```
git add src/game/state/game-coordinator.js
git commit -m "Create GameCoordinator with full GSM implementation"
```

---

## Task 2: Convert GameStateManager to thin wrapper

**Files:**
- Modify: `src/game/state/game-state-manager.js`

### Step 1: Rewrite GSM to instantiate coordinator and delegate

Replace the entire `GameStateManager` class body. The constructor creates a
`GameCoordinator` and stores it. Every public method delegates to the
coordinator. Properties that managers or tests access directly (`.state`,
`.starData`, `.wormholeData`, `.navigationSystem`, `.isTestEnvironment`,
`.animationSystem`) must be forwarded via getters/setters so that code
accessing `gsm.state` still works.

The critical thing: managers are constructed inside the coordinator, passing
the coordinator as `this`. When managers call `this.gameStateManager.state`,
they reach the coordinator's `.state`. When external code calls
`gsm.state`, it must also reach the coordinator's `.state`. This is achieved
by making `.state` a getter/setter on GSM that proxies to the coordinator.

```js
import { GameCoordinator } from './game-coordinator.js';

export class GameStateManager {
  constructor(starData, wormholeData, navigationSystem = null) {
    this.coordinator = new GameCoordinator(starData, wormholeData, navigationSystem);
  }

  // Property proxies — external code reads/writes these on the GSM
  get state() { return this.coordinator.state; }
  set state(val) { this.coordinator.state = val; }

  get starData() { return this.coordinator.starData; }
  get wormholeData() { return this.coordinator.wormholeData; }
  get navigationSystem() { return this.coordinator.navigationSystem; }
  set navigationSystem(val) { this.coordinator.navigationSystem = val; }

  get isTestEnvironment() { return this.coordinator.isTestEnvironment; }

  get animationSystem() { return this.coordinator.animationSystem; }
  set animationSystem(val) { this.coordinator.animationSystem = val; }

  get subscribers() { return this.coordinator.subscribers; }

  get lastSaveTime() { return this.coordinator.lastSaveTime; }
  set lastSaveTime(val) { this.coordinator.lastSaveTime = val; }

  // Manager proxies — some tests access managers directly
  get eventSystemManager() { return this.coordinator.eventSystemManager; }
  get stateManager() { return this.coordinator.stateManager; }
  get tradingManager() { return this.coordinator.tradingManager; }
  get shipManager() { return this.coordinator.shipManager; }
  get npcManager() { return this.coordinator.npcManager; }
  get navigationManager() { return this.coordinator.navigationManager; }
  get refuelManager() { return this.coordinator.refuelManager; }
  get repairManager() { return this.coordinator.repairManager; }
  get dialogueManager() { return this.coordinator.dialogueManager; }
  get eventsManager() { return this.coordinator.eventsManager; }
  get infoBrokerManager() { return this.coordinator.infoBrokerManager; }
  get dangerManager() { return this.coordinator.dangerManager; }
  get combatManager() { return this.coordinator.combatManager; }
  get negotiationManager() { return this.coordinator.negotiationManager; }
  get inspectionManager() { return this.coordinator.inspectionManager; }
  get distressManager() { return this.coordinator.distressManager; }
  get mechanicalFailureManager() { return this.coordinator.mechanicalFailureManager; }
  get missionManager() { return this.coordinator.missionManager; }
  get eventEngineManager() { return this.coordinator.eventEngineManager; }
  get questManager() { return this.coordinator.questManager; }
  get debtManager() { return this.coordinator.debtManager; }
  get achievementsManager() { return this.coordinator.achievementsManager; }
  get saveLoadManager() { return this.coordinator.saveLoadManager; }
  get initializationManager() { return this.coordinator.initializationManager; }

  // --- Method delegation (all ~180 methods) ---
  // Each delegates to this.coordinator.<method>(...args)
}
```

Every method from the current GSM becomes a one-liner:
```js
methodName(...args) { return this.coordinator.methodName(...args); }
```

### Step 2: Run lint

Run: `npm run lint -- src/game/state/game-state-manager.js`
Expected: PASS

### Step 3: Run full test suite

Run: `npm test`
Expected: ALL PASS — this is a pure structural refactor with zero behavioral
change. If any test fails, the delegation is incorrect.

### Step 4: Commit

```
git add src/game/state/game-state-manager.js
git commit -m "Convert GameStateManager to thin wrapper over GameCoordinator"
```

---

## Task 3: Write integration test for coordinator equivalence

This test verifies that the coordinator exposes the same public API as the
original GSM, and that basic operations work through the delegation layer.

**Files:**
- Create: `tests/unit/game-coordinator.test.js`

### Step 1: Write the test

```js
// tests/unit/game-coordinator.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { GameStateManager } from '@game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('GameCoordinator', () => {
  let coordinator;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    coordinator = new GameCoordinator(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    coordinator.initNewGame();
  });

  it('initializes with valid game state', () => {
    const state = coordinator.getState();
    expect(state).toBeDefined();
    expect(state.player).toBeDefined();
    expect(state.ship).toBeDefined();
    expect(state.world).toBeDefined();
  });

  it('exposes same public methods as GameStateManager wrapper', () => {
    const gsm = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gsm.initNewGame();

    // Get all own method names from GSM prototype (excluding constructor)
    const gsmMethods = Object.getOwnPropertyNames(
      GameStateManager.prototype
    ).filter((name) => name !== 'constructor' && typeof gsm[name] === 'function');

    // Every GSM method should exist on coordinator
    const missing = gsmMethods.filter(
      (name) => typeof coordinator[name] !== 'function'
    );
    expect(missing, `Coordinator missing methods: ${missing.join(', ')}`).toEqual([]);
  });

  it('state is accessible and mutable', () => {
    coordinator.state.player.credits = 9999;
    expect(coordinator.getState().player.credits).toBe(9999);
  });

  it('event system works', () => {
    const handler = vi.fn();
    coordinator.subscribe('creditsChanged', handler);
    coordinator.updateCredits(500);
    expect(handler).toHaveBeenCalledWith(500);
  });

  it('markDirty does not throw', () => {
    expect(() => coordinator.markDirty()).not.toThrow();
  });
});

describe('GameStateManager delegates to GameCoordinator', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gsm.initNewGame();
  });

  it('gsm.state proxies to coordinator.state', () => {
    expect(gsm.state).toBe(gsm.coordinator.state);
  });

  it('gsm.starData proxies to coordinator.starData', () => {
    expect(gsm.starData).toBe(gsm.coordinator.starData);
  });

  it('gsm.getState() returns coordinator state', () => {
    expect(gsm.getState()).toBe(gsm.coordinator.getState());
  });

  it('manager references proxy correctly', () => {
    expect(gsm.tradingManager).toBe(gsm.coordinator.tradingManager);
    expect(gsm.shipManager).toBe(gsm.coordinator.shipManager);
    expect(gsm.npcManager).toBe(gsm.coordinator.npcManager);
  });

  it('mutations through gsm affect coordinator state', () => {
    const initialCredits = gsm.getState().player.credits;
    gsm.updateCredits(initialCredits + 100);
    expect(gsm.coordinator.getState().player.credits).toBe(initialCredits + 100);
  });
});
```

### Step 2: Run the test

Run: `npm test -- tests/unit/game-coordinator.test.js`
Expected: PASS

### Step 3: Run full test suite to confirm no regressions

Run: `npm test`
Expected: ALL PASS

### Step 4: Commit

```
git add tests/unit/game-coordinator.test.js
git commit -m "Add integration test for GameCoordinator equivalence"
```

---

## Task 4: Update design doc status table

**Files:**
- Modify: `docs/plans/2026-03-08-gsm-refactor-design.md`

### Step 1: Update the status table

Change the Phase 2 row from:
```
| Phase 2 | (create when Phase 1 is complete) | — |
```
to:
```
| Phase 2 | `2026-03-08-gsm-phase2-implementation.md` | Not started |
```

### Step 2: Commit

```
git add docs/plans/2026-03-08-gsm-refactor-design.md
git commit -m "Update design doc with Phase 2 plan reference"
```

---

## Final Step: Mark Phase 2 complete and run full test suite

### Step 1: Run full test suite

Run: `npm test`
Expected: ALL PASS

### Step 2: Update design doc

In `docs/plans/2026-03-08-gsm-refactor-design.md`, update Phase 2 status:

Change:
```
| Phase 2 | `2026-03-08-gsm-phase2-implementation.md` | Not started |
```
to:
```
| Phase 2 | `2026-03-08-gsm-phase2-implementation.md` | Complete |
```

And update the Phase 2 header:
```
### Phase 2: Build the Coordinator ✅ COMPLETE
```

### Step 3: Commit

```
git add docs/plans/2026-03-08-gsm-refactor-design.md
git commit -m "Mark Phase 2 complete in GSM refactor design doc"
```

---

## Implementation Notes

### Why the delegation approach (not moving imports)

The GSM wrapper uses property getters and method delegation rather than
re-exporting the coordinator as GSM. This is because:

1. **Tests access manager properties directly** (e.g., `gsm.tradingManager`,
   `gsm.state`). These must continue working.
2. **BaseManager stores `this.gameStateManager`** — managers receive the
   coordinator as their `gameStateManager`. External code receives the GSM
   wrapper. Both must expose the same shape (`.state`, `.emit()`, etc.).
3. **The `SaveLoadManager.loadGame()` method** calls
   `this.gameStateManager.restoreState()` — this calls through to the
   coordinator's `restoreState()`, which works correctly since the coordinator
   IS the `gameStateManager` that managers receive.

### What NOT to change

- **Do not modify `main.jsx`** — it still creates `new GameStateManager(...)`.
  That's Phase 4.
- **Do not modify `GameContext.jsx`** — it still provides the GSM wrapper.
  That's Phase 4.
- **Do not modify any manager files** — they still receive `this` (the
  coordinator). That's Phase 3.
- **Do not modify `base-manager.js`** — it still expects a
  `gameStateManager`-shaped object. That's Phase 3.
- **Do not modify any test files** — they still use `createTestGameStateManager()`.
  If any test needs modification, the delegation is wrong.

### Property proxy completeness check

The GSM wrapper must proxy ALL properties that external code or tests access.
Known properties:

- `state` (get/set) — used everywhere
- `starData` (get) — used by tests
- `wormholeData` (get) — used by tests
- `navigationSystem` (get/set) — set in main.jsx, read by managers
- `isTestEnvironment` (get) — read by managers
- `animationSystem` (get/set) — set by StarMapCanvas, read by useAnimationLock
- `subscribers` (get) — used by some tests
- `lastSaveTime` (get/set) — used by save tests
- All 25 manager instance properties — used by some tests

If a test fails with "cannot read property of undefined", it means a property
proxy is missing from the GSM wrapper.
