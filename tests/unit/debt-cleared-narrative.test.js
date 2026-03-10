import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { EVENT_NAMES } from '../../src/game/constants.js';
import { NARRATIVE_EVENTS } from '../../src/game/data/narrative-events.js';

describe('Debt-Cleared Narrative Event', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    gsm = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    gsm.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('EVENT_NAMES.DEBT_CLEARED', () => {
    it('exists in EVENT_NAMES', () => {
      expect(EVENT_NAMES.DEBT_CLEARED).toBeDefined();
      expect(typeof EVENT_NAMES.DEBT_CLEARED).toBe('string');
    });
  });

  describe('DebtManager emits DEBT_CLEARED', () => {
    it('emits DEBT_CLEARED when makePayment reduces debt to zero', () => {
      const spy = vi.fn();
      gsm.subscribe(EVENT_NAMES.DEBT_CLEARED, spy);

      // Set debt to a small payable amount
      const smallDebt = 100;
      gsm.state.player.debt = smallDebt;
      gsm.state.player.credits = smallDebt;

      gsm.debtManager.makePayment(smallDebt);

      expect(gsm.state.player.debt).toBe(0);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does not emit DEBT_CLEARED when makePayment does not zero out debt', () => {
      const spy = vi.fn();
      gsm.subscribe(EVENT_NAMES.DEBT_CLEARED, spy);

      gsm.state.player.debt = 200;
      gsm.state.player.credits = 100;

      gsm.debtManager.makePayment(100);

      expect(gsm.state.player.debt).toBe(100);
      expect(spy).not.toHaveBeenCalled();
    });

    it('does not emit DEBT_CLEARED from applyWithholding (pure penalty)', () => {
      const spy = vi.fn();
      gsm.subscribe(EVENT_NAMES.DEBT_CLEARED, spy);

      // Cole's cut no longer reduces debt, so DEBT_CLEARED never fires
      gsm.state.player.debt = 5;
      gsm.state.player.finance.heat = 0;

      gsm.debtManager.applyWithholding(100);

      expect(gsm.state.player.debt).toBe(5);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('cond_debt_free narrative content', () => {
    it('contains four text paragraphs', () => {
      const event = NARRATIVE_EVENTS.find((e) => e.id === 'cond_debt_free');
      expect(event).toBeDefined();
      expect(event.content.text).toHaveLength(4);
    });

    it('fourth paragraph nudges player toward station opportunities', () => {
      const event = NARRATIVE_EVENTS.find((e) => e.id === 'cond_debt_free');
      const lastLine = event.content.text[3];
      // Should mention stations/opportunities without naming specific locations
      expect(lastLine).toMatch(/station/i);
      expect(lastLine).toMatch(/opportunit/i);
    });
  });

  describe('DEBT_CLEARED triggers narrative event emission', () => {
    it('emitting DEBT_CLEARED causes NARRATIVE_EVENT_TRIGGERED with cond_debt_free data', () => {
      const narrativeSpy = vi.fn();
      gsm.subscribe(EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED, narrativeSpy);

      // Register the debt-cleared listener the way useEventTriggers does
      const debtFreeEvent = gsm.getEventById('cond_debt_free');
      expect(debtFreeEvent).toBeDefined();

      // Simulate what the useEventTriggers DEBT_CLEARED listener does:
      // look up the event and emit it as a narrative event
      const handleDebtCleared = () => {
        const event = gsm.getEventById('cond_debt_free');
        if (event) {
          gsm.emit(EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED, { ...event });
        }
      };

      gsm.subscribe(EVENT_NAMES.DEBT_CLEARED, handleDebtCleared);

      // Now trigger debt clearance via payment
      gsm.state.player.debt = 100;
      gsm.state.player.credits = 100;
      gsm.debtManager.makePayment(100);

      expect(narrativeSpy).toHaveBeenCalledTimes(1);
      const emittedEvent = narrativeSpy.mock.calls[0][0];
      expect(emittedEvent.id).toBe('cond_debt_free');
      expect(emittedEvent.content.text).toHaveLength(4);
      expect(emittedEvent.content.mood).toBe('triumphant');
    });

    it('does not re-trigger if event has already been fired (once: true)', () => {
      const narrativeSpy = vi.fn();
      gsm.subscribe(EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED, narrativeSpy);

      const handleDebtCleared = () => {
        const event = gsm.getEventById('cond_debt_free');
        if (event) {
          // Check once-only guard: skip if already fired
          const fired = gsm.state.world.narrativeEvents.fired;
          if (event.once && fired.includes(event.id)) return;
          gsm.emit(EVENT_NAMES.NARRATIVE_EVENT_TRIGGERED, { ...event });
        }
      };

      gsm.subscribe(EVENT_NAMES.DEBT_CLEARED, handleDebtCleared);

      // Mark the event as already fired
      gsm.markEventFired('cond_debt_free');

      // Now trigger debt clearance
      gsm.state.player.debt = 100;
      gsm.state.player.credits = 100;
      gsm.debtManager.makePayment(100);

      // Should not emit narrative event since it was already fired
      expect(narrativeSpy).not.toHaveBeenCalled();
    });
  });
});
