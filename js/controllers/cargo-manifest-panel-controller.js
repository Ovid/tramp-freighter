'use strict';

import { TradingSystem } from '../game-trading.js';
import { capitalizeFirst } from '../utils/string-utils.js';

/**
 * CargoManifestPanelController - Manages cargo manifest panel UI
 *
 * Part of the architecture-refactor pattern where UIManager delegates panel-specific
 * logic to focused controllers. This controller owns all cargo manifest panel behavior
 * including displaying ship name, capacity usage, cargo details, and total value.
 *
 * Responsibilities:
 * - Display ship name in header
 * - Show cargo capacity usage (X/Y units)
 * - Display all cargo stacks with purchase metadata
 * - Show purchase location, price, and days since purchase for each stack
 * - Calculate and display total cargo value
 * - Handle empty cargo state
 *
 * Dependencies:
 * - Receives DOM elements, GameStateManager, and starData via constructor
 * - Never queries DOM directly - uses only provided element references
 * - Delegates all state queries to GameStateManager
 * - Uses TradingSystem for value calculations
 *
 * Architecture: architecture-refactor
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.4
 *
 * @class
 */
export class CargoManifestPanelController {
  constructor(elements, gameStateManager, starData) {
    // Validate required dependencies
    if (!gameStateManager) {
      throw new Error(
        'CargoManifestPanelController: gameStateManager parameter required'
      );
    }
    if (!starData) {
      throw new Error(
        'CargoManifestPanelController: starData parameter required'
      );
    }

    // Validate elements object has required properties
    const requiredElements = [
      'cargoManifestPanel',
      'cargoManifestShipName',
      'cargoManifestUsed',
      'cargoManifestCapacity',
      'cargoManifestList',
      'cargoManifestTotalValue',
    ];

    const missingElements = requiredElements.filter((key) => !elements[key]);
    if (missingElements.length > 0) {
      throw new Error(
        `CargoManifestPanelController: Missing required DOM elements: ${missingElements.join(', ')}`
      );
    }

    this.elements = elements;
    this.gameStateManager = gameStateManager;
    this.starData = starData;
  }

  show() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in show');
    }

    this.refreshCargoManifest();
    this.elements.cargoManifestPanel.classList.add('visible');
  }

  hide() {
    this.elements.cargoManifestPanel.classList.remove('visible');
  }

  /**
   * Refresh cargo manifest panel content
   *
   * Creates and displays the cargo manifest interface showing ship name,
   * capacity usage, all cargo with purchase details, and total value.
   *
   * Feature: ship-personality
   * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
   */
  refreshCargoManifest() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in refreshCargoManifest'
      );
    }

    const ship = state.ship;
    const cargo = ship.cargo || [];
    const cargoUsed = this.gameStateManager.getCargoUsed();
    const currentDay = state.player.daysElapsed;

    // Set ship name in header
    this.elements.cargoManifestShipName.textContent = ship.name;

    // Set capacity display
    this.elements.cargoManifestUsed.textContent = cargoUsed;
    this.elements.cargoManifestCapacity.textContent = ship.cargoCapacity;

    // Render cargo list
    this.elements.cargoManifestList.replaceChildren();

    if (cargo.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'cargo-manifest-empty';
      emptyMsg.textContent = 'No cargo';
      this.elements.cargoManifestList.appendChild(emptyMsg);

      // Set total value to 0
      this.elements.cargoManifestTotalValue.textContent = '₡0';
    } else {
      // Calculate total value using TradingSystem
      const totals = TradingSystem.calculateCargoTotals(cargo);

      // Use DocumentFragment to batch DOM insertions for better performance
      const fragment = document.createDocumentFragment();
      cargo.forEach((cargoEntry) => {
        const cargoItem = this.createCargoManifestItem(cargoEntry, currentDay);
        fragment.appendChild(cargoItem);
      });
      this.elements.cargoManifestList.appendChild(fragment);

      // Set total value
      this.elements.cargoManifestTotalValue.textContent = `₡${totals.totalValue.toLocaleString()}`;
    }
  }

  /**
   * Create a cargo manifest item element
   *
   * Displays cargo details including name, quantity, purchase location,
   * purchase price, days since purchase, and current value.
   *
   * @param {Object} cargoEntry - Cargo stack with metadata
   * @param {number} currentDay - Current game day
   * @returns {HTMLElement} Cargo manifest item element
   */
  createCargoManifestItem(cargoEntry, currentDay) {
    const item = document.createElement('div');
    item.className = 'cargo-manifest-item';

    // Cargo name
    const name = document.createElement('div');
    name.className = 'cargo-manifest-name';
    name.textContent = capitalizeFirst(cargoEntry.good);

    // Cargo details
    const details = document.createElement('div');
    details.className = 'cargo-manifest-details';

    // Quantity
    const quantity = document.createElement('div');
    quantity.className = 'cargo-manifest-detail';
    quantity.innerHTML = `<span class="detail-label">Quantity:</span> <span class="detail-value">${cargoEntry.qty} units</span>`;

    // Purchase location
    const location = document.createElement('div');
    location.className = 'cargo-manifest-detail';
    const locationName = cargoEntry.buySystemName || 'Unknown';
    location.innerHTML = `<span class="detail-label">Purchased at:</span> <span class="detail-value">${locationName}</span>`;

    // Purchase price
    const price = document.createElement('div');
    price.className = 'cargo-manifest-detail';
    price.innerHTML = `<span class="detail-label">Purchase price:</span> <span class="detail-value">₡${cargoEntry.buyPrice}/unit</span>`;

    // Days ago
    const daysAgo = document.createElement('div');
    daysAgo.className = 'cargo-manifest-detail';
    const daysSincePurchase = currentDay - (cargoEntry.buyDate || 0);
    const ageText =
      daysSincePurchase === 0
        ? 'today'
        : daysSincePurchase === 1
          ? '1 day ago'
          : `${daysSincePurchase} days ago`;
    daysAgo.innerHTML = `<span class="detail-label">Purchased:</span> <span class="detail-value">${ageText}</span>`;

    // Current value (using TradingSystem.calculateCargoValue)
    const value = document.createElement('div');
    value.className = 'cargo-manifest-detail cargo-manifest-value';
    const cargoValue = TradingSystem.calculateCargoValue(cargoEntry);
    value.innerHTML = `<span class="detail-label">Current value:</span> <span class="detail-value">₡${cargoValue.toLocaleString()}</span>`;

    details.appendChild(quantity);
    details.appendChild(location);
    details.appendChild(price);
    details.appendChild(daysAgo);
    details.appendChild(value);

    item.appendChild(name);
    item.appendChild(details);

    return item;
  }
}
