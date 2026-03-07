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
  REPUTATION_BOUNDS,
  ENDGAME_CONFIG,
} from '../constants.js';

/**
 * Validates NPC definition structure to prevent runtime errors during game initialization.
 *
 * This validation ensures that all NPCs have the required fields for the benefits system,
 * preventing crashes when the game tries to access missing properties during relationship
 * calculations, dialogue generation, or benefit application.
 *
 * @param {Object} npc - NPC definition object containing personality, benefits, and metadata
 * @throws {Error} When required fields are missing - fails fast to expose data issues during development
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
    throw new Error(`Invalid NPC definition: tips must be an array`);
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
 * Represents the "cautious survivor" archetype - someone who has been burned by trust
 * but still maintains hope. Her low trust/high loyalty combination creates interesting
 * relationship dynamics where earning her trust is difficult but extremely rewarding.
 *
 * Personality Design Rationale:
 * - Low trust (0.3): Creates initial relationship challenge for players
 * - Low greed (0.2): Makes her motivated by respect rather than profit
 * - High loyalty (0.8): Rewards players who invest time in the relationship
 * - Moderate morality (0.6): Allows pragmatic decisions while maintaining ethics
 *
 * Game Role: Provides early-game relationship tutorial and demonstrates that
 * NPCs have depth beyond their current circumstances.
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
  tips: [
    'Heavy cargo shifts during transit. Secure it properly.',
    'Dock fees vary by station. Sol and Alpha Centauri charge premium.',
    'Some captains overload their holds. Bad idea in rough space.',
  ],
  discountService: 'docking',
  tierBenefits: {
    warm: { discount: 0, benefit: 'Dock worker tips' },
    friendly: { discount: 0.05, benefit: '5% discount on docking services' },
    trusted: {
      discount: 0.05,
      benefit: 'Advance warning about dock inspections',
    },
    family: { discount: 0.1, benefit: 'Priority docking and cargo handling' },
  },
};

/**
 * Marcus Cole - Loan Shark at Sol
 *
 * Serves as the game's primary antagonistic relationship and debt pressure system.
 * His extreme personality values create a clear "villain" that players love to hate,
 * while his position at Sol makes him unavoidable, maintaining constant tension.
 *
 * Personality Design Rationale:
 * - Very low trust (0.1): Makes every interaction feel transactional and cold
 * - Very high greed (0.9): Ensures he always prioritizes profit over relationships
 * - Low loyalty (0.3): Creates unpredictable behavior that keeps players on edge
 * - Low morality (0.2): Allows morally questionable business practices
 *
 * Game Role: Provides financial pressure and serves as a relationship contrast
 * to more positive NPCs. His hostile starting reputation creates immediate stakes.
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
  tips: [
    'Debt compounds. Pay early when you can.',
    'Credit is a tool. Use it wisely, not desperately.',
    'Some traders leverage debt for bigger hauls. Risky but effective.',
  ],
  discountService: 'debt',
  tierBenefits: {
    warm: { discount: 0, benefit: 'Financial tips' },
    friendly: { discount: 0.1, benefit: '10% reduction in debt interest' },
    trusted: { discount: 0.1, benefit: 'Debt restructuring options' },
    family: { discount: 0.15, benefit: 'Favorable loan terms' },
  },
};

/**
 * Father Okonkwo - Chaplain at Ross 154
 *
 * Represents unconditional positive regard and serves as the game's "moral anchor."
 * His extreme positive values provide a safe relationship for players to experience
 * the benefits system without risk, while his medical role makes him practically useful.
 *
 * Personality Design Rationale:
 * - High trust (0.7): Immediately welcoming to all players regardless of reputation
 * - No greed (0.0): Completely removes transactional elements from interactions
 * - Very high loyalty (0.9): Ensures he remains supportive even if player makes mistakes
 * - Very high morality (0.9): Provides moral guidance and represents ethical gameplay
 *
 * Game Role: Offers emotional respite from harsh trading world and demonstrates
 * that not all relationships require careful management. His friendly starting
 * reputation provides immediate positive feedback for new players.
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
  tips: [
    'The frontier stations pay more for medicine than you might think. Compassion and commerce are not always at odds.',
    'Many traders overlook grain as unprofitable. But hungry miners at the outer systems will pay what they must.',
    'If you must carry restricted goods, know that the authorities are less watchful beyond the core systems.',
  ],
  discountService: 'medical',
  tierBenefits: {
    warm: { discount: 0, benefit: 'Spiritual guidance' },
    friendly: { discount: 0, benefit: 'Free medical supplies once per visit' },
    trusted: { discount: 0, benefit: 'Sanctuary (safe harbor) benefits' },
    family: { discount: 0, benefit: 'Emergency medical care' },
  },
};

/**
 * Whisper - Information Broker at Sirius A
 *
 * Embodies the "morally ambiguous useful contact" archetype. Her balanced trust/loyalty
 * with high greed and low morality creates a relationship where players must weigh
 * the value of her services against the ethical implications of supporting her business.
 *
 * Personality Design Rationale:
 * - Moderate trust (0.5): Neither immediately welcoming nor hostile - requires earning
 * - High greed (0.7): Makes her services expensive but ensures she's always available for profit
 * - Moderate loyalty (0.5): Creates uncertainty about her reliability in difficult situations
 * - Low morality (0.4): Allows her to trade in questionable information and gray-market intel
 *
 * Game Role: Provides essential intelligence services while forcing players to engage
 * with morally complex characters. Her intel discount service makes the relationship
 * economically valuable despite ethical concerns.
 */
export const WHISPER = {
  id: 'whisper_sirius',
  name: 'Whisper',
  role: 'Information Broker',
  system: 7, // Sirius A
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
    'Procyon is buying ore at premium prices this week.',
    'Avoid Tau Ceti. Inspections are up 300%.',
    'Someone at Ross 154 is looking for electronics. Big buyer.',
  ],
  discountService: 'intel',
  tierBenefits: {
    warm: { discount: 0.1, benefit: '10% discount on intel purchases' },
    friendly: { discount: 0.1, benefit: 'Free rumors once per visit' },
    trusted: { discount: 0.15, benefit: 'Advance warning of inspections' },
    family: { discount: 0.2, benefit: 'Exclusive insider information' },
  },
};

/**
 * Captain Vasquez - Retired Trader at Epsilon Eridani
 *
 * Functions as the game's mentor figure and positive relationship tutorial. Her
 * higher starting reputation and balanced positive traits make her an ideal
 * "first friend" who demonstrates the benefits of NPC relationships without
 * requiring significant investment from new players.
 *
 * Personality Design Rationale:
 * - Moderate-high trust (0.6): Welcoming but not naive - respects competent traders
 * - Low greed (0.3): More interested in sharing knowledge than making profit
 * - High loyalty (0.7): Becomes a reliable ally once relationship is established
 * - High morality (0.7): Provides ethical guidance and represents honorable trading
 *
 * Game Role: Serves as relationship onboarding and provides valuable trading tips
 * without service discounts. Her mentor status and starting reputation of 5 makes
 * her immediately accessible to new players learning the relationship system.
 */
export const CAPTAIN_VASQUEZ = {
  id: 'vasquez_epsilon',
  name: 'Captain Vasquez',
  role: 'Retired Trader',
  system: 13, // Epsilon Eridani
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
    'Retired freighter captain. Mentor figure. Knows the old routes.',
  initialRep: 5, // Starts with 5 rep as mentor figure
  tips: [
    "Barnard's Star always needs ore. Mining station, you know.",
    'Sirius A pays top credit for luxury goods. Rich folks.',
    'The Procyon run is profitable if you can afford the fuel.',
  ],
  discountService: null, // Mentor, not service provider
  tierBenefits: {
    warm: { discount: 0, benefit: 'Trading tips and route suggestions' },
    friendly: {
      discount: 0,
      benefit: 'Old star charts reveal profitable routes',
    },
    trusted: {
      discount: 0,
      benefit: 'Co-investment opportunities (50/50 splits)',
    },
    family: { discount: 0, benefit: 'Pavonis route hints (endgame content)' },
  },
};

/**
 * Dr. Sarah Kim - Station Administrator at Tau Ceti
 *
 * Represents the "professional bureaucrat" archetype - someone who values competence
 * and proper procedures. Her personality creates a relationship that rewards players
 * who demonstrate professionalism and follow proper trading protocols.
 *
 * Personality Design Rationale:
 * - Low-moderate trust (0.4): Requires players to prove their competence before warming up
 * - Moderate greed (0.5): Business-focused but not purely profit-driven
 * - Moderate-high loyalty (0.6): Becomes reliable ally for players who respect procedures
 * - High morality (0.8): Enforces ethical standards and rewards honest dealing
 *
 * Game Role: Teaches players that different NPCs value different behaviors.
 * Her docking service discounts reward players who invest in "boring but useful"
 * relationships, demonstrating that not all valuable NPCs are colorful characters.
 */
export const DR_SARAH_KIM = {
  id: 'kim_tau_ceti',
  name: 'Dr. Sarah Kim',
  role: 'Station Administrator',
  system: 31, // Tau Ceti
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
    'Efficient station administrator. By-the-book. Respects professionalism.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    'We have strict customs here. Keep your cargo manifest accurate.',
    'Medicine prices are stable at Ross 154. Good for planning.',
    'Fuel efficiency matters on long routes. Upgrade your engine.',
  ],
  discountService: 'docking',
  tierBenefits: {
    warm: { discount: 0, benefit: 'Operational tips' },
    friendly: { discount: 0, benefit: 'Docking fee waiver' },
    trusted: { discount: 0, benefit: 'Advance customs notice' },
    family: { discount: 0, benefit: 'Priority docking clearance' },
  },
};

/**
 * "Rusty" Rodriguez - Mechanic at Procyon
 *
 * Embodies the "gruff but golden-hearted craftsman" archetype. His high trust and
 * loyalty combined with moderate greed creates a relationship where players are
 * rewarded for treating him with respect rather than trying to exploit him financially.
 *
 * Personality Design Rationale:
 * - High trust (0.7): Willing to give players the benefit of the doubt initially
 * - Low-moderate greed (0.4): More interested in good work than maximum profit
 * - Very high loyalty (0.8): Becomes fiercely protective of players who treat him well
 * - Moderate morality (0.5): Pragmatic about ship repairs - will bend rules for good customers
 *
 * Game Role: Provides essential repair services while demonstrating that respectful
 * treatment of working-class NPCs yields better results than purely transactional
 * relationships. His repair discounts make the relationship economically significant.
 */
export const RUSTY_RODRIGUEZ = {
  id: 'rodriguez_procyon',
  name: '"Rusty" Rodriguez',
  role: 'Mechanic',
  system: 19, // Procyon
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
  description: 'Gruff but skilled mechanic. Loves ships more than people.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    "Don't let your hull drop below 50%. Expensive to fix after that.",
    'Engine degradation is real. Budget for maintenance.',
    'Life support is critical. Never skip those repairs.',
  ],
  discountService: 'repair',
  tierBenefits: {
    warm: { discount: 0.05, benefit: '5% discount on repairs' },
    friendly: { discount: 0.15, benefit: '15% discount on repairs' },
    trusted: {
      discount: 0.15,
      benefit: 'Maintenance tips and free diagnostics',
    },
    family: { discount: 0.2, benefit: 'Priority repair service' },
  },
};

/**
 * Zara Osman - Trader at Luyten's Star
 *
 * Represents the "competitive peer" archetype - another trader who can be either
 * rival or ally depending on player approach. Her balanced moderate values create
 * a relationship that requires consistent positive interaction to maintain.
 *
 * Personality Design Rationale:
 * - Moderate trust (0.5): Neither immediately friendly nor hostile - neutral starting point
 * - Moderate-high greed (0.6): Profit-motivated but willing to share opportunities with allies
 * - Moderate loyalty (0.6): Reliable business partner but not unconditionally supportive
 * - Moderate morality (0.5): Competitive but fair - won't cheat but will take advantage
 *
 * Game Role: Provides trading expertise and market connections while teaching players
 * about peer relationships in the trading community. Her trade service benefits
 * make her valuable for players focused on commercial success.
 */
export const ZARA_OSMAN = {
  id: 'osman_luyten',
  name: 'Zara Osman',
  role: 'Trader',
  system: 34, // Luyten's Star
  station: "Luyten's Outpost",
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
    'Sharp trader with connections across the sector. Competitive but fair.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    'Buy low at mining stations, sell high at rich systems.',
    'Luxury goods have the best margins if you can afford the capital.',
    'Watch for economic events. They shift prices dramatically.',
  ],
  discountService: 'trade',
  tierBenefits: {
    warm: { discount: 0, benefit: 'Market price tips' },
    friendly: { discount: 0, benefit: 'Advance price shift notice' },
    trusted: { discount: 0, benefit: 'Premium trading tips (105% buy rate)' },
    family: { discount: 0, benefit: 'Exclusive trading partnerships' },
  },
};

/**
 * Station Master Kowalski - Station Master at Alpha Centauri
 *
 * Represents the "earned respect" archetype - someone who starts skeptical but
 * becomes a powerful ally for players who prove their competence. His position
 * at the major hub system makes his approval particularly valuable.
 *
 * Personality Design Rationale:
 * - Low trust (0.3): Skeptical of new traders until they prove themselves reliable
 * - Low-moderate greed (0.4): More concerned with operational efficiency than profit
 * - High loyalty (0.7): Becomes strong supporter for traders who meet his standards
 * - High morality (0.7): Maintains high standards and respects ethical behavior
 *
 * Game Role: Guards access to Alpha Centauri's hub benefits and teaches players
 * that some relationships require proving competence over time. His docking
 * services become valuable for players who establish themselves as reliable traders.
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
  description: 'Veteran station master. Seen everything. Respects competence.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    'Alpha Centauri is a hub. Good for buying and selling most goods.',
    'We get a lot of traffic. Prices are competitive.',
    'Keep your ship in good shape. We have standards here.',
  ],
  discountService: 'docking',
  tierBenefits: {
    warm: { discount: 0, benefit: 'Station operation tips' },
    friendly: { discount: 0, benefit: 'Station storage access' },
    trusted: { discount: 0, benefit: 'Emergency fuel at cost' },
    family: { discount: 0, benefit: 'Priority docking and services' },
  },
};

/**
 * "Lucky" Liu - Gambler at Wolf 359
 *
 * Embodies the "high-risk high-reward" archetype - someone who respects bold players
 * but can't be relied upon for consistent support. His extreme greed and low morality
 * create opportunities for players willing to engage in questionable activities.
 *
 * Personality Design Rationale:
 * - Moderate-high trust (0.6): Willing to take chances on people, like he does with bets
 * - Very high greed (0.8): Motivated by potential for big payoffs rather than steady income
 * - Low loyalty (0.4): Follows opportunities rather than relationships - unreliable ally
 * - Low morality (0.3): Willing to engage in ethically questionable schemes for profit
 *
 * Game Role: Provides high-risk opportunities and tests player willingness to engage
 * with morally ambiguous characters. His lack of service discounts but unique
 * benefits create a different type of valuable relationship focused on opportunities
 * rather than cost savings.
 */
export const LUCKY_LIU = {
  id: 'liu_wolf359',
  name: '"Lucky" Liu',
  role: 'Gambler',
  system: 5, // Wolf 359
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
    'Professional gambler and risk-taker. Loves long odds. Respects bold moves.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    'Sometimes you gotta take risks. Big risks, big rewards.',
    'I heard about a high-stakes cargo run. Interested?',
    "Don't play it safe all the time. Fortune favors the bold.",
  ],
  discountService: null, // Gambler, not service provider
  tierBenefits: {
    warm: { discount: 0, benefit: 'Risk-taking tips' },
    friendly: { discount: 0, benefit: '₡500 stake mechanic' },
    trusted: { discount: 0, benefit: 'Insider information' },
    family: { discount: 0, benefit: 'High-risk exclusive opportunities' },
  },
};

/**
 * Yuki Tanaka - Engineer at Barnard's Star
 *
 * The endgame quest NPC. Hidden until the player has visited 5+ systems and
 * docks at Barnard's Star, triggering the tanaka_intro narrative event.
 * Her quest line leads to the Pavonis Run and game victory.
 *
 * Personality Design Rationale:
 * - Low trust (0.2): Brilliant but guarded, requires proving yourself
 * - No greed (0.1): Driven by her research, not profit
 * - Very high loyalty (0.9): Once earned, her loyalty is absolute
 * - High morality (0.8): Ethical researcher pursuing knowledge
 */
export const YUKI_TANAKA = {
  id: 'tanaka_barnards',
  name: 'Yuki Tanaka',
  role: 'Engineer',
  system: 4, // Barnard's Star
  station: 'Bore Station 7',
  personality: {
    trust: 0.2,
    greed: 0.1,
    loyalty: 0.9,
    morality: 0.8,
  },
  speechStyle: {
    greeting: 'formal',
    vocabulary: 'technical',
    quirk: 'Precise, measured speech. Never wastes words.',
  },
  description:
    'Brilliant engineer working on experimental drive technology. Has her own reasons for wanting to reach Delta Pavonis.',
  initialRep: NPC_INITIAL_REPUTATION.NEUTRAL,
  tips: [
    'Your drive runs more efficiently when hull integrity is high. A damaged ship wastes fuel compensating for structural drag.',
    'The wormhole network has patterns. Some routes see less traffic, which means fewer pirates but also fewer rescue options.',
    'Parts are cheap at the core systems where they are manufactured. The further out you go, the more they cost.',
  ],
  discountService: null,
  tierBenefits: {
    warm: {
      discount: 0,
      benefit: 'Shares technical insights about the Tanaka Drive.',
    },
    friendly: { discount: 0, benefit: 'Discusses her research freely.' },
    trusted: { discount: 0, benefit: 'Reveals her true mission.' },
    family: { discount: 0, benefit: 'Partner for the Pavonis Run.' },
  },
  questId: 'tanaka',
  hidden: true,
  revealFlag: 'tanaka_met',
};

/**
 * Yumi Tanaka - Colony Director at Delta Pavonis (Post-Credits)
 *
 * Tanaka's sister. Hidden until post-credits scene reveals her.
 * Fourth-wall-breaking comedy dialogue about the game being over.
 */
export const YUMI_TANAKA_POSTCREDITS = {
  id: 'yumi_delta_pavonis',
  name: 'Yumi Tanaka',
  role: 'Colony Director',
  system: ENDGAME_CONFIG.DELTA_PAVONIS_ID,
  station: 'Delta Pavonis Colony',
  personality: {
    trust: NPC_PERSONALITY_VALUES.TRUST_HIGH,
    greed: NPC_PERSONALITY_VALUES.GREED_NONE,
    loyalty: NPC_PERSONALITY_VALUES.LOYALTY_HIGH,
    morality: NPC_PERSONALITY_VALUES.MORALITY_MODERATE,
  },
  speechStyle: {
    greeting: 'casual',
    vocabulary: 'simple',
    quirk: 'Fourth-wall-breaking irreverence.',
  },
  description:
    "Colony Director at Delta Pavonis. Tanaka's sister. Seems to know more than she should.",
  initialRep: REPUTATION_BOUNDS.WARM_MIN,
  tips: [
    'The credits already rolled. There is literally nothing left to do here.',
  ],
  discountService: null,
  tierBenefits: {
    warm: { discount: 0, benefit: 'Post-credits banter.' },
    friendly: { discount: 0, benefit: 'More post-credits banter.' },
    trusted: { discount: 0, benefit: 'Even more post-credits banter.' },
    family: { discount: 0, benefit: 'Maximum post-credits banter.' },
  },
  hidden: true,
  revealFlag: 'post_credits',
};

/**
 * All NPCs in the game
 * Add new NPCs to this array to make them available to the game systems
 */
export const ALL_NPCS = [
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
  YUMI_TANAKA_POSTCREDITS,
];

/**
 * Validates all NPC definitions to ensure data integrity during game initialization.
 *
 * This function should be called during game startup to catch data errors early
 * rather than discovering them during gameplay when an NPC interaction fails.
 * Failing fast during initialization prevents runtime crashes and makes debugging easier.
 *
 * @throws {Error} When any NPC definition fails validation - includes NPC name in error message
 */
export function validateAllNPCs() {
  ALL_NPCS.forEach((npc) => validateNPCDefinition(npc));
}
