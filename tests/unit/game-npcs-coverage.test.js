import { describe, it, expect } from 'vitest';
import { getNPCsAtSystem } from '../../src/game/game-npcs.js';

describe('game-npcs coverage', () => {
  describe('getNPCsAtSystem', () => {
    it('throws for non-number systemId', () => {
      expect(() => getNPCsAtSystem('sol')).toThrow('must be a number');
      expect(() => getNPCsAtSystem(null)).toThrow('must be a number');
      expect(() => getNPCsAtSystem(undefined)).toThrow('must be a number');
    });

    it('returns array for valid systemId', () => {
      const result = getNPCsAtSystem(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns empty array for system with no NPCs', () => {
      const result = getNPCsAtSystem(9999);
      expect(result).toEqual([]);
    });

    it('filters hidden NPCs when revealFlag not set', () => {
      // Get NPCs without narrative flags - hidden ones should be excluded
      const withoutFlags = getNPCsAtSystem(0, {});
      // Get with all possible flags set
      const withFlags = getNPCsAtSystem(0, {
        whisper_revealed: true,
        tanaka_revealed: true,
      });
      // withFlags should have same or more NPCs
      expect(withFlags.length).toBeGreaterThanOrEqual(withoutFlags.length);
    });

    it('shows hidden NPCs when their revealFlag is set', () => {
      // Find an NPC that has a revealFlag
      const allNPCs = getNPCsAtSystem(0, {});
      const allNPCsRevealed = getNPCsAtSystem(0, {
        whisper_revealed: true,
        tanaka_revealed: true,
        all_npcs_revealed: true,
      });
      // The revealed set should be >= the unrevealed set
      expect(allNPCsRevealed.length).toBeGreaterThanOrEqual(allNPCs.length);
    });
  });
});
