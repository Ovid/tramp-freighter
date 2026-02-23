import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RepairManager } from '../../src/game/state/managers/repair.js';
import { REPAIR_CONFIG } from '../../src/game/constants.js';

describe('Emergency Patch', () => {
  let repairManager;
  let mockGSM;
  let mockState;

  beforeEach(() => {
    mockState = {
      player: { credits: 0, daysElapsed: 10 },
      ship: { hull: 5, engine: 80, lifeSupport: 90 },
    };

    mockGSM = {
      state: mockState,
      updateShipCondition: vi.fn(),
      updateTime: vi.fn(),
      saveGame: vi.fn(),
      markDirty: vi.fn(),
    };

    repairManager = new RepairManager(mockGSM);
    repairManager.getState = () => mockState;
    repairManager.validateState = () => {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set system to EMERGENCY_PATCH_TARGET (21%)', () => {
    const result = repairManager.applyEmergencyPatch('hull');

    expect(result.success).toBe(true);
    expect(mockGSM.updateShipCondition).toHaveBeenCalledWith(
      REPAIR_CONFIG.EMERGENCY_PATCH_TARGET,
      80,
      90
    );
  });

  it('should advance time by EMERGENCY_PATCH_DAYS_PENALTY days', () => {
    repairManager.applyEmergencyPatch('hull');

    expect(mockGSM.updateTime).toHaveBeenCalledWith(
      10 + REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY
    );
  });

  it('should reject patch for system above critical threshold', () => {
    mockState.ship.engine = 50;
    const result = repairManager.applyEmergencyPatch('engine');

    expect(result.success).toBe(false);
    expect(result.reason).toContain('not critically damaged');
  });

  it('should reject patch for invalid system type', () => {
    const result = repairManager.applyEmergencyPatch('weapons');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('Invalid system type');
  });

  it('should reject patch when player can afford repair above threshold', () => {
    mockState.player.credits = 1000;
    const result = repairManager.applyEmergencyPatch('hull');

    expect(result.success).toBe(false);
    expect(result.reason).toContain('afford');
  });

  it('should save game after successful patch', () => {
    repairManager.applyEmergencyPatch('hull');

    expect(mockGSM.markDirty).toHaveBeenCalled();
  });
});
