import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

/**
 * Property-based tests for danger system state persistence
 *
 * Tests that karma, faction reputation, hidden cargo, and danger flags
 * survive save/load operations correctly.
 *
 * Feature: danger-system, Property 15: State Persistence Round-Trip
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */
describe('Danger System State Persistence', () => {
  let gameStateManager;

  beforeEach(() => {
    // Mock localStorage for testing
    const mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      }),
    });

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
    
    // Reset lastSaveTime to avoid debouncing issues in tests
    gameStateManager.saveLoadManager.setLastSaveTime(0);
  });

  it('should preserve karma through save/load round-trip', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (karmaValue, reason) => {
          // Reset lastSaveTime to avoid debouncing issues between iterations
          gameStateManager.saveLoadManager.setLastSaveTime(0);

          // Set karma to test value
          gameStateManager.getState().player.karma = karmaValue;

          // Save and load
          const saveResult = gameStateManager.saveGame();
          expect(saveResult).toBe(true);

          const loadResult = gameStateManager.loadGame();
          expect(loadResult).not.toBeNull();

          // Verify karma is preserved
          const loadedKarma = gameStateManager.getState().player.karma;
          expect(loadedKarma).toBe(karmaValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve faction reputation through save/load round-trip', () => {
    fc.assert(
      fc.property(
        fc.record({
          authorities: fc.integer({ min: -100, max: 100 }),
          traders: fc.integer({ min: -100, max: 100 }),
          outlaws: fc.integer({ min: -100, max: 100 }),
          civilians: fc.integer({ min: -100, max: 100 }),
        }),
        (factionReps) => {
          // Reset lastSaveTime to avoid debouncing issues between iterations
          gameStateManager.saveLoadManager.setLastSaveTime(0);

          // Set faction reputations to test values
          gameStateManager.getState().player.factions = { ...factionReps };

          // Save and load
          const saveResult = gameStateManager.saveGame();
          expect(saveResult).toBe(true);

          const loadResult = gameStateManager.loadGame();
          expect(loadResult).not.toBeNull();

          // Verify all faction reputations are preserved
          const loadedFactions = gameStateManager.getState().player.factions;
          expect(loadedFactions.authorities).toBe(factionReps.authorities);
          expect(loadedFactions.traders).toBe(factionReps.traders);
          expect(loadedFactions.outlaws).toBe(factionReps.outlaws);
          expect(loadedFactions.civilians).toBe(factionReps.civilians);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve hidden cargo through save/load round-trip', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            good: fc.constantFrom('grain', 'medicine', 'electronics', 'parts', 'tritium'),
            qty: fc.integer({ min: 1, max: 10 }),
            buyPrice: fc.integer({ min: 100, max: 1000 }),
            buySystem: fc.integer({ min: 0, max: 20 }),
            buySystemName: fc.string({ minLength: 3, maxLength: 20 }),
            buyDate: fc.integer({ min: 0, max: 100 }),
          }),
          { maxLength: 5 }
        ),
        (hiddenCargoItems) => {
          // Reset lastSaveTime to avoid debouncing issues between iterations
          gameStateManager.saveLoadManager.setLastSaveTime(0);

          // Set hidden cargo to test values
          gameStateManager.getState().ship.hiddenCargo = [...hiddenCargoItems];

          // Save and load
          const saveResult = gameStateManager.saveGame();
          expect(saveResult).toBe(true);

          const loadResult = gameStateManager.loadGame();
          expect(loadResult).not.toBeNull();

          // Verify hidden cargo is preserved
          const loadedHiddenCargo = gameStateManager.getState().ship.hiddenCargo;
          expect(loadedHiddenCargo).toEqual(hiddenCargoItems);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve danger flags through save/load round-trip', () => {
    fc.assert(
      fc.property(
        fc.record({
          piratesFought: fc.integer({ min: 0, max: 50 }),
          piratesNegotiated: fc.integer({ min: 0, max: 50 }),
          civiliansSaved: fc.integer({ min: 0, max: 50 }),
          civiliansLooted: fc.integer({ min: 0, max: 50 }),
          inspectionsPassed: fc.integer({ min: 0, max: 50 }),
          inspectionsBribed: fc.integer({ min: 0, max: 50 }),
          inspectionsFled: fc.integer({ min: 0, max: 50 }),
        }),
        (dangerFlags) => {
          // Reset lastSaveTime to avoid debouncing issues between iterations
          gameStateManager.saveLoadManager.setLastSaveTime(0);

          // Initialize world.dangerFlags if it doesn't exist
          if (!gameStateManager.getState().world.dangerFlags) {
            gameStateManager.getState().world.dangerFlags = {};
          }

          // Set danger flags to test values
          gameStateManager.getState().world.dangerFlags = { ...dangerFlags };

          // Save and load
          const saveResult = gameStateManager.saveGame();
          expect(saveResult).toBe(true);

          const loadResult = gameStateManager.loadGame();
          expect(loadResult).not.toBeNull();

          // Verify danger flags are preserved
          const loadedDangerFlags = gameStateManager.getState().world.dangerFlags;
          expect(loadedDangerFlags).toEqual(dangerFlags);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all danger system state together through save/load round-trip', () => {
    fc.assert(
      fc.property(
        fc.record({
          karma: fc.integer({ min: -100, max: 100 }),
          factions: fc.record({
            authorities: fc.integer({ min: -100, max: 100 }),
            traders: fc.integer({ min: -100, max: 100 }),
            outlaws: fc.integer({ min: -100, max: 100 }),
            civilians: fc.integer({ min: -100, max: 100 }),
          }),
          hiddenCargo: fc.array(
            fc.record({
              good: fc.constantFrom('grain', 'medicine', 'electronics', 'parts', 'tritium'),
              qty: fc.integer({ min: 1, max: 10 }),
              buyPrice: fc.integer({ min: 100, max: 1000 }),
              buySystem: fc.integer({ min: 0, max: 20 }),
              buySystemName: fc.string({ minLength: 3, maxLength: 20 }),
              buyDate: fc.integer({ min: 0, max: 100 }),
            }),
            { maxLength: 3 }
          ),
          dangerFlags: fc.record({
            piratesFought: fc.integer({ min: 0, max: 50 }),
            piratesNegotiated: fc.integer({ min: 0, max: 50 }),
            civiliansSaved: fc.integer({ min: 0, max: 50 }),
            civiliansLooted: fc.integer({ min: 0, max: 50 }),
            inspectionsPassed: fc.integer({ min: 0, max: 50 }),
            inspectionsBribed: fc.integer({ min: 0, max: 50 }),
            inspectionsFled: fc.integer({ min: 0, max: 50 }),
          }),
        }),
        (dangerState) => {
          // Reset lastSaveTime to avoid debouncing issues between iterations
          gameStateManager.saveLoadManager.setLastSaveTime(0);

          // Set all danger system state to test values
          gameStateManager.getState().player.karma = dangerState.karma;
          gameStateManager.getState().player.factions = { ...dangerState.factions };
          gameStateManager.getState().ship.hiddenCargo = [...dangerState.hiddenCargo];
          
          // Initialize world.dangerFlags if it doesn't exist
          if (!gameStateManager.getState().world.dangerFlags) {
            gameStateManager.getState().world.dangerFlags = {};
          }
          gameStateManager.getState().world.dangerFlags = { ...dangerState.dangerFlags };

          // Save and load
          const saveResult = gameStateManager.saveGame();
          expect(saveResult).toBe(true);

          const loadResult = gameStateManager.loadGame();
          expect(loadResult).not.toBeNull();

          // Verify all danger system state is preserved
          const loadedState = gameStateManager.getState();
          expect(loadedState.player.karma).toBe(dangerState.karma);
          expect(loadedState.player.factions).toEqual(dangerState.factions);
          expect(loadedState.ship.hiddenCargo).toEqual(dangerState.hiddenCargo);
          expect(loadedState.world.dangerFlags).toEqual(dangerState.dangerFlags);
        }
      ),
      { numRuns: 100 }
    );
  });
});