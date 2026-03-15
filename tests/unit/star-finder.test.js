import { describe, it, expect } from 'vitest';
import { STAR_DATA } from '../../src/game/data/star-data.js';

describe('Star finder sorting', () => {
  it('should sort stars alphabetically by name', () => {
    const sorted = [...STAR_DATA].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].name.localeCompare(sorted[i - 1].name)).toBeGreaterThanOrEqual(0);
    }
    expect(sorted[0].name).toBe('2MASS 0415-09');
  });
});
