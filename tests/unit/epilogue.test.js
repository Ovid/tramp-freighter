import { describe, it, expect } from 'vitest';
import {
  generateEpilogue,
  generateStats,
} from '../../src/game/data/epilogue-data.js';

describe('Epilogue generation', () => {
  it('always includes arrival section', () => {
    const state = {
      player: { karma: 0, daysElapsed: 100 },
      npcs: {},
      world: { visitedSystems: [0, 1, 4] },
      missions: { completed: [] },
      stats: { creditsEarned: 0, cargoHauled: 0, jumpsCompleted: 0 },
    };
    const sections = generateEpilogue(state);
    expect(sections.find((s) => s.id === 'arrival')).toBeDefined();
  });

  it('selects high-karma reputation variant', () => {
    const state = {
      player: { karma: 60, daysElapsed: 100 },
      npcs: {
        a: { rep: 70 },
        b: { rep: 80 },
        c: { rep: 65 },
      },
      world: { visitedSystems: [0] },
      missions: { completed: [] },
      stats: {
        creditsEarned: 0,
        smugglingRuns: 0,
        cargoHauled: 0,
        jumpsCompleted: 0,
      },
    };
    const sections = generateEpilogue(state);
    const rep = sections.find((s) => s.id === 'reputation');
    expect(rep.text).toContain('remember you');
  });

  it('selects fallback reputation for neutral karma', () => {
    const state = {
      player: { karma: 0, daysElapsed: 100 },
      npcs: {},
      world: { visitedSystems: [0] },
      missions: { completed: [] },
      stats: { creditsEarned: 0, smugglingRuns: 0, cargoHauled: 0, jumpsCompleted: 0 },
    };
    const sections = generateEpilogue(state);
    const rep = sections.find((s) => s.id === 'reputation');
    expect(rep).toBeDefined();
  });

  it('generates stats from game state', () => {
    const state = {
      player: { daysElapsed: 127 },
      world: { visitedSystems: [0, 1, 4, 5, 7] },
      npcs: { a: { rep: 70 } },
      missions: { completed: ['m1', 'm2'] },
      stats: { creditsEarned: 47320, cargoHauled: 340, jumpsCompleted: 89 },
    };
    const stats = generateStats(state);
    expect(stats.daysElapsed).toBe(127);
    expect(stats.systemsVisited).toBe(5);
    expect(stats.missionsCompleted).toBe(2);
    expect(stats.trustedNPCs).toBe(1);
  });
});
