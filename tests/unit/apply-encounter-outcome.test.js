import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameStateManager } from '../../src/game/state/game-state-manager';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { applyEncounterOutcome } from '../../src/features/danger/applyEncounterOutcome';

vi.mock('../../src/game/utils/dev-logger.js', () => ({
  devLog: (...args) => console.log(...args),
  devWarn: (...args) => console.warn(...args),
}));

describe('applyEncounterOutcome', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('cargo percent loss', () => {
    it('reduces each stack by floor of percentage', () => {
      gsm.updateCargo([
        { good: 'food', qty: 10, buyPrice: 50 },
        { good: 'fuel_cells', qty: 7, buyPrice: 100 },
      ]);

      applyEncounterOutcome(gsm, {
        costs: { cargoPercent: 50 },
      });

      const cargo = gsm.getState().ship.cargo;
      // 10 - floor(10 * 0.5) = 5
      expect(cargo.find((c) => c.good === 'food').qty).toBe(5);
      // 7 - floor(7 * 0.5) = 4
      expect(cargo.find((c) => c.good === 'fuel_cells').qty).toBe(4);
    });

    it('preserves canonical cargo schema fields', () => {
      gsm.updateCargo([{ good: 'food', qty: 10, buyPrice: 50 }]);

      applyEncounterOutcome(gsm, {
        costs: { cargoPercent: 30 },
      });

      const stack = gsm.getState().ship.cargo[0];
      expect(stack).toHaveProperty('good');
      expect(stack).toHaveProperty('qty');
      expect(stack).toHaveProperty('buyPrice');
      expect(stack.good).toBe('food');
      expect(stack.buyPrice).toBe(50);
    });

    it('removes stacks reduced to zero', () => {
      gsm.updateCargo([
        { good: 'food', qty: 1, buyPrice: 50 },
        { good: 'fuel_cells', qty: 10, buyPrice: 100 },
      ]);

      applyEncounterOutcome(gsm, {
        costs: { cargoPercent: 100 },
      });

      const cargo = gsm.getState().ship.cargo;
      expect(cargo).toHaveLength(0);
    });
  });

  describe('full cargo loss', () => {
    it('clears all cargo when cargoLoss is true', () => {
      gsm.updateCargo([
        { good: 'food', qty: 10, buyPrice: 50 },
        { good: 'fuel_cells', qty: 5, buyPrice: 100 },
      ]);

      applyEncounterOutcome(gsm, {
        costs: { cargoLoss: true },
      });

      expect(gsm.getState().ship.cargo).toEqual([]);
    });
  });

  describe('cargo rewards', () => {
    it('stacks reward with existing cargo of same good and buyPrice', () => {
      gsm.updateCargo([{ good: 'food', qty: 5, buyPrice: 50 }]);

      applyEncounterOutcome(gsm, {
        rewards: {
          cargo: [{ good: 'food', qty: 3, buyPrice: 50 }],
        },
      });

      const cargo = gsm.getState().ship.cargo;
      expect(cargo).toHaveLength(1);
      expect(cargo[0].qty).toBe(8);
    });

    it('creates new stack when good or buyPrice differs', () => {
      gsm.updateCargo([{ good: 'food', qty: 5, buyPrice: 50 }]);

      applyEncounterOutcome(gsm, {
        rewards: {
          cargo: [{ good: 'minerals', qty: 2, buyPrice: 80 }],
        },
      });

      const cargo = gsm.getState().ship.cargo;
      expect(cargo).toHaveLength(2);
      expect(cargo[1].good).toBe('minerals');
      expect(cargo[1].qty).toBe(2);
      expect(cargo[1].buyPrice).toBe(80);
    });

    it('passes through buySystemName for salvaged cargo', () => {
      gsm.updateCargo([]);

      applyEncounterOutcome(gsm, {
        rewards: {
          cargo: [
            { good: 'parts', qty: 2, buyPrice: 0, buySystemName: 'Salvaged' },
          ],
        },
      });

      const cargo = gsm.getState().ship.cargo;
      expect(cargo).toHaveLength(1);
      expect(cargo[0].buySystemName).toBe('Salvaged');
    });
  });

  describe('ship condition costs', () => {
    it('applies hull damage clamped to zero', () => {
      const before = gsm.getState().ship.hull;

      applyEncounterOutcome(gsm, {
        costs: { hull: 15 },
      });

      expect(gsm.getState().ship.hull).toBe(Math.max(0, before - 15));
    });

    it('applies engine damage clamped to zero', () => {
      const before = gsm.getState().ship.engine;

      applyEncounterOutcome(gsm, {
        costs: { engine: 20 },
      });

      expect(gsm.getState().ship.engine).toBe(Math.max(0, before - 20));
    });

    it('applies life support damage clamped to zero', () => {
      const before = gsm.getState().ship.lifeSupport;

      applyEncounterOutcome(gsm, {
        costs: { lifeSupport: 10 },
      });

      expect(gsm.getState().ship.lifeSupport).toBe(Math.max(0, before - 10));
    });
  });

  describe('fuel costs', () => {
    it('reduces fuel clamped to zero', () => {
      const before = gsm.getState().ship.fuel;

      applyEncounterOutcome(gsm, {
        costs: { fuel: 25 },
      });

      expect(gsm.getState().ship.fuel).toBe(Math.max(0, before - 25));
    });
  });

  describe('credit costs and rewards', () => {
    it('subtracts non-fine credit costs clamped to zero without debt', () => {
      const state = gsm.getState();
      state.player.credits = 30;
      state.player.debt = 5000;

      applyEncounterOutcome(gsm, {
        costs: { credits: 200 },
      });

      expect(gsm.getState().player.credits).toBe(0);
      expect(gsm.getState().player.debt).toBe(5000);
    });

    it('rolls unpaid fine remainder into debt when credits insufficient', () => {
      const state = gsm.getState();
      state.player.credits = 10;
      state.player.debt = 5000;

      applyEncounterOutcome(gsm, {
        costs: { credits: 1000, isFine: true },
      });

      expect(gsm.getState().player.credits).toBe(0);
      expect(gsm.getState().player.debt).toBe(5990);
    });

    it('does not increase debt when credits fully cover the fine', () => {
      const state = gsm.getState();
      state.player.credits = 2000;
      state.player.debt = 5000;

      applyEncounterOutcome(gsm, {
        costs: { credits: 500, isFine: true },
      });

      expect(gsm.getState().player.credits).toBe(1500);
      expect(gsm.getState().player.debt).toBe(5000);
    });

    it('adds credit rewards', () => {
      const before = gsm.getState().player.credits;

      applyEncounterOutcome(gsm, {
        rewards: { credits: 150 },
      });

      expect(gsm.getState().player.credits).toBe(before + 150);
    });
  });

  describe('time costs', () => {
    it('advances days elapsed', () => {
      const before = gsm.getState().player.daysElapsed;

      applyEncounterOutcome(gsm, {
        costs: { days: 3 },
      });

      expect(gsm.getState().player.daysElapsed).toBe(before + 3);
    });
  });

  describe('fuelMinimum reward', () => {
    it('sets fuel to minimum when current fuel is below', () => {
      gsm.updateFuel(15);
      applyEncounterOutcome(gsm, {
        rewards: { fuelMinimum: 30 },
      });
      expect(gsm.getState().ship.fuel).toBe(30);
    });

    it('does not reduce fuel when current fuel is above minimum', () => {
      gsm.updateFuel(50);
      applyEncounterOutcome(gsm, {
        rewards: { fuelMinimum: 30 },
      });
      expect(gsm.getState().ship.fuel).toBe(50);
    });

    it('handles fuelMinimum at exactly current fuel', () => {
      gsm.updateFuel(30);
      applyEncounterOutcome(gsm, {
        rewards: { fuelMinimum: 30 },
      });
      expect(gsm.getState().ship.fuel).toBe(30);
    });
  });

  describe('hidden cargo confiscation', () => {
    it('clears hidden cargo when hiddenCargoConfiscated is true', () => {
      const state = gsm.getState();
      state.ship.hiddenCargo = [{ good: 'water', qty: 3, buyPrice: 10 }];

      applyEncounterOutcome(gsm, {
        costs: { hiddenCargoConfiscated: true },
      });

      expect(gsm.getState().ship.hiddenCargo).toEqual([]);
    });

    it('emits hiddenCargoChanged event when hidden cargo is confiscated', () => {
      const state = gsm.getState();
      state.ship.hiddenCargo = [{ good: 'water', qty: 3, buyPrice: 10 }];

      const listener = vi.fn();
      gsm.subscribe('hiddenCargoChanged', listener);

      applyEncounterOutcome(gsm, {
        costs: { hiddenCargoConfiscated: true },
      });

      expect(listener).toHaveBeenCalledWith([]);
    });

    it('does not clear hidden cargo when flag is absent', () => {
      const state = gsm.getState();
      state.ship.hiddenCargo = [{ good: 'water', qty: 3, buyPrice: 10 }];

      applyEncounterOutcome(gsm, {
        costs: { credits: 100 },
      });

      expect(gsm.getState().ship.hiddenCargo).toEqual([
        { good: 'water', qty: 3, buyPrice: 10 },
      ]);
    });
  });

  describe('karma and faction reputation', () => {
    it('modifies karma', () => {
      const before = gsm.getState().player.karma || 0;

      applyEncounterOutcome(gsm, {
        rewards: { karma: -5 },
      });

      expect(gsm.getState().player.karma).toBe(before - 5);
    });

    it('modifies faction reputation', () => {
      applyEncounterOutcome(gsm, {
        rewards: {
          factionRep: { authorities: 10, outlaws: -5 },
        },
      });

      const factions = gsm.getState().player.factions;
      expect(factions.authorities).toBe(10);
      expect(factions.outlaws).toBe(-5);
    });
  });
});

describe('updateCargo validation', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns on cargo items missing required fields', () => {
    gsm.updateCargo([{ type: 'food', quantity: 5, purchasePrice: 50 }]);

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Cargo item 0 missing required fields'),
      expect.stringContaining('good'),
      expect.objectContaining({ type: 'food' })
    );
  });

  it('does not warn on well-formed cargo items', () => {
    gsm.updateCargo([{ good: 'food', qty: 5, buyPrice: 50 }]);

    expect(console.warn).not.toHaveBeenCalledWith(
      expect.stringContaining('Cargo item'),
      expect.any(String),
      expect.any(Object)
    );
  });
});
