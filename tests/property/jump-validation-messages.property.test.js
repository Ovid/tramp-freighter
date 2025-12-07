import { describe, it, expect, beforeEach } from 'vitest';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { GameStateManager } from '../../js/game-state.js';
import { NavigationSystem } from '../../js/game-navigation.js';

/**
 * Property-based tests for jump validation messages
 *
 * Verifies that users receive clear feedback when jumping
 * is not possible due to fuel or connection constraints.
 */
describe('Jump Validation Messages', () => {
  let gameStateManager;
  let navSystem;

  beforeEach(() => {
    gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    gameStateManager.initNewGame();
    navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
  });

  it('should provide error message for insufficient fuel', () => {
    const state = gameStateManager.getState();
    const currentSystemId = state.player.currentSystem;

    // Set low fuel
    gameStateManager.updateFuel(5);

    // Find a connected system
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);
    expect(connectedIds.length).toBeGreaterThan(0);

    const targetSystemId = connectedIds[0];

    // Validate jump
    const validation = navSystem.validateJump(
      currentSystemId,
      targetSystemId,
      5
    );

    // Should fail with specific error message
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('Insufficient fuel');
  });

  it('should provide error message for no wormhole connection', () => {
    const state = gameStateManager.getState();
    const currentSystemId = state.player.currentSystem;

    // Find a system that's NOT connected
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);
    const unconnectedSystem = TEST_STAR_DATA.find(
      (s) => s.id !== currentSystemId && !connectedIds.includes(s.id)
    );

    if (unconnectedSystem) {
      // Validate jump to unconnected system
      const validation = navSystem.validateJump(
        currentSystemId,
        unconnectedSystem.id,
        100
      );

      // Should fail with specific error message
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('No wormhole connection');
    }
  });

  it('should not provide error message when jump is valid', () => {
    const state = gameStateManager.getState();
    const currentSystemId = state.player.currentSystem;

    // Ensure full fuel
    gameStateManager.updateFuel(100);

    // Find a connected system
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);
    expect(connectedIds.length).toBeGreaterThan(0);

    const targetSystemId = connectedIds[0];

    // Validate jump
    const validation = navSystem.validateJump(
      currentSystemId,
      targetSystemId,
      100
    );

    // Should succeed with no error
    expect(validation.valid).toBe(true);
    expect(validation.error).toBeNull();
  });

  it('should provide consistent error messages across multiple systems', () => {
    const state = gameStateManager.getState();
    const currentSystemId = state.player.currentSystem;

    // Set low fuel
    gameStateManager.updateFuel(5);

    // Get all connected systems
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);

    // Validate jumps to all connected systems
    const validations = connectedIds.map((targetId) =>
      navSystem.validateJump(currentSystemId, targetId, 5)
    );

    // All should fail with same error message
    validations.forEach((validation) => {
      if (!validation.valid) {
        expect(validation.error).toContain('Insufficient fuel');
      }
    });
  });

  it('should calculate correct fuel requirements in error context', () => {
    const state = gameStateManager.getState();
    const currentSystemId = state.player.currentSystem;

    // Find a connected system
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);
    const targetSystemId = connectedIds[0];

    // Get the actual fuel cost
    const currentStar = TEST_STAR_DATA.find((s) => s.id === currentSystemId);
    const targetStar = TEST_STAR_DATA.find((s) => s.id === targetSystemId);
    const distance = navSystem.calculateDistanceBetween(
      currentStar,
      targetStar
    );
    const fuelCost = navSystem.calculateFuelCost(distance);

    // Set fuel just below requirement
    const insufficientFuel = fuelCost - 1;
    gameStateManager.updateFuel(insufficientFuel);

    // Validate jump
    const validation = navSystem.validateJump(
      currentSystemId,
      targetSystemId,
      insufficientFuel
    );

    // Should fail
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('Insufficient fuel');

    // Fuel cost should be accurate
    expect(validation.fuelCost).toBeCloseTo(fuelCost, 2);
  });

  it('should handle edge case of exactly enough fuel', () => {
    const state = gameStateManager.getState();
    const currentSystemId = state.player.currentSystem;

    // Find a connected system
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);
    const targetSystemId = connectedIds[0];

    // Get the exact fuel cost
    const currentStar = TEST_STAR_DATA.find((s) => s.id === currentSystemId);
    const targetStar = TEST_STAR_DATA.find((s) => s.id === targetSystemId);
    const distance = navSystem.calculateDistanceBetween(
      currentStar,
      targetStar
    );
    const fuelCost = navSystem.calculateFuelCost(distance);

    // Set fuel to exactly the requirement
    gameStateManager.updateFuel(fuelCost);

    // Validate jump
    const validation = navSystem.validateJump(
      currentSystemId,
      targetSystemId,
      fuelCost
    );

    // Should succeed
    expect(validation.valid).toBe(true);
    expect(validation.error).toBeNull();
  });
});
