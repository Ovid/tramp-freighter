/**
 * EventSystemManager - Bridges imperative game state with React's declarative rendering
 *
 * React components need to re-render when game state changes, but GameStateManager
 * uses imperative mutations. This manager solves the impedance mismatch by providing
 * an event system that React components can subscribe to via useGameEvent hook.
 *
 * Without this bridge, components would either need to poll for changes (inefficient)
 * or GameStateManager would need React-specific knowledge (coupling violation).
 * The event system maintains clean separation while enabling reactive UI updates.
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
      hiddenCargoChanged: [],
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
      factionRepChanged: [],
      encounterTriggered: [],
      narrativeEventTriggered: [],
      hullChanged: [],
      engineChanged: [],
      lifeSupportChanged: [],
      karmaChanged: [],
      intelligenceChanged: [],
      currentSystemChanged: [],
      missionsChanged: [],
      docked: [],
      questChanged: [],
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
   *   - hiddenCargoChanged: (Array<CargoStack>) - Ship hidden cargo array with stacks
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
   *   - factionRepChanged: (Object) - Faction reputation object with authorities, outlaws, etc.
   *   - encounterTriggered: (Object) - Danger system encounter event with type and encounter data
   *   - hullChanged: (number) - Ship hull condition percentage (0-100)
   *   - engineChanged: (number) - Ship engine condition percentage (0-100)
   *   - lifeSupportChanged: (number) - Ship life support condition percentage (0-100)
   *   - karmaChanged: (number) - Player karma value for reputation and encounter outcomes
   *   - intelligenceChanged: (Object) - Information broker intelligence database
   *   - currentSystemChanged: (number) - Current system ID (alias for locationChanged)
   * @param {function} callback - Function to call when event occurs, receives event data as parameter
   */
  subscribe(eventType, callback) {
    if (!this.subscribers[eventType]) {
      console.warn(`Unknown event type: ${eventType}`);
      return;
    }

    this.subscribers[eventType].push(callback);
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
