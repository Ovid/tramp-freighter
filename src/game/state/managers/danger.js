import { BaseManager } from './base-manager.js';
import {
  DANGER_CONFIG,
  KARMA_CONFIG,
  FACTION_CONFIG,
  COMBAT_CONFIG,
  NEGOTIATION_CONFIG,
  INSPECTION_CONFIG,
  calculateDistanceFromSol,
} from '../../constants.js';

/**
 * DangerManager - Handles danger zone classification and encounter mechanics
 *
 * Danger zones classify star systems based on pirate activity and law enforcement:
 * - Safe: Core systems with strong law enforcement presence
 * - Contested: Systems with mixed control and moderate risk
 * - Dangerous: Frontier systems with high pirate activity
 *
 * WHY deterministic classification:
 * - Provides predictable gameplay where players can learn system safety levels
 * - Enables strategic route planning based on known risk/reward tradeoffs
 * - Avoids frustrating randomness in core game mechanics
 *
 * WHY distance-based thresholds:
 * - Reflects realistic decline in central authority influence over distance
 * - Creates intuitive mental model: closer to Sol = safer, frontier = dangerous
 * - Scales automatically with any future starmap expansions
 *
 * WHY these zone types:
 * - Three tiers provide clear risk gradation without overwhelming complexity
 * - Maps to common space opera tropes (core worlds, border systems, frontier)
 * - Allows for distinct gameplay mechanics per zone type
 *
 * Classification is deterministic based on:
 * 1. Explicit system lists in DANGER_CONFIG (safe, contested)
 * 2. Distance from Sol (systems beyond threshold are dangerous)
 *
 * Feature: danger-system
 * Validates: Requirements 1.1, 1.2, 1.10, 1.11, 1.12, 8.3, 9.1, 9.2, 9.3
 */
export class DangerManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  /**
   * Get the danger zone classification for a star system
   *
   * Classification priority:
   * 1. Check if system is explicitly listed as safe
   * 2. Check if system is explicitly listed as contested
   * 3. Check if system is beyond distance threshold (dangerous)
   * 4. Default to contested for unlisted systems within threshold
   *
   * @param {number} systemId - The star system ID to classify
   * @returns {string} Zone type: 'safe', 'contested', or 'dangerous'
   */
  getDangerZone(systemId) {
    const { ZONES } = DANGER_CONFIG;

    // Check explicit safe systems first
    if (ZONES.safe.systems.includes(systemId)) {
      return 'safe';
    }

    // Check explicit contested systems
    if (ZONES.contested.systems.includes(systemId)) {
      return 'contested';
    }

    // Check distance-based dangerous classification
    const system = this.getStarData().find((s) => s.id === systemId);
    if (system) {
      const distance = calculateDistanceFromSol(system);
      if (distance > ZONES.dangerous.distanceThreshold) {
        return 'dangerous';
      }
    }

    // Default to contested for unlisted systems within threshold
    return 'contested';
  }

  // ========================================================================
  // KARMA SYSTEM
  // ========================================================================

  /**
   * Get the current karma value
   *
   * Karma represents the player's moral alignment and affects random event outcomes,
   * NPC first impressions, and success rates for various encounters.
   *
   * Feature: danger-system, Property 12: Karma Clamping
   * Validates: Requirements 9.1
   *
   * @returns {number} Current karma value, clamped to range [-100, 100]
   */
  getKarma() {
    this.validateState();
    return this.getState().player.karma;
  }

  /**
   * Modify karma by a given amount with automatic clamping
   *
   * Karma is automatically clamped to the range [-100, 100] after modification.
   * Emits 'karmaChanged' event with the new value for UI reactivity.
   * Changes are automatically saved to localStorage.
   *
   * Feature: danger-system, Property 12: Karma Clamping
   * Validates: Requirements 9.1, 9.2, 9.3
   *
   * @param {number} amount - Amount to add (positive) or subtract (negative) from current karma
   * @param {string} reason - Description of why karma changed (for logging and UI feedback)
   */
  modifyKarma(amount, reason) {
    this.validateState();

    const currentKarma = this.getState().player.karma;
    const newKarma = Math.max(
      KARMA_CONFIG.MIN,
      Math.min(KARMA_CONFIG.MAX, currentKarma + amount)
    );

    this.getState().player.karma = newKarma;

    this.log(
      `Karma changed by ${amount} (${reason}): ${currentKarma} -> ${newKarma}`
    );
    this.emit('karmaChanged', { karma: newKarma, change: amount, reason });
  }

  // ========================================================================
  // PIRATE ENCOUNTER SYSTEM
  // ========================================================================

  /**
   * Calculate the probability of a pirate encounter for a given system
   *
   * Applies zone-specific base rates and all modifiers from cargo value,
   * engine condition, upgrades, and faction reputation. Final probability
   * is clamped to [0, 1] range.
   *
   * Feature: danger-system, Property 2: Zone-Specific Encounter Rates
   * Feature: danger-system, Property 3: Encounter Probability Modifiers
   * Validates: Requirements 2.1, 2.7, 2.8, 2.9, 2.10, 8.8
   *
   * @param {number} systemId - The destination system ID
   * @param {Object} gameState - Current game state for modifier calculations
   * @returns {number} Probability of pirate encounter (0.0 to 1.0)
   */
  calculatePirateEncounterChance(systemId, gameState) {
    const zone = this.getDangerZone(systemId);

    // Destructure all needed config values for better performance and readability
    const {
      ZONES,
      CARGO_VALUE_MODIFIERS: {
        HIGH_VALUE_THRESHOLD,
        HIGH_VALUE_MULTIPLIER,
        LOW_VALUE_THRESHOLD,
        LOW_VALUE_MULTIPLIER,
      },
      ENGINE_CONDITION_MODIFIER: {
        POOR_CONDITION_THRESHOLD,
        POOR_CONDITION_MULTIPLIER,
      },
      ADVANCED_SENSORS_PIRATE_REDUCTION,
      FACTION_REPUTATION_SCALES: {
        OUTLAW_PIRATE_REDUCTION_SCALE,
        AUTHORITY_PIRATE_INCREASE_SCALE,
      },
    } = DANGER_CONFIG;

    // Start with base rate for the zone type
    let probability = ZONES[zone].pirateChance;

    // Apply cargo value modifiers (Requirements 2.7, 2.8)
    const cargoValue = this.calculateCargoValue(gameState.ship.cargo);
    if (cargoValue >= HIGH_VALUE_THRESHOLD) {
      probability *= HIGH_VALUE_MULTIPLIER; // 1.5x for cargo > ₡10,000
    } else if (cargoValue >= LOW_VALUE_THRESHOLD) {
      probability *= LOW_VALUE_MULTIPLIER; // 1.2x for cargo > ₡5,000
    }

    // Apply engine condition modifier (Requirement 2.9)
    if (gameState.ship.engine < POOR_CONDITION_THRESHOLD) {
      probability *= POOR_CONDITION_MULTIPLIER; // 1.1x for engine < 50%
    }

    // Apply advanced sensors modifier (Requirement 2.10)
    if (
      gameState.ship.upgrades &&
      gameState.ship.upgrades.includes('advanced_sensors')
    ) {
      probability *= ADVANCED_SENSORS_PIRATE_REDUCTION; // 0.8x with advanced sensors
    }

    // Apply faction reputation modifiers (Requirement 8.8)
    const outlawRep = gameState.player.factions.outlaws;
    const authorityRep = gameState.player.factions.authorities;

    // Outlaw reputation reduces pirate encounters (they recognize you as one of them)
    const outlawModifier =
      1 + (outlawRep / 100) * OUTLAW_PIRATE_REDUCTION_SCALE;
    probability *= outlawModifier;

    // Authority reputation affects pirate encounters (less patrol protection at low rep)
    const authorityModifier =
      1 + (authorityRep / 100) * AUTHORITY_PIRATE_INCREASE_SCALE;
    probability *= authorityModifier;

    // Clamp final probability to [0, 1] range
    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Calculate the total value of cargo in the ship's hold
   *
   * Helper method for pirate encounter probability calculation.
   * Sums the value of all cargo based on purchase prices.
   *
   * @param {Array} cargo - Array of cargo objects with quantity and purchasePrice
   * @returns {number} Total cargo value in credits
   */
  calculateCargoValue(cargo) {
    return cargo.reduce((total, item) => {
      return total + item.quantity * item.purchasePrice;
    }, 0);
  }

  // ========================================================================
  // INSPECTION SYSTEM
  // ========================================================================

  /**
   * Calculate the probability of a customs inspection for a given system
   *
   * Applies zone-specific base rates and all modifiers from restricted goods,
   * core systems multiplier, and faction reputation. Final probability
   * is clamped to [0, 1] range.
   *
   * Feature: danger-system, Property 8: Inspection Probability Scaling
   * Validates: Requirements 5.1, 5.2, 5.12, 8.8
   *
   * @param {number} systemId - The destination system ID
   * @param {Object} gameState - Current game state for modifier calculations
   * @returns {number} Probability of customs inspection (0.0 to 1.0)
   */
  calculateInspectionChance(systemId, gameState) {
    const zone = this.getDangerZone(systemId);

    // Destructure all needed config values for better performance and readability
    const {
      ZONES,
      CORE_SYSTEMS_INSPECTION_MULTIPLIER,
      RESTRICTED_GOODS_INSPECTION_INCREASE,
      FACTION_REPUTATION_SCALES: { AUTHORITY_INSPECTION_REDUCTION_SCALE },
    } = DANGER_CONFIG;

    // Start with base rate for the zone type (Requirement 5.2)
    let probability = ZONES[zone].inspectionChance;

    // Apply core systems multiplier (Requirement 5.12)
    // Core systems (Sol = 0, Alpha Centauri = 1) have doubled inspection rates
    if (systemId === 0 || systemId === 1) {
      probability *= CORE_SYSTEMS_INSPECTION_MULTIPLIER; // 2x for core systems
    }

    // Apply restricted goods modifier (Requirement 5.2)
    // Modifier = 1 + (count * 0.1), so each restricted good adds 10% to inspection chance
    const restrictedGoodsCount = this.countRestrictedGoods(
      gameState.ship.cargo
    );
    const restrictedModifier =
      1 + restrictedGoodsCount * RESTRICTED_GOODS_INSPECTION_INCREASE;
    probability *= restrictedModifier;

    // Apply faction reputation modifier (Requirement 8.8)
    // High authority reputation reduces inspection chance (they trust you)
    const authorityRep = gameState.player.factions.authorities;
    const factionModifier =
      1 + (authorityRep / 100) * AUTHORITY_INSPECTION_REDUCTION_SCALE;
    probability *= factionModifier;

    // Clamp final probability to [0, 1] range
    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Count the number of restricted goods in cargo
   *
   * Helper method for inspection probability calculation.
   * For now, this is a placeholder that counts all cargo items as potentially restricted.
   * This will be enhanced when the restricted goods system is fully implemented.
   *
   * @param {Array} cargo - Array of cargo objects
   * @returns {number} Number of restricted goods in cargo
   */
  countRestrictedGoods(cargo) {
    // For now, treat all cargo as potentially restricted for testing purposes
    // This will be replaced with actual restricted goods logic in future tasks
    return cargo.length;
  }

  // ========================================================================
  // COMBAT RESOLUTION SYSTEM
  // ========================================================================

  /**
   * Resolve a combat choice and return the outcome
   *
   * Implements tactical combat resolution with choice-driven outcomes.
   * Each choice has specific success rates, costs, and rewards based on
   * the COMBAT_CONFIG configuration.
   *
   * Feature: danger-system, Property 4: Combat Resolution Outcomes
   * Validates: Requirements 3.1-3.11, 8.7
   *
   * @param {Object} encounter - The pirate encounter object
   * @param {string} choice - Combat choice ('evasive', 'return_fire', 'dump_cargo', 'distress_call')
   * @returns {Object} Combat outcome with success, costs, rewards, and description
   */
  resolveCombatChoice(encounter, choice) {
    this.validateState();

    const gameState = this.getState();

    // Generate random number for success determination
    const rng = Math.random();

    switch (choice) {
      case 'evasive':
        return this.resolveEvasiveManeuvers(encounter, gameState, rng);
      case 'return_fire':
        return this.resolveReturnFire(encounter, gameState, rng);
      case 'dump_cargo':
        return this.resolveDumpCargo();
      case 'distress_call':
        return this.resolveDistressCall(encounter, gameState, rng);
      default:
        throw new Error(`Unknown combat choice: ${choice}`);
    }
  }

  /**
   * Resolve evasive maneuvers combat choice
   *
   * Evasive maneuvers attempt to flee using engine power.
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

    // Calculate success chance with modifiers
    let successChance = EVASIVE.BASE_CHANCE;

    // Apply hot_thruster quirk bonus
    if (
      gameState.ship.quirks &&
      gameState.ship.quirks.includes('hot_thruster')
    ) {
      successChance += COMBAT_CONFIG.MODIFIERS.hot_thruster.evasiveBonus;
    }

    // Apply efficient_drive upgrade bonus (affects flee attempts)
    if (
      gameState.ship.upgrades &&
      gameState.ship.upgrades.includes('efficient_drive')
    ) {
      successChance += COMBAT_CONFIG.MODIFIERS.efficient_drive.fleeBonus;
    }

    // Apply karma as hidden modifier
    successChance += this.calculateKarmaModifier(gameState.player.karma);

    // Clamp success chance to [0, 1]
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
      // Apply lucky_ship quirk chance to negate bad outcome
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

      // Calculate hull damage with modifiers
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
   * Return fire engages in direct combat with the pirates.
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

    // Calculate success chance with modifiers
    let successChance = RETURN_FIRE.BASE_CHANCE;

    // Apply karma as hidden modifier
    successChance += this.calculateKarmaModifier(gameState.player.karma);

    // Clamp success chance to [0, 1]
    successChance = Math.max(0, Math.min(1, successChance));

    const success = rng < successChance;

    if (success) {
      // Calculate hull damage with modifiers
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
        description: 'Successfully drove off the pirates with return fire.',
      };
    } else {
      // Apply lucky_ship quirk chance to negate bad outcome
      if (this.checkLuckyShipNegate(gameState, rng)) {
        // Convert failure to success with lucky ship
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

      // Calculate hull damage with modifiers
      let hullDamage = RETURN_FIRE.FAILURE_HULL_DAMAGE;
      hullDamage = this.applyHullDamageModifiers(hullDamage, gameState);

      return {
        success: false,
        costs: {
          hull: hullDamage,
          credits: RETURN_FIRE.FAILURE_CREDITS_LOSS,
          cargoLoss: true, // Indicates all cargo is lost
        },
        rewards: {},
        description: 'Return fire failed. Pirates boarded and took everything.',
      };
    }
  }

  /**
   * Resolve dump cargo combat choice
   *
   * Dump cargo guarantees escape but loses cargo and fuel.
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
   * Distress call attempts to summon patrol assistance.
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

    // Calculate success chance with modifiers
    let successChance = DISTRESS_CALL.BASE_CHANCE;

    // Apply sensitive_sensors quirk bonus
    if (
      gameState.ship.quirks &&
      gameState.ship.quirks.includes('sensitive_sensors')
    ) {
      successChance += COMBAT_CONFIG.MODIFIERS.sensitive_sensors.distressBonus;
    }

    // Apply karma as hidden modifier
    successChance += this.calculateKarmaModifier(gameState.player.karma);

    // Clamp success chance to [0, 1]
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
      // Apply lucky_ship quirk chance to negate bad outcome
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

      // Calculate hull damage with modifiers
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

  // ========================================================================
  // NEGOTIATION SYSTEM
  // ========================================================================

  /**
   * Resolve a negotiation choice and return the outcome
   *
   * Implements dialogue-based pirate encounter resolution with contextual options.
   * Each choice has specific success rates, costs, and rewards based on
   * the NEGOTIATION_CONFIG configuration.
   *
   * Feature: danger-system, Property 6: Negotiation Outcomes
   * Validates: Requirements 4.1-4.11, 8.7, 9.4, 9.10
   *
   * @param {Object} encounter - The pirate encounter object
   * @param {string} choice - Negotiation choice ('counter_proposal', 'medicine_claim', 'intel_offer', 'accept_demand')
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Negotiation outcome with success, costs, rewards, and description
   */
  resolveNegotiation(encounter, choice, rng) {
    this.validateState();

    const gameState = this.getState();

    switch (choice) {
      case 'counter_proposal':
        return this.resolveCounterProposal(encounter, gameState, rng);
      case 'medicine_claim':
        return this.resolveMedicineClaim(encounter, gameState, rng);
      case 'intel_offer':
        return this.resolveIntelOffer(encounter, gameState, rng);
      case 'accept_demand':
        return this.resolveAcceptDemand();
      default:
        throw new Error(`Unknown negotiation choice: ${choice}`);
    }
  }

  /**
   * Resolve counter-proposal negotiation choice
   *
   * Counter-proposal attempts to negotiate a lower payment.
   * Success rate: 60% base chance + karma modifier
   * Success: 10% cargo payment instead of full demand
   * Failure: +10% enemy strength increase, forces combat
   *
   * @param {Object} encounter - The pirate encounter
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Negotiation outcome
   */
  resolveCounterProposal(encounter, gameState, rng) {
    const { COUNTER_PROPOSAL } = NEGOTIATION_CONFIG;

    // Calculate success chance with karma modifier
    let successChance = COUNTER_PROPOSAL.BASE_CHANCE;
    successChance += this.calculateKarmaModifier(gameState.player.karma);

    // Clamp success chance to [0, 1]
    successChance = Math.max(0, Math.min(1, successChance));

    const success = rng < successChance;

    if (success) {
      return {
        success: true,
        costs: {
          cargoPercent: COUNTER_PROPOSAL.SUCCESS_CARGO_PERCENT,
        },
        rewards: {},
        description:
          'Successfully negotiated a reduced payment with the pirates.',
      };
    } else {
      return {
        success: false,
        costs: {
          strengthIncrease: COUNTER_PROPOSAL.FAILURE_STRENGTH_INCREASE,
        },
        rewards: {},
        description: 'Negotiation failed. Pirates are now more aggressive.',
      };
    }
  }

  /**
   * Resolve medicine claim negotiation choice
   *
   * Medicine claim attempts to gain pirate sympathy by claiming to carry medicine.
   * Only available if medicine is actually in cargo.
   * Success rate: 40% sympathy chance if medicine present
   * Success: Free passage
   * Failure: Forces combat or other consequence
   *
   * @param {Object} encounter - The pirate encounter
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Negotiation outcome
   */
  resolveMedicineClaim(encounter, gameState, rng) {
    const { MEDICINE_CLAIM } = NEGOTIATION_CONFIG;

    // Check if medicine is actually in cargo
    const hasMedicine = gameState.ship.cargo.some(
      (item) => item.type === 'medicine'
    );

    if (!hasMedicine) {
      return {
        success: false,
        costs: {
          strengthIncrease:
            NEGOTIATION_CONFIG.MEDICINE_CLAIM.LIE_STRENGTH_INCREASE,
        },
        rewards: {},
        description:
          'Pirates discovered you have no medicine. They are not pleased.',
      };
    }

    // Apply karma modifier to sympathy chance
    let sympathyChance = MEDICINE_CLAIM.SYMPATHY_CHANCE;
    sympathyChance += this.calculateKarmaModifier(gameState.player.karma);

    // Clamp sympathy chance to [0, 1]
    sympathyChance = Math.max(0, Math.min(1, sympathyChance));

    const success = rng < sympathyChance;

    if (success) {
      return {
        success: true,
        costs: {},
        rewards: {},
        description:
          'Pirates showed sympathy for your medical mission and let you pass.',
      };
    } else {
      return {
        success: false,
        costs: {
          cargoPercent: encounter.demandPercent || 20, // Fall back to standard demand
        },
        rewards: {},
        description:
          'Pirates acknowledged your medicine but still demanded payment.',
      };
    }
  }

  /**
   * Resolve intel offer negotiation choice
   *
   * Intel offer attempts to trade information about other ships for safe passage.
   * Only available if player has acquired prior intelligence.
   * Success: Free passage, +3 outlaw reputation for cooperating with pirates
   * Failure: Reputation penalty if discovered, forces combat
   *
   * @param {Object} encounter - The pirate encounter
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Negotiation outcome
   */
  resolveIntelOffer(encounter, gameState, rng) {
    const { INTEL_OFFER } = NEGOTIATION_CONFIG;

    // Check if player has prior intelligence to offer
    const hasPriorIntel = gameState.world.flags?.hasPriorIntel || false;

    if (!hasPriorIntel) {
      return {
        success: false,
        costs: {
          strengthIncrease:
            NEGOTIATION_CONFIG.INTEL_OFFER.SUSPICIOUS_STRENGTH_INCREASE,
        },
        rewards: {},
        description: 'You have no useful intelligence to offer the pirates.',
      };
    }

    // Intel offer has a high success rate but carries reputation risks
    // Apply karma modifier to success chance
    let successChance = NEGOTIATION_CONFIG.INTEL_OFFER.BASE_SUCCESS_RATE;
    successChance += this.calculateKarmaModifier(gameState.player.karma);

    // Clamp success chance to [0, 1]
    successChance = Math.max(0, Math.min(1, successChance));

    const success = rng < successChance;

    if (success) {
      return {
        success: true,
        costs: {},
        rewards: {
          factionRep: {
            outlaws: INTEL_OFFER.OUTLAW_REP_GAIN,
          },
        },
        description:
          'Pirates accepted your intelligence and let you pass. Your cooperation was noted.',
      };
    } else {
      return {
        success: false,
        costs: {
          reputationPenalty: INTEL_OFFER.SUCCESS_REP_PENALTY,
        },
        rewards: {},
        description:
          'Pirates rejected your intelligence offer and became suspicious.',
      };
    }
  }

  /**
   * Resolve accept demand negotiation choice
   *
   * Accept demand pays the pirates' initial demand for guaranteed safe passage.
   * Success rate: 100% (guaranteed)
   * Cost: 20% cargo payment
   *
   * @returns {Object} Negotiation outcome
   */
  resolveAcceptDemand() {
    const { ACCEPT_DEMAND } = NEGOTIATION_CONFIG;

    return {
      success: true,
      costs: {
        cargoPercent: ACCEPT_DEMAND.CARGO_PERCENT,
      },
      rewards: {},
      description:
        'Paid the pirates their demanded tribute and continued safely.',
    };
  }

  // ========================================================================
  // FACTION REPUTATION SYSTEM
  // ========================================================================

  /**
   * Get the reputation value for a specific faction
   *
   * Faction reputation affects encounter probabilities, NPC attitudes, and available
   * dialogue options. Each faction has independent reputation tracking.
   *
   * Feature: danger-system, Property 13: Faction Reputation Clamping
   * Validates: Requirements 8.1, 8.2
   *
   * @param {string} faction - Faction name (authorities, traders, outlaws, civilians)
   * @returns {number} Current faction reputation, clamped to range [-100, 100]
   * @throws {Error} If faction name is not valid (not in FACTION_CONFIG.FACTIONS)
   */
  getFactionRep(faction) {
    this.validateState();

    if (!FACTION_CONFIG.FACTIONS.includes(faction)) {
      throw new Error(
        `Invalid faction: ${faction}. Valid factions: ${FACTION_CONFIG.FACTIONS.join(', ')}`
      );
    }

    return this.getState().player.factions[faction];
  }

  /**
   * Modify faction reputation by a given amount with automatic clamping
   *
   * Faction reputation is automatically clamped to the range [-100, 100] after modification.
   * Emits 'factionRepChanged' event with the new value for UI reactivity.
   * Changes are automatically saved to localStorage.
   *
   * Feature: danger-system, Property 13: Faction Reputation Clamping
   * Validates: Requirements 8.3
   *
   * @param {string} faction - Faction name (authorities, traders, outlaws, civilians)
   * @param {number} amount - Amount to add (positive) or subtract (negative) from current reputation
   * @param {string} reason - Description of why reputation changed (for logging and UI feedback)
   * @throws {Error} If faction name is not valid (not in FACTION_CONFIG.FACTIONS)
   */
  modifyFactionRep(faction, amount, reason) {
    this.validateState();

    if (!FACTION_CONFIG.FACTIONS.includes(faction)) {
      throw new Error(
        `Invalid faction: ${faction}. Valid factions: ${FACTION_CONFIG.FACTIONS.join(', ')}`
      );
    }

    const currentRep = this.getState().player.factions[faction];
    const newRep = Math.max(
      FACTION_CONFIG.MIN,
      Math.min(FACTION_CONFIG.MAX, currentRep + amount)
    );

    this.getState().player.factions[faction] = newRep;

    this.log(
      `${faction} reputation changed by ${amount} (${reason}): ${currentRep} -> ${newRep}`
    );
    this.emit('factionRepChanged', {
      faction,
      rep: newRep,
      change: amount,
      reason,
    });
  }

  // ========================================================================
  // COMBAT MODIFIER HELPERS
  // ========================================================================

  /**
   * Calculate karma modifier for success rates
   *
   * Karma provides a hidden modifier to success rates, giving players with
   * high karma slightly better odds and players with low karma slightly worse odds.
   * The effect is subtle (±5% at extreme karma) to avoid making karma overpowered.
   *
   * @param {number} karma - Current karma value (-100 to +100)
   * @returns {number} Modifier to add to success rate (-0.05 to +0.05)
   */
  calculateKarmaModifier(karma) {
    // Karma affects success rates: ±5% at extreme karma
    return karma * KARMA_CONFIG.SUCCESS_RATE_SCALE;
  }

  /**
   * Check if lucky_ship quirk negates a bad outcome
   *
   * Lucky ship provides a chance to negate bad combat outcomes.
   * Base chance is 5%, scaled by karma (higher karma = better luck).
   * This represents the ship's systems working in the player's favor.
   *
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for luck determination
   * @returns {boolean} True if lucky ship negates the bad outcome
   */
  checkLuckyShipNegate(gameState, rng) {
    if (
      !gameState.ship.quirks ||
      !gameState.ship.quirks.includes('lucky_ship')
    ) {
      return false;
    }

    // Calculate lucky ship effectiveness with karma scaling
    const baseChance = COMBAT_CONFIG.MODIFIERS.lucky_ship.negateChanceBase;
    const karmaBonus =
      gameState.player.karma * KARMA_CONFIG.LUCKY_SHIP_KARMA_SCALE;
    const luckyChance = baseChance + karmaBonus;

    // Use the provided random number for luck check
    return rng < luckyChance;
  }

  /**
   * Apply hull damage modifiers from quirks and upgrades
   *
   * Modifies hull damage based on ship quirks and upgrades:
   * - reinforced_hull: Reduces damage by 25%
   * - leaky_seals: Increases damage by 10%
   *
   * @param {number} baseDamage - Base hull damage amount
   * @param {Object} gameState - Current game state
   * @returns {number} Modified hull damage amount
   */
  applyHullDamageModifiers(baseDamage, gameState) {
    let modifiedDamage = baseDamage;

    // Apply reinforced_hull upgrade (reduces damage)
    if (
      gameState.ship.upgrades &&
      gameState.ship.upgrades.includes('reinforced_hull')
    ) {
      const reduction = COMBAT_CONFIG.MODIFIERS.reinforced_hull.damageReduction;
      modifiedDamage *= 1 - reduction;
    }

    // Apply leaky_seals quirk (increases damage)
    if (
      gameState.ship.quirks &&
      gameState.ship.quirks.includes('leaky_seals')
    ) {
      const increase = COMBAT_CONFIG.MODIFIERS.leaky_seals.damageIncrease;
      modifiedDamage *= 1 + increase;
    }

    // Round to nearest integer and ensure minimum of 1 damage
    return Math.max(1, Math.round(modifiedDamage));
  }

  // ========================================================================
  // INSPECTION RESOLUTION SYSTEM
  // ========================================================================

  /**
   * Resolve an inspection choice and return the outcome
   *
   * Implements customs inspection resolution with choice-driven outcomes.
   * Each choice has specific success rates, costs, and rewards based on
   * the INSPECTION_CONFIG configuration.
   *
   * Feature: danger-system, Property 7: Inspection Outcomes
   * Validates: Requirements 5.3-5.11, 8.4, 8.5, 8.7, 11.8
   *
   * @param {string} choice - Inspection choice ('cooperate', 'bribe', 'flee')
   * @param {Object} gameState - Current game state
   * @param {number} rng - Random number (0-1) for success determination
   * @returns {Object} Inspection outcome with success, costs, rewards, and description
   */
  resolveInspection(choice, gameState, rng) {
    this.validateState();

    switch (choice) {
      case 'cooperate':
        return this.resolveInspectionCooperate(gameState, rng);
      case 'bribe':
        return this.resolveInspectionBribe(gameState, rng);
      case 'flee':
        return this.resolveInspectionFlee(gameState);
      default:
        throw new Error(`Unknown inspection choice: ${choice}`);
    }
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

    // Check for restricted goods in regular cargo
    const hasRestrictedGoods = gameState.ship.cargo && gameState.ship.cargo.length > 0;
    if (hasRestrictedGoods) {
      totalFine += INSPECTION_CONFIG.COOPERATE.RESTRICTED_FINE;
      restrictedGoodsConfiscated = true;
      // Apply penalty for restricted goods (this is added to the cooperation bonus)
      authorityRepChange += INSPECTION_CONFIG.REPUTATION_PENALTIES.RESTRICTED_GOODS;
    }

    // Check for hidden cargo discovery
    const hasHiddenCargo = gameState.ship.hiddenCargo && gameState.ship.hiddenCargo.length > 0;
    if (hasHiddenCargo) {
      // Determine security level based on current system (use system 0 as default for testing)
      const currentSystem = gameState.player.currentSystem || 0;
      const zone = this.getDangerZone(currentSystem);
      
      // Apply security level multiplier for hidden cargo discovery
      // Core systems (0, 1) should use core multiplier regardless of zone
      let securityMultiplier;
      if (currentSystem === 0 || currentSystem === 1) {
        securityMultiplier = INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS.core;
      } else {
        securityMultiplier = INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS[zone];
      }
      
      const discoveryChance = INSPECTION_CONFIG.HIDDEN_CARGO_DISCOVERY_CHANCE * securityMultiplier;

      if (rng < discoveryChance) {
        totalFine += INSPECTION_CONFIG.COOPERATE.HIDDEN_FINE;
        hiddenCargoConfiscated = true;
        // Override with penalty for hidden cargo discovery
        authorityRepChange = INSPECTION_CONFIG.REPUTATION_PENALTIES.HIDDEN_CARGO;
        outlawRepChange = INSPECTION_CONFIG.REPUTATION_PENALTIES.SMUGGLING_OUTLAW_BONUS;
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

    // Add confiscation flags if applicable
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
   * Bribery attempts to avoid inspection through corruption.
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
      description = 'Successfully bribed customs inspector and avoided inspection.';
    } else {
      totalCost += INSPECTION_CONFIG.BRIBE.FAILURE_ADDITIONAL_FINE;
      description = 'Bribery attempt failed. Inspector imposed additional penalties.';
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
   * Flee attempts to escape the inspection by running.
   * This triggers a patrol combat encounter and applies reputation penalties.
   *
   * @param {Object} gameState - Current game state
   * @returns {Object} Inspection outcome
   */
  resolveInspectionFlee(gameState) {
    return {
      success: false,
      triggerPatrolCombat: true,
      costs: {},
      rewards: {
        factionRep: {
          authorities: INSPECTION_CONFIG.FLEE.AUTHORITY_REP_PENALTY,
        },
      },
      description: 'Fled from customs inspection. Patrol ships are in pursuit.',
    };
  }
}
