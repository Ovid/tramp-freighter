import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { TitleScreen } from '../../src/features/title-screen/TitleScreen';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { clearSave } from '../../src/game/state/save-load.js';
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
 * React Migration Spec, Property 52: Continue button visibility
 * Validates: Requirements 47.2, 47.3
 *
 * For any title screen display, the Continue Game button should be visible
 * if and only if a saved game exists. This ensures players can only continue
 * when they have a saved game to load.
 */
describe('Property: Continue button visibility', () => {
  it('should display Continue Game button when saved game exists', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        // Clear any existing save first
        clearSave(true);

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Save the game to create a saved game
        gameStateManager.saveGame();

        // Verify save exists
        expect(gameStateManager.hasSavedGame()).toBe(true);

        const wrapper = createWrapper(gameStateManager);

        // Mock onStartGame callback
        const onStartGame = vi.fn();

        // Render TitleScreen component
        const { container } = render(
          <TitleScreen onStartGame={onStartGame} />,
          { wrapper }
        );

        // Get all menu buttons
        const buttons = Array.from(container.querySelectorAll('.menu-btn')).map(
          (btn) => btn.textContent
        );

        // Verify Continue Game button is present
        const hasContinueButton = buttons.includes('Continue Game');
        if (!hasContinueButton) {
          console.error(
            'Continue Game button not found when save exists. Buttons:',
            buttons
          );
        }

        // Verify New Game button is also present
        const hasNewGameButton = buttons.includes('New Game');
        if (!hasNewGameButton) {
          console.error(
            'New Game button not found when save exists. Buttons:',
            buttons
          );
        }

        // Clean up
        clearSave(true);

        return hasContinueButton && hasNewGameButton;
      }),
      { numRuns: 100 }
    );
  });

  it('should NOT display Continue Game button when no saved game exists', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        // Clear any existing save to ensure no save exists
        clearSave(true);

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Verify no save exists
        expect(gameStateManager.hasSavedGame()).toBe(false);

        const wrapper = createWrapper(gameStateManager);

        // Mock onStartGame callback
        const onStartGame = vi.fn();

        // Render TitleScreen component
        const { container } = render(
          <TitleScreen onStartGame={onStartGame} />,
          { wrapper }
        );

        // Get all menu buttons
        const buttons = Array.from(container.querySelectorAll('.menu-btn')).map(
          (btn) => btn.textContent
        );

        // Verify Continue Game button is NOT present
        const hasContinueButton = buttons.includes('Continue Game');
        if (hasContinueButton) {
          console.error(
            'Continue Game button found when no save exists. Buttons:',
            buttons
          );
        }

        // Verify New Game button is present
        const hasNewGameButton = buttons.includes('New Game');
        if (!hasNewGameButton) {
          console.error(
            'New Game button not found when no save exists. Buttons:',
            buttons
          );
        }

        return !hasContinueButton && hasNewGameButton;
      }),
      { numRuns: 100 }
    );
  });

  it('should update Continue Game button visibility when save state changes', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        // Clear any existing save first
        clearSave(true);

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Initially no save
        expect(gameStateManager.hasSavedGame()).toBe(false);

        const wrapper = createWrapper(gameStateManager);

        // Mock onStartGame callback
        const onStartGame = vi.fn();

        // Render TitleScreen component without save
        const { container: container1, unmount: unmount1 } = render(
          <TitleScreen onStartGame={onStartGame} />,
          { wrapper }
        );

        // Verify Continue Game button is NOT present
        const buttons1 = Array.from(
          container1.querySelectorAll('.menu-btn')
        ).map((btn) => btn.textContent);
        const hasContinueButton1 = buttons1.includes('Continue Game');

        if (hasContinueButton1) {
          console.error(
            'Continue Game button found when no save exists (initial render). Buttons:',
            buttons1
          );
        }

        // Unmount first render
        unmount1();
        cleanup();

        // Now save the game
        gameStateManager.saveGame();
        expect(gameStateManager.hasSavedGame()).toBe(true);

        // Render TitleScreen component again with save
        const { container: container2 } = render(
          <TitleScreen onStartGame={onStartGame} />,
          { wrapper }
        );

        // Verify Continue Game button IS present now
        const buttons2 = Array.from(
          container2.querySelectorAll('.menu-btn')
        ).map((btn) => btn.textContent);
        const hasContinueButton2 = buttons2.includes('Continue Game');

        if (!hasContinueButton2) {
          console.error(
            'Continue Game button not found when save exists (second render). Buttons:',
            buttons2
          );
        }

        // Clean up
        clearSave(true);

        return !hasContinueButton1 && hasContinueButton2;
      }),
      { numRuns: 50 }
    );
  });
});
