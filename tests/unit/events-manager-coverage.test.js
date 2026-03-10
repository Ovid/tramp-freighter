import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { EVENT_NAMES } from '../../src/game/constants.js';

describe('EventsManager coverage', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getActiveEvents', () => {
    it('returns active events array', () => {
      gsm.state.world.activeEvents = [{ systemId: 1, type: 'festival' }];
      const events = gsm.eventsManager.getActiveEvents();
      expect(events).toEqual([{ systemId: 1, type: 'festival' }]);
    });

    it('returns empty array when no events', () => {
      gsm.state.world.activeEvents = [];
      expect(gsm.eventsManager.getActiveEvents()).toEqual([]);
    });
  });

  describe('updateActiveEvents', () => {
    it('replaces active events', () => {
      const newEvents = [{ systemId: 2, type: 'mining_strike' }];
      gsm.eventsManager.updateActiveEvents(newEvents);
      expect(gsm.state.world.activeEvents).toBe(newEvents);
    });

    it('emits ACTIVE_EVENTS_CHANGED', () => {
      const spy = vi.spyOn(gsm, 'emit');
      const newEvents = [{ systemId: 3, type: 'supply_glut' }];
      gsm.eventsManager.updateActiveEvents(newEvents);
      expect(spy).toHaveBeenCalledWith(
        EVENT_NAMES.ACTIVE_EVENTS_CHANGED,
        newEvents
      );
    });
  });

  describe('getActiveEventForSystem', () => {
    it('returns event for matching system', () => {
      gsm.state.world.activeEvents = [
        { systemId: 1, type: 'festival' },
        { systemId: 2, type: 'mining_strike' },
      ];
      const event = gsm.eventsManager.getActiveEventForSystem(2);
      expect(event).toEqual({ systemId: 2, type: 'mining_strike' });
    });

    it('returns null when no event for system', () => {
      gsm.state.world.activeEvents = [{ systemId: 1, type: 'festival' }];
      expect(gsm.eventsManager.getActiveEventForSystem(99)).toBeNull();
    });

    it('returns null for empty events', () => {
      gsm.state.world.activeEvents = [];
      expect(gsm.eventsManager.getActiveEventForSystem(0)).toBeNull();
    });
  });

  describe('getEventType', () => {
    it('returns event type definition for known type', () => {
      const eventType = gsm.eventsManager.getEventType('mining_strike');
      expect(eventType).toBeDefined();
      expect(eventType).toHaveProperty('name');
    });

    it('returns null for unknown type', () => {
      expect(gsm.eventsManager.getEventType('nonexistent')).toBeNull();
    });
  });

  describe('updateTime', () => {
    it('updates daysElapsed', () => {
      gsm.eventsManager.updateTime(15);
      expect(gsm.state.player.daysElapsed).toBe(15);
    });

    it('emits TIME_CHANGED event', () => {
      const spy = vi.spyOn(gsm, 'emit');
      gsm.eventsManager.updateTime(5);
      expect(spy).toHaveBeenCalledWith(EVENT_NAMES.TIME_CHANGED, 5);
    });

    it('does not process day-change logic when time stays the same', () => {
      const currentDay = gsm.state.player.daysElapsed;
      const spy = vi.spyOn(
        gsm.tradingManager,
        'incrementPriceKnowledgeStaleness'
      );
      gsm.eventsManager.updateTime(currentDay);
      expect(spy).not.toHaveBeenCalled();
    });

    it('increments price knowledge staleness when days advance', () => {
      const spy = vi.spyOn(
        gsm.tradingManager,
        'incrementPriceKnowledgeStaleness'
      );
      const oldDays = gsm.state.player.daysElapsed;
      gsm.eventsManager.updateTime(oldDays + 3);
      expect(spy).toHaveBeenCalledWith(3);
    });

    it('applies market recovery when days advance', () => {
      const spy = vi.spyOn(gsm.tradingManager, 'applyMarketRecovery');
      const oldDays = gsm.state.player.daysElapsed;
      gsm.eventsManager.updateTime(oldDays + 5);
      expect(spy).toHaveBeenCalledWith(5);
    });

    it('checks loan defaults when days advance', () => {
      const spy = vi.spyOn(gsm.npcManager, 'checkLoanDefaults');
      const oldDays = gsm.state.player.daysElapsed;
      gsm.eventsManager.updateTime(oldDays + 1);
      expect(spy).toHaveBeenCalled();
    });

    it('checks mission deadlines when days advance', () => {
      const spy = vi.spyOn(gsm.missionManager, 'checkMissionDeadlines');
      const oldDays = gsm.state.player.daysElapsed;
      gsm.eventsManager.updateTime(oldDays + 1);
      expect(spy).toHaveBeenCalled();
    });

    it('processes debt tick when days advance', () => {
      const spy = vi.spyOn(gsm.debtManager, 'applyInterest');
      const oldDays = gsm.state.player.daysElapsed;
      gsm.eventsManager.updateTime(oldDays + 1);
      expect(spy).toHaveBeenCalled();
    });

    it('recalculates prices when days advance', () => {
      const spy = vi.spyOn(
        gsm.tradingManager,
        'recalculatePricesForKnownSystems'
      );
      const oldDays = gsm.state.player.daysElapsed;
      gsm.eventsManager.updateTime(oldDays + 1);
      expect(spy).toHaveBeenCalled();
    });

    it('emits ACTIVE_EVENTS_CHANGED when days advance', () => {
      const spy = vi.spyOn(gsm, 'emit');
      const oldDays = gsm.state.player.daysElapsed;
      gsm.eventsManager.updateTime(oldDays + 1);
      const eventsCalls = spy.mock.calls.filter(
        (c) => c[0] === EVENT_NAMES.ACTIVE_EVENTS_CHANGED
      );
      expect(eventsCalls.length).toBeGreaterThanOrEqual(1);
    });

    it('does not advance for earlier day', () => {
      gsm.state.player.daysElapsed = 10;
      const spy = vi.spyOn(
        gsm.tradingManager,
        'incrementPriceKnowledgeStaleness'
      );
      gsm.eventsManager.updateTime(5);
      expect(spy).not.toHaveBeenCalled();
      // But daysElapsed is still updated
      expect(gsm.state.player.daysElapsed).toBe(5);
    });
  });
});
