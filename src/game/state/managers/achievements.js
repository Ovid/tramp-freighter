import { BaseManager } from './base-manager.js';
import { ACHIEVEMENTS } from '../../data/achievements-data.js';
import { EVENT_NAMES, REPUTATION_BOUNDS } from '../../constants.js';

export class AchievementsManager extends BaseManager {
  constructor(gameStateManager) {
    super(gameStateManager);
  }

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
