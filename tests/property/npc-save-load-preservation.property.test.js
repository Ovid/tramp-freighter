import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

/**
 * Property-based tests for NPC save/load preservation
 *
 * Feature: npc-foundation, Property 3: Save/load NPC state preservation
 * Validates: Requirements 1.3, 5.5, 8.2, 8.4
 */

describe('NPC Save/Load Preservation Property Tests', () => {
  let game;
  let originalLocalStorage;

  beforeEach(() => {
    // Mock localStorage for testing
    originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };

    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
  });

  // Generator for NPC state objects
  const arbNPCState = () =>
    fc.record({
      rep: fc.integer({ min: -100, max: 100 }),
      lastInteraction: fc.nat({ max: 1000 }),
      flags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
        maxLength: 10,
      }),
      interactions: fc.nat({ max: 100 }),
    });

  // Generator for NPC states map
  const arbNPCStates = () =>
    fc.dictionary(
      fc.string({ minLength: 1, maxLength: 20 }), // NPC IDs
      arbNPCState(),
      { maxKeys: 5 }
    );

  it('should preserve NPC state through save/load cycle', () => {
    // Feature: npc-foundation, Property 3: Save/load NPC state preservation
    fc.assert(
      fc.property(arbNPCStates(), (npcStates) => {
        // Set up NPC states in game state
        game.state.npcs = npcStates;

        // Create mock localStorage that actually stores data
        let storedData = null;
        global.localStorage = {
          getItem: () => storedData,
          setItem: (key, value) => {
            storedData = value;
          },
          removeItem: () => {
            storedData = null;
          },
        };

        // Reset lastSaveTime to ensure save is not debounced
        game.lastSaveTime = 0;

        // Save the game
        const saveResult = game.saveGame();
        expect(saveResult).toBe(true);

        // Create new game state manager and load
        const newGameCoordinator = new GameCoordinator(
          STAR_DATA,
          WORMHOLE_DATA
        );
        const loadedState = newGameCoordinator.loadGame();

        // Verify state was loaded
        expect(loadedState).not.toBeNull();

        // Verify NPC states are preserved
        expect(newGameCoordinator.state.npcs).toEqual(npcStates);

        // Verify each NPC state has all required fields
        for (const [npcId, expectedState] of Object.entries(npcStates)) {
          const actualState = newGameCoordinator.state.npcs[npcId];
          expect(actualState).toBeDefined();
          expect(actualState.rep).toBe(expectedState.rep);
          expect(actualState.lastInteraction).toBe(
            expectedState.lastInteraction
          );
          expect(actualState.flags).toEqual(expectedState.flags);
          expect(actualState.interactions).toBe(expectedState.interactions);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty NPC state preservation', () => {
    // Feature: npc-foundation, Property 3: Save/load NPC state preservation
    fc.assert(
      fc.property(fc.constant({}), (emptyNPCStates) => {
        // Set up empty NPC states
        game.state.npcs = emptyNPCStates;

        // Create mock localStorage that actually stores data
        let storedData = null;
        global.localStorage = {
          getItem: () => storedData,
          setItem: (key, value) => {
            storedData = value;
          },
          removeItem: () => {
            storedData = null;
          },
        };

        // Reset lastSaveTime to ensure save is not debounced
        game.lastSaveTime = 0;

        // Save the game
        const saveResult = game.saveGame();
        expect(saveResult).toBe(true);

        // Create new game state manager and load
        const newGameCoordinator = new GameCoordinator(
          STAR_DATA,
          WORMHOLE_DATA
        );
        const loadedState = newGameCoordinator.loadGame();

        // Verify state was loaded
        expect(loadedState).not.toBeNull();

        // Verify empty NPC states are preserved
        expect(newGameCoordinator.state.npcs).toEqual({});
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve NPC state with complex flag arrays', () => {
    // Feature: npc-foundation, Property 3: Save/load NPC state preservation
    fc.assert(
      fc.property(
        fc.record({
          testNpc: fc.record({
            rep: fc.integer({ min: -100, max: 100 }),
            lastInteraction: fc.nat({ max: 1000 }),
            flags: fc.array(
              fc.oneof(
                fc.constant('backstory_1'),
                fc.constant('met_before'),
                fc.constant('helped_player'),
                fc.string({ minLength: 5, maxLength: 15 })
              ),
              { minLength: 0, maxLength: 8 }
            ),
            interactions: fc.nat({ max: 50 }),
          }),
        }),
        (npcStates) => {
          // Set up NPC states
          game.state.npcs = npcStates;

          // Create mock localStorage that actually stores data
          let storedData = null;
          global.localStorage = {
            getItem: () => storedData,
            setItem: (key, value) => {
              storedData = value;
            },
            removeItem: () => {
              storedData = null;
            },
          };

          // Reset lastSaveTime to ensure save is not debounced
          game.lastSaveTime = 0;

          // Save the game
          const saveResult = game.saveGame();
          expect(saveResult).toBe(true);

          // Create new game state manager and load
          const newGameCoordinator = new GameCoordinator(
            STAR_DATA,
            WORMHOLE_DATA
          );
          const loadedState = newGameCoordinator.loadGame();

          // Verify state was loaded
          expect(loadedState).not.toBeNull();

          // Verify NPC states are preserved exactly
          expect(newGameCoordinator.state.npcs).toEqual(npcStates);

          // Verify flag arrays are preserved as arrays (not converted to objects)
          const testNpcState = newGameCoordinator.state.npcs.testNpc;
          expect(Array.isArray(testNpcState.flags)).toBe(true);
          expect(testNpcState.flags).toEqual(npcStates.testNpc.flags);
        }
      ),
      { numRuns: 100 }
    );
  });
});
