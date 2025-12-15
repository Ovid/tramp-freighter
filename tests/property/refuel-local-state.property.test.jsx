import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { RefuelPanel } from '../../src/features/refuel/RefuelPanel.jsx';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { createWrapper } from '../react-test-utils.jsx';

/**
 * Property 25: Refuel panel manages local state
 *
 * Validates that the RefuelPanel component manages slider value in local React state
 * and only updates game state when the refuel action is confirmed.
 *
 * React Migration Spec: Requirements 27.1, 27.2
 */
describe('Property 25: Refuel panel manages local state', () => {
  // Suppress React act() warnings for property tests
  let originalConsoleError;

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = (...args) => {
      const message = String(args[0] || '');
      if (
        message.includes('act(') ||
        message.includes('Warning: ReactDOM.render')
      ) {
        return;
      }
      originalConsoleError(...args);
    };
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('should maintain slider value in local state without affecting game state', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 50 }), // Random slider value
        (sliderValue) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Set up initial state
          gameStateManager.state.player.credits = 10000;
          gameStateManager.state.ship.fuel = 50;
          gameStateManager.state.player.currentSystem = 0; // Sol

          const initialFuel = gameStateManager.state.ship.fuel;
          const initialCredits = gameStateManager.state.player.credits;

          const wrapper = createWrapper(gameStateManager);

          // Render RefuelPanel
          const { container } = render(<RefuelPanel onClose={() => {}} />, {
            wrapper,
          });

          // Find the slider
          const slider = container.querySelector('#refuel-amount');
          expect(slider).toBeTruthy();

          // Change slider value
          fireEvent.change(slider, { target: { value: sliderValue } });

          // Verify slider value changed in UI
          expect(Number(slider.value)).toBe(sliderValue);

          // Verify game state has NOT changed (local state only)
          expect(gameStateManager.state.ship.fuel).toBe(initialFuel);
          expect(gameStateManager.state.player.credits).toBe(initialCredits);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update game state only when confirm button is clicked', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 20 }), // Random refuel amount
        (refuelAmount) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Set up initial state with enough credits
          gameStateManager.state.player.credits = 10000;
          gameStateManager.state.ship.fuel = 50;
          gameStateManager.state.player.currentSystem = 0; // Sol

          const initialFuel = gameStateManager.state.ship.fuel;
          const fuelPrice = gameStateManager.getFuelPrice(0);
          const expectedCost = refuelAmount * fuelPrice;

          const wrapper = createWrapper(gameStateManager);

          // Render RefuelPanel
          const { container } = render(<RefuelPanel onClose={() => {}} />, {
            wrapper,
          });

          // Find the slider and set value
          const slider = container.querySelector('#refuel-amount');
          fireEvent.change(slider, { target: { value: refuelAmount } });

          // Game state should not have changed yet
          expect(gameStateManager.state.ship.fuel).toBe(initialFuel);

          // Click confirm button
          const confirmButton = screen.getByText('Confirm Refuel');
          fireEvent.click(confirmButton);

          // Now game state should be updated
          expect(gameStateManager.state.ship.fuel).toBeCloseTo(
            initialFuel + refuelAmount,
            1
          );
          expect(gameStateManager.state.player.credits).toBeLessThan(10000);
          expect(gameStateManager.state.player.credits).toBeCloseTo(
            10000 - expectedCost,
            1
          );

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reset local state after successful refuel', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 20 }), // Random refuel amount
        (refuelAmount) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Set up initial state
          gameStateManager.state.player.credits = 10000;
          gameStateManager.state.ship.fuel = 50;
          gameStateManager.state.player.currentSystem = 0; // Sol

          const wrapper = createWrapper(gameStateManager);

          // Render RefuelPanel
          const { container } = render(<RefuelPanel onClose={() => {}} />, {
            wrapper,
          });

          // Set slider value
          const slider = container.querySelector('#refuel-amount');
          fireEvent.change(slider, { target: { value: refuelAmount } });

          // Verify slider has the value
          expect(Number(slider.value)).toBe(refuelAmount);

          // Click confirm button
          const confirmButton = screen.getByText('Confirm Refuel');
          fireEvent.click(confirmButton);

          // Slider should be reset to 0 after successful refuel
          expect(Number(slider.value)).toBe(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display real-time cost calculation based on local state', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }), // Random slider value
        (sliderValue) => {
          cleanup();

          const gameStateManager = new GameStateManager(
            STAR_DATA,
            WORMHOLE_DATA
          );
          gameStateManager.initNewGame();

          // Set up initial state
          gameStateManager.state.player.credits = 10000;
          gameStateManager.state.ship.fuel = 50;
          gameStateManager.state.player.currentSystem = 0; // Sol

          const fuelPrice = gameStateManager.getFuelPrice(0);
          const expectedCost = sliderValue * fuelPrice;

          const wrapper = createWrapper(gameStateManager);

          // Render RefuelPanel
          const { container } = render(<RefuelPanel onClose={() => {}} />, {
            wrapper,
          });

          // Change slider value
          const slider = container.querySelector('#refuel-amount');
          fireEvent.change(slider, { target: { value: sliderValue } });

          // Verify cost display updates
          const costDisplay = container.querySelector('.cost-value');
          expect(costDisplay).toBeTruthy();
          expect(costDisplay.textContent).toContain(expectedCost.toString());

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display validation messages based on local state', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Set up state with fuel at 100% (can't refuel more)
        gameStateManager.state.player.credits = 10000;
        gameStateManager.state.ship.fuel = 100;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const wrapper = createWrapper(gameStateManager);

        // Render RefuelPanel
        const { container } = render(<RefuelPanel onClose={() => {}} />, {
          wrapper,
        });

        // Slider should be at 0 because fuel is already full
        const slider = container.querySelector('#refuel-amount');
        expect(Number(slider.max)).toBe(0);
        expect(Number(slider.value)).toBe(0);

        // Should display info message about entering an amount
        const validationMessage = container.querySelector(
          '.validation-message.info'
        );
        expect(validationMessage).toBeTruthy();
        expect(validationMessage.textContent).toContain('Enter an amount');

        return true;
      }),
      { numRuns: 10 }
    );
  });

  it('should not update game state when validation fails', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        cleanup();

        const gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        gameStateManager.initNewGame();

        // Set up state with fuel at 100% (can't refuel)
        gameStateManager.state.player.credits = 10000;
        gameStateManager.state.ship.fuel = 100;
        gameStateManager.state.player.currentSystem = 0; // Sol

        const initialFuel = gameStateManager.state.ship.fuel;
        const initialCredits = gameStateManager.state.player.credits;

        const wrapper = createWrapper(gameStateManager);

        // Render RefuelPanel
        render(<RefuelPanel onClose={() => {}} />, {
          wrapper,
        });

        // Confirm button should be disabled (amount is 0)
        const confirmButton = screen.getByText('Confirm Refuel');
        expect(confirmButton.disabled).toBe(true);

        // Try to click (should not work because button is disabled)
        fireEvent.click(confirmButton);

        // Game state should not have changed
        expect(gameStateManager.state.ship.fuel).toBe(initialFuel);
        expect(gameStateManager.state.player.credits).toBe(initialCredits);

        return true;
      }),
      { numRuns: 10 }
    );
  });
});
