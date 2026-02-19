import { useState, useEffect } from 'react';
import { useGameAction } from '../../hooks/useGameAction';

export function MissionCompleteNotifier() {
  const { completeMission, getCompletableMissions } = useGameAction();
  const [completable, setCompletable] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const missions = getCompletableMissions();
    setCompletable(missions);
    setCurrentIndex(0);
  }, [getCompletableMissions]);

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
          {current.rewards && (
            <div className="mission-complete-rewards">
              <h4>Rewards:</h4>
              {current.rewards.credits && (
                <div>₡{current.rewards.credits}</div>
              )}
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
