import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '@game/data/star-data.js';
import { WORMHOLE_DATA } from '@game/data/wormhole-data.js';

describe('Debt payment quotes', () => {
  let game;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.isTestEnvironment = true;
    game.initNewGame();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('quoteDebtPayment reduces an early payment to fit credits, as the payment does', () => {
    game.borrowFromCole(100);
    game.updateCredits(1234);

    const quote = game.quoteDebtPayment(1234);
    const credits0 = game.getState().player.credits;
    const debt0 = game.getState().player.debt;
    const paid = game.makeDebtPayment(1234);

    expect(quote).toEqual({
      success: true,
      amount: paid.amount,
      fee: paid.fee,
    });
    expect(quote.amount).toBeLessThan(1234);
    expect(debt0 - game.getState().player.debt).toBe(quote.amount);
    expect(credits0 - game.getState().player.credits).toBe(
      quote.amount + quote.fee
    );
  });
});
