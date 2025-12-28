import { describe, it, expect } from 'vitest';
import { validateNPCDefinition } from '../../src/game/data/npc-data.js';
import {
  NPC_PERSONALITY_VALUES,
  NPC_INITIAL_REPUTATION,
} from '../../src/game/constants.js';

/**
 * Unit tests for Dr. Sarah Kim NPC data validation
 * Feature: npc-benefits
 *
 * **Validates: Requirements 6.1-6.10**
 *
 * Verifies that Dr. Sarah Kim NPC has correct personality traits, initial reputation,
 * system/station assignment, speech style, tips array, discount service, and
 * tier benefits as specified in requirements.
 */
describe('Dr. Sarah Kim NPC Data Validation', () => {
  describe('Dr. Sarah Kim (Station Administrator at Tau Ceti)', () => {
    it('should have all required fields for NPC benefits system', () => {
      // This test will fail initially - we need to import DR_SARAH_KIM from npc-data.js
      const { DR_SARAH_KIM } = require('../../src/game/data/npc-data.js');
      
      // Verify basic required fields exist
      expect(DR_SARAH_KIM.id).toBeDefined();
      expect(DR_SARAH_KIM.name).toBeDefined();
      expect(DR_SARAH_KIM.role).toBeDefined();
      expect(DR_SARAH_KIM.system).toBeDefined();
      expect(DR_SARAH_KIM.station).toBeDefined();
      expect(DR_SARAH_KIM.personality).toBeDefined();
      expect(DR_SARAH_KIM.speechStyle).toBeDefined();
      expect(DR_SARAH_KIM.description).toBeDefined();
      expect(DR_SARAH_KIM.initialRep).toBeDefined();
      
      // Verify new benefits fields exist
      expect(DR_SARAH_KIM.tips).toBeDefined();
      expect(DR_SARAH_KIM.discountService).toBeDefined();
      expect(DR_SARAH_KIM.tierBenefits).toBeDefined();
    });

    it('should have correct basic information', () => {
      const { DR_SARAH_KIM } = require('../../src/game/data/npc-data.js');
      
      expect(DR_SARAH_KIM.id).toBe('kim_tau_ceti');
      expect(DR_SARAH_KIM.name).toBe('Dr. Sarah Kim');
      expect(DR_SARAH_KIM.role).toBe('Station Administrator');
      expect(DR_SARAH_KIM.system).toBe(5); // Tau Ceti
      expect(DR_SARAH_KIM.station).toBe('Tau Ceti Station');
    });

    it('should have correct personality values matching specification', () => {
      const { DR_SARAH_KIM } = require('../../src/game/data/npc-data.js');
      
      expect(DR_SARAH_KIM.personality.trust).toBe(0.4);
      expect(DR_SARAH_KIM.personality.greed).toBe(0.5);
      expect(DR_SARAH_KIM.personality.loyalty).toBe(0.6);
      expect(DR_SARAH_KIM.personality.morality).toBe(0.8);
    });

    it('should have correct speech style', () => {
      const { DR_SARAH_KIM } = require('../../src/game/data/npc-data.js');
      
      expect(DR_SARAH_KIM.speechStyle.greeting).toBe('formal');
      expect(DR_SARAH_KIM.speechStyle.vocabulary).toBe('technical');
      expect(DR_SARAH_KIM.speechStyle.quirk).toBe('regulation citations');
    });

    it('should have correct initial reputation', () => {
      const { DR_SARAH_KIM } = require('../../src/game/data/npc-data.js');
      
      expect(DR_SARAH_KIM.initialRep).toBe(NPC_INITIAL_REPUTATION.NEUTRAL);
    });

    it('should have non-empty tips array', () => {
      const { DR_SARAH_KIM } = require('../../src/game/data/npc-data.js');
      
      expect(Array.isArray(DR_SARAH_KIM.tips)).toBe(true);
      expect(DR_SARAH_KIM.tips.length).toBeGreaterThan(0);
      
      // Verify specific tips from requirements
      expect(DR_SARAH_KIM.tips).toContain("We have strict customs here. Keep your cargo manifest accurate.");
      expect(DR_SARAH_KIM.tips).toContain("Medicine prices are stable at Ross 154. Good for planning.");
      expect(DR_SARAH_KIM.tips).toContain("Fuel efficiency matters on long routes. Upgrade your engine.");
    });

    it('should have correct discount service', () => {
      const { DR_SARAH_KIM } = require('../../src/game/data/npc-data.js');
      
      expect(DR_SARAH_KIM.discountService).toBe('docking');
    });

    it('should have correct tier benefits configuration', () => {
      const { DR_SARAH_KIM } = require('../../src/game/data/npc-data.js');
      
      expect(DR_SARAH_KIM.tierBenefits).toBeDefined();
      expect(DR_SARAH_KIM.tierBenefits.warm).toBeDefined();
      expect(DR_SARAH_KIM.tierBenefits.friendly).toBeDefined();
      expect(DR_SARAH_KIM.tierBenefits.trusted).toBeDefined();
      expect(DR_SARAH_KIM.tierBenefits.family).toBeDefined();
      
      // Verify tier benefit structure
      expect(DR_SARAH_KIM.tierBenefits.warm.discount).toBeDefined();
      expect(DR_SARAH_KIM.tierBenefits.warm.benefit).toBeDefined();
    });

    it('should pass NPC validation', () => {
      const { DR_SARAH_KIM } = require('../../src/game/data/npc-data.js');
      
      expect(() => validateNPCDefinition(DR_SARAH_KIM)).not.toThrow();
    });
  });
});