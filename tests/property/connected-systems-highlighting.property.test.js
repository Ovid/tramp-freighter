import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { NavigationSystem } from '../../js/game-navigation.js';

/**
 * Property-based tests for connected systems highlighting
 *
 * Verifies that when a system is selected, only its connected systems
 * are highlighted, improving navigation UX.
 */
describe('Connected Systems Highlighting', () => {
  const navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);

  it('Property: For any valid system ID, getConnectedSystems returns an array of valid system IDs', () => {
    // Generator for valid system IDs from TEST_STAR_DATA
    const validSystemIdGen = fc.constantFrom(
      ...TEST_STAR_DATA.map((s) => s.id)
    );

    fc.assert(
      fc.property(validSystemIdGen, (systemId) => {
        const connectedSystems = navSystem.getConnectedSystems(systemId);

        // Should return an array
        expect(Array.isArray(connectedSystems)).toBe(true);

        // All returned IDs should be valid system IDs
        connectedSystems.forEach((id) => {
          const system = TEST_STAR_DATA.find((s) => s.id === id);
          expect(system).toBeDefined();
        });
      }),
      { numRuns: 100 }
    );
  });

  it('Property: For any wormhole connection, connections are symmetric (if A connects to B, B connects to A)', () => {
    // Generator for wormhole connections
    const wormholeGen = fc.constantFrom(...TEST_WORMHOLE_DATA);

    fc.assert(
      fc.property(wormholeGen, ([systemA, systemB]) => {
        const connectionsFromA = navSystem.getConnectedSystems(systemA);
        const connectionsFromB = navSystem.getConnectedSystems(systemB);

        // A should list B as connected
        expect(connectionsFromA).toContain(systemB);

        // B should list A as connected
        expect(connectionsFromB).toContain(systemA);
      }),
      { numRuns: TEST_WORMHOLE_DATA.length }
    );
  });

  it('Property: For any system, connected systems list does not include the system itself', () => {
    const validSystemIdGen = fc.constantFrom(
      ...TEST_STAR_DATA.map((s) => s.id)
    );

    fc.assert(
      fc.property(validSystemIdGen, (systemId) => {
        const connected = navSystem.getConnectedSystems(systemId);

        // Should not include itself
        expect(connected).not.toContain(systemId);
      }),
      { numRuns: 100 }
    );
  });

  it('Property: For any system, connected systems list contains no duplicates', () => {
    const validSystemIdGen = fc.constantFrom(
      ...TEST_STAR_DATA.map((s) => s.id)
    );

    fc.assert(
      fc.property(validSystemIdGen, (systemId) => {
        const connected = navSystem.getConnectedSystems(systemId);

        // Check for duplicates
        const uniqueConnected = [...new Set(connected)];
        expect(connected.length).toBe(uniqueConnected.length);
      }),
      { numRuns: 100 }
    );
  });

  it('Property: For any system, connection count matches wormhole data', () => {
    // Count actual connections for each system in wormhole data
    const connectionCounts = new Map();

    TEST_WORMHOLE_DATA.forEach(([systemA, systemB]) => {
      connectionCounts.set(systemA, (connectionCounts.get(systemA) || 0) + 1);
      connectionCounts.set(systemB, (connectionCounts.get(systemB) || 0) + 1);
    });

    const validSystemIdGen = fc.constantFrom(
      ...TEST_STAR_DATA.map((s) => s.id)
    );

    fc.assert(
      fc.property(validSystemIdGen, (systemId) => {
        const connected = navSystem.getConnectedSystems(systemId);
        const expectedCount = connectionCounts.get(systemId) || 0;

        expect(connected.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });

  it('Property: For any invalid system ID, returns empty array', () => {
    // Generator for invalid system IDs (outside the range of valid IDs)
    const maxValidId = Math.max(...TEST_STAR_DATA.map((s) => s.id));
    const invalidIdGen = fc.integer({
      min: maxValidId + 1,
      max: maxValidId + 1000,
    });

    fc.assert(
      fc.property(invalidIdGen, (invalidId) => {
        const connected = navSystem.getConnectedSystems(invalidId);

        // Should return empty array for invalid ID
        expect(connected).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });
});
