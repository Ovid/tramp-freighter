import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameCoordinator } from "@game/state/game-coordinator.js";
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { FAILURE_CONFIG } from '../../src/game/constants.js';
import {
  SeededRandom,
  buildEncounterSeed,
} from '../../src/game/utils/seeded-random.js';

/**
 * Compute the seeded RNG value that checkMechanicalFailure will produce.
 */
function computeCheckMechanicalRng(daysElapsed, currentSystem) {
  const seed = buildEncounterSeed(
    daysElapsed,
    currentSystem,
    'check_mechanical'
  );
  return new SeededRandom(seed).next();
}

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
  let game;

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

    game = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    game.initNewGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should check hull breach failure only when hull condition is below threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // hull condition
        fc.integer({ min: 0, max: 500 }), // daysElapsed to vary seeded RNG
        (hullCondition, daysElapsed) => {
          // Set up game state with specific hull condition
          const gameState = game.getState();
          gameState.ship.hull = hullCondition;
          gameState.player.daysElapsed = daysElapsed;

          // Compute the seeded RNG value the manager will use
          const seededRng = computeCheckMechanicalRng(
            daysElapsed,
            gameState.player.currentSystem
          );

          // Check for mechanical failure
          const failure =
            game.mechanicalFailureManager.checkMechanicalFailure(
              gameState
            );

          if (hullCondition < FAILURE_CONFIG.HULL_BREACH.CONDITION_THRESHOLD) {
            // Below threshold: hull breach should be possible
            if (seededRng < FAILURE_CONFIG.HULL_BREACH.CHANCE) {
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
        fc.integer({ min: 0, max: 500 }), // daysElapsed to vary seeded RNG
        (engineCondition, daysElapsed) => {
          // Set up game state with specific engine condition
          const gameState = game.getState();
          gameState.ship.engine = engineCondition;
          gameState.ship.hull = 100; // Set hull high to avoid hull breach interference
          gameState.player.daysElapsed = daysElapsed;

          // Compute the seeded RNG value the manager will use
          const seededRng = computeCheckMechanicalRng(
            daysElapsed,
            gameState.player.currentSystem
          );

          // Check for mechanical failure
          const failure =
            game.mechanicalFailureManager.checkMechanicalFailure(
              gameState
            );

          if (
            engineCondition < FAILURE_CONFIG.ENGINE_FAILURE.CONDITION_THRESHOLD
          ) {
            // Below threshold: engine failure should be possible
            if (seededRng < FAILURE_CONFIG.ENGINE_FAILURE.CHANCE) {
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
        fc.integer({ min: 0, max: 500 }), // daysElapsed to vary seeded RNG
        (lifeSupportCondition, daysElapsed) => {
          // Set up game state with specific life support condition
          const gameState = game.getState();
          gameState.ship.lifeSupport = lifeSupportCondition;
          gameState.ship.hull = 100; // Set hull high to avoid hull breach interference
          gameState.ship.engine = 100; // Set engine high to avoid engine failure interference
          gameState.player.daysElapsed = daysElapsed;

          // Compute the seeded RNG value the manager will use
          const seededRng = computeCheckMechanicalRng(
            daysElapsed,
            gameState.player.currentSystem
          );

          // Check for mechanical failure
          const failure =
            game.mechanicalFailureManager.checkMechanicalFailure(
              gameState
            );

          if (
            lifeSupportCondition <
            FAILURE_CONFIG.LIFE_SUPPORT.CONDITION_THRESHOLD
          ) {
            // Below threshold: life support failure should be possible
            if (seededRng < FAILURE_CONFIG.LIFE_SUPPORT.CHANCE) {
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
        fc.integer({ min: 0, max: 500 }), // daysElapsed to vary seeded RNG
        (daysElapsed) => {
          // Set up game state with all systems below thresholds
          const gameState = game.getState();
          gameState.ship.hull =
            FAILURE_CONFIG.HULL_BREACH.CONDITION_THRESHOLD - 1;
          gameState.ship.engine =
            FAILURE_CONFIG.ENGINE_FAILURE.CONDITION_THRESHOLD - 1;
          gameState.ship.lifeSupport =
            FAILURE_CONFIG.LIFE_SUPPORT.CONDITION_THRESHOLD - 1;
          gameState.player.daysElapsed = daysElapsed;

          // Compute the seeded RNG value the manager will use
          const seededRng = computeCheckMechanicalRng(
            daysElapsed,
            gameState.player.currentSystem
          );

          // Check for mechanical failure
          const failure =
            game.mechanicalFailureManager.checkMechanicalFailure(
              gameState
            );

          // Verify that the correct failure type occurs based on probability ranges
          if (seededRng < FAILURE_CONFIG.HULL_BREACH.CHANCE) {
            expect(failure?.type).toBe('hull_breach');
          } else if (seededRng < FAILURE_CONFIG.ENGINE_FAILURE.CHANCE) {
            expect(failure?.type).toBe('engine_failure');
          } else if (seededRng < FAILURE_CONFIG.LIFE_SUPPORT.CHANCE) {
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
        (hullCondition, engineCondition, lifeSupportCondition) => {
          // Set up game state with all systems above thresholds
          const gameState = game.getState();
          gameState.ship.hull = hullCondition;
          gameState.ship.engine = engineCondition;
          gameState.ship.lifeSupport = lifeSupportCondition;

          // Check for mechanical failure
          const failure =
            game.mechanicalFailureManager.checkMechanicalFailure(
              gameState
            );

          // No failures should occur when all systems are above thresholds
          expect(failure).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });
});
