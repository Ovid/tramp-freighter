# Tramp Freighter Blues - Spec 06.4: Repeatable Missions & Mission Board

**Foundation:** Spec 06.1 (Core Missions)
**Status:** Ready for Development
**Dependencies:** Specs 01-05 + 06.1 must be complete
**Source:** Extracted from Spec 06 (notes/tramp-freighter-06-missions.md), lines 772-839

---

## Overview

Repeatable missions provide a steady income source through procedurally generated cargo delivery contracts. The mission board at each station offers a rotating selection of cargo runs to connected systems. This builds on the core mission lifecycle (06.1) for accept/track/complete/abandon mechanics.

## Goals

- Cargo run generator using connected systems and distance-based deadlines
- Mission board UI at stations with accept and refresh
- Reward calculation based on quantity and base price
- Failure penalties for abandoned/expired cargo runs
- Daily rotation of available contracts

## Out of Scope

- Core mission lifecycle (Spec 06.1 handles accept/track/complete/abandon)
- Passenger missions (Spec 06.3)
- Narrative events (Spec 06.2)
- The Tanaka Sequence (Spec 07)

---

## Cargo Run Generator

```javascript
function generateCargoRun() {
  const fromSystem = gameState.player.currentSystem;
  const toSystem = getRandomConnectedSystem(fromSystem);

  const goods = ['grain', 'ore', 'tritium', 'parts'];
  const good = goods[Math.floor(Math.random() * goods.length)];
  const qty = 10 + Math.floor(Math.random() * 20);

  const distance = getDistanceBetween(
    STAR_DATA.find((s) => s.id === fromSystem),
    STAR_DATA.find((s) => s.id === toSystem)
  );

  const deadline = Math.ceil(distance * 2) + 3; // Generous deadline
  const reward = Math.round(qty * GOODS[good].basePrice * 0.3); // 30% markup

  return {
    id: `cargo_run_${Date.now()}`,
    type: 'delivery',
    title: `Cargo Run: ${good} to ${STAR_DATA.find((s) => s.id === toSystem).name}`,
    description: `Standard delivery contract.`,
    giver: 'station_master',
    giverSystem: fromSystem,
    requirements: {
      cargo: good,
      quantity: qty,
      destination: toSystem,
      deadline,
    },
    rewards: { credits: reward },
    penalties: { failure: { rep: { station_master: -2 } } },
  };
}
```

## Mission Board

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

## Testing Checklist

- [ ] Mission board generates contracts

---

## Success Criteria

Player can:

1. Find repeatable content for income

**Next Spec:** The Tanaka Sequence and endgame
