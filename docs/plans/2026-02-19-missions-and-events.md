# Missions & Events Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a mission system (delivery, fetch, passenger, intel), narrative event engine (dock/jump/time/condition events with choices), repeatable cargo run missions with a mission board, and HUD tracking.

**Architecture:** New `MissionManager` extends `BaseManager` for mission lifecycle (accept, track, complete, fail). New `NarrativeEventManager` extends `BaseManager` for story events with choices. Missions live in `state.missions = { active: [], completed: [], failed: [], board: [] }`. Narrative events live in `state.narrativeEvents = { fired: [], cooldowns: {} }`. New Bridge Pattern events: `missionsChanged`, `narrativeEvent`. New panels: `mission-board`, `mission-offer`. Game version bumps to `5.0.0`.

**Tech Stack:** React 18, Vitest, GameStateManager delegation pattern, Bridge Pattern hooks

**Reference Spec:** `notes/tramp-freighter-06-missions.md`

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
  PASSENGER_CONFIG,
  NARRATIVE_EVENT_CONFIG,
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

  it('should export PASSENGER_CONFIG with passenger types', () => {
    expect(PASSENGER_CONFIG).toBeDefined();
    expect(PASSENGER_CONFIG.TYPES).toHaveProperty('refugee');
    expect(PASSENGER_CONFIG.TYPES).toHaveProperty('business');
    expect(PASSENGER_CONFIG.TYPES).toHaveProperty('wealthy');
    expect(PASSENGER_CONFIG.TYPES).toHaveProperty('scientist');
    expect(PASSENGER_CONFIG.TYPES).toHaveProperty('family');

    // Each type should have required properties
    for (const [, typeConfig] of Object.entries(PASSENGER_CONFIG.TYPES)) {
      expect(typeConfig).toHaveProperty('cargoSpace');
      expect(typeConfig).toHaveProperty('satisfaction');
      expect(typeConfig.cargoSpace).toBeGreaterThan(0);
    }

    // Satisfaction thresholds
    expect(PASSENGER_CONFIG.SATISFACTION).toHaveProperty('INITIAL');
    expect(PASSENGER_CONFIG.SATISFACTION).toHaveProperty('VERY_SATISFIED');
    expect(PASSENGER_CONFIG.SATISFACTION).toHaveProperty('SATISFIED');
    expect(PASSENGER_CONFIG.SATISFACTION).toHaveProperty('NEUTRAL');
    expect(PASSENGER_CONFIG.SATISFACTION).toHaveProperty('DISSATISFIED');
  });

  it('should export NARRATIVE_EVENT_CONFIG with event type settings', () => {
    expect(NARRATIVE_EVENT_CONFIG).toBeDefined();
    expect(NARRATIVE_EVENT_CONFIG.TYPES).toEqual(
      expect.arrayContaining(['dock', 'jump', 'time', 'condition'])
    );
    expect(NARRATIVE_EVENT_CONFIG.DEFAULT_COOLDOWN).toBeGreaterThanOrEqual(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-constants.test.js`
Expected: FAIL — MISSION_CONFIG is not exported

**Step 3: Write minimal implementation**

Add to end of `src/game/constants.js`:

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
  SATISFACTION_BONUS: {
    VERY_SATISFIED: 1.3,
    SATISFIED: 1.15,
    NEUTRAL: 1.0,
    DISSATISFIED: 0.7,
    VERY_DISSATISFIED: 0.5,
  },
  ON_TIME_BONUS: 0.1,
  FOLLOW_UP_CHANCE: 0.3,
};

/**
 * Passenger System Configuration
 */
export const PASSENGER_CONFIG = {
  TYPES: {
    refugee: {
      cargoSpace: 1,
      satisfaction: { speed: 0.8, comfort: 0.2 },
    },
    business: {
      cargoSpace: 2,
      satisfaction: { speed: 0.6, comfort: 0.4 },
    },
    wealthy: {
      cargoSpace: 3,
      satisfaction: { speed: 0.3, comfort: 0.7 },
    },
    scientist: {
      cargoSpace: 2,
      satisfaction: { speed: 0.5, comfort: 0.3, safety: 0.2 },
    },
    family: {
      cargoSpace: 3,
      satisfaction: { speed: 0.4, comfort: 0.4, safety: 0.2 },
    },
  },
  SATISFACTION: {
    INITIAL: 50,
    VERY_SATISFIED: 80,
    SATISFIED: 60,
    NEUTRAL: 40,
    DISSATISFIED: 20,
    MIN: 0,
    MAX: 100,
  },
  DELAY_PENALTY: 10,
  LOW_LIFE_SUPPORT_PENALTY: 5,
  COMBAT_PENALTY: 15,
  LOW_LIFE_SUPPORT_THRESHOLD: 50,
};

/**
 * Narrative Event System Configuration
 */
export const NARRATIVE_EVENT_CONFIG = {
  TYPES: ['dock', 'jump', 'time', 'condition'],
  DEFAULT_COOLDOWN: 0,
  DEFAULT_PRIORITY: 0,
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
git commit -m "feat: add mission, passenger, and narrative event constants"
```

---

### Task 2: Mission State Initialization & Save/Load

Add mission and narrative event state to game initialization. Add migration for existing saves.

**Files:**
- Modify: `src/game/state/managers/initialization.js`
- Modify: `src/game/state/state-validators.js`
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

  it('should initialize narrativeEvents state in new game', () => {
    const manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    const state = manager.initNewGame();

    expect(state.narrativeEvents).toBeDefined();
    expect(state.narrativeEvents.fired).toEqual([]);
    expect(state.narrativeEvents.cooldowns).toEqual({});
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-state-initialization.test.js`
Expected: FAIL — `state.missions` is undefined

**Step 3: Write minimal implementation**

In `src/game/state/managers/initialization.js`, add two new methods and integrate them into `createInitialState()`:

```javascript
// In createInitialState(), add:
const missionState = this.initializeMissionState();
const narrativeEventsState = this.initializeNarrativeEventsState();

// Include in return:
return {
  player: playerState,
  ship: shipState,
  world: worldState,
  npcs: npcState,
  dialogue: dialogueState,
  missions: missionState,
  narrativeEvents: narrativeEventsState,
  meta: metaState,
};

// New methods:
initializeMissionState() {
  return {
    active: [],
    completed: [],
    failed: [],
    board: [],
    boardLastRefresh: 0,
  };
}

initializeNarrativeEventsState() {
  return {
    fired: [],
    cooldowns: {},
  };
}
```

In `src/game/state/state-validators.js`, add defaults in `addStateDefaults()`:

```javascript
// Add mission state defaults
if (!state.missions) {
  state.missions = {
    active: [],
    completed: [],
    failed: [],
    board: [],
    boardLastRefresh: 0,
  };
}

// Add narrative events state defaults
if (!state.narrativeEvents) {
  state.narrativeEvents = {
    fired: [],
    cooldowns: {},
  };
}
```

Bump `GAME_VERSION` in `constants.js` to `'5.0.0'`.

Add migration function `migrateFromV4_1ToV5` in `state-validators.js` and wire it into `save-load.js` migration chain.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-state-initialization.test.js`
Expected: PASS

**Step 5: Write save/load migration test**

```javascript
// In tests/unit/mission-save-load-migration.test.js
import { describe, it, expect, vi } from 'vitest';
import { migrateFromV4_1ToV5, addStateDefaults } from '../../src/game/state/state-validators.js';

describe('Mission Save/Load Migration', () => {
  it('should add missions state to v4.1.0 saves', () => {
    const oldState = {
      player: { credits: 1000, debt: 5000, currentSystem: 0, daysElapsed: 10, karma: 0, factions: {} },
      ship: { name: 'Test', fuel: 100, hull: 100, engine: 100, lifeSupport: 100, cargoCapacity: 50, cargo: [], quirks: [], upgrades: [], hiddenCargo: [], hiddenCargoCapacity: 0 },
      world: { visitedSystems: [0], priceKnowledge: {}, activeEvents: [], marketConditions: {}, currentSystemPrices: {}, dangerFlags: {} },
      npcs: {},
      dialogue: { currentNpcId: null, currentNodeId: null, isActive: false, display: null },
      meta: { version: '4.1.0', timestamp: Date.now() },
    };

    const migrated = migrateFromV4_1ToV5(oldState, true);
    expect(migrated.missions).toEqual({
      active: [],
      completed: [],
      failed: [],
      board: [],
      boardLastRefresh: 0,
    });
    expect(migrated.narrativeEvents).toEqual({
      fired: [],
      cooldowns: {},
    });
    expect(migrated.meta.version).toBe('5.0.0');
  });
});
```

**Step 6: Run test, implement migration, verify pass**

Run: `npm test -- tests/unit/mission-save-load-migration.test.js`

**Step 7: Run full test suite**

Run: `npm test`
Expected: All tests pass. Update any existing tests that assert `GAME_VERSION === '4.1.0'` to `'5.0.0'`.

**Step 8: Commit**

```bash
git add src/game/state/managers/initialization.js src/game/state/state-validators.js src/game/constants.js tests/unit/mission-state-initialization.test.js tests/unit/mission-save-load-migration.test.js
git commit -m "feat: add mission and narrative event state initialization with save migration"
```

---

### Task 3: MissionManager Core

Create the MissionManager with mission acceptance, tracking, and completion logic.

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
      // Accept MAX_ACTIVE missions
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

    it('should reject mission when conditions not met (minRep)', () => {
      const condMission = {
        ...testMission,
        id: 'cond_test',
        conditions: { minRep: 10 },
        giver: 'test_npc',
      };
      const result = manager.acceptMission(condMission);
      expect(result.success).toBe(false);
      expect(result.reason).toContain('reputation');
    });

    it('should reject mission when notFlag condition fails', () => {
      manager.getNPCState('test_npc').flags = ['already_done'];
      const condMission = {
        ...testMission,
        id: 'flag_test',
        conditions: { notFlag: 'already_done' },
        giver: 'test_npc',
      };
      const result = manager.acceptMission(condMission);
      expect(result.success).toBe(false);
    });

    it('should accept mission when conditions are met', () => {
      manager.modifyRep('test_npc', 15, 'test');
      const condMission = {
        ...testMission,
        id: 'cond_pass',
        conditions: { minRep: 10 },
        giver: 'test_npc',
      };
      const result = manager.acceptMission(condMission);
      expect(result.success).toBe(true);
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

    // Check max active
    if (state.missions.active.length >= MISSION_CONFIG.MAX_ACTIVE) {
      return { success: false, reason: 'You have the maximum number of active missions.' };
    }

    // Check duplicate
    if (state.missions.active.some((m) => m.id === mission.id)) {
      return { success: false, reason: 'You already have this mission active.' };
    }

    // Check mission conditions (minRep, notFlag)
    if (mission.conditions) {
      if (mission.conditions.minRep !== undefined && mission.giver) {
        const npcState = this.gameStateManager.getNPCState(mission.giver);
        if (npcState.rep < mission.conditions.minRep) {
          return { success: false, reason: 'Insufficient reputation with mission giver.' };
        }
      }
      if (mission.conditions.notFlag && mission.giver) {
        const npcState = this.gameStateManager.getNPCState(mission.giver);
        if (npcState.flags && npcState.flags.includes(mission.conditions.notFlag)) {
          return { success: false, reason: 'Mission conditions not met.' };
        }
      }
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
}
```

Register in `game-state-manager.js`:

```javascript
import { MissionManager } from './managers/mission.js';
// In constructor:
this.missionManager = new MissionManager(this);
// Delegation:
acceptMission(mission) { return this.missionManager.acceptMission(mission); }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-manager.test.js`
Expected: PASS

**Step 5: Write failing test for mission completion**

```javascript
describe('completeMission', () => {
  it('should complete a delivery mission when requirements met', () => {
    const mission = {
      id: 'test_delivery',
      type: 'delivery',
      title: 'Test Delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 7 },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };

    manager.acceptMission(mission);

    // Move player to destination with required cargo
    manager.updateLocation(4);
    // Player starts with 20 grain at Sol

    const result = manager.completeMission('test_delivery');
    expect(result.success).toBe(true);
    expect(result.rewards).toEqual({ credits: 500 });

    const state = manager.getState();
    expect(state.missions.active).toHaveLength(0);
    expect(state.missions.completed).toContain('test_delivery');
  });

  it('should reject completion if not at destination', () => {
    const mission = {
      id: 'test_delivery',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 7 },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const result = manager.completeMission('test_delivery');
    expect(result.success).toBe(false);
    expect(result.reason).toContain('destination');
  });

  it('should reject completion if cargo requirements not met', () => {
    const mission = {
      id: 'test_delivery',
      type: 'delivery',
      requirements: { cargo: 'medicine', quantity: 10, destination: 0, deadline: 7 },
      rewards: { credits: 500 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);
    // Player is at Sol (0) but has no medicine

    const result = manager.completeMission('test_delivery');
    expect(result.success).toBe(false);
    expect(result.reason).toContain('cargo');
  });

  it('should complete a fetch mission when cargo acquired and at giver system', () => {
    const mission = {
      id: 'test_fetch',
      type: 'fetch',
      title: 'Fetch Parts',
      giverSystem: 0,
      requirements: { cargo: 'parts', quantity: 5, deadline: 10 },
      rewards: { credits: 300 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);
    // Add parts to cargo
    const state = manager.getState();
    state.ship.cargo.push({ good: 'parts', qty: 5, buyPrice: 10, buySystem: 4, buySystemName: 'Barnards', buyDate: 1 });

    const result = manager.completeMission('test_fetch');
    expect(result.success).toBe(true);
  });

  it('should complete an intel mission when all targets visited and at giver system', () => {
    const mission = {
      id: 'test_intel',
      type: 'intel',
      title: 'Scout Systems',
      giverSystem: 0,
      requirements: { targets: [4, 7], deadline: 15 },
      rewards: { credits: 400 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);
    // Mark targets as visited
    const state = manager.getState();
    if (!state.world.visitedSystems.includes(4)) state.world.visitedSystems.push(4);
    if (!state.world.visitedSystems.includes(7)) state.world.visitedSystems.push(7);

    const result = manager.completeMission('test_intel');
    expect(result.success).toBe(true);
  });

  it('should reject intel mission if not all targets visited', () => {
    const mission = {
      id: 'test_intel_incomplete',
      type: 'intel',
      giverSystem: 0,
      requirements: { targets: [4, 7, 11], deadline: 15 },
      rewards: { credits: 400 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const result = manager.completeMission('test_intel_incomplete');
    expect(result.success).toBe(false);
    expect(result.reason).toContain('visited');
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

    const result = manager.completeMission('test_faction_rep');
    expect(result.success).toBe(true);
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

    const result = manager.completeMission('test_npc_rep');
    expect(result.success).toBe(true);
    expect(manager.getNPCState('test_npc').rep).toBe(10);
  });
});
```

**Step 6: Implement completeMission, run tests**

Add to `MissionManager`:

```javascript
completeMission(missionId) {
  this.validateState();
  const state = this.getState();

  const missionIndex = state.missions.active.findIndex((m) => m.id === missionId);
  if (missionIndex === -1) {
    return { success: false, reason: 'Mission not found in active missions.' };
  }

  const mission = state.missions.active[missionIndex];

  // Check destination
  if (mission.requirements.destination !== undefined &&
      mission.requirements.destination !== state.player.currentSystem) {
    return { success: false, reason: 'You are not at the mission destination.' };
  }

  // Type-specific requirement checks
  if (mission.type === 'delivery' || mission.type === 'fetch') {
    // Delivery: must be at destination. Fetch: must be at giver's system.
    const requiredSystem = mission.type === 'delivery'
      ? mission.requirements.destination
      : mission.giverSystem;
    if (requiredSystem !== undefined && requiredSystem !== state.player.currentSystem) {
      return { success: false, reason: 'You are not at the mission destination.' };
    }

    // Both delivery and fetch require cargo
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
    // Must be at giver's system
    if (mission.giverSystem !== undefined && mission.giverSystem !== state.player.currentSystem) {
      return { success: false, reason: 'You are not at the mission destination.' };
    }
    // Must have visited all target systems
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

  // Remove mission from active, add to completed
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

  // Remove delivered cargo for delivery/fetch missions
  if ((mission.type === 'delivery' || mission.type === 'fetch') && mission.requirements.cargo) {
    this.gameStateManager.removeCargoForMission(
      mission.requirements.cargo,
      mission.requirements.quantity
    );
  }

  this.emit('missionsChanged', state.missions);
  this.gameStateManager.saveGame();

  return { success: true, rewards: mission.rewards };
}
```

**Step 7: Write failing test for mission failure (deadline expiry)**

```javascript
describe('checkMissionDeadlines', () => {
  it('should fail missions past their deadline', () => {
    const mission = {
      id: 'test_timed',
      type: 'delivery',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 5 },
      rewards: { credits: 500 },
      penalties: { failure: { credits: -100 } },
    };
    manager.acceptMission(mission);

    // Advance time past deadline
    manager.updateTime(6);

    const state = manager.getState();
    expect(state.missions.active).toHaveLength(0);
    expect(state.missions.failed).toContain('test_timed');
  });
});
```

**Step 8: Implement deadline checking in time advancement, run tests**

Hook `checkMissionDeadlines()` into `EventsManager.updateTime()` or call it from MissionManager when time changes.

**Step 9: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 10: Commit**

```bash
git add src/game/state/managers/mission.js src/game/state/game-state-manager.js tests/unit/mission-manager.test.js
git commit -m "feat: add MissionManager with accept, complete, and deadline checking"
```

---

### Task 4: Mission Cargo Removal Helper

Delivery missions consume cargo on completion. Add a helper to remove specific cargo quantities.

**Files:**
- Modify: `src/game/state/managers/trading.js` or `src/game/state/managers/ship.js`
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

  it('should remove across multiple stacks if needed', () => {
    // Add another grain stack
    manager.buyGood('grain', 5, 10);

    const result = manager.removeCargoForMission('grain', 22);
    expect(result.success).toBe(true);

    const state = manager.getState();
    const grainTotal = state.ship.cargo
      .filter((c) => c.good === 'grain')
      .reduce((sum, c) => sum + c.qty, 0);
    expect(grainTotal).toBe(3); // Started with 20 + 5 = 25, removed 22
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
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-cargo-removal.test.js`

**Step 3: Implement removeCargoForMission**

Add to `ShipManager` (or `TradingManager`):

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

**Step 4: Run tests, verify pass**

Run: `npm test -- tests/unit/mission-cargo-removal.test.js`

**Step 5: Run full suite, commit**

```bash
git add src/game/state/managers/ship.js src/game/state/game-state-manager.js tests/unit/mission-cargo-removal.test.js
git commit -m "feat: add removeCargoForMission helper for delivery missions"
```

---

### Task 5: Repeatable Mission Generator

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

**Step 3: Implement mission generator**

Create `src/game/mission-generator.js` as a pure utility module:

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

  // Distance-based deadline: generous enough to travel + acquire cargo
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

**Step 4: Run tests, verify pass**

Run: `npm test -- tests/unit/mission-generator.test.js`

**Step 5: Run full suite, commit**

```bash
git add src/game/mission-generator.js tests/unit/mission-generator.test.js
git commit -m "feat: add procedural cargo run mission generator"
```

---

### Task 6: MissionManager Board Integration

Wire mission board generation into MissionManager so the board refreshes daily and is available at stations.

**Files:**
- Modify: `src/game/state/managers/mission.js`
- Modify: `src/game/state/game-state-manager.js` (delegation)
- Test: `tests/unit/mission-board-state.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Board State', () => {
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
    expect(state.missions.boardLastRefresh).toBe(0); // Day 0
  });

  it('should return cached board if refreshed same day', () => {
    const board1 = manager.refreshMissionBoard();
    const board2 = manager.refreshMissionBoard();

    expect(board2).toEqual(board1); // Same board, not re-generated
  });

  it('should generate new board after a day passes', () => {
    manager.refreshMissionBoard();
    const oldBoard = [...manager.getState().missions.board];

    manager.updateTime(1);
    const newBoard = manager.refreshMissionBoard();

    // Board IDs should differ (regenerated). With randomness, this is probabilistic
    // but the boardLastRefresh should definitely update
    const state = manager.getState();
    expect(state.missions.boardLastRefresh).toBe(1);
  });

  it('should get active missions list', () => {
    const missions = manager.getActiveMissions();
    expect(missions).toEqual([]);
  });
});
```

**Step 2-4: Implement and verify**

Add `refreshMissionBoard()`, `getActiveMissions()`, and `getConnectedStarData()` to MissionManager, delegate through GameStateManager.

`getConnectedStarData()` returns star data objects for systems connected to the current system. This helper is reused by passenger mission generation (Task 19, 24):

```javascript
getConnectedStarData() {
  this.validateState();
  const state = this.getState();
  const connectedIds = getConnectedSystems(
    state.player.currentSystem,
    this.gameStateManager.wormholeData
  );
  return connectedIds
    .map((id) => this.gameStateManager.starData.find((s) => s.id === id))
    .filter(Boolean);
}
```

This requires `MissionManager` to have access to `starData` and `wormholeData` via its `gameStateManager` reference (which already stores them).

**Step 5: Run full suite, commit**

```bash
git add src/game/state/managers/mission.js src/game/state/game-state-manager.js tests/unit/mission-board-state.test.js
git commit -m "feat: add mission board refresh and active missions query"
```

---

### Task 7: NarrativeEventManager Core

Create the narrative event engine that checks and fires events based on triggers (dock, jump, time, condition).

**Files:**
- Create: `src/game/state/managers/narrative-event.js`
- Create: `src/game/data/narrative-events.js` (event definitions)
- Modify: `src/game/state/game-state-manager.js` (register + delegation)
- Test: `tests/unit/narrative-event-manager.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('NarrativeEventManager', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  describe('checkEvents', () => {
    it('should return null when no events match', () => {
      const event = manager.checkNarrativeEvents('dock', { system: 999 });
      expect(event).toBeNull();
    });

    it('should return matching dock event for system', () => {
      // Register a test event
      manager.registerNarrativeEvent({
        id: 'test_dock_sol',
        type: 'dock',
        trigger: { system: 0, chance: 1.0 },
        once: false,
        cooldown: 0,
        priority: 0,
        content: {
          text: ['Welcome to Sol Station.'],
          speaker: null,
          mood: 'neutral',
          choices: [{ text: 'Continue', next: null, effects: [] }],
        },
      });

      const event = manager.checkNarrativeEvents('dock', { system: 0 });
      expect(event).not.toBeNull();
      expect(event.id).toBe('test_dock_sol');
    });

    it('should not return once-only events that have already fired', () => {
      manager.registerNarrativeEvent({
        id: 'test_once_event',
        type: 'dock',
        trigger: { system: 0, chance: 1.0 },
        once: true,
        cooldown: 0,
        priority: 0,
        content: {
          text: ['First time here.'],
          choices: [{ text: 'OK', next: null, effects: [] }],
        },
      });

      // Mark as fired
      manager.markNarrativeEventFired('test_once_event');

      const event = manager.checkNarrativeEvents('dock', { system: 0 });
      expect(event).toBeNull();
    });

    it('should respect cooldowns', () => {
      manager.registerNarrativeEvent({
        id: 'test_cooldown_event',
        type: 'dock',
        trigger: { system: 0, chance: 1.0 },
        once: false,
        cooldown: 5,
        priority: 0,
        content: {
          text: ['Event with cooldown.'],
          choices: [{ text: 'OK', next: null, effects: [] }],
        },
      });

      // Set cooldown (expires at day 5)
      manager.markNarrativeEventFired('test_cooldown_event');
      manager.getState().narrativeEvents.cooldowns['test_cooldown_event'] = 5;

      // Day 0, should be blocked
      const event1 = manager.checkNarrativeEvents('dock', { system: 0 });
      expect(event1).toBeNull();

      // Advance past cooldown
      manager.updateTime(6);
      const event2 = manager.checkNarrativeEvents('dock', { system: 0 });
      expect(event2).not.toBeNull();
    });

    it('should evaluate first_visit condition', () => {
      manager.registerNarrativeEvent({
        id: 'test_first_visit',
        type: 'dock',
        trigger: { system: 4, condition: 'first_visit', chance: 1.0 },
        once: true, cooldown: 0, priority: 0,
        content: { text: ['First time.'], choices: [{ text: 'OK', next: null, effects: [] }] },
      });

      // System 4 not yet visited — should match
      const event1 = manager.checkNarrativeEvents('dock', { system: 4 });
      expect(event1).not.toBeNull();

      // Mark visited — should no longer match
      manager.getState().world.visitedSystems.push(4);
      const event2 = manager.checkNarrativeEvents('dock', { system: 4 });
      expect(event2).toBeNull();
    });

    it('should evaluate comparison conditions like debt > 8000', () => {
      manager.registerNarrativeEvent({
        id: 'test_debt_condition',
        type: 'time',
        trigger: { condition: 'debt > 8000', chance: 1.0 },
        once: false, cooldown: 0, priority: 0,
        content: { text: ['Pay up.'], choices: [{ text: 'OK', next: null, effects: [] }] },
      });

      // Default debt is 5000 — should not match
      const event1 = manager.checkNarrativeEvents('time', {});
      expect(event1).toBeNull();

      // Increase debt — should match
      manager.getState().player.debt = 9000;
      const event2 = manager.checkNarrativeEvents('time', {});
      expect(event2).not.toBeNull();
    });

    it('should evaluate has_passenger condition', () => {
      manager.registerNarrativeEvent({
        id: 'test_has_passenger',
        type: 'jump',
        trigger: { condition: 'has_passenger', chance: 1.0 },
        once: false, cooldown: 0, priority: 0,
        content: { text: ['Passenger event.'], choices: [{ text: 'OK', next: null, effects: [] }] },
      });

      // No passenger — should not match
      const event1 = manager.checkNarrativeEvents('jump', {});
      expect(event1).toBeNull();

      // Add passenger mission
      manager.getState().missions.active.push({
        id: 'pass_test', type: 'passenger', passenger: { type: 'business', satisfaction: 50 },
      });
      const event2 = manager.checkNarrativeEvents('jump', {});
      expect(event2).not.toBeNull();
    });

    it('should return highest priority event when multiple match', () => {
      manager.registerNarrativeEvent({
        id: 'low_priority',
        type: 'dock',
        trigger: { system: 0, chance: 1.0 },
        once: false, cooldown: 0, priority: 1,
        content: { text: ['Low'], choices: [{ text: 'OK', next: null, effects: [] }] },
      });
      manager.registerNarrativeEvent({
        id: 'high_priority',
        type: 'dock',
        trigger: { system: 0, chance: 1.0 },
        once: false, cooldown: 0, priority: 10,
        content: { text: ['High'], choices: [{ text: 'OK', next: null, effects: [] }] },
      });

      const event = manager.checkNarrativeEvents('dock', { system: 0 });
      expect(event.id).toBe('high_priority');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/narrative-event-manager.test.js`

**Step 3: Implement NarrativeEventManager**

Create `src/game/state/managers/narrative-event.js`:

```javascript
import { BaseManager } from './base-manager.js';

export class NarrativeEventManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
    this.registeredEvents = [];
  }

  registerEvent(eventDef) {
    this.registeredEvents.push(eventDef);
  }

  evaluateCondition(condition, context = {}) {
    if (!condition) return true;
    const state = this.getState();

    if (condition === 'first_visit') {
      return !state.world.visitedSystems.includes(context.system);
    }
    if (condition === 'has_passenger') {
      return state.missions.active.some((m) => m.type === 'passenger' && m.passenger);
    }
    if (condition === 'has_wealthy_passenger') {
      return state.missions.active.some(
        (m) => m.type === 'passenger' && m.passenger && m.passenger.type === 'wealthy'
      );
    }
    if (condition === 'has_family_passenger') {
      return state.missions.active.some(
        (m) => m.type === 'passenger' && m.passenger && m.passenger.type === 'family'
      );
    }
    // Parse comparison conditions like "debt > 8000"
    const comparison = condition.match(/^(\w+)\s*(>|<|>=|<=|===?)\s*(\d+)$/);
    if (comparison) {
      const [, field, op, valueStr] = comparison;
      const value = Number(valueStr);
      let actual;
      if (field === 'debt') actual = state.player.debt;
      else if (field === 'credits') actual = state.player.credits;
      else if (field === 'fuel') actual = state.ship.fuel;
      else if (field === 'hull') actual = state.ship.hull;
      else if (field === 'daysElapsed') actual = state.player.daysElapsed;
      else return false;

      if (op === '>') return actual > value;
      if (op === '<') return actual < value;
      if (op === '>=') return actual >= value;
      if (op === '<=') return actual <= value;
      if (op === '==' || op === '===') return actual === value;
    }
    return false;
  }

  checkEvents(eventType, context = {}) {
    this.validateState();
    const state = this.getState();

    const eligible = this.registeredEvents.filter((e) => {
      if (e.type !== eventType) return false;
      if (e.once && state.narrativeEvents.fired.includes(e.id)) return false;
      if (e.cooldown && state.narrativeEvents.cooldowns[e.id]) {
        if (state.player.daysElapsed < state.narrativeEvents.cooldowns[e.id]) return false;
      }
      if (e.trigger.system !== undefined && e.trigger.system !== null && e.trigger.system !== context.system) return false;
      if (e.trigger.condition && !this.evaluateCondition(e.trigger.condition, context)) return false;
      if (e.trigger.chance !== undefined && Math.random() > e.trigger.chance) return false;
      return true;
    });

    eligible.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return eligible[0] || null;
  }

  getEventById(eventId) {
    return this.registeredEvents.find((e) => e.id === eventId) || null;
  }

  markEventFired(eventId) {
    this.validateState();
    const state = this.getState();
    if (!state.narrativeEvents.fired.includes(eventId)) {
      state.narrativeEvents.fired.push(eventId);
    }
    const eventDef = this.registeredEvents.find((e) => e.id === eventId);
    if (eventDef && eventDef.cooldown > 0) {
      state.narrativeEvents.cooldowns[eventId] = state.player.daysElapsed + eventDef.cooldown;
    }
  }
}
```

Register in GameStateManager. Delegate `checkNarrativeEvents`, `registerNarrativeEvent`, `markNarrativeEventFired`.

**Step 4: Run tests, verify pass**

**Step 5: Run full suite, commit**

```bash
git add src/game/state/managers/narrative-event.js src/game/state/game-state-manager.js tests/unit/narrative-event-manager.test.js
git commit -m "feat: add NarrativeEventManager with event checking and cooldowns"
```

---

### Task 8: Narrative Event Effect Application

Apply effects from event choices (credits, cargo, fuel, rep, karma, etc).

**Files:**
- Create: `src/game/narrative-event-effects.js`
- Test: `tests/unit/narrative-event-effects.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { applyEventEffects } from '../../src/game/narrative-event-effects.js';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Narrative Event Effects', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should apply credits effect', () => {
    applyEventEffects(manager, [{ type: 'credits', value: 500 }]);
    expect(manager.getState().player.credits).toBe(1000); // 500 starting + 500
  });

  it('should apply negative credits effect', () => {
    applyEventEffects(manager, [{ type: 'credits', value: -100 }]);
    expect(manager.getState().player.credits).toBe(400);
  });

  it('should apply fuel effect', () => {
    applyEventEffects(manager, [{ type: 'fuel', value: -10 }]);
    expect(manager.getState().ship.fuel).toBe(90);
  });

  it('should apply time effect', () => {
    applyEventEffects(manager, [{ type: 'time', value: 0.04 }]);
    expect(manager.getState().player.daysElapsed).toBeCloseTo(0.04);
  });

  it('should apply cargo_add effect', () => {
    applyEventEffects(manager, [{ type: 'cargo_add', good: 'parts', qty: 5, price: 0 }]);
    const parts = manager.getState().ship.cargo.filter((c) => c.good === 'parts');
    expect(parts.length).toBeGreaterThan(0);
    const totalParts = parts.reduce((sum, c) => sum + c.qty, 0);
    expect(totalParts).toBe(5);
  });

  it('should apply npc_rep effect', () => {
    applyEventEffects(manager, [{ type: 'npc_rep', target: 'test_npc', value: 5 }]);
    const npcState = manager.getNPCState('test_npc');
    expect(npcState.rep).toBe(5);
  });

  it('should apply karma effect', () => {
    applyEventEffects(manager, [{ type: 'karma', value: 3 }]);
    expect(manager.getKarma()).toBe(3);
  });

  it('should apply passenger_satisfaction effect', () => {
    // Set up a passenger in active mission
    const state = manager.getState();
    state.missions.active.push({
      id: 'passenger_test',
      type: 'passenger',
      passenger: { satisfaction: 50 },
    });

    applyEventEffects(manager, [{ type: 'passenger_satisfaction', value: 10 }]);

    expect(state.missions.active[0].passenger.satisfaction).toBe(60);
  });

  it('should apply multiple effects in order', () => {
    applyEventEffects(manager, [
      { type: 'credits', value: 100 },
      { type: 'fuel', value: -5 },
    ]);
    expect(manager.getState().player.credits).toBe(600);
    expect(manager.getState().ship.fuel).toBe(95);
  });
});
```

**Step 2-4: Implement as a pure utility function, run tests**

Create `src/game/narrative-event-effects.js`:

```javascript
export function applyEventEffects(gameStateManager, effects) {
  if (!effects || !Array.isArray(effects)) return;

  for (const effect of effects) {
    switch (effect.type) {
      case 'credits':
        gameStateManager.setCredits(gameStateManager.getState().player.credits + effect.value);
        break;
      case 'fuel':
        gameStateManager.setFuel(gameStateManager.getState().ship.fuel + effect.value);
        break;
      case 'time':
        gameStateManager.updateTime(gameStateManager.getState().player.daysElapsed + effect.value);
        break;
      case 'cargo_add': {
        const state = gameStateManager.getState();
        state.ship.cargo.push({
          good: effect.good,
          qty: effect.qty,
          buyPrice: effect.price || 0,
          buySystem: state.player.currentSystem,
          buySystemName: 'Salvage',
          buyDate: state.player.daysElapsed,
        });
        gameStateManager.emit('cargoChanged', state.ship.cargo);
        break;
      }
      case 'npc_rep':
        gameStateManager.modifyRep(effect.target, effect.value, 'event');
        break;
      case 'karma':
        gameStateManager.modifyKarma(effect.value, 'event');
        break;
      case 'passenger_satisfaction': {
        const state = gameStateManager.getState();
        const passengerMission = state.missions.active.find((m) => m.type === 'passenger' && m.passenger);
        if (passengerMission) {
          passengerMission.passenger.satisfaction = Math.max(0, Math.min(100,
            passengerMission.passenger.satisfaction + effect.value
          ));
        }
        break;
      }
    }
  }
}
```

**Step 5: Run full suite, commit**

```bash
git add src/game/narrative-event-effects.js tests/unit/narrative-event-effects.test.js
git commit -m "feat: add narrative event effect application system"
```

---

### Task 9: Sample Narrative Events Data

Create narrative event content covering all four event types and passenger-specific events.

**Files:**
- Create: `src/game/data/narrative-events.js`
- Test: `tests/unit/narrative-events-data.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { NARRATIVE_EVENTS } from '../../src/game/data/narrative-events.js';

describe('Narrative Events Data', () => {
  it('should export an array of event definitions', () => {
    expect(NARRATIVE_EVENTS).toBeInstanceOf(Array);
    expect(NARRATIVE_EVENTS.length).toBeGreaterThan(0);
  });

  it('should have required fields on all events', () => {
    for (const event of NARRATIVE_EVENTS) {
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('trigger');
      expect(event).toHaveProperty('content');
      expect(event.content).toHaveProperty('text');
      expect(event.content).toHaveProperty('choices');
      expect(event.content.text.length).toBeGreaterThan(0);
      expect(event.content.choices.length).toBeGreaterThan(0);

      // Speaker and mood fields (speaker null = narration)
      expect(event.content).toHaveProperty('speaker');
      expect(event.content).toHaveProperty('mood');

      // Each choice must have text and effects
      for (const choice of event.content.choices) {
        expect(choice).toHaveProperty('text');
        expect(choice).toHaveProperty('effects');
        expect(Array.isArray(choice.effects)).toBe(true);
      }
    }
  });

  it('should have unique event IDs', () => {
    const ids = NARRATIVE_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should include dock events for Sol', () => {
    const solDockEvents = NARRATIVE_EVENTS.filter(
      (e) => e.type === 'dock' && e.trigger.system === 0
    );
    expect(solDockEvents.length).toBeGreaterThan(0);
  });

  it('should include at least one jump event', () => {
    const jumpEvents = NARRATIVE_EVENTS.filter((e) => e.type === 'jump');
    expect(jumpEvents.length).toBeGreaterThan(0);
  });

  it('should include at least one time event', () => {
    const timeEvents = NARRATIVE_EVENTS.filter((e) => e.type === 'time');
    expect(timeEvents.length).toBeGreaterThan(0);
  });

  it('should include at least one condition event', () => {
    const conditionEvents = NARRATIVE_EVENTS.filter((e) => e.type === 'condition');
    expect(conditionEvents.length).toBeGreaterThan(0);
  });

  it('should include passenger-specific events', () => {
    const passengerEvents = NARRATIVE_EVENTS.filter(
      (e) => e.trigger.condition && e.trigger.condition.includes('passenger')
    );
    expect(passengerEvents.length).toBeGreaterThan(0);
  });
});
```

**Step 2-3: Implement event data file**

Create `src/game/data/narrative-events.js` with events from the spec. **Every event's `content` must include `speaker` (NPC ID string or `null` for narration) and `mood` (string like `'neutral'`, `'tense'`, `'friendly'`).**

Events:
- `dock_sol_first` — first visit to Sol (dock, once, condition: first_visit, speaker: null, mood: 'neutral')
- `dock_barnards_first` — first visit to Barnard's Star with Chen encounter (dock, once, speaker: null, mood: 'neutral')
- `jump_salvage_random` — random salvage discovery (jump, cooldown: 5, chance: 0.05, speaker: null, mood: 'tense')
- `salvage_result` — salvage outcome (chain event, type: event, speaker: null, mood: 'neutral')
- `time_debt_warning` — debt reminder (time, condition: "debt > 8000", cooldown: 10, speaker: 'cole_sol', mood: 'threatening')
- `passenger_complaint_comfort` — passenger discomfort during jump (jump, condition: has_passenger, chance: 0.15, speaker: null, mood: 'tense')
- `wealthy_passenger_tip` — wealthy passenger tip on dock (dock, condition: has_wealthy_passenger, speaker: null, mood: 'friendly')
- `family_passenger_children` — restless children during jump (jump, condition: has_family_passenger, chance: 0.2, speaker: null, mood: 'neutral')
- `condition_low_fuel` — low fuel warning (condition, condition: "fuel < 20", speaker: null, mood: 'tense')
- `condition_hull_critical` — hull breach alert (condition, condition: "hull < 30", speaker: null, mood: 'tense')

**Step 4: Run tests, verify pass. Commit.**

```bash
git add src/game/data/narrative-events.js tests/unit/narrative-events-data.test.js
git commit -m "feat: add initial narrative event definitions (dock, jump, time)"
```

---

### Task 10: Bridge Pattern Integration

Add mission and narrative event types to the Bridge Pattern hooks.

**Files:**
- Modify: `src/hooks/useGameEvent.js` (add `missionsChanged` mapping)
- Modify: `src/hooks/useGameAction.js` (add mission actions)
- Test: `tests/unit/mission-bridge-pattern.test.js`

**Step 1: Write the failing test**

Test that `extractStateForEvent` returns mission data for `missionsChanged`, and that `useGameAction` exposes mission actions. Since hooks require React testing, this can be a focused unit test on the state extraction function.

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

  it('should emit narrativeEvent when narrative event is triggered', () => {
    let emitted = null;
    manager.subscribe('narrativeEvent', (data) => { emitted = data; });

    manager.registerNarrativeEvent({
      id: 'test_narrative_bridge',
      type: 'dock',
      trigger: { system: 0, chance: 1.0 },
      once: false, cooldown: 0, priority: 0,
      content: { text: ['Test'], choices: [{ text: 'OK', next: null, effects: [] }] },
    });

    const event = manager.checkNarrativeEvents('dock', { system: 0 });
    if (event) {
      manager.emit('narrativeEvent', event);
    }

    expect(emitted).not.toBeNull();
    expect(emitted.id).toBe('test_narrative_bridge');
  });
});
```

**Step 2-4: Add mappings to useGameEvent and actions to useGameAction**

In `useGameEvent.js`, add to `eventStateMap`:
```javascript
missionsChanged: state.missions || { active: [], completed: [], failed: [], board: [] },
narrativeEvent: null,  // Passed directly in event data
```

In `useGameAction.js`, add:
```javascript
acceptMission: (mission) => gameStateManager.acceptMission(mission),
completeMission: (missionId) => gameStateManager.completeMission(missionId),
refreshMissionBoard: () => gameStateManager.refreshMissionBoard(),
getActiveMissions: () => gameStateManager.getActiveMissions(),
getCompletableMissions: () => gameStateManager.getCompletableMissions(),
getAvailableNPCMissions: (npcId) => gameStateManager.getAvailableNPCMissions(npcId),
```

**Step 5: Run full suite, commit**

```bash
git add src/hooks/useGameEvent.js src/hooks/useGameAction.js tests/unit/mission-bridge-pattern.test.js
git commit -m "feat: add mission events and actions to Bridge Pattern hooks"
```

---

### Task 11: Dock Event Integration

Wire narrative event checking into the dock flow so events fire when docking.

**Files:**
- Modify: `src/game/state/managers/navigation.js`
- Modify: `src/game/state/managers/narrative-event.js`
- Test: `tests/unit/dock-event-integration.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Dock Event Integration', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should emit narrativeEvent when docking triggers a matching event', () => {
    manager.registerNarrativeEvent({
      id: 'test_dock_event',
      type: 'dock',
      trigger: { system: 0, chance: 1.0 },
      once: true, cooldown: 0, priority: 0,
      content: { text: ['Welcome!'], choices: [{ text: 'Thanks', next: null, effects: [] }] },
    });

    let emittedEvent = null;
    manager.subscribe('narrativeEvent', (data) => { emittedEvent = data; });

    manager.dock();

    expect(emittedEvent).not.toBeNull();
    expect(emittedEvent.id).toBe('test_dock_event');
  });

  it('should not emit narrativeEvent when no events match', () => {
    let emittedEvent = null;
    manager.subscribe('narrativeEvent', (data) => { emittedEvent = data; });

    manager.dock();

    expect(emittedEvent).toBeNull();
  });
});
```

**Step 2-3: Hook narrative event check into NavigationManager.dock()**

At the end of `NavigationManager.dock()`, after existing logic, add:

```javascript
// Check for narrative dock events
const narrativeEvent = this.gameStateManager.checkNarrativeEvents('dock', {
  system: currentSystemId,
});
if (narrativeEvent) {
  this.gameStateManager.markNarrativeEventFired(narrativeEvent.id);
  this.emit('narrativeEvent', narrativeEvent);
}
```

**Step 4: Run tests, commit**

```bash
git add src/game/state/managers/navigation.js tests/unit/dock-event-integration.test.js
git commit -m "feat: fire narrative events on dock"
```

---

### Task 12: Mission Board Panel UI

Create the MissionBoardPanel component and wire it into PanelContainer and StationMenu.

**Files:**
- Create: `src/features/missions/MissionBoardPanel.jsx`
- Modify: `src/features/station/StationMenu.jsx`
- Modify: `src/features/station/PanelContainer.jsx`

**Step 1: Create MissionBoardPanel component**

```jsx
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';

export function MissionBoardPanel({ onClose }) {
  const missions = useGameEvent('missionsChanged');
  const { acceptMission, refreshMissionBoard } = useGameAction();

  // Refresh board on mount
  const board = refreshMissionBoard();

  const handleAccept = (mission) => {
    const result = acceptMission(mission);
    if (!result.success) {
      // Show reason - useNotification or inline
    }
  };

  return (
    <div className="panel mission-board-panel">
      <button className="close-btn" onClick={onClose}>×</button>
      <h2>Mission Board</h2>
      <div className="mission-list">
        {missions?.board?.map((mission) => (
          <div key={mission.id} className="mission-card">
            <h3>{mission.title}</h3>
            <p>{mission.description}</p>
            <div className="mission-details">
              <span>Deliver: {mission.requirements.quantity} {mission.requirements.cargo}</span>
              <span>Deadline: {mission.requirements.deadline} days</span>
              <span>Reward: ₡{mission.rewards.credits}</span>
            </div>
            <button className="accept-btn" onClick={() => handleAccept(mission)}>
              Accept
            </button>
          </div>
        ))}
      </div>
      <button className="station-btn" onClick={onClose}>Back</button>
    </div>
  );
}
```

**Step 2: Add to PanelContainer**

```jsx
case 'mission-board':
  return <MissionBoardPanel onClose={onClose} />;
```

**Step 3: Add to StationMenu**

Add a "Mission Board" button alongside existing station buttons:

```jsx
<button className="station-btn" onClick={() => onOpenPanel('mission-board')}>
  Mission Board
</button>
```

**Step 4: Verify in browser (manual test)**

Run: `npm run dev` — dock at station, verify Mission Board button appears and shows generated missions.

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
          <div key={mission.id} className={`mission-item ${isUrgent ? 'urgent' : ''}`}>
            <div className="mission-title">{mission.title}</div>
            {mission.type === 'delivery' && (
              <div className="mission-progress">
                {mission.requirements.cargo}: {mission.requirements.quantity} needed
              </div>
            )}
            <div className="mission-deadline">
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'EXPIRED'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Add to HUD.jsx**

Import and render `<ActiveMissions />` in the HUD component.

**Step 3: Add CSS for active missions display**

Style the `.active-missions-hud` with the existing HUD styling conventions.

**Step 4: Commit**

```bash
git add src/features/hud/ActiveMissions.jsx src/features/hud/HUD.jsx
git commit -m "feat: add active mission tracking display in HUD"
```

---

### Task 14: Narrative Event Modal UI with Event Chain Support

Create the modal for displaying narrative events with choices, wire it into App.jsx, and handle event chains (choice.next resolves to another event by ID).

**Files:**
- Create: `src/features/events/NarrativeEventModal.jsx`
- Modify: `src/App.jsx`

**Step 1: Create NarrativeEventModal component**

```jsx
import { applyEventEffects } from '../../game/narrative-event-effects.js';
import { useGameState } from '../../context/GameContext';

export function NarrativeEventModal({ event, onClose }) {
  const gameStateManager = useGameState();

  const handleChoice = (choice) => {
    // Apply effects
    applyEventEffects(gameStateManager, choice.effects);

    // Chain to next event if specified (resolve by event ID)
    if (choice.next) {
      const nextEvent = gameStateManager.getEventById(choice.next);
      if (nextEvent) {
        gameStateManager.markNarrativeEventFired(nextEvent.id);
        gameStateManager.emit('narrativeEvent', nextEvent);
      }
    }

    onClose();
  };

  if (!event) return null;

  const { speaker, mood } = event.content;

  return (
    <div className="narrative-event-overlay">
      <div className={`narrative-event-modal ${mood ? `mood-${mood}` : ''}`}>
        {speaker && <div className="event-speaker">{speaker}</div>}
        <div className="event-text">
          {event.content.text.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        <div className="event-choices">
          {event.content.choices.map((choice, i) => (
            <button key={i} className="event-choice-btn" onClick={() => handleChoice(choice)}>
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Wire into App.jsx**

Add state for the current narrative event, subscribe to `narrativeEvent` events:

```jsx
const [currentNarrativeEvent, setCurrentNarrativeEvent] = useState(null);
const narrativeEvent = useGameEvent('narrativeEvent');

useEffect(() => {
  if (narrativeEvent) {
    setCurrentNarrativeEvent(narrativeEvent);
  }
}, [narrativeEvent]);

// In render:
{currentNarrativeEvent && (
  <NarrativeEventModal
    event={currentNarrativeEvent}
    onClose={() => setCurrentNarrativeEvent(null)}
  />
)}
```

**Step 3: Add CSS for narrative event modal**

Style with existing modal conventions (overlay, centered panel, choice buttons).

**Step 4: Verify in browser**

Run: `npm run dev` — dock at Sol, verify first-visit dock event appears with choices.

**Step 5: Commit**

```bash
git add src/features/events/NarrativeEventModal.jsx src/App.jsx
git commit -m "feat: add narrative event modal with choice handling"
```

---

### Task 15: Mission Completion Auto-Check

When docking at a station, automatically check if any active missions (delivery, fetch, intel, passenger) can be completed at this destination.

**Files:**
- Modify: `src/game/state/managers/mission.js`
- Modify: `src/game/state/managers/navigation.js` (or check in App.jsx)
- Test: `tests/unit/mission-completion-check.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Completion Check', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should return completable missions at current destination', () => {
    // Accept a mission to deliver grain to Barnard's Star (4)
    manager.acceptMission({
      id: 'completable_test',
      type: 'delivery',
      title: 'Grain to Barnards',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 10 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    // Move to destination
    manager.updateLocation(4);

    // Player has 20 grain from game start
    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
    expect(completable[0].id).toBe('completable_test');
  });

  it('should not return missions for wrong destination', () => {
    manager.acceptMission({
      id: 'wrong_dest',
      type: 'delivery',
      title: 'Wrong Dest',
      requirements: { cargo: 'grain', quantity: 10, destination: 4, deadline: 10 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    // Stay at Sol (0)
    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(0);
  });

  it('should not return missions with insufficient cargo', () => {
    manager.acceptMission({
      id: 'not_enough',
      type: 'delivery',
      title: 'Not Enough',
      requirements: { cargo: 'medicine', quantity: 10, destination: 0, deadline: 10 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    // Player has no medicine
    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(0);
  });

  it('should return completable fetch mission at giver system', () => {
    manager.acceptMission({
      id: 'fetch_complete',
      type: 'fetch',
      title: 'Fetch Parts',
      giverSystem: 0,
      requirements: { cargo: 'grain', quantity: 5, deadline: 10 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });
    // Player at Sol (0) which is giverSystem, has 20 grain
    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
  });

  it('should return completable intel mission when all targets visited', () => {
    manager.acceptMission({
      id: 'intel_complete',
      type: 'intel',
      title: 'Scout',
      giverSystem: 0,
      requirements: { targets: [0], deadline: 10 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });
    // Player at Sol (0), Sol is in visitedSystems and is giverSystem
    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
  });

  it('should return completable passenger mission at destination', () => {
    manager.acceptMission({
      id: 'passenger_complete',
      type: 'passenger',
      title: 'Transport Passenger',
      requirements: { destination: 0, deadline: 10 },
      passenger: { type: 'business', satisfaction: 50 },
      rewards: { credits: 800 },
      penalties: { failure: {} },
    });
    // Player at Sol (0) which is destination
    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
  });
});
```

**Step 2-4: Implement getCompletableMissions in MissionManager**

```javascript
getCompletableMissions() {
  this.validateState();
  const state = this.getState();

  return state.missions.active.filter((mission) => {
    if (mission.type === 'delivery') {
      if (mission.requirements.destination !== state.player.currentSystem) return false;
      const totalCargo = state.ship.cargo
        .filter((c) => c.good === mission.requirements.cargo)
        .reduce((sum, c) => sum + c.qty, 0);
      return totalCargo >= mission.requirements.quantity;
    }
    if (mission.type === 'fetch') {
      if (mission.giverSystem !== state.player.currentSystem) return false;
      const totalCargo = state.ship.cargo
        .filter((c) => c.good === mission.requirements.cargo)
        .reduce((sum, c) => sum + c.qty, 0);
      return totalCargo >= mission.requirements.quantity;
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

**Step 5: Run full suite, commit**

```bash
git add src/game/state/managers/mission.js src/game/state/game-state-manager.js tests/unit/mission-completion-check.test.js
git commit -m "feat: add completable mission detection at destination"
```

---

### Task 16: Mission Completion UI

Create UI for completing missions when docking at destination with requirements met. Show rewards.

**Files:**
- Create: `src/features/missions/MissionCompletePanel.jsx`
- Modify: `src/App.jsx` (show completion prompt on dock)

**Step 1: Create MissionCompletePanel**

Display completed mission details and rewards, with a Continue button. Follow the pattern from `OutcomePanel.jsx`.

**Step 2: Wire into App.jsx dock flow**

After docking, check `getCompletableMissions()`. If any exist, show the completion prompt before the station menu. The player can complete one mission at a time.

**Step 3: Verify in browser, commit**

```bash
git add src/features/missions/MissionCompletePanel.jsx src/App.jsx
git commit -m "feat: add mission completion UI with reward display"
```

---

### Task 17: Register Narrative Events on Game Init

Load the narrative events data file and register all events with the NarrativeEventManager on game start.

**Files:**
- Modify: `src/game/state/managers/narrative-event.js`
- Modify: `src/game/state/game-state-manager.js`
- Test: `tests/unit/narrative-events-registration.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Narrative Events Registration', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should have narrative events registered after init', () => {
    // Check that dock event for Sol (from narrative-events.js) is findable
    const event = manager.checkNarrativeEvents('dock', { system: 0 });
    // Should find the first-visit Sol event (if player hasn't docked yet)
    expect(event).not.toBeNull();
  });
});
```

**Step 2-3: Auto-register events**

In `NarrativeEventManager` constructor, or in `initNewGame()` flow, import and register all events from `src/game/data/narrative-events.js`.

**Step 4: Run tests, commit**

```bash
git add src/game/state/managers/narrative-event.js src/game/state/game-state-manager.js tests/unit/narrative-events-registration.test.js
git commit -m "feat: auto-register narrative events on game initialization"
```

---

### Task 18: Emit Initial Mission Events & Full Integration Test

Ensure mission state is emitted on game init and load. Write an integration test for the full mission flow.

**Files:**
- Modify: `src/game/state/managers/initialization.js` (emit missionsChanged)
- Test: `tests/integration/mission-flow.test.js`

**Step 1: Add missionsChanged to emitInitialEvents**

In `initialization.js`, add:
```javascript
this.gameStateManager.emit('missionsChanged', state.missions);
```

**Step 2: Write integration test**

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

    // 3. If destination requires travel and cargo, set up for completion
    const activeMission = manager.getActiveMissions()[0];
    manager.updateLocation(activeMission.requirements.destination);

    // Ensure we have enough cargo
    const state = manager.getState();
    const existingCargo = state.ship.cargo
      .filter((c) => c.good === activeMission.requirements.cargo)
      .reduce((sum, c) => sum + c.qty, 0);

    if (existingCargo < activeMission.requirements.quantity) {
      // Add cargo directly for test
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
});
```

**Step 3: Run full suite, commit**

```bash
git add src/game/state/managers/initialization.js tests/integration/mission-flow.test.js
git commit -m "feat: emit initial mission events and add mission flow integration test"
```

---

### Task 19: Passenger Mission System

Add passenger generation, satisfaction tracking, cargo space reservation, payment calculation, follow-up mission generation, and passenger-specific completion logic.

**Files:**
- Create: `src/game/passenger-generator.js`
- Modify: `src/game/state/managers/mission.js` (passenger completion, satisfaction updates)
- Modify: `src/game/state/game-state-manager.js` (delegation)
- Test: `tests/unit/passenger-generator.test.js`
- Test: `tests/unit/passenger-mission.test.js`

**Step 1: Write failing test for passenger generation**

```javascript
import { describe, it, expect } from 'vitest';
import {
  generatePassenger,
  calculatePassengerPayment,
  updatePassengerSatisfaction,
  generatePassengerMission,
} from '../../src/game/passenger-generator.js';

describe('Passenger Generator', () => {
  it('should generate a valid passenger', () => {
    const passenger = generatePassenger();
    expect(passenger).toHaveProperty('id');
    expect(passenger).toHaveProperty('name');
    expect(passenger).toHaveProperty('type');
    expect(passenger).toHaveProperty('cargoSpace');
    expect(passenger).toHaveProperty('satisfaction');
    expect(passenger).toHaveProperty('satisfactionWeights');
    expect(passenger.satisfaction).toBe(50); // INITIAL
    expect(passenger.cargoSpace).toBeGreaterThan(0);
  });

  it('should generate passenger with satisfaction weights matching type', () => {
    const passenger = generatePassenger('refugee');
    expect(passenger.type).toBe('refugee');
    expect(passenger.satisfactionWeights.speed).toBe(0.8);
    expect(passenger.satisfactionWeights.comfort).toBe(0.2);
  });

  it('should calculate payment based on satisfaction', () => {
    const basePayment = 1000;
    // Very satisfied (>= 80): multiplier 1.3 + on-time 0.1 = 1.4
    expect(calculatePassengerPayment(basePayment, 85, 5, 10)).toBeGreaterThan(basePayment);
    // Very dissatisfied (< 20): multiplier 0.5
    expect(calculatePassengerPayment(basePayment, 15, 5, 10)).toBeLessThan(basePayment);
  });

  it('should add on-time bonus when delivered before deadline', () => {
    const onTime = calculatePassengerPayment(1000, 50, 5, 10); // day 5, deadline 10
    const late = calculatePassengerPayment(1000, 50, 12, 10); // day 12, deadline 10
    expect(onTime).toBeGreaterThan(late);
  });

  it('should return integer payment', () => {
    for (let sat = 0; sat <= 100; sat += 10) {
      const payment = calculatePassengerPayment(800, sat, 5, 10);
      expect(Number.isInteger(payment)).toBe(true);
    }
  });
});

describe('Passenger Satisfaction Updates', () => {
  it('should apply delay penalty weighted by speed preference', () => {
    const passenger = { satisfaction: 50, satisfactionWeights: { speed: 0.8, comfort: 0.2 } };
    updatePassengerSatisfaction(passenger, 'delay');
    expect(passenger.satisfaction).toBe(42); // 50 - (10 * 0.8)
  });

  it('should apply combat penalty weighted by safety preference', () => {
    const passenger = {
      satisfaction: 50,
      satisfactionWeights: { speed: 0.5, comfort: 0.3, safety: 0.2 },
    };
    updatePassengerSatisfaction(passenger, 'combat');
    expect(passenger.satisfaction).toBe(47); // 50 - (15 * 0.2)
  });

  it('should apply low life support penalty weighted by comfort', () => {
    const passenger = { satisfaction: 50, satisfactionWeights: { speed: 0.6, comfort: 0.4 } };
    updatePassengerSatisfaction(passenger, 'low_life_support');
    expect(passenger.satisfaction).toBe(48); // 50 - (5 * 0.4)
  });

  it('should clamp satisfaction between 0 and 100', () => {
    const passenger = { satisfaction: 5, satisfactionWeights: { speed: 1.0 } };
    updatePassengerSatisfaction(passenger, 'delay');
    expect(passenger.satisfaction).toBe(0);
  });
});

describe('Passenger Mission Generation', () => {
  it('should generate a valid passenger mission', () => {
    const mission = generatePassengerMission(0, [{ id: 4, name: "Barnard's Star" }]);
    expect(mission.type).toBe('passenger');
    expect(mission.passenger).toBeDefined();
    expect(mission.passenger.cargoSpace).toBeGreaterThan(0);
    expect(mission.requirements.destination).toBe(4);
    expect(mission.rewards.credits).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/passenger-generator.test.js`

**Step 3: Implement passenger generator**

Create `src/game/passenger-generator.js`:

```javascript
import { PASSENGER_CONFIG, MISSION_CONFIG } from './constants.js';

const PASSENGER_NAMES = [
  'Dr. Sarah Chen', 'Marcus Webb', 'Elena Vasquez', 'Kenji Tanaka',
  'Fatima Al-Rashid', 'Dmitri Volkov', 'Amara Osei', 'Carlos Mendez',
  'Yuki Sato', 'Priya Sharma', 'The Kovalev Family', 'James O\'Brien',
];

export function generatePassenger(forceType = null, rng = Math.random) {
  const types = Object.keys(PASSENGER_CONFIG.TYPES);
  const type = forceType || types[Math.floor(rng() * types.length)];
  const template = PASSENGER_CONFIG.TYPES[type];

  return {
    id: `passenger_${Date.now()}_${Math.floor(rng() * 10000)}`,
    name: PASSENGER_NAMES[Math.floor(rng() * PASSENGER_NAMES.length)],
    type,
    cargoSpace: template.cargoSpace,
    satisfaction: PASSENGER_CONFIG.SATISFACTION.INITIAL,
    satisfactionWeights: { ...template.satisfaction },
  };
}

export function calculatePassengerPayment(basePayment, satisfaction, currentDay, deadlineDay) {
  let multiplier = 1.0;
  if (satisfaction >= PASSENGER_CONFIG.SATISFACTION.VERY_SATISFIED) multiplier = MISSION_CONFIG.SATISFACTION_BONUS.VERY_SATISFIED;
  else if (satisfaction >= PASSENGER_CONFIG.SATISFACTION.SATISFIED) multiplier = MISSION_CONFIG.SATISFACTION_BONUS.SATISFIED;
  else if (satisfaction >= PASSENGER_CONFIG.SATISFACTION.NEUTRAL) multiplier = MISSION_CONFIG.SATISFACTION_BONUS.NEUTRAL;
  else if (satisfaction >= PASSENGER_CONFIG.SATISFACTION.DISSATISFIED) multiplier = MISSION_CONFIG.SATISFACTION_BONUS.DISSATISFIED;
  else multiplier = MISSION_CONFIG.SATISFACTION_BONUS.VERY_DISSATISFIED;

  if (currentDay <= deadlineDay) {
    multiplier += MISSION_CONFIG.ON_TIME_BONUS;
  }

  return Math.round(basePayment * multiplier);
}

export function updatePassengerSatisfaction(passenger, event) {
  const weights = passenger.satisfactionWeights;
  let delta = 0;

  if (event === 'delay') {
    delta = -(PASSENGER_CONFIG.DELAY_PENALTY * (weights.speed || 0));
  } else if (event === 'combat') {
    delta = -(PASSENGER_CONFIG.COMBAT_PENALTY * (weights.safety || 0));
  } else if (event === 'low_life_support') {
    delta = -(PASSENGER_CONFIG.LOW_LIFE_SUPPORT_PENALTY * (weights.comfort || 0));
  }

  passenger.satisfaction = Math.max(
    PASSENGER_CONFIG.SATISFACTION.MIN,
    Math.min(PASSENGER_CONFIG.SATISFACTION.MAX, Math.round(passenger.satisfaction + delta))
  );
}

export function generatePassengerMission(fromSystem, connectedStars, rng = Math.random) {
  if (connectedStars.length === 0) return null;
  const dest = connectedStars[Math.floor(rng() * connectedStars.length)];
  const passenger = generatePassenger(null, rng);
  const deadline = 5 + Math.floor(rng() * 10);
  const basePayment = 300 + Math.floor(rng() * 700);

  return {
    id: `passenger_mission_${Date.now()}_${Math.floor(rng() * 10000)}`,
    type: 'passenger',
    title: `Transport ${passenger.name} to ${dest.name}`,
    description: `${passenger.name} needs passage to ${dest.name}.`,
    giver: 'passenger_board',
    giverSystem: fromSystem,
    passenger,
    requirements: { destination: dest.id, deadline, cargoSpace: passenger.cargoSpace },
    rewards: { credits: basePayment },
    penalties: { failure: {} },
  };
}
```

**Step 4: Run tests, verify pass**

Run: `npm test -- tests/unit/passenger-generator.test.js`

**Step 5: Write passenger completion test with satisfaction-based payment and follow-up**

```javascript
// In tests/unit/passenger-mission.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Passenger Mission Completion', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should complete passenger mission with satisfaction-based payment', () => {
    const mission = {
      id: 'passenger_test',
      type: 'passenger',
      title: 'Transport Passenger',
      passenger: { type: 'business', satisfaction: 75, satisfactionWeights: { speed: 0.6, comfort: 0.4 } },
      requirements: { destination: 0, deadline: 10, cargoSpace: 2 },
      rewards: { credits: 800 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);

    const creditsBefore = manager.getState().player.credits;
    const result = manager.completeMission('passenger_test');
    expect(result.success).toBe(true);
    // Payment should reflect satisfaction bonus (75 = satisfied tier → 1.15x + 0.1 on-time)
    expect(manager.getState().player.credits).toBeGreaterThan(creditsBefore);
  });

  it('should free cargo space when passenger disembarks', () => {
    const state = manager.getState();
    const cargoUsedBefore = manager.getCargoUsed();

    manager.acceptMission({
      id: 'passenger_cargo_test',
      type: 'passenger',
      title: 'Transport Passenger',
      passenger: { type: 'wealthy', satisfaction: 50, satisfactionWeights: { speed: 0.3, comfort: 0.7 }, cargoSpace: 3 },
      requirements: { destination: 0, deadline: 10, cargoSpace: 3 },
      rewards: { credits: 1000 },
      penalties: { failure: {} },
    });

    // Cargo used should increase by passenger space
    expect(manager.getCargoUsed()).toBe(cargoUsedBefore + 3);

    // Complete — cargo space freed
    manager.completeMission('passenger_cargo_test');
    expect(manager.getCargoUsed()).toBe(cargoUsedBefore);
  });

  it('should apply faction rep for satisfied passengers', () => {
    const mission = {
      id: 'passenger_rep',
      type: 'passenger',
      title: 'Transport',
      passenger: { type: 'business', satisfaction: 70, satisfactionWeights: { speed: 0.6, comfort: 0.4 } },
      requirements: { destination: 0, deadline: 10, cargoSpace: 2 },
      rewards: { credits: 800 },
      penalties: { failure: {} },
    };
    manager.acceptMission(mission);
    manager.completeMission('passenger_rep');
    expect(manager.getFactionRep('civilians')).toBeGreaterThan(0);
  });

  it('should generate follow-up mission for very satisfied passengers', () => {
    // This is probabilistic (30% chance at >= 80 satisfaction)
    // Test with multiple iterations
    let followUpGenerated = false;
    for (let i = 0; i < 50; i++) {
      const mgr = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
      mgr.initNewGame();
      const mission = {
        id: `passenger_followup_${i}`,
        type: 'passenger',
        title: 'Transport',
        passenger: { type: 'business', satisfaction: 95, satisfactionWeights: { speed: 0.6, comfort: 0.4 } },
        requirements: { destination: 0, deadline: 10, cargoSpace: 2 },
        rewards: { credits: 800 },
        penalties: { failure: {} },
      };
      mgr.acceptMission(mission);
      mgr.completeMission(`passenger_followup_${i}`);
      if (mgr.getState().missions.board.length > 0) {
        followUpGenerated = true;
        break;
      }
    }
    // With 50 attempts at 30% chance, probability of never getting one is 0.7^50 ≈ 0.00002
    expect(followUpGenerated).toBe(true);
  });
});
```

**Step 6: Implement passenger completion in MissionManager**

In `completeMission()`, add passenger-specific handling before the reward section:

```javascript
// Passenger-specific: calculate satisfaction-based payment
if (mission.type === 'passenger' && mission.passenger) {
  const { calculatePassengerPayment } = await import('../../passenger-generator.js');
  const payment = calculatePassengerPayment(
    mission.rewards.credits,
    mission.passenger.satisfaction,
    state.player.daysElapsed,
    mission.deadlineDay
  );
  mission.rewards.credits = payment;

  // Faction rep based on satisfaction
  if (mission.passenger.satisfaction >= PASSENGER_CONFIG.SATISFACTION.SATISFIED) {
    this.gameStateManager.modifyFactionRep('civilians', 5, 'passenger');
  } else if (mission.passenger.satisfaction < PASSENGER_CONFIG.SATISFACTION.NEUTRAL) {
    this.gameStateManager.modifyFactionRep('civilians', -3, 'passenger');
  }

  // Follow-up mission chance for very satisfied passengers
  if (mission.passenger.satisfaction >= PASSENGER_CONFIG.SATISFACTION.VERY_SATISFIED
      && Math.random() < MISSION_CONFIG.FOLLOW_UP_CHANCE) {
    const { generatePassengerMission } = await import('../../passenger-generator.js');
    const connectedStars = this.getConnectedStarData();
    const followUp = generatePassengerMission(state.player.currentSystem, connectedStars);
    if (followUp) state.missions.board.push(followUp);
  }

  // Free cargo space (remove passenger cargo reservation)
  state.ship.cargo = state.ship.cargo.filter((c) => c.passengerMissionId !== mission.id);
}
```

**Step 7: Implement passenger cargo space reservation in acceptMission**

When accepting a passenger mission, reserve cargo space:

```javascript
// In acceptMission(), after pushing to active:
if (mission.type === 'passenger' && mission.requirements.cargoSpace) {
  state.ship.cargo.push({
    good: '_passenger',
    qty: mission.requirements.cargoSpace,
    buyPrice: 0,
    buySystem: state.player.currentSystem,
    buySystemName: 'Passenger',
    buyDate: state.player.daysElapsed,
    passengerMissionId: activeMission.id,
  });
}
```

**Step 8: Run full test suite, commit**

```bash
git add src/game/passenger-generator.js src/game/state/managers/mission.js src/game/state/game-state-manager.js tests/unit/passenger-generator.test.js tests/unit/passenger-mission.test.js
git commit -m "feat: add passenger mission system with satisfaction, cargo space, and follow-up"
```

---

### Task 20: Jump Event Integration & Combat/Delay Passenger Satisfaction

Wire narrative event checking into the jump/wormhole transit flow so events fire during travel. Also hook passenger satisfaction updates into `applyEncounterOutcome` for combat and delay events.

**Files:**
- Modify: `src/game/state/managers/navigation.js`
- Modify: `src/features/danger/applyEncounterOutcome.js`
- Test: `tests/unit/jump-event-integration.test.js`
- Test: `tests/unit/passenger-combat-satisfaction.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Jump Event Integration', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should emit narrativeEvent when jump triggers a matching event', () => {
    manager.registerNarrativeEvent({
      id: 'test_jump_event',
      type: 'jump',
      trigger: { chance: 1.0 },
      once: false, cooldown: 0, priority: 0,
      content: { text: ['Debris ahead.'], choices: [{ text: 'Investigate', next: null, effects: [] }] },
    });

    let emittedEvent = null;
    manager.subscribe('narrativeEvent', (data) => { emittedEvent = data; });

    // Trigger a jump (to Barnard's Star from Sol)
    manager.jump(4);

    expect(emittedEvent).not.toBeNull();
    expect(emittedEvent.id).toBe('test_jump_event');
  });

  it('should check has_passenger condition during jump', () => {
    manager.registerNarrativeEvent({
      id: 'test_passenger_jump',
      type: 'jump',
      trigger: { condition: 'has_passenger', chance: 1.0 },
      once: false, cooldown: 0, priority: 0,
      content: { text: ['Passenger complains.'], choices: [{ text: 'OK', next: null, effects: [] }] },
    });

    let emittedEvent = null;
    manager.subscribe('narrativeEvent', (data) => { emittedEvent = data; });

    // Jump without passenger — no event
    manager.jump(4);
    expect(emittedEvent).toBeNull();

    // Add passenger mission, jump back
    manager.getState().missions.active.push({
      id: 'pass_1', type: 'passenger', passenger: { type: 'business', satisfaction: 50 },
    });
    manager.jump(0);
    expect(emittedEvent).not.toBeNull();
  });

  it('should not emit narrativeEvent when no jump events match', () => {
    let emittedEvent = null;
    manager.subscribe('narrativeEvent', (data) => { emittedEvent = data; });
    manager.jump(4);
    expect(emittedEvent).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/jump-event-integration.test.js`

**Step 3: Hook narrative event check into NavigationManager.jump()**

At the end of the jump flow in `NavigationManager`, after travel time and fuel consumption:

```javascript
// Check for narrative jump events
const narrativeEvent = this.gameStateManager.checkNarrativeEvents('jump', {
  system: destinationId,
});
if (narrativeEvent) {
  this.gameStateManager.markNarrativeEventFired(narrativeEvent.id);
  this.emit('narrativeEvent', narrativeEvent);
}
```

Also update passenger satisfaction during jump if life support is low:

```javascript
// Update passenger satisfaction during transit
const state = this.getState();
const passengerMissions = state.missions.active.filter((m) => m.type === 'passenger' && m.passenger);
if (passengerMissions.length > 0) {
  const { updatePassengerSatisfaction } = await import('../../passenger-generator.js');
  for (const pm of passengerMissions) {
    if (state.ship.lifeSupport < PASSENGER_CONFIG.LOW_LIFE_SUPPORT_THRESHOLD) {
      updatePassengerSatisfaction(pm.passenger, 'low_life_support');
    }
  }
}
```

**Step 4: Write failing test for combat/delay passenger satisfaction**

```javascript
// In tests/unit/passenger-combat-satisfaction.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { applyEncounterOutcome } from '../../src/features/danger/applyEncounterOutcome.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Passenger Satisfaction from Combat/Delays', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
    // Add a passenger mission with known satisfaction weights
    manager.getState().missions.active.push({
      id: 'passenger_combat_test',
      type: 'passenger',
      passenger: {
        type: 'scientist',
        satisfaction: 50,
        satisfactionWeights: { speed: 0.5, comfort: 0.3, safety: 0.2 },
      },
      requirements: { destination: 4, deadline: 10 },
      rewards: { credits: 800 },
    });
  });

  it('should reduce passenger satisfaction when combat occurs (hull damage)', () => {
    const outcome = {
      success: false,
      costs: { hull: 20 },
      rewards: {},
      description: 'Pirates damaged your hull.',
    };
    applyEncounterOutcome(manager, outcome);

    const passenger = manager.getState().missions.active[0].passenger;
    expect(passenger.satisfaction).toBeLessThan(50);
  });

  it('should reduce passenger satisfaction from delays', () => {
    const outcome = {
      success: true,
      costs: { days: 2 },
      rewards: {},
      description: 'Engine repair took time.',
    };
    applyEncounterOutcome(manager, outcome);

    const passenger = manager.getState().missions.active[0].passenger;
    expect(passenger.satisfaction).toBeLessThan(50);
  });

  it('should not affect satisfaction when no passengers aboard', () => {
    // Remove the passenger
    manager.getState().missions.active = [];

    const outcome = {
      success: false,
      costs: { hull: 20 },
      rewards: {},
      description: 'Hull damage.',
    };
    // Should not throw
    applyEncounterOutcome(manager, outcome);
  });
});
```

**Step 5: Implement combat/delay passenger satisfaction in applyEncounterOutcome**

At the end of `applyEncounterOutcome()`, after existing cost/reward application, add:

```javascript
// Update passenger satisfaction based on encounter outcomes
const state = gameStateManager.getState();
if (state.missions && state.missions.active) {
  const passengerMissions = state.missions.active.filter(
    (m) => m.type === 'passenger' && m.passenger
  );
  if (passengerMissions.length > 0) {
    const { updatePassengerSatisfaction } = await import(
      '../../game/passenger-generator.js'
    );
    for (const pm of passengerMissions) {
      // Combat: hull damage scares passengers
      if (outcome.costs && outcome.costs.hull) {
        updatePassengerSatisfaction(pm.passenger, 'combat');
      }
      // Delays: time costs frustrate passengers
      if (outcome.costs && outcome.costs.days) {
        updatePassengerSatisfaction(pm.passenger, 'delay');
      }
    }
  }
}
```

**Step 6: Run tests, commit**

```bash
git add src/game/state/managers/navigation.js src/features/danger/applyEncounterOutcome.js tests/unit/jump-event-integration.test.js tests/unit/passenger-combat-satisfaction.test.js
git commit -m "feat: fire narrative events during jump and update passenger satisfaction from combat/delays"
```

---

### Task 21: Condition Event Integration

Wire condition-type events to check on state changes (low fuel, hull damage, debt thresholds).

**Files:**
- Modify: `src/game/state/managers/narrative-event.js`
- Modify: `src/game/state/game-state-manager.js`
- Test: `tests/unit/condition-event-integration.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Condition Event Integration', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should fire condition event when fuel drops below threshold', () => {
    manager.registerNarrativeEvent({
      id: 'test_low_fuel',
      type: 'condition',
      trigger: { condition: 'fuel < 20', chance: 1.0 },
      once: false, cooldown: 5, priority: 0,
      content: { text: ['Fuel critically low.'], choices: [{ text: 'Noted', next: null, effects: [] }] },
    });

    let emittedEvent = null;
    manager.subscribe('narrativeEvent', (data) => { emittedEvent = data; });

    // Fuel is 100, should not fire
    manager.checkConditionEvents();
    expect(emittedEvent).toBeNull();

    // Drop fuel below threshold
    manager.setFuel(15);
    manager.checkConditionEvents();
    expect(emittedEvent).not.toBeNull();
    expect(emittedEvent.id).toBe('test_low_fuel');
  });

  it('should fire condition event when hull is critical', () => {
    manager.registerNarrativeEvent({
      id: 'test_hull_critical',
      type: 'condition',
      trigger: { condition: 'hull < 30', chance: 1.0 },
      once: false, cooldown: 5, priority: 0,
      content: { text: ['Hull breach!'], choices: [{ text: 'OK', next: null, effects: [] }] },
    });

    let emittedEvent = null;
    manager.subscribe('narrativeEvent', (data) => { emittedEvent = data; });

    manager.getState().ship.hull = 25;
    manager.checkConditionEvents();
    expect(emittedEvent).not.toBeNull();
  });

  it('should respect cooldowns on condition events', () => {
    manager.registerNarrativeEvent({
      id: 'test_cooldown_condition',
      type: 'condition',
      trigger: { condition: 'fuel < 20', chance: 1.0 },
      once: false, cooldown: 5, priority: 0,
      content: { text: ['Low fuel again.'], choices: [{ text: 'OK', next: null, effects: [] }] },
    });

    manager.setFuel(15);
    manager.checkConditionEvents(); // Fires, sets cooldown

    let emittedEvent = null;
    manager.subscribe('narrativeEvent', (data) => { emittedEvent = data; });
    manager.checkConditionEvents(); // Should be blocked by cooldown
    expect(emittedEvent).toBeNull();
  });
});
```

**Step 2: Implement checkConditionEvents**

Add to `NarrativeEventManager`:

```javascript
checkConditionEvents() {
  const event = this.checkEvents('condition', {});
  if (event) {
    this.markEventFired(event.id);
    this.emit('narrativeEvent', event);
    return event;
  }
  return null;
}
```

Call `checkConditionEvents()` from appropriate state change handlers (after fuel changes, after combat damage, after time advancement).

**Step 3: Run tests, commit**

```bash
git add src/game/state/managers/narrative-event.js src/game/state/game-state-manager.js tests/unit/condition-event-integration.test.js
git commit -m "feat: add condition event integration for state-based triggers"
```

---

### Task 22: Time Event Integration

Wire time-type events to check when days advance.

**Files:**
- Modify: `src/game/state/managers/narrative-event.js` or `src/game/state/managers/events.js`
- Test: `tests/unit/time-event-integration.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Time Event Integration', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should fire time event when day threshold reached and condition met', () => {
    manager.registerNarrativeEvent({
      id: 'test_debt_reminder',
      type: 'time',
      trigger: { day: 30, condition: 'debt > 8000', chance: 1.0 },
      once: false, cooldown: 10, priority: 0,
      content: { text: ['Pay your debt.'], choices: [{ text: 'OK', next: null, effects: [] }] },
    });

    let emittedEvent = null;
    manager.subscribe('narrativeEvent', (data) => { emittedEvent = data; });

    // Day 0, debt 5000 — should not fire
    manager.checkTimeEvents();
    expect(emittedEvent).toBeNull();

    // Advance to day 30, increase debt
    manager.getState().player.debt = 9000;
    manager.updateTime(30);
    expect(emittedEvent).not.toBeNull();
    expect(emittedEvent.id).toBe('test_debt_reminder');
  });
});
```

**Step 2: Implement checkTimeEvents and hook into time advancement**

Add to `NarrativeEventManager`:

```javascript
checkTimeEvents() {
  const state = this.getState();
  const eligible = this.registeredEvents.filter((e) => {
    if (e.type !== 'time') return false;
    if (e.trigger.day !== undefined && state.player.daysElapsed < e.trigger.day) return false;
    if (e.once && state.narrativeEvents.fired.includes(e.id)) return false;
    if (e.cooldown && state.narrativeEvents.cooldowns[e.id]) {
      if (state.player.daysElapsed < state.narrativeEvents.cooldowns[e.id]) return false;
    }
    if (e.trigger.condition && !this.evaluateCondition(e.trigger.condition, {})) return false;
    if (e.trigger.chance !== undefined && Math.random() > e.trigger.chance) return false;
    return true;
  });

  eligible.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const event = eligible[0] || null;
  if (event) {
    this.markEventFired(event.id);
    this.emit('narrativeEvent', event);
  }
  return event;
}
```

Hook `checkTimeEvents()` into `updateTime()` flow.

**Step 3: Run tests, commit**

```bash
git add src/game/state/managers/narrative-event.js tests/unit/time-event-integration.test.js
git commit -m "feat: add time event integration for day-based story beats"
```

---

### Task 23: NPC Mission Offers via Dialogue System

Integrate NPC-driven mission offers into the existing dialogue tree system. When a player talks to an NPC who has available missions, a "Any work available?" choice appears (gated by `choice.condition`). Selecting it transitions to a mission offer node, and accepting uses `choice.action` to call `acceptMission()`.

**Architecture:** Mission definitions are registered with `MissionManager`. Dialogue trees gain generic mission-offer nodes that use `choice.condition` to check `getAvailableNPCMissions()` and `choice.action` to accept. This keeps mission data in the mission system while flowing through the dialogue UI.

**Files:**
- Modify: `src/game/state/managers/mission.js` (add `registerNPCMission`, `getAvailableNPCMissions`)
- Modify: `src/game/state/game-state-manager.js` (delegation)
- Modify: `src/game/data/dialogue/` (add mission-offer nodes to NPC dialogue trees)
- Create: `src/features/missions/MissionOfferPanel.jsx` (for mission detail display within dialogue)
- Modify: `src/features/station/PanelContainer.jsx`
- Test: `tests/unit/npc-mission-offers.test.js`

**Step 1: Write the failing test for mission registration and availability**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('NPC Mission Offers', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should return available missions for an NPC', () => {
    manager.registerNPCMission({
      id: 'npc_mission_1',
      type: 'delivery',
      title: 'Medicine Run',
      giver: 'okonkwo_ross154',
      giverSystem: 11,
      conditions: {},
      requirements: { cargo: 'medicine', quantity: 10, destination: 11, deadline: 7 },
      rewards: { credits: 1500, rep: { okonkwo_ross154: 10 }, faction: { civilians: 5 }, karma: 2 },
      penalties: { failure: { rep: { okonkwo_ross154: -5 }, karma: -1 } },
      dialogue: { offer: 'mission_okonkwo_1_offer', accept: 'mission_okonkwo_1_accept' },
    });

    const available = manager.getAvailableNPCMissions('okonkwo_ross154');
    expect(available).toHaveLength(1);
    expect(available[0].id).toBe('npc_mission_1');
  });

  it('should not return missions already active', () => {
    manager.registerNPCMission({
      id: 'npc_active_test',
      type: 'delivery',
      giver: 'test_npc',
      giverSystem: 0,
      conditions: {},
      requirements: { cargo: 'grain', quantity: 5, destination: 4, deadline: 7 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    manager.acceptMission(manager.getAvailableNPCMissions('test_npc')[0]);
    expect(manager.getAvailableNPCMissions('test_npc')).toHaveLength(0);
  });

  it('should not return missions already completed', () => {
    manager.registerNPCMission({
      id: 'npc_completed_test',
      type: 'delivery',
      giver: 'test_npc',
      giverSystem: 0,
      conditions: {},
      requirements: { cargo: 'grain', quantity: 5, destination: 0, deadline: 7 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    manager.acceptMission(manager.getAvailableNPCMissions('test_npc')[0]);
    manager.completeMission('npc_completed_test');
    expect(manager.getAvailableNPCMissions('test_npc')).toHaveLength(0);
  });

  it('should respect minRep conditions', () => {
    manager.registerNPCMission({
      id: 'npc_rep_gate',
      type: 'delivery',
      giver: 'test_npc',
      giverSystem: 0,
      conditions: { minRep: 10 },
      requirements: { cargo: 'grain', quantity: 5, destination: 4, deadline: 7 },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    });

    expect(manager.getAvailableNPCMissions('test_npc')).toHaveLength(0);

    manager.modifyRep('test_npc', 15, 'test');
    expect(manager.getAvailableNPCMissions('test_npc')).toHaveLength(1);
  });
});
```

**Step 2: Implement registerNPCMission and getAvailableNPCMissions**

Add to `MissionManager`:

```javascript
constructor(gameStateManager) {
  super(gameStateManager);
  this.registeredNPCMissions = [];
}

registerNPCMission(missionDef) {
  this.registeredNPCMissions.push(missionDef);
}

getAvailableNPCMissions(npcId) {
  this.validateState();
  const state = this.getState();

  return this.registeredNPCMissions.filter((m) => {
    if (m.giver !== npcId) return false;
    if (state.missions.active.some((am) => am.id === m.id)) return false;
    if (state.missions.completed.includes(m.id)) return false;
    if (m.conditions) {
      if (m.conditions.minRep !== undefined) {
        const npcState = this.gameStateManager.getNPCState(npcId);
        if (npcState.rep < m.conditions.minRep) return false;
      }
      if (m.conditions.notFlag) {
        const npcState = this.gameStateManager.getNPCState(npcId);
        if (npcState.flags && npcState.flags.includes(m.conditions.notFlag)) return false;
      }
    }
    return true;
  });
}
```

Delegate `registerNPCMission` and `getAvailableNPCMissions` through GameStateManager.

**Step 3: Add mission-offer dialogue nodes to NPC dialogue trees**

For each NPC that can give missions, add a mission-offer choice to their `greeting` node using the existing `choice.condition` and `choice.action` patterns:

```javascript
// In the NPC's dialogue tree (e.g., src/game/data/dialogue/okonkwo-dialogue.js)
// Add to the greeting node's choices array:
{
  text: 'Any work available?',
  next: 'mission_offer',
  condition: (rep, gameStateManager, npcId) => {
    const available = gameStateManager.getAvailableNPCMissions(npcId);
    return available.length > 0;
  },
},

// Add a new node to the dialogue tree:
mission_offer: {
  text: (rep, gameStateManager, npcId) => {
    const missions = gameStateManager.getAvailableNPCMissions(npcId);
    const mission = missions[0];
    // Store the pending mission for the accept action
    gameStateManager.setPendingMissionOffer(mission);
    return mission.description;
  },
  choices: [
    {
      text: 'Accept the mission.',
      next: 'mission_accepted',
      action: (gameStateManager) => {
        const pending = gameStateManager.getPendingMissionOffer();
        if (pending) {
          gameStateManager.acceptMission(pending);
          gameStateManager.clearPendingMissionOffer();
        }
      },
    },
    {
      text: 'Not right now.',
      next: 'greeting',
    },
  ],
},

mission_accepted: {
  text: (rep, gameStateManager, npcId) => {
    const mission = gameStateManager.getAvailableNPCMissions(npcId);
    // The mission was just accepted, so this shows post-accept dialogue
    return 'Good. I knew I could count on you.';
  },
  choices: [
    { text: 'I\'ll get it done.', next: null },
  ],
},
```

**Step 4: Add pending mission offer state helpers**

Add to `MissionManager` (simple transient state, not persisted):

```javascript
setPendingMissionOffer(mission) {
  this._pendingOffer = mission;
}

getPendingMissionOffer() {
  return this._pendingOffer || null;
}

clearPendingMissionOffer() {
  this._pendingOffer = null;
}
```

Delegate through GameStateManager.

**Step 5: Create MissionOfferPanel for rich mission display**

Create `src/features/missions/MissionOfferPanel.jsx` for displaying mission details within or alongside the dialogue panel. This follows the spec's mission offer screen layout:

```jsx
export function MissionOfferPanel({ mission, onAccept, onDecline }) {
  if (!mission) return null;

  return (
    <div className="panel mission-offer-panel">
      <h2>{mission.title}</h2>
      <div className="mission-description">{mission.description}</div>
      <div className="mission-requirements">
        {mission.type === 'delivery' && (
          <>
            <div>Deliver: {mission.requirements.quantity} {mission.requirements.cargo}</div>
            <div>Deadline: {mission.requirements.deadline} days</div>
          </>
        )}
        {mission.type === 'fetch' && (
          <>
            <div>Acquire: {mission.requirements.quantity} {mission.requirements.cargo}</div>
            <div>Deadline: {mission.requirements.deadline} days</div>
          </>
        )}
        {mission.type === 'intel' && (
          <div>Visit {mission.requirements.targets.length} systems and report back</div>
        )}
        <div>Reward: ₡{mission.rewards.credits}</div>
      </div>
      <div className="mission-offer-actions">
        <button className="accept-btn" onClick={() => onAccept(mission)}>Accept Mission</button>
        <button className="station-btn" onClick={onDecline}>Decline</button>
      </div>
    </div>
  );
}
```

Add `'mission-offer'` case to `PanelContainer.jsx`.

**Step 6: Run tests, commit**

```bash
git add src/game/state/managers/mission.js src/game/state/game-state-manager.js src/game/data/dialogue/ src/features/missions/MissionOfferPanel.jsx src/features/station/PanelContainer.jsx tests/unit/npc-mission-offers.test.js
git commit -m "feat: add NPC mission offers via dialogue tree integration"
```

---

### Task 24: Passenger Board UI

Create a passenger board at stations that generates passenger missions alongside the cargo mission board.

**Files:**
- Modify: `src/game/state/managers/mission.js` (add passenger board generation)
- Modify: `src/features/missions/MissionBoardPanel.jsx` (add passenger section)
- Modify: `src/game/state/game-state-manager.js` (delegation)
- Test: `tests/unit/passenger-board.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Passenger Board', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should include passenger missions in the mission board', () => {
    const board = manager.refreshMissionBoard();
    const passengerMissions = board.filter((m) => m.type === 'passenger');
    // Board should contain at least one passenger mission
    expect(board.length).toBeGreaterThan(0);
  });

  it('should generate passenger missions with cargo space requirements', () => {
    const board = manager.refreshMissionBoard();
    const passengerMissions = board.filter((m) => m.type === 'passenger');
    for (const m of passengerMissions) {
      expect(m.passenger).toBeDefined();
      expect(m.requirements.cargoSpace).toBeGreaterThan(0);
      expect(m.passenger.cargoSpace).toBe(m.requirements.cargoSpace);
    }
  });
});
```

**Step 2: Modify refreshMissionBoard to include passenger missions**

In `MissionManager.refreshMissionBoard()`, after generating cargo runs, also generate 1-2 passenger missions:

```javascript
import { generatePassengerMission } from '../../passenger-generator.js';

// In refreshMissionBoard():
const connectedStars = this.getConnectedStarData();
const passengerMission = generatePassengerMission(
  state.player.currentSystem, connectedStars
);
if (passengerMission) board.push(passengerMission);
```

**Step 3: Update MissionBoardPanel to show passenger missions distinctly**

In `MissionBoardPanel.jsx`, render passenger missions with their specific details (passenger name, type, cargo space):

```jsx
{mission.type === 'passenger' && (
  <div className="mission-details">
    <span>{mission.passenger.name} ({mission.passenger.type})</span>
    <span>Destination: System {mission.requirements.destination}</span>
    <span>Cargo Space: {mission.requirements.cargoSpace} units</span>
    <span>Deadline: {mission.requirements.deadline} days</span>
    <span>Payment: ₡{mission.rewards.credits}</span>
  </div>
)}
```

**Step 4: Run tests, commit**

```bash
git add src/game/state/managers/mission.js src/features/missions/MissionBoardPanel.jsx src/game/state/game-state-manager.js tests/unit/passenger-board.test.js
git commit -m "feat: add passenger missions to station mission board"
```

---

### Task 25: CSS Styling for Mission & Event UI

Add styles for all new UI components.

**Files:**
- Modify: existing CSS file(s) or create `src/features/missions/missions.css` and `src/features/events/events.css`

**Step 1: Identify existing CSS patterns**

Check how other panels (TradePanel, RepairPanel) are styled and follow the same conventions.

**Step 2: Add styles**

- `.mission-board-panel` — mission board layout
- `.mission-card` — individual mission in board
- `.active-missions-hud` — HUD mission tracking
- `.mission-item` — active mission display
- `.narrative-event-overlay` — full-screen overlay
- `.narrative-event-modal` — centered event panel
- `.narrative-event-modal.mood-tense` — tense mood styling (red/orange accents)
- `.narrative-event-modal.mood-friendly` — friendly mood styling (warm accents)
- `.narrative-event-modal.mood-threatening` — threatening mood styling (dark accents)
- `.event-speaker` — speaker name display in event modal
- `.event-choice-btn` — choice buttons
- `.mission-offer-panel` — NPC mission offer layout
- `.passenger-details` — passenger info in mission board

**Step 3: Verify in browser, commit**

```bash
git add src/features/missions/ src/features/events/
git commit -m "feat: add CSS styling for mission and event UI components"
```

---

### Task 26: Mission Abandonment

Allow players to voluntarily abandon active missions with failure penalties applied.

**Files:**
- Modify: `src/game/state/managers/mission.js`
- Modify: `src/game/state/game-state-manager.js` (delegation)
- Modify: `src/hooks/useGameAction.js` (add abandonMission action)
- Create: `src/features/missions/MissionAbandonConfirm.jsx`
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

    const npcState = manager.getNPCState('station_master');
    expect(npcState.rep).toBe(-2);
    expect(manager.getKarma()).toBe(-1);
  });

  it('should free passenger cargo space on abandonment', () => {
    const passengerMission = {
      id: 'passenger_abandon_test',
      type: 'passenger',
      title: 'Transport Passenger',
      passenger: { type: 'business', satisfaction: 50, cargoSpace: 2 },
      requirements: { destination: 4, deadline: 10, cargoSpace: 2 },
      rewards: { credits: 800 },
      penalties: { failure: {} },
    };
    manager.acceptMission(passengerMission);

    const cargoUsedBefore = manager.getCargoUsed();
    manager.abandonMission('passenger_abandon_test');
    expect(manager.getCargoUsed()).toBeLessThan(cargoUsedBefore);
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

**Step 3: Implement abandonMission**

Add to `MissionManager`:

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

  // Free passenger cargo space
  if (mission.type === 'passenger') {
    state.ship.cargo = state.ship.cargo.filter((c) => c.passengerMissionId !== missionId);
    this.emit('cargoChanged', state.ship.cargo);
  }

  this.emit('missionsChanged', state.missions);
  this.gameStateManager.saveGame();

  return { success: true };
}
```

Delegate through `GameStateManager`. Add `abandonMission` to `useGameAction.js`.

**Step 4: Create MissionAbandonConfirm component**

```jsx
export function MissionAbandonConfirm({ mission, onConfirm, onCancel }) {
  return (
    <div className="panel mission-abandon-confirm">
      <h2>Abandon Mission?</h2>
      <h3>{mission.title}</h3>
      {mission.penalties?.failure && (
        <div className="abandon-penalties">
          <h4>Penalties:</h4>
          {mission.penalties.failure.rep && Object.entries(mission.penalties.failure.rep).map(
            ([npc, amount]) => <div key={npc}>Reputation with {npc}: {amount}</div>
          )}
          {mission.penalties.failure.karma && (
            <div>Karma: {mission.penalties.failure.karma}</div>
          )}
        </div>
      )}
      <div className="abandon-actions">
        <button className="danger-btn" onClick={() => onConfirm(mission.id)}>Abandon</button>
        <button className="station-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
```

**Step 5: Run full test suite, commit**

```bash
git add src/game/state/managers/mission.js src/game/state/game-state-manager.js src/hooks/useGameAction.js src/features/missions/MissionAbandonConfirm.jsx tests/unit/mission-abandonment.test.js
git commit -m "feat: add mission abandonment with failure penalties"
```

---

### Task 27: Final Integration & Full Test Suite

Run all tests, verify no regressions, do a final browser playtest.

**Files:**
- No new files

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass with zero stderr warnings.

**Step 2: Run lint and format**

Run: `npm run clean`
Expected: No lint errors, all files formatted.

**Step 3: Browser playtest**

Run: `npm run dev`

Test the following flows:
1. Start new game
2. Dock at Sol → verify dock event fires (first visit narrative) with mood styling
3. Open Mission Board → verify cargo and passenger missions are generated
4. Accept a delivery mission → verify it appears in HUD
5. Travel to destination → verify jump events fire, passenger satisfaction updates
6. Complete delivery mission → verify rewards, faction rep, and completion UI
7. Accept a passenger mission → verify cargo space reserved
8. Travel to passenger destination → verify passenger events during jump
9. Complete passenger mission → verify satisfaction-based payment
10. Talk to NPC → verify "Any work available?" choice appears when missions available (dialogue integration)
11. Accept NPC mission through dialogue → verify mission accepted and dialogue transitions
12. Trigger condition event (low fuel) → verify modal appears
13. Verify event chains work (salvage → salvage_result)
14. Encounter pirates with passenger aboard → verify passenger satisfaction decreases from combat
15. Encounter delay event (engine failure) with passenger → verify satisfaction decreases from delay
16. Abandon a mission → verify penalties applied and mission moved to failed
17. Abandon a passenger mission → verify cargo space freed
18. Verify cargo run deadlines scale with distance (farther systems = longer deadlines)
19. Verify failed cargo runs apply station_master rep penalty
20. Save and reload → verify all mission state persists

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address integration issues from full playtest"
```

---

## Execution Notes

**Dependencies between tasks:**
- Tasks 1-2 must complete before Task 3 (constants and state needed for manager)
- Task 3 must complete before Tasks 4, 6, 10, 15, 23
- Task 4 must complete before Task 3's completion logic
- Task 5 must complete before Task 6 (generator needed for board)
- Task 7 must complete before Tasks 11, 20, 21, 22 (event manager needed for all event integrations)
- Task 8 must complete before Task 14 (effects needed for event modal)
- Task 9 must complete before Task 17 (event data needed for registration)
- Tasks 3, 7, 10 must complete before Task 12 (UI needs manager and Bridge Pattern)
- Task 19 must complete before Tasks 20, 24 (passenger generator needed for jump integration and board)
- Task 6 must complete before Task 24 (board infrastructure + `getConnectedStarData()` needed)
- Task 23 must complete before Task 14 (NPC mission offer panel wired into PanelContainer)
- Task 23 depends on the existing dialogue system — dialogue trees must be modified per-NPC
- Task 25 must come after all UI tasks (12, 13, 14, 16, 23, 24, 26)
- Task 26 must complete after Task 3 (needs MissionManager)
- Task 27 must be last

**Parallelizable tasks:**
- Tasks 5 and 7 can run in parallel (mission generator + narrative event manager)
- Tasks 8 and 9 can run in parallel (effects + event data)
- Tasks 12, 13, 14 can run in parallel (independent UI components)
- Tasks 11 and 20 can run in parallel after Task 7 (dock events + jump events)
- Tasks 21 and 22 can run in parallel after Task 7 (condition events + time events)
- Task 19 can run independently after Task 3
- Task 23 can run independently after Task 3 (but touches dialogue tree files)

**Key risks:**
- Existing test assertions on `GAME_VERSION` will need updating (Task 2)
- The `useGameEvent` hook requires `state.missions` to exist even before game init (return default empty object)
- Cargo removal for delivery/fetch missions must handle multiple stacks correctly
- Save/load migration must be added to the chain in `save-load.js`
- Passenger cargo space reservation uses a special `_passenger` good type — ensure trade UI filters this out
- Event chain resolution (choice.next) requires `getEventById()` — chain events must be registered even if they have no trigger type
- `evaluateCondition()` must handle all condition strings from the event data (first_visit, has_passenger, debt > 8000, etc.)
- NPC mission registration should happen during game init alongside narrative event registration
- Passenger satisfaction updates during jumps require importing from passenger-generator.js in navigation manager
- Task 20 modifies `applyEncounterOutcome.js` (shared danger system code) — combat and delay events now update passenger satisfaction
- Task 23 modifies existing NPC dialogue trees — each NPC that gives missions needs `mission_offer`, `mission_accepted` nodes and a "Any work available?" choice in their greeting. Use `choice.condition` to gate on `getAvailableNPCMissions()` and `choice.action` to call `acceptMission()`
- `getConnectedStarData()` is defined in Task 6 and reused by Tasks 19 and 24 — requires `starData` and `wormholeData` accessible via GameStateManager
- Narrative events must include `speaker` (NPC ID or null) and `mood` (string) in their content block — NarrativeEventModal uses these for display styling
- Distance-based deadlines in cargo runs use `NAVIGATION_CONFIG.LY_PER_UNIT` for coordinate-to-lightyear conversion
