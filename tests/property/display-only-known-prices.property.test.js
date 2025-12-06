import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { BASE_PRICES } from '../../js/game-constants.js';

// Create minimal test star data with deterministic values for reproducible tests
const createTestStarData = (count = 20) => {
    const spectralClasses = ['G', 'K', 'M', 'A', 'F'];
    const stars = [];
    
    for (let i = 0; i < count; i++) {
        stars.push({
            id: i,
            name: `Test Star ${i}`,
            type: `${spectralClasses[i % spectralClasses.length]}2V`,
            x: (i * 37) % 200 - 100,
            y: (i * 73) % 200 - 100,
            z: (i * 113) % 200 - 100,
            st: i % 3,
            wh: (i * 2) % 3,
            r: 1
        });
    }
    
    return stars;
};

const starData = createTestStarData();
const wormholeData = [];

describe('Price Knowledge - Display Only Known Prices (Property Tests)', () => {
    
    it('Property 8: For any trade interface display, only prices from systems in the price knowledge database should be shown', () => {
        // Generator for visited system IDs (excluding Sol which is always visited at start)
        const visitedSystemsGenerator = fc.uniqueArray(
            fc.integer({ min: 1, max: starData.length - 1 }),
            { minLength: 1, maxLength: 10 }
        );
        
        fc.assert(
            fc.property(visitedSystemsGenerator, (visitedSystems) => {
                // Initialize a new game
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Visit and dock at each system
                for (const systemId of visitedSystems) {
                    gameState.updateLocation(systemId);
                    gameState.dock();
                }
                
                // Get price knowledge
                const priceKnowledge = gameState.getPriceKnowledge();
                
                // Sol (0) is always visited at start, so include it
                const allVisitedSystems = [0, ...visitedSystems];
                
                // Verify only visited systems have price knowledge
                for (let systemId = 0; systemId < starData.length; systemId++) {
                    const hasKnowledge = gameState.hasVisitedSystem(systemId);
                    const shouldHaveKnowledge = allVisitedSystems.includes(systemId);
                    
                    expect(hasKnowledge).toBe(shouldHaveKnowledge);
                    
                    if (shouldHaveKnowledge) {
                        // Should have prices
                        const knownPrices = gameState.getKnownPrices(systemId);
                        expect(knownPrices).not.toBeNull();
                        expect(Object.keys(knownPrices).length).toBeGreaterThan(0);
                    } else {
                        // Should not have prices
                        const knownPrices = gameState.getKnownPrices(systemId);
                        expect(knownPrices).toBeNull();
                    }
                }
            }),
            { numRuns: 100 }
        );
    });
    
    it('Property 8 (variant): Never visited systems should return null for getKnownPrices', () => {
        const unvisitedSystemGenerator = fc.integer({ min: 1, max: starData.length - 1 });
        
        fc.assert(
            fc.property(unvisitedSystemGenerator, (unvisitedSystemId) => {
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Verify the system is not Sol (which is visited at start)
                if (unvisitedSystemId === 0) {
                    return; // Skip Sol
                }
                
                // Verify system has no price knowledge
                expect(gameState.hasVisitedSystem(unvisitedSystemId)).toBe(false);
                
                // Verify getKnownPrices returns null
                const knownPrices = gameState.getKnownPrices(unvisitedSystemId);
                expect(knownPrices).toBeNull();
            }),
            { numRuns: 100 }
        );
    });
    
    it('Property 8 (variant): Price knowledge should persist across multiple queries', () => {
        const systemIdGenerator = fc.integer({ min: 0, max: starData.length - 1 });
        const queriesGenerator = fc.integer({ min: 2, max: 10 });
        
        fc.assert(
            fc.property(systemIdGenerator, queriesGenerator, (systemId, numQueries) => {
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Visit and dock at the system
                gameState.updateLocation(systemId);
                gameState.dock();
                
                // Query prices multiple times
                const priceResults = [];
                for (let i = 0; i < numQueries; i++) {
                    const knownPrices = gameState.getKnownPrices(systemId);
                    priceResults.push(knownPrices);
                }
                
                // Verify all queries return the same prices
                for (let i = 1; i < numQueries; i++) {
                    expect(priceResults[i]).toEqual(priceResults[0]);
                }
                
                // Verify prices are not null
                expect(priceResults[0]).not.toBeNull();
            }),
            { numRuns: 100 }
        );
    });
    
    it('Property 8 (variant): Price knowledge database should only contain visited systems', () => {
        const visitedSystemsGenerator = fc.uniqueArray(
            fc.integer({ min: 1, max: starData.length - 1 }),
            { minLength: 1, maxLength: 10 }
        );
        
        fc.assert(
            fc.property(visitedSystemsGenerator, (visitedSystems) => {
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Visit and dock at each system
                for (const systemId of visitedSystems) {
                    gameState.updateLocation(systemId);
                    gameState.dock();
                }
                
                // Get price knowledge
                const priceKnowledge = gameState.getPriceKnowledge();
                const knownSystemIds = Object.keys(priceKnowledge).map(id => parseInt(id));
                
                // Sol (0) is always visited at start, so include it
                const allVisitedSystems = [0, ...visitedSystems];
                
                // Verify price knowledge contains exactly the visited systems
                expect(knownSystemIds.sort((a, b) => a - b)).toEqual(allVisitedSystems.sort((a, b) => a - b));
                
                // Verify each entry has the required structure
                for (const systemId of allVisitedSystems) {
                    const knowledge = priceKnowledge[systemId];
                    expect(knowledge).toBeDefined();
                    expect(typeof knowledge.lastVisit).toBe('number');
                    expect(typeof knowledge.prices).toBe('object');
                    expect(knowledge.prices).not.toBeNull();
                    
                    // Verify all commodities are present
                    for (const goodType of Object.keys(BASE_PRICES)) {
                        expect(knowledge.prices[goodType]).toBeDefined();
                        expect(typeof knowledge.prices[goodType]).toBe('number');
                    }
                }
            }),
            { numRuns: 100 }
        );
    });
    
    it('Property 8 (variant): hasVisitedSystem should match presence in price knowledge', () => {
        const visitedSystemsGenerator = fc.uniqueArray(
            fc.integer({ min: 0, max: starData.length - 1 }),
            { minLength: 1, maxLength: 10 }
        );
        
        fc.assert(
            fc.property(visitedSystemsGenerator, (visitedSystems) => {
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Visit and dock at each system
                for (const systemId of visitedSystems) {
                    gameState.updateLocation(systemId);
                    gameState.dock();
                }
                
                // Get price knowledge
                const priceKnowledge = gameState.getPriceKnowledge();
                
                // Verify hasVisitedSystem matches presence in price knowledge
                for (let systemId = 0; systemId < starData.length; systemId++) {
                    const hasKnowledge = gameState.hasVisitedSystem(systemId);
                    const inPriceKnowledge = priceKnowledge[systemId] !== undefined;
                    
                    expect(hasKnowledge).toBe(inPriceKnowledge);
                }
            }),
            { numRuns: 100 }
        );
    });
    
});
