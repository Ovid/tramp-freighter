# Retirement Discoverability Design

**Date:** 2026-03-02
**Problem:** Two UAT passes have found that players cannot figure out how to "retire." The endgame is the Tanaka quest (a multi-stage NPC quest at Barnard's Star leading to the Pavonis Run), but players look for a menu option or credits threshold because the Captain's Briefing says "save up enough credits to retire."

**Root cause:** The breadcrumb chain is too deep. Tanaka requires 10 systems visited + docking at Barnard's Star. The primary hint NPC (Vasquez) requires FRIENDLY reputation at Epsilon Eridani. New players visit 3 systems in 34 days and never encounter any quest-related content.

**Constraint:** There should NOT be a retirement menu option. The solution is improving discoverability of the existing quest chain.

---

## Change 1: Captain's Briefing Rewrite

**File:** `src/features/instructions/InstructionsModal.jsx`

Rewrite the briefing to cover topics the UAT tester flagged as missing:

### "Your Goal" section
Reframe from wealth-threshold retirement to quest-driven endgame. Mention debt upfront. Hint at routes beyond the known lanes and the importance of knowing the right people. Do NOT spell out the Tanaka quest explicitly.

### "Stations" section
Expand to briefly mention:
- **Finance** — debt to Marcus Cole, withholding, interest
- **Info Broker** — market intelligence, rumors (strategic tool)
- **Missions** — free income that supplements trading
- **People** — NPC relationships that unlock benefits and opportunities

### "Navigation" and "The Science" sections
Keep as-is.

---

## Change 2: Dockworker Breadcrumb Events

**File:** `src/game/data/narrative-events.js`

Add two new one-time dockworker narrative events:

### Event: `dock_barnards_engineer_rumor`
- **Gate:** 5+ systems visited, `tanaka_met` flag NOT set
- **Fires once**, any system, medium priority
- **Content:** Dockworker mentions hearing about an engineer at Barnard's Star working on experimental drive modifications. She's selective about who she works with.
- **Choices:** Friendly acknowledgment / dismissive response

### Event: `dock_beyond_the_lanes_rumor`
- **Gate:** 3+ systems visited, no further conditions
- **Fires once**, any system, low priority
- **Content:** Dockworker mentions old traders talking about routes beyond the known starmap. Atmospheric/aspirational, no specific direction.
- **Choices:** Interested / dismissive

Both use existing dockworker voice and choice patterns.

---

## Change 3: Info Broker Tanaka Rumor

**File:** `src/game/game-information-broker.js`

Add a conditional Tanaka hint to `generateRumor()`:

- **Gate:** 5+ systems visited (from `gameState`), `tanaka_met` flag NOT set
- **Probability:** ~30% chance when conditions are met (otherwise falls through to normal market rumors)
- **Content:** Something like "There's an engineer at Barnard's Star — Tanaka. Works on experimental drive tech. Doesn't talk to just anyone."
- **Once only:** After this rumor fires, set a flag or check `tanaka_met` to prevent repetition

This requires reading narrative flags from `gameState`, which is already passed to `generateRumor()`. Add a constant for the systems-visited gate (5) to `constants.js`.

---

## Change 4: Barnard's Star Pre-Tanaka Event

**File:** `src/game/data/narrative-events.js`

New narrative event for players who arrive at Barnard's Star before meeting the 10-system threshold:

### Event: `dock_barnards_pre_tanaka`
- **Gate:** System 4 (Barnard's Star), `systemsVisited < TANAKA_UNLOCK_SYSTEMS_VISITED`, `tanaka_met` NOT set
- **Fires once**, high priority
- **Content:** Player asks around about the engineer. A dock tech says she doesn't talk to green pilots — come back with more flight time.
- **Choices:**
  - "How much flight time?" → Response hints it's about visiting more systems
  - "I'll be back." → ends

This turns a dead end into a confirmation: right place, not enough experience yet.

---

## Change 5: New Constants

**File:** `src/game/constants.js`

Add to `ENDGAME_CONFIG`:
- `BARNARDS_ENGINEER_RUMOR_SYSTEMS`: 5 (gate for dockworker and Info Broker hints)
- `BEYOND_LANES_RUMOR_SYSTEMS`: 3 (gate for atmospheric dockworker hint)
- `INFO_BROKER_TANAKA_CHANCE`: 0.3 (probability of Tanaka rumor from Info Broker)

---

## Change 6: UAT Notes Update

**File:** `uat-new-player-notes.md`

Append a section at the end categorizing all issues:

### Fixed by these changes:
- #5: Briefing doesn't mention debt
- #6: How much to retire?
- #87: Info Broker not mentioned in briefing
- #97: Retirement not mentioned anywhere
- #105: Retirement doesn't exist as mechanic (it does — Tanaka quest — discoverability improved)
- #106: Briefing too minimal

### Outstanding:
- #7: Starting cargo not explained in briefing
- #15: Currency inconsistency (cent vs cr)
- #31: Customs inspection UI scrolling issue
- #33/#61/#88: Fuel cost display overestimates by ~3%
- #39: Mission time trap (no deadline warning when accepting conflicting missions)
- #50: Buy Max doesn't reserve for fuel
- #52/#78: Repeated narrative events (may be coincidental per #78)
- #55/#56: Cargo over capacity from salvage (no consequences)
- #66/#100: Unknown modifiers (Sensitive Sensors, Fuel Sipper) not explained
- #68/#73: Failed negotiation has no consequence
- #77: Marcus Cole "heavier lien" message misleading

---

## Files Modified

1. `src/features/instructions/InstructionsModal.jsx` — Briefing rewrite
2. `src/game/data/narrative-events.js` — 3 new events (2 dockworker, 1 Barnard's pre-Tanaka)
3. `src/game/game-information-broker.js` — Tanaka rumor in generateRumor()
4. `src/game/constants.js` — New ENDGAME_CONFIG constants
5. `uat-new-player-notes.md` — Issue tracking update
