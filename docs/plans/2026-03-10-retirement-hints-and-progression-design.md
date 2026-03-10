# Retirement Hints & Quest Progression Design

**Date:** 2026-03-10
**Problem:** Multiple UAT passes confirm players cannot figure out how to retire. Previous fixes (2026-02-28 tanaka-narrative-breadcrumbs, 2026-03-02 retirement-discoverability) added dockworker hints and NPC dialogue, but the March 9 UAT still failed to discover the retirement path after 9 systems and 3+ hours of play. Additionally, players who DO find Tanaka report opaque quest progression with no feedback on objectives.

**Root causes identified:**

1. **Discovery gap:** Existing hints mention "drive mods" and "engineer at Barnard's Star" but never connect to the briefing's "routes beyond the known lanes." Players interpret "drive mods" as ship upgrades, not endgame content.
2. **No bridge from active goal to retirement path:** Players are focused on debt repayment. No hint connects paying debt to the retirement quest. Marcus Cole — the NPC players think about constantly — says nothing about what comes after.
3. **Progression opacity:** After meeting Tanaka, players have no visibility into quest objectives. Exotic matter collection is silent. Stage 4 dialogue teases a mission but won't let you accept it. The "(Ready!)" indicator lies.

**Relationship to prior designs:**
- Supersedes the text content of existing dockworker and gating events from the 2026-03-02 design
- Adds new changes not covered by either prior design (Cole hint, exotic matter feedback, Tanaka greeting rework, Stage 4 fix, Ready indicator fix)
- Does NOT change Wei Chen or Vasquez dialogue additions from tanaka-breadcrumbs design

---

## Part 1: Discovery Improvements

### Change 1: Marcus Cole Hint on First Debt Payment

**File:** `src/game/data/dialogue/marcus-cole.js` or debt payment handler

When the player makes their first debt payment, Cole responds with a line that bridges debt repayment to the broader goal:

> "Good. You're learning. But clearing your slate is just the first step — the captains who really get out of this life? They made the right friends along the way."

**Gate:** First debt payment only (one-time event)
**Purpose:** Connects the player's active goal (debt) to "right friends" (NPCs/Tanaka) and "get out" (retirement exists). Uses the character the player is already most engaged with.

### Change 2: Dockworker Hint Text Revision

**File:** `src/game/data/narrative-events.js`
**Event:** `dock_barnards_engineer_rumor` (already exists, revise text)

Current text mentions "experimental drive mods" which players interpret as ship upgrades. Revised text connects to the briefing's "routes beyond the known lanes":

> "Hey, you run a Tanaka drive, right? Heard the designer's daughter works out of Barnard's Star. Does something with experimental drive tech — pushing ships further than the wormhole network was meant to go."
>
> He lowers his voice. "Picky about who she works with, though."

**Change:** Add "pushing ships further than the wormhole network was meant to go" to echo the briefing's "routes beyond the known lanes."

### Change 3: Barnard's Star Gating Text Revision

**File:** `src/game/data/narrative-events.js`
**Event:** `dock_barnards_pre_tanaka` (already exists, revise text)

Current text says "come back with more flight time" which is too vague. Players don't know what "flight time" means concretely. Revised:

> "Tanaka? Yeah, she's here. But she doesn't talk to green pilots."
>
> "She wants pilots who've seen the sector — been to enough ports to prove they're not just running one lane back and forth."

**Change:** Replace vague "flight time" with specific "seen the sector" / "enough ports" guidance while staying in-character.

### Change 4: Info Broker Tanaka Rumor Text Revision

**File:** `src/game/game-information-broker.js`

The existing Tanaka rumor in `generateRumor()` exists but doesn't connect to the briefing. Revised text:

> "There's an engineer at Barnard's Star — Tanaka. Works on drive tech that could push ships beyond the known lanes. Doesn't talk to just anyone, though."

**Change:** Add "beyond the known lanes" to connect to briefing language. Low priority since players rarely buy rumors.

---

## Part 2: Quest Progression Improvements

### Change 5: Exotic Matter Scanner Feedback

**File:** `src/game/data/narrative-events.js` (new event) and/or `src/game/state/managers/quest-manager.js`

When docking at a station >15 LY from Sol with the scanner module installed (Stage 2 active), fire a narrative event:

**New station with exotic matter:**
> Your scanner module chirps. "Exotic matter signature detected," the readout flashes. Sample collected and stored automatically.
>
> *[3/5 samples collected]*

**Station already sampled:**
> Scanner module pulses briefly, then goes quiet. Already sampled this station's signature.

**Gate:** Scanner module installed, Stage 2 active, station >15 LY from Sol
**Purpose:** Eliminates the #1 clarity issue from UAT — players currently get zero feedback when exotic matter is collected.

### Change 6: Tanaka Greeting Reflects Current Objective

**File:** `src/game/data/dialogue/yumi-tanaka.js` or `tanaka-dialogue.js`

Tanaka's greeting (first line when you talk to her) should state what she currently needs, in her voice. This replaces the current greeting which loops through backstory without directing the player.

- **Stage 1 (Field Test):** "I need real flight data from that drive of yours. Make three jumps — anywhere — and bring the readings back to me. The sensors will record automatically."
- **Stage 2 (Rare Materials):** "The scanner module I gave you will pick up exotic matter at distant stations — far from Sol. I need five samples before I can calibrate the prototype."
- **Stage 3 (Prototype), requirements not met:** "The prototype is ready, but I won't install it on a ship that's falling apart. Get your hull above 70% and your engine above 80%, then we'll talk."
- **Stage 3 (Prototype), requirements met:** "Your ship's in good shape. Ready for the prototype installation?"
- **Stage 4 (Personal Request):** "There's something I need to ask. Captain Vasquez at Epsilon Eridani knew my sister. I have a message — ten years of things I should have said. Would you deliver it?"
- **Stage 5 (Final Preparations), requirements not met:** "We're close. But this jump is one-way — I need to know you're ready. Clear your debt, get your ship in shape, and have enough credits to start a new life."
- **Stage 5 (Final Preparations), requirements met:** "We're ready. Are you?"

**Note:** This reverses the tanaka-breadcrumbs design's assertion that "Yuki's own dialogue already states objectives per stage. No changes needed." The March 9 UAT proved it IS needed.

### Change 7: Stage 4 Dialogue Acceptance Fix

**File:** `src/game/data/dialogue/yumi-tanaka.js` or `tanaka-dialogue.js`

Tanaka's Stage 4 dialogue says "A message that needs delivering" but the dialogue tree doesn't let the player accept it. This is either a bug or incomplete implementation.

**Fix:** When Tanaka is at Stage 4 and presents the delivery request, provide acceptance options:

- *"I'll get it there."* — Accepts delivery, sets quest flag, data chip tracked
- *"Tell me more about Yumi first."* — Opens sister backstory, returns to accept option
- *"I'm not heading that way yet."* — Declines for now, available next visit

### Change 8: "(Ready!)" Indicator Fix

**File:** Trust bar display component (likely in dialogue or NPC UI)

Current behavior: Shows "(Ready!)" when trust threshold is met for the next stage, regardless of other requirements (ship condition, credits, debt).

**Fix:** Show the relationship tier name (Trusted, Family, etc.) when trust is met but other requirements are NOT met. Reserve "(Ready!)" for when ALL requirements for the next stage are satisfied.

- Trust met, other requirements not met: "(Family)"
- Trust met AND all requirements met: "(Ready!)"

This prevents false signaling that the player can advance when they can't.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/game/data/narrative-events.js` | Revise dockworker hint text (#2), revise gating text (#3), add exotic matter scanner event (#5) |
| `src/game/game-information-broker.js` | Revise Tanaka rumor text (#4) |
| `src/game/data/dialogue/yumi-tanaka.js` | Stage-aware greetings (#6), Stage 4 acceptance fix (#7) |
| Marcus Cole dialogue or debt payment handler | First debt payment hint (#1) |
| Trust bar display component | "(Ready!)" logic change (#8) |
| `src/game/constants.js` | Any new constants for gates/thresholds |

## Testing

- Unit tests for Cole's first-payment hint trigger (fires once, correct text)
- Unit tests for revised narrative event text
- Unit tests for exotic matter scanner events (correct station distance check, count display, already-sampled guard)
- Unit tests for Tanaka stage-aware greetings (each stage, requirements met vs not met)
- Unit tests for Stage 4 acceptance flow (accept, decline, backstory-then-accept)
- Unit tests for "(Ready!)" display logic (trust only vs all requirements)
- Integration test: full discovery chain from briefing through meeting Tanaka
- Verify existing dialogue and quest tests still pass
