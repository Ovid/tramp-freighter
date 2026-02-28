/**
 * Edge case tests for danger/encounter system managers.
 *
 * Covers critical boundary conditions in CombatManager, NegotiationManager,
 * InspectionManager, and DistressManager that are NOT exercised by the
 * existing unit or property test suites.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import {
  COMBAT_CONFIG,
  PIRATE_CREDIT_DEMAND_CONFIG,
  INSPECTION_CONFIG,
  DISTRESS_CONFIG,
  FACTION_CONFIG,
} from '@game/constants.js';
import {
  SeededRandom,
  buildEncounterSeed,
} from '../../src/game/utils/seeded-random.js';

/**
 * Compute the seeded RNG value the inspection manager will produce
 * for a given game state, matching its internal implementation.
 */
function computeInspectionRng(daysElapsed, currentSystem) {
  const seed = buildEncounterSeed(daysElapsed, currentSystem, 'inspection');
  return new SeededRandom(seed).next();
}

describe('Danger Edge Cases', () => {
  let gsm;

  const mockPirateEncounter = {
    id: 'test',
    type: 'pirate',
    demandPercent: 20,
    strength: 1.0,
  };

  const mockDistressCall = {
    id: 'test_distress',
    type: 'civilian_distress',
    description: 'Test distress call',
    options: ['respond', 'ignore', 'loot'],
  };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------- Combat edge cases ----------

  describe('Combat edge cases', () => {
    it('dump cargo with empty cargo array returns an outcome without crashing', () => {
      const state = gsm.getState();
      state.ship.cargo = [];

      const result = gsm.resolveCombatChoice(mockPirateEncounter, 'dump_cargo');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.costs.cargoPercent).toBe(
        COMBAT_CONFIG.DUMP_CARGO.CARGO_LOSS_PERCENT
      );
      expect(result.costs.fuel).toBe(COMBAT_CONFIG.DUMP_CARGO.FUEL_COST);
      expect(result.description).toBeTypeOf('string');
    });

    it('combat choices with extreme negative karma (-100) do not error', () => {
      const state = gsm.getState();
      state.player.karma = -100;
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

      const choices = ['evasive', 'return_fire', 'dump_cargo', 'distress_call'];

      for (const choice of choices) {
        // Each call builds a new SeededRandom from the same state, so
        // reset daysElapsed to avoid seed collisions being a concern.
        state.player.daysElapsed = choices.indexOf(choice) * 10;

        const result = gsm.resolveCombatChoice(mockPirateEncounter, choice);

        expect(result).toBeDefined();
        expect(result.success).toBeTypeOf('boolean');
        expect(result.costs).toBeDefined();
        expect(result.rewards).toBeDefined();
        expect(result.description).toBeTypeOf('string');
      }
    });
  });

  // ---------- Negotiation edge cases ----------

  describe('Negotiation edge cases', () => {
    it('counter-proposal with no cargo AND low credits falls through to credit payment path', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.player.credits = 5;

      // Force success with rng=0 (below BASE_CHANCE of 0.6)
      const result = gsm.negotiationManager.resolveCounterProposal(
        mockPirateEncounter,
        state,
        0
      );

      // No cargo => falls to reduced credit payment path
      const expectedCredits = Math.round(
        PIRATE_CREDIT_DEMAND_CONFIG.MIN_CREDIT_DEMAND * 0.5
      );
      expect(result.success).toBe(true);
      expect(result.costs.credits).toBe(expectedCredits);
      expect(result.costs.cargoPercent).toBeUndefined();
    });

    it('accept demand with 0 cargo AND 0 credits routes to resolveCannotPayPirates and damages ship', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.player.credits = 0;
      state.missions = { active: [], completed: [] };

      const result = gsm.negotiationManager.resolveAcceptDemand();

      expect(result.success).toBe(false);
      expect(result.costs.cargoPercent).toBeUndefined();
      expect(result.costs.credits).toBeUndefined();

      // No passengers => must fall through to ship damage
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

    it('cannot pay pirates with non-passenger missions only falls through to ship damage', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.player.credits = 0;
      state.missions = {
        active: [
          { id: 'delivery_1', type: 'delivery', destination: 1 },
          { id: 'trade_1', type: 'trade', good: 'grain' },
        ],
        completed: [],
      };

      const result = gsm.negotiationManager.resolveCannotPayPirates();

      expect(result.success).toBe(false);
      expect(result.costs.kidnappedPassengerId).toBeUndefined();

      const damagedSystems = ['hull', 'engine', 'lifeSupport'].filter(
        (sys) => typeof result.costs[sys] === 'number'
      );
      expect(damagedSystems).toHaveLength(1);
    });

    it('medicine claim with no cargo at all (empty array) fails gracefully', () => {
      const state = gsm.getState();
      state.ship.cargo = [];

      const result = gsm.negotiationManager.resolveMedicineClaim(
        mockPirateEncounter,
        state,
        0
      );

      expect(result.success).toBe(false);
      expect(result.costs).toEqual({});
      expect(result.description).toBeTypeOf('string');
      expect(result.description.length).toBeGreaterThan(0);
    });
  });

  // ---------- Inspection edge cases ----------

  describe('Inspection edge cases', () => {
    it('cooperate with both restricted goods AND hidden cargo discovered stacks both fines', () => {
      const state = gsm.getState();
      // System 0 (Sol) is safe zone; 'electronics' is restricted in safe zones
      state.ship.cargo = [{ good: 'electronics', qty: 2, buyPrice: 100 }];
      state.ship.hiddenCargo = [{ good: 'water', qty: 3, buyPrice: 10 }];
      state.player.currentSystem = 0;

      // Find a daysElapsed where hidden cargo IS discovered at Sol (core, multiplier 2.0)
      // discoveryChance = 0.1 * 2.0 = 0.2
      let daysElapsed = 0;
      for (let d = 0; d < 1000; d++) {
        const rng = computeInspectionRng(d, 0);
        if (rng < 0.2) {
          daysElapsed = d;
          break;
        }
      }
      state.player.daysElapsed = daysElapsed;

      const outcome = gsm.resolveInspection('cooperate', state);

      // Both fines should be stacked
      const expectedFine =
        INSPECTION_CONFIG.COOPERATE.RESTRICTED_FINE +
        INSPECTION_CONFIG.COOPERATE.HIDDEN_FINE;
      expect(outcome.costs.credits).toBe(expectedFine);
      expect(outcome.costs.restrictedGoodsConfiscated).toBe(true);
      expect(outcome.costs.hiddenCargoConfiscated).toBe(true);
    });

    it('flee returns fuel and hull costs regardless of cargo state', () => {
      // Test with empty cargo
      const state1 = gsm.getState();
      state1.ship.cargo = [];
      state1.ship.hiddenCargo = [];
      const outcome1 = gsm.resolveInspection('flee', state1);
      expect(outcome1.success).toBe(false);
      expect(outcome1.costs.fuel).toBe(INSPECTION_CONFIG.FLEE.FUEL_COST);
      expect(outcome1.costs.hull).toBe(INSPECTION_CONFIG.FLEE.HULL_COST);
      expect(outcome1).not.toHaveProperty('triggerPatrolCombat');

      // Test with loaded cargo
      const state2 = gsm.getState();
      state2.ship.cargo = [
        { good: 'electronics', qty: 10, buyPrice: 100 },
        { good: 'medicine', qty: 5, buyPrice: 50 },
      ];
      state2.ship.hiddenCargo = [{ good: 'tritium', qty: 3, buyPrice: 200 }];
      const outcome2 = gsm.resolveInspection('flee', state2);
      expect(outcome2.success).toBe(false);
      expect(outcome2.costs.fuel).toBe(INSPECTION_CONFIG.FLEE.FUEL_COST);
      expect(outcome2.costs.hull).toBe(INSPECTION_CONFIG.FLEE.HULL_COST);
      expect(outcome2).not.toHaveProperty('triggerPatrolCombat');
    });

    it('unknown choice throws Error with descriptive message', () => {
      const state = gsm.getState();

      expect(() => gsm.resolveInspection('bluff', state)).toThrow(
        'Unknown inspection choice: bluff'
      );
    });
  });

  // ---------- Distress edge cases ----------

  describe('Distress edge cases', () => {
    it('all three choices work with minimal/default initialized state', () => {
      // Use the default state as-is from createTestGameStateManager
      const choices = ['respond', 'ignore', 'loot'];

      for (const choice of choices) {
        const result = gsm.resolveDistressCall(mockDistressCall, choice);

        expect(result).toBeDefined();
        expect(result.success).toBeTypeOf('boolean');
        expect(result.costs).toBeDefined();
        expect(result.rewards).toBeDefined();
        expect(result.description).toBeTypeOf('string');
        expect(result.description.length).toBeGreaterThan(0);
      }
    });

    it('respond returns correct structure with default state', () => {
      const result = gsm.resolveDistressCall(mockDistressCall, 'respond');

      expect(result.success).toBe(true);
      expect(result.costs.days).toBe(DISTRESS_CONFIG.RESPOND.DAYS_COST);
      expect(result.costs.fuel).toBe(DISTRESS_CONFIG.RESPOND.FUEL_COST);
      expect(result.costs.lifeSupport).toBe(
        DISTRESS_CONFIG.RESPOND.LIFE_SUPPORT_COST
      );
      expect(result.rewards.credits).toBe(
        DISTRESS_CONFIG.RESPOND.CREDITS_REWARD
      );
      expect(result.rewards.karma).toBe(DISTRESS_CONFIG.RESPOND.KARMA_REWARD);
    });

    it('ignore returns correct structure with default state', () => {
      const result = gsm.resolveDistressCall(mockDistressCall, 'ignore');

      expect(result.success).toBe(false);
      expect(result.costs).toEqual({});
      expect(result.rewards.karma).toBe(DISTRESS_CONFIG.IGNORE.KARMA_PENALTY);
    });

    it('loot returns correct structure with default state', () => {
      const result = gsm.resolveDistressCall(mockDistressCall, 'loot');

      expect(result.success).toBe(true);
      expect(result.costs.days).toBe(DISTRESS_CONFIG.LOOT.DAYS_COST);
      expect(result.rewards.karma).toBe(DISTRESS_CONFIG.LOOT.KARMA_PENALTY);
      expect(result.rewards.factionRep.civilians).toBe(
        DISTRESS_CONFIG.LOOT.REP_PENALTY
      );
      expect(result.rewards.factionRep.outlaws).toBe(
        DISTRESS_CONFIG.LOOT.OUTLAW_REP_GAIN
      );
      expect(result.rewards.cargo).toBeDefined();
      expect(result.rewards.cargo.length).toBeGreaterThan(0);
    });

    it('unknown choice throws Error', () => {
      expect(() =>
        gsm.resolveDistressCall(mockDistressCall, 'bargain')
      ).toThrow('Unknown distress call choice: bargain');
    });
  });

  // ---------- Reputation boundary ----------

  describe('Reputation boundary', () => {
    it('inspection cooperate when authority rep is already at max (100) does not overflow', () => {
      const state = gsm.getState();
      // Set authority faction rep to max
      state.player.factions.authorities = FACTION_CONFIG.MAX;
      state.ship.cargo = [];
      state.ship.hiddenCargo = [];

      const outcome = gsm.resolveInspection('cooperate', state);

      // The outcome itself reports a rep gain; the actual clamping happens
      // when the outcome is applied. Verify the reported gain value is the
      // standard positive constant (it should not be inflated or NaN).
      expect(outcome.rewards.factionRep.authorities).toBe(
        INSPECTION_CONFIG.COOPERATE.AUTHORITY_REP_GAIN
      );
      expect(Number.isFinite(outcome.rewards.factionRep.authorities)).toBe(
        true
      );

      // Verify the outcome value plus the current rep would exceed max,
      // confirming this IS the boundary condition we are exercising.
      const projectedRep =
        state.player.factions.authorities +
        outcome.rewards.factionRep.authorities;
      expect(projectedRep).toBeGreaterThan(FACTION_CONFIG.MAX);
    });
  });
});
