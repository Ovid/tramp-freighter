'use strict';

import { TradingSystem } from '../game-trading.js';
import { COMMODITY_TYPES } from '../game-constants.js';
import { capitalizeFirst } from '../utils/string-utils.js';

/**
 * TradePanelController - Manages trade panel UI and interactions
 *
 * Part of the architecture-refactor pattern where UIManager delegates panel-specific
 * logic to focused controllers. This controller owns all trade panel behavior including
 * market display, cargo management, buy/sell transactions, and capacity tracking.
 *
 * Responsibilities:
 * - Display market goods with current prices and purchase metadata
 * - Display cargo stacks with sale prices and profit calculations
 * - Handle buy/sell transactions with validation
 * - Update cargo capacity display in real-time
 * - Validate transactions against credits and cargo capacity
 * - Manage hidden cargo section for Smuggler's Panels upgrade
 *
 * Dependencies:
 * - Receives DOM elements, GameStateManager, and starData via constructor
 * - Never queries DOM directly - uses only provided element references
 * - Delegates all state changes to GameStateManager
 * - Uses TradingSystem for price calculations
 *
 * Architecture: architecture-refactor
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.4
 *
 * @class
 */
export class TradePanelController {
  constructor(elements, gameStateManager, starData) {
    // Validate required dependencies
    if (!gameStateManager) {
      throw new Error(
        'TradePanelController: gameStateManager parameter required'
      );
    }
    if (!starData) {
      throw new Error('TradePanelController: starData parameter required');
    }

    // Validate elements object has required properties
    // If any are missing, UIManager initialization is broken
    const requiredElements = [
      'tradePanel',
      'tradeSystemName',
      'marketGoods',
      'cargoStacks',
      'tradeCargoUsed',
      'tradeCargoCapacity',
      'tradeCargoRemaining',
    ];

    const missingElements = requiredElements.filter((key) => !elements[key]);
    if (missingElements.length > 0) {
      throw new Error(
        `TradePanelController: Missing required DOM elements: ${missingElements.join(', ')}`
      );
    }

    this.elements = elements;
    this.gameStateManager = gameStateManager;
    this.starData = starData;

    // Use centralized commodity list from game constants
    this.goodsList = COMMODITY_TYPES;
  }

  show() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in show');
    }

    const currentSystemId = state.player.currentSystem;
    const system = this.starData.find((s) => s.id === currentSystemId);

    if (!system) {
      throw new Error(
        `Invalid game state: current system ID ${currentSystemId} not found in star data`
      );
    }

    this.elements.tradeSystemName.textContent = system.name;

    this.refreshTradePanel();

    this.elements.tradePanel.classList.add('visible');
  }

  hide() {
    this.elements.tradePanel.classList.remove('visible');
  }

  refreshTradePanel() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in refreshTradePanel');
    }

    const currentSystemId = state.player.currentSystem;
    const system = this.starData.find((s) => s.id === currentSystemId);

    if (!system) {
      throw new Error(
        `Invalid game state: current system ID ${currentSystemId} not found in star data`
      );
    }

    this.updateTradeCargoCapacity();
    this.renderMarketGoods(system);
    this.renderCargoStacks(system);
    this.renderHiddenCargoSection(system);
  }

  updateTradeCargoCapacity() {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in updateTradeCargoCapacity'
      );
    }

    const cargoUsed = this.gameStateManager.getCargoUsed();
    const cargoCapacity = state.ship.cargoCapacity;
    const cargoRemaining = this.gameStateManager.getCargoRemaining();

    this.elements.tradeCargoUsed.textContent = cargoUsed;
    this.elements.tradeCargoCapacity.textContent = cargoCapacity;
    this.elements.tradeCargoRemaining.textContent = cargoRemaining;
  }

  renderMarketGoods(system) {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in renderMarketGoods');
    }

    this.elements.marketGoods.replaceChildren();

    const currentDay = state.player.daysElapsed;
    const activeEvents = state.world.activeEvents || [];
    const marketConditions = state.world.marketConditions || {};

    const fragment = document.createDocumentFragment();
    this.goodsList.forEach((goodType) => {
      const price = TradingSystem.calculatePrice(
        goodType,
        system,
        currentDay,
        activeEvents,
        marketConditions
      );
      const goodItem = this.createGoodItem(goodType, price);
      fragment.appendChild(goodItem);
    });
    this.elements.marketGoods.appendChild(fragment);
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
    commodityName.textContent = capitalizeFirst(goodType);

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
    buy1Btn.addEventListener('click', () =>
      this.handleBuyGood(goodType, 1, price)
    );

    const buy10Btn = document.createElement('button');
    buy10Btn.className = 'buy-btn';
    buy10Btn.textContent = 'Buy 10';
    const canBuy10 = credits >= price * 10 && cargoRemaining >= 10;
    buy10Btn.disabled = !canBuy10;
    buy10Btn.addEventListener('click', () =>
      this.handleBuyGood(goodType, 10, price)
    );

    const buyMaxBtn = document.createElement('button');
    buyMaxBtn.className = 'buy-btn';
    buyMaxBtn.textContent = 'Buy Max';
    const maxAffordable = Math.floor(credits / price);
    const maxQuantity = Math.min(maxAffordable, cargoRemaining);
    buyMaxBtn.disabled = maxQuantity < 1;
    buyMaxBtn.addEventListener('click', () =>
      this.handleBuyGood(goodType, maxQuantity, price)
    );

    purchaseActions.appendChild(buy1Btn);
    purchaseActions.appendChild(buy10Btn);
    purchaseActions.appendChild(buyMaxBtn);

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

  handleBuyGood(goodType, quantity, price) {
    const purchaseOutcome = this.gameStateManager.buyGood(
      goodType,
      quantity,
      price
    );

    if (!purchaseOutcome.success) {
      throw new Error(`Purchase failed: ${purchaseOutcome.reason}`);
    }

    this.refreshTradePanel();
  }

  renderCargoStacks(system) {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error('Invalid game state: state is null in renderCargoStacks');
    }

    this.elements.cargoStacks.replaceChildren();

    const cargo = state.ship.cargo;

    if (!cargo || cargo.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'cargo-empty';
      emptyMsg.textContent = 'No cargo';
      this.elements.cargoStacks.appendChild(emptyMsg);
      return;
    }

    const fragment = document.createDocumentFragment();
    cargo.forEach((stack, index) => {
      const stackItem = this.createCargoStackItem(stack, index, system);
      fragment.appendChild(stackItem);
    });
    this.elements.cargoStacks.appendChild(fragment);
  }

  createCargoStackInfo(stack, system) {
    const state = this.gameStateManager.getState();
    const currentDay = state.player.daysElapsed;
    const activeEvents = state.world.activeEvents || [];
    const marketConditions = state.world.marketConditions || {};

    const currentPrice = TradingSystem.calculatePrice(
      stack.good,
      system,
      currentDay,
      activeEvents,
      marketConditions
    );
    const profitMargin = currentPrice - stack.buyPrice;
    const profitPercentage = ((profitMargin / stack.buyPrice) * 100).toFixed(1);

    const stackInfo = document.createElement('div');
    stackInfo.className = 'stack-info';

    const stackName = document.createElement('div');
    stackName.className = 'stack-name';
    stackName.textContent = capitalizeFirst(stack.good);

    const stackDetails = document.createElement('div');
    stackDetails.className = 'stack-details';

    let detailsText = `Qty: ${stack.qty} | Bought at: ${stack.buyPrice} cr/unit`;

    if (stack.buySystem !== undefined && stack.buyDate !== undefined) {
      const purchaseSystem = this.starData.find(
        (s) => s.id === stack.buySystem
      );
      if (!purchaseSystem) {
        throw new Error(
          `Invalid cargo stack: purchase system ID ${stack.buySystem} not found in star data`
        );
      }

      const daysSincePurchase = currentDay - stack.buyDate;
      let ageText;
      if (daysSincePurchase === 0) {
        ageText = 'today';
      } else if (daysSincePurchase === 1) {
        ageText = '1 day ago';
      } else {
        ageText = `${daysSincePurchase} days ago`;
      }

      detailsText += ` in ${purchaseSystem.name} (${ageText})`;
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

    return { stackInfo, currentPrice };
  }

  createCargoStackItem(stack, stackIndex, system) {
    const state = this.gameStateManager.getState();

    const stackItem = document.createElement('div');
    stackItem.className = 'cargo-stack';

    const { stackInfo, currentPrice } = this.createCargoStackInfo(
      stack,
      system
    );

    const stackActions = document.createElement('div');
    stackActions.className = 'stack-actions';

    const sell1Btn = document.createElement('button');
    sell1Btn.className = 'sell-btn';
    sell1Btn.textContent = 'Sell 1';
    sell1Btn.disabled = stack.qty < 1;
    sell1Btn.addEventListener('click', () =>
      this.handleSellStack(stackIndex, 1, currentPrice)
    );

    const sellAllBtn = document.createElement('button');
    sellAllBtn.className = 'sell-btn';
    sellAllBtn.textContent = `Sell All (${stack.qty})`;
    sellAllBtn.addEventListener('click', () =>
      this.handleSellStack(stackIndex, stack.qty, currentPrice)
    );

    stackActions.appendChild(sell1Btn);
    stackActions.appendChild(sellAllBtn);

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

  handleSellStack(stackIndex, quantity, salePrice) {
    const saleOutcome = this.gameStateManager.sellGood(
      stackIndex,
      quantity,
      salePrice
    );

    if (!saleOutcome.success) {
      throw new Error(`Sale failed: ${saleOutcome.reason}`);
    }

    this.refreshTradePanel();
  }

  handleMoveToHidden(goodType, quantity) {
    const result = this.gameStateManager.moveToHiddenCargo(goodType, quantity);

    if (!result.success) {
      throw new Error(`Transfer failed: ${result.reason}`);
    }

    this.refreshTradePanel();
  }

  handleMoveToRegular(goodType, quantity) {
    const result = this.gameStateManager.moveToRegularCargo(goodType, quantity);

    if (!result.success) {
      throw new Error(`Transfer failed: ${result.reason}`);
    }

    this.refreshTradePanel();
  }

  renderHiddenCargoSection(system) {
    const state = this.gameStateManager.getState();
    if (!state) {
      throw new Error(
        'Invalid game state: state is null in renderHiddenCargoSection'
      );
    }

    if (!this.elements.hiddenCargoSection || !this.elements.hiddenCargoStacks) {
      return;
    }

    const ship = state.ship;
    const hasSmugglersPanel =
      ship.upgrades && ship.upgrades.includes('smuggler_panels');

    if (!hasSmugglersPanel) {
      this.elements.hiddenCargoSection.classList.add('hidden');
      return;
    }

    this.elements.hiddenCargoSection.classList.remove('hidden');

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

    this.elements.hiddenCargoStacks.replaceChildren();

    if (hiddenCargo.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'cargo-empty';
      emptyMsg.textContent = 'No hidden cargo';
      this.elements.hiddenCargoStacks.appendChild(emptyMsg);
      return;
    }

    const fragment = document.createDocumentFragment();
    hiddenCargo.forEach((stack) => {
      const stackItem = this.createHiddenCargoStackItem(stack, system);
      fragment.appendChild(stackItem);
    });
    this.elements.hiddenCargoStacks.appendChild(fragment);
  }

  createHiddenCargoStackItem(stack, system) {
    const stackItem = document.createElement('div');
    stackItem.className = 'cargo-stack';

    const { stackInfo } = this.createCargoStackInfo(stack, system);

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
}
