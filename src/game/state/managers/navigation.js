import { BaseManager } from './base-manager.js';
import { calculateSystemPrices } from '../../utils/calculators.js';
import { EVENT_NAMES } from '../../constants.js';

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
  constructor(gameStateManager, starData) {
    super(gameStateManager);
    this.starData = starData;
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
    this.validateState();

    const state = this.getState();
    state.player.currentSystem = newSystemId;

    // Track exploration progress for future features (price discovery, missions)
    if (!state.world.visitedSystems.includes(newSystemId)) {
      state.world.visitedSystems.push(newSystemId);
    }

    // Snapshot prices at arrival to prevent intra-system arbitrage
    // Prices are locked until player leaves the system
    const system = this.starData.find((s) => s.id === newSystemId);
    if (!system) {
      throw new Error(
        `Invalid system ID: ${newSystemId} not found in star data`
      );
    }

    const currentDay = state.player.daysElapsed;
    const activeEvents = state.world.activeEvents;
    const marketConditions = state.world.marketConditions;

    const snapshotPrices = calculateSystemPrices(
      system,
      currentDay,
      activeEvents,
      marketConditions
    );

    // Store price snapshot for this system
    state.world.currentSystemPrices = snapshotPrices;

    if (state.stats) {
      state.stats.jumpsCompleted++;
    }

    this.emit(EVENT_NAMES.LOCATION_CHANGED, newSystemId);
    this.emit(EVENT_NAMES.JUMP_COMPLETED, newSystemId);
    this.gameStateManager.achievementsManager.checkAchievements();
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
    this.validateState();

    const state = this.getState();
    const currentSystemId = state.player.currentSystem;
    const currentSystem = this.starData.find((s) => s.id === currentSystemId);

    if (!currentSystem) {
      throw new Error(
        `Invalid game state: current system ID ${currentSystemId} not found in star data`
      );
    }

    // Calculate current prices for all commodities using dynamic pricing
    const currentDay = state.player.daysElapsed;
    const activeEvents = state.world.activeEvents;
    if (!activeEvents) {
      throw new Error('Invalid state: activeEvents missing from world state');
    }
    const marketConditions = state.world.marketConditions;
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
    this.gameStateManager.updatePriceKnowledge(
      currentSystemId,
      currentPrices,
      0,
      'visited'
    );

    // Persist state transition - prevents loss if player closes browser while docked
    this.gameStateManager.markDirty();

    this.emit(EVENT_NAMES.DOCKED, { systemId: currentSystemId });

    // Track docked systems for first_dock condition (after emit so
    // the event engine sees the system as not-yet-docked during check)
    const dockedSystems = state.world.narrativeEvents?.dockedSystems;
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
    this.validateState();

    const state = this.getState();

    // Persist state transition - prevents loss if player closes browser while undocked
    this.gameStateManager.markDirty();

    this.emit(EVENT_NAMES.UNDOCKED, { systemId: state.player.currentSystem });

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
    this.validateState();
    const state = this.getState();
    return state.world.visitedSystems.includes(systemId);
  }

  /**
   * Get current system data
   *
   * @returns {Object} Current system object with id, name, coordinates, etc.
   * @throws {Error} If called before game initialization or system not found
   */
  getCurrentSystem() {
    this.validateState();

    const state = this.getState();
    const systemId = state.player.currentSystem;
    const system = this.starData.find((s) => s.id === systemId);

    if (!system) {
      throw new Error(
        `Invalid game state: current system ID ${systemId} not found in star data`
      );
    }

    return system;
  }
}
