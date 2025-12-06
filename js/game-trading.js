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
     * Calculate price for a good at a given spectral class
     * Requirements: 7.2
     * 
     * @param {string} goodType - One of: grain, ore, tritium, parts, medicine, electronics
     * @param {string} spectralClass - Spectral class string (e.g., "G2V", "M3V")
     * @returns {number} Calculated price (basePrice × spectralModifier)
     */
    static calculatePrice(goodType, spectralClass) {
        const basePrice = TradingSystem.BASE_PRICES[goodType];
        if (basePrice === undefined) {
            throw new Error(`Unknown good type: ${goodType}`);
        }
        
        // Extract spectral letter (first character)
        const spectralLetter = spectralClass.charAt(0).toUpperCase();
        
        // Get modifier for this spectral class and good type
        const modifiers = TradingSystem.SPECTRAL_MODIFIERS[spectralLetter];
        const modifier = modifiers?.[goodType] || 1.0;
        
        // Calculate and round to nearest integer
        return Math.round(basePrice * modifier);
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
     * @returns {Array} Updated cargo array
     */
    static addCargoStack(cargo, goodType, quantity, price) {
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
