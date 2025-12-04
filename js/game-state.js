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
                version: '1.0.0',
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
        const BASE_PRICES = {
            grain: 10,
            ore: 15,
            tritium: 50,
            parts: 30,
            medicine: 40,
            electronics: 35
        };
        
        const SPECTRAL_MODIFIERS = {
            'G': { grain: 0.8, ore: 1.0, tritium: 1.2, parts: 1.0, medicine: 1.0, electronics: 1.0 },
            'K': { grain: 1.0, ore: 0.9, tritium: 1.1, parts: 1.0, medicine: 1.0, electronics: 1.0 },
            'M': { grain: 1.2, ore: 0.8, tritium: 1.0, parts: 1.1, medicine: 1.0, electronics: 1.0 },
            'A': { grain: 0.9, ore: 1.1, tritium: 1.3, parts: 1.2, medicine: 1.1, electronics: 1.2 },
            'F': { grain: 0.85, ore: 1.05, tritium: 1.25, parts: 1.1, medicine: 1.05, electronics: 1.1 },
            'O': { grain: 1.0, ore: 1.2, tritium: 1.5, parts: 1.3, medicine: 1.2, electronics: 1.3 },
            'B': { grain: 0.95, ore: 1.15, tritium: 1.4, parts: 1.25, medicine: 1.15, electronics: 1.25 },
            'L': { grain: 1.3, ore: 0.7, tritium: 0.9, parts: 1.2, medicine: 0.9, electronics: 0.8 },
            'T': { grain: 1.4, ore: 0.6, tritium: 0.8, parts: 1.3, medicine: 0.8, electronics: 0.7 },
            'D': { grain: 1.0, ore: 1.0, tritium: 1.0, parts: 1.0, medicine: 1.0, electronics: 1.0 }
        };
        
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
    
    /**
     * Unsubscribe from state change events
     */
    unsubscribe(eventType, callback) {
        if (!this.subscribers[eventType]) {
            return;
        }
        
        const index = this.subscribers[eventType].indexOf(callback);
        if (index > -1) {
            this.subscribers[eventType].splice(index, 1);
        }
    }
    
    /**
     * Emit an event to all subscribers
     */
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
    
    /**
     * Update player credits and emit event
     */
    updateCredits(newCredits) {
        if (!this.state) return;
        
        this.state.player.credits = newCredits;
        this.emit('creditsChanged', newCredits);
    }
    
    /**
     * Update player debt and emit event
     */
    updateDebt(newDebt) {
        if (!this.state) return;
        
        this.state.player.debt = newDebt;
        this.emit('debtChanged', newDebt);
    }
    
    /**
     * Update ship fuel and emit event
     */
    updateFuel(newFuel) {
        if (!this.state) return;
        
        // Clamp fuel to 0-100 range
        this.state.ship.fuel = Math.max(0, Math.min(100, newFuel));
        this.emit('fuelChanged', this.state.ship.fuel);
    }
    
    /**
     * Update cargo and emit event
     */
    updateCargo(newCargo) {
        if (!this.state) return;
        
        this.state.ship.cargo = newCargo;
        this.emit('cargoChanged', newCargo);
    }
    
    /**
     * Update current system and emit event
     */
    updateLocation(newSystemId) {
        if (!this.state) return;
        
        this.state.player.currentSystem = newSystemId;
        
        // Add to visited systems if not already visited
        if (!this.state.world.visitedSystems.includes(newSystemId)) {
            this.state.world.visitedSystems.push(newSystemId);
        }
        
        this.emit('locationChanged', newSystemId);
    }
    
    /**
     * Update days elapsed and emit event
     */
    updateTime(newDays) {
        if (!this.state) return;
        
        this.state.player.daysElapsed = newDays;
        this.emit('timeChanged', newDays);
    }
    
    // ========================================================================
    // TRADING OPERATIONS
    // ========================================================================
    
    /**
     * Buy goods at current station
     * Requirements: 7.4, 7.5, 7.6, 7.11, 7.12
     * 
     * @param {string} goodType - Type of good to buy
     * @param {number} quantity - Quantity to purchase
     * @param {number} price - Price per unit at current station
     * @returns {Object} { success: boolean, reason?: string }
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
    
    /**
     * Validate if a purchase is possible
     * Requirements: 7.11, 7.12
     */
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
     * Always creates a separate stack (even if same good exists at different price).
     */
    addCargoStack(cargo, goodType, quantity, price) {
        const newStack = {
            good: goodType,
            qty: quantity,
            purchasePrice: price
        };
        
        return [...cargo, newStack];
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
            localStorage.setItem('trampFreighterSave', saveData);
            
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
            const saveData = localStorage.getItem('trampFreighterSave');
            
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
            const saveData = localStorage.getItem('trampFreighterSave');
            return saveData !== null;
        } catch (error) {
            console.error('Failed to check for saved game:', error);
            return false;
        }
    }
    
    /**
     * Clear saved game from localStorage
     */
    clearSave() {
        try {
            localStorage.removeItem('trampFreighterSave');
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
        
        const CURRENT_VERSION = '1.0.0';
        
        // For now, only exact version match is compatible
        // Future versions may implement migration logic
        return saveVersion === CURRENT_VERSION;
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
