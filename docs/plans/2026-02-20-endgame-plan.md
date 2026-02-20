# Endgame Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Tanaka Sequence questline, Pavonis Run victory sequence, and epilogue system — the complete endgame for Tramp Freighter Blues.

**Architecture:** A generic, data-driven `QuestManager` extends `BaseManager` and manages structured questline state. Tanaka's 5-mission sequence is the first registered quest. Two new App.jsx view modes (`PAVONIS_RUN`, `EPILOGUE`) handle the victory flow. Template-driven epilogue selects narrative paragraphs based on player stats.

**Tech Stack:** React 18, Vitest, existing Bridge Pattern (useGameEvent/useGameAction), GameStateManager delegation pattern, narrative event engine.

**Design doc:** `docs/plans/2026-02-20-endgame-design.md`

---

## Phase 1: Foundation

### Task 1: Add Endgame Constants

**Files:**
- Modify: `src/game/constants.js`

**Step 1: Add ENDGAME_CONFIG and QUEST_CONFIG constants**

Add after the existing `MISSION_CONFIG` section (around line 200):

```js
export const ENDGAME_CONFIG = {
  VICTORY_CREDITS: 25000,
  TANAKA_SYSTEM: 4, // Barnard's Star
  TANAKA_UNLOCK_SYSTEMS_VISITED: 5,
  STAGE_1_REP: 10,
  STAGE_1_ENGINE: 80,
  STAGE_1_JUMPS: 3,
  STAGE_1_REWARD_CREDITS: 1000,
  STAGE_1_REWARD_REP: 15,
  STAGE_2_REP: 30,
  STAGE_2_EXOTIC_NEEDED: 5,
  STAGE_2_EXOTIC_DISTANCE: 15, // LY from Sol
  STAGE_2_EXOTIC_CHANCE: 0.6,
  STAGE_2_REWARD_CREDITS: 3000,
  STAGE_2_REWARD_REP: 15,
  STAGE_3_REP: 50,
  STAGE_3_HULL: 70,
  STAGE_3_ENGINE: 80,
  STAGE_3_REWARD_CREDITS: 2000,
  STAGE_3_REWARD_REP: 20,
  STAGE_4_REP: 70,
  STAGE_4_REWARD_REP: 20,
  STAGE_4_DELIVERY_SYSTEM: 13, // Epsilon Eridani
  STAGE_5_REP: 90,
  STAGE_5_HULL: 80,
  STAGE_5_ENGINE: 90,
  VICTORY_STAGE: 6,
  DELTA_PAVONIS_ID: 115,
};

export const QUEST_CONFIG = {
  STAGE_NOT_STARTED: 0,
  MAX_STAGE: 5,
};
```

**Step 2: Add new CONDITION_TYPES entries**

Add to the existing `CONDITION_TYPES` export (around line 1494):

```js
// Add these entries to the existing CONDITION_TYPES object:
NPC_REP_ABOVE: 'npc_rep_above',
SYSTEMS_VISITED_COUNT: 'systems_visited_count',
HAS_UPGRADE: 'has_upgrade',
QUEST_STAGE: 'quest_stage',
DEBT_ZERO: 'debt_zero',
CREDITS_ABOVE: 'credits_above',
HULL_ABOVE: 'hull_above',
ENGINE_ABOVE: 'engine_above',
```

**Step 3: Commit**

```bash
git add src/game/constants.js
git commit -m "feat: add endgame and quest constants"
```

---

### Task 2: Add New Condition Types to Event Engine

**Files:**
- Modify: `src/game/event-conditions.js`
- Test: `tests/unit/event-conditions.test.js`

**Step 1: Write failing tests for new condition types**

Add to the existing test file `tests/unit/event-conditions.test.js`:

```js
describe('npc_rep_above', () => {
  it('returns true when NPC rep meets threshold', () => {
    const state = createBaseState();
    state.npcs = { tanaka_barnards: { rep: 50 } };
    const result = evaluateCondition(
      { type: CONDITION_TYPES.NPC_REP_ABOVE, npcId: 'tanaka_barnards', value: 30 },
      state
    );
    expect(result).toBe(true);
  });

  it('returns false when NPC rep below threshold', () => {
    const state = createBaseState();
    state.npcs = { tanaka_barnards: { rep: 10 } };
    const result = evaluateCondition(
      { type: CONDITION_TYPES.NPC_REP_ABOVE, npcId: 'tanaka_barnards', value: 30 },
      state
    );
    expect(result).toBe(false);
  });

  it('returns false when NPC state does not exist', () => {
    const state = createBaseState();
    state.npcs = {};
    const result = evaluateCondition(
      { type: CONDITION_TYPES.NPC_REP_ABOVE, npcId: 'tanaka_barnards', value: 30 },
      state
    );
    expect(result).toBe(false);
  });
});

describe('systems_visited_count', () => {
  it('returns true when enough systems visited', () => {
    const state = createBaseState();
    state.world.visitedSystems = [0, 1, 4, 5, 7];
    const result = evaluateCondition(
      { type: CONDITION_TYPES.SYSTEMS_VISITED_COUNT, value: 5 },
      state
    );
    expect(result).toBe(true);
  });

  it('returns false when not enough systems visited', () => {
    const state = createBaseState();
    state.world.visitedSystems = [0, 1];
    const result = evaluateCondition(
      { type: CONDITION_TYPES.SYSTEMS_VISITED_COUNT, value: 5 },
      state
    );
    expect(result).toBe(false);
  });
});

describe('quest_stage', () => {
  it('returns true when quest is at specified stage', () => {
    const state = createBaseState();
    state.quests = { tanaka: { stage: 2 } };
    const result = evaluateCondition(
      { type: CONDITION_TYPES.QUEST_STAGE, questId: 'tanaka', value: 2 },
      state
    );
    expect(result).toBe(true);
  });

  it('returns false when quest not at stage', () => {
    const state = createBaseState();
    state.quests = { tanaka: { stage: 1 } };
    const result = evaluateCondition(
      { type: CONDITION_TYPES.QUEST_STAGE, questId: 'tanaka', value: 2 },
      state
    );
    expect(result).toBe(false);
  });

  it('returns false when quest does not exist', () => {
    const state = createBaseState();
    state.quests = {};
    const result = evaluateCondition(
      { type: CONDITION_TYPES.QUEST_STAGE, questId: 'tanaka', value: 1 },
      state
    );
    expect(result).toBe(false);
  });
});

describe('debt_zero', () => {
  it('returns true when debt is zero', () => {
    const state = createBaseState();
    state.player.debt = 0;
    expect(evaluateCondition({ type: CONDITION_TYPES.DEBT_ZERO }, state)).toBe(true);
  });

  it('returns false when debt exists', () => {
    const state = createBaseState();
    state.player.debt = 5000;
    expect(evaluateCondition({ type: CONDITION_TYPES.DEBT_ZERO }, state)).toBe(false);
  });
});

describe('credits_above', () => {
  it('returns true when credits meet threshold', () => {
    const state = createBaseState();
    state.player.credits = 30000;
    expect(evaluateCondition({ type: CONDITION_TYPES.CREDITS_ABOVE, value: 25000 }, state)).toBe(true);
  });

  it('returns false when credits below threshold', () => {
    const state = createBaseState();
    state.player.credits = 1000;
    expect(evaluateCondition({ type: CONDITION_TYPES.CREDITS_ABOVE, value: 25000 }, state)).toBe(false);
  });
});

describe('hull_above', () => {
  it('returns true when hull meets threshold', () => {
    const state = createBaseState();
    state.ship.hull = 85;
    expect(evaluateCondition({ type: CONDITION_TYPES.HULL_ABOVE, value: 80 }, state)).toBe(true);
  });

  it('returns false when hull below threshold', () => {
    const state = createBaseState();
    state.ship.hull = 60;
    expect(evaluateCondition({ type: CONDITION_TYPES.HULL_ABOVE, value: 80 }, state)).toBe(false);
  });
});

describe('engine_above', () => {
  it('returns true when engine meets threshold', () => {
    const state = createBaseState();
    state.ship.engine = 95;
    expect(evaluateCondition({ type: CONDITION_TYPES.ENGINE_ABOVE, value: 90 }, state)).toBe(true);
  });

  it('returns false when engine below threshold', () => {
    const state = createBaseState();
    state.ship.engine = 70;
    expect(evaluateCondition({ type: CONDITION_TYPES.ENGINE_ABOVE, value: 90 }, state)).toBe(false);
  });
});

describe('has_upgrade', () => {
  it('returns true when player has the upgrade', () => {
    const state = createBaseState();
    state.ship.upgrades = ['extended_tank', 'range_extender'];
    expect(evaluateCondition({ type: CONDITION_TYPES.HAS_UPGRADE, upgrade: 'range_extender' }, state)).toBe(true);
  });

  it('returns false when player does not have the upgrade', () => {
    const state = createBaseState();
    state.ship.upgrades = ['extended_tank'];
    expect(evaluateCondition({ type: CONDITION_TYPES.HAS_UPGRADE, upgrade: 'range_extender' }, state)).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- tests/unit/event-conditions.test.js
```

Expected: FAIL — unknown condition types return false (default case) but `state.quests` won't exist on base state, and the specific logic isn't there.

**Step 3: Implement the new condition type cases**

In `src/game/event-conditions.js`, add cases before the `default:` line:

```js
case CONDITION_TYPES.NPC_REP_ABOVE:
  return (gameState.npcs[condition.npcId]?.rep ?? -Infinity) >= condition.value;

case CONDITION_TYPES.SYSTEMS_VISITED_COUNT:
  return gameState.world.visitedSystems.length >= condition.value;

case CONDITION_TYPES.QUEST_STAGE:
  return (gameState.quests?.[condition.questId]?.stage ?? -1) === condition.value;

case CONDITION_TYPES.DEBT_ZERO:
  return gameState.player.debt === 0;

case CONDITION_TYPES.CREDITS_ABOVE:
  return gameState.player.credits >= condition.value;

case CONDITION_TYPES.HULL_ABOVE:
  return gameState.ship.hull >= condition.value;

case CONDITION_TYPES.ENGINE_ABOVE:
  return gameState.ship.engine >= condition.value;

case CONDITION_TYPES.HAS_UPGRADE:
  return gameState.ship.upgrades.includes(condition.upgrade);
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- tests/unit/event-conditions.test.js
```

Expected: All new tests PASS.

**Step 5: Commit**

```bash
git add src/game/event-conditions.js tests/unit/event-conditions.test.js
git commit -m "feat: add endgame condition types to event engine"
```

---

### Task 3: Add Stats Tracking State

**Files:**
- Modify: `src/game/state/managers/initialization.js`
- Test: `tests/unit/quest-manager.test.js` (new file, start with stats initialization test)

**Step 1: Write failing test**

Create `tests/unit/quest-manager.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Stats initialization', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('initializes state.stats with zero counters', () => {
    expect(manager.state.stats).toBeDefined();
    expect(manager.state.stats.creditsEarned).toBe(0);
    expect(manager.state.stats.jumpsCompleted).toBe(0);
    expect(manager.state.stats.cargoHauled).toBe(0);
    expect(manager.state.stats.smugglingRuns).toBe(0);
    expect(manager.state.stats.charitableActs).toBe(0);
  });

  it('initializes state.quests as empty object', () => {
    expect(manager.state.quests).toBeDefined();
    expect(manager.state.quests).toEqual({});
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/quest-manager.test.js
```

Expected: FAIL — `state.stats` and `state.quests` don't exist yet.

**Step 3: Add stats and quests to initial state**

In `src/game/state/managers/initialization.js`, add to the `createInitialState()` return object, after the `missions` block:

```js
stats: {
  creditsEarned: 0,
  jumpsCompleted: 0,
  cargoHauled: 0,
  smugglingRuns: 0,
  charitableActs: 0,
},
quests: {},
```

**Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/quest-manager.test.js
```

Expected: PASS.

**Step 5: Run full test suite**

```bash
npm test
```

Expected: All tests pass. Adding new fields to state should not break existing tests.

**Step 6: Commit**

```bash
git add src/game/state/managers/initialization.js tests/unit/quest-manager.test.js
git commit -m "feat: add stats and quests to initial game state"
```

---

### Task 4: Increment Stats in Existing Managers

**Files:**
- Modify: `src/game/state/managers/trading.js` (for creditsEarned, cargoHauled)
- Modify: `src/game/state/managers/navigation.js` (for jumpsCompleted)
- Test: `tests/unit/quest-manager.test.js` (add stats increment tests)

**Step 1: Write failing tests for stats increments**

Add to `tests/unit/quest-manager.test.js`:

```js
describe('Stats tracking', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('increments jumpsCompleted on location change', () => {
    // Simulate what NavigationManager.updateLocation does
    manager.state.player.currentSystem = 0;
    manager.updateLocation(4); // Jump to Barnard's Star
    expect(manager.state.stats.jumpsCompleted).toBe(1);
  });

  it('increments cargoHauled and creditsEarned on sell', () => {
    // Give player some cargo to sell
    manager.state.ship.cargo = [
      { good: 'grain', qty: 10, buyPrice: 50, buySystem: 0, buySystemName: 'Sol', buyDate: 0 },
    ];
    // Need current system prices
    manager.state.world.currentSystemPrices = { grain: 100 };
    const result = manager.sellGood(0, 5, 100);
    if (result.success) {
      expect(manager.state.stats.cargoHauled).toBe(5);
      expect(manager.state.stats.creditsEarned).toBe(500);
    }
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- tests/unit/quest-manager.test.js
```

Expected: FAIL — stats not incremented.

**Step 3: Add stat increments to NavigationManager.updateLocation()**

In `src/game/state/managers/navigation.js`, inside `updateLocation()`, add after location update logic:

```js
if (state.stats) {
  state.stats.jumpsCompleted++;
}
```

**Step 4: Add stat increments to TradingManager.sellGood()**

In `src/game/state/managers/trading.js`, inside the `sellGood()` method, after credits are updated:

```js
if (state.stats) {
  state.stats.cargoHauled += quantity;
  state.stats.creditsEarned += totalRevenue;
}
```

Note: Find the exact variable names by reading `sellGood()`. `totalRevenue` should be `quantity * salePrice` or whatever the method computes.

**Step 5: Run tests to verify they pass**

```bash
npm test -- tests/unit/quest-manager.test.js
```

**Step 6: Run full test suite to check nothing broke**

```bash
npm test
```

**Step 7: Commit**

```bash
git add src/game/state/managers/trading.js src/game/state/managers/navigation.js tests/unit/quest-manager.test.js
git commit -m "feat: track gameplay stats for epilogue"
```

---

### Task 5: Increment Karma-Based Stats

**Files:**
- Modify: `src/game/state/managers/danger.js` (for charitableActs, smugglingRuns)
- Test: `tests/unit/quest-manager.test.js`

**Step 1: Read `danger.js` to find where karma is modified**

Look for `modifyKarma` and understand the call sites. `charitableActs` should increment when karma goes up (positive karma action). `smugglingRuns` should increment when selling hidden cargo or completing smuggling-related actions.

**Step 2: Write failing tests**

```js
describe('Karma-based stats', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('increments charitableActs on positive karma change', () => {
    manager.modifyKarma(5, 'helped_civilian');
    expect(manager.state.stats.charitableActs).toBe(1);
  });

  it('does not increment charitableActs on negative karma', () => {
    manager.modifyKarma(-5, 'looted_civilian');
    expect(manager.state.stats.charitableActs).toBe(0);
  });
});
```

**Step 3: Run tests to verify they fail**

```bash
npm test -- tests/unit/quest-manager.test.js
```

**Step 4: Add charitableActs tracking to the karma modification path**

In the manager that handles `modifyKarma`, after the karma is modified, add:

```js
if (state.stats && amount > 0) {
  state.stats.charitableActs++;
}
```

**Step 5: Run tests to verify they pass**

```bash
npm test -- tests/unit/quest-manager.test.js
```

**Step 6: Commit**

```bash
git add src/game/state/managers/danger.js tests/unit/quest-manager.test.js
git commit -m "feat: track charitable acts in stats"
```

---

## Phase 2: Core Quest System

### Task 6: QuestManager — Core Class

**Files:**
- Create: `src/game/state/managers/quest-manager.js`
- Test: `tests/unit/quest-manager.test.js` (extend existing)

**Step 1: Write failing tests for QuestManager core API**

Add to `tests/unit/quest-manager.test.js`:

```js
import { ENDGAME_CONFIG, QUEST_CONFIG } from '../../src/game/constants.js';

describe('QuestManager', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  describe('registerQuest', () => {
    it('registers a quest definition', () => {
      const questDef = {
        id: 'test_quest',
        name: 'Test Quest',
        stages: [{ stage: 1, name: 'Step 1' }],
        victoryStage: 2,
      };
      manager.registerQuest(questDef);
      expect(manager.getQuestState('test_quest')).toBeDefined();
      expect(manager.getQuestState('test_quest').stage).toBe(0);
    });
  });

  describe('getQuestState', () => {
    it('returns default state for unregistered quest', () => {
      const state = manager.getQuestState('nonexistent');
      expect(state).toBeNull();
    });

    it('initializes quest state on first access for registered quest', () => {
      manager.registerQuest({ id: 'q1', stages: [], victoryStage: 1 });
      const state = manager.getQuestState('q1');
      expect(state.stage).toBe(0);
      expect(state.data).toEqual({});
      expect(state.startedDay).toBeNull();
      expect(state.completedDay).toBeNull();
    });
  });

  describe('advanceStage', () => {
    it('advances quest stage and applies credit rewards', () => {
      manager.registerQuest({
        id: 'q1',
        stages: [
          { stage: 1, name: 'S1', rewards: { credits: 1000 } },
        ],
        victoryStage: 2,
      });
      const startingCredits = manager.state.player.credits;
      manager.advanceQuest('q1');
      expect(manager.getQuestState('q1').stage).toBe(1);
      expect(manager.state.player.credits).toBe(startingCredits + 1000);
    });

    it('sets startedDay on first advance', () => {
      manager.registerQuest({
        id: 'q1',
        stages: [{ stage: 1, name: 'S1', rewards: {} }],
        victoryStage: 2,
      });
      manager.state.player.daysElapsed = 42;
      manager.advanceQuest('q1');
      expect(manager.getQuestState('q1').startedDay).toBe(42);
    });

    it('applies rep rewards', () => {
      manager.registerQuest({
        id: 'q1',
        npcId: 'chen_barnards',
        stages: [
          { stage: 1, name: 'S1', rewards: { rep: { chen_barnards: 15 } } },
        ],
        victoryStage: 2,
      });
      // Initialize NPC state
      manager.getNPCState('chen_barnards');
      const startRep = manager.getNPCState('chen_barnards').rep;
      manager.advanceQuest('q1');
      expect(manager.getNPCState('chen_barnards').rep).toBeGreaterThan(startRep);
    });
  });

  describe('updateQuestData', () => {
    it('updates a counter in quest data', () => {
      manager.registerQuest({ id: 'q1', stages: [], victoryStage: 1 });
      manager.updateQuestData('q1', 'jumpsCompleted', 3);
      expect(manager.getQuestState('q1').data.jumpsCompleted).toBe(3);
    });
  });

  describe('isQuestComplete', () => {
    it('returns true when stage equals victoryStage', () => {
      manager.registerQuest({
        id: 'q1',
        stages: [{ stage: 1, name: 'S1', rewards: {} }],
        victoryStage: 2,
      });
      manager.advanceQuest('q1');
      manager.advanceQuest('q1'); // stage 2 = victoryStage
      expect(manager.isQuestComplete('q1')).toBe(true);
    });

    it('returns false when quest in progress', () => {
      manager.registerQuest({
        id: 'q1',
        stages: [{ stage: 1, name: 'S1', rewards: {} }],
        victoryStage: 2,
      });
      manager.advanceQuest('q1');
      expect(manager.isQuestComplete('q1')).toBe(false);
    });
  });

  describe('getActiveQuests', () => {
    it('returns quests with stage > 0 and not complete', () => {
      manager.registerQuest({ id: 'q1', stages: [{ stage: 1, rewards: {} }], victoryStage: 3 });
      manager.registerQuest({ id: 'q2', stages: [{ stage: 1, rewards: {} }], victoryStage: 3 });
      manager.advanceQuest('q1');
      const active = manager.getActiveQuests();
      expect(active).toHaveLength(1);
      expect(active[0]).toBe('q1');
    });
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- tests/unit/quest-manager.test.js
```

Expected: FAIL — `registerQuest`, `advanceQuest`, etc. don't exist on GameStateManager.

**Step 3: Create QuestManager class**

Create `src/game/state/managers/quest-manager.js`:

```js
import { BaseManager } from './base-manager.js';

export class QuestManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
    this.questDefinitions = {};
  }

  registerQuest(questDef) {
    this.questDefinitions[questDef.id] = questDef;
  }

  getQuestDefinition(questId) {
    return this.questDefinitions[questId] || null;
  }

  getQuestState(questId) {
    if (!this.questDefinitions[questId]) return null;
    const state = this.getState();
    if (!state.quests[questId]) {
      state.quests[questId] = {
        stage: 0,
        data: {},
        startedDay: null,
        completedDay: null,
      };
    }
    return state.quests[questId];
  }

  advanceQuest(questId) {
    const questDef = this.questDefinitions[questId];
    if (!questDef) return { success: false, reason: 'Quest not found' };

    const questState = this.getQuestState(questId);
    const state = this.getState();
    const nextStage = questState.stage + 1;

    // Set started day on first advance
    if (questState.stage === 0) {
      questState.startedDay = state.player.daysElapsed;
    }

    // Get stage definition for rewards
    const stageDef = questDef.stages.find((s) => s.stage === nextStage);

    questState.stage = nextStage;

    // Apply rewards if stage definition exists
    if (stageDef?.rewards) {
      this._applyRewards(stageDef.rewards);
    }

    // Check for completion
    if (nextStage >= questDef.victoryStage) {
      questState.completedDay = state.player.daysElapsed;
    }

    this.emit('questChanged', { questId, stage: nextStage });
    this.gameStateManager.saveGame();

    return { success: true, stage: nextStage };
  }

  _applyRewards(rewards) {
    if (rewards.credits) {
      const state = this.getState();
      state.player.credits += rewards.credits;
      if (state.stats) {
        state.stats.creditsEarned += rewards.credits;
      }
      this.emit('creditsChanged', state.player.credits);
    }

    if (rewards.rep) {
      for (const [npcId, amount] of Object.entries(rewards.rep)) {
        this.gameStateManager.modifyRep(npcId, amount, 'quest_reward');
      }
    }

    if (rewards.karma) {
      this.gameStateManager.modifyKarma(rewards.karma, 'quest_reward');
    }

    if (rewards.engineRestore) {
      const state = this.getState();
      state.ship.engine = 100;
      this.emit('shipConditionChanged', {
        hull: state.ship.hull,
        engine: state.ship.engine,
        lifeSupport: state.ship.lifeSupport,
      });
    }

    if (rewards.upgrade) {
      const state = this.getState();
      if (!state.ship.upgrades.includes(rewards.upgrade)) {
        state.ship.upgrades.push(rewards.upgrade);
        this.emit('upgradesChanged', [...state.ship.upgrades]);
      }
    }
  }

  updateQuestData(questId, key, value) {
    const questState = this.getQuestState(questId);
    if (!questState) return;
    questState.data[key] = value;
  }

  isQuestComplete(questId) {
    const questDef = this.questDefinitions[questId];
    const questState = this.getQuestState(questId);
    if (!questDef || !questState) return false;
    return questState.stage >= questDef.victoryStage;
  }

  getActiveQuests() {
    return Object.keys(this.questDefinitions).filter((questId) => {
      const questState = this.getQuestState(questId);
      return questState && questState.stage > 0 && !this.isQuestComplete(questId);
    });
  }

  getQuestStage(questId) {
    const questState = this.getQuestState(questId);
    return questState ? questState.stage : 0;
  }

  canStartStage(questId, stage) {
    const questDef = this.questDefinitions[questId];
    if (!questDef) return false;

    const stageDef = questDef.stages.find((s) => s.stage === stage);
    if (!stageDef?.requirements) return true;

    const state = this.getState();
    const reqs = stageDef.requirements;

    if (reqs.npcRep) {
      const [npcId, threshold] = reqs.npcRep;
      const npcState = state.npcs[npcId];
      if (!npcState || npcState.rep < threshold) return false;
    }

    if (reqs.engineCondition != null && state.ship.engine < reqs.engineCondition) return false;
    if (reqs.hullCondition != null && state.ship.hull < reqs.hullCondition) return false;
    if (reqs.debt != null && state.player.debt !== reqs.debt) return false;
    if (reqs.credits != null && state.player.credits < reqs.credits) return false;

    return true;
  }

  checkObjectivesComplete(questId) {
    const questDef = this.questDefinitions[questId];
    const questState = this.getQuestState(questId);
    if (!questDef || !questState) return false;

    const stageDef = questDef.stages.find((s) => s.stage === questState.stage);
    if (!stageDef?.objectives) return true; // No objectives = auto-complete

    for (const [key, target] of Object.entries(stageDef.objectives)) {
      if ((questState.data[key] || 0) < target) return false;
    }
    return true;
  }
}
```

**Step 4: Register QuestManager in GameStateManager**

In `src/game/state/game-state-manager.js`:

1. Import: `import { QuestManager } from './managers/quest-manager.js';`
2. In constructor, after the last manager instantiation: `this.questManager = new QuestManager(this);`
3. Add `'questChanged'` to the EventSystemManager subscribers list in `src/game/state/managers/event-system.js`.
4. Add delegation methods to GameStateManager:

```js
registerQuest(questDef) { this.questManager.registerQuest(questDef); }
getQuestState(questId) { return this.questManager.getQuestState(questId); }
getQuestStage(questId) { return this.questManager.getQuestStage(questId); }
advanceQuest(questId) { return this.questManager.advanceQuest(questId); }
updateQuestData(questId, key, value) { this.questManager.updateQuestData(questId, key, value); }
isQuestComplete(questId) { return this.questManager.isQuestComplete(questId); }
getActiveQuests() { return this.questManager.getActiveQuests(); }
canStartQuestStage(questId, stage) { return this.questManager.canStartStage(questId, stage); }
checkQuestObjectives(questId) { return this.questManager.checkObjectivesComplete(questId); }
```

**Step 5: Run tests to verify they pass**

```bash
npm test -- tests/unit/quest-manager.test.js
```

**Step 6: Run full suite**

```bash
npm test
```

**Step 7: Commit**

```bash
git add src/game/state/managers/quest-manager.js src/game/state/game-state-manager.js src/game/state/managers/event-system.js tests/unit/quest-manager.test.js
git commit -m "feat: add QuestManager with generic quest progression system"
```

---

### Task 7: QuestManager Event Hooks

**Files:**
- Modify: `src/game/state/managers/quest-manager.js`
- Test: `tests/unit/quest-manager.test.js`

**Step 1: Write failing tests for jump tracking**

```js
describe('Quest event hooks', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
    manager.registerQuest({
      id: 'test_quest',
      stages: [
        { stage: 1, name: 'Jump Test', objectives: { jumpsCompleted: 3 }, rewards: { credits: 100 } },
      ],
      victoryStage: 2,
    });
  });

  it('increments jump counter when quest is at tracking stage', () => {
    // Start the quest at stage 1
    manager.advanceQuest('test_quest');
    expect(manager.getQuestState('test_quest').stage).toBe(1);

    // Simulate jumps
    manager.questManager.onJump();
    manager.questManager.onJump();
    expect(manager.getQuestState('test_quest').data.jumpsCompleted).toBe(2);
  });

  it('does not increment jump counter when quest not at tracking stage', () => {
    // Quest at stage 0 — not started
    manager.questManager.onJump();
    expect(manager.getQuestState('test_quest').data.jumpsCompleted).toBeUndefined();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test -- tests/unit/quest-manager.test.js
```

**Step 3: Add onJump method to QuestManager**

```js
onJump() {
  for (const questId of Object.keys(this.questDefinitions)) {
    const questState = this.getQuestState(questId);
    if (!questState || questState.stage === 0) continue;

    const stageDef = this.questDefinitions[questId].stages.find(
      (s) => s.stage === questState.stage
    );
    if (stageDef?.objectives?.jumpsCompleted != null) {
      questState.data.jumpsCompleted = (questState.data.jumpsCompleted || 0) + 1;
      this.emit('questChanged', { questId, stage: questState.stage });
    }
  }
}
```

**Step 4: Wire onJump to the jumped event**

In `NavigationManager.updateLocation()`, after the existing logic, add a call. Or, in the QuestManager constructor, subscribe to the event:

```js
constructor(gameStateManager) {
  super(gameStateManager);
  this.questDefinitions = {};
  // Subscribe to game events
  gameStateManager.subscribe('locationChanged', () => this.onJump());
}
```

Note: `locationChanged` fires on every jump. This is the right hook.

**Step 5: Run tests**

```bash
npm test -- tests/unit/quest-manager.test.js
```

**Step 6: Commit**

```bash
git add src/game/state/managers/quest-manager.js tests/unit/quest-manager.test.js
git commit -m "feat: QuestManager tracks jump objectives via event hooks"
```

---

## Phase 3: Tanaka Content

### Task 8: Tanaka NPC Definition

**Files:**
- Modify: `src/game/data/npc-data.js`
- Test: Run existing NPC validation

**Step 1: Add Tanaka NPC definition**

Add to `src/game/data/npc-data.js` before the `ALL_NPCS` export:

```js
export const YUKI_TANAKA = {
  id: 'tanaka_barnards',
  name: 'Yuki Tanaka',
  role: 'Engineer',
  system: 4,
  station: 'Bore Station 7',
  personality: {
    trust: 0.2,
    greed: 0.1,
    loyalty: 0.9,
    morality: 0.8,
  },
  speechStyle: {
    greeting: 'formal',
    vocabulary: 'technical',
    quirk: 'Precise, measured speech. Never wastes words.',
  },
  description:
    'Brilliant engineer working on experimental drive technology. Has her own reasons for wanting to reach Delta Pavonis.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [],
  discountService: null,
  tierBenefits: {
    warm: { discount: 0, benefit: 'Shares technical insights about the Tanaka Drive.' },
    friendly: { discount: 0, benefit: 'Discusses her research freely.' },
    trusted: { discount: 0, benefit: 'Reveals her true mission.' },
    family: { discount: 0, benefit: 'Partner for the Pavonis Run.' },
  },
  questId: 'tanaka',
  hidden: true, // Not visible until quest unlock event fires
};
```

**Step 2: Add Tanaka to ALL_NPCS array**

```js
export const ALL_NPCS = [
  WEI_CHEN,
  MARCUS_COLE,
  FATHER_OKONKWO,
  WHISPER,
  CAPTAIN_VASQUEZ,
  DR_SARAH_KIM,
  RUSTY_RODRIGUEZ,
  ZARA_OSMAN,
  STATION_MASTER_KOWALSKI,
  LUCKY_LIU,
  YUKI_TANAKA,
];
```

**Step 3: Run validation to check NPC is well-formed**

```bash
npm test
```

Expected: All pass. The NPC validation checks required fields, and Tanaka has them all. The `questId` and `hidden` fields are optional additions that won't break validation.

**Step 4: Commit**

```bash
git add src/game/data/npc-data.js
git commit -m "feat: add Yuki Tanaka NPC definition"
```

---

### Task 9: Quest-Aware NPC Visibility

**Files:**
- Modify: `src/game/game-npcs.js`
- Test: `tests/unit/quest-manager.test.js`

**Step 1: Write failing test**

```js
import { getNPCsAtSystem } from '../../src/game/game-npcs.js';

describe('NPC visibility', () => {
  it('excludes hidden NPCs from getNPCsAtSystem', () => {
    const npcs = getNPCsAtSystem(4); // Barnard's Star — Wei Chen + Tanaka
    const tanakaVisible = npcs.some((n) => n.id === 'tanaka_barnards');
    expect(tanakaVisible).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/quest-manager.test.js
```

Expected: FAIL — currently `getNPCsAtSystem` returns all NPCs at the system including hidden ones.

**Step 3: Filter hidden NPCs in getNPCsAtSystem**

In `src/game/game-npcs.js`, modify the filter:

```js
export function getNPCsAtSystem(systemId) {
  if (typeof systemId !== 'number') {
    throw new Error('Invalid systemId: must be a number');
  }
  return ALL_NPCS.filter((npc) => npc.system === systemId && !npc.hidden);
}
```

**Step 4: Add a function to reveal hidden NPCs (for quest system)**

```js
export function revealNPC(npcId) {
  const npc = ALL_NPCS.find((n) => n.id === npcId);
  if (npc) {
    npc.hidden = false;
  }
}
```

**Step 5: Run tests**

```bash
npm test -- tests/unit/quest-manager.test.js
```

**Step 6: Run full suite**

```bash
npm test
```

**Step 7: Commit**

```bash
git add src/game/game-npcs.js tests/unit/quest-manager.test.js
git commit -m "feat: support hidden NPCs for quest-gated visibility"
```

---

### Task 10: Tanaka Quest Definition Data

**Files:**
- Create: `src/game/data/quest-definitions.js`
- Test: `tests/unit/quest-manager.test.js`

**Step 1: Create Tanaka quest definition**

Create `src/game/data/quest-definitions.js`:

```js
import { ENDGAME_CONFIG } from '../constants.js';

export const TANAKA_QUEST = {
  id: 'tanaka',
  name: 'The Tanaka Sequence',
  npcId: 'tanaka_barnards',

  unlockConditions: {
    systemsVisited: ENDGAME_CONFIG.TANAKA_UNLOCK_SYSTEMS_VISITED,
    system: ENDGAME_CONFIG.TANAKA_SYSTEM,
  },

  stages: [
    {
      stage: 1,
      name: 'Field Test',
      requirements: {
        npcRep: ['tanaka_barnards', ENDGAME_CONFIG.STAGE_1_REP],
        engineCondition: ENDGAME_CONFIG.STAGE_1_ENGINE,
      },
      objectives: { jumpsCompleted: ENDGAME_CONFIG.STAGE_1_JUMPS },
      rewards: {
        credits: ENDGAME_CONFIG.STAGE_1_REWARD_CREDITS,
        rep: { tanaka_barnards: ENDGAME_CONFIG.STAGE_1_REWARD_REP },
        engineRestore: true,
      },
      dialogueNode: 'mission_1_offer',
    },
    {
      stage: 2,
      name: 'Rare Materials',
      requirements: {
        npcRep: ['tanaka_barnards', ENDGAME_CONFIG.STAGE_2_REP],
      },
      objectives: { exoticMaterials: ENDGAME_CONFIG.STAGE_2_EXOTIC_NEEDED },
      rewards: {
        credits: ENDGAME_CONFIG.STAGE_2_REWARD_CREDITS,
        rep: { tanaka_barnards: ENDGAME_CONFIG.STAGE_2_REWARD_REP },
        upgrade: 'advanced_sensors',
      },
      dialogueNode: 'mission_2_offer',
    },
    {
      stage: 3,
      name: 'The Prototype',
      requirements: {
        npcRep: ['tanaka_barnards', ENDGAME_CONFIG.STAGE_3_REP],
        hullCondition: ENDGAME_CONFIG.STAGE_3_HULL,
        engineCondition: ENDGAME_CONFIG.STAGE_3_ENGINE,
      },
      objectives: {}, // Auto-completes via narrative sequence
      rewards: {
        credits: ENDGAME_CONFIG.STAGE_3_REWARD_CREDITS,
        rep: { tanaka_barnards: ENDGAME_CONFIG.STAGE_3_REWARD_REP },
      },
      dialogueNode: 'mission_3_offer',
    },
    {
      stage: 4,
      name: 'Personal Request',
      requirements: {
        npcRep: ['tanaka_barnards', ENDGAME_CONFIG.STAGE_4_REP],
      },
      objectives: { messageDelivered: 1 },
      rewards: {
        rep: { tanaka_barnards: ENDGAME_CONFIG.STAGE_4_REWARD_REP },
      },
      dialogueNode: 'mission_4_offer',
    },
    {
      stage: 5,
      name: 'Final Preparations',
      requirements: {
        npcRep: ['tanaka_barnards', ENDGAME_CONFIG.STAGE_5_REP],
        debt: 0,
        credits: ENDGAME_CONFIG.VICTORY_CREDITS,
        hullCondition: ENDGAME_CONFIG.STAGE_5_HULL,
        engineCondition: ENDGAME_CONFIG.STAGE_5_ENGINE,
      },
      objectives: {},
      rewards: {
        upgrade: 'range_extender',
      },
      dialogueNode: 'mission_5_offer',
    },
  ],

  victoryStage: ENDGAME_CONFIG.VICTORY_STAGE,
};

export const ALL_QUESTS = [TANAKA_QUEST];
```

**Step 2: Write a test that registers and validates the Tanaka quest**

```js
import { TANAKA_QUEST } from '../../src/game/data/quest-definitions.js';

describe('Tanaka quest definition', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
    manager.registerQuest(TANAKA_QUEST);
  });

  it('has 5 stages', () => {
    expect(TANAKA_QUEST.stages).toHaveLength(5);
  });

  it('starts at stage 0', () => {
    expect(manager.getQuestStage('tanaka')).toBe(0);
  });

  it('victory stage is 6', () => {
    expect(TANAKA_QUEST.victoryStage).toBe(6);
  });

  it('all stages have requirements', () => {
    for (const stage of TANAKA_QUEST.stages) {
      expect(stage.requirements).toBeDefined();
    }
  });
});
```

**Step 3: Run tests**

```bash
npm test -- tests/unit/quest-manager.test.js
```

**Step 4: Commit**

```bash
git add src/game/data/quest-definitions.js tests/unit/quest-manager.test.js
git commit -m "feat: add Tanaka quest definition data"
```

---

### Task 11: Register Tanaka Quest on Game Init

**Files:**
- Modify: `src/game/state/game-state-manager.js`
- Test: `tests/unit/quest-manager.test.js`

**Step 1: Write failing test**

```js
describe('Quest auto-registration', () => {
  it('registers Tanaka quest on initNewGame', () => {
    const manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
    expect(manager.getQuestState('tanaka')).toBeDefined();
    expect(manager.getQuestStage('tanaka')).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/quest-manager.test.js
```

**Step 3: Import and register quests in initNewGame**

In `src/game/state/game-state-manager.js`:

1. Import: `import { ALL_QUESTS } from '../data/quest-definitions.js';`
2. In `initNewGame()`, after `this.eventEngineManager.registerEvents(DANGER_EVENTS)`, add:

```js
// Register quest definitions
ALL_QUESTS.forEach((quest) => this.questManager.registerQuest(quest));
```

**Step 4: Run tests**

```bash
npm test -- tests/unit/quest-manager.test.js
```

**Step 5: Run full suite**

```bash
npm test
```

**Step 6: Commit**

```bash
git add src/game/state/game-state-manager.js tests/unit/quest-manager.test.js
git commit -m "feat: auto-register quests on game initialization"
```

---

### Task 12: Tanaka Dialogue Tree

**Files:**
- Create: `src/game/data/dialogue/tanaka-dialogue.js`
- Modify: `src/game/data/dialogue-trees.js`

**Step 1: Create Tanaka dialogue tree**

Create `src/game/data/dialogue/tanaka-dialogue.js`. This is a large data file — the structure follows the existing NPC dialogue pattern exactly. Key nodes:

- `greeting` — dynamic text based on quest stage
- `mission_1_offer` through `mission_5_offer` — quest mission dialogues
- `mission_1_complete` through `mission_5_complete` — completion dialogues
- `backstory` — unlocked after stage 3
- `pavonis_ready` — final dialogue triggering the Pavonis Run

Each mission offer choice has a `condition` checking `gameStateManager.getQuestStage('tanaka')` and `gameStateManager.canStartQuestStage('tanaka', N)`, and an `action` calling `gameStateManager.advanceQuest('tanaka')`.

The dialogue tree is narrative content — write it following the spec's dialogue examples and the existing NPC dialogue patterns. Use `REPUTATION_BOUNDS` from constants for rep-gated choices.

**Step 2: Register in dialogue-trees.js**

In `src/game/data/dialogue-trees.js`:

1. Import: `import { YUKI_TANAKA_DIALOGUE } from './dialogue/tanaka-dialogue.js';`
2. Add to re-exports
3. Add to `ALL_DIALOGUE_TREES`: `tanaka_barnards: YUKI_TANAKA_DIALOGUE,`

**Step 3: Run full test suite to verify dialogue validation passes**

```bash
npm test
```

**Step 4: Commit**

```bash
git add src/game/data/dialogue/tanaka-dialogue.js src/game/data/dialogue-trees.js
git commit -m "feat: add Tanaka dialogue tree with quest progression"
```

---

### Task 13: Tanaka Intro Narrative Event

**Files:**
- Modify: `src/game/data/narrative-events.js`
- Test: `tests/unit/quest-manager.test.js`

**Step 1: Add the intro dock event**

In `src/game/data/narrative-events.js`, add a new event to the `NARRATIVE_EVENTS` array:

```js
{
  id: 'tanaka_intro',
  type: 'dock',
  category: 'narrative',
  trigger: {
    system: 4, // Barnard's Star
    condition: [
      { type: CONDITION_TYPES.SYSTEMS_VISITED_COUNT, value: 5 },
      { type: CONDITION_TYPES.QUEST_STAGE, questId: 'tanaka', value: 0 },
    ],
    chance: 1.0,
  },
  once: true,
  cooldown: 0,
  priority: NARRATIVE_PRIORITY.HIGH,
  content: {
    text: [
      "A woman in engineer's coveralls watches your ship dock. She approaches as you exit the airlock.",
      '"Tanaka drive. Mark III, if I\'m not mistaken."',
      'She circles your ship, running a hand along the hull.',
      '"I\'m Yuki Tanaka. I designed that drive. Well, my father did. I improved it."',
    ],
    speaker: 'Yuki Tanaka',
    mood: 'mysterious',
    choices: [
      {
        text: '"It\'s a good drive. Reliable."',
        next: null,
        effects: {
          rewards: { karma: 1 },
        },
      },
      {
        text: '"You\'re THE Tanaka? I\'ve heard of you."',
        next: null,
        effects: {
          rewards: { karma: 1 },
        },
      },
      {
        text: '"What do you want?"',
        next: null,
        effects: {},
      },
    ],
  },
},
```

Import the new `CONDITION_TYPES` entries at the top of the file if not already imported.

**Step 2: Add side effect to reveal Tanaka NPC**

The narrative event system applies `effects.rewards` automatically, but revealing the NPC requires a custom hook. Two approaches:

**Option A:** Add a narrative flag `tanaka_met` and check it in `getNPCsAtSystem`. When the intro event fires, the event engine sets the flag. Modify `getNPCsAtSystem` to show Tanaka when the flag is set.

**Option B:** Use the event's `effects` to call `revealNPC('tanaka_barnards')`.

Option A is cleaner because it survives save/load. Implement it:

1. Add the flag to the event's effects:
```js
effects: {
  rewards: { karma: 1 },
  flags: ['tanaka_met'],
},
```

2. Ensure the event engine processes `flags` in effects (check if it already does — it might, via `setFlag`). If not, this needs to be added to the narrative event handling in `NarrativeEventPanel.jsx` or `useEventTriggers.js`.

3. Modify `getNPCsAtSystem` to check for `tanaka_met` flag:

In `src/game/game-npcs.js`, the function needs access to game state. Since it's currently a pure function, it needs to accept state or be modified. Better approach: **change `hidden` on the NPC data to a function or condition**, or simply pass game state as an optional parameter.

Simplest: Make `getNPCsAtSystem` accept an optional `gameState` parameter:

```js
export function getNPCsAtSystem(systemId, gameState = null) {
  if (typeof systemId !== 'number') {
    throw new Error('Invalid systemId: must be a number');
  }
  return ALL_NPCS.filter((npc) => {
    if (npc.system !== systemId) return false;
    if (npc.hidden && gameState) {
      // Check for quest-reveal flags
      const meetFlag = `${npc.id.split('_')[0]}_met`; // e.g., 'tanaka_met'
      return !!gameState.world?.narrativeEvents?.flags?.[meetFlag];
    }
    return !npc.hidden;
  });
}
```

Update callers of `getNPCsAtSystem` in `StationMenu.jsx` to pass `gameStateManager.getState()`.

**Step 3: Write test**

```js
describe('Tanaka intro event', () => {
  it('tanaka_intro event is eligible at Barnard Star with 5+ systems', () => {
    const manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
    // Visit 5 systems
    manager.state.world.visitedSystems = [0, 1, 4, 5, 7];
    const event = manager.eventEngineManager.checkEvents('dock', { system: 4 }, () => 0);
    // Should find an eligible event (tanaka_intro or possibly others)
    // Check that tanaka_intro specifically is eligible
    const tanakaEvent = manager.eventEngineManager.getEventById('tanaka_intro');
    expect(tanakaEvent).toBeDefined();
  });
});
```

**Step 4: Run tests**

```bash
npm test -- tests/unit/quest-manager.test.js
```

**Step 5: Run full suite**

```bash
npm test
```

**Step 6: Commit**

```bash
git add src/game/data/narrative-events.js src/game/game-npcs.js tests/unit/quest-manager.test.js
git commit -m "feat: add Tanaka intro narrative event and quest-aware NPC visibility"
```

---

### Task 14: Exotic Material Collection Events

**Files:**
- Modify: `src/game/data/narrative-events.js`
- Modify: `src/game/state/managers/quest-manager.js`
- Test: `tests/unit/quest-manager.test.js`

**Step 1: Add exotic material dock events**

These fire when the player docks at a station >15 LY from Sol, and the Tanaka quest is at stage 2. They're chance-based (60%) and max 1 per station.

In `src/game/data/narrative-events.js`:

```js
{
  id: 'exotic_material_find',
  type: 'dock',
  category: 'narrative',
  trigger: {
    system: null, // Any system
    condition: [
      { type: CONDITION_TYPES.QUEST_STAGE, questId: 'tanaka', value: 2 },
      { type: CONDITION_TYPES.FLAG_SET, flag: 'tanaka_collecting_exotics' },
    ],
    chance: 0.6,
  },
  once: false,
  cooldown: 0,
  priority: NARRATIVE_PRIORITY.DEFAULT,
  content: {
    text: [
      'While restocking supplies, you notice an unusual mineral sample in the station market.',
      'The isotope signature matches what Tanaka described — rare exotic matter, useful for her Range Extender project.',
    ],
    speaker: null,
    mood: 'neutral',
    choices: [
      {
        text: 'Acquire the sample for Tanaka.',
        next: null,
        effects: {},
      },
    ],
  },
},
```

**Step 2: Add QuestManager method for exotic material collection**

The exotic material logic needs a distance check and per-station tracking that's more complex than what the event engine conditions can express. Add a method to QuestManager:

```js
onDock(systemId) {
  const tanakaState = this.getQuestState('tanaka');
  if (!tanakaState || tanakaState.stage !== 2) return;

  // Check if this system qualifies (>15 LY from Sol)
  const starData = this.getStarData();
  const system = starData.find((s) => s.id === systemId);
  const sol = starData.find((s) => s.id === 0);
  if (!system || !sol) return;

  const distance = Math.sqrt(
    (system.x - sol.x) ** 2 + (system.y - sol.y) ** 2 + (system.z - sol.z) ** 2
  );
  if (distance < ENDGAME_CONFIG.STAGE_2_EXOTIC_DISTANCE) return;

  // Check if already collected from this station
  if (!tanakaState.data.exoticStations) tanakaState.data.exoticStations = [];
  if (tanakaState.data.exoticStations.includes(systemId)) return;

  // Chance-based collection
  if (Math.random() >= ENDGAME_CONFIG.STAGE_2_EXOTIC_CHANCE) return;

  // Collect!
  tanakaState.data.exoticStations.push(systemId);
  tanakaState.data.exoticMaterials = (tanakaState.data.exoticMaterials || 0) + 1;
  this.emit('questChanged', { questId: 'tanaka', stage: 2, exoticMaterials: tanakaState.data.exoticMaterials });
}
```

Subscribe to `docked` event in constructor:

```js
gameStateManager.subscribe('docked', (data) => this.onDock(data?.systemId));
```

Note: After reviewing, the exotic material collection is better handled directly in QuestManager than as a narrative event, because it needs distance calculations and per-station tracking. The narrative event approach would require too many workarounds. Remove the `exotic_material_find` event if you added it and handle everything in QuestManager.onDock().

However, we still want a narrative notification when the player finds a material. The QuestManager can emit a custom event that the UI can display as a notification.

**Step 3: Write tests**

```js
describe('Exotic material collection', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
    // Tanaka quest at stage 2
    manager.registerQuest(TANAKA_QUEST);
    manager.advanceQuest('tanaka'); // stage 1
    manager.advanceQuest('tanaka'); // stage 2
    // Set the collecting flag
    manager.state.world.narrativeEvents.flags.tanaka_collecting_exotics = true;
  });

  it('does not collect from Sol (too close)', () => {
    manager.questManager.onDock(0);
    expect(manager.getQuestState('tanaka').data.exoticMaterials).toBeUndefined();
  });
});
```

Note: This test depends on the distance of systems in TEST_STAR_DATA. Sol is at (0,0,0). Check which test systems are >15 LY from Sol using their coordinates. Barnard's Star at (-0.98, -82.88, 6.86) has distance ~83 LY — that qualifies. Use that system with a fixed random seed for predictable results.

**Step 4: Run tests**

```bash
npm test -- tests/unit/quest-manager.test.js
```

**Step 5: Commit**

```bash
git add src/game/state/managers/quest-manager.js src/game/data/narrative-events.js tests/unit/quest-manager.test.js
git commit -m "feat: exotic material collection for Tanaka quest stage 2"
```

---

## Phase 4: Save/Load

### Task 15: Save/Load Migration for Quests and Stats

**Files:**
- Modify: `src/game/state/save-load.js` (or `managers/save-load.js`)
- Modify: `src/game/state/managers/initialization.js` (addStateDefaults)
- Test: `tests/unit/save-load.test.js`

**Step 1: Write failing test**

```js
describe('Save/load with quests and stats', () => {
  it('preserves quest state across save/load', () => {
    const manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
    manager.advanceQuest('tanaka');
    manager.saveGame();

    const manager2 = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    const loaded = manager2.loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded.quests.tanaka.stage).toBe(1);
    expect(loaded.stats).toBeDefined();
    expect(loaded.stats.creditsEarned).toBeGreaterThanOrEqual(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/save-load.test.js
```

**Step 3: Add state defaults for old saves**

In the `addStateDefaults` function (in `save-load.js` or `initialization.js`), add:

```js
if (!state.stats) {
  state.stats = {
    creditsEarned: 0,
    jumpsCompleted: 0,
    cargoHauled: 0,
    smugglingRuns: 0,
    charitableActs: 0,
  };
}
if (!state.quests) {
  state.quests = {};
}
```

**Step 4: Emit questChanged on load**

In `emitLoadedStateEvents`, add:

```js
if (state.quests) {
  this.emit('questChanged', state.quests);
}
```

**Step 5: Run tests**

```bash
npm test -- tests/unit/save-load.test.js
```

**Step 6: Run full suite**

```bash
npm test
```

**Step 7: Commit**

```bash
git add src/game/state/managers/save-load.js src/game/state/managers/initialization.js tests/unit/save-load.test.js
git commit -m "feat: save/load migration for quests and stats state"
```

---

## Phase 5: Endgame UI

### Task 16: Add Quest Actions to useGameAction and useGameEvent

**Files:**
- Modify: `src/hooks/useGameAction.js`
- Modify: `src/hooks/useGameEvent.js`
- Modify: `src/game/state/managers/event-system.js` (add `questChanged` event)

**Step 1: Add questChanged to event subscribers**

In `src/game/state/managers/event-system.js`, add `questChanged: []` to the subscribers object.

**Step 2: Add quest actions to useGameAction**

In `src/hooks/useGameAction.js`, add inside the `useMemo` actions object:

```js
getQuestStage: (questId) => gameStateManager.getQuestStage(questId),
advanceQuest: (questId) => gameStateManager.advanceQuest(questId),
isQuestComplete: (questId) => gameStateManager.isQuestComplete(questId),
getQuestState: (questId) => gameStateManager.getQuestState(questId),
canStartQuestStage: (questId, stage) => gameStateManager.canStartQuestStage(questId, stage),
checkQuestObjectives: (questId) => gameStateManager.checkQuestObjectives(questId),
```

**Step 3: Add questChanged to useGameEvent's extractStateForEvent**

In `src/hooks/useGameEvent.js`, add to the `extractStateForEvent` map:

```js
case 'questChanged':
  return state.quests || {};
```

**Step 4: Run full suite**

```bash
npm test
```

**Step 5: Commit**

```bash
git add src/hooks/useGameAction.js src/hooks/useGameEvent.js src/game/state/managers/event-system.js
git commit -m "feat: add quest actions and events to Bridge Pattern hooks"
```

---

### Task 17: Pavonis Run Component

**Files:**
- Create: `src/features/endgame/PavonisRun.jsx`

**Step 1: Create the PavonisRun component**

This is a full-screen narrative sequence with:
1. Point of no return confirmation
2. Auto-save trigger
3. Linear text panels with continue buttons
4. Transition to epilogue on completion

```jsx
import { useState } from 'react';
import { useGameState } from '../../context/GameContext.jsx';
import { Button } from '../../components/Button.jsx';

const JUMP_SEQUENCE = [
  "The Range Extender hums to life. Your ship vibrates in a way you've never felt before.",
  "Tanaka's voice crackles over the comm. \"Coordinates locked. Delta Pavonis. 27.88 light-years. Initiating jump in three... two... one...\"",
  'The stars stretch. Reality bends. Your ship screams through space in ways it was never meant to.',
  'And then... silence.',
  'Delta Pavonis burns ahead of you. Orange. Warm. Home.',
  'You made it.',
];

export function PavonisRun({ onComplete, onCancel }) {
  const gameStateManager = useGameState();
  const [phase, setPhase] = useState('confirm'); // confirm | jumping | complete
  const [textIndex, setTextIndex] = useState(0);

  const handleConfirm = () => {
    // Auto-save before the point of no return
    gameStateManager.saveGame();
    setPhase('jumping');
  };

  const handleContinue = () => {
    if (textIndex < JUMP_SEQUENCE.length - 1) {
      setTextIndex(textIndex + 1);
    } else {
      setPhase('complete');
      onComplete();
    }
  };

  if (phase === 'confirm') {
    return (
      <div id="pavonis-run" className="visible">
        <div className="endgame-panel">
          <h2>POINT OF NO RETURN</h2>
          <p>
            Tanaka stands beside your ship, tools in hand.
          </p>
          <p>
            &quot;Once we do this, there&apos;s no coming back. The Range Extender is one-way.
            You&apos;ll reach Delta Pavonis, but you won&apos;t return to the network.
            Not unless they&apos;ve built wormhole infrastructure there.&quot;
          </p>
          <p>She pauses.</p>
          <p>&quot;Are you sure?&quot;</p>
          <div className="endgame-choices">
            <Button onClick={handleConfirm}>YES, I&apos;M READY</Button>
            <Button onClick={onCancel}>NOT YET</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="pavonis-run" className="visible">
      <div className="endgame-panel">
        <p className="jump-text">{JUMP_SEQUENCE[textIndex]}</p>
        <Button onClick={handleContinue}>
          {textIndex < JUMP_SEQUENCE.length - 1 ? 'Continue' : 'Arrive at Delta Pavonis'}
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Add CSS**

Create or add to `src/features/endgame/endgame.css`:

```css
#pavonis-run {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: black;
  color: white;
  z-index: var(--z-modal);
}

.endgame-panel {
  max-width: 600px;
  text-align: center;
  padding: 2rem;
}

.jump-text {
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.endgame-choices {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}
```

**Step 3: Commit**

```bash
git add src/features/endgame/PavonisRun.jsx src/features/endgame/endgame.css
git commit -m "feat: add PavonisRun endgame component"
```

---

### Task 18: Epilogue Data

**Files:**
- Create: `src/game/data/epilogue-data.js`

**Step 1: Create epilogue configuration**

This is a data file with template paragraphs selected by conditions. Write the narrative text following the spec's examples.

```js
import { REPUTATION_BOUNDS } from '../constants.js';

export const EPILOGUE_CONFIG = {
  sections: [
    {
      id: 'arrival',
      variants: [
        {
          condition: null,
          text: 'Delta Pavonis fills your viewport — an orange sun, warmer than Sol, somehow welcoming despite the impossible distance. The Range Extender sputters and dies, its single purpose spent. Twenty-seven light-years from everything you knew.',
        },
      ],
    },
    {
      id: 'tanaka',
      variants: [
        {
          condition: { npcRep: ['tanaka_barnards', REPUTATION_BOUNDS.FAMILY_MIN] },
          text: "Tanaka's voice comes through the comm, steady as ever. \"We made it.\" A pause — the longest you've ever heard from her. \"Thank you. For everything.\" You can hear the smile she'd never show.",
        },
        {
          condition: { npcRep: ['tanaka_barnards', REPUTATION_BOUNDS.TRUSTED_MIN] },
          text: "\"Successful jump confirmed,\" Tanaka reports from the engineering bay. Professional as always. But when you turn, she's staring out the viewport with tears in her eyes. \"My sister is down there. Somewhere.\"",
        },
      ],
    },
    {
      id: 'reputation',
      variants: [
        {
          condition: { karmaAbove: 50, trustedNPCs: 3 },
          text: "Word spreads fast, even 27 light-years from Sol. They remember you in the network — the trader who kept their word, who helped when it mattered. You're not forgotten.",
        },
        {
          condition: { karmaBelow: -50 },
          text: "You made it. That's what matters. The network moves on without you. Ships dock and undock. Traders come and go. Your name fades. But you're here. You're free. That's enough.",
        },
        {
          condition: { smugglingRuns: 5 },
          text: "The authorities are probably glad you're gone. One less problem. But in the outer stations, in the dark corners, they remember. The trader who took the risks no one else would. There's respect in that.",
        },
        {
          condition: null,
          text: "The network continues without you. Some will remember your name, others won't. But you crossed the void. You made the impossible run. And that's something no one can take from you.",
        },
      ],
    },
    {
      id: 'reflection',
      variants: [
        {
          condition: { karmaAbove: 30 },
          text: "You chose the harder path more often than not. Helped when you could have turned away. Gave when you could have taken. Delta Pavonis feels like something earned, not just reached.",
        },
        {
          condition: { karmaBelow: -30 },
          text: "You survived. In the void between stars, survival is its own morality. Every choice you made kept you flying. And now you've flown further than anyone thought possible.",
        },
        {
          condition: null,
          text: "Neither saint nor villain — just a freighter captain who did what needed doing. The stars don't judge. They just burn. And now there's a new one overhead.",
        },
      ],
    },
  ],
};
```

**Step 2: Create epilogue evaluation function**

```js
export function generateEpilogue(gameState) {
  const sections = [];

  for (const section of EPILOGUE_CONFIG.sections) {
    if (section.dynamic) {
      // Generate per-NPC text for trusted+ NPCs
      // TODO: Implement dynamic NPC outcome paragraphs
      continue;
    }

    for (const variant of section.variants) {
      if (evaluateEpilogueCondition(variant.condition, gameState)) {
        sections.push({ id: section.id, text: variant.text });
        break;
      }
    }
  }

  return sections;
}

function evaluateEpilogueCondition(condition, gameState) {
  if (!condition) return true;

  if (condition.npcRep) {
    const [npcId, threshold] = condition.npcRep;
    if ((gameState.npcs[npcId]?.rep ?? 0) < threshold) return false;
  }

  if (condition.karmaAbove != null) {
    if (gameState.player.karma <= condition.karmaAbove) return false;
  }

  if (condition.karmaBelow != null) {
    if (gameState.player.karma >= condition.karmaBelow) return false;
  }

  if (condition.trustedNPCs != null) {
    const count = Object.values(gameState.npcs).filter(
      (n) => n.rep >= REPUTATION_BOUNDS.TRUSTED_MIN
    ).length;
    if (count < condition.trustedNPCs) return false;
  }

  if (condition.smugglingRuns != null) {
    if ((gameState.stats?.smugglingRuns ?? 0) < condition.smugglingRuns) return false;
  }

  return true;
}

export function generateStats(gameState) {
  return {
    daysElapsed: gameState.player.daysElapsed,
    systemsVisited: gameState.world.visitedSystems.length,
    creditsEarned: gameState.stats?.creditsEarned ?? 0,
    missionsCompleted: gameState.missions.completed.length,
    trustedNPCs: Object.values(gameState.npcs).filter(
      (n) => n.rep >= REPUTATION_BOUNDS.TRUSTED_MIN
    ).length,
    cargoHauled: gameState.stats?.cargoHauled ?? 0,
    jumpsCompleted: gameState.stats?.jumpsCompleted ?? 0,
  };
}
```

**Step 3: Write tests**

Add to `tests/unit/quest-manager.test.js` or create `tests/unit/epilogue.test.js`:

```js
import { generateEpilogue, generateStats } from '../../src/game/data/epilogue-data.js';

describe('Epilogue generation', () => {
  it('always includes arrival section', () => {
    const state = {
      player: { karma: 0, daysElapsed: 100 },
      npcs: {},
      world: { visitedSystems: [0, 1, 4] },
      missions: { completed: [] },
      stats: { creditsEarned: 0, cargoHauled: 0, jumpsCompleted: 0 },
    };
    const sections = generateEpilogue(state);
    expect(sections.find((s) => s.id === 'arrival')).toBeDefined();
  });

  it('selects high-karma reputation variant', () => {
    const state = {
      player: { karma: 60, daysElapsed: 100 },
      npcs: {
        a: { rep: 70 },
        b: { rep: 80 },
        c: { rep: 65 },
      },
      world: { visitedSystems: [0] },
      missions: { completed: [] },
      stats: { creditsEarned: 0, smugglingRuns: 0, cargoHauled: 0, jumpsCompleted: 0 },
    };
    const sections = generateEpilogue(state);
    const rep = sections.find((s) => s.id === 'reputation');
    expect(rep.text).toContain('remember you');
  });

  it('generates stats from game state', () => {
    const state = {
      player: { daysElapsed: 127 },
      world: { visitedSystems: [0, 1, 4, 5, 7] },
      npcs: { a: { rep: 70 } },
      missions: { completed: ['m1', 'm2'] },
      stats: { creditsEarned: 47320, cargoHauled: 340, jumpsCompleted: 89 },
    };
    const stats = generateStats(state);
    expect(stats.daysElapsed).toBe(127);
    expect(stats.systemsVisited).toBe(5);
    expect(stats.missionsCompleted).toBe(2);
    expect(stats.trustedNPCs).toBe(1);
  });
});
```

**Step 4: Run tests**

```bash
npm test -- tests/unit/epilogue.test.js
```

**Step 5: Commit**

```bash
git add src/game/data/epilogue-data.js tests/unit/epilogue.test.js
git commit -m "feat: add epilogue data and generation logic"
```

---

### Task 19: Epilogue Component

**Files:**
- Create: `src/features/endgame/Epilogue.jsx`

**Step 1: Create Epilogue component**

```jsx
import { useMemo, useState } from 'react';
import { useGameState } from '../../context/GameContext.jsx';
import { generateEpilogue, generateStats } from '../../game/data/epilogue-data.js';
import { Button } from '../../components/Button.jsx';

export function Epilogue({ onReturnToTitle }) {
  const gameStateManager = useGameState();
  const [phase, setPhase] = useState('epilogue'); // epilogue | stats | credits

  const state = gameStateManager.state;
  const sections = useMemo(() => generateEpilogue(state), [state]);
  const stats = useMemo(() => generateStats(state), [state]);

  if (phase === 'credits') {
    return (
      <div id="epilogue" className="visible">
        <div className="endgame-panel">
          <h2>TRAMP FREIGHTER BLUES</h2>
          <p className="credits-text">A space trading survival game</p>
          <Button onClick={onReturnToTitle}>Return to Title</Button>
        </div>
      </div>
    );
  }

  if (phase === 'stats') {
    return (
      <div id="epilogue" className="visible">
        <div className="endgame-panel">
          <h2>VOYAGE STATISTICS</h2>
          <div className="stats-grid">
            <div className="stat-row">
              <span>Days traveled:</span>
              <span>{stats.daysElapsed}</span>
            </div>
            <div className="stat-row">
              <span>Systems visited:</span>
              <span>{stats.systemsVisited}</span>
            </div>
            <div className="stat-row">
              <span>Credits earned:</span>
              <span>₡{stats.creditsEarned.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span>Missions completed:</span>
              <span>{stats.missionsCompleted}</span>
            </div>
            <div className="stat-row">
              <span>NPCs at Trusted or higher:</span>
              <span>{stats.trustedNPCs}</span>
            </div>
            <div className="stat-row">
              <span>Cargo hauled:</span>
              <span>{stats.cargoHauled} units</span>
            </div>
            <div className="stat-row">
              <span>Jumps made:</span>
              <span>{stats.jumpsCompleted}</span>
            </div>
          </div>
          <Button onClick={() => setPhase('credits')}>Credits</Button>
        </div>
      </div>
    );
  }

  return (
    <div id="epilogue" className="visible">
      <div className="endgame-panel">
        <h2>EPILOGUE</h2>
        {sections.map((section) => (
          <p key={section.id} className="epilogue-text">
            {section.text}
          </p>
        ))}
        <Button onClick={() => setPhase('stats')}>Continue</Button>
      </div>
    </div>
  );
}
```

**Step 2: Add CSS to endgame.css**

```css
#epilogue {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: black;
  color: white;
  z-index: var(--z-modal);
  overflow-y: auto;
}

.epilogue-text {
  font-size: 1rem;
  line-height: 1.8;
  margin-bottom: 1.5rem;
  font-style: italic;
}

.stats-grid {
  margin: 2rem 0;
  text-align: left;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.credits-text {
  margin-top: 2rem;
  opacity: 0.6;
}
```

**Step 3: Commit**

```bash
git add src/features/endgame/Epilogue.jsx src/features/endgame/endgame.css
git commit -m "feat: add Epilogue component with stats and credits"
```

---

### Task 20: App.jsx Integration — New View Modes

**Files:**
- Modify: `src/App.jsx`

**Step 1: Add new view modes**

Add to the `VIEW_MODES` constant:

```js
PAVONIS_RUN: 'PAVONIS_RUN',
EPILOGUE: 'EPILOGUE',
```

**Step 2: Import endgame components**

```js
import { PavonisRun } from './features/endgame/PavonisRun.jsx';
import { Epilogue } from './features/endgame/Epilogue.jsx';
```

**Step 3: Add a handler to trigger the Pavonis Run**

This will be called from the dialogue system when the player confirms they're ready:

```js
const handleStartPavonisRun = () => {
  setViewMode(VIEW_MODES.PAVONIS_RUN);
};

const handlePavonisComplete = () => {
  // Mark victory on save
  if (gameStateManager.state.meta) {
    gameStateManager.state.meta.victory = true;
  }
  gameStateManager.saveGame();
  setViewMode(VIEW_MODES.EPILOGUE);
};

const handleReturnToTitle = () => {
  setViewMode(VIEW_MODES.TITLE);
};
```

**Step 4: Add conditional rendering**

In the JSX return, add:

```jsx
{viewMode === VIEW_MODES.PAVONIS_RUN && (
  <PavonisRun
    onComplete={handlePavonisComplete}
    onCancel={() => setViewMode(VIEW_MODES.STATION)}
  />
)}
{viewMode === VIEW_MODES.EPILOGUE && (
  <Epilogue onReturnToTitle={handleReturnToTitle} />
)}
```

**Step 5: Expose the handler for dialogue system**

The Tanaka dialogue's final "I'm ready" action needs to trigger `handleStartPavonisRun`. Since dialogue actions call `gameStateManager` methods, add a method:

In GameStateManager, add:
```js
startPavonisRun() {
  this.emit('pavonisRunTriggered', true);
}
```

Add `pavonisRunTriggered` to event-system.js subscribers.

In App.jsx, subscribe to this event:
```js
const pavonisRunEvent = useGameEvent('pavonisRunTriggered');

useEffect(() => {
  if (pavonisRunEvent) {
    handleStartPavonisRun();
  }
}, [pavonisRunEvent]);
```

**Step 6: Run full suite**

```bash
npm test
```

**Step 7: Commit**

```bash
git add src/App.jsx src/game/state/game-state-manager.js src/game/state/managers/event-system.js
git commit -m "feat: integrate endgame view modes into App.jsx"
```

---

## Phase 6: Integration & Polish

### Task 21: Message Delivery for Stage 4

**Files:**
- Modify: `src/game/data/dialogue/captain-vasquez.js` (Epsilon Eridani NPC)
- Modify: `src/game/state/managers/quest-manager.js`

**Step 1: Add dialogue option to Vasquez for message delivery**

In Captain Vasquez's dialogue tree, add a new choice in the `greeting` node that's visible when the Tanaka quest is at stage 4 and `messageDelivered` is not yet true:

```js
{
  text: '"I have a message from Yuki Tanaka."',
  next: 'tanaka_message',
  condition: (rep, gsm) =>
    gsm.getQuestStage('tanaka') === 4 &&
    !gsm.getQuestState('tanaka')?.data?.messageDelivered,
  action: (gsm) => {
    gsm.updateQuestData('tanaka', 'messageDelivered', 1);
    return { success: true, message: 'Message delivered.' };
  },
},
```

Add a `tanaka_message` node:

```js
tanaka_message: {
  text: () =>
    'Vasquez reads the message slowly. Their expression changes — something between sadness and understanding. "I knew Tanaka back then. Before her sister left. Tell her... tell her I\'m glad she never gave up."',
  choices: [
    { text: 'Nod and take your leave.', next: null },
  ],
},
```

**Step 2: Run full test suite**

```bash
npm test
```

**Step 3: Commit**

```bash
git add src/game/data/dialogue/captain-vasquez.js
git commit -m "feat: add Tanaka message delivery dialogue to Vasquez"
```

---

### Task 22: End-to-End Quest Flow Test

**Files:**
- Test: `tests/unit/quest-manager.test.js`

**Step 1: Write integration test for full Tanaka quest progression**

```js
describe('Tanaka quest end-to-end', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('progresses through all 5 stages to victory', () => {
    // Stage 0 → 1
    manager.advanceQuest('tanaka');
    expect(manager.getQuestStage('tanaka')).toBe(1);

    // Complete stage 1 objectives (3 jumps)
    manager.questManager.onJump();
    manager.questManager.onJump();
    manager.questManager.onJump();
    expect(manager.checkQuestObjectives('tanaka')).toBe(true);

    // Stage 1 → 2
    manager.advanceQuest('tanaka');
    expect(manager.getQuestStage('tanaka')).toBe(2);

    // Complete stage 2 objectives (5 exotic materials)
    manager.updateQuestData('tanaka', 'exoticMaterials', 5);
    expect(manager.checkQuestObjectives('tanaka')).toBe(true);

    // Stage 2 → 3
    manager.advanceQuest('tanaka');
    expect(manager.getQuestStage('tanaka')).toBe(3);

    // Stage 3 has no objectives (narrative auto-complete)
    expect(manager.checkQuestObjectives('tanaka')).toBe(true);

    // Stage 3 → 4
    manager.advanceQuest('tanaka');
    expect(manager.getQuestStage('tanaka')).toBe(4);

    // Complete stage 4 (message delivered)
    manager.updateQuestData('tanaka', 'messageDelivered', 1);
    expect(manager.checkQuestObjectives('tanaka')).toBe(true);

    // Stage 4 → 5
    manager.advanceQuest('tanaka');
    expect(manager.getQuestStage('tanaka')).toBe(5);

    // Stage 5 has no objectives (requirements check only)
    expect(manager.checkQuestObjectives('tanaka')).toBe(true);

    // Stage 5 → 6 (victory!)
    manager.advanceQuest('tanaka');
    expect(manager.getQuestStage('tanaka')).toBe(6);
    expect(manager.isQuestComplete('tanaka')).toBe(true);
  });

  it('applies credit rewards correctly', () => {
    const startCredits = manager.state.player.credits;
    manager.advanceQuest('tanaka'); // Stage 1: 1000cr
    // Rep is applied through modifyRep which has trust modifier
    expect(manager.state.player.credits).toBe(startCredits + 1000);
  });
});
```

**Step 2: Run tests**

```bash
npm test -- tests/unit/quest-manager.test.js
```

**Step 3: Fix any issues found**

**Step 4: Run full suite**

```bash
npm test
```

**Step 5: Commit**

```bash
git add tests/unit/quest-manager.test.js
git commit -m "test: end-to-end Tanaka quest progression test"
```

---

### Task 23: Final Integration Test & Cleanup

**Step 1: Run full test suite**

```bash
npm test
```

**Step 2: Run linter**

```bash
npm run lint
```

**Step 3: Fix any lint errors**

```bash
npm run lint:fix
```

**Step 4: Run formatter**

```bash
npm run format:write
```

**Step 5: Final test run**

```bash
npm test
```

**Step 6: Commit any cleanup**

```bash
git add -A
git commit -m "chore: lint and format endgame feature"
```

---

## Summary of Files

### New Files
| File | Purpose |
|------|---------|
| `src/game/state/managers/quest-manager.js` | Generic quest progression manager |
| `src/game/data/quest-definitions.js` | Tanaka quest config data |
| `src/game/data/dialogue/tanaka-dialogue.js` | Tanaka NPC dialogue tree |
| `src/game/data/epilogue-data.js` | Epilogue templates + generation logic |
| `src/features/endgame/PavonisRun.jsx` | Pavonis Run narrative component |
| `src/features/endgame/Epilogue.jsx` | Epilogue + stats + credits component |
| `src/features/endgame/endgame.css` | Endgame UI styles |
| `tests/unit/quest-manager.test.js` | Quest system tests |
| `tests/unit/epilogue.test.js` | Epilogue generation tests |

### Modified Files
| File | Change |
|------|--------|
| `src/game/constants.js` | ENDGAME_CONFIG, QUEST_CONFIG, new CONDITION_TYPES |
| `src/game/event-conditions.js` | 8 new condition type cases |
| `src/game/state/game-state-manager.js` | QuestManager registration + delegation |
| `src/game/state/managers/event-system.js` | questChanged, pavonisRunTriggered events |
| `src/game/state/managers/initialization.js` | state.stats + state.quests init |
| `src/game/state/managers/navigation.js` | jumpsCompleted stat tracking |
| `src/game/state/managers/trading.js` | cargoHauled + creditsEarned tracking |
| `src/game/state/managers/danger.js` | charitableActs tracking |
| `src/game/state/managers/save-load.js` | Migration for quests + stats |
| `src/game/data/npc-data.js` | Yuki Tanaka NPC |
| `src/game/data/narrative-events.js` | Tanaka intro event |
| `src/game/data/dialogue-trees.js` | Register Tanaka dialogue |
| `src/game/data/dialogue/captain-vasquez.js` | Message delivery dialogue |
| `src/game/game-npcs.js` | Quest-aware NPC visibility |
| `src/hooks/useGameAction.js` | Quest action methods |
| `src/hooks/useGameEvent.js` | questChanged event mapping |
| `src/App.jsx` | PAVONIS_RUN + EPILOGUE view modes |
