import {
  BASE_PRICES,
  INTELLIGENCE_PRICES,
  INTELLIGENCE_RECENT_THRESHOLD,
} from './game-constants.js';
import { TradingSystem } from './game-trading.js';
import { SeededRandom } from './seeded-random.js';

/**
 * InformationBroker - Handles market intelligence purchases and rumor generation
 *
 * Provides players with price data for systems they haven't visited recently,
 * creating a strategic layer around information gathering and trading decisions.
 */
export class InformationBroker {
  /**
   * Calculate intelligence cost for a system based on visit history
   *
   * @param {number} systemId - Target system ID
   * @param {Object} priceKnowledge - Player's price knowledge database
   * @returns {number} Cost in credits
   */
  static getIntelligenceCost(systemId, priceKnowledge) {
    const knowledge = priceKnowledge[systemId];

    // Never visited
    if (!knowledge) {
      return INTELLIGENCE_PRICES.NEVER_VISITED;
    }

    // Recently visited (within threshold)
    if (knowledge.lastVisit <= INTELLIGENCE_RECENT_THRESHOLD) {
      return INTELLIGENCE_PRICES.RECENT_VISIT;
    }

    // Stale visit (beyond threshold)
    return INTELLIGENCE_PRICES.STALE_VISIT;
  }

  /**
   * Purchase market intelligence for a system
   *
   * Deducts credits and updates price knowledge with current prices.
   *
   * @param {Object} gameState - Current game state
   * @param {number} systemId - Target system ID
   * @param {Array} starData - Star system data
   * @returns {Object} { success: boolean, reason: string }
   */
  static purchaseIntelligence(gameState, systemId, starData) {
    const priceKnowledge = gameState.world.priceKnowledge || {};
    const credits = gameState.player.credits;

    // Calculate cost
    const cost = InformationBroker.getIntelligenceCost(
      systemId,
      priceKnowledge
    );

    // Validate purchase
    const validation = InformationBroker.validatePurchase(cost, credits);
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    // Find target system
    const system = starData.find((s) => s.id === systemId);
    if (!system) {
      return { success: false, reason: 'System not found' };
    }

    // Calculate current prices for the system
    const currentDay = gameState.player.daysElapsed;
    const activeEvents = gameState.world.activeEvents || [];
    const currentPrices = {};

    for (const goodType of Object.keys(BASE_PRICES)) {
      currentPrices[goodType] = TradingSystem.calculatePrice(
        goodType,
        system,
        currentDay,
        activeEvents
      );
    }

    // Deduct credits
    gameState.player.credits -= cost;

    // Update price knowledge
    gameState.world.priceKnowledge[systemId] = {
      lastVisit: 0, // Intelligence is "current"
      prices: currentPrices,
    };

    return { success: true, reason: null };
  }

  /**
   * Generate a market rumor with hints about prices or events
   *
   * Uses seeded random based on current day for deterministic behavior.
   * This ensures rumors are consistent for the same game state, making
   * testing reliable while still providing variety across different days.
   *
   * @param {Object} gameState - Current game state
   * @param {Array} starData - Star system data
   * @returns {string} Rumor text
   */
  static generateRumor(gameState, starData) {
    const currentDay = gameState.player.daysElapsed;
    const activeEvents = gameState.world.activeEvents || [];

    // Use seeded random for deterministic rumor generation
    const seed = `rumor_${currentDay}`;
    const rng = new SeededRandom(seed);

    // If there are active events, 50% chance to hint about one
    if (activeEvents.length > 0 && rng.next() < 0.5) {
      const eventIndex = Math.floor(rng.next() * activeEvents.length);
      const event = activeEvents[eventIndex];
      const system = starData.find((s) => s.id === event.systemId);

      if (system) {
        // Get event type name from the event object or use generic description
        const eventDescriptions = {
          mining_strike: 'labor troubles',
          medical_emergency: 'a health crisis',
          festival: 'celebrations',
          supply_glut: 'oversupply issues',
        };

        const description =
          eventDescriptions[event.type] || 'unusual market conditions';
        return `I heard ${system.name} is experiencing ${description}. Might be worth checking out.`;
      }
    }

    // Otherwise, hint about a good price somewhere
    const commodities = Object.keys(BASE_PRICES);
    const commodityIndex = Math.floor(rng.next() * commodities.length);
    const randomGood = commodities[commodityIndex];

    // Find a system with a good price for this commodity
    let bestSystem = null;
    let bestPrice = Infinity;

    for (const system of starData) {
      const price = TradingSystem.calculatePrice(
        randomGood,
        system,
        currentDay,
        activeEvents
      );
      if (price < bestPrice) {
        bestPrice = price;
        bestSystem = system;
      }
    }

    if (bestSystem) {
      return `Word on the street is that ${randomGood} prices are pretty good at ${bestSystem.name} right now.`;
    }

    // Fallback generic rumor
    return `The markets are always changing. Keep your eyes open for opportunities.`;
  }

  /**
   * Validate intelligence purchase
   *
   * @param {number} cost - Intelligence cost
   * @param {number} credits - Player credits
   * @returns {Object} { valid: boolean, reason: string }
   */
  static validatePurchase(cost, credits) {
    if (cost > credits) {
      return {
        valid: false,
        reason: 'Insufficient credits for intelligence',
      };
    }

    return { valid: true, reason: null };
  }

  /**
   * Get all systems with their intelligence costs
   *
   * Used for displaying the information broker interface.
   * Only returns systems connected to the current system via wormholes.
   *
   * @param {Object} priceKnowledge - Player's price knowledge database
   * @param {Array} starData - Star system data
   * @param {number} currentSystemId - Current system ID
   * @param {Object} navigationSystem - NavigationSystem instance for checking connections
   * @returns {Array} Array of { systemId, systemName, cost, lastVisit }
   */
  static listAvailableIntelligence(priceKnowledge, starData, currentSystemId, navigationSystem) {
    // Get systems connected to current system
    const connectedSystemIds = navigationSystem.getConnectedSystems(currentSystemId);

    // Filter to only connected systems and map to intelligence data
    return starData
      .filter((system) => connectedSystemIds.includes(system.id))
      .map((system) => {
        const knowledge = priceKnowledge[system.id];
        const cost = InformationBroker.getIntelligenceCost(
          system.id,
          priceKnowledge
        );
        const lastVisit = knowledge ? knowledge.lastVisit : null;

        return {
          systemId: system.id,
          systemName: system.name,
          cost: cost,
          lastVisit: lastVisit,
        };
      });
  }
}

// Re-export constants for testing convenience
export {
  INTELLIGENCE_PRICES as PRICES,
  INTELLIGENCE_RECENT_THRESHOLD as RECENT_THRESHOLD,
};
