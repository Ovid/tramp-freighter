import { SeededRandom } from './seeded-random.js';
import {
  BASE_PRICES,
  SPECTRAL_MODIFIERS,
  DAILY_FLUCTUATION,
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
