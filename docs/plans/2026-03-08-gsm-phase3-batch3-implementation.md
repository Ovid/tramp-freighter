# Phase 3 Batch 3: Migrate Moderate Complexity Managers

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate RefuelManager, DangerManager, ShipManager, InfoBrokerManager, RepairManager, and NPCManager from old-style (`this.gameStateManager`) to new-style capability injection.

**Architecture:** Each manager stops using `this.getState()` and `this.gameStateManager.X()` and instead receives a capability object with explicit read queries, write callbacks, and infrastructure. The coordinator builds these capability objects and passes them at construction time. BaseManager's dual-mode support (added in Batch 1) allows migrated and unmigrated managers to coexist.

**Tech Stack:** Vitest, ES Modules, JSDoc typedefs (already defined in `src/game/state/capabilities.js`)

**Managers in this batch (ordered by complexity):**
1. RefuelManager — no owned state, reads fuel/credits/system, writes credits/fuel
2. DangerManager — owns karma/factions/dangerFlags, reads cargo/upgrades/starData, writes cargo
3. ShipManager — owns ship.hull/engine/lifeSupport/quirks/upgrades/cargoCapacity/hiddenCargo/name, needs credits/cargo callbacks
4. InfoBrokerManager — no owned state, delegates to static InformationBroker class, needs coordinatorRef for static method calls
5. RepairManager — no owned state, needs ship condition/credits/NPC queries, advanceTime callback
6. NPCManager — owns state.npcs, most cross-domain reads/writes (credits, cargo, achievements)

**Design reference:** `docs/plans/2026-03-08-gsm-refactor-design.md` Phase 3 section. Capability typedefs: `src/game/state/capabilities.js` lines 212-338.

**Migration pattern established in Batch 1:** See `docs/plans/2026-03-08-gsm-phase3-batch1-implementation.md` "Migration Pattern Reference" section.

---

### Task 1: Migrate RefuelManager

**Files:**
- Modify: `src/game/state/capabilities.js` (verify typedef)
- Modify: `src/game/state/managers/refuel.js`
- Modify: `src/game/state/game-coordinator.js` (constructor only)
- Test: `tests/unit/refuel-manager.test.js`, `tests/unit/refuel-capacity.test.js`, `tests/unit/refuel-npc-discount.test.js` (all use `createTestGameStateManager()`, no changes needed)

**Context:** RefuelManager is the simplest Batch 3 manager. It has no owned state — it reads fuel, credits, and current system, writes credits and fuel via GSM. Its `getFuelPrice()` method calls `this.getStarData()` for system distance calculation. Its `validateRefuel()` calls `this.gameStateManager.getFuelCapacity()`. Its `refuel()` calls `this.gameStateManager.updateCredits()`, `this.gameStateManager.updateFuel()`, `this.gameStateManager.getFuelCapacity()`, and `this.gameStateManager.markDirty()`.

**Step 1: Verify RefuelCapabilities typedef**

In `src/game/state/capabilities.js`, verify the `RefuelCapabilities` typedef (lines 276-292) matches what the manager actually needs. It should have:
```js
/**
 * @typedef {Object} RefuelCapabilities
 *
 * @property {function(): number} getShipFuel
 * @property {function(): number} getCredits
 * @property {function(): number} getCurrentSystem
 * @property {function(): number} getFuelCapacity
 *
 * @property {function(number): void} updateCredits
 * @property {function(number): void} updateFuel
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 */
```

**Step 2: Update coordinator constructor**

In `src/game/state/game-coordinator.js`, replace the RefuelManager instantiation (line ~92):

```js
// Before:
this.refuelManager = new RefuelManager(this);

// After:
this.refuelManager = new RefuelManager({
  getShipFuel: () => this.state.ship.fuel,
  getCredits: () => this.state.player.credits,
  getCurrentSystem: () => this.state.player.currentSystem,
  getFuelCapacity: () => this.shipManager.getFuelCapacity(),
  updateCredits: (value) => this.stateManager.updateCredits(value),
  updateFuel: (value) => this.stateManager.updateFuel(value),
  markDirty: this.markDirty.bind(this),
  emit: this.emit.bind(this),
  starData: this.starData,
  isTestEnvironment: this.isTestEnvironment,
});
```

**Important ordering note:** `this.shipManager` must be instantiated BEFORE `this.refuelManager` because `getFuelCapacity` delegates to it. Check current order — ShipManager is at line ~89, RefuelManager at ~92. This is fine.

**Step 3: Update the manager**

In `src/game/state/managers/refuel.js`:

3a. Remove the constructor (BaseManager's dual-mode constructor handles it).

3b. Replace `getFuelPrice(systemId)` — use `this.capabilities.starData` instead of `this.getStarData()`:

```js
getFuelPrice(systemId) {
  if (FUEL_PRICING_CONFIG.CORE_SYSTEMS.IDS.includes(systemId)) {
    return FUEL_PRICING_CONFIG.CORE_SYSTEMS.PRICE_PER_PERCENT;
  }

  const system = this.capabilities.starData.find((s) => s.id === systemId);
  if (!system) {
    return FUEL_PRICING_CONFIG.INNER_SYSTEMS.PRICE_PER_PERCENT;
  }

  const distanceFromSol = calculateDistanceFromSol(system);

  if (
    distanceFromSol < FUEL_PRICING_CONFIG.INNER_SYSTEMS.DISTANCE_THRESHOLD
  ) {
    return FUEL_PRICING_CONFIG.INNER_SYSTEMS.PRICE_PER_PERCENT;
  }

  if (
    distanceFromSol < FUEL_PRICING_CONFIG.MID_RANGE_SYSTEMS.DISTANCE_THRESHOLD
  ) {
    return FUEL_PRICING_CONFIG.MID_RANGE_SYSTEMS.PRICE_PER_PERCENT;
  }

  return FUEL_PRICING_CONFIG.OUTER_SYSTEMS.PRICE_PER_PERCENT;
}
```

3c. Replace `validateRefuel()` — use `this.capabilities.getFuelCapacity()`:

```js
validateRefuel(currentFuel, amount, credits, pricePerPercent) {
  const totalCost = Math.ceil(amount * pricePerPercent);
  const maxFuel = this.capabilities.getFuelCapacity();

  // ... rest unchanged except maxFuel source
}
```

3d. Replace `refuel()` — use capabilities for all state reads and writes:

```js
refuel(amount, discount = 0) {
  this.validateState();

  const currentFuel = this.capabilities.getShipFuel();
  const credits = this.capabilities.getCredits();
  const systemId = this.capabilities.getCurrentSystem();
  const pricePerPercent = this.getFuelPrice(systemId);
  const effectivePrice =
    discount > 0 ? pricePerPercent * (1 - discount) : pricePerPercent;

  const validation = this.validateRefuel(
    currentFuel,
    amount,
    credits,
    effectivePrice
  );

  if (!validation.valid) {
    return { success: false, reason: validation.reason };
  }

  this.capabilities.updateCredits(credits - validation.cost);

  const maxFuel = this.capabilities.getFuelCapacity();
  const newFuel = Math.min(currentFuel + amount, maxFuel);

  if (newFuel < currentFuel) {
    throw new Error(
      `CRITICAL BUG: Refuel would reduce fuel from ${currentFuel}% to ${newFuel}%. ` +
        `Amount: ${amount}, MaxFuel: ${maxFuel}. This should never happen.`
    );
  }

  this.capabilities.updateFuel(newFuel);
  this.capabilities.markDirty();

  return { success: true, reason: null };
}
```

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass. Refuel tests use `createTestGameStateManager()`, which goes through the full pipeline.

**Step 5: Commit**

```
git add src/game/state/capabilities.js src/game/state/managers/refuel.js src/game/state/game-coordinator.js
git commit -m "Migrate RefuelManager to capability injection"
```

---

### Task 2: Migrate DangerManager

**Files:**
- Modify: `src/game/state/capabilities.js` (verify typedef)
- Modify: `src/game/state/managers/danger.js`
- Modify: `src/game/state/game-coordinator.js` (constructor only)
- Test: `tests/unit/danger-manager-coverage.test.js`, `tests/unit/danger-events.test.js`, `tests/unit/danger-utils.test.js`, `tests/unit/danger-edge-cases.test.js`, `tests/unit/danger-manager-markdirty.test.js` (all use `createTestGameStateManager()`, verify no changes needed)
- Check: `tests/unit/cargo-run-customs.test.js` — directly instantiates DangerManager with mock GSM `{ state: {}, emit: vi.fn(), isTestEnvironment: true }`. This test needs updating.

**Context:** DangerManager owns `state.player.karma`, `state.player.factions`, and `state.world.dangerFlags`. It reads `player.currentSystem`, `ship.cargo`, `ship.upgrades`, `ship.engine`, `player.factions`, and `stats`. It calls `this.getStarData()` for distance calculations, `this.gameStateManager.updateCargo()` for cargo confiscation, `this.gameStateManager.checkAchievements()`, and `this.gameStateManager.markDirty()`.

Its `calculatePirateEncounterChance()` and `calculateInspectionChance()` take `gameState` as a parameter (already passed from the caller). These methods don't need to change — they use the parameter, not `this.getState()`.

**Step 1: Update DangerCapabilities typedef**

In `src/game/state/capabilities.js`, verify and update the `DangerCapabilities` typedef. Add `getDaysElapsed` (needed by modifyKarma's stats tracking):

```js
/**
 * @typedef {Object} DangerCapabilities
 *
 * @property {function(): DangerState} getOwnState
 *   Returns: { karma: state.player.karma, factions: state.player.factions,
 *              dangerFlags: state.world.dangerFlags }
 *
 * @property {function(): number} getCurrentSystem
 * @property {function(): Array} getShipCargo
 * @property {function(): Array} getShipUpgrades
 * @property {function(): Object|undefined} getStats
 *
 * @property {function(Array): void} updateCargo
 *   For removeRestrictedCargo
 * @property {function(): void} checkAchievements
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 */
```

**Step 2: Update coordinator constructor**

In `src/game/state/game-coordinator.js`, replace the DangerManager instantiation (line ~102):

```js
// Before:
this.dangerManager = new DangerManager(this);

// After:
this.dangerManager = new DangerManager({
  getOwnState: () => ({
    karma: this.state.player.karma,
    factions: this.state.player.factions,
    dangerFlags: this.state.world.dangerFlags,
  }),
  getCurrentSystem: () => this.state.player.currentSystem,
  getShipCargo: () => this.state.ship.cargo,
  getShipUpgrades: () => this.state.ship.upgrades,
  getStats: () => this.state.stats,
  updateCargo: (newCargo) => this.stateManager.updateCargo(newCargo),
  checkAchievements: () => this.achievementsManager.checkAchievements(),
  markDirty: this.markDirty.bind(this),
  emit: this.emit.bind(this),
  starData: this.starData,
  isTestEnvironment: this.isTestEnvironment,
});
```

**Critical ordering issue:** DangerManager's capability object references `this.achievementsManager.checkAchievements()`, but AchievementsManager is instantiated AFTER DangerManager (line ~213). This is fine because the capability is a closure — `this.achievementsManager` will be set by the time `checkAchievements` is actually called (during gameplay, not during construction). But verify this in testing.

**Also critical:** Several other managers' capability objects reference `this.dangerManager.incrementDangerFlag()` etc. (CombatManager, InspectionManager, DistressManager, NegotiationManager). Since DangerManager is instantiated before these managers, this works. But now DangerManager itself becomes capability-injected, so `this.dangerManager` will be initialized with the capability object. Verify the Batch 1 managers' closures still resolve correctly.

**Step 3: Update the manager**

In `src/game/state/managers/danger.js`:

3a. Remove the constructor.

3b. Replace `getDangerZone(systemId)` — use `this.capabilities.starData` instead of `this.getStarData()`:

```js
getDangerZone(systemId) {
  const { ZONES } = DANGER_CONFIG;

  if (ZONES.safe.systems.includes(systemId)) {
    return 'safe';
  }

  if (ZONES.contested.systems.includes(systemId)) {
    return 'contested';
  }

  const system = this.capabilities.starData.find((s) => s.id === systemId);
  if (system) {
    const distance = calculateDistanceFromSol(system);
    if (distance > ZONES.dangerous.distanceThreshold) {
      return 'dangerous';
    }
  }

  return 'contested';
}
```

3c. Replace karma methods — use `this.capabilities.getOwnState()` instead of `this.getState()`:

For `getKarma()`:
```js
getKarma() {
  this.validateState();
  return this.capabilities.getOwnState().karma;
}
```

For `setKarma(value)`:
```js
setKarma(value) {
  this.validateState();

  const newKarma = Math.max(
    KARMA_CONFIG.MIN,
    Math.min(KARMA_CONFIG.MAX, value)
  );

  // DangerManager owns player.karma, but getOwnState returns a view object.
  // The view references the live state, but primitive reassignment won't propagate.
  // Instead, we need a setter. However, the current getOwnState returns
  // { karma: this.state.player.karma } which copies the primitive.
  //
  // SOLUTION: getOwnState must return references that support mutation.
  // For DangerManager, the coordinator must provide direct setters.

  // Actually, we need setKarma/setFactions setters or direct state references.
  // Let's use the emit pattern and add write callbacks.
}
```

**Wait — design issue.** DangerManager's `getOwnState()` returns `{ karma, factions, dangerFlags }`. But `karma` is a primitive (number), so `ownState.karma = newValue` creates a local property on the view object and does NOT mutate `this.state.player.karma` in the coordinator.

**The `factions` object and `dangerFlags` object are references** — mutations to them propagate. But `karma` (a number) does not.

**Solution:** Add `setKarma(value)` and `setFactions(factions)` write callbacks to DangerCapabilities, OR restructure `getOwnState` to return the parent objects.

**Chosen approach:** Add write callbacks for the primitive fields. Update the typedef:

```js
/**
 * @typedef {Object} DangerCapabilities
 *
 * @property {function(): Object} getPlayerFactions
 *   Returns: state.player.factions (mutable reference)
 * @property {function(): Object} getDangerFlags
 *   Returns: state.world.dangerFlags (mutable reference)
 * @property {function(): number} getKarma
 *   Returns: state.player.karma (read only — use setKarma to write)
 *
 * @property {function(): number} getCurrentSystem
 * @property {function(): Array} getShipCargo
 * @property {function(): Array} getShipUpgrades
 * @property {function(): Object|undefined} getStats
 *
 * @property {function(number): void} setKarma
 *   Sets state.player.karma to exact value
 * @property {function(Array): void} updateCargo
 *   For removeRestrictedCargo
 * @property {function(): void} checkAchievements
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 */
```

**Updated coordinator capability object:**

```js
this.dangerManager = new DangerManager({
  getKarma: () => this.state.player.karma,
  setKarma: (value) => {
    this.state.player.karma = value;
  },
  getPlayerFactions: () => this.state.player.factions,
  getDangerFlags: () => this.state.world.dangerFlags,
  getCurrentSystem: () => this.state.player.currentSystem,
  getShipCargo: () => this.state.ship.cargo,
  getShipUpgrades: () => this.state.ship.upgrades,
  getStats: () => this.state.stats,
  updateCargo: (newCargo) => this.stateManager.updateCargo(newCargo),
  checkAchievements: () => this.achievementsManager.checkAchievements(),
  markDirty: this.markDirty.bind(this),
  emit: this.emit.bind(this),
  starData: this.starData,
  isTestEnvironment: this.isTestEnvironment,
});
```

Now update the manager methods:

For `getKarma()`:
```js
getKarma() {
  this.validateState();
  return this.capabilities.getKarma();
}
```

For `setKarma(value)`:
```js
setKarma(value) {
  this.validateState();

  const newKarma = Math.max(
    KARMA_CONFIG.MIN,
    Math.min(KARMA_CONFIG.MAX, value)
  );

  this.capabilities.setKarma(newKarma);

  this.log(`Karma set to ${newKarma}`);
  this.capabilities.emit(EVENT_NAMES.KARMA_CHANGED, newKarma);
  this.capabilities.markDirty();
}
```

For `modifyKarma(amount, reason)`:
```js
modifyKarma(amount, reason) {
  this.validateState();

  const currentKarma = this.capabilities.getKarma();
  const newKarma = Math.max(
    KARMA_CONFIG.MIN,
    Math.min(KARMA_CONFIG.MAX, currentKarma + amount)
  );

  this.capabilities.setKarma(newKarma);

  const stats = this.capabilities.getStats();
  if (stats && amount > 0) {
    stats.charitableActs++;
  }

  this.log(
    `Karma changed by ${amount} (${reason}): ${currentKarma} -> ${newKarma}`
  );
  this.capabilities.emit(EVENT_NAMES.KARMA_CHANGED, newKarma);
  this.capabilities.checkAchievements();
  this.capabilities.markDirty();
}
```

3d. Replace faction methods — `getPlayerFactions()` returns a mutable reference, so direct mutation works:

For `getFactionRep(faction)`:
```js
getFactionRep(faction) {
  this.validateState();

  if (!FACTION_CONFIG.FACTIONS.includes(faction)) {
    throw new Error(
      `Invalid faction: ${faction}. Valid factions: ${FACTION_CONFIG.FACTIONS.join(', ')}`
    );
  }

  return this.capabilities.getPlayerFactions()[faction];
}
```

For `setFactionRep(faction, value)`:
```js
setFactionRep(faction, value) {
  this.validateState();

  if (!FACTION_CONFIG.FACTIONS.includes(faction)) {
    throw new Error(
      `Invalid faction: ${faction}. Valid factions: ${FACTION_CONFIG.FACTIONS.join(', ')}`
    );
  }

  const newRep = Math.max(
    FACTION_CONFIG.MIN,
    Math.min(FACTION_CONFIG.MAX, value)
  );

  this.capabilities.getPlayerFactions()[faction] = newRep;

  this.log(`${faction} reputation set to ${newRep}`);
  this.capabilities.emit(EVENT_NAMES.FACTION_REP_CHANGED, {
    ...this.capabilities.getPlayerFactions(),
  });
  this.capabilities.markDirty();
}
```

For `modifyFactionRep(faction, amount, reason)`:
```js
modifyFactionRep(faction, amount, reason) {
  this.validateState();

  if (!FACTION_CONFIG.FACTIONS.includes(faction)) {
    throw new Error(
      `Invalid faction: ${faction}. Valid factions: ${FACTION_CONFIG.FACTIONS.join(', ')}`
    );
  }

  const factions = this.capabilities.getPlayerFactions();
  const currentRep = factions[faction];
  const newRep = Math.max(
    FACTION_CONFIG.MIN,
    Math.min(FACTION_CONFIG.MAX, currentRep + amount)
  );

  factions[faction] = newRep;

  this.log(
    `${faction} reputation changed by ${amount} (${reason}): ${currentRep} -> ${newRep}`
  );

  this.capabilities.emit(EVENT_NAMES.FACTION_REP_CHANGED, {
    ...factions,
  });
  this.capabilities.markDirty();
}
```

3e. Replace danger flag and cargo methods:

For `incrementDangerFlag(flagName)`:
```js
incrementDangerFlag(flagName) {
  this.validateState();
  const dangerFlags = this.capabilities.getDangerFlags();
  if (dangerFlags && typeof dangerFlags[flagName] === 'number') {
    dangerFlags[flagName]++;
  }
  this.capabilities.checkAchievements();
}
```

For `hasIllegalMissionCargo(cargo)`:
```js
hasIllegalMissionCargo(cargo) {
  if (!cargo) {
    cargo = this.capabilities.getShipCargo();
  }
  return cargo.some(
    (item) =>
      item.missionId && MISSION_CARGO_TYPES.illegal.includes(item.good)
  );
}
```

For `removeRestrictedCargo()`:
```js
removeRestrictedCargo() {
  this.validateState();
  const systemId = this.capabilities.getCurrentSystem();
  const zone = this.getDangerZone(systemId);
  const cargo = this.capabilities.getShipCargo();

  const allRestricted = this._buildRestrictedList(zone, systemId);

  const newCargo = cargo.filter((item) => {
    if (item.missionId && MISSION_CARGO_TYPES.illegal.includes(item.good))
      return false;
    return !allRestricted.includes(item.good);
  });

  this.capabilities.updateCargo(newCargo);
}
```

3f. `calculatePirateEncounterChance()` and `calculateInspectionChance()` — these take `gameState` as a parameter. They do NOT use `this.getState()` except through `getDangerZone()` and `hasIllegalMissionCargo()` and `countRestrictedGoods()` which are already updated. No parameter changes needed — they continue to receive `gameState` from the coordinator which passes `this.state`.

3g. `calculateCargoValue()`, `countRestrictedGoods()`, `_buildRestrictedList()` — these are pure functions that receive parameters. No changes needed.

**Step 4: Update direct-instantiation tests**

In `tests/unit/cargo-run-customs.test.js`, the mock creates DangerManager with `{ state: {}, emit: vi.fn(), isTestEnvironment: true }`. This uses the legacy path (`'state' in gsmOrCapabilities`). Since DangerManager now expects capabilities, update to:

```js
// Read the test to determine exact mock structure needed.
// The test likely calls getDangerZone, countRestrictedGoods,
// and removeRestrictedCargo. Build appropriate capabilities.
```

Read this test file to determine the exact changes needed before implementing.

**Step 5: Run tests**

Run: `npm test`
Expected: All tests pass.

**Step 6: Commit**

```
git add src/game/state/capabilities.js src/game/state/managers/danger.js src/game/state/game-coordinator.js tests/unit/cargo-run-customs.test.js
git commit -m "Migrate DangerManager to capability injection"
```

---

### Task 3: Migrate ShipManager

**Files:**
- Modify: `src/game/state/capabilities.js` (verify typedef)
- Modify: `src/game/state/managers/ship.js`
- Modify: `src/game/state/game-coordinator.js` (constructor only)
- Test: `tests/unit/ship-manager.test.js`, `tests/unit/ship-manager-coverage.test.js`, `tests/unit/game-ship.test.js` (use `createTestGameStateManager()`, verify no changes needed)
- Check: `tests/unit/add-to-cargo-array-public.test.js` — directly instantiates ShipManager with mock GSM `{ state: { ship: { cargo: [] } }, isTestEnvironment: true }`. Needs updating.

**Context:** ShipManager owns `state.ship.hull`, `ship.engine`, `ship.lifeSupport`, `ship.quirks`, `ship.upgrades`, `ship.cargoCapacity`, `ship.hiddenCargo`, `ship.name`. It reads `player.credits` and `ship.cargo` (cargo is owned by StateManager). It calls `this.gameStateManager.updateCredits()` (for `purchaseUpgrade`), `this.gameStateManager.updateCargo()` (for hidden cargo moves), and `this.gameStateManager.markDirty()`.

The key design point: `getOwnState()` should return a reference to the ship sub-fields that ShipManager owns. Since all the owned fields are on `state.ship`, and `cargo`/`fuel` are NOT owned by ShipManager but are on the same object, we return the specific fields:

```js
getOwnState: () => this.state.ship
```

This returns the entire `state.ship` reference. ShipManager owns most of it (hull, engine, lifeSupport, quirks, upgrades, cargoCapacity, hiddenCargo, name). StateManager owns `ship.fuel` and `ship.cargo`. Since we can't split a reference at the property level, we pass the whole `state.ship` and rely on the documented ownership boundary. ShipManager must not touch `ship.fuel` or `ship.cargo` directly (use `updateCargo` callback instead).

**Step 1: Update ShipCapabilities typedef**

In `src/game/state/capabilities.js`, update the typedef:

```js
/**
 * @typedef {Object} ShipCapabilities
 *
 * @property {function(): Object} getOwnState
 *   Returns: state.ship (mutable reference)
 *   ShipManager owns: hull, engine, lifeSupport, quirks, upgrades,
 *   cargoCapacity, hiddenCargo, hiddenCargoCapacity, name
 *   StateManager owns: fuel, cargo (do NOT mutate directly)
 *
 * @property {function(): number} getCredits
 * @property {function(): number} getCargoRemaining
 *
 * @property {function(number): void} updateCredits
 * @property {function(Array): void} updateCargo
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 */
```

**Step 2: Update coordinator constructor**

```js
// Before:
this.shipManager = new ShipManager(this);

// After:
this.shipManager = new ShipManager({
  getOwnState: () => this.state.ship,
  getCredits: () => this.state.player.credits,
  getCargoRemaining: () => this.stateManager.getCargoRemaining(),
  updateCredits: (value) => this.stateManager.updateCredits(value),
  updateCargo: (newCargo) => this.stateManager.updateCargo(newCargo),
  markDirty: this.markDirty.bind(this),
  emit: this.emit.bind(this),
  isTestEnvironment: this.isTestEnvironment,
});
```

**Ordering note:** `this.stateManager` must be instantiated before `this.shipManager`. It is (line ~85 vs ~89).

**Step 3: Update the manager**

In `src/game/state/managers/ship.js`:

3a. Remove the constructor.

3b. Replace all `this.getState()` calls with `this.capabilities.getOwnState()` for ship-owned fields. The pattern is:

```js
// Before:
const state = this.getState();
state.ship.hull = ...
state.ship.quirks.push(...)

// After:
const ship = this.capabilities.getOwnState();
ship.hull = ...
ship.quirks.push(...)
```

3c. For `validateUpgradePurchase()` — reads `player.credits`:
```js
validateUpgradePurchase(upgradeId) {
  this.validateState();

  const ship = this.capabilities.getOwnState();
  const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];

  if (!upgrade) {
    return { valid: false, reason: 'Unknown upgrade' };
  }

  if (ship.upgrades.includes(upgradeId)) {
    return { valid: false, reason: 'Already installed' };
  }

  if (this.capabilities.getCredits() < upgrade.cost) {
    return { valid: false, reason: 'Insufficient credits' };
  }

  return { valid: true, reason: '' };
}
```

3d. For `purchaseUpgrade()`:
```js
purchaseUpgrade(upgradeId) {
  this.validateState();

  const validation = this.validateUpgradePurchase(upgradeId);
  if (!validation.valid) {
    return { success: false, reason: validation.reason };
  }

  const ship = this.capabilities.getOwnState();
  const upgrade = SHIP_CONFIG.UPGRADES[upgradeId];

  this.capabilities.updateCredits(this.capabilities.getCredits() - upgrade.cost);

  ship.upgrades.push(upgradeId);

  const capabilities = this.calculateShipCapabilities();

  if (capabilities.cargoCapacity !== ship.cargoCapacity) {
    ship.cargoCapacity = capabilities.cargoCapacity;
    this.capabilities.emit(EVENT_NAMES.CARGO_CAPACITY_CHANGED, capabilities.cargoCapacity);
  }
  if (capabilities.hiddenCargoCapacity !== ship.hiddenCargoCapacity) {
    ship.hiddenCargoCapacity = capabilities.hiddenCargoCapacity;
  }

  this.capabilities.emit(EVENT_NAMES.UPGRADES_CHANGED, ship.upgrades);
  this.capabilities.markDirty();

  return { success: true, reason: '' };
}
```

3e. For all other methods that use `this.getState()`, replace with `this.capabilities.getOwnState()`:
- `addQuirk`, `removeQuirk`, `addUpgrade`, `removeUpgrade` — use `ship.quirks` / `ship.upgrades`
- `updateShipName` — use `ship.name`
- `updateShipCondition` — use `ship.hull`, `ship.engine`, `ship.lifeSupport`
- `getShipCondition` — same
- `calculateShipCapabilities` — use `ship.upgrades`
- `getHiddenCargo`, `clearHiddenCargo` — use `ship.hiddenCargo`
- `moveToHiddenCargo`, `moveToRegularCargo` — use `ship.cargo` (read only), `ship.hiddenCargo`, call `this.capabilities.updateCargo()` and `this.capabilities.markDirty()`
- `removeCargoForMission` — use `ship.cargo` (read via getOwnState since cargo is on the same object)

3f. Replace `this.gameStateManager.markDirty()` with `this.capabilities.markDirty()`.

3g. Replace `this.gameStateManager.updateCargo()` with `this.capabilities.updateCargo()`.

3h. Replace `this.gameStateManager.updateCredits()` with `this.capabilities.updateCredits()`.

3i. Replace `this.emit(...)` with `this.capabilities.emit(...)`.

3j. For `moveToHiddenCargo` and `moveToRegularCargo`, replace `this.gameStateManager.getCargoRemaining()` call in `moveToRegularCargo` (line 626 uses `ship.cargoCapacity - cargoUsed` directly, so no explicit call — verify).

**Step 4: Update direct-instantiation tests**

In `tests/unit/add-to-cargo-array-public.test.js`, update mock:
```js
// Before:
const mockGSM = {
  state: { ship: { cargo: [] } },
  isTestEnvironment: true,
};
const manager = new ShipManager(mockGSM);

// After:
const capabilities = {
  getOwnState: () => ({ cargo: [] }),
  isTestEnvironment: true,
};
const manager = new ShipManager(capabilities);
```

Note: `addToCargoArray` is a pure function that only operates on its parameters. It doesn't call `this.getState()` or `this.capabilities`. It should work regardless. But verify the test actually exercises `addToCargoArray` and doesn't need other capabilities.

**Step 5: Run tests**

Run: `npm test`
Expected: All tests pass.

**Step 6: Commit**

```
git add src/game/state/capabilities.js src/game/state/managers/ship.js src/game/state/game-coordinator.js tests/unit/add-to-cargo-array-public.test.js
git commit -m "Migrate ShipManager to capability injection"
```

---

### Task 4: Migrate InfoBrokerManager

**Files:**
- Modify: `src/game/state/capabilities.js` (update typedef)
- Modify: `src/game/state/managers/info-broker.js`
- Modify: `src/game/state/game-coordinator.js` (constructor only)
- Test: `tests/unit/info-broker-manager.test.js`, `tests/unit/info-broker-connected-systems.test.js`, `tests/unit/information-broker-coverage.test.js` (use `createTestGameStateManager()`, verify no changes needed)

**Context:** InfoBrokerManager delegates to static methods on `InformationBroker` class (`src/game/game-information-broker.js`). The static methods `purchaseIntelligence(state, systemId, starData, discount)` and `generateRumor(state, starData, purchaseCount)` take the full game state as a parameter and **directly mutate** `state.player.credits` and `state.world.priceKnowledge`.

This is the same situation as DialogueManager: an external module expects the full state/coordinator object. The pragmatic solution is the same: include a `coordinatorRef` in the capabilities that gets passed through to the static methods.

**InfoBrokerManager itself** will use specific capability getters for its own logic (`getIntelligenceCost`, `listAvailableIntelligence`), and pass `coordinatorRef` through to the static methods that need the full state.

**Step 1: Update InfoBrokerCapabilities typedef**

```js
/**
 * @typedef {Object} InfoBrokerCapabilities
 *
 * @property {function(): Object} getPriceKnowledge
 *   Returns: state.world.priceKnowledge
 * @property {function(): Array} getActiveEvents
 *   Returns: state.world.activeEvents
 * @property {function(): number} getCurrentSystem
 * @property {function(): Array} getShipUpgrades
 * @property {function(): number|undefined} getRumorsPurchased
 *   Returns: state.stats.rumorsPurchased
 *
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {Array} starData
 * @property {Object} navigationSystem
 * @property {Object} coordinatorRef
 *   The coordinator instance, passed through to InformationBroker static methods
 *   (purchaseIntelligence, generateRumor). Those methods directly mutate
 *   state.player.credits and state.world.priceKnowledge. This is a documented
 *   coupling that will be addressed if InformationBroker is refactored separately.
 */
```

**Step 2: Update coordinator constructor**

```js
// Before:
this.infoBrokerManager = new InfoBrokerManager(this);

// After:
this.infoBrokerManager = new InfoBrokerManager({
  getPriceKnowledge: () => this.state.world.priceKnowledge,
  getActiveEvents: () => this.state.world.activeEvents,
  getCurrentSystem: () => this.state.player.currentSystem,
  getShipUpgrades: () => this.state.ship.upgrades,
  getRumorsPurchased: () => this.state.stats?.rumorsPurchased,
  markDirty: this.markDirty.bind(this),
  emit: this.emit.bind(this),
  starData: this.starData,
  navigationSystem: this.navigationSystem,
  coordinatorRef: this,
  isTestEnvironment: this.isTestEnvironment,
});
```

**Step 3: Update the manager**

In `src/game/state/managers/info-broker.js`:

3a. Replace the constructor — store `starData` and `navigationSystem` from capabilities:

```js
constructor(capabilities) {
  super(capabilities);
  this.starData = capabilities.starData || (capabilities.gameStateManager ? capabilities.gameStateManager.starData : null);
  this.navigationSystem = capabilities.navigationSystem || (capabilities.gameStateManager ? capabilities.gameStateManager.navigationSystem : null);
}
```

Wait — with capability mode, `capabilities.starData` exists. With legacy mode, `capabilities` would be the GSM and `capabilities.starData` also exists. But we shouldn't have legacy mode anymore for this manager. Simpler:

```js
constructor(capabilities) {
  super(capabilities);
  // starData and navigationSystem come from capabilities
  // (or from gameStateManager in legacy mode for backward compatibility)
  if (this.capabilities) {
    this.starData = this.capabilities.starData;
    this.navigationSystem = this.capabilities.navigationSystem;
  }
}
```

3b. Replace `getIntelligenceCost`:
```js
getIntelligenceCost(systemId) {
  const priceKnowledge = this.capabilities.getPriceKnowledge();
  return InformationBroker.getIntelligenceCost(systemId, priceKnowledge);
}
```

3c. Replace `purchaseIntelligence` — pass coordinator state to static method:
```js
purchaseIntelligence(systemId, discount = 0) {
  const state = this.capabilities.coordinatorRef.getState();

  const result = InformationBroker.purchaseIntelligence(
    state,
    systemId,
    this.starData,
    discount
  );

  if (result.success) {
    this.capabilities.emit(EVENT_NAMES.CREDITS_CHANGED, state.player.credits);
    this.capabilities.emit(
      EVENT_NAMES.PRICE_KNOWLEDGE_CHANGED,
      state.world.priceKnowledge
    );
    this.capabilities.markDirty();
  }

  return result;
}
```

3d. Replace `generateRumor`:
```js
generateRumor() {
  const state = this.capabilities.coordinatorRef.getState();
  const purchaseCount = state.stats.rumorsPurchased || 0;
  const rumor = InformationBroker.generateRumor(
    state,
    this.starData,
    purchaseCount
  );
  state.stats.rumorsPurchased = purchaseCount + 1;
  this.capabilities.markDirty();
  return rumor;
}
```

3e. Replace `listAvailableIntelligence` — use capabilities:
```js
listAvailableIntelligence() {
  const priceKnowledge = this.capabilities.getPriceKnowledge();
  const currentSystemId = this.capabilities.getCurrentSystem();
  const activeEvents = this.capabilities.getActiveEvents();
  const hasAdvancedSensors = this.capabilities.getShipUpgrades().includes('advanced_sensors');

  return InformationBroker.listAvailableIntelligence(
    priceKnowledge,
    this.starData,
    currentSystemId,
    this.navigationSystem,
    activeEvents,
    hasAdvancedSensors
  );
}
```

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass.

**Step 5: Commit**

```
git add src/game/state/capabilities.js src/game/state/managers/info-broker.js src/game/state/game-coordinator.js
git commit -m "Migrate InfoBrokerManager to capability injection"
```

---

### Task 5: Migrate RepairManager

**Files:**
- Modify: `src/game/state/capabilities.js` (update typedef)
- Modify: `src/game/state/managers/repair.js`
- Modify: `src/game/state/game-coordinator.js` (constructor only)
- Test: `tests/unit/repair-free-repair.test.js`, `tests/unit/repair-npc-discount.test.js` (use `createTestGameStateManager()`)
- Update: `tests/unit/cannibalize-system.test.js` — directly instantiates with mock GSM + `getState` override
- Update: `tests/unit/emergency-patch.test.js` — directly instantiates with mock GSM + `getState`/`validateState` overrides

**Context:** RepairManager has no owned state. It reads ship condition, credits, daysElapsed. It calls `this.gameStateManager.updateCredits()`, `this.gameStateManager.updateShipCondition()`, `this.gameStateManager.updateTime()` (for emergency patch time penalty), and `this.gameStateManager.markDirty()`. For free repairs, it calls `this.gameStateManager.validateAndGetNPCData()`, `this.gameStateManager.getNPCState()`, and `this.gameStateManager.getRepTier()`.

**Step 1: Update RepairCapabilities typedef**

```js
/**
 * @typedef {Object} RepairCapabilities
 *
 * @property {function(): Object} getShipCondition
 *   Returns: { hull, engine, lifeSupport }
 * @property {function(): number} getCredits
 * @property {function(): number} getDaysElapsed
 * @property {function(string): Object} getNPCState
 *   Returns: state.npcs[npcId] for free repair checks
 * @property {function(string): Object} validateAndGetNPCData
 *   Returns NPC static data (from ALL_NPCS)
 * @property {function(number): Object} getRepTier
 *   Returns reputation tier object for given rep value
 *
 * @property {function(number): void} updateCredits
 * @property {function(number, number, number): void} updateShipCondition
 * @property {function(number): void} advanceTime
 *   For emergency patch time penalty
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 */
```

**Step 2: Update coordinator constructor**

```js
// Before:
this.repairManager = new RepairManager(this);

// After:
this.repairManager = new RepairManager({
  getShipCondition: () => ({
    hull: this.state.ship.hull,
    engine: this.state.ship.engine,
    lifeSupport: this.state.ship.lifeSupport,
  }),
  getCredits: () => this.state.player.credits,
  getDaysElapsed: () => this.state.player.daysElapsed,
  getNPCState: (npcId) => this.npcManager.getNPCState(npcId),
  validateAndGetNPCData: (npcId) =>
    this.npcManager.validateAndGetNPCData(npcId),
  getRepTier: (rep) => this.npcManager.getRepTier(rep),
  updateCredits: (value) => this.stateManager.updateCredits(value),
  updateShipCondition: (hull, engine, lifeSupport) =>
    this.shipManager.updateShipCondition(hull, engine, lifeSupport),
  advanceTime: (newDays) => this.eventsManager.updateTime(newDays),
  markDirty: this.markDirty.bind(this),
  emit: this.emit.bind(this),
  isTestEnvironment: this.isTestEnvironment,
});
```

**Ordering note:** `this.npcManager`, `this.shipManager`, `this.stateManager`, and `this.eventsManager` must be instantiated before `this.repairManager`. Check current order — NPCManager (~90), ShipManager (~89), StateManager (~85), EventsManager (~100), RepairManager (~93). **Problem:** EventsManager is at ~100, RepairManager at ~93. The `advanceTime` closure references `this.eventsManager` which isn't set yet at construction time. However, this is fine because the closure is evaluated at call time, not construction time. By the time `advanceTime` is actually called during gameplay, `this.eventsManager` will be set.

**Step 3: Update the manager**

In `src/game/state/managers/repair.js`:

3a. Remove the constructor.

3b. Replace `repairShipSystem()`:
```js
repairShipSystem(systemType, amount, discount = 0) {
  this.validateState();

  const validSystems = ['hull', 'engine', 'lifeSupport'];
  if (!validSystems.includes(systemType)) {
    return { success: false, reason: 'Invalid system type' };
  }

  const condition = this.capabilities.getShipCondition();
  const currentCondition = condition[systemType];
  const credits = this.capabilities.getCredits();
  const cost = this.getRepairCost(
    systemType,
    amount,
    currentCondition,
    discount
  );

  if (amount <= 0) {
    return { success: false, reason: 'Repair amount must be positive' };
  }

  if (currentCondition >= SHIP_CONFIG.CONDITION_BOUNDS.MAX) {
    return { success: false, reason: 'System already at maximum condition' };
  }

  if (cost > credits) {
    return { success: false, reason: 'Insufficient credits for repair' };
  }

  if (currentCondition + amount > SHIP_CONFIG.CONDITION_BOUNDS.MAX) {
    return {
      success: false,
      reason: 'Repair would exceed maximum condition',
    };
  }

  this.capabilities.updateCredits(credits - cost);

  const newConditions = { ...condition };
  newConditions[systemType] = currentCondition + amount;

  this.capabilities.updateShipCondition(
    newConditions.hull,
    newConditions.engine,
    newConditions.lifeSupport
  );

  this.capabilities.markDirty();

  return { success: true, reason: null };
}
```

3c. Replace `applyEmergencyPatch()`:
```js
applyEmergencyPatch(systemType) {
  this.validateState();

  const validSystems = ['hull', 'engine', 'lifeSupport'];
  if (!validSystems.includes(systemType)) {
    return { success: false, reason: 'Invalid system type' };
  }

  const condition = this.capabilities.getShipCondition();
  const currentCondition = condition[systemType];

  if (currentCondition > REPAIR_CONFIG.CRITICAL_SYSTEM_THRESHOLD) {
    return {
      success: false,
      reason: `${systemType} is not critically damaged`,
    };
  }

  const repairAmount =
    REPAIR_CONFIG.EMERGENCY_PATCH_TARGET - currentCondition;
  const repairCost = repairAmount * REPAIR_CONFIG.COST_PER_PERCENT;

  if (this.capabilities.getCredits() >= repairCost) {
    return {
      success: false,
      reason: 'You can afford standard repair',
    };
  }

  const newConditions = { ...condition };
  newConditions[systemType] = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET;

  this.capabilities.updateShipCondition(
    newConditions.hull,
    newConditions.engine,
    newConditions.lifeSupport
  );

  this.capabilities.advanceTime(
    this.capabilities.getDaysElapsed() + REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY
  );

  this.capabilities.markDirty();

  return { success: true, reason: null };
}
```

3d. Replace `cannibalizeSystem()`:
```js
cannibalizeSystem(targetType, donations) {
  this.validateState();

  // ... validation logic unchanged except state access:
  const condition = this.capabilities.getShipCondition();
  const currentTargetCondition = condition[targetType];

  // Replace state.ship[systemType] with condition[systemType]
  // Replace state.player.credits with this.capabilities.getCredits()

  // ... after validation:
  const newConditions = { ...condition };
  newConditions[targetType] = REPAIR_CONFIG.EMERGENCY_PATCH_TARGET;

  for (const donation of donations) {
    newConditions[donation.system] -= donation.amount;
  }

  this.capabilities.updateShipCondition(
    newConditions.hull,
    newConditions.engine,
    newConditions.lifeSupport
  );

  this.capabilities.markDirty();

  return { success: true, reason: null };
}
```

3e. Replace `canGetFreeRepair()`:
```js
canGetFreeRepair(npcId) {
  this.validateState();

  this.capabilities.validateAndGetNPCData(npcId);

  const npcState = this.capabilities.getNPCState(npcId);
  const repTier = this.capabilities.getRepTier(npcState.rep);
  const isTrusted =
    npcState.rep >= REPUTATION_BOUNDS.TRUSTED_MIN &&
    npcState.rep <= REPUTATION_BOUNDS.TRUSTED_MAX;
  const isFamily = npcState.rep >= REPUTATION_BOUNDS.FAMILY_MIN;

  if (!isTrusted && !isFamily) {
    return {
      available: false,
      maxHullPercent: 0,
      reason: `Requires Trusted relationship (currently ${repTier.name})`,
    };
  }

  const currentDay = this.capabilities.getDaysElapsed();
  if (
    npcState.lastFreeRepairDay !== null &&
    npcState.lastFreeRepairDay === currentDay
  ) {
    return {
      available: false,
      maxHullPercent: 0,
      reason: 'Free repair already used once per visit',
    };
  }

  let maxHullPercent;
  if (isFamily) {
    maxHullPercent = NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.family;
  } else if (isTrusted) {
    maxHullPercent = NPC_BENEFITS_CONFIG.FREE_REPAIR_LIMITS.trusted;
  }

  return {
    available: true,
    maxHullPercent: maxHullPercent,
    reason: null,
  };
}
```

3f. Replace `applyFreeRepair()`:
```js
applyFreeRepair(npcId, hullDamagePercent) {
  this.validateState();

  const availability = this.canGetFreeRepair(npcId);
  if (!availability.available) {
    return {
      success: false,
      repairedPercent: 0,
      message: availability.reason,
    };
  }

  if (
    typeof hullDamagePercent !== 'number' ||
    hullDamagePercent < 0 ||
    hullDamagePercent > 100
  ) {
    return {
      success: false,
      repairedPercent: 0,
      message: 'Invalid hull damage percentage',
    };
  }

  const condition = this.capabilities.getShipCondition();
  const maxRepairPercent = availability.maxHullPercent;
  const actualRepairPercent = Math.min(hullDamagePercent, maxRepairPercent);

  const newHull = Math.min(
    SHIP_CONFIG.CONDITION_BOUNDS.MAX,
    condition.hull + actualRepairPercent
  );

  this.capabilities.updateShipCondition(
    newHull,
    condition.engine,
    condition.lifeSupport
  );

  const npcState = this.capabilities.getNPCState(npcId);
  npcState.lastFreeRepairDay = this.capabilities.getDaysElapsed();
  npcState.lastInteraction = this.capabilities.getDaysElapsed();
  npcState.interactions += 1;

  this.capabilities.markDirty();

  return {
    success: true,
    repairedPercent: actualRepairPercent,
    message: `Repaired ${actualRepairPercent}% hull damage`,
  };
}
```

**Step 4: Update direct-instantiation tests**

In `tests/unit/cannibalize-system.test.js`:
```js
// Before:
mockGSM = {
  state: mockState,
  updateShipCondition: vi.fn(),
  saveGame: vi.fn(),
  markDirty: vi.fn(),
};
repairManager = new RepairManager(mockGSM);
repairManager.getState = () => mockState;
repairManager.validateState = () => {};

// After:
const capabilities = {
  getShipCondition: () => ({
    hull: mockState.ship.hull,
    engine: mockState.ship.engine,
    lifeSupport: mockState.ship.lifeSupport,
  }),
  getCredits: () => mockState.player.credits,
  getDaysElapsed: () => mockState.player?.daysElapsed ?? 0,
  updateShipCondition: vi.fn(),
  markDirty: vi.fn(),
  isTestEnvironment: true,
};
repairManager = new RepairManager(capabilities);
```

Update assertions: `mockGSM.updateShipCondition` → `capabilities.updateShipCondition`.

In `tests/unit/emergency-patch.test.js`:
```js
// Before:
mockGSM = {
  state: mockState,
  updateShipCondition: vi.fn(),
  updateTime: vi.fn(),
  saveGame: vi.fn(),
  markDirty: vi.fn(),
};
repairManager = new RepairManager(mockGSM);
repairManager.getState = () => mockState;
repairManager.validateState = () => {};

// After:
const capabilities = {
  getShipCondition: () => ({
    hull: mockState.ship.hull,
    engine: mockState.ship.engine,
    lifeSupport: mockState.ship.lifeSupport,
  }),
  getCredits: () => mockState.player.credits,
  getDaysElapsed: () => mockState.player.daysElapsed,
  updateShipCondition: vi.fn(),
  advanceTime: vi.fn(),
  markDirty: vi.fn(),
  isTestEnvironment: true,
};
repairManager = new RepairManager(capabilities);
```

Update assertions: `mockGSM.updateShipCondition` → `capabilities.updateShipCondition`, `mockGSM.updateTime` → `capabilities.advanceTime`. **Note the name change:** `updateTime` → `advanceTime`.

Also update the assertion argument: the old code called `this.gameStateManager.updateTime(state.player.daysElapsed + PENALTY)`. The new code calls `this.capabilities.advanceTime(this.capabilities.getDaysElapsed() + PENALTY)`. The mock returns `daysElapsed: 10`, so the expected call is `advanceTime(10 + REPAIR_CONFIG.EMERGENCY_PATCH_DAYS_PENALTY)`.

**Step 5: Run tests**

Run: `npm test`
Expected: All tests pass.

**Step 6: Commit**

```
git add src/game/state/capabilities.js src/game/state/managers/repair.js src/game/state/game-coordinator.js tests/unit/cannibalize-system.test.js tests/unit/emergency-patch.test.js
git commit -m "Migrate RepairManager to capability injection"
```

---

### Task 6: Migrate NPCManager

**Files:**
- Modify: `src/game/state/capabilities.js` (verify typedef)
- Modify: `src/game/state/managers/npc.js`
- Modify: `src/game/state/game-coordinator.js` (constructor only)
- Test: `tests/unit/npc-manager-coverage.test.js`, `tests/unit/game-npc.test.js`, `tests/unit/npc-benefits-migration.test.js`, `tests/unit/npc-modify-rep-raw.test.js`, `tests/unit/npc-set-rep.test.js`, `tests/unit/npc-manager-markdirty.test.js`, many others (all use `createTestGameStateManager()`)

**Context:** NPCManager is the most complex Batch 3 manager. It owns `state.npcs` and has extensive cross-domain dependencies:

- **Reads:** `player.daysElapsed`, `player.credits`, `ship.cargo`, `ship.quirks` (for smooth_talker quirk in modifyRep)
- **Writes:** `player.credits` (requestLoan, repayLoan via `updateCredits`), `ship.cargo` (storeCargo, retrieveCargo via `updateCargo`/`addToCargoArray`), cargo capacity (via `getCargoRemaining`)
- **Calls:** `checkAchievements()`, `markDirty()`

The NPC data comes from `ALL_NPCS` which is imported directly — no capability needed for that.

**Step 1: Update NPCCapabilities typedef**

Update in `src/game/state/capabilities.js`:

```js
/**
 * @typedef {Object} NPCCapabilities
 *
 * @property {function(): Object} getOwnState
 *   Returns: state.npcs (mutable reference)
 *
 * @property {function(): number} getDaysElapsed
 * @property {function(): number} getCredits
 * @property {function(): Array} getShipCargo
 * @property {function(): Array} getShipQuirks
 *   Needed for smooth_talker quirk check in modifyRep
 * @property {function(): number} getCargoRemaining
 *
 * @property {function(number): void} updateCredits
 * @property {function(Array): void} updateCargo
 * @property {function(Array, Object, number): void} addToCargoArray
 * @property {function(): void} checkAchievements
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 */
```

**Step 2: Update coordinator constructor**

```js
// Before:
this.npcManager = new NPCManager(this);

// After:
this.npcManager = new NPCManager({
  getOwnState: () => this.state.npcs,
  getDaysElapsed: () => this.state.player.daysElapsed,
  getCredits: () => this.state.player.credits,
  getShipCargo: () => this.state.ship.cargo,
  getShipQuirks: () => this.state.ship.quirks,
  getCargoRemaining: () => this.stateManager.getCargoRemaining(),
  updateCredits: (value) => this.stateManager.updateCredits(value),
  updateCargo: (newCargo) => this.stateManager.updateCargo(newCargo),
  addToCargoArray: (cargoArray, sourceStack, qty) =>
    this.shipManager.addToCargoArray(cargoArray, sourceStack, qty),
  checkAchievements: () => this.achievementsManager.checkAchievements(),
  markDirty: this.markDirty.bind(this),
  emit: this.emit.bind(this),
  isTestEnvironment: this.isTestEnvironment,
});
```

**Ordering note:** `this.stateManager`, `this.shipManager`, and `this.achievementsManager` must be instantiated before `this.npcManager` (for closures to resolve at call time). `stateManager` is at ~85, `shipManager` at ~89. `achievementsManager` is at ~213 — AFTER `npcManager` at ~90. The closure `() => this.achievementsManager.checkAchievements()` will resolve at call time, which is during gameplay after all managers are constructed. This is fine.

**Step 3: Update the manager**

In `src/game/state/managers/npc.js`:

3a. Remove the constructor.

3b. Replace `getNPCState(npcId)` — use capabilities:
```js
getNPCState(npcId) {
  const npcData = this.validateAndGetNPCData(npcId);
  const npcs = this.capabilities.getOwnState();

  if (!npcs[npcId]) {
    npcs[npcId] = {
      rep: npcData.initialRep,
      lastInteraction: this.capabilities.getDaysElapsed(),
      flags: [],
      interactions: 0,
      lastTipDay: null,
      lastFavorDay: null,
      loanAmount: null,
      loanDay: null,
      storedCargo: [],
      lastFreeRepairDay: null,
    };
  }

  return npcs[npcId];
}
```

3c. Replace `modifyRep(npcId, amount, reason)`:
```js
modifyRep(npcId, amount, reason) {
  const npcData = this.validateAndGetNPCData(npcId);

  let modifiedAmount = amount;
  if (amount > 0) {
    modifiedAmount *= npcData.personality.trust;
  }

  if (amount > 0 && this.capabilities.getShipQuirks().includes('smooth_talker')) {
    modifiedAmount *= 1.05;
  }

  this.modifyRepRaw(npcId, modifiedAmount, reason);
}
```

3d. Replace `modifyRepRaw(npcId, amount, reason)`:
```js
modifyRepRaw(npcId, amount, reason) {
  this.validateAndGetNPCData(npcId);
  const npcState = this.getNPCState(npcId);

  const oldRep = npcState.rep;
  const newRep = Math.max(-100, Math.min(100, Math.round(oldRep + amount)));

  if (oldRep + amount < -100 || oldRep + amount > 100) {
    this.warn(
      `Reputation clamped for ${npcId}: ${oldRep + amount} -> ${newRep}`
    );
  }

  npcState.rep = newRep;
  npcState.lastInteraction = this.capabilities.getDaysElapsed();
  npcState.interactions += 1;

  this.log(
    `Reputation change for ${npcId}: ${amount} (${reason}) -> ${newRep}`
  );
  this.capabilities.checkAchievements();
  this.capabilities.emit(EVENT_NAMES.NPCS_CHANGED, { ...this.capabilities.getOwnState() });
  this.capabilities.markDirty();
}
```

3e. Replace `setNpcRep(npcId, value)`:
```js
setNpcRep(npcId, value) {
  this.validateAndGetNPCData(npcId);
  const npcState = this.getNPCState(npcId);
  npcState.rep = Math.round(
    Math.max(REPUTATION_BOUNDS.MIN, Math.min(REPUTATION_BOUNDS.MAX, value))
  );
  this.capabilities.emit(EVENT_NAMES.NPCS_CHANGED, { ...this.capabilities.getOwnState() });
  this.capabilities.markDirty();
}
```

3f. Replace all methods that call `this.getState()`:

Pattern: `const state = this.getState()` becomes individual capability calls:
- `state.npcs[npcId]` → `this.capabilities.getOwnState()[npcId]` (or use `this.getNPCState(npcId)`)
- `state.player.daysElapsed` → `this.capabilities.getDaysElapsed()`
- `state.player.credits` → `this.capabilities.getCredits()`
- `state.ship.cargo` → `this.capabilities.getShipCargo()`

Methods to update:
- `canGetTip` — replace `this.getState()` with capability calls
- `getTip` — replace `this.getState()` with capability calls
- `getServiceDiscount` — replace `this.getState()` with capability calls
- `canRequestFavor` — replace `this.getState()` with capability calls
- `requestLoan` — replace `this.getState()`, `this.gameStateManager.updateCredits()`, `this.gameStateManager.markDirty()`
- `repayLoan` — replace similarly
- `checkLoanDefaults` — replace `this.getState()`, `this.gameStateManager.markDirty()`
- `storeCargo` — replace `this.getState()`, `this.gameStateManager.updateCargo()`, `this.gameStateManager.markDirty()`
- `retrieveCargo` — replace `this.getState()`, `this.gameStateManager.getCargoRemaining()`, `this.gameStateManager.addToCargoArray()`, `this.gameStateManager.updateCargo()`, `this.gameStateManager.markDirty()`

For each: replace `this.getState()` reads with the appropriate capability getter, and replace `this.gameStateManager.X()` calls with `this.capabilities.X()`.

Example — `requestLoan`:
```js
requestLoan(npcId) {
  const availability = this.canRequestFavor(npcId, 'loan');
  if (!availability.available) {
    return { success: false, message: availability.reason };
  }

  const npcState = this.getNPCState(npcId);

  this.capabilities.updateCredits(
    this.capabilities.getCredits() + NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT
  );

  npcState.loanAmount = NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT;
  npcState.loanDay = this.capabilities.getDaysElapsed();
  npcState.rep = Math.max(
    -100,
    Math.min(
      100,
      npcState.rep + NPC_BENEFITS_CONFIG.LOAN_ACCEPTANCE_REP_BONUS
    )
  );
  npcState.lastInteraction = this.capabilities.getDaysElapsed();
  npcState.interactions += 1;

  this.log(
    `Reputation change for ${npcId}: +${NPC_BENEFITS_CONFIG.LOAN_ACCEPTANCE_REP_BONUS} (emergency loan accepted) -> ${npcState.rep}`
  );

  npcState.lastFavorDay = this.capabilities.getDaysElapsed();

  this.capabilities.markDirty();

  return {
    success: true,
    message: `Received ₡${NPC_BENEFITS_CONFIG.EMERGENCY_LOAN_AMOUNT} emergency loan`,
  };
}
```

Example — `retrieveCargo`:
```js
retrieveCargo(npcId) {
  if (!npcId || typeof npcId !== 'string') {
    throw new Error(
      'Invalid npcId: retrieveCargo requires a valid NPC identifier'
    );
  }

  const npcState = this.getNPCState(npcId);

  if (!npcState.storedCargo) {
    npcState.storedCargo = [];
  }

  if (npcState.storedCargo.length === 0) {
    return { success: true, retrieved: [], remaining: [] };
  }

  const availableCapacity = this.capabilities.getCargoRemaining();
  const totalStoredUnits = npcState.storedCargo.reduce(
    (total, stack) => total + stack.qty,
    0
  );
  const unitsToTransfer = Math.min(totalStoredUnits, availableCapacity);

  if (unitsToTransfer === 0) {
    return {
      success: true,
      retrieved: [],
      remaining: [...npcState.storedCargo],
    };
  }

  let remainingToTransfer = unitsToTransfer;
  const currentShipCargo = [...this.capabilities.getShipCargo()];
  const retrievedCargo = [];
  const remainingStoredCargo = [];

  for (const stack of npcState.storedCargo) {
    if (remainingToTransfer <= 0) {
      remainingStoredCargo.push(stack);
    } else if (stack.qty <= remainingToTransfer) {
      retrievedCargo.push({ ...stack });
      remainingToTransfer -= stack.qty;
    } else {
      const transferQty = remainingToTransfer;
      const keepQty = stack.qty - transferQty;
      retrievedCargo.push({ ...stack, qty: transferQty });
      remainingStoredCargo.push({ ...stack, qty: keepQty });
      remainingToTransfer = 0;
    }
  }

  for (const stack of retrievedCargo) {
    this.capabilities.addToCargoArray(currentShipCargo, stack, stack.qty);
  }

  this.capabilities.updateCargo(currentShipCargo);
  npcState.storedCargo = remainingStoredCargo;
  npcState.lastInteraction = this.capabilities.getDaysElapsed();
  npcState.interactions += 1;

  if (retrievedCargo.length > 0) {
    this.capabilities.markDirty();
  }

  return {
    success: true,
    retrieved: retrievedCargo,
    remaining: remainingStoredCargo,
  };
}
```

3g. Remove the state null checks (`if (!state)`) from methods. With capability mode, state existence is guaranteed by construction. However, keep validation at entry points for safety.

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass. NPC tests use `createTestGameStateManager()`, which goes through the full pipeline.

**Step 5: Commit**

```
git add src/game/state/capabilities.js src/game/state/managers/npc.js src/game/state/game-coordinator.js
git commit -m "Migrate NPCManager to capability injection"
```

---

### Task 7: Update design doc, format, and final verification

**Files:**
- Modify: `docs/plans/2026-03-08-gsm-refactor-design.md`
- Modify: `docs/plans/2026-03-08-gsm-phase3-batch3-implementation.md` (this file)

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 2: Run lint and format**

Run: `npm run clean`
Expected: No lint or format errors. Fix any that appear.

**Step 3: Update design doc**

In `docs/plans/2026-03-08-gsm-refactor-design.md`, update the Phase 3 Batch 3 row:

```
| Phase 3 Batch 3 | `2026-03-08-gsm-phase3-batch3-implementation.md` | Complete |
```

**Step 4: Commit**

```
git add docs/plans/2026-03-08-gsm-refactor-design.md
git commit -m "Mark Phase 3 Batch 3 complete and apply formatting"
```

---

## Key Risks and Mitigations

1. **DangerManager's primitive karma field:** `getOwnState()` returning an object with `karma` (a number) would not support mutation via `ownState.karma = newValue`. Solution: separate `getKarma()` / `setKarma()` callbacks instead of trying to bundle karma into a single state view.

2. **InfoBrokerManager's static method coupling:** `InformationBroker.purchaseIntelligence()` and `generateRumor()` directly mutate the full game state. Like DialogueManager, InfoBrokerManager uses a `coordinatorRef` to pass through to these static methods. This is a documented temporary coupling.

3. **Coordinator instantiation order:** Several capability closures reference managers that may not yet be assigned at construction time (e.g., RepairManager's `advanceTime` references EventsManager). This works because closures capture `this`, and `this.eventsManager` is set before any gameplay methods are called. But it requires care when adding new cross-manager references.

4. **Test compatibility:** Four test files directly instantiate Batch 3 managers with mock GSM objects: `cannibalize-system.test.js`, `emergency-patch.test.js`, `add-to-cargo-array-public.test.js`, `cargo-run-customs.test.js`. These need updating to pass capability objects. All other tests use `createTestGameStateManager()` and should work without changes.

5. **ShipManager's `getOwnState` returns entire `state.ship`:** This includes `ship.fuel` and `ship.cargo` which are owned by StateManager. ShipManager must not directly mutate these — it uses `updateCargo()` callback instead. The documented ownership boundary is enforced by convention, not by the type system.

6. **NPCManager's `checkAchievements` ordering:** The closure `() => this.achievementsManager.checkAchievements()` references AchievementsManager which is instantiated after NPCManager. Works at call time but not at construction time. If any constructor calls `checkAchievements()`, it will fail.
