import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameProvider } from '../../src/context/GameContext';
import { FinancePanel } from '../../src/features/finance/FinancePanel';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';
import { COLE_DEBT_CONFIG } from '../../src/game/constants';

// Pins that the fee FinancePanel shows on each payment button is the fee the
// payment then charges, inside and outside the early-repayment window.
const credits = (g) => g.getState().player.credits;
const debt = (g) => g.getState().player.debt;

// Reads "Pay ₡500 (+₡50 fee)" or "Pay All (₡1,000 +₡100 fee)" as numbers.
const parseLabel = (text) => {
  const nums = [...text.matchAll(/₡([\d,]+)/g)].map((m) =>
    Number(m[1].replace(/,/g, ''))
  );
  return { amount: nums[0], fee: nums[1] ?? 0 };
};

describe('Finance fee safety net', () => {
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

  const renderPanel = () =>
    render(
      <GameProvider game={game}>
        <FinancePanel onClose={() => {}} />
      </GameProvider>
    );

  const payButton = (amount) =>
    screen.getByRole('button', { name: new RegExp(`^Pay ₡${amount}\\b`) });
  const payAllButton = () => screen.getByRole('button', { name: /^Pay All/ });

  const expectChargedAsShown = (button) => {
    const shown = parseLabel(button.textContent);
    const c0 = credits(game);
    const d0 = debt(game);
    fireEvent.click(button);
    expect(d0 - debt(game)).toBe(shown.amount);
    expect(c0 - credits(game)).toBe(shown.amount + shown.fee);
    return shown;
  };

  describe('inside the early-repayment window', () => {
    beforeEach(() => {
      expect(game.borrowFromCole(100).success).toBe(true);
    });

    it.each(COLE_DEBT_CONFIG.PAYMENT_TIERS)(
      'the Pay ₡%i button charges the fee it shows',
      (tier) => {
        game.updateCredits(5000);
        renderPanel();
        const shown = expectChargedAsShown(payButton(tier));
        expect(shown.fee).toBeGreaterThan(0);
      }
    );

    it('Pay All charges the amount and fee it shows when credits are the limit', () => {
      game.updateCredits(1234);
      renderPanel();
      const shown = expectChargedAsShown(payAllButton());
      expect(shown.fee).toBeGreaterThan(0);
      expect(shown.amount).toBeLessThan(1234);
    });

    it('a tier button is disabled when credits cover the amount but not the fee', () => {
      game.updateCredits(100);
      renderPanel();
      expect(payButton(100)).toBeDisabled();
    });
  });

  describe('outside the early-repayment window', () => {
    it('payment buttons show no fee and charge only the amount', () => {
      game.updateCredits(5000);
      renderPanel();
      expect(payButton(500).textContent).not.toMatch(/fee/);
      const shown = expectChargedAsShown(payButton(500));
      expect(shown.fee).toBe(0);
    });

    it('Pay All shows no fee and charges only the amount', () => {
      game.updateCredits(1234);
      renderPanel();
      expect(payAllButton().textContent).not.toMatch(/fee/);
      const shown = expectChargedAsShown(payAllButton());
      expect(shown).toEqual({ amount: 1234, fee: 0 });
    });
  });
});
