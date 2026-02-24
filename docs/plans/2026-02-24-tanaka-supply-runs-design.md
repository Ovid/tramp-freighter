# Tanaka Research Supply Runs - Design

**Date:** 2026-02-24
**Status:** Approved
**Problem:** Tanaka rep is entirely one-time (dialogue + quest rewards). A player who picks a few wrong dialogue options can get permanently locked out of endgame Stage 5 (requires 90 rep) with no recovery path.

---

## Solution

Add a repeatable "Contribute to Research" mechanic: the player donates qualifying cargo to Tanaka at Barnard's Star in exchange for small rep gains.

## Core Mechanic

- **Qualifying goods:** Electronics (drive components) and medicine (lab supplies)
- **Quantity per donation:** 5 units
- **Rep per donation:** +1
- **Cooldown:** 7 game days
- **Availability:** After `tanaka_met` flag is set, any quest stage
- **Preference:** If player has both goods, prefer electronics

Over a 90+ day playthrough, this yields roughly 12-15 extra rep — enough to recover from bad dialogue choices but not enough to skip dialogue entirely.

## Dialogue

New `research_supply` node in `tanaka-dialogue.js`. Triggered as an additional choice on Tanaka's greeting when conditions are met (5+ qualifying cargo, cooldown expired, `tanaka_met` true).

Choice text: "I brought supplies for your research."

Rotating acknowledgment lines (seeded random):

1. "Electronics. Good quality. These will work for the coupling array."
2. "Medical-grade sealant compounds. Useful for the containment housing. Thank you."
3. "I can use these. The drive prototype consumes components faster than I projected."
4. "You didn't have to do this. But I won't pretend it doesn't help."
5. "Every delivery gets me closer. I won't forget that."
6. "This saves me weeks of requisition paperwork. Appreciated."

No branching or follow-up choices. Quick and transactional — fits her character.

## Flow

1. Player docks at Barnard's Star, talks to Tanaka
2. Greeting node checks eligibility (cargo, cooldown, `tanaka_met`)
3. New choice appears alongside existing options: "I brought supplies for your research."
4. Tanaka responds with random line from pool
5. Cargo deducted, +1 rep applied, cooldown timer set
6. Returns to normal greeting

## Changes Required

**Modified files:**
- `src/game/data/dialogue/tanaka-dialogue.js` — new `research_supply` node
- `src/game/state/managers/quest-manager.js` or `npc.js` — eligibility check + donation processing
- `src/game/constants.js` — new constants
- `src/game/state/game-state-manager.js` — delegation method if needed
- Save data schema — cooldown timestamp

**New constants:**
- `TANAKA_SUPPLY_QUANTITY: 5`
- `TANAKA_SUPPLY_REP: 1`
- `TANAKA_SUPPLY_COOLDOWN_DAYS: 7`
- `TANAKA_SUPPLY_GOODS: ['electronics', 'medicine']`

**No new files, managers, or UI components.**

## Edge Cases

- Player has both electronics and medicine: prefer electronics
- Player has exactly 5 units: valid, donates all
- Cooldown persists across save/load via game state timestamp
- Supply runs work independently of quest stage progression
