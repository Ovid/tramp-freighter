# Design Document: Deterministic Economy System

## Overview

The Deterministic Economy system replaces the existing random price fluctuation model with a predictable, simulation-based economy. This design implements three core pricing factors that work together to create intuitive trade routes while maintaining economic dynamism:

1. **Technology Level Gradient**: Static price differentials based on distance from Sol
2. **Temporal Drift**: Smooth sine-wave price oscillations over time
3. **Local Market Saturation**: Player-driven supply/demand impacts that decay over time

The system preserves the existing economic events framework while removing random daily fluctuations, station count modifiers, and spectral class modifiers. This creates a more predictable economy where players can understand cause-and-effect relationships and plan multi-day trading strategies.

## Architecture

### System Components

The deterministic economy spans three existing modules:

1. **game-constants.js**: Centralized configuration (ECONOMY_CONFIG)
2. **game-trading.js**: Price calculation logic (TradingSystem)
3. **game-state.js**: Market conditions tracking (GameStateManager)

### Data Flow

```
Player Action (Buy/Sell)
    ↓
GameStateManager.buyGood() / sellGood()
    ↓
Update marketConditions in world state
    ↓
TradingSystem.calculatePrice()
    ├─ calculateTechLevel()
    ├─ getTechModifier()
    ├─ getTemporalModifier()
    ├─ getLocalModifier()
    └─ getEventModifier() [existing]
    ↓
Display updated prices in UI
```

### Time Advancement Flow

```
GameStateManager.updateTime()
    ↓
Apply market recovery (multiply by DAILY_RECOVERY_FACTOR)
    ↓
Prune insignificant market conditions
    ↓
Recalculate all known prices
    ↓
Emit priceKnowledgeChanged event
    ↓
UI updates displayed prices
```

## Components and Interfaces

### ECONOMY_CONFIG (game-constants.js)

New configuration object containing all tunable economy parameters:

```javascript
export const ECONOMY_CONFIG = {
  // Spatial configuration (calibrated for <21 LY map)
  MAX_COORD_DISTANCE: 21,
  MAX_TECH_LEVEL: 10.0,
  MIN_TECH_LEVEL: 1.0,

  // Market elasticity
  MARKET_CAPACITY: 1000,

  // Recovery rate (10% per day)
  DAILY_RECOVERY_FACTOR: 0.9,

  // Temporal drift period
  TEMPORAL_WAVE_PERIOD: 30,

  // Temporal amplitude (±15%)
  TEMPORAL_AMPLITUDE: 0.15,

  // Tech modifier intensity
  TECH_MODIFIER_INTENSITY: 0.08,

  // Local modifier bounds
  LOCAL_MODIFIER_MIN: 0.25,
  LOCAL_MODIFIER_MAX: 2.0,

  // Pruning threshold for market conditions
  MARKET_CONDITION_PRUNE_THRESHOLD: 1.0,

  // Tech biases (negative = cheaper at low-tech, positive = cheaper at high-tech)
  TECH_BIASES: {
    grain: -0.6,
    ore: -0.8,
    tritium: -0.3,
    parts: 0.5,
    medicine: 0.7,
    electronics: 1.0,
  },
};
```

### TradingSystem Updates (game-trading.js)

#### New Methods

**calculateTechLevel(system)**

- Computes Euclidean distance from Sol using existing `calculateDistanceFromSol()`
- Applies formula: `TL = 10.0 - (9.0 × min(distance, 21) / 21)`
- Returns: Technology Level (1.0 to 10.0)

**getTechModifier(goodType, techLevel)**

- Retrieves tech bias from ECONOMY_CONFIG.TECH_BIASES
- Applies formula: `1.0 + (bias × (5.0 - TL) × 0.08)`
- Returns: Tech modifier multiplier

**getTemporalModifier(systemId, currentDay)**

- Applies sine wave: `1.0 + (0.15 × sin((day / 30) + (systemId × 0.15)))`
- System ID offset creates phase differences between systems
- Returns: Temporal modifier (0.85 to 1.15)

**getLocalModifier(systemId, goodType, marketConditions)**

- Retrieves surplus/deficit from marketConditions
- Applies formula: `1.0 - (surplus / 1000)`
- Clamps result between 0.25 and 2.0
- Returns: Local modifier multiplier

#### Modified Methods

**calculatePrice(goodType, system, currentDay, activeEvents, marketConditions)**

- Add marketConditions parameter
- Remove spectral modifier calculation
- Remove station count modifier calculation
- Remove seeded random daily fluctuation
- Add tech level calculation
- Add tech modifier calculation
- Add temporal modifier calculation
- Add local modifier calculation
- Keep event modifier calculation (existing)
- Apply formula: `basePrice × techMod × temporalMod × localMod × eventMod`
- Round to nearest integer

### GameStateManager Updates (game-state.js)

#### New State Structure

Add to `world` object in `initNewGame()`:

```javascript
world: {
  visitedSystems: [SOL_SYSTEM_ID],
  priceKnowledge: { /* existing */ },
  activeEvents: [],
  marketConditions: {}  // NEW
}
```

Market conditions structure:

```javascript
marketConditions: {
  [systemId]: {
    [goodType]: netQuantity  // positive = surplus, negative = deficit
  }
}
```

#### New Methods

**updateMarketConditions(systemId, goodType, quantityDelta)**

- Creates system entry if first trade at that system
- Creates commodity entry if first trade of that commodity
- Adds quantityDelta to existing value (positive for sell, negative for buy)
- Called by buyGood() and sellGood()

**applyMarketRecovery(daysPassed)**

- Iterates over all marketConditions entries
- Multiplies each value by DAILY_RECOVERY_FACTOR ^ daysPassed
- Prunes entries where abs(value) < 1.0
- Removes empty system entries
- Called by updateTime()

**getMarketCondition(systemId, goodType)**

- Returns surplus/deficit value for a commodity at a system
- Returns 0 if no entry exists
- Used by TradingSystem.getLocalModifier()

#### Modified Methods

**buyGood(goodType, quantity, price)**

- After updating cargo, call: `updateMarketConditions(currentSystem, goodType, -quantity)`
- Negative quantity creates deficit (raises prices)

**sellGood(stackIndex, quantity, salePrice)**

- After updating cargo, call: `updateMarketConditions(currentSystem, goodType, quantity)`
- Positive quantity creates surplus (lowers prices)

**updateTime(newDays)**

- Calculate daysPassed: `newDays - oldDays`
- Call: `applyMarketRecovery(daysPassed)`
- Existing price recalculation will use updated market conditions

**recalculatePricesForKnownSystems()**

- Pass marketConditions to TradingSystem.calculatePrice()
- Ensures prices reflect current market saturation

**dock()**

- Pass marketConditions to TradingSystem.calculatePrice()
- Ensures docking shows current prices with local modifiers

## Data Models

### Market Conditions Data Structure

```javascript
// Sparse storage - only systems/commodities with active trading
{
  "0": {           // Sol (systemId)
    "grain": 150,  // Surplus: player sold 150 units
    "ore": -50     // Deficit: player bought 50 units
  },
  "1": {           // Alpha Centauri
    "electronics": 200
  }
  // Systems with no trading history are omitted
}
```

### Technology Level Calculation

```
Input: System coordinates (x, y, z)
Process:
  1. distance = sqrt(x² + y² + z²) × LY_PER_UNIT
  2. TL = 10.0 - (9.0 × min(distance, 21) / 21)
Output: Technology Level (1.0 to 10.0)

Examples:
  Sol (0, 0, 0): distance = 0 → TL = 10.0
  Barnard's Star (~6 LY): TL = 10.0 - (9.0 × 6/21) = 7.43
  Fringe (21+ LY): TL = 10.0 - (9.0 × 21/21) = 1.0
```

### Price Calculation Formula

```
P_final = P_base × M_tech × M_temporal × M_local × M_event

Where:
  M_tech = 1.0 + (bias × (5.0 - TL) × 0.08)
  M_temporal = 1.0 + (0.15 × sin((day / 30) + (sysId × 0.15)))
  M_local = clamp(1.0 - (surplus / 1000), 0.25, 2.0)
  M_event = existing event modifier (1.0 if no event)

Result: Round to nearest integer
```

### Market Recovery Formula

```
For each market condition value:
  newValue = oldValue × (0.90 ^ daysPassed)

If abs(newValue) < 1.0:
  Remove entry (insignificant impact)

Examples:
  Surplus of 200 after 1 day: 200 × 0.90 = 180
  Surplus of 200 after 6 days: 200 × 0.90^6 = 106.2
  Surplus of 5 after 1 day: 5 × 0.90 = 4.5
  Surplus of 0.8 after 1 day: Pruned (below threshold)
```
