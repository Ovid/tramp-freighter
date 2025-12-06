# Product Requirements Document: Tramp Freighter Blues

**Product Owner:** Ovid  
**Date:** December 4, 2025  
**Status:** Draft v1.0  
**Foundation:** Sol Sector Starmap Visualization v1.1

---

## 1. Executive Summary

**Tramp Freighter Blues** is a single-player space trading survival game built on top of the existing Sol Sector Starmap. Players take on the role of an independent freighter captain working to pay off debt, build relationships across the sector, and ultimately reach the distant colony at **Delta Pavonis** — a star system 27.88 light-years from Sol with no wormhole connections to the main network.

The game emphasizes character-driven narrative, financial tension, and the feeling of being part of distinct human communities scattered across the stars. The tone is **scrappy but hopeful** — players struggle, but the universe rewards persistence and good relationships.

---

## 2. Design Pillars

### 2.1 "You Know These People"
Every station should feel inhabited by memorable individuals, not abstract markets. Players build relationships with recurring characters who remember past interactions, offer help when times are hard, and have their own problems the player can choose to engage with.

### 2.2 "Every Credit Counts"
Financial pressure creates meaningful decisions. Players should regularly face choices between safe-but-slow and risky-but-lucrative options. Debt is ever-present but never insurmountable.

### 2.3 "Your Ship, Your Story"
The player's ship has character — quirks, history, and personality. Upgrades are choices with tradeoffs, not pure progression. The ship is a character in its own right.

### 2.4 "The Universe Doesn't Wait"
Time passes. Prices change. NPCs pursue their own goals. The sector feels alive even when the player isn't looking.

---

## 3. Win Condition: The Pavonis Run

### 3.1 Narrative Frame

The player begins with a specific motivation: reaching **Delta Pavonis**, where [player-chosen reason: family member, promised land, fresh start, old debt to repay] awaits. Delta Pavonis is 27.88 light-years from Sol — the farthest inhabited system in the sector — and has no wormhole connections. Reaching it requires extraordinary preparation.

### 3.2 Victory Requirements

To complete The Pavonis Run, players must:

| Requirement | Target | Purpose |
|-------------|--------|---------|
| Pay off starting debt | 0 credits owed | Financial freedom |
| Accumulate savings | 25,000 credits | Range Extender cost |
| Engineer reputation | "Trusted" with Yuki Tanaka | Installation access |
| Complete questline | "The Tanaka Sequence" (5 missions) | Unlock the technology |
| Ship condition | Hull ≥80%, Engine ≥90% | Survive the jump |

### 3.3 The Final Jump

When all requirements are met, players can initiate The Pavonis Run from Barnard's Star (Tanaka's home station). This triggers:

1. A point-of-no-return confirmation
2. A final "preparation check" event with last-chance supply purchases
3. The jump itself — a narrative sequence, not gameplay
4. An **epilogue** determined by player choices throughout the game

### 3.4 Epilogue Variables

The ending text reflects:
- Total NPCs at "Trusted" or higher reputation
- Whether the player engaged in smuggling
- Key moral choices made during events
- Financial generosity (loans forgiven, charity given)
- The fate of NPCs the player helped or ignored

---

## 4. Core Systems

### 4.1 Time & Sessions

#### 4.1.1 Game Time
- Time advances in **days**
- Each **jump** between systems takes 1-3 days (based on distance)
- **Docking** at a station advances time by 4-8 hours (variable by activity)
- Players can **wait** at a station (to see price changes or wait for events)

#### 4.1.2 Session Flexibility
The game supports any session length through:
- **Auto-save** after every significant action
- **Quick Trade** mode: dock → buy/sell → undock in under 2 minutes
- **Deep Engagement** mode: explore station, talk to NPCs, take missions
- No time pressure within a station — only jump decisions have urgency

### 4.2 Navigation & Distance

#### 4.2.1 Distance Calculation

All distances calculated from coordinate data using:

```javascript
function getDistanceLY(star) {
  // Coordinates stored as deci-light-years
  const distanceRaw = Math.sqrt(star.x ** 2 + star.y ** 2 + star.z ** 2);
  return distanceRaw / 10; // Returns light-years
}

function getDistanceBetween(star1, star2) {
  const dx = star1.x - star2.x;
  const dy = star1.y - star2.y;
  const dz = star1.z - star2.z;
  return Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2) / 10;
}
```

#### 4.2.2 Display Format
- Always show distance in light-years with 2 decimal places
- Show both "distance from Sol" and "distance from current location"
- Jump time = ceil(distance × 0.5) days (minimum 1 day)

#### 4.2.3 Wormhole Travel
- Players can only travel via established wormhole connections
- The existing `WORMHOLE_DATA` defines all valid routes
- Unreachable systems (`r: 0`) have no wormhole connections
- The Range Extender (endgame upgrade) allows one-way jumps to unwormholed systems

### 4.3 Economy

#### 4.3.1 Goods Categories

| Category | Examples | Volatility | Margin | Risk |
|----------|----------|------------|--------|------|
| **Bulk Commodities** | Ore, Water, Grain | Low | 5-15% | None |
| **Manufactured Goods** | Electronics, Parts, Medicine | Medium | 10-25% | None |
| **Luxury Items** | Art, Spirits, Exotics | High | 20-50% | Low |
| **Restricted Goods** | Weapons, Stimulants, Data | Very High | 40-100% | High |

#### 4.3.2 Price Determination

Base prices are set per-system based on:
- **Spectral class** (determines production capability)
- **Station count** (determines demand)
- **Cultural profile** (determines preferences)

```javascript
function calculatePrice(good, system, basePrice) {
  let price = basePrice;
  
  // Production modifier (systems that make it sell cheaper)
  price *= system.productionModifiers[good.category] || 1.0;
  
  // Demand modifier (based on station count and culture)
  price *= system.demandModifiers[good.category] || 1.0;
  
  // Daily fluctuation (±15% random walk)
  price *= system.dailyFluctuation[good.id] || 1.0;
  
  // Event modifiers (temporary)
  price *= getEventModifier(system, good) || 1.0;
  
  return Math.round(price);
}
```

#### 4.3.3 Price Discovery

Players only know prices they've personally observed:
- **Current system:** Full price visibility while docked
- **Previously visited:** Last known prices (with timestamp showing age)
- **Never visited:** No price information

**Information sources:**
- **Dock workers:** Free hints about local market ("Tritium's cheap right now")
- **Information brokers:** Paid intel on remote systems (accuracy varies)
- **Trusted NPCs:** Free tips on good routes ("Don't sell medicine here, take it to Ross 128")

#### 4.3.4 Economic Events

Random events affect prices temporarily:

| Event | Effect | Duration |
|-------|--------|----------|
| Mining Strike | Ore +50% at affected system | 5-10 days |
| Medical Emergency | Medicine +100%, all else -10% | 3-5 days |
| Festival | Luxury +75%, vice goods +50% | 2-4 days |
| Trade Embargo | Restricted goods +200% but extra danger | 7-14 days |
| Supply Glut | Random commodity -40% | 3-7 days |

### 4.4 Ship Systems

#### 4.4.1 Core Stats

| Stat | Range | Effect of Low Values |
|------|-------|---------------------|
| **Fuel** | 0-100% | Cannot jump at 0%; efficiency drops below 20% |
| **Hull Integrity** | 0-100% | Cargo loss risk below 50%; destruction at 0% |
| **Engine Condition** | 0-100% | Jump time increases below 60%; failure risk below 30% |
| **Life Support** | 0-100% | Event penalties below 50%; game over at 0% |

#### 4.4.2 Degradation

- **Fuel:** Consumed per jump (base 10% + 2% per light-year)
- **Hull:** -2% per jump (space debris), -5% to -20% from combat/events
- **Engine:** -1% per jump, -5% per emergency maneuver
- **Life Support:** -0.5% per day, -2% per jump

#### 4.4.3 Ship Quirks

Each ship has 2-3 randomly assigned **quirks** that create personality:

| Quirk | Effect |
|-------|--------|
| **Sticky Cargo Seal** | +10% loading time, but -5% theft risk |
| **Hot Thruster** | -5% fuel efficiency, but +10% escape chance |
| **Sensitive Sensors** | +15% salvage detection, but +10% false alarms |
| **Cramped Quarters** | -1 max crew, but -10% life support drain |
| **Lucky Ship** | 5% chance to negate any negative event |
| **Fuel Sipper** | -15% fuel consumption |
| **Leaky Seals** | +1% hull degradation per jump |
| **Smooth Talker's Ride** | +5% to all NPC relationship gains |

Quirks are permanent and cannot be removed — only worked around.

#### 4.4.4 Upgrades

| Upgrade | Cost | Effect | Tradeoff |
|---------|------|--------|----------|
| **Extended Tank** | 3,000 | +50% fuel capacity | +5% hull damage from combat |
| **Reinforced Hull** | 5,000 | -50% hull degradation | -10% cargo capacity |
| **Efficient Drive** | 4,000 | -20% fuel consumption | -5% escape chance |
| **Expanded Hold** | 6,000 | +50% cargo capacity | -10% maneuverability |
| **Smuggler's Panels** | 4,500 | Hidden cargo (10 units) | Reputation loss if discovered |
| **Advanced Sensors** | 3,500 | See events one jump ahead | None |
| **Medical Bay** | 2,500 | Slower life support drain | -5% cargo capacity |
| **Range Extender** | 25,000 | Jump to unwormholed systems | One-way only, requires Tanaka |

### 4.5 Finances

#### 4.5.1 Starting Conditions

| Asset/Liability | Amount |
|-----------------|--------|
| Starting credits | 500 |
| Starting debt | 10,000 |
| Ship value | 15,000 (not sellable) |
| Starting cargo | 20 units Grain (worth ~400) |

#### 4.5.2 Debt System

- **Grace period:** 30 days (no interest)
- **Interest rate:** 2% per week after grace period
- **Minimum payment:** None required, but reputation suffers if debt grows
- **Loan shark escalation:** At 15,000+ debt, "collection events" begin

#### 4.5.3 Recurring Costs

| Expense | Cost | Frequency |
|---------|------|-----------|
| Docking fee | 10-50 (varies by station) | Per dock |
| Fuel (full tank) | 100-300 (varies by system) | As needed |
| Basic repairs | 5 per 1% restored | As needed |
| Life support restock | 50 per 10% | As needed |
| Loan interest | 2% of principal | Weekly |

---

## 5. Danger Systems

### 5.1 Threat Types

#### 5.1.1 Pirates

Pirates operate in specific zones (determined by wormhole connection patterns):

**Pirate Hotspots:**
- Routes between factions (contested space)
- Approaches to wealthy systems (Sirius, Procyon, Epsilon Eridani)
- Remote systems with low station counts

**Encounter Chance:**
- Safe routes: 5% per jump
- Contested routes: 15-25% per jump
- Dangerous routes: 30-40% per jump

#### 5.1.2 Inspections

Customs inspections occur when carrying restricted goods:
- **Core systems (Sol, Alpha Centauri):** 40% inspection chance
- **Mid-range systems:** 15% inspection chance
- **Frontier systems:** 5% inspection chance

#### 5.1.3 Mechanical Failures

Random failures based on ship condition:
- **Hull < 50%:** 10% chance of cargo breach per jump
- **Engine < 30%:** 15% chance of jump failure (stranded event)
- **Life Support < 30%:** 5% chance of emergency per day

#### 5.1.4 Distress Calls

Random events that present moral/tactical choices:
- Appear on 10% of jumps
- Player can respond, ignore, or (sometimes) exploit

### 5.2 Tactical Combat

When pirates attack or inspections go wrong, players enter a **tactical choice** system (not real-time combat).

#### 5.2.1 Combat Phases

**Phase 1: Detection**
- Pirates announce intentions
- Player sees: enemy strength, own ship status, cargo at risk
- Choice: **Fight**, **Flee**, **Negotiate**, **Surrender**

**Phase 2: Resolution** (if Fight or Flee)

Combat resolves through a series of choices:

```
PIRATE ATTACK - "Red Claw" Corsair
Enemy Strength: ████████░░ (Strong)
Your Hull: 67%  |  Engine: 84%  |  Fuel: 45%

The corsair locks weapons. Your sensors show two more 
ships emerging from the asteroid shadow.

[1] Evasive maneuvers (Engine check - 70% success)
    Success: Escape, -15% fuel, -5% engine
    Failure: Take hit (-20% hull), continue fight

[2] Return fire (Combat check - 45% success)  
    Success: Drive off attacker, -10% hull
    Failure: Heavy damage (-30% hull), they board

[3] Dump cargo and run (Guaranteed escape)
    Lose: 50% of cargo, -10% fuel
    Gain: Safe escape

[4] Broadcast distress signal
    30% chance: Patrol responds, pirates flee
    70% chance: No response, pirates attack (+10% damage)
```

#### 5.2.2 Combat Modifiers

| Factor | Modifier |
|--------|----------|
| Engine condition > 80% | +15% to Flee attempts |
| Hull condition > 70% | +10% to Fight attempts |
| "Hot Thruster" quirk | +10% to all escape rolls |
| Upgraded weapons (future) | +20% to Fight attempts |
| Faction reputation (if in their space) | +5% patrol response |
| Smuggler's Panels (if hidden cargo) | Can "surrender" partial cargo |

#### 5.2.3 Negotiation

If player chooses **Negotiate**:

```
The corsair captain's face fills your screen. 
Scarred. Tired. Not unlike you.

"Twenty percent of your cargo and you fly free. 
 Counter-offer?"

[1] "Ten percent. That's fair."
    Charisma check (60% base + NPC modifiers)
    Success: Pay 10%, leave peacefully
    Failure: They attack, +10% enemy strength (insulted)

[2] "I'm carrying medicine for Ross 154. Children are dying."
    Only available if carrying medicine
    Morality check (based on pirate's character)
    40% chance: They let you pass free
    60% chance: "Not my problem." Standard demand.

[3] "I know where there's a fatter target."
    Requires: Intel about another ship
    Success: Pirates leave, you lose reputation if discovered
    Failure: They don't believe you, attack

[4] Accept the twenty percent.
    Pay 20% cargo, leave peacefully.
```

### 5.3 Consequences

| Outcome | Immediate Effect | Long-term Effect |
|---------|------------------|------------------|
| Win fight | Minor hull damage | +Reputation in system, possible salvage |
| Escape | Fuel/engine loss | None |
| Surrender cargo | Lose goods | None (unless pattern develops) |
| Ship destroyed | **Game Over** — restart or load save | N/A |
| Caught smuggling | Goods confiscated, fine, reputation loss | Faction standing drops |

---

## 6. Civilization & Culture

### 6.1 Cultural Regions

The sector is divided into cultural regions based on stellar geography and history:

#### 6.1.1 The Sol Sphere
**Systems:** Sol, Barnard's Star, Wolf 359, Lalande 21185, Ross 128  
**Character:** Bureaucratic, regulated, safe. The "old money" of the sector.  
**Economy:** High taxes, stable prices, expensive docking, excellent facilities.  
**Attitude:** Polite but impersonal. Rules matter more than relationships.  
**Unique goods:** Luxury items, high-end electronics, legal pharmaceuticals.

#### 6.1.2 The Centauri Cluster  
**Systems:** Alpha Centauri A, Proxima Centauri, Ross 154, Epsilon Indi  
**Character:** Pioneer spirit, independent, tight-knit communities.  
**Economy:** Moderate prices, emphasis on practical goods.  
**Attitude:** Warm to those who prove themselves, cold to outsiders.  
**Unique goods:** Agricultural products, terraforming equipment.

#### 6.1.3 The Sirius Compact
**Systems:** Sirius A, Procyon A, Luyten's Star, G51-15  
**Character:** Wealthy, cosmopolitan, status-conscious. Financial hub.  
**Economy:** Volatile markets, high margins, expensive everything.  
**Attitude:** Transactional. Everyone's working an angle.  
**Unique goods:** Financial instruments, art, exotic luxuries.

#### 6.1.4 The Eridani Federation
**Systems:** Epsilon Eridani, Tau Ceti, L 726-8 A, Lacaille 9352  
**Character:** Industrial, pragmatic, union-oriented.  
**Economy:** Strong manufacturing, bulk goods, steady prices.  
**Attitude:** Respect for hard work. Distrust of flash and promises.  
**Unique goods:** Ship parts, industrial equipment, refined metals.

#### 6.1.5 The Outer Reach
**Systems:** All systems beyond 15 LY from Sol  
**Character:** Frontier, lawless, opportunity-rich.  
**Economy:** Wild price swings, rare goods, minimal infrastructure.  
**Attitude:** Mind your own business. Help is remembered; betrayal is fatal.  
**Unique goods:** Exotic materials, salvage, restricted items.

### 6.2 Station Character

Each station (derived from the `st` count in star data) has a generated personality:

```javascript
const STATION_TEMPLATES = {
  mining: {
    namePatterns: ["[Star] Deep", "[Star] Pit", "Bore Station [N]"],
    atmosphere: "industrial",
    commonNPCs: ["shift_boss", "equipment_dealer", "company_rep"],
    goodsBonus: { ore: 0.7, equipment: 1.2 },
    dockingFee: "low"
  },
  trading: {
    namePatterns: ["[Star] Exchange", "Port [Name]", "[Name]'s Landing"],
    atmosphere: "bustling", 
    commonNPCs: ["broker", "merchant", "customs_officer"],
    goodsBonus: { all: 1.0 }, // neutral
    dockingFee: "medium"
  },
  // ... additional templates
};
```

### 6.3 NPCs

#### 6.3.1 NPC Structure

```javascript
const NPC_SCHEMA = {
  id: "chen_barnards",
  name: "Wei Chen",
  role: "Dock Worker",
  system: 4, // Barnard's Star
  station: "Bore Station 7",
  
  personality: {
    trust: 0.3,      // How quickly they warm up
    greed: 0.2,      // How much money motivates them
    loyalty: 0.8,    // How much they value relationships
    morality: 0.6    // How they react to ethical dilemmas
  },
  
  relationships: {
    player: 0,       // -100 to +100
    factions: { sol_sphere: 10, outer_reach: 40 }
  },
  
  dialogue: {
    greeting: ["chen_greeting_neutral", "chen_greeting_friendly", "chen_greeting_hostile"],
    tips: ["chen_tip_market", "chen_tip_danger"],
    missions: ["chen_mission_1", "chen_mission_2"],
    personal: ["chen_backstory_1", "chen_backstory_2"]
  },
  
  schedule: {
    available: [6, 22],  // Hours when present
    dayOff: 0            // Sunday
  },
  
  memory: {
    interactions: 0,
    lastSeen: null,
    questState: {},
    flags: []
  }
};
```

#### 6.3.2 Key NPCs

| NPC | Location | Role | Arc |
|-----|----------|------|-----|
| **Yuki Tanaka** | Barnard's Star | Engineer | The gateway to endgame; has her own reasons to reach Pavonis |
| **Marcus Cole** | Sol | Loan Shark | Starts as antagonist, potential ally if debt paid honestly |
| **"Whisper"** | Sirius A | Info Broker | Network hub; knows everyone's secrets including yours |
| **Father Okonkwo** | Ross 154 | Chaplain/Medic | Moral compass; offers no-interest loans with moral strings |
| **Captain Vasquez** | Epsilon Eridani | Retired Trader | Mentor figure; provides tips and old route maps |
| **Mei-Lin Park** | L 789-6 A | Smuggler Queen | High-risk, high-reward missions; tests player's ethics |

#### 6.3.3 Relationship Tiers

| Tier | Threshold | Benefits |
|------|-----------|----------|
| Hostile | -50 to -100 | Refuses service, may report you, tips off enemies |
| Cold | -49 to -10 | Minimal interaction, no tips, high prices |
| Neutral | -9 to +9 | Standard service, generic dialogue |
| Warm | +10 to +29 | Occasional tips, small discounts, side missions |
| Friendly | +30 to +59 | Regular tips, 10% discount, personal missions |
| Trusted | +60 to +89 | Free repairs (minor), safe harbor, major missions |
| Family | +90 to +100 | Will take risks for you, unique content, ending impacts |

---

## 7. Content Architecture

### 7.1 Event System

All narrative content is data-driven for easy authoring:

```javascript
// events/dock_events.js
const DOCK_EVENTS = {
  "dock_barnards_first": {
    id: "dock_barnards_first",
    type: "dock",
    
    // Trigger conditions
    trigger: {
      system: 4,
      condition: "first_visit"
    },
    
    // Prevent re-triggering
    once: true,
    
    // Content
    content: {
      text: [
        "The docking clamps engage with a shudder that travels through your boots.",
        "Barnard's Station is smaller than you expected — a retrofitted mining platform, all exposed conduit and hand-painted signs.",
        "A dock worker waves you toward Bay 3. Her jumpsuit says 'CHEN' in faded stencil."
      ],
      
      speaker: null, // Narration
      mood: "neutral",
      
      choices: [
        {
          text: "Wave back and head to the trading post.",
          next: null,
          effects: []
        },
        {
          text: "Stop to introduce yourself.",
          next: "meet_chen",
          effects: [
            { type: "npc_rep", target: "chen_barnards", value: 1 }
          ]
        },
        {
          text: "Ignore her and check your cargo manifest.",
          next: null,
          effects: [
            { type: "npc_rep", target: "chen_barnards", value: -1 }
          ]
        }
      ]
    }
  }
};
```

### 7.2 Event Types

| Type | Trigger | Example |
|------|---------|---------|
| `dock` | Arriving at a station | First visit narration, NPC encounters |
| `undock` | Leaving a station | Warnings, last-minute offers |
| `jump` | During wormhole transit | Distress calls, pirate attacks, anomalies |
| `market` | Opening trade interface | Tips from NPCs, price rumors |
| `time` | Days elapsed | Debt reminders, story beats |
| `condition` | Ship/player state | Low fuel warnings, hull breach |
| `npc` | Talking to specific NPC | Dialogue trees, missions |
| `mission` | Mission state changes | Briefings, completions |

### 7.3 Effect Types

```javascript
const EFFECT_TYPES = {
  // Resource changes
  "credits": { target: "player", field: "credits", operation: "add" },
  "debt": { target: "player", field: "debt", operation: "add" },
  "fuel": { target: "ship", field: "fuel", operation: "add" },
  "hull": { target: "ship", field: "hull", operation: "add" },
  "cargo_add": { target: "ship", field: "cargo", operation: "push" },
  "cargo_remove": { target: "ship", field: "cargo", operation: "filter" },
  
  // Relationship changes
  "npc_rep": { target: "npc", field: "relationships.player", operation: "add" },
  "faction_rep": { target: "faction", field: "reputation", operation: "add" },
  
  // State flags
  "set_flag": { target: "world", field: "flags", operation: "set" },
  "clear_flag": { target: "world", field: "flags", operation: "clear" },
  
  // Mission management
  "start_mission": { target: "missions", operation: "add" },
  "complete_mission": { target: "missions", operation: "complete" },
  "fail_mission": { target: "missions", operation: "fail" },
  
  // Information
  "reveal_price": { target: "intel", field: "prices", operation: "set" },
  "reveal_event": { target: "intel", field: "events", operation: "set" },
  
  // Unlocks
  "unlock_system": { target: "world", field: "unlockedSystems", operation: "push" },
  "unlock_upgrade": { target: "shop", field: "availableUpgrades", operation: "push" }
};
```

### 7.4 Content File Structure

```
/content
  /events
    dock_events.js       # Station arrival events
    jump_events.js       # Transit events (pirates, distress, etc.)
    market_events.js     # Trading-related events
    time_events.js       # Calendar-triggered events
    random_events.js     # Miscellaneous random events
  /npcs
    sol_sphere.js        # NPCs in Sol Sphere region
    centauri_cluster.js  # NPCs in Centauri Cluster
    sirius_compact.js    # NPCs in Sirius Compact
    eridani_federation.js
    outer_reach.js
  /missions
    main_quest.js        # The Tanaka Sequence
    side_quests.js       # Optional missions
    repeatable.js        # Cargo runs, deliveries, etc.
  /dialogue
    generic.js           # Fallback dialogue
    relationship.js      # Tier-based dialogue variations
```

### 7.5 Writing Guidelines

**Tone:** Scrappy but hopeful. Characters are worn down but not defeated.

**Length:** 
- Event text: 2-4 short paragraphs
- Dialogue: 1-3 sentences per NPC line
- Choice text: Under 10 words

**Voice:**
- Second person ("You see...", "Your ship...")
- Present tense for action, past tense for backstory
- Concrete details over abstract description
- Characters speak in distinct voices (Tanaka: precise, technical; Chen: casual, warm)

**Example good text:**
> The cargo seal sticks — it always sticks — and you spend ten minutes in the cold of the docking bay, cursing and yanking, before the crate finally slides free. Chen watches from the loading dock, not offering help, just watching. When you finally get it loose, she nods once. "Tanaka drive," she says. "Had one like her. Long time ago."

**Example bad text:**
> You arrive at the docking bay and begin the process of unloading your cargo. A dock worker named Chen observes your activities with apparent interest. She mentions that she has previous experience with ships similar to yours.

---

## 8. Persistence & Save System

### 8.1 Save Game Schema

```javascript
const SAVE_VERSION = 1;

const SaveGame = {
  meta: {
    version: SAVE_VERSION,
    timestamp: "2025-12-04T10:30:00Z",
    playtime: 7200,           // Seconds
    saveSlot: 1
  },
  
  player: {
    name: "Captain",          // Player-chosen or default
    credits: 2340,
    debt: 8500,
    startDate: "2187-03-15",  // In-game date
    currentDate: "2187-04-08"
  },
  
  ship: {
    name: "Serendipity",
    fuel: 65,
    hull: 78,
    engine: 84,
    lifeSupport: 91,
    cargoCapacity: 50,
    cargo: [
      { good: "tritium", qty: 12, buyPrice: 45, buySystem: 0, buyDate: "2187-04-06" },
      { good: "medicine", qty: 3, buyPrice: 210, buySystem: 4, buyDate: "2187-04-07" }
    ],
    upgrades: ["extended_tank"],
    quirks: ["sticky_seal", "hot_thruster"],
    hiddenCargo: []           // If smuggler panels installed
  },
  
  world: {
    currentSystem: 4,
    visitedSystems: {
      0: { firstVisit: "2187-03-15", lastVisit: "2187-04-05", visits: 3 },
      4: { firstVisit: "2187-04-07", lastVisit: "2187-04-08", visits: 1 }
    },
    priceSnapshots: {
      0: { date: "2187-04-05", prices: { tritium: 50, medicine: 180, ore: 30 } },
      4: { date: "2187-04-08", prices: { tritium: 40, medicine: 250, ore: 25 } }
    },
    activeEvents: [
      { id: "mining_strike_wolf359", startDate: "2187-04-06", endDate: "2187-04-14" }
    ],
    flags: ["chen_intro_done", "cole_first_warning"]
  },
  
  npcs: {
    "chen_barnards": { rep: 12, lastInteraction: "2187-04-08", flags: ["intro_done", "backstory_heard"] },
    "tanaka_barnards": { rep: 5, lastInteraction: "2187-04-08", flags: [], questState: "not_started" },
    "cole_sol": { rep: -5, lastInteraction: "2187-04-02", flags: ["first_warning"] }
  },
  
  missions: {
    active: [
      { id: "cargo_run_001", type: "delivery", destination: 7, cargo: "medicine", qty: 3, deadline: "2187-04-12", reward: 500 }
    ],
    completed: ["tutorial_first_trade"],
    failed: []
  },
  
  events: {
    fired: ["dock_barnards_first", "meet_chen", "chen_backstory"],
    cooldowns: {
      "random_pirate": "2187-04-10"  // Can't trigger again until this date
    }
  },
  
  stats: {
    jumps: 45,
    trades: 23,
    combatVictories: 2,
    combatEscapes: 3,
    combatSurrenders: 1,
    creditsEarned: 34000,
    creditsSpent: 31660,
    cargoLost: 15,
    npcsAtTrusted: 0,
    smugglingRuns: 0,
    charitableActs: 2
  },
  
  settings: {
    textSpeed: "normal",
    autoSave: true,
    confirmJumps: true
  }
};
```

### 8.2 Storage Implementation

```javascript
const STORAGE_KEY = "trampFreighter_save";
const MAX_SAVE_SLOTS = 3;

const SaveManager = {
  save(slot = 1) {
    const saves = this.getAllSaves();
    saves[slot] = {
      ...currentGameState,
      meta: {
        ...currentGameState.meta,
        timestamp: new Date().toISOString(),
        saveSlot: slot
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  },
  
  load(slot = 1) {
    const saves = this.getAllSaves();
    if (saves[slot]) {
      return this.migrate(saves[slot]);
    }
    return null;
  },
  
  getAllSaves() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  },
  
  delete(slot) {
    const saves = this.getAllSaves();
    delete saves[slot];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  },
  
  reset() {
    if (confirm("Delete ALL save data? This cannot be undone.")) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  },
  
  // Handle save format changes between versions
  migrate(saveData) {
    let data = { ...saveData };
    
    // Example migration from v1 to v2
    if (data.meta.version === 1 && SAVE_VERSION === 2) {
      // Add new fields with defaults
      data.player.reputation = data.player.reputation || {};
      data.meta.version = 2;
    }
    
    return data;
  },
  
  getStorageUsage() {
    const data = localStorage.getItem(STORAGE_KEY) || "";
    return {
      bytes: new Blob([data]).size,
      percentage: (new Blob([data]).size / 5242880 * 100).toFixed(2) // 5MB limit
    };
  }
};
```

### 8.3 Auto-save Triggers

Auto-save fires after:
- Completing a jump
- Completing a trade
- Completing or accepting a mission
- Any NPC conversation
- Entering/exiting combat
- Every 5 minutes of active play

---

## 9. UI Integration

### 9.1 HUD Extensions

The existing HUD panel expands to include game state:

```html
<div id="hud">
  <!-- Existing star info -->
  <div id="star-info">...</div>
  
  <!-- New: Player status bar -->
  <div id="player-status">
    <div class="status-row">
      <span class="label">Credits:</span>
      <span id="hud-credits">2,340</span>
    </div>
    <div class="status-row debt">
      <span class="label">Debt:</span>
      <span id="hud-debt">8,500</span>
    </div>
    <div class="status-row">
      <span class="label">Day:</span>
      <span id="hud-day">23</span>
    </div>
  </div>
  
  <!-- New: Ship status -->
  <div id="ship-status">
    <div class="stat-bar">
      <span class="label">Fuel</span>
      <div class="bar"><div class="fill" id="fuel-bar" style="width: 65%"></div></div>
    </div>
    <div class="stat-bar">
      <span class="label">Hull</span>
      <div class="bar"><div class="fill" id="hull-bar" style="width: 78%"></div></div>
    </div>
    <div class="stat-bar">
      <span class="label">Engine</span>
      <div class="bar"><div class="fill" id="engine-bar" style="width: 84%"></div></div>
    </div>
  </div>
  
  <!-- New: Current cargo summary -->
  <div id="cargo-summary">
    <span class="label">Cargo:</span>
    <span id="hud-cargo">15/50</span>
  </div>
</div>
```

### 9.2 New UI Panels

#### 9.2.1 Station Interface
Appears when docked, replaces/overlays the starmap:

```
┌─────────────────────────────────────────────────────────┐
│  BORE STATION 7 — Barnard's Star                        │
│  Distance from Sol: 5.98 LY                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [TRADE]      [REFUEL]      [REPAIRS]      [MISSIONS]   │
│                                                         │
│  [TALK]       [INFO]        [REST]         [UNDOCK]     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Local News: Mining consortium reports record output... │
└─────────────────────────────────────────────────────────┘
```

#### 9.2.2 Trade Interface

```
┌─────────────────────────────────────────────────────────┐
│  TRADE — Bore Station 7                    Credits: 2,340│
├────────────────────┬────────────────────────────────────┤
│  STATION GOODS     │  YOUR CARGO                        │
├────────────────────┼────────────────────────────────────┤
│  Tritium     ₡40   │  Tritium (12)    bought @ ₡45      │
│  Ore         ₡25   │  Medicine (3)    bought @ ₡210     │
│  Medicine    ₡250  │                                    │
│  Parts       ₡180  │                                    │
│  Grain       ₡35   │  ─────────────────                 │
│  [RESTRICTED]      │  Capacity: 15/50                   │
├────────────────────┴────────────────────────────────────┤
│  Selected: Medicine                                      │
│  Station price: ₡250  |  You paid: ₡210  |  Profit: ₡40 │
│                                                          │
│  [BUY 1] [BUY 5] [BUY MAX]  |  [SELL 1] [SELL ALL]      │
└─────────────────────────────────────────────────────────┘
```

#### 9.2.3 Event/Dialogue Panel

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  The cargo seal sticks — it always sticks — and you     │
│  spend ten minutes in the cold of the docking bay,      │
│  cursing and yanking, before the crate finally slides   │
│  free.                                                  │
│                                                         │
│  Chen watches from the loading dock. When you finally   │
│  get it loose, she nods once.                           │
│                                                         │
│  "Tanaka drive," she says. "Had one like her."          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [1] "You know ships?"                                  │
│  [2] "Thanks. I'm new here — any advice?"               │
│  [3] "Mind your own business."                          │
└─────────────────────────────────────────────────────────┘
```

### 9.3 Starmap Enhancements

Modify the existing starmap to show:
- **Current location:** Bright pulsing indicator
- **Affordable jumps:** Green wormhole lines
- **Too expensive (fuel):** Yellow wormhole lines  
- **Cannot reach:** Red wormhole lines (existing)
- **Distance labels:** Show LY on hover/select
- **Intel indicators:** Icons for known prices, dangers, missions

---

## 10. Game Balance

### 10.1 Economic Curves

**Early Game (Days 1-30):**
- Average profit per run: 50-150 credits
- Typical route: Sol ↔ Barnard's Star (safe, low margin)
- Focus: Learning systems, meeting NPCs, avoiding debt growth

**Mid Game (Days 31-90):**
- Average profit per run: 150-400 credits
- Typical routes: Multi-jump circuits, occasional restricted goods
- Focus: Building relationships, ship upgrades, debt reduction

**Late Game (Days 91+):**
- Average profit per run: 400-1000 credits
- Typical routes: Long-haul to Outer Reach, mission-based income
- Focus: Tanaka questline, final savings push

### 10.2 Difficulty Tuning

| Parameter | Easy | Normal | Hard |
|-----------|------|--------|------|
| Starting debt | 5,000 | 10,000 | 15,000 |
| Interest rate | 1%/week | 2%/week | 3%/week |
| Pirate frequency | 50% of normal | Normal | 150% of normal |
| Price volatility | ±10% | ±15% | ±25% |
| Ship degradation | 50% of normal | Normal | 150% of normal |
| NPC relationship gain | 150% | Normal | 75% |

### 10.3 Anti-Frustration Features

- **Minimum viable route:** Sol ↔ Barnard's always profitable if player chooses correct goods
- **Mercy mechanics:** If credits drop below 100 and debt exceeds 12,000, Father Okonkwo offers emergency loan
- **Knowledge persistence:** Even on game over, player retains meta-knowledge of prices and routes
- **Windfall cap:** Random events never swing net worth more than ±20% in one event
- **Comeback mechanic:** NPCs offer better deals if player is clearly struggling

---

## 11. Technical Requirements

### 11.1 Performance Targets

| Metric | Target |
|--------|--------|
| Initial load time | <4 seconds (including starmap) |
| Save/load time | <500ms |
| UI response time | <100ms |
| Memory footprint | <100MB |
| localStorage usage | <500KB (peak) |

### 11.2 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 11.3 Dependencies

Existing:
- Three.js (starmap rendering)

New:
- None required (vanilla JS for game logic)

---

## 12. Development Phases

### Phase 1: Core Loop (MVP)
- [ ] Navigation between connected systems
- [ ] Basic trading (buy/sell, fixed prices)
- [ ] Fuel consumption and purchase
- [ ] Credits and debt tracking
- [ ] Save/load to localStorage
- [ ] Basic HUD showing player status
- [ ] Distance calculations and display

### Phase 2: Ship & Economy
- [ ] Ship condition (hull, engine, life support)
- [ ] Repairs and maintenance
- [ ] Dynamic prices with fluctuation
- [ ] Price discovery (only see visited systems)
- [ ] Cargo system with capacity limits
- [ ] Ship quirks (random assignment)
- [ ] First ship upgrades

### Phase 3: NPCs & Events
- [ ] NPC system with relationships
- [ ] 5 key NPCs with dialogue
- [ ] Event system architecture
- [ ] 20+ dock events
- [ ] 10+ jump events
- [ ] Dialogue UI panel

### Phase 4: Danger
- [ ] Pirate encounters
- [ ] Tactical combat choices
- [ ] Customs inspections
- [ ] Smuggling mechanics
- [ ] Distress calls
- [ ] Mechanical failures

### Phase 5: Content & Polish
- [ ] All cultural regions defined
- [ ] 50+ NPCs across stations
- [ ] 100+ events
- [ ] Tanaka questline (main quest)
- [ ] 5+ side missions
- [ ] Endings and epilogues

### Phase 6: Endgame
- [ ] Range Extender upgrade
- [ ] Pavonis Run sequence
- [ ] Epilogue generation
- [ ] Statistics and achievements
- [ ] New Game+ consideration

---

## 13. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Completion rate | 30% of players reach Pavonis | Analytics flag on ending |
| Session length | Average 20+ minutes | Time between load/save |
| Return rate | 60% play multiple sessions | Save slot usage |
| NPC engagement | Average 3+ NPCs at "Friendly" | Save data analysis |
| Economic health | 50% of players clear debt | Save data analysis |

---

## Appendix A: Distance Reference

### A.1 All Systems by Distance from Sol

| System | Distance (LY) | Reachable | Wormholes |
|--------|---------------|-----------|-----------|
| Sol | 0.00 | Yes | 8 |
| Alpha Centauri A | 6.16 | Yes | 6 |
| Alpha Centauri B | 6.16 | No | 0 |
| Proxima Centauri C | 5.87 | No | 0 |
| Barnard's Star | 8.31 | Yes | 3 |
| Wolf 359 | 10.89 | Yes | 4 |
| Lalande 21185 | 11.64 | Yes | 1 |
| Sirius A | 12.06 | Yes | 4 |
| ... | ... | ... | ... |
| Delta Pavonis | 27.88 | No | 0 |
| Wolf 1481 | 27.93 | No | 0 |

*(Full table to be generated from STAR_DATA)*

### A.2 Distance Calculation Implementation

```javascript
// Add to starmap.html
function calculateDistances() {
  const sol = STAR_DATA.find(s => s.id === 0);
  
  return STAR_DATA.map(star => {
    const dx = star.x - sol.x;
    const dy = star.y - sol.y;
    const dz = star.z - sol.z;
    const distanceFromSol = Math.sqrt(dx*dx + dy*dy + dz*dz) / 10;
    
    return {
      ...star,
      distanceFromSol: distanceFromSol.toFixed(2),
      distanceDisplay: `${distanceFromSol.toFixed(2)} LY`
    };
  }).sort((a, b) => parseFloat(a.distanceFromSol) - parseFloat(b.distanceFromSol));
}

function getJumpDistance(fromId, toId) {
  const from = STAR_DATA.find(s => s.id === fromId);
  const to = STAR_DATA.find(s => s.id === toId);
  
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  
  return (Math.sqrt(dx*dx + dy*dy + dz*dz) / 10).toFixed(2);
}

function getJumpTime(distance) {
  return Math.max(1, Math.ceil(distance * 0.5)); // Days
}

function getJumpFuelCost(distance, shipEfficiency = 1.0) {
  const baseCost = 10; // Percentage
  const perLY = 2;     // Percentage per LY
  return Math.round((baseCost + (distance * perLY)) * shipEfficiency);
}
```

---

## Appendix B: Content Template

### B.1 Event Template

```javascript
{
  id: "EVENT_ID",
  type: "dock|jump|market|time|condition|npc|mission",
  
  trigger: {
    // Required conditions to fire
    system: null,        // System ID or null for any
    npc: null,           // NPC ID or null
    condition: null,     // "first_visit", "has_cargo:medicine", etc.
    minRep: null,        // Minimum NPC reputation
    flag: null,          // Required world flag
    notFlag: null,       // Must NOT have this flag
    chance: 1.0          // Probability (0.0 - 1.0)
  },
  
  once: false,           // If true, only fires once ever
  cooldown: 0,           // Days before can fire again
  priority: 0,           // Higher = checked first
  
  content: {
    text: [
      "Paragraph 1",
      "Paragraph 2"
    ],
    speaker: null,       // NPC ID or null for narration
    mood: "neutral",     // For NPC portrait selection
    
    choices: [
      {
        text: "Choice text (short)",
        tooltip: "Optional longer explanation",
        next: "NEXT_EVENT_ID",  // or null to end
        condition: null,        // Optional requirement to show choice
        effects: [
          { type: "credits", value: 100 },
          { type: "npc_rep", target: "npc_id", value: 5 },
          { type: "set_flag", value: "flag_name" }
        ]
      }
    ]
  }
}
```

### B.2 NPC Template

```javascript
{
  id: "NPC_ID",
  name: "Display Name",
  role: "Job Title",
  system: 0,              // Home system ID
  station: "Station Name",
  
  description: "One paragraph character description for writer reference.",
  
  personality: {
    trust: 0.5,           // 0.0-1.0: How quickly they warm up
    greed: 0.5,           // 0.0-1.0: Money motivation
    loyalty: 0.5,         // 0.0-1.0: Relationship value
    morality: 0.5,        // 0.0-1.0: Ethical flexibility
    humor: 0.5            // 0.0-1.0: Dialogue tone
  },
  
  speechPatterns: {
    greeting: "casual|formal|gruff|warm",
    vocabulary: "simple|educated|technical|slang",
    quirk: "Optional speech quirk description"
  },
  
  arc: "Brief description of their story arc and role in the game.",
  
  dialogueFiles: [
    "npcs/NPC_ID/greetings.js",
    "npcs/NPC_ID/missions.js"
  ]
}
```

---

*End of Document*
