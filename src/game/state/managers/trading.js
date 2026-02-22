import { BaseManager } from './base-manager.js';
import { TradingSystem } from '../../game-trading.js';
import {
  COMMODITY_TYPES,
  ECONOMY_CONFIG,
  RESTRICTED_GOODS_CONFIG,
  SOL_SYSTEM_ID,
  ALPHA_CENTAURI_SYSTEM_ID,
} from '../../constants.js';

/**
 * Trading Manager - Handles all trading operations and market conditions
 *
 * Responsibilities:
 * - Buy/sell transactions
 * - Price knowledge management
 * - Market conditions tracking
 * - Price calculations and snapshots
 */
export class TradingManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  /**
   * Execute a purchase transaction
   */
  buyGood(goodType, quantity, price) {
    this.validateState();

    const state = this.getState();
    const credits = state.player.credits;
    const cargoSpace = this.gameStateManager.getCargoRemaining();
    const totalCost = quantity * price;

    // Validate purchase constraints
    if (totalCost > credits) {
      return { success: false, reason: 'Insufficient credits' };
    }

    if (quantity > cargoSpace) {
      return { success: false, reason: 'Not enough cargo space' };
    }

    this.gameStateManager.updateCredits(credits - totalCost);

    // Pass current system and day for purchase metadata
    const currentSystemId = state.player.currentSystem;
    const currentSystem = this.gameStateManager.getCurrentSystem();
    const currentSystemName = currentSystem.name;
    const currentDay = state.player.daysElapsed;

    const newCargo = TradingSystem.recordCargoPurchase(
      state.ship.cargo,
      goodType,
      quantity,
      price,
      currentSystemId,
      currentSystemName,
      currentDay
    );
    this.gameStateManager.updateCargo(newCargo);

    // Update market conditions: negative quantity creates deficit (raises prices)
    // Feature: deterministic-economy, Requirements 4.1, 4.2
    this.updateMarketConditions(currentSystemId, goodType, -quantity);

    // Persist immediately - trade transactions modify credits and cargo
    this.gameStateManager.saveGame();

    return { success: true };
  }

  /**
   * Execute a sale transaction from a specific cargo stack
   */
  sellGood(stackIndex, quantity, salePrice) {
    this.validateState();

    const state = this.getState();
    const cargo = state.ship.cargo;

    // Validate sale constraints
    if (stackIndex < 0 || stackIndex >= cargo.length) {
      return { success: false, reason: 'Invalid cargo stack' };
    }

    const stack = cargo[stackIndex];

    // Prevent players from selling cargo assigned to active missions
    if (stack.missionId) {
      return { success: false, reason: 'Mission cargo cannot be sold' };
    }

    if (quantity <= 0) {
      return { success: false, reason: 'Quantity must be positive' };
    }

    if (quantity > stack.qty) {
      return { success: false, reason: 'Not enough quantity in stack' };
    }

    const totalRevenue = quantity * salePrice;
    const profitMargin = salePrice - stack.buyPrice;

    // Apply Cole's lien withholding before crediting player
    const { withheld } =
      this.gameStateManager.applyTradeWithholding(totalRevenue);
    const playerReceives = totalRevenue - withheld;
    this.gameStateManager.updateCredits(state.player.credits + playerReceives);

    if (state.stats) {
      state.stats.cargoHauled += quantity;
      state.stats.creditsEarned += totalRevenue;
    }

    // Remove quantity from stack; remove stack if empty
    stack.qty -= quantity;
    if (stack.qty <= 0) {
      cargo.splice(stackIndex, 1);
    }
    this.gameStateManager.updateCargo(cargo);

    // Update market conditions: positive quantity creates surplus (lowers prices)
    // Feature: deterministic-economy, Requirements 4.1, 4.2
    const currentSystemId = state.player.currentSystem;
    this.updateMarketConditions(currentSystemId, stack.good, quantity);

    // Persist immediately - trade transactions modify credits and cargo
    this.gameStateManager.saveGame();

    return {
      success: true,
      profitMargin: profitMargin,
      totalRevenue,
      playerReceives,
      withheld,
    };
  }

  /**
   * Get locked prices for current system
   *
   * Returns the price snapshot taken when player arrived at current system.
   * These prices remain fixed until player leaves, preventing intra-system arbitrage.
   *
   * @returns {Object} Price object with all commodity prices
   */
  getCurrentSystemPrices() {
    this.validateState();

    const state = this.getState();
    if (!state.world.currentSystemPrices) {
      throw new Error(
        'Invalid state: currentSystemPrices missing from world state'
      );
    }
    return state.world.currentSystemPrices;
  }

  /**
   * Update market conditions for a system and commodity
   *
   * Tracks player trading activity to create local supply/demand effects.
   * Positive quantityDelta = surplus (player sold), negative = deficit (player bought).
   *
   * Uses sparse storage: system and commodity entries are created on-demand during first trade.
   * This keeps save files small by only tracking systems/commodities with active trading history.
   *
   * Feature: deterministic-economy, Requirements 4.1, 4.2, 9.2
   *
   * @param {number} systemId - System ID
   * @param {string} goodType - Commodity type
   * @param {number} quantityDelta - Quantity change (positive for sell, negative for buy)
   */
  updateMarketConditions(systemId, goodType, quantityDelta) {
    this.validateState();

    const state = this.getState();
    // marketConditions is guaranteed to exist after initialization
    // Create system entry if first trade at that system
    if (!state.world.marketConditions[systemId]) {
      state.world.marketConditions[systemId] = {};
    }

    // Create commodity entry if first trade of that commodity
    if (state.world.marketConditions[systemId][goodType] === undefined) {
      state.world.marketConditions[systemId][goodType] = 0;
    }

    // Add quantityDelta to existing value
    state.world.marketConditions[systemId][goodType] += quantityDelta;
  }

  /**
   * Apply market recovery to all market conditions
   *
   * Markets naturally recover toward equilibrium over time. Each day, surplus and deficit
   * values decay by 10% (multiply by 0.90). Insignificant values (abs < 1.0) are pruned
   * to keep save files small.
   *
   * Feature: deterministic-economy, Requirements 5.1, 5.2, 5.3, 5.4, 5.5
   *
   * @param {number} daysPassed - Number of days elapsed
   */
  applyMarketRecovery(daysPassed) {
    this.validateState();

    const state = this.getState();
    if (!state.world.marketConditions) {
      throw new Error(
        'Invalid state: marketConditions missing from world state'
      );
    }

    const recoveryFactor = Math.pow(
      ECONOMY_CONFIG.DAILY_RECOVERY_FACTOR,
      daysPassed
    );

    // Iterate over all systems
    for (const systemId in state.world.marketConditions) {
      const systemConditions = state.world.marketConditions[systemId];

      // Iterate over all commodities in this system
      for (const goodType in systemConditions) {
        // Apply exponential decay
        systemConditions[goodType] *= recoveryFactor;

        // Prune insignificant entries
        if (
          Math.abs(systemConditions[goodType]) <
          ECONOMY_CONFIG.MARKET_CONDITION_PRUNE_THRESHOLD
        ) {
          delete systemConditions[goodType];
        }
      }

      // Remove empty system entries
      if (Object.keys(systemConditions).length === 0) {
        delete state.world.marketConditions[systemId];
      }
    }
  }

  /**
   * Record visited prices for current system
   *
   * Called when Trade panel opens to update price knowledge with current,
   * accurate prices. This overwrites any existing information broker data
   * with "Visited" source data at the current day.
   *
   * The data ages naturally as time passes (lastVisit increments), so when
   * viewing this system later from another location, it will show how old
   * the visited data is.
   */
  recordVisitedPrices() {
    this.validateState();

    const state = this.getState();
    const currentSystemId = state.player.currentSystem;
    const starData = this.getStarData();
    const currentSystem = starData.find((s) => s.id === currentSystemId);

    if (!currentSystem) {
      throw new Error(
        `Invalid game state: current system ID ${currentSystemId} not found in star data`
      );
    }

    // Get current prices from the locked snapshot (already calculated on arrival)
    const currentPrices = this.getCurrentSystemPrices();

    // Update price knowledge with source "Visited" (lastVisit = 0 means current)
    this.updatePriceKnowledge(currentSystemId, currentPrices, 0, 'visited');

    // Persist immediately - price knowledge update should be saved
    this.gameStateManager.saveGame();
  }

  /**
   * Update price knowledge for a system
   *
   * @param {number} systemId - System ID
   * @param {Object} prices - Price object with all commodity prices
   * @param {number} lastVisit - Days since last visit (0 = current)
   * @param {string} source - Source of data: 'visited' or 'intelligence_broker'
   */
  updatePriceKnowledge(systemId, prices, lastVisit = 0, source = 'visited') {
    this.validateState();

    const state = this.getState();
    // priceKnowledge is guaranteed to exist after initialization
    state.world.priceKnowledge[systemId] = {
      lastVisit: lastVisit,
      prices: { ...prices },
      source: source,
    };

    this.emit('priceKnowledgeChanged', state.world.priceKnowledge);
  }

  /**
   * Increment lastVisit counter for all systems in price knowledge
   *
   * Called automatically when time advances
   *
   * @param {number} days - Number of days to increment (default 1)
   */
  incrementPriceKnowledgeStaleness(days = 1) {
    this.validateState();

    const state = this.getState();
    if (!state.world.priceKnowledge) {
      throw new Error('Invalid state: priceKnowledge missing from world state');
    }

    for (const systemId in state.world.priceKnowledge) {
      state.world.priceKnowledge[systemId].lastVisit += days;
    }

    this.emit('priceKnowledgeChanged', state.world.priceKnowledge);
  }

  /**
   * Recalculate prices for all systems in price knowledge with current day's fluctuations
   *
   * Called automatically when day advances to update all known prices with new daily
   * fluctuations and active event modifiers.
   */
  recalculatePricesForKnownSystems() {
    this.validateState();

    const state = this.getState();
    if (!state.world.priceKnowledge) return;

    const currentDay = state.player.daysElapsed;
    const activeEvents = state.world.activeEvents;
    if (!activeEvents) {
      throw new Error('Invalid state: activeEvents missing from world state');
    }
    const marketConditions = state.world.marketConditions;
    if (!marketConditions) {
      throw new Error(
        'Invalid state: marketConditions missing from world state'
      );
    }

    const starData = this.getStarData();

    // Recalculate prices for each system in price knowledge
    for (const systemIdStr in state.world.priceKnowledge) {
      const systemId = parseInt(systemIdStr);
      const system = starData.find((s) => s.id === systemId);

      if (system) {
        const newPrices = {};

        // Calculate new prices for all commodities
        for (const goodType of COMMODITY_TYPES) {
          newPrices[goodType] = TradingSystem.calculatePrice(
            goodType,
            system,
            currentDay,
            activeEvents,
            marketConditions
          );
        }

        // Update prices while preserving lastVisit
        state.world.priceKnowledge[systemId].prices = newPrices;
      }
    }

    this.emit('priceKnowledgeChanged', state.world.priceKnowledge);
  }

  /**
   * Get price knowledge database
   */
  getPriceKnowledge() {
    this.validateState();

    const state = this.getState();
    return state.world.priceKnowledge || {};
  }

  /**
   * Get known prices for a specific system
   */
  getKnownPrices(systemId) {
    this.validateState();

    const state = this.getState();
    if (!state.world.priceKnowledge) {
      throw new Error('Invalid state: priceKnowledge missing from world state');
    }
    return state.world.priceKnowledge[systemId]?.prices || null;
  }

  /**
   * Check if player has price knowledge for a system
   */
  hasVisitedSystem(systemId) {
    this.validateState();

    const state = this.getState();
    if (!state.world.priceKnowledge) {
      throw new Error('Invalid state: priceKnowledge missing from world state');
    }
    return state.world.priceKnowledge[systemId] !== undefined;
  }

  /**
   * Check if a good is restricted anywhere in the galaxy
   *
   * @param {string} goodType - The type of good to check
   * @returns {boolean} True if the good is restricted in any zone or core system
   */
  isGoodRestrictedAnywhere(goodType) {
    // Check all zone restrictions
    const zoneRestricted =
      RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS.safe.includes(goodType) ||
      RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS.contested.includes(goodType) ||
      RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS.dangerous.includes(goodType);

    // Check core system restrictions
    const coreSystemRestricted =
      RESTRICTED_GOODS_CONFIG.CORE_SYSTEM_RESTRICTED.includes(goodType);

    return zoneRestricted || coreSystemRestricted;
  }

  /**
   * Check if a good is restricted in a specific system
   *
   * @param {string} goodType - The type of good to check
   * @param {number} systemId - The system ID to check restrictions for
   * @returns {boolean} True if the good is restricted in this system
   */
  isGoodRestricted(goodType, systemId) {
    this.validateState();

    // Get the danger zone for this system
    const dangerZone = this.gameStateManager.getDangerZone(systemId);

    // Check zone-based restrictions
    const zoneRestricted =
      RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS[dangerZone]?.includes(
        goodType
      ) || false;

    // Check core system restrictions (Sol, Alpha Centauri)
    const coreSystemRestricted =
      (systemId === SOL_SYSTEM_ID || systemId === ALPHA_CENTAURI_SYSTEM_ID) &&
      RESTRICTED_GOODS_CONFIG.CORE_SYSTEM_RESTRICTED.includes(goodType);

    return zoneRestricted || coreSystemRestricted;
  }

  /**
   * Calculate sell price for a good in a specific system
   *
   * @param {string} goodType - The type of good to price
   * @param {number} systemId - The system ID to calculate price for
   * @param {number} basePrice - The base price before modifiers
   * @returns {number} The final sell price including any premium multipliers
   */
  calculateSellPrice(goodType, systemId, basePrice) {
    this.validateState();

    // Check if this good is restricted in this system
    const isRestricted = this.isGoodRestricted(goodType, systemId);

    if (isRestricted) {
      // In restricted zones, normal trade is blocked
      // Price calculation is irrelevant as trade won't be allowed
      return basePrice;
    }

    // Check if this good is restricted elsewhere (making it valuable here)
    const isRestrictedElsewhere = this.isGoodRestrictedAnywhere(goodType);

    if (isRestrictedElsewhere) {
      // Apply premium multiplier when selling restricted goods in legal zones
      return (
        basePrice * RESTRICTED_GOODS_CONFIG.PRICE_MULTIPLIERS.PREMIUM_MULTIPLIER
      );
    }

    // Normal pricing for non-restricted goods
    return basePrice;
  }

  /**
   * Check if a good can be sold in a specific system
   *
   * @param {string} goodType - The type of good to check
   * @param {number} systemId - The system ID to check
   * @param {boolean} hasBlackMarketContact - Whether player has black market contacts
   * @returns {boolean} True if the good can be sold in this system
   */
  canSellGood(goodType, systemId, hasBlackMarketContact) {
    this.validateState();

    const isRestricted = this.isGoodRestricted(goodType, systemId);

    if (isRestricted) {
      // In restricted zones, can only sell with black market contacts
      return hasBlackMarketContact;
    } else {
      // In legal zones, can always sell
      return true;
    }
  }
}
