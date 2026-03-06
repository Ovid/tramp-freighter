import { describe, it, expect } from 'vitest';
import {
  generateCargoRun,
  generateMissionBoard,
  generatePassengerMission,
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
      expect(mission.missionCargo).toEqual(
        expect.objectContaining({
          good: expect.any(String),
          quantity: expect.any(Number),
          isIllegal: expect.any(Boolean),
        })
      );
      expect(mission.missionCargo.quantity).toBeGreaterThan(0);
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

    it('should calculate hop-based reward (positive integer)', () => {
      for (let i = 0; i < 20; i++) {
        const mission = generateCargoRun(
          0,
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA,
          'safe'
        );
        expect(Number.isInteger(mission.rewards.credits)).toBe(true);
        expect(mission.rewards.credits).toBeGreaterThan(0);
      }
    });

    it('should include traders faction reward', () => {
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe'
      );
      expect(mission.rewards.faction).toEqual(
        expect.objectContaining({ traders: 2 })
      );
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
      expect(mission.penalties.failure.faction).toEqual(
        expect.objectContaining({ traders: -2 })
      );
    });

    it('should generate destination that is a reachable system', () => {
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe'
      );
      const reachable = getReachableSystems(
        0,
        TEST_WORMHOLE_DATA,
        MISSION_CONFIG.MAX_MISSION_HOPS
      );
      const reachableIds = reachable.map((r) => r.systemId);
      expect(reachableIds).toContain(mission.requirements.destination);
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

  describe('generateCargoRun (risk-scaled)', () => {
    // Counter-based rng for controlling destination and legality independently
    // Call 1: destination selection (0.01 picks first/closest 1-hop neighbor)
    // Call 2: illegal chance (0.99 forces legal in safe zone)
    // Remaining calls: 0.99
    function makeLegalCargoRng() {
      let calls = 0;
      return () => {
        calls++;
        return calls === 1 ? 0.01 : 0.99;
      };
    }

    it('should pick destinations from reachable systems up to MAX_MISSION_HOPS', () => {
      const destinations = new Set();
      for (let i = 0; i < 100; i++) {
        const mission = generateCargoRun(
          7,
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA,
          'safe'
        );
        destinations.add(mission.requirements.destination);
      }
      // System 7 is a dead-end; should reach beyond just system 0
      expect(destinations.size).toBeGreaterThan(1);
    });

    it('should calculate reward using hop and danger multipliers', () => {
      const rng = makeLegalCargoRng();
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng
      );
      // 1-hop safe legal: baseFee * hopMult * dangerMult(1.0)
      expect(mission.rewards.credits).toBe(
        Math.ceil(
          MISSION_CONFIG.CARGO_RUN_BASE_FEE *
            MISSION_CONFIG.HOP_MULTIPLIERS[mission.hopCount]
        )
      );
    });

    it('should include hopCount on generated mission', () => {
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe'
      );
      expect(mission.hopCount).toBeGreaterThanOrEqual(1);
      expect(mission.hopCount).toBeLessThanOrEqual(
        MISSION_CONFIG.MAX_MISSION_HOPS
      );
    });

    it('should apply danger multiplier for dangerous destinations', () => {
      const dangerZoneFn = () => 'dangerous';
      const rng = makeLegalCargoRng();
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng,
        dangerZoneFn
      );
      // 1-hop dangerous: base * 1.0 * 2.0 = 240
      expect(mission.rewards.credits).toBe(
        Math.ceil(
          MISSION_CONFIG.CARGO_RUN_BASE_FEE *
            MISSION_CONFIG.HOP_MULTIPLIERS[1] *
            MISSION_CONFIG.DANGER_MULTIPLIERS.dangerous
        )
      );
    });

    it('should apply saturation penalty when completionHistory has entries', () => {
      const history = [
        { from: 0, to: 1, day: 5 },
        { from: 0, to: 1, day: 10 },
      ];
      const dangerZoneFn = () => 'safe';
      const rng = makeLegalCargoRng();
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng,
        dangerZoneFn,
        history,
        15
      );
      // 2 completions: penalty = 0.5, mult = 0.5
      expect(mission.rewards.credits).toBe(
        Math.ceil(
          MISSION_CONFIG.CARGO_RUN_BASE_FEE *
            MISSION_CONFIG.HOP_MULTIPLIERS[mission.hopCount] *
            1.0 *
            0.5
        )
      );
    });

    it('should not reduce reward below saturation floor', () => {
      const history = [
        { from: 0, to: 1, day: 1 },
        { from: 0, to: 1, day: 3 },
        { from: 0, to: 1, day: 5 },
        { from: 0, to: 1, day: 7 },
        { from: 0, to: 1, day: 9 },
      ];
      const dangerZoneFn = () => 'safe';
      const rng = makeLegalCargoRng();
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng,
        dangerZoneFn,
        history,
        15
      );
      // 5 completions: penalty = 1.25, clamped to floor 0.25
      expect(mission.rewards.credits).toBe(
        Math.ceil(
          MISSION_CONFIG.CARGO_RUN_BASE_FEE *
            MISSION_CONFIG.HOP_MULTIPLIERS[mission.hopCount] *
            0.25
        )
      );
    });

    it('should ignore completionHistory entries outside saturation window', () => {
      const history = [{ from: 0, to: 1, day: 1 }];
      const dangerZoneFn = () => 'safe';
      const rng = makeLegalCargoRng();
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng,
        dangerZoneFn,
        history,
        50
      );
      // Entry at day 1, current day 50, window 30 => stale
      expect(mission.rewards.credits).toBe(
        Math.ceil(
          MISSION_CONFIG.CARGO_RUN_BASE_FEE *
            MISSION_CONFIG.HOP_MULTIPLIERS[mission.hopCount]
        )
      );
    });

    it('should use hop-based deadline', () => {
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe'
      );
      const expectedDeadline =
        mission.hopCount * MISSION_CONFIG.DAYS_PER_HOP_ESTIMATE +
        MISSION_CONFIG.DEADLINE_BUFFER_DAYS;
      expect(mission.requirements.deadline).toBe(expectedDeadline);
    });

    it('should produce integer rewards', () => {
      for (let i = 0; i < 20; i++) {
        const mission = generateCargoRun(
          0,
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA,
          'safe'
        );
        expect(Number.isInteger(mission.rewards.credits)).toBe(true);
      }
    });

    it('should set saturated flag when saturation penalty applies', () => {
      const history = [{ from: 0, to: 1, day: 5 }];
      const dangerZoneFn = () => 'safe';
      const rng = makeLegalCargoRng();
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng,
        dangerZoneFn,
        history,
        15
      );
      expect(mission.saturated).toBe(true);
    });

    it('should not set saturated flag when no saturation penalty', () => {
      const rng = makeLegalCargoRng();
      const mission = generateCargoRun(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng
      );
      expect(mission.saturated).toBe(false);
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
      const byId = Object.fromEntries(
        result.map((r) => [r.systemId, r.hopCount])
      );
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

  describe('generatePassengerMission (multi-hop)', () => {
    it('should pick destinations from reachable systems', () => {
      const destinations = new Set();
      for (let i = 0; i < 100; i++) {
        const mission = generatePassengerMission(
          7,
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA
        );
        destinations.add(mission.requirements.destination);
      }
      expect(destinations.size).toBeGreaterThan(1);
    });

    it('should include hopCount on generated mission', () => {
      const mission = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA
      );
      expect(mission.hopCount).toBeGreaterThanOrEqual(1);
    });

    it('should use hop-based deadline', () => {
      const mission = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA
      );
      const expectedDeadline =
        mission.hopCount * MISSION_CONFIG.DAYS_PER_HOP_ESTIMATE +
        MISSION_CONFIG.DEADLINE_BUFFER_DAYS;
      expect(mission.requirements.deadline).toBe(expectedDeadline);
    });

    it('should apply saturation to passenger reward', () => {
      const history = [
        { from: 0, to: 1, day: 5 },
        { from: 0, to: 1, day: 10 },
      ];
      // Force destination to system 1 (first neighbor)
      const rng = () => 0.01;
      const mission = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        rng,
        history,
        15
      );
      if (mission.requirements.destination === 1) {
        expect(mission.saturated).toBe(true);
      }
    });

    it('should include saturated flag', () => {
      const mission = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA
      );
      expect(typeof mission.saturated).toBe('boolean');
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
      expect(board.length).toBeLessThanOrEqual(MISSION_CONFIG.BOARD_SIZE);
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

  describe('generateMissionBoard (scaled)', () => {
    it('should generate fewer missions for dead-end systems', () => {
      // System 7 has 1 connection, so board size = min(max(1+1, 1), 3) = 2
      const board = generateMissionBoard(
        7,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe'
      );
      expect(board.length).toBeLessThanOrEqual(2);
    });

    it('should generate full board for well-connected systems', () => {
      // System 0 has 3 connections, board size = min(max(3+1, 1), 6) = 4
      const boards = [];
      for (let i = 0; i < 20; i++) {
        boards.push(
          generateMissionBoard(0, TEST_STAR_DATA, TEST_WORMHOLE_DATA, 'safe')
        );
      }
      const maxSize = Math.max(...boards.map((b) => b.length));
      const expectedBoardSize = Math.min(3 + 1, MISSION_CONFIG.BOARD_SIZE);
      expect(maxSize).toBe(expectedBoardSize);
    });

    it('should pass completionHistory and mark saturated missions', () => {
      const history = [{ from: 0, to: 1, day: 5 }];
      // Low rng forces all missions to target system 1 (nearest neighbor)
      const rng = () => 0.01;
      const board = generateMissionBoard(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng,
        null,
        history,
        10
      );
      const toSystem1 = board.filter((m) => m.requirements.destination === 1);
      expect(toSystem1.length).toBeGreaterThan(0);
      toSystem1.forEach((m) => {
        expect(m.saturated).toBe(true);
      });
    });
  });

  describe('generateMissionBoard (priority missions)', () => {
    const { PRIORITY_MISSION } = MISSION_CONFIG;

    it('should mark missions as priority when rep meets threshold and RNG passes', () => {
      // rng=0.1: isPassenger (0.1 < 0.3 → passenger), BOARD_CHANCE (0.1 < 0.3 → passes)
      const rng = () => 0.1;
      const factionReps = {
        traders: PRIORITY_MISSION.TRADER_REP_THRESHOLD,
        civilians: PRIORITY_MISSION.CIVILIAN_REP_THRESHOLD,
      };
      const board = generateMissionBoard(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng,
        null,
        [],
        0,
        factionReps
      );

      expect(board.length).toBeGreaterThan(0);
      board.forEach((m) => {
        expect(m.priority).toBe(true);
      });
    });

    it('should multiply rewards by REWARD_MULTIPLIER for priority missions', () => {
      const rng = () => 0.1;
      const factionReps = {
        traders: PRIORITY_MISSION.TRADER_REP_THRESHOLD,
        civilians: PRIORITY_MISSION.CIVILIAN_REP_THRESHOLD,
      };

      // Generate a baseline board without priority
      const baseBoard = generateMissionBoard(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        () => 0.1,
        null,
        [],
        0,
        null
      );

      const priorityBoard = generateMissionBoard(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng,
        null,
        [],
        0,
        factionReps
      );

      // Same rng means same base missions; priority ones should have doubled rewards
      for (
        let i = 0;
        i < Math.min(baseBoard.length, priorityBoard.length);
        i++
      ) {
        const expected = Math.ceil(
          baseBoard[i].rewards.credits * PRIORITY_MISSION.REWARD_MULTIPLIER
        );
        expect(priorityBoard[i].rewards.credits).toBe(expected);
      }
    });

    it('should not set priority when faction rep is below threshold', () => {
      const rng = () => 0.1; // BOARD_CHANCE roll passes
      const factionReps = {
        traders: PRIORITY_MISSION.TRADER_REP_THRESHOLD - 1,
        civilians: PRIORITY_MISSION.CIVILIAN_REP_THRESHOLD - 1,
      };
      const board = generateMissionBoard(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng,
        null,
        [],
        0,
        factionReps
      );

      expect(board.length).toBeGreaterThan(0);
      board.forEach((m) => {
        expect(m.priority).toBeUndefined();
      });
    });

    it('should not set priority when BOARD_CHANCE roll fails', () => {
      const rng = () => 0.99; // 0.99 >= 0.3 → BOARD_CHANCE fails
      const factionReps = {
        traders: PRIORITY_MISSION.TRADER_REP_THRESHOLD + 10,
        civilians: PRIORITY_MISSION.CIVILIAN_REP_THRESHOLD + 10,
      };
      const board = generateMissionBoard(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng,
        null,
        [],
        0,
        factionReps
      );

      expect(board.length).toBeGreaterThan(0);
      board.forEach((m) => {
        expect(m.priority).toBeUndefined();
      });
    });

    it('should not set priority when factionReps is null', () => {
      const rng = () => 0.1;
      const board = generateMissionBoard(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng,
        null,
        [],
        0,
        null
      );

      expect(board.length).toBeGreaterThan(0);
      board.forEach((m) => {
        expect(m.priority).toBeUndefined();
      });
    });

    it('should use civilian rep threshold for passenger missions', () => {
      // rng=0.1 → isPassenger check: 0.1 < 0.3 → true (passenger)
      const rng = () => 0.1;
      const factionReps = {
        traders: 0,
        civilians: PRIORITY_MISSION.CIVILIAN_REP_THRESHOLD,
      };
      const board = generateMissionBoard(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        'safe',
        rng,
        null,
        [],
        0,
        factionReps
      );

      expect(board.length).toBeGreaterThan(0);
      // With rng=0.1, isPassenger is true (0.1 < 0.3), civilian rep meets threshold
      const passengerMissions = board.filter((m) => m.passenger);
      passengerMissions.forEach((m) => {
        expect(m.priority).toBe(true);
      });
    });
  });
});
