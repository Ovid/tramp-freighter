import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SHIP_CONFIG } from '../../src/game/constants.js';

describe('Fuel Cost Display Property Tests (#33/61/88)', () => {
  const quirkIds = Object.keys(SHIP_CONFIG.QUIRKS);
  const fuelQuirks = quirkIds.filter(
    (id) => SHIP_CONFIG.QUIRKS[id].effects.fuelConsumption !== undefined
  );

  it('validated fuel cost should match calculateFuelCostWithCondition for any quirk/upgrade combo', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...fuelQuirks, null),
        fc.boolean(),
        (quirkId, hasUpgrade) => {
          const navigationSystem = new NavigationSystem(
            STAR_DATA,
            WORMHOLE_DATA
          );
          const gsm = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA,
            navigationSystem
          );
          gsm.initNewGame();
          const state = gsm.getState();

          state.ship.quirks = quirkId ? [quirkId] : [];

          if (hasUpgrade) {
            state.ship.upgrades = ['efficient_drive'];
          }

          const currentSystem = state.player.currentSystem;
          const connected = navigationSystem.getConnectedSystems(currentSystem);
          if (connected.length === 0) return;
          const targetSystem = connected[0];

          const distance = navigationSystem.calculateDistanceBetween(
            STAR_DATA.find((s) => s.id === currentSystem),
            STAR_DATA.find((s) => s.id === targetSystem)
          );

          const capabilities = gsm.calculateShipCapabilities();

          const validation = navigationSystem.validateJump(
            currentSystem,
            targetSystem,
            100,
            state.ship.engine,
            gsm.applyQuirkModifiers.bind(gsm),
            state.ship.quirks,
            capabilities.fuelConsumption,
            {
              hull: state.ship.hull,
              engine: state.ship.engine,
              lifeSupport: state.ship.lifeSupport,
            }
          );

          const actualCost = navigationSystem.calculateFuelCostWithCondition(
            distance,
            state.ship.engine,
            gsm.applyQuirkModifiers.bind(gsm),
            state.ship.quirks,
            capabilities.fuelConsumption
          );

          expect(validation.fuelCost).toBeCloseTo(actualCost, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
