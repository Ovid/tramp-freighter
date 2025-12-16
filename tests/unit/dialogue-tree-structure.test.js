import { describe, it, expect } from 'vitest';
import {
  WEI_CHEN_DIALOGUE,
  MARCUS_COLE_DIALOGUE,
  FATHER_OKONKWO_DIALOGUE,
  ALL_DIALOGUE_TREES,
  validateDialogueTree,
  validateDialogueNode,
  validateDialogueChoice,
  validateAllDialogueTrees,
} from '../../src/game/data/dialogue-trees.js';
import { REPUTATION_BOUNDS } from '../../src/game/constants.js';

/**
 * Unit tests for dialogue tree structure
 * Feature: npc-foundation
 *
 * **Validates: Requirements 9.4, 11.2**
 *
 * Verifies that dialogue trees have the correct structure, greeting nodes exist,
 * and reputation-gated choices have proper condition functions.
 */
describe('Dialogue Tree Structure', () => {
  describe('Wei Chen Dialogue Tree', () => {
    it('should have greeting node with expected choices', () => {
      expect(WEI_CHEN_DIALOGUE.greeting).toBeDefined();
      expect(WEI_CHEN_DIALOGUE.greeting.text).toBeDefined();
      expect(typeof WEI_CHEN_DIALOGUE.greeting.text).toBe('function');
      expect(Array.isArray(WEI_CHEN_DIALOGUE.greeting.choices)).toBe(true);
      expect(WEI_CHEN_DIALOGUE.greeting.choices.length).toBeGreaterThan(0);

      // Check for expected choice texts
      const choiceTexts = WEI_CHEN_DIALOGUE.greeting.choices.map(
        (choice) => choice.text
      );
      expect(choiceTexts).toContain('Just making conversation. How\'s work?');
      expect(choiceTexts).toContain('Tell me about yourself.');
      expect(choiceTexts).toContain('Nothing right now. Take care.');
    });

    it('should have backstory choice with condition function requiring rep >= 30', () => {
      const backstoryChoice = WEI_CHEN_DIALOGUE.greeting.choices.find(
        (choice) => choice.text === 'Tell me about yourself.'
      );

      expect(backstoryChoice).toBeDefined();
      expect(backstoryChoice.next).toBe('backstory');
      expect(typeof backstoryChoice.condition).toBe('function');

      // Test the condition function
      expect(backstoryChoice.condition(29)).toBe(false); // Below threshold
      expect(backstoryChoice.condition(30)).toBe(true); // At threshold
      expect(backstoryChoice.condition(50)).toBe(true); // Above threshold
    });

    it('should have all required dialogue nodes', () => {
      const requiredNodes = [
        'greeting',
        'small_talk',
        'boring_response',
        'honest_work',
        'backstory',
        'backstory_2',
      ];

      requiredNodes.forEach((nodeId) => {
        expect(WEI_CHEN_DIALOGUE[nodeId]).toBeDefined();
        expect(WEI_CHEN_DIALOGUE[nodeId].text).toBeDefined();
        expect(Array.isArray(WEI_CHEN_DIALOGUE[nodeId].choices)).toBe(true);
      });
    });

    it('should have function-based text for greeting node', () => {
      expect(typeof WEI_CHEN_DIALOGUE.greeting.text).toBe('function');

      // Test different reputation levels generate different text
      const hostileText = WEI_CHEN_DIALOGUE.greeting.text(-60);
      const neutralText = WEI_CHEN_DIALOGUE.greeting.text(0);
      const friendlyText = WEI_CHEN_DIALOGUE.greeting.text(40);

      expect(typeof hostileText).toBe('string');
      expect(typeof neutralText).toBe('string');
      expect(typeof friendlyText).toBe('string');
      expect(hostileText).not.toBe(neutralText);
      expect(neutralText).not.toBe(friendlyText);
    });

    it('should have story flags in backstory nodes', () => {
      expect(WEI_CHEN_DIALOGUE.backstory.flags).toBeDefined();
      expect(Array.isArray(WEI_CHEN_DIALOGUE.backstory.flags)).toBe(true);
      expect(WEI_CHEN_DIALOGUE.backstory.flags).toContain('chen_backstory_1');

      expect(WEI_CHEN_DIALOGUE.backstory_2.flags).toBeDefined();
      expect(Array.isArray(WEI_CHEN_DIALOGUE.backstory_2.flags)).toBe(true);
      expect(WEI_CHEN_DIALOGUE.backstory_2.flags).toContain('chen_backstory_2');
    });
  });

  describe('Marcus Cole Dialogue Tree', () => {
    it('should exist and have greeting node', () => {
      expect(MARCUS_COLE_DIALOGUE).toBeDefined();
      expect(MARCUS_COLE_DIALOGUE.greeting).toBeDefined();
      expect(MARCUS_COLE_DIALOGUE.greeting.text).toBeDefined();
      expect(typeof MARCUS_COLE_DIALOGUE.greeting.text).toBe('function');
      expect(Array.isArray(MARCUS_COLE_DIALOGUE.greeting.choices)).toBe(true);
      expect(MARCUS_COLE_DIALOGUE.greeting.choices.length).toBeGreaterThan(0);
    });

    it('should have expected choice structure in greeting', () => {
      const choiceTexts = MARCUS_COLE_DIALOGUE.greeting.choices.map(
        (choice) => choice.text
      );
      expect(choiceTexts).toContain('About my debt...');
      expect(choiceTexts).toContain('I wanted to discuss business opportunities.');
      expect(choiceTexts).toContain('Just checking in. I\'ll be going now.');
    });

    it('should have business choice with reputation condition', () => {
      const businessChoice = MARCUS_COLE_DIALOGUE.greeting.choices.find(
        (choice) => choice.text === 'I wanted to discuss business opportunities.'
      );

      expect(businessChoice).toBeDefined();
      expect(businessChoice.next).toBe('business');
      expect(typeof businessChoice.condition).toBe('function');

      // Test the condition function (rep >= NEUTRAL_MIN which is -9)
      expect(businessChoice.condition(-10)).toBe(false); // Below threshold
      expect(businessChoice.condition(-9)).toBe(true); // At threshold
      expect(businessChoice.condition(0)).toBe(true); // Above threshold
    });

    it('should have all required dialogue nodes', () => {
      const requiredNodes = [
        'greeting',
        'debt_talk',
        'payment_plan',
        'defiant_response',
        'business',
        'business_details',
      ];

      requiredNodes.forEach((nodeId) => {
        expect(MARCUS_COLE_DIALOGUE[nodeId]).toBeDefined();
        expect(MARCUS_COLE_DIALOGUE[nodeId].text).toBeDefined();
        expect(Array.isArray(MARCUS_COLE_DIALOGUE[nodeId].choices)).toBe(true);
      });
    });
  });

  describe('Father Okonkwo Dialogue Tree', () => {
    it('should exist and have greeting node', () => {
      expect(FATHER_OKONKWO_DIALOGUE).toBeDefined();
      expect(FATHER_OKONKWO_DIALOGUE.greeting).toBeDefined();
      expect(FATHER_OKONKWO_DIALOGUE.greeting.text).toBeDefined();
      expect(typeof FATHER_OKONKWO_DIALOGUE.greeting.text).toBe('function');
      expect(Array.isArray(FATHER_OKONKWO_DIALOGUE.greeting.choices)).toBe(
        true
      );
      expect(FATHER_OKONKWO_DIALOGUE.greeting.choices.length).toBeGreaterThan(
        0
      );
    });

    it('should have expected choice structure in greeting', () => {
      const choiceTexts = FATHER_OKONKWO_DIALOGUE.greeting.choices.map(
        (choice) => choice.text
      );
      expect(choiceTexts).toContain('Tell me about your faith.');
      expect(choiceTexts).toContain('I could use some help.');
      expect(choiceTexts).toContain('Just passing through. Thank you.');
    });

    it('should have help choice with reputation condition', () => {
      const helpChoice = FATHER_OKONKWO_DIALOGUE.greeting.choices.find(
        (choice) => choice.text === 'I could use some help.'
      );

      expect(helpChoice).toBeDefined();
      expect(helpChoice.next).toBe('help');
      expect(typeof helpChoice.condition).toBe('function');

      // Test the condition function (rep >= 10)
      expect(helpChoice.condition(9)).toBe(false); // Below threshold
      expect(helpChoice.condition(10)).toBe(true); // At threshold
      expect(helpChoice.condition(20)).toBe(true); // Above threshold
    });

    it('should have all required dialogue nodes', () => {
      const requiredNodes = [
        'greeting',
        'faith_talk',
        'agree',
        'skeptical',
        'help',
        'help_details',
      ];

      requiredNodes.forEach((nodeId) => {
        expect(FATHER_OKONKWO_DIALOGUE[nodeId]).toBeDefined();
        expect(FATHER_OKONKWO_DIALOGUE[nodeId].text).toBeDefined();
        expect(Array.isArray(FATHER_OKONKWO_DIALOGUE[nodeId].choices)).toBe(
          true
        );
      });
    });

    it('should have story flags in help_details node', () => {
      expect(FATHER_OKONKWO_DIALOGUE.help_details.flags).toBeDefined();
      expect(
        Array.isArray(FATHER_OKONKWO_DIALOGUE.help_details.flags)
      ).toBe(true);
      expect(FATHER_OKONKWO_DIALOGUE.help_details.flags).toContain(
        'okonkwo_help_offered'
      );
    });
  });

  describe('Dialogue Tree Collection and Validation', () => {
    it('should include all three NPCs in ALL_DIALOGUE_TREES', () => {
      expect(ALL_DIALOGUE_TREES.chen_barnards).toBe(WEI_CHEN_DIALOGUE);
      expect(ALL_DIALOGUE_TREES.cole_sol).toBe(MARCUS_COLE_DIALOGUE);
      expect(ALL_DIALOGUE_TREES.okonkwo_ross154).toBe(FATHER_OKONKWO_DIALOGUE);
    });

    it('should validate all dialogue trees without throwing errors', () => {
      expect(() => validateDialogueTree(WEI_CHEN_DIALOGUE)).not.toThrow();
      expect(() => validateDialogueTree(MARCUS_COLE_DIALOGUE)).not.toThrow();
      expect(() => validateDialogueTree(FATHER_OKONKWO_DIALOGUE)).not.toThrow();
    });

    it('should validate all dialogue trees using validateAllDialogueTrees function', () => {
      expect(() => validateAllDialogueTrees()).not.toThrow();
    });

    it('should throw error for dialogue tree missing greeting node', () => {
      const invalidTree = {
        some_node: {
          text: 'Test text',
          choices: [],
        },
      };

      expect(() => validateDialogueTree(invalidTree)).toThrow(
        'Dialogue tree must have a greeting node'
      );
    });

    it('should throw error for dialogue node missing text', () => {
      const invalidNode = {
        choices: [],
      };

      expect(() => validateDialogueNode('test_node', invalidNode)).toThrow(
        "Dialogue node 'test_node' must have text property"
      );
    });

    it('should throw error for dialogue node with invalid text type', () => {
      const invalidNode = {
        text: 123, // Should be string or function
        choices: [],
      };

      expect(() => validateDialogueNode('test_node', invalidNode)).toThrow(
        "Dialogue node 'test_node' text must be string or function"
      );
    });

    it('should throw error for dialogue node missing choices array', () => {
      const invalidNode = {
        text: 'Test text',
      };

      expect(() => validateDialogueNode('test_node', invalidNode)).toThrow(
        "Dialogue node 'test_node' must have choices array"
      );
    });

    it('should throw error for dialogue choice missing text', () => {
      const invalidChoice = {
        next: 'some_node',
      };

      expect(() =>
        validateDialogueChoice('test_node', 0, invalidChoice)
      ).toThrow("Choice 0 in node 'test_node' must have text string");
    });

    it('should throw error for dialogue choice with invalid next type', () => {
      const invalidChoice = {
        text: 'Test choice',
        next: 123, // Should be string or null
      };

      expect(() =>
        validateDialogueChoice('test_node', 0, invalidChoice)
      ).toThrow("Choice 0 in node 'test_node' next must be string or null");
    });

    it('should throw error for dialogue choice with invalid repGain type', () => {
      const invalidChoice = {
        text: 'Test choice',
        next: null,
        repGain: 'invalid', // Should be number
      };

      expect(() =>
        validateDialogueChoice('test_node', 0, invalidChoice)
      ).toThrow("Choice 0 in node 'test_node' repGain must be number");
    });

    it('should throw error for dialogue choice with invalid condition type', () => {
      const invalidChoice = {
        text: 'Test choice',
        next: null,
        condition: 'invalid', // Should be function
      };

      expect(() =>
        validateDialogueChoice('test_node', 0, invalidChoice)
      ).toThrow("Choice 0 in node 'test_node' condition must be function");
    });
  });

  describe('Reputation-Based Text Generation', () => {
    it('should generate different greeting text for different reputation levels', () => {
      // Test Wei Chen's greeting function
      const weiChenGreeting = WEI_CHEN_DIALOGUE.greeting.text;
      const hostileText = weiChenGreeting(REPUTATION_BOUNDS.MIN);
      const neutralText = weiChenGreeting(0);
      const friendlyText = weiChenGreeting(REPUTATION_BOUNDS.FRIENDLY_MIN);

      expect(hostileText).not.toBe(neutralText);
      expect(neutralText).not.toBe(friendlyText);
      expect(hostileText).not.toBe(friendlyText);

      // Test Marcus Cole's greeting function
      const marcusGreeting = MARCUS_COLE_DIALOGUE.greeting.text;
      const marcusHostileText = marcusGreeting(REPUTATION_BOUNDS.MIN);
      const marcusNeutralText = marcusGreeting(0);
      const marcusWarmText = marcusGreeting(REPUTATION_BOUNDS.WARM_MIN);

      expect(marcusHostileText).not.toBe(marcusNeutralText);
      expect(marcusNeutralText).not.toBe(marcusWarmText);

      // Test Father Okonkwo's greeting function
      const okonkwoGreeting = FATHER_OKONKWO_DIALOGUE.greeting.text;
      const okonkwoHostileText = okonkwoGreeting(REPUTATION_BOUNDS.MIN);
      const okonkwoNeutralText = okonkwoGreeting(0);
      const okonkwoFriendlyText = okonkwoGreeting(REPUTATION_BOUNDS.FRIENDLY_MIN);

      expect(okonkwoHostileText).not.toBe(okonkwoNeutralText);
      expect(okonkwoNeutralText).not.toBe(okonkwoFriendlyText);
    });

    it('should have function-based text in backstory node for Wei Chen', () => {
      expect(typeof WEI_CHEN_DIALOGUE.backstory.text).toBe('function');

      const friendlyText = WEI_CHEN_DIALOGUE.backstory.text(
        REPUTATION_BOUNDS.FRIENDLY_MIN
      );
      const trustedText = WEI_CHEN_DIALOGUE.backstory.text(
        REPUTATION_BOUNDS.TRUSTED_MIN
      );

      expect(typeof friendlyText).toBe('string');
      expect(typeof trustedText).toBe('string');
      expect(friendlyText).not.toBe(trustedText);
    });
  });

  describe('Reputation Conditions', () => {
    it('should have correct reputation thresholds for gated choices', () => {
      // Wei Chen backstory requires rep >= 30 (FRIENDLY_MIN)
      const weiChenBackstoryChoice = WEI_CHEN_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'backstory'
      );
      expect(weiChenBackstoryChoice.condition(REPUTATION_BOUNDS.FRIENDLY_MIN - 1)).toBe(false);
      expect(weiChenBackstoryChoice.condition(REPUTATION_BOUNDS.FRIENDLY_MIN)).toBe(true);

      // Marcus Cole business requires rep >= NEUTRAL_MIN (-9)
      const marcusBusinessChoice = MARCUS_COLE_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'business'
      );
      expect(marcusBusinessChoice.condition(REPUTATION_BOUNDS.NEUTRAL_MIN - 1)).toBe(false);
      expect(marcusBusinessChoice.condition(REPUTATION_BOUNDS.NEUTRAL_MIN)).toBe(true);

      // Father Okonkwo help requires rep >= 10 (WARM_MIN)
      const okonkwoHelpChoice = FATHER_OKONKWO_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'help'
      );
      expect(okonkwoHelpChoice.condition(REPUTATION_BOUNDS.WARM_MIN - 1)).toBe(false);
      expect(okonkwoHelpChoice.condition(REPUTATION_BOUNDS.WARM_MIN)).toBe(true);
    });
  });

  describe('Reputation Gains and Losses', () => {
    it('should have appropriate reputation changes for dialogue choices', () => {
      // Wei Chen small_talk choices
      const boringChoice = WEI_CHEN_DIALOGUE.small_talk.choices.find(
        (choice) => choice.text === 'Sounds boring.'
      );
      expect(boringChoice.repGain).toBe(-2);

      const honestWorkChoice = WEI_CHEN_DIALOGUE.small_talk.choices.find(
        (choice) => choice.text === 'Honest work is good work.'
      );
      expect(honestWorkChoice.repGain).toBe(3);

      // Marcus Cole debt_talk choices
      const defiantChoice = MARCUS_COLE_DIALOGUE.debt_talk.choices.find(
        (choice) => choice.text === "I'll pay when I can. Don't threaten me."
      );
      expect(defiantChoice.repGain).toBe(-5);

      // Father Okonkwo faith_talk choices
      const agreeChoice = FATHER_OKONKWO_DIALOGUE.faith_talk.choices.find(
        (choice) => choice.text === "That's a beautiful way to put it."
      );
      expect(agreeChoice.repGain).toBe(3);
    });
  });
});