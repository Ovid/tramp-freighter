# Narrative Truth Audit — Design Document

Date: 2026-02-28
Status: **IMPLEMENTED** — All 12 findings resolved on branch `ovid/narrative-messages-are-real`

## Problem

Player-facing text across narrative events, danger encounters, and NPC dialogue makes promises or implies consequences that the game engine doesn't deliver. This ranges from paying credits for nothing (dock_cheap_fuel) to dead code fields that silently discard intended effects (strengthIncrease, triggerPatrolCombat).

## Audit Findings

Full findings are in `docs/narrative-audit-log.md`. Summary: 12 issues found across 3 severity tiers.

---

## Fixes

### Tier 1: Player Pays and Gets Nothing

#### 1. `dock_cheap_fuel` — Add fuel reward

**File:** `src/game/data/narrative-events.js` (lines 118-150)
**File:** `src/features/danger/applyEncounterOutcome.js`

The "Deal" choice costs 50 credits but rewards nothing. Fix:

- Add new reward type `fuelMinimum` to effect schema.
- Handler in `applyEncounterOutcome.js`: `fuel = Math.max(currentFuel, fuelMinimum)` — sets fuel to at least the given percentage.
- Update the event's "Deal" choice: `rewards: { fuelMinimum: 30 }`.
- Player pays 50 credits, fuel is topped up to 30% (from whatever sub-20% level triggered the event).

#### 2. Whisper intel discounts — Wire existing infrastructure

**File:** `src/features/info-broker/` (InformationBroker pricing method)
**File:** `src/game/state/managers/npc.js` (getServiceDiscount already exists)

- In InformationBroker's price calculation, call `NPCManager.getServiceDiscount('intel')` for the current system's NPC.
- Apply returned multiplier to intel cost.
- No text changes needed — dialogue already accurately describes the tiers.

#### 3. Rusty repair discounts — Wire existing infrastructure

**File:** `src/game/state/managers/repair.js` (calculateRepairCost)
**File:** `src/game/state/managers/npc.js` (getServiceDiscount already exists)

- In `RepairManager.calculateRepairCost()`, call `NPCManager.getServiceDiscount('repair')` for the current system's NPC.
- Apply returned multiplier to repair cost.
- No text changes needed.

---

### Tier 2: Dead Code / Broken Mechanics

#### 4. Remove `strengthIncrease` from negotiation outcomes

**File:** `src/game/state/managers/negotiation.js` (3 locations)

Remove `strengthIncrease` from all three failure outcome cost objects. Update player-facing text to not claim escalation:

| Current Text | New Text |
|---|---|
| "Pirates are now more aggressive" | "The pirates don't take kindly to your offer." |
| "They are not pleased" | "They see through the lie." |
| "No useful intelligence" | "You have nothing they want." |

#### 5. Convert `reputationPenalty` to `factionRep`

**File:** `src/game/state/managers/negotiation.js` (~line 234)

Replace `reputationPenalty: -10` with the existing handled structure:
```javascript
rewards: { factionRep: { authority: -10 } }
```

This makes the intel-offer-detected failure correctly penalize authority rep, matching what the success path already does.

#### 6. Remove `triggerPatrolCombat`, add flee costs, honest text

**File:** `src/game/state/managers/inspection.js` (~line 189)

- Remove `triggerPatrolCombat: true` from the outcome.
- Add meaningful flee costs: `costs: { fuel: 5, hull: 5 }` (emergency burn damages ship).
- Add `rewards: { factionRep: { authority: -15 } }` (fleeing is worse than bribing).
- Update text: "You punch the throttle and break away from the inspection zone. The emergency burn costs fuel and rattles the hull."

---

### Tier 3: Misleading Text

#### 7. Combat return fire — Disclose hull damage

**File:** `src/game/state/managers/combat.js` (~line 168)

Change outcome text from:
> "Successfully drove off the pirates with return fire."

To:
> "You drove off the pirates, but not before taking some hits. Your hull shows fresh scoring."

#### 8. Inspection bribe — Hint at reputation cost

**File:** `src/game/state/managers/inspection.js` (~line 158)

Change outcome text from:
> "Successfully bribed customs inspector and avoided inspection."

To:
> "The inspector pockets your credits and waves you through. You doubt this will stay off the books."

#### 9. Inspection cooperate — Outcome-specific text

**File:** `src/game/state/managers/inspection.js` (~line 123)

Replace single generic message with three variants based on outcome branch:

- **Clean:** "Inspection complete. Everything checks out. The inspector nods approvingly."
- **Restricted goods found:** "The inspector's expression hardens. Restricted goods. There will be a fine."
- **Hidden cargo found:** "They found the hidden compartment. This is going to be expensive."

The inspection manager already knows which branch was taken — just set different text per branch.

#### 10. Dock rumor — Make truthful via `generateContent`

**File:** `src/game/data/narrative-events.js` (dock_generic_rumor)
**File:** `src/game/state/managers/event-engine.js`

Add optional `generateContent(gameState)` function to event schema. When present, the event engine calls it instead of using static `content.text`.

The function for `dock_generic_rumor`:
1. Check `state.world.activeEvents` for any current economic events. If found, generate a tip about that system/commodity.
2. Else check `state.world.priceKnowledge` for price anomalies across known systems.
3. Fallback: vague generic tip.

Text template pool:
- "Word is {good} is moving fast out near {system}."
- "Heard {good} prices are through the roof at {system}. Just saying."
- "Friend of mine just came from {system}. Says {good} is selling like water in a desert."

Choices and effects remain unchanged.

#### 11. Cole threat — Match actual mechanic

**File:** `src/game/data/narrative-events.js` (time_debt_warning, line 301-303)

Change text from:
> "Grace period's over. Interest starts accruing. Don't make me come looking for you."

To:
> "Grace period's over. Interest starts accruing. And the lien on your trades just got heavier."

Truthfully describes the actual consequence (increasing withholding %).

---

### Tier 4: Missing Content

#### 12. Populate NPC tips

**File:** `src/game/data/npc-data.js` (tips arrays for all 11 NPCs)

Write 2-3 tips per NPC reflecting their personality and expertise:

- **Whisper** (info broker): Market intelligence — commodity route strategies, event patterns
- **Rusty** (mechanic): Ship maintenance — when to repair, fuel efficiency, system priorities
- **Vasquez** (captain): Navigation — dangerous zones, efficient routes, wormhole shortcuts
- **Kim** (trader): Trading meta — tech level pricing, temporal cycle awareness
- **Kowalski/Liu** (station ops): Local knowledge — what sells at their station, nearby opportunities
- **Other NPCs:** Tips matching their established personality and role

Tips must be mechanically truthful — reference real game systems (tech levels, temporal cycles, danger zones) without hardcoding specific prices or system names that could be wrong.

---

## Implementation Order

1. Tier 1 fixes (items 1-3) — highest player impact, mostly wiring
2. Tier 2 fixes (items 4-6) — dead code cleanup and rebalancing
3. Tier 3 text fixes (items 7-9, 11) — trivial text changes
4. Tier 3 dynamic rumor (item 10) — medium complexity, new event engine feature
5. Tier 4 content (item 12) — NPC tip writing, medium effort

## Testing

- Each fix needs at least one test verifying the mechanic now works
- Narrative event effects: test that `dock_cheap_fuel` "Deal" choice results in fuel >= 30%
- Discount wiring: test that intel/repair costs decrease with NPC reputation
- Dead code removal: test that negotiation/inspection outcomes don't contain unhandled fields
- Dynamic rumor: test that generated text references real market conditions
- NPC tips: test that each NPC has non-empty tips array

## Implementation Notes

All fixes implemented with TDD (test first, then implementation). Full test suite passes (274 files, 2410 tests).

New test files:
- `tests/unit/refuel-npc-discount.test.js`
- `tests/unit/repair-npc-discount.test.js`
- `tests/unit/intel-npc-discount.test.js`
- `tests/unit/negotiation-outcomes.test.js`
- `tests/unit/inspection-flee-costs.test.js`
- `tests/unit/outcome-text-honesty.test.js`
- `tests/unit/dynamic-rumor.test.js`
