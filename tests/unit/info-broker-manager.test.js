'use strict';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createTestGameStateManager,
  TEST_STAR_DATA,
  TEST_WORMHOLE_DATA,
} from '../test-utils.js';
import { GameStateManager } from '@game/state/game-state-manager.js';
import { NavigationSystem } from '@game/game-navigation.js';
import { EVENT_NAMES } from '@game/constants.js';

/**
 * Unit tests for InfoBrokerManager
 *
 * InfoBrokerManager is a thin wrapper around InformationBroker that handles
 * event emission and state persistence via the Bridge Pattern.
 *
 * Test data: Player starts at Sol (id:0). Connected systems via wormholes:
 * Alpha Centauri A (1), Barnard's Star (4), Sirius A (7).
 */
describe('InfoBrokerManager', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    gsm = createTestGameStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getIntelligenceCost', () => {
    it('returns a positive number for a valid connected system', () => {
      const cost = gsm.getIntelligenceCost(1);

      expect(cost).toBeGreaterThan(0);
    });

    it('cost is consistent across calls for same state', () => {
      const cost1 = gsm.getIntelligenceCost(1);
      const cost2 = gsm.getIntelligenceCost(1);

      expect(cost1).toBe(cost2);
    });
  });

  describe('purchaseIntelligence', () => {
    beforeEach(() => {
      const state = gsm.getState();
      state.player.credits = 10000;
    });

    it('successful purchase returns { success: true }', () => {
      const result = gsm.purchaseIntelligence(1);

      expect(result.success).toBe(true);
    });

    it('successful purchase emits CREDITS_CHANGED event', () => {
      const callback = vi.fn();
      gsm.eventSystemManager.subscribe(EVENT_NAMES.CREDITS_CHANGED, callback);

      gsm.purchaseIntelligence(1);

      expect(callback).toHaveBeenCalled();
    });

    it('successful purchase emits PRICE_KNOWLEDGE_CHANGED event', () => {
      const callback = vi.fn();
      gsm.eventSystemManager.subscribe(
        EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED,
        callback
      );

      gsm.purchaseIntelligence(1);

      expect(callback).toHaveBeenCalled();
    });

    it('successful purchase marks state dirty', () => {
      const markDirtySpy = vi.spyOn(gsm, 'markDirty');

      gsm.purchaseIntelligence(1);

      expect(markDirtySpy).toHaveBeenCalled();
    });

    it('purchase with insufficient credits returns { success: false }', () => {
      const state = gsm.getState();
      state.player.credits = 0;

      const result = gsm.purchaseIntelligence(1);

      expect(result.success).toBe(false);
    });

    it('failed purchase does NOT emit events', () => {
      const state = gsm.getState();
      state.player.credits = 0;

      const creditsCallback = vi.fn();
      const priceCallback = vi.fn();
      gsm.eventSystemManager.subscribe(
        EVENT_NAMES.CREDITS_CHANGED,
        creditsCallback
      );
      gsm.eventSystemManager.subscribe(
        EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED,
        priceCallback
      );

      gsm.purchaseIntelligence(1);

      expect(creditsCallback).not.toHaveBeenCalled();
      expect(priceCallback).not.toHaveBeenCalled();
    });
  });

  describe('generateRumor', () => {
    it('returns a non-empty string', () => {
      const rumor = gsm.generateRumor();

      expect(rumor.length).toBeGreaterThan(0);
    });

    it('returns a string', () => {
      const rumor = gsm.generateRumor();

      expect(typeof rumor).toBe('string');
    });

    it('returns Tanaka hint when player has 5+ systems visited and tanaka_met not set', () => {
      const state = gsm.getState();
      state.world.visitedSystems = [0, 1, 4, 5, 7];
      state.world.narrativeEvents = state.world.narrativeEvents || {};
      state.world.narrativeEvents.flags =
        state.world.narrativeEvents.flags || {};
      delete state.world.narrativeEvents.flags.tanaka_met;

      const rumors = new Set();
      for (let day = 0; day < 50; day++) {
        state.player.daysElapsed = day;
        rumors.add(gsm.generateRumor());
      }
      const hasTanakaRumor = [...rumors].some(
        (r) => r.includes('Tanaka') || r.includes('Barnard')
      );
      expect(hasTanakaRumor).toBe(true);
    });

    it('does not return Tanaka hint when tanaka_met flag is set', () => {
      const state = gsm.getState();
      state.world.visitedSystems = [0, 1, 4, 5, 7];
      state.world.narrativeEvents = state.world.narrativeEvents || {};
      state.world.narrativeEvents.flags =
        state.world.narrativeEvents.flags || {};
      state.world.narrativeEvents.flags.tanaka_met = true;

      const rumors = new Set();
      for (let day = 0; day < 50; day++) {
        state.player.daysElapsed = day;
        rumors.add(gsm.generateRumor());
      }
      const hasTanakaRumor = [...rumors].some(
        (r) => r.includes('Tanaka') || r.includes('Barnard')
      );
      expect(hasTanakaRumor).toBe(false);
    });

    it('does not return Tanaka hint when fewer than 5 systems visited', () => {
      const state = gsm.getState();
      state.world.visitedSystems = [0, 1];
      state.world.narrativeEvents = state.world.narrativeEvents || {};
      state.world.narrativeEvents.flags =
        state.world.narrativeEvents.flags || {};

      const rumors = new Set();
      for (let day = 0; day < 50; day++) {
        state.player.daysElapsed = day;
        rumors.add(gsm.generateRumor());
      }
      const hasTanakaRumor = [...rumors].some(
        (r) => r.includes('Tanaka') || r.includes('Barnard')
      );
      expect(hasTanakaRumor).toBe(false);
    });
  });

  describe('listAvailableIntelligence', () => {
    beforeEach(() => {
      // listAvailableIntelligence requires a NavigationSystem for wormhole lookups
      const navigationSystem = new NavigationSystem(
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA
      );
      gsm = new GameStateManager(
        TEST_STAR_DATA,
        TEST_WORMHOLE_DATA,
        navigationSystem
      );
      gsm.initNewGame();
    });

    it('returns an array', () => {
      const available = gsm.listAvailableIntelligence();

      expect(Array.isArray(available)).toBe(true);
    });

    it('each item has systemId, systemName, cost properties', () => {
      const available = gsm.listAvailableIntelligence();

      expect(available.length).toBeGreaterThan(0);
      for (const item of available) {
        expect(item).toHaveProperty('systemId');
        expect(item).toHaveProperty('systemName');
        expect(item).toHaveProperty('cost');
      }
    });

    it('only lists systems connected to current system', () => {
      const available = gsm.listAvailableIntelligence();
      const systemIds = available.map((item) => item.systemId);

      // Sol (0) connects to Alpha Centauri A (1), Barnard's Star (4), Sirius A (7)
      expect(systemIds).toContain(1);
      expect(systemIds).toContain(4);
      expect(systemIds).toContain(7);

      // Should not include Sol itself or unconnected systems
      expect(systemIds).not.toContain(0);
      expect(systemIds).not.toContain(13); // Epsilon Eridani connects to Alpha Centauri, not Sol
    });

    it('with advanced_sensors upgrade, items may include event property', () => {
      const state = gsm.getState();
      state.ship.upgrades.push('advanced_sensors');

      // Add an active event on a connected system
      state.world.activeEvents = [
        {
          systemId: 1,
          name: 'Mining Strike',
          commodity: 'ore',
          modifier: 0.5,
          type: 'mining_strike',
        },
      ];

      const available = gsm.listAvailableIntelligence();
      const alphaCentauri = available.find((item) => item.systemId === 1);

      expect(alphaCentauri).toBeDefined();
      expect(alphaCentauri.event).toBeDefined();
      expect(alphaCentauri.event.name).toBe('Mining Strike');
      expect(alphaCentauri.event.commodity).toBe('ore');
      expect(alphaCentauri.event.modifier).toBe(0.5);
    });
  });
});
