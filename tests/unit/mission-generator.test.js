import { describe, it, expect } from 'vitest';
import { generateCargoRun, generateMissionBoard } from '../../src/game/mission-generator.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Mission Generator', () => {
  describe('generateCargoRun', () => {
    it('should generate a valid delivery mission', () => {
      const mission = generateCargoRun(0, TEST_STAR_DATA, TEST_WORMHOLE_DATA);

      expect(mission.id).toMatch(/^cargo_run_/);
      expect(mission.type).toBe('delivery');
      expect(mission.title).toContain('Cargo Run');
      expect(mission.requirements).toHaveProperty('cargo');
      expect(mission.requirements).toHaveProperty('quantity');
      expect(mission.requirements).toHaveProperty('destination');
      expect(mission.requirements).toHaveProperty('deadline');
      expect(mission.requirements.quantity).toBeGreaterThan(0);
      expect(mission.requirements.deadline).toBeGreaterThan(0);
      expect(mission.rewards.credits).toBeGreaterThan(0);
    });

    it('should generate destination that is a connected system', () => {
      const mission = generateCargoRun(0, TEST_STAR_DATA, TEST_WORMHOLE_DATA);
      // Sol (0) connects to: Alpha Centauri A (1), Barnard's Star (4), Sirius A (7)
      expect([1, 4, 7]).toContain(mission.requirements.destination);
    });

    it('should generate integer reward (no floating point)', () => {
      for (let i = 0; i < 20; i++) {
        const mission = generateCargoRun(0, TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        expect(Number.isInteger(mission.rewards.credits)).toBe(true);
      }
    });
  });

  describe('generateMissionBoard', () => {
    it('should generate the configured number of missions', () => {
      const board = generateMissionBoard(0, TEST_STAR_DATA, TEST_WORMHOLE_DATA);
      expect(board.length).toBeGreaterThan(0);
      expect(board.length).toBeLessThanOrEqual(3);
    });

    it('should generate unique mission IDs', () => {
      const board = generateMissionBoard(0, TEST_STAR_DATA, TEST_WORMHOLE_DATA);
      const ids = board.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
