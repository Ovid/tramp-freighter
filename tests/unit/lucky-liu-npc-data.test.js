import { describe, it, expect } from 'vitest';
import { LUCKY_LIU, validateNPCDefinition } from '../../src/game/data/npc-data.js';

/**
 * Unit tests for "Lucky" Liu NPC data definition
 * Feature: npc-benefits
 * 
 * **Validates: Requirements 10.1-10.10**
 * 
 * Verifies that "Lucky" Liu NPC has correct personality traits, system/station assignment,
 * speech style, tips array, discount service, and tier benefits as specified in requirements.
 */
describe('"Lucky" Liu NPC Data Definition', () => {
  it('should have correct personality traits', () => {
    expect(LUCKY_LIU.personality.trust).toBe(0.6);
    expect(LUCKY_LIU.personality.greed).toBe(0.8);
    expect(LUCKY_LIU.personality.loyalty).toBe(0.4);
    expect(LUCKY_LIU.personality.morality).toBe(0.3);
  });

  it('should have correct initial reputation', () => {
    expect(LUCKY_LIU.initialRep).toBe(0);
  });

  it('should be assigned to correct system and station', () => {
    expect(LUCKY_LIU.system).toBe(8); // Wolf 359
    expect(LUCKY_LIU.station).toBe('Wolf 359 Station');
  });

  it('should have correct basic information', () => {
    expect(LUCKY_LIU.id).toBe('liu_wolf359');
    expect(LUCKY_LIU.name).toBe('"Lucky" Liu');
    expect(LUCKY_LIU.role).toBe('Gambler');
  });

  it('should have correct speech style', () => {
    expect(LUCKY_LIU.speechStyle.greeting).toBe('casual');
    expect(LUCKY_LIU.speechStyle.vocabulary).toBe('slang');
    expect(LUCKY_LIU.speechStyle.quirk).toBe('gambling metaphors');
  });

  it('should have correct description', () => {
    expect(LUCKY_LIU.description).toBe('Professional gambler and risk-taker. Loves long odds. Respects bold moves.');
  });

  it('should have correct tips array', () => {
    expect(Array.isArray(LUCKY_LIU.tips)).toBe(true);
    expect(LUCKY_LIU.tips).toHaveLength(3);
    expect(LUCKY_LIU.tips).toContain('Sometimes you gotta take risks. Big risks, big rewards.');
    expect(LUCKY_LIU.tips).toContain('I heard about a high-stakes cargo run. Interested?');
    expect(LUCKY_LIU.tips).toContain("Don't play it safe all the time. Fortune favors the bold.");
  });

  it('should have correct discount service', () => {
    expect(LUCKY_LIU.discountService).toBe(null);
  });

  it('should have correct tier benefits structure', () => {
    expect(LUCKY_LIU.tierBenefits).toBeDefined();
    expect(LUCKY_LIU.tierBenefits.warm).toBeDefined();
    expect(LUCKY_LIU.tierBenefits.friendly).toBeDefined();
    expect(LUCKY_LIU.tierBenefits.trusted).toBeDefined();
    expect(LUCKY_LIU.tierBenefits.family).toBeDefined();
  });

  it('should have correct tier benefits content', () => {
    expect(LUCKY_LIU.tierBenefits.warm.discount).toBe(0);
    expect(LUCKY_LIU.tierBenefits.warm.benefit).toBe('Risk-taking tips');
    
    expect(LUCKY_LIU.tierBenefits.friendly.discount).toBe(0);
    expect(LUCKY_LIU.tierBenefits.friendly.benefit).toBe('₡500 stake mechanic');
    
    expect(LUCKY_LIU.tierBenefits.trusted.discount).toBe(0);
    expect(LUCKY_LIU.tierBenefits.trusted.benefit).toBe('Insider information');
    
    expect(LUCKY_LIU.tierBenefits.family.discount).toBe(0);
    expect(LUCKY_LIU.tierBenefits.family.benefit).toBe('High-risk exclusive opportunities');
  });

  it('should pass NPC validation', () => {
    expect(() => validateNPCDefinition(LUCKY_LIU)).not.toThrow();
  });
});