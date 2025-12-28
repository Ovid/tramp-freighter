import { describe, it, expect } from 'vitest';
import {
  STATION_MASTER_KOWALSKI,
  validateNPCDefinition,
} from '../../src/game/data/npc-data.js';
import { NPC_INITIAL_REPUTATION } from '../../src/game/constants.js';

/**
 * Unit tests for Station Master Kowalski NPC data validation
 * Feature: npc-benefits
 *
 * **Validates: Requirements 9.1-9.10**
 *
 * Verifies that Station Master Kowalski NPC has correct personality traits, initial reputation,
 * system/station assignment, speech style, tips array, discount service, and
 * tier benefits as specified in requirements.
 */
describe('Station Master Kowalski NPC Data Validation', () => {
  describe('Station Master Kowalski (Station Master at Alpha Centauri)', () => {
    it('should have all required fields for NPC benefits system', () => {
      // Verify basic required fields exist
      expect(STATION_MASTER_KOWALSKI.id).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.name).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.role).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.system).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.station).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.personality).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.speechStyle).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.description).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.initialRep).toBeDefined();

      // Verify new benefits fields exist
      expect(STATION_MASTER_KOWALSKI.tips).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.discountService).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.tierBenefits).toBeDefined();
    });

    it('should have correct basic information', () => {
      expect(STATION_MASTER_KOWALSKI.id).toBe('kowalski_alpha_centauri');
      expect(STATION_MASTER_KOWALSKI.name).toBe('Station Master Kowalski');
      expect(STATION_MASTER_KOWALSKI.role).toBe('Station Master');
      expect(STATION_MASTER_KOWALSKI.system).toBe(1); // Alpha Centauri
      expect(STATION_MASTER_KOWALSKI.station).toBe('Centauri Station');
    });

    it('should have correct personality values matching specification', () => {
      expect(STATION_MASTER_KOWALSKI.personality.trust).toBe(0.3);
      expect(STATION_MASTER_KOWALSKI.personality.greed).toBe(0.4);
      expect(STATION_MASTER_KOWALSKI.personality.loyalty).toBe(0.7);
      expect(STATION_MASTER_KOWALSKI.personality.morality).toBe(0.7);
    });

    it('should have correct speech style', () => {
      expect(STATION_MASTER_KOWALSKI.speechStyle.greeting).toBe('gruff');
      expect(STATION_MASTER_KOWALSKI.speechStyle.vocabulary).toBe('simple');
      expect(STATION_MASTER_KOWALSKI.speechStyle.quirk).toBe(
        'no-nonsense direct'
      );
    });

    it('should have correct initial reputation', () => {
      expect(STATION_MASTER_KOWALSKI.initialRep).toBe(
        NPC_INITIAL_REPUTATION.NEUTRAL
      );
    });

    it('should have non-empty tips array', () => {
      expect(Array.isArray(STATION_MASTER_KOWALSKI.tips)).toBe(true);
      expect(STATION_MASTER_KOWALSKI.tips.length).toBeGreaterThan(0);

      // Verify all tips are non-empty strings
      STATION_MASTER_KOWALSKI.tips.forEach((tip) => {
        expect(typeof tip).toBe('string');
        expect(tip.length).toBeGreaterThan(0);
      });
    });

    it('should have correct discount service', () => {
      expect(STATION_MASTER_KOWALSKI.discountService).toBe('docking');
    });

    it('should have correct tier benefits configuration', () => {
      expect(STATION_MASTER_KOWALSKI.tierBenefits).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.tierBenefits.warm).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.tierBenefits.friendly).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.tierBenefits.trusted).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.tierBenefits.family).toBeDefined();

      // Verify tier benefit structure
      expect(STATION_MASTER_KOWALSKI.tierBenefits.warm.discount).toBeDefined();
      expect(STATION_MASTER_KOWALSKI.tierBenefits.warm.benefit).toBeDefined();
    });

    it('should pass NPC validation', () => {
      expect(() =>
        validateNPCDefinition(STATION_MASTER_KOWALSKI)
      ).not.toThrow();
    });
  });
});
