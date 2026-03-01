import { describe, it, expect } from 'vitest';
import { MARCUS_COLE_DIALOGUE } from '../../src/game/data/dialogue-trees.js';

/**
 * Tests for Marcus Cole debt-cleared dialogue branch.
 *
 * When the player pays off their debt (debt === 0) and has not yet
 * started the Tanaka quest (stage === 0), Cole should offer a new
 * dialogue path hinting at Tanaka's jump drive project.
 */
describe('Marcus Cole Debt-Cleared Dialogue', () => {
  /** Mock context where debt is paid off and Tanaka quest not started */
  const debtClearedContext = {
    debt: 0,
    heat: 'low',
    canGetTip: { available: false },
    canRequestLoan: { available: false },
    canRequestStorage: { available: false },
    npcState: { loanAmount: 0, storedCargo: [] },
    daysElapsed: 50,
    karma: 0,
    factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
    narrativeFlags: {},
    systemsVisited: 10,
    getQuestStage: () => 0,
    getQuestState: () => null,
    canStartQuestStage: () => false,
    hasClaimedStageRewards: () => false,
    shipHull: 100,
    shipEngine: 100,
  };

  /** Mock context where debt is still outstanding */
  const debtOutstandingContext = {
    ...debtClearedContext,
    debt: 5000,
  };

  /** Mock context where debt is cleared but Tanaka quest already started */
  const tanakaStartedContext = {
    ...debtClearedContext,
    getQuestStage: (questId) => (questId === 'tanaka' ? 1 : 0),
  };

  /** Mock context where debt is cleared but Tanaka already met */
  const tanakaMetContext = {
    ...debtClearedContext,
    narrativeFlags: { tanaka_met: true },
  };

  describe('getGreetingText with debt === 0', () => {
    it('should return debt-cleared greeting when debt is zero', () => {
      const greetingText = MARCUS_COLE_DIALOGUE.greeting.text(
        0,
        debtClearedContext
      );
      expect(greetingText).toContain('surprised');
      expect(greetingText).toContain('zero');
    });

    it('should NOT return debt-cleared greeting when debt is outstanding', () => {
      const greetingText = MARCUS_COLE_DIALOGUE.greeting.text(
        0,
        debtOutstandingContext
      );
      expect(greetingText).not.toContain('Your account reads zero');
    });

    it('should still return debt-cleared greeting even when Tanaka quest started', () => {
      // The greeting text changes based on debt, not quest state
      const greetingText = MARCUS_COLE_DIALOGUE.greeting.text(
        0,
        tanakaStartedContext
      );
      expect(greetingText).toContain('surprised');
    });
  });

  describe('debt_cleared choice visibility', () => {
    it('should show debt_cleared choice when debt === 0 and Tanaka quest not started', () => {
      const debtClearedChoice = MARCUS_COLE_DIALOGUE.greeting.choices.find(
        (c) => c.next === 'debt_cleared'
      );
      expect(debtClearedChoice).toBeDefined();
      expect(debtClearedChoice.condition(0, debtClearedContext)).toBe(true);
    });

    it('should NOT show debt_cleared choice when debt > 0', () => {
      const debtClearedChoice = MARCUS_COLE_DIALOGUE.greeting.choices.find(
        (c) => c.next === 'debt_cleared'
      );
      expect(debtClearedChoice).toBeDefined();
      expect(debtClearedChoice.condition(0, debtOutstandingContext)).toBe(false);
    });

    it('should NOT show debt_cleared choice when Tanaka quest already started', () => {
      const debtClearedChoice = MARCUS_COLE_DIALOGUE.greeting.choices.find(
        (c) => c.next === 'debt_cleared'
      );
      expect(debtClearedChoice).toBeDefined();
      expect(debtClearedChoice.condition(0, tanakaStartedContext)).toBe(false);
    });

    it('should NOT show debt_cleared choice when Tanaka already met', () => {
      const debtClearedChoice = MARCUS_COLE_DIALOGUE.greeting.choices.find(
        (c) => c.next === 'debt_cleared'
      );
      expect(debtClearedChoice).toBeDefined();
      expect(debtClearedChoice.condition(0, tanakaMetContext)).toBe(false);
    });

    it('should NOT show debt_cleared choice when context is missing', () => {
      const debtClearedChoice = MARCUS_COLE_DIALOGUE.greeting.choices.find(
        (c) => c.next === 'debt_cleared'
      );
      expect(debtClearedChoice).toBeDefined();
      expect(debtClearedChoice.condition(0, null)).toBe(false);
      expect(debtClearedChoice.condition(0, undefined)).toBe(false);
    });
  });

  describe('debt_cleared dialogue node', () => {
    it('should exist with correct structure', () => {
      const node = MARCUS_COLE_DIALOGUE.debt_cleared;
      expect(node).toBeDefined();
      expect(typeof node.text).toBe('string');
      expect(Array.isArray(node.choices)).toBe(true);
      expect(node.choices.length).toBeGreaterThanOrEqual(2);
    });

    it('should mention an engineer or Barnards Star', () => {
      const node = MARCUS_COLE_DIALOGUE.debt_cleared;
      const text = node.text;
      expect(
        text.includes('engineer') || text.includes("Barnard")
      ).toBe(true);
    });

    it('should have choice leading to tanaka_detail', () => {
      const node = MARCUS_COLE_DIALOGUE.debt_cleared;
      const tanakaChoice = node.choices.find(
        (c) => c.next === 'tanaka_detail'
      );
      expect(tanakaChoice).toBeDefined();
    });

    it('should have choice leading to future_business', () => {
      const node = MARCUS_COLE_DIALOGUE.debt_cleared;
      const futureChoice = node.choices.find(
        (c) => c.next === 'future_business'
      );
      expect(futureChoice).toBeDefined();
    });

    it('should have a goodbye choice', () => {
      const node = MARCUS_COLE_DIALOGUE.debt_cleared;
      const goodbyeChoice = node.choices.find((c) => c.next === null);
      expect(goodbyeChoice).toBeDefined();
    });
  });

  describe('tanaka_detail dialogue node', () => {
    it('should exist with correct structure', () => {
      const node = MARCUS_COLE_DIALOGUE.tanaka_detail;
      expect(node).toBeDefined();
      expect(typeof node.text).toBe('string');
      expect(Array.isArray(node.choices)).toBe(true);
    });

    it('should mention Tanaka by name', () => {
      expect(MARCUS_COLE_DIALOGUE.tanaka_detail.text).toContain('Tanaka');
    });

    it('should mention Barnards Star', () => {
      expect(MARCUS_COLE_DIALOGUE.tanaka_detail.text).toContain("Barnard");
    });

    it('should mention jump drive or jump tech', () => {
      const text = MARCUS_COLE_DIALOGUE.tanaka_detail.text;
      expect(text.includes('jump drive') || text.includes('jump')).toBe(true);
    });

    it('should have choice leading to tanaka_motive', () => {
      const motiveChoice = MARCUS_COLE_DIALOGUE.tanaka_detail.choices.find(
        (c) => c.next === 'tanaka_motive'
      );
      expect(motiveChoice).toBeDefined();
    });

    it('should have a closing choice', () => {
      const closeChoice = MARCUS_COLE_DIALOGUE.tanaka_detail.choices.find(
        (c) => c.next === null
      );
      expect(closeChoice).toBeDefined();
    });
  });

  describe('tanaka_motive dialogue node', () => {
    it('should exist with correct structure', () => {
      const node = MARCUS_COLE_DIALOGUE.tanaka_motive;
      expect(node).toBeDefined();
      expect(typeof node.text).toBe('string');
      expect(Array.isArray(node.choices)).toBe(true);
    });

    it('should reference debt or professional courtesy', () => {
      const text = MARCUS_COLE_DIALOGUE.tanaka_motive.text;
      expect(
        text.includes('debt') ||
          text.includes('courtesy') ||
          text.includes('paid')
      ).toBe(true);
    });

    it('should have a closing choice', () => {
      const closeChoice = MARCUS_COLE_DIALOGUE.tanaka_motive.choices.find(
        (c) => c.next === null
      );
      expect(closeChoice).toBeDefined();
    });
  });

  describe('future_business dialogue node', () => {
    it('should exist with correct structure', () => {
      const node = MARCUS_COLE_DIALOGUE.future_business;
      expect(node).toBeDefined();
      expect(typeof node.text).toBe('string');
      expect(Array.isArray(node.choices)).toBe(true);
    });

    it('should reference reliability or demonstrated value', () => {
      const text = MARCUS_COLE_DIALOGUE.future_business.text;
      expect(
        text.includes('reliab') || text.includes('value') || text.includes('demonstrated')
      ).toBe(true);
    });

    it('should have a dismissive choice with negative rep', () => {
      const dismissChoice = MARCUS_COLE_DIALOGUE.future_business.choices.find(
        (c) => c.repGain && c.repGain < 0
      );
      expect(dismissChoice).toBeDefined();
    });

    it('should have a neutral/positive closing choice', () => {
      const closeChoice = MARCUS_COLE_DIALOGUE.future_business.choices.find(
        (c) => c.next === null && (!c.repGain || c.repGain >= 0)
      );
      expect(closeChoice).toBeDefined();
    });
  });
});
