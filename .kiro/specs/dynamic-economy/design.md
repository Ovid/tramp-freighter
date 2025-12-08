# Design Document: Dynamic Economy System

## Overview

The Dynamic Economy System transforms the fixed-price trading mechanics from Phase 1 into a living, breathing economy with daily price fluctuations, price discovery mechanics, economic events, information trading, and ship condition management. This phase adds strategic depth by making market intelligence valuable, creating maintenance costs, and introducing temporal dynamics where timing and information become critical to success.

Building on the Phase 1 foundation, this design:

- Extends the price calculation system with daily fluctuations and event modifiers
- Adds a price knowledge database for price discovery mechanics
- Implements an economic event system with random market disruptions
- Introduces information brokers for purchasing market intelligence
- Adds ship condition degradation and repair mechanics
- Enhances cargo tracking with purchase location and timing metadata

The core trading loop remains intact while adding layers of complexity that reward exploration, information gathering, and strategic planning.

## Architecture

### Extended Architecture

The Dynamic Economy builds on Phase 1's architecture by adding new systems and extending existing ones:

```
┌─────────────────────────────────────────────────────────┐
│                    starmap.html                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Three.js Starmap (Phase 1)                │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↕                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │    Game State Manager (Extended)                  │  │
│  │  - Ship condition tracking (NEW)                  │  │
│  │  - Price knowledge database (NEW)                 │  │
│  │  - Active events tracking (NEW)                   │  │
│  └───────────────────────────────────────────────────┘  │
│           ↕              ↕              ↕               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  Trading    │  │ Navigation  │  │  Save/Load  │      │
│  │  System     │  │  System     │  │  Manager    │      │
│  │ (Extended)  │  │ (Extended)  │  │ (Extended)  │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│           ↕              ↕              ↕               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Seeded    │  │  Economic   │  │ Information │      │
│  │   Random    │  │   Events    │  │   Broker    │      │
│  │   (NEW)     │  │   (NEW)     │  │   (NEW)     │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                          ↕                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │              UI Layer (Extended)                  │  │
│  │  - Ship condition bars (NEW)                      │  │
│  │  - Repair interface (NEW)                         │  │
│  │  - Info broker interface (NEW)                    │  │
│  │  - Event notifications (NEW)                      │  │
│  │  - Enhanced cargo display (NEW)                   │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↕                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Browser localStorage                      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### New Component Responsibilities

**Seeded Random Generator (New)**

- Provides deterministic random number generation
- Converts string seeds to numeric hashes
- Ensures price consistency across sessions
- Enables reproducible testing

**Economic Events System (New)**

- Manages active market events
- Triggers random events based on probability
- Applies event modifiers to prices
- Tracks event duration and expiration
- Displays event notifications to players

**Information Broker (New)**

- Calculates intelligence costs based on visit history
- Sells market data for unvisited or stale systems
- Generates market rumors with hints
- Updates price knowledge database on purchase

**Extended Trading System**

- Calculates prices with multiple modifiers (production, station count, daily fluctuation, events)
- Manages price knowledge database
- Tracks cargo purchase metadata (system, day)
- Displays profit calculations with historical context

**Extended Navigation System**

- Applies ship condition penalties to fuel consumption
- Applies ship condition penalties to jump time
- Degrades ship condition during jumps
- Validates jumps with condition-aware calculations

**Extended Game State Manager**

- Tracks ship condition (hull, engine, life support)
- Maintains price knowledge database
- Manages active economic events
- Increments time counters for price staleness
- Triggers condition warnings

## Components and Interfaces

### Extended Game State Structure

```javascript
const gameState = {
  // Player data (unchanged from Phase 1)
  player: {
    credits: number,
    debt: number,
    currentSystem: number,
    daysElapsed: number
  },

  // Ship data (extended)
  ship: {
    name: string,
    fuel: number,              // 0-100%
    hull: number,              // 0-100% (NEW)
    engine: number,            // 0-100% (NEW)
    lifeSupport: number,       // 0-100% (NEW)
    cargoCapacity: number,
    cargo: [
      {
        good: string,
        qty: number,
        purchasePrice: number,
        purchaseSystem: number,  // System ID (NEW)
        purchaseDay: number      // Day number (NEW)
      }
    ]
  },

  // World state (extended)
  world: {
    visitedSystems: number[],
    priceKnowledge: {          // (NEW)
      [systemId]: {
        lastVisit: number,     // Days since last visit (0 = current)
        prices: {
          grain: number,
          ore: number,
          tritium: number,
          parts: number,
          medicine: number,
          electronics: number
        }
      }
    },
    activeEvents: [            // (NEW)
      {
        id: string,            // Unique identifier
        type: string,          // Event type key
        systemId: number,      // Affected system
        startDay: number,      // Event start day
        endDay: number,        // Event end day
        modifiers: {           // Price modifiers
          [good]: number       // Multiplier for affected goods
        }
      }
    ]
  },

  // Metadata (unchanged)
  meta: {
    version: string,
    timestamp: number
  }
};
```

### Seeded Random Generator Interface

```javascript
class SeededRandom {
  /**
   * Create a seeded random number generator
   * @param {string} seed - Seed string for deterministic generation
   */
  constructor(seed)

  /**
   * Generate next random number in sequence
   * @returns {number} Random value between 0 and 1
   */
  next()

  /**
   * Generate random integer in range
   * @param {number} min - Minimum value (inclusive)
   * @param {number} max - Maximum value (inclusive)
   * @returns {number} Random integer
   */
  nextInt(min, max)

  /**
   * Generate random float in range
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random float
   */
  nextFloat(min, max)
}

// Static utility function
function seededRandom(seed) {
  return new SeededRandom(seed);
}
```

### Extended Trading System Interface

```javascript
class TradingSystem {
  // Existing from Phase 1
  static BASE_PRICES = { /* ... */ }
  static SPECTRAL_MODIFIERS = { /* ... */ }

  /**
   * Calculate price with all modifiers
   * @param {string} goodType - Commodity type
   * @param {Object} system - Star system data
   * @param {number} currentDay - Current game day
   * @param {Array} activeEvents - Active economic events
   * @returns {number} Final price in credits
   */
  static calculatePrice(goodType, system, currentDay, activeEvents)

  /**
   * Calculate production modifier from spectral class
   * @param {string} goodType - Commodity type
   * @param {string} spectralClass - System spectral class
   * @returns {number} Production multiplier
   */
  static getProductionModifier(goodType, spectralClass)

  /**
   * Calculate station count modifier
   * @param {number} stationCount - Number of stations in system
   * @returns {number} Station multiplier (1.0 + stationCount * 0.05)
   */
  static getStationCountModifier(stationCount)

  /**
   * Calculate daily fluctuation modifier
   * @param {number} systemId - System identifier
   * @param {string} goodType - Commodity type
   * @param {number} currentDay - Current game day
   * @returns {number} Fluctuation multiplier (0.85 to 1.15)
   */
  static getDailyFluctuation(systemId, goodType, currentDay)

  /**
   * Calculate event modifier for a good at a system
   * @param {number} systemId - System identifier
   * @param {string} goodType - Commodity type
   * @param {Array} activeEvents - Active economic events
   * @returns {number} Event multiplier (1.0 if no active event)
   */
  static getEventModifier(systemId, goodType, activeEvents)

  // Existing methods from Phase 1
  static calculateCargoUsed(cargo)
  static validatePurchase(credits, cargoSpace, quantity, price)
  static validateSale(cargo, stackIndex, quantity)
  static addCargoStack(cargo, goodType, quantity, price, systemId, day)  // Extended signature
  static removeFromCargoStack(cargo, stackIndex, quantity)
}
```

### Economic Events System Interface

```javascript
class EconomicEventsSystem {
  /**
   * Event type definitions
   */
  static EVENT_TYPES = {
    mining_strike: {
      name: "Mining Strike",
      description: "Workers demand better conditions",
      duration: [5, 10],  // Min/max days
      modifiers: {
        ore: 1.5,
        tritium: 1.3
      },
      chance: 0.05,  // 5% per day per eligible system
      targetSystems: "mining"  // Systems with ore production advantage
    },
    medical_emergency: {
      name: "Medical Emergency",
      description: "Outbreak requires urgent supplies",
      duration: [3, 5],
      modifiers: {
        medicine: 2.0,
        grain: 0.9,
        ore: 0.9
      },
      chance: 0.03,
      targetSystems: "any"
    },
    festival: {
      name: "Cultural Festival",
      description: "Celebration drives luxury demand",
      duration: [2, 4],
      modifiers: {
        electronics: 1.75,
        grain: 1.2
      },
      chance: 0.04,
      targetSystems: "core"  // Sol Sphere systems
    },
    supply_glut: {
      name: "Supply Glut",
      description: "Oversupply crashes prices",
      duration: [3, 7],
      modifiers: {
        // Random good at 0.6 (40% reduction)
      },
      chance: 0.06,
      targetSystems: "any"
    }
  }

  /**
   * Update events for new day
   * @param {Object} gameState - Current game state
   * @param {Array} starData - Star system data
   */
  static updateEvents(gameState, starData)

  /**
   * Check if system is eligible for event type
   * @param {Object} system - Star system data
   * @param {Object} eventType - Event type definition
   * @returns {boolean} True if eligible
   */
  static isSystemEligible(system, eventType)

  /**
   * Create new event instance
   * @param {string} eventTypeKey - Event type identifier
   * @param {number} systemId - Target system ID
   * @param {number} currentDay - Current game day
   * @returns {Object} Event instance
   */
  static createEvent(eventTypeKey, systemId, currentDay)

  /**
   * Remove expired events
   * @param {Array} activeEvents - Current active events
   * @param {number} currentDay - Current game day
   * @returns {Array} Filtered active events
   */
  static removeExpiredEvents(activeEvents, currentDay)

  /**
   * Get active event for system
   * @param {number} systemId - System identifier
   * @param {Array} activeEvents - Active events list
   * @returns {Object|null} Active event or null
   */
  static getActiveEventForSystem(systemId, activeEvents)
}
```

### Information Broker Interface

```javascript
class InformationBroker {
  /**
   * Pricing constants
   */
  static PRICES = {
    RECENT_VISIT: 50,      // System visited recently
    NEVER_VISITED: 100,    // System never visited
    STALE_VISIT: 75,       // System visited long ago
    RUMOR: 25              // Market rumor/hint
  }

  static RECENT_THRESHOLD = 30  // Days to consider "recent"

  /**
   * Calculate intelligence cost for a system
   * @param {number} systemId - Target system ID
   * @param {Object} priceKnowledge - Player's price knowledge
   * @returns {number} Cost in credits
   */
  static getIntelligenceCost(systemId, priceKnowledge)

  /**
   * Purchase market intelligence
   * @param {Object} gameState - Current game state
   * @param {number} systemId - Target system ID
   * @param {Array} starData - Star system data
   * @returns {Object} { success: boolean, reason: string }
   */
  static purchaseIntelligence(gameState, systemId, starData)

  /**
   * Generate market rumor
   * @param {Object} gameState - Current game state
   * @param {Array} starData - Star system data
   * @returns {string} Rumor text
   */
  static generateRumor(gameState, starData)

  /**
   * Validate intelligence purchase
   * @param {number} cost - Intelligence cost
   * @param {number} credits - Player credits
   * @returns {Object} { valid: boolean, reason: string }
   */
  static validatePurchase(cost, credits)
}
```

### Extended Navigation System Interface

```javascript
class NavigationSystem {
  // Existing from Phase 1
  constructor(starData, wormholeData)
  calculateDistanceFromSol(star)
  calculateDistanceBetween(star1, star2)
  calculateJumpTime(distance)  // Now considers engine condition
  calculateFuelCost(distance)  // Now considers engine condition
  areSystemsConnected(systemId1, systemId2)
  getConnectedSystems(systemId)

  /**
   * Calculate jump time with engine condition penalty
   * @param {number} distance - Distance in light years
   * @param {number} engineCondition - Engine condition percentage
   * @returns {number} Jump time in days
   */
  static calculateJumpTimeWithCondition(distance, engineCondition)

  /**
   * Calculate fuel cost with engine condition penalty
   * @param {number} distance - Distance in light years
   * @param {number} engineCondition - Engine condition percentage
   * @returns {number} Fuel cost percentage
   */
  static calculateFuelCostWithCondition(distance, engineCondition)

  /**
   * Apply ship degradation from jump
   * @param {Object} ship - Ship state
   * @param {number} jumpDays - Jump duration in days
   * @returns {Object} Updated ship state
   */
  static applyJumpDegradation(ship, jumpDays)

  /**
   * Validate jump with condition checks
   * @param {number} currentSystemId - Current system ID
   * @param {number} targetSystemId - Target system ID
   * @param {number} currentFuel - Current fuel percentage
   * @param {number} engineCondition - Engine condition percentage
   * @returns {Object} { valid: boolean, reason: string, fuelCost: number, jumpTime: number }
   */
  validateJump(currentSystemId, targetSystemId, currentFuel, engineCondition)

  /**
   * Execute jump with degradation
   * @param {Object} gameState - Current game state
   * @param {number} targetSystemId - Target system ID
   * @returns {Object} Updated game state
   */
  executeJump(gameState, targetSystemId)
}
```

### Extended Game State Manager Interface

```javascript
class GameStateManager {
  // Existing from Phase 1
  constructor(starData, wormholeData)
  initNewGame()  // Extended to initialize ship condition and price knowledge
  loadGame()
  getState()
  getPlayer()
  getShip()
  getCurrentSystem()
  getCargoUsed()
  getCargoRemaining()
  isSystemVisited(systemId)

  // New ship condition methods
  getShipCondition()
  updateShipCondition(hull, engine, lifeSupport)
  repairShipSystem(systemType, amount, cost)
  validateRepair(systemType, amount, cost, credits, currentCondition)
  getRepairCost(systemType, amount, currentCondition)
  checkConditionWarnings()

  // New price knowledge methods
  getPriceKnowledge()
  updatePriceKnowledge(systemId, prices, lastVisit)
  getKnownPrices(systemId)
  hasVisitedSystem(systemId)
  incrementPriceKnowledgeStaleness()

  // New event methods
  getActiveEvents()
  updateEvents()
  getActiveEventForSystem(systemId)

  // Extended trading methods
  buyGood(goodType, quantity, price)  // Now stores purchase system and day
  sellGood(stackIndex, quantity, salePrice)  // Now shows profit with context

  // Extended navigation methods
  executeJump(targetSystemId)  // Now applies degradation and updates price staleness

  // Existing methods
  updateCredits(newCredits)
  updateDebt(newDebt)
  updateFuel(newFuel)
  updateCargo(newCargo)
  updateLocation(newSystemId)
  updateTime(newDays)
  refuel(amount)
  dock()
  undock()
  saveGame()
  hasSavedGame()
  clearSave()
  isVersionCompatible(saveVersion)
  validateStateStructure(state)
}
```

## Data Models

### Ship Condition Model

Ship condition is tracked as three independent percentage values:

```javascript
{
  hull: number,         // 0-100%, structural integrity
  engine: number,       // 0-100%, propulsion efficiency
  lifeSupport: number   // 0-100%, environmental systems
}
```

**Degradation Rates (per jump):**

- Hull: -2% per jump (space debris, micro-meteorites)
- Engine: -1% per jump (wear and tear from wormhole transit)
- Life Support: -0.5% per day traveled (consumables, filter degradation)

**Performance Penalties:**

- Engine < 60%: +20% fuel consumption, +1 day jump time
- Hull < 50%: Warning (risk of cargo loss in future phases)
- Life Support < 20%: Critical warning (health risk in future phases)

**Repair Costs:**

- ₡5 per 1% restored for any system
- Example: Repairing hull from 78% to 100% costs ₡110 (22% × ₡5)

### Extended Cargo Stack Model

Cargo stacks now include purchase metadata:

```javascript
{
  good: string,          // Good type identifier
  qty: number,           // Quantity in this stack
  purchasePrice: number, // Price paid per unit
  purchaseSystem: number, // System ID where purchased
  purchaseDay: number    // Game day when purchased
}
```

**Rationale:** This metadata enables:

- Profit calculation with historical context
- "Days held" display for player decision-making
- Future features (cargo spoilage, time-sensitive missions)
- Better understanding of trading patterns

### Price Knowledge Model

The price knowledge database tracks observed prices:

```javascript
{
  [systemId]: {
    lastVisit: number,  // Days since last visit (0 = currently here)
    prices: {
      grain: number,
      ore: number,
      tritium: number,
      parts: number,
      medicine: number,
      electronics: number
    }
  }
}
```

**Update Rules:**

- New game: Sol's prices recorded with lastVisit = 0
- First visit: Record current prices with lastVisit = days since game start
- Dock at station: Update prices with lastVisit = 0
- Each day: Increment lastVisit for all known systems

**Display Rules:**

- Show prices only for systems in price knowledge
- Display staleness: "5 days ago", "current", "never visited"
- Highlight stale data (>10 days) in UI

### Economic Event Model

Events are temporary market conditions:

```javascript
{
  id: string,           // Unique identifier (e.g., "mining_strike_wolf359_day42")
  type: string,         // Event type key
  systemId: number,     // Affected system
  startDay: number,     // Event start day
  endDay: number,       // Event end day
  modifiers: {          // Price modifiers
    [good]: number      // Multiplier for affected goods
  }
}
```

**Event Types:**

1. **Mining Strike** (5-10 days): Ore +50%, Tritium +30%
2. **Medical Emergency** (3-5 days): Medicine +100%, Grain -10%, Ore -10%
3. **Festival** (2-4 days): Electronics +75%, Grain +20%
4. **Supply Glut** (3-7 days): Random good -40%

**Trigger Logic:**

- Each day, each system has a chance to trigger each event type
- System must match event's target criteria (mining systems, core systems, any)
- Only one event per system at a time
- Events expire automatically after duration

### Price Calculation Model

Prices are calculated with multiple modifiers:

```javascript
function calculatePrice(goodType, system, currentDay, activeEvents) {
  const basePrice = BASE_PRICES[goodType];

  // 1. Production modifier (spectral class)
  const productionMod = getProductionModifier(goodType, system.type);

  // 2. Station count modifier
  const stationMod = 1.0 + system.st * 0.05;

  // 3. Daily fluctuation (±30%)
  const dailyMod = getDailyFluctuation(system.id, goodType, currentDay);

  // 4. Event modifier (if active)
  const eventMod = getEventModifier(system.id, goodType, activeEvents);

  // Final price
  const price = basePrice * productionMod * stationMod * dailyMod * eventMod;
  return Math.round(price);
}
```

**Example Calculation:**

- Good: Grain
- System: Wolf 359 (M-class, 1 station)
- Day: 42
- Event: None

```
basePrice = 10
productionMod = 1.2 (M-class grain modifier)
stationMod = 1.05 (1 station)
dailyMod = 0.93 (seeded random for "wolf359_grain_42")
eventMod = 1.0 (no active event)

price = 10 × 1.2 × 1.05 × 0.93 × 1.0 = 11.718
rounded = 12 credits
```

### Seeded Random Implementation

Deterministic random number generation for price consistency:

```javascript
function seededRandom(seed) {
  // Convert string to numeric hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Return generator function
  return function () {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280; // 0 to 1
  };
}

// Usage for daily fluctuation
function getDailyFluctuation(systemId, goodType, currentDay) {
  const seed = `${systemId}_${goodType}_${currentDay}`;
  const rng = seededRandom(seed);
  const value = rng(); // 0 to 1

  // Map to 0.70 to 1.30 (±30%)
  return 0.7 + value * 0.6;
}
```

**Properties:**

- Same seed always produces same sequence
- Different seeds produce different sequences
- Deterministic across sessions and platforms
- Enables reproducible testing

##

Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Seeded Random Determinism

_For any_ seed string, generating a sequence of random numbers multiple times with the same seed should produce identical sequences.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: Daily Price Recalculation

_For any_ game state, when a new game day begins, all commodity prices should be recalculated using the seeded random function with the new day number.

**Validates: Requirements 2.1**

### Property 3: Price Calculation with All Modifiers

_For any_ commodity, system, day, and active events, the calculated price should equal the base price multiplied by production modifier, station count modifier, daily fluctuation, and event modifier.

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.8**

### Property 4: Station Count Modifier Formula

_For any_ system with N stations, the station count modifier should equal 1.0 + (N × 0.05).

**Validates: Requirements 2.4**

### Property 5: Daily Fluctuation Range

_For any_ system, commodity, and day, the daily fluctuation multiplier should be between 0.50 and 1.50 inclusive.

**Validates: Requirements 2.7**

### Property 6: Price Rounding

_For any_ calculated price, the final price should be rounded to the nearest integer credit value.

**Validates: Requirements 2.9**

### Property 7: First Visit Price Recording

_For any_ system visited for the first time, the current prices and visit day should be recorded in the price knowledge database.

**Validates: Requirements 3.2**

### Property 8: Dock Price Update

_For any_ docking operation, the price knowledge for that system should be updated with current prices and lastVisit set to zero.

**Validates: Requirements 3.3**

### Property 9: Display Only Known Prices

_For any_ trade interface display, only prices from systems in the price knowledge database should be shown.

**Validates: Requirements 3.4, 3.5**

### Property 10: Price Knowledge Staleness Increment

_For any_ time advancement, the lastVisit counter for all systems in the price knowledge database should increment by the number of days passed.

**Validates: Requirements 3.6**

### Property 11: Event Trigger Evaluation

_For any_ day advancement, each system should be evaluated for potential economic event triggers based on event chance percentages and eligibility criteria.

**Validates: Requirements 4.1, 4.2**

### Property 12: Event Creation Completeness

_For any_ triggered economic event, the created event should contain a unique identifier, type, system identifier, start day, end day, and price modifiers.

**Validates: Requirements 4.3**

### Property 13: Event Modifier Application

_For any_ active economic event, price modifiers should be applied to affected commodities in the event's system for the event duration.

**Validates: Requirements 4.4, 4.7**

### Property 14: Event Expiration Cleanup

_For any_ expired economic event (currentDay > endDay), the event should be removed from the active events list.

**Validates: Requirements 4.5**

### Property 15: Event Notification Display

_For any_ docking operation at a system with an active event, an event notification should be displayed with the event name, description, and expected duration.

**Validates: Requirements 4.6**

### Property 16: Information Broker System Listing

_For any_ information broker interface, all systems should be listed with their intelligence costs and last visit information.

**Validates: Requirements 5.2**

### Property 17: Intelligence Purchase Transaction

_For any_ valid intelligence purchase for a system, the player's credits should decrease by the cost and the price knowledge should be updated with current prices for that system.

**Validates: Requirements 5.3**

### Property 18: Intelligence Cost Calculation

_For any_ system, the intelligence cost should be: ₡50 if visited within 30 days, ₡100 if never visited, ₡75 if visited more than 30 days ago.

**Validates: Requirements 5.4, 5.5, 5.6**

### Property 19: Market Rumor Generation

_For any_ rumor purchase, a hint about current market conditions should be provided for ₡25, containing information about commodity prices or economic events in a specific system.

**Validates: Requirements 5.7, 5.8**

### Property 20: Intelligence Purchase Validation

_For any_ intelligence purchase attempt, the system should prevent the purchase and display a validation message if the player has insufficient credits.

**Validates: Requirements 5.9**

### Property 21: Jump Degradation Application

_For any_ jump with duration D days, the ship condition should degrade by: hull -2%, engine -1%, life support -(0.5% × D).

**Validates: Requirements 6.1**

### Property 22: Ship Condition Clamping

_For any_ ship condition value, the value should be clamped to the range [0, 100] and never go negative or above maximum.

**Validates: Requirements 6.2, 6.3**

### Property 23: Engine Condition Fuel Penalty

_For any_ jump when engine condition is below 60%, the fuel consumption should be increased by 20%.

**Validates: Requirements 6.4**

### Property 24: Engine Condition Time Penalty

_For any_ jump when engine condition is below 60%, the jump time should be increased by one additional day.

**Validates: Requirements 6.5**

### Property 25: Repair Interface Display Completeness

_For any_ repair interface, the display should show current condition percentages for hull, engine, and life support with visual progress bars, repair options for 10% increments and full restoration, and costs at ₡5 per 1% restored.

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 26: Repair Transaction Execution

_For any_ valid repair transaction with amount A and cost C for system S, the player's credits should decrease by C and the condition value for S should increase by A.

**Validates: Requirements 7.5**

### Property 27: Repair Validation

_For any_ repair attempt, the system should prevent the repair and display a validation message if: the player has insufficient credits, OR the system is already at 100% condition, OR the repair would exceed 100%.

**Validates: Requirements 7.6, 7.7, 7.8**

### Property 28: Repair All Cost Calculation

_For any_ repair interface, the repair all to full option should display the total cost equal to the sum of costs to repair each system to 100%.

**Validates: Requirements 7.9**

### Property 29: Ship Condition Warning Thresholds

_For any_ ship condition state, warnings should be displayed when: hull < 50% (cargo loss risk), engine < 30% (jump failure risk), life support < 20% (critical condition).

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 30: HUD Condition Bar Display

_For any_ HUD display, condition bars for fuel, hull, engine, and life support should be shown with labels and percentage values.

**Validates: Requirements 8.4**

### Property 31: Condition Bar Reactivity

_For any_ ship condition change, the visual width of the corresponding condition bar should update to reflect the current percentage.

**Validates: Requirements 8.5**

### Property 32: Condition Bar Visual Distinction

_For any_ condition bar display, each condition type (fuel, hull, engine, life support) should have distinct visual styling.

**Validates: Requirements 8.6**

### Property 33: Cargo Purchase Metadata Storage

_For any_ cargo purchase, the cargo stack should store the purchase price, purchase system identifier, and purchase day as flat fields in the structure.

**Validates: Requirements 9.1**

### Property 34: Cargo Display with Purchase Context

_For any_ cargo stack in the trade interface, the display should show the purchase price, system name where purchased, and number of days since purchase.

**Validates: Requirements 9.2, 9.3, 9.4**

### Property 35: Profit Calculation and Display

_For any_ cargo sale selection, the system should calculate and display the profit amount (sale price - purchase price) and profit percentage ((profit / purchase price) × 100).

**Validates: Requirements 9.5, 9.6, 9.7**

## Error Handling

### Error Categories

**Validation Errors (Extended from Phase 1)**

- Insufficient credits for intelligence purchase
- Insufficient credits for repair
- Invalid repair amount (exceeds 100% or system already at 100%)
- Invalid intelligence purchase (system already has current data)

**Data Errors (Extended from Phase 1)**

- Missing price knowledge data in save file
- Missing ship condition data in save file
- Invalid event data structure
- Corrupted seeded random state

**Calculation Errors**

- Invalid spectral class for modifier lookup
- Invalid event type reference
- Negative ship condition values (should be clamped)
- Invalid price calculation (NaN or Infinity)

### Error Handling Strategy

**User-Facing Errors**

- Display clear, actionable error messages in notification area
- Auto-dismiss after 3 seconds
- Queue multiple errors to prevent overlap
- Use consistent error message format

**Example Messages:**

- "Intelligence purchase failed: Insufficient credits"
- "Repair failed: Insufficient credits"
- "Repair failed: System already at maximum condition"
- "Cannot purchase intelligence: Prices already current"

**Data Recovery**

- Missing price knowledge: Initialize empty database, record current system
- Missing ship condition: Initialize to 100% for all systems
- Invalid event data: Clear active events, continue game
- Corrupted seeded random: Reinitialize with default seed

**Defensive Programming**

- Clamp ship condition values to [0, 100] range
- Validate event data structure before applying modifiers
- Check for NaN/Infinity in price calculations
- Verify spectral class exists in modifier table before lookup
- Validate day numbers are non-negative

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples, edge cases, and integration points:

**Seeded Random Generator**

- Same seed produces same sequence
- Different seeds produce different sequences
- Values are in range [0, 1)
- Hash conversion handles special characters
- Sequence generation follows formula

**Price Calculation**

- All modifiers applied correctly
- Spectral class modifiers lookup works
- Station count modifier formula correct
- Daily fluctuation in valid range
- Event modifiers applied when active
- Final price is integer
- Edge cases: zero stations, missing spectral class

**Price Knowledge**

- Sol initialized at game start
- First visit records prices
- Dock updates prices and resets lastVisit
- Time advancement increments staleness
- Display filters unknown systems

**Economic Events**

- Event creation has all required fields
- Event expiration removes from active list
- Event modifiers applied to prices
- Eligibility checking works correctly
- Multiple events don't overlap on same system

**Ship Condition**

- Degradation applied correctly per jump
- Clamping prevents negative values
- Clamping prevents values above 100
- Engine penalties applied at correct thresholds
- Warnings displayed at correct thresholds

**Information Broker**

- Cost calculation correct for all visit states
- Intelligence purchase updates price knowledge
- Rumor generation produces valid hints
- Validation prevents insufficient credit purchases

**Repairs**

- Cost calculation correct (₡5 per 1%)
- Repair transaction updates credits and condition
- Validation prevents over-repair
- Validation prevents insufficient credit repairs
- Repair all calculates total cost correctly

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** (JavaScript property testing library).

**Configuration:**

- Each property test should run a minimum of 100 iterations
- Use appropriate generators for game state, prices, events, conditions
- Tag each test with the property number and requirement reference

**Test Tagging Format:**

```javascript
// Feature: dynamic-economy, Property 1: Seeded Random Determinism
// Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
```

**Property Test Categories:**

**Seeded Random Properties (Property 1)**

- Generate random seed strings, verify deterministic sequences
- Verify values in range [0, 1)
- Verify same seed produces same sequence

**Price Calculation Properties (Properties 2-6)**

- Generate random systems, commodities, days, verify price formula
- Generate random station counts, verify modifier formula
- Generate random fluctuations, verify range [0.85, 1.15]
- Verify all prices are integers

**Price Knowledge Properties (Properties 7-10)**

- Generate random visits, verify price recording
- Generate random docking, verify price updates
- Generate random time advancement, verify staleness increment
- Verify only known prices displayed

**Event Properties (Properties 11-15)**

- Generate random days, verify event triggering logic
- Generate random events, verify structure completeness
- Generate random active events, verify modifier application
- Generate random time advancement, verify expiration cleanup
- Verify event notifications on docking

**Information Broker Properties (Properties 16-20)**

- Generate random price knowledge states, verify cost calculation
- Generate random intelligence purchases, verify transaction
- Generate random rumor requests, verify generation
- Verify validation prevents insufficient credit purchases

**Ship Condition Properties (Properties 21-24)**

- Generate random jumps, verify degradation formula
- Generate random condition values, verify clamping [0, 100]
- Generate random engine conditions, verify fuel penalty at <60%
- Generate random engine conditions, verify time penalty at <60%

**Repair Properties (Properties 25-28)**

- Generate random repair requests, verify cost calculation
- Generate random repairs, verify transaction
- Generate random invalid repairs, verify validation
- Verify repair all calculates total correctly

**Warning Properties (Property 29)**

- Generate random ship conditions, verify warnings at thresholds
- Verify hull warning at <50%
- Verify engine warning at <30%
- Verify life support warning at <20%

**Display Properties (Properties 30-35)**

- Generate random ship states, verify HUD displays all conditions
- Generate random condition changes, verify bar updates
- Generate random cargo purchases, verify metadata storage
- Generate random cargo displays, verify purchase context shown
- Generate random sales, verify profit calculation

**Generators:**

```javascript
// Seeded random seed generator
fc.string({ minLength: 1, maxLength: 50 });

// Ship condition generator
fc.record({
  hull: fc.integer({ min: 0, max: 100 }),
  engine: fc.integer({ min: 0, max: 100 }),
  lifeSupport: fc.integer({ min: 0, max: 100 }),
});

// Price knowledge generator
fc.dictionary(
  fc.integer({ min: 0, max: 116 }).map(String),
  fc.record({
    lastVisit: fc.integer({ min: 0, max: 100 }),
    prices: fc.record({
      grain: fc.integer({ min: 5, max: 50 }),
      ore: fc.integer({ min: 10, max: 60 }),
      tritium: fc.integer({ min: 30, max: 100 }),
      parts: fc.integer({ min: 20, max: 80 }),
      medicine: fc.integer({ min: 25, max: 90 }),
      electronics: fc.integer({ min: 20, max: 85 }),
    }),
  })
);

// Economic event generator
fc.record({
  id: fc.string(),
  type: fc.constantFrom(
    'mining_strike',
    'medical_emergency',
    'festival',
    'supply_glut'
  ),
  systemId: fc.integer({ min: 0, max: 116 }),
  startDay: fc.integer({ min: 0, max: 1000 }),
  endDay: fc.integer({ min: 0, max: 1000 }),
  modifiers: fc.dictionary(
    fc.constantFrom(
      'grain',
      'ore',
      'tritium',
      'parts',
      'medicine',
      'electronics'
    ),
    fc.float({ min: 0.5, max: 2.0 })
  ),
});

// Extended cargo stack generator
fc.record({
  good: fc.constantFrom(
    'grain',
    'ore',
    'tritium',
    'parts',
    'medicine',
    'electronics'
  ),
  qty: fc.integer({ min: 1, max: 50 }),
  purchasePrice: fc.integer({ min: 5, max: 100 }),
  purchaseSystem: fc.integer({ min: 0, max: 116 }),
  purchaseDay: fc.integer({ min: 0, max: 1000 }),
});
```

### Integration Testing

Integration tests will verify that components work together correctly:

**Dynamic Economy Flow**

- Start game → verify Sol prices in knowledge → advance day → verify prices change
- Visit new system → verify prices recorded → advance days → verify staleness increments
- Purchase intelligence → verify price knowledge updated → verify credits deducted

**Ship Condition Flow**

- Make jump → verify degradation applied → verify engine penalty if <60%
- Repair ship → verify credits deducted → verify condition increased
- Degrade to warning threshold → verify warning displayed

**Event Flow**

- Advance days → verify events trigger → verify prices affected
- Dock at event system → verify notification displayed
- Wait for event expiration → verify event removed → verify prices return to normal

**Trading with Context Flow**

- Buy cargo → verify metadata stored → advance days → sell cargo → verify profit calculation includes days held

**UI Integration**

- Change ship condition → verify HUD bars update
- Trigger warning → verify notification appears
- Open repair interface → verify costs calculated correctly
- Purchase intelligence → verify price knowledge updates → verify trade interface shows new prices

### Test Organization

```
tests/
├── unit/
│   ├── seeded-random.test.js
│   ├── price-calculation.test.js
│   ├── price-knowledge.test.js
│   ├── economic-events.test.js
│   ├── ship-condition.test.js
│   ├── information-broker.test.js
│   └── repairs.test.js
├── property/
│   ├── seeded-random.property.test.js
│   ├── price-calculation.property.test.js
│   ├── price-knowledge.property.test.js
│   ├── events.property.test.js
│   ├── ship-condition.property.test.js
│   ├── information-broker.property.test.js
│   ├── repairs.property.test.js
│   └── display.property.test.js
└── integration/
    ├── dynamic-economy-flow.integration.test.js
    ├── ship-condition-flow.integration.test.js
    └── event-flow.integration.test.js
```

### Testing Tools

- **Test Runner:** Vitest (fast, modern, ESM-native)
- **Property Testing:** fast-check (JavaScript property-based testing)
- **Assertions:** Vitest built-in assertions
- **DOM Testing:** @testing-library/dom (for UI components)
- **Coverage:** Vitest coverage (via c8)

### Coverage Goals

- Unit test coverage: >80% of business logic
- Property test coverage: All calculation and validation functions
- Integration test coverage: All major user flows
- Edge case coverage: All boundary conditions and error paths

## Implementation Details

### File Structure

Building on Phase 1's structure, new modules will be added:

```
starmap.html              # Main HTML file (existing, to be enhanced)
├── <script type="module">
│   ├── game-constants.js # (existing, to be extended)
│   ├── game-state.js     # (existing, to be extended)
│   ├── trading.js        # (existing, to be extended)
│   ├── navigation.js     # (existing, to be extended)
│   ├── save-load.js      # (existing, to be extended)
│   ├── ui.js             # (existing, to be extended)
│   ├── seeded-random.js  # (NEW)
│   ├── economic-events.js # (NEW)
│   └── information-broker.js # (NEW)
```

All JavaScript will remain embedded in `starmap.html` as ES6 modules for simplicity.

### State Management Extensions

**Extended Game State:**

- Add `ship.hull`, `ship.engine`, `ship.lifeSupport` (all default to 100)
- Add `ship.cargo[].purchaseSystem` and `ship.cargo[].purchaseDay`
- Add `world.priceKnowledge` object
- Add `world.activeEvents` array

**New State Mutations:**

- `updateShipCondition(hull, engine, lifeSupport)`
- `updatePriceKnowledge(systemId, prices, lastVisit)`
- `updateActiveEvents(events)`

**Event Subscriptions:**

- Add `shipConditionChanged` event
- Add `priceKnowledgeChanged` event
- Add `activeEventsChanged` event

### Integration with Phase 1

**Trading System Extensions:**

- Extend `calculatePrice()` to accept `currentDay` and `activeEvents` parameters
- Add helper methods for each modifier calculation
- Update `addCargoStack()` to accept `systemId` and `day` parameters
- Maintain backward compatibility with Phase 1 tests

**Navigation System Extensions:**

- Extend `calculateJumpTime()` and `calculateFuelCost()` to accept `engineCondition` parameter
- Add `applyJumpDegradation()` method
- Update `executeJump()` to apply degradation and update price staleness
- Maintain backward compatibility with Phase 1 jump mechanics

**Game State Manager Extensions:**

- Extend `initNewGame()` to initialize ship condition and Sol price knowledge
- Extend `loadGame()` to validate and migrate extended state structure
- Add new query methods for price knowledge and ship condition
- Add new mutation methods for repairs and intelligence purchases

**UI Extensions:**

- Add ship condition bars to HUD
- Add repair interface to station menu
- Add information broker interface to station menu
- Extend trade interface to show cargo purchase context
- Add event notification modal

**Save/Load Extensions:**

- Update save version to '2.0.0'
- Add migration logic from '1.0.0' to '2.0.0'
- Validate extended state structure on load
- Provide defaults for missing Phase 2 data

### localStorage Schema Extension

```javascript
{
  "version": "2.0.0",  // Updated version
  "timestamp": 1701234567890,
  "gameState": {
    "player": {
      "credits": 500,
      "debt": 10000,
      "currentSystem": 0,
      "daysElapsed": 0
    },
    "ship": {
      "name": "Serendipity",
      "fuel": 100,
      "hull": 100,           // NEW
      "engine": 100,         // NEW
      "lifeSupport": 100,    // NEW
      "cargoCapacity": 50,
      "cargo": [
        {
          "good": "grain",
          "qty": 20,
          "purchasePrice": 8,
          "purchaseSystem": 0,  // NEW
          "purchaseDay": 0      // NEW
        }
      ]
    },
    "world": {
      "visitedSystems": [0],
      "priceKnowledge": {    // NEW
        "0": {
          "lastVisit": 0,
          "prices": {
            "grain": 8,
            "ore": 15,
            "tritium": 60,
            "parts": 30,
            "medicine": 40,
            "electronics": 35
          }
        }
      },
      "activeEvents": []     // NEW
    }
  }
}
```

**Migration from v1.0.0:**

- Add `ship.hull = 100`
- Add `ship.engine = 100`
- Add `ship.lifeSupport = 100`
- Add `purchaseSystem = currentSystem` to all cargo stacks
- Add `purchaseDay = daysElapsed` to all cargo stacks
- Initialize `world.priceKnowledge` with current system prices
- Initialize `world.activeEvents = []`

### Performance Considerations

**Price Calculation:**

- Cache seeded random generators per system/good/day combination
- Recalculate prices only when day changes
- Batch price calculations for all goods at a system

**Event Processing:**

- Limit to one event per system at a time
- Process event triggers only on day change
- Use efficient data structures for event lookup (Map by systemId)

**Price Knowledge:**

- Store only visited systems (not all 117 systems)
- Update staleness in batch on day change
- Use Map for O(1) lookup by systemId

**UI Updates:**

- Throttle condition bar updates to 60fps
- Update price displays only when viewing trade interface
- Debounce repair cost calculations on input change

**Memory:**

- Price knowledge: ~1KB per system × visited systems
- Active events: ~200 bytes per event × max ~10 events
- Total additional memory: <20KB

### Browser Compatibility

**No New Requirements:**

- All Phase 2 features use ES6 features already required by Phase 1
- No new browser APIs needed
- Maintains compatibility with Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## Future Extensibility

This dynamic economy design supports future features:

**Cargo Spoilage (Phase 3+):**

- `purchaseDay` enables time-based cargo degradation
- Can add spoilage rates per commodity type
- Warning system already in place for notifications

**Time-Sensitive Missions (Phase 4+):**

- `daysElapsed` and `purchaseDay` enable delivery deadlines
- Event system can trigger mission-related events
- Price knowledge supports "deliver to best market" missions

**Advanced Economic Simulation (Phase 5+):**

- Supply/demand can affect base prices
- Player trading can influence local prices
- Event system can expand to include player-triggered events

**Ship Upgrades (Phase 3+):**

- Condition system can add upgrade slots
- Repairs can be extended to include upgrades
- Condition penalties can be modified by upgrades

**NPC Trading (Phase 3+):**

- Price knowledge can track NPC trading patterns
- Events can be triggered by NPC actions
- Information broker can provide NPC intelligence

## Open Questions

1. **Event Overlap:** Should multiple events be allowed at the same system? (Decision: No for MVP, one event per system to keep complexity manageable)

2. **Price Knowledge Sharing:** Should players be able to share price knowledge with NPCs? (Decision: No for Phase 2, add in Phase 3 with NPC relationships)

3. **Repair Partial Amounts:** Should players be able to repair arbitrary percentages or only 10% increments? (Decision: 10% increments for MVP, simplifies UI)

4. **Condition Catastrophic Failure:** Should ship systems fail completely at 0%? (Decision: No for Phase 2, just warnings. Add consequences in Phase 3)

5. **Price History:** Should we track historical prices for charting? (Decision: No for Phase 2, only current and last-known prices. Add in Phase 4 if requested)

6. **Event Notifications:** Should events be announced before docking? (Decision: No, only on dock. Adds mystery and encourages exploration)

7. **Intelligence Broker Personality:** Should the broker have dialogue/personality? (Decision: No for Phase 2, generic interface only. Add in Phase 3 with NPCs)

## Dependencies

**External:**

- Three.js (v0.150.0) - Already integrated via CDN (Phase 1)

**Development:**

- Vitest - Test runner (Phase 1)
- fast-check - Property-based testing (Phase 1)
- @testing-library/dom - DOM testing utilities (Phase 1)

**Runtime:**

- None (vanilla JavaScript, no build step required)

## Deployment

**Build Process:**

- No build step required (same as Phase 1)
- Single HTML file with embedded JavaScript
- Can be served from any static file server

**Hosting:**

- GitHub Pages (recommended)
- Any static hosting service
- Local file:// protocol (with localStorage limitations)

**Updates:**

- Replace starmap.html file
- Save data migration handled automatically by version checking
- Phase 1 saves will be migrated to Phase 2 format on load

## Success Metrics

**Functional:**

- All 35 correctness properties pass property-based tests
- All unit tests pass
- All integration tests pass
- No console errors during normal gameplay
- Save migration from Phase 1 to Phase 2 works correctly

**Performance:**

- Price calculation < 1ms per commodity
- Event processing < 10ms per day advancement
- Repair interface rendering < 50ms
- Information broker interface rendering < 100ms
- Save/load operations < 500ms (same as Phase 1)
- UI response time < 100ms (same as Phase 1)

**User Experience:**

- Players can observe price changes over multiple days
- Players can make informed trading decisions using price knowledge
- Players understand ship condition degradation and repair costs
- Economic events create noticeable market opportunities
- Information broker provides valuable intelligence
- Cargo purchase context helps with profit calculations

**Backward Compatibility:**

- Phase 1 saves load correctly and migrate to Phase 2 format
- All Phase 1 functionality remains intact
- Phase 1 tests continue to pass with Phase 2 extensions

## Risk Mitigation

**Complexity Risk:**

- Seeded random may be difficult to test → Use property-based testing with deterministic seeds
- Event system may have edge cases → Comprehensive unit tests for all event types
- Price calculation with multiple modifiers may have bugs → Property tests verify formula

**Performance Risk:**

- Price recalculation every day may be slow → Cache calculations, only recalculate on day change
- Event processing may lag → Limit to one event per system, efficient data structures

**Balance Risk:**

- Prices may be too volatile → Tune fluctuation range (±15% is conservative)
- Ship degradation may be too fast → Tune degradation rates based on playtesting
- Repair costs may be too high/low → Tune ₡5 per 1% based on economy balance

**Migration Risk:**

- Phase 1 saves may not migrate correctly → Comprehensive migration tests
- Missing data may cause crashes → Defensive programming with defaults
