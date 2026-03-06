import { useEffect, useRef } from 'react';
import { useDialogue } from '../../hooks/useDialogue';

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
  // Bridge Pattern: Use dialogue hook for state and actions
  const { dialogueState, startDialogue, selectChoice, clearDialogue } =
    useDialogue();

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
        clearDialogue();
        onClose();
      }
    };

    initializeDialogue();
  }, [npcId, startDialogue, clearDialogue, onClose]);

  const handleChoiceSelection = async (choiceIndex) => {
    if (!dialogueState.display || !npcId) return;

    try {
      // Process choice selection through Bridge Pattern
      const success = await selectChoice(npcId, choiceIndex);

      if (!success) {
        // Error occurred, clear dialogue state and close panel
        clearDialogue();
        onClose();
      }
      // If successful, the dialogueChanged event will trigger re-render
      // If dialogue ended, the dialogueState.isActive will become false
    } catch (err) {
      console.error('Failed to process dialogue choice:', err);
      // Clear dialogue state and close panel on error
      clearDialogue();
      onClose();
    }
  };

  const handleClose = () => {
    // Clear dialogue state when manually closing
    clearDialogue();
    onClose();
  };

  // Track if dialogue was ever active (to distinguish "ended" from "not started yet")
  const wasActiveRef = useRef(false);

  // Update the ref when dialogue becomes active
  useEffect(() => {
    if (dialogueState.isActive) {
      wasActiveRef.current = true;
    }
  }, [dialogueState.isActive]);

  // Auto-close panel when dialogue ends (was active, now inactive)
  useEffect(() => {
    if (
      wasActiveRef.current &&
      !dialogueState.isActive &&
      dialogueState.display === null
    ) {
      wasActiveRef.current = false; // Reset for next time
      onClose();
    }
  }, [dialogueState.isActive, dialogueState.display, onClose]);

  // Loading state - dialogue not yet initialized
  if (!dialogueState.isActive || !dialogueState.display) {
    return (
      <div className="dialogue-panel visible">
        <button className="close-btn" onClick={handleClose} aria-label="Close">
          ×
        </button>
        <div className="dialogue-loading">Loading dialogue...</div>
      </div>
    );
  }

  const dialogueDisplay = dialogueState.display;

  return (
    <div className="dialogue-panel visible">
      <button className="close-btn" onClick={handleClose} aria-label="Close">
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

      {/* Quest Progress (Tanaka and other quest NPCs) */}
      {dialogueDisplay.questProgress &&
        dialogueDisplay.questProgress.nextRepThreshold !== null && (
          <div className="quest-progress">
            <div className="quest-progress-label">
              Trust: {dialogueDisplay.questProgress.currentRep} /{' '}
              {dialogueDisplay.questProgress.nextRepThreshold}
              <span className="quest-stage-name">
                {' '}
                (Next: {dialogueDisplay.questProgress.stageName})
              </span>
            </div>
            <div
              className="quest-progress-bar"
              role="progressbar"
              aria-valuenow={Math.min(
                dialogueDisplay.questProgress.currentRep,
                dialogueDisplay.questProgress.nextRepThreshold
              )}
              aria-valuemin={0}
              aria-valuemax={dialogueDisplay.questProgress.nextRepThreshold}
              aria-label="Quest progress"
            >
              <div
                className="quest-progress-fill"
                style={{
                  width: `${Math.min(100, (dialogueDisplay.questProgress.currentRep / dialogueDisplay.questProgress.nextRepThreshold) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

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
