import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { NavigationSystem } from '../../js/game-navigation.js';

/**
 * Property-based tests for jump validation messages
 *
 * Verifies that users receive clear feedback when jumping
 * is not possible due to fuel or connection constraints.
 */
describe('Jump Validation Messages', () => {
  const navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);

  it('Property: For any connected systems with insufficient fuel, validation fails with error message', () => {
    const wormholeGen = fc.constantFrom(...TEST_WORMHOLE_DATA);
    const lowFuelGen = fc.float({ min: 0, max: 5, noNaN: true });

    fc.assert(
      fc.property(wormholeGen, lowFuelGen, ([systemAId, systemBId], fuel) => {
        // Validate jump with low fuel
        const validation = navSystem.validateJump(systemAId, systemBId, fuel);

        // Should fail with specific error message
        expect(validation.valid).toBe(false);
        expect(validation.error).toContain('Insufficient fuel');
      }),
      { numRuns: 50 }
    );
  });

  it('Property: For any unconnected systems, validation fails with connection error', () => {
    // Find pairs of unconnected systems
    const unconnectedPairs = [];
    for (const systemA of TEST_STAR_DATA) {
      const connectedIds = navSystem.getConnectedSystems(systemA.id);
      for (const systemB of TEST_STAR_DATA) {
        if (systemA.id !== systemB.id && !connectedIds.includes(systemB.id)) {
          unconnectedPairs.push([systemA.id, systemB.id]);
        }
      }
    }

    if (unconnectedPairs.length === 0) {
      return; // Skip if all systems are connected
    }

    const unconnectedPairGen = fc.constantFrom(...unconnectedPairs);

    fc.assert(
      fc.property(unconnectedPairGen, ([systemAId, systemBId]) => {
        // Validate jump to unconnected system with full fuel
        const validation = navSystem.validateJump(systemAId, systemBId, 100);

        // Should fail with specific error message
        expect(validation.valid).toBe(false);
        expect(validation.error).toContain('No wormhole connection');
      }),
      { numRuns: Math.min(50, unconnectedPairs.length) }
    );
  });

  it('Property: For any connected systems with sufficient fuel, validation succeeds', () => {
    const wormholeGen = fc.constantFrom(...TEST_WORMHOLE_DATA);

    fc.assert(
      fc.property(wormholeGen, ([systemAId, systemBId]) => {
        // Validate jump with full fuel
        const validation = navSystem.validateJump(systemAId, systemBId, 100);

        // Should succeed with no error
        expect(validation.valid).toBe(true);
        expect(validation.error).toBeNull();
      }),
      { numRuns: TEST_WORMHOLE_DATA.length }
    );
  });

  it('Property: For any connected systems, validation includes accurate fuel cost', () => {
    const wormholeGen = fc.constantFrom(...TEST_WORMHOLE_DATA);
    const fuelGen = fc.float({ min: 0, max: 100, noNaN: true });

    fc.assert(
      fc.property(wormholeGen, fuelGen, ([systemAId, systemBId], fuel) => {
        const systemA = TEST_STAR_DATA.find((s) => s.id === systemAId);
        const systemB = TEST_STAR_DATA.find((s) => s.id === systemBId);

        const distance = navSystem.calculateDistanceBetween(systemA, systemB);
        const expectedFuelCost = navSystem.calculateFuelCost(distance);

        // Validate jump
        const validation = navSystem.validateJump(systemAId, systemBId, fuel);

        // Fuel cost should be accurate
        expect(validation.fuelCost).toBeCloseTo(expectedFuelCost, 2);
      }),
      { numRuns: 50 }
    );
  });

  it('Property: For any connected systems with exactly enough fuel, validation succeeds', () => {
    const wormholeGen = fc.constantFrom(...TEST_WORMHOLE_DATA);

    fc.assert(
      fc.property(wormholeGen, ([systemAId, systemBId]) => {
        const systemA = TEST_STAR_DATA.find((s) => s.id === systemAId);
        const systemB = TEST_STAR_DATA.find((s) => s.id === systemBId);

        const distance = navSystem.calculateDistanceBetween(systemA, systemB);
        const fuelCost = navSystem.calculateFuelCost(distance);

        // Validate jump with exactly enough fuel
        const validation = navSystem.validateJump(
          systemAId,
          systemBId,
          fuelCost
        );

        // Should succeed
        expect(validation.valid).toBe(true);
        expect(validation.error).toBeNull();
      }),
      { numRuns: TEST_WORMHOLE_DATA.length }
    );
  });
});
