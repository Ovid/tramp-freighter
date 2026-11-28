import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { EVENT_NAMES, INTELLIGENCE_CONFIG } from '@game/constants.js';

// Pins the observable results of writes that currently bypass the slice
// owners, so routing them through setters cannot change what the player sees.

describe('slice ownership safety net', () => {
  let game;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    game = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('intelligence purchase', () => {
    it('debits exactly the quoted cost and reports the new balance', () => {
      game.getState().player.credits = 10000;
      const cost = game.getIntelligenceCost(1);
      const emitted = [];
      game.subscribe(EVENT_NAMES.CREDITS_CHANGED, (c) => emitted.push(c));

      const result = game.purchaseIntelligence(1);

      expect(result.success).toBe(true);
      expect(game.getState().player.credits).toBe(10000 - cost);
      expect(emitted).toEqual([10000 - cost]);
    });

    it('records the purchased prices as current broker intelligence', () => {
      game.getState().player.credits = 10000;
      const knowledge = [];
      game.subscribe(EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED, (k) =>
        knowledge.push(k)
      );

      game.purchaseIntelligence(1);

      const entry = game.getState().world.priceKnowledge[1];
      expect(entry.lastVisit).toBe(0);
      expect(entry.source).toBe(
        INTELLIGENCE_CONFIG.SOURCES.INTELLIGENCE_BROKER
      );
      expect(Object.keys(entry.prices).length).toBeGreaterThan(0);
      expect(knowledge).toHaveLength(1);
      expect(knowledge[0][1]).toEqual(entry);
    });

    it('leaves credits and price knowledge untouched when the player cannot pay', () => {
      game.getState().player.credits = 0;
      const before = JSON.parse(
        JSON.stringify(game.getState().world.priceKnowledge)
      );

      const result = game.purchaseIntelligence(1);

      expect(result.success).toBe(false);
      expect(game.getState().player.credits).toBe(0);
      expect(game.getState().world.priceKnowledge).toEqual(before);
    });
  });

  describe('stats from quest rewards', () => {
    it('adds a quest credit reward to credits and to creditsEarned', () => {
      const questId = Object.keys(game.questManager.questDefinitions).find(
        (id) =>
          game.questManager.questDefinitions[id].stages.some(
            (s) => s.rewards?.credits
          )
      );
      expect(questId).toBeDefined();
      const stageDef = game.questManager.questDefinitions[questId].stages.find(
        (s) => s.rewards?.credits
      );
      const questState = game.questManager.getQuestState(questId);
      questState.stage = stageDef.stage;
      questState.data._rewardsClaimedStage = stageDef.stage - 1;
      vi.spyOn(game.questManager, 'checkObjectivesComplete').mockReturnValue(
        true
      );
      const state = game.getState();
      state.player.credits = 100;
      state.stats.creditsEarned = 7;

      const result = game.questManager.claimStageRewards(questId);

      expect(result.success).toBe(true);
      expect(state.player.credits).toBe(100 + stageDef.rewards.credits);
      expect(state.stats.creditsEarned).toBe(7 + stageDef.rewards.credits);
    });
  });

  describe('fuel clamp on upgrade removal', () => {
    it('clamps fuel to the reduced capacity and reports it', () => {
      const ship = game.getState().ship;
      ship.upgrades.push('extended_tank');
      ship.fuelCapacity = game.shipManager.getFuelCapacity();
      ship.fuel = ship.fuelCapacity;
      expect(ship.fuel).toBeGreaterThan(100);
      const fuelEvents = [];
      const capacityEvents = [];
      game.subscribe(EVENT_NAMES.FUEL_CHANGED, (f) => fuelEvents.push(f));
      game.subscribe(EVENT_NAMES.FUEL_CAPACITY_CHANGED, (c) =>
        capacityEvents.push(c)
      );

      const result = game.shipManager.removeUpgrade('extended_tank');

      expect(result.success).toBe(true);
      const capacity = game.shipManager.getFuelCapacity();
      expect(ship.fuelCapacity).toBe(capacity);
      expect(ship.fuel).toBe(capacity);
      expect(capacityEvents).toEqual([capacity]);
      expect(fuelEvents).toEqual([capacity]);
    });

    it('leaves fuel alone when it already fits the reduced capacity', () => {
      const ship = game.getState().ship;
      ship.upgrades.push('extended_tank');
      ship.fuelCapacity = game.shipManager.getFuelCapacity();
      ship.fuel = 40;
      const fuelEvents = [];
      game.subscribe(EVENT_NAMES.FUEL_CHANGED, (f) => fuelEvents.push(f));

      game.shipManager.removeUpgrade('extended_tank');

      expect(ship.fuel).toBe(40);
      expect(fuelEvents).toEqual([]);
    });
  });
});
