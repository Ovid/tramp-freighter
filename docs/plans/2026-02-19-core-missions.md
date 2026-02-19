# Core Mission System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a core mission system with mission types (delivery, fetch, passenger, intel, special), lifecycle (accept, track, complete, abandon, fail), cargo removal for delivery missions, and mission board with repeatable cargo runs — scoped to Spec 06.1 only.

**Architecture:** New `MissionManager` extends `BaseManager` for mission lifecycle (accept, track, complete, fail, abandon). Missions live in `state.missions = { active: [], completed: [], failed: [], board: [], boardLastRefresh: 0 }`. New Bridge Pattern event: `missionsChanged`. New panels: `mission-board`, `mission-offer`. Cargo removal helper added to `ShipManager`. Procedural cargo run generator as a pure utility module. Game version bumps to `5.0.0`.

**Tech Stack:** React 18, Vitest, GameStateManager delegation pattern, Bridge Pattern hooks

**Reference Spec:** `notes/tramp-freighter-06.1-core-missions.md`

---

### Task 1: Mission Constants

Add mission configuration constants to the centralized constants file.

**Files:**
- Modify: `src/game/constants.js`
- Test: `tests/unit/mission-constants.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import {
  MISSION_CONFIG,
} from '../../src/game/constants.js';

describe('Mission Constants', () => {
  it('should export MISSION_CONFIG with required fields', () => {
    expect(MISSION_CONFIG).toBeDefined();
    expect(MISSION_CONFIG.TYPES).toEqual(
      expect.arrayContaining(['delivery', 'fetch', 'passenger', 'intel', 'special'])
    );
    expect(MISSION_CONFIG.MAX_ACTIVE).toBeGreaterThan(0);
    expect(MISSION_CONFIG.BOARD_SIZE).toBeGreaterThan(0);
    expect(MISSION_CONFIG.BOARD_REFRESH_DAYS).toBeGreaterThan(0);
    expect(MISSION_CONFIG.DEADLINE_BUFFER_DAYS).toBeGreaterThan(0);
    expect(MISSION_CONFIG.REWARD_MARKUP).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-constants.test.js`
Expected: FAIL — MISSION_CONFIG is not exported

**Step 3: Write minimal implementation**

Add to end of `src/game/constants.js` (before no other export, just at the bottom):

```javascript
/**
 * Mission System Configuration
 */
export const MISSION_CONFIG = {
  TYPES: ['delivery', 'fetch', 'passenger', 'intel', 'special'],
  MAX_ACTIVE: 3,
  BOARD_SIZE: 3,
  BOARD_REFRESH_DAYS: 1,
  DEADLINE_BUFFER_DAYS: 3,
  REWARD_MARKUP: 0.3,
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-constants.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass (no regressions)

**Step 6: Commit**

```bash
git add src/game/constants.js tests/unit/mission-constants.test.js
git commit -m "feat: add mission system constants"
```

---

### Task 2: Mission State Initialization & Save/Load

Add mission state to game initialization. Add migration for existing saves. Bump GAME_VERSION to 5.0.0.

**Files:**
- Modify: `src/game/state/managers/initialization.js`
- Modify: `src/game/state/state-validators.js`
- Modify: `src/game/state/managers/save-load.js`
- Modify: `src/game/state/managers/event-system.js`
- Modify: `src/game/constants.js` (bump GAME_VERSION)
- Test: `tests/unit/mission-state-initialization.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission State Initialization', () => {
  it('should initialize missions state in new game', () => {
    const manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    const state = manager.initNewGame();

    expect(state.missions).toBeDefined();
    expect(state.missions.active).toEqual([]);
    expect(state.missions.completed).toEqual([]);
    expect(state.missions.failed).toEqual([]);
    expect(state.missions.board).toEqual([]);
    expect(state.missions.boardLastRefresh).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-state-initialization.test.js`
Expected: FAIL — `state.missions` is undefined

**Step 3: Write minimal implementation**

In `src/game/constants.js`, change `GAME_VERSION` from `'4.1.0'` to `'5.0.0'`.

In `src/game/state/managers/event-system.js`, add `missionsChanged: [],` to the `this.subscribers` object (after `currentSystemChanged: [],`).

In `src/game/state/managers/initialization.js`:

Add a new method `initializeMissionState()`:

```javascript
initializeMissionState() {
  return {
    active: [],
    completed: [],
    failed: [],
    board: [],
    boardLastRefresh: 0,
  };
}
```

In `createInitialState()`, add:

```javascript
const missionState = this.initializeMissionState();
```

And include it in the return object:

```javascript
return {
  player: playerState,
  ship: shipState,
  world: worldState,
  npcs: npcState,
  dialogue: dialogueState,
  missions: missionState,
  meta: metaState,
};
```

In `emitInitialEvents(state)`, add at the end:

```javascript
if (state.missions) {
  this.gameStateManager.emit('missionsChanged', state.missions);
}
```

In `src/game/state/state-validators.js`:

Add a new migration function `migrateFromV4_1ToV5` (after `migrateFromV4ToV4_1`):

```javascript
/**
 * Migrate save data from v4.1.0 to v5.0.0
 *
 * Adds mission system:
 * - missions state (active, completed, failed, board, boardLastRefresh)
 *
 * @param {Object} state - v4.1.0 state
 * @param {boolean} isTestEnvironment - Whether running in test mode
 * @returns {Object} Migrated v5.0.0 state
 */
export function migrateFromV4_1ToV5(state, isTestEnvironment) {
  if (!isTestEnvironment) {
    console.log('Migrating save from v4.1.0 to v5.0.0');
  }

  if (!state.missions) {
    state.missions = {
      active: [],
      completed: [],
      failed: [],
      board: [],
      boardLastRefresh: 0,
    };
  }

  state.meta.version = GAME_VERSION;

  if (!isTestEnvironment) {
    console.log('Migration complete');
  }

  return state;
}
```

In `addStateDefaults()`, add at the end (before `return state;`):

```javascript
// Initialize mission state if missing
if (!state.missions) {
  state.missions = {
    active: [],
    completed: [],
    failed: [],
    board: [],
    boardLastRefresh: 0,
  };
}
```

In `isVersionCompatible()`, add:

```javascript
// Support migration from v4.1.0 to v5.0.0
if (saveVersion === '4.1.0' && GAME_VERSION === '5.0.0') return true;
```

Also update existing migration compatibility checks. All previous `GAME_VERSION === '4.1.0'` checks must now reference `'5.0.0'` since GAME_VERSION changed. For example:
- `saveVersion === '1.0.0' && GAME_VERSION === '4.1.0'` → `saveVersion === '1.0.0' && GAME_VERSION === '5.0.0'`
- Same for `2.0.0`, `2.1.0`, `4.0.0` entries.

In `src/game/state/managers/save-load.js`:

Import the new migration:
```javascript
import {
  // ...existing imports...
  migrateFromV4_1ToV5,
} from '../state-validators.js';
```

Add to `applyMigrations()` at the end:

```javascript
// Migrate from v4.1.0 to v5.0.0 if needed
if (migratedState.meta.version === '4.1.0' && GAME_VERSION === '5.0.0') {
  migratedState = migrateFromV4_1ToV5(
    migratedState,
    this.isTestEnvironment
  );
}
```

Also update existing migration target checks from `GAME_VERSION === '4.1.0'` to `GAME_VERSION === '5.0.0'` (same as in isVersionCompatible).

In `emitLoadedStateEvents()`, add at the end:

```javascript
if (loadedState.missions) {
  this.emit('missionsChanged', loadedState.missions);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-state-initialization.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass. If any existing tests assert `GAME_VERSION === '4.1.0'`, update them to `'5.0.0'`.

**Step 6: Commit**

```bash
git add src/game/constants.js src/game/state/managers/initialization.js src/game/state/managers/event-system.js src/game/state/state-validators.js src/game/state/managers/save-load.js tests/unit/mission-state-initialization.test.js
git commit -m "feat: add mission state initialization with save migration to v5.0.0"
```

---

### Task 3: MissionManager Core — Accept & Reject

Create the MissionManager with mission acceptance logic and register it in GameStateManager.

**Files:**
- Create: `src/game/state/managers/mission.js`
- Modify: `src/game/state/game-state-manager.js` (register manager + delegation)
- Test: `tests/unit/mission-manager.test.js`

**Step 1: Write the failing test for mission acceptance**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('MissionManager', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  describe('acceptMission', () => {
    const testMission = {
      id: 'test_delivery_001',
      type: 'delivery',
      title: 'Test Delivery',
      description: 'Deliver goods.',
      giver: 'station_master',
      giverSystem: 0,
      requirements: {
        cargo: 'grain',
        quantity: 10,
        destination: 4,
        deadline: 7,
      },
      rewards: { credits: 500 },
      penalties: { failure: { credits: 0 } },
    };

    it('should accept a mission and add it to active missions', () => {
      const result = manager.acceptMission(testMission);

      expect(result.success).toBe(true);
      const state = manager.getState();
      expect(state.missions.active).toHaveLength(1);
      expect(state.missions.active[0].id).toBe('test_delivery_001');
      expect(state.missions.active[0].acceptedDay).toBe(0);
      expect(state.missions.active[0].deadlineDay).toBe(7);
    });

    it('should reject mission when max active missions reached', () => {
      for (let i = 0; i < 3; i++) {
        manager.acceptMission({ ...testMission, id: `mission_${i}` });
      }

      const result = manager.acceptMission({ ...testMission, id: 'mission_overflow' });
      expect(result.success).toBe(false);
      expect(result.reason).toContain('maximum');
    });

    it('should reject duplicate mission', () => {
      manager.acceptMission(testMission);
      const result = manager.acceptMission(testMission);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('already');
    });

    it('should emit missionsChanged on acceptance', () => {
      let emitted = null;
      manager.subscribe('missionsChanged', (data) => { emitted = data; });

      manager.acceptMission(testMission);

      expect(emitted).not.toBeNull();
      expect(emitted.active).toHaveLength(1);
    });

    it('should return active missions list', () => {
      expect(manager.getActiveMissions()).toEqual([]);

      manager.acceptMission(testMission);
      expect(manager.getActiveMissions()).toHaveLength(1);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-manager.test.js`
Expected: FAIL — `manager.acceptMission is not a function`

**Step 3: Create MissionManager and register it**

Create `src/game/state/managers/mission.js`:

```javascript
import { BaseManager } from './base-manager.js';
import { MISSION_CONFIG } from '../../constants.js';

export class MissionManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  acceptMission(mission) {
    this.validateState();
    const state = this.getState();

    if (state.missions.active.length >= MISSION_CONFIG.MAX_ACTIVE) {
      return { success: false, reason: 'You have the maximum number of active missions.' };
    }

    if (state.missions.active.some((m) => m.id === mission.id)) {
      return { success: false, reason: 'You already have this mission active.' };
    }

    const activeMission = {
      ...mission,
      acceptedDay: state.player.daysElapsed,
      deadlineDay: state.player.daysElapsed + mission.requirements.deadline,
    };

    state.missions.active.push(activeMission);
    this.emit('missionsChanged', state.missions);
    this.gameStateManager.saveGame();

    return { success: true };
  }

  getActiveMissions() {
    this.validateState();
    return this.getState().missions.active;
  }
}
```

In `src/game/state/game-state-manager.js`:

Add import:
```javascript
import { MissionManager } from './managers/mission.js';
```

In the constructor, after `this.dangerManager = new DangerManager(this);` add:
```javascript
this.missionManager = new MissionManager(this);
```

Add delegation methods (in a new section after the danger section):
```javascript
// ========================================================================
// MISSION SYSTEM
// ========================================================================

acceptMission(mission) {
  return this.missionManager.acceptMission(mission);
}

getActiveMissions() {
  return this.missionManager.getActiveMissions();
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-manager.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/game/state/managers/mission.js src/game/state/game-state-manager.js tests/unit/mission-manager.test.js
git commit -m "feat: add MissionManager with mission acceptance"
```

---

### Task 4: Mission Completion

Add mission completion logic with type-specific requirement checking and reward application.

**Files:**
- Modify: `src/game/state/managers/mission.js`
- Modify: `src/game/state/game-state-manager.js` (delegation)
- Test: `tests/unit/mission-completion.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Completion', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should complete a delivery mission when at destination with cargo', () => {
    const mission = {
      id: 'test_delivery',
      type: 'delivery',
      title: 'Test Delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 0, deadline: 7 },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const creditsBefore = manager.getState().player.credits;
    const result = manager.completeMission('test_delivery');
    expect(result.success).toBe(true);
    expect(result.rewards).toEqual({ credits: 500 });

    const state = manager.getState();
    expect(state.missions.active).toHaveLength(0);
    expect(state.missions.completed).toContain('test_delivery');
    expect(state.player.credits).toBe(creditsBefore + 500);
  });

  it('should reject completion if not at destination', () => {
    const mission = {
      id: 'test_wrong_dest',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 7 },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const result = manager.completeMission('test_wrong_dest');
    expect(result.success).toBe(false);
    expect(result.reason).toContain('destination');
  });

  it('should reject completion if cargo requirements not met', () => {
    const mission = {
      id: 'test_no_cargo',
      type: 'delivery',
      requirements: { cargo: 'medicine', quantity: 10, destination: 0, deadline: 7 },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const result = manager.completeMission('test_no_cargo');
    expect(result.success).toBe(false);
    expect(result.reason).toContain('cargo');
  });

  it('should complete a fetch mission at giver system with cargo', () => {
    const mission = {
      id: 'test_fetch',
      type: 'fetch',
      title: 'Fetch Grain',
      giverSystem: 0,
      requirements: { cargo: 'grain', quantity: 5, deadline: 10 },
      rewards: { credits: 300 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const result = manager.completeMission('test_fetch');
    expect(result.success).toBe(true);
  });

  it('should complete an intel mission when all targets visited and at giver system', () => {
    const mission = {
      id: 'test_intel',
      type: 'intel',
      title: 'Scout Systems',
      giverSystem: 0,
      requirements: { targets: [0], deadline: 15 },
      rewards: { credits: 400 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const result = manager.completeMission('test_intel');
    expect(result.success).toBe(true);
  });

  it('should reject intel mission if not all targets visited', () => {
    const mission = {
      id: 'test_intel_fail',
      type: 'intel',
      giverSystem: 0,
      requirements: { targets: [0, 4, 7], deadline: 15 },
      rewards: { credits: 400 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const result = manager.completeMission('test_intel_fail');
    expect(result.success).toBe(false);
    expect(result.reason).toContain('visited');
  });

  it('should complete a passenger mission at destination', () => {
    const mission = {
      id: 'test_passenger',
      type: 'passenger',
      title: 'Transport Passenger',
      requirements: { destination: 0, deadline: 10 },
      passenger: { type: 'business', satisfaction: 50 },
      rewards: { credits: 800 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const result = manager.completeMission('test_passenger');
    expect(result.success).toBe(true);
  });

  it('should apply faction reputation rewards on completion', () => {
    const mission = {
      id: 'test_faction_rep',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 0, deadline: 7 },
      rewards: { credits: 500, faction: { civilians: 5 } },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);
    manager.completeMission('test_faction_rep');
    expect(manager.getFactionRep('civilians')).toBe(5);
  });

  it('should apply NPC rep rewards on completion', () => {
    const mission = {
      id: 'test_npc_rep',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 0, deadline: 7 },
      rewards: { credits: 500, rep: { test_npc: 10 } },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);
    manager.completeMission('test_npc_rep');
    expect(manager.getNPCState('test_npc').rep).toBe(10);
  });

  it('should apply karma rewards on completion', () => {
    const mission = {
      id: 'test_karma',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 0, deadline: 7 },
      rewards: { credits: 500, karma: 2 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);
    manager.completeMission('test_karma');
    expect(manager.getKarma()).toBe(2);
  });

  it('should return not found for unknown mission id', () => {
    const result = manager.completeMission('nonexistent');
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-completion.test.js`
Expected: FAIL — `manager.completeMission is not a function`

**Step 3: Implement completeMission in MissionManager**

Add to `src/game/state/managers/mission.js`:

```javascript
completeMission(missionId) {
  this.validateState();
  const state = this.getState();

  const missionIndex = state.missions.active.findIndex((m) => m.id === missionId);
  if (missionIndex === -1) {
    return { success: false, reason: 'Mission not found in active missions.' };
  }

  const mission = state.missions.active[missionIndex];

  // Type-specific requirement checks
  if (mission.type === 'delivery') {
    if (mission.requirements.destination !== state.player.currentSystem) {
      return { success: false, reason: 'You are not at the mission destination.' };
    }
    if (mission.requirements.cargo) {
      const totalCargo = state.ship.cargo
        .filter((c) => c.good === mission.requirements.cargo)
        .reduce((sum, c) => sum + c.qty, 0);
      if (totalCargo < mission.requirements.quantity) {
        return { success: false, reason: `Not enough ${mission.requirements.cargo} in cargo.` };
      }
    }
  }

  if (mission.type === 'fetch') {
    if (mission.giverSystem !== undefined && mission.giverSystem !== state.player.currentSystem) {
      return { success: false, reason: 'You are not at the mission destination.' };
    }
    if (mission.requirements.cargo) {
      const totalCargo = state.ship.cargo
        .filter((c) => c.good === mission.requirements.cargo)
        .reduce((sum, c) => sum + c.qty, 0);
      if (totalCargo < mission.requirements.quantity) {
        return { success: false, reason: `Not enough ${mission.requirements.cargo} in cargo.` };
      }
    }
  }

  if (mission.type === 'intel') {
    if (mission.giverSystem !== undefined && mission.giverSystem !== state.player.currentSystem) {
      return { success: false, reason: 'You are not at the mission destination.' };
    }
    if (mission.requirements.targets) {
      const unvisited = mission.requirements.targets.filter(
        (t) => !state.world.visitedSystems.includes(t)
      );
      if (unvisited.length > 0) {
        return { success: false, reason: 'Not all target systems have been visited.' };
      }
    }
  }

  if (mission.type === 'passenger') {
    if (mission.requirements.destination !== state.player.currentSystem) {
      return { success: false, reason: 'You are not at the passenger destination.' };
    }
  }

  // Remove from active, add to completed
  state.missions.active.splice(missionIndex, 1);
  state.missions.completed.push(missionId);

  // Apply credit rewards
  if (mission.rewards.credits) {
    state.player.credits += mission.rewards.credits;
    this.emit('creditsChanged', state.player.credits);
  }

  // Apply faction reputation rewards
  if (mission.rewards.faction) {
    for (const [faction, amount] of Object.entries(mission.rewards.faction)) {
      this.gameStateManager.modifyFactionRep(faction, amount, 'mission');
    }
  }

  // Apply NPC reputation rewards
  if (mission.rewards.rep) {
    for (const [npcId, amount] of Object.entries(mission.rewards.rep)) {
      this.gameStateManager.modifyRep(npcId, amount, 'mission');
    }
  }

  // Apply karma rewards
  if (mission.rewards.karma) {
    this.gameStateManager.modifyKarma(mission.rewards.karma, 'mission');
  }

  this.emit('missionsChanged', state.missions);
  this.gameStateManager.saveGame();

  return { success: true, rewards: mission.rewards };
}
```

Add delegation in `src/game/state/game-state-manager.js`:

```javascript
completeMission(missionId) {
  return this.missionManager.completeMission(missionId);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-completion.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/game/state/managers/mission.js src/game/state/game-state-manager.js tests/unit/mission-completion.test.js
git commit -m "feat: add mission completion with type-specific checks and rewards"
```

---

### Task 5: Mission Deadline Checking & Failure

Fail missions when their deadline expires during time advancement.

**Files:**
- Modify: `src/game/state/managers/mission.js`
- Modify: `src/game/state/managers/events.js` (hook into updateTime)
- Modify: `src/game/state/game-state-manager.js` (delegation)
- Test: `tests/unit/mission-deadlines.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Deadline Checking', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should fail missions past their deadline when time advances', () => {
    const mission = {
      id: 'test_timed',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 5 },
      rewards: { credits: 500 },
      penalties: { failure: { rep: { station_master: -2 } } },
    };
    manager.acceptMission(mission);

    manager.updateTime(6);

    const state = manager.getState();
    expect(state.missions.active).toHaveLength(0);
    expect(state.missions.failed).toContain('test_timed');
  });

  it('should apply failure penalties when deadline expires', () => {
    const mission = {
      id: 'test_penalty',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 3 },
      rewards: { credits: 500 },
      penalties: { failure: { karma: -1 } },
    };
    manager.acceptMission(mission);

    manager.updateTime(4);

    expect(manager.getKarma()).toBe(-1);
  });

  it('should not fail missions before their deadline', () => {
    const mission = {
      id: 'test_safe',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 10 },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    manager.updateTime(5);

    const state = manager.getState();
    expect(state.missions.active).toHaveLength(1);
  });

  it('should emit missionsChanged when missions fail', () => {
    const mission = {
      id: 'test_emit',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 2 },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    let emitted = null;
    manager.subscribe('missionsChanged', (data) => { emitted = data; });

    manager.updateTime(3);

    expect(emitted).not.toBeNull();
    expect(emitted.active).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-deadlines.test.js`
Expected: FAIL

**Step 3: Implement checkMissionDeadlines**

Add to `src/game/state/managers/mission.js`:

```javascript
checkMissionDeadlines() {
  this.validateState();
  const state = this.getState();
  const currentDay = state.player.daysElapsed;

  const expired = [];
  const remaining = [];

  for (const mission of state.missions.active) {
    if (mission.deadlineDay !== undefined && currentDay > mission.deadlineDay) {
      expired.push(mission);
    } else {
      remaining.push(mission);
    }
  }

  if (expired.length === 0) return;

  state.missions.active = remaining;

  for (const mission of expired) {
    state.missions.failed.push(mission.id);

    // Apply failure penalties
    if (mission.penalties && mission.penalties.failure) {
      if (mission.penalties.failure.rep) {
        for (const [npcId, amount] of Object.entries(mission.penalties.failure.rep)) {
          this.gameStateManager.modifyRep(npcId, amount, 'mission_fail');
        }
      }
      if (mission.penalties.failure.karma) {
        this.gameStateManager.modifyKarma(mission.penalties.failure.karma, 'mission_fail');
      }
    }
  }

  this.emit('missionsChanged', state.missions);
}
```

Add delegation in `src/game/state/game-state-manager.js`:

```javascript
checkMissionDeadlines() {
  return this.missionManager.checkMissionDeadlines();
}
```

In `src/game/state/managers/events.js`, inside `updateTime()`, add after `this.gameStateManager.checkLoanDefaults();`:

```javascript
this.gameStateManager.checkMissionDeadlines();
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-deadlines.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/game/state/managers/mission.js src/game/state/managers/events.js src/game/state/game-state-manager.js tests/unit/mission-deadlines.test.js
git commit -m "feat: add mission deadline checking with failure penalties"
```

---

### Task 6: Mission Abandonment

Allow players to voluntarily abandon active missions with failure penalties.

**Files:**
- Modify: `src/game/state/managers/mission.js`
- Modify: `src/game/state/game-state-manager.js` (delegation)
- Test: `tests/unit/mission-abandonment.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Abandonment', () => {
  let manager;

  const testMission = {
    id: 'test_delivery_001',
    type: 'delivery',
    title: 'Test Delivery',
    giver: 'station_master',
    giverSystem: 0,
    requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 7 },
    rewards: { credits: 500 },
    penalties: { failure: { rep: { station_master: -2 }, karma: -1 } },
  };

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should remove mission from active and add to failed', () => {
    manager.acceptMission(testMission);
    const result = manager.abandonMission('test_delivery_001');

    expect(result.success).toBe(true);
    expect(manager.getActiveMissions()).toHaveLength(0);
    expect(manager.getState().missions.failed).toContain('test_delivery_001');
  });

  it('should apply failure penalties (rep and karma)', () => {
    manager.acceptMission(testMission);
    manager.abandonMission(testMission.id);

    expect(manager.getNPCState('station_master').rep).toBeLessThan(0);
    expect(manager.getKarma()).toBe(-1);
  });

  it('should fail if mission not found', () => {
    const result = manager.abandonMission('nonexistent');
    expect(result.success).toBe(false);
  });

  it('should emit missionsChanged event', () => {
    manager.acceptMission(testMission);
    let emitted = null;
    manager.subscribe('missionsChanged', (data) => { emitted = data; });
    manager.abandonMission(testMission.id);
    expect(emitted).not.toBeNull();
    expect(emitted.active).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-abandonment.test.js`
Expected: FAIL — `manager.abandonMission is not a function`

**Step 3: Implement abandonMission**

Add to `src/game/state/managers/mission.js`:

```javascript
abandonMission(missionId) {
  this.validateState();
  const state = this.getState();

  const missionIndex = state.missions.active.findIndex((m) => m.id === missionId);
  if (missionIndex === -1) {
    return { success: false, reason: 'Mission not found in active missions.' };
  }

  const mission = state.missions.active[missionIndex];

  // Remove from active, add to failed
  state.missions.active.splice(missionIndex, 1);
  state.missions.failed.push(missionId);

  // Apply failure penalties
  if (mission.penalties && mission.penalties.failure) {
    if (mission.penalties.failure.rep) {
      for (const [npcId, amount] of Object.entries(mission.penalties.failure.rep)) {
        this.gameStateManager.modifyRep(npcId, amount, 'mission_abandon');
      }
    }
    if (mission.penalties.failure.karma) {
      this.gameStateManager.modifyKarma(mission.penalties.failure.karma, 'mission_abandon');
    }
  }

  this.emit('missionsChanged', state.missions);
  this.gameStateManager.saveGame();

  return { success: true };
}
```

Add delegation in `src/game/state/game-state-manager.js`:

```javascript
abandonMission(missionId) {
  return this.missionManager.abandonMission(missionId);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-abandonment.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/game/state/managers/mission.js src/game/state/game-state-manager.js tests/unit/mission-abandonment.test.js
git commit -m "feat: add mission abandonment with failure penalties"
```

---

### Task 7: Cargo Removal Helper for Delivery Missions

Add a helper to remove specific cargo quantities for delivery/fetch mission completion.

**Files:**
- Modify: `src/game/state/managers/ship.js`
- Modify: `src/game/state/game-state-manager.js` (delegation)
- Test: `tests/unit/mission-cargo-removal.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Cargo Removal', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should remove exact quantity from a single cargo stack', () => {
    // Player starts with 20 grain
    const result = manager.removeCargoForMission('grain', 10);
    expect(result.success).toBe(true);

    const state = manager.getState();
    const grainTotal = state.ship.cargo
      .filter((c) => c.good === 'grain')
      .reduce((sum, c) => sum + c.qty, 0);
    expect(grainTotal).toBe(10);
  });

  it('should fail if not enough cargo', () => {
    const result = manager.removeCargoForMission('grain', 100);
    expect(result.success).toBe(false);
  });

  it('should remove empty stacks after removal', () => {
    manager.removeCargoForMission('grain', 20);
    const state = manager.getState();
    const grainStacks = state.ship.cargo.filter((c) => c.good === 'grain');
    expect(grainStacks).toHaveLength(0);
  });

  it('should fail for cargo not present', () => {
    const result = manager.removeCargoForMission('medicine', 5);
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-cargo-removal.test.js`
Expected: FAIL — `manager.removeCargoForMission is not a function`

**Step 3: Implement removeCargoForMission**

Add to `src/game/state/managers/ship.js`:

```javascript
removeCargoForMission(goodType, quantity) {
  this.validateState();
  const state = this.getState();
  const relevantStacks = state.ship.cargo.filter((c) => c.good === goodType);
  const totalAvailable = relevantStacks.reduce((sum, c) => sum + c.qty, 0);

  if (totalAvailable < quantity) {
    return { success: false, reason: `Not enough ${goodType}.` };
  }

  let remaining = quantity;
  for (let i = state.ship.cargo.length - 1; i >= 0 && remaining > 0; i--) {
    if (state.ship.cargo[i].good === goodType) {
      const removeFromStack = Math.min(state.ship.cargo[i].qty, remaining);
      state.ship.cargo[i].qty -= removeFromStack;
      remaining -= removeFromStack;
      if (state.ship.cargo[i].qty <= 0) {
        state.ship.cargo.splice(i, 1);
      }
    }
  }

  this.emit('cargoChanged', state.ship.cargo);
  return { success: true };
}
```

Add delegation in `src/game/state/game-state-manager.js`:

```javascript
removeCargoForMission(goodType, quantity) {
  return this.shipManager.removeCargoForMission(goodType, quantity);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-cargo-removal.test.js`
Expected: PASS

**Step 5: Wire cargo removal into completeMission**

In `src/game/state/managers/mission.js`, in `completeMission()`, add after the karma reward section and before the final emit:

```javascript
// Remove delivered cargo for delivery/fetch missions
if ((mission.type === 'delivery' || mission.type === 'fetch') && mission.requirements.cargo) {
  this.gameStateManager.removeCargoForMission(
    mission.requirements.cargo,
    mission.requirements.quantity
  );
}
```

**Step 6: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/game/state/managers/ship.js src/game/state/managers/mission.js src/game/state/game-state-manager.js tests/unit/mission-cargo-removal.test.js
git commit -m "feat: add cargo removal helper for delivery mission completion"
```

---

### Task 8: Completable Mission Detection

Add a method to check which active missions can be completed at the current location.

**Files:**
- Modify: `src/game/state/managers/mission.js`
- Modify: `src/game/state/game-state-manager.js` (delegation)
- Test: `tests/unit/mission-completable.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Completable Mission Detection', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should return completable delivery mission at destination with cargo', () => {
    manager.acceptMission({
      id: 'completable_delivery',
      type: 'delivery',
      title: 'Grain to Sol',
      requirements: { cargo: 'grain', quantity: 10, destination: 0, deadline: 10 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
    expect(completable[0].id).toBe('completable_delivery');
  });

  it('should not return missions for wrong destination', () => {
    manager.acceptMission({
      id: 'wrong_dest',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 10 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(0);
  });

  it('should not return missions with insufficient cargo', () => {
    manager.acceptMission({
      id: 'not_enough',
      type: 'delivery',
      requirements: { cargo: 'medicine', quantity: 10, destination: 0, deadline: 10 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(0);
  });

  it('should return completable fetch mission at giver system', () => {
    manager.acceptMission({
      id: 'fetch_complete',
      type: 'fetch',
      giverSystem: 0,
      requirements: { cargo: 'grain', quantity: 5, deadline: 10 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
  });

  it('should return completable intel mission when all targets visited', () => {
    manager.acceptMission({
      id: 'intel_complete',
      type: 'intel',
      giverSystem: 0,
      requirements: { targets: [0], deadline: 10 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
  });

  it('should return completable passenger mission at destination', () => {
    manager.acceptMission({
      id: 'passenger_complete',
      type: 'passenger',
      requirements: { destination: 0, deadline: 10 },
      passenger: { type: 'business', satisfaction: 50 },
      rewards: { credits: 800 },
      penalties: { failure: {} },
    });

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-completable.test.js`
Expected: FAIL — `manager.getCompletableMissions is not a function`

**Step 3: Implement getCompletableMissions**

Add to `src/game/state/managers/mission.js`:

```javascript
getCompletableMissions() {
  this.validateState();
  const state = this.getState();

  return state.missions.active.filter((mission) => {
    if (mission.type === 'delivery') {
      if (mission.requirements.destination !== state.player.currentSystem) return false;
      if (mission.requirements.cargo) {
        const totalCargo = state.ship.cargo
          .filter((c) => c.good === mission.requirements.cargo)
          .reduce((sum, c) => sum + c.qty, 0);
        return totalCargo >= mission.requirements.quantity;
      }
      return true;
    }
    if (mission.type === 'fetch') {
      if (mission.giverSystem !== state.player.currentSystem) return false;
      if (mission.requirements.cargo) {
        const totalCargo = state.ship.cargo
          .filter((c) => c.good === mission.requirements.cargo)
          .reduce((sum, c) => sum + c.qty, 0);
        return totalCargo >= mission.requirements.quantity;
      }
      return true;
    }
    if (mission.type === 'intel') {
      if (mission.giverSystem !== state.player.currentSystem) return false;
      return mission.requirements.targets.every(
        (t) => state.world.visitedSystems.includes(t)
      );
    }
    if (mission.type === 'passenger') {
      return mission.requirements.destination === state.player.currentSystem;
    }
    return false;
  });
}
```

Add delegation in `src/game/state/game-state-manager.js`:

```javascript
getCompletableMissions() {
  return this.missionManager.getCompletableMissions();
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-completable.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/game/state/managers/mission.js src/game/state/game-state-manager.js tests/unit/mission-completable.test.js
git commit -m "feat: add completable mission detection at current location"
```

---

### Task 9: Repeatable Mission Generator

Generate cargo run missions procedurally based on current system and connected systems.

**Files:**
- Create: `src/game/mission-generator.js`
- Test: `tests/unit/mission-generator.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { generateCargoRun, generateMissionBoard } from '../../src/game/mission-generator.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Generator', () => {
  describe('generateCargoRun', () => {
    it('should generate a valid delivery mission', () => {
      const mission = generateCargoRun(0, TEST_STAR_DATA, TEST_WORMHOLE_DATA);

      expect(mission.id).toMatch(/^cargo_run_/);
      expect(mission.type).toBe('delivery');
      expect(mission.title).toContain('Cargo Run');
      expect(mission.requirements).toHaveProperty('cargo');
      expect(mission.requirements).toHaveProperty('quantity');
      expect(mission.requirements).toHaveProperty('destination');
      expect(mission.requirements).toHaveProperty('deadline');
      expect(mission.requirements.quantity).toBeGreaterThan(0);
      expect(mission.requirements.deadline).toBeGreaterThan(0);
      expect(mission.rewards.credits).toBeGreaterThan(0);
    });

    it('should generate destination that is a connected system', () => {
      const mission = generateCargoRun(0, TEST_STAR_DATA, TEST_WORMHOLE_DATA);
      // Sol (0) connects to: Alpha Centauri A (1), Barnard's Star (4), Sirius A (7)
      expect([1, 4, 7]).toContain(mission.requirements.destination);
    });

    it('should generate integer reward (no floating point)', () => {
      for (let i = 0; i < 20; i++) {
        const mission = generateCargoRun(0, TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        expect(Number.isInteger(mission.rewards.credits)).toBe(true);
      }
    });
  });

  describe('generateMissionBoard', () => {
    it('should generate the configured number of missions', () => {
      const board = generateMissionBoard(0, TEST_STAR_DATA, TEST_WORMHOLE_DATA);
      expect(board.length).toBeGreaterThan(0);
      expect(board.length).toBeLessThanOrEqual(3);
    });

    it('should generate unique mission IDs', () => {
      const board = generateMissionBoard(0, TEST_STAR_DATA, TEST_WORMHOLE_DATA);
      const ids = board.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-generator.test.js`
Expected: FAIL — module not found

**Step 3: Implement mission generator**

Create `src/game/mission-generator.js`:

```javascript
import { BASE_PRICES, MISSION_CONFIG, NAVIGATION_CONFIG } from './constants.js';

export function getConnectedSystems(systemId, wormholeData) {
  const connected = [];
  for (const [a, b] of wormholeData) {
    if (a === systemId) connected.push(b);
    if (b === systemId) connected.push(a);
  }
  return connected;
}

function calculateDistance(star1, star2) {
  const r = Math.hypot(star1.x - star2.x, star1.y - star2.y, star1.z - star2.z);
  return r * NAVIGATION_CONFIG.LY_PER_UNIT;
}

export function generateCargoRun(fromSystem, starData, wormholeData, rng = Math.random) {
  const connectedIds = getConnectedSystems(fromSystem, wormholeData);
  if (connectedIds.length === 0) return null;

  const toSystem = connectedIds[Math.floor(rng() * connectedIds.length)];
  const fromStar = starData.find((s) => s.id === fromSystem);
  const destStar = starData.find((s) => s.id === toSystem);

  const tradeableGoods = ['grain', 'ore', 'tritium', 'parts'];
  const good = tradeableGoods[Math.floor(rng() * tradeableGoods.length)];
  const qty = 10 + Math.floor(rng() * 20);

  const distance = (fromStar && destStar) ? calculateDistance(fromStar, destStar) : 5;
  const deadline = Math.ceil(distance * 2) + MISSION_CONFIG.DEADLINE_BUFFER_DAYS;

  const reward = Math.ceil(qty * BASE_PRICES[good] * MISSION_CONFIG.REWARD_MARKUP);

  return {
    id: `cargo_run_${Date.now()}_${Math.floor(rng() * 10000)}`,
    type: 'delivery',
    title: `Cargo Run: ${good} to ${destStar ? destStar.name : `System ${toSystem}`}`,
    description: 'Standard delivery contract.',
    giver: 'station_master',
    giverSystem: fromSystem,
    requirements: { cargo: good, quantity: qty, destination: toSystem, deadline },
    rewards: { credits: reward },
    penalties: { failure: { rep: { station_master: -2 } } },
  };
}

export function generateMissionBoard(systemId, starData, wormholeData, rng = Math.random) {
  const board = [];
  for (let i = 0; i < MISSION_CONFIG.BOARD_SIZE; i++) {
    const mission = generateCargoRun(systemId, starData, wormholeData, rng);
    if (mission) board.push(mission);
  }
  return board;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-generator.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/game/mission-generator.js tests/unit/mission-generator.test.js
git commit -m "feat: add procedural cargo run mission generator"
```

---

### Task 10: Mission Board Integration

Wire mission board generation into MissionManager so the board refreshes daily and is available at stations.

**Files:**
- Modify: `src/game/state/managers/mission.js`
- Modify: `src/game/state/game-state-manager.js` (delegation)
- Test: `tests/unit/mission-board.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Board', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should refresh mission board for current system', () => {
    const board = manager.refreshMissionBoard();

    expect(board).toBeInstanceOf(Array);
    expect(board.length).toBeGreaterThan(0);

    const state = manager.getState();
    expect(state.missions.board).toEqual(board);
    expect(state.missions.boardLastRefresh).toBe(0);
  });

  it('should return cached board if refreshed same day', () => {
    const board1 = manager.refreshMissionBoard();
    const board2 = manager.refreshMissionBoard();

    expect(board2).toEqual(board1);
  });

  it('should generate new board after a day passes', () => {
    manager.refreshMissionBoard();

    manager.updateTime(1);
    manager.refreshMissionBoard();

    const state = manager.getState();
    expect(state.missions.boardLastRefresh).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-board.test.js`
Expected: FAIL — `manager.refreshMissionBoard is not a function`

**Step 3: Implement refreshMissionBoard**

Add to `src/game/state/managers/mission.js` (add import at top):

```javascript
import { generateMissionBoard } from '../../mission-generator.js';
```

Add method:

```javascript
refreshMissionBoard() {
  this.validateState();
  const state = this.getState();
  const currentDay = Math.floor(state.player.daysElapsed);

  if (state.missions.board.length > 0 && state.missions.boardLastRefresh === currentDay) {
    return state.missions.board;
  }

  const board = generateMissionBoard(
    state.player.currentSystem,
    this.gameStateManager.starData,
    this.gameStateManager.wormholeData
  );

  state.missions.board = board;
  state.missions.boardLastRefresh = currentDay;
  this.emit('missionsChanged', state.missions);

  return board;
}
```

Add delegation in `src/game/state/game-state-manager.js`:

```javascript
refreshMissionBoard() {
  return this.missionManager.refreshMissionBoard();
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-board.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/game/state/managers/mission.js src/game/state/game-state-manager.js tests/unit/mission-board.test.js
git commit -m "feat: add mission board refresh with daily generation"
```

---

### Task 11: Bridge Pattern Integration

Add mission events and actions to the Bridge Pattern hooks.

**Files:**
- Modify: `src/hooks/useGameEvent.js`
- Modify: `src/hooks/useGameAction.js`
- Test: `tests/unit/mission-bridge-pattern.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Bridge Pattern', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should emit missionsChanged when mission is accepted', () => {
    let emitted = null;
    manager.subscribe('missionsChanged', (data) => { emitted = data; });

    manager.acceptMission({
      id: 'test_bridge',
      type: 'delivery',
      title: 'Bridge Test',
      requirements: { cargo: 'grain', quantity: 5, destination: 4, deadline: 5 },
      rewards: { credits: 100 },
      penalties: { failure: {} },
    });

    expect(emitted).not.toBeNull();
    expect(emitted.active).toHaveLength(1);
  });

  it('should emit missionsChanged when mission is completed', () => {
    manager.acceptMission({
      id: 'test_bridge_complete',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 5, destination: 0, deadline: 5 },
      rewards: { credits: 100 },
      penalties: { failure: {} },
    });

    let emitted = null;
    manager.subscribe('missionsChanged', (data) => { emitted = data; });
    manager.completeMission('test_bridge_complete');

    expect(emitted).not.toBeNull();
    expect(emitted.active).toHaveLength(0);
    expect(emitted.completed).toContain('test_bridge_complete');
  });
});
```

**Step 2: Run test — this should already pass since events were wired in Tasks 2-3**

Run: `npm test -- tests/unit/mission-bridge-pattern.test.js`
Expected: PASS

**Step 3: Add missionsChanged to useGameEvent.js eventStateMap**

In `src/hooks/useGameEvent.js`, add to the `eventStateMap` object:

```javascript
missionsChanged: state.missions || { active: [], completed: [], failed: [], board: [], boardLastRefresh: 0 },
```

**Step 4: Add mission actions to useGameAction.js**

In `src/hooks/useGameAction.js`, add to the actions object:

```javascript
acceptMission: (mission) => gameStateManager.acceptMission(mission),
completeMission: (missionId) => gameStateManager.completeMission(missionId),
abandonMission: (missionId) => gameStateManager.abandonMission(missionId),
refreshMissionBoard: () => gameStateManager.refreshMissionBoard(),
getActiveMissions: () => gameStateManager.getActiveMissions(),
getCompletableMissions: () => gameStateManager.getCompletableMissions(),
```

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/hooks/useGameEvent.js src/hooks/useGameAction.js tests/unit/mission-bridge-pattern.test.js
git commit -m "feat: add mission events and actions to Bridge Pattern hooks"
```

---

### Task 12: Mission Board Panel UI

Create the MissionBoardPanel component and wire it into PanelContainer and StationMenu.

**Files:**
- Create: `src/features/missions/MissionBoardPanel.jsx`
- Modify: `src/features/station/StationMenu.jsx`
- Modify: `src/features/station/PanelContainer.jsx`

**Step 1: Create MissionBoardPanel component**

Create `src/features/missions/MissionBoardPanel.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';

export function MissionBoardPanel({ onClose }) {
  const missions = useGameEvent('missionsChanged');
  const { acceptMission, refreshMissionBoard } = useGameAction();
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    refreshMissionBoard();
  }, [refreshMissionBoard]);

  const handleAccept = (mission) => {
    const result = acceptMission(mission);
    if (!result.success) {
      setFeedback(result.reason);
    } else {
      setFeedback(`Accepted: ${mission.title}`);
    }
  };

  return (
    <div className="panel mission-board-panel">
      <button className="close-btn" onClick={onClose}>&times;</button>
      <h2>Mission Board</h2>
      {feedback && <div className="mission-feedback">{feedback}</div>}
      <div className="mission-list">
        {missions?.board?.map((mission) => (
          <div key={mission.id} className="mission-card">
            <h3>{mission.title}</h3>
            <p>{mission.description}</p>
            <div className="mission-details">
              <div>Deliver: {mission.requirements.quantity} {mission.requirements.cargo}</div>
              <div>Deadline: {mission.requirements.deadline} days</div>
              <div>Reward: ₡{mission.rewards.credits}</div>
            </div>
            <button className="accept-btn" onClick={() => handleAccept(mission)}>
              Accept
            </button>
          </div>
        ))}
        {(!missions?.board || missions.board.length === 0) && (
          <p>No contracts available. Check back tomorrow.</p>
        )}
      </div>
      <button className="station-btn" onClick={onClose}>Back</button>
    </div>
  );
}
```

**Step 2: Add to PanelContainer**

In `src/features/station/PanelContainer.jsx`, add import:
```javascript
import { MissionBoardPanel } from '../missions/MissionBoardPanel.jsx';
```

Add case in the switch:
```javascript
case 'mission-board':
  return <MissionBoardPanel onClose={onClose} />;
```

**Step 3: Add to StationMenu**

In `src/features/station/StationMenu.jsx`, add a "Mission Board" button alongside existing station buttons:

```jsx
<button className="station-btn" onClick={() => onOpenPanel('mission-board')}>
  Mission Board
</button>
```

**Step 4: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/features/missions/MissionBoardPanel.jsx src/features/station/StationMenu.jsx src/features/station/PanelContainer.jsx
git commit -m "feat: add Mission Board panel with station menu integration"
```

---

### Task 13: Active Missions HUD Display

Show active missions in the HUD so the player can track progress.

**Files:**
- Create: `src/features/hud/ActiveMissions.jsx`
- Modify: `src/features/hud/HUD.jsx`

**Step 1: Create ActiveMissions component**

Create `src/features/hud/ActiveMissions.jsx`:

```jsx
import { useGameEvent } from '../../hooks/useGameEvent';

export function ActiveMissions() {
  const missions = useGameEvent('missionsChanged');
  const daysElapsed = useGameEvent('timeChanged');

  if (!missions?.active?.length) return null;

  return (
    <div className="active-missions-hud">
      <h4>Active Missions</h4>
      {missions.active.map((mission) => {
        const daysRemaining = Math.max(0, Math.ceil(mission.deadlineDay - daysElapsed));
        const isUrgent = daysRemaining <= 2;

        return (
          <div key={mission.id} className={`mission-hud-item ${isUrgent ? 'urgent' : ''}`}>
            <div className="mission-hud-title">{mission.title}</div>
            <div className="mission-hud-deadline">
              {daysRemaining > 0 ? `${daysRemaining}d remaining` : 'EXPIRED'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Add to HUD.jsx**

In `src/features/hud/HUD.jsx`, import and render `<ActiveMissions />`:

```javascript
import { ActiveMissions } from './ActiveMissions.jsx';
```

Add `<ActiveMissions />` inside the HUD div, after existing components.

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/features/hud/ActiveMissions.jsx src/features/hud/HUD.jsx
git commit -m "feat: add active mission tracking display in HUD"
```

---

### Task 14: Integration Test — Full Mission Lifecycle

Write an integration test covering the full mission flow: board → accept → complete.

**Files:**
- Test: `tests/integration/mission-flow.test.js`

**Step 1: Write the integration test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Flow Integration', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should complete full mission lifecycle: board → accept → travel → complete', () => {
    // 1. Generate mission board at Sol
    const board = manager.refreshMissionBoard();
    expect(board.length).toBeGreaterThan(0);

    // 2. Accept first mission
    const mission = board[0];
    const acceptResult = manager.acceptMission(mission);
    expect(acceptResult.success).toBe(true);
    expect(manager.getActiveMissions()).toHaveLength(1);

    // 3. Move to destination and ensure cargo
    const activeMission = manager.getActiveMissions()[0];
    manager.updateLocation(activeMission.requirements.destination);

    const state = manager.getState();
    const existingCargo = state.ship.cargo
      .filter((c) => c.good === activeMission.requirements.cargo)
      .reduce((sum, c) => sum + c.qty, 0);

    if (existingCargo < activeMission.requirements.quantity) {
      state.ship.cargo.push({
        good: activeMission.requirements.cargo,
        qty: activeMission.requirements.quantity,
        buyPrice: 10,
        buySystem: 0,
        buySystemName: 'Sol',
        buyDate: 0,
      });
    }

    // 4. Complete mission
    const creditsBefore = state.player.credits;
    const completeResult = manager.completeMission(activeMission.id);
    expect(completeResult.success).toBe(true);

    // 5. Verify rewards applied
    expect(state.player.credits).toBe(creditsBefore + activeMission.rewards.credits);
    expect(manager.getActiveMissions()).toHaveLength(0);
    expect(state.missions.completed).toContain(activeMission.id);
  });

  it('should handle mission abandonment flow', () => {
    const board = manager.refreshMissionBoard();
    manager.acceptMission(board[0]);
    expect(manager.getActiveMissions()).toHaveLength(1);

    const result = manager.abandonMission(board[0].id);
    expect(result.success).toBe(true);
    expect(manager.getActiveMissions()).toHaveLength(0);
    expect(manager.getState().missions.failed).toContain(board[0].id);
  });

  it('should handle mission deadline expiry flow', () => {
    const board = manager.refreshMissionBoard();
    manager.acceptMission(board[0]);

    const activeMission = manager.getActiveMissions()[0];
    manager.updateTime(activeMission.deadlineDay + 1);

    expect(manager.getActiveMissions()).toHaveLength(0);
    expect(manager.getState().missions.failed).toContain(activeMission.id);
  });
});
```

**Step 2: Run test**

Run: `npm test -- tests/integration/mission-flow.test.js`
Expected: PASS

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add tests/integration/mission-flow.test.js
git commit -m "test: add mission flow integration test"
```

---

### Task 15: Final Verification

Run all tests, lint, and verify no regressions.

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass with zero stderr warnings.

**Step 2: Run lint and format**

Run: `npm run clean`
Expected: No lint errors, all files formatted.

**Step 3: Fix any issues found, commit**

If any issues are found, fix and commit:

```bash
git add -A
git commit -m "fix: address lint and test issues from final verification"
```

---

## Execution Notes

**Task dependencies:**
- Task 1 must complete before Task 2 (constants needed)
- Task 2 must complete before Task 3 (state initialization needed)
- Task 3 must complete before Tasks 4, 5, 6, 8 (MissionManager needed)
- Task 7 must complete before its wiring into Task 4's completeMission (cargo removal needed)
- Task 9 must complete before Task 10 (generator needed for board)
- Tasks 3-10 must complete before Task 11 (all methods needed for hooks)
- Task 11 must complete before Tasks 12, 13 (hooks needed for UI)
- Task 14 depends on Tasks 1-10

**Out of scope (future specs):**
- Narrative events and event engine (Spec 06.2)
- Passenger system with satisfaction/generation (Spec 06.3)
- NPC mission offers via dialogue integration (Spec 06.2/06.3)
- Event chains, dock/jump/time/condition events (Spec 06.2)
- Passenger board UI (Spec 06.3)
- Mission completion auto-check on dock (Spec 06.2 — ties to dock events)
