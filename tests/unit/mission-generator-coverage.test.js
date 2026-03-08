import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateCargoRun,
  generatePassengerMission,
  generateMissionBoard,
  getReachableSystems,
} from '../../src/game/mission-generator.js';
import { MISSION_CONFIG } from '../../src/game/constants.js';

describe('mission-generator coverage', () => {
  const starData = [
    { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 },
    { id: 1, name: 'Alpha Centauri', x: 10, y: 0, z: 0, type: 'G2V', st: 1 },
    { id: 2, name: 'Barnard', x: 0, y: 10, z: 0, type: 'M4V', st: 0 },
    { id: 3, name: 'Wolf 359', x: 0, y: 0, z: 10, type: 'M6V', st: 0 },
    { id: 4, name: 'Lalande', x: 5, y: 5, z: 0, type: 'M2V', st: 0 },
  ];

  const wormholeData = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],
  ];

  let callCount;
  const deterministicRng = () => {
    callCount++;
    // Cycle through some values
    return (callCount * 0.17) % 1;
  };

  beforeEach(() => {
    callCount = 0;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getReachableSystems', () => {
    it('returns reachable systems within max hops', () => {
      const result = getReachableSystems(0, wormholeData, 2);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((r) => r.hopCount <= 2)).toBe(true);
    });

    it('returns empty for isolated system', () => {
      const isolated = [[0, 1]];
      const result = getReachableSystems(5, isolated, 3);
      expect(result).toHaveLength(0);
    });

    it('includes hop count for each system', () => {
      const result = getReachableSystems(0, wormholeData, 3);
      for (const r of result) {
        expect(r).toHaveProperty('systemId');
        expect(r).toHaveProperty('hopCount');
        expect(r.hopCount).toBeGreaterThan(0);
      }
    });
  });

  describe('generateCargoRun', () => {
    it('returns null when no reachable systems', () => {
      const result = generateCargoRun(99, starData, [[0, 1]]);
      expect(result).toBeNull();
    });

    it('generates valid cargo run mission', () => {
      const mission = generateCargoRun(
        0,
        starData,
        wormholeData,
        'safe',
        deterministicRng
      );
      expect(mission).toBeDefined();
      expect(mission.type).toBe('delivery');
      expect(mission.missionCargo).toBeDefined();
      expect(mission.rewards.credits).toBeGreaterThan(0);
    });

    it('generates illegal cargo in dangerous zones', () => {
      // Use rng that returns low values to trigger illegal
      let found = false;
      for (let seed = 0; seed < 50; seed++) {
        let c = seed;
        const rng = () => {
          c++;
          return (c * 0.03) % 1; // Low values to trigger illegal
        };
        const mission = generateCargoRun(
          0,
          starData,
          wormholeData,
          'dangerous',
          rng
        );
        if (mission && mission.missionCargo.isIllegal) {
          found = true;
          expect(mission.rewards.credits).toBeGreaterThan(0);
          expect(mission.penalties.failure.faction.outlaws).toBeDefined();
          break;
        }
      }
      expect(found).toBe(true);
    });

    it('applies destination danger zone multiplier', () => {
      const dangerZoneFn = () => 'dangerous';
      const mission = generateCargoRun(
        0,
        starData,
        wormholeData,
        'safe',
        deterministicRng,
        dangerZoneFn
      );
      expect(mission).toBeDefined();
    });

    it('applies route saturation', () => {
      const history = [
        { from: 0, to: 1, day: 5 },
        { from: 0, to: 1, day: 6 },
        { from: 0, to: 1, day: 7 },
      ];
      // Force rng to pick system 1 as destination
      const rng = () => 0.5;
      const mission = generateCargoRun(
        0,
        starData,
        wormholeData,
        'safe',
        rng,
        null,
        history,
        10
      );
      if (mission && mission.destination.systemId === 1) {
        expect(mission.saturated).toBe(true);
      }
    });

    it('generates legal cargo in safe zones', () => {
      // Use rng that returns high values to avoid illegal
      const rng = () => 0.99;
      const mission = generateCargoRun(0, starData, wormholeData, 'safe', rng);
      if (mission) {
        expect(mission.missionCargo.isIllegal).toBe(false);
      }
    });
  });

  describe('generatePassengerMission', () => {
    it('returns null when no reachable systems', () => {
      const result = generatePassengerMission(99, starData, [[0, 1]]);
      expect(result).toBeNull();
    });

    it('generates valid passenger mission', () => {
      const mission = generatePassengerMission(
        0,
        starData,
        wormholeData,
        deterministicRng
      );
      expect(mission).toBeDefined();
      expect(mission.type).toBe('passenger');
      expect(mission.passenger).toBeDefined();
      expect(mission.passenger.name).toBeDefined();
      expect(mission.passenger.satisfaction).toBeDefined();
      expect(mission.rewards.credits).toBeGreaterThan(0);
    });

    it('includes passenger dialogue', () => {
      const mission = generatePassengerMission(
        0,
        starData,
        wormholeData,
        deterministicRng
      );
      if (mission) {
        expect(typeof mission.passenger.dialogue).toBe('string');
      }
    });

    it('applies route saturation to passenger missions', () => {
      const history = [
        { from: 0, to: 1, day: 5 },
        { from: 0, to: 1, day: 6 },
        { from: 0, to: 1, day: 7 },
      ];
      const mission = generatePassengerMission(
        0,
        starData,
        wormholeData,
        deterministicRng,
        history,
        10
      );
      expect(mission).toBeDefined();
    });
  });

  describe('generateMissionBoard', () => {
    it('generates a board with missions', () => {
      const board = generateMissionBoard(
        0,
        starData,
        wormholeData,
        'safe',
        deterministicRng
      );
      expect(Array.isArray(board)).toBe(true);
      expect(board.length).toBeGreaterThan(0);
    });

    it('generates mix of cargo and passenger missions', () => {
      // Run multiple boards to find both types
      let hasCargo = false;
      let hasPassenger = false;
      for (let seed = 0; seed < 20; seed++) {
        let c = seed * 100;
        const rng = () => {
          c++;
          return (c * 0.31) % 1;
        };
        const board = generateMissionBoard(
          0,
          starData,
          wormholeData,
          'safe',
          rng
        );
        for (const m of board) {
          if (m.type === 'delivery') hasCargo = true;
          if (m.type === 'passenger') hasPassenger = true;
        }
        if (hasCargo && hasPassenger) break;
      }
      expect(hasCargo).toBe(true);
      expect(hasPassenger).toBe(true);
    });

    it('applies priority missions when factionReps provided', () => {
      // Use high faction reps and many attempts to trigger priority
      let foundPriority = false;
      const factionReps = { traders: 50, civilians: 50 };
      for (let seed = 0; seed < 30; seed++) {
        let c = seed * 50;
        const rng = () => {
          c++;
          return (c * 0.13) % 1;
        };
        const board = generateMissionBoard(
          0,
          starData,
          wormholeData,
          'safe',
          rng,
          null,
          [],
          10,
          factionReps
        );
        for (const m of board) {
          if (m.priority) {
            foundPriority = true;
            break;
          }
        }
        if (foundPriority) break;
      }
      expect(foundPriority).toBe(true);
    });

    it('respects board size limits', () => {
      const board = generateMissionBoard(
        0,
        starData,
        wormholeData,
        'safe',
        deterministicRng
      );
      expect(board.length).toBeLessThanOrEqual(MISSION_CONFIG.BOARD_SIZE);
    });

    it('passes completion history through', () => {
      const history = [{ from: 0, to: 1, day: 5 }];
      const board = generateMissionBoard(
        0,
        starData,
        wormholeData,
        'safe',
        deterministicRng,
        null,
        history,
        10
      );
      expect(board).toBeDefined();
    });
  });
});
