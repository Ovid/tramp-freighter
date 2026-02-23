import { describe, it, expect } from 'vitest';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

describe('Critical Damage Confinement Constants', () => {
  it.each([
    ['CRITICAL_SYSTEM_THRESHOLD', 20],
    ['EMERGENCY_PATCH_TARGET', 21],
    ['EMERGENCY_PATCH_DAYS_PENALTY', 3],
    ['CANNIBALIZE_WASTE_MULTIPLIER', 1.5],
    ['CANNIBALIZE_DONOR_MIN', 21],
  ])('REPAIR_CONFIG should have %s of %s', (property, expectedValue) => {
    expect(REPAIR_CONFIG[property]).toBe(expectedValue);
  });

  it('EMERGENCY_PATCH_TARGET should be exactly 1 above CRITICAL_SYSTEM_THRESHOLD', () => {
    expect(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET).toBe(
      REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD + 1
    );
  });
});
