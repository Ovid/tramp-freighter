import { REPAIR_CONFIG } from '../../game/constants.js';

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

/**
 * Check if a system is at or below the critical damage threshold
 *
 * @param {number} condition - Current condition percentage
 * @returns {boolean} True if critically damaged
 */
export function isSystemCritical(condition) {
  return condition <= REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD;
}

/**
 * Calculate total donation required to bring a system from its current
 * condition to EMERGENCY_PATCH_TARGET, accounting for waste multiplier
 *
 * @param {number} currentCondition - Current condition of the target system
 * @returns {number} Total percentage points donors must sacrifice
 */
export function calculateCannibalizeRequired(currentCondition) {
  const needed = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET - currentCondition;
  if (needed <= 0) return 0;
  return Math.ceil(needed * REPAIR_CONFIG.CANNIBALIZE_WASTE_MULTIPLIER);
}

/**
 * Calculate maximum donation a system can give without going below donor floor
 *
 * @param {number} donorCondition - Current condition of donor system
 * @returns {number} Maximum percentage points available to donate
 */
export function calculateMaxDonation(donorCondition) {
  return Math.max(
    0,
    Math.floor(donorCondition - REPAIR_CONFIG.CANNIBALIZE_DONOR_MIN)
  );
}
