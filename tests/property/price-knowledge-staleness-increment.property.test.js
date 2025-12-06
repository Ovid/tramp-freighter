import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';

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

describe('Price Knowledge - Staleness Increment (Property Tests)', () => {
    
    it('Property 9: For any time advancement, the lastVisit counter for all systems in the price knowledge database should increment by the number of days passed', () => {
        // Generator for visited system IDs
        const visitedSystemsGenerator = fc.uniqueArray(
            fc.integer({ min: 1, max: starData.length - 1 }),
            { minLength: 1, maxLength: 10 }
        );
        
        // Generator for days to advance
        const daysGenerator = fc.integer({ min: 1, max: 100 });
        
        fc.assert(
            fc.property(visitedSystemsGenerator, daysGenerator, (visitedSystems, daysToAdvance) => {
                // Initialize a new game
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Visit and dock at each system
                for (const systemId of visitedSystems) {
                    gameState.updateLocation(systemId);
                    gameState.dock();
                }
                
                // Get initial lastVisit values (should all be 0)
                const priceKnowledgeBefore = gameState.getPriceKnowledge();
                const initialLastVisits = {};
                for (const systemId in priceKnowledgeBefore) {
                    initialLastVisits[systemId] = priceKnowledgeBefore[systemId].lastVisit;
                }
                
                // Advance time
                const currentDays = gameState.getPlayer().daysElapsed;
                gameState.updateTime(currentDays + daysToAdvance);
                
                // Get updated lastVisit values
                const priceKnowledgeAfter = gameState.getPriceKnowledge();
                
                // Verify all lastVisit values incremented by daysToAdvance
                for (const systemId in priceKnowledgeAfter) {
                    const expectedLastVisit = initialLastVisits[systemId] + daysToAdvance;
                    expect(priceKnowledgeAfter[systemId].lastVisit).toBe(expectedLastVisit);
                }
            }),
            { numRuns: 100 }
        );
    });
    
    it('Property 9 (variant): Multiple time advancements should accumulate staleness', () => {
        const visitedSystemsGenerator = fc.uniqueArray(
            fc.integer({ min: 1, max: starData.length - 1 }),
            { minLength: 1, maxLength: 5 }
        );
        
        const advancementsGenerator = fc.array(
            fc.integer({ min: 1, max: 20 }),
            { minLength: 2, maxLength: 5 }
        );
        
        fc.assert(
            fc.property(visitedSystemsGenerator, advancementsGenerator, (visitedSystems, advancements) => {
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Visit and dock at each system
                for (const systemId of visitedSystems) {
                    gameState.updateLocation(systemId);
                    gameState.dock();
                }
                
                // Apply multiple time advancements
                let totalDaysAdvanced = 0;
                for (const days of advancements) {
                    const currentDays = gameState.getPlayer().daysElapsed;
                    gameState.updateTime(currentDays + days);
                    totalDaysAdvanced += days;
                }
                
                // Verify all lastVisit values equal total days advanced
                const priceKnowledge = gameState.getPriceKnowledge();
                for (const systemId in priceKnowledge) {
                    expect(priceKnowledge[systemId].lastVisit).toBe(totalDaysAdvanced);
                }
            }),
            { numRuns: 100 }
        );
    });
    
    it('Property 9 (variant): Docking should reset lastVisit to 0 while other systems continue to age', () => {
        const visitedSystemsGenerator = fc.uniqueArray(
            fc.integer({ min: 1, max: starData.length - 1 }),
            { minLength: 2, maxLength: 5 }
        );
        
        const daysGenerator = fc.integer({ min: 1, max: 50 });
        
        fc.assert(
            fc.property(visitedSystemsGenerator, daysGenerator, (visitedSystems, daysToAdvance) => {
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Visit and dock at each system
                for (const systemId of visitedSystems) {
                    gameState.updateLocation(systemId);
                    gameState.dock();
                }
                
                // Advance time
                const currentDays = gameState.getPlayer().daysElapsed;
                gameState.updateTime(currentDays + daysToAdvance);
                
                // Verify all systems have stale prices
                let priceKnowledge = gameState.getPriceKnowledge();
                for (const systemId of visitedSystems) {
                    expect(priceKnowledge[systemId].lastVisit).toBe(daysToAdvance);
                }
                
                // Dock at the first system
                const firstSystem = visitedSystems[0];
                gameState.updateLocation(firstSystem);
                gameState.dock();
                
                // Verify first system has lastVisit = 0
                priceKnowledge = gameState.getPriceKnowledge();
                expect(priceKnowledge[firstSystem].lastVisit).toBe(0);
                
                // Verify other systems still have stale prices
                for (let i = 1; i < visitedSystems.length; i++) {
                    expect(priceKnowledge[visitedSystems[i]].lastVisit).toBe(daysToAdvance);
                }
            }),
            { numRuns: 100 }
        );
    });
    
    it('Property 9 (variant): Time should not advance backwards', () => {
        const daysGenerator = fc.integer({ min: 0, max: 100 });
        
        fc.assert(
            fc.property(daysGenerator, (initialDays) => {
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Advance to initial days
                if (initialDays > 0) {
                    gameState.updateTime(initialDays);
                }
                
                // Get current lastVisit for Sol
                const priceKnowledgeBefore = gameState.getPriceKnowledge();
                const solLastVisitBefore = priceKnowledgeBefore[0].lastVisit;
                
                // Try to set time to same value (no change)
                gameState.updateTime(initialDays);
                
                // Verify lastVisit didn't change
                const priceKnowledgeAfter = gameState.getPriceKnowledge();
                expect(priceKnowledgeAfter[0].lastVisit).toBe(solLastVisitBefore);
            }),
            { numRuns: 100 }
        );
    });
    
    it('Property 9 (variant): Staleness should increment for all systems including Sol', () => {
        const daysGenerator = fc.integer({ min: 1, max: 100 });
        
        fc.assert(
            fc.property(daysGenerator, (daysToAdvance) => {
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Sol starts with lastVisit = 0
                const priceKnowledgeBefore = gameState.getPriceKnowledge();
                expect(priceKnowledgeBefore[0].lastVisit).toBe(0);
                
                // Advance time
                gameState.updateTime(daysToAdvance);
                
                // Verify Sol's lastVisit incremented
                const priceKnowledgeAfter = gameState.getPriceKnowledge();
                expect(priceKnowledgeAfter[0].lastVisit).toBe(daysToAdvance);
            }),
            { numRuns: 100 }
        );
    });
    
    it('Property 9 (variant): Staleness increment should be independent of number of systems visited', () => {
        const visitedSystemsGenerator = fc.uniqueArray(
            fc.integer({ min: 1, max: starData.length - 1 }),
            { minLength: 1, maxLength: 15 }
        );
        
        const daysGenerator = fc.integer({ min: 1, max: 50 });
        
        fc.assert(
            fc.property(visitedSystemsGenerator, daysGenerator, (visitedSystems, daysToAdvance) => {
                const gameState = new GameStateManager(starData, wormholeData);
                gameState.initNewGame();
                
                // Visit and dock at each system
                for (const systemId of visitedSystems) {
                    gameState.updateLocation(systemId);
                    gameState.dock();
                }
                
                // Advance time
                const currentDays = gameState.getPlayer().daysElapsed;
                gameState.updateTime(currentDays + daysToAdvance);
                
                // Verify all systems have the same staleness
                const priceKnowledge = gameState.getPriceKnowledge();
                for (const systemId in priceKnowledge) {
                    expect(priceKnowledge[systemId].lastVisit).toBe(daysToAdvance);
                }
            }),
            { numRuns: 100 }
        );
    });
    
});
