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
 * React Migration Spec, Property 53: New game confirmation
 * Validates: Requirements 47.5
 *
 * For any New Game button click when a saved game exists, a confirmation
 * dialog should be displayed. This ensures players don't accidentally
 * overwrite their existing save without confirmation.
 */
describe('Property: New game confirmation', () => {
  it('should display confirmation modal when New Game clicked with existing save', async () => {
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

        // Verify no modal is displayed initially
        const initialModal = document.querySelector('.modal-overlay');
        if (initialModal) {
          console.error('Modal displayed before New Game button clicked');
          clearSave(true);
          return false;
        }

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
          console.error(
            'Confirmation modal not displayed after New Game click'
          );
          clearSave(true);
          return false;
        }

        // Verify modal contains confirmation message
        const modalMessage = document.querySelector('.modal-message');
        if (!modalMessage) {
          console.error('Modal message not found');
          clearSave(true);
          return false;
        }

        const messageText = modalMessage.textContent;
        if (
          !messageText.includes('overwrite') ||
          !messageText.includes('save')
        ) {
          console.error(
            'Modal message does not mention overwriting save:',
            messageText
          );
          clearSave(true);
          return false;
        }

        // Verify modal has confirm and cancel buttons
        const confirmButton = document.querySelector('.modal-confirm');
        const cancelButton = document.querySelector('.modal-cancel');

        if (!confirmButton) {
          console.error('Confirm button not found in modal');
          clearSave(true);
          return false;
        }

        if (!cancelButton) {
          console.error('Cancel button not found in modal');
          clearSave(true);
          return false;
        }

        // Verify onStartGame was NOT called yet (waiting for confirmation)
        if (onStartGame.mock.calls.length > 0) {
          console.error('onStartGame called before confirmation');
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

  it('should NOT display confirmation modal when New Game clicked without save', () => {
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

        // Verify confirmation modal is NOT displayed (check document, not container)
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
          console.error(
            'Confirmation modal displayed when no save exists (should start game directly)'
          );
          return false;
        }

        // Verify onStartGame was called with true (new game)
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

  it('should call onStartGame with true when confirmation is accepted', async () => {
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

        // Find and click the confirm button
        const confirmButton = document.querySelector('.modal-confirm');
        if (!confirmButton) {
          console.error('Confirm button not found');
          clearSave(true);
          return false;
        }

        fireEvent.click(confirmButton);

        // Verify onStartGame was called with true (new game)
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

  it('should NOT call onStartGame when confirmation is cancelled', async () => {
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
        if (onStartGame.mock.calls.length > 0) {
          console.error(
            'onStartGame called after cancellation:',
            onStartGame.mock.calls.length
          );
          clearSave(true);
          return false;
        }

        // Wait for modal to close
        try {
          await waitFor(() => {
            const modalAfterCancel = document.querySelector('.modal-overlay');
            expect(modalAfterCancel).toBeFalsy();
          });
        } catch (error) {
          console.error('Modal still displayed after cancellation');
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

  it('should close modal when Escape key is pressed', async () => {
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

        // Press Escape key
        fireEvent.keyDown(document, { key: 'Escape' });

        // Verify onStartGame was NOT called
        if (onStartGame.mock.calls.length > 0) {
          console.error(
            'onStartGame called after Escape:',
            onStartGame.mock.calls.length
          );
          clearSave(true);
          return false;
        }

        // Wait for modal to close
        try {
          await waitFor(() => {
            const modalAfterEscape = document.querySelector('.modal-overlay');
            expect(modalAfterEscape).toBeFalsy();
          });
        } catch (error) {
          console.error('Modal still displayed after Escape key');
          clearSave(true);
          return false;
        }

        // Clean up
        clearSave(true);

        return true;
      }),
      { numRuns: 50 }
    );
  });
});
