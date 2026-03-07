import { describe, it, expect } from 'vitest';
import {
  CREDITS_SECTIONS,
  buildCastList,
} from '../../src/features/endgame/credits-data.js';
import { ALL_NPCS } from '../../src/game/data/npc-data.js';

describe('Credits data', () => {
  it('CREDITS_SECTIONS is a non-empty array of { type, lines } objects', () => {
    expect(Array.isArray(CREDITS_SECTIONS)).toBe(true);
    expect(CREDITS_SECTIONS.length).toBeGreaterThan(0);
    for (const section of CREDITS_SECTIONS) {
      expect(section).toHaveProperty('type');
      expect(section).toHaveProperty('lines');
      expect(Array.isArray(section.lines)).toBe(true);
    }
  });

  it('buildCastList returns one entry per NPC from ALL_NPCS', () => {
    const cast = buildCastList();
    expect(cast).toHaveLength(ALL_NPCS.length);
    for (const entry of cast) {
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('role');
    }
  });

  it('includes disclaimer section', () => {
    const disclaimer = CREDITS_SECTIONS.find((s) => s.type === 'disclaimer');
    expect(disclaimer).toBeDefined();
    expect(disclaimer.lines.join(' ')).toContain('fictitious');
  });

  it('includes closing quote', () => {
    const closing = CREDITS_SECTIONS.find((s) => s.type === 'quote');
    expect(closing).toBeDefined();
  });
});
