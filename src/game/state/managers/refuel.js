import { BaseManager } from './base-manager.js';
import {
  FUEL_PRICING_CONFIG,
  NAVIGATION_CONFIG,
  calculateDistanceFromSol,
} from '../../constants.js';

/**
 * RefuelManager - Manages ship refueling operations
 *
 * Handles all refuel-related operations including:
 * - Fuel pricing calculations based on system distance from Sol
 * - Refuel transaction validation
 * - Refuel execution with safety checks
 */
export class RefuelManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  /**
   * Calculate fuel price based on system distance from Sol
   *
   * Pricing tiers:
   * - Core systems (Sol, Alpha Centauri): Cheapest fuel
   * - Inner systems (<5 LY): Standard pricing
   * - Mid-range systems (5-10 LY): Higher pricing
   * - Outer systems (≥10 LY): Most expensive fuel
   *
   * @param {number} systemId - System ID to check
   * @returns {number} Fuel price per percentage point
   */
  getFuelPrice(systemId) {
    if (FUEL_PRICING_CONFIG.CORE_SYSTEMS.IDS.includes(systemId)) {
      return FUEL_PRICING_CONFIG.CORE_SYSTEMS.PRICE_PER_PERCENT;
    }

    const system = this.getStarData().find((s) => s.id === systemId);
    if (!system) {
      return FUEL_PRICING_CONFIG.INNER_SYSTEMS.PRICE_PER_PERCENT;
    }

    const distanceFromSol = calculateDistanceFromSol(system);

    if (
      distanceFromSol < FUEL_PRICING_CONFIG.INNER_SYSTEMS.DISTANCE_THRESHOLD
    ) {
      return FUEL_PRICING_CONFIG.INNER_SYSTEMS.PRICE_PER_PERCENT;
    }

    if (
      distanceFromSol < FUEL_PRICING_CONFIG.MID_RANGE_SYSTEMS.DISTANCE_THRESHOLD
    ) {
      return FUEL_PRICING_CONFIG.MID_RANGE_SYSTEMS.PRICE_PER_PERCENT;
    }

    return FUEL_PRICING_CONFIG.OUTER_SYSTEMS.PRICE_PER_PERCENT;
  }

  /**
   * Validate refuel transaction
   *
   * Checks:
   * - Amount is positive
   * - Refuel won't exceed fuel capacity (with epsilon tolerance)
   * - Player has sufficient credits
   *
   * @param {number} currentFuel - Current fuel percentage
   * @param {number} amount - Amount to refuel (percentage points)
   * @param {number} credits - Player's current credits
   * @param {number} pricePerPercent - Fuel price per percentage point
   * @returns {Object} { valid: boolean, reason: string, cost: number }
   */
  validateRefuel(currentFuel, amount, credits, pricePerPercent) {
    const totalCost = amount * pricePerPercent;
    const maxFuel = this.gameStateManager.getFuelCapacity();

    if (amount <= 0) {
      return {
        valid: false,
        reason: 'Refuel amount must be positive',
        cost: totalCost,
      };
    }

    // Use epsilon for floating point comparison
    if (
      currentFuel + amount >
      maxFuel + NAVIGATION_CONFIG.FUEL_CAPACITY_EPSILON
    ) {
      return {
        valid: false,
        reason: `Cannot refuel beyond ${maxFuel}% capacity`,
        cost: totalCost,
      };
    }

    if (totalCost > credits) {
      return {
        valid: false,
        reason: 'Insufficient credits for refuel',
        cost: totalCost,
      };
    }

    return {
      valid: true,
      reason: null,
      cost: totalCost,
    };
  }

  /**
   * Execute refuel transaction
   *
   * Validates the transaction, updates credits and fuel, and saves the game.
   * Includes safety checks to prevent fuel reduction bugs.
   *
   * @param {number} amount - Amount to refuel (percentage points)
   * @returns {Object} { success: boolean, reason: string }
   * @throws {Error} If refuel would reduce fuel (critical bug detection)
   */
  refuel(amount) {
    this.validateState();

    const state = this.getState();
    const currentFuel = state.ship.fuel;
    const credits = state.player.credits;
    const systemId = state.player.currentSystem;
    const pricePerPercent = this.getFuelPrice(systemId);

    const validation = this.validateRefuel(
      currentFuel,
      amount,
      credits,
      pricePerPercent
    );

    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    this.gameStateManager.updateCredits(credits - validation.cost);

    // Clamp fuel to max capacity to handle floating point rounding
    // (validation allows slight overage with epsilon, but actual fuel must not exceed max)
    const maxFuel = this.gameStateManager.getFuelCapacity();
    const newFuel = Math.min(currentFuel + amount, maxFuel);

    // SAFETY CHECK: Prevent fuel reduction bug
    // We experienced a non-reproducible bug where refueling at 100% fuel could reduce fuel.
    // This safety check remains in place until the root cause is identified and fixed.
    // The validation logic should prevent this, but this check provides a fail-safe.
    if (newFuel < currentFuel) {
      throw new Error(
        `CRITICAL BUG: Refuel would reduce fuel from ${currentFuel}% to ${newFuel}%. ` +
          `Amount: ${amount}, MaxFuel: ${maxFuel}. This should never happen.`
      );
    }

    this.gameStateManager.updateFuel(newFuel);

    // Persist immediately - refuel modifies credits and fuel
    this.saveGame();

    return { success: true, reason: null };
  }
}
