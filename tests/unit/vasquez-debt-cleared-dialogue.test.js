import { describe, it, expect } from 'vitest';
import { CAPTAIN_VASQUEZ_DIALOGUE } from '../../src/game/data/dialogue-trees.js';

/**
 * Tests for Captain Vasquez debt-cleared Tanaka hint dialogue branch.
 *
 * When the player pays off their debt (debt === 0) and has not yet
 * started the Tanaka quest (stage === 0) and has not met Tanaka,
 * Vasquez should offer a warm, encouraging dialogue path that
 * explicitly names Tanaka and directs the player to Barnard's Star.
 */
describe('Captain Vasquez Debt-Cleared Tanaka Hint', () => {
  /** Mock context where debt is paid off and Tanaka quest not started */
  const debtClearedContext = {
    debt: 0,
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

  /** Mock context where debt is cleared but tanaka_met flag is set */
  const tanakaMetContext = {
    ...debtClearedContext,
    narrativeFlags: { tanaka_met: true },
  };

  describe('debt_cleared_tanaka_hint choice visibility', () => {
    it('should show choice when debt === 0, Tanaka quest stage === 0, and tanaka not met', () => {
      const choice = CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.find(
        (c) => c.next === 'debt_cleared_tanaka_hint'
      );
      expect(choice).toBeDefined();
      expect(choice.condition(5, debtClearedContext)).toBe(true);
    });

    it('should NOT show choice when debt > 0', () => {
      const choice = CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.find(
        (c) => c.next === 'debt_cleared_tanaka_hint'
      );
      expect(choice).toBeDefined();
      expect(choice.condition(5, debtOutstandingContext)).toBe(false);
    });

    it('should NOT show choice when Tanaka quest already started (stage > 0)', () => {
      const choice = CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.find(
        (c) => c.next === 'debt_cleared_tanaka_hint'
      );
      expect(choice).toBeDefined();
      expect(choice.condition(5, tanakaStartedContext)).toBe(false);
    });

    it('should NOT show choice when tanaka_met flag is set', () => {
      const choice = CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.find(
        (c) => c.next === 'debt_cleared_tanaka_hint'
      );
      expect(choice).toBeDefined();
      expect(choice.condition(5, tanakaMetContext)).toBe(false);
    });

    it('should NOT show choice when context is missing', () => {
      const choice = CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.find(
        (c) => c.next === 'debt_cleared_tanaka_hint'
      );
      expect(choice).toBeDefined();
      expect(choice.condition(5, null)).toBe(false);
      expect(choice.condition(5, undefined)).toBe(false);
    });

    it('should appear before the existing explore_more and barnards_engineer choices', () => {
      const choices = CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices;
      const hintIndex = choices.findIndex(
        (c) => c.next === 'debt_cleared_tanaka_hint'
      );
      const exploreIndex = choices.findIndex(
        (c) => c.next === 'explore_more'
      );
      const barnardsIndex = choices.findIndex(
        (c) => c.next === 'barnards_engineer'
      );
      expect(hintIndex).toBeLessThan(exploreIndex);
      expect(hintIndex).toBeLessThan(barnardsIndex);
    });
  });

  describe('debt_cleared_tanaka_hint dialogue node', () => {
    it('should exist with correct structure', () => {
      const node = CAPTAIN_VASQUEZ_DIALOGUE.debt_cleared_tanaka_hint;
      expect(node).toBeDefined();
      expect(typeof node.text).toBe('string');
      expect(Array.isArray(node.choices)).toBe(true);
      expect(node.choices.length).toBeGreaterThanOrEqual(2);
    });

    it('should name Tanaka explicitly', () => {
      const node = CAPTAIN_VASQUEZ_DIALOGUE.debt_cleared_tanaka_hint;
      expect(node.text).toContain('Tanaka');
    });

    it('should mention Barnards Star', () => {
      const node = CAPTAIN_VASQUEZ_DIALOGUE.debt_cleared_tanaka_hint;
      expect(node.text).toContain("Barnard");
    });

    it('should mention jump drive', () => {
      const node = CAPTAIN_VASQUEZ_DIALOGUE.debt_cleared_tanaka_hint;
      expect(node.text.toLowerCase()).toContain('jump drive');
    });

    it('should acknowledge the debt being cleared', () => {
      const node = CAPTAIN_VASQUEZ_DIALOGUE.debt_cleared_tanaka_hint;
      expect(node.text.toLowerCase()).toContain('debt');
    });

    it('should have a choice leading to tanaka_recommendation', () => {
      const node = CAPTAIN_VASQUEZ_DIALOGUE.debt_cleared_tanaka_hint;
      const recChoice = node.choices.find(
        (c) => c.next === 'tanaka_recommendation'
      );
      expect(recChoice).toBeDefined();
    });

    it('should have a positive closing choice with repGain', () => {
      const node = CAPTAIN_VASQUEZ_DIALOGUE.debt_cleared_tanaka_hint;
      const closeChoice = node.choices.find(
        (c) => c.next === null && c.repGain && c.repGain > 0
      );
      expect(closeChoice).toBeDefined();
    });
  });

  describe('tanaka_recommendation dialogue node', () => {
    it('should exist with correct structure', () => {
      const node = CAPTAIN_VASQUEZ_DIALOGUE.tanaka_recommendation;
      expect(node).toBeDefined();
      expect(typeof node.text).toBe('string');
      expect(Array.isArray(node.choices)).toBe(true);
    });

    it('should mention supplies Tanaka needs (electronics or medicine)', () => {
      const text = CAPTAIN_VASQUEZ_DIALOGUE.tanaka_recommendation.text.toLowerCase();
      expect(
        text.includes('electronics') || text.includes('medicine')
      ).toBe(true);
    });

    it('should have closing choices with repGain', () => {
      const node = CAPTAIN_VASQUEZ_DIALOGUE.tanaka_recommendation;
      const choicesWithRep = node.choices.filter(
        (c) => c.repGain && c.repGain > 0
      );
      expect(choicesWithRep.length).toBeGreaterThanOrEqual(1);
    });

    it('should have a closing choice (next === null)', () => {
      const node = CAPTAIN_VASQUEZ_DIALOGUE.tanaka_recommendation;
      const closeChoice = node.choices.find((c) => c.next === null);
      expect(closeChoice).toBeDefined();
    });
  });
});
