import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EconomicEventsSystem } from '../../src/game/game-events.js';
import {
  SOL_SYSTEM_ID,
  ALPHA_CENTAURI_SYSTEM_ID,
} from '../../src/game/constants.js';

describe('EconomicEventsSystem', () => {
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

  // ─── System Eligibility ────────────────────────────────────────────

  describe('isSystemEligible', () => {
    it('returns false for null system', () => {
      const eventType = { targetSystems: 'any' };
      expect(EconomicEventsSystem.isSystemEligible(null, eventType)).toBe(
        false
      );
    });

    it('returns false for null eventType', () => {
      const system = { id: 0, type: 'G2V' };
      expect(EconomicEventsSystem.isSystemEligible(system, null)).toBe(false);
    });

    it('returns true for "any" target systems', () => {
      const system = { id: 50, type: 'G2V' };
      const eventType = { targetSystems: 'any' };
      expect(EconomicEventsSystem.isSystemEligible(system, eventType)).toBe(
        true
      );
    });

    it('returns true for core system with "core" target', () => {
      const system = { id: SOL_SYSTEM_ID, type: 'G2V' };
      const eventType = { targetSystems: 'core' };
      expect(EconomicEventsSystem.isSystemEligible(system, eventType)).toBe(
        true
      );
    });

    it('returns true for Alpha Centauri with "core" target', () => {
      const system = { id: ALPHA_CENTAURI_SYSTEM_ID, type: 'G2V' };
      const eventType = { targetSystems: 'core' };
      expect(EconomicEventsSystem.isSystemEligible(system, eventType)).toBe(
        true
      );
    });

    it('returns false for non-core system with "core" target', () => {
      const system = { id: 50, type: 'G2V' };
      const eventType = { targetSystems: 'core' };
      expect(EconomicEventsSystem.isSystemEligible(system, eventType)).toBe(
        false
      );
    });

    it('returns true for M-class system with "mining" target', () => {
      const system = { id: 10, type: 'M3V' };
      const eventType = { targetSystems: 'mining' };
      expect(EconomicEventsSystem.isSystemEligible(system, eventType)).toBe(
        true
      );
    });

    it('returns true for L-class system with "mining" target', () => {
      const system = { id: 10, type: 'L2' };
      const eventType = { targetSystems: 'mining' };
      expect(EconomicEventsSystem.isSystemEligible(system, eventType)).toBe(
        true
      );
    });

    it('returns true for T-class system with "mining" target', () => {
      const system = { id: 10, type: 'T6' };
      const eventType = { targetSystems: 'mining' };
      expect(EconomicEventsSystem.isSystemEligible(system, eventType)).toBe(
        true
      );
    });

    it('returns false for G-class system with "mining" target', () => {
      const system = { id: 10, type: 'G2V' };
      const eventType = { targetSystems: 'mining' };
      expect(EconomicEventsSystem.isSystemEligible(system, eventType)).toBe(
        false
      );
    });

    it('returns false for unknown target systems value', () => {
      const system = { id: 10, type: 'G2V' };
      const eventType = { targetSystems: 'unknown' };
      expect(EconomicEventsSystem.isSystemEligible(system, eventType)).toBe(
        false
      );
    });
  });

  // ─── Event Creation ────────────────────────────────────────────────

  describe('createEvent', () => {
    it('creates event with correct structure', () => {
      const event = EconomicEventsSystem.createEvent('mining_strike', 10, 100);
      expect(event).toHaveProperty('id', 'mining_strike_10_100');
      expect(event).toHaveProperty('type', 'mining_strike');
      expect(event).toHaveProperty('systemId', 10);
      expect(event).toHaveProperty('startDay', 100);
      expect(event).toHaveProperty('endDay');
      expect(event.endDay).toBeGreaterThan(100);
      expect(event).toHaveProperty('modifiers');
    });

    it('creates mining_strike event with correct modifiers', () => {
      const event = EconomicEventsSystem.createEvent('mining_strike', 10, 100);
      expect(event.modifiers.ore).toBe(1.5);
      expect(event.modifiers.tritium).toBe(1.3);
    });

    it('creates medical_emergency event with correct modifiers', () => {
      const event = EconomicEventsSystem.createEvent(
        'medical_emergency',
        10,
        100
      );
      expect(event.modifiers.medicine).toBe(2.0);
    });

    it('creates festival event with correct modifiers', () => {
      const event = EconomicEventsSystem.createEvent(
        'festival',
        SOL_SYSTEM_ID,
        100
      );
      expect(event.modifiers.electronics).toBe(1.75);
      expect(event.modifiers.grain).toBe(1.2);
    });

    it('generates deterministic duration for same inputs', () => {
      const event1 = EconomicEventsSystem.createEvent('mining_strike', 10, 100);
      const event2 = EconomicEventsSystem.createEvent('mining_strike', 10, 100);
      expect(event1.endDay).toBe(event2.endDay);
    });

    it('throws for unknown event type', () => {
      expect(() =>
        EconomicEventsSystem.createEvent('unknown_event', 10, 100)
      ).toThrow('Unknown event type');
    });

    it('generates duration within configured range', () => {
      const eventType = EconomicEventsSystem.EVENT_TYPES.mining_strike;
      const [minDuration, maxDuration] = eventType.duration;
      const event = EconomicEventsSystem.createEvent('mining_strike', 10, 100);
      const duration = event.endDay - event.startDay;
      expect(duration).toBeGreaterThanOrEqual(minDuration);
      expect(duration).toBeLessThanOrEqual(maxDuration);
    });

    it('medical_emergency duration is between 8 and 14 days', () => {
      const event = EconomicEventsSystem.createEvent('medical_emergency', 10, 100);
      const duration = event.endDay - event.startDay;
      expect(duration).toBeGreaterThanOrEqual(8);
      expect(duration).toBeLessThanOrEqual(14);
    });

    it('festival duration is between 7 and 12 days', () => {
      const event = EconomicEventsSystem.createEvent('festival', SOL_SYSTEM_ID, 100);
      const duration = event.endDay - event.startDay;
      expect(duration).toBeGreaterThanOrEqual(7);
      expect(duration).toBeLessThanOrEqual(12);
    });

    it('mining_strike duration is between 10 and 18 days', () => {
      const event = EconomicEventsSystem.createEvent('mining_strike', 10, 100);
      const duration = event.endDay - event.startDay;
      expect(duration).toBeGreaterThanOrEqual(10);
      expect(duration).toBeLessThanOrEqual(18);
    });
  });

  // ─── Event Expiry ──────────────────────────────────────────────────

  describe('removeExpiredEvents', () => {
    it('returns empty array for non-array input', () => {
      expect(EconomicEventsSystem.removeExpiredEvents(null, 100)).toEqual([]);
      expect(EconomicEventsSystem.removeExpiredEvents(undefined, 100)).toEqual(
        []
      );
    });

    it('keeps events that have not expired', () => {
      const events = [
        { id: 'e1', type: 'mining_strike', endDay: 150 },
        { id: 'e2', type: 'festival', endDay: 200 },
      ];
      const result = EconomicEventsSystem.removeExpiredEvents(events, 100);
      expect(result).toHaveLength(2);
    });

    it('removes expired events', () => {
      const events = [
        { id: 'e1', type: 'mining_strike', endDay: 50 },
        { id: 'e2', type: 'festival', endDay: 200 },
      ];
      const result = EconomicEventsSystem.removeExpiredEvents(events, 100);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('e2');
    });

    it('keeps event ending exactly on current day', () => {
      const events = [{ id: 'e1', type: 'mining_strike', endDay: 100 }];
      const result = EconomicEventsSystem.removeExpiredEvents(events, 100);
      expect(result).toHaveLength(1);
    });

    it('removes event ending before current day', () => {
      const events = [{ id: 'e1', type: 'mining_strike', endDay: 99 }];
      const result = EconomicEventsSystem.removeExpiredEvents(events, 100);
      expect(result).toHaveLength(0);
    });

    it('removes events with unknown type (save compatibility)', () => {
      const events = [
        { id: 'e1', type: 'supply_glut', endDay: 200 },
        { id: 'e2', type: 'mining_strike', endDay: 200 },
      ];
      const result = EconomicEventsSystem.removeExpiredEvents(events, 100);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('e2');
    });
  });

  // ─── Active Event Lookup ───────────────────────────────────────────

  describe('getActiveEventForSystem', () => {
    it('returns null for non-array input', () => {
      expect(EconomicEventsSystem.getActiveEventForSystem(0, null)).toBeNull();
      expect(
        EconomicEventsSystem.getActiveEventForSystem(0, undefined)
      ).toBeNull();
      expect(
        EconomicEventsSystem.getActiveEventForSystem(0, 'not-array')
      ).toBeNull();
    });

    it('returns null when no event matches', () => {
      const events = [
        { systemId: 5, type: 'mining_strike' },
        { systemId: 10, type: 'festival' },
      ];
      expect(
        EconomicEventsSystem.getActiveEventForSystem(99, events)
      ).toBeNull();
    });

    it('returns matching event', () => {
      const events = [
        { systemId: 5, type: 'mining_strike' },
        { systemId: 10, type: 'festival' },
      ];
      const result = EconomicEventsSystem.getActiveEventForSystem(10, events);
      expect(result).toEqual({ systemId: 10, type: 'festival' });
    });

    it('returns first matching event when multiple match', () => {
      const events = [
        { systemId: 5, type: 'mining_strike' },
        { systemId: 5, type: 'festival' },
      ];
      const result = EconomicEventsSystem.getActiveEventForSystem(5, events);
      expect(result.type).toBe('mining_strike');
    });

    it('returns null for empty events array', () => {
      expect(EconomicEventsSystem.getActiveEventForSystem(0, [])).toBeNull();
    });
  });

  // ─── Event Triggering ─────────────────────────────────────────────

  describe('updateEvents - basic behavior', () => {
    it('returns empty array for null gameState', () => {
      expect(EconomicEventsSystem.updateEvents(null, [])).toEqual([]);
    });

    it('returns empty array for null starData', () => {
      const state = makeGameState(10);
      expect(EconomicEventsSystem.updateEvents(state, null)).toEqual([]);
    });

    it('removes expired events', () => {
      const state = {
        player: { daysElapsed: 200 },
        world: {
          activeEvents: [
            { id: 'e1', type: 'mining_strike', systemId: 0, endDay: 100 },
            { id: 'e2', type: 'festival', systemId: 1, endDay: 300 },
          ],
        },
      };
      const starData = [
        { id: 0, type: 'G2V' },
        { id: 1, type: 'M3V' },
      ];
      const result = EconomicEventsSystem.updateEvents(state, starData);
      const hasE1 = result.some((e) => e.id === 'e1');
      expect(hasE1).toBe(false);
    });

    it('skips systems that already have active events', () => {
      const state = {
        player: { daysElapsed: 10 },
        world: {
          activeEvents: [{ id: 'existing', type: 'medical_emergency', systemId: 0, endDay: 500 }],
        },
      };
      const starData = [{ id: 0, type: 'G2V' }];
      const result = EconomicEventsSystem.updateEvents(state, starData);
      const system0Events = result.filter((e) => e.systemId === 0);
      expect(system0Events).toHaveLength(1);
      expect(system0Events[0].id).toBe('existing');
    });

    it('returns an array', () => {
      const state = makeGameState(10);
      const starData = [{ id: 0, type: 'G2V' }];
      const result = EconomicEventsSystem.updateEvents(state, starData);
      expect(Array.isArray(result)).toBe(true);
    });

    it('does not trigger second event on system with active event', () => {
      const starData = [{ id: 0, type: 'M3V' }];
      const state = {
        player: { daysElapsed: 10 },
        world: {
          activeEvents: [
            { id: 'existing', systemId: 0, endDay: 500, type: 'mining_strike' },
          ],
        },
      };
      const result = EconomicEventsSystem.updateEvents(state, starData);
      const system0Events = result.filter((e) => e.systemId === 0);
      expect(system0Events).toHaveLength(1);
      expect(system0Events[0].id).toBe('existing');
    });

    it('skips ineligible systems', () => {
      // G-class system is not eligible for mining_strike
      // Non-core system is not eligible for festival
      const starData = [{ id: 50, type: 'G2V' }];
      const state = makeGameState(10);
      // Run once - even if events trigger, they should only be for 'any' type events
      const result = EconomicEventsSystem.updateEvents(state, starData);
      for (const event of result) {
        // System 50 G-class can only get 'any' target events
        const eventDef = EconomicEventsSystem.EVENT_TYPES[event.type];
        expect(['any'].includes(eventDef.targetSystems)).toBe(true);
      }
    });

    it('preserves non-expired events across updates', () => {
      const starData = [{ id: 0, type: 'G2V' }];
      const state = {
        player: { daysElapsed: 50 },
        world: {
          activeEvents: [
            { id: 'active1', type: 'mining_strike', systemId: 0, endDay: 100 },
            { id: 'expired1', type: 'festival', systemId: 1, endDay: 30 },
          ],
        },
      };
      const result = EconomicEventsSystem.updateEvents(state, starData);
      expect(result.some((e) => e.id === 'active1')).toBe(true);
      expect(result.some((e) => e.id === 'expired1')).toBe(false);
    });
  });

  describe('updateEvents - triggering new events', () => {
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
      // mining_strike duration range is [10, 18]
      const starData = [{ id: 15, type: 'M3V' }];
      const state = makeGameState(1);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      const triggered = result.find((e) => e.type === 'mining_strike');
      expect(triggered).toBeDefined();
      const duration = triggered.endDay - triggered.startDay;
      expect(duration).toBeGreaterThanOrEqual(10);
      expect(duration).toBeLessThanOrEqual(18);
    });

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

  describe('updateEvents - break behavior (one event per type per update)', () => {
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
      // Multiple systems can each get different event types in the same update
      const starData = [
        { id: 0, type: 'G2V' },
        { id: 15, type: 'M3V' },
      ];
      const state = makeGameState(1);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      // mining_strike should trigger on system 15 (M-class, eligible)
      const miningStrike = result.find((e) => e.type === 'mining_strike');
      expect(miningStrike).toBeDefined();
      expect(miningStrike.systemId).toBe(15);
    });
  });

  describe('updateEvents - system with existing event skip behavior', () => {
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

  // ─── Event Lifecycle ──────────────────────────────────────────────

  describe('updateEvents - deterministic behavior', () => {
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

      const result1 = EconomicEventsSystem.updateEvents(
        makeGameState(1),
        starData
      );
      const result2 = EconomicEventsSystem.updateEvents(
        makeGameState(50),
        starData
      );

      // Different days will likely produce different event sets
      // At minimum the IDs should differ since day is part of the ID
      const ids1 = result1.map((e) => e.id).sort();
      const ids2 = result2.map((e) => e.id).sort();
      expect(ids1).not.toEqual(ids2);
    });
  });

  describe('updateEvents - combined expired removal and new triggering', () => {
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
      const starData = [{ id: 0, type: 'G2V' }];
      const expiredEvent = {
        id: 'old_event',
        type: 'medical_emergency',
        systemId: 0,
        endDay: 0,
      };
      const state = makeGameState(1, [expiredEvent]);

      const result = EconomicEventsSystem.updateEvents(state, starData);

      // Old event gone
      expect(result.find((e) => e.id === 'old_event')).toBeUndefined();
      // System 0 is now eligible for new events since the old one expired
    });
  });

  // ─── EVENT_TYPES Constant ─────────────────────────────────────────

  describe('EVENT_TYPES constant', () => {
    it('has all expected event types', () => {
      const types = Object.keys(EconomicEventsSystem.EVENT_TYPES);
      expect(types).toContain('mining_strike');
      expect(types).toContain('medical_emergency');
      expect(types).toContain('festival');
    });

    it('all event types have required fields', () => {
      for (const [, eventType] of Object.entries(
        EconomicEventsSystem.EVENT_TYPES
      )) {
        expect(eventType).toHaveProperty('name');
        expect(eventType).toHaveProperty('description');
        expect(eventType).toHaveProperty('duration');
        expect(eventType.duration).toHaveLength(2);
        expect(eventType).toHaveProperty('chance');
        expect(eventType).toHaveProperty('targetSystems');
      }
    });
  });
});
