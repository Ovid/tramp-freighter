import { SeededRandom } from './seeded-random.js';

/**
 * TradingSystem - Handles commodity trading, price calculations, and cargo management
 * 
 * Responsibilities:
 * - Calculate commodity prices based on spectral class
 * - Validate buy/sell transactions
 * - Manage cargo stacks with purchase price tracking
 * - Enforce cargo capacity and credit constraints
 */
export class TradingSystem {
    // Base prices for all six goods (Requirements: 7.1)
    static BASE_PRICES = {
        grain: 10,
        ore: 15,
        tritium: 50,
        parts: 30,
        medicine: 40,
        electronics: 35
    };
    
    // Spectral class modifiers for each good type (Requirements: 7.2)
    static SPECTRAL_MODIFIERS = {
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
    
    /**
     * Calculate price for a good at a given system with all modifiers
     * 
     * Supports two signatures for backward compatibility:
     * - Phase 1: calculatePrice(goodType, spectralClass)
     * - Phase 2: calculatePrice(goodType, system, currentDay, activeEvents)
     * 
     * @param {string} goodType - One of: grain, ore, tritium, parts, medicine, electronics
     * @param {Object|string} systemOrSpectralClass - Star system object OR spectral class string
     * @param {number} currentDay - Current game day for daily fluctuation (Phase 2 only)
     * @param {Array} activeEvents - Array of active economic events (Phase 2 only)
     * @returns {number} Calculated price
     */
    static calculatePrice(goodType, systemOrSpectralClass, currentDay = 0, activeEvents = []) {
        const basePrice = TradingSystem.BASE_PRICES[goodType];
        if (basePrice === undefined) {
            throw new Error(`Unknown good type: ${goodType}`);
        }
        
        // Detect if this is Phase 1 (string) or Phase 2 (object) call
        const isPhase1 = typeof systemOrSpectralClass === 'string';
        
        if (isPhase1) {
            // Phase 1: Simple calculation with just spectral class
            const spectralClass = systemOrSpectralClass;
            const productionMod = TradingSystem.getProductionModifier(goodType, spectralClass);
            return Math.round(basePrice * productionMod);
        }
        
        // Phase 2: Full calculation with all modifiers
        const system = systemOrSpectralClass;
        
        // 1. Production modifier (spectral class)
        const productionMod = TradingSystem.getProductionModifier(goodType, system.type);
        
        // 2. Station count modifier
        const stationMod = TradingSystem.getStationCountModifier(system.st || 0);
        
        // 3. Daily fluctuation (±15%)
        const dailyMod = TradingSystem.getDailyFluctuation(system.id, goodType, currentDay);
        
        // 4. Event modifier (if active)
        const eventMod = TradingSystem.getEventModifier(system.id, goodType, activeEvents);
        
        // Final price: multiply all modifiers together
        const price = basePrice * productionMod * stationMod * dailyMod * eventMod;
        
        // Round to nearest integer
        return Math.round(price);
    }
    
    /**
     * Calculate production modifier from spectral class
     * 
     * @param {string} goodType - Commodity type
     * @param {string} spectralClass - System spectral class (e.g., "G2V", "M3V")
     * @returns {number} Production multiplier
     */
    static getProductionModifier(goodType, spectralClass) {
        // Extract spectral letter (first character)
        const spectralLetter = spectralClass.charAt(0).toUpperCase();
        
        // Get modifier for this spectral class and good type
        const modifiers = TradingSystem.SPECTRAL_MODIFIERS[spectralLetter];
        return modifiers?.[goodType] || 1.0;
    }
    
    /**
     * Calculate station count modifier
     * Formula: 1.0 + (stationCount × 0.05)
     * 
     * @param {number} stationCount - Number of stations in system
     * @returns {number} Station multiplier
     */
    static getStationCountModifier(stationCount) {
        return 1.0 + (stationCount * 0.05);
    }
    
    /**
     * Calculate daily fluctuation modifier using seeded random
     * Seed format: "systemId_goodType_day"
     * Range: 0.85 to 1.15 (±15%)
     * 
     * @param {number} systemId - System identifier
     * @param {string} goodType - Commodity type
     * @param {number} currentDay - Current game day
     * @returns {number} Fluctuation multiplier (0.85 to 1.15)
     */
    static getDailyFluctuation(systemId, goodType, currentDay) {
        const seed = `${systemId}_${goodType}_${currentDay}`;
        const rng = new SeededRandom(seed);
        const value = rng.next(); // 0 to 1
        
        // Map to 0.85 to 1.15 (±15%)
        return 0.85 + (value * 0.3);
    }
    
    /**
     * Calculate event modifier for a good at a system
     * 
     * @param {number} systemId - System identifier
     * @param {string} goodType - Commodity type
     * @param {Array} activeEvents - Active economic events
     * @returns {number} Event multiplier (1.0 if no active event)
     */
    static getEventModifier(systemId, goodType, activeEvents) {
        if (!Array.isArray(activeEvents)) {
            return 1.0;
        }
        
        // Find active event for this system
        const activeEvent = activeEvents.find(event => event.systemId === systemId);
        
        if (!activeEvent || !activeEvent.modifiers) {
            return 1.0;
        }
        
        // Return modifier for this good type, or 1.0 if not affected
        return activeEvent.modifiers[goodType] || 1.0;
    }
    
    /**
     * Calculate total cargo capacity used across all stacks
     * Requirements: 7.7
     * 
     * @param {Array} cargo - Array of cargo stacks
     * @returns {number} Total quantity across all stacks
     */
    static calculateCargoUsed(cargo) {
        if (!Array.isArray(cargo)) {
            return 0;
        }
        
        return cargo.reduce((total, stack) => {
            return total + (stack.qty || 0);
        }, 0);
    }
    
    /**
     * Validate if a purchase is possible
     * Requirements: 7.11, 7.12
     * 
     * @param {number} credits - Player's current credits
     * @param {number} cargoSpace - Available cargo space
     * @param {number} quantity - Quantity to purchase
     * @param {number} price - Price per unit
     * @returns {Object} { valid: boolean, reason: string }
     */
    static validatePurchase(credits, cargoSpace, quantity, price) {
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
     * Validate if a sale is possible
     * Requirements: 7.8
     * 
     * @param {Array} cargo - Current cargo stacks
     * @param {number} stackIndex - Index of stack to sell from
     * @param {number} quantity - Quantity to sell
     * @returns {Object} { valid: boolean, reason: string }
     */
    static validateSale(cargo, stackIndex, quantity) {
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
        
        return { valid: true };
    }
    
    /**
     * Add a cargo stack for a purchase
     * Requirements: 7.5, 7.6
     * 
     * If an existing stack has the same good type AND same price, adds to that stack.
     * Otherwise creates a new stack with the purchased good, quantity, and price.
     * 
     * @param {Array} cargo - Current cargo array
     * @param {string} goodType - Type of good purchased
     * @param {number} quantity - Quantity purchased
     * @param {number} price - Price paid per unit
     * @param {number} systemId - System ID where purchased (optional for Phase 1 compatibility)
     * @param {number} day - Game day when purchased (optional for Phase 1 compatibility)
     * @returns {Array} Updated cargo array
     */
    static addCargoStack(cargo, goodType, quantity, price, systemId = null, day = null) {
        // Check if we have an existing stack with same good and same price
        const existingStackIndex = cargo.findIndex(
            stack => stack.good === goodType && stack.purchasePrice === price
        );
        
        if (existingStackIndex !== -1) {
            // Consolidate into existing stack
            const updatedCargo = [...cargo];
            updatedCargo[existingStackIndex] = {
                ...updatedCargo[existingStackIndex],
                qty: updatedCargo[existingStackIndex].qty + quantity
            };
            return updatedCargo;
        }
        
        // Create new stack if no match found
        const newStack = {
            good: goodType,
            qty: quantity,
            purchasePrice: price
        };
        
        // Add Phase 2 metadata if provided
        if (systemId !== null) {
            newStack.purchaseSystem = systemId;
        }
        if (day !== null) {
            newStack.purchaseDay = day;
        }
        
        return [...cargo, newStack];
    }
    
    /**
     * Remove quantity from a cargo stack
     * Requirements: 7.10
     * 
     * Decreases the quantity in the specified stack.
     * If quantity reaches 0, the stack is removed.
     * 
     * @param {Array} cargo - Current cargo array
     * @param {number} stackIndex - Index of stack to sell from
     * @param {number} quantity - Quantity to remove
     * @returns {Array} Updated cargo array
     */
    static removeFromCargoStack(cargo, stackIndex, quantity) {
        const updatedCargo = [...cargo];
        const stack = updatedCargo[stackIndex];
        
        stack.qty -= quantity;
        
        // Remove stack if empty
        if (stack.qty <= 0) {
            updatedCargo.splice(stackIndex, 1);
        }
        
        return updatedCargo;
    }
}
