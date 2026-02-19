# Narrative Event System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a generic EventEngine that unifies danger encounters and narrative events under one trigger/eligibility/priority pipeline, then add a narrative event UI and 13 sample events.

**Architecture:** EventEngineManager (extends BaseManager) handles registration, eligibility checking, and priority sorting for all event types. Danger encounters register as high-priority events; narrative events register at lower priority. A unified `useEventTriggers` hook replaces `useJumpEncounters`. NarrativeEventPanel displays narrative events using the existing ENCOUNTER view mode. Resolution remains type-specific — danger panels unchanged.

**Tech Stack:** React 18, Vitest, existing Bridge Pattern (useGameEvent/useGameAction), existing applyEncounterOutcome.

**Design doc:** `docs/plans/2026-02-19-narrative-events-design.md`

---

## Phase 1: Core Engine (no UI, no integration)

### Task 1: Add Narrative Event Constants

**Files:**
- Modify: `src/game/constants.js` (append to end)

**Step 1: Add constants**

Append to `src/game/constants.js`:

```javascript
/**
 * Narrative Event System Configuration
 */
export const NARRATIVE_EVENT_CONFIG = {
  // Danger encounter priorities (higher = checked first)
  DANGER_PRIORITY_PIRATE: 100,
  DANGER_PRIORITY_INSPECTION: 80,
  DANGER_PRIORITY_MECHANICAL: 60,
  DANGER_PRIORITY_DISTRESS: 40,

  // Narrative event priority range
  NARRATIVE_PRIORITY_HIGH: 20,
  NARRATIVE_PRIORITY_DEFAULT: 10,
  NARRATIVE_PRIORITY_LOW: 5,
};

/**
 * Condition types for the event engine's enum+params system.
 * Each key maps to a condition evaluator function.
 */
export const CONDITION_TYPES = {
  FIRST_VISIT: 'first_visit',
  DEBT_ABOVE: 'debt_above',
  DEBT_BELOW: 'debt_below',
  KARMA_ABOVE: 'karma_above',
  KARMA_BELOW: 'karma_below',
  FUEL_BELOW: 'fuel_below',
  HULL_BELOW: 'hull_below',
  DAYS_PAST: 'days_past',
  HAS_VISITED: 'has_visited',
  HAS_CARGO: 'has_cargo',
  FLAG_SET: 'flag_set',
};
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: No new errors

**Step 3: Commit**

```bash
git add src/game/constants.js
git commit -m "feat: add narrative event constants and condition types"
```

---

### Task 2: Condition Evaluator

Pure function with no dependencies beyond constants. Highly testable.

**Files:**
- Create: `src/game/event-conditions.js`
- Create: `tests/unit/event-conditions.test.js`

**Step 1: Write failing tests**

Create `tests/unit/event-conditions.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '../../src/game/event-conditions.js';

describe('evaluateCondition', () => {
  const baseState = {
    player: {
      currentSystem: 0,
      debt: 10000,
      karma: 0,
      daysElapsed: 15,
      factions: { authorities: 0, outlaws: 0, traders: 0, civilians: 0 },
    },
    ship: {
      fuel: 50,
      hull: 80,
      cargo: [{ good: 'ore', qty: 5, buyPrice: 10 }],
    },
    world: {
      visitedSystems: [0, 1],
      narrativeEvents: { fired: [], cooldowns: {}, flags: { met_chen: true } },
    },
  };

  describe('first_visit', () => {
    it('should return true when system not in visitedSystems', () => {
      const context = { system: 4 };
      expect(evaluateCondition({ type: 'first_visit' }, baseState, context)).toBe(true);
    });

    it('should return false when system already visited', () => {
      const context = { system: 0 };
      expect(evaluateCondition({ type: 'first_visit' }, baseState, context)).toBe(false);
    });
  });

  describe('debt_above', () => {
    it('should return true when debt exceeds value', () => {
      expect(evaluateCondition({ type: 'debt_above', value: 8000 }, baseState)).toBe(true);
    });

    it('should return false when debt is below value', () => {
      expect(evaluateCondition({ type: 'debt_above', value: 15000 }, baseState)).toBe(false);
    });
  });

  describe('debt_below', () => {
    it('should return true when debt is below value', () => {
      expect(evaluateCondition({ type: 'debt_below', value: 15000 }, baseState)).toBe(true);
    });

    it('should return false when debt exceeds value', () => {
      expect(evaluateCondition({ type: 'debt_below', value: 5000 }, baseState)).toBe(false);
    });
  });

  describe('karma_above', () => {
    it('should return true when karma exceeds value', () => {
      const state = { ...baseState, player: { ...baseState.player, karma: 10 } };
      expect(evaluateCondition({ type: 'karma_above', value: 5 }, state)).toBe(true);
    });

    it('should return false when karma is below value', () => {
      expect(evaluateCondition({ type: 'karma_above', value: 5 }, baseState)).toBe(false);
    });
  });

  describe('karma_below', () => {
    it('should return true when karma is below value', () => {
      const state = { ...baseState, player: { ...baseState.player, karma: -10 } };
      expect(evaluateCondition({ type: 'karma_below', value: -5 }, state)).toBe(true);
    });
  });

  describe('fuel_below', () => {
    it('should return true when fuel is below value', () => {
      const state = { ...baseState, ship: { ...baseState.ship, fuel: 8 } };
      expect(evaluateCondition({ type: 'fuel_below', value: 10 }, state)).toBe(true);
    });

    it('should return false when fuel is above value', () => {
      expect(evaluateCondition({ type: 'fuel_below', value: 10 }, baseState)).toBe(false);
    });
  });

  describe('hull_below', () => {
    it('should return true when hull is below value', () => {
      const state = { ...baseState, ship: { ...baseState.ship, hull: 25 } };
      expect(evaluateCondition({ type: 'hull_below', value: 30 }, state)).toBe(true);
    });
  });

  describe('days_past', () => {
    it('should return true when daysElapsed >= value', () => {
      expect(evaluateCondition({ type: 'days_past', value: 15 }, baseState)).toBe(true);
    });

    it('should return false when daysElapsed < value', () => {
      expect(evaluateCondition({ type: 'days_past', value: 30 }, baseState)).toBe(false);
    });
  });

  describe('has_visited', () => {
    it('should return true when system is in visitedSystems', () => {
      expect(evaluateCondition({ type: 'has_visited', system: 1 }, baseState)).toBe(true);
    });

    it('should return false when system not visited', () => {
      expect(evaluateCondition({ type: 'has_visited', system: 99 }, baseState)).toBe(false);
    });
  });

  describe('has_cargo', () => {
    it('should return true when cargo contains the good', () => {
      expect(evaluateCondition({ type: 'has_cargo', good: 'ore' }, baseState)).toBe(true);
    });

    it('should return false when cargo does not contain the good', () => {
      expect(evaluateCondition({ type: 'has_cargo', good: 'medicine' }, baseState)).toBe(false);
    });
  });

  describe('flag_set', () => {
    it('should return true when flag exists in narrativeEvents.flags', () => {
      expect(evaluateCondition({ type: 'flag_set', flag: 'met_chen' }, baseState)).toBe(true);
    });

    it('should return false when flag is not set', () => {
      expect(evaluateCondition({ type: 'flag_set', flag: 'unknown_flag' }, baseState)).toBe(false);
    });
  });

  describe('array of conditions (AND logic)', () => {
    it('should return true when all conditions in array are met', () => {
      const conditions = [
        { type: 'debt_above', value: 8000 },
        { type: 'days_past', value: 15 },
      ];
      expect(evaluateCondition(conditions, baseState)).toBe(true);
    });

    it('should return false when any condition in array is not met', () => {
      const conditions = [
        { type: 'debt_above', value: 8000 },
        { type: 'days_past', value: 30 },
      ];
      expect(evaluateCondition(conditions, baseState)).toBe(false);
    });

    it('should return true for empty array', () => {
      expect(evaluateCondition([], baseState)).toBe(true);
    });
  });

  describe('null condition', () => {
    it('should return true when condition is null', () => {
      expect(evaluateCondition(null, baseState)).toBe(true);
    });
  });

  describe('unknown condition type', () => {
    it('should return false for unknown condition types', () => {
      expect(evaluateCondition({ type: 'bogus' }, baseState)).toBe(false);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/event-conditions.test.js`
Expected: FAIL — module not found

**Step 3: Implement evaluateCondition**

Create `src/game/event-conditions.js`:

```javascript
import { CONDITION_TYPES } from './constants.js';

/**
 * Evaluate a trigger condition against game state.
 *
 * Uses enum+params pattern: each condition has a `type` string
 * and optional parameters. Returns true if the condition is met.
 *
 * @param {Object|Object[]|null} condition - { type, ...params }, array of conditions (AND), or null (always true)
 * @param {Object} gameState - Current game state
 * @param {Object} context - Trigger context (e.g., { system: 4 })
 * @returns {boolean} Whether the condition is met
 */
export function evaluateCondition(condition, gameState, context = {}) {
  if (!condition) return true;

  // Array of conditions: all must pass (AND logic)
  if (Array.isArray(condition)) {
    return condition.every((c) => evaluateCondition(c, gameState, context));
  }

  switch (condition.type) {
    case CONDITION_TYPES.FIRST_VISIT:
      return !gameState.world.visitedSystems.includes(context.system);

    case CONDITION_TYPES.DEBT_ABOVE:
      return gameState.player.debt > condition.value;

    case CONDITION_TYPES.DEBT_BELOW:
      return gameState.player.debt < condition.value;

    case CONDITION_TYPES.KARMA_ABOVE:
      return gameState.player.karma > condition.value;

    case CONDITION_TYPES.KARMA_BELOW:
      return gameState.player.karma < condition.value;

    case CONDITION_TYPES.FUEL_BELOW:
      return gameState.ship.fuel < condition.value;

    case CONDITION_TYPES.HULL_BELOW:
      return gameState.ship.hull < condition.value;

    case CONDITION_TYPES.DAYS_PAST:
      return gameState.player.daysElapsed >= condition.value;

    case CONDITION_TYPES.HAS_VISITED:
      return gameState.world.visitedSystems.includes(condition.system);

    case CONDITION_TYPES.HAS_CARGO:
      return gameState.ship.cargo.some((item) => item.good === condition.good);

    case CONDITION_TYPES.FLAG_SET:
      return !!gameState.world.narrativeEvents.flags[condition.flag];

    default:
      return false;
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/event-conditions.test.js`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/game/event-conditions.js tests/unit/event-conditions.test.js
git commit -m "feat: add condition evaluator for narrative event system"
```

---

### Task 3: EventEngineManager — Registration and Eligibility

**Files:**
- Create: `src/game/state/managers/event-engine.js`
- Create: `tests/unit/event-engine.test.js`

**Step 1: Write failing tests for registration and checkEvents**

Create `tests/unit/event-engine.test.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventEngineManager } from '../../src/game/state/managers/event-engine.js';

function createMockGameStateManager(stateOverrides = {}) {
  const defaultState = {
    player: {
      currentSystem: 0,
      debt: 10000,
      karma: 0,
      daysElapsed: 15,
      factions: { authorities: 0, outlaws: 0, traders: 0, civilians: 0 },
    },
    ship: {
      fuel: 50,
      hull: 80,
      cargo: [],
    },
    world: {
      visitedSystems: [0],
      narrativeEvents: { fired: [], cooldowns: {}, flags: {} },
    },
  };

  return {
    state: { ...defaultState, ...stateOverrides },
    isTestEnvironment: true,
    emit: vi.fn(),
    getState() { return this.state; },
    saveGame: vi.fn(),
  };
}

describe('EventEngineManager', () => {
  let engine;
  let mockGSM;

  beforeEach(() => {
    mockGSM = createMockGameStateManager();
    engine = new EventEngineManager(mockGSM);
  });

  describe('registerEvent', () => {
    it('should register an event', () => {
      const event = {
        id: 'test_event',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false,
        cooldown: 0,
        priority: 10,
        content: { text: ['Hello'], choices: [{ text: 'OK', next: null, effects: {} }] },
      };

      engine.registerEvent(event);
      expect(engine.getEventById('test_event')).toEqual(event);
    });

    it('should register multiple events', () => {
      engine.registerEvent({ id: 'e1', type: 'dock', category: 'narrative', trigger: { chance: 1.0 }, priority: 10, content: {} });
      engine.registerEvent({ id: 'e2', type: 'jump', category: 'narrative', trigger: { chance: 1.0 }, priority: 10, content: {} });
      expect(engine.getEventById('e1')).toBeTruthy();
      expect(engine.getEventById('e2')).toBeTruthy();
    });
  });

  describe('registerEvents', () => {
    it('should register an array of events', () => {
      const events = [
        { id: 'e1', type: 'dock', category: 'narrative', trigger: { chance: 1.0 }, priority: 10, content: {} },
        { id: 'e2', type: 'dock', category: 'narrative', trigger: { chance: 1.0 }, priority: 5, content: {} },
      ];
      engine.registerEvents(events);
      expect(engine.getEventById('e1')).toBeTruthy();
      expect(engine.getEventById('e2')).toBeTruthy();
    });
  });

  describe('checkEvents', () => {
    it('should return null when no events registered', () => {
      const result = engine.checkEvents('dock', { system: 0 });
      expect(result).toBeNull();
    });

    it('should return matching event by type', () => {
      engine.registerEvent({
        id: 'dock_event', type: 'dock', category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false, cooldown: 0, priority: 10,
        content: { text: ['Docked.'], choices: [] },
      });

      const result = engine.checkEvents('dock', { system: 0 });
      expect(result.id).toBe('dock_event');
    });

    it('should not return events of wrong type', () => {
      engine.registerEvent({
        id: 'jump_event', type: 'jump', category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false, cooldown: 0, priority: 10,
        content: {},
      });

      const result = engine.checkEvents('dock', { system: 0 });
      expect(result).toBeNull();
    });

    it('should filter by system when trigger.system is set', () => {
      engine.registerEvent({
        id: 'sol_only', type: 'dock', category: 'narrative',
        trigger: { system: 0, condition: null, chance: 1.0 },
        once: false, cooldown: 0, priority: 10,
        content: {},
      });

      expect(engine.checkEvents('dock', { system: 0 })).toBeTruthy();
      expect(engine.checkEvents('dock', { system: 4 })).toBeNull();
    });

    it('should return highest priority event', () => {
      engine.registerEvent({
        id: 'low_pri', type: 'dock', category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false, cooldown: 0, priority: 5,
        content: {},
      });
      engine.registerEvent({
        id: 'high_pri', type: 'dock', category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false, cooldown: 0, priority: 20,
        content: {},
      });

      const result = engine.checkEvents('dock', { system: 0 });
      expect(result.id).toBe('high_pri');
    });

    it('should skip once-only events that have already fired', () => {
      mockGSM.state.world.narrativeEvents.fired = ['once_event'];

      engine.registerEvent({
        id: 'once_event', type: 'dock', category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: true, cooldown: 0, priority: 10,
        content: {},
      });

      expect(engine.checkEvents('dock', { system: 0 })).toBeNull();
    });

    it('should skip events on cooldown', () => {
      mockGSM.state.world.narrativeEvents.cooldowns = { cd_event: 20 };
      mockGSM.state.player.daysElapsed = 15;

      engine.registerEvent({
        id: 'cd_event', type: 'dock', category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false, cooldown: 5, priority: 10,
        content: {},
      });

      expect(engine.checkEvents('dock', { system: 0 })).toBeNull();
    });

    it('should allow events whose cooldown has expired', () => {
      mockGSM.state.world.narrativeEvents.cooldowns = { cd_event: 10 };
      mockGSM.state.player.daysElapsed = 15;

      engine.registerEvent({
        id: 'cd_event', type: 'dock', category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false, cooldown: 5, priority: 10,
        content: {},
      });

      expect(engine.checkEvents('dock', { system: 0 })).toBeTruthy();
    });

    it('should evaluate trigger conditions', () => {
      engine.registerEvent({
        id: 'first_visit_event', type: 'dock', category: 'narrative',
        trigger: { system: 4, condition: { type: 'first_visit' }, chance: 1.0 },
        once: true, cooldown: 0, priority: 10,
        content: {},
      });

      // System 4 not visited yet
      expect(engine.checkEvents('dock', { system: 4 })).toBeTruthy();

      // Mark as visited
      mockGSM.state.world.visitedSystems.push(4);
      expect(engine.checkEvents('dock', { system: 4 })).toBeNull();
    });

    it('should respect chance rolls via rng parameter', () => {
      engine.registerEvent({
        id: 'rare_event', type: 'dock', category: 'narrative',
        trigger: { system: null, condition: null, chance: 0.1 },
        once: false, cooldown: 0, priority: 10,
        content: {},
      });

      // rng = 0.05 < 0.1 → should fire
      expect(engine.checkEvents('dock', { system: 0 }, 0.05)).toBeTruthy();
      // rng = 0.5 > 0.1 → should not fire
      expect(engine.checkEvents('dock', { system: 0 }, 0.5)).toBeNull();
    });

    it('should support dynamic chance via context.chances lookup', () => {
      engine.registerEvent({
        id: 'dynamic_event', type: 'jump', category: 'danger',
        trigger: { system: null, condition: null, chance: 'pirate_chance' },
        once: false, cooldown: 0, priority: 100,
        encounter: { generator: 'pirate' },
      });

      const context = { system: 4, chances: { pirate_chance: 0.3 } };
      // rng = 0.1 < 0.3 → fire
      expect(engine.checkEvents('jump', context, 0.1)).toBeTruthy();
      // rng = 0.5 > 0.3 → skip
      expect(engine.checkEvents('jump', context, 0.5)).toBeNull();
    });
  });

  describe('markFired', () => {
    it('should add event id to fired list', () => {
      engine.markFired('test_event');
      expect(mockGSM.state.world.narrativeEvents.fired).toContain('test_event');
    });

    it('should not duplicate ids', () => {
      engine.markFired('test_event');
      engine.markFired('test_event');
      expect(mockGSM.state.world.narrativeEvents.fired.filter(id => id === 'test_event')).toHaveLength(1);
    });
  });

  describe('setCooldown', () => {
    it('should set cooldown based on current day + cooldown days', () => {
      mockGSM.state.player.daysElapsed = 10;
      engine.setCooldown('test_event', 5);
      expect(mockGSM.state.world.narrativeEvents.cooldowns.test_event).toBe(15);
    });
  });

  describe('setFlag', () => {
    it('should set a flag in narrativeEvents.flags', () => {
      engine.setFlag('met_chen');
      expect(mockGSM.state.world.narrativeEvents.flags.met_chen).toBe(true);
    });
  });

  describe('getEventById', () => {
    it('should return event by id', () => {
      const event = { id: 'find_me', type: 'dock', category: 'narrative', trigger: { chance: 1.0 }, priority: 10, content: {} };
      engine.registerEvent(event);
      expect(engine.getEventById('find_me').id).toBe('find_me');
    });

    it('should return null for unknown id', () => {
      expect(engine.getEventById('nonexistent')).toBeNull();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/event-engine.test.js`
Expected: FAIL — module not found

**Step 3: Implement EventEngineManager**

Create `src/game/state/managers/event-engine.js`:

```javascript
import { BaseManager } from './base-manager.js';
import { evaluateCondition } from '../../event-conditions.js';

/**
 * EventEngineManager — generic event trigger/eligibility/priority engine.
 *
 * Handles registration, eligibility checking, and priority sorting for
 * all event types (narrative, danger, future types). Does NOT handle
 * resolution logic or UI rendering — those are dispatched by category.
 */
export class EventEngineManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
    this.events = [];
  }

  /**
   * Register a single event definition.
   * @param {Object} event - Event definition object
   */
  registerEvent(event) {
    this.events.push(event);
  }

  /**
   * Register an array of event definitions.
   * @param {Array} events - Array of event definition objects
   */
  registerEvents(events) {
    events.forEach((e) => this.registerEvent(e));
  }

  /**
   * Look up an event by ID (used for chain resolution).
   * @param {string} id - Event ID
   * @returns {Object|null} Event definition or null
   */
  getEventById(id) {
    return this.events.find((e) => e.id === id) || null;
  }

  /**
   * Check for eligible events of the given type.
   *
   * Filters by type, evaluates conditions, checks once/cooldown,
   * rolls chance, sorts by priority, and returns the winner.
   *
   * @param {string} eventType - 'dock' | 'jump' | 'time' | 'condition'
   * @param {Object} context - { system, chances, ... }
   * @param {number} rng - Random number 0-1 for chance rolls (defaults to Math.random())
   * @returns {Object|null} Winning event or null
   */
  checkEvents(eventType, context = {}, rng = Math.random()) {
    const state = this.getState();
    const { narrativeEvents } = state.world;

    const eligible = this.events.filter((event) => {
      // Type match
      if (event.type !== eventType) return false;

      // System match (if specified)
      if (event.trigger.system != null && event.trigger.system !== context.system) {
        return false;
      }

      // Once-only check
      if (event.once && narrativeEvents.fired.includes(event.id)) return false;

      // Cooldown check
      if (event.cooldown && narrativeEvents.cooldowns[event.id] != null) {
        if (state.player.daysElapsed < narrativeEvents.cooldowns[event.id]) {
          return false;
        }
      }

      // Condition check
      if (event.trigger.condition) {
        if (!evaluateCondition(event.trigger.condition, state, context)) {
          return false;
        }
      }

      // Chance roll — supports static number or dynamic string lookup
      let chance = event.trigger.chance;
      if (typeof chance === 'string') {
        chance = context.chances?.[chance] ?? 0;
      }
      if (rng >= chance) return false;

      return true;
    });

    if (eligible.length === 0) return null;

    // Sort by priority (descending) — highest priority wins
    eligible.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return eligible[0];
  }

  /**
   * Mark an event as fired (for once-only tracking).
   * @param {string} eventId
   */
  markFired(eventId) {
    const { fired } = this.getState().world.narrativeEvents;
    if (!fired.includes(eventId)) {
      fired.push(eventId);
    }
  }

  /**
   * Set cooldown for an event.
   * @param {string} eventId
   * @param {number} cooldownDays
   */
  setCooldown(eventId, cooldownDays) {
    const state = this.getState();
    state.world.narrativeEvents.cooldowns[eventId] =
      state.player.daysElapsed + cooldownDays;
  }

  /**
   * Set a narrative flag (for condition checks).
   * @param {string} flagName
   */
  setFlag(flagName) {
    this.getState().world.narrativeEvents.flags[flagName] = true;
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/event-engine.test.js`
Expected: All PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/game/state/managers/event-engine.js tests/unit/event-engine.test.js
git commit -m "feat: add EventEngineManager with registration and eligibility checking"
```

---

### Task 4: Narrative Event Data

**Files:**
- Create: `src/game/data/narrative-events.js`
- Create: `tests/unit/narrative-event-data.test.js`

**Step 1: Write validation tests for event data**

Create `tests/unit/narrative-event-data.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { NARRATIVE_EVENTS } from '../../src/game/data/narrative-events.js';

describe('Narrative Event Data', () => {
  it('should export a non-empty array', () => {
    expect(Array.isArray(NARRATIVE_EVENTS)).toBe(true);
    expect(NARRATIVE_EVENTS.length).toBeGreaterThan(0);
  });

  it('should have unique IDs', () => {
    const ids = NARRATIVE_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  NARRATIVE_EVENTS.forEach((event) => {
    describe(`event: ${event.id}`, () => {
      it('should have required fields', () => {
        expect(event.id).toBeTruthy();
        expect(['dock', 'jump', 'time', 'condition', 'chain']).toContain(event.type);
        expect(event.category).toBe('narrative');
        expect(typeof event.priority).toBe('number');
      });

      it('should have a trigger with chance', () => {
        // Chain events don't need triggers
        if (event.type === 'chain') return;
        expect(event.trigger).toBeTruthy();
        expect(typeof event.trigger.chance).toBe('number');
        expect(event.trigger.chance).toBeGreaterThan(0);
        expect(event.trigger.chance).toBeLessThanOrEqual(1);
      });

      it('should have content with text and choices', () => {
        expect(event.content).toBeTruthy();
        expect(Array.isArray(event.content.text)).toBe(true);
        expect(event.content.text.length).toBeGreaterThan(0);
        expect(Array.isArray(event.content.choices)).toBe(true);
        expect(event.content.choices.length).toBeGreaterThan(0);
      });

      it('should have valid choice structure', () => {
        event.content.choices.forEach((choice) => {
          expect(typeof choice.text).toBe('string');
          expect(choice).toHaveProperty('next');
          expect(choice).toHaveProperty('effects');
        });
      });
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/narrative-event-data.test.js`
Expected: FAIL — module not found

**Step 3: Create narrative event data file**

Create `src/game/data/narrative-events.js`:

```javascript
import { NARRATIVE_EVENT_CONFIG } from '../constants.js';

const { NARRATIVE_PRIORITY_HIGH, NARRATIVE_PRIORITY_DEFAULT, NARRATIVE_PRIORITY_LOW } =
  NARRATIVE_EVENT_CONFIG;

/**
 * Narrative event definitions.
 *
 * Each event follows the EventEngine schema:
 * - type: dock | jump | time | condition | chain
 * - category: always 'narrative'
 * - trigger: { system, condition, chance }
 * - content: { text[], speaker, mood, choices[] }
 * - choices[].effects: { costs: {}, rewards: {} }
 */
export const NARRATIVE_EVENTS = [
  // === DOCK EVENTS ===

  {
    id: 'dock_sol_first',
    type: 'dock',
    category: 'narrative',
    trigger: { system: 0, condition: { type: 'first_visit' }, chance: 1.0 },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        'Sol Station. The heart of human civilization.',
        'Massive. Gleaming. Expensive.',
        'You feel very small, and very poor.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        { text: 'Time to get to work.', next: null, effects: { costs: {}, rewards: {} } },
      ],
    },
  },

  {
    id: 'dock_barnards_first',
    type: 'dock',
    category: 'narrative',
    trigger: { system: 4, condition: { type: 'first_visit' }, chance: 1.0 },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        'The docking clamps engage with a shudder.',
        "Barnard's Station is smaller than you expected — a retrofitted mining platform.",
        "A dock worker waves you toward Bay 3. Her jumpsuit says 'CHEN' in faded stencil.",
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: 'Wave back and head to the trading post.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
        {
          text: 'Stop to introduce yourself.',
          next: null,
          effects: { costs: {}, rewards: { karma: 1 } },
        },
        {
          text: 'Ignore her and check your cargo manifest.',
          next: null,
          effects: { costs: {}, rewards: { karma: -1 } },
        },
      ],
    },
  },

  {
    id: 'dock_generic_rumor',
    type: 'dock',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 0.15 },
    once: false,
    cooldown: 3,
    priority: NARRATIVE_PRIORITY_LOW,
    content: {
      text: [
        'A dockworker sidles up while you wait for clearance.',
        '"Heard prices on electronics are spiking out near Epsilon Eridani. Just saying."',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        { text: '"Thanks for the tip."', next: null, effects: { costs: {}, rewards: {} } },
        {
          text: '"Mind your own business."',
          next: null,
          effects: { costs: {}, rewards: { karma: -1 } },
        },
      ],
    },
  },

  {
    id: 'dock_cheap_fuel',
    type: 'dock',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'fuel_below', value: 20 },
      chance: 0.5,
    },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'A mechanic notices your fuel gauge as you dock.',
        '"Running on fumes, huh? I got some fuel canisters that fell off a transport. Half price."',
      ],
      speaker: null,
      mood: 'tense',
      choices: [
        {
          text: '"Deal."',
          next: null,
          effects: { costs: { credits: 50 }, rewards: {} },
        },
        {
          text: '"No thanks, I like living dangerously."',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  // === JUMP EVENTS ===

  {
    id: 'jump_salvage',
    type: 'jump',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 0.05 },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'Your sensors ping. Debris field ahead.',
        'Looks like a cargo container. Intact, maybe.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: 'Investigate the wreckage.',
          next: 'jump_salvage_result',
          effects: { costs: { fuel: 2 }, rewards: {} },
        },
        {
          text: 'Keep moving.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'jump_salvage_result',
    type: 'chain',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 1.0 },
    once: false,
    cooldown: 0,
    priority: 0,
    content: {
      text: [
        'You crack the seal. Inside: a crate of spare parts.',
        'Salvage rights. Finders keepers.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: 'Load it up.',
          next: null,
          effects: {
            costs: {},
            rewards: { cargo: [{ type: 'parts', qty: 3, buyPrice: 0 }] },
          },
        },
      ],
    },
  },

  {
    id: 'jump_quiet_moment',
    type: 'jump',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 0.08 },
    once: false,
    cooldown: 3,
    priority: NARRATIVE_PRIORITY_LOW,
    content: {
      text: [
        'The wormhole transit is smooth. Unusually smooth.',
        'For a moment, the stars outside look almost peaceful.',
        'You wonder how many other freighter captains are out here right now, alone with their thoughts.',
      ],
      speaker: null,
      mood: 'calm',
      choices: [
        {
          text: 'Enjoy the silence.',
          next: null,
          effects: { costs: {}, rewards: { karma: 1 } },
        },
        {
          text: 'Back to work.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'jump_strange_signal',
    type: 'jump',
    category: 'narrative',
    trigger: { system: null, condition: null, chance: 0.04 },
    once: false,
    cooldown: 7,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'Your comms array picks up a signal. Old. Looping.',
        'It sounds like a distress beacon, but the encryption is centuries out of date.',
        'Whatever sent it is long gone.',
      ],
      speaker: null,
      mood: 'mysterious',
      choices: [
        {
          text: 'Log the coordinates and move on.',
          next: null,
          effects: { costs: {}, rewards: { karma: 1 } },
        },
        {
          text: 'Ignore it. Not your problem.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  // === TIME EVENTS ===

  {
    id: 'time_debt_warning',
    type: 'time',
    category: 'narrative',
    trigger: {
      system: null,
      condition: [
        { type: 'days_past', value: 30 },
        { type: 'debt_above', value: 8000 },
      ],
      chance: 1.0,
    },
    once: false,
    cooldown: 10,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        'A message from Marcus Cole.',
        '"Grace period\'s over. Interest starts accruing. Don\'t make me come looking for you."',
      ],
      speaker: 'Marcus Cole',
      mood: 'threatening',
      choices: [
        {
          text: 'Delete message.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'time_news_broadcast',
    type: 'time',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'days_past', value: 15 },
      chance: 0.2,
    },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_LOW,
    content: {
      text: [
        'The newsfeed crackles to life.',
        '"...trade disputes continue between the inner and outer colonies. Commodity prices remain volatile..."',
        'Same old story.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: 'Keep listening.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
        {
          text: 'Switch it off.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  // === CONDITION EVENTS ===

  {
    id: 'cond_low_fuel',
    type: 'condition',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'fuel_below', value: 10 },
      chance: 1.0,
    },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'The fuel warning light blinks insistently.',
        'You tap it. It keeps blinking.',
        "You're running on fumes.",
      ],
      speaker: null,
      mood: 'tense',
      choices: [
        {
          text: 'Better find a station soon.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'cond_hull_damage',
    type: 'condition',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'hull_below', value: 30 },
      chance: 1.0,
    },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'A deep groan reverberates through the hull.',
        'The patch job from last time is holding, but barely.',
        "One more hard knock and you'll be breathing vacuum.",
      ],
      speaker: null,
      mood: 'tense',
      choices: [
        {
          text: 'Note to self: find a repair dock.',
          next: null,
          effects: { costs: {}, rewards: {} },
        },
      ],
    },
  },

  {
    id: 'cond_debt_free',
    type: 'condition',
    category: 'narrative',
    trigger: {
      system: null,
      condition: { type: 'debt_below', value: 1 },
      chance: 1.0,
    },
    once: true,
    cooldown: 0,
    priority: NARRATIVE_PRIORITY_HIGH,
    content: {
      text: [
        'You stare at the balance sheet. Read it again.',
        'Zero. You owe nothing.',
        'The weight lifts. For the first time since you bought this ship, you can breathe.',
      ],
      speaker: null,
      mood: 'triumphant',
      choices: [
        {
          text: "I'm free.",
          next: null,
          effects: { costs: {}, rewards: { karma: 2 } },
        },
      ],
    },
  },
];
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/narrative-event-data.test.js`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/game/data/narrative-events.js tests/unit/narrative-event-data.test.js
git commit -m "feat: add 13 narrative event definitions across all trigger types"
```

---

## Phase 2: State and Manager Integration

### Task 5: State Initialization and EventSystem Updates

**Files:**
- Modify: `src/game/state/managers/initialization.js:155-176` (add narrativeEvents to world state)
- Modify: `src/game/state/managers/event-system.js:17-43` (add docked subscriber)

**Step 1: Add narrativeEvents to world state initialization**

In `src/game/state/managers/initialization.js`, inside `initializeWorldState()`, add after the `dangerFlags` block (after line 175, before the closing `};`):

```javascript
      narrativeEvents: {
        fired: [],
        cooldowns: {},
        flags: {},
      },
```

**Step 2: Add docked event type to EventSystemManager**

In `src/game/state/managers/event-system.js`, add `docked: [],` to the subscribers object (after `missionsChanged: [],` at line 42).

**Step 3: Run full test suite**

Run: `npm test`
Expected: All PASS (no existing tests depend on exact world state shape)

**Step 4: Commit**

```bash
git add src/game/state/managers/initialization.js src/game/state/managers/event-system.js
git commit -m "feat: add narrativeEvents to world state and docked event type"
```

---

### Task 6: Register EventEngineManager in GameStateManager

**Files:**
- Modify: `src/game/state/game-state-manager.js`

**Step 1: Add import**

At the top of `game-state-manager.js`, add with the other manager imports:

```javascript
import { EventEngineManager } from './managers/event-engine.js';
```

**Step 2: Instantiate in constructor**

After `this.missionManager = new MissionManager(this);` (line 94), add:

```javascript
    this.eventEngineManager = new EventEngineManager(this);
```

**Step 3: Add delegation methods**

Add delegation methods after the existing danger delegation block (around line 770):

```javascript
  // EventEngine delegation

  registerEvent(event) {
    return this.eventEngineManager.registerEvent(event);
  }

  registerEvents(events) {
    return this.eventEngineManager.registerEvents(events);
  }

  checkEvents(eventType, context, rng) {
    return this.eventEngineManager.checkEvents(eventType, context, rng);
  }

  getEventById(id) {
    return this.eventEngineManager.getEventById(id);
  }

  markEventFired(eventId) {
    return this.eventEngineManager.markFired(eventId);
  }

  setEventCooldown(eventId, cooldownDays) {
    return this.eventEngineManager.setCooldown(eventId, cooldownDays);
  }

  setNarrativeFlag(flagName) {
    return this.eventEngineManager.setFlag(flagName);
  }
```

**Step 4: Register narrative events in initNewGame**

In `initNewGame()`, after `this.state = completeState;` (line 154), add:

```javascript
    // Register narrative events
    const { NARRATIVE_EVENTS } = await import('../data/narrative-events.js');
    this.eventEngineManager.registerEvents(NARRATIVE_EVENTS);
```

**Important:** If dynamic import causes issues, switch to a static import at the top of the file instead:

```javascript
import { NARRATIVE_EVENTS } from '../data/narrative-events.js';
```

And in `initNewGame()`:

```javascript
    this.eventEngineManager.registerEvents(NARRATIVE_EVENTS);
```

Also add the same registration in `loadGame()` so events are available after loading a save.

**Step 5: Run full test suite**

Run: `npm test`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/game/state/game-state-manager.js
git commit -m "feat: register EventEngineManager in GameStateManager with delegations"
```

---

## Phase 3: Danger Migration

### Task 7: Register Danger Encounters as EventEngine Events

**Files:**
- Create: `src/game/data/danger-events.js`
- Create: `tests/unit/danger-events.test.js`

**Step 1: Write test for danger event registrations**

Create `tests/unit/danger-events.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { DANGER_EVENTS } from '../../src/game/data/danger-events.js';

describe('Danger Event Data', () => {
  it('should export four danger events', () => {
    expect(DANGER_EVENTS).toHaveLength(4);
  });

  it('should all have category danger', () => {
    DANGER_EVENTS.forEach((e) => {
      expect(e.category).toBe('danger');
    });
  });

  it('should all be jump type', () => {
    DANGER_EVENTS.forEach((e) => {
      expect(e.type).toBe('jump');
    });
  });

  it('should have descending priorities: pirate > inspection > mechanical > distress', () => {
    const pirate = DANGER_EVENTS.find((e) => e.encounter.generator === 'pirate');
    const inspection = DANGER_EVENTS.find((e) => e.encounter.generator === 'inspection');
    const mechanical = DANGER_EVENTS.find((e) => e.encounter.generator === 'mechanical_failure');
    const distress = DANGER_EVENTS.find((e) => e.encounter.generator === 'distress_call');

    expect(pirate.priority).toBeGreaterThan(inspection.priority);
    expect(inspection.priority).toBeGreaterThan(mechanical.priority);
    expect(mechanical.priority).toBeGreaterThan(distress.priority);
  });

  it('should all have encounter.generator defined', () => {
    DANGER_EVENTS.forEach((e) => {
      expect(e.encounter).toBeTruthy();
      expect(e.encounter.generator).toBeTruthy();
    });
  });

  it('should use string chance keys for dynamic calculation', () => {
    const pirate = DANGER_EVENTS.find((e) => e.encounter.generator === 'pirate');
    const inspection = DANGER_EVENTS.find((e) => e.encounter.generator === 'inspection');
    expect(typeof pirate.trigger.chance).toBe('string');
    expect(typeof inspection.trigger.chance).toBe('string');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/danger-events.test.js`
Expected: FAIL — module not found

**Step 3: Create danger event registrations**

Create `src/game/data/danger-events.js`:

```javascript
import { NARRATIVE_EVENT_CONFIG } from '../constants.js';

const {
  DANGER_PRIORITY_PIRATE,
  DANGER_PRIORITY_INSPECTION,
  DANGER_PRIORITY_MECHANICAL,
  DANGER_PRIORITY_DISTRESS,
} = NARRATIVE_EVENT_CONFIG;

/**
 * Danger encounter event definitions for the EventEngine.
 *
 * These wrap existing DangerManager encounters in the event schema.
 * Resolution logic stays in DangerManager — the engine only handles
 * trigger eligibility and priority.
 *
 * Pirate and inspection events use string chance keys (e.g., 'pirate_chance')
 * which the trigger hook resolves dynamically via DangerManager probability methods.
 *
 * Mechanical failure and distress call use string chance keys too, resolved
 * in the hook from DangerManager's check methods.
 */
export const DANGER_EVENTS = [
  {
    id: 'danger_pirate',
    type: 'jump',
    category: 'danger',
    trigger: { system: null, condition: null, chance: 'pirate_chance' },
    once: false,
    cooldown: 0,
    priority: DANGER_PRIORITY_PIRATE,
    encounter: { generator: 'pirate' },
  },
  {
    id: 'danger_inspection',
    type: 'jump',
    category: 'danger',
    trigger: { system: null, condition: null, chance: 'inspection_chance' },
    once: false,
    cooldown: 0,
    priority: DANGER_PRIORITY_INSPECTION,
    encounter: { generator: 'inspection' },
  },
  {
    id: 'danger_mechanical',
    type: 'jump',
    category: 'danger',
    trigger: { system: null, condition: null, chance: 'mechanical_chance' },
    once: false,
    cooldown: 0,
    priority: DANGER_PRIORITY_MECHANICAL,
    encounter: { generator: 'mechanical_failure' },
  },
  {
    id: 'danger_distress',
    type: 'jump',
    category: 'danger',
    trigger: { system: null, condition: null, chance: 'distress_chance' },
    once: false,
    cooldown: 0,
    priority: DANGER_PRIORITY_DISTRESS,
    encounter: { generator: 'distress_call' },
  },
];
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/danger-events.test.js`
Expected: All PASS

**Step 5: Register danger events in GameStateManager**

In `game-state-manager.js`, where narrative events are registered (added in Task 6), also register danger events:

```javascript
import { DANGER_EVENTS } from '../data/danger-events.js';
```

And in `initNewGame()` and `loadGame()`:

```javascript
    this.eventEngineManager.registerEvents(DANGER_EVENTS);
```

**Step 6: Run full test suite**

Run: `npm test`
Expected: All PASS

**Step 7: Commit**

```bash
git add src/game/data/danger-events.js tests/unit/danger-events.test.js src/game/state/game-state-manager.js
git commit -m "feat: register danger encounters as EventEngine events"
```

---

### Task 8: Create useEventTriggers Hook

This replaces `useJumpEncounters`. It queries the EventEngine for all trigger types.

**Files:**
- Create: `src/hooks/useEventTriggers.js`

**Step 1: Create the hook**

Create `src/hooks/useEventTriggers.js`:

```javascript
import { useEffect, useCallback } from 'react';
import { useGameState } from '../context/GameContext.jsx';
import { useGameEvent } from './useGameEvent.js';

/**
 * Unified event trigger hook.
 *
 * Replaces useJumpEncounters. Listens for locationChanged (jump),
 * docked, and timeChanged events, then queries the EventEngine
 * for eligible events. If an event is found, emits encounterTriggered.
 *
 * For jump events, computes dynamic danger probabilities from
 * DangerManager before querying the engine.
 */
export function useEventTriggers() {
  const gameStateManager = useGameState();
  const currentSystem = useGameEvent('locationChanged');

  /**
   * Build context with dynamic danger chances for jump events.
   */
  const buildJumpContext = useCallback(
    (systemId, gameState) => {
      const dm = gameStateManager.dangerManager;

      // Compute dynamic chances from DangerManager methods
      const pirateChance = dm.calculatePirateEncounterChance(systemId, gameState);
      const inspectionChance = dm.calculateInspectionChance(systemId, gameState);

      // Mechanical failure and distress call need RNG-based checks.
      // We pre-roll and convert to a 0/1 chance for the engine.
      const mechanicalRng = Math.random();
      const mechanicalResult = dm.checkMechanicalFailure(gameState, mechanicalRng);
      const distressRng = Math.random();
      const distressResult = dm.checkDistressCall(distressRng);

      return {
        system: systemId,
        chances: {
          pirate_chance: pirateChance,
          inspection_chance: inspectionChance,
          // If DangerManager says yes, set chance to 1 so engine passes it through
          mechanical_chance: mechanicalResult ? 1.0 : 0,
          distress_chance: distressResult ? 1.0 : 0,
        },
        // Stash results for encounter generation
        _mechanicalResult: mechanicalResult,
        _distressResult: distressResult,
      };
    },
    [gameStateManager]
  );

  /**
   * Generate encounter data for danger events, matching the structure
   * that existing danger panels expect.
   */
  const generateDangerEncounterData = useCallback(
    (event, context, gameState) => {
      const systemId = context.system;

      switch (event.encounter.generator) {
        case 'pirate':
          return {
            type: 'pirate',
            category: 'danger',
            encounter: {
              id: `pirate_jump_${Date.now()}`,
              type: 'pirate',
              systemId,
              threatLevel: determineThreatLevel(gameState),
              demandPercent: 20,
            },
          };
        case 'inspection':
          return {
            type: 'inspection',
            category: 'danger',
            encounter: {
              id: `inspection_jump_${Date.now()}`,
              type: 'inspection',
              systemId,
              severity: determineInspectionSeverity(gameState),
            },
          };
        case 'mechanical_failure': {
          const failure = context._mechanicalResult;
          return {
            type: 'mechanical_failure',
            category: 'danger',
            encounter: {
              id: `failure_jump_${Date.now()}`,
              type: failure.type,
              systemId,
              severity: failure.severity,
            },
          };
        }
        case 'distress_call':
          return {
            type: 'distress_call',
            category: 'danger',
            encounter: context._distressResult,
          };
        default:
          return null;
      }
    },
    []
  );

  /**
   * Handle a trigger event: query engine, emit if event found.
   */
  const handleTrigger = useCallback(
    (eventType, context) => {
      if (!gameStateManager) return;

      const rng = Math.random();
      const event = gameStateManager.checkEvents(eventType, context, rng);

      if (!event) {
        // Also check condition events as fallback
        if (eventType !== 'condition') {
          const condRng = Math.random();
          const condEvent = gameStateManager.checkEvents('condition', context, condRng);
          if (condEvent) {
            emitNarrativeEvent(condEvent);
          }
        }
        return;
      }

      if (event.category === 'danger') {
        const gameState = gameStateManager.getState();
        const encounterData = generateDangerEncounterData(event, context, gameState);
        if (encounterData) {
          gameStateManager.emit('encounterTriggered', encounterData);
        }
      } else if (event.category === 'narrative') {
        emitNarrativeEvent(event);
      }
    },
    [gameStateManager, generateDangerEncounterData]
  );

  /**
   * Emit a narrative event for display.
   */
  const emitNarrativeEvent = useCallback(
    (event) => {
      gameStateManager.emit('encounterTriggered', {
        type: 'narrative',
        category: 'narrative',
        event,
      });
    },
    [gameStateManager]
  );

  // Listen for jump completion (locationChanged)
  useEffect(() => {
    if (!gameStateManager) return;

    const handleJumpComplete = (data) => {
      const gameState = gameStateManager.getState();
      if (!gameState) return;

      const systemId = typeof data === 'number' ? data : currentSystem;
      if (!systemId && systemId !== 0) return;

      const context = buildJumpContext(systemId, gameState);
      handleTrigger('jump', context);
    };

    gameStateManager.subscribe('locationChanged', handleJumpComplete);
    return () => gameStateManager.unsubscribe('locationChanged', handleJumpComplete);
  }, [gameStateManager, buildJumpContext, handleTrigger, currentSystem]);

  // Listen for docking
  useEffect(() => {
    if (!gameStateManager) return;

    const handleDocked = (data) => {
      const systemId = data?.systemId;
      if (systemId == null) return;
      handleTrigger('dock', { system: systemId });
    };

    gameStateManager.subscribe('docked', handleDocked);
    return () => gameStateManager.unsubscribe('docked', handleDocked);
  }, [gameStateManager, handleTrigger]);

  // Listen for time changes
  useEffect(() => {
    if (!gameStateManager) return;

    const handleTimeChanged = () => {
      const gameState = gameStateManager.getState();
      if (!gameState) return;
      handleTrigger('time', { system: gameState.player.currentSystem });
    };

    gameStateManager.subscribe('timeChanged', handleTimeChanged);
    return () => gameStateManager.unsubscribe('timeChanged', handleTimeChanged);
  }, [gameStateManager, handleTrigger]);
}

/**
 * Determine pirate threat level based on game state.
 * (Moved from useJumpEncounters — identical logic)
 */
function determineThreatLevel(gameState) {
  const cargoValue = gameState.ship.cargo.reduce(
    (total, item) => total + item.qty * item.buyPrice,
    0
  );
  const hullCondition = gameState.ship.hull;
  const outlawRep = gameState.player.factions.outlaws;

  if (cargoValue > 10000) return 'dangerous';
  if (cargoValue > 5000) return 'strong';
  if (hullCondition < 30) return 'strong';
  if (hullCondition < 60) return 'moderate';
  if (outlawRep > 50) return 'strong';
  if (outlawRep < -50) return 'weak';
  return 'moderate';
}

/**
 * Determine inspection severity based on game state.
 * (Moved from useJumpEncounters — identical logic)
 */
function determineInspectionSeverity(gameState) {
  const hasRestrictedGoods = gameState.ship.cargo.length > 0;
  const hasHiddenCargo =
    gameState.ship.hiddenCargo && gameState.ship.hiddenCargo.length > 0;
  const authorityRep = gameState.player.factions.authorities;

  if (hasRestrictedGoods && hasHiddenCargo) return 'thorough';
  if (authorityRep < -25) return 'thorough';
  return 'routine';
}
```

**Step 2: Run full test suite**

Run: `npm test`
Expected: All PASS

**Step 3: Commit**

```bash
git add src/hooks/useEventTriggers.js
git commit -m "feat: add useEventTriggers hook replacing useJumpEncounters"
```

---

## Phase 4: Narrative Event UI

### Task 9: NarrativeEventPanel Component

**Files:**
- Create: `src/features/narrative/NarrativeEventPanel.jsx`
- Create: `css/panel/narrative-event.css`

**Step 1: Create the CSS**

Create `css/panel/narrative-event.css`:

```css
@import '../variables.css';

#narrative-event-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: var(--panel-width-large);
  max-height: var(--panel-max-height);
  padding: var(--panel-padding);
  background-color: var(--bg-panel);
  border: var(--panel-border-width) solid var(--color-secondary);
  border-radius: var(--panel-border-radius);
  color: var(--color-white);
  font-size: var(--font-size-large);
  display: none;
  z-index: var(--z-modal);
  overflow-y: auto;
}

#narrative-event-panel.visible {
  display: block;
}

#narrative-event-panel .event-text {
  margin-bottom: var(--section-gap);
}

#narrative-event-panel .event-text p {
  margin-bottom: var(--element-gap);
  line-height: 1.6;
}

#narrative-event-panel .event-speaker {
  color: var(--color-secondary);
  font-weight: bold;
  margin-bottom: var(--element-gap);
  text-shadow: var(--shadow-glow-secondary);
}

#narrative-event-panel .event-choices {
  display: flex;
  flex-direction: column;
  gap: var(--element-gap);
  margin-top: var(--section-gap);
}

#narrative-event-panel .event-choice-btn {
  background-color: var(--bg-button);
  border: 1px solid var(--color-secondary);
  border-radius: var(--panel-border-radius);
  color: var(--color-white);
  padding: var(--button-padding);
  font-size: var(--font-size-large);
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s, border-color 0.2s;
}

#narrative-event-panel .event-choice-btn:hover {
  background-color: var(--bg-button-hover);
  border-color: var(--color-primary);
}
```

**Step 2: Create the component**

Create `src/features/narrative/NarrativeEventPanel.jsx`:

```javascript
import { useState, useCallback } from 'react';
import { useGameState } from '../../context/GameContext.jsx';
import { applyEncounterOutcome } from '../danger/applyEncounterOutcome.js';
import '../../css/panel/narrative-event.css';

/**
 * NarrativeEventPanel — displays narrative events with text and choices.
 *
 * Handles event chains: when a choice has `next`, fetches the chained
 * event and re-renders without leaving the panel.
 *
 * @param {Object} props
 * @param {Object} props.event - Narrative event object from EventEngine
 * @param {Function} props.onClose - Called when event is dismissed
 */
export function NarrativeEventPanel({ event, onClose }) {
  const gameStateManager = useGameState();
  const [currentEvent, setCurrentEvent] = useState(event);

  const handleChoice = useCallback(
    (choice) => {
      // Apply effects if any
      if (choice.effects) {
        const hasEffects =
          (choice.effects.costs && Object.keys(choice.effects.costs).length > 0) ||
          (choice.effects.rewards && Object.keys(choice.effects.rewards).length > 0);

        if (hasEffects) {
          applyEncounterOutcome(gameStateManager, choice.effects);
        }
      }

      // Apply flags from choice if specified
      if (choice.flags) {
        choice.flags.forEach((flag) => gameStateManager.setNarrativeFlag(flag));
      }

      // Mark event as fired and set cooldown
      gameStateManager.markEventFired(currentEvent.id);
      if (currentEvent.cooldown) {
        gameStateManager.setEventCooldown(currentEvent.id, currentEvent.cooldown);
      }

      // Chain to next event if specified
      if (choice.next) {
        const nextEvent = gameStateManager.getEventById(choice.next);
        if (nextEvent) {
          setCurrentEvent(nextEvent);
          return;
        }
      }

      // No chain — close the panel
      onClose();
    },
    [gameStateManager, currentEvent, onClose]
  );

  const { content } = currentEvent;

  return (
    <div id="narrative-event-panel" className="visible">
      {content.speaker && (
        <div className="event-speaker">{content.speaker}</div>
      )}
      <div className="event-text">
        {content.text.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
      <div className="event-choices">
        {content.choices.map((choice, i) => (
          <button
            key={i}
            className="event-choice-btn"
            onClick={() => handleChoice(choice)}
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 4: Commit**

```bash
git add src/features/narrative/NarrativeEventPanel.jsx css/panel/narrative-event.css
git commit -m "feat: add NarrativeEventPanel component and CSS"
```

---

### Task 10: App.jsx Integration

**Files:**
- Modify: `src/App.jsx`

**Step 1: Replace useJumpEncounters with useEventTriggers**

In `src/App.jsx`:

1. Change the import (line 22):
   - Remove: `import { useJumpEncounters } from './hooks/useJumpEncounters';`
   - Add: `import { useEventTriggers } from './hooks/useEventTriggers';`

2. Add NarrativeEventPanel import (after line 17):
   ```javascript
   import { NarrativeEventPanel } from './features/narrative/NarrativeEventPanel';
   ```

3. Replace the hook call (line 57):
   - Remove: `useJumpEncounters();`
   - Add: `useEventTriggers();`

**Step 2: Add narrative event routing in encounter rendering**

In the encounter panel rendering block (around lines 361-411), add narrative event handling. After the distress call block (line 410) and before the closing `</>`:

```javascript
                    {currentEncounter.type === 'narrative' && (
                      <NarrativeEventPanel
                        event={currentEncounter.event}
                        onClose={handleOutcomeContinue}
                      />
                    )}
```

**Step 3: Run the dev server and verify**

Run: `npm run dev`

Manual checks:
- Start a new game
- Jump between systems — danger encounters should still work
- Dock at stations — dock narrative events should fire (first visits)
- Verify existing danger panels (pirate, inspection, etc.) still display correctly
- Verify narrative events display and choices work

**Step 4: Run full test suite**

Run: `npm test`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: integrate narrative events into App.jsx, replace useJumpEncounters"
```

---

### Task 11: Remove Old useJumpEncounters Hook

Now that `useEventTriggers` handles everything, the old hook is dead code.

**Files:**
- Delete: `src/hooks/useJumpEncounters.js`

**Step 1: Verify no other imports of useJumpEncounters exist**

Search the codebase for any remaining imports of `useJumpEncounters`. Should find none after Task 10.

**Step 2: Delete the file**

Remove `src/hooks/useJumpEncounters.js`.

**Step 3: Run full test suite**

Run: `npm test`
Expected: All PASS

**Step 4: Commit**

```bash
git rm src/hooks/useJumpEncounters.js
git commit -m "refactor: remove replaced useJumpEncounters hook"
```

---

### Task 12: Final Integration Test and UAT

**Step 1: Run full test suite**

Run: `npm test`
Expected: All PASS

**Step 2: Run lint and format**

Run: `npm run clean`
Expected: Clean output

**Step 3: Manual UAT Checklist**

Start the dev server (`npm run dev`) and verify:

- [ ] New game starts without errors
- [ ] Jump to a system — danger encounters can trigger (pirates, inspection, etc.)
- [ ] All danger panels display correctly (pirate, combat, negotiation, inspection, mechanical, distress)
- [ ] Dock at Sol — first visit narrative event fires
- [ ] Dock at Barnard's Star — first visit narrative event fires
- [ ] Dock at same station again — first visit event does NOT fire again (once-only works)
- [ ] Random dock events fire occasionally (trade rumors, cheap fuel)
- [ ] Jump without danger encounter — narrative jump events can fire (salvage, quiet moment)
- [ ] Salvage event chain works (investigate → salvage result → load cargo)
- [ ] Time events fire as days pass (debt warning, news broadcast)
- [ ] Condition events fire when thresholds met (low fuel, hull damage)
- [ ] Effects apply correctly (credits, fuel, karma changes visible in HUD)
- [ ] Existing save games load without errors

**Step 4: Commit any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during UAT"
```

---

## Summary

| Phase | Tasks | What It Delivers |
|-------|-------|-----------------|
| 1 | Tasks 1-4 | Core engine (constants, conditions, EventEngineManager, event data) — fully tested, no UI |
| 2 | Tasks 5-6 | State initialization and GameStateManager wiring |
| 3 | Tasks 7-8 | Danger migration and unified trigger hook |
| 4 | Tasks 9-12 | Narrative event UI, App.jsx integration, cleanup, UAT |

Total: 12 tasks, ~13 new files, ~4 modified files.
