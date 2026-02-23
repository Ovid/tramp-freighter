import { describe, it, expect } from 'vitest';
import {
  WEI_CHEN_DIALOGUE,
  MARCUS_COLE_DIALOGUE,
  FATHER_OKONKWO_DIALOGUE,
  WHISPER_DIALOGUE,
  CAPTAIN_VASQUEZ_DIALOGUE,
  DR_SARAH_KIM_DIALOGUE,
  RUSTY_RODRIGUEZ_DIALOGUE,
  ZARA_OSMAN_DIALOGUE,
  STATION_MASTER_KOWALSKI_DIALOGUE,
  LUCKY_LIU_DIALOGUE,
  ALL_DIALOGUE_TREES,
  validateDialogueTree,
  validateDialogueNode,
  validateDialogueChoice,
  validateAllDialogueTrees,
} from '../../src/game/data/dialogue-trees.js';
import { REPUTATION_BOUNDS } from '../../src/game/constants.js';

/**
 * Unit tests for dialogue tree structure validation
 * Feature: npc-benefits
 *
 * **Validates: Requirements 12.1-12.6**
 *
 * Verifies that dialogue trees have the correct structure, greeting nodes exist,
 * and reputation-gated choices have proper condition functions.
 */
describe('Dialogue Tree Structure', () => {
  describe('Wei Chen Dialogue Tree', () => {
    it('should have greeting node with expected behavior', () => {
      expect(WEI_CHEN_DIALOGUE.greeting).toBeDefined();
      expect(WEI_CHEN_DIALOGUE.greeting.text).toBeDefined();
      expect(typeof WEI_CHEN_DIALOGUE.greeting.text).toBe('function');
      expect(Array.isArray(WEI_CHEN_DIALOGUE.greeting.choices)).toBe(true);
      expect(WEI_CHEN_DIALOGUE.greeting.choices.length).toBeGreaterThan(0);

      // Create mock context for condition functions that need it
      const mockContext = {
        canGetTip: { available: true },
        canRequestLoan: { available: true },
        canRequestStorage: { available: true },
        npcState: { loanAmount: 0, storedCargo: [] },
        daysElapsed: 1,
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
      };

      // Test behavior: verify choices appear/disappear based on reputation
      const lowRepChoices = WEI_CHEN_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition || choice.condition(0, mockContext)
      );
      const highRepChoices = WEI_CHEN_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition || choice.condition(50, mockContext)
      );

      // High reputation should have more choices available
      expect(highRepChoices.length).toBeGreaterThanOrEqual(
        lowRepChoices.length
      );

      // Should have at least one unconditional choice (exit option)
      const unconditionalChoices = WEI_CHEN_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition
      );
      expect(unconditionalChoices.length).toBeGreaterThan(0);
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

    it('should have expected choice behavior in greeting', () => {
      // Test behavior: verify business choice appears based on reputation
      const businessChoice = MARCUS_COLE_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'business'
      );
      expect(businessChoice).toBeDefined();
      expect(typeof businessChoice.condition).toBe('function');

      // Create mock context for condition functions that need it
      const mockContext = {
        canGetTip: { available: true },
        canRequestLoan: { available: true },
        canRequestStorage: { available: true },
        npcState: { loanAmount: 0, storedCargo: [] },
        daysElapsed: 1,
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
      };

      // Low reputation should not have business option available
      const lowRepChoices = MARCUS_COLE_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition || choice.condition(-20, mockContext)
      );
      const highRepChoices = MARCUS_COLE_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition || choice.condition(10, mockContext)
      );

      expect(highRepChoices.length).toBeGreaterThan(lowRepChoices.length);

      // Should always have debt and exit options regardless of reputation
      const unconditionalChoices = MARCUS_COLE_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition
      );
      expect(unconditionalChoices.length).toBeGreaterThanOrEqual(2);
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

    it('should have expected choice behavior in greeting', () => {
      // Test behavior: verify help choice appears based on reputation
      const helpChoice = FATHER_OKONKWO_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'help'
      );
      expect(helpChoice).toBeDefined();
      expect(typeof helpChoice.condition).toBe('function');

      // Create mock context for condition functions that need it
      const mockContext = {
        canGetTip: { available: true },
        canRequestLoan: { available: true },
        canRequestStorage: { available: true },
        npcState: { loanAmount: 0, storedCargo: [] },
        daysElapsed: 1,
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
      };

      // Low reputation should not have help option available
      const lowRepChoices = FATHER_OKONKWO_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition || choice.condition(5, mockContext)
      );
      const highRepChoices = FATHER_OKONKWO_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition || choice.condition(15, mockContext)
      );

      expect(highRepChoices.length).toBeGreaterThan(lowRepChoices.length);

      // Should always have faith and exit options regardless of reputation
      const unconditionalChoices =
        FATHER_OKONKWO_DIALOGUE.greeting.choices.filter(
          (choice) => !choice.condition
        );
      expect(unconditionalChoices.length).toBeGreaterThanOrEqual(2);
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

    it('should have expected choice behavior in greeting', () => {
      // Test behavior: verify reputation-gated choices appear based on reputation levels
      const tipChoice = WHISPER_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'ask_tip'
      );
      const loanChoice = WHISPER_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'request_loan'
      );
      const storageChoice = WHISPER_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'request_storage'
      );

      expect(tipChoice).toBeDefined();
      expect(loanChoice).toBeDefined();
      expect(storageChoice).toBeDefined();

      // Create mock context for condition functions that need it
      const mockContext = {
        canGetTip: { available: true },
        canRequestLoan: { available: true },
        canRequestStorage: { available: true },
        npcState: { loanAmount: 0, storedCargo: [] },
        daysElapsed: 1,
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
      };

      // Test different reputation levels unlock different options
      const hostileRepChoices = WHISPER_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition || choice.condition(-50, mockContext)
      );
      const neutralRepChoices = WHISPER_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition || choice.condition(0, mockContext)
      );
      const warmRepChoices = WHISPER_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition || choice.condition(15, mockContext)
      );
      const friendlyRepChoices = WHISPER_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition || choice.condition(35, mockContext)
      );
      const trustedRepChoices = WHISPER_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition || choice.condition(65, mockContext)
      );

      // Higher reputation should unlock more options
      expect(trustedRepChoices.length).toBeGreaterThan(
        friendlyRepChoices.length
      );
      expect(friendlyRepChoices.length).toBeGreaterThan(warmRepChoices.length);
      expect(warmRepChoices.length).toBeGreaterThan(neutralRepChoices.length);
      expect(neutralRepChoices.length).toBeGreaterThanOrEqual(
        hostileRepChoices.length
      );

      // Should always have basic info and exit options
      const unconditionalChoices = WHISPER_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition
      );
      expect(unconditionalChoices.length).toBeGreaterThanOrEqual(2);
    });

    it('should have tip choice with reputation condition', () => {
      const tipChoice = WHISPER_DIALOGUE.greeting.choices.find(
        (choice) => choice.text === 'Any trading tips for me?'
      );

      expect(tipChoice).toBeDefined();
      expect(tipChoice.next).toBe('ask_tip');
      expect(typeof tipChoice.condition).toBe('function');

      // Create mock context for condition functions that need it
      const mockContext = {
        canGetTip: { available: true },
        canRequestLoan: { available: true },
        canRequestStorage: { available: true },
        npcState: { loanAmount: 0, storedCargo: [] },
        daysElapsed: 1,
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
      };

      // Test the condition function (rep >= WARM_MIN which is 10)
      expect(tipChoice.condition(9, mockContext)).toBe(false); // Below threshold
      expect(tipChoice.condition(10, mockContext)).toBe(true); // At threshold
      expect(tipChoice.condition(20, mockContext)).toBe(true); // Above threshold
    });

    it('should have loan choice with reputation condition', () => {
      const loanChoice = WHISPER_DIALOGUE.greeting.choices.find(
        (choice) => choice.text === 'I need an emergency loan.'
      );

      expect(loanChoice).toBeDefined();
      expect(loanChoice.next).toBe('request_loan');
      expect(typeof loanChoice.condition).toBe('function');

      // Create mock context for condition function
      const mockContext = {
        canGetTip: { available: true },
        canRequestLoan: { available: true },
        canRequestStorage: { available: true },
        npcState: { loanAmount: 0, storedCargo: [] },
        daysElapsed: 1,
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
      };

      // Test the condition function (rep >= TRUSTED_MIN which is 60)
      expect(loanChoice.condition(59, mockContext)).toBe(false); // Below threshold
      expect(loanChoice.condition(60, mockContext)).toBe(true); // At threshold
      expect(loanChoice.condition(70, mockContext)).toBe(true); // Above threshold
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
      expect(greetingText(REPUTATION_BOUNDS.NEUTRAL_MIN)).toBe(
        'Welcome. I deal in information. What do you need?'
      );
      expect(greetingText(REPUTATION_BOUNDS.WARM_MIN)).toBe(
        'Ah, a familiar face. Looking for intel?'
      );
      expect(greetingText(REPUTATION_BOUNDS.FRIENDLY_MIN)).toBe(
        'Good to see you. I have something interesting.'
      );
      expect(greetingText(REPUTATION_BOUNDS.TRUSTED_MIN)).toBe(
        "I've been expecting you. We need to talk."
      );
      expect(greetingText(REPUTATION_BOUNDS.COLD_MIN)).toBe(
        'Information costs credits.'
      );
      expect(greetingText(REPUTATION_BOUNDS.MIN)).toBe(
        'Information costs credits.'
      );
    });

    it('should have story flags in dialogue nodes', () => {
      expect(WHISPER_DIALOGUE.ask_tip.flags).toBeDefined();
      expect(Array.isArray(WHISPER_DIALOGUE.ask_tip.flags)).toBe(true);
      expect(WHISPER_DIALOGUE.ask_tip.flags).toContain('whisper_tip_requested');

      expect(WHISPER_DIALOGUE.request_loan.flags).toBeDefined();
      expect(Array.isArray(WHISPER_DIALOGUE.request_loan.flags)).toBe(true);
      expect(WHISPER_DIALOGUE.request_loan.flags).toContain(
        'whisper_loan_discussed'
      );

      expect(WHISPER_DIALOGUE.request_storage.flags).toBeDefined();
      expect(Array.isArray(WHISPER_DIALOGUE.request_storage.flags)).toBe(true);
      expect(WHISPER_DIALOGUE.request_storage.flags).toContain(
        'whisper_storage_discussed'
      );
    });
  });

  describe('Captain Vasquez Dialogue Tree', () => {
    it('should exist and have greeting node', () => {
      expect(CAPTAIN_VASQUEZ_DIALOGUE).toBeDefined();
      expect(CAPTAIN_VASQUEZ_DIALOGUE.greeting).toBeDefined();
      expect(CAPTAIN_VASQUEZ_DIALOGUE.greeting.text).toBeDefined();
      expect(typeof CAPTAIN_VASQUEZ_DIALOGUE.greeting.text).toBe('function');
      expect(Array.isArray(CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices)).toBe(
        true
      );
      expect(CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.length).toBeGreaterThan(
        0
      );
    });

    it('should have tier-based greeting text matching requirements', () => {
      const greetingText = CAPTAIN_VASQUEZ_DIALOGUE.greeting.text;

      // Test different reputation levels generate different text
      const neutralGreeting = greetingText(0); // Neutral
      const warmGreeting = greetingText(REPUTATION_BOUNDS.WARM_MIN); // Warm
      const friendlyGreeting = greetingText(REPUTATION_BOUNDS.FRIENDLY_MIN); // Friendly
      const trustedGreeting = greetingText(REPUTATION_BOUNDS.TRUSTED_MIN); // Trusted
      const familyGreeting = greetingText(REPUTATION_BOUNDS.FAMILY_MIN); // Family

      expect(typeof neutralGreeting).toBe('string');
      expect(typeof warmGreeting).toBe('string');
      expect(typeof friendlyGreeting).toBe('string');
      expect(typeof trustedGreeting).toBe('string');
      expect(typeof familyGreeting).toBe('string');

      // Each tier should have different text
      expect(neutralGreeting).not.toBe(warmGreeting);
      expect(warmGreeting).not.toBe(friendlyGreeting);
      expect(friendlyGreeting).not.toBe(trustedGreeting);
      expect(trustedGreeting).not.toBe(familyGreeting);
    });

    it('should have expected choice behavior in greeting', () => {
      // Test behavior: verify reputation-gated choices appear based on reputation levels
      const tipChoice = CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'ask_tip'
      );
      const backstoryChoice = CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'backstory'
      );
      const loanChoice = CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'request_loan'
      );
      const storageChoice = CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.find(
        (choice) => choice.next === 'request_storage'
      );

      expect(tipChoice).toBeDefined();
      expect(backstoryChoice).toBeDefined();
      expect(loanChoice).toBeDefined();
      expect(storageChoice).toBeDefined();

      // Create mock context for condition functions that need it
      const mockContext = {
        canGetTip: { available: true },
        canRequestLoan: { available: true },
        canRequestStorage: { available: true },
        npcState: { loanAmount: 0, storedCargo: [] },
        daysElapsed: 1,
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
      };

      // Test different reputation levels unlock different options
      const neutralRepChoices =
        CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.filter(
          (choice) => !choice.condition || choice.condition(0, mockContext)
        );
      const warmRepChoices = CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.filter(
        (choice) => !choice.condition || choice.condition(15, mockContext)
      );
      const friendlyRepChoices =
        CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.filter(
          (choice) => !choice.condition || choice.condition(35, mockContext)
        );
      const trustedRepChoices =
        CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.filter(
          (choice) => !choice.condition || choice.condition(65, mockContext)
        );

      // Higher reputation should unlock more options
      expect(trustedRepChoices.length).toBeGreaterThan(
        friendlyRepChoices.length
      );
      expect(friendlyRepChoices.length).toBeGreaterThan(warmRepChoices.length);
      expect(warmRepChoices.length).toBeGreaterThan(neutralRepChoices.length);

      // Should always have basic trading talk and exit options
      const unconditionalChoices =
        CAPTAIN_VASQUEZ_DIALOGUE.greeting.choices.filter(
          (choice) => !choice.condition
        );
      expect(unconditionalChoices.length).toBeGreaterThanOrEqual(2);
    });

    it('should have all required dialogue nodes', () => {
      const requiredNodes = [
        'greeting',
        'trading_talk',
        'route_advice',
        'fuel_costs',
        'ask_tip',
        'backstory',
        'pavonis_hints',
        'range_extender_hint',
        'retirement_story',
        'request_loan',
        'request_storage',
      ];

      requiredNodes.forEach((nodeId) => {
        expect(CAPTAIN_VASQUEZ_DIALOGUE[nodeId]).toBeDefined();
        expect(CAPTAIN_VASQUEZ_DIALOGUE[nodeId].text).toBeDefined();
        expect(Array.isArray(CAPTAIN_VASQUEZ_DIALOGUE[nodeId].choices)).toBe(
          true
        );
      });
    });

    it('should have Pavonis route hints in backstory', () => {
      // Test that backstory has function-based text for different reputation levels
      expect(typeof CAPTAIN_VASQUEZ_DIALOGUE.backstory.text).toBe('function');

      const friendlyBackstory = CAPTAIN_VASQUEZ_DIALOGUE.backstory.text(
        REPUTATION_BOUNDS.FRIENDLY_MIN
      );
      const trustedBackstory = CAPTAIN_VASQUEZ_DIALOGUE.backstory.text(
        REPUTATION_BOUNDS.TRUSTED_MIN
      );

      expect(typeof friendlyBackstory).toBe('string');
      expect(typeof trustedBackstory).toBe('string');
      expect(friendlyBackstory).not.toBe(trustedBackstory);

      // Trusted level should mention Pavonis
      expect(trustedBackstory.toLowerCase()).toContain('pavonis');
    });

    it('should have story flags in dialogue nodes', () => {
      expect(CAPTAIN_VASQUEZ_DIALOGUE.ask_tip.flags).toBeDefined();
      expect(Array.isArray(CAPTAIN_VASQUEZ_DIALOGUE.ask_tip.flags)).toBe(true);
      expect(CAPTAIN_VASQUEZ_DIALOGUE.ask_tip.flags).toContain(
        'vasquez_tip_requested'
      );

      expect(CAPTAIN_VASQUEZ_DIALOGUE.backstory.flags).toBeDefined();
      expect(Array.isArray(CAPTAIN_VASQUEZ_DIALOGUE.backstory.flags)).toBe(
        true
      );
      expect(CAPTAIN_VASQUEZ_DIALOGUE.backstory.flags).toContain(
        'vasquez_backstory_shared'
      );

      expect(CAPTAIN_VASQUEZ_DIALOGUE.pavonis_hints.flags).toBeDefined();
      expect(Array.isArray(CAPTAIN_VASQUEZ_DIALOGUE.pavonis_hints.flags)).toBe(
        true
      );
      expect(CAPTAIN_VASQUEZ_DIALOGUE.pavonis_hints.flags).toContain(
        'vasquez_pavonis_discussed'
      );
    });
  });

  describe('Dr. Sarah Kim Dialogue Tree', () => {
    it('should exist and have greeting node', () => {
      expect(DR_SARAH_KIM_DIALOGUE).toBeDefined();
      expect(DR_SARAH_KIM_DIALOGUE.greeting).toBeDefined();
      expect(DR_SARAH_KIM_DIALOGUE.greeting.text).toBeDefined();
      expect(DR_SARAH_KIM_DIALOGUE.greeting.choices).toBeDefined();
      expect(Array.isArray(DR_SARAH_KIM_DIALOGUE.greeting.choices)).toBe(true);
    });

    it('should have tier-based greeting text matching requirements', () => {
      const greetingText = DR_SARAH_KIM_DIALOGUE.greeting.text;
      expect(typeof greetingText).toBe('function');

      // Test different reputation tiers
      const neutralGreeting = greetingText(REPUTATION_BOUNDS.NEUTRAL_MIN);
      const warmGreeting = greetingText(REPUTATION_BOUNDS.WARM_MIN);
      const friendlyGreeting = greetingText(REPUTATION_BOUNDS.FRIENDLY_MIN);
      const trustedGreeting = greetingText(REPUTATION_BOUNDS.TRUSTED_MIN);
      const familyGreeting = greetingText(REPUTATION_BOUNDS.FAMILY_MIN);

      // All greetings should be different
      expect(neutralGreeting).not.toBe(warmGreeting);
      expect(warmGreeting).not.toBe(friendlyGreeting);
      expect(friendlyGreeting).not.toBe(trustedGreeting);
      expect(trustedGreeting).not.toBe(familyGreeting);

      // Should reflect professional/formal tone
      expect(neutralGreeting).toContain('documentation');
      expect(warmGreeting).toContain('procedures');
      expect(friendlyGreeting).toContain('professional');
      expect(trustedGreeting).toContain('protocols');
      expect(familyGreeting).toContain('exemplary');
    });

    it('should have expected choice behavior in greeting', () => {
      const choices = DR_SARAH_KIM_DIALOGUE.greeting.choices;
      expect(choices.length).toBeGreaterThan(3);

      // Create mock context for condition functions that need it
      const mockContext = {
        canGetTip: { available: true },
        canRequestLoan: { available: true },
        canRequestStorage: { available: true },
        npcState: { loanAmount: 0, storedCargo: [] },
        daysElapsed: 1,
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
      };

      // Should have tip choice with reputation condition
      const tipChoice = choices.find((choice) =>
        choice.text.includes('operational tips')
      );
      expect(tipChoice).toBeDefined();
      expect(tipChoice.condition).toBeDefined();
      expect(typeof tipChoice.condition).toBe('function');
      expect(tipChoice.condition(REPUTATION_BOUNDS.WARM_MIN, mockContext)).toBe(
        true
      );
      expect(
        tipChoice.condition(REPUTATION_BOUNDS.NEUTRAL_MIN, mockContext)
      ).toBe(false);

      // Should have loan choice with Trusted tier condition
      const loanChoice = choices.find((choice) =>
        choice.text.includes('emergency loan')
      );
      expect(loanChoice).toBeDefined();
      expect(loanChoice.condition).toBeDefined();
      expect(typeof loanChoice.condition).toBe('function');
      expect(
        loanChoice.condition(REPUTATION_BOUNDS.TRUSTED_MIN, mockContext)
      ).toBe(true);
      expect(
        loanChoice.condition(REPUTATION_BOUNDS.FRIENDLY_MIN, mockContext)
      ).toBe(false);

      // Should have storage choice with Friendly tier condition
      const storageChoice = choices.find((choice) =>
        choice.text.includes('store some cargo')
      );
      expect(storageChoice).toBeDefined();
      expect(storageChoice.condition).toBeDefined();
      expect(typeof storageChoice.condition).toBe('function');
      expect(storageChoice.condition(REPUTATION_BOUNDS.FRIENDLY_MIN)).toBe(
        true
      );
      expect(storageChoice.condition(REPUTATION_BOUNDS.WARM_MIN)).toBe(false);
    });

    it('should have all required dialogue nodes', () => {
      const requiredNodes = [
        'greeting',
        'station_operations',
        'procedures_important',
        'efficiency_matters',
        'regulation_defense',
        'ask_tip',
        'request_loan',
        'request_storage',
      ];

      requiredNodes.forEach((nodeId) => {
        expect(DR_SARAH_KIM_DIALOGUE[nodeId]).toBeDefined();
        expect(DR_SARAH_KIM_DIALOGUE[nodeId].text).toBeDefined();
        expect(DR_SARAH_KIM_DIALOGUE[nodeId].choices).toBeDefined();
      });
    });

    it('should have story flags in dialogue nodes', () => {
      // Check that tip and favor nodes have flags
      expect(DR_SARAH_KIM_DIALOGUE.ask_tip.flags).toBeDefined();
      expect(DR_SARAH_KIM_DIALOGUE.ask_tip.flags).toContain(
        'kim_tip_requested'
      );

      expect(DR_SARAH_KIM_DIALOGUE.request_loan.flags).toBeDefined();
      expect(DR_SARAH_KIM_DIALOGUE.request_loan.flags).toContain(
        'kim_loan_discussed'
      );

      expect(DR_SARAH_KIM_DIALOGUE.request_storage.flags).toBeDefined();
      expect(DR_SARAH_KIM_DIALOGUE.request_storage.flags).toContain(
        'kim_storage_discussed'
      );
    });

    it('should reflect professional administrator personality', () => {
      // Check that dialogue reflects formal, technical vocabulary and regulation citations
      const stationOpsText = DR_SARAH_KIM_DIALOGUE.station_operations.text;
      expect(stationOpsText).toContain('Regulation');
      expect(stationOpsText).toContain('protocols');
      expect(stationOpsText).toContain('procedures');

      const proceduresText = DR_SARAH_KIM_DIALOGUE.procedures_important.text;
      expect(proceduresText).toContain('Regulation');
      expect(proceduresText).toContain('systematic');

      const efficiencyText = DR_SARAH_KIM_DIALOGUE.efficiency_matters.text;
      expect(efficiencyText).toContain('efficiency');
      expect(efficiencyText).toContain('metrics');
    });
  });

  describe('Zara Osman Dialogue Tree', () => {
    it('should exist and have greeting node', () => {
      expect(ZARA_OSMAN_DIALOGUE).toBeDefined();
      expect(ZARA_OSMAN_DIALOGUE.greeting).toBeDefined();
      expect(ZARA_OSMAN_DIALOGUE.greeting.text).toBeDefined();
      expect(ZARA_OSMAN_DIALOGUE.greeting.choices).toBeDefined();
      expect(Array.isArray(ZARA_OSMAN_DIALOGUE.greeting.choices)).toBe(true);
    });

    it('should have tier-based greeting text matching requirements', () => {
      const greetingText = ZARA_OSMAN_DIALOGUE.greeting.text;
      expect(typeof greetingText).toBe('function');

      // Test different reputation tiers
      const familyGreeting = greetingText(REPUTATION_BOUNDS.FAMILY_MIN);
      expect(familyGreeting).toContain('partner');
      expect(familyGreeting).toContain('family');

      const trustedGreeting = greetingText(REPUTATION_BOUNDS.TRUSTED_MIN);
      expect(trustedGreeting).toContain('hotshot');

      const friendlyGreeting = greetingText(REPUTATION_BOUNDS.FRIENDLY_MIN);
      expect(friendlyGreeting).toContain('good to see you again');

      const warmGreeting = greetingText(REPUTATION_BOUNDS.WARM_MIN);
      expect(warmGreeting).toContain('action');

      const neutralGreeting = greetingText(REPUTATION_BOUNDS.NEUTRAL_MIN);
      expect(neutralGreeting).toContain('trader');
    });

    it('should have expected choice behavior in greeting', () => {
      const choices = ZARA_OSMAN_DIALOGUE.greeting.choices;
      expect(choices.length).toBeGreaterThanOrEqual(4);

      // Create mock context for condition functions that need it
      const mockContext = {
        canGetTip: { available: true },
        canRequestLoan: { available: true },
        canRequestStorage: { available: true },
        npcState: { loanAmount: 0, storedCargo: [] },
        daysElapsed: 1,
        karma: 0,
        factionReps: { authorities: 0, outlaws: 0, civilians: 0 },
      };

      // Check for tip choice with reputation condition
      const tipChoice = choices.find((choice) =>
        choice.text.includes('market tips')
      );
      expect(tipChoice).toBeDefined();
      expect(tipChoice.condition).toBeDefined();
      expect(typeof tipChoice.condition).toBe('function');
      expect(tipChoice.condition(REPUTATION_BOUNDS.WARM_MIN, mockContext)).toBe(
        true
      );
      expect(
        tipChoice.condition(REPUTATION_BOUNDS.NEUTRAL_MIN, mockContext)
      ).toBe(false);

      // Check for loan choice with reputation condition
      const loanChoice = choices.find((choice) =>
        choice.text.includes('emergency loan')
      );
      expect(loanChoice).toBeDefined();
      expect(loanChoice.condition).toBeDefined();
      expect(typeof loanChoice.condition).toBe('function');
      expect(
        loanChoice.condition(REPUTATION_BOUNDS.TRUSTED_MIN, mockContext)
      ).toBe(true);
      expect(
        loanChoice.condition(REPUTATION_BOUNDS.FRIENDLY_MIN, mockContext)
      ).toBe(false);

      // Check for storage choice with reputation condition
      const storageChoice = choices.find((choice) =>
        choice.text.includes('store some cargo')
      );
      expect(storageChoice).toBeDefined();
      expect(storageChoice.condition).toBeDefined();
      expect(typeof storageChoice.condition).toBe('function');
      expect(
        storageChoice.condition(REPUTATION_BOUNDS.FRIENDLY_MIN, mockContext)
      ).toBe(true);
      expect(
        storageChoice.condition(REPUTATION_BOUNDS.WARM_MIN, mockContext)
      ).toBe(false);
    });

    it('should have all required dialogue nodes', () => {
      const requiredNodes = [
        'greeting',
        'trading_business',
        'market_knowledge',
        'competition_talk',
        'market_unpredictable',
        'ask_tip',
        'request_loan',
        'request_storage',
      ];

      requiredNodes.forEach((nodeId) => {
        expect(ZARA_OSMAN_DIALOGUE[nodeId]).toBeDefined();
        expect(ZARA_OSMAN_DIALOGUE[nodeId].text).toBeDefined();
        expect(ZARA_OSMAN_DIALOGUE[nodeId].choices).toBeDefined();
      });
    });

    it('should have story flags in dialogue nodes', () => {
      expect(ZARA_OSMAN_DIALOGUE.ask_tip.flags).toBeDefined();
      expect(ZARA_OSMAN_DIALOGUE.ask_tip.flags).toContain(
        'osman_tip_requested'
      );

      expect(ZARA_OSMAN_DIALOGUE.request_loan.flags).toBeDefined();
      expect(ZARA_OSMAN_DIALOGUE.request_loan.flags).toContain(
        'osman_loan_discussed'
      );

      expect(ZARA_OSMAN_DIALOGUE.request_storage.flags).toBeDefined();
      expect(ZARA_OSMAN_DIALOGUE.request_storage.flags).toContain(
        'osman_storage_discussed'
      );
    });

    it('should reflect trader personality with casual speech and trading jargon', () => {
      // Check that dialogue reflects casual greeting style and trading jargon
      const tradingText = ZARA_OSMAN_DIALOGUE.trading_business.text;
      expect(tradingText).toContain('flow');
      expect(tradingText).toContain('Markets');
      expect(tradingText).toContain('patterns');

      const marketText = ZARA_OSMAN_DIALOGUE.market_knowledge.text;
      expect(marketText).toContain('connections');
      expect(marketText).toContain('intel');
      expect(marketText).toContain('profit');

      const competitionText = ZARA_OSMAN_DIALOGUE.competition_talk.text;
      expect(competitionText).toContain('sharp');
      expect(competitionText).toContain('credits');
      expect(competitionText).toContain('bottom line');
    });
  });

  describe('Dialogue Tree Collection and Validation', () => {
    it('should include all ten NPCs in ALL_DIALOGUE_TREES', () => {
      expect(ALL_DIALOGUE_TREES.chen_barnards).toBe(WEI_CHEN_DIALOGUE);
      expect(ALL_DIALOGUE_TREES.cole_sol).toBe(MARCUS_COLE_DIALOGUE);
      expect(ALL_DIALOGUE_TREES.okonkwo_ross154).toBe(FATHER_OKONKWO_DIALOGUE);
      expect(ALL_DIALOGUE_TREES.whisper_sirius).toBe(WHISPER_DIALOGUE);
      expect(ALL_DIALOGUE_TREES.vasquez_epsilon).toBe(CAPTAIN_VASQUEZ_DIALOGUE);
      expect(ALL_DIALOGUE_TREES.kim_tau_ceti).toBe(DR_SARAH_KIM_DIALOGUE);
      expect(ALL_DIALOGUE_TREES.rodriguez_procyon).toBe(
        RUSTY_RODRIGUEZ_DIALOGUE
      );
      expect(ALL_DIALOGUE_TREES.osman_luyten).toBe(ZARA_OSMAN_DIALOGUE);
      expect(ALL_DIALOGUE_TREES.kowalski_alpha_centauri).toBe(
        STATION_MASTER_KOWALSKI_DIALOGUE
      );
      expect(ALL_DIALOGUE_TREES.liu_wolf359).toBe(LUCKY_LIU_DIALOGUE);
    });

    it('should validate all dialogue trees without throwing errors', () => {
      expect(() => validateDialogueTree(WEI_CHEN_DIALOGUE)).not.toThrow();
      expect(() => validateDialogueTree(MARCUS_COLE_DIALOGUE)).not.toThrow();
      expect(() => validateDialogueTree(FATHER_OKONKWO_DIALOGUE)).not.toThrow();
      expect(() => validateDialogueTree(WHISPER_DIALOGUE)).not.toThrow();
      expect(() =>
        validateDialogueTree(CAPTAIN_VASQUEZ_DIALOGUE)
      ).not.toThrow();
      expect(() => validateDialogueTree(DR_SARAH_KIM_DIALOGUE)).not.toThrow();
      expect(() =>
        validateDialogueTree(RUSTY_RODRIGUEZ_DIALOGUE)
      ).not.toThrow();
      expect(() => validateDialogueTree(ZARA_OSMAN_DIALOGUE)).not.toThrow();
      expect(() =>
        validateDialogueTree(STATION_MASTER_KOWALSKI_DIALOGUE)
      ).not.toThrow();
      expect(() => validateDialogueTree(LUCKY_LIU_DIALOGUE)).not.toThrow();
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

      // Test Captain Vasquez's greeting function
      const vasquezGreeting = CAPTAIN_VASQUEZ_DIALOGUE.greeting.text;
      const vasquezNeutralGreeting = vasquezGreeting(0);
      const vasquezWarmGreeting = vasquezGreeting(REPUTATION_BOUNDS.WARM_MIN);
      const vasquezFriendlyGreeting = vasquezGreeting(
        REPUTATION_BOUNDS.FRIENDLY_MIN
      );

      expect(vasquezNeutralGreeting).not.toBe(vasquezWarmGreeting);
      expect(vasquezWarmGreeting).not.toBe(vasquezFriendlyGreeting);
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
