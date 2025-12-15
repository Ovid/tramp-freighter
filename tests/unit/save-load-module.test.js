'use strict';

import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveGame,
  loadGame,
  hasSavedGame,
  clearSave,
} from '../../src/game/state/save-load.js';

function createTestState() {
  return {
    player: { credits: 1000, debt: 5000, currentSystem: 1, daysElapsed: 10 },
    ship: { name: 'Test Ship', fuel: 100, cargoCapacity: 100, cargo: [] },
    world: {
      visitedSystems: [1],
      priceKnowledge: {},
      activeEvents: [],
      marketConditions: {},
    },
    meta: { version: '2.1.0', timestamp: Date.now() },
  };
}

describe('save-load module', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('saveGame', () => {
    it('should save game state to localStorage', () => {
      const testState = createTestState();

      const result = saveGame(testState, 0, true);

      expect(result.success).toBe(true);
      expect(result.newLastSaveTime).toBeGreaterThan(0);
      expect(localStorage.getItem('trampFreighterSave')).not.toBeNull();
    });

    it('should debounce saves within 1 second', () => {
      const testState = createTestState();

      // First save should succeed
      const firstResult = saveGame(testState, 0, true);
      expect(firstResult.success).toBe(true);

      // Immediate second save should be debounced
      const secondResult = saveGame(
        testState,
        firstResult.newLastSaveTime,
        true
      );
      expect(secondResult.success).toBe(false);
      expect(secondResult.newLastSaveTime).toBe(firstResult.newLastSaveTime);
    });

    it('should return false if state is null', () => {
      // Mock console.error to suppress expected error message
      const originalConsoleError = console.error;
      console.error = () => {};

      try {
        const result = saveGame(null, 0, true);
        expect(result.success).toBe(false);
      } finally {
        console.error = originalConsoleError;
      }
    });
  });

  describe('loadGame', () => {
    it('should load game state from localStorage', () => {
      const testState = createTestState();

      // Save first
      saveGame(testState, 0, true);

      // Then load
      const loadedState = loadGame(true);

      expect(loadedState).not.toBeNull();
      expect(loadedState.player.credits).toBe(1000);
      expect(loadedState.ship.name).toBe('Test Ship');
    });

    it('should return null if no save exists', () => {
      const loadedState = loadGame(true);
      expect(loadedState).toBeNull();
    });

    it('should return null if save data is corrupted', () => {
      localStorage.setItem('trampFreighterSave', 'invalid json');
      const loadedState = loadGame(true);
      expect(loadedState).toBeNull();
    });
  });

  describe('hasSavedGame', () => {
    it('should return true if save exists', () => {
      const testState = createTestState();

      saveGame(testState, 0, true);
      expect(hasSavedGame()).toBe(true);
    });

    it('should return false if no save exists', () => {
      expect(hasSavedGame()).toBe(false);
    });
  });

  describe('clearSave', () => {
    it('should remove save data from localStorage', () => {
      const testState = createTestState();

      // Save first
      saveGame(testState, 0, true);
      expect(hasSavedGame()).toBe(true);

      // Clear
      const result = clearSave(true);
      expect(result).toBe(true);
      expect(hasSavedGame()).toBe(false);
    });
  });
});
