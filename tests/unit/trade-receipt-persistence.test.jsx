import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from '@testing-library/react';
import { TradePanel } from '../../src/features/trade/TradePanel.jsx';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { NOTIFICATION_CONFIG } from '../../src/game/constants.js';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Trade receipt persistence test
 *
 * Cole's withholding receipt should persist until the next sale or panel close,
 * not auto-dismiss on a timer. Players need time to read financial details.
 */
describe('Trade receipt persistence', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Cole withholding receipt persists after DEFAULT_SUCCESS_DURATION', () => {
    vi.useFakeTimers();

    const gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();

    // Set up: player has debt and cargo to sell
    gsm.state.player.credits = 500;
    gsm.state.player.debt = 10000;
    gsm.state.player.currentSystem = 0; // Sol
    gsm.state.ship.cargo = [
      { good: 'electronics', qty: 10, buyPrice: 100, buySystem: 0, buyDate: 0 },
    ];

    const wrapper = createWrapper(gsm);
    render(<TradePanel onClose={() => {}} />, { wrapper });

    // Sell 1 unit — should trigger withholding receipt
    const sellButton = screen.getAllByText(/Sell 1/)[0];
    fireEvent.click(sellButton);

    // Receipt should be visible immediately
    const receipt = screen.getByText(/Cole's cut/);
    expect(receipt).toBeTruthy();

    // Advance past the old timeout duration
    act(() => {
      vi.advanceTimersByTime(
        NOTIFICATION_CONFIG.DEFAULT_SUCCESS_DURATION + 1000
      );
    });

    // Receipt should STILL be visible — it persists until next sale or panel close
    expect(screen.getByText(/Cole's cut/)).toBeTruthy();

    vi.useRealTimers();
    cleanup();
  });
});
