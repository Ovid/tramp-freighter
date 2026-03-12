import { describe, it, expect } from 'vitest';
import { STAR_DATA } from '../../src/game/data/star-data.js';
import { calculateDistanceFromSol } from '@game/constants.js';

describe('Star finder sorting', () => {
  it('should sort stars by distance from Sol', () => {
    const sorted = [...STAR_DATA].sort(
      (a, b) => calculateDistanceFromSol(a) - calculateDistanceFromSol(b)
    );
    expect(sorted[0].name).toBe('Sol');
    expect(calculateDistanceFromSol(sorted[0])).toBe(0);
    for (let i = 1; i < sorted.length; i++) {
      expect(calculateDistanceFromSol(sorted[i])).toBeGreaterThanOrEqual(
        calculateDistanceFromSol(sorted[i - 1])
      );
    }
  });

  it('Sol should have distance 0', () => {
    const sol = STAR_DATA.find((s) => s.id === 0);
    expect(calculateDistanceFromSol(sol)).toBe(0);
  });
});
