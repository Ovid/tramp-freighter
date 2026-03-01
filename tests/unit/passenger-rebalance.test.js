import { describe, it, expect, vi } from 'vitest';
import {
  generatePassengerMission,
} from '../../src/game/mission-generator.js';
import {
  PASSENGER_CONFIG,
  MISSION_CONFIG,
  COMMODITY_TYPES,
} from '../../src/game/constants.js';
import { calculateSystemPrices } from '../../src/game/utils/calculators.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Passenger Payment Rebalance', () => {
  describe('constants', () => {
    it('should define PASSENGER_PREMIUM in MISSION_CONFIG', () => {
      expect(MISSION_CONFIG.PASSENGER_PREMIUM).toBe(1.25);
    });

    it('should define PASSENGER_MARGIN_FLOOR in MISSION_CONFIG', () => {
      expect(MISSION_CONFIG.PASSENGER_MARGIN_FLOOR).toBe(5);
    });

    it('should not have PAYMENT_TIERS in PASSENGER_CONFIG', () => {
      expect(PASSENGER_CONFIG.PAYMENT_TIERS).toBeUndefined();
    });

    it('should not have paymentTier on any passenger type', () => {
      for (const [typeName, config] of Object.entries(PASSENGER_CONFIG.TYPES)) {
        expect(config.paymentTier).toBeUndefined();
      }
    });
  });

  describe('margin-based payment formula', () => {
    // Use a fixed RNG that always returns 0.5 so we get deterministic type selection
    const fixedRng = () => 0.5;

    it('should compute reward based on best route margin', () => {
      const mission = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        fixedRng,
        [],
        0
      );

      const fromSystem = TEST_STAR_DATA.find((s) => s.id === 0);
      const destSystem = TEST_STAR_DATA.find(
        (s) => s.id === mission.requirements.destination
      );

      const originPrices = calculateSystemPrices(fromSystem, 0, [], {});
      const destPrices = calculateSystemPrices(destSystem, 0, [], {});

      const bestMargin = Math.max(
        MISSION_CONFIG.PASSENGER_MARGIN_FLOOR,
        ...COMMODITY_TYPES.map((good) => destPrices[good] - originPrices[good])
      );

      const typeConfig = PASSENGER_CONFIG.TYPES[mission.passenger.type];
      const expected = Math.ceil(
        bestMargin * typeConfig.cargoSpace * MISSION_CONFIG.PASSENGER_PREMIUM
      );

      expect(mission.rewards.credits).toBe(expected);
    });

    it('should use PASSENGER_MARGIN_FLOOR when no goods are profitable', () => {
      // Mock calculateSystemPrices so all goods are cheaper at destination
      // We do this by using systems where origin prices > dest prices for all goods
      // Instead, we directly verify the floor logic by checking the formula
      // with two identical systems (margin = 0 for all goods)
      const sameSystemStarData = [
        { id: 0, x: 0, y: 0, z: 0, name: 'System A', type: 'G2', wh: 8, st: 6, r: 1 },
        { id: 1, x: 0, y: 0, z: 0, name: 'System B', type: 'G2', wh: 8, st: 6, r: 1 },
      ];
      const sameSystemWormholes = [[0, 1]];

      const mission = generatePassengerMission(
        0,
        sameSystemStarData,
        sameSystemWormholes,
        fixedRng,
        [],
        0
      );

      // With identical systems, all margins are 0, so floor of 5 is used
      const typeConfig = PASSENGER_CONFIG.TYPES[mission.passenger.type];
      const expected = Math.ceil(
        MISSION_CONFIG.PASSENGER_MARGIN_FLOOR *
          typeConfig.cargoSpace *
          MISSION_CONFIG.PASSENGER_PREMIUM
      );

      expect(mission.rewards.credits).toBe(expected);
    });

    it('should scale reward by cargoSpace of passenger type', () => {
      // Generate many missions and verify the ratio between reward and cargoSpace
      const missions = [];
      for (let i = 0; i < 50; i++) {
        const rng = () => (i * 7 + 3) % 100 / 100;
        const mission = generatePassengerMission(
          0,
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA,
          rng,
          [],
          0
        );
        if (mission) missions.push(mission);
      }

      // For each mission, reward should equal ceil(bestMargin * cargoSpace * PREMIUM * saturation)
      for (const mission of missions) {
        const fromSystem = TEST_STAR_DATA.find((s) => s.id === 0);
        const destSystem = TEST_STAR_DATA.find(
          (s) => s.id === mission.requirements.destination
        );
        const originPrices = calculateSystemPrices(fromSystem, 0, [], {});
        const destPrices = calculateSystemPrices(destSystem, 0, [], {});
        const bestMargin = Math.max(
          MISSION_CONFIG.PASSENGER_MARGIN_FLOOR,
          ...COMMODITY_TYPES.map((good) => destPrices[good] - originPrices[good])
        );
        const typeConfig = PASSENGER_CONFIG.TYPES[mission.passenger.type];
        const expected = Math.ceil(
          bestMargin * typeConfig.cargoSpace * MISSION_CONFIG.PASSENGER_PREMIUM
        );
        expect(mission.rewards.credits).toBe(expected);
      }
    });

    it('should apply saturation multiplier to margin-based reward', () => {
      const fromSystem = 0;
      const toSystem = 1; // Alpha Centauri, connected to Sol

      // Create history that saturates Sol->Alpha Centauri route
      const completionHistory = [
        { from: fromSystem, to: toSystem, day: 0 },
        { from: fromSystem, to: toSystem, day: 0 },
        { from: fromSystem, to: toSystem, day: 0 },
      ];

      // RNG that always picks the first reachable system (Alpha Centauri = id 1)
      const rng = () => 0.0001;

      const unsaturated = generatePassengerMission(
        fromSystem,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        rng,
        [],
        1
      );

      const saturated = generatePassengerMission(
        fromSystem,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        rng,
        completionHistory,
        1
      );

      // Both go to the same destination, same passenger type
      expect(unsaturated.requirements.destination).toBe(
        saturated.requirements.destination
      );
      expect(unsaturated.passenger.type).toBe(saturated.passenger.type);

      // Saturated reward should be lower
      expect(saturated.rewards.credits).toBeLessThan(
        unsaturated.rewards.credits
      );
    });

    it('should always produce integer credit rewards', () => {
      for (let i = 0; i < 30; i++) {
        const seed = i / 30;
        const rng = () => seed;
        const mission = generatePassengerMission(
          0,
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA,
          rng,
          [],
          i
        );
        if (mission) {
          expect(Number.isInteger(mission.rewards.credits)).toBe(true);
        }
      }
    });

    it('should produce positive rewards for all passenger types', () => {
      const typeNames = Object.keys(PASSENGER_CONFIG.TYPES);
      for (let i = 0; i < typeNames.length; i++) {
        // Craft RNG to select each passenger type
        const typeIndex = i;
        let callCount = 0;
        const rng = () => {
          callCount++;
          // The pickWeightedDestination uses call 1, pickRandomFrom(typeNames) uses call 2
          // pickRandomFrom(dialogue) uses call 3
          if (callCount === 2) {
            return typeIndex / typeNames.length;
          }
          return 0.5;
        };

        const mission = generatePassengerMission(
          0,
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA,
          rng,
          [],
          0
        );

        if (mission) {
          expect(mission.rewards.credits).toBeGreaterThan(0);
        }
      }
    });

    it('should use currentDay for price calculations', () => {
      const rng = () => 0.5;

      // Generate missions at different days - prices vary by temporal modifier
      const missionDay0 = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        rng,
        [],
        0
      );

      const missionDay15 = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        rng,
        [],
        15
      );

      // Same type, same destination, but prices can differ by day due to temporal modifiers
      // At minimum, we verify both produce valid rewards
      expect(missionDay0.rewards.credits).toBeGreaterThan(0);
      expect(missionDay15.rewards.credits).toBeGreaterThan(0);
    });
  });
});
