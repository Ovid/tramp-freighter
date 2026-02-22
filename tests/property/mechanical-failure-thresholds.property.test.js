import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { FAILURE_CONFIG } from '../../src/game/constants.js';

/**
 * Property-Based Tests for Mechanical Failure Thresholds
 *
 * Feature: danger-system, Property 9: Mechanical Failure Thresholds
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 *
 * Tests that mechanical failures occur at the correct condition thresholds
 * with the specified probabilities.
 */
describe('Property 9: Mechanical Failure Thresholds', () => {
  let gameStateManager;

  beforeEach(() => {
    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    // Mock console methods to suppress output during tests
    vi.stubGlobal('console', {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    });

    gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
    gameStateManager.initNewGame();
  });

  it('should check hull breach failure only when hull condition is below threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // hull condition
        fc.float({ min: 0, max: 1 }), // random number
        (hullCondition, rng) => {
          // Set up game state with specific hull condition
          const gameState = gameStateManager.getState();
          gameState.ship.hull = hullCondition;

          // Check for mechanical failure
          const failure = gameStateManager.mechanicalFailureManager.checkMechanicalFailure(
            gameState,
            rng
          );

          if (hullCondition < FAILURE_CONFIG.HULL_BREACH.CONDITION_THRESHOLD) {
            // Below threshold: hull breach should be possible
            if (rng < FAILURE_CONFIG.HULL_BREACH.CHANCE) {
              expect(failure).toEqual({
                type: 'hull_breach',
                severity: hullCondition,
              });
            } else {
              // If hull breach doesn't occur, other failures might still happen
              expect(failure === null || failure.type !== 'hull_breach').toBe(
                true
              );
            }
          } else {
            // Above threshold: hull breach should never occur
            expect(failure === null || failure.type !== 'hull_breach').toBe(
              true
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should check engine failure only when engine condition is below threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // engine condition
        fc.float({ min: 0, max: 1 }), // random number
        (engineCondition, rng) => {
          // Set up game state with specific engine condition
          const gameState = gameStateManager.getState();
          gameState.ship.engine = engineCondition;
          gameState.ship.hull = 100; // Set hull high to avoid hull breach interference

          // Check for mechanical failure
          const failure = gameStateManager.mechanicalFailureManager.checkMechanicalFailure(
            gameState,
            rng
          );

          if (
            engineCondition < FAILURE_CONFIG.ENGINE_FAILURE.CONDITION_THRESHOLD
          ) {
            // Below threshold: engine failure should be possible
            if (rng < FAILURE_CONFIG.ENGINE_FAILURE.CHANCE) {
              expect(failure).toEqual({
                type: 'engine_failure',
                severity: engineCondition,
              });
            } else {
              // If engine failure doesn't occur, other failures might still happen
              expect(
                failure === null || failure.type !== 'engine_failure'
              ).toBe(true);
            }
          } else {
            // Above threshold: engine failure should never occur
            expect(failure === null || failure.type !== 'engine_failure').toBe(
              true
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should check life support failure only when life support condition is below threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // life support condition
        fc.float({ min: 0, max: 1 }), // random number
        (lifeSupportCondition, rng) => {
          // Set up game state with specific life support condition
          const gameState = gameStateManager.getState();
          gameState.ship.lifeSupport = lifeSupportCondition;
          gameState.ship.hull = 100; // Set hull high to avoid hull breach interference
          gameState.ship.engine = 100; // Set engine high to avoid engine failure interference

          // Check for mechanical failure
          const failure = gameStateManager.mechanicalFailureManager.checkMechanicalFailure(
            gameState,
            rng
          );

          if (
            lifeSupportCondition <
            FAILURE_CONFIG.LIFE_SUPPORT.CONDITION_THRESHOLD
          ) {
            // Below threshold: life support failure should be possible
            if (rng < FAILURE_CONFIG.LIFE_SUPPORT.CHANCE) {
              expect(failure).toEqual({
                type: 'life_support',
                severity: lifeSupportCondition,
              });
            } else {
              // If life support failure doesn't occur, no failure should happen
              expect(failure).toBe(null);
            }
          } else {
            // Above threshold: life support failure should never occur
            expect(failure === null || failure.type !== 'life_support').toBe(
              true
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use correct failure probabilities for each failure type', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1 }), // random number
        (rng) => {
          // Set up game state with all systems below thresholds
          const gameState = gameStateManager.getState();
          gameState.ship.hull =
            FAILURE_CONFIG.HULL_BREACH.CONDITION_THRESHOLD - 1;
          gameState.ship.engine =
            FAILURE_CONFIG.ENGINE_FAILURE.CONDITION_THRESHOLD - 1;
          gameState.ship.lifeSupport =
            FAILURE_CONFIG.LIFE_SUPPORT.CONDITION_THRESHOLD - 1;

          // Check for mechanical failure
          const failure = gameStateManager.mechanicalFailureManager.checkMechanicalFailure(
            gameState,
            rng
          );

          // Verify that the correct failure type occurs based on probability ranges
          if (rng < FAILURE_CONFIG.HULL_BREACH.CHANCE) {
            expect(failure?.type).toBe('hull_breach');
          } else if (rng < FAILURE_CONFIG.ENGINE_FAILURE.CHANCE) {
            expect(failure?.type).toBe('engine_failure');
          } else if (rng < FAILURE_CONFIG.LIFE_SUPPORT.CHANCE) {
            expect(failure?.type).toBe('life_support');
          } else {
            expect(failure).toBe(null);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null when all systems are above failure thresholds', () => {
    fc.assert(
      fc.property(
        fc.integer({
          min: FAILURE_CONFIG.HULL_BREACH.CONDITION_THRESHOLD,
          max: 100,
        }), // hull above threshold
        fc.integer({
          min: FAILURE_CONFIG.ENGINE_FAILURE.CONDITION_THRESHOLD,
          max: 100,
        }), // engine above threshold
        fc.integer({
          min: FAILURE_CONFIG.LIFE_SUPPORT.CONDITION_THRESHOLD,
          max: 100,
        }), // life support above threshold
        fc.float({ min: 0, max: 1 }), // random number
        (hullCondition, engineCondition, lifeSupportCondition, rng) => {
          // Set up game state with all systems above thresholds
          const gameState = gameStateManager.getState();
          gameState.ship.hull = hullCondition;
          gameState.ship.engine = engineCondition;
          gameState.ship.lifeSupport = lifeSupportCondition;

          // Check for mechanical failure
          const failure = gameStateManager.mechanicalFailureManager.checkMechanicalFailure(
            gameState,
            rng
          );

          // No failures should occur when all systems are above thresholds
          expect(failure).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });
});
