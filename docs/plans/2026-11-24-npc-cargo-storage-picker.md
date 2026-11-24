# NPC Cargo Storage Picker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let the player choose what to store with and retrieve from an NPC, through a modal picker, while NPC storage never takes mission cargo and never holds more than `CARGO_STORAGE_LIMIT` units in total.

**Architecture:** The NPC manager takes explicit `selections = [{ stackIndex, qty }]`, validates all of them before changing anything, and applies the change against copies. The dialogue engine runs declarative `picker: 'store' | 'retrieve'` choices itself and grants `repGain` only when the manager call succeeds (ADR `paad/adrs/0001-dialogue-engine-owns-picker-choices.md`). `DialoguePanel` opens a `Modal` with a new `CargoStoragePicker`, which only collects selections and hands them back.

**Tech Stack:** React 18, Vitest, React Testing Library, fast-check, ESM.

**Spec:** `docs/plans/2026-11-24-npc-cargo-storage-picker-design.md`. Read it before starting. Where this plan and the spec disagree, the spec wins. Stop and ask.

---

## Ground rules (read once)

- **TDD, one failing test at a time.** Each task lists its tests in full. Add the **first** `it(...)`, run it, watch it fail, then write just enough code to pass. Then add the next `it(...)`. The "Implementation" block in each task shows the finished code you should end up with. Don't paste it all before the tests exist.
- Run a single file: `npm test -- tests/unit/<file>.test.js`. **Don't** use `npm test --run`: without the `--` separator vitest silently drops the argument.
- Before every commit: `npm test` (full suite) and `npm run lint` must both be clean, with no stderr warnings from tests. Mock `console` in tests that hit error paths.
- Commit messages: plain `git commit -m "subject" -m "body"`. **Never** use heredocs or `$(...)`. End each message with the line `-m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`.
- No magic numbers in implementation files. The constants already exist: `NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT` (10) and `NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS` (30) in `src/game/constants.js`. Dialogue `repGain` literals stay inline, as in every other dialogue file.
- Comments explain WHY, not WHAT. Never mention task numbers.
- NPC display names come from `src/game/data/npc-data.js` unchanged (e.g. `"Rusty" Rodriguez`). Tests read them from `ALL_NPCS` instead of hard-coding them.
- The storage NPC IDs are `whisper_sirius`, `vasquez_epsilon`, `kim_tau_ceti`, `rodriguez_procyon`, `osman_luyten`, `kowalski_alpha_centauri` and `liu_wolf359`.

---

### Task 1: `canRequestFavor` reports "Storage full"

**Files:**
- Modify: `src/game/state/managers/npc.js` (`canRequestFavor`, around lines 324-393, plus a module-level helper)
- Test (create): `tests/unit/npc-cargo-storage-selections.test.js`

**Step 1: Create the test file with the first test**

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
} from '../../src/game/constants.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

const NPC_ID = 'rodriguez_procyon';
const NPC_NAME = ALL_NPCS.find((npc) => npc.id === NPC_ID).name;
const LIMIT = NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT;

describe('NPC cargo storage with selections', () => {
  let game;
  let npcState;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    game = createTestGame();
    npcState = game.getNPCState(NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.FRIENDLY_MIN;
    npcState.lastFavorDay = null;
    npcState.storedCargo = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('canRequestFavor storage', () => {
    it('is unavailable below the Friendly tier', () => {
      npcState.rep = REPUTATION_BOUNDS.FRIENDLY_MIN - 1;
      const result = game.canRequestFavor(NPC_ID, 'storage');
      expect(result.available).toBe(false);
      expect(result.reason).toMatch(/Friendly/);
    });

    it('reports Storage full at the cap', () => {
      npcState.storedCargo = [{ good: 'ore', qty: LIMIT, buyPrice: 10 }];
      expect(game.canRequestFavor(NPC_ID, 'storage')).toEqual({
        available: false,
        reason: 'Storage full',
      });
    });

    it('reports Storage full over the cap (older saves)', () => {
      npcState.storedCargo = [{ good: 'ore', qty: LIMIT + 5, buyPrice: 10 }];
      expect(game.canRequestFavor(NPC_ID, 'storage').reason).toBe(
        'Storage full'
      );
    });

    it('is available under the cap', () => {
      npcState.storedCargo = [{ good: 'ore', qty: LIMIT - 1, buyPrice: 10 }];
      expect(game.canRequestFavor(NPC_ID, 'storage').available).toBe(true);
    });

    it('does not report Storage full for loans', () => {
      npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
      npcState.storedCargo = [{ good: 'ore', qty: LIMIT, buyPrice: 10 }];
      expect(game.canRequestFavor(NPC_ID, 'loan').available).toBe(true);
    });
  });
});
```

The first test (below Friendly) already passes. It's here to move the tier assertion that `dialogue-tree-structure` drops later. Start the red/green cycle with "reports Storage full at the cap".

**Step 2: Run, expect FAIL**

Run: `npm test -- tests/unit/npc-cargo-storage-selections.test.js`
Expected: "reports Storage full at the cap" FAILS (`available: true`).

**Step 3: Implementation**

In `src/game/state/managers/npc.js`, add this below the imports:

```js
function totalUnits(stacks) {
  return stacks.reduce((total, stack) => total + stack.qty, 0);
}
```

In `canRequestFavor`, inside the `else if (favorType === 'storage')` branch, after the Friendly tier check returns:

```js
      // >= because older saves can already hold more than the cap
      const storedUnits = totalUnits(npcState.storedCargo ?? []);
      if (storedUnits >= NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT) {
        return { available: false, reason: 'Storage full' };
      }
```

Also update the JSDoc list in `canRequestFavor` to add "5. Storage is not full (storage requests)".

**Step 4: Run, expect PASS.** Then run `npm test` and `npm run lint`.

**Step 5: Commit**

```bash
git add src/game/state/managers/npc.js tests/unit/npc-cargo-storage-selections.test.js
git commit -m "feat(npc): report Storage full when NPC storage is at the cap" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `storeCargo(npcId, selections)`

**Files:**
- Modify: `src/game/state/managers/npc.js` (`storeCargo`, ~lines 592-700; add two private helpers)
- Modify: `src/game/state/game-coordinator.js:1209-1211` (pass `selections` through)
- Modify: `tests/unit/npc-cargo-storage-selections.test.js`
- Modify (same commit, they break): `tests/unit/npc-manager-coverage.test.js` (`describe('storeCargo')`, ~lines 406-446), `tests/unit/npc-manager-markdirty.test.js` (`storeCargo calls markDirty on success`, ~lines 104-118), `tests/property/cargo-storage-transfer.property.test.js` (full rewrite)

**Step 1: Add the tests one at a time** (inside the outer `describe`):

```js
  describe('storeCargo', () => {
    const hold = () => game.getState().ship.cargo;

    beforeEach(() => {
      game.updateCargo([
        { good: 'grain', qty: 5, buyPrice: 10 },
        { good: 'ore', qty: 4, buyPrice: 20 },
        { good: 'grain', qty: 3, buyPrice: 12 },
      ]);
    });

    it('stores exactly the selected quantities', () => {
      const result = game.storeCargo(NPC_ID, [
        { stackIndex: 0, qty: 2 },
        { stackIndex: 1, qty: 1 },
      ]);
      expect(result.success).toBe(true);
      expect(result.stored).toBe(3);
      expect(hold().map((s) => s.qty)).toEqual([3, 3, 3]);
      expect(npcState.storedCargo).toEqual([
        { good: 'grain', qty: 2, buyPrice: 10 },
        { good: 'ore', qty: 1, buyPrice: 20 },
      ]);
    });

    it('removes stacks that reach 0', () => {
      game.storeCargo(NPC_ID, [{ stackIndex: 1, qty: 4 }]);
      expect(hold().map((s) => s.good)).toEqual(['grain', 'grain']);
    });

    it('changes the right stacks when an earlier stack reaches 0', () => {
      game.storeCargo(NPC_ID, [
        { stackIndex: 0, qty: 5 },
        { stackIndex: 2, qty: 1 },
      ]);
      expect(hold()).toEqual([
        { good: 'ore', qty: 4, buyPrice: 20 },
        { good: 'grain', qty: 2, buyPrice: 12 },
      ]);
    });

    it('merges a second store of the same good and price into one stack', () => {
      game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]);
      npcState.lastFavorDay = null;
      game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 2 }]);
      expect(npcState.storedCargo).toEqual([
        { good: 'grain', qty: 3, buyPrice: 10 },
      ]);
    });

    it('sets the favor cooldown and marks dirty', () => {
      const spy = vi.spyOn(game, 'markDirty');
      game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]);
      expect(npcState.lastFavorDay).toBe(game.getState().player.daysElapsed);
      expect(spy).toHaveBeenCalled();
    });

    it('returns a pluralized message with the NPC name', () => {
      expect(game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]).message).toBe(
        `Stored 1 unit with ${NPC_NAME}`
      );
      npcState.lastFavorDay = null;
      expect(game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 3 }]).message).toBe(
        `Stored 3 units with ${NPC_NAME}`
      );
    });

    it.each([
      ['undefined', undefined],
      ['an empty array', []],
      ['a missing index', [{ stackIndex: 9, qty: 1 }]],
      ['a negative index', [{ stackIndex: -1, qty: 1 }]],
      ['a string index', [{ stackIndex: '0', qty: 1 }]],
      ['a fractional index', [{ stackIndex: 0.5, qty: 1 }]],
      ['duplicate indexes', [{ stackIndex: 0, qty: 1 }, { stackIndex: 0, qty: 1 }]],
      ["'0' alongside 0", [{ stackIndex: 0, qty: 1 }, { stackIndex: '0', qty: 1 }]],
      ['zero quantity', [{ stackIndex: 0, qty: 0 }]],
      ['negative quantity', [{ stackIndex: 0, qty: -1 }]],
      ['fractional quantity', [{ stackIndex: 0, qty: 1.5 }]],
      ['more than the stack holds', [{ stackIndex: 1, qty: 5 }]],
      ['a total over the cap', [{ stackIndex: 0, qty: 5 }, { stackIndex: 1, qty: 4 }, { stackIndex: 2, qty: 2 }]],
    ])('refuses %s and changes nothing', (_label, selections) => {
      const holdBefore = structuredClone(hold());
      const result = game.storeCargo(NPC_ID, selections);
      expect(result.success).toBe(false);
      expect(typeof result.message).toBe('string');
      expect(hold()).toEqual(holdBefore);
      expect(npcState.storedCargo).toEqual([]);
      expect(npcState.lastFavorDay).toBeNull();
    });

    it('refuses mission cargo', () => {
      game.updateCargo([
        { good: 'sealed_containers', qty: 3, buyPrice: 0, missionId: 'm1' },
      ]);
      const result = game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]);
      expect(result).toMatchObject({
        success: false,
        message: 'Mission cargo cannot be stored',
      });
      expect(npcState.storedCargo).toEqual([]);
    });

    it('caps the total against what is already stored', () => {
      npcState.storedCargo = [{ good: 'tritium', qty: LIMIT - 2, buyPrice: 5 }];
      expect(game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 3 }]).success).toBe(
        false
      );
      expect(game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 2 }]).success).toBe(
        true
      );
    });

    it('refuses when storage is already over the cap', () => {
      npcState.storedCargo = [{ good: 'tritium', qty: 15, buyPrice: 5 }];
      expect(game.storeCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }])).toMatchObject({
        success: false,
        message: 'Storage full',
      });
    });

    it('still throws for a missing npcId', () => {
      expect(() => game.storeCargo(null, [])).toThrow('Invalid npcId');
    });
  });
```

**Step 2: Run each new test and watch it fail before implementing**

Run: `npm test -- tests/unit/npc-cargo-storage-selections.test.js`

**Step 3: Implementation**

Add the import at the top of `src/game/state/managers/npc.js`:

```js
import { pluralizeUnit } from '../../utils/string-utils.js';
```

Add these private methods to the class, just above `storeCargo`:

```js
  /**
   * Check picker selections against the stacks they index into.
   * Runs every check before anything changes, so nothing is half-applied.
   *
   * @param {Array<{stackIndex: number, qty: number}>} selections
   * @param {Array} source - Stacks the selections index into
   * @param {boolean} rejectMissionCargo
   * @returns {{ total: number } | { error: string }}
   */
  _checkSelections(selections, source, rejectMissionCargo) {
    if (!Array.isArray(selections) || selections.length === 0) {
      return { error: 'Nothing selected' };
    }
    // Integer check first: 0 and '0' differ in a Set but name the same slot
    const seen = new Set();
    let total = 0;
    for (const selection of selections) {
      const { stackIndex, qty } = selection ?? {};
      if (!Number.isInteger(stackIndex) || stackIndex < 0) {
        return { error: 'Invalid cargo stack' };
      }
      if (seen.has(stackIndex)) {
        return { error: 'Cargo stack selected twice' };
      }
      seen.add(stackIndex);
      if (!Number.isInteger(qty) || qty <= 0) {
        return { error: 'Quantity must be a positive whole number' };
      }
      const stack = source[stackIndex];
      if (!stack) {
        return { error: 'Invalid cargo stack' };
      }
      if (rejectMissionCargo && stack.missionId) {
        return { error: 'Mission cargo cannot be stored' };
      }
      if (qty > stack.qty) {
        return { error: 'Not enough quantity in stack' };
      }
      total += qty;
    }
    return { total };
  }

  /**
   * Build new source and target arrays from the original indices.
   * Never splice while walking the selections: removing an earlier stack
   * would shift the indices of later ones.
   */
  _moveSelections(selections, source, target) {
    const taken = new Map(selections.map((s) => [s.stackIndex, s.qty]));
    const newSource = [];
    source.forEach((stack, index) => {
      const left = stack.qty - (taken.get(index) ?? 0);
      if (left > 0) newSource.push({ ...stack, qty: left });
    });
    const newTarget = target.map((stack) => ({ ...stack }));
    for (const { stackIndex, qty } of selections) {
      this.capabilities.addToCargoArray(newTarget, source[stackIndex], qty);
    }
    return { newSource, newTarget };
  }
```

Replace the whole `storeCargo` method (JSDoc included) with:

```js
  /**
   * Store player-selected cargo with an NPC
   *
   * Mission cargo is refused, and the NPC never holds more than
   * CARGO_STORAGE_LIMIT units in total. Sets the shared favor cooldown.
   *
   * @param {string} npcId - NPC identifier
   * @param {Array<{stackIndex: number, qty: number}>} selections - Indexes into ship cargo
   * @returns {Object} { success: boolean, stored: number, message: string }
   */
  storeCargo(npcId, selections) {
    if (!npcId || typeof npcId !== 'string') {
      throw new Error(
        'Invalid npcId: storeCargo requires a valid NPC identifier'
      );
    }

    const availability = this.canRequestFavor(npcId, 'storage');
    if (!availability.available) {
      return { success: false, stored: 0, message: availability.reason };
    }

    const npcState = this.getNPCState(npcId);
    const storedCargo = npcState.storedCargo ?? [];
    const shipCargo = this.capabilities.getShipCargo();

    const check = this._checkSelections(selections, shipCargo, true);
    if (check.error) {
      return { success: false, stored: 0, message: check.error };
    }

    const room =
      NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT - totalUnits(storedCargo);
    if (check.total > room) {
      return {
        success: false,
        stored: 0,
        message: `Only ${pluralizeUnit(room)} of storage left`,
      };
    }

    const { newSource, newTarget } = this._moveSelections(
      selections,
      shipCargo,
      storedCargo
    );
    npcState.storedCargo = newTarget;
    this.capabilities.updateCargo(newSource);

    const daysElapsed = this.capabilities.getDaysElapsed();
    npcState.lastFavorDay = daysElapsed;
    npcState.lastInteraction = daysElapsed;
    npcState.interactions += 1;

    this.capabilities.markDirty();

    return {
      success: true,
      stored: check.total,
      message: `Stored ${pluralizeUnit(check.total)} with ${this.validateAndGetNPCData(npcId).name}`,
    };
  }
```

(`room` is always positive at this point, because `canRequestFavor` already refused `>=` the cap.)

In `src/game/state/game-coordinator.js`:

```js
  storeCargo(npcId, selections) {
    return this.npcManager.storeCargo(npcId, selections);
  }
```

**Step 4: Update the tests this breaks (same commit)**

`tests/unit/npc-manager-coverage.test.js`, `describe('storeCargo')`: keep "fails when favor unavailable" and "throws for invalid npcId". Replace the other three tests with:

```js
    it('fails when nothing is selected', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep =
        REPUTATION_BOUNDS.FRIENDLY_MIN;
      gsm.state.ship.cargo = [];
      const result = gsm.npcManager.storeCargo('chen_barnards', []);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Nothing selected');
    });

    it('stores the selected cargo', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep =
        REPUTATION_BOUNDS.FRIENDLY_MIN;
      gsm.state.ship.cargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
      const result = gsm.npcManager.storeCargo('chen_barnards', [
        { stackIndex: 0, qty: 5 },
      ]);
      expect(result.success).toBe(true);
      expect(result.stored).toBe(5);
      expect(
        gsm.npcManager.getNPCState('chen_barnards').storedCargo
      ).toHaveLength(1);
    });

    it('refuses a total over CARGO_STORAGE_LIMIT', () => {
      gsm.npcManager.getNPCState('chen_barnards').rep =
        REPUTATION_BOUNDS.FRIENDLY_MIN;
      gsm.state.ship.cargo = [{ good: 'ore', qty: 20, buyPrice: 100 }];
      const result = gsm.npcManager.storeCargo('chen_barnards', [
        { stackIndex: 0, qty: NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT + 1 },
      ]);
      expect(result.success).toBe(false);
    });
```

`tests/unit/npc-manager-markdirty.test.js`, "storeCargo calls markDirty on success": that test used the wrong cargo shape and an `if` that hid failure. Replace its body:

```js
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.TRUSTED_MIN;
    npcState.lastFavorDay = null;
    gsm.getState().ship.cargo = [{ good: 'grain', qty: 5, buyPrice: 10 }];

    const spy = vi.spyOn(gsm, 'markDirty');
    const result = gsm.npcManager.storeCargo(TEST_NPC_ID, [
      { stackIndex: 0, qty: 5 },
    ]);

    expect(result.success).toBe(true);
    expect(spy).toHaveBeenCalled();
```

`tests/property/cargo-storage-transfer.property.test.js`: replace the whole file with:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { createTestGame } from '../test-utils.js';
import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  COMMODITY_TYPES,
} from '../../src/game/constants.js';

/**
 * Feature: npc-cargo-storage-picker, Property: Cargo Storage Transfer
 * Storing moves exactly the selected units from the hold into NPC storage,
 * never past CARGO_STORAGE_LIMIT, and a refused store changes nothing.
 */

const NPC_ID = 'rodriguez_procyon';
const LIMIT = NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT;

const arbHold = fc.array(
  fc.record({
    good: fc.constantFrom(...COMMODITY_TYPES),
    qty: fc.integer({ min: 1, max: 15 }),
    buyPrice: fc.integer({ min: 1, max: 200 }),
  }),
  { minLength: 1, maxLength: 6 }
);
const arbFractions = fc.array(fc.double({ min: 0, max: 1, noNaN: true }), {
  minLength: 6,
  maxLength: 6,
});

const units = (stacks) => stacks.reduce((t, s) => t + s.qty, 0);
const unitsByKey = (stacks) => {
  const totals = {};
  for (const s of stacks) {
    const key = `${s.good}@${s.buyPrice}`;
    totals[key] = (totals[key] ?? 0) + s.qty;
  }
  return totals;
};

function pickSelections(stacks, fractions, room) {
  const selections = [];
  let left = room;
  stacks.forEach((stack, stackIndex) => {
    const qty = Math.min(Math.floor(fractions[stackIndex] * stack.qty), left);
    if (qty > 0) {
      selections.push({ stackIndex, qty });
      left -= qty;
    }
  });
  return selections;
}

function setup(hold, alreadyStored) {
  const game = createTestGame();
  const npcState = game.getNPCState(NPC_ID);
  npcState.rep = REPUTATION_BOUNDS.FRIENDLY_MIN;
  npcState.lastFavorDay = null;
  npcState.storedCargo =
    alreadyStored > 0 ? [{ good: 'ore', qty: alreadyStored, buyPrice: 999 }] : [];
  game.updateCargo(hold.map((s) => ({ ...s })));
  return { game, npcState };
}

describe('Cargo Storage Transfer Property Tests', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('moves exactly the selected units and keeps per-good totals', () => {
    fc.assert(
      fc.property(
        arbHold,
        arbFractions,
        fc.integer({ min: 0, max: LIMIT - 1 }),
        (hold, fractions, alreadyStored) => {
          const selections = pickSelections(hold, fractions, LIMIT - alreadyStored);
          fc.pre(selections.length > 0);
          const { game, npcState } = setup(hold, alreadyStored);
          const before = unitsByKey([...hold, ...npcState.storedCargo]);

          const result = game.storeCargo(NPC_ID, selections);

          expect(result.success).toBe(true);
          expect(result.stored).toBe(units(selections));
          expect(units(game.getState().ship.cargo)).toBe(
            units(hold) - units(selections)
          );
          expect(units(npcState.storedCargo)).toBe(
            alreadyStored + units(selections)
          );
          expect(units(npcState.storedCargo)).toBeLessThanOrEqual(LIMIT);
          expect(
            unitsByKey([...game.getState().ship.cargo, ...npcState.storedCargo])
          ).toEqual(before);
          expect(npcState.lastFavorDay).toBe(
            game.getState().player.daysElapsed
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('refuses a total over the remaining cap and changes nothing', () => {
    fc.assert(
      fc.property(
        arbHold,
        fc.integer({ min: 0, max: LIMIT - 1 }),
        (hold, alreadyStored) => {
          fc.pre(units(hold) > LIMIT - alreadyStored);
          const { game, npcState } = setup(hold, alreadyStored);
          const selections = hold.map((s, stackIndex) => ({
            stackIndex,
            qty: s.qty,
          }));
          const storedBefore = structuredClone(npcState.storedCargo);

          const result = game.storeCargo(NPC_ID, selections);

          expect(result.success).toBe(false);
          expect(game.getState().ship.cargo).toEqual(hold);
          expect(npcState.storedCargo).toEqual(storedBefore);
          expect(npcState.lastFavorDay).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Step 5: Verify and commit**

Run: `npm test` and `npm run lint`. Both must be clean. Until Task 8 the old dialogue `action` still calls `storeCargo()` without selections and now gets `success: false`. No test covers that path through the real manager, so the suite stays green.

```bash
git add src/game/state/managers/npc.js src/game/state/game-coordinator.js tests/unit/npc-cargo-storage-selections.test.js tests/unit/npc-manager-coverage.test.js tests/unit/npc-manager-markdirty.test.js tests/property/cargo-storage-transfer.property.test.js
git commit -m "feat(npc): store only the player's selected, non-mission cargo" -m "storeCargo now takes selections, validates them all before changing anything, caps the total stored per NPC and returns a pluralized message." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `retrieveCargo(npcId, selections)`

**Files:**
- Modify: `src/game/state/managers/npc.js` (`retrieveCargo`, ~lines 703-810)
- Modify: `src/game/state/game-coordinator.js:1213-1215`
- Modify: `tests/unit/npc-cargo-storage-selections.test.js`
- Modify (same commit): `tests/unit/npc-manager-coverage.test.js` (`describe('retrieveCargo')`), `tests/unit/npc-manager-markdirty.test.js` (`retrieveCargo calls markDirty when cargo is retrieved`), `tests/property/cargo-retrieval-completeness.property.test.js` (full rewrite)

**Step 1: Add the tests one at a time**

```js
  describe('retrieveCargo', () => {
    const hold = () => game.getState().ship.cargo;

    beforeEach(() => {
      game.updateCargo([]);
      npcState.storedCargo = [
        { good: 'grain', qty: 4, buyPrice: 10 },
        { good: 'ore', qty: 3, buyPrice: 20 },
        { good: 'tritium', qty: 2, buyPrice: 30 },
      ];
    });

    it('takes the selected stacks', () => {
      const result = game.retrieveCargo(NPC_ID, [{ stackIndex: 1, qty: 2 }]);
      expect(result.success).toBe(true);
      expect(result.retrieved).toBe(2);
      expect(hold()).toEqual([{ good: 'ore', qty: 2, buyPrice: 20 }]);
      expect(npcState.storedCargo.map((s) => s.qty)).toEqual([4, 1, 2]);
    });

    it('changes the right stacks when an earlier stack reaches 0', () => {
      game.retrieveCargo(NPC_ID, [
        { stackIndex: 0, qty: 4 },
        { stackIndex: 2, qty: 1 },
      ]);
      expect(npcState.storedCargo).toEqual([
        { good: 'ore', qty: 3, buyPrice: 20 },
        { good: 'tritium', qty: 1, buyPrice: 30 },
      ]);
    });

    it('merges into a matching hold stack', () => {
      game.updateCargo([{ good: 'grain', qty: 1, buyPrice: 10 }]);
      game.retrieveCargo(NPC_ID, [{ stackIndex: 0, qty: 2 }]);
      expect(hold()).toEqual([{ good: 'grain', qty: 3, buyPrice: 10 }]);
    });

    it('does not start the favor cooldown', () => {
      game.retrieveCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]);
      expect(npcState.lastFavorDay).toBeNull();
    });

    it('works below the Friendly tier', () => {
      npcState.rep = 0;
      expect(game.retrieveCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]).success).toBe(
        true
      );
    });

    it('returns a pluralized message with the NPC name', () => {
      expect(
        game.retrieveCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]).message
      ).toBe(`Retrieved 1 unit from ${NPC_NAME}`);
      expect(
        game.retrieveCargo(NPC_ID, [{ stackIndex: 1, qty: 3 }]).message
      ).toBe(`Retrieved 3 units from ${NPC_NAME}`);
    });

    it('refuses a total over the free hold space', () => {
      const space = game.getCargoRemaining();
      game.updateCargo([{ good: 'medicine', qty: space - 1, buyPrice: 5 }]);
      const result = game.retrieveCargo(NPC_ID, [{ stackIndex: 0, qty: 2 }]);
      expect(result).toMatchObject({
        success: false,
        message: 'Not enough cargo space',
      });
      expect(npcState.storedCargo[0].qty).toBe(4);
    });

    it('counts passenger space against the hold', () => {
      const capacity = game.getState().ship.cargoCapacity;
      game.updateCargo([{ good: 'medicine', qty: capacity - 3, buyPrice: 5 }]);
      game.getState().missions.active.push({
        id: 'p1',
        type: 'passenger',
        requirements: { cargoSpace: 2 },
      });
      // 3 units fit capacity minus cargo, but only 1 fits once the passenger counts
      expect(game.retrieveCargo(NPC_ID, [{ stackIndex: 0, qty: 2 }]).success).toBe(
        false
      );
      expect(game.retrieveCargo(NPC_ID, [{ stackIndex: 0, qty: 1 }]).success).toBe(
        true
      );
    });

    it.each([
      ['undefined', undefined],
      ['an empty array', []],
      ['a missing index', [{ stackIndex: 7, qty: 1 }]],
      ['duplicate indexes', [{ stackIndex: 0, qty: 1 }, { stackIndex: 0, qty: 1 }]],
      ["'0' alongside 0", [{ stackIndex: 0, qty: 1 }, { stackIndex: '0', qty: 1 }]],
      ['zero quantity', [{ stackIndex: 0, qty: 0 }]],
      ['fractional quantity', [{ stackIndex: 0, qty: 0.5 }]],
      ['more than the stack holds', [{ stackIndex: 2, qty: 3 }]],
    ])('refuses %s and changes nothing', (_label, selections) => {
      const storedBefore = structuredClone(npcState.storedCargo);
      const result = game.retrieveCargo(NPC_ID, selections);
      expect(result.success).toBe(false);
      expect(npcState.storedCargo).toEqual(storedBefore);
      expect(hold()).toEqual([]);
    });
  });
```

Before writing the passenger test, check where active missions live: `grep -n "getActiveMissions" src/game/state/game-coordinator.js`. If it isn't `state.missions.active`, adjust the `push` line to match.

**Step 2: Run each and watch it fail.**

**Step 3: Implementation.** Replace the whole `retrieveCargo` method (JSDoc included):

```js
  /**
   * Retrieve player-selected cargo from an NPC
   *
   * Limited by free hold space, which already counts passengers.
   * Getting your own cargo back is not a favor, so no cooldown.
   *
   * @param {string} npcId - NPC identifier
   * @param {Array<{stackIndex: number, qty: number}>} selections - Indexes into storedCargo
   * @returns {Object} { success: boolean, retrieved: number, message: string }
   */
  retrieveCargo(npcId, selections) {
    if (!npcId || typeof npcId !== 'string') {
      throw new Error(
        'Invalid npcId: retrieveCargo requires a valid NPC identifier'
      );
    }

    const npcState = this.getNPCState(npcId);
    const storedCargo = npcState.storedCargo ?? [];

    const check = this._checkSelections(selections, storedCargo, false);
    if (check.error) {
      return { success: false, retrieved: 0, message: check.error };
    }

    if (check.total > this.capabilities.getCargoRemaining()) {
      return {
        success: false,
        retrieved: 0,
        message: 'Not enough cargo space',
      };
    }

    const { newSource, newTarget } = this._moveSelections(
      selections,
      storedCargo,
      this.capabilities.getShipCargo()
    );
    npcState.storedCargo = newSource;
    this.capabilities.updateCargo(newTarget);

    npcState.lastInteraction = this.capabilities.getDaysElapsed();
    npcState.interactions += 1;

    this.capabilities.markDirty();

    return {
      success: true,
      retrieved: check.total,
      message: `Retrieved ${pluralizeUnit(check.total)} from ${this.validateAndGetNPCData(npcId).name}`,
    };
  }
```

Coordinator:

```js
  retrieveCargo(npcId, selections) {
    return this.npcManager.retrieveCargo(npcId, selections);
  }
```

**Step 4: Update the tests this breaks**

`tests/unit/npc-manager-coverage.test.js`, `describe('retrieveCargo')`: keep "throws for invalid npcId" and replace the other two with:

```js
    it('fails when nothing is selected', () => {
      gsm.npcManager.getNPCState('chen_barnards');
      const result = gsm.npcManager.retrieveCargo('chen_barnards', []);
      expect(result.success).toBe(false);
    });

    it('retrieves the selected cargo', () => {
      const npcState = gsm.npcManager.getNPCState('chen_barnards');
      npcState.storedCargo = [{ good: 'ore', qty: 5, buyPrice: 100 }];
      gsm.state.ship.cargo = [];
      const result = gsm.npcManager.retrieveCargo('chen_barnards', [
        { stackIndex: 0, qty: 5 },
      ]);
      expect(result.success).toBe(true);
      expect(result.retrieved).toBe(5);
      expect(npcState.storedCargo).toHaveLength(0);
    });
```

`tests/unit/npc-manager-markdirty.test.js`, the retrieve test body becomes:

```js
    const npcState = gsm.npcManager.getNPCState(TEST_NPC_ID);
    npcState.storedCargo = [{ good: 'grain', qty: 3, buyPrice: 10 }];
    gsm.getState().ship.cargo = [];

    const spy = vi.spyOn(gsm, 'markDirty');
    const result = gsm.npcManager.retrieveCargo(TEST_NPC_ID, [
      { stackIndex: 0, qty: 3 },
    ]);

    expect(result.success).toBe(true);
    expect(spy).toHaveBeenCalled();
```

`tests/property/cargo-retrieval-completeness.property.test.js`: replace the whole file with:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { createTestGame } from '../test-utils.js';
import { COMMODITY_TYPES } from '../../src/game/constants.js';

/**
 * Feature: npc-cargo-storage-picker, Property: Cargo Retrieval
 * Retrieval moves exactly the selected units into the hold, never past free
 * hold space, never starts the favor cooldown, and a refusal changes nothing.
 */

const NPC_ID = 'rodriguez_procyon';

const arbStored = fc.array(
  fc.record({
    good: fc.constantFrom(...COMMODITY_TYPES),
    qty: fc.integer({ min: 1, max: 10 }),
    buyPrice: fc.integer({ min: 1, max: 200 }),
  }),
  { minLength: 1, maxLength: 5 }
);
const arbFractions = fc.array(fc.double({ min: 0, max: 1, noNaN: true }), {
  minLength: 5,
  maxLength: 5,
});

const units = (stacks) => stacks.reduce((t, s) => t + s.qty, 0);

function setup(stored, holdUnits) {
  const game = createTestGame();
  const npcState = game.getNPCState(NPC_ID);
  npcState.lastFavorDay = null;
  npcState.storedCargo = stored.map((s) => ({ ...s }));
  game.updateCargo(
    holdUnits > 0 ? [{ good: 'medicine', qty: holdUnits, buyPrice: 1 }] : []
  );
  return { game, npcState };
}

describe('Cargo Retrieval Property Tests', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('moves exactly the selected units within free hold space', () => {
    fc.assert(
      fc.property(
        arbStored,
        arbFractions,
        fc.integer({ min: 0, max: 40 }),
        (stored, fractions, holdUnits) => {
          const { game, npcState } = setup(stored, holdUnits);
          let left = Math.max(0, game.getCargoRemaining());
          const selections = [];
          stored.forEach((s, stackIndex) => {
            const qty = Math.min(Math.floor(fractions[stackIndex] * s.qty), left);
            if (qty > 0) {
              selections.push({ stackIndex, qty });
              left -= qty;
            }
          });
          fc.pre(selections.length > 0);

          const result = game.retrieveCargo(NPC_ID, selections);

          expect(result.success).toBe(true);
          expect(units(npcState.storedCargo)).toBe(
            units(stored) - units(selections)
          );
          expect(units(game.getState().ship.cargo)).toBe(
            holdUnits + units(selections)
          );
          expect(game.getCargoRemaining()).toBeGreaterThanOrEqual(0);
          expect(npcState.lastFavorDay).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('refuses a total over free hold space and changes nothing', () => {
    fc.assert(
      fc.property(arbStored, fc.integer({ min: 0, max: 60 }), (stored, holdUnits) => {
        const { game, npcState } = setup(stored, holdUnits);
        fc.pre(units(stored) > game.getCargoRemaining());
        const holdBefore = structuredClone(game.getState().ship.cargo);
        const selections = stored.map((s, stackIndex) => ({
          stackIndex,
          qty: s.qty,
        }));

        const result = game.retrieveCargo(NPC_ID, selections);

        expect(result.success).toBe(false);
        expect(npcState.storedCargo).toEqual(stored);
        expect(game.getState().ship.cargo).toEqual(holdBefore);
      }),
      { numRuns: 100 }
    );
  });
});
```

If the starting `cargoCapacity` from `createTestGame()` is below 40, `updateCargo` can overfill the hold. That's fine: `getCargoRemaining()` goes negative, the first property's `fc.pre` skips that case, and the second property covers it.

**Step 5: Verify and commit**

```bash
git add src/game/state/managers/npc.js src/game/state/game-coordinator.js tests/unit/npc-cargo-storage-selections.test.js tests/unit/npc-manager-coverage.test.js tests/unit/npc-manager-markdirty.test.js tests/property/cargo-retrieval-completeness.property.test.js
git commit -m "feat(npc): retrieve only the player's selected stored cargo" -m "retrieveCargo now takes selections, refuses totals over free hold space (passengers included) and returns a message. It never starts the favor cooldown." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Conservation property

**Files:**
- Create: `tests/property/cargo-storage-conservation.property.test.js`

This is a property test of behaviour that already exists. It should pass on the first run. If it fails, you've found a bug in Task 2 or 3: fix it there.

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { createTestGame } from '../test-utils.js';
import {
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
  COMMODITY_TYPES,
} from '../../src/game/constants.js';

/**
 * Feature: npc-cargo-storage-picker, Property: Storage Conservation
 * Across any sequence of stores and retrieves (valid or not), total units in
 * hold plus storage never change, mission cargo never reaches storage, and
 * stored units never exceed CARGO_STORAGE_LIMIT.
 */

const NPC_ID = 'rodriguez_procyon';
const LIMIT = NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT;
const units = (stacks) => stacks.reduce((t, s) => t + s.qty, 0);

const arbHold = fc.array(
  fc.record(
    {
      good: fc.constantFrom(...COMMODITY_TYPES),
      qty: fc.integer({ min: 1, max: 8 }),
      buyPrice: fc.integer({ min: 1, max: 50 }),
      missionId: fc.constantFrom('m1', 'm2'),
    },
    { requiredKeys: ['good', 'qty', 'buyPrice'] }
  ),
  { minLength: 1, maxLength: 5 }
);

const arbOp = fc.record({
  kind: fc.constantFrom('store', 'retrieve'),
  selections: fc.array(
    fc.record({
      stackIndex: fc.integer({ min: 0, max: 5 }),
      qty: fc.integer({ min: 1, max: 8 }),
    }),
    { minLength: 1, maxLength: 3 }
  ),
});

describe('Cargo Storage Conservation Property Tests', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('conserves units and keeps storage free of mission cargo and under the cap', () => {
    fc.assert(
      fc.property(arbHold, fc.array(arbOp, { maxLength: 8 }), (hold, ops) => {
        const game = createTestGame();
        const npcState = game.getNPCState(NPC_ID);
        npcState.rep = REPUTATION_BOUNDS.FRIENDLY_MIN;
        npcState.storedCargo = [];
        game.updateCargo(hold.map((s) => ({ ...s })));
        const total = units(hold);

        for (const op of ops) {
          // Clear the cooldown so stores are judged on their selections only
          npcState.lastFavorDay = null;
          if (op.kind === 'store') game.storeCargo(NPC_ID, op.selections);
          else game.retrieveCargo(NPC_ID, op.selections);

          expect(units(game.getState().ship.cargo) + units(npcState.storedCargo)).toBe(
            total
          );
          expect(npcState.storedCargo.some((s) => s.missionId)).toBe(false);
          expect(units(npcState.storedCargo)).toBeLessThanOrEqual(LIMIT);
        }
      }),
      { numRuns: 100 }
    );
  });
});
```

Run: `npm test -- tests/property/cargo-storage-conservation.property.test.js`. Expected: PASS.

```bash
git add tests/property/cargo-storage-conservation.property.test.js
git commit -m "test(npc): property test for NPC storage conservation" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Save migration drops stored mission cargo

**Files:**
- Modify: `src/game/state/state-validators.js` (`addStateDefaults`, right after the `// Initialize NPC state if missing` block, ~line 849). `addStateDefaults` runs on every load (`game-coordinator.js:612`).
- Test: `tests/unit/state-validators.test.js` (inside `describe('addStateDefaults')`, which already builds `partialState` in `beforeEach`)

**Step 1: Tests, one at a time**

```js
    it('drops stored NPC cargo that has a missionId', () => {
      partialState.missions = {
        active: [{ id: 'active_mission' }],
        completed: [],
        failed: [],
      };
      partialState.npcs = {
        rodriguez_procyon: {
          storedCargo: [
            { good: 'grain', qty: 2, buyPrice: 10 },
            { good: 'sealed_containers', qty: 3, buyPrice: 0, missionId: 'active_mission' },
            { good: 'medicine', qty: 1, buyPrice: 0, missionId: 'gone_mission' },
          ],
        },
      };

      const normalized = addStateDefaults(partialState, TEST_STAR_DATA);

      expect(normalized.npcs.rodriguez_procyon.storedCargo).toEqual([
        { good: 'grain', qty: 2, buyPrice: 10 },
      ]);
    });

    it('leaves NPCs without storedCargo alone', () => {
      partialState.npcs = { chen_barnards: { rep: 5 } };
      const normalized = addStateDefaults(partialState, TEST_STAR_DATA);
      expect(normalized.npcs.chen_barnards).toEqual({ rep: 5 });
    });
```

If `addStateDefaults` already fills `missions` with its own defaults, leave out the `partialState.missions` line. The behaviour under test doesn't depend on it: stacks with a `missionId` are dropped whether or not the mission is active.

**Step 2: Run, expect the first to FAIL.**

**Step 3: Implementation**, after the NPC init block:

```js
  // NPC storage never holds mission cargo. Older saves could store it, so
  // drop it whether or not its mission is still active.
  for (const npcState of Object.values(state.npcs)) {
    if (Array.isArray(npcState?.storedCargo)) {
      npcState.storedCargo = npcState.storedCargo.filter(
        (stack) => !stack.missionId
      );
    }
  }
```

**Step 4: Verify and commit**

```bash
git add src/game/state/state-validators.js tests/unit/state-validators.test.js
git commit -m "fix(save): drop mission cargo from NPC storage on load" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `selectChoice` returns `{ success, message, display }`

This is a pure refactor of the return shape through four layers. No picker yet.

**Files:**
- Modify: `src/game/game-dialogue.js` (`selectChoice`, bottom of file)
- Modify: `src/game/state/managers/dialogue.js:117-152` (`selectDialogueChoice`)
- Modify: `src/game/state/game-coordinator.js:1165-1167`
- Modify: `src/hooks/useDialogue.js` (`selectChoice`)
- Modify: `src/features/dialogue/DialoguePanel.jsx` (`handleChoiceSelection`)
- Test (create): `tests/unit/dialogue-select-result.test.js`
- Modify (same commit, they read the old return value): `tests/unit/dialogue-edge-cases.test.js` (lines ~41-44, ~69-70, ~270-303), `tests/unit/game-dialogue-coverage.test.js` (~147-202), `tests/property/dialogue-navigation.property.test.js` (~55-72, ~117-118), `tests/property/dialogue-flag-timing.property.test.js` (~109, ~127), `tests/property/dialogue-reputation-timing.property.test.js` (~62, ~128)

**Step 1: Tests, one at a time**

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { showDialogue, selectChoice } from '../../src/game/game-dialogue.js';

const NPC_ID = 'chen_barnards';

describe('selectChoice result shape', () => {
  let game;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    game = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success with the next display for a continuing choice', () => {
    const greeting = showDialogue(NPC_ID, 'greeting', game);
    const choice = greeting.choices.find((c) => c.next);
    const result = selectChoice(NPC_ID, choice.index, game);
    expect(result.success).toBe(true);
    expect(result.display.npcId).toBe(NPC_ID);
    expect(result).not.toHaveProperty('message');
  });

  it('returns success with display null when the dialogue ends', () => {
    const greeting = showDialogue(NPC_ID, 'greeting', game);
    const choice = greeting.choices.find((c) => c.next === null);
    expect(selectChoice(NPC_ID, choice.index, game)).toEqual({
      success: true,
      display: null,
    });
  });

  it('selectDialogueChoice returns { success } and stores the display', async () => {
    await game.startDialogue(NPC_ID, 'greeting');
    const choice = game.getDialogueState().display.choices.find((c) => c.next);
    const result = await game.selectDialogueChoice(NPC_ID, choice.index);
    expect(result.success).toBe(true);
    expect(game.getDialogueState().display.npcId).toBe(NPC_ID);
  });
});
```

**Step 2: Run, expect FAIL.**

**Step 3: Implementation**

`src/game/game-dialogue.js`, at the end of `selectChoice`, replace:

```js
  if (!selectedChoice.next) {
    gameStateManager.clearDialogueState();
    return { success: true, display: null };
  }

  return {
    success: true,
    display: showDialogue(npcId, selectedChoice.next, gameStateManager),
  };
```

Also update its JSDoc `@returns` to `{Object} { success: boolean, message?: string, display: Object|null }`.

`src/game/state/managers/dialogue.js`, replace `selectDialogueChoice`:

```js
  /**
   * Select a dialogue choice and advance conversation
   *
   * On failure nothing changes and nothing is emitted: a picker choice whose
   * operation failed must leave the player on the same node.
   *
   * @param {string} npcId - NPC identifier
   * @param {number} choiceIndex - Index of selected choice
   * @param {Object} [options] - e.g. { selections } for picker choices
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async selectDialogueChoice(npcId, choiceIndex, options = {}) {
    this.validateState();

    const { selectChoice } = await import('../../game-dialogue.js');

    const result = selectChoice(
      npcId,
      choiceIndex,
      this.capabilities.coordinatorRef,
      options
    );

    if (!result.success) {
      return { success: false, message: result.message };
    }

    const dialogue = this.capabilities.getOwnState();

    if (result.display) {
      dialogue.currentNpcId = npcId;
      dialogue.currentNodeId =
        result.display.currentNodeId || dialogue.currentNodeId;
      dialogue.isActive = true;
      dialogue.display = result.display;
    } else {
      dialogue.currentNpcId = null;
      dialogue.currentNodeId = null;
      dialogue.isActive = false;
      dialogue.display = null;
    }

    this.capabilities.emit(EVENT_NAMES.DIALOGUE_CHANGED, { ...dialogue });

    return { success: true, message: result.message };
  }
```

Add `options = {}` to the `selectChoice` signature now (`export function selectChoice(npcId, choiceIndex, gameStateManager, options = {})`). It's unused until Task 7, so prefix it `_options` if lint complains, and rename it in Task 7.

`game-coordinator.js`:

```js
  async selectDialogueChoice(npcId, choiceIndex, options) {
    return await this.dialogueManager.selectDialogueChoice(
      npcId,
      choiceIndex,
      options
    );
  }
```

`useDialogue.js` `selectChoice` (update the JSDoc `@returns` to `Promise<{success: boolean, message?: string}>`):

```js
  const selectChoice = useCallback(
    async (npcId, choiceIndex, options) => {
      try {
        return await game.selectDialogueChoice(npcId, choiceIndex, options);
      } catch (error) {
        console.error('Failed to select dialogue choice:', error);
        return { success: false };
      }
    },
    [game]
  );
```

`DialoguePanel.jsx` `handleChoiceSelection`:

```js
      const result = await selectChoice(npcId, choiceIndex);

      if (!result.success) {
```

**Step 4: Mechanical test updates.** In each listed test, a variable assigned from `selectChoice(...)` that is then read as a display, or compared to `null`, gets `.display`:

- `const result = selectChoice(...); expect(result).toBeNull();` → `expect(result.display).toBeNull();`
- `const nextDialogue = selectChoice(...)` → `const nextDialogue = selectChoice(...).display;`
- `game-dialogue-coverage` line ~202, `expect(result !== undefined).toBe(true)` → `expect(result.success).toBe(true)`.
- `dialogue-flag-timing` lines ~109 and ~127: append `.display` to the call.

Grep to make sure you got them all: `grep -rn "selectChoice(" tests | grep -v "\.display\|toThrow"`. Review each remaining hit by hand.

**Step 5: Verify and commit.** Run the full suite. The DialoguePanel integration tests (`tests/integration/dialogue-*.jsx`, `tests/property/numbered-choice-list.property.test.jsx`) exercise the panel path.

```bash
git add -A src/game/game-dialogue.js src/game/state/managers/dialogue.js src/game/state/game-coordinator.js src/hooks/useDialogue.js src/features/dialogue/DialoguePanel.jsx tests
git commit -m "refactor(dialogue): selectChoice returns success, message and display" -m "DialogueManager would draw any truthy return as a node, so picker results need a uniform shape. A failed choice now changes no dialogue state and emits nothing." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: The engine runs picker choices

**Files:**
- Modify: `src/game/game-dialogue.js` (`showDialogue` choice mapping; `selectChoice`)
- Test (create): `tests/unit/dialogue-picker-choices.test.js`

The tests temporarily swap Rusty's tree for a small test tree, so the engine can be tested before any NPC data uses `picker`. `ALL_DIALOGUE_TREES` is a plain object, so assigning to it and restoring it in `afterEach` is enough.

**Step 1: Tests, one at a time**

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { showDialogue, selectChoice } from '../../src/game/game-dialogue.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';
import { REPUTATION_BOUNDS, EVENT_NAMES } from '../../src/game/constants.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

const NPC_ID = 'rodriguez_procyon';
const NPC_NAME = ALL_NPCS.find((npc) => npc.id === NPC_ID).name;
const STORE = 0;
const RETRIEVE = 1;

const PICKER_TREE = {
  greeting: {
    text: 'Hello.',
    choices: [{ text: 'Bye.', next: null }],
  },
  storage: {
    text: 'Storage?',
    choices: [
      { text: 'Store it.', next: 'greeting', repGain: 2, picker: 'store' },
      { text: 'Give it back.', next: 'greeting', picker: 'retrieve' },
    ],
  },
};

describe('Dialogue engine picker choices', () => {
  let game;
  let npcState;
  let originalTree;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    originalTree = ALL_DIALOGUE_TREES[NPC_ID];
    ALL_DIALOGUE_TREES[NPC_ID] = PICKER_TREE;
    game = createTestGame();
    npcState = game.getNPCState(NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.FRIENDLY_MIN;
    npcState.lastFavorDay = null;
    npcState.storedCargo = [];
    game.updateCargo([{ good: 'grain', qty: 5, buyPrice: 10 }]);
    showDialogue(NPC_ID, 'storage', game);
  });

  afterEach(() => {
    ALL_DIALOGUE_TREES[NPC_ID] = originalTree;
    vi.restoreAllMocks();
  });

  it('passes picker through showDialogue', () => {
    const display = showDialogue(NPC_ID, 'storage', game);
    expect(display.choices[STORE].picker).toBe('store');
    expect(display.choices[RETRIEVE].picker).toBe('retrieve');
  });

  it('leaves picker off non-picker choices', () => {
    const display = showDialogue(NPC_ID, 'greeting', game);
    expect(display.choices[0]).not.toHaveProperty('picker');
  });

  it('without selections: fails, grants no rep, does not advance', () => {
    const repBefore = npcState.rep;
    const result = selectChoice(NPC_ID, STORE, game);
    expect(result).toEqual({
      success: false,
      message: 'Nothing selected',
      display: null,
    });
    expect(npcState.rep).toBe(repBefore);
    expect(game.getDialogueState().currentNodeId).toBe('storage');
  });

  it('when the manager call fails: grants no rep, does not advance', () => {
    const repBefore = npcState.rep;
    const result = selectChoice(NPC_ID, STORE, game, {
      selections: [{ stackIndex: 0, qty: 99 }],
    });
    expect(result.success).toBe(false);
    expect(npcState.rep).toBe(repBefore);
    expect(game.getDialogueState().currentNodeId).toBe('storage');
    expect(game.getState().ship.cargo[0].qty).toBe(5);
  });

  it('with valid selections: stores, applies repGain, advances', () => {
    const repBefore = npcState.rep;
    const result = selectChoice(NPC_ID, STORE, game, {
      selections: [{ stackIndex: 0, qty: 2 }],
    });
    expect(result.success).toBe(true);
    expect(result.message).toBe(`Stored 2 units with ${NPC_NAME}`);
    expect(result.display.text).toBe('Hello.');
    expect(npcState.rep).toBe(repBefore + 2);
    expect(npcState.storedCargo).toEqual([
      { good: 'grain', qty: 2, buyPrice: 10 },
    ]);
  });

  it('retrieve picker retrieves and grants no rep', () => {
    npcState.storedCargo = [{ good: 'ore', qty: 3, buyPrice: 20 }];
    const repBefore = npcState.rep;
    const result = selectChoice(NPC_ID, RETRIEVE, game, {
      selections: [{ stackIndex: 0, qty: 3 }],
    });
    expect(result.success).toBe(true);
    expect(result.message).toBe(`Retrieved 3 units from ${NPC_NAME}`);
    expect(npcState.rep).toBe(repBefore);
  });

  it('DialogueManager: a failed picker choice changes nothing and emits nothing', async () => {
    await game.startDialogue(NPC_ID, 'storage');
    const before = structuredClone(game.getDialogueState());
    const emitted = vi.fn();
    game.subscribe(EVENT_NAMES.DIALOGUE_CHANGED, emitted);

    const result = await game.selectDialogueChoice(NPC_ID, STORE, {
      selections: [],
    });

    expect(result).toEqual({ success: false, message: 'Nothing selected' });
    expect(game.getDialogueState()).toEqual(before);
    expect(emitted).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run each, expect FAIL.**

**Step 3: Implementation** in `src/game/game-dialogue.js`.

Near `TIP_NODE_ID`:

```js
// Picker choices take player input (selections) before they take effect
const PICKER_OPERATIONS = {
  store: 'storeCargo',
  retrieve: 'retrieveCargo',
};
```

In `showDialogue`, the `availableChoices.push`:

```js
      availableChoices.push({
        index: i,
        text: choice.text,
        next: choice.next,
        repGain: choice.repGain || 0,
        ...(choice.picker && { picker: choice.picker }),
      });
```

In `selectChoice` (rename `_options` to `options` if you used the prefix), right after `const selectedChoice = currentNode.choices[choiceIndex];`:

```js
  // The engine, not the UI, runs picker operations, so no caller can collect
  // the repGain without the cargo actually moving (ADR 0001)
  let message;
  if (selectedChoice.picker) {
    const operation = PICKER_OPERATIONS[selectedChoice.picker];
    if (!operation) {
      throw new Error(
        `Unknown picker '${selectedChoice.picker}' in node ${currentNodeId} for NPC ${npcId}`
      );
    }
    const outcome = gameStateManager[operation](npcId, options.selections);
    if (!outcome.success) {
      return { success: false, message: outcome.message, display: null };
    }
    message = outcome.message;
  }
```

At the end, add `message` only when it's set:

```js
  const withMessage = (display) =>
    message === undefined
      ? { success: true, display }
      : { success: true, message, display };

  if (!selectedChoice.next) {
    gameStateManager.clearDialogueState();
    return withMessage(null);
  }

  return withMessage(
    showDialogue(npcId, selectedChoice.next, gameStateManager)
  );
```

Update the `selectChoice` JSDoc: add `@param {Object} [options]`, `@param {Array} [options.selections]`, and a sentence on picker behaviour.

**Step 4: Verify and commit**

```bash
git add src/game/game-dialogue.js tests/unit/dialogue-picker-choices.test.js
git commit -m "feat(dialogue): engine runs picker choices and gates repGain on success" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Shared storage dialogue helper and the 7 NPC files

**Files:**
- Create: `src/game/data/dialogue/storage-dialogue.js`
- Modify: `src/game/data/dialogue/{whisper,captain-vasquez,dr-sarah-kim,rusty-rodriguez,zara-osman,station-master-kowalski,lucky-liu}.js`
- Modify: `src/game/game-dialogue.js` (`buildDialogueContext`: remove `storeCargo` and `retrieveCargo`)
- Test (create): `tests/unit/storage-dialogue.test.js`
- Modify (same commit): `tests/unit/npc-dialogue-greetings.test.js` (~95-126), `tests/unit/vasquez-whisper-coverage.test.js` (~103-151 and ~270-317), `tests/unit/dialogue-tree-structure.test.js` (~436-450, ~767-777, ~908-920), `tests/unit/dialogue-context.test.js` (~37, ~65), `tests/unit/game-dialogue-coverage.test.js` (~47, ~49)

**Step 1: Tests, one at a time**

```js
import { describe, it, expect } from 'vitest';
import { buildStorageDialogue } from '../../src/game/data/dialogue/storage-dialogue.js';
import { ALL_DIALOGUE_TREES } from '../../src/game/data/dialogue-trees.js';
import { NPC_BENEFITS_CONFIG } from '../../src/game/constants.js';

const LIMIT = NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT;
const STORAGE_NPCS = [
  'whisper_sirius',
  'vasquez_epsilon',
  'kim_tau_ceti',
  'rodriguez_procyon',
  'osman_luyten',
  'kowalski_alpha_centauri',
  'liu_wolf359',
];

const lines = {
  requestText: `Up to ${LIMIT} units.`,
  requestFlag: 'test_storage_discussed',
  storeConfirmText: 'Yes please.',
  storeDeclineText: 'No thanks.',
  retrieveText: 'Here it is.',
  retrieveFlag: 'test_cargo_retrieved',
  retrieveDeclineText: 'Later.',
};

const ctx = ({ available = true, stored = [] } = {}) => ({
  canRequestStorage: { available },
  npcState: { storedCargo: stored },
});

describe('buildStorageDialogue', () => {
  const storage = buildStorageDialogue(lines);

  it('gates the store greeting choice on canRequestStorage', () => {
    const choice = storage.storeGreetingChoice;
    expect(choice.next).toBe('request_storage');
    expect(choice.condition(0, ctx({ available: true }))).toBe(true);
    expect(choice.condition(0, ctx({ available: false }))).toBe(false);
  });

  it('gates the retrieve greeting choice on stored cargo', () => {
    const choice = storage.retrieveGreetingChoice;
    expect(choice.next).toBe('retrieve_cargo');
    expect(choice.condition(0, ctx())).toBe(false);
    expect(
      choice.condition(0, ctx({ stored: [{ good: 'ore', qty: 1, buyPrice: 1 }] }))
    ).toBe(true);
  });

  it('builds request_storage with a store picker and repGain 2', () => {
    const node = storage.nodes.request_storage;
    expect(node.text).toBe(lines.requestText);
    expect(node.flags).toEqual(['test_storage_discussed']);
    expect(node.choices[0]).toEqual({
      text: 'Yes please.',
      next: 'greeting',
      repGain: 2,
      picker: 'store',
    });
    expect(node.choices[1].next).toBe('greeting');
  });

  it('builds retrieve_cargo with the shared text and no repGain', () => {
    const node = storage.nodes.retrieve_cargo;
    expect(node.flags).toEqual(['test_cargo_retrieved']);
    expect(node.choices[0]).toEqual({
      text: 'Let me choose what to take.',
      next: 'greeting',
      picker: 'retrieve',
    });
    expect(node.choices[1]).toEqual({ text: 'Later.', next: 'greeting' });
  });
});

describe.each(STORAGE_NPCS)('%s storage dialogue', (npcId) => {
  const tree = ALL_DIALOGUE_TREES[npcId];

  it('uses picker choices, never actions', () => {
    const nodes = [tree.request_storage, tree.retrieve_cargo];
    expect(tree.request_storage.choices[0].picker).toBe('store');
    expect(tree.retrieve_cargo.choices[0].picker).toBe('retrieve');
    for (const node of nodes) {
      for (const choice of node.choices) {
        expect(choice.action).toBeUndefined();
      }
    }
  });

  it('states the limit from CARGO_STORAGE_LIMIT', () => {
    expect(tree.request_storage.text).toContain(String(LIMIT));
    expect(tree.request_storage.text).not.toMatch(/\bten\b/i);
  });

  it('has both greeting choices from the helper', () => {
    const store = tree.greeting.choices.find((c) => c.next === 'request_storage');
    const retrieve = tree.greeting.choices.find((c) => c.next === 'retrieve_cargo');
    expect(store.condition(0, ctx({ available: false }))).toBe(false);
    expect(store.condition(0, ctx({ available: true }))).toBe(true);
    expect(retrieve.condition(0, ctx())).toBe(false);
  });
});
```

**Step 2: Run, expect FAIL** (module not found).

**Step 3: Create `src/game/data/dialogue/storage-dialogue.js`**

```js
/**
 * @fileoverview Shared cargo storage dialogue
 *
 * Every NPC that offers storage uses the same mechanics. NPC files supply
 * only their own lines and flag names; the choices, conditions, picker
 * markers and repGain are written once here.
 *
 * The tier check lives in canRequestFavor, not here, so it can't drift.
 *
 * @module dialogue/storage-dialogue
 */

// Retrieval opens a picker with nothing selected, so the line can't promise
// an automatic transfer
const RETRIEVE_CONFIRM_TEXT = 'Let me choose what to take.';

/**
 * @param {Object} lines
 * @param {string} lines.requestText - request_storage node text; states the limit via CARGO_STORAGE_LIMIT
 * @param {string} lines.requestFlag - Flag set when request_storage is shown
 * @param {string} lines.storeConfirmText
 * @param {string} lines.storeDeclineText
 * @param {string} lines.retrieveText - retrieve_cargo node text
 * @param {string} lines.retrieveFlag - Flag set when retrieve_cargo is shown
 * @param {string} lines.retrieveDeclineText
 * @returns {{ storeGreetingChoice: Object, retrieveGreetingChoice: Object, nodes: Object }}
 */
export function buildStorageDialogue({
  requestText,
  requestFlag,
  storeConfirmText,
  storeDeclineText,
  retrieveText,
  retrieveFlag,
  retrieveDeclineText,
}) {
  return {
    storeGreetingChoice: {
      text: 'Can you store some cargo for me?',
      next: 'request_storage',
      condition: (_rep, context) => context.canRequestStorage.available,
    },
    retrieveGreetingChoice: {
      text: 'I want to retrieve my stored cargo.',
      next: 'retrieve_cargo',
      condition: (_rep, context) =>
        (context.npcState.storedCargo?.length ?? 0) > 0,
    },
    nodes: {
      request_storage: {
        text: requestText,
        flags: [requestFlag],
        choices: [
          {
            text: storeConfirmText,
            next: 'greeting',
            repGain: 2,
            picker: 'store',
          },
          { text: storeDeclineText, next: 'greeting', repGain: 1 },
        ],
      },
      retrieve_cargo: {
        text: retrieveText,
        flags: [retrieveFlag],
        choices: [
          { text: RETRIEVE_CONFIRM_TEXT, next: 'greeting', picker: 'retrieve' },
          { text: retrieveDeclineText, next: 'greeting' },
        ],
      },
    },
  };
}
```

The decline `repGain: 1` is kept on purpose. Its farming loop is a separate backlog item ("Free reputation from declining cargo storage" in `docs/backlog.md`). Don't fix it here.

**Step 4: Convert each NPC file.** Rusty first, as the example:

1. Import the helper. If `NPC_BENEFITS_CONFIG` isn't imported yet, import it too:

   ```js
   import { buildStorageDialogue } from './storage-dialogue.js';
   ```

2. Above the exported tree constant:

   ```js
   const STORAGE = buildStorageDialogue({
     requestText: `Cargo storage? Sure, I got secure space in the back of the shop. Up to ${NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT} units, safe from the elements and prying eyes. Consider it a favor between professionals - we mechanics gotta stick together, even if you're on the other side of the wrench.`,
     requestFlag: 'rusty_storage_discussed',
     storeConfirmText: 'That would be a huge help.',
     storeDeclineText: 'I appreciate the offer, Rusty.',
     retrieveText:
       "Retrieve your cargo? Sure thing, captain. *heads to the back* Got your stuff safe and sound. Let me get it loaded back onto your ship. If your hold's getting tight, just say the word - we can work something out.",
     retrieveFlag: 'rusty_cargo_retrieved',
     retrieveDeclineText: 'Let me make some room first.',
   });
   ```

3. In `greeting.choices`, replace the whole `{ text: 'Can you store some cargo for me?', ... }` object with `STORAGE.storeGreetingChoice,`, and the whole `{ text: 'I want to retrieve my stored cargo.', ... }` object with `STORAGE.retrieveGreetingChoice,`. Keep them **in the same positions**, so every other choice keeps its index.

4. Delete the `request_storage:` and `retrieve_cargo:` nodes and add `...STORAGE.nodes,` as the last entry of the tree object.

5. Update the file's header comment line `greeting → request_storage (conditional on Friendly tier) → storage_response → greeting` to `greeting → request_storage → picker → greeting (storage via buildStorageDialogue)`.

Repeat for the other six. Copy each NPC's current `request_storage.text`, `retrieve_cargo.text`, flags and choice texts verbatim. The only change is replacing "ten" or "10" in the request text with `${NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT}`:

| File | requestFlag | retrieveFlag | storeConfirmText | storeDeclineText | retrieveDeclineText |
|---|---|---|---|---|---|
| whisper.js | whisper_storage_discussed | whisper_cargo_retrieved | That would be very helpful. | Good to know that option exists. | Let me make some space first. |
| captain-vasquez.js | vasquez_storage_discussed | vasquez_cargo_retrieved | That would be a huge help. | I appreciate the offer. | Let me make some room first. |
| dr-sarah-kim.js | kim_storage_discussed | kim_cargo_retrieved | That would be very helpful. | Good to know that service exists. | Let me make some space first. |
| zara-osman.js | osman_storage_discussed | osman_cargo_retrieved | That would really help me out. | Professional courtesy appreciated. | Let me clear some space first. |
| station-master-kowalski.js | kowalski_storage_discussed | kowalski_cargo_retrieved | That would be very helpful. | I appreciate the professional service. | Let me make room in my hold first. |
| lucky-liu.js | liu_storage_discussed | liu_cargo_retrieved | That would really help my game. | Thanks for looking out for a fellow player. | Let me make some room first. |

Vasquez and Kim have a `if (!context || !context.canRequestStorage) return true;` fallback in their greeting condition. It goes away with the object you replace. After the edit, check for imports that are now unused (for example `REPUTATION_BOUNDS`); `npm run lint` will flag them.

**Step 5: Remove the context callbacks.** In `buildDialogueContext` (`src/game/game-dialogue.js`), delete the `storeCargo:` and `retrieveCargo:` lines. The engine calls the manager directly.

**Step 6: Update the tests this breaks**

- `tests/unit/npc-dialogue-greetings.test.js`: replace the two tests `request_storage action calls context.storeCargo` and `retrieve_cargo action calls context.retrieveCargo` with:

  ```js
    it('request_storage confirm is a store picker', () => {
      const confirm = DR_SARAH_KIM_DIALOGUE.request_storage.choices[0];
      expect(confirm.picker).toBe('store');
      expect(confirm.action).toBeUndefined();
    });

    it('retrieve_cargo confirm is a retrieve picker', () => {
      const confirm = DR_SARAH_KIM_DIALOGUE.retrieve_cargo.choices[0];
      expect(confirm.picker).toBe('retrieve');
      expect(confirm.action).toBeUndefined();
    });
  ```

- `tests/unit/vasquez-whisper-coverage.test.js`: delete the four `describe` blocks `request_storage action callback (...)` and `retrieve_cargo action callback (...)`, two each for Vasquez and Whisper. `storage-dialogue.test.js` covers them. If `mockContext` objects elsewhere still define `storeCargo` or `retrieveCargo`, those keys are harmless. Leave them.
- `tests/unit/dialogue-tree-structure.test.js`:
  - Whisper, `should have storage choice with reputation condition` (~436): change the `find` to match `next === 'request_storage'` and delete the `condition(29, ctx)` line. Rename the test to `should have storage choice gated on canRequestStorage`. The tier assertion now lives in `npc-cargo-storage-selections.test.js` ("is unavailable below the Friendly tier"). **Don't** put a tier check back in the helper to keep the old line.
  - Kim (~767-777): replace the two `storageChoice.condition(...)` expectations with
    `expect(storageChoice.condition(0, { canRequestStorage: { available: true } })).toBe(true);`
  - Zara (~915-920): delete the `WARM_MIN` expectation. The `FRIENDLY_MIN` one stays, because `mockContext` has `canRequestStorage.available: true`.
- `tests/unit/dialogue-context.test.js`: delete `retrieveCargo: () => ...` from the mock (~37). At ~65, replace `expect(typeof ctx.retrieveCargo).toBe('function')` with `expect(ctx.retrieveCargo).toBeUndefined()` and `expect(ctx.storeCargo).toBeUndefined()`.
- `tests/unit/game-dialogue-coverage.test.js` (~47, ~49): change both `toBe('function')` checks for `storeCargo`/`retrieveCargo` to `expect(ctx.storeCargo).toBeUndefined()` / `expect(ctx.retrieveCargo).toBeUndefined()`.

**Step 7: Verify and commit**

Run: `npm test` and `npm run lint`. Also run `grep -rn "storeCargo()\|retrieveCargo()" src tests` and expect no hits.

```bash
git add -A src/game/data/dialogue src/game/game-dialogue.js tests
git commit -m "feat(dialogue): shared storage dialogue with picker choices for 7 NPCs" -m "Storage choices and nodes now come from buildStorageDialogue. Confirms are declarative picker choices; retrieval grants no reputation. The node text takes the limit from CARGO_STORAGE_LIMIT." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: `cargoStorageUtils` pure functions

**Files:**
- Create: `src/features/cargo-storage/cargoStorageUtils.js`
- Test (create): `tests/unit/cargo-storage-utils.test.js`

**Step 1: Tests, one at a time**

```js
import { describe, it, expect } from 'vitest';
import {
  totalUnits,
  remainingLimit,
  selectedTotal,
  rowMax,
  setRowQty,
  buildSelections,
} from '../../src/features/cargo-storage/cargoStorageUtils.js';

describe('cargoStorageUtils', () => {
  it('totalUnits sums qty', () => {
    expect(totalUnits([{ qty: 2 }, { qty: 3 }])).toBe(5);
    expect(totalUnits([])).toBe(0);
  });

  it('remainingLimit clamps to 0 when over the cap or hold space is negative', () => {
    expect(remainingLimit(10, 3)).toBe(7);
    expect(remainingLimit(10, 15)).toBe(0);
    expect(remainingLimit(-2, 0)).toBe(0);
  });

  it('selectedTotal sums the chosen quantities', () => {
    expect(selectedTotal({ 0: 2, 3: 1 })).toBe(3);
    expect(selectedTotal({})).toBe(0);
  });

  it('rowMax is min(stack qty, limit minus other rows), never negative', () => {
    expect(rowMax({ qty: 5 }, 0, {}, 7)).toBe(5);
    expect(rowMax({ qty: 5 }, 0, { 1: 4 }, 7)).toBe(3);
    expect(rowMax({ qty: 5 }, 0, { 0: 2, 1: 4 }, 7)).toBe(3);
    expect(rowMax({ qty: 5 }, 0, { 1: 9 }, 7)).toBe(0);
  });

  it('setRowQty clamps between 0 and max and returns a new object', () => {
    const before = { 0: 1 };
    const after = setRowQty(before, 0, 9, 4);
    expect(after).toEqual({ 0: 4 });
    expect(before).toEqual({ 0: 1 });
    expect(setRowQty(before, 0, -1, 4)).toEqual({ 0: 0 });
  });

  it('buildSelections leaves out rows set back to 0', () => {
    expect(buildSelections({ 0: 2, 1: 0, 3: 1 })).toEqual([
      { stackIndex: 0, qty: 2 },
      { stackIndex: 3, qty: 1 },
    ]);
  });
});
```

**Step 2: Run, expect FAIL.**

**Step 3: Implementation**

```js
/**
 * Pure helpers for the cargo storage picker. Quantities are kept as
 * { [stackIndex]: qty }, which is UI selection state, not game state.
 */

export function totalUnits(stacks) {
  return stacks.reduce((total, stack) => total + stack.qty, 0);
}

/** Older saves can hold more than the cap, and passengers can overfill a hold */
export function remainingLimit(cap, used) {
  return Math.max(0, cap - used);
}

export function selectedTotal(quantities) {
  return Object.values(quantities).reduce((total, qty) => total + qty, 0);
}

/** Shared by + and Max, so the total can never pass the limit */
export function rowMax(stack, rowIndex, quantities, limit) {
  const otherRows = selectedTotal(quantities) - (quantities[rowIndex] ?? 0);
  return Math.max(0, Math.min(stack.qty, limit - otherRows));
}

export function setRowQty(quantities, rowIndex, qty, max) {
  return { ...quantities, [rowIndex]: Math.min(Math.max(0, qty), max) };
}

/** The manager rejects any qty that isn't a positive integer */
export function buildSelections(quantities) {
  return Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([stackIndex, qty]) => ({ stackIndex: Number(stackIndex), qty }));
}
```

**Step 4: Verify and commit**

```bash
git add src/features/cargo-storage/cargoStorageUtils.js tests/unit/cargo-storage-utils.test.js
git commit -m "feat(cargo-storage): pure helpers for the storage picker" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: `CargoStoragePicker` component

**Files:**
- Create: `src/features/cargo-storage/CargoStoragePicker.jsx`
- Create: `css/panel/cargo-storage.css`, and import it in `src/main.jsx` alphabetically among the `../css/panel/*.css` imports
- Test (create): `tests/unit/cargo-storage-picker.test.jsx`

The rows reuse `.cargo-stack`, `.stack-info`, `.stack-name` and `.stack-details` from `css/panel/trade.css`, plus `.modal-actions`, `.modal-cancel` and `.modal-confirm` from `css/modals.css`. Both are global.

**Step 1: Tests, one at a time**

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { CargoStoragePicker } from '../../src/features/cargo-storage/CargoStoragePicker.jsx';
import { createTestGame } from '../test-utils.js';
import { NPC_BENEFITS_CONFIG } from '../../src/game/constants.js';

const NPC_ID = 'rodriguez_procyon';
const NPC_NAME = '"Rusty" Rodriguez';

describe('CargoStoragePicker', () => {
  let game;
  let onConfirm;
  let onCancel;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    game = createTestGame();
    game.getNPCState(NPC_ID).storedCargo = [];
    onConfirm = vi.fn();
    onCancel = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderPicker = (mode) =>
    render(
      <GameProvider game={game}>
        <CargoStoragePicker
          mode={mode}
          npcId={NPC_ID}
          npcName={NPC_NAME}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </GameProvider>
    );

  const more = (good, price) =>
    screen.getByRole('button', {
      name: `Store one more ${good} bought at ${price} credits`,
    });
  const less = (good, price) =>
    screen.getByRole('button', {
      name: `Store one less ${good} bought at ${price} credits`,
    });
  const max = (good, price) =>
    screen.getByRole('button', {
      name: `Store as many ${good} bought at ${price} credits as fit`,
    });

  it('shows mission cargo as not storable, without controls', () => {
    game.updateCargo([
      { good: 'sealed_containers', qty: 2, buyPrice: 0, missionId: 'm1' },
      { good: 'grain', qty: 2, buyPrice: 10 },
    ]);
    renderPicker('store');
    expect(screen.getByText('Mission Cargo (cannot be stored)')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Sealed Containers/ })
    ).not.toBeInTheDocument();
  });

  it('tells apart two stacks of the same good by buy price', () => {
    game.updateCargo([
      { good: 'grain', qty: 2, buyPrice: 10 },
      { good: 'grain', qty: 2, buyPrice: 12 },
    ]);
    renderPicker('store');
    expect(screen.getByText('Qty: 2 | Bought at: 10 ₡/unit')).toBeInTheDocument();
    expect(screen.getByText('Qty: 2 | Bought at: 12 ₡/unit')).toBeInTheDocument();
    expect(more('Grain', 10)).not.toBe(more('Grain', 12));
  });

  it('+ and − change the quantity and + stops at the limit', () => {
    game.getNPCState(NPC_ID).storedCargo = [
      { good: 'ore', qty: NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT - 2, buyPrice: 1 },
    ];
    game.updateCargo([{ good: 'grain', qty: 5, buyPrice: 10 }]);
    renderPicker('store');
    fireEvent.click(more('Grain', 10));
    fireEvent.click(more('Grain', 10));
    expect(more('Grain', 10)).toBeDisabled();
    fireEvent.click(less('Grain', 10));
    expect(screen.getByRole('button', { name: 'Store 1 unit' })).toBeEnabled();
  });

  it('Max on a second row fills only what is left', () => {
    game.updateCargo([
      { good: 'grain', qty: 8, buyPrice: 10 },
      { good: 'ore', qty: 8, buyPrice: 20 },
    ]);
    renderPicker('store');
    fireEvent.click(max('Grain', 10));
    fireEvent.click(max('Ore', 20));
    fireEvent.click(screen.getByRole('button', { name: /^Store \d+ units?$/ }));
    expect(onConfirm).toHaveBeenCalledWith([
      { stackIndex: 0, qty: 8 },
      { stackIndex: 1, qty: NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT - 8 },
    ]);
  });

  it('shows the selected total, already stored and the favor warning', () => {
    game.getNPCState(NPC_ID).storedCargo = [{ good: 'ore', qty: 3, buyPrice: 1 }];
    game.updateCargo([{ good: 'grain', qty: 5, buyPrice: 10 }]);
    renderPicker('store');
    expect(screen.getByText('Selected: 0 / 7 (3 already stored)')).toBeInTheDocument();
    expect(
      screen.getByText(
        `Storing uses ${NPC_NAME}'s favor: no more storage or loans from them for ${NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS} days.`
      )
    ).toBeInTheDocument();
  });

  it('disables confirm at 0 and pluralizes its label', () => {
    game.updateCargo([{ good: 'grain', qty: 5, buyPrice: 10 }]);
    renderPicker('store');
    expect(screen.getByRole('button', { name: 'Store 0 units' })).toBeDisabled();
    fireEvent.click(more('Grain', 10));
    expect(screen.getByRole('button', { name: 'Store 1 unit' })).toBeEnabled();
    fireEvent.click(more('Grain', 10));
    fireEvent.click(more('Grain', 10));
    expect(screen.getByRole('button', { name: 'Store 3 units' })).toBeEnabled();
  });

  it('leaves a row set back to 0 out of the selections', () => {
    game.updateCargo([
      { good: 'grain', qty: 5, buyPrice: 10 },
      { good: 'ore', qty: 5, buyPrice: 20 },
    ]);
    renderPicker('store');
    fireEvent.click(more('Grain', 10));
    fireEvent.click(less('Grain', 10));
    fireEvent.click(more('Ore', 20));
    fireEvent.click(screen.getByRole('button', { name: 'Store 1 unit' }));
    expect(onConfirm).toHaveBeenCalledWith([{ stackIndex: 1, qty: 1 }]);
  });

  it('shows "No cargo you can store" when nothing is storable', () => {
    game.updateCargo([
      { good: 'sealed_containers', qty: 2, buyPrice: 0, missionId: 'm1' },
    ]);
    renderPicker('store');
    expect(screen.getByText('No cargo you can store')).toBeInTheDocument();
  });

  it('shows "No room in your hold" when retrieving into a full hold', () => {
    game.getNPCState(NPC_ID).storedCargo = [{ good: 'ore', qty: 3, buyPrice: 1 }];
    game.updateCargo([
      { good: 'grain', qty: game.getState().ship.cargoCapacity, buyPrice: 10 },
    ]);
    renderPicker('retrieve');
    expect(screen.getByText('No room in your hold')).toBeInTheDocument();
  });

  it('retrieve mode lists stored cargo and reads "(hold space)"', () => {
    game.getNPCState(NPC_ID).storedCargo = [{ good: 'ore', qty: 3, buyPrice: 1 }];
    game.updateCargo([]);
    renderPicker('retrieve');
    const space = game.getCargoRemaining();
    expect(screen.getByText(`Selected: 0 / ${space} (hold space)`)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Retrieve as many Ore bought at 1 credits as fit',
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retrieve 3 units' }));
    expect(onConfirm).toHaveBeenCalledWith([{ stackIndex: 0, qty: 3 }]);
  });

  it('Cancel calls onCancel', () => {
    game.updateCargo([{ good: 'grain', qty: 5, buyPrice: 10 }]);
    renderPicker('store');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
```

The accessible-name test for the dialog title is in Task 11, because `DialoguePanel` owns the `Modal`.

**Step 2: Run, expect FAIL.**

**Step 3: Implementation** (`src/features/cargo-storage/CargoStoragePicker.jsx`)

```jsx
import { useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { useGameEvent } from '../../hooks/useGameEvent.js';
import {
  formatCargoDisplayName,
  pluralizeUnit,
} from '../../game/utils/string-utils.js';
import {
  totalUnits,
  remainingLimit,
  selectedTotal,
  rowMax,
  setRowQty,
  buildSelections,
} from './cargoStorageUtils.js';
import { EVENT_NAMES, NPC_BENEFITS_CONFIG } from '../../game/constants.js';

/**
 * Lets the player choose which cargo to store with, or retrieve from, an NPC.
 * Only collects selections: DialoguePanel passes them to the dialogue engine,
 * which runs the store or retrieve.
 *
 * @param {Object} props
 * @param {'store'|'retrieve'} props.mode
 * @param {string} props.npcId
 * @param {string} props.npcName - Display name from npc-data
 * @param {Function} props.onConfirm - Called with [{ stackIndex, qty }]
 * @param {Function} props.onCancel
 */
export function CargoStoragePicker({ mode, npcId, npcName, onConfirm, onCancel }) {
  const game = useGame();
  const cargo = useGameEvent(EVENT_NAMES.CARGO_CHANGED) ?? [];
  const npcs = useGameEvent(EVENT_NAMES.NPCS_CHANGED) ?? {};
  const [quantities, setQuantities] = useState({});

  const isStore = mode === 'store';
  const verb = isStore ? 'Store' : 'Retrieve';
  const storedCargo = npcs[npcId]?.storedCargo ?? [];
  const storedUnits = totalUnits(storedCargo);
  const stacks = isStore ? cargo : storedCargo;
  const limit = isStore
    ? remainingLimit(NPC_BENEFITS_CONFIG.CARGO_STORAGE_LIMIT, storedUnits)
    : remainingLimit(game.getCargoRemaining(), 0);
  const selected = selectedTotal(quantities);
  const canMove = (stack) => !(isStore && stack.missionId);

  let emptyMessage = null;
  if (isStore && (limit === 0 || !stacks.some(canMove))) {
    emptyMessage = 'No cargo you can store';
  } else if (!isStore && limit === 0) {
    emptyMessage = 'No room in your hold';
  }

  const change = (index, stack, qty) =>
    setQuantities((current) =>
      setRowQty(current, index, qty, rowMax(stack, index, current, limit))
    );

  return (
    <div className="cargo-storage-picker">
      {emptyMessage ? (
        <p className="cargo-empty">{emptyMessage}</p>
      ) : (
        <div className="cargo-list">
          {stacks.map((stack, index) => {
            const name = formatCargoDisplayName(stack.good);
            const label = `${name} bought at ${stack.buyPrice} credits`;
            const qty = quantities[index] ?? 0;
            const max = rowMax(stack, index, quantities, limit);
            return (
              <div key={index} className="cargo-stack">
                <div className="stack-info">
                  <div className="stack-name">{name}</div>
                  <div className="stack-details">
                    {`Qty: ${stack.qty} | Bought at: ${stack.buyPrice} ₡/unit`}
                  </div>
                </div>
                {canMove(stack) ? (
                  <div className="stack-actions picker-controls">
                    <button
                      type="button"
                      aria-label={`${verb} one less ${label}`}
                      disabled={qty === 0}
                      onClick={() => change(index, stack, qty - 1)}
                    >
                      −
                    </button>
                    <span className="picker-qty">{qty}</span>
                    <button
                      type="button"
                      aria-label={`${verb} one more ${label}`}
                      disabled={qty >= max}
                      onClick={() => change(index, stack, qty + 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      aria-label={`${verb} as many ${label} as fit`}
                      disabled={qty >= max}
                      onClick={() => change(index, stack, max)}
                    >
                      Max
                    </button>
                  </div>
                ) : (
                  <span className="mission-cargo-label">
                    Mission Cargo (cannot be stored)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="cargo-storage-footer">
        <p>
          {isStore
            ? `Selected: ${selected} / ${limit} (${storedUnits} already stored)`
            : `Selected: ${selected} / ${limit} (hold space)`}
        </p>
        {isStore && (
          <p className="cargo-storage-warning">
            {`Storing uses ${npcName}'s favor: no more storage or loans from them for ${NPC_BENEFITS_CONFIG.FAVOR_COOLDOWN_DAYS} days.`}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="modal-confirm"
            disabled={selected === 0}
            onClick={() => onConfirm(buildSelections(quantities))}
          >
            {`${verb} ${pluralizeUnit(selected)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
```

`css/panel/cargo-storage.css`. Keep it small:

```css
/* Cargo storage picker: rows reuse trade.css stack styles */
.cargo-storage-picker .picker-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cargo-storage-picker .picker-qty {
  min-width: 2ch;
  text-align: center;
}

.cargo-storage-footer {
  margin-top: 1rem;
}

.cargo-storage-warning {
  font-size: 0.9em;
  opacity: 0.85;
}
```

**Step 4: Verify and commit**

```bash
git add src/features/cargo-storage/CargoStoragePicker.jsx css/panel/cargo-storage.css src/main.jsx tests/unit/cargo-storage-picker.test.jsx
git commit -m "feat(cargo-storage): CargoStoragePicker component" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: `DialoguePanel` opens the picker

**Files:**
- Modify: `src/features/dialogue/DialoguePanel.jsx`
- Test (create): `tests/integration/dialogue-storage-picker.integration.test.jsx`

**Step 1: Tests, one at a time**

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext.jsx';
import { NotificationProvider } from '../../src/context/NotificationContext.jsx';
import { NotificationContainer } from '../../src/components/NotificationContainer.jsx';
import { DialoguePanel } from '../../src/features/dialogue/DialoguePanel.jsx';
import { createTestGame } from '../test-utils.js';
import { REPUTATION_BOUNDS } from '../../src/game/constants.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

const NPC_ID = 'rodriguez_procyon';
const NPC_NAME = ALL_NPCS.find((npc) => npc.id === NPC_ID).name;

describe('DialoguePanel cargo storage picker', () => {
  let game;
  let npcState;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    game = createTestGame();
    npcState = game.getNPCState(NPC_ID);
    npcState.rep = REPUTATION_BOUNDS.FRIENDLY_MIN;
    npcState.lastFavorDay = null;
    npcState.storedCargo = [];
    game.updateCargo([{ good: 'grain', qty: 5, buyPrice: 10 }]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderPanel = () =>
    render(
      <GameProvider game={game}>
        <NotificationProvider>
          <NotificationContainer />
          <DialoguePanel npcId={NPC_ID} onClose={vi.fn()} />
        </NotificationProvider>
      </GameProvider>
    );

  const openStorePicker = async () => {
    renderPanel();
    fireEvent.click(await screen.findByText('Can you store some cargo for me?'));
    fireEvent.click(await screen.findByText('That would be a huge help.'));
    return screen.findByRole('dialog', { name: `Store cargo with ${NPC_NAME}` });
  };

  it('opens the picker in a named dialog without advancing', async () => {
    const repBefore = npcState.rep;
    expect(await openStorePicker()).toBeInTheDocument();
    expect(game.getDialogueState().currentNodeId).toBe('request_storage');
    expect(npcState.rep).toBe(repBefore);
  });

  it('Cancel stays on the same node and grants nothing', async () => {
    await openStorePicker();
    const repBefore = npcState.rep;
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(game.getDialogueState().currentNodeId).toBe('request_storage');
    expect(npcState.rep).toBe(repBefore);
    expect(npcState.lastFavorDay).toBeNull();
  });

  it('Confirm stores, shows the message, then advances with repGain', async () => {
    await openStorePicker();
    const repBefore = npcState.rep;
    fireEvent.click(
      screen.getByRole('button', { name: 'Store one more Grain bought at 10 credits' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Store 1 unit' }));

    expect(await screen.findByText(`Stored 1 unit with ${NPC_NAME}`, { exact: false })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(game.getDialogueState().currentNodeId).toBe('greeting');
    expect(npcState.rep).toBe(repBefore + 2);
    expect(npcState.storedCargo).toEqual([{ good: 'grain', qty: 1, buyPrice: 10 }]);
  });

  it('a failure keeps the modal open and shows the message', async () => {
    await openStorePicker();
    fireEvent.click(
      screen.getByRole('button', { name: 'Store one more Grain bought at 10 credits' })
    );
    // The favor gets used up while the picker is open
    npcState.lastFavorDay = game.getState().player.daysElapsed;
    fireEvent.click(screen.getByRole('button', { name: 'Store 1 unit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Favor used recently/);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(game.getDialogueState().currentNodeId).toBe('request_storage');
  });

  it('retrieving shows the retrieve message', async () => {
    npcState.storedCargo = [{ good: 'ore', qty: 3, buyPrice: 20 }];
    renderPanel();
    fireEvent.click(await screen.findByText('I want to retrieve my stored cargo.'));
    fireEvent.click(await screen.findByText('Let me choose what to take.'));
    await screen.findByRole('dialog', { name: `Retrieve cargo from ${NPC_NAME}` });
    fireEvent.click(
      screen.getByRole('button', { name: 'Retrieve as many Ore bought at 20 credits as fit' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retrieve 3 units' }));

    expect(
      await screen.findByText(`Retrieved 3 units from ${NPC_NAME}`, { exact: false })
    ).toBeInTheDocument();
    expect(npcState.storedCargo).toEqual([]);
  });
});
```

`NotificationContainer` puts a `✓ ` prefix in the same span as the message, which is why the finds use `{ exact: false }`.

**Step 2: Run, expect FAIL.**

**Step 3: Implementation** (`src/features/dialogue/DialoguePanel.jsx`)

Imports, in the project's order:

```jsx
import { useEffect, useRef, useState } from 'react';
import { useDialogue } from '../../hooks/useDialogue';
import { useNotificationContext } from '../../context/NotificationContext.jsx';
import { Modal } from '../../components/Modal.jsx';
import { CargoStoragePicker } from '../cargo-storage/CargoStoragePicker.jsx';
```

At the top of the component, after `useDialogue()`, before any early return:

```jsx
  // Null-safe: tests and some trees render without NotificationProvider
  const notificationCtx = useNotificationContext();
  // { mode, choiceIndex } while the storage picker is open
  const [picker, setPicker] = useState(null);
  const [pickerError, setPickerError] = useState(null);
```

Change `handleChoiceSelection` to take the choice. Picker choices open the modal instead of advancing:

```jsx
  const handleChoiceSelection = async (choice) => {
    if (!dialogueState.display || !npcId) return;

    if (choice.picker) {
      setPickerError(null);
      setPicker({ mode: choice.picker, choiceIndex: choice.index });
      return;
    }

    try {
      const result = await selectChoice(npcId, choice.index);
      if (!result.success) {
        clearDialogue();
        onClose();
      }
    } catch (err) {
      console.error('Failed to process dialogue choice:', err);
      clearDialogue();
      onClose();
    }
  };

  // The node can't change while the modal is open, so choiceIndex stays valid
  const handlePickerConfirm = async (selections) => {
    const result = await selectChoice(npcId, picker.choiceIndex, {
      selections,
    });
    if (!result.success) {
      setPickerError(result.message);
      return;
    }
    notificationCtx?.showSuccess(result.message);
    setPicker(null);
  };

  const handlePickerCancel = () => {
    setPicker(null);
    setPickerError(null);
  };
```

Update the button: `onClick={() => handleChoiceSelection(choice)}`.

Just before the closing `</div>` of the main (non-loading) return:

```jsx
      <Modal
        isOpen={picker !== null}
        onClose={handlePickerCancel}
        title={
          picker?.mode === 'store'
            ? `Store cargo with ${dialogueDisplay.npcName}`
            : `Retrieve cargo from ${dialogueDisplay.npcName}`
        }
      >
        {pickerError && (
          <div className="validation-message error" role="alert">
            {pickerError}
          </div>
        )}
        {picker && (
          <CargoStoragePicker
            mode={picker.mode}
            npcId={npcId}
            npcName={dialogueDisplay.npcName}
            onConfirm={handlePickerConfirm}
            onCancel={handlePickerCancel}
          />
        )}
      </Modal>
```

**Step 4: Verify.** Run `npm test`. The existing DialoguePanel tests render without `NotificationProvider` and must still pass. Then `npm run lint`.

**Step 5: Commit**

```bash
git add src/features/dialogue/DialoguePanel.jsx tests/integration/dialogue-storage-picker.integration.test.jsx
git commit -m "feat(dialogue): open the cargo storage picker from NPC dialogue" -m "Picker choices open a modal instead of advancing. Confirm runs through selectChoice; success shows a notification and advances, failure keeps the modal open with the message, and Cancel changes nothing." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Final check

1. `npm run all` (lint, format, full test suite). Fix anything it reports. If Prettier rewrites files, commit them as `style: format`.
2. Manual UAT with `npm run dev`. Use the dev admin panel to raise Rusty (Procyon) to Friendly and give yourself mixed cargo, including a mission stack. Then check:
   - Store: the mission row is disabled, `+`/`Max` stop at the limit, the warning is shown, a 1-unit store shows "Stored 1 unit with "Rusty" Rodriguez", and the store option disappears (cooldown).
   - Retrieve: "Let me choose what to take." opens the picker, "(hold space)" matches the free space in `ShipStatus`, and retrieval adds no reputation.
   - Escape and the overlay both cancel without closing the dialogue panel.
3. Grep for anything left behind: `grep -rn "Transfer what you can\|context.storeCargo\|context.retrieveCargo" src tests` should return nothing.
