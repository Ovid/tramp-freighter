import { describe, it, expect } from 'vitest';
import {
  SeededRandom,
  buildEncounterSeed,
  pickRandomFrom,
} from '../../src/game/utils/seeded-random.js';

describe('SeededRandom coverage', () => {
  describe('_stringToHash', () => {
    it('produces a numeric hash from a string', () => {
      const rng = new SeededRandom('test');
      expect(typeof rng.hash).toBe('number');
    });

    it('produces different hashes for different strings', () => {
      const rng1 = new SeededRandom('alpha');
      const rng2 = new SeededRandom('beta');
      expect(rng1.hash).not.toBe(rng2.hash);
    });

    it('handles empty string', () => {
      const rng = new SeededRandom('');
      expect(rng.hash).toBe(0);
    });

    it('handles single character', () => {
      const rng = new SeededRandom('a');
      expect(typeof rng.hash).toBe('number');
      expect(rng.hash).not.toBe(0);
    });
  });

  describe('next', () => {
    it('returns a value between 0 and 1', () => {
      const rng = new SeededRandom('test_next');
      for (let i = 0; i < 20; i++) {
        const val = rng.next();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    });

    it('is deterministic for the same seed', () => {
      const rng1 = new SeededRandom('deterministic');
      const rng2 = new SeededRandom('deterministic');
      for (let i = 0; i < 10; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = new SeededRandom('seed_A');
      const rng2 = new SeededRandom('seed_B');
      const seq1 = Array.from({ length: 5 }, () => rng1.next());
      const seq2 = Array.from({ length: 5 }, () => rng2.next());
      expect(seq1).not.toEqual(seq2);
    });
  });

  describe('nextInt', () => {
    it('returns integers within specified range', () => {
      const rng = new SeededRandom('nextInt_test');
      for (let i = 0; i < 50; i++) {
        const val = rng.nextInt(1, 6);
        expect(Number.isInteger(val)).toBe(true);
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(6);
      }
    });

    it('returns the only value when min equals max', () => {
      const rng = new SeededRandom('single_value');
      expect(rng.nextInt(5, 5)).toBe(5);
    });

    it('works with negative ranges', () => {
      const rng = new SeededRandom('negative_range');
      for (let i = 0; i < 20; i++) {
        const val = rng.nextInt(-10, -5);
        expect(val).toBeGreaterThanOrEqual(-10);
        expect(val).toBeLessThanOrEqual(-5);
      }
    });
  });

  describe('nextFloat', () => {
    it('returns floats within specified range', () => {
      const rng = new SeededRandom('nextFloat_test');
      for (let i = 0; i < 50; i++) {
        const val = rng.nextFloat(2.5, 7.5);
        expect(val).toBeGreaterThanOrEqual(2.5);
        expect(val).toBeLessThanOrEqual(7.5);
      }
    });

    it('returns min when min equals max', () => {
      const rng = new SeededRandom('same_float');
      const val = rng.nextFloat(3.0, 3.0);
      expect(val).toBe(3.0);
    });
  });

  describe('pickRandom', () => {
    it('returns an element from the array', () => {
      const rng = new SeededRandom('pick_test');
      const items = ['a', 'b', 'c', 'd', 'e'];
      for (let i = 0; i < 20; i++) {
        expect(items).toContain(rng.pickRandom(items));
      }
    });

    it('returns the only element from a single-element array', () => {
      const rng = new SeededRandom('single_pick');
      expect(rng.pickRandom(['only'])).toBe('only');
    });
  });

  describe('pickRandomFrom (standalone)', () => {
    it('returns an element from the array', () => {
      const items = [10, 20, 30, 40];
      let callCount = 0;
      const mockRng = () => {
        callCount++;
        return 0.5;
      };
      const result = pickRandomFrom(items, mockRng);
      expect(items).toContain(result);
    });

    it('handles rng returning 0', () => {
      const items = ['first', 'second', 'third'];
      const result = pickRandomFrom(items, () => 0);
      expect(result).toBe('first');
    });

    it('clamps index when rng returns 1.0', () => {
      const items = ['first', 'second', 'third'];
      const result = pickRandomFrom(items, () => 0.9999999);
      expect(items).toContain(result);
    });

    it('returns last element for high rng value', () => {
      const items = ['a', 'b', 'c'];
      const result = pickRandomFrom(items, () => 0.99);
      expect(result).toBe('c');
    });
  });

  describe('buildEncounterSeed', () => {
    it('builds consistent seed format', () => {
      expect(buildEncounterSeed(10, 3, 'pirate')).toBe('10_3_pirate');
    });

    it('different parameters produce different seeds', () => {
      const s1 = buildEncounterSeed(1, 2, 'a');
      const s2 = buildEncounterSeed(1, 2, 'b');
      const s3 = buildEncounterSeed(1, 3, 'a');
      const s4 = buildEncounterSeed(2, 2, 'a');
      expect(new Set([s1, s2, s3, s4]).size).toBe(4);
    });
  });
});
