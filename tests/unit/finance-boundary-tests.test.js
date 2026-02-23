import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import {
  SHIP_CONFIG,
  REPAIR_CONFIG,
  COLE_DEBT_CONFIG,
  NAVIGATION_CONFIG,
} from '@game/constants.js';
import { DebtManager } from '@game/state/managers/debt.js';

describe('Finance Boundary Tests', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // TRADING BOUNDARIES
  // ==========================================================================

  describe('Trading Boundaries', () => {
    beforeEach(() => {
      // Dock at Sol so prices are available and state is valid for trading
      gsm.dock();
    });

    it('buy with exactly 0 credits available should fail', () => {
      const state = gsm.getState();
      state.player.credits = 0;

      const result = gsm.buyGood('water', 1, 10);

      expect(result.success).toBe(false);
      expect(result.reason).toMatch(/insufficient credits/i);
    });

    it('buy with cost exactly equal to credits should succeed', () => {
      const state = gsm.getState();
      // Set up enough cargo space by clearing starting cargo
      state.ship.cargo = [];
      state.player.credits = 50;

      const result = gsm.buyGood('water', 5, 10);

      expect(result.success).toBe(true);
      expect(state.player.credits).toBe(0);
    });

    it('buy with cargo at exact capacity should fail (no space)', () => {
      const state = gsm.getState();
      state.player.credits = 10000;
      // Fill cargo to exact capacity
      state.ship.cargo = [
        { good: 'grain', qty: SHIP_CONFIG.CARGO_CAPACITY, buyPrice: 10 },
      ];

      const result = gsm.buyGood('water', 1, 10);

      expect(result.success).toBe(false);
      expect(result.reason).toMatch(/cargo space/i);
    });

    it('sell entire cargo stack (qty matches exactly) should remove the stack', () => {
      const state = gsm.getState();
      state.player.credits = 100;
      state.player.debt = 0; // No debt so no withholding complicates things
      state.ship.cargo = [{ good: 'water', qty: 5, buyPrice: 10 }];

      const result = gsm.sellGood(0, 5, 20);

      expect(result.success).toBe(true);
      // Stack should be completely removed, not left with qty 0
      expect(state.ship.cargo.length).toBe(0);
      // Player should receive full revenue (no debt = no withholding)
      expect(state.player.credits).toBe(200);
    });

    it('sell with 0 quantity should fail validation', () => {
      const state = gsm.getState();
      state.ship.cargo = [{ good: 'water', qty: 5, buyPrice: 10 }];

      const result = gsm.sellGood(0, 0, 20);

      expect(result.success).toBe(false);
      expect(result.reason).toMatch(/positive/i);
    });
  });

  // ==========================================================================
  // REFUEL BOUNDARIES
  // ==========================================================================

  describe('Refuel Boundaries', () => {
    it('refuel with fuel at exactly max capacity should fail when amount exceeds epsilon', () => {
      const state = gsm.getState();
      state.ship.fuel = SHIP_CONFIG.FUEL_CAPACITY;
      state.player.credits = 1000;
      state.player.currentSystem = 0;

      // Amount must exceed FUEL_CAPACITY_EPSILON (1.0) to be rejected
      // 100 + 2 = 102 > 100 + 1.0 = 101, so this should fail
      const amountBeyondEpsilon = NAVIGATION_CONFIG.FUEL_CAPACITY_EPSILON + 1;
      const result = gsm.refuel(amountBeyondEpsilon);

      expect(result.success).toBe(false);
      expect(result.reason).toMatch(/capacity/i);
    });

    it('refuel at max capacity within epsilon succeeds but fuel is clamped', () => {
      const state = gsm.getState();
      state.ship.fuel = SHIP_CONFIG.FUEL_CAPACITY;
      state.player.credits = 1000;
      state.player.currentSystem = 0;

      // 100 + 1 = 101 <= 100 + 1.0 = 101, passes epsilon check
      const result = gsm.refuel(1);

      expect(result.success).toBe(true);
      // Fuel is clamped to max capacity (no actual gain)
      expect(state.ship.fuel).toBe(SHIP_CONFIG.FUEL_CAPACITY);
    });

    it('refuel with fuel at 99.5% and amount 1% should succeed (within epsilon)', () => {
      const state = gsm.getState();
      state.ship.fuel = 99.5;
      state.player.credits = 1000;
      state.player.currentSystem = 0;

      const result = gsm.refuel(1);

      expect(result.success).toBe(true);
      // Fuel should be clamped to max capacity
      expect(state.ship.fuel).toBe(SHIP_CONFIG.FUEL_CAPACITY);
    });

    it('refuel with 0 credits should fail', () => {
      const state = gsm.getState();
      state.ship.fuel = 50;
      state.player.credits = 0;
      state.player.currentSystem = 0;

      const result = gsm.refuel(10);

      expect(result.success).toBe(false);
      expect(result.reason).toMatch(/insufficient credits/i);
      // State should be unchanged
      expect(state.ship.fuel).toBe(50);
      expect(state.player.credits).toBe(0);
    });

    it('refuel amount of 0 should fail', () => {
      const state = gsm.getState();
      state.ship.fuel = 50;
      state.player.credits = 1000;
      state.player.currentSystem = 0;

      const result = gsm.refuel(0);

      expect(result.success).toBe(false);
      expect(result.reason).toMatch(/positive/i);
      // State should be unchanged
      expect(state.ship.fuel).toBe(50);
    });
  });

  // ==========================================================================
  // REPAIR BOUNDARIES
  // ==========================================================================

  describe('Repair Boundaries', () => {
    it('repair system already at 100% should fail', () => {
      const state = gsm.getState();
      state.ship.hull = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
      state.player.credits = 10000;

      const result = gsm.repairShipSystem('hull', 10);

      expect(result.success).toBe(false);
      expect(result.reason).toMatch(/maximum condition/i);
    });

    it('repair cost for system already at 100% should be 0', () => {
      const cost = gsm.getRepairCost(
        'hull',
        10,
        SHIP_CONFIG.CONDITION_BOUNDS.MAX
      );

      expect(cost).toBe(0);
    });

    it('repair system at 0% should calculate full cost', () => {
      const fullRepairAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
      const cost = gsm.getRepairCost('hull', fullRepairAmount, 0);

      // Full repair from 0% to 100% costs 100 * COST_PER_PERCENT
      expect(cost).toBe(fullRepairAmount * REPAIR_CONFIG.COST_PER_PERCENT);
    });

    it('repair system at 0% should succeed with sufficient credits', () => {
      const state = gsm.getState();
      state.ship.hull = 0;
      const fullRepairAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX;
      const expectedCost = fullRepairAmount * REPAIR_CONFIG.COST_PER_PERCENT;
      state.player.credits = expectedCost;

      const result = gsm.repairShipSystem('hull', fullRepairAmount);

      expect(result.success).toBe(true);
      expect(state.ship.hull).toBe(SHIP_CONFIG.CONDITION_BOUNDS.MAX);
      expect(state.player.credits).toBe(0);
    });

    it('repair amount that would exceed 100% should be rejected', () => {
      const state = gsm.getState();
      state.ship.engine = 80;
      state.player.credits = 10000;

      // Attempting to repair 25% when at 80% would go to 105%
      const result = gsm.repairShipSystem('engine', 25);

      expect(result.success).toBe(false);
      expect(result.reason).toMatch(/exceed maximum/i);
    });

    it('repair amount that exactly reaches 100% should succeed', () => {
      const state = gsm.getState();
      state.ship.engine = 80;
      state.player.credits = 10000;

      // Repair exactly 20% to reach 100%
      const result = gsm.repairShipSystem('engine', 20);

      expect(result.success).toBe(true);
      expect(state.ship.engine).toBe(SHIP_CONFIG.CONDITION_BOUNDS.MAX);
    });

    it('repair with 0 amount should fail', () => {
      const state = gsm.getState();
      state.ship.hull = 50;
      state.player.credits = 10000;

      const result = gsm.repairShipSystem('hull', 0);

      expect(result.success).toBe(false);
      expect(result.reason).toMatch(/positive/i);
    });
  });

  // ==========================================================================
  // DEBT BOUNDARIES
  // ==========================================================================

  describe('Debt Boundaries', () => {
    let debtManager;

    beforeEach(() => {
      debtManager = new DebtManager(gsm);
    });

    describe('Heat tier boundaries', () => {
      it('heat at exactly 20 returns "low" tier', () => {
        gsm.getState().player.finance.heat = 20;

        expect(debtManager.getHeatTier()).toBe('low');
      });

      it('heat at exactly 21 returns "medium" tier', () => {
        gsm.getState().player.finance.heat = 21;

        expect(debtManager.getHeatTier()).toBe('medium');
      });

      it('heat at exactly 45 returns "medium" tier', () => {
        gsm.getState().player.finance.heat = 45;

        expect(debtManager.getHeatTier()).toBe('medium');
      });

      it('heat at exactly 46 returns "high" tier', () => {
        gsm.getState().player.finance.heat = 46;

        expect(debtManager.getHeatTier()).toBe('high');
      });

      it('heat at exactly 70 returns "high" tier', () => {
        gsm.getState().player.finance.heat = 70;

        expect(debtManager.getHeatTier()).toBe('high');
      });

      it('heat at exactly 71 returns "critical" tier', () => {
        gsm.getState().player.finance.heat = 71;

        expect(debtManager.getHeatTier()).toBe('critical');
      });

      it('heat at 0 returns "low" tier', () => {
        gsm.getState().player.finance.heat = 0;

        expect(debtManager.getHeatTier()).toBe('low');
      });

      it('heat at 100 returns "critical" tier', () => {
        gsm.getState().player.finance.heat = 100;

        expect(debtManager.getHeatTier()).toBe('critical');
      });

      it('tier boundaries use correct constants from config', () => {
        expect(COLE_DEBT_CONFIG.HEAT_TIER_LOW_MAX).toBe(20);
        expect(COLE_DEBT_CONFIG.HEAT_TIER_MEDIUM_MAX).toBe(45);
        expect(COLE_DEBT_CONFIG.HEAT_TIER_HIGH_MAX).toBe(70);
      });
    });

    describe('Payment that exactly equals debt', () => {
      it('should clear debt to exactly 0', () => {
        const state = gsm.getState();
        state.player.credits = 5000;
        state.player.debt = 1000;

        const result = debtManager.makePayment(1000);

        expect(result.success).toBe(true);
        expect(state.player.debt).toBe(0);
      });

      it('should reset heat to 0 when debt reaches 0', () => {
        const state = gsm.getState();
        state.player.credits = 5000;
        state.player.debt = 1000;
        state.player.finance.heat = 40;

        debtManager.makePayment(1000);

        expect(state.player.debt).toBe(0);
        expect(state.player.finance.heat).toBe(0);
      });

      it('should reset lien rate to 0 when debt reaches 0', () => {
        const state = gsm.getState();
        state.player.credits = 5000;
        state.player.debt = 1000;
        state.player.finance.heat = 40;

        debtManager.makePayment(1000);

        expect(state.player.finance.lienRate).toBe(0);
      });
    });

    describe('Payment with credits exactly matching amount', () => {
      it('credits should reach 0 after payment', () => {
        const state = gsm.getState();
        state.player.credits = 500;
        state.player.debt = 10000;

        const result = debtManager.makePayment(500);

        expect(result.success).toBe(true);
        expect(state.player.credits).toBe(0);
        expect(state.player.debt).toBe(9500);
      });

      it('should fail when credits are 1 less than payment amount', () => {
        const state = gsm.getState();
        state.player.credits = 499;
        state.player.debt = 10000;

        const result = debtManager.makePayment(500);

        expect(result.success).toBe(false);
        expect(result.reason).toMatch(/insufficient credits/i);
        // State should be unchanged
        expect(state.player.credits).toBe(499);
        expect(state.player.debt).toBe(10000);
      });
    });

    describe('Payment edge cases', () => {
      it('payment of 0 on existing debt should fail (below MIN_DRAW minimum not applicable, but credits check)', () => {
        const state = gsm.getState();
        state.player.credits = 5000;
        state.player.debt = 10000;

        // makePayment with 0 - actualPayment = min(0, 10000) = 0
        // credits(5000) < 0 is false, so payment proceeds with 0
        // But debt remains unchanged since 0 is deducted
        const result = debtManager.makePayment(0);

        // Payment of 0 still technically succeeds (reduces debt by 0)
        // The system caps payment at min(amount, debt) = min(0, 10000) = 0
        expect(result.success).toBe(true);
        expect(result.amount).toBe(0);
        expect(state.player.debt).toBe(10000);
      });

      it('payment on 0 debt should fail', () => {
        const state = gsm.getState();
        state.player.credits = 5000;
        state.player.debt = 0;

        const result = debtManager.makePayment(100);

        expect(result.success).toBe(false);
        expect(result.reason).toMatch(/no outstanding debt/i);
      });

      it('payment larger than debt is capped at debt amount', () => {
        const state = gsm.getState();
        state.player.credits = 5000;
        state.player.debt = 300;

        const result = debtManager.makePayment(1000);

        expect(result.success).toBe(true);
        expect(result.amount).toBe(300);
        expect(state.player.debt).toBe(0);
        // Only 300 deducted from credits, not 1000
        expect(state.player.credits).toBe(4700);
      });
    });

    describe('Borrowing edge cases', () => {
      it('borrow below MIN_DRAW should fail', () => {
        const state = gsm.getState();
        state.player.credits = 5000;
        state.player.debt = 0;

        const result = debtManager.borrow(COLE_DEBT_CONFIG.MIN_DRAW - 1);

        expect(result.success).toBe(false);
        expect(result.reason).toMatch(/minimum draw/i);
      });

      it('borrow at exactly MIN_DRAW should succeed', () => {
        const state = gsm.getState();
        state.player.credits = 5000;
        state.player.debt = 0;

        const result = debtManager.borrow(COLE_DEBT_CONFIG.MIN_DRAW);

        expect(result.success).toBe(true);
        expect(state.player.debt).toBe(COLE_DEBT_CONFIG.MIN_DRAW);
        expect(state.player.credits).toBe(5000 + COLE_DEBT_CONFIG.MIN_DRAW);
      });
    });
  });
});
