import { BaseManager } from './base-manager.js';
import {
  REPAIR_CONFIG,
  SHIP_CONFIG,
  REPUTATION_BOUNDS,
  NPC_BENEFITS_CONFIG,
} from '../../constants.js';

/**
 * RepairManager - Manages ship repair operations
 *
 * Handles all repair-related operations including:
 * - Repair cost calculations
 * - Repair transaction validation and execution
 * - NPC free repair benefits system
 */
export class RepairManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  /**
   * Calculate repair cost for a ship system
   *
   * Cost is ₡5 per 1% restored. If system is already at maximum condition, cost is 0.
   *
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @param {number} amount - Percentage points to restore
   * @param {number} currentCondition - Current condition percentage
   * @returns {number} Cost in credits
   */
  getRepairCost(systemType, amount, currentCondition) {
    // If already at max, no cost
    if (currentCondition >= SHIP_CONFIG.CONDITION_BOUNDS.MAX) {
      return 0;
    }

    // Calculate cost at ₡5 per 1%
    return amount * REPAIR_CONFIG.COST_PER_PERCENT;
  }

  /**
   * Execute repair transaction for a ship system
   *
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @param {number} amount - Percentage points to restore
   * @returns {Object} { success: boolean, reason: string }
   */
  repairShipSystem(systemType, amount) {
    this.validateState();

    // Validate system type
    const validSystems = ['hull', 'engine', 'lifeSupport'];
    if (!validSystems.includes(systemType)) {
      return { success: false, reason: 'Invalid system type' };
    }

    const state = this.getState();
    const currentCondition = state.ship[systemType];
    const credits = state.player.credits;
    const cost = this.getRepairCost(systemType, amount, currentCondition);

    // Validation order matters for user experience:
    // 1. Check for positive amount (basic input validation)
    // 2. Check if system already at max (no repair needed)
    // 3. Check credits (player can fix by earning money)
    // 4. Check if would exceed max (player can fix by reducing amount)

    if (amount <= 0) {
      return { success: false, reason: 'Repair amount must be positive' };
    }

    if (currentCondition >= SHIP_CONFIG.CONDITION_BOUNDS.MAX) {
      return { success: false, reason: 'System already at maximum condition' };
    }

    if (cost > credits) {
      return { success: false, reason: 'Insufficient credits for repair' };
    }

    if (currentCondition + amount > SHIP_CONFIG.CONDITION_BOUNDS.MAX) {
      return {
        success: false,
        reason: 'Repair would exceed maximum condition',
      };
    }

    // Deduct credits
    this.gameStateManager.updateCredits(credits - cost);

    // Increase condition (clamped by updateShipCondition)
    const newConditions = {
      hull: state.ship.hull,
      engine: state.ship.engine,
      lifeSupport: state.ship.lifeSupport,
    };

    newConditions[systemType] = currentCondition + amount;

    this.gameStateManager.updateShipCondition(
      newConditions.hull,
      newConditions.engine,
      newConditions.lifeSupport
    );

    // Persist immediately - repair modifies credits and ship condition
    this.gameStateManager.saveGame();

    return { success: true, reason: null };
  }

  /**
   * Check if NPC can provide free repair
   *
   * Checks if the NPC's reputation tier is Trusted or Family and if the
   * once-per-visit limitation is satisfied (lastFreeRepairDay is not current day).
   * Returns availability status and tier-based repair limits.
   *
   * @param {string} npcId - NPC identifier
   * @returns {Object} { available: boolean, maxHullPercent: number, reason: string | null }
   */
  canGetFreeRepair(npcId) {
    this.validateState();

    // Validate NPC ID
    this.gameStateManager.npcManager.validateAndGetNPCData(npcId);

    const state = this.getState();

    // Get NPC state (creates default if doesn't exist)
    const npcState = this.gameStateManager.npcManager.getNPCState(npcId);

    // Check reputation tier is Trusted or Family
    const repTier = this.gameStateManager.npcManager.getRepTier(npcState.rep);
    const isTrusted =
      npcState.rep >= REPUTATION_BOUNDS.TRUSTED_MIN &&
      npcState.rep <= REPUTATION_BOUNDS.TRUSTED_MAX;
    const isFamily = npcState.rep >= REPUTATION_BOUNDS.FAMILY_MIN;

    if (!isTrusted && !isFamily) {
      return {
        available: false,
        maxHullPercent: 0,
        reason: `Requires Trusted relationship (currently ${repTier.name})`,
      };
    }

    // Check once-per-visit limitation (lastFreeRepairDay is not current day)
    const currentDay = state.player.daysElapsed;
    if (
      npcState.lastFreeRepairDay !== null &&
      npcState.lastFreeRepairDay === currentDay
    ) {
      return {
        available: false,
        maxHullPercent: 0,
        reason: 'Free repair already used once per visit',
      };
    }

    // Determine max hull percent based on tier
    let maxHullPercent;
    if (isFamily) {
      maxHullPercent = NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.family;
    } else if (isTrusted) {
      maxHullPercent = NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.trusted;
    }

    return {
      available: true,
      maxHullPercent: maxHullPercent,
      reason: null,
    };
  }

  /**
   * Apply free repair from NPC
   *
   * Validates free repair availability, then repairs up to the tier-appropriate
   * hull damage limit. Sets lastFreeRepairDay to current day to enforce
   * once-per-visit limitation.
   *
   * @param {string} npcId - NPC identifier
   * @param {number} hullDamagePercent - Current hull damage percentage (0-100)
   * @returns {Object} { success: boolean, repairedPercent: number, message: string }
   */
  applyFreeRepair(npcId, hullDamagePercent) {
    this.validateState();

    // Validate with canGetFreeRepair
    const availability = this.canGetFreeRepair(npcId);
    if (!availability.available) {
      return {
        success: false,
        repairedPercent: 0,
        message: availability.reason,
      };
    }

    // Validate hull damage parameter
    if (
      typeof hullDamagePercent !== 'number' ||
      hullDamagePercent < 0 ||
      hullDamagePercent > 100
    ) {
      return {
        success: false,
        repairedPercent: 0,
        message: 'Invalid hull damage percentage',
      };
    }

    const state = this.getState();

    // Calculate repair amount (up to maxHullPercent of hull damage)
    const maxRepairPercent = availability.maxHullPercent;
    const actualRepairPercent = Math.min(hullDamagePercent, maxRepairPercent);

    // Apply repair to ship hull
    const currentHull = state.ship.hull;
    const newHull = Math.min(
      SHIP_CONFIG.CONDITION_BOUNDS.MAX,
      currentHull + actualRepairPercent
    );

    // Update ship condition
    this.gameStateManager.updateShipCondition(
      newHull,
      state.ship.engine,
      state.ship.lifeSupport
    );

    // Get NPC state and set lastFreeRepairDay to current day
    const npcState = this.gameStateManager.npcManager.getNPCState(npcId);
    npcState.lastFreeRepairDay = state.player.daysElapsed;

    // Update interaction tracking
    npcState.lastInteraction = state.player.daysElapsed;
    npcState.interactions += 1;

    // Persist immediately - free repair modifies ship condition and NPC state
    this.gameStateManager.saveGame();

    return {
      success: true,
      repairedPercent: actualRepairPercent,
      message: `Repaired ${actualRepairPercent}% hull damage`,
    };
  }
}
