import { SeededRandom } from './seeded-random.js';

/**
 * TradingSystem - Handles commodity trading, price calculations, and cargo management
 */
export class TradingSystem {
    static BASE_PRICES = {
        grain: 10,
        ore: 15,
        tritium: 50,
        parts: 30,
        medicine: 40,
        electronics: 35
    };
    
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
     * Calculate price with all modifiers (production, station count, daily fluctuation, events)
     * 
     * Phase 1/2 backward compatibility: accepts either spectral class string or full system object
     */
    static calculatePrice(goodType, systemOrSpectralClass, currentDay = 0, activeEvents = []) {
        const basePrice = TradingSystem.BASE_PRICES[goodType];
        if (basePrice === undefined) {
            throw new Error(`Unknown good type: ${goodType}`);
        }
        
        const isPhase1 = typeof systemOrSpectralClass === 'string';
        
        if (isPhase1) {
            const spectralClass = systemOrSpectralClass;
            const productionMod = TradingSystem.getProductionModifier(goodType, spectralClass);
            return Math.round(basePrice * productionMod);
        }
        
        const system = systemOrSpectralClass;
        const productionMod = TradingSystem.getProductionModifier(goodType, system.type);
        const stationMod = TradingSystem.getStationCountModifier(system.st || 0);
        const dailyMod = TradingSystem.getDailyFluctuation(system.id, goodType, currentDay);
        const eventMod = TradingSystem.getEventModifier(system.id, goodType, activeEvents);
        
        const price = basePrice * productionMod * stationMod * dailyMod * eventMod;
        return Math.round(price);
    }
    
    static getProductionModifier(goodType, spectralClass) {
        const spectralLetter = spectralClass.charAt(0).toUpperCase();
        const modifiers = TradingSystem.SPECTRAL_MODIFIERS[spectralLetter];
        return modifiers?.[goodType] || 1.0;
    }
    
    static getStationCountModifier(stationCount) {
        return 1.0 + (stationCount * 0.05);
    }
    
    /**
     * Deterministic daily price fluctuation using seeded random
     * Seed format ensures same system/good/day always produces same fluctuation
     * 
     * Uses ±30% range (0.70 to 1.30) to ensure price changes are visible
     * after integer rounding, making the dynamic economy feel responsive.
     */
    static getDailyFluctuation(systemId, goodType, currentDay) {
        const seed = `${systemId}_${goodType}_${currentDay}`;
        const rng = new SeededRandom(seed);
        const value = rng.next();
        return 0.70 + (value * 0.6);
    }
    
    static getEventModifier(systemId, goodType, activeEvents) {
        if (!Array.isArray(activeEvents)) {
            return 1.0;
        }
        
        const activeEvent = activeEvents.find(event => event.systemId === systemId);
        if (!activeEvent || !activeEvent.modifiers) {
            return 1.0;
        }
        
        return activeEvent.modifiers[goodType] || 1.0;
    }
    
    static calculateCargoUsed(cargo) {
        if (!Array.isArray(cargo)) {
            return 0;
        }
        
        return cargo.reduce((total, stack) => {
            return total + (stack.qty || 0);
        }, 0);
    }
    
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
     * Consolidates cargo into existing stack if same good and price, otherwise creates new stack
     */
    static addCargoStack(cargo, goodType, quantity, price, systemId = null, day = null) {
        const existingStackIndex = cargo.findIndex(
            stack => stack.good === goodType && stack.purchasePrice === price
        );
        
        if (existingStackIndex !== -1) {
            const updatedCargo = [...cargo];
            updatedCargo[existingStackIndex] = {
                ...updatedCargo[existingStackIndex],
                qty: updatedCargo[existingStackIndex].qty + quantity
            };
            return updatedCargo;
        }
        
        const newStack = {
            good: goodType,
            qty: quantity,
            purchasePrice: price
        };
        
        if (systemId !== null) {
            newStack.purchaseSystem = systemId;
        }
        if (day !== null) {
            newStack.purchaseDay = day;
        }
        
        return [...cargo, newStack];
    }
    
    /**
     * Removes stack entirely if quantity reaches zero
     */
    static removeFromCargoStack(cargo, stackIndex, quantity) {
        const updatedCargo = [...cargo];
        const stack = updatedCargo[stackIndex];
        stack.qty -= quantity;
        
        if (stack.qty <= 0) {
            updatedCargo.splice(stackIndex, 1);
        }
        
        return updatedCargo;
    }
}
