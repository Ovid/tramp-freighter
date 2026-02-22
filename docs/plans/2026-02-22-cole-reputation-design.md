# Cole Reputation from Debt Interactions

## Problem

Marcus Cole starts at rep -20 (COLD) and stays there forever regardless of player behavior. Paying off debt, making voluntary payments, and completing favor missions have no effect on his NPC reputation. His dialogue and tier benefits (financial tips, interest reduction, debt restructuring) are permanently locked.

## Design Decision

All debt-related rep changes **bypass Cole's trust modifier** (0.1) and apply directly. Cole respects money, not people. Normal dialogue choices still use `modifyRep` with the trust modifier — charm doesn't work on him, but financial reliability does.

## Rep Changes

| Action | Rep Change | Notes |
|--------|-----------|-------|
| Voluntary payment | `+floor(amount / 500)`, min +1 | Respects payers. ₡500 = +1, ₡1000 = +2, ₡5000 = +10 |
| Auto-withholding (Cole's cut) | `+floor(withheld / 500)`, min +0 | Passive income, not impressed. Only counts if ≥500 withheld |
| Borrowing | +1 flat | Likes customers |
| Favor mission completed | +8 to +12 per mission template | Proves usefulness beyond money |
| Missed checkpoint (no payment) | -3 | Wasting his time |
| Decline favor mission | -2 | Disrespectful |
| Fail/ignore mandatory mission | -5 | Serious breach |

## Progression Math

Starting at -20 (COLD). Tier boundaries: COLD -49 to -10, NEUTRAL -9 to 9, WARM 10 to 29, FRIENDLY 30 to 59.

**Paying off starting 10K debt:**
- All voluntary: ~10K / 500 = +20 rep → lands at 0 (NEUTRAL)
- Mix of withholding + voluntary: slightly less, ~-5 to 0
- A few borrows along the way: +1 each → pushes toward NEUTRAL

**Beyond NEUTRAL (repeat business + missions):**
- Borrow 5K, repay with interest (~5.5K): +11 rep per cycle
- Favor missions: +8 to +12 each
- 2 borrow cycles + 2 favor missions → WARM (10+) to FRIENDLY (30+)

## Implementation

Use `setNpcRep(npcId, currentRep + change)` in DebtManager — direct rep set bypassing trust modifier. Applied alongside existing heat changes. No new state fields needed.

### Integration Points

- `DebtManager.makePayment()`: Apply voluntary payment rep
- `DebtManager.applyWithholding()`: Apply withholding rep (if ≥500)
- `DebtManager.borrow()`: Apply +1 borrow rep
- `DebtManager.processCheckpoint()`: Apply missed checkpoint penalty (-3)
- Favor mission completion/decline/fail: Apply mission rep changes

### Constants

All values in `COLE_DEBT_CONFIG`:
- `REP_PER_CREDIT_DIVISOR: 500`
- `REP_BORROW_BONUS: 1`
- `REP_MISSED_CHECKPOINT: -3`
- `REP_DECLINE_FAVOR: -2`
- `REP_FAIL_MANDATORY: -5`
- `REP_WITHHOLDING_THRESHOLD: 500`

### What Does NOT Change Cole Rep

- Normal dialogue choices: still use `modifyRep` with trust modifier (charm doesn't work on Cole)
- Trading at Sol: unrelated to debt relationship
