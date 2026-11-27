import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepairManager } from '../../src/game/state/managers/repair.js';

describe('RepairManager Repair All and standard-repair affordability', () => {
  let state;
  let capabilities;
  let manager;

  beforeEach(() => {
    state = { credits: 1000, hull: 99, engine: 99, lifeSupport: 99 };
    capabilities = {
      getShipCondition: () => ({
        hull: state.hull,
        engine: state.engine,
        lifeSupport: state.lifeSupport,
      }),
      getCredits: () => state.credits,
      updateCredits: vi.fn((c) => {
        state.credits = c;
      }),
      updateShipCondition: vi.fn((h, e, l) => {
        Object.assign(state, { hull: h, engine: e, lifeSupport: l });
      }),
      markDirty: vi.fn(),
      isTestEnvironment: true,
    };
    manager = new RepairManager(capabilities);
  });

  it('prices Repair All with one round-up over the discounted total', () => {
    expect(manager.getRepairAllCost(0.1)).toBe(14);
    expect(manager.getRepairAllCost()).toBe(15);
  });

  it('charges the Repair All price once and restores every system', () => {
    const result = manager.repairAll(0.1);

    expect(result).toEqual({ success: true, reason: null });
    expect(state.credits).toBe(986);
    expect(capabilities.updateCredits).toHaveBeenCalledTimes(1);
    expect(state).toMatchObject({ hull: 100, engine: 100, lifeSupport: 100 });
    expect(capabilities.markDirty).toHaveBeenCalled();
  });

  it('refuses Repair All without charging when credits fall short', () => {
    state.credits = 13;

    const result = manager.repairAll(0.1);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('Insufficient credits for full repair');
    expect(capabilities.updateCredits).not.toHaveBeenCalled();
    expect(capabilities.updateShipCondition).not.toHaveBeenCalled();
  });

  it('refuses Repair All when every system is already at maximum', () => {
    Object.assign(state, { hull: 100, engine: 100, lifeSupport: 100 });

    const result = manager.repairAll();

    expect(result.success).toBe(false);
    expect(result.reason).toBe('All systems already at maximum condition');
    expect(manager.getRepairAllCost()).toBe(0);
  });

  describe('repair prices round up to whole credits', () => {
    it('rounds a fractional amount up', () => {
      expect(manager.getRepairCost('hull', 20.7, 0)).toBe(104);
      expect(manager.getRepairCost('hull', 10.1, 0)).toBe(51);
    });

    it('leaves a whole-number cost unchanged', () => {
      expect(manager.getRepairCost('hull', 10, 0)).toBe(50);
    });

    it('rounds a discounted price up, not to nearest', () => {
      // 13 * 5 = 65; 65 * 0.88 = 57.2
      expect(manager.getRepairCost('hull', 13, 0, 0.12)).toBe(58);
    });

    it('rounds a discounted Repair All total up, not to nearest', () => {
      // 14% missing * 5 = 70; 70 * 0.85 = 59.5
      Object.assign(state, { hull: 93, engine: 93, lifeSupport: 100 });
      expect(manager.getRepairAllCost(0.15)).toBe(60);
    });
  });

  it('reports whether a standard repair to the patch target is affordable', () => {
    state.hull = 10;
    state.credits = 55;
    expect(manager.canAffordStandardRepair('hull')).toBe(true);

    state.credits = 54;
    expect(manager.canAffordStandardRepair('hull')).toBe(false);

    state.hull = 50;
    state.credits = 0;
    expect(manager.canAffordStandardRepair('hull')).toBe(true);
  });
});
