import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TradePanel } from '../../src/features/trade/TradePanel.jsx';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SOL_SYSTEM_ID } from '../../src/game/constants.js';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Verifies that the restricted hint (explanation text) appears only once
 * (on the first restricted item) to avoid spamming the UI when multiple
 * goods are restricted in the same zone.
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

  it('shows restricted hint only on first restricted item when not yet dismissed', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
    gsm.state.player.currentSystem = SOL_SYSTEM_ID;

    const wrapper = createWrapper(gsm);
    render(<TradePanel onClose={() => {}} />, { wrapper });

    // Sol has 2 restricted goods — both get RESTRICTED badges
    const badges = screen.getAllByText('RESTRICTED');
    expect(badges.length).toBe(2);

    // Only the first restricted item shows the dismiss hint
    const dismissButtons = screen.getAllByText('Got it');
    expect(dismissButtons.length).toBe(1);
  });
});
