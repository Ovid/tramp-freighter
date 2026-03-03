import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGameStateManager } from '../test-utils.js';
import { DISTRESS_CONFIG } from '@game/constants.js';

describe('DistressManager', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkDistressCall', () => {
    it('returns null when RNG does not trigger an encounter', () => {
      // day=0, sys=0 produces seeded value ~0.962 (well above 0.1 threshold)
      gsm.state.player.daysElapsed = 0;
      gsm.state.player.currentSystem = 0;

      const result = gsm.checkDistressCall();

      expect(result).toBeNull();
    });

    it('returns a distress call object when RNG triggers an encounter', () => {
      // day=2, sys=0 produces seeded value ~0.030 (below 0.1 threshold)
      gsm.state.player.daysElapsed = 2;
      gsm.state.player.currentSystem = 0;

      const result = gsm.checkDistressCall();

      expect(result).not.toBeNull();
      expect(result).toBeTypeOf('object');
    });

    it('returns object with type civilian_distress', () => {
      gsm.state.player.daysElapsed = 2;
      gsm.state.player.currentSystem = 0;

      const result = gsm.checkDistressCall();

      expect(result.type).toBe('civilian_distress');
    });

    it('returns object with all three options: respond, ignore, loot', () => {
      gsm.state.player.daysElapsed = 2;
      gsm.state.player.currentSystem = 0;

      const result = gsm.checkDistressCall();

      expect(result.options).toEqual(['respond', 'ignore', 'loot']);
    });

    it('returns object with id and description', () => {
      gsm.state.player.daysElapsed = 2;
      gsm.state.player.currentSystem = 0;

      const result = gsm.checkDistressCall();

      expect(result.id).toBeDefined();
      expect(result.id).toBeTypeOf('string');
      expect(result.id).toMatch(/^distress_/);
      expect(result.description).toBeDefined();
      expect(result.description).toBeTypeOf('string');
      expect(result.description.length).toBeGreaterThan(0);
    });

    it('produces deterministic results for the same game state', () => {
      const gsm1 = createTestGameStateManager();
      const gsm2 = createTestGameStateManager();

      // Both at same daysElapsed and currentSystem
      gsm1.state.player.daysElapsed = 2;
      gsm1.state.player.currentSystem = 0;
      gsm2.state.player.daysElapsed = 2;
      gsm2.state.player.currentSystem = 0;

      const result1 = gsm1.checkDistressCall();
      const result2 = gsm2.checkDistressCall();

      // Both should trigger (or both not trigger)
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      // Structure should match (id differs due to Date.now())
      expect(result1.type).toBe(result2.type);
      expect(result1.options).toEqual(result2.options);
      expect(result1.description).toBe(result2.description);
    });

    it('produces different outcomes for different game states', () => {
      // day=0 sys=0 does NOT trigger, day=2 sys=0 DOES trigger
      gsm.state.player.daysElapsed = 0;
      gsm.state.player.currentSystem = 0;
      const noTrigger = gsm.checkDistressCall();

      gsm.state.player.daysElapsed = 2;
      gsm.state.player.currentSystem = 0;
      const triggers = gsm.checkDistressCall();

      expect(noTrigger).toBeNull();
      expect(triggers).not.toBeNull();
    });
  });

  describe('resolveDistressCallEncounter', () => {
    const distressCall = {
      id: 'test_distress',
      type: 'civilian_distress',
      description: 'Test distress call',
      options: ['respond', 'ignore', 'loot'],
    };

    it('throws Error for unknown choice', () => {
      expect(() => gsm.resolveDistressCall(distressCall, 'negotiate')).toThrow(
        'Unknown distress call choice: negotiate'
      );
    });

    it('throws Error for empty string choice', () => {
      expect(() => gsm.resolveDistressCall(distressCall, '')).toThrow(
        'Unknown distress call choice: '
      );
    });

    it('increments civiliansSaved for respond choice', () => {
      const flagsBefore = gsm.state.world.dangerFlags.civiliansSaved;

      gsm.resolveDistressCall(distressCall, 'respond');

      expect(gsm.state.world.dangerFlags.civiliansSaved).toBe(flagsBefore + 1);
    });

    it('does not increment any danger flag for ignore choice', () => {
      const flagsBefore = { ...gsm.state.world.dangerFlags };

      gsm.resolveDistressCall(distressCall, 'ignore');

      expect(gsm.state.world.dangerFlags.civiliansSaved).toBe(
        flagsBefore.civiliansSaved
      );
      expect(gsm.state.world.dangerFlags.civiliansLooted).toBe(
        flagsBefore.civiliansLooted
      );
    });

    it('increments civiliansLooted for loot choice', () => {
      const flagsBefore = gsm.state.world.dangerFlags.civiliansLooted;

      gsm.resolveDistressCall(distressCall, 'loot');

      expect(gsm.state.world.dangerFlags.civiliansLooted).toBe(flagsBefore + 1);
    });

    it('increments civiliansSaved multiple times across repeated respond calls', () => {
      gsm.resolveDistressCall(distressCall, 'respond');
      gsm.resolveDistressCall(distressCall, 'respond');
      gsm.resolveDistressCall(distressCall, 'respond');

      expect(gsm.state.world.dangerFlags.civiliansSaved).toBe(3);
    });

    it('increments civiliansLooted multiple times across repeated loot calls', () => {
      gsm.resolveDistressCall(distressCall, 'loot');
      gsm.resolveDistressCall(distressCall, 'loot');

      expect(gsm.state.world.dangerFlags.civiliansLooted).toBe(2);
    });
  });

  describe('respond outcome', () => {
    const distressCall = {
      id: 'test_distress',
      type: 'civilian_distress',
      description: 'Test distress call',
    };

    it('returns success: true', () => {
      const result = gsm.resolveDistressCall(distressCall, 'respond');

      expect(result.success).toBe(true);
    });

    it('includes correct day cost', () => {
      const result = gsm.resolveDistressCall(distressCall, 'respond');

      expect(result.costs.days).toBe(DISTRESS_CONFIG.RESPOND.DAYS_COST);
      expect(result.costs.days).toBe(2);
    });

    it('includes correct fuel cost', () => {
      const result = gsm.resolveDistressCall(distressCall, 'respond');

      expect(result.costs.fuel).toBe(DISTRESS_CONFIG.RESPOND.FUEL_COST);
      expect(result.costs.fuel).toBe(15);
    });

    it('includes correct life support cost', () => {
      const result = gsm.resolveDistressCall(distressCall, 'respond');

      expect(result.costs.lifeSupport).toBe(
        DISTRESS_CONFIG.RESPOND.LIFE_SUPPORT_COST
      );
      expect(result.costs.lifeSupport).toBe(5);
    });

    it('includes correct credits reward', () => {
      const result = gsm.resolveDistressCall(distressCall, 'respond');

      expect(result.rewards.credits).toBe(
        DISTRESS_CONFIG.RESPOND.CREDITS_REWARD
      );
      expect(result.rewards.credits).toBe(150);
    });

    it('includes correct karma reward', () => {
      const result = gsm.resolveDistressCall(distressCall, 'respond');

      expect(result.rewards.karma).toBe(DISTRESS_CONFIG.RESPOND.KARMA_REWARD);
      expect(result.rewards.karma).toBe(1);
    });

    it('includes correct civilian faction reputation reward', () => {
      const result = gsm.resolveDistressCall(distressCall, 'respond');

      expect(result.rewards.factionRep.civilians).toBe(
        DISTRESS_CONFIG.RESPOND.REP_REWARD
      );
      expect(result.rewards.factionRep.civilians).toBe(10);
    });

    it('includes a description string', () => {
      const result = gsm.resolveDistressCall(distressCall, 'respond');

      expect(result.description).toBeTypeOf('string');
      expect(result.description.length).toBeGreaterThan(0);
    });
  });

  describe('ignore outcome', () => {
    const distressCall = {
      id: 'test_distress',
      type: 'civilian_distress',
      description: 'Test distress call',
    };

    it('returns success: false', () => {
      const result = gsm.resolveDistressCall(distressCall, 'ignore');

      expect(result.success).toBe(false);
    });

    it('has no resource costs', () => {
      const result = gsm.resolveDistressCall(distressCall, 'ignore');

      expect(result.costs).toEqual({});
      expect(result.costs.days).toBeUndefined();
      expect(result.costs.fuel).toBeUndefined();
      expect(result.costs.lifeSupport).toBeUndefined();
    });

    it('includes karma penalty of -1', () => {
      const result = gsm.resolveDistressCall(distressCall, 'ignore');

      expect(result.rewards.karma).toBe(DISTRESS_CONFIG.IGNORE.KARMA_PENALTY);
      expect(result.rewards.karma).toBe(-1);
    });

    it('does not include credits reward', () => {
      const result = gsm.resolveDistressCall(distressCall, 'ignore');

      expect(result.rewards.credits).toBeUndefined();
    });

    it('does not include faction reputation changes', () => {
      const result = gsm.resolveDistressCall(distressCall, 'ignore');

      expect(result.rewards.factionRep).toBeUndefined();
    });

    it('includes a description string', () => {
      const result = gsm.resolveDistressCall(distressCall, 'ignore');

      expect(result.description).toBeTypeOf('string');
      expect(result.description.length).toBeGreaterThan(0);
    });
  });

  describe('loot outcome', () => {
    const distressCall = {
      id: 'test_distress',
      type: 'civilian_distress',
      description: 'Test distress call',
    };

    it('returns success: true', () => {
      const result = gsm.resolveDistressCall(distressCall, 'loot');

      expect(result.success).toBe(true);
    });

    it('includes correct day cost', () => {
      const result = gsm.resolveDistressCall(distressCall, 'loot');

      expect(result.costs.days).toBe(DISTRESS_CONFIG.LOOT.DAYS_COST);
      expect(result.costs.days).toBe(1);
    });

    it('does not include fuel or life support costs', () => {
      const result = gsm.resolveDistressCall(distressCall, 'loot');

      expect(result.costs.fuel).toBeUndefined();
      expect(result.costs.lifeSupport).toBeUndefined();
    });

    it('includes karma penalty of -3', () => {
      const result = gsm.resolveDistressCall(distressCall, 'loot');

      expect(result.rewards.karma).toBe(DISTRESS_CONFIG.LOOT.KARMA_PENALTY);
      expect(result.rewards.karma).toBe(-3);
    });

    it('includes civilian faction reputation penalty of -15', () => {
      const result = gsm.resolveDistressCall(distressCall, 'loot');

      expect(result.rewards.factionRep.civilians).toBe(
        DISTRESS_CONFIG.LOOT.REP_PENALTY
      );
      expect(result.rewards.factionRep.civilians).toBe(-15);
    });

    it('includes outlaw faction reputation gain of 5', () => {
      const result = gsm.resolveDistressCall(distressCall, 'loot');

      expect(result.rewards.factionRep.outlaws).toBe(
        DISTRESS_CONFIG.LOOT.OUTLAW_REP_GAIN
      );
      expect(result.rewards.factionRep.outlaws).toBe(5);
    });

    it('includes cargo reward with parts at buyPrice 0', () => {
      const result = gsm.resolveDistressCall(distressCall, 'loot');

      expect(result.rewards.cargo).toBeDefined();
      expect(Array.isArray(result.rewards.cargo)).toBe(true);
      expect(result.rewards.cargo.length).toBeGreaterThan(0);

      const partsItem = result.rewards.cargo.find(
        (item) => item.good === 'parts'
      );
      expect(partsItem).toBeDefined();
      expect(partsItem.buyPrice).toBe(0);
      expect(partsItem.qty).toBeGreaterThan(0);
      expect(partsItem.buySystemName).toBe('Salvaged');
    });

    it('includes a description string', () => {
      const result = gsm.resolveDistressCall(distressCall, 'loot');

      expect(result.description).toBeTypeOf('string');
      expect(result.description.length).toBeGreaterThan(0);
    });
  });
});
