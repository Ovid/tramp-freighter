/**
 * Unit Tests for Save/Load Migration System
 * Feature: dynamic-economy, Task 17.1
 *
 * Tests migration from v1.0.0 to v2.0.0 save format
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameStateManager } from '../../js/game-state.js';
import { TEST_STAR_DATA, TEST_WORMHOLE_DATA } from '../test-data.js';
import { SHIP_CONDITION_BOUNDS } from '../../js/game-constants.js';

describe('Save/Load Migration System', () => {
  let manager;

  beforeEach(() => {
    localStorage.clear();
    manager = new GameStateManager(TEST_STAR_DATA, TEST_WORMHOLE_DATA);
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * Test: v1.0.0 save loads and migrates correctly
   *
   * Verifies that a v1.0.0 save file is successfully migrated to v2.0.0 format
   * with all Phase 2 fields added with appropriate defaults.
   */
  it('should migrate v1.0.0 save to v2.0.0 with Phase 2 defaults', () => {
    // Create a v1.0.0 save state (without Phase 2 fields)
    const v1State = {
      player: {
        credits: 1000,
        debt: 5000,
        currentSystem: 0,
        daysElapsed: 10,
      },
      ship: {
        name: 'Serendipity',
        fuel: 75,
        cargoCapacity: 50,
        cargo: [
          { good: 'grain', qty: 10, purchasePrice: 10 }, // Old field name
          { good: 'ore', qty: 5, purchasePrice: 20 }, // Old field name
        ],
      },
      world: {
        visitedSystems: [0, 1, 4],
      },
      meta: {
        version: '1.0.0',
        timestamp: Date.now(),
      },
    };

    // Save v1.0.0 state to localStorage
    localStorage.setItem('trampFreighterSave', JSON.stringify(v1State));

    // Load the save (should trigger migration)
    const loadedState = manager.loadGame();

    // Verify migration succeeded
    expect(loadedState).not.toBeNull();
    expect(loadedState.meta.version).toBe('2.1.0');

    // Verify ship condition fields were added with max values
    expect(loadedState.ship.hull).toBe(SHIP_CONDITION_BOUNDS.MAX);
    expect(loadedState.ship.engine).toBe(SHIP_CONDITION_BOUNDS.MAX);
    expect(loadedState.ship.lifeSupport).toBe(SHIP_CONDITION_BOUNDS.MAX);

    // Verify cargo purchase metadata was added (migrated to new field names)
    expect(loadedState.ship.cargo).toHaveLength(2);
    loadedState.ship.cargo.forEach((stack) => {
      expect(stack.buySystem).toBeDefined();
      expect(typeof stack.buySystem).toBe('number');
      expect(stack.buySystemName).toBeDefined();
      expect(typeof stack.buySystemName).toBe('string');
      expect(stack.buyDate).toBeDefined();
      expect(typeof stack.buyDate).toBe('number');
    });

    // Verify price knowledge was initialized
    expect(loadedState.world.priceKnowledge).toBeDefined();
    expect(typeof loadedState.world.priceKnowledge).toBe('object');

    // Verify active events array was added
    expect(loadedState.world.activeEvents).toBeDefined();
    expect(Array.isArray(loadedState.world.activeEvents)).toBe(true);

    // Verify original v1.0.0 data was preserved
    expect(loadedState.player.credits).toBe(1000);
    expect(loadedState.player.debt).toBe(5000);
    expect(loadedState.player.currentSystem).toBe(0);
    expect(loadedState.player.daysElapsed).toBe(10);
    expect(loadedState.ship.name).toBe('Serendipity');
    expect(loadedState.ship.fuel).toBe(75);
    expect(loadedState.ship.cargoCapacity).toBe(50);
    expect(loadedState.world.visitedSystems).toEqual([0, 1, 4]);
  });

  /**
   * Test: v2.0.0 save loads without migration
   *
   * Verifies that a v2.0.0 save file loads directly without triggering
   * migration logic.
   */
  it('should load v2.0.0 save without migration', () => {
    // Create a complete v2.0.0 save state
    const v2State = {
      player: {
        credits: 2000,
        debt: 8000,
        currentSystem: 1,
        daysElapsed: 25,
      },
      ship: {
        name: 'Serendipity',
        fuel: 60,
        hull: 85,
        engine: 90,
        lifeSupport: 95,
        cargoCapacity: 50,
        cargo: [
          {
            good: 'grain',
            qty: 15,
            purchasePrice: 12, // Old field name
            purchaseSystem: 0, // Old field name
            purchaseDay: 20, // Old field name
          },
        ],
      },
      world: {
        visitedSystems: [0, 1, 4, 5],
        priceKnowledge: {
          0: {
            lastVisit: 5,
            prices: {
              grain: 10,
              ore: 25,
              tritium: 50,
              parts: 30,
              medicine: 40,
              electronics: 35,
            },
          },
        },
        activeEvents: [
          {
            id: 'test_event_1',
            type: 'mining_strike',
            systemId: 4,
            startDay: 20,
            endDay: 25,
            modifiers: { ore: 1.5, tritium: 1.3 },
          },
        ],
      },
      meta: {
        version: '2.0.0',
        timestamp: Date.now(),
      },
    };

    // Save v2.0.0 state to localStorage
    localStorage.setItem('trampFreighterSave', JSON.stringify(v2State));

    // Load the save (should NOT trigger migration)
    const loadedState = manager.loadGame();

    // Verify load succeeded
    expect(loadedState).not.toBeNull();
    expect(loadedState.meta.version).toBe('2.1.0');

    // Verify all Phase 2 fields are preserved exactly
    expect(loadedState.ship.hull).toBe(85);
    expect(loadedState.ship.engine).toBe(90);
    expect(loadedState.ship.lifeSupport).toBe(95);

    expect(loadedState.ship.cargo[0].buySystem).toBe(0);
    expect(loadedState.ship.cargo[0].buyDate).toBe(20);

    expect(loadedState.world.priceKnowledge[0]).toBeDefined();
    expect(loadedState.world.priceKnowledge[0].lastVisit).toBe(5);

    expect(loadedState.world.activeEvents).toHaveLength(1);
    expect(loadedState.world.activeEvents[0].id).toBe('test_event_1');

    // Verify original data preserved
    expect(loadedState.player.credits).toBe(2000);
    expect(loadedState.player.debt).toBe(8000);
  });

  /**
   * Test: Missing Phase 2 data gets defaults
   *
   * Verifies that if a v2.0.0 save is missing some Phase 2 fields
   * (edge case), the migration logic adds appropriate defaults.
   */
  it('should add defaults for missing Phase 2 data in v2.0.0 save', () => {
    // Create a v2.0.0 save with some missing Phase 2 fields
    const partialV2State = {
      player: {
        credits: 1500,
        debt: 6000,
        currentSystem: 0,
        daysElapsed: 15,
      },
      ship: {
        name: 'Serendipity',
        fuel: 80,
        hull: 70, // Has hull
        // Missing engine and lifeSupport
        cargoCapacity: 50,
        cargo: [
          {
            good: 'grain',
            qty: 10,
            purchasePrice: 10, // Old field name
            purchaseSystem: 0, // Old field name
            // Missing purchaseDay (old field name)
          },
        ],
      },
      world: {
        visitedSystems: [0, 1],
        // Missing priceKnowledge
        activeEvents: [], // Has activeEvents
      },
      meta: {
        version: '2.0.0',
        timestamp: Date.now(),
      },
    };

    // Save partial v2.0.0 state to localStorage
    localStorage.setItem('trampFreighterSave', JSON.stringify(partialV2State));

    // Load the save
    const loadedState = manager.loadGame();

    // Verify load succeeded
    expect(loadedState).not.toBeNull();

    // Verify missing ship condition fields get defaults
    expect(loadedState.ship.hull).toBe(70); // Preserved
    expect(loadedState.ship.engine).toBe(SHIP_CONDITION_BOUNDS.MAX); // Default
    expect(loadedState.ship.lifeSupport).toBe(SHIP_CONDITION_BOUNDS.MAX); // Default

    // Verify missing cargo metadata gets defaults
    expect(loadedState.ship.cargo[0].buySystem).toBe(0); // Preserved
    expect(loadedState.ship.cargo[0].buyDate).toBe(0); // Default

    // Verify missing price knowledge gets initialized
    expect(loadedState.world.priceKnowledge).toBeDefined();
    expect(typeof loadedState.world.priceKnowledge).toBe('object');

    // Verify activeEvents preserved
    expect(Array.isArray(loadedState.world.activeEvents)).toBe(true);
  });

  /**
   * Test: Corrupted Phase 2 data handled gracefully
   *
   * Verifies that if Phase 2 data is corrupted (wrong types), the save
   * is rejected and returns null rather than crashing.
   */
  it('should reject save with corrupted Phase 2 data', () => {
    // Create a save with corrupted Phase 2 fields
    const corruptedState = {
      player: {
        credits: 1000,
        debt: 5000,
        currentSystem: 0,
        daysElapsed: 10,
      },
      ship: {
        name: 'Serendipity',
        fuel: 75,
        hull: 'invalid', // Should be number
        engine: 90,
        lifeSupport: 95,
        cargoCapacity: 50,
        cargo: [
          {
            good: 'grain',
            qty: 10,
            purchasePrice: 10, // Old field name
            purchaseSystem: 0, // Old field name
            purchaseDay: 5, // Old field name
          },
        ],
      },
      world: {
        visitedSystems: [0, 1],
        priceKnowledge: {
          0: {
            lastVisit: 5,
            prices: {
              grain: 10,
            },
          },
        },
        activeEvents: [],
      },
      meta: {
        version: '2.0.0',
        timestamp: Date.now(),
      },
    };

    // Save corrupted state to localStorage
    localStorage.setItem('trampFreighterSave', JSON.stringify(corruptedState));

    // Attempt to load (should fail validation)
    const loadedState = manager.loadGame();

    // Verify load failed gracefully
    expect(loadedState).toBeNull();
  });

  /**
   * Test: Corrupted cargo metadata handled gracefully
   *
   * Verifies that corrupted cargo purchase metadata is detected and rejected.
   */
  it('should reject save with corrupted cargo metadata', () => {
    const corruptedCargoState = {
      player: {
        credits: 1000,
        debt: 5000,
        currentSystem: 0,
        daysElapsed: 10,
      },
      ship: {
        name: 'Serendipity',
        fuel: 75,
        hull: 100,
        engine: 100,
        lifeSupport: 100,
        cargoCapacity: 50,
        cargo: [
          {
            good: 'grain',
            qty: 10,
            purchasePrice: 10, // Old field name
            purchaseSystem: 'invalid', // Should be number (old field name)
            purchaseDay: 5, // Old field name
          },
        ],
      },
      world: {
        visitedSystems: [0, 1],
        priceKnowledge: {},
        activeEvents: [],
      },
      meta: {
        version: '2.0.0',
        timestamp: Date.now(),
      },
    };

    localStorage.setItem(
      'trampFreighterSave',
      JSON.stringify(corruptedCargoState)
    );

    const loadedState = manager.loadGame();

    expect(loadedState).toBeNull();
  });

  /**
   * Test: Corrupted price knowledge handled gracefully
   *
   * Verifies that corrupted price knowledge structure is detected and rejected.
   */
  it('should reject save with corrupted price knowledge', () => {
    const corruptedPriceKnowledgeState = {
      player: {
        credits: 1000,
        debt: 5000,
        currentSystem: 0,
        daysElapsed: 10,
      },
      ship: {
        name: 'Serendipity',
        fuel: 75,
        hull: 100,
        engine: 100,
        lifeSupport: 100,
        cargoCapacity: 50,
        cargo: [],
      },
      world: {
        visitedSystems: [0, 1],
        priceKnowledge: {
          0: {
            lastVisit: 'invalid', // Should be number
            prices: {
              grain: 10,
            },
          },
        },
        activeEvents: [],
      },
      meta: {
        version: '2.0.0',
        timestamp: Date.now(),
      },
    };

    localStorage.setItem(
      'trampFreighterSave',
      JSON.stringify(corruptedPriceKnowledgeState)
    );

    const loadedState = manager.loadGame();

    expect(loadedState).toBeNull();
  });

  /**
   * Test: Corrupted active events handled gracefully
   *
   * Verifies that corrupted active events structure is detected and rejected.
   */
  it('should reject save with corrupted active events', () => {
    const corruptedEventsState = {
      player: {
        credits: 1000,
        debt: 5000,
        currentSystem: 0,
        daysElapsed: 10,
      },
      ship: {
        name: 'Serendipity',
        fuel: 75,
        hull: 100,
        engine: 100,
        lifeSupport: 100,
        cargoCapacity: 50,
        cargo: [],
      },
      world: {
        visitedSystems: [0, 1],
        priceKnowledge: {},
        activeEvents: 'invalid', // Should be array
      },
      meta: {
        version: '2.0.0',
        timestamp: Date.now(),
      },
    };

    localStorage.setItem(
      'trampFreighterSave',
      JSON.stringify(corruptedEventsState)
    );

    const loadedState = manager.loadGame();

    expect(loadedState).toBeNull();
  });

  /**
   * Test: Empty cargo array migrates correctly
   *
   * Verifies that v1.0.0 saves with empty cargo arrays migrate without issues.
   */
  it('should migrate v1.0.0 save with empty cargo', () => {
    const v1StateEmptyCargo = {
      player: {
        credits: 500,
        debt: 10000,
        currentSystem: 0,
        daysElapsed: 0,
      },
      ship: {
        name: 'Serendipity',
        fuel: 100,
        cargoCapacity: 50,
        cargo: [], // Empty cargo
      },
      world: {
        visitedSystems: [0],
      },
      meta: {
        version: '1.0.0',
        timestamp: Date.now(),
      },
    };

    localStorage.setItem(
      'trampFreighterSave',
      JSON.stringify(v1StateEmptyCargo)
    );

    const loadedState = manager.loadGame();

    expect(loadedState).not.toBeNull();
    expect(loadedState.meta.version).toBe('2.1.0');
    expect(loadedState.ship.cargo).toEqual([]);
    expect(loadedState.ship.hull).toBe(SHIP_CONDITION_BOUNDS.MAX);
    expect(loadedState.world.priceKnowledge).toBeDefined();
    expect(loadedState.world.activeEvents).toEqual([]);
  });

  /**
   * Test: Migration preserves cargo stack order
   *
   * Verifies that cargo stack order is preserved during migration.
   */
  it('should preserve cargo stack order during migration', () => {
    const v1StateMultiCargo = {
      player: {
        credits: 1000,
        debt: 5000,
        currentSystem: 0,
        daysElapsed: 10,
      },
      ship: {
        name: 'Serendipity',
        fuel: 75,
        cargoCapacity: 50,
        cargo: [
          { good: 'grain', qty: 10, purchasePrice: 10 }, // Old field name
          { good: 'ore', qty: 5, purchasePrice: 20 }, // Old field name
          { good: 'tritium', qty: 3, purchasePrice: 50 }, // Old field name
        ],
      },
      world: {
        visitedSystems: [0, 1],
      },
      meta: {
        version: '1.0.0',
        timestamp: Date.now(),
      },
    };

    localStorage.setItem(
      'trampFreighterSave',
      JSON.stringify(v1StateMultiCargo)
    );

    const loadedState = manager.loadGame();

    expect(loadedState).not.toBeNull();
    expect(loadedState.ship.cargo).toHaveLength(3);
    expect(loadedState.ship.cargo[0].good).toBe('grain');
    expect(loadedState.ship.cargo[1].good).toBe('ore');
    expect(loadedState.ship.cargo[2].good).toBe('tritium');

    // Verify all stacks have metadata (migrated to new field names)
    loadedState.ship.cargo.forEach((stack) => {
      expect(stack.buySystem).toBeDefined();
      expect(stack.buyDate).toBeDefined();
    });
  });
});
