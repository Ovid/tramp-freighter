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
   * Calculate price with all modifiers (production, station count, daily fluctuation, events)
   *
   * Phase 1/2 backward compatibility: accepts either spectral class string or full system object
   */
  static calculatePrice(
    goodType,
    systemOrSpectralClass,
    currentDay = 0,
    activeEvents = []
  ) {
    const basePrice = BASE_PRICES[goodType];
    if (basePrice === undefined) {
      throw new Error(`Unknown good type: ${goodType}`);
    }

    const isPhase1 = typeof systemOrSpectralClass === 'string';

    if (isPhase1) {
      const spectralClass = systemOrSpectralClass;
      const productionMod = TradingSystem.getProductionModifier(
        goodType,
        spectralClass
      );
      return Math.round(basePrice * productionMod);
    }

    const system = systemOrSpectralClass;
    const productionMod = TradingSystem.getProductionModifier(
      goodType,
      system.type
    );
    const stationMod = TradingSystem.getStationCountModifier(system.st || 0);
    const dailyMod = TradingSystem.getDailyFluctuation(
      system.id,
      goodType,
      currentDay
    );
    const eventMod = TradingSystem.getEventModifier(
      system.id,
      goodType,
      activeEvents
    );

    const price = basePrice * productionMod * stationMod * dailyMod * eventMod;
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
    const clampedDistance = Math.min(distance, ECONOMY_CONFIG.MAX_COORD_DISTANCE);
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
   * Formula: modifier = 1.0 + (bias × (5.0 - TL) × 0.08)
   *
   * At TL 5.0 (midpoint), all modifiers are 1.0 (neutral).
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
    const bias = ECONOMY_CONFIG.TECH_BIASES[goodType];
    if (bias === undefined) {
      throw new Error(`Unknown good type: ${goodType}`);
    }

    const modifier =
      1.0 + bias * (5.0 - techLevel) * ECONOMY_CONFIG.TECH_MODIFIER_INTENSITY;
    return modifier;
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
