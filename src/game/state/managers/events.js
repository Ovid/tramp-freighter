import { EconomicEventsSystem } from '../../game-events.js';
import { calculateUpdatedEvents } from '../../utils/calculators.js';
import { BaseManager } from './base-manager.js';
import { EVENT_NAMES } from '../../constants.js';

/**
 * Events Manager - Handles economic events and time advancement
 *
 * Responsibilities:
 * - Manage active economic events
 * - Coordinate time advancement with other systems
 * - Update event states when time passes
 * - Provide event information to other systems
 *
 * Uses capability injection exclusively. Required capabilities:
 * - getOwnState() → { activeEvents, daysElapsed }
 * - setDaysElapsed(newDays)
 * - setActiveEvents(events)
 * - getPriceKnowledge()
 * - getMarketConditions()
 * - incrementPriceKnowledgeStaleness(days)
 * - cleanupOldIntelligence()
 * - applyMarketRecovery(daysPassed)
 * - recalculatePricesForKnownSystems()
 * - checkLoanDefaults()
 * - processDebtTick()
 * - checkMissionDeadlines()
 * - markDirty()
 * - emit(eventName, data)
 * - starData
 * - isTestEnvironment
 */
export class EventsManager extends BaseManager {
  constructor(capabilities) {
    super(capabilities);
  }

  /**
   * Get active events array
   */
  getActiveEvents() {
    const ownState = this.capabilities.getOwnState();
    return ownState.activeEvents;
  }

  /**
   * Update active events (typically called on day change)
   *
   * This method should be called by external event system logic
   *
   * @param {Array} newEvents - Updated events array
   */
  updateActiveEvents(newEvents) {
    this.capabilities.setActiveEvents(newEvents);
    this.capabilities.emit(EVENT_NAMES.ACTIVE_EVENTS_CHANGED, newEvents);
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
    return Object.hasOwn(EconomicEventsSystem.EVENT_TYPES, eventTypeKey)
      ? EconomicEventsSystem.EVENT_TYPES[eventTypeKey]
      : null;
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
    const ownState = this.capabilities.getOwnState();
    const oldDays = ownState.daysElapsed;
    this.capabilities.setDaysElapsed(newDays);

    // When days advance, update price knowledge and events
    if (newDays > oldDays) {
      const daysPassed = newDays - oldDays;

      // Increment staleness for all systems
      this.capabilities.incrementPriceKnowledgeStaleness(daysPassed);

      // Clean up old intelligence data
      this.capabilities.cleanupOldIntelligence();

      // Apply market recovery (decay surplus/deficit over time)
      this.capabilities.applyMarketRecovery(daysPassed);

      // Update economic events (trigger new events, remove expired ones)
      const stateForCalc = {
        player: { daysElapsed: newDays },
        world: {
          activeEvents: this.capabilities.getOwnState().activeEvents,
          priceKnowledge: this.capabilities.getPriceKnowledge(),
          marketConditions: this.capabilities.getMarketConditions(),
        },
      };
      const updatedEvents = calculateUpdatedEvents(
        stateForCalc,
        this.capabilities.starData
      );
      this.capabilities.setActiveEvents(updatedEvents);

      // Recalculate prices with new day number (for daily fluctuations)
      this.capabilities.recalculatePricesForKnownSystems();

      // Check for loan defaults and apply penalties
      this.capabilities.checkLoanDefaults();

      // Process Cole debt: interest accrual and checkpoint checks
      this.capabilities.processDebtTick();

      this.capabilities.checkMissionDeadlines();

      // Emit event changes
      this.capabilities.emit(
        EVENT_NAMES.ACTIVE_EVENTS_CHANGED,
        this.capabilities.getOwnState().activeEvents
      );
    }

    this.capabilities.markDirty();
    this.capabilities.emit(EVENT_NAMES.TIME_CHANGED, newDays);
  }
}
