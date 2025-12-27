import { BaseManager } from './base-manager.js';
import { REPAIR_CONFIG, SHIP_CONFIG } from '../../constants.js';

/**
 * RepairManager - Manages ship repair operations
 *
 * Handles all repair-related operations including:
 * - Repair cost calculations
 * - Repair transaction validation and execution
 * - Integration with NPC free repair benefits
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
    this.saveGame();

    return { success: true, reason: null };
  }
}
