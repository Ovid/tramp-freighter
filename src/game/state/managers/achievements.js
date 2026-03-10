import { BaseManager } from './base-manager.js';
import { ACHIEVEMENTS } from '../../data/achievements-data.js';
import { EVENT_NAMES, REPUTATION_BOUNDS } from '../../constants.js';

export class AchievementsManager extends BaseManager {
  resolveStatPath(statPath) {
    if (statPath.startsWith('computed.')) {
      return this._resolveComputed(statPath);
    }

    if (statPath.startsWith('stats.')) {
      const stats = this.capabilities.getStats();
      const key = statPath.slice(6); // Remove 'stats.' prefix
      return typeof stats?.[key] === 'number' ? stats[key] : 0;
    }

    if (statPath === 'world.visitedSystems.length') {
      const visited = this.capabilities.getVisitedSystems();
      return Array.isArray(visited) ? visited.length : 0;
    }

    return 0;
  }

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

  checkAchievements() {
    let achievements = this.capabilities.getOwnState();
    if (!achievements) {
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

    // Only emit on unlock — progress bars are computed live via getProgress()
    // each time the modal opens, so stale mid-session values aren't visible.
    if (anyUnlocked) {
      this.capabilities.emit(EVENT_NAMES.ACHIEVEMENTS_CHANGED, {
        ...achievements,
      });
      this.capabilities.markDirty();
    }
  }

  getProgress() {
    const achievements = this.capabilities.getOwnState();
    return ACHIEVEMENTS.map((achievement) => ({
      ...achievement,
      current: this.resolveStatPath(achievement.statPath),
      unlocked: !!achievements?.[achievement.id],
      unlockedOnDay: achievements?.[achievement.id]?.unlockedOnDay ?? null,
    }));
  }
}
