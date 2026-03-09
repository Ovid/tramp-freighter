import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGame } from '../test-utils.js';

describe('Refuel NPC discount', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGame();
    // Reduce fuel so there's room to refuel
    gsm.updateFuel(50);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies discount to refuel cost when discount is provided', () => {
    const fuelPrice = gsm.getFuelPrice(gsm.getState().player.currentSystem);
    const initialCredits = gsm.getState().player.credits;
    const amount = 10;
    const discount = 0.15; // 15% discount

    const result = gsm.refuel(amount, discount);
    expect(result.success).toBe(true);

    const expectedCost = Math.ceil(amount * fuelPrice * (1 - discount));
    const actualCreditsSpent = initialCredits - gsm.getState().player.credits;
    expect(actualCreditsSpent).toBe(expectedCost);
  });

  it('charges full price when no discount provided', () => {
    const fuelPrice = gsm.getFuelPrice(gsm.getState().player.currentSystem);
    const initialCredits = gsm.getState().player.credits;
    const amount = 10;

    const result = gsm.refuel(amount);
    expect(result.success).toBe(true);

    const expectedCost = Math.ceil(amount * fuelPrice);
    const actualCreditsSpent = initialCredits - gsm.getState().player.credits;
    expect(actualCreditsSpent).toBe(expectedCost);
  });

  it('charges full price when discount is 0', () => {
    const fuelPrice = gsm.getFuelPrice(gsm.getState().player.currentSystem);
    const initialCredits = gsm.getState().player.credits;
    const amount = 10;

    const result = gsm.refuel(amount, 0);
    expect(result.success).toBe(true);

    const expectedCost = Math.ceil(amount * fuelPrice);
    const actualCreditsSpent = initialCredits - gsm.getState().player.credits;
    expect(actualCreditsSpent).toBe(expectedCost);
  });
});
