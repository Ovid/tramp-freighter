import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { TitleScreen } from '../../src/features/title-screen/TitleScreen';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

// Suppress console warnings during tests
// React Testing Library warnings that are expected in property-based tests:
// - "Warning: An update to" - React state updates outside act() are expected in fast-check
// - "act()" - Property tests intentionally trigger updates without act() wrapper
// - "Not implemented: HTMLFormElement.prototype.submit" - jsdom limitation, not a real error
let originalConsoleError;
let originalConsoleWarn;

beforeAll(() => {
  originalConsoleError = console.error;
  originalConsoleWarn = console.warn;

  console.error = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Warning: An update to') ||
        message.includes('act()') ||
        message.includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return; // Suppress expected warnings listed above
    }
    originalConsoleError(...args);
  };

  console.warn = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('Not implemented')) {
      return; // Suppress jsdom "Not implemented" warnings (browser API limitations)
    }
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
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

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const wrapper = createWrapper(gameStateManager);

        // Mock onStartGame callback
        const onStartGame = vi.fn();

        // Render TitleScreen component
        const { container } = render(
          <TitleScreen onStartGame={onStartGame} />,
          { wrapper }
        );

        // Verify title screen container is present
        const titleScreen = container.querySelector('.title-screen');
        if (!titleScreen) {
          console.error('Title screen not found');
          return false;
        }

        // Verify game title is displayed
        const menuTitle = container.querySelector('.menu-title');
        if (!menuTitle) {
          console.error('Menu title not found');
          return false;
        }
        if (menuTitle.textContent !== 'Tramp Freighter Blues') {
          console.error('Menu title text incorrect:', menuTitle.textContent);
          return false;
        }

        // Verify subtitle is displayed
        const menuSubtitle = container.querySelector('.menu-subtitle');
        if (!menuSubtitle) {
          console.error('Menu subtitle not found');
          return false;
        }
        if (menuSubtitle.textContent !== 'Sol Sector Trading Simulation') {
          console.error(
            'Menu subtitle text incorrect:',
            menuSubtitle.textContent
          );
          return false;
        }

        // Verify menu buttons container is present
        const menuButtons = container.querySelector('.menu-buttons');
        if (!menuButtons) {
          console.error('Menu buttons container not found');
          return false;
        }

        // Verify at least one button is present (New Game should always be present)
        const buttons = menuButtons.querySelectorAll('.menu-btn');
        if (buttons.length === 0) {
          console.error('No menu buttons found');
          return false;
        }

        // Verify version number is displayed
        const menuVersion = container.querySelector('.menu-version');
        if (!menuVersion) {
          console.error('Menu version not found');
          return false;
        }
        if (!/^v\d+\.\d+\.\d+$/.test(menuVersion.textContent)) {
          console.error(
            'Menu version format incorrect:',
            menuVersion.textContent
          );
          return false;
        }

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should display title screen before game components', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const wrapper = createWrapper(gameStateManager);

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
      { numRuns: 10 }
    );
  });

  it('should display New Game button on title screen', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        const wrapper = createWrapper(gameStateManager);

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
      { numRuns: 10 }
    );
  });
});
