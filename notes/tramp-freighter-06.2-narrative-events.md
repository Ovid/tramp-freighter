# Tramp Freighter Blues - Spec 06.2: Narrative Event System

**Foundation:** Spec 05 (Danger & Combat)
**Status:** Ready for Development
**Dependencies:** Specs 01-05 must be complete
**Source:** Extracted from Spec 06 (notes/tramp-freighter-06-missions.md), lines 290-470 + 843-906

---

## Overview

The narrative event system provides a data-driven framework for triggering story content based on game state. Events fire on dock, jump, time, or condition triggers, display text with player choices, and apply effects. This is the storytelling engine that missions (06.1) and passengers (06.3) use for flavor.

## Goals

- Event data schema with trigger conditions, content, and choices
- Four trigger types: dock, jump, time, condition
- Event engine: eligibility checking, priority sorting, cooldowns, once-only
- Event display: text rendering, choice selection, effect application
- Event chains via `next` references
- Sample events for each trigger type

## Out of Scope

- Mission lifecycle (Spec 06.1)
- Passenger-specific events (Spec 06.3)
- Complex branching storylines
- The Tanaka Sequence (Spec 07)
- Multiple endings (Spec 07)

---

## Event Structure

```javascript
const EVENT_SCHEMA = {
  id: 'dock_barnards_first',
  type: 'dock', // dock, jump, time, condition

  trigger: {
    system: 4, // Barnard's Star (null for any)
    condition: 'first_visit',
    chance: 1.0, // 100% if conditions met
  },

  once: true, // Only fires once
  cooldown: 0, // Days before can fire again
  priority: 10, // Higher = checked first

  content: {
    text: [
      'The docking clamps engage with a shudder.',
      "Barnard's Station is smaller than you expected — a retrofitted mining platform.",
      "A dock worker waves you toward Bay 3. Her jumpsuit says 'CHEN' in faded stencil.",
    ],

    speaker: null, // Narration
    mood: 'neutral',

    choices: [
      {
        text: 'Wave back and head to the trading post.',
        next: null,
        effects: [],
      },
      {
        text: 'Stop to introduce yourself.',
        next: 'meet_chen',
        effects: [{ type: 'npc_rep', target: 'chen_barnards', value: 1 }],
      },
      {
        text: 'Ignore her and check your cargo manifest.',
        next: null,
        effects: [{ type: 'npc_rep', target: 'chen_barnards', value: -1 }],
      },
    ],
  },
};
```

## Event Types

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

## Event Engine

### Event Checking

```javascript
function checkEvents(eventType, context = {}) {
  const eligibleEvents = EVENTS.filter((e) => {
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
    if (e.trigger.condition && !evaluateCondition(e.trigger.condition, context))
      return false;

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
  const textHtml = content.text.map((p) => `<p>${p}</p>`).join('');

  // Render choices
  const choicesHtml = content.choices
    .map((choice, i) => {
      return `<button onclick="selectEventChoice('${event.id}', ${i})">${choice.text}</button>`;
    })
    .join('');

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

- [ ] Dock events trigger on arrival
- [ ] Jump events trigger during transit
- [ ] Time events trigger on schedule
- [ ] Condition events trigger on state thresholds
- [ ] Event choices apply effects
- [ ] Event chains work (next: "event_id")
- [ ] Once-only events don't repeat
- [ ] Cooldowns prevent spam

---

## Success Criteria

Player can:

1. Experience narrative events that add flavor
2. Make choices that affect the story
