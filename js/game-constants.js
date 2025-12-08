'use strict';

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
 * List of all tradeable commodity types
 *
 * Centralized list ensures consistency across trading, UI, and testing.
 * Order matters for display purposes (basic goods → advanced goods).
 */
export const COMMODITY_TYPES = [
  'grain',
  'ore',
  'tritium',
  'parts',
  'medicine',
  'electronics',
];

/**
 * Base commodity prices in credits (before spectral modifiers)
 */
export const BASE_PRICES = {
  grain: 10,
  ore: 15,
  tritium: 50,
  parts: 30,
  medicine: 40,
  electronics: 35,
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
  G: {
    grain: 0.8,
    ore: 1.0,
    tritium: 1.2,
    parts: 1.0,
    medicine: 1.0,
    electronics: 1.0,
  },
  K: {
    grain: 1.0,
    ore: 0.9,
    tritium: 1.1,
    parts: 1.0,
    medicine: 1.0,
    electronics: 1.0,
  },
  M: {
    grain: 1.2,
    ore: 0.8,
    tritium: 1.0,
    parts: 1.1,
    medicine: 1.0,
    electronics: 1.0,
  },
  A: {
    grain: 0.9,
    ore: 1.1,
    tritium: 1.3,
    parts: 1.2,
    medicine: 1.1,
    electronics: 1.2,
  },
  F: {
    grain: 0.85,
    ore: 1.05,
    tritium: 1.25,
    parts: 1.1,
    medicine: 1.05,
    electronics: 1.1,
  },
  O: {
    grain: 1.0,
    ore: 1.2,
    tritium: 1.5,
    parts: 1.3,
    medicine: 1.2,
    electronics: 1.3,
  },
  B: {
    grain: 0.95,
    ore: 1.15,
    tritium: 1.4,
    parts: 1.25,
    medicine: 1.15,
    electronics: 1.25,
  },
  L: {
    grain: 1.3,
    ore: 0.7,
    tritium: 0.9,
    parts: 1.2,
    medicine: 0.9,
    electronics: 0.8,
  },
  T: {
    grain: 1.4,
    ore: 0.6,
    tritium: 0.8,
    parts: 1.3,
    medicine: 0.8,
    electronics: 0.7,
  },
  D: {
    grain: 1.0,
    ore: 1.0,
    tritium: 1.0,
    parts: 1.0,
    medicine: 1.0,
    electronics: 1.0,
  },
};

/**
 * Spectral class color mapping for star visualization
 * Colors represent actual stellar temperatures (blue = hot, red = cool)
 */
export const SPECTRAL_COLORS = {
  O: 0x9bb0ff, // Blue (hottest)
  B: 0xaabfff, // Blue-white
  A: 0xcad7ff, // White
  F: 0xf8f7ff, // Yellow-white
  G: 0xfff4ea, // Yellow (like Sol)
  K: 0xffd2a1, // Orange
  M: 0xffcc6f, // Red-orange (coolest)
  L: 0xff6b6b, // Brown dwarf (red)
  T: 0xcc5555, // Brown dwarf (darker red)
  D: 0xffffff, // White dwarf (white)
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
  MIN: 0.7,
  RANGE: 0.6,
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
  RECENT_VISIT: 50, // System visited within RECENT_THRESHOLD days
  NEVER_VISITED: 100, // System never visited
  STALE_VISIT: 75, // System visited more than RECENT_THRESHOLD days ago
  RUMOR: 25, // Market rumor/hint
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
    PRICE: 2,
  },
  MID_RANGE: {
    MIN_DISTANCE: 4.5,
    MAX_DISTANCE: 10,
    PRICE: 3,
  },
  OUTER: {
    MIN_DISTANCE: 10,
    PRICE: 4,
  },
  INNER: {
    PRICE: 2, // Systems < 4.5 LY (excluding core)
  },
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
 * Ship condition degradation rates
 *
 * Degradation occurs during jumps to simulate wear and tear from wormhole transit.
 * Rates are calibrated to create meaningful maintenance costs without being punishing:
 * - Hull degrades fastest (structural stress from transit)
 * - Engine degrades moderately (propulsion system wear)
 * - Life support degrades slowly over time (consumables depletion)
 */
export const SHIP_DEGRADATION = {
  HULL_PER_JUMP: 2, // Percentage points lost per jump
  ENGINE_PER_JUMP: 1, // Percentage points lost per jump
  LIFE_SUPPORT_PER_DAY: 0.5, // Percentage points lost per day traveled
};

/**
 * Ship condition bounds
 *
 * All condition values are clamped to this range to prevent invalid states.
 */
export const SHIP_CONDITION_BOUNDS = {
  MIN: 0,
  MAX: 100,
};

/**
 * Engine condition performance penalties
 *
 * When engine condition falls below the threshold, performance degrades:
 * - Fuel consumption increases (less efficient propulsion)
 * - Jump time increases (slower wormhole transit)
 *
 * Threshold set at 60% to create a meaningful "yellow zone" where players
 * must decide between continuing with penalties or spending credits on repairs.
 * Penalties (20% fuel increase, +1 day travel time) are calibrated to be
 * noticeable but not crippling.
 */
export const ENGINE_CONDITION_PENALTIES = {
  THRESHOLD: 60, // Percentage below which penalties apply
  FUEL_PENALTY_MULTIPLIER: 1.2, // 20% increase in fuel consumption
  TIME_PENALTY_DAYS: 1, // Additional day added to jump time
};

/**
 * Ship repair cost per percentage point restored
 *
 * Repair costs are linear: ₡5 per 1% restored for any ship system.
 * Example: Repairing hull from 78% to 100% costs ₡110 (22% × ₡5)
 */
export const REPAIR_COST_PER_PERCENT = 5;

/**
 * Ship condition warning thresholds
 *
 * Warnings are displayed when ship systems fall below these thresholds:
 * - Hull < 50%: Risk of cargo loss during jumps
 * - Engine < 30%: Jump failure risk - immediate repairs recommended
 * - Life Support < 20%: Critical condition - urgent repairs required
 */
export const SHIP_CONDITION_WARNING_THRESHOLDS = {
  HULL: 50,
  ENGINE: 30,
  LIFE_SUPPORT: 20,
};

/**
 * Floating-point epsilon for fuel capacity checks
 *
 * Allows for minor floating-point arithmetic errors when validating
 * refuel amounts against the 100% capacity limit.
 */
export const FUEL_CAPACITY_EPSILON = 0.01;

/**
 * Game version for save compatibility
 */
export const GAME_VERSION = '2.0.0';

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
  selectionColor: 0xffff00,
  currentSystemColor: 0x00ff88,
  sectorBoundaryColor: 0x00ff88,
  defaultStarColor: 0xffffff,
  sceneBackground: 0x000000,
  ambientLightColor: 0x404040,
  directionalLightColor: 0xffffff,
  connectionColors: {
    default: 0x00ccff,
    sufficient: 0x00ff00,
    warning: 0xffff00,
    insufficient: 0xff0000,
  },
  connectionOpacity: {
    default: 0.6,
    active: 0.8,
  },
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
  farDistance: 500,
};

/**
 * UI notification configuration
 *
 * Controls timing for notification display and animations.
 * Fade duration must match CSS animation timing for smooth transitions.
 */
export const NOTIFICATION_CONFIG = {
  FADE_DURATION: 300, // milliseconds - must match CSS animation
  DEFAULT_ERROR_DURATION: 3000, // milliseconds
  DEFAULT_SUCCESS_DURATION: 2000, // milliseconds
};

/**
 * Jump animation configuration
 *
 * Controls timing and visual properties for the jump animation sequence.
 * Durations are calibrated to provide excitement without tedium.
 */
export const ANIMATION_CONFIG = {
  // Zoom transition durations
  ZOOM_DURATION: 1.0, // seconds - fixed duration for camera transitions

  // Travel duration range
  MIN_TRAVEL_DURATION: 1.0, // seconds - minimum for short jumps to ensure visibility
  MAX_TRAVEL_DURATION: 3.0, // seconds - maximum for long jumps to prevent tedium

  // Distance scaling for travel duration
  MIN_DISTANCE: 0, // light years - minimum jump distance
  MAX_DISTANCE: 20, // light years - maximum distance in Sol Sector

  // Ship indicator visual properties
  SHIP_INDICATOR_SIZE: 8,
  SHIP_INDICATOR_COLOR: 0xff0000, // Red
  SHIP_INDICATOR_GLOW_INTENSITY: 1.5,
  SHIP_INDICATOR_TEXTURE_SIZE: 64, // Canvas texture dimensions (matches star sprites)

  // Camera positioning for side view
  SIDE_VIEW_DISTANCE_MULTIPLIER: 1.5, // Distance from midpoint as multiple of star separation
  MIN_SIDE_VIEW_DISTANCE: 100, // Minimum camera distance to prevent clipping

  // Floating-point comparison epsilon
  VECTOR_EPSILON: 0.0001, // Threshold for detecting parallel vectors in cross product

  // Animation timeout for error recovery
  ANIMATION_TIMEOUT: 10000, // milliseconds - force completion if animation hangs
};
