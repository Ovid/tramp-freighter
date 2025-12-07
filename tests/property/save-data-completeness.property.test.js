/**
 * Property-Based Tests for Save Data Completeness
 * Feature: tramp-freighter-core-loop, Property 33: Save Data Completeness
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 33: Save Data Completeness', () => {
  let manager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    // Reset debounce timer to allow immediate saves in tests
    manager.lastSaveTime = 0;
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  /**
   * Generator for valid game states
   * Creates random but valid game states for testing
   */
  const gameStateArbitrary = fc.record({
    player: fc.record({
      credits: fc.integer({ min: 0, max: 100000 }),
      debt: fc.integer({ min: 0, max: 50000 }),
      currentSystem: fc.constantFrom(0, 1, 4, 5, 7, 13), // Valid test system IDs
      daysElapsed: fc.integer({ min: 0, max: 1000 }),
    }),
    ship: fc.record({
      name: fc.constantFrom(
        'Serendipity',
        'Wanderer',
        "Fortune's Fool",
        'Lucky Star'
      ),
      fuel: fc.integer({ min: 0, max: 100 }),
      cargoCapacity: fc.integer({ min: 10, max: 200 }),
      cargo: fc.array(
        fc.record({
          good: fc.constantFrom(
            'grain',
            'ore',
            'tritium',
            'parts',
            'medicine',
            'electronics'
          ),
          qty: fc.integer({ min: 1, max: 50 }),
          purchasePrice: fc.integer({ min: 5, max: 100 }),
        }),
        { minLength: 0, maxLength: 10 }
      ),
    }),
    world: fc.record({
      visitedSystems: fc
        .array(fc.constantFrom(0, 1, 4, 5, 7, 13), {
          minLength: 1,
          maxLength: 6,
        })
        .map((arr) => [...new Set(arr)]), // Remove duplicates
    }),
    meta: fc.record({
      version: fc.constant('1.0.0'),
      timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 }),
    }),
  });

  /**
   * Property: For any save operation, the stored data in localStorage should
   * include the complete game state (player, ship, world) plus version number
   * and timestamp metadata.
   */
  it('should store complete game state with metadata in localStorage', () => {
    fc.assert(
      fc.property(gameStateArbitrary, (generatedState) => {
        // Reset debounce timer for this iteration
        manager.lastSaveTime = 0;

        // Set the manager's state to the generated state
        manager.state = generatedState;

        // Save the game
        const saveResult = manager.saveGame();
        expect(saveResult).toBe(true);

        // Retrieve raw save data from localStorage
        const rawSaveData = localStorage.getItem('trampFreighterSave');
        expect(rawSaveData).not.toBeNull();

        // Parse the saved data
        const savedData = JSON.parse(rawSaveData);

        // Verify player data is complete
        expect(savedData).toHaveProperty('player');
        expect(savedData.player).toHaveProperty('credits');
        expect(savedData.player).toHaveProperty('debt');
        expect(savedData.player).toHaveProperty('currentSystem');
        expect(savedData.player).toHaveProperty('daysElapsed');
        expect(savedData.player.credits).toBe(generatedState.player.credits);
        expect(savedData.player.debt).toBe(generatedState.player.debt);
        expect(savedData.player.currentSystem).toBe(
          generatedState.player.currentSystem
        );
        expect(savedData.player.daysElapsed).toBe(
          generatedState.player.daysElapsed
        );

        // Verify ship data is complete
        expect(savedData).toHaveProperty('ship');
        expect(savedData.ship).toHaveProperty('name');
        expect(savedData.ship).toHaveProperty('fuel');
        expect(savedData.ship).toHaveProperty('cargoCapacity');
        expect(savedData.ship).toHaveProperty('cargo');
        expect(savedData.ship.name).toBe(generatedState.ship.name);
        expect(savedData.ship.fuel).toBe(generatedState.ship.fuel);
        expect(savedData.ship.cargoCapacity).toBe(
          generatedState.ship.cargoCapacity
        );

        // Verify cargo data is complete
        expect(Array.isArray(savedData.ship.cargo)).toBe(true);
        expect(savedData.ship.cargo).toHaveLength(
          generatedState.ship.cargo.length
        );

        // Verify each cargo stack exists (order-independent)
        for (const originalStack of generatedState.ship.cargo) {
          const matchingStack = savedData.ship.cargo.find(
            (s) =>
              s.good === originalStack.good &&
              s.qty === originalStack.qty &&
              s.purchasePrice === originalStack.purchasePrice
          );
          expect(matchingStack).toBeDefined();
          expect(matchingStack).toHaveProperty('good');
          expect(matchingStack).toHaveProperty('qty');
          expect(matchingStack).toHaveProperty('purchasePrice');
        }

        // Verify world data is complete
        expect(savedData).toHaveProperty('world');
        expect(savedData.world).toHaveProperty('visitedSystems');
        expect(Array.isArray(savedData.world.visitedSystems)).toBe(true);
        expect(savedData.world.visitedSystems).toEqual(
          generatedState.world.visitedSystems
        );

        // Verify metadata is complete
        expect(savedData).toHaveProperty('meta');
        expect(savedData.meta).toHaveProperty('version');
        expect(savedData.meta).toHaveProperty('timestamp');
        expect(typeof savedData.meta.version).toBe('string');
        expect(savedData.meta.version).toBe('1.0.0');
        expect(typeof savedData.meta.timestamp).toBe('number');
        expect(savedData.meta.timestamp).toBeGreaterThan(0);

        // Verify timestamp is recent (within last minute)
        const now = Date.now();
        expect(savedData.meta.timestamp).toBeLessThanOrEqual(now);
        expect(savedData.meta.timestamp).toBeGreaterThan(now - 60000); // Within last minute
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });

  /**
   * Property: Save data should be valid JSON
   */
  it('should store data as valid JSON', () => {
    fc.assert(
      fc.property(gameStateArbitrary, (generatedState) => {
        manager.state = generatedState;
        manager.saveGame();

        const rawSaveData = localStorage.getItem('trampFreighterSave');
        expect(rawSaveData).not.toBeNull();

        // Should not throw when parsing
        let parsedData;
        expect(() => {
          parsedData = JSON.parse(rawSaveData);
        }).not.toThrow();

        // Should be an object
        expect(typeof parsedData).toBe('object');
        expect(parsedData).not.toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Save should update timestamp on each save
   */
  it('should update timestamp on each save operation', () => {
    fc.assert(
      fc.property(gameStateArbitrary, (generatedState) => {
        // Reset debounce timer for this iteration
        manager.lastSaveTime = 0;

        manager.state = generatedState;

        // First save
        manager.saveGame();
        const firstSave = JSON.parse(
          localStorage.getItem('trampFreighterSave')
        );
        const firstTimestamp = firstSave.meta.timestamp;

        // Simulate time passing by resetting debounce timer
        manager.lastSaveTime = firstTimestamp - 1001;

        // Second save (should succeed now that debounce timer is reset)
        manager.saveGame();
        const secondSave = JSON.parse(
          localStorage.getItem('trampFreighterSave')
        );
        const secondTimestamp = secondSave.meta.timestamp;

        // Timestamp should be updated
        expect(secondTimestamp).toBeGreaterThanOrEqual(firstTimestamp);
      }),
      { numRuns: 50 } // Fewer runs since this involves timing
    );
  });
});
