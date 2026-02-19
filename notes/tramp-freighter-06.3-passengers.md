# Tramp Freighter Blues - Spec 06.3: Passenger Mission System

**Foundation:** Specs 06.1 (Core Missions) + 06.2 (Narrative Events)
**Status:** Ready for Development
**Dependencies:** Specs 01-05 + 06.1 + 06.2 must be complete
**Source:** Extracted from Spec 06 (notes/tramp-freighter-06-missions.md), lines 474-769

---

## Overview

The passenger system adds human cargo to the mission framework. Passengers have types, satisfaction scores weighted by personality, and trigger their own events during transit. Payment scales with satisfaction. This builds on the core mission lifecycle (06.1) and uses the narrative event framework (06.2) for in-transit events.

## Goals

- Five passenger types with distinct satisfaction weights
- Passenger generation with name, type, cargo space, dialogue
- Satisfaction system affected by delays, combat, and ship condition
- Payment calculation with satisfaction multiplier and on-time bonus
- Reputation effects based on delivery satisfaction
- Passenger-specific narrative events (wealthy tip, family children, comfort complaints)
- Integration with cargo space, combat, and ship condition systems

## Out of Scope

- Core mission lifecycle (Spec 06.1)
- Event engine mechanics (Spec 06.2)
- The Tanaka Sequence (Spec 07)

---

## Passenger Types

```javascript
const PASSENGER_TYPES = {
  refugee: {
    urgency: 'high',
    payment: 'low',
    cargoSpace: 1,
    dialogue: [
      'Please, I need to get away from here.',
      'Thank you for helping me.',
    ],
    satisfaction: { speed: 0.8, comfort: 0.2 },
  },

  business: {
    urgency: 'medium',
    payment: 'medium',
    cargoSpace: 2,
    dialogue: ['Time is money.', 'I expect professional service.'],
    satisfaction: { speed: 0.6, comfort: 0.4 },
  },

  wealthy: {
    urgency: 'low',
    payment: 'high',
    cargoSpace: 3,
    dialogue: [
      'I trust the accommodations are adequate?',
      'Money is no object.',
    ],
    satisfaction: { speed: 0.3, comfort: 0.7 },
  },

  scientist: {
    urgency: 'medium',
    payment: 'medium',
    cargoSpace: 2,
    dialogue: ['Fascinating ship you have.', "I'm studying stellar phenomena."],
    satisfaction: { speed: 0.5, comfort: 0.3, safety: 0.2 },
  },

  family: {
    urgency: 'low',
    payment: 'low',
    cargoSpace: 3,
    dialogue: ['Are we there yet?', 'The children are excited.'],
    satisfaction: { speed: 0.4, comfort: 0.4, safety: 0.2 },
  },
};
```

## Passenger Generation

```javascript
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
    satisfaction: 50, // 0-100
    satisfactionWeights: template.satisfaction,
  };
}
```

---

## Passenger Mission Flow

### Offering

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

### During Transit

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

### Satisfaction Factors

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

### Completion

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

### Payment Calculation

```javascript
function calculatePassengerPayment(mission, passenger) {
  const basePayment = mission.rewards.credits;

  // Satisfaction bonus/penalty
  let multiplier = 1.0;
  if (passenger.satisfaction >= 80)
    multiplier = 1.3; // Very satisfied
  else if (passenger.satisfaction >= 60)
    multiplier = 1.15; // Satisfied
  else if (passenger.satisfaction >= 40)
    multiplier = 1.0; // Neutral
  else if (passenger.satisfaction >= 20)
    multiplier = 0.7; // Dissatisfied
  else multiplier = 0.5; // Very dissatisfied

  // On-time bonus
  if (gameState.player.daysElapsed <= mission.deadline) {
    multiplier += 0.1;
  }

  return Math.round(basePayment * multiplier);
}
```

### Reputation Effects

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

---

## Passenger-Specific Events

### Wealthy Passenger

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

### Family Passenger

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

---

## Integration with Existing Systems

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


**Next Spec:** The Tanaka Sequence and endgame
