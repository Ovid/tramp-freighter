import { BASE_PRICES } from './game-constants.js';
import { TradingSystem } from './game-trading.js';

/**
 * Information Broker pricing constants
 * 
 * The information broker sells market intelligence to players, allowing them
 * to make informed trading decisions without visiting every system.
 */
const PRICES = {
    RECENT_VISIT: 50,      // System visited within RECENT_THRESHOLD days
    NEVER_VISITED: 100,    // System never visited
    STALE_VISIT: 75,       // System visited more than RECENT_THRESHOLD days ago
    RUMOR: 25              // Market rumor/hint
};

const RECENT_THRESHOLD = 30;  // Days to consider a visit "recent"

/**
 * InformationBroker - Handles market intelligence purchases and rumor generation
 * 
 * Provides players with price data for systems they haven't visited recently,
 * creating a strategic layer around information gathering and trading decisions.
 */
export class InformationBroker {
    
    /**
     * Calculate intelligence cost for a system based on visit history
     * 
     * @param {number} systemId - Target system ID
     * @param {Object} priceKnowledge - Player's price knowledge database
     * @returns {number} Cost in credits
     */
    static getIntelligenceCost(systemId, priceKnowledge) {
        const knowledge = priceKnowledge[systemId];
        
        // Never visited
        if (!knowledge) {
            return PRICES.NEVER_VISITED;
        }
        
        // Recently visited (within threshold)
        if (knowledge.lastVisit <= RECENT_THRESHOLD) {
            return PRICES.RECENT_VISIT;
        }
        
        // Stale visit (beyond threshold)
        return PRICES.STALE_VISIT;
    }
    
    /**
     * Purchase market intelligence for a system
     * 
     * Deducts credits and updates price knowledge with current prices.
     * 
     * @param {Object} gameState - Current game state
     * @param {number} systemId - Target system ID
     * @param {Array} starData - Star system data
     * @returns {Object} { success: boolean, reason: string }
     */
    static purchaseIntelligence(gameState, systemId, starData) {
        const priceKnowledge = gameState.world.priceKnowledge || {};
        const credits = gameState.player.credits;
        
        // Calculate cost
        const cost = InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
        
        // Validate purchase
        const validation = InformationBroker.validatePurchase(cost, credits);
        if (!validation.valid) {
            return { success: false, reason: validation.reason };
        }
        
        // Find target system
        const system = starData.find(s => s.id === systemId);
        if (!system) {
            return { success: false, reason: 'System not found' };
        }
        
        // Calculate current prices for the system
        const currentDay = gameState.player.daysElapsed;
        const activeEvents = gameState.world.activeEvents || [];
        const currentPrices = {};
        
        for (const goodType of Object.keys(BASE_PRICES)) {
            currentPrices[goodType] = TradingSystem.calculatePrice(
                goodType,
                system,
                currentDay,
                activeEvents
            );
        }
        
        // Deduct credits
        gameState.player.credits -= cost;
        
        // Update price knowledge
        if (!gameState.world.priceKnowledge) {
            gameState.world.priceKnowledge = {};
        }
        
        gameState.world.priceKnowledge[systemId] = {
            lastVisit: 0,  // Intelligence is "current"
            prices: currentPrices
        };
        
        return { success: true, reason: null };
    }
    
    /**
     * Generate a market rumor with hints about prices or events
     * 
     * Provides vague but useful information about market conditions in a random system.
     * 
     * @param {Object} gameState - Current game state
     * @param {Array} starData - Star system data
     * @returns {string} Rumor text
     */
    static generateRumor(gameState, starData) {
        const currentDay = gameState.player.daysElapsed;
        const activeEvents = gameState.world.activeEvents || [];
        
        // If there are active events, 50% chance to hint about one
        if (activeEvents.length > 0 && Math.random() < 0.5) {
            const event = activeEvents[Math.floor(Math.random() * activeEvents.length)];
            const system = starData.find(s => s.id === event.systemId);
            
            if (system) {
                // Get event type name from the event object or use generic description
                const eventDescriptions = {
                    'mining_strike': 'labor troubles',
                    'medical_emergency': 'a health crisis',
                    'festival': 'celebrations',
                    'supply_glut': 'oversupply issues'
                };
                
                const description = eventDescriptions[event.type] || 'unusual market conditions';
                return `I heard ${system.name} is experiencing ${description}. Might be worth checking out.`;
            }
        }
        
        // Otherwise, hint about a good price somewhere
        const commodities = Object.keys(BASE_PRICES);
        const randomGood = commodities[Math.floor(Math.random() * commodities.length)];
        
        // Find a system with a good price for this commodity
        let bestSystem = null;
        let bestPrice = Infinity;
        
        for (const system of starData) {
            const price = TradingSystem.calculatePrice(randomGood, system, currentDay, activeEvents);
            if (price < bestPrice) {
                bestPrice = price;
                bestSystem = system;
            }
        }
        
        if (bestSystem) {
            return `Word on the street is that ${randomGood} prices are pretty good at ${bestSystem.name} right now.`;
        }
        
        // Fallback generic rumor
        return `The markets are always changing. Keep your eyes open for opportunities.`;
    }
    
    /**
     * Validate intelligence purchase
     * 
     * @param {number} cost - Intelligence cost
     * @param {number} credits - Player credits
     * @returns {Object} { valid: boolean, reason: string }
     */
    static validatePurchase(cost, credits) {
        if (cost > credits) {
            return {
                valid: false,
                reason: 'Insufficient credits for intelligence'
            };
        }
        
        return { valid: true, reason: null };
    }
    
    /**
     * Get all systems with their intelligence costs
     * 
     * Used for displaying the information broker interface.
     * 
     * @param {Object} priceKnowledge - Player's price knowledge database
     * @param {Array} starData - Star system data
     * @returns {Array} Array of { systemId, systemName, cost, lastVisit }
     */
    static listAvailableIntelligence(priceKnowledge, starData) {
        return starData.map(system => {
            const knowledge = priceKnowledge[system.id];
            const cost = InformationBroker.getIntelligenceCost(system.id, priceKnowledge);
            const lastVisit = knowledge ? knowledge.lastVisit : null;
            
            return {
                systemId: system.id,
                systemName: system.name,
                cost: cost,
                lastVisit: lastVisit
            };
        });
    }
}

// Export constants for testing
export { PRICES, RECENT_THRESHOLD };
