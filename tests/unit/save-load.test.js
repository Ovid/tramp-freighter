/**
 * Unit Tests for Save/Load System
 * Feature: tramp-freighter-core-loop
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';

describe('Save/Load System', () => {
  let manager;

  beforeEach(() => {
    localStorage.clear();
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Unit test: Multiple cargo stacks with different prices should be preserved separately
   */
  it('should preserve multiple cargo stacks with different prices', () => {
    // Create state with multiple stacks of the same good at different prices
    const multiStackState = {
      player: { credits: 1000, debt: 5000, currentSystem: 0, daysElapsed: 10 },
      ship: {
        name: 'Serendipity',
        fuel: 50,
        cargoCapacity: 100,
        cargo: [
          { good: 'grain', qty: 10, purchasePrice: 10 },
          { good: 'grain', qty: 10, purchasePrice: 11 },
          { good: 'grain', qty: 10, purchasePrice: 12 },
        ],
      },
      world: { visitedSystems: [0, 1] },
      meta: { version: '1.0.0', timestamp: Date.now() },
    };

    manager.state = multiStackState;
    manager.saveGame();

    const savedData = JSON.parse(localStorage.getItem('trampFreighterSave'));

    // Verify all stacks are preserved
    expect(savedData.ship.cargo).toHaveLength(3);

    // Verify each stack exists with correct price (order-independent)
    for (const originalStack of multiStackState.ship.cargo) {
      const matchingStack = savedData.ship.cargo.find(
        (s) =>
          s.good === originalStack.good &&
          s.qty === originalStack.qty &&
          s.purchasePrice === originalStack.purchasePrice
      );
      expect(matchingStack).toBeDefined();
    }
  });

  /**
   * Unit test: Edge case values (empty state) should be preserved
   */
  it('should handle edge case values (empty state)', () => {
    const edgeCaseState = {
      player: { credits: 0, debt: 0, currentSystem: 0, daysElapsed: 0 },
      ship: { name: 'Serendipity', fuel: 0, cargoCapacity: 50, cargo: [] },
      world: { visitedSystems: [0] },
      meta: { version: '1.0.0', timestamp: Date.now() },
    };

    manager.state = edgeCaseState;
    const saveResult = manager.saveGame();
    expect(saveResult).toBe(true);

    const savedData = JSON.parse(localStorage.getItem('trampFreighterSave'));

    expect(savedData.player.credits).toBe(0);
    expect(savedData.player.debt).toBe(0);
    expect(savedData.player.daysElapsed).toBe(0);
    expect(savedData.ship.fuel).toBe(0);
    expect(savedData.ship.cargo).toEqual([]);
    expect(savedData.world.visitedSystems).toEqual([0]);
  });

  /**
   * Unit test: Maximum values should be preserved
   */
  it('should handle maximum values', () => {
    const maxValueState = {
      player: {
        credits: 999999,
        debt: 999999,
        currentSystem: 13,
        daysElapsed: 9999,
      },
      ship: {
        name: 'Serendipity',
        fuel: 100,
        cargoCapacity: 200,
        cargo: Array.from({ length: 20 }, () => ({
          good: 'grain',
          qty: 50,
          purchasePrice: 100,
        })),
      },
      world: { visitedSystems: [0, 1, 4, 5, 7, 13] },
      meta: { version: '1.0.0', timestamp: Date.now() },
    };

    manager.state = maxValueState;
    const saveResult = manager.saveGame();
    expect(saveResult).toBe(true);

    const savedData = JSON.parse(localStorage.getItem('trampFreighterSave'));

    expect(savedData.player.credits).toBe(999999);
    expect(savedData.player.debt).toBe(999999);
    expect(savedData.player.daysElapsed).toBe(9999);
    expect(savedData.ship.fuel).toBe(100);
    expect(savedData.ship.cargo).toHaveLength(20);
    expect(savedData.world.visitedSystems).toEqual([0, 1, 4, 5, 7, 13]);
  });
});
