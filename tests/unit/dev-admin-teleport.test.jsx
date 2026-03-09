import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { DevAdminPanel } from '../../src/features/dev-admin/DevAdminPanel.jsx';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ENDGAME_CONFIG } from '../../src/game/constants.js';
import { createWrapper } from '../react-test-utils.jsx';

describe('DevAdminPanel teleport', () => {
  let game;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders Teleport section with a star dropdown after NPC Reputation', () => {
    const wrapper = createWrapper(game);
    const { container } = render(<DevAdminPanel onClose={() => {}} />, {
      wrapper,
    });
    const headings = Array.from(container.querySelectorAll('h3'));
    const teleportHeading = headings.find((h) => h.textContent === 'Teleport');
    expect(teleportHeading).toBeTruthy();

    const section = teleportHeading.closest('.dev-admin-section');
    const select = section.querySelector('select');
    expect(select).toBeTruthy();

    const options = Array.from(select.querySelectorAll('option'));
    // Should include reachable stars plus Delta Pavonis
    expect(
      options.find((o) => o.textContent.includes('Delta Pavonis'))
    ).toBeTruthy();
    expect(options.find((o) => o.textContent.includes('Sol'))).toBeTruthy();
  });

  it('only includes reachable stars (r:1) plus Delta Pavonis', () => {
    const wrapper = createWrapper(game);
    const { container } = render(<DevAdminPanel onClose={() => {}} />, {
      wrapper,
    });
    const headings = Array.from(container.querySelectorAll('h3'));
    const section = headings
      .find((h) => h.textContent === 'Teleport')
      .closest('.dev-admin-section');
    const select = section.querySelector('select');
    const options = Array.from(select.querySelectorAll('option'));

    // Filter out the placeholder option
    const starOptions = options.filter((o) => o.value !== '');

    const reachableCount = STAR_DATA.filter((s) => s.r === 1).length;
    // reachable stars + Delta Pavonis (which has r:0)
    expect(starOptions).toHaveLength(reachableCount + 1);
  });

  it('teleports player to selected system when Go is clicked', () => {
    const wrapper = createWrapper(game);
    const { container } = render(<DevAdminPanel onClose={() => {}} />, {
      wrapper,
    });
    const headings = Array.from(container.querySelectorAll('h3'));
    const section = headings
      .find((h) => h.textContent === 'Teleport')
      .closest('.dev-admin-section');
    const select = section.querySelector('select');

    fireEvent.change(select, {
      target: { value: String(ENDGAME_CONFIG.DELTA_PAVONIS_ID) },
    });

    const goBtn = section.querySelector('button');
    fireEvent.click(goBtn);

    expect(game.getState().player.currentSystem).toBe(
      ENDGAME_CONFIG.DELTA_PAVONIS_ID
    );
  });
});
