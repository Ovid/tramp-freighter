import { describe, it, expect } from 'vitest';
import {
  SeededRandom,
  pickRandomFrom,
} from '../../src/game/utils/seeded-random.js';

describe('pickRandom', () => {
  describe('SeededRandom.pickRandom (instance method)', () => {
    it('returns an element from the array', () => {
      const rng = new SeededRandom('test');
      const items = ['a', 'b', 'c'];
      const result = rng.pickRandom(items);
      expect(items).toContain(result);
    });

    it('never indexes out of bounds over many calls', () => {
      const rng = new SeededRandom('bounds-check');
      const items = ['x', 'y', 'z'];
      for (let i = 0; i < 1000; i++) {
        const result = rng.pickRandom(items);
        expect(items).toContain(result);
      }
    });

    it('returns the only element for single-element array', () => {
      const rng = new SeededRandom('single');
      expect(rng.pickRandom(['only'])).toBe('only');
    });
  });

  describe('pickRandomFrom (standalone function)', () => {
    it('returns an element using a plain rng function', () => {
      const result = pickRandomFrom(['a', 'b', 'c'], () => 0.5);
      expect(result).toBe('b');
    });

    it('handles rng returning 0', () => {
      const result = pickRandomFrom(['a', 'b', 'c'], () => 0);
      expect(result).toBe('a');
    });

    it('clamps when rng returns exactly 1.0', () => {
      const result = pickRandomFrom(['a', 'b', 'c'], () => 1.0);
      expect(['a', 'b', 'c']).toContain(result);
      expect(result).not.toBeUndefined();
    });

    it('handles rng returning 0.999', () => {
      const result = pickRandomFrom(['a', 'b', 'c'], () => 0.999);
      expect(result).toBe('c');
    });
  });
});
