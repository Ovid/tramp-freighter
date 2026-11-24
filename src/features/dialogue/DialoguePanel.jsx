import { useEffect, useRef, useState } from 'react';
import { useDialogue } from '../../hooks/useDialogue';
import { useNotificationContext } from '../../context/NotificationContext.jsx';
import { Modal } from '../../components/Modal.jsx';
import { CargoStoragePicker } from '../cargo-storage/CargoStoragePicker.jsx';

// selectChoice returns no message when the call throws
const PICKER_FALLBACK_ERROR = 'Something went wrong. Please try again.';

/**
 * DialoguePanel - React component for NPC dialogue interactions
 *
 * Displays NPC information, dialogue text, and numbered choice list.
 * Handles choice selection and dialogue advancement through the Bridge Pattern.
 * Uses GameCoordinator as single source of truth for dialogue state.
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
  // Null-safe: tests and some trees render without NotificationProvider
  const notificationCtx = useNotificationContext();
  // { mode, choiceIndex } while the storage picker is open
  const [picker, setPicker] = useState(null);
  const [pickerError, setPickerError] = useState(null);

  // Initialize dialogue when component mounts or npcId changes
  useEffect(() => {
    // A restarted dialogue invalidates the open picker's choiceIndex
    setPicker(null);
    setPickerError(null);

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

  const handleChoiceSelection = async (choice) => {
    if (!dialogueState.display || !npcId) return;

    // Picker choices only run once the player confirms selections, so
    // opening the picker must not advance the dialogue or grant reputation
    if (choice.picker) {
      setPickerError(null);
      setPicker({ mode: choice.picker, choiceIndex: choice.index });
      return;
    }

    try {
      // Process choice selection through Bridge Pattern
      const result = await selectChoice(npcId, choice.index);

      if (!result.success) {
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

  // The node can't change while the modal is open, so choiceIndex stays valid
  const handlePickerConfirm = async (selections) => {
    const result = await selectChoice(npcId, picker.choiceIndex, {
      selections,
    });
    if (!result.success) {
      setPickerError(result.message || PICKER_FALLBACK_ERROR);
      return;
    }
    notificationCtx?.showSuccess(result.message);
    setPicker(null);
  };

  const handlePickerCancel = () => {
    setPicker(null);
    setPickerError(null);
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
  // Keep panel hidden (no 'visible' class) until data arrives so the
  // dialogueFadeIn animation fires on the full-content panel, avoiding
  // a positional jump from the small loading content to the taller dialogue.
  if (!dialogueState.isActive || !dialogueState.display) {
    return (
      <div className="dialogue-panel">
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
      {dialogueDisplay.questProgress && (
        <div className="quest-progress">
          <div className="quest-progress-label">
            Trust: {dialogueDisplay.questProgress.currentRep} / 100
            {dialogueDisplay.questProgress.nextRepThreshold !== null && (
              <span className="quest-stage-name">
                {dialogueDisplay.questProgress.currentRep >=
                dialogueDisplay.questProgress.nextRepThreshold
                  ? dialogueDisplay.questProgress.allRequirementsMet
                    ? ' (Ready!)'
                    : ` (${dialogueDisplay.reputationTier.name})`
                  : ` (Next: ${dialogueDisplay.questProgress.stageName} at ${dialogueDisplay.questProgress.nextRepThreshold})`}
              </span>
            )}
          </div>
          <div
            className="quest-progress-bar"
            role="progressbar"
            aria-valuenow={Math.max(
              0,
              dialogueDisplay.questProgress.currentRep
            )}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Quest progress"
          >
            <div
              className="quest-progress-fill"
              style={{
                width: `${Math.max(0, Math.min(100, dialogueDisplay.questProgress.currentRep))}%`,
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
                onClick={() => handleChoiceSelection(choice)}
              >
                <span className="choice-number">{index + 1}.</span>
                <span className="choice-text">{choice.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={picker !== null}
        onClose={handlePickerCancel}
        title={
          picker?.mode === 'store'
            ? `Store cargo with ${dialogueDisplay.npcName}`
            : `Retrieve cargo from ${dialogueDisplay.npcName}`
        }
      >
        {pickerError && (
          <div className="validation-message error" role="alert">
            {pickerError}
          </div>
        )}
        {picker && (
          <CargoStoragePicker
            mode={picker.mode}
            npcId={npcId}
            npcName={dialogueDisplay.npcName}
            onConfirm={handlePickerConfirm}
            onCancel={handlePickerCancel}
          />
        )}
      </Modal>
    </div>
  );
}
