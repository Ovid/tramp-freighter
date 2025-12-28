import { describe, it, expect } from 'vitest';
import { validateNPCDefinition } from '../../src/game/data/npc-data.js';
import {
  NPC_PERSONALITY_VALUES,
  NPC_INITIAL_REPUTATION,
} from '../../src/game/constants.js';

/**
 * Unit tests for Captain Vasquez NPC data validation
 * Feature: npc-benefits
 *
 * **Validates: Requirements 5.1-5.11**
 *
 * Verifies that Captain Vasquez NPC has correct personality traits, initial reputation,
 * system/station assignment, speech style, tips array, discount service, and
 * tier benefits as specified in requirements.
 */
describe('Captain Vasquez NPC Data Validation', () => {
  describe('Captain Vasquez (Retired Trader at Epsilon Eridani)', () => {
    it('should have all required fields for NPC benefits system', () => {
      // This test will fail initially - we need to import CAPTAIN_VASQUEZ from npc-data.js
      const { CAPTAIN_VASQUEZ } = require('../../src/game/data/npc-data.js');
      
      // Verify basic required fields exist
      expect(CAPTAIN_VASQUEZ.id).toBeDefined();
      expect(CAPTAIN_VASQUEZ.name).toBeDefined();
      expect(CAPTAIN_VASQUEZ.role).toBeDefined();
      expect(CAPTAIN_VASQUEZ.system).toBeDefined();
      expect(CAPTAIN_VASQUEZ.station).toBeDefined();
      expect(CAPTAIN_VASQUEZ.personality).toBeDefined();
      expect(CAPTAIN_VASQUEZ.speechStyle).toBeDefined();
      expect(CAPTAIN_VASQUEZ.description).toBeDefined();
      expect(CAPTAIN_VASQUEZ.initialRep).toBeDefined();
      
      // Verify new benefits fields exist
      expect(CAPTAIN_VASQUEZ.tips).toBeDefined();
      expect(CAPTAIN_VASQUEZ.discountService).toBeDefined();
      expect(CAPTAIN_VASQUEZ.tierBenefits).toBeDefined();
    });

    it('should have correct basic information', () => {
      const { CAPTAIN_VASQUEZ } = require('../../src/game/data/npc-data.js');
      
      expect(CAPTAIN_VASQUEZ.id).toBe('vasquez_epsilon');
      expect(CAPTAIN_VASQUEZ.name).toBe('Captain Vasquez');
      expect(CAPTAIN_VASQUEZ.role).toBe('Retired Trader');
      expect(CAPTAIN_VASQUEZ.system).toBe(3); // Epsilon Eridani
      expect(CAPTAIN_VASQUEZ.station).toBe('Eridani Hub');
    });

    it('should have correct personality values matching specification', () => {
      const { CAPTAIN_VASQUEZ } = require('../../src/game/data/npc-data.js');
      
      expect(CAPTAIN_VASQUEZ.personality.trust).toBe(0.6);
      expect(CAPTAIN_VASQUEZ.personality.greed).toBe(0.3);
      expect(CAPTAIN_VASQUEZ.personality.loyalty).toBe(0.7);
      expect(CAPTAIN_VASQUEZ.personality.morality).toBe(0.7);
    });

    it('should have correct speech style', () => {
      const { CAPTAIN_VASQUEZ } = require('../../src/game/data/npc-data.js');
      
      expect(CAPTAIN_VASQUEZ.speechStyle.greeting).toBe('warm');
      expect(CAPTAIN_VASQUEZ.speechStyle.vocabulary).toBe('simple');
      expect(CAPTAIN_VASQUEZ.speechStyle.quirk).toBe('trading stories');
    });

    it('should have correct initial reputation', () => {
      const { CAPTAIN_VASQUEZ } = require('../../src/game/data/npc-data.js');
      
      expect(CAPTAIN_VASQUEZ.initialRep).toBe(5); // Starts with 5 rep as mentor figure
    });

    it('should have non-empty tips array', () => {
      const { CAPTAIN_VASQUEZ } = require('../../src/game/data/npc-data.js');
      
      expect(Array.isArray(CAPTAIN_VASQUEZ.tips)).toBe(true);
      expect(CAPTAIN_VASQUEZ.tips.length).toBeGreaterThan(0);
      
      // Verify specific tips from requirements
      expect(CAPTAIN_VASQUEZ.tips).toContain("Barnard's Star always needs ore. Mining station, you know.");
      expect(CAPTAIN_VASQUEZ.tips).toContain("Sirius A pays top credit for luxury goods. Rich folks.");
      expect(CAPTAIN_VASQUEZ.tips).toContain("The Procyon run is profitable if you can afford the fuel.");
    });

    it('should have correct discount service (null for mentor)', () => {
      const { CAPTAIN_VASQUEZ } = require('../../src/game/data/npc-data.js');
      
      expect(CAPTAIN_VASQUEZ.discountService).toBe(null); // Mentor, not service provider
    });

    it('should have correct tier benefits configuration', () => {
      const { CAPTAIN_VASQUEZ } = require('../../src/game/data/npc-data.js');
      
      expect(CAPTAIN_VASQUEZ.tierBenefits).toBeDefined();
      expect(CAPTAIN_VASQUEZ.tierBenefits.warm).toBeDefined();
      expect(CAPTAIN_VASQUEZ.tierBenefits.friendly).toBeDefined();
      expect(CAPTAIN_VASQUEZ.tierBenefits.trusted).toBeDefined();
      expect(CAPTAIN_VASQUEZ.tierBenefits.family).toBeDefined();
      
      // Verify tier benefit structure
      expect(CAPTAIN_VASQUEZ.tierBenefits.warm.discount).toBeDefined();
      expect(CAPTAIN_VASQUEZ.tierBenefits.warm.benefit).toBeDefined();
    });

    it('should pass NPC validation', () => {
      const { CAPTAIN_VASQUEZ } = require('../../src/game/data/npc-data.js');
      
      expect(() => validateNPCDefinition(CAPTAIN_VASQUEZ)).not.toThrow();
    });
  });
});