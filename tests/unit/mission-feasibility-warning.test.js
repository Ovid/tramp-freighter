import { describe, it, expect } from 'vitest';
import { MISSION_CONFIG } from '../../src/game/constants.js';
import { getFeasibilityWarning } from '../../src/features/missions/missionRouteUtils.js';

/**
 * Feasibility warning tests for mission cards.
 *
 * The mission board compares estimated travel time against the mission
 * deadline and shows a colored label when the deadline is tight or
 * likely impossible to meet.
 */

describe('Mission Feasibility Warning', () => {
  describe('MISSION_CONFIG.FEASIBILITY_WARNING_THRESHOLD', () => {
    it('exists and equals 0.7', () => {
      expect(MISSION_CONFIG.FEASIBILITY_WARNING_THRESHOLD).toBe(0.7);
    });
  });

  describe('getFeasibilityWarning', () => {
    it('returns null when travel time is well within deadline', () => {
      // 5 days travel / 20 day deadline = 0.25 ratio, well below 0.7
      const result = getFeasibilityWarning(5, 20);
      expect(result).toBeNull();
    });

    it('returns null when travel time is exactly at the threshold boundary', () => {
      // 7 days / 10 day deadline = 0.7 ratio, exactly at threshold (not over)
      const result = getFeasibilityWarning(7, 10);
      expect(result).toBeNull();
    });

    it('returns tight warning when travel time exceeds 70% of deadline', () => {
      // 8 days / 10 day deadline = 0.8 ratio, above 0.7 but below 1.0
      const result = getFeasibilityWarning(8, 10);
      expect(result).toEqual({ level: 'tight', text: 'Tight deadline' });
    });

    it('returns impossible warning when travel time equals deadline', () => {
      // 10 days / 10 day deadline = 1.0 ratio
      const result = getFeasibilityWarning(10, 10);
      expect(result).toEqual({
        level: 'impossible',
        text: 'Deadline likely impossible',
      });
    });

    it('returns impossible warning when travel time exceeds deadline', () => {
      // 15 days / 10 day deadline = 1.5 ratio
      const result = getFeasibilityWarning(15, 10);
      expect(result).toEqual({
        level: 'impossible',
        text: 'Deadline likely impossible',
      });
    });

    it('returns null when totalDays is null', () => {
      const result = getFeasibilityWarning(null, 10);
      expect(result).toBeNull();
    });

    it('returns null when deadline is null', () => {
      const result = getFeasibilityWarning(5, null);
      expect(result).toBeNull();
    });

    it('returns null when totalDays is zero', () => {
      const result = getFeasibilityWarning(0, 10);
      expect(result).toBeNull();
    });

    it('returns null when deadline is zero', () => {
      // Avoid division by zero; treat as invalid input
      const result = getFeasibilityWarning(5, 0);
      expect(result).toBeNull();
    });

    it('respects a custom threshold parameter', () => {
      // 6 days / 10 day deadline = 0.6 ratio
      // With default 0.7 threshold, this would be no warning
      // With custom 0.5 threshold, this should be tight
      const result = getFeasibilityWarning(6, 10, 0.5);
      expect(result).toEqual({ level: 'tight', text: 'Tight deadline' });
    });

    it('returns null when both inputs are undefined', () => {
      const result = getFeasibilityWarning(undefined, undefined);
      expect(result).toBeNull();
    });
  });
});
