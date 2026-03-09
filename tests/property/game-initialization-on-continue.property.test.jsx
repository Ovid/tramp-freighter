import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
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
 * React Migration Spec, Property 54: Game initialization on continue
 * Validates: Requirements 47.4
 *
 * For any Continue Game button click, the saved game should be loaded
 * and the game view should be displayed. This ensures players can
 * resume their existing game without data loss.
 */
describe('Property: Game initialization on continue', () => {
  it('should call onStartGame with false when Continue Game button is clicked', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        // Clear any existing save first
        clearSave(true);

        const game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
        game.initNewGame();

        // Modify game state to create a unique save
        const state = game.getState();
        state.player.credits = 5000; // Set specific credits value
        state.player.daysElapsed = 10; // Set specific days elapsed

        // Save the game
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

        // Find the Continue Game button
        const buttons = Array.from(container.querySelectorAll('.menu-btn'));
        const continueButton = buttons.find(
          (btn) => btn.textContent === 'Continue Game'
        );

        expect(continueButton).toBeTruthy();

        // Click Continue Game button
        fireEvent.click(continueButton);

        // Verify onStartGame was called with false (load existing game)
        expect(onStartGame.mock.calls.length).toBe(1);
        expect(onStartGame.mock.calls[0][0]).toBe(false);

        // Clean up
        clearSave(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve game state when continuing from saved game', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 100000 }), // Random credits
        fc.integer({ min: 1, max: 365 }), // Random days elapsed
        fc.integer({ min: 0, max: 100 }), // Random fuel percentage
        (credits, daysElapsed, fuel) => {
          cleanup();

          // Clear any existing save first
          clearSave(true);

          // Create first game state manager and save a game
          const game1 = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          game1.initNewGame();

          // Modify game state with random values
          const state1 = game1.getState();
          state1.player.credits = credits;
          state1.player.daysElapsed = daysElapsed;
          state1.ship.fuel = fuel;

          // Save the game
          game1.saveGame();

          // Verify save exists
          expect(game1.hasSavedGame()).toBe(true);

          // Create a new game state manager (simulating app reload)
          const game2 = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );

          // Verify the new manager can detect the save
          expect(game2.hasSavedGame()).toBe(true);

          const wrapper = createWrapper(game2);

          // Mock onStartGame callback that simulates loading the game
          const onStartGame = vi.fn((isNewGame) => {
            if (!isNewGame) {
              // Simulate loading the saved game
              game2.loadGame();
            }
          });

          // Render TitleScreen component
          const { container } = render(
            <TitleScreen onStartGame={onStartGame} />,
            { wrapper }
          );

          // Find the Continue Game button
          const buttons = Array.from(container.querySelectorAll('.menu-btn'));
          const continueButton = buttons.find(
            (btn) => btn.textContent === 'Continue Game'
          );

          expect(continueButton).toBeTruthy();

          // Click Continue Game button
          fireEvent.click(continueButton);

          // Verify onStartGame was called
          expect(onStartGame.mock.calls.length).toBe(1);

          // Verify the loaded state matches the saved state
          const loadedState = game2.getState();

          expect(loadedState.player.credits).toBe(credits);
          expect(loadedState.player.daysElapsed).toBe(daysElapsed);
          expect(loadedState.ship.fuel).toBe(fuel);

          // Clean up
          clearSave(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should load saved game with all cargo and ship state preserved', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            good: fc.constantFrom('grain', 'ore', 'tritium'),
            qty: fc.integer({ min: 1, max: 100 }),
            buyPrice: fc.integer({ min: 10, max: 1000 }),
            buySystem: fc.integer({ min: 1, max: 10 }),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        fc.record({
          hull: fc.integer({ min: 0, max: 100 }),
          engine: fc.integer({ min: 0, max: 100 }),
          lifeSupport: fc.integer({ min: 0, max: 100 }),
        }),
        (cargo, shipCondition) => {
          cleanup();

          // Clear any existing save first
          clearSave(true);

          // Create first game state manager and save a game
          const game1 = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          game1.initNewGame();

          // Modify game state with random cargo and ship condition
          const state1 = game1.getState();
          state1.ship.cargo = cargo;
          state1.ship.hull = shipCondition.hull;
          state1.ship.engine = shipCondition.engine;
          state1.ship.lifeSupport = shipCondition.lifeSupport;

          // Save the game
          game1.saveGame();

          // Verify save exists
          expect(game1.hasSavedGame()).toBe(true);

          // Create a new game state manager (simulating app reload)
          const game2 = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );

          const wrapper = createWrapper(game2);

          // Mock onStartGame callback that simulates loading the game
          const onStartGame = vi.fn((isNewGame) => {
            if (!isNewGame) {
              // Simulate loading the saved game
              game2.loadGame();
            }
          });

          // Render TitleScreen component
          const { container } = render(
            <TitleScreen onStartGame={onStartGame} />,
            { wrapper }
          );

          // Find the Continue Game button
          const buttons = Array.from(container.querySelectorAll('.menu-btn'));
          const continueButton = buttons.find(
            (btn) => btn.textContent === 'Continue Game'
          );

          expect(continueButton).toBeTruthy();

          // Click Continue Game button
          fireEvent.click(continueButton);

          // Verify the loaded state matches the saved state
          const loadedState = game2.getState();

          expect(loadedState).toBeTruthy();

          // Verify cargo is preserved
          expect(loadedState.ship.cargo.length).toBe(cargo.length);

          for (let i = 0; i < cargo.length; i++) {
            const loadedItem = loadedState.ship.cargo[i];
            const expectedItem = cargo[i];

            expect(loadedItem.good).toBe(expectedItem.good);
            expect(loadedItem.qty).toBe(expectedItem.qty);
            expect(loadedItem.buyPrice).toBe(expectedItem.buyPrice);
            expect(loadedItem.buySystem).toBe(expectedItem.buySystem);
            expect(loadedItem.buyDate).toBe(expectedItem.buyDate);
          }

          // Verify ship condition is preserved
          expect(loadedState.ship.hull).toBe(shipCondition.hull);
          expect(loadedState.ship.engine).toBe(shipCondition.engine);
          expect(loadedState.ship.lifeSupport).toBe(shipCondition.lifeSupport);

          // Clean up
          clearSave(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
