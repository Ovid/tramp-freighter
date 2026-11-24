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
    alreadyStored > 0
      ? [{ good: 'ore', qty: alreadyStored, buyPrice: 999 }]
      : [];
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
          const selections = pickSelections(
            hold,
            fractions,
            LIMIT - alreadyStored
          );
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
