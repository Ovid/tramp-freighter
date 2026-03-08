import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InspectionManager } from '@game/state/managers/inspection.js';
import { INSPECTION_CONFIG } from '@game/constants.js';

describe('Inspection flee outcome', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have fuel and hull costs for fleeing', () => {
    const manager = new InspectionManager({
      emit: vi.fn(),
      markDirty: vi.fn(),
      isTestEnvironment: true,
    });
    const result = manager.resolveInspectionFlee();

    expect(result.costs.fuel).toBe(INSPECTION_CONFIG.FLEE.FUEL_COST);
    expect(result.costs.hull).toBe(INSPECTION_CONFIG.FLEE.HULL_COST);
  });

  it('should not contain unhandled fields', () => {
    const manager = new InspectionManager({
      emit: vi.fn(),
      markDirty: vi.fn(),
      isTestEnvironment: true,
    });
    const result = manager.resolveInspectionFlee();

    expect(result).not.toHaveProperty('triggerPatrolCombat');
  });

  it('should have honest description without pursuit claim', () => {
    const manager = new InspectionManager({
      emit: vi.fn(),
      markDirty: vi.fn(),
      isTestEnvironment: true,
    });
    const result = manager.resolveInspectionFlee();

    expect(result.description).not.toContain('pursuit');
  });
});
