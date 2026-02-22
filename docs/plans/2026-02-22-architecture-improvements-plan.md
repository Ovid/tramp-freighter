# Architecture Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split DangerManager into 5 focused managers, replace Math.random() with SeededRandom in gameplay paths, and add debounced auto-save.

**Architecture:** DangerManager (1,843 lines) splits into CombatManager, NegotiationManager, InspectionManager, DistressManager, and MechanicalFailureManager — all first-class managers extending BaseManager. Shared state (karma, faction rep, zones) stays in a slimmed DangerManager. SeededRandom replaces Math.random() with deterministic seeds based on game day + system + encounter type. Scattered saveGame() calls replaced by markDirty() with trailing 500ms debounce.

**Tech Stack:** React 18, Vitest, fast-check, existing SeededRandom LCG implementation

**Design doc:** `docs/plans/2026-02-22-architecture-improvements-design.md`

---

## Phase 1: DangerManager Split

### Task 1: Create danger-utils.js shared utility

**Files:**
- Create: `src/game/utils/danger-utils.js`
- Test: `tests/unit/danger-utils.test.js`

**Step 1: Write the failing test**

```javascript
// tests/unit/danger-utils.test.js
import { describe, it, expect } from 'vitest';
import { calculateKarmaModifier } from '../../src/game/utils/danger-utils.js';
import { KARMA_CONFIG } from '../../src/game/constants.js';

describe('danger-utils', () => {
  describe('calculateKarmaModifier', () => {
    it('should return 0 for neutral karma', () => {
      expect(calculateKarmaModifier(0)).toBe(0);
    });

    it('should return positive modifier for positive karma', () => {
      const result = calculateKarmaModifier(100);
      expect(result).toBe(100 * KARMA_CONFIG.SUCCESS_RATE_SCALE);
      expect(result).toBeGreaterThan(0);
    });

    it('should return negative modifier for negative karma', () => {
      const result = calculateKarmaModifier(-100);
      expect(result).toBe(-100 * KARMA_CONFIG.SUCCESS_RATE_SCALE);
      expect(result).toBeLessThan(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/danger-utils.test.js`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```javascript
// src/game/utils/danger-utils.js
import { KARMA_CONFIG } from '../constants.js';

/**
 * Calculate karma modifier for success rates.
 * Karma provides a hidden +-5% modifier at extreme values.
 *
 * @param {number} karma - Current karma value (-100 to +100)
 * @returns {number} Modifier to add to success rate (-0.05 to +0.05)
 */
export function calculateKarmaModifier(karma) {
  return karma * KARMA_CONFIG.SUCCESS_RATE_SCALE;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/danger-utils.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/utils/danger-utils.js tests/unit/danger-utils.test.js
git commit -m "feat: extract calculateKarmaModifier to shared danger-utils"
```

---

### Task 2: Create CombatManager

**Files:**
- Create: `src/game/state/managers/combat.js`
- Reference: `src/game/state/managers/danger.js` (lines 400-1234 — combat section + modifier helpers)

**Step 1: Create CombatManager**

Extract from `danger.js`:
- `resolveCombatChoice()` (line 414) — entry point
- `resolveEvasiveManeuvers()` (line 457)
- `resolveReturnFire()` (line 535)
- `resolveDumpCargo()` (line 614)
- `resolveDistressCall()` (line 641) — the combat choice, not the encounter type
- `checkLuckyShipNegate()` (line 1191)
- `applyHullDamageModifiers()` (line 1217)

```javascript
// src/game/state/managers/combat.js
import { BaseManager } from './base-manager.js';
import { COMBAT_CONFIG, KARMA_CONFIG } from '../../constants.js';
import { calculateKarmaModifier } from '../../utils/danger-utils.js';

export class CombatManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  // Paste resolveCombatChoice, resolveEvasiveManeuvers, resolveReturnFire,
  // resolveDumpCargo, resolveDistressCall, checkLuckyShipNegate,
  // applyHullDamageModifiers from danger.js
  //
  // Changes:
  // 1. Replace this.calculateKarmaModifier(karma) with calculateKarmaModifier(karma)
  // 2. Replace this.incrementDangerFlag('piratesFought') with
  //    this.gameStateManager.incrementDangerFlag('piratesFought')
  // 3. Keep Math.random() for now (SeededRandom comes in Phase 2)
}
```

Key changes from danger.js:
- Import `calculateKarmaModifier` from `danger-utils.js` instead of calling `this.calculateKarmaModifier()`
- Call `this.gameStateManager.incrementDangerFlag()` instead of `this.incrementDangerFlag()`
- No other behavioral changes

**Step 2: Run full test suite**

Run: `npm test`
Expected: All existing tests still pass (CombatManager isn't wired up yet)

**Step 3: Commit**

```bash
git add src/game/state/managers/combat.js
git commit -m "feat: create CombatManager extracted from DangerManager"
```

---

### Task 3: Create NegotiationManager

**Files:**
- Create: `src/game/state/managers/negotiation.js`
- Reference: `src/game/state/managers/danger.js` (lines 722-1067 — negotiation section)

**Step 1: Create NegotiationManager**

Extract from `danger.js`:
- `resolveNegotiation()` (line 722)
- `resolveCounterProposal()` (line 762)
- `resolveMedicineClaim()` (line 824)
- `resolveIntelOffer()` (line 888)
- `hasTradeCargoForPirates()` (line 946)
- `resolveAcceptDemand()` (line 962)
- `resolveCannotPayPirates()` (line 1008)

```javascript
// src/game/state/managers/negotiation.js
import { BaseManager } from './base-manager.js';
import {
  NEGOTIATION_CONFIG,
  PIRATE_CREDIT_DEMAND_CONFIG,
} from '../../constants.js';
import { calculateKarmaModifier } from '../../utils/danger-utils.js';
import { pickRandomFrom } from '../../utils/seeded-random.js';
```

Key changes from danger.js:
- Import `calculateKarmaModifier` from `danger-utils.js`
- Call `this.gameStateManager.incrementDangerFlag()` instead of `this.incrementDangerFlag()`

**Step 2: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 3: Commit**

```bash
git add src/game/state/managers/negotiation.js
git commit -m "feat: create NegotiationManager extracted from DangerManager"
```

---

### Task 4: Create InspectionManager

**Files:**
- Create: `src/game/state/managers/inspection.js`
- Reference: `src/game/state/managers/danger.js` (lines 1255-1428)

**Step 1: Create InspectionManager**

Extract from `danger.js`:
- `resolveInspection()` (line 1255)
- `resolveInspectionCooperate()` (line 1289)
- `resolveInspectionBribe()` (line 1379)
- `resolveInspectionFlee()` (line 1416)

Key changes from danger.js:
- Call `this.gameStateManager.getDangerZone()` instead of `this.getDangerZone()`
- Call `this.gameStateManager.countRestrictedGoods()` instead of `this.countRestrictedGoods()`
- Call `this.gameStateManager.incrementDangerFlag()` instead of `this.incrementDangerFlag()`

**Step 2: Run full test suite, commit**

```bash
npm test
git add src/game/state/managers/inspection.js
git commit -m "feat: create InspectionManager extracted from DangerManager"
```

---

### Task 5: Create DistressManager

**Files:**
- Create: `src/game/state/managers/distress.js`
- Reference: `src/game/state/managers/danger.js` (lines 1434-1594)

**Step 1: Create DistressManager**

Extract from `danger.js`:
- `checkDistressCall()` (line 1457)
- `resolveDistressCallEncounter()` (line 1487)
- `resolveDistressRespond()` (line 1520)
- `resolveDistressIgnore()` (line 1548)
- `resolveDistressLoot()` (line 1570)

Key changes: `this.gameStateManager.incrementDangerFlag()` for flag tracking.

**Step 2: Run full test suite, commit**

```bash
npm test
git add src/game/state/managers/distress.js
git commit -m "feat: create DistressManager extracted from DangerManager"
```

---

### Task 6: Create MechanicalFailureManager

**Files:**
- Create: `src/game/state/managers/mechanical-failure.js`
- Reference: `src/game/state/managers/danger.js` (lines 1600-1843)

**Step 1: Create MechanicalFailureManager**

Extract from `danger.js`:
- `checkMechanicalFailure()` (line 1614)
- `resolveMechanicalFailure()` (line 1668)
- `resolveHullBreach()` (line 1691)
- `resolveEngineFailure()` (line 1717)
- `resolveEmergencyRestart()` (line 1739)
- `resolveCallForHelp()` (line 1774)
- `resolveJuryRig()` (line 1796)
- `resolveLifeSupportEmergency()` (line 1830)

No cross-manager dependencies — this is the most self-contained extraction.

**Step 2: Run full test suite, commit**

```bash
npm test
git add src/game/state/managers/mechanical-failure.js
git commit -m "feat: create MechanicalFailureManager extracted from DangerManager"
```

---

### Task 7: Slim DangerManager and wire up GameStateManager

**Files:**
- Modify: `src/game/state/managers/danger.js` — remove all extracted methods
- Modify: `src/game/state/game-state-manager.js` — register new managers, reroute delegation

**Step 1: Slim danger.js**

Remove from `danger.js`:
- Combat section (lines 400-700): `resolveCombatChoice`, `resolveEvasiveManeuvers`, `resolveReturnFire`, `resolveDumpCargo`, `resolveDistressCall` (combat choice)
- Negotiation section (lines 700-1067): `resolveNegotiation`, all negotiation methods, `hasTradeCargoForPirates`, `resolveCannotPayPirates`
- Combat modifier helpers (lines 1165-1234): `calculateKarmaModifier`, `checkLuckyShipNegate`, `applyHullDamageModifiers`
- Inspection section (lines 1255-1428): `resolveInspection`, all inspection methods
- Distress section (lines 1434-1594): `checkDistressCall`, `resolveDistressCallEncounter`, all distress methods
- Mechanical failure section (lines 1600-1843): `checkMechanicalFailure`, `resolveMechanicalFailure`, all failure methods

Keep in `danger.js`:
- `getDangerZone()` (line 67)
- Karma methods (lines 97-171): `getKarma`, `setKarma`, `modifyKarma`
- `calculatePirateEncounterChance()` (line 192)
- `calculateCargoValue()` (line 270)
- `calculateInspectionChance()` (line 280)
- `hasIllegalMissionCargo()` (line 350)
- `countRestrictedGoods()` (line 360)
- `incrementDangerFlag()` (line 385)
- Faction reputation (lines 1067-1159): `getFactionRep`, `setFactionRep`, `modifyFactionRep`

Remove unused imports (`COMBAT_CONFIG`, `NEGOTIATION_CONFIG`, `INSPECTION_CONFIG`, `FAILURE_CONFIG`, `DISTRESS_CONFIG`, `PIRATE_CREDIT_DEMAND_CONFIG`, `MISSION_CARGO_TYPES`). Keep `pickRandomFrom` import only if still used — check if it was only used in `resolveCannotPayPirates` (moved to negotiation). If so, remove it.

**Step 2: Update GameStateManager constructor** (lines 87-105)

Add imports for new managers:

```javascript
import { CombatManager } from './managers/combat.js';
import { NegotiationManager } from './managers/negotiation.js';
import { InspectionManager } from './managers/inspection.js';
import { DistressManager } from './managers/distress.js';
import { MechanicalFailureManager } from './managers/mechanical-failure.js';
```

Register after `this.dangerManager`:

```javascript
this.dangerManager = new DangerManager(this);
this.combatManager = new CombatManager(this);
this.negotiationManager = new NegotiationManager(this);
this.inspectionManager = new InspectionManager(this);
this.distressManager = new DistressManager(this);
this.mechanicalFailureManager = new MechanicalFailureManager(this);
```

**Step 3: Reroute delegation methods** (lines 803-898)

```javascript
resolveCombatChoice(encounter, choice) {
  return this.combatManager.resolveCombatChoice(encounter, choice);
}

resolveNegotiation(encounter, choice, rng) {
  return this.negotiationManager.resolveNegotiation(encounter, choice, rng);
}

resolveInspection(choice, gameState, rng) {
  return this.inspectionManager.resolveInspection(choice, gameState, rng);
}

checkDistressCall(rng) {
  return this.distressManager.checkDistressCall(rng);
}

resolveDistressCall(distressCall, choice) {
  return this.distressManager.resolveDistressCallEncounter(distressCall, choice);
}

checkMechanicalFailure(gameState, rng) {
  return this.mechanicalFailureManager.checkMechanicalFailure(gameState, rng);
}

resolveMechanicalFailure(failureType, choice, gameState, rng) {
  return this.mechanicalFailureManager.resolveMechanicalFailure(
    failureType, choice, gameState, rng
  );
}
```

Note: Keep `rng` params for now. They'll be removed in Phase 2.

**Step 4: Run full test suite**

Run: `npm test`
Expected: ALL tests pass — behavior unchanged, only routing changed

**Step 5: Commit**

```bash
git add src/game/state/managers/danger.js src/game/state/game-state-manager.js
git commit -m "refactor: slim DangerManager, wire new managers into GameStateManager"
```

---

## Phase 2: SeededRandom Replacement

### Task 8: Add seed construction to SeededRandom utility

**Files:**
- Modify: `src/game/utils/seeded-random.js` — add `buildEncounterSeed` helper
- Test: `tests/unit/seeded-random-seeds.test.js`

**Step 1: Write the failing test**

```javascript
// tests/unit/seeded-random-seeds.test.js
import { describe, it, expect } from 'vitest';
import { buildEncounterSeed, SeededRandom } from '../../src/game/utils/seeded-random.js';

describe('buildEncounterSeed', () => {
  it('should produce deterministic string from game context', () => {
    const seed = buildEncounterSeed(142, 0, 'combat');
    expect(seed).toBe('142_0_combat');
  });

  it('should produce different seeds for different encounter types', () => {
    const s1 = buildEncounterSeed(142, 0, 'combat');
    const s2 = buildEncounterSeed(142, 0, 'negotiation');
    expect(s1).not.toBe(s2);
  });

  it('should produce reproducible RNG sequences', () => {
    const seed = buildEncounterSeed(100, 5, 'inspection');
    const rng1 = new SeededRandom(seed);
    const rng2 = new SeededRandom(seed);
    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.next()).toBe(rng2.next());
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/seeded-random-seeds.test.js`
Expected: FAIL — buildEncounterSeed not found

**Step 3: Write implementation**

Add to `src/game/utils/seeded-random.js`:

```javascript
/**
 * Build a deterministic seed string from game context.
 * Same day + system + type always produces same RNG sequence.
 *
 * @param {number} gameDay - Current game day (daysElapsed)
 * @param {number} systemId - Current star system ID
 * @param {string} encounterType - Type identifier (e.g., 'combat', 'negotiation')
 * @returns {string} Seed string for SeededRandom constructor
 */
export function buildEncounterSeed(gameDay, systemId, encounterType) {
  return `${gameDay}_${systemId}_${encounterType}`;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/seeded-random-seeds.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/utils/seeded-random.js tests/unit/seeded-random-seeds.test.js
git commit -m "feat: add buildEncounterSeed helper for deterministic RNG"
```

---

### Task 9: Replace Math.random() in CombatManager

**Files:**
- Modify: `src/game/state/managers/combat.js`

**Step 1: Update resolveCombatChoice**

Replace `const rng = Math.random();` with:

```javascript
import { SeededRandom, buildEncounterSeed } from '../../utils/seeded-random.js';

// In resolveCombatChoice():
const state = this.getState();
const seed = buildEncounterSeed(
  state.player.daysElapsed,
  state.player.currentSystem,
  'combat'
);
const rng = new SeededRandom(seed).next();
```

No other changes — the rest of the method uses the `rng` value the same way.

**Step 2: Run full test suite**

Run: `npm test`
Expected: PASS — combat tests use GameStateManager which now routes to CombatManager. Results may differ numerically (different RNG source) but structure is the same. Property tests check structure/bounds, not exact values.

**Step 3: Commit**

```bash
git add src/game/state/managers/combat.js
git commit -m "feat: replace Math.random with SeededRandom in CombatManager"
```

---

### Task 10: Replace Math.random() in NegotiationManager

**Files:**
- Modify: `src/game/state/managers/negotiation.js`

**Step 1: Update resolveNegotiation to create own RNG**

The `rng` parameter is currently passed from callers. Change `resolveNegotiation` to ignore the passed `rng` and generate its own:

```javascript
import { SeededRandom, buildEncounterSeed } from '../../utils/seeded-random.js';

// In resolveNegotiation(encounter, choice, rng):
// Ignore the rng param — generate deterministic RNG from game context
const state = this.getState();
const seed = buildEncounterSeed(
  state.player.daysElapsed,
  state.player.currentSystem,
  'negotiation'
);
const seededRng = new SeededRandom(seed);
const rngValue = seededRng.next();
```

Also update `resolveAcceptDemand` and `resolveCannotPayPirates` — they currently take `rng = Math.random` as a default parameter. Change them to generate their own SeededRandom internally using the `'negotiation_payment'` encounter type for different seed.

**Step 2: Run full test suite, commit**

```bash
npm test
git add src/game/state/managers/negotiation.js
git commit -m "feat: replace Math.random with SeededRandom in NegotiationManager"
```

---

### Task 11: Replace Math.random() in remaining managers

**Files:**
- Modify: `src/game/state/managers/inspection.js`
- Modify: `src/game/state/managers/distress.js`
- Modify: `src/game/state/managers/mechanical-failure.js`

**Step 1: Update InspectionManager.resolveInspection**

Generate SeededRandom with `'inspection'` encounter type. Ignore passed `rng` param.

**Step 2: Update DistressManager.checkDistressCall**

Generate SeededRandom with `'check_distress'` encounter type. Ignore passed `rng` param.

**Step 3: Update MechanicalFailureManager**

- `checkMechanicalFailure`: SeededRandom with `'check_mechanical'`. Ignore passed `rng`.
- `resolveMechanicalFailure`: SeededRandom with `'resolve_mechanical'`. Ignore passed `rng`.

**Step 4: Run full test suite, commit**

```bash
npm test
git add src/game/state/managers/inspection.js src/game/state/managers/distress.js src/game/state/managers/mechanical-failure.js
git commit -m "feat: replace Math.random with SeededRandom in inspection, distress, mechanical managers"
```

---

### Task 12: Remove rng params from call chain

**Files:**
- Modify: `src/game/state/game-state-manager.js` — drop rng params from delegation methods and resolveEncounter/resolvePirateEncounter
- Modify: `src/App.jsx` — line 245, drop `Math.random()` arg
- Modify: `src/hooks/useEventTriggers.js` — lines 39-45, remove pre-rolled RNG

**Step 1: Update GameStateManager**

Remove `rng` parameter from these delegation methods:
- `resolveNegotiation(encounter, choice, rng)` → `resolveNegotiation(encounter, choice)`
- `resolveInspection(choice, gameState, rng)` → `resolveInspection(choice, gameState)`
- `checkDistressCall(rng)` → `checkDistressCall()`
- `checkMechanicalFailure(gameState, rng)` → `checkMechanicalFailure(gameState)`
- `resolveMechanicalFailure(failureType, choice, gameState, rng)` → `resolveMechanicalFailure(failureType, choice, gameState)`

Update `resolveEncounter()` (line 834-857): Remove `const rng = Math.random();` and stop passing `rng` to called methods.

Update `resolvePirateEncounter()` (line 868-885): Remove `rng` parameter, stop passing to `resolveNegotiation`.

**Step 2: Update App.jsx**

Line 242-246: Remove `Math.random()` argument:
```javascript
// Before
outcome = gameStateManager.resolveNegotiation(
  currentEncounter.encounter, choice, Math.random()
);
// After
outcome = gameStateManager.resolveNegotiation(
  currentEncounter.encounter, choice
);
```

**Step 3: Update useEventTriggers.js**

Lines 39-45: Remove pre-rolled RNG values:
```javascript
// Before
const mechanicalRng = Math.random();
const mechanicalResult = dm.checkMechanicalFailure(gameState, mechanicalRng);
const distressRng = Math.random();
const distressResult = dm.checkDistressCall(distressRng);

// After
const mechanicalResult = dm.checkMechanicalFailure(gameState);
const distressResult = dm.checkDistressCall();
```

Note: `dm` here refers to `gameStateManager` accessed through context. Verify the variable name in the actual hook.

**Step 4: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/game-state-manager.js src/App.jsx src/hooks/useEventTriggers.js
git commit -m "refactor: remove rng params from encounter resolution call chain"
```

---

### Task 13: Replace Math.random() in DebtManager

**Files:**
- Modify: `src/game/state/managers/debt.js` — lines 345-365

**Step 1: Update generateFavorMission**

```javascript
import { SeededRandom, buildEncounterSeed } from '../../utils/seeded-random.js';

// In generateFavorMission():
const state = this.getState();
const seed = buildEncounterSeed(
  state.player.daysElapsed,
  state.player.currentSystem,
  'favor_mission'
);
const rng = new SeededRandom(seed);

// Replace three Math.random() calls:
const templateIndex = Math.floor(rng.next() * COLE_FAVOR_MISSIONS.length);
// ...
const destStar = reachable[Math.floor(rng.next() * reachable.length)];
// ...
id: `${template.id}_${Date.now()}_${Math.floor(rng.next() * 10000)}`,
```

**Step 2: Run full test suite, commit**

```bash
npm test
git add src/game/state/managers/debt.js
git commit -m "feat: replace Math.random with SeededRandom in DebtManager favor missions"
```

---

## Phase 3: Debounced Auto-Save

### Task 14: Add markDirty() and flushSave() to SaveLoadManager (TDD)

**Files:**
- Modify: `src/game/state/managers/save-load.js`
- Test: `tests/unit/save-debounce.test.js`

**Step 1: Write the failing test**

```javascript
// tests/unit/save-debounce.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('SaveLoadManager debounced save', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('markDirty should schedule a save after SAVE_DEBOUNCE_MS', async () => {
    // Import dynamically so localStorage stub is in place
    const { SaveLoadManager } = await import(
      '../../src/game/state/managers/save-load.js'
    );

    const mockGSM = {
      state: { meta: { version: '5.0.0' }, player: {}, ship: {}, world: {} },
      isTestEnvironment: true,
    };
    const manager = new SaveLoadManager(mockGSM);
    const saveSpy = vi.spyOn(manager, 'saveGame');

    manager.markDirty();

    // Should not save immediately
    expect(saveSpy).not.toHaveBeenCalled();

    // Advance past debounce window
    vi.advanceTimersByTime(600);

    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('markDirty should reset timer on repeated calls', async () => {
    const { SaveLoadManager } = await import(
      '../../src/game/state/managers/save-load.js'
    );

    const mockGSM = {
      state: { meta: { version: '5.0.0' }, player: {}, ship: {}, world: {} },
      isTestEnvironment: true,
    };
    const manager = new SaveLoadManager(mockGSM);
    const saveSpy = vi.spyOn(manager, 'saveGame');

    manager.markDirty();
    vi.advanceTimersByTime(300);
    manager.markDirty(); // Reset timer
    vi.advanceTimersByTime(300);

    // Should not have saved yet (timer was reset)
    expect(saveSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    // Now it should have saved
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('flushSave should save immediately if dirty', async () => {
    const { SaveLoadManager } = await import(
      '../../src/game/state/managers/save-load.js'
    );

    const mockGSM = {
      state: { meta: { version: '5.0.0' }, player: {}, ship: {}, world: {} },
      isTestEnvironment: true,
    };
    const manager = new SaveLoadManager(mockGSM);
    const saveSpy = vi.spyOn(manager, 'saveGame');

    manager.markDirty();
    manager.flushSave();

    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('flushSave should be a no-op if not dirty', async () => {
    const { SaveLoadManager } = await import(
      '../../src/game/state/managers/save-load.js'
    );

    const mockGSM = {
      state: { meta: { version: '5.0.0' }, player: {}, ship: {}, world: {} },
      isTestEnvironment: true,
    };
    const manager = new SaveLoadManager(mockGSM);
    const saveSpy = vi.spyOn(manager, 'saveGame');

    manager.flushSave();

    expect(saveSpy).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/save-debounce.test.js`
Expected: FAIL — markDirty/flushSave not found

**Step 3: Implement markDirty and flushSave**

Add to `src/game/state/managers/save-load.js`:

```javascript
// Add to constructor:
this._dirtyTimer = null;
this._isDirty = false;

// Add constant at top of file (or import from constants.js):
const MARK_DIRTY_DEBOUNCE_MS = 500;
```

```javascript
/**
 * Mark state as dirty and schedule a debounced save.
 * Resets the timer on each call — saves 500ms after the last mutation.
 */
markDirty() {
  this._isDirty = true;

  if (this._dirtyTimer) {
    clearTimeout(this._dirtyTimer);
  }

  this._dirtyTimer = setTimeout(() => {
    this._dirtyTimer = null;
    this._isDirty = false;
    this.saveGame();
  }, MARK_DIRTY_DEBOUNCE_MS);
}

/**
 * Immediately save if dirty. Used for browser unload.
 * Cancels any pending debounced save.
 */
flushSave() {
  if (!this._isDirty) return;

  if (this._dirtyTimer) {
    clearTimeout(this._dirtyTimer);
    this._dirtyTimer = null;
  }

  this._isDirty = false;
  this.saveGame();
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/save-debounce.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/state/managers/save-load.js tests/unit/save-debounce.test.js
git commit -m "feat: add markDirty/flushSave for debounced auto-save"
```

---

### Task 15: Add markDirty delegation and replace saveGame calls

**Files:**
- Modify: `src/game/state/game-state-manager.js` — add markDirty delegation, replace 13 saveGame() calls
- Modify: `src/game/state/managers/navigation.js` — replace 2 saveGame() calls, fix ordering bug
- Modify: `src/features/danger/applyEncounterOutcome.js` — replace 1 saveGame() call

**Step 1: Add markDirty delegation to GameStateManager**

```javascript
markDirty() {
  this.saveLoadManager.markDirty();
}

flushSave() {
  this.saveLoadManager.flushSave();
}
```

**Step 2: Replace all this.saveGame() calls in GameStateManager**

Replace every `this.saveGame()` with `this.markDirty()` in game-state-manager.js. These are at approximately lines:
- 769 (setKarma), 774 (modifyKarma)
- 783 (setFactionRep), 788 (modifyFactionRep)
- 401 (modifyRep), 407 (setNpcRep)
- 534 (getTip), 558 (requestLoan), 566 (repayLoan), 573 (checkLoanDefaults)
- 579 (storeCargo), 587 (retrieveCargo)
- 1007 (markVictory)

**Step 3: Fix navigation.js**

Replace `this.gameStateManager.saveGame()` with `this.gameStateManager.markDirty()` at lines 131 and 160.

Also fix the ordering bug in dock(): move the `dockedSystems.push()` block (lines 137-140) to BEFORE the `markDirty()` call (line 131). Since markDirty is debounced, the order doesn't technically matter for correctness anymore, but it's cleaner:

```javascript
// Track docked systems for first_dock condition
const dockedSystems = state.world.narrativeEvents?.dockedSystems;
if (dockedSystems && !dockedSystems.includes(currentSystemId)) {
  dockedSystems.push(currentSystemId);
}

// Update price knowledge
this.gameStateManager.updatePriceKnowledge(
  currentSystemId, currentPrices, 0, 'visited'
);

this.gameStateManager.markDirty();

this.emit('docked', { systemId: currentSystemId });
```

Wait — check whether the `dockedSystems` mutation should stay AFTER the emit. The comment says "after emit so the event engine sees the system as not-yet-docked during check." If this ordering is intentional for the event engine, keep it after the emit but before markDirty doesn't matter since markDirty is debounced. The key fix is that markDirty (unlike saveGame) will capture the mutation regardless of call order.

**Step 4: Update applyEncounterOutcome.js**

Line 185: Replace `gameStateManager.saveGame()` with `gameStateManager.markDirty()`.

**Step 5: Run full test suite**

Run: `npm test`
Expected: PASS

**Step 6: Commit**

```bash
git add src/game/state/game-state-manager.js src/game/state/managers/navigation.js src/features/danger/applyEncounterOutcome.js
git commit -m "refactor: replace saveGame calls with markDirty for debounced auto-save"
```

---

### Task 16: Add beforeunload handler

**Files:**
- Modify: `src/game/state/game-state-manager.js` — add beforeunload listener in constructor

**Step 1: Add listener**

In the GameStateManager constructor, after manager initialization:

```javascript
// Flush pending saves when the browser tab closes
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    this.flushSave();
  });
}
```

**Step 2: Run full test suite**

Run: `npm test`
Expected: PASS (tests run in jsdom/node where window.addEventListener is available or noop)

**Step 3: Commit**

```bash
git add src/game/state/game-state-manager.js
git commit -m "feat: flush pending saves on browser tab close"
```

---

## Phase 4: Documentation Updates

### Task 17: Update all documentation

**Files:**
- Modify: `CLAUDE.md` — manager list (~line 58-61)
- Modify: `.github/copilot-instructions.md` — manager responsibilities (~lines 318-328)
- Modify: `AGENTS.md` — manager initialization code (~lines 194-207)
- Modify: `DEVELOPMENT.md` — architecture diagrams (~lines 268-282)
- Modify: `.kiro/steering/coding-standards.md` — save/load section (~lines 1002-1048)
- Modify: `.kiro/specs/danger-system/design.md` — architecture diagram
- Modify: `architecture-responses.md` — add implementation status to items #6, #7, #8

**Step 1: Update CLAUDE.md**

In the Manager Delegation section, replace the single `DangerManager` reference with:

```markdown
- `DangerManager`: Danger zones, karma, faction reputation, encounter probability calculations
- `CombatManager`: Pirate combat resolution (evasive, return fire, dump cargo, distress call)
- `NegotiationManager`: Pirate negotiation resolution (counter-proposal, medicine, intel, surrender)
- `InspectionManager`: Customs inspection resolution (cooperate, bribe, flee)
- `DistressManager`: Civilian distress call encounters (respond, ignore, loot)
- `MechanicalFailureManager`: Ship system failure checks and repair options
```

Add after the manager list:

```markdown
**Save pattern:** Managers call `this.gameStateManager.markDirty()` after mutations (not `saveGame()` directly). SaveLoadManager debounces saves with a 500ms trailing timer.

**Encounter RNG:** Combat/encounter paths use `SeededRandom` with deterministic seeds (`gameDay_systemId_encounterType`). Do not use `Math.random()` in gameplay paths.
```

**Step 2: Update .github/copilot-instructions.md**

In the Manager Responsibilities section (~line 328), replace:
```
- **DangerManager**: Encounter system (pirates, inspections, etc.)
```
with:
```
- **DangerManager**: Danger zones, karma, faction reputation, encounter probability
- **CombatManager**: Pirate combat resolution
- **NegotiationManager**: Pirate negotiation resolution
- **InspectionManager**: Customs inspection resolution
- **DistressManager**: Civilian distress call encounters
- **MechanicalFailureManager**: Ship system failure checks and repairs
```

**Step 3: Update AGENTS.md**

In the manager initialization code block, add new managers after `this.dangerManager`:

```javascript
this.combatManager = new CombatManager(this);
this.negotiationManager = new NegotiationManager(this);
this.inspectionManager = new InspectionManager(this);
this.distressManager = new DistressManager(this);
this.mechanicalFailureManager = new MechanicalFailureManager(this);
```

**Step 4: Update DEVELOPMENT.md**

In the architecture diagram, update the bottom box to show more managers:

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Trading    │   │  Navigation  │   │   Events     │
│   Logic      │   │    Logic     │   │   System     │
└──────────────┘   └──────────────┘   └──────────────┘
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Combat     │   │ Negotiation  │   │  Inspection  │
│   Manager    │   │   Manager    │   │   Manager    │
└──────────────┘   └──────────────┘   └──────────────┘
```

**Step 5: Update .kiro/steering/coding-standards.md**

In the localStorage section, add after the existing save/load examples:

```markdown
### Save Debouncing

**Always use `markDirty()`, never `saveGame()` directly in managers:**

```javascript
// GOOD - Debounced save
mutateState();
this.emit('stateChanged', newData);
this.gameStateManager.markDirty();

// BAD - Direct save (bypasses debounce)
mutateState();
this.emit('stateChanged', newData);
this.gameStateManager.saveGame();
```

`markDirty()` schedules a save 500ms after the last state change. `flushSave()` is only for browser unload.
```

**Step 6: Update .kiro/specs/danger-system/design.md**

Update the architecture diagram to show split managers instead of monolithic DangerManager. Add a note that DangerManager was split per the architecture review.

**Step 7: Update architecture-responses.md**

Add implementation notes to items #6, #7, #8:

At the end of item #6 (line ~114):
```markdown
**Status:** Implemented 2026-02-22. Replaced 17 scattered saveGame() calls with markDirty() trailing debounce (500ms). Navigation.js dock ordering bug fixed.
```

At the end of item #7 (line ~132):
```markdown
**Status:** Implemented 2026-02-22. Math.random() replaced with SeededRandom in all gameplay paths. Seeds: gameDay_systemId_encounterType.
```

At the end of item #8 (line ~154):
```markdown
**Status:** Implemented 2026-02-22. DangerManager split into CombatManager, NegotiationManager, InspectionManager, DistressManager, MechanicalFailureManager. Slimmed DangerManager retains zones, karma, faction rep (~280 lines). Shared calculateKarmaModifier extracted to danger-utils.js.
```

**Step 8: Run full test suite**

Run: `npm test`
Expected: PASS (doc changes don't affect tests)

**Step 9: Commit**

```bash
git add CLAUDE.md .github/copilot-instructions.md AGENTS.md DEVELOPMENT.md .kiro/steering/coding-standards.md .kiro/specs/danger-system/design.md architecture-responses.md
git commit -m "docs: update all documentation for architecture improvements"
```

---

## Final Verification

### Task 18: Final test suite and cleanup

**Step 1: Run full test suite**

Run: `npm test`
Expected: ALL PASS

**Step 2: Run lint and format**

Run: `npm run clean`
Fix any lint/format issues.

**Step 3: Verify no remaining Math.random in gameplay paths**

Search for `Math.random` in `src/game/state/managers/` (excluding scene.js) and `src/App.jsx` and `src/hooks/useEventTriggers.js`. Only acceptable locations:
- Default parameters in files NOT touched by this plan (ship.js, event-engine.js, mission-generator.js, quest-manager.js)
- scene.js (visual only)

**Step 4: Verify no remaining direct saveGame() calls in managers**

Search for `this.gameStateManager.saveGame()` or `this.saveGame()` in manager files. Should only exist in SaveLoadManager's own internal methods.

**Step 5: Final commit if any cleanup was needed**

```bash
npm run clean
npm test
git add -A
git commit -m "chore: lint and format after architecture improvements"
```
