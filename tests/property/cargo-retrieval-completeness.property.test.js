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
            const qty = Math.min(
              Math.floor(fractions[stackIndex] * s.qty),
              left
            );
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
      fc.property(
        arbStored,
        fc.integer({ min: 0, max: 60 }),
        (stored, holdUnits) => {
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
        }
      ),
      { numRuns: 100 }
    );
  });
});
