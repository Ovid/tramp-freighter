# Tramp Freighter Blues - Spec 02: Dynamic Economy

**Foundation:** Spec 01 (Core Loop)  
**Status:** Ready for Development  
**Dependencies:** Spec 01 must be complete

---

## Overview

Transform the fixed-price trading system into a living economy with price fluctuations, price discovery, economic events, and information trading.

## Goals

- Dynamic prices that change daily
- Price discovery (only see prices you've observed)
- Economic events that affect markets
- Information brokers and market intel
- Ship condition system (hull, engine, life support)
- Repairs and maintenance costs

## Out of Scope

- NPCs with personalities (generic traders only)
- Combat and danger
- Narrative events
- Missions and quests

---

## Price System

### Base Prices with Modifiers

```javascript
function calculatePrice(good, system, gameState) {
  const basePrice = GOODS[good].basePrice;
  
  // Production modifier (spectral class)
  const spectralClass = system.type[0];
  const productionMod = PRICE_MODIFIERS[spectralClass]?.[good] || 1.0;
  
  // Station count modifier (more stations = more demand)
  const stationMod = 1.0 + (system.st * 0.05);
  
  // Daily fluctuation (±15% random walk)
  const dailyMod = getDailyFluctuation(system.id, good, gameState.player.daysElapsed);
  
  // Event modifier (temporary)
  const eventMod = getEventModifier(system.id, good, gameState);
  
  let price = basePrice * productionMod * stationMod * dailyMod * eventMod;
  return Math.round(price);
}
```

### Daily Fluctuation

```javascript
// Persistent random walk per system/good
function getDailyFluctuation(systemId, good, currentDay) {
  const seed = `${systemId}_${good}_${currentDay}`;
  const rng = seededRandom(seed);
  
  // ±15% from baseline
  return 0.85 + (rng() * 0.3);
}

// Simple seeded RNG
function seededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return function() {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}
```

---

## Price Discovery

### Knowledge System

```javascript
gameState.world.priceKnowledge = {
  0: {  // Sol
    lastVisit: 5,  // Days ago
    prices: {
      grain: 24,
      ore: 25,
      tritium: 45
      // ... etc
    }
  },
  4: {  // Barnard's Star
    lastVisit: 0,  // Currently here
    prices: { /* ... */ }
  }
  // Systems never visited have no entry
};
```

### Trade Interface Updates

```
┌─────────────────────────────────────────────────────────┐
│  TRADE — Barnard's Star                Credits: 1,240   │
├────────────────────┬────────────────────────────────────┤
│  STATION GOODS     │  YOUR CARGO                        │
├────────────────────┼────────────────────────────────────┤
│  Grain       ₡45   │  Grain (20)      bought @ ₡24      │
│  Ore         ₡18   │                  [Sol, 5 days ago] │
│  Tritium     ₡38   │                                    │
│  Parts       ₡195  │                                    │
│  Medicine    ₡245  │  ─────────────────                 │
│  Electronics ₡310  │  Capacity: 20/50                   │
├────────────────────┴────────────────────────────────────┤
│  Selected: Grain                                         │
│  Station: ₡45  |  You paid: ₡24  |  Profit: ₡21 (+87%)  │
│                                                          │
│  [SELL 1] [SELL 10] [SELL ALL]                          │
└─────────────────────────────────────────────────────────┘
```

Show where/when cargo was purchased for player reference.

---

## Economic Events

### Event Types

```javascript
const ECONOMIC_EVENTS = {
  mining_strike: {
    name: "Mining Strike",
    description: "Workers demand better conditions",
    duration: [5, 10],  // Days
    effects: {
      ore: 1.5,
      tritium: 1.3
    },
    targetSystems: ["mining"],  // Systems with ore production
    chance: 0.05  // 5% per day per eligible system
  },
  
  medical_emergency: {
    name: "Medical Emergency",
    description: "Outbreak requires urgent supplies",
    duration: [3, 5],
    effects: {
      medicine: 2.0,
      grain: 0.9,
      ore: 0.9
    },
    targetSystems: ["any"],
    chance: 0.03
  },
  
  festival: {
    name: "Cultural Festival",
    description: "Celebration drives luxury demand",
    duration: [2, 4],
    effects: {
      electronics: 1.75,
      grain: 1.2
    },
    targetSystems: ["core"],  // Sol Sphere systems
    chance: 0.04
  },
  
  supply_glut: {
    name: "Supply Glut",
    description: "Oversupply crashes prices",
    duration: [3, 7],
    effects: {
      // Random good at -40%
    },
    targetSystems: ["any"],
    chance: 0.06
  }
};
```

### Event Management

```javascript
gameState.world.activeEvents = [
  {
    id: "mining_strike_wolf359",
    type: "mining_strike",
    systemId: 2,  // Wolf 359
    startDay: 10,
    endDay: 17,
    effects: { ore: 1.5, tritium: 1.3 }
  }
];

function updateEvents(currentDay) {
  // Remove expired events
  gameState.world.activeEvents = gameState.world.activeEvents.filter(
    e => e.endDay >= currentDay
  );
  
  // Check for new events
  STAR_DATA.forEach(system => {
    Object.entries(ECONOMIC_EVENTS).forEach(([key, event]) => {
      if (Math.random() < event.chance) {
        if (isEligibleForEvent(system, event)) {
          createEvent(key, system, currentDay);
        }
      }
    });
  });
}
```

### Event Notifications

When docking at a station with an active event:

```
┌─────────────────────────────────────────────────────────┐
│  WOLF 359 STATION                                       │
│                                                         │
│  ⚠ MINING STRIKE IN PROGRESS                            │
│                                                         │
│  Workers have walked off the job demanding better pay.  │
│  Ore and Tritium prices are significantly elevated.     │
│                                                         │
│  Expected duration: 7 more days                         │
│                                                         │
│  [CONTINUE TO STATION]                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Information Trading

### Market Intel

Add to station menu:

```
[INFO BROKER]      Buy market intelligence
```

### Info Broker Interface

```
┌─────────────────────────────────────────────────────────┐
│  INFORMATION BROKER — Sol Station      Credits: 1,240   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  "Looking for an edge? I've got the latest prices."    │
│                                                         │
│  [Barnard's Star Prices]     ₡50   (visited 5 days ago)│
│  [Sirius A Prices]           ₡100  (never visited)     │
│  [Wolf 359 Prices]           ₡75   (visited 12 days ago)│
│                                                         │
│  [Market Rumors]             ₡25   (random tip)        │
│                                                         │
│  [BACK]                                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Prices for intel:
- Recently visited system: ₡50
- Never visited system: ₡100
- Long-ago visited: ₡75
- Random rumor: ₡25

Rumors provide hints like:
- "Ore is cheap at Wolf 359 right now"
- "Medical emergency at Ross 154 — medicine prices through the roof"
- "Avoid Sirius A, everything's expensive there"

---

## Ship Condition System

### Extended Ship State

```javascript
gameState.ship = {
  name: "Serendipity",
  fuel: 100,
  hull: 100,
  engine: 100,
  lifeSupport: 100,
  cargoCapacity: 50,
  cargo: []
};
```

### Degradation

```javascript
function applyJumpDegradation() {
  gameState.ship.hull -= 2;  // Space debris
  gameState.ship.engine -= 1;  // Wear and tear
  gameState.ship.lifeSupport -= 0.5 * jumpDays;  // Per day
  
  // Clamp to 0-100
  gameState.ship.hull = Math.max(0, gameState.ship.hull);
  gameState.ship.engine = Math.max(0, gameState.ship.engine);
  gameState.ship.lifeSupport = Math.max(0, gameState.ship.lifeSupport);
}
```

### Condition Effects

```javascript
function getJumpFuelCost(distance) {
  let baseCost = 10 + (distance * 2);
  
  // Engine condition affects efficiency
  if (gameState.ship.engine < 60) {
    baseCost *= 1.2;  // +20% fuel consumption
  }
  
  return Math.round(baseCost);
}

function getJumpTime(distance) {
  let baseTime = Math.max(1, Math.ceil(distance * 0.5));
  
  // Engine condition affects speed
  if (gameState.ship.engine < 60) {
    baseTime += 1;  // Extra day
  }
  
  return baseTime;
}
```

### Warnings

```
⚠ WARNING: Hull integrity at 45%
  Risk of cargo loss during jumps.
  
⚠ WARNING: Engine condition at 28%
  Jump failure risk. Recommend immediate repairs.
  
⚠ WARNING: Life support at 15%
  Critical condition. Seek repairs urgently.
```

---

## Repairs

### Repair Interface

Add to station menu:

```
[REPAIRS]          Restore ship condition
```

### Repair Screen

```
┌─────────────────────────────────────────────────────────┐
│  REPAIRS — Sol Station                 Credits: 1,240   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Hull Integrity:    ████████░░  78%                     │
│  Engine Condition:  ██████████  100%                    │
│  Life Support:      ███████░░░  67%                     │
│                                                         │
│  Repair Cost: ₡5 per 1% restored                        │
│                                                         │
│  [REPAIR HULL 10%]       ₡50                            │
│  [REPAIR HULL TO FULL]   ₡110                           │
│                                                         │
│  [REPAIR ENGINE 10%]     ₡50                            │
│  [REPAIR ENGINE TO FULL] ₡0 (already full)              │
│                                                         │
│  [REPAIR LIFE SUPPORT 10%]    ₡50                       │
│  [REPAIR LIFE SUPPORT TO FULL] ₡165                     │
│                                                         │
│  [REPAIR ALL TO FULL]    ₡275                           │
│                                                         │
│  [BACK]                                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Updated HUD

```html
<div id="ship-status">
  <div class="stat-bar">
    <span class="label">Fuel</span>
    <div class="bar">
      <div class="fill fuel" style="width: 65%"></div>
    </div>
    <span class="value">65%</span>
  </div>
  
  <div class="stat-bar">
    <span class="label">Hull</span>
    <div class="bar">
      <div class="fill hull" style="width: 78%"></div>
    </div>
    <span class="value">78%</span>
  </div>
  
  <div class="stat-bar">
    <span class="label">Engine</span>
    <div class="bar">
      <div class="fill engine" style="width: 84%"></div>
    </div>
    <span class="value">84%</span>
  </div>
  
  <div class="stat-bar">
    <span class="label">Life Support</span>
    <div class="bar">
      <div class="fill life-support" style="width: 91%"></div>
    </div>
    <span class="value">91%</span>
  </div>
</div>
```

---

## Testing Checklist

- [ ] Prices change daily
- [ ] Prices are consistent (same seed = same price)
- [ ] Price discovery works (only see visited systems)
- [ ] Economic events trigger randomly
- [ ] Events affect prices correctly
- [ ] Event notifications appear when docking
- [ ] Info broker sells accurate price data
- [ ] Market rumors provide useful hints
- [ ] Ship condition degrades on jumps
- [ ] Low engine condition increases fuel cost and time
- [ ] Hull/life support warnings appear
- [ ] Repairs restore condition correctly
- [ ] Repair costs are accurate
- [ ] HUD shows all four condition bars

---

## Success Criteria

Player can:
1. Observe price changes over time
2. Make informed trading decisions based on price history
3. Purchase market intelligence
4. React to economic events for profit
5. Maintain ship condition through repairs
6. See consequences of neglecting maintenance

**Next Spec:** Ship quirks, upgrades, and cargo expansion
