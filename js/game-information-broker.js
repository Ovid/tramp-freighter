import {
  COMMODITY_TYPES,
  INTELLIGENCE_PRICES,
  INTELLIGENCE_RECENT_THRESHOLD,
  INTELLIGENCE_RELIABILITY,
  INTELLIGENCE_MAX_AGE,
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
   * Intelligence data is sometimes unreliable - prices may be manipulated
   * to show false profit opportunities.
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

    // Use seeded random for deterministic price manipulation
    // Seed includes system ID and day to ensure consistency
    const seed = `intel_${systemId}_${currentDay}`;
    const rng = new SeededRandom(seed);
    const marketConditions = gameState.world.marketConditions || {};

    for (const goodType of COMMODITY_TYPES) {
      let price = TradingSystem.calculatePrice(
        goodType,
        system,
        currentDay,
        activeEvents,
        marketConditions
      );

      // Sometimes the intelligence is unreliable - prices are manipulated
      // to show false profit opportunities
      if (rng.next() < INTELLIGENCE_RELIABILITY.MANIPULATION_CHANCE) {
        const manipulationMultiplier =
          INTELLIGENCE_RELIABILITY.MIN_MANIPULATION_MULTIPLIER +
          rng.next() *
            (INTELLIGENCE_RELIABILITY.MAX_MANIPULATION_MULTIPLIER -
              INTELLIGENCE_RELIABILITY.MIN_MANIPULATION_MULTIPLIER);
        price = Math.round(price * manipulationMultiplier);
      }

      currentPrices[goodType] = price;
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
   * Clean up old intelligence data
   *
   * Removes market data older than INTELLIGENCE_MAX_AGE days to prevent
   * stale information from cluttering the player's knowledge base.
   *
   * lastVisit represents days since last visit and is incremented automatically
   * as time passes, so we just check if it exceeds the threshold.
   *
   * @param {Object} priceKnowledge - Player's price knowledge database
   * @returns {number} Number of systems cleaned up
   */
  static cleanupOldIntelligence(priceKnowledge) {
    let cleanedCount = 0;

    for (const systemId in priceKnowledge) {
      const knowledge = priceKnowledge[systemId];

      if (knowledge.lastVisit > INTELLIGENCE_MAX_AGE) {
        delete priceKnowledge[systemId];
        cleanedCount++;
      }
    }

    return cleanedCount;
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
      const rumorTargetIndex = Math.floor(rng.next() * activeEvents.length);
      const marketDisruption = activeEvents[rumorTargetIndex];
      const system = starData.find((s) => s.id === marketDisruption.systemId);

      if (system) {
        // Get event type name from the event object or use generic description
        const eventDescriptions = {
          mining_strike: 'labor troubles',
          medical_emergency: 'a health crisis',
          festival: 'celebrations',
          supply_glut: 'oversupply issues',
        };

        const description =
          eventDescriptions[marketDisruption.type] ||
          'unusual market conditions';
        return `I heard ${system.name} is experiencing ${description}. Might be worth checking out.`;
      }
    }

    // Otherwise, hint about a good price somewhere
    const rumorCommodityIndex = Math.floor(rng.next() * COMMODITY_TYPES.length);
    const rumorCommodity = COMMODITY_TYPES[rumorCommodityIndex];
    const marketConditions = gameState.world.marketConditions || {};

    // Find a system with a good price for this commodity
    let bestSystem = null;
    let bestPrice = Infinity;

    for (const system of starData) {
      const price = TradingSystem.calculatePrice(
        rumorCommodity,
        system,
        currentDay,
        activeEvents,
        marketConditions
      );
      if (price < bestPrice) {
        bestPrice = price;
        bestSystem = system;
      }
    }

    if (bestSystem) {
      return `Word on the street is that ${rumorCommodity} prices are pretty good at ${bestSystem.name} right now.`;
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
    if (credits < cost) {
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
   * When Advanced Sensor Array upgrade is installed, includes active economic
   * events for connected systems.
   *
   * @param {Object} priceKnowledge - Player's price knowledge database
   * @param {Array} starData - Star system data
   * @param {number} currentSystemId - Current system ID
   * @param {Object} navigationSystem - NavigationSystem instance for checking connections
   * @param {Array} activeEvents - Active economic events (optional)
   * @param {boolean} hasAdvancedSensors - Whether Advanced Sensor Array is installed (optional)
   * @returns {Array} Array of { systemId, systemName, cost, lastVisit, event? }
   */
  static listAvailableIntelligence(
    priceKnowledge,
    starData,
    currentSystemId,
    navigationSystem,
    activeEvents = [],
    hasAdvancedSensors = false
  ) {
    // Get systems connected to current system
    const connectedSystemIds =
      navigationSystem.getConnectedSystems(currentSystemId);

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

        const result = {
          systemId: system.id,
          systemName: system.name,
          cost: cost,
          lastVisit: lastVisit,
        };

        // Add event information if Advanced Sensor Array is installed
        if (hasAdvancedSensors && activeEvents.length > 0) {
          const systemEvent = activeEvents.find(
            (event) => event.systemId === system.id
          );
          if (systemEvent) {
            result.event = {
              name: systemEvent.name,
              commodity: systemEvent.commodity,
              modifier: systemEvent.modifier,
            };
          }
        }

        return result;
      });
  }
}

// Re-export constants for testing convenience
export {
  INTELLIGENCE_PRICES as PRICES,
  INTELLIGENCE_RECENT_THRESHOLD as RECENT_THRESHOLD,
};
