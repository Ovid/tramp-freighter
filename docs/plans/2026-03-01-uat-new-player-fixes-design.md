# UAT New Player Experience Fixes

**Date:** 2026-03-01
**Source:** uat-new-player-notes.md (UAT run on ovid/full-uat-from-player-perspective branch)

## Overview

Four issues from the new player UAT require immediate fixes. Two are confirmed
bugs (customs UI mismatch, Cole dialogue), one is a display bug (snake_case
names), and one is a critical discoverability gap (Tanaka questline invisible
after paying off debt).

## Fix 1: Customs UI Legal/Restricted Mismatch

**UAT Issues:** #1, #2 (partial)

**Problem:** `InspectionPanel.jsx`'s `isGoodRestrictedInZone()` only checks
zone-based restrictions from `RESTRICTED_GOODS_CONFIG`. The backend
`countRestrictedGoods()` in `danger.js` also checks `MISSION_CARGO_TYPES.illegal`
for cargo with a `missionId`. Result: UI shows "Legal" for illegal mission cargo,
but the backend fines the player. The "Guaranteed Success" label for Cooperate is
misleading when restricted goods are present.

**Files:**
- `src/features/danger/InspectionPanel.jsx` — `isGoodRestrictedInZone()`,
  `calculateInspectionAnalysis()`

**Changes:**
- Modify `isGoodRestrictedInZone()` to accept the cargo item (not just good type)
  and check if it's illegal mission cargo:
  ```
  const illegalMissionCargo =
    cargoItem?.missionId &&
    MISSION_CARGO_TYPES.illegal.includes(goodType);
  return zoneRestricted || coreSystemRestricted || illegalMissionCargo;
  ```
- Update the caller in `calculateInspectionAnalysis()` to pass the full cargo item.
- Ensure the Cooperate option text reflects that restricted cargo will result in
  fines (not "Guaranteed Success" when restricted items are present).

## Fix 2: Snake_case Commodity Display Names

**UAT Issue:** #2

**Problem:** `formatCommodityName("unmarked_crates")` returns `"Unmarked_crates"`.
The function only capitalizes the first character and doesn't handle underscores.

**Files:**
- `src/features/danger/InspectionPanel.jsx` — `formatCommodityName()`
- `src/game/utils/string-utils.js` — move the function here (commodity names
  appear in multiple places)

**Changes:**
- Replace underscores with spaces, then title-case each word.
- Move the utility to `string-utils.js` so it can be reused. Update the import in
  InspectionPanel.jsx.
- Check for other callers that format commodity names and consolidate.

## Fix 3: Marcus Cole Debt-Cleared Dialogue

**UAT Issues:** #8, #4/#9 (partial — provides first Tanaka breadcrumb)

**Problem:** Cole has no dialogue branch for debt === 0. He still threatens about
the 10,000 credit debt regardless of actual debt state.

**Files:**
- `src/game/data/dialogue/marcus-cole.js`

**Changes:**
- Add `debt_cleared` dialogue node triggered when `debt === 0` and Tanaka quest
  not yet started.
- Cole's tone: cold, grudging respect. "You surprised me. Most don't make it this
  far."
- Cole drops a Tanaka hint: mentions an engineer at Barnard's Star working on
  experimental jump tech. "Might be worth your time, now that you're free."
- Player choices:
  - Ask about the engineer → Cole gives more detail: "Name's Tanaka. Obsessed
    with some jump drive project."
  - Say goodbye
  - Ask about future business
- Greeting node needs condition: if `debt === 0` and Tanaka quest stage === 0,
  route to `debt_cleared` instead of normal greeting.

## Fix 4: Captain Vasquez Tanaka Hint

**UAT Issues:** #4/#9 (primary Tanaka discoverability fix)

**Problem:** Player may not visit Sol after paying debt. Vasquez at Epsilon Eridani
is a common stop and the designated mentor NPC.

**Files:**
- `src/game/data/dialogue/captain-vasquez.js` (or equivalent)

**Changes:**
- Add conditional dialogue node triggered when `debt === 0` and Tanaka quest not
  started.
- Vasquez tone: warm, encouraging. "I heard you cleared your debt. Impressive.
  Listen — there's someone you should meet."
- More explicit than Cole: names Tanaka, says she's at Barnard's Star, working on
  a jump drive, looking for a pilot she can trust.
- Both Cole and Vasquez check the same conditions, so whichever the player visits
  first provides the breadcrumb. The other reinforces if visited later.

## Deferred Issues

These issues from the UAT are acknowledged but deferred:

- **#3 Route planner** — Large feature, not blocking gameplay.
- **#5 Passenger mission profitability** — Arbitrage fix is in place; needs data
  analysis to determine if further tuning is needed.
- **#6 Debt interest pressure** — Cole debt system exists; tuning is a separate
  pass.
- **#7 Mission deadline warnings** — Missions are generated with feasible
  deadlines; the issue is player detours. Nice-to-have warning.

## UAT File Updates

After each fix is verified, update `uat-new-player-notes.md` to mark the
corresponding issue(s) as FIXED with a brief note of what changed.
