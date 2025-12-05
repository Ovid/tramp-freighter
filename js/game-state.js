import { BASE_PRICES, SPECTRAL_MODIFIERS, GAME_VERSION, SAVE_KEY } from './game-constants.js';

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
        
        // Event subscribers: { eventType: [callback1, callback2, ...] }
        this.subscribers = {
            'creditsChanged': [],
            'debtChanged': [],
            'fuelChanged': [],
            'cargoChanged': [],
            'locationChanged': [],
            'timeChanged': []
        };
        
        // Initialize with null state (will be set by initNewGame or loadGame)
        this.state = null;
    }
    
    /**
     * Initialize a new game with default values
     * Requirements: 1.4, 1.5
     */
    initNewGame() {
        // Get Sol's grain price for initial cargo
        const solSystem = this.starData.find(s => s.id === 0);
        const solGrainPrice = this.calculateGoodPrice('grain', solSystem.type);
        
        this.state = {
            player: {
                credits: 500,
                debt: 10000,
                currentSystem: 0,  // Sol
                daysElapsed: 0
            },
            ship: {
                name: "Serendipity",
                fuel: 100,  // 100%
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
                visitedSystems: [0]  // Sol is visited at start
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
        
        // Clamp to valid percentage range to prevent invalid states
        this.state.ship.fuel = Math.max(0, Math.min(100, newFuel));
        this.emit('fuelChanged', this.state.ship.fuel);
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
        
        this.state.player.daysElapsed = newDays;
        this.emit('timeChanged', newDays);
    }
    
    // ========================================================================
    // TRADING OPERATIONS
    // ========================================================================
    
    /**
     * Execute a purchase transaction
     * Requirements: 7.4, 7.5, 7.6, 7.11, 7.12
     */
    buyGood(goodType, quantity, price) {
        if (!this.state) {
            return { success: false, reason: 'No game state' };
        }
        
        const credits = this.state.player.credits;
        const cargoSpace = this.getCargoRemaining();
        
        // Validate purchase using TradingSystem
        const validation = this.validatePurchase(credits, cargoSpace, quantity, price);
        if (!validation.valid) {
            return { success: false, reason: validation.reason };
        }
        
        // Calculate total cost
        const totalCost = quantity * price;
        
        // Decrease credits (Requirement 7.4)
        this.updateCredits(credits - totalCost);
        
        // Create new cargo stack (Requirements 7.5, 7.6)
        const newCargo = this.addCargoStack(
            this.state.ship.cargo,
            goodType,
            quantity,
            price
        );
        this.updateCargo(newCargo);
        
        return { success: true };
    }
    
    // Requirements: 7.11, 7.12
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
     * Always creates a separate stack (even if same good exists at different price)
     * Requirements: 7.5, 7.6
     */
    addCargoStack(cargo, goodType, quantity, price) {
        const newStack = {
            good: goodType,
            qty: quantity,
            purchasePrice: price
        };
        
        return [...cargo, newStack];
    }
    
    /**
     * Execute a sale transaction from a specific cargo stack
     * Requirements: 7.3, 7.9, 7.10
     */
    sellGood(stackIndex, quantity, salePrice) {
        if (!this.state) {
            return { success: false, reason: 'No game state' };
        }
        
        const cargo = this.state.ship.cargo;
        
        // Validate sale
        const validation = this.validateSale(cargo, stackIndex, quantity);
        if (!validation.valid) {
            return { success: false, reason: validation.reason };
        }
        
        const stack = cargo[stackIndex];
        const totalRevenue = quantity * salePrice;
        
        // Calculate profit margin (sale price - purchase price)
        const profitMargin = salePrice - stack.purchasePrice;
        
        // Increase credits (Requirement 7.9)
        const currentCredits = this.state.player.credits;
        this.updateCredits(currentCredits + totalRevenue);
        
        // Decrease cargo stack quantity (Requirement 7.10)
        const newCargo = this.removeFromCargoStack(cargo, stackIndex, quantity);
        this.updateCargo(newCargo);
        
        return { 
            success: true, 
            profitMargin: profitMargin 
        };
    }
    
    // Requirements: 7.8
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
        // Sol (0) and Alpha Centauri (1) have special pricing
        if (systemId === 0 || systemId === 1) {
            return 2;  // 2 credits per 1%
        }
        
        // Get system and calculate distance from Sol
        const system = this.starData.find(s => s.id === systemId);
        if (!system) {
            return 3;  // Default to mid-range if system not found
        }
        
        const distanceFromSol = this.calculateDistanceFromSol(system);
        
        // Mid-range systems (4.5-10 LY from Sol)
        if (distanceFromSol >= 4.5 && distanceFromSol < 10) {
            return 3;  // 3 credits per 1%
        }
        
        // Outer systems (≥10 LY from Sol)
        if (distanceFromSol >= 10) {
            return 4;  // 4 credits per 1%
        }
        
        // Systems closer than 4.5 LY (but not Sol/Alpha Centauri)
        return 2;  // 2 credits per 1%
    }
    
    /**
     * Calculate distance from Sol for a system
     * Requirements: 3.1
     */
    calculateDistanceFromSol(system) {
        const distanceSquared = system.x * system.x + system.y * system.y + system.z * system.z;
        return Math.sqrt(distanceSquared) / 10;
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
        if (currentFuel + amount > 100) {
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
        
        // Get fuel price for current system
        const pricePerPercent = this.getFuelPrice(systemId);
        
        // Validate refuel
        const validation = this.validateRefuel(currentFuel, amount, credits, pricePerPercent);
        
        if (!validation.valid) {
            return { success: false, reason: validation.reason };
        }
        
        // Execute refuel: decrease credits and increase fuel (Requirement 8.9)
        this.updateCredits(credits - validation.cost);
        this.updateFuel(currentFuel + amount);
        
        // Auto-save after refuel (Requirement 8.10)
        this.saveGame();
        
        return { success: true, reason: null };
    }
    
    // ========================================================================
    // SAVE/LOAD SYSTEM
    // ========================================================================
    
    /**
     * Save game state to localStorage
     * Requirements: 10.1, 10.2
     */
    saveGame() {
        if (!this.state) {
            console.error('Cannot save: no game state exists');
            return false;
        }
        
        try {
            // Update timestamp before saving
            this.state.meta.timestamp = Date.now();
            
            // Serialize state to JSON
            const saveData = JSON.stringify(this.state);
            
            // Store in localStorage
            localStorage.setItem(SAVE_KEY, saveData);
            
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
            
            // Parse JSON
            const loadedState = JSON.parse(saveData);
            
            // Validate version compatibility
            if (!this.isVersionCompatible(loadedState.meta?.version)) {
                if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
                    console.warn('Save version incompatible, starting new game');
                }
                return null;
            }
            
            // Validate state structure
            if (!this.validateStateStructure(loadedState)) {
                if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
                    console.warn('Save data corrupted, starting new game');
                }
                return null;
            }
            
            // Restore state
            this.state = loadedState;
            
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
        
        // Check meta structure
        if (!state.meta || 
            typeof state.meta.version !== 'string' ||
            typeof state.meta.timestamp !== 'number') {
            return false;
        }
        
        return true;
    }
}
