import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EconomicEventsSystem } from '../../src/game/game-events.js';
import {
  COMMODITY_TYPES,
  SOL_SYSTEM_ID,
} from '../../src/game/constants.js';

/**
 * These tests cover the event-triggering path inside updateEvents(),
 * which the existing test file never exercises. Specifically:
 * - The roll < chance branch that creates and pushes new events
 * - The break after triggering one event per event type
 * - The supply_glut special case within the full updateEvents flow
 */

describe('EconomicEventsSystem - updateEvents event triggering', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper to build a minimal gameState for updateEvents.
   */
  function makeGameState(day, activeEvents = []) {
    return {
      player: { daysElapsed: day },
      world: { activeEvents },
    };
  }

  describe('triggering new events via updateEvents', () => {
    it('triggers a supply_glut event when roll is below chance threshold', () => {
      // Pre-computed: seed "event_supply_glut_0_1" produces roll 0.006906 < 0.06
      const starData = [{ id: 0, type: 'G2V' }];
      const state = makeGameState(1);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      const triggered = result.find((e) => e.type === 'supply_glut');
      expect(triggered).toBeDefined();
      expect(triggered.systemId).toBe(0);
      expect(triggered.startDay).toBe(1);
      expect(triggered.id).toBe('supply_glut_0_1');
    });

    it('supply_glut event has a single commodity modifier at 0.6', () => {
      // supply_glut on system 0, day 1 picks commodity via
      // seed "commodity_supply_glut_0_1" -> index 0 -> 'grain'
      const starData = [{ id: 0, type: 'G2V' }];
      const state = makeGameState(1);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      const triggered = result.find((e) => e.type === 'supply_glut');
      expect(triggered).toBeDefined();
      const modKeys = Object.keys(triggered.modifiers);
      expect(modKeys).toHaveLength(1);
      expect(COMMODITY_TYPES).toContain(modKeys[0]);
      expect(triggered.modifiers[modKeys[0]]).toBe(0.6);
    });

    it('triggers a mining_strike event on an eligible mining system', () => {
      // Pre-computed: seed "event_mining_strike_15_1" produces roll 0.040475 < 0.05
      // System 15 must have a mining spectral class (M, L, or T)
      const starData = [{ id: 15, type: 'M3V' }];
      const state = makeGameState(1);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      const triggered = result.find((e) => e.type === 'mining_strike');
      expect(triggered).toBeDefined();
      expect(triggered.systemId).toBe(15);
      expect(triggered.modifiers.ore).toBe(1.5);
      expect(triggered.modifiers.tritium).toBe(1.3);
    });

    it('does not trigger mining_strike on a non-mining system even with low roll', () => {
      // System 15 with G2V is not a mining system, so mining_strike should not fire
      const starData = [{ id: 15, type: 'G2V' }];
      const state = makeGameState(1);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      const miningEvents = result.filter((e) => e.type === 'mining_strike');
      expect(miningEvents).toHaveLength(0);
    });

    it('triggers a medical_emergency event on an eligible system', () => {
      // Pre-computed: seed "event_medical_emergency_2_5" produces roll 0.004372 < 0.03
      // medical_emergency targets 'any', so any system type works
      const starData = [{ id: 2, type: 'G2V' }];
      const state = makeGameState(5);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      const triggered = result.find((e) => e.type === 'medical_emergency');
      expect(triggered).toBeDefined();
      expect(triggered.systemId).toBe(2);
      expect(triggered.modifiers.medicine).toBe(2.0);
    });

    it('triggers a festival event on a core system', () => {
      // Pre-computed rolls for system 0 (SOL), day 4:
      //   mining_strike: 0.345 (no trigger, also ineligible - G2V not mining)
      //   medical_emergency: 0.675 (no trigger)
      //   festival: 0.005007 < 0.04 (triggers!)
      //   supply_glut: 0.127 (no trigger)
      // So only festival fires on this system/day combination.
      const starData = [{ id: SOL_SYSTEM_ID, type: 'G2V' }];
      const state = makeGameState(4);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      const triggered = result.find((e) => e.type === 'festival');
      expect(triggered).toBeDefined();
      expect(triggered.systemId).toBe(SOL_SYSTEM_ID);
      expect(triggered.modifiers.electronics).toBe(1.75);
      expect(triggered.modifiers.grain).toBe(1.2);
    });

    it('triggered event has correct endDay within duration range', () => {
      // mining_strike duration range is [5, 10]
      const starData = [{ id: 15, type: 'M3V' }];
      const state = makeGameState(1);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      const triggered = result.find((e) => e.type === 'mining_strike');
      expect(triggered).toBeDefined();
      const duration = triggered.endDay - triggered.startDay;
      expect(duration).toBeGreaterThanOrEqual(5);
      expect(duration).toBeLessThanOrEqual(10);
    });
  });

  describe('break behavior - one event per event type per update', () => {
    it('only triggers one mining_strike even when multiple mining systems qualify', () => {
      // Day 2: both system 15 and system 30 would roll below 0.05 for mining_strike
      // Pre-computed: system 15 day 2 roll=0.000604, system 30 day 2 roll=0.011934
      // Both are mining systems, but the break should stop after the first one triggers.
      const starData = [
        { id: 15, type: 'M3V' },
        { id: 30, type: 'M4V' },
      ];
      const state = makeGameState(2);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      const miningStrikes = result.filter((e) => e.type === 'mining_strike');
      // The break ensures at most one mining_strike per updateEvents call
      expect(miningStrikes).toHaveLength(1);
      // First eligible system in iteration order wins
      expect(miningStrikes[0].systemId).toBe(15);
    });

    it('can trigger different event types on different systems in same update', () => {
      // Day 1: system 15 (M3V) triggers mining_strike (roll=0.040475 < 0.05)
      // Day 1: system 0 triggers supply_glut (roll=0.006906 < 0.06)
      // These are different event types, so both should fire (on different systems)
      const starData = [
        { id: 0, type: 'G2V' },
        { id: 15, type: 'M3V' },
      ];
      const state = makeGameState(1);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      const types = result.map((e) => e.type);
      // Both event types should have triggered
      expect(types).toContain('mining_strike');
      expect(types).toContain('supply_glut');
    });
  });

  describe('system already has active event - skip behavior during triggering', () => {
    it('skips system with existing event even if roll would trigger', () => {
      // System 15 day 1 would trigger mining_strike, but if it already
      // has an active event, it should be skipped
      const starData = [{ id: 15, type: 'M3V' }];
      const existingEvent = {
        id: 'existing_15',
        type: 'medical_emergency',
        systemId: 15,
        endDay: 100,
      };
      const state = makeGameState(1, [existingEvent]);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      // Should only have the existing event, no new mining_strike
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('existing_15');
    });

    it('triggers event on second system when first system already has event', () => {
      // Day 2: systems 15 and 30 both would trigger mining_strike
      // If system 15 already has an event, system 30 should get the mining_strike
      const starData = [
        { id: 15, type: 'M3V' },
        { id: 30, type: 'M4V' },
      ];
      const existingEvent = {
        id: 'existing_15',
        type: 'festival',
        systemId: 15,
        endDay: 100,
      };
      const state = makeGameState(2, [existingEvent]);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      const miningStrikes = result.filter((e) => e.type === 'mining_strike');
      expect(miningStrikes).toHaveLength(1);
      expect(miningStrikes[0].systemId).toBe(30);
    });
  });

  describe('festival targeting with core systems only', () => {
    it('does not trigger festival on non-core system regardless of roll', () => {
      // Festival targets 'core' only (SOL_SYSTEM_ID=0, ALPHA_CENTAURI_SYSTEM_ID=1)
      // System 13 day 2 has roll=0.035065 < 0.04 for festival, but system 13 is not core
      const starData = [{ id: 13, type: 'G2V' }];
      const state = makeGameState(2);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      const festivals = result.filter((e) => e.type === 'festival');
      expect(festivals).toHaveLength(0);
    });
  });

  describe('deterministic event triggering', () => {
    it('produces identical results for same inputs across multiple calls', () => {
      const starData = [
        { id: 0, type: 'G2V' },
        { id: 15, type: 'M3V' },
      ];

      const state1 = makeGameState(1);
      const state2 = makeGameState(1);

      const result1 = EconomicEventsSystem.updateEvents(state1, starData);
      const result2 = EconomicEventsSystem.updateEvents(state2, starData);

      expect(result1).toEqual(result2);
    });

    it('produces different results for different days', () => {
      const starData = [
        { id: 0, type: 'G2V' },
        { id: 15, type: 'M3V' },
      ];

      const result1 = EconomicEventsSystem.updateEvents(makeGameState(1), starData);
      const result2 = EconomicEventsSystem.updateEvents(makeGameState(50), starData);

      // Different days will likely produce different event sets
      // At minimum the IDs should differ since day is part of the ID
      const ids1 = result1.map((e) => e.id).sort();
      const ids2 = result2.map((e) => e.id).sort();
      expect(ids1).not.toEqual(ids2);
    });
  });

  describe('combined expired removal and new triggering', () => {
    it('removes expired events and triggers new ones in same call', () => {
      const starData = [{ id: 15, type: 'M3V' }];
      const expiredEvent = {
        id: 'old_event',
        type: 'festival',
        systemId: 99,
        endDay: 0, // Expired on day 0
      };
      // Day 1, system 15 triggers mining_strike
      const state = makeGameState(1, [expiredEvent]);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      // Expired event should be gone
      expect(result.find((e) => e.id === 'old_event')).toBeUndefined();
      // New mining_strike should be present
      const miningStrike = result.find((e) => e.type === 'mining_strike');
      expect(miningStrike).toBeDefined();
      expect(miningStrike.systemId).toBe(15);
    });

    it('expired event on a system allows new event on that system', () => {
      // System 0 had an expired supply_glut. After removal, system 0
      // should be eligible for new events.
      const starData = [{ id: 0, type: 'G2V' }];
      const expiredEvent = {
        id: 'old_supply_glut',
        type: 'supply_glut',
        systemId: 0,
        endDay: 0,
      };
      // Day 1, system 0 triggers supply_glut (roll=0.006906 < 0.06)
      const state = makeGameState(1, [expiredEvent]);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      // Old event gone, new supply_glut triggered
      expect(result.find((e) => e.id === 'old_supply_glut')).toBeUndefined();
      const newEvent = result.find((e) => e.type === 'supply_glut');
      expect(newEvent).toBeDefined();
      expect(newEvent.id).toBe('supply_glut_0_1');
    });
  });
});
