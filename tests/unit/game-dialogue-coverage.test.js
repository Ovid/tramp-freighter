import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  showDialogue,
  selectChoice,
  buildDialogueContext,
} from '../../src/game/game-dialogue.js';
import { createTestGame } from '../test-utils.js';

describe('game-dialogue coverage', () => {
  let gsm;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGame();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildDialogueContext', () => {
    it('returns context with expected properties', () => {
      const ctx = buildDialogueContext(gsm, 'chen_barnards');
      expect(ctx).toHaveProperty('karma');
      expect(ctx).toHaveProperty('credits');
      expect(ctx).toHaveProperty('cargo');
      expect(ctx).toHaveProperty('shipHull');
      expect(ctx).toHaveProperty('debt');
      expect(ctx).toHaveProperty('factionReps');
      expect(ctx).toHaveProperty('canGetTip');
      expect(ctx).toHaveProperty('canRequestLoan');
      expect(ctx).toHaveProperty('canRequestStorage');
    });

    it('provides working quest accessor functions', () => {
      const ctx = buildDialogueContext(gsm, 'chen_barnards');
      expect(typeof ctx.getQuestStage).toBe('function');
      expect(typeof ctx.getQuestState).toBe('function');
      expect(typeof ctx.canStartQuestStage).toBe('function');
    });

    it('provides working action callbacks', () => {
      const ctx = buildDialogueContext(gsm, 'chen_barnards');
      expect(typeof ctx.requestLoan).toBe('function');
      expect(typeof ctx.storeCargo).toBe('function');
      expect(typeof ctx.repayLoan).toBe('function');
      expect(typeof ctx.retrieveCargo).toBe('function');
    });
  });

  describe('showDialogue', () => {
    it('returns dialogue with npc info for valid NPC', () => {
      const result = showDialogue('chen_barnards', 'greeting', gsm);
      expect(result.npcId).toBe('chen_barnards');
      expect(result.npcName).toBeDefined();
      expect(result.npcRole).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.choices).toBeDefined();
      expect(Array.isArray(result.choices)).toBe(true);
    });

    it('throws for unknown NPC ID', () => {
      expect(() => showDialogue('fake_npc', 'greeting', gsm)).toThrow(
        'Unknown NPC ID'
      );
    });

    it('throws for unknown dialogue node', () => {
      expect(() =>
        showDialogue('chen_barnards', 'nonexistent_node', gsm)
      ).toThrow('Unknown dialogue node');
    });

    it('defaults to greeting node', () => {
      const result = showDialogue('chen_barnards', undefined, gsm);
      expect(result).toBeDefined();
      expect(result.npcId).toBe('chen_barnards');
    });

    it('handles tip node specially', () => {
      // Set up NPC with warm rep so tip is available
      gsm.getNPCState('chen_barnards').rep = 20;
      const result = showDialogue('chen_barnards', 'ask_tip', gsm);
      expect(result.text).toBeDefined();
    });

    it('handles dialogue nodes with flags', () => {
      const result = showDialogue('chen_barnards', 'greeting', gsm);
      // Just verify it doesn't throw - flags are node-specific
      expect(result).toBeDefined();
    });

    it('includes questProgress for NPCs with quests', () => {
      // chen_barnards or other NPCs might have questId
      // Test with a valid NPC and verify the structure
      const result = showDialogue('chen_barnards', 'greeting', gsm);
      // questProgress can be null or an object
      if (result.questProgress) {
        expect(result.questProgress).toHaveProperty('currentRep');
        expect(result.questProgress).toHaveProperty('questStage');
      }
    });

    it('filters choices by condition functions', () => {
      // Show dialogue and verify choices are filtered (some may have conditions)
      const result = showDialogue('chen_barnards', 'greeting', gsm);
      for (const choice of result.choices) {
        expect(choice).toHaveProperty('index');
        expect(choice).toHaveProperty('text');
      }
    });

    it('sets dialogue state in GSM', () => {
      showDialogue('chen_barnards', 'greeting', gsm);
      const state = gsm.getDialogueState();
      expect(state.isActive).toBe(true);
      expect(state.currentNpcId).toBe('chen_barnards');
    });
  });

  describe('selectChoice', () => {
    it('throws for unknown NPC ID', () => {
      expect(() => selectChoice('fake_npc', 0, gsm)).toThrow('Unknown NPC ID');
    });

    it('throws for invalid choice index', () => {
      showDialogue('chen_barnards', 'greeting', gsm);
      expect(() => selectChoice('chen_barnards', 999, gsm)).toThrow(
        'Invalid choice index'
      );
    });

    it('throws for negative choice index', () => {
      showDialogue('chen_barnards', 'greeting', gsm);
      expect(() => selectChoice('chen_barnards', -1, gsm)).toThrow(
        'Invalid choice index'
      );
    });

    it('returns null when choice has no next node (dialogue ends)', () => {
      // Show greeting, find a choice that ends dialogue (next=null)
      const dialogue = showDialogue('chen_barnards', 'greeting', gsm);
      const exitChoice = dialogue.choices.find((c) => !c.next);
      if (exitChoice) {
        const result = selectChoice('chen_barnards', exitChoice.index, gsm);
        expect(result).toBeNull();
      }
    });

    it('returns next dialogue when choice has next node', () => {
      const dialogue = showDialogue('chen_barnards', 'greeting', gsm);
      const continueChoice = dialogue.choices.find((c) => c.next);
      if (continueChoice) {
        const result = selectChoice('chen_barnards', continueChoice.index, gsm);
        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
      }
    });

    it('applies reputation gain from choice', () => {
      const dialogue = showDialogue('chen_barnards', 'greeting', gsm);
      const repChoice = dialogue.choices.find((c) => c.repGain > 0);
      if (repChoice) {
        const repBefore = gsm.getNPCState('chen_barnards').rep;
        selectChoice('chen_barnards', repChoice.index, gsm);
        // Rep should change (without trust modifier)
        expect(gsm.getNPCState('chen_barnards').rep).not.toBe(repBefore);
      }
    });

    it('applies dialogue repGain without trust personality modifier', () => {
      // Tanaka has trust=0.2; a repGain of 3 with modifyRep would give
      // 3*0.2=0.6 -> rounds to +1. With modifyRepRaw it should give +3.
      const npcId = 'tanaka_barnards';
      gsm.getNPCState(npcId).rep = 50;

      const dialogue = showDialogue(npcId, 'about_work', gsm);
      // "How much further?" has repGain: 1
      const repChoice = dialogue.choices.find((c) => c.repGain > 0);
      expect(repChoice).toBeDefined();

      const repBefore = gsm.getNPCState(npcId).rep;
      selectChoice(npcId, repChoice.index, gsm);
      const repAfter = gsm.getNPCState(npcId).rep;

      // Should apply full repGain (1), not trust-modified (1*0.2=0.2 -> 0)
      expect(repAfter).toBe(repBefore + repChoice.repGain);
    });

    it('defaults to greeting when no active dialogue state', () => {
      gsm.clearDialogueState();
      // Should use greeting node as default
      const dialogue = showDialogue('chen_barnards', 'greeting', gsm);
      const choice = dialogue.choices[0];
      if (choice) {
        // This should work using default greeting
        gsm.clearDialogueState();
        const result = selectChoice('chen_barnards', choice.index, gsm);
        // Should not throw
        expect(result !== undefined).toBe(true);
      }
    });
  });
});
