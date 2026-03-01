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
import { NPC_INITIAL_REPUTATION } from '../../src/game/constants.js';

/**
 * Parameterized NPC data validation tests
 * Feature: npc-benefits
 *
 * **Validates: Requirements 4.1-4.15, 5.1-5.11, 6.1-6.10, 7.1-7.10, 8.1-8.10, 9.1-9.10, 10.1-10.10**
 *
 * Consolidates per-NPC data validation into a single parameterized suite.
 * Each NPC is tested for required fields, basic information, personality traits,
 * speech style, initial reputation, tips, discount service, tier benefits, and
 * validation function compliance.
 *
 * Replaces:
 *   - captain-vasquez-npc-data.test.js
 *   - dr-sarah-kim-npc-data.test.js
 *   - lucky-liu-npc-data.test.js
 *   - rusty-rodriguez-npc-data.test.js
 *   - station-master-kowalski-npc-data.test.js
 *   - whisper-npc-data.test.js
 *   - zara-osman-npc-data.test.js
 */

const NPC_TEST_CASES = [
  {
    npc: WHISPER,
    label: 'Whisper (Information Broker at Sirius A)',
    expectedBasic: {
      id: 'whisper_sirius',
      name: 'Whisper',
      role: 'Information Broker',
      system: 7,
      station: 'Sirius Exchange',
    },
    expectedPersonality: {
      trust: 0.5,
      greed: 0.7,
      loyalty: 0.5,
      morality: 0.4,
    },
    expectedSpeechStyle: {
      greeting: 'formal',
      vocabulary: 'educated',
      quirk: 'cryptic measured tones',
    },
    expectedInitialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
    expectedDiscountService: 'intel',
    expectedTipSamples: [],
  },
  {
    npc: CAPTAIN_VASQUEZ,
    label: 'Captain Vasquez (Retired Trader at Epsilon Eridani)',
    expectedBasic: {
      id: 'vasquez_epsilon',
      name: 'Captain Vasquez',
      role: 'Retired Trader',
      system: 13,
      station: 'Eridani Hub',
    },
    expectedPersonality: {
      trust: 0.6,
      greed: 0.3,
      loyalty: 0.7,
      morality: 0.7,
    },
    expectedSpeechStyle: {
      greeting: 'warm',
      vocabulary: 'simple',
      quirk: 'trading stories',
    },
    expectedInitialRep: 5,
    expectedDiscountService: null,
    expectedTipSamples: [
      "Barnard's Star always needs ore. Mining station, you know.",
      'Sirius A pays top credit for luxury goods. Rich folks.',
      'The Procyon run is profitable if you can afford the fuel.',
    ],
  },
  {
    npc: DR_SARAH_KIM,
    label: 'Dr. Sarah Kim (Station Administrator at Tau Ceti)',
    expectedBasic: {
      id: 'kim_tau_ceti',
      name: 'Dr. Sarah Kim',
      role: 'Station Administrator',
      system: 5,
      station: 'Tau Ceti Station',
    },
    expectedPersonality: {
      trust: 0.4,
      greed: 0.5,
      loyalty: 0.6,
      morality: 0.8,
    },
    expectedSpeechStyle: {
      greeting: 'formal',
      vocabulary: 'technical',
      quirk: 'regulation citations',
    },
    expectedInitialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
    expectedDiscountService: 'docking',
    expectedTipSamples: [
      'We have strict customs here. Keep your cargo manifest accurate.',
      'Medicine prices are stable at Ross 154. Good for planning.',
      'Fuel efficiency matters on long routes. Upgrade your engine.',
    ],
  },
  {
    npc: RUSTY_RODRIGUEZ,
    label: '"Rusty" Rodriguez (Mechanic at Procyon)',
    expectedBasic: {
      id: 'rodriguez_procyon',
      name: '"Rusty" Rodriguez',
      role: 'Mechanic',
      system: 6,
      station: 'Procyon Depot',
    },
    expectedPersonality: {
      trust: 0.7,
      greed: 0.4,
      loyalty: 0.8,
      morality: 0.5,
    },
    expectedSpeechStyle: {
      greeting: 'gruff',
      vocabulary: 'technical',
      quirk: 'ship personification',
    },
    expectedInitialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
    expectedDiscountService: 'repair',
    expectedTipSamples: [
      "Don't let your hull drop below 50%. Expensive to fix after that.",
      'Engine degradation is real. Budget for maintenance.',
      'Life support is critical. Never skip those repairs.',
    ],
  },
  {
    npc: ZARA_OSMAN,
    label: "Zara Osman (Trader at Luyten's Star)",
    expectedBasic: {
      id: 'osman_luyten',
      name: 'Zara Osman',
      role: 'Trader',
      system: 7,
      station: "Luyten's Outpost",
    },
    expectedPersonality: {
      trust: 0.5,
      greed: 0.6,
      loyalty: 0.6,
      morality: 0.5,
    },
    expectedSpeechStyle: {
      greeting: 'casual',
      vocabulary: 'slang',
      quirk: 'trading jargon',
    },
    expectedInitialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
    expectedDiscountService: 'trade',
    expectedTipSamples: [
      'Buy low at mining stations, sell high at rich systems.',
      'Luxury goods have the best margins if you can afford the capital.',
      'Watch for economic events. They shift prices dramatically.',
    ],
  },
  {
    npc: STATION_MASTER_KOWALSKI,
    label: 'Station Master Kowalski (Station Master at Alpha Centauri)',
    expectedBasic: {
      id: 'kowalski_alpha_centauri',
      name: 'Station Master Kowalski',
      role: 'Station Master',
      system: 1,
      station: 'Centauri Station',
    },
    expectedPersonality: {
      trust: 0.3,
      greed: 0.4,
      loyalty: 0.7,
      morality: 0.7,
    },
    expectedSpeechStyle: {
      greeting: 'gruff',
      vocabulary: 'simple',
      quirk: 'no-nonsense direct',
    },
    expectedInitialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
    expectedDiscountService: 'docking',
    expectedTipSamples: [],
  },
  {
    npc: LUCKY_LIU,
    label: '"Lucky" Liu (Gambler at Wolf 359)',
    expectedBasic: {
      id: 'liu_wolf359',
      name: '"Lucky" Liu',
      role: 'Gambler',
      system: 5,
      station: 'Wolf 359 Station',
    },
    expectedPersonality: {
      trust: 0.6,
      greed: 0.8,
      loyalty: 0.4,
      morality: 0.3,
    },
    expectedSpeechStyle: {
      greeting: 'casual',
      vocabulary: 'slang',
      quirk: 'gambling metaphors',
    },
    expectedInitialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
    expectedDiscountService: null,
    expectedTipSamples: [
      'Sometimes you gotta take risks. Big risks, big rewards.',
      'I heard about a high-stakes cargo run. Interested?',
      "Don't play it safe all the time. Fortune favors the bold.",
    ],
  },
];

describe('NPC Data Validation (Parameterized)', () => {
  describe.each(NPC_TEST_CASES)(
    '$label',
    ({
      npc,
      expectedBasic,
      expectedPersonality,
      expectedSpeechStyle,
      expectedInitialRep,
      expectedDiscountService,
      expectedTipSamples,
    }) => {
      it('should have all required fields for NPC benefits system', () => {
        expect(npc.id).toBeDefined();
        expect(npc.name).toBeDefined();
        expect(npc.role).toBeDefined();
        expect(npc.system).toBeDefined();
        expect(npc.station).toBeDefined();
        expect(npc.personality).toBeDefined();
        expect(npc.speechStyle).toBeDefined();
        expect(npc.description).toBeDefined();
        expect(npc.initialRep).toBeDefined();
        expect(npc.tips).toBeDefined();
        expect(npc.discountService).toBeDefined();
        expect(npc.tierBenefits).toBeDefined();
      });

      it('should have correct basic information', () => {
        expect(npc.id).toBe(expectedBasic.id);
        expect(npc.name).toBe(expectedBasic.name);
        expect(npc.role).toBe(expectedBasic.role);
        expect(npc.system).toBe(expectedBasic.system);
        expect(npc.station).toBe(expectedBasic.station);
      });

      it('should have correct personality values matching specification', () => {
        expect(npc.personality.trust).toBe(expectedPersonality.trust);
        expect(npc.personality.greed).toBe(expectedPersonality.greed);
        expect(npc.personality.loyalty).toBe(expectedPersonality.loyalty);
        expect(npc.personality.morality).toBe(expectedPersonality.morality);
      });

      it('should have correct speech style', () => {
        expect(npc.speechStyle.greeting).toBe(expectedSpeechStyle.greeting);
        expect(npc.speechStyle.vocabulary).toBe(expectedSpeechStyle.vocabulary);
        expect(npc.speechStyle.quirk).toBe(expectedSpeechStyle.quirk);
      });

      it('should have correct initial reputation', () => {
        expect(npc.initialRep).toBe(expectedInitialRep);
      });

      it('should have non-empty tips array with valid strings', () => {
        expect(Array.isArray(npc.tips)).toBe(true);
        expect(npc.tips.length).toBeGreaterThan(0);

        npc.tips.forEach((tip) => {
          expect(typeof tip).toBe('string');
          expect(tip.length).toBeGreaterThan(0);
        });
      });

      if (expectedTipSamples.length > 0) {
        it('should contain expected tip samples', () => {
          expectedTipSamples.forEach((tip) => {
            expect(npc.tips).toContain(tip);
          });
        });
      }

      it('should have correct discount service', () => {
        expect(npc.discountService).toBe(expectedDiscountService);
      });

      it('should have correct tier benefits configuration', () => {
        expect(npc.tierBenefits).toBeDefined();
        expect(npc.tierBenefits.warm).toBeDefined();
        expect(npc.tierBenefits.friendly).toBeDefined();
        expect(npc.tierBenefits.trusted).toBeDefined();
        expect(npc.tierBenefits.family).toBeDefined();

        expect(npc.tierBenefits.warm.discount).toBeDefined();
        expect(npc.tierBenefits.warm.benefit).toBeDefined();
      });

      it('should pass NPC validation', () => {
        expect(() => validateNPCDefinition(npc)).not.toThrow();
      });
    }
  );
});
