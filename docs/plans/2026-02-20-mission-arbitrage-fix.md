# Mission Arbitrage Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate the mission arbitrage exploit where dead-end systems let players print money by stacking missions to a single destination.

**Architecture:** Three reinforcing mechanics: (1) risk-scaled rewards based on hop count and danger zone instead of raw distance, (2) multi-hop mission destinations via BFS so dead-end systems have destination variety, (3) route saturation that reduces rewards for repeatedly running the same route. Changes are concentrated in `mission-generator.js`, `MissionManager`, and `constants.js`.

**Tech Stack:** Vitest for testing, ES Modules, existing game state architecture.

---

### Task 1: Add New Constants

**Files:**
- Modify: `src/game/constants.js:486-504`
- Test: `tests/unit/mission-constants.test.js`

**Step 1: Write the failing test**

Add a new describe block in `tests/unit/mission-constants.test.js` that verifies the new constants exist:

```js
describe('Mission Arbitrage Fix Constants', () => {
  it('should have hop multipliers array with entries for 0-3 hops', () => {
    expect(MISSION_CONFIG.HOP_MULTIPLIERS).toEqual([1.0, 1.0, 2.0, 3.5]);
  });

  it('should have danger multipliers for all zones', () => {
    expect(MISSION_CONFIG.DANGER_MULTIPLIERS).toEqual({
      safe: 1.0,
      contested: 1.5,
      dangerous: 2.0,
    });
  });

  it('should have MAX_MISSION_HOPS set to 3', () => {
    expect(MISSION_CONFIG.MAX_MISSION_HOPS).toBe(3);
  });

  it('should have MIN_BOARD_SIZE set to 1', () => {
    expect(MISSION_CONFIG.MIN_BOARD_SIZE).toBe(1);
  });

  it('should have DAYS_PER_HOP_ESTIMATE for deadline calculation', () => {
    expect(MISSION_CONFIG.DAYS_PER_HOP_ESTIMATE).toBe(6);
  });

  it('should have route saturation constants', () => {
    expect(MISSION_CONFIG.SATURATION_WINDOW_DAYS).toBe(30);
    expect(MISSION_CONFIG.SATURATION_PENALTY_PER_RUN).toBe(0.25);
    expect(MISSION_CONFIG.SATURATION_FLOOR).toBe(0.25);
    expect(MISSION_CONFIG.SATURATION_MAX_HISTORY).toBe(50);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-constants.test.js`
Expected: FAIL — properties don't exist on MISSION_CONFIG yet.

**Step 3: Write minimal implementation**

Add the new constants to `MISSION_CONFIG` in `src/game/constants.js:486-504`. Add these properties inside the existing object:

```js
HOP_MULTIPLIERS: [1.0, 1.0, 2.0, 3.5],
DANGER_MULTIPLIERS: { safe: 1.0, contested: 1.5, dangerous: 2.0 },
MAX_MISSION_HOPS: 3,
MIN_BOARD_SIZE: 1,
DAYS_PER_HOP_ESTIMATE: 6,
SATURATION_WINDOW_DAYS: 30,
SATURATION_PENALTY_PER_RUN: 0.25,
SATURATION_FLOOR: 0.25,
SATURATION_MAX_HISTORY: 50,
```

Do NOT remove `CARGO_RUN_PER_LY_RATE` or `CARGO_RUN_ILLEGAL_PER_LY_RATE` yet — existing tests reference them. They'll be cleaned up after the generator is updated.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-constants.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/constants.js tests/unit/mission-constants.test.js
git commit -m "feat: add mission arbitrage fix constants"
```

---

### Task 2: Add `getReachableSystems` BFS Utility

**Files:**
- Modify: `src/game/mission-generator.js`
- Test: `tests/unit/mission-generator.test.js`

**Reference:** The test file uses `TEST_STAR_DATA` and `TEST_WORMHOLE_DATA` from `tests/test-data.js`. The test wormhole topology is:
```
Sol(0) -- Alpha Centauri(1) -- Epsilon Eridani(13)
Sol(0) -- Barnard's Star(4) -- System 5
Sol(0) -- Sirius A(7)
```
So from system 7 (dead-end), 1 hop reaches [0], 2 hops reaches [0, 1, 4], 3 hops reaches [0, 1, 4, 5, 13].
From system 0, 1 hop reaches [1, 4, 7], 2 hops reaches [1, 4, 7, 5, 13].

**Step 1: Write the failing test**

Add a new describe block in `tests/unit/mission-generator.test.js`:

```js
import {
  generateCargoRun,
  generateMissionBoard,
  getConnectedSystems,
  getReachableSystems,
} from '../../src/game/mission-generator.js';

// ... inside the outer describe ...

describe('getReachableSystems', () => {
  it('should return direct neighbors at hop 1', () => {
    const result = getReachableSystems(0, TEST_WORMHOLE_DATA, 1);
    const ids = result.map((r) => r.systemId);
    expect(ids).toEqual(expect.arrayContaining([1, 4, 7]));
    expect(ids).toHaveLength(3);
    result.forEach((r) => expect(r.hopCount).toBe(1));
  });

  it('should return systems up to 2 hops away', () => {
    const result = getReachableSystems(0, TEST_WORMHOLE_DATA, 2);
    const ids = result.map((r) => r.systemId);
    expect(ids).toEqual(expect.arrayContaining([1, 4, 7, 5, 13]));
    expect(ids).toHaveLength(5);
  });

  it('should include hop count for each system', () => {
    const result = getReachableSystems(0, TEST_WORMHOLE_DATA, 2);
    const byId = Object.fromEntries(result.map((r) => [r.systemId, r.hopCount]));
    expect(byId[1]).toBe(1);
    expect(byId[4]).toBe(1);
    expect(byId[7]).toBe(1);
    expect(byId[5]).toBe(2);
    expect(byId[13]).toBe(2);
  });

  it('should not include the origin system', () => {
    const result = getReachableSystems(0, TEST_WORMHOLE_DATA, 3);
    const ids = result.map((r) => r.systemId);
    expect(ids).not.toContain(0);
  });

  it('should handle dead-end systems (1 connection)', () => {
    const result = getReachableSystems(7, TEST_WORMHOLE_DATA, 1);
    expect(result).toEqual([{ systemId: 0, hopCount: 1 }]);
  });

  it('should find multi-hop destinations from dead-end systems', () => {
    const result = getReachableSystems(7, TEST_WORMHOLE_DATA, 3);
    const ids = result.map((r) => r.systemId);
    expect(ids).toEqual(expect.arrayContaining([0, 1, 4, 5, 13]));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-generator.test.js`
Expected: FAIL — `getReachableSystems` is not exported.

**Step 3: Write minimal implementation**

Add to `src/game/mission-generator.js`, right after the existing `getConnectedSystems` function (after line 16):

```js
export function getReachableSystems(systemId, wormholeData, maxHops) {
  const visited = new Set([systemId]);
  const result = [];
  let frontier = [systemId];

  for (let hop = 1; hop <= maxHops; hop++) {
    const nextFrontier = [];
    for (const current of frontier) {
      for (const neighbor of getConnectedSystems(current, wormholeData)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          result.push({ systemId: neighbor, hopCount: hop });
          nextFrontier.push(neighbor);
        }
      }
    }
    frontier = nextFrontier;
  }

  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-generator.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/mission-generator.js tests/unit/mission-generator.test.js
git commit -m "feat: add getReachableSystems BFS for multi-hop missions"
```

---

### Task 3: Update `generateCargoRun` with Risk-Scaled Rewards and Multi-Hop Destinations

**Files:**
- Modify: `src/game/mission-generator.js:23-110`
- Test: `tests/unit/mission-generator.test.js`

This is the biggest change. The function signature gains new parameters: `destinationDangerZoneFn` and `completionHistory`. Reward formula changes from distance-based to hop/danger-based. Destination selection uses `getReachableSystems` with weighted random.

**Step 1: Write the failing tests**

Replace and add tests in the `generateCargoRun` describe block. Key new tests:

```js
describe('generateCargoRun (risk-scaled)', () => {
  it('should pick destinations from reachable systems up to MAX_MISSION_HOPS', () => {
    const destinations = new Set();
    for (let i = 0; i < 100; i++) {
      const mission = generateCargoRun(
        7, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
      );
      destinations.add(mission.requirements.destination);
    }
    // System 7 is a dead-end; should reach beyond just system 0
    expect(destinations.size).toBeGreaterThan(1);
  });

  it('should calculate reward using hop and danger multipliers', () => {
    // Use a deterministic rng that picks first neighbor (1-hop, safe)
    let callCount = 0;
    const rng = () => {
      callCount++;
      return 0.01; // low value: picks first item, forces legal cargo
    };
    const mission = generateCargoRun(
      0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe', rng
    );
    // 1-hop safe: baseFee(75) * hopMult(1.0) * dangerMult(1.0) = 75
    expect(mission.rewards.credits).toBe(MISSION_CONFIG.CARGO_RUN_BASE_FEE);
  });

  it('should apply higher reward for multi-hop destinations', () => {
    // Force picking a 2-hop destination by providing a dead-end system
    // System 7 only connects to 0, so 2-hop destinations go through 0
    const rewards = [];
    for (let i = 0; i < 50; i++) {
      const mission = generateCargoRun(
        7, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
      );
      if (mission.hopCount > 1) {
        rewards.push(mission.rewards.credits);
      }
    }
    // Multi-hop missions should exist and pay more than base
    if (rewards.length > 0) {
      rewards.forEach((r) =>
        expect(r).toBeGreaterThan(MISSION_CONFIG.CARGO_RUN_BASE_FEE)
      );
    }
  });

  it('should include hopCount on generated mission', () => {
    const mission = generateCargoRun(
      0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
    );
    expect(mission.hopCount).toBeGreaterThanOrEqual(1);
    expect(mission.hopCount).toBeLessThanOrEqual(MISSION_CONFIG.MAX_MISSION_HOPS);
  });

  it('should apply danger multiplier for contested/dangerous destinations', () => {
    const dangerZoneFn = () => 'dangerous';
    const rng = () => 0.01; // legal cargo
    const mission = generateCargoRun(
      0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe', rng, dangerZoneFn
    );
    // 1-hop dangerous: 75 * 1.0 * 2.0 = 150
    expect(mission.rewards.credits).toBe(
      Math.ceil(
        MISSION_CONFIG.CARGO_RUN_BASE_FEE *
        MISSION_CONFIG.HOP_MULTIPLIERS[1] *
        MISSION_CONFIG.DANGER_MULTIPLIERS.dangerous
      )
    );
  });

  it('should apply saturation penalty when completionHistory has entries', () => {
    const history = [
      { from: 0, to: 1, day: 5 },
      { from: 0, to: 1, day: 10 },
    ];
    const dangerZoneFn = () => 'safe';
    // Force destination to system 1
    const rng = () => 0.01;
    const mission = generateCargoRun(
      0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe', rng,
      dangerZoneFn, history, 15
    );
    // 2 completions to system 1: penalty = 2 * 0.25 = 0.5, mult = 0.5
    // Base 75 * 1.0 hop * 1.0 danger * 0.5 saturation = 38
    expect(mission.rewards.credits).toBe(
      Math.ceil(75 * 1.0 * 1.0 * 0.5)
    );
  });

  it('should not reduce reward below saturation floor', () => {
    const history = [
      { from: 0, to: 1, day: 1 },
      { from: 0, to: 1, day: 3 },
      { from: 0, to: 1, day: 5 },
      { from: 0, to: 1, day: 7 },
      { from: 0, to: 1, day: 9 },
    ];
    const dangerZoneFn = () => 'safe';
    const rng = () => 0.01;
    const mission = generateCargoRun(
      0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe', rng,
      dangerZoneFn, history, 15
    );
    // 5 completions: penalty = 5 * 0.25 = 1.25, clamped to floor 0.25
    // Base 75 * 1.0 * 1.0 * 0.25 = 19
    expect(mission.rewards.credits).toBe(Math.ceil(75 * 0.25));
  });

  it('should ignore completionHistory entries outside saturation window', () => {
    const history = [
      { from: 0, to: 1, day: 1 }, // outside window if currentDay=50
    ];
    const dangerZoneFn = () => 'safe';
    const rng = () => 0.01;
    const mission = generateCargoRun(
      0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe', rng,
      dangerZoneFn, history, 50
    );
    // Entry at day 1, current day 50, window 30 => entry is stale
    expect(mission.rewards.credits).toBe(75);
  });

  it('should use hop-based deadline instead of distance-based', () => {
    const mission = generateCargoRun(
      0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
    );
    const expectedDeadline =
      mission.hopCount * MISSION_CONFIG.DAYS_PER_HOP_ESTIMATE +
      MISSION_CONFIG.DEADLINE_BUFFER_DAYS;
    expect(mission.requirements.deadline).toBe(expectedDeadline);
  });

  it('should produce integer rewards', () => {
    for (let i = 0; i < 20; i++) {
      const mission = generateCargoRun(
        0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
      );
      expect(Number.isInteger(mission.rewards.credits)).toBe(true);
    }
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/mission-generator.test.js`
Expected: Multiple failures — old tests check distance-based reward, new tests check hop-based.

**Step 3: Write the implementation**

Update `generateCargoRun` in `src/game/mission-generator.js`. New signature:

```js
export function generateCargoRun(
  fromSystem,
  starData,
  wormholeData,
  dangerZone = 'safe',
  rng = Math.random,
  destinationDangerZoneFn = null,
  completionHistory = [],
  currentDay = 0
)
```

Key changes:
1. Use `getReachableSystems(fromSystem, wormholeData, MISSION_CONFIG.MAX_MISSION_HOPS)` instead of `getConnectedSystems`
2. Weight destination selection by `1 / hopCount²` — build a weighted array and pick from it
3. Reward: `Math.ceil(baseFee * hopMultiplier * dangerMultiplier * saturationMultiplier)`
4. Deadline: `hopCount * DAYS_PER_HOP_ESTIMATE + DEADLINE_BUFFER_DAYS`
5. Add `hopCount` to the returned mission object
6. Calculate `saturationMultiplier` from `completionHistory` entries within `SATURATION_WINDOW_DAYS` of `currentDay`
7. The `destinationDangerZoneFn` parameter takes a systemId and returns the danger zone string. If null, default to `dangerZone` parameter (the origin's zone, preserving backward compat).

Full implementation of the updated function:

```js
export function generateCargoRun(
  fromSystem,
  starData,
  wormholeData,
  dangerZone = 'safe',
  rng = Math.random,
  destinationDangerZoneFn = null,
  completionHistory = [],
  currentDay = 0
) {
  const reachable = getReachableSystems(
    fromSystem,
    wormholeData,
    MISSION_CONFIG.MAX_MISSION_HOPS
  );
  if (reachable.length === 0) return null;

  // Weighted destination selection: weight = 1 / hopCount²
  const weights = reachable.map((r) => 1 / (r.hopCount * r.hopCount));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let roll = rng() * totalWeight;
  let chosen = reachable[0];
  for (let i = 0; i < reachable.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      chosen = reachable[i];
      break;
    }
  }

  const toSystem = chosen.systemId;
  const hopCount = chosen.hopCount;
  const fromStar = starData.find((s) => s.id === fromSystem);
  const destStar = starData.find((s) => s.id === toSystem);

  const deadline =
    hopCount * MISSION_CONFIG.DAYS_PER_HOP_ESTIMATE +
    MISSION_CONFIG.DEADLINE_BUFFER_DAYS;

  // Determine legal vs illegal based on origin zone
  const illegalChance =
    MISSION_CONFIG.CARGO_RUN_ZONE_ILLEGAL_CHANCE[dangerZone] || 0.15;
  const isIllegal = rng() < illegalChance;

  const cargoPool = isIllegal
    ? MISSION_CARGO_TYPES.illegal
    : MISSION_CARGO_TYPES.legal;
  const good = pickRandomFrom(cargoPool, rng);

  const qtyRange = isIllegal
    ? MISSION_CONFIG.CARGO_RUN_ILLEGAL_QUANTITY
    : MISSION_CONFIG.CARGO_RUN_LEGAL_QUANTITY;
  const qty =
    qtyRange.MIN + Math.floor(rng() * (qtyRange.MAX - qtyRange.MIN + 1));

  // Risk-scaled reward
  const baseFee = isIllegal
    ? MISSION_CONFIG.CARGO_RUN_ILLEGAL_BASE_FEE
    : MISSION_CONFIG.CARGO_RUN_BASE_FEE;

  const hopMultiplier = MISSION_CONFIG.HOP_MULTIPLIERS[hopCount] || 1.0;

  const destDangerZone = destinationDangerZoneFn
    ? destinationDangerZoneFn(toSystem)
    : dangerZone;
  const dangerMultiplier =
    MISSION_CONFIG.DANGER_MULTIPLIERS[destDangerZone] || 1.0;

  // Route saturation
  const windowStart = currentDay - MISSION_CONFIG.SATURATION_WINDOW_DAYS;
  const recentCompletions = completionHistory.filter(
    (entry) =>
      entry.to === toSystem &&
      entry.from === fromSystem &&
      entry.day > windowStart
  ).length;
  const saturationMultiplier = Math.max(
    MISSION_CONFIG.SATURATION_FLOOR,
    1.0 - recentCompletions * MISSION_CONFIG.SATURATION_PENALTY_PER_RUN
  );

  const reward = Math.ceil(
    baseFee * hopMultiplier * dangerMultiplier * saturationMultiplier
  );

  // Build faction rewards
  const faction = { traders: 2 };
  if (isIllegal) {
    faction.outlaws = 3;
  }

  const failureFaction = { traders: -2 };
  if (isIllegal) {
    failureFaction.outlaws = -2;
  }

  const cargoLabel = good
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: `cargo_run_${Date.now()}_${Math.floor(rng() * 10000)}`,
    type: 'delivery',
    title: `Cargo Run: ${cargoLabel} to ${destStar ? destStar.name : `System ${toSystem}`}`,
    description: isIllegal
      ? 'Discreet delivery. No questions asked.'
      : 'Standard delivery contract.',
    giver: 'station_master',
    giverSystem: fromSystem,
    hopCount,
    requirements: {
      destination: toSystem,
      deadline,
    },
    destination: {
      systemId: toSystem,
      name: destStar ? destStar.name : `System ${toSystem}`,
    },
    missionCargo: {
      good,
      quantity: qty,
      isIllegal,
    },
    rewards: { credits: reward, faction },
    penalties: { failure: { faction: failureFaction } },
    saturated: saturationMultiplier < 1.0,
  };
}
```

**Step 4: Update existing tests that broke**

The following existing tests need updates:
- `'should generate destination that is a connected system'` — now destinations can be multi-hop, change assertion to check against reachable systems
- `'should calculate distance-based reward (integer)'` — rename and update to check hop-based reward logic
- Any test that asserts `mission.rewards.credits >= CARGO_RUN_BASE_FEE` — still valid since 1-hop safe gives exactly base fee

Review each failing test and update to match new behavior. Keep assertions meaningful.

**Step 5: Run all tests to verify they pass**

Run: `npm test -- tests/unit/mission-generator.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add src/game/mission-generator.js tests/unit/mission-generator.test.js
git commit -m "feat: risk-scaled rewards and multi-hop destinations for cargo runs"
```

---

### Task 4: Update `generatePassengerMission` with Multi-Hop Destinations

**Files:**
- Modify: `src/game/mission-generator.js:118-172`
- Test: `tests/unit/mission-generator.test.js`

Passenger missions use payment tiers rather than distance-based rewards, so the hop/danger multiplier doesn't apply to base reward. But saturation and multi-hop destinations do apply.

**Step 1: Write the failing test**

```js
describe('generatePassengerMission (multi-hop)', () => {
  it('should pick destinations from reachable systems', () => {
    const destinations = new Set();
    for (let i = 0; i < 100; i++) {
      const mission = generatePassengerMission(
        7, TEST_STAR_DATA, TEST_WORMHOLE_DATA
      );
      destinations.add(mission.requirements.destination);
    }
    expect(destinations.size).toBeGreaterThan(1);
  });

  it('should include hopCount on generated mission', () => {
    const mission = generatePassengerMission(
      0, TEST_STAR_DATA, TEST_WORMHOLE_DATA
    );
    expect(mission.hopCount).toBeGreaterThanOrEqual(1);
  });

  it('should use hop-based deadline', () => {
    const mission = generatePassengerMission(
      0, TEST_STAR_DATA, TEST_WORMHOLE_DATA
    );
    const expectedDeadline =
      mission.hopCount * MISSION_CONFIG.DAYS_PER_HOP_ESTIMATE +
      MISSION_CONFIG.DEADLINE_BUFFER_DAYS;
    expect(mission.requirements.deadline).toBe(expectedDeadline);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-generator.test.js`
Expected: FAIL

**Step 3: Write the implementation**

Update `generatePassengerMission` to:
1. Use `getReachableSystems` with weighted selection (same as cargo runs)
2. Use hop-based deadline
3. Add `hopCount` to the returned mission object
4. Accept `completionHistory` and `currentDay` for saturation (apply to `tier` reward)

New signature:
```js
export function generatePassengerMission(
  fromSystem,
  starData,
  wormholeData,
  rng = Math.random,
  completionHistory = [],
  currentDay = 0
)
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/mission-generator.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/mission-generator.js tests/unit/mission-generator.test.js
git commit -m "feat: multi-hop destinations for passenger missions"
```

---

### Task 5: Update `generateMissionBoard` with Board Size Scaling

**Files:**
- Modify: `src/game/mission-generator.js:174-191`
- Test: `tests/unit/mission-generator.test.js`

**Step 1: Write the failing test**

```js
describe('generateMissionBoard (scaled)', () => {
  it('should generate fewer missions for dead-end systems', () => {
    // System 7 has 1 connection
    const board = generateMissionBoard(
      7, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
    );
    expect(board.length).toBeLessThanOrEqual(2); // min(1+1, 3)
  });

  it('should generate full board for well-connected systems', () => {
    // System 0 has 3 connections
    const boards = [];
    for (let i = 0; i < 20; i++) {
      boards.push(
        generateMissionBoard(0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe')
      );
    }
    const maxSize = Math.max(...boards.map((b) => b.length));
    expect(maxSize).toBe(MISSION_CONFIG.BOARD_SIZE);
  });

  it('should pass completionHistory and currentDay to mission generators', () => {
    const history = [{ from: 0, to: 1, day: 5 }];
    const board = generateMissionBoard(
      0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe',
      Math.random, null, history, 10
    );
    // Missions to system 1 should have saturation applied
    const toSystem1 = board.filter(
      (m) => m.requirements.destination === 1
    );
    toSystem1.forEach((m) => {
      expect(m.saturated).toBe(true);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-generator.test.js`
Expected: FAIL

**Step 3: Write the implementation**

Update `generateMissionBoard` signature and logic:

```js
export function generateMissionBoard(
  systemId,
  starData,
  wormholeData,
  dangerZone = 'safe',
  rng = Math.random,
  destinationDangerZoneFn = null,
  completionHistory = [],
  currentDay = 0
) {
  const connectionCount = getConnectedSystems(systemId, wormholeData).length;
  const boardSize = Math.min(
    Math.max(connectionCount + 1, MISSION_CONFIG.MIN_BOARD_SIZE),
    MISSION_CONFIG.BOARD_SIZE
  );

  const board = [];
  for (let i = 0; i < boardSize; i++) {
    const isPassenger = rng() < 0.3;
    const mission = isPassenger
      ? generatePassengerMission(
          systemId, starData, wormholeData, rng,
          completionHistory, currentDay
        )
      : generateCargoRun(
          systemId, starData, wormholeData, dangerZone, rng,
          destinationDangerZoneFn, completionHistory, currentDay
        );
    if (mission) board.push(mission);
  }
  return board;
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/mission-generator.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/mission-generator.js tests/unit/mission-generator.test.js
git commit -m "feat: scale board size by system connectivity"
```

---

### Task 6: Add `completionHistory` to Mission State and MissionManager

**Files:**
- Modify: `src/game/state/managers/initialization.js:213-221`
- Modify: `src/game/state/managers/mission.js:80-233` (completeMission) and `404-433` (refreshMissionBoard)
- Test: `tests/unit/mission-completion.test.js` or new `tests/unit/mission-saturation.test.js`

**Step 1: Write the failing test**

Create `tests/unit/mission-saturation.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';

describe('Mission Route Saturation', () => {
  let gsm;

  beforeEach(() => {
    gsm = new GameStateManager();
    gsm.initializeGame('TestShip');
  });

  it('should initialize completionHistory as empty array', () => {
    const state = gsm.getState();
    expect(state.missions.completionHistory).toEqual([]);
  });

  it('should record completion history entry when mission is completed', () => {
    const state = gsm.getState();

    // Set player at destination system
    state.player.currentSystem = 1;

    // Add a mission to complete
    state.missions.active.push({
      id: 'test_mission_1',
      type: 'delivery',
      giverSystem: 0,
      hopCount: 1,
      requirements: { destination: 1, deadline: 10 },
      destination: { systemId: 1, name: 'Alpha Centauri A' },
      missionCargo: { good: 'sealed_containers', quantity: 5, isIllegal: false },
      rewards: { credits: 75, faction: { traders: 2 } },
      penalties: { failure: { faction: { traders: -2 } } },
    });

    // Put mission cargo in hold
    state.ship.cargo.push({
      good: 'sealed_containers',
      qty: 5,
      buyPrice: 0,
      missionId: 'test_mission_1',
    });

    gsm.completeMission('test_mission_1');

    expect(state.missions.completionHistory).toHaveLength(1);
    expect(state.missions.completionHistory[0]).toEqual({
      from: 0,
      to: 1,
      day: state.player.daysElapsed,
    });
  });

  it('should prune stale history entries during board refresh', () => {
    const state = gsm.getState();
    state.missions.completionHistory = [
      { from: 0, to: 1, day: 1 },  // stale
      { from: 0, to: 1, day: 50 }, // recent
    ];
    state.player.daysElapsed = 60;
    state.missions.board = []; // force refresh
    state.missions.boardLastRefresh = -1;

    gsm.refreshMissionBoard();

    // Day 1 entry is outside 30-day window from day 60
    expect(state.missions.completionHistory).toHaveLength(1);
    expect(state.missions.completionHistory[0].day).toBe(50);
  });

  it('should cap completionHistory at SATURATION_MAX_HISTORY', () => {
    const state = gsm.getState();
    // Fill with 55 entries (above max of 50)
    state.missions.completionHistory = Array.from({ length: 55 }, (_, i) => ({
      from: 0,
      to: 1,
      day: state.player.daysElapsed - i,
    }));
    state.missions.board = [];
    state.missions.boardLastRefresh = -1;

    gsm.refreshMissionBoard();

    expect(state.missions.completionHistory.length).toBeLessThanOrEqual(50);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-saturation.test.js`
Expected: FAIL — `completionHistory` not in initial state.

**Step 3: Write the implementation**

1. In `src/game/state/managers/initialization.js:213-221`, add `completionHistory: []` to the mission state:

```js
initializeMissionState() {
  return {
    active: [],
    completed: [],
    failed: [],
    board: [],
    boardLastRefresh: 0,
    completionHistory: [],
  };
}
```

2. In `src/game/state/managers/mission.js`, update `completeMission` (around line 183, after `state.missions.completed.push(missionId)`):

```js
// Record completion for route saturation
state.missions.completionHistory.push({
  from: mission.giverSystem,
  to: mission.requirements.destination,
  day: state.player.daysElapsed,
});
```

3. In `refreshMissionBoard` (around line 404), add history pruning before generating the board, and pass `completionHistory` and `currentDay` to `generateMissionBoard`. Also pass a `destinationDangerZoneFn`:

```js
refreshMissionBoard() {
  this.validateState();
  const state = this.getState();
  const currentDay = Math.floor(state.player.daysElapsed);

  if (
    state.missions.board.length > 0 &&
    state.missions.boardLastRefresh === currentDay
  ) {
    return state.missions.board;
  }

  // Prune stale completion history
  const windowStart = currentDay - MISSION_CONFIG.SATURATION_WINDOW_DAYS;
  state.missions.completionHistory = state.missions.completionHistory
    .filter((entry) => entry.day > windowStart)
    .slice(-MISSION_CONFIG.SATURATION_MAX_HISTORY);

  const dangerZone =
    typeof this.gameStateManager.getDangerZone === 'function'
      ? this.gameStateManager.getDangerZone(state.player.currentSystem)
      : 'safe';

  const destinationDangerZoneFn =
    typeof this.gameStateManager.getDangerZone === 'function'
      ? (systemId) => this.gameStateManager.getDangerZone(systemId)
      : null;

  const board = generateMissionBoard(
    state.player.currentSystem,
    this.gameStateManager.starData,
    this.gameStateManager.wormholeData,
    dangerZone,
    undefined,
    destinationDangerZoneFn,
    state.missions.completionHistory,
    currentDay
  );

  state.missions.board = board;
  state.missions.boardLastRefresh = currentDay;
  this.emit('missionsChanged', { ...state.missions });

  return board;
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/mission-saturation.test.js`
Expected: PASS

**Step 5: Run the full test suite**

Run: `npm test`
Expected: ALL PASS. If existing tests break, fix them — common issues will be tests that assert specific reward values or destination lists.

**Step 6: Commit**

```bash
git add src/game/state/managers/initialization.js src/game/state/managers/mission.js tests/unit/mission-saturation.test.js
git commit -m "feat: track mission completion history for route saturation"
```

---

### Task 7: Update Mission Board UI for Saturation Display

**Files:**
- Modify: `src/features/missions/MissionBoardPanel.jsx`

**Step 1: Update the reward display**

In `src/features/missions/MissionBoardPanel.jsx`, find the reward display line (around line 69):

```jsx
<div>Reward: ₡{mission.rewards.credits}</div>
```

Replace with:

```jsx
<div className={mission.saturated ? 'reward-saturated' : ''}>
  Reward: ₡{mission.rewards.credits}
  {mission.saturated && (
    <span
      className="saturation-hint"
      title="Haulers on this route are plentiful — reduced pay"
    >
      {' '}▼
    </span>
  )}
</div>
```

**Step 2: Add CSS for saturation indicator**

Find the mission board CSS file (likely in the same feature directory or a shared stylesheet) and add:

```css
.reward-saturated {
  opacity: 0.6;
}

.saturation-hint {
  color: var(--color-warning, #cc8800);
  cursor: help;
}
```

**Step 3: Verify visually**

Run: `npm run dev`
Navigate to a system, check the mission board. Verify missions display correctly. No automated test needed for pure display — this is a presentation-only change.

**Step 4: Commit**

```bash
git add src/features/missions/MissionBoardPanel.jsx
git commit -m "feat: show saturation indicator on mission board rewards"
```

---

### Task 8: Clean Up Deprecated Constants and Run Full Suite

**Files:**
- Modify: `src/game/constants.js`
- Modify: `tests/unit/mission-generator.test.js` (remove references to per-LY rate)

**Step 1: Remove deprecated constants**

Remove `CARGO_RUN_PER_LY_RATE` and `CARGO_RUN_ILLEGAL_PER_LY_RATE` from `MISSION_CONFIG` in `src/game/constants.js`. These are no longer used by the generator.

**Step 2: Search for any remaining references**

Search the codebase for `PER_LY_RATE`. If any tests or code still reference these, update or remove them.

**Step 3: Run the full test suite**

Run: `npm test`
Expected: ALL PASS

**Step 4: Run lint**

Run: `npm run lint`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/constants.js tests/unit/mission-generator.test.js
git commit -m "chore: remove deprecated per-LY-rate mission constants"
```

---

### Task 9: Final Verification

**Step 1: Run full test suite**

Run: `npm test`
Expected: ALL PASS with no stderr warnings.

**Step 2: Run lint and format**

Run: `npm run clean`
Expected: PASS

**Step 3: Manual smoke test**

Run: `npm run dev`
- Start a new game
- Navigate to a dead-end system (e.g., use dev admin if available)
- Check mission board: should have fewer missions, destinations should vary
- Accept and complete a mission, then check board again: rewards should show saturation indicator
- Navigate to a well-connected hub: board should have full 3 missions with varied destinations and higher-paying multi-hop options

**Step 4: Final commit if any fixups needed**

```bash
git add -A
git commit -m "fix: final adjustments from smoke testing"
```
