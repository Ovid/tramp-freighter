# Tanaka Rep Grind Fix

## Problem

The Tanaka rep grind is too slow and invisible. Getting from rep 0 to 10
(stage 1 unlock) takes ~35+ game days of repetitive supply shuttling. The
player stays at NEUTRAL the entire time (tier covers 0-9) with zero
visible progress feedback. Dialogue options for the next quest stage
simply don't appear with no explanation.

Root causes:
- Supply contribution gives only +1 rep per run with a 7-day cooldown
- Dialogue repGain values (1-5) are crushed by Tanaka's trust modifier
  (0.2), yielding 0-1 effective rep per visit
- The NEUTRAL tier spans 0-9, so the player sees no tier change during
  the entire grind
- No narrative feedback about growing trust within a tier

## Design

Four changes, all small and focused.

### 1. Increase supply rep gain

In `src/game/constants.js`, change `TANAKA_SUPPLY_CONFIG.REP_GAIN` from
1 to 3.

Progression with REP_GAIN=3:

| Event         | Rep after | Notes              |
|---------------|-----------|--------------------|
| Intro dialogue| 1         | NEUTRAL            |
| Supply run 1  | 4         | NEUTRAL            |
| Supply run 2  | 7         | NEUTRAL            |
| Supply run 3  | 10        | WARM, stage 1 unlocks |

3 supply runs over ~21 game days + travel. Earned but not tedious.

Post-stage progression (with quest reward rep fix already committed):

| Event              | Rep  | Next needs | Runs to fill |
|--------------------|------|------------|--------------|
| Stage 1 reward +15 | ~26  | 30 (stg 2)| 2 runs       |
| Stage 2 reward +15 | ~47  | 50 (stg 3)| 1 run        |
| Stage 3 reward +20 | ~70  | 70 (stg 4)| 0            |
| Stage 4 reward +20 | ~90  | 90 (stg 5)| 0            |

Total supply runs for entire quest: ~6.

### 2. Rep-aware greeting text (pre-quest)

Tanaka's greeting function already branches on quest stage and rep tier.
Split the default case (rep 0-9, pre-quest) into three sub-tiers:

- **Rep 0-3** (cold): Current text. "Tanaka. Engineer." She extends a
  hand, then withdraws it. "I have work to do. Unless you have business?"
- **Rep 4-6** (acknowledging): "You again." She doesn't look up, but she
  doesn't turn away either. "Your deliveries have been... adequate."
- **Rep 7-9** (near threshold): "Captain." She looks up from her work.
  "You keep bringing supplies. You ask nothing in return." A pause.
  "I may have a use for that reliability."

No numbers, no UI changes. Pure narrative progression through Tanaka's
voice.

### 3. Rep-aware supply contribution responses

The `research_supply` node currently picks randomly from 6 lines. Tier
them by rep instead:

- **Rep < 4** (transactional):
  - "Electronics. Good quality. These will work for the coupling array."
  - "I can use these. The drive prototype consumes components faster
    than I projected."
- **Rep 4-6** (grudging appreciation):
  - "You didn't have to do this. But I won't pretend it doesn't help."
  - "This saves me weeks of requisition paperwork. Appreciated."
- **Rep >= 7** (personal investment):
  - "Every delivery gets me closer. I won't forget that."
  - "Medical-grade sealant compounds. Useful for the containment
    housing. Thank you."

Same 6 lines, reorganized by warmth.

### 4. Captain's Briefing: mention ship quirks

The briefing (InstructionsModal) never mentions that the player's ship is
second-hand and has unique quirks. Players may not discover quirks until
they happen to check Ship Status. The UAT notes flagged this.

Add a short "Your Ship" section between Navigation and Stations:

> **Your Ship**
>
> *{shipName}* is second-hand — a Tanaka Mark III freighter.
> Every used ship has its quirks: maybe she sips fuel, maybe she
> handles like a brick. Check **Ship Status** to see what yours
> came with.

The component uses `useGameEvent(EVENT_NAMES.SHIP_NAME_CHANGED)` to get
the player's chosen ship name, same pattern as ShipStatus and
CargoManifestPanel.

## Files Changed

- `src/game/constants.js` — `TANAKA_SUPPLY_CONFIG.REP_GAIN`: 1 → 3
- `src/game/data/dialogue/tanaka-dialogue.js` — greeting text sub-tiers,
  supply response tiering
- `src/features/instructions/InstructionsModal.jsx` — new "Your Ship"
  section with ship name and quirks mention
- `tests/unit/quest-manager.test.js` — update supply rep gain assertions

## What We're Not Changing

- Rep thresholds for quest stages (10/30/50/70/90) — these are fine
- Supply cooldown (7 days) — preserves the "multiple visits" feel
- Supply quantity (5 units) — reasonable cargo cost
- Other NPC dialogue — Chen and Vasquez already have breadcrumbs
- No UI/number changes — visibility is purely narrative
