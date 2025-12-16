import { useState, useEffect } from 'react';
import { useGameState } from '../../context/GameContext';
import { useGameEvent } from '../../hooks/useGameEvent';
import { useGameAction } from '../../hooks/useGameAction';
import { showDialogue, selectChoice } from '../../game/game-dialogue.js';

/**
 * DialoguePanel - React component for NPC dialogue interactions
 *
 * Displays NPC information, dialogue text, and numbered choice list.
 * Handles choice selection and dialogue advancement through the dialogue engine.
 * Closes dialogue when choice has no next node.
 *
 * NPC Foundation Spec: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 *
 * @param {Object} props
 * @param {string} props.npcId - NPC identifier to start dialogue with
 * @param {Function} props.onClose - Callback to close the dialogue panel
 */
export function DialoguePanel({ npcId, onClose }) {
  // Access GameStateManager
  const gameStateManager = useGameState();

  // Note: We don't subscribe to reputation changes since that event doesn't exist yet
  // The dialogue will update when choices are made through the dialogue engine

  // Local state for current dialogue display
  const [dialogueDisplay, setDialogueDisplay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize dialogue when component mounts or npcId changes
  useEffect(() => {
    if (!npcId) {
      setError('No NPC specified for dialogue');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Start dialogue with greeting node
      const display = showDialogue(npcId, 'greeting', gameStateManager);
      setDialogueDisplay(display);
    } catch (err) {
      console.error('Failed to initialize dialogue:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [npcId, gameStateManager]);

  // Note: Removed reputation change effect since reputationChanged event doesn't exist
  // Dialogue updates happen through choice selection which triggers new dialogue display

  const handleChoiceSelection = (choiceIndex) => {
    if (!dialogueDisplay || !npcId) return;

    try {
      setError(null);
      
      // Process choice selection through dialogue engine
      const nextDisplay = selectChoice(npcId, choiceIndex, gameStateManager);
      
      if (nextDisplay) {
        // Continue dialogue with next node
        setDialogueDisplay(nextDisplay);
      } else {
        // Dialogue ended, close panel
        onClose();
      }
    } catch (err) {
      console.error('Failed to process dialogue choice:', err);
      setError(err.message);
    }
  };

  const handleClose = () => {
    // Clear dialogue state when manually closing
    try {
      gameStateManager.clearDialogueState();
    } catch (err) {
      console.error('Failed to clear dialogue state:', err);
    }
    onClose();
  };

  if (isLoading) {
    return (
      <div id="dialogue-panel" className="visible">
        <button className="close-btn" onClick={handleClose}>×</button>
        <div className="dialogue-loading">Loading dialogue...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="dialogue-panel" className="visible">
        <button className="close-btn" onClick={handleClose}>×</button>
        <div className="dialogue-error">
          <h3>Dialogue Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!dialogueDisplay) {
    return (
      <div id="dialogue-panel" className="visible">
        <button className="close-btn" onClick={handleClose}>×</button>
        <div className="dialogue-error">
          <h3>No Dialogue Available</h3>
          <p>Unable to load dialogue for this NPC.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="dialogue-panel" className="visible">
      <button className="close-btn" onClick={handleClose}>×</button>
      
      {/* NPC Header with name, role, station, and reputation tier */}
      <div className="dialogue-header">
        <h2 className="npc-name">{dialogueDisplay.npcName}</h2>
        <div className="npc-info">
          <span className="npc-role">{dialogueDisplay.npcRole}</span>
          <span className="npc-station">{dialogueDisplay.npcStation}</span>
          <span className={`reputation-tier tier-${dialogueDisplay.reputationTier.name.toLowerCase()}`}>
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