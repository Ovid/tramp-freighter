import { DEV_MODE } from '../../constants.js';

/**
 * Base class for GameStateManager modules
 *
 * Provides common patterns and utilities for state management modules.
 * All managers should extend this class to ensure consistent behavior.
 *
 * Save pattern: managers call this.gameStateManager.markDirty() after mutations.
 * This is deliberately explicit rather than automatic — not every method mutates
 * state, and auto-marking would trigger unnecessary saves on read operations.
 * SaveLoadManager debounces with a 500ms trailing timer.
 */
export class BaseManager {
  /**
   * Initialize base manager with required dependencies
   *
   * @param {GameStateManager|Object} gsmOrCapabilities - GSM/Coordinator instance or capability object
   */
  constructor(gsmOrCapabilities) {
    if (!gsmOrCapabilities) {
      throw new Error('BaseManager requires gameStateManager or capabilities');
    }

    // Detect mode: GSM/Coordinator instances have a `state` property (even when null)
    // Capability objects use getOwnState() or specific getters and never have `state`
    if ('state' in gsmOrCapabilities) {
      // Legacy mode: received GSM/Coordinator instance
      this.gameStateManager = gsmOrCapabilities;
      this.isTestEnvironment = gsmOrCapabilities.isTestEnvironment;
    } else {
      // Capability mode: received capability object
      this.capabilities = gsmOrCapabilities;
      this.isTestEnvironment = gsmOrCapabilities.isTestEnvironment ?? false;
    }
  }

  /**
   * Get current game state
   * @returns {Object} Current game state
   */
  getState() {
    if (!this.gameStateManager.state) {
      throw new Error(
        `Invalid state: ${this.constructor.name} called before game initialization`
      );
    }
    return this.gameStateManager.state;
  }

  /**
   * Emit an event through the main state manager
   * @param {string} eventType - Event type to emit
   * @param {*} data - Event data
   */
  emit(eventType, data) {
    this.gameStateManager.emit(eventType, data);
  }

  /**
   * Get star data reference
   * @returns {Array} Star data array
   */
  getStarData() {
    return this.gameStateManager.starData;
  }

  /**
   * Get wormhole data reference
   * @returns {Array} Wormhole data array
   */
  getWormholeData() {
    return this.gameStateManager.wormholeData;
  }

  /**
   * Get navigation system reference
   * @returns {Object} Navigation system instance
   */
  getNavigationSystem() {
    return this.gameStateManager.navigationSystem;
  }

  /**
   * Validate that game state exists before operations
   * @throws {Error} If state is not initialized
   */
  validateState() {
    if (this.gameStateManager) {
      if (!this.gameStateManager.state) {
        throw new Error(
          `Invalid state: ${this.constructor.name} operation called before game initialization`
        );
      }
      return;
    }
    // Capability mode: capabilities are always valid by construction
  }

  /**
   * Log debug information (suppressed in test environment)
   * @param {...*} args - Arguments to log
   */
  log(...args) {
    if (DEV_MODE) {
      console.log(`[${this.constructor.name}]`, ...args);
    }
  }

  /**
   * Log warning information (suppressed unless dev mode is active)
   * @param {...*} args - Arguments to log
   */
  warn(...args) {
    if (DEV_MODE) {
      console.warn(`[${this.constructor.name}]`, ...args);
    }
  }

  /**
   * Log error information (always logged, even in tests)
   * @param {...*} args - Arguments to log
   */
  error(...args) {
    console.error(`[${this.constructor.name}]`, ...args);
  }
}
