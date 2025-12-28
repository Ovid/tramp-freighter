# Design Document: Danger System

## Overview

The Danger System adds tension and risk to space travel through pirate encounters, customs inspections, mechanical failures, and moral choices. This system integrates with the existing navigation and game state architecture to create meaningful consequences for player decisions during jumps between star systems.

The system follows the existing manager-based architecture, introducing a new `DangerManager` that coordinates with `NavigationManager` to intercept jump events and trigger appropriate encounters. All encounter resolution is choice-driven rather than reflex-based, presenting players with tactical options and clear probability information.

## Architecture

### System Integration

The Danger System integrates with the existing architecture through:

1. **DangerManager**: New manager class handling all danger-related logic
2. **NavigationManager Integration**: Hook into jump events to trigger encounters
3. **GameStateManager Extensions**: New state fields for karma, faction reputation, and hidden cargo
4. **UI Components**: React panels for encounter resolution

```
┌─────────────────────────────────────────────────────────────────┐
│                      GameStateManager                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Navigation  │──│   Danger    │──│  State (karma, factions)│  │
│  │  Manager    │  │   Manager   │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         │                │                      │                │
│         ▼                ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Event System                              ││
│  │  (encounterTriggered, combatResolved, karmaChanged, etc.)   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      React UI Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ PiratePanel  │  │ Inspection   │  │ DistressCallPanel    │   │
│  │              │  │ Panel        │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ CombatPanel  │  │ Negotiation  │  │ MechanicalFailure    │   │
│  │              │  │ Panel        │  │ Panel                │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### State Extensions

New fields added to game state:

```javascript
{
  player: {
    // ... existing fields
    karma: 0,  // -100 to +100
    factions: {
      authorities: 0,  // -100 to +100
      traders: 0,
      outlaws: 0,
      civilians: 0
    }
  },
  ship: {
    // ... existing fields
    hiddenCargo: []  // Separate from regular cargo
  },
  world: {
    // ... existing fields
    dangerFlags: {
      piratesFought: 0,
      piratesNegotiated: 0,
      civiliansSaved: 0,
      civiliansLooted: 0,
      inspectionsPassed: 0,
      inspectionsBribed: 0,
      inspectionsFled: 0
    }
  }
}
```

## Components and Interfaces

### DangerManager

The central manager for all danger-related operations.

```javascript
class DangerManager extends BaseManager {
  // Danger zone classification
  getDangerZone(systemId): 'safe' | 'contested' | 'dangerous'
  
  // Encounter checks (called during jump)
  checkForPirateEncounter(fromSystem, toSystem): PirateEncounter | null
  checkForInspection(systemId): Inspection | null
  checkForMechanicalFailure(): MechanicalFailure | null
  checkForDistressCall(): DistressCall | null
  
  // Combat resolution
  resolveCombatChoice(encounter, choice): CombatResult
  resolveNegotiation(encounter, choice): NegotiationResult
  
  // Inspection resolution
  resolveInspection(inspection, choice): InspectionResult
  
  // Distress call resolution
  resolveDistressCall(distressCall, choice): DistressResult
  
  // Mechanical failure resolution
  resolveMechanicalFailure(failure, choice): FailureResult
  
  // Karma and faction management
  modifyKarma(amount, reason): void
  modifyFactionRep(faction, amount, reason): void
  getKarma(): number
  getFactionRep(faction): number
}
```

### Encounter Types

```typescript
interface PirateEncounter {
  id: string;
  threatLevel: 'weak' | 'moderate' | 'strong' | 'dangerous';
  name: string;
  demandPercent: number;  // Cargo percentage demanded
  options: TacticalOption[];
}

interface TacticalOption {
  id: string;
  name: string;
  description: string;
  baseSuccessChance: number;
  modifiers: Modifier[];
  successOutcome: Outcome;
  failureOutcome: Outcome;
}

interface Inspection {
  id: string;
  severity: 'routine' | 'thorough';
  hiddenCargoCheckChance: number;
  options: InspectionOption[];
}

interface DistressCall {
  id: string;
  description: string;
  costs: ResourceCost;
  rewards: ResourceReward;
  options: DistressOption[];
}

interface MechanicalFailure {
  type: 'hull_breach' | 'engine_failure' | 'life_support';
  severity: number;
  options: RepairOption[];
}
```

### UI Components

New React components for encounter resolution:

1. **DangerWarningDialog**: Shown before jumping to dangerous systems
2. **PirateEncounterPanel**: Initial pirate encounter with tactical options
3. **CombatPanel**: Combat resolution with probability display
4. **NegotiationPanel**: Dialogue-based pirate negotiation
5. **InspectionPanel**: Customs inspection resolution
6. **DistressCallPanel**: Moral choice for distress calls
7. **MechanicalFailurePanel**: Ship failure resolution

## Data Models

### Danger Zone Configuration

```javascript
// In game/constants.js
export const DANGER_CONFIG = {
  ZONES: {
    safe: {
      pirateChance: 0.05,
      inspectionChance: 0.10,
      systems: [0, 1, 4]  // Sol, Alpha Centauri, Barnard's Star
    },
    contested: {
      pirateChance: 0.20,
      inspectionChance: 0.15,
      systems: [7, 10]  // Sirius, Epsilon Eridani
    },
    dangerous: {
      pirateChance: 0.35,
      inspectionChance: 0.05,
      distanceThreshold: 15  // Light years from Sol
    }
  },
  
  CARGO_VALUE_MODIFIERS: {
    THRESHOLD_LOW: 5000,
    MULTIPLIER_LOW: 1.2,
    THRESHOLD_HIGH: 10000,
    MULTIPLIER_HIGH: 1.5
  },
  
  ENGINE_CONDITION_MODIFIER: {
    THRESHOLD: 50,
    MULTIPLIER: 1.1
  },
  
  ADVANCED_SENSORS_MODIFIER: 0.8,
  
  CORE_SYSTEMS_INSPECTION_MULTIPLIER: 2.0,
  RESTRICTED_GOODS_INSPECTION_MODIFIER: 0.1
};
```

### Combat Configuration

```javascript
export const COMBAT_CONFIG = {
  EVASIVE: {
    BASE_CHANCE: 0.70,
    SUCCESS_FUEL_COST: 15,
    SUCCESS_ENGINE_COST: 5,
    FAILURE_HULL_DAMAGE: 20
  },
  
  RETURN_FIRE: {
    BASE_CHANCE: 0.45,
    SUCCESS_HULL_DAMAGE: 10,
    FAILURE_HULL_DAMAGE: 30,
    FAILURE_CREDITS_LOSS: 500
  },
  
  DUMP_CARGO: {
    CARGO_LOSS_PERCENT: 50,
    FUEL_COST: 10
  },
  
  DISTRESS_CALL: {
    BASE_CHANCE: 0.30,
    SUCCESS_REP_GAIN: 5,
    FAILURE_HULL_DAMAGE: 25
  },
  
  // Quirk and upgrade modifiers
  MODIFIERS: {
    hot_thruster: { evasiveBonus: 0.10 },
    lucky_ship: { negateChanceBase: 0.05 },
    reinforced_hull: { damageReduction: 0.25 },
    efficient_drive: { fleeBonus: 0.10 },
    sensitive_sensors: { distressBonus: 0.05 },
    leaky_seals: { damageIncrease: 0.10 }
  }
};
```

### Negotiation Configuration

```javascript
export const NEGOTIATION_CONFIG = {
  COUNTER_PROPOSAL: {
    BASE_CHANCE: 0.60,
    SUCCESS_CARGO_PERCENT: 10,
    FAILURE_STRENGTH_INCREASE: 0.10
  },
  
  MEDICINE_CLAIM: {
    SYMPATHY_CHANCE: 0.40
  },
  
  INTEL_OFFER: {
    SUCCESS_REP_PENALTY: -10  // If discovered
  },
  
  ACCEPT_DEMAND: {
    CARGO_PERCENT: 20
  }
};
```

### Inspection Configuration

```javascript
export const INSPECTION_CONFIG = {
  COOPERATE: {
    RESTRICTED_FINE: 1000,
    HIDDEN_FINE: 2000
  },
  
  BRIBE: {
    COST: 500,
    BASE_CHANCE: 0.60,
    FAILURE_ADDITIONAL_FINE: 1500
  },
  
  HIDDEN_CARGO_DISCOVERY_CHANCE: 0.10,
  
  REPUTATION_PENALTIES: {
    RESTRICTED_GOODS: -10,
    HIDDEN_CARGO: -20
  }
};
```

### Mechanical Failure Configuration

```javascript
export const FAILURE_CONFIG = {
  HULL_BREACH: {
    CONDITION_THRESHOLD: 50,
    CHANCE: 0.10,
    HULL_DAMAGE: 5
  },
  
  ENGINE_FAILURE: {
    CONDITION_THRESHOLD: 30,
    CHANCE: 0.15,
    EMERGENCY_RESTART: {
      CHANCE: 0.50,
      ENGINE_COST: 10
    },
    CALL_FOR_HELP: {
      CREDITS_COST: 1000,
      DAYS_DELAY: 2
    },
    JURY_RIG: {
      CHANCE: 0.75,
      ENGINE_COST: 5
    }
  },
  
  LIFE_SUPPORT: {
    CONDITION_THRESHOLD: 30,
    CHANCE: 0.05
  }
};
```

### Distress Call Configuration

```javascript
export const DISTRESS_CONFIG = {
  CHANCE: 0.10,
  
  RESPOND: {
    DAYS_COST: 2,
    FUEL_COST: 15,
    LIFE_SUPPORT_COST: 5,
    CREDITS_REWARD: 500,
    REP_REWARD: 10,
    KARMA_REWARD: 1
  },
  
  IGNORE: {
    KARMA_PENALTY: -1
  },
  
  LOOT: {
    DAYS_COST: 1,
    KARMA_PENALTY: -3,
    REP_PENALTY: -15
  }
};
```

### Karma and Faction Configuration

```javascript
export const KARMA_CONFIG = {
  MIN: -100,
  MAX: 100,
  INITIAL: 0,
  
  // Karma affects lucky_ship quirk effectiveness
  LUCKY_SHIP_KARMA_SCALE: 0.001  // 5% base + (karma * 0.001) = 5-15% at max karma
};

export const FACTION_CONFIG = {
  MIN: -100,
  MAX: 100,
  INITIAL: 0,
  
  FACTIONS: ['authorities', 'traders', 'outlaws', 'civilians']
};
```

### Restricted Goods Configuration

```javascript
export const RESTRICTED_GOODS_CONFIG = {
  // Goods restricted in safe zones
  SAFE_ZONE_RESTRICTED: ['weapons'],  // Future commodity
  
  // Goods restricted in core systems only
  CORE_RESTRICTED: ['narcotics'],  // Future commodity
  
  // Premium price multiplier for legal sales
  PREMIUM_MULTIPLIER: 1.5
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Danger Zone Classification Consistency

*For any* star system, calling `getDangerZone(systemId)` multiple times with the same system ID and game state SHALL return the same classification, and the classification SHALL follow the rules: systems 0, 1, 4 are safe; systems 7, 10 are contested; systems beyond 15 LY from Sol are dangerous.

**Validates: Requirements 1.1, 1.2, 1.10, 1.11, 1.12**

### Property 2: Zone-Specific Encounter Rates

*For any* danger zone, the base pirate encounter rate SHALL be 5% for safe, 20% for contested, and 35% for dangerous zones; and the base inspection rate SHALL be 10% for safe, 15% for contested, and 5% for dangerous zones.

**Validates: Requirements 1.4, 1.5, 1.6, 1.7, 1.8, 1.9**

### Property 3: Encounter Probability Modifiers

*For any* pirate encounter check, the probability SHALL be multiplied by 1.2 if cargo value exceeds ₡5,000, by 1.5 if cargo value exceeds ₡10,000, by 1.1 if engine condition is below 50%, and by 0.8 if advanced sensors are installed; the final probability SHALL be clamped between 0 and 1.

**Validates: Requirements 2.7, 2.8, 2.9, 2.10**

### Property 4: Combat Resolution Outcomes

*For any* combat choice, the outcomes SHALL match the configured values: evasive maneuvers have 70% base chance with -15% fuel/-5% engine on success and -20% hull on failure; return fire has 45% base chance with -10% hull on success and -30% hull plus cargo/credit loss on failure; dump cargo guarantees escape with -50% cargo/-10% fuel; distress call has 30% base chance with +5 reputation on success and -25% hull on failure.

**Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11**

### Property 5: Combat Modifier Application

*For any* combat resolution with applicable quirks/upgrades, the modifiers SHALL be applied correctly: hot_thruster adds +10% to evasive; lucky_ship provides 5% base negate chance scaled by karma; reinforced_hull reduces damage by 25%; efficient_drive adds +10% to flee; sensitive_sensors adds +5% to distress; leaky_seals increases damage by 10%.

**Validates: Requirements 3.12, 3.13, 3.14, 3.15, 3.16, 3.17**

### Property 6: Negotiation Outcomes

*For any* negotiation choice, the outcomes SHALL match: counter-proposal has 60% base chance with 10% cargo on success and +10% enemy strength on failure; medicine claim has 40% sympathy chance; accept demand costs 20% cargo.

**Validates: Requirements 4.2, 4.3, 4.4, 4.6, 4.7, 4.10**

### Property 7: Inspection Outcomes

*For any* inspection resolution, the outcomes SHALL match: cooperate with restricted goods costs ₡1,000 fine and -10 authority rep; hidden cargo discovery costs ₡2,000 fine and -20 authority rep; bribery costs ₡500 with 60% success chance; bribery failure adds ₡1,500 penalty.

**Validates: Requirements 5.4, 5.5, 5.6, 5.7, 5.8, 5.11**

### Property 8: Inspection Probability Scaling

*For any* inspection check with restricted goods, the probability SHALL be multiplied by (1 + restrictedCount * 0.1), and in core systems (0, 1) SHALL be doubled.

**Validates: Requirements 5.2, 5.12**

### Property 9: Mechanical Failure Thresholds

*For any* ship condition below the failure threshold, the failure check SHALL use the correct probability: hull below 50% has 10% breach chance with -5% hull damage; engine below 30% has 15% failure chance; life support below 30% has 5% emergency chance.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 10: Engine Failure Repair Options

*For any* engine failure, the repair options SHALL have correct mechanics: emergency restart has 50% success with -10% engine cost; call for help costs ₡1,000 and +2 days; jury-rig has 75% success with -5% engine cost.

**Validates: Requirements 6.7, 6.8, 6.9**

### Property 11: Distress Call Outcomes

*For any* distress call choice, the outcomes SHALL match: help costs 2 days, 15% fuel, 5% life support and rewards ₡500, +10 reputation, +1 karma; ignore costs -1 karma; loot costs 1 day, -3 karma, -15 reputation.

**Validates: Requirements 7.7, 7.8, 7.9, 7.10**

### Property 12: Karma Clamping

*For any* sequence of karma modifications, the resulting karma value SHALL always be within the range [-100, +100], and new games SHALL initialize karma to 0.

**Validates: Requirements 9.1, 9.2, 9.3, 9.8**

### Property 13: Faction Reputation Clamping

*For any* sequence of faction reputation modifications, each faction's reputation value SHALL always be within the range [-100, +100], and new games SHALL initialize all four factions (authorities, traders, outlaws, civilians) to 0.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 14: Hidden Cargo Separation

*For any* ship with hidden cargo compartments, the hidden cargo manifest SHALL be maintained separately from regular cargo, and customs inspections SHALL only display regular cargo in the manifest unless hidden compartments are discovered (10% base chance).

**Validates: Requirements 11.4, 11.5, 11.6, 11.7**

### Property 15: State Persistence Round-Trip

*For any* game state with karma, faction reputation, ship damage, or cargo changes from encounters, saving and loading the game SHALL preserve all values exactly.

**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

## Error Handling

### Invalid System IDs

When `getDangerZone()` receives an invalid system ID:
- Throw `Error` with descriptive message
- Log error for debugging
- Never return a default zone (fail fast)

### Encounter Resolution Failures

When combat/negotiation resolution fails:
- Emit `encounterError` event with details
- Display error message to player
- Allow retry or abort options

### State Corruption Detection

When loading saved game with danger state:
- Validate karma bounds (-100 to +100)
- Validate faction reputation bounds
- Validate hidden cargo structure
- Reset corrupted values to defaults with warning

### Resource Insufficiency

When player lacks resources for an action:
- Disable unavailable options in UI
- Show clear feedback on why option is unavailable
- Never allow negative resources

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

1. **Danger zone classification** for specific systems (Sol=safe, Sirius=contested, distant=dangerous)
2. **Probability calculations** with edge case modifiers (0 cargo, max cargo, 0% engine)
3. **Combat resolution** for each tactical option with specific outcomes
4. **Karma/faction clamping** at boundaries (-100, 0, +100)
5. **Hidden cargo operations** (move, discover, confiscate)
6. **Mechanical failure triggers** at exact condition thresholds (50%, 30%)
7. **Warning dialog display** for dangerous system jumps

### Property-Based Tests

Property tests verify universal properties across randomized inputs using fast-check:

1. **Property 1: Danger zone consistency** - Same system always produces same classification
2. **Property 2: Zone-specific encounter rates** - Correct base rates for each zone type
3. **Property 3: Encounter probability modifiers** - Modifiers apply correctly and clamp to [0,1]
4. **Property 4: Combat resolution outcomes** - Correct costs/rewards for each choice
5. **Property 5: Combat modifier application** - Quirks/upgrades modify probabilities correctly
6. **Property 6: Negotiation outcomes** - Correct success rates and cargo percentages
7. **Property 7: Inspection outcomes** - Correct fines and reputation penalties
8. **Property 8: Inspection probability scaling** - Restricted goods and core system multipliers
9. **Property 9: Mechanical failure thresholds** - Correct probabilities at condition levels
10. **Property 10: Engine failure repair options** - Correct success rates and costs
11. **Property 11: Distress call outcomes** - Correct resource costs and karma changes
12. **Property 12: Karma clamping** - Values always within [-100, +100] after any sequence
13. **Property 13: Faction reputation clamping** - All factions within bounds after any sequence
14. **Property 14: Hidden cargo separation** - Hidden cargo never in regular manifest
15. **Property 15: State persistence round-trip** - All danger state survives save/load

### Integration Tests

Integration tests verify component interactions:

1. **Jump → Encounter → Resolution** flow
2. **Encounter → State Change → UI Update** flow
3. **Save/Load with danger state** preservation
4. **Multiple encounters in sequence**
5. **Karma affecting lucky_ship quirk** effectiveness

### Test Configuration

- Property tests: Minimum 100 iterations per property
- Tag format: `Feature: danger-system, Property N: [property description]`
- Use fast-check for property-based testing
- Mock random number generation for deterministic tests
