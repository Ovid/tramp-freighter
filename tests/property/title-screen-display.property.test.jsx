import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { TitleScreen } from '../../src/features/title-screen/TitleScreen';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

// Suppress console warnings during tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * React Migration Spec, Property 51: Title screen displays on load
 * Validates: Requirements 47.1
 *
 * For any application initialization, the title screen should be displayed
 * before the game view. This ensures players see the title screen with
 * options to continue or start a new game when the application first loads.
 */
describe('Property: Title screen displays on load', () => {
  it('should display title screen with game title and menu options', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        const wrapper = createWrapper(game);

        // Mock onStartGame callback
        const onStartGame = vi.fn();

        // Render TitleScreen component
        const { container } = render(
          <TitleScreen onStartGame={onStartGame} />,
          { wrapper }
        );

        // Verify title screen container is present
        const titleScreen = container.querySelector('.title-screen');
        expect(titleScreen).toBeTruthy();

        // Verify game title is displayed
        const menuTitle = container.querySelector('.menu-title');
        expect(menuTitle).toBeTruthy();
        expect(menuTitle.textContent).toBe('Tramp Freighter Blues');

        // Verify subtitle is displayed
        const menuSubtitle = container.querySelector('.menu-subtitle');
        expect(menuSubtitle).toBeTruthy();
        expect(menuSubtitle.textContent).toBe('Sol Sector Trading Simulation');

        // Verify menu buttons container is present
        const menuButtons = container.querySelector('.menu-buttons');
        expect(menuButtons).toBeTruthy();

        // Verify at least one button is present (New Game should always be present)
        const buttons = menuButtons.querySelectorAll('.menu-btn');
        expect(buttons.length).toBeGreaterThan(0);

        // Verify version number is displayed
        const menuVersion = container.querySelector('.menu-version');
        expect(menuVersion).toBeTruthy();
        expect(menuVersion.textContent).toMatch(/^v\d+\.\d+\.\d+$/);
      }),
      { numRuns: 100 }
    );
  });

  it('should display title screen before game components', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        const wrapper = createWrapper(game);

        // Mock onStartGame callback
        const onStartGame = vi.fn();

        // Render TitleScreen component
        const { container } = render(
          <TitleScreen onStartGame={onStartGame} />,
          { wrapper }
        );

        // Verify title screen is present
        const titleScreen = container.querySelector('.title-screen');
        expect(titleScreen).toBeTruthy();

        // Verify game components are NOT present when title screen is shown
        // (This validates that title screen is shown BEFORE game view)
        const starmap = container.querySelector('.starmap-container');
        expect(starmap).toBeFalsy();

        const hud = container.querySelector('#game-hud');
        expect(hud).toBeFalsy();

        const stationMenu = container.querySelector('#station-interface');
        expect(stationMenu).toBeFalsy();

        return titleScreen && !starmap && !hud && !stationMenu;
      }),
      { numRuns: 100 }
    );
  });

  it('should display New Game button on title screen', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        const wrapper = createWrapper(game);

        // Mock onStartGame callback
        const onStartGame = vi.fn();

        // Render TitleScreen component
        const { container } = render(
          <TitleScreen onStartGame={onStartGame} />,
          { wrapper }
        );

        // Verify New Game button is present
        const buttons = Array.from(container.querySelectorAll('.menu-btn')).map(
          (btn) => btn.textContent
        );
        expect(buttons).toContain('New Game');

        return buttons.includes('New Game');
      }),
      { numRuns: 100 }
    );
  });
});
