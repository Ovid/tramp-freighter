import { useState, useCallback } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { useNotificationContext } from '../../context/NotificationContext.jsx';
import { applyEncounterOutcome } from '../danger/applyEncounterOutcome.js';
import '../../../css/panel/narrative-event.css';

/**
 * NarrativeEventPanel — displays narrative events with text and choices.
 *
 * Handles event chains: when a choice has `next`, fetches the chained
 * event and re-renders without leaving the panel.
 *
 * @param {Object} props
 * @param {Object} props.event - Narrative event object from EventEngine
 * @param {Function} props.onClose - Called when event is dismissed
 */
export function NarrativeEventPanel({ event, onClose }) {
  const game = useGame();
  const notificationCtx = useNotificationContext();
  const [currentEvent, setCurrentEvent] = useState(event);

  const handleChoice = useCallback(
    (choice) => {
      // Apply effects if any
      if (choice.effects) {
        const hasEffects =
          (choice.effects.costs &&
            Object.keys(choice.effects.costs).length > 0) ||
          (choice.effects.rewards &&
            Object.keys(choice.effects.rewards).length > 0);

        if (hasEffects) {
          const result = applyEncounterOutcome(game, choice.effects);
          if (result.salvageMessages.length > 0 && notificationCtx) {
            result.salvageMessages.forEach((msg) =>
              notificationCtx.showInfo(msg)
            );
          }
        }
      }

      // Apply flags from choice if specified
      if (choice.flags) {
        choice.flags.forEach((flag) => game.setNarrativeFlag(flag));
      }

      // Mark event as fired and set cooldown
      game.markEventFired(currentEvent.id);
      if (currentEvent.cooldown) {
        game.setEventCooldown(currentEvent.id, currentEvent.cooldown);
      }

      // Persist narrative event state (fired, cooldowns, flags)
      game.markDirty();

      // Chain to next event if specified
      if (choice.next) {
        const nextEvent = game.getEventById(choice.next);
        if (nextEvent) {
          setCurrentEvent(nextEvent);
          return;
        }
      }

      // No chain — close the panel
      onClose();
    },
    [game, currentEvent, onClose, notificationCtx]
  );

  const { content } = currentEvent;

  return (
    <div
      id="narrative-event-panel"
      className="centered-panel visible"
      data-panel
      role="dialog"
      aria-modal="true"
      aria-label="Narrative event"
    >
      {content.speaker && (
        <div className="event-speaker">{content.speaker}</div>
      )}
      <div className="event-text">
        {content.text.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
      <div className="event-choices">
        {content.choices.map((choice, i) => (
          <button
            key={i}
            className="event-choice-btn"
            onClick={() => handleChoice(choice)}
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
