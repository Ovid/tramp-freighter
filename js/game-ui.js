'use strict';

import {
  calculateDistanceFromSol,
  INTELLIGENCE_CONFIG,
  NOTIFICATION_CONFIG,
  COMMODITY_TYPES,
  SHIP_CONFIG,
} from './game-constants.js';
import { TradingSystem } from './game-trading.js';
import { TradePanelController } from './controllers/trade-panel-controller.js';
import { RefuelPanelController } from './controllers/refuel-panel-controller.js';

/**
 * UIManager - Reactive UI layer using event subscription pattern
 *
 * Subscribes to GameStateManager events to update UI elements reactively.
 * This decoupling prevents tight coupling between game logic and DOM manipulation,
 * allowing multiple UI components to react independently to state changes.
 */
export class UIManager {
  constructor(gameStateManager) {
    this.gameStateManager = gameStateManager;
    this.starData = gameStateManager.starData;

    // List of all tradeable goods
    this.goodsList = COMMODITY_TYPES;

    // Notification queue for sequential display
    this.notificationQueue = [];
    this.isShowingNotification = false;

    // Cache DOM elements for performance
    this.elements = {
      gameHud: document.getElementById('game-hud'),
      credits: document.getElementById('hud-credits'),
      debt: document.getElementById('hud-debt'),
      days: document.getElementById('hud-days'),
      fuelBar: document.getElementById('fuel-bar'),
      fuelText: document.getElementById('hud-fuel-text'),
      hullBar: document.getElementById('hull-bar'),
      hullText: document.getElementById('hud-hull-text'),
      engineBar: document.getElementById('engine-bar'),
      engineText: document.getElementById('hud-engine-text'),
      lifeSupportBar: document.getElementById('life-support-bar'),
      lifeSupportText: document.getElementById('hud-life-support-text'),
      cargo: document.getElementById('hud-cargo'),
      system: document.getElementById('hud-system'),
      distance: document.getElementById('hud-distance'),
      quickSystemInfoBtn: document.getElementById('quick-system-info-btn'),
      quickStationBtn: document.getElementById('quick-station-btn'),
      systemInfoPanel: document.getElementById('hud'),
      stationInterface: document.getElementById('station-interface'),
      stationName: document.getElementById('station-name'),
      stationSystemName: document.getElementById('station-system-name'),
      stationDistance: document.getElementById('station-distance'),
      stationCloseBtn: document.getElementById('station-close-btn'),
      tradeBtn: document.getElementById('trade-btn'),
      refuelBtn: document.getElementById('refuel-btn'),
      undockBtn: document.getElementById('undock-btn'),
      tradePanel: document.getElementById('trade-panel'),
      tradeSystemName: document.getElementById('trade-system-name'),
      tradeCloseBtn: document.getElementById('trade-close-btn'),
      tradeBackBtn: document.getElementById('trade-back-btn'),
      marketGoods: document.getElementById('market-goods'),
      cargoStacks: document.getElementById('cargo-stacks'),
      tradeCargoUsed: document.getElementById('trade-cargo-used'),
      tradeCargoCapacity: document.getElementById('trade-cargo-capacity'),
      tradeCargoRemaining: document.getElementById('trade-cargo-remaining'),
      refuelPanel: document.getElementById('refuel-panel'),
      refuelSystemName: document.getElementById('refuel-system-name'),
      refuelCurrentFuel: document.getElementById('refuel-current-fuel'),
      refuelPricePerPercent: document.getElementById(
        'refuel-price-per-percent'
      ),
      refuelAmountInput: document.getElementById('refuel-amount-input'),
      refuelTotalCost: document.getElementById('refuel-total-cost'),
      refuelConfirmBtn: document.getElementById('refuel-confirm-btn'),
      refuelCloseBtn: document.getElementById('refuel-close-btn'),
      refuelBackBtn: document.getElementById('refuel-back-btn'),
      refuelMaxBtn: document.getElementById('refuel-max-btn'),
      refuelValidationMessage: document.getElementById(
        'refuel-validation-message'
      ),
      infoBrokerBtn: document.getElementById('info-broker-btn'),
      infoBrokerPanel: document.getElementById('info-broker-panel'),
      infoBrokerSystemName: document.getElementById('info-broker-system-name'),
      infoBrokerCloseBtn: document.getElementById('info-broker-close-btn'),
      infoBrokerBackBtn: document.getElementById('info-broker-back-btn'),
      buyRumorBtn: document.getElementById('buy-rumor-btn'),
      rumorText: document.getElementById('rumor-text'),
      intelligenceList: document.getElementById('intelligence-list'),
      infoBrokerValidationMessage: document.getElementById(
        'info-broker-validation-message'
      ),
      purchaseTab: document.getElementById('purchase-tab'),
      marketDataTab: document.getElementById('market-data-tab'),
      purchaseIntelContent: document.getElementById('purchase-intel-content'),
      marketDataContent: document.getElementById('market-data-content'),
      marketDataList: document.getElementById('market-data-list'),
      repairsBtn: document.getElementById('repairs-btn'),
      repairPanel: document.getElementById('repair-panel'),
      repairSystemName: document.getElementById('repair-system-name'),
      shipStatusBtn: document.getElementById('ship-status-btn'),
      repairCloseBtn: document.getElementById('repair-close-btn'),
      repairBackBtn: document.getElementById('repair-back-btn'),
      repairHullPercent: document.getElementById('repair-hull-percent'),
      repairHullBar: document.getElementById('repair-hull-bar'),
      repairEnginePercent: document.getElementById('repair-engine-percent'),
      repairEngineBar: document.getElementById('repair-engine-bar'),
      repairLifeSupportPercent: document.getElementById(
        'repair-life-support-percent'
      ),
      repairLifeSupportBar: document.getElementById('repair-life-support-bar'),
      repairAllBtn: document.getElementById('repair-all-btn'),
      repairValidationMessage: document.getElementById(
        'repair-validation-message'
      ),
      notificationArea: document.getElementById('notification-area'),
      eventModalOverlay: document.getElementById('event-modal-overlay'),
      eventModalTitle: document.getElementById('event-modal-title'),
      eventModalDescription: document.getElementById('event-modal-description'),
      eventModalDuration: document.getElementById('event-modal-duration'),
      eventModalDismiss: document.getElementById('event-modal-dismiss'),
      upgradesBtn: document.getElementById('upgrades-btn'),
      upgradesPanel: document.getElementById('upgrades-panel'),
      cargoManifestBtn: document.getElementById('cargo-manifest-btn'),
      upgradesCloseBtn: document.getElementById('upgrades-close-btn'),
      upgradesBackBtn: document.getElementById('upgrades-back-btn'),
      upgradesCreditsValue: document.getElementById('upgrades-credits-value'),
      availableUpgradesList: document.getElementById('available-upgrades-list'),
      installedUpgradesList: document.getElementById('installed-upgrades-list'),
      upgradeConfirmationOverlay: document.getElementById(
        'upgrade-confirmation-overlay'
      ),
      upgradeConfirmationTitle: document.getElementById(
        'upgrade-confirmation-title'
      ),
      upgradeConfirmationEffects: document.getElementById(
        'upgrade-confirmation-effects'
      ),
      upgradeCurrentCredits: document.getElementById('upgrade-current-credits'),
      upgradeCost: document.getElementById('upgrade-cost'),
      upgradeCreditsAfter: document.getElementById('upgrade-credits-after'),
      upgradeCancelBtn: document.getElementById('upgrade-cancel-btn'),
      upgradeConfirmBtn: document.getElementById('upgrade-confirm-btn'),
      cargoManifestPanel: document.getElementById('cargo-manifest-panel'),
      cargoManifestCloseBtn: document.getElementById(
        'cargo-manifest-close-btn'
      ),
      cargoManifestBackBtn: document.getElementById('cargo-manifest-back-btn'),
      cargoManifestShipName: document.getElementById(
        'cargo-manifest-ship-name'
      ),
      cargoManifestUsed: document.getElementById('cargo-manifest-used'),
      cargoManifestCapacity: document.getElementById('cargo-manifest-capacity'),
      cargoManifestList: document.getElementById('cargo-manifest-list'),
      cargoManifestTotalValue: document.getElementById(
        'cargo-manifest-total-value'
      ),
      hiddenCargoSection: document.getElementById('hidden-cargo-section'),
      hiddenCargoUsed: document.getElementById('hidden-cargo-used'),
      hiddenCargoCapacity: document.getElementById('hidden-cargo-capacity'),
      hiddenCargoStacks: document.getElementById('hidden-cargo-stacks'),
      toggleHiddenCargoBtn: document.getElementById('toggle-hidden-cargo-btn'),
      hiddenCargoContent: document.getElementById('hidden-cargo-content'),
    };

    // Cache repair buttons to avoid repeated DOM queries
    this.cachedRepairButtons = null;
    // Cache refuel preset buttons for consistency
    this.cachedRefuelPresetButtons = null;
    // Cache ship status panel (created on first use)
    this.shipStatusPanel = null;

    // Initialize panel controllers
    // Only create controller if all required elements exist
    if (
      this.elements.tradePanel &&
      this.elements.tradeSystemName &&
      this.elements.marketGoods &&
      this.elements.cargoStacks &&
      this.elements.tradeCargoUsed &&
      this.elements.tradeCargoCapacity &&
      this.elements.tradeCargoRemaining
    ) {
      this.tradePanelController = new TradePanelController(
        {
          tradePanel: this.elements.tradePanel,
          tradeSystemName: this.elements.tradeSystemName,
          marketGoods: this.elements.marketGoods,
          cargoStacks: this.elements.cargoStacks,
          tradeCargoUsed: this.elements.tradeCargoUsed,
          tradeCargoCapacity: this.elements.tradeCargoCapacity,
          tradeCargoRemaining: this.elements.tradeCargoRemaining,
          hiddenCargoSection: this.elements.hiddenCargoSection,
          hiddenCargoUsed: this.elements.hiddenCargoUsed,
          hiddenCargoCapacity: this.elements.hiddenCargoCapacity,
          hiddenCargoStacks: this.elements.hiddenCargoStacks,
        },
        this.gameStateManager,
        this.starData
      );
    } else {
      this.tradePanelController = null;
    }

    if (
      this.elements.refuelPanel &&
      this.elements.refuelSystemName &&
      this.elements.refuelCurrentFuel &&
      this.elements.refuelPricePerPercent &&
      this.elements.refuelAmountInput &&
      this.elements.refuelTotalCost &&
      this.elements.refuelConfirmBtn &&
      this.elements.refuelValidationMessage
    ) {
      this.refuelPanelController = new RefuelPanelController(
        {
          refuelPanel: this.elements.refuelPanel,
          refuelSystemName: this.elements.refuelSystemName,
          refuelCurrentFuel: this.elements.refuelCurrentFuel,
          refuelPricePerPercent: this.elements.refuelPricePerPercent,
          refuelAmountInput: this.elements.refuelAmountInput,
          refuelTotalCost: this.elements.refuelTotalCost,
          refuelConfirmBtn: this.elements.refuelConfirmBtn,
          refuelValidationMessage: this.elements.refuelValidationMessage,
        },
        this.gameStateManager,
        this.starData
      );
    } else {
      this.refuelPanelController = null;
    }

    this.subscribeToStateChanges();
    this.setupStationInterfaceHandlers();
    this.setupShipStatusHandlers();
    this.setupEventModalHandlers();
    this.setupQuickAccessHandlers();
  }

  subscribeToStateChanges() {
    this.gameStateManager.subscribe('creditsChanged', (credits) => {
      this.updateCredits(credits);
    });

    this.gameStateManager.subscribe('debtChanged', (debt) => {
      this.updateDebt(debt);
    });

    this.gameStateManager.subscribe('timeChanged', (days) => {
      this.updateDays(days);
    });

    this.gameStateManager.subscribe('fuelChanged', (fuel) => {
      this.updateFuel(fuel);
    });

    this.gameStateManager.subscribe('cargoChanged', () => {
      this.updateCargo();
    });

    this.gameStateManager.subscribe('locationChanged', (systemId) => {
      this.updateLocation(systemId);
    });

    this.gameStateManager.subscribe('conditionWarning', (warning) => {
      this.showConditionWarning(warning);
    });

    this.gameStateManager.subscribe('shipConditionChanged', (condition) => {
      this.updateShipCondition(condition);
    });
  }

  showHUD() {
    this.elements.gameHud.classList.add('visible');
  }

  hideHUD() {
    this.elements.gameHud.classList.remove('visible');
  }

  updateHUD() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in updateHUD');
    }

    this.updateCredits(state.player.credits);
    this.updateDebt(state.player.debt);
    this.updateDays(state.player.daysElapsed);
    this.updateFuel(state.ship.fuel);
    this.updateShipCondition(this.gameStateManager.getShipCondition());
    this.updateCargo();
    this.updateLocation(state.player.currentSystem);
    this.updateQuickAccessButtons();
  }

  updateCredits(credits) {
    this.elements.credits.textContent = credits.toLocaleString();
  }

  updateDebt(debt) {
    this.elements.debt.textContent = debt.toLocaleString();
  }

  updateDays(days) {
    this.elements.days.textContent = days;
  }

  updateFuel(fuel) {
    this.elements.fuelBar.style.width = `${fuel}%`;
    this.elements.fuelText.textContent = `${Math.round(fuel)}%`;
  }

  /**
   * Update a condition bar and text display
   *
   * Centralizes condition display logic to avoid duplication between HUD and repair panel.
   * Handles different element naming conventions (hudHullText vs repairHullPercent).
   *
   * @param {string} prefix - Element prefix ('' for HUD, 'repair' for repair panel)
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @param {number} conditionValue - Condition percentage (0-100)
   */
  updateConditionDisplay(prefix, systemType, conditionValue) {
    const capitalizedType = this.capitalizeFirst(systemType);
    // For HUD (empty prefix), use lowercase first letter; for repair panel, use capitalized
    const typeKey = prefix ? capitalizedType : systemType;
    const barElement = this.elements[`${prefix}${typeKey}Bar`];
    // HUD uses 'Text' suffix, repair panel uses 'Percent' suffix
    const textElement =
      this.elements[`${prefix}${typeKey}Text`] ||
      this.elements[`${prefix}${capitalizedType}Percent`];

    if (barElement) {
      barElement.style.width = `${conditionValue}%`;
    }
    if (textElement) {
      textElement.textContent = `${Math.round(conditionValue)}%`;
    }
  }

  /**
   * Update ship condition bars in HUD
   * Updates visual width and percentage text for hull, engine, and life support
   *
   * @param {Object} condition - Ship condition object with hull, engine, lifeSupport
   */
  updateShipCondition(condition) {
    if (!condition) {
      throw new Error(
        'Invalid game state: ship condition is null in updateShipCondition'
      );
    }

    this.updateConditionDisplay('', 'hull', condition.hull);
    this.updateConditionDisplay('', 'engine', condition.engine);
    this.updateConditionDisplay('', 'lifeSupport', condition.lifeSupport);
  }

  updateCargo() {
    const cargoUsed = this.gameStateManager.getCargoUsed();
    const ship = this.gameStateManager.getShip();

    if (!ship) {
      throw new Error('Invalid game state: ship is null in updateCargo');
    }

    this.elements.cargo.textContent = `${cargoUsed}/${ship.cargoCapacity}`;
  }

  updateLocation(systemId) {
    const system = this.starData.find((s) => s.id === systemId);

    if (!system) return;

    this.elements.system.textContent = system.name;

    const distance = calculateDistanceFromSol(system);
    this.elements.distance.textContent = `${distance.toFixed(1)} LY`;

    // Update quick access button states
    this.updateQuickAccessButtons();
  }

  setupStationInterfaceHandlers() {
    if (this.elements.stationCloseBtn) {
      this.elements.stationCloseBtn.addEventListener('click', () => {
        this.hideStationInterface();
      });
    }

    if (this.elements.undockBtn) {
      this.elements.undockBtn.addEventListener('click', () => {
        this.hideStationInterface();
      });
    }

    if (this.elements.tradeBtn) {
      this.elements.tradeBtn.addEventListener('click', () => {
        this.showTradePanel();
      });
    }

    if (this.elements.tradeCloseBtn) {
      this.elements.tradeCloseBtn.addEventListener('click', () => {
        this.hideTradePanel();
      });
    }

    if (this.elements.tradeBackBtn) {
      this.elements.tradeBackBtn.addEventListener('click', () => {
        this.hideTradePanel();
        this.showStationInterface();
      });
    }

    if (this.elements.refuelBtn) {
      this.elements.refuelBtn.addEventListener('click', () => {
        this.showRefuelPanel();
      });
    }

    if (this.elements.refuelCloseBtn) {
      this.elements.refuelCloseBtn.addEventListener('click', () => {
        this.hideRefuelPanel();
      });
    }

    if (this.elements.refuelBackBtn) {
      this.elements.refuelBackBtn.addEventListener('click', () => {
        this.hideRefuelPanel();
        this.showStationInterface();
      });
    }

    if (this.elements.refuelAmountInput) {
      this.elements.refuelAmountInput.addEventListener('input', () => {
        if (this.refuelPanelController) {
          this.refuelPanelController.updateRefuelCost();
        }
      });
    }

    // Cache refuel preset buttons to avoid repeated DOM queries
    this.cachedRefuelPresetButtons = document.querySelectorAll(
      '.refuel-preset-btn[data-amount]'
    );
    this.cachedRefuelPresetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (this.refuelPanelController) {
          const amount = parseInt(btn.getAttribute('data-amount'));
          this.refuelPanelController.elements.refuelAmountInput.value = amount;
          this.refuelPanelController.updateRefuelCost();
        }
      });
    });

    if (this.elements.refuelMaxBtn) {
      this.elements.refuelMaxBtn.addEventListener('click', () => {
        if (this.refuelPanelController) {
          this.refuelPanelController.handleRefuelMax();
        }
      });
    }

    if (this.elements.refuelConfirmBtn) {
      this.elements.refuelConfirmBtn.addEventListener('click', () => {
        if (this.refuelPanelController) {
          try {
            this.refuelPanelController.handleRefuelConfirm();
          } catch (error) {
            this.showError(error.message);
          }
        }
      });
    }

    if (this.elements.infoBrokerBtn) {
      this.elements.infoBrokerBtn.addEventListener('click', () => {
        this.showInfoBrokerPanel();
      });
    }

    if (this.elements.infoBrokerCloseBtn) {
      this.elements.infoBrokerCloseBtn.addEventListener('click', () => {
        this.hideInfoBrokerPanel();
      });
    }

    if (this.elements.infoBrokerBackBtn) {
      this.elements.infoBrokerBackBtn.addEventListener('click', () => {
        this.hideInfoBrokerPanel();
        this.showStationInterface();
      });
    }

    if (this.elements.buyRumorBtn) {
      this.elements.buyRumorBtn.addEventListener('click', () => {
        this.handleBuyRumor();
      });
    }

    if (this.elements.purchaseTab) {
      this.elements.purchaseTab.addEventListener('click', () => {
        this.showPurchaseTab();
      });
    }

    if (this.elements.marketDataTab) {
      this.elements.marketDataTab.addEventListener('click', () => {
        this.showMarketDataTab();
      });
    }

    if (this.elements.repairsBtn) {
      this.elements.repairsBtn.addEventListener('click', () => {
        this.showRepairPanel();
      });
    }

    if (this.elements.repairCloseBtn) {
      this.elements.repairCloseBtn.addEventListener('click', () => {
        this.hideRepairPanel();
      });
    }

    if (this.elements.repairBackBtn) {
      this.elements.repairBackBtn.addEventListener('click', () => {
        this.hideRepairPanel();
        this.showStationInterface();
      });
    }

    // Setup repair button handlers and cache the buttons
    this.cachedRepairButtons = document.querySelectorAll(
      '.repair-btn[data-system][data-amount]'
    );
    this.cachedRepairButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const systemType = btn.getAttribute('data-system');
        const amount = btn.getAttribute('data-amount');
        this.handleRepair(systemType, amount);
      });
    });

    if (this.elements.repairAllBtn) {
      this.elements.repairAllBtn.addEventListener('click', () => {
        this.handleRepairAll();
      });
    }

    if (this.elements.shipStatusBtn) {
      this.elements.shipStatusBtn.addEventListener('click', () => {
        this.showShipStatus();
      });
    }

    if (this.elements.upgradesBtn) {
      this.elements.upgradesBtn.addEventListener('click', () => {
        this.showUpgradesInterface();
      });
    }

    if (this.elements.upgradesCloseBtn) {
      this.elements.upgradesCloseBtn.addEventListener('click', () => {
        this.hideUpgradesInterface();
      });
    }

    if (this.elements.upgradesBackBtn) {
      this.elements.upgradesBackBtn.addEventListener('click', () => {
        this.hideUpgradesInterface();
        this.showStationInterface();
      });
    }

    if (this.elements.upgradeCancelBtn) {
      this.elements.upgradeCancelBtn.addEventListener('click', () => {
        this.hideUpgradeConfirmation();
      });
    }

    if (this.elements.upgradeConfirmBtn) {
      this.elements.upgradeConfirmBtn.addEventListener('click', () => {
        this.handleUpgradeConfirm();
      });
    }

    if (this.elements.cargoManifestCloseBtn) {
      this.elements.cargoManifestCloseBtn.addEventListener('click', () => {
        this.hideCargoManifest();
      });
    }

    if (this.elements.cargoManifestBackBtn) {
      this.elements.cargoManifestBackBtn.addEventListener('click', () => {
        this.hideCargoManifest();
        this.showStationInterface();
      });
    }

    if (this.elements.cargoManifestBtn) {
      this.elements.cargoManifestBtn.addEventListener('click', () => {
        this.showCargoManifest();
      });
    }

    if (this.elements.toggleHiddenCargoBtn) {
      this.elements.toggleHiddenCargoBtn.addEventListener('click', () => {
        this.toggleHiddenCargoView();
      });
    }
  }

  setupShipStatusHandlers() {
    // Use event delegation on document body for dynamically created ship status panel
    // This prevents memory leaks from adding listeners every time the panel is rendered
    document.body.addEventListener('click', (e) => {
      if (
        e.target.id === 'ship-status-close-btn' ||
        e.target.id === 'ship-status-back-btn'
      ) {
        this.hideShipStatus();
      }
    });
  }

  showStationInterface() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in showStationInterface'
      );
    }

    const currentSystemId = state.player.currentSystem;
    const system = this.starData.find((s) => s.id === currentSystemId);

    if (!system) {
      throw new Error(
        `Invalid game state: current system ID ${currentSystemId} not found in star data`
      );
    }

    this.elements.stationName.textContent = `${system.name} Station`;
    this.elements.stationSystemName.textContent = system.name;

    const distance = calculateDistanceFromSol(system);
    this.elements.stationDistance.textContent = `${distance.toFixed(1)} LY`;

    this.elements.stationInterface.classList.add('visible');

    // Check for active event at this system and show notification
    const activeEvent =
      this.gameStateManager.getActiveEventForSystem(currentSystemId);
    if (activeEvent) {
      this.showEventNotification(activeEvent);
    }
  }

  hideStationInterface() {
    this.elements.stationInterface.classList.remove('visible');
  }

  isStationVisible() {
    return this.elements.stationInterface.classList.contains('visible');
  }

  setupEventModalHandlers() {
    if (this.elements.eventModalDismiss) {
      this.elements.eventModalDismiss.addEventListener('click', () => {
        this.hideEventNotification();
      });
    }

    // Handle escape key to dismiss event notification
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'Escape' &&
        this.elements.eventModalOverlay &&
        !this.elements.eventModalOverlay.classList.contains('hidden')
      ) {
        this.hideEventNotification();
      }
    });
  }

  setupQuickAccessHandlers() {
    if (this.elements.quickSystemInfoBtn) {
      this.elements.quickSystemInfoBtn.addEventListener('click', () => {
        this.showSystemInfoPanel();
      });
    }

    if (this.elements.quickStationBtn) {
      this.elements.quickStationBtn.addEventListener('click', () => {
        this.openStationOrShowError();
      });
    }
  }

  showSystemInfoPanel() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in showSystemInfoPanel'
      );
    }

    const currentSystemId = state.player.currentSystem;

    // Call the global selectStarById function with openStation=false
    // This opens only the system info panel, not the station interface
    if (window.selectStarById) {
      window.selectStarById(currentSystemId, false);
    }
  }

  openStationOrShowError() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in openStationOrShowError'
      );
    }

    const currentSystemId = state.player.currentSystem;
    const system = this.starData.find((s) => s.id === currentSystemId);

    // Check if system has a station
    if (!system || system.st === 0) {
      this.showError('No station at current system');
      return;
    }

    this.showStationInterface();
  }

  updateQuickAccessButtons() {
    // Both buttons remain enabled to provide immediate feedback on click
    if (this.elements.quickSystemInfoBtn) {
      this.elements.quickSystemInfoBtn.disabled = false;
    }

    if (this.elements.quickStationBtn) {
      this.elements.quickStationBtn.disabled = false;
    }
  }

  /**
   * Show event notification modal when docking at a system with an active event
   * @param {Object} event - The active event object
   */
  showEventNotification(event) {
    if (!event || !this.elements.eventModalOverlay) {
      return;
    }

    // Get event type definition
    const eventType = this.gameStateManager.getEventType(event.type);
    if (!eventType) {
      return;
    }

    // Calculate remaining duration
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in showEventNotification'
      );
    }

    const currentDay = state.player.daysElapsed;
    const remainingDays = event.endDay - currentDay;

    // Set modal content
    this.elements.eventModalTitle.textContent = eventType.name;
    this.elements.eventModalDescription.textContent = eventType.description;
    this.elements.eventModalDuration.textContent = `Expected duration: ${remainingDays} day${remainingDays !== 1 ? 's' : ''} remaining`;

    // Show modal
    this.elements.eventModalOverlay.classList.remove('hidden');

    // Focus dismiss button
    if (this.elements.eventModalDismiss) {
      this.elements.eventModalDismiss.focus();
    }
  }

  /**
   * Hide event notification modal
   */
  hideEventNotification() {
    if (this.elements.eventModalOverlay) {
      this.elements.eventModalOverlay.classList.add('hidden');
    }
  }

  handleSystemClick(systemId) {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in handleSystemClick');
    }

    // Only show station interface if clicking on current system
    if (systemId === state.player.currentSystem) {
      this.showStationInterface();
    }
  }

  showTradePanel() {
    this.hideStationInterface();
    if (!this.tradePanelController) {
      throw new Error(
        'TradePanelController not initialized - required DOM elements may be missing'
      );
    }

    try {
      this.tradePanelController.show();
    } catch (error) {
      this.showError(error.message);
    }
  }

  hideTradePanel() {
    if (!this.tradePanelController) {
      throw new Error(
        'TradePanelController not initialized - required DOM elements may be missing'
      );
    }

    this.tradePanelController.hide();
  }

  updateTradeCargoCapacity() {
    if (!this.tradePanelController) {
      throw new Error(
        'TradePanelController not initialized - required DOM elements may be missing'
      );
    }

    this.tradePanelController.updateTradeCargoCapacity();
  }

  isTradeVisible() {
    return this.elements.tradePanel.classList.contains('visible');
  }

  isRefuelVisible() {
    return this.elements.refuelPanel.classList.contains('visible');
  }

  isInfoBrokerVisible() {
    return this.elements.infoBrokerPanel.classList.contains('visible');
  }

  renderMarketGoods(system) {
    if (!this.tradePanelController) {
      throw new Error(
        'TradePanelController not initialized - required DOM elements may be missing'
      );
    }

    this.tradePanelController.renderMarketGoods(system);
  }

  createGoodItem(goodType, price) {
    if (!this.tradePanelController) {
      throw new Error(
        'TradePanelController not initialized - required DOM elements may be missing'
      );
    }

    return this.tradePanelController.createGoodItem(goodType, price);
  }

  handleBuy(goodType, quantity, price) {
    try {
      this.tradePanelController.handleBuyGood(goodType, quantity, price);
    } catch (error) {
      this.showError(error.message);
    }
  }

  renderCargoStacks(system) {
    if (!this.tradePanelController) {
      throw new Error(
        'TradePanelController not initialized - required DOM elements may be missing'
      );
    }

    this.tradePanelController.renderCargoStacks(system);
  }

  createCargoStackItem(stack, stackIndex, system) {
    if (!this.tradePanelController) {
      throw new Error(
        'TradePanelController not initialized - required DOM elements may be missing'
      );
    }

    const state = this.gameStateManager.getState();

    const stackItem = document.createElement('div');
    stackItem.className = 'cargo-stack';

    // Delegate to controller for stack info creation
    const { stackInfo, currentPrice } =
      this.tradePanelController.createCargoStackInfo(stack, system);

    const stackActions = document.createElement('div');
    stackActions.className = 'stack-actions';

    const sell1Btn = document.createElement('button');
    sell1Btn.className = 'sell-btn';
    sell1Btn.textContent = 'Sell 1';
    sell1Btn.disabled = stack.qty < 1;
    sell1Btn.addEventListener('click', () =>
      this.handleSell(stackIndex, 1, currentPrice)
    );

    const sellAllBtn = document.createElement('button');
    sellAllBtn.className = 'sell-btn';
    sellAllBtn.textContent = `Sell All (${stack.qty})`;
    sellAllBtn.addEventListener('click', () =>
      this.handleSell(stackIndex, stack.qty, currentPrice)
    );

    stackActions.appendChild(sell1Btn);
    stackActions.appendChild(sellAllBtn);

    // Add "Move to Hidden" button if Smuggler's Panels installed
    const hasSmugglersPanel =
      state.ship.upgrades && state.ship.upgrades.includes('smuggler_panels');
    if (hasSmugglersPanel) {
      const moveToHiddenBtn = document.createElement('button');
      moveToHiddenBtn.className = 'transfer-btn';
      moveToHiddenBtn.textContent = 'Move to Hidden';
      moveToHiddenBtn.addEventListener('click', () =>
        this.handleMoveToHidden(stack.good, stack.qty)
      );
      stackActions.appendChild(moveToHiddenBtn);
    }

    stackItem.appendChild(stackInfo);
    stackItem.appendChild(stackActions);

    return stackItem;
  }

  handleSell(stackIndex, quantity, salePrice) {
    const saleOutcome = this.gameStateManager.sellGood(
      stackIndex,
      quantity,
      salePrice
    );

    if (!saleOutcome.success) {
      this.showError(`Sale failed: ${saleOutcome.reason}`);
      return;
    }

    // Refresh the trade panel to show updated state
    const state = this.gameStateManager.getState();
    const system = this.starData.find(
      (s) => s.id === state.player.currentSystem
    );

    if (!system) {
      throw new Error(
        `Invalid game state: current system ID ${state.player.currentSystem} not found in star data`
      );
    }

    this.updateTradeCargoCapacity();
    this.renderMarketGoods(system);
    this.renderCargoStacks(system);
    this.renderHiddenCargoSection(system);
  }

  /**
   * Handle moving cargo to hidden compartment
   *
   * Transfers cargo from regular cargo to hidden compartment.
   * Displays validation errors if transfer fails.
   *
   * Feature: ship-personality
   * Validates: Requirements 3.3
   *
   * @param {string} goodType - Commodity type
   * @param {number} quantity - Quantity to move
   */
  handleMoveToHidden(goodType, quantity) {
    const result = this.gameStateManager.moveToHiddenCargo(goodType, quantity);

    if (!result.success) {
      this.showError(`Transfer failed: ${result.reason}`);
      return;
    }

    this.showSuccess(`Moved ${quantity} ${goodType} to hidden cargo`);

    // Refresh the trade panel to show updated state
    const state = this.gameStateManager.getState();
    const system = this.starData.find(
      (s) => s.id === state.player.currentSystem
    );

    if (!system) {
      throw new Error(
        `Invalid game state: current system ID ${state.player.currentSystem} not found in star data`
      );
    }

    this.updateTradeCargoCapacity();
    this.renderMarketGoods(system);
    this.renderCargoStacks(system);
    this.renderHiddenCargoSection(system);
  }

  /**
   * Handle moving cargo to regular compartment
   *
   * Transfers cargo from hidden compartment to regular cargo.
   * Displays validation errors if transfer fails.
   *
   * Feature: ship-personality
   * Validates: Requirements 3.4
   *
   * @param {string} goodType - Commodity type
   * @param {number} quantity - Quantity to move
   */
  handleMoveToRegular(goodType, quantity) {
    const result = this.gameStateManager.moveToRegularCargo(goodType, quantity);

    if (!result.success) {
      this.showError(`Transfer failed: ${result.reason}`);
      return;
    }

    this.showSuccess(`Moved ${quantity} ${goodType} to regular cargo`);

    // Refresh the trade panel to show updated state
    const state = this.gameStateManager.getState();
    const system = this.starData.find(
      (s) => s.id === state.player.currentSystem
    );

    if (!system) {
      throw new Error(
        `Invalid game state: current system ID ${state.player.currentSystem} not found in star data`
      );
    }

    this.updateTradeCargoCapacity();
    this.renderMarketGoods(system);
    this.renderCargoStacks(system);
    this.renderHiddenCargoSection(system);
  }

  /**
   * Render hidden cargo section in trade panel
   *
   * Displays hidden cargo section only when Smuggler's Panels upgrade is installed.
   * Shows hidden cargo capacity usage and all hidden cargo stacks.
   *
   * Feature: ship-personality
   * Validates: Requirements 3.2
   *
   * @param {Object} system - Current star system
   */
  renderHiddenCargoSection(system) {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in renderHiddenCargoSection'
      );
    }

    // Check if hidden cargo elements exist (may not exist in test environment)
    if (!this.elements.hiddenCargoSection || !this.elements.hiddenCargoStacks) {
      return;
    }

    const ship = state.ship;
    const hasSmugglersPanel =
      ship.upgrades && ship.upgrades.includes('smuggler_panels');

    // Show/hide section based on upgrade
    if (!hasSmugglersPanel) {
      this.elements.hiddenCargoSection.classList.add('hidden');
      return;
    }

    this.elements.hiddenCargoSection.classList.remove('hidden');

    // Update capacity display
    const hiddenCargo = ship.hiddenCargo || [];
    const hiddenCargoUsed = hiddenCargo.reduce(
      (sum, stack) => sum + stack.qty,
      0
    );
    const hiddenCargoCapacity = ship.hiddenCargoCapacity || 10;

    if (this.elements.hiddenCargoUsed) {
      this.elements.hiddenCargoUsed.textContent = hiddenCargoUsed;
    }
    if (this.elements.hiddenCargoCapacity) {
      this.elements.hiddenCargoCapacity.textContent = hiddenCargoCapacity;
    }

    // Render hidden cargo stacks
    this.elements.hiddenCargoStacks.replaceChildren();

    if (hiddenCargo.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'cargo-empty';
      emptyMsg.textContent = 'No hidden cargo';
      this.elements.hiddenCargoStacks.appendChild(emptyMsg);
      return;
    }

    // Use DocumentFragment to batch DOM insertions for better performance
    const fragment = document.createDocumentFragment();
    hiddenCargo.forEach((stack) => {
      const stackItem = this.createHiddenCargoStackItem(stack, system);
      fragment.appendChild(stackItem);
    });
    this.elements.hiddenCargoStacks.appendChild(fragment);
  }

  /**
   * Toggle hidden cargo view visibility
   *
   * Shows or hides the hidden cargo content section and updates button text.
   *
   * Feature: ship-personality
   * Validates: Requirements 3.5
   */
  toggleHiddenCargoView() {
    if (
      !this.elements.hiddenCargoContent ||
      !this.elements.toggleHiddenCargoBtn
    ) {
      return;
    }

    const isCollapsed =
      this.elements.hiddenCargoContent.classList.contains('collapsed');

    if (isCollapsed) {
      // Show hidden cargo
      this.elements.hiddenCargoContent.classList.remove('collapsed');
      this.elements.toggleHiddenCargoBtn.textContent = 'Hide';
    } else {
      // Hide hidden cargo
      this.elements.hiddenCargoContent.classList.add('collapsed');
      this.elements.toggleHiddenCargoBtn.textContent = 'Show';
    }
  }

  /**
   * Create a hidden cargo stack item element
   *
   * Similar to regular cargo stack but for hidden compartment.
   * Shows commodity name, quantity, purchase details, and profit calculation.
   *
   * @param {Object} stack - Hidden cargo stack
   * @param {Object} system - Current star system
   * @returns {HTMLElement} Hidden cargo stack item element
   */
  createHiddenCargoStackItem(stack, system) {
    if (!this.tradePanelController) {
      throw new Error(
        'TradePanelController not initialized - required DOM elements may be missing'
      );
    }

    const stackItem = document.createElement('div');
    stackItem.className = 'cargo-stack';

    // Delegate to controller for stack info creation
    const { stackInfo } = this.tradePanelController.createCargoStackInfo(
      stack,
      system
    );

    // Add "Move to Regular" button for hidden cargo
    const stackActions = document.createElement('div');
    stackActions.className = 'stack-actions';

    const moveToRegularBtn = document.createElement('button');
    moveToRegularBtn.className = 'transfer-btn';
    moveToRegularBtn.textContent = 'Move to Regular';
    moveToRegularBtn.addEventListener('click', () =>
      this.handleMoveToRegular(stack.good, stack.qty)
    );

    stackActions.appendChild(moveToRegularBtn);

    stackItem.appendChild(stackInfo);
    stackItem.appendChild(stackActions);

    return stackItem;
  }

  /**
   * Capitalize first letter of a string for display purposes
   *
   * Used consistently across UI for commodity names, system types, and labels
   * to ensure uniform presentation. Centralizes formatting logic.
   *
   * @param {string} str - String to capitalize
   * @returns {string} String with first letter capitalized
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Format staleness information for price knowledge display
   *
   * Converts lastVisit days into human-readable text with appropriate CSS class.
   * Centralizes staleness display logic to ensure consistency across UI.
   *
   * @param {number} lastVisit - Days since last visit (0 = current)
   * @returns {Object} { text: string, cssClass: string }
   */
  formatStaleness(lastVisit) {
    if (lastVisit === 0) {
      return { text: 'Current', cssClass: '' };
    } else if (lastVisit === 1) {
      return { text: '1 day old', cssClass: '' };
    } else if (lastVisit <= 10) {
      return { text: `${lastVisit} days old`, cssClass: '' };
    } else if (lastVisit <= 30) {
      return { text: `${lastVisit} days old`, cssClass: 'stale' };
    } else {
      return { text: `${lastVisit} days old`, cssClass: 'very-stale' };
    }
  }

  /**
   * Show a notification with auto-dismiss
   * Messages are queued to prevent overlap
   *
   * @param {string} message - Notification message
   * @param {number} duration - Display duration in milliseconds
   * @param {string} type - Notification type: 'error', 'success', 'info'
   */
  showNotification(
    message,
    duration = NOTIFICATION_CONFIG.DEFAULT_ERROR_DURATION,
    type = 'error'
  ) {
    this.notificationQueue.push({ message, duration, type });

    if (!this.isShowingNotification) {
      this.processNotificationQueue();
    }
  }

  /**
   * Show an error notification (convenience method)
   */
  showError(message, duration = NOTIFICATION_CONFIG.DEFAULT_ERROR_DURATION) {
    this.showNotification(message, duration, 'error');
  }

  /**
   * Show a success notification (convenience method)
   */
  showSuccess(
    message,
    duration = NOTIFICATION_CONFIG.DEFAULT_SUCCESS_DURATION
  ) {
    this.showNotification(message, duration, 'success');
  }

  /**
   * Process the notification queue sequentially
   * Ensures messages don't overlap
   */
  processNotificationQueue() {
    if (this.notificationQueue.length === 0) {
      this.isShowingNotification = false;
      return;
    }

    this.isShowingNotification = true;
    const { message, duration, type } = this.notificationQueue.shift();

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to notification area
    this.elements.notificationArea.appendChild(notification);

    // Auto-dismiss after duration
    setTimeout(() => {
      // Add fade-out animation
      notification.classList.add('fade-out');

      // Remove from DOM after animation completes
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }

        // Process next notification in queue
        this.processNotificationQueue();
      }, NOTIFICATION_CONFIG.FADE_DURATION);
    }, duration);
  }

  /**
   * Clear all notifications immediately
   */
  clearNotifications() {
    this.notificationQueue = [];
    this.isShowingNotification = false;

    if (this.elements.notificationArea) {
      this.elements.notificationArea.replaceChildren();
    }
  }

  /**
   * Show a ship condition warning notification
   *
   * Displays warnings when ship systems fall below critical thresholds.
   * Uses longer duration for critical warnings to ensure player sees them.
   *
   * @param {Object} warning - Warning object with system, message, and severity
   */
  showConditionWarning(warning) {
    const systemName =
      warning.system === 'lifeSupport'
        ? 'Life Support'
        : this.capitalizeFirst(warning.system);

    const message = `${systemName}: ${warning.message}`;

    // Use longer duration for critical warnings
    const duration =
      warning.severity === 'critical'
        ? NOTIFICATION_CONFIG.DEFAULT_ERROR_DURATION * 2
        : NOTIFICATION_CONFIG.DEFAULT_ERROR_DURATION;

    this.showNotification(message, duration, 'error');
  }

  showRefuelPanel() {
    this.hideStationInterface();
    if (!this.refuelPanelController) {
      throw new Error(
        'RefuelPanelController not initialized - required DOM elements may be missing'
      );
    }

    try {
      this.refuelPanelController.show();
    } catch (error) {
      this.showError(error.message);
    }
  }

  hideRefuelPanel() {
    if (!this.refuelPanelController) {
      throw new Error(
        'RefuelPanelController not initialized - required DOM elements may be missing'
      );
    }

    this.refuelPanelController.hide();
  }

  updateRefuelCost() {
    if (!this.refuelPanelController) {
      throw new Error(
        'RefuelPanelController not initialized - required DOM elements may be missing'
      );
    }

    this.refuelPanelController.updateRefuelCost();
  }

  setRefuelAmountToMax() {
    if (!this.refuelPanelController) {
      throw new Error(
        'RefuelPanelController not initialized - required DOM elements may be missing'
      );
    }

    this.refuelPanelController.handleRefuelMax();
  }

  showInfoBrokerPanel() {
    const state = this.gameStateManager.getState();
    const currentSystemId = state.player.currentSystem;
    const system = this.starData.find((s) => s.id === currentSystemId);

    if (!system) return;

    this.elements.infoBrokerSystemName.textContent = system.name;

    // Clear previous rumor
    this.elements.rumorText.textContent = '';
    this.elements.rumorText.classList.remove('visible');

    // Clear validation message
    this.elements.infoBrokerValidationMessage.textContent = '';
    this.elements.infoBrokerValidationMessage.className = 'validation-message';

    // Show purchase tab by default
    this.showPurchaseTab();

    // Update rumor button state
    this.updateRumorButton();

    // Render intelligence list
    this.renderIntelligenceList();

    this.hideStationInterface();

    this.elements.infoBrokerPanel.classList.add('visible');
  }

  showPurchaseTab() {
    this.elements.purchaseTab.classList.add('active');
    this.elements.marketDataTab.classList.remove('active');
    this.elements.purchaseIntelContent.classList.add('active');
    this.elements.marketDataContent.classList.remove('active');
  }

  showMarketDataTab() {
    this.elements.purchaseTab.classList.remove('active');
    this.elements.marketDataTab.classList.add('active');
    this.elements.purchaseIntelContent.classList.remove('active');
    this.elements.marketDataContent.classList.add('active');

    // Render market data when tab is shown
    this.renderMarketData();
  }

  renderMarketData() {
    const state = this.gameStateManager.getState();
    const priceKnowledge = state.world.priceKnowledge || {};

    this.elements.marketDataList.replaceChildren();

    // Get all systems with known prices
    const knownSystems = Object.keys(priceKnowledge).map(Number);

    if (knownSystems.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'market-data-empty';
      emptyMsg.textContent =
        'No market data available. Purchase intelligence or visit systems to gather price information.';
      this.elements.marketDataList.appendChild(emptyMsg);
      return;
    }

    // Sort by staleness (current first, then recent, then stale)
    knownSystems.sort((a, b) => {
      const aLastVisit = priceKnowledge[a].lastVisit;
      const bLastVisit = priceKnowledge[b].lastVisit;
      return aLastVisit - bLastVisit;
    });

    // Use DocumentFragment to batch DOM insertions for better performance
    const fragment = document.createDocumentFragment();
    knownSystems.forEach((systemId) => {
      const system = this.starData.find((s) => s.id === systemId);
      if (!system) return;

      const knowledge = priceKnowledge[systemId];
      const marketDataItem = this.createMarketDataItem(system, knowledge);
      fragment.appendChild(marketDataItem);
    });
    this.elements.marketDataList.appendChild(fragment);
  }

  createMarketDataItem(system, knowledge) {
    const container = document.createElement('div');
    container.className = 'market-data-system';

    // Header with system name and staleness
    const header = document.createElement('div');
    header.className = 'market-data-header';

    const systemName = document.createElement('div');
    systemName.className = 'market-data-system-name';
    systemName.textContent = system.name;

    const staleness = document.createElement('div');
    staleness.className = 'market-data-staleness';

    const stalenessInfo = this.formatStaleness(knowledge.lastVisit);
    staleness.textContent = stalenessInfo.text;
    if (stalenessInfo.cssClass) {
      staleness.classList.add(stalenessInfo.cssClass);
    }

    header.appendChild(systemName);
    header.appendChild(staleness);

    // Prices grid
    const pricesGrid = document.createElement('div');
    pricesGrid.className = 'market-data-prices';

    COMMODITY_TYPES.forEach((commodity) => {
      const priceItem = document.createElement('div');
      priceItem.className = 'market-data-price-item';

      const commodityName = document.createElement('span');
      commodityName.className = 'market-data-commodity';
      commodityName.textContent = this.capitalizeFirst(commodity);

      const price = document.createElement('span');
      price.className = 'market-data-price';
      price.textContent = `₡${knowledge.prices[commodity]}`;

      priceItem.appendChild(commodityName);
      priceItem.appendChild(price);
      pricesGrid.appendChild(priceItem);
    });

    container.appendChild(header);
    container.appendChild(pricesGrid);

    return container;
  }

  hideInfoBrokerPanel() {
    this.elements.infoBrokerPanel.classList.remove('visible');
  }

  updateRumorButton() {
    const state = this.gameStateManager.getState();
    const credits = state.player.credits;
    const rumorCost = INTELLIGENCE_CONFIG.PRICES.RUMOR;

    this.elements.buyRumorBtn.disabled = credits < rumorCost;
  }

  handleBuyRumor() {
    const state = this.gameStateManager.getState();
    const credits = state.player.credits;
    const rumorCost = INTELLIGENCE_CONFIG.PRICES.RUMOR;

    // Validate purchase
    if (credits < rumorCost) {
      this.elements.infoBrokerValidationMessage.textContent =
        'Insufficient credits for rumor';
      this.elements.infoBrokerValidationMessage.className =
        'validation-message error';
      return;
    }

    // Deduct credits
    this.gameStateManager.updateCredits(credits - rumorCost);

    // Generate and display rumor
    const rumor = this.gameStateManager.generateRumor();
    this.elements.rumorText.textContent = rumor;
    this.elements.rumorText.classList.add('visible');

    // Clear validation message
    this.elements.infoBrokerValidationMessage.textContent = '';
    this.elements.infoBrokerValidationMessage.className = 'validation-message';

    // Update button state
    this.updateRumorButton();

    // Refresh intelligence list (credits changed)
    this.renderIntelligenceList();
  }

  renderIntelligenceList() {
    const state = this.gameStateManager.getState();

    this.elements.intelligenceList.replaceChildren();

    const credits = state.player.credits;

    // Get all systems with their intelligence costs
    const intelligenceOptions =
      this.gameStateManager.listAvailableIntelligence();

    // Sort by information freshness: never visited → stale → recent → current
    // This prioritizes systems where intelligence is most valuable
    const getIntelligencePriority = (option) => {
      if (option.lastVisit === null) return 0; // Never visited - highest priority
      if (option.lastVisit === 0) return 3; // Current - lowest priority (already have data)
      if (option.lastVisit > INTELLIGENCE_CONFIG.RECENT_THRESHOLD) return 1; // Stale
      return 2; // Recent
    };

    intelligenceOptions.sort(
      (a, b) => getIntelligencePriority(a) - getIntelligencePriority(b)
    );

    // Use DocumentFragment to batch DOM insertions for better performance
    const fragment = document.createDocumentFragment();
    intelligenceOptions.forEach((option) => {
      const item = this.createIntelligenceItem(option, credits);
      fragment.appendChild(item);
    });
    this.elements.intelligenceList.appendChild(fragment);
  }

  createIntelligenceItem(option, credits) {
    const item = document.createElement('div');
    item.className = 'intelligence-item';

    const info = document.createElement('div');
    info.className = 'intelligence-info';

    const systemName = document.createElement('div');
    systemName.className = 'intelligence-system-name';
    systemName.textContent = option.systemName;

    const visitInfo = document.createElement('div');
    visitInfo.className = 'intelligence-visit-info';

    if (option.lastVisit === null) {
      visitInfo.textContent = 'Never visited';
    } else if (option.lastVisit === 0) {
      visitInfo.textContent = 'Current prices';
    } else if (option.lastVisit === 1) {
      visitInfo.textContent = 'Last visited 1 day ago';
    } else {
      visitInfo.textContent = `Last visited ${option.lastVisit} days ago`;
    }

    info.appendChild(systemName);
    info.appendChild(visitInfo);

    const actions = document.createElement('div');
    actions.className = 'intelligence-actions';

    const cost = document.createElement('div');
    cost.className = 'intelligence-cost';
    cost.textContent = `₡${option.cost}`;

    const buyBtn = document.createElement('button');
    buyBtn.className = 'info-broker-btn';
    buyBtn.textContent = 'Purchase';
    buyBtn.disabled = credits < option.cost || option.lastVisit === 0;

    if (option.lastVisit === 0) {
      buyBtn.textContent = 'Current';
    }

    buyBtn.addEventListener('click', () =>
      this.handlePurchaseIntelligence(option.systemId)
    );

    actions.appendChild(cost);
    actions.appendChild(buyBtn);

    item.appendChild(info);
    item.appendChild(actions);

    return item;
  }

  handlePurchaseIntelligence(systemId) {
    const intelligenceOutcome =
      this.gameStateManager.purchaseIntelligence(systemId);

    if (!intelligenceOutcome.success) {
      this.elements.infoBrokerValidationMessage.textContent =
        intelligenceOutcome.reason;
      this.elements.infoBrokerValidationMessage.className =
        'validation-message error';
      return;
    }

    // Clear validation message
    this.elements.infoBrokerValidationMessage.textContent = '';
    this.elements.infoBrokerValidationMessage.className = 'validation-message';

    // Show success notification
    const system = this.starData.find((s) => s.id === systemId);
    if (system) {
      this.showSuccess(`Intelligence purchased for ${system.name}`);
    }

    // Refresh the panel to show updated state
    this.updateRumorButton();
    this.renderIntelligenceList();
  }

  // ========================================================================
  // REPAIR PANEL
  // ========================================================================

  showRepairPanel() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in showRepairPanel');
    }

    const currentSystemId = state.player.currentSystem;
    const system = this.starData.find((s) => s.id === currentSystemId);

    if (!system) {
      throw new Error(
        `Invalid game state: current system ID ${currentSystemId} not found in star data`
      );
    }

    this.elements.repairSystemName.textContent = system.name;

    // Update condition displays
    this.updateRepairConditionDisplay();

    // Update repair button states and costs
    this.updateRepairButtons();

    // Clear validation message
    this.elements.repairValidationMessage.textContent = '';
    this.elements.repairValidationMessage.className = 'validation-message';

    this.hideStationInterface();

    this.elements.repairPanel.classList.add('visible');
  }

  hideRepairPanel() {
    this.elements.repairPanel.classList.remove('visible');
  }

  isRepairVisible() {
    return this.elements.repairPanel.classList.contains('visible');
  }

  /**
   * Get current condition value for a specific ship system
   * @param {Object} condition - Ship condition object with hull, engine, lifeSupport
   * @param {string} systemType - One of: 'hull', 'engine', 'lifeSupport'
   * @returns {number} Current condition percentage
   */
  getSystemCondition(condition, systemType) {
    switch (systemType) {
      case 'hull':
        return condition.hull;
      case 'engine':
        return condition.engine;
      case 'lifeSupport':
        return condition.lifeSupport;
      default:
        return 0;
    }
  }

  /**
   * Update all ship condition displays in repair panel
   *
   * Refreshes the visual representation of hull, engine, and life support
   * condition in the repair interface. Called when panel opens or after repairs.
   */
  updateRepairConditionDisplay() {
    const condition = this.gameStateManager.getShipCondition();
    if (!condition) {
      throw new Error(
        'Invalid game state: ship condition is null in updateRepairConditionDisplay'
      );
    }

    this.updateConditionDisplay('repair', 'hull', condition.hull);
    this.updateConditionDisplay('repair', 'engine', condition.engine);
    this.updateConditionDisplay('repair', 'lifeSupport', condition.lifeSupport);
  }

  /**
   * Update repair button states and costs based on current ship condition
   *
   * Recalculates repair costs for all buttons and updates their text/disabled state.
   * Buttons are disabled when system is at max, player lacks credits, or repair
   * would exceed maximum condition. Called when repair panel opens or after repairs.
   */
  updateRepairButtons() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in updateRepairButtons'
      );
    }

    const condition = this.gameStateManager.getShipCondition();
    const credits = state.player.credits;

    // Update repair buttons if they exist (may not exist in test environment)
    if (!this.cachedRepairButtons || this.cachedRepairButtons.length === 0) {
      return;
    }

    this.cachedRepairButtons.forEach((btn) => {
      const systemType = btn.getAttribute('data-system');
      const amountStr = btn.getAttribute('data-amount');
      const currentCondition = this.getSystemCondition(condition, systemType);

      let amount = 0;
      let cost = 0;

      if (amountStr === 'full') {
        // Full repair
        amount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - currentCondition;
        cost = this.gameStateManager.getRepairCost(
          systemType,
          amount,
          currentCondition
        );
        btn.textContent = `Full (₡${cost})`;
      } else {
        // Fixed amount repair
        amount = parseInt(amountStr);
        cost = this.gameStateManager.getRepairCost(
          systemType,
          amount,
          currentCondition
        );
        btn.textContent = `+${amount}% (₡${cost})`;
      }

      // Disable button if:
      // - Already at max condition
      // - Not enough credits
      // - Would exceed max condition
      const wouldExceedMax =
        currentCondition + amount > SHIP_CONFIG.CONDITION_BOUNDS.MAX;
      const atMax = currentCondition >= SHIP_CONFIG.CONDITION_BOUNDS.MAX;
      const notEnoughCredits = credits < cost;

      btn.disabled = atMax || notEnoughCredits || wouldExceedMax || amount <= 0;
    });

    // Update repair all button
    const totalCost = this.calculateRepairAllCost();
    this.elements.repairAllBtn.textContent = `Repair All to Full (₡${totalCost})`;

    const allAtMax =
      condition.hull >= SHIP_CONFIG.CONDITION_BOUNDS.MAX &&
      condition.engine >= SHIP_CONFIG.CONDITION_BOUNDS.MAX &&
      condition.lifeSupport >= SHIP_CONFIG.CONDITION_BOUNDS.MAX;
    this.elements.repairAllBtn.disabled =
      allAtMax || credits < totalCost || totalCost === 0;
  }

  /**
   * Calculate total cost to repair all ship systems to maximum condition
   *
   * Sums the repair costs for hull, engine, and life support to reach 100%.
   * Used to display cost on "Repair All" button and validate transaction.
   *
   * @returns {number} Total repair cost in credits
   */
  calculateRepairAllCost() {
    const condition = this.gameStateManager.getShipCondition();
    if (!condition) {
      throw new Error(
        'Invalid game state: ship condition is null in calculateRepairAllCost'
      );
    }

    let totalCost = 0;

    // Hull
    const hullAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.hull;
    if (hullAmount > 0) {
      totalCost += this.gameStateManager.getRepairCost(
        'hull',
        hullAmount,
        condition.hull
      );
    }

    // Engine
    const engineAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.engine;
    if (engineAmount > 0) {
      totalCost += this.gameStateManager.getRepairCost(
        'engine',
        engineAmount,
        condition.engine
      );
    }

    // Life Support
    const lifeSupportAmount =
      SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.lifeSupport;
    if (lifeSupportAmount > 0) {
      totalCost += this.gameStateManager.getRepairCost(
        'lifeSupport',
        lifeSupportAmount,
        condition.lifeSupport
      );
    }

    return totalCost;
  }

  handleRepair(systemType, amountStr) {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in handleRepair');
    }

    const condition = this.gameStateManager.getShipCondition();
    const currentCondition = this.getSystemCondition(condition, systemType);

    let amount = 0;
    if (amountStr === 'full') {
      amount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - currentCondition;
    } else {
      amount = parseInt(amountStr);
    }

    // Execute repair
    const repairOutcome = this.gameStateManager.repairShipSystem(
      systemType,
      amount
    );

    if (!repairOutcome.success) {
      this.elements.repairValidationMessage.textContent = `Repair failed: ${repairOutcome.reason}`;
      this.elements.repairValidationMessage.className =
        'validation-message error';
      return;
    }

    // Clear validation message
    this.elements.repairValidationMessage.textContent = '';
    this.elements.repairValidationMessage.className = 'validation-message';

    // Show success notification
    const systemName =
      systemType === 'lifeSupport'
        ? 'Life Support'
        : this.capitalizeFirst(systemType);
    this.showSuccess(`${systemName} repaired`);

    // Refresh the repair panel to show updated state
    this.updateRepairConditionDisplay();
    this.updateRepairButtons();
  }

  handleRepairAll() {
    const condition = this.gameStateManager.getShipCondition();
    if (!condition) {
      throw new Error(
        'Invalid game state: ship condition is null in handleRepairAll'
      );
    }

    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in handleRepairAll');
    }

    const totalCost = this.calculateRepairAllCost();

    // Pre-validate total cost before executing any repairs
    // This prevents partial repairs if player doesn't have enough credits for all systems
    if (state.player.credits < totalCost) {
      this.elements.repairValidationMessage.textContent =
        'Insufficient credits for full repair';
      this.elements.repairValidationMessage.className =
        'validation-message error';
      return;
    }

    let repairCount = 0;
    let failedRepairs = [];

    // Repair hull
    const hullAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.hull;
    if (hullAmount > 0) {
      const repairOutcome = this.gameStateManager.repairShipSystem(
        'hull',
        hullAmount
      );
      if (repairOutcome.success) {
        repairCount++;
      } else {
        failedRepairs.push(`Hull: ${repairOutcome.reason}`);
      }
    }

    // Repair engine
    const engineAmount = SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.engine;
    if (engineAmount > 0) {
      const repairOutcome = this.gameStateManager.repairShipSystem(
        'engine',
        engineAmount
      );
      if (repairOutcome.success) {
        repairCount++;
      } else {
        failedRepairs.push(`Engine: ${repairOutcome.reason}`);
      }
    }

    // Repair life support
    const lifeSupportAmount =
      SHIP_CONFIG.CONDITION_BOUNDS.MAX - condition.lifeSupport;
    if (lifeSupportAmount > 0) {
      const repairOutcome = this.gameStateManager.repairShipSystem(
        'lifeSupport',
        lifeSupportAmount
      );
      if (repairOutcome.success) {
        repairCount++;
      } else {
        failedRepairs.push(`Life Support: ${repairOutcome.reason}`);
      }
    }

    // Show results
    if (failedRepairs.length > 0) {
      this.elements.repairValidationMessage.textContent = `Some repairs failed: ${failedRepairs.join(', ')}`;
      this.elements.repairValidationMessage.className =
        'validation-message error';
    } else if (repairCount > 0) {
      this.elements.repairValidationMessage.textContent = '';
      this.elements.repairValidationMessage.className = 'validation-message';
      this.showSuccess(`All systems repaired to full`);
    } else {
      this.elements.repairValidationMessage.textContent =
        'All systems already at maximum condition';
      this.elements.repairValidationMessage.className =
        'validation-message info';
    }

    // Refresh the repair panel to show updated state
    this.updateRepairConditionDisplay();
    this.updateRepairButtons();
  }

  // ========================================================================
  // SHIP STATUS PANEL
  // ========================================================================

  /**
   * Show ship status panel displaying ship name, condition, cargo, and quirks
   *
   * Displays comprehensive ship information including:
   * - Ship name in header
   * - Fuel, hull, engine, life support condition bars
   * - Cargo capacity usage
   * - All assigned quirks with icons, names, descriptions, and flavor text
   *
   * Validates: Requirements 1.3 (Ship Personality Spec)
   */
  showShipStatus() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in showShipStatus');
    }

    this.renderShipStatus();
  }

  /**
   * Render ship status panel content
   *
   * Creates and displays the ship status interface showing ship name, condition,
   * cargo capacity, and all assigned quirks with their details.
   */
  renderShipStatus() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in renderShipStatus');
    }

    const ship = state.ship;
    const condition = this.gameStateManager.getShipCondition();
    const cargoUsed = this.gameStateManager.getCargoUsed();

    // Create ship status panel on first use
    if (!this.shipStatusPanel) {
      this.shipStatusPanel = document.createElement('div');
      this.shipStatusPanel.id = 'ship-status-panel';
      this.shipStatusPanel.className = 'ship-status-panel';
      document.body.appendChild(this.shipStatusPanel);
    }

    // Build panel content
    const content = [];

    // Close button
    content.push(
      '<button class="close-btn" id="ship-status-close-btn">×</button>'
    );

    // Ship name header
    content.push(`<h2>${ship.name}</h2>`);

    // Ship condition section
    content.push('<div class="ship-status-section">');
    content.push('<h3>Ship Condition</h3>');
    content.push('<div class="ship-status-conditions">');

    // Fuel bar
    content.push('<div class="ship-status-condition-item">');
    content.push('<div class="condition-header">');
    content.push('<span class="condition-label">Fuel:</span>');
    content.push(
      `<span class="condition-value">${Math.round(ship.fuel)}%</span>`
    );
    content.push('</div>');
    content.push('<div class="condition-bar-container fuel-bar-container">');
    content.push(
      `<div class="condition-bar fuel-bar" style="width: ${ship.fuel}%"></div>`
    );
    content.push('</div>');
    content.push('</div>');

    // Hull bar
    content.push('<div class="ship-status-condition-item">');
    content.push('<div class="condition-header">');
    content.push('<span class="condition-label">Hull:</span>');
    content.push(
      `<span class="condition-value">${Math.round(condition.hull)}%</span>`
    );
    content.push('</div>');
    content.push('<div class="condition-bar-container hull-bar-container">');
    content.push(
      `<div class="condition-bar hull-bar" style="width: ${condition.hull}%"></div>`
    );
    content.push('</div>');
    content.push('</div>');

    // Engine bar
    content.push('<div class="ship-status-condition-item">');
    content.push('<div class="condition-header">');
    content.push('<span class="condition-label">Engine:</span>');
    content.push(
      `<span class="condition-value">${Math.round(condition.engine)}%</span>`
    );
    content.push('</div>');
    content.push('<div class="condition-bar-container engine-bar-container">');
    content.push(
      `<div class="condition-bar engine-bar" style="width: ${condition.engine}%"></div>`
    );
    content.push('</div>');
    content.push('</div>');

    // Life Support bar
    content.push('<div class="ship-status-condition-item">');
    content.push('<div class="condition-header">');
    content.push('<span class="condition-label">Life Support:</span>');
    content.push(
      `<span class="condition-value">${Math.round(condition.lifeSupport)}%</span>`
    );
    content.push('</div>');
    content.push(
      '<div class="condition-bar-container life-support-bar-container">'
    );
    content.push(
      `<div class="condition-bar life-support-bar" style="width: ${condition.lifeSupport}%"></div>`
    );
    content.push('</div>');
    content.push('</div>');

    // Cargo capacity
    content.push('<div class="ship-status-info-row">');
    content.push('<span class="info-label">Cargo:</span>');
    content.push(
      `<span class="info-value">${cargoUsed}/${ship.cargoCapacity} units</span>`
    );
    content.push('</div>');

    content.push('</div>'); // End ship-status-conditions
    content.push('</div>'); // End ship-status-section

    // Ship quirks section
    content.push('<div class="ship-status-section">');
    content.push('<h3>SHIP QUIRKS</h3>');

    if (ship.quirks && ship.quirks.length > 0) {
      content.push('<div class="ship-quirks-list">');

      ship.quirks.forEach((quirkId) => {
        const quirk = this.gameStateManager.getQuirkDefinition(quirkId);
        if (!quirk) return;

        content.push('<div class="quirk-item">');
        content.push('<div class="quirk-header">');
        content.push('<span class="quirk-icon">⚙</span>');
        content.push(`<span class="quirk-name">${quirk.name}</span>`);
        content.push('</div>');
        content.push(
          `<div class="quirk-description">${quirk.description}</div>`
        );
        content.push(`<div class="quirk-flavor">"${quirk.flavor}"</div>`);
        content.push('</div>');
      });

      content.push('</div>'); // End ship-quirks-list
    } else {
      content.push('<div class="ship-quirks-empty">No quirks assigned</div>');
    }

    content.push('</div>'); // End ship-status-section

    // Back button
    content.push('<div class="ship-status-actions">');
    content.push(
      '<button class="station-btn secondary" id="ship-status-back-btn">Back</button>'
    );
    content.push('</div>');

    // Set panel content
    this.shipStatusPanel.innerHTML = content.join('');

    // Show panel
    this.shipStatusPanel.classList.add('visible');

    // Event handlers are set up once via event delegation in setupShipStatusHandlers
    // No need to add listeners here - prevents memory leaks from repeated calls
  }

  /**
   * Hide ship status panel
   */
  hideShipStatus() {
    if (this.shipStatusPanel) {
      this.shipStatusPanel.classList.remove('visible');
    }
  }

  /**
   * Check if ship status panel is visible
   * @returns {boolean} True if panel is visible
   */
  isShipStatusVisible() {
    return (
      this.shipStatusPanel && this.shipStatusPanel.classList.contains('visible')
    );
  }

  // ========================================================================
  // UPGRADES INTERFACE
  // ========================================================================

  /**
   * Show upgrades interface panel
   *
   * Displays all available and installed ship upgrades with costs, effects,
   * and tradeoffs. Validates affordability and prevents duplicate purchases.
   *
   * Feature: ship-personality
   * Validates: Requirements 2.1, 2.2, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
   */
  showUpgradesInterface() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in showUpgradesInterface'
      );
    }

    // Update credit balance display
    this.elements.upgradesCreditsValue.textContent =
      state.player.credits.toLocaleString();

    // Render available and installed upgrades
    this.renderAvailableUpgrades();
    this.renderInstalledUpgrades();

    this.hideStationInterface();
    this.elements.upgradesPanel.classList.add('visible');
  }

  /**
   * Hide upgrades interface panel
   */
  hideUpgradesInterface() {
    this.elements.upgradesPanel.classList.remove('visible');
  }

  /**
   * Check if upgrades interface is visible
   * @returns {boolean} True if panel is visible
   */
  isUpgradesVisible() {
    return this.elements.upgradesPanel.classList.contains('visible');
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

    for (const [attr, value] of Object.entries(effects)) {
      if (attr === 'fuelCapacity') {
        formatted.push(`Fuel capacity: ${value}%`);
      } else if (attr === 'cargoCapacity') {
        formatted.push(`Cargo capacity: ${value} units`);
      } else if (attr === 'hiddenCargoCapacity') {
        formatted.push(`Hidden cargo: ${value} units`);
      } else if (attr === 'fuelConsumption') {
        const percent = Math.round((1 - value) * 100);
        if (percent > 0) {
          formatted.push(`Fuel consumption: -${percent}%`);
        } else if (percent < 0) {
          formatted.push(`Fuel consumption: +${Math.abs(percent)}%`);
        }
      } else if (attr === 'hullDegradation') {
        const percent = Math.round((1 - value) * 100);
        if (percent > 0) {
          formatted.push(`Hull degradation: -${percent}%`);
        } else if (percent < 0) {
          formatted.push(`Hull degradation: +${Math.abs(percent)}%`);
        }
      } else if (attr === 'lifeSupportDrain') {
        const percent = Math.round((1 - value) * 100);
        if (percent > 0) {
          formatted.push(`Life support drain: -${percent}%`);
        } else if (percent < 0) {
          formatted.push(`Life support drain: +${Math.abs(percent)}%`);
        }
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
   * Feature: ship-personality
   * Validates: Requirements 2.3, 9.1, 9.2, 9.3
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
   *
   * Feature: ship-personality
   * Validates: Requirements 2.4, 9.4, 9.5
   */
  handleUpgradeConfirm() {
    if (!this.pendingUpgradeId) return;

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
      this.showError(`Upgrade purchase failed: ${purchaseOutcome.reason}`);
      this.hideUpgradeConfirmation();
      return;
    }

    // Show success notification
    this.showSuccess(`${upgrade.name} installed`);

    // Hide confirmation dialog
    this.hideUpgradeConfirmation();

    // Refresh upgrades interface
    this.showUpgradesInterface();
  }

  // ========================================================================
  // CARGO MANIFEST PANEL
  // ========================================================================

  /**
   * Show cargo manifest panel
   *
   * Displays detailed cargo information including:
   * - Ship name in header
   * - Capacity usage (X/Y units)
   * - Each cargo: name, quantity, purchase location, purchase price, days ago, current value
   * - Total cargo value at bottom
   *
   * Feature: ship-personality
   * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
   */
  showCargoManifest() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in showCargoManifest');
    }

    this.hideStationInterface();
    this.renderCargoManifest();
  }

  /**
   * Render cargo manifest panel content
   *
   * Creates and displays the cargo manifest interface showing ship name,
   * capacity usage, all cargo with purchase details, and total value.
   */
  renderCargoManifest() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in renderCargoManifest'
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

    // Show panel
    this.elements.cargoManifestPanel.classList.add('visible');
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
    name.textContent = this.capitalizeFirst(cargoEntry.good);

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

  /**
   * Hide cargo manifest panel
   */
  hideCargoManifest() {
    this.elements.cargoManifestPanel.classList.remove('visible');
  }

  /**
   * Check if cargo manifest panel is visible
   * @returns {boolean} True if panel is visible
   */
  isCargoManifestVisible() {
    return this.elements.cargoManifestPanel.classList.contains('visible');
  }
}
