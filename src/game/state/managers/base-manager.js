/**
 * Base class for GameStateManager modules
 *
 * Provides common patterns and utilities for state management modules.
 * All managers should extend this class to ensure consistent behavior.
 */
export class BaseManager {
  /**
   * Initialize base manager with required dependencies
   *
   * @param {GameStateManager} gameStateManager - Reference to main state manager
   */
  constructor(gameStateManager) {
    if (!gameStateManager) {
      throw new Error('BaseManager requires gameStateManager instance');
    }

    this.gameStateManager = gameStateManager;
    this.isTestEnvironment = gameStateManager.isTestEnvironment;
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
   * Save game state through the main state manager
   * Note: SaveLoadManager should not use this method to avoid circular calls
   * @returns {boolean} Success status
   */
  saveGame() {
    return this.gameStateManager.saveGame();
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
    if (!this.gameStateManager.state) {
      throw new Error(
        `Invalid state: ${this.constructor.name} operation called before game initialization`
      );
    }
  }

  /**
   * Log debug information (suppressed in test environment)
   * @param {...*} args - Arguments to log
   */
  log(...args) {
    if (!this.isTestEnvironment) {
      console.log(`[${this.constructor.name}]`, ...args);
    }
  }

  /**
   * Log warning information (suppressed in test environment)
   * @param {...*} args - Arguments to log
   */
  warn(...args) {
    if (!this.isTestEnvironment) {
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
