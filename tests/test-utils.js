'use strict';

/**
 * Test utility functions for setting up DOM environments and common test fixtures
 *
 * Centralizes test setup code to avoid duplication across test files and ensure
 * consistent test environments.
 */

/**
 * Setup complete repair panel DOM structure for testing
 *
 * Creates all required DOM elements for repair panel tests including:
 * - Repair panel container and header elements
 * - Condition display elements (percent text and progress bars)
 * - Repair buttons for each system (hull, engine, life support)
 * - Repair all button and validation message
 *
 * Used by repair panel property tests to ensure consistent DOM structure.
 */
export function setupRepairPanelDOM() {
  document.body.innerHTML = `
    <div id="game-hud"></div>
    <div id="repair-panel">
      <span id="repair-system-name"></span>
      <span id="repair-hull-percent"></span>
      <div id="repair-hull-bar"></div>
      <span id="repair-engine-percent"></span>
      <div id="repair-engine-bar"></div>
      <span id="repair-life-support-percent"></span>
      <div id="repair-life-support-bar"></div>
      <button class="repair-btn" data-system="hull" data-amount="10"></button>
      <button class="repair-btn" data-system="hull" data-amount="25"></button>
      <button class="repair-btn" data-system="hull" data-amount="50"></button>
      <button class="repair-btn" data-system="hull" data-amount="full"></button>
      <button class="repair-btn" data-system="engine" data-amount="10"></button>
      <button class="repair-btn" data-system="engine" data-amount="25"></button>
      <button class="repair-btn" data-system="engine" data-amount="50"></button>
      <button class="repair-btn" data-system="engine" data-amount="full"></button>
      <button class="repair-btn" data-system="lifeSupport" data-amount="10"></button>
      <button class="repair-btn" data-system="lifeSupport" data-amount="25"></button>
      <button class="repair-btn" data-system="lifeSupport" data-amount="50"></button>
      <button class="repair-btn" data-system="lifeSupport" data-amount="full"></button>
      <button id="repair-all-btn"></button>
      <div id="repair-validation-message"></div>
    </div>
    <div id="notification-area"></div>
  `;
}

/**
 * Create minimal star data for testing
 *
 * Returns a minimal set of star systems sufficient for most tests.
 * Includes Sol and Alpha Centauri with basic properties.
 *
 * @returns {Array} Array of star system objects
 */
export function createMinimalStarData() {
  return [
    { id: 0, name: 'Sol', x: 0, y: 0, z: 0, type: 'G2', wh: 3, st: 1, r: 1 },
    {
      id: 1,
      name: 'Alpha Centauri',
      x: 43,
      y: 0,
      z: 0,
      type: 'G2',
      wh: 1,
      st: 1,
      r: 1,
    },
  ];
}

/**
 * Create minimal wormhole data for testing
 *
 * Returns a minimal set of wormhole connections sufficient for most tests.
 * Connects Sol to Alpha Centauri.
 *
 * @returns {Array} Array of wormhole connection pairs
 */
export function createMinimalWormholeData() {
  return [[0, 1]];
}
