'use strict';

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../js/game-state.js';
import { SHIP_CONDITION_WARNING_THRESHOLDS } from '../../js/game-constants.js';

/**
 * Property-Based Tests for Ship Condition Warning Thresholds
 *
 * Feature: dynamic-economy, Property 28: Ship Condition Warning Thresholds
 * Validates: Requirements 8.1, 8.2, 8.3
 *
 * Tests that warnings are triggered at the correct condition thresholds:
 * - Hull < 50%: Cargo loss risk warning
 * - Engine < 30%: Jump failure risk warning
 * - Life Support < 20%: Critical condition warning
 */

describe('Property 28: Ship Condition Warning Thresholds', () => {
  // Mock star data for testing
  const mockStarData = [
    { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G', wh: 2, st: 1, r: 1 },
  ];
  const mockWormholeData = [];

  it('should trigger hull warning when hull < 50%', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: Math.fround(49.99), noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (hull, engine, lifeSupport) => {
          const gameStateManager = new GameStateManager(
            mockStarData,
            mockWormholeData
          );
          gameStateManager.initNewGame();

          // Set ship condition with hull below threshold
          gameStateManager.updateShipCondition(hull, engine, lifeSupport);

          // Check warnings
          const warnings = gameStateManager.checkConditionWarnings();

          // Hull warning should be present
          const hullWarning = warnings.find((w) => w.system === 'hull');
          expect(hullWarning).toBeDefined();
          expect(hullWarning.message).toContain('cargo loss');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT trigger hull warning when hull >= 50%', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 50, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (hull, engine, lifeSupport) => {
          const gameStateManager = new GameStateManager(
            mockStarData,
            mockWormholeData
          );
          gameStateManager.initNewGame();

          // Set ship condition with hull at or above threshold
          gameStateManager.updateShipCondition(hull, engine, lifeSupport);

          // Check warnings
          const warnings = gameStateManager.checkConditionWarnings();

          // Hull warning should NOT be present
          const hullWarning = warnings.find((w) => w.system === 'hull');
          expect(hullWarning).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should trigger engine warning when engine < 30%', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: Math.fround(29.99), noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (hull, engine, lifeSupport) => {
          const gameStateManager = new GameStateManager(
            mockStarData,
            mockWormholeData
          );
          gameStateManager.initNewGame();

          // Set ship condition with engine below threshold
          gameStateManager.updateShipCondition(hull, engine, lifeSupport);

          // Check warnings
          const warnings = gameStateManager.checkConditionWarnings();

          // Engine warning should be present
          const engineWarning = warnings.find((w) => w.system === 'engine');
          expect(engineWarning).toBeDefined();
          expect(engineWarning.message).toContain('Jump failure risk');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT trigger engine warning when engine >= 30%', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 30, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        (hull, engine, lifeSupport) => {
          const gameStateManager = new GameStateManager(
            mockStarData,
            mockWormholeData
          );
          gameStateManager.initNewGame();

          // Set ship condition with engine at or above threshold
          gameStateManager.updateShipCondition(hull, engine, lifeSupport);

          // Check warnings
          const warnings = gameStateManager.checkConditionWarnings();

          // Engine warning should NOT be present
          const engineWarning = warnings.find((w) => w.system === 'engine');
          expect(engineWarning).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should trigger life support warning when life support < 20%', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: Math.fround(19.99), noNaN: true }),
        (hull, engine, lifeSupport) => {
          const gameStateManager = new GameStateManager(
            mockStarData,
            mockWormholeData
          );
          gameStateManager.initNewGame();

          // Set ship condition with life support below threshold
          gameStateManager.updateShipCondition(hull, engine, lifeSupport);

          // Check warnings
          const warnings = gameStateManager.checkConditionWarnings();

          // Life support warning should be present
          const lifeSupportWarning = warnings.find(
            (w) => w.system === 'lifeSupport'
          );
          expect(lifeSupportWarning).toBeDefined();
          expect(lifeSupportWarning.message).toContain('Critical condition');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should NOT trigger life support warning when life support >= 20%', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 0, max: 100, noNaN: true }),
        fc.float({ min: 20, max: 100, noNaN: true }),
        (hull, engine, lifeSupport) => {
          const gameStateManager = new GameStateManager(
            mockStarData,
            mockWormholeData
          );
          gameStateManager.initNewGame();

          // Set ship condition with life support at or above threshold
          gameStateManager.updateShipCondition(hull, engine, lifeSupport);

          // Check warnings
          const warnings = gameStateManager.checkConditionWarnings();

          // Life support warning should NOT be present
          const lifeSupportWarning = warnings.find(
            (w) => w.system === 'lifeSupport'
          );
          expect(lifeSupportWarning).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should trigger multiple warnings when multiple systems are below thresholds', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: Math.fround(49.99), noNaN: true }),
        fc.float({ min: 0, max: Math.fround(29.99), noNaN: true }),
        fc.float({ min: 0, max: Math.fround(19.99), noNaN: true }),
        (hull, engine, lifeSupport) => {
          const gameStateManager = new GameStateManager(
            mockStarData,
            mockWormholeData
          );
          gameStateManager.initNewGame();

          // Set all systems below their thresholds
          gameStateManager.updateShipCondition(hull, engine, lifeSupport);

          // Check warnings
          const warnings = gameStateManager.checkConditionWarnings();

          // All three warnings should be present
          expect(warnings.length).toBe(3);

          const hullWarning = warnings.find((w) => w.system === 'hull');
          const engineWarning = warnings.find((w) => w.system === 'engine');
          const lifeSupportWarning = warnings.find(
            (w) => w.system === 'lifeSupport'
          );

          expect(hullWarning).toBeDefined();
          expect(engineWarning).toBeDefined();
          expect(lifeSupportWarning).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when all systems are above thresholds', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 50, max: 100, noNaN: true }),
        fc.float({ min: 30, max: 100, noNaN: true }),
        fc.float({ min: 20, max: 100, noNaN: true }),
        (hull, engine, lifeSupport) => {
          const gameStateManager = new GameStateManager(
            mockStarData,
            mockWormholeData
          );
          gameStateManager.initNewGame();

          // Set all systems at or above their thresholds
          gameStateManager.updateShipCondition(hull, engine, lifeSupport);

          // Check warnings
          const warnings = gameStateManager.checkConditionWarnings();

          // No warnings should be present
          expect(warnings.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
