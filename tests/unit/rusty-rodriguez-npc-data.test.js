import { describe, it, expect } from 'vitest';
import {
  RUSTY_RODRIGUEZ,
  validateNPCDefinition,
} from '../../src/game/data/npc-data.js';
import { NPC_INITIAL_REPUTATION } from '../../src/game/constants.js';

/**
 * Unit tests for "Rusty" Rodriguez NPC data validation
 * Feature: npc-benefits
 *
 * **Validates: Requirements 7.1-7.10**
 *
 * Verifies that "Rusty" Rodriguez NPC has correct personality traits, initial reputation,
 * system/station assignment, speech style, tips array, discount service, and
 * tier benefits as specified in requirements.
 */
describe('"Rusty" Rodriguez NPC Data Validation', () => {
  describe('"Rusty" Rodriguez (Mechanic at Procyon)', () => {
    it('should have all required fields for NPC benefits system', () => {
      // Verify basic required fields exist
      expect(RUSTY_RODRIGUEZ.id).toBeDefined();
      expect(RUSTY_RODRIGUEZ.name).toBeDefined();
      expect(RUSTY_RODRIGUEZ.role).toBeDefined();
      expect(RUSTY_RODRIGUEZ.system).toBeDefined();
      expect(RUSTY_RODRIGUEZ.station).toBeDefined();
      expect(RUSTY_RODRIGUEZ.personality).toBeDefined();
      expect(RUSTY_RODRIGUEZ.speechStyle).toBeDefined();
      expect(RUSTY_RODRIGUEZ.description).toBeDefined();
      expect(RUSTY_RODRIGUEZ.initialRep).toBeDefined();

      // Verify new benefits fields exist
      expect(RUSTY_RODRIGUEZ.tips).toBeDefined();
      expect(RUSTY_RODRIGUEZ.discountService).toBeDefined();
      expect(RUSTY_RODRIGUEZ.tierBenefits).toBeDefined();
    });

    it('should have correct basic information', () => {
      expect(RUSTY_RODRIGUEZ.id).toBe('rodriguez_procyon');
      expect(RUSTY_RODRIGUEZ.name).toBe('"Rusty" Rodriguez');
      expect(RUSTY_RODRIGUEZ.role).toBe('Mechanic');
      expect(RUSTY_RODRIGUEZ.system).toBe(6); // Procyon
      expect(RUSTY_RODRIGUEZ.station).toBe('Procyon Depot');
    });

    it('should have correct personality values matching specification', () => {
      expect(RUSTY_RODRIGUEZ.personality.trust).toBe(0.7);
      expect(RUSTY_RODRIGUEZ.personality.greed).toBe(0.4);
      expect(RUSTY_RODRIGUEZ.personality.loyalty).toBe(0.8);
      expect(RUSTY_RODRIGUEZ.personality.morality).toBe(0.5);
    });

    it('should have correct speech style', () => {
      expect(RUSTY_RODRIGUEZ.speechStyle.greeting).toBe('gruff');
      expect(RUSTY_RODRIGUEZ.speechStyle.vocabulary).toBe('technical');
      expect(RUSTY_RODRIGUEZ.speechStyle.quirk).toBe('ship personification');
    });

    it('should have correct initial reputation', () => {
      expect(RUSTY_RODRIGUEZ.initialRep).toBe(NPC_INITIAL_REPUTATION.NEUTRAL);
    });

    it('should have non-empty tips array', () => {
      expect(Array.isArray(RUSTY_RODRIGUEZ.tips)).toBe(true);
      expect(RUSTY_RODRIGUEZ.tips.length).toBeGreaterThan(0);

      // Verify specific tips from requirements
      expect(RUSTY_RODRIGUEZ.tips).toContain(
        "Don't let your hull drop below 50%. Expensive to fix after that."
      );
      expect(RUSTY_RODRIGUEZ.tips).toContain(
        'Engine degradation is real. Budget for maintenance.'
      );
      expect(RUSTY_RODRIGUEZ.tips).toContain(
        'Life support is critical. Never skip those repairs.'
      );
    });

    it('should have correct discount service', () => {
      expect(RUSTY_RODRIGUEZ.discountService).toBe('repair');
    });

    it('should have correct tier benefits configuration', () => {
      expect(RUSTY_RODRIGUEZ.tierBenefits).toBeDefined();
      expect(RUSTY_RODRIGUEZ.tierBenefits.warm).toBeDefined();
      expect(RUSTY_RODRIGUEZ.tierBenefits.friendly).toBeDefined();
      expect(RUSTY_RODRIGUEZ.tierBenefits.trusted).toBeDefined();
      expect(RUSTY_RODRIGUEZ.tierBenefits.family).toBeDefined();

      // Verify tier benefit structure
      expect(RUSTY_RODRIGUEZ.tierBenefits.warm.discount).toBeDefined();
      expect(RUSTY_RODRIGUEZ.tierBenefits.warm.benefit).toBeDefined();
    });

    it('should pass NPC validation', () => {
      expect(() => validateNPCDefinition(RUSTY_RODRIGUEZ)).not.toThrow();
    });
  });
});
