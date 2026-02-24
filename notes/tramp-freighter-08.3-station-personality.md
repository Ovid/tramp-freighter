# Tramp Freighter Blues - Spec 08.3: Station Personality

**Foundation:** Spec 07 (Endgame)
**Status:** Ready for Development
**Dependencies:** Specs 01-07 must be complete
**Related:** 08.2 (NPC Expansion), 08.5 (Cultural Regions)

---

## Overview

Give each station a generated personality based on star system characteristics. Station types affect prices, NPCs, services, and atmospheric flavor text.

## Goals

- Define 6 station type templates
- Assign station types based on system properties
- Generate station names from templates
- Provide station-specific content (narration, NPCs, services)

## Out of Scope

- Cultural region overlays (see 08.5)
- New NPC creation (see 08.2)

---

## Station Templates

```javascript
const STATION_TEMPLATES = {
  mining: {
    namePatterns: ['[Star] Deep', '[Star] Pit', 'Bore Station [N]'],
    atmosphere: 'industrial',
    description:
      'Retrofitted mining platform with exposed conduit and utilitarian design',
    commonNPCs: ['shift_boss', 'equipment_dealer', 'company_rep'],
    goodsBonus: { ore: 0.7, tritium: 0.8, equipment: 1.2 },
    dockingFee: 'low',
    ambiance: 'Constant hum of machinery, smell of metal and coolant',
  },

  trading: {
    namePatterns: ['[Star] Exchange', 'Port [Name]', "[Name]'s Landing"],
    atmosphere: 'bustling',
    description:
      'Commercial hub with multiple docking bays and market districts',
    commonNPCs: ['broker', 'merchant', 'customs_officer'],
    goodsBonus: { all: 1.0 }, // Neutral
    dockingFee: 'medium',
    ambiance: 'Crowded corridors, multilingual chatter, deal-making',
  },

  research: {
    namePatterns: [
      '[Star] Institute',
      '[Star] Research Station',
      '[Name] Laboratory',
    ],
    atmosphere: 'sterile',
    description: 'Clean, modern facility with restricted access zones',
    commonNPCs: ['scientist', 'security', 'administrator'],
    goodsBonus: { medicine: 0.8, electronics: 0.9, data: 0.7 },
    dockingFee: 'high',
    ambiance: 'Quiet, clinical, occasional PA announcements',
  },

  military: {
    namePatterns: ['[Star] Outpost', 'Fort [Name]', '[Star] Defense Station'],
    atmosphere: 'regimented',
    description: 'Fortified station with visible weapon emplacements',
    commonNPCs: ['officer', 'quartermaster', 'patrol_captain'],
    goodsBonus: { weapons: 0.8, parts: 0.9 },
    dockingFee: 'medium',
    ambiance: 'Disciplined, alert, security checkpoints everywhere',
  },

  frontier: {
    namePatterns: ['[Star] Outpost', "[Name]'s Rest", 'Waystation [N]'],
    atmosphere: 'rough',
    description: 'Cobbled-together station, mix of old and salvaged parts',
    commonNPCs: ['prospector', 'trader', 'drifter'],
    goodsBonus: { salvage: 0.6, restricted: 0.9 },
    dockingFee: 'variable',
    ambiance: 'Lawless, diverse, everyone watching everyone',
  },

  colony: {
    namePatterns: ['[Star] Colony', 'New [Name]', '[Star] Settlement'],
    atmosphere: 'hopeful',
    description:
      'Growing settlement with residential and agricultural sections',
    commonNPCs: ['colonist', 'administrator', 'farmer'],
    goodsBonus: { grain: 0.7, water: 0.8, medicine: 1.2 },
    dockingFee: 'low',
    ambiance: 'Community-focused, families, sense of building something',
  },
};
```

---

## Station Assignment Logic

```javascript
function determineStationType(system) {
  // Based on spectral class and station count
  const spectralClass = system.type[0];
  const stationCount = system.st;
  const distance = getDistanceFromSol(system);

  // Mining stations: M-class stars, low station count
  if (spectralClass === 'M' && stationCount <= 2) return 'mining';

  // Trading hubs: Multiple stations, mid-range distance
  if (stationCount >= 3 && distance < 15) return 'trading';

  // Research: G/F-class, moderate stations
  if (['G', 'F'].includes(spectralClass) && stationCount === 2)
    return 'research';

  // Military: Strategic locations (near Sol or major routes)
  if (distance < 8 && stationCount >= 2) return 'military';

  // Frontier: Outer systems, low stations
  if (distance > 15 && stationCount <= 2) return 'frontier';

  // Colony: Default for habitable systems
  return 'colony';
}

function generateStationName(system, template) {
  const patterns = template.namePatterns;
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];

  return pattern
    .replace('[Star]', system.name)
    .replace('[Name]', generatePersonName())
    .replace('[N]', Math.floor(Math.random() * 20) + 1);
}
```

---

## Station-Specific Content

Each station type should have:

- **Unique first-visit narration**
- **Type-appropriate NPCs**
- **Specialized services** (e.g., mining stations have cheap repairs, trading hubs have better info brokers)
- **Atmospheric details** in event text

---

## Implementation Notes

- Station type determined on first visit, cached in save data
- Use for price modifiers and NPC placement
- Station name generation should use `SeededRandom` for determinism
- Templates and assignment logic live in a new `src/game/data/station-data.js`

## Success Criteria

- [ ] 6 station type templates defined
- [ ] Station type assigned deterministically per system
- [ ] Station names generated from templates
- [ ] First-visit narration varies by station type
- [ ] Price modifiers applied based on station goods bonuses
- [ ] Station type persists across save/load
