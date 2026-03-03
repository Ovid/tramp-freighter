import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TradePanel } from '../../src/features/trade/TradePanel.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SOL_SYSTEM_ID } from '../../src/game/constants.js';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Render test for the RESTRICTED badge in TradePanel.
 *
 * Verifies TradePanel actually renders (or omits) the badge based on
 * the current system's danger zone, not just that the constants are correct.
 */
describe('TradePanel restricted badge rendering', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('renders RESTRICTED badge for electronics in safe zone (Sol)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
    gsm.state.player.currentSystem = SOL_SYSTEM_ID; // Sol — safe zone

    const wrapper = createWrapper(gsm);
    render(<TradePanel onClose={() => {}} />, { wrapper });

    const badges = screen.getAllByText('RESTRICTED');
    expect(badges.length).toBeGreaterThan(0);

    // The badge should have an aria-label containing the tooltip
    expect(badges[0].getAttribute('aria-label')).toContain('Restricted');
  });

  it('does not render RESTRICTED badge for medicine in safe zone (Sol)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
    gsm.state.player.currentSystem = SOL_SYSTEM_ID; // Sol — safe zone, medicine is NOT restricted

    const wrapper = createWrapper(gsm);
    render(<TradePanel onClose={() => {}} />, { wrapper });

    // Only electronics should be restricted in safe zone, not medicine
    const badges = screen.getAllByText('RESTRICTED');
    const badgeParents = badges.map((b) => b.closest('.good-item'));
    const restrictedGoodNames = badgeParents.map(
      (p) => p.querySelector('.good-name').textContent
    );

    expect(restrictedGoodNames).not.toContain('Medicine');
  });

  it('renders RESTRICTED badge for medicine in contested zone (Sirius)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
    gsm.state.player.currentSystem = 7; // Sirius — contested zone

    const wrapper = createWrapper(gsm);
    render(<TradePanel onClose={() => {}} />, { wrapper });

    const badges = screen.getAllByText('RESTRICTED');
    const badgeParents = badges.map((b) => b.closest('.good-item'));
    const restrictedGoodNames = badgeParents.map(
      (p) => p.querySelector('.good-name').textContent
    );

    expect(restrictedGoodNames).toContain('Medicine');
  });

  it('renders RESTRICTED badge for parts in core system (Sol)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
    gsm.state.player.currentSystem = SOL_SYSTEM_ID; // Sol — core system

    const wrapper = createWrapper(gsm);
    render(<TradePanel onClose={() => {}} />, { wrapper });

    const badges = screen.getAllByText('RESTRICTED');
    const badgeParents = badges.map((b) => b.closest('.good-item'));
    const restrictedGoodNames = badgeParents.map(
      (p) => p.querySelector('.good-name').textContent
    );

    expect(restrictedGoodNames).toContain('Parts');
  });

  it('does not render RESTRICTED badge for parts in non-core system', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const gsm = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
    gsm.state.player.currentSystem = 7; // Sirius — not a core system

    const wrapper = createWrapper(gsm);
    render(<TradePanel onClose={() => {}} />, { wrapper });

    const badges = screen.getAllByText('RESTRICTED');
    const badgeParents = badges.map((b) => b.closest('.good-item'));
    const restrictedGoodNames = badgeParents.map(
      (p) => p.querySelector('.good-name').textContent
    );

    expect(restrictedGoodNames).not.toContain('Parts');
  });
});
