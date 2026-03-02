import { BaseManager } from './base-manager.js';
import { COMBAT_CONFIG, KARMA_CONFIG } from '../../constants.js';
import { calculateKarmaModifier } from '../../utils/danger-utils.js';
import { SeededRandom, buildEncounterSeed } from '../../utils/seeded-random.js';

/**
 * CombatManager - Handles pirate combat resolution
 *
 * Extracted from DangerManager. Resolves tactical combat choices:
 * evasive maneuvers, return fire, dump cargo, distress call.
 *
 * Feature: danger-system, Property 4: Combat Resolution Outcomes
 * Validates: Requirements 3.1-3.11, 8.7
 */
export class CombatManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  /**
   * Resolve a combat choice and return the outcome
   *
   * @param {Object} encounter - The pirate encounter object
   * @param {string} choice - Combat choice ('evasive', 'return_fire', 'dump_cargo', 'distress_call')
   * @returns {Object} Combat outcome with success, costs, rewards, and description
   */
  resolveCombatChoice(encounter, choice) {
    this.validateState();

    const gameState = this.getState();

    const seed = buildEncounterSeed(
      gameState.player.daysElapsed,
      gameState.player.currentSystem,
      'combat'
    );
    const rng = new SeededRandom(seed).next();

    let result;
    switch (choice) {
      case 'evasive':
        result = this.resolveEvasiveManeuvers(encounter, gameState, rng);
        break;
      case 'return_fire':
        result = this.resolveReturnFire(encounter, gameState, rng);
        break;
      case 'dump_cargo':
        result = this.resolveDumpCargo();
        break;
      case 'distress_call':
        result = this.resolveDistressCall(encounter, gameState, rng);
        break;
      default:
        throw new Error(`Unknown combat choice: ${choice}`);
    }

    this.gameStateManager.incrementDangerFlag('piratesFought');
    return result;
  }

  /**
   * Resolve evasive maneuvers combat choice
   *
   * Success rate: 70% base chance + modifiers
   * Success: -15% fuel, -5% engine condition
   * Failure: -20% hull damage (modified by hull quirks/upgrades)
   *
   * @param {Object} encounter - The pirate encounter
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Combat outcome
   */
  resolveEvasiveManeuvers(encounter, gameState, rng) {
    const { EVASIVE } = COMBAT_CONFIG;

    let successChance = EVASIVE.BASE_CHANCE;

    if (gameState.ship.quirks.includes('hot_thruster')) {
      successChance += COMBAT_CONFIG.MODIFIERS.hot_thruster.evasiveBonus;
    }

    if (gameState.ship.upgrades.includes('efficient_drive')) {
      successChance += COMBAT_CONFIG.MODIFIERS.efficient_drive.fleeBonus;
    }

    successChance += calculateKarmaModifier(gameState.player.karma);
    successChance -= encounter.strengthModifier || 0;

    successChance = Math.max(0, Math.min(1, successChance));

    const success = rng < successChance;

    if (success) {
      return {
        success: true,
        costs: {
          fuel: EVASIVE.SUCCESS_FUEL_COST,
          engine: EVASIVE.SUCCESS_ENGINE_COST,
        },
        rewards: {},
        description: 'Successfully evaded the pirates using evasive maneuvers.',
      };
    } else {
      if (this.checkLuckyShipNegate(gameState, rng)) {
        return {
          success: true,
          costs: {
            fuel: EVASIVE.SUCCESS_FUEL_COST,
            engine: EVASIVE.SUCCESS_ENGINE_COST,
          },
          rewards: {},
          description:
            'Lucky ship systems helped evade the pirates at the last moment.',
        };
      }

      let hullDamage = EVASIVE.FAILURE_HULL_DAMAGE;
      hullDamage = this.applyHullDamageModifiers(hullDamage, gameState);

      return {
        success: false,
        costs: {
          hull: hullDamage,
        },
        rewards: {},
        description:
          'Evasive maneuvers failed. Pirates scored hits on your hull.',
      };
    }
  }

  /**
   * Resolve return fire combat choice
   *
   * Success rate: 45% base chance
   * Success: -10% hull damage, +5 outlaw reputation
   * Failure: -30% hull damage, lose all cargo and ₡500 credits
   *
   * @param {Object} encounter - The pirate encounter
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Combat outcome
   */
  resolveReturnFire(encounter, gameState, rng) {
    const { RETURN_FIRE } = COMBAT_CONFIG;

    let successChance = RETURN_FIRE.BASE_CHANCE;

    successChance += calculateKarmaModifier(gameState.player.karma);
    successChance -= encounter.strengthModifier || 0;

    successChance = Math.max(0, Math.min(1, successChance));

    const success = rng < successChance;

    if (success) {
      let hullDamage = RETURN_FIRE.SUCCESS_HULL_DAMAGE;
      hullDamage = this.applyHullDamageModifiers(hullDamage, gameState);

      return {
        success: true,
        costs: {
          hull: hullDamage,
        },
        rewards: {
          factionRep: {
            outlaws: RETURN_FIRE.SUCCESS_OUTLAW_REP,
          },
        },
        description:
          'You drove off the pirates, but not before taking some hits. Your hull shows fresh scoring.',
      };
    } else {
      if (this.checkLuckyShipNegate(gameState, rng)) {
        let hullDamage = RETURN_FIRE.SUCCESS_HULL_DAMAGE;
        hullDamage = this.applyHullDamageModifiers(hullDamage, gameState);

        return {
          success: true,
          costs: {
            hull: hullDamage,
          },
          rewards: {
            factionRep: {
              outlaws: RETURN_FIRE.SUCCESS_OUTLAW_REP,
            },
          },
          description:
            'Lucky ship systems turned the tide of battle in your favor.',
        };
      }

      let hullDamage = RETURN_FIRE.FAILURE_HULL_DAMAGE;
      hullDamage = this.applyHullDamageModifiers(hullDamage, gameState);

      return {
        success: false,
        costs: {
          hull: hullDamage,
          credits: RETURN_FIRE.FAILURE_CREDITS_LOSS,
          cargoLoss: true,
        },
        rewards: {},
        description: 'Return fire failed. Pirates boarded and took everything.',
      };
    }
  }

  /**
   * Resolve dump cargo combat choice
   *
   * Success rate: 100% (guaranteed)
   * Cost: -50% cargo, -10% fuel
   *
   * @returns {Object} Combat outcome
   */
  resolveDumpCargo() {
    const { DUMP_CARGO } = COMBAT_CONFIG;

    return {
      success: true,
      costs: {
        cargoPercent: DUMP_CARGO.CARGO_LOSS_PERCENT,
        fuel: DUMP_CARGO.FUEL_COST,
      },
      rewards: {},
      description: 'Dumped cargo to distract pirates and escaped safely.',
    };
  }

  /**
   * Resolve distress call combat choice
   *
   * Success rate: 30% base chance
   * Success: +5 authority reputation (patrol arrives)
   * Failure: -25% hull damage (pirates attack while waiting)
   *
   * @param {Object} encounter - The pirate encounter
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Combat outcome
   */
  resolveDistressCall(encounter, gameState, rng) {
    const { DISTRESS_CALL } = COMBAT_CONFIG;

    let successChance = DISTRESS_CALL.BASE_CHANCE;

    if (gameState.ship.quirks.includes('sensitive_sensors')) {
      successChance += COMBAT_CONFIG.MODIFIERS.sensitive_sensors.distressBonus;
    }

    successChance += calculateKarmaModifier(gameState.player.karma);
    successChance -= encounter.strengthModifier || 0;

    successChance = Math.max(0, Math.min(1, successChance));

    const success = rng < successChance;

    if (success) {
      return {
        success: true,
        costs: {},
        rewards: {
          factionRep: {
            authorities: DISTRESS_CALL.SUCCESS_REP_GAIN,
          },
        },
        description:
          'Patrol responded to distress call and drove off the pirates.',
      };
    } else {
      if (this.checkLuckyShipNegate(gameState, rng)) {
        return {
          success: true,
          costs: {},
          rewards: {
            factionRep: {
              authorities: DISTRESS_CALL.SUCCESS_REP_GAIN,
            },
          },
          description:
            'Lucky ship systems boosted the distress signal at the last moment.',
        };
      }

      let hullDamage = DISTRESS_CALL.FAILURE_HULL_DAMAGE;
      hullDamage = this.applyHullDamageModifiers(hullDamage, gameState);

      return {
        success: false,
        costs: {
          hull: hullDamage,
        },
        rewards: {},
        description: 'No patrol response. Pirates attacked while you waited.',
      };
    }
  }

  /**
   * Check if lucky_ship quirk negates a bad outcome
   *
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for luck determination
   * @returns {boolean} True if lucky ship negates the bad outcome
   */
  checkLuckyShipNegate(gameState, rng) {
    if (!gameState.ship.quirks.includes('lucky_ship')) {
      return false;
    }

    const baseChance = COMBAT_CONFIG.MODIFIERS.lucky_ship.negateChanceBase;
    const karmaBonus =
      gameState.player.karma * KARMA_CONFIG.LUCKY_SHIP_KARMA_SCALE;
    const luckyChance = baseChance + karmaBonus;

    return rng < luckyChance;
  }

  /**
   * Apply hull damage modifiers from quirks and upgrades
   *
   * @param {number} baseDamage - Base hull damage amount
   * @param {Object} gameState - Current game state
   * @returns {number} Modified hull damage amount
   */
  applyHullDamageModifiers(baseDamage, gameState) {
    let modifiedDamage = baseDamage;

    if (gameState.ship.upgrades.includes('reinforced_hull')) {
      const reduction = COMBAT_CONFIG.MODIFIERS.reinforced_hull.damageReduction;
      modifiedDamage *= 1 - reduction;
    }

    if (gameState.ship.quirks.includes('leaky_seals')) {
      const increase = COMBAT_CONFIG.MODIFIERS.leaky_seals.damageIncrease;
      modifiedDamage *= 1 + increase;
    }

    return Math.max(1, Math.round(modifiedDamage));
  }
}
