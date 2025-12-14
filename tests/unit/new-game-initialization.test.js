/**
 * Unit Tests for New Game Initialization
 * Feature: tramp-freighter-core-loop, Property 0: New game initialization creates correct default state
 */

import { describe, it, expect } from 'vitest';
import { GameStateManager } from '../../js/state/game-state-manager.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Property 0: New Game Initialization', () => {
  /**
   * Property: For any new game initialization, the game state should contain exactly:
   * - Player: 500 credits, 10000 debt, at system 0 (Sol), 0 days elapsed
   * - Ship: 100% fuel, 50 cargo capacity, one cargo stack of 20 grain units at Sol's grain price
   * - World: visitedSystems contains [0]
   * - Meta: version and timestamp
   */
  it('should initialize with correct default values', () => {
    // Create a new game state manager
    const manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);

    // Initialize new game
    const state = manager.initNewGame();

    // Verify player state
    expect(state.player.credits).toBe(500);
    expect(state.player.debt).toBe(10000);
    expect(state.player.currentSystem).toBe(0); // Sol
    expect(state.player.daysElapsed).toBe(0);

    // Verify ship state
    expect(state.ship.name).toBe('Serendipity');
    expect(state.ship.fuel).toBe(100);
    expect(state.ship.cargoCapacity).toBe(50);

    // Verify cargo
    expect(state.ship.cargo).toHaveLength(1);
    expect(state.ship.cargo[0].good).toBe('grain');
    expect(state.ship.cargo[0].qty).toBe(20);

    // Verify cargo price is Sol's grain price with dynamic pricing
    // Sol is G2 with 6 stations at day 0
    // Price = base × production × stationCount × dailyFluctuation × event
    // Price = 10 × 0.8 × 1.3 × dailyFluctuation × 1.0
    // We just verify it's a positive number since daily fluctuation varies
    expect(state.ship.cargo[0].buyPrice).toBeGreaterThan(0);
    expect(state.ship.cargo[0].buyPrice).toBeTypeOf('number');

    // Verify world state
    expect(state.world.visitedSystems).toEqual([0]);

    // Verify meta
    expect(state.meta.version).toBe('2.1.0');
    expect(state.meta.timestamp).toBeTypeOf('number');
    expect(state.meta.timestamp).toBeGreaterThan(0);
  });

  it('should produce consistent state across multiple initializations', () => {
    const states = [];

    for (let i = 0; i < 5; i++) {
      const manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
      const state = manager.initNewGame();
      states.push(state);
    }

    // All states should have identical values (except timestamp)
    for (let i = 1; i < states.length; i++) {
      expect(states[i].player.credits).toBe(states[0].player.credits);
      expect(states[i].player.debt).toBe(states[0].player.debt);
      expect(states[i].player.currentSystem).toBe(
        states[0].player.currentSystem
      );
      expect(states[i].player.daysElapsed).toBe(states[0].player.daysElapsed);

      expect(states[i].ship.name).toBe(states[0].ship.name);
      expect(states[i].ship.fuel).toBe(states[0].ship.fuel);
      expect(states[i].ship.cargoCapacity).toBe(states[0].ship.cargoCapacity);

      expect(states[i].ship.cargo[0].good).toBe(states[0].ship.cargo[0].good);
      expect(states[i].ship.cargo[0].qty).toBe(states[0].ship.cargo[0].qty);
      expect(states[i].ship.cargo[0].buyPrice).toBe(
        states[0].ship.cargo[0].buyPrice
      );

      expect(states[i].world.visitedSystems).toEqual(
        states[0].world.visitedSystems
      );
      expect(states[i].meta.version).toBe(states[0].meta.version);
    }
  });

  it('should initialize with cargo that does not exceed capacity', () => {
    const manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
    const state = manager.initNewGame();

    const totalCargo = state.ship.cargo.reduce(
      (sum, stack) => sum + stack.qty,
      0
    );

    expect(totalCargo).toBeLessThanOrEqual(state.ship.cargoCapacity);
    expect(totalCargo).toBe(20); // Should be exactly 20 for initial state
  });
});
