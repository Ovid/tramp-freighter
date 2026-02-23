import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { TitleScreen } from '../../src/features/title-screen/TitleScreen';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { clearSave } from '../../src/game/state/save-load.js';
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
        expect(initialModal).toBeFalsy();

        // Find and click the New Game button
        const buttons = Array.from(container.querySelectorAll('.menu-btn'));
        const newGameButton = buttons.find(
          (btn) => btn.textContent === 'New Game'
        );

        expect(newGameButton).toBeTruthy();

        // Click New Game button
        fireEvent.click(newGameButton);

        // Wait for modal to appear
        await waitFor(() => {
          const modal = document.querySelector('.modal-overlay');
          expect(modal).toBeTruthy();
        });

        // Verify modal contains confirmation message
        const modalMessage = document.querySelector('.modal-message');
        expect(modalMessage).toBeTruthy();

        const messageText = modalMessage.textContent;
        expect(messageText).toContain('overwrite');
        expect(messageText).toContain('save');

        // Verify modal has confirm and cancel buttons
        const confirmButton = document.querySelector('.modal-confirm');
        const cancelButton = document.querySelector('.modal-cancel');

        expect(confirmButton).toBeTruthy();
        expect(cancelButton).toBeTruthy();

        // Verify onStartGame was NOT called yet (waiting for confirmation)
        expect(onStartGame.mock.calls.length).toBe(0);

        // Clean up
        clearSave(true);
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

        expect(newGameButton).toBeTruthy();

        // Click New Game button
        fireEvent.click(newGameButton);

        // Verify confirmation modal is NOT displayed (check document, not container)
        const modal = document.querySelector('.modal-overlay');
        expect(modal).toBeFalsy();

        // Verify onStartGame was called with true (new game)
        expect(onStartGame.mock.calls.length).toBe(1);
        expect(onStartGame.mock.calls[0][0]).toBe(true);
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

        expect(newGameButton).toBeTruthy();

        // Click New Game button
        fireEvent.click(newGameButton);

        // Wait for modal to appear
        await waitFor(() => {
          const modal = document.querySelector('.modal-overlay');
          expect(modal).toBeTruthy();
        });

        // Find and click the confirm button
        const confirmButton = document.querySelector('.modal-confirm');
        expect(confirmButton).toBeTruthy();

        fireEvent.click(confirmButton);

        // Verify onStartGame was called with true (new game)
        expect(onStartGame.mock.calls.length).toBe(1);
        expect(onStartGame.mock.calls[0][0]).toBe(true);

        // Clean up
        clearSave(true);
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

        expect(newGameButton).toBeTruthy();

        // Click New Game button
        fireEvent.click(newGameButton);

        // Wait for modal to appear
        await waitFor(() => {
          const modal = document.querySelector('.modal-overlay');
          expect(modal).toBeTruthy();
        });

        // Find and click the cancel button
        const cancelButton = document.querySelector('.modal-cancel');
        expect(cancelButton).toBeTruthy();

        fireEvent.click(cancelButton);

        // Verify onStartGame was NOT called
        expect(onStartGame.mock.calls.length).toBe(0);

        // Wait for modal to close
        await waitFor(() => {
          const modalAfterCancel = document.querySelector('.modal-overlay');
          expect(modalAfterCancel).toBeFalsy();
        });

        // Clean up
        clearSave(true);
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

        expect(newGameButton).toBeTruthy();

        // Click New Game button
        fireEvent.click(newGameButton);

        // Wait for modal to appear
        await waitFor(() => {
          const modal = document.querySelector('.modal-overlay');
          expect(modal).toBeTruthy();
        });

        // Press Escape key
        fireEvent.keyDown(document, { key: 'Escape' });

        // Verify onStartGame was NOT called
        expect(onStartGame.mock.calls.length).toBe(0);

        // Wait for modal to close
        await waitFor(() => {
          const modalAfterEscape = document.querySelector('.modal-overlay');
          expect(modalAfterEscape).toBeFalsy();
        });

        // Clean up
        clearSave(true);
      }),
      { numRuns: 100 }
    );
  });
});
