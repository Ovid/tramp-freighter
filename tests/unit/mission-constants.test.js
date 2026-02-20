import { describe, it, expect } from 'vitest';
import { MISSION_CONFIG } from '../../src/game/constants.js';

describe('Mission Constants', () => {
  it('should export MISSION_CONFIG with required fields', () => {
    expect(MISSION_CONFIG).toBeDefined();
    expect(MISSION_CONFIG.TYPES).toEqual(
      expect.arrayContaining([
        'delivery',
        'fetch',
        'passenger',
        'intel',
        'special',
      ])
    );
    expect(MISSION_CONFIG.MAX_ACTIVE).toBeGreaterThan(0);
    expect(MISSION_CONFIG.BOARD_SIZE).toBeGreaterThan(0);
    expect(MISSION_CONFIG.BOARD_REFRESH_DAYS).toBeGreaterThan(0);
    expect(MISSION_CONFIG.DEADLINE_BUFFER_DAYS).toBeGreaterThan(0);
    expect(MISSION_CONFIG.REWARD_MARKUP).toBeGreaterThan(0);
  });
});

describe('Mission Arbitrage Fix Constants', () => {
  it('should have hop multipliers array with entries for 0-3 hops', () => {
    expect(MISSION_CONFIG.HOP_MULTIPLIERS).toEqual([1.0, 1.0, 2.0, 3.5]);
  });

  it('should have danger multipliers for all zones', () => {
    expect(MISSION_CONFIG.DANGER_MULTIPLIERS).toEqual({
      safe: 1.0,
      contested: 1.5,
      dangerous: 2.0,
    });
  });

  it('should have MAX_MISSION_HOPS set to 3', () => {
    expect(MISSION_CONFIG.MAX_MISSION_HOPS).toBe(3);
  });

  it('should have MIN_BOARD_SIZE set to 1', () => {
    expect(MISSION_CONFIG.MIN_BOARD_SIZE).toBe(1);
  });

  it('should have DAYS_PER_HOP_ESTIMATE for deadline calculation', () => {
    expect(MISSION_CONFIG.DAYS_PER_HOP_ESTIMATE).toBe(6);
  });

  it('should have route saturation constants', () => {
    expect(MISSION_CONFIG.SATURATION_WINDOW_DAYS).toBe(30);
    expect(MISSION_CONFIG.SATURATION_PENALTY_PER_RUN).toBe(0.25);
    expect(MISSION_CONFIG.SATURATION_FLOOR).toBe(0.25);
    expect(MISSION_CONFIG.SATURATION_MAX_HISTORY).toBe(50);
  });
});
