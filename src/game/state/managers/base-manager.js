import { DEV_MODE } from '../../constants.js';

/**
 * Base class for game state managers
 *
 * Provides capability storage and logging utilities.
 * All managers receive a capability object at construction.
 */
export class BaseManager {
  /**
   * Initialize base manager with capability object
   *
   * @param {Object} capabilities - Injected capability object with read queries, write callbacks, and infrastructure
   */
  constructor(capabilities) {
    if (!capabilities) {
      throw new Error('BaseManager requires a capabilities object');
    }

    this.capabilities = capabilities;
    this.isTestEnvironment = capabilities.isTestEnvironment ?? false;
  }

  /**
   * Validate state before operations (no-op in capability mode)
   *
   * Retained for backward compatibility with managers not yet migrated
   * to capability injection. Will be removed once all managers are migrated.
   */
  validateState() {
    // In capability mode, capabilities are always valid by construction
  }

  /**
   * Log debug information (suppressed unless DEV_MODE is active)
   * @param {...*} args - Arguments to log
   */
  log(...args) {
    if (DEV_MODE) {
      console.log(`[${this.constructor.name}]`, ...args);
    }
  }

  /**
   * Log warning information (suppressed unless DEV_MODE is active)
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
