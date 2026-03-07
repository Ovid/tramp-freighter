import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TradePanel } from '../../src/features/trade/TradePanel.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SOL_SYSTEM_ID } from '../../src/game/constants.js';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Verifies that the restricted hint (explanation text) appears on ALL
 * restricted items when the player hasn't dismissed it yet, not just
 * the first one.
 */
describe('TradePanel restricted hint on all items', () => {
  beforeEach(() => {
    localStorage.removeItem('restrictedExplained');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
    localStorage.removeItem('restrictedExplained');
  });

  it('shows restricted hint on all restricted items when not yet dismissed', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
    gsm.state.player.currentSystem = SOL_SYSTEM_ID;

    const wrapper = createWrapper(gsm);
    render(<TradePanel onClose={() => {}} />, { wrapper });

    // Sol has 2 restricted goods (Parts and Electronics)
    const badges = screen.getAllByText('RESTRICTED');
    expect(badges.length).toBe(2);

    // Each restricted item should have a "Got it" dismiss button
    const dismissButtons = screen.getAllByText('Got it');
    expect(dismissButtons.length).toBe(2);
  });
});
