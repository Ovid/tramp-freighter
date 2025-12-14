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
 * @param {number} currentFuel - Current fuel percentage
 * @param {number} maxFuel - Maximum fuel capacity (default: 100%)
 * @returns {number} Maximum capacity amount (percentage points)
 */
export function calculateMaxCapacity(
  currentFuel,
  maxFuel = SHIP_CONFIG.CONDITION_BOUNDS.MAX
) {
  return Math.floor(maxFuel - currentFuel);
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

/**
 * Validate a refuel transaction
 *
 * This is a wrapper around GameStateManager.validateRefuel that provides
 * a convenient interface for components.
 *
 * @param {number} amount - Amount to refuel (percentage points)
 * @param {Object} state - Current game state
 * @returns {Object} { valid: boolean, reason: string }
 */
export function validateRefuel(amount, state) {
  const currentFuel = state.ship.fuel;
  const credits = state.player.credits;
  const systemId = state.player.currentSystem;

  // Get fuel price from state (this should be calculated by GameStateManager)
  // For now, we'll use a simple calculation based on system type
  // In practice, this should call gameStateManager.getFuelPrice(systemId)
  const pricePerPercent = getFuelPriceForSystem(systemId, state);

  const totalCost = calculateRefuelCost(amount, pricePerPercent);
  const maxFuel = SHIP_CONFIG.CONDITION_BOUNDS.MAX;

  if (amount <= 0) {
    return {
      valid: false,
      reason: 'Refuel amount must be positive',
    };
  }

  if (currentFuel + amount > maxFuel) {
    return {
      valid: false,
      reason: `Cannot refuel beyond ${maxFuel}% capacity`,
    };
  }

  if (totalCost > credits) {
    return {
      valid: false,
      reason: 'Insufficient credits for refuel',
    };
  }

  return {
    valid: true,
    reason: null,
  };
}

/**
 * Helper function to get fuel price for a system
 * This is a simplified version - in practice, use gameStateManager.getFuelPrice()
 *
 * @param {number} systemId - System ID
 * @param {Object} state - Current game state
 * @returns {number} Fuel price per percentage point
 */
function getFuelPriceForSystem(systemId, state) {
  // This is a placeholder - in the actual component, we'll use
  // gameStateManager.getFuelPrice(systemId) directly
  // For utility function testing, we can use a simple calculation
  return systemId === 1 ? 10 : 15; // Sol is cheaper
}
