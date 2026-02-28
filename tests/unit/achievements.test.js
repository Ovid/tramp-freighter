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
