import { describe, it, expect } from 'vitest';
import { TANAKA_SUPPLY_CONFIG } from '../../src/game/constants.js';

describe('Tanaka Supply Run constants', () => {
  it('exports TANAKA_SUPPLY_CONFIG with required fields', () => {
    expect(TANAKA_SUPPLY_CONFIG).toBeDefined();
    expect(TANAKA_SUPPLY_CONFIG.QUANTITY).toBe(5);
    expect(TANAKA_SUPPLY_CONFIG.REP_GAIN).toBe(1);
    expect(TANAKA_SUPPLY_CONFIG.COOLDOWN_DAYS).toBe(7);
    expect(TANAKA_SUPPLY_CONFIG.GOODS).toEqual(['electronics', 'medicine']);
  });
});
