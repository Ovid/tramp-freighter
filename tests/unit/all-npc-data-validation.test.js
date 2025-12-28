import { describe, it, expect } from 'vitest';
import {
  WHISPER,
  CAPTAIN_VASQUEZ,
  DR_SARAH_KIM,
  RUSTY_RODRIGUEZ,
  ZARA_OSMAN,
  STATION_MASTER_KOWALSKI,
  LUCKY_LIU,
  validateNPCDefinition,
} from '../../src/game/data/npc-data.js';
import { NPC_VALIDATION, REPUTATION_BOUNDS } from '../../src/game/constants.js';

/**
 * Unit tests for all new NPC data validation
 * Feature: npc-benefits
 *
 * **Validates: Requirements 4.1-4.15, 5.1-5.11, 6.1-6.10, 7.1-7.10, 8.1-8.10, 9.1-9.10, 10.1-10.10**
 *
 * Verifies that all new NPCs have required fields and values match specification ranges.
 * Tests each specific NPC definition for compliance with the NPC benefits system.
 */
describe('All New NPC Data Validation', () => {
  // Array of all new NPCs for testing
  const NEW_NPCS = [
    WHISPER,
    CAPTAIN_VASQUEZ,
    DR_SARAH_KIM,
    RUSTY_RODRIGUEZ,
    ZARA_OSMAN,
    STATION_MASTER_KOWALSKI,
    LUCKY_LIU,
  ];

  it('should have all required fields for every new NPC', () => {
    NEW_NPCS.forEach((npc) => {
      // For all NPCs, all required fields must exist
      for (const field of NPC_VALIDATION.REQUIRED_FIELDS) {
        expect(npc).toHaveProperty(field);
        expect(npc[field]).toBeDefined();
      }
    });
  });

  it('should have personality traits within valid range [0, 1] for every new NPC', () => {
    NEW_NPCS.forEach((npc) => {
      // For all NPCs, all personality traits must be between 0 and 1 inclusive
      expect(npc.personality.trust).toBeGreaterThanOrEqual(0);
      expect(npc.personality.trust).toBeLessThanOrEqual(1);
      expect(npc.personality.greed).toBeGreaterThanOrEqual(0);
      expect(npc.personality.greed).toBeLessThanOrEqual(1);
      expect(npc.personality.loyalty).toBeGreaterThanOrEqual(0);
      expect(npc.personality.loyalty).toBeLessThanOrEqual(1);
      expect(npc.personality.morality).toBeGreaterThanOrEqual(0);
      expect(npc.personality.morality).toBeLessThanOrEqual(1);
    });
  });

  it('should have valid system IDs (non-negative integers) for every new NPC', () => {
    NEW_NPCS.forEach((npc) => {
      // For all NPCs, system ID must be a non-negative integer
      expect(typeof npc.system).toBe('number');
      expect(Number.isInteger(npc.system)).toBe(true);
      expect(npc.system).toBeGreaterThanOrEqual(0);
    });
  });

  it('should have initial reputation within valid range [-100, 100] for every new NPC', () => {
    NEW_NPCS.forEach((npc) => {
      // For all NPCs, initial reputation must be within bounds
      expect(typeof npc.initialRep).toBe('number');
      expect(npc.initialRep).toBeGreaterThanOrEqual(REPUTATION_BOUNDS.MIN);
      expect(npc.initialRep).toBeLessThanOrEqual(REPUTATION_BOUNDS.MAX);
    });
  });

  it('should have non-empty string fields for identification for every new NPC', () => {
    NEW_NPCS.forEach((npc) => {
      // For all NPCs, identification strings must be non-empty
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
    });
  });

  it('should have valid speech style properties for every new NPC', () => {
    NEW_NPCS.forEach((npc) => {
      // For all NPCs, speech style properties must be non-empty strings
      expect(typeof npc.speechStyle.greeting).toBe('string');
      expect(npc.speechStyle.greeting.length).toBeGreaterThan(0);
      expect(typeof npc.speechStyle.vocabulary).toBe('string');
      expect(npc.speechStyle.vocabulary.length).toBeGreaterThan(0);
      expect(typeof npc.speechStyle.quirk).toBe('string');
      expect(npc.speechStyle.quirk.length).toBeGreaterThan(0);
    });
  });

  it('should have valid tips array for every new NPC', () => {
    NEW_NPCS.forEach((npc) => {
      // For all NPCs, tips must be an array
      expect(Array.isArray(npc.tips)).toBe(true);

      // For all NPCs with tips, each tip must be a non-empty string
      npc.tips.forEach((tip) => {
        expect(typeof tip).toBe('string');
        expect(tip.length).toBeGreaterThan(0);
      });
    });
  });

  it('should have valid discount service for every new NPC', () => {
    NEW_NPCS.forEach((npc) => {
      // For all NPCs, discountService must be string or null
      expect(
        npc.discountService === null || typeof npc.discountService === 'string'
      ).toBe(true);

      // If discountService is a string, it must be non-empty
      if (typeof npc.discountService === 'string') {
        expect(npc.discountService.length).toBeGreaterThan(0);
      }
    });
  });

  it('should have valid tier benefits structure for every new NPC', () => {
    NEW_NPCS.forEach((npc) => {
      // For all NPCs, tierBenefits must have all required tiers
      for (const tier of NPC_VALIDATION.REQUIRED_TIER_BENEFITS) {
        expect(npc.tierBenefits).toHaveProperty(tier);
        expect(npc.tierBenefits[tier]).toBeDefined();
        expect(npc.tierBenefits[tier]).toHaveProperty('discount');
        expect(npc.tierBenefits[tier]).toHaveProperty('benefit');

        // Discount must be a number >= 0
        expect(typeof npc.tierBenefits[tier].discount).toBe('number');
        expect(npc.tierBenefits[tier].discount).toBeGreaterThanOrEqual(0);

        // Benefit must be a non-empty string
        expect(typeof npc.tierBenefits[tier].benefit).toBe('string');
        expect(npc.tierBenefits[tier].benefit.length).toBeGreaterThan(0);
      }
    });
  });

  it('should pass NPC validation for every new NPC', () => {
    NEW_NPCS.forEach((npc) => {
      // For all NPCs, validation must pass without throwing
      expect(() => validateNPCDefinition(npc)).not.toThrow();
    });
  });

  it('should have unique IDs across all new NPCs', () => {
    // This validates uniqueness constraint across all NPCs
    const ids = NEW_NPCS.map((npc) => npc.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have specific personality values matching requirements for each NPC', () => {
    // Whisper - Requirements 4.4
    expect(WHISPER.personality.trust).toBe(0.5);
    expect(WHISPER.personality.greed).toBe(0.7);
    expect(WHISPER.personality.loyalty).toBe(0.5);
    expect(WHISPER.personality.morality).toBe(0.4);

    // Captain Vasquez - Requirements 5.4
    expect(CAPTAIN_VASQUEZ.personality.trust).toBe(0.6);
    expect(CAPTAIN_VASQUEZ.personality.greed).toBe(0.3);
    expect(CAPTAIN_VASQUEZ.personality.loyalty).toBe(0.7);
    expect(CAPTAIN_VASQUEZ.personality.morality).toBe(0.7);

    // Dr. Sarah Kim - Requirements 6.4
    expect(DR_SARAH_KIM.personality.trust).toBe(0.4);
    expect(DR_SARAH_KIM.personality.greed).toBe(0.5);
    expect(DR_SARAH_KIM.personality.loyalty).toBe(0.6);
    expect(DR_SARAH_KIM.personality.morality).toBe(0.8);

    // "Rusty" Rodriguez - Requirements 7.4
    expect(RUSTY_RODRIGUEZ.personality.trust).toBe(0.7);
    expect(RUSTY_RODRIGUEZ.personality.greed).toBe(0.4);
    expect(RUSTY_RODRIGUEZ.personality.loyalty).toBe(0.8);
    expect(RUSTY_RODRIGUEZ.personality.morality).toBe(0.5);

    // Zara Osman - Requirements 8.4
    expect(ZARA_OSMAN.personality.trust).toBe(0.5);
    expect(ZARA_OSMAN.personality.greed).toBe(0.6);
    expect(ZARA_OSMAN.personality.loyalty).toBe(0.6);
    expect(ZARA_OSMAN.personality.morality).toBe(0.5);

    // Station Master Kowalski - Requirements 9.4
    expect(STATION_MASTER_KOWALSKI.personality.trust).toBe(0.3);
    expect(STATION_MASTER_KOWALSKI.personality.greed).toBe(0.4);
    expect(STATION_MASTER_KOWALSKI.personality.loyalty).toBe(0.7);
    expect(STATION_MASTER_KOWALSKI.personality.morality).toBe(0.7);

    // "Lucky" Liu - Requirements 10.4
    expect(LUCKY_LIU.personality.trust).toBe(0.6);
    expect(LUCKY_LIU.personality.greed).toBe(0.8);
    expect(LUCKY_LIU.personality.loyalty).toBe(0.4);
    expect(LUCKY_LIU.personality.morality).toBe(0.3);
  });
});
