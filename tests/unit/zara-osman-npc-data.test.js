import { describe, it, expect } from 'vitest';
import {
  ZARA_OSMAN,
  validateNPCDefinition,
} from '../../src/game/data/npc-data.js';
import { NPC_INITIAL_REPUTATION } from '../../src/game/constants.js';

/**
 * Unit tests for Zara Osman NPC data validation
 * Feature: npc-benefits
 *
 * **Validates: Requirements 8.1-8.10**
 *
 * Verifies that Zara Osman NPC has correct personality traits, initial reputation,
 * system/station assignment, speech style, tips array, discount service, and
 * tier benefits as specified in requirements.
 */
describe('Zara Osman NPC Data Validation', () => {
  describe("Zara Osman (Trader at Luyten's Star)", () => {
    it('should have all required fields for NPC benefits system', () => {
      // Verify basic required fields exist
      expect(ZARA_OSMAN.id).toBeDefined();
      expect(ZARA_OSMAN.name).toBeDefined();
      expect(ZARA_OSMAN.role).toBeDefined();
      expect(ZARA_OSMAN.system).toBeDefined();
      expect(ZARA_OSMAN.station).toBeDefined();
      expect(ZARA_OSMAN.personality).toBeDefined();
      expect(ZARA_OSMAN.speechStyle).toBeDefined();
      expect(ZARA_OSMAN.description).toBeDefined();
      expect(ZARA_OSMAN.initialRep).toBeDefined();

      // Verify new benefits fields exist
      expect(ZARA_OSMAN.tips).toBeDefined();
      expect(ZARA_OSMAN.discountService).toBeDefined();
      expect(ZARA_OSMAN.tierBenefits).toBeDefined();
    });

    it('should have correct basic information', () => {
      expect(ZARA_OSMAN.id).toBe('osman_luyten');
      expect(ZARA_OSMAN.name).toBe('Zara Osman');
      expect(ZARA_OSMAN.role).toBe('Trader');
      expect(ZARA_OSMAN.system).toBe(7); // Luyten's Star
      expect(ZARA_OSMAN.station).toBe("Luyten's Outpost");
    });

    it('should have correct personality values matching specification', () => {
      expect(ZARA_OSMAN.personality.trust).toBe(0.5);
      expect(ZARA_OSMAN.personality.greed).toBe(0.6);
      expect(ZARA_OSMAN.personality.loyalty).toBe(0.6);
      expect(ZARA_OSMAN.personality.morality).toBe(0.5);
    });

    it('should have correct speech style', () => {
      expect(ZARA_OSMAN.speechStyle.greeting).toBe('casual');
      expect(ZARA_OSMAN.speechStyle.vocabulary).toBe('slang');
      expect(ZARA_OSMAN.speechStyle.quirk).toBe('trading jargon');
    });

    it('should have correct initial reputation', () => {
      expect(ZARA_OSMAN.initialRep).toBe(NPC_INITIAL_REPUTATION.NEUTRAL);
    });

    it('should have non-empty tips array', () => {
      expect(Array.isArray(ZARA_OSMAN.tips)).toBe(true);
      expect(ZARA_OSMAN.tips.length).toBeGreaterThan(0);

      // Verify specific tips from requirements
      expect(ZARA_OSMAN.tips).toContain(
        'Buy low at mining stations, sell high at rich systems.'
      );
      expect(ZARA_OSMAN.tips).toContain(
        'Luxury goods have the best margins if you can afford the capital.'
      );
      expect(ZARA_OSMAN.tips).toContain(
        'Watch for economic events. They shift prices dramatically.'
      );
    });

    it('should have correct discount service', () => {
      expect(ZARA_OSMAN.discountService).toBe('trade');
    });

    it('should have correct tier benefits configuration', () => {
      expect(ZARA_OSMAN.tierBenefits).toBeDefined();
      expect(ZARA_OSMAN.tierBenefits.warm).toBeDefined();
      expect(ZARA_OSMAN.tierBenefits.friendly).toBeDefined();
      expect(ZARA_OSMAN.tierBenefits.trusted).toBeDefined();
      expect(ZARA_OSMAN.tierBenefits.family).toBeDefined();

      // Verify tier benefit structure
      expect(ZARA_OSMAN.tierBenefits.warm.discount).toBeDefined();
      expect(ZARA_OSMAN.tierBenefits.warm.benefit).toBeDefined();
    });

    it('should pass NPC validation', () => {
      expect(() => validateNPCDefinition(ZARA_OSMAN)).not.toThrow();
    });
  });
});
