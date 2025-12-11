# Tramp Freighter Blues - Spec 03: Ship Personality

**Foundation:** Spec 02 (Dynamic Economy)  
**Status:** Ready for Development  
**Dependencies:** Specs 01-02 must be complete

---

## Overview

Give the ship character through quirks and meaningful upgrade choices. Ships aren't just stat blocks — they have personality, history, and tradeoffs.

## Goals

- Ship quirks system (random personality traits)
- Upgrade system with meaningful tradeoffs
- Expanded cargo management
- Smuggler's panels (hidden cargo)
- Ship naming

## Out of Scope

- NPCs and relationships
- Combat mechanics
- Narrative events
- The Range Extender (endgame upgrade)

---

## Ship Quirks

### Quirk System

Each ship starts with 2-3 randomly assigned quirks that are permanent.

```javascript
const SHIP_QUIRKS = {
  sticky_seal: {
    name: 'Sticky Cargo Seal',
    description: 'The main cargo hatch sticks. Every. Single. Time.',
    effects: {
      loadingTime: 1.1, // +10% slower
      theftRisk: 0.95, // -5% theft risk
    },
    flavor: "You've learned to kick it in just the right spot.",
  },

  hot_thruster: {
    name: 'Hot Thruster',
    description: 'Port thruster runs hot. Burns extra fuel but responsive.',
    effects: {
      fuelEfficiency: 0.95, // -5% efficiency
      escapeChance: 1.1, // +10% escape (future combat)
    },
    flavor: "The engineers say it's 'within tolerances.' Barely.",
  },

  sensitive_sensors: {
    name: 'Sensitive Sensors',
    description: 'Sensor array picks up everything. Including false positives.',
    effects: {
      salvageDetection: 1.15, // +15% salvage finds
      falseAlarms: 1.1, // +10% false alarms
    },
    flavor: "You've learned to tell the difference. Mostly.",
  },

  cramped_quarters: {
    name: 'Cramped Quarters',
    description: 'Living space is... cozy. Very cozy.',
    effects: {
      maxCrew: -1, // -1 crew slot (future)
      lifeSupportDrain: 0.9, // -10% drain
    },
    flavor: "At least you don't have to share.",
  },

  lucky_ship: {
    name: 'Lucky Ship',
    description: 'This ship has a history of beating the odds.',
    effects: {
      negateEventChance: 0.05, // 5% to negate bad events
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
      hullDegradation: 1.5, // +50% hull damage per jump
    },
    flavor: "You can hear the whistle when you're in the cargo bay.",
  },

  smooth_talker: {
    name: "Smooth Talker's Ride",
    description: 'Previous owner had a reputation. It rubs off.',
    effects: {
      npcRepGain: 1.05, // +5% relationship gains
    },
    flavor: 'People remember this ship. Usually fondly.',
  },
};
```

### Quirk Assignment

```javascript
function assignQuirks() {
  const quirkKeys = Object.keys(SHIP_QUIRKS);
  const count = Math.random() < 0.5 ? 2 : 3; // 50% chance of 2 or 3

  const assigned = [];
  while (assigned.length < count) {
    const quirk = quirkKeys[Math.floor(Math.random() * quirkKeys.length)];
    if (!assigned.includes(quirk)) {
      assigned.push(quirk);
    }
  }

  return assigned;
}

// On new game:
gameState.ship.quirks = assignQuirks();
```

### Quirk Display

Show in ship status screen:

```
┌─────────────────────────────────────────────────────────┐
│  SHIP STATUS — Serendipity                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Fuel:         ████████░░  78%                          │
│  Hull:         ██████░░░░  65%                          │
│  Engine:       ████████░░  84%                          │
│  Life Support: ███████░░░  72%                          │
│                                                         │
│  Cargo: 25/50                                           │
│                                                         │
│  ═══ SHIP QUIRKS ═══                                    │
│                                                         │
│  ⚙ Sticky Cargo Seal                                    │
│    The main cargo hatch sticks. Every. Single. Time.    │
│    You've learned to kick it in just the right spot.    │
│                                                         │
│  ⚙ Fuel Sipper                                          │
│    Efficient drive core. Previous owner was meticulous. │
│    One of the few things that works better than spec.   │
│                                                         │
│  [BACK]                                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Upgrade System

### Available Upgrades

```javascript
const SHIP_UPGRADES = {
  extended_tank: {
    name: 'Extended Fuel Tank',
    cost: 3000,
    description: 'Increases fuel capacity by 50%',
    effects: {
      fuelCapacity: 150, // Up from 100
      combatVulnerability: 1.05, // +5% damage taken
    },
    tradeoff: 'Larger tank is more vulnerable to weapons fire.',
    requirements: {},
  },

  reinforced_hull: {
    name: 'Reinforced Hull Plating',
    cost: 5000,
    description: 'Reduces hull degradation by 50%',
    effects: {
      hullDegradation: 0.5,
      cargoCapacity: -5, // Lose 5 cargo space
    },
    tradeoff: 'Extra plating takes up cargo space.',
    requirements: {},
  },

  efficient_drive: {
    name: 'Efficient Drive System',
    cost: 4000,
    description: 'Reduces fuel consumption by 20%',
    effects: {
      fuelConsumption: 0.8,
      escapeChance: 0.95, // -5% escape chance
    },
    tradeoff: 'Optimized for efficiency, not speed.',
    requirements: {},
  },

  expanded_hold: {
    name: 'Expanded Cargo Hold',
    cost: 6000,
    description: 'Increases cargo capacity by 50%',
    effects: {
      cargoCapacity: 75, // Up from 50
      maneuverability: 0.9, // -10% maneuverability
    },
    tradeoff: 'Heavier ship is less maneuverable.',
    requirements: {},
  },

  smuggler_panels: {
    name: "Smuggler's Panels",
    cost: 4500,
    description: 'Hidden cargo compartment (10 units)',
    effects: {
      hiddenCargoCapacity: 10,
    },
    tradeoff: 'If discovered, reputation loss with authorities.',
    requirements: {},
  },

  advanced_sensors: {
    name: 'Advanced Sensor Array',
    cost: 3500,
    description: 'See economic events one jump ahead',
    effects: {
      eventVisibility: 1, // Can see events in connected systems
    },
    tradeoff: 'None',
    requirements: {},
  },

  medical_bay: {
    name: 'Medical Bay',
    cost: 2500,
    description: 'Slower life support degradation',
    effects: {
      lifeSupportDrain: 0.7, // -30% drain
      cargoCapacity: -5,
    },
    tradeoff: 'Takes up cargo space.',
    requirements: {},
  },
};
```

### Upgrade Interface

Add to station menu:

```
[UPGRADES]         Ship modifications
```

### Upgrade Screen

```
┌─────────────────────────────────────────────────────────┐
│  SHIP UPGRADES — Sol Station           Credits: 8,240   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Extended Fuel Tank                            ₡3,000   │
│  Increases fuel capacity by 50%                         │
│  ⚠ Tradeoff: +5% damage from combat                     │
│  [PURCHASE]                                             │
│                                                         │
│  Reinforced Hull Plating                       ₡5,000   │
│  Reduces hull degradation by 50%                        │
│  ⚠ Tradeoff: -5 cargo capacity                          │
│  [PURCHASE]                                             │
│                                                         │
│  Expanded Cargo Hold                           ₡6,000   │
│  Increases cargo capacity to 75 units                   │
│  ⚠ Tradeoff: -10% maneuverability                       │
│  [PURCHASE]                                             │
│                                                         │
│  ═══ INSTALLED UPGRADES ═══                             │
│  • Efficient Drive System                               │
│                                                         │
│  [BACK]                                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Upgrade Confirmation

```
┌─────────────────────────────────────────────────────────┐
│  CONFIRM PURCHASE                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Expanded Cargo Hold                           ₡6,000   │
│                                                         │
│  This upgrade will:                                     │
│  • Increase cargo capacity from 50 to 75 units          │
│  • Reduce maneuverability by 10%                        │
│                                                         │
│  This upgrade is PERMANENT and cannot be removed.       │
│                                                         │
│  Your credits: ₡8,240                                   │
│  After purchase: ₡2,240                                 │
│                                                         │
│  [CONFIRM]  [CANCEL]                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Smuggler's Panels

### Hidden Cargo

```javascript
gameState.ship.hiddenCargo = []; // Separate from regular cargo
gameState.ship.hiddenCargoCapacity = 0; // 0 unless upgrade purchased
```

### Trade Interface with Hidden Cargo

```
┌─────────────────────────────────────────────────────────┐
│  TRADE — Sol Station                   Credits: 2,340   │
├────────────────────┬────────────────────────────────────┤
│  STATION GOODS     │  YOUR CARGO                        │
├────────────────────┼────────────────────────────────────┤
│  Grain       ₡24   │  Grain (20)      bought @ ₡24      │
│  Ore         ₡25   │  Medicine (5)    bought @ ₡210     │
│  Tritium     ₡45   │                                    │
│  Parts       ₡198  │  ─────────────────                 │
│  Medicine    ₡200  │  Capacity: 25/50                   │
│  Electronics ₡300  │                                    │
│                    │  ═══ HIDDEN CARGO ═══              │
│  [RESTRICTED]      │  Weapons (3)     bought @ ₡450     │
│                    │  Capacity: 3/10                    │
├────────────────────┴────────────────────────────────────┤
│  [TOGGLE HIDDEN CARGO VIEW]                             │
│                                                          │
│  Selected: Medicine                                      │
│  [BUY 1] [BUY 10] [BUY MAX]  |  [SELL 1] [SELL ALL]     │
│  [MOVE TO HIDDEN] (if smuggler panels installed)        │
└─────────────────────────────────────────────────────────┘
```

Hidden cargo:

- Not visible during inspections (unless discovered)
- Can store any goods, but typically used for restricted items
- 10% chance of discovery during inspection
- If discovered: cargo confiscated, fine, reputation loss

---

## Ship Naming

### Name Selection

On new game, prompt for ship name:

```
┌─────────────────────────────────────────────────────────┐
│  NEW GAME                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Your ship needs a name.                                │
│                                                         │
│  Ship Name: [________________]                          │
│                                                         │
│  Suggestions:                                           │
│  • Serendipity    • Lucky Break    • Second Chance      │
│  • Wanderer       • Free Spirit    • Horizon's Edge     │
│                                                         │
│  [START GAME]                                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Default to "Serendipity" if player doesn't choose.

---

## Cargo Management

### Cargo Details

```javascript
gameState.ship.cargo = [
  {
    good: 'grain',
    qty: 20,
    buyPrice: 24,
    buySystem: 0, // Sol
    buySystemName: 'Sol',
    buyDate: 5, // Days ago
  },
];
```

### Cargo Screen

Add to station menu or HUD:

```
[CARGO]            View cargo manifest
```

```
┌─────────────────────────────────────────────────────────┐
│  CARGO MANIFEST — Serendipity                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Capacity: 25/50 units                                  │
│                                                         │
│  Grain (20 units)                                       │
│  Purchased at Sol for ₡24 each (5 days ago)             │
│  Current value: ₡480                                    │
│                                                         │
│  Medicine (5 units)                                     │
│  Purchased at Barnard's Star for ₡210 each (1 day ago)  │
│  Current value: ₡1,050                                  │
│                                                         │
│  ─────────────────                                      │
│  Total cargo value: ₡1,530                              │
│                                                         │
│  [BACK]                                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Effect Calculations

### Applying Quirks and Upgrades

```javascript
function calculateFuelCost(distance) {
  let baseCost = 10 + distance * 2;

  // Apply quirks
  gameState.ship.quirks.forEach((quirkId) => {
    const quirk = SHIP_QUIRKS[quirkId];
    if (quirk.effects.fuelConsumption) {
      baseCost *= quirk.effects.fuelConsumption;
    }
  });

  // Apply upgrades
  gameState.ship.upgrades.forEach((upgradeId) => {
    const upgrade = SHIP_UPGRADES[upgradeId];
    if (upgrade.effects.fuelConsumption) {
      baseCost *= upgrade.effects.fuelConsumption;
    }
  });

  // Apply engine condition
  if (gameState.ship.engine < 60) {
    baseCost *= 1.2;
  }

  return Math.round(baseCost);
}
```

Similar logic for hull degradation, life support drain, etc.

---

## Testing Checklist

- [ ] New ships get 2-3 random quirks
- [ ] Quirks display correctly in ship status
- [ ] Quirks affect gameplay (fuel consumption, etc.)
- [ ] Can purchase upgrades at stations
- [ ] Upgrades cost credits correctly
- [ ] Upgrades apply effects (capacity, efficiency, etc.)
- [ ] Upgrade tradeoffs work as described
- [ ] Cannot purchase same upgrade twice
- [ ] Smuggler's panels create hidden cargo space
- [ ] Hidden cargo not visible in normal trade view
- [ ] Can move goods to/from hidden cargo
- [ ] Ship name appears in UI
- [ ] Cargo manifest shows purchase details
- [ ] Cargo value calculated correctly

---

## Success Criteria

Player can:

1. See their ship's unique personality through quirks
2. Make meaningful upgrade choices with tradeoffs
3. Expand cargo capacity for larger hauls
4. Use smuggler's panels for risky goods
5. Name their ship
6. Track cargo purchase history and value

**Next Spec:** NPCs, relationships, and dialogue system
