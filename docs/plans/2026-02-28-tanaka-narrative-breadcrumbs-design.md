# Tanaka Quest Narrative Breadcrumbs

## Problem

When a player meets Yuki Tanaka, the game provides no narrative hints on how to progress through her quest arc. Yuki is guarded by design (trust: 0.2), which means she won't tell the player what she needs. The supply run mechanic (donate 5 electronics or medicine for +1 rep) is invisible unless you happen to have the right cargo. Players get stuck at every phase: before discovery, building initial trust, and between quest stages.

## Solution

Add a breadcrumb trail through **Wei Chen** and **Captain Vasquez** dialogue trees. Other NPCs speak plainly about Yuki while Yuki herself stays in character as guarded. Breadcrumbs are layered by phase and eligibility-aware — if the player isn't eligible for the Tanaka arc yet, hints guide them toward eligibility first.

## Design

### Phase 1: Pre-Discovery Breadcrumbs

Before the player meets Yuki (`tanaka_met` flag NOT set), Wei Chen and Vasquez hint at her existence. Hints adapt based on eligibility (systems visited vs `TANAKA_SYSTEMS_REQUIRED` from constants).

**Wei Chen** (same station as Yuki — strongest hint):
- New dialogue choice: casual station gossip about the engineer in the back bay
- If systems visited < threshold: mentions Tanaka but notes she only talks to experienced captains
- If systems visited >= threshold: suggests the player might actually get her attention
- No rep requirement (available from first conversation)
- No rep gain (just gossip)
- Disappears once `tanaka_met` is set

**Captain Vasquez** (retired trader, knows the network):
- New conditional dialogue choice
- If systems visited < threshold: general encouragement to explore more systems first
- If systems visited >= threshold and `tanaka_met` NOT set: directly recommends visiting Barnard's to meet the Tanaka Drive designer's daughter
- Disappears once `tanaka_met` is set

### Phase 2: Post-Meeting, Pre-Stage 1 (rep 0 to 10)

After meeting Yuki but before starting her first quest stage, Wei Chen and Vasquez explicitly surface the supply run mechanic.

**Wei Chen:**
- New dialogue choice: "Know anything about Tanaka?"
- Condition: `tanaka_met` AND quest stage is 0
- Plainly states: bring her electronics or medicine (5 units) — she won't ask for help but won't turn it down
- Directly solves the discovery gap for the supply run mechanic

**Captain Vasquez:**
- New dialogue choice: "I met that engineer at Barnard's. She barely talked to me."
- Condition: `tanaka_met` AND quest stage is 0
- Strategic advice: bring research supplies, show up consistently, she'll come around
- Sets expectations that trust-building takes time

### Phase 3: Mid-Quest Stage Guidance

**During stages:** Yuki's own dialogue already states objectives per stage. No changes needed.

**Between stages (rep gaps):** When a stage is complete but rep is too low for the next, players currently get stuck with no guidance (Design Note #2 from endgame-fixes.md).

**Wei Chen:**
- Condition: `tanaka_met` AND quest stage > 0 AND player can't start the next stage
- Encouragement to keep bringing research supplies
- Reinforces supply runs as the path forward

**Captain Vasquez:**
- Condition: same as Wei Chen
- More strategic framing: building trust takes time, keep showing up

**Stage 5 eligibility (material requirements):**
- Vasquez provides specific guidance when player has the rep but not the material prerequisites
- Explicitly names requirements in character: ship in top shape, fuel money, no debts
- Condition: quest stage is 4 complete, rep >= 90, but missing hull/engine/credits/debt requirements

### Eligibility Threshold Change

The Tanaka intro narrative event currently requires 5 systems visited. This is changing to **10 systems**, controlled by a new `TANAKA_SYSTEMS_REQUIRED` constant in `constants.js`. Both the narrative event and NPC hints reference this constant.

## Files to Modify

| File | Changes |
|------|---------|
| `src/game/constants.js` | Add `TANAKA_SYSTEMS_REQUIRED: 10` |
| `src/game/data/narrative-events.js` | Update `tanaka_intro` to use constant (currently hardcoded 5, now 10) |
| `src/game/data/dialogue/wei-chen.js` | Add `station_gossip`, `tanaka_gossip`, `tanaka_progress` nodes |
| `src/game/data/dialogue/captain-vasquez.js` | Add `barnards_engineer`, `tanaka_advice`, `tanaka_patience`, `pavonis_prep` nodes |
| `src/game/game-dialogue.js` | Expose `systemsVisited` on context object if not already available |

## Files NOT Modified

- Yuki's dialogue tree (she stays in character)
- Quest mechanics or reward timing
- Other NPCs beyond Wei Chen and Vasquez

## Testing

- Unit tests for new dialogue conditions (flag states, quest stages, system counts)
- Verify existing dialogue tests still pass
- Property tests for condition edge cases (exactly 10 systems visited boundary)
