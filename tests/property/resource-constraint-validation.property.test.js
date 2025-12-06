/**
 * Property-Based Tests for Resource Constraint Validation
 * Feature: tramp-freighter-core-loop, Property 23: Resource Constraint Validation
 * Validates: Requirements 7.11, 7.12
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 23: Resource Constraint Validation', () => {
    let gameState;
    
    beforeEach(() => {
        gameState = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        gameState.initNewGame();
    });
    
    /**
     * Property: For any purchase attempt, the system should prevent the 
     * transaction if: (quantity × price > player credits) OR 
     * (total cargo + quantity > cargo capacity).
     */
    it('should prevent purchase when cost exceeds available credits', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 1, max: 50 }),
                fc.integer({ min: 5, max: 100 }),
                fc.integer({ min: 10, max: 500 }),
                (goodType, quantity, price, availableCredits) => {
                    // Reset to known state
                    gameState.initNewGame();
                    gameState.updateCredits(availableCredits);
                    gameState.updateCargo([]);
                    
                    const totalCost = quantity * price;
                    const initialCredits = gameState.getPlayer().credits;
                    const initialCargo = [...gameState.getShip().cargo];
                    
                    // Attempt purchase
                    const result = gameState.buyGood(goodType, quantity, price);
                    
                    if (totalCost > availableCredits) {
                        // Should be prevented
                        expect(result.success).toBe(false);
                        expect(result.reason).toBe('Insufficient credits');
                        
                        // Verify state unchanged
                        expect(gameState.getPlayer().credits).toBe(initialCredits);
                        expect(gameState.getShip().cargo).toEqual(initialCargo);
                    } else if (quantity <= 50) {
                        // Should succeed (we have space)
                        expect(result.success).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Should prevent purchase when quantity exceeds available cargo space
     */
    it('should prevent purchase when quantity exceeds available cargo space', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 1, max: 100 }),
                fc.integer({ min: 5, max: 50 }),
                fc.integer({ min: 0, max: 50 }),
                (goodType, quantity, price, existingCargoQty) => {
                    // Reset to known state
                    gameState.initNewGame();
                    gameState.updateCredits(100000); // Plenty of credits
                    
                    // Fill cargo with existing goods
                    if (existingCargoQty > 0) {
                        gameState.updateCargo([{
                            good: 'grain',
                            qty: existingCargoQty,
                            purchasePrice: 10
                        }]);
                    } else {
                        gameState.updateCargo([]);
                    }
                    
                    const cargoCapacity = gameState.getShip().cargoCapacity;
                    const cargoUsed = gameState.getCargoUsed();
                    const availableSpace = cargoCapacity - cargoUsed;
                    
                    const initialCredits = gameState.getPlayer().credits;
                    const initialCargoLength = gameState.getShip().cargo.length;
                    
                    // Attempt purchase
                    const result = gameState.buyGood(goodType, quantity, price);
                    
                    if (quantity > availableSpace) {
                        // Should be prevented
                        expect(result.success).toBe(false);
                        expect(result.reason).toBe('Not enough cargo space');
                        
                        // Verify state unchanged
                        expect(gameState.getPlayer().credits).toBe(initialCredits);
                        expect(gameState.getShip().cargo.length).toBe(initialCargoLength);
                    } else {
                        // Should succeed (we have credits and space)
                        expect(result.success).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Should prevent purchase when EITHER constraint is violated
     */
    it('should prevent purchase when either credits or cargo space constraint is violated', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 1, max: 60 }),
                fc.integer({ min: 5, max: 100 }),
                fc.integer({ min: 10, max: 1000 }),
                fc.integer({ min: 0, max: 50 }),
                (goodType, quantity, price, availableCredits, existingCargoQty) => {
                    // Reset to known state
                    gameState.initNewGame();
                    gameState.updateCredits(availableCredits);
                    
                    // Set up existing cargo
                    if (existingCargoQty > 0) {
                        gameState.updateCargo([{
                            good: 'grain',
                            qty: existingCargoQty,
                            purchasePrice: 10
                        }]);
                    } else {
                        gameState.updateCargo([]);
                    }
                    
                    const totalCost = quantity * price;
                    const cargoCapacity = gameState.getShip().cargoCapacity;
                    const cargoUsed = gameState.getCargoUsed();
                    const availableSpace = cargoCapacity - cargoUsed;
                    
                    const hasEnoughCredits = totalCost <= availableCredits;
                    const hasEnoughSpace = quantity <= availableSpace;
                    
                    const initialCredits = gameState.getPlayer().credits;
                    const initialCargoUsed = gameState.getCargoUsed();
                    
                    // Attempt purchase
                    const result = gameState.buyGood(goodType, quantity, price);
                    
                    if (!hasEnoughCredits || !hasEnoughSpace) {
                        // Should be prevented
                        expect(result.success).toBe(false);
                        
                        // Verify appropriate error message
                        if (!hasEnoughCredits) {
                            expect(result.reason).toBe('Insufficient credits');
                        } else if (!hasEnoughSpace) {
                            expect(result.reason).toBe('Not enough cargo space');
                        }
                        
                        // Verify state unchanged
                        expect(gameState.getPlayer().credits).toBe(initialCredits);
                        expect(gameState.getCargoUsed()).toBe(initialCargoUsed);
                    } else {
                        // Both constraints satisfied, should succeed
                        expect(result.success).toBe(true);
                        
                        // Verify state changed correctly
                        expect(gameState.getPlayer().credits).toBe(initialCredits - totalCost);
                        expect(gameState.getCargoUsed()).toBe(initialCargoUsed + quantity);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Edge case - exactly enough credits should succeed
     */
    it('should allow purchase when cost exactly equals available credits', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 1, max: 20 }),
                fc.integer({ min: 5, max: 50 }),
                (goodType, quantity, price) => {
                    // Reset to known state
                    gameState.initNewGame();
                    
                    const totalCost = quantity * price;
                    gameState.updateCredits(totalCost); // Exactly enough
                    gameState.updateCargo([]);
                    
                    // Attempt purchase
                    const result = gameState.buyGood(goodType, quantity, price);
                    
                    // Should succeed
                    expect(result.success).toBe(true);
                    
                    // Verify credits now zero
                    expect(gameState.getPlayer().credits).toBe(0);
                    
                    // Verify cargo added
                    expect(gameState.getShip().cargo.length).toBe(1);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Edge case - exactly enough cargo space should succeed
     */
    it('should allow purchase when quantity exactly equals available cargo space', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 1, max: 50 }),
                fc.integer({ min: 5, max: 50 }),
                (goodType, quantity, price) => {
                    // Reset to known state
                    gameState.initNewGame();
                    gameState.updateCredits(100000); // Plenty of credits
                    
                    const cargoCapacity = gameState.getShip().cargoCapacity;
                    const existingQty = cargoCapacity - quantity;
                    
                    if (existingQty > 0) {
                        gameState.updateCargo([{
                            good: 'grain',
                            qty: existingQty,
                            purchasePrice: 10
                        }]);
                    } else {
                        gameState.updateCargo([]);
                    }
                    
                    // Verify we have exactly the right amount of space
                    expect(gameState.getCargoRemaining()).toBe(quantity);
                    
                    // Attempt purchase
                    const result = gameState.buyGood(goodType, quantity, price);
                    
                    // Should succeed
                    expect(result.success).toBe(true);
                    
                    // Verify cargo now full
                    expect(gameState.getCargoRemaining()).toBe(0);
                    expect(gameState.getCargoUsed()).toBe(cargoCapacity);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: One credit short should fail
     */
    it('should prevent purchase when one credit short', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 1, max: 20 }),
                fc.integer({ min: 5, max: 50 }),
                (goodType, quantity, price) => {
                    // Reset to known state
                    gameState.initNewGame();
                    
                    const totalCost = quantity * price;
                    if (totalCost > 1) {
                        gameState.updateCredits(totalCost - 1); // One credit short
                        gameState.updateCargo([]);
                        
                        const initialCredits = gameState.getPlayer().credits;
                        
                        // Attempt purchase
                        const result = gameState.buyGood(goodType, quantity, price);
                        
                        // Should fail
                        expect(result.success).toBe(false);
                        expect(result.reason).toBe('Insufficient credits');
                        
                        // Verify credits unchanged
                        expect(gameState.getPlayer().credits).toBe(initialCredits);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: One cargo space short should fail
     */
    it('should prevent purchase when one cargo space short', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 2, max: 50 }),
                fc.integer({ min: 5, max: 50 }),
                (goodType, quantity, price) => {
                    // Reset to known state
                    gameState.initNewGame();
                    gameState.updateCredits(100000); // Plenty of credits
                    
                    const cargoCapacity = gameState.getShip().cargoCapacity;
                    const existingQty = cargoCapacity - quantity + 1; // One space short
                    
                    if (existingQty > 0 && existingQty < cargoCapacity) {
                        gameState.updateCargo([{
                            good: 'grain',
                            qty: existingQty,
                            purchasePrice: 10
                        }]);
                        
                        // Verify we're one space short
                        expect(gameState.getCargoRemaining()).toBe(quantity - 1);
                        
                        const initialCargoLength = gameState.getShip().cargo.length;
                        
                        // Attempt purchase
                        const result = gameState.buyGood(goodType, quantity, price);
                        
                        // Should fail
                        expect(result.success).toBe(false);
                        expect(result.reason).toBe('Not enough cargo space');
                        
                        // Verify cargo unchanged
                        expect(gameState.getShip().cargo.length).toBe(initialCargoLength);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
