import { describe, it, expect } from 'vitest';
import {
  WHISPER,
  validateNPCDefinition,
} from '../../src/game/data/npc-data.js';
import { NPC_INITIAL_REPUTATION } from '../../src/game/constants.js';

/**
 * Unit tests for Whisper NPC data validation
 * Feature: npc-benefits
 *
 * **Validates: Requirements 4.1-4.15**
 *
 * Verifies that Whisper NPC has correct personality traits, initial reputation,
 * system/station assignment, speech style, tips array, discount service, and
 * tier benefits as specified in requirements.
 */
describe('Whisper NPC Data Validation', () => {
  describe('Whisper (Information Broker at Sirius A)', () => {
    it('should have all required fields for NPC benefits system', () => {
      // Verify basic required fields exist
      expect(WHISPER.id).toBeDefined();
      expect(WHISPER.name).toBeDefined();
      expect(WHISPER.role).toBeDefined();
      expect(WHISPER.system).toBeDefined();
      expect(WHISPER.station).toBeDefined();
      expect(WHISPER.personality).toBeDefined();
      expect(WHISPER.speechStyle).toBeDefined();
      expect(WHISPER.description).toBeDefined();
      expect(WHISPER.initialRep).toBeDefined();

      // Verify new benefits fields exist
      expect(WHISPER.tips).toBeDefined();
      expect(WHISPER.discountService).toBeDefined();
      expect(WHISPER.tierBenefits).toBeDefined();
    });

    it('should have correct basic information', () => {
      expect(WHISPER.id).toBe('whisper_sirius');
      expect(WHISPER.name).toBe('Whisper');
      expect(WHISPER.role).toBe('Information Broker');
      expect(WHISPER.system).toBe(2); // Sirius A
      expect(WHISPER.station).toBe('Sirius Exchange');
    });

    it('should have correct personality values matching specification', () => {
      expect(WHISPER.personality.trust).toBe(0.5);
      expect(WHISPER.personality.greed).toBe(0.7);
      expect(WHISPER.personality.loyalty).toBe(0.5);
      expect(WHISPER.personality.morality).toBe(0.4);
    });

    it('should have correct speech style', () => {
      expect(WHISPER.speechStyle.greeting).toBe('formal');
      expect(WHISPER.speechStyle.vocabulary).toBe('educated');
      expect(WHISPER.speechStyle.quirk).toBe('cryptic measured tones');
    });

    it('should have correct initial reputation', () => {
      expect(WHISPER.initialRep).toBe(NPC_INITIAL_REPUTATION.NEUTRAL);
    });

    it('should have non-empty tips array', () => {
      expect(Array.isArray(WHISPER.tips)).toBe(true);
      expect(WHISPER.tips.length).toBeGreaterThan(0);

      // Verify specific tips from requirements
      expect(WHISPER.tips).toContain(
        'Procyon is buying ore at premium prices this week.'
      );
      expect(WHISPER.tips).toContain(
        'Avoid Tau Ceti. Inspections are up 300%.'
      );
      expect(WHISPER.tips).toContain(
        'Someone at Ross 154 is looking for electronics. Big buyer.'
      );
    });

    it('should have correct discount service', () => {
      expect(WHISPER.discountService).toBe('intel');
    });

    it('should have correct tier benefits configuration', () => {
      expect(WHISPER.tierBenefits).toBeDefined();
      expect(WHISPER.tierBenefits.warm).toBeDefined();
      expect(WHISPER.tierBenefits.friendly).toBeDefined();
      expect(WHISPER.tierBenefits.trusted).toBeDefined();
      expect(WHISPER.tierBenefits.family).toBeDefined();

      // Verify tier benefit structure
      expect(WHISPER.tierBenefits.warm.discount).toBeDefined();
      expect(WHISPER.tierBenefits.warm.benefit).toBeDefined();
    });

    it('should pass NPC validation', () => {
      expect(() => validateNPCDefinition(WHISPER)).not.toThrow();
    });
  });
});
