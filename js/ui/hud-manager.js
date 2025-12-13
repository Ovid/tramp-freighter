'use strict';

import { calculateDistanceFromSol } from '../game-constants.js';
import { capitalizeFirst } from '../utils/string-utils.js';

/**
 * HUD Manager - Functions for updating HUD display elements
 *
 * Handles all HUD (Heads-Up Display) updates including credits, fuel, ship condition,
 * cargo, and location displays. Each function updates specific DOM elements with
 * formatted game state data.
 */

/**
 * Update all HUD elements with current game state
 *
 * Coordinates updates to all HUD components including credits, debt, days, ship name,
 * fuel, ship condition, cargo, and location displays.
 *
 * @param {Object} elements - Cached DOM elements for HUD components
 * @param {Object} state - Current game state
 * @param {Array} starData - Star system data for location lookups
 * @param {Function} getShipCondition - Function to get current ship condition
 * @param {Function} getCargoUsed - Function to get current cargo usage
 */
export function updateHUD(
  elements,
  state,
  starData,
  getShipCondition,
  getCargoUsed
) {
  if (!state) {
    throw new Error('Invalid game state: state is null in updateHUD');
  }

  updateCredits(elements.credits, state.player.credits);
  updateDebt(elements.debt, state.player.debt);
  updateDays(elements.days, state.player.daysElapsed);
  updateShipName(elements.shipName, state.ship.name);
  updateFuel(
    { fuelBar: elements.fuelBar, fuelText: elements.fuelText },
    state.ship.fuel
  );

  const condition = getShipCondition();
  updateShipCondition(
    {
      hullBar: elements.hullBar,
      hullText: elements.hullText,
      engineBar: elements.engineBar,
      engineText: elements.engineText,
      lifeSupportBar: elements.lifeSupportBar,
      lifeSupportText: elements.lifeSupportText,
    },
    condition
  );

  updateCargo(elements.cargo, getCargoUsed(), state.ship);
  updateLocation(
    { system: elements.system, distance: elements.distance },
    state.player.currentSystem,
    starData
  );
}

/**
 * Update credits display
 *
 * Formats credits with thousands separators for readability.
 *
 * @param {HTMLElement} element - Credits display element
 * @param {number} credits - Current credits
 */
export function updateCredits(element, credits) {
  element.textContent = credits.toLocaleString();
}

/**
 * Update debt display
 *
 * Formats debt with thousands separators for readability.
 *
 * @param {HTMLElement} element - Debt display element
 * @param {number} debt - Current debt
 */
export function updateDebt(element, debt) {
  element.textContent = debt.toLocaleString();
}

/**
 * Update days elapsed display
 *
 * @param {HTMLElement} element - Days display element
 * @param {number} days - Days elapsed
 */
export function updateDays(element, days) {
  element.textContent = days;
}

/**
 * Update ship name display
 *
 * @param {HTMLElement} element - Ship name display element
 * @param {string} shipName - Ship name
 */
export function updateShipName(element, shipName) {
  if (element) {
    element.textContent = shipName;
  }
}

/**
 * Update fuel bar and text
 *
 * Updates both the visual fuel bar width and the percentage text display.
 *
 * @param {Object} elements - Fuel bar and text elements
 * @param {HTMLElement} elements.fuelBar - Fuel bar element
 * @param {HTMLElement} elements.fuelText - Fuel text element
 * @param {number} fuel - Current fuel percentage (0-100)
 */
export function updateFuel(elements, fuel) {
  elements.fuelBar.style.width = `${fuel}%`;
  elements.fuelText.textContent = `${Math.round(fuel)}%`;
}

/**
 * Update ship condition bars (hull, engine, life support)
 *
 * Updates visual width and percentage text for hull, engine, and life support
 * condition bars in the HUD.
 *
 * @param {Object} elements - Condition bar and text elements
 * @param {HTMLElement} elements.hullBar - Hull condition bar element
 * @param {HTMLElement} elements.hullText - Hull condition text element
 * @param {HTMLElement} elements.engineBar - Engine condition bar element
 * @param {HTMLElement} elements.engineText - Engine condition text element
 * @param {HTMLElement} elements.lifeSupportBar - Life support condition bar element
 * @param {HTMLElement} elements.lifeSupportText - Life support condition text element
 * @param {Object} condition - Ship condition object with hull, engine, lifeSupport
 */
export function updateShipCondition(elements, condition) {
  if (!condition) {
    throw new Error(
      'Invalid game state: ship condition is null in updateShipCondition'
    );
  }

  updateConditionDisplay(elements, '', 'hull', condition.hull);
  updateConditionDisplay(elements, '', 'engine', condition.engine);
  updateConditionDisplay(elements, '', 'lifeSupport', condition.lifeSupport);
}

/**
 * Update cargo display
 *
 * Shows current cargo usage vs capacity (e.g., "15/50").
 *
 * @param {HTMLElement} element - Cargo display element
 * @param {number} cargoUsed - Used cargo space
 * @param {Object} ship - Ship object with cargoCapacity
 */
export function updateCargo(element, cargoUsed, ship) {
  if (!ship) {
    throw new Error('Invalid game state: ship is null in updateCargo');
  }

  element.textContent = `${cargoUsed}/${ship.cargoCapacity}`;
}

/**
 * Update location display
 *
 * Shows current system name and distance from Sol.
 *
 * @param {Object} elements - System and distance elements
 * @param {HTMLElement} elements.system - System name display element
 * @param {HTMLElement} elements.distance - Distance display element
 * @param {number} systemId - Current system ID
 * @param {Array} starData - Star system data
 */
export function updateLocation(elements, systemId, starData) {
  const system = starData.find((s) => s.id === systemId);

  if (!system) return;

  elements.system.textContent = system.name;

  const distance = calculateDistanceFromSol(system);
  elements.distance.textContent = `${distance.toFixed(1)} LY`;
}

/**
 * Update a condition bar and text display
 *
 * Centralizes condition display logic to avoid duplication between HUD and repair panel.
 * Handles different element naming conventions (hudHullText vs repairHullPercent).
 *
 * @param {Object} elements - Object containing all condition bar and text elements
 * @param {string} prefix - Element prefix ('' for HUD, 'repair' for repair panel)
 * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
 * @param {number} conditionValue - Condition percentage (0-100)
 */
export function updateConditionDisplay(
  elements,
  prefix,
  systemType,
  conditionValue
) {
  const capitalizedType = capitalizeFirst(systemType);
  // For HUD (empty prefix), use lowercase first letter; for repair panel, use capitalized
  const typeKey = prefix ? capitalizedType : systemType;
  const barElement = elements[`${prefix}${typeKey}Bar`];
  // HUD uses 'Text' suffix, repair panel uses 'Percent' suffix
  const textElement =
    elements[`${prefix}${typeKey}Text`] ||
    elements[`${prefix}${capitalizedType}Percent`];

  if (barElement) {
    barElement.style.width = `${conditionValue}%`;
  }
  if (textElement) {
    textElement.textContent = `${Math.round(conditionValue)}%`;
  }
}
