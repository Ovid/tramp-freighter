import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENTS_CONFIG,
  EVENT_NAMES,
} from '../../src/game/constants.js';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../../src/game/data/achievements-data.js';

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
