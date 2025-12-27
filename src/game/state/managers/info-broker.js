import { InformationBroker } from '../../game-information-broker.js';

/**
 * Information Broker Manager - Handles intelligence trading system
 *
 * Responsibilities:
 * - Manage intelligence cost calculations
 * - Handle intelligence purchases
 * - Generate market rumors
 * - List available intelligence for connected systems
 */
export class InfoBrokerManager {
  constructor(gameStateManager) {
    this.gameStateManager = gameStateManager;
    this.starData = gameStateManager.starData;
    this.navigationSystem = gameStateManager.navigationSystem;
  }

  /**
   * Get intelligence cost for a system
   *
   * @param {number} systemId - Target system ID
   * @returns {number} Cost in credits
   */
  getIntelligenceCost(systemId) {
    const priceKnowledge = this.gameStateManager.tradingManager.getPriceKnowledge();
    return InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
  }

  /**
   * Purchase market intelligence for a system
   *
   * @param {number} systemId - Target system ID
   * @returns {Object} { success: boolean, reason: string }
   */
  purchaseIntelligence(systemId) {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid state: purchaseIntelligence called before game initialization'
      );
    }

    const result = InformationBroker.purchaseIntelligence(
      state,
      systemId,
      this.starData
    );

    if (result.success) {
      // Emit state change events
      this.gameStateManager.emit('creditsChanged', state.player.credits);
      this.gameStateManager.emit('priceKnowledgeChanged', state.world.priceKnowledge);

      // Persist immediately - intelligence purchase modifies credits and price knowledge
      this.gameStateManager.saveGame();
    }

    return result;
  }

  /**
   * Generate a market rumor
   *
   * @returns {string} Rumor text
   */
  generateRumor() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid state: generateRumor called before game initialization'
      );
    }

    return InformationBroker.generateRumor(state, this.starData);
  }

  /**
   * Get list of systems connected to current system with intelligence costs
   *
   * When Advanced Sensor Array upgrade is installed, includes active economic
   * events for connected systems.
   *
   * @returns {Array} Array of { systemId, systemName, cost, lastVisit, event? }
   */
  listAvailableIntelligence() {
    const state = this.gameStateManager.getState();
    const priceKnowledge = this.gameStateManager.tradingManager.getPriceKnowledge();
    const currentSystemId = state.player.currentSystem;
    const activeEvents = this.gameStateManager.eventsManager.getActiveEvents();
    const hasAdvancedSensors =
      state.ship.upgrades.includes('advanced_sensors');

    return InformationBroker.listAvailableIntelligence(
      priceKnowledge,
      this.starData,
      currentSystemId,
      this.navigationSystem,
      activeEvents,
      hasAdvancedSensors
    );
  }
}