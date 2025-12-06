import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { GameStateManager } from '../../js/game-state.js';
import { UIManager } from '../../js/game-ui.js';
import { TradingSystem } from '../../js/game-trading.js';

/**
 * Property-based tests for trade panel validation messages
 * 
 * Verifies that users receive clear feedback when buying goods
 * is not possible due to resource constraints.
 */
describe('Trade Validation Messages', () => {
    let dom;
    let document;
    let gameStateManager;
    let uiManager;
    
    beforeEach(() => {
        // Create a minimal DOM for testing
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <div id="game-hud" class="visible">
                        <span id="hud-credits">1000</span>
                        <span id="hud-debt">0</span>
                        <span id="hud-days">0</span>
                        <div id="fuel-bar"></div>
                        <span id="hud-fuel-text">100%</span>
                        <span id="hud-cargo">0/50</span>
                        <span id="hud-system">Sol</span>
                        <span id="hud-distance">0.0 LY</span>
                    </div>
                    <div id="market-goods"></div>
                    <div id="cargo-stacks"></div>
                    <div id="notification-area"></div>
                </body>
            </html>
        `);
        document = dom.window.document;
        global.document = document;
        
        gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        gameStateManager.initNewGame();
        uiManager = new UIManager(gameStateManager);
    });
    
    afterEach(() => {
        delete global.document;
    });
    
    it('should show error message when insufficient credits', () => {
        // Set low credits
        gameStateManager.updateCredits(5);
        
        const state = gameStateManager.getState();
        const system = TEST_STAR_DATA.find(s => s.id === state.player.currentSystem);
        const price = TradingSystem.calculatePrice('grain', system.type);
        
        // Create good item
        const goodItem = uiManager.createGoodItem('grain', price);
        
        // Find validation message
        const validationMessage = goodItem.querySelector('.validation-message');
        
        // Should show insufficient credits error
        expect(validationMessage).toBeDefined();
        expect(validationMessage.textContent).toContain('Insufficient credits');
        expect(validationMessage.classList.contains('error')).toBe(true);
    });
    
    it('should show error message when cargo full', () => {
        // Fill cargo to capacity
        const state = gameStateManager.getState();
        const cargoCapacity = state.ship.cargoCapacity;
        
        // Buy goods to fill cargo
        for (let i = 0; i < cargoCapacity; i++) {
            gameStateManager.buyGood('grain', 1, 10);
        }
        
        const system = TEST_STAR_DATA.find(s => s.id === state.player.currentSystem);
        const price = TradingSystem.calculatePrice('ore', system.type);
        
        // Create good item
        const goodItem = uiManager.createGoodItem('ore', price);
        
        // Find validation message
        const validationMessage = goodItem.querySelector('.validation-message');
        
        // Should show cargo full error
        expect(validationMessage).toBeDefined();
        expect(validationMessage.textContent).toContain('Cargo capacity full');
        expect(validationMessage.classList.contains('error')).toBe(true);
    });
    
    it('should not show message when purchase is possible', () => {
        // Ensure sufficient credits and cargo space
        gameStateManager.updateCredits(10000);
        
        const state = gameStateManager.getState();
        const system = TEST_STAR_DATA.find(s => s.id === state.player.currentSystem);
        const price = TradingSystem.calculatePrice('grain', system.type);
        
        // Create good item
        const goodItem = uiManager.createGoodItem('grain', price);
        
        // Find validation message
        const validationMessage = goodItem.querySelector('.validation-message');
        
        // Should not show any message
        expect(validationMessage).toBeDefined();
        expect(validationMessage.textContent).toBe('');
        expect(validationMessage.classList.contains('error')).toBe(false);
    });
    
    it('should show appropriate message when both constraints fail', () => {
        // Set low credits AND fill cargo
        gameStateManager.updateCredits(5);
        
        const state = gameStateManager.getState();
        const cargoCapacity = state.ship.cargoCapacity;
        
        // Fill cargo (this will use credits, but we'll set them low after)
        for (let i = 0; i < cargoCapacity; i++) {
            gameStateManager.buyGood('grain', 1, 10);
        }
        
        gameStateManager.updateCredits(5);
        
        const system = TEST_STAR_DATA.find(s => s.id === state.player.currentSystem);
        const price = TradingSystem.calculatePrice('ore', system.type);
        
        // Create good item
        const goodItem = uiManager.createGoodItem('ore', price);
        
        // Find validation message
        const validationMessage = goodItem.querySelector('.validation-message');
        
        // Should show one of the errors (implementation checks cargo first in code)
        const hasError = validationMessage.textContent.includes('Cargo capacity full') ||
                        validationMessage.textContent.includes('Insufficient credits');
        expect(hasError).toBe(true);
        expect(validationMessage.classList.contains('error')).toBe(true);
    });
    
    it('should disable all buy buttons when validation fails', () => {
        // Set low credits
        gameStateManager.updateCredits(5);
        
        const state = gameStateManager.getState();
        const system = TEST_STAR_DATA.find(s => s.id === state.player.currentSystem);
        const price = TradingSystem.calculatePrice('grain', system.type);
        
        // Create good item
        const goodItem = uiManager.createGoodItem('grain', price);
        
        // Find all buy buttons
        const buyButtons = goodItem.querySelectorAll('.buy-btn');
        
        // All buttons should be disabled
        buyButtons.forEach(btn => {
            expect(btn.disabled).toBe(true);
        });
    });
    
    it('should show different messages for different goods based on price', () => {
        // Set credits that can afford some goods but not others
        gameStateManager.updateCredits(50);
        
        const state = gameStateManager.getState();
        const system = TEST_STAR_DATA.find(s => s.id === state.player.currentSystem);
        
        // Get prices for different goods
        const grainPrice = TradingSystem.calculatePrice('grain', system.type);
        const electronicsPrice = TradingSystem.calculatePrice('electronics', system.type);
        
        // Create items
        const grainItem = uiManager.createGoodItem('grain', grainPrice);
        const electronicsItem = uiManager.createGoodItem('electronics', electronicsPrice);
        
        const grainMessage = grainItem.querySelector('.validation-message');
        const electronicsMessage = electronicsItem.querySelector('.validation-message');
        
        // One should be purchasable, one might not be (depending on prices)
        // At minimum, verify messages are consistent with button states
        const grainBuyBtn = grainItem.querySelector('.buy-btn');
        const electronicsBuyBtn = electronicsItem.querySelector('.buy-btn');
        
        if (grainBuyBtn.disabled) {
            expect(grainMessage.textContent).not.toBe('');
        } else {
            expect(grainMessage.textContent).toBe('');
        }
        
        if (electronicsBuyBtn.disabled) {
            expect(electronicsMessage.textContent).not.toBe('');
        } else {
            expect(electronicsMessage.textContent).toBe('');
        }
    });
});
