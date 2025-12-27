/**
 * EventSystemManager - Manages event subscription and emission for Bridge Pattern integration
 *
 * Handles the event system that connects the imperative GameStateManager to React's
 * declarative model. Components subscribe to state changes via useGameEvent hook,
 * which uses this manager to register callbacks and receive notifications.
 *
 * Responsibilities:
 * - Maintain subscriber lists for each event type
 * - Handle subscription and unsubscription
 * - Emit events to all registered callbacks
 * - Provide error handling for subscriber callbacks
 */
export class EventSystemManager {
  constructor(gameStateManager) {
    this.gameStateManager = gameStateManager;

    // Supports multiple UI components subscribing to same state changes
    this.subscribers = {
      creditsChanged: [],
      debtChanged: [],
      fuelChanged: [],
      cargoChanged: [],
      cargoCapacityChanged: [],
      locationChanged: [],
      timeChanged: [],
      priceKnowledgeChanged: [],
      activeEventsChanged: [],
      shipConditionChanged: [],
      conditionWarning: [],
      shipNameChanged: [],
      upgradesChanged: [],
      quirksChanged: [],
      dialogueChanged: [],
    };
  }

  /**
   * Subscribe to state change events for Bridge Pattern integration
   *
   * @param {string} eventType - Event type to subscribe to:
   *   - creditsChanged: (number) - Player's current credits
   *   - debtChanged: (number) - Player's current debt
   *   - fuelChanged: (number) - Ship fuel percentage (0-100)
   *   - cargoChanged: (Array<CargoStack>) - Ship cargo array with stacks
   *   - cargoCapacityChanged: (number) - Ship cargo capacity in units
   *   - locationChanged: (number) - Current system ID
   *   - timeChanged: (number) - Days elapsed since game start
   *   - priceKnowledgeChanged: (Object) - Price knowledge database
   *   - activeEventsChanged: (Array) - Active economic events
   *   - shipConditionChanged: (Object) - {hull, engine, lifeSupport} percentages
   *   - conditionWarning: (Array) - Warning objects for low condition systems
   *   - shipNameChanged: (string) - Ship name
   *   - upgradesChanged: (Array<string>) - Installed upgrade IDs
   *   - quirksChanged: (Array<string>) - Ship quirk IDs
   *   - dialogueChanged: (Object) - Current dialogue state
   * @param {function} callback - Function to call when event occurs, receives event data as parameter
   */
  subscribe(eventType, callback) {
    if (!this.subscribers[eventType]) {
      console.warn(`Unknown event type: ${eventType}`);
      return;
    }

    this.subscribers[eventType].push(callback);
    if (!this.gameStateManager.isTestEnvironment) {
      console.log(
        `Subscribed to ${eventType}, total subscribers: ${this.subscribers[eventType].length}`
      );
    }
  }

  /**
   * Unsubscribe from state change events
   *
   * @param {string} eventType - Event type to unsubscribe from
   * @param {function} callback - Callback function to remove
   */
  unsubscribe(eventType, callback) {
    if (!this.subscribers[eventType]) {
      return;
    }

    const index = this.subscribers[eventType].indexOf(callback);
    if (index > -1) {
      this.subscribers[eventType].splice(index, 1);
    }
  }

  /**
   * Emit event to all registered subscribers
   *
   * @param {string} eventType - Event type to emit
   * @param {*} data - Event data to pass to subscribers
   */
  emit(eventType, data) {
    if (!this.subscribers[eventType]) {
      return;
    }

    this.subscribers[eventType].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${eventType} subscriber:`, error);
      }
    });
  }

  /**
   * Get subscribers object for testing purposes
   * 
   * @returns {Object} The subscribers object
   */
  getSubscribers() {
    return this.subscribers;
  }
}