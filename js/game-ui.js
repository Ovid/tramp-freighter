import { calculateDistanceFromSol } from './game-constants.js';
import { TradingSystem } from './game-trading.js';

/**
 * UIManager - Reactive UI layer using event subscription pattern
 * 
 * Subscribes to GameStateManager events to update UI elements reactively.
 * This decoupling prevents tight coupling between game logic and DOM manipulation,
 * allowing multiple UI components to react independently to state changes.
 * 
 * Requirements: 2.1-2.8 (HUD), 6.1-6.4 (Station interface)
 */
export class UIManager {
    constructor(gameStateManager) {
        this.gameStateManager = gameStateManager;
        this.starData = gameStateManager.starData;
        
        // List of all tradeable goods
        this.goodsList = ['grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'];
        
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
            cargo: document.getElementById('hud-cargo'),
            system: document.getElementById('hud-system'),
            distance: document.getElementById('hud-distance'),
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
            refuelPanel: document.getElementById('refuel-panel'),
            refuelSystemName: document.getElementById('refuel-system-name'),
            refuelCurrentFuel: document.getElementById('refuel-current-fuel'),
            refuelPricePerPercent: document.getElementById('refuel-price-per-percent'),
            refuelAmountInput: document.getElementById('refuel-amount-input'),
            refuelTotalCost: document.getElementById('refuel-total-cost'),
            refuelConfirmBtn: document.getElementById('refuel-confirm-btn'),
            refuelCloseBtn: document.getElementById('refuel-close-btn'),
            refuelBackBtn: document.getElementById('refuel-back-btn'),
            refuelMaxBtn: document.getElementById('refuel-max-btn'),
            notificationArea: document.getElementById('notification-area')
        };
        
        this.subscribeToStateChanges();
        this.setupStationInterfaceHandlers();
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
        this.updateCargo();
        this.updateLocation(state.player.currentSystem);
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
    
    updateCargo() {
        const cargoUsed = this.gameStateManager.getCargoUsed();
        const cargoCapacity = this.gameStateManager.getShip()?.cargoCapacity || 0;
        
        this.elements.cargo.textContent = `${cargoUsed}/${cargoCapacity}`;
    }
    
    updateLocation(systemId) {
        const system = this.starData.find(s => s.id === systemId);
        
        if (!system) return;
        
        this.elements.system.textContent = system.name;
        
        const distance = calculateDistanceFromSol(system);
        this.elements.distance.textContent = `${distance.toFixed(1)} LY`;
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
        
        const presetButtons = document.querySelectorAll('.refuel-preset-btn[data-amount]');
        presetButtons.forEach(btn => {
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
    }
    
    showStationInterface() {
        const state = this.gameStateManager.getState();
        if (!state) return;
        
        const currentSystemId = state.player.currentSystem;
        const system = this.starData.find(s => s.id === currentSystemId);
        
        if (!system) return;
        
        this.elements.stationName.textContent = `${system.name} Station`;
        this.elements.stationSystemName.textContent = system.name;
        
        const distance = calculateDistanceFromSol(system);
        this.elements.stationDistance.textContent = `${distance.toFixed(1)} LY`;
        
        this.elements.stationInterface.classList.add('visible');
    }
    
    hideStationInterface() {
        this.elements.stationInterface.classList.remove('visible');
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
        const system = this.starData.find(s => s.id === currentSystemId);
        
        if (!system) return;
        
        this.elements.tradeSystemName.textContent = system.name;
        
        this.hideStationInterface();
        
        this.renderMarketGoods(system);
        this.renderCargoStacks(system);
        
        this.elements.tradePanel.classList.add('visible');
    }
    
    hideTradePanel() {
        this.elements.tradePanel.classList.remove('visible');
    }
    
    renderMarketGoods(system) {
        
        const state = this.gameStateManager.getState();
        if (!state) return;
        
        this.elements.marketGoods.innerHTML = '';
        
        this.goodsList.forEach(goodType => {
            const price = TradingSystem.calculatePrice(goodType, system.type);
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
        buy10Btn.addEventListener('click', () => this.handleBuy(goodType, 10, price));
        
        const buyMaxBtn = document.createElement('button');
        buyMaxBtn.className = 'buy-btn';
        buyMaxBtn.textContent = 'Buy Max';
        const maxAffordable = Math.floor(credits / price);
        const maxQuantity = Math.min(maxAffordable, cargoRemaining);
        buyMaxBtn.disabled = maxQuantity < 1;
        buyMaxBtn.addEventListener('click', () => this.handleBuy(goodType, maxQuantity, price));
        
        purchaseActions.appendChild(buy1Btn);
        purchaseActions.appendChild(buy10Btn);
        purchaseActions.appendChild(buyMaxBtn);
        
        marketListing.appendChild(commodityInfo);
        marketListing.appendChild(purchaseActions);
        
        return marketListing;
    }
    
    handleBuy(goodType, quantity, price) {
        const result = this.gameStateManager.buyGood(goodType, quantity, price);
        
        if (!result.success) {
            this.showError(`Purchase failed: ${result.reason}`);
            return;
        }
        
        // Refresh the trade panel to show updated state
        const state = this.gameStateManager.getState();
        const system = this.starData.find(s => s.id === state.player.currentSystem);
        this.renderMarketGoods(system);
        this.renderCargoStacks(system);
    }
    
    renderCargoStacks(system) {
        const state = this.gameStateManager.getState();
        if (!state) return;
        
        this.elements.cargoStacks.innerHTML = '';
        
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
        const currentPrice = TradingSystem.calculatePrice(stack.good, system.type);
        const profitMargin = currentPrice - stack.purchasePrice;
        const profitPercentage = ((profitMargin / stack.purchasePrice) * 100).toFixed(1);
        
        const stackItem = document.createElement('div');
        stackItem.className = 'cargo-stack';
        
        const stackInfo = document.createElement('div');
        stackInfo.className = 'stack-info';
        
        const stackName = document.createElement('div');
        stackName.className = 'stack-name';
        stackName.textContent = this.capitalizeFirst(stack.good);
        
        const stackDetails = document.createElement('div');
        stackDetails.className = 'stack-details';
        stackDetails.textContent = `Qty: ${stack.qty} | Bought at: ${stack.purchasePrice} cr/unit`;
        
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
        sell1Btn.addEventListener('click', () => this.handleSell(stackIndex, 1, currentPrice));
        
        const sellAllBtn = document.createElement('button');
        sellAllBtn.className = 'sell-btn';
        sellAllBtn.textContent = `Sell All (${stack.qty})`;
        sellAllBtn.addEventListener('click', () => this.handleSell(stackIndex, stack.qty, currentPrice));
        
        stackActions.appendChild(sell1Btn);
        stackActions.appendChild(sellAllBtn);
        
        stackItem.appendChild(stackInfo);
        stackItem.appendChild(stackActions);
        
        return stackItem;
    }
    
    handleSell(stackIndex, quantity, salePrice) {
        const result = this.gameStateManager.sellGood(stackIndex, quantity, salePrice);
        
        if (!result.success) {
            this.showError(`Sale failed: ${result.reason}`);
            return;
        }
        
        // Refresh the trade panel to show updated state
        const state = this.gameStateManager.getState();
        const system = this.starData.find(s => s.id === state.player.currentSystem);
        this.renderMarketGoods(system);
        this.renderCargoStacks(system);
    }
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    /**
     * Show an error notification with auto-dismiss
     * Messages are queued to prevent overlap
     */
    showError(message, duration = 3000) {
        this.notificationQueue.push({ message, duration });
        
        if (!this.isShowingNotification) {
            this.processNotificationQueue();
        }
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
        const { message, duration } = this.notificationQueue.shift();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
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
            }, 300); // Match animation duration
        }, duration);
    }
    
    /**
     * Clear all notifications immediately
     */
    clearNotifications() {
        this.notificationQueue = [];
        this.isShowingNotification = false;
        
        if (this.elements.notificationArea) {
            this.elements.notificationArea.innerHTML = '';
        }
    }
    
    showRefuelPanel() {
        const state = this.gameStateManager.getState();
        if (!state) return;
        
        const currentSystemId = state.player.currentSystem;
        const system = this.starData.find(s => s.id === currentSystemId);
        
        if (!system) return;
        
        this.elements.refuelSystemName.textContent = system.name;
        
        const currentFuel = state.ship.fuel;
        this.elements.refuelCurrentFuel.textContent = `${Math.round(currentFuel)}%`;
        
        const fuelPrice = this.gameStateManager.getFuelPrice(currentSystemId);
        this.elements.refuelPricePerPercent.textContent = `${fuelPrice} cr/%`;
        
        const defaultAmount = Math.min(10, 100 - Math.round(currentFuel));
        this.elements.refuelAmountInput.value = defaultAmount > 0 ? defaultAmount : 0;
        this.elements.refuelAmountInput.max = 100 - Math.round(currentFuel);
        
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
        
        this.elements.refuelConfirmBtn.disabled = !validation.valid || amount <= 0;
    }
    
    setRefuelAmount(amount) {
        if (!this.elements.refuelAmountInput) return;
        
        const state = this.gameStateManager.getState();
        if (!state) return;
        
        const currentFuel = Math.round(state.ship.fuel);
        const maxAmount = 100 - currentFuel;
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
        
        // Calculate max capacity amount (use ceiling to avoid exceeding 100%)
        const maxCapacity = Math.floor(100 - currentFuel);
        
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
        
        const result = this.gameStateManager.refuel(amount);
        
        if (!result.success) {
            this.showError(`Refuel failed: ${result.reason}`);
            return;
        }
        
        // Refresh the refuel panel to show updated state
        this.showRefuelPanel();
    }
}
