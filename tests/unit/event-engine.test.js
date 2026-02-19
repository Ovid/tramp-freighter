import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  return {
    state: { ...defaultState, ...stateOverrides },
    isTestEnvironment: true,
    emit: vi.fn(),
    getState() {
      return this.state;
    },
    saveGame: vi.fn(),
  };
}

describe('EventEngineManager', () => {
  let engine;
  let mockGSM;

  beforeEach(() => {
    mockGSM = createMockGameStateManager();
    engine = new EventEngineManager(mockGSM);
  });

  describe('registerEvent', () => {
    it('should register an event', () => {
      const event = {
        id: 'test_event',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false,
        cooldown: 0,
        priority: 10,
        content: {
          text: ['Hello'],
          choices: [{ text: 'OK', next: null, effects: {} }],
        },
      };

      engine.registerEvent(event);
      expect(engine.getEventById('test_event')).toEqual(event);
    });

    it('should register multiple events', () => {
      engine.registerEvent({
        id: 'e1',
        type: 'dock',
        category: 'narrative',
        trigger: { chance: 1.0 },
        priority: 10,
        content: {},
      });
      engine.registerEvent({
        id: 'e2',
        type: 'jump',
        category: 'narrative',
        trigger: { chance: 1.0 },
        priority: 10,
        content: {},
      });
      expect(engine.getEventById('e1')).toBeTruthy();
      expect(engine.getEventById('e2')).toBeTruthy();
    });
  });

  describe('registerEvents', () => {
    it('should register an array of events', () => {
      const events = [
        {
          id: 'e1',
          type: 'dock',
          category: 'narrative',
          trigger: { chance: 1.0 },
          priority: 10,
          content: {},
        },
        {
          id: 'e2',
          type: 'dock',
          category: 'narrative',
          trigger: { chance: 1.0 },
          priority: 5,
          content: {},
        },
      ];
      engine.registerEvents(events);
      expect(engine.getEventById('e1')).toBeTruthy();
      expect(engine.getEventById('e2')).toBeTruthy();
    });
  });

  describe('checkEvents', () => {
    it('should return null when no events registered', () => {
      const result = engine.checkEvents('dock', { system: 0 });
      expect(result).toBeNull();
    });

    it('should return matching event by type', () => {
      engine.registerEvent({
        id: 'dock_event',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false,
        cooldown: 0,
        priority: 10,
        content: { text: ['Docked.'], choices: [] },
      });

      const result = engine.checkEvents('dock', { system: 0 });
      expect(result.id).toBe('dock_event');
    });

    it('should not return events of wrong type', () => {
      engine.registerEvent({
        id: 'jump_event',
        type: 'jump',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false,
        cooldown: 0,
        priority: 10,
        content: {},
      });

      const result = engine.checkEvents('dock', { system: 0 });
      expect(result).toBeNull();
    });

    it('should filter by system when trigger.system is set', () => {
      engine.registerEvent({
        id: 'sol_only',
        type: 'dock',
        category: 'narrative',
        trigger: { system: 0, condition: null, chance: 1.0 },
        once: false,
        cooldown: 0,
        priority: 10,
        content: {},
      });

      expect(engine.checkEvents('dock', { system: 0 })).toBeTruthy();
      expect(engine.checkEvents('dock', { system: 4 })).toBeNull();
    });

    it('should return highest priority event', () => {
      engine.registerEvent({
        id: 'low_pri',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false,
        cooldown: 0,
        priority: 5,
        content: {},
      });
      engine.registerEvent({
        id: 'high_pri',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false,
        cooldown: 0,
        priority: 20,
        content: {},
      });

      const result = engine.checkEvents('dock', { system: 0 });
      expect(result.id).toBe('high_pri');
    });

    it('should skip once-only events that have already fired', () => {
      mockGSM.state.world.narrativeEvents.fired = ['once_event'];

      engine.registerEvent({
        id: 'once_event',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: true,
        cooldown: 0,
        priority: 10,
        content: {},
      });

      expect(engine.checkEvents('dock', { system: 0 })).toBeNull();
    });

    it('should skip events on cooldown', () => {
      mockGSM.state.world.narrativeEvents.cooldowns = { cd_event: 20 };
      mockGSM.state.player.daysElapsed = 15;

      engine.registerEvent({
        id: 'cd_event',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false,
        cooldown: 5,
        priority: 10,
        content: {},
      });

      expect(engine.checkEvents('dock', { system: 0 })).toBeNull();
    });

    it('should allow events whose cooldown has expired', () => {
      mockGSM.state.world.narrativeEvents.cooldowns = { cd_event: 10 };
      mockGSM.state.player.daysElapsed = 15;

      engine.registerEvent({
        id: 'cd_event',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false,
        cooldown: 5,
        priority: 10,
        content: {},
      });

      expect(engine.checkEvents('dock', { system: 0 })).toBeTruthy();
    });

    it('should evaluate trigger conditions', () => {
      engine.registerEvent({
        id: 'first_visit_event',
        type: 'dock',
        category: 'narrative',
        trigger: { system: 4, condition: { type: 'first_visit' }, chance: 1.0 },
        once: true,
        cooldown: 0,
        priority: 10,
        content: {},
      });

      // System 4 not visited yet
      expect(engine.checkEvents('dock', { system: 4 })).toBeTruthy();

      // Mark as visited
      mockGSM.state.world.visitedSystems.push(4);
      expect(engine.checkEvents('dock', { system: 4 })).toBeNull();
    });

    it('should respect chance rolls via rng parameter', () => {
      engine.registerEvent({
        id: 'rare_event',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 0.1 },
        once: false,
        cooldown: 0,
        priority: 10,
        content: {},
      });

      // rng = 0.05 < 0.1 → should fire
      expect(engine.checkEvents('dock', { system: 0 }, 0.05)).toBeTruthy();
      // rng = 0.5 > 0.1 → should not fire
      expect(engine.checkEvents('dock', { system: 0 }, 0.5)).toBeNull();
    });

    it('should support dynamic chance via context.chances lookup', () => {
      engine.registerEvent({
        id: 'dynamic_event',
        type: 'jump',
        category: 'danger',
        trigger: { system: null, condition: null, chance: 'pirate_chance' },
        once: false,
        cooldown: 0,
        priority: 100,
        encounter: { generator: 'pirate' },
      });

      const context = { system: 4, chances: { pirate_chance: 0.3 } };
      // rng = 0.1 < 0.3 → fire
      expect(engine.checkEvents('jump', context, 0.1)).toBeTruthy();
      // rng = 0.5 > 0.3 → skip
      expect(engine.checkEvents('jump', context, 0.5)).toBeNull();
    });
  });

  describe('markFired', () => {
    it('should add event id to fired list', () => {
      engine.markFired('test_event');
      expect(mockGSM.state.world.narrativeEvents.fired).toContain('test_event');
    });

    it('should not duplicate ids', () => {
      engine.markFired('test_event');
      engine.markFired('test_event');
      expect(
        mockGSM.state.world.narrativeEvents.fired.filter(
          (id) => id === 'test_event'
        )
      ).toHaveLength(1);
    });
  });

  describe('setCooldown', () => {
    it('should set cooldown based on current day + cooldown days', () => {
      mockGSM.state.player.daysElapsed = 10;
      engine.setCooldown('test_event', 5);
      expect(mockGSM.state.world.narrativeEvents.cooldowns.test_event).toBe(15);
    });
  });

  describe('setFlag', () => {
    it('should set a flag in narrativeEvents.flags', () => {
      engine.setFlag('met_chen');
      expect(mockGSM.state.world.narrativeEvents.flags.met_chen).toBe(true);
    });
  });

  describe('getEventById', () => {
    it('should return event by id', () => {
      const event = {
        id: 'find_me',
        type: 'dock',
        category: 'narrative',
        trigger: { chance: 1.0 },
        priority: 10,
        content: {},
      };
      engine.registerEvent(event);
      expect(engine.getEventById('find_me').id).toBe('find_me');
    });

    it('should return null for unknown id', () => {
      expect(engine.getEventById('nonexistent')).toBeNull();
    });
  });
});
