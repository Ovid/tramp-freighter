# Narrative Audit Log

Full game text audit: every place where player-facing text implies something that doesn't mechanically happen.

## Severity Legend

- **BROKEN**: Text promises something, code doesn't deliver it
- **MISLEADING**: Text implies something different from what actually happens
- **EMPTY THREAT**: Text threatens consequences that aren't implemented
- **DEAD CODE**: Code returns data that nothing processes

---

## 1. Narrative Events (`src/game/data/narrative-events.js`)

### BROKEN: `dock_cheap_fuel` — Fuel purchase takes credits but gives no fuel

**Severity:** BROKEN
**Lines:** 118-150

The mechanic says "I got some fuel canisters that fell off a transport. Half price." Player clicks "Deal" and pays 50 credits. But the effect is `{ costs: { credits: 50 }, rewards: {} }` — no fuel is added. The player pays money and gets nothing.

**Additionally:** "Half price" is vague — half of what? Normal refuel costs vary by system. 50 credits may not actually be half price anywhere.

### MISLEADING: `dock_generic_rumor` — Electronics tip has no mechanical backing

**Severity:** MISLEADING
**Lines:** 88-116

Text: "Heard prices on electronics are spiking out near Epsilon Eridani."

This is a specific, actionable claim about a specific system. But it's hardcoded flavor text — there's no check that electronics prices are actually high at Epsilon Eridani. The player may travel there and find normal or low prices. The tip is always the same text regardless of actual market conditions.

### MISLEADING: `time_debt_warning` — "Don't make me come looking for you" is an empty threat

**Severity:** EMPTY THREAT (partially)
**Lines:** 285-315

Text: "Grace period's over. Interest starts accruing. Don't make me come looking for you."

- **Interest accrual: TRUE.** 2% monthly interest is implemented in `DebtManager.applyInterest()` and runs every game day.
- **"Come looking for you": FALSE.** No Cole encounter exists. No danger event for debt collection. The game pressures the player through lien withholding (5-20% of trade profits) and heat escalation, but Cole never physically appears as a threat.

---

## 2. Danger Events & Encounter Outcomes

### DEAD CODE: Negotiation `strengthIncrease` — Never applied (3 instances)

**Severity:** DEAD CODE / MISLEADING
**File:** `src/game/state/managers/negotiation.js`

Three negotiation failure outcomes return `strengthIncrease` in their costs, but `applyEncounterOutcome.js` has no handler for this field. The data is silently discarded.

| Outcome | Text | strengthIncrease | Line |
|---------|------|-----------------|------|
| Counter-proposal failure | "Pirates are now more aggressive" | 0.1 | ~116 |
| Medicine lie detected | "They are not pleased" | 0.2 | ~147 |
| Intel offer failure (no intel) | "No useful intelligence" | 0.15 | ~204 |

**Result:** Text says pirates get more aggressive, but nothing changes.

### DEAD CODE: Negotiation `reputationPenalty` — Never applied

**Severity:** DEAD CODE
**File:** `src/game/state/managers/negotiation.js`, ~line 234

Intel offer detected as suspicious returns `reputationPenalty: -10`, but `applyEncounterOutcome.js` has no handler. The authority faction penalty never happens, even though the successful version correctly uses `factionRep` (which IS handled).

### DEAD CODE: Inspection `triggerPatrolCombat` — Never applied

**Severity:** BROKEN / DEAD CODE
**File:** `src/game/state/managers/inspection.js`, ~line 189

Text: "Fled from customs inspection. Patrol ships are in pursuit."
Returns: `triggerPatrolCombat: true`
Result: Nothing happens. No combat encounter is queued. The player flees with zero consequences beyond any costs already applied.

### MISLEADING: Combat return fire success — Hides hull damage

**Severity:** MISLEADING
**File:** `src/game/state/managers/combat.js`, ~line 168

Text: "Successfully drove off the pirates with return fire."
Reality: Player takes 10% hull damage AND gains +5 outlaw reputation (not mentioned).

"Successfully drove off" implies a clean win. The player doesn't learn they took damage until they check their ship status.

### MISLEADING: Inspection bribe success — Hidden reputation penalty

**Severity:** MISLEADING
**File:** `src/game/state/managers/inspection.js`, ~line 158

Text: "Successfully bribed customs inspector and avoided inspection."
Reality: Pays 500 credits AND suffers -10 authority reputation (not mentioned in text).

### MISLEADING: Inspection cooperate — Same text for wildly different outcomes

**Severity:** MISLEADING
**File:** `src/game/state/managers/inspection.js`, ~line 123

All cooperate outcomes show: "Cooperated with customs inspection."
But outcomes range from:
- Clean: +5 authority rep, 0 credits
- Restricted goods found: -10 authority rep, 1000 credit fine, cargo confiscated
- Hidden cargo found: -20 authority rep, +5 outlaw rep, 2000 credit fine

The generic text hides whether anything bad happened.

---

## 3. Dialogue Trees — NPC Promises

### BROKEN: Whisper's intel discounts — Promised but not applied

**Severity:** BROKEN
**File:** `src/game/data/dialogue-trees.js` (intel_prices node)

Dialogue promises tier-based intel discounts:
- FAMILY: "information flows freely"
- TRUSTED: "15% below standard pricing"
- WARM: "10% below posted rates"

But `InformationBroker` class does NOT consult `NPCManager.getServiceDiscount()`. The discount infrastructure exists (`NPC_BENEFITS_CONFIG.TIER_DISCOUNTS` in constants, `getServiceDiscount()` in npc.js) but is never called during intel purchases.

### BROKEN: Rusty's repair discounts — Infrastructure exists but unused

**Severity:** BROKEN
**File:** `src/game/data/dialogue-trees.js` (header documentation)

NPC documentation claims relationship-based repair discounts. `NPC_BENEFITS_CONFIG` has tier percentages. But `RepairManager.calculateRepairCost()` never calls the discount system.

### BROKEN: All NPCs — Tips system is empty

**Severity:** BROKEN
**File:** `src/game/state/managers/npc.js`

`NPCManager.getTip()` and `canGetTip()` exist with proper cooldown logic, but no NPC has any tips defined in their data. The tips array is empty/undefined for all 11 NPCs. Players can never actually receive tips.

---

## 4. Summary by Priority

### Fix Now (Player pays/acts and gets nothing)
1. `dock_cheap_fuel` — Add fuel reward or remove the event
2. Whisper intel discounts — Wire up the existing discount infrastructure
3. Rusty repair discounts — Wire up the existing discount infrastructure

### Fix Soon (Text lies about consequences)
4. `triggerPatrolCombat` — Either implement patrol combat or remove the flee option's false threat
5. `strengthIncrease` x3 — Either implement escalation or change text
6. `reputationPenalty` — Use existing `factionRep` field instead
7. Inspection cooperate text — Add outcome-specific messages

### Improve (Misleading but not mechanically broken)
8. `dock_generic_rumor` — Make tip reflect actual market conditions
9. `time_debt_warning` — Soften or remove "come looking for you" phrasing
10. Combat return fire text — Mention hull damage
11. Inspection bribe text — Mention reputation cost
12. NPC tips system — Populate tips or remove the dead feature

---

## Appendix: Fields Returned But Never Processed by `applyEncounterOutcome.js`

| Field | Source | Instances | Should Be |
|-------|--------|-----------|-----------|
| `strengthIncrease` | negotiation.js | 3 | Pirate escalation mechanic or remove |
| `triggerPatrolCombat` | inspection.js | 1 | Chain to combat encounter or remove |
| `reputationPenalty` | negotiation.js | 1 | Use `factionRep` in rewards instead |
| `restrictedGoodsConfiscated` | inspection.js | 1 | Has handler (cargo loss check) |
| `hiddenCargoConfiscated` | inspection.js | 1 | Has handler (cargo loss check) |
