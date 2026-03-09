import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { REPAIR_CONFIG } from '@game/constants.js';

describe('Repair NPC discount', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGame();
    // Damage hull to allow repair
    const state = gsm.getState();
    gsm.updateShipCondition(50, state.ship.engine, state.ship.lifeSupport);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies discount to repair cost when discount is provided', () => {
    const initialCredits = gsm.getState().player.credits;
    const amount = 20;
    const discount = 0.15;

    const result = gsm.repairShipSystem('hull', amount, discount);
    expect(result.success).toBe(true);

    const fullCost = amount * REPAIR_CONFIG.COST_PER_PERCENT;
    const expectedCost = Math.ceil(fullCost * (1 - discount));
    const actualCreditsSpent = initialCredits - gsm.getState().player.credits;
    expect(actualCreditsSpent).toBe(expectedCost);
  });

  it('charges full price when no discount provided', () => {
    const initialCredits = gsm.getState().player.credits;
    const amount = 20;

    const result = gsm.repairShipSystem('hull', amount);
    expect(result.success).toBe(true);

    const expectedCost = amount * REPAIR_CONFIG.COST_PER_PERCENT;
    const actualCreditsSpent = initialCredits - gsm.getState().player.credits;
    expect(actualCreditsSpent).toBe(expectedCost);
  });
});
