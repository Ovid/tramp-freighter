import { BaseManager } from './base-manager.js';
import {
  DANGER_CONFIG,
  KARMA_CONFIG,
  FACTION_CONFIG,
  RESTRICTED_GOODS_CONFIG,
  MISSION_CARGO_TYPES,
  SOL_SYSTEM_ID,
  ALPHA_CENTAURI_SYSTEM_ID,
  calculateDistanceFromSol,
  EVENT_NAMES,
} from '../../constants.js';

/**
 * DangerManager - Handles danger zone classification and shared encounter state
 *
 * Danger zones classify star systems based on pirate activity and law enforcement:
 * - Safe: Core systems with strong law enforcement presence
 * - Contested: Systems with mixed control and moderate risk
 * - Dangerous: Frontier systems with high pirate activity
 *
 * This manager retains shared state (karma, faction reputation, danger zones)
 * used by the focused encounter managers: CombatManager, NegotiationManager,
 * InspectionManager, DistressManager, MechanicalFailureManager.
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

    if (ZONES.safe.systems.includes(systemId)) {
      return 'safe';
    }

    if (ZONES.contested.systems.includes(systemId)) {
      return 'contested';
    }

    const system = this.getStarData().find((s) => s.id === systemId);
    if (system) {
      const distance = calculateDistanceFromSol(system);
      if (distance > ZONES.dangerous.distanceThreshold) {
        return 'dangerous';
      }
    }

    return 'contested';
  }

  // ========================================================================
  // KARMA SYSTEM
  // ========================================================================

  /**
   * Get the current karma value
   *
   * @returns {number} Current karma value, clamped to range [-100, 100]
   */
  getKarma() {
    this.validateState();
    return this.getState().player.karma;
  }

  /**
   * Set karma to a specific value with automatic clamping
   *
   * @param {number} value - Target karma value
   */
  setKarma(value) {
    this.validateState();

    const newKarma = Math.max(
      KARMA_CONFIG.MIN,
      Math.min(KARMA_CONFIG.MAX, value)
    );

    this.getState().player.karma = newKarma;

    this.log(`Karma set to ${newKarma}`);
    this.emit(EVENT_NAMES.KARMA_CHANGED, newKarma);
  }

  /**
   * Modify karma by a given amount with automatic clamping
   *
   * @param {number} amount - Amount to add (positive) or subtract (negative)
   * @param {string} reason - Description of why karma changed
   */
  modifyKarma(amount, reason) {
    this.validateState();

    const currentKarma = this.getState().player.karma;
    const newKarma = Math.max(
      KARMA_CONFIG.MIN,
      Math.min(KARMA_CONFIG.MAX, currentKarma + amount)
    );

    this.getState().player.karma = newKarma;

    if (this.getState().stats && amount > 0) {
      this.getState().stats.charitableActs++;
    }

    this.log(
      `Karma changed by ${amount} (${reason}): ${currentKarma} -> ${newKarma}`
    );
    this.emit(EVENT_NAMES.KARMA_CHANGED, newKarma);
    this.gameStateManager.achievementsManager.checkAchievements();
  }

  // ========================================================================
  // PIRATE ENCOUNTER SYSTEM
  // ========================================================================

  /**
   * Calculate the probability of a pirate encounter for a given system
   *
   * @param {number} systemId - The destination system ID
   * @param {Object} gameState - Current game state for modifier calculations
   * @returns {number} Probability of pirate encounter (0.0 to 1.0)
   */
  calculatePirateEncounterChance(systemId, gameState) {
    const zone = this.getDangerZone(systemId);

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
      ILLEGAL_CARGO_PIRATE_MULTIPLIER,
      ADVANCED_SENSORS_PIRATE_REDUCTION,
      FACTION_REPUTATION_SCALES: {
        OUTLAW_PIRATE_REDUCTION_SCALE,
        AUTHORITY_PIRATE_INCREASE_SCALE,
      },
    } = DANGER_CONFIG;

    let probability = ZONES[zone].pirateChance;

    const cargoValue = this.calculateCargoValue(gameState.ship.cargo);

    if (cargoValue >= HIGH_VALUE_THRESHOLD) {
      probability *= HIGH_VALUE_MULTIPLIER;
    } else if (cargoValue >= LOW_VALUE_THRESHOLD) {
      probability *= LOW_VALUE_MULTIPLIER;
    }

    if (gameState.ship.engine < POOR_CONDITION_THRESHOLD) {
      probability *= POOR_CONDITION_MULTIPLIER;
    }

    if (gameState.ship.upgrades.includes('advanced_sensors')) {
      probability *= ADVANCED_SENSORS_PIRATE_REDUCTION;
    }

    const outlawRep = gameState.player.factions.outlaws;
    const authorityRep = gameState.player.factions.authorities;

    const outlawModifier =
      1 + (outlawRep / 100) * OUTLAW_PIRATE_REDUCTION_SCALE;
    probability *= outlawModifier;

    const authorityModifier =
      1 + (authorityRep / 100) * AUTHORITY_PIRATE_INCREASE_SCALE;
    probability *= authorityModifier;

    if (this.hasIllegalMissionCargo(gameState.ship.cargo)) {
      probability *= ILLEGAL_CARGO_PIRATE_MULTIPLIER;
    }

    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Calculate the total value of cargo in the ship's hold
   *
   * @param {Array} cargo - Array of cargo objects with quantity and purchasePrice
   * @returns {number} Total cargo value in credits
   */
  calculateCargoValue(cargo) {
    return cargo.reduce((total, item) => {
      return total + (item.qty || 0) * (item.buyPrice || 0);
    }, 0);
  }

  // ========================================================================
  // INSPECTION SYSTEM
  // ========================================================================

  /**
   * Calculate the probability of a customs inspection for a given system
   *
   * @param {number} systemId - The destination system ID
   * @param {Object} gameState - Current game state for modifier calculations
   * @returns {number} Probability of customs inspection (0.0 to 1.0)
   */
  calculateInspectionChance(systemId, gameState) {
    const zone = this.getDangerZone(systemId);

    const {
      ZONES,
      CORE_SYSTEMS_INSPECTION_MULTIPLIER,
      RESTRICTED_GOODS_INSPECTION_INCREASE,
      FACTION_REPUTATION_SCALES: { AUTHORITY_INSPECTION_REDUCTION_SCALE },
    } = DANGER_CONFIG;

    let probability = ZONES[zone].inspectionChance;

    if (systemId === SOL_SYSTEM_ID || systemId === ALPHA_CENTAURI_SYSTEM_ID) {
      probability *= CORE_SYSTEMS_INSPECTION_MULTIPLIER;
    }

    const restrictedGoodsCount = this.countRestrictedGoods(
      gameState.ship.cargo,
      zone,
      systemId
    );

    const restrictedModifier =
      1 + restrictedGoodsCount * RESTRICTED_GOODS_INSPECTION_INCREASE;
    probability *= restrictedModifier;

    const authorityRep = gameState.player.factions.authorities;

    const factionModifier =
      1 + (authorityRep / 100) * AUTHORITY_INSPECTION_REDUCTION_SCALE;
    probability *= factionModifier;

    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Check if cargo contains illegal mission cargo
   *
   * @param {Array} cargo - Array of cargo objects
   * @returns {boolean} True if illegal mission cargo is present
   */
  hasIllegalMissionCargo(cargo) {
    if (!cargo) {
      cargo = this.getState().ship.cargo;
    }
    return cargo.some(
      (item) =>
        item.missionId && MISSION_CARGO_TYPES.illegal.includes(item.good)
    );
  }

  /**
   * Count the number of restricted goods in cargo for a given zone and system
   *
   * @param {Array} cargo - Array of cargo objects with 'good' property
   * @param {string} zone - Danger zone type ('safe', 'contested', 'dangerous')
   * @param {number} [systemId] - Optional system ID for core system checks
   * @returns {number} Number of restricted goods in cargo
   */
  countRestrictedGoods(cargo, zone, systemId) {
    const zoneRestrictions =
      RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[zone] || [];

    const coreRestrictions =
      systemId === SOL_SYSTEM_ID || systemId === ALPHA_CENTAURI_SYSTEM_ID
        ? RESTRICTED_GOODS_CONFIG.CORE_SYSTEM_RESTRICTED
        : [];

    const allRestricted = [...zoneRestrictions, ...coreRestrictions];

    return cargo.filter((item) => {
      if (item.missionId && MISSION_CARGO_TYPES.illegal.includes(item.good))
        return true;

      return allRestricted.includes(item.good);
    }).length;
  }

  /**
   * Increment a specific danger flag counter
   *
   * @param {string} flagName - Name of the flag to increment (e.g. 'piratesFought')
   */
  incrementDangerFlag(flagName) {
    this.validateState();
    const state = this.getState();
    if (
      state.world.dangerFlags &&
      typeof state.world.dangerFlags[flagName] === 'number'
    ) {
      state.world.dangerFlags[flagName]++;
    }
    this.gameStateManager.achievementsManager.checkAchievements();
  }

  // ========================================================================
  // FACTION REPUTATION SYSTEM
  // ========================================================================

  /**
   * Get the reputation value for a specific faction
   *
   * @param {string} faction - Faction name (authorities, traders, outlaws, civilians)
   * @returns {number} Current faction reputation, clamped to range [-100, 100]
   * @throws {Error} If faction name is not valid
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
   * Set faction reputation to a specific value with automatic clamping
   *
   * @param {string} faction - Faction name (authorities, traders, outlaws, civilians)
   * @param {number} value - Target reputation value
   * @throws {Error} If faction name is not valid
   */
  setFactionRep(faction, value) {
    this.validateState();

    if (!FACTION_CONFIG.FACTIONS.includes(faction)) {
      throw new Error(
        `Invalid faction: ${faction}. Valid factions: ${FACTION_CONFIG.FACTIONS.join(', ')}`
      );
    }

    const newRep = Math.max(
      FACTION_CONFIG.MIN,
      Math.min(FACTION_CONFIG.MAX, value)
    );

    this.getState().player.factions[faction] = newRep;

    this.log(`${faction} reputation set to ${newRep}`);
    this.emit(EVENT_NAMES.FACTION_REP_CHANGED, this.getState().player.factions);
  }

  /**
   * Modify faction reputation by a given amount with automatic clamping
   *
   * @param {string} faction - Faction name (authorities, traders, outlaws, civilians)
   * @param {number} amount - Amount to add (positive) or subtract (negative)
   * @param {string} reason - Description of why reputation changed
   * @throws {Error} If faction name is not valid
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

    this.emit(EVENT_NAMES.FACTION_REP_CHANGED, this.getState().player.factions);
  }
}
