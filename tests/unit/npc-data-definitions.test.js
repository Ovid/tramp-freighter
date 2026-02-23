import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  WEI_CHEN,
  MARCUS_COLE,
  FATHER_OKONKWO,
  WHISPER,
  CAPTAIN_VASQUEZ,
  DR_SARAH_KIM,
  RUSTY_RODRIGUEZ,
  ZARA_OSMAN,
  STATION_MASTER_KOWALSKI,
  LUCKY_LIU,
  YUKI_TANAKA,
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
  const FOUNDATION_NPC_CASES = [
    {
      label: "Wei Chen (Dock Worker at Barnard's Star)",
      npc: WEI_CHEN,
      expectedBasic: { id: 'chen_barnards', name: 'Wei Chen', role: 'Dock Worker' },
      expectedPersonality: { trust: 0.3, greed: 0.2, loyalty: 0.8, morality: 0.6 },
      expectedLocation: { system: 4, station: 'Bore Station 7' },
      expectedSpeechStyle: { greeting: 'casual', vocabulary: 'simple', quirk: 'drops articles' },
      expectedInitialRep: 0,
    },
    {
      label: 'Marcus Cole (Loan Shark at Sol)',
      npc: MARCUS_COLE,
      expectedBasic: { id: 'cole_sol', name: 'Marcus Cole', role: 'Loan Shark' },
      expectedPersonality: { trust: 0.1, greed: 0.9, loyalty: 0.3, morality: 0.2 },
      expectedLocation: { system: 0, station: 'Sol Central' },
      expectedSpeechStyle: { greeting: 'formal', vocabulary: 'educated', quirk: 'short clipped sentences' },
      expectedInitialRep: -20,
    },
    {
      label: 'Father Okonkwo (Chaplain at Ross 154)',
      npc: FATHER_OKONKWO,
      expectedBasic: { id: 'okonkwo_ross154', name: 'Father Okonkwo', role: 'Chaplain' },
      expectedPersonality: { trust: 0.7, greed: 0.0, loyalty: 0.9, morality: 0.9 },
      expectedLocation: { system: 11, station: 'Ross 154 Medical' },
      expectedSpeechStyle: { greeting: 'warm', vocabulary: 'educated', quirk: 'religious metaphors' },
      expectedInitialRep: 10,
    },
  ];

  describe.each(FOUNDATION_NPC_CASES)('$label', ({ npc, expectedBasic, expectedPersonality, expectedLocation, expectedSpeechStyle, expectedInitialRep }) => {
    it('should have correct personality traits', () => {
      expect(npc.personality.trust).toBe(expectedPersonality.trust);
      expect(npc.personality.greed).toBe(expectedPersonality.greed);
      expect(npc.personality.loyalty).toBe(expectedPersonality.loyalty);
      expect(npc.personality.morality).toBe(expectedPersonality.morality);
    });

    it('should have correct initial reputation', () => {
      expect(npc.initialRep).toBe(expectedInitialRep);
    });

    it('should be assigned to correct system and station', () => {
      expect(npc.system).toBe(expectedLocation.system);
      expect(npc.station).toBe(expectedLocation.station);
    });

    it('should have correct basic information', () => {
      expect(npc.id).toBe(expectedBasic.id);
      expect(npc.name).toBe(expectedBasic.name);
      expect(npc.role).toBe(expectedBasic.role);
    });

    it('should have correct speech style', () => {
      expect(npc.speechStyle.greeting).toBe(expectedSpeechStyle.greeting);
      expect(npc.speechStyle.vocabulary).toBe(expectedSpeechStyle.vocabulary);
      expect(npc.speechStyle.quirk).toBe(expectedSpeechStyle.quirk);
    });
  });

  describe('NPC Collection and Validation', () => {
    it('should include all eleven NPCs in ALL_NPCS array', () => {
      expect(ALL_NPCS).toHaveLength(11);
      expect(ALL_NPCS).toContain(WEI_CHEN);
      expect(ALL_NPCS).toContain(MARCUS_COLE);
      expect(ALL_NPCS).toContain(FATHER_OKONKWO);
      expect(ALL_NPCS).toContain(WHISPER);
      expect(ALL_NPCS).toContain(CAPTAIN_VASQUEZ);
      expect(ALL_NPCS).toContain(DR_SARAH_KIM);
      expect(ALL_NPCS).toContain(RUSTY_RODRIGUEZ);
      expect(ALL_NPCS).toContain(ZARA_OSMAN);
      expect(ALL_NPCS).toContain(STATION_MASTER_KOWALSKI);
      expect(ALL_NPCS).toContain(LUCKY_LIU);
      expect(ALL_NPCS).toContain(YUKI_TANAKA);
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
        // Missing other required fields including tips, discountService, tierBenefits
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
        tips: [],
        discountService: null,
        tierBenefits: {
          warm: { discount: 0, benefit: 'test' },
          friendly: { discount: 0, benefit: 'test' },
          trusted: { discount: 0, benefit: 'test' },
          family: { discount: 0, benefit: 'test' },
        },
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
        tips: [],
        discountService: null,
        tierBenefits: {
          warm: { discount: 0, benefit: 'test' },
          friendly: { discount: 0, benefit: 'test' },
          trusted: { discount: 0, benefit: 'test' },
          family: { discount: 0, benefit: 'test' },
        },
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
