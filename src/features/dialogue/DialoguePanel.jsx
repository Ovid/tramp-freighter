import { useEffect } from 'react';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';

/**
 * DialoguePanel - React component for NPC dialogue interactions
 *
 * Displays NPC information, dialogue text, and numbered choice list.
 * Handles choice selection and dialogue advancement through the Bridge Pattern.
 * Uses GameStateManager as single source of truth for dialogue state.
 *
 * NPC Foundation Spec: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 *
 * @param {Object} props
 * @param {string} props.npcId - NPC identifier to start dialogue with
 * @param {Function} props.onClose - Callback to close the dialogue panel
 */
export function DialoguePanel({ npcId, onClose }) {
  // Bridge Pattern: Subscribe to dialogue state changes
  const dialogueState = useGameEvent('dialogueChanged');

  // Bridge Pattern: Get action methods
  const { startDialogue, selectDialogueChoice, clearDialogue } =
    useGameAction();

  // Initialize dialogue when component mounts or npcId changes
  useEffect(() => {
    if (!npcId) {
      return;
    }

    const initializeDialogue = async () => {
      try {
        // Start dialogue with greeting node using Bridge Pattern
        await startDialogue(npcId, 'greeting');
      } catch (err) {
        console.error('Failed to initialize dialogue:', err);
        // Clear dialogue state on error
        clearDialogue();
      }
    };

    initializeDialogue();
  }, [npcId, startDialogue, clearDialogue]);

  const handleChoiceSelection = async (choiceIndex) => {
    if (!dialogueState?.display || !npcId) return;

    try {
      // Process choice selection through Bridge Pattern
      const nextDisplay = await selectDialogueChoice(npcId, choiceIndex);

      if (!nextDisplay) {
        // Dialogue ended, close panel
        onClose();
      }
      // If nextDisplay exists, the dialogueChanged event will trigger re-render
    } catch (err) {
      console.error('Failed to process dialogue choice:', err);
      // Clear dialogue state on error
      clearDialogue();
    }
  };

  const handleClose = () => {
    // Clear dialogue state when manually closing
    clearDialogue();
    onClose();
  };

  // Loading state - dialogue not yet initialized
  if (!dialogueState || !dialogueState.isActive || !dialogueState.display) {
    return (
      <div className="dialogue-panel visible">
        <button
          className="close-btn"
          onClick={handleClose}
          aria-label="Close dialogue"
        >
          ×
        </button>
        <div className="dialogue-loading">Loading dialogue...</div>
      </div>
    );
  }

  const dialogueDisplay = dialogueState.display;

  return (
    <div className="dialogue-panel visible">
      <button
        className="close-btn"
        onClick={handleClose}
        aria-label="Close dialogue"
      >
        ×
      </button>

      {/* NPC Header with name, role, station, and reputation tier */}
      <div className="dialogue-header">
        <h2 className="npc-name">{dialogueDisplay.npcName}</h2>
        <div className="npc-info">
          <span className="npc-role">{dialogueDisplay.npcRole}</span>
          <span className="npc-station">{dialogueDisplay.npcStation}</span>
          <span
            className={`reputation-tier tier-${dialogueDisplay.reputationTier.name.toLowerCase()}`}
          >
            {dialogueDisplay.reputationTier.name}
          </span>
        </div>
      </div>

      {/* Dialogue Content */}
      <div className="dialogue-content">
        {/* NPC Dialogue Text */}
        <div className="dialogue-text">
          <p>{dialogueDisplay.text}</p>
        </div>

        {/* Player Response Choices */}
        <div className="dialogue-choices">
          <h3>Your Response:</h3>
          <div className="choices-list">
            {dialogueDisplay.choices.map((choice, index) => (
              <button
                key={choice.index}
                className="choice-btn"
                onClick={() => handleChoiceSelection(choice.index)}
              >
                <span className="choice-number">{index + 1}.</span>
                <span className="choice-text">{choice.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
