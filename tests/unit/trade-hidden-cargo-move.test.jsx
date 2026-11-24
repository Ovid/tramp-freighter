import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, within, fireEvent } from '@testing-library/react';
import { TradePanel } from '../../src/features/trade/TradePanel.jsx';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SHIP_CONFIG } from '../../src/game/constants.js';
import { createWrapper } from '../react-test-utils.jsx';

const HIDDEN_CAPACITY =
  SHIP_CONFIG.UPGRADES.smuggler_panels.effects.hiddenCargoCapacity;

function renderWithCargo(cargo) {
  const gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
  gsm.initNewGame();
  gsm.state.ship.upgrades = ['smuggler_panels'];
  gsm.state.ship.hiddenCargo = [];
  gsm.state.ship.cargo = cargo;
  render(<TradePanel onClose={() => {}} />, { wrapper: createWrapper(gsm) });
  return gsm;
}

// Issue #50: hidden-compartment moves
describe('TradePanel hidden cargo moves', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('moves only what fits when the stack exceeds hidden capacity', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const gsm = renderWithCargo([
      { good: 'electronics', qty: HIDDEN_CAPACITY + 5, buyPrice: 100 },
    ]);

    const stack = within(document.getElementById('cargo-stacks'))
      .getByText('Electronics')
      .closest('.cargo-stack');
    fireEvent.click(within(stack).getByText('Move to Hidden'));

    expect(gsm.state.ship.hiddenCargo[0].qty).toBe(HIDDEN_CAPACITY);
    expect(gsm.state.ship.cargo[0].qty).toBe(5);
  });
});
