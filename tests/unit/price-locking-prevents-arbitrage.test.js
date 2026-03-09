import { describe, it, expect, beforeEach } from 'vitest';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

/**
 * Test: Price locking prevents intra-system arbitrage
 *
 * Validates that prices are locked when arriving at a system and don't change
 * until the player leaves. This prevents the exploit where buying goods raises
 * the price, allowing immediate profitable resale.
 *
 * Bug: Without price locking, players could buy all of a commodity (raising price),
 * then immediately sell it back for profit, repeating indefinitely.
 *
 * Fix: Prices are snapshotted when arriving at a system and stored in
 * state.world.currentSystemPrices. These locked prices are used for all trading
 * until the player jumps to a different system.
 */
describe('Price locking prevents intra-system arbitrage', () => {
  let game;

  beforeEach(() => {
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  it('should lock prices when arriving at a system', () => {
    const state = game.getState();

    // Get initial locked prices
    const initialPrices = game.getCurrentSystemPrices();
    const initialGrainPrice = initialPrices.grain;

    expect(initialGrainPrice).toBeGreaterThan(0);

    // Verify prices are locked in state
    expect(state.world.currentSystemPrices).toBeDefined();
    expect(state.world.currentSystemPrices.grain).toBe(initialGrainPrice);
  });

  it('should not change locked prices after buying goods', () => {
    // Get initial locked prices
    const initialPrices = game.getCurrentSystemPrices();
    const initialGrainPrice = initialPrices.grain;

    // Buy a small quantity of grain (should create deficit in market conditions)
    const buyQuantity = 10;
    game.buyGood('grain', buyQuantity, initialGrainPrice);

    // Verify market conditions were updated (deficit created)
    const state = game.getState();
    const marketConditions = state.world.marketConditions;
    const currentSystemId = state.player.currentSystem;
    expect(marketConditions[currentSystemId]).toBeDefined();
    expect(marketConditions[currentSystemId].grain).toBe(-buyQuantity);

    // Verify locked prices remain unchanged
    const pricesAfterBuy = game.getCurrentSystemPrices();
    expect(pricesAfterBuy.grain).toBe(initialGrainPrice);
  });

  it('should not change locked prices after selling goods', () => {
    const state = game.getState();

    // Get initial locked prices
    const initialPrices = game.getCurrentSystemPrices();
    const initialGrainPrice = initialPrices.grain;

    // Sell the starting grain cargo (should create surplus in market conditions)
    const cargoStack = state.ship.cargo.find((stack) => stack.good === 'grain');
    expect(cargoStack).toBeDefined();

    const sellQuantity = cargoStack.qty;
    game.sellGood(0, sellQuantity, initialGrainPrice);

    // Verify market conditions were updated (surplus created)
    const marketConditions = state.world.marketConditions;
    const currentSystemId = state.player.currentSystem;
    expect(marketConditions[currentSystemId]).toBeDefined();
    expect(marketConditions[currentSystemId].grain).toBe(sellQuantity);

    // Verify locked prices remain unchanged
    const pricesAfterSell = game.getCurrentSystemPrices();
    expect(pricesAfterSell.grain).toBe(initialGrainPrice);
  });

  it('should prevent buy-sell arbitrage exploit', () => {
    const state = game.getState();
    const initialCredits = state.player.credits;
    const initialDebt = state.player.debt;

    // Get locked prices
    const lockedPrices = game.getCurrentSystemPrices();
    const orePrice = lockedPrices.ore; // Use ore instead of grain to avoid consolidation

    // Buy 10 units of ore (affordable with starting credits)
    const buyQuantity = 10;
    game.buyGood('ore', buyQuantity, orePrice);

    const creditsAfterBuy = game.getState().player.credits;
    const expectedCostAfterBuy = initialCredits - buyQuantity * orePrice;
    expect(creditsAfterBuy).toBe(expectedCostAfterBuy);

    // Immediately sell the same ore back
    // With locked prices, this should result in break-even (minus any debt withholding)
    const cargoStackIndex = state.ship.cargo.findIndex(
      (stack) => stack.good === 'ore'
    );
    expect(cargoStackIndex).toBeGreaterThanOrEqual(0);

    const result = game.sellGood(
      cargoStackIndex,
      buyQuantity,
      orePrice
    );

    const creditsAfterSell = game.getState().player.credits;
    const debtAfterSell = game.getState().player.debt;
    const withheld = result.withheld || 0;

    // Credits + withheld should equal initial credits (no arbitrage profit)
    expect(creditsAfterSell + withheld).toBe(initialCredits);

    // Cole's cut is a pure penalty — debt unchanged
    expect(debtAfterSell).toBe(initialDebt);

    // Verify no profit was made from arbitrage
    const profit = creditsAfterSell - initialCredits;
    expect(profit).toBeLessThanOrEqual(0);
  });

  it('should update locked prices when jumping to a new system', () => {
    const state = game.getState();
    const initialSystemId = state.player.currentSystem;

    // Get initial locked prices
    const initialPrices = game.getCurrentSystemPrices();
    const initialGrainPrice = initialPrices.grain;

    // Create market conditions by buying grain
    game.buyGood('grain', 10, initialGrainPrice);

    // Find a connected system to jump to
    const connectedSystems = WORMHOLE_DATA.filter(
      (wh) => wh[0] === initialSystemId || wh[1] === initialSystemId
    );
    expect(connectedSystems.length).toBeGreaterThan(0);

    const targetSystemId =
      connectedSystems[0][0] === initialSystemId
        ? connectedSystems[0][1]
        : connectedSystems[0][0];

    // Jump to new system (this should update locked prices)
    game.updateLocation(targetSystemId);

    // Verify locked prices were updated for new system
    const newPrices = game.getCurrentSystemPrices();
    expect(newPrices).toBeDefined();

    // Prices should be different from initial system (different tech level, etc.)
    // We can't guarantee exact values, but we can verify the structure is correct
    expect(newPrices.grain).toBeGreaterThan(0);
    expect(typeof newPrices.grain).toBe('number');
  });

  it('should use locked prices for all commodities', () => {
    const lockedPrices = game.getCurrentSystemPrices();

    // Verify all commodity types have locked prices
    const commodityTypes = [
      'grain',
      'ore',
      'tritium',
      'parts',
      'medicine',
      'electronics',
    ];

    for (const commodity of commodityTypes) {
      expect(lockedPrices[commodity]).toBeDefined();
      expect(typeof lockedPrices[commodity]).toBe('number');
      expect(lockedPrices[commodity]).toBeGreaterThan(0);
    }
  });

  it('should initialize locked prices on new game', () => {
    const state = game.getState();

    // Verify currentSystemPrices exists in initial state
    expect(state.world.currentSystemPrices).toBeDefined();
    expect(typeof state.world.currentSystemPrices).toBe('object');

    // Verify it has prices for all commodities
    const commodityTypes = [
      'grain',
      'ore',
      'tritium',
      'parts',
      'medicine',
      'electronics',
    ];

    for (const commodity of commodityTypes) {
      expect(state.world.currentSystemPrices[commodity]).toBeDefined();
      expect(typeof state.world.currentSystemPrices[commodity]).toBe('number');
    }
  });

  it('should maintain locked prices across multiple transactions', () => {
    const initialPrices = game.getCurrentSystemPrices();
    const initialGrainPrice = initialPrices.grain;
    const initialOrePrice = initialPrices.ore;

    // Perform multiple buy/sell transactions
    game.buyGood('grain', 10, initialGrainPrice);
    game.buyGood('ore', 20, initialOrePrice);

    const state = game.getState();
    const grainStack = state.ship.cargo.find((stack) => stack.good === 'grain');
    const oreStack = state.ship.cargo.find((stack) => stack.good === 'ore');

    game.sellGood(
      state.ship.cargo.indexOf(grainStack),
      5,
      initialGrainPrice
    );
    game.sellGood(
      state.ship.cargo.indexOf(oreStack),
      10,
      initialOrePrice
    );

    // Verify prices remain locked after all transactions
    const finalPrices = game.getCurrentSystemPrices();
    expect(finalPrices.grain).toBe(initialGrainPrice);
    expect(finalPrices.ore).toBe(initialOrePrice);
  });
});
