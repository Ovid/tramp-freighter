import {
  calculateDistanceFromSol,
  INTELLIGENCE_PRICES,
  INTELLIGENCE_RECENT_THRESHOLD,
  NOTIFICATION_CONFIG,
  COMMODITY_TYPES,
  SHIP_CONDITION_BOUNDS,
} from './game-constants.js';
import { TradingSystem } from './game-trading.js';

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
      repairCloseBtn: document.getElementById('repair-close-btn'),
      repairBackBtn: document.getElementById('repair-back-btn'),
      repairHullPercent: document.getElementById('repair-hull-percent'),
      repairHullBar: document.getElementById('repair-hull-bar'),
      repairEnginePercent: document.getElementById('repair-engine-percent'),
      repairEngineBar: document.getElementById('repair-engine-bar'),
      repairLifeSupportPercent: document.getElementById('repair-life-support-percent'),
      repairLifeSupportBar: document.getElementById('repair-life-support-bar'),
      repairAllBtn: document.getElementById('repair-all-btn'),
      repairValidationMessage: document.getElementById('repair-validation-message'),
      notificationArea: document.getElementById('notification-area'),
      eventModalOverlay: document.getElementById('event-modal-overlay'),
      eventModalTitle: document.getElementById('event-modal-title'),
      eventModalDescription: document.getElementById('event-modal-description'),
      eventModalDuration: document.getElementById('event-modal-duration'),
      eventModalDismiss: document.getElementById('event-modal-dismiss'),
    };

    // Cache repair buttons to avoid repeated DOM queries
    this.cachedRepairButtons = null;
    // Cache refuel preset buttons for consistency
    this.cachedRefuelPresetButtons = null;

    this.subscribeToStateChanges();
    this.setupStationInterfaceHandlers();
    this.setupEventModalHandlers();
    this.setupQuickAccessHandlers();

    // Validate critical DOM elements were cached (skip in test environment)
    const isTestEnvironment =
      typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if (!isTestEnvironment) {
      if (this.cachedRepairButtons.length === 0) {
        throw new Error(
          'Repair buttons not found in DOM - check HTML structure'
        );
      }
      if (this.cachedRefuelPresetButtons.length === 0) {
        throw new Error(
          'Refuel preset buttons not found in DOM - check HTML structure'
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
    if (!state) return;

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
    const barElement = this.elements[`${prefix}${capitalizedType}Bar`];
    // HUD uses 'Text' suffix, repair panel uses 'Percent' suffix
    const textElement = this.elements[`${prefix}${capitalizedType}Text`] || 
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
    if (!condition) return;

    this.updateConditionDisplay('', 'hull', condition.hull);
    this.updateConditionDisplay('', 'engine', condition.engine);
    this.updateConditionDisplay('', 'lifeSupport', condition.lifeSupport);
  }

  updateCargo() {
    const cargoUsed = this.gameStateManager.getCargoUsed();
    const cargoCapacity = this.gameStateManager.getShip()?.cargoCapacity || 0;

    this.elements.cargo.textContent = `${cargoUsed}/${cargoCapacity}`;
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
        this.updateRefuelCost();
      });
    }

    // Cache refuel preset buttons to avoid repeated DOM queries
    this.cachedRefuelPresetButtons = document.querySelectorAll(
      '.refuel-preset-btn[data-amount]'
    );
    this.cachedRefuelPresetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const amount = parseInt(btn.getAttribute('data-amount'));
        this.setRefuelAmount(amount);
      });
    });

    if (this.elements.refuelMaxBtn) {
      this.elements.refuelMaxBtn.addEventListener('click', () => {
        this.setRefuelAmountToMax();
      });
    }

    if (this.elements.refuelConfirmBtn) {
      this.elements.refuelConfirmBtn.addEventListener('click', () => {
        this.handleRefuel();
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
    this.cachedRepairButtons = document.querySelectorAll('.repair-btn[data-system][data-amount]');
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
  }

  showStationInterface() {
    const state = this.gameStateManager.getState();
    if (!state) return;

    const currentSystemId = state.player.currentSystem;
    const system = this.starData.find((s) => s.id === currentSystemId);

    if (!system) return;

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
    if (!state) return;

    const currentSystemId = state.player.currentSystem;

    // Call the global selectStarById function with openStation=false
    // This opens only the system info panel, not the station interface
    if (window.selectStarById) {
      window.selectStarById(currentSystemId, false);
    }
  }

  openStationOrShowError() {
    const state = this.gameStateManager.getState();
    if (!state) return;

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
    const currentDay = state?.player?.daysElapsed || 0;
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
    if (!state) return;

    // Only show station interface if clicking on current system
    if (systemId === state.player.currentSystem) {
      this.showStationInterface();
    }
  }

  showTradePanel() {
    const state = this.gameStateManager.getState();
    if (!state) return;

    const currentSystemId = state.player.currentSystem;
    const system = this.starData.find((s) => s.id === currentSystemId);

    if (!system) return;

    this.elements.tradeSystemName.textContent = system.name;

    this.hideStationInterface();

    this.updateTradeCargoCapacity();
    this.renderMarketGoods(system);
    this.renderCargoStacks(system);

    this.elements.tradePanel.classList.add('visible');
  }

  updateTradeCargoCapacity() {
    const state = this.gameStateManager.getState();
    if (!state) return;

    const cargoUsed = this.gameStateManager.getCargoUsed();
    const cargoCapacity = state.ship.cargoCapacity;
    const cargoRemaining = this.gameStateManager.getCargoRemaining();

    this.elements.tradeCargoUsed.textContent = cargoUsed;
    this.elements.tradeCargoCapacity.textContent = cargoCapacity;
    this.elements.tradeCargoRemaining.textContent = cargoRemaining;
  }

  hideTradePanel() {
    this.elements.tradePanel.classList.remove('visible');
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
    const state = this.gameStateManager.getState();
    if (!state) return;

    this.elements.marketGoods.replaceChildren();

    const currentDay = state.player.daysElapsed;
    const activeEvents = state.world.activeEvents || [];

    this.goodsList.forEach((goodType) => {
      const price = TradingSystem.calculatePrice(
        goodType,
        system,
        currentDay,
        activeEvents
      );
      const goodItem = this.createGoodItem(goodType, price);
      this.elements.marketGoods.appendChild(goodItem);
    });
  }

  createGoodItem(goodType, price) {
    const state = this.gameStateManager.getState();
    const credits = state.player.credits;
    const cargoRemaining = this.gameStateManager.getCargoRemaining();

    const marketListing = document.createElement('div');
    marketListing.className = 'good-item';

    const commodityInfo = document.createElement('div');
    commodityInfo.className = 'good-info';

    const commodityName = document.createElement('div');
    commodityName.className = 'good-name';
    commodityName.textContent = this.capitalizeFirst(goodType);

    const stationPrice = document.createElement('div');
    stationPrice.className = 'good-price';
    stationPrice.textContent = `${price} cr/unit`;

    commodityInfo.appendChild(commodityName);
    commodityInfo.appendChild(stationPrice);

    const purchaseActions = document.createElement('div');
    purchaseActions.className = 'good-actions';

    const buy1Btn = document.createElement('button');
    buy1Btn.className = 'buy-btn';
    buy1Btn.textContent = 'Buy 1';
    buy1Btn.disabled = credits < price || cargoRemaining < 1;
    buy1Btn.addEventListener('click', () => this.handleBuy(goodType, 1, price));

    const buy10Btn = document.createElement('button');
    buy10Btn.className = 'buy-btn';
    buy10Btn.textContent = 'Buy 10';
    const canBuy10 = credits >= price * 10 && cargoRemaining >= 10;
    buy10Btn.disabled = !canBuy10;
    buy10Btn.addEventListener('click', () =>
      this.handleBuy(goodType, 10, price)
    );

    const buyMaxBtn = document.createElement('button');
    buyMaxBtn.className = 'buy-btn';
    buyMaxBtn.textContent = 'Buy Max';
    const maxAffordable = Math.floor(credits / price);
    const maxQuantity = Math.min(maxAffordable, cargoRemaining);
    buyMaxBtn.disabled = maxQuantity < 1;
    buyMaxBtn.addEventListener('click', () =>
      this.handleBuy(goodType, maxQuantity, price)
    );

    purchaseActions.appendChild(buy1Btn);
    purchaseActions.appendChild(buy10Btn);
    purchaseActions.appendChild(buyMaxBtn);

    // Add validation message if purchase not possible
    const validationMessage = document.createElement('div');
    validationMessage.className = 'validation-message';

    if (cargoRemaining < 1) {
      validationMessage.textContent = 'Cargo capacity full';
      validationMessage.classList.add('error');
    } else if (credits < price) {
      validationMessage.textContent = 'Insufficient credits for purchase';
      validationMessage.classList.add('error');
    }

    marketListing.appendChild(commodityInfo);
    marketListing.appendChild(purchaseActions);
    marketListing.appendChild(validationMessage);

    return marketListing;
  }

  handleBuy(goodType, quantity, price) {
    const purchaseOutcome = this.gameStateManager.buyGood(goodType, quantity, price);

    if (!purchaseOutcome.success) {
      this.showError(`Purchase failed: ${purchaseOutcome.reason}`);
      return;
    }

    // Refresh the trade panel to show updated state
    const state = this.gameStateManager.getState();
    const system = this.starData.find(
      (s) => s.id === state.player.currentSystem
    );
    this.updateTradeCargoCapacity();
    this.renderMarketGoods(system);
    this.renderCargoStacks(system);
  }

  renderCargoStacks(system) {
    const state = this.gameStateManager.getState();
    if (!state) return;

    this.elements.cargoStacks.replaceChildren();

    const cargo = state.ship.cargo;

    if (!cargo || cargo.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'cargo-empty';
      emptyMsg.textContent = 'No cargo';
      this.elements.cargoStacks.appendChild(emptyMsg);
      return;
    }

    cargo.forEach((stack, index) => {
      const stackItem = this.createCargoStackItem(stack, index, system);
      this.elements.cargoStacks.appendChild(stackItem);
    });
  }

  createCargoStackItem(stack, stackIndex, system) {
    const state = this.gameStateManager.getState();
    const currentDay = state.player.daysElapsed;
    const activeEvents = state.world.activeEvents || [];

    const currentPrice = TradingSystem.calculatePrice(
      stack.good,
      system,
      currentDay,
      activeEvents
    );
    const profitMargin = currentPrice - stack.purchasePrice;
    const profitPercentage = (
      (profitMargin / stack.purchasePrice) *
      100
    ).toFixed(1);

    const stackItem = document.createElement('div');
    stackItem.className = 'cargo-stack';

    const stackInfo = document.createElement('div');
    stackInfo.className = 'stack-info';

    const stackName = document.createElement('div');
    stackName.className = 'stack-name';
    stackName.textContent = this.capitalizeFirst(stack.good);

    const stackDetails = document.createElement('div');
    stackDetails.className = 'stack-details';
    
    // Build details text with purchase context
    let detailsText = `Qty: ${stack.qty} | Bought at: ${stack.purchasePrice} cr/unit`;
    
    // Add purchase system name if available
    if (stack.purchaseSystem !== undefined && stack.purchaseSystem !== null) {
      const purchaseSystem = this.starData.find((s) => s.id === stack.purchaseSystem);
      if (purchaseSystem) {
        detailsText += ` in ${purchaseSystem.name}`;
      }
    }
    
    // Add days since purchase if available
    if (stack.purchaseDay !== undefined && stack.purchaseDay !== null) {
      const daysSincePurchase = currentDay - stack.purchaseDay;
      if (daysSincePurchase === 0) {
        detailsText += ` (today)`;
      } else if (daysSincePurchase === 1) {
        detailsText += ` (1 day ago)`;
      } else {
        detailsText += ` (${daysSincePurchase} days ago)`;
      }
    }
    
    stackDetails.textContent = detailsText;

    const stackProfit = document.createElement('div');
    stackProfit.className = 'stack-profit';

    if (profitMargin > 0) {
      stackProfit.classList.add('positive');
      stackProfit.textContent = `Sell at: ${currentPrice} cr/unit | Profit: +${profitMargin} cr/unit (+${profitPercentage}%)`;
    } else if (profitMargin < 0) {
      stackProfit.classList.add('negative');
      stackProfit.textContent = `Sell at: ${currentPrice} cr/unit | Loss: ${profitMargin} cr/unit (${profitPercentage}%)`;
    } else {
      stackProfit.classList.add('neutral');
      stackProfit.textContent = `Sell at: ${currentPrice} cr/unit | Break even`;
    }

    stackInfo.appendChild(stackName);
    stackInfo.appendChild(stackDetails);
    stackInfo.appendChild(stackProfit);

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
    this.updateTradeCargoCapacity();
    this.renderMarketGoods(system);
    this.renderCargoStacks(system);
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
    const state = this.gameStateManager.getState();
    if (!state) return;

    const currentSystemId = state.player.currentSystem;
    const system = this.starData.find((s) => s.id === currentSystemId);

    if (!system) return;

    this.elements.refuelSystemName.textContent = system.name;

    const currentFuel = state.ship.fuel;
    this.elements.refuelCurrentFuel.textContent = `${Math.round(currentFuel)}%`;

    const fuelPrice = this.gameStateManager.getFuelPrice(currentSystemId);
    this.elements.refuelPricePerPercent.textContent = `${fuelPrice} cr/%`;

    const defaultAmount = Math.min(10, SHIP_CONDITION_BOUNDS.MAX - Math.round(currentFuel));
    this.elements.refuelAmountInput.value =
      defaultAmount > 0 ? defaultAmount : 0;
    this.elements.refuelAmountInput.max = SHIP_CONDITION_BOUNDS.MAX - Math.round(currentFuel);

    this.updateRefuelCost();

    this.hideStationInterface();

    this.elements.refuelPanel.classList.add('visible');
  }

  hideRefuelPanel() {
    this.elements.refuelPanel.classList.remove('visible');
  }

  updateRefuelCost() {
    const state = this.gameStateManager.getState();
    if (!state) return;

    const amount = parseInt(this.elements.refuelAmountInput.value) || 0;
    const currentSystemId = state.player.currentSystem;
    const fuelPrice = this.gameStateManager.getFuelPrice(currentSystemId);

    const totalCost = amount * fuelPrice;
    this.elements.refuelTotalCost.textContent = `${totalCost} cr`;

    const currentFuel = state.ship.fuel;
    const credits = state.player.credits;

    const validation = this.gameStateManager.validateRefuel(
      currentFuel,
      amount,
      credits,
      fuelPrice
    );

    // Update button state
    this.elements.refuelConfirmBtn.disabled = !validation.valid || amount <= 0;

    // Show validation message if there's an issue
    if (this.elements.refuelValidationMessage) {
      if (amount <= 0) {
        this.elements.refuelValidationMessage.textContent =
          'Enter an amount to refuel';
        this.elements.refuelValidationMessage.className =
          'validation-message info';
      } else if (!validation.valid) {
        this.elements.refuelValidationMessage.textContent = validation.reason;
        this.elements.refuelValidationMessage.className =
          'validation-message error';
      } else {
        // Valid - hide message
        this.elements.refuelValidationMessage.textContent = '';
        this.elements.refuelValidationMessage.className = 'validation-message';
      }
    }
  }

  setRefuelAmount(amount) {
    if (!this.elements.refuelAmountInput) return;

    const state = this.gameStateManager.getState();
    if (!state) return;

    const currentFuel = Math.round(state.ship.fuel);
    const maxAmount = SHIP_CONDITION_BOUNDS.MAX - currentFuel;
    const actualAmount = Math.min(amount, maxAmount);

    this.elements.refuelAmountInput.value = actualAmount > 0 ? actualAmount : 0;
    this.updateRefuelCost();
  }

  setRefuelAmountToMax() {
    const state = this.gameStateManager.getState();
    if (!state) return;

    const currentFuel = state.ship.fuel;
    const credits = state.player.credits;
    const currentSystemId = state.player.currentSystem;
    const fuelPrice = this.gameStateManager.getFuelPrice(currentSystemId);

    // Calculate max affordable amount
    const maxAffordable = Math.floor(credits / fuelPrice);

    // Calculate max capacity amount
    const maxCapacity = Math.floor(SHIP_CONDITION_BOUNDS.MAX - currentFuel);

    // Use the smaller of the two
    const maxAmount = Math.min(maxAffordable, maxCapacity);

    this.setRefuelAmount(maxAmount);
  }

  handleRefuel() {
    if (!this.elements.refuelAmountInput) return;

    const amount = parseInt(this.elements.refuelAmountInput.value) || 0;

    if (amount <= 0) {
      this.showError('Refuel failed: Invalid amount');
      return;
    }

    const refuelOutcome = this.gameStateManager.refuel(amount);

    if (!refuelOutcome.success) {
      this.showError(`Refuel failed: ${refuelOutcome.reason}`);
      return;
    }

    // Refresh the refuel panel to show updated state
    this.showRefuelPanel();
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

    knownSystems.forEach((systemId) => {
      const system = this.starData.find((s) => s.id === systemId);
      if (!system) return;

      const knowledge = priceKnowledge[systemId];
      const marketDataItem = this.createMarketDataItem(system, knowledge);
      this.elements.marketDataList.appendChild(marketDataItem);
    });
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
    const rumorCost = INTELLIGENCE_PRICES.RUMOR;

    this.elements.buyRumorBtn.disabled = credits < rumorCost;
  }

  handleBuyRumor() {
    const state = this.gameStateManager.getState();
    const credits = state.player.credits;
    const rumorCost = INTELLIGENCE_PRICES.RUMOR;

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
      if (option.lastVisit > INTELLIGENCE_RECENT_THRESHOLD) return 1; // Stale
      return 2; // Recent
    };

    intelligenceOptions.sort(
      (a, b) => getIntelligencePriority(a) - getIntelligencePriority(b)
    );

    intelligenceOptions.forEach((option) => {
      const item = this.createIntelligenceItem(option, credits);
      this.elements.intelligenceList.appendChild(item);
    });
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
    const intelligenceOutcome = this.gameStateManager.purchaseIntelligence(systemId);

    if (!intelligenceOutcome.success) {
      this.elements.infoBrokerValidationMessage.textContent = intelligenceOutcome.reason;
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
    if (!state) return;

    const currentSystemId = state.player.currentSystem;
    const system = this.starData.find((s) => s.id === currentSystemId);

    if (!system) return;

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
    if (!condition) return;

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
    if (!state) return;

    const condition = this.gameStateManager.getShipCondition();
    const credits = state.player.credits;

    // cachedRepairButtons is guaranteed to exist - set in constructor via setupStationInterfaceHandlers()
    this.cachedRepairButtons.forEach((btn) => {
      const systemType = btn.getAttribute('data-system');
      const amountStr = btn.getAttribute('data-amount');
      const currentCondition = this.getSystemCondition(condition, systemType);

      let amount = 0;
      let cost = 0;

      if (amountStr === 'full') {
        // Full repair
        amount = SHIP_CONDITION_BOUNDS.MAX - currentCondition;
        cost = this.gameStateManager.getRepairCost(systemType, amount, currentCondition);
        btn.textContent = `Full (₡${cost})`;
      } else {
        // Fixed amount repair
        amount = parseInt(amountStr);
        cost = this.gameStateManager.getRepairCost(systemType, amount, currentCondition);
        btn.textContent = `+${amount}% (₡${cost})`;
      }

      // Disable button if:
      // - Already at max condition
      // - Not enough credits
      // - Would exceed max condition
      const wouldExceedMax = currentCondition + amount > SHIP_CONDITION_BOUNDS.MAX;
      const atMax = currentCondition >= SHIP_CONDITION_BOUNDS.MAX;
      const notEnoughCredits = credits < cost;

      btn.disabled = atMax || notEnoughCredits || wouldExceedMax || amount <= 0;
    });

    // Update repair all button
    const totalCost = this.calculateRepairAllCost();
    this.elements.repairAllBtn.textContent = `Repair All to Full (₡${totalCost})`;

    const allAtMax = condition.hull >= SHIP_CONDITION_BOUNDS.MAX && 
                     condition.engine >= SHIP_CONDITION_BOUNDS.MAX && 
                     condition.lifeSupport >= SHIP_CONDITION_BOUNDS.MAX;
    this.elements.repairAllBtn.disabled = allAtMax || credits < totalCost || totalCost === 0;
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
    if (!condition) return 0;

    let totalCost = 0;

    // Hull
    const hullAmount = SHIP_CONDITION_BOUNDS.MAX - condition.hull;
    if (hullAmount > 0) {
      totalCost += this.gameStateManager.getRepairCost('hull', hullAmount, condition.hull);
    }

    // Engine
    const engineAmount = SHIP_CONDITION_BOUNDS.MAX - condition.engine;
    if (engineAmount > 0) {
      totalCost += this.gameStateManager.getRepairCost('engine', engineAmount, condition.engine);
    }

    // Life Support
    const lifeSupportAmount = SHIP_CONDITION_BOUNDS.MAX - condition.lifeSupport;
    if (lifeSupportAmount > 0) {
      totalCost += this.gameStateManager.getRepairCost('lifeSupport', lifeSupportAmount, condition.lifeSupport);
    }

    return totalCost;
  }

  handleRepair(systemType, amountStr) {
    const state = this.gameStateManager.getState();
    if (!state) return;

    const condition = this.gameStateManager.getShipCondition();
    const currentCondition = this.getSystemCondition(condition, systemType);

    let amount = 0;
    if (amountStr === 'full') {
      amount = SHIP_CONDITION_BOUNDS.MAX - currentCondition;
    } else {
      amount = parseInt(amountStr);
    }

    // Execute repair
    const repairOutcome = this.gameStateManager.repairShipSystem(systemType, amount);

    if (!repairOutcome.success) {
      this.elements.repairValidationMessage.textContent = `Repair failed: ${repairOutcome.reason}`;
      this.elements.repairValidationMessage.className = 'validation-message error';
      return;
    }

    // Clear validation message
    this.elements.repairValidationMessage.textContent = '';
    this.elements.repairValidationMessage.className = 'validation-message';

    // Show success notification
    const systemName = systemType === 'lifeSupport' ? 'Life Support' : this.capitalizeFirst(systemType);
    this.showSuccess(`${systemName} repaired`);

    // Refresh the repair panel to show updated state
    this.updateRepairConditionDisplay();
    this.updateRepairButtons();
  }

  handleRepairAll() {
    const condition = this.gameStateManager.getShipCondition();
    if (!condition) return;

    const state = this.gameStateManager.getState();
    const totalCost = this.calculateRepairAllCost();

    // Pre-validate total cost before executing any repairs
    // This prevents partial repairs if player doesn't have enough credits for all systems
    if (state.player.credits < totalCost) {
      this.elements.repairValidationMessage.textContent = 'Insufficient credits for full repair';
      this.elements.repairValidationMessage.className = 'validation-message error';
      return;
    }

    let repairCount = 0;
    let failedRepairs = [];

    // Repair hull
    const hullAmount = SHIP_CONDITION_BOUNDS.MAX - condition.hull;
    if (hullAmount > 0) {
      const result = this.gameStateManager.repairShipSystem('hull', hullAmount);
      if (result.success) {
        repairCount++;
      } else {
        failedRepairs.push(`Hull: ${result.reason}`);
      }
    }

    // Repair engine
    const engineAmount = SHIP_CONDITION_BOUNDS.MAX - condition.engine;
    if (engineAmount > 0) {
      const result = this.gameStateManager.repairShipSystem('engine', engineAmount);
      if (result.success) {
        repairCount++;
      } else {
        failedRepairs.push(`Engine: ${result.reason}`);
      }
    }

    // Repair life support
    const lifeSupportAmount = SHIP_CONDITION_BOUNDS.MAX - condition.lifeSupport;
    if (lifeSupportAmount > 0) {
      const result = this.gameStateManager.repairShipSystem('lifeSupport', lifeSupportAmount);
      if (result.success) {
        repairCount++;
      } else {
        failedRepairs.push(`Life Support: ${result.reason}`);
      }
    }

    // Show results
    if (failedRepairs.length > 0) {
      this.elements.repairValidationMessage.textContent = `Some repairs failed: ${failedRepairs.join(', ')}`;
      this.elements.repairValidationMessage.className = 'validation-message error';
    } else if (repairCount > 0) {
      this.elements.repairValidationMessage.textContent = '';
      this.elements.repairValidationMessage.className = 'validation-message';
      this.showSuccess(`All systems repaired to full`);
    } else {
      this.elements.repairValidationMessage.textContent = 'All systems already at maximum condition';
      this.elements.repairValidationMessage.className = 'validation-message info';
    }

    // Refresh the repair panel to show updated state
    this.updateRepairConditionDisplay();
    this.updateRepairButtons();
  }
}
