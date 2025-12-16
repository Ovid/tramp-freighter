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

/**
 * Display dialogue node with filtered choices
 *
 * Shows NPC dialogue text and available player response choices. Text functions
 * are evaluated with current reputation. Choices are filtered based on condition
 * functions. Uses initialRep for uninitialized NPCs.
 *
 * @param {string} npcId - NPC identifier
 * @param {string} nodeId - Dialogue node identifier (defaults to 'greeting')
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {Object} Dialogue display object with text, choices, and NPC info
 * @throws {Error} If NPC ID or dialogue node is invalid
 */
export function showDialogue(npcId, nodeId = 'greeting', gameStateManager) {
  // Validate NPC ID exists in NPC data
  const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
  if (!npcData) {
    throw new Error(`Unknown NPC ID: ${npcId}`);
  }

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

  // Generate dialogue text (evaluate function if needed)
  const dialogueText =
    typeof dialogueNode.text === 'function'
      ? dialogueNode.text(currentRep)
      : dialogueNode.text;

  // Filter choices based on condition functions
  const availableChoices = [];
  for (let i = 0; i < dialogueNode.choices.length; i++) {
    const choice = dialogueNode.choices[i];
    let isVisible;

    // Check condition function if present
    if (choice.condition) {
      try {
        isVisible = choice.condition(currentRep);
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
 *
 * @param {string} npcId - NPC identifier
 * @param {number} choiceIndex - Index of selected choice
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {Object|null} Next dialogue display object or null if dialogue ends
 * @throws {Error} If NPC ID is invalid or choice index is out of bounds
 */
export function selectChoice(npcId, choiceIndex, gameStateManager) {
  // Validate NPC ID exists in NPC data
  const npcData = ALL_NPCS.find((npc) => npc.id === npcId);
  if (!npcData) {
    throw new Error(`Unknown NPC ID: ${npcId}`);
  }

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

/**
 * Get current dialogue state
 *
 * Returns the current active dialogue session information.
 * Used by UI components to track dialogue state.
 *
 * @param {GameStateManager} gameStateManager - Game state manager instance
 * @returns {Object} Current dialogue state object
 */
export function getCurrentDialogue(gameStateManager) {
  return gameStateManager.getDialogueState();
}

/**
 * Clear current dialogue state
 *
 * Resets the dialogue engine state. Called when dialogue is closed
 * or when starting a new dialogue session.
 *
 * @param {GameStateManager} gameStateManager - Game state manager instance
 */
export function clearDialogue(gameStateManager) {
  gameStateManager.clearDialogueState();
}
