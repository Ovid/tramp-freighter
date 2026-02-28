import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InformationBroker } from '@game/game-information-broker.js';
import { INTELLIGENCE_CONFIG } from '@game/constants.js';

describe('Intelligence NPC discount', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('applies discount to intelligence purchase cost', () => {
    const gameState = {
      player: { credits: 1000, daysElapsed: 50, currentSystem: 0 },
      world: {
        priceKnowledge: {},
        activeEvents: [],
        marketConditions: {},
      },
    };
    const starData = [
      { id: 5, name: 'Test System', x: 1, y: 0, z: 0, type: 'G', st: 1 },
    ];
    const discount = 0.15;

    const result = InformationBroker.purchaseIntelligence(
      gameState,
      5,
      starData,
      discount
    );

    expect(result.success).toBe(true);

    const baseCost = INTELLIGENCE_CONFIG.PRICES.NEVER_VISITED;
    const discountedCost = Math.ceil(baseCost * (1 - discount));
    const creditsSpent = 1000 - gameState.player.credits;
    expect(creditsSpent).toBe(discountedCost);
  });

  it('charges full price when no discount', () => {
    const gameState = {
      player: { credits: 1000, daysElapsed: 50, currentSystem: 0 },
      world: {
        priceKnowledge: {},
        activeEvents: [],
        marketConditions: {},
      },
    };
    const starData = [
      { id: 5, name: 'Test System', x: 1, y: 0, z: 0, type: 'G', st: 1 },
    ];

    const result = InformationBroker.purchaseIntelligence(
      gameState,
      5,
      starData
    );

    expect(result.success).toBe(true);

    const creditsSpent = 1000 - gameState.player.credits;
    expect(creditsSpent).toBe(INTELLIGENCE_CONFIG.PRICES.NEVER_VISITED);
  });
});
