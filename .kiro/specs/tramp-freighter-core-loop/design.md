# Design Document: Tramp Freighter Core Loop

## Overview

The Tramp Freighter Core Loop implements the foundational gameplay mechanics for a browser-based space trading game. Built on top of the existing Sol Sector Starmap (Three.js 3D visualization), this design adds game state management, trading mechanics, navigation with fuel consumption, and persistent save/load functionality using browser localStorage.

The core loop enables players to:
- Navigate between wormhole-connected star systems
- Buy and sell commodities at stations to generate profit
- Manage ship fuel consumption and refueling costs
- Track credits, debt, and elapsed time
- Save and resume game progress automatically

This MVP establishes the fundamental "buy low, sell high" trading loop with resource management that forms the foundation for future features (dynamic prices, NPCs, events, ship condition, etc.).

## Architecture

### High-Level Architecture

The game follows a client-side, event-driven architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    starmap.html                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Three.js Starmap (Existing)               │  │
│  │  - 3D Scene Rendering                             │  │
│  │  - Camera Controls                                │  │
│  │  - Star/Connection Visualization                  │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↕                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Game State Manager (New)                  │  │
│  │  - State initialization                           │  │
│  │  - State mutations                                │  │
│  │  - State queries                                  │  │
│  └───────────────────────────────────────────────────┘  │
│           ↕              ↕              ↕                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Trading    │  │ Navigation  │  │  Save/Load  │     │
│  │  System     │  │  System     │  │  Manager    │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│           ↕              ↕              ↕                │
│  ┌───────────────────────────────────────────────────┐  │
│  │              UI Layer (New)                       │  │
│  │  - HUD Overlay                                    │  │
│  │  - Station Interface                              │  │
│  │  - Trade/Refuel Panels                            │  │
│  │  - Error Notifications                            │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↕                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Browser localStorage                      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Starmap Visualization (Existing)**
- Renders 3D star systems and wormhole connections
- Handles camera controls (orbit, pan, zoom)
- Provides visual feedback (selection, hover states)
- Manages star labels and distance-based scaling

**Game State Manager (New)**
- Maintains single source of truth for game state
- Provides pure functions for state queries
- Exposes mutation methods for state changes
- Triggers UI updates on state changes
- Coordinates auto-save operations

**Trading System (New)**
- Calculates commodity prices based on spectral class
- Validates buy/sell transactions
- Manages cargo stacks with purchase price tracking
- Enforces cargo capacity and credit constraints

**Navigation System (New)**
- Calculates distances between star systems
- Computes jump time and fuel costs
- Validates wormhole connections
- Executes jump operations with state updates

**Save/Load Manager (New)**
- Serializes game state to JSON
- Stores data in browser localStorage
- Deserializes and validates saved data
- Handles version compatibility
- Manages save corruption recovery

**UI Layer (New)**
- Renders HUD with player/ship status
- Displays station interface (trade, refuel, undock)
- Shows error notifications with auto-dismiss
- Updates displays reactively on state changes

## Components and Interfaces

### Game State Structure

```javascript
const gameState = {
  // Player data
  player: {
    credits: number,           // Current money
    debt: number,              // Outstanding debt
    currentSystem: number,     // Star system ID
    daysElapsed: number        // Time passed since game start
  },
  
  // Ship data
  ship: {
    name: string,              // Ship name (default: "Serendipity")
    fuel: number,              // Fuel percentage (0-100)
    cargoCapacity: number,     // Maximum cargo units
    cargo: [                   // Array of cargo stacks
      {
        good: string,          // Good type identifier
        qty: number,           // Quantity in this stack
        purchasePrice: number  // Price paid per unit
      }
    ]
  },
  
  // World state
  world: {
    visitedSystems: number[]   // Array of visited system IDs
  },
  
  // Metadata
  meta: {
    version: string,           // Save format version
    timestamp: number          // Last save time (Unix timestamp)
  }
};
```

### Star System Data Structure (Existing)

```javascript
const starSystem = {
  id: number,        // Unique identifier
  x: number,         // X coordinate (light-years × 10)
  y: number,         // Y coordinate (light-years × 10)
  z: number,         // Z coordinate (light-years × 10)
  name: string,      // System name
  type: string,      // Spectral class (e.g., "G2V", "M3V")
  wh: number,        // Wormhole count
  st: number,        // Station count
  r: number          // Reachable flag (1=true, 0=false)
};

// Wormhole connections stored separately
const wormholes = [
  [systemId1, systemId2],  // Bidirectional connection
  // ...
];
```

### Game State Manager Interface

```javascript
class GameStateManager {
  // Initialization
  constructor(starData, wormholeData)
  initNewGame()
  loadGame()
  
  // State queries
  getState()
  getPlayer()
  getShip()
  getCurrentSystem()
  getCargoUsed()
  getCargoRemaining()
  isSystemVisited(systemId)
  
  // Navigation queries
  getDistanceFromSol(systemId)
  getDistanceBetween(systemId1, systemId2)
  getJumpTime(distance)
  getJumpFuelCost(distance)
  canJumpTo(targetSystemId)
  isConnected(systemId1, systemId2)
  
  // Trading queries
  getGoodPrice(goodType, systemId)
  canAfford(price)
  hasCargoSpace(quantity)
  
  // State mutations
  executeJump(targetSystemId)
  buyGood(goodType, quantity, price)
  sellGood(cargoStackIndex, quantity, price)
  refuel(amount, cost)
  
  // Persistence
  saveGame()
  
  // Events
  onStateChange(callback)
}
```

### Trading System Interface

```javascript
class TradingSystem {
  // Price calculation
  static BASE_PRICES = {
    grain: 10,
    ore: 15,
    tritium: 50,
    parts: 30,
    medicine: 40,
    electronics: 35
  }
  
  static SPECTRAL_MODIFIERS = {
    // Spectral class patterns to price multipliers
    'G': { grain: 0.8, ore: 1.0, tritium: 1.2, parts: 1.0, medicine: 1.0, electronics: 1.0 },
    'K': { grain: 1.0, ore: 0.9, tritium: 1.1, parts: 1.0, medicine: 1.0, electronics: 1.0 },
    'M': { grain: 1.2, ore: 0.8, tritium: 1.0, parts: 1.1, medicine: 1.0, electronics: 1.0 },
    // ... other classes
  }
  
  calculatePrice(goodType, spectralClass)
  validatePurchase(credits, cargoSpace, quantity, price)
  validateSale(cargo, stackIndex, quantity)
  addCargoStack(cargo, goodType, quantity, price)
  removeFromCargoStack(cargo, stackIndex, quantity)
}
```

### Navigation System Interface

```javascript
class NavigationSystem {
  constructor(starData, wormholeData)
  
  // Distance calculations
  calculateDistanceFromSol(star)
  calculateDistanceBetween(star1, star2)
  
  // Jump calculations
  calculateJumpTime(distance)
  calculateFuelCost(distance)
  
  // Connection validation
  areSystemsConnected(systemId1, systemId2)
  getConnectedSystems(systemId)
  
  // Jump execution
  validateJump(currentSystemId, targetSystemId, currentFuel)
  executeJump(gameState, targetSystemId)
}
```

### Save/Load Manager Interface

```javascript
class SaveLoadManager {
  static SAVE_KEY = 'trampFreighterSave'
  static CURRENT_VERSION = '1.0.0'
  
  // Serialization
  serializeState(gameState)
  deserializeState(jsonString)
  
  // Storage operations
  saveToLocalStorage(gameState)
  loadFromLocalStorage()
  hasSavedGame()
  clearSave()
  
  // Version management
  isVersionCompatible(saveVersion)
  migrateSave(oldSave, oldVersion)
}
```

### UI Manager Interface

```javascript
class UIManager {
  constructor(gameStateManager)
  
  // HUD
  updateHUD()
  showHUD()
  hideHUD()
  
  // Station interface
  showStationInterface(systemId)
  hideStationInterface()
  showTradePanel()
  showRefuelPanel()
  
  // Notifications
  showError(message, duration = 3000)
  clearError()
  
  // Event handlers
  onTradeAction(goodType, action, quantity)
  onRefuelAction(amount)
  onUndock()
  onJumpRequest(targetSystemId)
}
```

## Data Models

### Goods System

Six commodity types with distinct economic profiles:

```javascript
const GOODS = {
  grain: {
    name: "Grain",
    basePrice: 10,
    description: "Agricultural staple"
  },
  ore: {
    name: "Ore",
    basePrice: 15,
    description: "Raw minerals"
  },
  tritium: {
    name: "Tritium",
    basePrice: 50,
    description: "Fusion fuel"
  },
  parts: {
    name: "Parts",
    basePrice: 30,
    description: "Ship components"
  },
  medicine: {
    name: "Medicine",
    basePrice: 40,
    description: "Medical supplies"
  },
  electronics: {
    name: "Electronics",
    basePrice: 35,
    description: "Tech goods"
  }
};
```

### Cargo Stack Model

Cargo is stored as separate stacks to track purchase prices:

```javascript
{
  good: "grain",        // Good type identifier
  qty: 20,              // Quantity in this stack
  purchasePrice: 8      // Price paid per unit at purchase
}
```

**Rationale:** Separate stacks allow players to see profit margins for each purchase and choose which stack to sell from. This supports future price discovery mechanics where players learn market patterns.

### Fuel Pricing Model

Fuel prices vary by system distance from Sol:

```javascript
function getFuelPrice(systemId) {
  const distanceFromSol = getDistanceFromSol(systemId);
  
  if (systemId === 0 || systemId === 1) {  // Sol or Alpha Centauri
    return 2;  // 2 credits per 1%
  } else if (distanceFromSol < 10) {
    return 3;  // Mid-range systems
  } else {
    return 4;  // Outer systems
  }
}
```

### Price Calculation Model

Commodity prices are modified by spectral class:

```javascript
function calculateGoodPrice(goodType, spectralClass) {
  const basePrice = GOODS[goodType].basePrice;
  const spectralLetter = spectralClass.charAt(0);  // Extract 'G' from 'G2V'
  const modifier = SPECTRAL_MODIFIERS[spectralLetter]?.[goodType] || 1.0;
  
  return Math.round(basePrice * modifier);
}
```

**Example:** Grain at a G-class star (like Sol) costs 10 × 0.8 = 8 credits, while at an M-class star it costs 10 × 1.2 = 12 credits.

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 0: New Game Initialization

*For any* new game initialization, the game state should contain exactly: player with 500 credits, 10000 debt, at system 0 (Sol), 0 days elapsed; ship with 100% fuel, 50 cargo capacity, and one cargo stack of 20 grain units at Sol's grain price.

**Validates: Requirements 1.4, 1.5**

### Property 1: Save/Load Round Trip Preservation

*For any* valid game state, serializing to localStorage and then deserializing should produce an equivalent game state with all player data, ship data, and world data intact.

**Validates: Requirements 1.6, 10.8**

### Property 2: HUD Display Completeness

*For any* game state, the HUD should display all required information: player credits, player debt, days elapsed, ship fuel percentage, cargo usage (current/maximum), current system name, and distance from Sol.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

### Property 3: HUD Reactivity

*For any* game state change (credits, debt, fuel, cargo, location, time), the HUD should immediately reflect the new values in its display.

**Validates: Requirements 2.8**

### Property 4: Distance from Sol Calculation

*For any* star system with coordinates (x, y, z), the calculated distance from Sol should equal sqrt(x² + y² + z²) / 10.

**Validates: Requirements 3.1**

### Property 5: Distance Between Systems Calculation

*For any* two star systems with coordinates (x₁, y₁, z₁) and (x₂, y₂, z₂), the calculated distance between them should equal sqrt((x₁-x₂)² + (y₁-y₂)² + (z₁-z₂)²) / 10.

**Validates: Requirements 3.2**

### Property 6: Jump Time Calculation

*For any* distance in light years, the calculated jump time should equal max(1, ceil(distance × 0.5)) days.

**Validates: Requirements 3.3**

### Property 7: Fuel Cost Calculation

*For any* distance in light years, the calculated fuel cost should equal 10 + (distance × 2) percent.

**Validates: Requirements 3.4**

### Property 8: Jump Information Display

*For any* connected star system, when selected or hovered, the display should show the distance from current location, jump time in days, and fuel cost percentage.

**Validates: Requirements 3.5, 5.5**

### Property 9: Wormhole Connection Validation

*For any* jump attempt, the system should verify that a wormhole connection exists between the current and target systems, and prevent the jump if no connection exists.

**Validates: Requirements 4.1, 4.2**

### Property 10: Insufficient Fuel Prevention

*For any* jump attempt where the ship's current fuel is less than the required fuel cost, the system should prevent the jump and display an error message.

**Validates: Requirements 4.3**

### Property 11: Jump State Transition

*For any* valid jump from system A to system B with distance D, executing the jump should: decrease fuel by (10 + D×2)%, increase days elapsed by max(1, ceil(D×0.5)), and update current system to B.

**Validates: Requirements 4.4, 4.5, 4.6**

### Property 12: Visited Systems Tracking

*For any* jump to a previously unvisited system, that system's ID should be added to the visited systems list.

**Validates: Requirements 4.7**

### Property 13: Connection Visual Fuel Feedback

*For any* wormhole connection, the connection line color should be: green if current fuel ≥ required fuel cost, yellow if remaining fuel after jump would be 10-20%, and red if current fuel < required fuel cost.

**Validates: Requirements 5.2, 5.3, 5.4**

### Property 14: Station Interface Display

*For any* station interface, the display should show the star system name, distance from Sol, and provide Trade, Refuel, and Undock options.

**Validates: Requirements 6.2**

### Property 15: Good Price Calculation

*For any* good type and spectral class, the calculated price should equal the base price multiplied by the spectral class modifier for that good.

**Validates: Requirements 7.2**

### Property 16: Cargo Stack Display

*For any* cargo stack in the trade interface, the display should show the station price for that good, the purchase price paid for that stack, and the profit margin.

**Validates: Requirements 7.3**

### Property 17: Purchase Credits Deduction

*For any* valid purchase of quantity Q at price P, the player's credits should decrease by Q × P.

**Validates: Requirements 7.4**

### Property 18: Purchase Cargo Stack Creation

*For any* valid purchase of good type G with quantity Q at price P, a new cargo stack should be created containing good type G, quantity Q, and purchase price P.

**Validates: Requirements 7.5**

### Property 19: Separate Stack for Different Prices

*For any* purchase of a good at price P1 when existing cargo contains the same good at price P2 where P1 ≠ P2, a separate cargo stack should be created rather than merging with the existing stack.

**Validates: Requirements 7.6**

### Property 20: Cargo Capacity Calculation

*For any* cargo configuration with multiple stacks, the total cargo used should equal the sum of quantities across all stacks regardless of good type.

**Validates: Requirements 7.7**

### Property 21: Sale Credits Addition

*For any* valid sale of quantity Q at price P, the player's credits should increase by Q × P.

**Validates: Requirements 7.9**

### Property 22: Sale Cargo Reduction

*For any* valid sale of quantity Q from a cargo stack, that stack's quantity should decrease by Q.

**Validates: Requirements 7.10**

### Property 23: Resource Constraint Validation

*For any* purchase attempt, the system should prevent the transaction if: (quantity × price > player credits) OR (total cargo + quantity > cargo capacity).

**Validates: Requirements 7.11, 7.12**

### Property 24: Cargo Stack Display Completeness

*For any* trade interface, all cargo stacks should be displayed separately, each showing the good type, quantity, and purchase price.

**Validates: Requirements 7.16**

### Property 25: Refuel Price Display

*For any* refuel interface at a given star system, the display should show the fuel price per percentage point based on that system's distance from Sol.

**Validates: Requirements 8.2**

### Property 25.5: Core System Fuel Pricing

*For any* star system that is Sol (system ID 0) or Alpha Centauri (system ID 1), the fuel price should be 2 credits per 1%.

**Validates: Requirements 8.3**

### Property 26: Mid-Range System Fuel Pricing

*For any* star system with distance from Sol between 4.5 and 10 light years (excluding Sol and Alpha Centauri), the fuel price should be 3 credits per 1%.

**Validates: Requirements 8.4**

### Property 27: Outer System Fuel Pricing

*For any* star system with distance from Sol ≥ 10 light years, the fuel price should be 4 credits per 1%.

**Validates: Requirements 8.5**

### Property 28: Refuel Cost Calculation

*For any* refuel amount A at fuel price P, the total cost should equal A × P.

**Validates: Requirements 8.6**

### Property 29: Refuel Capacity Constraint

*For any* refuel attempt, the system should prevent refueling beyond 100% fuel capacity.

**Validates: Requirements 8.7**

### Property 30: Refuel Credit Validation

*For any* refuel attempt with cost C, the system should prevent the transaction if player credits < C.

**Validates: Requirements 8.8**

### Property 31: Refuel State Mutation

*For any* valid refuel transaction with amount A and cost C, the player's credits should decrease by C and the ship's fuel should increase by A.

**Validates: Requirements 8.9**

### Property 32: Error Message Sequencing

*For any* sequence of multiple error messages, they should be displayed one at a time without overlapping.

**Validates: Requirements 9.3**

### Property 33: Save Data Completeness

*For any* save operation, the stored data in localStorage should include the complete game state (player, ship, world) plus version number and timestamp metadata.

**Validates: Requirements 10.1, 10.2**

### Property 34: Auto-Save Triggers

*For any* game operation that modifies state (jump, trade, refuel, dock, undock), the system should automatically trigger a save operation.

**Validates: Requirements 4.8, 7.15, 8.10, 10.3, 10.4, 10.5, 10.6**

## Error Handling

### Error Categories

**Validation Errors**
- Insufficient credits for purchase/refuel
- Insufficient cargo space for purchase
- Insufficient fuel for jump
- No wormhole connection exists
- Invalid refuel amount (exceeds capacity)

**Data Errors**
- Corrupted save data
- Incompatible save version
- Missing localStorage support
- Invalid system ID reference

**UI Errors**
- Failed to render component
- Invalid user input

### Error Handling Strategy

**User-Facing Errors**
- Display clear, actionable error messages in notification area
- Auto-dismiss after 3 seconds
- Queue multiple errors to prevent overlap
- Use consistent error message format: "[Action] failed: [Reason]"

**Example Messages:**
- "Jump failed: No wormhole connection to target system"
- "Purchase failed: Insufficient credits"
- "Refuel failed: Insufficient credits"
- "Purchase failed: Not enough cargo space"

**Data Recovery**
- Corrupted save: Start new game with default values
- Incompatible version: Notify user, start new game
- Missing localStorage: Display warning, continue with session-only state

**Defensive Programming**
- Validate all user inputs before state mutations
- Check resource constraints before operations
- Verify wormhole connections before jumps
- Clamp values to valid ranges (fuel 0-100%, cargo 0-capacity)
- Use try-catch for localStorage operations
- Provide fallback values for missing data

### Error Logging

For development and debugging:
- Log errors to browser console with context
- Include stack traces for unexpected errors
- Track error frequency for monitoring

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples, edge cases, and integration points:

**State Management**
- New game initialization produces correct default values
- State queries return correct values
- State mutations update values correctly

**Calculations**
- Distance calculations with known coordinates
- Jump time calculation edge cases (distance < 2, distance = 2, distance > 2)
- Fuel cost calculation edge cases (minimum distance, maximum distance)
- Price calculation with various spectral classes

**Validation**
- Purchase validation with edge cases (exactly enough credits, exactly enough space)
- Jump validation with edge cases (exactly enough fuel, no fuel)
- Refuel validation with edge cases (refuel to exactly 100%, attempt to exceed)

**UI Components**
- HUD renders with mock game state
- Station interface displays correct information
- Error notifications appear and dismiss correctly

**Save/Load**
- Save produces valid JSON
- Load restores state correctly
- Corrupted save data triggers fallback
- Version mismatch triggers fallback

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** (JavaScript property testing library).

**Configuration:**
- Each property test should run a minimum of 100 iterations
- Use appropriate generators for game state, coordinates, prices, quantities
- Tag each test with the property number and requirement reference

**Test Tagging Format:**
```javascript
// Feature: tramp-freighter-core-loop, Property 1: Save/Load Round Trip Preservation
// Validates: Requirements 1.6, 10.8
```

**Property Test Categories:**

**Calculation Properties (Properties 4-7, 15, 20, 28)**
- Generate random star coordinates, verify distance formulas
- Generate random distances, verify jump time and fuel cost formulas
- Generate random good types and spectral classes, verify price calculations
- Generate random cargo configurations, verify capacity calculations
- Generate random refuel amounts and prices, verify cost calculations

**State Mutation Properties (Properties 11, 17, 18, 21, 22, 31)**
- Generate random valid jumps, verify all state changes occur correctly
- Generate random purchases, verify credits decrease and cargo increases
- Generate random sales, verify credits increase and cargo decreases
- Generate random refuels, verify credits decrease and fuel increases

**Validation Properties (Properties 9, 10, 23, 29, 30)**
- Generate random jump attempts (some invalid), verify validation logic
- Generate random purchases (some invalid), verify constraint checking
- Generate random refuels (some invalid), verify capacity and credit checks

**Round-Trip Properties (Property 1)**
- Generate random game states, verify save/load preserves all data

**Display Properties (Properties 2, 3, 8, 14, 16, 24, 25)**
- Generate random game states, verify HUD contains all required information
- Generate random state changes, verify UI updates
- Generate random cargo configurations, verify all stacks are displayed

**Visual Feedback Properties (Property 13)**
- Generate random fuel levels and connection distances, verify color coding

**Generators:**
```javascript
// Star system generator
fc.record({
  id: fc.integer({ min: 0, max: 116 }),
  x: fc.integer({ min: -200, max: 200 }),
  y: fc.integer({ min: -200, max: 200 }),
  z: fc.integer({ min: -200, max: 200 }),
  name: fc.string(),
  type: fc.constantFrom('G2V', 'K5V', 'M3V', 'F8V'),
  wh: fc.integer({ min: 0, max: 5 }),
  st: fc.integer({ min: 0, max: 3 }),
  r: fc.constantFrom(0, 1)
})

// Game state generator
fc.record({
  player: fc.record({
    credits: fc.integer({ min: 0, max: 100000 }),
    debt: fc.integer({ min: 0, max: 50000 }),
    currentSystem: fc.integer({ min: 0, max: 116 }),
    daysElapsed: fc.integer({ min: 0, max: 1000 })
  }),
  ship: fc.record({
    name: fc.string(),
    fuel: fc.integer({ min: 0, max: 100 }),
    cargoCapacity: fc.integer({ min: 10, max: 200 }),
    cargo: fc.array(fc.record({
      good: fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
      qty: fc.integer({ min: 1, max: 50 }),
      purchasePrice: fc.integer({ min: 5, max: 100 })
    }))
  }),
  world: fc.record({
    visitedSystems: fc.array(fc.integer({ min: 0, max: 116 }))
  })
})

// Cargo stack generator
fc.record({
  good: fc.constantFrom('grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'),
  qty: fc.integer({ min: 1, max: 50 }),
  purchasePrice: fc.integer({ min: 5, max: 100 })
})
```

### Integration Testing

Integration tests will verify that components work together correctly:

**Game Flow**
- Start new game → verify initial state → make jump → verify state updates → save → load → verify state restored
- Buy goods → verify credits and cargo → sell goods → verify credits and cargo
- Refuel → verify credits and fuel → make jump → verify fuel consumption

**UI Integration**
- Click system → verify station interface appears → trade → verify HUD updates
- Make jump → verify starmap updates → verify HUD updates → verify auto-save

**Error Scenarios**
- Attempt invalid jump → verify error message → verify state unchanged
- Attempt purchase with insufficient credits → verify error → verify state unchanged

### Test Organization

```
tests/
├── unit/
│   ├── game-state.test.js
│   ├── trading-system.test.js
│   ├── navigation-system.test.js
│   ├── save-load-manager.test.js
│   └── ui-manager.test.js
├── property/
│   ├── calculations.property.test.js
│   ├── state-mutations.property.test.js
│   ├── validations.property.test.js
│   ├── round-trip.property.test.js
│   └── display.property.test.js
└── integration/
    ├── game-flow.integration.test.js
    └── ui-integration.integration.test.js
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

```
starmap.html              # Main HTML file (existing, to be enhanced)
├── <script type="module">
│   ├── game-state.js     # State management
│   ├── trading.js        # Trading logic
│   ├── navigation.js     # Jump mechanics
│   ├── save-load.js      # Persistence
│   └── ui.js             # UI management
```

All JavaScript will be embedded in `starmap.html` as ES6 modules for simplicity. Future refactoring may extract to separate files.

### State Management Pattern

**Single Source of Truth:**
- One `gameState` object holds all game data
- All mutations go through state manager methods
- UI subscribes to state changes via callbacks

**Immutability:**
- State mutations create new objects rather than modifying in place
- Enables easier debugging and testing
- Supports future undo/redo functionality

**Example:**
```javascript
// Bad: Direct mutation
gameState.player.credits -= 100;

// Good: Through state manager
gameStateManager.updateCredits(gameState.player.credits - 100);
```

### Integration with Existing Starmap

The existing starmap provides:
- Three.js scene with stars and connections
- Camera controls (orbit, pan, zoom)
- Click/hover event handling
- Visual feedback (selection, highlighting)

Integration points:
1. **System Selection:** Hook into existing click handler to trigger station interface
2. **Visual Feedback:** Extend connection rendering to add color coding based on fuel
3. **Current System Indicator:** Add pulsing ring around current system
4. **HUD Overlay:** Add DOM overlay on top of Three.js canvas

**Minimal Changes to Existing Code:**
- Add fuel-based color logic to connection rendering
- Add current system indicator to scene
- Hook game state into existing event handlers
- Preserve all existing camera and interaction code

### localStorage Schema

```javascript
{
  "version": "1.0.0",
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
      "cargoCapacity": 50,
      "cargo": [
        { "good": "grain", "qty": 20, "purchasePrice": 8 }
      ]
    },
    "world": {
      "visitedSystems": [0]
    }
  }
}
```

**Key:** `trampFreighterSave`

### Performance Considerations

**Rendering:**
- HUD updates throttled to 60fps max
- Three.js scene only re-renders on camera movement or state change
- Connection color updates batched

**State Updates:**
- State changes are synchronous
- UI updates are asynchronous (requestAnimationFrame)
- Save operations are debounced (max 1 save per second)

**Memory:**
- Single game state object (~10KB)
- Star data loaded once (~50KB)
- No memory leaks from event listeners (proper cleanup)

### Browser Compatibility

**Required Features:**
- ES6 modules (import/export)
- localStorage API
- Three.js WebGL support
- CSS Grid for layout

**Fallbacks:**
- localStorage unavailable: Session-only mode with warning
- WebGL unavailable: Display error message (no fallback)

### Accessibility Considerations

**Keyboard Navigation:**
- Tab through interactive elements
- Enter/Space to activate buttons
- Escape to close modals

**Screen Readers:**
- ARIA labels on all interactive elements
- Status updates announced via aria-live regions
- Semantic HTML structure

**Visual:**
- High contrast mode support
- Colorblind-friendly palette (green/yellow/red with patterns)
- Scalable UI (respects browser zoom)

## Future Extensibility

This core loop design supports future features:

**Dynamic Prices (Phase 2):**
- Price calculation already separated into function
- Can add time-based and supply/demand modifiers
- Visited systems tracking enables price discovery

**NPCs and Events (Phase 3):**
- World state can store NPC relationships
- Event system can hook into state changes
- Station interface can add dialogue panel

**Ship Condition (Phase 2):**
- Ship object can add hull, engine, life support properties
- Jump system can add wear and tear
- Station interface can add repair panel

**Missions (Phase 4):**
- World state can store active missions
- Event system can trigger mission updates
- UI can add mission log panel

**Combat (Phase 5):**
- Ship object can add weapons, shields
- Navigation can add encounter checks
- UI can add tactical combat interface

## Open Questions

1. **Cargo Stack Merging:** Should we allow players to manually merge stacks of the same good at different prices? (Decision: No for MVP, add in Phase 2 if requested)

2. **Fuel Precision:** Should fuel be stored as integer percentage or float? (Decision: Integer for simplicity, sufficient precision)

3. **Save Slots:** Should we support multiple save slots? (Decision: No for MVP, single auto-save only)

4. **Price Randomization:** Should prices have small random variations? (Decision: No for MVP, fixed prices based on spectral class only)

5. **Tutorial:** Should we include an in-game tutorial? (Decision: No for MVP, rely on intuitive UI and external documentation)

## Dependencies

**External:**
- Three.js (v0.150.0) - Already integrated via CDN

**Development:**
- Vitest - Test runner
- fast-check - Property-based testing
- @testing-library/dom - DOM testing utilities

**Runtime:**
- None (vanilla JavaScript, no build step required)

## Deployment

**Build Process:**
- No build step required
- Single HTML file with embedded JavaScript
- Can be served from any static file server

**Hosting:**
- GitHub Pages (recommended)
- Any static hosting service
- Local file:// protocol (with localStorage limitations)

**Updates:**
- Replace starmap.html file
- Save data migration handled by version checking

## Success Metrics

**Functional:**
- All 34 correctness properties pass property-based tests
- All unit tests pass
- All integration tests pass
- No console errors during normal gameplay

**Performance:**
- Initial load < 4 seconds
- Save/load operations < 500ms
- UI response time < 100ms
- Smooth 60fps rendering

**User Experience:**
- Players can complete full trading loop (buy → jump → sell) within 2 minutes
- Error messages are clear and actionable
- Game state persists across browser sessions
- No data loss from unexpected browser closure

