'use strict';

import { SeededRandom } from './seeded-random.js';
import {
  BASE_PRICES,
  SPECTRAL_MODIFIERS,
  DAILY_FLUCTUATION,
  ECONOMY_CONFIG,
  calculateDistanceFromSol,
} from './game-constants.js';

/**
 * TradingSystem - Handles commodity trading, price calculations, and cargo management
 */
export class TradingSystem {
  /**
   * Calculate price with deterministic modifiers (tech, temporal, local, events)
   *
   * Applies the complete deterministic economy formula:
   * P_final = round(P_base × M_tech × M_temporal × M_local × M_event)
   *
   * This replaces the old random-based system with predictable, simulation-based pricing.
   *
   * @param {string} goodType - Commodity type
   * @param {Object} system - Star system with coordinates and ID
   * @param {number} currentDay - Current game day for temporal modifier
   * @param {Array} activeEvents - Active economic events
   * @param {Object} marketConditions - Market saturation data: { [systemId]: { [goodType]: netQuantity } }
   * @returns {number} Final price in credits (rounded integer)
   */
  static calculatePrice(
    goodType,
    system,
    currentDay = 0,
    activeEvents = [],
    marketConditions = {}
  ) {
    const basePrice = BASE_PRICES[goodType];
    if (basePrice === undefined) {
      throw new Error(`Unknown good type: ${goodType}`);
    }

    if (!system || typeof system !== 'object') {
      throw new Error('System object required for price calculation');
    }

    // Calculate all modifiers
    const techLevel = TradingSystem.calculateTechLevel(system);
    const techMod = TradingSystem.getTechModifier(goodType, techLevel);
    const temporalMod = TradingSystem.getTemporalModifier(
      system.id,
      currentDay
    );
    const localMod = TradingSystem.getLocalModifier(
      system.id,
      goodType,
      marketConditions
    );
    const eventMod = TradingSystem.getEventModifier(
      system.id,
      goodType,
      activeEvents
    );

    // Apply complete formula
    const price = basePrice * techMod * temporalMod * localMod * eventMod;
    return Math.round(price);
  }

  static getProductionModifier(goodType, spectralClass) {
    const spectralLetter = spectralClass.charAt(0).toUpperCase();
    const modifiers = SPECTRAL_MODIFIERS[spectralLetter];
    return modifiers?.[goodType] || 1.0;
  }

  static getStationCountModifier(stationCount) {
    return 1.0 + stationCount * 0.05;
  }

  /**
   * Deterministic daily price fluctuation using seeded random
   * Seed format ensures same system/good/day always produces same fluctuation
   */
  static getDailyFluctuation(systemId, goodType, currentDay) {
    const seed = `${systemId}_${goodType}_${currentDay}`;
    const rng = new SeededRandom(seed);
    const value = rng.next();
    return DAILY_FLUCTUATION.MIN + value * DAILY_FLUCTUATION.RANGE;
  }

  static getEventModifier(systemId, goodType, activeEvents) {
    if (!Array.isArray(activeEvents)) {
      return 1.0;
    }

    const activeEvent = activeEvents.find(
      (event) => event.systemId === systemId
    );
    if (!activeEvent || !activeEvent.modifiers) {
      return 1.0;
    }

    return activeEvent.modifiers[goodType] || 1.0;
  }

  /**
   * Calculate technology level for a system based on distance from Sol
   *
   * Technology level represents the technological advancement of a system,
   * with Sol (distance 0) having the highest tech level (10.0) and frontier
   * systems at 21+ light years having the lowest tech level (1.0).
   *
   * Formula: TL = 10.0 - (9.0 × min(distance, 21) / 21)
   *
   * This creates a linear gradient where:
   * - Sol (0 LY): TL = 10.0
   * - Barnard's Star (~6 LY): TL ≈ 7.4
   * - Frontier (21+ LY): TL = 1.0
   *
   * @param {Object} system - Star system with x, y, z coordinates
   * @returns {number} Technology level between 1.0 and 10.0
   */
  static calculateTechLevel(system) {
    const distance = calculateDistanceFromSol(system);
    const clampedDistance = Math.min(
      distance,
      ECONOMY_CONFIG.MAX_COORD_DISTANCE
    );
    const techLevel =
      ECONOMY_CONFIG.MAX_TECH_LEVEL -
      ((ECONOMY_CONFIG.MAX_TECH_LEVEL - ECONOMY_CONFIG.MIN_TECH_LEVEL) *
        clampedDistance) /
        ECONOMY_CONFIG.MAX_COORD_DISTANCE;
    return techLevel;
  }

  /**
   * Calculate tech modifier for a commodity based on technology level
   *
   * Tech modifier creates price differentials based on a commodity's tech bias
   * and the system's technology level. Commodities with negative bias (raw materials,
   * agricultural goods) are cheaper at low-tech systems, while commodities with
   * positive bias (electronics, medicine) are cheaper at high-tech systems.
   *
   * Formula: modifier = 1.0 + (bias × (TECH_LEVEL_MIDPOINT - TL) × TECH_MODIFIER_INTENSITY)
   *
   * At TL midpoint (5.0), all modifiers are 1.0 (neutral).
   * At TL 10.0 (Sol), negative bias commodities are expensive, positive bias are cheap.
   * At TL 1.0 (frontier), negative bias commodities are cheap, positive bias are expensive.
   *
   * Examples:
   * - Electronics (bias +1.0) at Sol (TL 10.0): 1.0 + (1.0 × (5.0 - 10.0) × 0.08) = 0.6 (40% cheaper)
   * - Electronics (bias +1.0) at frontier (TL 1.0): 1.0 + (1.0 × (5.0 - 1.0) × 0.08) = 1.32 (32% more expensive)
   * - Ore (bias -0.8) at Sol (TL 10.0): 1.0 + (-0.8 × (5.0 - 10.0) × 0.08) = 1.32 (32% more expensive)
   * - Ore (bias -0.8) at frontier (TL 1.0): 1.0 + (-0.8 × (5.0 - 1.0) × 0.08) = 0.744 (25.6% cheaper)
   *
   * @param {string} goodType - Commodity type (grain, ore, tritium, parts, medicine, electronics)
   * @param {number} techLevel - Technology level between 1.0 and 10.0
   * @returns {number} Tech modifier multiplier
   */
  static getTechModifier(goodType, techLevel) {
    if (typeof goodType !== 'string' || !goodType) {
      throw new Error(
        `Invalid goodType: expected non-empty string, got ${typeof goodType}`
      );
    }
    if (typeof techLevel !== 'number' || isNaN(techLevel)) {
      throw new Error(
        `Invalid techLevel: expected valid number, got ${isNaN(techLevel) ? 'NaN' : typeof techLevel}`
      );
    }

    const bias = ECONOMY_CONFIG.TECH_BIASES[goodType];
    if (bias === undefined) {
      throw new Error(`Unknown good type: ${goodType}`);
    }

    const modifier =
      1.0 +
      bias *
        (ECONOMY_CONFIG.TECH_LEVEL_MIDPOINT - techLevel) *
        ECONOMY_CONFIG.TECH_MODIFIER_INTENSITY;
    return modifier;
  }

  /**
   * Calculate temporal modifier for price drift over time
   *
   * Temporal modifier creates smooth, predictable price oscillations using a sine wave.
   * Each system has a unique phase offset based on its ID, creating different price
   * cycles across the sector. This allows players to observe trends and plan multi-day
   * trading strategies.
   *
   * Formula: modifier = 1.0 + (amplitude × sin(2π × (day / period) + (systemId × 0.15)))
   *
   * The sine wave oscillates prices by ±15% (amplitude = 0.15) over a 30-day period.
   * The 2π multiplier ensures the wave completes exactly one cycle every 30 days.
   * System ID offset creates phase differences so systems reach peaks/troughs at different times.
   *
   * Examples:
   * - System 0, Day 0: 1.0 + (0.15 × sin(0 + 0)) = 1.0 (neutral)
   * - System 0, Day 7.5: 1.0 + (0.15 × sin(π/2)) = 1.15 (15% above baseline, peak)
   * - System 0, Day 15: 1.0 + (0.15 × sin(π)) = 1.0 (neutral, halfway)
   * - System 0, Day 22.5: 1.0 + (0.15 × sin(3π/2)) = 0.85 (15% below baseline, trough)
   * - System 0, Day 30: 1.0 + (0.15 × sin(2π)) = 1.0 (neutral, cycle complete)
   * - System 5, Day 0: 1.0 + (0.15 × sin(0 + 0.75)) ≈ 1.102 (different phase)
   *
   * @param {number} systemId - System identifier for phase offset
   * @param {number} currentDay - Current game day
   * @returns {number} Temporal modifier between 0.85 and 1.15
   */
  static getTemporalModifier(systemId, currentDay) {
    if (typeof systemId !== 'number') {
      throw new Error(
        `Invalid systemId: expected number, got ${typeof systemId}`
      );
    }
    if (typeof currentDay !== 'number' || isNaN(currentDay) || currentDay < 0) {
      throw new Error(
        `Invalid currentDay: expected non-negative number, got ${isNaN(currentDay) ? 'NaN' : currentDay}`
      );
    }

    const phase =
      (2 * Math.PI * currentDay) / ECONOMY_CONFIG.TEMPORAL_WAVE_PERIOD +
      systemId * ECONOMY_CONFIG.TEMPORAL_PHASE_OFFSET;
    const modifier = 1.0 + ECONOMY_CONFIG.TEMPORAL_AMPLITUDE * Math.sin(phase);
    return modifier;
  }

  /**
   * Calculate local modifier based on market saturation from player trading
   *
   * Local modifier creates dynamic price changes based on player buy/sell activity.
   * When the player sells goods at a system, a surplus is created that lowers prices.
   * When the player buys goods, a deficit is created that raises prices.
   * This prevents infinite exploitation of a single trade route and encourages
   * route rotation.
   *
   * Formula: modifier = clamp(1.0 - (surplus / MARKET_CAPACITY), LOCAL_MODIFIER_MIN, LOCAL_MODIFIER_MAX)
   *
   * Market conditions are stored as net quantity:
   * - Positive value = surplus (player sold goods) → prices decrease
   * - Negative value = deficit (player bought goods) → prices increase
   * - Zero or missing = no trading history → neutral modifier (1.0)
   *
   * The modifier is clamped between 0.25 and 2.0 to prevent negative prices
   * or infinite costs. At MARKET_CAPACITY (1000 units), the unclamped modifier
   * would be 0.0 (surplus) or 2.0 (deficit), but clamping ensures reasonable bounds.
   *
   * Examples:
   * - No trading history: modifier = 1.0 (neutral)
   * - Surplus of 200: modifier = 1.0 - (200 / 1000) = 0.8 (20% cheaper)
   * - Surplus of 1000: modifier = clamp(1.0 - 1.0, 0.25, 2.0) = 0.25 (75% cheaper, clamped)
   * - Deficit of 200: modifier = 1.0 - (-200 / 1000) = 1.2 (20% more expensive)
   * - Deficit of 1000: modifier = clamp(1.0 - (-1.0), 0.25, 2.0) = 2.0 (100% more expensive, clamped)
   *
   * @param {number} systemId - System identifier
   * @param {string} goodType - Commodity type
   * @param {Object} marketConditions - Market conditions data structure: { [systemId]: { [goodType]: netQuantity } }
   * @returns {number} Local modifier between 0.25 and 2.0
   */
  static getLocalModifier(systemId, goodType, marketConditions) {
    if (typeof systemId !== 'number') {
      throw new Error(
        `Invalid systemId: expected number, got ${typeof systemId}`
      );
    }
    if (typeof goodType !== 'string' || !goodType) {
      throw new Error(
        `Invalid goodType: expected non-empty string, got ${typeof goodType}`
      );
    }

    const surplus = marketConditions?.[systemId]?.[goodType] ?? 0;
    const modifier = 1.0 - surplus / ECONOMY_CONFIG.MARKET_CAPACITY;
    const clampedModifier = Math.max(
      ECONOMY_CONFIG.LOCAL_MODIFIER_MIN,
      Math.min(ECONOMY_CONFIG.LOCAL_MODIFIER_MAX, modifier)
    );
    return clampedModifier;
  }

  static calculateCargoUsed(cargo) {
    if (!Array.isArray(cargo)) {
      return 0;
    }

    return cargo.reduce((total, stack) => {
      return total + (stack.qty || 0);
    }, 0);
  }

  static validatePurchase(credits, cargoSpace, quantity, price) {
    const totalCost = quantity * price;

    if (totalCost > credits) {
      return {
        valid: false,
        reason: 'Insufficient credits',
      };
    }

    if (quantity > cargoSpace) {
      return {
        valid: false,
        reason: 'Not enough cargo space',
      };
    }

    return { valid: true };
  }

  static validateSale(cargo, stackIndex, quantity) {
    if (!Array.isArray(cargo) || stackIndex < 0 || stackIndex >= cargo.length) {
      return {
        valid: false,
        reason: 'Invalid cargo stack',
      };
    }

    const stack = cargo[stackIndex];
    if (quantity > stack.qty) {
      return {
        valid: false,
        reason: 'Not enough quantity in stack',
      };
    }

    return { valid: true };
  }

  /**
   * Consolidates cargo into existing stack if same good and price, otherwise creates new stack
   */
  static addCargoStack(
    cargo,
    goodType,
    quantity,
    price,
    systemId = null,
    day = null
  ) {
    const existingStackIndex = cargo.findIndex(
      (stack) => stack.good === goodType && stack.purchasePrice === price
    );

    if (existingStackIndex !== -1) {
      const updatedCargo = [...cargo];
      updatedCargo[existingStackIndex] = {
        ...updatedCargo[existingStackIndex],
        qty: updatedCargo[existingStackIndex].qty + quantity,
      };
      return updatedCargo;
    }

    const newStack = {
      good: goodType,
      qty: quantity,
      purchasePrice: price,
    };

    if (systemId !== null) {
      newStack.purchaseSystem = systemId;
    }
    if (day !== null) {
      newStack.purchaseDay = day;
    }

    return [...cargo, newStack];
  }

  /**
   * Removes stack entirely if quantity reaches zero
   */
  static removeFromCargoStack(cargo, stackIndex, quantity) {
    const updatedCargo = [...cargo];
    const stack = updatedCargo[stackIndex];
    stack.qty -= quantity;

    if (stack.qty <= 0) {
      updatedCargo.splice(stackIndex, 1);
    }

    return updatedCargo;
  }
}
