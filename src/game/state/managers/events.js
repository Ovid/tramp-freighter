import { EconomicEventsSystem } from '../../game-events.js';
import { InformationBroker } from '../../game-information-broker.js';
import { BaseManager } from './base-manager.js';

/**
 * Events Manager - Handles economic events and time advancement
 *
 * Responsibilities:
 * - Manage active economic events
 * - Coordinate time advancement with other systems
 * - Update event states when time passes
 * - Provide event information to other systems
 */
export class EventsManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
    this.starData = gameStateManager.starData;
  }

  /**
   * Get active events array
   */
  getActiveEvents() {
    const state = this.getState();
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
    const state = this.getState();
    // activeEvents is guaranteed to exist after initialization
    state.world.activeEvents = newEvents;
    this.emit('activeEventsChanged', newEvents);
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
    const state = this.getState();
    const oldDays = state.player.daysElapsed;
    state.player.daysElapsed = newDays;

    // When days advance, update price knowledge and events
    if (newDays > oldDays) {
      const daysPassed = newDays - oldDays;

      // Increment staleness for all systems
      this.gameStateManager.incrementPriceKnowledgeStaleness(daysPassed);

      // Clean up old intelligence data
      InformationBroker.cleanupOldIntelligence(state.world.priceKnowledge);

      // Apply market recovery (decay surplus/deficit over time)
      this.gameStateManager.applyMarketRecovery(daysPassed);

      // Update economic events (trigger new events, remove expired ones)
      state.world.activeEvents = EconomicEventsSystem.updateEvents(
        state,
        this.starData
      );

      // Recalculate prices with new day number (for daily fluctuations)
      this.gameStateManager.recalculatePricesForKnownSystems();

      // Check for loan defaults and apply penalties
      this.gameStateManager.checkLoanDefaults();

      // Emit event changes
      this.emit('activeEventsChanged', state.world.activeEvents);
    }

    this.emit('timeChanged', newDays);
  }
}
