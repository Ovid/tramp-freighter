import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { FUEL_PRICING_CONFIG, SHIP_CONFIG } from '@game/constants.js';

describe('RefuelManager', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFuelPrice', () => {
    it('returns core system price for Sol (id 0)', () => {
      const price = gsm.getFuelPrice(0);
      expect(price).toBe(FUEL_PRICING_CONFIG.CORE_SYSTEMS.PRICE_PER_PERCENT);
      expect(price).toBe(2);
    });

    it('returns core system price for Alpha Centauri (id 1)', () => {
      const price = gsm.getFuelPrice(1);
      expect(price).toBe(FUEL_PRICING_CONFIG.CORE_SYSTEMS.PRICE_PER_PERCENT);
      expect(price).toBe(2);
    });

    it('returns mid-range price for Barnards Star (~5.9 LY from Sol)', () => {
      const price = gsm.getFuelPrice(4);
      expect(price).toBe(
        FUEL_PRICING_CONFIG.MID_RANGE_SYSTEMS.PRICE_PER_PERCENT
      );
      expect(price).toBe(3);
    });

    it('returns outer system price for Epsilon Eridani (~10.5 LY from Sol)', () => {
      const price = gsm.getFuelPrice(13);
      expect(price).toBe(FUEL_PRICING_CONFIG.OUTER_SYSTEMS.PRICE_PER_PERCENT);
      expect(price).toBe(5);
    });

    it('returns inner system price as fallback for unknown system ID', () => {
      const price = gsm.getFuelPrice(9999);
      expect(price).toBe(FUEL_PRICING_CONFIG.INNER_SYSTEMS.PRICE_PER_PERCENT);
      expect(price).toBe(3);
    });
  });

  describe('validateRefuel', () => {
    it('returns valid with correct cost for a normal refuel', () => {
      const result = gsm.validateRefuel(50, 20, 1000, 3);
      expect(result).toEqual({
        valid: true,
        reason: null,
        cost: 60,
      });
    });

    it('rejects zero amount', () => {
      const result = gsm.validateRefuel(50, 0, 1000, 3);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/positive/i);
    });

    it('rejects negative amount', () => {
      const result = gsm.validateRefuel(50, -10, 1000, 3);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/positive/i);
    });

    it('rejects refuel that exceeds capacity beyond epsilon tolerance', () => {
      // 90 + 20 = 110 > maxFuel(100) + epsilon(1.0) = 101
      const result = gsm.validateRefuel(90, 20, 1000, 3);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/capacity/i);
    });

    it('accepts refuel within epsilon tolerance of max capacity', () => {
      // 99.5 + 1 = 100.5 <= maxFuel(100) + epsilon(1.0) = 101
      const result = gsm.validateRefuel(99.5, 1, 1000, 3);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeNull();
      expect(result.cost).toBe(3);
    });

    it('rejects refuel when credits are insufficient', () => {
      const result = gsm.validateRefuel(50, 20, 10, 3);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/insufficient credits/i);
      expect(result.cost).toBe(60);
    });

    it('calculates cost correctly as amount times price per percent', () => {
      const result = gsm.validateRefuel(0, 40, 5000, 5);
      expect(result.cost).toBe(200);
      expect(result.valid).toBe(true);
    });

    it('rejects when cost exactly exceeds credits by 1', () => {
      // 10 * 5 = 50 cost, but only 49 credits
      const result = gsm.validateRefuel(50, 10, 49, 5);
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/insufficient credits/i);
    });

    it('accepts when cost exactly equals credits', () => {
      // 10 * 5 = 50 cost, exactly 50 credits
      const result = gsm.validateRefuel(50, 10, 50, 5);
      expect(result.valid).toBe(true);
      expect(result.cost).toBe(50);
    });
  });

  describe('refuel', () => {
    it('deducts credits and increases fuel on successful refuel', () => {
      // Start at Sol (id 0), price = 2 credits/percent
      const state = gsm.state;
      state.ship.fuel = 50;
      state.player.credits = 500;
      state.player.currentSystem = 0;

      const result = gsm.refuel(20);

      expect(result.success).toBe(true);
      expect(result.reason).toBeNull();
      expect(state.ship.fuel).toBe(70);
      // Cost: 20 * 2 = 40
      expect(state.player.credits).toBe(460);
    });

    it('clamps fuel to max capacity when refuel would exceed it', () => {
      const state = gsm.state;
      state.ship.fuel = 99.5;
      state.player.credits = 500;
      state.player.currentSystem = 0;

      const result = gsm.refuel(1);

      expect(result.success).toBe(true);
      // 99.5 + 1 = 100.5, clamped to maxFuel (100)
      expect(state.ship.fuel).toBe(SHIP_CONFIG.FUEL_CAPACITY);
    });

    it('returns success:false when validation fails', () => {
      const state = gsm.state;
      state.ship.fuel = 50;
      state.player.credits = 1;
      state.player.currentSystem = 0;

      const result = gsm.refuel(20);

      expect(result.success).toBe(false);
      expect(result.reason).toBeTruthy();
      // Credits and fuel should be unchanged
      expect(state.player.credits).toBe(1);
      expect(state.ship.fuel).toBe(50);
    });

    it('marks state dirty after successful refuel', () => {
      const state = gsm.state;
      state.ship.fuel = 50;
      state.player.credits = 500;
      state.player.currentSystem = 0;

      const markDirtySpy = vi.spyOn(gsm, 'markDirty');

      gsm.refuel(10);

      expect(markDirtySpy).toHaveBeenCalled();
    });

    it('does not mark dirty on failed refuel', () => {
      const state = gsm.state;
      state.ship.fuel = 50;
      state.player.credits = 0;
      state.player.currentSystem = 0;

      const markDirtySpy = vi.spyOn(gsm, 'markDirty');

      gsm.refuel(10);

      expect(markDirtySpy).not.toHaveBeenCalled();
    });

    it('uses fuel price based on current system', () => {
      const state = gsm.state;
      state.ship.fuel = 50;
      state.player.credits = 1000;
      // Epsilon Eridani, outer system, price = 5
      state.player.currentSystem = 13;

      gsm.refuel(10);

      // Cost: 10 * 5 = 50
      expect(state.player.credits).toBe(950);
    });

    it('throws Error if refuel would somehow reduce fuel (safety check)', () => {
      // This tests the safety check for a non-reproducible bug.
      // We need to make newFuel < currentFuel, which requires manipulating
      // the clamping logic. Since Math.min(currentFuel + amount, maxFuel)
      // would only be less than currentFuel if maxFuel < currentFuel,
      // we can simulate this by setting fuel above capacity.
      const state = gsm.state;
      state.ship.fuel = 150;
      state.player.credits = 1000;
      state.player.currentSystem = 0;

      // Amount of 1 is positive, 150 + 1 = 151 > 100 + 1 = 101 epsilon,
      // so validation will reject. We need to bypass validation.
      // Instead, directly test refuelManager with a scenario where
      // maxFuel < currentFuel by temporarily altering fuel capacity.
      vi.spyOn(gsm, 'getFuelCapacity').mockReturnValue(50);

      // With maxFuel=50, fuel=150, amount=1:
      // validation: 150 + 1 = 151 > 50 + 1 = 51, so rejected
      // We need to also mock validateRefuel to force it through
      vi.spyOn(gsm.refuelManager, 'validateRefuel').mockReturnValue({
        valid: true,
        reason: null,
        cost: 2,
      });

      // Now newFuel = Math.min(150 + 1, 50) = 50, which is < 150
      expect(() => gsm.refuel(1)).toThrow(/CRITICAL BUG/);

      gsm.getFuelCapacity.mockRestore();
    });
  });
});
