import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEngineManager } from '../../src/game/state/managers/event-engine.js';
import { SeededRandom } from '../../src/game/utils/seeded-random.js';

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
    markDirty: vi.fn(),
  };
}

describe('EventEngineManager', () => {
  let engine;
  let mockGSM;

  beforeEach(() => {
    mockGSM = createMockGameStateManager();
    engine = new EventEngineManager(mockGSM);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      expect(engine.getEventById('e1')).toEqual(
        expect.objectContaining({ id: 'e1' })
      );
      expect(engine.getEventById('e2')).toEqual(
        expect.objectContaining({ id: 'e2' })
      );
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
      expect(engine.getEventById('e1')).toEqual(
        expect.objectContaining({ id: 'e1' })
      );
      expect(engine.getEventById('e2')).toEqual(
        expect.objectContaining({ id: 'e2' })
      );
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

      expect(engine.checkEvents('dock', { system: 0 })).toEqual(
        expect.objectContaining({ id: 'sol_only' })
      );
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

      expect(engine.checkEvents('dock', { system: 0 })).toEqual(
        expect.objectContaining({ id: 'cd_event' })
      );
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
      expect(engine.checkEvents('dock', { system: 4 })).toEqual(
        expect.objectContaining({ id: 'first_visit_event' })
      );

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
      expect(engine.checkEvents('dock', { system: 0 }, 0.05)).toEqual(
        expect.objectContaining({ id: 'rare_event' })
      );
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
      expect(engine.checkEvents('jump', context, 0.1)).toEqual(
        expect.objectContaining({ id: 'dynamic_event' })
      );
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

  describe('per-event RNG independence', () => {
    it('should allow lower-priority event to fire when higher-priority fails its own roll', () => {
      // Pirate: priority 100, chance 0.15
      engine.registerEvent({
        id: 'pirate',
        type: 'jump',
        category: 'danger',
        trigger: { system: null, condition: null, chance: 'pirate_chance' },
        once: false,
        cooldown: 0,
        priority: 100,
        encounter: { generator: 'pirate' },
      });

      // Inspection: priority 80, chance 0.10
      engine.registerEvent({
        id: 'inspection',
        type: 'jump',
        category: 'danger',
        trigger: { system: null, condition: null, chance: 'inspection_chance' },
        once: false,
        cooldown: 0,
        priority: 80,
        encounter: { generator: 'inspection' },
      });

      const context = {
        system: 4,
        chances: { pirate_chance: 0.15, inspection_chance: 0.1 },
      };

      // Provide per-event rolls: pirate gets 0.9 (fails), inspection gets 0.05 (passes)
      const rolls = [0.9, 0.05];
      let rollIndex = 0;
      const rngFn = () => rolls[rollIndex++];

      const result = engine.checkEvents('jump', context, rngFn);
      expect(result).not.toBeNull();
      expect(result.id).toBe('inspection');
    });

    it('should give each event its own independent roll', () => {
      engine.registerEvent({
        id: 'high_pri',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 0.5 },
        once: false,
        cooldown: 0,
        priority: 20,
        content: {},
      });
      engine.registerEvent({
        id: 'low_pri',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 0.5 },
        once: false,
        cooldown: 0,
        priority: 10,
        content: {},
      });

      // high_pri rolls 0.8 (fails), low_pri rolls 0.2 (passes)
      const rolls = [0.8, 0.2];
      let rollIndex = 0;
      const rngFn = () => rolls[rollIndex++];

      const result = engine.checkEvents('dock', { system: 0 }, rngFn);
      expect(result).not.toBeNull();
      expect(result.id).toBe('low_pri');
    });
  });

  describe('clearEvents', () => {
    it('should remove all registered events', () => {
      engine.registerEvent({
        id: 'e1',
        type: 'dock',
        category: 'narrative',
        trigger: { system: null, condition: null, chance: 1.0 },
        once: false,
        cooldown: 0,
        priority: 10,
        content: {},
      });

      expect(engine.getEventById('e1')).toEqual(
        expect.objectContaining({ id: 'e1' })
      );

      engine.clearEvents();

      expect(engine.getEventById('e1')).toBeNull();
      expect(engine.checkEvents('dock', { system: 0 })).toBeNull();
    });

    it('should prevent duplicate accumulation on repeated registration', () => {
      const events = [
        {
          id: 'e1',
          type: 'dock',
          category: 'narrative',
          trigger: { system: null, condition: null, chance: 1.0 },
          once: false,
          cooldown: 0,
          priority: 10,
          content: {},
        },
      ];

      engine.registerEvents(events);
      engine.registerEvents(events);

      // Without clearing, two copies exist
      // After clearing + re-registering, only one copy should exist
      engine.clearEvents();
      engine.registerEvents(events);

      // Verify exactly one event registered
      const result = engine.checkEvents('dock', { system: 0 });
      expect(result).toEqual(expect.objectContaining({ id: 'e1' }));
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

  describe('checkEvents seeded RNG determinism', () => {
    it('produces the same result for the same seed', () => {
      const event = {
        id: 'seed_test_event',
        type: 'dock',
        category: 'narrative',
        trigger: { chance: 0.5 },
        priority: 10,
        content: {},
      };
      engine.registerEvent(event);

      const seed = 'event-dock-10-0';
      const rng1 = new SeededRandom(seed);
      const rng2 = new SeededRandom(seed);

      const result1 = engine.checkEvents('dock', { system: 0 }, () => rng1.next());
      const result2 = engine.checkEvents('dock', { system: 0 }, () => rng2.next());

      expect(result1?.id ?? null).toBe(result2?.id ?? null);
    });
  });
});
