import { describe, it, expect, beforeEach } from 'vitest';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { GameStateManager } from '../../js/game-state.js';

/**
 * Property-based tests for refuel max calculation
 *
 * Verifies that the "Max" refuel button correctly handles fractional
 * fuel values and doesn't exceed capacity constraints.
 */
describe('Refuel Max Calculation', () => {
  let gameStateManager;

  beforeEach(() => {
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  it('should calculate max refuel amount without exceeding 100% capacity', () => {
    // Test with various fractional fuel values
    const testCases = [
      { currentFuel: 57.1, expectedMax: 42 },
      { currentFuel: 57.9, expectedMax: 42 },
      { currentFuel: 50.5, expectedMax: 49 },
      { currentFuel: 25.7, expectedMax: 74 },
      { currentFuel: 0.1, expectedMax: 99 },
    ];

    testCases.forEach(({ currentFuel, expectedMax }) => {
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

      expect(maxAmount).toBe(expectedMax);

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
    });
  });

  it('should handle refuel validation with fractional fuel values', () => {
    // Set fractional fuel
    gameStateManager.updateFuel(57.3);

    const state = gameStateManager.getState();
    const currentFuel = state.ship.fuel;
    const credits = state.player.credits;
    const fuelPrice = gameStateManager.getFuelPrice(state.player.currentSystem);

    // Try to refuel to exactly 100%
    const amountToFull = 100 - currentFuel; // 42.7

    // Should accept the exact amount
    const validation1 = gameStateManager.validateRefuel(
      currentFuel,
      amountToFull,
      credits,
      fuelPrice
    );

    expect(validation1.valid).toBe(true);

    // Should reject amount that exceeds capacity
    const validation2 = gameStateManager.validateRefuel(
      currentFuel,
      amountToFull + 1,
      credits,
      fuelPrice
    );

    expect(validation2.valid).toBe(false);
    expect(validation2.reason).toContain('beyond 100% capacity');
  });

  it('should successfully refuel with max amount calculated from fractional fuel', () => {
    // Set fractional fuel
    const initialFuel = 57.8;
    gameStateManager.updateFuel(initialFuel);

    const state = gameStateManager.getState();
    const fuelPrice = gameStateManager.getFuelPrice(state.player.currentSystem);
    const initialCredits = state.player.credits;

    // Calculate max amount (as UI would)
    const maxAmount = Math.floor(100 - initialFuel); // 42

    // Execute refuel
    const result = gameStateManager.refuel(maxAmount);

    expect(result.success).toBe(true);

    // Verify fuel increased correctly
    const newState = gameStateManager.getState();
    expect(newState.ship.fuel).toBeCloseTo(initialFuel + maxAmount, 2);
    expect(newState.ship.fuel).toBeLessThanOrEqual(100);

    // Verify credits decreased correctly
    const expectedCost = maxAmount * fuelPrice;
    expect(newState.player.credits).toBe(initialCredits - expectedCost);
  });

  it('should limit max refuel by available credits when credits are low', () => {
    // Set low credits
    gameStateManager.updateCredits(50);
    gameStateManager.updateFuel(20.5);

    const state = gameStateManager.getState();
    const currentFuel = state.ship.fuel;
    const credits = state.player.credits;
    const fuelPrice = gameStateManager.getFuelPrice(state.player.currentSystem);

    // Calculate max affordable
    const maxAffordable = Math.floor(credits / fuelPrice);

    // Calculate max capacity
    const maxCapacity = Math.floor(100 - currentFuel);

    // Max should be limited by credits
    const maxAmount = Math.min(maxAffordable, maxCapacity);

    expect(maxAmount).toBe(maxAffordable);
    expect(maxAmount).toBeLessThan(maxCapacity);

    // Verify this amount is valid
    const validation = gameStateManager.validateRefuel(
      currentFuel,
      maxAmount,
      credits,
      fuelPrice
    );

    expect(validation.valid).toBe(true);

    // Verify one more unit would be invalid (insufficient credits)
    const validation2 = gameStateManager.validateRefuel(
      currentFuel,
      maxAmount + 1,
      credits,
      fuelPrice
    );

    expect(validation2.valid).toBe(false);
    expect(validation2.reason).toContain('Insufficient credits');
  });

  it('should handle edge case of nearly full tank with fractional fuel', () => {
    // Set fuel very close to 100%
    const testCases = [99.1, 99.5, 99.9, 99.01, 99.99];

    testCases.forEach((currentFuel) => {
      gameStateManager.updateFuel(currentFuel);

      const state = gameStateManager.getState();
      const fuelPrice = gameStateManager.getFuelPrice(
        state.player.currentSystem
      );
      const credits = state.player.credits;

      // Calculate max capacity
      const maxCapacity = Math.floor(100 - currentFuel);

      // Should be 0 for all cases since floor of < 1 is 0
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
    });
  });

  it('should handle floating point precision in capacity check', () => {
    // Test edge case where floating point math might cause issues
    gameStateManager.updateFuel(57.123456789);

    const state = gameStateManager.getState();
    const currentFuel = state.ship.fuel;
    const credits = state.player.credits;
    const fuelPrice = gameStateManager.getFuelPrice(state.player.currentSystem);

    // Calculate safe max amount
    const maxAmount = Math.floor(100 - currentFuel);

    // This should always be valid due to floor operation
    const validation = gameStateManager.validateRefuel(
      currentFuel,
      maxAmount,
      credits,
      fuelPrice
    );

    expect(validation.valid).toBe(true);

    // Verify final fuel doesn't exceed 100%
    expect(currentFuel + maxAmount).toBeLessThanOrEqual(100);
  });

  it('should maintain consistency between max calculation and validation', () => {
    // Test multiple random fractional fuel values
    const randomFuelValues = [
      12.34, 23.45, 34.56, 45.67, 56.78, 67.89, 78.9, 89.01,
    ];

    randomFuelValues.forEach((currentFuel) => {
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
    });
  });
});
