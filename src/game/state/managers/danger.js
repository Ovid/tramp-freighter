import { BaseManager } from './base-manager.js';
import {
  DANGER_CONFIG,
  KARMA_CONFIG,
  FACTION_CONFIG,
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
    const { ZONES, CARGO_VALUE_MODIFIERS, ENGINE_CONDITION_MODIFIER, 
            ADVANCED_SENSORS_PIRATE_REDUCTION, FACTION_REPUTATION_SCALES } = DANGER_CONFIG;

    // Start with base rate for the zone type
    let probability = ZONES[zone].pirateChance;

    // Apply cargo value modifiers (Requirements 2.7, 2.8)
    const cargoValue = this.calculateCargoValue(gameState.ship.cargo);
    if (cargoValue >= CARGO_VALUE_MODIFIERS.HIGH_VALUE_THRESHOLD) {
      probability *= CARGO_VALUE_MODIFIERS.HIGH_VALUE_MULTIPLIER; // 1.5x for cargo > ₡10,000
    } else if (cargoValue >= CARGO_VALUE_MODIFIERS.LOW_VALUE_THRESHOLD) {
      probability *= CARGO_VALUE_MODIFIERS.LOW_VALUE_MULTIPLIER; // 1.2x for cargo > ₡5,000
    }

    // Apply engine condition modifier (Requirement 2.9)
    if (gameState.ship.engine < ENGINE_CONDITION_MODIFIER.POOR_CONDITION_THRESHOLD) {
      probability *= ENGINE_CONDITION_MODIFIER.POOR_CONDITION_MULTIPLIER; // 1.1x for engine < 50%
    }

    // Apply advanced sensors modifier (Requirement 2.10)
    if (gameState.ship.upgrades && gameState.ship.upgrades.includes('advanced_sensors')) {
      probability *= ADVANCED_SENSORS_PIRATE_REDUCTION; // 0.8x with advanced sensors
    }

    // Apply faction reputation modifiers (Requirement 8.8)
    const outlawRep = gameState.player.factions.outlaws;
    const authorityRep = gameState.player.factions.authorities;

    // Outlaw reputation reduces pirate encounters (they recognize you as one of them)
    const outlawModifier = 1 + (outlawRep / 100) * FACTION_REPUTATION_SCALES.OUTLAW_PIRATE_REDUCTION_SCALE;
    probability *= outlawModifier;

    // Authority reputation affects pirate encounters (less patrol protection at low rep)
    const authorityModifier = 1 + (authorityRep / 100) * FACTION_REPUTATION_SCALES.AUTHORITY_PIRATE_INCREASE_SCALE;
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
    if (!cargo || !Array.isArray(cargo)) {
      return 0;
    }

    return cargo.reduce((total, item) => {
      return total + (item.quantity * item.purchasePrice);
    }, 0);
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
}
