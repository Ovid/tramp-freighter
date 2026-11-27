import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NavigationSystem } from '../../src/game/game-navigation.js';

describe('NavigationSystem coverage', () => {
  let nav;
  const starData = [
    { id: 0, name: 'Sol', x: 0, y: 0, z: 0 },
    { id: 1, name: 'Alpha Centauri', x: 43, y: 0, z: 0 },
    { id: 2, name: 'Barnard', x: 0, y: 50, z: 0 },
  ];
  const wormholeData = [
    [0, 1],
    [1, 2],
  ];

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    nav = new NavigationSystem(starData, wormholeData);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateJump', () => {
    it('returns invalid for unconnected systems', () => {
      const result = nav.validateJump(0, 2, 100);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('no_connection');
    });

    it('returns invalid for unknown system IDs', () => {
      // Create a nav with wormhole connection but no star data for one system
      const navMissing = new NavigationSystem(
        [{ id: 0, name: 'Sol', x: 0, y: 0, z: 0 }],
        [[0, 999]]
      );
      const result = navMissing.validateJump(0, 999, 100);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid_system');
      expect(result.error).toBe('Invalid system ID');
    });

    it('returns invalid for insufficient fuel', () => {
      const result = nav.validateJump(0, 1, 0);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('insufficient_fuel');
      expect(result.fuelCost).toBeGreaterThan(0);
    });

    it('returns valid for sufficient fuel and connected systems', () => {
      const result = nav.validateJump(0, 1, 100);
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.fuelCost).toBeGreaterThan(0);
      expect(result.distance).toBeGreaterThan(0);
      expect(result.jumpTime).toBeGreaterThan(0);
    });
  });

  describe('getConnectedSystems', () => {
    it('returns connected systems using fallback path', () => {
      const connected = nav.getConnectedSystems(0);
      expect(connected).toContain(1);
      expect(connected).not.toContain(2);
    });

    it('returns empty array for isolated system', () => {
      const connected = nav.getConnectedSystems(999);
      expect(connected).toEqual([]);
    });
  });

  describe('areSystemsConnected', () => {
    it('returns true for directly connected systems', () => {
      expect(nav.areSystemsConnected(0, 1)).toBe(true);
      expect(nav.areSystemsConnected(1, 0)).toBe(true);
    });

    it('returns false for non-connected systems', () => {
      expect(nav.areSystemsConnected(0, 2)).toBe(false);
    });
  });
});
