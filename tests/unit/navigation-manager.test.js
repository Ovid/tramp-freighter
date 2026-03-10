import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { EVENT_NAMES } from '@game/constants.js';

/**
 * Test: NavigationManager
 *
 * Validates location updates, docking/undocking, system visitation tracking,
 * and price snapshot management. NavigationManager is tested through the
 * GameCoordinator delegation layer using createTestGame.
 *
 * Test data systems (from tests/test-data.js):
 * - id:0 Sol (starting system)
 * - id:1 Alpha Centauri A
 * - id:4 Barnard's Star
 * - id:5 Wolf 359
 * - id:7 Sirius A
 * - id:13 Epsilon Eridani
 *
 * Wormhole connections: [0,1], [0,4], [0,7], [1,13], [4,5]
 */
describe('NavigationManager', () => {
  let gsm;

  beforeEach(() => {
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateLocation', () => {
    it('should update player.currentSystem to new system ID', () => {
      gsm.updateLocation(1);

      const state = gsm.getState();
      expect(state.player.currentSystem).toBe(1);
    });

    it('should add system to visitedSystems on first visit', () => {
      const state = gsm.getState();
      expect(state.world.visitedSystems).not.toContain(1);

      gsm.updateLocation(1);

      expect(state.world.visitedSystems).toContain(1);
    });

    it('should not duplicate in visitedSystems on revisit', () => {
      gsm.updateLocation(1);
      gsm.updateLocation(0);
      gsm.updateLocation(1);

      const state = gsm.getState();
      const occurrences = state.world.visitedSystems.filter(
        (id) => id === 1
      ).length;
      expect(occurrences).toBe(1);
    });

    it('should increment stats.jumpsCompleted', () => {
      const state = gsm.getState();
      const initialJumps = state.stats.jumpsCompleted;

      gsm.updateLocation(1);

      expect(state.stats.jumpsCompleted).toBe(initialJumps + 1);
    });

    it('should emit LOCATION_CHANGED with system ID', () => {
      const callback = vi.fn();
      gsm.eventSystemManager.subscribe(EVENT_NAMES.LOCATION_CHANGED, callback);

      gsm.updateLocation(1);

      expect(callback).toHaveBeenCalledWith(1);
    });

    it('should emit JUMP_COMPLETED with system ID', () => {
      const callback = vi.fn();
      gsm.eventSystemManager.subscribe(EVENT_NAMES.JUMP_COMPLETED, callback);

      gsm.updateLocation(1);

      expect(callback).toHaveBeenCalledWith(1);
    });

    it('should throw Error for invalid system ID', () => {
      expect(() => gsm.updateLocation(999)).toThrow('Invalid system ID');
    });

    it('should snapshot prices after updating location', () => {
      gsm.updateLocation(1);

      const state = gsm.getState();
      expect(state.world.currentSystemPrices).toBeDefined();
      expect(typeof state.world.currentSystemPrices).toBe('object');
      expect(
        Object.keys(state.world.currentSystemPrices).length
      ).toBeGreaterThan(0);
    });
  });

  describe('dock', () => {
    it('should return { success: true }', () => {
      const result = gsm.dock();

      expect(result).toEqual({ success: true });
    });

    it('should update price knowledge for current system', () => {
      gsm.dock();

      const state = gsm.getState();
      const currentSystemId = state.player.currentSystem;
      const priceKnowledge = gsm.getPriceKnowledge();

      expect(priceKnowledge[currentSystemId]).toBeDefined();
      expect(priceKnowledge[currentSystemId].lastVisit).toBe(0);
    });

    it('should emit DOCKED event with { systemId }', () => {
      const callback = vi.fn();
      gsm.eventSystemManager.subscribe(EVENT_NAMES.DOCKED, callback);

      gsm.dock();

      const state = gsm.getState();
      expect(callback).toHaveBeenCalledWith({
        systemId: state.player.currentSystem,
      });
    });

    it('should track system in narrativeEvents.dockedSystems on first dock', () => {
      const state = gsm.getState();
      const currentSystemId = state.player.currentSystem;

      gsm.dock();

      expect(state.world.narrativeEvents.dockedSystems).toContain(
        currentSystemId
      );
    });

    it('should not duplicate in dockedSystems on re-dock', () => {
      const state = gsm.getState();
      const currentSystemId = state.player.currentSystem;

      gsm.dock();
      gsm.dock();

      const occurrences = state.world.narrativeEvents.dockedSystems.filter(
        (id) => id === currentSystemId
      ).length;
      expect(occurrences).toBe(1);
    });

    it('should mark state dirty', () => {
      const markDirtySpy = vi.spyOn(gsm, 'markDirty');

      gsm.dock();

      expect(markDirtySpy).toHaveBeenCalled();
    });
  });

  describe('undock', () => {
    it('should return { success: true }', () => {
      const result = gsm.undock();

      expect(result).toEqual({ success: true });
    });

    it('should emit UNDOCKED event with { systemId }', () => {
      const callback = vi.fn();
      gsm.eventSystemManager.subscribe(EVENT_NAMES.UNDOCKED, callback);

      gsm.undock();

      const state = gsm.getState();
      expect(callback).toHaveBeenCalledWith({
        systemId: state.player.currentSystem,
      });
    });

    it('should mark state dirty', () => {
      const markDirtySpy = vi.spyOn(gsm, 'markDirty');

      gsm.undock();

      expect(markDirtySpy).toHaveBeenCalled();
    });
  });

  describe('isSystemVisited', () => {
    it('should return false for unvisited system', () => {
      expect(gsm.isSystemVisited(13)).toBe(false);
    });

    it('should return true after visiting system via updateLocation', () => {
      gsm.updateLocation(1);

      expect(gsm.isSystemVisited(1)).toBe(true);
    });
  });

  describe('getCurrentSystem', () => {
    it('should return system object for current system', () => {
      const system = gsm.getCurrentSystem();

      expect(system).toBeDefined();
      expect(system.id).toBe(0);
      expect(system.name).toBe('Sol');
    });

    it('should return system object with expected properties', () => {
      const system = gsm.getCurrentSystem();

      expect(system).toHaveProperty('id');
      expect(system).toHaveProperty('name');
      expect(system).toHaveProperty('x');
      expect(system).toHaveProperty('y');
      expect(system).toHaveProperty('z');
    });
  });
});
