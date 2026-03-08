# Phase 3 Batch 1: Migrate Pure Calculation Managers

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the 5 lowest-risk "pure calculation" managers from old-style (`this.gameStateManager`) to new-style capability injection. Establishes the migration pattern for all subsequent batches.

**Architecture:** Each manager stops extending BaseManager's legacy path and instead receives a capability object with explicit read queries, write callbacks, and infrastructure. The coordinator builds these capability objects and passes them at construction time. BaseManager gets dual-mode support so migrated and unmigrated managers coexist.

**Tech Stack:** Vitest, ES Modules, JSDoc typedefs (already defined in `src/game/state/capabilities.js`)

**Managers in this batch (ordered by complexity):**
1. MechanicalFailureManager — no cross-domain writes at all
2. DistressManager — simple reads + `incrementDangerFlag`
3. CombatManager — reads + `incrementDangerFlag`, has quirk/upgrade checks
4. InspectionManager — reads + `getDangerZone` + `countRestrictedGoods` + `incrementDangerFlag`
5. NegotiationManager — most reads (cargo, credits, missions, intel) + `incrementDangerFlag`

**Design reference:** `docs/plans/2026-03-08-gsm-refactor-design.md` Phase 3 section. Capability typedefs: `src/game/state/capabilities.js` lines 55-128.

---

### Task 1: Add dual-mode support to BaseManager

**Files:**
- Modify: `src/game/state/managers/base-manager.js`
- Test: existing test suite (no new tests — behavior unchanged)

**Context:** During Phase 3, migrated managers receive capability objects while unmigrated managers still receive the coordinator instance. BaseManager must support both. The discriminator: coordinator instances have a `state` property (even if null); capability objects never do (they use `getOwnState()` or specific getters).

**Step 1: Update BaseManager constructor for dual-mode**

Replace the constructor and add capability-mode support to `validateState()`:

```js
constructor(gsmOrCapabilities) {
  if (!gsmOrCapabilities) {
    throw new Error('BaseManager requires gameStateManager or capabilities');
  }

  // Detect mode: GSM/Coordinator instances have a `state` property (even when null)
  // Capability objects use getOwnState() or specific getters and never have `state`
  if ('state' in gsmOrCapabilities) {
    // Legacy mode: received GSM/Coordinator instance
    this.gameStateManager = gsmOrCapabilities;
    this.isTestEnvironment = gsmOrCapabilities.isTestEnvironment;
  } else {
    // Capability mode: received capability object
    this.capabilities = gsmOrCapabilities;
    this.isTestEnvironment = gsmOrCapabilities.isTestEnvironment ?? false;
  }
}
```

Update `validateState()` to handle both modes:

```js
validateState() {
  if (this.gameStateManager) {
    if (!this.gameStateManager.state) {
      throw new Error(
        `Invalid state: ${this.constructor.name} operation called before game initialization`
      );
    }
    return;
  }
  // Capability mode: capabilities are always valid by construction
}
```

**Important:** Do NOT change `getState()`, `emit()`, `getStarData()`, `getWormholeData()`, `getNavigationSystem()`. These legacy methods only need to work for unmigrated managers. Migrated managers access `this.capabilities` directly and never call these methods.

**Step 2: Run tests**

Run: `npm test`
Expected: All tests pass — no behavior change, only constructor flexibility added.

**Step 3: Commit**

```
git add src/game/state/managers/base-manager.js
git commit -m "Add dual-mode support to BaseManager for capability injection"
```

---

### Task 2: Migrate MechanicalFailureManager

**Files:**
- Modify: `src/game/state/managers/mechanical-failure.js`
- Modify: `src/game/state/game-coordinator.js` (constructor + delegation methods)
- Modify: `tests/unit/mechanical-failure.test.js`

**Context:** MechanicalFailureManager is the simplest Batch 1 manager. It has NO cross-domain write operations. It only reads state for seeded RNG (daysElapsed, currentSystem) and ship condition (hull, engine, lifeSupport). It currently takes `gameState` as a method parameter for ship condition but also calls `this.getState()` for seed data — after migration, both come from capabilities.

**Capability object shape** (from `capabilities.js` lines 118-128):
```js
{
  getDaysElapsed: () => number,
  getCurrentSystem: () => number,
  getShipCondition: () => { hull: number, engine: number, lifeSupport: number },
  emit: (eventType, data) => void,
  markDirty: () => void,
  isTestEnvironment: boolean,
}
```

**Step 1: Update coordinator constructor to build capability object**

In `src/game/state/game-coordinator.js`, replace the MechanicalFailureManager instantiation (line ~102):

```js
// Before:
this.mechanicalFailureManager = new MechanicalFailureManager(this);

// After:
this.mechanicalFailureManager = new MechanicalFailureManager({
  getDaysElapsed: () => this.state.player.daysElapsed,
  getCurrentSystem: () => this.state.player.currentSystem,
  getShipCondition: () => ({
    hull: this.state.ship.hull,
    engine: this.state.ship.engine,
    lifeSupport: this.state.ship.lifeSupport,
  }),
  emit: this.emit.bind(this),
  markDirty: this.markDirty.bind(this),
  isTestEnvironment: this.isTestEnvironment,
});
```

**Step 2: Update coordinator delegation methods to drop `gameState` parameter**

The coordinator's public methods keep their signatures for backward compatibility but stop forwarding `gameState`:

```js
// ~line 1064:
checkMechanicalFailure(_gameState) {
  return this.mechanicalFailureManager.checkMechanicalFailure();
}

// ~line 1068:
resolveMechanicalFailure(failureType, choice, _gameState) {
  return this.mechanicalFailureManager.resolveMechanicalFailure(
    failureType,
    choice
  );
}
```

**Step 3: Update the manager**

In `src/game/state/managers/mechanical-failure.js`:

3a. Remove the constructor (BaseManager's dual-mode constructor handles it).

3b. Replace `checkMechanicalFailure(gameState)` — remove the `gameState` parameter, use capabilities:

```js
checkMechanicalFailure() {
  this.validateState();

  const seed = buildEncounterSeed(
    this.capabilities.getDaysElapsed(),
    this.capabilities.getCurrentSystem(),
    'check_mechanical'
  );
  const seededRng = new SeededRandom(seed).next();

  const ship = this.capabilities.getShipCondition();

  if (ship.hull < FAILURE_CONFIG.HULL_BREACH.CONDITION_THRESHOLD) {
    if (seededRng < FAILURE_CONFIG.HULL_BREACH.CHANCE) {
      return { type: 'hull_breach', severity: ship.hull };
    }
  }

  if (ship.engine < FAILURE_CONFIG.ENGINE_FAILURE.CONDITION_THRESHOLD) {
    if (seededRng < FAILURE_CONFIG.ENGINE_FAILURE.CHANCE) {
      return { type: 'engine_failure', severity: ship.engine };
    }
  }

  if (ship.lifeSupport < FAILURE_CONFIG.LIFE_SUPPORT.CONDITION_THRESHOLD) {
    if (seededRng < FAILURE_CONFIG.LIFE_SUPPORT.CHANCE) {
      return { type: 'life_support', severity: ship.lifeSupport };
    }
  }

  return null;
}
```

3c. Replace `resolveMechanicalFailure(failureType, choice, gameState)` — remove `gameState` parameter:

```js
resolveMechanicalFailure(failureType, choice) {
  this.validateState();

  const seed = buildEncounterSeed(
    this.capabilities.getDaysElapsed(),
    this.capabilities.getCurrentSystem(),
    'resolve_mechanical'
  );
  const seededRng = new SeededRandom(seed).next();

  switch (failureType) {
    case 'hull_breach':
      return this.resolveHullBreach();
    case 'engine_failure':
      return this.resolveEngineFailure(choice, seededRng);
    case 'life_support':
      return this.resolveLifeSupportEmergency();
    default:
      throw new Error(`Unknown failure type: ${failureType}`);
  }
}
```

3d. Remove `gameState` parameter from `resolveEngineFailure`:

```js
resolveEngineFailure(choice, rng) {
  switch (choice) {
    case 'emergency_restart':
      return this.resolveEmergencyRestart(rng);
    case 'call_for_help':
      return this.resolveCallForHelp();
    case 'jury_rig':
      return this.resolveJuryRig(rng);
    default:
      throw new Error(`Unknown engine failure repair choice: ${choice}`);
  }
}
```

**Step 4: Update tests**

In `tests/unit/mechanical-failure.test.js`, the test creates mock GSM objects directly. Update the mock to be a capabilities object instead:

```js
// Before:
gsm = {
  state,
  starData: [],
  wormholeData: [],
  navigationSystem: {},
  isTestEnvironment: true,
  emit: vi.fn(),
};
manager = new MechanicalFailureManager(gsm);

// After:
const capabilities = {
  getDaysElapsed: () => state.player.daysElapsed,
  getCurrentSystem: () => state.player.currentSystem,
  getShipCondition: () => ({
    hull: state.ship.hull,
    engine: state.ship.engine,
    lifeSupport: state.ship.lifeSupport,
  }),
  emit: vi.fn(),
  markDirty: vi.fn(),
  isTestEnvironment: true,
};
manager = new MechanicalFailureManager(capabilities);
```

Update test calls that pass `gameState` to no longer pass it:
- `manager.checkMechanicalFailure(state)` → `manager.checkMechanicalFailure()`
- `manager.resolveMechanicalFailure(type, choice, state)` → `manager.resolveMechanicalFailure(type, choice)`

**Step 5: Run tests**

Run: `npm test`
Expected: All tests pass.

**Step 6: Commit**

```
git add src/game/state/managers/mechanical-failure.js src/game/state/game-coordinator.js tests/unit/mechanical-failure.test.js
git commit -m "Migrate MechanicalFailureManager to capability injection"
```

---

### Task 3: Migrate DistressManager

**Files:**
- Modify: `src/game/state/managers/distress.js`
- Modify: `src/game/state/game-coordinator.js` (constructor only)
- Test: `tests/unit/distress-manager.test.js` (uses `createTestGameStateManager()`, no changes needed)

**Context:** DistressManager reads `daysElapsed` and `currentSystem` for seeded RNG, and calls `incrementDangerFlag` for respond/loot choices. Tests use `createTestGameStateManager()` which creates a full GSM → Coordinator pipeline, so tests should pass without changes once the coordinator passes capabilities.

**Capability object shape** (from `capabilities.js` lines 106-116):
```js
{
  getDaysElapsed: () => number,
  getCurrentSystem: () => number,
  incrementDangerFlag: (flagName) => void,
  emit: (eventType, data) => void,
  markDirty: () => void,
  isTestEnvironment: boolean,
}
```

**Step 1: Update coordinator constructor**

In `src/game/state/game-coordinator.js`, replace the DistressManager instantiation (line ~101):

```js
// Before:
this.distressManager = new DistressManager(this);

// After:
this.distressManager = new DistressManager({
  getDaysElapsed: () => this.state.player.daysElapsed,
  getCurrentSystem: () => this.state.player.currentSystem,
  incrementDangerFlag: (flagName) =>
    this.dangerManager.incrementDangerFlag(flagName),
  emit: this.emit.bind(this),
  markDirty: this.markDirty.bind(this),
  isTestEnvironment: this.isTestEnvironment,
});
```

**Important ordering note:** `this.dangerManager` must be instantiated BEFORE `this.distressManager` in the coordinator constructor. Check that the DangerManager line appears before DistressManager. Currently it does (line ~97 vs ~101).

**Step 2: Update the manager**

In `src/game/state/managers/distress.js`:

2a. Remove the constructor (BaseManager's dual-mode constructor handles it).

2b. Replace `checkDistressCall()`:

```js
checkDistressCall() {
  this.validateState();

  const seed = buildEncounterSeed(
    this.capabilities.getDaysElapsed(),
    this.capabilities.getCurrentSystem(),
    'check_distress'
  );
  const seededRng = new SeededRandom(seed).next();

  if (seededRng < DISTRESS_CONFIG.CHANCE) {
    return {
      id: `distress_${Date.now()}`,
      type: 'civilian_distress',
      description:
        'A civilian vessel is broadcasting a distress signal. Their engines have failed and they need assistance.',
      options: ['respond', 'ignore', 'loot'],
    };
  }

  return null;
}
```

2c. Replace `resolveDistressCallEncounter()` — change `this.gameStateManager.incrementDangerFlag` to `this.capabilities.incrementDangerFlag`:

```js
resolveDistressCallEncounter(distressCall, choice) {
  this.validateState();

  let result;
  switch (choice) {
    case 'respond':
      result = this.resolveDistressRespond();
      this.capabilities.incrementDangerFlag('civiliansSaved');
      break;
    case 'ignore':
      result = this.resolveDistressIgnore();
      break;
    case 'loot':
      result = this.resolveDistressLoot();
      this.capabilities.incrementDangerFlag('civiliansLooted');
      break;
    default:
      throw new Error(`Unknown distress call choice: ${choice}`);
  }

  return result;
}
```

2d. No changes needed to `resolveDistressRespond()`, `resolveDistressIgnore()`, `resolveDistressLoot()` — they don't access state or call gameStateManager.

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass. The distress tests use `createTestGameStateManager()` which goes through GSM → Coordinator → capability injection, so they exercise the full pipeline.

**Step 4: Commit**

```
git add src/game/state/managers/distress.js src/game/state/game-coordinator.js
git commit -m "Migrate DistressManager to capability injection"
```

---

### Task 4: Migrate CombatManager

**Files:**
- Modify: `src/game/state/managers/combat.js`
- Modify: `src/game/state/game-coordinator.js` (constructor only)
- Modify: `tests/unit/combat-manager-coverage.test.js` (direct instantiation)
- Check: `tests/unit/combat-lucky-negation.test.js` (may need similar updates)

**Context:** CombatManager reads daysElapsed, currentSystem, karma, ship quirks, and ship upgrades for seeded RNG and modifier calculations. Its only cross-domain write is `incrementDangerFlag('piratesFought')`. Some tests instantiate CombatManager directly with a mock GSM object — these need updating.

**Capability object shape** (from `capabilities.js` lines 55-71):
```js
{
  getDaysElapsed: () => number,
  getCurrentSystem: () => number,
  getShipQuirks: () => Array,
  getShipUpgrades: () => Array,
  getKarma: () => number,
  incrementDangerFlag: (flagName) => void,
  emit: (eventType, data) => void,
  markDirty: () => void,
  isTestEnvironment: boolean,
}
```

**Step 1: Update coordinator constructor**

In `src/game/state/game-coordinator.js`, replace the CombatManager instantiation (line ~98):

```js
// Before:
this.combatManager = new CombatManager(this);

// After:
this.combatManager = new CombatManager({
  getDaysElapsed: () => this.state.player.daysElapsed,
  getCurrentSystem: () => this.state.player.currentSystem,
  getShipQuirks: () => this.state.ship.quirks,
  getShipUpgrades: () => this.state.ship.upgrades,
  getKarma: () => this.state.player.karma,
  incrementDangerFlag: (flagName) =>
    this.dangerManager.incrementDangerFlag(flagName),
  emit: this.emit.bind(this),
  markDirty: this.markDirty.bind(this),
  isTestEnvironment: this.isTestEnvironment,
});
```

**Step 2: Update the manager**

In `src/game/state/managers/combat.js`:

2a. Remove the constructor.

2b. Replace `resolveCombatChoice()` — use capabilities instead of `this.getState()` and `this.gameStateManager.incrementDangerFlag()`:

```js
resolveCombatChoice(encounter, choice) {
  this.validateState();

  const seed = buildEncounterSeed(
    this.capabilities.getDaysElapsed(),
    this.capabilities.getCurrentSystem(),
    'combat'
  );
  const rng = new SeededRandom(seed).next();

  // Build a state view for internal methods
  const stateView = {
    player: { karma: this.capabilities.getKarma() },
    ship: {
      quirks: this.capabilities.getShipQuirks(),
      upgrades: this.capabilities.getShipUpgrades(),
    },
  };

  let result;
  switch (choice) {
    case 'evasive':
      result = this.resolveEvasiveManeuvers(encounter, stateView, rng);
      break;
    case 'return_fire':
      result = this.resolveReturnFire(encounter, stateView, rng);
      break;
    case 'dump_cargo':
      result = this.resolveDumpCargo();
      break;
    case 'distress_call':
      result = this.resolveDistressCall(encounter, stateView, rng);
      break;
    default:
      throw new Error(`Unknown combat choice: ${choice}`);
  }

  this.capabilities.incrementDangerFlag('piratesFought');
  return result;
}
```

**Design note:** The internal methods (`resolveEvasiveManeuvers`, `resolveReturnFire`, etc.) receive a `stateView` object with the same shape they expect today (`stateView.player.karma`, `stateView.ship.quirks`, etc.). This avoids changing every internal method's parameter handling. The `stateView` is built from capabilities at the entry point (`resolveCombatChoice`) and passed through. This is intentional — it keeps the refactoring minimal and focused on the boundary change.

2c. No changes needed to internal methods (`resolveEvasiveManeuvers`, `resolveReturnFire`, `resolveDumpCargo`, `resolveDistressCall`, `checkLuckyShipNegate`, `applyHullDamageModifiers`). They receive `gameState`/`stateView` as a parameter and don't call `this.getState()` or `this.gameStateManager`.

**Step 3: Update direct-instantiation tests**

In `tests/unit/combat-manager-coverage.test.js`, update the mock setup:

```js
// Before (lines 25-38):
gsm = {
  state,
  starData: [],
  wormholeData: [],
  navigationSystem: { jump: vi.fn() },
  emit: vi.fn(),
  isTestEnvironment: true,
  incrementDangerFlag: vi.fn(),
};
manager = new CombatManager(gsm);

// After:
const capabilities = {
  getDaysElapsed: () => state.player.daysElapsed,
  getCurrentSystem: () => state.player.currentSystem,
  getShipQuirks: () => state.ship.quirks,
  getShipUpgrades: () => state.ship.upgrades,
  getKarma: () => state.player.karma,
  incrementDangerFlag: vi.fn(),
  emit: vi.fn(),
  markDirty: vi.fn(),
  isTestEnvironment: true,
};
manager = new CombatManager(capabilities);
```

Update any assertions that reference `gsm.incrementDangerFlag` to reference `capabilities.incrementDangerFlag`.

Also check `tests/unit/combat-lucky-negation.test.js` for the same pattern and update if it instantiates CombatManager directly.

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass.

**Step 5: Commit**

```
git add src/game/state/managers/combat.js src/game/state/game-coordinator.js tests/unit/combat-manager-coverage.test.js tests/unit/combat-lucky-negation.test.js
git commit -m "Migrate CombatManager to capability injection"
```

---

### Task 5: Migrate InspectionManager

**Files:**
- Modify: `src/game/state/managers/inspection.js`
- Modify: `src/game/state/game-coordinator.js` (constructor + delegation method)
- Test: `tests/unit/inspection-manager.test.js` (uses `createTestGameStateManager()`, verify no changes needed)
- Check: `tests/unit/inspection-flee-costs.test.js`, `tests/unit/threat-inspection-calculators.test.js`

**Context:** InspectionManager is more complex because it calls `getDangerZone()` and `countRestrictedGoods()` on the GSM — these are cross-domain read queries delegated to DangerManager. It also takes `gameState` as a method parameter, which is used by sub-methods for ship cargo and current system. After migration, all state reads come from capabilities and the `gameState` parameter is dropped from internal methods.

**Capability object shape** (from `capabilities.js` lines 90-104):
```js
{
  getDaysElapsed: () => number,
  getCurrentSystem: () => number,
  getShipCargo: () => Array,
  getShipHiddenCargo: () => Array,
  getDangerZone: (systemId) => Object,
  countRestrictedGoods: (cargo, zone, systemId) => number,
  incrementDangerFlag: (flagName) => void,
  emit: (eventType, data) => void,
  markDirty: () => void,
  isTestEnvironment: boolean,
}
```

**Step 1: Update coordinator constructor**

In `src/game/state/game-coordinator.js`, replace the InspectionManager instantiation (line ~100):

```js
// Before:
this.inspectionManager = new InspectionManager(this);

// After:
this.inspectionManager = new InspectionManager({
  getDaysElapsed: () => this.state.player.daysElapsed,
  getCurrentSystem: () => this.state.player.currentSystem,
  getShipCargo: () => this.state.ship.cargo,
  getShipHiddenCargo: () => this.state.ship.hiddenCargo,
  getDangerZone: (systemId) => this.dangerManager.getDangerZone(systemId),
  countRestrictedGoods: (cargo, zone, systemId) =>
    this.dangerManager.countRestrictedGoods(cargo, zone, systemId),
  incrementDangerFlag: (flagName) =>
    this.dangerManager.incrementDangerFlag(flagName),
  emit: this.emit.bind(this),
  markDirty: this.markDirty.bind(this),
  isTestEnvironment: this.isTestEnvironment,
});
```

**Step 2: Update coordinator delegation method**

The coordinator's `resolveInspection` keeps its public signature but stops forwarding `gameState`:

```js
// Before (~line 993):
resolveInspection(choice, gameState) {
  return this.inspectionManager.resolveInspection(choice, gameState);
}

// After:
resolveInspection(choice, _gameState) {
  return this.inspectionManager.resolveInspection(choice);
}
```

**Step 3: Update the manager**

In `src/game/state/managers/inspection.js`:

3a. Remove the constructor.

3b. Replace `resolveInspection(choice, gameState)` — remove `gameState` param, use capabilities:

```js
resolveInspection(choice) {
  this.validateState();

  const seed = buildEncounterSeed(
    this.capabilities.getDaysElapsed(),
    this.capabilities.getCurrentSystem(),
    'inspection'
  );
  const seededRng = new SeededRandom(seed).next();

  let result;
  switch (choice) {
    case 'cooperate':
      result = this.resolveInspectionCooperate(seededRng);
      this.capabilities.incrementDangerFlag('inspectionsPassed');
      break;
    case 'bribe':
      result = this.resolveInspectionBribe(seededRng);
      this.capabilities.incrementDangerFlag('inspectionsBribed');
      break;
    case 'flee':
      result = this.resolveInspectionFlee();
      this.capabilities.incrementDangerFlag('inspectionsFled');
      break;
    default:
      throw new Error(`Unknown inspection choice: ${choice}`);
  }

  return result;
}
```

3c. Replace `resolveInspectionCooperate(gameState, rng)` — remove `gameState`, use capabilities:

```js
resolveInspectionCooperate(rng) {
  let totalFine = 0;
  let restrictedGoodsConfiscated = false;
  let hiddenCargoConfiscated = false;
  let authorityRepChange = INSPECTION_CONFIG.COOPERATE.AUTHORITY_REP_GAIN;
  let outlawRepChange = 0;

  const currentSystem = this.capabilities.getCurrentSystem() || 0;
  const zone = this.capabilities.getDangerZone(currentSystem);
  const cargo = this.capabilities.getShipCargo() || [];
  const restrictedCount = this.capabilities.countRestrictedGoods(
    cargo,
    zone,
    currentSystem
  );
  const hasRestrictedGoods = restrictedCount > 0;
  if (hasRestrictedGoods) {
    totalFine += INSPECTION_CONFIG.COOPERATE.RESTRICTED_FINE;
    restrictedGoodsConfiscated = true;
    authorityRepChange +=
      INSPECTION_CONFIG.REPUTATION_PENALTIES.RESTRICTED_GOODS;
  }

  const hiddenCargo = this.capabilities.getShipHiddenCargo();
  const hasHiddenCargo = hiddenCargo && hiddenCargo.length > 0;
  if (hasHiddenCargo) {
    let securityMultiplier;
    if (currentSystem === 0 || currentSystem === 1) {
      securityMultiplier = INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS.core;
    } else {
      securityMultiplier = INSPECTION_CONFIG.SECURITY_LEVEL_MULTIPLIERS[zone];
    }

    const discoveryChance =
      INSPECTION_CONFIG.HIDDEN_CARGO_DISCOVERY_CHANCE * securityMultiplier;

    if (rng < discoveryChance) {
      totalFine += INSPECTION_CONFIG.COOPERATE.HIDDEN_FINE;
      hiddenCargoConfiscated = true;
      authorityRepChange =
        INSPECTION_CONFIG.REPUTATION_PENALTIES.HIDDEN_CARGO;
      outlawRepChange =
        INSPECTION_CONFIG.REPUTATION_PENALTIES.SMUGGLING_OUTLAW_BONUS;
    }
  }

  // ... rest of method unchanged (description logic + outcome construction)
```

3d. Replace `resolveInspectionBribe(gameState, rng)` — remove `gameState` param (it was never used):

```js
resolveInspectionBribe(rng) {
  // ... body unchanged — this method never used gameState
```

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass. The inspection tests use `createTestGameStateManager()`, so they go through the full GSM → Coordinator → capability pipeline.

**Step 5: Commit**

```
git add src/game/state/managers/inspection.js src/game/state/game-coordinator.js
git commit -m "Migrate InspectionManager to capability injection"
```

---

### Task 6: Migrate NegotiationManager

**Files:**
- Modify: `src/game/state/managers/negotiation.js`
- Modify: `src/game/state/game-coordinator.js` (constructor only)
- Test: `tests/unit/negotiation-manager.test.js` (uses `createTestGameStateManager()`, verify no changes needed)
- Check: `tests/unit/negotiation-outcomes.test.js`, `tests/unit/negotiation-escalation.test.js`

**Context:** NegotiationManager is the most complex Batch 1 manager. It reads cargo, credits, missions, and intel flag. It uses seeded RNG. Its only cross-domain write is `incrementDangerFlag('piratesNegotiated')`. Multiple internal methods call `this.getState()` to access different state slices — each call must be replaced with the appropriate capability getter.

**Capability object shape** (from `capabilities.js` lines 73-88):
```js
{
  getDaysElapsed: () => number,
  getCurrentSystem: () => number,
  getKarma: () => number,
  getShipCargo: () => Array,
  getCredits: () => number,
  getActiveMissions: () => Array|undefined,
  getHasPriorIntel: () => boolean,
  incrementDangerFlag: (flagName) => void,
  emit: (eventType, data) => void,
  markDirty: () => void,
  isTestEnvironment: boolean,
}
```

**Step 1: Update coordinator constructor**

In `src/game/state/game-coordinator.js`, replace the NegotiationManager instantiation (line ~99):

```js
// Before:
this.negotiationManager = new NegotiationManager(this);

// After:
this.negotiationManager = new NegotiationManager({
  getDaysElapsed: () => this.state.player.daysElapsed,
  getCurrentSystem: () => this.state.player.currentSystem,
  getKarma: () => this.state.player.karma,
  getShipCargo: () => this.state.ship.cargo,
  getCredits: () => this.state.player.credits,
  getActiveMissions: () => this.state.missions?.active,
  getHasPriorIntel: () => this.state.world?.flags?.hasPriorIntel || false,
  incrementDangerFlag: (flagName) =>
    this.dangerManager.incrementDangerFlag(flagName),
  emit: this.emit.bind(this),
  markDirty: this.markDirty.bind(this),
  isTestEnvironment: this.isTestEnvironment,
});
```

**Step 2: Update the manager**

In `src/game/state/managers/negotiation.js`:

2a. Remove the constructor.

2b. Replace `resolveNegotiation()` — use capabilities:

```js
resolveNegotiation(encounter, choice) {
  this.validateState();

  const seed = buildEncounterSeed(
    this.capabilities.getDaysElapsed(),
    this.capabilities.getCurrentSystem(),
    'negotiation'
  );
  const seededRng = new SeededRandom(seed);
  const rngValue = seededRng.next();

  // Build a state view for internal methods that check karma
  const stateView = {
    player: {
      karma: this.capabilities.getKarma(),
      credits: this.capabilities.getCredits(),
      daysElapsed: this.capabilities.getDaysElapsed(),
      currentSystem: this.capabilities.getCurrentSystem(),
    },
    ship: { cargo: this.capabilities.getShipCargo() },
    missions: { active: this.capabilities.getActiveMissions() },
    world: { flags: { hasPriorIntel: this.capabilities.getHasPriorIntel() } },
  };

  let result;
  switch (choice) {
    case 'counter_proposal':
      result = this.resolveCounterProposal(encounter, stateView, rngValue);
      break;
    case 'medicine_claim':
      result = this.resolveMedicineClaim(encounter, stateView, rngValue);
      break;
    case 'intel_offer':
      result = this.resolveIntelOffer(encounter, stateView, rngValue);
      break;
    case 'accept_demand':
      result = this.resolveAcceptDemand();
      break;
    default:
      throw new Error(`Unknown negotiation choice: ${choice}`);
  }

  this.capabilities.incrementDangerFlag('piratesNegotiated');
  return result;
}
```

2c. Replace `hasTradeCargoForPirates()` — use capabilities instead of `this.getState()`:

```js
hasTradeCargoForPirates() {
  this.validateState();
  const cargo = this.capabilities.getShipCargo();
  return cargo.some((item) => item.qty > 0);
}
```

2d. Replace `resolveAcceptDemand()` — use capabilities instead of `this.getState()`:

```js
resolveAcceptDemand() {
  const { ACCEPT_DEMAND } = NEGOTIATION_CONFIG;

  if (this.hasTradeCargoForPirates()) {
    return {
      success: true,
      costs: {
        cargoPercent: ACCEPT_DEMAND.CARGO_PERCENT,
      },
      rewards: {},
      description:
        'Paid the pirates their demanded tribute and continued safely.',
    };
  }

  const rng = new SeededRandom(
    buildEncounterSeed(
      this.capabilities.getDaysElapsed(),
      this.capabilities.getCurrentSystem(),
      'negotiation_payment'
    )
  );

  const { MIN_CREDIT_DEMAND, MAX_CREDIT_DEMAND } =
    PIRATE_CREDIT_DEMAND_CONFIG;
  const creditDemand = Math.round(
    MIN_CREDIT_DEMAND + rng.next() * (MAX_CREDIT_DEMAND - MIN_CREDIT_DEMAND)
  );

  if (this.capabilities.getCredits() >= creditDemand) {
    return {
      success: true,
      costs: {
        credits: creditDemand,
      },
      rewards: {},
      description: `No cargo to plunder. Pirates demanded ₡${creditDemand} in credits instead.`,
    };
  }

  return this.resolveCannotPayPirates(rng);
}
```

2e. Replace `resolveCannotPayPirates(rng)` — use capabilities instead of `this.getState()`:

```js
resolveCannotPayPirates(rng) {
  if (!rng) {
    rng = new SeededRandom(
      buildEncounterSeed(
        this.capabilities.getDaysElapsed(),
        this.capabilities.getCurrentSystem(),
        'negotiation_payment'
      )
    );
  }

  const activeMissions = this.capabilities.getActiveMissions() || [];
  const passengerMissions = activeMissions.filter(
    (m) => m.type === 'passenger' && m.passenger
  );

  // ... rest unchanged (passenger kidnap + ship damage logic doesn't access state)
```

2f. No changes needed to `resolveCounterProposal`, `resolveMedicineClaim`, `resolveIntelOffer` — they receive `gameState`/`stateView` as a parameter and don't call `this.getState()` or `this.gameStateManager`.

**Step 3: Run tests**

Run: `npm test`
Expected: All tests pass.

**Step 4: Commit**

```
git add src/game/state/managers/negotiation.js src/game/state/game-coordinator.js
git commit -m "Migrate NegotiationManager to capability injection"
```

---

### Task 7: Update design doc and final verification

**Files:**
- Modify: `docs/plans/2026-03-08-gsm-refactor-design.md`

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 2: Run lint and format**

Run: `npm run clean`
Expected: No lint or format errors.

**Step 3: Update design doc**

In `docs/plans/2026-03-08-gsm-refactor-design.md`, update the Phase 3 row in the implementation table:

```
| Phase 3 Batch 1 | `2026-03-08-gsm-phase3-batch1-implementation.md` | Complete |
| Phase 3 Batch 2 | (create when Batch 1 is complete) | — |
```

**Step 4: Commit**

```
git add docs/plans/2026-03-08-gsm-refactor-design.md
git commit -m "Mark Phase 3 Batch 1 complete in GSM refactor design doc"
```

---

## Migration Pattern Reference

For each manager in subsequent batches, follow this pattern:

1. **Coordinator**: Build capability object with specific getters/callbacks, pass to manager constructor
2. **Manager**: Remove custom constructor (rely on BaseManager dual-mode), replace `this.getState()` with `this.capabilities.getXxx()`, replace `this.gameStateManager.method()` with `this.capabilities.method()`
3. **Tests**: Update direct-instantiation tests to pass capability objects; tests using `createTestGameStateManager()` should pass without changes
4. **Internal methods**: Where many internal methods read from a `gameState` parameter, build a `stateView` object from capabilities at the entry point and pass it through — this minimizes changes to internal method signatures

## Key Risks and Mitigations

1. **Manager instantiation order in coordinator**: Capability objects reference other managers (e.g., `this.dangerManager.incrementDangerFlag`). The referenced manager must be instantiated first. Current order in coordinator already has DangerManager before all Batch 1 managers.

2. **Test mocking pattern**: Tests that directly instantiate managers need capability objects instead of mock GSMs. The `'state' in arg` check in BaseManager determines the mode — test capability objects must NOT have a `state` property.

3. **stateView vs. full capabilities**: For CombatManager and NegotiationManager, internal methods receive `gameState` as a parameter. Rather than changing every internal method, we build a `stateView` object from capabilities at the entry point. This is pragmatic for Batch 1 but later batches may prefer direct capability access in internal methods if the method signatures allow it.
