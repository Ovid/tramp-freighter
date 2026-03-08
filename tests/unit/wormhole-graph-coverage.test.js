import { describe, it, expect, beforeEach, vi } from 'vitest';

// Test graph with an isolated node (5) and a disconnected component (6-7)
//   0 -- 1 -- 3
//   |         |
//   2 ------- 4
//   5 (isolated)
//   6 -- 7 (disconnected component)

const TEST_WORMHOLES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
  [3, 4],
  [6, 7],
];

const TEST_STARS = [
  { id: 0, name: 'Sol', x: 0, y: 0, z: 0 },
  { id: 1, name: 'Alpha Centauri', x: 1, y: 0, z: 0 },
  { id: 2, name: 'Barnard', x: 0, y: 1, z: 0 },
  { id: 3, name: 'Sirius', x: 1, y: 1, z: 0 },
  { id: 4, name: 'Procyon', x: 0, y: 2, z: 0 },
  // Note: id 5 has no star data entry, id 6/7 have no name entries
];

vi.mock('../../src/game/data/wormhole-data.js', () => ({
  WORMHOLE_DATA: TEST_WORMHOLES,
}));

vi.mock('../../src/game/data/star-data.js', () => ({
  STAR_DATA: TEST_STARS,
}));

const {
  getConnectedSystems,
  getShortestPath,
  getReachableSystems,
  _resetCacheForTesting,
} = await import('../../src/game/utils/wormhole-graph.js');

describe('Wormhole Graph coverage', () => {
  beforeEach(() => {
    _resetCacheForTesting();
  });

  describe('disconnected components', () => {
    it('returns null for path between disconnected components', () => {
      const result = getShortestPath(0, 6);
      expect(result).toBeNull();
    });

    it('finds path within disconnected component', () => {
      const result = getShortestPath(6, 7);
      expect(result).not.toBeNull();
      expect(result.hops).toBe(1);
      expect(result.path).toEqual([6, 7]);
    });

    it('returns neighbors for disconnected component', () => {
      const connected = getConnectedSystems(6);
      expect(connected).toEqual([7]);
    });

    it('gets reachable systems within disconnected component', () => {
      const result = getReachableSystems(6, 5);
      expect(result).toHaveLength(1);
      expect(result[0].systemId).toBe(7);
      expect(result[0].hopCount).toBe(1);
    });
  });

  describe('system name fallback', () => {
    it('uses fallback name for systems not in star data', () => {
      const result = getShortestPath(6, 7);
      expect(result.systemNames).toEqual(['System 6', 'System 7']);
    });

    it('uses fallback name for same-system query with unknown system', () => {
      const result = getShortestPath(6, 6);
      expect(result.systemNames).toEqual(['System 6']);
    });
  });

  describe('cache persistence', () => {
    it('returns same results without reset between calls', () => {
      const first = getConnectedSystems(0);
      // Do NOT reset cache
      const second = getConnectedSystems(0);
      expect(first).toEqual(second);

      // Different function still uses same cache
      const path = getShortestPath(0, 4);
      expect(path).not.toBeNull();
    });
  });

  describe('getReachableSystems sorting', () => {
    it('sorts by hopCount ascending, then systemId ascending', () => {
      const result = getReachableSystems(0, 3);
      for (let i = 1; i < result.length; i++) {
        const prev = result[i - 1];
        const curr = result[i];
        if (prev.hopCount === curr.hopCount) {
          expect(prev.systemId).toBeLessThan(curr.systemId);
        } else {
          expect(prev.hopCount).toBeLessThan(curr.hopCount);
        }
      }
    });
  });

  describe('edge cases', () => {
    it('handles negative maxHops', () => {
      const result = getReachableSystems(0, -1);
      expect(result).toEqual([]);
    });

    it('returns empty array for system not in adjacency map', () => {
      const result = getReachableSystems(5, 3);
      expect(result).toEqual([]);
    });

    it('getShortestPath with non-existent from system', () => {
      const result = getShortestPath(999, 0);
      expect(result).toBeNull();
    });
  });
});
