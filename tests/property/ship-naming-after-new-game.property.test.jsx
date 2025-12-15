import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
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
 * React Migration Spec, Property 55: Ship naming after new game
 * Validates: Requirements 47.6
 *
 * For any confirmed new game start, the ship naming dialog should be displayed
 * before the game view. This ensures players can name their ship when starting
 * a new game.
 */
describe('Property: Ship naming after new game', () => {
  it('should call onStartGame with true when new game is confirmed', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
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

        // Mock onStartGame callback to verify it's called with true (new game)
        const onStartGame = vi.fn();

        // Render TitleScreen component
        const { container } = render(
          <TitleScreen onStartGame={onStartGame} />,
          { wrapper }
        );

        // Find and click the New Game button
        const buttons = Array.from(container.querySelectorAll('.menu-btn'));
        const newGameButton = buttons.find(
          (btn) => btn.textContent === 'New Game'
        );

        if (!newGameButton) {
          console.error('New Game button not found');
          clearSave(true);
          return false;
        }

        // Click New Game button
        fireEvent.click(newGameButton);

        // Wait for modal to appear
        try {
          await waitFor(() => {
            const modal = document.querySelector('.modal-overlay');
            expect(modal).toBeTruthy();
          });
        } catch (error) {
          console.error('Confirmation modal not displayed');
          clearSave(true);
          return false;
        }

        // Find and click the confirm button
        const confirmButton = document.querySelector('.modal-confirm');
        if (!confirmButton) {
          console.error('Confirm button not found');
          clearSave(true);
          return false;
        }

        fireEvent.click(confirmButton);

        // Verify onStartGame was called with true (new game)
        // This indicates the app should transition to ship naming dialog
        if (onStartGame.mock.calls.length !== 1) {
          console.error(
            'onStartGame not called once after confirmation:',
            onStartGame.mock.calls.length
          );
          clearSave(true);
          return false;
        }

        if (onStartGame.mock.calls[0][0] !== true) {
          console.error(
            'onStartGame not called with true (new game):',
            onStartGame.mock.calls[0][0]
          );
          clearSave(true);
          return false;
        }

        // Clean up
        clearSave(true);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should call onStartGame with true when new game is started without existing save', () => {
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

        // Find and click the New Game button
        const buttons = Array.from(container.querySelectorAll('.menu-btn'));
        const newGameButton = buttons.find(
          (btn) => btn.textContent === 'New Game'
        );

        if (!newGameButton) {
          console.error('New Game button not found');
          return false;
        }

        // Click New Game button
        fireEvent.click(newGameButton);

        // Verify onStartGame was called with true (new game)
        // This indicates the app should transition to ship naming dialog
        if (onStartGame.mock.calls.length !== 1) {
          console.error(
            'onStartGame not called once:',
            onStartGame.mock.calls.length
          );
          return false;
        }

        if (onStartGame.mock.calls[0][0] !== true) {
          console.error(
            'onStartGame not called with true (new game):',
            onStartGame.mock.calls[0][0]
          );
          return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should NOT call onStartGame when new game is cancelled', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
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

        // Find and click the New Game button
        const buttons = Array.from(container.querySelectorAll('.menu-btn'));
        const newGameButton = buttons.find(
          (btn) => btn.textContent === 'New Game'
        );

        if (!newGameButton) {
          console.error('New Game button not found');
          clearSave(true);
          return false;
        }

        // Click New Game button
        fireEvent.click(newGameButton);

        // Wait for modal to appear
        try {
          await waitFor(() => {
            const modal = document.querySelector('.modal-overlay');
            expect(modal).toBeTruthy();
          });
        } catch (error) {
          console.error('Confirmation modal not displayed');
          clearSave(true);
          return false;
        }

        // Find and click the cancel button
        const cancelButton = document.querySelector('.modal-cancel');
        if (!cancelButton) {
          console.error('Cancel button not found');
          clearSave(true);
          return false;
        }

        fireEvent.click(cancelButton);

        // Verify onStartGame was NOT called
        // Ship naming dialog should not be shown if new game is cancelled
        if (onStartGame.mock.calls.length > 0) {
          console.error(
            'onStartGame called after cancellation:',
            onStartGame.mock.calls.length
          );
          clearSave(true);
          return false;
        }

        // Clean up
        clearSave(true);

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
