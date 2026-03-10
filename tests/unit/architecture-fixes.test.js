import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTestGame } from '../test-utils.js';
import { REPUTATION_BOUNDS } from '../../src/game/constants.js';
import { YUKI_TANAKA_DIALOGUE } from '../../src/game/data/dialogue/tanaka-dialogue.js';

describe('Architecture report fixes', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Flaw #7: research_supply dialogue determinism', () => {
    it('returns the same line for the same rep and daysElapsed', () => {
      const textFn = YUKI_TANAKA_DIALOGUE.research_supply.text;
      const rep = 0; // Below NEUTRAL_MID, hits the else branch
      const context = { daysElapsed: 42 };

      const result1 = textFn(rep, context);
      const result2 = textFn(rep, context);

      expect(result1).toBe(result2);
    });

    it('can produce different lines for different daysElapsed', () => {
      const textFn = YUKI_TANAKA_DIALOGUE.research_supply.text;
      const rep = 0;

      // Try many different days to find at least one that differs
      const results = new Set();
      for (let day = 0; day < 50; day++) {
        results.add(textFn(rep, { daysElapsed: day }));
      }

      // With 2 possible lines and 50 different seeds, we should get both
      expect(results.size).toBe(2);
    });
  });

  describe('Flaw #6: getNPCState lazy-init calls markDirty', () => {
    it('calls markDirty when creating new NPC state', () => {
      const gsm = createTestGame();
      const spy = vi.spyOn(gsm, 'markDirty');

      // First access creates the state
      gsm.npcManager.getNPCState('chen_barnards');

      expect(spy).toHaveBeenCalled();
    });

    it('does not call markDirty when NPC state already exists', () => {
      const gsm = createTestGame();

      // First access creates the state
      gsm.npcManager.getNPCState('chen_barnards');

      const spy = vi.spyOn(gsm, 'markDirty');

      // Second access should not mark dirty
      gsm.npcManager.getNPCState('chen_barnards');

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
