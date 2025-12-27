import { EconomicEventsSystem } from '../../game-events.js';
import { InformationBroker } from '../../game-information-broker.js';

/**
 * Events Manager - Handles economic events and time advancement
 *
 * Responsibilities:
 * - Manage active economic events
 * - Coordinate time advancement with other systems
 * - Update event states when time passes
 * - Provide event information to other systems
 */
export class EventsManager {
  constructor(gameStateManager) {
    this.gameStateManager = gameStateManager;
    this.starData = gameStateManager.starData;
  }

  /**
   * Get active events array
   */
  getActiveEvents() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid state: getActiveEvents called before game initialization'
      );
    }
    return state.world.activeEvents;
  }

  /**
   * Update active events (typically called on day change)
   *
   * This method should be called by external event system logic
   *
   * @param {Array} newEvents - Updated events array
   */
  updateActiveEvents(newEvents) {
    const state = this.gameStateManager.getState();
    // activeEvents is guaranteed to exist after initialization
    state.world.activeEvents = newEvents;
    this.gameStateManager.emit('activeEventsChanged', newEvents);
  }

  /**
   * Get active event for a specific system
   *
   * @param {number} systemId - System identifier
   * @returns {Object|null} Active event or null
   */
  getActiveEventForSystem(systemId) {
    const activeEvents = this.getActiveEvents();
    return activeEvents.find((event) => event.systemId === systemId) || null;
  }

  /**
   * Get event type definition by event type key
   * @param {string} eventTypeKey - Event type identifier
   * @returns {Object|null} Event type definition or null
   */
  getEventType(eventTypeKey) {
    return EconomicEventsSystem.EVENT_TYPES[eventTypeKey] || null;
  }

  /**
   * Update time and coordinate with other systems
   *
   * When days advance, this method:
   * 1. Updates the player's daysElapsed
   * 2. Increments price knowledge staleness
   * 3. Cleans up old intelligence data
   * 4. Applies market recovery
   * 5. Updates economic events
   * 6. Recalculates prices for known systems
   * 7. Checks for loan defaults
   * 8. Emits time and event change events
   *
   * @param {number} newDays - New days elapsed value
   */
  updateTime(newDays) {
    const state = this.gameStateManager.getState();
    const oldDays = state.player.daysElapsed;
    state.player.daysElapsed = newDays;

    // When days advance, update price knowledge and events
    if (newDays > oldDays) {
      const daysPassed = newDays - oldDays;

      // Increment staleness for all systems
      this.gameStateManager.tradingManager.incrementPriceKnowledgeStaleness(daysPassed);

      // Clean up old intelligence data
      InformationBroker.cleanupOldIntelligence(state.world.priceKnowledge);

      // Apply market recovery (decay surplus/deficit over time)
      this.gameStateManager.tradingManager.applyMarketRecovery(daysPassed);

      // Update economic events (trigger new events, remove expired ones)
      state.world.activeEvents = EconomicEventsSystem.updateEvents(
        state,
        this.starData
      );

      // Recalculate prices with new day number (for daily fluctuations)
      this.gameStateManager.tradingManager.recalculatePricesForKnownSystems();

      // Check for loan defaults and apply penalties
      this.gameStateManager.npcManager.checkLoanDefaults();

      // Emit event changes
      this.gameStateManager.emit('activeEventsChanged', state.world.activeEvents);
    }

    this.gameStateManager.emit('timeChanged', newDays);
  }
}