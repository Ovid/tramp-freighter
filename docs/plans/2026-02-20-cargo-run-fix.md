# Cargo Run Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace broken cargo run economics with client-provided mission-only goods, distance-based rewards, and customs integration for illegal cargo.

**Architecture:** Mission cargo uses new non-tradeable good types placed directly into the player's hold on accept. Illegal cargo types hook into the existing `countRestrictedGoods()` → `calculateInspectionChance()` pipeline. The `missionId` field on cargo stacks prevents selling and enables targeted removal.

**Tech Stack:** Vitest, React 18, existing GameStateManager/Bridge Pattern

---

### Task 1: Add Mission Cargo Constants

**Files:**
- Modify: `src/game/constants.js:486-493`

**Step 1: Write the failing test**

Test file: `tests/unit/cargo-run-constants.test.js`

```js
import { describe, it, expect } from 'vitest';
import {
  MISSION_CONFIG,
  MISSION_CARGO_TYPES,
} from '../../src/game/constants.js';

describe('Cargo Run Constants', () => {
  describe('MISSION_CONFIG cargo run fields', () => {
    it('should have distance-based fee constants for legal cargo', () => {
      expect(MISSION_CONFIG.CARGO_RUN_BASE_FEE).toBe(75);
      expect(MISSION_CONFIG.CARGO_RUN_PER_LY_RATE).toBe(25);
    });

    it('should have distance-based fee constants for illegal cargo', () => {
      expect(MISSION_CONFIG.CARGO_RUN_ILLEGAL_BASE_FEE).toBe(150);
      expect(MISSION_CONFIG.CARGO_RUN_ILLEGAL_PER_LY_RATE).toBe(40);
    });

    it('should have quantity ranges for legal and illegal cargo', () => {
      expect(MISSION_CONFIG.CARGO_RUN_LEGAL_QUANTITY).toEqual({ MIN: 5, MAX: 15 });
      expect(MISSION_CONFIG.CARGO_RUN_ILLEGAL_QUANTITY).toEqual({ MIN: 5, MAX: 10 });
    });

    it('should have zone-based illegal cargo chance', () => {
      expect(MISSION_CONFIG.CARGO_RUN_ZONE_ILLEGAL_CHANCE).toEqual({
        safe: 0.15,
        contested: 0.50,
        dangerous: 0.75,
      });
    });
  });

  describe('MISSION_CARGO_TYPES', () => {
    it('should define legal cargo types', () => {
      expect(MISSION_CARGO_TYPES.legal).toEqual([
        'sealed_containers',
        'diplomatic_pouches',
        'scientific_samples',
      ]);
    });

    it('should define illegal cargo types', () => {
      expect(MISSION_CARGO_TYPES.illegal).toEqual([
        'unmarked_crates',
        'prohibited_tech',
        'black_market_goods',
      ]);
    });

    it('should have no overlap between legal and illegal types', () => {
      const overlap = MISSION_CARGO_TYPES.legal.filter(
        (t) => MISSION_CARGO_TYPES.illegal.includes(t)
      );
      expect(overlap).toEqual([]);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/cargo-run-constants.test.js`
Expected: FAIL — `MISSION_CARGO_TYPES` not exported, `CARGO_RUN_BASE_FEE` undefined

**Step 3: Write minimal implementation**

In `src/game/constants.js`, expand `MISSION_CONFIG` (at line ~486) and add `MISSION_CARGO_TYPES`:

```js
export const MISSION_CONFIG = {
  TYPES: ['delivery', 'fetch', 'passenger', 'intel', 'special'],
  MAX_ACTIVE: 3,
  BOARD_SIZE: 3,
  BOARD_REFRESH_DAYS: 1,
  DEADLINE_BUFFER_DAYS: 3,
  REWARD_MARKUP: 0.3, // kept for fetch missions if needed
  CARGO_RUN_BASE_FEE: 75,
  CARGO_RUN_PER_LY_RATE: 25,
  CARGO_RUN_ILLEGAL_BASE_FEE: 150,
  CARGO_RUN_ILLEGAL_PER_LY_RATE: 40,
  CARGO_RUN_LEGAL_QUANTITY: { MIN: 5, MAX: 15 },
  CARGO_RUN_ILLEGAL_QUANTITY: { MIN: 5, MAX: 10 },
  CARGO_RUN_ZONE_ILLEGAL_CHANCE: {
    safe: 0.15,
    contested: 0.50,
    dangerous: 0.75,
  },
};

export const MISSION_CARGO_TYPES = {
  legal: ['sealed_containers', 'diplomatic_pouches', 'scientific_samples'],
  illegal: ['unmarked_crates', 'prohibited_tech', 'black_market_goods'],
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/cargo-run-constants.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/unit/cargo-run-constants.test.js src/game/constants.js
git commit -m "feat: add cargo run mission constants and cargo types"
```

---

### Task 2: Rewrite generateCargoRun

**Files:**
- Modify: `src/game/mission-generator.js:1-64`
- Test: `tests/unit/mission-generator.test.js`

**Context:** The generator currently picks from tradeable goods and calculates reward as `qty * BASE_PRICES[good] * 0.3`. It needs to:
1. Accept a `dangerZone` parameter (the zone of the current system)
2. Pick legal vs. illegal based on zone-weighted chance
3. Pick a random cargo type from the chosen category
4. Calculate quantity from the appropriate range
5. Calculate reward as `BASE_FEE + (distance * PER_LY_RATE)`
6. Include an `isIllegal` flag and `missionCargo` object on the mission
7. Include faction rep rewards and failure penalties

**Step 1: Write the failing tests**

Replace the existing `generateCargoRun` tests and add new ones in `tests/unit/mission-generator.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  generateCargoRun,
  generateMissionBoard,
} from '../../src/game/mission-generator.js';
import { MISSION_CARGO_TYPES, MISSION_CONFIG } from '../../src/game/constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Generator', () => {
  const allMissionCargo = [
    ...MISSION_CARGO_TYPES.legal,
    ...MISSION_CARGO_TYPES.illegal,
  ];

  describe('generateCargoRun', () => {
    it('should generate a valid delivery mission with mission-only cargo', () => {
      const mission = generateCargoRun(
        0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
      );

      expect(mission.id).toMatch(/^cargo_run_/);
      expect(mission.type).toBe('delivery');
      expect(mission.title).toContain('Cargo Run');
      expect(mission.requirements).toHaveProperty('destination');
      expect(mission.requirements).toHaveProperty('deadline');
      expect(mission.requirements.deadline).toBeGreaterThan(0);
      expect(mission.rewards.credits).toBeGreaterThan(0);
    });

    it('should use mission-only cargo types, not tradeable goods', () => {
      for (let i = 0; i < 30; i++) {
        const mission = generateCargoRun(
          0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
        );
        expect(allMissionCargo).toContain(mission.missionCargo.good);
        expect(['grain', 'ore', 'tritium', 'parts']).not.toContain(
          mission.missionCargo.good
        );
      }
    });

    it('should include missionCargo object with good, quantity, and isIllegal', () => {
      const mission = generateCargoRun(
        0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
      );
      expect(mission.missionCargo).toBeDefined();
      expect(mission.missionCargo.good).toBeDefined();
      expect(mission.missionCargo.quantity).toBeGreaterThan(0);
      expect(typeof mission.missionCargo.isIllegal).toBe('boolean');
    });

    it('should use legal quantity range for legal cargo', () => {
      const rng = () => 0.01; // low rng forces legal + low quantity
      const mission = generateCargoRun(
        0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe', rng
      );
      if (!mission.missionCargo.isIllegal) {
        expect(mission.missionCargo.quantity).toBeGreaterThanOrEqual(
          MISSION_CONFIG.CARGO_RUN_LEGAL_QUANTITY.MIN
        );
        expect(mission.missionCargo.quantity).toBeLessThanOrEqual(
          MISSION_CONFIG.CARGO_RUN_LEGAL_QUANTITY.MAX
        );
      }
    });

    it('should use illegal quantity range for illegal cargo', () => {
      const rng = () => 0.99; // high rng forces illegal
      const mission = generateCargoRun(
        0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'dangerous', rng
      );
      if (mission.missionCargo.isIllegal) {
        expect(mission.missionCargo.quantity).toBeGreaterThanOrEqual(
          MISSION_CONFIG.CARGO_RUN_ILLEGAL_QUANTITY.MIN
        );
        expect(mission.missionCargo.quantity).toBeLessThanOrEqual(
          MISSION_CONFIG.CARGO_RUN_ILLEGAL_QUANTITY.MAX
        );
      }
    });

    it('should calculate distance-based reward (integer)', () => {
      for (let i = 0; i < 20; i++) {
        const mission = generateCargoRun(
          0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
        );
        expect(Number.isInteger(mission.rewards.credits)).toBe(true);
        expect(mission.rewards.credits).toBeGreaterThanOrEqual(
          MISSION_CONFIG.CARGO_RUN_BASE_FEE
        );
      }
    });

    it('should include merchants faction reward', () => {
      const mission = generateCargoRun(
        0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
      );
      expect(mission.rewards.faction).toBeDefined();
      expect(mission.rewards.faction.merchants).toBe(2);
    });

    it('should include outlaws faction reward for illegal cargo', () => {
      // Force illegal cargo
      const rng = () => 0.99;
      const mission = generateCargoRun(
        0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'dangerous', rng
      );
      if (mission.missionCargo.isIllegal) {
        expect(mission.rewards.faction.outlaws).toBe(3);
      }
    });

    it('should include failure penalties', () => {
      const mission = generateCargoRun(
        0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
      );
      expect(mission.penalties.failure.faction).toBeDefined();
      expect(mission.penalties.failure.faction.merchants).toBe(-2);
    });

    it('should generate destination that is a connected system', () => {
      const mission = generateCargoRun(
        0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
      );
      expect([1, 4, 7]).toContain(mission.requirements.destination);
    });

    it('should produce more illegal missions in dangerous zones', () => {
      let illegalCount = 0;
      const runs = 100;
      for (let i = 0; i < runs; i++) {
        const mission = generateCargoRun(
          0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'dangerous'
        );
        if (mission.missionCargo.isIllegal) illegalCount++;
      }
      // dangerous zone = 75% illegal chance, expect at least 50% to account for randomness
      expect(illegalCount).toBeGreaterThan(runs * 0.5);
    });
  });

  describe('generateMissionBoard', () => {
    it('should generate the configured number of missions', () => {
      const board = generateMissionBoard(
        0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
      );
      expect(board.length).toBeGreaterThan(0);
      expect(board.length).toBeLessThanOrEqual(3);
    });

    it('should generate unique mission IDs', () => {
      const board = generateMissionBoard(
        0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe'
      );
      const ids = board.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-generator.test.js`
Expected: FAIL — signature mismatch, `missionCargo` undefined

**Step 3: Write minimal implementation**

Rewrite `generateCargoRun` in `src/game/mission-generator.js`:

```js
import {
  MISSION_CONFIG,
  MISSION_CARGO_TYPES,
  NAVIGATION_CONFIG,
  PASSENGER_CONFIG,
} from './constants.js';

// ... getConnectedSystems and calculateDistance unchanged ...

export function generateCargoRun(
  fromSystem,
  starData,
  wormholeData,
  dangerZone = 'safe',
  rng = Math.random
) {
  const connectedIds = getConnectedSystems(fromSystem, wormholeData);
  if (connectedIds.length === 0) return null;

  const toSystem = connectedIds[Math.floor(rng() * connectedIds.length)];
  const fromStar = starData.find((s) => s.id === fromSystem);
  const destStar = starData.find((s) => s.id === toSystem);

  const distance =
    fromStar && destStar ? calculateDistance(fromStar, destStar) : 5;
  const deadline =
    Math.ceil(distance * 2) + MISSION_CONFIG.DEADLINE_BUFFER_DAYS;

  // Determine legal vs illegal based on zone
  const illegalChance =
    MISSION_CONFIG.CARGO_RUN_ZONE_ILLEGAL_CHANCE[dangerZone] || 0.15;
  const isIllegal = rng() < illegalChance;

  // Pick cargo type
  const cargoPool = isIllegal
    ? MISSION_CARGO_TYPES.illegal
    : MISSION_CARGO_TYPES.legal;
  const good = cargoPool[Math.floor(rng() * cargoPool.length)];

  // Pick quantity
  const qtyRange = isIllegal
    ? MISSION_CONFIG.CARGO_RUN_ILLEGAL_QUANTITY
    : MISSION_CONFIG.CARGO_RUN_LEGAL_QUANTITY;
  const qty = qtyRange.MIN + Math.floor(rng() * (qtyRange.MAX - qtyRange.MIN + 1));

  // Calculate distance-based reward
  const baseFee = isIllegal
    ? MISSION_CONFIG.CARGO_RUN_ILLEGAL_BASE_FEE
    : MISSION_CONFIG.CARGO_RUN_BASE_FEE;
  const perLyRate = isIllegal
    ? MISSION_CONFIG.CARGO_RUN_ILLEGAL_PER_LY_RATE
    : MISSION_CONFIG.CARGO_RUN_PER_LY_RATE;
  const reward = Math.ceil(baseFee + distance * perLyRate);

  // Build faction rewards
  const faction = { merchants: 2 };
  if (isIllegal) {
    faction.outlaws = 3;
  }

  // Build failure penalties
  const failureFaction = { merchants: -2 };
  if (isIllegal) {
    failureFaction.outlaws = -2;
  }

  const cargoLabel = good.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: `cargo_run_${Date.now()}_${Math.floor(rng() * 10000)}`,
    type: 'delivery',
    title: `Cargo Run: ${cargoLabel} to ${destStar ? destStar.name : `System ${toSystem}`}`,
    description: isIllegal
      ? 'Discreet delivery. No questions asked.'
      : 'Standard delivery contract.',
    giver: 'station_master',
    giverSystem: fromSystem,
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
  };
}
```

Also update `generateMissionBoard` to accept and pass `dangerZone`:

```js
export function generateMissionBoard(
  systemId,
  starData,
  wormholeData,
  dangerZone = 'safe',
  rng = Math.random
) {
  const board = [];
  for (let i = 0; i < MISSION_CONFIG.BOARD_SIZE; i++) {
    const isPassenger = rng() < 0.3;
    const mission = isPassenger
      ? generatePassengerMission(systemId, starData, wormholeData, rng)
      : generateCargoRun(systemId, starData, wormholeData, dangerZone, rng);
    if (mission) board.push(mission);
  }
  return board;
}
```

Remove the `BASE_PRICES` import if no longer used in this file.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-generator.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/mission-generator.js tests/unit/mission-generator.test.js
git commit -m "feat: rewrite cargo run generator with mission-only goods and distance-based rewards"
```

---

### Task 3: Add Cargo on Mission Accept

**Files:**
- Modify: `src/game/state/managers/mission.js:10-50`
- Test: `tests/unit/mission-accept-cargo.test.js`

**Context:** When a player accepts a cargo run, the mission cargo must be placed in `state.ship.cargo[]` with a `missionId` field. The cargo must take up hold space. The accept must fail if there isn't enough space.

**Step 1: Write the failing test**

Create `tests/unit/mission-accept-cargo.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('MissionManager.acceptMission – cargo run cargo placement', () => {
  let manager;
  let state;
  let mockGSM;

  beforeEach(() => {
    state = {
      player: { daysElapsed: 10 },
      ship: {
        cargo: [],
        cargoCapacity: 50,
      },
      missions: { active: [], board: [], completed: [], failed: [] },
    };

    mockGSM = {
      state,
      getState: () => state,
      getCargoRemaining: () => {
        const cargoUsed = state.ship.cargo.reduce((t, s) => t + s.qty, 0);
        const passengerSpace = state.missions.active
          .filter((m) => m.type === 'passenger' && m.requirements?.cargoSpace)
          .reduce((t, m) => t + m.requirements.cargoSpace, 0);
        return state.ship.cargoCapacity - cargoUsed - passengerSpace;
      },
      saveGame: vi.fn(),
      updateCargo: vi.fn((newCargo) => { state.ship.cargo = newCargo; }),
      emit: vi.fn(),
    };

    // Import dynamically to avoid module-level issues
    const { MissionManager } = require('../../src/game/state/managers/mission.js');
    manager = new MissionManager(mockGSM);
    manager.validateState = vi.fn();
    manager.getState = () => state;
    manager.emit = vi.fn();
  });

  it('should place mission cargo in hold on accept', () => {
    const mission = {
      id: 'cargo_run_123',
      type: 'delivery',
      requirements: { destination: 5, deadline: 10 },
      missionCargo: { good: 'sealed_containers', quantity: 10, isIllegal: false },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    };

    const result = manager.acceptMission(mission);

    expect(result.success).toBe(true);
    const cargoEntry = state.ship.cargo.find(
      (c) => c.good === 'sealed_containers' && c.missionId === 'cargo_run_123'
    );
    expect(cargoEntry).toBeDefined();
    expect(cargoEntry.qty).toBe(10);
    expect(cargoEntry.missionId).toBe('cargo_run_123');
    expect(cargoEntry.buyPrice).toBe(0);
  });

  it('should fail if not enough cargo space for mission cargo', () => {
    // Fill cargo to only 5 remaining
    state.ship.cargo = [{ good: 'ore', qty: 45, buyPrice: 15 }];

    const mission = {
      id: 'cargo_run_456',
      type: 'delivery',
      requirements: { destination: 5, deadline: 10 },
      missionCargo: { good: 'sealed_containers', quantity: 10, isIllegal: false },
      rewards: { credits: 200 },
      penalties: { failure: {} },
    };

    const result = manager.acceptMission(mission);

    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/cargo space/i);
  });

  it('should not place cargo for non-cargo-run missions', () => {
    const mission = {
      id: 'intel_123',
      type: 'intel',
      requirements: { targets: [5], deadline: 10 },
      rewards: { credits: 100 },
      penalties: { failure: {} },
    };

    const result = manager.acceptMission(mission);

    expect(result.success).toBe(true);
    expect(state.ship.cargo).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-accept-cargo.test.js`
Expected: FAIL — cargo not placed in hold

**Step 3: Write minimal implementation**

In `src/game/state/managers/mission.js`, modify `acceptMission()` to add cargo space check and cargo placement for delivery missions with `missionCargo`:

After the existing passenger cargo space check (line ~37), add:

```js
// Check cargo space for cargo run missions
if (mission.missionCargo) {
  if (
    mission.missionCargo.quantity >
    this.gameStateManager.getCargoRemaining()
  ) {
    return {
      success: false,
      reason: 'Not enough cargo space for mission cargo.',
    };
  }
}
```

After pushing to `state.missions.active` (line ~45), add:

```js
// Place mission cargo in hold for cargo run missions
if (mission.missionCargo) {
  state.ship.cargo.push({
    good: mission.missionCargo.good,
    qty: mission.missionCargo.quantity,
    buyPrice: 0,
    missionId: mission.id,
  });
  this.emit('cargoChanged', state.ship.cargo);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/mission-accept-cargo.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/mission.js tests/unit/mission-accept-cargo.test.js
git commit -m "feat: place mission cargo in hold on cargo run accept"
```

---

### Task 4: Remove Mission Cargo by missionId on Complete

**Files:**
- Modify: `src/game/state/managers/mission.js:68-86, 171-180`
- Modify: `src/game/state/managers/ship.js:693-717`
- Test: `tests/unit/mission-completion.test.js` (update existing)

**Context:** Currently `completeMission` checks for `mission.requirements.cargo` (a tradeable good name) and calls `removeCargoForMission(goodType, quantity)`. For the new system, delivery missions with `missionCargo` should remove cargo by `missionId` instead. The destination check stays, but the cargo-in-hold check should look for `missionId`-tagged cargo.

**Step 1: Write the failing test**

Add tests to `tests/unit/mission-completion.test.js` (or create new file `tests/unit/cargo-run-completion.test.js`):

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Cargo Run Mission Completion', () => {
  let manager;
  let state;
  let mockGSM;

  beforeEach(() => {
    state = {
      player: { credits: 500, daysElapsed: 10, currentSystem: 5 },
      ship: {
        cargo: [
          { good: 'sealed_containers', qty: 10, buyPrice: 0, missionId: 'cargo_run_123' },
        ],
      },
      missions: {
        active: [
          {
            id: 'cargo_run_123',
            type: 'delivery',
            requirements: { destination: 5, deadline: 20 },
            deadlineDay: 20,
            missionCargo: { good: 'sealed_containers', quantity: 10, isIllegal: false },
            rewards: { credits: 200, faction: { merchants: 2 } },
            penalties: { failure: { faction: { merchants: -2 } } },
          },
        ],
        completed: [],
        failed: [],
        board: [],
      },
    };

    mockGSM = {
      state,
      getState: () => state,
      saveGame: vi.fn(),
      modifyFactionRep: vi.fn(),
      modifyRep: vi.fn(),
      modifyKarma: vi.fn(),
      removeCargoForMission: vi.fn(() => ({ success: true })),
      emit: vi.fn(),
    };

    const { MissionManager } = require('../../src/game/state/managers/mission.js');
    manager = new MissionManager(mockGSM);
    manager.validateState = vi.fn();
    manager.getState = () => state;
    manager.emit = vi.fn();
  });

  it('should remove mission cargo by missionId on completion', () => {
    const result = manager.completeMission('cargo_run_123');

    expect(result.success).toBe(true);
    const missionCargo = state.ship.cargo.find(
      (c) => c.missionId === 'cargo_run_123'
    );
    expect(missionCargo).toBeUndefined();
  });

  it('should award credits on completion', () => {
    manager.completeMission('cargo_run_123');
    expect(state.player.credits).toBe(700);
  });

  it('should award faction rep on completion', () => {
    manager.completeMission('cargo_run_123');
    expect(mockGSM.modifyFactionRep).toHaveBeenCalledWith(
      'merchants', 2, 'mission'
    );
  });

  it('should fail if mission cargo is not in hold', () => {
    state.ship.cargo = []; // remove the mission cargo

    const result = manager.completeMission('cargo_run_123');
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/cargo/i);
  });

  it('should not require old-style cargo field for new cargo runs', () => {
    // Ensure we don't check mission.requirements.cargo for new-style missions
    const result = manager.completeMission('cargo_run_123');
    expect(result.success).toBe(true);
    // removeCargoForMission should NOT be called for new-style missions
    expect(mockGSM.removeCargoForMission).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/cargo-run-completion.test.js`
Expected: FAIL — cargo not removed by missionId

**Step 3: Write minimal implementation**

In `mission.js`, update the delivery completion block (lines 68-86):

Replace the delivery cargo check:
```js
if (mission.type === 'delivery') {
  if (mission.requirements.destination !== state.player.currentSystem) {
    return {
      success: false,
      reason: 'You are not at the mission destination.',
    };
  }
  // New-style cargo runs: check missionId-tagged cargo
  if (mission.missionCargo) {
    const hasMissionCargo = state.ship.cargo.some(
      (c) => c.missionId === mission.id
    );
    if (!hasMissionCargo) {
      return {
        success: false,
        reason: 'Mission cargo is no longer in your hold.',
      };
    }
  } else if (mission.requirements.cargo) {
    // Legacy: old-style cargo runs (backwards compat for existing saves)
    const totalCargo = state.ship.cargo
      .filter((c) => c.good === mission.requirements.cargo)
      .reduce((sum, c) => sum + c.qty, 0);
    if (totalCargo < mission.requirements.quantity) {
      return {
        success: false,
        reason: `Not enough ${mission.requirements.cargo} in cargo.`,
      };
    }
  }
}
```

Update the cargo removal block (lines 171-180):

```js
// Remove delivered cargo for delivery/fetch missions
if (mission.type === 'delivery' && mission.missionCargo) {
  // New-style: remove by missionId
  state.ship.cargo = state.ship.cargo.filter(
    (c) => c.missionId !== mission.id
  );
  this.emit('cargoChanged', state.ship.cargo);
} else if (
  (mission.type === 'delivery' || mission.type === 'fetch') &&
  mission.requirements.cargo
) {
  // Legacy: remove by good type and quantity
  this.gameStateManager.removeCargoForMission(
    mission.requirements.cargo,
    mission.requirements.quantity
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/cargo-run-completion.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All existing tests pass (check mission-completion.test.js still passes)

**Step 6: Commit**

```bash
git add src/game/state/managers/mission.js tests/unit/cargo-run-completion.test.js
git commit -m "feat: remove mission cargo by missionId on completion"
```

---

### Task 5: Block Selling Mission Cargo

**Files:**
- Modify: `src/game/state/managers/trading.js:77-122`
- Modify: `src/features/trade/TradePanel.jsx:282-310`
- Test: `tests/unit/cargo-run-sell-block.test.js`

**Context:** The `sellGood` method takes a `stackIndex`. We need to check if the stack at that index has a `missionId` and refuse the sale. The UI should also hide sell buttons for mission cargo.

**Step 1: Write the failing test**

Create `tests/unit/cargo-run-sell-block.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Trading – mission cargo sell block', () => {
  let manager;
  let state;
  let mockGSM;

  beforeEach(() => {
    state = {
      player: { credits: 500, currentSystem: 0 },
      ship: {
        cargo: [
          { good: 'ore', qty: 10, buyPrice: 15 },
          { good: 'sealed_containers', qty: 8, buyPrice: 0, missionId: 'cargo_run_123' },
        ],
      },
      world: { marketConditions: {} },
    };

    mockGSM = {
      state,
      getState: () => state,
      updateCredits: vi.fn(),
      updateCargo: vi.fn(),
      getCurrentSystem: () => ({ name: 'Sol' }),
      getCargoRemaining: () => 30,
      saveGame: vi.fn(),
      emit: vi.fn(),
    };

    const { TradingManager } = require('../../src/game/state/managers/trading.js');
    manager = new TradingManager(mockGSM);
    manager.validateState = vi.fn();
    manager.getState = () => state;
    manager.emit = vi.fn();
  });

  it('should block selling cargo with a missionId', () => {
    const result = manager.sellGood(1, 5, 100); // stack index 1 = mission cargo

    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/mission/i);
  });

  it('should allow selling regular cargo', () => {
    const result = manager.sellGood(0, 5, 20); // stack index 0 = regular ore

    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/cargo-run-sell-block.test.js`
Expected: FAIL — mission cargo sale succeeds

**Step 3: Write minimal implementation**

In `src/game/state/managers/trading.js`, add a check at the start of `sellGood` (after the stack validation at line ~88):

```js
// Block selling mission cargo
if (stack.missionId) {
  return { success: false, reason: 'Mission cargo cannot be sold' };
}
```

In `src/features/trade/TradePanel.jsx`, update the cargo stack rendering (around line 272) to skip sell buttons for mission cargo:

```jsx
{!stack.missionId && (
  <div className="stack-actions">
    <button ... >Sell 1</button>
    <button ... >Sell All</button>
    ...
  </div>
)}
{stack.missionId && (
  <div className="stack-actions">
    <span className="mission-cargo-label">Mission Cargo</span>
  </div>
)}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/cargo-run-sell-block.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/trading.js src/features/trade/TradePanel.jsx tests/unit/cargo-run-sell-block.test.js
git commit -m "feat: block selling mission cargo in trade panel"
```

---

### Task 6: Customs Integration for Illegal Mission Cargo

**Files:**
- Modify: `src/game/state/managers/danger.js:338-350`
- Test: `tests/unit/cargo-run-customs.test.js`

**Context:** `countRestrictedGoods` checks `cargo` items against zone restrictions. Illegal mission cargo should ALWAYS count as restricted regardless of zone (it's universally illegal). Check for `missionId` + the good being in `MISSION_CARGO_TYPES.illegal`.

**Step 1: Write the failing test**

Create `tests/unit/cargo-run-customs.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MISSION_CARGO_TYPES } from '../../src/game/constants.js';

describe('Customs – illegal mission cargo detection', () => {
  let manager;

  beforeEach(() => {
    const { DangerManager } = require('../../src/game/state/managers/danger.js');
    manager = new DangerManager({
      state: {},
      getState: () => ({}),
      emit: vi.fn(),
    });
  });

  it('should count illegal mission cargo as restricted', () => {
    const cargo = [
      { good: 'unmarked_crates', qty: 5, missionId: 'cargo_run_1' },
    ];
    const count = manager.countRestrictedGoods(cargo, 'safe', 0);
    expect(count).toBeGreaterThan(0);
  });

  it('should not count legal mission cargo as restricted', () => {
    const cargo = [
      { good: 'sealed_containers', qty: 10, missionId: 'cargo_run_2' },
    ];
    const count = manager.countRestrictedGoods(cargo, 'safe', 0);
    // sealed_containers is legal, should not be counted
    // (unless zone restrictions apply to other goods in cargo)
    expect(count).toBe(0);
  });

  it('should count both regular restricted goods and illegal mission cargo', () => {
    const cargo = [
      { good: 'electronics', qty: 5 }, // restricted in safe zone
      { good: 'prohibited_tech', qty: 3, missionId: 'cargo_run_3' },
    ];
    const count = manager.countRestrictedGoods(cargo, 'safe', 0);
    expect(count).toBe(2); // electronics + prohibited_tech
  });

  it('should count all illegal mission cargo types', () => {
    for (const illegalGood of MISSION_CARGO_TYPES.illegal) {
      const cargo = [{ good: illegalGood, qty: 1, missionId: 'test' }];
      const count = manager.countRestrictedGoods(cargo, 'safe', 99);
      expect(count).toBeGreaterThan(0);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/cargo-run-customs.test.js`
Expected: FAIL — illegal mission cargo not counted

**Step 3: Write minimal implementation**

In `src/game/state/managers/danger.js`, update `countRestrictedGoods` (line ~338):

Add import at top: `import { MISSION_CARGO_TYPES } from '../../constants.js';`

```js
countRestrictedGoods(cargo, zone, systemId) {
  const zoneRestrictions =
    RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[zone] || [];

  const coreRestrictions =
    systemId === SOL_SYSTEM_ID || systemId === ALPHA_CENTAURI_SYSTEM_ID
      ? RESTRICTED_GOODS_CONFIG.CORE_SYSTEM_RESTRICTED
      : [];

  const allRestricted = [...zoneRestrictions, ...coreRestrictions];

  return cargo.filter((item) => {
    // Regular restricted goods
    if (allRestricted.includes(item.good)) return true;
    // Illegal mission cargo is always restricted
    if (item.missionId && MISSION_CARGO_TYPES.illegal.includes(item.good)) return true;
    return false;
  }).length;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/cargo-run-customs.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All existing inspection/danger tests still pass

**Step 6: Commit**

```bash
git add src/game/state/managers/danger.js tests/unit/cargo-run-customs.test.js
git commit -m "feat: count illegal mission cargo as restricted for customs"
```

---

### Task 7: Mission Failure on Cargo Confiscation

**Files:**
- Modify: `src/features/danger/applyEncounterOutcome.js:62-73`
- Test: `tests/unit/cargo-run-confiscation.test.js`

**Context:** When `applyEncounterOutcome` processes `restrictedGoodsConfiscated: true` or `cargoLoss: true`, it removes cargo. If any removed cargo had a `missionId`, those missions should be failed. The `applyEncounterOutcome` function already handles cargo removal (lines 62-73). After cargo removal, check for active missions whose cargo was lost.

**Step 1: Write the failing test**

Create `tests/unit/cargo-run-confiscation.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyEncounterOutcome } from '../../src/features/danger/applyEncounterOutcome.js';

describe('Cargo confiscation – mission failure', () => {
  let mockGSM;
  let state;

  beforeEach(() => {
    state = {
      player: { credits: 500, daysElapsed: 10, factions: {} },
      ship: {
        fuel: 80,
        hull: 100,
        engine: 100,
        lifeSupport: 100,
        cargo: [
          { good: 'ore', qty: 10, buyPrice: 15 },
          { good: 'unmarked_crates', qty: 5, buyPrice: 0, missionId: 'cargo_run_99' },
        ],
        hiddenCargo: [],
      },
      missions: {
        active: [
          {
            id: 'cargo_run_99',
            type: 'delivery',
            missionCargo: { good: 'unmarked_crates', quantity: 5, isIllegal: true },
            penalties: { failure: { faction: { merchants: -2, outlaws: -2 } } },
          },
        ],
        completed: [],
        failed: [],
      },
    };

    mockGSM = {
      state,
      getState: () => state,
      updateFuel: vi.fn(),
      updateShipCondition: vi.fn(),
      updateCredits: vi.fn(),
      updateCargo: vi.fn((newCargo) => { state.ship.cargo = newCargo; }),
      updateTime: vi.fn(),
      saveGame: vi.fn(),
      emit: vi.fn(),
      modifyFactionRep: vi.fn(),
      modifyKarma: vi.fn(),
      abandonMission: vi.fn(),
      failMissionsDueToCargoLoss: vi.fn(),
    };
  });

  it('should call failMissionsDueToCargoLoss after cargo loss', () => {
    const outcome = {
      costs: { cargoLoss: true, restrictedGoodsConfiscated: true },
      rewards: {},
    };

    applyEncounterOutcome(mockGSM, outcome);

    expect(mockGSM.failMissionsDueToCargoLoss).toHaveBeenCalled();
  });

  it('should call failMissionsDueToCargoLoss after partial cargo loss', () => {
    const outcome = {
      costs: { cargoPercent: 50 },
      rewards: {},
    };

    applyEncounterOutcome(mockGSM, outcome);

    expect(mockGSM.failMissionsDueToCargoLoss).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/cargo-run-confiscation.test.js`
Expected: FAIL — `failMissionsDueToCargoLoss` not called

**Step 3: Write minimal implementation**

In `applyEncounterOutcome.js`, after the cargo loss/percent blocks (after line ~73), add:

```js
// Fail missions whose cargo was lost or confiscated
if (
  outcome.costs.cargoLoss ||
  outcome.costs.cargoPercent ||
  outcome.costs.restrictedGoodsConfiscated
) {
  if (typeof gameStateManager.failMissionsDueToCargoLoss === 'function') {
    gameStateManager.failMissionsDueToCargoLoss();
  }
}
```

Then add `failMissionsDueToCargoLoss` method to `MissionManager` and delegate from `GameStateManager`:

In `src/game/state/managers/mission.js`:

```js
failMissionsDueToCargoLoss() {
  this.validateState();
  const state = this.getState();

  const toFail = [];
  const toKeep = [];

  for (const mission of state.missions.active) {
    if (mission.missionCargo) {
      // Check if this mission's cargo is still in the hold
      const hasCargo = state.ship.cargo.some(
        (c) => c.missionId === mission.id
      );
      if (!hasCargo) {
        toFail.push(mission);
      } else {
        toKeep.push(mission);
      }
    } else {
      toKeep.push(mission);
    }
  }

  if (toFail.length === 0) return;

  state.missions.active = toKeep;

  for (const mission of toFail) {
    state.missions.failed.push(mission.id);

    if (mission.penalties && mission.penalties.failure) {
      if (mission.penalties.failure.faction) {
        for (const [faction, amount] of Object.entries(
          mission.penalties.failure.faction
        )) {
          this.gameStateManager.modifyFactionRep(
            faction, amount, 'mission_cargo_confiscated'
          );
        }
      }
    }
  }

  this.emit('missionsChanged', { ...state.missions });
}
```

Add delegation in `game-state-manager.js`:

```js
failMissionsDueToCargoLoss() {
  return this.missionManager.failMissionsDueToCargoLoss();
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/cargo-run-confiscation.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 6: Commit**

```bash
git add src/features/danger/applyEncounterOutcome.js src/game/state/managers/mission.js src/game/state/game-state-manager.js tests/unit/cargo-run-confiscation.test.js
git commit -m "feat: fail cargo run missions when cargo is confiscated"
```

---

### Task 8: Pass dangerZone to refreshMissionBoard

**Files:**
- Modify: `src/game/state/managers/mission.js:324-347`
- Test: verify via existing + mission-generator tests

**Context:** `refreshMissionBoard` calls `generateMissionBoard` but doesn't pass `dangerZone`. It needs to get the zone for the current system from `DangerManager`.

**Step 1: Write the failing test**

Add to an appropriate test file (e.g., `tests/unit/mission-board-refresh.test.js`):

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('MissionManager.refreshMissionBoard – passes dangerZone', () => {
  let manager;
  let state;

  beforeEach(() => {
    state = {
      player: { daysElapsed: 5, currentSystem: 0 },
      missions: { active: [], board: [], boardLastRefresh: -1, completed: [], failed: [] },
    };

    const mockGSM = {
      state,
      getState: () => state,
      starData: [
        { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
        { id: 1, x: -23, y: -19, z: -53, name: 'Alpha Centauri A' },
      ],
      wormholeData: [[0, 1]],
      getDangerZone: vi.fn(() => 'safe'),
      saveGame: vi.fn(),
      emit: vi.fn(),
    };

    const { MissionManager } = require('../../src/game/state/managers/mission.js');
    manager = new MissionManager(mockGSM);
    manager.validateState = vi.fn();
    manager.getState = () => state;
    manager.emit = vi.fn();
  });

  it('should generate a mission board without errors', () => {
    const board = manager.refreshMissionBoard();
    expect(board).toBeDefined();
    expect(Array.isArray(board)).toBe(true);
  });
});
```

**Step 2: Run and verify**

Run: `npm test -- tests/unit/mission-board-refresh.test.js`

**Step 3: Write minimal implementation**

In `mission.js`, update `refreshMissionBoard` (line ~336):

```js
const dangerZone = this.gameStateManager.getDangerZone(
  state.player.currentSystem
);

const board = generateMissionBoard(
  state.player.currentSystem,
  this.gameStateManager.starData,
  this.gameStateManager.wormholeData,
  dangerZone
);
```

**Step 4: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/mission.js tests/unit/mission-board-refresh.test.js
git commit -m "feat: pass danger zone to mission board generation"
```

---

### Task 9: Update MissionBoardPanel UI

**Files:**
- Modify: `src/features/missions/MissionBoardPanel.jsx:32-66`

**Context:** The panel currently shows "Deliver: {quantity} {cargo}" for non-passenger missions. For the new cargo runs, it should show the cargo type name (formatted), quantity, and an indicator for illegal cargo.

**Step 1: Update the panel**

Replace the delivery display section (lines 50-55):

```jsx
{mission.missionCargo ? (
  <>
    <div>
      Cargo: {mission.missionCargo.quantity}{' '}
      {mission.missionCargo.good
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())}
    </div>
    {mission.missionCargo.isIllegal && (
      <div className="illegal-warning">Discreet Delivery</div>
    )}
  </>
) : mission.requirements?.cargo ? (
  <div>
    Deliver: {mission.requirements.quantity}{' '}
    {mission.requirements.cargo}
  </div>
) : null}
```

**Step 2: Manual UAT check**

Run `npm run dev` and check the mission board in-game to verify display.

**Step 3: Commit**

```bash
git add src/features/missions/MissionBoardPanel.jsx
git commit -m "feat: display mission cargo type and illegal indicator on mission board"
```

---

### Task 10: Update getCompletableMissions

**Files:**
- Modify: `src/game/state/managers/mission.js:349-386`

**Context:** `getCompletableMissions` checks if delivery missions have the right cargo in hold. For new-style missions with `missionCargo`, it should check for `missionId`-tagged cargo instead.

**Step 1: Write the failing test**

```js
describe('getCompletableMissions – new cargo runs', () => {
  it('should include delivery mission when mission cargo is in hold at destination', () => {
    state.player.currentSystem = 5;
    state.ship.cargo = [
      { good: 'sealed_containers', qty: 10, missionId: 'cargo_run_123' },
    ];
    state.missions.active = [
      {
        id: 'cargo_run_123',
        type: 'delivery',
        requirements: { destination: 5 },
        missionCargo: { good: 'sealed_containers', quantity: 10 },
      },
    ];

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(1);
    expect(completable[0].id).toBe('cargo_run_123');
  });

  it('should not include delivery mission when mission cargo was lost', () => {
    state.player.currentSystem = 5;
    state.ship.cargo = []; // cargo lost
    state.missions.active = [
      {
        id: 'cargo_run_123',
        type: 'delivery',
        requirements: { destination: 5 },
        missionCargo: { good: 'sealed_containers', quantity: 10 },
      },
    ];

    const completable = manager.getCompletableMissions();
    expect(completable).toHaveLength(0);
  });
});
```

**Step 2: Implement**

In `getCompletableMissions`, update the delivery branch:

```js
if (mission.type === 'delivery') {
  if (mission.requirements.destination !== state.player.currentSystem)
    return false;
  if (mission.missionCargo) {
    return state.ship.cargo.some((c) => c.missionId === mission.id);
  }
  if (mission.requirements.cargo) {
    const totalCargo = state.ship.cargo
      .filter((c) => c.good === mission.requirements.cargo)
      .reduce((sum, c) => sum + c.qty, 0);
    return totalCargo >= mission.requirements.quantity;
  }
  return true;
}
```

**Step 3: Run tests and commit**

Run: `npm test`

```bash
git add src/game/state/managers/mission.js tests/unit/cargo-run-completable.test.js
git commit -m "feat: getCompletableMissions checks missionId-tagged cargo"
```

---

### Task 11: Update State Validators

**Files:**
- Modify: `src/game/state/state-validators.js:42-76`

**Context:** `validateAndRepairCargoStacks` warns about missing `buyPrice`. For mission cargo (which has `missionId`), `buyPrice: 0` is valid. The validator should accept `missionId` as an optional field and not warn about `buyPrice: 0` when `missionId` is present.

**Step 1: Verify current behavior doesn't break**

Run: `npm test`

**Step 2: Update validator** (no test needed — validator is defensive)

In `validateAndRepairCargoStacks`, after the existing field checks, accept `missionId`:

```js
// missionId is optional — present on mission cargo, absent on trade cargo
// No validation needed beyond type check
if (cargoStack.missionId !== undefined && typeof cargoStack.missionId !== 'string') {
  devWarn(`${compartmentType} stack has invalid missionId, removing:`, cargoStack.missionId);
  delete cargoStack.missionId;
}
```

**Step 3: Commit**

```bash
git add src/game/state/state-validators.js
git commit -m "feat: state validator accepts missionId on cargo stacks"
```

---

### Task 12: Mission Cargo Abandoned on Mission Abandon

**Files:**
- Modify: `src/game/state/managers/mission.js:237-276`

**Context:** When a player abandons a mission, mission cargo should be removed from the hold.

**Step 1: Write the failing test**

```js
it('should remove mission cargo from hold when abandoning a cargo run', () => {
  state.ship.cargo = [
    { good: 'sealed_containers', qty: 10, missionId: 'cargo_run_123' },
    { good: 'ore', qty: 5, buyPrice: 15 },
  ];
  state.missions.active = [
    {
      id: 'cargo_run_123',
      type: 'delivery',
      missionCargo: { good: 'sealed_containers', quantity: 10 },
      penalties: { failure: {} },
    },
  ];

  manager.abandonMission('cargo_run_123');

  expect(state.ship.cargo).toHaveLength(1);
  expect(state.ship.cargo[0].good).toBe('ore');
});
```

**Step 2: Implement**

In `abandonMission`, after splicing the mission from active (line ~253), add:

```js
// Remove mission cargo from hold
if (mission.missionCargo) {
  state.ship.cargo = state.ship.cargo.filter(
    (c) => c.missionId !== mission.id
  );
  this.emit('cargoChanged', state.ship.cargo);
}
```

**Step 3: Run tests and commit**

Run: `npm test`

```bash
git add src/game/state/managers/mission.js tests/unit/cargo-run-abandon.test.js
git commit -m "feat: remove mission cargo from hold on mission abandon"
```

---

### Task 13: Mission Cargo Removed on Deadline Expiry

**Files:**
- Modify: `src/game/state/managers/mission.js:278-322`

**Context:** `checkMissionDeadlines` expires missions past their deadline. Expired cargo run missions should have their cargo removed from the hold.

**Step 1: Write the failing test**

```js
it('should remove mission cargo from hold when deadline expires', () => {
  state.player.daysElapsed = 25; // past deadline
  state.ship.cargo = [
    { good: 'unmarked_crates', qty: 5, missionId: 'cargo_run_expired' },
  ];
  state.missions.active = [
    {
      id: 'cargo_run_expired',
      type: 'delivery',
      deadlineDay: 20,
      missionCargo: { good: 'unmarked_crates', quantity: 5, isIllegal: true },
      penalties: { failure: { faction: { merchants: -2 } } },
    },
  ];

  manager.checkMissionDeadlines();

  expect(state.ship.cargo).toHaveLength(0);
  expect(state.missions.failed).toContain('cargo_run_expired');
});
```

**Step 2: Implement**

In `checkMissionDeadlines`, in the expired loop (line ~301), add after `state.missions.failed.push(mission.id)`:

```js
// Remove mission cargo from hold
if (mission.missionCargo) {
  state.ship.cargo = state.ship.cargo.filter(
    (c) => c.missionId !== mission.id
  );
  cargoChanged = true;
}
```

And after the loop, emit if needed:

```js
if (cargoChanged) {
  this.emit('cargoChanged', state.ship.cargo);
}
```

Initialize `let cargoChanged = false;` before the loop.

**Step 3: Run tests and commit**

Run: `npm test`

```bash
git add src/game/state/managers/mission.js tests/unit/cargo-run-deadline.test.js
git commit -m "feat: remove mission cargo from hold on deadline expiry"
```

---

### Task 14: Full Test Suite Verification

**Step 1: Run full test suite**

Run: `npm test`
Expected: ALL PASS

**Step 2: Run linting**

Run: `npm run lint`
Expected: No errors

**Step 3: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix: address any remaining test/lint issues"
```
