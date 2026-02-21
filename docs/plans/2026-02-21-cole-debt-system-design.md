# Cole Debt System Design

## Problem

Marcus Cole is the player's loan shark creditor. The player starts with ₡10,000 debt. Currently there is no way to borrow more, no way to repay, no consequences for the debt, and no anti-soft-lock mechanism. Endgame (Pavonis Run) requires debt === 0.

## Design Decisions

- All debt flows through Cole (single source, no station-level cash advances)
- Auto-withholding on trade sales + voluntary lump-sum payments
- Hidden heat score tracks borrowing behavior, drives Cole's escalation
- Full escalation: increasing liens, checkpoints, forced unpaid favor missions
- Finance panel for mechanics + Cole dialogue for narrative
- Periodic interest compounds debt over time
- Anti-soft-lock: player can always borrow at least ₡200 from Cole

## State Model

### Player Finance State

```js
player.finance = {
  debt: 10000,           // principal owed to Cole
  heat: 0,               // hidden — tracks borrowing behavior (0-100)
  lienRate: 0.05,        // % withheld from trade sales (starts at 5%)
  interestRate: 0.02,    // monthly interest rate on principal (2%)
  lastInterestDay: 0,    // last day interest was applied
  nextCheckpoint: 30,    // game day when Cole's next "visit" triggers
  totalBorrowed: 0,      // lifetime emergency draws (never decreases)
  totalRepaid: 0,        // lifetime payments made (never decreases)
}
```

### Heat Mechanics (hidden from player)

Heat rises on bad behavior, decays slowly on good behavior. Clamped to 0-100.

| Action | Heat Change |
|---|---|
| Emergency borrow | +8 base, +2 per 500₡ drawn |
| Miss checkpoint without payment | +10 |
| Voluntary payment (any amount) | -3 |
| Full interest period with no new borrowing | -1 (slow natural decay) |
| Decline favor mission (heat 46-70) | +5 |
| Fail/ignore mandatory mission (heat 71+) | +15 |
| Debt reaches 0 | Reset to 0 |

### Heat Thresholds

| Heat Range | Lien Rate | Checkpoint Interval | Cole's Behavior |
|---|---|---|---|
| 0-20 | 5% | 30 days | Businesslike. Standard withholding. Normal dialogue. |
| 21-45 | 10% | 21 days | Terse. Pointed dialogue. Mentions your "pattern." |
| 46-70 | 15% | 14 days | Threatening. Forced favor mission offered at checkpoints. |
| 71-100 | 20% (cap) | 7 days | Hostile. Mandatory unpaid missions. Rep damage with other NPCs. |

### Interest

Every 30 game-days: `debt += Math.ceil(debt * interestRate)`. Applied during daily tick when `daysElapsed - lastInterestDay >= 30`.

## Borrowing (Emergency Credit Line)

Available at every station via Finance panel. Cole's network reaches everywhere.

### Offer Calculation

- `maxDraw = max(200, Math.round(netWorth * 0.08))`
- netWorth = credits + cargo liquidation value - debt
- If netWorth is negative, minimum maxDraw = 200 (anti-soft-lock guarantee)
- Player picks from: ₡100 / ₡250 / ₡500 / Max (only show tiers <= maxDraw)

### Cost of Borrowing

- `debt += drawAmount`
- `heat += 8 + Math.floor(drawAmount / 500) * 2`
- `nextCheckpoint = Math.min(nextCheckpoint, currentDay + 7)`
- `totalBorrowed += drawAmount`

## Repayment

### Auto-Withholding (Lien on Sales)

When selling cargo in TradingManager:

1. Calculate `totalRevenue`
2. `withheld = Math.ceil(totalRevenue * lienRate)`
3. Cap: if `withheld > debt`, set `withheld = debt`
4. `debt -= withheld`, `totalRepaid += withheld`
5. Player receives `totalRevenue - withheld`
6. Trade receipt shows: "Cole's cut: -₡{withheld}"

Lien rate is determined by current heat threshold (5% / 10% / 15% / 20%).

### Voluntary Payments

From Finance panel, player chooses amount (₡100 / ₡500 / ₡1000 / Pay All):

- `debt -= paymentAmount`
- `heat -= 3` (per payment action, not per credit)
- `totalRepaid += paymentAmount`
- If `debt === 0`: heat resets to 0, lien rate to 0, celebration narrative event fires

## Checkpoints & Escalation

### Checkpoint Events

Trigger when `daysElapsed >= nextCheckpoint` and `debt > 0`. Processed during daily tick.

**Resolution:**

1. If player made payments since last checkpoint: Cole acknowledges. Normal next checkpoint.
2. If no payments made: `heat += 10`. Hostile dialogue. Sooner next checkpoint.
3. At heat 46+: Checkpoint includes a favor mission offer. Declining adds +5 heat.
4. At heat 71+: Favor mission is mandatory. Declining is not an option.

**Next checkpoint scheduling** (after resolution):
- Heat 0-20: +30 days
- Heat 21-45: +21 days
- Heat 46-70: +14 days
- Heat 71-100: +7 days

### Favor Missions

Cole's missions are **unpaid** — the "reward" is Cole not escalating further. Templates:

- **Courier:** Deliver a sealed package to a specific system
- **Passenger:** Transport one of Cole's associates discreetly
- **Intimidation:** Dock at a system where someone else owes Cole

Implementation:
- Use existing mission system with `source: 'cole'` flag
- Cannot be abandoned
- Failing/ignoring adds +15 heat and rep penalty with all NPCs
- No credit reward on completion

### The Spiral (Controlled)

Borrow → heat rises → lien rate increases → keep less from trades → harder to pay down debt → tempted to borrow again.

But always escapable: stop borrowing, make voluntary payments, heat decays naturally, lien rate drops, debt becomes manageable.

## Anti-Soft-Lock Failsafe

When docked and `credits < minimumDepartCost` (docking fee + minimum fuel) AND no cargo to sell:

Finance panel shows prominent emergency prompt: "You need credits to leave this station. Cole can help — for a price."

Player can always borrow at least ₡200 regardless of net worth or heat level.

## UI

### Finance Panel (New Station Panel)

Added to station menu as "Finance" button.

**Layout:**
- Header: "Cole Credit Line"
- Debt overview: current debt, withholding rate, interest rate, next interest date
- [Make Payment] button — amount options: ₡100 / ₡500 / ₡1000 / Pay All
- [Borrow] button — amount options: ₡100 / ₡250 / ₡500 / Max (shows "Available: ₡{maxDraw}")
- Emergency banner when stranded

### Trade Receipt

When lien is active, trade results show:

```
Revenue:     ₡450
Cole's cut:  -₡23
You receive: ₡427
```

### Cole Dialogue

Branches based on hidden heat:
- Low: Professional, brief. Financial tips if rep is good.
- Medium: Curt. Reminds about payment. Mentions "pattern."
- High: Threatening. Delivers favor mission ultimatums.
- Critical: Cold fury. Mandatory missions. References consequences.

### Checkpoint Events

Surface as narrative events (existing system). Fire on daily tick, show Cole dialogue, may add missions.

## Architecture

### New Manager: DebtManager

Extends `BaseManager`. Handles:
- Interest accrual (daily tick hook)
- Heat updates (on borrow, pay, checkpoint)
- Checkpoint scheduling and resolution
- Emergency draw logic and offer calculation
- Lien rate calculation (derived from heat threshold)
- Payment processing
- Net worth calculation

### Integration Points

- `TradingManager.sellGood()` calls `DebtManager` for withholding
- `GameStateManager` delegates debt methods (borrow, pay, getDebtInfo)
- Station menu adds Finance button
- Daily tick triggers interest + checkpoint checks
- Mission system accepts Cole favor missions
- Narrative event system handles checkpoint dialogue
- Existing `debtChanged` event drives HUD updates

### Constants

All numeric values in `constants.js`:
- Heat thresholds, changes per action
- Lien rate tiers
- Interest rate and period
- Checkpoint intervals per tier
- Emergency draw limits
- Favor mission heat penalties

## Tuning Targets

- Emergency options prevent soft-lock within one click
- Using them repeatedly slows progress and triggers story consequences
- Paying off 10K starting debt is achievable mid-to-late game with disciplined play
- The spiral is always escapable — pressure, not a death sentence
- Endgame requirement (debt === 0) is the ultimate motivator
