import { describe, it, expect } from 'vitest';
import {
  generateCargoRun,
  generateMissionBoard,
  getConnectedSystems,
  getReachableSystems,
} from '../../src/game/mission-generator.js';
import {
  MISSION_CARGO_TYPES,
  MISSION_CONFIG,
} from '../../src/game/constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Generator', () => {
  const allMissionCargo = [
    ...MISSION_CARGO_TYPES.legal,
    ...MISSION_CARGO_TYPES.illegal,
  ];

  describe('generateCargoRun', () => {
    it('should generate a valid delivery mission with mission-only cargo', () => {
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe'
      );

      expect(mission.id).toMatch(/^cargo_run_/);
      expect(mission.type).toBe('delivery');
      expect(mission.title).toContain('Cargo Run');
      expect(mission.requirements).toHaveProperty('destination');
      expect(mission.requirements).toHaveProperty('deadline');
      expect(mission.requirements.deadline).toBeGreaterThan(0);
      expect(mission.rewards.credits).toBeGreaterThan(0);
    });

    it('should use mission-only cargo types, not tradeable goods', () => {
      for (let i = 0; i < 30; i++) {
        const mission = generateCargoRun(
          0,
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA,
          'safe'
        );
        expect(allMissionCargo).toContain(mission.missionCargo.good);
        expect(['grain', 'ore', 'tritium', 'parts']).not.toContain(
          mission.missionCargo.good
        );
      }
    });

    it('should include missionCargo object with good, quantity, and isIllegal', () => {
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe'
      );
      expect(mission.missionCargo).toBeDefined();
      expect(mission.missionCargo.good).toBeDefined();
      expect(mission.missionCargo.quantity).toBeGreaterThan(0);
      expect(typeof mission.missionCargo.isIllegal).toBe('boolean');
    });

    it('should use legal quantity range for legal cargo', () => {
      const rng = () => 0.01; // low rng forces legal + low quantity
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng
      );
      if (!mission.missionCargo.isIllegal) {
        expect(mission.missionCargo.quantity).toBeGreaterThanOrEqual(
          MISSION_CONFIG.CARGO_RUN_LEGAL_QUANTITY.MIN
        );
        expect(mission.missionCargo.quantity).toBeLessThanOrEqual(
          MISSION_CONFIG.CARGO_RUN_LEGAL_QUANTITY.MAX
        );
      }
    });

    it('should use illegal quantity range for illegal cargo', () => {
      const rng = () => 0.99; // high rng forces illegal
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'dangerous',
        rng
      );
      if (mission.missionCargo.isIllegal) {
        expect(mission.missionCargo.quantity).toBeGreaterThanOrEqual(
          MISSION_CONFIG.CARGO_RUN_ILLEGAL_QUANTITY.MIN
        );
        expect(mission.missionCargo.quantity).toBeLessThanOrEqual(
          MISSION_CONFIG.CARGO_RUN_ILLEGAL_QUANTITY.MAX
        );
      }
    });

    it('should calculate distance-based reward (integer)', () => {
      for (let i = 0; i < 20; i++) {
        const mission = generateCargoRun(
          0,
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA,
          'safe'
        );
        expect(Number.isInteger(mission.rewards.credits)).toBe(true);
        expect(mission.rewards.credits).toBeGreaterThanOrEqual(
          MISSION_CONFIG.CARGO_RUN_BASE_FEE
        );
      }
    });

    it('should include traders faction reward', () => {
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe'
      );
      expect(mission.rewards.faction).toBeDefined();
      expect(mission.rewards.faction.traders).toBe(2);
    });

    it('should include outlaws faction reward for illegal cargo', () => {
      // Force illegal cargo
      const rng = () => 0.99;
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'dangerous',
        rng
      );
      if (mission.missionCargo.isIllegal) {
        expect(mission.rewards.faction.outlaws).toBe(3);
      }
    });

    it('should include failure penalties', () => {
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe'
      );
      expect(mission.penalties.failure.faction).toBeDefined();
      expect(mission.penalties.failure.faction.traders).toBe(-2);
    });

    it('should generate destination that is a connected system', () => {
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe'
      );
      expect([1, 4, 7]).toContain(mission.requirements.destination);
    });

    it('should produce more illegal missions in dangerous zones', () => {
      let illegalCount = 0;
      const runs = 100;
      for (let i = 0; i < runs; i++) {
        const mission = generateCargoRun(
          0,
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA,
          'dangerous'
        );
        if (mission.missionCargo.isIllegal) illegalCount++;
      }
      // dangerous zone = 75% illegal chance, expect at least 50% to account for randomness
      expect(illegalCount).toBeGreaterThan(runs * 0.5);
    });
  });

  describe('getReachableSystems', () => {
    it('should return direct neighbors at hop 1', () => {
      const result = getReachableSystems(0, TEST_WORMHOLE_DATA, 1);
      const ids = result.map((r) => r.systemId);
      expect(ids).toEqual(expect.arrayContaining([1, 4, 7]));
      expect(ids).toHaveLength(3);
      result.forEach((r) => expect(r.hopCount).toBe(1));
    });

    it('should return systems up to 2 hops away', () => {
      const result = getReachableSystems(0, TEST_WORMHOLE_DATA, 2);
      const ids = result.map((r) => r.systemId);
      expect(ids).toEqual(expect.arrayContaining([1, 4, 7, 5, 13]));
      expect(ids).toHaveLength(5);
    });

    it('should include hop count for each system', () => {
      const result = getReachableSystems(0, TEST_WORMHOLE_DATA, 2);
      const byId = Object.fromEntries(result.map((r) => [r.systemId, r.hopCount]));
      expect(byId[1]).toBe(1);
      expect(byId[4]).toBe(1);
      expect(byId[7]).toBe(1);
      expect(byId[5]).toBe(2);
      expect(byId[13]).toBe(2);
    });

    it('should not include the origin system', () => {
      const result = getReachableSystems(0, TEST_WORMHOLE_DATA, 3);
      const ids = result.map((r) => r.systemId);
      expect(ids).not.toContain(0);
    });

    it('should handle dead-end systems (1 connection)', () => {
      const result = getReachableSystems(7, TEST_WORMHOLE_DATA, 1);
      expect(result).toEqual([{ systemId: 0, hopCount: 1 }]);
    });

    it('should find multi-hop destinations from dead-end systems', () => {
      const result = getReachableSystems(7, TEST_WORMHOLE_DATA, 3);
      const ids = result.map((r) => r.systemId);
      expect(ids).toEqual(expect.arrayContaining([0, 1, 4, 5, 13]));
    });
  });

  describe('generateMissionBoard', () => {
    it('should generate the configured number of missions', () => {
      const board = generateMissionBoard(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe'
      );
      expect(board.length).toBeGreaterThan(0);
      expect(board.length).toBeLessThanOrEqual(3);
    });

    it('should generate unique mission IDs', () => {
      const board = generateMissionBoard(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe'
      );
      const ids = board.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
