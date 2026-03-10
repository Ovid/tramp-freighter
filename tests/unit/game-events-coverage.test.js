import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EconomicEventsSystem } from '../../src/game/game-events.js';
import {
  COMMODITY_TYPES,
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
      expect(event.modifiers.grain).toBe(0.9);
      expect(event.modifiers.ore).toBe(0.9);
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

    it('creates supply_glut event with single commodity at 0.6', () => {
      const event = EconomicEventsSystem.createEvent('supply_glut', 10, 100);
      const modifierKeys = Object.keys(event.modifiers);
      expect(modifierKeys).toHaveLength(1);
      const commodity = modifierKeys[0];
      expect(COMMODITY_TYPES).toContain(commodity);
      expect(event.modifiers[commodity]).toBe(0.6);
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
  });

  describe('removeExpiredEvents', () => {
    it('returns empty array for non-array input', () => {
      expect(EconomicEventsSystem.removeExpiredEvents(null, 100)).toEqual([]);
      expect(EconomicEventsSystem.removeExpiredEvents(undefined, 100)).toEqual(
        []
      );
    });

    it('keeps events that have not expired', () => {
      const events = [
        { id: 'e1', endDay: 150 },
        { id: 'e2', endDay: 200 },
      ];
      const result = EconomicEventsSystem.removeExpiredEvents(events, 100);
      expect(result).toHaveLength(2);
    });

    it('removes expired events', () => {
      const events = [
        { id: 'e1', endDay: 50 },
        { id: 'e2', endDay: 200 },
      ];
      const result = EconomicEventsSystem.removeExpiredEvents(events, 100);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('e2');
    });

    it('keeps event ending exactly on current day', () => {
      const events = [{ id: 'e1', endDay: 100 }];
      const result = EconomicEventsSystem.removeExpiredEvents(events, 100);
      expect(result).toHaveLength(1);
    });

    it('removes event ending before current day', () => {
      const events = [{ id: 'e1', endDay: 99 }];
      const result = EconomicEventsSystem.removeExpiredEvents(events, 100);
      expect(result).toHaveLength(0);
    });
  });

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

  describe('updateEvents', () => {
    it('returns empty array for null gameState', () => {
      expect(EconomicEventsSystem.updateEvents(null, [])).toEqual([]);
    });

    it('returns empty array for null starData', () => {
      const state = {
        player: { daysElapsed: 10 },
        world: { activeEvents: [] },
      };
      expect(EconomicEventsSystem.updateEvents(state, null)).toEqual([]);
    });

    it('removes expired events', () => {
      const state = {
        player: { daysElapsed: 200 },
        world: {
          activeEvents: [
            { id: 'e1', systemId: 0, endDay: 100 },
            { id: 'e2', systemId: 1, endDay: 300 },
          ],
        },
      };
      const starData = [
        { id: 0, type: 'G2V' },
        { id: 1, type: 'M3V' },
      ];
      const result = EconomicEventsSystem.updateEvents(state, starData);
      // e1 should be removed (endDay 100 < currentDay 200)
      const hasE1 = result.some((e) => e.id === 'e1');
      expect(hasE1).toBe(false);
    });

    it('skips systems that already have active events', () => {
      const state = {
        player: { daysElapsed: 10 },
        world: {
          activeEvents: [{ id: 'existing', systemId: 0, endDay: 500 }],
        },
      };
      const starData = [{ id: 0, type: 'G2V' }];
      const result = EconomicEventsSystem.updateEvents(state, starData);
      // System 0 should not get another event
      const system0Events = result.filter((e) => e.systemId === 0);
      expect(system0Events).toHaveLength(1);
      expect(system0Events[0].id).toBe('existing');
    });

    it('returns an array', () => {
      const state = {
        player: { daysElapsed: 10 },
        world: { activeEvents: [] },
      };
      const starData = [{ id: 0, type: 'G2V' }];
      const result = EconomicEventsSystem.updateEvents(state, starData);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('EVENT_TYPES constant', () => {
    it('has all expected event types', () => {
      const types = Object.keys(EconomicEventsSystem.EVENT_TYPES);
      expect(types).toContain('mining_strike');
      expect(types).toContain('medical_emergency');
      expect(types).toContain('festival');
      expect(types).toContain('supply_glut');
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
