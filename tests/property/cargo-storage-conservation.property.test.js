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

// The generator is biased so that valid stores are common enough to push
// storage past the cap within 100 runs: most stacks are not mission cargo,
// most indexes hit a real stack, stacks hold at least 3 units, and each run
// makes at least 8 moves, two thirds of them stores. Invalid selections
// (index past a short hold, qty above the stack, mission cargo) still occur.
const MAX_HOLD_STACKS = 5;

const arbStack = fc
  .record({
    good: fc.constantFrom(...COMMODITY_TYPES),
    qty: fc.integer({ min: 3, max: 8 }),
    buyPrice: fc.integer({ min: 1, max: 50 }),
    missionId: fc.oneof(
      { arbitrary: fc.constant(undefined), weight: 4 },
      { arbitrary: fc.constantFrom('m1', 'm2'), weight: 1 }
    ),
  })
  .map(({ missionId, ...stack }) =>
    missionId ? { ...stack, missionId } : stack
  );

const arbHold = fc.array(arbStack, {
  minLength: 3,
  maxLength: MAX_HOLD_STACKS,
});

const arbOp = fc.record({
  kind: fc.oneof(
    { arbitrary: fc.constant('store'), weight: 2 },
    { arbitrary: fc.constant('retrieve'), weight: 1 }
  ),
  selections: fc.array(
    fc.record({
      stackIndex: fc.integer({ min: 0, max: MAX_HOLD_STACKS - 1 }),
      qty: fc.integer({ min: 1, max: 8 }),
    }),
    { minLength: 1, maxLength: 2 }
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
    // Guards against a vacuous pass, e.g. every store refused by a rep or
    // cooldown change, which would leave storage empty and the cap untested
    let runsAtCap = 0;
    fc.assert(
      fc.property(
        arbHold,
        fc.array(arbOp, { minLength: 8, maxLength: 16 }),
        (hold, ops) => {
          const game = createTestGame();
          const npcState = game.getNPCState(NPC_ID);
          npcState.rep = REPUTATION_BOUNDS.FRIENDLY_MIN;
          npcState.storedCargo = [];
          game.updateCargo(hold.map((s) => ({ ...s })));
          const total = units(hold);
          let reachedCap = false;

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
            if (units(npcState.storedCargo) === LIMIT) reachedCap = true;
          }
          if (reachedCap) runsAtCap += 1;
        }
      ),
      { numRuns: 100 }
    );
    expect(runsAtCap).toBeGreaterThan(0);
  });
});
