'use strict';

import { SHIP_CONFIG } from '../game-constants.js';

/**
 * UpgradePanelController - Manages upgrade panel UI and interactions
 *
 * Part of the architecture-refactor pattern where UIManager delegates panel-specific
 * logic to focused controllers. This controller owns all upgrade panel behavior including
 * displaying available upgrades, showing installed upgrades, handling purchase confirmations,
 * and executing upgrade transactions.
 *
 * Responsibilities:
 * - Display available (unpurchased) upgrades with costs and effects
 * - Display installed upgrades
 * - Show upgrade confirmation dialog with cost breakdown
 * - Handle upgrade purchase transactions with validation
 * - Update credit balance display
 * - Format upgrade effects and tradeoffs for display
 *
 * Dependencies:
 * - Receives DOM elements, GameStateManager, and starData via constructor
 * - Never queries DOM directly - uses only provided element references
 * - Delegates all state changes to GameStateManager
 * - Uses SHIP_CONFIG for upgrade definitions
 *
 * Architecture: architecture-refactor
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.4
 *
 * @class
 */
export class UpgradePanelController {
  constructor(elements, gameStateManager, starData) {
    // Validate required dependencies
    if (!gameStateManager) {
      throw new Error(
        'UpgradePanelController: gameStateManager parameter required'
      );
    }
    if (!starData) {
      throw new Error('UpgradePanelController: starData parameter required');
    }

    // Validate elements object has required properties
    const requiredElements = [
      'upgradesPanel',
      'upgradesCreditsValue',
      'availableUpgradesList',
      'installedUpgradesList',
      'upgradeConfirmationOverlay',
      'upgradeConfirmationTitle',
      'upgradeConfirmationEffects',
      'upgradeCurrentCredits',
      'upgradeCost',
      'upgradeCreditsAfter',
      'upgradeConfirmBtn',
    ];

    const missingElements = requiredElements.filter((key) => !elements[key]);
    if (missingElements.length > 0) {
      throw new Error(
        `UpgradePanelController: Missing required DOM elements: ${missingElements.join(', ')}`
      );
    }

    this.elements = elements;
    this.gameStateManager = gameStateManager;
    this.starData = starData;

    // Track pending upgrade for confirmation dialog
    this.pendingUpgradeId = null;
  }

  show() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in show');
    }

    // Update credit balance display
    this.elements.upgradesCreditsValue.textContent =
      state.player.credits.toLocaleString();

    // Render available and installed upgrades
    this.refreshUpgradePanel();

    this.elements.upgradesPanel.classList.add('visible');
  }

  hide() {
    this.elements.upgradesPanel.classList.remove('visible');
  }

  refreshUpgradePanel() {
    this.renderAvailableUpgrades();
    this.renderInstalledUpgrades();
  }

  /**
   * Render list of available (unpurchased) upgrades
   *
   * Creates upgrade cards with name, cost, description, effects, and tradeoffs.
   * Disables purchase buttons for unaffordable upgrades. Adds warning symbol
   * for upgrades with tradeoffs.
   */
  renderAvailableUpgrades() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in renderAvailableUpgrades'
      );
    }

    this.elements.availableUpgradesList.replaceChildren();

    const credits = state.player.credits;
    const installedUpgrades = state.ship.upgrades || [];

    // Get all upgrade IDs
    const allUpgradeIds = Object.keys(SHIP_CONFIG.UPGRADES);

    // Filter to only unpurchased upgrades
    const availableUpgradeIds = allUpgradeIds.filter(
      (id) => !installedUpgrades.includes(id)
    );

    if (availableUpgradeIds.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'upgrades-empty';
      emptyMsg.textContent = 'All upgrades installed';
      this.elements.availableUpgradesList.appendChild(emptyMsg);
      return;
    }

    // Sort by cost (cheapest first)
    availableUpgradeIds.sort(
      (a, b) => SHIP_CONFIG.UPGRADES[a].cost - SHIP_CONFIG.UPGRADES[b].cost
    );

    // Use DocumentFragment to batch DOM insertions for better performance
    const fragment = document.createDocumentFragment();
    availableUpgradeIds.forEach((upgradeId) => {
      const upgradeCard = this.createUpgradeCard(upgradeId, credits, false);
      fragment.appendChild(upgradeCard);
    });
    this.elements.availableUpgradesList.appendChild(fragment);
  }

  /**
   * Render list of installed upgrades
   *
   * Displays purchased upgrades with their effects and tradeoffs.
   * No purchase buttons shown for installed upgrades.
   */
  renderInstalledUpgrades() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in renderInstalledUpgrades'
      );
    }

    this.elements.installedUpgradesList.replaceChildren();

    const installedUpgrades = state.ship.upgrades || [];

    if (installedUpgrades.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'upgrades-empty';
      emptyMsg.textContent = 'No upgrades installed';
      this.elements.installedUpgradesList.appendChild(emptyMsg);
      return;
    }

    // Use DocumentFragment to batch DOM insertions for better performance
    const fragment = document.createDocumentFragment();
    installedUpgrades.forEach((upgradeId) => {
      const upgradeCard = this.createUpgradeCard(upgradeId, 0, true);
      fragment.appendChild(upgradeCard);
    });
    this.elements.installedUpgradesList.appendChild(fragment);
  }

  /**
   * Create an upgrade card element
   *
   * @param {string} upgradeId - Upgrade identifier
   * @param {number} credits - Player's current credits
   * @param {boolean} isInstalled - Whether upgrade is already installed
   * @returns {HTMLElement} Upgrade card element
   */
  createUpgradeCard(upgradeId, credits, isInstalled) {
    const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
    if (!upgrade) {
      throw new Error(
        `Invalid upgrade ID: ${upgradeId} not found in SHIP_UPGRADES`
      );
    }

    const card = document.createElement('div');
    card.className = 'upgrade-card';

    // Header with name and cost
    const header = document.createElement('div');
    header.className = 'upgrade-header';

    const nameContainer = document.createElement('div');
    nameContainer.className = 'upgrade-name-container';

    const name = document.createElement('span');
    name.className = 'upgrade-name';
    name.textContent = upgrade.name;

    // Add warning symbol if upgrade has tradeoffs
    if (upgrade.tradeoff && upgrade.tradeoff !== 'None') {
      const warningSymbol = document.createElement('span');
      warningSymbol.className = 'upgrade-warning-symbol';
      warningSymbol.textContent = ' ⚠';
      warningSymbol.title = 'This upgrade has tradeoffs';
      nameContainer.appendChild(name);
      nameContainer.appendChild(warningSymbol);
    } else {
      nameContainer.appendChild(name);
    }

    const cost = document.createElement('span');
    cost.className = 'upgrade-cost';
    cost.textContent = `₡${upgrade.cost.toLocaleString()}`;

    header.appendChild(nameContainer);
    header.appendChild(cost);

    // Description
    const description = document.createElement('div');
    description.className = 'upgrade-description';
    description.textContent = upgrade.description;

    // Effects list
    const effectsContainer = document.createElement('div');
    effectsContainer.className = 'upgrade-effects';

    const effectsLabel = document.createElement('div');
    effectsLabel.className = 'upgrade-effects-label';
    effectsLabel.textContent = 'Effects:';

    const effectsList = document.createElement('ul');
    effectsList.className = 'upgrade-effects-list';

    // Format effects for display
    const effectsText = this.formatUpgradeEffects(upgrade.effects);
    effectsText.forEach((effect) => {
      const li = document.createElement('li');
      li.textContent = effect;
      effectsList.appendChild(li);
    });

    effectsContainer.appendChild(effectsLabel);
    effectsContainer.appendChild(effectsList);

    // Tradeoff (if any)
    if (upgrade.tradeoff && upgrade.tradeoff !== 'None') {
      const tradeoffContainer = document.createElement('div');
      tradeoffContainer.className = 'upgrade-tradeoff';

      const tradeoffLabel = document.createElement('div');
      tradeoffLabel.className = 'upgrade-tradeoff-label';
      tradeoffLabel.textContent = 'Tradeoff:';

      const tradeoffText = document.createElement('div');
      tradeoffText.className = 'upgrade-tradeoff-text';
      tradeoffText.textContent = upgrade.tradeoff;

      tradeoffContainer.appendChild(tradeoffLabel);
      tradeoffContainer.appendChild(tradeoffText);

      card.appendChild(header);
      card.appendChild(description);
      card.appendChild(effectsContainer);
      card.appendChild(tradeoffContainer);
    } else {
      card.appendChild(header);
      card.appendChild(description);
      card.appendChild(effectsContainer);
    }

    // Purchase button (only for available upgrades)
    if (!isInstalled) {
      const actions = document.createElement('div');
      actions.className = 'upgrade-actions';

      const purchaseBtn = document.createElement('button');
      purchaseBtn.className = 'upgrade-purchase-btn';
      purchaseBtn.textContent = 'Purchase';
      purchaseBtn.disabled = credits < upgrade.cost;

      purchaseBtn.addEventListener('click', () => {
        this.showUpgradeConfirmation(upgradeId);
      });

      actions.appendChild(purchaseBtn);
      card.appendChild(actions);
    }

    return card;
  }

  /**
   * Format upgrade effects for display
   *
   * Converts effect object into human-readable strings.
   *
   * @param {Object} effects - Upgrade effects object
   * @returns {string[]} Array of formatted effect strings
   */
  formatUpgradeEffects(effects) {
    const formatted = [];

    // Helper to format reduction/increase effects (multipliers)
    const formatReduction = (label, multiplier) => {
      const percent = Math.round((1 - multiplier) * 100);
      if (percent > 0) {
        return `${label}: -${percent}%`;
      } else if (percent < 0) {
        return `${label}: +${Math.abs(percent)}%`;
      }
      return null;
    };

    for (const [attr, value] of Object.entries(effects)) {
      if (attr === 'fuelCapacity') {
        formatted.push(`Fuel capacity: ${value}%`);
      } else if (attr === 'cargoCapacity') {
        formatted.push(`Cargo capacity: ${value} units`);
      } else if (attr === 'hiddenCargoCapacity') {
        formatted.push(`Hidden cargo: ${value} units`);
      } else if (attr === 'fuelConsumption') {
        const text = formatReduction('Fuel consumption', value);
        if (text) formatted.push(text);
      } else if (attr === 'hullDegradation') {
        const text = formatReduction('Hull degradation', value);
        if (text) formatted.push(text);
      } else if (attr === 'lifeSupportDrain') {
        const text = formatReduction('Life support drain', value);
        if (text) formatted.push(text);
      } else if (attr === 'eventVisibility') {
        formatted.push('See economic events in connected systems');
      }
    }

    return formatted;
  }

  /**
   * Show upgrade confirmation dialog
   *
   * Displays upgrade details, cost breakdown, and permanent warning before
   * allowing purchase confirmation.
   *
   * @param {string} upgradeId - Upgrade identifier
   */
  showUpgradeConfirmation(upgradeId) {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in showUpgradeConfirmation'
      );
    }

    const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];
    if (!upgrade) {
      throw new Error(
        `Invalid upgrade ID: ${upgradeId} not found in SHIP_UPGRADES`
      );
    }

    // Set title
    this.elements.upgradeConfirmationTitle.textContent = upgrade.name;

    // Render effects
    this.elements.upgradeConfirmationEffects.replaceChildren();

    const effectsText = this.formatUpgradeEffects(upgrade.effects);
    effectsText.forEach((effect) => {
      const effectItem = document.createElement('div');
      effectItem.className = 'upgrade-effect-item';
      effectItem.textContent = `• ${effect}`;
      this.elements.upgradeConfirmationEffects.appendChild(effectItem);
    });

    // Add tradeoff if present
    if (upgrade.tradeoff && upgrade.tradeoff !== 'None') {
      const tradeoffItem = document.createElement('div');
      tradeoffItem.className = 'upgrade-effect-item upgrade-tradeoff-item';
      tradeoffItem.textContent = `⚠ ${upgrade.tradeoff}`;
      this.elements.upgradeConfirmationEffects.appendChild(tradeoffItem);
    }

    // Set cost information
    const currentCredits = state.player.credits;
    const creditsAfter = currentCredits - upgrade.cost;

    this.elements.upgradeCurrentCredits.textContent =
      currentCredits.toLocaleString();
    this.elements.upgradeCost.textContent = upgrade.cost.toLocaleString();
    this.elements.upgradeCreditsAfter.textContent =
      creditsAfter.toLocaleString();

    // Store upgrade ID for confirmation handler
    this.pendingUpgradeId = upgradeId;

    // Show dialog
    this.elements.upgradeConfirmationOverlay.classList.remove('hidden');

    // Focus confirm button
    if (this.elements.upgradeConfirmBtn) {
      this.elements.upgradeConfirmBtn.focus();
    }
  }

  /**
   * Hide upgrade confirmation dialog
   */
  hideUpgradeConfirmation() {
    this.elements.upgradeConfirmationOverlay.classList.add('hidden');
    this.pendingUpgradeId = null;
  }

  /**
   * Handle upgrade purchase confirmation
   *
   * Executes the upgrade purchase transaction and updates the UI.
   * Returns the purchase outcome for UIManager to handle notifications.
   *
   * @returns {Object} Purchase outcome with success flag and upgrade info
   */
  handlePurchaseUpgrade() {
    if (!this.pendingUpgradeId) {
      return { success: false, reason: 'No pending upgrade' };
    }

    const upgradeId = this.pendingUpgradeId;
    const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];

    if (!upgrade) {
      throw new Error(
        `Invalid upgrade ID: ${upgradeId} not found in SHIP_UPGRADES`
      );
    }

    // Execute purchase
    const purchaseOutcome = this.gameStateManager.purchaseUpgrade(upgradeId);

    if (!purchaseOutcome.success) {
      this.hideUpgradeConfirmation();
      return {
        success: false,
        reason: purchaseOutcome.reason,
      };
    }

    // Hide confirmation dialog
    this.hideUpgradeConfirmation();

    // Refresh upgrades interface
    this.show();

    return {
      success: true,
      upgradeName: upgrade.name,
    };
  }
}
