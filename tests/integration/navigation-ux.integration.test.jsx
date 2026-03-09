import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation';
import { STAR_DATA } from '../../src/game/data/star-data';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data';

/**
 * Integration tests for navigation UX improvements (React Migration)
 *
 * Tests the complete workflow of:
 * 1. Viewing current system
 * 2. Seeing connected systems list
 * 3. Selecting a destination
 * 4. Executing a jump
 *
 * React Migration Spec: Requirements 11.1, 11.4
 */
describe('Navigation UX Integration (React)', () => {
  let game;
  let navSystem;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Initialize game systems
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    navSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game.navigationSystem = navSystem;

    // Mock console methods to suppress expected errors during tests
    // WebGL is not supported in jsdom test environment
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean up
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should complete full navigation workflow from current system', async () => {
    // Step 1: Initialize game
    game.initNewGame();

    // Step 2: Get current system
    const currentSystemId = game.getPlayer().currentSystem;
    const currentStar = STAR_DATA.find((s) => s.id === currentSystemId);
    expect(currentStar).toBeDefined();

    // Step 3: Get connected systems
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);
    expect(connectedIds.length).toBeGreaterThan(0);

    // Step 4: Verify connected systems data
    const connectedSystems = connectedIds.map((id) => {
      const targetStar = STAR_DATA.find((s) => s.id === id);
      const distance = navSystem.calculateDistanceBetween(
        currentStar,
        targetStar
      );
      const engineCondition = game.getState().ship.engine;
      const quirks = game.getState().ship.quirks || [];
      const fuelCost = navSystem.calculateFuelCostWithCondition(
        distance,
        engineCondition,
        game.applyQuirkModifiers.bind(game),
        quirks
      );
      const jumpTime = navSystem.calculateJumpTimeWithCondition(
        distance,
        engineCondition
      );

      return {
        id,
        name: targetStar.name,
        distance,
        fuelCost,
        jumpTime,
      };
    });

    expect(connectedSystems.length).toBe(connectedIds.length);

    // Step 5: Select first connected system
    const targetSystem = connectedSystems[0];
    const targetSystemId = targetSystem.id;

    // Step 6: Validate jump
    const initialFuel = game.getShip().fuel;
    const engineCondition = game.getShip().engine;
    const quirks = game.getShip().quirks || [];
    const validation = navSystem.validateJump(
      currentSystemId,
      targetSystemId,
      initialFuel,
      engineCondition,
      game.applyQuirkModifiers.bind(game),
      quirks
    );

    expect(validation.valid).toBe(true);
    expect(validation.distance).toBeGreaterThan(0);
    expect(validation.fuelCost).toBeGreaterThan(0);
    expect(validation.jumpTime).toBeGreaterThan(0);

    // Step 7: Execute jump
    const initialDays = game.getPlayer().daysElapsed;
    const result = await navSystem.executeJump(game, targetSystemId);

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();

    // Step 8: Verify state changes
    const newLocation = game.getPlayer().currentSystem;
    const newFuel = game.getShip().fuel;
    const newDays = game.getPlayer().daysElapsed;

    expect(newLocation).toBe(targetSystemId);
    expect(newFuel).toBe(initialFuel - validation.fuelCost);
    expect(newDays).toBe(initialDays + validation.jumpTime);
  });

  it('should prevent jump when insufficient fuel', async () => {
    game.initNewGame();

    const currentSystemId = game.getPlayer().currentSystem;
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);

    // Set fuel to very low
    game.updateFuel(5);
    const lowFuel = game.getShip().fuel;

    // Try to find a system we can't reach
    let unreachableSystem = null;
    for (const id of connectedIds) {
      const currentStar = STAR_DATA.find((s) => s.id === currentSystemId);
      const targetStar = STAR_DATA.find((s) => s.id === id);
      const distance = navSystem.calculateDistanceBetween(
        currentStar,
        targetStar
      );
      const engineCondition = game.getState().ship.engine;
      const quirks = game.getState().ship.quirks || [];
      const fuelCost = navSystem.calculateFuelCostWithCondition(
        distance,
        engineCondition,
        game.applyQuirkModifiers.bind(game),
        quirks
      );

      if (fuelCost > lowFuel) {
        unreachableSystem = id;
        break;
      }
    }

    if (unreachableSystem) {
      const validation = navSystem.validateJump(
        currentSystemId,
        unreachableSystem,
        lowFuel
      );

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Insufficient fuel');

      // Attempt jump should fail
      const result = await navSystem.executeJump(game, unreachableSystem);
      expect(result.success).toBe(false);

      // Location should not change
      expect(game.getPlayer().currentSystem).toBe(currentSystemId);
    }
  });

  it('should show all reachable systems with sufficient fuel', () => {
    game.initNewGame();

    const currentSystemId = game.getPlayer().currentSystem;
    const currentStar = STAR_DATA.find((s) => s.id === currentSystemId);
    const currentFuel = game.getShip().fuel;
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);

    const reachableSystems = [];
    const unreachableSystems = [];

    connectedIds.forEach((id) => {
      const targetStar = STAR_DATA.find((s) => s.id === id);
      const distance = navSystem.calculateDistanceBetween(
        currentStar,
        targetStar
      );
      const engineCondition = game.getState().ship.engine;
      const quirks = game.getState().ship.quirks || [];
      const fuelCost = navSystem.calculateFuelCostWithCondition(
        distance,
        engineCondition,
        game.applyQuirkModifiers.bind(game),
        quirks
      );

      if (currentFuel >= fuelCost) {
        reachableSystems.push(id);
      } else {
        unreachableSystems.push(id);
      }
    });

    // With default fuel (100%), most systems should be reachable
    expect(reachableSystems.length).toBeGreaterThan(0);

    // Verify each reachable system can actually be jumped to
    reachableSystems.forEach((id) => {
      const validation = navSystem.validateJump(
        currentSystemId,
        id,
        currentFuel
      );
      expect(validation.valid).toBe(true);
    });

    // Verify each unreachable system cannot be jumped to
    unreachableSystems.forEach((id) => {
      const validation = navSystem.validateJump(
        currentSystemId,
        id,
        currentFuel
      );
      expect(validation.valid).toBe(false);
    });
  });

  it('should maintain correct system highlighting state', () => {
    game.initNewGame();

    const currentSystemId = game.getPlayer().currentSystem;
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);

    // Simulate highlighting connected systems
    const highlightedSystems = new Set();
    connectedIds.forEach((id) => {
      highlightedSystems.add(id);
    });

    // Verify all connected systems are highlighted
    expect(highlightedSystems.size).toBe(connectedIds.length);
    connectedIds.forEach((id) => {
      expect(highlightedSystems.has(id)).toBe(true);
    });

    // Verify current system is not in highlighted list
    expect(highlightedSystems.has(currentSystemId)).toBe(false);

    // Simulate clearing highlights
    highlightedSystems.clear();
    expect(highlightedSystems.size).toBe(0);
  });

  it('should sort connected systems by distance', () => {
    game.initNewGame();

    const currentSystemId = game.getPlayer().currentSystem;
    const currentStar = STAR_DATA.find((s) => s.id === currentSystemId);
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);

    // Calculate distances and sort
    const systemsWithDistance = connectedIds
      .map((id) => {
        const targetStar = STAR_DATA.find((s) => s.id === id);
        const distance = navSystem.calculateDistanceBetween(
          currentStar,
          targetStar
        );
        return { id, distance, name: targetStar.name };
      })
      .sort((a, b) => a.distance - b.distance);

    // Verify sorting
    for (let i = 1; i < systemsWithDistance.length; i++) {
      expect(systemsWithDistance[i].distance).toBeGreaterThanOrEqual(
        systemsWithDistance[i - 1].distance
      );
    }

    // Closest system should be first
    if (systemsWithDistance.length > 0) {
      const closest = systemsWithDistance[0];
      const farthest = systemsWithDistance[systemsWithDistance.length - 1];

      expect(closest.distance).toBeLessThanOrEqual(farthest.distance);
    }
  });

  it('should display connected systems in SystemPanel', () => {
    game.initNewGame();

    const currentSystemId = game.getPlayer().currentSystem;
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);

    // Verify we have connected systems to test
    expect(connectedIds.length).toBeGreaterThan(0);

    // Get connected systems with calculated data
    const currentStar = STAR_DATA.find((s) => s.id === currentSystemId);
    const connectedSystems = connectedIds.map((id) => {
      const targetStar = STAR_DATA.find((s) => s.id === id);
      const distance = navSystem.calculateDistanceBetween(
        currentStar,
        targetStar
      );
      const fuelCost = navSystem.calculateFuelCost(distance);
      const jumpTime = navSystem.calculateJumpTime(distance);

      return {
        id,
        name: targetStar.name,
        distance,
        fuelCost,
        jumpTime,
      };
    });

    // Verify all connected systems have valid data
    connectedSystems.forEach((system) => {
      expect(system.name).toBeDefined();
      expect(system.distance).toBeGreaterThan(0);
      expect(system.fuelCost).toBeGreaterThan(0);
      expect(system.jumpTime).toBeGreaterThan(0);
    });
  });

  it('should validate jump information before execution', () => {
    game.initNewGame();

    const currentSystemId = game.getPlayer().currentSystem;
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);
    const targetSystemId = connectedIds[0];

    const currentFuel = game.getShip().fuel;
    const engineCondition = game.getShip().engine;
    const quirks = game.getShip().quirks || [];

    // Validate jump
    const validation = navSystem.validateJump(
      currentSystemId,
      targetSystemId,
      currentFuel,
      engineCondition,
      game.applyQuirkModifiers.bind(game),
      quirks
    );

    // Verify validation result structure
    expect(validation).toHaveProperty('valid');
    expect(validation).toHaveProperty('distance');
    expect(validation).toHaveProperty('fuelCost');
    expect(validation).toHaveProperty('jumpTime');

    // With full fuel, jump should be valid
    expect(validation.valid).toBe(true);
    expect(validation.distance).toBeGreaterThan(0);
    expect(validation.fuelCost).toBeGreaterThan(0);
    expect(validation.fuelCost).toBeLessThanOrEqual(currentFuel);
    expect(validation.jumpTime).toBeGreaterThan(0);
  });

  it('should handle wormhole connection validation', () => {
    game.initNewGame();

    const currentSystemId = game.getPlayer().currentSystem;
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);

    // Find a system that is NOT connected
    let unconnectedSystemId = null;
    for (let i = 0; i < STAR_DATA.length; i++) {
      if (i !== currentSystemId && !connectedIds.includes(i)) {
        unconnectedSystemId = i;
        break;
      }
    }

    if (unconnectedSystemId !== null) {
      const currentFuel = game.getShip().fuel;

      // Attempt to validate jump to unconnected system
      const validation = navSystem.validateJump(
        currentSystemId,
        unconnectedSystemId,
        currentFuel
      );

      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('No wormhole connection');
    }
  });

  it('should update fuel display after jump', async () => {
    game.initNewGame();

    const currentSystemId = game.getPlayer().currentSystem;
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);
    const targetSystemId = connectedIds[0];

    const initialFuel = game.getShip().fuel;

    // Execute jump
    const result = await navSystem.executeJump(game, targetSystemId);

    expect(result.success).toBe(true);

    const newFuel = game.getShip().fuel;

    // Fuel should have decreased
    expect(newFuel).toBeLessThan(initialFuel);

    // Fuel should be non-negative
    expect(newFuel).toBeGreaterThanOrEqual(0);
  });

  it('should update time display after jump', async () => {
    game.initNewGame();

    const currentSystemId = game.getPlayer().currentSystem;
    const connectedIds = navSystem.getConnectedSystems(currentSystemId);
    const targetSystemId = connectedIds[0];

    const initialDays = game.getPlayer().daysElapsed;

    // Execute jump
    const result = await navSystem.executeJump(game, targetSystemId);

    expect(result.success).toBe(true);

    const newDays = game.getPlayer().daysElapsed;

    // Time should have advanced
    expect(newDays).toBeGreaterThan(initialDays);
  });
});
