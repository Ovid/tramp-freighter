# Tramp Freighter Blues - Spec 08.5: Cultural Regions

**Foundation:** Spec 07 (Endgame)
**Status:** Ready for Development
**Dependencies:** Specs 01-07 must be complete
**Related:** 08.1 (Economic Balance), 08.2 (NPC Expansion), 08.4 (Event Expansion)

---

## Overview

Implement cultural regions that give different areas of the starmap distinct character, affecting prices, NPC attitudes, inspection frequency, and events.

## Goals

- Define 5 cultural regions with distinct personalities
- Region-specific price modifiers
- Region-specific docking fees and inspection frequency
- NPC attitude variations by region
- Region-flavored events
- Per-region reputation tracking

## Out of Scope

- Station type assignment (see 08.3)
- Base economic balance (see 08.1)

---

## Region Detection System

```javascript
const CULTURAL_REGIONS = {
  sol_sphere: {
    name: 'The Sol Sphere',
    systems: [0, 4, 2, 5, 11], // Sol, Barnard's, Wolf 359, Lalande 21185, Ross 128
    character: 'Bureaucratic, regulated, safe',
    priceModifiers: {
      luxury: 1.2,
      electronics: 1.1,
      restricted: 1.5, // Expensive due to regulation
    },
    dockingFeeMultiplier: 1.5,
    inspectionFrequency: 1.5,
    attitude: 'polite_impersonal',
  },

  centauri_cluster: {
    name: 'The Centauri Cluster',
    systems: [1, 3, 11, 9], // Alpha Centauri A, Proxima, Ross 154, Epsilon Indi
    character: 'Pioneer spirit, independent, tight-knit',
    priceModifiers: {
      grain: 0.8,
      water: 0.9,
      parts: 1.1,
    },
    dockingFeeMultiplier: 1.0,
    inspectionFrequency: 0.8,
    attitude: 'warm_to_proven',
  },

  sirius_compact: {
    name: 'The Sirius Compact',
    systems: [7, 8, 6, 14], // Sirius A, Procyon A, Luyten's Star, G51-15
    character: 'Wealthy, cosmopolitan, status-conscious',
    priceModifiers: {
      luxury: 0.9,
      art: 0.8,
      all: 1.15, // Everything more expensive
    },
    dockingFeeMultiplier: 2.0,
    inspectionFrequency: 1.2,
    attitude: 'transactional',
  },

  eridani_federation: {
    name: 'The Eridani Federation',
    systems: [10, 12, 13, 15], // Epsilon Eridani, Tau Ceti, L 726-8 A, Lacaille 9352
    character: 'Industrial, pragmatic, union-oriented',
    priceModifiers: {
      parts: 0.8,
      ore: 0.7,
      equipment: 0.9,
    },
    dockingFeeMultiplier: 0.9,
    inspectionFrequency: 1.0,
    attitude: 'respect_hard_work',
  },

  outer_reach: {
    name: 'The Outer Reach',
    systems: [], // All systems > 15 LY from Sol
    character: 'Frontier, lawless, opportunity-rich',
    priceModifiers: {
      salvage: 0.6,
      restricted: 0.8,
      exotic: 0.7,
    },
    dockingFeeMultiplier: 0.7,
    inspectionFrequency: 0.3,
    attitude: 'mind_your_business',
  },
};

function getSystemRegion(systemId) {
  // Check explicit region assignments
  for (const [regionId, region] of Object.entries(CULTURAL_REGIONS)) {
    if (region.systems.includes(systemId)) {
      return regionId;
    }
  }

  // Default to Outer Reach for distant systems
  const system = STAR_DATA.find((s) => s.id === systemId);
  const distance = getDistanceFromSol(system);
  if (distance > 15) return 'outer_reach';

  // Default to Sol Sphere
  return 'sol_sphere';
}
```

---

## Region-Specific Features

### Price Modifiers

```javascript
function calculatePrice(good, system, gameState) {
  const basePrice = GOODS[good].basePrice;
  const region = getSystemRegion(system.id);
  const regionData = CULTURAL_REGIONS[region];

  // Apply region modifier
  let regionMod =
    regionData.priceModifiers[good] || regionData.priceModifiers.all || 1.0;

  // ... rest of price calculation

  return Math.round(
    basePrice * productionMod * stationMod * dailyMod * eventMod * regionMod
  );
}
```

### Docking Fees

```javascript
function getDockingFee(system) {
  const region = getSystemRegion(system.id);
  const baseFee = 25;
  return Math.round(baseFee * CULTURAL_REGIONS[region].dockingFeeMultiplier);
}
```

### Inspection Frequency

```javascript
function checkForInspection(systemId) {
  const region = getSystemRegion(systemId);
  const baseChance = 0.1;
  const regionMultiplier = CULTURAL_REGIONS[region].inspectionFrequency;

  // ... rest of inspection logic
}
```

### NPC Attitudes

```javascript
function getNPCGreeting(npc, region) {
  const attitude = CULTURAL_REGIONS[region].attitude;

  switch (attitude) {
    case 'polite_impersonal':
      return npc.dialogue.greeting_formal;
    case 'warm_to_proven':
      return npc.rep > 20
        ? npc.dialogue.greeting_warm
        : npc.dialogue.greeting_cold;
    case 'transactional':
      return npc.dialogue.greeting_business;
    case 'respect_hard_work':
      return gameState.stats.trades > 50
        ? npc.dialogue.greeting_respect
        : npc.dialogue.greeting_neutral;
    case 'mind_your_business':
      return npc.dialogue.greeting_terse;
  }
}
```

---

## Region-Specific Events

Add region-flavored events:

```javascript
// Sol Sphere: Bureaucratic delays
{
  id: "sol_sphere_paperwork",
  type: "dock",
  trigger: { region: "sol_sphere", chance: 0.15 },
  content: {
    text: ["Customs requires additional documentation. Standard procedure."],
    choices: [
      { text: "Fill out the forms. (1 hour)", effects: [{ type: "time", value: 0.04 }] },
      { text: "Bribe the clerk. (₡100)", effects: [{ type: "credits", value: -100 }] }
    ]
  }
}

// Outer Reach: Lawless opportunities
{
  id: "outer_reach_deal",
  type: "dock",
  trigger: { region: "outer_reach", chance: 0.10 },
  content: {
    text: ["A shady figure offers you a 'no questions asked' cargo run."],
    choices: [
      { text: "Accept the job.", next: "shady_mission" },
      { text: "Decline.", effects: [] }
    ]
  }
}
```

---

## Regional Reputation

Track reputation per region:

```javascript
gameState.regionalReputation = {
  sol_sphere: 0,
  centauri_cluster: 0,
  sirius_compact: 0,
  eridani_federation: 0,
  outer_reach: 0,
};

function modifyRegionalRep(region, amount) {
  gameState.regionalReputation[region] += amount;
  gameState.regionalReputation[region] = Math.max(
    -100,
    Math.min(100, gameState.regionalReputation[region])
  );
}
```

Regional reputation affects:

- NPC initial attitudes
- Docking priority
- Mission availability
- Epilogue text

---

## Implementation Notes

- Region data in a new `src/game/data/region-data.js`
- `getSystemRegion()` used by TradingManager, DangerManager, DialogueManager
- Regional reputation stored in game state and save data
- Region modifiers compose with station type modifiers (08.3) multiplicatively

## Success Criteria

- [ ] 5 cultural regions defined and assigned
- [ ] Price modifiers applied per region
- [ ] Docking fees vary by region
- [ ] Inspection frequency varies by region
- [ ] NPC attitudes reflect regional character
- [ ] At least 2 region-specific events per region
- [ ] Regional reputation tracked and affects gameplay
- [ ] Region info visible to player somewhere in UI
