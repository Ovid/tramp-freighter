import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InformationBroker } from '@game/game-information-broker.js';
import { createTestGame } from '../test-utils.js';
import { INTELLIGENCE_CONFIG } from '@game/constants.js';

describe('Intelligence NPC discount', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    expect(result.cost).toBe(discountedCost);
  });

  // The pure function only quotes the cost; the manager does the debit, so
  // the discount has to be checked against the real balance.
  it('debits the discounted cost from the player balance', () => {
    const game = createTestGame();
    game.getState().player.credits = 10000;
    const discount = 0.15;
    const expectedDebit = Math.ceil(
      game.getIntelligenceCost(1) * (1 - discount)
    );

    const result = game.purchaseIntelligence(1, discount);

    expect(result.success).toBe(true);
    expect(10000 - game.getState().player.credits).toBe(expectedDebit);
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

    expect(result.cost).toBe(INTELLIGENCE_CONFIG.PRICES.NEVER_VISITED);
  });
});
