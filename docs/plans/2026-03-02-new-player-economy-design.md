# New Player Economy and Transparency

Date: 2026-03-02
Status: Approved
Source: UAT new-player playthrough (scratch/uat-new-player-notes.md)

## Problem

New players hit a death spiral in the first 30 days. UAT showed ~10 credits/day
net earnings against ~10 credits/day interest cost. A single bad event (medicine
confiscation with no prior warning) made recovery nearly impossible. Three
reinforcing issues:

1. Mission payouts too low to sustain a player still learning trade routes
2. Restricted goods invisible in Trade UI -- players commit capital then lose
   everything to customs with no way to have known
3. Fines when broke silently evaporate (no real consequence, no debt increase)

Goal: a new player making reasonable-but-uninformed decisions should stay ahead
of the debt curve. Careless play should still hurt. The mid-game should remain
challenging.

## Changes

### 1. Mission Reward Increase (~60%)

**Files:** `src/game/constants.js` (MISSION_CONFIG)

| Constant | Old | New |
|----------|-----|-----|
| CARGO_RUN_BASE_FEE | 75 | 120 |
| CARGO_RUN_ILLEGAL_BASE_FEE | 150 | 225 |

Reward formula unchanged: `baseFee * hopMultiplier * dangerMultiplier *
saturationMultiplier`. Only the base fee increases.

Passenger rewards unchanged -- they scale with trade margins and self-adjust.

Expected mission payouts:
- 1-hop legal cargo: ~113 -> ~180
- 1-hop illegal cargo: ~225 -> ~340
- 3-hop legal cargo: ~394 -> ~630

Expected daily rate from missions alone rises from ~16-26/day to ~30-40/day,
comfortably above the ~10/day interest cost.

### 2. Restricted Goods Transparency

**Files:** Trade panel component (UI only), no game logic changes

Zone restrictions already exist in `RESTRICTED_GOODS_CONFIG.ZONE_RESTRICTIONS`:
- Safe zones: electronics restricted
- Contested zones: medicine restricted
- Dangerous zones: tritium restricted
- Core systems: parts restricted

Changes:
- Trade panel shows a yellow "RESTRICTED" badge on goods restricted in the
  current zone's security level
- Tooltip text: "Regulated in [zone] zones. Risk of fines and confiscation
  during customs inspections."
- Buying is still allowed -- this is an informed risk/reward choice, not a block
- Badge only appears for goods restricted in the zone the player is currently in
  (medicine shows RESTRICTED at a contested station, not at a safe station)

The current zone is already available via `getDangerZone(currentSystem)` and
the restriction lookup is `ZONE_RESTRICTIONS[zone]`.

### 3. Unpaid Fines Roll Into Debt

**Files:** `src/features/danger/applyEncounterOutcome.js`, Finance manager

Current behavior (line 58):
```js
const newCredits = Math.max(0, state.player.credits - outcome.costs.credits);
```

New behavior:
```js
const fine = outcome.costs.credits;
const paid = Math.min(state.player.credits, fine);
const unpaid = fine - paid;
gameStateManager.updateCredits(state.player.credits - paid);
if (unpaid > 0) {
  // Remainder absorbed by Cole's debt
  gameStateManager.addToDebt(unpaid);
}
```

If `addToDebt` doesn't exist, add a method that increases
`state.finance.debt.amount` and emits `DEBT_CHANGED`.

Lore hook for the encounter outcome text: "Can't cover the fine? Marcus Cole
steps in. He always collects."

### 4. Captain's Briefing Trade Hint

**Files:** Briefing text content (narrative data or component)

Add one line to the existing trading section of the Captain's Briefing:

> "Your grain won't make you rich, but it's selling cargo that pays down Cole's
> cut. The real margins are in manufactured goods -- electronics, parts, medicine
> -- if you can find the right buyers."

This nudges new players toward higher-margin goods without giving away specific
routes. Fits the existing briefing tone.

## What This Does NOT Change

- Interest rate (3% / 30 days) -- stays as-is
- Starting debt (10,000 credits) -- stays as-is
- Starting cargo (20 grain) -- stays as-is
- Trade margins / dynamic pricing -- stays as-is
- Encounter probabilities -- stays as-is
- Ship degradation rates -- stays as-is

The difficulty ceiling is preserved. Only the information floor and early income
floor are raised.

## Testing

Unit tests:
- Mission reward calculation with new base fees (verify ~60% increase)
- Fine application when credits < fine amount (verify debt increases)
- Restricted goods lookup per zone returns correct commodities

Integration tests:
- Trade panel renders RESTRICTED badge for medicine in contested zone
- Trade panel does NOT render RESTRICTED badge for medicine in safe zone
- Encounter outcome correctly splits fine between credits and debt

UAT validation checklist in `scratch/balancing-attempts.md`.

## Related

- `notes/dirty-dozon.md` -- 14 additional bugs/UX issues from the same UAT
- `scratch/balancing-attempts.md` -- balance tracking log with validation checklist
