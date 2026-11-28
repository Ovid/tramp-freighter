import { describe, it, expect, beforeEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { EVENT_NAMES } from '@game/constants.js';

// Pins what each array/object-slice emitter sends, so changing how the
// payload is built (live reference vs copy) cannot change its contents.
describe('emitted slice payloads match state', () => {
  let game;
  let last;

  const capture = (eventName) => {
    last = undefined;
    game.eventSystemManager.subscribe(eventName, (data) => {
      last = data;
    });
  };

  beforeEach(() => {
    game = createTestGame();
    game.getState().player.credits = 100000;
  });

  it('addUpgrade emits the installed upgrades', () => {
    capture(EVENT_NAMES.UPGRADES_CHANGED);
    game.addUpgrade('extended_tank');
    expect(last).toEqual(game.getState().ship.upgrades);
    expect(last).toContain('extended_tank');
  });

  it('removeUpgrade emits the remaining upgrades', () => {
    game.addUpgrade('extended_tank');
    game.addUpgrade('reinforced_hull');
    capture(EVENT_NAMES.UPGRADES_CHANGED);
    game.removeUpgrade('extended_tank');
    expect(last).toEqual(['reinforced_hull']);
  });

  it('purchaseUpgrade emits the installed upgrades', () => {
    capture(EVENT_NAMES.UPGRADES_CHANGED);
    game.purchaseUpgrade('extended_tank');
    expect(last).toEqual(game.getState().ship.upgrades);
    expect(last).toContain('extended_tank');
  });

  it('addQuirk and removeQuirk emit the current quirks', () => {
    game.getState().ship.quirks = [];
    capture(EVENT_NAMES.QUIRKS_CHANGED);
    game.addQuirk('sticky_seal');
    expect(last).toEqual(['sticky_seal']);
    game.removeQuirk('sticky_seal');
    expect(last).toEqual([]);
  });

  it('updatePriceKnowledge emits the price knowledge', () => {
    capture(EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED);
    game.updatePriceKnowledge(4, { grain: 10 }, 3);
    expect(last).toEqual(game.getState().world.priceKnowledge);
    expect(last[4]).toMatchObject({ lastVisit: 3, prices: { grain: 10 } });
  });

  it('incrementPriceKnowledgeStaleness emits the aged price knowledge', () => {
    game.updatePriceKnowledge(4, { grain: 10 }, 3);
    capture(EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED);
    game.incrementPriceKnowledgeStaleness(2);
    expect(last).toEqual(game.getState().world.priceKnowledge);
    expect(last[4].lastVisit).toBe(5);
  });

  it('recalculatePricesForKnownSystems emits the recalculated knowledge', () => {
    capture(EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED);
    game.recalculatePricesForKnownSystems();
    expect(last).toEqual(game.getState().world.priceKnowledge);
  });

  it('purchaseIntelligence emits the price knowledge including the bought system', () => {
    capture(EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED);
    const result = game.purchaseIntelligence(1);
    expect(result.success).toBe(true);
    expect(last).toEqual(game.getState().world.priceKnowledge);
    expect(last[1]).toBeDefined();
  });
});
