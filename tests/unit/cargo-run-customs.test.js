import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MISSION_CARGO_TYPES } from '../../src/game/constants.js';
import { DangerManager } from '../../src/game/state/managers/danger.js';

describe('Customs – illegal mission cargo detection', () => {
  let manager;

  beforeEach(() => {
    manager = new DangerManager({
      state: {},
      emit: vi.fn(),
      isTestEnvironment: true,
    });
  });

  it('should count illegal mission cargo as restricted', () => {
    const cargo = [
      { good: 'unmarked_crates', qty: 5, missionId: 'cargo_run_1' },
    ];
    const count = manager.countRestrictedGoods(cargo, 'safe', 0);
    expect(count).toBeGreaterThan(0);
  });

  it('should not count legal mission cargo as restricted', () => {
    const cargo = [
      { good: 'registered_freight', qty: 10, missionId: 'cargo_run_2' },
    ];
    const count = manager.countRestrictedGoods(cargo, 'safe', 0);
    // registered_freight is legal, should not be counted
    expect(count).toBe(0);
  });

  it('should count both regular restricted goods and illegal mission cargo', () => {
    const cargo = [
      { good: 'electronics', qty: 5 }, // restricted in safe zone
      { good: 'prohibited_tech', qty: 3, missionId: 'cargo_run_3' },
    ];
    const count = manager.countRestrictedGoods(cargo, 'safe', 0);
    expect(count).toBe(2); // electronics + prohibited_tech
  });

  it('should count all illegal mission cargo types', () => {
    for (const illegalGood of MISSION_CARGO_TYPES.illegal) {
      const cargo = [{ good: illegalGood, qty: 1, missionId: 'test' }];
      const count = manager.countRestrictedGoods(cargo, 'safe', 99);
      expect(count).toBeGreaterThan(0);
    }
  });
});
