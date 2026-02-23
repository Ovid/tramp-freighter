import { describe, it, expect } from 'vitest';
import {
  buildEncounterSeed,
  SeededRandom,
} from '../../src/game/utils/seeded-random.js';

describe('buildEncounterSeed', () => {
  it('should produce deterministic string from game context', () => {
    const seed = buildEncounterSeed(142, 0, 'combat');
    expect(seed).toBe('142_0_combat');
  });

  it('should produce different seeds for different encounter types', () => {
    const s1 = buildEncounterSeed(142, 0, 'combat');
    const s2 = buildEncounterSeed(142, 0, 'negotiation');
    expect(s1).not.toBe(s2);
  });

  it('should produce reproducible RNG sequences', () => {
    const seed = buildEncounterSeed(100, 5, 'inspection');
    const rng1 = new SeededRandom(seed);
    const rng2 = new SeededRandom(seed);
    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.next()).toBe(rng2.next());
  });
});
