import { describe, it, expect, beforeEach } from 'vitest';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

const TEST_STARS = [
  { id: 0, x: 0, y: 0, z: 0, name: 'Sol' },
  { id: 1, x: 10, y: 0, z: 0, name: 'Alpha Centauri' },
];
const TEST_WORMHOLES = [[0, 1]];

describe('Critical Damage Jump Validation', () => {
  let nav;

  beforeEach(() => {
    nav = new NavigationSystem(TEST_STARS, TEST_WORMHOLES);
  });

  it('should block jump when hull is at critical threshold', () => {
    const result = nav.validateJump(0, 1, 100, 100, null, [], 1.0, {
      hull: REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD,
      engine: 100,
      lifeSupport: 100,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Hull');
    expect(result.error).toContain('20%');
  });

  it('should block jump when engine is below critical threshold', () => {
    const result = nav.validateJump(0, 1, 100, 10, null, [], 1.0, {
      hull: 100,
      engine: 10,
      lifeSupport: 100,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Engine');
  });

  it('should block jump when life support is at 0%', () => {
    const result = nav.validateJump(0, 1, 100, 100, null, [], 1.0, {
      hull: 100,
      engine: 100,
      lifeSupport: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Life Support');
  });

  it('should list all critical systems in error message', () => {
    const result = nav.validateJump(0, 1, 100, 5, null, [], 1.0, {
      hull: 5,
      engine: 5,
      lifeSupport: 5,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Hull');
    expect(result.error).toContain('Engine');
    expect(result.error).toContain('Life Support');
  });

  it('should allow jump when all systems are above critical threshold', () => {
    const result = nav.validateJump(0, 1, 100, 21, null, [], 1.0, {
      hull: 21,
      engine: 21,
      lifeSupport: 21,
    });
    expect(result.valid).toBe(true);
  });

  it('should allow jump when shipCondition is not provided (backward compat)', () => {
    const result = nav.validateJump(0, 1, 100, 100);
    expect(result.valid).toBe(true);
  });
});
