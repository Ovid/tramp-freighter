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
   * Feature: danger-system, Property 12: Karma Clamping
   * Validates: Requirements 9.1
   *
   * @returns {number} Current karma value (-100 to 100)
   */
  getKarma() {
    this.validateState();
    return this.getState().player.karma;
  }

  /**
   * Modify karma by a given amount with clamping
   *
   * Karma is clamped to the range [-100, 100] after modification.
   * Emits 'karmaChanged' event with the new value.
   *
   * Feature: danger-system, Property 12: Karma Clamping
   * Validates: Requirements 9.1, 9.2, 9.3
   *
   * @param {number} amount - Amount to add (positive) or subtract (negative)
   * @param {string} reason - Description of why karma changed (for logging/UI)
   */
  modifyKarma(amount, reason) {
    this.validateState();

    const currentKarma = this.getState().player.karma;
    const newKarma = Math.max(
      KARMA_CONFIG.MIN,
      Math.min(KARMA_CONFIG.MAX, currentKarma + amount)
    );

    this.getState().player.karma = newKarma;

    this.log(`Karma changed by ${amount} (${reason}): ${currentKarma} -> ${newKarma}`);
    this.emit('karmaChanged', { karma: newKarma, change: amount, reason });
  }

  // ========================================================================
  // FACTION REPUTATION SYSTEM
  // ========================================================================

  /**
   * Get the reputation value for a specific faction
   *
   * Feature: danger-system, Property 13: Faction Reputation Clamping
   * Validates: Requirements 8.1, 8.2
   *
   * @param {string} faction - Faction name (authorities, traders, outlaws, civilians)
   * @returns {number} Current faction reputation (-100 to 100)
   * @throws {Error} If faction is not valid
   */
  getFactionRep(faction) {
    this.validateState();

    if (!FACTION_CONFIG.FACTIONS.includes(faction)) {
      throw new Error(`Invalid faction: ${faction}. Valid factions: ${FACTION_CONFIG.FACTIONS.join(', ')}`);
    }

    return this.getState().player.factions[faction];
  }

  /**
   * Modify faction reputation by a given amount with clamping
   *
   * Faction reputation is clamped to the range [-100, 100] after modification.
   * Emits 'factionRepChanged' event with the new value.
   *
   * Feature: danger-system, Property 13: Faction Reputation Clamping
   * Validates: Requirements 8.3
   *
   * @param {string} faction - Faction name (authorities, traders, outlaws, civilians)
   * @param {number} amount - Amount to add (positive) or subtract (negative)
   * @param {string} reason - Description of why reputation changed (for logging/UI)
   * @throws {Error} If faction is not valid
   */
  modifyFactionRep(faction, amount, reason) {
    this.validateState();

    if (!FACTION_CONFIG.FACTIONS.includes(faction)) {
      throw new Error(`Invalid faction: ${faction}. Valid factions: ${FACTION_CONFIG.FACTIONS.join(', ')}`);
    }

    const currentRep = this.getState().player.factions[faction];
    const newRep = Math.max(
      FACTION_CONFIG.MIN,
      Math.min(FACTION_CONFIG.MAX, currentRep + amount)
    );

    this.getState().player.factions[faction] = newRep;

    this.log(`${faction} reputation changed by ${amount} (${reason}): ${currentRep} -> ${newRep}`);
    this.emit('factionRepChanged', { faction, rep: newRep, change: amount, reason });
  }
}
