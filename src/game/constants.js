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
 * Intelligence Broker Configuration
 *
 * The information broker sells market intelligence based on how recently
 * the player visited a system. Pricing reflects information freshness.
 * The broker's data is not always accurate - prices may be manipulated
 * to show false profit opportunities, reflecting the unreliable nature
 * of black market intelligence.
 */
export const INTELLIGENCE_CONFIG = {
  PRICES: {
    RECENT_VISIT: 50, // System visited within RECENT_THRESHOLD days
    NEVER_VISITED: 100, // System never visited
    STALE_VISIT: 75, // System visited more than RECENT_THRESHOLD days ago
    RUMOR: 25, // Market rumor/hint
  },
  RECENT_THRESHOLD: 30, // Days before price knowledge is considered stale
  MAX_AGE: 100, // Days before purchased intelligence is automatically deleted
  RELIABILITY: {
    MANIPULATION_CHANCE: 0.1, // Probability that a commodity price will be manipulated
    MIN_MANIPULATION_MULTIPLIER: 0.7, // Lower multiplier = appears cheaper to buy
    MAX_MANIPULATION_MULTIPLIER: 0.85, // Upper multiplier for manipulated prices
  },
};

/**
 * Fuel Pricing Configuration
 *
 * Pricing tiers reflect supply chain logistics:
 * - Core systems (Sol, Alpha Centauri): Abundant fuel infrastructure
 * - Inner systems (<4.5 LY, non-core): Close to Sol infrastructure
 * - Mid-range systems (4.5-10 LY): Moderate supply chains
 * - Outer systems (≥10 LY): Remote, expensive logistics
 */
export const FUEL_PRICING_CONFIG = {
  CORE_SYSTEMS: {
    IDS: [SOL_SYSTEM_ID, ALPHA_CENTAURI_SYSTEM_ID],
    PRICE_PER_PERCENT: 2,
  },
  INNER_SYSTEMS: {
    DISTANCE_THRESHOLD: 4.5, // Systems < 4.5 LY (excluding core)
    PRICE_PER_PERCENT: 3,
  },
  MID_RANGE_SYSTEMS: {
    DISTANCE_THRESHOLD: 10.0, // Systems >= 4.5 and < 10 LY
    PRICE_PER_PERCENT: 3,
  },
  OUTER_SYSTEMS: {
    PRICE_PER_PERCENT: 5,
  },
};

/**
 * Navigation Configuration
 *
 * Configuration for navigation calculations including coordinate scaling
 * and fuel capacity validation.
 */
export const NAVIGATION_CONFIG = {
  // Coordinate scale factor for converting map units to light-years
  // The starmap coordinates are stored in arbitrary map units.
  // The catalog includes stars out to 20 light-years from Sol.
  // The farthest star (Wolf 1481) has a radius of ~279.319 map units.
  // Therefore: 1 map unit ≈ 20 / 279.319 ≈ 0.0716027 light-years
  LY_PER_UNIT: 20 / 279.3190870671033,

  // Floating-point epsilon for fuel capacity checks
  // Allows for minor floating-point arithmetic errors when validating
  // refuel amounts against the 100% capacity limit
  FUEL_CAPACITY_EPSILON: 0.01,
};

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
  return r * NAVIGATION_CONFIG.LY_PER_UNIT;
}

/**
 * Ship Configuration
 *
 * Configuration for ship properties, degradation, condition management,
 * quirks, and upgrades.
 */
export const SHIP_CONFIG = {
  DEFAULT_NAME: 'Serendipity',
  NAME_SUGGESTIONS: [
    'Serendipity',
    'Lucky Break',
    'Second Chance',
    'Wanderer',
    'Free Spirit',
    "Horizon's Edge",
    'Stardust Runner',
    'Cosmic Drifter',
  ],
  FUEL_CAPACITY: 100,
  CARGO_CAPACITY: 100,
  DEGRADATION: {
    HULL_PER_JUMP: 2, // Percentage points lost per jump
    ENGINE_PER_JUMP: 1, // Percentage points lost per jump
    LIFE_SUPPORT_PER_DAY: 0.5, // Percentage points lost per day traveled
  },
  CONDITION_BOUNDS: {
    MIN: 0,
    MAX: 100,
  },
  CONDITION_WARNING_THRESHOLDS: {
    HULL: 50,
    ENGINE: 30,
    LIFE_SUPPORT: 20,
  },
  ENGINE_CONDITION_PENALTIES: {
    THRESHOLD: 60, // Percentage below which penalties apply
    FUEL_PENALTY_MULTIPLIER: 1.2, // 20% increase in fuel consumption
    TIME_PENALTY_DAYS: 1, // Additional days added to jump time
  },
  QUIRKS: {
    sticky_seal: {
      name: 'Sticky Cargo Seal',
      description: 'The main cargo hatch sticks. Every. Single. Time.',
      effects: {
        loadingTime: 1.1, // +10% slower (future use)
        theftRisk: 0.95, // -5% theft risk (future use)
      },
      flavor: "You've learned to kick it in just the right spot.",
    },
    hot_thruster: {
      name: 'Hot Thruster',
      description: 'Port thruster runs hot. Burns extra fuel but responsive.',
      effects: {
        fuelConsumption: 1.05, // +5% fuel use
      },
      flavor: "The engineers say it's 'within tolerances.' Barely.",
    },
    sensitive_sensors: {
      name: 'Sensitive Sensors',
      description:
        'Sensor array picks up everything. Including false positives.',
      effects: {
        salvageDetection: 1.15, // +15% salvage (future use)
        falseAlarms: 1.1, // +10% false alarms (future use)
      },
      flavor: "You've learned to tell the difference. Mostly.",
    },
    cramped_quarters: {
      name: 'Cramped Quarters',
      description: 'Living space is... cozy. Very cozy.',
      effects: {
        lifeSupportDrain: 0.9, // -10% drain
      },
      flavor: "At least you don't have to share.",
    },
    lucky_ship: {
      name: 'Lucky Ship',
      description: 'This ship has a history of beating the odds.',
      effects: {
        negateEventChance: 0.05, // 5% to negate bad events (future use)
      },
      flavor: 'Knock on hull plating.',
    },
    fuel_sipper: {
      name: 'Fuel Sipper',
      description: 'Efficient drive core. Previous owner was meticulous.',
      effects: {
        fuelConsumption: 0.85, // -15% fuel use
      },
      flavor: 'One of the few things that actually works better than spec.',
    },
    leaky_seals: {
      name: 'Leaky Seals',
      description: "Hull seals aren't quite right. Slow degradation.",
      effects: {
        hullDegradation: 1.5, // +50% hull damage
      },
      flavor: "You can hear the whistle when you're in the cargo bay.",
    },
    smooth_talker: {
      name: "Smooth Talker's Ride",
      description: 'Previous owner had a reputation. It rubs off.',
      effects: {
        npcRepGain: 1.05, // +5% reputation gains (future use)
      },
      flavor: 'People remember this ship. Usually fondly.',
    },
  },
  UPGRADES: {
    extended_tank: {
      name: 'Extended Fuel Tank',
      cost: 3000,
      description: 'Increases fuel capacity by 50%',
      effects: {
        fuelCapacity: 150, // Up from 100
      },
      tradeoff: 'Larger tank is more vulnerable to weapons fire.',
    },
    reinforced_hull: {
      name: 'Reinforced Hull Plating',
      cost: 5000,
      description: 'Reduces hull degradation by 50%',
      effects: {
        hullDegradation: 0.5, // Half degradation
        cargoCapacity: 45, // Down from 50
      },
      tradeoff: 'Extra plating takes up cargo space.',
    },
    efficient_drive: {
      name: 'Efficient Drive System',
      cost: 4000,
      description: 'Reduces fuel consumption by 20%',
      effects: {
        fuelConsumption: 0.8, // -20% fuel use
      },
      tradeoff: 'Optimized for efficiency, not speed.',
    },
    expanded_hold: {
      name: 'Expanded Cargo Hold',
      cost: 6000,
      description: 'Increases cargo capacity by 50%',
      effects: {
        cargoCapacity: 75, // Up from 50
      },
      tradeoff: 'Heavier ship is less maneuverable.',
    },
    smuggler_panels: {
      name: "Smuggler's Panels",
      cost: 4500,
      description: 'Hidden cargo compartment (10 units)',
      effects: {
        hiddenCargoCapacity: 10,
      },
      tradeoff: 'If discovered, reputation loss with authorities.',
    },
    advanced_sensors: {
      name: 'Advanced Sensor Array',
      cost: 3500,
      description: 'See economic events one jump ahead',
      effects: {
        eventVisibility: 1, // Can see events in connected systems
      },
      tradeoff: 'None',
    },
    medical_bay: {
      name: 'Medical Bay',
      cost: 2500,
      description: 'Slower life support degradation',
      effects: {
        lifeSupportDrain: 0.7, // -30% drain
        cargoCapacity: 45, // Down from 50
      },
      tradeoff: 'Takes up cargo space.',
    },
  },
};

/**
 * Deterministic Economy Configuration
 *
 * Centralized configuration for the deterministic economy system.
 * Prices are determined by three factors:
 * 1. Technology Level Gradient: Static price differentials based on distance from Sol
 * 2. Temporal Drift: Smooth sine-wave price oscillations over time
 * 3. Local Market Saturation: Player-driven supply/demand impacts that decay over time
 *
 * This replaces the random price fluctuation model with a predictable, simulation-based economy.
 */
export const ECONOMY_CONFIG = {
  MAX_COORD_DISTANCE: 21, // Calibrated for Sol Sector map (<21 LY radius)

  MAX_TECH_LEVEL: 10.0, // Sol and core systems
  MIN_TECH_LEVEL: 1.0, // Frontier systems at 21+ LY

  MARKET_CAPACITY: 1000, // Units traded before extreme price impact

  DAILY_RECOVERY_FACTOR: 0.9, // Market conditions decay 10% per day

  TEMPORAL_WAVE_PERIOD: 30, // Price oscillation cycle in days
  TEMPORAL_AMPLITUDE: 0.15, // ±15% price variation (0.85 to 1.15 multiplier)
  TEMPORAL_PHASE_OFFSET: 0.15, // System ID phase offset for temporal waves

  TECH_LEVEL_MIDPOINT: 5.0, // Neutral point where tech modifiers equal 1.0
  TECH_MODIFIER_INTENSITY: 0.08, // Controls tech level price impact strength

  LOCAL_MODIFIER_MIN: 0.25, // Prevents prices below 25% of baseline
  LOCAL_MODIFIER_MAX: 2.0, // Prevents prices above 200% of baseline

  MARKET_CONDITION_PRUNE_THRESHOLD: 1.0, // Remove insignificant market impacts

  // Technology biases: negative = cheaper at low-tech, positive = cheaper at high-tech
  // Creates intuitive trade routes (buy grain/ore at frontier, electronics/medicine at core)
  TECH_BIASES: {
    grain: -0.6, // Agricultural product
    ore: -0.8, // Raw material
    tritium: -0.3, // Fuel
    parts: 0.5, // Manufactured goods
    medicine: 0.7, // Advanced medical supplies
    electronics: 1.0, // High-tech goods
  },
};

/**
 * Repair Configuration
 *
 * Configuration for ship repair costs.
 */
export const REPAIR_CONFIG = {
  // Repair costs are linear: ₡5 per 1% restored for any ship system
  // Example: Repairing hull from 78% to 100% costs ₡110 (22% × ₡5)
  COST_PER_PERCENT: 5,
};

/**
 * New game initialization values
 */
export const NEW_GAME_DEFAULTS = {
  STARTING_CREDITS: 500,
  STARTING_DEBT: 10000,
  STARTING_CARGO_CAPACITY: 50,
  STARTING_GRAIN_QUANTITY: 20,
  STARTING_SHIP_NAME: SHIP_CONFIG.DEFAULT_NAME,
};

/**
 * Development mode flag
 *
 * Checks for existence of .dev file to enable dev features.
 * The .dev file is gitignored, so it won't be deployed to production.
 * This is more reliable than hostname checks for local development.
 *
 * Note: This is initialized asynchronously - see initDevMode() below.
 */
export let DEV_MODE = false;

/**
 * Initialize dev mode by checking for .dev file
 *
 * This must be called before creating the UIManager.
 * The .dev file should exist in the project root for local development
 * and be excluded from version control via .gitignore.
 *
 * @returns {Promise<boolean>} True if dev mode is enabled
 */
export async function initDevMode() {
  try {
    const response = await fetch('.dev');
    DEV_MODE = response.ok;
    return DEV_MODE;
  } catch (error) {
    DEV_MODE = false;
    return false;
  }
}

/**
 * Game version for save compatibility
 *
 * Version history:
 * - 1.0.0: Initial release with basic trading
 * - 2.0.0: Added ship condition, price knowledge, events
 * - 2.1.0: Deterministic economy with market conditions
 */
export const GAME_VERSION = '2.1.0';

/**
 * localStorage key for save data
 */
export const SAVE_KEY = 'trampFreighterSave';

/**
 * Save debouncing interval in milliseconds
 * Prevents excessive localStorage writes (max 1 save per second)
 */
export const SAVE_DEBOUNCE_MS = 1000;

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

  // Reticle visual properties
  RETICLE_SIZE: 15, // Radius of reticle circle
  RETICLE_COLOR: 0x00ffff, // Cyan for contrast against red ship
  RETICLE_SEGMENTS: 32, // Number of segments in reticle circle
  RETICLE_LINE_WIDTH: 2, // Line width for reticle

  // Camera positioning for side view
  SIDE_VIEW_DISTANCE_MULTIPLIER: 1.5, // Distance from midpoint as multiple of star separation
  MIN_SIDE_VIEW_DISTANCE: 100, // Minimum camera distance to prevent clipping

  // Floating-point comparison epsilon
  VECTOR_EPSILON: 0.0001, // Threshold for detecting parallel vectors in cross product

  // Animation timeout for error recovery
  ANIMATION_TIMEOUT: 10000, // milliseconds - force completion if animation hangs
};
