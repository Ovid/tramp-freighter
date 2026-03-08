# Phase 0: Preparatory Cleanup — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> **Phased execution:** This is Phase 0 of the GSM Refactor (design:
> `docs/plans/2026-03-08-gsm-refactor-design.md`). After completing this phase,
> mark Phase 0 as done in the design doc. Then immediately use
> `superpowers:writing-plans` to create the Phase 1 implementation plan.

**Goal:** Remove landmines before restructuring. Fix bugs, normalize mutation
contracts, extract migration logic. Zero architectural change.

**Architecture:** Moves `markDirty()`/`emit()` calls from the GSM facade into
manager methods so the facade becomes pure pass-through. Consolidates duplicated
free repair code. Extracts migration registry. Moves browser event registration
to app entry point.

**Tech Stack:** JavaScript (ES modules), Vitest

---

## Task 1: Extract migration registry

**Files:**
- Modify: `src/game/state/game-state-manager.js:251-271`
- Create: `tests/unit/migration-registry.test.js`

### Step 1: Write baseline test

```js
// tests/unit/migration-registry.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('Migration Registry', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('migrates v1.0.0 state to current version', () => {
    const v1State = {
      meta: { version: '1.0.0', timestamp: Date.now() },
      player: { credits: 1000, currentSystem: 0, daysElapsed: 5 },
      ship: {
        fuel: 100,
        cargo: [],
        cargoCapacity: 100,
        name: 'Test',
        hull: 100,
        engine: 100,
        lifeSupport: 100,
      },
      world: {
        visitedSystems: [0],
        priceKnowledge: {},
        activeEvents: [],
        marketConditions: {},
      },
    };

    const result = gsm._applyMigrations(v1State);
    expect(result.meta.version).toBe('5.0.0');
  });

  it('returns v5.0.0 state unchanged', () => {
    const v5State = {
      meta: { version: '5.0.0', timestamp: Date.now() },
      player: { credits: 1000 },
    };

    const result = gsm._applyMigrations(v5State);
    expect(result.meta.version).toBe('5.0.0');
    expect(result.player.credits).toBe(1000);
  });
});
```

### Step 2: Run baseline test

Run: `npm test -- tests/unit/migration-registry.test.js`
Expected: PASS (verifying existing behavior)

### Step 3: Refactor to table-driven registry

In `src/game/state/game-state-manager.js`, replace the `_applyMigrations`
method (lines 251-271):

**Old:**
```js
  _applyMigrations(state) {
    let migrated = state;

    if (migrated.meta.version === '1.0.0') {
      migrated = migrateFromV1ToV2(migrated, this.starData);
    }
    if (migrated.meta.version === '2.0.0') {
      migrated = migrateFromV2ToV2_1(migrated);
    }
    if (migrated.meta.version === '2.1.0') {
      migrated = migrateFromV2_1ToV4(migrated);
    }
    if (migrated.meta.version === '4.0.0') {
      migrated = migrateFromV4ToV4_1(migrated);
    }
    if (migrated.meta.version === '4.1.0') {
      migrated = migrateFromV4_1ToV5(migrated);
    }

    return migrated;
  }
```

**New:**
```js
  _applyMigrations(state) {
    const MIGRATIONS = [
      ['1.0.0', (s) => migrateFromV1ToV2(s, this.starData)],
      ['2.0.0', migrateFromV2ToV2_1],
      ['2.1.0', migrateFromV2_1ToV4],
      ['4.0.0', migrateFromV4ToV4_1],
      ['4.1.0', migrateFromV4_1ToV5],
    ];

    let migrated = state;
    for (const [version, migrateFn] of MIGRATIONS) {
      if (migrated.meta.version === version) {
        migrated = migrateFn(migrated);
      }
    }
    return migrated;
  }
```

### Step 4: Run test

Run: `npm test -- tests/unit/migration-registry.test.js`
Expected: PASS

### Step 5: Run full test suite

Run: `npm test`
Expected: All tests pass

### Step 6: Commit

```
git add src/game/state/game-state-manager.js tests/unit/migration-registry.test.js
git commit -m "Refactor _applyMigrations to table-driven registry"
```

---

## Task 2: Move beforeunload handler to main.jsx

**Files:**
- Modify: `src/game/state/game-state-manager.js:110-115`
- Modify: `src/main.jsx:67+`

No TDD needed — this is a pure structural move with no behavior change.

### Step 1: Remove handler from GSM constructor

In `src/game/state/game-state-manager.js`, delete lines 110-115:

```js
    // Flush pending saves when the browser tab closes
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushSave();
      });
    }
```

### Step 2: Add handler to main.jsx

In `src/main.jsx`, inside `initializeGameStateManager()` after the
`gameStateManager` is fully initialized (after the if/else block, before the
return), add:

```js
  // Flush pending saves when the browser tab closes
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      gameStateManager.flushSave();
    });
  }
```

### Step 3: Run full test suite

Run: `npm test`
Expected: All tests pass

### Step 4: Commit

```
git add src/game/state/game-state-manager.js src/main.jsx
git commit -m "Move beforeunload handler from GSM constructor to main.jsx"
```

---

## Task 3: Fix free repair bugs — consolidate into RepairManager

NPCManager has duplicate `canGetFreeRepair()` (line 857) and `getFreeRepair()`
(line 925) that duplicate RepairManager's versions. The NPC versions have bugs:
missing `markDirty()`, direct `state.ship.hull = ...` mutation instead of
`updateShipCondition()`.

**Files:**
- Modify: `src/game/state/managers/npc.js:857-995` (remove two methods)
- Modify: `src/game/state/game-state-manager.js:810-816` (change delegation)
- Modify: `tests/unit/npc-manager-coverage.test.js:377-445` (remove dead tests)

### Step 1: Write failing test — GSM facade getFreeRepair calls markDirty

Add to `tests/unit/repair-free-repair.test.js`, inside the top-level describe:

```js
  describe('GSM facade delegation', () => {
    it('getFreeRepair via GSM facade calls markDirty on success', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN);
      gsm.getState().ship.hull = 70;

      const markDirtySpy = vi.spyOn(gsm, 'markDirty');
      gsm.getFreeRepair(TEST_NPC_ID, 30);

      expect(markDirtySpy).toHaveBeenCalled();
    });

    it('getFreeRepair via GSM facade uses updateShipCondition', () => {
      setNpcRep(TEST_NPC_ID, REPUTATION_BOUNDS.TRUSTED_MIN);
      gsm.getState().ship.hull = 70;

      const updateSpy = vi.spyOn(gsm, 'updateShipCondition');
      gsm.getFreeRepair(TEST_NPC_ID, 30);

      expect(updateSpy).toHaveBeenCalled();
    });
  });
```

### Step 2: Run test to verify it fails

Run: `npm test -- tests/unit/repair-free-repair.test.js`
Expected: FAIL — current NPC implementation has neither markDirty nor
updateShipCondition

### Step 3: Change GSM facade to delegate to RepairManager

In `src/game/state/game-state-manager.js`, change the two facade methods:

**Old (line 810-816):**
```js
  canGetFreeRepair(npcId) {
    return this.npcManager.canGetFreeRepair(npcId);
  }

  getFreeRepair(npcId, hullDamagePercent) {
    return this.npcManager.getFreeRepair(npcId, hullDamagePercent);
  }
```

**New:**
```js
  canGetFreeRepair(npcId) {
    return this.repairManager.canGetFreeRepair(npcId);
  }

  getFreeRepair(npcId, hullDamagePercent) {
    return this.repairManager.applyFreeRepair(npcId, hullDamagePercent);
  }
```

### Step 4: Run test to verify it passes

Run: `npm test -- tests/unit/repair-free-repair.test.js`
Expected: PASS — RepairManager.applyFreeRepair calls both markDirty and
updateShipCondition

### Step 5: Remove duplicate methods from NPCManager

In `src/game/state/managers/npc.js`, delete the `canGetFreeRepair` method
(lines 857-912) and the `getFreeRepair` method (lines 925-995). Also remove
the JSDoc block above `canGetFreeRepair` (lines 848-856) and above
`getFreeRepair` (lines 914-924).

### Step 6: Update npc-manager-coverage.test.js

In `tests/unit/npc-manager-coverage.test.js`, remove the two describe blocks
that test the removed NPC methods:
- `describe('canGetFreeRepair', ...)` (lines 377-406) — 4 tests
- `describe('getFreeRepair', ...)` (lines 409-445) — 5 tests

These behaviors are already covered by `tests/unit/repair-free-repair.test.js`
and `tests/property/free-repair-tier-limits.property.test.js`.

### Step 7: Run full test suite

Run: `npm test`
Expected: All tests pass

### Step 8: Commit

```
git add src/game/state/managers/npc.js src/game/state/game-state-manager.js tests/unit/repair-free-repair.test.js tests/unit/npc-manager-coverage.test.js
git commit -m "Fix free repair bugs: consolidate into RepairManager, fix missing markDirty"
```

---

## Task 4: Normalize mutation contract — DangerManager

Move `markDirty()` from the GSM facade into DangerManager for 4 methods:
`setKarma`, `modifyKarma`, `setFactionRep`, `modifyFactionRep`. All 4 already
emit events internally; they just need `markDirty()` added.

**Files:**
- Modify: `src/game/state/managers/danger.js:87-99, 107-127, 381-401, 411-435`
- Modify: `src/game/state/game-state-manager.js:986-1008`
- Create: `tests/unit/danger-manager-markdirty.test.js`

### Step 1: Create test file with first failing test

```js
// tests/unit/danger-manager-markdirty.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('DangerManager markDirty contract', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('setKarma calls markDirty', () => {
    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.dangerManager.setKarma(50);
    expect(spy).toHaveBeenCalled();
  });
});
```

### Step 2: Run test

Run: `npm test -- tests/unit/danger-manager-markdirty.test.js`
Expected: FAIL — `setKarma` does not call `markDirty`

### Step 3: Add markDirty to setKarma

In `src/game/state/managers/danger.js`, in the `setKarma` method (line 87-99),
add `this.gameStateManager.markDirty()` after the emit call (line 98):

```js
  setKarma(value) {
    this.validateState();

    const newKarma = Math.max(
      KARMA_CONFIG.MIN,
      Math.min(KARMA_CONFIG.MAX, value)
    );

    this.getState().player.karma = newKarma;

    this.log(`Karma set to ${newKarma}`);
    this.emit(EVENT_NAMES.KARMA_CHANGED, newKarma);
    this.gameStateManager.markDirty();
  }
```

### Step 4: Run test

Run: `npm test -- tests/unit/danger-manager-markdirty.test.js`
Expected: PASS

### Step 5: Add test for modifyKarma

Add to the describe block:

```js
  it('modifyKarma calls markDirty', () => {
    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.dangerManager.modifyKarma(5, 'test');
    expect(spy).toHaveBeenCalled();
  });
```

### Step 6: Run test — verify RED

Run: `npm test -- tests/unit/danger-manager-markdirty.test.js`
Expected: FAIL — new test fails, setKarma test passes

### Step 7: Add markDirty to modifyKarma

In `src/game/state/managers/danger.js`, in the `modifyKarma` method
(line 107-127), add `this.gameStateManager.markDirty()` after the
`checkAchievements` call (line 126):

```js
    this.emit(EVENT_NAMES.KARMA_CHANGED, newKarma);
    this.gameStateManager.checkAchievements();
    this.gameStateManager.markDirty();
  }
```

### Step 8: Run test — verify GREEN

Run: `npm test -- tests/unit/danger-manager-markdirty.test.js`
Expected: PASS

### Step 9: Add test for setFactionRep

```js
  it('setFactionRep calls markDirty', () => {
    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.dangerManager.setFactionRep('traders', 50);
    expect(spy).toHaveBeenCalled();
  });
```

### Step 10: Run test — verify RED

Run: `npm test -- tests/unit/danger-manager-markdirty.test.js`
Expected: FAIL — new test fails

### Step 11: Add markDirty to setFactionRep

In `src/game/state/managers/danger.js`, in the `setFactionRep` method
(line 381-401), add `this.gameStateManager.markDirty()` after the emit call
(line 398-400):

```js
    this.emit(EVENT_NAMES.FACTION_REP_CHANGED, {
      ...this.getState().player.factions,
    });
    this.gameStateManager.markDirty();
  }
```

### Step 12: Run test — verify GREEN

Run: `npm test -- tests/unit/danger-manager-markdirty.test.js`
Expected: PASS

### Step 13: Add test for modifyFactionRep

```js
  it('modifyFactionRep calls markDirty', () => {
    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.dangerManager.modifyFactionRep('traders', 10, 'test');
    expect(spy).toHaveBeenCalled();
  });
```

### Step 14: Run test — verify RED

Run: `npm test -- tests/unit/danger-manager-markdirty.test.js`
Expected: FAIL

### Step 15: Add markDirty to modifyFactionRep

In `src/game/state/managers/danger.js`, in the `modifyFactionRep` method
(line 411-435), add `this.gameStateManager.markDirty()` after the emit call
(line 432-434):

```js
    this.emit(EVENT_NAMES.FACTION_REP_CHANGED, {
      ...this.getState().player.factions,
    });
    this.gameStateManager.markDirty();
  }
```

### Step 16: Run test — verify GREEN

Run: `npm test -- tests/unit/danger-manager-markdirty.test.js`
Expected: PASS

### Step 17: Make GSM facade methods pure pass-through

In `src/game/state/game-state-manager.js`, simplify these 4 methods:

**setKarma (line 986-989):**
```js
  setKarma(value) {
    this.dangerManager.setKarma(value);
  }
```

**modifyKarma (line 991-994):**
```js
  modifyKarma(amount, reason) {
    this.dangerManager.modifyKarma(amount, reason);
  }
```

**setFactionRep (line 1000-1003):**
```js
  setFactionRep(faction, value) {
    this.dangerManager.setFactionRep(faction, value);
  }
```

**modifyFactionRep (line 1005-1008):**
```js
  modifyFactionRep(faction, amount, reason) {
    this.dangerManager.modifyFactionRep(faction, amount, reason);
  }
```

### Step 18: Run full test suite

Run: `npm test`
Expected: All tests pass

### Step 19: Commit

```
git add src/game/state/managers/danger.js src/game/state/game-state-manager.js tests/unit/danger-manager-markdirty.test.js
git commit -m "Move markDirty into DangerManager, make GSM facade pure pass-through"
```

---

## Task 5: Normalize mutation contract — NPCManager

Move `markDirty()` (and `emit()` for `setNpcRep`) from the GSM facade into
NPCManager for 8 methods. After this, the facade becomes pure pass-through.

`modifyRep` does NOT need changes — it delegates to `modifyRepRaw` which will
get `markDirty()` added here. The facade just needs its own `markDirty()` removed.

**Files:**
- Modify: `src/game/state/managers/npc.js`
- Modify: `src/game/state/game-state-manager.js:547-804`
- Create: `tests/unit/npc-manager-markdirty.test.js`

### Step 1: Create test file with first failing test — modifyRepRaw

```js
// tests/unit/npc-manager-markdirty.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import { REPUTATION_BOUNDS, EVENT_NAMES } from '../../src/game/constants.js';

const TEST_NPC_ID = 'chen_barnards';

describe('NPCManager markDirty contract', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('modifyRepRaw calls markDirty', () => {
    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.npcManager.modifyRepRaw(TEST_NPC_ID, 5, 'test');
    expect(spy).toHaveBeenCalled();
  });
});
```

### Step 2: Run test — verify RED

Run: `npm test -- tests/unit/npc-manager-markdirty.test.js`
Expected: FAIL

### Step 3: Add markDirty to modifyRepRaw

In `src/game/state/managers/npc.js`, in `modifyRepRaw` (line 136-158), add
`this.gameStateManager.markDirty()` after the emit call (line 157):

```js
    this.gameStateManager.checkAchievements();
    this.emit(EVENT_NAMES.NPCS_CHANGED, { ...this.getState().npcs });
    this.gameStateManager.markDirty();
  }
```

### Step 4: Run test — verify GREEN

Run: `npm test -- tests/unit/npc-manager-markdirty.test.js`
Expected: PASS

### Step 5: Add test for setNpcRep — needs both emit AND markDirty

```js
  it('setNpcRep calls markDirty', () => {
    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.npcManager.setNpcRep(TEST_NPC_ID, 50);
    expect(spy).toHaveBeenCalled();
  });

  it('setNpcRep emits NPCS_CHANGED', () => {
    const received = [];
    gsm.subscribe(EVENT_NAMES.NPCS_CHANGED, (data) => received.push(data));
    gsm.npcManager.setNpcRep(TEST_NPC_ID, 50);
    expect(received.length).toBe(1);
  });
```

### Step 6: Run test — verify RED

Run: `npm test -- tests/unit/npc-manager-markdirty.test.js`
Expected: FAIL — both new tests fail

### Step 7: Add emit and markDirty to setNpcRep

In `src/game/state/managers/npc.js`, update `setNpcRep` (line 169-175):

```js
  setNpcRep(npcId, value) {
    this.validateAndGetNPCData(npcId);
    const npcState = this.getNPCState(npcId);
    npcState.rep = Math.round(
      Math.max(REPUTATION_BOUNDS.MIN, Math.min(REPUTATION_BOUNDS.MAX, value))
    );
    this.emit(EVENT_NAMES.NPCS_CHANGED, { ...this.getState().npcs });
    this.gameStateManager.markDirty();
  }
```

### Step 8: Run test — verify GREEN

Run: `npm test -- tests/unit/npc-manager-markdirty.test.js`
Expected: PASS

### Step 9: Add test for getTip

```js
  it('getTip calls markDirty when tip is returned', () => {
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.WARM_MIN;
    npcState.lastTipDay = null;

    const spy = vi.spyOn(gsm, 'markDirty');
    const result = gsm.npcManager.getTip(TEST_NPC_ID);

    if (result !== null) {
      expect(spy).toHaveBeenCalled();
    }
  });

  it('getTip does not call markDirty when tip is unavailable', () => {
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.rep = 0; // Too low for tips

    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.npcManager.getTip(TEST_NPC_ID);

    expect(spy).not.toHaveBeenCalled();
  });
```

### Step 10: Run test — verify RED

Run: `npm test -- tests/unit/npc-manager-markdirty.test.js`
Expected: FAIL — first test fails (getTip doesn't call markDirty)

### Step 11: Add markDirty to getTip

In `src/game/state/managers/npc.js`, in `getTip` (line 245-274), add
`this.gameStateManager.markDirty()` after setting `lastTipDay` (line 271):

```js
    // Update lastTipDay to current game day
    npcState.lastTipDay = state.player.daysElapsed;

    this.gameStateManager.markDirty();

    return selectedTip;
```

### Step 12: Run test — verify GREEN

Run: `npm test -- tests/unit/npc-manager-markdirty.test.js`
Expected: PASS

### Step 13: Add test for requestLoan

```js
  it('requestLoan calls markDirty on success', () => {
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
    npcState.lastFavorDay = null;
    gsm.getState().player.credits = 100;

    const spy = vi.spyOn(gsm, 'markDirty');
    const result = gsm.npcManager.requestLoan(TEST_NPC_ID);

    if (result.success) {
      expect(spy).toHaveBeenCalled();
    }
  });
```

### Step 14: Run test — verify RED

Run: `npm test -- tests/unit/npc-manager-markdirty.test.js`
Expected: FAIL

Note: `requestLoan` calls `this.gameStateManager.updateCredits()` which may
call `markDirty` internally. If the test passes, skip to step 16 and add
explicit `markDirty()` anyway for self-documentation. Check by adding a more
precise spy that counts calls — the manager should call it at least once for
its own NPC state mutations.

### Step 15: Add markDirty to requestLoan

In `src/game/state/managers/npc.js`, in `requestLoan` (line 419-471), add
`this.gameStateManager.markDirty()` before the success return (line 467):

```js
    npcState.lastFavorDay = state.player.daysElapsed;

    this.gameStateManager.markDirty();

    return {
      success: true,
      message: `Received ₡${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} emergency loan`,
    };
```

### Step 16: Run test — verify GREEN

Run: `npm test -- tests/unit/npc-manager-markdirty.test.js`
Expected: PASS

### Step 17: Add test for repayLoan

```js
  it('repayLoan calls markDirty on success', () => {
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
    npcState.loanAmount = 500;
    npcState.loanDay = 1;
    gsm.getState().player.credits = 1000;

    const spy = vi.spyOn(gsm, 'markDirty');
    const result = gsm.npcManager.repayLoan(TEST_NPC_ID);

    expect(result.success).toBe(true);
    expect(spy).toHaveBeenCalled();
  });
```

### Step 18: Run test — verify RED, then add markDirty

In `src/game/state/managers/npc.js`, in `repayLoan` (line 482-529), add
`this.gameStateManager.markDirty()` before the success return (line 525):

```js
    npcState.lastInteraction = state.player.daysElapsed;
    npcState.interactions += 1;

    this.gameStateManager.markDirty();

    return {
      success: true,
      message: `Repaid ₡${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} loan`,
    };
```

Run: `npm test -- tests/unit/npc-manager-markdirty.test.js`
Expected: PASS

### Step 19: Add test for checkLoanDefaults

```js
  it('checkLoanDefaults calls markDirty when defaults are processed', () => {
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
    npcState.loanAmount = 500;
    npcState.loanDay = 0;
    gsm.getState().player.daysElapsed = 50; // > 30 day deadline

    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.npcManager.checkLoanDefaults();

    expect(spy).toHaveBeenCalled();
  });
```

### Step 20: Run test — verify RED, then add markDirty

In `src/game/state/managers/npc.js`, in `checkLoanDefaults` (line 540-617),
add `this.gameStateManager.markDirty()` inside the `if (daysSinceLoan > ...)`
block, after the log call (line 612):

```js
          this.log(
            `Loan default penalty for ${npcId}: ${oldRep} -> ${npcState.rep} (loan default, tier reduction)`
          );

          this.gameStateManager.markDirty();
```

Run: `npm test -- tests/unit/npc-manager-markdirty.test.js`
Expected: PASS

### Step 21: Add test for storeCargo

```js
  it('storeCargo calls markDirty on success', () => {
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
    npcState.lastFavorDay = null;
    gsm.getState().ship.cargo = [
      { type: 'food', qty: 5, source: 'Sol', purchasePrice: 10 },
    ];

    const spy = vi.spyOn(gsm, 'markDirty');
    const result = gsm.npcManager.storeCargo(TEST_NPC_ID);

    if (result.success) {
      expect(spy).toHaveBeenCalled();
    }
  });
```

### Step 22: Run test — verify RED, then add markDirty

In `src/game/state/managers/npc.js`, in `storeCargo` (line 627-730), add
`this.gameStateManager.markDirty()` after the interaction tracking
(line 723):

```js
    npcState.lastInteraction = state.player.daysElapsed;
    npcState.interactions += 1;

    this.gameStateManager.markDirty();

    return {
```

Run: `npm test -- tests/unit/npc-manager-markdirty.test.js`
Expected: PASS

### Step 23: Add test for retrieveCargo

```js
  it('retrieveCargo calls markDirty when cargo is retrieved', () => {
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.storedCargo = [
      { type: 'food', qty: 3, source: 'Sol', purchasePrice: 10 },
    ];
    gsm.getState().ship.cargo = [];

    const spy = vi.spyOn(gsm, 'markDirty');
    const result = gsm.npcManager.retrieveCargo(TEST_NPC_ID);

    expect(result.retrieved.length).toBeGreaterThan(0);
    expect(spy).toHaveBeenCalled();
  });
```

### Step 24: Run test — verify RED, then add markDirty

In `src/game/state/managers/npc.js`, in `retrieveCargo` (line 741-846), add
`this.gameStateManager.markDirty()` after the interaction tracking but only
when cargo was actually retrieved. Add after line 839:

```js
    npcState.lastInteraction = state.player.daysElapsed;
    npcState.interactions += 1;

    if (retrievedCargo.length > 0) {
      this.gameStateManager.markDirty();
    }

    return {
```

Run: `npm test -- tests/unit/npc-manager-markdirty.test.js`
Expected: PASS

### Step 25: Make GSM facade methods pure pass-through

In `src/game/state/game-state-manager.js`, simplify these 9 methods:

**modifyRep (line 547-550):**
```js
  modifyRep(npcId, amount, reason) {
    this.npcManager.modifyRep(npcId, amount, reason);
  }
```

**modifyRepRaw (line 552-555):**
```js
  modifyRepRaw(npcId, amount, reason) {
    this.npcManager.modifyRepRaw(npcId, amount, reason);
  }
```

**setNpcRep (line 557-561):**
```js
  setNpcRep(npcId, value) {
    this.npcManager.setNpcRep(npcId, value);
  }
```

**getTip (line 745-751):**
```js
  getTip(npcId) {
    return this.npcManager.getTip(npcId);
  }
```

**requestLoan (line 769-775):**
```js
  requestLoan(npcId) {
    return this.npcManager.requestLoan(npcId);
  }
```

**repayLoan (line 777-783):**
```js
  repayLoan(npcId) {
    return this.npcManager.repayLoan(npcId);
  }
```

**checkLoanDefaults (line 785-788):**
```js
  checkLoanDefaults() {
    this.npcManager.checkLoanDefaults();
  }
```

**storeCargo (line 790-796):**
```js
  storeCargo(npcId) {
    return this.npcManager.storeCargo(npcId);
  }
```

**retrieveCargo (line 798-804):**
```js
  retrieveCargo(npcId) {
    return this.npcManager.retrieveCargo(npcId);
  }
```

### Step 26: Run full test suite

Run: `npm test`
Expected: All tests pass

### Step 27: Commit

```
git add src/game/state/managers/npc.js src/game/state/game-state-manager.js tests/unit/npc-manager-markdirty.test.js
git commit -m "Move markDirty/emit into NPCManager, make GSM facade pure pass-through"
```

---

## Task 6: Normalize mutation contract — NavigationManager

Move `markDirty()` into `updateLocation()` so the GSM `devTeleport` method
becomes pure pass-through.

**Files:**
- Modify: `src/game/state/managers/navigation.js:29-70`
- Modify: `src/game/state/game-state-manager.js:1237-1240`
- Create: `tests/unit/navigation-manager-markdirty.test.js`

### Step 1: Write failing test

```js
// tests/unit/navigation-manager-markdirty.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('NavigationManager markDirty contract', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updateLocation calls markDirty', () => {
    const spy = vi.spyOn(gsm, 'markDirty');
    gsm.navigationManager.updateLocation(1);
    expect(spy).toHaveBeenCalled();
  });
});
```

### Step 2: Run test — verify RED

Run: `npm test -- tests/unit/navigation-manager-markdirty.test.js`
Expected: FAIL

### Step 3: Add markDirty to updateLocation

In `src/game/state/managers/navigation.js`, in `updateLocation` (line 29-70),
add `this.gameStateManager.markDirty()` after the `checkAchievements` call
(line 69):

```js
    this.emit(EVENT_NAMES.LOCATION_CHANGED, newSystemId);
    this.emit(EVENT_NAMES.JUMP_COMPLETED, newSystemId);
    this.gameStateManager.checkAchievements();
    this.gameStateManager.markDirty();
  }
```

### Step 4: Run test — verify GREEN

Run: `npm test -- tests/unit/navigation-manager-markdirty.test.js`
Expected: PASS

### Step 5: Make GSM devTeleport pure pass-through

In `src/game/state/game-state-manager.js`, simplify `devTeleport`
(line 1237-1240):

```js
  devTeleport(systemId) {
    this.navigationManager.updateLocation(systemId);
  }
```

### Step 6: Run full test suite

Run: `npm test`
Expected: All tests pass

### Step 7: Commit

```
git add src/game/state/managers/navigation.js src/game/state/game-state-manager.js tests/unit/navigation-manager-markdirty.test.js
git commit -m "Move markDirty into NavigationManager.updateLocation, make devTeleport pass-through"
```

---

## Final Step: Mark Phase 0 complete

### Step 1: Update design doc

In `docs/plans/2026-03-08-gsm-refactor-design.md`, change the Phase 0 header
to include completion status:

```
### Phase 0: Preparatory Cleanup ✅ COMPLETE
```

### Step 2: Commit

```
git add docs/plans/2026-03-08-gsm-refactor-design.md
git commit -m "Mark Phase 0 complete in GSM refactor design doc"
```
