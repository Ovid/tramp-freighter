# Achievements & Stats System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an Achievements & Stats panel accessible from the gear menu, with continuous achievement checking, toast notifications on unlock, and display of previously hidden stats like faction reputation.

**Architecture:** New `AchievementsManager` extends `BaseManager`, subscribes to game events, evaluates achievements reactively, and emits unlock events. Achievement definitions live in `src/game/data/achievements-data.js` with all thresholds in `constants.js`. UI is a modal overlay triggered from the gear menu, with a toast component for unlock notifications. Existing `useNotification` hook provides the toast pattern.

**Tech Stack:** React 18, Vitest, existing Bridge Pattern hooks (`useGameEvent`, `useGameAction`), existing `Modal` component, existing CSS variable system.

---

### Task 1: Add Achievement Constants to constants.js

**Files:**
- Modify: `src/game/constants.js:1722` (before closing of EVENT_NAMES, and after EVENT_NAMES block)

**Step 1: Write the failing test**

Create test file:
- Create: `tests/unit/achievements.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENTS_CONFIG,
  EVENT_NAMES,
} from '../../src/game/constants.js';

describe('Achievement Constants', () => {
  it('should define achievement tier thresholds for all categories', () => {
    const categories = ['EXPLORATION', 'TRADING', 'SOCIAL', 'SURVIVAL', 'DANGER', 'MORAL'];
    for (const category of categories) {
      expect(ACHIEVEMENTS_CONFIG.THRESHOLDS[`${category}_TIER_1`]).toBeGreaterThan(0);
      expect(ACHIEVEMENTS_CONFIG.THRESHOLDS[`${category}_TIER_2`]).toBeGreaterThan(
        ACHIEVEMENTS_CONFIG.THRESHOLDS[`${category}_TIER_1`]
      );
      expect(ACHIEVEMENTS_CONFIG.THRESHOLDS[`${category}_TIER_3`]).toBeGreaterThan(
        ACHIEVEMENTS_CONFIG.THRESHOLDS[`${category}_TIER_2`]
      );
      expect(ACHIEVEMENTS_CONFIG.THRESHOLDS[`${category}_TIER_4`]).toBeGreaterThan(
        ACHIEVEMENTS_CONFIG.THRESHOLDS[`${category}_TIER_3`]
      );
    }
  });

  it('should define achievement event names', () => {
    expect(EVENT_NAMES.ACHIEVEMENT_UNLOCKED).toBe('achievementUnlocked');
    expect(EVENT_NAMES.ACHIEVEMENTS_CHANGED).toBe('achievementsChanged');
  });

  it('should define karma label thresholds', () => {
    expect(ACHIEVEMENTS_CONFIG.KARMA_LABELS).toBeDefined();
    expect(ACHIEVEMENTS_CONFIG.KARMA_LABELS.length).toBeGreaterThan(0);
    // Labels should be sorted by threshold descending
    for (let i = 0; i < ACHIEVEMENTS_CONFIG.KARMA_LABELS.length - 1; i++) {
      expect(ACHIEVEMENTS_CONFIG.KARMA_LABELS[i].min).toBeGreaterThan(
        ACHIEVEMENTS_CONFIG.KARMA_LABELS[i + 1].min
      );
    }
  });

  it('should define faction standing labels', () => {
    expect(ACHIEVEMENTS_CONFIG.FACTION_LABELS).toBeDefined();
    expect(ACHIEVEMENTS_CONFIG.FACTION_LABELS.length).toBeGreaterThan(0);
  });

  it('should define toast display duration', () => {
    expect(ACHIEVEMENTS_CONFIG.TOAST_DURATION).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/achievements.test.js`
Expected: FAIL — `ACHIEVEMENTS_CONFIG` is not exported

**Step 3: Write minimal implementation**

Add to `src/game/constants.js` before the `EVENT_NAMES` block (before line 1660):

```javascript
/**
 * Achievements System Configuration
 *
 * Defines achievement tier thresholds, karma/faction labels, and toast timing.
 * All numeric thresholds are centralized here — never hard-code in other files.
 */
export const ACHIEVEMENTS_CONFIG = {
  THRESHOLDS: {
    // Exploration: systems visited (max reachable = 47 via wormholes + 1 Delta Pavonis quest)
    EXPLORATION_TIER_1: 5,
    EXPLORATION_TIER_2: 15,
    EXPLORATION_TIER_3: 30,
    EXPLORATION_TIER_4: 48,

    // Trading: credits earned lifetime
    TRADING_TIER_1: 5000,
    TRADING_TIER_2: 25000,
    TRADING_TIER_3: 100000,
    TRADING_TIER_4: 500000,

    // Social: count of NPCs at Trusted tier or above
    SOCIAL_TIER_1: 1,
    SOCIAL_TIER_2: 3,
    SOCIAL_TIER_3: 5,
    SOCIAL_TIER_4: 8,

    // Survival: jumps completed
    SURVIVAL_TIER_1: 10,
    SURVIVAL_TIER_2: 50,
    SURVIVAL_TIER_3: 150,
    SURVIVAL_TIER_4: 300,

    // Danger: total danger encounters resolved (sum of all dangerFlags)
    DANGER_TIER_1: 3,
    DANGER_TIER_2: 10,
    DANGER_TIER_3: 25,
    DANGER_TIER_4: 50,

    // Moral: karma thresholds (absolute value — works for both good and evil)
    MORAL_TIER_1: 15,
    MORAL_TIER_2: 35,
    MORAL_TIER_3: 60,
    MORAL_TIER_4: 85,
  },

  // Karma display labels (evaluated top-to-bottom, first match wins)
  KARMA_LABELS: [
    { min: 75, label: 'Saint' },
    { min: 50, label: 'Virtuous' },
    { min: 25, label: 'Decent' },
    { min: -24, label: 'Neutral' },
    { min: -49, label: 'Shady' },
    { min: -74, label: 'Ruthless' },
    { min: -100, label: 'Villain' },
  ],

  // Faction standing labels (evaluated top-to-bottom, first match wins)
  FACTION_LABELS: [
    { min: 75, label: 'Allied' },
    { min: 50, label: 'Respected' },
    { min: 25, label: 'Favorable' },
    { min: -24, label: 'Neutral' },
    { min: -49, label: 'Suspicious' },
    { min: -74, label: 'Hostile' },
    { min: -100, label: 'Enemy' },
  ],

  TOAST_DURATION: 4000,
};
```

Add two new entries inside the `EVENT_NAMES` object (before the closing `});`):

```javascript
  // Achievements
  ACHIEVEMENT_UNLOCKED: 'achievementUnlocked',
  ACHIEVEMENTS_CHANGED: 'achievementsChanged',
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/achievements.test.js`
Expected: PASS

**Step 5: Commit**

```
git add src/game/constants.js tests/unit/achievements.test.js
git commit -m "Add achievement constants and event names"
```

---

### Task 2: Create Achievement Definitions Data

**Files:**
- Create: `src/game/data/achievements-data.js`
- Modify: `tests/unit/achievements.test.js`

**Step 1: Write the failing test**

Add to `tests/unit/achievements.test.js`:

```javascript
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../../src/game/data/achievements-data.js';

describe('Achievement Definitions', () => {
  it('should define exactly 24 achievements (6 categories x 4 tiers)', () => {
    expect(ACHIEVEMENTS.length).toBe(24);
  });

  it('should have 4 tiers per category', () => {
    for (const category of ACHIEVEMENT_CATEGORIES) {
      const categoryAchievements = ACHIEVEMENTS.filter((a) => a.category === category);
      expect(categoryAchievements.length).toBe(4);
      const tiers = categoryAchievements.map((a) => a.tier).sort();
      expect(tiers).toEqual([1, 2, 3, 4]);
    }
  });

  it('should have required fields on every achievement', () => {
    for (const achievement of ACHIEVEMENTS) {
      expect(achievement.id).toBeTruthy();
      expect(achievement.name).toBeTruthy();
      expect(achievement.description).toBeTruthy();
      expect(achievement.category).toBeTruthy();
      expect(achievement.tier).toBeGreaterThanOrEqual(1);
      expect(achievement.tier).toBeLessThanOrEqual(4);
      expect(achievement.target).toBeGreaterThan(0);
      expect(achievement.statPath).toBeTruthy();
    }
  });

  it('should have unique IDs', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have increasing targets within each category', () => {
    for (const category of ACHIEVEMENT_CATEGORIES) {
      const sorted = ACHIEVEMENTS
        .filter((a) => a.category === category)
        .sort((a, b) => a.tier - b.tier);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].target).toBeGreaterThan(sorted[i - 1].target);
      }
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/achievements.test.js`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/game/data/achievements-data.js`:

```javascript
import { ACHIEVEMENTS_CONFIG } from '../constants.js';

const T = ACHIEVEMENTS_CONFIG.THRESHOLDS;

export const ACHIEVEMENT_CATEGORIES = [
  'exploration',
  'trading',
  'social',
  'survival',
  'danger',
  'moral',
];

export const ACHIEVEMENTS = [
  // Exploration: systems visited
  {
    id: 'exploration_1',
    name: 'First Steps',
    description: 'Visit 5 star systems',
    category: 'exploration',
    tier: 1,
    target: T.EXPLORATION_TIER_1,
    statPath: 'world.visitedSystems.length',
  },
  {
    id: 'exploration_2',
    name: 'Pathfinder',
    description: 'Visit 15 star systems',
    category: 'exploration',
    tier: 2,
    target: T.EXPLORATION_TIER_2,
    statPath: 'world.visitedSystems.length',
  },
  {
    id: 'exploration_3',
    name: 'Star Mapper',
    description: 'Visit 30 star systems',
    category: 'exploration',
    tier: 3,
    target: T.EXPLORATION_TIER_3,
    statPath: 'world.visitedSystems.length',
  },
  {
    id: 'exploration_4',
    name: 'Galaxy Wanderer',
    description: 'Visit every reachable star system',
    category: 'exploration',
    tier: 4,
    target: T.EXPLORATION_TIER_4,
    statPath: 'world.visitedSystems.length',
  },

  // Trading: credits earned
  {
    id: 'trading_1',
    name: 'Petty Cash',
    description: 'Earn 5,000 credits from trading',
    category: 'trading',
    tier: 1,
    target: T.TRADING_TIER_1,
    statPath: 'stats.creditsEarned',
  },
  {
    id: 'trading_2',
    name: 'Merchant',
    description: 'Earn 25,000 credits from trading',
    category: 'trading',
    tier: 2,
    target: T.TRADING_TIER_2,
    statPath: 'stats.creditsEarned',
  },
  {
    id: 'trading_3',
    name: 'Trade Baron',
    description: 'Earn 100,000 credits from trading',
    category: 'trading',
    tier: 3,
    target: T.TRADING_TIER_3,
    statPath: 'stats.creditsEarned',
  },
  {
    id: 'trading_4',
    name: 'Tycoon',
    description: 'Earn 500,000 credits from trading',
    category: 'trading',
    tier: 4,
    target: T.TRADING_TIER_4,
    statPath: 'stats.creditsEarned',
  },

  // Social: trusted NPCs (rep >= TRUSTED_MIN)
  {
    id: 'social_1',
    name: 'First Friend',
    description: 'Earn Trusted status with 1 NPC',
    category: 'social',
    tier: 1,
    target: T.SOCIAL_TIER_1,
    statPath: 'computed.trustedNPCCount',
  },
  {
    id: 'social_2',
    name: 'Inner Circle',
    description: 'Earn Trusted status with 3 NPCs',
    category: 'social',
    tier: 2,
    target: T.SOCIAL_TIER_2,
    statPath: 'computed.trustedNPCCount',
  },
  {
    id: 'social_3',
    name: 'Networker',
    description: 'Earn Trusted status with 5 NPCs',
    category: 'social',
    tier: 3,
    target: T.SOCIAL_TIER_3,
    statPath: 'computed.trustedNPCCount',
  },
  {
    id: 'social_4',
    name: 'Beloved',
    description: 'Earn Trusted status with 8 NPCs',
    category: 'social',
    tier: 4,
    target: T.SOCIAL_TIER_4,
    statPath: 'computed.trustedNPCCount',
  },

  // Survival: jumps completed
  {
    id: 'survival_1',
    name: 'Rookie Pilot',
    description: 'Complete 10 jumps',
    category: 'survival',
    tier: 1,
    target: T.SURVIVAL_TIER_1,
    statPath: 'stats.jumpsCompleted',
  },
  {
    id: 'survival_2',
    name: 'Seasoned Captain',
    description: 'Complete 50 jumps',
    category: 'survival',
    tier: 2,
    target: T.SURVIVAL_TIER_2,
    statPath: 'stats.jumpsCompleted',
  },
  {
    id: 'survival_3',
    name: 'Wormhole Veteran',
    description: 'Complete 150 jumps',
    category: 'survival',
    tier: 3,
    target: T.SURVIVAL_TIER_3,
    statPath: 'stats.jumpsCompleted',
  },
  {
    id: 'survival_4',
    name: 'Void Walker',
    description: 'Complete 300 jumps',
    category: 'survival',
    tier: 4,
    target: T.SURVIVAL_TIER_4,
    statPath: 'stats.jumpsCompleted',
  },

  // Danger: total danger encounters resolved
  {
    id: 'danger_1',
    name: 'Survivor',
    description: 'Resolve 3 danger encounters',
    category: 'danger',
    tier: 1,
    target: T.DANGER_TIER_1,
    statPath: 'computed.totalDangerEncounters',
  },
  {
    id: 'danger_2',
    name: 'Battle-Scarred',
    description: 'Resolve 10 danger encounters',
    category: 'danger',
    tier: 2,
    target: T.DANGER_TIER_2,
    statPath: 'computed.totalDangerEncounters',
  },
  {
    id: 'danger_3',
    name: 'Hardened',
    description: 'Resolve 25 danger encounters',
    category: 'danger',
    tier: 3,
    target: T.DANGER_TIER_3,
    statPath: 'computed.totalDangerEncounters',
  },
  {
    id: 'danger_4',
    name: 'Unkillable',
    description: 'Resolve 50 danger encounters',
    category: 'danger',
    tier: 4,
    target: T.DANGER_TIER_4,
    statPath: 'computed.totalDangerEncounters',
  },

  // Moral: karma absolute value (works for both saint and villain paths)
  {
    id: 'moral_1',
    name: 'Picking Sides',
    description: 'Reach karma magnitude of 15',
    category: 'moral',
    tier: 1,
    target: T.MORAL_TIER_1,
    statPath: 'computed.karmaAbsolute',
  },
  {
    id: 'moral_2',
    name: 'Committed',
    description: 'Reach karma magnitude of 35',
    category: 'moral',
    tier: 2,
    target: T.MORAL_TIER_2,
    statPath: 'computed.karmaAbsolute',
  },
  {
    id: 'moral_3',
    name: 'True Believer',
    description: 'Reach karma magnitude of 60',
    category: 'moral',
    tier: 3,
    target: T.MORAL_TIER_3,
    statPath: 'computed.karmaAbsolute',
  },
  {
    id: 'moral_4',
    name: 'Legend',
    description: 'Reach karma magnitude of 85',
    category: 'moral',
    tier: 4,
    target: T.MORAL_TIER_4,
    statPath: 'computed.karmaAbsolute',
  },
];
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/achievements.test.js`
Expected: PASS

**Step 5: Commit**

```
git add src/game/data/achievements-data.js tests/unit/achievements.test.js
git commit -m "Add achievement definitions data"
```

---

### Task 3: Achievement Target Validation Tests

These tests verify that hardcoded achievement targets are actually achievable given the game data. This is the safety net from the design.

**Files:**
- Modify: `tests/unit/achievements.test.js`

**Step 1: Write the failing tests (they should pass immediately since targets are correct)**

Add to `tests/unit/achievements.test.js`:

```javascript
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { starData } from '../../src/game/data/star-data.js';
import { wormholeData } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { SOL_SYSTEM_ID } from '../../src/game/constants.js';

describe('Achievement Target Validation', () => {
  it('exploration tier 4 target should equal reachable systems from Sol + 1 (Delta Pavonis)', () => {
    const nav = new NavigationSystem(starData, wormholeData);
    const reachable = new Set();
    const queue = [SOL_SYSTEM_ID];
    reachable.add(SOL_SYSTEM_ID);

    while (queue.length > 0) {
      const current = queue.shift();
      const connected = nav.getConnectedSystems(current);
      for (const systemId of connected) {
        if (!reachable.has(systemId)) {
          reachable.add(systemId);
          queue.push(systemId);
        }
      }
    }

    // 47 reachable via wormholes + 1 Delta Pavonis (endgame quest)
    expect(ACHIEVEMENTS_CONFIG.THRESHOLDS.EXPLORATION_TIER_4).toBe(reachable.size + 1);
  });

  it('social tier 4 target should not exceed total NPC count', () => {
    expect(ACHIEVEMENTS_CONFIG.THRESHOLDS.SOCIAL_TIER_4).toBeLessThanOrEqual(ALL_NPCS.length);
  });

  it('moral tier 4 target should not exceed karma bounds', () => {
    expect(ACHIEVEMENTS_CONFIG.THRESHOLDS.MORAL_TIER_4).toBeLessThanOrEqual(
      KARMA_CONFIG.MAX
    );
  });

  it('every statPath should reference a resolvable game state field or computed value', () => {
    const validRoots = ['world', 'stats', 'player', 'computed'];
    for (const achievement of ACHIEVEMENTS) {
      const root = achievement.statPath.split('.')[0];
      expect(validRoots).toContain(root);
    }
  });
});
```

Note: Import `KARMA_CONFIG` from constants at the top of the file.

**Step 2: Run tests to verify they pass**

Run: `npm test -- tests/unit/achievements.test.js`
Expected: PASS — these are validation tests, not TDD red-green tests. If any fail, the constants need adjusting.

**Step 3: Commit**

```
git add tests/unit/achievements.test.js
git commit -m "Add achievement target validation tests"
```

---

### Task 4: Create AchievementsManager

**Files:**
- Create: `src/game/state/managers/achievements.js`
- Modify: `tests/unit/achievements.test.js`

**Step 1: Write the failing test**

Add to `tests/unit/achievements.test.js`:

```javascript
import { GameStateManager } from '../../src/game/state/game-state-manager.js';

describe('AchievementsManager', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(starData, wormholeData);
    manager.initNewGame();
  });

  it('should initialize with empty achievements state', () => {
    expect(manager.state.achievements).toEqual({});
  });

  it('should resolve simple statPath from game state', () => {
    const value = manager.achievementsManager.resolveStatPath('stats.jumpsCompleted');
    expect(value).toBe(0);
  });

  it('should resolve computed.trustedNPCCount', () => {
    const value = manager.achievementsManager.resolveStatPath('computed.trustedNPCCount');
    expect(value).toBe(0);
  });

  it('should resolve computed.totalDangerEncounters', () => {
    const value = manager.achievementsManager.resolveStatPath('computed.totalDangerEncounters');
    expect(value).toBe(0);
  });

  it('should resolve computed.karmaAbsolute', () => {
    manager.state.player.karma = -42;
    const value = manager.achievementsManager.resolveStatPath('computed.karmaAbsolute');
    expect(value).toBe(42);
  });

  it('should unlock an achievement when target is met', () => {
    manager.state.stats.jumpsCompleted = 10;
    manager.achievementsManager.checkAchievements();
    expect(manager.state.achievements['survival_1']).toBeDefined();
    expect(manager.state.achievements['survival_1'].unlocked).toBe(true);
  });

  it('should not re-unlock an already unlocked achievement', () => {
    manager.state.stats.jumpsCompleted = 10;
    manager.achievementsManager.checkAchievements();
    const firstDay = manager.state.achievements['survival_1'].unlockedOnDay;

    manager.state.player.daysElapsed = 50;
    manager.achievementsManager.checkAchievements();
    expect(manager.state.achievements['survival_1'].unlockedOnDay).toBe(firstDay);
  });

  it('should emit achievementUnlocked event on unlock', () => {
    const unlocked = [];
    manager.subscribe('achievementUnlocked', (data) => unlocked.push(data));

    manager.state.stats.jumpsCompleted = 10;
    manager.achievementsManager.checkAchievements();

    expect(unlocked.length).toBe(1);
    expect(unlocked[0].id).toBe('survival_1');
  });

  it('should emit achievementsChanged event on unlock', () => {
    let changed = false;
    manager.subscribe('achievementsChanged', () => { changed = true; });

    manager.state.stats.jumpsCompleted = 10;
    manager.achievementsManager.checkAchievements();

    expect(changed).toBe(true);
  });

  it('should not emit events when no achievements unlock', () => {
    let emitted = false;
    manager.subscribe('achievementUnlocked', () => { emitted = true; });

    manager.achievementsManager.checkAchievements();
    expect(emitted).toBe(false);
  });

  it('should return progress for all achievements', () => {
    manager.state.stats.jumpsCompleted = 7;
    const progress = manager.achievementsManager.getProgress();

    const survival1 = progress.find((p) => p.id === 'survival_1');
    expect(survival1.current).toBe(7);
    expect(survival1.target).toBe(10);
    expect(survival1.unlocked).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/achievements.test.js`
Expected: FAIL — `achievementsManager` is not defined

**Step 3: Write minimal implementation**

Create `src/game/state/managers/achievements.js`:

```javascript
import { BaseManager } from './base-manager.js';
import { ACHIEVEMENTS } from '../../data/achievements-data.js';
import { EVENT_NAMES, REPUTATION_BOUNDS } from '../../constants.js';

/**
 * AchievementsManager - Tracks and evaluates achievement progress
 *
 * Responsibilities:
 * - Resolve stat paths from game state (including computed values)
 * - Check achievements against current game state
 * - Emit events on unlock for UI notifications
 * - Provide progress data for the achievements panel
 */
export class AchievementsManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

  /**
   * Resolve a dot-notation stat path to its current value from game state.
   * Handles both direct paths (e.g., 'stats.jumpsCompleted') and
   * computed paths (e.g., 'computed.trustedNPCCount').
   *
   * @param {string} statPath - Dot-notation path
   * @returns {number} Current value
   */
  resolveStatPath(statPath) {
    const state = this.getState();

    if (statPath.startsWith('computed.')) {
      return this._resolveComputed(statPath, state);
    }

    const parts = statPath.split('.');
    let value = state;
    for (const part of parts) {
      if (value == null) return 0;
      value = value[part];
    }
    return typeof value === 'number' ? value : (value ?? 0);
  }

  /**
   * Resolve computed stat paths that derive from multiple state fields.
   *
   * @param {string} statPath - Computed path
   * @param {Object} state - Current game state
   * @returns {number} Computed value
   * @private
   */
  _resolveComputed(statPath, state) {
    switch (statPath) {
      case 'computed.trustedNPCCount':
        return Object.values(state.npcs || {}).filter(
          (npc) => npc.rep >= REPUTATION_BOUNDS.TRUSTED_MIN
        ).length;

      case 'computed.totalDangerEncounters': {
        const flags = state.world?.dangerFlags || {};
        return Object.values(flags).reduce((sum, val) => sum + val, 0);
      }

      case 'computed.karmaAbsolute':
        return Math.abs(state.player?.karma ?? 0);

      default:
        this.warn(`Unknown computed stat path: ${statPath}`);
        return 0;
    }
  }

  /**
   * Check all achievements against current game state.
   * Unlocks any achievements whose targets are met.
   * Emits events for each newly unlocked achievement.
   */
  checkAchievements() {
    const state = this.getState();
    if (!state.achievements) {
      state.achievements = {};
    }

    let anyUnlocked = false;

    for (const achievement of ACHIEVEMENTS) {
      if (state.achievements[achievement.id]) continue;

      const current = this.resolveStatPath(achievement.statPath);
      if (current >= achievement.target) {
        state.achievements[achievement.id] = {
          unlocked: true,
          unlockedOnDay: state.player.daysElapsed,
        };
        anyUnlocked = true;

        this.emit(EVENT_NAMES.ACHIEVEMENT_UNLOCKED, {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          category: achievement.category,
          tier: achievement.tier,
        });
      }
    }

    if (anyUnlocked) {
      this.emit(EVENT_NAMES.ACHIEVEMENTS_CHANGED, { ...state.achievements });
      this.gameStateManager.markDirty();
    }
  }

  /**
   * Get progress for all achievements.
   *
   * @returns {Array<Object>} Achievement progress objects
   */
  getProgress() {
    const state = this.getState();
    return ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      current: this.resolveStatPath(achievement.statPath),
      unlocked: !!state.achievements?.[achievement.id],
      unlockedOnDay: state.achievements?.[achievement.id]?.unlockedOnDay ?? null,
    }));
  }
}
```

**Step 4: Register the manager in GameStateManager**

Modify `src/game/state/game-state-manager.js`:

- Add import at line ~27 (with other manager imports):
  ```javascript
  import { AchievementsManager } from './managers/achievements.js';
  ```

- Add instantiation at line ~125 (after `this.debtManager`):
  ```javascript
  this.achievementsManager = new AchievementsManager(this);
  ```

**Step 5: Add achievements to initial state**

Modify `src/game/state/managers/initialization.js` line 67 — add `achievements: {},` after `smugglingRuns` line in the stats block. Actually, add it as a top-level state property after `quests: {}`:

Change lines 68-69 from:
```javascript
      quests: {},
      meta: metaState,
```
to:
```javascript
      quests: {},
      achievements: {},
      meta: metaState,
```

**Step 6: Run test to verify it passes**

Run: `npm test -- tests/unit/achievements.test.js`
Expected: PASS

**Step 7: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 8: Commit**

```
git add src/game/state/managers/achievements.js src/game/state/game-state-manager.js src/game/state/managers/initialization.js tests/unit/achievements.test.js
git commit -m "Add AchievementsManager with stat resolution and unlock logic"
```

---

### Task 5: Add Save Compatibility for Achievements

**Files:**
- Modify: `src/game/state/state-validators.js`
- Modify: `tests/unit/achievements.test.js`

**Step 1: Write the failing test**

Add to `tests/unit/achievements.test.js`:

```javascript
import { addStateDefaults } from '../../src/game/state/state-validators.js';

describe('Save Compatibility', () => {
  it('should add achievements field to old saves missing it', () => {
    const oldState = {
      player: { credits: 100, karma: 0, factions: {}, daysElapsed: 5 },
      ship: { cargo: [], hiddenCargo: [] },
      world: { visitedSystems: [], dangerFlags: {}, narrativeEvents: { fired: [], cooldowns: {}, flags: {}, dockedSystems: [] } },
      npcs: {},
      missions: { active: [], completed: [], failed: [], board: [], boardLastRefresh: 0 },
      stats: { creditsEarned: 0, jumpsCompleted: 0, cargoHauled: 0, charitableActs: 0 },
      quests: {},
      meta: { version: '5.0.0' },
    };

    const migrated = addStateDefaults(oldState, starData);
    expect(migrated.achievements).toEqual({});
  });

  it('should preserve existing achievements on load', () => {
    const stateWithAchievements = {
      player: { credits: 100, karma: 0, factions: {}, daysElapsed: 5 },
      ship: { cargo: [], hiddenCargo: [] },
      world: { visitedSystems: [], dangerFlags: {}, narrativeEvents: { fired: [], cooldowns: {}, flags: {}, dockedSystems: [] } },
      npcs: {},
      missions: { active: [], completed: [], failed: [], board: [], boardLastRefresh: 0 },
      stats: { creditsEarned: 0, jumpsCompleted: 0, cargoHauled: 0, charitableActs: 0 },
      quests: {},
      achievements: { survival_1: { unlocked: true, unlockedOnDay: 10 } },
      meta: { version: '5.0.0' },
    };

    const migrated = addStateDefaults(stateWithAchievements, starData);
    expect(migrated.achievements.survival_1.unlocked).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/achievements.test.js`
Expected: FAIL — `addStateDefaults` doesn't add achievements field

**Step 3: Write minimal implementation**

Add to `addStateDefaults()` in `src/game/state/state-validators.js` (after the `state.quests` block around line 876):

```javascript
  // Initialize achievements tracking if missing (pre-achievements saves)
  if (!state.achievements) {
    state.achievements = {};
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/achievements.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 6: Commit**

```
git add src/game/state/state-validators.js tests/unit/achievements.test.js
git commit -m "Add achievements save compatibility in state defaults"
```

---

### Task 6: Wire Achievement Checks to Game Events

The `AchievementsManager.checkAchievements()` method needs to be called reactively when relevant game state changes. Rather than subscribing to events internally (which would require careful lifecycle management), we call it from the existing manager methods that already mutate state.

**Files:**
- Modify: `src/game/state/managers/navigation.js` (after jump)
- Modify: `src/game/state/managers/trading.js` (after sale)
- Modify: `src/game/state/managers/danger.js` (after encounter resolution, karma change)
- Modify: `src/game/state/managers/npc.js` (after rep change)
- Modify: `tests/unit/achievements.test.js`

**Step 1: Write the failing test**

Add to `tests/unit/achievements.test.js`:

```javascript
describe('Achievement Event Integration', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateManager(starData, wormholeData);
    manager.initNewGame();
  });

  it('should check achievements after jump completion', () => {
    const unlocked = [];
    manager.subscribe('achievementUnlocked', (data) => unlocked.push(data));

    // Simulate enough jumps to trigger tier 1
    manager.state.stats.jumpsCompleted = 9;
    // The next jump should trigger the check
    manager.state.world.visitedSystems = [0];
    // Find a connected system to jump to
    const nav = new NavigationSystem(starData, wormholeData);
    const connected = nav.getConnectedSystems(0);
    manager.navigationManager.updateLocation(connected[0]);

    expect(unlocked.some((a) => a.id === 'survival_1')).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/achievements.test.js`
Expected: FAIL — no achievement check happens after jump

**Step 3: Write minimal implementation**

Add `this.gameStateManager.achievementsManager.checkAchievements();` call in these locations:

1. **`src/game/state/managers/navigation.js`** — In the `updateLocation()` method, after incrementing `jumpsCompleted` and emitting location events.

2. **`src/game/state/managers/trading.js`** — In the `sellGood()` method, after updating `stats.creditsEarned` and `stats.cargoHauled`.

3. **`src/game/state/managers/danger.js`** — In the `modifyKarma()` method, after updating karma. Also after incrementing danger flags (in `incrementDangerFlag()`).

4. **`src/game/state/managers/npc.js`** — In the `modifyRep()` method, after updating NPC reputation.

Each addition is a single line: `this.gameStateManager.achievementsManager.checkAchievements();`

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/achievements.test.js`
Expected: PASS

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 6: Commit**

```
git add src/game/state/managers/navigation.js src/game/state/managers/trading.js src/game/state/managers/danger.js src/game/state/managers/npc.js tests/unit/achievements.test.js
git commit -m "Wire achievement checks to game events"
```

---

### Task 7: Remove smugglingRuns Dead Code

**Files:**
- Modify: `src/game/state/managers/initialization.js:65`
- Modify: `src/game/data/epilogue-data.js:43,110-112`
- Modify: `src/game/state/state-validators.js:868`
- Modify: `tests/unit/epilogue.test.js` (remove smugglingRuns from test fixtures)
- Modify: `tests/unit/quest-manager.test.js:18` (remove assertion)

**Step 1: Remove `smugglingRuns` from initial state**

In `src/game/state/managers/initialization.js`, remove line 65:
```javascript
        smugglingRuns: 0,
```

**Step 2: Remove smugglingRuns from epilogue data**

In `src/game/data/epilogue-data.js`:
- Remove the variant at lines 43-45 (the `condition: { smugglingRuns: 5 }` block)
- Remove the condition check at lines 110-113

**Step 3: Remove from state-validators.js**

In `src/game/state/state-validators.js`, remove line 868:
```javascript
      smugglingRuns: 0,
```

**Step 4: Update test fixtures**

In `tests/unit/epilogue.test.js`, remove `smugglingRuns: 0` from test fixtures.

In `tests/unit/quest-manager.test.js`, remove the assertion at line 18 that checks `smugglingRuns`.

**Step 5: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 6: Commit**

```
git add src/game/state/managers/initialization.js src/game/data/epilogue-data.js src/game/state/state-validators.js tests/unit/epilogue.test.js tests/unit/quest-manager.test.js
git commit -m "Remove dead smugglingRuns code"
```

---

### Task 8: Create StatsSection Component

**Files:**
- Create: `src/features/achievements/StatsSection.jsx`
- Create: `css/panel/achievements.css`

**Step 1: Write the failing test**

Create: `tests/unit/achievements-ui.test.js`

```javascript
import { describe, it, expect, vi } from 'vitest';

describe('StatsSection Utility Functions', () => {
  it('should be tested in Task 8', () => {
    // Placeholder - actual UI tests will use component rendering
    expect(true).toBe(true);
  });
});
```

Note: For React component tests, we rely on integration testing via the browser. The key testable logic (label resolution, stat computation) lives in the manager. The component is a thin display layer.

**Step 2: Write implementation**

Create `src/features/achievements/StatsSection.jsx`:

```javascript
import { useGameEvent } from '../../hooks/useGameEvent';
import { ACHIEVEMENTS_CONFIG, FACTION_CONFIG } from '../../game/constants';

/**
 * Get karma label from numeric value
 * @param {number} karma - Current karma value
 * @returns {string} Human-readable label
 */
export function getKarmaLabel(karma) {
  for (const entry of ACHIEVEMENTS_CONFIG.KARMA_LABELS) {
    if (karma >= entry.min) return entry.label;
  }
  return 'Neutral';
}

/**
 * Get faction standing label from numeric value
 * @param {number} rep - Current faction reputation value
 * @returns {string} Human-readable label
 */
export function getFactionLabel(rep) {
  for (const entry of ACHIEVEMENTS_CONFIG.FACTION_LABELS) {
    if (rep >= entry.min) return entry.label;
  }
  return 'Neutral';
}

export function StatsSection() {
  const karma = useGameEvent('karmaChanged') ?? 0;
  const factions = useGameEvent('factionRepChanged') ?? {};
  const location = useGameEvent('locationChanged');
  const time = useGameEvent('timeChanged') ?? 0;

  return (
    <div className="stats-section">
      <div className="stats-group">
        <h3 className="stats-group-title">Reputation &amp; Standing</h3>
        <div className="stat-row">
          <span className="stat-label">Karma</span>
          <span className="stat-value">{karma} ({getKarmaLabel(karma)})</span>
        </div>
        {FACTION_CONFIG.FACTIONS.map((faction) => (
          <div className="stat-row" key={faction}>
            <span className="stat-label">{faction.charAt(0).toUpperCase() + faction.slice(1)}</span>
            <span className="stat-value">
              {factions[faction] ?? 0} ({getFactionLabel(factions[faction] ?? 0)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Note: The component will be extended in the next step to show gameplay counters and danger history. Keeping it focused on reputation first to validate the pattern.

Create `css/panel/achievements.css` — check that `css/panel/` exists first. If not, create the CSS file at `css/achievements.css` instead, following whatever pattern the other CSS files use.

```css
/* Achievements & Stats Panel */

#achievements-modal .stats-section {
  margin-bottom: 20px;
}

.stats-group {
  margin-bottom: 15px;
}

.stats-group-title {
  color: var(--color-primary);
  font-size: var(--font-size-large);
  font-family: var(--font-family-mono);
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(0, 255, 136, 0.3);
  padding-bottom: 4px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-normal);
}

.stat-label {
  color: var(--color-secondary);
}

.stat-value {
  color: #ffffff;
}

/* Achievement List */

.achievement-category {
  margin-bottom: 15px;
}

.achievement-category-title {
  color: var(--color-primary);
  font-size: var(--font-size-large);
  font-family: var(--font-family-mono);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.achievement-item {
  display: flex;
  flex-direction: column;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.achievement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.achievement-name {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-normal);
  color: #ffffff;
}

.achievement-name.unlocked {
  color: var(--color-primary);
}

.achievement-progress-text {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-normal);
  color: var(--color-secondary);
}

.achievement-description {
  font-family: var(--font-family-mono);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.achievement-progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}

.achievement-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.achievement-progress-fill.complete {
  background: var(--color-primary);
}

/* Achievement Toast */

.achievement-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.95);
  border: 2px solid var(--color-primary);
  border-radius: 5px;
  padding: 12px 20px;
  z-index: var(--z-modal);
  font-family: var(--font-family-mono);
  text-align: center;
  animation: slideIn 0.3s ease-out;
  pointer-events: none;
}

.achievement-toast-title {
  color: var(--color-primary);
  font-size: var(--font-size-large);
  margin-bottom: 4px;
}

.achievement-toast-name {
  color: #ffffff;
  font-size: var(--font-size-normal);
}

.achievement-toast.fade-out {
  animation: fadeOut 0.3s ease-out forwards;
}
```

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 4: Commit**

```
git add src/features/achievements/StatsSection.jsx css/achievements.css tests/unit/achievements-ui.test.js
git commit -m "Add StatsSection component and achievements CSS"
```

---

### Task 9: Create AchievementsList Component

**Files:**
- Create: `src/features/achievements/AchievementsList.jsx`

**Step 1: Write implementation**

Create `src/features/achievements/AchievementsList.jsx`:

```javascript
import { useContext } from 'react';
import { GameContext } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { ACHIEVEMENT_CATEGORIES } from '../../game/data/achievements-data';

const CATEGORY_DISPLAY_NAMES = {
  exploration: 'Exploration',
  trading: 'Trading',
  social: 'Social',
  survival: 'Survival',
  danger: 'Danger',
  moral: 'Moral',
};

export function AchievementsList() {
  const gameStateManager = useContext(GameContext);
  // Subscribe to achievements changes to trigger re-render
  useGameEvent('achievementsChanged');

  const progress = gameStateManager.achievementsManager.getProgress();

  return (
    <div className="achievements-list">
      {ACHIEVEMENT_CATEGORIES.map((category) => {
        const categoryAchievements = progress
          .filter((a) => a.category === category)
          .sort((a, b) => a.tier - b.tier);

        return (
          <div className="achievement-category" key={category}>
            <h3 className="achievement-category-title">
              {CATEGORY_DISPLAY_NAMES[category]}
            </h3>
            {categoryAchievements.map((achievement) => {
              const percent = Math.min(
                100,
                Math.round((achievement.current / achievement.target) * 100)
              );
              return (
                <div className="achievement-item" key={achievement.id}>
                  <div className="achievement-header">
                    <span
                      className={`achievement-name ${achievement.unlocked ? 'unlocked' : ''}`}
                    >
                      {achievement.unlocked ? '✓ ' : ''}{achievement.name}
                    </span>
                    <span className="achievement-progress-text">
                      {achievement.current}/{achievement.target}
                    </span>
                  </div>
                  <div className="achievement-description">
                    {achievement.description}
                  </div>
                  <div className="achievement-progress-bar">
                    <div
                      className={`achievement-progress-fill ${achievement.unlocked ? 'complete' : ''}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Add delegation method to GameStateManager**

Add to `src/game/state/game-state-manager.js` (in the appropriate section, perhaps after quest methods):

```javascript
  // ========================================================================
  // ACHIEVEMENTS SYSTEM
  // ========================================================================

  getAchievementProgress() {
    return this.achievementsManager.getProgress();
  }
```

Also emit achievements in `_emitAllStateEvents()` (after the quests emit block):

```javascript
    if (state.achievements) {
      this.emit(EVENT_NAMES.ACHIEVEMENTS_CHANGED, { ...state.achievements });
    }
```

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 4: Commit**

```
git add src/features/achievements/AchievementsList.jsx src/game/state/game-state-manager.js
git commit -m "Add AchievementsList component and delegation method"
```

---

### Task 10: Extend StatsSection with Gameplay Counters and Danger History

**Files:**
- Modify: `src/features/achievements/StatsSection.jsx`

**Step 1: Write the failing test**

Add to `tests/unit/achievements.test.js`:

```javascript
import { getKarmaLabel, getFactionLabel } from '../../src/features/achievements/StatsSection';

describe('Label Functions', () => {
  it('should return correct karma labels', () => {
    expect(getKarmaLabel(80)).toBe('Saint');
    expect(getKarmaLabel(50)).toBe('Virtuous');
    expect(getKarmaLabel(25)).toBe('Decent');
    expect(getKarmaLabel(0)).toBe('Neutral');
    expect(getKarmaLabel(-30)).toBe('Shady');
    expect(getKarmaLabel(-50)).toBe('Ruthless');
    expect(getKarmaLabel(-80)).toBe('Villain');
  });

  it('should return correct faction labels', () => {
    expect(getFactionLabel(80)).toBe('Allied');
    expect(getFactionLabel(50)).toBe('Respected');
    expect(getFactionLabel(0)).toBe('Neutral');
    expect(getFactionLabel(-50)).toBe('Hostile');
    expect(getFactionLabel(-80)).toBe('Enemy');
  });
});
```

**Step 2: Run test to verify it passes (functions already exist)**

Run: `npm test -- tests/unit/achievements.test.js`
Expected: PASS

**Step 3: Extend StatsSection with full stat display**

Update `src/features/achievements/StatsSection.jsx` to include all three stat groups. The component needs access to the game state manager for stats that aren't directly emitted as events. Use `useContext(GameContext)` to get the manager and read stats on each render (triggered by `useGameEvent`).

The full component should render:
1. Reputation & Standing (karma + 4 faction standings with labels)
2. Gameplay Counters (systems visited with /48, jumps, days, credits, cargo, charitable acts)
3. Danger History (pirates fought/negotiated, inspections passed/bribed/fled, civilians saved/looted)

**Step 4: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 5: Commit**

```
git add src/features/achievements/StatsSection.jsx tests/unit/achievements.test.js
git commit -m "Extend StatsSection with gameplay counters and danger history"
```

---

### Task 11: Create AchievementsModal Component

**Files:**
- Create: `src/features/achievements/AchievementsModal.jsx`

**Step 1: Write implementation**

Create `src/features/achievements/AchievementsModal.jsx`:

```javascript
import { Modal } from '../../components/Modal';
import { StatsSection } from './StatsSection';
import { AchievementsList } from './AchievementsList';

export function AchievementsModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Achievements & Stats">
      <div id="achievements-modal">
        <StatsSection />
        <hr style={{ borderColor: 'rgba(255, 255, 255, 0.1)', margin: '15px 0' }} />
        <AchievementsList />
      </div>
    </Modal>
  );
}
```

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 3: Commit**

```
git add src/features/achievements/AchievementsModal.jsx
git commit -m "Add AchievementsModal component"
```

---

### Task 12: Create AchievementToast Component

**Files:**
- Create: `src/features/achievements/AchievementToast.jsx`

**Step 1: Write implementation**

Create `src/features/achievements/AchievementToast.jsx`:

```javascript
import { useState, useEffect, useCallback } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { ACHIEVEMENTS_CONFIG, NOTIFICATION_CONFIG } from '../../game/constants';

export function AchievementToast() {
  const [toast, setToast] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);

  const handleUnlock = useCallback((data) => {
    setFadeOut(false);
    setToast(data);

    setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setToast(null);
        setFadeOut(false);
      }, NOTIFICATION_CONFIG.FADE_DURATION);
    }, ACHIEVEMENTS_CONFIG.TOAST_DURATION);
  }, []);

  // Subscribe to achievement unlock events
  useGameEvent('achievementUnlocked', handleUnlock);

  if (!toast) return null;

  return (
    <div className={`achievement-toast ${fadeOut ? 'fade-out' : ''}`}>
      <div className="achievement-toast-title">Achievement Unlocked!</div>
      <div className="achievement-toast-name">{toast.name}</div>
    </div>
  );
}
```

Note: Check how `useGameEvent` is used in the codebase — it may return data directly rather than taking a callback. Adjust the pattern to match the existing hook API. If `useGameEvent` returns the last event data, use `useEffect` to detect changes instead.

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 3: Commit**

```
git add src/features/achievements/AchievementToast.jsx
git commit -m "Add AchievementToast notification component"
```

---

### Task 13: Add Achievements Button to Gear Menu

**Files:**
- Modify: `src/features/navigation/CameraControls.jsx`

**Step 1: Write implementation**

Add import at top of `CameraControls.jsx`:

```javascript
import { AchievementsModal } from '../achievements/AchievementsModal';
```

Add state (after line 34, alongside `showInstructions`):

```javascript
const [showAchievements, setShowAchievements] = useState(false);
```

Add button in the gear menu (after the GitHub link at line 72, before the Zoom In button):

```javascript
          <button
            className="control-btn"
            onClick={() => setShowAchievements(true)}
          >
            Achievements
          </button>
```

Add modal render (after the InstructionsModal at line 109):

```javascript
      <AchievementsModal
        isOpen={showAchievements}
        onClose={() => setShowAchievements(false)}
      />
```

**Step 2: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 3: Commit**

```
git add src/features/navigation/CameraControls.jsx
git commit -m "Add Achievements button to gear menu"
```

---

### Task 14: Add AchievementToast to App

**Files:**
- Modify: `src/App.jsx`

**Step 1: Write implementation**

The `AchievementToast` component needs to be rendered at the app level so it shows regardless of which view mode is active.

Add import:
```javascript
import { AchievementToast } from './features/achievements/AchievementToast';
```

Add the component inside the `GameContext.Provider` wrapper, outside any view-mode-specific rendering:
```javascript
<AchievementToast />
```

**Step 2: Import the CSS file**

Add to the main CSS imports (check `index.html` or `main.jsx` for how CSS is loaded):
```javascript
import '../css/achievements.css';
```

Or add a `<link>` tag in `index.html` if that's the pattern used.

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 4: Commit**

```
git add src/App.jsx
git commit -m "Add AchievementToast to App for global unlock notifications"
```

---

### Task 15: Verify useGameEvent Hook Compatibility

Before considering this complete, verify the `useGameEvent` hook API matches how we're using it in the toast and other components.

**Files:**
- Read: `src/hooks/useGameEvent.js`

**Step 1: Read the hook implementation**

Read `src/hooks/useGameEvent.js` and verify:
- How it subscribes to events
- What it returns (last data? callback-based?)
- Whether `AchievementToast` needs to be adjusted

**Step 2: Adjust AchievementToast if needed**

If `useGameEvent` returns the latest event data (not a callback registration), adjust the toast to use `useEffect` watching the returned value instead.

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests PASS

**Step 4: Manual testing**

Run: `npm run dev`
- Open the game in browser
- Click gear menu — verify "Achievements" button appears after GitHub
- Click "Achievements" — verify modal opens with Stats section and Achievements section
- Verify faction standings are visible with labels
- Start a new game, make a few jumps — verify survival achievement progress updates
- Sell some cargo — verify trading achievement progress updates

**Step 5: Commit any adjustments**

```
git add -A
git commit -m "Verify and adjust useGameEvent integration"
```

---

### Task 16: Final Test Suite Run and Cleanup

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests PASS with clean output (no stderr warnings)

**Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 3: Run formatter**

Run: `npm run format:check`
If failures: `npm run format:write`

**Step 4: Final commit**

```
git add -A
git commit -m "Clean up lint and formatting for achievements system"
```
