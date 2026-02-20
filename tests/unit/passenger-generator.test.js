import { describe, it, expect } from 'vitest';
import {
  generatePassengerMission,
  generateMissionBoard,
} from '../../src/game/mission-generator.js';
import { PASSENGER_CONFIG } from '../../src/game/constants.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Passenger Mission Generation', () => {
  describe('generatePassengerMission', () => {
    it('should generate a valid passenger mission', () => {
      const mission = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA
      );

      expect(mission.id).toMatch(/^passenger_/);
      expect(mission.type).toBe('passenger');
      expect(mission.title).toContain('Passenger:');
      expect(mission.requirements.destination).toBeDefined();
      expect(mission.requirements.deadline).toBeGreaterThan(0);
      expect(mission.rewards.credits).toBeGreaterThan(0);
    });

    it('should include passenger data on the mission', () => {
      const mission = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA
      );

      expect(mission.passenger).toBeDefined();
      expect(mission.passenger.name).toBeTruthy();
      expect(Object.keys(PASSENGER_CONFIG.TYPES)).toContain(
        mission.passenger.type
      );
      expect(mission.passenger.satisfaction).toBe(
        PASSENGER_CONFIG.INITIAL_SATISFACTION
      );
      expect(mission.passenger.satisfactionWeights).toBeDefined();
      expect(mission.passenger.dialogue).toBeDefined();
    });

    it('should set cargoSpace requirement matching passenger type', () => {
      const mission = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA
      );

      const expectedSpace =
        PASSENGER_CONFIG.TYPES[mission.passenger.type].cargoSpace;
      expect(mission.requirements.cargoSpace).toBe(expectedSpace);
    });

    it('should generate destination that is a reachable system', () => {
      const mission = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA
      );
      expect([1, 4, 5, 7, 13]).toContain(mission.requirements.destination);
    });

    it('should generate integer credit rewards', () => {
      for (let i = 0; i < 20; i++) {
        const mission = generatePassengerMission(
          0,
          TEST_STAR_DATA,
          TEST_WORMHOLE_DATA
        );
        expect(Number.isInteger(mission.rewards.credits)).toBe(true);
      }
    });

    it('should use seeded RNG when provided', () => {
      let callCount = 0;
      const seededRng = () => {
        callCount++;
        return 0.5;
      };

      const m1 = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        seededRng
      );
      const firstCallCount = callCount;
      callCount = 0;
      const m2 = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        seededRng
      );

      expect(m1.passenger.type).toBe(m2.passenger.type);
      expect(m1.requirements.destination).toBe(m2.requirements.destination);
      expect(firstCallCount).toBe(callCount);
    });
  });

  describe('generateMissionBoard with passengers', () => {
    it('should include passenger missions on the board', () => {
      const boards = [];
      for (let i = 0; i < 50; i++) {
        boards.push(
          generateMissionBoard(0, TEST_STAR_DATA, TEST_WORMHOLE_DATA)
        );
      }
      const hasPassenger = boards.some((board) =>
        board.some((m) => m.type === 'passenger')
      );
      expect(hasPassenger).toBe(true);
    });
  });
});
