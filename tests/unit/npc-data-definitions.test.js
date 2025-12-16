import { describe, it, expect } from 'vitest';
import {
  WEI_CHEN,
  MARCUS_COLE,
  FATHER_OKONKWO,
  ALL_NPCS,
  validateNPCDefinition
} from '../../src/game/data/npc-data.js';
import { REPUTATION_TIERS } from '../../src/game/constants.js';

/**
 * Unit tests for NPC data definitions
 * Feature: npc-foundation
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3**
 *
 * Verifies that all three NPCs have correct personality traits, initial reputation,
 * system/station assignments, and speech styles as specified in requirements.
 */
describe('NPC Data Definitions', () => {
  describe('Wei Chen (Dock Worker at Barnard\'s Star)', () => {
    it('should have correct personality traits', () => {
      expect(WEI_CHEN.personality.trust).toBe(0.3);
      expect(WEI_CHEN.personality.greed).toBe(0.2);
      expect(WEI_CHEN.personality.loyalty).toBe(0.8);
      expect(WEI_CHEN.personality.morality).toBe(0.6);
    });

    it('should have correct initial reputation', () => {
      expect(WEI_CHEN.initialRep).toBe(0);
    });

    it('should be assigned to correct system and station', () => {
      expect(WEI_CHEN.system).toBe(4); // Barnard's Star
      expect(WEI_CHEN.station).toBe('Bore Station 7');
    });

    it('should have correct basic information', () => {
      expect(WEI_CHEN.id).toBe('chen_barnards');
      expect(WEI_CHEN.name).toBe('Wei Chen');
      expect(WEI_CHEN.role).toBe('Dock Worker');
    });

    it('should have correct speech style', () => {
      expect(WEI_CHEN.speechStyle.greeting).toBe('casual');
      expect(WEI_CHEN.speechStyle.vocabulary).toBe('simple');
      expect(WEI_CHEN.speechStyle.quirk).toBe('drops articles');
    });
  });

  describe('Marcus Cole (Loan Shark at Sol)', () => {
    it('should have correct personality traits', () => {
      expect(MARCUS_COLE.personality.trust).toBe(0.1);
      expect(MARCUS_COLE.personality.greed).toBe(0.9);
      expect(MARCUS_COLE.personality.loyalty).toBe(0.3);
      expect(MARCUS_COLE.personality.morality).toBe(0.2);
    });

    it('should have correct initial reputation', () => {
      expect(MARCUS_COLE.initialRep).toBe(-20);
    });

    it('should be assigned to correct system and station', () => {
      expect(MARCUS_COLE.system).toBe(0); // Sol
      expect(MARCUS_COLE.station).toBe('Sol Central');
    });

    it('should have correct basic information', () => {
      expect(MARCUS_COLE.id).toBe('cole_sol');
      expect(MARCUS_COLE.name).toBe('Marcus Cole');
      expect(MARCUS_COLE.role).toBe('Loan Shark');
    });

    it('should have correct speech style', () => {
      expect(MARCUS_COLE.speechStyle.greeting).toBe('formal');
      expect(MARCUS_COLE.speechStyle.vocabulary).toBe('educated');
      expect(MARCUS_COLE.speechStyle.quirk).toBe('short clipped sentences');
    });
  });

  describe('Father Okonkwo (Chaplain at Ross 154)', () => {
    it('should have correct personality traits', () => {
      expect(FATHER_OKONKWO.personality.trust).toBe(0.7);
      expect(FATHER_OKONKWO.personality.greed).toBe(0.0);
      expect(FATHER_OKONKWO.personality.loyalty).toBe(0.9);
      expect(FATHER_OKONKWO.personality.morality).toBe(0.9);
    });

    it('should have correct initial reputation', () => {
      expect(FATHER_OKONKWO.initialRep).toBe(10);
    });

    it('should be assigned to correct system and station', () => {
      expect(FATHER_OKONKWO.system).toBe(11); // Ross 154
      expect(FATHER_OKONKWO.station).toBe('Ross 154 Medical');
    });

    it('should have correct basic information', () => {
      expect(FATHER_OKONKWO.id).toBe('okonkwo_ross154');
      expect(FATHER_OKONKWO.name).toBe('Father Okonkwo');
      expect(FATHER_OKONKWO.role).toBe('Chaplain');
    });

    it('should have correct speech style', () => {
      expect(FATHER_OKONKWO.speechStyle.greeting).toBe('warm');
      expect(FATHER_OKONKWO.speechStyle.vocabulary).toBe('educated');
      expect(FATHER_OKONKWO.speechStyle.quirk).toBe('religious metaphors');
    });
  });

  describe('NPC Collection and Validation', () => {
    it('should include all three NPCs in ALL_NPCS array', () => {
      expect(ALL_NPCS).toHaveLength(3);
      expect(ALL_NPCS).toContain(WEI_CHEN);
      expect(ALL_NPCS).toContain(MARCUS_COLE);
      expect(ALL_NPCS).toContain(FATHER_OKONKWO);
    });

    it('should validate all NPCs without throwing errors', () => {
      expect(() => validateNPCDefinition(WEI_CHEN)).not.toThrow();
      expect(() => validateNPCDefinition(MARCUS_COLE)).not.toThrow();
      expect(() => validateNPCDefinition(FATHER_OKONKWO)).not.toThrow();
    });

    it('should throw error for NPC missing required fields', () => {
      const invalidNPC = {
        id: 'test_npc',
        name: 'Test NPC'
        // Missing other required fields
      };

      expect(() => validateNPCDefinition(invalidNPC)).toThrow('Invalid NPC definition: missing required field');
    });

    it('should throw error for NPC missing personality traits', () => {
      const invalidNPC = {
        id: 'test_npc',
        name: 'Test NPC',
        role: 'Test Role',
        system: 0,
        station: 'Test Station',
        personality: {
          trust: 0.5
          // Missing other personality traits
        },
        speechStyle: {
          greeting: 'casual',
          vocabulary: 'simple',
          quirk: 'test quirk'
        },
        description: 'Test description',
        initialRep: 0
      };

      expect(() => validateNPCDefinition(invalidNPC)).toThrow('Invalid NPC definition: missing personality trait');
    });

    it('should throw error for NPC missing speech style properties', () => {
      const invalidNPC = {
        id: 'test_npc',
        name: 'Test NPC',
        role: 'Test Role',
        system: 0,
        station: 'Test Station',
        personality: {
          trust: 0.5,
          greed: 0.3,
          loyalty: 0.7,
          morality: 0.6
        },
        speechStyle: {
          greeting: 'casual'
          // Missing other speech style properties
        },
        description: 'Test description',
        initialRep: 0
      };

      expect(() => validateNPCDefinition(invalidNPC)).toThrow('Invalid NPC definition: missing speechStyle property');
    });
  });

  describe('Reputation Tiers Configuration', () => {
    it('should have all required reputation tiers', () => {
      expect(REPUTATION_TIERS.hostile).toBeDefined();
      expect(REPUTATION_TIERS.cold).toBeDefined();
      expect(REPUTATION_TIERS.neutral).toBeDefined();
      expect(REPUTATION_TIERS.warm).toBeDefined();
      expect(REPUTATION_TIERS.friendly).toBeDefined();
      expect(REPUTATION_TIERS.trusted).toBeDefined();
      expect(REPUTATION_TIERS.family).toBeDefined();
    });

    it('should have correct reputation tier ranges', () => {
      expect(REPUTATION_TIERS.hostile.min).toBe(-100);
      expect(REPUTATION_TIERS.hostile.max).toBe(-50);
      expect(REPUTATION_TIERS.hostile.name).toBe('Hostile');

      expect(REPUTATION_TIERS.cold.min).toBe(-49);
      expect(REPUTATION_TIERS.cold.max).toBe(-10);
      expect(REPUTATION_TIERS.cold.name).toBe('Cold');

      expect(REPUTATION_TIERS.neutral.min).toBe(-9);
      expect(REPUTATION_TIERS.neutral.max).toBe(9);
      expect(REPUTATION_TIERS.neutral.name).toBe('Neutral');

      expect(REPUTATION_TIERS.warm.min).toBe(10);
      expect(REPUTATION_TIERS.warm.max).toBe(29);
      expect(REPUTATION_TIERS.warm.name).toBe('Warm');

      expect(REPUTATION_TIERS.friendly.min).toBe(30);
      expect(REPUTATION_TIERS.friendly.max).toBe(59);
      expect(REPUTATION_TIERS.friendly.name).toBe('Friendly');

      expect(REPUTATION_TIERS.trusted.min).toBe(60);
      expect(REPUTATION_TIERS.trusted.max).toBe(89);
      expect(REPUTATION_TIERS.trusted.name).toBe('Trusted');

      expect(REPUTATION_TIERS.family.min).toBe(90);
      expect(REPUTATION_TIERS.family.max).toBe(100);
      expect(REPUTATION_TIERS.family.name).toBe('Family');
    });
  });
});