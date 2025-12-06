# Tramp Freighter Blues - Spec 06: Missions & Events

**Foundation:** Spec 05 (Danger & Combat)  
**Status:** Ready for Development  
**Dependencies:** Specs 01-05 must be complete

---

## Overview

Add structured content through missions, narrative events, and the main quest line. This is where the story comes together.

## Goals

- Mission system (delivery, fetch, special)
- Narrative event framework
- Dock events and jump events
- Time-based story beats
- Repeatable content
- Mission rewards and consequences

## Out of Scope

- The Tanaka Sequence (endgame, comes in Spec 07)
- Complex branching storylines
- Multiple endings (comes in Spec 07)

---

## Mission System

### Mission Types

```javascript
const MISSION_TYPES = {
  delivery: {
    name: "Cargo Delivery",
    description: "Transport goods to a destination",
    structure: {
      cargo: "specific good",
      quantity: "number",
      destination: "system ID",
      deadline: "days",
      reward: "credits"
    }
  },
  
  fetch: {
    name: "Procurement",
    description: "Acquire specific goods and return",
    structure: {
      cargo: "specific good",
      quantity: "number",
      source: "system ID (optional)",
      deadline: "days",
      reward: "credits"
    }
  },
  
  passenger: {
    name: "Passenger Transport",
    description: "Transport an NPC to a destination",
    structure: {
      passenger: "NPC ID or generated passenger",
      destination: "system ID",
      deadline: "days",
      reward: "credits",
      cargoSpace: "occupied slots (typically 1-3)"
    }
  },
  
  intel: {
    name: "Information Gathering",
    description: "Visit systems and report back",
    structure: {
      targets: ["system IDs"],
      deadline: "days",
      reward: "credits"
    }
  },
  
  special: {
    name: "Special Mission",
    description: "Unique story mission",
    structure: {
      custom: "varies"
    }
  }
};
```

### Mission Data Structure

```javascript
const MISSION_SCHEMA = {
  id: "delivery_001",
  type: "delivery",
  title: "Medical Supplies to Ross 154",
  description: "Father Okonkwo needs medicine urgently. Outbreak at the station.",
  
  giver: "okonkwo_ross154",  // NPC ID
  giverSystem: 11,  // Ross 154
  
  requirements: {
    cargo: "medicine",
    quantity: 10,
    destination: 11,
    deadline: 7  // Days from acceptance
  },
  
  rewards: {
    credits: 1500,
    rep: { okonkwo_ross154: 10 },
    faction: { civilians: 5 },
    karma: 2
  },
  
  penalties: {
    failure: {
      rep: { okonkwo_ross154: -5 },
      karma: -1
    }
  },
  
  conditions: {
    minRep: 10,  // With Okonkwo
    notFlag: "okonkwo_mission_1_complete"
  },
  
  dialogue: {
    offer: "mission_okonkwo_1_offer",
    accept: "mission_okonkwo_1_accept",
    complete: "mission_okonkwo_1_complete",
    fail: "mission_okonkwo_1_fail"
  }
};
```

---

## Mission Flow

### Offering Missions

When talking to NPCs, check for available missions:

```javascript
function getAvailableMissions(npcId) {
  const npcState = gameState.npcs[npcId];
  const missions = MISSIONS.filter(m => {
    // Check if NPC gives this mission
    if (m.giver !== npcId) return false;
    
    // Check conditions
    if (m.conditions.minRep && npcState.rep < m.conditions.minRep) return false;
    if (m.conditions.notFlag && npcState.flags.includes(m.conditions.notFlag)) return false;
    
    // Check if already active or completed
    if (gameState.missions.active.find(am => am.id === m.id)) return false;
    if (gameState.missions.completed.includes(m.id)) return false;
    
    return true;
  });
  
  return missions;
}
```

### Mission Offer Screen

```
┌─────────────────────────────────────────────────────────┐
│  FATHER OKONKWO — Chaplain                 [Friendly]   │
│  Ross 154 Medical                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Okonkwo's expression is grave.                         │
│                                                         │
│  "We have an outbreak. I need medicine. Ten units,      │
│   as soon as you can manage. Lives depend on it."       │
│                                                         │
│  ═══ MISSION: Medical Supplies to Ross 154 ═══          │
│                                                         │
│  Deliver: 10 units of Medicine                          │
│  Destination: Ross 154 (here)                           │
│  Deadline: 7 days                                       │
│  Reward: ₡1,500                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [ACCEPT MISSION]                                       │
│  [DECLINE]                                              │
└─────────────────────────────────────────────────────────┘
```

### Active Mission Tracking

```html
<div id="active-missions">
  <div class="mission-item">
    <div class="mission-title">Medical Supplies to Ross 154</div>
    <div class="mission-progress">
      Medicine: 10/10 ✓
    </div>
    <div class="mission-deadline">
      Deadline: 5 days remaining
    </div>
  </div>
</div>
```

### Mission Completion

When docking at destination with requirements met:

```
┌─────────────────────────────────────────────────────────┐
│  MISSION COMPLETE                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Okonkwo takes the medicine with visible relief.        │
│                                                         │
│  "You've saved lives today. Thank you."                 │
│                                                         │
│  He presses a credit chip into your hand.               │
│                                                         │
│  Rewards:                                               │
│  • ₡1,500                                               │
│  • Reputation with Father Okonkwo: +10                  │
│  • Civilian faction reputation: +5                      │
│                                                         │
│  [CONTINUE]                                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Event System

### Event Structure

```javascript
const EVENT_SCHEMA = {
  id: "dock_barnards_first",
  type: "dock",  // dock, jump, time, condition
  
  trigger: {
    system: 4,  // Barnard's Star (null for any)
    condition: "first_visit",
    chance: 1.0  // 100% if conditions met
  },
  
  once: true,  // Only fires once
  cooldown: 0,  // Days before can fire again
  priority: 10,  // Higher = checked first
  
  content: {
    text: [
      "The docking clamps engage with a shudder.",
      "Barnard's Station is smaller than you expected — a retrofitted mining platform.",
      "A dock worker waves you toward Bay 3. Her jumpsuit says 'CHEN' in faded stencil."
    ],
    
    speaker: null,  // Narration
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
};
```

### Event Types

**Dock Events:** Trigger when arriving at a station
- First visit narration
- NPC encounters
- Station-specific events
- Economic news

**Jump Events:** Trigger during wormhole transit
- Pirate encounters (already implemented)
- Distress calls (already implemented)
- Anomalies and discoveries
- Random encounters

**Time Events:** Trigger on specific days
- Debt reminders
- Story beats
- Festival announcements
- NPC check-ins

**Condition Events:** Trigger based on game state
- Low fuel warnings
- Hull breach alerts
- Debt collection
- Reputation milestones

---

## Sample Events

### Dock Event: First Visit to Sol

```javascript
{
  id: "dock_sol_first",
  type: "dock",
  trigger: { system: 0, condition: "first_visit" },
  once: true,
  
  content: {
    text: [
      "Sol Station. The heart of human civilization.",
      "Massive. Gleaming. Expensive.",
      "You feel very small, and very poor."
    ],
    choices: [
      { text: "Time to get to work.", next: null, effects: [] }
    ]
  }
}
```

### Jump Event: Salvage Discovery

```javascript
{
  id: "jump_salvage_random",
  type: "jump",
  trigger: { system: null, condition: null, chance: 0.05 },
  once: false,
  cooldown: 5,
  
  content: {
    text: [
      "Your sensors ping. Debris field ahead.",
      "Looks like a cargo container. Intact, maybe."
    ],
    choices: [
      {
        text: "Investigate (1 hour, 2% fuel)",
        next: "salvage_result",
        effects: [
          { type: "fuel", value: -2 },
          { type: "time", value: 0.04 }  // 1 hour = 0.04 days
        ]
      },
      {
        text: "Keep moving.",
        next: null,
        effects: []
      }
    ]
  }
},
{
  id: "salvage_result",
  type: "event",
  
  content: {
    text: [
      "You crack the seal. Inside: 5 units of Parts.",
      "Salvage rights. Finders keepers."
    ],
    choices: [
      {
        text: "Load it up.",
        next: null,
        effects: [
          { type: "cargo_add", good: "parts", qty: 5, price: 0 }
        ]
      }
    ]
  }
}
```

### Time Event: Debt Reminder

```javascript
{
  id: "time_debt_warning",
  type: "time",
  trigger: { day: 30, condition: "debt > 8000" },
  once: false,
  cooldown: 10,
  
  content: {
    text: [
      "A message from Marcus Cole.",
      "\"Grace period's over. Interest starts accruing. Don't make me come looking for you.\""
    ],
    choices: [
      { text: "Delete message.", next: null, effects: [] }
    ]
  }
}
```

---

## Passenger Mission System

### Passenger Generation

```javascript
const PASSENGER_TYPES = {
  refugee: {
    urgency: "high",
    payment: "low",
    cargoSpace: 1,
    dialogue: ["Please, I need to get away from here.", "Thank you for helping me."],
    satisfaction: { speed: 0.8, comfort: 0.2 }
  },
  
  business: {
    urgency: "medium",
    payment: "medium",
    cargoSpace: 2,
    dialogue: ["Time is money.", "I expect professional service."],
    satisfaction: { speed: 0.6, comfort: 0.4 }
  },
  
  wealthy: {
    urgency: "low",
    payment: "high",
    cargoSpace: 3,
    dialogue: ["I trust the accommodations are adequate?", "Money is no object."],
    satisfaction: { speed: 0.3, comfort: 0.7 }
  },
  
  scientist: {
    urgency: "medium",
    payment: "medium",
    cargoSpace: 2,
    dialogue: ["Fascinating ship you have.", "I'm studying stellar phenomena."],
    satisfaction: { speed: 0.5, comfort: 0.3, safety: 0.2 }
  },
  
  family: {
    urgency: "low",
    payment: "low",
    cargoSpace: 3,
    dialogue: ["Are we there yet?", "The children are excited."],
    satisfaction: { speed: 0.4, comfort: 0.4, safety: 0.2 }
  }
};

function generatePassenger() {
  const types = Object.keys(PASSENGER_TYPES);
  const type = types[Math.floor(Math.random() * types.length)];
  const template = PASSENGER_TYPES[type];
  
  return {
    id: `passenger_${Date.now()}`,
    name: generatePersonName(),
    type: type,
    cargoSpace: template.cargoSpace,
    dialogue: template.dialogue,
    satisfaction: 50,  // 0-100
    satisfactionWeights: template.satisfaction
  };
}
```

### Passenger Mission Flow

**Offering:**
```
┌─────────────────────────────────────────────────────────┐
│  PASSENGER BOARD — Sol Station                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Dr. Sarah Chen (Scientist)                             │
│  Destination: Epsilon Eridani                           │
│  Deadline: 10 days                                      │
│  Payment: ₡800                                          │
│  Cargo Space Required: 2 units                          │
│                                                         │
│  "I'm studying stellar phenomena in the Eridani system. │
│   I need reliable transport."                           │
│                                                         │
│  [ACCEPT]  [DECLINE]                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**During Transit:**

Passengers can trigger events during jumps:

```javascript
{
  id: "passenger_complaint_comfort",
  type: "jump",
  trigger: { condition: "has_passenger", chance: 0.15 },
  
  content: {
    text: [
      "Your passenger complains about the cramped quarters.",
      "They're clearly uncomfortable."
    ],
    choices: [
      {
        text: "Apologize and offer refreshments.",
        effects: [
          { type: "passenger_satisfaction", value: 5 },
          { type: "credits", value: -20 }
        ]
      },
      {
        text: "Tell them it's a freighter, not a cruise ship.",
        effects: [
          { type: "passenger_satisfaction", value: -10 }
        ]
      },
      {
        text: "Ignore the complaint.",
        effects: [
          { type: "passenger_satisfaction", value: -5 }
        ]
      }
    ]
  }
}
```

**Satisfaction Factors:**

```javascript
function updatePassengerSatisfaction(passenger, event) {
  const weights = passenger.satisfactionWeights;
  
  // Speed: Affected by delays
  if (event === 'delay') {
    passenger.satisfaction -= 10 * weights.speed;
  }
  
  // Comfort: Affected by ship condition
  if (gameState.ship.lifeSupport < 50) {
    passenger.satisfaction -= 5 * weights.comfort;
  }
  
  // Safety: Affected by combat
  if (event === 'combat') {
    passenger.satisfaction -= 15 * weights.safety;
  }
  
  // Clamp 0-100
  passenger.satisfaction = Math.max(0, Math.min(100, passenger.satisfaction));
}
```

**Completion:**

```
┌─────────────────────────────────────────────────────────┐
│  PASSENGER DELIVERED                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Dr. Sarah Chen disembarks at Epsilon Eridani.          │
│                                                         │
│  Satisfaction: 75% (Satisfied)                          │
│                                                         │
│  "Thank you for the professional service. I'll          │
│   recommend you to colleagues."                         │
│                                                         │
│  Base Payment: ₡800                                     │
│  Satisfaction Bonus: ₡150                               │
│  Total: ₡950                                            │
│                                                         │
│  [CONTINUE]                                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Payment Calculation:**

```javascript
function calculatePassengerPayment(mission, passenger) {
  const basePayment = mission.rewards.credits;
  
  // Satisfaction bonus/penalty
  let multiplier = 1.0;
  if (passenger.satisfaction >= 80) multiplier = 1.3;      // Very satisfied
  else if (passenger.satisfaction >= 60) multiplier = 1.15; // Satisfied
  else if (passenger.satisfaction >= 40) multiplier = 1.0;  // Neutral
  else if (passenger.satisfaction >= 20) multiplier = 0.7;  // Dissatisfied
  else multiplier = 0.5;                                    // Very dissatisfied
  
  // On-time bonus
  if (gameState.player.daysElapsed <= mission.deadline) {
    multiplier += 0.1;
  }
  
  return Math.round(basePayment * multiplier);
}
```

**Reputation Effects:**

```javascript
function completePassengerMission(mission, passenger) {
  const payment = calculatePassengerPayment(mission, passenger);
  gameState.player.credits += payment;
  
  // Reputation with passenger type
  if (passenger.satisfaction >= 60) {
    modifyFactionRep('civilians', 5);
    
    // Chance of repeat business
    if (passenger.satisfaction >= 80 && Math.random() < 0.3) {
      // Generate follow-up mission
      generateFollowUpPassengerMission(passenger);
    }
  } else if (passenger.satisfaction < 40) {
    modifyFactionRep('civilians', -3);
  }
}
```

### Passenger-Specific Events

**Wealthy Passenger:**
```javascript
{
  id: "wealthy_passenger_tip",
  type: "dock",
  trigger: { condition: "has_wealthy_passenger", satisfaction: ">= 70" },
  
  content: {
    text: [
      "Your wealthy passenger is impressed with your service.",
      "They offer a generous tip."
    ],
    choices: [
      { text: "Accept graciously. (₡500)", effects: [{ type: "credits", value: 500 }] },
      { text: "Decline politely.", effects: [{ type: "passenger_satisfaction", value: 10 }] }
    ]
  }
}
```

**Family Passenger:**
```javascript
{
  id: "family_passenger_children",
  type: "jump",
  trigger: { condition: "has_family_passenger", chance: 0.2 },
  
  content: {
    text: [
      "The children are getting restless.",
      "The parents look apologetic."
    ],
    choices: [
      { text: "Show them the cockpit.", effects: [{ type: "passenger_satisfaction", value: 15 }] },
      { text: "Give them some snacks.", effects: [{ type: "passenger_satisfaction", value: 10 }, { type: "credits", value: -10 }] },
      { text: "Ignore it.", effects: [{ type: "passenger_satisfaction", value: -5 }] }
    ]
  }
}
```

### Integration with Existing Systems

**Cargo Space:**
- Passengers occupy cargo space
- Cannot be jettisoned (obviously)
- Shown separately in cargo manifest

**Combat:**
- Passengers react to combat
- High satisfaction loss if combat occurs
- Some passengers (military, smugglers) may be less affected

**Ship Condition:**
- Low life support affects passenger comfort
- Hull damage frightens passengers
- Clean, well-maintained ship improves satisfaction

---

## Repeatable Missions

### Cargo Run Generator

```javascript
function generateCargoRun() {
  const fromSystem = gameState.player.currentSystem;
  const toSystem = getRandomConnectedSystem(fromSystem);
  
  const goods = ["grain", "ore", "tritium", "parts"];
  const good = goods[Math.floor(Math.random() * goods.length)];
  const qty = 10 + Math.floor(Math.random() * 20);
  
  const distance = getDistanceBetween(
    STAR_DATA.find(s => s.id === fromSystem),
    STAR_DATA.find(s => s.id === toSystem)
  );
  
  const deadline = Math.ceil(distance * 2) + 3;  // Generous deadline
  const reward = Math.round(qty * GOODS[good].basePrice * 0.3);  // 30% markup
  
  return {
    id: `cargo_run_${Date.now()}`,
    type: "delivery",
    title: `Cargo Run: ${good} to ${STAR_DATA.find(s => s.id === toSystem).name}`,
    description: `Standard delivery contract.`,
    giver: "station_master",
    giverSystem: fromSystem,
    requirements: { cargo: good, quantity: qty, destination: toSystem, deadline },
    rewards: { credits: reward },
    penalties: { failure: { rep: { station_master: -2 } } }
  };
}
```

### Mission Board

Add to station menu:

```
[MISSION BOARD]    Available contracts
```

```
┌─────────────────────────────────────────────────────────┐
│  MISSION BOARD — Sol Station                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Cargo Run: Grain to Barnard's Star                     │
│  Deliver 15 units of Grain                              │
│  Deadline: 5 days  |  Reward: ₡135                      │
│  [ACCEPT]                                               │
│                                                         │
│  Cargo Run: Parts to Sirius A                           │
│  Deliver 20 units of Parts                              │
│  Deadline: 8 days  |  Reward: ₡1,080                    │
│  [ACCEPT]                                               │
│                                                         │
│  [REFRESH] (new missions tomorrow)                      │
│  [BACK]                                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Event Engine

### Event Checking

```javascript
function checkEvents(eventType, context = {}) {
  const eligibleEvents = EVENTS.filter(e => {
    // Type match
    if (e.type !== eventType) return false;
    
    // Already fired (if once)
    if (e.once && gameState.events.fired.includes(e.id)) return false;
    
    // Cooldown
    if (e.cooldown && gameState.events.cooldowns[e.id]) {
      if (gameState.player.daysElapsed < gameState.events.cooldowns[e.id]) {
        return false;
      }
    }
    
    // Trigger conditions
    if (e.trigger.system && e.trigger.system !== context.system) return false;
    if (e.trigger.condition && !evaluateCondition(e.trigger.condition, context)) return false;
    
    // Chance
    if (Math.random() > e.trigger.chance) return false;
    
    return true;
  });
  
  // Sort by priority
  eligibleEvents.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  // Return highest priority event
  return eligibleEvents[0] || null;
}
```

### Event Display

```javascript
function showEvent(event) {
  const content = event.content;
  
  // Render text
  const textHtml = content.text.map(p => `<p>${p}</p>`).join('');
  
  // Render choices
  const choicesHtml = content.choices.map((choice, i) => {
    return `<button onclick="selectEventChoice('${event.id}', ${i})">${choice.text}</button>`;
  }).join('');
  
  // Show modal
  showModal(`
    <div class="event-modal">
      <div class="event-text">${textHtml}</div>
      <div class="event-choices">${choicesHtml}</div>
    </div>
  `);
}
```

---

## Testing Checklist

- [ ] Can accept missions from NPCs
- [ ] Mission requirements track correctly
- [ ] Can complete missions at destination
- [ ] Rewards apply correctly
- [ ] Failed missions have consequences
- [ ] Deadline tracking works
- [ ] Dock events trigger on arrival
- [ ] Jump events trigger during transit
- [ ] Time events trigger on schedule
- [ ] Event choices apply effects
- [ ] Event chains work (next: "event_id")
- [ ] Once-only events don't repeat
- [ ] Cooldowns prevent spam
- [ ] Mission board generates contracts
- [ ] Can have multiple active missions

---

## Success Criteria

Player can:
1. Accept and complete missions for rewards
2. Experience narrative events that add flavor
3. Make choices that affect the story
4. Find repeatable content for income
5. See consequences of mission success/failure
6. Track active missions and deadlines

**Next Spec:** The Tanaka Sequence and endgame
