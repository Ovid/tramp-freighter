# Narrative Audit Log

Full game text audit: every place where player-facing text implies something that doesn't mechanically happen.

## Status: ALL RESOLVED

All 12 findings from the original audit have been addressed in the `ovid/narrative-messages-are-real` branch.

## Severity Legend

- **BROKEN**: Text promises something, code doesn't deliver it
- **MISLEADING**: Text implies something different from what actually happens
- **EMPTY THREAT**: Text threatens consequences that aren't implemented
- **DEAD CODE**: Code returns data that nothing processes

---

## 1. Narrative Events (`src/game/data/narrative-events.js`)

### RESOLVED: `dock_cheap_fuel` — Fuel purchase takes credits but gives no fuel

**Original severity:** BROKEN
**Fix:** Added `fuelMinimum` reward type to `applyEncounterOutcome`. Player now receives fuel when paying credits.

### RESOLVED: `dock_generic_rumor` — Electronics tip has no mechanical backing

**Original severity:** MISLEADING
**Fix:** Added `generateContent` function that produces dynamic text based on active economic events. Falls back to vague text when no events are active.

### RESOLVED: `time_debt_warning` — "Don't make me come looking for you" is an empty threat

**Original severity:** EMPTY THREAT
**Fix:** Changed text to reference the lien system which is actually implemented: "And the lien on your trades just got heavier."

---

## 2. Danger Events & Encounter Outcomes

### RESOLVED: Negotiation `strengthIncrease` — Never applied (3 instances)

**Original severity:** DEAD CODE / MISLEADING
**Fix:** Removed `strengthIncrease` from all 3 failure paths. Updated text to not claim pirates become more aggressive.

### RESOLVED: Negotiation `reputationPenalty` — Never applied

**Original severity:** DEAD CODE
**Fix:** Converted to `factionRep.authorities` in rewards, which `applyEncounterOutcome` processes.

### RESOLVED: Inspection `triggerPatrolCombat` — Never applied

**Original severity:** BROKEN / DEAD CODE
**Fix:** Replaced with real fuel and hull costs. Text now describes emergency burn consequences honestly.

### RESOLVED: Combat return fire success — Hides hull damage

**Original severity:** MISLEADING
**Fix:** Text now mentions hull damage: "not before taking some hits. Your hull shows fresh scoring."

### RESOLVED: Inspection bribe success — Hidden reputation penalty

**Original severity:** MISLEADING
**Fix:** Text now hints at reputation cost: "You doubt this stays off the books."

### RESOLVED: Inspection cooperate — Same text for wildly different outcomes

**Original severity:** MISLEADING
**Fix:** Branching text based on outcome: clean pass, restricted goods found, or hidden cargo discovered.

---

## 3. Dialogue Trees — NPC Promises

### RESOLVED: Whisper's intel discounts — Promised but not applied

**Original severity:** BROKEN
**Fix:** `InformationBroker.purchaseIntelligence` now accepts and applies discount parameter.

### RESOLVED: Rusty's repair discounts — Infrastructure exists but unused

**Original severity:** BROKEN
**Fix:** `RepairManager.repairShipSystem` now accepts and applies discount parameter. Refuel also wired up.

### RESOLVED: All NPCs — Tips system is empty

**Original severity:** BROKEN
**Fix:** Added 3 personality-appropriate, mechanically truthful tips for Father Okonkwo and Yuki Tanaka (the 2 NPCs with empty arrays). All 11 NPCs now have tips.

---

## Appendix: Fields Returned But Never Processed by `applyEncounterOutcome.js`

| Field | Source | Status |
|-------|--------|--------|
| `strengthIncrease` | negotiation.js | REMOVED — field was dead code |
| `triggerPatrolCombat` | inspection.js | REMOVED — replaced with fuel/hull costs |
| `reputationPenalty` | negotiation.js | CONVERTED to `factionRep` in rewards |
| `restrictedGoodsConfiscated` | inspection.js | Already handled (no change needed) |
| `hiddenCargoConfiscated` | inspection.js | Already handled (no change needed) |
