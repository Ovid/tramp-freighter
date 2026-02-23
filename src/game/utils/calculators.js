import { COMMODITY_TYPES } from '../constants.js';
import { TradingSystem } from '../game-trading.js';

/**
 * Calculate prices for all commodities at a given system.
 * Pure function extracted from NavigationManager.dock() and updateLocation().
 *
 * @param {Object} system - Star system object with id, x, y, z properties
 * @param {number} currentDay - Current game day for temporal price modifiers
 * @param {Array} activeEvents - Active economic events affecting prices
 * @param {Object} marketConditions - Market condition modifiers per system
 * @returns {Object} Map of commodity type to integer price
 */
export function calculateSystemPrices(
  system,
  currentDay,
  activeEvents,
  marketConditions
) {
  const prices = {};
  for (const goodType of COMMODITY_TYPES) {
    prices[goodType] = TradingSystem.calculatePrice(
      goodType,
      system,
      currentDay,
      activeEvents,
      marketConditions
    );
  }
  return prices;
}
