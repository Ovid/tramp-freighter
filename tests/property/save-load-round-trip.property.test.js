/**
 * Property-Based Tests for Save/Load Round Trip
 * Feature: tramp-freighter-core-loop, Property 1: Save/Load Round Trip Preservation
 * Validates: Requirements 1.6, 10.8
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 1: Save/Load Round Trip Preservation', () => {
    let manager;
    
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
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
            daysElapsed: fc.integer({ min: 0, max: 1000 })
        }),
        ship: fc.record({
            name: fc.constantFrom("Serendipity", "Wanderer", "Fortune's Fool", "Lucky Star"),
            fuel: fc.integer({ min: 0, max: 100 }),
            cargoCapacity: fc.integer({ min: 10, max: 200 }),
            cargo: fc.array(
                fc.record({
                    good: fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                    qty: fc.integer({ min: 1, max: 50 }),
                    purchasePrice: fc.integer({ min: 5, max: 100 })
                }),
                { minLength: 0, maxLength: 10 }
            )
        }),
        world: fc.record({
            visitedSystems: fc.array(
                fc.constantFrom(0, 1, 4, 5, 7, 13),
                { minLength: 1, maxLength: 6 }
            ).map(arr => [...new Set(arr)]) // Remove duplicates
        }),
        meta: fc.record({
            version: fc.constant('1.0.0'),
            timestamp: fc.integer({ min: 1000000000000, max: 2000000000000 })
        })
    });
    
    /**
     * Property: For any valid game state, serializing to localStorage and then 
     * deserializing should produce an equivalent game state with all player data, 
     * ship data, and world data intact.
     */
    it('should preserve all game state through save/load cycle', () => {
        fc.assert(
            fc.property(
                gameStateArbitrary,
                (generatedState) => {
                    // Set the manager's state to the generated state
                    manager.state = generatedState;
                    
                    // Save the game
                    const saveResult = manager.saveGame();
                    expect(saveResult).toBe(true);
                    
                    // Create a new manager to simulate fresh load
                    const newManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
                    
                    // Load the game
                    const loadedState = newManager.loadGame();
                    
                    // Verify load was successful
                    expect(loadedState).not.toBeNull();
                    
                    // Verify player data is preserved
                    expect(loadedState.player.credits).toBe(generatedState.player.credits);
                    expect(loadedState.player.debt).toBe(generatedState.player.debt);
                    expect(loadedState.player.currentSystem).toBe(generatedState.player.currentSystem);
                    expect(loadedState.player.daysElapsed).toBe(generatedState.player.daysElapsed);
                    
                    // Verify ship data is preserved
                    expect(loadedState.ship.name).toBe(generatedState.ship.name);
                    expect(loadedState.ship.fuel).toBe(generatedState.ship.fuel);
                    expect(loadedState.ship.cargoCapacity).toBe(generatedState.ship.cargoCapacity);
                    
                    // Verify cargo is preserved
                    expect(loadedState.ship.cargo).toHaveLength(generatedState.ship.cargo.length);
                    for (let i = 0; i < generatedState.ship.cargo.length; i++) {
                        expect(loadedState.ship.cargo[i].good).toBe(generatedState.ship.cargo[i].good);
                        expect(loadedState.ship.cargo[i].qty).toBe(generatedState.ship.cargo[i].qty);
                        expect(loadedState.ship.cargo[i].purchasePrice).toBe(generatedState.ship.cargo[i].purchasePrice);
                    }
                    
                    // Verify world data is preserved
                    expect(loadedState.world.visitedSystems).toEqual(generatedState.world.visitedSystems);
                    
                    // Verify meta data is preserved (version should match, timestamp may be updated)
                    expect(loadedState.meta.version).toBe(generatedState.meta.version);
                    expect(loadedState.meta.timestamp).toBeTypeOf('number');
                    expect(loadedState.meta.timestamp).toBeGreaterThan(0);
                }
            ),
            { numRuns: 100 } // Run 100 iterations as specified in design
        );
    });
    
    /**
     * Property: Multiple save/load cycles should preserve state
     */
    it('should preserve state through multiple save/load cycles', () => {
        fc.assert(
            fc.property(
                gameStateArbitrary,
                fc.integer({ min: 2, max: 5 }), // Number of cycles
                (initialState, numCycles) => {
                    // Set initial state
                    manager.state = initialState;
                    
                    let currentState = initialState;
                    
                    for (let i = 0; i < numCycles; i++) {
                        // Save
                        const saveResult = manager.saveGame();
                        expect(saveResult).toBe(true);
                        
                        // Load into new manager
                        const newManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
                        const loadedState = newManager.loadGame();
                        
                        expect(loadedState).not.toBeNull();
                        
                        // Verify core data is preserved
                        expect(loadedState.player.credits).toBe(currentState.player.credits);
                        expect(loadedState.player.debt).toBe(currentState.player.debt);
                        expect(loadedState.ship.fuel).toBe(currentState.ship.fuel);
                        expect(loadedState.ship.cargo.length).toBe(currentState.ship.cargo.length);
                        
                        // Use loaded state for next cycle
                        manager = newManager;
                        currentState = loadedState;
                    }
                }
            ),
            { numRuns: 50 } // Fewer runs since this is more expensive
        );
    });
    
    /**
     * Property: Save/load should work with empty cargo
     */
    it('should handle empty cargo correctly', () => {
        fc.assert(
            fc.property(
                gameStateArbitrary,
                (generatedState) => {
                    // Force empty cargo
                    generatedState.ship.cargo = [];
                    
                    manager.state = generatedState;
                    
                    // Save and load
                    manager.saveGame();
                    const newManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
                    const loadedState = newManager.loadGame();
                    
                    expect(loadedState).not.toBeNull();
                    expect(loadedState.ship.cargo).toEqual([]);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Save/load should work with maximum cargo
     */
    it('should handle full cargo correctly', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 50, max: 200 }), // Cargo capacity
                (capacity) => {
                    // Create state with full cargo
                    const fullCargoState = {
                        player: {
                            credits: 1000,
                            debt: 5000,
                            currentSystem: 0,
                            daysElapsed: 10
                        },
                        ship: {
                            name: "Serendipity",
                            fuel: 50,
                            cargoCapacity: capacity,
                            cargo: [
                                { good: 'grain', qty: capacity, purchasePrice: 10 }
                            ]
                        },
                        world: {
                            visitedSystems: [0, 1]
                        },
                        meta: {
                            version: '1.0.0',
                            timestamp: Date.now()
                        }
                    };
                    
                    manager.state = fullCargoState;
                    
                    // Save and load
                    manager.saveGame();
                    const newManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
                    const loadedState = newManager.loadGame();
                    
                    expect(loadedState).not.toBeNull();
                    expect(loadedState.ship.cargo[0].qty).toBe(capacity);
                    expect(loadedState.ship.cargoCapacity).toBe(capacity);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: hasSavedGame should return true after save, false after clear
     */
    it('should correctly detect saved game existence', () => {
        fc.assert(
            fc.property(
                gameStateArbitrary,
                (generatedState) => {
                    // Initially no save
                    expect(manager.hasSavedGame()).toBe(false);
                    
                    // Set state and save
                    manager.state = generatedState;
                    manager.saveGame();
                    
                    // Should detect save
                    expect(manager.hasSavedGame()).toBe(true);
                    
                    // Clear save
                    manager.clearSave();
                    
                    // Should not detect save
                    expect(manager.hasSavedGame()).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Loading with no saved game should return null
     */
    it('should return null when no saved game exists', () => {
        fc.assert(
            fc.property(
                fc.constant(null),
                () => {
                    // Ensure no save exists
                    localStorage.clear();
                    
                    const newManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
                    const loadedState = newManager.loadGame();
                    
                    expect(loadedState).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Loading corrupted data should return null
     */
    it('should handle corrupted save data gracefully', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 100 }), // Random invalid JSON
                (corruptedData) => {
                    // Skip valid JSON strings
                    try {
                        JSON.parse(corruptedData);
                        return true; // Skip this test case
                    } catch {
                        // Good, it's invalid JSON
                    }
                    
                    // Store corrupted data
                    localStorage.setItem('trampFreighterSave', corruptedData);
                    
                    const newManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
                    const loadedState = newManager.loadGame();
                    
                    // Should return null for corrupted data
                    expect(loadedState).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Loading incompatible version should return null
     */
    it('should reject incompatible save versions', () => {
        fc.assert(
            fc.property(
                gameStateArbitrary,
                fc.string({ minLength: 1, maxLength: 10 }).filter(v => v !== '1.0.0'), // Different version
                (generatedState, differentVersion) => {
                    // Modify version
                    generatedState.meta.version = differentVersion;
                    
                    // Save with different version
                    localStorage.setItem('trampFreighterSave', JSON.stringify(generatedState));
                    
                    const newManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
                    const loadedState = newManager.loadGame();
                    
                    // Should return null for incompatible version
                    expect(loadedState).toBeNull();
                }
            ),
            { numRuns: 100 }
        );
    });
});
