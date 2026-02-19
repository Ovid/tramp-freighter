# Tramp Freighter Blues - Spec 06.1: Core Mission System

**Foundation:** Spec 05 (Danger & Combat)
**Status:** Ready for Development
**Dependencies:** Specs 01-05 must be complete
**Source:** Extracted from Spec 06 (notes/tramp-freighter-06-missions.md), lines 30-287

---

## Overview

The core mission system provides the data structures, types, and lifecycle (offer, accept, track, complete, abandon) for all missions. This is the foundation that passengers (06.3) and repeatable missions (06.4) build on.

## Goals

- Mission type definitions (delivery, fetch, passenger, intel, special)
- Mission data schema with requirements, rewards, penalties, conditions, dialogue
- Mission offering via NPC dialogue integration
- Active mission tracking with deadline countdown
- Mission completion with reward application
- Mission abandonment with penalty application

## Out of Scope

- Passenger-specific logic (Spec 06.3)
- Repeatable cargo runs and mission board (Spec 06.4)
- Narrative events (Spec 06.2)
- Complex branching storylines
- The Tanaka Sequence (Spec 07)
- Multiple endings (Spec 07)

---

## Mission Types

```javascript
const MISSION_TYPES = {
  delivery: {
    name: 'Cargo Delivery',
    description: 'Transport goods to a destination',
    structure: {
      cargo: 'specific good',
      quantity: 'number',
      destination: 'system ID',
      deadline: 'days',
      reward: 'credits',
    },
  },

  fetch: {
    name: 'Procurement',
    description: 'Acquire specific goods and return',
    structure: {
      cargo: 'specific good',
      quantity: 'number',
      source: 'system ID (optional)',
      deadline: 'days',
      reward: 'credits',
    },
  },

  passenger: {
    name: 'Passenger Transport',
    description: 'Transport an NPC to a destination',
    structure: {
      passenger: 'NPC ID or generated passenger',
      destination: 'system ID',
      deadline: 'days',
      reward: 'credits',
      cargoSpace: 'occupied slots (typically 1-3)',
    },
  },

  intel: {
    name: 'Information Gathering',
    description: 'Visit systems and report back',
    structure: {
      targets: ['system IDs'],
      deadline: 'days',
      reward: 'credits',
    },
  },

  special: {
    name: 'Special Mission',
    description: 'Unique story mission',
    structure: {
      custom: 'varies',
    },
  },
};
```

## Mission Data Structure

```javascript
const MISSION_SCHEMA = {
  id: 'delivery_001',
  type: 'delivery',
  title: 'Medical Supplies to Ross 154',
  description:
    'Father Okonkwo needs medicine urgently. Outbreak at the station.',

  giver: 'okonkwo_ross154', // NPC ID
  giverSystem: 11, // Ross 154

  requirements: {
    cargo: 'medicine',
    quantity: 10,
    destination: 11,
    deadline: 7, // Days from acceptance
  },

  rewards: {
    credits: 1500,
    rep: { okonkwo_ross154: 10 },
    faction: { civilians: 5 },
    karma: 2,
  },

  penalties: {
    failure: {
      rep: { okonkwo_ross154: -5 },
      karma: -1,
    },
  },

  conditions: {
    minRep: 10, // With Okonkwo
    notFlag: 'okonkwo_mission_1_complete',
  },

  dialogue: {
    offer: 'mission_okonkwo_1_offer',
    accept: 'mission_okonkwo_1_accept',
    complete: 'mission_okonkwo_1_complete',
    fail: 'mission_okonkwo_1_fail',
  },
};
```

---

## Mission Flow

### Offering Missions

When talking to NPCs, check for available missions:

```javascript
function getAvailableMissions(npcId) {
  const npcState = gameState.npcs[npcId];
  const missions = MISSIONS.filter((m) => {
    // Check if NPC gives this mission
    if (m.giver !== npcId) return false;

    // Check conditions
    if (m.conditions.minRep && npcState.rep < m.conditions.minRep) return false;
    if (m.conditions.notFlag && npcState.flags.includes(m.conditions.notFlag))
      return false;

    // Check if already active or completed
    if (gameState.missions.active.find((am) => am.id === m.id)) return false;
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
    <div class="mission-progress">Medicine: 10/10 ✓</div>
    <div class="mission-deadline">Deadline: 5 days remaining</div>
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

### Mission Abandonment

Players can voluntarily abandon active missions. Abandonment applies failure penalties and marks the mission as failed.

```javascript
function abandonMission(missionId) {
  const mission = gameState.missions.active.find((m) => m.id === missionId);
  if (!mission) return { success: false };

  // Remove from active, add to failed
  gameState.missions.active = gameState.missions.active.filter(
    (m) => m.id !== missionId
  );
  gameState.missions.failed.push(missionId);

  // Apply failure penalties
  if (mission.penalties && mission.penalties.failure) {
    if (mission.penalties.failure.rep) {
      for (const [npcId, amount] of Object.entries(mission.penalties.failure.rep)) {
        modifyRep(npcId, amount);
      }
    }
    if (mission.penalties.failure.karma) {
      modifyKarma(mission.penalties.failure.karma);
    }
  }

  // Free passenger cargo space if applicable
  if (mission.type === 'passenger') {
    gameState.ship.cargo = gameState.ship.cargo.filter(
      (c) => c.passengerMissionId !== missionId
    );
  }

  return { success: true };
}
```

```
┌─────────────────────────────────────────────────────────┐
│  ABANDON MISSION?                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Medical Supplies to Ross 154                           │
│                                                         │
│  Penalties:                                             │
│  • Reputation with Father Okonkwo: -5                   │
│  • Karma: -1                                            │
│                                                         │
│  [ABANDON]  [CANCEL]                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Can accept missions from NPCs
- [ ] Mission requirements track correctly
- [ ] Can complete missions at destination
- [ ] Rewards apply correctly (credits, rep, faction, karma)
- [ ] Failed missions have consequences
- [ ] Deadline tracking works
- [ ] Can abandon active missions with penalties applied
- [ ] Abandoning passenger missions frees cargo space
- [ ] Can have multiple active missions

---

## Success Criteria

Player can:

1. Accept and complete missions for rewards
2. Abandon missions when needed (with penalties)
3. See consequences of mission success/failure
4. Track active missions and deadlines
