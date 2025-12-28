import { describe, it, expect } from 'vitest';
import {
  WEI_CHEN_DIALOGUE,
  MARCUS_COLE_DIALOGUE,
  FATHER_OKONKWO_DIALOGUE,
  WHISPER_DIALOGUE,
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
 * **Validates: npc-foundation Requirements 9.4, 11.2**
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

      // Check for expected dialogue options
      const dialogueOptions = WEI_CHEN_DIALOGUE.greeting.choices.map(
        (choice) => choice.text
      );
      expect(dialogueOptions).toContain(
        "Just making conversation. How's work?"
      );
      expect(dialogueOptions).toContain('Tell me about yourself.');
      expect(dialogueOptions).toContain('Nothing right now. Take care.');
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
      const hostileGreeting = WEI_CHEN_DIALOGUE.greeting.text(-60);
      const neutralGreeting = WEI_CHEN_DIALOGUE.greeting.text(0);
      const friendlyGreeting = WEI_CHEN_DIALOGUE.greeting.text(40);

      expect(typeof hostileGreeting).toBe('string');
      expect(typeof neutralGreeting).toBe('string');
      expect(typeof friendlyGreeting).toBe('string');
      expect(hostileGreeting).not.toBe(neutralGreeting);
      expect(neutralGreeting).not.toBe(friendlyGreeting);
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
      const conversationChoices = MARCUS_COLE_DIALOGUE.greeting.choices.map(
        (choice) => choice.text
      );
      expect(conversationChoices).toContain('About my debt...');
      expect(conversationChoices).toContain(
        'I wanted to discuss business opportunities.'
      );
      expect(conversationChoices).toContain(
        "Just checking in. I'll be going now."
      );
    });

    it('should have business choice with reputation condition', () => {
      const businessChoice = MARCUS_COLE_DIALOGUE.greeting.choices.find(
        (choice) =>
          choice.text === 'I wanted to discuss business opportunities.'
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
      const playerResponses = FATHER_OKONKWO_DIALOGUE.greeting.choices.map(
        (choice) => choice.text
      );
      expect(playerResponses).toContain('Tell me about your faith.');
      expect(playerResponses).toContain('I could use some help.');
      expect(playerResponses).toContain('Just passing through. Thank you.');
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
      expect(Array.isArray(FATHER_OKONKWO_DIALOGUE.help_details.flags)).toBe(
        true
      );
      expect(FATHER_OKONKWO_DIALOGUE.help_details.flags).toContain(
        'okonkwo_help_offered'
      );
    });
  });

  describe('Whisper Dialogue Tree', () => {
    it('should exist and have greeting node', () => {
      expect(WHISPER_DIALOGUE).toBeDefined();
      expect(WHISPER_DIALOGUE.greeting).toBeDefined();
      expect(WHISPER_DIALOGUE.greeting.text).toBeDefined();
      expect(typeof WHISPER_DIALOGUE.greeting.text).toBe('function');
      expect(Array.isArray(WHISPER_DIALOGUE.greeting.choices)).toBe(true);
      expect(WHISPER_DIALOGUE.greeting.choices.length).toBeGreaterThan(0);
    });

    it('should have expected choice structure in greeting', () => {
      const conversationChoices = WHISPER_DIALOGUE.greeting.choices.map(
        (choice) => choice.text
      );
      expect(conversationChoices).toContain('Tell me about your information services.');
      expect(conversationChoices).toContain('Any trading tips for me?');
      expect(conversationChoices).toContain('I need an emergency loan.');
      expect(conversationChoices).toContain('Can you store some cargo for me?');
      expect(conversationChoices).toContain('Nothing right now. Until next time.');
    });

    it('should have tip choice with reputation condition', () => {
      const tipChoice = WHISPER_DIALOGUE.greeting.choices.find(
        (choice) => choice.text === 'Any trading tips for me?'
      );

      expect(tipChoice).toBeDefined();
      expect(tipChoice.next).toBe('ask_tip');
      expect(typeof tipChoice.condition).toBe('function');

      // Test the condition function (rep >= WARM_MIN which is 10)
      expect(tipChoice.condition(9)).toBe(false); // Below threshold
      expect(tipChoice.condition(10)).toBe(true); // At threshold
      expect(tipChoice.condition(20)).toBe(true); // Above threshold
    });

    it('should have loan choice with reputation condition', () => {
      const loanChoice = WHISPER_DIALOGUE.greeting.choices.find(
        (choice) => choice.text === 'I need an emergency loan.'
      );

      expect(loanChoice).toBeDefined();
      expect(loanChoice.next).toBe('request_loan');
      expect(typeof loanChoice.condition).toBe('function');

      // Test the condition function (rep >= TRUSTED_MIN which is 60)
      expect(loanChoice.condition(59)).toBe(false); // Below threshold
      expect(loanChoice.condition(60)).toBe(true); // At threshold
      expect(loanChoice.condition(70)).toBe(true); // Above threshold
    });

    it('should have storage choice with reputation condition', () => {
      const storageChoice = WHISPER_DIALOGUE.greeting.choices.find(
        (choice) => choice.text === 'Can you store some cargo for me?'
      );

      expect(storageChoice).toBeDefined();
      expect(storageChoice.next).toBe('request_storage');
      expect(typeof storageChoice.condition).toBe('function');

      // Test the condition function (rep >= FRIENDLY_MIN which is 30)
      expect(storageChoice.condition(29)).toBe(false); // Below threshold
      expect(storageChoice.condition(30)).toBe(true); // At threshold
      expect(storageChoice.condition(40)).toBe(true); // Above threshold
    });

    it('should have all required dialogue nodes', () => {
      const requiredNodes = [
        'greeting',
        'intel_business',
        'intel_details',
        'intel_prices',
        'ask_tip',
        'request_loan',
        'request_storage',
      ];

      requiredNodes.forEach((nodeId) => {
        expect(WHISPER_DIALOGUE[nodeId]).toBeDefined();
        expect(WHISPER_DIALOGUE[nodeId].text).toBeDefined();
        expect(Array.isArray(WHISPER_DIALOGUE[nodeId].choices)).toBe(true);
      });
    });

    it('should have tier-based greeting text matching requirements', () => {
      const greetingText = WHISPER_DIALOGUE.greeting.text;
      
      // Test specific greeting text from requirements
      expect(greetingText(REPUTATION_BOUNDS.NEUTRAL_MIN)).toBe('Welcome. I deal in information. What do you need?');
      expect(greetingText(REPUTATION_BOUNDS.WARM_MIN)).toBe('Ah, a familiar face. Looking for intel?');
      expect(greetingText(REPUTATION_BOUNDS.FRIENDLY_MIN)).toBe('Good to see you. I have something interesting.');
      expect(greetingText(REPUTATION_BOUNDS.TRUSTED_MIN)).toBe("I've been expecting you. We need to talk.");
      expect(greetingText(REPUTATION_BOUNDS.COLD_MIN)).toBe('Information costs credits.');
      expect(greetingText(REPUTATION_BOUNDS.MIN)).toBe('Information costs credits.');
    });

    it('should have story flags in dialogue nodes', () => {
      expect(WHISPER_DIALOGUE.ask_tip.flags).toBeDefined();
      expect(Array.isArray(WHISPER_DIALOGUE.ask_tip.flags)).toBe(true);
      expect(WHISPER_DIALOGUE.ask_tip.flags).toContain('whisper_tip_requested');

      expect(WHISPER_DIALOGUE.request_loan.flags).toBeDefined();
      expect(Array.isArray(WHISPER_DIALOGUE.request_loan.flags)).toBe(true);
      expect(WHISPER_DIALOGUE.request_loan.flags).toContain('whisper_loan_discussed');

      expect(WHISPER_DIALOGUE.request_storage.flags).toBeDefined();
      expect(Array.isArray(WHISPER_DIALOGUE.request_storage.flags)).toBe(true);
      expect(WHISPER_DIALOGUE.request_storage.flags).toContain('whisper_storage_discussed');
    });
  });

  describe('Dialogue Tree Collection and Validation', () => {
    it('should include all four NPCs in ALL_DIALOGUE_TREES', () => {
      expect(ALL_DIALOGUE_TREES.chen_barnards).toBe(WEI_CHEN_DIALOGUE);
      expect(ALL_DIALOGUE_TREES.cole_sol).toBe(MARCUS_COLE_DIALOGUE);
      expect(ALL_DIALOGUE_TREES.okonkwo_ross154).toBe(FATHER_OKONKWO_DIALOGUE);
      expect(ALL_DIALOGUE_TREES.whisper_sirius).toBe(WHISPER_DIALOGUE);
    });

    it('should validate all dialogue trees without throwing errors', () => {
      expect(() => validateDialogueTree(WEI_CHEN_DIALOGUE)).not.toThrow();
      expect(() => validateDialogueTree(MARCUS_COLE_DIALOGUE)).not.toThrow();
      expect(() => validateDialogueTree(FATHER_OKONKWO_DIALOGUE)).not.toThrow();
      expect(() => validateDialogueTree(WHISPER_DIALOGUE)).not.toThrow();
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
      const hostileWeiGreeting = weiChenGreeting(REPUTATION_BOUNDS.MIN);
      const neutralWeiGreeting = weiChenGreeting(0);
      const friendlyWeiGreeting = weiChenGreeting(
        REPUTATION_BOUNDS.FRIENDLY_MIN
      );

      expect(hostileWeiGreeting).not.toBe(neutralWeiGreeting);
      expect(neutralWeiGreeting).not.toBe(friendlyWeiGreeting);
      expect(hostileWeiGreeting).not.toBe(friendlyWeiGreeting);

      // Test Marcus Cole's greeting function
      const marcusGreeting = MARCUS_COLE_DIALOGUE.greeting.text;
      const marcusHostileGreeting = marcusGreeting(REPUTATION_BOUNDS.MIN);
      const marcusNeutralGreeting = marcusGreeting(0);
      const marcusWarmGreeting = marcusGreeting(REPUTATION_BOUNDS.WARM_MIN);

      expect(marcusHostileGreeting).not.toBe(marcusNeutralGreeting);
      expect(marcusNeutralGreeting).not.toBe(marcusWarmGreeting);

      // Test Father Okonkwo's greeting function
      const okonkwoGreeting = FATHER_OKONKWO_DIALOGUE.greeting.text;
      const okonkwoHostileGreeting = okonkwoGreeting(REPUTATION_BOUNDS.MIN);
      const okonkwoNeutralGreeting = okonkwoGreeting(0);
      const okonkwoFriendlyGreeting = okonkwoGreeting(
        REPUTATION_BOUNDS.FRIENDLY_MIN
      );

      expect(okonkwoHostileGreeting).not.toBe(okonkwoNeutralGreeting);
      expect(okonkwoNeutralGreeting).not.toBe(okonkwoFriendlyGreeting);

      // Test Whisper's greeting function
      const whisperGreeting = WHISPER_DIALOGUE.greeting.text;
      const whisperHostileGreeting = whisperGreeting(REPUTATION_BOUNDS.MIN);
      const whisperNeutralGreeting = whisperGreeting(0);
      const whisperFriendlyGreeting = whisperGreeting(
        REPUTATION_BOUNDS.FRIENDLY_MIN
      );

      expect(whisperHostileGreeting).not.toBe(whisperNeutralGreeting);
      expect(whisperNeutralGreeting).not.toBe(whisperFriendlyGreeting);
    });

    it('should have function-based text in backstory node for Wei Chen', () => {
      expect(typeof WEI_CHEN_DIALOGUE.backstory.text).toBe('function');

      const friendlyBackstory = WEI_CHEN_DIALOGUE.backstory.text(
        REPUTATION_BOUNDS.FRIENDLY_MIN
      );
      const trustedBackstory = WEI_CHEN_DIALOGUE.backstory.text(
        REPUTATION_BOUNDS.TRUSTED_MIN
      );

      expect(typeof friendlyBackstory).toBe('string');
      expect(typeof trustedBackstory).toBe('string');
      expect(friendlyBackstory).not.toBe(trustedBackstory);
    });
  });

  describe('Reputation Conditions', () => {
    it('should have correct reputation thresholds for gated choices', () => {
      // Wei Chen backstory requires rep >= 30 (FRIENDLY_MIN)
      const weiChenBackstoryChoice = WEI_CHEN_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'backstory'
      );
      expect(
        weiChenBackstoryChoice.condition(REPUTATION_BOUNDS.FRIENDLY_MIN - 1)
      ).toBe(false);
      expect(
        weiChenBackstoryChoice.condition(REPUTATION_BOUNDS.FRIENDLY_MIN)
      ).toBe(true);

      // Marcus Cole business requires rep >= NEUTRAL_MIN (-9)
      const marcusBusinessChoice = MARCUS_COLE_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'business'
      );
      expect(
        marcusBusinessChoice.condition(REPUTATION_BOUNDS.NEUTRAL_MIN - 1)
      ).toBe(false);
      expect(
        marcusBusinessChoice.condition(REPUTATION_BOUNDS.NEUTRAL_MIN)
      ).toBe(true);

      // Father Okonkwo help requires rep >= 10 (WARM_MIN)
      const okonkwoHelpChoice = FATHER_OKONKWO_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'help'
      );
      expect(okonkwoHelpChoice.condition(REPUTATION_BOUNDS.WARM_MIN - 1)).toBe(
        false
      );
      expect(okonkwoHelpChoice.condition(REPUTATION_BOUNDS.WARM_MIN)).toBe(
        true
      );
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
