import { BaseManager } from './base-manager.js';
import { calculateSystemPrices } from '../../utils/calculators.js';
import { EVENT_NAMES, INTELLIGENCE_CONFIG } from '../../constants.js';

/**
 * NavigationManager - Manages player location, docking, and system exploration
 *
 * Handles all navigation-related operations including:
 * - Location updates and system tracking
 * - Docking and undocking operations
 * - System visitation tracking
 * - Price snapshot management on arrival
 */
export class NavigationManager extends BaseManager {
  constructor(capabilities) {
    super(capabilities);
  }

  /**
   * Update player location to a new system
   *
   * Tracks exploration progress and snapshots prices at arrival to prevent
   * intra-system arbitrage. Prices are locked until player leaves the system.
   *
   * @param {number} newSystemId - ID of the destination system
   * @throws {Error} If system ID is not found in star data
   */
  updateLocation(newSystemId) {
    this.capabilities.setCurrentSystem(newSystemId);

    // Track exploration progress for future features (price discovery, missions)
    const { visitedSystems } = this.capabilities.getOwnState();
    if (!visitedSystems.includes(newSystemId)) {
      visitedSystems.push(newSystemId);
    }

    // Create orbit-only priceKnowledge entry if none exists
    const priceKnowledge = this.capabilities.getPriceKnowledge();
    if (!priceKnowledge[newSystemId]) {
      this.capabilities.updatePriceKnowledge(newSystemId, null, 0, INTELLIGENCE_CONFIG.SOURCES.ORBIT);
    }

    // Snapshot prices at arrival to prevent intra-system arbitrage
    // Prices are locked until player leaves the system
    const system = this.capabilities.starData.find((s) => s.id === newSystemId);
    if (!system) {
      throw new Error(
        `Invalid system ID: ${newSystemId} not found in star data`
      );
    }

    const currentDay = this.capabilities.getDaysElapsed();
    const activeEvents = this.capabilities.getActiveEvents();
    const marketConditions = this.capabilities.getMarketConditions();

    const snapshotPrices = calculateSystemPrices(
      system,
      currentDay,
      activeEvents,
      marketConditions
    );

    // Store price snapshot for this system
    this.capabilities.setCurrentSystemPrices(snapshotPrices);

    const stats = this.capabilities.getStats();
    if (stats) {
      stats.jumpsCompleted++;
    }

    this.capabilities.emit(EVENT_NAMES.LOCATION_CHANGED, newSystemId);
    this.capabilities.emit(EVENT_NAMES.JUMP_COMPLETED, newSystemId);
    this.capabilities.checkAchievements();
    this.capabilities.markDirty();
  }

  /**
   * Dock at current system's station to access trading and refueling
   *
   * Updates price knowledge on dock:
   * - First visit: Records current prices with lastVisit = daysElapsed
   * - Subsequent visits: Updates prices and resets lastVisit to 0
   *
   * @returns {Object} { success: boolean }
   * @throws {Error} If called before game initialization or system not found
   */
  dock() {
    const { currentSystem: currentSystemId } = this.capabilities.getOwnState();
    const currentSystem = this.capabilities.starData.find(
      (s) => s.id === currentSystemId
    );

    if (!currentSystem) {
      throw new Error(
        `Invalid game state: current system ID ${currentSystemId} not found in star data`
      );
    }

    // Calculate current prices for all commodities using dynamic pricing
    const currentDay = this.capabilities.getDaysElapsed();
    const activeEvents = this.capabilities.getActiveEvents();
    if (!activeEvents) {
      throw new Error('Invalid state: activeEvents missing from world state');
    }
    const marketConditions = this.capabilities.getMarketConditions();
    if (!marketConditions) {
      throw new Error(
        'Invalid state: marketConditions missing from world state'
      );
    }
    const currentPrices = calculateSystemPrices(
      currentSystem,
      currentDay,
      activeEvents,
      marketConditions
    );

    // Update price knowledge (resets lastVisit to 0)
    this.capabilities.updatePriceKnowledge(
      currentSystemId,
      currentPrices,
      0,
      INTELLIGENCE_CONFIG.SOURCES.VISITED
    );

    // Persist state transition - prevents loss if player closes browser while docked
    this.capabilities.markDirty();

    this.capabilities.emit(EVENT_NAMES.DOCKED, {
      systemId: currentSystemId,
    });

    // Track docked systems for first_dock condition (after emit so
    // the event engine sees the system as not-yet-docked during check)
    const dockedSystems = this.capabilities.getDockedSystems();
    if (dockedSystems && !dockedSystems.includes(currentSystemId)) {
      dockedSystems.push(currentSystemId);
    }

    return { success: true };
  }

  /**
   * Undock from current system's station to resume navigation
   *
   * Currently a state transition marker for auto-save
   * Future: Will close station UI, enable jumps, track undocked state.
   *
   * @returns {Object} { success: boolean }
   * @throws {Error} If called before game initialization
   */
  undock() {
    const { currentSystem } = this.capabilities.getOwnState();

    // Persist state transition - prevents loss if player closes browser while undocked
    this.capabilities.markDirty();

    this.capabilities.emit(EVENT_NAMES.UNDOCKED, {
      systemId: currentSystem,
    });

    return { success: true };
  }

  /**
   * Check if a system has been visited by the player
   *
   * @param {number} systemId - System ID to check
   * @returns {boolean} True if system has been visited
   * @throws {Error} If called before game initialization
   */
  isSystemVisited(systemId) {
    const { visitedSystems } = this.capabilities.getOwnState();
    return visitedSystems.includes(systemId);
  }

  /**
   * Get current system data
   *
   * @returns {Object} Current system object with id, name, coordinates, etc.
   * @throws {Error} If called before game initialization or system not found
   */
  getCurrentSystem() {
    const { currentSystem: systemId } = this.capabilities.getOwnState();
    const system = this.capabilities.starData.find((s) => s.id === systemId);

    if (!system) {
      throw new Error(
        `Invalid game state: current system ID ${systemId} not found in star data`
      );
    }

    return system;
  }
}
