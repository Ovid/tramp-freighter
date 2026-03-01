import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';

describe('removeRestrictedCargo', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
    // Default system is Sol (ID 0): 'safe' zone → restricts 'electronics'
    // Core system restrictions → restricts 'parts'
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes restricted goods from cargo at current system', () => {
    gsm.updateCargo([
      { good: 'electronics', qty: 5, buyPrice: 100 },
      { good: 'food', qty: 10, buyPrice: 20 },
    ]);

    gsm.removeRestrictedCargo();

    const cargo = gsm.getState().ship.cargo;
    expect(cargo.find((c) => c.good === 'electronics')).toBeUndefined();
    expect(cargo.find((c) => c.good === 'food').qty).toBe(10);
  });

  it('removes core-system-restricted goods (parts) at Sol', () => {
    gsm.updateCargo([
      { good: 'parts', qty: 3, buyPrice: 150 },
      { good: 'food', qty: 10, buyPrice: 20 },
    ]);

    gsm.removeRestrictedCargo();

    const cargo = gsm.getState().ship.cargo;
    expect(cargo.find((c) => c.good === 'parts')).toBeUndefined();
    expect(cargo.find((c) => c.good === 'food').qty).toBe(10);
  });

  it('removes illegal mission cargo', () => {
    gsm.updateCargo([
      { good: 'unmarked_crates', qty: 2, buyPrice: 0, missionId: 'mission_1' },
      { good: 'food', qty: 5, buyPrice: 20 },
    ]);

    gsm.removeRestrictedCargo();

    const cargo = gsm.getState().ship.cargo;
    expect(cargo.find((c) => c.missionId === 'mission_1')).toBeUndefined();
    expect(cargo.find((c) => c.good === 'food').qty).toBe(5);
  });

  it('keeps cargo when nothing is restricted', () => {
    gsm.updateCargo([
      { good: 'food', qty: 10, buyPrice: 20 },
      { good: 'water', qty: 8, buyPrice: 15 },
    ]);

    gsm.removeRestrictedCargo();

    expect(gsm.getState().ship.cargo).toHaveLength(2);
  });
});
