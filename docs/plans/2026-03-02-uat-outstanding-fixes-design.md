# UAT Outstanding Fixes Design

Date: 2026-03-02
Source: uat-new-player-notes.md (outstanding issues section)

## Overview

Ten remaining issues from UAT new-player testing. Two issues (#39 mission deadline warnings, #50 Buy Max fuel reservation) marked WONTFIX as intentional "learn by doing" difficulty.

## Fix 1: Fuel Cost Display (#33/61/88)

**Problem:** SystemPanel shows base fuel cost via `calculateFuelCost(distance)`. Actual jumps use `calculateFuelCostWithCondition(...)` which applies engine condition, quirks (e.g. Fuel Sipper -15%), and upgrades. Result: displayed cost consistently overestimates by ~3%.

**Fix:** SystemPanel uses the same quirk-aware calculation as JumpDialog. Both pull current engine condition, quirks, and upgrades from game state.

**Files:** `src/features/navigation/SystemPanel.jsx`, possibly `src/game/game-navigation.js` (convenience method).

**Tests:** Property test that for any distance/quirk/upgrade combo, SystemPanel displayed cost matches JumpDialog displayed cost matches actual fuel deducted.

## Fix 2: Currency Standardization (#15)

**Problem:** Codebase mixes `¢`, `₡`, `cr`, and bare numbers for credits.

**Fix:** Standardize all credit displays to `₡`. Search-and-replace across all components.

**Files:** `TradePanel.jsx`, `CargoManifestPanel.jsx`, `MissionBoardPanel.jsx`, and any other panel displaying credit amounts.

**Tests:** Render tests per component verifying `₡` symbol appears and no `¢` or `cr` symbols remain. Grep sweep post-fix.

## Fix 3: Customs Inspection UI (#31)

**Problem:** Confirm button hidden below fold. Option cards look clickable but aren't. Pirate encounter panel already does this correctly.

**Fix:** Make option cards directly clickable — clicking confirms that option immediately, matching PirateEncounterPanel. Remove separate confirm/reconsider buttons.

**Files:** `src/features/danger/InspectionPanel.jsx`.

**Tests:** Integration test that clicking an option card triggers the resolution callback. Verify no orphaned confirm button renders.

## Fix 4: Cargo Capacity from Salvage (#55/56)

**Problem:** Salvage events add cargo without checking capacity, allowing overflow (e.g. 53/50).

**Fix:** Cap salvage to available cargo space. Adjust messaging:
- Full hold: "Your hold is full — nothing salvaged."
- Partial fit: "Could only fit 2 of 3 units." (singular: "Could only fit 1 of 3 units.")
- Full fit: existing message unchanged.

**Files:** `src/features/danger/transformOutcome.js`, possibly `src/features/cargo/cargoUtils.js` for `getAvailableCargoSpace()`.

**Tests:** Unit tests for full hold (0), partial fit, full fit. Property test that cargo never exceeds capacity after salvage.

## Fix 5: Failed Negotiation Escalates to Combat (#68/73)

**Problem:** Failed counter-proposal returns empty result, encounter ends. Text promises "combat likely" but nothing happens.

**Fix:** Failed negotiation escalates to pirate combat encounter:
1. `NegotiationManager` returns `{ success: false, escalate: true }` on failure.
2. Encounter flow transitions from NegotiationPanel to PirateEncounterPanel.
3. Combat gets +10% threat bonus (pirates are angry).
4. Negotiate option disabled in escalated combat ("They're done talking").

**Files:** `src/game/state/managers/negotiation.js`, `src/features/danger/NegotiationPanel.jsx`, `src/features/danger/PirateEncounterPanel.jsx`.

**Tests:** Unit test that failed negotiation returns `escalate: true`. Integration test for encounter flow transition. Test that Negotiate is disabled in escalated mode.

## Fix 6: Debt Escalation (#77)

**Problem:** Marcus Cole says "the lien just got heavier" but withholding and interest rates don't change. Message is misleading.

**Fix:** Actually escalate both rates per debt heat tier:

| Tier   | Withholding | Interest | Trigger                         |
|--------|-------------|----------|---------------------------------|
| Grace  | 5%          | 3%       | Game start                      |
| Medium | 7%          | 4%       | Grace period ends               |
| High   | 10%         | 5%       | Missed payment / prolonged debt |

Cole's dialogue stays as-is — it becomes truthful. Finance panel already reads current rates from state.

**Files:** `src/game/constants.js` (tier rate table in `DEBT_CONFIG`), debt heat manager, `FinancePanel.jsx` (verify).

**Tests:** Unit tests for tier transitions updating both rates. Test trade revenue applies correct withholding per tier. Test interest uses tier-appropriate rate.

## Fix 7: Ship Quirks Display (#66/100)

**Problem:** Ship Status shows quirk names but lacks descriptions and mechanical effects. Players see "Sensitive Sensors" in encounters with no context.

**Fix:** Enrich Ship Status quirk section to show:
- Name (already shown)
- Description (flavor text from constants.js)
- Effects in plain language (e.g. "-15% fuel consumption")

Add human-readable effect labels to quirk definitions in constants.js.

**Files:** `src/features/ship-status/ShipStatusPanel.jsx`, `src/game/constants.js`.

**Tests:** Render test that Ship Status displays names, descriptions, and effects for each assigned quirk.

## Fix 8: Narrative Event Deduplication (#52/78)

**Problem:** Same dockworker tip fired at different stations in short succession.

**Fix:** Ensure cooldowns are global (not per-station). Set non-zero cooldown (10 game days) on dockworker tip events. Verify event-engine checks cooldowns globally.

**Files:** `src/game/data/narrative-events.js` (cooldown values), `src/game/state/managers/event-engine.js` (global cooldown check).

**Tests:** Unit test that after a tip fires at station A, same event is blocked at station B within cooldown window. Test that different tips can still fire.

## Fix 9: Starting Cargo in Briefing (#7)

**Problem:** Player starts with 20 Grain but briefing never mentions it. "Cargo 20/50" is confusing.

**Fix:** Add a line to Captain's Briefing: "Your hold has 20 units of grain — enough to start trading. Check the Cargo Manifest to see what you're carrying."

**Files:** `src/features/instructions/InstructionsModal.jsx`.

**Tests:** Render test that briefing mentions starting cargo/grain.

## WONTFIX

| #  | Issue                           | Reason                        |
|----|---------------------------------|-------------------------------|
| 39 | Mission deadline warnings       | Intentional learn-by-doing    |
| 50 | Buy Max doesn't reserve for fuel | Intentional learn-by-doing   |
