import { describe, it, expect } from 'vitest';
import { MISSION_CONFIG } from '../../src/game/constants.js';

describe('Mission Constants', () => {
  it('should export MISSION_CONFIG with required fields', () => {
    expect(MISSION_CONFIG).toBeDefined();
    expect(MISSION_CONFIG.TYPES).toEqual(
      expect.arrayContaining(['delivery', 'fetch', 'passenger', 'intel', 'special'])
    );
    expect(MISSION_CONFIG.MAX_ACTIVE).toBeGreaterThan(0);
    expect(MISSION_CONFIG.BOARD_SIZE).toBeGreaterThan(0);
    expect(MISSION_CONFIG.BOARD_REFRESH_DAYS).toBeGreaterThan(0);
    expect(MISSION_CONFIG.DEADLINE_BUFFER_DAYS).toBeGreaterThan(0);
    expect(MISSION_CONFIG.REWARD_MARKUP).toBeGreaterThan(0);
  });
});
