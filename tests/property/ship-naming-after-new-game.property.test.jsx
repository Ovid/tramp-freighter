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
        // This indicates the app should transition to ship naming dialog
        expect(onStartGame.mock.calls.length).toBe(1);
        expect(onStartGame.mock.calls[0][0]).toBe(true);

        // Clean up
        clearSave(true);
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

        expect(newGameButton).toBeTruthy();

        // Click New Game button
        fireEvent.click(newGameButton);

        // Verify onStartGame was called with true (new game)
        // This indicates the app should transition to ship naming dialog
        expect(onStartGame.mock.calls.length).toBe(1);
        expect(onStartGame.mock.calls[0][0]).toBe(true);
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
        // Ship naming dialog should not be shown if new game is cancelled
        expect(onStartGame.mock.calls.length).toBe(0);

        // Clean up
        clearSave(true);
      }),
      { numRuns: 100 }
    );
  });
});
