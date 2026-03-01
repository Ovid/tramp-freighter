import { useState, useEffect } from 'react';
import { useGameAction } from '../../hooks/useGameAction';
import { useGameEvent } from '../../hooks/useGameEvent';
import { EVENT_NAMES } from '../../game/constants.js';

function getSatisfactionLabel(satisfaction) {
  if (satisfaction >= 80) return 'Very Satisfied';
  if (satisfaction >= 60) return 'Satisfied';
  if (satisfaction >= 40) return 'Neutral';
  if (satisfaction >= 20) return 'Dissatisfied';
  return 'Very Dissatisfied';
}

export function MissionCompleteNotifier() {
  const { completeMission, getCompletableMissions } = useGameAction();
  const missions = useGameEvent(EVENT_NAMES.MISSIONS_CHANGED);
  const [completable, setCompletable] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const found = getCompletableMissions();
    setCompletable(found);
    setCurrentIndex(0);
  }, [missions, getCompletableMissions]);

  const current = completable[currentIndex];
  if (!current) return null;

  const handleComplete = () => {
    completeMission(current.id);
    const nextIndex = currentIndex + 1;
    if (nextIndex < completable.length) {
      setCurrentIndex(nextIndex);
    } else {
      setCompletable([]);
    }
  };

  const handleDismiss = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < completable.length) {
      setCurrentIndex(nextIndex);
    } else {
      setCompletable([]);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <h2 className="modal-title">Mission Complete!</h2>
        <div className="mission-complete-body">
          <p className="mission-complete-title">{current.title}</p>
          {current.type === 'passenger' && current.passenger && (
            <div className="passenger-delivery-info">
              <p>{current.passenger.name} disembarks.</p>
              <div className="passenger-satisfaction">
                Satisfaction: {current.passenger.satisfaction}% (
                {getSatisfactionLabel(current.passenger.satisfaction)})
              </div>
            </div>
          )}
          {current.rewards && (
            <div className="mission-complete-rewards">
              <h4>Rewards:</h4>
              {current.rewards.credits && <div>₡{current.rewards.credits}</div>}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="modal-cancel" onClick={handleDismiss}>
            Dismiss
          </button>
          <button className="modal-confirm" onClick={handleComplete}>
            Complete
          </button>
        </div>
      </div>
    </div>
  );
}
