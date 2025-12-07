import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { TradingSystem } from '../../js/game-trading.js';
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
      x: ((i * 37) % 200) - 100,
      y: ((i * 73) % 200) - 100,
      z: ((i * 113) % 200) - 100,
      st: i % 3,
      wh: (i * 2) % 3,
      r: 1,
    });
  }

  return stars;
};

const starData = createTestStarData();
const wormholeData = [];

describe('Price Knowledge - First Visit Recording (Property Tests)', () => {
  it('Property 6: For any system visited for the first time, the current prices and visit day should be recorded in the price knowledge database', () => {
    // Generator for system IDs (excluding Sol which is visited at start)
    const systemIdGenerator = fc.integer({ min: 1, max: starData.length - 1 });

    fc.assert(
      fc.property(systemIdGenerator, (systemId) => {
        // Initialize a new game
        const gameState = new GameStateManager(starData, wormholeData);
        gameState.initNewGame();

        // Verify system is not yet in price knowledge
        expect(gameState.hasVisitedSystem(systemId)).toBe(false);

        // Navigate to the system (simulate first visit)
        gameState.updateLocation(systemId);

        // Dock at the system (this should record prices)
        gameState.dock();

        // Verify system is now in price knowledge
        expect(gameState.hasVisitedSystem(systemId)).toBe(true);

        // Get the recorded prices
        const knownPrices = gameState.getKnownPrices(systemId);
        expect(knownPrices).not.toBeNull();

        // Verify all commodity prices are recorded
        for (const goodType of Object.keys(BASE_PRICES)) {
          expect(knownPrices[goodType]).toBeDefined();
          expect(typeof knownPrices[goodType]).toBe('number');
          expect(knownPrices[goodType]).toBeGreaterThan(0);
        }

        // Verify lastVisit is set to 0 (current)
        const priceKnowledge = gameState.getPriceKnowledge();
        expect(priceKnowledge[systemId].lastVisit).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 6 (variant): First visit should record prices that match calculated prices for that system', () => {
    const systemIdGenerator = fc.integer({ min: 1, max: starData.length - 1 });

    fc.assert(
      fc.property(systemIdGenerator, (systemId) => {
        const gameState = new GameStateManager(starData, wormholeData);
        gameState.initNewGame();

        // Get the system
        const system = starData.find((s) => s.id === systemId);

        // Calculate expected prices using dynamic pricing
        const currentDay = gameState.getState().player.daysElapsed;
        const activeEvents = gameState.getState().world.activeEvents || [];
        const expectedPrices = {};
        for (const goodType of Object.keys(BASE_PRICES)) {
          expectedPrices[goodType] = TradingSystem.calculatePrice(
            goodType,
            system,
            currentDay,
            activeEvents
          );
        }

        // Navigate and dock
        gameState.updateLocation(systemId);
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

  it('Property 6 (variant): Multiple first visits to different systems should all be recorded', () => {
    // Generator for a list of unique system IDs
    const systemIdsGenerator = fc.uniqueArray(
      fc.integer({ min: 1, max: Math.min(10, starData.length - 1) }),
      { minLength: 2, maxLength: 5 }
    );

    fc.assert(
      fc.property(systemIdsGenerator, (systemIds) => {
        const gameState = new GameStateManager(starData, wormholeData);
        gameState.initNewGame();

        // Visit each system
        for (const systemId of systemIds) {
          gameState.updateLocation(systemId);
          gameState.dock();
        }

        // Verify all systems are in price knowledge
        for (const systemId of systemIds) {
          expect(gameState.hasVisitedSystem(systemId)).toBe(true);
          const knownPrices = gameState.getKnownPrices(systemId);
          expect(knownPrices).not.toBeNull();

          // Verify all commodities are recorded
          for (const goodType of Object.keys(BASE_PRICES)) {
            expect(knownPrices[goodType]).toBeDefined();
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
