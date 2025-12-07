import { LY_PER_UNIT } from './game-constants.js';

/**
 * NavigationSystem - Handles distance calculations and jump mechanics
 *
 * Responsibilities:
 * - Calculate distances between star systems
 * - Calculate jump time and fuel costs
 * - Validate wormhole connections
 * - Execute jump operations
 */
export class NavigationSystem {
  constructor(starData, wormholeData) {
    this.starData = starData;
    this.wormholeData = wormholeData;
  }

  // ========================================================================
  // DISTANCE CALCULATIONS
  // ========================================================================

  /**
   * Calculate distance from Sol to a star system
   * Formula: hypot(x, y, z) * LY_PER_UNIT
   *
   * @param {Object} star - Star system object with x, y, z coordinates
   * @returns {number} Distance in light years
   */
  calculateDistanceFromSol(star) {
    const r = Math.hypot(star.x, star.y, star.z);
    return r * LY_PER_UNIT;
  }

  /**
   * Calculate distance between two star systems
   * Formula: hypot(x₁-x₂, y₁-y₂, z₁-z₂) * LY_PER_UNIT
   *
   * @param {Object} star1 - First star system with x, y, z coordinates
   * @param {Object} star2 - Second star system with x, y, z coordinates
   * @returns {number} Distance in light years
   */
  calculateDistanceBetween(star1, star2) {
    const r = Math.hypot(
      star1.x - star2.x,
      star1.y - star2.y,
      star1.z - star2.z
    );
    return r * LY_PER_UNIT;
  }

  // ========================================================================
  // JUMP CALCULATIONS
  // ========================================================================

  /**
   * Calculate jump time based on distance
   * Formula: max(1, ceil(distance × 0.5))
   *
   * @param {number} distance - Distance in light years
   * @returns {number} Jump time in days
   */
  calculateJumpTime(distance) {
    return Math.max(1, Math.ceil(distance * 0.5));
  }

  /**
   * Calculate fuel cost for a jump
   * Formula: 10 + (distance × 2)
   *
   * @param {number} distance - Distance in light years
   * @returns {number} Fuel cost as percentage
   */
  calculateFuelCost(distance) {
    return 10 + distance * 2;
  }

  // ========================================================================
  // CONNECTION VALIDATION
  // ========================================================================

  /**
   * Check if two systems are connected by a wormhole
   *
   * @param {number} systemId1 - First system ID
   * @param {number} systemId2 - Second system ID
   * @returns {boolean} True if systems are connected
   */
  areSystemsConnected(systemId1, systemId2) {
    return this.wormholeData.some(
      (connection) =>
        (connection[0] === systemId1 && connection[1] === systemId2) ||
        (connection[0] === systemId2 && connection[1] === systemId1)
    );
  }

  /**
   * Get all systems connected to a given system
   *
   * @param {number} systemId - System ID to check
   * @returns {number[]} Array of connected system IDs
   */
  getConnectedSystems(systemId) {
    const connected = [];

    for (const connection of this.wormholeData) {
      if (connection[0] === systemId) {
        connected.push(connection[1]);
      } else if (connection[1] === systemId) {
        connected.push(connection[0]);
      }
    }

    return connected;
  }

  // ========================================================================
  // JUMP VALIDATION AND EXECUTION
  // ========================================================================

  /**
   * Validate if a jump is possible
   *
   * @param {number} currentSystemId - Current system ID
   * @param {number} targetSystemId - Target system ID
   * @param {number} currentFuel - Current fuel percentage
   * @returns {Object} { valid: boolean, error: string|null, fuelCost: number, distance: number, jumpTime: number }
   */
  validateJump(currentSystemId, targetSystemId, currentFuel) {
    // Check wormhole connection
    if (!this.areSystemsConnected(currentSystemId, targetSystemId)) {
      return {
        valid: false,
        error: 'No wormhole connection to target system',
        fuelCost: 0,
        distance: 0,
        jumpTime: 0,
      };
    }

    // Get star systems
    const currentStar = this.starData.find((s) => s.id === currentSystemId);
    const targetStar = this.starData.find((s) => s.id === targetSystemId);

    if (!currentStar || !targetStar) {
      return {
        valid: false,
        error: 'Invalid system ID',
        fuelCost: 0,
        distance: 0,
        jumpTime: 0,
      };
    }

    // Calculate jump parameters
    const distance = this.calculateDistanceBetween(currentStar, targetStar);
    const fuelCost = this.calculateFuelCost(distance);
    const jumpTime = this.calculateJumpTime(distance);

    // Check fuel availability
    if (currentFuel < fuelCost) {
      return {
        valid: false,
        error: 'Insufficient fuel for jump',
        fuelCost,
        distance,
        jumpTime,
      };
    }

    return {
      valid: true,
      error: null,
      fuelCost,
      distance,
      jumpTime,
    };
  }

  /**
   * Execute a jump (updates game state)
   *
   * @param {Object} gameStateManager - GameStateManager instance
   * @param {number} targetSystemId - Target system ID
   * @returns {Object} { success: boolean, error: string|null }
   */
  executeJump(gameStateManager, targetSystemId) {
    const state = gameStateManager.getState();

    if (!state) {
      return { success: false, error: 'No game state' };
    }

    const currentSystemId = state.player.currentSystem;
    const currentFuel = state.ship.fuel;

    // Validate jump
    const validation = this.validateJump(
      currentSystemId,
      targetSystemId,
      currentFuel
    );

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Execute jump: update fuel, time, and location
    gameStateManager.updateFuel(currentFuel - validation.fuelCost);
    gameStateManager.updateTime(state.player.daysElapsed + validation.jumpTime);
    gameStateManager.updateLocation(targetSystemId);

    // Auto-save after jump
    gameStateManager.saveGame();

    return { success: true, error: null };
  }
}
