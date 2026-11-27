import { BaseManager } from './base-manager.js';
import { COMBAT_CONFIG, KARMA_CONFIG, SHIP_CONFIG } from '../../constants.js';
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
  /**
   * Resolve a combat choice and return the outcome
   *
   * @param {Object} encounter - The pirate encounter object
   * @param {string} choice - Combat choice ('evasive', 'return_fire', 'dump_cargo', 'distress_call')
   * @returns {Object} Combat outcome with success, costs, rewards, and description
   */
  resolveCombatChoice(encounter, choice) {
    this.validateState();

    const stateView = this._buildStateView();

    const rng = this._nextRoll();

    let result;
    switch (choice) {
      case 'evasive':
        result = this.resolveEvasiveManeuvers(encounter, stateView, rng);
        break;
      case 'return_fire':
        result = this.resolveReturnFire(encounter, stateView, rng);
        break;
      case 'dump_cargo':
        result = this.resolveDumpCargo();
        break;
      case 'distress_call':
        result = this.resolveDistressCall(encounter, stateView, rng);
        break;
      default:
        throw new Error(`Unknown combat choice: ${choice}`);
    }

    this.capabilities.incrementDangerFlag('piratesFought');
    return result;
  }

  /**
   * Success chances for each rolled combat option, with the modifiers that
   * produced them. The resolvers roll against these same numbers, so what
   * the player is shown is what the game uses.
   *
   * @param {Object} encounter - The pirate encounter (may carry strengthModifier)
   * @returns {{evasive: Odds, returnFire: Odds, distressCall: Odds}} where
   *   Odds is {finalChance: number, modifiers: Array<{name, value, type}>}
   */
  getCombatOdds(encounter) {
    const gameState = this._buildStateView();
    return {
      evasive: this.calculateEvasiveOdds(encounter, gameState),
      returnFire: this.calculateReturnFireOdds(encounter, gameState),
      distressCall: this.calculateDistressCallOdds(encounter, gameState),
    };
  }

  /**
   * Next random number for this day and system. Nothing between two choices
   * in one encounter changes the day or system, so a fresh generator per
   * call would hand every choice the same number. Keeping the generator and
   * advancing it gives each roll its own number while staying reproducible.
   */
  _nextRoll() {
    const seed = buildEncounterSeed(
      this.capabilities.getDaysElapsed(),
      this.capabilities.getCurrentSystem(),
      'combat'
    );
    if (this._rollSeed !== seed) {
      this._rollSeed = seed;
      this._roller = new SeededRandom(seed);
    }
    return this._roller.next();
  }

  _buildStateView() {
    return {
      player: { karma: this.capabilities.getKarma() },
      ship: {
        quirks: this.capabilities.getShipQuirks(),
        upgrades: this.capabilities.getShipUpgrades(),
        engine: this.capabilities.getShipEngine(),
      },
    };
  }

  calculateEvasiveOdds(encounter, gameState) {
    const modifiers = [];
    const engine = gameState.ship.engine ?? SHIP_CONFIG.CONDITION_BOUNDS.MAX;
    if (engine < COMBAT_CONFIG.ENGINE_PENALTY_THRESHOLD) {
      modifiers.push(
        penalty('Poor Engine Condition', COMBAT_CONFIG.ENGINE_PENALTY_VALUE)
      );
    }
    if (gameState.ship.quirks.includes('hot_thruster')) {
      modifiers.push(
        bonus(
          'Hot Thruster Quirk',
          COMBAT_CONFIG.MODIFIERS.hot_thruster.evasiveBonus
        )
      );
    }
    if (gameState.ship.upgrades.includes('efficient_drive')) {
      modifiers.push(
        bonus(
          'Efficient Drive Upgrade',
          COMBAT_CONFIG.MODIFIERS.efficient_drive.fleeBonus
        )
      );
    }
    return finishOdds(
      COMBAT_CONFIG.EVASIVE.BASE_CHANCE,
      modifiers,
      encounter,
      gameState
    );
  }

  calculateReturnFireOdds(encounter, gameState) {
    return finishOdds(
      COMBAT_CONFIG.RETURN_FIRE.BASE_CHANCE,
      [],
      encounter,
      gameState
    );
  }

  calculateDistressCallOdds(encounter, gameState) {
    const modifiers = [];
    if (gameState.ship.quirks.includes('sensitive_sensors')) {
      modifiers.push(
        bonus(
          'Sensitive Sensors Quirk',
          COMBAT_CONFIG.MODIFIERS.sensitive_sensors.distressBonus
        )
      );
    }
    return finishOdds(
      COMBAT_CONFIG.DISTRESS_CALL.BASE_CHANCE,
      modifiers,
      encounter,
      gameState
    );
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

    const success =
      rng < this.calculateEvasiveOdds(encounter, gameState).finalChance;

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

    const success =
      rng < this.calculateReturnFireOdds(encounter, gameState).finalChance;

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

    const success =
      rng < this.calculateDistressCallOdds(encounter, gameState).finalChance;

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

const bonus = (name, value) => ({ name, value, type: 'bonus' });
const penalty = (name, value) => ({ name, value, type: 'penalty' });

/**
 * Apply the modifiers every combat option shares (karma, escalated
 * encounter strength) and clamp to a probability.
 */
function finishOdds(baseChance, modifiers, encounter, gameState) {
  const karma = gameState.player.karma;
  const karmaModifier = calculateKarmaModifier(karma);
  const strength = encounter?.strengthModifier || 0;
  const total =
    baseChance +
    modifiers.reduce((sum, m) => sum + m.value, 0) +
    karmaModifier -
    strength;

  // Karma always applies; it is only listed once it moves the odds visibly
  if (Math.abs(karmaModifier) > COMBAT_CONFIG.MIN_DISPLAYED_MODIFIER) {
    modifiers.push(
      karma > 0
        ? bonus('Good Karma', karmaModifier)
        : penalty('Bad Karma', karmaModifier)
    );
  }
  if (strength) {
    modifiers.push(penalty('Escalated Threat', -strength));
  }
  return { finalChance: Math.max(0, Math.min(1, total)), modifiers };
}
