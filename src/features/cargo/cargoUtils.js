/**
 * Cargo utility functions
 *
 * Pure utility functions for cargo-related calculations and formatting.
 * These functions are separated from the CargoManifestPanel component
 * to maintain testability and reusability.
 *
 * Architecture: react-migration
 * Validates: Requirements 15.5
 */

/**
 * Format the age of cargo purchase
 *
 * @param {number} currentDay - Current game day
 * @param {number} purchaseDay - Day when cargo was purchased
 * @returns {string} Formatted age text (e.g., "today", "1 day ago", "5 days ago")
 */
export function formatCargoAge(currentDay, purchaseDay) {
  const daysSincePurchase = currentDay - purchaseDay;

  if (daysSincePurchase === 0) {
    return 'today';
  } else if (daysSincePurchase === 1) {
    return '1 day ago';
  } else {
    return `${daysSincePurchase} days ago`;
  }
}
