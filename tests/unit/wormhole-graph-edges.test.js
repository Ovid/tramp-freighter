'use strict';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getShortestPath,
  getReachableSystems,
  _resetCacheForTesting,
} from '../../src/game/utils/wormhole-graph.js';

/**
 * Edge-case tests for wormhole-graph.js using REAL star and wormhole data.
 *
 * These tests exercise uncovered branches in getShortestPath and
 * getReachableSystems against the production 117-system graph.
 *
 * Real data references:
 *   Sol = 0, Alpha Centauri A = 1 (connected by wormhole [0,1])
 *   Sol direct neighbors: 1, 4, 7, 9, 11, 12, 16, 19
 */
describe('Wormhole Graph Edge Cases (real data)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getShortestPath', () => {
    it('returns hops=0, path=[systemId] for same-system query', () => {
      const result = getShortestPath(0, 0);

      expect(result).not.toBeNull();
      expect(result.hops).toBe(0);
      expect(result.path).toEqual([0]);
    });

    it('returns systemNames=["Sol"] for same-system query on Sol', () => {
      const result = getShortestPath(0, 0);

      expect(result.systemNames).toEqual(['Sol']);
    });

    it('returns null when no connecting path exists (unknown system)', () => {
      const result = getShortestPath(0, 99999);

      expect(result).toBeNull();
    });

    it('returns correct hops and path for a multi-hop route', () => {
      // Sol(0) -> Alpha Centauri A(1) -> system 13 is 2 hops
      // Wormhole [0,1] and [1,13] exist in real data
      const result = getShortestPath(0, 13);

      expect(result).not.toBeNull();
      expect(result.hops).toBeGreaterThanOrEqual(1);
      expect(result.path.length).toBe(result.hops + 1);
      expect(result.path[0]).toBe(0);
      expect(result.path[result.path.length - 1]).toBe(13);
    });

    it('returns a path copy that does not affect internal cache', () => {
      const first = getShortestPath(0, 1);
      const originalPath = [...first.path];

      // Mutate the returned path
      first.path.push(999);
      first.path[0] = -1;

      // Fetch again — should be unaffected
      const second = getShortestPath(0, 1);

      expect(second.path).toEqual(originalPath);
    });
  });

  describe('getReachableSystems', () => {
    it('returns empty array when maxHops is 0', () => {
      const result = getReachableSystems(0, 0);

      expect(result).toEqual([]);
    });

    it('returns empty array when maxHops is negative', () => {
      const result = getReachableSystems(0, -5);

      expect(result).toEqual([]);
    });

    it('returns empty array for unknown system ID', () => {
      const result = getReachableSystems(99999, 3);

      expect(result).toEqual([]);
    });

    it('returns only direct neighbors for maxHops=1', () => {
      const result = getReachableSystems(0, 1);

      // Sol has 8 direct neighbors: 1, 4, 7, 9, 11, 12, 16, 19
      expect(result.length).toBe(8);
      result.forEach((entry) => {
        expect(entry.hopCount).toBe(1);
      });

      const ids = result.map((r) => r.systemId);
      expect(ids).toEqual(expect.arrayContaining([1, 4, 7, 9, 11, 12, 16, 19]));
    });

    it('returns more systems for higher maxHops', () => {
      const hop1 = getReachableSystems(0, 1);
      const hop2 = getReachableSystems(0, 2);

      expect(hop2.length).toBeGreaterThan(hop1.length);
    });

    it('returns results sorted by hopCount ascending then systemId ascending', () => {
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

    it('ensures all returned entries have hopCount <= maxHops', () => {
      const maxHops = 2;
      const result = getReachableSystems(0, maxHops);

      expect(result.length).toBeGreaterThan(0);
      result.forEach((entry) => {
        expect(entry.hopCount).toBeLessThanOrEqual(maxHops);
      });
    });
  });
});
