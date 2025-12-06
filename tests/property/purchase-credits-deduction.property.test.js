/**
 * Property-Based Tests for Purchase Credits Deduction
 * Feature: tramp-freighter-core-loop, Property 17: Purchase Credits Deduction
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 17: Purchase Credits Deduction', () => {
    let gameState;
    
    beforeEach(() => {
        gameState = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        gameState.initNewGame();
    });
    
    /**
     * Property: For any valid purchase of quantity Q at price P, 
     * the player's credits should decrease by Q × P.
     */
    it('should decrease credits by quantity × price for all valid purchases', () => {
        fc.assert(
            fc.property(
                // Generate random good type
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                // Generate random quantity (1-20 to ensure we have space)
                fc.integer({ min: 1, max: 20 }),
                // Generate random price (5-100 credits per unit)
                fc.integer({ min: 5, max: 100 }),
                (goodType, quantity, price) => {
                    // Reset to known state with enough credits and cargo space
                    gameState.initNewGame();
                    const initialCredits = 10000;
                    gameState.updateCredits(initialCredits);
                    
                    // Ensure we have enough cargo space
                    gameState.updateCargo([]);
                    
                    const totalCost = quantity * price;
                    
                    // Only test if we can afford it
                    if (totalCost <= initialCredits) {
                        // Execute purchase
                        const result = gameState.buyGood(goodType, quantity, price);
                        
                        // Verify purchase succeeded
                        expect(result.success).toBe(true);
                        
                        // Verify credits decreased by exactly Q × P
                        const finalCredits = gameState.getPlayer().credits;
                        const expectedCredits = initialCredits - totalCost;
                        
                        expect(finalCredits).toBe(expectedCredits);
                        
                        // Additional invariant: credits should never go negative
                        expect(finalCredits).toBeGreaterThanOrEqual(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Credits deduction should be atomic
     * If purchase fails, credits should remain unchanged
     */
    it('should not change credits if purchase fails validation', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 1, max: 100 }),
                fc.integer({ min: 5, max: 100 }),
                (goodType, quantity, price) => {
                    // Reset to known state with limited credits
                    gameState.initNewGame();
                    const initialCredits = 100;
                    gameState.updateCredits(initialCredits);
                    
                    const totalCost = quantity * price;
                    
                    // Only test cases where we can't afford it
                    if (totalCost > initialCredits) {
                        // Attempt purchase
                        const result = gameState.buyGood(goodType, quantity, price);
                        
                        // Verify purchase failed
                        expect(result.success).toBe(false);
                        expect(result.reason).toBe('Insufficient credits');
                        
                        // Verify credits unchanged
                        const finalCredits = gameState.getPlayer().credits;
                        expect(finalCredits).toBe(initialCredits);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Multiple purchases should accumulate correctly
     */
    it('should correctly accumulate credit deductions across multiple purchases', () => {
        fc.assert(
            fc.property(
                // Generate array of 2-5 purchases
                fc.array(
                    fc.record({
                        goodType: fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                        quantity: fc.integer({ min: 1, max: 5 }),
                        price: fc.integer({ min: 5, max: 20 })
                    }),
                    { minLength: 2, maxLength: 5 }
                ),
                (purchases) => {
                    // Reset to known state
                    gameState.initNewGame();
                    const initialCredits = 10000;
                    gameState.updateCredits(initialCredits);
                    gameState.updateCargo([]);
                    
                    let expectedCredits = initialCredits;
                    
                    // Execute all purchases
                    for (const purchase of purchases) {
                        const totalCost = purchase.quantity * purchase.price;
                        
                        // Only proceed if we can afford it and have space
                        if (totalCost <= expectedCredits && 
                            gameState.getCargoRemaining() >= purchase.quantity) {
                            
                            const result = gameState.buyGood(
                                purchase.goodType,
                                purchase.quantity,
                                purchase.price
                            );
                            
                            if (result.success) {
                                expectedCredits -= totalCost;
                            }
                        }
                    }
                    
                    // Verify final credits match expected
                    const finalCredits = gameState.getPlayer().credits;
                    expect(finalCredits).toBe(expectedCredits);
                }
            ),
            { numRuns: 100 }
        );
    });
});
