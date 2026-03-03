import { InformationBroker } from '../../game-information-broker.js';
import { BaseManager } from './base-manager.js';
import { EVENT_NAMES } from '../../constants.js';

/**
 * Information Broker Manager - Handles intelligence trading system
 *
 * Responsibilities:
 * - Manage intelligence cost calculations
 * - Handle intelligence purchases
 * - Generate market rumors
 * - List available intelligence for connected systems
 */
export class InfoBrokerManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
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
    const priceKnowledge = this.gameStateManager.getPriceKnowledge();
    return InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
  }

  /**
   * Purchase market intelligence for a system
   *
   * @param {number} systemId - Target system ID
   * @param {number} discount - Discount fraction (0-1), e.g. 0.15 for 15% off
   * @returns {Object} { success: boolean, reason: string }
   */
  purchaseIntelligence(systemId, discount = 0) {
    const state = this.getState();

    const result = InformationBroker.purchaseIntelligence(
      state,
      systemId,
      this.starData,
      discount
    );

    if (result.success) {
      // Emit state change events
      this.emit(EVENT_NAMES.CREDITS_CHANGED, state.player.credits);
      this.emit(
        EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED,
        state.world.priceKnowledge
      );

      // Persist immediately - intelligence purchase modifies credits and price knowledge
      this.gameStateManager.markDirty();
    }

    return result;
  }

  /**
   * Generate a market rumor
   *
   * @returns {string} Rumor text
   */
  generateRumor() {
    const state = this.getState();
    if (!state.stats) state.stats = {};
    const purchaseCount = state.stats.rumorsPurchased || 0;
    const rumor = InformationBroker.generateRumor(
      state,
      this.starData,
      purchaseCount
    );
    state.stats.rumorsPurchased = purchaseCount + 1;
    this.gameStateManager.markDirty();
    return rumor;
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
    const state = this.getState();
    const priceKnowledge = this.gameStateManager.getPriceKnowledge();
    const currentSystemId = state.player.currentSystem;
    const activeEvents = this.gameStateManager.getActiveEvents();
    const hasAdvancedSensors = state.ship.upgrades.includes('advanced_sensors');

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
