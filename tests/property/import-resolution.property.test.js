/**
 * Property-Based Tests for Import Resolution
 * React Migration Spec, Property 35: Import resolution correctness
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Import all modules to verify they resolve correctly
import {
  SOL_SYSTEM_ID,
  COMMODITY_TYPES,
  BASE_PRICES,
  SHIP_CONFIG,
  ECONOMY_CONFIG,
  NAVIGATION_CONFIG,
  calculateDistanceFromSol,
} from '../../src/game/constants.js';

import {
  GameStateManager,
  sanitizeShipName,
} from '../../src/game/state/game-state-manager.js';
import {
  saveGame,
  loadGame,
  hasSavedGame,
  clearSave,
} from '../../src/game/state/save-load.js';
import {
  isVersionCompatible,
  validateStateStructure,
} from '../../src/game/state/state-validators.js';

import { TradingSystem } from '../../src/game/game-trading.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { EconomicEventsSystem } from '../../src/game/game-events.js';
import { InformationBroker } from '../../src/game/game-information-broker.js';

import { initScene } from '../../src/game/engine/scene.js';
import { AnimationTimingCalculator } from '../../src/game/engine/game-animation.js';

import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';

import { SeededRandom } from '../../src/game/utils/seeded-random.js';
import { capitalizeFirst } from '../../src/game/utils/string-utils.js';

describe('Property 35: Import resolution correctness', () => {
  /**
   * Property: For any module import from the new src/game directory structure,
   * the import should resolve to the correct file path and the module should
   * export the expected functions/classes.
   */
  it('should resolve game constants from src/game/constants.js', () => {
    // Verify exports exist and have correct types
    expect(SOL_SYSTEM_ID).toBe(0);
    expect(Array.isArray(COMMODITY_TYPES)).toBe(true);
    expect(COMMODITY_TYPES.length).toBeGreaterThan(0);
    expect(typeof BASE_PRICES).toBe('object');
    expect(typeof SHIP_CONFIG).toBe('object');
    expect(typeof ECONOMY_CONFIG).toBe('object');
    expect(typeof NAVIGATION_CONFIG).toBe('object');
    expect(typeof calculateDistanceFromSol).toBe('function');
  });

  it('should resolve state management from src/game/state/', () => {
    // Verify exports exist and have correct types
    expect(typeof GameStateManager).toBe('function');
    expect(typeof sanitizeShipName).toBe('function');
    expect(typeof saveGame).toBe('function');
    expect(typeof loadGame).toBe('function');
    expect(typeof hasSavedGame).toBe('function');
    expect(typeof clearSave).toBe('function');
    expect(typeof isVersionCompatible).toBe('function');
    expect(typeof validateStateStructure).toBe('function');
  });

  it('should resolve trading logic from src/game/game-trading.js', () => {
    // Verify exports exist and have correct types
    expect(typeof TradingSystem).toBe('function');
    expect(typeof TradingSystem.calculatePrice).toBe('function');
  });

  it('should resolve navigation logic from src/game/game-navigation.js', () => {
    // Verify exports exist and have correct types - NavigationSystem is a class
    expect(typeof NavigationSystem).toBe('function');
    // Instance methods exist on prototype
    expect(typeof NavigationSystem.prototype.calculateDistanceBetween).toBe(
      'function'
    );
    expect(typeof NavigationSystem.prototype.calculateFuelCost).toBe(
      'function'
    );
  });

  it('should resolve events system from src/game/game-events.js', () => {
    // Verify exports exist and have correct types
    expect(typeof EconomicEventsSystem).toBe('function');
  });

  it('should resolve information broker from src/game/game-information-broker.js', () => {
    // Verify exports exist and have correct types
    expect(typeof InformationBroker).toBe('function');
  });

  it('should resolve engine modules from src/game/engine/', () => {
    // Verify exports exist and have correct types
    expect(typeof initScene).toBe('function');
    expect(typeof AnimationTimingCalculator).toBe('function');
  });

  it('should resolve data modules from src/game/data/', () => {
    // Verify exports exist and have correct types
    expect(Array.isArray(STAR_DATA)).toBe(true);
    expect(STAR_DATA.length).toBeGreaterThan(0);
    expect(Array.isArray(WORMHOLE_DATA)).toBe(true);
    expect(WORMHOLE_DATA.length).toBeGreaterThan(0);
  });

  it('should resolve utility modules from src/game/utils/', () => {
    // Verify exports exist and have correct types
    expect(typeof SeededRandom).toBe('function');
    expect(typeof capitalizeFirst).toBe('function');
  });

  /**
   * Property: For any valid system object, calculateDistanceFromSol should work
   * correctly when imported from the new location
   */
  it('should correctly calculate distances using imported function', () => {
    fc.assert(
      fc.property(
        fc.record({
          x: fc.float({ min: -300, max: 300, noNaN: true }),
          y: fc.float({ min: -300, max: 300, noNaN: true }),
          z: fc.float({ min: -300, max: 300, noNaN: true }),
        }),
        (system) => {
          const distance = calculateDistanceFromSol(system);

          // Distance should be non-negative
          expect(distance).toBeGreaterThanOrEqual(0);

          // Distance should be reasonable (within Sol Sector bounds)
          expect(distance).toBeLessThan(50); // Max ~50 LY for test coordinates

          // Verify calculation matches expected formula
          const r = Math.hypot(system.x, system.y, system.z);
          const expectedDistance = r * NAVIGATION_CONFIG.LY_PER_UNIT;
          expect(distance).toBeCloseTo(expectedDistance, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: For any commodity type, BASE_PRICES should be accessible
   * from the new import location
   */
  it('should access commodity prices from new location', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        (commodity) => {
          // Commodity should be in COMMODITY_TYPES
          expect(COMMODITY_TYPES).toContain(commodity);

          // Price should exist and be positive
          expect(BASE_PRICES[commodity]).toBeGreaterThan(0);
          expect(typeof BASE_PRICES[commodity]).toBe('number');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: GameStateManager should be instantiable with data from new locations
   */
  it('should create GameStateManager with imports from new locations', () => {
    // Should be able to create instance
    const manager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);

    expect(manager).toBeDefined();
    expect(typeof manager.initNewGame).toBe('function');
    expect(typeof manager.getState).toBe('function');
  });

  /**
   * Property: TradingSystem should work with imports from new locations
   */
  it('should calculate prices using TradingSystem from new location', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'grain',
          'ore',
          'tritium',
          'parts',
          'medicine',
          'electronics'
        ),
        fc.record({
          id: fc.integer({ min: 0, max: 116 }),
          x: fc.float({ min: -300, max: 300, noNaN: true }),
          y: fc.float({ min: -300, max: 300, noNaN: true }),
          z: fc.float({ min: -300, max: 300, noNaN: true }),
        }),
        fc.integer({ min: 0, max: 1000 }),
        (goodType, system, currentDay) => {
          const price = TradingSystem.calculatePrice(
            goodType,
            system,
            currentDay,
            [], // No events
            {} // No market conditions
          );

          // Price should be positive
          expect(price).toBeGreaterThan(0);
          expect(typeof price).toBe('number');
          expect(Number.isInteger(price)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: NavigationSystem should work with imports from new locations
   */
  it('should calculate distances using NavigationSystem from new location', () => {
    fc.assert(
      fc.property(
        fc.record({
          x: fc.float({ min: -300, max: 300, noNaN: true }),
          y: fc.float({ min: -300, max: 300, noNaN: true }),
          z: fc.float({ min: -300, max: 300, noNaN: true }),
        }),
        fc.record({
          x: fc.float({ min: -300, max: 300, noNaN: true }),
          y: fc.float({ min: -300, max: 300, noNaN: true }),
          z: fc.float({ min: -300, max: 300, noNaN: true }),
        }),
        (system1, system2) => {
          const navSystem = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
          const distance = navSystem.calculateDistanceBetween(system1, system2);

          // Distance should be non-negative
          expect(distance).toBeGreaterThanOrEqual(0);

          // Distance to self should be zero
          if (
            system1.x === system2.x &&
            system1.y === system2.y &&
            system1.z === system2.z
          ) {
            expect(distance).toBeCloseTo(0, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: SeededRandom should work from new location
   */
  it('should generate random numbers using SeededRandom from new location', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000000 }), (seed) => {
        const rng = new SeededRandom(seed);
        const value = rng.next();

        // Should generate value in [0, 1)
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);

        // Should be deterministic
        const rng2 = new SeededRandom(seed);
        const value2 = rng2.next();
        expect(value2).toBe(value);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: sanitizeShipName should work from new location
   */
  it('should sanitize ship names using function from new location', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (shipName) => {
        const sanitized = sanitizeShipName(shipName);

        // Should return a string
        expect(typeof sanitized).toBe('string');

        // Should not be longer than 50 characters (max length)
        expect(sanitized.length).toBeLessThanOrEqual(50);
      }),
      { numRuns: 100 }
    );
  });
});
