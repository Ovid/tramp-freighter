/**
 * Game Constants - Centralized game data and configuration
 * 
 * This module contains all static game data that should remain consistent
 * across the entire application. Import from here rather than duplicating.
 */

/**
 * System IDs for key locations
 */
export const SOL_SYSTEM_ID = 0;
export const ALPHA_CENTAURI_SYSTEM_ID = 1;

/**
 * Base commodity prices in credits (before spectral modifiers)
 */
export const BASE_PRICES = {
    grain: 10,
    ore: 15,
    tritium: 50,
    parts: 30,
    medicine: 40,
    electronics: 35
};

/**
 * Spectral class economic modifiers by commodity type
 * 
 * Each spectral class has different resource availability and demand patterns.
 * Multipliers are applied to base prices to create price variation across systems.
 * 
 * Example: Grain at G-class star = 10 × 0.8 = 8 credits
 *          Grain at M-class star = 10 × 1.2 = 12 credits
 */
export const SPECTRAL_MODIFIERS = {
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
 * Spectral class color mapping for star visualization
 * Colors represent actual stellar temperatures (blue = hot, red = cool)
 */
export const SPECTRAL_COLORS = {
    'O': 0x9BB0FF,  // Blue (hottest)
    'B': 0xAABFFF,  // Blue-white
    'A': 0xCAD7FF,  // White
    'F': 0xF8F7FF,  // Yellow-white
    'G': 0xFFF4EA,  // Yellow (like Sol)
    'K': 0xFFD2A1,  // Orange
    'M': 0xFFCC6F,  // Red-orange (coolest)
    'L': 0xFF6B6B,  // Brown dwarf (red)
    'T': 0xCC5555,  // Brown dwarf (darker red)
    'D': 0xFFFFFF   // White dwarf (white)
};

/**
 * Daily price fluctuation range for dynamic economy
 * 
 * Uses ±30% range (0.70 to 1.30) to ensure price changes are visible
 * after integer rounding, making the dynamic economy feel responsive.
 * 
 * MIN: 0.70 (30% below base price)
 * MAX: 1.30 (30% above base price)
 * RANGE: 0.60 (MAX - MIN)
 */
export const DAILY_FLUCTUATION = {
    MIN: 0.70,
    RANGE: 0.60
};

/**
 * Information Broker pricing tiers
 * 
 * The information broker sells market intelligence based on how recently
 * the player visited a system. Pricing reflects information freshness:
 * - Recent visits: Data is mostly current, low cost
 * - Never visited: Complete unknown, highest cost
 * - Stale visits: Outdated data, moderate cost
 * - Rumors: Vague hints, cheapest option
 */
export const INTELLIGENCE_PRICES = {
    RECENT_VISIT: 50,      // System visited within RECENT_THRESHOLD days
    NEVER_VISITED: 100,    // System never visited
    STALE_VISIT: 75,       // System visited more than RECENT_THRESHOLD days ago
    RUMOR: 25              // Market rumor/hint
};

/**
 * Time threshold for considering intelligence "recent"
 * 
 * Price knowledge older than this many days is considered stale
 * and costs more to refresh via the information broker.
 */
export const INTELLIGENCE_RECENT_THRESHOLD = 30;

/**
 * Fuel pricing configuration by system distance from Sol
 * 
 * Pricing tiers reflect supply chain logistics:
 * - Core systems (Sol, Alpha Centauri): Abundant fuel infrastructure
 * - Mid-range systems (4.5-10 LY): Moderate supply chains
 * - Outer systems (≥10 LY): Remote, expensive logistics
 * - Inner systems (<4.5 LY, non-core): Close to Sol infrastructure
 */
export const FUEL_PRICING = {
    CORE_SYSTEMS: {
        IDS: [SOL_SYSTEM_ID, ALPHA_CENTAURI_SYSTEM_ID],
        PRICE: 2
    },
    MID_RANGE: {
        MIN_DISTANCE: 4.5,
        MAX_DISTANCE: 10,
        PRICE: 3
    },
    OUTER: {
        MIN_DISTANCE: 10,
        PRICE: 4
    },
    INNER: {
        PRICE: 2  // Systems < 4.5 LY (excluding core)
    }
};

/**
 * Coordinate scale factor for converting map units to light-years
 * 
 * The starmap coordinates are stored in arbitrary map units, not "light-years × 10".
 * The catalog includes stars out to 20 light-years from Sol.
 * The farthest star (Wolf 1481) has a radius of ~279.319 map units.
 * Therefore: 1 map unit ≈ 20 / 279.319 ≈ 0.0716027 light-years
 */
export const LY_PER_UNIT = 20 / 279.3190870671033;

/**
 * Calculate distance from Sol to a star system
 * Uses the standard Euclidean distance formula with coordinate scaling
 * 
 * Coordinates are stored in map units. Multiply by LY_PER_UNIT to get light-years.
 * This is a fundamental game mechanic used for fuel pricing, navigation, and future features.
 * 
 * @param {Object} system - Star system with x, y, z coordinates
 * @returns {number} Distance in light years
 */
export function calculateDistanceFromSol(system) {
    const r = Math.hypot(system.x, system.y, system.z);
    return r * LY_PER_UNIT;
}

/**
 * Game version for save compatibility
 */
export const GAME_VERSION = '1.0.0';

/**
 * localStorage key for save data
 */
export const SAVE_KEY = 'trampFreighterSave';

/**
 * Visual configuration for starmap rendering
 * 
 * Centralized visual constants ensure consistent appearance across the starmap.
 * Connection colors provide player feedback for jump feasibility.
 */
export const VISUAL_CONFIG = {
    starSize: 30,
    pulseAmplitude: 0.15,
    pulseSpeed: 2.0,
    selectionRingSize: 40,
    selectionRingPulseSpeed: 3.0,
    selectionColor: 0xFFFF00,
    currentSystemColor: 0x00FF88,
    sectorBoundaryColor: 0x00FF88,
    defaultStarColor: 0xFFFFFF,
    sceneBackground: 0x000000,
    ambientLightColor: 0x404040,
    directionalLightColor: 0xFFFFFF,
    connectionColors: {
        default: 0x00CCFF,
        sufficient: 0x00FF00,
        warning: 0xFFFF00,
        insufficient: 0xFF0000
    },
    connectionOpacity: {
        default: 0.6,
        active: 0.8
    }
};

/**
 * Label configuration for star system names
 * 
 * Distance-based scaling provides depth perception without cluttering the view.
 */
export const LABEL_CONFIG = {
    maxFontSize: 18,
    minFontSize: 8,
    maxOpacity: 1.0,
    minOpacity: 0.1,
    nearDistance: 100,
    farDistance: 500
};

/**
 * UI notification configuration
 * 
 * Controls timing for notification display and animations.
 * Fade duration must match CSS animation timing for smooth transitions.
 */
export const NOTIFICATION_CONFIG = {
    FADE_DURATION: 300,        // milliseconds - must match CSS animation
    DEFAULT_ERROR_DURATION: 3000,    // milliseconds
    DEFAULT_SUCCESS_DURATION: 2000   // milliseconds
};
