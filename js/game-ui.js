'use strict';

import {
  calculateDistanceFromSol,
  NOTIFICATION_CONFIG,
  COMMODITY_TYPES,
} from './game-constants.js';
import { TradingSystem } from './game-trading.js';
import { TradePanelController } from './controllers/trade-panel-controller.js';
import { RefuelPanelController } from './controllers/refuel-panel-controller.js';
import { RepairPanelController } from './controllers/repair-panel-controller.js';
import { UpgradePanelController } from './controllers/upgrade-panel-controller.js';
import { InfoBrokerPanelController } from './controllers/info-broker-panel-controller.js';
import { CargoManifestPanelController } from './controllers/cargo-manifest-panel-controller.js';
import { capitalizeFirst } from './utils/string-utils.js';

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
    // Controllers require DOM elements - in test environments without full DOM,
    // gracefully set to null. In production, missing elements will throw errors.
    const isTestEnvironment =
      typeof process !== 'undefined' &&
      process.env &&
      process.env.NODE_ENV === 'test';

    if (isTestEnvironment) {
      // Test environment - allow graceful degradation
      try {
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
      } catch (error) {
        this.tradePanelController = null;
      }

      try {
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
      } catch (error) {
        this.refuelPanelController = null;
      }
    } else {
      // Production environment - fail loudly if DOM elements missing
      try {
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
      } catch (error) {
        throw new Error(
          `Failed to initialize TradePanelController: ${error.message}`
        );
      }

      try {
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
      } catch (error) {
        throw new Error(
          `Failed to initialize RefuelPanelController: ${error.message}`
        );
      }
    }

    // Repair controller will be initialized after buttons are cached
    this.repairPanelController = null;
    // Upgrade controller will be initialized after setup
    this.upgradePanelController = null;
    // Info broker controller will be initialized after setup
    this.infoBrokerPanelController = null;
    // Cargo manifest controller will be initialized after setup
    this.cargoManifestPanelController = null;

    this.subscribeToStateChanges();
    this.setupStationInterfaceHandlers();
    this.setupShipStatusHandlers();
    this.setupEventModalHandlers();
    this.setupQuickAccessHandlers();

    // Initialize repair controller after buttons are cached
    if (isTestEnvironment) {
      try {
        this.repairPanelController = new RepairPanelController(
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
          this.gameStateManager,
          this.starData
        );
      } catch (error) {
        this.repairPanelController = null;
      }

      try {
        this.upgradePanelController = new UpgradePanelController(
          {
            upgradesPanel: this.elements.upgradesPanel,
            upgradesCreditsValue: this.elements.upgradesCreditsValue,
            availableUpgradesList: this.elements.availableUpgradesList,
            installedUpgradesList: this.elements.installedUpgradesList,
            upgradeConfirmationOverlay:
              this.elements.upgradeConfirmationOverlay,
            upgradeConfirmationTitle: this.elements.upgradeConfirmationTitle,
            upgradeConfirmationEffects:
              this.elements.upgradeConfirmationEffects,
            upgradeCurrentCredits: this.elements.upgradeCurrentCredits,
            upgradeCost: this.elements.upgradeCost,
            upgradeCreditsAfter: this.elements.upgradeCreditsAfter,
            upgradeConfirmBtn: this.elements.upgradeConfirmBtn,
          },
          this.gameStateManager,
          this.starData
        );
      } catch (error) {
        this.upgradePanelController = null;
      }

      try {
        this.infoBrokerPanelController = new InfoBrokerPanelController(
          {
            infoBrokerPanel: this.elements.infoBrokerPanel,
            infoBrokerSystemName: this.elements.infoBrokerSystemName,
            buyRumorBtn: this.elements.buyRumorBtn,
            rumorText: this.elements.rumorText,
            intelligenceList: this.elements.intelligenceList,
            infoBrokerValidationMessage:
              this.elements.infoBrokerValidationMessage,
            purchaseTab: this.elements.purchaseTab,
            marketDataTab: this.elements.marketDataTab,
            purchaseIntelContent: this.elements.purchaseIntelContent,
            marketDataContent: this.elements.marketDataContent,
            marketDataList: this.elements.marketDataList,
          },
          this.gameStateManager,
          this.starData,
          this.gameStateManager.informationBroker
        );
      } catch (error) {
        this.infoBrokerPanelController = null;
      }

      try {
        this.cargoManifestPanelController = new CargoManifestPanelController(
          {
            cargoManifestPanel: this.elements.cargoManifestPanel,
            cargoManifestShipName: this.elements.cargoManifestShipName,
            cargoManifestUsed: this.elements.cargoManifestUsed,
            cargoManifestCapacity: this.elements.cargoManifestCapacity,
            cargoManifestList: this.elements.cargoManifestList,
            cargoManifestTotalValue: this.elements.cargoManifestTotalValue,
          },
          this.gameStateManager,
          this.starData
        );
      } catch (error) {
        this.cargoManifestPanelController = null;
      }
    } else {
      // Production environment - fail loudly
      try {
        this.repairPanelController = new RepairPanelController(
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
          this.gameStateManager,
          this.starData
        );
      } catch (error) {
        throw new Error(
          `Failed to initialize RepairPanelController: ${error.message}`
        );
      }

      try {
        this.upgradePanelController = new UpgradePanelController(
          {
            upgradesPanel: this.elements.upgradesPanel,
            upgradesCreditsValue: this.elements.upgradesCreditsValue,
            availableUpgradesList: this.elements.availableUpgradesList,
            installedUpgradesList: this.elements.installedUpgradesList,
            upgradeConfirmationOverlay:
              this.elements.upgradeConfirmationOverlay,
            upgradeConfirmationTitle: this.elements.upgradeConfirmationTitle,
            upgradeConfirmationEffects:
              this.elements.upgradeConfirmationEffects,
            upgradeCurrentCredits: this.elements.upgradeCurrentCredits,
            upgradeCost: this.elements.upgradeCost,
            upgradeCreditsAfter: this.elements.upgradeCreditsAfter,
            upgradeConfirmBtn: this.elements.upgradeConfirmBtn,
          },
          this.gameStateManager,
          this.starData
        );
      } catch (error) {
        throw new Error(
          `Failed to initialize UpgradePanelController: ${error.message}`
        );
      }

      try {
        this.infoBrokerPanelController = new InfoBrokerPanelController(
          {
            infoBrokerPanel: this.elements.infoBrokerPanel,
            infoBrokerSystemName: this.elements.infoBrokerSystemName,
            buyRumorBtn: this.elements.buyRumorBtn,
            rumorText: this.elements.rumorText,
            intelligenceList: this.elements.intelligenceList,
            infoBrokerValidationMessage:
              this.elements.infoBrokerValidationMessage,
            purchaseTab: this.elements.purchaseTab,
            marketDataTab: this.elements.marketDataTab,
            purchaseIntelContent: this.elements.purchaseIntelContent,
            marketDataContent: this.elements.marketDataContent,
            marketDataList: this.elements.marketDataList,
          },
          this.gameStateManager,
          this.starData,
          this.gameStateManager.informationBroker
        );
      } catch (error) {
        throw new Error(
          `Failed to initialize InfoBrokerPanelController: ${error.message}`
        );
      }

      try {
        this.cargoManifestPanelController = new CargoManifestPanelController(
          {
            cargoManifestPanel: this.elements.cargoManifestPanel,
            cargoManifestShipName: this.elements.cargoManifestShipName,
            cargoManifestUsed: this.elements.cargoManifestUsed,
            cargoManifestCapacity: this.elements.cargoManifestCapacity,
            cargoManifestList: this.elements.cargoManifestList,
            cargoManifestTotalValue: this.elements.cargoManifestTotalValue,
          },
          this.gameStateManager,
          this.starData
        );
      } catch (error) {
        throw new Error(
          `Failed to initialize CargoManifestPanelController: ${error.message}`
        );
      }
    }
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
    const capitalizedType = capitalizeFirst(systemType);
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
    this.hideStationInterface();
    if (!this.infoBrokerPanelController) {
      throw new Error(
        'InfoBrokerPanelController not initialized - required DOM elements may be missing'
      );
    }

    try {
      this.infoBrokerPanelController.show();
    } catch (error) {
      this.showError(error.message);
    }
  }

  hideInfoBrokerPanel() {
    if (!this.infoBrokerPanelController) {
      throw new Error(
        'InfoBrokerPanelController not initialized - required DOM elements may be missing'
      );
    }

    this.infoBrokerPanelController.hide();
  }

  handlePurchaseIntelligence(systemId) {
    if (!this.infoBrokerPanelController) {
      throw new Error(
        'InfoBrokerPanelController not initialized - required DOM elements may be missing'
      );
    }

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
      return;
    }

    // Fallback for test environments where controller is not initialized
    // This maintains backward compatibility with existing tests
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in renderMarketData');
    }

    const priceKnowledge = state.world.priceKnowledge || {};

    if (!this.elements.marketDataList) {
      return;
    }

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
      commodityName.textContent = capitalizeFirst(commodity);

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

  // ========================================================================
  // REPAIR PANEL
  // ========================================================================

  showRepairPanel() {
    this.hideStationInterface();
    if (!this.repairPanelController) {
      throw new Error(
        'RepairPanelController not initialized - required DOM elements may be missing'
      );
    }

    try {
      this.repairPanelController.show();
    } catch (error) {
      this.showError(error.message);
    }
  }

  hideRepairPanel() {
    if (!this.repairPanelController) {
      throw new Error(
        'RepairPanelController not initialized - required DOM elements may be missing'
      );
    }

    this.repairPanelController.hide();
  }

  isRepairVisible() {
    return this.elements.repairPanel.classList.contains('visible');
  }

  handleRepair(systemType, amountStr) {
    if (!this.repairPanelController) {
      throw new Error(
        'RepairPanelController not initialized - required DOM elements may be missing'
      );
    }

    const result = this.repairPanelController.handleRepairSystem(
      systemType,
      amountStr
    );

    if (result.success) {
      this.showSuccess(`${result.systemName} repaired`);
    }
  }

  handleRepairAll() {
    if (!this.repairPanelController) {
      throw new Error(
        'RepairPanelController not initialized - required DOM elements may be missing'
      );
    }

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
   * Delegates to UpgradePanelController to display available and installed
   * ship upgrades with costs, effects, and tradeoffs.
   *
   * Architecture: architecture-refactor
   * Validates: Requirements 1.4, 1.5
   */
  showUpgradesInterface() {
    this.hideStationInterface();
    if (!this.upgradePanelController) {
      throw new Error(
        'UpgradePanelController not initialized - required DOM elements may be missing'
      );
    }

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
    if (!this.upgradePanelController) {
      throw new Error(
        'UpgradePanelController not initialized - required DOM elements may be missing'
      );
    }

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
    if (!this.upgradePanelController) {
      throw new Error(
        'UpgradePanelController not initialized - required DOM elements may be missing'
      );
    }

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
}
