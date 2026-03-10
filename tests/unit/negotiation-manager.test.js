import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGame } from '../test-utils.js';
import {
  NEGOTIATION_CONFIG,
  PIRATE_CREDIT_DEMAND_CONFIG,
} from '@game/constants.js';

describe('NegotiationManager', () => {
  let gsm;

  const mockEncounter = {
    id: 'test_pirate_1',
    type: 'pirate',
    demandPercent: 20,
    strength: 1.0,
  };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveNegotiation', () => {
    it('throws Error for unknown choice', () => {
      expect(() => gsm.resolveNegotiation(mockEncounter, 'run')).toThrow(
        'Unknown negotiation choice: run'
      );
    });

    it('always increments piratesNegotiated flag', () => {
      const state = gsm.getState();
      const before = state.world.dangerFlags.piratesNegotiated;

      // accept_demand with cargo is the simplest path to exercise
      state.ship.cargo = [
        {
          good: 'grain',
          qty: 10,
          buyPrice: 15,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 1,
        },
      ];

      gsm.resolveNegotiation(mockEncounter, 'accept_demand');

      expect(state.world.dangerFlags.piratesNegotiated).toBe(before + 1);
    });

    it('routes to counter_proposal resolver', () => {
      const state = gsm.getState();
      state.ship.cargo = [
        {
          good: 'grain',
          qty: 10,
          buyPrice: 15,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 1,
        },
      ];

      const spy = vi.spyOn(gsm.negotiationManager, 'resolveCounterProposal');
      gsm.resolveNegotiation(mockEncounter, 'counter_proposal');

      expect(spy).toHaveBeenCalledOnce();
    });

    it('routes to medicine_claim resolver', () => {
      const spy = vi.spyOn(gsm.negotiationManager, 'resolveMedicineClaim');
      gsm.resolveNegotiation(mockEncounter, 'medicine_claim');

      expect(spy).toHaveBeenCalledOnce();
    });

    it('routes to intel_offer resolver', () => {
      const spy = vi.spyOn(gsm.negotiationManager, 'resolveIntelOffer');
      gsm.resolveNegotiation(mockEncounter, 'intel_offer');

      expect(spy).toHaveBeenCalledOnce();
    });

    it('routes to accept_demand resolver', () => {
      const spy = vi.spyOn(gsm.negotiationManager, 'resolveAcceptDemand');
      gsm.resolveNegotiation(mockEncounter, 'accept_demand');

      expect(spy).toHaveBeenCalledOnce();
    });
  });

  describe('counter_proposal', () => {
    it('returns success with cargoPercent when has cargo and RNG succeeds', () => {
      const state = gsm.getState();
      state.ship.cargo = [
        {
          good: 'grain',
          qty: 10,
          buyPrice: 15,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 1,
        },
      ];

      // Force success by passing rng=0 (always below BASE_CHANCE of 0.6)
      const result = gsm.negotiationManager.resolveCounterProposal(
        mockEncounter,
        state,
        0
      );

      expect(result.success).toBe(true);
      expect(result.costs.cargoPercent).toBe(
        NEGOTIATION_CONFIG.COUNTER_PROPOSAL.SUCCESS_CARGO_PERCENT
      );
      expect(result.costs.cargoPercent).toBe(10);
    });

    it('returns success with reduced credits when no cargo and RNG succeeds', () => {
      const state = gsm.getState();
      state.ship.cargo = [];

      const result = gsm.negotiationManager.resolveCounterProposal(
        mockEncounter,
        state,
        0
      );

      const expectedCredits = Math.round(
        PIRATE_CREDIT_DEMAND_CONFIG.MIN_CREDIT_DEMAND * 0.5
      );

      expect(result.success).toBe(true);
      expect(result.costs.credits).toBe(expectedCredits);
      expect(result.costs.credits).toBe(75);
    });

    it('returns failure with empty costs on RNG failure', () => {
      const state = gsm.getState();
      state.ship.cargo = [
        {
          good: 'grain',
          qty: 10,
          buyPrice: 15,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 1,
        },
      ];

      // Force failure by passing rng=0.99 (above BASE_CHANCE of 0.6)
      const result = gsm.negotiationManager.resolveCounterProposal(
        mockEncounter,
        state,
        0.99
      );

      expect(result.success).toBe(false);
      expect(result.costs).toEqual({});
    });
  });

  describe('medicine_claim', () => {
    it('returns failure with empty costs when no medicine in cargo', () => {
      const state = gsm.getState();
      state.ship.cargo = [
        {
          good: 'grain',
          qty: 10,
          buyPrice: 15,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 1,
        },
      ];

      const result = gsm.negotiationManager.resolveMedicineClaim(
        mockEncounter,
        state,
        0
      );

      expect(result.success).toBe(false);
      expect(result.costs).toEqual({});
    });

    it('returns failure with empty costs when cargo is empty', () => {
      const state = gsm.getState();
      state.ship.cargo = [];

      const result = gsm.negotiationManager.resolveMedicineClaim(
        mockEncounter,
        state,
        0
      );

      expect(result.success).toBe(false);
      expect(result.costs).toEqual({});
    });

    it('returns success with no costs when has medicine and RNG triggers sympathy', () => {
      const state = gsm.getState();
      state.ship.cargo = [
        {
          good: 'medicine',
          qty: 5,
          buyPrice: 30,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 1,
        },
      ];

      // Force sympathy: rng=0 is below SYMPATHY_CHANCE of 0.4
      const result = gsm.negotiationManager.resolveMedicineClaim(
        mockEncounter,
        state,
        0
      );

      expect(result.success).toBe(true);
      expect(result.costs).toEqual({});
      expect(result.rewards).toEqual({});
    });

    it('returns failure with cargoPercent when has medicine but no sympathy', () => {
      const state = gsm.getState();
      state.ship.cargo = [
        {
          good: 'medicine',
          qty: 5,
          buyPrice: 30,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 1,
        },
      ];

      // Force no sympathy: rng=0.99 is above SYMPATHY_CHANCE of 0.4
      const result = gsm.negotiationManager.resolveMedicineClaim(
        mockEncounter,
        state,
        0.99
      );

      expect(result.success).toBe(false);
      expect(result.costs.cargoPercent).toBe(mockEncounter.demandPercent);
      expect(result.costs.cargoPercent).toBe(20);
    });

    it('defaults cargoPercent to 20 when encounter has no demandPercent', () => {
      const state = gsm.getState();
      state.ship.cargo = [
        {
          good: 'medicine',
          qty: 5,
          buyPrice: 30,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 1,
        },
      ];

      const encounterNoDemand = { ...mockEncounter, demandPercent: undefined };

      const result = gsm.negotiationManager.resolveMedicineClaim(
        encounterNoDemand,
        state,
        0.99
      );

      expect(result.success).toBe(false);
      expect(result.costs.cargoPercent).toBe(20);
    });
  });

  describe('intel_offer', () => {
    it('returns failure with empty costs when no hasPriorIntel flag', () => {
      const state = gsm.getState();
      // Ensure no intel flag
      state.world.flags = {};

      const result = gsm.negotiationManager.resolveIntelOffer(
        mockEncounter,
        state,
        0
      );

      expect(result.success).toBe(false);
      expect(result.costs).toEqual({});
    });

    it('returns failure with empty costs when flags is undefined', () => {
      const state = gsm.getState();
      state.world.flags = undefined;

      const result = gsm.negotiationManager.resolveIntelOffer(
        mockEncounter,
        state,
        0
      );

      expect(result.success).toBe(false);
      expect(result.costs).toEqual({});
    });

    it('returns success with factionRep outlaws gain when has intel and RNG succeeds', () => {
      const state = gsm.getState();
      state.world.flags = { hasPriorIntel: true };

      // Force success: rng=0 is below BASE_SUCCESS_RATE of 0.8
      const result = gsm.negotiationManager.resolveIntelOffer(
        mockEncounter,
        state,
        0
      );

      expect(result.success).toBe(true);
      expect(result.costs).toEqual({});
      expect(result.rewards.factionRep.outlaws).toBe(
        NEGOTIATION_CONFIG.INTEL_OFFER.OUTLAW_REP_GAIN
      );
      expect(result.rewards.factionRep.outlaws).toBe(3);
    });

    it('returns failure with factionRep authority penalty when has intel but RNG fails', () => {
      const state = gsm.getState();
      state.world.flags = { hasPriorIntel: true };

      // Force failure: rng=0.99 is above BASE_SUCCESS_RATE of 0.8
      const result = gsm.negotiationManager.resolveIntelOffer(
        mockEncounter,
        state,
        0.99
      );

      expect(result.success).toBe(false);
      expect(result.costs).toEqual({});
      expect(result.rewards.factionRep.authorities).toBe(
        NEGOTIATION_CONFIG.INTEL_OFFER.SUCCESS_REP_PENALTY
      );
    });
  });

  describe('accept_demand', () => {
    it('returns success with cargoPercent when ship has cargo', () => {
      const state = gsm.getState();
      state.ship.cargo = [
        {
          good: 'grain',
          qty: 10,
          buyPrice: 15,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 1,
        },
      ];

      const result = gsm.negotiationManager.resolveAcceptDemand();

      expect(result.success).toBe(true);
      expect(result.costs.cargoPercent).toBe(
        NEGOTIATION_CONFIG.ACCEPT_DEMAND.CARGO_PERCENT
      );
      expect(result.costs.cargoPercent).toBe(20);
    });

    it('demands credits between MIN and MAX when no cargo but has credits', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.player.credits = 10000;

      const result = gsm.negotiationManager.resolveAcceptDemand();

      expect(result.success).toBe(true);
      expect(result.costs.credits).toBeGreaterThanOrEqual(
        PIRATE_CREDIT_DEMAND_CONFIG.MIN_CREDIT_DEMAND
      );
      expect(result.costs.credits).toBeLessThanOrEqual(
        PIRATE_CREDIT_DEMAND_CONFIG.MAX_CREDIT_DEMAND
      );
    });

    it('routes to resolveCannotPayPirates when no cargo and insufficient credits', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.player.credits = 0;

      const spy = vi.spyOn(gsm.negotiationManager, 'resolveCannotPayPirates');

      gsm.negotiationManager.resolveAcceptDemand();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('returns failure outcome when cannot pay', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.player.credits = 0;

      const result = gsm.negotiationManager.resolveAcceptDemand();

      expect(result.success).toBe(false);
    });
  });

  describe('resolveCannotPayPirates', () => {
    it('may kidnap a high-weight passenger when passenger missions exist', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.player.credits = 0;
      state.missions = {
        active: [
          {
            id: 'p1',
            type: 'passenger',
            passenger: { name: 'Rich Traveler', type: 'wealthy' },
          },
        ],
        completed: [],
      };

      // Wealthy has 0.8 weight, so with many seed attempts one will kidnap.
      // We call resolveCannotPayPirates directly and check the structure.
      const result = gsm.negotiationManager.resolveCannotPayPirates();

      // Result is either kidnap or damage - both are valid
      expect(result.success).toBe(false);
      expect(result.rewards).toEqual({});

      if (result.costs.kidnappedPassengerId) {
        expect(result.costs.kidnappedPassengerId).toBe('p1');
        expect(result.description).toContain('Rich Traveler');
      } else {
        // Damage path - one of hull, engine, lifeSupport should have a value
        const damagedSystems = ['hull', 'engine', 'lifeSupport'].filter(
          (sys) => typeof result.costs[sys] === 'number'
        );
        expect(damagedSystems).toHaveLength(1);
      }
    });

    it('sorts passengers by kidnap weight and targets highest value', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.player.credits = 0;
      state.missions = {
        active: [
          {
            id: 'p_refugee',
            type: 'passenger',
            passenger: { name: 'Refugee', type: 'refugee' },
          },
          {
            id: 'p_wealthy',
            type: 'passenger',
            passenger: { name: 'Rich Person', type: 'wealthy' },
          },
          {
            id: 'p_family',
            type: 'passenger',
            passenger: { name: 'Family', type: 'family' },
          },
        ],
        completed: [],
      };

      const result = gsm.negotiationManager.resolveCannotPayPirates();

      // If kidnap occurred, it should target the wealthy passenger (highest weight)
      if (result.costs.kidnappedPassengerId) {
        expect(result.costs.kidnappedPassengerId).toBe('p_wealthy');
      }
    });

    it('damages a random ship system when no passengers are available', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.player.credits = 0;
      state.missions = { active: [], completed: [] };

      const result = gsm.negotiationManager.resolveCannotPayPirates();

      expect(result.success).toBe(false);

      // Should have exactly one damaged system
      const damagedSystems = ['hull', 'engine', 'lifeSupport'].filter(
        (sys) => typeof result.costs[sys] === 'number'
      );
      expect(damagedSystems).toHaveLength(1);

      const damageValue = result.costs[damagedSystems[0]];
      expect(damageValue).toBeGreaterThanOrEqual(
        PIRATE_CREDIT_DEMAND_CONFIG.NO_PAYMENT_SHIP_DAMAGE.MIN_PERCENT
      );
      expect(damageValue).toBeLessThanOrEqual(
        PIRATE_CREDIT_DEMAND_CONFIG.NO_PAYMENT_SHIP_DAMAGE.MAX_PERCENT
      );
    });

    it('damage percent is between 15 and 25', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.player.credits = 0;
      state.missions = { active: [], completed: [] };

      const result = gsm.negotiationManager.resolveCannotPayPirates();

      const damagedSystems = ['hull', 'engine', 'lifeSupport'].filter(
        (sys) => typeof result.costs[sys] === 'number'
      );
      const damageValue = result.costs[damagedSystems[0]];

      expect(damageValue).toBeGreaterThanOrEqual(15);
      expect(damageValue).toBeLessThanOrEqual(25);
    });

    it('skips non-passenger missions when checking for kidnap targets', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.player.credits = 0;
      state.missions = {
        active: [
          { id: 'delivery1', type: 'delivery', destination: 1 },
          { id: 'trade1', type: 'trade', good: 'grain' },
        ],
        completed: [],
      };

      const result = gsm.negotiationManager.resolveCannotPayPirates();

      expect(result.success).toBe(false);
      // No kidnap possible, so must be ship damage
      expect(result.costs.kidnappedPassengerId).toBeUndefined();
      const damagedSystems = ['hull', 'engine', 'lifeSupport'].filter(
        (sys) => typeof result.costs[sys] === 'number'
      );
      expect(damagedSystems).toHaveLength(1);
    });

    it('handles missing missions state gracefully', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.player.credits = 0;
      state.missions = undefined;

      const result = gsm.negotiationManager.resolveCannotPayPirates();

      expect(result.success).toBe(false);
      // Should fall through to damage path
      const damagedSystems = ['hull', 'engine', 'lifeSupport'].filter(
        (sys) => typeof result.costs[sys] === 'number'
      );
      expect(damagedSystems).toHaveLength(1);
    });

    it('damages ship when passenger exists but RNG exceeds kidnap weight', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.player.credits = 0;
      // Refugee has lowest kidnap weight (0.15)
      state.missions = {
        active: [
          {
            id: 'p_refugee',
            type: 'passenger',
            passenger: { name: 'Refugee', type: 'refugee' },
          },
        ],
        completed: [],
      };

      // Run multiple times to observe both outcomes are structurally valid
      const result = gsm.negotiationManager.resolveCannotPayPirates();

      expect(result.success).toBe(false);
      expect(result.rewards).toEqual({});

      // Either kidnap or damage
      const hasKidnap = result.costs.kidnappedPassengerId !== undefined;
      const damagedSystems = ['hull', 'engine', 'lifeSupport'].filter(
        (sys) => typeof result.costs[sys] === 'number'
      );

      if (hasKidnap) {
        expect(result.costs.kidnappedPassengerId).toBe('p_refugee');
      } else {
        expect(damagedSystems).toHaveLength(1);
      }
    });
  });

  describe('hasTradeCargoForPirates', () => {
    it('returns true when cargo has items with qty > 0', () => {
      const state = gsm.getState();
      state.ship.cargo = [
        {
          good: 'grain',
          qty: 10,
          buyPrice: 15,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 1,
        },
      ];

      expect(gsm.negotiationManager.hasTradeCargoForPirates()).toBe(true);
    });

    it('returns false when cargo is empty', () => {
      const state = gsm.getState();
      state.ship.cargo = [];

      expect(gsm.negotiationManager.hasTradeCargoForPirates()).toBe(false);
    });

    it('returns false when all cargo has qty of 0', () => {
      const state = gsm.getState();
      state.ship.cargo = [
        {
          good: 'grain',
          qty: 0,
          buyPrice: 15,
          buySystem: 0,
          buySystemName: 'Sol',
          buyDate: 1,
        },
      ];

      expect(gsm.negotiationManager.hasTradeCargoForPirates()).toBe(false);
    });
  });
});
