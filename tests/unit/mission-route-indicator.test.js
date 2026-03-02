import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TEST_STAR_DATA } from '../test-data.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';

/**
 * Route indicator tests for mission cards.
 *
 * The mission board shows hop count and estimated travel time
 * for each mission destination, helping players evaluate feasibility
 * without revealing intermediate waypoint names.
 */

// Mock the wormhole graph to control route results independently of production data
vi.mock('../../src/game/utils/wormhole-graph.js', () => ({
  getShortestPath: vi.fn(),
}));

import { getShortestPath } from '../../src/game/utils/wormhole-graph.js';
import {
  calculateRouteIndicator,
  formatRouteIndicator,
} from '../../src/features/missions/missionRouteUtils.js';

const navigationSystem = new NavigationSystem(TEST_STAR_DATA, []);

describe('Mission Route Indicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateRouteIndicator', () => {
    it('returns hops and travel days for a direct 1-hop route', () => {
      // Sol (0) -> Alpha Centauri A (1): 1 hop, ~4.4 LY, jump time = 3 days
      getShortestPath.mockReturnValue({
        hops: 1,
        path: [0, 1],
        systemNames: ['Sol', 'Alpha Centauri A'],
      });

      const result = calculateRouteIndicator(
        0,
        1,
        TEST_STAR_DATA,
        navigationSystem
      );

      expect(result).toEqual({ hops: 1, totalDays: 3 });
    });

    it('returns hops and summed travel days for a 2-hop route', () => {
      // Sol (0) -> Alpha Centauri A (1) -> Epsilon Eridani (13)
      // Hop 1: Sol -> Alpha Centauri A = 3 days
      // Hop 2: Alpha Centauri A -> Epsilon Eridani = 7 days
      // Total = 10 days
      getShortestPath.mockReturnValue({
        hops: 2,
        path: [0, 1, 13],
        systemNames: ['Sol', 'Alpha Centauri A', 'Epsilon Eridani'],
      });

      const result = calculateRouteIndicator(
        0,
        13,
        TEST_STAR_DATA,
        navigationSystem
      );

      expect(result).toEqual({ hops: 2, totalDays: 10 });
    });

    it('returns hops and summed travel days for a route via Barnards Star', () => {
      // Sol (0) -> Barnard's Star (4) -> Wolf 359 (5)
      // Hop 1: Sol -> Barnard's Star = 3 days
      // Hop 2: Barnard's Star -> Wolf 359 = 6 days
      // Total = 9 days
      getShortestPath.mockReturnValue({
        hops: 2,
        path: [0, 4, 5],
        systemNames: ['Sol', "Barnard's Star", 'Wolf 359'],
      });

      const result = calculateRouteIndicator(
        0,
        5,
        TEST_STAR_DATA,
        navigationSystem
      );

      expect(result).toEqual({ hops: 2, totalDays: 9 });
    });

    it('returns null when no route exists', () => {
      getShortestPath.mockReturnValue(null);

      const result = calculateRouteIndicator(
        0,
        999,
        TEST_STAR_DATA,
        navigationSystem
      );

      expect(result).toBeNull();
    });

    it('returns null for same-system route', () => {
      const result = calculateRouteIndicator(
        0,
        0,
        TEST_STAR_DATA,
        navigationSystem
      );

      // Should short-circuit before calling getShortestPath
      expect(getShortestPath).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('calls getShortestPath with the correct system IDs', () => {
      getShortestPath.mockReturnValue({
        hops: 1,
        path: [7, 0],
        systemNames: ['Sirius A', 'Sol'],
      });

      calculateRouteIndicator(7, 0, TEST_STAR_DATA, navigationSystem);

      expect(getShortestPath).toHaveBeenCalledWith(7, 0);
    });
  });

  describe('formatRouteIndicator', () => {
    it('formats a 1-hop route as direct jump', () => {
      const text = formatRouteIndicator({ hops: 1, totalDays: 3 });
      expect(text).toBe('1 hop \u2014 direct jump');
    });

    it('formats a 2-hop route with approximate travel time', () => {
      const text = formatRouteIndicator({ hops: 2, totalDays: 10 });
      expect(text).toBe('2 hops \u2014 ~10 days travel');
    });

    it('formats a 3-hop route with approximate travel time', () => {
      const text = formatRouteIndicator({ hops: 3, totalDays: 18 });
      expect(text).toBe('3 hops \u2014 ~18 days travel');
    });

    it('returns empty string for null input', () => {
      const text = formatRouteIndicator(null);
      expect(text).toBe('');
    });
  });
});
