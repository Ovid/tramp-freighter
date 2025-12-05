/**
 * Property-Based Tests for Sale Cargo Reduction
 * Feature: tramp-freighter-core-loop, Property 22: Sale Cargo Reduction
 * Validates: Requirements 7.10
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 22: Sale Cargo Reduction', () => {
    let gameState;
    
    beforeEach(() => {
        gameState = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        gameState.initNewGame();
    });
    
    /**
     * Property: For any valid sale of quantity Q from a cargo stack,
     * that stack's quantity should decrease by Q.
     */
    it('should decrease stack quantity by sold amount for all valid sales', () => {
        fc.assert(
            fc.property(
                // Generate random good type
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                // Generate random quantity to buy (10-40 to have room to sell partial)
                fc.integer({ min: 10, max: 40 }),
                // Generate random purchase price (5-100 credits per unit)
                fc.integer({ min: 5, max: 100 }),
                // Generate random sale price (5-100 credits per unit)
                fc.integer({ min: 5, max: 100 }),
                // Generate random quantity to sell (1-20, will be constrained)
                fc.integer({ min: 1, max: 20 }),
                (goodType, purchaseQty, purchasePrice, salePrice, sellQty) => {
                    // Reset to known state with enough credits and cargo space
                    gameState.initNewGame();
                    gameState.updateCredits(10000);
                    gameState.updateCargo([]);
                    
                    // First, buy some goods to have something to sell
                    const buyResult = gameState.buyGood(goodType, purchaseQty, purchasePrice);
                    expect(buyResult.success).toBe(true);
                    
                    // Constrain sell quantity to what we actually have
                    const actualSellQty = Math.min(sellQty, purchaseQty);
                    
                    // Record cargo before sale
                    const cargoBeforeSale = gameState.getShip().cargo;
                    expect(cargoBeforeSale.length).toBe(1);
                    expect(cargoBeforeSale[0].qty).toBe(purchaseQty);
                    
                    // Execute sale
                    const sellResult = gameState.sellGood(0, actualSellQty, salePrice);
                    
                    // Verify sale succeeded
                    expect(sellResult.success).toBe(true);
                    
                    // Verify stack quantity decreased by exactly Q
                    const cargoAfterSale = gameState.getShip().cargo;
                    const expectedRemainingQty = purchaseQty - actualSellQty;
                    
                    if (expectedRemainingQty > 0) {
                        // Stack should still exist with reduced quantity
                        expect(cargoAfterSale.length).toBe(1);
                        expect(cargoAfterSale[0].qty).toBe(expectedRemainingQty);
                        expect(cargoAfterSale[0].good).toBe(goodType);
                        expect(cargoAfterSale[0].purchasePrice).toBe(purchasePrice);
                    } else {
                        // Stack should be removed when empty
                        expect(cargoAfterSale.length).toBe(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Selling all units from a stack should remove the stack
     */
    it('should remove stack when all units are sold', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 1, max: 30 }),
                fc.integer({ min: 5, max: 100 }),
                fc.integer({ min: 5, max: 100 }),
                (goodType, quantity, purchasePrice, salePrice) => {
                    // Reset to known state
                    gameState.initNewGame();
                    gameState.updateCredits(10000);
                    gameState.updateCargo([]);
                    
                    // Buy goods
                    gameState.buyGood(goodType, quantity, purchasePrice);
                    
                    // Verify we have one stack
                    expect(gameState.getShip().cargo.length).toBe(1);
                    
                    // Sell all units
                    const sellResult = gameState.sellGood(0, quantity, salePrice);
                    
                    // Verify sale succeeded
                    expect(sellResult.success).toBe(true);
                    
                    // Verify stack was removed
                    const cargoAfterSale = gameState.getShip().cargo;
                    expect(cargoAfterSale.length).toBe(0);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Partial sales should preserve stack properties
     */
    it('should preserve good type and purchase price when selling partial quantity', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 10, max: 40 }),
                fc.integer({ min: 5, max: 100 }),
                fc.integer({ min: 5, max: 100 }),
                (goodType, purchaseQty, purchasePrice, salePrice) => {
                    // Reset to known state
                    gameState.initNewGame();
                    gameState.updateCredits(10000);
                    gameState.updateCargo([]);
                    
                    // Buy goods
                    gameState.buyGood(goodType, purchaseQty, purchasePrice);
                    
                    // Sell half (rounded down)
                    const sellQty = Math.floor(purchaseQty / 2);
                    
                    if (sellQty > 0 && sellQty < purchaseQty) {
                        const sellResult = gameState.sellGood(0, sellQty, salePrice);
                        
                        expect(sellResult.success).toBe(true);
                        
                        // Verify stack still exists with correct properties
                        const cargo = gameState.getShip().cargo;
                        expect(cargo.length).toBe(1);
                        expect(cargo[0].good).toBe(goodType);
                        expect(cargo[0].purchasePrice).toBe(purchasePrice);
                        expect(cargo[0].qty).toBe(purchaseQty - sellQty);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Selling from multiple stacks should only affect the specified stack
     */
    it('should only reduce quantity from the specified stack', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 5, max: 15 }),
                fc.integer({ min: 5, max: 50 }),
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 5, max: 15 }),
                fc.integer({ min: 5, max: 50 }),
                fc.integer({ min: 5, max: 100 }),
                (goodType1, qty1, price1, goodType2, qty2, price2, salePrice) => {
                    // Reset to known state
                    gameState.initNewGame();
                    gameState.updateCredits(10000);
                    gameState.updateCargo([]);
                    
                    // Buy two different stacks
                    gameState.buyGood(goodType1, qty1, price1);
                    gameState.buyGood(goodType2, qty2, price2);
                    
                    // Verify we have two stacks
                    expect(gameState.getShip().cargo.length).toBe(2);
                    
                    // Sell from first stack (sell half)
                    const sellQty = Math.floor(qty1 / 2);
                    
                    if (sellQty > 0 && sellQty < qty1) {
                        const sellResult = gameState.sellGood(0, sellQty, salePrice);
                        
                        expect(sellResult.success).toBe(true);
                        
                        const cargo = gameState.getShip().cargo;
                        
                        // First stack should be reduced
                        expect(cargo[0].qty).toBe(qty1 - sellQty);
                        
                        // Second stack should be unchanged
                        expect(cargo[1].good).toBe(goodType2);
                        expect(cargo[1].qty).toBe(qty2);
                        expect(cargo[1].purchasePrice).toBe(price2);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Cargo reduction should be atomic
     * If sale fails, cargo should remain unchanged
     */
    it('should not change cargo if sale fails validation', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 1, max: 20 }),
                fc.integer({ min: 5, max: 100 }),
                fc.integer({ min: 5, max: 100 }),
                (goodType, purchaseQty, purchasePrice, salePrice) => {
                    // Reset to known state
                    gameState.initNewGame();
                    gameState.updateCredits(10000);
                    gameState.updateCargo([]);
                    
                    // Buy some goods
                    gameState.buyGood(goodType, purchaseQty, purchasePrice);
                    
                    const cargoBeforeSale = [...gameState.getShip().cargo];
                    
                    // Attempt to sell more than we have
                    const invalidQty = purchaseQty + 10;
                    const sellResult = gameState.sellGood(0, invalidQty, salePrice);
                    
                    // Verify sale failed
                    expect(sellResult.success).toBe(false);
                    
                    // Verify cargo unchanged
                    const cargoAfterSale = gameState.getShip().cargo;
                    expect(cargoAfterSale.length).toBe(cargoBeforeSale.length);
                    expect(cargoAfterSale[0].qty).toBe(cargoBeforeSale[0].qty);
                    expect(cargoAfterSale[0].good).toBe(cargoBeforeSale[0].good);
                    expect(cargoAfterSale[0].purchasePrice).toBe(cargoBeforeSale[0].purchasePrice);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    /**
     * Property: Total cargo used should decrease by sold quantity
     */
    it('should decrease total cargo used by sold quantity', () => {
        fc.assert(
            fc.property(
                // Generate array of 2-4 purchases
                fc.array(
                    fc.record({
                        goodType: fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                        quantity: fc.integer({ min: 5, max: 10 }),
                        purchasePrice: fc.integer({ min: 5, max: 20 })
                    }),
                    { minLength: 2, maxLength: 4 }
                ),
                fc.integer({ min: 10, max: 50 }),
                (purchases, salePrice) => {
                    // Reset to known state
                    gameState.initNewGame();
                    gameState.updateCredits(10000);
                    gameState.updateCargo([]);
                    
                    // Execute all purchases
                    for (const purchase of purchases) {
                        gameState.buyGood(
                            purchase.goodType,
                            purchase.quantity,
                            purchase.purchasePrice
                        );
                    }
                    
                    const cargoUsedBefore = gameState.getCargoUsed();
                    
                    // Sell from first stack
                    const cargo = gameState.getShip().cargo;
                    if (cargo.length > 0) {
                        const sellQty = Math.floor(cargo[0].qty / 2);
                        
                        if (sellQty > 0) {
                            const sellResult = gameState.sellGood(0, sellQty, salePrice);
                            
                            if (sellResult.success) {
                                const cargoUsedAfter = gameState.getCargoUsed();
                                expect(cargoUsedAfter).toBe(cargoUsedBefore - sellQty);
                            }
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
