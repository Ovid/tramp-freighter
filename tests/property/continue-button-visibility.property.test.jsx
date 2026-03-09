import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { TitleScreen } from '../../src/features/title-screen/TitleScreen';
import { GameCoordinator } from "@game/state/game-coordinator.js";
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

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        // Save the game to create a saved game
        game.saveGame();

        // Verify save exists
        expect(game.hasSavedGame()).toBe(true);

        const wrapper = createWrapper(game);

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

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        // Verify no save exists
        expect(game.hasSavedGame()).toBe(false);

        const wrapper = createWrapper(game);

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

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        // Initially no save
        expect(game.hasSavedGame()).toBe(false);

        const wrapper = createWrapper(game);

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
        game.saveGame();
        expect(game.hasSavedGame()).toBe(true);

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
      { numRuns: 100 }
    );
  });
});
