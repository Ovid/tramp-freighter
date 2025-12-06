/**
 * Property-Based Tests for Jump State Transition
 * Feature: tramp-freighter-core-loop
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { NavigationSystem } from '../../js/game-navigation.js';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 11: Jump State Transition', () => {
    let navSystem;
    let gameStateManager;
    
    beforeEach(() => {
        navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        gameStateManager.initNewGame();
    });
    
    /**
     * Feature: tramp-freighter-core-loop, Property 11: Jump State Transition
     * 
     * For any valid jump from system A to system B with distance D, executing the jump should:
     * - decrease fuel by (10 + D×2)%
     * - increase days elapsed by max(1, ceil(D×0.5))
     * - update current system to B
     */
    it('should correctly update fuel, time, and location for valid jumps', () => {
        fc.assert(
            fc.property(
                // Generate a valid wormhole connection
                fc.constantFrom(...TEST_WORMHOLE_DATA),
                (connection) => {
                    const [systemId1, systemId2] = connection;
                    
                    // Get the stars to calculate expected values
                    const star1 = TEST_STAR_DATA.find(s => s.id === systemId1);
                    const star2 = TEST_STAR_DATA.find(s => s.id === systemId2);
                    
                    const distance = navSystem.calculateDistanceBetween(star1, star2);
                    const expectedFuelCost = navSystem.calculateFuelCost(distance);
                    const expectedJumpTime = navSystem.calculateJumpTime(distance);
                    
                    // Set up game state with sufficient fuel
                    gameStateManager.updateLocation(systemId1);
                    gameStateManager.updateFuel(100); // Full fuel
                    gameStateManager.updateTime(0); // Reset time
                    
                    const initialFuel = gameStateManager.getState().ship.fuel;
                    const initialTime = gameStateManager.getState().player.daysElapsed;
                    
                    // Execute jump
                    const result = navSystem.executeJump(gameStateManager, systemId2);
                    
                    // Should succeed
                    expect(result.success).toBe(true);
                    expect(result.error).toBe(null);
                    
                    const finalState = gameStateManager.getState();
                    
                    // Verify fuel decreased by correct amount
                    expect(finalState.ship.fuel).toBe(initialFuel - expectedFuelCost);
                    
                    // Verify time increased by correct amount
                    expect(finalState.player.daysElapsed).toBe(initialTime + expectedJumpTime);
                    
                    // Verify location updated to target system
                    expect(finalState.player.currentSystem).toBe(systemId2);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should handle edge case of minimum jump time (1 day)', () => {
        // Find a very short connection (if any)
        fc.assert(
            fc.property(
                fc.constantFrom(...TEST_WORMHOLE_DATA),
                (connection) => {
                    const [systemId1, systemId2] = connection;
                    
                    const star1 = TEST_STAR_DATA.find(s => s.id === systemId1);
                    const star2 = TEST_STAR_DATA.find(s => s.id === systemId2);
                    
                    const distance = navSystem.calculateDistanceBetween(star1, star2);
                    const expectedJumpTime = navSystem.calculateJumpTime(distance);
                    
                    // Jump time should always be at least 1
                    expect(expectedJumpTime).toBeGreaterThanOrEqual(1);
                    
                    // Set up and execute jump
                    gameStateManager.updateLocation(systemId1);
                    gameStateManager.updateFuel(100);
                    gameStateManager.updateTime(0);
                    
                    navSystem.executeJump(gameStateManager, systemId2);
                    
                    const finalTime = gameStateManager.getState().player.daysElapsed;
                    
                    // Time should have increased by at least 1
                    expect(finalTime).toBeGreaterThanOrEqual(1);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should not modify state when jump fails', () => {
        fc.assert(
            fc.property(
                // Generate two random system IDs (may not be connected)
                fc.constantFrom(...TEST_STAR_DATA.map(s => s.id)),
                fc.constantFrom(...TEST_STAR_DATA.map(s => s.id)),
                fc.integer({ min: 0, max: 20 }), // Low fuel to potentially cause failure
                (systemId1, systemId2, fuel) => {
                    // Skip if same system
                    if (systemId1 === systemId2) return true;
                    
                    // Set up game state
                    gameStateManager.updateLocation(systemId1);
                    gameStateManager.updateFuel(fuel);
                    gameStateManager.updateTime(10);
                    
                    const initialState = JSON.parse(JSON.stringify(gameStateManager.getState()));
                    
                    // Attempt jump (may fail due to no connection or insufficient fuel)
                    const result = navSystem.executeJump(gameStateManager, systemId2);
                    
                    if (!result.success) {
                        // If jump failed, state should be unchanged
                        const finalState = gameStateManager.getState();
                        
                        expect(finalState.ship.fuel).toBe(initialState.ship.fuel);
                        expect(finalState.player.daysElapsed).toBe(initialState.player.daysElapsed);
                        expect(finalState.player.currentSystem).toBe(initialState.player.currentSystem);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
