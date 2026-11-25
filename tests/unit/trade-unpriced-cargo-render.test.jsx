import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { TradePanel } from '../../src/features/trade/TradePanel.jsx';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

// Regression (issue #57): old saves hold mission cargo stripped of its
// missionId. No market prices it, so it must not offer a sale at "undefined".
describe('TradePanel unpriced cargo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('shows no sell buttons or undefined price for unpriced cargo', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
    gsm.state.ship.cargo = [
      { good: 'diplomatic_pouches', qty: 10, buyPrice: 0 },
    ];

    render(<TradePanel onClose={() => {}} />, {
      wrapper: createWrapper(gsm),
    });

    const stack = screen
      .getByText('Diplomatic Pouches')
      .closest('.cargo-stack');
    expect(stack.textContent).not.toContain('undefined');
    expect(within(stack).queryByText(/^Sell/)).toBeNull();
  });

  it('shows no undefined price for unpriced hidden cargo', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
    gsm.state.ship.upgrades = ['smuggler_panels'];
    gsm.state.ship.cargo = [];
    gsm.state.ship.hiddenCargo = [
      { good: 'diplomatic_pouches', qty: 10, buyPrice: 0 },
    ];

    render(<TradePanel onClose={() => {}} />, {
      wrapper: createWrapper(gsm),
    });

    const section = document.getElementById('hidden-cargo-section');
    expect(within(section).getByText('Diplomatic Pouches')).toBeTruthy();
    expect(section.textContent).not.toContain('undefined');
  });
});
