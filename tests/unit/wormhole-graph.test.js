import { describe, it, expect, beforeEach, vi } from 'vitest';

// We'll test the module by mocking the static data imports,
// so we can use a small, predictable graph.
//
// Test graph topology:
//   0 -- 1 -- 3
//   |         |
//   2 ------- 4
//
// Wormhole pairs: [0,1], [0,2], [1,3], [2,4], [3,4]

const TEST_WORMHOLES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
  [3, 4],
];

const TEST_STARS = [
  { id: 0, name: 'Sol', x: 0, y: 0, z: 0 },
  { id: 1, name: 'Alpha Centauri', x: 1, y: 0, z: 0 },
  { id: 2, name: 'Barnard', x: 0, y: 1, z: 0 },
  { id: 3, name: 'Sirius', x: 1, y: 1, z: 0 },
  { id: 4, name: 'Procyon', x: 0, y: 2, z: 0 },
];

// Mock the static data imports before importing the module under test
vi.mock('../../src/game/data/wormhole-data.js', () => ({
  WORMHOLE_DATA: TEST_WORMHOLES,
}));

vi.mock('../../src/game/data/star-data.js', () => ({
  STAR_DATA: TEST_STARS,
}));

// Import the module under test after mocks are set up
const {
  getConnectedSystems,
  getShortestPath,
  getReachableSystems,
  _resetCacheForTesting,
} = await import('../../src/game/utils/wormhole-graph.js');

describe('Wormhole Graph Cache', () => {
  beforeEach(() => {
    // Reset the lazy-init cache between test groups if needed
    _resetCacheForTesting();
  });

  describe('getConnectedSystems', () => {
    it('should return direct neighbors for a system', () => {
      const connected = getConnectedSystems(0);
      expect(connected).toEqual(expect.arrayContaining([1, 2]));
      expect(connected).toHaveLength(2);
    });

    it('should return a plain number array', () => {
      const connected = getConnectedSystems(0);
      expect(Array.isArray(connected)).toBe(true);
      connected.forEach((id) => expect(typeof id).toBe('number'));
    });

    it('should handle bidirectional connections', () => {
      // Connection [0,1] means 1 connects to 0
      const connected = getConnectedSystems(1);
      expect(connected).toContain(0);
      expect(connected).toContain(3);
    });

    it('should return an empty array for a system with no connections', () => {
      const connected = getConnectedSystems(999);
      expect(connected).toEqual([]);
    });

    it('should find all neighbors for a well-connected node', () => {
      // System 3 connects to 1 and 4
      const connected = getConnectedSystems(3);
      expect(connected).toEqual(expect.arrayContaining([1, 4]));
      expect(connected).toHaveLength(2);
    });
  });

  describe('getShortestPath', () => {
    it('should return a path between directly connected systems', () => {
      const result = getShortestPath(0, 1);
      expect(result.hops).toBe(1);
      expect(result.path).toEqual([0, 1]);
      expect(result.systemNames).toEqual(['Sol', 'Alpha Centauri']);
    });

    it('should return the shortest path for multi-hop routes', () => {
      // 0 -> 1 -> 3 is 2 hops, 0 -> 2 -> 4 -> 3 is 3 hops
      const result = getShortestPath(0, 3);
      expect(result.hops).toBe(2);
      expect(result.path).toEqual([0, 1, 3]);
      expect(result.systemNames).toEqual(['Sol', 'Alpha Centauri', 'Sirius']);
    });

    it('should find alternative shortest paths', () => {
      // 0 -> 2 -> 4 is 2 hops (same as 0 -> 1 -> 3 -> 4 which is 3)
      const result = getShortestPath(0, 4);
      expect(result.hops).toBe(2);
      expect(result.path).toEqual([0, 2, 4]);
    });

    it('should include system names along the path', () => {
      const result = getShortestPath(0, 4);
      expect(result.systemNames).toEqual(['Sol', 'Barnard', 'Procyon']);
    });

    it('should return null for unreachable systems', () => {
      const result = getShortestPath(0, 999);
      expect(result).toBeNull();
    });

    it('should return a zero-hop path for same-system query', () => {
      const result = getShortestPath(0, 0);
      expect(result.hops).toBe(0);
      expect(result.path).toEqual([0]);
      expect(result.systemNames).toEqual(['Sol']);
    });

    it('should work in both directions (symmetry)', () => {
      const forward = getShortestPath(0, 4);
      const reverse = getShortestPath(4, 0);
      expect(forward.hops).toBe(reverse.hops);
    });
  });

  describe('getReachableSystems', () => {
    it('should return direct neighbors at hop 1', () => {
      const result = getReachableSystems(0, 1);
      const ids = result.map((r) => r.systemId);
      expect(ids).toEqual(expect.arrayContaining([1, 2]));
      expect(ids).toHaveLength(2);
      result.forEach((r) => expect(r.hopCount).toBe(1));
    });

    it('should return systems up to maxHops away', () => {
      const result = getReachableSystems(0, 2);
      const ids = result.map((r) => r.systemId);
      // Hop 1: 1, 2. Hop 2: 3 (via 1), 4 (via 2)
      expect(ids).toEqual(expect.arrayContaining([1, 2, 3, 4]));
      expect(ids).toHaveLength(4);
    });

    it('should include correct hop counts', () => {
      const result = getReachableSystems(0, 2);
      const byId = Object.fromEntries(
        result.map((r) => [r.systemId, r.hopCount])
      );
      expect(byId[1]).toBe(1);
      expect(byId[2]).toBe(1);
      expect(byId[3]).toBe(2);
      expect(byId[4]).toBe(2);
    });

    it('should not include the origin system', () => {
      const result = getReachableSystems(0, 3);
      const ids = result.map((r) => r.systemId);
      expect(ids).not.toContain(0);
    });

    it('should return an empty array for a system with no connections', () => {
      const result = getReachableSystems(999, 3);
      expect(result).toEqual([]);
    });

    it('should handle maxHops of 0', () => {
      const result = getReachableSystems(0, 0);
      expect(result).toEqual([]);
    });

    it('should not duplicate systems reachable by multiple paths', () => {
      // System 4 is reachable from 0 via both 0->2->4 and 0->1->3->4
      // At maxHops=3, 4 should appear once with hopCount=2 (shortest)
      const result = getReachableSystems(0, 3);
      const fours = result.filter((r) => r.systemId === 4);
      expect(fours).toHaveLength(1);
      expect(fours[0].hopCount).toBe(2);
    });
  });

  describe('lazy initialization', () => {
    it('should produce consistent results across multiple calls', () => {
      const first = getConnectedSystems(0);
      const second = getConnectedSystems(0);
      expect(first).toEqual(second);
    });

    it('should produce consistent shortest path results', () => {
      const first = getShortestPath(0, 4);
      const second = getShortestPath(0, 4);
      expect(first).toEqual(second);
    });
  });
});
