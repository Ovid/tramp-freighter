# UAT: Retirement Hints & Quest Progression

**Date:** 2026-03-10
**Branch:** ovid/uat
**Tested against:** docs/plans/2026-03-10-retirement-hints-and-progression-design.md

---

## Results Summary

| # | Change | Result | Notes |
|---|--------|--------|-------|
| 1 | Marcus Cole hint on first debt payment | PASS | Fires as dock narrative on next station visit after first payment |
| 2 | Dockworker hint text revision | PASS (code verified) | "pushing ships further than the wormhole network was meant to go" |
| 3 | Barnard's Star gating text | PASS | Visually verified in-game |
| 4 | Info Broker Tanaka rumor | PASS (code verified) | "beyond the known lanes" text present |
| 5 | Exotic matter scanner feedback | PASS | Notifications with [x/5] count tracking |
| 6 | Tanaka stage-aware greetings | PASS | All stages have progress-aware greetings |
| 7 | Stage 4 dialogue acceptance | PASS | Backstory and decline options added (commit 11e8f06) |
| 8 | "(Ready!)" indicator fix | PASS (code verified) | Shows tier name when requirements unmet |

**Passed:** 8 / 8
**Failed:** 0 / 8

---

## Detailed Findings

### 1. Marcus Cole Hint on First Debt Payment — PASS

Made a 1,000 credit debt payment via Finance panel at Sol Station. The hint did not appear immediately in the Finance UI. It fired as a dock narrative event on the next station visit (Barnard's Star). Text:

> "Good. You're learning." A pause. "But clearing your slate is just the first step — the captains who really get out of this life? They made the right friends along the way."

Matches plan. Player gets a single response option: "I'll keep that in mind." Event is one-time (once: true).

### 2. Dockworker Hint Text Revision — PASS (code verified)

Event `dock_barnards_engineer_rumor` in `src/game/data/narrative-events.js` (line 195) contains revised text:

> "pushing ships further than the wormhole network was meant to go"

Gated by `BARNARDS_ENGINEER_RUMOR_SYSTEMS: 5` (must visit 5+ systems). Could not trigger via black-box testing in a fresh game, but text matches plan exactly.

### 3. Barnard's Star Gating Text — PASS

Visually confirmed in-game on third dock at Barnard's Star Station. Text:

> "Tanaka? Yeah, she's here. But she doesn't talk to green pilots."
> "She wants pilots who've seen the sector — been to enough ports to prove they're not just running one lane back and forth."

Matches plan. Replaces old vague "flight time" language with actionable "enough ports" guidance.

### 4. Info Broker Tanaka Rumor — PASS (code verified)

`generateRumor()` in `src/game/game-information-broker.js` (line 177) returns:

> "There's an engineer at Barnard's Star — Tanaka. Works on drive tech that could push ships beyond the known lanes. Doesn't talk to just anyone, though."

Gated by `BARNARDS_ENGINEER_RUMOR_SYSTEMS: 5` and RNG. Text matches plan.

### 5. Exotic Matter Scanner Feedback — PASS

Implemented as info notifications in `App.jsx` (lines 122-146), driven by events from `quest-manager.js`:

- **New sample:** "Scanner: Exotic matter detected. Sample collected. [3/5]"
- **Already sampled:** "Scanner: Already sampled this station."

Text is simplified from the plan's narrative-style phrasing but provides the same information: sample count, progress toward total, and already-sampled guard. Gate: Stage 2 active + station >15 LY from Sol. No explicit scanner module installation check, but Stage 2 implies scanner is present (given during stage 1 completion).

### 6. Tanaka Stage-Aware Greetings — PASS

All stages have greeting text that reflects the current quest objective:

- **Stage 1:** Shows remaining jumps needed ("X more jumps needed to calibrate the drive harmonics")
- **Stage 2:** Shows exotic sample progress ("You have X of 5 samples so far... Keep searching stations beyond 15 light-years from Sol")
- **Stage 3 complete:** Transitions to personal request ("I have one more request. A personal one.")
- **Stage 4:** Asks about message delivery ("My message for Captain Vasquez — have you delivered it yet?")
- **Stage 5:** Final readiness check ("Everything is in place... Are you?")
- **Between stages:** `getRequirementHint()` provides specific unmet-requirement feedback (engine, hull, debt, credits, rep)

Text wording differs from plan's verbatim examples but serves the same purpose: players always know what Tanaka needs from them.

### 7. Stage 4 Dialogue Acceptance — PASS (fixed in 11e8f06)

`mission_4_offer` now provides four choices:

1. "Of course. I'll deliver it personally." (5 rep, advances quest)
2. "I'll take care of it." (3 rep, advances quest)
3. "Tell me more about Yumi first." (opens backstory, then accept/decline)
4. "I'm not heading that way yet." (decline, returns to greeting)

New `mission_4_yumi_backstory` node provides Yumi's backstory, then offers accept ("I'll get it there", 5 rep, advances quest) or decline ("I need some time to think about it", returns to greeting). Matches plan requirements for player agency over pacing.

### 8. "(Ready!)" Indicator Fix — PASS (code verified)

`DialoguePanel.jsx` (lines 134-143) correctly implements the fix:

- Trust threshold met AND `allRequirementsMet === true` → displays "(Ready!)"
- Trust threshold met BUT `allRequirementsMet === false` → displays tier name (e.g., "(Family)")

This prevents the false signaling identified in the plan where "(Ready!)" appeared when the player couldn't actually advance.

---

## Other Findings

### Dev Admin Panel dropdown styling (fixed)

The native `<select>` dropdowns in the Dev Admin Panel rendered with default OS light styling, clashing with the dark sci-fi theme. Fixed by adding `color-scheme: dark` and explicit dark `<option>` styling in `css/panel/dev-admin.css`. Committed as `2b72445`.

---

## Fixes Applied

| Commit | Description |
|--------|-------------|
| `2b72445` | Style native select dropdowns in Dev Admin Panel with dark theme |
| `11e8f06` | Add Stage 4 dialogue acceptance options and backstory path with tests |
