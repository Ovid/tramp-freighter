/**
 * Trade utility functions - Pure functions for trade validation and calculations
 *
 * These functions are extracted from the TradePanelController to separate business
 * logic from React components. All functions are pure (no side effects) and can be
 * tested independently.
 *
 * Architecture: react-migration
 * Validates: Requirements 15.1, 15.5, 26.4
 */

/**
 * Validates a buy transaction
 *
 * @param {string} goodType - The type of good to buy
 * @param {number} quantity - The quantity to buy
 * @param {number} price - The price per unit
 * @param {Object} state - The current game state
 * @returns {Object} Validation result with valid boolean and reason string
 */
export function validateBuy(goodType, quantity, price, state) {
  if (!goodType || typeof goodType !== 'string') {
    return { valid: false, reason: 'Invalid good type' };
  }

  if (!quantity || quantity <= 0) {
    return { valid: false, reason: 'Quantity must be positive' };
  }

  if (!price || price <= 0) {
    return { valid: false, reason: 'Price must be positive' };
  }

  if (!state || !state.player || !state.ship) {
    return { valid: false, reason: 'Invalid game state' };
  }

  const totalCost = price * quantity;
  if (state.player.credits < totalCost) {
    return { valid: false, reason: 'Insufficient credits for purchase' };
  }

  const cargoUsed = state.ship.cargo.reduce((sum, stack) => sum + stack.qty, 0);
  const cargoRemaining = state.ship.cargoCapacity - cargoUsed;

  if (cargoRemaining < quantity) {
    return { valid: false, reason: 'Insufficient cargo capacity' };
  }

  return { valid: true, reason: '' };
}

/**
 * Validates a sell transaction
 *
 * @param {number} stackIndex - The index of the cargo stack to sell
 * @param {number} quantity - The quantity to sell
 * @param {Object} state - The current game state
 * @returns {Object} Validation result with valid boolean and reason string
 */
export function validateSell(stackIndex, quantity, state) {
  if (stackIndex < 0) {
    return { valid: false, reason: 'Invalid stack index' };
  }

  if (!quantity || quantity <= 0) {
    return { valid: false, reason: 'Quantity must be positive' };
  }

  if (!state || !state.ship || !state.ship.cargo) {
    return { valid: false, reason: 'Invalid game state' };
  }

  if (stackIndex >= state.ship.cargo.length) {
    return { valid: false, reason: 'Stack index out of bounds' };
  }

  const stack = state.ship.cargo[stackIndex];
  if (quantity > stack.qty) {
    return { valid: false, reason: 'Insufficient quantity in stack' };
  }

  return { valid: true, reason: '' };
}

/**
 * Calculates the maximum quantity that can be bought
 *
 * @param {number} price - The price per unit
 * @param {Object} state - The current game state
 * @returns {number} Maximum quantity that can be bought
 */
export function calculateMaxBuyQuantity(price, state) {
  if (!price || price <= 0 || !state || !state.player || !state.ship) {
    return 0;
  }

  const maxAffordable = Math.floor(state.player.credits / price);
  const cargoUsed = state.ship.cargo.reduce((sum, stack) => sum + stack.qty, 0);
  const cargoRemaining = state.ship.cargoCapacity - cargoUsed;

  return Math.min(maxAffordable, cargoRemaining);
}

/**
 * Calculates profit margin for a cargo stack
 *
 * @param {Object} stack - The cargo stack
 * @param {number} currentPrice - The current sell price
 * @returns {Object} Profit information with margin, percentage, and direction
 */
export function calculateProfit(stack, currentPrice) {
  if (!stack || !stack.buyPrice || !currentPrice) {
    return { margin: 0, percentage: 0, direction: 'neutral' };
  }

  const margin = currentPrice - stack.buyPrice;
  const percentage = ((margin / stack.buyPrice) * 100).toFixed(1);

  let direction = 'neutral';
  if (margin > 0) {
    direction = 'positive';
  } else if (margin < 0) {
    direction = 'negative';
  }

  return { margin, percentage, direction };
}

/**
 * Formats the age of a cargo stack purchase
 *
 * @param {number} currentDay - The current game day
 * @param {number} buyDate - The day the cargo was purchased
 * @returns {string} Formatted age string
 */
export function formatCargoAge(currentDay, buyDate) {
  if (buyDate === undefined || currentDay === undefined) {
    return '';
  }

  const daysSincePurchase = currentDay - buyDate;

  if (daysSincePurchase === 0) {
    return 'today';
  } else if (daysSincePurchase === 1) {
    return '1 day ago';
  } else {
    return `${daysSincePurchase} days ago`;
  }
}
