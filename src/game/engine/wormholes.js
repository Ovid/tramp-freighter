import * as THREE from '../../../vendor/three/build/three.module.js';
import { VISUAL_CONFIG, NAVIGATION_CONFIG } from '../constants.js';

// Store wormhole connection objects for dynamic color updates
const wormholeConnections = [];
const wormholeLines = [];

/**
 * Determine connection color state based on fuel availability
 * Pure function for testability
 *
 * @param {number} currentFuel - Current fuel percentage (0-100)
 * @param {number} fuelCost - Fuel cost for the jump
 * @returns {'insufficient'|'warning'|'sufficient'} Color state
 */
export function determineConnectionColor(currentFuel, fuelCost) {
  if (currentFuel < fuelCost) {
    return 'insufficient';
  }
  const fuelRemaining = currentFuel - fuelCost;
  if (fuelRemaining >= 10 && fuelRemaining <= 20) {
    return 'warning';
  }
  return 'sufficient';
}

/**
 * Create wormhole connection lines with dynamic fuel-based coloring
 * @param {THREE.Scene} scene - The scene to add lines to
 * @param {Array} connections - Array of wormhole connections
 * @param {Array} starObjects - Array of star objects
 * @returns {Array} Array of wormhole connection data
 */
export function createWormholeLines(scene, connections, starObjects) {
  const starMap = new Map();
  starObjects.forEach((star) => {
    starMap.set(star.data.id, star);
  });

  let validConnections = 0;
  let invalidConnections = 0;

  connections.forEach((connection) => {
    if (!Array.isArray(connection) || connection.length !== 2) {
      console.warn('Invalid wormhole connection format:', connection);
      invalidConnections++;
      return;
    }

    const [id1, id2] = connection;
    const star1 = starMap.get(id1);
    const star2 = starMap.get(id2);

    if (!star1) {
      console.warn(
        `Wormhole connection references non-existent star ID: ${id1}`
      );
      invalidConnections++;
      return;
    }

    if (!star2) {
      console.warn(
        `Wormhole connection references non-existent star ID: ${id2}`
      );
      invalidConnections++;
      return;
    }

    // Only create visual lines for reachable connections
    if (star1.data.r === 1 && star2.data.r === 1) {
      // Create individual line geometry for each connection
      const positions = new Float32Array([
        star1.position.x,
        star1.position.y,
        star1.position.z,
        star2.position.x,
        star2.position.y,
        star2.position.z,
      ]);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );

      const material = new THREE.LineBasicMaterial({
        color: VISUAL_CONFIG.connectionColors.default,
        linewidth: 2,
        transparent: true,
        opacity: VISUAL_CONFIG.connectionOpacity.default,
      });

      const line = new THREE.LineSegments(geometry, material);
      scene.add(line);
      wormholeLines.push(line);

      // Pre-calculate distance and fuel cost (star positions never change)
      const distance =
        Math.hypot(
          star1.data.x - star2.data.x,
          star1.data.y - star2.data.y,
          star1.data.z - star2.data.z
        ) * NAVIGATION_CONFIG.LY_PER_UNIT;
      const fuelCost = 10 + distance * 2;

      // Store connection data for fuel-based coloring
      wormholeConnections.push({
        systemId1: id1,
        systemId2: id2,
        line: line,
        star1: star1,
        star2: star2,
        distance: distance,
        fuelCost: fuelCost,
      });

      validConnections++;
    }
  });

  console.log(`Created ${validConnections} wormhole connections`);
  if (invalidConnections > 0) {
    console.warn(`Skipped ${invalidConnections} invalid wormhole connections`);
  }

  return wormholeConnections;
}

/**
 * Update wormhole connection colors based on current fuel availability
 *
 * Color coding provides visual feedback for jump feasibility:
 * - Green: sufficient fuel with comfortable margin
 * - Yellow: 10-20% remaining triggers warning (player should refuel soon)
 * - Red: insufficient fuel prevents jump
 *
 * @param {Object} gameStateManager - The game state manager
 */
export function updateConnectionColors(gameStateManager) {
  if (!gameStateManager || !gameStateManager.state) {
    return;
  }

  const currentSystemId = gameStateManager.state.player.currentSystem;
  const currentFuel = gameStateManager.state.ship.fuel;

  wormholeConnections.forEach((conn) => {
    if (
      conn.systemId1 !== currentSystemId &&
      conn.systemId2 !== currentSystemId
    ) {
      conn.line.material.color.setHex(VISUAL_CONFIG.connectionColors.default);
      conn.line.material.opacity = VISUAL_CONFIG.connectionOpacity.default;
      return;
    }

    const colorState = determineConnectionColor(currentFuel, conn.fuelCost);
    conn.line.material.color.setHex(VISUAL_CONFIG.connectionColors[colorState]);
    conn.line.material.opacity = VISUAL_CONFIG.connectionOpacity.active;
  });
}

/**
 * Get wormhole connections array
 * @returns {Array} Array of wormhole connection data
 */
export function getWormholeConnections() {
  return wormholeConnections;
}

/**
 * Clear wormhole connections (for testing)
 */
export function clearWormholeConnections() {
  wormholeConnections.length = 0;
  wormholeLines.length = 0;
}
