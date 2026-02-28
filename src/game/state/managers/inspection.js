import { BaseManager } from './base-manager.js';
import { INSPECTION_CONFIG } from '../../constants.js';
import { SeededRandom, buildEncounterSeed } from '../../utils/seeded-random.js';

/**
 * InspectionManager - Handles customs inspection resolution
 *
 * Extracted from DangerManager. Resolves inspection choices:
 * cooperate, bribe, flee.
 *
 * Feature: danger-system, Property 7: Inspection Outcomes
 * Validates: Requirements 5.3-5.11, 8.4, 8.5, 8.7, 11.8
 */
export class InspectionManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  /**
   * Resolve an inspection choice and return the outcome
   *
   * @param {string} choice - Inspection choice ('cooperate', 'bribe', 'flee')
   * @param {Object} gameState - Current game state
   * @returns {Object} Inspection outcome with success, costs, rewards, and description
   */
  resolveInspection(choice, gameState) {
    this.validateState();

    const state = this.getState();
    const seed = buildEncounterSeed(
      state.player.daysElapsed,
      state.player.currentSystem,
      'inspection'
    );
    const seededRng = new SeededRandom(seed).next();

    let result;
    switch (choice) {
      case 'cooperate':
        result = this.resolveInspectionCooperate(gameState, seededRng);
        this.gameStateManager.incrementDangerFlag('inspectionsPassed');
        break;
      case 'bribe':
        result = this.resolveInspectionBribe(gameState, seededRng);
        this.gameStateManager.incrementDangerFlag('inspectionsBribed');
        break;
      case 'flee':
        result = this.resolveInspectionFlee();
        this.gameStateManager.incrementDangerFlag('inspectionsFled');
        break;
      default:
        throw new Error(`Unknown inspection choice: ${choice}`);
    }

    return result;
  }

  /**
   * Resolve cooperate inspection choice
   *
   * Cooperate complies with the inspection, confiscating restricted goods
   * and imposing fines. Hidden cargo may be discovered based on security level.
   *
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for hidden cargo discovery
   * @returns {Object} Inspection outcome
   */
  resolveInspectionCooperate(gameState, rng) {
    let totalFine = 0;
    let restrictedGoodsConfiscated = false;
    let hiddenCargoConfiscated = false;
    let authorityRepChange = INSPECTION_CONFIG.COOPERATE.AUTHORITY_REP_GAIN;
    let outlawRepChange = 0;

    const currentSystem = gameState.player.currentSystem || 0;
    const zone = this.gameStateManager.getDangerZone(currentSystem);
    const restrictedCount = this.gameStateManager.countRestrictedGoods(
      gameState.ship.cargo || [],
      zone,
      currentSystem
    );
    const hasRestrictedGoods = restrictedCount > 0;
    if (hasRestrictedGoods) {
      totalFine += INSPECTION_CONFIG.COOPERATE.RESTRICTED_FINE;
      restrictedGoodsConfiscated = true;
      authorityRepChange +=
        INSPECTION_CONFIG.REPUTATION_PENALTIES.RESTRICTED_GOODS;
    }

    const hasHiddenCargo =
      gameState.ship.hiddenCargo && gameState.ship.hiddenCargo.length > 0;
    if (hasHiddenCargo) {
      let securityMultiplier;
      if (currentSystem === 0 || currentSystem === 1) {
        securityMultiplier = INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS.core;
      } else {
        securityMultiplier = INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS[zone];
      }

      const discoveryChance =
        INSPECTION_CONFIG.HIDDEN_CARGO_DISCOVERY_CHANCE * securityMultiplier;

      if (rng < discoveryChance) {
        totalFine += INSPECTION_CONFIG.COOPERATE.HIDDEN_FINE;
        hiddenCargoConfiscated = true;
        authorityRepChange =
          INSPECTION_CONFIG.REPUTATION_PENALTIES.HIDDEN_CARGO;
        outlawRepChange =
          INSPECTION_CONFIG.REPUTATION_PENALTIES.SMUGGLING_OUTLAW_BONUS;
      }
    }

    const outcome = {
      success: true,
      costs: {
        credits: totalFine,
      },
      rewards: {
        factionRep: {
          authorities: authorityRepChange,
        },
      },
      description: 'Cooperated with customs inspection.',
    };

    if (restrictedGoodsConfiscated) {
      outcome.costs.restrictedGoodsConfiscated = true;
    }
    if (hiddenCargoConfiscated) {
      outcome.costs.hiddenCargoConfiscated = true;
    }
    if (outlawRepChange > 0) {
      outcome.rewards.factionRep.outlaws = outlawRepChange;
    }

    return outcome;
  }

  /**
   * Resolve bribery inspection choice
   *
   * Success rate: 60% base chance
   * Success: Pay bribe cost, avoid confiscation
   * Failure: Pay bribe cost + additional fine, confiscate goods
   *
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for bribery success
   * @returns {Object} Inspection outcome
   */
  resolveInspectionBribe(gameState, rng) {
    const success = rng < INSPECTION_CONFIG.BRIBE.BASE_CHANCE;

    let totalCost = INSPECTION_CONFIG.BRIBE.COST;
    let description = 'Attempted to bribe customs inspector.';

    if (success) {
      description =
        'Successfully bribed customs inspector and avoided inspection.';
    } else {
      totalCost += INSPECTION_CONFIG.BRIBE.FAILURE_ADDITIONAL_FINE;
      description =
        'Bribery attempt failed. Inspector imposed additional penalties.';
    }

    return {
      success,
      costs: {
        credits: totalCost,
      },
      rewards: {
        factionRep: {
          authorities: INSPECTION_CONFIG.BRIBE.AUTHORITY_REP_PENALTY,
        },
      },
      description,
    };
  }

  /**
   * Resolve flee inspection choice
   *
   * Triggers a patrol combat encounter and applies reputation penalties.
   *
   * @returns {Object} Inspection outcome
   */
  resolveInspectionFlee() {
    return {
      success: false,
      costs: {
        fuel: INSPECTION_CONFIG.FLEE.FUEL_COST,
        hull: INSPECTION_CONFIG.FLEE.HULL_COST,
      },
      rewards: {
        factionRep: {
          authorities: INSPECTION_CONFIG.FLEE.AUTHORITY_REP_PENALTY,
        },
      },
      description:
        'You punch the throttle and break away. The emergency burn costs fuel and rattles the hull.',
    };
  }
}
