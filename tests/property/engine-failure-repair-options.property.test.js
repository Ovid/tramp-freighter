import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { GameStateManager } from '../../src/game/state/game-state-manager.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { FAILURE_CONFIG } from '../../src/game/constants.js';

/**
 * Property-Based Tests for Engine Failure Repair Options
 * 
 * Feature: danger-system, Property 10: Engine Failure Repair Options
 * Validates: Requirements 6.7, 6.8, 6.9
 * 
 * Tests that engine failure repair options have correct mechanics:
 * - Emergency restart: 50% success with -10% engine cost
 * - Call for help: ₡1,000 cost and +2 days delay
 * - Jury-rig: 75% success with -5% engine cost
 */
describe('Property 10: Engine Failure Repair Options', () => {
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

  it('should resolve emergency restart with correct success rate and engine cost', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // initial engine condition
        fc.integer({ min: 0, max: 10000 }), // initial credits
        fc.float({ min: 0, max: 1 }), // random number
        (initialEngine, initialCredits, rng) => {
          // Set up game state
          const gameState = gameStateManager.getState();
          gameState.ship.engine = initialEngine;
          gameState.player.credits = initialCredits;

          // Create engine failure
          const failure = { type: 'engine_failure', severity: initialEngine };

          // Resolve emergency restart
          const result = gameStateManager.dangerManager.resolveMechanicalFailure(
            failure.type, 
            'emergency_restart', 
            gameState, 
            rng
          );

          if (rng < FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.CHANCE) {
            // Success case
            expect(result.success).toBe(true);
            expect(result.costs.engine).toBe(FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.ENGINE_COST);
            expect(result.costs.credits).toBeUndefined();
            expect(result.costs.days).toBeUndefined();
          } else {
            // Failure case
            expect(result.success).toBe(false);
            expect(result.costs.engine).toBe(FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.ENGINE_COST);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should resolve call for help with guaranteed success and correct costs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // initial engine condition
        fc.integer({ min: 1000, max: 10000 }), // initial credits (ensure enough for cost)
        fc.float({ min: 0, max: 1 }), // random number (should not affect outcome)
        (initialEngine, initialCredits, rng) => {
          // Set up game state
          const gameState = gameStateManager.getState();
          gameState.ship.engine = initialEngine;
          gameState.player.credits = initialCredits;

          // Create engine failure
          const failure = { type: 'engine_failure', severity: initialEngine };

          // Resolve call for help
          const result = gameStateManager.dangerManager.resolveMechanicalFailure(
            failure.type, 
            'call_for_help', 
            gameState, 
            rng
          );

          // Call for help should always succeed
          expect(result.success).toBe(true);
          expect(result.costs.credits).toBe(FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST);
          expect(result.costs.days).toBe(FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.DAYS_DELAY);
          expect(result.costs.engine).toBeUndefined(); // No engine condition cost
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should resolve jury-rig with correct success rate and engine cost', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // initial engine condition
        fc.integer({ min: 0, max: 10000 }), // initial credits
        fc.float({ min: 0, max: 1 }), // random number
        (initialEngine, initialCredits, rng) => {
          // Set up game state
          const gameState = gameStateManager.getState();
          gameState.ship.engine = initialEngine;
          gameState.player.credits = initialCredits;

          // Create engine failure
          const failure = { type: 'engine_failure', severity: initialEngine };

          // Resolve jury-rig
          const result = gameStateManager.dangerManager.resolveMechanicalFailure(
            failure.type, 
            'jury_rig', 
            gameState, 
            rng
          );

          if (rng < FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.CHANCE) {
            // Success case
            expect(result.success).toBe(true);
            expect(result.costs.engine).toBe(FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST);
            expect(result.costs.credits).toBeUndefined();
            expect(result.costs.days).toBeUndefined();
          } else {
            // Failure case
            expect(result.success).toBe(false);
            expect(result.costs.engine).toBe(FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle hull breach with immediate consequences', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // initial hull condition
        fc.integer({ min: 1, max: 10 }), // cargo count
        fc.float({ min: 0, max: 1 }), // random number (should not affect outcome)
        (initialHull, cargoCount, rng) => {
          // Set up game state with cargo
          const gameState = gameStateManager.getState();
          gameState.ship.hull = initialHull;
          gameState.ship.cargo = Array(cargoCount).fill({ type: 'electronics', quantity: 1 });

          // Create hull breach failure
          const failure = { type: 'hull_breach', severity: initialHull };

          // Resolve hull breach (no choice needed, immediate consequence)
          const result = gameStateManager.dangerManager.resolveMechanicalFailure(
            failure.type, 
            null, // Hull breach has no repair choices
            gameState, 
            rng
          );

          // Hull breach should always cause immediate damage and cargo loss
          expect(result.success).toBe(false); // Hull breach is always bad
          expect(result.costs.hull).toBe(FAILURE_CONFIG.HULL_BREACH.HULL_DAMAGE);
          expect(result.costs.cargoLoss).toBe(true); // Some cargo should be lost
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle life support emergency with immediate consequences', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // initial life support condition
        fc.float({ min: 0, max: 1 }), // random number (should not affect outcome)
        (initialLifeSupport, rng) => {
          // Set up game state
          const gameState = gameStateManager.getState();
          gameState.ship.lifeSupport = initialLifeSupport;

          // Create life support failure
          const failure = { type: 'life_support', severity: initialLifeSupport };

          // Resolve life support emergency (no choice needed, immediate consequence)
          const result = gameStateManager.dangerManager.resolveMechanicalFailure(
            failure.type, 
            null, // Life support emergency has no repair choices
            gameState, 
            rng
          );

          // Life support emergency should always cause immediate consequences
          expect(result.success).toBe(false); // Life support emergency is always bad
          expect(result.costs).toBeDefined();
          expect(result.description).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw error for unknown failure types', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !['hull_breach', 'engine_failure', 'life_support'].includes(s)),
        fc.float({ min: 0, max: 1 }),
        (unknownFailureType, rng) => {
          const gameState = gameStateManager.getState();

          expect(() => {
            gameStateManager.dangerManager.resolveMechanicalFailure(
              unknownFailureType, 
              'emergency_restart', 
              gameState, 
              rng
            );
          }).toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should throw error for unknown repair choices', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !['emergency_restart', 'call_for_help', 'jury_rig'].includes(s)),
        fc.float({ min: 0, max: 1 }),
        (unknownChoice, rng) => {
          const gameState = gameStateManager.getState();

          expect(() => {
            gameStateManager.dangerManager.resolveMechanicalFailure(
              'engine_failure', 
              unknownChoice, 
              gameState, 
              rng
            );
          }).toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });
});