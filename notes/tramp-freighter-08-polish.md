# Tramp Freighter Blues - Spec 08: Polish & Content

**Foundation:** Spec 07 (Endgame)  
**Status:** Ready for Development  
**Dependencies:** Specs 01-07 must be complete

---

## Overview

Final polish pass: balance tuning, content expansion, UI/UX improvements, accessibility, and deployment preparation.

## Goals

- Balance economic curves
- Expand NPC roster to 15+
- Add 50+ events
- UI/UX polish
- Accessibility features
- Performance optimization
- Deployment for static hosting

## Out of Scope

- New major features
- Multiplayer
- Mobile app version
- Mod support

---

## Economic Balance

### Difficulty Tuning

Implement difficulty selection on new game:

```
┌─────────────────────────────────────────────────────────┐
│  NEW GAME                                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Difficulty:                                            │
│                                                         │
│  ○ EASY                                                 │
│    Lower debt, forgiving economy, less danger           │
│                                                         │
│  ● NORMAL                                               │
│    Balanced challenge, recommended for first playthrough│
│                                                         │
│  ○ HARD                                                 │
│    Higher debt, volatile markets, frequent pirates      │
│                                                         │
│  Ship Name: [________________]                          │
│                                                         │
│  [START GAME]                                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Progression Curve

Target earnings by phase:

| Phase | Days  | Avg Credits/Run | Total Earned  | Debt Remaining |
| ----- | ----- | --------------- | ------------- | -------------- |
| Early | 1-30  | 50-150          | 2,000-4,000   | 8,000-9,500    |
| Mid   | 31-90 | 150-400         | 15,000-25,000 | 2,000-5,000    |
| Late  | 91+   | 400-1000        | 40,000+       | 0              |

### Anti-Frustration

**Mercy Mechanic:**
If player has < 100 credits and debt > 12,000, Father Okonkwo offers emergency loan:

```
"I can see you're struggling. Take this. Five hundred credits. No interest. Pay me back when you can. Or don't. Just... keep flying."
```

**Minimum Viable Route:**
Ensure Sol ↔ Barnard's Star is always profitable with correct goods.

---

## Expanded NPC Roster

### Additional NPCs

**6. Dock Master Kowalski (Sol)**

- Role: Station Administrator
- Personality: Bureaucratic but fair
- Benefits: Reduced docking fees, priority bay access

**7. "Sparks" Rodriguez (Sirius A)**

- Role: Ship Mechanic
- Personality: Enthusiastic, talkative
- Benefits: Repair discounts, upgrade tips

**8. Dr. Amara Osei (Epsilon Eridani)**

- Role: Medical Officer
- Personality: Compassionate, overworked
- Benefits: Free life support repairs, medical supplies

**9. Captain Zhang (Wolf 359)**

- Role: Patrol Officer
- Personality: By-the-book, but reasonable
- Benefits: Reduced inspection frequency, warnings about pirates

**10. "Lucky" Larsen (Outer Reach)**

- Role: Salvager
- Personality: Superstitious, friendly
- Benefits: Salvage tips, buys goods at premium

**11. Mei-Lin Park (L 789-6 A)**

- Role: Smuggler Queen
- Personality: High risk, high reward, tests player ethics
- Benefits: Restricted goods missions, smuggling routes, black market access

**12-15:** Additional traders, brokers, and station personnel across the sector

---

## Station Personality System

### Station Generation

Each station should have a generated personality based on the system's characteristics:

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

### Station Assignment Logic

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

### Station-Specific Content

Each station type should have:

- **Unique first-visit narration**
- **Type-appropriate NPCs**
- **Specialized services** (e.g., mining stations have cheap repairs, trading hubs have better info brokers)
- **Atmospheric details** in event text

### Implementation in Spec 02

Station generation should be implemented when dynamic economy is added:

- Determine station type on first visit
- Cache in save data
- Use for price modifiers and NPC placement

---

## Event Expansion

### Event Categories

**Dock Events (20+):**

- First visit narration for each major system
- NPC introductions
- Station-specific flavor
- Economic news
- Festival announcements

**Jump Events (20+):**

- Pirate encounters (variety)
- Distress calls (variety)
- Salvage discoveries
- Anomalies
- Random encounters
- Mechanical issues

**Time Events (10+):**

- Debt reminders
- NPC check-ins
- Story beats
- Holiday/festival triggers
- Economic shifts

**Condition Events (10+):**

- Low fuel warnings
- Critical damage alerts
- Debt collection escalation
- Reputation milestones
- Achievement unlocks

---

## Cultural Region Implementation

### Region Detection System

Implement explicit cultural region tracking:

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

### Region-Specific Features

**Price Modifiers:**

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

**Docking Fees:**

```javascript
function getDockingFee(system) {
  const region = getSystemRegion(system.id);
  const baseFee = 25;
  return Math.round(baseFee * CULTURAL_REGIONS[region].dockingFeeMultiplier);
}
```

**Inspection Frequency:**

```javascript
function checkForInspection(systemId) {
  const region = getSystemRegion(systemId);
  const baseChance = 0.1;
  const regionMultiplier = CULTURAL_REGIONS[region].inspectionFrequency;

  // ... rest of inspection logic
}
```

**NPC Attitudes:**

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

### Region-Specific Events

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

### Regional Reputation

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

## UI/UX Polish

### Visual Improvements

**HUD Refinement:**

- Smooth animations for stat changes
- Color coding (green = good, yellow = warning, red = critical)
- Tooltips on hover
- Collapsible sections

**Starmap Enhancements:**

- Smooth camera transitions
- Highlight current location more clearly
- Show jump path preview
- Distance ruler tool
- Filter options (by distance, danger, visited)

**Modal Consistency:**

- Unified styling across all modals
- Consistent button placement
- Keyboard shortcuts (ESC to close, Enter to confirm)
- Smooth fade in/out

### Quality of Life

**Quick Actions:**

- Keyboard shortcuts for common actions
- "Quick Trade" mode (auto-sell/buy optimal goods)
- "Auto-repair" button (repair all to 100%)
- "Fast travel" option (skip jump animation after first time)

**Information Display:**

- Cargo value calculator
- Profit/loss tracker per session
- Route planner (show multi-jump routes)
- Price history graphs

**Save Management:**

- Multiple save slots (3)
- Auto-save indicator
- Manual save button
- Save file export/import

---

## Accessibility

### Visual Accessibility

**Color Blindness Support:**

- Alternative color schemes
- Pattern/texture overlays in addition to color
- High contrast mode

**Text Scaling:**

- Font size options (small, medium, large)
- Readable fonts (no overly stylized text)
- Sufficient contrast ratios

### Interaction Accessibility

**Keyboard Navigation:**

- Full keyboard support
- Tab navigation through UI
- Keyboard shortcuts documented

**Screen Reader Support:**

- ARIA labels on interactive elements
- Alt text for icons
- Semantic HTML structure

**Reduced Motion:**

- Option to disable animations
- Static alternatives to animated elements

---

## Performance Optimization

### Loading Optimization

**Asset Loading:**

- Lazy load event content
- Compress JSON data
- Minimize initial bundle size

**Rendering:**

- Optimize starmap rendering (LOD for distant stars)
- Reduce draw calls
- Efficient update loops

### Memory Management

**State Management:**

- Prune old event history
- Limit price snapshot retention
- Efficient save data structure

**Target Metrics:**

- Initial load: < 4 seconds
- Save/load: < 500ms
- UI response: < 100ms
- Memory footprint: < 100MB

---

## Content Organization

### File Structure

```
/
├── index.html
├── css/
│   ├── main.css
│   ├── starmap.css
│   ├── ui.css
│   └── accessibility.css
├── js/
│   ├── core/
│   │   ├── game-state.js
│   │   ├── save-manager.js
│   │   └── event-engine.js
│   ├── systems/
│   │   ├── trading.js
│   │   ├── navigation.js
│   │   ├── combat.js
│   │   └── missions.js
│   ├── ui/
│   │   ├── hud.js
│   │   ├── modals.js
│   │   └── starmap-ui.js
│   └── data/
│       ├── stars.js
│       ├── goods.js
│       ├── npcs.js
│       ├── events.js
│       └── missions.js
├── assets/
│   ├── fonts/
│   └── icons/
└── README.md
```

---

## Deployment

### Static Hosting Preparation

**Build Process:**

1. Minify JavaScript
2. Minify CSS
3. Optimize assets
4. Generate single-page bundle

**Hosting Options:**

- GitHub Pages
- Netlify
- Vercel
- Any static host

**Configuration:**

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tramp Freighter Blues</title>
    <meta name="description" content="A space trading survival game" />
    <link rel="stylesheet" href="css/main.css" />
  </head>
  <body>
    <div id="app"></div>
    <script src="js/bundle.min.js"></script>
  </body>
</html>
```

### README.md

```markdown
# Tramp Freighter Blues

A single-player space trading survival game built on the Sol Sector Starmap.

## Play

Visit: [your-site-url]

## About

Navigate the stars, trade goods, build relationships, and work toward reaching the distant colony at Delta Pavonis.

## Features

- 117 star systems to explore
- Dynamic economy with price fluctuations
- Memorable NPCs with persistent relationships
- Tactical combat choices
- Ship customization and upgrades
- Multiple paths to victory

## Controls

- Mouse: Navigate starmap, interact with UI
- Keyboard: Shortcuts for common actions
- ESC: Close modals
- D: Dock at current system

## Credits

Built with Three.js
Star data based on real astronomical data
```

---

## Testing & QA

### Test Coverage

**Core Systems:**

- [ ] Trading (buy/sell, prices, capacity)
- [ ] Navigation (jumps, fuel, distance)
- [ ] Ship condition (degradation, repairs)
- [ ] Save/load (persistence, migration)

**NPCs & Events:**

- [ ] Dialogue trees
- [ ] Reputation system
- [ ] Event triggers
- [ ] Mission flow

**Combat & Danger:**

- [ ] Pirate encounters
- [ ] Inspections
- [ ] Mechanical failures
- [ ] Distress calls

**Endgame:**

- [ ] Tanaka sequence
- [ ] Victory conditions
- [ ] Pavonis Run
- [ ] Epilogue generation

### Browser Testing

Test on:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Playtesting

**Target Metrics:**

- 30% completion rate
- 20+ minute average session
- 60% return rate
- 3+ NPCs at Friendly average

---

## Launch Checklist

- [ ] All 7 previous specs implemented
- [ ] Balance tuned and tested
- [ ] 15+ NPCs with dialogue
- [ ] 50+ events implemented
- [ ] UI polished and consistent
- [ ] Accessibility features working
- [ ] Performance targets met
- [ ] Cross-browser tested
- [ ] README written
- [ ] Deployed to static host
- [ ] Playtest feedback incorporated

---

## Post-Launch

### Potential Enhancements

**Content:**

- Additional NPC storylines
- More mission types
- Seasonal events
- Hidden achievements

**Features:**

- Statistics dashboard
- Route optimizer
- Trading calculator
- Lore codex

**Quality of Life:**

- More keyboard shortcuts
- Customizable UI
- Color themes
- Sound effects (optional)

---

## Success Criteria

The game is:

1. Fully playable from start to finish
2. Balanced and fair
3. Accessible to diverse players
4. Performant across browsers
5. Deployed and publicly available
6. Fun and engaging

**The End**
