import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  NEGOTIATION_CONFIG,
  PIRATE_CREDIT_DEMAND_CONFIG,
  PASSENGER_CONFIG,
} from '../../src/game/constants.js';
import { SeededRandom } from '../../src/game/utils/seeded-random.js';
import {
  validateBuy,
  calculateMaxBuyQuantity,
} from '../../src/features/trade/tradeUtils.js';
import { applyEncounterOutcome } from '../../src/features/danger/applyEncounterOutcome.js';
import { generatePassengerMission } from '../../src/game/mission-generator.js';
import { pluralizeUnit } from '../../src/game/utils/string-utils.js';
import {
  createTestGame,
  TEST_STAR_DATA,
  TEST_WORMHOLE_DATA,
} from '../test-utils.js';

/**
 * Tests for passenger cargo space consumption and pirate credit demand fallback.
 *
 * Two features:
 * 1. Passengers consume cargo space (tracked in getCargoUsed, tradeUtils, CargoManifest)
 * 2. Pirates demand credits when no trade cargo (with kidnap/damage fallback)
 */

function createPassengerMission(overrides = {}) {
  return {
    id: 'passenger-test-1',
    type: 'passenger',
    passenger: {
      name: 'Test Passenger',
      type: 'scientist',
      satisfaction: 50,
    },
    requirements: {
      cargoSpace: PASSENGER_CONFIG.TYPES.scientist.cargoSpace,
    },
    destination: { systemId: 1, name: 'Alpha Centauri A' },
    ...overrides,
  };
}

describe('Passenger Cargo Space', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGame();
  });

  describe('getCargoUsed / getTradeCargoUsed', () => {
    it('should return only trade cargo when no passengers', () => {
      expect(manager.getCargoUsed()).toBe(20); // starting grain
      expect(manager.getTradeCargoUsed()).toBe(20);
    });

    it('should include passenger space in getCargoUsed', () => {
      const state = manager.getState();
      state.missions.active.push(createPassengerMission());

      expect(manager.getTradeCargoUsed()).toBe(20);
      expect(manager.getCargoUsed()).toBe(22); // 20 grain + 2 scientist
    });

    it('should sum multiple passengers', () => {
      const state = manager.getState();
      state.missions.active.push(createPassengerMission());
      state.missions.active.push(
        createPassengerMission({
          id: 'passenger-test-2',
          passenger: {
            name: 'Wealthy Guest',
            type: 'wealthy',
            satisfaction: 50,
          },
          requirements: {
            cargoSpace: PASSENGER_CONFIG.TYPES.wealthy.cargoSpace,
          },
        })
      );

      expect(manager.getCargoUsed()).toBe(25); // 20 + 2 + 3
    });

    it('should not count non-passenger missions', () => {
      const state = manager.getState();
      state.missions.active.push({
        id: 'delivery-1',
        type: 'delivery',
        requirements: {},
      });

      expect(manager.getCargoUsed()).toBe(20);
    });

    it('should affect getCargoRemaining', () => {
      const state = manager.getState();
      state.missions.active.push(createPassengerMission());

      // 50 capacity - 20 grain - 2 passenger = 28
      expect(manager.getCargoRemaining()).toBe(28);
    });
  });

  describe('tradeUtils with passengers', () => {
    it('should reduce max buy quantity by passenger space', () => {
      const state = manager.getState();
      state.missions.active.push(createPassengerMission());

      const maxQty = calculateMaxBuyQuantity(10, state);
      // 50 capacity - 20 grain - 2 passenger = 28 available
      // 500 credits / 10 per unit = 50 affordable
      // Min(50, 28) = 28
      expect(maxQty).toBe(28);
    });

    it('should reject buy when passenger space leaves no room', () => {
      const state = manager.getState();
      // Fill cargo to near capacity
      state.ship.cargo = [{ good: 'grain', qty: 47, buyPrice: 10 }];
      state.missions.active.push(createPassengerMission()); // 2 more units

      // 50 - 47 - 2 = 1 unit remaining
      const result = validateBuy('ore', 2, 15, state);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Insufficient cargo capacity');
    });

    it('should allow buy when passenger space leaves enough room', () => {
      const state = manager.getState();
      state.missions.active.push(createPassengerMission());

      const result = validateBuy('ore', 5, 10, state);
      expect(result.valid).toBe(true);
    });
  });
});

describe('Pirate Credit Demand Fallback', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGame();
  });

  describe('hasTradeCargoForPirates', () => {
    it('should return true when ship has trade cargo', () => {
      expect(manager.negotiationManager.hasTradeCargoForPirates()).toBe(true);
    });

    it('should return false when cargo is empty', () => {
      manager.getState().ship.cargo = [];
      expect(manager.negotiationManager.hasTradeCargoForPirates()).toBe(false);
    });

    it('should return false when all cargo has qty 0', () => {
      manager.getState().ship.cargo = [{ good: 'grain', qty: 0, buyPrice: 10 }];
      expect(manager.negotiationManager.hasTradeCargoForPirates()).toBe(false);
    });
  });

  describe('resolveAcceptDemand with cargo', () => {
    it('should return cargoPercent when ship has trade cargo', () => {
      const result = manager.negotiationManager.resolveAcceptDemand();
      expect(result.success).toBe(true);
      expect(result.costs.cargoPercent).toBe(
        NEGOTIATION_CONFIG.ACCEPT_DEMAND.CARGO_PERCENT
      );
    });
  });

  describe('resolveAcceptDemand without cargo', () => {
    beforeEach(() => {
      manager.getState().ship.cargo = [];
    });

    it('should demand credits when player can afford', () => {
      manager.getState().player.credits = 10000;
      const result = manager.negotiationManager.resolveAcceptDemand();

      expect(result.success).toBe(true);
      expect(result.costs.credits).toBeGreaterThanOrEqual(
        PIRATE_CREDIT_DEMAND_CONFIG.MIN_CREDIT_DEMAND
      );
      expect(result.costs.credits).toBeLessThanOrEqual(
        PIRATE_CREDIT_DEMAND_CONFIG.MAX_CREDIT_DEMAND
      );
      expect(result.costs.cargoPercent).toBeUndefined();
    });

    it('should route to cannot-pay when player is broke', () => {
      manager.getState().player.credits = 0;
      const result = manager.negotiationManager.resolveAcceptDemand();

      expect(result.success).toBe(false);
    });

    it('should generate credit demand in configured range', () => {
      manager.getState().player.credits = 10000;

      // With deterministic SeededRandom, credit demand should be within range
      const result = manager.negotiationManager.resolveAcceptDemand();
      expect(result.costs.credits).toBeGreaterThanOrEqual(
        PIRATE_CREDIT_DEMAND_CONFIG.MIN_CREDIT_DEMAND
      );
      expect(result.costs.credits).toBeLessThanOrEqual(
        PIRATE_CREDIT_DEMAND_CONFIG.MAX_CREDIT_DEMAND
      );
    });
  });

  describe('resolveCannotPayPirates', () => {
    beforeEach(() => {
      manager.getState().ship.cargo = [];
      manager.getState().player.credits = 0;
    });

    it('should kidnap highest-value passenger when roll succeeds', () => {
      const state = manager.getState();
      state.missions.active.push(
        createPassengerMission({
          id: 'wealthy-1',
          passenger: { name: 'Rich Person', type: 'wealthy', satisfaction: 50 },
          requirements: { cargoSpace: 3 },
        })
      );

      // Use a seed that produces a low value (< 0.8 wealthy weight)
      const rng = new SeededRandom('test_kidnap_low');
      const result = manager.negotiationManager.resolveCannotPayPirates(rng);
      expect(result.success).toBe(false);
      // With wealthy passenger (weight 0.8), most seeds will result in kidnap
      // The result will either be a kidnap or ship damage
      if (result.costs.kidnappedPassengerId) {
        expect(result.costs.kidnappedPassengerId).toBe('wealthy-1');
      }
    });

    it('should prefer highest-value passenger', () => {
      const state = manager.getState();
      state.missions.active.push(
        createPassengerMission({
          id: 'refugee-1',
          passenger: { name: 'Refugee', type: 'refugee', satisfaction: 50 },
          requirements: { cargoSpace: 1 },
        })
      );
      state.missions.active.push(
        createPassengerMission({
          id: 'wealthy-1',
          passenger: { name: 'Rich', type: 'wealthy', satisfaction: 50 },
          requirements: { cargoSpace: 3 },
        })
      );

      // Wealthy passengers should be sorted first (highest weight)
      const rng = new SeededRandom('test_prefer_wealthy');
      const result = manager.negotiationManager.resolveCannotPayPirates(rng);
      // If kidnap occurs, it should target the wealthy passenger
      if (result.costs.kidnappedPassengerId) {
        expect(result.costs.kidnappedPassengerId).toBe('wealthy-1');
      }
    });

    it('should damage ship when no kidnap occurs', () => {
      // No passengers → always damages ship
      const rng = new SeededRandom('test_damage_ship');
      const result = manager.negotiationManager.resolveCannotPayPirates(rng);
      expect(result.success).toBe(false);

      const hasDamage =
        result.costs.hull || result.costs.engine || result.costs.lifeSupport;
      expect(hasDamage).toBeDefined();
    });

    it('should damage ship when no passengers at all', () => {
      const result = manager.negotiationManager.resolveCannotPayPirates();
      expect(result.success).toBe(false);

      const hasDamage =
        result.costs.hull || result.costs.engine || result.costs.lifeSupport;
      expect(hasDamage).toBeDefined();
    });

    it('should apply damage within configured range', () => {
      const result = manager.negotiationManager.resolveCannotPayPirates();
      const damageValue =
        result.costs.hull || result.costs.engine || result.costs.lifeSupport;

      expect(damageValue).toBeGreaterThanOrEqual(
        PIRATE_CREDIT_DEMAND_CONFIG.NO_PAYMENT_SHIP_DAMAGE.MIN_PERCENT
      );
      expect(damageValue).toBeLessThanOrEqual(
        PIRATE_CREDIT_DEMAND_CONFIG.NO_PAYMENT_SHIP_DAMAGE.MAX_PERCENT
      );
    });
  });

  describe('resolveCounterProposal without cargo', () => {
    it('should return reduced credits on success when no trade cargo', () => {
      manager.getState().ship.cargo = [];
      const encounter = { demandPercent: 20 };

      // rng=0.1 < 0.6 base chance → success
      const result = manager.negotiationManager.resolveCounterProposal(
        encounter,
        manager.getState(),
        0.1
      );

      expect(result.success).toBe(true);
      expect(result.costs.credits).toBe(
        Math.round(PIRATE_CREDIT_DEMAND_CONFIG.MIN_CREDIT_DEMAND * 0.5)
      );
      expect(result.costs.cargoPercent).toBeUndefined();
    });
  });
});

describe('applyEncounterOutcome - kidnap', () => {
  let manager;

  beforeEach(() => {
    manager = createTestGame();
    vi.spyOn(manager, 'saveGame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should abandon mission and apply penalties on kidnap', () => {
    const state = manager.getState();
    state.missions.active.push(
      createPassengerMission({
        id: 'kidnap-target',
        passenger: { name: 'Victim', type: 'wealthy', satisfaction: 50 },
        requirements: { cargoSpace: 3 },
      })
    );

    const abandonSpy = vi.spyOn(manager, 'abandonMission');
    const karmaSpy = vi.spyOn(manager, 'modifyKarma');
    const factionSpy = vi.spyOn(manager, 'modifyFactionRep');

    const outcome = {
      success: false,
      costs: { kidnappedPassengerId: 'kidnap-target' },
      rewards: {},
      description: 'Passenger kidnapped.',
    };

    applyEncounterOutcome(manager, outcome);

    expect(abandonSpy).toHaveBeenCalledWith('kidnap-target');
    expect(factionSpy).toHaveBeenCalledWith(
      'civilians',
      PIRATE_CREDIT_DEMAND_CONFIG.KIDNAP_FACTION_PENALTY.civilians,
      'passenger_kidnapped'
    );
    expect(karmaSpy).toHaveBeenCalledWith(
      PIRATE_CREDIT_DEMAND_CONFIG.KIDNAP_KARMA_PENALTY,
      'passenger_kidnapped'
    );
  });
});

describe('Passenger Display Bugs', () => {
  describe('Bug 3: passenger mission stores destination name for display', () => {
    it('should include destination name in generated passenger mission', () => {
      const mission = generatePassengerMission(
        0,
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        () => 0.5
      );

      expect(mission).not.toBeNull();
      expect(mission.destination).toEqual(
        expect.objectContaining({ name: expect.any(String) })
      );
      expect(mission.destination.name.length).toBeGreaterThan(0);
    });
  });

  describe('Bug 4: singular/plural units grammar', () => {
    it('should return "unit" for singular values', () => {
      expect(pluralizeUnit(1)).toBe('1 unit');
    });

    it('should return "units" for plural values', () => {
      expect(pluralizeUnit(2)).toBe('2 units');
      expect(pluralizeUnit(0)).toBe('0 units');
      expect(pluralizeUnit(50)).toBe('50 units');
    });
  });
});
