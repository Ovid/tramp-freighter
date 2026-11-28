import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { InformationBroker } from '@game/game-information-broker.js';
import { STAR_DATA } from '@game/data/star-data.js';
import { EVENT_NAMES, INTELLIGENCE_CONFIG } from '@game/constants.js';

// Writes go through the manager that owns the slice, so pure helpers must
// leave state alone and hand back what to apply.

describe('slice owner writes', () => {
  let game;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    game = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('InformationBroker.purchaseIntelligence', () => {
    it('leaves the state alone and returns the cost and price entry', () => {
      const state = game.getState();
      state.player.credits = 10000;
      const before = JSON.parse(JSON.stringify(state));

      const result = InformationBroker.purchaseIntelligence(
        state,
        1,
        STAR_DATA
      );

      expect(state).toEqual(before);
      expect(result.success).toBe(true);
      expect(result.cost).toBe(game.getIntelligenceCost(1));
      expect(result.priceEntry.source).toBe(
        INTELLIGENCE_CONFIG.SOURCES.INTELLIGENCE_BROKER
      );
    });
  });

  describe('resetNPCInteractions', () => {
    it('zeroes the count, saves, and reports the NPC change', () => {
      game.getNPCState('yumi_delta_pavonis').interactions = 5;
      const markDirty = vi.spyOn(game, 'markDirty');
      const npcEvents = [];
      game.subscribe(EVENT_NAMES.NPCS_CHANGED, (n) => npcEvents.push(n));

      game.resetNPCInteractions('yumi_delta_pavonis');

      expect(game.getNPCState('yumi_delta_pavonis').interactions).toBe(0);
      expect(markDirty).toHaveBeenCalled();
      expect(npcEvents).toHaveLength(1);
      expect(npcEvents[0].yumi_delta_pavonis.interactions).toBe(0);
    });
  });

  describe('StateManager.updateStats', () => {
    it('adds the delta, starting a missing counter at zero', () => {
      const stats = game.getState().stats;
      stats.cargoHauled = 4;
      delete stats.rumorsPurchased;

      game.stateManager.updateStats('cargoHauled', 3);
      game.stateManager.updateStats('rumorsPurchased', 1);

      expect(stats.cargoHauled).toBe(7);
      expect(stats.rumorsPurchased).toBe(1);
    });

    it('does nothing when the save has no stats', () => {
      delete game.getState().stats;

      expect(() =>
        game.stateManager.updateStats('cargoHauled', 1)
      ).not.toThrow();
      expect(game.getState().stats).toBeUndefined();
    });
  });

  describe('fuel clamp on upgrade removal', () => {
    it('sets fuel through the fuel owner', () => {
      const ship = game.getState().ship;
      ship.upgrades.push('extended_tank');
      ship.fuelCapacity = game.shipManager.getFuelCapacity();
      ship.fuel = ship.fuelCapacity;
      const updateFuel = vi.spyOn(game.stateManager, 'updateFuel');

      game.shipManager.removeUpgrade('extended_tank');

      expect(updateFuel).toHaveBeenCalledWith(
        game.shipManager.getFuelCapacity()
      );
    });
  });
});
