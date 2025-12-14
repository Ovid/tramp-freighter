'use strict';

import {
  calculateDistanceFromSol,
  NOTIFICATION_CONFIG,
  DEV_MODE,
} from '../game-constants.js';
import { TradePanelController } from '../controllers/trade.js';
import { RefuelPanelController } from '../controllers/refuel.js';
import { RepairPanelController } from '../controllers/repair.js';
import { UpgradePanelController } from '../controllers/upgrades.js';
import { InfoBrokerPanelController } from '../controllers/info-broker.js';
import { CargoManifestPanelController } from '../controllers/cargo-manifest.js';
import { DevAdminPanelController } from '../controllers/dev-admin.js';
import { capitalizeFirst } from '../utils/string-utils.js';
import {
  showEventModal,
  hideEventModal,
  setupEventModalHandlers,
} from './modal-manager.js';
import {
  updateHUD as updateHUDDisplay,
  updateCredits as updateCreditsDisplay,
  updateDebt as updateDebtDisplay,
  updateDays as updateDaysDisplay,
  updateShipName as updateShipNameDisplay,
  updateFuel as updateFuelDisplay,
  updateShipCondition as updateShipConditionDisplay,
  updateCargo as updateCargoDisplay,
  updateLocation as updateLocationDisplay,
  updateConditionDisplay,
} from './hud-manager.js';
import {
  createNotificationSystem,
  showNotification as showNotificationMessage,
  showError as showErrorMessage,
  showSuccess as showSuccessMessage,
  clearNotifications as clearNotificationMessages,
} from './notification-manager.js';

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

    // Cache DOM elements for performance
    this.elements = {
      gameHud: document.getElementById('game-hud'),
      credits: document.getElementById('hud-credits'),
      debt: document.getElementById('hud-debt'),
      days: document.getElementById('hud-days'),
      shipName: document.getElementById('hud-ship-name'),
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
      devAdminBtn: document.getElementById('dev-admin-btn'),
      devAdminPanel: document.getElementById('dev-admin-panel'),
      devAdminCloseBtn: document.getElementById('dev-admin-close-btn'),
      devCreditsInput: document.getElementById('dev-credits-input'),
      devSetCreditsBtn: document.getElementById('dev-set-credits-btn'),
      devDebtInput: document.getElementById('dev-debt-input'),
      devSetDebtBtn: document.getElementById('dev-set-debt-btn'),
      devFuelInput: document.getElementById('dev-fuel-input'),
      devSetFuelBtn: document.getElementById('dev-set-fuel-btn'),
      devRepairAllBtn: document.getElementById('dev-repair-all-btn'),
      devClearCargoBtn: document.getElementById('dev-clear-cargo-btn'),
    };

    // Cache repair buttons to avoid repeated DOM queries
    this.cachedRepairButtons = null;
    // Cache refuel preset buttons for consistency
    this.cachedRefuelPresetButtons = null;
    // Cache ship status panel (created on first use)
    this.shipStatusPanel = null;

    // Initialize notification system
    this.notificationSystem = createNotificationSystem(
      this.elements.notificationArea
    );

    // Initialize panel controllers
    const isTestEnvironment =
      typeof process !== 'undefined' &&
      process.env &&
      process.env.NODE_ENV === 'test';

    this.tradePanelController = this.initializeController(
      TradePanelController,
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
        hiddenCargoContent: this.elements.hiddenCargoContent,
        toggleHiddenCargoBtn: this.elements.toggleHiddenCargoBtn,
      },
      'TradePanelController',
      isTestEnvironment
    );

    this.refuelPanelController = this.initializeController(
      RefuelPanelController,
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
      'RefuelPanelController',
      isTestEnvironment
    );

    this.subscribeToStateChanges();
    this.setupStationInterfaceHandlers();
    this.setupShipStatusHandlers();
    this.setupEventModalHandlers();
    this.setupQuickAccessHandlers();

    // Initialize remaining controllers after setup handlers cache buttons
    this.repairPanelController = this.initializeController(
      RepairPanelController,
      {
        repairPanel: this.elements.repairPanel,
        repairSystemName: this.elements.repairSystemName,
        repairHullPercent: this.elements.repairHullPercent,
        repairHullBar: this.elements.repairHullBar,
        repairEnginePercent: this.elements.repairEnginePercent,
        repairEngineBar: this.elements.repairEngineBar,
        repairLifeSupportPercent: this.elements.repairLifeSupportPercent,
        repairLifeSupportBar: this.elements.repairLifeSupportBar,
        repairAllBtn: this.elements.repairAllBtn,
        repairValidationMessage: this.elements.repairValidationMessage,
        cachedRepairButtons: this.cachedRepairButtons,
      },
      'RepairPanelController',
      isTestEnvironment
    );

    this.upgradePanelController = this.initializeController(
      UpgradePanelController,
      {
        upgradesPanel: this.elements.upgradesPanel,
        upgradesCreditsValue: this.elements.upgradesCreditsValue,
        availableUpgradesList: this.elements.availableUpgradesList,
        installedUpgradesList: this.elements.installedUpgradesList,
        upgradeConfirmationOverlay: this.elements.upgradeConfirmationOverlay,
        upgradeConfirmationTitle: this.elements.upgradeConfirmationTitle,
        upgradeConfirmationEffects: this.elements.upgradeConfirmationEffects,
        upgradeCurrentCredits: this.elements.upgradeCurrentCredits,
        upgradeCost: this.elements.upgradeCost,
        upgradeCreditsAfter: this.elements.upgradeCreditsAfter,
        upgradeConfirmBtn: this.elements.upgradeConfirmBtn,
      },
      'UpgradePanelController',
      isTestEnvironment
    );

    this.infoBrokerPanelController = this.initializeControllerWithBroker(
      InfoBrokerPanelController,
      {
        infoBrokerPanel: this.elements.infoBrokerPanel,
        infoBrokerSystemName: this.elements.infoBrokerSystemName,
        buyRumorBtn: this.elements.buyRumorBtn,
        rumorText: this.elements.rumorText,
        intelligenceList: this.elements.intelligenceList,
        infoBrokerValidationMessage: this.elements.infoBrokerValidationMessage,
        purchaseTab: this.elements.purchaseTab,
        marketDataTab: this.elements.marketDataTab,
        purchaseIntelContent: this.elements.purchaseIntelContent,
        marketDataContent: this.elements.marketDataContent,
        marketDataList: this.elements.marketDataList,
      },
      'InfoBrokerPanelController',
      isTestEnvironment
    );

    this.cargoManifestPanelController = this.initializeController(
      CargoManifestPanelController,
      {
        cargoManifestPanel: this.elements.cargoManifestPanel,
        cargoManifestShipName: this.elements.cargoManifestShipName,
        cargoManifestUsed: this.elements.cargoManifestUsed,
        cargoManifestCapacity: this.elements.cargoManifestCapacity,
        cargoManifestList: this.elements.cargoManifestList,
        cargoManifestTotalValue: this.elements.cargoManifestTotalValue,
      },
      'CargoManifestPanelController',
      isTestEnvironment
    );

    // Initialize dev admin panel if in dev mode
    if (DEV_MODE) {
      this.devAdminPanelController = this.initializeController(
        DevAdminPanelController,
        {
          devAdminPanel: this.elements.devAdminPanel,
          devAdminCloseBtn: this.elements.devAdminCloseBtn,
          devCreditsInput: this.elements.devCreditsInput,
          devSetCreditsBtn: this.elements.devSetCreditsBtn,
          devDebtInput: this.elements.devDebtInput,
          devSetDebtBtn: this.elements.devSetDebtBtn,
          devFuelInput: this.elements.devFuelInput,
          devSetFuelBtn: this.elements.devSetFuelBtn,
          devRepairAllBtn: this.elements.devRepairAllBtn,
          devClearCargoBtn: this.elements.devClearCargoBtn,
        },
        'DevAdminPanelController',
        isTestEnvironment
      );

      // Show dev admin button
      if (this.elements.devAdminBtn) {
        this.elements.devAdminBtn.style.display = 'flex';
        this.elements.devAdminBtn.addEventListener('click', () => {
          this.showDevAdminPanel();
        });
      }
    }
  }

  /**
   * Initialize a panel controller with environment-appropriate error handling
   *
   * In test environments, returns null on failure to allow partial DOM testing.
   * In production, throws errors to fail fast on missing DOM elements.
   *
   * @param {Function} ControllerClass - Controller constructor
   * @param {Object} elements - DOM elements for controller
   * @param {string} controllerName - Name for error messages
   * @param {boolean} isTestEnvironment - Whether running in test mode
   * @returns {Object|null} Controller instance or null on test failure
   */
  initializeController(
    ControllerClass,
    elements,
    controllerName,
    isTestEnvironment
  ) {
    try {
      return new ControllerClass(
        elements,
        this.gameStateManager,
        this.starData
      );
    } catch (error) {
      if (isTestEnvironment) {
        return null;
      }
      throw new Error(
        `Failed to initialize ${controllerName}: ${error.message}`
      );
    }
  }

  /**
   * Initialize InfoBrokerPanelController with additional informationBroker dependency
   *
   * InfoBrokerPanelController requires an extra parameter beyond the standard pattern.
   *
   * @param {Function} ControllerClass - Controller constructor
   * @param {Object} elements - DOM elements for controller
   * @param {string} controllerName - Name for error messages
   * @param {boolean} isTestEnvironment - Whether running in test mode
   * @returns {Object|null} Controller instance or null on test failure
   */
  initializeControllerWithBroker(
    ControllerClass,
    elements,
    controllerName,
    isTestEnvironment
  ) {
    try {
      return new ControllerClass(
        elements,
        this.gameStateManager,
        this.starData,
        this.gameStateManager.informationBroker
      );
    } catch (error) {
      if (isTestEnvironment) {
        return null;
      }
      throw new Error(
        `Failed to initialize ${controllerName}: ${error.message}`
      );
    }
  }

  /**
   * Validate that a controller is initialized
   *
   * Centralized validation to avoid repetitive null checks across delegation methods.
   * Controllers may be null in test environments with incomplete DOM.
   *
   * @param {Object} controller - Controller instance to validate
   * @param {string} controllerName - Name of controller for error message
   * @throws {Error} If controller is not initialized
   */
  validateController(controller, controllerName) {
    if (!controller) {
      throw new Error(
        `${controllerName} not initialized - required DOM elements may be missing`
      );
    }
  }

  subscribeToStateChanges() {
    this.gameStateManager.subscribe('creditsChanged', (credits) => {
      updateCreditsDisplay(this.elements.credits, credits);
    });

    this.gameStateManager.subscribe('debtChanged', (debt) => {
      updateDebtDisplay(this.elements.debt, debt);
    });

    this.gameStateManager.subscribe('timeChanged', (days) => {
      updateDaysDisplay(this.elements.days, days);
    });

    this.gameStateManager.subscribe('fuelChanged', (fuel) => {
      updateFuelDisplay(
        { fuelBar: this.elements.fuelBar, fuelText: this.elements.fuelText },
        fuel
      );
    });

    this.gameStateManager.subscribe('cargoChanged', () => {
      const cargoUsed = this.gameStateManager.getCargoUsed();
      const ship = this.gameStateManager.getShip();
      updateCargoDisplay(this.elements.cargo, cargoUsed, ship);
    });

    this.gameStateManager.subscribe('locationChanged', (systemId) => {
      updateLocationDisplay(
        { system: this.elements.system, distance: this.elements.distance },
        systemId,
        this.starData
      );
      // Update quick access button states
      this.updateQuickAccessButtons();
    });

    this.gameStateManager.subscribe('conditionWarning', (warning) => {
      this.showConditionWarning(warning);
    });

    this.gameStateManager.subscribe('shipConditionChanged', (condition) => {
      updateShipConditionDisplay(
        {
          hullBar: this.elements.hullBar,
          hullText: this.elements.hullText,
          engineBar: this.elements.engineBar,
          engineText: this.elements.engineText,
          lifeSupportBar: this.elements.lifeSupportBar,
          lifeSupportText: this.elements.lifeSupportText,
        },
        condition
      );
    });

    this.gameStateManager.subscribe('shipNameChanged', (shipName) => {
      updateShipNameDisplay(this.elements.shipName, shipName);
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

    updateHUDDisplay(
      this.elements,
      state,
      this.starData,
      () => this.gameStateManager.getShipCondition(),
      () => this.gameStateManager.getCargoUsed()
    );
    this.updateQuickAccessButtons();
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
    updateConditionDisplay(this.elements, prefix, systemType, conditionValue);
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
        if (this.infoBrokerPanelController) {
          this.infoBrokerPanelController.handleBuyRumor();
        }
      });
    }

    if (this.elements.purchaseTab) {
      this.elements.purchaseTab.addEventListener('click', () => {
        if (this.infoBrokerPanelController) {
          this.infoBrokerPanelController.switchTab('purchase');
        }
      });
    }

    if (this.elements.marketDataTab) {
      this.elements.marketDataTab.addEventListener('click', () => {
        if (this.infoBrokerPanelController) {
          this.infoBrokerPanelController.switchTab('marketData');
        }
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
        if (this.upgradePanelController) {
          this.upgradePanelController.hideUpgradeConfirmation();
        }
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
        if (this.tradePanelController) {
          this.tradePanelController.toggleHiddenCargoView();
        }
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
    setupEventModalHandlers(this.elements, () => {
      this.hideEventNotification();
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

    // Delegate to modal manager
    showEventModal(this.elements, event, eventType, currentDay);
  }

  /**
   * Hide event notification modal
   */
  hideEventNotification() {
    hideEventModal(this.elements);
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
    this.validateController(this.tradePanelController, 'TradePanelController');

    try {
      this.tradePanelController.show();
    } catch (error) {
      this.showError(error.message);
    }
  }

  hideTradePanel() {
    this.validateController(this.tradePanelController, 'TradePanelController');
    this.tradePanelController.hide();
  }

  updateTradeCargoCapacity() {
    this.validateController(this.tradePanelController, 'TradePanelController');
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
    this.validateController(this.tradePanelController, 'TradePanelController');
    this.tradePanelController.renderMarketGoods(system);
  }

  createGoodItem(goodType, price) {
    this.validateController(this.tradePanelController, 'TradePanelController');
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
    this.validateController(this.tradePanelController, 'TradePanelController');
    this.tradePanelController.renderCargoStacks(system);
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
    showNotificationMessage(this.notificationSystem, message, duration, type);
  }

  /**
   * Show an error notification (convenience method)
   */
  showError(message, duration = NOTIFICATION_CONFIG.DEFAULT_ERROR_DURATION) {
    showErrorMessage(this.notificationSystem, message, duration);
  }

  /**
   * Show a success notification (convenience method)
   */
  showSuccess(
    message,
    duration = NOTIFICATION_CONFIG.DEFAULT_SUCCESS_DURATION
  ) {
    showSuccessMessage(this.notificationSystem, message, duration);
  }

  /**
   * Clear all notifications immediately
   */
  clearNotifications() {
    clearNotificationMessages(this.notificationSystem);
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
        : capitalizeFirst(warning.system);

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
    this.validateController(
      this.refuelPanelController,
      'RefuelPanelController'
    );

    try {
      this.refuelPanelController.show();
    } catch (error) {
      this.showError(error.message);
    }
  }

  hideRefuelPanel() {
    this.validateController(
      this.refuelPanelController,
      'RefuelPanelController'
    );
    this.refuelPanelController.hide();
  }

  updateRefuelCost() {
    this.validateController(
      this.refuelPanelController,
      'RefuelPanelController'
    );
    this.refuelPanelController.updateRefuelCost();
  }

  setRefuelAmountToMax() {
    this.validateController(
      this.refuelPanelController,
      'RefuelPanelController'
    );
    this.refuelPanelController.handleRefuelMax();
  }

  showInfoBrokerPanel() {
    this.hideStationInterface();
    this.validateController(
      this.infoBrokerPanelController,
      'InfoBrokerPanelController'
    );

    try {
      this.infoBrokerPanelController.show();
    } catch (error) {
      this.showError(error.message);
    }
  }

  hideInfoBrokerPanel() {
    this.validateController(
      this.infoBrokerPanelController,
      'InfoBrokerPanelController'
    );
    this.infoBrokerPanelController.hide();
  }

  handlePurchaseIntelligence(systemId) {
    this.validateController(
      this.infoBrokerPanelController,
      'InfoBrokerPanelController'
    );

    const intelligenceOutcome =
      this.infoBrokerPanelController.handlePurchaseIntelligence(systemId);

    // Show success notification if purchase succeeded
    if (intelligenceOutcome && intelligenceOutcome.success) {
      const system = this.starData.find((s) => s.id === systemId);
      if (system) {
        this.showSuccess(`Intelligence purchased for ${system.name}`);
      }
    }
  }

  // Delegation method for backward compatibility with tests
  // In test environments, controller may be null if DOM is incomplete
  renderMarketData() {
    if (this.infoBrokerPanelController) {
      this.infoBrokerPanelController.renderMarketData();
    }
  }

  // Removed: createMarketDataItem - now handled by InfoBrokerPanelController

  // ========================================================================
  // REPAIR PANEL
  // ========================================================================

  showRepairPanel() {
    this.hideStationInterface();
    this.validateController(
      this.repairPanelController,
      'RepairPanelController'
    );

    try {
      this.repairPanelController.show();
    } catch (error) {
      this.showError(error.message);
    }
  }

  hideRepairPanel() {
    this.validateController(
      this.repairPanelController,
      'RepairPanelController'
    );
    this.repairPanelController.hide();
  }

  isRepairVisible() {
    return this.elements.repairPanel.classList.contains('visible');
  }

  handleRepair(systemType, amountStr) {
    this.validateController(
      this.repairPanelController,
      'RepairPanelController'
    );

    const result = this.repairPanelController.handleRepairSystem(
      systemType,
      amountStr
    );

    if (result.success) {
      this.showSuccess(`${result.systemName} repaired`);
    }
  }

  handleRepairAll() {
    this.validateController(
      this.repairPanelController,
      'RepairPanelController'
    );

    const result = this.repairPanelController.handleRepairAll();

    if (result.success && result.repairCount > 0) {
      this.showSuccess(`All systems repaired to full`);
    }
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

    // Build panel content using template literals for readability
    this.shipStatusPanel.innerHTML = `
      <button class="close-btn" id="ship-status-close-btn">×</button>
      <h2>${ship.name}</h2>
      ${this.renderShipConditionSection(ship, condition, cargoUsed)}
      ${this.renderShipQuirksSection(ship)}
      <div class="ship-status-actions">
        <button class="station-btn secondary" id="ship-status-back-btn">Back</button>
      </div>
    `;

    // Show panel
    this.shipStatusPanel.classList.add('visible');

    // Event handlers are set up once via event delegation in setupShipStatusHandlers
    // No need to add listeners here - prevents memory leaks from repeated calls
  }

  /**
   * Render ship condition section with fuel, hull, engine, life support bars
   *
   * @param {Object} ship - Ship state with fuel
   * @param {Object} condition - Ship condition with hull, engine, lifeSupport
   * @param {number} cargoUsed - Current cargo usage
   * @returns {string} HTML string for condition section
   */
  renderShipConditionSection(ship, condition, cargoUsed) {
    return `
      <div class="ship-status-section">
        <h3>Ship Condition</h3>
        <div class="ship-status-conditions">
          ${this.renderConditionBar('Fuel', ship.fuel, 'fuel')}
          ${this.renderConditionBar('Hull', condition.hull, 'hull')}
          ${this.renderConditionBar('Engine', condition.engine, 'engine')}
          ${this.renderConditionBar('Life Support', condition.lifeSupport, 'life-support')}
          <div class="ship-status-info-row">
            <span class="info-label">Cargo:</span>
            <span class="info-value">${cargoUsed}/${ship.cargoCapacity} units</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render a single condition bar
   *
   * @param {string} label - Display label (e.g., 'Fuel', 'Hull')
   * @param {number} value - Condition percentage (0-100)
   * @param {string} cssClass - CSS class for styling (e.g., 'fuel', 'hull')
   * @returns {string} HTML string for condition bar
   */
  renderConditionBar(label, value, cssClass) {
    return `
      <div class="ship-status-condition-item">
        <div class="condition-header">
          <span class="condition-label">${label}:</span>
          <span class="condition-value">${Math.round(value)}%</span>
        </div>
        <div class="condition-bar-container ${cssClass}-bar-container">
          <div class="condition-bar ${cssClass}-bar" style="width: ${value}%"></div>
        </div>
      </div>
    `;
  }

  /**
   * Render ship quirks section
   *
   * @param {Object} ship - Ship state with quirks array
   * @returns {string} HTML string for quirks section
   */
  renderShipQuirksSection(ship) {
    const quirksContent =
      ship.quirks && ship.quirks.length > 0
        ? `<div class="ship-quirks-list">
            ${ship.quirks
              .map((quirkId) => {
                const quirk = this.gameStateManager.getQuirkDefinition(quirkId);
                return quirk ? this.renderQuirkItem(quirk) : '';
              })
              .join('')}
          </div>`
        : '<div class="ship-quirks-empty">No quirks assigned</div>';

    return `
      <div class="ship-status-section">
        <h3>SHIP QUIRKS</h3>
        ${quirksContent}
      </div>
    `;
  }

  /**
   * Render a single quirk item
   *
   * @param {Object} quirk - Quirk definition with name, description, flavor
   * @returns {string} HTML string for quirk item
   */
  renderQuirkItem(quirk) {
    return `
      <div class="quirk-item">
        <div class="quirk-header">
          <span class="quirk-icon">⚙</span>
          <span class="quirk-name">${quirk.name}</span>
        </div>
        <div class="quirk-description">${quirk.description}</div>
        <div class="quirk-flavor">"${quirk.flavor}"</div>
      </div>
    `;
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
   * Delegates to UpgradePanelController to display available and installed
   * ship upgrades with costs, effects, and tradeoffs.
   *
   * Architecture: architecture-refactor
   * Validates: Requirements 1.4, 1.5
   */
  showUpgradesInterface() {
    this.hideStationInterface();
    this.validateController(
      this.upgradePanelController,
      'UpgradePanelController'
    );

    try {
      this.upgradePanelController.show();
    } catch (error) {
      this.showError(error.message);
    }
  }

  /**
   * Hide upgrades interface panel
   *
   * Delegates to UpgradePanelController.
   *
   * Architecture: architecture-refactor
   * Validates: Requirements 1.4, 1.5
   */
  hideUpgradesInterface() {
    this.validateController(
      this.upgradePanelController,
      'UpgradePanelController'
    );
    this.upgradePanelController.hide();
  }

  /**
   * Check if upgrades interface is visible
   * @returns {boolean} True if panel is visible
   */
  isUpgradesVisible() {
    return this.elements.upgradesPanel.classList.contains('visible');
  }

  /**
   * Handle upgrade purchase confirmation
   *
   * Delegates to UpgradePanelController to execute the purchase and handle
   * success/error notifications.
   *
   * Architecture: architecture-refactor
   * Validates: Requirements 1.4, 1.5
   */
  handleUpgradeConfirm() {
    this.validateController(
      this.upgradePanelController,
      'UpgradePanelController'
    );

    const purchaseOutcome = this.upgradePanelController.handlePurchaseUpgrade();

    if (!purchaseOutcome.success) {
      this.showError(`Upgrade purchase failed: ${purchaseOutcome.reason}`);
      return;
    }

    // Show success notification
    this.showSuccess(`${purchaseOutcome.upgradeName} installed`);
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
   * Delegates to CargoManifestPanelController for panel display logic.
   *
   * Architecture: architecture-refactor
   * Feature: ship-personality
   * Validates: Requirements 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5
   */
  showCargoManifest() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in showCargoManifest');
    }

    this.hideStationInterface();

    if (this.cargoManifestPanelController) {
      this.cargoManifestPanelController.show();
    }
  }

  /**
   * Hide cargo manifest panel
   *
   * Delegates to CargoManifestPanelController for panel hiding.
   *
   * Architecture: architecture-refactor
   * Validates: Requirements 1.4, 1.5
   */
  hideCargoManifest() {
    if (this.cargoManifestPanelController) {
      this.cargoManifestPanelController.hide();
    }
  }

  /**
   * Check if cargo manifest panel is visible
   * @returns {boolean} True if panel is visible
   */
  isCargoManifestVisible() {
    return this.elements.cargoManifestPanel.classList.contains('visible');
  }

  // ========================================================================
  // DEV ADMIN PANEL
  // ========================================================================

  /**
   * Show dev admin panel (dev mode only)
   *
   * Provides controls to modify game state for testing purposes.
   * Only available when running on localhost.
   */
  showDevAdminPanel() {
    if (!DEV_MODE || !this.devAdminPanelController) {
      return;
    }

    this.devAdminPanelController.show();
  }

  /**
   * Hide dev admin panel
   */
  hideDevAdminPanel() {
    if (this.devAdminPanelController) {
      this.devAdminPanelController.hide();
    }
  }

  /**
   * Check if dev admin panel is visible
   * @returns {boolean} True if panel is visible
   */
  isDevAdminVisible() {
    return (
      DEV_MODE &&
      this.elements.devAdminPanel &&
      this.elements.devAdminPanel.classList.contains('visible')
    );
  }
}
