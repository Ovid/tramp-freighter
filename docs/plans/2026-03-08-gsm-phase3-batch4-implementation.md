# Phase 3 Batch 4: Migrate Heavy Cross-Domain Managers

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate TradingManager, DebtManager, MissionManager, and EventsManager from old-style (`this.gameStateManager`) to new-style capability injection.

**Architecture:** Each manager stops using `this.getState()` and `this.gameStateManager.X()` and instead receives a capability object with explicit read queries, write callbacks, and infrastructure. The coordinator builds these capability objects and passes them at construction time. BaseManager's dual-mode support (added in Batch 1) allows migrated and unmigrated managers to coexist.

**Tech Stack:** Vitest, ES Modules, JSDoc typedefs (already defined in `src/game/state/capabilities.js`)

**Managers in this batch (ordered by migration dependency):**
1. TradingManager — owns `world.priceKnowledge`, `world.marketConditions`; needs credits/cargo/danger zone callbacks
2. DebtManager — owns `player.debt`, `player.finance`; needs credits/debt/NPC rep callbacks
3. MissionManager — owns `state.missions`; needs credits/cargo/karma/faction/NPC/danger zone callbacks; depends on DebtManager (`applyTradeWithholding`)
4. EventsManager — orchestration hub for time advancement; delegates to TradingManager, NPCManager, DebtManager, MissionManager; depends on all three above being migrated

**Design reference:** `docs/plans/2026-03-08-gsm-refactor-design.md` Phase 3 section. Capability typedefs: `src/game/state/capabilities.js` lines 345-450.

**Migration pattern established in Batch 1:** See `docs/plans/2026-03-08-gsm-phase3-batch1-implementation.md` "Migration Pattern Reference" section.

**Important note on `getCurrentSystem`:** The coordinator's `getCurrentSystem()` returns a full star system object (from NavigationManager). But `state.player.currentSystem` is just the system ID (number). The capability `getCurrentSystem` provides the system ID. When managers need the full object (e.g., TradingManager needs system name for purchase metadata), they should look it up from `this.capabilities.starData`.

---

### Task 1: Migrate TradingManager to capability injection

**Files:**
- Modify: `src/game/state/managers/trading.js`
- Modify: `src/game/state/game-coordinator.js` (lines ~88, constructor)

**Step 1: Update coordinator to pass capability object to TradingManager**

In `src/game/state/game-coordinator.js`, replace line 88:

```js
this.tradingManager = new TradingManager(this);
```

with:

```js
this.tradingManager = new TradingManager({
  getOwnState: () => ({
    priceKnowledge: this.state.world.priceKnowledge,
    marketConditions: this.state.world.marketConditions,
    currentSystemPrices: this.state.world.currentSystemPrices,
  }),
  getCredits: () => this.state.player.credits,
  getCurrentSystem: () => this.state.player.currentSystem,
  getShipCargo: () => this.state.ship.cargo,
  getCargoRemaining: () => this.stateManager.getCargoRemaining(),
  getDaysElapsed: () => this.state.player.daysElapsed,
  getStats: () => this.state.stats,
  getDangerZone: (systemId) => this.dangerManager.getDangerZone(systemId),
  getActiveEvents: () => this.state.world.activeEvents,
  updateCredits: (value) => this.stateManager.updateCredits(value),
  updateCargo: (newCargo) => this.stateManager.updateCargo(newCargo),
  applyTradeWithholding: (totalRevenue) =>
    this.debtManager.applyWithholding(totalRevenue),
  checkAchievements: () => this.achievementsManager.checkAchievements(),
  updateStats: (key, delta) => {
    if (this.state.stats) {
      this.state.stats[key] = (this.state.stats[key] || 0) + delta;
    }
  },
  markDirty: () => this.markDirty(),
  emit: (...args) => this.emit(...args),
  starData: this.starData,
  isTestEnvironment: this.isTestEnvironment,
});
```

**Note on ordering:** TradingManager's capability references `this.debtManager` and `this.dangerManager`. DebtManager is currently constructed at line 293 (after TradingManager at line 88). This works because the capability callbacks are closures evaluated lazily at call time, not at construction time. The `this.debtManager` reference is captured in a closure and resolved when `applyTradeWithholding` is actually called, which only happens after all managers are constructed.

**Step 2: Update TradingManager to use capabilities instead of GSM**

Replace the entire `src/game/state/managers/trading.js` file. The key changes are:

1. Constructor: `constructor(capabilities)` → `super(capabilities)` (BaseManager dual-mode detects plain object)
2. Replace all `this.getState()` calls with `this.capabilities.getOwnState()` for owned state, and specific capability getters for cross-domain reads
3. Replace all `this.gameStateManager.X()` calls with `this.capabilities.X()`
4. Replace `this.getStarData()` with `this.capabilities.starData`
5. For `buyGood()`, replace `this.gameStateManager.getCurrentSystem()` (returns full object) with a `starData.find()` lookup using `this.capabilities.getCurrentSystem()` (returns ID)

Specific replacements in each method:

**`buyGood()`:**
- `this.getState()` → individual capability calls
- `state.player.credits` → `this.capabilities.getCredits()`
- `this.gameStateManager.getCargoRemaining()` → `this.capabilities.getCargoRemaining()`
- `this.gameStateManager.updateCredits(...)` → `this.capabilities.updateCredits(...)`
- `state.player.currentSystem` → `this.capabilities.getCurrentSystem()`
- `this.gameStateManager.getCurrentSystem()` → `this.capabilities.starData.find(s => s.id === currentSystemId)` (for `.name`)
- `state.player.daysElapsed` → `this.capabilities.getDaysElapsed()`
- `state.ship.cargo` → `this.capabilities.getShipCargo()`
- `this.gameStateManager.updateCargo(...)` → `this.capabilities.updateCargo(...)`
- `this.gameStateManager.markDirty()` → `this.capabilities.markDirty()`

**`sellGood()`:**
- Same credential/cargo patterns as `buyGood()`
- `this.gameStateManager.applyTradeWithholding(...)` → `this.capabilities.applyTradeWithholding(...)`
- `state.stats.cargoHauled += ...` → `this.capabilities.updateStats('cargoHauled', quantity)` and `this.capabilities.updateStats('creditsEarned', totalRevenue)`
- `this.gameStateManager.checkAchievements()` → `this.capabilities.checkAchievements()`
- `state.player.currentSystem` → `this.capabilities.getCurrentSystem()`

**`getCurrentSystemPrices()`:**
- `this.getState()` → `this.capabilities.getOwnState()`
- Access `ownState.currentSystemPrices`

**`updateMarketConditions()`:**
- `this.getState()` → `this.capabilities.getOwnState()`
- Access `ownState.marketConditions`

**`applyMarketRecovery()`:**
- `this.getState()` → `this.capabilities.getOwnState()`
- Access `ownState.marketConditions`

**`recordVisitedPrices()`:**
- `state.player.currentSystem` → `this.capabilities.getCurrentSystem()`
- `this.getStarData()` → `this.capabilities.starData`
- `this.gameStateManager.markDirty()` → `this.capabilities.markDirty()`

**`updatePriceKnowledge()`:**
- `this.getState()` → `this.capabilities.getOwnState()`
- Access `ownState.priceKnowledge`

**`incrementPriceKnowledgeStaleness()`:**
- `this.getState()` → `this.capabilities.getOwnState()`
- Access `ownState.priceKnowledge`

**`recalculatePricesForKnownSystems()`:**
- `this.getState()` → `this.capabilities.getOwnState()` for priceKnowledge, marketConditions
- `state.player.daysElapsed` → `this.capabilities.getDaysElapsed()`
- `state.world.activeEvents` → `this.capabilities.getActiveEvents()`
- `this.getStarData()` → `this.capabilities.starData`

**`getPriceKnowledge()`, `getKnownPrices()`, `hasVisitedSystem()`:**
- `this.getState()` → `this.capabilities.getOwnState()`
- Access `ownState.priceKnowledge`

**`isGoodRestricted()`:**
- `this.gameStateManager.getDangerZone(systemId)` → `this.capabilities.getDangerZone(systemId)`

**`validateState()` calls:** Remove all `this.validateState()` calls. With capabilities, there is no full state object to validate — managers trust their capability getters. The coordinator ensures state is initialized before managers are used.

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass. TradingManager tests create GSM instances which construct the coordinator which now passes capabilities.

**Step 4: Apply formatting**

Run: `npx prettier --write src/game/state/managers/trading.js src/game/state/game-coordinator.js`

**Step 5: Commit**

```
git add src/game/state/managers/trading.js src/game/state/game-coordinator.js
git commit -m "Migrate TradingManager to capability injection"
```

---

### Task 2: Migrate DebtManager to capability injection

**Files:**
- Modify: `src/game/state/managers/debt.js`
- Modify: `src/game/state/game-coordinator.js` (line ~293)

**Step 1: Update coordinator to pass capability object to DebtManager**

In `src/game/state/game-coordinator.js`, replace line 293:

```js
this.debtManager = new DebtManager(this);
```

with:

```js
this.debtManager = new DebtManager({
  getOwnState: () => ({
    debt: this.state.player.debt,
    finance: this.state.player.finance,
  }),
  getDaysElapsed: () => this.state.player.daysElapsed,
  getCredits: () => this.state.player.credits,
  getShipCargo: () => this.state.ship.cargo,
  getCurrentSystem: () => this.state.player.currentSystem,
  updateDebt: (amount) => this.stateManager.updateDebt(amount),
  updateCredits: (value) => this.stateManager.updateCredits(value),
  modifyRepRaw: (npcId, amount, reason) =>
    this.npcManager.modifyRepRaw(npcId, amount, reason),
  markDirty: () => this.markDirty(),
  emit: (...args) => this.emit(...args),
  starData: this.starData,
  isTestEnvironment: this.isTestEnvironment,
});
```

**Note on ordering:** DebtManager is constructed at line 293, after NPCManager (line 99). The `this.npcManager.modifyRepRaw` reference is safe.

**Step 2: Update DebtManager to use capabilities instead of GSM**

Replace `this.getState()` and `this.gameStateManager.X()` calls:

**`getFinance()`:**
- `this.getState()` → `this.capabilities.getOwnState()`
- Access `ownState.finance`. Note: if `finance` is undefined, DebtManager initializes it — this still works because `ownState.finance` is a reference into the coordinator's `this.state.player.finance`.
- However, the initialization path sets `state.player.finance = { ... }`. With capabilities, `ownState.finance` would be undefined, and setting it won't write back to the coordinator's state. **Fix:** Add a `setFinance` capability to allow initializing the finance object, OR have the coordinator pre-initialize `state.player.finance` in `initNewGame()` / `loadGame()`.

**Better approach:** The coordinator already handles state initialization. Add `initFinance` capability that sets `this.state.player.finance`:

Add to the DebtManager capabilities object:
```js
initFinance: (financeObj) => { this.state.player.finance = financeObj; },
```

Then in DebtManager's `getFinance()`:
```js
getFinance() {
  const ownState = this.capabilities.getOwnState();
  if (!ownState.finance) {
    const financeObj = {
      heat: COLE_DEBT_CONFIG.STARTING_HEAT,
      lienRate: COLE_DEBT_CONFIG.STARTING_LIEN_RATE,
      interestRate: COLE_DEBT_CONFIG.INTEREST_RATE,
      lastInterestDay: 0,
      nextCheckpoint:
        this.capabilities.getDaysElapsed() + COLE_DEBT_CONFIG.STARTING_CHECKPOINT_DAY,
      totalBorrowed: 0,
      totalRepaid: 0,
      borrowedThisPeriod: false,
      lastCheckpointRepaid: 0,
    };
    this.capabilities.initFinance(financeObj);
    return financeObj;
  }
  return ownState.finance;
}
```

**`getDebt()`:**
- `this.getState().player.debt` → `this.capabilities.getOwnState().debt`

**`applyInterest()`:**
- `this.getState()` → use capabilities
- `state.player.daysElapsed` → `this.capabilities.getDaysElapsed()`
- `this.gameStateManager.updateDebt(...)` → `this.capabilities.updateDebt(...)`

**`getMaxDraw()`:**
- `state.player.credits` → `this.capabilities.getCredits()`
- `state.ship.cargo` → `this.capabilities.getShipCargo()`

**`borrow()`:**
- `state.player.credits` → `this.capabilities.getCredits()`
- `this.gameStateManager.updateDebt(...)` → `this.capabilities.updateDebt(...)`
- `this.gameStateManager.updateCredits(...)` → `this.capabilities.updateCredits(...)`
- `state.player.daysElapsed` → `this.capabilities.getDaysElapsed()`
- `this.gameStateManager.markDirty()` → `this.capabilities.markDirty()`

**`makePayment()`:**
- Same patterns as `borrow()`

**`checkCheckpoint()`:**
- `state.player.daysElapsed` → `this.capabilities.getDaysElapsed()`

**`generateFavorMission()`:**
- `state.player.daysElapsed` → `this.capabilities.getDaysElapsed()`
- `state.player.currentSystem` → `this.capabilities.getCurrentSystem()`
- `this.getStarData()` → `this.capabilities.starData`

**`modifyColeRep()`:**
- `this.gameStateManager.modifyRepRaw(...)` → `this.capabilities.modifyRepRaw(...)`

**`getDebtInfo()`:**
- `state.player.credits` → `this.capabilities.getCredits()`

**Remove all `this.validateState()` calls.**

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass.

**Step 4: Apply formatting**

Run: `npx prettier --write src/game/state/managers/debt.js src/game/state/game-coordinator.js`

**Step 5: Commit**

```
git add src/game/state/managers/debt.js src/game/state/game-coordinator.js
git commit -m "Migrate DebtManager to capability injection"
```

---

### Task 3: Migrate MissionManager to capability injection

**Files:**
- Modify: `src/game/state/managers/mission.js`
- Modify: `src/game/state/game-coordinator.js` (line ~245)

**Step 1: Update coordinator to pass capability object to MissionManager**

In `src/game/state/game-coordinator.js`, replace line 245:

```js
this.missionManager = new MissionManager(this);
```

with:

```js
this.missionManager = new MissionManager({
  getOwnState: () => this.state.missions,
  getDaysElapsed: () => this.state.player.daysElapsed,
  getCurrentSystem: () => this.state.player.currentSystem,
  getCredits: () => this.state.player.credits,
  getShipCargo: () => this.state.ship.cargo,
  getCargoRemaining: () => this.stateManager.getCargoRemaining(),
  getStats: () => this.state.stats,
  getVisitedSystems: () => this.state.world.visitedSystems,
  getDangerZone: (systemId) => this.dangerManager.getDangerZone(systemId),
  getFactionRep: (faction) => this.dangerManager.getFactionRep(faction),
  updateCredits: (value) => this.stateManager.updateCredits(value),
  applyTradeWithholding: (totalRevenue) =>
    this.debtManager.applyWithholding(totalRevenue),
  modifyFactionRep: (faction, amount, reason) =>
    this.dangerManager.modifyFactionRep(faction, amount, reason),
  modifyRep: (npcId, amount, reason) =>
    this.npcManager.modifyRep(npcId, amount, reason),
  modifyKarma: (amount, reason) =>
    this.dangerManager.modifyKarma(amount, reason),
  modifyColeRep: (delta) => this.debtManager.modifyColeRep(delta),
  removeCargoForMission: (goodType, qty) =>
    this.shipManager.removeCargoForMission(goodType, qty),
  updateStats: (key, delta) => {
    if (this.state.stats) {
      this.state.stats[key] = (this.state.stats[key] || 0) + delta;
    }
  },
  markDirty: () => this.markDirty(),
  emit: (...args) => this.emit(...args),
  starData: this.starData,
  wormholeData: this.wormholeData,
  isTestEnvironment: this.isTestEnvironment,
});
```

**Step 2: Update MissionManager to use capabilities instead of GSM**

Key replacements across all methods:

**State access pattern:**
- `this.getState()` → `const missions = this.capabilities.getOwnState()` for mission state
- `state.missions.active` → `missions.active`
- `state.missions.board` → `missions.board`
- `state.player.daysElapsed` → `this.capabilities.getDaysElapsed()`
- `state.player.currentSystem` → `this.capabilities.getCurrentSystem()`
- `state.player.credits` → `this.capabilities.getCredits()`
- `state.ship.cargo` → `this.capabilities.getShipCargo()`
- `state.world.visitedSystems` → `this.capabilities.getVisitedSystems()`

**Cross-domain calls:**
- `this.gameStateManager.getCargoRemaining()` → `this.capabilities.getCargoRemaining()`
- `this.gameStateManager.applyTradeWithholding(...)` → `this.capabilities.applyTradeWithholding(...)`
- `this.gameStateManager.modifyFactionRep(...)` → `this.capabilities.modifyFactionRep(...)`
- `this.gameStateManager.modifyRep(...)` → `this.capabilities.modifyRep(...)`
- `this.gameStateManager.modifyColeRep(...)` → `this.capabilities.modifyColeRep(...)`
- `this.gameStateManager.modifyKarma(...)` → `this.capabilities.modifyKarma(...)`
- `this.gameStateManager.removeCargoForMission(...)` → `this.capabilities.removeCargoForMission(...)`
- `this.gameStateManager.getDangerZone(...)` → `this.capabilities.getDangerZone(...)`
- `this.gameStateManager.getFactionRep(...)` → `this.capabilities.getFactionRep(...)`
- `this.gameStateManager.markDirty()` → `this.capabilities.markDirty()`

**Special cases in `acceptMission()`:**
- `state.ship.cargo.push(...)` for mission cargo — this directly mutates cargo. Since `getShipCargo()` returns a reference, this still works. But for consistency, keep this pattern (it already works in the current code with direct mutation + emit).

**Special cases in `completeMission()`:**
- `state.player.credits += playerReceives` — this is a direct mutation of player credits. Replace with: `this.capabilities.updateCredits(this.capabilities.getCredits() + playerReceives)`
- `state.stats.cargoHauled` / `state.stats.creditsEarned` — Replace with `this.capabilities.updateStats('creditsEarned', grossCredits)`

**Special cases in `refreshMissionBoard()`:**
- `this.gameStateManager.starData` → `this.capabilities.starData`
- `this.gameStateManager.wormholeData` → `this.capabilities.wormholeData`
- Remove the defensive `typeof this.gameStateManager.getDangerZone === 'function'` checks — with capabilities, these are always provided

**Remove all `this.validateState()` calls.**

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass. Many mission tests exist — this is the most cross-referenced manager.

**Step 4: Apply formatting**

Run: `npx prettier --write src/game/state/managers/mission.js src/game/state/game-coordinator.js`

**Step 5: Commit**

```
git add src/game/state/managers/mission.js src/game/state/game-coordinator.js
git commit -m "Migrate MissionManager to capability injection"
```

---

### Task 4: Migrate EventsManager to capability injection

**Files:**
- Modify: `src/game/state/managers/events.js`
- Modify: `src/game/state/game-coordinator.js` (line ~153)

**Step 1: Update coordinator to pass capability object to EventsManager**

In `src/game/state/game-coordinator.js`, replace line 153:

```js
this.eventsManager = new EventsManager(this);
```

with:

```js
this.eventsManager = new EventsManager({
  getOwnState: () => ({
    activeEvents: this.state.world.activeEvents,
    daysElapsed: this.state.player.daysElapsed,
  }),
  setDaysElapsed: (newDays) => { this.state.player.daysElapsed = newDays; },
  setActiveEvents: (events) => { this.state.world.activeEvents = events; },
  getPriceKnowledge: () => this.state.world.priceKnowledge,
  getMarketConditions: () => this.state.world.marketConditions,
  incrementPriceKnowledgeStaleness: (days) =>
    this.tradingManager.incrementPriceKnowledgeStaleness(days),
  applyMarketRecovery: (daysPassed) =>
    this.tradingManager.applyMarketRecovery(daysPassed),
  recalculatePricesForKnownSystems: () =>
    this.tradingManager.recalculatePricesForKnownSystems(),
  checkLoanDefaults: () => this.npcManager.checkLoanDefaults(),
  processDebtTick: () => {
    this.debtManager.applyInterest();
    return this.debtManager.checkCheckpoint();
  },
  checkMissionDeadlines: () => this.missionManager.checkMissionDeadlines(),
  cleanupOldIntelligence: () =>
    InformationBroker.cleanupOldIntelligence(this.state.world.priceKnowledge),
  markDirty: () => this.markDirty(),
  emit: (...args) => this.emit(...args),
  starData: this.starData,
  isTestEnvironment: this.isTestEnvironment,
});
```

**Important:** Add `import { InformationBroker } from '../../game-information-broker.js';` at the top of `game-coordinator.js` if not already imported. Actually, check if it's already imported. If not, add it.

**Note on ordering:** EventsManager is constructed at line 153, but references `this.tradingManager` (line 88), `this.npcManager` (line 99), `this.debtManager` (line 293), and `this.missionManager` (line 245). DebtManager and MissionManager are constructed AFTER EventsManager. This works because all callbacks are closures — `this.debtManager` and `this.missionManager` are resolved at call time (when `updateTime()` runs), not at construction time (when the capability object is created). By the time `updateTime()` is called, all managers are constructed.

**Step 2: Update EventsManager to use capabilities instead of GSM**

The EventsManager is small (117 lines). Key changes:

**Constructor:**
```js
constructor(capabilities) {
  super(capabilities);
}
```

Remove `this.starData = gameStateManager.starData;` — it becomes `this.capabilities.starData`.

**`getActiveEvents()`:**
- `this.getState()` → `this.capabilities.getOwnState()`
- `state.world.activeEvents` → `ownState.activeEvents`

**`updateActiveEvents(newEvents)`:**
- `this.getState()` → `this.capabilities.setActiveEvents(newEvents)`
- `this.emit(...)` → `this.capabilities.emit(...)`

**`getActiveEventForSystem(systemId)`:**
- Uses `this.getActiveEvents()` which is already updated

**`updateTime(newDays)`:**
This is the critical orchestration method. Replace:

```js
updateTime(newDays) {
  const ownState = this.capabilities.getOwnState();
  const oldDays = ownState.daysElapsed;
  this.capabilities.setDaysElapsed(newDays);

  if (newDays > oldDays) {
    const daysPassed = newDays - oldDays;

    this.capabilities.incrementPriceKnowledgeStaleness(daysPassed);

    this.capabilities.cleanupOldIntelligence();

    this.capabilities.applyMarketRecovery(daysPassed);

    // calculateUpdatedEvents needs the full state shape — build it from capabilities
    const stateForCalc = {
      player: { daysElapsed: newDays },
      world: {
        activeEvents: this.capabilities.getOwnState().activeEvents,
        priceKnowledge: this.capabilities.getPriceKnowledge(),
        marketConditions: this.capabilities.getMarketConditions(),
      },
    };
    const updatedEvents = calculateUpdatedEvents(stateForCalc, this.capabilities.starData);
    this.capabilities.setActiveEvents(updatedEvents);

    this.capabilities.recalculatePricesForKnownSystems();

    this.capabilities.checkLoanDefaults();

    this.capabilities.processDebtTick();

    this.capabilities.checkMissionDeadlines();

    this.capabilities.emit(EVENT_NAMES.ACTIVE_EVENTS_CHANGED, updatedEvents);
  }

  this.capabilities.emit(EVENT_NAMES.TIME_CHANGED, newDays);
}
```

**Important:** Check what `calculateUpdatedEvents()` actually needs from `state`. It may only need `state.player.daysElapsed` and `state.world.activeEvents`. Read the function signature in `src/game/utils/calculators.js` to confirm the exact shape required and build the minimal state object.

**Remove all `this.validateState()` calls.**

**Remove the `InformationBroker` import from `events.js`** — the coordinator now handles that call.

**Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass.

**Step 4: Apply formatting**

Run: `npx prettier --write src/game/state/managers/events.js src/game/state/game-coordinator.js`

**Step 5: Commit**

```
git add src/game/state/managers/events.js src/game/state/game-coordinator.js
git commit -m "Migrate EventsManager to capability injection"
```

---

### Task 5: Update capability typedefs and verify completeness

**Files:**
- Modify: `src/game/state/capabilities.js` (lines 345-450)

**Step 1: Update capability typedefs to match actual implementation**

Review the implemented capability objects in the coordinator against the existing typedefs. Update any discrepancies:

- `TradingCapabilities`: Add `getDaysElapsed`, `getActiveEvents` if not already present. Verify `getCurrentSystem` returns number (system ID, not object).
- `DebtCapabilities`: Add `getCurrentSystem`, `initFinance` if added.
- `MissionCapabilities`: Add `wormholeData`. Verify `modifyColeRep` is listed.
- `EventsCapabilities`: Add `setDaysElapsed`, `setActiveEvents`, `getMarketConditions`, `cleanupOldIntelligence`.

**Step 2: Run the capability interface completeness test**

Run: `npm test -- tests/unit/capability-interfaces.test.js`
Expected: All tests pass. This test validates that all typedefs account for cross-domain dependencies.

**Step 3: Commit**

```
git add src/game/state/capabilities.js
git commit -m "Update Batch 4 capability typedefs to match implementation"
```

---

### Task 6: Final verification and formatting

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 2: Run linter and formatter**

Run: `npm run clean`
Expected: No errors.

**Step 3: Verify no remaining `this.gameStateManager` references in migrated files**

Check that none of the four migrated files still reference `this.gameStateManager`:

Grep for `this.gameStateManager` in:
- `src/game/state/managers/trading.js` — should have 0 matches
- `src/game/state/managers/debt.js` — should have 0 matches
- `src/game/state/managers/mission.js` — should have 0 matches
- `src/game/state/managers/events.js` — should have 0 matches

Also grep for `this.getState()` in these files — should have 0 matches.

**Step 4: Verify no remaining `this.validateState()` in migrated files**

Grep for `this.validateState()` in the four files — should have 0 matches.

**Step 5: Update design doc**

In `docs/plans/2026-03-08-gsm-refactor-design.md`, update the Phase 3 Batch 4 row:

```
| Phase 3 Batch 4 | `2026-03-08-gsm-phase3-batch4-implementation.md` | Complete |
```

And update the Phase 3 Batch 5 row:

```
| Phase 3 Batch 5 | (create when Batch 4 is complete) | — |
```

**Step 6: Commit**

```
git add docs/plans/2026-03-08-gsm-refactor-design.md
git commit -m "Mark Phase 3 Batch 4 complete in design doc"
```
