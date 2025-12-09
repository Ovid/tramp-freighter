'use strict';

import {
  LY_PER_UNIT,
  SHIP_DEGRADATION,
  SHIP_CONDITION_BOUNDS,
  ENGINE_CONDITION_PENALTIES,
} from './game-constants.js';

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

  /**
   * Calculate fuel cost with engine condition penalty
   *
   * When engine condition falls below ENGINE_CONDITION_PENALTIES.THRESHOLD,
   * fuel consumption increases by ENGINE_CONDITION_PENALTIES.FUEL_PENALTY_MULTIPLIER
   * due to reduced propulsion efficiency.
   *
   * @param {number} distance - Distance in light years
   * @param {number} engineCondition - Engine condition percentage (0-100)
   * @returns {number} Fuel cost as percentage
   */
  calculateFuelCostWithCondition(distance, engineCondition) {
    const baseCost = this.calculateFuelCost(distance);

    if (engineCondition < ENGINE_CONDITION_PENALTIES.THRESHOLD) {
      return baseCost * ENGINE_CONDITION_PENALTIES.FUEL_PENALTY_MULTIPLIER;
    }

    return baseCost;
  }

  /**
   * Calculate jump time with engine condition penalty
   *
   * When engine condition falls below ENGINE_CONDITION_PENALTIES.THRESHOLD,
   * jump time increases by ENGINE_CONDITION_PENALTIES.TIME_PENALTY_DAYS
   * due to slower wormhole transit.
   *
   * @param {number} distance - Distance in light years
   * @param {number} engineCondition - Engine condition percentage (0-100)
   * @returns {number} Jump time in days
   */
  calculateJumpTimeWithCondition(distance, engineCondition) {
    const baseTime = this.calculateJumpTime(distance);

    if (engineCondition < ENGINE_CONDITION_PENALTIES.THRESHOLD) {
      return baseTime + ENGINE_CONDITION_PENALTIES.TIME_PENALTY_DAYS;
    }

    return baseTime;
  }

  // ========================================================================
  // SHIP CONDITION DEGRADATION
  // ========================================================================

  /**
   * Apply ship degradation from a jump
   *
   * Formula:
   * - Hull: current - SHIP_DEGRADATION.HULL_PER_JUMP
   * - Engine: current - SHIP_DEGRADATION.ENGINE_PER_JUMP
   * - Life Support: current - (SHIP_DEGRADATION.LIFE_SUPPORT_PER_DAY × jumpDays)
   * All values clamped to [SHIP_CONDITION_BOUNDS.MIN, SHIP_CONDITION_BOUNDS.MAX]
   *
   * Degradation rates reflect wear from wormhole transit:
   * - Hull: Space debris and micro-meteorites
   * - Engine: Stress from wormhole field interaction
   * - Life Support: Consumables and filter degradation over time
   *
   * Mutates the ship object in place for performance.
   *
   * @param {Object} ship - Ship state with hull, engine, lifeSupport fields
   * @param {number} jumpDays - Jump duration in days
   * @returns {Object} The same ship object with updated condition values
   */
  static applyJumpDegradation(ship, jumpDays) {
    // Calculate degradation amounts
    const hullDegradation = SHIP_DEGRADATION.HULL_PER_JUMP;
    const engineDegradation = SHIP_DEGRADATION.ENGINE_PER_JUMP;
    const lifeSupportDegradation =
      SHIP_DEGRADATION.LIFE_SUPPORT_PER_DAY * jumpDays;

    // Apply degradation and clamp to valid range
    ship.hull = Math.max(
      SHIP_CONDITION_BOUNDS.MIN,
      Math.min(SHIP_CONDITION_BOUNDS.MAX, ship.hull - hullDegradation)
    );

    ship.engine = Math.max(
      SHIP_CONDITION_BOUNDS.MIN,
      Math.min(SHIP_CONDITION_BOUNDS.MAX, ship.engine - engineDegradation)
    );

    ship.lifeSupport = Math.max(
      SHIP_CONDITION_BOUNDS.MIN,
      Math.min(
        SHIP_CONDITION_BOUNDS.MAX,
        ship.lifeSupport - lifeSupportDegradation
      )
    );

    return ship;
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
   * @param {number} engineCondition - Engine condition percentage (0-100), optional for backward compatibility
   * @returns {Object} { valid: boolean, error: string|null, fuelCost: number, distance: number, jumpTime: number }
   */
  validateJump(
    currentSystemId,
    targetSystemId,
    currentFuel,
    engineCondition = 100
  ) {
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

    // Calculate jump parameters with engine condition
    const distance = this.calculateDistanceBetween(currentStar, targetStar);
    const fuelCost = this.calculateFuelCostWithCondition(
      distance,
      engineCondition
    );
    const jumpTime = this.calculateJumpTimeWithCondition(
      distance,
      engineCondition
    );

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
   * Execute a jump (updates game state and triggers animation)
   *
   * @param {Object} gameStateManager - GameStateManager instance
   * @param {number} targetSystemId - Target system ID
   * @param {Object} animationSystem - Optional JumpAnimationSystem instance
   * @param {Object} uiManager - Optional UIManager instance for hiding/showing panels during animation
   * @returns {Promise<Object>} { success: boolean, error: string|null }
   */
  async executeJump(
    gameStateManager,
    targetSystemId,
    animationSystem = null,
    uiManager = null
  ) {
    const state = gameStateManager.getState();

    if (!state) {
      return { success: false, error: 'No game state' };
    }

    const currentSystemId = state.player.currentSystem;
    const currentFuel = state.ship.fuel;
    const engineCondition = state.ship.engine;

    // Validate jump with engine condition
    const validation = this.validateJump(
      currentSystemId,
      targetSystemId,
      currentFuel,
      engineCondition
    );

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Execute jump: update fuel, time, and location BEFORE animation
    // This ensures progress is saved even if animation is interrupted
    gameStateManager.updateFuel(currentFuel - validation.fuelCost);
    gameStateManager.updateTime(state.player.daysElapsed + validation.jumpTime);
    gameStateManager.updateLocation(targetSystemId);

    // Apply ship condition degradation from jump
    const degradedShip = NavigationSystem.applyJumpDegradation(
      state.ship,
      validation.jumpTime
    );
    gameStateManager.updateShipCondition(
      degradedShip.hull,
      degradedShip.engine,
      degradedShip.lifeSupport
    );

    // Auto-save after jump (before animation)
    gameStateManager.saveGame();

    // Hide UI panels before animation if UI manager is provided
    let stationWasVisible = false;
    let tradeWasVisible = false;
    let refuelWasVisible = false;
    let infoBrokerWasVisible = false;

    if (uiManager && animationSystem) {
      // Store panel visibility state
      if (uiManager.isStationVisible && uiManager.isStationVisible()) {
        stationWasVisible = true;
        uiManager.hideStationInterface();
      }

      if (uiManager.isTradeVisible && uiManager.isTradeVisible()) {
        tradeWasVisible = true;
        uiManager.hideTradePanel();
      }

      if (uiManager.isRefuelVisible && uiManager.isRefuelVisible()) {
        refuelWasVisible = true;
        uiManager.hideRefuelPanel();
      }

      if (uiManager.isInfoBrokerVisible && uiManager.isInfoBrokerVisible()) {
        infoBrokerWasVisible = true;
        uiManager.hideInfoBrokerPanel();
      }
    }

    // Play animation if animation system is provided
    if (animationSystem) {
      try {
        await animationSystem.playJumpAnimation(
          currentSystemId,
          targetSystemId
        );
      } finally {
        // Restore UI panels after animation completes (or fails)
        if (uiManager) {
          if (stationWasVisible) uiManager.showStationInterface();
          if (tradeWasVisible) uiManager.showTradePanel();
          if (refuelWasVisible) uiManager.showRefuelPanel();
          if (infoBrokerWasVisible) uiManager.showInfoBrokerPanel();
        }
      }
    }

    return { success: true, error: null };
  }
}
