/**
 * Feature: tramp-freighter-core-loop, Property 24: Cargo Stack Display Completeness
 * Validates: Requirements 7.16
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { JSDOM } from 'jsdom';
import { UIManager } from '../../js/game-ui.js';
import { GameStateManager } from '../../js/game-state.js';

// Mock star data for testing
const mockStarData = [
    { id: 0, x: 0, y: 0, z: 0, name: 'Sol', type: 'G2V', wh: 3, st: 1, r: 1 },
    { id: 1, x: 43, y: 0, z: 0, name: 'Alpha Centauri', type: 'G2V', wh: 2, st: 1, r: 1 },
    { id: 2, x: 60, y: 30, z: 20, name: 'Barnard\'s Star', type: 'M3V', wh: 1, st: 1, r: 1 }
];

const mockWormholeData = [[0, 1], [1, 2]];

describe('Property 24: Cargo Stack Display Completeness', () => {
    let dom;
    let document;
    let gameStateManager;
    let uiManager;
    
    beforeEach(() => {
        // Set up DOM environment
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="game-hud"></div>
                <div id="hud-credits"></div>
                <div id="hud-debt"></div>
                <div id="hud-days"></div>
                <div id="fuel-bar"></div>
                <div id="hud-fuel-text"></div>
                <div id="hud-cargo"></div>
                <div id="hud-system"></div>
                <div id="hud-distance"></div>
                <div id="station-interface"></div>
                <div id="trade-panel"></div>
                <div id="trade-system-name"></div>
                <div id="market-goods"></div>
                <div id="cargo-stacks"></div>
            </body>
            </html>
        `);
        
        document = dom.window.document;
        global.document = document;
        global.window = dom.window;
        
        // Initialize game state manager
        gameStateManager = new GameStateManager(mockStarData, mockWormholeData);
        gameStateManager.initNewGame();
        
        // Initialize UI manager
        uiManager = new UIManager(gameStateManager);
    });
    it('should display all cargo stacks separately with good type, quantity, and purchase price', () => {
        fc.assert(
            fc.property(
                // Generate random cargo stacks
                fc.array(
                    fc.record({
                        good: fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                        qty: fc.integer({ min: 1, max: 50 }),
                        purchasePrice: fc.integer({ min: 5, max: 100 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                // Generate random system for current location
                fc.constantFrom(0, 1, 2),
                (cargoStacks, systemId) => {
                    // Set up game state with cargo
                    const state = gameStateManager.getState();
                    state.ship.cargo = cargoStacks;
                    state.player.currentSystem = systemId;
                    
                    const system = mockStarData.find(s => s.id === systemId);
                    
                    // Render cargo stacks
                    uiManager.renderCargoStacks(system);
                    
                    // Get rendered cargo stack elements
                    const cargoStacksContainer = document.getElementById('cargo-stacks');
                    const renderedStacks = cargoStacksContainer.querySelectorAll('.cargo-stack');
                    
                    // Verify ALL cargo stacks are displayed (completeness)
                    expect(renderedStacks.length).toBe(cargoStacks.length);
                    
                    // Verify each stack is displayed SEPARATELY with required information
                    cargoStacks.forEach((stack, index) => {
                        const stackElement = renderedStacks[index];
                        const stackHTML = stackElement.innerHTML;
                        
                        // Verify good type is displayed
                        const capitalizedGood = stack.good.charAt(0).toUpperCase() + stack.good.slice(1);
                        expect(stackHTML).toContain(capitalizedGood);
                        
                        // Verify quantity is displayed
                        expect(stackHTML).toContain(`Qty: ${stack.qty}`);
                        
                        // Verify purchase price is displayed
                        expect(stackHTML).toContain(`Bought at: ${stack.purchasePrice} cr/unit`);
                        
                        // Verify stack has its own separate element
                        expect(stackElement.className).toContain('cargo-stack');
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should display multiple stacks of the same good separately', () => {
        fc.assert(
            fc.property(
                // Generate multiple stacks of the same good with different prices
                fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                fc.integer({ min: 2, max: 5 }),
                fc.constantFrom(0, 1, 2),
                (goodType, numStacks, systemId) => {
                    // Create multiple stacks of the same good with different purchase prices
                    const cargoStacks = Array.from({ length: numStacks }, (_, i) => ({
                        good: goodType,
                        qty: 10 + i,
                        purchasePrice: 10 + (i * 5)
                    }));
                    
                    // Set up game state with cargo
                    const state = gameStateManager.getState();
                    state.ship.cargo = cargoStacks;
                    state.player.currentSystem = systemId;
                    
                    const system = mockStarData.find(s => s.id === systemId);
                    
                    // Render cargo stacks
                    uiManager.renderCargoStacks(system);
                    
                    // Get rendered cargo stack elements
                    const cargoStacksContainer = document.getElementById('cargo-stacks');
                    const renderedStacks = cargoStacksContainer.querySelectorAll('.cargo-stack');
                    
                    // Verify all stacks are displayed separately (not merged)
                    expect(renderedStacks.length).toBe(numStacks);
                    
                    // Verify each stack has its unique purchase price displayed
                    cargoStacks.forEach((stack, index) => {
                        const stackElement = renderedStacks[index];
                        const stackHTML = stackElement.innerHTML;
                        
                        expect(stackHTML).toContain(`Bought at: ${stack.purchasePrice} cr/unit`);
                        expect(stackHTML).toContain(`Qty: ${stack.qty}`);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should display cargo stacks in the same order as the cargo array', () => {
        fc.assert(
            fc.property(
                // Generate random cargo stacks with distinct quantities for identification
                fc.array(
                    fc.record({
                        good: fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                        qty: fc.integer({ min: 1, max: 50 }),
                        purchasePrice: fc.integer({ min: 5, max: 100 })
                    }),
                    { minLength: 2, maxLength: 8 }
                ),
                fc.constantFrom(0, 1, 2),
                (cargoStacks, systemId) => {
                    // Set up game state with cargo
                    const state = gameStateManager.getState();
                    state.ship.cargo = cargoStacks;
                    state.player.currentSystem = systemId;
                    
                    const system = mockStarData.find(s => s.id === systemId);
                    
                    // Render cargo stacks
                    uiManager.renderCargoStacks(system);
                    
                    // Get rendered cargo stack elements
                    const cargoStacksContainer = document.getElementById('cargo-stacks');
                    const renderedStacks = cargoStacksContainer.querySelectorAll('.cargo-stack');
                    
                    // Verify order matches by checking quantities in order
                    cargoStacks.forEach((stack, index) => {
                        const stackElement = renderedStacks[index];
                        const stackHTML = stackElement.innerHTML;
                        
                        // Verify this stack's quantity appears in the correct position
                        expect(stackHTML).toContain(`Qty: ${stack.qty}`);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it('should display sell buttons for each cargo stack', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        good: fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
                        qty: fc.integer({ min: 1, max: 50 }),
                        purchasePrice: fc.integer({ min: 5, max: 100 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.constantFrom(0, 1, 2),
                (cargoStacks, systemId) => {
                    // Set up game state with cargo
                    const state = gameStateManager.getState();
                    state.ship.cargo = cargoStacks;
                    state.player.currentSystem = systemId;
                    
                    const system = mockStarData.find(s => s.id === systemId);
                    
                    // Render cargo stacks
                    uiManager.renderCargoStacks(system);
                    
                    // Get rendered cargo stack elements
                    const cargoStacksContainer = document.getElementById('cargo-stacks');
                    const renderedStacks = cargoStacksContainer.querySelectorAll('.cargo-stack');
                    
                    // Verify each stack has sell buttons
                    renderedStacks.forEach((stackElement, index) => {
                        const sellButtons = stackElement.querySelectorAll('.sell-btn');
                        
                        // Should have at least 2 sell buttons (Sell 1, Sell All)
                        expect(sellButtons.length).toBeGreaterThanOrEqual(2);
                        
                        // Verify buttons have appropriate text
                        const buttonTexts = Array.from(sellButtons).map(btn => btn.textContent);
                        expect(buttonTexts.some(text => text.includes('Sell 1'))).toBe(true);
                        expect(buttonTexts.some(text => text.includes('Sell All'))).toBe(true);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});
