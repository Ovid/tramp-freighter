import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  WEI_CHEN,
  MARCUS_COLE,
  FATHER_OKONKWO,
  ALL_NPCS,
  validateNPCDefinition,
  validateAllNPCs,
} from '../../src/game/data/npc-data.js';
import {
  REPUTATION_TIERS,
  REPUTATION_BOUNDS,
} from '../../src/game/constants.js';

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
  describe("Wei Chen (Dock Worker at Barnard's Star)", () => {
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

    it('should validate all NPCs using validateAllNPCs function', () => {
      expect(() => validateAllNPCs()).not.toThrow();
    });

    it('should throw error for NPC missing required fields', () => {
      const invalidNPC = {
        id: 'test_npc',
        name: 'Test NPC',
        // Missing other required fields
      };

      expect(() => validateNPCDefinition(invalidNPC)).toThrow(
        'Invalid NPC definition: missing required field'
      );
    });

    it('should throw error for NPC missing personality traits', () => {
      const invalidNPC = {
        id: 'test_npc',
        name: 'Test NPC',
        role: 'Test Role',
        system: 0,
        station: 'Test Station',
        personality: {
          trust: 0.5,
          // Missing other personality traits
        },
        speechStyle: {
          greeting: 'casual',
          vocabulary: 'simple',
          quirk: 'test quirk',
        },
        description: 'Test description',
        initialRep: 0,
      };

      expect(() => validateNPCDefinition(invalidNPC)).toThrow(
        'Invalid NPC definition: missing personality trait'
      );
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
          morality: 0.6,
        },
        speechStyle: {
          greeting: 'casual',
          // Missing other speech style properties
        },
        description: 'Test description',
        initialRep: 0,
      };

      expect(() => validateNPCDefinition(invalidNPC)).toThrow(
        'Invalid NPC definition: missing speechStyle property'
      );
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
      expect(REPUTATION_TIERS.hostile.min).toBe(REPUTATION_BOUNDS.MIN);
      expect(REPUTATION_TIERS.hostile.max).toBe(REPUTATION_BOUNDS.HOSTILE_MAX);
      expect(REPUTATION_TIERS.hostile.name).toBe('Hostile');

      expect(REPUTATION_TIERS.cold.min).toBe(REPUTATION_BOUNDS.COLD_MIN);
      expect(REPUTATION_TIERS.cold.max).toBe(REPUTATION_BOUNDS.COLD_MAX);
      expect(REPUTATION_TIERS.cold.name).toBe('Cold');

      expect(REPUTATION_TIERS.neutral.min).toBe(REPUTATION_BOUNDS.NEUTRAL_MIN);
      expect(REPUTATION_TIERS.neutral.max).toBe(REPUTATION_BOUNDS.NEUTRAL_MAX);
      expect(REPUTATION_TIERS.neutral.name).toBe('Neutral');

      expect(REPUTATION_TIERS.warm.min).toBe(REPUTATION_BOUNDS.WARM_MIN);
      expect(REPUTATION_TIERS.warm.max).toBe(REPUTATION_BOUNDS.WARM_MAX);
      expect(REPUTATION_TIERS.warm.name).toBe('Warm');

      expect(REPUTATION_TIERS.friendly.min).toBe(
        REPUTATION_BOUNDS.FRIENDLY_MIN
      );
      expect(REPUTATION_TIERS.friendly.max).toBe(
        REPUTATION_BOUNDS.FRIENDLY_MAX
      );
      expect(REPUTATION_TIERS.friendly.name).toBe('Friendly');

      expect(REPUTATION_TIERS.trusted.min).toBe(REPUTATION_BOUNDS.TRUSTED_MIN);
      expect(REPUTATION_TIERS.trusted.max).toBe(REPUTATION_BOUNDS.TRUSTED_MAX);
      expect(REPUTATION_TIERS.trusted.name).toBe('Trusted');

      expect(REPUTATION_TIERS.family.min).toBe(REPUTATION_BOUNDS.FAMILY_MIN);
      expect(REPUTATION_TIERS.family.max).toBe(REPUTATION_BOUNDS.MAX);
      expect(REPUTATION_TIERS.family.name).toBe('Family');
    });
  });

  describe('Property-Based Tests for Universal NPC Properties', () => {
    it('should have personality traits within valid range [0, 1]', () => {
      fc.assert(
        fc.property(fc.constantFrom(...ALL_NPCS), (npc) => {
          // All personality traits must be between 0 and 1 inclusive
          expect(npc.personality.trust).toBeGreaterThanOrEqual(0);
          expect(npc.personality.trust).toBeLessThanOrEqual(1);
          expect(npc.personality.greed).toBeGreaterThanOrEqual(0);
          expect(npc.personality.greed).toBeLessThanOrEqual(1);
          expect(npc.personality.loyalty).toBeGreaterThanOrEqual(0);
          expect(npc.personality.loyalty).toBeLessThanOrEqual(1);
          expect(npc.personality.morality).toBeGreaterThanOrEqual(0);
          expect(npc.personality.morality).toBeLessThanOrEqual(1);
        })
      );
    });

    it('should have valid system IDs (non-negative integers)', () => {
      fc.assert(
        fc.property(fc.constantFrom(...ALL_NPCS), (npc) => {
          expect(typeof npc.system).toBe('number');
          expect(Number.isInteger(npc.system)).toBe(true);
          expect(npc.system).toBeGreaterThanOrEqual(0);
        })
      );
    });

    it('should have initial reputation within valid range [-100, 100]', () => {
      fc.assert(
        fc.property(fc.constantFrom(...ALL_NPCS), (npc) => {
          expect(typeof npc.initialRep).toBe('number');
          expect(npc.initialRep).toBeGreaterThanOrEqual(REPUTATION_BOUNDS.MIN);
          expect(npc.initialRep).toBeLessThanOrEqual(REPUTATION_BOUNDS.MAX);
        })
      );
    });

    it('should have non-empty string fields for identification', () => {
      fc.assert(
        fc.property(fc.constantFrom(...ALL_NPCS), (npc) => {
          // ID, name, role, station, and description must be non-empty strings
          expect(typeof npc.id).toBe('string');
          expect(npc.id.length).toBeGreaterThan(0);
          expect(typeof npc.name).toBe('string');
          expect(npc.name.length).toBeGreaterThan(0);
          expect(typeof npc.role).toBe('string');
          expect(npc.role.length).toBeGreaterThan(0);
          expect(typeof npc.station).toBe('string');
          expect(npc.station.length).toBeGreaterThan(0);
          expect(typeof npc.description).toBe('string');
          expect(npc.description.length).toBeGreaterThan(0);
        })
      );
    });

    it('should have valid speech style properties', () => {
      fc.assert(
        fc.property(fc.constantFrom(...ALL_NPCS), (npc) => {
          // Speech style properties must be non-empty strings
          expect(typeof npc.speechStyle.greeting).toBe('string');
          expect(npc.speechStyle.greeting.length).toBeGreaterThan(0);
          expect(typeof npc.speechStyle.vocabulary).toBe('string');
          expect(npc.speechStyle.vocabulary.length).toBeGreaterThan(0);
          expect(typeof npc.speechStyle.quirk).toBe('string');
          expect(npc.speechStyle.quirk.length).toBeGreaterThan(0);
        })
      );
    });

    it('should have unique IDs across all NPCs', () => {
      const ids = ALL_NPCS.map((npc) => npc.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should pass validation for all NPCs', () => {
      fc.assert(
        fc.property(fc.constantFrom(...ALL_NPCS), (npc) => {
          expect(() => validateNPCDefinition(npc)).not.toThrow();
        })
      );
    });
  });
});
