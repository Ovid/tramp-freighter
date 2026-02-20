# Passenger Mission System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add passenger missions to the mission system — passengers board at one station, have satisfaction tracked during transit, and pay based on satisfaction at delivery.

**Architecture:** Extend `MissionManager` with passenger satisfaction tracking and payment calculation. Extend `mission-generator.js` with passenger mission generation. Add 3 new condition types to `event-conditions.js` and 3 passenger narrative events. Extend `MissionBoardPanel` and `MissionCompleteNotifier` to render passenger-specific content.

**Tech Stack:** React 18, Vitest, existing Bridge Pattern (useGameEvent/useGameAction)

---

### Task 1: Passenger Constants

**Files:**
- Modify: `src/game/constants.js:493` (after MISSION_CONFIG)
- Test: `tests/unit/passenger-constants.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { PASSENGER_CONFIG } from '../../src/game/constants.js';

describe('Passenger Constants', () => {
  it('should define all five passenger types', () => {
    const types = Object.keys(PASSENGER_CONFIG.TYPES);
    expect(types).toEqual(['refugee', 'business', 'wealthy', 'scientist', 'family']);
  });

  it('should have satisfaction weights that sum to 1.0 for each type', () => {
    for (const [typeName, config] of Object.entries(PASSENGER_CONFIG.TYPES)) {
      const weights = config.satisfactionWeights;
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });

  it('should have cargoSpace between 1 and 3 for each type', () => {
    for (const config of Object.values(PASSENGER_CONFIG.TYPES)) {
      expect(config.cargoSpace).toBeGreaterThanOrEqual(1);
      expect(config.cargoSpace).toBeLessThanOrEqual(3);
    }
  });

  it('should define satisfaction thresholds', () => {
    expect(PASSENGER_CONFIG.SATISFACTION_THRESHOLDS).toBeDefined();
    const t = PASSENGER_CONFIG.SATISFACTION_THRESHOLDS;
    expect(t.VERY_SATISFIED).toBe(80);
    expect(t.SATISFIED).toBe(60);
    expect(t.NEUTRAL).toBe(40);
    expect(t.DISSATISFIED).toBe(20);
  });

  it('should define payment multipliers', () => {
    expect(PASSENGER_CONFIG.PAYMENT_MULTIPLIERS).toBeDefined();
    const m = PASSENGER_CONFIG.PAYMENT_MULTIPLIERS;
    expect(m.VERY_SATISFIED).toBe(1.3);
    expect(m.SATISFIED).toBe(1.15);
    expect(m.NEUTRAL).toBe(1.0);
    expect(m.DISSATISFIED).toBe(0.7);
    expect(m.VERY_DISSATISFIED).toBe(0.5);
    expect(m.ON_TIME_BONUS).toBe(0.1);
  });

  it('should define satisfaction impacts', () => {
    expect(PASSENGER_CONFIG.SATISFACTION_IMPACTS).toBeDefined();
    const i = PASSENGER_CONFIG.SATISFACTION_IMPACTS;
    expect(i.DELAY).toBe(10);
    expect(i.COMBAT).toBe(15);
    expect(i.LOW_LIFE_SUPPORT).toBe(5);
    expect(i.LIFE_SUPPORT_THRESHOLD).toBe(50);
  });

  it('should define initial satisfaction value', () => {
    expect(PASSENGER_CONFIG.INITIAL_SATISFACTION).toBe(50);
  });

  it('should have dialogue arrays with at least one entry per type', () => {
    for (const config of Object.values(PASSENGER_CONFIG.TYPES)) {
      expect(config.dialogue.length).toBeGreaterThanOrEqual(1);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/passenger-constants.test.js`
Expected: FAIL — `PASSENGER_CONFIG` is not exported

**Step 3: Write minimal implementation**

Add to `src/game/constants.js` after `MISSION_CONFIG` (after line 493):

```javascript
/**
 * Passenger Mission Configuration
 */
export const PASSENGER_CONFIG = {
  INITIAL_SATISFACTION: 50,

  TYPES: {
    refugee: {
      urgency: 'high',
      paymentTier: 'low',
      cargoSpace: 1,
      dialogue: [
        'Please, I need to get away from here.',
        'Thank you for helping me.',
      ],
      satisfactionWeights: { speed: 0.8, comfort: 0.2 },
    },
    business: {
      urgency: 'medium',
      paymentTier: 'medium',
      cargoSpace: 2,
      dialogue: ['Time is money.', 'I expect professional service.'],
      satisfactionWeights: { speed: 0.6, comfort: 0.4 },
    },
    wealthy: {
      urgency: 'low',
      paymentTier: 'high',
      cargoSpace: 3,
      dialogue: [
        'I trust the accommodations are adequate?',
        'Money is no object.',
      ],
      satisfactionWeights: { speed: 0.3, comfort: 0.7 },
    },
    scientist: {
      urgency: 'medium',
      paymentTier: 'medium',
      cargoSpace: 2,
      dialogue: ['Fascinating ship you have.', "I'm studying stellar phenomena."],
      satisfactionWeights: { speed: 0.5, comfort: 0.3, safety: 0.2 },
    },
    family: {
      urgency: 'low',
      paymentTier: 'low',
      cargoSpace: 3,
      dialogue: ['Are we there yet?', 'The children are excited.'],
      satisfactionWeights: { speed: 0.4, comfort: 0.4, safety: 0.2 },
    },
  },

  SATISFACTION_THRESHOLDS: {
    VERY_SATISFIED: 80,
    SATISFIED: 60,
    NEUTRAL: 40,
    DISSATISFIED: 20,
  },

  PAYMENT_MULTIPLIERS: {
    VERY_SATISFIED: 1.3,
    SATISFIED: 1.15,
    NEUTRAL: 1.0,
    DISSATISFIED: 0.7,
    VERY_DISSATISFIED: 0.5,
    ON_TIME_BONUS: 0.1,
  },

  SATISFACTION_IMPACTS: {
    DELAY: 10,
    COMBAT: 15,
    LOW_LIFE_SUPPORT: 5,
    LIFE_SUPPORT_THRESHOLD: 50,
  },

  PAYMENT_TIERS: {
    low: { min: 200, max: 500 },
    medium: { min: 500, max: 1000 },
    high: { min: 800, max: 1500 },
  },

  FIRST_NAMES: [
    'Ava', 'Ben', 'Clara', 'Dmitri', 'Elena', 'Felix', 'Grace', 'Hassan',
    'Iris', 'Jun', 'Kira', 'Leo', 'Maya', 'Niko', 'Petra', 'Quinn',
    'Rosa', 'Soren', 'Tara', 'Uri',
  ],

  LAST_NAMES: [
    'Chen', 'Okafor', 'Singh', 'Petrov', 'Tanaka', 'Garcia', 'Bauer',
    'Kim', 'Ali', 'Larsson', 'Costa', 'Nguyen', 'Frost', 'Amir', 'Volkov',
    'Reyes', 'Osei', 'Dubois', 'Holm', 'Sharma',
  ],
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/passenger-constants.test.js`
Expected: PASS (all 7 tests)

**Step 5: Commit**

```bash
git add src/game/constants.js tests/unit/passenger-constants.test.js
git commit -m "feat: add passenger configuration constants"
```

---

### Task 2: Passenger Mission Generation

**Files:**
- Modify: `src/game/mission-generator.js`
- Test: `tests/unit/passenger-generator.test.js`

**Context:** The existing `generateCargoRun()` in `src/game/mission-generator.js` shows the pattern. We need `generatePassengerMission()` that creates a mission with `type: 'passenger'`, a generated passenger name, type, cargo space requirement, and satisfaction tracking. The `generateMissionBoard()` function should mix passenger missions into the board.

**Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import {
  generatePassengerMission,
  generateMissionBoard,
} from '../../src/game/mission-generator.js';
import { PASSENGER_CONFIG } from '../../src/game/constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Passenger Mission Generation', () => {
  describe('generatePassengerMission', () => {
    it('should generate a valid passenger mission', () => {
      const mission = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA
      );

      expect(mission.id).toMatch(/^passenger_/);
      expect(mission.type).toBe('passenger');
      expect(mission.title).toContain('Passenger:');
      expect(mission.requirements.destination).toBeDefined();
      expect(mission.requirements.deadline).toBeGreaterThan(0);
      expect(mission.rewards.credits).toBeGreaterThan(0);
    });

    it('should include passenger data on the mission', () => {
      const mission = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA
      );

      expect(mission.passenger).toBeDefined();
      expect(mission.passenger.name).toBeTruthy();
      expect(Object.keys(PASSENGER_CONFIG.TYPES)).toContain(
        mission.passenger.type
      );
      expect(mission.passenger.satisfaction).toBe(
        PASSENGER_CONFIG.INITIAL_SATISFACTION
      );
      expect(mission.passenger.satisfactionWeights).toBeDefined();
      expect(mission.passenger.dialogue).toBeDefined();
    });

    it('should set cargoSpace requirement matching passenger type', () => {
      const mission = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA
      );

      const expectedSpace =
        PASSENGER_CONFIG.TYPES[mission.passenger.type].cargoSpace;
      expect(mission.requirements.cargoSpace).toBe(expectedSpace);
    });

    it('should generate destination that is a connected system', () => {
      const mission = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA
      );
      expect([1, 4, 7]).toContain(mission.requirements.destination);
    });

    it('should generate integer credit rewards', () => {
      for (let i = 0; i < 20; i++) {
        const mission = generatePassengerMission(
          0,
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA
        );
        expect(Number.isInteger(mission.rewards.credits)).toBe(true);
      }
    });

    it('should use seeded RNG when provided', () => {
      let callCount = 0;
      const seededRng = () => {
        callCount++;
        return 0.5;
      };

      const m1 = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        seededRng
      );
      const firstCallCount = callCount;
      callCount = 0;
      const m2 = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        seededRng
      );

      expect(m1.passenger.type).toBe(m2.passenger.type);
      expect(m1.requirements.destination).toBe(m2.requirements.destination);
      expect(firstCallCount).toBe(callCount);
    });
  });

  describe('generateMissionBoard with passengers', () => {
    it('should include passenger missions on the board', () => {
      const boards = [];
      for (let i = 0; i < 50; i++) {
        boards.push(
          generateMissionBoard(0, TEST_STAR_DATA, TEST_WORMHOLE_DATA)
        );
      }
      const hasPassenger = boards.some((board) =>
        board.some((m) => m.type === 'passenger')
      );
      expect(hasPassenger).toBe(true);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/passenger-generator.test.js`
Expected: FAIL — `generatePassengerMission` is not exported

**Step 3: Write minimal implementation**

Modify `src/game/mission-generator.js`. Add `PASSENGER_CONFIG` import and `generatePassengerMission` function. Modify `generateMissionBoard` to sometimes include passenger missions.

```javascript
import { BASE_PRICES, MISSION_CONFIG, NAVIGATION_CONFIG, PASSENGER_CONFIG } from './constants.js';

// ... existing getConnectedSystems, calculateDistance, generateCargoRun ...

function generatePersonName(rng = Math.random) {
  const first =
    PASSENGER_CONFIG.FIRST_NAMES[
      Math.floor(rng() * PASSENGER_CONFIG.FIRST_NAMES.length)
    ];
  const last =
    PASSENGER_CONFIG.LAST_NAMES[
      Math.floor(rng() * PASSENGER_CONFIG.LAST_NAMES.length)
    ];
  return `${first} ${last}`;
}

export function generatePassengerMission(
  fromSystem,
  starData,
  wormholeData,
  rng = Math.random
) {
  const connectedIds = getConnectedSystems(fromSystem, wormholeData);
  if (connectedIds.length === 0) return null;

  const toSystem = connectedIds[Math.floor(rng() * connectedIds.length)];
  const destStar = starData.find((s) => s.id === toSystem);
  const fromStar = starData.find((s) => s.id === fromSystem);

  const types = Object.keys(PASSENGER_CONFIG.TYPES);
  const typeName = types[Math.floor(rng() * types.length)];
  const typeConfig = PASSENGER_CONFIG.TYPES[typeName];

  const name = generatePersonName(rng);

  const distance =
    fromStar && destStar ? calculateDistance(fromStar, destStar) : 5;
  const deadline =
    Math.ceil(distance * 2) + MISSION_CONFIG.DEADLINE_BUFFER_DAYS;

  const tier = PASSENGER_CONFIG.PAYMENT_TIERS[typeConfig.paymentTier];
  const reward = Math.ceil(tier.min + rng() * (tier.max - tier.min));

  const dialogue =
    typeConfig.dialogue[Math.floor(rng() * typeConfig.dialogue.length)];

  return {
    id: `passenger_${Date.now()}_${Math.floor(rng() * 10000)}`,
    type: 'passenger',
    title: `Passenger: ${name}`,
    description: `Transport ${name} to ${destStar ? destStar.name : `System ${toSystem}`}.`,
    giver: 'passenger',
    giverSystem: fromSystem,
    requirements: {
      destination: toSystem,
      deadline,
      cargoSpace: typeConfig.cargoSpace,
    },
    rewards: { credits: reward, faction: { civilians: 5 } },
    penalties: { failure: { faction: { civilians: -3 } } },
    passenger: {
      name,
      type: typeName,
      satisfaction: PASSENGER_CONFIG.INITIAL_SATISFACTION,
      satisfactionWeights: { ...typeConfig.satisfactionWeights },
      dialogue,
    },
  };
}

// Replace existing generateMissionBoard:
export function generateMissionBoard(
  systemId,
  starData,
  wormholeData,
  rng = Math.random
) {
  const board = [];
  for (let i = 0; i < MISSION_CONFIG.BOARD_SIZE; i++) {
    // ~30% chance of passenger mission per slot
    if (rng() < 0.3) {
      const mission = generatePassengerMission(systemId, starData, wormholeData, rng);
      if (mission) {
        board.push(mission);
        continue;
      }
    }
    const mission = generateCargoRun(systemId, starData, wormholeData, rng);
    if (mission) board.push(mission);
  }
  return board;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/passenger-generator.test.js`
Expected: PASS

**Step 5: Run existing mission generator tests to ensure no regressions**

Run: `npm test -- tests/unit/mission-generator.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add src/game/mission-generator.js tests/unit/passenger-generator.test.js
git commit -m "feat: add passenger mission generation"
```

---

### Task 3: Passenger Satisfaction & Payment in MissionManager

**Files:**
- Modify: `src/game/state/managers/mission.js`
- Test: `tests/unit/passenger-satisfaction.test.js`

**Context:** `MissionManager` at `src/game/state/managers/mission.js` already has a `completeMission` method (line 41) that handles passenger type at line 123. We need to:
1. Add `updatePassengerSatisfaction(missionId, event)` method
2. Add `calculatePassengerPayment(mission)` helper
3. Modify `completeMission` to use satisfaction-based payment for passenger missions
4. Add `acceptMission` cargo space validation for passenger missions

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { PASSENGER_CONFIG } from '../../src/game/constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

function makePassengerMission(overrides = {}) {
  return {
    id: 'test_passenger_001',
    type: 'passenger',
    title: 'Passenger: Test Person',
    description: 'Transport Test Person.',
    giver: 'passenger',
    giverSystem: 0,
    requirements: {
      destination: 4,
      deadline: 10,
      cargoSpace: 2,
    },
    rewards: { credits: 800, faction: { civilians: 5 } },
    penalties: { failure: { faction: { civilians: -3 } } },
    passenger: {
      name: 'Test Person',
      type: 'scientist',
      satisfaction: 50,
      satisfactionWeights: { speed: 0.5, comfort: 0.3, safety: 0.2 },
      dialogue: 'Fascinating ship you have.',
    },
    ...overrides,
  };
}

describe('Passenger Satisfaction & Payment', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  describe('acceptMission cargo space check', () => {
    it('should reject passenger mission when insufficient cargo space', () => {
      const state = manager.getState();
      // Fill cargo to near capacity (default capacity is 50)
      state.ship.cargo = [{ good: 'grain', qty: 49, purchasePrice: 10 }];

      const mission = makePassengerMission({
        requirements: { destination: 4, deadline: 10, cargoSpace: 2 },
      });
      const result = manager.acceptMission(mission);

      expect(result.success).toBe(false);
      expect(result.reason).toContain('cargo space');
    });

    it('should accept passenger mission when enough cargo space', () => {
      const mission = makePassengerMission();
      const result = manager.acceptMission(mission);
      expect(result.success).toBe(true);
    });
  });

  describe('updatePassengerSatisfaction', () => {
    it('should reduce satisfaction on delay weighted by speed', () => {
      manager.acceptMission(makePassengerMission());
      const before = manager.getState().missions.active[0].passenger.satisfaction;

      manager.updatePassengerSatisfaction('test_passenger_001', 'delay');

      const after = manager.getState().missions.active[0].passenger.satisfaction;
      const expectedDrop = Math.round(
        PASSENGER_CONFIG.SATISFACTION_IMPACTS.DELAY * 0.5
      );
      expect(after).toBe(before - expectedDrop);
    });

    it('should reduce satisfaction on combat weighted by safety', () => {
      manager.acceptMission(makePassengerMission());
      const before = manager.getState().missions.active[0].passenger.satisfaction;

      manager.updatePassengerSatisfaction('test_passenger_001', 'combat');

      const after = manager.getState().missions.active[0].passenger.satisfaction;
      const expectedDrop = Math.round(
        PASSENGER_CONFIG.SATISFACTION_IMPACTS.COMBAT * 0.2
      );
      expect(after).toBe(before - expectedDrop);
    });

    it('should reduce satisfaction when life support is low', () => {
      const state = manager.getState();
      state.ship.lifeSupport = 30;

      manager.acceptMission(makePassengerMission());
      const before = state.missions.active[0].passenger.satisfaction;

      manager.updatePassengerSatisfaction(
        'test_passenger_001',
        'low_life_support'
      );

      const after = state.missions.active[0].passenger.satisfaction;
      const expectedDrop = Math.round(
        PASSENGER_CONFIG.SATISFACTION_IMPACTS.LOW_LIFE_SUPPORT * 0.3
      );
      expect(after).toBe(before - expectedDrop);
    });

    it('should clamp satisfaction to 0-100', () => {
      manager.acceptMission(makePassengerMission());
      const passenger = manager.getState().missions.active[0].passenger;
      passenger.satisfaction = 2;

      manager.updatePassengerSatisfaction('test_passenger_001', 'combat');

      expect(passenger.satisfaction).toBe(0);
    });

    it('should emit missionsChanged after updating satisfaction', () => {
      manager.acceptMission(makePassengerMission());
      let emitted = null;
      manager.subscribe('missionsChanged', (data) => {
        emitted = data;
      });

      manager.updatePassengerSatisfaction('test_passenger_001', 'delay');

      expect(emitted).not.toBeNull();
    });
  });

  describe('completeMission with passenger payment', () => {
    it('should apply very satisfied multiplier when satisfaction >= 80', () => {
      const mission = makePassengerMission();
      manager.acceptMission(mission);
      const state = manager.getState();
      state.player.currentSystem = 4;
      state.missions.active[0].passenger.satisfaction = 85;

      const creditsBefore = state.player.credits;
      manager.completeMission('test_passenger_001');

      const earned = state.player.credits - creditsBefore;
      // 800 * (1.3 + 0.1 on-time) = 800 * 1.4 = 1120
      expect(earned).toBe(Math.round(800 * 1.4));
    });

    it('should apply satisfied multiplier when satisfaction >= 60', () => {
      const mission = makePassengerMission();
      manager.acceptMission(mission);
      const state = manager.getState();
      state.player.currentSystem = 4;
      state.missions.active[0].passenger.satisfaction = 65;

      const creditsBefore = state.player.credits;
      manager.completeMission('test_passenger_001');

      const earned = state.player.credits - creditsBefore;
      expect(earned).toBe(Math.round(800 * 1.25));
    });

    it('should apply dissatisfied multiplier when satisfaction < 40', () => {
      const mission = makePassengerMission();
      manager.acceptMission(mission);
      const state = manager.getState();
      state.player.currentSystem = 4;
      state.missions.active[0].passenger.satisfaction = 25;

      const creditsBefore = state.player.credits;
      manager.completeMission('test_passenger_001');

      const earned = state.player.credits - creditsBefore;
      expect(earned).toBe(Math.round(800 * 0.8));
    });

    it('should not apply on-time bonus when past deadline', () => {
      const mission = makePassengerMission();
      manager.acceptMission(mission);
      const state = manager.getState();
      state.player.currentSystem = 4;
      state.player.daysElapsed = 20;
      state.missions.active[0].passenger.satisfaction = 85;

      const creditsBefore = state.player.credits;
      manager.completeMission('test_passenger_001');

      const earned = state.player.credits - creditsBefore;
      expect(earned).toBe(Math.round(800 * 1.3));
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/passenger-satisfaction.test.js`
Expected: FAIL — `updatePassengerSatisfaction` is not a function

**Step 3: Write minimal implementation**

Modify `src/game/state/managers/mission.js`:

1. Add `PASSENGER_CONFIG` to imports (line 2)
2. Add cargo space check in `acceptMission` (after line 26, before creating activeMission)
3. Modify `completeMission` passenger block (lines 123-130) to use satisfaction-based payment
4. Add `updatePassengerSatisfaction` method
5. Add `calculatePassengerPayment` private method

Key implementation notes:
- In `acceptMission`, check `mission.requirements.cargoSpace` against `this.gameStateManager.getCargoRemaining()`
- In `completeMission`, replace the simple `mission.rewards.credits` addition with `calculatePassengerPayment` result for passenger type
- `updatePassengerSatisfaction` finds the mission by ID, applies weighted impact, clamps 0-100, emits `missionsChanged`
- All satisfaction drops use `Math.round()` per project standards

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/passenger-satisfaction.test.js`
Expected: PASS

**Step 5: Run existing mission tests for regressions**

Run: `npm test -- tests/unit/mission-manager.test.js tests/unit/mission-completion.test.js tests/unit/mission-completable.test.js`
Expected: PASS

**Step 6: Add delegation methods to GameStateManager**

Modify `src/game/state/game-state-manager.js` — add after line ~823 (after `getActiveMissions`):

```javascript
  updatePassengerSatisfaction(missionId, event) {
    return this.missionManager.updatePassengerSatisfaction(missionId, event);
  }
```

Also add to `src/hooks/useGameAction.js` — add in the `useMemo` block (after line 258):

```javascript
      updatePassengerSatisfaction: (missionId, event) =>
        gameStateManager.updatePassengerSatisfaction(missionId, event),
```

**Step 7: Commit**

```bash
git add src/game/state/managers/mission.js src/game/state/game-state-manager.js src/hooks/useGameAction.js tests/unit/passenger-satisfaction.test.js
git commit -m "feat: add passenger satisfaction tracking and payment calculation"
```

---

### Task 4: Passenger Condition Evaluators

**Files:**
- Modify: `src/game/event-conditions.js`
- Modify: `src/game/constants.js` (CONDITION_TYPES)
- Test: `tests/unit/passenger-conditions.test.js`

**Context:** `event-conditions.js` has a `switch` statement on `condition.type` using `CONDITION_TYPES` enum from constants. We need 3 new condition types: `HAS_PASSENGER`, `HAS_WEALTHY_PASSENGER`, `HAS_FAMILY_PASSENGER`. Each checks `state.missions.active` for passenger missions matching the type.

**Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '../../src/game/event-conditions.js';
import { CONDITION_TYPES } from '../../src/game/constants.js';

function makeState(activeMissions = []) {
  return {
    missions: { active: activeMissions },
    player: { daysElapsed: 5, credits: 1000, debt: 0, karma: 0 },
    ship: { fuel: 100, hull: 100, cargo: [] },
    world: {
      visitedSystems: [],
      narrativeEvents: { fired: [], cooldowns: {}, flags: {}, dockedSystems: [] },
    },
  };
}

function makePassengerMission(passengerType) {
  return {
    id: `passenger_${passengerType}`,
    type: 'passenger',
    passenger: { type: passengerType, satisfaction: 50 },
  };
}

describe('Passenger Condition Evaluators', () => {
  it('should define HAS_PASSENGER condition type', () => {
    expect(CONDITION_TYPES.HAS_PASSENGER).toBe('has_passenger');
  });

  it('should define HAS_WEALTHY_PASSENGER condition type', () => {
    expect(CONDITION_TYPES.HAS_WEALTHY_PASSENGER).toBe('has_wealthy_passenger');
  });

  it('should define HAS_FAMILY_PASSENGER condition type', () => {
    expect(CONDITION_TYPES.HAS_FAMILY_PASSENGER).toBe('has_family_passenger');
  });

  describe('has_passenger', () => {
    it('should return true when any passenger mission is active', () => {
      const state = makeState([makePassengerMission('scientist')]);
      const result = evaluateCondition(
        { type: CONDITION_TYPES.HAS_PASSENGER },
        state
      );
      expect(result).toBe(true);
    });

    it('should return false when no passenger missions are active', () => {
      const state = makeState([{ id: 'cargo_1', type: 'delivery' }]);
      const result = evaluateCondition(
        { type: CONDITION_TYPES.HAS_PASSENGER },
        state
      );
      expect(result).toBe(false);
    });
  });

  describe('has_wealthy_passenger', () => {
    it('should return true when wealthy passenger is active', () => {
      const state = makeState([makePassengerMission('wealthy')]);
      const result = evaluateCondition(
        { type: CONDITION_TYPES.HAS_WEALTHY_PASSENGER },
        state
      );
      expect(result).toBe(true);
    });

    it('should return false for non-wealthy passengers', () => {
      const state = makeState([makePassengerMission('scientist')]);
      const result = evaluateCondition(
        { type: CONDITION_TYPES.HAS_WEALTHY_PASSENGER },
        state
      );
      expect(result).toBe(false);
    });
  });

  describe('has_family_passenger', () => {
    it('should return true when family passenger is active', () => {
      const state = makeState([makePassengerMission('family')]);
      const result = evaluateCondition(
        { type: CONDITION_TYPES.HAS_FAMILY_PASSENGER },
        state
      );
      expect(result).toBe(true);
    });

    it('should return false for non-family passengers', () => {
      const state = makeState([makePassengerMission('business')]);
      const result = evaluateCondition(
        { type: CONDITION_TYPES.HAS_FAMILY_PASSENGER },
        state
      );
      expect(result).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/passenger-conditions.test.js`
Expected: FAIL — `CONDITION_TYPES.HAS_PASSENGER` is undefined

**Step 3: Write minimal implementation**

Add to `src/game/constants.js` `CONDITION_TYPES` (after line 1323):

```javascript
  HAS_PASSENGER: 'has_passenger',
  HAS_WEALTHY_PASSENGER: 'has_wealthy_passenger',
  HAS_FAMILY_PASSENGER: 'has_family_passenger',
```

Add cases to `src/game/event-conditions.js` switch statement (before `default`):

```javascript
    case CONDITION_TYPES.HAS_PASSENGER:
      return gameState.missions.active.some((m) => m.type === 'passenger');

    case CONDITION_TYPES.HAS_WEALTHY_PASSENGER:
      return gameState.missions.active.some(
        (m) => m.type === 'passenger' && m.passenger?.type === 'wealthy'
      );

    case CONDITION_TYPES.HAS_FAMILY_PASSENGER:
      return gameState.missions.active.some(
        (m) => m.type === 'passenger' && m.passenger?.type === 'family'
      );
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/passenger-conditions.test.js`
Expected: PASS

**Step 5: Run existing event condition tests for regressions**

Run: `npm test -- --grep "condition"`
Expected: PASS

**Step 6: Commit**

```bash
git add src/game/constants.js src/game/event-conditions.js tests/unit/passenger-conditions.test.js
git commit -m "feat: add passenger condition evaluators for event engine"
```

---

### Task 5: Passenger Narrative Events

**Files:**
- Modify: `src/game/data/narrative-events.js`
- Test: `tests/unit/passenger-events.test.js`

**Context:** `narrative-events.js` exports a `NARRATIVE_EVENTS` array. Each event has `{ id, type, category, trigger, once, cooldown, priority, content }`. The `content` has `{ text[], speaker, mood, choices[] }` and each choice has `{ text, next, effects: { costs, rewards } }`. Passenger events need a new effect type for satisfaction — which the existing NarrativeEventPanel resolves via the EventEngineManager.

Instead of adding a new effect type, passenger satisfaction changes can use the existing `rewards`/`costs` pattern with a new key. The simpler approach: trigger satisfaction updates from the choice handler in the narrative panel. But to keep it consistent with the existing event engine, we'll add the events and handle the `passenger_satisfaction` effect in the narrative event resolution.

**Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { NARRATIVE_EVENTS } from '../../src/game/data/narrative-events.js';

describe('Passenger Narrative Events', () => {
  const passengerEvents = NARRATIVE_EVENTS.filter((e) =>
    e.id.startsWith('passenger_')
  );

  it('should define passenger comfort complaint event', () => {
    const event = NARRATIVE_EVENTS.find(
      (e) => e.id === 'passenger_complaint_comfort'
    );
    expect(event).toBeDefined();
    expect(event.type).toBe('jump');
    expect(event.category).toBe('narrative');
    expect(event.trigger.condition.type).toBe('has_passenger');
    expect(event.trigger.chance).toBe(0.15);
    expect(event.content.choices.length).toBeGreaterThanOrEqual(2);
  });

  it('should define wealthy passenger tip event', () => {
    const event = NARRATIVE_EVENTS.find(
      (e) => e.id === 'passenger_wealthy_tip'
    );
    expect(event).toBeDefined();
    expect(event.type).toBe('dock');
    expect(event.trigger.condition.type).toBe('has_wealthy_passenger');
    expect(event.content.choices.length).toBeGreaterThanOrEqual(2);
  });

  it('should define family children event', () => {
    const event = NARRATIVE_EVENTS.find(
      (e) => e.id === 'passenger_family_children'
    );
    expect(event).toBeDefined();
    expect(event.type).toBe('jump');
    expect(event.trigger.condition.type).toBe('has_family_passenger');
    expect(event.trigger.chance).toBe(0.2);
    expect(event.content.choices.length).toBeGreaterThanOrEqual(2);
  });

  it('should have valid structure for all passenger events', () => {
    expect(passengerEvents.length).toBe(3);
    for (const event of passengerEvents) {
      expect(event.category).toBe('narrative');
      expect(event.content.text.length).toBeGreaterThan(0);
      expect(event.content.choices.length).toBeGreaterThan(0);
      for (const choice of event.content.choices) {
        expect(choice.text).toBeTruthy();
        expect(choice.effects).toBeDefined();
      }
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/passenger-events.test.js`
Expected: FAIL — no events with `passenger_` prefix found

**Step 3: Write minimal implementation**

Add to the end of the `NARRATIVE_EVENTS` array in `src/game/data/narrative-events.js`:

```javascript
  // === PASSENGER EVENTS ===

  {
    id: 'passenger_complaint_comfort',
    type: 'jump',
    category: 'narrative',
    trigger: { condition: { type: 'has_passenger' }, chance: 0.15 },
    once: false,
    cooldown: 3,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'Your passenger complains about the cramped quarters.',
        "They're clearly uncomfortable.",
      ],
      speaker: null,
      mood: 'annoyed',
      choices: [
        {
          text: 'Apologize and offer refreshments.',
          next: null,
          effects: {
            costs: { credits: 20 },
            rewards: { passengerSatisfaction: 5 },
          },
        },
        {
          text: "It's a freighter, not a cruise ship.",
          next: null,
          effects: {
            costs: { passengerSatisfaction: 10 },
            rewards: {},
          },
        },
        {
          text: 'Ignore the complaint.',
          next: null,
          effects: {
            costs: { passengerSatisfaction: 5 },
            rewards: {},
          },
        },
      ],
    },
  },

  {
    id: 'passenger_wealthy_tip',
    type: 'dock',
    category: 'narrative',
    trigger: { condition: { type: 'has_wealthy_passenger' }, chance: 0.5 },
    once: false,
    cooldown: 5,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'Your wealthy passenger is impressed with your service.',
        'They offer a generous tip.',
      ],
      speaker: null,
      mood: 'pleased',
      choices: [
        {
          text: 'Accept graciously.',
          next: null,
          effects: { costs: {}, rewards: { credits: 500 } },
        },
        {
          text: 'Decline politely.',
          next: null,
          effects: {
            costs: {},
            rewards: { passengerSatisfaction: 10 },
          },
        },
      ],
    },
  },

  {
    id: 'passenger_family_children',
    type: 'jump',
    category: 'narrative',
    trigger: { condition: { type: 'has_family_passenger' }, chance: 0.2 },
    once: false,
    cooldown: 3,
    priority: NARRATIVE_PRIORITY_DEFAULT,
    content: {
      text: [
        'The children are getting restless.',
        'The parents look apologetic.',
      ],
      speaker: null,
      mood: 'neutral',
      choices: [
        {
          text: 'Show them the cockpit.',
          next: null,
          effects: { costs: {}, rewards: { passengerSatisfaction: 15 } },
        },
        {
          text: 'Give them some snacks.',
          next: null,
          effects: {
            costs: { credits: 10 },
            rewards: { passengerSatisfaction: 10 },
          },
        },
        {
          text: 'Ignore it.',
          next: null,
          effects: {
            costs: { passengerSatisfaction: 5 },
            rewards: {},
          },
        },
      ],
    },
  },
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/passenger-events.test.js`
Expected: PASS

**Step 5: Run existing narrative event tests for regressions**

Run: `npm test -- --grep "narrative"`
Expected: PASS

**Step 6: Commit**

```bash
git add src/game/data/narrative-events.js tests/unit/passenger-events.test.js
git commit -m "feat: add passenger narrative events (comfort, wealthy tip, family)"
```

---

### Task 6: Passenger Satisfaction Effect Resolution

**Files:**
- Modify: `src/features/narrative/NarrativeEventPanel.jsx` (or wherever choice effects are resolved)
- Test: `tests/unit/passenger-effect-resolution.test.js`

**Context:** When a narrative event choice includes `passengerSatisfaction` in its effects, we need to apply that to all active passenger missions. Look at how existing effects (credits, karma) are resolved in the narrative event choice handler to follow the same pattern.

**Step 1: Find and read the narrative event resolution code**

Read `src/features/narrative/NarrativeEventPanel.jsx` to find where `effects.rewards` and `effects.costs` are processed. The satisfaction effect handler needs to:
- Check `effects.rewards.passengerSatisfaction` — increase satisfaction
- Check `effects.costs.passengerSatisfaction` — decrease satisfaction
- Apply to all active passenger missions via `updatePassengerSatisfaction` or directly

**Step 2: Write the failing test**

Test that when a narrative choice with `passengerSatisfaction` reward is applied, the active passenger mission's satisfaction changes. This test should use the GameStateManager + EventEngineManager integration.

**Step 3: Implement the effect resolution**

Add `passengerSatisfaction` handling alongside existing `credits`/`karma` effect processing.

**Step 4: Run tests, verify pass, commit**

```bash
git add <modified-files> tests/unit/passenger-effect-resolution.test.js
git commit -m "feat: resolve passengerSatisfaction effects in narrative events"
```

---

### Task 7: MissionBoardPanel Passenger Rendering

**Files:**
- Modify: `src/features/missions/MissionBoardPanel.jsx`
- Test: `tests/unit/passenger-board-display.test.js`

**Context:** `MissionBoardPanel.jsx` currently renders all missions as cargo deliveries (shows `mission.requirements.quantity` and `mission.requirements.cargo`). Passenger missions need different rendering: passenger name, type, destination, cargo space required, dialogue quote, and payment.

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MissionBoardPanel } from '../../src/features/missions/MissionBoardPanel.jsx';

// Mock the hooks
vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: vi.fn(),
}));

vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: vi.fn(),
}));

import { useGameEvent } from '../../src/hooks/useGameEvent';
import { useGameAction } from '../../src/hooks/useGameAction';

const passengerMission = {
  id: 'passenger_001',
  type: 'passenger',
  title: 'Passenger: Dr. Chen',
  description: 'Transport Dr. Chen to Epsilon Eridani.',
  requirements: {
    destination: 13,
    deadline: 10,
    cargoSpace: 2,
  },
  rewards: { credits: 800 },
  passenger: {
    name: 'Dr. Chen',
    type: 'scientist',
    satisfaction: 50,
    dialogue: 'Fascinating ship you have.',
  },
};

const cargoMission = {
  id: 'cargo_001',
  type: 'delivery',
  title: 'Cargo Run: grain to Sol',
  description: 'Standard delivery.',
  requirements: { cargo: 'grain', quantity: 15, destination: 0, deadline: 7 },
  rewards: { credits: 200 },
};

describe('MissionBoardPanel passenger rendering', () => {
  beforeEach(() => {
    useGameAction.mockReturnValue({
      acceptMission: vi.fn(() => ({ success: true })),
      refreshMissionBoard: vi.fn(),
    });
  });

  it('should render passenger name and type', () => {
    useGameEvent.mockReturnValue({
      board: [passengerMission],
    });

    render(<MissionBoardPanel onClose={vi.fn()} />);

    expect(screen.getByText(/Dr\. Chen/)).toBeDefined();
    expect(screen.getByText(/scientist/i)).toBeDefined();
  });

  it('should render passenger dialogue', () => {
    useGameEvent.mockReturnValue({
      board: [passengerMission],
    });

    render(<MissionBoardPanel onClose={vi.fn()} />);

    expect(screen.getByText(/Fascinating ship you have/)).toBeDefined();
  });

  it('should render cargo space requirement for passengers', () => {
    useGameEvent.mockReturnValue({
      board: [passengerMission],
    });

    render(<MissionBoardPanel onClose={vi.fn()} />);

    expect(screen.getByText(/2 units/i)).toBeDefined();
  });

  it('should render cargo details for delivery missions', () => {
    useGameEvent.mockReturnValue({
      board: [cargoMission],
    });

    render(<MissionBoardPanel onClose={vi.fn()} />);

    expect(screen.getByText(/15/)).toBeDefined();
    expect(screen.getByText(/grain/)).toBeDefined();
  });

  it('should render mixed board with both types', () => {
    useGameEvent.mockReturnValue({
      board: [passengerMission, cargoMission],
    });

    render(<MissionBoardPanel onClose={vi.fn()} />);

    expect(screen.getByText(/Dr\. Chen/)).toBeDefined();
    expect(screen.getByText(/grain/)).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/passenger-board-display.test.js`
Expected: FAIL — passenger-specific content not rendered

**Step 3: Write minimal implementation**

Modify `MissionBoardPanel.jsx` to conditionally render based on `mission.type`:

```jsx
{missions?.board?.map((mission) => (
  <div key={mission.id} className="mission-card">
    <h3>{mission.title}</h3>
    <p>{mission.description}</p>
    <div className="mission-details">
      {mission.type === 'passenger' ? (
        <>
          <div className="passenger-type">
            {capitalizeFirst(mission.passenger.type)}
          </div>
          <div className="passenger-dialogue">
            "{mission.passenger.dialogue}"
          </div>
          <div>Space Required: {mission.requirements.cargoSpace} units</div>
        </>
      ) : (
        <div>
          Deliver: {mission.requirements.quantity}{' '}
          {mission.requirements.cargo}
        </div>
      )}
      <div>Deadline: {mission.requirements.deadline} days</div>
      <div>Reward: ₡{mission.rewards.credits}</div>
    </div>
    <button
      className="accept-btn"
      onClick={() => handleAccept(mission)}
    >
      Accept
    </button>
  </div>
))}
```

Import `capitalizeFirst` from `@game/utils/string-utils.js`.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/passenger-board-display.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/missions/MissionBoardPanel.jsx tests/unit/passenger-board-display.test.js
git commit -m "feat: render passenger missions on mission board"
```

---

### Task 8: MissionCompleteNotifier Passenger Delivery

**Files:**
- Modify: `src/features/missions/MissionCompleteNotifier.jsx`
- Test: `tests/unit/passenger-completion-display.test.js`

**Context:** `MissionCompleteNotifier.jsx` shows a modal when a mission can be completed. For passenger missions, it should show: passenger name, satisfaction percentage, satisfaction label, and payment breakdown (base + multiplier).

**Step 1: Write the failing test**

Test that when a completable mission is a passenger type, it renders the passenger's satisfaction and payment breakdown.

**Step 2: Implement passenger-specific rendering**

Add conditional rendering in `MissionCompleteNotifier.jsx` that shows satisfaction and payment details when `current.type === 'passenger'`.

**Step 3: Run tests, verify pass, commit**

```bash
git add src/features/missions/MissionCompleteNotifier.jsx tests/unit/passenger-completion-display.test.js
git commit -m "feat: show passenger satisfaction and payment in completion dialog"
```

---

### Task 9: Integration Test — Full Passenger Lifecycle

**Files:**
- Create: `tests/integration/passenger-lifecycle.test.js`

**Context:** Integration test covering: generate passenger mission → accept → satisfaction updates during transit → complete at destination → verify payment with satisfaction multiplier → verify reputation change.

**Step 1: Write the integration test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { PASSENGER_CONFIG } from '../../src/game/constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { generatePassengerMission } from '../../src/game/mission-generator.js';

describe('Passenger Mission Lifecycle', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should complete full passenger lifecycle with satisfaction tracking', () => {
    // Generate a passenger mission from Sol
    const mission = generatePassengerMission(
      0,
      TEST_STAR_DATA,
      TEST_WORMHOLE_DATA,
      () => 0.5
    );

    // Accept the mission
    const acceptResult = manager.acceptMission(mission);
    expect(acceptResult.success).toBe(true);

    // Verify passenger is on the active mission
    const active = manager.getActiveMissions();
    expect(active).toHaveLength(1);
    expect(active[0].passenger).toBeDefined();
    const initialSatisfaction = active[0].passenger.satisfaction;

    // Simulate a delay event
    manager.updatePassengerSatisfaction(mission.id, 'delay');
    expect(active[0].passenger.satisfaction).toBeLessThan(initialSatisfaction);

    // Move player to destination
    const state = manager.getState();
    state.player.currentSystem = mission.requirements.destination;

    // Complete the mission
    const creditsBefore = state.player.credits;
    const completeResult = manager.completeMission(mission.id);
    expect(completeResult.success).toBe(true);

    // Verify payment was applied (should be less than base due to delay)
    const creditsEarned = state.player.credits - creditsBefore;
    expect(creditsEarned).toBeGreaterThan(0);

    // Verify mission is in completed list
    expect(state.missions.completed).toContain(mission.id);
    expect(state.missions.active).toHaveLength(0);
  });

  it('should reject passenger mission when cargo space is full', () => {
    const mission = generatePassengerMission(
      0,
      TEST_STAR_DATA,
      TEST_WORMHOLE_DATA,
      () => 0.5
    );

    // Fill cargo
    const state = manager.getState();
    state.ship.cargo = [{ good: 'grain', qty: 50, purchasePrice: 10 }];

    const result = manager.acceptMission(mission);
    expect(result.success).toBe(false);
    expect(result.reason).toContain('cargo space');
  });
});
```

**Step 2: Run integration test**

Run: `npm test -- tests/integration/passenger-lifecycle.test.js`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/integration/passenger-lifecycle.test.js
git commit -m "test: add passenger mission lifecycle integration test"
```

---

### Task 10: Full Test Suite Verification

**Files:** None (verification only)

**Step 1: Run the full test suite**

Run: `npm test`
Expected: ALL PASS, zero warnings in stderr

**Step 2: Run lint and format**

Run: `npm run clean`
Expected: No errors

**Step 3: If any failures, fix them and commit**

```bash
git add -A
git commit -m "fix: resolve test suite issues from passenger system"
```
