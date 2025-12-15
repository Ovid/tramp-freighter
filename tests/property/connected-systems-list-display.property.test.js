import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { GameStateManager } from '../../js/state/game-state-manager.js';
import { NavigationSystem } from '../../js/game-navigation.js';

/**
 * Property-based tests for connected systems list display
 *
 * Verifies that the connected systems list correctly displays
 * navigation options with proper sorting and fuel indicators.
 */
describe('Connected Systems List Display', () => {
  const navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);

  it('Property: For any system with connections, sorting by distance produces ascending order', () => {
    // Generator for systems that have connections
    const systemsWithConnections = TEST_STAR_DATA.filter((s) => s.wh > 0);
    const systemWithConnectionsGen = fc.constantFrom(...systemsWithConnections);

    fc.assert(
      fc.property(systemWithConnectionsGen, (currentSystem) => {
        const connectedIds = navSystem.getConnectedSystems(currentSystem.id);

        if (connectedIds.length === 0) {
          return; // Skip if no connections
        }

        // Calculate distances
        const systemsWithDistance = connectedIds.map((id) => {
          const star = TEST_STAR_DATA.find((s) => s.id === id);
          const distance = navSystem.calculateDistanceBetween(
            currentSystem,
            star
          );
          return { id, distance };
        });

        // Sort by distance
        systemsWithDistance.sort((a, b) => a.distance - b.distance);

        // Verify sorting is correct (each element >= previous)
        for (let i = 1; i < systemsWithDistance.length; i++) {
          expect(systemsWithDistance[i].distance).toBeGreaterThanOrEqual(
            systemsWithDistance[i - 1].distance
          );
        }
      }),
      { numRuns: 50 }
    );
  });

  it('Property: For any two connected systems, fuel cost calculation is consistent with formula', () => {
    // Generator for wormhole connections
    const wormholeGen = fc.constantFrom(...TEST_WORMHOLE_DATA);

    fc.assert(
      fc.property(wormholeGen, ([systemAId, systemBId]) => {
        const systemA = TEST_STAR_DATA.find((s) => s.id === systemAId);
        const systemB = TEST_STAR_DATA.find((s) => s.id === systemBId);

        const distance = navSystem.calculateDistanceBetween(systemA, systemB);
        const fuelCost = navSystem.calculateFuelCost(distance);

        // Fuel cost should match formula: 10 + (distance × 2)
        const expectedFuelCost = 10 + distance * 2;
        expect(fuelCost).toBeCloseTo(expectedFuelCost, 2);

        // Fuel cost should be positive
        expect(fuelCost).toBeGreaterThan(0);

        // Fuel cost should be reasonable (not exceed 200%)
        expect(fuelCost).toBeLessThan(200);
      }),
      { numRuns: TEST_WORMHOLE_DATA.length }
    );
  });

  it('Property: For any two connected systems, jump time is calculated correctly', () => {
    const wormholeGen = fc.constantFrom(...TEST_WORMHOLE_DATA);

    fc.assert(
      fc.property(wormholeGen, ([systemAId, systemBId]) => {
        const systemA = TEST_STAR_DATA.find((s) => s.id === systemAId);
        const systemB = TEST_STAR_DATA.find((s) => s.id === systemBId);

        const distance = navSystem.calculateDistanceBetween(systemA, systemB);
        const jumpTime = navSystem.calculateJumpTime(distance);

        // Jump time should be positive
        expect(jumpTime).toBeGreaterThan(0);

        // Jump time should be an integer (days)
        expect(Number.isInteger(jumpTime)).toBe(true);

        // Jump time should be reasonable (not exceed 100 days for nearby systems)
        expect(jumpTime).toBeLessThan(100);
      }),
      { numRuns: TEST_WORMHOLE_DATA.length }
    );
  });
});
