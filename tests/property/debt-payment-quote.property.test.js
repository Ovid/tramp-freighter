import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '@game/data/star-data.js';
import { WORMHOLE_DATA } from '@game/data/wormhole-data.js';
import { COLE_DEBT_CONFIG } from '@game/constants.js';

// Feature: Cole debt payments. Property: the "Pay All" quote equals the
// formula FinancePanel used before the quote moved into DebtManager, and the
// payment charges exactly what was quoted.
describe('Property: Pay All quote matches the panel formula it replaced', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('quote, old formula and actual charge agree', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20000 }),
        fc.integer({ min: 0, max: 20000 }),
        fc.boolean(),
        (debt, credits, early) => {
          const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
          game.isTestEnvironment = true;
          game.initNewGame();
          game.setDebt(debt);
          game.updateCredits(credits);
          game.getState().player.finance.lastBorrowDay = early
            ? game.getState().player.daysElapsed
            : null;

          const rate = early ? COLE_DEBT_CONFIG.EARLY_REPAYMENT_FEE_RATE : 0;
          const oldAmount =
            rate > 0
              ? Math.min(Math.floor(credits / (1 + rate)), debt)
              : Math.min(credits, debt);
          const oldFee = rate > 0 ? Math.ceil(oldAmount * rate) : 0;

          const quote = game.quoteDebtPayment(Math.min(credits, debt));
          const quotedAmount = quote.success ? quote.amount : 0;
          const quotedFee = quote.success ? quote.fee : 0;
          expect(quotedAmount).toBe(oldAmount);
          if (oldAmount > 0) expect(quotedFee).toBe(oldFee);

          if (quote.success) {
            const paid = game.makeDebtPayment(Math.min(credits, debt));
            expect(paid).toMatchObject({
              success: true,
              amount: quote.amount,
              fee: quote.fee,
            });
            expect(game.getState().player.credits).toBe(
              credits - quote.amount - quote.fee
            );
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
