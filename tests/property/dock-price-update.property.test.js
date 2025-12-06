import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { BASE_PRICES } from '../../js/game-constants.js';

// Create minimal test star data
const createTestStarData = (count = 20) => {
    const spectralClasses = ['G', 'K', 'M', 'A', 'F'];
    const stars = [];
    
    for (let i = 0; i < count; i++) {
        stars.push({
            id: i,
            name: `Test Star ${i}`,
            type: `${spectralClasses[i % spectralClasses.length]}2V`,
            x: Math.random() * 200 - 100,
            y: Math.random() * 200 - 100,
            z: Math.random() * 200 - 100,
            st: Math.floor(Math.random() * 3),
            wh: Math.floor(Math.random() * 3),
            r: 1
        });
    }
    
    return stars;
};

const starData = createTestStarData();
const wormholeData = [];

describe('Price Knowledge - Dock Price Update (Property Tests)', () => {
    
    it('Property 7: For any docking operation, the price knowledge for that system should be updated with current prices and lastVisit set to zero', () => {
        // Generator for system IDs
        const systemIdGenerator = fc.integer({ min: 0, max: starData.length - 1 });
        
        // Generator for days elapsed before docking
        const daysGenerator = fc.integer({ min: 1, max: 100 });
        
        fc.assert(
            fc.property(systemIdGenerator, daysGenerator, (systemId, daysElapsed) => {
                // Initialize a new game
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Navigate to the system
                gameState.updateLocation(systemId);
                
                // First dock to establish price knowledge
                gameState.dock();
                
                // Advance time to make prices stale
                gameState.updateTime(daysElapsed);
                
                // Verify lastVisit has been incremented
                const priceKnowledgeBefore = gameState.getPriceKnowledge();
                expect(priceKnowledgeBefore[systemId].lastVisit).toBe(daysElapsed);
                
                // Dock again
                gameState.dock();
                
                // Verify lastVisit is reset to 0
                const priceKnowledgeAfter = gameState.getPriceKnowledge();
                expect(priceKnowledgeAfter[systemId].lastVisit).toBe(0);
                
                // Verify prices are updated (should still be valid)
                const knownPrices = gameState.getKnownPrices(systemId);
                expect(knownPrices).not.toBeNull();
                
                for (const goodType of Object.keys(BASE_PRICES)) {
                    expect(knownPrices[goodType]).toBeDefined();
                    expect(typeof knownPrices[goodType]).toBe('number');
                    expect(knownPrices[goodType]).toBeGreaterThan(0);
                }
            }),
            { numRuns: 100 }
        );
    });
    
    it('Property 7 (variant): Docking should update prices to match current calculated prices', () => {
        const systemIdGenerator = fc.integer({ min: 0, max: starData.length - 1 });
        
        fc.assert(
            fc.property(systemIdGenerator, (systemId) => {
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Navigate to the system
                gameState.updateLocation(systemId);
                
                // Get the system
                const system = starData.find(s => s.id === systemId);
                
                // Calculate expected prices
                const expectedPrices = {};
                for (const goodType of Object.keys(BASE_PRICES)) {
                    expectedPrices[goodType] = gameState.calculateGoodPrice(goodType, system.type);
                }
                
                // Dock
                gameState.dock();
                
                // Get recorded prices
                const knownPrices = gameState.getKnownPrices(systemId);
                
                // Verify prices match expected values
                for (const goodType of Object.keys(BASE_PRICES)) {
                    expect(knownPrices[goodType]).toBe(expectedPrices[goodType]);
                }
            }),
            { numRuns: 100 }
        );
    });
    
    it('Property 7 (variant): Multiple docks at the same system should always reset lastVisit to 0', () => {
        const systemIdGenerator = fc.integer({ min: 0, max: starData.length - 1 });
        const docksGenerator = fc.integer({ min: 2, max: 5 });
        
        fc.assert(
            fc.property(systemIdGenerator, docksGenerator, (systemId, numDocks) => {
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Navigate to the system
                gameState.updateLocation(systemId);
                
                // Perform multiple docks with time advancement in between
                for (let i = 0; i < numDocks; i++) {
                    gameState.dock();
                    
                    // Verify lastVisit is 0 after each dock
                    const priceKnowledge = gameState.getPriceKnowledge();
                    expect(priceKnowledge[systemId].lastVisit).toBe(0);
                    
                    // Advance time if not the last dock
                    if (i < numDocks - 1) {
                        const currentDays = gameState.getPlayer().daysElapsed;
                        gameState.updateTime(currentDays + 10);
                    }
                }
            }),
            { numRuns: 100 }
        );
    });
    
    it('Property 7 (variant): Docking at different systems should update each system independently', () => {
        // Generator for a list of unique system IDs
        const systemIdsGenerator = fc.uniqueArray(
            fc.integer({ min: 0, max: Math.min(10, starData.length - 1) }),
            { minLength: 2, maxLength: 5 }
        );
        
        fc.assert(
            fc.property(systemIdsGenerator, (systemIds) => {
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Visit and dock at each system
                for (const systemId of systemIds) {
                    gameState.updateLocation(systemId);
                    gameState.dock();
                }
                
                // Advance time
                const currentDays = gameState.getPlayer().daysElapsed;
                gameState.updateTime(currentDays + 20);
                
                // Verify all systems have stale prices
                const priceKnowledge = gameState.getPriceKnowledge();
                for (const systemId of systemIds) {
                    expect(priceKnowledge[systemId].lastVisit).toBe(20);
                }
                
                // Dock at the first system
                gameState.updateLocation(systemIds[0]);
                gameState.dock();
                
                // Verify only the first system has lastVisit reset
                const updatedPriceKnowledge = gameState.getPriceKnowledge();
                expect(updatedPriceKnowledge[systemIds[0]].lastVisit).toBe(0);
                
                // Verify other systems still have stale prices
                for (let i = 1; i < systemIds.length; i++) {
                    expect(updatedPriceKnowledge[systemIds[i]].lastVisit).toBe(20);
                }
            }),
            { numRuns: 100 }
        );
    });
    
});
