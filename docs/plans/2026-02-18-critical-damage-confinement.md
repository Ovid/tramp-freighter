# Critical Damage Confinement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent jumping when any ship system is at or below 20%, with emergency patch and system cannibalization as escape hatches.

**Architecture:** Add a critical system check to `NavigationSystem.validateJump()`, two new methods on `RepairManager` (emergency patch and cannibalize), pure utility functions in `repairUtils.js`, and new UI sections in `RepairPanel.jsx`. All constants go in `constants.js`.

**Tech Stack:** Vitest, fast-check, React 18, existing Bridge Pattern hooks

---

### Task 1: Add Constants

**Files:**
- Modify: `src/game/constants.js:391-395`

**Step 1: Write failing test**

Create `tests/unit/critical-damage-constants.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { REPAIR_CONFIG, SHIP_CONFIG } from '../../src/game/constants.js';

describe('Critical Damage Confinement Constants', () => {
  it('REPAIR_CONFIG should have CRITICAL_SYSTEM_THRESHOLD of 20', () => {
    expect(REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD).toBe(20);
  });

  it('REPAIR_CONFIG should have EMERGENCY_PATCH_TARGET of 21', () => {
    expect(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET).toBe(21);
  });

  it('REPAIR_CONFIG should have EMERGENCY_PATCH_DAYS_PENALTY of 3', () => {
    expect(REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY).toBe(3);
  });

  it('REPAIR_CONFIG should have CANNIBALIZE_WASTE_MULTIPLIER of 1.5', () => {
    expect(REPAIR_CONFIG.CANNIBALIZE_WASTE_MULTIPLIER).toBe(1.5);
  });

  it('REPAIR_CONFIG should have CANNIBALIZE_DONOR_MIN of 21', () => {
    expect(REPAIR_CONFIG.CANNIBALIZE_DONOR_MIN).toBe(21);
  });

  it('EMERGENCY_PATCH_TARGET should be exactly 1 above CRITICAL_SYSTEM_THRESHOLD', () => {
    expect(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET).toBe(
      REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD + 1
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/critical-damage-constants.test.js`
Expected: FAIL — `REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD` is undefined

**Step 3: Write minimal implementation**

Add to `REPAIR_CONFIG` in `src/game/constants.js` (after `COST_PER_PERCENT: 5`):

```js
export const REPAIR_CONFIG = {
  // Repair costs are linear: ₡5 per 1% restored for any ship system
  // Example: Repairing hull from 78% to 100% costs ₡110 (22% × ₡5)
  COST_PER_PERCENT: 5,

  // Critical damage confinement: systems at or below this % block jumping
  CRITICAL_SYSTEM_THRESHOLD: 20,

  // Emergency patch restores system to this exact percentage
  EMERGENCY_PATCH_TARGET: 21,

  // Days consumed per emergency patch (advances game time)
  EMERGENCY_PATCH_DAYS_PENALTY: 3,

  // Cannibalization: donor loses 1.5x what target gains (50% waste)
  CANNIBALIZE_WASTE_MULTIPLIER: 1.5,

  // Cannibalization: donors cannot be drained below this percentage
  CANNIBALIZE_DONOR_MIN: 21,
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/critical-damage-constants.test.js`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add tests/unit/critical-damage-constants.test.js src/game/constants.js
git commit -m "feat: add critical damage confinement constants"
```

---

### Task 2: Add Critical System Check to validateJump

**Files:**
- Modify: `src/game/game-navigation.js:286-352`
- Create: `tests/unit/critical-damage-jump-validation.test.js`

**Step 1: Write failing test**

Create `tests/unit/critical-damage-jump-validation.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

const TEST_STARS = [
  { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
  { id: 1, x: 10, y: 0, z: 0, name: 'Alpha Centauri' },
];
const TEST_WORMHOLES = [[0, 1]];

describe('Critical Damage Jump Validation', () => {
  let nav;

  beforeEach(() => {
    nav = new NavigationSystem(TEST_STARS, TEST_WORMHOLES);
  });

  it('should block jump when hull is at critical threshold', () => {
    const result = nav.validateJump(0, 1, 100, 100, null, [], 1.0, {
      hull: REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD,
      engine: 100,
      lifeSupport: 100,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Hull');
    expect(result.error).toContain('20%');
  });

  it('should block jump when engine is below critical threshold', () => {
    const result = nav.validateJump(0, 1, 100, 10, null, [], 1.0, {
      hull: 100,
      engine: 10,
      lifeSupport: 100,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Engine');
  });

  it('should block jump when life support is at 0%', () => {
    const result = nav.validateJump(0, 1, 100, 100, null, [], 1.0, {
      hull: 100,
      engine: 100,
      lifeSupport: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Life Support');
  });

  it('should list all critical systems in error message', () => {
    const result = nav.validateJump(0, 1, 100, 5, null, [], 1.0, {
      hull: 5,
      engine: 5,
      lifeSupport: 5,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Hull');
    expect(result.error).toContain('Engine');
    expect(result.error).toContain('Life Support');
  });

  it('should allow jump when all systems are above critical threshold', () => {
    const result = nav.validateJump(0, 1, 100, 21, null, [], 1.0, {
      hull: 21,
      engine: 21,
      lifeSupport: 21,
    });
    expect(result.valid).toBe(true);
  });

  it('should allow jump when shipCondition is not provided (backward compat)', () => {
    const result = nav.validateJump(0, 1, 100, 100);
    expect(result.valid).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/critical-damage-jump-validation.test.js`
Expected: FAIL — `validateJump` does not accept or check `shipCondition`

**Step 3: Write minimal implementation**

Modify `validateJump` in `src/game/game-navigation.js` to accept a new `shipCondition` parameter and add the critical system check after the fuel check:

```js
validateJump(
  currentSystemId,
  targetSystemId,
  currentFuel,
  engineCondition = 100,
  applyQuirkModifiers = null,
  quirks = [],
  upgradeModifier = 1.0,
  shipCondition = null
) {
  // ... existing wormhole, system ID, fuel checks unchanged ...

  // After the fuel check and before the return, add:

  // Check for critically damaged systems
  if (shipCondition) {
    const criticalSystems = [];
    if (shipCondition.hull <= REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD) {
      criticalSystems.push(`Hull (${Math.round(shipCondition.hull)}%)`);
    }
    if (shipCondition.engine <= REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD) {
      criticalSystems.push(`Engine (${Math.round(shipCondition.engine)}%)`);
    }
    if (shipCondition.lifeSupport <= REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD) {
      criticalSystems.push(`Life Support (${Math.round(shipCondition.lifeSupport)}%)`);
    }

    if (criticalSystems.length > 0) {
      return {
        valid: false,
        error: `${criticalSystems.join(', ')} critically damaged. Repairs required before departure.`,
        fuelCost,
        distance,
        jumpTime,
      };
    }
  }

  return { valid: true, error: null, fuelCost, distance, jumpTime };
}
```

Also add the import of `REPAIR_CONFIG` at the top of `game-navigation.js`:

```js
import { NAVIGATION_CONFIG, SHIP_CONFIG, REPAIR_CONFIG } from './constants.js';
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/critical-damage-jump-validation.test.js`
Expected: PASS (6 tests)

**Step 5: Run full test suite**

Run: `npm test`
Expected: All existing tests still pass (backward compat via `shipCondition = null` default)

**Step 6: Commit**

```bash
git add tests/unit/critical-damage-jump-validation.test.js src/game/game-navigation.js
git commit -m "feat: block jumping when ship systems are critically damaged"
```

---

### Task 3: Wire shipCondition into useJumpValidation and executeJump

**Files:**
- Modify: `src/hooks/useJumpValidation.js`
- Modify: `src/game/game-navigation.js:363-396` (executeJump method)

**Step 1: Write failing test**

Create `tests/unit/jump-validation-hook-condition.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { REPAIR_CONFIG } from '../../src/game/constants.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';

describe('executeJump passes shipCondition to validateJump', () => {
  it('should reject jump when ship hull is critically damaged', async () => {
    const stars = [
      { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
      { id: 1, x: 10, y: 0, z: 0, name: 'Target' },
    ];
    const wormholes = [[0, 1]];
    const nav = new NavigationSystem(stars, wormholes);

    const mockGSM = {
      getState: () => ({
        player: { currentSystem: 0 },
        ship: {
          fuel: 100,
          engine: 50,
          hull: 10,
          lifeSupport: 80,
          quirks: [],
        },
      }),
      calculateShipCapabilities: () => ({
        fuelConsumption: 1.0,
        hullDegradation: 1.0,
        lifeSupportDrain: 1.0,
      }),
      applyQuirkModifiers: vi.fn((val) => val),
      updateFuel: vi.fn(),
      updateTime: vi.fn(),
      updateLocation: vi.fn(),
      updateShipCondition: vi.fn(),
      saveGame: vi.fn(),
    };

    const result = await nav.executeJump(mockGSM, 1);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Hull');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/jump-validation-hook-condition.test.js`
Expected: FAIL — executeJump does not pass shipCondition to validateJump yet

**Step 3: Write minimal implementation**

Modify `executeJump` in `src/game/game-navigation.js` to pass `shipCondition`:

```js
// In executeJump, change the validateJump call to include shipCondition:
const validation = this.validateJump(
  currentSystemId,
  targetSystemId,
  currentFuel,
  engineCondition,
  gameStateManager.applyQuirkModifiers.bind(gameStateManager),
  quirks,
  capabilities.fuelConsumption,
  { hull: state.ship.hull, engine: state.ship.engine, lifeSupport: state.ship.lifeSupport }
);
```

Modify `useJumpValidation.js` to pass ship condition:

```js
import { useGameState } from '../context/GameContext';
import { useGameEvent } from './useGameEvent';

export function useJumpValidation(currentSystemId, targetSystemId, fuel) {
  const gameStateManager = useGameState();
  const shipCondition = useGameEvent('shipConditionChanged');

  return gameStateManager.navigationSystem.validateJump(
    currentSystemId,
    targetSystemId,
    fuel,
    shipCondition?.engine ?? 100,
    null,
    [],
    1.0,
    shipCondition ?? null
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/jump-validation-hook-condition.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass. If any existing tests for `useJumpValidation` break, they'll need the hook mock updated to include `shipConditionChanged`.

**Step 6: Commit**

```bash
git add src/hooks/useJumpValidation.js src/game/game-navigation.js tests/unit/jump-validation-hook-condition.test.js
git commit -m "feat: wire ship condition into jump validation and execution"
```

---

### Task 4: Add Emergency Patch to RepairManager

**Files:**
- Modify: `src/game/state/managers/repair.js`
- Create: `tests/unit/emergency-patch.test.js`

**Step 1: Write failing test**

Create `tests/unit/emergency-patch.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepairManager } from '../../src/game/state/managers/repair.js';
import { REPAIR_CONFIG, SHIP_CONFIG } from '../../src/game/constants.js';

describe('Emergency Patch', () => {
  let repairManager;
  let mockGSM;
  let mockState;

  beforeEach(() => {
    mockState = {
      player: { credits: 0, daysElapsed: 10 },
      ship: { hull: 5, engine: 80, lifeSupport: 90 },
    };

    mockGSM = {
      state: mockState,
      updateShipCondition: vi.fn(),
      updateTime: vi.fn(),
      saveGame: vi.fn(),
    };

    repairManager = new RepairManager(mockGSM);
    // Override base manager methods
    repairManager.getState = () => mockState;
    repairManager.validateState = () => {};
  });

  it('should set system to EMERGENCY_PATCH_TARGET (21%)', () => {
    const result = repairManager.applyEmergencyPatch('hull');

    expect(result.success).toBe(true);
    expect(mockGSM.updateShipCondition).toHaveBeenCalledWith(
      REPAIR_CONFIG.EMERGENCY_PATCH_TARGET,
      80,
      90
    );
  });

  it('should advance time by EMERGENCY_PATCH_DAYS_PENALTY days', () => {
    repairManager.applyEmergencyPatch('hull');

    expect(mockGSM.updateTime).toHaveBeenCalledWith(
      10 + REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY
    );
  });

  it('should reject patch for system above critical threshold', () => {
    mockState.ship.engine = 50;
    const result = repairManager.applyEmergencyPatch('engine');

    expect(result.success).toBe(false);
    expect(result.reason).toContain('not critically damaged');
  });

  it('should reject patch for invalid system type', () => {
    const result = repairManager.applyEmergencyPatch('weapons');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('Invalid system type');
  });

  it('should reject patch when player can afford repair above threshold', () => {
    mockState.player.credits = 1000;
    const result = repairManager.applyEmergencyPatch('hull');

    expect(result.success).toBe(false);
    expect(result.reason).toContain('afford');
  });

  it('should save game after successful patch', () => {
    repairManager.applyEmergencyPatch('hull');

    expect(mockGSM.saveGame).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/emergency-patch.test.js`
Expected: FAIL — `applyEmergencyPatch` does not exist

**Step 3: Write minimal implementation**

Add to `RepairManager` in `src/game/state/managers/repair.js`:

```js
/**
 * Apply emergency patch to a critically damaged system
 *
 * Available only when system is at or below CRITICAL_SYSTEM_THRESHOLD
 * and the player cannot afford to repair it above the threshold.
 * Brings system to EMERGENCY_PATCH_TARGET and advances time.
 *
 * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
 * @returns {Object} { success: boolean, reason: string | null }
 */
applyEmergencyPatch(systemType) {
  this.validateState();

  const validSystems = ['hull', 'engine', 'lifeSupport'];
  if (!validSystems.includes(systemType)) {
    return { success: false, reason: 'Invalid system type' };
  }

  const state = this.getState();
  const currentCondition = state.ship[systemType];

  if (currentCondition > REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD) {
    return { success: false, reason: `${systemType} is not critically damaged` };
  }

  // Check if player can afford to repair above threshold
  const amountNeeded = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET - currentCondition;
  const cost = amountNeeded * REPAIR_CONFIG.COST_PER_PERCENT;
  if (state.player.credits >= cost) {
    return { success: false, reason: 'You can afford standard repairs' };
  }

  // Apply patch
  const newConditions = {
    hull: state.ship.hull,
    engine: state.ship.engine,
    lifeSupport: state.ship.lifeSupport,
  };
  newConditions[systemType] = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET;

  this.gameStateManager.updateShipCondition(
    newConditions.hull,
    newConditions.engine,
    newConditions.lifeSupport
  );

  // Advance time
  this.gameStateManager.updateTime(
    state.player.daysElapsed + REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY
  );

  this.gameStateManager.saveGame();

  return { success: true, reason: null };
}
```

Also add `REPAIR_CONFIG` to the import at the top of `repair.js` (it's already imported).

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/emergency-patch.test.js`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add tests/unit/emergency-patch.test.js src/game/state/managers/repair.js
git commit -m "feat: add emergency patch method to RepairManager"
```

---

### Task 5: Add Cannibalization to RepairManager

**Files:**
- Modify: `src/game/state/managers/repair.js`
- Create: `tests/unit/cannibalize-system.test.js`

**Step 1: Write failing test**

Create `tests/unit/cannibalize-system.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepairManager } from '../../src/game/state/managers/repair.js';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

describe('System Cannibalization', () => {
  let repairManager;
  let mockGSM;
  let mockState;

  beforeEach(() => {
    mockState = {
      player: { credits: 0 },
      ship: { hull: 5, engine: 80, lifeSupport: 90 },
    };

    mockGSM = {
      state: mockState,
      updateShipCondition: vi.fn(),
      saveGame: vi.fn(),
    };

    repairManager = new RepairManager(mockGSM);
    repairManager.getState = () => mockState;
    repairManager.validateState = () => {};
  });

  it('should raise target to EMERGENCY_PATCH_TARGET', () => {
    // Hull at 5%, needs 16% to reach 21%. At 1.5x waste, costs 24% from donors.
    const result = repairManager.cannibalizeSystem('hull', [
      { system: 'engine', amount: 12 },
      { system: 'lifeSupport', amount: 12 },
    ]);

    expect(result.success).toBe(true);
    // Hull: 21%, Engine: 80-12=68, LifeSupport: 90-12=78
    expect(mockGSM.updateShipCondition).toHaveBeenCalledWith(21, 68, 78);
  });

  it('should apply 1.5x waste multiplier — donated amount must be 1.5x gain', () => {
    // Hull needs 16% gain. Donations must total at least 16 * 1.5 = 24
    const result = repairManager.cannibalizeSystem('hull', [
      { system: 'engine', amount: 23 }, // Only 23, need 24
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('insufficient');
  });

  it('should reject when target is not critically damaged', () => {
    mockState.ship.hull = 50;
    const result = repairManager.cannibalizeSystem('hull', [
      { system: 'engine', amount: 10 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('not critically damaged');
  });

  it('should reject when donor would go below CANNIBALIZE_DONOR_MIN', () => {
    mockState.ship.engine = 30;
    // Engine at 30, donating 10 would bring it to 20 (below 21 min)
    const result = repairManager.cannibalizeSystem('hull', [
      { system: 'engine', amount: 10 },
      { system: 'lifeSupport', amount: 14 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('Engine');
    expect(result.reason).toContain('below');
  });

  it('should reject when donor is itself critically damaged', () => {
    mockState.ship.engine = 15;
    const result = repairManager.cannibalizeSystem('hull', [
      { system: 'engine', amount: 10 },
    ]);

    expect(result.success).toBe(false);
  });

  it('should reject invalid target system type', () => {
    const result = repairManager.cannibalizeSystem('weapons', []);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Invalid system type');
  });

  it('should reject when target is also a donor', () => {
    const result = repairManager.cannibalizeSystem('hull', [
      { system: 'hull', amount: 10 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('cannot donate to itself');
  });

  it('should save game after successful cannibalization', () => {
    repairManager.cannibalizeSystem('hull', [
      { system: 'engine', amount: 24 },
    ]);

    expect(mockGSM.saveGame).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/cannibalize-system.test.js`
Expected: FAIL — `cannibalizeSystem` does not exist

**Step 3: Write minimal implementation**

Add to `RepairManager` in `src/game/state/managers/repair.js`:

```js
/**
 * Cannibalize donor systems to repair a critically damaged target system
 *
 * Sacrifices condition from healthy systems at a 1.5x waste ratio.
 * Donors cannot be drained below CANNIBALIZE_DONOR_MIN.
 *
 * @param {string} targetType - Target system: 'hull', 'engine', or 'lifeSupport'
 * @param {Array<{system: string, amount: number}>} donations - Donor systems and amounts
 * @returns {Object} { success: boolean, reason: string | null }
 */
cannibalizeSystem(targetType, donations) {
  this.validateState();

  const validSystems = ['hull', 'engine', 'lifeSupport'];
  if (!validSystems.includes(targetType)) {
    return { success: false, reason: 'Invalid system type' };
  }

  const state = this.getState();
  const targetCondition = state.ship[targetType];

  if (targetCondition > REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD) {
    return { success: false, reason: `${targetType} is not critically damaged` };
  }

  // Validate donations
  for (const donation of donations) {
    if (!validSystems.includes(donation.system)) {
      return { success: false, reason: `Invalid donor system: ${donation.system}` };
    }
    if (donation.system === targetType) {
      return { success: false, reason: `${targetType} cannot donate to itself` };
    }
    if (donation.amount <= 0) {
      return { success: false, reason: 'Donation amount must be positive' };
    }

    const donorCondition = state.ship[donation.system];
    if (donorCondition <= REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD) {
      return { success: false, reason: `${donation.system} is critically damaged and cannot donate` };
    }
    if (donorCondition - donation.amount < REPAIR_CONFIG.CANNIBALIZE_DONOR_MIN) {
      return { success: false, reason: `${donation.system} would fall below minimum (${REPAIR_CONFIG.CANNIBALIZE_DONOR_MIN}%)` };
    }
  }

  // Check total donated is sufficient (need 1.5x the gain)
  const amountNeeded = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET - targetCondition;
  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
  const requiredDonation = amountNeeded * REPAIR_CONFIG.CANNIBALIZE_WASTE_MULTIPLIER;

  if (totalDonated < requiredDonation) {
    return {
      success: false,
      reason: `Donated ${totalDonated}% is insufficient. Need ${Math.ceil(requiredDonation)}% to repair ${Math.ceil(amountNeeded)}% (1.5x waste).`,
    };
  }

  // Apply changes
  const newConditions = {
    hull: state.ship.hull,
    engine: state.ship.engine,
    lifeSupport: state.ship.lifeSupport,
  };

  newConditions[targetType] = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET;

  for (const donation of donations) {
    newConditions[donation.system] -= donation.amount;
  }

  this.gameStateManager.updateShipCondition(
    newConditions.hull,
    newConditions.engine,
    newConditions.lifeSupport
  );

  this.gameStateManager.saveGame();

  return { success: true, reason: null };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/cannibalize-system.test.js`
Expected: PASS (8 tests)

**Step 5: Commit**

```bash
git add tests/unit/cannibalize-system.test.js src/game/state/managers/repair.js
git commit -m "feat: add system cannibalization to RepairManager"
```

---

### Task 6: Add Property-Based Tests for Cannibalization

**Files:**
- Create: `tests/property/cannibalize-invariants.property.test.js`

**Step 1: Write property test**

Create `tests/property/cannibalize-invariants.property.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { RepairManager } from '../../src/game/state/managers/repair.js';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

describe('Property: Cannibalization invariants', () => {
  const THRESHOLD = REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;
  const TARGET = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET;
  const WASTE = REPAIR_CONFIG.CANNIBALIZE_WASTE_MULTIPLIER;
  const DONOR_MIN = REPAIR_CONFIG.CANNIBALIZE_DONOR_MIN;

  function makeManager(ship) {
    const mockState = {
      player: { credits: 0 },
      ship: { ...ship },
    };
    const mockGSM = {
      state: mockState,
      updateShipCondition: vi.fn(),
      saveGame: vi.fn(),
    };
    const mgr = new RepairManager(mockGSM);
    mgr.getState = () => mockState;
    mgr.validateState = () => {};
    return { mgr, mockGSM };
  }

  it('successful cannibalization always sets target to exactly 21%', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: THRESHOLD }), // target condition
        fc.integer({ min: DONOR_MIN + 1, max: 100 }), // donor1 condition
        fc.integer({ min: DONOR_MIN + 1, max: 100 }), // donor2 condition
        (targetCond, donor1Cond, donor2Cond) => {
          const amountNeeded = TARGET - targetCond;
          const requiredDonation = Math.ceil(amountNeeded * WASTE);
          const maxFromDonor1 = donor1Cond - DONOR_MIN;
          const maxFromDonor2 = donor2Cond - DONOR_MIN;

          if (maxFromDonor1 + maxFromDonor2 < requiredDonation) return true; // skip infeasible

          const fromDonor1 = Math.min(maxFromDonor1, requiredDonation);
          const fromDonor2 = Math.min(
            maxFromDonor2,
            requiredDonation - fromDonor1
          );

          const { mgr, mockGSM } = makeManager({
            hull: targetCond,
            engine: donor1Cond,
            lifeSupport: donor2Cond,
          });

          const donations = [];
          if (fromDonor1 > 0) donations.push({ system: 'engine', amount: fromDonor1 });
          if (fromDonor2 > 0) donations.push({ system: 'lifeSupport', amount: fromDonor2 });

          const result = mgr.cannibalizeSystem('hull', donations);
          if (!result.success) return true; // skip edge cases

          const call = mockGSM.updateShipCondition.mock.calls[0];
          expect(call[0]).toBe(TARGET); // hull always 21
        }
      ),
      { numRuns: 200 }
    );
  });

  it('donors never go below CANNIBALIZE_DONOR_MIN', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: THRESHOLD }),
        fc.integer({ min: DONOR_MIN + 1, max: 100 }),
        fc.integer({ min: DONOR_MIN + 1, max: 100 }),
        (targetCond, donor1Cond, donor2Cond) => {
          const amountNeeded = TARGET - targetCond;
          const requiredDonation = Math.ceil(amountNeeded * WASTE);
          const maxFromDonor1 = donor1Cond - DONOR_MIN;
          const maxFromDonor2 = donor2Cond - DONOR_MIN;

          if (maxFromDonor1 + maxFromDonor2 < requiredDonation) return true;

          const fromDonor1 = Math.min(maxFromDonor1, requiredDonation);
          const fromDonor2 = Math.min(maxFromDonor2, requiredDonation - fromDonor1);

          const { mgr, mockGSM } = makeManager({
            hull: targetCond,
            engine: donor1Cond,
            lifeSupport: donor2Cond,
          });

          const donations = [];
          if (fromDonor1 > 0) donations.push({ system: 'engine', amount: fromDonor1 });
          if (fromDonor2 > 0) donations.push({ system: 'lifeSupport', amount: fromDonor2 });

          const result = mgr.cannibalizeSystem('hull', donations);
          if (!result.success) return true;

          const call = mockGSM.updateShipCondition.mock.calls[0];
          expect(call[1]).toBeGreaterThanOrEqual(DONOR_MIN); // engine
          expect(call[2]).toBeGreaterThanOrEqual(DONOR_MIN); // lifeSupport
        }
      ),
      { numRuns: 200 }
    );
  });

  it('cannibalization is rejected when donation is insufficient', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: THRESHOLD }),
        fc.integer({ min: 1, max: 50 }),
        (targetCond, donationAmount) => {
          const amountNeeded = TARGET - targetCond;
          const requiredDonation = amountNeeded * WASTE;

          // Only test cases where donation is definitely insufficient
          if (donationAmount >= requiredDonation) return true;

          const { mgr } = makeManager({
            hull: targetCond,
            engine: 100,
            lifeSupport: 100,
          });

          const result = mgr.cannibalizeSystem('hull', [
            { system: 'engine', amount: donationAmount },
          ]);

          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });
});
```

**Step 2: Run test**

Run: `npm test -- tests/property/cannibalize-invariants.property.test.js`
Expected: PASS (3 property tests, 200 iterations each)

**Step 3: Commit**

```bash
git add tests/property/cannibalize-invariants.property.test.js
git commit -m "test: add property-based tests for cannibalization invariants"
```

---

### Task 7: Add Delegation Methods to GameStateManager and useGameAction

**Files:**
- Modify: `src/game/state/game-state-manager.js`
- Modify: `src/hooks/useGameAction.js`

**Step 1: Write failing test**

Create `tests/unit/critical-damage-delegation.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';

describe('Critical Damage Delegation', () => {
  it('GameStateManager should delegate applyEmergencyPatch to RepairManager', async () => {
    const { GameStateManager } = await import(
      '../../src/game/state/game-state-manager.js'
    );
    const gsm = new GameStateManager();
    // Verify the method exists
    expect(typeof gsm.applyEmergencyPatch).toBe('function');
  });

  it('GameStateManager should delegate cannibalizeSystem to RepairManager', async () => {
    const { GameStateManager } = await import(
      '../../src/game/state/game-state-manager.js'
    );
    const gsm = new GameStateManager();
    expect(typeof gsm.cannibalizeSystem).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/critical-damage-delegation.test.js`
Expected: FAIL — methods don't exist on GameStateManager

**Step 3: Write minimal implementation**

Add delegation methods to `src/game/state/game-state-manager.js` after the existing `repairShipSystem` method:

```js
applyEmergencyPatch(systemType) {
  return this.repairManager.applyEmergencyPatch(systemType);
}

cannibalizeSystem(targetType, donations) {
  return this.repairManager.cannibalizeSystem(targetType, donations);
}
```

Add actions to `src/hooks/useGameAction.js` (after the `repair` action):

```js
/**
 * Apply emergency patch to a critically damaged system
 * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
 * @returns {Object} { success: boolean, reason: string | null }
 */
applyEmergencyPatch: (systemType) => {
  return gameStateManager.applyEmergencyPatch(systemType);
},

/**
 * Cannibalize donor systems to repair a critically damaged target
 * @param {string} targetType - Target system type
 * @param {Array<{system: string, amount: number}>} donations - Donor allocations
 * @returns {Object} { success: boolean, reason: string | null }
 */
cannibalizeSystem: (targetType, donations) => {
  return gameStateManager.cannibalizeSystem(targetType, donations);
},
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/critical-damage-delegation.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/game-state-manager.js src/hooks/useGameAction.js tests/unit/critical-damage-delegation.test.js
git commit -m "feat: add delegation for emergency patch and cannibalization"
```

---

### Task 8: Add Pure Utility Functions for Cannibalization UI

**Files:**
- Modify: `src/features/repair/repairUtils.js`
- Create: `tests/unit/cannibalize-utils.test.js`

**Step 1: Write failing test**

Create `tests/unit/cannibalize-utils.test.js`:

```js
import { describe, it, expect } from 'vitest';
import {
  calculateCannibalizeRequired,
  calculateMaxDonation,
  isSystemCritical,
  canAffordRepairAboveThreshold,
} from '../../src/features/repair/repairUtils.js';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

describe('Cannibalization Utility Functions', () => {
  describe('isSystemCritical', () => {
    it('returns true at threshold', () => {
      expect(isSystemCritical(20)).toBe(true);
    });

    it('returns true below threshold', () => {
      expect(isSystemCritical(0)).toBe(true);
    });

    it('returns false above threshold', () => {
      expect(isSystemCritical(21)).toBe(false);
    });
  });

  describe('calculateCannibalizeRequired', () => {
    it('calculates required donation with waste multiplier', () => {
      // Hull at 5%, needs 16% to reach 21%. At 1.5x = 24
      expect(calculateCannibalizeRequired(5)).toBe(24);
    });

    it('returns 0 when already at target', () => {
      expect(calculateCannibalizeRequired(21)).toBe(0);
    });
  });

  describe('calculateMaxDonation', () => {
    it('returns available amount above donor floor', () => {
      // Engine at 80%, floor at 21% = 59% available
      expect(calculateMaxDonation(80)).toBe(59);
    });

    it('returns 0 when at donor floor', () => {
      expect(calculateMaxDonation(21)).toBe(0);
    });

    it('returns 0 when below donor floor', () => {
      expect(calculateMaxDonation(10)).toBe(0);
    });
  });

  describe('canAffordRepairAboveThreshold', () => {
    it('returns true when credits cover repair to 21%', () => {
      // Hull at 5%, needs 16% at ₡5/% = ₡80
      expect(canAffordRepairAboveThreshold(5, 80)).toBe(true);
    });

    it('returns false when credits are insufficient', () => {
      expect(canAffordRepairAboveThreshold(5, 79)).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/cannibalize-utils.test.js`
Expected: FAIL — functions don't exist

**Step 3: Write minimal implementation**

Add to `src/features/repair/repairUtils.js`:

```js
/**
 * Check if a system is at or below the critical damage threshold
 *
 * @param {number} condition - Current condition percentage
 * @returns {boolean} True if critically damaged
 */
export function isSystemCritical(condition) {
  return condition <= REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;
}

/**
 * Calculate total donation required to bring a system from its current
 * condition to EMERGENCY_PATCH_TARGET, accounting for waste multiplier
 *
 * @param {number} currentCondition - Current condition of the target system
 * @returns {number} Total percentage points donors must sacrifice
 */
export function calculateCannibalizeRequired(currentCondition) {
  const needed = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET - currentCondition;
  if (needed <= 0) return 0;
  return Math.ceil(needed * REPAIR_CONFIG.CANNIBALIZE_WASTE_MULTIPLIER);
}

/**
 * Calculate maximum donation a system can give without going below donor floor
 *
 * @param {number} donorCondition - Current condition of donor system
 * @returns {number} Maximum percentage points available to donate
 */
export function calculateMaxDonation(donorCondition) {
  return Math.max(0, donorCondition - REPAIR_CONFIG.CANNIBALIZE_DONOR_MIN);
}

/**
 * Check if player can afford standard repair to get above critical threshold
 *
 * @param {number} currentCondition - Current system condition
 * @param {number} credits - Player credits
 * @returns {boolean} True if player can afford repair above threshold
 */
export function canAffordRepairAboveThreshold(currentCondition, credits) {
  const needed = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET - currentCondition;
  if (needed <= 0) return true;
  const cost = needed * REPAIR_CONFIG.COST_PER_PERCENT;
  return credits >= cost;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/cannibalize-utils.test.js`
Expected: PASS (8 tests)

**Step 5: Commit**

```bash
git add src/features/repair/repairUtils.js tests/unit/cannibalize-utils.test.js
git commit -m "feat: add pure utility functions for cannibalization UI"
```

---

### Task 9: Add Emergency Patch UI to RepairPanel

**Files:**
- Modify: `src/features/repair/RepairPanel.jsx`

**Step 1: Write failing test**

Create `tests/integration/emergency-patch-ui.integration.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RepairPanel } from '../../src/features/repair/RepairPanel.jsx';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

// Mock all hooks
vi.mock('../../src/context/GameContext', () => ({
  useGameState: () => ({
    getServiceDiscount: () => ({ discount: 0, npcName: null }),
  }),
}));

vi.mock('../../src/hooks/useStarData', () => ({
  useStarData: () => [{ id: 0, name: 'Sol', st: 1 }],
}));

vi.mock('../../src/game/game-npcs', () => ({
  getNPCsAtSystem: () => [],
}));

const mockApplyEmergencyPatch = vi.fn(() => ({ success: true, reason: null }));
const mockCannibalizeSystem = vi.fn(() => ({ success: true, reason: null }));

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: (eventName) => {
    if (eventName === 'shipConditionChanged')
      return { hull: 10, engine: 80, lifeSupport: 90 };
    if (eventName === 'creditsChanged') return 0;
    if (eventName === 'locationChanged') return 0;
    return null;
  },
}));

vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: () => ({
    repair: vi.fn(() => ({ success: true })),
    canGetFreeRepair: vi.fn(() => ({ available: false })),
    getFreeRepair: vi.fn(),
    applyEmergencyPatch: mockApplyEmergencyPatch,
    cannibalizeSystem: mockCannibalizeSystem,
  }),
}));

describe('Emergency Patch UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show emergency patch option when hull is critical and player is broke', () => {
    render(<RepairPanel onClose={vi.fn()} />);

    expect(screen.getByText(/Emergency Patch/i)).toBeInTheDocument();
  });

  it('should call applyEmergencyPatch when emergency patch button is clicked', () => {
    render(<RepairPanel onClose={vi.fn()} />);

    const patchBtn = screen.getByRole('button', { name: /Emergency Patch.*Hull/i });
    fireEvent.click(patchBtn);

    expect(mockApplyEmergencyPatch).toHaveBeenCalledWith('hull');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/emergency-patch-ui.integration.test.jsx`
Expected: FAIL — RepairPanel doesn't render emergency patch option

**Step 3: Write minimal implementation**

In `RepairPanel.jsx`, add new imports and UI section. After the existing "Repair Options" section and before the "NPC Discount" section, add:

1. Import the new utils at the top:
```jsx
import {
  calculateRepairCost,
  calculateDiscountedRepairCost,
  calculateRepairAllCost,
  calculateDiscountedRepairAllCost,
  validateRepairAll,
  getSystemCondition,
  isSystemCritical,
  canAffordRepairAboveThreshold,
  calculateCannibalizeRequired,
  calculateMaxDonation,
} from './repairUtils';
import { SHIP_CONFIG, UI_CONFIG, REPAIR_CONFIG } from '../../game/constants';
```

2. Get the new actions from useGameAction:
```jsx
const { repair, canGetFreeRepair, getFreeRepair, applyEmergencyPatch, cannibalizeSystem } = useGameAction();
```

3. Add handler function:
```jsx
const handleEmergencyPatch = (systemType) => {
  const result = applyEmergencyPatch(systemType);
  if (result.success) {
    setValidationMessage(
      `Emergency patch applied to ${getSystemName(systemType)}. +${REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY} days.`
    );
    setValidationClass('warning');
  } else {
    setValidationMessage(`Emergency patch failed: ${result.reason}`);
    setValidationClass('error');
  }
};
```

4. Import `getSystemName` from `repairUtils`.

5. Add the emergency patch section in the JSX, after the "Repair Options" section:
```jsx
{/* Emergency Patch Section — only for critical systems when player can't afford repair */}
{['hull', 'engine', 'lifeSupport'].some(
  (sys) =>
    isSystemCritical(getSystemCondition(condition, sys)) &&
    !canAffordRepairAboveThreshold(getSystemCondition(condition, sys), credits)
) && (
  <div className="repair-section emergency-section">
    <h3>Emergency Patch</h3>
    <p className="emergency-warning">
      Jury-rig repairs to minimum flight condition. Takes{' '}
      {REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY} days per system.
    </p>
    {['hull', 'engine', 'lifeSupport'].map((sys) => {
      const cond = getSystemCondition(condition, sys);
      if (!isSystemCritical(cond)) return null;
      if (canAffordRepairAboveThreshold(cond, credits)) return null;

      return (
        <button
          key={sys}
          className="repair-btn emergency-btn"
          onClick={() => handleEmergencyPatch(sys)}
        >
          Emergency Patch {getSystemName(sys)} (+{REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY} days)
        </button>
      );
    })}
  </div>
)}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/emergency-patch-ui.integration.test.jsx`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/features/repair/RepairPanel.jsx tests/integration/emergency-patch-ui.integration.test.jsx
git commit -m "feat: add emergency patch UI to repair panel"
```

---

### Task 10: Add Cannibalization UI to RepairPanel

**Files:**
- Modify: `src/features/repair/RepairPanel.jsx`

**Step 1: Write failing test**

Create `tests/integration/cannibalize-ui.integration.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RepairPanel } from '../../src/features/repair/RepairPanel.jsx';

vi.mock('../../src/context/GameContext', () => ({
  useGameState: () => ({
    getServiceDiscount: () => ({ discount: 0, npcName: null }),
  }),
}));

vi.mock('../../src/hooks/useStarData', () => ({
  useStarData: () => [{ id: 0, name: 'Sol', st: 1 }],
}));

vi.mock('../../src/game/game-npcs', () => ({
  getNPCsAtSystem: () => [],
}));

const mockCannibalizeSystem = vi.fn(() => ({ success: true, reason: null }));

vi.mock('../../src/hooks/useGameEvent', () => ({
  useGameEvent: (eventName) => {
    if (eventName === 'shipConditionChanged')
      return { hull: 5, engine: 80, lifeSupport: 90 };
    if (eventName === 'creditsChanged') return 0;
    if (eventName === 'locationChanged') return 0;
    return null;
  },
}));

vi.mock('../../src/hooks/useGameAction', () => ({
  useGameAction: () => ({
    repair: vi.fn(() => ({ success: true })),
    canGetFreeRepair: vi.fn(() => ({ available: false })),
    getFreeRepair: vi.fn(),
    applyEmergencyPatch: vi.fn(() => ({ success: true, reason: null })),
    cannibalizeSystem: mockCannibalizeSystem,
  }),
}));

describe('Cannibalization UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show cannibalize section when a system is critical', () => {
    render(<RepairPanel onClose={vi.fn()} />);

    expect(screen.getByText(/Cannibalize/i)).toBeInTheDocument();
  });

  it('should show donor systems with available amounts', () => {
    render(<RepairPanel onClose={vi.fn()} />);

    // Engine at 80% can donate up to 59% (80 - 21)
    expect(screen.getByText(/Engine/i)).toBeInTheDocument();
    // Life Support at 90% can donate up to 69% (90 - 21)
    expect(screen.getByText(/Life Support/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/cannibalize-ui.integration.test.jsx`
Expected: FAIL — no "Cannibalize" text in RepairPanel

**Step 3: Write minimal implementation**

Add cannibalization UI section and state to `RepairPanel.jsx`. Add a `cannibalizeAllocation` state and handler:

```jsx
const [cannibalizeAllocation, setCannibalizeAllocation] = useState({});

const handleCannibalize = (targetType) => {
  const donations = Object.entries(cannibalizeAllocation)
    .filter(([, amount]) => amount > 0)
    .map(([system, amount]) => ({ system, amount }));

  const result = cannibalizeSystem(targetType, donations);
  if (result.success) {
    setValidationMessage(`Cannibalized systems to patch ${getSystemName(targetType)}.`);
    setValidationClass('warning');
    setCannibalizeAllocation({});
  } else {
    setValidationMessage(`Cannibalization failed: ${result.reason}`);
    setValidationClass('error');
  }
};
```

Add JSX after the emergency patch section:

```jsx
{/* Cannibalize Section — only when critical system exists and donors are available */}
{['hull', 'engine', 'lifeSupport'].some((sys) =>
  isSystemCritical(getSystemCondition(condition, sys))
) && (
  <div className="repair-section cannibalize-section">
    <h3>Cannibalize Systems</h3>
    <p className="cannibalize-warning">
      Sacrifice parts from other systems. 50% waste penalty (1.5x cost).
    </p>
    {['hull', 'engine', 'lifeSupport'].map((targetSys) => {
      const targetCond = getSystemCondition(condition, targetSys);
      if (!isSystemCritical(targetCond)) return null;

      const required = calculateCannibalizeRequired(targetCond);
      const donorSystems = ['hull', 'engine', 'lifeSupport'].filter(
        (s) => s !== targetSys && !isSystemCritical(getSystemCondition(condition, s))
      );
      const totalAvailable = donorSystems.reduce(
        (sum, s) => sum + calculateMaxDonation(getSystemCondition(condition, s)),
        0
      );

      if (totalAvailable < required) return null;

      const totalAllocated = donorSystems.reduce(
        (sum, s) => sum + (cannibalizeAllocation[s] || 0),
        0
      );

      return (
        <div key={targetSys} className="cannibalize-target">
          <h4>
            Repair {getSystemName(targetSys)} ({Math.round(targetCond)}% → 21%)
          </h4>
          <p>Need {required}% from donors:</p>
          {donorSystems.map((donorSys) => {
            const donorCond = getSystemCondition(condition, donorSys);
            const maxDonation = calculateMaxDonation(donorCond);
            const currentAlloc = cannibalizeAllocation[donorSys] || 0;

            return (
              <div key={donorSys} className="donor-row">
                <label>
                  {getSystemName(donorSys)} ({Math.round(donorCond)}%, max{' '}
                  {maxDonation}%):
                </label>
                <input
                  type="range"
                  min={0}
                  max={maxDonation}
                  value={currentAlloc}
                  onChange={(e) =>
                    setCannibalizeAllocation((prev) => ({
                      ...prev,
                      [donorSys]: parseInt(e.target.value),
                    }))
                  }
                />
                <span>{currentAlloc}%</span>
              </div>
            );
          })}
          <button
            className="repair-btn cannibalize-btn"
            onClick={() => handleCannibalize(targetSys)}
            disabled={totalAllocated < required}
          >
            Cannibalize ({totalAllocated}/{required}%)
          </button>
        </div>
      );
    })}
  </div>
)}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/cannibalize-ui.integration.test.jsx`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/features/repair/RepairPanel.jsx tests/integration/cannibalize-ui.integration.test.jsx
git commit -m "feat: add cannibalization UI to repair panel"
```

---

### Task 11: Integration Test — Full Critical Damage Flow

**Files:**
- Create: `tests/integration/critical-damage-flow.integration.test.jsx`

**Step 1: Write integration test**

```js
import { describe, it, expect, vi } from 'vitest';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { RepairManager } from '../../src/game/state/managers/repair.js';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

describe('Integration: Critical Damage Confinement Flow', () => {
  const stars = [
    { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
    { id: 1, x: 10, y: 0, z: 0, name: 'Target' },
  ];
  const wormholes = [[0, 1]];

  it('full flow: critical hull → jump blocked → emergency patch → jump succeeds', () => {
    const nav = new NavigationSystem(stars, wormholes);

    // Step 1: Verify jump is blocked with critical hull
    const shipCondition = { hull: 5, engine: 80, lifeSupport: 90 };
    const blocked = nav.validateJump(0, 1, 100, 80, null, [], 1.0, shipCondition);
    expect(blocked.valid).toBe(false);
    expect(blocked.error).toContain('Hull');

    // Step 2: Apply emergency patch
    const mockState = {
      player: { credits: 0, daysElapsed: 10 },
      ship: { ...shipCondition },
    };
    const mockGSM = {
      state: mockState,
      updateShipCondition: vi.fn((h, e, ls) => {
        mockState.ship.hull = h;
        mockState.ship.engine = e;
        mockState.ship.lifeSupport = ls;
      }),
      updateTime: vi.fn((d) => {
        mockState.player.daysElapsed = d;
      }),
      saveGame: vi.fn(),
    };

    const repairMgr = new RepairManager(mockGSM);
    repairMgr.getState = () => mockState;
    repairMgr.validateState = () => {};

    const patchResult = repairMgr.applyEmergencyPatch('hull');
    expect(patchResult.success).toBe(true);
    expect(mockState.ship.hull).toBe(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET);
    expect(mockState.player.daysElapsed).toBe(13);

    // Step 3: Verify jump now succeeds
    const updatedCondition = { ...mockState.ship };
    const unblocked = nav.validateJump(
      0, 1, 100, updatedCondition.engine, null, [], 1.0, updatedCondition
    );
    expect(unblocked.valid).toBe(true);
  });

  it('full flow: critical hull → cannibalize from engine → jump succeeds', () => {
    const nav = new NavigationSystem(stars, wormholes);

    const shipCondition = { hull: 5, engine: 80, lifeSupport: 90 };
    const blocked = nav.validateJump(0, 1, 100, 80, null, [], 1.0, shipCondition);
    expect(blocked.valid).toBe(false);

    // Cannibalize: need 16% gain, costs 24% from donors
    const mockState = {
      player: { credits: 0 },
      ship: { ...shipCondition },
    };
    const mockGSM = {
      state: mockState,
      updateShipCondition: vi.fn((h, e, ls) => {
        mockState.ship.hull = h;
        mockState.ship.engine = e;
        mockState.ship.lifeSupport = ls;
      }),
      saveGame: vi.fn(),
    };

    const repairMgr = new RepairManager(mockGSM);
    repairMgr.getState = () => mockState;
    repairMgr.validateState = () => {};

    const result = repairMgr.cannibalizeSystem('hull', [
      { system: 'engine', amount: 12 },
      { system: 'lifeSupport', amount: 12 },
    ]);
    expect(result.success).toBe(true);
    expect(mockState.ship.hull).toBe(21);
    expect(mockState.ship.engine).toBe(68);
    expect(mockState.ship.lifeSupport).toBe(78);

    // Verify jump now succeeds
    const unblocked = nav.validateJump(
      0, 1, 100, mockState.ship.engine, null, [], 1.0, mockState.ship
    );
    expect(unblocked.valid).toBe(true);
  });
});
```

**Step 2: Run integration test**

Run: `npm test -- tests/integration/critical-damage-flow.integration.test.jsx`
Expected: PASS (2 integration tests)

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add tests/integration/critical-damage-flow.integration.test.jsx
git commit -m "test: add integration tests for critical damage confinement flow"
```

---

### Task 12: Final Verification

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass with zero warnings

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 3: Run format check**

Run: `npm run format:check`
Expected: No formatting issues (or run `npm run format:write` to fix)

**Step 4: Manual smoke test**

Run: `npm run dev`
- Set hull to 10% via dev admin
- Try to jump — should see error in JumpDialog
- Open Repair panel — should see Emergency Patch and Cannibalize options
- Use Emergency Patch — hull should go to 21%, days should advance by 3
- Try to jump again — should succeed

**Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: fix lint and format issues from critical damage feature"
```
