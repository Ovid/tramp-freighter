import { BaseManager } from './base-manager.js';
import { FAILURE_CONFIG } from '../../constants.js';
import { SeededRandom, buildEncounterSeed } from '../../utils/seeded-random.js';

/**
 * MechanicalFailureManager - Handles ship system failure checks and repairs
 *
 * Extracted from DangerManager. Checks for and resolves mechanical failures:
 * hull breach, engine failure, life support emergency.
 *
 * Feature: danger-system, Property 9: Mechanical Failure Thresholds
 * Feature: danger-system, Property 10: Engine Failure Repair Options
 * Validates: Requirements 6.1-6.11
 */
export class MechanicalFailureManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  /**
   * Check for mechanical failures based on ship condition
   *
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for failure determination
   * @returns {Object|null} Failure object with type and severity, or null if no failure
   */
  checkMechanicalFailure(gameState, rng) {
    this.validateState();

    const state = this.getState();
    const seed = buildEncounterSeed(
      state.player.daysElapsed,
      state.player.currentSystem,
      'check_mechanical'
    );
    const seededRng = new SeededRandom(seed).next();

    const { ship } = gameState;

    if (ship.hull < FAILURE_CONFIG.HULL_BREACH.CONDITION_THRESHOLD) {
      if (seededRng < FAILURE_CONFIG.HULL_BREACH.CHANCE) {
        return {
          type: 'hull_breach',
          severity: ship.hull,
        };
      }
    }

    if (ship.engine < FAILURE_CONFIG.ENGINE_FAILURE.CONDITION_THRESHOLD) {
      if (seededRng < FAILURE_CONFIG.ENGINE_FAILURE.CHANCE) {
        return {
          type: 'engine_failure',
          severity: ship.engine,
        };
      }
    }

    if (ship.lifeSupport < FAILURE_CONFIG.LIFE_SUPPORT.CONDITION_THRESHOLD) {
      if (seededRng < FAILURE_CONFIG.LIFE_SUPPORT.CHANCE) {
        return {
          type: 'life_support',
          severity: ship.lifeSupport,
        };
      }
    }

    return null;
  }

  /**
   * Resolve a mechanical failure with the chosen repair option
   *
   * @param {string} failureType - Type of failure ('hull_breach', 'engine_failure', 'life_support')
   * @param {string|null} choice - Repair choice (null for immediate consequences)
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Failure resolution outcome with success, costs, and description
   */
  resolveMechanicalFailure(failureType, choice, gameState, rng) {
    this.validateState();

    const state = this.getState();
    const seed = buildEncounterSeed(
      state.player.daysElapsed,
      state.player.currentSystem,
      'resolve_mechanical'
    );
    const seededRng = new SeededRandom(seed).next();

    switch (failureType) {
      case 'hull_breach':
        return this.resolveHullBreach();
      case 'engine_failure':
        return this.resolveEngineFailure(choice, gameState, seededRng);
      case 'life_support':
        return this.resolveLifeSupportEmergency();
      default:
        throw new Error(`Unknown failure type: ${failureType}`);
    }
  }

  /**
   * Resolve hull breach failure
   *
   * @returns {Object} Hull breach outcome
   */
  resolveHullBreach() {
    return {
      success: false,
      costs: {
        hull: FAILURE_CONFIG.HULL_BREACH.HULL_DAMAGE,
        cargoLoss: true,
      },
      rewards: {},
      description:
        'Hull breach detected! Emergency bulkheads sealed, but some cargo was lost to space.',
    };
  }

  /**
   * Resolve engine failure with repair choice
   *
   * @param {string} choice - Repair choice ('emergency_restart', 'call_for_help', 'jury_rig')
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Engine failure resolution outcome
   */
  resolveEngineFailure(choice, gameState, rng) {
    switch (choice) {
      case 'emergency_restart':
        return this.resolveEmergencyRestart(rng);
      case 'call_for_help':
        return this.resolveCallForHelp();
      case 'jury_rig':
        return this.resolveJuryRig(rng);
      default:
        throw new Error(`Unknown engine failure repair choice: ${choice}`);
    }
  }

  /**
   * Resolve emergency restart repair option
   *
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Emergency restart outcome
   */
  resolveEmergencyRestart(rng) {
    const success =
      rng < FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.CHANCE;

    if (success) {
      return {
        success: true,
        costs: {
          engine: FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.ENGINE_COST,
        },
        rewards: {},
        description:
          'Emergency restart successful! Engine is running again, but condition has deteriorated.',
      };
    } else {
      return {
        success: false,
        costs: {
          engine: FAILURE_CONFIG.ENGINE_FAILURE.EMERGENCY_RESTART.ENGINE_COST,
        },
        rewards: {},
        description:
          'Emergency restart failed. Engine condition worsened and you remain stranded.',
      };
    }
  }

  /**
   * Resolve call for help repair option
   *
   * @returns {Object} Call for help outcome
   */
  resolveCallForHelp() {
    return {
      success: true,
      costs: {
        credits: FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.CREDITS_COST,
        days: FAILURE_CONFIG.ENGINE_FAILURE.CALL_FOR_HELP.DAYS_DELAY,
      },
      rewards: {},
      description:
        'Rescue tug arrived and repaired your engine. Service fee charged and time lost.',
    };
  }

  /**
   * Resolve jury-rig repair option
   *
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Jury-rig outcome
   */
  resolveJuryRig(rng) {
    const success = rng < FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.CHANCE;

    if (success) {
      return {
        success: true,
        costs: {
          engine: FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST,
        },
        rewards: {},
        description:
          'Jury-rig repair successful! Makeshift fix got the engine running again.',
      };
    } else {
      return {
        success: false,
        costs: {
          engine: FAILURE_CONFIG.ENGINE_FAILURE.JURY_RIG.ENGINE_COST,
        },
        rewards: {},
        description:
          'Jury-rig repair failed. Engine condition worsened and you remain stranded.',
      };
    }
  }

  /**
   * Resolve life support emergency
   *
   * @returns {Object} Life support emergency outcome
   */
  resolveLifeSupportEmergency() {
    return {
      success: false,
      costs: {
        lifeSupport: 5,
      },
      rewards: {},
      description:
        'Life support emergency! Backup systems engaged, but overall condition has deteriorated.',
    };
  }
}
