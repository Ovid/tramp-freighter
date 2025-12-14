/**
 * Upgrades Utility Functions
 *
 * Pure functions for upgrade validation and calculations.
 * These functions are separated from React components for testability
 * and reusability.
 */

import { SHIP_CONFIG } from '../../game/constants.js';

/**
 * Validates an upgrade purchase.
 *
 * @param {string} upgradeId - Upgrade identifier
 * @param {Object} state - Current game state
 * @returns {Object} { valid: boolean, reason: string }
 */
export function validateUpgradePurchase(upgradeId, state) {
  const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];

  if (!upgrade) {
    return { valid: false, reason: 'Invalid upgrade ID' };
  }

  // Check if already installed
  const installedUpgrades = state.ship.upgrades || [];
  if (installedUpgrades.includes(upgradeId)) {
    return { valid: false, reason: 'Upgrade already installed' };
  }

  // Check if player has enough credits
  if (state.player.credits < upgrade.cost) {
    return { valid: false, reason: 'Insufficient credits' };
  }

  return { valid: true };
}

/**
 * Formats upgrade effects for display.
 *
 * Converts effect object into human-readable strings.
 *
 * @param {Object} effects - Upgrade effects object
 * @returns {string[]} Array of formatted effect strings
 */
export function formatUpgradeEffects(effects) {
  const formatted = [];

  // Helper to format reduction/increase effects (multipliers)
  const formatReduction = (label, multiplier) => {
    const percent = Math.round((1 - multiplier) * 100);
    if (percent > 0) {
      return `${label}: -${percent}%`;
    } else if (percent < 0) {
      return `${label}: +${Math.abs(percent)}%`;
    }
    return null;
  };

  for (const [attr, value] of Object.entries(effects)) {
    if (attr === 'fuelCapacity') {
      formatted.push(`Fuel capacity: ${value}%`);
    } else if (attr === 'cargoCapacity') {
      formatted.push(`Cargo capacity: ${value} units`);
    } else if (attr === 'hiddenCargoCapacity') {
      formatted.push(`Hidden cargo: ${value} units`);
    } else if (attr === 'fuelConsumption') {
      const text = formatReduction('Fuel consumption', value);
      if (text) formatted.push(text);
    } else if (attr === 'hullDegradation') {
      const text = formatReduction('Hull degradation', value);
      if (text) formatted.push(text);
    } else if (attr === 'lifeSupportDrain') {
      const text = formatReduction('Life support drain', value);
      if (text) formatted.push(text);
    } else if (attr === 'eventVisibility') {
      formatted.push('See economic events in connected systems');
    }
  }

  return formatted;
}

/**
 * Gets available (unpurchased) upgrades.
 *
 * @param {Object} state - Current game state
 * @returns {string[]} Array of available upgrade IDs
 */
export function getAvailableUpgrades(state) {
  const installedUpgrades = state.ship.upgrades || [];
  const allUpgradeIds = Object.keys(SHIP_CONFIG.UPGRADES);

  return allUpgradeIds.filter((id) => !installedUpgrades.includes(id));
}

/**
 * Gets installed upgrades.
 *
 * @param {Object} state - Current game state
 * @returns {string[]} Array of installed upgrade IDs
 */
export function getInstalledUpgrades(state) {
  return state.ship.upgrades || [];
}

/**
 * Calculates credits after purchase.
 *
 * @param {string} upgradeId - Upgrade identifier
 * @param {number} currentCredits - Player's current credits
 * @returns {number} Credits after purchase
 */
export function calculateCreditsAfterPurchase(upgradeId, currentCredits) {
  const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
  if (!upgrade) {
    return currentCredits;
  }

  return currentCredits - upgrade.cost;
}
