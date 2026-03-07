/**
 * Game Constants - Centralized game data and configuration
 *
 * This module contains all static game data that should remain consistent
 * across the entire application. Import from here rather than duplicating.
 *
 * Single-file design: all constants live here deliberately. For a single-developer
 * project this avoids import indirection and makes cross-domain searches trivial.
 * The file is organized by domain with section headers for navigation.
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
  STALENESS_THRESHOLDS: {
    RECENT: 10, // Days old before staleness indicator appears
    STALE: 30, // Days old before data is considered very stale
  },
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
  // Allows for minor floating-point arithmetic errors and integer rounding
  // when validating refuel amounts against the 100% capacity limit.
  // Set to 1.0 to allow refueling in 1% increments even when current fuel
  // has fractional values (e.g., 99.5% + 1% = 100.5% is acceptable).
  FUEL_CAPACITY_EPSILON: 1.0,

  // Wormhole fuel cost formula: BASE + (distance * DISTANCE_MULTIPLIER)
  WORMHOLE_FUEL_BASE_COST: 10,
  WORMHOLE_FUEL_DISTANCE_MULTIPLIER: 2,

  // Fuel remaining thresholds for wormhole color-coding warnings
  FUEL_WARNING_RANGE: {
    LOW: 10, // Fuel remaining below this = warning
    HIGH: 20, // Fuel remaining above this = safe
  },
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
  MAX_NAME_LENGTH: 50, // Maximum characters allowed in ship name
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
  CARGO_CAPACITY: 50,
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
  UI_CONDITION_DISPLAY_THRESHOLDS: {
    EXCELLENT: 75, // >= 75% shows as 'good'
    FAIR: 50, // >= 50% shows as 'fair'
    POOR: 25, // >= 25% shows as 'poor'
    // < 25% shows as 'critical'
  },
  ENGINE_CONDITION_PENALTIES: {
    THRESHOLD: 60, // Percentage below which penalties apply
    FUEL_PENALTY_MULTIPLIER: 1.2, // 20% increase in fuel consumption
    TIME_PENALTY_DAYS: 1, // Additional days added to jump time
  },
  // Quirk assignment configuration
  QUIRK_ASSIGNMENT: {
    PROBABILITY_THRESHOLD: 0.5, // 50% chance of getting 2 vs 3 quirks
    MIN_COUNT: 2, // Minimum quirks assigned to a new ship
    MAX_COUNT: 3, // Maximum quirks assigned to a new ship
  },
  QUIRKS: {
    sticky_seal: {
      name: 'Sticky Cargo Seal',
      description: 'The main cargo hatch sticks. Every. Single. Time.',
      effects: {
        loadingTime: 1.1, // +10% slower (future use)
        theftRisk: 0.95, // -5% theft risk (future use)
      },
      effectLabel: '+10% loading time, -5% theft risk',
      flavor: "You've learned to kick it in just the right spot.",
    },
    hot_thruster: {
      name: 'Hot Thruster',
      description: 'Port thruster runs hot. Burns extra fuel but responsive.',
      effects: {
        fuelConsumption: 1.05, // +5% fuel use
      },
      effectLabel: '+5% fuel consumption',
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
      effectLabel: '+15% salvage detection, +10% false alarms',
      flavor: "You've learned to tell the difference. Mostly.",
    },
    cramped_quarters: {
      name: 'Cramped Quarters',
      description: 'Living space is... cozy. Very cozy.',
      effects: {
        lifeSupportDrain: 0.9, // -10% drain
      },
      effectLabel: '-10% life support drain',
      flavor: "At least you don't have to share.",
    },
    lucky_ship: {
      name: 'Lucky Ship',
      description: 'This ship has a history of beating the odds.',
      effects: {
        negateEventChance: 0.05, // 5% to negate bad events (future use)
      },
      effectLabel: '+5% chance to negate bad events',
      flavor: 'Knock on hull plating.',
    },
    fuel_sipper: {
      name: 'Fuel Sipper',
      description: 'Efficient drive core. Previous owner was meticulous.',
      effects: {
        fuelConsumption: 0.85, // -15% fuel use
      },
      effectLabel: '-15% fuel consumption',
      flavor: 'One of the few things that actually works better than spec.',
    },
    leaky_seals: {
      name: 'Leaky Seals',
      description: "Hull seals aren't quite right. Slow degradation.",
      effects: {
        hullDegradation: 1.5, // +50% hull damage
      },
      effectLabel: '+50% hull degradation',
      flavor: "You can hear the whistle when you're in the cargo bay.",
    },
    smooth_talker: {
      name: "Smooth Talker's Ride",
      description: 'Previous owner had a reputation. It rubs off.',
      effects: {
        npcRepGain: 1.05, // +5% reputation gains (future use)
      },
      effectLabel: '+5% reputation gains',
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

  MARKET_CAPACITY: 200, // Units traded before extreme price impact

  DAILY_RECOVERY_FACTOR: 0.95, // Market conditions decay 5% per day

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
 * Trade Configuration
 *
 * Configuration for trading UI and mechanics.
 */
export const TRADE_CONFIG = {
  // Quick buy button quantity for convenience
  QUICK_BUY_QUANTITY: 10,
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

  // Critical damage confinement: systems at or below this % block jumping
  CRITICAL_SYSTEM_THRESHOLD: 20,

  // Emergency patch restores system to this exact percentage
  EMERGENCY_PATCH_TARGET: 21,

  // Days consumed per emergency patch (advances game time)
  EMERGENCY_PATCH_DAYS_PENALTY: 3,

  // Cannibalization: donor loses 1.5x what target gains (50% waste)
  CANNIBALIZE_WASTE_MULTIPLIER: 1.5,

  // Cannibalization: donors cannot be drained below this percentage
  CANNIBALIZE_DONOR_MIN: 21,
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
 * Cole debt system configuration
 * All numeric values for the loan shark mechanics
 */
export const COLE_DEBT_CONFIG = {
  // Interest rates by heat tier
  INTEREST_RATE: 0.03, // Keep for backward compat with getFinance init
  INTEREST_RATE_LOW: 0.03, // 0-20 heat: 3% (grace period)
  INTEREST_RATE_MEDIUM: 0.04, // 21-45 heat: 4%
  INTEREST_RATE_HIGH: 0.05, // 46-70 heat: 5%
  INTEREST_RATE_CRITICAL: 0.05, // 71-100 heat: 5% (cap)
  INTEREST_PERIOD_DAYS: 30, // Days between interest applications

  // Lien rates by heat tier
  LIEN_RATE_LOW: 0.05, // 0-20 heat: 5% withholding
  LIEN_RATE_MEDIUM: 0.1, // 21-45 heat: 10%
  LIEN_RATE_HIGH: 0.15, // 46-70 heat: 15%
  LIEN_RATE_CRITICAL: 0.2, // 71-100 heat: 20% (cap)

  // Heat thresholds
  HEAT_MIN: 0,
  HEAT_MAX: 100,
  HEAT_TIER_LOW_MAX: 20,
  HEAT_TIER_MEDIUM_MAX: 45,
  HEAT_TIER_HIGH_MAX: 70,

  // NPC loan reminder threshold
  LOAN_REMINDER_DAYS: 5, // Days remaining to trigger urgent loan reminder

  // Heat changes
  HEAT_BORROW_BASE: 8,
  HEAT_BORROW_STEP: 500,
  HEAT_BORROW_PER_STEP: 2,
  HEAT_MISSED_CHECKPOINT: 10,
  HEAT_VOLUNTARY_PAYMENT: -3,
  HEAT_NATURAL_DECAY: -1,
  HEAT_DECLINE_FAVOR: 5,
  HEAT_FAIL_MANDATORY: 15,

  // Checkpoint intervals (days) by heat tier
  CHECKPOINT_INTERVAL_LOW: 30,
  CHECKPOINT_INTERVAL_MEDIUM: 21,
  CHECKPOINT_INTERVAL_HIGH: 14,
  CHECKPOINT_INTERVAL_CRITICAL: 7,

  // Borrowing
  MIN_DRAW: 100,
  DEFAULT_DRAW: 200,
  NET_WORTH_DRAW_PERCENT: 0.08,
  DRAW_TIERS: [100, 250, 500],
  BORROW_CHECKPOINT_ACCELERATION_DAYS: 7,

  // Payment UI
  PAYMENT_TIERS: [100, 500, 1000],

  // Cole NPC reputation from debt interactions
  COLE_NPC_ID: 'cole_sol',
  REP_PER_CREDIT_DIVISOR: 500,
  REP_BORROW_BONUS: 1,
  REP_MISSED_CHECKPOINT: -3,
  REP_WITHHOLDING_THRESHOLD: 500,
  REP_FAVOR_FAIL: -5,
  REP_DEBT_CLEARED_BONUS: 15,

  // Starting values
  STARTING_LIEN_RATE: 0.05,
  STARTING_HEAT: 0,
  STARTING_CHECKPOINT_DAY: 30,
};

/**
 * Default player preferences (saved with game state)
 */
export const DEFAULT_PREFERENCES = Object.freeze({
  jumpWarningsEnabled: true,
});

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
    // Add cache-busting query parameter to ensure fresh check
    // This prevents browser from caching the .dev file existence check
    const url = `.dev?t=${Date.now()}`;
    const response = await fetch(url, {
      cache: 'no-store',
    });

    // Check if response is actually the .dev file, not an HTML fallback
    // Vite's dev server might return index.html for 404s (SPA fallback)
    const contentType = response.headers.get('content-type') || '';
    const isHtmlFallback = contentType.includes('text/html');

    // Dev mode is enabled only if:
    // 1. Response is OK (200)
    // 2. Response is NOT an HTML fallback (which would indicate 404 with SPA fallback)
    DEV_MODE = response.ok && !isHtmlFallback;

    return DEV_MODE;
  } catch {
    // .dev file not found or fetch failed - dev mode disabled
    // This is expected in production and when .dev file doesn't exist
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
 * - 4.0.0: NPC foundation with reputation system and dialogue
 * - 4.1.0: NPC benefits system with tips, favors, loans, and storage
 */
export const GAME_VERSION = '5.0.0';

export const GAME_START_DATE = '2167-06-20';

/**
 * Mission System Configuration
 */
export const MISSION_CONFIG = {
  TYPES: ['delivery', 'fetch', 'passenger', 'intel', 'special'],
  MAX_ACTIVE: 3,
  BOARD_SIZE: 6,
  BOARD_REFRESH_DAYS: 1,
  DEADLINE_BUFFER_DAYS: 3,
  REWARD_MARKUP: 0.3,
  CARGO_RUN_BASE_FEE: 250,
  CARGO_RUN_ILLEGAL_BASE_FEE: 400,
  CARGO_RUN_LEGAL_QUANTITY: { MIN: 5, MAX: 15 },
  CARGO_RUN_ILLEGAL_QUANTITY: { MIN: 5, MAX: 10 },
  CARGO_RUN_ZONE_ILLEGAL_CHANCE: {
    safe: 0.15,
    contested: 0.5,
    dangerous: 0.75,
  },
  HOP_MULTIPLIERS: [1.0, 1.5, 2.5, 4.0],
  DANGER_MULTIPLIERS: { safe: 1.0, contested: 1.5, dangerous: 2.0 },
  MAX_MISSION_HOPS: 3,
  MIN_BOARD_SIZE: 1,
  DAYS_PER_HOP_ESTIMATE: 6,
  SATURATION_WINDOW_DAYS: 30,
  SATURATION_PENALTY_PER_RUN: 0.25,
  SATURATION_FLOOR: 0.25,
  SATURATION_MAX_HISTORY: 50,
  PASSENGER_BASE_FEE: 100,
  PASSENGER_PREMIUM: 1.25,
  PASSENGER_MARGIN_FLOOR: 5,
  FEASIBILITY_WARNING_THRESHOLD: 0.7,
  PRIORITY_MISSION: {
    TRADER_REP_THRESHOLD: 30,
    CIVILIAN_REP_THRESHOLD: 30,
    REWARD_MULTIPLIER: 2.0,
    BOARD_CHANCE: 0.3,
  },
};

export const ENDGAME_CONFIG = {
  VICTORY_CREDITS: 15000,
  TANAKA_SYSTEM: 4, // Barnard's Star
  TANAKA_UNLOCK_SYSTEMS_VISITED: 10,
  STAGE_1_REP: 10,
  STAGE_1_ENGINE: 80,
  STAGE_1_JUMPS: 3,
  STAGE_1_REWARD_CREDITS: 1000,
  STAGE_1_REWARD_REP: 15,
  STAGE_2_REP: 30,
  STAGE_2_EXOTIC_NEEDED: 5,
  STAGE_2_EXOTIC_DISTANCE: 15,
  STAGE_2_EXOTIC_CHANCE: 0.6,
  STAGE_2_REWARD_CREDITS: 3000,
  STAGE_2_REWARD_REP: 15,
  STAGE_3_REP: 50,
  STAGE_3_HULL: 70,
  STAGE_3_ENGINE: 80,
  STAGE_3_REWARD_CREDITS: 2000,
  STAGE_3_REWARD_REP: 20,
  STAGE_4_REP: 70,
  STAGE_4_REWARD_REP: 20,
  STAGE_4_DELIVERY_SYSTEM: 13,
  STAGE_5_REP: 90,
  STAGE_5_HULL: 80,
  STAGE_5_ENGINE: 90,
  VICTORY_STAGE: 6,
  DELTA_PAVONIS_ID: 115,
  BARNARDS_ENGINEER_RUMOR_SYSTEMS: 5,
  BEYOND_LANES_RUMOR_SYSTEMS: 3,
  INFO_BROKER_TANAKA_CHANCE: 0.3,
};

/**
 * Tanaka Research Supply Run Configuration
 */
export const TANAKA_SUPPLY_CONFIG = {
  QUANTITY: 5,
  REP_GAIN: 3,
  COOLDOWN_DAYS: 7,
  GOODS: ['electronics', 'medicine'],
};

export const MISSION_CARGO_TYPES = {
  legal: ['registered_freight', 'diplomatic_pouches', 'scientific_samples'],
  illegal: ['unmarked_crates', 'prohibited_tech', 'black_market_goods'],
};

/**
 * Passenger Mission Configuration
 */
export const PASSENGER_CONFIG = {
  INITIAL_SATISFACTION: 50,

  TYPES: {
    refugee: {
      urgency: 'high',
      cargoSpace: 1,
      dialogue: [
        'Please, I need to get away from here.',
        'Thank you for helping me.',
      ],
      satisfactionWeights: { speed: 0.8, comfort: 0.2 },
    },
    business: {
      urgency: 'medium',
      cargoSpace: 2,
      dialogue: ['Time is money.', 'I expect professional service.'],
      satisfactionWeights: { speed: 0.6, comfort: 0.4 },
    },
    wealthy: {
      urgency: 'low',
      cargoSpace: 3,
      dialogue: [
        'I trust the accommodations are adequate?',
        'Money is no object.',
      ],
      satisfactionWeights: { speed: 0.3, comfort: 0.7 },
    },
    scientist: {
      urgency: 'medium',
      cargoSpace: 2,
      dialogue: [
        'Fascinating ship you have.',
        "I'm studying stellar phenomena.",
      ],
      satisfactionWeights: { speed: 0.5, comfort: 0.3, safety: 0.2 },
    },
    family: {
      urgency: 'low',
      cargoSpace: 3,
      dialogue: ['Are we there yet?', 'The children are excited.'],
      satisfactionWeights: { speed: 0.4, comfort: 0.4, safety: 0.2 },
    },
  },

  SATISFACTION_THRESHOLDS: {
    VERY_SATISFIED: 80,
    SATISFIED: 60,
    NEUTRAL: 40,
    DISSATISFIED: 20,
  },

  PAYMENT_MULTIPLIERS: {
    VERY_SATISFIED: 1.3,
    SATISFIED: 1.15,
    NEUTRAL: 1.0,
    DISSATISFIED: 0.7,
    VERY_DISSATISFIED: 0.5,
    ON_TIME_BONUS: 0.1,
  },

  SATISFACTION_IMPACTS: {
    DELAY: 10,
    COMBAT: 15,
    LOW_LIFE_SUPPORT: 5,
    LIFE_SUPPORT_THRESHOLD: 50,
  },

  FIRST_NAMES: [
    'Ava',
    'Ben',
    'Clara',
    'Dmitri',
    'Elena',
    'Felix',
    'Grace',
    'Hassan',
    'Iris',
    'Jun',
    'Kira',
    'Leo',
    'Maya',
    'Niko',
    'Petra',
    'Quinn',
    'Rosa',
    'Soren',
    'Tara',
    'Uri',
  ],

  LAST_NAMES: [
    'Chen',
    'Okafor',
    'Singh',
    'Petrov',
    'Tanaka',
    'Garcia',
    'Bauer',
    'Kim',
    'Ali',
    'Larsson',
    'Costa',
    'Nguyen',
    'Frost',
    'Amir',
    'Volkov',
    'Reyes',
    'Osei',
    'Dubois',
    'Holm',
    'Sharma',
  ],
};

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
  // Selection ring animation parameters
  selectionRingScaleAmplitude: 0.08, // Scale variation for pulse effect (8%)
  selectionRingBaseOpacity: 0.75, // Base opacity for selection ring
  selectionRingOpacityAmplitude: 0.25, // Opacity variation for scanning effect
  selectionRingOpacityFrequency: 1.5, // Frequency multiplier for opacity pulse
  selectionRingRotationSpeed: 0.2, // Rotation speed in radians per second
  // Current system indicator animation parameters
  currentSystemBaseScale: 1.2, // Base scale (20% larger than selection ring)
  currentSystemScaleAmplitude: 0.1, // Scale variation for pulse effect (10%)
  currentSystemScaleFrequency: 0.8, // Frequency multiplier for scale pulse
  currentSystemBaseOpacity: 0.7, // Base opacity for current system indicator
  currentSystemOpacityAmplitude: 0.3, // Opacity variation for pulse effect
  currentSystemRotationSpeed: 0.15, // Rotation speed in radians per second (opposite direction)
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
  // Scene atmosphere
  fogDensity: 0.0003,
  ambientLightIntensity: 1.5,
  directionalLightIntensity: 0.8,
  // Camera controls
  dampingFactor: 0.05,
  zoomSpeed: 1.5,
  autoRotationSpeed: 0.2, // Degrees per frame for smooth, noticeable orbit
  // Initial camera position (slightly closer view for better label visibility)
  initialCameraDistance: 700, // Distance from origin (0,0,0) - equivalent to ~2 zoom clicks from default
  // Sector boundary
  sectorBoundaryRadius: 300,
  // Background starfield
  starfieldCount: 1200,
  starfieldMinRadius: 700,
  starfieldMaxRadius: 1400,
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
  minOpacity: 0.3, // Increased from 0.1 to make distant labels more visible at starting zoom
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

  // Encounter reveal timing during jump animation
  ENCOUNTER_REVEAL_PROGRESS: 0.75, // fraction of ship travel before encounter panel appears
};

/**
 * NPC Reputation System Configuration
 *
 * Reputation tiers classify the relationship between player and NPCs.
 * Each tier has a name and numeric range (-100 to 100).
 */

// Reputation boundary constants
export const REPUTATION_BOUNDS = {
  MIN: -100,
  MAX: 100,
  HOSTILE_MAX: -50,
  COLD_MIN: -49,
  COLD_MAX: -10,
  NEUTRAL_MIN: -9,
  NEUTRAL_MID: 4,
  NEUTRAL_HIGH: 7,
  NEUTRAL_MAX: 9,
  WARM_MIN: 10,
  WARM_MAX: 29,
  FRIENDLY_MIN: 30,
  FRIENDLY_MAX: 59,
  TRUSTED_MIN: 60,
  TRUSTED_MAX: 89,
  FAMILY_MIN: 90,
};

export const REPUTATION_TIERS = {
  hostile: {
    min: REPUTATION_BOUNDS.MIN,
    max: REPUTATION_BOUNDS.HOSTILE_MAX,
    name: 'Hostile',
  },
  cold: {
    min: REPUTATION_BOUNDS.COLD_MIN,
    max: REPUTATION_BOUNDS.COLD_MAX,
    name: 'Cold',
  },
  neutral: {
    min: REPUTATION_BOUNDS.NEUTRAL_MIN,
    max: REPUTATION_BOUNDS.NEUTRAL_MAX,
    name: 'Neutral',
  },
  warm: {
    min: REPUTATION_BOUNDS.WARM_MIN,
    max: REPUTATION_BOUNDS.WARM_MAX,
    name: 'Warm',
  },
  friendly: {
    min: REPUTATION_BOUNDS.FRIENDLY_MIN,
    max: REPUTATION_BOUNDS.FRIENDLY_MAX,
    name: 'Friendly',
  },
  trusted: {
    min: REPUTATION_BOUNDS.TRUSTED_MIN,
    max: REPUTATION_BOUNDS.TRUSTED_MAX,
    name: 'Trusted',
  },
  family: {
    min: REPUTATION_BOUNDS.FAMILY_MIN,
    max: REPUTATION_BOUNDS.MAX,
    name: 'Family',
  },
};

/**
 * Tier midpoints for dev admin quick-set buttons.
 * Each value falls at the midpoint of the corresponding tier range.
 */
export const REPUTATION_TIER_PRESETS = Object.fromEntries(
  Object.entries(REPUTATION_TIERS).map(([key, tier]) => [
    key,
    Math.round((tier.min + tier.max) / 2),
  ])
);

/**
 * NPC Data Validation Configuration
 *
 * Required fields and properties for NPC definitions to ensure data integrity.
 */
export const NPC_VALIDATION = {
  REQUIRED_FIELDS: [
    'id',
    'name',
    'role',
    'system',
    'station',
    'personality',
    'speechStyle',
    'description',
    'initialRep',
    'tips',
    'discountService',
    'tierBenefits',
  ],
  REQUIRED_PERSONALITY_TRAITS: ['trust', 'greed', 'loyalty', 'morality'],
  REQUIRED_SPEECH_PROPERTIES: ['greeting', 'vocabulary', 'quirk'],
  REQUIRED_TIER_BENEFITS: ['warm', 'friendly', 'trusted', 'family'],
};

/**
 * NPC Personality Trait Values
 *
 * Standardized personality trait values for NPCs to ensure consistency
 * and prevent magic numbers in NPC definitions.
 */
export const NPC_PERSONALITY_VALUES = {
  // Trust levels (how easily they trust others)
  TRUST_VERY_LOW: 0.1, // Marcus Cole - trusts no one
  TRUST_LOW: 0.3, // Wei Chen - cautious after being burned
  TRUST_HIGH: 0.7, // Father Okonkwo - trusts by default

  // Greed levels (motivation by material gain)
  GREED_NONE: 0.0, // Father Okonkwo - not motivated by material gain
  GREED_LOW: 0.2, // Wei Chen - not motivated by money
  GREED_VERY_HIGH: 0.9, // Marcus Cole - highly motivated by profit

  // Loyalty levels (commitment to relationships/causes)
  LOYALTY_LOW: 0.3, // Marcus Cole - loyalty is transactional
  LOYALTY_HIGH: 0.8, // Wei Chen - deeply loyal once trust is earned
  LOYALTY_VERY_HIGH: 0.9, // Father Okonkwo - deeply committed

  // Morality levels (ethical standards)
  MORALITY_LOW: 0.2, // Marcus Cole - flexible ethics when profit involved
  MORALITY_MODERATE: 0.6, // Wei Chen - generally ethical but pragmatic
  MORALITY_VERY_HIGH: 0.9, // Father Okonkwo - strong moral compass
};

/**
 * NPC Initial Reputation Values
 *
 * Starting reputation values for NPCs to establish initial relationships.
 */
export const NPC_INITIAL_REPUTATION = {
  HOSTILE: -20, // Marcus Cole - starts cold due to player debt
  NEUTRAL: 0, // Wei Chen - neutral starting relationship
  FRIENDLY: 10, // Father Okonkwo - starts warm and welcoming
};

/**
 * NPC Benefits System Configuration
 *
 * Configuration for tier-based benefits including trading tips, special favors,
 * service discounts, and free repairs. These benefits reward players for building
 * relationships with NPCs across the sector.
 */
export const NPC_BENEFITS_CONFIG = {
  // Cooldown periods for NPC benefits
  TIP_COOLDOWN_DAYS: 7, // Days between tips from same NPC
  FAVOR_COOLDOWN_DAYS: 30, // Days between favors from same NPC

  // Emergency loan configuration
  EMERGENCY_LOAN_AMOUNT: 500, // Credits for emergency loan
  LOAN_REPAYMENT_DEADLINE: 30, // Days to repay loan
  LOAN_DEFAULT_TIER_PENALTY: 1, // Tiers lost on loan default
  LOAN_DEFAULT_HOSTILE_MULTIPLIER: 20, // Extra penalty multiplier when already at Hostile tier
  LOAN_ACCEPTANCE_REP_BONUS: 5, // Rep gained for accepting loan

  // Cargo storage configuration
  CARGO_STORAGE_LIMIT: 10, // Max cargo units stored per NPC

  // Tier discount percentages (applied to service costs)
  TIER_DISCOUNTS: {
    hostile: 0, // No discount
    cold: 0, // No discount
    neutral: 0, // No discount
    warm: 0.05, // 5% discount
    friendly: 0.1, // 10% discount
    trusted: 0.15, // 15% discount
    family: 0.2, // 20% discount
  },

  // Free repair limits (hull percentage that can be repaired for free)
  FREE_REPAIR_LIMITS: {
    trusted: 10, // Up to 10% hull damage
    family: 25, // Up to 25% hull damage
  },
};

/**
 * UI Configuration
 *
 * Configuration for user interface components including default values,
 * repair options, coordinate display, and animation polling.
 */
export const UI_CONFIG = {
  // Default fallback values for components when Bridge Pattern events haven't fired yet
  DEFAULT_VALUES: {
    SHIP_CONDITION: 100, // Default percentage for hull, engine, life support
    FUEL: 100, // Default fuel percentage
    CARGO_CAPACITY: 50, // Default cargo capacity
    SHIP_NAME: 'Unknown Ship', // Default ship name
  },

  // Repair panel configuration
  REPAIR_AMOUNTS: [10, 25, 50, 'full'], // Available repair percentage options

  // Animation polling configuration
  ANIMATION_POLL_INTERVAL: 100, // Milliseconds between animation state checks

  // Save system configuration
  SAVE_DEBOUNCE_MS: 1000, // Minimum milliseconds between save operations
  MARK_DIRTY_DEBOUNCE_MS: 500, // Trailing debounce for markDirty auto-save
};

/**
 * Danger System Configuration
 *
 * Configuration for the danger system including zone classifications,
 * encounter probabilities, and faction/karma modifiers.
 *
 * Danger zones classify star systems based on pirate activity and law enforcement:
 * - Safe: Core systems with strong law enforcement presence
 * - Contested: Systems with mixed control and moderate risk
 * - Dangerous: Frontier systems with high pirate activity
 */
export const DANGER_CONFIG = {
  ZONES: {
    safe: {
      pirateChance: 0.05, // 5% base pirate encounter rate in safe systems
      inspectionChance: 0.1, // 10% base inspection rate in safe systems
      systems: [0, 1, 4], // Sol, Alpha Centauri, Barnard's Star
    },
    contested: {
      pirateChance: 0.2, // 20% base pirate encounter rate in contested systems
      inspectionChance: 0.15, // 15% base inspection rate in contested systems
      systems: [7, 10], // Sirius, Epsilon Eridani
    },
    dangerous: {
      pirateChance: 0.35, // 35% base pirate encounter rate in dangerous systems
      inspectionChance: 0.05, // 5% base inspection rate in dangerous systems
      distanceThreshold: 15, // Light years from Sol - systems beyond this are dangerous
    },
  },

  // Cargo value modifiers for pirate encounter probability
  CARGO_VALUE_MODIFIERS: {
    LOW_VALUE_THRESHOLD: 1500, // Credits threshold for low-value cargo modifier (30+ units of expensive goods)
    LOW_VALUE_MULTIPLIER: 1.2, // 1.2x pirate chance when cargo value > 1500 credits
    HIGH_VALUE_THRESHOLD: 2000, // Credits threshold for high-value cargo modifier (40+ units of expensive goods)
    HIGH_VALUE_MULTIPLIER: 1.5, // 1.5x pirate chance when cargo value > 2000 credits
  },

  // Illegal mission cargo modifier for pirate encounter probability
  ILLEGAL_CARGO_PIRATE_MULTIPLIER: 1.3,

  // Engine condition modifier for pirate encounter probability
  ENGINE_CONDITION_MODIFIER: {
    POOR_CONDITION_THRESHOLD: 50, // Engine percentage below which modifier applies
    POOR_CONDITION_MULTIPLIER: 1.1, // 1.1x pirate chance when engine < 50%
  },

  // Advanced sensors upgrade reduces pirate encounter chance
  ADVANCED_SENSORS_PIRATE_REDUCTION: 0.8, // 0.8x pirate chance with advanced sensors upgrade

  // Core systems inspection multiplier
  CORE_SYSTEMS_INSPECTION_MULTIPLIER: 2.0, // 2x inspection rate in core systems (Sol, Alpha Centauri)

  // Restricted goods inspection modifier
  RESTRICTED_GOODS_INSPECTION_INCREASE: 0.1, // +10% inspection chance per restricted good in cargo

  // Faction reputation modifiers for encounter probabilities
  // Formula: modifier = 1 + (reputation / 100) * SCALE
  // At +100 rep: modifier = 1 + SCALE, At -100 rep: modifier = 1 - SCALE
  FACTION_REPUTATION_SCALES: {
    // High outlaw reputation reduces pirate encounters (they recognize you as one of them)
    OUTLAW_PIRATE_REDUCTION_SCALE: -0.3, // +100 outlaw = 0.7x pirate chance, -100 = 1.3x
    // High authority reputation reduces inspection chance (they trust you)
    AUTHORITY_INSPECTION_REDUCTION_SCALE: -0.4, // +100 authority = 0.6x inspection, -100 = 1.4x
    // Low authority reputation increases pirate encounters (less patrol protection)
    AUTHORITY_PIRATE_INCREASE_SCALE: 0.2, // +100 authority = 0.8x pirate chance, -100 = 1.2x
  },
};

/**
 * Thresholds for determineThreatLevel() — pirate encounter threat classification.
 */
export const THREAT_LEVEL_CONFIG = {
  CARGO_VALUE_DANGEROUS: 10000,
  CARGO_VALUE_STRONG: 5000,
  HULL_CRITICAL: 30,
  HULL_WARNING: 60,
  OUTLAW_REP_STRONG: 50,
  OUTLAW_REP_WEAK: 50,
};

/**
 * Thresholds for determineInspectionSeverity() — customs inspection classification.
 */
export const INSPECTION_SEVERITY_CONFIG = {
  AUTHORITY_REP_THOROUGH: -25,
};

/**
 * Combat Resolution Configuration
 *
 * Configuration for combat choices, success rates, and outcomes.
 * All modifier values are centralized here for consistency and tuning.
 */
export const COMBAT_CONFIG = {
  // Base success rates for combat options
  BASE_SUCCESS_RATES: {
    EVASIVE_MANEUVERS_RATE: 0.7, // 70% base success chance for evasive maneuvers
    RETURN_FIRE_RATE: 0.45, // 45% base success chance for return fire
    DISTRESS_CALL_RATE: 0.3, // 30% base success chance for distress call
  },

  // Resource costs and damage values
  COSTS_AND_DAMAGE: {
    EVASIVE_SUCCESS_FUEL_COST: 15, // Fuel percentage consumed on successful evasion
    EVASIVE_SUCCESS_ENGINE_COST: 5, // Engine condition lost on successful evasion
    EVASIVE_FAILURE_HULL_DAMAGE: 20, // Hull damage on failed evasion
    RETURN_FIRE_SUCCESS_HULL_DAMAGE: 10, // Hull damage on successful return fire (minor)
    RETURN_FIRE_SUCCESS_OUTLAW_REP: 5, // Outlaw reputation gained for fighting pirates
    RETURN_FIRE_FAILURE_HULL_DAMAGE: 30, // Hull damage on failed return fire (heavy)
    RETURN_FIRE_FAILURE_CREDITS_LOSS: 500, // Credits lost on failed return fire (boarding)
    DUMP_CARGO_LOSS_PERCENT: 50, // Percentage of cargo lost when dumping
    DUMP_CARGO_FUEL_COST: 10, // Fuel percentage consumed when dumping cargo
    DISTRESS_SUCCESS_AUTHORITY_REP: 5, // Authority reputation gained on successful distress call
    DISTRESS_FAILURE_HULL_DAMAGE: 25, // Hull damage on failed distress call
  },

  // Evasive maneuvers - attempt to flee using engine power
  EVASIVE: {
    BASE_CHANCE: 0.7, // Uses BASE_SUCCESS_RATES.EVASIVE_MANEUVERS_RATE
    SUCCESS_FUEL_COST: 15, // Uses COSTS_AND_DAMAGE.EVASIVE_SUCCESS_FUEL_COST
    SUCCESS_ENGINE_COST: 5, // Uses COSTS_AND_DAMAGE.EVASIVE_SUCCESS_ENGINE_COST
    FAILURE_HULL_DAMAGE: 20, // Uses COSTS_AND_DAMAGE.EVASIVE_FAILURE_HULL_DAMAGE
  },

  // Return fire - engage in combat
  RETURN_FIRE: {
    BASE_CHANCE: 0.45, // Uses BASE_SUCCESS_RATES.RETURN_FIRE_RATE
    SUCCESS_HULL_DAMAGE: 10, // Uses COSTS_AND_DAMAGE.RETURN_FIRE_SUCCESS_HULL_DAMAGE
    SUCCESS_OUTLAW_REP: 5, // Uses COSTS_AND_DAMAGE.RETURN_FIRE_SUCCESS_OUTLAW_REP
    FAILURE_HULL_DAMAGE: 30, // Uses COSTS_AND_DAMAGE.RETURN_FIRE_FAILURE_HULL_DAMAGE
    FAILURE_CREDITS_LOSS: 500, // Uses COSTS_AND_DAMAGE.RETURN_FIRE_FAILURE_CREDITS_LOSS
  },

  // Dump cargo - guaranteed escape but lose cargo
  DUMP_CARGO: {
    CARGO_LOSS_PERCENT: 50, // Uses COSTS_AND_DAMAGE.DUMP_CARGO_LOSS_PERCENT
    FUEL_COST: 10, // Uses COSTS_AND_DAMAGE.DUMP_CARGO_FUEL_COST
  },

  // Distress call - call for patrol assistance
  DISTRESS_CALL: {
    BASE_CHANCE: 0.3, // Uses BASE_SUCCESS_RATES.DISTRESS_CALL_RATE
    SUCCESS_REP_GAIN: 5, // Uses COSTS_AND_DAMAGE.DISTRESS_SUCCESS_AUTHORITY_REP
    FAILURE_HULL_DAMAGE: 25, // Uses COSTS_AND_DAMAGE.DISTRESS_FAILURE_HULL_DAMAGE
  },

  // Engine condition threshold for combat penalties (different from SHIP_CONFIG.ENGINE_CONDITION_PENALTIES.THRESHOLD which is for fuel/time)
  ENGINE_PENALTY_THRESHOLD: 50,

  // Quirk and upgrade modifier values
  QUIRK_UPGRADE_BONUSES: {
    HOT_THRUSTER_EVASIVE_BONUS: 0.1, // +10% evasive success for hot_thruster quirk
    LUCKY_SHIP_BASE_NEGATE_CHANCE: 0.05, // 5% base chance to negate bad outcome for lucky_ship quirk
    REINFORCED_HULL_DAMAGE_REDUCTION: 0.25, // 25% less hull damage taken with reinforced_hull upgrade
    EFFICIENT_DRIVE_FLEE_BONUS: 0.1, // +10% flee success with efficient_drive upgrade
    SENSITIVE_SENSORS_DISTRESS_BONUS: 0.05, // +5% distress call success with sensitive_sensors quirk
    LEAKY_SEALS_DAMAGE_INCREASE: 0.1, // 10% more hull damage taken with leaky_seals quirk
  },

  // Quirk and upgrade modifiers for combat resolution
  MODIFIERS: {
    hot_thruster: { evasiveBonus: 0.1 }, // Uses QUIRK_UPGRADE_BONUSES.HOT_THRUSTER_EVASIVE_BONUS
    lucky_ship: { negateChanceBase: 0.05 }, // Uses QUIRK_UPGRADE_BONUSES.LUCKY_SHIP_BASE_NEGATE_CHANCE
    reinforced_hull: { damageReduction: 0.25 }, // Uses QUIRK_UPGRADE_BONUSES.REINFORCED_HULL_DAMAGE_REDUCTION
    efficient_drive: { fleeBonus: 0.1 }, // Uses QUIRK_UPGRADE_BONUSES.EFFICIENT_DRIVE_FLEE_BONUS
    sensitive_sensors: { distressBonus: 0.05 }, // Uses QUIRK_UPGRADE_BONUSES.SENSITIVE_SENSORS_DISTRESS_BONUS
    leaky_seals: { damageIncrease: 0.1 }, // Uses QUIRK_UPGRADE_BONUSES.LEAKY_SEALS_DAMAGE_INCREASE
  },
};

/**
 * Negotiation Configuration
 *
 * Configuration for dialogue-based pirate encounter resolution.
 * All success rates and outcome values are centralized for game balance tuning.
 */
export const NEGOTIATION_CONFIG = {
  // Base success rates for negotiation options
  BASE_SUCCESS_RATES: {
    COUNTER_PROPOSAL_RATE: 0.6, // 60% base success chance for counter-proposal
    MEDICINE_SYMPATHY_RATE: 0.4, // 40% chance pirates show sympathy for medicine claim
  },

  // Cargo and reputation costs/gains
  OUTCOME_VALUES: {
    COUNTER_PROPOSAL_SUCCESS_CARGO_PERCENT: 10, // Cargo percentage paid on successful counter-proposal
    COUNTER_PROPOSAL_FAILURE_STRENGTH_INCREASE: 0.1, // Enemy strength increase on failed counter-proposal (+10%)
    INTEL_OFFER_REP_PENALTY: -10, // Reputation penalty if intel offer is discovered
    INTEL_OFFER_OUTLAW_REP_GAIN: 3, // Outlaw reputation for cooperating with pirates
    ACCEPT_DEMAND_CARGO_PERCENT: 20, // Cargo percentage paid when accepting initial demand
  },

  // Counter-proposal - attempt to negotiate lower payment
  COUNTER_PROPOSAL: {
    BASE_CHANCE: 0.6, // Uses BASE_SUCCESS_RATES.COUNTER_PROPOSAL_RATE
    SUCCESS_CARGO_PERCENT: 10, // Uses OUTCOME_VALUES.COUNTER_PROPOSAL_SUCCESS_CARGO_PERCENT
    FAILURE_STRENGTH_INCREASE: 0.1, // Uses OUTCOME_VALUES.COUNTER_PROPOSAL_FAILURE_STRENGTH_INCREASE
  },

  // Medicine claim - claim to carry medicine for sympathy
  MEDICINE_CLAIM: {
    SYMPATHY_CHANCE: 0.4, // Uses BASE_SUCCESS_RATES.MEDICINE_SYMPATHY_RATE
    LIE_STRENGTH_INCREASE: 0.2, // Enemy strength increase when caught lying about medicine (+20%)
  },

  // Intel offer - offer information about other ships
  INTEL_OFFER: {
    BASE_SUCCESS_RATE: 0.8, // High success rate for intel trading (80%)
    SUSPICIOUS_STRENGTH_INCREASE: 0.15, // Enemy strength increase when suspicious of intel (+15%)
    SUCCESS_REP_PENALTY: -10, // Uses OUTCOME_VALUES.INTEL_OFFER_REP_PENALTY
    OUTLAW_REP_GAIN: 3, // Uses OUTCOME_VALUES.INTEL_OFFER_OUTLAW_REP_GAIN
  },

  // Accept demand - pay the initial demand
  ACCEPT_DEMAND: {
    CARGO_PERCENT: 20, // Uses OUTCOME_VALUES.ACCEPT_DEMAND_CARGO_PERCENT
  },
};

/**
 * Inspection Configuration
 *
 * Configuration for customs inspection encounters and outcomes.
 * All fine amounts, success rates, and penalties are centralized for balance tuning.
 */
export const INSPECTION_CONFIG = {
  // Fine amounts for various violations
  FINE_AMOUNTS: {
    RESTRICTED_GOODS_FINE: 1000, // Fine for carrying restricted goods
    HIDDEN_CARGO_DISCOVERY_FINE: 2000, // Fine for hidden cargo discovery
    BRIBERY_ATTEMPT_COST: 500, // Credits cost to attempt bribe
    BRIBERY_FAILURE_ADDITIONAL_FINE: 1500, // Additional fine on bribery failure
  },

  // Success rates and discovery chances
  SUCCESS_RATES: {
    BRIBERY_BASE_CHANCE: 0.6, // 60% base success chance for bribery
    HIDDEN_CARGO_BASE_DISCOVERY_CHANCE: 0.1, // 10% base chance to discover hidden cargo
  },

  // Reputation changes for various actions
  REPUTATION_CHANGES: {
    COOPERATION_AUTHORITY_REP_GAIN: 5, // Authority reputation for cooperation
    BRIBERY_ATTEMPT_AUTHORITY_REP_PENALTY: -10, // Authority reputation penalty for attempting bribe
    FLEEING_AUTHORITY_REP_PENALTY: -15, // Authority reputation penalty for fleeing
    RESTRICTED_GOODS_AUTHORITY_REP_PENALTY: -10, // Authority rep penalty for restricted goods
    HIDDEN_CARGO_AUTHORITY_REP_PENALTY: -20, // Authority rep penalty for hidden cargo
    SMUGGLING_OUTLAW_REP_BONUS: 5, // Outlaw rep bonus when smuggling discovered
  },

  // Cooperate - comply with inspection
  COOPERATE: {
    RESTRICTED_FINE: 1000, // Uses FINE_AMOUNTS.RESTRICTED_GOODS_FINE
    HIDDEN_FINE: 2000, // Uses FINE_AMOUNTS.HIDDEN_CARGO_DISCOVERY_FINE
    AUTHORITY_REP_GAIN: 5, // Uses REPUTATION_CHANGES.COOPERATION_AUTHORITY_REP_GAIN
  },

  // Bribery - attempt to bribe inspector
  BRIBE: {
    COST: 500, // Uses FINE_AMOUNTS.BRIBERY_ATTEMPT_COST
    BASE_CHANCE: 0.6, // Uses SUCCESS_RATES.BRIBERY_BASE_CHANCE
    FAILURE_ADDITIONAL_FINE: 1500, // Uses FINE_AMOUNTS.BRIBERY_FAILURE_ADDITIONAL_FINE
    AUTHORITY_REP_PENALTY: -10, // Uses REPUTATION_CHANGES.BRIBERY_ATTEMPT_AUTHORITY_REP_PENALTY
  },

  // Flee - attempt to escape inspection
  FLEE: {
    AUTHORITY_REP_PENALTY: -15, // Uses REPUTATION_CHANGES.FLEEING_AUTHORITY_REP_PENALTY
    FUEL_COST: 5, // Emergency burn fuel cost
    HULL_COST: 5, // Hull stress from hard maneuver
  },

  // Hidden cargo discovery
  HIDDEN_CARGO_DISCOVERY_CHANCE: 0.1, // Uses SUCCESS_RATES.HIDDEN_CARGO_BASE_DISCOVERY_CHANCE

  // Security level multipliers for hidden cargo discovery
  // Higher security = higher chance to find hidden compartments
  SECURITY_LEVEL_MULTIPLIERS: {
    CORE_SYSTEMS_MULTIPLIER: 2.0, // Sol, Alpha Centauri (systems 0, 1)
    SAFE_ZONE_MULTIPLIER: 1.5, // Other safe zone systems
    CONTESTED_ZONE_MULTIPLIER: 1.0, // Contested zones (base rate)
    DANGEROUS_ZONE_MULTIPLIER: 0.5, // Dangerous zones (less thorough inspections)
    core: 2.0, // Uses CORE_SYSTEMS_MULTIPLIER
    safe: 1.5, // Uses SAFE_ZONE_MULTIPLIER
    contested: 1.0, // Uses CONTESTED_ZONE_MULTIPLIER
    dangerous: 0.5, // Uses DANGEROUS_ZONE_MULTIPLIER
  },

  // Reputation penalties for violations
  REPUTATION_PENALTIES: {
    RESTRICTED_GOODS: -10, // Uses REPUTATION_CHANGES.RESTRICTED_GOODS_AUTHORITY_REP_PENALTY
    HIDDEN_CARGO: -20, // Uses REPUTATION_CHANGES.HIDDEN_CARGO_AUTHORITY_REP_PENALTY
    SMUGGLING_OUTLAW_BONUS: 5, // Uses REPUTATION_CHANGES.SMUGGLING_OUTLAW_REP_BONUS
  },
};

/**
 * Mechanical Failure Configuration
 *
 * Configuration for ship system failures based on condition levels.
 * All thresholds, chances, and costs are centralized for balance tuning.
 */
export const FAILURE_CONFIG = {
  // Condition thresholds for different failure types
  CONDITION_THRESHOLDS: {
    HULL_BREACH_THRESHOLD: 50, // Hull percentage below which breach can occur
    ENGINE_FAILURE_THRESHOLD: 30, // Engine percentage below which failure can occur
    LIFE_SUPPORT_FAILURE_THRESHOLD: 30, // Life support percentage below which failure can occur
  },

  // Failure probability rates
  FAILURE_CHANCES: {
    HULL_BREACH_CHANCE: 0.1, // 10% chance per jump when hull below threshold
    ENGINE_FAILURE_CHANCE: 0.15, // 15% chance per jump when engine below threshold
    LIFE_SUPPORT_FAILURE_CHANCE: 0.05, // 5% chance per jump when life support below threshold
  },

  // Repair option success rates and costs
  REPAIR_OPTIONS: {
    EMERGENCY_RESTART_SUCCESS_RATE: 0.5, // 50% success chance for emergency restart
    EMERGENCY_RESTART_ENGINE_COST: 10, // Engine condition cost for emergency restart
    CALL_FOR_HELP_CREDITS_COST: 1000, // Credits cost for calling help
    CALL_FOR_HELP_DAYS_DELAY: 2, // Days delay when calling for help
    JURY_RIG_SUCCESS_RATE: 0.75, // 75% success chance for jury-rig repair
    JURY_RIG_ENGINE_COST: 5, // Engine condition cost for jury-rig repair
  },

  // Damage amounts for failures
  DAMAGE_AMOUNTS: {
    HULL_BREACH_ADDITIONAL_DAMAGE: 5, // Additional hull damage from breach
    TOTAL_CARGO_LOSS_PERCENT: 100, // Percentage representing complete cargo loss
  },

  // Hull breach - occurs when hull condition is low
  HULL_BREACH: {
    CONDITION_THRESHOLD: 50, // Uses CONDITION_THRESHOLDS.HULL_BREACH_THRESHOLD
    CHANCE: 0.1, // Uses FAILURE_CHANCES.HULL_BREACH_CHANCE
    HULL_DAMAGE: 5, // Uses DAMAGE_AMOUNTS.HULL_BREACH_ADDITIONAL_DAMAGE
  },

  // Engine failure - occurs when engine condition is very low
  ENGINE_FAILURE: {
    CONDITION_THRESHOLD: 30, // Uses CONDITION_THRESHOLDS.ENGINE_FAILURE_THRESHOLD
    CHANCE: 0.15, // Uses FAILURE_CHANCES.ENGINE_FAILURE_CHANCE
    // Emergency restart option
    EMERGENCY_RESTART: {
      CHANCE: 0.5, // Uses REPAIR_OPTIONS.EMERGENCY_RESTART_SUCCESS_RATE
      ENGINE_COST: 10, // Uses REPAIR_OPTIONS.EMERGENCY_RESTART_ENGINE_COST
    },
    // Call for help option
    CALL_FOR_HELP: {
      CREDITS_COST: 1000, // Uses REPAIR_OPTIONS.CALL_FOR_HELP_CREDITS_COST
      DAYS_DELAY: 2, // Uses REPAIR_OPTIONS.CALL_FOR_HELP_DAYS_DELAY
    },
    // Jury-rig repair option
    JURY_RIG: {
      CHANCE: 0.75, // Uses REPAIR_OPTIONS.JURY_RIG_SUCCESS_RATE
      ENGINE_COST: 5, // Uses REPAIR_OPTIONS.JURY_RIG_ENGINE_COST
    },
  },

  // Life support emergency - occurs when life support is very low
  LIFE_SUPPORT: {
    CONDITION_THRESHOLD: 30, // Uses CONDITION_THRESHOLDS.LIFE_SUPPORT_FAILURE_THRESHOLD
    CHANCE: 0.05, // Uses FAILURE_CHANCES.LIFE_SUPPORT_FAILURE_CHANCE
    EMERGENCY_COST: 5, // Life support condition lost during emergency
  },
};

/**
 * Distress Call Configuration
 *
 * Configuration for distress call encounters and moral choices.
 * All costs, rewards, and karma/reputation changes are centralized for balance tuning.
 */
export const DISTRESS_CONFIG = {
  // Base chance to encounter a distress call during jump
  CHANCE: 0.1, // 10% chance per jump to encounter distress call

  // Severity level colors for UI display
  SEVERITY_COLORS: {
    routine: '#00ff88', // Green - standard maintenance call
    moderate: '#ffaa00', // Orange - genuine emergency
    urgent: '#ff6b6b', // Red - life-threatening situation
    critical: '#ff0000', // Bright red - immediate danger
    unknown: '#ffffff', // White - unknown severity
  },

  // Respond - help the distressed vessel
  RESPOND: {
    DAYS_COST: 2, // Days delay for responding to distress call
    FUEL_COST: 15, // Fuel percentage consumed when responding
    LIFE_SUPPORT_COST: 5, // Life support condition cost when responding
    CREDITS_REWARD: 150, // Credits reward for responding to distress call
    REP_REWARD: 10, // Civilian reputation reward for helping
    KARMA_REWARD: 1, // Karma reward for helping civilians
  },

  // Ignore - pass by without helping
  IGNORE: {
    KARMA_PENALTY: -1, // Karma penalty for ignoring distress call
  },

  // Loot - take advantage of the distressed vessel
  LOOT: {
    DAYS_COST: 1, // Days delay for looting distressed vessel
    KARMA_PENALTY: -3, // Karma penalty for looting distressed vessel
    REP_PENALTY: -15, // Civilian reputation penalty for looting
    OUTLAW_REP_GAIN: 5, // Outlaw reputation for piracy behavior
    SALVAGE_PARTS_QTY: 2, // Units of salvaged parts awarded for looting
  },
};

/**
 * Karma System Configuration
 *
 * Configuration for the moral alignment tracking system.
 * Karma affects random event outcomes and NPC first impressions.
 * All bounds and scaling factors are centralized for balance tuning.
 */
export const KARMA_CONFIG = {
  // Karma value bounds
  MIN: -100, // Minimum karma value (maximum evil)
  MAX: 100, // Maximum karma value (maximum good)
  INITIAL: 0, // Starting karma for new games (morally neutral)

  // Karma scaling factors for various effects
  SCALING_FACTORS: {
    LUCKY_SHIP_KARMA_SCALE: 0.001, // Karma effect on lucky_ship quirk effectiveness
    SUCCESS_RATE_SCALE: 0.0005, // Karma effect on success rates (hidden modifier)
  },

  // Karma affects lucky_ship quirk effectiveness
  // Effective chance = BASE + (karma * SCALE)
  // At karma 100: 5% + (100 * 0.001) = 15%
  // At karma -100: 5% + (-100 * 0.001) = -5% (clamped to 0)
  LUCKY_SHIP_KARMA_SCALE: 0.001, // Uses SCALING_FACTORS.LUCKY_SHIP_KARMA_SCALE

  // Karma as hidden modifier on success rates
  // Applied to combat, negotiation, and other chance-based outcomes
  // At karma 100: +5% success rate
  // At karma -100: -5% success rate
  SUCCESS_RATE_SCALE: 0.0005, // Uses SCALING_FACTORS.SUCCESS_RATE_SCALE

  // Karma thresholds for dialogue conditions (faction-karma-conditions.js)
  THRESHOLDS: {
    VERY_GOOD: 50,
    GOOD: 25,
    BAD: -25,
    VERY_BAD: -50,
  },

  // Karma thresholds for UI display (different from dialogue thresholds)
  DISPLAY_THRESHOLDS: {
    SAINT: 50,
    GOOD: 20,
    BAD: -20,
    VILLAIN: -50,
  },
};

/**
 * Faction Reputation Configuration
 *
 * Configuration for faction standing with different groups.
 * Faction reputation affects encounter probabilities and NPC attitudes.
 * All bounds and faction lists are centralized for consistency.
 */
export const FACTION_CONFIG = {
  // Reputation value bounds (same as karma system)
  MIN: -100, // Minimum faction reputation (maximum hostility)
  MAX: 100, // Maximum faction reputation (maximum trust)
  INITIAL: 0, // Starting reputation for new games (neutral standing)

  // List of all factions in the game
  FACTIONS: ['authorities', 'traders', 'outlaws', 'civilians'],

  // Reputation thresholds for dialogue conditions
  REPUTATION_THRESHOLDS: {
    VERY_HIGH: 75,
    HIGH: 50,
    MODERATE: 25,
    LOW: -25,
    VERY_LOW: -50,
    EXTREME_LOW: -75,
  },
};

/**
 * Pirate Credit Demand Configuration
 *
 * When pirates encounter a ship with no trade cargo, they demand flat credits
 * instead of a percentage of cargo. If the player can't pay, pirates may
 * kidnap a passenger (weighted by passenger value) or damage the ship.
 */
export const PIRATE_CREDIT_DEMAND_CONFIG = {
  MIN_CREDIT_DEMAND: 150,
  MAX_CREDIT_DEMAND: 250,
  CARGO_DEMAND_PERCENT: 20, // Percentage of cargo demanded in pirate encounters
  COUNTER_PROPOSAL_DISCOUNT: 0.5, // Fraction of MIN_CREDIT_DEMAND offered on successful counter-proposal

  KIDNAP_WEIGHTS: {
    wealthy: 0.8,
    business: 0.6,
    scientist: 0.5,
    family: 0.3,
    refugee: 0.15,
  },

  NO_PAYMENT_SHIP_DAMAGE: {
    MIN_PERCENT: 15,
    MAX_PERCENT: 25,
  },

  KIDNAP_FACTION_PENALTY: { civilians: -8 },
  KIDNAP_KARMA_PENALTY: -2,
};

/**
 * Restricted Goods Configuration
 *
 * Configuration for goods that are illegal or controlled in certain systems.
 * Restricted goods can only be sold legally in zones where they're NOT restricted.
 * In restricted zones, they can only be sold via black market contacts or hidden cargo.
 * All multipliers and risk factors are centralized for balance tuning.
 */
export const RESTRICTED_GOODS_CONFIG = {
  // Price multipliers for restricted goods trading
  PRICE_MULTIPLIERS: {
    PREMIUM_MULTIPLIER: 1.5, // 1.5x price when selling restricted goods legally (in non-restricted zones)
    BLACK_MARKET_MULTIPLIER: 2.0, // 2.0x price when selling via black market contacts in restricted zones
  },

  // Risk factors for illegal trading
  RISK_FACTORS: {
    CONFISCATION_RISK: 0.25, // 25% chance goods are confiscated if caught selling illegally
  },

  // Zone-based restrictions using existing commodities
  ZONE_RESTRICTIONS: {
    safe: ['electronics'], // High-tech goods restricted in core systems (military tech concerns)
    contested: ['medicine'], // Medical supplies restricted in contested zones (hoarding prevention)
    dangerous: ['tritium'], // Fuel restricted in dangerous zones (pirate supply concerns)
  },

  RESTRICTED_TOOLTIP:
    'Regulated in this zone. Risk of fines and confiscation during customs inspections.',

  // Core systems (Sol, Alpha Centauri) have additional restrictions
  CORE_SYSTEM_RESTRICTED: ['parts'], // Manufactured parts restricted to protect local industry
};

/**
 * Narrative Event System Configuration
 */
export const NARRATIVE_EVENT_CONFIG = {
  // Danger encounter priorities (higher = checked first)
  DANGER_PRIORITY_PIRATE: 100,
  DANGER_PRIORITY_INSPECTION: 80,
  DANGER_PRIORITY_MECHANICAL: 60,
  DANGER_PRIORITY_DISTRESS: 40,

  // Narrative event priority range
  NARRATIVE_PRIORITY_CRITICAL: 25,
  NARRATIVE_PRIORITY_HIGH: 20,
  NARRATIVE_PRIORITY_DEFAULT: 10,
  NARRATIVE_PRIORITY_LOW: 5,

  RUMOR_MAX_HOPS: 3,
};

/**
 * Condition types for the event engine's enum+params system.
 * Each key maps to a condition evaluator function.
 */
export const CONDITION_TYPES = {
  FIRST_VISIT: 'first_visit',
  FIRST_DOCK: 'first_dock',
  DEBT_ABOVE: 'debt_above',
  DEBT_BELOW: 'debt_below',
  KARMA_ABOVE: 'karma_above',
  KARMA_BELOW: 'karma_below',
  FUEL_BELOW: 'fuel_below',
  HULL_BELOW: 'hull_below',
  DAYS_PAST: 'days_past',
  HAS_VISITED: 'has_visited',
  HAS_CARGO: 'has_cargo',
  FLAG_SET: 'flag_set',
  FLAG_NOT_SET: 'flag_not_set',
  HAS_PASSENGER: 'has_passenger',
  HAS_WEALTHY_PASSENGER: 'has_wealthy_passenger',
  HAS_FAMILY_PASSENGER: 'has_family_passenger',
  NPC_REP_ABOVE: 'npc_rep_above',
  SYSTEMS_VISITED_COUNT: 'systems_visited_count',
  HAS_UPGRADE: 'has_upgrade',
  QUEST_STAGE: 'quest_stage',
  DEBT_ZERO: 'debt_zero',
  CREDITS_ABOVE: 'credits_above',
  HULL_ABOVE: 'hull_above',
  ENGINE_ABOVE: 'engine_above',
};

/**
 * Achievements System Configuration
 *
 * Defines achievement tier thresholds, karma/faction labels, and toast timing.
 * All numeric thresholds are centralized here — never hard-code in other files.
 */
export const ACHIEVEMENTS_CONFIG = {
  THRESHOLDS: {
    // Exploration: systems visited (max reachable = 47 via wormholes + 1 Delta Pavonis quest)
    EXPLORATION_TIER_1: 5,
    EXPLORATION_TIER_2: 15,
    EXPLORATION_TIER_3: 30,
    EXPLORATION_TIER_4: 48,

    // Trading: credits earned lifetime
    TRADING_TIER_1: 5000,
    TRADING_TIER_2: 25000,
    TRADING_TIER_3: 100000,
    TRADING_TIER_4: 500000,

    // Social: count of NPCs at Trusted tier or above
    SOCIAL_TIER_1: 1,
    SOCIAL_TIER_2: 3,
    SOCIAL_TIER_3: 5,
    SOCIAL_TIER_4: 8,

    // Survival: jumps completed
    SURVIVAL_TIER_1: 10,
    SURVIVAL_TIER_2: 50,
    SURVIVAL_TIER_3: 150,
    SURVIVAL_TIER_4: 300,

    // Danger: total danger encounters resolved (sum of all dangerFlags)
    DANGER_TIER_1: 3,
    DANGER_TIER_2: 10,
    DANGER_TIER_3: 25,
    DANGER_TIER_4: 50,

    // Moral: karma thresholds (absolute value — works for both good and evil)
    MORAL_TIER_1: 15,
    MORAL_TIER_2: 35,
    MORAL_TIER_3: 60,
    MORAL_TIER_4: 85,
  },

  // Karma display labels (evaluated top-to-bottom, first match wins)
  KARMA_LABELS: [
    { min: 75, label: 'Saint' },
    { min: 50, label: 'Virtuous' },
    { min: 25, label: 'Decent' },
    { min: -24, label: 'Neutral' },
    { min: -49, label: 'Shady' },
    { min: -74, label: 'Ruthless' },
    { min: -100, label: 'Villain' },
  ],

  // Faction standing labels (evaluated top-to-bottom, first match wins)
  FACTION_LABELS: [
    { min: 75, label: 'Allied' },
    { min: 50, label: 'Respected' },
    { min: 25, label: 'Favorable' },
    { min: -24, label: 'Neutral' },
    { min: -49, label: 'Suspicious' },
    { min: -74, label: 'Hostile' },
    { min: -100, label: 'Enemy' },
  ],

  TOAST_DURATION: 4000,
};

/**
 * Event names for the Bridge Pattern event system.
 * Used by EventSystemManager, all managers with emit() calls,
 * and React hooks (useGameEvent, useEventTriggers).
 *
 * Keys are UPPER_SNAKE_CASE, values are the camelCase strings
 * that flow through the event system.
 */
export const EVENT_NAMES = Object.freeze({
  // Player resources
  CREDITS_CHANGED: 'creditsChanged',
  DEBT_CHANGED: 'debtChanged',
  DEBT_CLEARED: 'debtCleared',
  FINANCE_CHANGED: 'financeChanged',

  // Ship systems
  FUEL_CHANGED: 'fuelChanged',
  SHIP_CONDITION_CHANGED: 'shipConditionChanged',
  HULL_CHANGED: 'hullChanged',
  ENGINE_CHANGED: 'engineChanged',
  LIFE_SUPPORT_CHANGED: 'lifeSupportChanged',
  SHIP_NAME_CHANGED: 'shipNameChanged',
  CONDITION_WARNING: 'conditionWarning',

  // Cargo & inventory
  CARGO_CHANGED: 'cargoChanged',
  CARGO_CAPACITY_CHANGED: 'cargoCapacityChanged',
  HIDDEN_CARGO_CHANGED: 'hiddenCargoChanged',

  // Navigation & location
  LOCATION_CHANGED: 'locationChanged',
  CURRENT_SYSTEM_CHANGED: 'currentSystemChanged',
  DOCKED: 'docked',
  UNDOCKED: 'undocked',
  JUMP_COMPLETED: 'jumpCompleted',

  // Time & events
  TIME_CHANGED: 'timeChanged',
  ACTIVE_EVENTS_CHANGED: 'activeEventsChanged',

  // Economy & trading
  PRICE_KNOWLEDGE_CHANGED: 'priceKnowledgeChanged',

  // Upgrades & quirks
  UPGRADES_CHANGED: 'upgradesChanged',
  QUIRKS_CHANGED: 'quirksChanged',

  // Dialogue & NPCs
  DIALOGUE_CHANGED: 'dialogueChanged',
  NPCS_CHANGED: 'npcsChanged',

  // Factions & karma
  FACTION_REP_CHANGED: 'factionRepChanged',
  KARMA_CHANGED: 'karmaChanged',

  // Missions & quests
  MISSIONS_CHANGED: 'missionsChanged',
  QUEST_CHANGED: 'questChanged',

  // Intelligence
  INTELLIGENCE_CHANGED: 'intelligenceChanged',

  // Encounters & narrative
  ENCOUNTER_TRIGGERED: 'encounterTriggered',
  NARRATIVE_EVENT_TRIGGERED: 'narrativeEventTriggered',

  // Animation coordination
  JUMP_ANIMATION_NEAR_END: 'jumpAnimationNearEnd',

  // Special
  PAVONIS_RUN_TRIGGERED: 'pavonisRunTriggered',
  EPILOGUE_PREVIEW_TRIGGERED: 'epiloguePreviewTriggered',

  // Achievements
  ACHIEVEMENT_UNLOCKED: 'achievementUnlocked',
  ACHIEVEMENTS_CHANGED: 'achievementsChanged',

  // Preferences
  PREFERENCES_CHANGED: 'preferencesChanged',

  // Errors
  SAVE_FAILED: 'saveFailed',
});

export const CREDITS_CONFIG = Object.freeze({
  SCROLL_SPEED_PX_PER_SEC: 25,
  FADE_OUT_MS: 2000,
  FADE_HOLD_MS: 800,
  FADE_IN_MS: 2000,
});
