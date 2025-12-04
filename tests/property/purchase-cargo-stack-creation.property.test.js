/**
 * Property-Based Tests for Purchase Cargo Stack Creation
 * Feature: tramp-freighter-core-loop, Property 18: Purchase Cargo Stack Creation
 * Validates: Requirements 7.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 18: Purchase Cargo Stack Creation', () => {
    let gameState;
    
    beforeEach(() => {
        gameState = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        gameState.initNewGame();
    });
    
    /**
     * Property: For any valid purchase of good type G with quantity Q at price P,
     * a new cargo stack should be created containing good type G, quantity Q, 
     * and purchase price P.
     */
    it('should create new cargo stack with correct good type, quantity, and purchase price', () => {
        fc.assert(
            fc.property(
                // Generate random good type
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                // Generate random quantity (1-30 to ensure we have space)
                fc.integer({ min: 1, max: 30 }),
                // Generate random price (5-100 credits per unit)
                fc.integer({ min: 5, max: 100 }),
                (goodType, quantity, price) => {
                    // Reset to known state with enough credits and cargo space
                    gameState.initNewGame();
                    const initialCredits = 10000;
                    gameState.updateCredits(initialCredits);
                    
                    // Clear cargo to start fresh
                    const initialCargoCount = gameState.getShip().cargo.length;
                    gameState.updateCargo([]);
                    
                    const totalCost = quantity * price;
                    
                    // Only test if we can afford it and have space
                    if (totalCost <= initialCredits && quantity <= 50) {
                        // Execute purchase
                        const result = gameState.buyGood(goodType, quantity, price);
                        
                        // Verify purchase succeeded
                        expect(result.success).toBe(true);
                        
                        // Get the cargo after purchase
                        const cargo = gameState.getShip().cargo;
                        
                        // Verify a new stack was created
                        expect(cargo.length).toBe(1);
                        
                        // Verify the stack has correct properties
                        const newStack = cargo[0];
                        expect(newStack.good).toBe(goodType);
                        expect(newStack.qty).toBe(quantity);
                        expect(newStack.purchasePrice).toBe(price);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Each purchase creates a separate stack
     * Multiple purchases should create multiple stacks
     */
    it('should create separate stacks for each purchase', () => {
        fc.assert(
            fc.property(
                // Generate array of 2-4 purchases
                fc.array(
                    fc.record({
                        goodType: fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                        quantity: fc.integer({ min: 1, max: 5 }),
                        price: fc.integer({ min: 5, max: 20 })
                    }),
                    { minLength: 2, maxLength: 4 }
                ),
                (purchases) => {
                    // Reset to known state
                    gameState.initNewGame();
                    const initialCredits = 10000;
                    gameState.updateCredits(initialCredits);
                    gameState.updateCargo([]);
                    
                    let successfulPurchases = 0;
                    
                    // Execute all purchases
                    for (const purchase of purchases) {
                        const totalCost = purchase.quantity * purchase.price;
                        
                        // Only proceed if we can afford it and have space
                        if (totalCost <= gameState.getPlayer().credits && 
                            gameState.getCargoRemaining() >= purchase.quantity) {
                            
                            const result = gameState.buyGood(
                                purchase.goodType,
                                purchase.quantity,
                                purchase.price
                            );
                            
                            if (result.success) {
                                successfulPurchases++;
                            }
                        }
                    }
                    
                    // Verify number of stacks equals number of successful purchases
                    const cargo = gameState.getShip().cargo;
                    expect(cargo.length).toBe(successfulPurchases);
                    
                    // Verify each stack corresponds to a purchase
                    for (let i = 0; i < successfulPurchases; i++) {
                        const stack = cargo[i];
                        expect(stack).toHaveProperty('good');
                        expect(stack).toHaveProperty('qty');
                        expect(stack).toHaveProperty('purchasePrice');
                        expect(stack.qty).toBeGreaterThan(0);
                        expect(stack.purchasePrice).toBeGreaterThan(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Stack creation should not modify existing stacks
     */
    it('should not modify existing cargo stacks when creating new ones', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 1, max: 10 }),
                fc.integer({ min: 5, max: 50 }),
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 1, max: 10 }),
                fc.integer({ min: 5, max: 50 }),
                (goodType1, qty1, price1, goodType2, qty2, price2) => {
                    // Reset to known state
                    gameState.initNewGame();
                    gameState.updateCredits(10000);
                    gameState.updateCargo([]);
                    
                    // First purchase
                    const result1 = gameState.buyGood(goodType1, qty1, price1);
                    expect(result1.success).toBe(true);
                    
                    // Capture first stack
                    const firstStack = { ...gameState.getShip().cargo[0] };
                    
                    // Second purchase
                    const result2 = gameState.buyGood(goodType2, qty2, price2);
                    
                    if (result2.success) {
                        const cargo = gameState.getShip().cargo;
                        
                        // Verify we have 2 stacks
                        expect(cargo.length).toBe(2);
                        
                        // Verify first stack unchanged
                        expect(cargo[0].good).toBe(firstStack.good);
                        expect(cargo[0].qty).toBe(firstStack.qty);
                        expect(cargo[0].purchasePrice).toBe(firstStack.purchasePrice);
                        
                        // Verify second stack is new
                        expect(cargo[1].good).toBe(goodType2);
                        expect(cargo[1].qty).toBe(qty2);
                        expect(cargo[1].purchasePrice).toBe(price2);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
