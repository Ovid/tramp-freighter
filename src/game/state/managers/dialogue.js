/**
 * DialogueManager - Manages dialogue state and interactions
 *
 * Handles dialogue state management including setting current dialogue context,
 * starting conversations with NPCs, and processing player choices. Integrates
 * with the dialogue engine for conversation flow and NPC interactions.
 *
 * Responsibilities:
 * - Maintain current dialogue state (NPC, node, active status)
 * - Start and manage dialogue sessions
 * - Process dialogue choice selections
 * - Emit dialogue state change events
 * - Coordinate with dialogue engine for conversation flow
 */

import { BaseManager } from './base-manager.js';
import { EVENT_NAMES } from '../../constants.js';

export class DialogueManager extends BaseManager {
  /**
   * Set current dialogue state
   *
   * Updates the dialogue state with the current NPC and dialogue node.
   * Used internally by the dialogue system to track conversation progress.
   *
   * @param {string} npcId - NPC identifier
   * @param {string} nodeId - Dialogue node identifier
   */
  setDialogueState(npcId, nodeId) {
    this.validateState();

    const dialogue = this.capabilities.getOwnState();
    dialogue.currentNpcId = npcId;
    dialogue.currentNodeId = nodeId;
    dialogue.isActive = true;

    this.capabilities.emit(EVENT_NAMES.DIALOGUE_CHANGED, { ...dialogue });
  }

  /**
   * Get current dialogue state
   *
   * Returns a copy of the current dialogue state including active status,
   * current NPC, node, and display information.
   *
   * @returns {Object} Current dialogue state
   */
  getDialogueState() {
    this.validateState();

    const dialogue = this.capabilities.getOwnState();
    return { ...dialogue };
  }

  /**
   * Clear dialogue state
   *
   * Resets all dialogue state fields to their default values and marks
   * dialogue as inactive. Called when conversations end or are interrupted.
   */
  clearDialogueState() {
    this.validateState();

    const dialogue = this.capabilities.getOwnState();
    dialogue.currentNpcId = null;
    dialogue.currentNodeId = null;
    dialogue.isActive = false;
    dialogue.display = null;

    this.capabilities.emit(EVENT_NAMES.DIALOGUE_CHANGED, { ...dialogue });
  }

  /**
   * Start dialogue with an NPC
   *
   * Initiates a conversation with the specified NPC at the given dialogue node.
   * Uses dynamic import to load the dialogue engine and avoid circular dependencies.
   * Updates dialogue state and returns the dialogue display object.
   *
   * @param {string} npcId - NPC identifier
   * @param {string} nodeId - Dialogue node identifier (defaults to 'greeting')
   * @returns {Promise<Object>} Dialogue display object with text, choices, and NPC info
   */
  async startDialogue(npcId, nodeId = 'greeting') {
    this.validateState();

    const { showDialogue } = await import('../../game-dialogue.js');

    const dialogueDisplay = showDialogue(
      npcId,
      nodeId,
      this.capabilities.coordinatorRef
    );

    const dialogue = this.capabilities.getOwnState();
    dialogue.currentNpcId = npcId;
    dialogue.currentNodeId = nodeId;
    dialogue.isActive = true;
    dialogue.display = dialogueDisplay;

    this.capabilities.emit(EVENT_NAMES.DIALOGUE_CHANGED, { ...dialogue });

    return dialogueDisplay;
  }

  /**
   * Select a dialogue choice and advance conversation
   *
   * Processes the player's choice selection and advances the conversation.
   * Uses dynamic import to load the dialogue engine. Returns the next dialogue
   * display object or null if the conversation has ended.
   *
   * @param {string} npcId - NPC identifier
   * @param {number} choiceIndex - Index of selected choice
   * @returns {Promise<Object|null>} Next dialogue display object or null if dialogue ended
   */
  async selectDialogueChoice(npcId, choiceIndex) {
    this.validateState();

    const { selectChoice } = await import('../../game-dialogue.js');

    const nextDisplay = selectChoice(
      npcId,
      choiceIndex,
      this.capabilities.coordinatorRef
    );

    const dialogue = this.capabilities.getOwnState();

    if (nextDisplay) {
      dialogue.currentNpcId = npcId;
      dialogue.currentNodeId =
        nextDisplay.currentNodeId || dialogue.currentNodeId;
      dialogue.isActive = true;
      dialogue.display = nextDisplay;

      this.capabilities.emit(EVENT_NAMES.DIALOGUE_CHANGED, { ...dialogue });

      return nextDisplay;
    } else {
      dialogue.currentNpcId = null;
      dialogue.currentNodeId = null;
      dialogue.isActive = false;
      dialogue.display = null;

      this.capabilities.emit(EVENT_NAMES.DIALOGUE_CHANGED, { ...dialogue });

      return null;
    }
  }
}
