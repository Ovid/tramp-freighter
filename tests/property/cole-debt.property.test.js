import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { DebtManager } from '../../src/game/state/managers/debt.js';

function buildDebtCapabilities(gsm) {
  return {
    getOwnState: () => ({
      debt: gsm.state.player.debt,
      finance: gsm.state.player.finance,
    }),
    initFinance: (financeObj) => {
      gsm.state.player.finance = financeObj;
    },
    getDaysElapsed: () => gsm.state.player.daysElapsed,
    getCredits: () => gsm.state.player.credits,
    getShipCargo: () => gsm.state.ship.cargo,
    getCurrentSystem: () => gsm.state.player.currentSystem,
    updateDebt: (amount) => {
      gsm.state.player.debt = amount;
    },
    updateCredits: (value) => {
      gsm.state.player.credits = value;
    },
    modifyRepRaw: (npcId, amount, reason) =>
      gsm.modifyRepRaw(npcId, amount, reason),
    markDirty: () => {},
    emit: (...args) => gsm.emit(...args),
    starData: STAR_DATA,
    isTestEnvironment: true,
  };
}

describe('Cole Debt System Properties', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('heat is always clamped to 0-100', () => {
    fc.assert(
      fc.property(fc.integer({ min: -200, max: 200 }), (delta) => {
        const gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        gsm.initNewGame();
        const dm = new DebtManager(buildDebtCapabilities(gsm));

        dm.updateHeat(delta);

        const heat = gsm.state.player.finance.heat;
        return heat >= 0 && heat <= 100;
      }),
      { numRuns: 100 }
    );
  });

  it('withholding equals ceil of revenue times lien rate (pure penalty, not capped at debt)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 0, max: 100 }),
        (revenue, debt, heat) => {
          const gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
          gsm.initNewGame();
          gsm.state.player.debt = debt;
          gsm.state.player.finance.heat = Math.min(heat, 100);
          const dm = new DebtManager(buildDebtCapabilities(gsm));

          const lienRate = dm.getLienRate();
          const { withheld } = dm.calculateWithholding(revenue);

          return withheld === Math.ceil(revenue * lienRate) && withheld >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('payment never makes debt negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50000 }),
        fc.integer({ min: 1, max: 100000 }),
        (payment, initialDebt) => {
          const gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
          gsm.initNewGame();
          gsm.state.player.debt = initialDebt;
          gsm.state.player.credits = payment;
          const dm = new DebtManager(buildDebtCapabilities(gsm));

          dm.makePayment(payment);

          return gsm.state.player.debt >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('borrowing always increases debt', () => {
    fc.assert(
      fc.property(fc.integer({ min: 100, max: 200 }), (amount) => {
        const gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        gsm.initNewGame();
        const initialDebt = gsm.state.player.debt;
        const dm = new DebtManager(buildDebtCapabilities(gsm));

        const result = dm.borrow(amount);

        return !result.success || gsm.state.player.debt > initialDebt;
      }),
      { numRuns: 100 }
    );
  });
});
