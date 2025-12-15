import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { GameStateManager } from '../../js/state/game-state-manager.js';

/**
 * Property-based tests for refuel max calculation
 *
 * Verifies that the "Max" refuel button correctly handles fractional
 * fuel values and doesn't exceed capacity constraints.
 */
describe('Refuel Max Calculation', () => {
  it('Property: For any fractional fuel value, max refuel calculation does not exceed 100% capacity', () => {
    // Generator for fractional fuel values
    const fractionalFuelGen = fc.float({
      min: Math.fround(0.1),
      max: Math.fround(99.9),
      noNaN: true,
    });

    fc.assert(
      fc.property(fractionalFuelGen, (currentFuel) => {
        const gameStateManager = new GameStateManager(
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA
        );
        gameStateManager.initNewGame();
        gameStateManager.updateFuel(currentFuel);

        const state = gameStateManager.getState();
        const fuelPrice = gameStateManager.getFuelPrice(
          state.player.currentSystem
        );
        const credits = state.player.credits;

        // Calculate max capacity (what the UI should calculate)
        const maxCapacity = Math.floor(100 - currentFuel);

        // Calculate max affordable
        const maxAffordable = Math.floor(credits / fuelPrice);

        // Max should be the smaller of the two
        const maxAmount = Math.min(maxAffordable, maxCapacity);

        // Only test validation if amount is positive
        if (maxAmount > 0) {
          // Verify this amount is valid
          const validation = gameStateManager.validateRefuel(
            currentFuel,
            maxAmount,
            credits,
            fuelPrice
          );

          expect(validation.valid).toBe(true);

          // Verify it doesn't exceed capacity
          expect(currentFuel + maxAmount).toBeLessThanOrEqual(100);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property: For any fractional fuel value, refueling to exactly 100% is valid', () => {
    const fractionalFuelGen = fc.float({
      min: Math.fround(0.1),
      max: Math.fround(99.9),
      noNaN: true,
    });

    fc.assert(
      fc.property(fractionalFuelGen, (currentFuel) => {
        const gameStateManager = new GameStateManager(
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA
        );
        gameStateManager.initNewGame();
        gameStateManager.updateFuel(currentFuel);

        const state = gameStateManager.getState();
        const credits = state.player.credits;
        const fuelPrice = gameStateManager.getFuelPrice(
          state.player.currentSystem
        );

        // Try to refuel to exactly 100%
        const amountToFull = 100 - currentFuel;

        // Should accept the exact amount
        const validation = gameStateManager.validateRefuel(
          currentFuel,
          amountToFull,
          credits,
          fuelPrice
        );

        expect(validation.valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Property: For any fractional fuel value, refueling beyond 100% is invalid', () => {
    const fractionalFuelGen = fc.float({
      min: Math.fround(0.1),
      max: Math.fround(99.9),
      noNaN: true,
    });

    fc.assert(
      fc.property(fractionalFuelGen, (currentFuel) => {
        const gameStateManager = new GameStateManager(
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA
        );
        gameStateManager.initNewGame();
        gameStateManager.updateFuel(currentFuel);

        const state = gameStateManager.getState();
        const credits = state.player.credits;
        const fuelPrice = gameStateManager.getFuelPrice(
          state.player.currentSystem
        );

        // Try to refuel beyond 100%
        const amountToFull = 100 - currentFuel;
        const excessAmount = amountToFull + 1;

        // Should reject amount that exceeds capacity
        const validation = gameStateManager.validateRefuel(
          currentFuel,
          excessAmount,
          credits,
          fuelPrice
        );

        expect(validation.valid).toBe(false);
        expect(validation.reason).toContain('beyond 100% capacity');
      }),
      { numRuns: 100 }
    );
  });

  it('Property: For any nearly full tank, max capacity is 0', () => {
    const nearlyFullGen = fc.float({
      min: Math.fround(99.01),
      max: Math.fround(99.99),
      noNaN: true,
    });

    fc.assert(
      fc.property(nearlyFullGen, (currentFuel) => {
        const gameStateManager = new GameStateManager(
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA
        );
        gameStateManager.initNewGame();
        gameStateManager.updateFuel(currentFuel);

        const state = gameStateManager.getState();
        const fuelPrice = gameStateManager.getFuelPrice(
          state.player.currentSystem
        );
        const credits = state.player.credits;

        // Calculate max capacity
        const maxCapacity = Math.floor(100 - currentFuel);

        // Should be 0 since floor of < 1 is 0
        expect(maxCapacity).toBe(0);

        // Validation with 0 should fail (amount must be positive)
        const validation = gameStateManager.validateRefuel(
          currentFuel,
          0,
          credits,
          fuelPrice
        );

        expect(validation.valid).toBe(false);
        expect(validation.reason).toContain('must be positive');
      }),
      { numRuns: 50 }
    );
  });

  it('Property: For any fractional fuel value, max calculation maintains consistency with validation', () => {
    const fractionalFuelGen = fc.float({
      min: Math.fround(0.1),
      max: Math.fround(98.9),
      noNaN: true,
    });

    fc.assert(
      fc.property(fractionalFuelGen, (currentFuel) => {
        const gameStateManager = new GameStateManager(
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA
        );
        gameStateManager.initNewGame();
        gameStateManager.updateFuel(currentFuel);

        const state = gameStateManager.getState();
        const fuelPrice = gameStateManager.getFuelPrice(
          state.player.currentSystem
        );
        const credits = state.player.credits;

        // Calculate max as UI would
        const maxCapacity = Math.floor(100 - currentFuel);
        const maxAffordable = Math.floor(credits / fuelPrice);
        const maxAmount = Math.min(maxAffordable, maxCapacity);

        // Only test if amount is positive
        if (maxAmount > 0) {
          // Validation should always pass for calculated max
          const validation = gameStateManager.validateRefuel(
            currentFuel,
            maxAmount,
            credits,
            fuelPrice
          );

          expect(validation.valid).toBe(true);

          // Refuel should succeed
          const result = gameStateManager.refuel(maxAmount);
          expect(result.success).toBe(true);

          // Final fuel should not exceed 100%
          const finalState = gameStateManager.getState();
          expect(finalState.ship.fuel).toBeLessThanOrEqual(100);
        }
      }),
      { numRuns: 100 }
    );
  });
});
