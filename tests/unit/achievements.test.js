import { describe, it, expect, beforeEach } from 'vitest';
import {
  ACHIEVEMENTS_CONFIG,
  EVENT_NAMES,
  SOL_SYSTEM_ID,
  KARMA_CONFIG,
} from '../../src/game/constants.js';
import { GameCoordinator } from '@game/state/game-coordinator.js';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
} from '../../src/game/data/achievements-data.js';
import { NavigationSystem } from '../../src/game/game-navigation.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { WORMHOLE_DATA } from '../../src/game/data/wormhole-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';
import { addStateDefaults } from '../../src/game/state/state-validators.js';
import {
  getKarmaLabel,
  getFactionLabel,
} from '../../src/features/achievements/StatsSection';

describe('Achievement Constants', () => {
  it('should define achievement tier thresholds for all categories', () => {
    const categories = [
      'EXPLORATION',
      'TRADING',
      'SOCIAL',
      'SURVIVAL',
      'DANGER',
      'MORAL',
    ];
    for (const category of categories) {
      expect(
        ACHIEVEMENTS_CONFIG.THRESHOLDS[`${category}_TIER_1`]
      ).toBeGreaterThan(0);
      expect(
        ACHIEVEMENTS_CONFIG.THRESHOLDS[`${category}_TIER_2`]
      ).toBeGreaterThan(ACHIEVEMENTS_CONFIG.THRESHOLDS[`${category}_TIER_1`]);
      expect(
        ACHIEVEMENTS_CONFIG.THRESHOLDS[`${category}_TIER_3`]
      ).toBeGreaterThan(ACHIEVEMENTS_CONFIG.THRESHOLDS[`${category}_TIER_2`]);
      expect(
        ACHIEVEMENTS_CONFIG.THRESHOLDS[`${category}_TIER_4`]
      ).toBeGreaterThan(ACHIEVEMENTS_CONFIG.THRESHOLDS[`${category}_TIER_3`]);
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
    // Labels should be sorted by threshold descending
    for (let i = 0; i < ACHIEVEMENTS_CONFIG.FACTION_LABELS.length - 1; i++) {
      expect(ACHIEVEMENTS_CONFIG.FACTION_LABELS[i].min).toBeGreaterThan(
        ACHIEVEMENTS_CONFIG.FACTION_LABELS[i + 1].min
      );
    }
  });

  it('should define toast display duration', () => {
    expect(ACHIEVEMENTS_CONFIG.TOAST_DURATION).toBeGreaterThan(0);
  });
});

describe('Achievement Definitions', () => {
  it('should define exactly 24 achievements (6 categories x 4 tiers)', () => {
    expect(ACHIEVEMENTS.length).toBe(24);
  });

  it('should have 4 tiers per category', () => {
    for (const category of ACHIEVEMENT_CATEGORIES) {
      const categoryAchievements = ACHIEVEMENTS.filter(
        (a) => a.category === category
      );
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
      const sorted = ACHIEVEMENTS.filter((a) => a.category === category).sort(
        (a, b) => a.tier - b.tier
      );
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].target).toBeGreaterThan(sorted[i - 1].target);
      }
    }
  });
});

describe('Achievement Target Validation', () => {
  it('exploration tier 4 target should equal reachable systems from Sol + 1 (Delta Pavonis)', () => {
    const nav = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
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
    expect(ACHIEVEMENTS_CONFIG.THRESHOLDS.EXPLORATION_TIER_4).toBe(
      reachable.size + 1
    );
  });

  it('social tier 4 target should not exceed total NPC count', () => {
    expect(ACHIEVEMENTS_CONFIG.THRESHOLDS.SOCIAL_TIER_4).toBeLessThanOrEqual(
      ALL_NPCS.length
    );
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

describe('AchievementsManager', () => {
  let manager;

  beforeEach(() => {
    manager = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    manager.initNewGame();
  });

  it('should initialize with empty achievements state', () => {
    expect(manager.state.achievements).toEqual({});
  });

  it('should resolve simple statPath from game state', () => {
    const value = manager.achievementsManager.resolveStatPath(
      'stats.jumpsCompleted'
    );
    expect(value).toBe(0);
  });

  it('should resolve computed.trustedNPCCount', () => {
    const value = manager.achievementsManager.resolveStatPath(
      'computed.trustedNPCCount'
    );
    expect(value).toBe(0);
  });

  it('should resolve computed.totalDangerEncounters', () => {
    const value = manager.achievementsManager.resolveStatPath(
      'computed.totalDangerEncounters'
    );
    expect(value).toBe(0);
  });

  it('should resolve computed.karmaAbsolute', () => {
    manager.state.player.karma = -42;
    const value = manager.achievementsManager.resolveStatPath(
      'computed.karmaAbsolute'
    );
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
    expect(manager.state.achievements['survival_1'].unlockedOnDay).toBe(
      firstDay
    );
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
    manager.subscribe('achievementsChanged', () => {
      changed = true;
    });

    manager.state.stats.jumpsCompleted = 10;
    manager.achievementsManager.checkAchievements();

    expect(changed).toBe(true);
  });

  it('should not emit events when no achievements unlock', () => {
    let emitted = false;
    manager.subscribe('achievementUnlocked', () => {
      emitted = true;
    });

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

describe('Achievement Event Integration', () => {
  let manager;

  beforeEach(() => {
    manager = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
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
    const nav = new NavigationSystem(STAR_DATA, WORMHOLE_DATA);
    const connected = nav.getConnectedSystems(0);
    manager.navigationManager.updateLocation(connected[0]);

    expect(unlocked.some((a) => a.id === 'survival_1')).toBe(true);
  });
});

describe('Save Compatibility', () => {
  it('should add achievements field to old saves missing it', () => {
    const oldState = {
      player: {
        credits: 100,
        karma: 0,
        factions: {},
        daysElapsed: 5,
        currentSystem: SOL_SYSTEM_ID,
      },
      ship: { cargo: [], hiddenCargo: [] },
      world: {
        visitedSystems: [],
        dangerFlags: {},
        narrativeEvents: {
          fired: [],
          cooldowns: {},
          flags: {},
          dockedSystems: [],
        },
      },
      npcs: {},
      missions: {
        active: [],
        completed: [],
        failed: [],
        board: [],
        boardLastRefresh: 0,
      },
      stats: {
        creditsEarned: 0,
        jumpsCompleted: 0,
        cargoHauled: 0,
        charitableActs: 0,
      },
      quests: {},
      meta: { version: '5.0.0' },
    };

    const migrated = addStateDefaults(oldState, STAR_DATA);
    expect(migrated.achievements).toEqual({});
  });

  it('should unlock already-qualified achievements on restoreState', () => {
    const manager = new GameCoordinator(STAR_DATA, WORMHOLE_DATA);
    manager.initNewGame();

    // Build a save with stats that meet thresholds but no unlocked achievements
    const saveState = JSON.parse(JSON.stringify(manager.state));
    saveState.stats.jumpsCompleted = 10;
    saveState.achievements = {};

    const result = manager.restoreState(saveState);
    expect(result.success).toBe(true);
    expect(manager.state.achievements['survival_1']).toBeDefined();
    expect(manager.state.achievements['survival_1'].unlocked).toBe(true);
  });

  it('should preserve existing achievements on load', () => {
    const stateWithAchievements = {
      player: {
        credits: 100,
        karma: 0,
        factions: {},
        daysElapsed: 5,
        currentSystem: SOL_SYSTEM_ID,
      },
      ship: { cargo: [], hiddenCargo: [] },
      world: {
        visitedSystems: [],
        dangerFlags: {},
        narrativeEvents: {
          fired: [],
          cooldowns: {},
          flags: {},
          dockedSystems: [],
        },
      },
      npcs: {},
      missions: {
        active: [],
        completed: [],
        failed: [],
        board: [],
        boardLastRefresh: 0,
      },
      stats: {
        creditsEarned: 0,
        jumpsCompleted: 0,
        cargoHauled: 0,
        charitableActs: 0,
      },
      quests: {},
      achievements: { survival_1: { unlocked: true, unlockedOnDay: 10 } },
      meta: { version: '5.0.0' },
    };

    const migrated = addStateDefaults(stateWithAchievements, STAR_DATA);
    expect(migrated.achievements.survival_1.unlocked).toBe(true);
  });
});

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
