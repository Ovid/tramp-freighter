/**
 * @fileoverview NPC Data Definitions
 *
 * Static definitions for all NPCs in the game. Each NPC has a unique personality,
 * speech style, and is located at a specific station in a specific star system.
 * This data drives the relationship and dialogue systems.
 *
 * Usage:
 * - Import individual NPCs: `import { WEI_CHEN } from './npc-data.js'`
 * - Import all NPCs: `import { ALL_NPCS } from './npc-data.js'`
 * - Validate NPC definitions: `validateNPCDefinition(npcObject)`
 *
 * @module NPCData
 */

import {
  NPC_VALIDATION,
  NPC_PERSONALITY_VALUES,
  NPC_INITIAL_REPUTATION,
} from '../constants.js';

/**
 * Validates that an NPC definition has all required fields
 * @param {Object} npc - NPC definition to validate
 * @throws {Error} If any required field is missing
 */
export function validateNPCDefinition(npc) {
  for (const field of NPC_VALIDATION.REQUIRED_FIELDS) {
    if (!(field in npc)) {
      throw new Error(
        `Invalid NPC definition: missing required field '${field}'`
      );
    }
  }

  // Validate personality object has required traits
  for (const trait of NPC_VALIDATION.REQUIRED_PERSONALITY_TRAITS) {
    if (!(trait in npc.personality)) {
      throw new Error(
        `Invalid NPC definition: missing personality trait '${trait}'`
      );
    }
  }

  // Validate speechStyle object has required properties
  for (const prop of NPC_VALIDATION.REQUIRED_SPEECH_PROPERTIES) {
    if (!(prop in npc.speechStyle)) {
      throw new Error(
        `Invalid NPC definition: missing speechStyle property '${prop}'`
      );
    }
  }

  // Validate tierBenefits object has required tiers
  for (const tier of NPC_VALIDATION.REQUIRED_TIER_BENEFITS) {
    if (!(tier in npc.tierBenefits)) {
      throw new Error(
        `Invalid NPC definition: missing tierBenefits tier '${tier}'`
      );
    }
  }

  // Validate tips is an array
  if (!Array.isArray(npc.tips)) {
    throw new Error(
      `Invalid NPC definition: tips must be an array`
    );
  }

  // Validate discountService is string or null
  if (npc.discountService !== null && typeof npc.discountService !== 'string') {
    throw new Error(
      `Invalid NPC definition: discountService must be string or null`
    );
  }
}

/**
 * Wei Chen - Dock Worker at Barnard's Star
 *
 * A former ship captain who lost her ship in a bad deal. Now works the docks
 * at Bore Station 7, helping other traders while nursing old wounds. Cautiously
 * optimistic but slow to trust after being burned before.
 */
export const WEI_CHEN = {
  id: 'chen_barnards',
  name: 'Wei Chen',
  role: 'Dock Worker',
  system: 4, // Barnard's Star
  station: 'Bore Station 7',
  personality: {
    trust: NPC_PERSONALITY_VALUES.TRUST_LOW, // Cautious after losing her ship
    greed: NPC_PERSONALITY_VALUES.GREED_LOW, // Not motivated by money
    loyalty: NPC_PERSONALITY_VALUES.LOYALTY_HIGH, // Deeply loyal once trust is earned
    morality: NPC_PERSONALITY_VALUES.MORALITY_MODERATE, // Generally ethical but pragmatic
  },
  speechStyle: {
    greeting: 'casual',
    vocabulary: 'simple',
    quirk: 'drops articles', // "Ship needs fuel" instead of "The ship needs fuel"
  },
  description:
    'A weathered dock worker with calloused hands and knowing eyes. Former ship captain.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL, // Neutral starting relationship
  tips: [], // No tips yet - will be added in task 11.1
  discountService: null, // No discount service yet - will be added in task 11.1
  tierBenefits: {
    warm: { discount: 0, benefit: 'Dock worker tips' },
    friendly: { discount: 0, benefit: 'Operational advice' },
    trusted: { discount: 0, benefit: 'Advance warnings' },
    family: { discount: 0, benefit: 'Priority assistance' }
  }
};

/**
 * Marcus Cole - Loan Shark at Sol
 *
 * The player's creditor - cold, calculating, and purely business-focused.
 * Operates from Sol Central where he can keep tabs on all the major trade
 * routes. Views relationships as transactions and loyalty as a commodity.
 */
export const MARCUS_COLE = {
  id: 'cole_sol',
  name: 'Marcus Cole',
  role: 'Loan Shark',
  system: 0, // Sol
  station: 'Sol Central',
  personality: {
    trust: NPC_PERSONALITY_VALUES.TRUST_VERY_LOW, // Trusts no one
    greed: NPC_PERSONALITY_VALUES.GREED_VERY_HIGH, // Highly motivated by profit
    loyalty: NPC_PERSONALITY_VALUES.LOYALTY_LOW, // Loyalty is transactional
    morality: NPC_PERSONALITY_VALUES.MORALITY_LOW, // Flexible ethics when profit is involved
  },
  speechStyle: {
    greeting: 'formal',
    vocabulary: 'educated',
    quirk: 'short clipped sentences', // "Payment. Due. Now."
  },
  description:
    'Impeccably dressed financier with cold eyes and a calculating smile. Your creditor.',
  initialRep: NPC_INITIAL_REPUTATION.HOSTILE, // Starts cold due to player debt
  tips: [], // No tips yet - will be added in task 11.2
  discountService: null, // No discount service yet - will be added in task 11.2
  tierBenefits: {
    warm: { discount: 0, benefit: 'Financial tips' },
    friendly: { discount: 0, benefit: 'Debt management advice' },
    trusted: { discount: 0, benefit: 'Favorable loan terms' },
    family: { discount: 0, benefit: 'Emergency credit access' }
  }
};

/**
 * Father Okonkwo - Chaplain at Ross 154
 *
 * Station chaplain and medic who serves the spiritual and physical needs of
 * travelers. Genuinely caring and welcoming to all, regardless of background.
 * Sees the good in people and offers guidance without judgment.
 */
export const FATHER_OKONKWO = {
  id: 'okonkwo_ross154',
  name: 'Father Okonkwo',
  role: 'Chaplain',
  system: 11, // Ross 154
  station: 'Ross 154 Medical',
  personality: {
    trust: NPC_PERSONALITY_VALUES.TRUST_HIGH, // Trusts people by default
    greed: NPC_PERSONALITY_VALUES.GREED_NONE, // Not motivated by material gain
    loyalty: NPC_PERSONALITY_VALUES.LOYALTY_VERY_HIGH, // Deeply committed to his calling and community
    morality: NPC_PERSONALITY_VALUES.MORALITY_VERY_HIGH, // Strong moral compass
  },
  speechStyle: {
    greeting: 'warm',
    vocabulary: 'educated',
    quirk: 'religious metaphors', // "May your journey be blessed with fair winds"
  },
  description:
    'Gentle chaplain with kind eyes and a warm smile. Offers comfort to weary travelers.',
  initialRep: NPC_INITIAL_REPUTATION.FRIENDLY, // Starts warm and welcoming
  tips: [], // No trading tips - spiritual guidance role
  discountService: null, // No discount service yet - will be added in task 11.3
  tierBenefits: {
    warm: { discount: 0, benefit: 'Spiritual guidance' },
    friendly: { discount: 0, benefit: 'Medical supplies' },
    trusted: { discount: 0, benefit: 'Sanctuary benefits' },
    family: { discount: 0, benefit: 'Emergency medical care' }
  }
};

/**
 * Whisper - Information Broker at Sirius A
 *
 * Mysterious info broker who knows everyone's secrets. Operates from Sirius Exchange
 * where she trades in market intelligence and rumors. Formal and educated but speaks
 * in cryptic, measured tones. Specializes in intel services with tier-based discounts.
 */
export const WHISPER = {
  id: 'whisper_sirius',
  name: 'Whisper',
  role: 'Information Broker',
  system: 2, // Sirius A
  station: 'Sirius Exchange',
  personality: {
    trust: 0.5, // Moderately trusting
    greed: 0.7, // Motivated by profit
    loyalty: 0.5, // Moderate loyalty
    morality: 0.4, // Flexible ethics in information trade
  },
  speechStyle: {
    greeting: 'formal',
    vocabulary: 'educated',
    quirk: 'cryptic measured tones',
  },
  description:
    "Mysterious info broker. Knows everyone's secrets. Including yours.",
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    "Procyon is buying ore at premium prices this week.",
    "Avoid Tau Ceti. Inspections are up 300%.",
    "Someone at Ross 154 is looking for electronics. Big buyer."
  ],
  discountService: 'intel',
  tierBenefits: {
    warm: { discount: 0.10, benefit: '10% discount on intel purchases' },
    friendly: { discount: 0.10, benefit: 'Free rumors once per visit' },
    trusted: { discount: 0.15, benefit: 'Advance warning of inspections' },
    family: { discount: 0.20, benefit: 'Exclusive insider information' }
  }
};

/**
 * Captain Vasquez - Retired Trader at Epsilon Eridani
 *
 * Retired freighter captain who serves as a mentor figure. Operates from Eridani Hub
 * where she shares wisdom from years of trading experience. Warm and approachable,
 * with simple vocabulary and a tendency to share trading stories. Starts with higher
 * reputation as a respected mentor figure.
 */
export const CAPTAIN_VASQUEZ = {
  id: 'vasquez_epsilon',
  name: 'Captain Vasquez',
  role: 'Retired Trader',
  system: 3, // Epsilon Eridani
  station: 'Eridani Hub',
  personality: {
    trust: 0.6, // Moderately trusting
    greed: 0.3, // Low greed - not motivated by money
    loyalty: 0.7, // High loyalty to community
    morality: 0.7, // High moral standards
  },
  speechStyle: {
    greeting: 'warm',
    vocabulary: 'simple',
    quirk: 'trading stories',
  },
  description:
    "Retired freighter captain. Mentor figure. Knows the old routes.",
  initialRep: 5, // Starts with 5 rep as mentor figure
  tips: [
    "Barnard's Star always needs ore. Mining station, you know.",
    "Sirius A pays top credit for luxury goods. Rich folks.",
    "The Procyon run is profitable if you can afford the fuel."
  ],
  discountService: null, // Mentor, not service provider
  tierBenefits: {
    warm: { discount: 0, benefit: 'Trading tips and route suggestions' },
    friendly: { discount: 0, benefit: 'Old star charts reveal profitable routes' },
    trusted: { discount: 0, benefit: 'Co-investment opportunities (50/50 splits)' },
    family: { discount: 0, benefit: 'Pavonis route hints (endgame content)' }
  }
};

/**
 * Dr. Sarah Kim - Station Administrator at Tau Ceti
 *
 * Efficient station administrator who runs Tau Ceti Station by the book.
 * Respects professionalism and maintains strict operational standards.
 * Uses formal greeting style with technical vocabulary and frequently
 * cites regulations. Specializes in docking services with tier-based benefits.
 */
export const DR_SARAH_KIM = {
  id: 'kim_tau_ceti',
  name: 'Dr. Sarah Kim',
  role: 'Station Administrator',
  system: 5, // Tau Ceti
  station: 'Tau Ceti Station',
  personality: {
    trust: 0.4, // Cautious trust - needs to see professionalism
    greed: 0.5, // Moderate greed - business-focused
    loyalty: 0.6, // Loyal to station and regulations
    morality: 0.8, // High moral standards - by-the-book
  },
  speechStyle: {
    greeting: 'formal',
    vocabulary: 'technical',
    quirk: 'regulation citations',
  },
  description:
    "Efficient station administrator. By-the-book. Respects professionalism.",
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    "We have strict customs here. Keep your cargo manifest accurate.",
    "Medicine prices are stable at Ross 154. Good for planning.",
    "Fuel efficiency matters on long routes. Upgrade your engine."
  ],
  discountService: 'docking',
  tierBenefits: {
    warm: { discount: 0, benefit: 'Operational tips' },
    friendly: { discount: 0, benefit: 'Docking fee waiver' },
    trusted: { discount: 0, benefit: 'Advance customs notice' },
    family: { discount: 0, benefit: 'Priority docking clearance' }
  }
};

/**
 * "Rusty" Rodriguez - Mechanic at Procyon
 *
 * Gruff but skilled mechanic who loves ships more than people. Operates from
 * Procyon Depot where he provides expert repair services. Uses technical
 * vocabulary with a gruff greeting style and tends to personify ships.
 * Specializes in repair services with tier-based discounts.
 */
export const RUSTY_RODRIGUEZ = {
  id: 'rodriguez_procyon',
  name: '"Rusty" Rodriguez',
  role: 'Mechanic',
  system: 6, // Procyon
  station: 'Procyon Depot',
  personality: {
    trust: 0.7, // High trust - trusting nature
    greed: 0.4, // Low-moderate greed - not primarily motivated by money
    loyalty: 0.8, // High loyalty - deeply committed to his craft
    morality: 0.5, // Moderate morality - pragmatic approach
  },
  speechStyle: {
    greeting: 'gruff',
    vocabulary: 'technical',
    quirk: 'ship personification',
  },
  description:
    "Gruff but skilled mechanic. Loves ships more than people.",
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    "Don't let your hull drop below 50%. Expensive to fix after that.",
    "Engine degradation is real. Budget for maintenance.",
    "Life support is critical. Never skip those repairs."
  ],
  discountService: 'repair',
  tierBenefits: {
    warm: { discount: 0.05, benefit: '5% discount on repairs' },
    friendly: { discount: 0.15, benefit: '15% discount on repairs' },
    trusted: { discount: 0.15, benefit: 'Maintenance tips and free diagnostics' },
    family: { discount: 0.20, benefit: 'Priority repair service' }
  }
};

/**
 * Zara Osman - Trader at Luyten's Star
 *
 * Sharp trader with connections across the sector. Competitive but fair in her
 * dealings. Operates from Luyten's Outpost where she provides trading expertise
 * and market connections. Uses casual greeting style with slang vocabulary and
 * trading jargon. Specializes in trade services with tier-based benefits.
 */
export const ZARA_OSMAN = {
  id: 'osman_luyten',
  name: 'Zara Osman',
  role: 'Trader',
  system: 7, // Luyten's Star
  station: 'Luyten\'s Outpost',
  personality: {
    trust: 0.5, // Moderate trust - cautious but fair
    greed: 0.6, // Moderate-high greed - profit-motivated
    loyalty: 0.6, // Moderate loyalty - business relationships
    morality: 0.5, // Moderate morality - competitive but fair
  },
  speechStyle: {
    greeting: 'casual',
    vocabulary: 'slang',
    quirk: 'trading jargon',
  },
  description:
    "Sharp trader with connections across the sector. Competitive but fair.",
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    "Buy low at mining stations, sell high at rich systems.",
    "Luxury goods have the best margins if you can afford the capital.",
    "Watch for economic events. They shift prices dramatically."
  ],
  discountService: 'trade',
  tierBenefits: {
    warm: { discount: 0, benefit: 'Market price tips' },
    friendly: { discount: 0, benefit: 'Advance price shift notice' },
    trusted: { discount: 0, benefit: 'Premium trading tips (105% buy rate)' },
    family: { discount: 0, benefit: 'Exclusive trading partnerships' }
  }
};

/**
 * Station Master Kowalski - Station Master at Alpha Centauri
 *
 * Veteran station master who has seen everything. Respects competence and
 * maintains high operational standards. Operates from Centauri Station where
 * he oversees all station operations. Uses gruff greeting style with simple
 * vocabulary and no-nonsense direct communication. Specializes in docking services.
 */
export const STATION_MASTER_KOWALSKI = {
  id: 'kowalski_alpha_centauri',
  name: 'Station Master Kowalski',
  role: 'Station Master',
  system: 1, // Alpha Centauri
  station: 'Centauri Station',
  personality: {
    trust: 0.3, // Low trust - needs to see competence first
    greed: 0.4, // Low-moderate greed - not primarily motivated by money
    loyalty: 0.7, // High loyalty - committed to station and standards
    morality: 0.7, // High morality - respects competence and fairness
  },
  speechStyle: {
    greeting: 'gruff',
    vocabulary: 'simple',
    quirk: 'no-nonsense direct',
  },
  description:
    "Veteran station master. Seen everything. Respects competence.",
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    "Alpha Centauri is a hub. Good for buying and selling most goods.",
    "We get a lot of traffic. Prices are competitive.",
    "Keep your ship in good shape. We have standards here."
  ],
  discountService: 'docking',
  tierBenefits: {
    warm: { discount: 0, benefit: 'Station operation tips' },
    friendly: { discount: 0, benefit: 'Station storage access' },
    trusted: { discount: 0, benefit: 'Emergency fuel at cost' },
    family: { discount: 0, benefit: 'Priority docking and services' }
  }
};

/**
 * "Lucky" Liu - Gambler at Wolf 359
 *
 * Professional gambler and risk-taker who loves long odds and respects bold moves.
 * Operates from Wolf 359 Station where he provides high-risk high-reward opportunities
 * and gambling connections. Uses casual greeting style with slang vocabulary and
 * gambling metaphors. No discount service but provides risk-taking tips and opportunities.
 */
export const LUCKY_LIU = {
  id: 'liu_wolf359',
  name: '"Lucky" Liu',
  role: 'Gambler',
  system: 8, // Wolf 359
  station: 'Wolf 359 Station',
  personality: {
    trust: 0.6, // Moderately trusting - willing to take chances on people
    greed: 0.8, // High greed - motivated by big payoffs
    loyalty: 0.4, // Low loyalty - follows the money and odds
    morality: 0.3, // Low morality - flexible ethics in pursuit of profit
  },
  speechStyle: {
    greeting: 'casual',
    vocabulary: 'slang',
    quirk: 'gambling metaphors',
  },
  description:
    "Professional gambler and risk-taker. Loves long odds. Respects bold moves.",
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    "Sometimes you gotta take risks. Big risks, big rewards.",
    "I heard about a high-stakes cargo run. Interested?",
    "Don't play it safe all the time. Fortune favors the bold."
  ],
  discountService: null, // Gambler, not service provider
  tierBenefits: {
    warm: { discount: 0, benefit: 'Risk-taking tips' },
    friendly: { discount: 0, benefit: '₡500 stake mechanic' },
    trusted: { discount: 0, benefit: 'Insider information' },
    family: { discount: 0, benefit: 'High-risk exclusive opportunities' }
  }
};

/**
 * All NPCs in the game
 * Add new NPCs to this array to make them available to the game systems
 */
export const ALL_NPCS = [WEI_CHEN, MARCUS_COLE, FATHER_OKONKWO, WHISPER, CAPTAIN_VASQUEZ, DR_SARAH_KIM, RUSTY_RODRIGUEZ, ZARA_OSMAN, STATION_MASTER_KOWALSKI, LUCKY_LIU];

/**
 * Validates all NPC definitions in the game
 * Call this during game initialization to ensure data integrity
 * @throws {Error} If any NPC definition is invalid
 */
export function validateAllNPCs() {
  ALL_NPCS.forEach((npc) => validateNPCDefinition(npc));
}
