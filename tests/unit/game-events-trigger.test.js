import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EconomicEventsSystem } from '../../src/game/game-events.js';

describe('EconomicEventsSystem updateEvents trigger path', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    const state = {
      player: { daysElapsed: 10 },
      world: { activeEvents: [] },
    };
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
          { id: 'active1', systemId: 0, endDay: 100 },
          { id: 'expired1', systemId: 1, endDay: 30 },
        ],
      },
    };
    const result = EconomicEventsSystem.updateEvents(state, starData);
    expect(result.some((e) => e.id === 'active1')).toBe(true);
    expect(result.some((e) => e.id === 'expired1')).toBe(false);
  });

});
