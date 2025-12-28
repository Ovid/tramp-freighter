# Design Document: NPC Benefits System

## Overview

This design extends the existing NPC foundation with a comprehensive benefits system that rewards players for building relationships. The system introduces tier-based discounts, trading tips, special favors (emergency loans and cargo storage), and 7 new NPCs with unique personalities and benefits. The architecture integrates with the existing GameStateManager, dialogue system, and service panels while maintaining the event-driven reactivity pattern.

## Architecture

The NPC benefits system follows the existing Bridge Pattern architecture, extending GameStateManager with new state properties and methods while keeping UI components declarative through React hooks.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Components                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ DialoguePanel│  │ ServicePanels│  │ StationMenu  │              │
│  │ (tips, favors)│  │(discounts)   │  │(NPC list)    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                        │
│         └─────────────────┼─────────────────┘                        │
│                           │                                          │
│                    useGameEvent / useGameAction                      │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────┐
│                    GameStateManager                                   │
│  ┌────────────────────────┴────────────────────────────────────┐    │
│  │                      NPC State                               │    │
│  │  npcs: {                                                     │    │
│  │    [npcId]: {                                                │    │
│  │      rep, lastInteraction, flags, interactions,              │    │
│  │      lastTipDay, lastFavorDay, loanAmount, loanDay,         │    │
│  │      storedCargo: []                                         │    │
│  │    }                                                         │    │
│  │  }                                                           │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │ getTip()        │  │ requestFavor()  │  │ getDiscount()   │      │
│  │ canGetTip()     │  │ canRequestFavor()│  │ applyDiscount() │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
└───────────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────────┐
│                      Data Layer                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │ npc-data.js     │  │ dialogue-trees.js│  │ constants.js    │      │
│  │ (NPC definitions)│  │ (conversations) │  │ (config values) │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
└───────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Extended NPC State Structure

```javascript
// Extended NPC state in GameStateManager
npcs: {
  [npcId]: {
    rep: number,              // Reputation value (-100 to 100)
    lastInteraction: number,  // Day of last interaction
    flags: string[],          // Story flags
    interactions: number,     // Total interaction count
    // NEW: Benefits tracking
    lastTipDay: number | null,      // Day when last tip was given
    lastFavorDay: number | null,    // Day when last favor was granted
    loanAmount: number | null,      // Outstanding loan amount (₡500 or null)
    loanDay: number | null,         // Day when loan was granted
    storedCargo: CargoStack[],      // Cargo stored with this NPC
  }
}
```

### NPC Definition Extension

```javascript
// Extended NPC definition in npc-data.js
{
  id: string,
  name: string,
  role: string,
  system: number,
  station: string,
  personality: { trust, greed, loyalty, morality },
  speechStyle: { greeting, vocabulary, quirk },
  description: string,
  initialRep: number,
  // NEW: Benefits configuration
  tips: string[],                    // Array of tip strings
  discountService: string | null,    // Service type for discounts (e.g., 'repair', 'intel')
  tierBenefits: {                    // Tier-specific benefits
    warm: { discount: number, benefit: string },
    friendly: { discount: number, benefit: string },
    trusted: { discount: number, benefit: string },
    family: { discount: number, benefit: string }
  }
}
```

### Benefits Configuration Constants

```javascript
// In constants.js
export const NPC_BENEFITS_CONFIG = {
  TIP_COOLDOWN_DAYS: 7,           // Days between tips from same NPC
  FAVOR_COOLDOWN_DAYS: 30,        // Days between favors from same NPC
  EMERGENCY_LOAN_AMOUNT: 500,     // Credits for emergency loan
  LOAN_REPAYMENT_DEADLINE: 30,    // Days to repay loan
  LOAN_DEFAULT_TIER_PENALTY: 1,   // Tiers lost on loan default
  CARGO_STORAGE_LIMIT: 10,        // Max cargo units stored per NPC
  LOAN_ACCEPTANCE_REP_BONUS: 5,   // Rep gained for accepting loan
  
  // Tier discount percentages
  TIER_DISCOUNTS: {
    hostile: 0,
    cold: 0,
    neutral: 0,
    warm: 0.05,      // 5%
    friendly: 0.10,  // 10%
    trusted: 0.15,   // 15%
    family: 0.20     // 20%
  },
  
  // Free repair limits (hull percentage)
  FREE_REPAIR_LIMITS: {
    trusted: 10,     // Up to 10% hull damage
    family: 25       // Up to 25% hull damage
  }
};
```

### GameStateManager Extensions

```javascript
// New methods in GameStateManager

/**
 * Check if NPC can provide a tip
 * @param {string} npcId - NPC identifier
 * @returns {Object} { available: boolean, reason: string | null }
 */
canGetTip(npcId) { }

/**
 * Get a random tip from NPC's tip pool
 * @param {string} npcId - NPC identifier
 * @returns {string | null} Tip text or null if unavailable
 */
getTip(npcId) { }

/**
 * Check if NPC can grant a specific favor
 * @param {string} npcId - NPC identifier
 * @param {string} favorType - 'loan' or 'storage'
 * @returns {Object} { available: boolean, reason: string }
 */
canRequestFavor(npcId, favorType) { }

/**
 * Request emergency loan from NPC
 * @param {string} npcId - NPC identifier
 * @returns {Object} { success: boolean, message: string }
 */
requestLoan(npcId) { }

/**
 * Repay outstanding loan to NPC
 * @param {string} npcId - NPC identifier
 * @returns {Object} { success: boolean, message: string }
 */
repayLoan(npcId) { }

/**
 * Store cargo with NPC
 * @param {string} npcId - NPC identifier
 * @param {CargoStack[]} cargo - Cargo to store (up to 10 units)
 * @returns {Object} { success: boolean, stored: number, message: string }
 */
storeCargo(npcId, cargo) { }

/**
 * Retrieve stored cargo from NPC
 * @param {string} npcId - NPC identifier
 * @returns {Object} { success: boolean, retrieved: CargoStack[], remaining: CargoStack[] }
 */
retrieveCargo(npcId) { }

/**
 * Get discount for a service based on NPC relationship
 * @param {string} npcId - NPC identifier
 * @param {string} serviceType - Service type (e.g., 'repair', 'refuel', 'intel')
 * @returns {Object} { discount: number, npcName: string | null }
 */
getServiceDiscount(npcId, serviceType) { }

/**
 * Check and apply loan default penalties (called on day advance)
 */
checkLoanDefaults() { }
```

## Data Models

### New NPC Definitions

```javascript
// 7 new NPCs to add to npc-data.js

export const WHISPER = {
  id: 'whisper_sirius',
  name: 'Whisper',
  role: 'Information Broker',
  system: 2, // Sirius A
  station: 'Sirius Exchange',
  personality: {
    trust: 0.5,
    greed: 0.7,
    loyalty: 0.5,
    morality: 0.4
  },
  speechStyle: {
    greeting: 'formal',
    vocabulary: 'educated',
    quirk: 'cryptic measured tones'
  },
  description: "Mysterious info broker. Knows everyone's secrets. Including yours.",
  initialRep: 0,
  tips: [
    "Procyon is buying ore at premium prices this week.",
    "Avoid Tau Ceti. Inspections are up 300%.",
    "Someone at Ross 154 is looking for electronics. Big buyer."
  ],
  discountService: 'intel',
  tierBenefits: {
    warm: { discount: 0.10, benefit: '10% discount on intel purchases' },
    friendly: { discount: 0.10, benefit: 'Free rumors once per visit' },
    trusted: { discount: 0.15, benefit: 'Advance warning of inspections' },
    family: { discount: 0.20, benefit: 'Exclusive insider information' }
  }
};

export const CAPTAIN_VASQUEZ = {
  id: 'vasquez_epsilon',
  name: 'Captain Vasquez',
  role: 'Retired Trader',
  system: 3, // Epsilon Eridani
  station: 'Eridani Hub',
  personality: {
    trust: 0.6,
    greed: 0.3,
    loyalty: 0.7,
    morality: 0.7
  },
  speechStyle: {
    greeting: 'warm',
    vocabulary: 'simple',
    quirk: 'trading stories'
  },
  description: "Retired freighter captain. Mentor figure. Knows the old routes.",
  initialRep: 5,
  tips: [
    "Barnard's Star always needs ore. Mining station, you know.",
    "Sirius A pays top credit for luxury goods. Rich folks.",
    "The Procyon run is profitable if you can afford the fuel."
  ],
  discountService: null, // Mentor, not service provider
  tierBenefits: {
    warm: { discount: 0, benefit: 'Trading tips and route suggestions' },
    friendly: { discount: 0, benefit: 'Old star charts reveal profitable routes' },
    trusted: { discount: 0, benefit: 'Co-investment opportunities (50/50 splits)' },
    family: { discount: 0, benefit: 'Pavonis route hints (endgame content)' }
  }
};

// Additional NPCs: DR_SARAH_KIM, RUSTY_RODRIGUEZ, ZARA_OSMAN, 
// STATION_MASTER_KOWALSKI, LUCKY_LIU defined similarly...
```

### Extended Existing NPCs

```javascript
// Extensions for Wei Chen
export const WEI_CHEN_EXTENDED = {
  ...WEI_CHEN,
  tips: [
    "Heavy cargo shifts during transit. Secure it properly.",
    "Dock fees vary by station. Sol and Alpha Centauri charge premium.",
    "Some captains overload their holds. Bad idea in rough space."
  ],
  discountService: 'docking',
  tierBenefits: {
    warm: { discount: 0, benefit: 'Dock worker tips' },
    friendly: { discount: 0.05, benefit: '5% discount on docking services' },
    trusted: { discount: 0.05, benefit: 'Advance warning about dock inspections' },
    family: { discount: 0.10, benefit: 'Priority docking and cargo handling' }
  }
};

// Extensions for Marcus Cole
export const MARCUS_COLE_EXTENDED = {
  ...MARCUS_COLE,
  tips: [
    "Debt compounds. Pay early when you can.",
    "Credit is a tool. Use it wisely, not desperately.",
    "Some traders leverage debt for bigger hauls. Risky but effective."
  ],
  discountService: 'debt',
  tierBenefits: {
    warm: { discount: 0, benefit: 'Financial tips' },
    friendly: { discount: 0.10, benefit: '10% reduction in debt interest' },
    trusted: { discount: 0.10, benefit: 'Debt restructuring options' },
    family: { discount: 0.15, benefit: 'Favorable loan terms' }
  }
};

// Father Okonkwo - no tips (spiritual role)
export const FATHER_OKONKWO_EXTENDED = {
  ...FATHER_OKONKWO,
  tips: [], // No trading tips - spiritual guidance role
  discountService: 'medical',
  tierBenefits: {
    warm: { discount: 0, benefit: 'Spiritual guidance' },
    friendly: { discount: 0, benefit: 'Free medical supplies once per visit' },
    trusted: { discount: 0, benefit: 'Sanctuary (safe harbor) benefits' },
    family: { discount: 0, benefit: 'Emergency medical care' }
  }
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*



### Property 1: Tier Discount Calculation

*For any* NPC with a discount service and *for any* reputation value, the discount percentage returned by `getServiceDiscount()` SHALL match the tier configuration: 0% for Hostile/Cold/Neutral, 5% for Warm, 10% for Friendly, 15% for Trusted, 20% for Family.

**Validates: Requirements 1.4, 1.5, 1.6, 1.7, 11.3**

### Property 2: Tip Availability Rules

*For any* NPC and *for any* reputation value, `canGetTip()` SHALL return true if and only if:
1. The NPC's reputation tier is Warm or higher (rep >= 10), AND
2. The NPC has a non-empty tips array, AND
3. Either lastTipDay is null OR (currentDay - lastTipDay) >= 7

**Validates: Requirements 2.1, 2.3, 2.5, 2.6**

### Property 3: Tip Cooldown Tracking

*For any* NPC, after `getTip()` returns a non-null tip, the NPC state's `lastTipDay` SHALL equal the current game day, and subsequent calls to `canGetTip()` SHALL return false until 7 days have passed.

**Validates: Requirements 2.2, 2.6**

### Property 4: Tip Pool Membership

*For any* NPC with tips, every tip returned by `getTip()` SHALL be a member of that NPC's tips array.

**Validates: Requirements 2.4**

### Property 5: Favor Tier Requirements

*For any* NPC and *for any* reputation value:
- `canRequestFavor(npcId, 'loan')` SHALL return available=true only if reputation tier is Trusted or Family (rep >= 60)
- `canRequestFavor(npcId, 'storage')` SHALL return available=true only if reputation tier is Friendly or higher (rep >= 30)

**Validates: Requirements 3.1, 3.2, 3.9, 3.10**

### Property 6: Favor Cooldown Enforcement

*For any* NPC, after a favor is granted, `lastFavorDay` SHALL be set to the current game day, and `canRequestFavor()` for the same favor type SHALL return available=false until 30 days have passed.

**Validates: Requirements 3.3, 3.7**

### Property 7: Loan Grant Effects

*For any* NPC at Trusted tier or higher, when `requestLoan()` succeeds:
1. Player credits SHALL increase by exactly 500
2. NPC state `loanAmount` SHALL be set to 500
3. NPC state `loanDay` SHALL be set to current game day
4. NPC reputation SHALL increase by 5 points (before trust modifier)

**Validates: Requirements 3.5**

### Property 8: Loan Repayment Effects

*For any* NPC with an outstanding loan, when `repayLoan()` succeeds:
1. Player credits SHALL decrease by exactly 500
2. NPC state `loanAmount` SHALL be set to null
3. NPC state `loanDay` SHALL be set to null

**Validates: Requirements 3.14, 3.15**

### Property 9: Loan Default Penalty

*For any* NPC with an outstanding loan, when (currentDay - loanDay) > 30, the system SHALL reduce the NPC's reputation by one full tier (approximately 20-30 points depending on current tier).

**Validates: Requirements 3.16**

### Property 10: Cargo Storage Transfer

*For any* NPC at Friendly tier or higher and *for any* cargo array, when `storeCargo()` is called:
1. Up to 10 cargo units SHALL be removed from ship cargo
2. The removed cargo SHALL be added to NPC's storedCargo array
3. Ship cargo quantity + NPC storedCargo quantity SHALL equal original ship cargo quantity

**Validates: Requirements 3.6**

### Property 11: Cargo Retrieval Completeness

*For any* NPC with storedCargo and *for any* ship cargo capacity, when `retrieveCargo()` is called:
1. The amount transferred SHALL equal min(totalStoredUnits, availableShipCapacity)
2. If availableCapacity >= storedUnits, NPC storedCargo SHALL be empty after retrieval
3. If availableCapacity < storedUnits, NPC storedCargo SHALL contain (storedUnits - availableCapacity) units

**Validates: Requirements 3.11, 3.12, 3.13**

### Property 12: NPC-Specific Discount Application

*For any* station with multiple NPCs and *for any* service type, the discount applied SHALL come only from NPCs whose `discountService` matches the service type. NPCs with non-matching discountService SHALL not affect the price.

**Validates: Requirements 11.4**

### Property 13: NPC Data Validation

*For all* new NPCs (Whisper, Captain Vasquez, Dr. Sarah Kim, Rusty Rodriguez, Zara Osman, Station Master Kowalski, Lucky Liu), the NPC definition SHALL include all required fields and the values SHALL match the specification in Requirements 4-10.

**Validates: Requirements 4.1-4.15, 5.1-5.11, 6.1-6.10, 7.1-7.10, 8.1-8.10, 9.1-9.10, 10.1-10.10**

## Error Handling

### Invalid NPC Operations

- **Unknown NPC ID**: Throw `Error('Unknown NPC ID: ${npcId}')` - fail fast for data integrity
- **Uninitialized game state**: Throw `Error('Invalid state: method called before game initialization')`
- **Insufficient credits for repayment**: Return `{ success: false, message: 'Insufficient credits' }`
- **No outstanding loan**: Return `{ success: false, message: 'No outstanding loan' }`
- **Insufficient cargo capacity**: Partial retrieval with remaining cargo left in storage

### Favor Request Failures

Return descriptive objects rather than throwing:
```javascript
{ available: false, reason: 'NPC not met' }
{ available: false, reason: 'Requires Trusted relationship' }
{ available: false, reason: 'Requires Friendly relationship' }
{ available: false, reason: 'Favor used recently', daysRemaining: number }
{ available: false, reason: 'Outstanding loan must be repaid first' }
```

### Tip Request Failures

Return null when tips unavailable (not an error condition):
- NPC has no tips array
- Reputation below Warm tier
- Tip cooldown active (< 7 days since last tip)

## Testing Strategy

### Property-Based Testing

Use fast-check for property-based tests with minimum 100 iterations per property.

**Test Configuration:**
```javascript
// vitest.config.js - property test settings
{
  testTimeout: 30000, // Allow time for 100+ iterations
}
```

**Generator Strategies:**
- Reputation values: `fc.integer({ min: -100, max: 100 })`
- NPC IDs: `fc.constantFrom(...ALL_NPCS.map(n => n.id))`
- Cargo arrays: `fc.array(fc.record({ good: fc.constantFrom(...COMMODITY_TYPES), qty: fc.integer({ min: 1, max: 20 }) }))`
- Day values: `fc.integer({ min: 0, max: 1000 })`

### Unit Tests

Focus on specific examples and edge cases:

1. **Tier boundary tests**: Test discount at exact tier boundaries (rep = 9, 10, 29, 30, 59, 60, 89, 90)
2. **Cooldown edge cases**: Test at exactly 7 days (tips) and 30 days (favors)
3. **Cargo capacity edge cases**: Test with 0 capacity, exact capacity, overflow
4. **Loan lifecycle**: Test grant → repay, grant → default sequences
5. **NPC data validation**: Verify all 7 new NPCs have correct structure

### Integration Tests

1. **Dialogue integration**: Verify tips appear in dialogue when available
2. **Service panel integration**: Verify discounts display correctly in RefuelPanel, RepairPanel
3. **Save/load preservation**: Verify NPC state (tips, favors, loans, storage) persists correctly

### Test File Organization

```
tests/
├── property/
│   ├── tier-discount-calculation.property.test.js
│   ├── tip-availability.property.test.js
│   ├── tip-cooldown.property.test.js
│   ├── favor-tier-requirements.property.test.js
│   ├── favor-cooldown.property.test.js
│   ├── loan-effects.property.test.js
│   ├── cargo-storage.property.test.js
│   └── npc-specific-discount.property.test.js
├── unit/
│   ├── npc-benefits-data.test.js
│   ├── loan-lifecycle.test.js
│   └── cargo-retrieval-edge-cases.test.js
└── integration/
    ├── dialogue-tips.integration.test.jsx
    └── service-discounts.integration.test.jsx
```
