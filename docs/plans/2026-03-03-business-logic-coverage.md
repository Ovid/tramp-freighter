# Business Logic Coverage Hardening

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Cover the riskiest untested business logic paths — restricted goods trading, cargo stack operations, cannibalize repair, mission cargo-loss penalties, and save-load error recovery.

**Architecture:** All tests are unit tests against manager classes and static methods. No UI/React rendering. Each test file uses `createTestGameStateManager()` from `tests/test-utils.js` and calls manager methods directly. Console warnings are mocked to keep output clean.

**Tech Stack:** vitest, `createTestGameStateManager()`, `vi.spyOn(console, ...)`

**Run command:** `npm test -- tests/unit/<test-file>.js`

---

### Task 1: Restricted Goods — `isGoodRestricted`, `calculateSellPrice`, `canSellGood`

These three methods in `src/game/state/managers/trading.js:443-517` are the restricted goods economy. Zero test coverage. A bug here means players can sell contraband freely or prices are wrong.

**Files:**
- Create: `tests/unit/trading-restricted-goods.test.js`
- Reference: `src/game/state/managers/trading.js:443-517`
- Reference: `src/game/constants.js` (RESTRICTED_GOODS_CONFIG, SOL_SYSTEM_ID, ALPHA_CENTAURI_SYSTEM_ID)

**Step 1: Write the failing tests**

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import {
  RESTRICTED_GOODS_CONFIG,
  SOL_SYSTEM_ID,
  ALPHA_CENTAURI_SYSTEM_ID,
} from '@game/constants.js';

describe('TradingManager restricted goods', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  describe('isGoodRestricted', () => {
    it('returns true for zone-restricted goods in matching danger zone', () => {
      // Find a zone that has restrictions
      const [zone, goods] = Object.entries(
        RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS
      ).find(([, g]) => g.length > 0);

      // Find a system in that danger zone
      const state = gsm.getState();
      let targetSystemId = null;
      for (const star of state.starData || []) {
        if (gsm.getDangerZone(star.id) === zone) {
          targetSystemId = star.id;
          break;
        }
      }

      // If no system found in that zone, use a direct approach:
      // mock getDangerZone to return the zone for system 5
      if (targetSystemId === null) {
        targetSystemId = 5;
        vi.spyOn(gsm, 'getDangerZone').mockReturnValue(zone);
      }

      const result = gsm.tradingManager.isGoodRestricted(
        goods[0],
        targetSystemId
      );
      expect(result).toBe(true);
    });

    it('returns true for core-system-restricted goods in Sol', () => {
      if (RESTRICTED_GOODS_CONFIG.CORE_SYSTEM_RESTRICTED.length === 0) return;

      const goodType = RESTRICTED_GOODS_CONFIG.CORE_SYSTEM_RESTRICTED[0];
      const result = gsm.tradingManager.isGoodRestricted(
        goodType,
        SOL_SYSTEM_ID
      );
      expect(result).toBe(true);
    });

    it('returns true for core-system-restricted goods in Alpha Centauri', () => {
      if (RESTRICTED_GOODS_CONFIG.CORE_SYSTEM_RESTRICTED.length === 0) return;

      const goodType = RESTRICTED_GOODS_CONFIG.CORE_SYSTEM_RESTRICTED[0];
      const result = gsm.tradingManager.isGoodRestricted(
        goodType,
        ALPHA_CENTAURI_SYSTEM_ID
      );
      expect(result).toBe(true);
    });

    it('returns false for non-restricted goods in safe zones', () => {
      // Use a good that's not in any restriction list
      const result = gsm.tradingManager.isGoodRestricted('food', SOL_SYSTEM_ID);
      expect(result).toBe(false);
    });
  });

  describe('calculateSellPrice', () => {
    it('returns base price when good is restricted in that system', () => {
      // Mock isGoodRestricted to return true
      vi.spyOn(gsm.tradingManager, 'isGoodRestricted').mockReturnValue(true);

      const result = gsm.tradingManager.calculateSellPrice('weapons', 0, 100);
      expect(result).toBe(100);
    });

    it('applies premium multiplier when good is restricted elsewhere but legal here', () => {
      vi.spyOn(gsm.tradingManager, 'isGoodRestricted').mockReturnValue(false);
      vi.spyOn(gsm.tradingManager, 'isGoodRestrictedAnywhere').mockReturnValue(
        true
      );

      const basePrice = 100;
      const result = gsm.tradingManager.calculateSellPrice(
        'weapons',
        5,
        basePrice
      );
      expect(result).toBe(
        basePrice * RESTRICTED_GOODS_CONFIG.PRICE_MULTIPLIERS.PREMIUM_MULTIPLIER
      );
    });

    it('returns base price for non-restricted goods', () => {
      vi.spyOn(gsm.tradingManager, 'isGoodRestricted').mockReturnValue(false);
      vi.spyOn(gsm.tradingManager, 'isGoodRestrictedAnywhere').mockReturnValue(
        false
      );

      const result = gsm.tradingManager.calculateSellPrice('food', 0, 100);
      expect(result).toBe(100);
    });
  });

  describe('canSellGood', () => {
    it('blocks sale in restricted zone without black market contact', () => {
      vi.spyOn(gsm.tradingManager, 'isGoodRestricted').mockReturnValue(true);

      const result = gsm.tradingManager.canSellGood('weapons', 0, false);
      expect(result).toBe(false);
    });

    it('allows sale in restricted zone with black market contact', () => {
      vi.spyOn(gsm.tradingManager, 'isGoodRestricted').mockReturnValue(true);

      const result = gsm.tradingManager.canSellGood('weapons', 0, true);
      expect(result).toBe(true);
    });

    it('allows sale in non-restricted zone without black market contact', () => {
      vi.spyOn(gsm.tradingManager, 'isGoodRestricted').mockReturnValue(false);

      const result = gsm.tradingManager.canSellGood('food', 5, false);
      expect(result).toBe(true);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/trading-restricted-goods.test.js`
Expected: FAIL — tests reference real methods for the first time

**Step 3: Fix any test setup issues and verify all pass**

The tests should pass immediately since they call real methods. If any fail, fix the test setup (e.g., wrong property names, missing mock). Do NOT modify source code.

Run: `npm test -- tests/unit/trading-restricted-goods.test.js`
Expected: All 9 tests PASS

**Step 4: Commit**

```
git add tests/unit/trading-restricted-goods.test.js
git commit -m "test: cover restricted goods trading — isGoodRestricted, calculateSellPrice, canSellGood"
```

---

### Task 2: Cargo Stack Operations — `addCargoStack`, `removeFromCargoStack`

Static methods on `TradingSystem` in `src/game/game-trading.js:438-496`. These mutate the cargo array. A bug here means players lose cargo or get duplicate stacks.

**Files:**
- Create: `tests/unit/cargo-stack-operations.test.js`
- Reference: `src/game/game-trading.js:438-496`

**Step 1: Write the failing tests**

```js
import { describe, it, expect } from 'vitest';
import { TradingSystem } from '@game/game-trading.js';

describe('TradingSystem.addCargoStack', () => {
  it('consolidates into existing stack with same good and price', () => {
    const cargo = [{ good: 'ore', qty: 5, buyPrice: 10 }];
    const result = TradingSystem.addCargoStack(cargo, 'ore', 3, 10);

    expect(result).toHaveLength(1);
    expect(result[0].qty).toBe(8);
    expect(result[0].buyPrice).toBe(10);
  });

  it('creates new stack when price differs', () => {
    const cargo = [{ good: 'ore', qty: 5, buyPrice: 10 }];
    const result = TradingSystem.addCargoStack(cargo, 'ore', 3, 15);

    expect(result).toHaveLength(2);
    expect(result[1].qty).toBe(3);
    expect(result[1].buyPrice).toBe(15);
  });

  it('creates new stack when good type differs', () => {
    const cargo = [{ good: 'ore', qty: 5, buyPrice: 10 }];
    const result = TradingSystem.addCargoStack(cargo, 'food', 2, 10);

    expect(result).toHaveLength(2);
    expect(result[1].good).toBe('food');
  });

  it('adds metadata when systemId, systemName, and day are provided', () => {
    const result = TradingSystem.addCargoStack([], 'ore', 5, 10, 3, 'Sirius', 42);

    expect(result[0].buySystem).toBe(3);
    expect(result[0].buySystemName).toBe('Sirius');
    expect(result[0].buyDate).toBe(42);
  });

  it('omits metadata fields when arguments are null', () => {
    const result = TradingSystem.addCargoStack([], 'ore', 5, 10, null, null, null);

    expect(result[0]).not.toHaveProperty('buySystem');
    expect(result[0]).not.toHaveProperty('buySystemName');
    expect(result[0]).not.toHaveProperty('buyDate');
  });

  it('does not mutate the original cargo array', () => {
    const cargo = [{ good: 'ore', qty: 5, buyPrice: 10 }];
    TradingSystem.addCargoStack(cargo, 'food', 2, 10);

    expect(cargo).toHaveLength(1);
  });
});

describe('TradingSystem.removeFromCargoStack', () => {
  it('decrements quantity from the specified stack', () => {
    const cargo = [{ good: 'ore', qty: 5, buyPrice: 10 }];
    const result = TradingSystem.removeFromCargoStack(cargo, 0, 2);

    expect(result[0].qty).toBe(3);
  });

  it('removes stack entirely when quantity reaches zero', () => {
    const cargo = [{ good: 'ore', qty: 5, buyPrice: 10 }];
    const result = TradingSystem.removeFromCargoStack(cargo, 0, 5);

    expect(result).toHaveLength(0);
  });

  it('removes stack when quantity goes below zero', () => {
    const cargo = [{ good: 'ore', qty: 3, buyPrice: 10 }];
    const result = TradingSystem.removeFromCargoStack(cargo, 0, 5);

    expect(result).toHaveLength(0);
  });

  it('only affects the targeted stack index', () => {
    const cargo = [
      { good: 'ore', qty: 5, buyPrice: 10 },
      { good: 'food', qty: 3, buyPrice: 20 },
    ];
    const result = TradingSystem.removeFromCargoStack(cargo, 0, 2);

    expect(result).toHaveLength(2);
    expect(result[0].qty).toBe(3);
    expect(result[1].qty).toBe(3);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/cargo-stack-operations.test.js`
Expected: FAIL or PASS — these are pure static methods, tests may pass immediately

**Step 3: Fix any test setup issues and verify all pass**

Run: `npm test -- tests/unit/cargo-stack-operations.test.js`
Expected: All 10 tests PASS

**Step 4: Commit**

```
git add tests/unit/cargo-stack-operations.test.js
git commit -m "test: cover cargo stack consolidation and removal in TradingSystem"
```

---

### Task 3: Cannibalize System — `RepairManager.cannibalizeSystem`

`src/game/state/managers/repair.js:195-289`. Zero unit test coverage. This is the emergency "sacrifice one system to save another" mechanic. Has 8+ validation branches and a waste multiplier calculation.

**Files:**
- Create: `tests/unit/cannibalize-manager.test.js`
- Reference: `src/game/state/managers/repair.js:195-289`
- Reference: `src/game/constants.js` (REPAIR_CONFIG)

**Step 1: Write the failing tests**

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import { REPAIR_CONFIG } from '@game/constants.js';

describe('RepairManager.cannibalizeSystem', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  it('rejects invalid target system type', () => {
    const result = gsm.cannibalizeSystem('shields', []);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/Invalid system type/i);
  });

  it('rejects when target is not critically damaged', () => {
    const state = gsm.getState();
    state.ship.hull = REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD + 1;

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 10 },
    ]);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/not critically damaged/i);
  });

  it('rejects invalid donor system type', () => {
    const state = gsm.getState();
    state.ship.hull = REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'shields', amount: 10 },
    ]);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/Invalid donor/i);
  });

  it('rejects when donor is the same as target', () => {
    const state = gsm.getState();
    state.ship.hull = REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'hull', amount: 10 },
    ]);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/cannot donate to itself/i);
  });

  it('rejects non-positive donation amount', () => {
    const state = gsm.getState();
    state.ship.hull = REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 0 },
    ]);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/must be positive/i);
  });

  it('rejects when donor is critically damaged', () => {
    const state = gsm.getState();
    state.ship.hull = REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;
    state.ship.engine = REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 10 },
    ]);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/critically damaged and cannot donate/i);
  });

  it('rejects when donation would drop donor below minimum safe condition', () => {
    const state = gsm.getState();
    state.ship.hull = REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;
    state.ship.engine = REPAIR_CONFIG.CANNIBALIZE_DONOR_MIN + 5;

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 10 },
    ]);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/below minimum safe condition/i);
  });

  it('rejects when total donation is insufficient (waste multiplier)', () => {
    const state = gsm.getState();
    state.ship.hull = REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;
    state.ship.engine = 100;

    // Donate way too little — need (target - current) * waste multiplier
    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: 1 },
    ]);
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/insufficient/i);
  });

  it('succeeds and updates ship conditions when valid', () => {
    const state = gsm.getState();
    state.ship.hull = REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;
    state.ship.engine = 100;

    const amountNeeded =
      REPAIR_CONFIG.EMERGENCY_PATCH_TARGET -
      REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;
    const donationRequired = Math.ceil(
      amountNeeded * REPAIR_CONFIG.CANNIBALIZE_WASTE_MULTIPLIER
    );

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: donationRequired },
    ]);
    expect(result.success).toBe(true);

    // Verify target is now at emergency patch target
    expect(state.ship.hull).toBe(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET);
    // Verify donor was decremented
    expect(state.ship.engine).toBe(100 - donationRequired);
  });

  it('succeeds with multiple donors', () => {
    const state = gsm.getState();
    state.ship.hull = REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;
    state.ship.engine = 80;
    state.ship.lifeSupport = 80;

    const amountNeeded =
      REPAIR_CONFIG.EMERGENCY_PATCH_TARGET -
      REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;
    const totalRequired = Math.ceil(
      amountNeeded * REPAIR_CONFIG.CANNIBALIZE_WASTE_MULTIPLIER
    );
    const halfDonation = Math.ceil(totalRequired / 2);

    const result = gsm.cannibalizeSystem('hull', [
      { system: 'engine', amount: halfDonation },
      { system: 'lifeSupport', amount: halfDonation },
    ]);
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/cannibalize-manager.test.js`
Expected: FAIL or PASS depending on whether `cannibalizeSystem` is delegated via gsm

**Step 3: If `gsm.cannibalizeSystem` doesn't exist, use `gsm.repairManager.cannibalizeSystem` instead. Fix any setup issues.**

Run: `npm test -- tests/unit/cannibalize-manager.test.js`
Expected: All 10 tests PASS

**Step 4: Commit**

```
git add tests/unit/cannibalize-manager.test.js
git commit -m "test: cover cannibalizeSystem validation and state updates"
```

---

### Task 4: Mission Cargo Loss Penalties — `failMissionsDueToCargoLoss`

`src/game/state/managers/mission.js:535-581`. The existing test (`cargo-run-confiscation.test.js`) verifies the method is called but does NOT verify faction reputation penalties are applied. Lines 565-577 are uncovered.

**Files:**
- Create: `tests/unit/mission-cargo-loss-penalties.test.js`
- Reference: `src/game/state/managers/mission.js:535-581`

**Step 1: Write the failing tests**

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('MissionManager.failMissionsDueToCargoLoss', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  it('does nothing when no active missions have mission cargo', () => {
    const state = gsm.getState();
    state.missions.active = [{ id: 'm1', missionCargo: false }];
    state.missions.failed = [];

    gsm.failMissionsDueToCargoLoss();

    expect(state.missions.active).toHaveLength(1);
    expect(state.missions.failed).toHaveLength(0);
  });

  it('keeps missions whose cargo is still in the hold', () => {
    const state = gsm.getState();
    state.missions.active = [
      { id: 'm1', missionCargo: true },
    ];
    state.ship.cargo = [{ missionId: 'm1', good: 'parts', qty: 1 }];
    state.missions.failed = [];

    gsm.failMissionsDueToCargoLoss();

    expect(state.missions.active).toHaveLength(1);
    expect(state.missions.failed).toHaveLength(0);
  });

  it('fails missions whose cargo is missing from the hold', () => {
    const state = gsm.getState();
    state.missions.active = [
      { id: 'm1', missionCargo: true },
    ];
    state.ship.cargo = []; // cargo was confiscated
    state.missions.failed = [];

    gsm.failMissionsDueToCargoLoss();

    expect(state.missions.active).toHaveLength(0);
    expect(state.missions.failed).toContain('m1');
  });

  it('applies faction reputation penalties from mission penalties config', () => {
    const state = gsm.getState();
    state.missions.active = [
      {
        id: 'm1',
        missionCargo: true,
        penalties: {
          failure: {
            faction: { miners: -5, traders: -3 },
          },
        },
      },
    ];
    state.ship.cargo = [];
    state.missions.failed = [];

    const modifyFactionRepSpy = vi.spyOn(gsm, 'modifyFactionRep');

    gsm.failMissionsDueToCargoLoss();

    expect(modifyFactionRepSpy).toHaveBeenCalledWith(
      'miners',
      -5,
      'mission_cargo_confiscated'
    );
    expect(modifyFactionRepSpy).toHaveBeenCalledWith(
      'traders',
      -3,
      'mission_cargo_confiscated'
    );
  });

  it('does not crash when mission has no penalties object', () => {
    const state = gsm.getState();
    state.missions.active = [
      { id: 'm1', missionCargo: true },
    ];
    state.ship.cargo = [];
    state.missions.failed = [];

    expect(() => gsm.failMissionsDueToCargoLoss()).not.toThrow();
    expect(state.missions.failed).toContain('m1');
  });

  it('handles mix of cargo and non-cargo missions', () => {
    const state = gsm.getState();
    state.missions.active = [
      { id: 'm1', missionCargo: true },
      { id: 'm2', missionCargo: false },
      { id: 'm3', missionCargo: true },
    ];
    state.ship.cargo = [{ missionId: 'm1', good: 'parts', qty: 1 }];
    state.missions.failed = [];

    gsm.failMissionsDueToCargoLoss();

    // m1 kept (cargo present), m2 kept (no mission cargo), m3 failed (cargo missing)
    expect(state.missions.active.map((m) => m.id)).toEqual(['m1', 'm2']);
    expect(state.missions.failed).toContain('m3');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/mission-cargo-loss-penalties.test.js`
Expected: FAIL or PASS

**Step 3: Fix any test setup issues (method delegation, state structure)**

Run: `npm test -- tests/unit/mission-cargo-loss-penalties.test.js`
Expected: All 6 tests PASS

**Step 4: Commit**

```
git add tests/unit/mission-cargo-loss-penalties.test.js
git commit -m "test: cover faction rep penalties when missions fail due to cargo loss"
```

---

### Task 5: Save-Load Error Recovery — `handleLoadError`, `attemptNPCRecovery`, `_forceSave` error path

`src/game/state/managers/save-load.js:69-200`. Error recovery paths. A bug here means corrupted saves crash the game instead of recovering gracefully.

**Files:**
- Create: `tests/unit/save-load-error-recovery.test.js`
- Reference: `src/game/state/managers/save-load.js:69-200`

**Step 1: Write the failing tests**

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('SaveLoadManager error recovery', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  describe('_forceSave error path', () => {
    it('does not throw when localStorage.setItem fails', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => gsm.saveLoadManager._forceSave()).not.toThrow();
    });

    it('does nothing when state is null', () => {
      vi.spyOn(gsm.saveLoadManager, 'getState').mockReturnValue(null);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      gsm.saveLoadManager._forceSave();

      expect(setItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('handleLoadError', () => {
    it('returns null for non-NPC errors', () => {
      const error = new Error('JSON parse failed');
      const result = gsm.saveLoadManager.handleLoadError(error);

      expect(result).toBeNull();
    });

    it('attempts NPC recovery when error mentions NPC', () => {
      const recoverySpy = vi
        .spyOn(gsm.saveLoadManager, 'attemptNPCRecovery')
        .mockReturnValue(null);

      const error = new Error('NPC data is invalid');
      gsm.saveLoadManager.handleLoadError(error);

      expect(recoverySpy).toHaveBeenCalled();
    });
  });

  describe('attemptNPCRecovery', () => {
    it('clears NPC and dialogue state then restores', () => {
      // Save a valid game first so loadGameFromStorage has something to return
      gsm.saveLoadManager._forceSave();

      const restoreStateSpy = vi.spyOn(gsm, 'restoreState').mockReturnValue({
        success: true,
        state: { recovered: true },
      });

      const result = gsm.saveLoadManager.attemptNPCRecovery();

      // restoreState should have been called with npcs cleared
      const calledWith = restoreStateSpy.mock.calls[0][0];
      expect(calledWith.npcs).toEqual({});
      expect(result).toEqual({ recovered: true });
    });

    it('returns null when no saved state exists', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

      const result = gsm.saveLoadManager.attemptNPCRecovery();
      expect(result).toBeNull();
    });

    it('returns null when recovery itself throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = gsm.saveLoadManager.attemptNPCRecovery();
      expect(result).toBeNull();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/save-load-error-recovery.test.js`
Expected: FAIL or PASS

**Step 3: Fix any test setup issues (method access, mock targets)**

Run: `npm test -- tests/unit/save-load-error-recovery.test.js`
Expected: All 7 tests PASS

**Step 4: Commit**

```
git add tests/unit/save-load-error-recovery.test.js
git commit -m "test: cover save-load error recovery paths — localStorage failure, NPC corruption"
```

---

### Task 6: Run full suite and verify coverage improvement

**Step 1: Run the complete test suite**

Run: `npm test`
Expected: All tests PASS (including the 2718 existing + ~42 new = ~2760 total)

**Step 2: Run coverage**

Run: `npm run test:coverage -- --run`
Expected: Statement coverage for target files improved:
- `trading.js` (manager): 57.7% → ~85%+
- `game-trading.js`: 51.3% → ~90%+
- `repair.js`: 71.6% → ~85%+
- `mission.js`: 73.5% → ~80%+
- `save-load.js`: 78.5% → ~90%+

**Step 3: Commit any coverage report artifacts if desired**

No source changes in this step — just verification.
