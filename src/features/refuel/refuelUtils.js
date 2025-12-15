/**
 * Refuel utility functions - Pure functions for refuel calculations and validation
 *
 * These functions are extracted from the RefuelPanel component to separate
 * business logic from UI concerns, making them easier to test and reuse.
 *
 * React Migration Spec - Requirements 15.2, 15.5
 */

import { SHIP_CONFIG } from '../../game/constants.js';

/**
 * Calculate the total cost of refueling
 *
 * @param {number} amount - Amount to refuel (percentage points)
 * @param {number} pricePerPercent - Fuel price per percentage point
 * @returns {number} Total cost in credits
 */
export function calculateRefuelCost(amount, pricePerPercent) {
  return amount * pricePerPercent;
}

/**
 * Calculate the maximum amount that can be refueled based on credits
 *
 * @param {number} credits - Player's current credits
 * @param {number} pricePerPercent - Fuel price per percentage point
 * @returns {number} Maximum affordable amount (percentage points)
 */
export function calculateMaxAffordable(credits, pricePerPercent) {
  if (pricePerPercent <= 0) {
    return 0;
  }
  return Math.floor(credits / pricePerPercent);
}

/**
 * Calculate the maximum amount that can be refueled based on capacity
 *
 * Uses Math.ceil to round up fractional remaining capacity, allowing players
 * to refuel to exactly 100% even when current fuel has fractional values.
 * The validation epsilon in GameStateManager handles the slight overage.
 *
 * @param {number} currentFuel - Current fuel percentage
 * @param {number} maxFuel - Maximum fuel capacity (default: 100%)
 * @returns {number} Maximum capacity amount (percentage points)
 */
export function calculateMaxCapacity(
  currentFuel,
  maxFuel = SHIP_CONFIG.CONDITION_BOUNDS.MAX
) {
  return Math.ceil(maxFuel - currentFuel);
}

/**
 * Calculate the maximum amount that can be refueled (considering both credits and capacity)
 *
 * @param {number} currentFuel - Current fuel percentage
 * @param {number} credits - Player's current credits
 * @param {number} pricePerPercent - Fuel price per percentage point
 * @param {number} maxFuel - Maximum fuel capacity (default: 100%)
 * @returns {number} Maximum refuel amount (percentage points)
 */
export function calculateMaxRefuel(
  currentFuel,
  credits,
  pricePerPercent,
  maxFuel = SHIP_CONFIG.CONDITION_BOUNDS.MAX
) {
  const maxAffordable = calculateMaxAffordable(credits, pricePerPercent);
  const maxCapacity = calculateMaxCapacity(currentFuel, maxFuel);
  return Math.max(0, Math.min(maxAffordable, maxCapacity));
}
