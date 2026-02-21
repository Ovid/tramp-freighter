# Endgame Design: The Tanaka Sequence & Pavonis Run

**Date:** 2026-02-20
**Spec:** notes/tramp-freighter-07-endgame.md
**Status:** Approved

---

## Architecture: QuestManager

A generic, data-driven `QuestManager` extends `BaseManager`. Individual quests are config objects registered with the manager — Tanaka is the first, but the system supports adding more questlines without modifying the manager.

### State

```js
state.quests = {
  tanaka: {
    stage: 0,           // 0 = not started, 1-5 = active stages, 6 = victory
    data: {},           // quest-specific counters (jumpsCompleted, exoticMaterials, etc.)
    startedDay: null,
    completedDay: null,
  },
}
```

### Quest Definition Schema

```js
{
  id: 'tanaka',
  name: 'The Tanaka Sequence',
  npcId: 'tanaka_barnards',

  unlockConditions: {
    systemsVisited: 5,
    system: 4,                     // Barnard's Star
  },

  stages: [
    {
      stage: 1,
      name: 'Field Test',
      requirements: { npcRep: ['tanaka_barnards', 10], engineCondition: 80 },
      objectives: { jumpsCompleted: 3 },
      rewards: { credits: 1000, rep: { tanaka_barnards: 15 }, engineRestore: true },
      dialogueNode: 'mission_1_offer',
    },
    // ... stages 2-5
  ],

  victoryStage: 6,
}
```

### QuestManager API

- `getQuestState(questId)` — returns current state or initializes
- `canUnlockQuest(questId)` — checks unlock conditions
- `canStartStage(questId, stage)` — checks stage requirements
- `advanceStage(questId)` — moves to next stage, applies rewards
- `updateQuestData(questId, key, value)` — updates counters
- `getActiveQuests()` — all quests with stage > 0 and not completed
- `isQuestComplete(questId)` — stage >= victoryStage
- `registerQuest(questDefinition)` — adds a quest config at init

---

## Tanaka NPC

11th NPC added to `npc-data.js`:

```js
{
  id: 'tanaka_barnards',
  name: 'Yuki Tanaka',
  role: 'Engineer',
  system: 4,                    // Barnard's Star
  station: 'Bore Station 7',
  personality: { trust: 0.2, greed: 0.1, loyalty: 0.9, morality: 0.8 },
  speechStyle: { greeting: 'formal', vocabulary: 'technical', quirk: 'Precise, measured speech.' },
  initialRep: 0,
  questId: 'tanaka',
}
```

**Hidden until intro event fires.** A narrative dock event at Barnard's Star triggers when the player has visited 5+ systems. After the intro event, Tanaka appears as a regular NPC in the station menu.

---

## The 5 Mission Stages

### Stage 1: Field Test

- **Requirements:** Rep 10+, Engine 80%+
- **Objective:** Make 3 jumps after accepting
- **Tracking:** `data.jumpsCompleted` counter, incremented on `jumped` event
- **Rewards:** 1,000cr, +15 rep, engine restore to 100%

### Stage 2: Rare Materials

- **Requirements:** Stage 1 done, Rep 30+
- **Objective:** Collect 5 exotic materials from distant stations (>15 LY from Sol)
- **Tracking:** `data.exoticMaterials` counter, narrative dock events at qualifying stations
- **Collection rules:** Max 1 per station (tracked in `data.exoticStations: []`), chance-based (not guaranteed every visit)
- **Rewards:** 3,000cr, +15 rep, Advanced Sensors unlock

### Stage 3: The Prototype

- **Requirements:** Stage 2 done, Rep 50+, Hull 70%+, Engine 80%+
- **Objective:** Prototype round-trip jump to Proxima Centauri
- **Tracking:** Triggered via dialogue, narrative sequence plays, auto-completes
- **Design:** Round-trip test — Tanaka controls the prototype remotely. No actual navigation to Proxima. Story beat as text/choices.
- **Rewards:** 2,000cr, +20 rep, unlocks Tanaka's backstory dialogue (sister at Delta Pavonis)

### Stage 4: Personal Request

- **Requirements:** Stage 3 done, Rep 70+
- **Objective:** Deliver message to NPC at Epsilon Eridani
- **Tracking:** `data.messageDelivered` flag, set when talking to target NPC at Epsilon Eridani
- **Rewards:** No credits (personal favor), +20 rep, Tanaka offers Pavonis partnership

### Stage 5: Final Preparations

- **Requirements:** Stage 4 done, Rep 90+ (Trusted), Debt 0, Credits 25,000+, Hull 80%+, Engine 90%+
- **Objective:** Confirm readiness (requirements check only, no active objective)
- **Rewards:** Range Extender installed (permanent upgrade), unlocks The Pavonis Run

All numeric thresholds stored in `constants.js` for tuning.

---

## The Pavonis Run & Victory Flow

### View State Machine Update

```
STATION → PAVONIS_RUN → EPILOGUE → TITLE
```

Two new view modes in App.jsx.

### Flow

1. **Trigger:** Player talks to Tanaka after stage 5 complete. Dialogue choice "I'm ready" switches view to `PAVONIS_RUN`.
2. **Auto-save:** Game saves at the pre-Pavonis state before the confirmation.
3. **Point of No Return:** Confirmation dialog. "Yes, I'm ready" / "Not yet." "Not yet" returns to station.
4. **The Jump:** Linear narrative text sequence (no gameplay). Player clicks through text panels.
5. **View switches to `EPILOGUE`.**

### Save Behavior

- Auto-save before point of no return confirmation
- Save gets `victory: true` flag after completion
- Loading a victorious save returns player to pre-Pavonis state
- Player can keep playing or re-trigger the run

---

## Epilogue

Template-driven paragraph selection based on player stats.

### Structure

```js
const epilogueConfig = {
  sections: [
    {
      id: 'arrival',
      variants: [{ condition: null, text: '...' }],     // always the same
    },
    {
      id: 'tanaka',
      variants: [
        { condition: { npcRep: ['tanaka_barnards', 90] }, text: '...' },
        { condition: { npcRep: ['tanaka_barnards', 60] }, text: '...' },
      ],
    },
    {
      id: 'reputation',
      variants: [
        { condition: { karmaAbove: 50, trustedNPCs: 3 }, text: '...' },
        { condition: { karmaBelow: -50 }, text: '...' },
        { condition: { smugglingRuns: 5 }, text: '...' },
        { condition: null, text: '...' },
      ],
    },
    {
      id: 'npc_outcomes',
      dynamic: true,   // generates text per NPC at Trusted+
    },
    {
      id: 'reflection',
      variants: [
        { condition: { karmaAbove: 30 }, text: '...' },
        { condition: { karmaBelow: -30 }, text: '...' },
        { condition: null, text: '...' },
      ],
    },
  ],
}
```

First matching variant wins per section. Followed by statistics summary, then credits screen, then title.

### Statistics Block

```
Days traveled: 127
Systems visited: 23
Credits earned: ₡47,320
Missions completed: 18
NPCs at Trusted or higher: 5
Cargo hauled: 340 units
Jumps made: 89
```

---

## New Condition Types

Added to the event engine's condition evaluator:

| Condition | Purpose |
|-----------|---------|
| `npc_rep_above` | NPC rep >= threshold |
| `systems_visited_count` | Visited systems >= N |
| `has_upgrade` | Player has specific upgrade |
| `quest_stage` | Quest at specific stage |
| `debt_zero` | Player debt === 0 |
| `credits_above` | Credits >= threshold |
| `hull_above` | Hull condition >= threshold |
| `engine_above` | Engine condition >= threshold |

---

## Event Hooks

QuestManager subscribes to existing events:

| Event | Action |
|-------|--------|
| `jumped` | Increment jump counters for active quest objectives |
| `docked` | Check exotic material collection (stage 2); check quest unlock conditions |
| `npcRepChanged` | Re-evaluate stage requirements |

---

## Stats Tracking

New `state.stats` object for epilogue data not currently tracked:

```js
state.stats = {
  creditsEarned: 0,
  jumpsCompleted: 0,
  cargoHauled: 0,
  smugglingRuns: 0,
  charitableActs: 0,
}
```

Counters incremented at existing action points (e.g., `TradingManager.sellGood()` bumps `cargoHauled`).

Derived at epilogue time (no incremental tracking needed):
- `trustedNPCs` — filter `state.npcs` for rep >= 60
- `familyNPCs` — filter `state.npcs` for rep >= 90

---

## New Components

- `PavonisRun` — full-screen narrative sequence (text panels with continue buttons)
- `Epilogue` — epilogue text + statistics + credits roll

## New Files

- `src/game/state/managers/quest-manager.js`
- `src/game/data/quest-definitions.js` (Tanaka quest config)
- `src/game/data/dialogue/tanaka-dialogue.js`
- `src/game/data/epilogue-data.js`
- `src/features/endgame/PavonisRun.jsx`
- `src/features/endgame/Epilogue.jsx`

## Modified Files

- `src/game/constants.js` — endgame thresholds, quest constants
- `src/game/state/game-state-manager.js` — register QuestManager, delegate API
- `src/game/data/npc-data.js` — add Tanaka
- `src/game/data/narrative-events.js` — Tanaka intro event, exotic material events
- `src/game/data/star-data.js` — Delta Pavonis `r: 0` stays (unreachable by normal means)
- `src/App.jsx` — add PAVONIS_RUN and EPILOGUE view modes
- Managers that need stat tracking hooks (TradingManager, NavigationManager, etc.)
