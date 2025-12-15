import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
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

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Modify game state to create a unique save
        const state = gameStateManager.getState();
        state.player.credits = 5000; // Set specific credits value
        state.player.daysElapsed = 10; // Set specific days elapsed

        // Save the game
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

        // Find the Continue Game button
        const buttons = Array.from(container.querySelectorAll('.menu-btn'));
        const continueButton = buttons.find(
          (btn) => btn.textContent === 'Continue Game'
        );

        if (!continueButton) {
          console.error('Continue Game button not found when save exists');
          clearSave(true);
          return false;
        }

        // Click Continue Game button
        fireEvent.click(continueButton);

        // Verify onStartGame was called with false (load existing game)
        if (onStartGame.mock.calls.length !== 1) {
          console.error(
            'onStartGame not called once:',
            onStartGame.mock.calls.length
          );
          clearSave(true);
          return false;
        }

        if (onStartGame.mock.calls[0][0] !== false) {
          console.error(
            'onStartGame not called with false (continue game):',
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
          const gameStateManager1 = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager1.initNewGame();

          // Modify game state with random values
          const state1 = gameStateManager1.getState();
          state1.player.credits = credits;
          state1.player.daysElapsed = daysElapsed;
          state1.ship.fuel = fuel;

          // Save the game
          gameStateManager1.saveGame();

          // Verify save exists
          expect(gameStateManager1.hasSavedGame()).toBe(true);

          // Create a new game state manager (simulating app reload)
          const gameStateManager2 = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );

          // Verify the new manager can detect the save
          expect(gameStateManager2.hasSavedGame()).toBe(true);

          const wrapper = createWrapper(gameStateManager2);

          // Mock onStartGame callback that simulates loading the game
          const onStartGame = vi.fn((isNewGame) => {
            if (!isNewGame) {
              // Simulate loading the saved game
              gameStateManager2.loadGame();
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

          if (!continueButton) {
            console.error('Continue Game button not found when save exists');
            clearSave(true);
            return false;
          }

          // Click Continue Game button
          fireEvent.click(continueButton);

          // Verify onStartGame was called
          if (onStartGame.mock.calls.length !== 1) {
            console.error(
              'onStartGame not called once:',
              onStartGame.mock.calls.length
            );
            clearSave(true);
            return false;
          }

          // Verify the loaded state matches the saved state
          const loadedState = gameStateManager2.getState();

          if (loadedState.player.credits !== credits) {
            console.error(
              'Credits not preserved:',
              loadedState.player.credits,
              'expected:',
              credits
            );
            clearSave(true);
            return false;
          }

          if (loadedState.player.daysElapsed !== daysElapsed) {
            console.error(
              'Days elapsed not preserved:',
              loadedState.player.daysElapsed,
              'expected:',
              daysElapsed
            );
            clearSave(true);
            return false;
          }

          if (loadedState.ship.fuel !== fuel) {
            console.error(
              'Fuel not preserved:',
              loadedState.ship.fuel,
              'expected:',
              fuel
            );
            clearSave(true);
            return false;
          }

          // Clean up
          clearSave(true);

          return true;
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
          const gameStateManager1 = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager1.initNewGame();

          // Modify game state with random cargo and ship condition
          const state1 = gameStateManager1.getState();
          state1.ship.cargo = cargo;
          state1.ship.hull = shipCondition.hull;
          state1.ship.engine = shipCondition.engine;
          state1.ship.lifeSupport = shipCondition.lifeSupport;

          // Save the game
          gameStateManager1.saveGame();

          // Verify save exists
          expect(gameStateManager1.hasSavedGame()).toBe(true);

          // Create a new game state manager (simulating app reload)
          const gameStateManager2 = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );

          const wrapper = createWrapper(gameStateManager2);

          // Mock onStartGame callback that simulates loading the game
          const onStartGame = vi.fn((isNewGame) => {
            if (!isNewGame) {
              // Simulate loading the saved game
              gameStateManager2.loadGame();
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

          if (!continueButton) {
            console.error('Continue Game button not found when save exists');
            clearSave(true);
            return false;
          }

          // Click Continue Game button
          fireEvent.click(continueButton);

          // Verify the loaded state matches the saved state
          const loadedState = gameStateManager2.getState();

          // Check if loadGame failed
          if (!loadedState) {
            console.error('loadGame returned null');
            clearSave(true);
            return false;
          }

          // Verify cargo is preserved
          if (loadedState.ship.cargo.length !== cargo.length) {
            console.error(
              'Cargo length not preserved:',
              loadedState.ship.cargo.length,
              'expected:',
              cargo.length
            );
            clearSave(true);
            return false;
          }

          for (let i = 0; i < cargo.length; i++) {
            const loadedItem = loadedState.ship.cargo[i];
            const expectedItem = cargo[i];

            if (
              loadedItem.good !== expectedItem.good ||
              loadedItem.qty !== expectedItem.qty ||
              loadedItem.buyPrice !== expectedItem.buyPrice ||
              loadedItem.buySystem !== expectedItem.buySystem ||
              loadedItem.buyDate !== expectedItem.buyDate
            ) {
              console.error(
                'Cargo item not preserved:',
                loadedItem,
                'expected:',
                expectedItem
              );
              clearSave(true);
              return false;
            }
          }

          // Verify ship condition is preserved
          if (loadedState.ship.hull !== shipCondition.hull) {
            console.error(
              'Hull condition not preserved:',
              loadedState.ship.hull,
              'expected:',
              shipCondition.hull
            );
            clearSave(true);
            return false;
          }

          if (loadedState.ship.engine !== shipCondition.engine) {
            console.error(
              'Engine condition not preserved:',
              loadedState.ship.engine,
              'expected:',
              shipCondition.engine
            );
            clearSave(true);
            return false;
          }

          if (loadedState.ship.lifeSupport !== shipCondition.lifeSupport) {
            console.error(
              'Life support condition not preserved:',
              loadedState.ship.lifeSupport,
              'expected:',
              shipCondition.lifeSupport
            );
            clearSave(true);
            return false;
          }

          // Clean up
          clearSave(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
