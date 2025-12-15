import { SHIP_CONFIG, REPAIR_CONFIG } from '../../game/constants.js';

/**
 * Calculate repair cost for a ship system
 *
 * Cost is ₡5 per 1% restored. If system is already at maximum condition, cost is 0.
 *
 * @param {number} amount - Percentage points to restore
 * @param {number} currentCondition - Current condition percentage
 * @returns {number} Cost in credits
 */
export function calculateRepairCost(amount, currentCondition) {
  // If already at max, no cost
  if (currentCondition >= SHIP_CONFIG.CONDITION_BOUNDS.MAX) {
    return 0;
  }

  // Calculate cost at ₡5 per 1%
  return amount * REPAIR_CONFIG.COST_PER_PERCENT;
}

/**
 * Calculate total cost to repair all ship systems to maximum condition
 *
 * Sums the repair costs for hull, engine, and life support to reach 100%.
 *
 * @param {Object} condition - Ship condition object with hull, engine, lifeSupport
 * @returns {number} Total repair cost in credits
 */
export function calculateRepairAllCost(condition) {
  let totalCost = 0;

  // Hull
  const hullAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.hull;
  if (hullAmount > 0) {
    totalCost += calculateRepairCost(hullAmount, condition.hull);
  }

  // Engine
  const engineAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.engine;
  if (engineAmount > 0) {
    totalCost += calculateRepairCost(engineAmount, condition.engine);
  }

  // Life Support
  const lifeSupportAmount =
    SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.lifeSupport;
  if (lifeSupportAmount > 0) {
    totalCost += calculateRepairCost(lifeSupportAmount, condition.lifeSupport);
  }

  return totalCost;
}

/**
 * Validate a repair transaction
 *
 * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
 * @param {number} amount - Percentage points to restore
 * @param {Object} state - Current game state
 * @returns {Object} { valid: boolean, reason: string }
 */
export function validateRepair(systemType, amount, state) {
  const currentCondition = state.ship[systemType];
  const credits = state.player.credits;
  const cost = calculateRepairCost(systemType, amount, currentCondition);

  // Validation order matters for user experience:
  // 1. Check for positive amount (basic input validation)
  // 2. Check if system already at max (no repair needed)
  // 3. Check credits (player can fix by earning money)
  // 4. Check if would exceed max (player can fix by reducing amount)

  if (amount <= 0) {
    return { valid: false, reason: 'Repair amount must be positive' };
  }

  if (currentCondition >= SHIP_CONFIG.CONDITION_BOUNDS.MAX) {
    return { valid: false, reason: 'System already at maximum condition' };
  }

  if (cost > credits) {
    return { valid: false, reason: 'Insufficient credits for repair' };
  }

  if (currentCondition + amount > SHIP_CONFIG.CONDITION_BOUNDS.MAX) {
    return { valid: false, reason: 'Repair would exceed maximum condition' };
  }

  return { valid: true };
}

/**
 * Validate repair all transaction
 *
 * @param {Object} condition - Ship condition object with hull, engine, lifeSupport
 * @param {number} credits - Player's current credits
 * @returns {Object} { valid: boolean, reason: string }
 */
export function validateRepairAll(condition, credits) {
  const totalCost = calculateRepairAllCost(condition);

  // Check if all systems already at max
  const allAtMax =
    condition.hull >= SHIP_CONFIG.CONDITION_BOUNDS.MAX &&
    condition.engine >= SHIP_CONFIG.CONDITION_BOUNDS.MAX &&
    condition.lifeSupport >= SHIP_CONFIG.CONDITION_BOUNDS.MAX;

  if (allAtMax) {
    return {
      valid: false,
      reason: 'All systems already at maximum condition',
    };
  }

  if (totalCost === 0) {
    return {
      valid: false,
      reason: 'All systems already at maximum condition',
    };
  }

  if (credits < totalCost) {
    return { valid: false, reason: 'Insufficient credits for full repair' };
  }

  return { valid: true };
}

/**
 * Get display name for a system type
 *
 * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
 * @returns {string} Display name
 */
export function getSystemName(systemType) {
  switch (systemType) {
    case 'hull':
      return 'Hull';
    case 'engine':
      return 'Engine';
    case 'lifeSupport':
      return 'Life Support';
    default:
      return systemType.charAt(0).toUpperCase() + systemType.slice(1);
  }
}

/**
 * Get current condition value for a specific ship system
 *
 * @param {Object} condition - Ship condition object with hull, engine, lifeSupport
 * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
 * @returns {number} Current condition percentage
 */
export function getSystemCondition(condition, systemType) {
  switch (systemType) {
    case 'hull':
      return condition.hull;
    case 'engine':
      return condition.engine;
    case 'lifeSupport':
      return condition.lifeSupport;
    default:
      return 0;
  }
}
