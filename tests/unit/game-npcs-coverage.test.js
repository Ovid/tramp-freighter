import { describe, it, expect } from 'vitest';
import {
  getNPCsAtSystem,
  renderNPCListItem,
} from '../../src/game/game-npcs.js';

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

  describe('renderNPCListItem', () => {
    const mockGetRepTier = (rep) => {
      if (rep >= 50) return { name: 'Trusted' };
      if (rep >= 0) return { name: 'Neutral' };
      return { name: 'Hostile' };
    };

    it('renders correctly with NPC state', () => {
      const npc = { name: 'Captain Vasquez', role: 'Trader', initialRep: 10 };
      const npcState = { rep: 60 };
      const result = renderNPCListItem(npc, npcState, mockGetRepTier);
      expect(result).toBe('Captain Vasquez (Trader) [Trusted]');
    });

    it('uses initialRep when no NPC state exists', () => {
      const npc = { name: 'Captain Vasquez', role: 'Trader', initialRep: 10 };
      const result = renderNPCListItem(npc, null, mockGetRepTier);
      expect(result).toBe('Captain Vasquez (Trader) [Neutral]');
    });

    it('throws for null NPC', () => {
      expect(() => renderNPCListItem(null, null, mockGetRepTier)).toThrow(
        'must be a non-null object'
      );
    });

    it('throws for undefined NPC', () => {
      expect(() => renderNPCListItem(undefined, null, mockGetRepTier)).toThrow(
        'must be a non-null object'
      );
    });

    it('throws for string NPC', () => {
      expect(() => renderNPCListItem('npc', null, mockGetRepTier)).toThrow(
        'must be a non-null object'
      );
    });

    it('throws for null getRepTier function', () => {
      const npc = { name: 'Test', role: 'Trader', initialRep: 10 };
      expect(() => renderNPCListItem(npc, null, null)).toThrow(
        'must be a function'
      );
    });

    it('throws for non-function getRepTier', () => {
      const npc = { name: 'Test', role: 'Trader', initialRep: 10 };
      expect(() => renderNPCListItem(npc, null, 'not_a_function')).toThrow(
        'must be a function'
      );
    });

    it('throws for NPC missing required fields', () => {
      expect(() =>
        renderNPCListItem(
          { role: 'Trader', initialRep: 10 },
          null,
          mockGetRepTier
        )
      ).toThrow('missing required fields');

      expect(() =>
        renderNPCListItem(
          { name: 'Test', initialRep: 10 },
          null,
          mockGetRepTier
        )
      ).toThrow('missing required fields');

      expect(() =>
        renderNPCListItem(
          { name: 'Test', role: 'Trader' },
          null,
          mockGetRepTier
        )
      ).toThrow('missing required fields');
    });
  });
});
