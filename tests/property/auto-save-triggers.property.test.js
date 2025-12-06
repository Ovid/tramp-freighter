/**
 * Property-Based Tests for Auto-Save Triggers
 * Feature: tramp-freighter-core-loop
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { NavigationSystem } from '../../js/game-navigation.js';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 34: Auto-Save Triggers', () => {
    let navSystem;
    let gameStateManager;
    
    beforeEach(() => {
        localStorage.clear();
        navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        gameStateManager.initNewGame();
        // Reset debounce timer to allow immediate saves in tests
        gameStateManager.lastSaveTime = 0;
    });
    
    // Helper to reset save state between property test iterations
    function resetSaveState() {
        localStorage.clear();
        gameStateManager.lastSaveTime = 0;
    }
    
    /**
     * Feature: tramp-freighter-core-loop, Property 34: Auto-Save Triggers
     * 
     * For any game operation that modifies state (jump, trade, refuel, dock, undock),
     * the system should automatically trigger a save operation.
     */
    it('should auto-save after jump completion', () => {
        fc.assert(
            fc.property(
                // Generate a valid wormhole connection
                fc.constantFrom(...TEST_WORMHOLE_DATA),
                (connection) => {
                    const [systemId1, systemId2] = connection;
                    
                    resetSaveState();
                    
                    // Set up game state with sufficient fuel
                    gameStateManager.updateLocation(systemId1);
                    gameStateManager.updateFuel(100);
                    
                    // Verify no save exists yet
                    expect(localStorage.getItem('trampFreighterSave')).toBe(null);
                    
                    // Execute jump
                    const result = navSystem.executeJump(gameStateManager, systemId2);
                    
                    // Should succeed
                    expect(result.success).toBe(true);
                    
                    // Should have auto-saved
                    const savedData = localStorage.getItem('trampFreighterSave');
                    expect(savedData).not.toBe(null);
                    
                    // Verify saved state matches current state
                    let parsedSave;
                    expect(() => {
                        parsedSave = JSON.parse(savedData);
                    }).not.toThrow();
                    expect(parsedSave.player.currentSystem).toBe(systemId2);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should auto-save after buy transaction', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 1, max: 10 }),
                fc.integer({ min: 5, max: 50 }),
                (goodType, quantity, price) => {
                    resetSaveState();
                    
                    // Set up game state with sufficient credits and cargo space
                    // Clear existing cargo to ensure we have space
                    gameStateManager.updateCargo([]);
                    gameStateManager.updateCredits(1000);
                    
                    // Verify no save exists yet
                    expect(localStorage.getItem('trampFreighterSave')).toBe(null);
                    
                    // Execute purchase
                    const result = gameStateManager.buyGood(goodType, quantity, price);
                    
                    // Should succeed
                    expect(result.success).toBe(true);
                    
                    // Should have auto-saved
                    const savedData = localStorage.getItem('trampFreighterSave');
                    expect(savedData).not.toBe(null);
                    
                    // Verify saved state reflects the purchase
                    let parsedSave;
                    expect(() => {
                        parsedSave = JSON.parse(savedData);
                    }).not.toThrow();
                    const hasPurchasedGood = parsedSave.ship.cargo.some(
                        stack => stack.good === goodType && stack.qty === quantity && stack.purchasePrice === price
                    );
                    expect(hasPurchasedGood).toBe(true);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should auto-save after sell transaction', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }),
                fc.integer({ min: 5, max: 50 }),
                (quantity, salePrice) => {
                    resetSaveState();
                    
                    // Set up game state with cargo to sell
                    const initialCargo = [
                        { good: 'grain', qty: 20, purchasePrice: 10 }
                    ];
                    gameStateManager.updateCargo(initialCargo);
                    
                    // Verify no save exists yet
                    expect(localStorage.getItem('trampFreighterSave')).toBe(null);
                    
                    // Execute sale (sell from first stack)
                    const result = gameStateManager.sellGood(0, Math.min(quantity, 20), salePrice);
                    
                    // Should succeed
                    expect(result.success).toBe(true);
                    
                    // Should have auto-saved
                    const savedData = localStorage.getItem('trampFreighterSave');
                    expect(savedData).not.toBe(null);
                    
                    // Verify saved state reflects the sale
                    let parsedSave;
                    expect(() => {
                        parsedSave = JSON.parse(savedData);
                    }).not.toThrow();
                    const expectedQty = 20 - Math.min(quantity, 20);
                    if (expectedQty > 0) {
                        expect(parsedSave.ship.cargo[0].qty).toBe(expectedQty);
                    } else {
                        // Stack should be removed if empty
                        expect(parsedSave.ship.cargo.length).toBe(0);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should auto-save after refuel transaction', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 50 }),
                (refuelAmount) => {
                    resetSaveState();
                    
                    // Set up game state with low fuel and sufficient credits
                    gameStateManager.updateFuel(30);
                    gameStateManager.updateCredits(1000);
                    
                    // Verify no save exists yet
                    expect(localStorage.getItem('trampFreighterSave')).toBe(null);
                    
                    // Execute refuel
                    const result = gameStateManager.refuel(refuelAmount);
                    
                    // Should succeed
                    expect(result.success).toBe(true);
                    
                    // Should have auto-saved
                    const savedData = localStorage.getItem('trampFreighterSave');
                    expect(savedData).not.toBe(null);
                    
                    // Verify saved state reflects the refuel
                    let parsedSave;
                    expect(() => {
                        parsedSave = JSON.parse(savedData);
                    }).not.toThrow();
                    expect(parsedSave.ship.fuel).toBe(30 + refuelAmount);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should auto-save after dock operation', () => {
        // Clear any previous save
        localStorage.clear();
        
        // Verify no save exists yet
        expect(localStorage.getItem('trampFreighterSave')).toBe(null);
        
        // Execute dock
        const result = gameStateManager.dock();
        
        // Should succeed
        expect(result.success).toBe(true);
        
        // Should have auto-saved
        const savedData = localStorage.getItem('trampFreighterSave');
        expect(savedData).not.toBe(null);
    });
    
    it('should auto-save after undock operation', () => {
        // Clear any previous save
        localStorage.clear();
        
        // Verify no save exists yet
        expect(localStorage.getItem('trampFreighterSave')).toBe(null);
        
        // Execute undock
        const result = gameStateManager.undock();
        
        // Should succeed
        expect(result.success).toBe(true);
        
        // Should have auto-saved
        const savedData = localStorage.getItem('trampFreighterSave');
        expect(savedData).not.toBe(null);
    });
    
    it('should debounce saves (max 1 save per second)', () => {
        resetSaveState();
        
        // First save should succeed
        const firstSave = gameStateManager.saveGame();
        expect(firstSave).toBe(true);
        
        const firstSaveData = localStorage.getItem('trampFreighterSave');
        let firstParsedSave;
        expect(() => {
            firstParsedSave = JSON.parse(firstSaveData);
        }).not.toThrow();
        const firstTimestamp = firstParsedSave.meta.timestamp;
        const firstLastSaveTime = gameStateManager.lastSaveTime;
        
        // Immediate second save should be debounced
        const secondSave = gameStateManager.saveGame();
        expect(secondSave).toBe(false);
        
        // Timestamp should not have changed
        const secondSaveData = localStorage.getItem('trampFreighterSave');
        let secondParsedSave;
        expect(() => {
            secondParsedSave = JSON.parse(secondSaveData);
        }).not.toThrow();
        const secondTimestamp = secondParsedSave.meta.timestamp;
        expect(secondTimestamp).toBe(firstTimestamp);
        
        // lastSaveTime should not have changed
        expect(gameStateManager.lastSaveTime).toBe(firstLastSaveTime);
        
        // After waiting 1 second, save should succeed
        // Simulate time passing by manually updating lastSaveTime to be old
        gameStateManager.lastSaveTime = firstLastSaveTime - 1001;
        
        const thirdSave = gameStateManager.saveGame();
        expect(thirdSave).toBe(true);
        
        const thirdSaveData = localStorage.getItem('trampFreighterSave');
        let thirdParsedSave;
        expect(() => {
            thirdParsedSave = JSON.parse(thirdSaveData);
        }).not.toThrow();
        const thirdTimestamp = thirdParsedSave.meta.timestamp;
        // Third timestamp should be greater than or equal to first (time has passed)
        expect(thirdTimestamp).toBeGreaterThanOrEqual(firstTimestamp);
        // lastSaveTime should have been updated
        expect(gameStateManager.lastSaveTime).toBeGreaterThan(firstLastSaveTime - 1001);
    });
    
    it('should not save when operations fail', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 100, max: 200 }), // Large quantity to exceed capacity
                fc.integer({ min: 5, max: 50 }),
                (goodType, quantity, price) => {
                    // Clear any previous save
                    localStorage.clear();
                    
                    // Set up game state with insufficient cargo space
                    gameStateManager.updateCredits(100000); // Plenty of credits
                    // Cargo capacity is 50, initial cargo is 20, so max available is 30
                    
                    // Verify no save exists yet
                    expect(localStorage.getItem('trampFreighterSave')).toBe(null);
                    
                    // Attempt purchase that should fail
                    const result = gameStateManager.buyGood(goodType, quantity, price);
                    
                    // Should fail due to insufficient cargo space
                    expect(result.success).toBe(false);
                    expect(result.reason).toBe('Not enough cargo space');
                    
                    // Should NOT have auto-saved
                    const savedData = localStorage.getItem('trampFreighterSave');
                    expect(savedData).toBe(null);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
