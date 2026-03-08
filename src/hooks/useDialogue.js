import { useCallback } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { useGameEvent } from './useGameEvent.js';
import { EVENT_NAMES } from '../game/constants.js';

/**
 * Custom hook for dialogue system interactions.
 *
 * This hook implements the Bridge Pattern for dialogue management by:
 * 1. Subscribing to dialogue state changes via useGameEvent
 * 2. Providing dialogue actions that handle async complexity internally
 * 3. Ensuring React components never directly call GameStateManager methods
 *
 * The hook encapsulates the async nature of dialogue operations while maintaining
 * the Bridge Pattern's separation between imperative game logic and declarative UI.
 *
 * @returns {Object} Dialogue state and actions
 *
 * @example
 * function DialoguePanel() {
 *   const { dialogueState, startDialogue, selectChoice, clearDialogue } = useDialogue();
 *
 *   const handleStartConversation = async () => {
 *     await startDialogue('wei_chen');
 *   };
 *
 *   return (
 *     <div>
 *       {dialogueState.isActive && (
 *         <div>{dialogueState.display.text}</div>
 *       )}
 *     </div>
 *   );
 * }
 */
export function useDialogue() {
  const game = useGameState();
  const dialogueState = useGameEvent(EVENT_NAMES.DIALOGUE_CHANGED);

  /**
   * Start dialogue with an NPC
   *
   * Handles the async complexity of dialogue initialization while maintaining
   * Bridge Pattern integrity. The dialogue state updates are handled through
   * the event system, not through the return value.
   *
   * @param {string} npcId - NPC identifier
   * @param {string} nodeId - Dialogue node identifier (defaults to 'greeting')
   * @returns {Promise<boolean>} Success status (true if dialogue started)
   */
  const startDialogue = useCallback(
    async (npcId, nodeId = 'greeting') => {
      try {
        // Call the GameStateManager public API method
        await game.startDialogue(npcId, nodeId);
        return true;
      } catch (error) {
        console.error('Failed to start dialogue:', error);
        return false;
      }
    },
    [game]
  );

  /**
   * Select a dialogue choice and advance conversation
   *
   * Handles the async complexity of dialogue progression while maintaining
   * Bridge Pattern integrity. The dialogue state updates are handled through
   * the event system, not through the return value.
   *
   * @param {string} npcId - NPC identifier
   * @param {number} choiceIndex - Index of selected choice
   * @returns {Promise<boolean>} Success status (true if choice processed)
   */
  const selectChoice = useCallback(
    async (npcId, choiceIndex) => {
      try {
        // Call the GameStateManager public API method
        await game.selectDialogueChoice(npcId, choiceIndex);
        return true;
      } catch (error) {
        console.error('Failed to select dialogue choice:', error);
        return false;
      }
    },
    [game]
  );

  /**
   * Clear current dialogue state
   *
   * Immediately clears the dialogue state and updates UI through event system.
   */
  const clearDialogue = useCallback(() => {
    game.clearDialogueState();
  }, [game]);

  return {
    dialogueState,
    startDialogue,
    selectChoice,
    clearDialogue,
  };
}
