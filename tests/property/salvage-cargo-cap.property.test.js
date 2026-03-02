import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { applyEncounterOutcome } from '../../src/features/danger/applyEncounterOutcome.js';

describe('Salvage Cargo Cap Property Tests (#55/56)', () => {
  it('cargo should never exceed capacity after salvage for any qty/fill combo', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }), // existing cargo qty
        fc.integer({ min: 1, max: 20 }), // salvage qty
        (existingQty, salvageQty) => {
          const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
          gsm.initNewGame();
          const state = gsm.getState();

          state.ship.cargo =
            existingQty > 0
              ? [
                  {
                    good: 'grain',
                    qty: existingQty,
                    buyPrice: 10,
                    buySystemName: 'Sol',
                  },
                ]
              : [];

          const outcome = {
            success: true,
            costs: {},
            rewards: {
              cargo: [
                {
                  good: 'parts',
                  qty: salvageQty,
                  buyPrice: 0,
                  buySystemName: 'Salvage',
                },
              ],
            },
            description: 'Salvaged parts.',
          };

          applyEncounterOutcome(gsm, outcome);

          const totalCargo = state.ship.cargo.reduce(
            (sum, item) => sum + item.qty,
            0
          );
          expect(totalCargo).toBeLessThanOrEqual(state.ship.cargoCapacity);
        }
      ),
      { numRuns: 100 }
    );
  });
});
