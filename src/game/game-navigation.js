import {
  NAVIGATION_CONFIG,
  SHIP_CONFIG,
  REPAIR_CONFIG,
  calculateBaseJumpTime,
} from './constants.js';
import {
  getConnectedSystems as getCachedConnectedSystems,
  getShortestPath,
} from './utils/wormhole-graph.js';
import { WORMHOLE_DATA } from './data/wormhole-data.js';

/**
 * NavigationSystem - Handles distance calculations and jump mechanics
 *
 * Responsibilities:
 * - Calculate distances between star systems
 * - Calculate jump time and fuel costs
 * - Validate wormhole connections
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
   * Formula: hypot(x, y, z) * NAVIGATION_CONFIG.LY_PER_UNIT
   *
   * @param {Object} star - Star system object with x, y, z coordinates
   * @returns {number} Distance in light years
   */
  calculateDistanceFromSol(star) {
    const r = Math.hypot(star.x, star.y, star.z);
    return r * NAVIGATION_CONFIG.LY_PER_UNIT;
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
    return r * NAVIGATION_CONFIG.LY_PER_UNIT;
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
    return calculateBaseJumpTime(distance);
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
   * Calculate fuel cost with engine condition penalty, quirk modifiers, and upgrade effects
   *
   * When engine condition falls below SHIP_CONFIG.ENGINE_CONDITION_PENALTIES.THRESHOLD,
   * fuel consumption increases by SHIP_CONFIG.ENGINE_CONDITION_PENALTIES.FUEL_PENALTY_MULTIPLIER
   * due to reduced propulsion efficiency.
   *
   * Quirk modifiers and upgrade effects are applied multiplicatively after engine condition penalty.
   * For example, with hot_thruster (+5%), fuel_sipper (-15%), and efficient_drive (-20%):
   * finalCost = baseCost × enginePenalty × 1.05 × 0.85 × 0.8
   *
   * @param {number} distance - Distance in light years
   * @param {number} engineCondition - Engine condition percentage (0-100)
   * @param {Function} applyQuirkModifiers - Function to apply quirk modifiers (optional)
   * @param {string[]} quirks - Array of quirk IDs (optional)
   * @param {number} upgradeModifier - Upgrade fuel consumption modifier (default 1.0)
   * @returns {number} Fuel cost as percentage
   */
  calculateFuelCostWithCondition(
    distance,
    engineCondition,
    applyQuirkModifiers = null,
    quirks = [],
    upgradeModifier = 1.0
  ) {
    let cost = this.calculateFuelCost(distance);

    // Apply engine condition penalty
    if (engineCondition < SHIP_CONFIG.ENGINE_CONDITION_PENALTIES.THRESHOLD) {
      cost *= SHIP_CONFIG.ENGINE_CONDITION_PENALTIES.FUEL_PENALTY_MULTIPLIER;
    }

    // Apply quirk modifiers if provided
    if (applyQuirkModifiers && quirks.length > 0) {
      cost = applyQuirkModifiers(cost, 'fuelConsumption', quirks);
    }

    // Apply upgrade modifier
    cost *= upgradeModifier;

    return cost;
  }

  /**
   * Calculate jump time with engine condition penalty
   *
   * When engine condition falls below SHIP_CONFIG.ENGINE_CONDITION_PENALTIES.THRESHOLD,
   * jump time increases by SHIP_CONFIG.ENGINE_CONDITION_PENALTIES.TIME_PENALTY_DAYS
   * due to slower wormhole transit.
   *
   * @param {number} distance - Distance in light years
   * @param {number} engineCondition - Engine condition percentage (0-100)
   * @returns {number} Jump time in days
   */
  calculateJumpTimeWithCondition(distance, engineCondition) {
    const baseTime = this.calculateJumpTime(distance);

    if (engineCondition < SHIP_CONFIG.ENGINE_CONDITION_PENALTIES.THRESHOLD) {
      return (
        baseTime + SHIP_CONFIG.ENGINE_CONDITION_PENALTIES.TIME_PENALTY_DAYS
      );
    }

    return baseTime;
  }

  // ========================================================================
  // SHIP CONDITION DEGRADATION
  // ========================================================================

  /**
   * Apply ship degradation from a jump with quirk modifiers and upgrade effects
   *
   * Formula:
   * - Hull: current - (SHIP_CONFIG.DEGRADATION.HULL_PER_JUMP × quirkModifiers × upgradeModifiers)
   * - Engine: current - SHIP_CONFIG.DEGRADATION.ENGINE_PER_JUMP
   * - Life Support: current - (SHIP_CONFIG.DEGRADATION.LIFE_SUPPORT_PER_DAY × jumpDays × quirkModifiers × upgradeModifiers)
   * All values clamped to [SHIP_CONFIG.CONDITION_BOUNDS.MIN, SHIP_CONFIG.CONDITION_BOUNDS.MAX]
   *
   * Degradation rates reflect wear from wormhole transit:
   * - Hull: Space debris and micro-meteorites
   * - Engine: Stress from wormhole field interaction
   * - Life Support: Consumables and filter degradation over time
   *
   * Quirk modifiers and upgrade effects are applied multiplicatively to base degradation rates.
   * For example, leaky_seals (1.5×) and reinforced_hull (0.5×) combine to 0.75× hull degradation.
   *
   * Mutates the ship object in place for performance.
   *
   * @param {Object} ship - Ship state with hull, engine, lifeSupport fields
   * @param {number} jumpDays - Jump duration in days
   * @param {Function} applyQuirkModifiers - Function to apply quirk modifiers (optional)
   * @param {string[]} quirks - Array of quirk IDs (optional)
   * @param {number} hullUpgradeModifier - Upgrade hull degradation modifier (default 1.0)
   * @param {number} lifeSupportUpgradeModifier - Upgrade life support drain modifier (default 1.0)
   * @returns {Object} The same ship object with updated condition values
   */
  static applyJumpDegradation(
    ship,
    jumpDays,
    applyQuirkModifiers = null,
    quirks = [],
    hullUpgradeModifier = 1.0,
    lifeSupportUpgradeModifier = 1.0
  ) {
    // Calculate base degradation amounts
    let hullDegradation = SHIP_CONFIG.DEGRADATION.HULL_PER_JUMP;
    const engineDegradation = SHIP_CONFIG.DEGRADATION.ENGINE_PER_JUMP;
    let lifeSupportDegradation =
      SHIP_CONFIG.DEGRADATION.LIFE_SUPPORT_PER_DAY * jumpDays;

    // Apply quirk modifiers if provided
    if (applyQuirkModifiers && quirks.length > 0) {
      hullDegradation = applyQuirkModifiers(
        hullDegradation,
        'hullDegradation',
        quirks
      );
      lifeSupportDegradation = applyQuirkModifiers(
        lifeSupportDegradation,
        'lifeSupportDrain',
        quirks
      );
    }

    // Apply upgrade modifiers
    hullDegradation *= hullUpgradeModifier;
    lifeSupportDegradation *= lifeSupportUpgradeModifier;

    // Apply degradation and clamp to valid range
    ship.hull = Math.max(
      SHIP_CONFIG.CONDITION_BOUNDS.MIN,
      Math.min(SHIP_CONFIG.CONDITION_BOUNDS.MAX, ship.hull - hullDegradation)
    );

    ship.engine = Math.max(
      SHIP_CONFIG.CONDITION_BOUNDS.MIN,
      Math.min(
        SHIP_CONFIG.CONDITION_BOUNDS.MAX,
        ship.engine - engineDegradation
      )
    );

    ship.lifeSupport = Math.max(
      SHIP_CONFIG.CONDITION_BOUNDS.MIN,
      Math.min(
        SHIP_CONFIG.CONDITION_BOUNDS.MAX,
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
    // Delegate to cache when using production data for O(1) lookup
    if (this.wormholeData === WORMHOLE_DATA) {
      return getCachedConnectedSystems(systemId1).includes(systemId2);
    }
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
    // Delegate to cache when using production data for O(1) lookup
    if (this.wormholeData === WORMHOLE_DATA) {
      return getCachedConnectedSystems(systemId);
    }
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
   * @param {Function} applyQuirkModifiers - Function to apply quirk modifiers (optional)
   * @param {string[]} quirks - Array of quirk IDs (optional)
   * @param {number} upgradeModifier - Upgrade fuel consumption modifier (default 1.0)
   * @param {Object|null} shipCondition - Ship condition with hull, engine, lifeSupport fields (optional)
   * @returns {Object} { valid: boolean, error: string|null, fuelCost: number, distance: number, jumpTime: number }
   */
  validateJump(
    currentSystemId,
    targetSystemId,
    currentFuel,
    engineCondition = 100,
    applyQuirkModifiers = null,
    quirks = [],
    upgradeModifier = 1.0,
    shipCondition = null
  ) {
    // Check wormhole connection
    if (!this.areSystemsConnected(currentSystemId, targetSystemId)) {
      return {
        valid: false,
        reason: 'no_connection',
        error:
          'No wormhole connection to this system. Jump to a connected system first.',
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
        reason: 'invalid_system',
        error: 'Invalid system ID',
        fuelCost: 0,
        distance: 0,
        jumpTime: 0,
      };
    }

    // Calculate jump parameters with engine condition, quirk modifiers, and upgrade effects
    const distance = this.calculateDistanceBetween(currentStar, targetStar);
    const fuelCost = this.calculateFuelCostWithCondition(
      distance,
      engineCondition,
      applyQuirkModifiers,
      quirks,
      upgradeModifier
    );
    const jumpTime = this.calculateJumpTimeWithCondition(
      distance,
      engineCondition
    );

    // Check fuel availability
    if (currentFuel < fuelCost) {
      return {
        valid: false,
        reason: 'insufficient_fuel',
        error: 'Insufficient fuel for this jump. Refuel at a station.',
        fuelCost,
        distance,
        jumpTime,
      };
    }

    // Check for critically damaged systems
    if (shipCondition) {
      const criticalSystems = [];
      if (shipCondition.hull <= REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD) {
        criticalSystems.push(`Hull (${Math.round(shipCondition.hull)}%)`);
      }
      if (shipCondition.engine <= REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD) {
        criticalSystems.push(`Engine (${Math.round(shipCondition.engine)}%)`);
      }
      if (
        shipCondition.lifeSupport <= REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD
      ) {
        criticalSystems.push(
          `Life Support (${Math.round(shipCondition.lifeSupport)}%)`
        );
      }

      if (criticalSystems.length > 0) {
        return {
          valid: false,
          reason: 'critical_damage',
          error: `${criticalSystems.join(', ')} critically damaged. Repairs required before departure.`,
          fuelCost,
          distance,
          jumpTime,
        };
      }
    }

    return {
      valid: true,
      reason: null,
      error: null,
      fuelCost,
      distance,
      jumpTime,
    };
  }

  /**
   * Hop count and total travel days along the shortest wormhole route.
   *
   * Sums actual per-hop jump times rather than estimating from straight-line
   * distance, because wormhole routes can be indirect.
   *
   * @param {number} fromSystemId - Origin system ID
   * @param {number} toSystemId - Destination system ID
   * @returns {{ hops: number, totalDays: number } | null} Route data, or null if unreachable or same system
   */
  getRouteIndicator(fromSystemId, toSystemId) {
    if (fromSystemId === toSystemId) return null;

    const route = getShortestPath(fromSystemId, toSystemId);
    if (!route || route.hops === 0) return null;

    let totalDays = 0;
    for (let i = 0; i < route.path.length - 1; i++) {
      const from = this.starData.find((s) => s.id === route.path[i]);
      const to = this.starData.find((s) => s.id === route.path[i + 1]);
      totalDays += this.calculateJumpTime(
        this.calculateDistanceBetween(from, to)
      );
    }

    return { hops: route.hops, totalDays };
  }
}
