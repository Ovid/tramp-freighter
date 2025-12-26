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
};

/**
 * All NPCs in the game
 * Add new NPCs to this array to make them available to the game systems
 */
export const ALL_NPCS = [WEI_CHEN, MARCUS_COLE, FATHER_OKONKWO];

/**
 * Validates all NPC definitions in the game
 * Call this during game initialization to ensure data integrity
 * @throws {Error} If any NPC definition is invalid
 */
export function validateAllNPCs() {
  ALL_NPCS.forEach((npc) => validateNPCDefinition(npc));
}
