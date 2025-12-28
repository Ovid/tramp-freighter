/**
 * @fileoverview Dialogue Tree Data Structures - Aggregator Module
 *
 * This module re-exports all dialogue trees and validation functions
 * from their individual modules. Existing imports continue to work
 * without modification.
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

// Import and re-export individual dialogue trees
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
export {
  WEI_CHEN_DIALOGUE,
  MARCUS_COLE_DIALOGUE,
  FATHER_OKONKWO_DIALOGUE,
  WHISPER_DIALOGUE,
  CAPTAIN_VASQUEZ_DIALOGUE,
  DR_SARAH_KIM_DIALOGUE,
  RUSTY_RODRIGUEZ_DIALOGUE,
  ZARA_OSMAN_DIALOGUE,
  STATION_MASTER_KOWALSKI_DIALOGUE,
  LUCKY_LIU_DIALOGUE,
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
