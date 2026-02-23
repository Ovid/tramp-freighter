import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RepairManager } from '../../src/game/state/managers/repair.js';

describe('System Cannibalization', () => {
  let repairManager;
  let mockGSM;
  let mockState;

  beforeEach(() => {
    mockState = {
      player: { credits: 0 },
      ship: { hull: 5, engine: 80, lifeSupport: 90 },
    };

    mockGSM = {
      state: mockState,
      updateShipCondition: vi.fn(),
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

  it('should raise target to EMERGENCY_PATCH_TARGET', () => {
    // Hull at 5%, needs 16% to reach 21%. At 1.5x waste, costs 24% from donors.
    const result = repairManager.cannibalizeSystem('hull', [
      { system: 'engine', amount: 12 },
      { system: 'lifeSupport', amount: 12 },
    ]);

    expect(result.success).toBe(true);
    // Hull: 21%, Engine: 80-12=68, LifeSupport: 90-12=78
    expect(mockGSM.updateShipCondition).toHaveBeenCalledWith(21, 68, 78);
  });

  it('should apply 1.5x waste multiplier — donated amount must be 1.5x gain', () => {
    // Hull needs 16% gain. Donations must total at least 16 * 1.5 = 24
    const result = repairManager.cannibalizeSystem('hull', [
      { system: 'engine', amount: 23 }, // Only 23, need 24
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('insufficient');
  });

  it('should reject when target is not critically damaged', () => {
    mockState.ship.hull = 50;
    const result = repairManager.cannibalizeSystem('hull', [
      { system: 'engine', amount: 10 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('not critically damaged');
  });

  it('should reject when donor would go below CANNIBALIZE_DONOR_MIN', () => {
    mockState.ship.engine = 30;
    // Engine at 30, donating 10 would bring it to 20 (below 21 min)
    const result = repairManager.cannibalizeSystem('hull', [
      { system: 'engine', amount: 10 },
      { system: 'lifeSupport', amount: 14 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('Engine');
    expect(result.reason).toContain('below');
  });

  it('should reject when donor is itself critically damaged', () => {
    mockState.ship.engine = 15;
    const result = repairManager.cannibalizeSystem('hull', [
      { system: 'engine', amount: 10 },
    ]);

    expect(result.success).toBe(false);
  });

  it('should reject invalid target system type', () => {
    const result = repairManager.cannibalizeSystem('weapons', []);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('Invalid system type');
  });

  it('should reject when target is also a donor', () => {
    const result = repairManager.cannibalizeSystem('hull', [
      { system: 'hull', amount: 10 },
    ]);

    expect(result.success).toBe(false);
    expect(result.reason).toContain('cannot donate to itself');
  });

  it('should save game after successful cannibalization', () => {
    repairManager.cannibalizeSystem('hull', [{ system: 'engine', amount: 24 }]);

    expect(mockGSM.markDirty).toHaveBeenCalled();
  });
});
