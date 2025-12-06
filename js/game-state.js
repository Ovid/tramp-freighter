import {
    BASE_PRICES,
    SPECTRAL_MODIFIERS,
    FUEL_PRICING,
    calculateDistanceFromSol,
    SOL_SYSTEM_ID,
    GAME_VERSION,
    SAVE_KEY
} from './game-constants.js';
import { TradingSystem } from './game-trading.js';

// Save debouncing prevents excessive localStorage writes (max 1 save per second)
const SAVE_DEBOUNCE_MS = 1000;

/**
 * GameStateManager - Manages all game state with event-driven reactivity
 * 
 * Responsibilities:
 * - Initialize new game with default values
 * - Maintain single source of truth for game state
 * - Provide state query methods
 * - Emit events on state mutations for UI reactivity
 * - Support multiple subscribers per event type
 */
export class GameStateManager {
    constructor(starData, wormholeData) {
        this.starData = starData;
        this.wormholeData = wormholeData;
        
        // Supports multiple UI components subscribing to same state changes
        this.subscribers = {
            creditsChanged: [],
            debtChanged: [],
            fuelChanged: [],
            cargoChanged: [],
            locationChanged: [],
            timeChanged: [],
            priceKnowledgeChanged: []
        };
        
        // Initialize with null state (will be set by initNewGame or loadGame)
        this.state = null;
        
        // Track last save time for debouncing (Requirement 10.6)
        this.lastSaveTime = 0;
    }
    
    /**
     * Initialize a new game with default values
     * Requirements: 1.4, 1.5, 3.1
     */
    initNewGame() {
        // Get Sol's grain price for initial cargo
        const solSystem = this.starData.find(s => s.id === SOL_SYSTEM_ID);
        const solGrainPrice = this.calculateGoodPrice('grain', solSystem.type);
        
        // Calculate all Sol prices for price knowledge initialization
        const solPrices = {};
        for (const goodType of Object.keys(BASE_PRICES)) {
            solPrices[goodType] = this.calculateGoodPrice(goodType, solSystem.type);
        }
        
        this.state = {
            player: {
                credits: 500,
                debt: 10000,
                currentSystem: SOL_SYSTEM_ID,
                daysElapsed: 0
            },
            ship: {
                name: "Serendipity",
                fuel: 100,
                cargoCapacity: 50,
                cargo: [
                    {
                        good: 'grain',
                        qty: 20,
                        purchasePrice: solGrainPrice
                    }
                ]
            },
            world: {
                visitedSystems: [SOL_SYSTEM_ID],
                priceKnowledge: {
                    [SOL_SYSTEM_ID]: {
                        lastVisit: 0,
                        prices: solPrices
                    }
                }
            },
            meta: {
                version: GAME_VERSION,
                timestamp: Date.now()
            }
        };
        
        // Only log in non-test environments
        if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
            console.log('New game initialized:', this.state);
        }
        
        // Emit all initial state events
        this.emit('creditsChanged', this.state.player.credits);
        this.emit('debtChanged', this.state.player.debt);
        this.emit('fuelChanged', this.state.ship.fuel);
        this.emit('cargoChanged', this.state.ship.cargo);
        this.emit('locationChanged', this.state.player.currentSystem);
        this.emit('timeChanged', this.state.player.daysElapsed);
        this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
        
        return this.state;
    }
    
    /**
     * Calculate good price based on spectral class
     * Requirements: 7.2
     */
    calculateGoodPrice(goodType, spectralClass) {
        const basePrice = BASE_PRICES[goodType] || 10;
        const spectralLetter = spectralClass.charAt(0).toUpperCase();
        const modifier = SPECTRAL_MODIFIERS[spectralLetter]?.[goodType] || 1.0;
        
        return Math.round(basePrice * modifier);
    }
    
    // ========================================================================
    // EVENT SYSTEM
    // ========================================================================
    
    /**
     * Subscribe to state change events
     * @param {string} eventType - One of: creditsChanged, debtChanged, fuelChanged, cargoChanged, locationChanged, timeChanged
     * @param {function} callback - Function to call when event occurs
     */
    subscribe(eventType, callback) {
        if (!this.subscribers[eventType]) {
            console.warn(`Unknown event type: ${eventType}`);
            return;
        }
        
        this.subscribers[eventType].push(callback);
        if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
            console.log(`Subscribed to ${eventType}, total subscribers: ${this.subscribers[eventType].length}`);
        }
    }
    
    unsubscribe(eventType, callback) {
        if (!this.subscribers[eventType]) {
            return;
        }
        
        const index = this.subscribers[eventType].indexOf(callback);
        if (index > -1) {
            this.subscribers[eventType].splice(index, 1);
        }
    }
    
    emit(eventType, data) {
        if (!this.subscribers[eventType]) {
            return;
        }
        
        this.subscribers[eventType].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in ${eventType} subscriber:`, error);
            }
        });
    }
    
    // ========================================================================
    // STATE QUERIES
    // ========================================================================
    
    getState() {
        return this.state;
    }
    
    getPlayer() {
        return this.state?.player;
    }
    
    getShip() {
        return this.state?.ship;
    }
    
    getCurrentSystem() {
        const systemId = this.state?.player.currentSystem;
        return this.starData.find(s => s.id === systemId);
    }
    
    getCargoUsed() {
        if (!this.state?.ship.cargo) return 0;
        return this.state.ship.cargo.reduce((total, stack) => total + stack.qty, 0);
    }
    
    getCargoRemaining() {
        return this.state?.ship.cargoCapacity - this.getCargoUsed();
    }
    
    isSystemVisited(systemId) {
        return this.state?.world.visitedSystems.includes(systemId);
    }
    
    /**
     * Get price knowledge database
     * Requirements: 3.4, 3.5
     */
    getPriceKnowledge() {
        return this.state?.world.priceKnowledge || {};
    }
    
    /**
     * Get known prices for a specific system
     * Requirements: 3.4, 3.5
     */
    getKnownPrices(systemId) {
        return this.state?.world.priceKnowledge?.[systemId]?.prices || null;
    }
    
    /**
     * Check if player has price knowledge for a system
     * Requirements: 3.4, 3.5
     */
    hasVisitedSystem(systemId) {
        return this.state?.world.priceKnowledge?.[systemId] !== undefined;
    }
    
    // ========================================================================
    // STATE MUTATIONS
    // ========================================================================
    
    updateCredits(newCredits) {
        if (!this.state) return;
        
        this.state.player.credits = newCredits;
        this.emit('creditsChanged', newCredits);
    }
    
    updateDebt(newDebt) {
        if (!this.state) return;
        
        this.state.player.debt = newDebt;
        this.emit('debtChanged', newDebt);
    }
    
    updateFuel(newFuel) {
        if (!this.state) return;
        
        if (newFuel < 0 || newFuel > 100) {
            throw new Error(`Invalid fuel value: ${newFuel}. Fuel must be between 0 and 100.`);
        }
        
        this.state.ship.fuel = newFuel;
        this.emit('fuelChanged', newFuel);
    }
    
    updateCargo(newCargo) {
        if (!this.state) return;
        
        this.state.ship.cargo = newCargo;
        this.emit('cargoChanged', newCargo);
    }
    
    updateLocation(newSystemId) {
        if (!this.state) return;
        
        this.state.player.currentSystem = newSystemId;
        
        // Track exploration progress for future features (price discovery, missions)
        if (!this.state.world.visitedSystems.includes(newSystemId)) {
            this.state.world.visitedSystems.push(newSystemId);
        }
        
        this.emit('locationChanged', newSystemId);
    }
    
    updateTime(newDays) {
        if (!this.state) return;
        
        const oldDays = this.state.player.daysElapsed;
        this.state.player.daysElapsed = newDays;
        
        // When days advance, update price knowledge
        if (newDays > oldDays) {
            const daysPassed = newDays - oldDays;
            
            // Increment staleness for all systems
            this.incrementPriceKnowledgeStaleness(daysPassed);
            
            // Recalculate prices with new day number (for daily fluctuations)
            this.recalculatePricesForKnownSystems();
        }
        
        this.emit('timeChanged', newDays);
    }
    
    /**
     * Update price knowledge for a system
     * Requirements: 3.2, 3.3
     * 
     * @param {number} systemId - System ID
     * @param {Object} prices - Price object with all commodity prices
     * @param {number} lastVisit - Days since last visit (0 = current)
     */
    updatePriceKnowledge(systemId, prices, lastVisit = 0) {
        if (!this.state) return;
        
        if (!this.state.world.priceKnowledge) {
            this.state.world.priceKnowledge = {};
        }
        
        this.state.world.priceKnowledge[systemId] = {
            lastVisit: lastVisit,
            prices: { ...prices }
        };
        
        this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
    }
    
    /**
     * Increment lastVisit counter for all systems in price knowledge
     * Requirements: 3.6
     * 
     * Called automatically when time advances
     * 
     * @param {number} days - Number of days to increment (default 1)
     */
    incrementPriceKnowledgeStaleness(days = 1) {
        if (!this.state?.world.priceKnowledge) return;
        
        for (const systemId in this.state.world.priceKnowledge) {
            this.state.world.priceKnowledge[systemId].lastVisit += days;
        }
        
        this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
    }
    
    /**
     * Recalculate prices for all systems in price knowledge
     * Requirements: 2.1
     * 
     * Called automatically when day changes to update prices with daily fluctuations.
     * Currently uses static price calculation; will use dynamic calculation once
     * TradingSystem.calculatePrice() is extended with daily fluctuation support.
     */
    recalculatePricesForKnownSystems() {
        if (!this.state?.world.priceKnowledge) return;
        
        const currentDay = this.state.player.daysElapsed;
        const activeEvents = this.state.world.activeEvents || [];
        
        // Recalculate prices for each system in price knowledge
        for (const systemIdStr in this.state.world.priceKnowledge) {
            const systemId = parseInt(systemIdStr);
            const system = this.starData.find(s => s.id === systemId);
            
            if (system) {
                const newPrices = {};
                
                // Calculate new prices for all commodities
                for (const goodType of Object.keys(BASE_PRICES)) {
                    // Use TradingSystem.calculatePrice if available with daily fluctuation support
                    // Otherwise fall back to current price calculation
                    if (typeof TradingSystem !== 'undefined' && 
                        typeof TradingSystem.calculatePrice === 'function') {
                        newPrices[goodType] = TradingSystem.calculatePrice(
                            goodType, 
                            system, 
                            currentDay, 
                            activeEvents
                        );
                    } else {
                        // Fallback to current static calculation
                        newPrices[goodType] = this.calculateGoodPrice(goodType, system.type);
                    }
                }
                
                // Update prices while preserving lastVisit
                this.state.world.priceKnowledge[systemId].prices = newPrices;
            }
        }
        
        this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
    }
    
    // ========================================================================
    // TRADING OPERATIONS
    // ========================================================================
    
    /**
     * Execute a purchase transaction
     * Requirements: 7.4, 7.5, 7.6, 7.11, 7.12, 7.15
     */
    buyGood(goodType, quantity, price) {
        if (!this.state) {
            return { success: false, reason: 'No game state' };
        }
        
        const credits = this.state.player.credits;
        const cargoSpace = this.getCargoRemaining();
        
        const validation = this.validatePurchase(credits, cargoSpace, quantity, price);
        if (!validation.valid) {
            return { success: false, reason: validation.reason };
        }
        
        const totalCost = quantity * price;
        this.updateCredits(credits - totalCost);
        
        const newCargo = this.addCargoStack(
            this.state.ship.cargo,
            goodType,
            quantity,
            price
        );
        this.updateCargo(newCargo);
        
        // Persist immediately - trade transactions modify credits and cargo (Requirement 7.15)
        this.saveGame();
        
        return { success: true };
    }
    
    validatePurchase(credits, cargoSpace, quantity, price) {
        const totalCost = quantity * price;
        
        if (totalCost > credits) {
            return {
                valid: false,
                reason: 'Insufficient credits'
            };
        }
        
        if (quantity > cargoSpace) {
            return {
                valid: false,
                reason: 'Not enough cargo space'
            };
        }
        
        return { valid: true };
    }
    
    /**
     * Add a cargo stack for a purchase
     * Requirements: 7.5, 7.6
     * 
     * Delegates to TradingSystem for consolidation logic
     */
    addCargoStack(cargo, goodType, quantity, price) {
        return TradingSystem.addCargoStack(cargo, goodType, quantity, price);
    }
    
    /**
     * Execute a sale transaction from a specific cargo stack
     * Requirements: 7.3, 7.9, 7.10, 7.15
     */
    sellGood(stackIndex, quantity, salePrice) {
        if (!this.state) {
            return { success: false, reason: 'No game state' };
        }
        
        const cargo = this.state.ship.cargo;
        
        const validation = this.validateSale(cargo, stackIndex, quantity);
        if (!validation.valid) {
            return { success: false, reason: validation.reason };
        }
        
        const stack = cargo[stackIndex];
        const totalRevenue = quantity * salePrice;
        const profitMargin = salePrice - stack.purchasePrice;
        
        const currentCredits = this.state.player.credits;
        this.updateCredits(currentCredits + totalRevenue);
        
        const newCargo = this.removeFromCargoStack(cargo, stackIndex, quantity);
        this.updateCargo(newCargo);
        
        // Persist immediately - trade transactions modify credits and cargo (Requirement 7.15)
        this.saveGame();
        
        return { 
            success: true, 
            profitMargin: profitMargin 
        };
    }
    
    validateSale(cargo, stackIndex, quantity) {
        if (!Array.isArray(cargo) || stackIndex < 0 || stackIndex >= cargo.length) {
            return {
                valid: false,
                reason: 'Invalid cargo stack'
            };
        }
        
        const stack = cargo[stackIndex];
        if (quantity > stack.qty) {
            return {
                valid: false,
                reason: 'Not enough quantity in stack'
            };
        }
        
        if (quantity <= 0) {
            return {
                valid: false,
                reason: 'Quantity must be positive'
            };
        }
        
        return { valid: true };
    }
    
    /**
     * Decreases quantity in stack; removes stack if empty
     * Requirements: 7.10
     */
    removeFromCargoStack(cargo, stackIndex, quantity) {
        const updatedCargo = [...cargo];
        const stack = { ...updatedCargo[stackIndex] };
        
        stack.qty -= quantity;
        
        // Remove stack if empty (Requirement 7.10)
        if (stack.qty <= 0) {
            updatedCargo.splice(stackIndex, 1);
        } else {
            updatedCargo[stackIndex] = stack;
        }
        
        return updatedCargo;
    }
    
    // ========================================================================
    // REFUEL SYSTEM
    // ========================================================================
    
    /**
     * Calculate fuel price based on system distance from Sol
     * Requirements: 8.2, 8.3, 8.4, 8.5
     * 
     * @param {number} systemId - System ID to check
     * @returns {number} Fuel price per percentage point
     */
    getFuelPrice(systemId) {
        if (FUEL_PRICING.CORE_SYSTEMS.IDS.includes(systemId)) {
            return FUEL_PRICING.CORE_SYSTEMS.PRICE;
        }
        
        const system = this.starData.find(s => s.id === systemId);
        if (!system) {
            return FUEL_PRICING.MID_RANGE.PRICE;
        }
        
        const distanceFromSol = calculateDistanceFromSol(system);
        
        if (distanceFromSol >= FUEL_PRICING.MID_RANGE.MIN_DISTANCE && 
            distanceFromSol < FUEL_PRICING.MID_RANGE.MAX_DISTANCE) {
            return FUEL_PRICING.MID_RANGE.PRICE;
        }
        
        if (distanceFromSol >= FUEL_PRICING.OUTER.MIN_DISTANCE) {
            return FUEL_PRICING.OUTER.PRICE;
        }
        
        return FUEL_PRICING.INNER.PRICE;
    }
    
    /**
     * Validate refuel transaction
     * Requirements: 8.7, 8.8
     * 
     * @param {number} currentFuel - Current fuel percentage
     * @param {number} amount - Amount to refuel (percentage points)
     * @param {number} credits - Player's current credits
     * @param {number} pricePerPercent - Fuel price per percentage point
     * @returns {Object} { valid: boolean, reason: string, cost: number }
     */
    validateRefuel(currentFuel, amount, credits, pricePerPercent) {
        // Calculate total cost (Requirement 8.6)
        const totalCost = amount * pricePerPercent;
        
        // Check capacity constraint (Requirement 8.7)
        // Use small epsilon for floating point comparison
        if (currentFuel + amount > 100.01) {
            return {
                valid: false,
                reason: 'Cannot refuel beyond 100% capacity',
                cost: totalCost
            };
        }
        
        // Check credit constraint (Requirement 8.8)
        if (totalCost > credits) {
            return {
                valid: false,
                reason: 'Insufficient credits for refuel',
                cost: totalCost
            };
        }
        
        // Check for valid amount
        if (amount <= 0) {
            return {
                valid: false,
                reason: 'Refuel amount must be positive',
                cost: totalCost
            };
        }
        
        return {
            valid: true,
            reason: null,
            cost: totalCost
        };
    }
    
    /**
     * Execute refuel transaction
     * Requirements: 8.9, 8.10
     * 
     * @param {number} amount - Amount to refuel (percentage points)
     * @returns {Object} { success: boolean, reason: string }
     */
    refuel(amount) {
        if (!this.state) {
            return { success: false, reason: 'No game state' };
        }
        
        const currentFuel = this.state.ship.fuel;
        const credits = this.state.player.credits;
        const systemId = this.state.player.currentSystem;
        
        const pricePerPercent = this.getFuelPrice(systemId);
        const validation = this.validateRefuel(currentFuel, amount, credits, pricePerPercent);
        
        if (!validation.valid) {
            return { success: false, reason: validation.reason };
        }
        
        this.updateCredits(credits - validation.cost);
        this.updateFuel(currentFuel + amount);
        
        // Persist immediately - refuel modifies credits and fuel (Requirement 8.10)
        this.saveGame();
        
        return { success: true, reason: null };
    }
    
    // ========================================================================
    // DOCK/UNDOCK OPERATIONS
    // ========================================================================
    
    /**
     * Dock at current system's station to access trading and refueling
     * Requirements: 10.5, 3.2, 3.3
     * 
     * Updates price knowledge on dock:
     * - First visit: Records current prices with lastVisit = daysElapsed
     * - Subsequent visits: Updates prices and resets lastVisit to 0
     */
    dock() {
        if (!this.state) {
            return { success: false, reason: 'No game state' };
        }
        
        const currentSystemId = this.state.player.currentSystem;
        const currentSystem = this.starData.find(s => s.id === currentSystemId);
        
        if (currentSystem) {
            // Calculate current prices for all commodities
            const currentPrices = {};
            for (const goodType of Object.keys(BASE_PRICES)) {
                currentPrices[goodType] = this.calculateGoodPrice(goodType, currentSystem.type);
            }
            
            // Update price knowledge (resets lastVisit to 0)
            this.updatePriceKnowledge(currentSystemId, currentPrices, 0);
        }
        
        // Persist state transition - prevents loss if player closes browser while docked (Requirement 10.5)
        this.saveGame();
        
        return { success: true };
    }
    
    /**
     * Undock from current system's station to resume navigation
     * 
     * Currently a state transition marker for auto-save (Requirement 10.5).
     * Future: Will close station UI, enable jumps, track undocked state.
     */
    undock() {
        if (!this.state) {
            return { success: false, reason: 'No game state' };
        }
        
        // Persist state transition - prevents loss if player closes browser while undocked (Requirement 10.5)
        this.saveGame();
        
        return { success: true };
    }
    
    // ========================================================================
    // SAVE/LOAD SYSTEM
    // ========================================================================
    
    /**
     * Save game state to localStorage with debouncing
     * Requirements: 10.1, 10.2, 10.6
     * 
     * Implements save debouncing to prevent excessive saves (max 1 save per second).
     * This protects against rapid state changes causing performance issues.
     */
    saveGame() {
        if (!this.state) {
            console.error('Cannot save: no game state exists');
            return false;
        }
        
        // Debounce: skip save if less than 1 second since last save
        const now = Date.now();
        if (now - this.lastSaveTime < SAVE_DEBOUNCE_MS) {
            if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
                console.log('Save debounced (too soon since last save)');
            }
            return false;
        }
        
        try {
            this.state.meta.timestamp = now;
            const saveData = JSON.stringify(this.state);
            localStorage.setItem(SAVE_KEY, saveData);
            
            this.lastSaveTime = now;
            
            if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
                console.log('Game saved successfully');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }
    
    /**
     * Load game state from localStorage
     * Requirements: 1.6, 10.7, 10.8, 10.9, 10.10
     */
    loadGame() {
        try {
            // Retrieve save data from localStorage
            const saveData = localStorage.getItem(SAVE_KEY);
            
            if (!saveData) {
                if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
                    console.log('No saved game found');
                }
                return null;
            }
            
            const loadedState = JSON.parse(saveData);
            
            if (!this.isVersionCompatible(loadedState.meta?.version)) {
                if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
                    console.warn('Save version incompatible, starting new game');
                }
                return null;
            }
            
            if (!this.validateStateStructure(loadedState)) {
                if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
                    console.warn('Save data corrupted, starting new game');
                }
                return null;
            }
            
            this.state = loadedState;
            
            // Initialize priceKnowledge if missing (backward compatibility)
            if (!this.state.world.priceKnowledge) {
                this.state.world.priceKnowledge = {};
                
                // Record current system's prices
                const currentSystemId = this.state.player.currentSystem;
                const currentSystem = this.starData.find(s => s.id === currentSystemId);
                
                if (currentSystem) {
                    const currentPrices = {};
                    for (const goodType of Object.keys(BASE_PRICES)) {
                        currentPrices[goodType] = this.calculateGoodPrice(goodType, currentSystem.type);
                    }
                    this.state.world.priceKnowledge[currentSystemId] = {
                        lastVisit: 0,
                        prices: currentPrices
                    };
                }
            }
            
            if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
                console.log('Game loaded successfully');
            }
            
            // Emit all state events to update UI
            this.emit('creditsChanged', this.state.player.credits);
            this.emit('debtChanged', this.state.player.debt);
            this.emit('fuelChanged', this.state.ship.fuel);
            this.emit('cargoChanged', this.state.ship.cargo);
            this.emit('locationChanged', this.state.player.currentSystem);
            this.emit('timeChanged', this.state.player.daysElapsed);
            this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
            
            return this.state;
        } catch (error) {
            if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
                console.error('Failed to load game:', error);
            }
            return null;
        }
    }
    
    /**
     * Check if saved game exists
     * Requirements: 1.1
     */
    hasSavedGame() {
        try {
            const saveData = localStorage.getItem(SAVE_KEY);
            return saveData !== null;
        } catch (error) {
            console.error('Failed to check for saved game:', error);
            return false;
        }
    }
    
    clearSave() {
        try {
            localStorage.removeItem(SAVE_KEY);
            if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
                console.log('Save data cleared');
            }
            return true;
        } catch (error) {
            console.error('Failed to clear save:', error);
            return false;
        }
    }
    
    /**
     * Check if save version is compatible with current version
     * Requirements: 10.10
     */
    isVersionCompatible(saveVersion) {
        if (!saveVersion) return false;
        
        // For now, only exact version match is compatible
        // Future versions may implement migration logic
        return saveVersion === GAME_VERSION;
    }
    
    /**
     * Validate that loaded state has required structure
     * Requirements: 10.9
     */
    validateStateStructure(state) {
        if (!state) return false;
        
        // Check player structure
        if (!state.player || 
            typeof state.player.credits !== 'number' ||
            typeof state.player.debt !== 'number' ||
            typeof state.player.currentSystem !== 'number' ||
            typeof state.player.daysElapsed !== 'number') {
            return false;
        }
        
        // Check ship structure
        if (!state.ship ||
            typeof state.ship.name !== 'string' ||
            typeof state.ship.fuel !== 'number' ||
            typeof state.ship.cargoCapacity !== 'number' ||
            !Array.isArray(state.ship.cargo)) {
            return false;
        }
        
        // Check cargo stacks
        for (const stack of state.ship.cargo) {
            if (!stack.good || 
                typeof stack.qty !== 'number' ||
                typeof stack.purchasePrice !== 'number') {
                return false;
            }
        }
        
        // Check world structure
        if (!state.world || !Array.isArray(state.world.visitedSystems)) {
            return false;
        }
        
        // Check priceKnowledge structure (optional for backward compatibility)
        if (state.world.priceKnowledge !== undefined) {
            if (typeof state.world.priceKnowledge !== 'object') {
                return false;
            }
            
            // Validate each price knowledge entry
            for (const systemId in state.world.priceKnowledge) {
                const knowledge = state.world.priceKnowledge[systemId];
                if (!knowledge || 
                    typeof knowledge.lastVisit !== 'number' ||
                    typeof knowledge.prices !== 'object') {
                    return false;
                }
            }
        }
        
        // Check meta structure
        if (!state.meta || 
            typeof state.meta.version !== 'string' ||
            typeof state.meta.timestamp !== 'number') {
            return false;
        }
        
        return true;
    }
}
