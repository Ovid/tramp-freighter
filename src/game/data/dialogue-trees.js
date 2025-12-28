/**
 * @fileoverview Dialogue Tree Data Structures
 *
 * ## Why Function-Based Text Generation
 *
 * Text functions enable reputation-responsive dialogue without duplicating content.
 * NPCs can acknowledge relationship progression naturally, making interactions feel
 * personal and meaningful rather than static.
 *
 * ## Why Conditional Choice Visibility
 *
 * Reputation-gated choices create progression incentives - players must build
 * relationships to unlock deeper conversations and story content. This supports
 * the "You Know These People" design pillar.
 *
 * ## Why Immediate Reputation Application
 *
 * Reputation changes apply before navigation to ensure conditional content
 * becomes available immediately. This prevents confusing delays where players
 * must exit and re-enter dialogue to see new options.
 *
 * @module DialogueTrees
 */

import { REPUTATION_BOUNDS, NPC_BENEFITS_CONFIG } from '../constants.js';

// Re-export validation functions from dedicated validation module
export {
  validateRequiredConstants,
  validateDialogueTree,
  validateDialogueNode,
  validateDialogueChoice,
} from './dialogue/validation.js';

// Import validation functions for use in validateAllDialogueTrees
import {
  validateRequiredConstants,
  validateDialogueTree,
} from './dialogue/validation.js';

// Import individual dialogue trees for use in ALL_DIALOGUE_TREES
import { WEI_CHEN_DIALOGUE } from './dialogue/wei-chen.js';
import { MARCUS_COLE_DIALOGUE } from './dialogue/marcus-cole.js';
import { FATHER_OKONKWO_DIALOGUE } from './dialogue/father-okonkwo.js';
import { WHISPER_DIALOGUE } from './dialogue/whisper.js';
import { CAPTAIN_VASQUEZ_DIALOGUE } from './dialogue/captain-vasquez.js';
import { DR_SARAH_KIM_DIALOGUE } from './dialogue/dr-sarah-kim.js';
import { RUSTY_RODRIGUEZ_DIALOGUE } from './dialogue/rusty-rodriguez.js';
import { ZARA_OSMAN_DIALOGUE } from './dialogue/zara-osman.js';
import { STATION_MASTER_KOWALSKI_DIALOGUE } from './dialogue/station-master-kowalski.js';
import { LUCKY_LIU_DIALOGUE } from './dialogue/lucky-liu.js';

// Re-export individual dialogue trees
export { WEI_CHEN_DIALOGUE } from './dialogue/wei-chen.js';
export { MARCUS_COLE_DIALOGUE } from './dialogue/marcus-cole.js';
export { FATHER_OKONKWO_DIALOGUE } from './dialogue/father-okonkwo.js';
export { WHISPER_DIALOGUE } from './dialogue/whisper.js';
export { CAPTAIN_VASQUEZ_DIALOGUE } from './dialogue/captain-vasquez.js';
export { DR_SARAH_KIM_DIALOGUE } from './dialogue/dr-sarah-kim.js';
export { RUSTY_RODRIGUEZ_DIALOGUE } from './dialogue/rusty-rodriguez.js';
export { ZARA_OSMAN_DIALOGUE } from './dialogue/zara-osman.js';
export { STATION_MASTER_KOWALSKI_DIALOGUE } from './dialogue/station-master-kowalski.js';
export { LUCKY_LIU_DIALOGUE } from './dialogue/lucky-liu.js';

/**
 * "Rusty" Rodriguez Dialogue Tree - Mechanic at Procyon
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Good systems benefit everyone.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  efficiency_matters: {
    text: 'Precisely. Efficient operations benefit all parties - reduced processing time, lower operational costs, improved safety margins. When traders follow established protocols, we can process requests 40% faster according to our latest efficiency metrics.',
    choices: [
      {
        text: 'Those are impressive numbers.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: "I'll keep that in mind.",
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  regulation_defense: {
    text: 'I understand that perspective, but consider this: Regulation 15-D exists because uncontrolled cargo transfers resulted in three major incidents in 2387. These procedures exist to protect everyone - traders, station personnel, and cargo integrity.',
    choices: [
      {
        text: "I hadn't considered the safety aspect.",
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Fair point about the incidents.',
        next: 'greeting',
        repGain: 1,
      },
      {
        text: 'Still seems excessive to me.',
        next: 'greeting',
        repGain: -1,
      },
    ],
  },

  ask_tip: {
    text: "Certainly. Operational efficiency is improved through proper planning and adherence to established protocols. Here's something that should help optimize your trading operations...",
    flags: ['kim_tip_requested'],
    choices: [
      {
        text: 'That information is very useful.',
        next: 'greeting',
        repGain: 2,
      },
      {
        text: 'Thank you for the operational guidance.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  request_loan: {
    text: 'An emergency loan request... Per Financial Regulation 12-A, I can authorize a five hundred credit emergency advance for trusted traders with established operational records. Standard thirty-day repayment terms apply.',
    flags: ['kim_loan_discussed'],
    choices: [
      {
        text: 'I accept those terms.',
        next: 'greeting',
        repGain: 3,
        action: (gameStateManager, npcId) => {
          return gameStateManager.requestLoan(npcId);
        },
      },
      {
        text: 'Let me review the terms first.',
        next: 'greeting',
      },
    ],
  },

  request_storage: {
    text: 'Cargo storage services are available under Station Protocol 8-C for established traders. We can accommodate up to ten units in our secure storage facility. All items are logged and tracked per standard inventory procedures.',
    flags: ['kim_storage_discussed'],
    choices: [
      {
        text: 'That would be very helpful.',
        next: 'greeting',
        repGain: 2,
        action: (gameStateManager, npcId) => {
          return gameStateManager.storeCargo(npcId);
        },
      },
      {
        text: 'Good to know that service exists.',
        next: 'greeting',
        repGain: 1,
      },
    ],
  },

  repay_loan: {
    text: 'Loan repayment processing... Per Financial Regulation 12-A, I can confirm receipt of your five hundred credit repayment. Transaction logged and your account is now current. Thank you for your prompt attention to financial obligations.',
    flags: ['kim_loan_repaid'],
    choices: [
      {
        text: 'Here are the credits.',
        next: 'greeting',
        repGain: 2,
        action: (gameStateManager, npcId) => {
          return gameStateManager.repayLoan(npcId);
        },
      },
      {
        text: 'I need more time to gather the credits.',
        next: 'greeting',
      },
    ],
  },

  retrieve_cargo: {
    text: 'Cargo retrieval request acknowledged. Per Station Protocol 8-C, I can transfer your stored items back to your vessel. Please note that transfer capacity is limited by your current cargo hold availability.',
    flags: ['kim_cargo_retrieved'],
    choices: [
      {
        text: 'Transfer what you can to my ship.',
        next: 'greeting',
        repGain: 1,
        action: (gameStateManager, npcId) => {
          return gameStateManager.retrieveCargo(npcId);
        },
      },
      {
        text: 'Let me make some space first.',
        next: 'greeting',
      },
    ],
  },
};

/**
 * All dialogue trees in the game
 * Maps NPC IDs to their dialogue trees
 */
export const ALL_DIALOGUE_TREES = {
  chen_barnards: WEI_CHEN_DIALOGUE,
  cole_sol: MARCUS_COLE_DIALOGUE,
  okonkwo_ross154: FATHER_OKONKWO_DIALOGUE,
  whisper_sirius: WHISPER_DIALOGUE,
  vasquez_epsilon: CAPTAIN_VASQUEZ_DIALOGUE,
  kim_tau_ceti: DR_SARAH_KIM_DIALOGUE,
  rodriguez_procyon: RUSTY_RODRIGUEZ_DIALOGUE,
  osman_luyten: ZARA_OSMAN_DIALOGUE,
  kowalski_alpha_centauri: STATION_MASTER_KOWALSKI_DIALOGUE,
  liu_wolf359: LUCKY_LIU_DIALOGUE,
};

/**
 * Validates all dialogue trees and required constants in the game
 * Call this during game initialization to ensure data integrity
 * @throws {Error} If any dialogue tree or constants are invalid
 */
export function validateAllDialogueTrees() {
  // Validate constants first
  validateRequiredConstants();

  // Then validate all dialogue trees
  Object.entries(ALL_DIALOGUE_TREES).forEach(([npcId, tree]) => {
    try {
      validateDialogueTree(tree);
    } catch (error) {
      throw new Error(
        `Invalid dialogue tree for NPC '${npcId}': ${error.message}`
      );
    }
  });
}
