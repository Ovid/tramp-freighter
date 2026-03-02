import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SHIP_CONFIG } from '../../src/game/constants.js';

describe('Fuel Cost Display (#33/61/88)', () => {
  let gsm;
  let navigationSystem;

  beforeEach(() => {
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA, navigationSystem);
    gsm.initNewGame();
  });

  describe('validateJump uses quirk-aware fuel calculation', () => {
    it('should apply fuel_sipper quirk (-15%) to validated fuel cost', () => {
      const state = gsm.getState();
      state.ship.quirks = ['fuel_sipper'];

      const currentSystem = state.player.currentSystem;
      const connected =
        navigationSystem.getConnectedSystems(currentSystem);
      const targetSystem = connected[0];

      const distance = navigationSystem.calculateDistanceBetween(
        STAR_DATA.find((s) => s.id === currentSystem),
        STAR_DATA.find((s) => s.id === targetSystem)
      );
      const baseCost = navigationSystem.calculateFuelCost(distance);

      const validation = navigationSystem.validateJump(
        currentSystem,
        targetSystem,
        100,
        state.ship.engine,
        gsm.applyQuirkModifiers.bind(gsm),
        state.ship.quirks,
        gsm.calculateShipCapabilities().fuelConsumption,
        {
          hull: state.ship.hull,
          engine: state.ship.engine,
          lifeSupport: state.ship.lifeSupport,
        }
      );

      expect(validation.fuelCost).toBeLessThan(baseCost);
      expect(validation.fuelCost).toBeCloseTo(
        baseCost * SHIP_CONFIG.QUIRKS.fuel_sipper.effects.fuelConsumption,
        1
      );
    });

    it('should apply hot_thruster quirk (+5%) to validated fuel cost', () => {
      const state = gsm.getState();
      state.ship.quirks = ['hot_thruster'];

      const currentSystem = state.player.currentSystem;
      const connected =
        navigationSystem.getConnectedSystems(currentSystem);
      const targetSystem = connected[0];

      const distance = navigationSystem.calculateDistanceBetween(
        STAR_DATA.find((s) => s.id === currentSystem),
        STAR_DATA.find((s) => s.id === targetSystem)
      );
      const baseCost = navigationSystem.calculateFuelCost(distance);

      const validation = navigationSystem.validateJump(
        currentSystem,
        targetSystem,
        100,
        state.ship.engine,
        gsm.applyQuirkModifiers.bind(gsm),
        state.ship.quirks,
        gsm.calculateShipCapabilities().fuelConsumption,
        {
          hull: state.ship.hull,
          engine: state.ship.engine,
          lifeSupport: state.ship.lifeSupport,
        }
      );

      expect(validation.fuelCost).toBeGreaterThan(baseCost);
      expect(validation.fuelCost).toBeCloseTo(
        baseCost * SHIP_CONFIG.QUIRKS.hot_thruster.effects.fuelConsumption,
        1
      );
    });
  });
});
