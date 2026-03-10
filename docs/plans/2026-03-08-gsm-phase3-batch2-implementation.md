# Phase 3 Batch 2: Migrate Clean Slice Owners

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate AchievementsManager, QuestManager, and DialogueManager from old-style (`this.gameStateManager`) to new-style capability injection.

**Architecture:** Each manager stops using `this.getState()` and `this.gameStateManager.X()` and instead receives a capability object with explicit read queries, write callbacks, and infrastructure. The coordinator builds these capability objects and passes them at construction time. BaseManager's dual-mode support (added in Batch 1) allows migrated and unmigrated managers to coexist.

**Tech Stack:** Vitest, ES Modules, JSDoc typedefs (already defined in `src/game/state/capabilities.js`)

**Managers in this batch (ordered by complexity):**
1. DialogueManager — owns `state.dialogue`, minimal cross-domain needs, but passes coordinator to dialogue engine
2. AchievementsManager — owns `state.achievements`, reads broadly (npcs, dangerFlags, karma, stats) but writes narrowly
3. QuestManager — owns `state.quests`, has cross-domain writes (credits, karma, rep, cargo), event subscriptions, starData access

**Design reference:** `docs/plans/2026-03-08-gsm-refactor-design.md` Phase 3 section. Capability typedefs: `src/game/state/capabilities.js` lines 130-194.

**Migration pattern established in Batch 1:** See `docs/plans/2026-03-08-gsm-phase3-batch1-implementation.md` "Migration Pattern Reference" section.

---

### Task 1: Update DialogueCapabilities typedef and migrate DialogueManager

**Files:**
- Modify: `src/game/state/capabilities.js`
- Modify: `src/game/state/managers/dialogue.js`
- Modify: `src/game/state/game-coordinator.js` (constructor only)
- Test: existing test suite (no new tests — behavior unchanged)

**Context:** DialogueManager owns `state.dialogue` and is straightforward — it sets/gets/clears dialogue state fields and emits events. However, its `startDialogue()` and `selectDialogueChoice()` methods pass `this.gameStateManager` to the dialogue engine functions `showDialogue()` and `selectChoice()` in `src/game/game-dialogue.js`. Those functions call `gameStateManager.getState()`, `gameStateManager.getKarma()`, etc.

The pragmatic solution: include a `coordinatorRef` in the DialogueCapabilities — the coordinator reference that the dialogue engine needs. This is a documented compromise: DialogueManager itself only uses `getOwnState()` and `emit()` for its own mutations, but passes `coordinatorRef` through to the dialogue engine unchanged. The dialogue engine is a separate module that will get its own refactoring if/when needed.

**Step 1: Update DialogueCapabilities typedef**

In `src/game/state/capabilities.js`, update the `DialogueCapabilities` typedef (lines 187-194):

```js
/**
 * @typedef {Object} DialogueCapabilities
 *
 * @property {function(): Object} getOwnState
 *   Returns: state.dialogue
 *
 * @property {function(string, *): void} emit
 *
 * @property {Object} coordinatorRef
 *   The coordinator instance, passed through to dialogue engine functions
 *   (showDialogue, selectChoice). Those functions use it to build dialogue
 *   context (karma, credits, NPC state, etc.). This is a documented coupling
 *   that will be addressed if the dialogue engine is refactored separately.
 */
```

**Step 2: Update coordinator constructor**

In `src/game/state/game-coordinator.js`, replace the DialogueManager instantiation (line ~94):

```js
// Before:
this.dialogueManager = new DialogueManager(this);

// After:
this.dialogueManager = new DialogueManager({
  getOwnState: () => this.state.dialogue,
  emit: this.emit.bind(this),
  coordinatorRef: this,
  isTestEnvironment: this.isTestEnvironment,
});
```

**Step 3: Update the manager**

In `src/game/state/managers/dialogue.js`:

3a. Remove the constructor (BaseManager's dual-mode constructor handles it).

3b. Replace all `this.getState()` calls with `this.capabilities.getOwnState()` and all `this.emit(...)` calls with `this.capabilities.emit(...)`:

In `setDialogueState`:
```js
setDialogueState(npcId, nodeId) {
  this.validateState();

  const dialogue = this.capabilities.getOwnState();
  dialogue.currentNpcId = npcId;
  dialogue.currentNodeId = nodeId;
  dialogue.isActive = true;

  this.capabilities.emit(EVENT_NAMES.DIALOGUE_CHANGED, { ...dialogue });
}
```

In `getDialogueState`:
```js
getDialogueState() {
  this.validateState();

  const dialogue = this.capabilities.getOwnState();
  return { ...dialogue };
}
```

In `clearDialogueState`:
```js
clearDialogueState() {
  this.validateState();

  const dialogue = this.capabilities.getOwnState();
  dialogue.currentNpcId = null;
  dialogue.currentNodeId = null;
  dialogue.isActive = false;
  dialogue.display = null;

  this.capabilities.emit(EVENT_NAMES.DIALOGUE_CHANGED, { ...dialogue });
}
```

In `startDialogue` — replace `this.gameStateManager` with `this.capabilities.coordinatorRef`:
```js
async startDialogue(npcId, nodeId = 'greeting') {
  this.validateState();

  const { showDialogue } = await import('../../game-dialogue.js');

  const dialogueDisplay = showDialogue(
    npcId,
    nodeId,
    this.capabilities.coordinatorRef
  );

  const dialogue = this.capabilities.getOwnState();
  dialogue.currentNpcId = npcId;
  dialogue.currentNodeId = nodeId;
  dialogue.isActive = true;
  dialogue.display = dialogueDisplay;

  this.capabilities.emit(EVENT_NAMES.DIALOGUE_CHANGED, { ...dialogue });

  return dialogueDisplay;
}
```

In `selectDialogueChoice` — replace `this.gameStateManager` with `this.capabilities.coordinatorRef`:
```js
async selectDialogueChoice(npcId, choiceIndex) {
  this.validateState();

  const { selectChoice } = await import('../../game-dialogue.js');

  const nextDisplay = selectChoice(
    npcId,
    choiceIndex,
    this.capabilities.coordinatorRef
  );

  const dialogue = this.capabilities.getOwnState();

  if (nextDisplay) {
    dialogue.currentNpcId = npcId;
    dialogue.currentNodeId =
      nextDisplay.currentNodeId || dialogue.currentNodeId;
    dialogue.isActive = true;
    dialogue.display = nextDisplay;

    this.capabilities.emit(EVENT_NAMES.DIALOGUE_CHANGED, { ...dialogue });

    return nextDisplay;
  } else {
    dialogue.currentNpcId = null;
    dialogue.currentNodeId = null;
    dialogue.isActive = false;
    dialogue.display = null;

    this.capabilities.emit(EVENT_NAMES.DIALOGUE_CHANGED, { ...dialogue });

    return null;
  }
}
```

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass. Dialogue tests use `new GameStateManager(STAR_DATA, WORMHOLE_DATA)` or `createTestGameStateManager()`, which both go through the GSM → Coordinator → capability pipeline.

**Step 5: Commit**

```
git add src/game/state/capabilities.js src/game/state/managers/dialogue.js src/game/state/game-coordinator.js
git commit -m "Migrate DialogueManager to capability injection"
```

---

### Task 2: Migrate AchievementsManager

**Files:**
- Modify: `src/game/state/managers/achievements.js`
- Modify: `src/game/state/game-coordinator.js` (constructor only)
- Test: `tests/unit/achievements.test.js` (uses `new GameStateManager(STAR_DATA, WORMHOLE_DATA)`, no changes needed)

**Context:** AchievementsManager owns `state.achievements` and reads broadly across the state tree. Its `resolveStatPath()` method currently walks arbitrary dotted paths on the full state object (e.g., `stats.jumpsCompleted`, `world.visitedSystems`). With capability injection, we restructure `resolveStatPath()` to use specific capability getters instead of arbitrary traversal.

The key insight: every `statPath` used by achievements falls into one of these categories:
- `stats.*` → `this.capabilities.getStats()`
- `world.visitedSystems` → needs a specific getter
- `world.dangerFlags` → `this.capabilities.getDangerFlags()`
- `computed.*` → uses specific capability getters (npcs, dangerFlags, karma)

**Capability object shape** (from `capabilities.js` lines 134-152, already defined):
```js
{
  getOwnState: () => state.achievements,
  getNpcs: () => state.npcs,
  getDangerFlags: () => state.world?.dangerFlags,
  getKarma: () => state.player?.karma,
  getDaysElapsed: () => state.player.daysElapsed,
  getStats: () => state.stats,
  getVisitedSystems: () => state.world?.visitedSystems,
  markDirty: () => void,
  emit: (eventType, data) => void,
  isTestEnvironment: boolean,
}
```

**Step 1: Update AchievementsCapabilities typedef**

In `src/game/state/capabilities.js`, update the `AchievementsCapabilities` typedef to add `getVisitedSystems`:

```js
/**
 * @typedef {Object} AchievementsCapabilities
 *
 * @property {function(): Object} getOwnState
 *   Returns: state.achievements
 *
 * @property {function(): Object} getNpcs
 *   Returns: state.npcs (read-only, for counting trusted NPCs)
 * @property {function(): Object|undefined} getDangerFlags
 *   Returns: state.world.dangerFlags
 * @property {function(): number|undefined} getKarma
 *   Returns: state.player.karma
 * @property {function(): number} getDaysElapsed
 * @property {function(): Object|undefined} getStats
 *   Returns: state.stats
 * @property {function(): Array|undefined} getVisitedSystems
 *   Returns: state.world.visitedSystems
 *
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 */
```

**Step 2: Update coordinator constructor**

In `src/game/state/game-coordinator.js`, replace the AchievementsManager instantiation (line ~163):

```js
// Before:
this.achievementsManager = new AchievementsManager(this);

// After:
this.achievementsManager = new AchievementsManager({
  getOwnState: () => this.state.achievements,
  getNpcs: () => this.state.npcs,
  getDangerFlags: () => this.state.world?.dangerFlags,
  getKarma: () => this.state.player?.karma,
  getDaysElapsed: () => this.state.player.daysElapsed,
  getStats: () => this.state.stats,
  getVisitedSystems: () => this.state.world?.visitedSystems,
  markDirty: this.markDirty.bind(this),
  emit: this.emit.bind(this),
  isTestEnvironment: this.isTestEnvironment,
});
```

**Step 3: Update the manager**

In `src/game/state/managers/achievements.js`:

3a. Remove the constructor (BaseManager's dual-mode constructor handles it).

3b. Replace `resolveStatPath()` — restructure to use capability getters instead of arbitrary state traversal:

```js
resolveStatPath(statPath) {
  if (statPath.startsWith('computed.')) {
    return this._resolveComputed(statPath);
  }

  // Route stat paths to appropriate capability getters
  if (statPath.startsWith('stats.')) {
    const stats = this.capabilities.getStats();
    const key = statPath.slice(6); // Remove 'stats.' prefix
    return typeof stats?.[key] === 'number' ? stats[key] : 0;
  }

  if (statPath === 'world.visitedSystems') {
    const visited = this.capabilities.getVisitedSystems();
    return Array.isArray(visited) ? visited.length : 0;
  }

  // Fallback for any other paths (shouldn't be needed but safe)
  return 0;
}
```

**Important:** The current `resolveStatPath` walks arbitrary dotted paths on the full state. The new version routes known path prefixes to capability getters. Check the actual achievement definitions in `src/game/data/achievements-data.js` to confirm all stat paths are covered. The existing paths are:
- `stats.jumpsCompleted`, `stats.creditsEarned`, `stats.cargoHauled`, `stats.charitableActs` → covered by `stats.*` branch
- `world.visitedSystems` → special-cased (returns `.length`, not the array)
- `computed.trustedNPCCount`, `computed.totalDangerEncounters`, `computed.karmaAbsolute` → handled by `_resolveComputed`

**Note about `world.visitedSystems`:** The current code does `state.world.visitedSystems` and walks the path — it would get the array, not the length. But the achievement's `target` is a number (48), and the comparison is `current >= achievement.target`. The current `resolveStatPath` returns the array itself (not a number), which means `[...] >= 48` is always false in JS. Looking more carefully at the achievements data file, the actual `statPath` for exploration achievements is likely something else. **Read `src/game/data/achievements-data.js` to verify the actual stat paths before implementing.** Adjust the routing logic accordingly.

3c. Replace `_resolveComputed()` — use capability getters:

```js
_resolveComputed(statPath) {
  switch (statPath) {
    case 'computed.trustedNPCCount':
      return Object.values(this.capabilities.getNpcs() || {}).filter(
        (npc) => npc.rep >= REPUTATION_BOUNDS.TRUSTED_MIN
      ).length;

    case 'computed.totalDangerEncounters': {
      const flags = this.capabilities.getDangerFlags() || {};
      return Object.values(flags).reduce((sum, val) => sum + val, 0);
    }

    case 'computed.karmaAbsolute':
      return Math.abs(this.capabilities.getKarma() ?? 0);

    default:
      this.warn(`Unknown computed stat path: ${statPath}`);
      return 0;
  }
}
```

3d. Replace `checkAchievements()` — use capabilities:

```js
checkAchievements() {
  let achievements = this.capabilities.getOwnState();
  if (!achievements) {
    // getOwnState returns state.achievements; if it doesn't exist yet,
    // we can't create it from here. This shouldn't happen after initNewGame.
    return;
  }

  let anyUnlocked = false;

  for (const achievement of ACHIEVEMENTS) {
    if (achievements[achievement.id]) continue;

    const current = this.resolveStatPath(achievement.statPath);
    if (current >= achievement.target) {
      achievements[achievement.id] = {
        unlocked: true,
        unlockedOnDay: this.capabilities.getDaysElapsed(),
      };
      anyUnlocked = true;

      this.capabilities.emit(EVENT_NAMES.ACHIEVEMENT_UNLOCKED, {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        tier: achievement.tier,
      });
    }
  }

  if (anyUnlocked) {
    this.capabilities.emit(EVENT_NAMES.ACHIEVEMENTS_CHANGED, {
      ...achievements,
    });
    this.capabilities.markDirty();
  }
}
```

3e. Replace `getProgress()` — use capabilities:

```js
getProgress() {
  const achievements = this.capabilities.getOwnState();
  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    current: this.resolveStatPath(achievement.statPath),
    unlocked: !!achievements?.[achievement.id],
    unlockedOnDay: achievements?.[achievement.id]?.unlockedOnDay ?? null,
  }));
}
```

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass. The achievement tests use `new GameStateManager(STAR_DATA, WORMHOLE_DATA)` which goes through GSM → Coordinator → capability injection.

**Step 5: Commit**

```
git add src/game/state/capabilities.js src/game/state/managers/achievements.js src/game/state/game-coordinator.js
git commit -m "Migrate AchievementsManager to capability injection"
```

---

### Task 3: Update QuestCapabilities typedef and migrate QuestManager

**Files:**
- Modify: `src/game/state/capabilities.js`
- Modify: `src/game/state/managers/quest-manager.js`
- Modify: `src/game/state/game-coordinator.js` (constructor + possibly delegation methods)
- Test: `tests/unit/quest-manager.test.js` (uses `createTestGameStateManager()`, no changes needed)
- Check: `tests/unit/quest-manager-gaps.test.js`, `tests/unit/quest-dialogue-rewards.test.js`, `tests/unit/quest-requirement-hints.test.js`

**Context:** QuestManager is the most complex manager in Batch 2. It:
- Owns `state.quests` and mutates it directly (quest state, data fields)
- Reads `player.daysElapsed`, `player.currentSystem`, `player.credits`, `player.debt`, `ship.cargo`, `ship.hull`, `ship.engine`, `npcs`, `world.narrativeEvents.flags`
- Calls cross-domain writes: `updateCredits`, `modifyRepRaw`, `modifyKarma`, `removeCargoForMission`
- Accesses `this.gameStateManager.starData` for distance calculation in `onDock()`
- Subscribes to JUMP_COMPLETED and DOCKED events in constructor
- `_applyRewards()` directly mutates `state.ship.engine` and pushes to `state.ship.upgrades` — these need capability callbacks

The `_applyRewards` method has two mutations that bypass proper ownership:
1. `state.ship.engine = SHIP_CONFIG.CONDITION_BOUNDS.MAX` — should use a ship condition callback
2. `state.ship.upgrades.push(rewards.upgrade)` — should use an upgrade callback

For the ship mutations, add `updateShipEngine` and `addShipUpgrade` callbacks to the capabilities rather than full `updateShipCondition`, since the quest only does specific targeted updates.

**Step 1: Update QuestCapabilities typedef**

In `src/game/state/capabilities.js`, update the `QuestCapabilities` typedef. It needs the subscribe method for event subscriptions, and specific callbacks for ship mutations:

```js
/**
 * @typedef {Object} QuestCapabilities
 *
 * @property {function(): Object} getOwnState
 *   Returns: state.quests
 *
 * @property {function(): number} getDaysElapsed
 * @property {function(): number} getCurrentSystem
 * @property {function(): number} getCredits
 * @property {function(): Array} getShipCargo
 * @property {function(): number} getShipHull
 * @property {function(): number} getShipEngine
 * @property {function(): Array} getShipUpgrades
 * @property {function(): Object} getNpcs
 *   Returns: state.npcs (read-only, for quest stage requirement checks)
 * @property {function(): number|undefined} getDebt
 *   Returns: state.player.debt
 * @property {function(): Object|undefined} getNarrativeFlags
 *   Returns: state.world.narrativeEvents.flags
 *
 * @property {function(number): void} updateCredits
 *   Sets player credits to exact value
 * @property {function(string, number, string): void} modifyRepRaw
 *   Modifies NPC reputation (bypasses trust modifier)
 * @property {function(number, string): void} modifyKarma
 * @property {function(string, number): void} removeCargoForMission
 * @property {function(number): void} setShipEngine
 *   Sets ship engine condition to exact value (for engine restore rewards)
 * @property {function(string): void} addShipUpgrade
 *   Adds upgrade to ship if not already present
 * @property {function(): void} markDirty
 * @property {function(string, *): void} emit
 * @property {function(string, function): void} subscribe
 *   Subscribe to game events (for JUMP_COMPLETED, DOCKED)
 * @property {Array} starData
 */
```

**Step 2: Update coordinator constructor**

In `src/game/state/game-coordinator.js`, replace the QuestManager instantiation (line ~161).

**Important ordering:** QuestManager subscribes to events in its constructor, so `this.eventSystemManager` must be instantiated first (it is — line ~84). Also, `this.npcManager` is needed for `modifyRepRaw`, and `this.dangerManager` for `modifyKarma` — both are already instantiated before this point.

```js
// Before:
this.questManager = new QuestManager(this);

// After:
this.questManager = new QuestManager({
  getOwnState: () => this.state.quests,
  getDaysElapsed: () => this.state.player.daysElapsed,
  getCurrentSystem: () => this.state.player.currentSystem,
  getCredits: () => this.state.player.credits,
  getShipCargo: () => this.state.ship.cargo,
  getShipHull: () => this.state.ship.hull,
  getShipEngine: () => this.state.ship.engine,
  getShipUpgrades: () => this.state.ship.upgrades,
  getNpcs: () => this.state.npcs,
  getDebt: () => this.state.player.debt,
  getNarrativeFlags: () => this.state.world?.narrativeEvents?.flags,
  updateCredits: (value) => this.stateManager.updateCredits(value),
  modifyRepRaw: (npcId, amount, reason) =>
    this.npcManager.modifyRepRaw(npcId, amount, reason),
  modifyKarma: (amount, reason) =>
    this.dangerManager.modifyKarma(amount, reason),
  removeCargoForMission: (goodType, qty) =>
    this.shipManager.removeCargoForMission(goodType, qty),
  setShipEngine: (value) => {
    this.state.ship.engine = value;
    this.emit(EVENT_NAMES.SHIP_CONDITION_CHANGED, {
      hull: this.state.ship.hull,
      engine: this.state.ship.engine,
      lifeSupport: this.state.ship.lifeSupport,
    });
  },
  addShipUpgrade: (upgrade) => {
    if (!this.state.ship.upgrades.includes(upgrade)) {
      this.state.ship.upgrades.push(upgrade);
      this.emit(EVENT_NAMES.UPGRADES_CHANGED, [...this.state.ship.upgrades]);
    }
  },
  updateStats: (key, delta) => {
    if (this.state.stats) {
      this.state.stats[key] = (this.state.stats[key] || 0) + delta;
    }
  },
  markDirty: this.markDirty.bind(this),
  emit: this.emit.bind(this),
  subscribe: this.subscribe.bind(this),
  starData: this.starData,
  isTestEnvironment: this.isTestEnvironment,
});
```

**Step 3: Update the manager**

In `src/game/state/managers/quest-manager.js`:

3a. Replace the constructor — use capabilities for event subscriptions, keep `questDefinitions` map:

```js
constructor(capabilities) {
  super(capabilities);
  this.questDefinitions = {};
  this.capabilities.subscribe(EVENT_NAMES.JUMP_COMPLETED, () => this.onJump());
  this.capabilities.subscribe(EVENT_NAMES.DOCKED, (data) =>
    this.onDock(data?.systemId)
  );
}
```

3b. Replace `getQuestState()` — use `this.capabilities.getOwnState()`:

```js
getQuestState(questId) {
  if (!this.questDefinitions[questId]) return null;
  const quests = this.capabilities.getOwnState();
  if (!quests[questId]) {
    quests[questId] = {
      stage: 0,
      data: {},
      startedDay: null,
      completedDay: null,
    };
  }
  return quests[questId];
}
```

3c. Replace `advanceQuest()` — use capabilities:

```js
advanceQuest(questId) {
  const questDef = this.questDefinitions[questId];
  if (!questDef) return { success: false, reason: 'Quest not found' };

  const questState = this.getQuestState(questId);
  if (questState.completedDay != null) {
    return { success: false, reason: 'Quest already complete' };
  }

  const nextStage = questState.stage + 1;

  if (questState.stage === 0) {
    questState.startedDay = this.capabilities.getDaysElapsed();
  }

  questState.stage = nextStage;

  if (nextStage >= questDef.victoryStage) {
    questState.completedDay = this.capabilities.getDaysElapsed();
  }

  const quests = this.capabilities.getOwnState();
  this.capabilities.emit(EVENT_NAMES.QUEST_CHANGED, { ...quests });
  this.capabilities.markDirty();

  return { success: true, stage: nextStage };
}
```

3d. Replace `claimStageRewards()` — use capabilities:

```js
claimStageRewards(questId) {
  const questDef = this.questDefinitions[questId];
  const questState = this.getQuestState(questId);
  if (!questDef || !questState) {
    return { success: false, reason: 'Quest not found' };
  }

  const currentStage = questState.stage;
  const stageDef = questDef.stages.find((s) => s.stage === currentStage);
  if (!stageDef) {
    return { success: false, reason: 'Invalid stage' };
  }

  if ((questState.data._rewardsClaimedStage || 0) >= currentStage) {
    return { success: false, reason: 'Rewards already claimed' };
  }

  if (!this.checkObjectivesComplete(questId)) {
    return { success: false, reason: 'Objectives not complete' };
  }

  if (stageDef.rewards) {
    this._applyRewards(stageDef.rewards);
  }

  questState.data._rewardsClaimedStage = currentStage;
  const quests = this.capabilities.getOwnState();
  this.capabilities.emit(EVENT_NAMES.QUEST_CHANGED, { ...quests });
  this.capabilities.markDirty();

  return { success: true, stage: currentStage };
}
```

3e. Replace `_applyRewards()` — use capability callbacks for all cross-domain writes:

```js
_applyRewards(rewards) {
  if (rewards.credits) {
    const currentCredits = this.capabilities.getCredits();
    this.capabilities.updateCredits(currentCredits + rewards.credits);
    this.capabilities.updateStats('creditsEarned', rewards.credits);
  }

  if (rewards.rep) {
    for (const [npcId, amount] of Object.entries(rewards.rep)) {
      this.capabilities.modifyRepRaw(npcId, amount, 'quest_reward');
    }
  }

  if (rewards.karma) {
    this.capabilities.modifyKarma(rewards.karma, 'quest_reward');
  }

  if (rewards.engineRestore) {
    this.capabilities.setShipEngine(SHIP_CONFIG.CONDITION_BOUNDS.MAX);
  }

  if (rewards.upgrade) {
    this.capabilities.addShipUpgrade(rewards.upgrade);
  }
}
```

3f. Replace `updateQuestData()` — use capabilities:

```js
updateQuestData(questId, key, value) {
  const questState = this.getQuestState(questId);
  if (!questState) return;
  questState.data[key] = value;
  const quests = this.capabilities.getOwnState();
  this.capabilities.emit(EVENT_NAMES.QUEST_CHANGED, { ...quests });
  this.capabilities.markDirty();
}
```

3g. Replace `getUnmetRequirements()` — use capabilities:

```js
getUnmetRequirements(questId, stage) {
  const questDef = this.questDefinitions[questId];
  if (!questDef) return [];

  const stageDef = questDef.stages.find((s) => s.stage === stage);
  if (!stageDef?.requirements) return [];

  const reqs = stageDef.requirements;
  const unmet = [];

  if (reqs.npcRep) {
    const [npcId, threshold] = reqs.npcRep;
    const npcs = this.capabilities.getNpcs();
    const npcState = npcs[npcId];
    if (!npcState || npcState.rep < threshold) unmet.push('rep');
  }
  if (
    reqs.engineCondition != null &&
    this.capabilities.getShipEngine() < reqs.engineCondition
  )
    unmet.push('engine');
  if (
    reqs.hullCondition != null &&
    this.capabilities.getShipHull() < reqs.hullCondition
  )
    unmet.push('hull');
  if (reqs.debt != null && this.capabilities.getDebt() !== reqs.debt)
    unmet.push('debt');
  if (
    reqs.credits != null &&
    this.capabilities.getCredits() < reqs.credits
  )
    unmet.push('credits');

  return unmet;
}
```

3h. Replace `canContributeSupply()` — use capabilities:

```js
canContributeSupply() {
  if (this.capabilities.getCurrentSystem() !== ENDGAME_CONFIG.TANAKA_SYSTEM)
    return false;

  const narrativeFlags = this.capabilities.getNarrativeFlags();
  if (!narrativeFlags?.tanaka_met) return false;

  const questState = this.getQuestState('tanaka');
  if (questState?.data?.lastSupplyDay != null) {
    const daysSince =
      this.capabilities.getDaysElapsed() - questState.data.lastSupplyDay;
    if (daysSince < TANAKA_SUPPLY_CONFIG.COOLDOWN_DAYS) return false;
  }

  const cargo = this.capabilities.getShipCargo();
  for (const goodType of TANAKA_SUPPLY_CONFIG.GOODS) {
    const total = cargo
      .filter((c) => c.good === goodType)
      .reduce((sum, c) => sum + c.qty, 0);
    if (total >= TANAKA_SUPPLY_CONFIG.QUANTITY) return true;
  }

  return false;
}
```

3i. Replace `contributeSupply()` — use capabilities:

```js
contributeSupply() {
  if (!this.canContributeSupply()) {
    return { success: false, reason: 'Not eligible' };
  }

  const cargo = this.capabilities.getShipCargo();

  let goodToDonate = null;
  for (const goodType of TANAKA_SUPPLY_CONFIG.GOODS) {
    const total = cargo
      .filter((c) => c.good === goodType)
      .reduce((sum, c) => sum + c.qty, 0);
    if (total >= TANAKA_SUPPLY_CONFIG.QUANTITY) {
      goodToDonate = goodType;
      break;
    }
  }

  if (!goodToDonate) {
    return { success: false, reason: 'No qualifying cargo' };
  }

  this.capabilities.removeCargoForMission(
    goodToDonate,
    TANAKA_SUPPLY_CONFIG.QUANTITY
  );

  this.capabilities.modifyRepRaw(
    'tanaka_barnards',
    TANAKA_SUPPLY_CONFIG.REP_GAIN,
    'tanaka_supply'
  );

  const questState = this.getQuestState('tanaka');
  questState.data.lastSupplyDay = this.capabilities.getDaysElapsed();

  const quests = this.capabilities.getOwnState();
  this.capabilities.emit(EVENT_NAMES.QUEST_CHANGED, { ...quests });
  this.capabilities.markDirty();

  return { success: true, goodDonated: goodToDonate };
}
```

3j. Replace `onJump()` — use capabilities for emit:

```js
onJump() {
  for (const questId of Object.keys(this.questDefinitions)) {
    const questState = this.getQuestState(questId);
    if (!questState || questState.stage === 0) continue;

    const stageDef = this.questDefinitions[questId].stages.find(
      (s) => s.stage === questState.stage
    );
    if (stageDef?.objectives?.jumpsCompleted != null) {
      questState.data.jumpsCompleted =
        (questState.data.jumpsCompleted || 0) + 1;
      const quests = this.capabilities.getOwnState();
      this.capabilities.emit(EVENT_NAMES.QUEST_CHANGED, { ...quests });
    }
  }
}
```

3k. Replace `onDock()` — use `this.capabilities.starData` and capabilities:

```js
onDock(systemId, rngFn = Math.random) {
  const tanakaState = this.getQuestState('tanaka');
  if (!tanakaState || tanakaState.stage !== 2) return;

  const starData = this.capabilities.starData;
  const system = starData.find((s) => s.id === systemId);
  const sol = starData.find((s) => s.id === 0);
  if (!system || !sol) return;

  const distance = Math.sqrt(
    (system.x - sol.x) ** 2 +
      (system.y - sol.y) ** 2 +
      (system.z - sol.z) ** 2
  );
  if (distance < ENDGAME_CONFIG.STAGE_2_EXOTIC_DISTANCE) return;

  if (!tanakaState.data.exoticStations) tanakaState.data.exoticStations = [];
  if (tanakaState.data.exoticStations.includes(systemId)) return;

  if (rngFn() >= ENDGAME_CONFIG.STAGE_2_EXOTIC_CHANCE) return;

  tanakaState.data.exoticStations.push(systemId);
  tanakaState.data.exoticMaterials =
    (tanakaState.data.exoticMaterials || 0) + 1;
  const quests = this.capabilities.getOwnState();
  this.capabilities.emit(EVENT_NAMES.QUEST_CHANGED, { ...quests });
  this.capabilities.markDirty();
}
```

**No changes needed** to `registerQuest()`, `getQuestDefinition()`, `hasClaimedStageRewards()`, `isQuestComplete()`, `getActiveQuests()`, `getQuestStage()`, `canStartStage()`, `checkObjectivesComplete()` — these only use `this.questDefinitions` (local) and `this.getQuestState()` (already updated).

Wait — `registerQuest` calls `this.getQuestState()` which now uses capabilities, so it's fine. And `canStartStage` calls `this.getUnmetRequirements()` which is updated above.

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass. Quest tests use `createTestGameStateManager()` which goes through the full pipeline.

**Step 5: Commit**

```
git add src/game/state/capabilities.js src/game/state/managers/quest-manager.js src/game/state/game-coordinator.js
git commit -m "Migrate QuestManager to capability injection"
```

---

### Task 4: Update design doc, format, and final verification

**Files:**
- Modify: `docs/plans/2026-03-08-gsm-refactor-design.md`

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass.

**Step 2: Run lint and format**

Run: `npm run clean`
Expected: No lint or format errors. Fix any that appear.

**Step 3: Update design doc**

In `docs/plans/2026-03-08-gsm-refactor-design.md`, update the Phase 3 Batch 2 row:

```
| Phase 3 Batch 2 | `2026-03-08-gsm-phase3-batch2-implementation.md` | Complete |
```

**Step 4: Commit**

```
git add docs/plans/2026-03-08-gsm-refactor-design.md
git commit -m "Mark Phase 3 Batch 2 complete and apply formatting"
```

---

## Key Risks and Mitigations

1. **AchievementsManager's `resolveStatPath` arbitrary traversal:** The current implementation walks any dotted path on the full state object. The migrated version must route each known prefix to the correct capability getter. **Read `src/game/data/achievements-data.js`** to verify all stat paths are covered. If any paths are missed, the achievement will silently never progress (returns 0).

2. **QuestManager event subscriptions:** The constructor subscribes to JUMP_COMPLETED and DOCKED events. The capability object must include a `subscribe` callback. This is different from Batch 1 managers which had no event subscriptions.

3. **DialogueManager's coordinator coupling:** The dialogue engine (`game-dialogue.js`) expects the full coordinator/GSM instance. We pass it through as `coordinatorRef` in capabilities. This is a documented temporary coupling.

4. **QuestManager's direct ship mutations in `_applyRewards`:** The current code directly sets `state.ship.engine` and pushes to `state.ship.upgrades`. These become `setShipEngine` and `addShipUpgrade` callbacks on the coordinator that also emit the proper events.

5. **Test compatibility:** Achievement tests use `new GameStateManager(STAR_DATA, WORMHOLE_DATA)` (direct instantiation). Quest tests use `createTestGameStateManager()`. Both go through GSM → Coordinator → capability pipeline, so no test changes should be needed. If any test directly instantiates AchievementsManager or QuestManager with a mock GSM object, it will need updating to pass a capability object instead.
