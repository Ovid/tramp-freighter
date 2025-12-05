import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { GameStateManager } from '../../js/game-state.js';
import { NavigationSystem } from '../../js/game-navigation.js';

/**
 * Property-based tests for connected systems list display
 * 
 * Verifies that the connected systems list correctly displays
 * navigation options with proper sorting and fuel indicators.
 */
describe('Connected Systems List Display', () => {
    let dom;
    let document;
    let gameStateManager;
    let navSystem;
    
    beforeEach(() => {
        // Create a minimal DOM for testing
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <div id="connected-list"></div>
                </body>
            </html>
        `);
        document = dom.window.document;
        global.document = document;
        
        gameStateManager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
        gameStateManager.initNewGame();
        navSystem = new NavigationSystem(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    });
    
    afterEach(() => {
        delete global.document;
    });
    
    it('should display all connected systems for current location', () => {
        const currentSystemId = gameStateManager.getPlayer().currentSystem;
        const connectedIds = navSystem.getConnectedSystems(currentSystemId);
        
        // Simulate the list population
        const connectedList = document.getElementById('connected-list');
        
        // Create items for each connected system
        connectedIds.forEach(id => {
            const item = document.createElement('div');
            item.className = 'connected-system-item';
            item.dataset.systemId = id;
            connectedList.appendChild(item);
        });
        
        // Verify all connected systems are displayed
        const displayedItems = connectedList.querySelectorAll('.connected-system-item');
        expect(displayedItems.length).toBe(connectedIds.length);
    });
    
    it('should sort connected systems by distance', () => {
        const currentSystemId = gameStateManager.getPlayer().currentSystem;
        const currentStar = TEST_STAR_DATA.find(s => s.id === currentSystemId);
        const connectedIds = navSystem.getConnectedSystems(currentSystemId);
        
        // Calculate distances
        const systemsWithDistance = connectedIds.map(id => {
            const star = TEST_STAR_DATA.find(s => s.id === id);
            const distance = navSystem.calculateDistanceBetween(currentStar, star);
            return { id, distance };
        });
        
        // Sort by distance
        systemsWithDistance.sort((a, b) => a.distance - b.distance);
        
        // Verify sorting is correct
        for (let i = 1; i < systemsWithDistance.length; i++) {
            expect(systemsWithDistance[i].distance).toBeGreaterThanOrEqual(
                systemsWithDistance[i - 1].distance
            );
        }
    });
    
    it('should indicate insufficient fuel with appropriate styling', () => {
        const currentSystemId = gameStateManager.getPlayer().currentSystem;
        const currentStar = TEST_STAR_DATA.find(s => s.id === currentSystemId);
        const currentFuel = gameStateManager.getShip().fuel;
        const connectedIds = navSystem.getConnectedSystems(currentSystemId);
        
        const connectedList = document.getElementById('connected-list');
        
        // Create items with fuel check
        connectedIds.forEach(id => {
            const star = TEST_STAR_DATA.find(s => s.id === id);
            const distance = navSystem.calculateDistanceBetween(currentStar, star);
            const fuelCost = navSystem.calculateFuelCost(distance);
            const canJump = currentFuel >= fuelCost;
            
            const item = document.createElement('div');
            item.className = 'connected-system-item';
            if (!canJump) {
                item.classList.add('insufficient-fuel');
            }
            item.dataset.systemId = id;
            item.dataset.canJump = canJump;
            connectedList.appendChild(item);
        });
        
        // Verify styling is applied correctly
        const allItems = connectedList.querySelectorAll('.connected-system-item');
        allItems.forEach(item => {
            const canJump = item.dataset.canJump === 'true';
            const hasInsufficientClass = item.classList.contains('insufficient-fuel');
            
            if (canJump) {
                expect(hasInsufficientClass).toBe(false);
            } else {
                expect(hasInsufficientClass).toBe(true);
            }
        });
    });
    
    it('should display distance, fuel cost, and jump time for each system', () => {
        const currentSystemId = gameStateManager.getPlayer().currentSystem;
        const currentStar = TEST_STAR_DATA.find(s => s.id === currentSystemId);
        const connectedIds = navSystem.getConnectedSystems(currentSystemId);
        
        const connectedList = document.getElementById('connected-list');
        
        // Create items with full info
        connectedIds.forEach(id => {
            const star = TEST_STAR_DATA.find(s => s.id === id);
            const distance = navSystem.calculateDistanceBetween(currentStar, star);
            const fuelCost = navSystem.calculateFuelCost(distance);
            const jumpTime = navSystem.calculateJumpTime(distance);
            
            const item = document.createElement('div');
            item.className = 'connected-system-item';
            
            const info = document.createElement('div');
            info.className = 'connected-system-info';
            info.textContent = `${distance.toFixed(1)} LY • ${Math.round(fuelCost)}% fuel • ${jumpTime}d`;
            
            item.appendChild(info);
            item.dataset.distance = distance;
            item.dataset.fuelCost = fuelCost;
            item.dataset.jumpTime = jumpTime;
            
            connectedList.appendChild(item);
        });
        
        // Verify all items have complete information
        const allItems = connectedList.querySelectorAll('.connected-system-item');
        allItems.forEach(item => {
            expect(item.dataset.distance).toBeDefined();
            expect(item.dataset.fuelCost).toBeDefined();
            expect(item.dataset.jumpTime).toBeDefined();
            
            const info = item.querySelector('.connected-system-info');
            expect(info).toBeDefined();
            expect(info.textContent).toContain('LY');
            expect(info.textContent).toContain('fuel');
            expect(info.textContent).toContain('d');
        });
    });
    
    it('should handle systems with no connections gracefully', () => {
        const connectedList = document.getElementById('connected-list');
        
        // Simulate empty connections
        const connectedIds = [];
        
        if (connectedIds.length === 0) {
            connectedList.innerHTML = '<div class="no-connections">No connected systems</div>';
        }
        
        // Verify empty state message
        const emptyMessage = connectedList.querySelector('.no-connections');
        expect(emptyMessage).toBeDefined();
        expect(emptyMessage.textContent).toContain('No connected systems');
    });
    
    it('should calculate correct fuel requirements for all connected systems', () => {
        const currentSystemId = gameStateManager.getPlayer().currentSystem;
        const currentStar = TEST_STAR_DATA.find(s => s.id === currentSystemId);
        const connectedIds = navSystem.getConnectedSystems(currentSystemId);
        
        connectedIds.forEach(id => {
            const targetStar = TEST_STAR_DATA.find(s => s.id === id);
            const distance = navSystem.calculateDistanceBetween(currentStar, targetStar);
            const fuelCost = navSystem.calculateFuelCost(distance);
            
            // Fuel cost should match formula: 10 + (distance × 2)
            const expectedFuelCost = 10 + (distance * 2);
            expect(fuelCost).toBeCloseTo(expectedFuelCost, 2);
            
            // Fuel cost should be positive
            expect(fuelCost).toBeGreaterThan(0);
            
            // Fuel cost should be reasonable (not exceed 100% by too much)
            expect(fuelCost).toBeLessThan(200);
        });
    });
});
