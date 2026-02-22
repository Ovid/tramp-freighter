# Architecture Improvements Design

Addresses three medium-priority items from the architecture review (`architecture-responses.md` items #6, #7, #8).

---

## 1. DangerManager Split

### Problem

`danger.js` is 1,843 lines with 8+ distinct responsibilities: danger zones, karma, faction rep, pirate encounters, combat resolution, negotiation, inspections, distress calls, and mechanical failures. It is the only god object in the manager layer.

### Approach

Promote sub-systems to first-class managers extending BaseManager. No coordinator pattern — GameStateManager delegates directly to each manager, consistent with the rest of the architecture.

### New File Structure

```
src/game/state/managers/
  danger.js              <- Slimmed: zones, karma, faction rep, flags, probability calcs (~280 lines)
  combat.js              <- NEW: 4 combat choices + combat modifiers (~300 lines)
  negotiation.js         <- NEW: 4 negotiation choices + cargo helpers (~320 lines)
  inspection.js          <- NEW: 3 inspection choices + restricted goods counting (~220 lines)
  distress.js            <- NEW: distress check + 3 response choices (~160 lines)
  mechanical-failure.js  <- NEW: failure checks + 3 repair choices (~220 lines)

src/game/utils/
  danger-utils.js        <- NEW: calculateKarmaModifier (shared by combat + negotiation)
```

### What Stays in DangerManager (~280 lines)

Shared state and probability calculations that multiple systems read:

- `getDangerZone(systemId)` — zone classification
- `getKarma()` / `setKarma()` / `modifyKarma()` — karma state
- `getFactionRep()` / `setFactionRep()` / `modifyFactionRep()` — faction reputation
- `incrementDangerFlag(flagName)` — flag tracking
- `calculatePirateEncounterChance()` — probability calculation
- `calculateInspectionChance()` — probability calculation
- `calculateCargoValue()` — utility used by probability calc
- `countRestrictedGoods()` — utility used by inspection + probability
- `hasIllegalMissionCargo()` — utility used by probability calc

### What Moves

**CombatManager** (`combat.js`):
- `resolveCombatChoice()` — entry point dispatching to 4 methods
- `resolveEvasiveManeuvers()`, `resolveReturnFire()`, `resolveDumpCargo()`, `resolveDistressCall()`
- `checkLuckyShipNegate()`, `applyHullDamageModifiers()` — combat-specific modifiers

**NegotiationManager** (`negotiation.js`):
- `resolveNegotiation()` — entry point dispatching to 4 methods
- `resolveCounterProposal()`, `resolveMedicineClaim()`, `resolveIntelOffer()`, `resolveAcceptDemand()`
- `resolveCannotPayPirates()`, `hasTradeCargoForPirates()` — payment helpers

**InspectionManager** (`inspection.js`):
- `resolveInspection()` — entry point dispatching to 3 methods
- `resolveInspectionCooperate()`, `resolveInspectionBribe()`, `resolveInspectionFlee()`

**DistressManager** (`distress.js`):
- `checkDistressCall()` — probability check
- `resolveDistressCallEncounter()` — entry point dispatching to 3 methods
- `resolveDistressRespond()`, `resolveDistressIgnore()`, `resolveDistressLoot()`

**MechanicalFailureManager** (`mechanical-failure.js`):
- `checkMechanicalFailure()` — condition-based failure detection
- `resolveMechanicalFailure()` — entry point dispatching by type
- `resolveHullBreach()`, `resolveEngineFailure()`, `resolveLifeSupportEmergency()`
- `resolveEmergencyRestart()`, `resolveCallForHelp()`, `resolveJuryRig()`

**danger-utils.js**:
- `calculateKarmaModifier(karma)` — pure function, shared by CombatManager and NegotiationManager

### Cross-Manager Dependencies

New managers read karma via `this.gameStateManager.getKarma()` (delegated to slimmed DangerManager). No direct manager-to-manager references.

### GameStateManager Changes

Register 5 new managers in constructor alongside slimmed DangerManager:

```javascript
this.dangerManager = new DangerManager(this);
this.combatManager = new CombatManager(this);
this.negotiationManager = new NegotiationManager(this);
this.inspectionManager = new InspectionManager(this);
this.distressManager = new DistressManager(this);
this.mechanicalFailureManager = new MechanicalFailureManager(this);
```

Reroute delegation methods:
- `resolveCombatChoice()` -> `this.combatManager`
- `resolveNegotiation()` -> `this.negotiationManager` (drop `rng` param)
- `resolveInspection()` -> `this.inspectionManager` (drop `rng` param)
- `checkDistressCall()` / `resolveDistressCall()` -> `this.distressManager` (drop `rng` param)
- `checkMechanicalFailure()` / `resolveMechanicalFailure()` -> `this.mechanicalFailureManager` (drop `rng` param)

`resolveEncounter()` and `resolvePirateEncounter()` become pure routers with no RNG generation.

---

## 2. SeededRandom Replacement

### Problem

Combat/encounter paths use `Math.random()`, making outcomes non-reproducible across save/load. Mission generation in `debt.js` is also non-deterministic. Meanwhile, `SeededRandom` exists in the codebase but is essentially unused.

### Seeding Strategy

Seeds constructed from game context: `"${gameDay}_${systemId}_${encounterType}"`.

Same encounter in the same system on the same day produces identical outcomes. A fresh `SeededRandom` instance is created at each resolution call site — no long-lived RNG state to persist.

Examples:
- `"142_sol_combat"`
- `"87_alpha-centauri_inspection"`
- `"200_barnards-star_mechanical"`
- `"142_sol_favor_mission"` (debt.js)

### Replacement Locations

| Location | Current | New |
|---|---|---|
| `CombatManager.resolveCombatChoice()` | `Math.random()` | `new SeededRandom(seed).next()` |
| `NegotiationManager.resolveNegotiation()` | RNG passed from App.jsx | Manager creates own SeededRandom |
| `InspectionManager.resolveInspection()` | RNG passed from GSM | Manager creates own SeededRandom |
| `DistressManager.checkDistressCall()` | RNG passed from useEventTriggers | Manager creates own SeededRandom |
| `MechanicalFailureManager.checkMechanicalFailure()` | RNG passed from useEventTriggers | Manager creates own SeededRandom |
| `MechanicalFailureManager.resolveMechanicalFailure()` | RNG passed from GSM | Manager creates own SeededRandom |
| `DebtManager.generateFavorMission()` | 3x `Math.random()` | `new SeededRandom(seed)` with `.next()` calls |

### API Simplification

RNG parameters are removed from method signatures. Callers no longer pre-roll or pass random values:

**App.jsx**: `resolveNegotiation(encounter, choice, Math.random())` becomes `resolveNegotiation(encounter, choice)`

**useEventTriggers.js**: Pre-rolled `mechanicalRng` and `distressRng` are removed. Calls simplify to `checkMechanicalFailure(gameState)` and `checkDistressCall()`.

### Out of Scope

Default parameter `Math.random` references in ship.js, event-engine.js, mission-generator.js, quest-manager.js are already injection points for testing. No change needed.

Visual randomness in scene.js (background stars) is purely cosmetic. No change needed.

---

## 3. Debounced Auto-Save

### Problem

17 scattered `saveGame()` calls across the codebase. Each manager independently saves after every mutation. A passive 1-second debounce exists in `save-load.js` but it silently drops saves that fire within the window — mutations can be lost until the next successful save.

Known bug: `navigation.js` dock() mutates `dockedSystems` after `saveGame()`, risking data loss on reload.

### Approach: Active Trailing Debounce

Replace all per-method `saveGame()` calls with `markDirty()`. SaveLoadManager schedules a save 500ms after the last `markDirty()` call. All mutations within that window are captured in one save.

```
mutate state -> emit event -> markDirty()
                                  |
                      [500ms trailing timer]
                                  |
                            saveGame()
```

### Implementation

**SaveLoadManager** gets two new methods:
- `markDirty()` — clears existing timer, sets 500ms `setTimeout` to call `saveGame()`
- `flushSave()` — immediately saves if dirty (for browser unload)

**GameStateManager** exposes `markDirty()` as a delegation method.

### Migration

Mechanical replacement across all files:
- `game-state-manager.js`: 13 `this.saveGame()` calls become `this.markDirty()`
- `navigation.js`: 2 calls become `this.gameStateManager.markDirty()`
- `applyEncounterOutcome.js`: 1 call becomes `gameStateManager.markDirty()`

### Browser Unload Safety

Add `beforeunload` listener calling `flushSave()` to persist pending dirty state when the player closes the tab.

### Navigation.js Bug Fix

With debounced saves, the dock ordering bug resolves naturally — `dockedSystems.push()` happens synchronously, and the trailing save captures complete state. The mutation should still be reordered before the emit for clarity.

---

## 4. Test Migration

### Test File Mapping

| New Manager | Test Files |
|---|---|
| DangerManager (slimmed) | `danger-zone-classification.property.test.js`, `danger-flags-increment.property.test.js`, `danger-state-persistence.property.test.js` |
| CombatManager | `combat-resolution-outcomes.property.test.js`, `combat-modifier-application.property.test.js` |
| NegotiationManager | `negotiation-outcomes.property.test.js` |
| InspectionManager | `inspection-outcomes.property.test.js`, `inspection-probability-scaling.property.test.js` |
| DistressManager | `distress-call-outcomes.property.test.js` |
| MechanicalFailureManager | `mechanical-failure-thresholds.property.test.js` |
| Cross-cutting | `passenger-cargo-pirate.test.js` (integration) |

### What Changes

1. **Import paths** — import from new manager files instead of danger.js
2. **Manager instantiation** — create specific manager (e.g., `CombatManager`) instead of `DangerManager`
3. **RNG parameters removed** — tests drop `rng` params from resolution method calls; outcomes become deterministic via SeededRandom seeding
4. **Cross-cutting tests** — `passenger-cargo-pirate.test.js` needs NegotiationManager + GameStateManager mock

### Inspection probability test

`inspection-probability-scaling.property.test.js` tests `calculateInspectionChance()` which stays in slimmed DangerManager. No migration needed.

---

## 5. Documentation Updates

| File | Changes |
|---|---|
| `CLAUDE.md` | Update manager list, add new managers, note markDirty() pattern, note SeededRandom in encounter paths |
| `.github/copilot-instructions.md` | Update manager responsibilities (lines 312-328), update save pattern docs for markDirty() |
| `AGENTS.md` | Update initialization code (lines 194-207), update architecture narrative |
| `DEVELOPMENT.md` | Update architecture diagrams and manager delegation sections |
| `.kiro/steering/coding-standards.md` | Update save/load section (lines 1002-1048) for markDirty() pattern |
| `.kiro/specs/danger-system/` | Update design.md and tasks.md to reference new file structure |
| `architecture-responses.md` | Add implementation status notes to items #6, #7, #8 |

---

## Implementation Order

1. **DangerManager split first** — widest blast radius, establishes new file structure
2. **SeededRandom replacement second** — targets new manager files from step 1
3. **Debounced auto-save third** — mechanical find-and-replace, independent of steps 1-2
4. **Test migration** — update imports, instantiation, drop rng params
5. **Documentation updates** — update all docs to reflect new architecture
