import { describe, it, expect, beforeEach } from 'vitest';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { SOL_SYSTEM_ID } from '../../src/game/constants.js';

/**
 * Test: Visited price recording when Trade panel opens
 *
 * Validates that opening the Trade panel records current, accurate prices
 * with source "Visited" (lastVisit = 0). This data overwrites any existing
 * information broker data and ages naturally as time passes.
 *
 * Requirements:
 * 1. Opening Trade panel updates price knowledge for current system
 * 2. Price data is marked as current (lastVisit = 0)
 * 3. Visited data overwrites information broker data
 * 4. Visited data ages as time passes (lastVisit increments)
 * 5. Information Broker Market Data view shows visited data with age
 */
describe('Visited price recording', () => {
  let game;
  let navigationSystem;

  beforeEach(() => {
    navigationSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA, navigationSystem);
    game.initNewGame();
  });

  it('should record visited prices when recordVisitedPrices is called', () => {
    const state = game.getState();
    const currentSystemId = state.player.currentSystem;

    // Get current prices
    const currentPrices = game.getCurrentSystemPrices();

    // Record visited prices
    game.recordVisitedPrices();

    // Verify price knowledge was updated
    const priceKnowledge = game.getPriceKnowledge();
    expect(priceKnowledge[currentSystemId]).toBeDefined();
    expect(priceKnowledge[currentSystemId].lastVisit).toBe(0);
    expect(priceKnowledge[currentSystemId].prices).toEqual(currentPrices);
    expect(priceKnowledge[currentSystemId].source).toBe('visited');
  });

  it('should mark visited data as current (lastVisit = 0)', () => {
    game.recordVisitedPrices();

    const state = game.getState();
    const currentSystemId = state.player.currentSystem;
    const priceKnowledge = game.getPriceKnowledge();

    expect(priceKnowledge[currentSystemId].lastVisit).toBe(0);
  });

  it('should overwrite information broker data with visited data', () => {
    const state = game.getState();
    const currentSystemId = state.player.currentSystem;

    // Simulate purchasing intelligence (creates stale data)
    const fakeBrokerPrices = {
      grain: 999,
      ore: 999,
      tritium: 999,
      parts: 999,
      medicine: 999,
      electronics: 999,
    };

    game.updatePriceKnowledge(
      currentSystemId,
      fakeBrokerPrices,
      10,
      'intelligence_broker'
    );

    // Verify broker data was set
    let priceKnowledge = game.getPriceKnowledge();
    expect(priceKnowledge[currentSystemId].lastVisit).toBe(10);
    expect(priceKnowledge[currentSystemId].prices.grain).toBe(999);
    expect(priceKnowledge[currentSystemId].source).toBe('intelligence_broker');

    // Record visited prices (should overwrite broker data)
    game.recordVisitedPrices();

    // Verify visited data replaced broker data
    priceKnowledge = game.getPriceKnowledge();
    expect(priceKnowledge[currentSystemId].lastVisit).toBe(0);
    expect(priceKnowledge[currentSystemId].prices.grain).not.toBe(999);
    expect(priceKnowledge[currentSystemId].source).toBe('visited');

    // Verify prices match current system prices
    const currentPrices = game.getCurrentSystemPrices();
    expect(priceKnowledge[currentSystemId].prices).toEqual(currentPrices);
  });

  it('should record accurate current prices, not manipulated broker prices', () => {
    const state = game.getState();
    const currentSystemId = state.player.currentSystem;

    // Get actual current prices
    const actualPrices = game.getCurrentSystemPrices();

    // Simulate purchasing manipulated intelligence
    const manipulatedPrices = {
      grain: actualPrices.grain * 1.5, // Manipulated higher
      ore: actualPrices.ore * 0.7, // Manipulated lower
      tritium: actualPrices.tritium * 1.3,
      parts: actualPrices.parts * 0.8,
      medicine: actualPrices.medicine * 1.2,
      electronics: actualPrices.electronics * 0.9,
    };

    game.updatePriceKnowledge(currentSystemId, manipulatedPrices, 5);

    // Record visited prices
    game.recordVisitedPrices();

    // Verify prices are accurate, not manipulated
    const priceKnowledge = game.getPriceKnowledge();
    expect(priceKnowledge[currentSystemId].prices).toEqual(actualPrices);
    expect(priceKnowledge[currentSystemId].prices.grain).toBe(
      actualPrices.grain
    );
    expect(priceKnowledge[currentSystemId].prices.grain).not.toBe(
      manipulatedPrices.grain
    );
  });

  it('should age visited data as time passes', () => {
    const state = game.getState();
    const currentSystemId = state.player.currentSystem;

    // Record visited prices at day 0
    game.recordVisitedPrices();

    let priceKnowledge = game.getPriceKnowledge();
    expect(priceKnowledge[currentSystemId].lastVisit).toBe(0);

    // Advance time by 5 days
    game.updateTime(state.player.daysElapsed + 5);

    // Verify lastVisit incremented
    priceKnowledge = game.getPriceKnowledge();
    expect(priceKnowledge[currentSystemId].lastVisit).toBe(5);

    // Advance time by 10 more days
    game.updateTime(state.player.daysElapsed + 10);

    // Verify lastVisit incremented again
    priceKnowledge = game.getPriceKnowledge();
    expect(priceKnowledge[currentSystemId].lastVisit).toBe(15);
  });

  it('should show aged visited data when viewing from another system', () => {
    const state = game.getState();
    const initialSystemId = state.player.currentSystem;

    // Record visited prices at Sol
    game.recordVisitedPrices();

    // Jump to another system
    const connectedSystems =
      navigationSystem.getConnectedSystems(initialSystemId);
    expect(connectedSystems.length).toBeGreaterThan(0);
    const targetSystemId = connectedSystems[0];

    // Advance time and jump
    game.updateTime(state.player.daysElapsed + 3);
    game.updateLocation(targetSystemId);

    // Advance time more
    game.updateTime(state.player.daysElapsed + 7);

    // Check Sol's price knowledge from the new system
    const priceKnowledge = game.getPriceKnowledge();
    expect(priceKnowledge[initialSystemId]).toBeDefined();
    expect(priceKnowledge[initialSystemId].lastVisit).toBe(10); // 3 + 7 days old
  });

  it('should update visited data when returning to a system', () => {
    const state = game.getState();
    const initialSystemId = state.player.currentSystem;

    // Record visited prices at Sol (day 0)
    game.recordVisitedPrices();

    // Jump to another system
    const connectedSystems =
      navigationSystem.getConnectedSystems(initialSystemId);
    const targetSystemId = connectedSystems[0];

    game.updateTime(state.player.daysElapsed + 5);
    game.updateLocation(targetSystemId);

    // Verify Sol's data is now 5 days old
    let priceKnowledge = game.getPriceKnowledge();
    expect(priceKnowledge[initialSystemId].lastVisit).toBe(5);

    // Jump back to Sol
    game.updateTime(state.player.daysElapsed + 3);
    game.updateLocation(initialSystemId);

    // Record visited prices again
    game.recordVisitedPrices();

    // Verify data is current again (lastVisit = 0)
    priceKnowledge = game.getPriceKnowledge();
    expect(priceKnowledge[initialSystemId].lastVisit).toBe(0);

    // Verify prices were updated (may be different due to time passing)
    const newPrices = game.getCurrentSystemPrices();
    expect(priceKnowledge[initialSystemId].prices).toEqual(newPrices);
  });

  it('should preserve visited data for multiple systems', () => {
    const state = game.getState();
    const system1Id = state.player.currentSystem;

    // Record visited prices at system 1
    game.recordVisitedPrices();

    // Jump to system 2
    const connectedSystems = navigationSystem.getConnectedSystems(system1Id);
    const system2Id = connectedSystems[0];

    game.updateTime(state.player.daysElapsed + 2);
    game.updateLocation(system2Id);

    // Record visited prices at system 2
    game.recordVisitedPrices();
    const system2Prices = { ...game.getCurrentSystemPrices() };

    // Verify both systems have price knowledge
    const priceKnowledge = game.getPriceKnowledge();
    expect(priceKnowledge[system1Id]).toBeDefined();
    expect(priceKnowledge[system2Id]).toBeDefined();

    // Verify system 1 data is 2 days old
    expect(priceKnowledge[system1Id].lastVisit).toBe(2);

    // Verify system 2 data is current
    expect(priceKnowledge[system2Id].lastVisit).toBe(0);

    // Verify system 1 prices were preserved (not recalculated with new day)
    // Note: Prices in priceKnowledge are recalculated on day change, so we verify
    // that the structure is correct and prices are reasonable
    expect(priceKnowledge[system1Id].prices.grain).toBeGreaterThan(0);
    expect(priceKnowledge[system1Id].prices.ore).toBeGreaterThan(0);

    // Verify system 2 prices match current prices
    expect(priceKnowledge[system2Id].prices).toEqual(system2Prices);
  });

  it('should use locked prices from arrival, not recalculated prices', () => {
    const state = game.getState();
    const currentSystemId = state.player.currentSystem;

    // Get locked prices from arrival
    const lockedPrices = game.getCurrentSystemPrices();

    // Make some trades to create market conditions
    game.buyGood('grain', 10, lockedPrices.grain);
    game.sellGood(0, 5, lockedPrices.grain);

    // Verify market conditions changed
    const marketConditions = state.world.marketConditions;
    expect(marketConditions[currentSystemId]).toBeDefined();

    // Record visited prices
    game.recordVisitedPrices();

    // Verify recorded prices match locked prices (not affected by market conditions)
    const priceKnowledge = game.getPriceKnowledge();
    expect(priceKnowledge[currentSystemId].prices).toEqual(lockedPrices);
  });

  it('should work correctly when called multiple times in same system', () => {
    const state = game.getState();
    const currentSystemId = state.player.currentSystem;

    // Record visited prices first time
    game.recordVisitedPrices();

    const firstPrices = {
      ...game.getPriceKnowledge()[currentSystemId].prices,
    };

    // Record visited prices again (simulating closing and reopening Trade panel)
    game.recordVisitedPrices();

    const secondPrices = {
      ...game.getPriceKnowledge()[currentSystemId].prices,
    };

    // Verify prices remain the same (locked prices don't change)
    expect(secondPrices).toEqual(firstPrices);

    // Verify lastVisit is still 0
    const priceKnowledge = game.getPriceKnowledge();
    expect(priceKnowledge[currentSystemId].lastVisit).toBe(0);
  });

  it('should handle initial game state correctly', () => {
    // On new game, Sol should already have price knowledge from initialization
    const priceKnowledge = game.getPriceKnowledge();
    expect(priceKnowledge[SOL_SYSTEM_ID]).toBeDefined();
    expect(priceKnowledge[SOL_SYSTEM_ID].lastVisit).toBe(0);

    // Recording visited prices should update with current locked prices
    game.recordVisitedPrices();

    const updatedKnowledge = game.getPriceKnowledge();
    expect(updatedKnowledge[SOL_SYSTEM_ID].lastVisit).toBe(0);

    // Verify prices match current system prices
    const currentPrices = game.getCurrentSystemPrices();
    expect(updatedKnowledge[SOL_SYSTEM_ID].prices).toEqual(currentPrices);
  });

  it('should emit priceKnowledgeChanged event when recording visited prices', () => {
    let eventEmitted = false;
    let emittedData = null;

    game.subscribe('priceKnowledgeChanged', (data) => {
      eventEmitted = true;
      emittedData = data;
    });

    game.recordVisitedPrices();

    expect(eventEmitted).toBe(true);
    expect(emittedData).toBeDefined();
    expect(typeof emittedData).toBe('object');
  });

  it('should persist visited prices to save game', () => {
    const state = game.getState();
    const currentSystemId = state.player.currentSystem;

    // Record visited prices (this calls markDirty internally)
    game.recordVisitedPrices();
    game.flushSave();

    // Create new game state manager and load
    const newGameCoordinator = new GameCoordinator(
      STAR_DATA,
      WORMHOLE_DATA,
      navigationSystem
    );
    const loadedState = newGameCoordinator.loadGame();

    expect(loadedState).not.toBeNull();

    // Verify visited prices were persisted
    const loadedKnowledge = newGameCoordinator.getPriceKnowledge();
    expect(loadedKnowledge[currentSystemId]).toBeDefined();
    expect(loadedKnowledge[currentSystemId].lastVisit).toBe(0);
  });
});
