import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EconomicEventsSystem } from '../../src/game/game-events.js';

describe('EconomicEventsSystem Lifecycle', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test star data
  const sol = {
    id: 0,
    x: 0,
    y: 0,
    z: 0,
    name: 'Sol',
    type: 'G2',
    wh: 8,
    st: 6,
    r: 1,
  };
  const alphaCentauri = {
    id: 1,
    x: -23.1,
    y: -19.18,
    z: -53.76,
    name: 'Alpha Centauri A',
    type: 'G2',
    wh: 6,
    st: 9,
    r: 1,
  };
  const barnardsStar = {
    id: 4,
    x: -0.98,
    y: -82.88,
    z: 6.86,
    name: "Barnard's Star",
    type: 'M5',
    wh: 3,
    st: 1,
    r: 1,
  };
  const wolf359 = {
    id: 5,
    x: -104.16,
    y: 29.82,
    z: 13.3,
    name: 'Wolf 359',
    type: 'M6',
    wh: 4,
    st: 6,
    r: 1,
  };

  const testStarData = [sol, alphaCentauri, barnardsStar, wolf359];

  function makeGameState(overrides = {}) {
    return {
      player: { daysElapsed: overrides.daysElapsed ?? 10 },
      world: { activeEvents: overrides.activeEvents ?? [] },
    };
  }

  describe('createEvent', () => {
    it('returns event with correct id format: eventTypeKey_systemId_currentDay', () => {
      const event = EconomicEventsSystem.createEvent('mining_strike', 4, 20);
      expect(event.id).toBe('mining_strike_4_20');
    });

    it('returns event with type, systemId, and startDay fields', () => {
      const event = EconomicEventsSystem.createEvent(
        'medical_emergency',
        0,
        15
      );
      expect(event.type).toBe('medical_emergency');
      expect(event.systemId).toBe(0);
      expect(event.startDay).toBe(15);
    });

    it('produces duration within the [min, max] range for event type', () => {
      for (const eventTypeKey of Object.keys(
        EconomicEventsSystem.EVENT_TYPES
      )) {
        const eventType = EconomicEventsSystem.EVENT_TYPES[eventTypeKey];
        const [minDuration, maxDuration] = eventType.duration;

        // Try several system/day combos to exercise different seeds
        for (let systemId = 0; systemId < 5; systemId++) {
          for (let day = 1; day < 5; day++) {
            const event = EconomicEventsSystem.createEvent(
              eventTypeKey,
              systemId,
              day
            );
            const duration = event.endDay - event.startDay;
            expect(duration).toBeGreaterThanOrEqual(minDuration);
            expect(duration).toBeLessThanOrEqual(maxDuration);
          }
        }
      }
    });

    it('calculates endDay as currentDay + duration', () => {
      const currentDay = 42;
      const event = EconomicEventsSystem.createEvent('festival', 1, currentDay);
      const duration = event.endDay - currentDay;
      const [minDuration, maxDuration] =
        EconomicEventsSystem.EVENT_TYPES.festival.duration;
      expect(duration).toBeGreaterThanOrEqual(minDuration);
      expect(duration).toBeLessThanOrEqual(maxDuration);
      expect(event.endDay).toBe(currentDay + duration);
    });

    it('copies modifiers from event type definition', () => {
      const event = EconomicEventsSystem.createEvent('mining_strike', 4, 10);
      const expectedModifiers =
        EconomicEventsSystem.EVENT_TYPES.mining_strike.modifiers;
      expect(event.modifiers).toEqual(expectedModifiers);

      // Verify it is a copy, not a reference
      expect(event.modifiers).not.toBe(expectedModifiers);
    });

    it('is deterministic — same inputs produce same outputs (seeded RNG)', () => {
      const first = EconomicEventsSystem.createEvent(
        'medical_emergency',
        1,
        30
      );
      const second = EconomicEventsSystem.createEvent(
        'medical_emergency',
        1,
        30
      );
      expect(first).toEqual(second);
    });

    it('throws for unknown event type key', () => {
      expect(() => {
        EconomicEventsSystem.createEvent('alien_invasion', 0, 1);
      }).toThrow('Unknown event type: alien_invasion');
    });
  });

  describe('updateEvents', () => {
    it('returns empty array when gameState is null', () => {
      const result = EconomicEventsSystem.updateEvents(null, testStarData);
      expect(result).toEqual([]);
    });

    it('returns empty array when starData is null', () => {
      const gameState = makeGameState();
      const result = EconomicEventsSystem.updateEvents(gameState, null);
      expect(result).toEqual([]);
    });

    it('removes expired events where endDay < currentDay', () => {
      const currentDay = 20;
      const expiredEvent = {
        id: 'mining_strike_4_5',
        type: 'mining_strike',
        systemId: 4,
        startDay: 5,
        endDay: 15, // Expired: 15 < 20
        modifiers: { ore: 1.5 },
      };
      const gameState = makeGameState({
        daysElapsed: currentDay,
        activeEvents: [expiredEvent],
      });

      const result = EconomicEventsSystem.updateEvents(gameState, testStarData);
      const preserved = result.find((e) => e.id === expiredEvent.id);
      expect(preserved).toBeUndefined();
    });

    it('preserves non-expired events', () => {
      const currentDay = 20;
      const activeEvent = {
        id: 'festival_1_18',
        type: 'festival',
        systemId: 1,
        startDay: 18,
        endDay: 25, // Still active: 25 >= 20
        modifiers: { electronics: 1.75, grain: 1.2 },
      };
      const gameState = makeGameState({
        daysElapsed: currentDay,
        activeEvents: [activeEvent],
      });

      const result = EconomicEventsSystem.updateEvents(gameState, testStarData);
      const preserved = result.find((e) => e.id === activeEvent.id);
      expect(preserved).toBeDefined();
      expect(preserved).toEqual(activeEvent);
    });

    it('skips systems that already have an active event', () => {
      const currentDay = 10;
      const existingEvent = {
        id: 'medical_emergency_4_8',
        type: 'medical_emergency',
        systemId: 4,
        startDay: 8,
        endDay: 20,
        modifiers: { medicine: 2.0 },
      };
      const gameState = makeGameState({
        daysElapsed: currentDay,
        activeEvents: [existingEvent],
      });

      const result = EconomicEventsSystem.updateEvents(gameState, testStarData);

      // The existing event for system 4 should still be there
      const system4Events = result.filter((e) => e.systemId === 4);
      expect(system4Events).toHaveLength(1);
      expect(system4Events[0].id).toBe(existingEvent.id);
    });

    it('skips systems not eligible for the event type', () => {
      // Sol (G2) is NOT a mining system, so mining_strike should not trigger there
      // Use only Sol in starData to isolate the eligibility check
      // Run many days to give RNG a chance — mining_strike should never appear on Sol
      for (let day = 1; day <= 100; day++) {
        const gs = makeGameState({ daysElapsed: day, activeEvents: [] });
        const result = EconomicEventsSystem.updateEvents(gs, [sol]);
        const miningOnSol = result.find(
          (e) => e.type === 'mining_strike' && e.systemId === sol.id
        );
        expect(miningOnSol).toBeUndefined();
      }
    });

    it('uses seeded random for event trigger rolls (deterministic)', () => {
      const gameState = makeGameState({ daysElapsed: 50, activeEvents: [] });
      const first = EconomicEventsSystem.updateEvents(gameState, testStarData);
      const second = EconomicEventsSystem.updateEvents(
        makeGameState({ daysElapsed: 50, activeEvents: [] }),
        testStarData
      );
      expect(first).toEqual(second);
    });

    it('can trigger new events when RNG roll is below chance threshold', () => {
      // Brute-force many days until at least one event triggers on a non-trivial star set
      let foundNewEvent = false;
      for (let day = 1; day <= 500; day++) {
        const gameState = makeGameState({ daysElapsed: day, activeEvents: [] });
        const result = EconomicEventsSystem.updateEvents(
          gameState,
          testStarData
        );
        if (result.length > 0) {
          foundNewEvent = true;
          // Verify the triggered event is well-formed
          const event = result[0];
          expect(event.id).toBeTruthy();
          expect(event.type).toBeTruthy();
          expect(event.startDay).toBe(day);
          expect(event.endDay).toBeGreaterThan(day);
          break;
        }
      }
      expect(foundNewEvent).toBe(true);
    });

    it('returns updated activeEvents array', () => {
      const currentDay = 10;
      const gameState = makeGameState({
        daysElapsed: currentDay,
        activeEvents: [],
      });
      const result = EconomicEventsSystem.updateEvents(gameState, testStarData);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('removeExpiredEvents', () => {
    it('returns empty array for non-array input', () => {
      expect(EconomicEventsSystem.removeExpiredEvents(null, 10)).toEqual([]);
      expect(EconomicEventsSystem.removeExpiredEvents(undefined, 10)).toEqual(
        []
      );
    });

    it('keeps events where endDay equals currentDay', () => {
      const events = [{ type: 'mining_strike', endDay: 10 }];
      const result = EconomicEventsSystem.removeExpiredEvents(events, 10);
      expect(result).toHaveLength(1);
    });

    it('removes events where endDay is before currentDay', () => {
      const events = [{ type: 'mining_strike', endDay: 9 }];
      const result = EconomicEventsSystem.removeExpiredEvents(events, 10);
      expect(result).toHaveLength(0);
    });
  });

  describe('getActiveEventForSystem', () => {
    it('returns null for non-array activeEvents', () => {
      expect(EconomicEventsSystem.getActiveEventForSystem(0, null)).toBeNull();
      expect(
        EconomicEventsSystem.getActiveEventForSystem(0, undefined)
      ).toBeNull();
    });

    it('returns null when no event matches the system', () => {
      const events = [{ systemId: 5, type: 'festival' }];
      expect(
        EconomicEventsSystem.getActiveEventForSystem(99, events)
      ).toBeNull();
    });

    it('returns the matching event for a system', () => {
      const events = [
        { systemId: 5, type: 'festival' },
        { systemId: 0, type: 'mining_strike' },
      ];
      const result = EconomicEventsSystem.getActiveEventForSystem(0, events);
      expect(result).toEqual({ systemId: 0, type: 'mining_strike' });
    });
  });

  describe('isSystemEligible', () => {
    it('returns false for null system or eventType', () => {
      expect(EconomicEventsSystem.isSystemEligible(null, {})).toBe(false);
      expect(EconomicEventsSystem.isSystemEligible({}, null)).toBe(false);
    });

    it('returns true for any system when targetSystems is "any"', () => {
      expect(
        EconomicEventsSystem.isSystemEligible(sol, { targetSystems: 'any' })
      ).toBe(true);
    });

    it('returns true for core systems when targetSystems is "core"', () => {
      expect(
        EconomicEventsSystem.isSystemEligible(sol, { targetSystems: 'core' })
      ).toBe(true);
      expect(
        EconomicEventsSystem.isSystemEligible(alphaCentauri, {
          targetSystems: 'core',
        })
      ).toBe(true);
    });

    it('returns false for non-core systems when targetSystems is "core"', () => {
      expect(
        EconomicEventsSystem.isSystemEligible(barnardsStar, {
          targetSystems: 'core',
        })
      ).toBe(false);
    });

    it('returns true for M-class stars when targetSystems is "mining"', () => {
      expect(
        EconomicEventsSystem.isSystemEligible(barnardsStar, {
          targetSystems: 'mining',
        })
      ).toBe(true);
    });

    it('returns false for G-class stars when targetSystems is "mining"', () => {
      expect(
        EconomicEventsSystem.isSystemEligible(sol, {
          targetSystems: 'mining',
        })
      ).toBe(false);
    });

    it('returns false for unknown targetSystems value', () => {
      expect(
        EconomicEventsSystem.isSystemEligible(sol, {
          targetSystems: 'alien',
        })
      ).toBe(false);
    });
  });
});
