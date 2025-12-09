'use strict';

import { describe, it, expect } from 'vitest';
import { InformationBroker } from '../../js/game-information-broker.js';
import { TradingSystem } from '../../js/game-trading.js';

/**
 * Unit tests for unreliable intelligence data
 *
 * The information broker sometimes provides manipulated prices that
 * show false profit opportunities, reflecting the unreliable nature
 * of black market intelligence.
 */
describe('Intelligence Reliability', () => {
  const starData = [
    { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 },
    { id: 1, name: 'Alpha Centauri', x: 10, y: 0, z: 0, type: 'G2V', st: 1 },
  ];

  it('should sometimes provide manipulated prices different from actual prices', () => {
    // Purchase intelligence multiple times with different days to get different seeds
    const purchasedPrices = [];
    const actualPrices = [];

    for (let day = 0; day < 100; day++) {
      const testGameState = {
        player: {
          credits: 1000,
          currentSystem: 0,
          daysElapsed: day,
        },
        world: {
          priceKnowledge: {},
          activeEvents: [],
        },
      };

      // Purchase intelligence
      InformationBroker.purchaseIntelligence(testGameState, 1, starData);
      const purchasedData = testGameState.world.priceKnowledge[1];

      // Calculate actual prices
      const system = starData[1];
      const actualData = {};
      for (const goodType of Object.keys(purchasedData.prices)) {
        actualData[goodType] = TradingSystem.calculatePrice(
          goodType,
          system,
          day,
          []
        );
      }

      purchasedPrices.push(purchasedData.prices);
      actualPrices.push(actualData);
    }

    // Count how many times prices were manipulated
    let manipulatedCount = 0;
    for (let i = 0; i < purchasedPrices.length; i++) {
      for (const goodType of Object.keys(purchasedPrices[i])) {
        if (purchasedPrices[i][goodType] !== actualPrices[i][goodType]) {
          manipulatedCount++;
        }
      }
    }

    // With 100 purchases and 6 goods each (600 total), we expect roughly 10% manipulation
    // Allow for some variance (5% to 15%)
    const totalPrices = purchasedPrices.length * Object.keys(purchasedPrices[0]).length;
    const manipulationRate = manipulatedCount / totalPrices;

    expect(manipulationRate).toBeGreaterThan(0.05);
    expect(manipulationRate).toBeLessThan(0.15);
  });

  it('should manipulate prices to be lower than actual (false buying opportunity)', () => {
    // Find a case where manipulation occurs
    let foundManipulation = false;
    let manipulationRatios = [];

    for (let day = 0; day < 100; day++) {
      const testGameState = {
        player: {
          credits: 1000,
          currentSystem: 0,
          daysElapsed: day,
        },
        world: {
          priceKnowledge: {},
          activeEvents: [],
        },
      };

      InformationBroker.purchaseIntelligence(testGameState, 1, starData);
      const purchasedData = testGameState.world.priceKnowledge[1];

      const system = starData[1];
      for (const goodType of Object.keys(purchasedData.prices)) {
        const actualPrice = TradingSystem.calculatePrice(
          goodType,
          system,
          day,
          []
        );
        const purchasedPrice = purchasedData.prices[goodType];

        if (purchasedPrice < actualPrice) {
          foundManipulation = true;
          const ratio = purchasedPrice / actualPrice;
          manipulationRatios.push(ratio);
          
          // Manipulated prices should be noticeably lower (at least 10% discount)
          expect(ratio).toBeLessThan(0.95);
        }
      }
    }

    expect(foundManipulation).toBe(true);
    
    // Average manipulation should be around the expected range
    const avgRatio = manipulationRatios.reduce((a, b) => a + b, 0) / manipulationRatios.length;
    expect(avgRatio).toBeGreaterThan(0.70);
    expect(avgRatio).toBeLessThan(0.90);
  });

  it('should be deterministic for same system and day', () => {
    // Purchase intelligence twice for same system and day
    const gameState1 = {
      player: { credits: 1000, currentSystem: 0, daysElapsed: 42 },
      world: { priceKnowledge: {}, activeEvents: [] },
    };

    const gameState2 = {
      player: { credits: 1000, currentSystem: 0, daysElapsed: 42 },
      world: { priceKnowledge: {}, activeEvents: [] },
    };

    InformationBroker.purchaseIntelligence(gameState1, 1, starData);
    InformationBroker.purchaseIntelligence(gameState2, 1, starData);

    const prices1 = gameState1.world.priceKnowledge[1].prices;
    const prices2 = gameState2.world.priceKnowledge[1].prices;

    // Prices should be identical
    for (const goodType of Object.keys(prices1)) {
      expect(prices1[goodType]).toBe(prices2[goodType]);
    }
  });

  it('should produce different manipulations for different days', () => {
    const gameState1 = {
      player: { credits: 1000, currentSystem: 0, daysElapsed: 10 },
      world: { priceKnowledge: {}, activeEvents: [] },
    };

    const gameState2 = {
      player: { credits: 1000, currentSystem: 0, daysElapsed: 20 },
      world: { priceKnowledge: {}, activeEvents: [] },
    };

    InformationBroker.purchaseIntelligence(gameState1, 1, starData);
    InformationBroker.purchaseIntelligence(gameState2, 1, starData);

    const prices1 = gameState1.world.priceKnowledge[1].prices;
    const prices2 = gameState2.world.priceKnowledge[1].prices;

    // At least some prices should be different due to different manipulation seeds
    let hasDifference = false;
    for (const goodType of Object.keys(prices1)) {
      if (prices1[goodType] !== prices2[goodType]) {
        hasDifference = true;
        break;
      }
    }

    expect(hasDifference).toBe(true);
  });

  it('should produce different manipulations for different systems on same day', () => {
    const starData2 = [
      { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2V', st: 1 },
      { id: 1, name: 'Alpha Centauri', x: 10, y: 0, z: 0, type: 'G2V', st: 1 },
      { id: 2, name: 'Barnard', x: 0, y: 10, z: 0, type: 'M4V', st: 0 },
    ];

    const gameState1 = {
      player: { credits: 1000, currentSystem: 0, daysElapsed: 50 },
      world: { priceKnowledge: {}, activeEvents: [] },
    };

    InformationBroker.purchaseIntelligence(gameState1, 1, starData2);
    InformationBroker.purchaseIntelligence(gameState1, 2, starData2);

    const prices1 = gameState1.world.priceKnowledge[1].prices;
    const prices2 = gameState1.world.priceKnowledge[2].prices;

    // Systems should have different manipulation patterns
    // (though actual prices may differ anyway due to different spectral types)
    expect(prices1).not.toEqual(prices2);
  });

  it('should not manipulate all prices for a system', () => {
    // Find a purchase where some prices are accurate
    let foundAccuratePrices = false;

    for (let day = 0; day < 100; day++) {
      const testGameState = {
        player: { credits: 1000, currentSystem: 0, daysElapsed: day },
        world: { priceKnowledge: {}, activeEvents: [] },
      };

      InformationBroker.purchaseIntelligence(testGameState, 1, starData);
      const purchasedData = testGameState.world.priceKnowledge[1];

      const system = starData[1];
      let accurateCount = 0;

      for (const goodType of Object.keys(purchasedData.prices)) {
        const actualPrice = TradingSystem.calculatePrice(goodType, system, day, []);
        if (purchasedData.prices[goodType] === actualPrice) {
          accurateCount++;
        }
      }

      // If at least one price is accurate, we found what we're looking for
      if (accurateCount > 0) {
        foundAccuratePrices = true;
        break;
      }
    }

    expect(foundAccuratePrices).toBe(true);
  });
});
