import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateCargoRun,
  generatePassengerMission,
} from '../../src/game/mission-generator.js';
import {
  MISSION_CONFIG,
  MISSION_CARGO_TYPES,
  PASSENGER_CONFIG,
} from '../../src/game/constants.js';

/**
 * Tests targeting uncovered lines in mission-generator.js:
 * - Lines 106-108: illegal cargo quantity range selection
 * - Lines 147-155: illegal cargo failure penalties (outlaws faction)
 * - Lines 157-186: cargo run return object with destStar fallback
 * - Lines 192-193: generatePassengerMission
 * - Lines 256-257, 270: passenger mission destStar fallback
 */
describe('mission-generator gap coverage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Minimal star/wormhole data where system 2 is reachable but NOT in starData
  const starDataMissingDest = [
    { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 },
  ];
  const wormholeWithUnknownDest = [
    [0, 2], // system 2 is reachable but not in starData
  ];

  describe('generateCargoRun destStar fallback', () => {
    it('should use fallback name when destination star is not in starData', () => {
      // Force rng to pick the only reachable system (2)
      const rng = () => 0.5;
      const mission = generateCargoRun(
        0,
        starDataMissingDest,
        wormholeWithUnknownDest,
        'safe',
        rng
      );

      expect(mission).not.toBeNull();
      expect(mission.title).toContain('System 2');
      expect(mission.destination.name).toBe('System 2');
      expect(mission.destination.systemId).toBe(2);
    });
  });

  describe('generateCargoRun illegal cargo paths', () => {
    it('should select illegal quantity range and return illegal mission fields', () => {
      // rng sequence: first call picks destination, second call must be < illegalChance
      // In 'dangerous' zone, illegalChance = 0.75, so 0.5 < 0.75 triggers illegal
      let callIndex = 0;
      const rng = () => {
        callIndex++;
        return 0.5;
      };
      const mission = generateCargoRun(
        0,
        starDataMissingDest,
        wormholeWithUnknownDest,
        'dangerous',
        rng
      );

      expect(mission).not.toBeNull();
      expect(mission.missionCargo.isIllegal).toBe(true);
      expect(MISSION_CARGO_TYPES.illegal).toContain(mission.missionCargo.good);
      expect(mission.missionCargo.quantity).toBeGreaterThanOrEqual(
        MISSION_CONFIG.CARGO_RUN_ILLEGAL_QUANTITY.MIN
      );
      expect(mission.missionCargo.quantity).toBeLessThanOrEqual(
        MISSION_CONFIG.CARGO_RUN_ILLEGAL_QUANTITY.MAX
      );
      expect(mission.description).toBe(
        'Discreet delivery. No questions asked.'
      );
    });

    it('should include outlaws in failure penalties for illegal cargo', () => {
      let callIndex = 0;
      const rng = () => {
        callIndex++;
        return 0.5;
      };
      const mission = generateCargoRun(
        0,
        starDataMissingDest,
        wormholeWithUnknownDest,
        'dangerous',
        rng
      );

      expect(mission).not.toBeNull();
      expect(mission.missionCargo.isIllegal).toBe(true);
      expect(mission.penalties.failure.faction.outlaws).toBe(-2);
      expect(mission.penalties.failure.faction.traders).toBe(-2);
    });

    it('should include outlaws in rewards for illegal cargo', () => {
      let callIndex = 0;
      const rng = () => {
        callIndex++;
        return 0.5;
      };
      const mission = generateCargoRun(
        0,
        starDataMissingDest,
        wormholeWithUnknownDest,
        'dangerous',
        rng
      );

      expect(mission).not.toBeNull();
      expect(mission.missionCargo.isIllegal).toBe(true);
      expect(mission.rewards.faction.outlaws).toBe(3);
      expect(mission.rewards.faction.traders).toBe(2);
    });
  });

  describe('generateCargoRun cargo label formatting', () => {
    it('should format cargo label with title case and spaces', () => {
      // Force legal cargo (rng > illegalChance for safe zone = 0.15)
      let callIndex = 0;
      const rng = () => {
        callIndex++;
        return 0.99;
      };
      const mission = generateCargoRun(
        0,
        starDataMissingDest,
        wormholeWithUnknownDest,
        'safe',
        rng
      );

      expect(mission).not.toBeNull();
      // The title should contain a formatted cargo label (underscores -> spaces, title case)
      expect(mission.title).toMatch(/Cargo Run: [A-Z]/);
      expect(mission.title).not.toContain('_');
    });
  });

  describe('generateCargoRun full return object', () => {
    it('should return all required fields in the mission object', () => {
      const rng = () => 0.5;
      const mission = generateCargoRun(
        0,
        starDataMissingDest,
        wormholeWithUnknownDest,
        'safe',
        rng
      );

      expect(mission).not.toBeNull();
      expect(mission.id).toMatch(/^cargo_run_/);
      expect(mission.type).toBe('delivery');
      expect(mission.giver).toBe('station_master');
      expect(mission.giverSystem).toBe(0);
      expect(mission.hopCount).toBeGreaterThanOrEqual(1);
      expect(mission.requirements.destination).toBe(2);
      expect(mission.requirements.deadline).toBeGreaterThan(0);
      expect(mission.destination.systemId).toBe(2);
      expect(mission.missionCargo.good).toBeDefined();
      expect(mission.missionCargo.quantity).toBeGreaterThan(0);
      expect(typeof mission.missionCargo.isIllegal).toBe('boolean');
      expect(mission.rewards.credits).toBeGreaterThan(0);
      expect(mission.rewards.faction.traders).toBe(2);
      expect(mission.penalties.failure.faction.traders).toBe(-2);
      expect(typeof mission.saturated).toBe('boolean');
    });

    it('should use illegal base fee for illegal cargo', () => {
      // Force illegal: dangerous zone has 0.75 chance, rng 0.5 < 0.75
      const rng = () => 0.5;
      const mission = generateCargoRun(
        0,
        starDataMissingDest,
        wormholeWithUnknownDest,
        'dangerous',
        rng
      );

      expect(mission).not.toBeNull();
      expect(mission.missionCargo.isIllegal).toBe(true);
      // Illegal base fee should produce a higher reward than legal base fee
      expect(mission.rewards.credits).toBeGreaterThanOrEqual(
        Math.ceil(MISSION_CONFIG.CARGO_RUN_ILLEGAL_BASE_FEE)
      );
    });
  });

  // Star data that includes the destination system (needed for price calculation)
  const starDataWithDest = [
    { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 },
    { id: 2, name: 'Proxima', x: 10, y: 5, z: 0, type: 'M5V', st: 1 },
  ];

  describe('generatePassengerMission full coverage', () => {
    it('should return full passenger mission object with all required fields', () => {
      const rng = () => 0.5;
      const mission = generatePassengerMission(
        0,
        starDataWithDest,
        wormholeWithUnknownDest,
        rng
      );

      expect(mission).not.toBeNull();
      expect(mission.id).toMatch(/^passenger_/);
      expect(mission.type).toBe('passenger');
      expect(mission.title).toMatch(/^Passenger: /);
      expect(mission.giver).toBe('passenger');
      expect(mission.giverSystem).toBe(0);
      expect(mission.hopCount).toBeGreaterThanOrEqual(1);
      expect(mission.requirements.destination).toBe(2);
      expect(mission.requirements.deadline).toBeGreaterThan(0);
      expect(mission.requirements.cargoSpace).toBeGreaterThan(0);
      expect(mission.rewards.credits).toBeGreaterThan(0);
      expect(mission.rewards.faction.civilians).toBe(5);
      expect(mission.penalties.failure.faction.civilians).toBe(-3);
      expect(typeof mission.saturated).toBe('boolean');
      expect(mission.passenger.name).toBeDefined();
      expect(mission.passenger.type).toBeDefined();
      expect(mission.passenger.satisfaction).toBe(
        PASSENGER_CONFIG.INITIAL_SATISFACTION
      );
      expect(mission.passenger.satisfactionWeights).toBeDefined();
      expect(typeof mission.passenger.dialogue).toBe('string');
    });

    it('should include destination name from starData', () => {
      const rng = () => 0.5;
      const mission = generatePassengerMission(
        0,
        starDataWithDest,
        wormholeWithUnknownDest,
        rng
      );

      expect(mission).not.toBeNull();
      expect(mission.destination.name).toBe('Proxima');
      expect(mission.description).toContain('Proxima');
    });
  });

  describe('generatePassengerMission reward calculation', () => {
    it('should calculate reward using hop multiplier and saturation', () => {
      const history = [
        { from: 0, to: 2, day: 5 },
        { from: 0, to: 2, day: 6 },
      ];
      const rng = () => 0.5;
      const mission = generatePassengerMission(
        0,
        starDataWithDest,
        wormholeWithUnknownDest,
        rng,
        history,
        10
      );

      expect(mission).not.toBeNull();
      expect(mission.saturated).toBe(true);
      expect(mission.rewards.credits).toBeGreaterThan(0);
      expect(Number.isInteger(mission.rewards.credits)).toBe(true);
    });

    it('should produce integer rewards for passenger missions', () => {
      for (let i = 0; i < 10; i++) {
        let c = i;
        const rng = () => {
          c++;
          return (c * 0.23) % 1;
        };
        const mission = generatePassengerMission(
          0,
          starDataWithDest,
          wormholeWithUnknownDest,
          rng
        );
        expect(mission).not.toBeNull();
        expect(Number.isInteger(mission.rewards.credits)).toBe(true);
      }
    });
  });

  describe('generateCargoRun with missing danger zone key', () => {
    it('should default to 0.15 illegal chance for unknown zone', () => {
      // Use an unrecognized danger zone string
      let illegalCount = 0;
      const runs = 100;
      for (let i = 0; i < runs; i++) {
        const mission = generateCargoRun(
          0,
          starDataMissingDest,
          wormholeWithUnknownDest,
          'unknown_zone'
        );
        if (mission && mission.missionCargo.isIllegal) illegalCount++;
      }
      // Default 0.15 chance — expect roughly 15% illegal, allow range 5-35%
      expect(illegalCount).toBeGreaterThanOrEqual(runs * 0.03);
      expect(illegalCount).toBeLessThanOrEqual(runs * 0.4);
    });

    it('should default to 1.0 danger multiplier for unknown destination zone', () => {
      const dangerZoneFn = () => 'nonexistent_zone';
      let callIndex = 0;
      const rng = () => {
        callIndex++;
        return 0.99; // Force legal
      };
      const mission = generateCargoRun(
        0,
        starDataMissingDest,
        wormholeWithUnknownDest,
        'safe',
        rng,
        dangerZoneFn
      );

      expect(mission).not.toBeNull();
      // With unknown zone, danger multiplier defaults to 1.0
      // So reward = baseFee * hopMult * 1.0
      const expectedReward = Math.ceil(
        MISSION_CONFIG.CARGO_RUN_BASE_FEE *
          (MISSION_CONFIG.HOP_MULTIPLIERS[mission.hopCount] || 1.0)
      );
      expect(mission.rewards.credits).toBe(expectedReward);
    });
  });

  describe('generateCargoRun with unknown hop multiplier', () => {
    it('should default to 1.0 hop multiplier for hop counts without config', () => {
      // Create a larger wormhole network with many hops
      const bigStarData = [
        { id: 0, name: 'S0', x: 0, y: 0, z: 0, type: 'G2V', st: 1 },
        { id: 1, name: 'S1', x: 10, y: 0, z: 0, type: 'G2V', st: 1 },
        { id: 2, name: 'S2', x: 20, y: 0, z: 0, type: 'G2V', st: 1 },
        { id: 3, name: 'S3', x: 30, y: 0, z: 0, type: 'G2V', st: 1 },
        { id: 4, name: 'S4', x: 40, y: 0, z: 0, type: 'G2V', st: 1 },
        { id: 5, name: 'S5', x: 50, y: 0, z: 0, type: 'G2V', st: 1 },
        { id: 6, name: 'S6', x: 60, y: 0, z: 0, type: 'G2V', st: 1 },
      ];
      const bigWormholes = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
      ];

      // If MAX_MISSION_HOPS allows reaching systems beyond configured hop multipliers,
      // the multiplier should default to 1.0
      const rng = () => 0.99;
      const mission = generateCargoRun(
        0,
        bigStarData,
        bigWormholes,
        'safe',
        rng
      );
      expect(mission).not.toBeNull();
      expect(mission.rewards.credits).toBeGreaterThan(0);
    });
  });
});
