/**
 * Unit tests for InspectionManager edge cases and error paths
 *
 * Property-based coverage exists in tests/property/inspection-outcomes.property.test.js.
 * These unit tests focus on specific edge cases, error paths, and danger flag tracking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import { INSPECTION_CONFIG } from '@game/constants.js';
import {
  SeededRandom,
  buildEncounterSeed,
} from '../../src/game/utils/seeded-random.js';

/**
 * Compute the seeded RNG value that the inspection manager will produce
 * for a given game state, matching the internal implementation.
 *
 * @param {number} daysElapsed - Current days elapsed
 * @param {number} currentSystem - Current system ID
 * @returns {number} The seeded RNG value (0-1)
 */
function computeInspectionRng(daysElapsed, currentSystem) {
  const seed = buildEncounterSeed(daysElapsed, currentSystem, 'inspection');
  return new SeededRandom(seed).next();
}

/**
 * Search up to 1000 days for a daysElapsed value whose seeded RNG satisfies
 * the given predicate.  Throws if no match is found so tests fail explicitly
 * rather than silently using an invalid day.
 */
function findDayForRng(systemId, predicate) {
  for (let d = 0; d < 1000; d++) {
    const rng = computeInspectionRng(d, systemId);
    if (predicate(rng)) return d;
  }
  throw new Error(
    `No daysElapsed in 0..999 satisfies the RNG predicate for system ${systemId}`
  );
}

describe('InspectionManager', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveInspection', () => {
    it('throws Error for unknown choice', () => {
      const state = gsm.getState();

      expect(() => gsm.resolveInspection('beg', state)).toThrow(
        'Unknown inspection choice: beg'
      );
    });

    it('increments inspectionsPassed for cooperate', () => {
      const state = gsm.getState();
      const before = state.world.dangerFlags.inspectionsPassed;

      gsm.resolveInspection('cooperate', state);

      expect(state.world.dangerFlags.inspectionsPassed).toBe(before + 1);
    });

    it('increments inspectionsBribed for bribe', () => {
      const state = gsm.getState();
      const before = state.world.dangerFlags.inspectionsBribed;

      gsm.resolveInspection('bribe', state);

      expect(state.world.dangerFlags.inspectionsBribed).toBe(before + 1);
    });

    it('increments inspectionsFled for flee', () => {
      const state = gsm.getState();
      const before = state.world.dangerFlags.inspectionsFled;

      gsm.resolveInspection('flee', state);

      expect(state.world.dangerFlags.inspectionsFled).toBe(before + 1);
    });
  });

  describe('cooperate', () => {
    it('returns success: true always', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.ship.hiddenCargo = [];

      const outcome = gsm.resolveInspection('cooperate', state);

      expect(outcome.success).toBe(true);
    });

    it('returns success: true even with restricted goods', () => {
      const state = gsm.getState();
      // System 0 (Sol) is safe zone; 'electronics' is restricted in safe zones
      state.ship.cargo = [{ good: 'electronics', qty: 1, buyPrice: 100 }];
      state.ship.hiddenCargo = [];

      const outcome = gsm.resolveInspection('cooperate', state);

      expect(outcome.success).toBe(true);
    });

    it('charges no fine when no restricted goods and no hidden cargo', () => {
      const state = gsm.getState();
      // 'water' is not restricted in any zone
      state.ship.cargo = [{ good: 'water', qty: 5, buyPrice: 50 }];
      state.ship.hiddenCargo = [];

      const outcome = gsm.resolveInspection('cooperate', state);

      expect(outcome.costs.credits).toBe(0);
      expect(outcome.costs.restrictedGoodsConfiscated).toBeUndefined();
      expect(outcome.costs.hiddenCargoConfiscated).toBeUndefined();
    });

    it('charges RESTRICTED_FINE when restricted goods present', () => {
      const state = gsm.getState();
      // System 0 (Sol) is safe zone + core system
      // 'electronics' is restricted in safe zones, 'parts' in core systems
      state.ship.cargo = [{ good: 'electronics', qty: 2, buyPrice: 100 }];
      state.ship.hiddenCargo = [];

      const outcome = gsm.resolveInspection('cooperate', state);

      expect(outcome.costs.credits).toBe(
        INSPECTION_CONFIG.COOPERATE.RESTRICTED_FINE
      );
    });

    it('sets restrictedGoodsConfiscated flag when restricted goods present', () => {
      const state = gsm.getState();
      state.ship.cargo = [{ good: 'electronics', qty: 1, buyPrice: 100 }];
      state.ship.hiddenCargo = [];

      const outcome = gsm.resolveInspection('cooperate', state);

      expect(outcome.costs.restrictedGoodsConfiscated).toBe(true);
    });

    it('gains authority rep of 5 when cargo is clean', () => {
      const state = gsm.getState();
      state.ship.cargo = [{ good: 'water', qty: 1, buyPrice: 10 }];
      state.ship.hiddenCargo = [];

      const outcome = gsm.resolveInspection('cooperate', state);

      expect(outcome.rewards.factionRep.authorities).toBe(
        INSPECTION_CONFIG.COOPERATE.AUTHORITY_REP_GAIN
      );
    });

    it('applies authority rep penalty when restricted goods found', () => {
      const state = gsm.getState();
      state.ship.cargo = [{ good: 'electronics', qty: 1, buyPrice: 100 }];
      state.ship.hiddenCargo = [];

      const outcome = gsm.resolveInspection('cooperate', state);

      const expectedRep =
        INSPECTION_CONFIG.COOPERATE.AUTHORITY_REP_GAIN +
        INSPECTION_CONFIG.REPUTATION_PENALTIES.RESTRICTED_GOODS;
      expect(outcome.rewards.factionRep.authorities).toBe(expectedRep);
    });

    it('discovers hidden cargo when RNG falls below discovery chance', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.ship.hiddenCargo = [{ good: 'water', qty: 1, buyPrice: 10 }];

      // System 0 (Sol) is a core system with multiplier 2.0
      // discoveryChance = 0.1 * 2.0 = 0.2
      state.player.daysElapsed = findDayForRng(0, (rng) => rng < 0.2);

      const outcome = gsm.resolveInspection('cooperate', state);

      expect(outcome.costs.hiddenCargoConfiscated).toBe(true);
      expect(outcome.costs.credits).toBe(
        INSPECTION_CONFIG.COOPERATE.HIDDEN_FINE
      );
      expect(outcome.rewards.factionRep.authorities).toBe(
        INSPECTION_CONFIG.REPUTATION_PENALTIES.HIDDEN_CARGO
      );
      expect(outcome.rewards.factionRep.outlaws).toBe(
        INSPECTION_CONFIG.REPUTATION_PENALTIES.SMUGGLING_OUTLAW_BONUS
      );
    });

    it('does not discover hidden cargo when RNG is above discovery chance', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.ship.hiddenCargo = [{ good: 'water', qty: 1, buyPrice: 10 }];

      // System 0 (Sol) is a core system with multiplier 2.0
      // discoveryChance = 0.1 * 2.0 = 0.2
      state.player.daysElapsed = findDayForRng(0, (rng) => rng >= 0.2);

      const outcome = gsm.resolveInspection('cooperate', state);

      expect(outcome.costs.hiddenCargoConfiscated).toBeUndefined();
      expect(outcome.costs.credits).toBe(0);
    });

    it('treats empty hiddenCargo array as no hidden cargo', () => {
      const state = gsm.getState();
      state.ship.cargo = [];
      state.ship.hiddenCargo = [];

      const outcome = gsm.resolveInspection('cooperate', state);

      expect(outcome.costs.hiddenCargoConfiscated).toBeUndefined();
    });

    it('accumulates fines for both restricted goods and hidden cargo discovery', () => {
      const state = gsm.getState();
      state.ship.cargo = [{ good: 'electronics', qty: 1, buyPrice: 100 }];
      state.ship.hiddenCargo = [{ good: 'water', qty: 1, buyPrice: 10 }];

      // Find a daysElapsed where hidden cargo is discovered at Sol (core, multiplier 2.0)
      state.player.daysElapsed = findDayForRng(0, (rng) => rng < 0.2);

      const outcome = gsm.resolveInspection('cooperate', state);

      const expectedFine =
        INSPECTION_CONFIG.COOPERATE.RESTRICTED_FINE +
        INSPECTION_CONFIG.COOPERATE.HIDDEN_FINE;
      expect(outcome.costs.credits).toBe(expectedFine);
      expect(outcome.costs.restrictedGoodsConfiscated).toBe(true);
      expect(outcome.costs.hiddenCargoConfiscated).toBe(true);
    });

    it('uses core multiplier for system 0 (Sol)', () => {
      const state = gsm.getState();
      state.player.currentSystem = 0;
      state.ship.cargo = [];
      state.ship.hiddenCargo = [{ good: 'water', qty: 1, buyPrice: 10 }];

      // Core multiplier is 2.0, so discoveryChance = 0.1 * 2.0 = 0.2
      // Find daysElapsed where RNG is between 0.15 (safe multiplier threshold) and 0.2 (core threshold)
      // This proves core multiplier (2.0) is used instead of safe (1.5)
      state.player.daysElapsed = findDayForRng(
        0,
        (rng) => rng >= 0.15 && rng < 0.2
      );
      const outcome = gsm.resolveInspection('cooperate', state);

      // With core multiplier (2.0): discoveryChance = 0.2, rng < 0.2 => discovered
      // With safe multiplier (1.5): discoveryChance = 0.15, rng >= 0.15 => not discovered
      expect(outcome.costs.hiddenCargoConfiscated).toBe(true);
    });

    it('uses core multiplier for system 1 (Alpha Centauri)', () => {
      const state = gsm.getState();
      state.player.currentSystem = 1;
      state.ship.cargo = [];
      state.ship.hiddenCargo = [{ good: 'water', qty: 1, buyPrice: 10 }];

      // Find daysElapsed where hidden cargo is discovered at system 1
      state.player.daysElapsed = findDayForRng(1, (rng) => rng < 0.2);

      const outcome = gsm.resolveInspection('cooperate', state);

      expect(outcome.costs.hiddenCargoConfiscated).toBe(true);
    });
  });

  describe('bribe', () => {
    it('returns success: true when RNG < 0.6 (base chance)', () => {
      const state = gsm.getState();

      state.player.daysElapsed = findDayForRng(
        state.player.currentSystem,
        (rng) => rng < INSPECTION_CONFIG.BRIBE.BASE_CHANCE
      );

      const outcome = gsm.resolveInspection('bribe', state);

      expect(outcome.success).toBe(true);
    });

    it('returns success: false when RNG >= 0.6', () => {
      const state = gsm.getState();

      state.player.daysElapsed = findDayForRng(
        state.player.currentSystem,
        (rng) => rng >= INSPECTION_CONFIG.BRIBE.BASE_CHANCE
      );

      const outcome = gsm.resolveInspection('bribe', state);

      expect(outcome.success).toBe(false);
    });

    it('costs 500 credits on success', () => {
      const state = gsm.getState();

      state.player.daysElapsed = findDayForRng(
        state.player.currentSystem,
        (rng) => rng < INSPECTION_CONFIG.BRIBE.BASE_CHANCE
      );

      const outcome = gsm.resolveInspection('bribe', state);

      expect(outcome.costs.credits).toBe(INSPECTION_CONFIG.BRIBE.COST);
    });

    it('adds additional 1500 fine on failure (total 2000)', () => {
      const state = gsm.getState();

      state.player.daysElapsed = findDayForRng(
        state.player.currentSystem,
        (rng) => rng >= INSPECTION_CONFIG.BRIBE.BASE_CHANCE
      );

      const outcome = gsm.resolveInspection('bribe', state);

      const expectedTotal =
        INSPECTION_CONFIG.BRIBE.COST +
        INSPECTION_CONFIG.BRIBE.FAILURE_ADDITIONAL_FINE;
      expect(outcome.costs.credits).toBe(expectedTotal);
    });

    it('marks failed bribe costs as isFine so unpaid portion rolls into debt', () => {
      const state = gsm.getState();

      state.player.daysElapsed = findDayForRng(
        state.player.currentSystem,
        (rng) => rng >= INSPECTION_CONFIG.BRIBE.BASE_CHANCE
      );

      const outcome = gsm.resolveInspection('bribe', state);

      expect(outcome.costs.isFine).toBe(true);
    });

    it('does not mark successful bribe costs as isFine', () => {
      const state = gsm.getState();

      state.player.daysElapsed = findDayForRng(
        state.player.currentSystem,
        (rng) => rng < INSPECTION_CONFIG.BRIBE.BASE_CHANCE
      );

      const outcome = gsm.resolveInspection('bribe', state);

      expect(outcome.costs.isFine).toBeUndefined();
    });

    it('always penalizes authority rep by -10', () => {
      const state = gsm.getState();

      // Test with a successful bribe
      state.player.daysElapsed = findDayForRng(
        state.player.currentSystem,
        (rng) => rng < INSPECTION_CONFIG.BRIBE.BASE_CHANCE
      );
      const successOutcome = gsm.resolveInspection('bribe', state);
      expect(successOutcome.rewards.factionRep.authorities).toBe(
        INSPECTION_CONFIG.BRIBE.AUTHORITY_REP_PENALTY
      );

      // Test with a failed bribe
      state.player.daysElapsed = findDayForRng(
        state.player.currentSystem,
        (rng) => rng >= INSPECTION_CONFIG.BRIBE.BASE_CHANCE
      );
      const failOutcome = gsm.resolveInspection('bribe', state);
      expect(failOutcome.rewards.factionRep.authorities).toBe(
        INSPECTION_CONFIG.BRIBE.AUTHORITY_REP_PENALTY
      );
    });
  });

  describe('flee', () => {
    it('returns success: false', () => {
      const state = gsm.getState();

      const outcome = gsm.resolveInspection('flee', state);

      expect(outcome.success).toBe(false);
    });

    it('applies fuel and hull costs for emergency burn', () => {
      const state = gsm.getState();

      const outcome = gsm.resolveInspection('flee', state);

      expect(outcome.costs.fuel).toBe(INSPECTION_CONFIG.FLEE.FUEL_COST);
      expect(outcome.costs.hull).toBe(INSPECTION_CONFIG.FLEE.HULL_COST);
      expect(outcome).not.toHaveProperty('triggerPatrolCombat');
    });

    it('applies authority rep penalty of -15', () => {
      const state = gsm.getState();

      const outcome = gsm.resolveInspection('flee', state);

      expect(outcome.rewards.factionRep.authorities).toBe(
        INSPECTION_CONFIG.FLEE.AUTHORITY_REP_PENALTY
      );
    });
  });
});
