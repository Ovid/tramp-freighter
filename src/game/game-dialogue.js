/**
 * @fileoverview Dialogue Engine
 *
 * Manages NPC dialogue interactions including dialogue display, choice filtering,
 * and conversation flow. Integrates with the reputation system to provide
 * dynamic dialogue content and conditional choices based on relationship levels.
 *
 * ## Core Functions
 *
 * - `showDialogue(npcId, nodeId)`: Display dialogue node with filtered choices
 * - `selectChoice(npcId, choice)`: Process player choice and advance dialogue
 *
 * ## Integration Points
 *
 * - **NPC Data**: Uses ALL_NPCS for NPC definitions and validation
 * - **Dialogue Trees**: Uses ALL_DIALOGUE_TREES for conversation content
 * - **Reputation System**: Integrates with GameStateManager for reputation queries and modifications
 * - **Story Flags**: Manages persistent story flags in NPC state
 *
 * ## Error Handling
 *
 * - Validates NPC IDs against NPC data definitions
 * - Validates dialogue node IDs against dialogue trees
 * - Gracefully handles condition function errors by hiding affected choices
 * - Logs errors for debugging while maintaining dialogue flow
 *
 * @module DialogueEngine
 */

import { ALL_NPCS } from './data/npc-data.js';
import { ALL_DIALOGUE_TREES } from './data/dialogue-trees.js';

// Dialogue state is now managed by GameStateManager

// Special dialogue node identifiers
const TIP_NODE_ID = 'ask_tip';

/**
 * Build a flat context object for dialogue text/condition/action functions.
 * Replaces direct gameStateManager access in dialogue data files.
 *
 * @param {Object} gameStateManager - The game state manager instance
 * @param {string} npcId - NPC identifier for NPC-specific data
 * @returns {Object} Context object with data properties and action callbacks
 */
export function buildDialogueContext(gameStateManager, npcId) {
  const state = gameStateManager.getState();
  return {
    // Read-only data
    karma: gameStateManager.getKarma(),
    heat: gameStateManager.getHeatTier(),
    npcState: gameStateManager.getNPCState(npcId),
    daysElapsed: state.player.daysElapsed,
    credits: state.player.credits,
    cargo: state.ship.cargo,
    canGetTip: gameStateManager.canGetTip(npcId),
    canRequestLoan: gameStateManager.canRequestFavor(npcId, 'loan'),
    canRequestStorage: gameStateManager.canRequestFavor(npcId, 'storage'),
    factionReps: {
      authorities: gameStateManager.getFactionRep('authorities'),
      outlaws: gameStateManager.getFactionRep('outlaws'),
      civilians: gameStateManager.getFactionRep('civilians'),
    },

    // Quest accessors (kept as functions since they take parameters)
    getQuestStage: (questId) => gameStateManager.getQuestStage(questId),
    getQuestState: (questId) => gameStateManager.getQuestState(questId),
    canStartQuestStage: (questId, stage) =>
      gameStateManager.canStartQuestStage(questId, stage),
    checkQuestObjectives: (questId) =>
      gameStateManager.checkQuestObjectives(questId),
    hasClaimedStageRewards: (questId) =>
      gameStateManager.hasClaimedStageRewards(questId),

    // Action callbacks (bound to npcId where appropriate)
    requestLoan: () => gameStateManager.requestLoan(npcId),
    storeCargo: () => gameStateManager.storeCargo(npcId),
    repayLoan: () => gameStateManager.repayLoan(npcId),
    retrieveCargo: () => gameStateManager.retrieveCargo(npcId),
    advanceQuest: (questId) => gameStateManager.advanceQuest(questId),
    claimStageRewards: (questId) => gameStateManager.claimStageRewards(questId),
    startPavonisRun: () => gameStateManager.startPavonisRun(),
    updateQuestData: (...args) => gameStateManager.updateQuestData(...args),
    modifyColeRep: (...args) => gameStateManager.modifyColeRep(...args),
    contributeSupply: () => gameStateManager.contributeSupply(),
    canContributeSupply: () => gameStateManager.canContributeSupply(),
  };
}

/**
 * Validates NPC ID and returns NPC data
 *
 * Ensures the provided NPC ID exists in the NPC data definitions.
 * Used internally by dialogue functions to validate NPC references.
 *
 * @param {string} npcId - NPC identifier to validate (e.g., 'chen_barnards', 'whisper_sirius')
 * @returns {Object} NPC data object containing id, name, role, station, and other properties
 * @throws {Error} If NPC ID is invalid or not found in ALL_NPCS
 */
function validateNPCId(npcId) {
  const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
  if (!npcData) {
    throw new Error(`Unknown NPC ID: ${npcId}`);
  }
  return npcData;
}

/**
 * Display dialogue node with filtered choices
 *
 * Shows NPC dialogue text and available player response choices. Text functions
 * are evaluated with current reputation. Choices are filtered based on condition
 * functions. Uses initialRep for uninitialized NPCs.
 *
 * Special handling for tip nodes: When nodeId is 'ask_tip', retrieves actual tip
 * content using getTip() and displays it in the dialogue text.
 *
 * @param {string} npcId - NPC identifier (e.g., 'chen_barnards', 'whisper_sirius')
 * @param {string} [nodeId='greeting'] - Dialogue node identifier within the NPC's dialogue tree
 * @param {GameStateManager} gameStateManager - Game state manager instance for reputation and state access
 * @returns {Object} Dialogue display object with the following properties:
 *   - npcId: string - The NPC identifier
 *   - npcName: string - Display name of the NPC
 *   - npcRole: string - Role/title of the NPC
 *   - npcStation: string - Station where NPC is located
 *   - reputationTier: string - Current reputation tier with this NPC
 *   - text: string - Dialogue text to display (may include dynamic content)
 *   - choices: Array<Object> - Available dialogue choices with index, text, next, and repGain
 * @throws {Error} If NPC ID or dialogue node is invalid
 */
export function showDialogue(npcId, nodeId = 'greeting', gameStateManager) {
  // Validate NPC ID exists in NPC data
  const npcData = validateNPCId(npcId);

  // Get dialogue tree for this NPC
  const dialogueTree = ALL_DIALOGUE_TREES[npcId];
  if (!dialogueTree) {
    throw new Error(`No dialogue tree found for NPC: ${npcId}`);
  }

  // Validate dialogue node exists
  const dialogueNode = dialogueTree[nodeId];
  if (!dialogueNode) {
    throw new Error(`Unknown dialogue node: ${nodeId} for NPC: ${npcId}`);
  }

  // Store current dialogue state in GameStateManager
  gameStateManager.setDialogueState(npcId, nodeId);

  // Get current reputation (getNPCState handles initialization with initialRep)
  const npcState = gameStateManager.getNPCState(npcId);
  const currentRep = npcState.rep;

  // Build context for dialogue data file functions
  const context = buildDialogueContext(gameStateManager, npcId);

  // Generate dialogue text (evaluate function if needed)
  let dialogueText =
    typeof dialogueNode.text === 'function'
      ? dialogueNode.text(currentRep, context)
      : dialogueNode.text;

  // Special handling for tip nodes - append actual tip content
  if (nodeId === TIP_NODE_ID) {
    const tip = gameStateManager.getTip(npcId);
    if (tip) {
      dialogueText += `\n\n"${tip}"`;
    } else {
      // This shouldn't happen if dialogue conditions are correct, but handle gracefully
      dialogueText += `\n\nActually, I don't have any tips for you right now.`;
    }
  }

  // Filter choices based on condition functions
  const availableChoices = [];
  for (let i = 0; i < dialogueNode.choices.length; i++) {
    const choice = dialogueNode.choices[i];
    let isVisible;

    // Check condition function if present
    if (choice.condition) {
      try {
        // Pass both reputation and context for more complex conditions
        isVisible = choice.condition(currentRep, context);
      } catch (error) {
        // Log error and hide choice if condition function throws
        console.error(
          `Error in condition function for choice ${i} in node ${nodeId} for NPC ${npcId}:`,
          error
        );
        isVisible = false;
      }
    } else {
      isVisible = true;
    }

    if (isVisible) {
      availableChoices.push({
        index: i,
        text: choice.text,
        next: choice.next,
        repGain: choice.repGain || 0,
      });
    }
  }

  // Add story flags to NPC state before displaying (if node has flags)
  if (dialogueNode.flags && dialogueNode.flags.length > 0) {
    for (const flag of dialogueNode.flags) {
      if (!npcState.flags.includes(flag)) {
        npcState.flags.push(flag);
      }
    }
  }

  return {
    npcId,
    npcName: npcData.name,
    npcRole: npcData.role,
    npcStation: npcData.station,
    reputationTier: gameStateManager.getRepTier(currentRep),
    text: dialogueText,
    choices: availableChoices,
  };
}

/**
 * Process player choice and advance dialogue
 *
 * Applies reputation gains before advancing to next node. Adds story flags
 * to NPC state before navigation. Closes dialogue when choice has no next node.
 * Executes any action functions associated with the choice (e.g., loan requests).
 *
 * @param {string} npcId - NPC identifier (e.g., 'chen_barnards', 'whisper_sirius')
 * @param {number} choiceIndex - Index of selected choice from the current dialogue node's choices array
 * @param {GameStateManager} gameStateManager - Game state manager instance for state modifications
 * @returns {Object|null} Next dialogue display object (same format as showDialogue) or null if dialogue ends
 * @throws {Error} If NPC ID is invalid or choice index is out of bounds
 */
export function selectChoice(npcId, choiceIndex, gameStateManager) {
  // Validate NPC ID exists in NPC data
  validateNPCId(npcId);

  // Get dialogue tree for this NPC
  const dialogueTree = ALL_DIALOGUE_TREES[npcId];
  if (!dialogueTree) {
    throw new Error(`No dialogue tree found for NPC: ${npcId}`);
  }

  // Use current dialogue state if available, otherwise default to greeting
  const dialogueState = gameStateManager.getDialogueState();
  let currentNodeId;
  if (dialogueState.isActive && dialogueState.currentNpcId === npcId) {
    currentNodeId = dialogueState.currentNodeId;
  } else {
    currentNodeId = 'greeting'; // Default to greeting if no current state
  }

  // Get current dialogue node
  const currentNode = dialogueTree[currentNodeId];
  if (!currentNode) {
    throw new Error(
      `Unknown dialogue node: ${currentNodeId} for NPC: ${npcId}`
    );
  }

  // Validate choice index
  if (choiceIndex < 0 || choiceIndex >= currentNode.choices.length) {
    throw new Error(
      `Invalid choice index: ${choiceIndex} for node ${currentNodeId} in NPC ${npcId}`
    );
  }

  const selectedChoice = currentNode.choices[choiceIndex];

  // Build context for dialogue data file functions
  const context = buildDialogueContext(gameStateManager, npcId);

  // Execute action if present
  if (selectedChoice.action && typeof selectedChoice.action === 'function') {
    try {
      const actionResult = selectedChoice.action(context);

      // Handle action results that indicate failure
      if (
        actionResult &&
        typeof actionResult === 'object' &&
        actionResult.success === false
      ) {
        // Action failed - the action should have already provided user feedback
        // Log for debugging but continue with dialogue flow
        console.warn(
          `Dialogue action failed for choice ${choiceIndex} in node ${currentNodeId} for NPC ${npcId}:`,
          actionResult.message || 'Unknown error'
        );
      }
    } catch (error) {
      // Unexpected error in action execution
      console.error(
        `Error executing dialogue action for choice ${choiceIndex} in node ${currentNodeId} for NPC ${npcId}:`,
        error
      );

      // Provide user feedback for unexpected errors
      // Note: In a full implementation, this would use the notification system
      // For now, we'll let the dialogue continue but log the error
      console.warn(
        'An unexpected error occurred while processing your request. Please try again.'
      );
    }
  }

  // Apply reputation gain before advancing to next node
  if (selectedChoice.repGain && selectedChoice.repGain !== 0) {
    gameStateManager.modifyRep(
      npcId,
      selectedChoice.repGain,
      'dialogue_choice'
    );
  }

  // Close dialogue if choice has no next node
  if (!selectedChoice.next) {
    // Clear dialogue state in GameStateManager
    gameStateManager.clearDialogueState();
    return null;
  }

  // Advance to next dialogue node
  return showDialogue(npcId, selectedChoice.next, gameStateManager);
}
