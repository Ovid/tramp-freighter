import { describe, it, expect, beforeEach } from 'vitest';
import { NARRATIVE_EVENTS } from '../../src/game/data/narrative-events.js';
import { EventEngineManager } from '../../src/game/state/managers/event-engine.js';

function createMockGameStateManager(stateOverrides = {}) {
  const defaultState = {
    player: {
      currentSystem: 0,
      debt: 10000,
      karma: 0,
      daysElapsed: 15,
      factions: { authorities: 0, outlaws: 0, traders: 0, civilians: 0 },
    },
    ship: {
      fuel: 50,
      hull: 80,
      cargo: [],
    },
    world: {
      visitedSystems: [0],
      narrativeEvents: { fired: [], cooldowns: {}, flags: {} },
    },
  };

  const state = { ...defaultState, ...stateOverrides };

  return {
    _state: state,
    getOwnState: () => state.world.narrativeEvents,
    getGameState: () => state,
    isTestEnvironment: true,
  };
}

describe('Narrative Event Deduplication (#52/78)', () => {
  it('dock_generic_rumor should have cooldown of at least 10 days', () => {
    const event = NARRATIVE_EVENTS.find((e) => e.id === 'dock_generic_rumor');
    expect(event).toBeDefined();
    expect(event.cooldown).toBeGreaterThanOrEqual(10);
  });

  describe('global cooldown blocks same event at different stations', () => {
    let engine;
    let mockGSM;

    beforeEach(() => {
      mockGSM = createMockGameStateManager();
      engine = new EventEngineManager(mockGSM);
    });

    it('should block event at station B after firing at station A within cooldown', () => {
      const event = NARRATIVE_EVENTS.find((e) => e.id === 'dock_generic_rumor');

      // Register only this event for isolation
      engine.registerEvent({
        id: 'dock_generic_rumor',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false,
        cooldown: event.cooldown,
        priority: event.priority,
        content: { text: ['Test rumor'], choices: [] },
      });

      // Simulate event fired at day 5: cooldown expires at day 5 + cooldown
      mockGSM._state.player.daysElapsed = 5;
      engine.setCooldown('dock_generic_rumor', event.cooldown);

      // At day 10 (within cooldown window), check at a DIFFERENT system
      mockGSM._state.player.daysElapsed = 10;
      const result = engine.checkEvents(
        'dock',
        { system: 99 },
        () => 0 // guaranteed chance pass
      );

      // Should NOT get dock_generic_rumor because cooldown is global
      if (result) {
        expect(result.id).not.toBe('dock_generic_rumor');
      }
    });

    it('should allow different events to fire during another events cooldown', () => {
      // Register two events
      engine.registerEvent({
        id: 'dock_generic_rumor',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false,
        cooldown: 10,
        priority: 5,
        content: { text: ['Rumor A'], choices: [] },
      });
      engine.registerEvent({
        id: 'dock_other_event',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false,
        cooldown: 0,
        priority: 5,
        content: { text: ['Other event'], choices: [] },
      });

      // Set cooldown only for dock_generic_rumor
      mockGSM._state.world.narrativeEvents.cooldowns['dock_generic_rumor'] =
        100;
      mockGSM._state.player.daysElapsed = 5;

      const result = engine.checkEvents(
        'dock',
        { system: 0 },
        () => 0 // guaranteed chance pass
      );

      // dock_other_event should still fire (cooldowns are per-event-ID)
      expect(result).not.toBeNull();
      expect(result.id).toBe('dock_other_event');
    });

    it('should verify dock_beyond_the_lanes_rumor exists as separate event', () => {
      const beyondEvent = NARRATIVE_EVENTS.find(
        (e) => e.id === 'dock_beyond_the_lanes_rumor'
      );
      expect(beyondEvent).toBeDefined();
    });
  });
});
