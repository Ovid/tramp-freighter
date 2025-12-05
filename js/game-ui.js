import { calculateDistanceFromSol } from './game-constants.js';
import { TradingSystem } from './game-trading.js';

/**
 * UIManager - Reactive UI layer using event subscription pattern
 * 
 * Uses observer pattern to decouple UI updates from game state mutations,
 * preventing tight coupling and enabling multiple UI components to react
 * to the same state changes independently.
 * 
 * Requirements: 2.1-2.8 (HUD), 6.1-6.4 (Station interface)
 */
export class UIManager {
    constructor(gameStateManager) {
        this.gameStateManager = gameStateManager;
        this.starData = gameStateManager.starData;
        
        // List of all tradeable goods
        this.goodsList = ['grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'];
        
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
            cargoStacks: document.getElementById('cargo-stacks')
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
        // Defensive: Station interface may not exist in all game states
        if (!this.elements.stationInterface) return;
        
        // Close button handler
        if (this.elements.stationCloseBtn) {
            this.elements.stationCloseBtn.addEventListener('click', () => {
                this.hideStationInterface();
            });
        }
        
        // Undock button handler
        if (this.elements.undockBtn) {
            this.elements.undockBtn.addEventListener('click', () => {
                this.hideStationInterface();
            });
        }
        
        // Trade button handler
        if (this.elements.tradeBtn) {
            this.elements.tradeBtn.addEventListener('click', () => {
                this.showTradePanel();
            });
        }
        
        // Trade panel close button handler
        if (this.elements.tradeCloseBtn) {
            this.elements.tradeCloseBtn.addEventListener('click', () => {
                this.hideTradePanel();
            });
        }
        
        // Trade panel back button handler
        if (this.elements.tradeBackBtn) {
            this.elements.tradeBackBtn.addEventListener('click', () => {
                this.hideTradePanel();
                this.showStationInterface();
            });
        }
        
        // Refuel button handler (placeholder for future implementation)
        if (this.elements.refuelBtn) {
            this.elements.refuelBtn.addEventListener('click', () => {
                console.log('Refuel panel - to be implemented');
                // Future: this.showRefuelPanel();
            });
        }
    }
    
    showStationInterface() {
        if (!this.elements.stationInterface) return;
        
        const state = this.gameStateManager.getState();
        if (!state) return;
        
        const currentSystemId = state.player.currentSystem;
        const system = this.starData.find(s => s.id === currentSystemId);
        
        if (!system) return;
        
        // Update station interface with system information
        if (this.elements.stationName) {
            this.elements.stationName.textContent = `${system.name} Station`;
        }
        if (this.elements.stationSystemName) {
            this.elements.stationSystemName.textContent = system.name;
        }
        
        const distance = calculateDistanceFromSol(system);
        if (this.elements.stationDistance) {
            this.elements.stationDistance.textContent = `${distance.toFixed(1)} LY`;
        }
        
        // Show the interface
        this.elements.stationInterface.classList.add('visible');
    }
    
    hideStationInterface() {
        if (!this.elements.stationInterface) return;
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
        if (!this.elements.tradePanel) return;
        
        const state = this.gameStateManager.getState();
        if (!state) return;
        
        const currentSystemId = state.player.currentSystem;
        const system = this.starData.find(s => s.id === currentSystemId);
        
        if (!system) return;
        
        // Update trade panel header with system name
        if (this.elements.tradeSystemName) {
            this.elements.tradeSystemName.textContent = system.name;
        }
        
        // Hide station interface
        this.hideStationInterface();
        
        // Render market goods and cargo
        this.renderMarketGoods(system);
        this.renderCargoStacks(system);
        
        // Show the trade panel
        this.elements.tradePanel.classList.add('visible');
    }
    
    hideTradePanel() {
        if (!this.elements.tradePanel) return;
        this.elements.tradePanel.classList.remove('visible');
    }
    
    renderMarketGoods(system) {
        if (!this.elements.marketGoods) return;
        
        const state = this.gameStateManager.getState();
        if (!state) return;
        
        // Clear existing goods
        this.elements.marketGoods.innerHTML = '';
        
        // Render each good
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
        
        const goodItem = document.createElement('div');
        goodItem.className = 'good-item';
        
        // Good info section
        const goodInfo = document.createElement('div');
        goodInfo.className = 'good-info';
        
        const goodName = document.createElement('div');
        goodName.className = 'good-name';
        goodName.textContent = this.capitalizeFirst(goodType);
        
        const goodPrice = document.createElement('div');
        goodPrice.className = 'good-price';
        goodPrice.textContent = `${price} cr/unit`;
        
        goodInfo.appendChild(goodName);
        goodInfo.appendChild(goodPrice);
        
        // Good actions section
        const goodActions = document.createElement('div');
        goodActions.className = 'good-actions';
        
        // Buy 1 button
        const buy1Btn = document.createElement('button');
        buy1Btn.className = 'buy-btn';
        buy1Btn.textContent = 'Buy 1';
        buy1Btn.disabled = credits < price || cargoRemaining < 1;
        buy1Btn.addEventListener('click', () => this.handleBuy(goodType, 1, price));
        
        // Buy 10 button
        const buy10Btn = document.createElement('button');
        buy10Btn.className = 'buy-btn';
        buy10Btn.textContent = 'Buy 10';
        const canBuy10 = credits >= price * 10 && cargoRemaining >= 10;
        buy10Btn.disabled = !canBuy10;
        buy10Btn.addEventListener('click', () => this.handleBuy(goodType, 10, price));
        
        // Buy Max button
        const buyMaxBtn = document.createElement('button');
        buyMaxBtn.className = 'buy-btn';
        buyMaxBtn.textContent = 'Buy Max';
        const maxAffordable = Math.floor(credits / price);
        const maxQuantity = Math.min(maxAffordable, cargoRemaining);
        buyMaxBtn.disabled = maxQuantity < 1;
        buyMaxBtn.addEventListener('click', () => this.handleBuy(goodType, maxQuantity, price));
        
        goodActions.appendChild(buy1Btn);
        goodActions.appendChild(buy10Btn);
        goodActions.appendChild(buyMaxBtn);
        
        goodItem.appendChild(goodInfo);
        goodItem.appendChild(goodActions);
        
        return goodItem;
    }
    
    handleBuy(goodType, quantity, price) {
        const result = this.gameStateManager.buyGood(goodType, quantity, price);
        
        if (!result.success) {
            console.error('Purchase failed:', result.reason);
            // Future: show error notification
            return;
        }
        
        // Refresh the trade panel to show updated state
        const state = this.gameStateManager.getState();
        const system = this.starData.find(s => s.id === state.player.currentSystem);
        this.renderMarketGoods(system);
        this.renderCargoStacks(system);
    }
    
    renderCargoStacks(system) {
        if (!this.elements.cargoStacks) return;
        
        const state = this.gameStateManager.getState();
        if (!state) return;
        
        // Clear existing stacks
        this.elements.cargoStacks.innerHTML = '';
        
        const cargo = state.ship.cargo;
        
        // Show empty message if no cargo
        if (!cargo || cargo.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'cargo-empty';
            emptyMsg.textContent = 'No cargo';
            this.elements.cargoStacks.appendChild(emptyMsg);
            return;
        }
        
        // Render each cargo stack
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
        
        // Stack info section
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
        
        // Stack actions section
        const stackActions = document.createElement('div');
        stackActions.className = 'stack-actions';
        
        // Sell 1 button
        const sell1Btn = document.createElement('button');
        sell1Btn.className = 'sell-btn';
        sell1Btn.textContent = 'Sell 1';
        sell1Btn.disabled = stack.qty < 1;
        sell1Btn.addEventListener('click', () => this.handleSell(stackIndex, 1, currentPrice));
        
        // Sell All button
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
            console.error('Sale failed:', result.reason);
            // Future: show error notification
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
}
