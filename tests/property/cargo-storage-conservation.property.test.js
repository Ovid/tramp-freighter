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

          expect(
            units(game.getState().ship.cargo) + units(npcState.storedCargo)
          ).toBe(total);
          expect(npcState.storedCargo.some((s) => s.missionId)).toBe(false);
          expect(units(npcState.storedCargo)).toBeLessThanOrEqual(LIMIT);
        }
      }),
      { numRuns: 100 }
    );
  });
});
