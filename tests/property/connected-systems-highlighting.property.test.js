import { describe, it, expect, beforeEach } from 'vitest';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { NavigationSystem } from '../../js/game-navigation.js';

/**
 * Property-based tests for connected systems highlighting
 *
 * Verifies that when a system is selected, only its connected systems
 * are highlighted, improving navigation UX.
 */
describe('Connected Systems Highlighting', () => {
  let navSystem;

  beforeEach(() => {
    navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
  });

  it('should return all systems connected to a given system', () => {
    // Sol (id: 0) is connected to multiple systems
    const connectedToSol = navSystem.getConnectedSystems(0);

    // Should return an array
    expect(Array.isArray(connectedToSol)).toBe(true);

    // Should have at least one connection
    expect(connectedToSol.length).toBeGreaterThan(0);

    // All returned IDs should be valid system IDs
    connectedToSol.forEach((id) => {
      const system = TEST_STAR_DATA.find((s) => s.id === id);
      expect(system).toBeDefined();
    });
  });

  it('should return empty array for system with no connections', () => {
    // Find a system with no wormholes
    const isolatedSystem = TEST_STAR_DATA.find((s) => s.wh === 0);

    if (isolatedSystem) {
      const connected = navSystem.getConnectedSystems(isolatedSystem.id);
      expect(connected).toEqual([]);
    }
  });

  it('should return symmetric connections (if A connects to B, B connects to A)', () => {
    // Test all wormhole connections for symmetry
    TEST_WORMHOLE_DATA.forEach(([systemA, systemB]) => {
      const connectionsFromA = navSystem.getConnectedSystems(systemA);
      const connectionsFromB = navSystem.getConnectedSystems(systemB);

      // A should list B as connected
      expect(connectionsFromA).toContain(systemB);

      // B should list A as connected
      expect(connectionsFromB).toContain(systemA);
    });
  });

  it('should not include the system itself in connected systems', () => {
    // Test several systems
    const systemsToTest = [0, 1, 4, 7];

    systemsToTest.forEach((systemId) => {
      const connected = navSystem.getConnectedSystems(systemId);

      // Should not include itself
      expect(connected).not.toContain(systemId);
    });
  });

  it('should return unique system IDs (no duplicates)', () => {
    // Test all systems with connections
    const systemsWithConnections = TEST_STAR_DATA.filter((s) => s.wh > 0);

    systemsWithConnections.forEach((system) => {
      const connected = navSystem.getConnectedSystems(system.id);

      // Check for duplicates
      const uniqueConnected = [...new Set(connected)];
      expect(connected.length).toBe(uniqueConnected.length);
    });
  });

  it('should return correct count based on actual wormhole data', () => {
    // Count actual connections for each system in wormhole data
    const connectionCounts = new Map();

    TEST_WORMHOLE_DATA.forEach(([systemA, systemB]) => {
      connectionCounts.set(systemA, (connectionCounts.get(systemA) || 0) + 1);
      connectionCounts.set(systemB, (connectionCounts.get(systemB) || 0) + 1);
    });

    // Verify getConnectedSystems returns correct count
    TEST_STAR_DATA.forEach((system) => {
      const connected = navSystem.getConnectedSystems(system.id);
      const expectedCount = connectionCounts.get(system.id) || 0;

      expect(connected.length).toBe(expectedCount);
    });
  });

  it('should handle invalid system ID gracefully', () => {
    const connected = navSystem.getConnectedSystems(99999);

    // Should return empty array for invalid ID
    expect(connected).toEqual([]);
  });
});
