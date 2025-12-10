# Design Document

## Overview

The ship personality system adds character and customization to the player's vessel through three interconnected systems: quirks (random permanent traits), upgrades (purchasable modifications with tradeoffs), and enhanced cargo management. This design builds upon the existing game state management and UI systems from Specs 01-02, extending them to support ship personalization and strategic decision-making.

The system is designed to make each playthrough feel unique through random quirk assignment while giving players agency through upgrade choices. All modifications are permanent, creating meaningful long-term consequences for player decisions.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Game State Manager                    │
│  - Ship quirks array                                    │
│  - Ship upgrades array                                  │
│  - Ship name string                                     │
│  - Hidden cargo array                                   │
│  - Enhanced cargo tracking                              │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│  Quirk System  │  │   Upgrade   │  │  Cargo Manager  │
│                │  │   System    │  │                 │
│ - Assignment   │  │ - Purchase  │  │ - Manifest      │
│ - Effects      │  │ - Effects   │  │ - Hidden cargo  │
│ - Display      │  │ - Display   │  │ - Tracking      │
└────────────────┘  └─────────────┘  └─────────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                      UI Manager                          │
│  - Ship status screen                                   │
│  - Upgrades interface                                   │
│  - Cargo manifest                                       │
│  - Ship naming dialog                                   │
│  - Confirmation dialogs                                 │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **New Game Initialization**: Assign 2-3 random quirks, prompt for ship name
2. **Gameplay**: Quirks and upgrades modify calculations (fuel, degradation, etc.)
3. **Station Docking**: Display upgrades interface, allow purchases
4. **Trading**: Enhanced cargo tracking with purchase metadata
5. **Save/Load**: Persist quirks, upgrades, ship name, hidden cargo

### Module Organization

- `game-constants.js`: Quirk and upgrade definitions
- `game-state.js`: Ship state management, quirk/upgrade application
- `game-ui.js`: UI rendering for ship status, upgrades, cargo manifest
- `game-trading.js`: Enhanced cargo tracking with metadata

## Components and Interfaces

### Quirk System

#### Quirk Definition Structure

```javascript
const SHIP_QUIRKS = {
  quirk_id: {
    name: string, // Display name
    description: string, // Short description
    effects: {
      // Numeric modifiers
      [attribute]: number, // Multiplier (0.85 = -15%, 1.15 = +15%)
    },
    flavor: string, // Flavor text for personality
  },
};
```

#### Quirk Assignment Function

```javascript
/**
 * Assigns 2-3 random quirks to a new ship
 * @returns {string[]} Array of quirk IDs
 */
function assignShipQuirks() {
  const quirkIds = Object.keys(SHIP_QUIRKS);
  const count = Math.random() < 0.5 ? 2 : 3;
  const assigned = [];

  while (assigned.length < count) {
    const randomId = quirkIds[Math.floor(Math.random() * quirkIds.length)];
    if (!assigned.includes(randomId)) {
      assigned.push(randomId);
    }
  }

  return assigned;
}
```

#### Quirk Effect Application

```javascript
/**
 * Applies quirk modifiers to a base value
 * @param {number} baseValue - Starting value
 * @param {string} attribute - Attribute name (e.g., 'fuelConsumption')
 * @param {string[]} quirks - Array of quirk IDs
 * @returns {number} Modified value
 */
function applyQuirkModifiers(baseValue, attribute, quirks) {
  let modified = baseValue;

  for (const quirkId of quirks) {
    const quirk = SHIP_QUIRKS[quirkId];
    if (quirk.effects[attribute]) {
      modified *= quirk.effects[attribute];
    }
  }

  return modified;
}
```

### Upgrade System

#### Upgrade Definition Structure

```javascript
const SHIP_UPGRADES = {
  upgrade_id: {
    name: string, // Display name
    cost: number, // Credit cost
    description: string, // What it does
    effects: {
      // Modifications
      [attribute]: number, // New value or multiplier
    },
    tradeoff: string, // Negative consequence description
  },
};
```

#### Upgrade Purchase Validation

```javascript
/**
 * Validates if an upgrade can be purchased
 * @param {string} upgradeId - Upgrade to check
 * @param {Object} gameState - Current game state
 * @returns {Object} {valid: boolean, reason: string}
 */
function validateUpgradePurchase(upgradeId, gameState) {
  const upgrade = SHIP_UPGRADES[upgradeId];

  // Check if already purchased
  if (gameState.ship.upgrades.includes(upgradeId)) {
    return { valid: false, reason: 'Upgrade already installed' };
  }

  // Check credits
  if (gameState.player.credits < upgrade.cost) {
    return {
      valid: false,
      reason: `Insufficient credits (need ₡${upgrade.cost})`,
    };
  }

  return { valid: true, reason: '' };
}
```

#### Upgrade Effect Application

```javascript
/**
 * Applies upgrade effects to ship capabilities
 * @param {Object} ship - Ship object
 * @param {string[]} upgrades - Array of upgrade IDs
 * @returns {Object} Modified ship capabilities
 */
function calculateShipCapabilities(ship, upgrades) {
  const capabilities = {
    fuelCapacity: 100,
    cargoCapacity: 50,
    fuelConsumption: 1.0,
    hullDegradation: 1.0,
    lifeSupportDrain: 1.0,
    hiddenCargoCapacity: 0,
    eventVisibility: 0,
  };

  // Apply upgrade effects
  for (const upgradeId of upgrades) {
    const upgrade = SHIP_UPGRADES[upgradeId];
    for (const [attr, value] of Object.entries(upgrade.effects)) {
      if (attr.endsWith('Capacity')) {
        // Absolute values for capacities
        capabilities[attr] = value;
      } else {
        // Multipliers for rates
        capabilities[attr] *= value;
      }
    }
  }

  return capabilities;
}
```

### Hidden Cargo System

#### Hidden Cargo Structure

```javascript
gameState.ship.hiddenCargo = [
  {
    good: string, // Commodity type
    qty: number, // Quantity
    buyPrice: number, // Purchase price per unit
    buySystem: number, // System ID
    buySystemName: string,
    buyDate: number, // Days elapsed at purchase
  },
];
```

#### Cargo Transfer Functions

```javascript
/**
 * Moves cargo from regular to hidden compartment
 * @param {string} good - Commodity type
 * @param {number} qty - Quantity to move
 * @param {Object} gameState - Current game state
 * @returns {Object} {success: boolean, reason: string}
 */
function moveToHiddenCargo(good, qty, gameState) {
  const ship = gameState.ship;

  // Check if smuggler's panels installed
  if (!ship.upgrades.includes('smuggler_panels')) {
    return { success: false, reason: 'No hidden cargo compartment' };
  }

  // Find cargo stack
  const cargoIndex = ship.cargo.findIndex((c) => c.good === good);
  if (cargoIndex === -1) {
    return { success: false, reason: 'Cargo not found' };
  }

  const cargoStack = ship.cargo[cargoIndex];
  if (cargoStack.qty < qty) {
    return { success: false, reason: 'Insufficient quantity' };
  }

  // Check hidden cargo capacity
  const hiddenUsed = ship.hiddenCargo.reduce((sum, c) => sum + c.qty, 0);
  const hiddenAvailable = 10 - hiddenUsed;
  if (qty > hiddenAvailable) {
    return {
      success: false,
      reason: `Hidden cargo full (${hiddenAvailable} units available)`,
    };
  }

  // Transfer cargo
  cargoStack.qty -= qty;
  if (cargoStack.qty === 0) {
    ship.cargo.splice(cargoIndex, 1);
  }

  // Add to hidden cargo
  const hiddenIndex = ship.hiddenCargo.findIndex(
    (c) => c.good === good && c.buyPrice === cargoStack.buyPrice
  );

  if (hiddenIndex >= 0) {
    ship.hiddenCargo[hiddenIndex].qty += qty;
  } else {
    ship.hiddenCargo.push({
      good: cargoStack.good,
      qty: qty,
      buyPrice: cargoStack.buyPrice,
      buySystem: cargoStack.buySystem,
      buySystemName: cargoStack.buySystemName,
      buyDate: cargoStack.buyDate,
    });
  }

  return { success: true, reason: '' };
}
```

### Enhanced Cargo Tracking

#### Cargo Purchase Recording

```javascript
/**
 * Records cargo purchase with full metadata
 * @param {string} good - Commodity type
 * @param {number} qty - Quantity purchased
 * @param {number} price - Price per unit
 * @param {Object} gameState - Current game state
 */
function recordCargoPurchase(good, qty, price, gameState) {
  const currentSystem = getCurrentSystem(gameState);

  const cargoEntry = {
    good: good,
    qty: qty,
    buyPrice: price,
    buySystem: currentSystem.id,
    buySystemName: currentSystem.name,
    buyDate: gameState.player.daysElapsed,
  };

  // Check if we can stack with existing cargo
  const existingIndex = gameState.ship.cargo.findIndex(
    (c) =>
      c.good === good &&
      c.buyPrice === price &&
      c.buySystem === currentSystem.id
  );

  if (existingIndex >= 0) {
    gameState.ship.cargo[existingIndex].qty += qty;
  } else {
    gameState.ship.cargo.push(cargoEntry);
  }
}
```

### Ship Naming System

#### Name Validation and Sanitization

```javascript
/**
 * Validates and sanitizes ship name input
 * @param {string} name - User input
 * @returns {string} Sanitized name or default
 */
function sanitizeShipName(name) {
  if (!name || name.trim().length === 0) {
    return 'Serendipity';
  }

  // Remove HTML tags and limit length
  const sanitized = name
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 50);

  return sanitized || 'Serendipity';
}
```

#### Ship Name Suggestions

```javascript
const SHIP_NAME_SUGGESTIONS = [
  'Serendipity',
  'Lucky Break',
  'Second Chance',
  'Wanderer',
  'Free Spirit',
  "Horizon's Edge",
  'Stardust Runner',
  'Cosmic Drifter',
];
```

## Data Models

### Extended Ship State

```javascript
gameState.ship = {
  name: string,              // Ship name (default: 'Serendipity')
  quirks: string[],          // Array of quirk IDs (2-3 items)
  upgrades: string[],        // Array of upgrade IDs
  fuel: number,              // Current fuel
  fuelCapacity: number,      // Max fuel (modified by upgrades)
  hull: number,              // Hull integrity (0-100)
  engine: number,            // Engine condition (0-100)
  lifeSupport: number,       // Life support condition (0-100)
  cargo: [                   // Regular cargo with metadata
    {
      good: string,
      qty: number,
      buyPrice: number,
      buySystem: number,
      buySystemName: string,
      buyDate: number
    }
  ],
  cargoCapacity: number,     // Max cargo (modified by upgrades)
  hiddenCargo: [],           // Hidden cargo (same structure as cargo)
  hiddenCargoCapacity: number // Hidden capacity (0 or 10)
};
```

### Quirk Definitions

```javascript
const SHIP_QUIRKS = {
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
    description: 'Sensor array picks up everything. Including false positives.',
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
};
```

### Upgrade Definitions

```javascript
const SHIP_UPGRADES = {
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
};
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Quirk Assignment Bounds

_For any_ new game initialization, the ship should be assigned exactly 2 or 3 quirks, with no duplicates.

**Validates: Requirements 1.1, 1.2**

### Property 2: Quirk Effect Application

_For any_ ship with quirks and any calculation that uses an attribute affected by those quirks, the result should equal the base value multiplied by all relevant quirk modifiers.

**Validates: Requirements 1.4, 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 3: Upgrade Purchase Transaction

_For any_ valid upgrade purchase (sufficient credits, not already owned), completing the transaction should decrease player credits by the upgrade cost and add the upgrade to the ship's upgrades list.

**Validates: Requirements 2.4, 2.5**

### Property 4: Upgrade Effect Application

_For any_ ship with upgrades and any calculation that uses an attribute affected by those upgrades, the result should reflect all upgrade effects applied appropriately (absolute values for capacities, multipliers for rates).

**Validates: Requirements 2.6, 7.9**

### Property 5: Save/Load Round Trip

_For any_ game state containing ship quirks, upgrades, ship name, regular cargo, and hidden cargo, saving then loading should produce an equivalent game state with all ship data preserved.

**Validates: Requirements 1.5, 2.7, 3.6, 4.5**

### Property 6: Cargo Purchase Metadata Completeness

_For any_ cargo purchase, the recorded cargo entry should contain all required fields: good type, quantity, purchase price, purchase system ID, purchase system name, and purchase date.

**Validates: Requirements 5.6**

### Property 7: Cargo Manifest Value Calculation

_For any_ cargo in the manifest, the displayed current value should equal the quantity multiplied by the purchase price.

**Validates: Requirements 5.3**

### Property 8: Cargo Manifest Total Calculations

_For any_ cargo manifest display, the total capacity usage should equal the sum of all cargo quantities, and the total value should equal the sum of all individual cargo values.

**Validates: Requirements 5.4, 5.5**

### Property 9: UI Display Completeness

_For any_ quirk, upgrade, or cargo item displayed in the UI, all required fields for that item type should be present in the rendered output.

**Validates: Requirements 1.3, 2.2, 5.2, 8.2, 8.3, 8.4, 9.2**

### Property 10: Ship Name Sanitization

_For any_ ship name input, the sanitized result should have HTML tags removed and be limited to 50 characters, with empty inputs defaulting to "Serendipity".

**Validates: Requirements 4.2, 4.3, 10.3, 10.5**

### Property 11: Upgrade Purchase Validation

_For any_ upgrade and game state, the validation should return invalid if the upgrade is already purchased or if the player has insufficient credits.

**Validates: Requirements 2.5, 8.5**

### Property 12: Hidden Cargo Transfer Validation

_For any_ cargo transfer to hidden compartment, the operation should fail if Smuggler's Panels is not installed, if the cargo doesn't exist, if quantity is insufficient, or if hidden cargo capacity would be exceeded.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 13: Multiplicative Modifier Combination

_For any_ set of modifiers (quirks or upgrades) affecting the same attribute, applying all modifiers should be equivalent to multiplying the base value by the product of all individual modifiers.

**Validates: Requirements 6.4, 7.9**

## Error Handling

### Validation Errors

All user actions that can fail should provide clear, specific error messages:

- **Insufficient Credits**: "Insufficient credits for purchase (need ₡X)"
- **Upgrade Already Owned**: "Upgrade already installed"
- **Hidden Cargo Full**: "Hidden cargo full (X units available)"
- **Cargo Not Found**: "Cargo not found"
- **No Hidden Compartment**: "No hidden cargo compartment (Smuggler's Panels required)"

### State Validation

The system should validate state integrity:

- Quirk IDs must exist in SHIP_QUIRKS
- Upgrade IDs must exist in SHIP_UPGRADES
- Cargo quantities must be positive
- Capacity usage must not exceed limits
- Credit amounts must be non-negative

### Save/Load Error Handling

```javascript
function loadGameState(savedData) {
  try {
    const parsed = JSON.parse(savedData);

    // Validate version
    if (parsed.version !== SAVE_VERSION) {
      return migrateSaveData(parsed);
    }

    // Validate ship data
    if (!parsed.ship || !Array.isArray(parsed.ship.quirks)) {
      throw new Error('Invalid save data: missing or malformed ship data');
    }

    // Validate quirk IDs
    for (const quirkId of parsed.ship.quirks) {
      if (!SHIP_QUIRKS[quirkId]) {
        console.warn(`Unknown quirk ID: ${quirkId}, removing from save`);
        parsed.ship.quirks = parsed.ship.quirks.filter((id) => id !== quirkId);
      }
    }

    // Validate upgrade IDs
    for (const upgradeId of parsed.ship.upgrades) {
      if (!SHIP_UPGRADES[upgradeId]) {
        console.warn(`Unknown upgrade ID: ${upgradeId}, removing from save`);
        parsed.ship.upgrades = parsed.ship.upgrades.filter(
          (id) => id !== upgradeId
        );
      }
    }

    return parsed;
  } catch (e) {
    console.error('Failed to load save data:', e);
    return null;
  }
}
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific behaviors and edge cases:

1. **Quirk Assignment**
   - New game assigns 2 or 3 quirks
   - No duplicate quirks assigned
   - All assigned quirks exist in SHIP_QUIRKS

2. **Upgrade Purchase**
   - Purchase deducts correct credit amount
   - Purchase adds upgrade to ship
   - Cannot purchase same upgrade twice
   - Cannot purchase with insufficient credits

3. **Cargo Transfer**
   - Transfer moves cargo between compartments
   - Transfer respects capacity limits
   - Transfer requires Smuggler's Panels

4. **Ship Name Sanitization**
   - HTML tags removed
   - Length limited to 50 characters
   - Empty input defaults to "Serendipity"

5. **Effect Calculations**
   - Quirks apply to fuel consumption
   - Upgrades apply to cargo capacity
   - Multiple modifiers combine multiplicatively

### Property-Based Tests

Property-based tests will verify universal properties across many random inputs using **fast-check** (JavaScript property testing library). Each test will run a minimum of 100 iterations.

1. **Property 1: Quirk Assignment Bounds**
   - Generate: Many new game initializations
   - Verify: Each has 2 or 3 unique quirks

2. **Property 2: Quirk Effect Application**
   - Generate: Random quirk combinations and base values
   - Verify: Result equals base × product of modifiers

3. **Property 3: Upgrade Purchase Transaction**
   - Generate: Random valid upgrade purchases
   - Verify: Credits decrease by cost, upgrade added

4. **Property 4: Upgrade Effect Application**
   - Generate: Random upgrade combinations
   - Verify: Capacities and rates reflect all upgrades

5. **Property 5: Save/Load Round Trip**
   - Generate: Random game states with ship data
   - Verify: save(load(state)) ≡ state

6. **Property 6: Cargo Purchase Metadata Completeness**
   - Generate: Random cargo purchases
   - Verify: All required fields present

7. **Property 7: Cargo Manifest Value Calculation**
   - Generate: Random cargo entries
   - Verify: value = quantity × price

8. **Property 8: Cargo Manifest Total Calculations**
   - Generate: Random cargo lists
   - Verify: totals equal sums

9. **Property 9: UI Display Completeness**
   - Generate: Random quirks/upgrades/cargo
   - Verify: Rendered output contains all fields

10. **Property 10: Ship Name Sanitization**
    - Generate: Random strings including HTML, long strings, empty
    - Verify: Output sanitized correctly

11. **Property 11: Upgrade Purchase Validation**
    - Generate: Random upgrade/state combinations
    - Verify: Validation catches all invalid cases

12. **Property 12: Hidden Cargo Transfer Validation**
    - Generate: Random transfer attempts
    - Verify: Validation catches all invalid cases

13. **Property 13: Multiplicative Modifier Combination**
    - Generate: Random modifier sets
    - Verify: Combined effect equals product

### Integration Tests

Integration tests will verify complete workflows:

1. **New Game Flow**
   - Start new game
   - Verify quirks assigned
   - Verify ship naming prompt
   - Verify default name if skipped

2. **Upgrade Purchase Flow**
   - Dock at station
   - Open upgrades interface
   - Select upgrade
   - Confirm purchase
   - Verify credits deducted
   - Verify upgrade applied

3. **Hidden Cargo Flow**
   - Purchase Smuggler's Panels
   - Buy cargo
   - Move to hidden compartment
   - Verify regular cargo reduced
   - Verify hidden cargo increased

4. **Cargo Manifest Flow**
   - Purchase cargo at multiple systems
   - Open cargo manifest
   - Verify all purchases listed
   - Verify values calculated correctly

### Test Configuration

```javascript
// vitest.config.js
export default {
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['js/**/*.js'],
      exclude: ['js/vendor/**'],
    },
  },
};
```

### Property Test Configuration

```javascript
import fc from 'fast-check';

// Minimum 100 iterations per property test
const propertyTestConfig = {
  numRuns: 100,
  verbose: true,
};

// Example property test structure
describe('Property Tests', () => {
  it('Property 1: Quirk Assignment Bounds', () => {
    fc.assert(
      fc.property(
        fc.integer(), // Random seed
        (seed) => {
          const quirks = assignShipQuirks(seed);
          return (
            quirks.length >= 2 &&
            quirks.length <= 3 &&
            new Set(quirks).size === quirks.length
          );
        }
      ),
      propertyTestConfig
    );
  });
});
```

## UI/UX Considerations

### Ship Status Screen

Display quirks with visual hierarchy:

- Section header: "SHIP QUIRKS"
- Each quirk: icon, name, description, flavor text
- Use consistent spacing and typography
- Make quirks feel like personality, not just stats

### Upgrades Interface

Clear information architecture:

- Available upgrades at top with purchase buttons
- Installed upgrades in separate section below
- Warning symbols (⚠) for tradeoffs
- Disable buttons for unaffordable upgrades
- Show credit balance prominently

### Confirmation Dialogs

Follow modal dialog patterns:

- Semi-transparent overlay
- Centered dialog box
- Clear action buttons (Confirm/Cancel)
- Explicit consequences listed
- Permanent upgrade warning

### Cargo Manifest

Organized information display:

- Ship name in header
- Capacity bar or fraction
- Each cargo: name, quantity, purchase details
- Current value calculation
- Total value at bottom
- Consistent formatting

### Hidden Cargo Toggle

Subtle but clear:

- Toggle button in trade interface
- Hidden section visually distinct
- Clear labels for regular vs hidden
- Move buttons only when Smuggler's Panels installed

## Performance Considerations

### Quirk and Upgrade Application

- Cache calculated capabilities after upgrade purchases
- Recalculate only when upgrades change
- Apply modifiers in single pass through arrays

### Cargo Manifest Rendering

- Render only visible cargo (virtual scrolling for large lists)
- Cache value calculations
- Update only changed entries

### Save/Load Optimization

- Compress save data if needed
- Validate incrementally during load
- Use efficient JSON serialization

## Future Extensions

### Additional Quirks

The quirk system is designed to be extensible. Future quirks could include:

- Combat-related effects (when combat is implemented)
- NPC interaction modifiers
- Event probability changes
- Salvage and exploration bonuses

### Upgrade Tiers

Future upgrades could have prerequisites:

- Advanced upgrades require basic versions
- Mutually exclusive upgrade paths
- Upgrade combinations with synergies

### Hidden Cargo Mechanics

When inspection system is implemented:

- Discovery chance based on inspector skill
- Consequences for discovery (fines, reputation loss)
- Contraband goods with higher risk/reward

### Ship Customization

Additional personalization options:

- Ship paint schemes
- Interior decorations
- Custom ship descriptions
- Achievement-based unlocks

## Dependencies

### Existing Systems (Specs 01-02)

- Game state management
- Save/load system
- Trading system with cargo
- Station interface
- Credit management
- UI rendering framework

### New Constants Required

All quirk and upgrade definitions must be added to `game-constants.js`:

- `SHIP_QUIRKS` object
- `SHIP_UPGRADES` object
- `SHIP_NAME_SUGGESTIONS` array
- Default ship name constant

### Modified Systems

- **game-state.js**: Add quirk assignment, upgrade management
- **game-ui.js**: Add ship status, upgrades interface, cargo manifest
- **game-trading.js**: Enhance cargo tracking with metadata
- **starmap.html**: Add UI elements for new interfaces

## Implementation Notes

### Quirk Assignment Timing

Quirks should be assigned during new game initialization, before the player sees the ship for the first time. This ensures quirks feel like inherent ship characteristics rather than random events.

### Upgrade Permanence

Upgrades are intentionally permanent to create meaningful choices. Players should feel the weight of their decisions. Consider adding a confirmation step with explicit "This cannot be undone" warning.

### Hidden Cargo Design

Hidden cargo is infrastructure for future gameplay (inspections, smuggling). The current implementation focuses on the storage mechanism. Future specs will add the risk/reward gameplay.

### Cargo Stacking

Cargo purchased at the same system for the same price should stack. Cargo purchased at different prices or systems should be separate stacks. This allows players to track profit margins per purchase.

### Effect Calculation Order

Apply effects in this order:

1. Base value
2. Quirk modifiers (multiplicative)
3. Upgrade modifiers (multiplicative)
4. Condition penalties (if applicable)

This ensures consistent, predictable results.
