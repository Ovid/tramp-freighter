import { describe, it, expect } from 'vitest';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

describe('Critical Damage Confinement Constants', () => {
  it('REPAIR_CONFIG should have CRITICAL_SYSTEM_THRESHOLD of 20', () => {
    expect(REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD).toBe(20);
  });

  it('REPAIR_CONFIG should have EMERGENCY_PATCH_TARGET of 21', () => {
    expect(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET).toBe(21);
  });

  it('REPAIR_CONFIG should have EMERGENCY_PATCH_DAYS_PENALTY of 3', () => {
    expect(REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY).toBe(3);
  });

  it('REPAIR_CONFIG should have CANNIBALIZE_WASTE_MULTIPLIER of 1.5', () => {
    expect(REPAIR_CONFIG.CANNIBALIZE_WASTE_MULTIPLIER).toBe(1.5);
  });

  it('REPAIR_CONFIG should have CANNIBALIZE_DONOR_MIN of 21', () => {
    expect(REPAIR_CONFIG.CANNIBALIZE_DONOR_MIN).toBe(21);
  });

  it('EMERGENCY_PATCH_TARGET should be exactly 1 above CRITICAL_SYSTEM_THRESHOLD', () => {
    expect(REPAIR_CONFIG.EMERGENCY_PATCH_TARGET).toBe(
      REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD + 1
    );
  });
});
